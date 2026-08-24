#!/usr/bin/env bash
set -euo pipefail

# Requires: SCALEWAY_BUCKET set to your bucket name.
# Uses the AWS CLI profile "scaleway" by default (override with AWS_PROFILE).
BUCKET="t4sty-cecile" # ${SCALEWAY_BUCKET:?Set SCALEWAY_BUCKET to your bucket name, e.g. SCALEWAY_BUCKET=my-bucket bun run deploy}"
ENDPOINT="https://s3.fr-par.scw.cloud"
PROFILE="${AWS_PROFILE:-scaleway}"

cd "$(dirname "$0")/.."

bun run build

# Hashed assets (JS/CSS/images) are safe to cache forever — Vite gives them
# content-hashed filenames, so a new deploy means a new filename.
aws s3 sync dist/ "s3://${BUCKET}" \
  --endpoint-url "$ENDPOINT" \
  --profile "$PROFILE" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# index.html must never be cached, since it's what points browsers at the
# latest hashed asset filenames.
aws s3 cp dist/index.html "s3://${BUCKET}/index.html" \
  --endpoint-url "$ENDPOINT" \
  --profile "$PROFILE" \
  --cache-control "no-cache"

echo "Deployed to s3://${BUCKET} (${ENDPOINT})"
