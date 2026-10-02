output "pipeline_id" {
  value = scaleway_edge_services_pipeline.cecile.id
}

output "edge_endpoint" {
  description = "Standard Edge Services endpoint for this pipeline, before the custom domain CNAME is applied."
  value       = "${scaleway_edge_services_pipeline.cecile.id}.svc.edge.scw.cloud"
}

output "certificate_expires_at" {
  value = scaleway_edge_services_tls_stage.bucket.certificate_expires_at
}
