terraform {
  required_version = ">= 1.5"

  required_providers {
    scaleway = {
      source  = "scaleway/scaleway"
      version = ">= 2.71.0"
    }
  }
}

# Auth and defaults come from the standard Scaleway env vars:
#   SCW_ACCESS_KEY, SCW_SECRET_KEY, SCW_DEFAULT_PROJECT_ID, SCW_DEFAULT_REGION
# (the same SCW_ACCESS_KEY / SCW_SECRET_KEY used by scripts/deploy.sh work here
# too, as long as the API key has Edge Services + Domains permissions).
provider "scaleway" {}
