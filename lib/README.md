# VPC Peering Infrastructure with Pulumi TypeScript

Production-ready Pulumi TypeScript infrastructure for establishing secure VPC peering between payment and audit VPCs with comprehensive security controls, monitoring, and cross-account support.

## Overview

This solution implements a complete VPC peering infrastructure for a financial services company operating multiple AWS accounts. It establishes secure network connectivity between payment processing and audit logging VPCs while maintaining strict network isolation and compliance requirements.

## Architecture Components

### 1. VPC Peering Connection
- Automated peering between payment-vpc (10.100.0.0/16) and audit-vpc (10.200.0.0/16)
- Auto-accept enabled for same-account scenarios
- DNS resolution enabled for private hosted zones across peered VPCs
- Cross-region peering support for disaster recovery scenarios

### 2. Route Table Configuration
- Automatic discovery and update of all route tables in both VPCs
- Bidirectional routes for traffic flow through peering connection
- Handles multiple route tables per VPC (one per subnet/AZ)
- Dynamic route creation with proper dependencies

### 3. Security Groups
- Dedicated security groups for each VPC with peering rules
- HTTPS traffic (port 443) allowed between VPCs
- PostgreSQL traffic (port 5432) allowed between VPCs
- CIDR-based restrictions to VPC ranges only
- Separate ingress and egress rules for granular control

### 4. Network ACLs
- Default NACL rules configured for both VPCs
- Encrypted traffic enforcement (TLS on 443, encrypted PostgreSQL on 5432)
- Inbound and outbound rules for bidirectional traffic
- Additional security layer beyond security groups

### 5. VPC Flow Logs
- S3 bucket with server-side encryption (AES256)
- Versioning enabled for audit trail
- Lifecycle policies:
  - 30 days: Transition to Standard-IA
  - 60 days: Transition to Glacier
  - 90 days: Expiration (configurable)
- Block public access enabled
- Flow logs for both VPCs capturing all traffic (accepted, rejected, and all)

### 6. CloudWatch Monitoring
- SNS topic for alarm notifications
- Metric alarm for peering connection status changes
- CloudWatch dashboard with traffic metrics and recent events
- Log group for peering events with 30-day retention

### 7. Resource Tagging
- Comprehensive tagging strategy for compliance:
  - DataClassification: Sensitive
  - BusinessUnit: Payment/Audit
  - Environment: dev/staging/prod
  - ManagedBy: Pulumi
  - Name: Descriptive resource names
- Consistent tagging across all resources

### 8. Cross-Account Permissions
- IAM roles for cross-account VPC peering
- Trust relationships with external ID for security
- Assume role policies for peering accepter
- Conditional logic for same-account vs cross-account scenarios

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- TypeScript 5.x or later
- Two existing VPCs (payment and audit) with non-overlapping CIDR blocks
- AWS account IDs for both payment and audit accounts
- IAM permissions for VPC, EC2, S3, CloudWatch, SNS, and IAM operations

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure Pulumi stack:
```bash
pulumi stack init dev
```

3. Set required configuration values:
```bash
# Required configuration
pulumi config set aws:region us-east-1
pulumi config set paymentVpcId vpc-0123456789abcdef0
pulumi config set auditVpcId vpc-0fedcba987654321
pulumi config set paymentVpcCidr 10.100.0.0/16
pulumi config set auditVpcCidr 10.200.0.0/16
pulumi config set paymentAccountId 111111111111
pulumi config set auditAccountId 222222222222

# Optional configuration
pulumi config set environment dev
pulumi config set dataClassification Sensitive
pulumi config set flowLogsRetentionDays 90
```

Alternatively, edit the `Pulumi.dev.yaml` file directly with your VPC and account details.

## Deployment

### Option 1: Standard Deployment

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

### Option 2: Deployment with Environment Suffix

```bash
# Set environment suffix for resource naming
export ENVIRONMENT_SUFFIX="test-123"

# Deploy with unique resource names
pulumi up
```

### Option 3: Cross-Account Deployment

For cross-account VPC peering, ensure:
1. IAM role with appropriate permissions in the accepter account
2. Cross-account assume role permissions configured
3. Different account IDs set in configuration

```bash
# Configure cross-account settings
pulumi config set paymentAccountId 111111111111
pulumi config set auditAccountId 222222222222

# Deploy (automatic cross-account role creation)
pulumi up
```

## Outputs

The stack exports the following outputs for verification and downstream use:

| Output | Description | Example |
|--------|-------------|---------|
| `peeringConnectionId` | VPC peering connection ID | `pcx-0123456789abcdef0` |
| `paymentRouteTableIds` | Array of route table IDs in payment VPC | `["rtb-abc123", "rtb-def456"]` |
| `auditRouteTableIds` | Array of route table IDs in audit VPC | `["rtb-ghi789", "rtb-jkl012"]` |
| `flowLogsBucketName` | S3 bucket name for VPC flow logs | `vpc-flow-logs-peering-dev` |
| `peeringStatusAlarmArn` | CloudWatch alarm ARN for peering status | `arn:aws:cloudwatch:us-east-1:...` |
| `securityGroupIds` | Security group IDs for both VPCs | `{"paymentSecurityGroupId": "sg-abc123", "auditSecurityGroupId": "sg-def456"}` |

## Verification

After deployment, verify the infrastructure:

### 1. Verify VPC Peering Connection
```bash
# Get peering connection ID
PEERING_ID=$(pulumi stack output peeringConnectionId)

# Check peering status
aws ec2 describe-vpc-peering-connections --vpc-peering-connection-ids $PEERING_ID

# Expected status: "active"
```

### 2. Verify Route Tables
```bash
# Get route table IDs
pulumi stack output paymentRouteTableIds
pulumi stack output auditRouteTableIds

# Check routes in payment VPC
aws ec2 describe-route-tables --route-table-ids rtb-xxxxx
```

### 3. Verify Security Groups
```bash
# Get security group IDs
pulumi stack output securityGroupIds

# Check security group rules
aws ec2 describe-security-groups --group-ids sg-xxxxx
```

### 4. Verify VPC Flow Logs
```bash
# Get bucket name
BUCKET_NAME=$(pulumi stack output flowLogsBucketName)

# Check flow logs
aws ec2 describe-flow-logs --filter "Name=resource-type,Values=VPC"

# List flow log files in S3
aws s3 ls s3://$BUCKET_NAME/
```

### 5. Verify CloudWatch Alarms
```bash
# Get alarm ARN
ALARM_ARN=$(pulumi stack output peeringStatusAlarmArn)

# Check alarm status
aws cloudwatch describe-alarms --alarm-names vpc-peering-status-dev

# View dashboard
aws cloudwatch get-dashboard --dashboard-name vpc-peering-dev
```

## Testing

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run coverage
```

### Integration Tests
```bash
# Run integration tests (requires AWS credentials)
npm run test:integration
```

## Configuration Management

### Pulumi Configuration

The stack accepts the following configuration parameters:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `aws:region` | string | No | us-east-1 | AWS region for deployment |
| `paymentVpcId` | string | Yes | - | VPC ID for payment processing VPC |
| `auditVpcId` | string | Yes | - | VPC ID for audit logging VPC |
| `paymentVpcCidr` | string | No | 10.100.0.0/16 | CIDR block for payment VPC |
| `auditVpcCidr` | string | No | 10.200.0.0/16 | CIDR block for audit VPC |
| `paymentAccountId` | string | Yes | - | AWS account ID for payment account |
| `auditAccountId` | string | Yes | - | AWS account ID for audit account |
| `environment` | string | No | dev | Environment name (dev/staging/prod) |
| `dataClassification` | string | No | Sensitive | Data classification tag |
| `flowLogsRetentionDays` | number | No | 90 | S3 lifecycle retention for flow logs |

### Environment Variables

The following environment variables are supported:

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT_SUFFIX` | Suffix for resource naming | dev |
| `AWS_REGION` | AWS region override | us-east-1 |
| `REPOSITORY` | Repository name for tagging | vpc-peering-infrastructure |
| `COMMIT_AUTHOR` | Commit author for tagging | pulumi-automation |
| `PR_NUMBER` | PR number for tagging | N/A |
| `TEAM` | Team name for tagging | synth-2 |

## Cleanup

To destroy all resources:

```bash
# Preview destruction
pulumi destroy --preview

# Destroy infrastructure
pulumi destroy

# Remove stack
pulumi stack rm dev
```

**Important Notes:**
- The S3 bucket must be empty before destruction
- VPC Flow Logs will be deleted
- Route table entries will be removed
- Security group rules will be deleted

## Troubleshooting

### Common Issues

#### 1. VPC Peering Connection Not Active
**Symptom:** Peering connection stuck in "pending-acceptance"
**Solution:**
- Verify `autoAccept` is set to true for same-account peering
- For cross-account peering, manually accept in the accepter account
- Check IAM permissions for cross-account peering

#### 2. Route Table Updates Failing
**Symptom:** Route creation fails with "already exists" error
**Solution:**
- Pulumi will automatically handle existing routes
- If manual routes exist, remove them before deployment
- Check for route conflicts with existing CIDR blocks

#### 3. Security Group Rules Not Applied
**Symptom:** Traffic not flowing between VPCs
**Solution:**
- Verify security group rules are created (ingress and egress)
- Check NACL rules allow traffic
- Verify route tables have peering routes
- Test with EC2 instances in both VPCs

#### 4. Flow Logs Not Appearing in S3
**Symptom:** S3 bucket is empty
**Solution:**
- Wait 10-15 minutes for first logs to appear
- Verify IAM role has correct permissions
- Check VPC Flow Logs status in console
- Ensure bucket policy allows flow logs service

#### 5. Cross-Account Peering Fails
**Symptom:** Peering connection fails with permission errors
**Solution:**
- Verify IAM role exists in accepter account
- Check trust relationship allows requester account
- Verify external ID matches configuration
- Review CloudTrail logs for detailed error messages

## Security Considerations

1. **Network Isolation:** Traffic is restricted to specific ports (443, 5432) and CIDR blocks
2. **Encryption:** Flow logs stored in encrypted S3 bucket (AES256)
3. **Access Control:** Security groups and NACLs provide defense in depth
4. **Monitoring:** CloudWatch alarms and dashboards for visibility
5. **Compliance:** Comprehensive tagging for audit and cost tracking
6. **Cross-Account:** Secure IAM roles with external ID for cross-account access
7. **DNS Resolution:** Private hosted zones accessible across peered VPCs

## Cost Optimization

- **VPC Peering:** No data transfer charges for same-region peering
- **Flow Logs:** S3 lifecycle policies reduce storage costs (IA → Glacier → Expiration)
- **CloudWatch:** 30-day retention reduces long-term costs
- **SNS:** Pay per notification (minimal cost)
- **S3:** Use lifecycle policies and monitor bucket size

## Compliance

This infrastructure supports the following compliance requirements:

- **Data Classification:** All resources tagged with classification level
- **Business Unit Tracking:** Separate tags for Payment and Audit units
- **Environment Segregation:** Clear environment tagging (dev/staging/prod)
- **Audit Trail:** VPC Flow Logs capture all network traffic
- **Cost Center Tracking:** Tags support chargeback models
- **Encrypted Storage:** S3 encryption for all flow logs

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Account 1                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Payment VPC (10.100.0.0/16)                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   Subnet 1   │  │   Subnet 2   │  │   Subnet 3   │     │ │
│  │  │   (AZ-1a)    │  │   (AZ-1b)    │  │   (AZ-1c)    │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │          │                  │                  │            │ │
│  │  ┌───────────────────────────────────────────────────┐     │ │
│  │  │           Route Tables (Multiple)                 │     │ │
│  │  │  Route: 10.200.0.0/16 → VPC Peering Connection   │     │ │
│  │  └───────────────────────────────────────────────────┘     │ │
│  │          │                                                  │ │
│  │  ┌───────────────────────────────────────────────────┐     │ │
│  │  │  Security Group (payment-vpc-peering-sg)          │     │ │
│  │  │  - Allow 443 from 10.200.0.0/16                   │     │ │
│  │  │  - Allow 5432 from 10.200.0.0/16                  │     │ │
│  │  └───────────────────────────────────────────────────┘     │ │
│  │          │                                                  │ │
│  │  ┌───────────────────────────────────────────────────┐     │ │
│  │  │  Network ACL                                       │     │ │
│  │  │  - Rule 200: Allow 443 from 10.200.0.0/16         │     │ │
│  │  │  - Rule 201: Allow 5432 from 10.200.0.0/16        │     │ │
│  │  └───────────────────────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                            │                                      │
│                            │ VPC Peering Connection               │
│                            │ (DNS Resolution Enabled)             │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────────┐
│                         AWS Account 2                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Audit VPC (10.200.0.0/16)                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   Subnet 1   │  │   Subnet 2   │  │   Subnet 3   │     │ │
│  │  │   (AZ-1a)    │  │   (AZ-1b)    │  │   (AZ-1c)    │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │          │                  │                  │            │ │
│  │  ┌───────────────────────────────────────────────────┐     │ │
│  │  │           Route Tables (Multiple)                 │     │ │
│  │  │  Route: 10.100.0.0/16 → VPC Peering Connection   │     │ │
│  │  └───────────────────────────────────────────────────┘     │ │
│  │          │                                                  │ │
│  │  ┌───────────────────────────────────────────────────┐     │ │
│  │  │  Security Group (audit-vpc-peering-sg)            │     │ │
│  │  │  - Allow 443 from 10.100.0.0/16                   │     │ │
│  │  │  - Allow 5432 from 10.100.0.0/16                  │     │ │
│  │  └───────────────────────────────────────────────────┘     │ │
│  │          │                                                  │ │
│  │  ┌───────────────────────────────────────────────────┐     │ │
│  │  │  Network ACL                                       │     │ │
│  │  │  - Rule 200: Allow 443 from 10.100.0.0/16         │     │ │
│  │  │  - Rule 201: Allow 5432 from 10.100.0.0/16        │     │ │
│  │  └───────────────────────────────────────────────────┘     │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

Supporting Services:
┌─────────────────────────────────────────────────────────────────┐
│  S3 Bucket (vpc-flow-logs-peering-dev)                          │
│  - VPC Flow Logs from both VPCs                                 │
│  - Lifecycle: 30d → IA, 60d → Glacier, 90d → Delete            │
│  - Encrypted: AES256                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CloudWatch                                                      │
│  - Alarm: vpc-peering-status-dev                                │
│  - Dashboard: vpc-peering-dev                                   │
│  - Log Group: /aws/vpc-peering/dev                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SNS Topic (vpc-peering-alarms-dev)                             │
│  - Notifications for peering status changes                     │
└─────────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Use Environment Suffixes:** Always set `ENVIRONMENT_SUFFIX` for parallel testing and multi-environment deployments
2. **Monitor Costs:** Review S3 bucket sizes and CloudWatch metrics regularly
3. **Review Flow Logs:** Periodically audit flow logs for security anomalies
4. **Tag Resources:** Maintain consistent tagging for cost allocation and compliance
5. **Test Connectivity:** After deployment, test connectivity between VPCs
6. **Document Changes:** Keep configuration changes documented and version controlled
7. **Backup Configuration:** Store Pulumi state in secure backend (S3, Pulumi Service)

## References

- [AWS VPC Peering](https://docs.aws.amazon.com/vpc/latest/peering/)
- [Pulumi AWS Provider](https://www.pulumi.com/registry/packages/aws/)
- [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)
- [Security Groups](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
- [Network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)

## Support

For issues or questions:
1. Review the Troubleshooting section above
2. Check Pulumi logs: `pulumi logs`
3. Review CloudWatch logs and alarms
4. Check AWS CloudTrail for API errors

## License

MIT License - See LICENSE file for details

## Authors

TAP Infrastructure Team - synth-2
