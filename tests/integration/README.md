# Integration Tests

This directory contains integration tests for the deployed CDKTF infrastructure.

## Overview

Integration tests validate the actual deployed infrastructure by reading outputs from:
```
cfn-outputs/flat-outputs.json
```

The tests verify that all infrastructure components are correctly deployed and configured.

## Prerequisites

1. **Deploy the infrastructure first**:
   ```bash
   cdktf deploy
   ```
   This will generate the `cfn-outputs/flat-outputs.json` file with all stack outputs.

2. **Install test dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Running Integration Tests

### Run all integration tests:
```bash
pytest tests/integration/ -v --no-cov
```

### Run specific test:
```bash
pytest tests/integration/test_infrastructure.py::TestInfrastructureDeployment::test_aurora_cluster_deployed -v
```

### Run with detailed output:
```bash
python -m pytest tests/integration/ -v -s --no-cov
```

## Test Coverage

The integration tests verify:

1. **VPC Resources**: VPC, subnets, CIDR blocks
2. **Aurora PostgreSQL 16.9**: Cluster endpoints, version, database name
3. **S3 Bucket**: Bucket name, ARN, region, versioning
4. **Security Groups**: Aurora security group configuration
5. **IAM Roles**: RDS Enhanced Monitoring role
6. **Parameter Groups**: Cluster and DB parameter groups
7. **Secrets Manager**: Database password secret storage
8. **AWS Account Info**: Account ID, region, environment

## Test Structure

The integration tests contain **10 comprehensive test cases**:

1. **test_stack_outputs_exist** - Verifies CDKTF stack outputs are available
2. **test_vpc_resources_deployed** - Checks VPC, subnets, and networking
3. **test_aurora_cluster_deployed** - Validates Aurora PostgreSQL cluster
4. **test_aurora_version_is_16_9** - Confirms Aurora version is 16.9
5. **test_s3_bucket_deployed** - Verifies S3 bucket with versioning
6. **test_security_group_deployed** - Checks Aurora security group
7. **test_iam_role_deployed** - Validates RDS Enhanced Monitoring IAM role
8. **test_parameter_groups_deployed** - Verifies parameter groups
9. **test_secrets_manager_deployed** - Checks database password secret
10. **test_aws_account_and_region** - Confirms account and region info

## Output File Structure

The `cfn-outputs/flat-outputs.json` file contains all exported outputs:

```json
{
  "vpc_id": "vpc-xxxxx",
  "vpc_cidr": "10.0.0.0/16",
  "aurora_cluster_id": "aurora-postgres-dev",
  "aurora_cluster_endpoint": "aurora-postgres-dev.cluster-xxxxx.us-east-1.rds.amazonaws.com",
  "aurora_cluster_reader_endpoint": "aurora-postgres-dev.cluster-ro-xxxxx.us-east-1.rds.amazonaws.com",
  "aurora_engine_version": "16.9",
  "aurora_database_name": "tapdbdev",
  "s3_bucket_name": "tap-bucket-dev-tapstack",
  "s3_bucket_arn": "arn:aws:s3:::tap-bucket-dev-tapstack",
  "aurora_security_group_id": "sg-xxxxx",
  "rds_monitoring_role_arn": "arn:aws:iam::123456789012:role/rds-monitoring-role-dev",
  "db_secret_arn": "arn:aws:secretsmanager:us-east-1:123456789012:secret:aurora-postgres-dev-master-password-xxxxx",
  "aws_account_id": "123456789012",
  "aws_region": "us-east-1",
  "environment_suffix": "dev"
}
```

## Expected Behavior

- **Before deployment**: Tests will be **SKIPPED** (expected - no outputs file)
- **After successful deployment**: Tests should **PASS** with all assertions met
- **Partial deployment**: Some tests may fail if specific resources aren't deployed

## Example Output

```
✓ Loaded stack outputs from cfn-outputs/flat-outputs.json: 20 outputs found

test_stack_outputs_exist
  ✓ Stack has 20 outputs

test_vpc_resources_deployed
  ✓ VPC resources deployed
    VPC ID: vpc-0abc123def456
    VPC CIDR: 10.0.0.0/16

test_aurora_cluster_deployed
  ✓ Aurora PostgreSQL cluster deployed
    Cluster ID: aurora-postgres-dev
    Writer endpoint: aurora-postgres-dev.cluster-xxxxx.us-east-1.rds.amazonaws.com
    Reader endpoint: aurora-postgres-dev.cluster-ro-xxxxx.us-east-1.rds.amazonaws.com
    Engine version: 16.9

test_aurora_version_is_16_9
  ✓ Aurora PostgreSQL version verified: 16.9

test_s3_bucket_deployed
  ✓ S3 bucket deployed
    Bucket name: tap-bucket-dev-tapstack
    Bucket region: us-east-1

test_security_group_deployed
  ✓ Aurora security group deployed: sg-0abc123def456

test_iam_role_deployed
  ✓ RDS Enhanced Monitoring IAM role deployed
    Role name: rds-monitoring-role-dev

test_parameter_groups_deployed
  ✓ Aurora parameter groups deployed
    Cluster PG: aurora-postgres16-cluster-pg-dev
    DB PG: aurora-postgres16-db-pg-dev

test_secrets_manager_deployed
  ✓ Database password secret deployed in Secrets Manager
    Secret name: aurora-postgres-dev-master-password

test_aws_account_and_region
  ✓ AWS account and region information
    Account ID: 123456789012
    Region: us-east-1
    Environment: dev

========== 10 passed in 0.15s ==========
```

## Troubleshooting

### Error: Outputs file not found

```
✗ Outputs file not found: cfn-outputs/flat-outputs.json
   Please run: cdktf deploy to generate outputs
```

**Solution**: Deploy the infrastructure first:
```bash
cdktf deploy
```

### Error: Tests are skipped

**Reason**: The `cfn-outputs/flat-outputs.json` file doesn't exist or is empty.

**Solution**: Ensure the deployment completed successfully and generated the outputs file.

### Error: Specific output not found

**Reason**: The output might not be exported in `lib/tap_stack.py`.

**Solution**: Check that all required `TerraformOutput` calls are present in the stack code:
```python
from cdktf import TerraformOutput

TerraformOutput(
    self,
    "output_name",
    value=resource.attribute,
    description="Description of the output"
)
```

### Error: JSON parsing failed

**Reason**: The outputs file may be corrupted or incomplete.

**Solution**: 
1. Check the file exists: `cat cfn-outputs/flat-outputs.json`
2. Validate JSON format: `python -m json.tool cfn-outputs/flat-outputs.json`
3. Re-deploy if necessary: `cdktf deploy`

## CI/CD Integration

In CI/CD pipelines, ensure:

1. **Deploy infrastructure**:
   ```bash
   cdktf deploy --auto-approve
   ```

2. **Wait for outputs file**:
   ```bash
   while [ ! -f cfn-outputs/flat-outputs.json ]; do sleep 5; done
   ```

3. **Run integration tests**:
   ```bash
   pytest tests/integration/ -v --no-cov --junitxml=integration-results.xml
   ```

4. **Clean up** (optional):
   ```bash
   cdktf destroy --auto-approve
   ```

## Notes

- Integration tests are excluded from code coverage by default (see `pytest.ini`)
- Tests read from static JSON file, not live AWS API calls
- For live AWS validation, use separate tools like AWS CLI or boto3 scripts
