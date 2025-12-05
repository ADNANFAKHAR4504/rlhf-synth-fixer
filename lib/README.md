# Infrastructure Compliance Analysis Tool

A comprehensive AWS CDK-based infrastructure compliance analysis tool for auditing CloudFormation stacks across multiple AWS accounts.

## Overview

This tool provides automated compliance checking for financial services infrastructure deployments. It analyzes CloudFormation stacks to identify security violations, configuration drift, and ensure resources meet compliance standards.

### Key Features

- **S3 Bucket Security**: Validates encryption settings and public access blocks
- **RDS Compliance**: Checks encryption and automated backup configuration
- **Security Group Analysis**: Identifies overly permissive inbound rules (0.0.0.0/0)
- **IAM Policy Validation**: Validates policies against security baseline
- **Resource Tagging**: Ensures required tags (Environment, Owner, CostCenter) are present
- **Risk Scoring**: Calculates risk score (1-10) based on violation severity
- **Multi-Account Support**: Cross-account analysis using assume role
- **Performance**: Caching mechanism for API call reduction (5-minute TTL)

## Architecture

### Components

1. **CDK Stack** (`lib/tap_stack.py`):
   - Deploys Lambda function for compliance analysis
   - Creates IAM roles with necessary permissions
   - Provisions S3 bucket for compliance reports
   - Configures CloudWatch Logs

2. **Compliance Analyzer** (`lib/lambda/index.py`):
   - Python Lambda function (Python 3.11)
   - Analyzes CloudFormation stacks and resources
   - Implements compliance checks
   - Generates JSON reports
   - Supports caching for performance

3. **Compliance Reports**:
   - Stored in S3 bucket: `compliance-reports-{environmentSuffix}`
   - JSON format with detailed check results
   - Includes risk scores and violation summaries

## Prerequisites

- Python 3.9 or higher
- AWS CDK 2.x
- Node.js 18+ (for CDK)
- AWS CLI configured with appropriate credentials
- Cross-account IAM roles (for multi-account analysis)

## Installation

```bash
# Clone repository
git clone <repository-url>
cd <repository-directory>

# Install Python dependencies
pip install -r requirements.txt

# Install CDK globally
npm install -g aws-cdk

# Verify installation
cdk --version
```

## Deployment

### Bootstrap CDK (First Time Only)

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

### Deploy Stack

```bash
# Deploy with default environment suffix (dev)
cdk deploy

# Deploy with custom environment suffix
cdk deploy --parameters environmentSuffix=prod

# Deploy with confirmation prompt disabled
cdk deploy --require-approval never
```

### Verify Deployment

```bash
# List deployed resources
aws cloudformation describe-stacks --stack-name TapStack

# Check Lambda function
aws lambda get-function --function-name compliance-analyzer-dev
```

## Usage

### Invoke Lambda Function

#### Analyze All Stacks

```bash
aws lambda invoke \
  --function-name compliance-analyzer-dev \
  --payload '{"dry_run": true}' \
  --cli-binary-format raw-in-base64-out \
  response.json

cat response.json | jq '.'
```

#### Analyze Stacks Matching Pattern

```bash
aws lambda invoke \
  --function-name compliance-analyzer-dev \
  --payload '{"stack_name_pattern": "MyApp", "dry_run": true}' \
  --cli-binary-format raw-in-base64-out \
  response.json
```

#### Analyze Stacks in Different Account

```bash
aws lambda invoke \
  --function-name compliance-analyzer-dev \
  --payload '{"account_id": "123456789012", "dry_run": true}' \
  --cli-binary-format raw-in-base64-out \
  response.json
```

### View Compliance Reports

#### List Reports

```bash
aws s3 ls s3://compliance-reports-dev/compliance-reports/ --recursive
```

#### Download Latest Report

```bash
# Get latest report
LATEST=$(aws s3 ls s3://compliance-reports-dev/compliance-reports/ --recursive | sort | tail -n 1 | awk '{print $4}')

# Download report
aws s3 cp s3://compliance-reports-dev/$LATEST ./latest-report.json

# View report
cat latest-report.json | jq '.'
```

## Report Format

### Report Structure

```json
{
  "analysis_timestamp": "2025-12-05T10:30:00.000000",
  "total_stacks_analyzed": 5,
  "stack_reports": [
    {
      "stack_name": "MyAppStack",
      "account_id": "123456789012",
      "region": "us-east-1",
      "timestamp": "2025-12-05T10:30:00.000000",
      "dry_run": true,
      "risk_score": 7,
      "check_results": [
        {
          "resource": "my-bucket",
          "type": "S3Bucket",
          "checks": [
            {
              "name": "S3BucketEncryption",
              "status": "FAIL",
              "message": "Bucket encryption is not enabled",
              "severity": "HIGH"
            },
            {
              "name": "S3PublicAccessBlock",
              "status": "PASS",
              "message": "Public access is blocked",
              "severity": "HIGH"
            }
          ]
        }
      ],
      "violations_summary": {
        "total_checks": 15,
        "passed": 10,
        "failed": 5,
        "errors": 0
      }
    }
  ],
  "overall_summary": {
    "total_violations": 25,
    "average_risk_score": 6.2,
    "stacks_analyzed": 5
  }
}
```

### Risk Score Interpretation

- **1-3**: Low risk - Minor violations or low-severity issues
- **4-6**: Medium risk - Some security concerns requiring attention
- **7-10**: High risk - Critical security violations requiring immediate remediation

## Compliance Checks

### S3 Buckets

- **Encryption**: Validates server-side encryption is enabled (S3-managed or KMS)
- **Public Access Block**: Ensures all public access block settings are enabled
- **Tags**: Verifies presence of required tags (Environment, Owner, CostCenter)

### RDS Instances

- **Storage Encryption**: Validates encrypted storage is enabled
- **Automated Backups**: Ensures backup retention period > 0
- **Tags**: Verifies presence of required tags

### Security Groups

- **Permissive Rules**: Identifies rules allowing unrestricted access (0.0.0.0/0)
- **Port Analysis**: Reports specific ports with unrestricted access
- **Tags**: Verifies presence of required tags

### IAM Policies

- **Security Baseline**: Validates against prohibited actions:
  - `*:*` (full wildcard)
  - `s3:*`, `iam:*`, `ec2:*` (service wildcards)
  - Destructive actions (e.g., `rds:DeleteDB*`, `dynamodb:DeleteTable`)
- **Overly Permissive**: Flags policies with excessive permissions

### Resource Tags

Required tags for all resources:
- **Environment**: Deployment environment (dev, staging, prod)
- **Owner**: Resource owner/team
- **CostCenter**: Cost allocation identifier

## Performance

### Optimization Features

- **Caching**: 5-minute TTL for repeated API calls
- **Batch Processing**: Analyzes up to 50 stacks per invocation
- **Efficient Querying**: Uses paginators for large result sets
- **Timeout**: 15-minute Lambda timeout for comprehensive analysis

### Expected Performance

- **10 stacks**: ~1-2 minutes
- **25 stacks**: ~2-4 minutes
- **50 stacks**: ~4-5 minutes

## Cross-Account Analysis

### Setup Cross-Account Role

Create IAM role in target accounts:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::{ANALYZER_ACCOUNT}:role/compliance-analyzer-role-dev"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Attach policy with required permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:Describe*",
        "cloudformation:List*",
        "cloudformation:Get*",
        "s3:GetBucket*",
        "s3:ListBucket",
        "rds:Describe*",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeTags",
        "iam:Get*",
        "iam:List*",
        "tag:GetResources"
      ],
      "Resource": "*"
    }
  ]
}
```

## Testing

### Run Unit Tests

```bash
# Install test dependencies
pip install pytest pytest-cov moto

# Run all tests
pytest tests/

# Run with coverage
pytest --cov=lib tests/

# Run specific test file
pytest tests/test_tap_stack.py

# Verbose output
pytest -v tests/
```

### Test Coverage

- CDK stack configuration
- Lambda IAM permissions
- Resource removal policies
- Compliance check logic
- Risk score calculation
- Caching functionality

## Troubleshooting

### Lambda Timeout

**Issue**: Lambda times out before completing analysis

**Solution**:
1. Reduce number of stacks (use `stack_name_pattern`)
2. Increase timeout in `lib/tap_stack.py` (max 15 minutes)
3. Optimize by analyzing fewer resource types

### Insufficient Permissions

**Issue**: Access denied errors during analysis

**Solution**:
1. Verify Lambda execution role has required permissions
2. Check cross-account role trust policy
3. Ensure resource-based policies allow access

### Cache Issues

**Issue**: Stale data or incorrect results

**Solution**:
1. Clear cache by redeploying Lambda
2. Wait for cache TTL expiration (5 minutes)
3. Adjust `CACHE_TTL` in `lib/lambda/index.py`

### Cross-Account Access Denied

**Issue**: Cannot assume role in target account

**Solution**:
1. Verify role exists in target account
2. Check trust relationship includes analyzer account
3. Ensure role name matches (default: `ComplianceAnalyzerRole`)

## Extending the Tool

### Adding New Compliance Checks

1. Create check function in `lib/lambda/index.py`:

```python
def check_new_resource_compliance(resource_id: str, account_id: Optional[str] = None) -> Dict:
    """Check new resource type for compliance."""
    result = {
        'resource': resource_id,
        'type': 'NewResourceType',
        'checks': []
    }

    # Implement compliance logic
    # ...

    return result
```

2. Add resource type handling in `analyze_stack()`:

```python
elif resource_type == 'AWS::NewService::Resource':
    result = check_new_resource_compliance(physical_id, account_id)
    check_results.append(result)
```

3. Update IAM permissions in `lib/tap_stack.py` if needed

4. Add tests in `tests/test_compliance_checks.py`

### Customizing Security Baseline

Edit prohibited actions in `check_iam_policy_compliance()`:

```python
prohibited_actions = [
    '*:*',
    's3:*',
    'iam:*',
    'ec2:*',
    # Add custom prohibited actions
    'lambda:DeleteFunction',
    'dynamodb:DeleteBackup'
]
```

## Cleanup

### Destroy Stack

```bash
# Destroy all resources
cdk destroy

# Destroy with environment suffix
cdk destroy --context environmentSuffix=prod
```

**Note**: S3 bucket has `auto_delete_objects=True`, so all reports will be deleted.

### Manual Cleanup

If needed, manually delete:

```bash
# Delete S3 bucket
aws s3 rb s3://compliance-reports-dev --force

# Delete Lambda function
aws lambda delete-function --function-name compliance-analyzer-dev

# Delete IAM role
aws iam delete-role --role-name compliance-analyzer-role-dev

# Delete CloudWatch log group
aws logs delete-log-group --log-group-name /aws/lambda/compliance-analyzer-dev
```

## Security Considerations

- **Least Privilege**: Lambda role follows least privilege principle
- **Encryption**: Reports bucket encrypted with S3-managed keys
- **Public Access**: Reports bucket blocks all public access
- **Read-Only Analysis**: Tool does not modify analyzed resources (read-only operations)
- **Dry-Run Mode**: Default mode prevents accidental modifications
- **Audit Logging**: All Lambda executions logged to CloudWatch

## Best Practices

1. **Regular Analysis**: Schedule Lambda invocations (e.g., daily via EventBridge)
2. **Alert on High Risk**: Configure CloudWatch alarms for high-risk scores
3. **Remediation Workflow**: Integrate with ticketing systems for violation tracking
4. **Report Retention**: Configure S3 lifecycle policies for report retention
5. **Cross-Account Strategy**: Centralize compliance analysis in dedicated account
6. **Baseline Updates**: Regularly review and update security baseline

## License

MIT License

## Support

For issues or questions:
- Review CloudWatch Logs: `/aws/lambda/compliance-analyzer-{environmentSuffix}`
- Check S3 reports for detailed violation information
- Verify IAM permissions and trust relationships
