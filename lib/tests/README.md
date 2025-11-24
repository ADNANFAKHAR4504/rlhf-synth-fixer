# Test Suite for Multi-Account AWS Security Framework

This directory contains comprehensive Terraform tests for the multi-account security framework infrastructure.

## Test Organization

Tests are organized by component:

- **main_test.tf**: Tests for Organizations, OUs, and CloudTrail setup
- **kms_test.tf**: Tests for KMS key creation, replication, and grants
- **iam_test.tf**: Tests for cross-account IAM roles and policies
- **scp_test.tf**: Tests for Service Control Policies
- **cloudwatch_test.tf**: Tests for CloudWatch Logs and alarms
- **config_test.tf**: Tests for AWS Config rules and conformance pack
- **integration_test.tf**: Tests for cross-component interactions

## Test Coverage

Total test cases: 100+

### Component Tests
- Organizations: 10 tests
- KMS: 12 tests
- IAM: 15 tests
- SCPs: 15 tests
- CloudWatch: 20 tests
- Config: 20 tests

### Integration Tests
- Cross-component interactions: 20 tests

## Running Tests

All tests are implemented as Terraform outputs that return true/false values.

### Run All Tests
```bash
cd lib
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

After deployment, view all test results:
```bash
terraform output | grep test_
```

### Run Specific Component Tests

To run only organization tests:
```bash
terraform output | grep test_organization
terraform output | grep test_ou
terraform output | grep test_cloudtrail
```

To run only KMS tests:
```bash
terraform output | grep test_kms
terraform output | grep test_primary
terraform output | grep test_replica
```

To run only IAM tests:
```bash
terraform output | grep test_role
terraform output | grep test_policy
terraform output | grep test_mfa
```

To run only SCP tests:
```bash
terraform output | grep test_scp
```

To run only CloudWatch tests:
```bash
terraform output | grep test_log_group
terraform output | grep test_metric_filter
terraform output | grep test_alarm
```

To run only Config tests:
```bash
terraform output | grep test_config
terraform output | grep test_rule
terraform output | grep test_conformance
```

### Run Integration Tests
```bash
terraform output | grep test_cloudtrail_uses
terraform output | grep test_config_uses
terraform output | grep test_cross_account
```

## Test Results Format

Each test outputs a boolean value:
- `true` = test passed
- `false` = test failed or resource not created

Example output:
```
test_organization_created = true
test_all_ous_created = true
test_cloudtrail_enabled = true
test_primary_kms_key_created = true
test_security_role_created = true
test_s3_encryption_scp_created = true
test_central_log_group_created = true
test_s3_encryption_rule_created = true
...
```

## Test Categories

### Creation Tests
Verify that all resources are created successfully.

Example: `test_organization_created`, `test_primary_kms_key_created`, `test_security_role_created`

### Configuration Tests
Verify that resources have correct configuration.

Example: `test_primary_kms_key_rotation_enabled`, `test_cloudwatch_log_retention_days`, `test_security_role_mfa_required`

### Integration Tests
Verify that components work together correctly.

Example: `test_cloudtrail_uses_kms_key`, `test_config_uses_s3_bucket`, `test_cross_account_roles_can_access_kms`

### Security Tests
Verify that security best practices are implemented.

Example: `test_cloudtrail_bucket_public_access_blocked`, `test_all_log_groups_encrypted`, `test_s3_encryption_scp_has_deny_statement`

## Interpreting Test Results

All tests passing:
```bash
terraform output -json | grep -c '"true"'
# Should return number equal to total test count
```

Find failing tests:
```bash
terraform output -json | grep '"false"'
# Will show which tests failed
```

Common failure reasons:
- Resource not created: Check that prerequisites are met (backend, S3 buckets, etc.)
- Missing configuration: Check terraform.tfvars has all required variables
- Permission issues: Ensure IAM role has correct permissions
- Service not enabled: Some services require explicit enabling in AWS

## Debugging Failed Tests

1. Check Terraform logs:
```bash
TF_LOG=DEBUG terraform apply
```

2. Verify resource creation:
```bash
terraform state list | grep aws_
```

3. Check specific resource:
```bash
terraform state show aws_kms_key.primary
```

4. View test code:
```bash
grep "test_<name>" <component>_test.tf
```

## Test Prerequisites

Before running tests:

1. Backend S3 bucket created:
```bash
aws s3api create-bucket \
  --bucket terraform-state-backend-prod \
  --region us-east-1
```

2. DynamoDB state lock table created:
```bash
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

3. AWS credentials configured:
```bash
aws configure
```

4. Required IAM permissions for:
   - Organizations
   - KMS
   - IAM
   - CloudTrail
   - CloudWatch Logs
   - AWS Config
   - S3

## Test Maintenance

Update tests when:
- New resources are added
- Configuration changes
- AWS API changes
- Compliance requirements change

Process:
1. Review changes in component files
2. Add/update corresponding tests
3. Run full test suite
4. Document changes in test comments

## Continuous Integration

For CI/CD pipelines:

```bash
#!/bin/bash
set -e

cd lib
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Capture all test outputs
TESTS=$(terraform output -json)

# Check for failures
FAILED=$(echo "$TESTS" | grep -c '"false"' || true)

if [ "$FAILED" -gt 0 ]; then
  echo "Tests failed: $FAILED"
  echo "$TESTS" | grep '"false"'
  exit 1
fi

echo "All tests passed"
exit 0
```

## Test Statistics

Run test count:
```bash
grep -r "output \"test_" . | wc -l
```

By component:
```bash
grep "output \"test_" main_test.tf | wc -l
grep "output \"test_" kms_test.tf | wc -l
grep "output \"test_" iam_test.tf | wc -l
grep "output \"test_" scp_test.tf | wc -l
grep "output \"test_" cloudwatch_test.tf | wc -l
grep "output \"test_" config_test.tf | wc -l
grep "output \"test_" integration_test.tf | wc -l
```

## Troubleshooting

If tests won't run:

1. Check Terraform version:
```bash
terraform version
```

2. Validate Terraform code:
```bash
terraform validate
```

3. Check formatting:
```bash
terraform fmt -recursive
```

4. View detailed error:
```bash
terraform apply -input=false 2>&1 | head -50
```

## Contact and Support

For issues with tests:
1. Review test logic in relevant _test.tf file
2. Check resource configuration in main component file
3. Verify AWS permissions
4. Review CloudTrail logs for API errors
