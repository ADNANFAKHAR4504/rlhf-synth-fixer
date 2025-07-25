#!/bin/bash
set -euo pipefail

DOMAIN="example.com"
OUT_DIR="./certs"
SSM_PARAM="/app/certArn"

mkdir -p "$OUT_DIR"

KEY_FILE="$OUT_DIR/$DOMAIN.key"
CSR_FILE="$OUT_DIR/$DOMAIN.csr"
CRT_FILE="$OUT_DIR/$DOMAIN.crt"

echo "🔧 Generating private key..."
openssl genrsa -out "$KEY_FILE" 2048

echo "🔧 Creating Certificate Signing Request (CSR)..."
openssl req -new -key "$KEY_FILE" -out "$CSR_FILE" \
  -subj "/C=US/ST=Dev/L=Dev/O=Dev/OU=Dev/CN=$DOMAIN"

echo "🔧 Creating self-signed certificate..."
openssl x509 -req -in "$CSR_FILE" -signkey "$KEY_FILE" \
  -out "$CRT_FILE" -days 365

echo "✅ Self-signed certificate generated at $OUT_DIR"

echo "📤 Importing certificate to AWS ACM..."
CERT_ARN=$(aws acm import-certificate \
  --certificate "fileb://$CRT_FILE" \
  --private-key "fileb://$KEY_FILE" \
  --query CertificateArn \
  --output text)

if [[ -z "$CERT_ARN" ]]; then
  echo "❌ Failed to import certificate to ACM"
  exit 1
fi

echo "✅ Certificate imported to ACM"
echo "🔗 Certificate ARN: $CERT_ARN"

echo "📦 Saving Certificate ARN to AWS SSM Parameter Store..."
aws ssm put-parameter \
  --name "$SSM_PARAM" \
  --type String \
  --value "$CERT_ARN" \
  --overwrite

echo "✅ Certificate ARN saved to SSM at $SSM_PARAM"

# Optional: Save locally to .env
# echo "CERT_ARN=$CERT_ARN" > ".env"
# echo "📁 Saved certificate ARN to .env"
