# Terraform Infrastructure Tests

This directory contains comprehensive unit and integration tests for the Terraform infrastructure.

## Test Structure

- `terraform_validation_test.go`: Unit tests for Terraform configuration validation
- `integration_test.go`: Integration tests using deployed infrastructure outputs
- `go.mod`: Go module dependencies

## Prerequisites

1. Install Go 1.21 or later
2. Install Terraform 1.5 or later
3. Configure AWS credentials

## Running Unit Tests

Unit tests validate Terraform configuration without deploying resources:

```bash
cd test
go mod download
go test -v -timeout 30m
```

## Running Integration Tests

Integration tests require deployed infrastructure:

```bash
# First, deploy the infrastructure
cd ../lib
terraform init
terraform apply -var-file=terraform.tfvars

# Run integration tests
cd ../test
INTEGRATION_TEST=true go test -v -timeout 30m -run TestIntegration
```

## Test Coverage

The test suite covers:

- Terraform syntax validation
- VPC and networking configuration (3 AZs, public/private subnets, NAT gateways)
- RDS Aurora PostgreSQL cluster with read replicas
- ECS Fargate services with Graviton2 (ARM64) instances
- Application Load Balancer with SSL termination
- Route53 weighted routing for gradual migration
- AWS DMS replication instance and tasks
- CloudWatch dashboards and alarms
- SNS topics for notifications
- Lambda rollback functions
- AWS Backup plans with 30-day retention
- Secrets Manager for credentials
- SSM Parameter Store for configuration
- Security groups with least privilege
- Resource tagging
- environment_suffix usage in resource names

## Expected Test Results

All unit tests should pass with exit code 0:
- 20+ unit tests validating configuration
- 10+ integration tests validating deployed resources

## Troubleshooting

If tests fail:

1. Ensure Terraform is initialized: `terraform init`
2. Validate configuration: `terraform validate`
3. Check AWS credentials: `aws sts get-caller-identity`
4. Review test output for specific error messages
5. Ensure all required variables are set in terraform.tfvars

## Test Execution Time

- Unit tests: ~5-10 minutes
- Integration tests: ~5 minutes (requires deployed infrastructure)
- Full suite: ~10-15 minutes
