# Multi-Region DR Infrastructure Tests

This directory contains comprehensive tests for the multi-region disaster recovery infrastructure.

## Test Structure

### Unit Tests

Unit tests validate individual modules and their configuration without deploying resources.

- **terraform_validation_test.sh**: Validates Terraform syntax, formatting, and basic configuration
- **unit_test_vpc.sh**: Tests VPC module structure and configuration
- **unit_test_aurora.sh**: Tests Aurora Global Database module
- **unit_test_ecs.sh**: Tests ECS Fargate module
- **unit_test_route53.sh**: Tests Route53 failover module

### Integration Tests

Integration tests validate deployed resources in AWS (post-deployment).

- **integration_test.sh**: Validates actual deployed infrastructure using AWS CLI

### Test Runner

- **run_all_tests.sh**: Master test runner that executes all unit tests

## Running Tests

### Run All Unit Tests

```bash
cd /var/www/turing/iac-test-automations/worktree/synth-101912621
bash test/run_all_tests.sh
```

### Run Individual Test Suites

```bash
# Terraform validation
bash test/terraform_validation_test.sh

# VPC module tests
bash test/unit_test_vpc.sh

# Aurora module tests
bash test/unit_test_aurora.sh

# ECS module tests
bash test/unit_test_ecs.sh

# Route53 module tests
bash test/unit_test_route53.sh
```

### Run Integration Tests (Post-Deployment)

After deploying the infrastructure, run integration tests:

```bash
# Replace test-12345 with your actual environment_suffix
bash test/integration_test.sh test-12345
```

## Test Coverage

### Terraform Validation Tests (10 tests)
1. Terraform format check
2. Terraform initialization
3. Terraform validation
4. environment_suffix variable defined
5. skip_final_snapshot = true in Aurora
6. deletion_protection = false in Aurora
7. Multi-region provider configuration
8. Required tags configured
9. CloudWatch alarms configured
10. Route53 health checks configured

### VPC Module Tests (12 tests)
1. Module directory exists
2. Required files present
3. Private subnets defined
4. Public subnets defined
5. Internet Gateway configured
6. NAT Gateway configured
7. Public route table configured
8. Private route table configured
9. Security groups defined
10. Required outputs defined
11. environment_suffix usage
12. 3 AZs configured

### Aurora Module Tests (14 tests)
1. Module directory exists
2. Required files present
3. Global cluster defined
4. Primary cluster defined
5. DR cluster defined
6. 7-day backup retention
7. skip_final_snapshot enabled
8. deletion_protection disabled
9. Replication lag alarm configured
10. PostgreSQL engine configured
11. Storage encryption enabled
12. SNS topic configured
13. DB subnet groups for both regions
14. environment_suffix usage

### ECS Module Tests (15 tests)
1. Module directory exists
2. Required files present
3. ECS cluster defined
4. Fargate capacity provider
5. Task definition defined
6. ECS service defined
7. Application Load Balancer defined
8. ALB is internet-facing
9. Target group configured
10. Auto-scaling configured
11. CloudWatch logs configured
12. IAM roles configured
13. Security groups configured
14. Health checks configured
15. environment_suffix usage

### Route53 Module Tests (13 tests)
1. Module directory exists
2. Required files present
3. Hosted zone defined
4. Health check configured
5. Health check has FQDN
6. Primary failover record defined
7. DR failover record defined
8. CloudWatch alarm configured
9. SNS topic configured
10. HTTPS health check type
11. Health check interval configured
12. Alias records configured
13. environment_suffix usage

### Integration Tests (15 tests)
1. Primary VPC exists
2. DR VPC exists
3. Primary VPC has 3 private subnets
4. Primary VPC has 3 public subnets
5. Aurora Global Cluster exists
6. Primary Aurora cluster exists
7. DR Aurora cluster exists
8. Primary ECS cluster is active
9. DR ECS cluster is active
10. Primary ALB is active
11. DR ALB is active
12. Route53 hosted zone exists
13. CloudWatch alarms exist
14. SNS topics exist
15. Resources properly tagged

## Test Results

All tests include clear PASS/FAIL indicators and descriptive messages.

### Expected Output

```
=========================================
Multi-Region DR Infrastructure Test Suite
=========================================

PHASE 1: Unit Tests
=========================================

Running: Terraform Validation Tests
=========================================
✓ PASS: Terraform files are properly formatted
✓ PASS: Terraform initialized successfully
...

=========================================
Test Suite Summary
=========================================
Total tests passed: 64
Total tests failed: 0

✓ ALL TESTS PASSED!
```

## Prerequisites

### For Unit Tests
- Terraform >= 1.5.0
- Bash shell
- Basic Unix utilities (grep, sed, etc.)

### For Integration Tests
- AWS CLI configured with appropriate credentials
- Deployed infrastructure with known environment_suffix
- Proper IAM permissions to describe resources

## Troubleshooting

### Test Failures

If tests fail, check:

1. **Terraform Format**: Run `terraform fmt -recursive` in lib/ directory
2. **Module Structure**: Ensure all required files exist in modules/
3. **Variable Names**: Verify environment_suffix is used consistently
4. **Resource Configuration**: Check skip_final_snapshot and deletion_protection settings

### Integration Test Failures

If integration tests fail:

1. Verify environment_suffix matches deployed infrastructure
2. Check AWS CLI configuration and credentials
3. Ensure resources have completed deployment (not still creating)
4. Verify IAM permissions to describe resources

## Contributing

When adding new infrastructure components:

1. Create corresponding unit tests
2. Add integration test checks
3. Update test counts in this README
4. Run `bash test/run_all_tests.sh` before committing

## Test Philosophy

These tests follow best practices:

- **Fast Feedback**: Unit tests run quickly without AWS API calls
- **Comprehensive Coverage**: Tests cover configuration, structure, and deployment
- **Clear Output**: PASS/FAIL messages with descriptive information
- **Automation Ready**: Designed for CI/CD pipeline integration
