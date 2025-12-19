# Multi-Region S3 Disaster Recovery Solution

A comprehensive S3 disaster recovery solution implementing same-region replication with monitoring, lifecycle management, and KMS encryption using AWS CDK with Python.

## Architecture Overview

This solution deploys a complete disaster recovery infrastructure for S3-based document management systems with the following components:

### Core Components

1. **S3 Buckets**
   - Primary bucket in us-east-1 with versioning and Transfer Acceleration
   - Replica bucket in us-east-1 with versioning and Glacier lifecycle policy
   - Both buckets use KMS encryption with separate keys

2. **KMS Encryption**
   - Separate KMS keys for primary and replica buckets
   - Automatic key rotation enabled
   - Proper IAM policies for replication role access

3. **S3 Replication**
   - Same-Region Replication (SRR) configured between buckets
   - Replication Time Control (RTC) enabled with 15-minute SLA
   - Delete marker replication enabled
   - Replica modification sync enabled

4. **IAM Role**
   - Least privilege replication role
   - Permissions to read from source, write to destination
   - KMS decrypt/encrypt permissions for both keys

5. **Monitoring & Alerting**
   - CloudWatch alarms for replication latency > 15 minutes
   - CloudWatch dashboard with replication metrics
   - CloudWatch Logs for replication metrics
   - Metrics include latency, pending operations, and bytes pending

6. **Lifecycle Management**
   - Automatic transition to Glacier after 90 days on replica bucket
   - Cost optimization for long-term retention

7. **Security**
   - Bucket policies enforcing encryption in transit (SSL/TLS)
   - KMS encryption at rest
   - All resources use RemovalPolicy.DESTROY for testing

## Prerequisites

- AWS CDK 2.x installed
- Python 3.8 or higher
- AWS CLI configured with appropriate credentials
- Pipenv for dependency management

## Installation

```bash
# Install dependencies
pipenv install

# Activate virtual environment
pipenv shell
```

## Deployment

### Deploy the Stack

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy to AWS
cdk deploy

# Deploy with specific environment suffix
cdk deploy -c environmentSuffix=prod
```

### View Stack Outputs

After deployment, the stack outputs include:
- Primary bucket URL and ARN
- Replica bucket URL and ARN
- Replication IAM role ARN
- CloudWatch dashboard URL

```bash
# View outputs
aws cloudformation describe-stacks --stack-name TapStackdev --query 'Stacks[0].Outputs'
```

## Configuration

### Environment Suffix

All resources include an environment suffix for uniqueness. Set it via CDK context:

```bash
# Default: 'dev'
cdk deploy

# Custom environment
cdk deploy -c environmentSuffix=staging
```

### Region

The solution deploys to us-east-1 by default. Both buckets are in the same region (Same-Region Replication).

### Replication Time Control

RTC is configured with a 15-minute SLA. The CloudWatch alarm triggers if replication latency exceeds this threshold.

## Testing

The solution includes comprehensive unit tests for all components:

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=lib --cov-report=html

# Run specific test file
pytest tests/test_s3_replication_stack.py
```

## Monitoring

### CloudWatch Dashboard

Access the CloudWatch dashboard from the stack outputs to monitor:
- Replication latency over time
- Number of operations pending replication
- Bytes pending replication

### CloudWatch Alarms

The replication latency alarm triggers when:
- Maximum replication latency exceeds 15 minutes (900,000 ms)
- Evaluated over 2 consecutive periods of 5 minutes each

### CloudWatch Logs

Replication metrics are logged to `/aws/s3/replication/{environment_suffix}` with 7-day retention.

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- Primary bucket: `primary-bucket-dev`
- Replica bucket: `replica-bucket-dev`
- Replication role: `s3-replication-role-dev`
- CloudWatch alarm: `s3-replication-latency-dev`
- CloudWatch dashboard: `s3-replication-dashboard-dev`

## Cost Optimization

- S3 Transfer Acceleration: Only enabled on primary bucket for faster uploads
- Glacier transition: Replica objects transition to Glacier after 90 days
- RTC: Adds cost but provides 15-minute SLA for replication
- Nested stacks: Improves resource organization without additional cost

## Security Considerations

1. **Encryption at Rest**: KMS encryption on both buckets with separate keys
2. **Encryption in Transit**: Bucket policies deny all non-SSL requests
3. **Least Privilege**: IAM role has minimal permissions required for replication
4. **Key Rotation**: KMS keys have automatic rotation enabled
5. **Versioning**: Enabled on both buckets to prevent accidental data loss

## Cleanup

To remove all resources:

```bash
# Destroy the stack
cdk destroy

# Destroy with specific environment suffix
cdk destroy -c environmentSuffix=prod
```

Note: All resources are configured with `RemovalPolicy.DESTROY` and `auto_delete_objects=True` for easy cleanup during testing.

## Troubleshooting

### Replication Not Working

1. Check CloudWatch alarms for latency issues
2. Verify IAM role permissions in AWS Console
3. Ensure versioning is enabled on both buckets
4. Check KMS key policies allow S3 service access

### CloudWatch Metrics Not Appearing

- S3 replication metrics may take 15-30 minutes to appear after first object replication
- Ensure RTC is enabled in the replication configuration
- Verify metrics are enabled in the replication rule

### Deployment Failures

- Check CDK version compatibility (requires CDK 2.x)
- Ensure AWS credentials have sufficient permissions
- Verify Python version is 3.8 or higher
- Check for bucket name conflicts (must be globally unique)

## Architecture Decision: Same-Region Replication

This implementation uses Same-Region Replication (SRR) rather than Cross-Region Replication (CRR) because both buckets are in us-east-1. This design:

- Provides protection against accidental deletions and application bugs
- Reduces replication latency (typically < 1 minute with RTC)
- Lowers data transfer costs (no cross-region charges)
- Supports disaster recovery within the same region

To convert to true multi-region replication, simply deploy the replica bucket to a different region (e.g., us-west-2) and update the stack accordingly.

## File Structure

```
lib/
├── __init__.py                    # Package initialization
├── tap_stack.py                   # Main CDK stack (orchestrator)
├── s3_replication_stack.py        # S3 replication infrastructure
├── PROMPT.md                      # Original requirements
├── MODEL_RESPONSE.md              # Initial implementation
├── IDEAL_RESPONSE.md              # Production-ready implementation (Phase 3)
├── MODEL_FAILURES.md              # Differences and improvements (Phase 3)
└── README.md                      # This file

tests/
├── __init__.py
├── test_tap_stack.py              # Unit tests for main stack
└── test_s3_replication_stack.py   # Unit tests for S3 replication
```

## Support

For issues or questions:
1. Check CloudWatch logs and alarms
2. Review AWS documentation for S3 replication
3. Verify IAM permissions and KMS key policies
4. Check CDK documentation for Python constructs
