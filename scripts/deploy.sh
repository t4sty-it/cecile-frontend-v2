#!/usr/bin/env bash
# Builds the app and syncs dist/ to a Scaleway Object Storage bucket using the
# S3-compatible REST API directly — only curl (>= 7.75, for --aws-sigv4) and
# coreutils are required.
#
# Credentials: SCW_ACCESS_KEY / SCW_SECRET_KEY, from the environment or from a
# gitignored `.deploy.local` file at the repo root, e.g.:
#   SCW_ACCESS_KEY=SCWXXXXXXXXXXXXXXXXX
#   SCW_SECRET_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
#
# Optional overrides: SCW_BUCKET, SCW_REGION, SCW_ACL (set empty to skip ACLs,
# e.g. if the bucket is made public through a bucket policy instead).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .deploy.local ]]; then
  set -a
  # shellcheck disable=SC1091
  source .deploy.local
  set +a
fi

: "${SCW_ACCESS_KEY:?Set SCW_ACCESS_KEY (env or .deploy.local)}"
: "${SCW_SECRET_KEY:?Set SCW_SECRET_KEY (env or .deploy.local)}"
BUCKET="${SCW_BUCKET:-cecile.t4sty.it}"
REGION="${SCW_REGION:-fr-par}"
ACL="${SCW_ACL-public-read}"

# Path-style addressing, so bucket names containing dots still match the TLS cert.
BASE_URL="https://s3.${REGION}.scw.cloud/${BUCKET}"

s3() {
  curl --silent --show-error --fail-with-body \
    --aws-sigv4 "aws:amz:${REGION}:s3" \
    --user "${SCW_ACCESS_KEY}:${SCW_SECRET_KEY}" \
    "$@"
}

urlencode_path() {
  local s="$1" out="" c i
  for ((i = 0; i < ${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in
      [a-zA-Z0-9.~_/-]) out+="$c" ;;
      *) out+=$(printf '%%%02X' "'$c") ;;
    esac
  done
  printf '%s' "$out"
}

content_type() {
  case "${1##*.}" in
    html) echo "text/html; charset=utf-8" ;;
    js | mjs) echo "text/javascript; charset=utf-8" ;;
    css) echo "text/css; charset=utf-8" ;;
    json | map) echo "application/json" ;;
    svg) echo "image/svg+xml" ;;
    png) echo "image/png" ;;
    jpg | jpeg) echo "image/jpeg" ;;
    gif) echo "image/gif" ;;
    webp) echo "image/webp" ;;
    ico) echo "image/x-icon" ;;
    wasm) echo "application/wasm" ;;
    woff) echo "font/woff" ;;
    woff2) echo "font/woff2" ;;
    ttf) echo "font/ttf" ;;
    txt) echo "text/plain; charset=utf-8" ;;
    wav) echo "audio/wav" ;;
    mp3) echo "audio/mpeg" ;;
    ogg) echo "audio/ogg" ;;
    *) echo "application/octet-stream" ;;
  esac
}

put_object() {
  local file="$1" key="$2" cache_control="$3"
  local sha
  sha=$(sha256sum "$file" | cut -d' ' -f1)
  local headers=(
    -H "Content-Type: $(content_type "$file")"
    -H "Cache-Control: ${cache_control}"
    -H "x-amz-content-sha256: ${sha}"
  )
  [[ -n "$ACL" ]] && headers+=(-H "x-amz-acl: ${ACL}")
  echo "  PUT ${key}"
  s3 -o /dev/null "${headers[@]}" -T "$file" "${BASE_URL}/$(urlencode_path "$key")"
}

list_remote_keys() {
  local token="" resp url
  while :; do
    url="${BASE_URL}?list-type=2"
    [[ -n "$token" ]] && url+="&continuation-token=$(urlencode_path "$token" | sed 's|/|%2F|g')"
    resp=$(s3 "$url")
    grep -o '<Key>[^<]*</Key>' <<<"$resp" | sed -e 's|</\?Key>||g' -e 's|&amp;|\&|g' || true
    grep -q '<IsTruncated>true</IsTruncated>' <<<"$resp" || break
    token=$(grep -o '<NextContinuationToken>[^<]*' <<<"$resp" | sed 's|<NextContinuationToken>||')
  done
}

bun run build

echo "Deploying dist/ to ${BUCKET} (${REGION})"

mapfile -t local_keys < <(cd dist && find . -type f ! -name index.html | sed 's|^\./||' | sort)

# Hashed assets (JS/CSS/images) are safe to cache forever — Vite gives them
# content-hashed filenames, so a new deploy means a new filename.
for key in "${local_keys[@]}"; do
  put_object "dist/${key}" "$key" "public, max-age=31536000, immutable"
done

# index.html goes last so it never references assets that aren't uploaded yet,
# and must never be cached, since it's what points browsers at the new assets.
put_object dist/index.html index.html "no-cache"

# Remove objects that are no longer part of the build.
declare -A keep=([index.html]=1)
for key in "${local_keys[@]}"; do keep["$key"]=1; done
while IFS= read -r key; do
  [[ -z "$key" || -n "${keep[$key]:-}" ]] && continue
  echo "  DELETE ${key}"
  s3 -o /dev/null -X DELETE "${BASE_URL}/$(urlencode_path "$key")"
done < <(list_remote_keys)

echo "Deployed to ${BASE_URL}"
