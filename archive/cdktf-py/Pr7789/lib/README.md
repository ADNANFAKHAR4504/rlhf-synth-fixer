# Cross-Account VPC Peering Infrastructure

This CDKTF Python project deploys a secure cross-account VPC peering solution for connecting trading and analytics workloads in separate AWS accounts.

## Architecture Overview

The infrastructure creates:
- Two VPCs (Trading: 10.0.0.0/16, Analytics: 10.1.0.0/16)
- VPC Peering Connection with bidirectional DNS resolution
- Private subnets across 3 availability zones in each VPC
- Security Groups with whitelist rules for HTTPS (443) and PostgreSQL (5432)
- Network ACLs for additional layer of security
- VPC Flow Logs with S3 storage (5-minute intervals)
- VPC Endpoints for S3 and DynamoDB
- AWS Config for compliance monitoring
- CloudWatch alarms and dashboard for network monitoring

## Prerequisites

1. Python 3.9 or higher
2. Node.js 14+ (required for CDKTF)
3. AWS CLI configured with appropriate credentials
4. Terraform CLI installed

## Installation

Install CDKTF CLI:
```bash
npm install -g cdktf-cli@latest
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

## Configuration

Set the environment suffix (default is "dev"):
```bash
export ENVIRONMENT_SUFFIX="dev"
```

For production deployments, use:
```bash
export ENVIRONMENT_SUFFIX="prod"
```

## Cross-Account Setup

This implementation demonstrates cross-account VPC peering. In production:

1. Configure AWS CLI profiles for each account:
```bash
aws configure --profile account-a
aws configure --profile account-b
```

2. Update `lib/tap_stack.py` to use different profiles:
```python
provider_account_a = AwsProvider(
    self,
    "aws_account_a",
    region="us-east-1",
    alias="account_a",
    profile="account-a"
)

provider_account_b = AwsProvider(
    self,
    "aws_account_b",
    region="us-east-1",
    alias="account_b",
    profile="account-b"
)
```

Or use assume role for cross-account access:
```python
provider_account_b = AwsProvider(
    self,
    "aws_account_b",
    region="us-east-1",
    alias="account_b",
    assume_role=[{
        "role_arn": "arn:aws:iam::ACCOUNT_B_ID:role/CrossAccountRole",
        "session_name": "TerraformSession"
    }]
)
```

## Deployment

Synthesize the CDKTF configuration:
```bash
cdktf synth
```

View the deployment plan:
```bash
cdktf plan
```

Deploy the infrastructure:
```bash
cdktf deploy
```

Confirm when prompted. The deployment will output:
- VPC Peering Connection ID
- VPC Peering Status
- Route Table IDs
- CloudWatch Dashboard Name
- VPC IDs

## Validation

After deployment, verify the VPC peering connection:
```bash
aws ec2 describe-vpc-peering-connections --filters "Name=tag:Name,Values=trading-analytics-peering-dev"
```

Check VPC Flow Logs:
```bash
aws s3 ls s3://trading-flow-logs-dev/
aws s3 ls s3://analytics-flow-logs-dev/
```

View CloudWatch Dashboard:
```bash
aws cloudwatch get-dashboard --dashboard-name vpc-peering-dashboard-dev
```

## Testing Connectivity

To test connectivity between VPCs:

1. Launch EC2 instances in both VPCs
2. Attach the security groups created by this stack
3. Test HTTPS connectivity:
```bash
curl https://<analytics-instance-private-ip>
```

4. Test PostgreSQL connectivity:
```bash
psql -h <trading-rds-endpoint> -U admin -d tradingdb
```

## Monitoring

CloudWatch Dashboard provides:
- Network traffic metrics (BytesIn/BytesOut) for both VPCs
- Real-time monitoring of peering connection

CloudWatch Alarms notify when:
- Network traffic exceeds threshold (1 GB in 5 minutes)

VPC Flow Logs capture:
- All network traffic (ACCEPT and REJECT)
- 5-minute aggregation intervals
- Stored in S3 for long-term retention

## Compliance

AWS Config rules monitor:
- VPC peering DNS resolution configuration
- Resource tagging compliance

All resources are tagged with:
- CostCenter: "trading", "analytics", or "shared"
- Environment: matching the environment suffix

## Cleanup

To destroy all resources:
```bash
cdktf destroy
```

Confirm when prompted. All resources including S3 buckets will be destroyed (force_destroy=True).

## Security Considerations

1. No 0.0.0.0/0 rules in Security Groups
2. Network ACLs provide additional layer of security
3. VPC endpoints ensure traffic doesn't traverse internet
4. Flow logs capture all network activity
5. All S3 buckets have public access blocked
6. IAM roles follow least privilege principle

## Troubleshooting

**VPC Peering fails to establish:**
- Verify CIDR blocks don't overlap
- Check IAM permissions for cross-account operations
- Ensure both VPCs have DNS support enabled

**DNS resolution not working:**
- Verify VPC peering options are configured correctly
- Check both requester and accepter DNS resolution settings

**Flow Logs not appearing in S3:**
- Wait 10-15 minutes after deployment
- Verify S3 bucket permissions
- Check Flow Log status in VPC console

**Config rules not recording:**
- Ensure Config recorder is enabled
- Verify IAM role permissions
- Check S3 delivery channel configuration

## Cost Optimization

This implementation uses:
- S3 for Flow Logs (cost-effective storage)
- Gateway VPC endpoints (no charge for S3/DynamoDB)
- No NAT Gateways (private subnet only communication)

Estimated monthly cost: ~$50-100 depending on data transfer volume.

## Further Enhancements

Consider adding:
- Transit Gateway for multi-VPC connectivity
- AWS PrivateLink for service-to-service communication
- Network Firewall for advanced traffic inspection
- GuardDuty for threat detection (account-level, enable separately)
