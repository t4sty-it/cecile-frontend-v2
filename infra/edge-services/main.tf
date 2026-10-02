# Edge Services pipeline that fronts the cecile.t4sty.it Object Storage
# bucket with a CDN + a managed Let's Encrypt certificate, so the site is
# reachable over HTTPS on its custom domain.
#
# Today cecile.t4sty.it is a CNAME straight to the bucket's S3 REST endpoint
# (see scripts/deploy.sh), which only serves plain HTTP — the endpoint's
# certificate covers *.s3.<region>.scw.cloud, not the custom domain. This
# pipeline replaces that direct CNAME with one pointing at the pipeline's
# edge endpoint instead.
#
# Stage chain: bucket -> cache -> tls (managed cert) -> dns (custom domain).
#
# Edge Services is a paid add-on billed per project, independent of any
# pipeline — a plan must be subscribed before a pipeline can be created.
# "starter" (~1 EUR/mo, 100GB bandwidth) is plenty for this site.
resource "scaleway_edge_services_plan" "main" {
  name = "starter"
}

resource "scaleway_edge_services_pipeline" "cecile" {
  name        = "cecile-static-site"
  description = "HTTPS edge pipeline in front of the ${var.bucket_name} bucket"

  depends_on = [scaleway_edge_services_plan.main]
}

resource "scaleway_edge_services_backend_stage" "bucket" {
  pipeline_id = scaleway_edge_services_pipeline.cecile.id

  s3_backend_config {
    bucket_name   = var.bucket_name
    bucket_region = var.bucket_region
    # The bucket has S3 static-website hosting configured (the old direct
    # CNAME pointed at its *.s3-website.<region>.scw.cloud endpoint), which
    # resolves "/" to its index document. Without this, Edge Services
    # requests the bucket root as a listing (needs s3:ListBucket, which
    # isn't granted) instead of fetching the index document.
    is_website = true
  }
}

resource "scaleway_edge_services_cache_stage" "bucket" {
  pipeline_id      = scaleway_edge_services_pipeline.cecile.id
  backend_stage_id = scaleway_edge_services_backend_stage.bucket.id

  # Per-object Cache-Control headers set by scripts/deploy.sh (immutable for
  # hashed assets, no-cache for index.html) take precedence; this only
  # applies to objects that are somehow missing one.
  fallback_ttl = 3600
}

resource "scaleway_edge_services_tls_stage" "bucket" {
  pipeline_id = scaleway_edge_services_pipeline.cecile.id

  cache_stage_id      = scaleway_edge_services_cache_stage.bucket.id
  managed_certificate = true
}

resource "scaleway_edge_services_dns_stage" "bucket" {
  pipeline_id = scaleway_edge_services_pipeline.cecile.id

  tls_stage_id = scaleway_edge_services_tls_stage.bucket.id
  fqdns        = [var.domain]
}

# Marks the dns_stage (the outermost stage, which receives raw incoming
# requests) as the pipeline's actual entry point. Without this the chain
# above is defined but never wired up to serve live traffic.
resource "scaleway_edge_services_head_stage" "bucket" {
  pipeline_id   = scaleway_edge_services_pipeline.cecile.id
  head_stage_id = scaleway_edge_services_dns_stage.bucket.id
}
