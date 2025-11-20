#!/bin/bash
set -e

cd /var/www/turing/iac-test-automations/worktree/synth-101912523/lib

# Generate secure passwords
export TF_VAR_db_master_password=$(openssl rand -base64 32 | tr -d '/+=' | head -c 20)
export TF_VAR_source_db_username=oracle_user
export TF_VAR_source_db_password=$(openssl rand -base64 32 | tr -d '/+=' | head -c 20)

echo "=== Running Terraform Plan ==="
terraform plan -out=tfplan

echo ""
echo "=== Running Terraform Apply ==="
terraform apply -auto-approve tfplan

echo ""
echo "=== Extracting Outputs ==="
terraform output -json > /var/www/turing/iac-test-automations/worktree/synth-101912523/tf-outputs/terraform-outputs.json

# Create cfn-outputs directory and flat-outputs.json for consistency with other platforms
mkdir -p /var/www/turing/iac-test-automations/worktree/synth-101912523/cfn-outputs
terraform output -json | jq 'to_entries | map({(.key): .value.value}) | add' > /var/www/turing/iac-test-automations/worktree/synth-101912523/cfn-outputs/flat-outputs.json

echo ""
echo "=== Deployment Complete ==="
cat /var/www/turing/iac-test-automations/worktree/synth-101912523/cfn-outputs/flat-outputs.json
