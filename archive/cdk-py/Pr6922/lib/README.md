# VPC Infrastructure with Advanced Networking

Production-grade VPC infrastructure for financial services using CDK Python. This stack creates a multi-AZ VPC with NAT instances, dual VPC Flow Logs, custom Network ACLs, and Transit Gateway preparation.

## Architecture

- VPC with CIDR 172.31.0.0/16 across 3 Availability Zones
- 6 subnets (3 public, 3 private) with /24 CIDR blocks
- NAT instances (t3.micro) in each public subnet with Amazon Linux 2023
- Custom route tables routing private traffic through NAT instances
- Network ACLs with explicit allow/deny rules (HTTP, HTTPS, SSH from specific CIDR)
- VPC Flow Logs to both S3 (90-day lifecycle) and CloudWatch (30-day retention)
- Lambda function publishing custom NAT instance metrics every 5 minutes
- Transit Gateway attachment configuration as CloudFormation outputs
- Region-specific AMI mappings for cross-region deployment

## Prerequisites

- Python 3.9 or higher
- AWS CDK CLI 2.x
- AWS credentials configured
- Node.js 14.x or higher (for CDK CLI)

## Installation

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Install CDK CLI (if not already installed)
npm install -g aws-cdk

# Bootstrap CDK (first time only)
cdk bootstrap
```

## Deployment

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy with default environment suffix
cdk deploy

# Deploy with custom environment suffix
cdk deploy --parameters environmentSuffix=dev

# View deployment progress
cdk deploy --progress events
```

## Configuration

### Environment Suffix

The `environmentSuffix` parameter allows unique resource naming for multiple deployments:

```bash
cdk deploy --parameters environmentSuffix=prod
cdk deploy --parameters environmentSuffix=staging
cdk deploy --parameters environmentSuffix=dev
```

### Supported Regions

The stack includes AMI mappings for:
- us-east-1 (default)
- eu-west-1
- ap-southeast-1

To deploy to a different region:

```bash
export CDK_DEFAULT_REGION=eu-west-1
cdk deploy
```

## Stack Outputs

After deployment, the stack provides these outputs:

- **VpcId**: VPC identifier
- **PublicSubnetIds**: Comma-separated list of public subnet IDs
- **PrivateSubnetIds**: Comma-separated list of private subnet IDs
- **NatInstanceIds**: Comma-separated list of NAT instance IDs
- **FlowLogsBucket**: S3 bucket name for VPC Flow Logs
- **FlowLogsLogGroup**: CloudWatch Log Group name for VPC Flow Logs
- **TransitGatewayAttachmentConfig**: JSON configuration for Transit Gateway attachment

## Custom CloudWatch Metrics

The Lambda function publishes custom metrics to the `CustomMetrics/NAT` namespace:

- **NetworkBandwidthIn**: Average incoming network traffic (Bytes)
- **NetworkBandwidthOut**: Average outgoing network traffic (Bytes)

Metrics are published every 5 minutes for each NAT instance.

## Testing

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run unit tests
pytest tests/unit -v

# Run integration tests
pytest tests/integration -v

# Run tests with coverage
pytest --cov=lib --cov-report=html

# View coverage report
open htmlcov/index.html
```

## Network ACL Rules

The stack configures Network ACLs with these rules:

**Inbound:**
- Allow HTTP (port 80) from 0.0.0.0/0
- Allow HTTPS (port 443) from 0.0.0.0/0
- Allow SSH (port 22) from 192.168.1.0/24
- Deny all other traffic

**Outbound:**
- Allow all traffic

## VPC Flow Logs

Flow logs are configured with dual destinations:

1. **S3 Bucket**
   - Traffic type: ALL
   - Lifecycle: 90 days
   - Encryption: S3-managed

2. **CloudWatch Logs**
   - Traffic type: ALL
   - Retention: 30 days
   - Role: Managed by CDK

## Security Considerations

- NAT instances use security groups limiting access to private subnet CIDRs only
- Network ACLs provide subnet-level traffic control
- VPC Flow Logs enable complete traffic audit trail
- IAM roles follow principle of least privilege
- All resources tagged with Environment and CostCenter

## Cost Optimization

- NAT instances (t3.micro) instead of NAT Gateways
- S3 lifecycle policies for flow log retention
- CloudWatch log retention set to 30 days
- Serverless Lambda for metrics collection

## Cleanup

```bash
# Destroy all resources
cdk destroy

# Destroy specific stack
cdk destroy TapStack

# Force destroy without confirmation
cdk destroy --force
```

## Troubleshooting

### NAT Instance Connectivity Issues

Check NAT instance security groups and source/destination check:

```bash
aws ec2 describe-instances --instance-ids <nat-instance-id> \
  --query 'Reservations[0].Instances[0].[SourceDestCheck,SecurityGroups]'
```

### VPC Flow Logs Not Appearing

Verify IAM role permissions and log group/bucket configuration:

```bash
aws logs describe-log-groups --log-group-name-prefix /aws/vpc/flowlogs
aws s3 ls s3://vpc-flow-logs-<account-id>-<suffix>/
```

### Lambda Metrics Function Errors

Check Lambda function logs:

```bash
aws logs tail /aws/lambda/nat-metrics-publisher-<suffix> --follow
```

## Transit Gateway Integration

The stack outputs Transit Gateway attachment configuration but does not create the attachment. Use the output to create the attachment:

```bash
# Get Transit Gateway configuration
aws cloudformation describe-stacks --stack-name TapStack \
  --query 'Stacks[0].Outputs[?OutputKey==`TransitGatewayAttachmentConfig`].OutputValue' \
  --output text

# Create Transit Gateway attachment using the configuration
aws ec2 create-transit-gateway-vpc-attachment \
  --transit-gateway-id <tgw-id> \
  --vpc-id <vpc-id> \
  --subnet-ids <subnet-ids>
```

## Contributing

Follow these guidelines:

1. Use Python 3.9+ syntax and type hints
2. Add unit tests for all constructs
3. Update documentation for new features
4. Follow PEP 8 style guidelines
5. Run tests before committing

## License

This project is licensed under the MIT License.
