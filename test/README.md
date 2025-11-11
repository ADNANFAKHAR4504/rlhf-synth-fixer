# CloudFormation Template Tests

This directory contains unit tests for the CloudFormation template.

## Test Files

- `test_cfn_template.py` - Comprehensive unit tests for template structure, resources, and configuration

## Running Tests

### Prerequisites

```bash
pip install pytest
```

### Run All Tests

```bash
# From the repository root
python -m pytest test/test_cfn_template.py -v

# Or using unittest
python -m unittest test.test_cfn_template -v
```

### Run Specific Test Classes

```bash
# Test only template structure
python -m pytest test/test_cfn_template.py::TestCloudFormationTemplate -v

# Test only complexity metrics
python -m pytest test/test_cfn_template.py::TestTemplateComplexity -v
```

### Run Specific Tests

```bash
python -m pytest test/test_cfn_template.py::TestCloudFormationTemplate::test_rds_instance_configuration -v
```

## Test Coverage

The test suite covers:

### Template Structure (8 tests)
- Format version validation
- Description presence
- Parameter definitions
- Resource definitions
- Output definitions

### VPC and Networking (8 tests)
- VPC configuration
- Subnet creation (6 subnets across 2 AZs)
- NAT Gateways (2 for HA)
- Internet Gateway
- Route tables and associations

### Security Groups (4 tests)
- ALB security group (HTTP/HTTPS)
- App security group (port 8080, SSH)
- DB security group (PostgreSQL port 5432)
- Least privilege access

### Load Balancing (5 tests)
- Application Load Balancer configuration
- Blue and Green target groups
- Health check configuration
- Listener configuration

### Auto Scaling (4 tests)
- Launch template configuration
- User data script
- Auto Scaling Group sizing
- Health check type (ELB)

### IAM and Security (4 tests)
- EC2 instance role
- Secrets Manager permissions
- Lambda execution role
- Instance profile

### Secrets Management (3 tests)
- Secrets Manager secret
- Secret rotation Lambda function
- Rotation schedule configuration

### Database (5 tests)
- RDS PostgreSQL configuration
- Multi-AZ deployment
- Backup retention
- CloudWatch Logs export
- DB subnet group

### Outputs and Exports (3 tests)
- Required outputs present
- Export names for cross-stack references
- Complete resource identifiers

### Best Practices (4 tests)
- EnvironmentSuffix in resource names
- Consistent tagging strategy
- Resource complexity metrics
- Migration-specific tags

## Total Test Count

**48 unit tests** covering all aspects of the CloudFormation template.

## Expected Results

All tests should pass for the production-ready template:

```
====================================== 48 passed in 0.5s =======================================
```

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run CloudFormation Tests
  run: |
    python -m pytest test/test_cfn_template.py -v --junit-xml=test-results.xml
```

## Troubleshooting

### Test Failures

If tests fail, check:
1. Template path is correct: `lib/TapStack.json`
2. Template is valid JSON
3. All required resources are defined
4. Parameter types match expected values

### Import Errors

If you see import errors:
```bash
# Install dependencies
pip install pytest boto3
```

## Adding New Tests

When adding new resources to the template:
1. Add corresponding test in `test_cfn_template.py`
2. Test resource type, properties, and tags
3. Verify resource relationships (dependencies)
4. Update this README with new test count
