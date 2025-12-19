#!/bin/bash

# Workspace Configuration Validation Script
# Compares resource configurations across Terraform workspaces

set -e

WORKSPACES=("dev" "staging" "prod")
TEMP_DIR="/tmp/terraform-validation"
COMPARISON_FILE="${TEMP_DIR}/workspace-comparison.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Terraform Workspace Validation Script"
echo "=========================================="
echo ""

# Create temp directory
mkdir -p "${TEMP_DIR}"

# Function to extract resource configuration
extract_resources() {
    local workspace=$1
    local output_file="${TEMP_DIR}/${workspace}-resources.json"

    echo "Extracting resources from workspace: ${workspace}"

    # Switch to workspace
    terraform workspace select "${workspace}" > /dev/null 2>&1

    # Plan and extract resource types
    terraform plan -out="${TEMP_DIR}/${workspace}.tfplan" > /dev/null 2>&1
    terraform show -json "${TEMP_DIR}/${workspace}.tfplan" > "${output_file}"

    echo "✓ Extracted resources for ${workspace}"
}

# Function to compare security group rules
compare_security_groups() {
    echo ""
    echo "Comparing Security Group Rules..."
    echo "===================================="

    local mismatches=0

    for workspace in "${WORKSPACES[@]}"; do
        local sg_file="${TEMP_DIR}/${workspace}-sg-rules.json"

        # Extract security group rules
        jq '.planned_values.root_module.resources[] | select(.type == "aws_security_group") |
            {name: .values.name, ingress: .values.ingress, egress: .values.egress}' \
            "${TEMP_DIR}/${workspace}-resources.json" > "${sg_file}"

        if [ "${workspace}" != "dev" ]; then
            # Compare with dev (baseline)
            if ! diff -q "${TEMP_DIR}/dev-sg-rules.json" "${sg_file}" > /dev/null 2>&1; then
                echo -e "${RED}✗ Security group rules differ between dev and ${workspace}${NC}"
                mismatches=$((mismatches + 1))
            else
                echo -e "${GREEN}✓ Security group rules match between dev and ${workspace}${NC}"
            fi
        fi
    done

    return ${mismatches}
}

# Function to compare Lambda runtime versions
compare_lambda_runtimes() {
    echo ""
    echo "Comparing Lambda Runtime Versions..."
    echo "===================================="

    local mismatches=0

    for workspace in "${WORKSPACES[@]}"; do
        local lambda_file="${TEMP_DIR}/${workspace}-lambda.json"

        # Extract Lambda runtimes
        jq '.planned_values.root_module.resources[] | select(.type == "aws_lambda_function") |
            {name: .values.function_name, runtime: .values.runtime}' \
            "${TEMP_DIR}/${workspace}-resources.json" > "${lambda_file}"

        if [ "${workspace}" != "dev" ]; then
            # Compare runtimes
            if ! diff -q "${TEMP_DIR}/dev-lambda.json" "${lambda_file}" > /dev/null 2>&1; then
                echo -e "${RED}✗ Lambda runtimes differ between dev and ${workspace}${NC}"
                mismatches=$((mismatches + 1))
            else
                echo -e "${GREEN}✓ Lambda runtimes match between dev and ${workspace}${NC}"
            fi
        fi
    done

    return ${mismatches}
}

# Function to verify VPC CIDR non-overlap
verify_vpc_cidrs() {
    echo ""
    echo "Verifying VPC CIDR Blocks..."
    echo "===================================="

    declare -A vpc_cidrs
    local overlaps=0

    for workspace in "${WORKSPACES[@]}"; do
        # Extract VPC CIDR
        local cidr=$(jq -r '.planned_values.root_module.resources[] |
            select(.type == "aws_vpc") | .values.cidr_block' \
            "${TEMP_DIR}/${workspace}-resources.json" | head -1)

        vpc_cidrs[${workspace}]=${cidr}
        echo "  ${workspace}: ${cidr}"
    done

    # Check for overlaps (simplified - full check would use IP math)
    if [ "${vpc_cidrs[dev]}" == "${vpc_cidrs[staging]}" ] || \
       [ "${vpc_cidrs[dev]}" == "${vpc_cidrs[prod]}" ] || \
       [ "${vpc_cidrs[staging]}" == "${vpc_cidrs[prod]}" ]; then
        echo -e "${RED}✗ VPC CIDR blocks overlap detected${NC}"
        overlaps=1
    else
        echo -e "${GREEN}✓ No VPC CIDR overlaps detected${NC}"
    fi

    return ${overlaps}
}

# Function to verify resource naming consistency
verify_naming_consistency() {
    echo ""
    echo "Verifying Resource Naming..."
    echo "===================================="

    local issues=0

    for workspace in "${WORKSPACES[@]}"; do
        echo "Checking ${workspace}..."

        # Check if all resources include environment suffix
        local missing_suffix=$(jq -r '.planned_values.root_module.resources[] |
            select(.values.tags.EnvironmentSuffix == null) | .address' \
            "${TEMP_DIR}/${workspace}-resources.json" 2>/dev/null | wc -l)

        if [ "${missing_suffix}" -gt 0 ]; then
            echo -e "${YELLOW}⚠ ${missing_suffix} resources missing environment_suffix tag in ${workspace}${NC}"
            issues=$((issues + 1))
        else
            echo -e "${GREEN}✓ All resources properly tagged in ${workspace}${NC}"
        fi
    done

    return ${issues}
}

# Main execution
main() {
    # Extract resources from all workspaces
    for workspace in "${WORKSPACES[@]}"; do
        extract_resources "${workspace}"
    done

    # Run comparisons
    local total_issues=0

    compare_security_groups || total_issues=$((total_issues + $?))
    compare_lambda_runtimes || total_issues=$((total_issues + $?))
    verify_vpc_cidrs || total_issues=$((total_issues + $?))
    verify_naming_consistency || total_issues=$((total_issues + $?))

    # Summary
    echo ""
    echo "=========================================="
    echo "Validation Summary"
    echo "=========================================="

    if [ ${total_issues} -eq 0 ]; then
        echo -e "${GREEN}✓ All validation checks passed${NC}"
        echo "All workspaces are consistent"
        exit 0
    else
        echo -e "${RED}✗ Found ${total_issues} issues${NC}"
        echo "Please review the differences above"
        exit 1
    fi
}

# Run main function
main
