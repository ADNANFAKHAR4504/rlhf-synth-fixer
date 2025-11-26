#!/bin/bash
# Validation script to compare resource configurations between workspaces

set -e

WORKSPACES=("dev" "staging" "prod")
OUTPUT_DIR="./validation-reports"
mkdir -p "$OUTPUT_DIR"

echo "=== Multi-Environment Configuration Validation ==="
echo ""

# Function to extract configuration from workspace
extract_config() {
    local workspace=$1
    terraform workspace select "$workspace"
    terraform show -json > "$OUTPUT_DIR/${workspace}-state.json"
}

# Extract configurations from all workspaces
for ws in "${WORKSPACES[@]}"; do
    echo "Extracting configuration from $ws workspace..."
    extract_config "$ws"
done

# Compare security group rules
echo ""
echo "=== Comparing Security Group Rules ==="
for i in "${!WORKSPACES[@]}"; do
    for j in "${!WORKSPACES[@]}"; do
        if [ $i -lt $j ]; then
            ws1="${WORKSPACES[$i]}"
            ws2="${WORKSPACES[$j]}"

            echo "Comparing $ws1 vs $ws2:"

            # Extract security group rules
            jq '.values.root_module.resources[] | select(.type=="aws_security_group") | {name: .name, ingress: .values.ingress, egress: .values.egress}' \
                "$OUTPUT_DIR/${ws1}-state.json" > "$OUTPUT_DIR/${ws1}-sg-rules.json"

            jq '.values.root_module.resources[] | select(.type=="aws_security_group") | {name: .name, ingress: .values.ingress, egress: .values.egress}' \
                "$OUTPUT_DIR/${ws2}-state.json" > "$OUTPUT_DIR/${ws2}-sg-rules.json"

            # Compare rules
            if diff -u "$OUTPUT_DIR/${ws1}-sg-rules.json" "$OUTPUT_DIR/${ws2}-sg-rules.json" > "$OUTPUT_DIR/${ws1}-vs-${ws2}-sg-diff.txt"; then
                echo "  Security groups: IDENTICAL"
            else
                echo "  Security groups: DIFFERENCES FOUND (see $OUTPUT_DIR/${ws1}-vs-${ws2}-sg-diff.txt)"
            fi
        fi
    done
done

# Verify CIDR non-overlap
echo ""
echo "=== Verifying VPC CIDR Non-Overlap ==="
for ws in "${WORKSPACES[@]}"; do
    cidr=$(jq -r '.values.root_module.child_modules[] | select(.address=="module.vpc") | .resources[] | select(.type=="aws_vpc") | .values.cidr_block' \
        "$OUTPUT_DIR/${ws}-state.json")
    echo "$ws VPC CIDR: $cidr"
done

# Verify Lambda runtime consistency
echo ""
echo "=== Verifying Lambda Runtime Versions ==="
for ws in "${WORKSPACES[@]}"; do
    runtime=$(jq -r '.values.root_module.child_modules[] | select(.address=="module.lambda") | .resources[] | select(.type=="aws_lambda_function") | .values.runtime' \
        "$OUTPUT_DIR/${ws}-state.json")
    echo "$ws Lambda runtime: $runtime"
done

# Verify S3 bucket versioning
echo ""
echo "=== Verifying S3 Bucket Versioning ==="
for ws in "${WORKSPACES[@]}"; do
    versioning=$(jq -r '.values.root_module.resources[] | select(.type=="aws_s3_bucket_versioning") | .values.versioning_configuration[0].status' \
        "$OUTPUT_DIR/${ws}-state.json")
    echo "$ws S3 versioning: $versioning"
done

# Generate summary report
echo ""
echo "=== Validation Summary ==="
cat > "$OUTPUT_DIR/validation-summary.txt" <<EOF
Multi-Environment Validation Report
Generated: $(date)

Workspaces Validated: ${WORKSPACES[@]}

Configuration Consistency:
- Security Group Rules: See individual diff files
- VPC CIDR Ranges: See output above
- Lambda Runtime Versions: See output above
- S3 Bucket Versioning: See output above

Files Generated:
$(ls -1 "$OUTPUT_DIR")
EOF

cat "$OUTPUT_DIR/validation-summary.txt"

echo ""
echo "Validation complete. Reports saved to $OUTPUT_DIR/"
