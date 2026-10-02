# Edge Services (HTTPS for cecile.t4sty.it)

Terraform that fronts the `cecile.t4sty.it` Object Storage bucket with a
Scaleway **Edge Services** pipeline, giving the site a CDN and a managed
Let's Encrypt certificate on its custom domain.

## Why this exists

Before this, `cecile.t4sty.it` was a CNAME straight to the bucket's
`*.s3-website.fr-par.scw.cloud` endpoint (see `scripts/deploy.sh`). That
endpoint's certificate only covers `*.s3-website.<region>.scw.cloud` /
`*.s3.<region>.scw.cloud`, not the custom domain, so the site only ever
served plain HTTP. Edge Services sits in front of the bucket and handles
the custom domain + TLS termination instead.

## Stage chain

Requests flow `dns → tls → cache → backend (bucket)`. Each stage is a
separate resource, wired together by referencing the previous stage's id:

```
scaleway_edge_services_plan           (project-wide subscription, prerequisite)
  └─ scaleway_edge_services_pipeline
       └─ scaleway_edge_services_backend_stage  (points at the S3 bucket)
            └─ scaleway_edge_services_cache_stage
                 └─ scaleway_edge_services_tls_stage   (managed cert)
                      └─ scaleway_edge_services_dns_stage  (custom domain)
                           └─ scaleway_edge_services_head_stage  (entry point)
```

A few things about this that aren't obvious from the Scaleway docs:

- **`scaleway_edge_services_plan` is required before any pipeline can
  exist.** There's no free tier — Edge Services is a paid add-on, billed
  per project regardless of how many pipelines you run. We use `starter`
  (~€0.99/mo, 100GB bandwidth), which is plenty for this site.
- **`scaleway_edge_services_head_stage` is easy to miss.** It's the one
  resource that doesn't show up as an obvious "next stage" in the chain —
  it marks which stage is the pipeline's actual entry point (here, the
  `dns_stage`, since that's the outermost stage receiving raw requests).
  Without it, the whole stage chain is defined but never wired up to serve
  live traffic — the pipeline API itself reports this explicitly as
  `pipeline_missing_head_stage`.
- **`s3_backend_config.is_website` must be `true`.** The bucket already
  has S3 static-website hosting configured (that's what the old
  `*.s3-website.*` CNAME target told us), which is what resolves `/` to
  its index document. With `is_website = false`, Edge Services requests
  the bucket root as a listing (needs `s3:ListBucket`, which isn't
  granted by the per-object `public-read` ACLs `deploy.sh` sets) instead
  of fetching the index document — this produces a `403 Access Denied`
  from S3 that only shows up once TLS is already working.
- **The domain must have no pre-existing record for the same name.**
  Edge Services auto-creates the custom domain's CNAME in Scaleway
  Domains & DNS once the `dns_stage` has a valid `fqdns` — but only if no
  conflicting record already exists for that name. Migrating from the old
  direct-to-bucket CNAME means deleting that record first (not something
  this Terraform manages, since it predates it and isn't created by it).

## Applying

```bash
nix-shell ../../shell.nix --run bash   # gives you `terraform`
cd infra/edge-services
terraform init

set -a; source ../../.deploy.local; set +a   # SCW_ACCESS_KEY / SCW_SECRET_KEY / SCW_DEFAULT_PROJECT_ID
terraform plan
terraform apply
```

## Troubleshooting

`terraform plan`/`apply` only show the state Terraform itself tracks.
When something looks wrong (stuck certificate, DNS not appearing, vague
pipeline errors), the Edge Services and Domains APIs give a much clearer
picture than the console. Useful read-only calls (all GET, safe to run
anytime):

```bash
set -a; source ../../.deploy.local; set +a

# Pipeline status + any config/runtime errors
curl -s -H "X-Auth-Token: $SCW_SECRET_KEY" \
  "https://api.scaleway.com/edge-services/v1beta1/pipelines/<pipeline_id>"

# A specific stage (get its id from `terraform state show <resource>`)
curl -s -H "X-Auth-Token: $SCW_SECRET_KEY" \
  "https://api.scaleway.com/edge-services/v1beta1/tls-stages/<tls_stage_id>"
curl -s -H "X-Auth-Token: $SCW_SECRET_KEY" \
  "https://api.scaleway.com/edge-services/v1beta1/dns-stages/<dns_stage_id>"

# Existing DNS records for a name, to check for conflicts
curl -s -H "X-Auth-Token: $SCW_SECRET_KEY" \
  "https://api.scaleway.com/domain/v2beta1/dns-zones/t4sty.it/records?name=cecile"
```

If a `tls_stage`'s `certificate_expires_at` stays `null` and the console
reports something like *"Internal managed certificate error"*: we hit
this once and a targeted `terraform apply -replace=...` of just the
`tls_stage` wasn't enough (its underlying Secret Manager-backed cert
state stayed stuck, and the API even 500'd on a direct delete attempt of
that single stage). What worked was deleting the whole pipeline — Edge
Services cascades that into deleting all its stages *and* its
auto-created DNS record in one call, which a single stuck stage's own
delete doesn't — then re-applying from scratch:

```bash
curl -X DELETE -H "X-Auth-Token: $SCW_SECRET_KEY" \
  "https://api.scaleway.com/edge-services/v1beta1/pipelines/<pipeline_id>"

terraform state rm scaleway_edge_services_head_stage.bucket
terraform state rm scaleway_edge_services_dns_stage.bucket
terraform state rm scaleway_edge_services_tls_stage.bucket
terraform state rm scaleway_edge_services_cache_stage.bucket
terraform state rm scaleway_edge_services_backend_stage.bucket
terraform state rm scaleway_edge_services_pipeline.cecile
# (leave scaleway_edge_services_plan.main — the paid subscription — alone)

terraform apply
```

Certificate issuance on a fresh pipeline took about 6 minutes end to end.
