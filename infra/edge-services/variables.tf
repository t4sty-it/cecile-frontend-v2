variable "bucket_name" {
  description = "Name of the Object Storage bucket serving the built site (matches SCW_BUCKET in scripts/deploy.sh)."
  type        = string
  default     = "cecile.t4sty.it"
}

variable "bucket_region" {
  description = "Region of the Object Storage bucket (matches SCW_REGION in scripts/deploy.sh)."
  type        = string
  default     = "fr-par"
}

variable "domain" {
  description = "Custom domain the pipeline should serve, e.g. cecile.t4sty.it. Must be a domain managed in Scaleway Domains & DNS for the CNAME to be created automatically."
  type        = string
  default     = "cecile.t4sty.it"
}
