# Production VPC Infrastructure

This CDK application deploys a production-grade VPC infrastructure for financial services applications with comprehensive security controls and high availability.

## Architecture

### Network Design
- **VPC**: 10.0.0.0/16 CIDR across 3 availability zones (us-east-1a, us-east-1b, us-east-1c)
- **Public Subnets**: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24 (one per AZ)
- **Private Subnets**: 10.0.128.0/24, 10.0.129.0/24, 10.0.130.0/24 (one per AZ)
- **NAT Gateways**: One per AZ for high availability (3 total)
- **Internet Gateway**: Single IGW for all public subnets

### Security Controls

#### VPC Flow Logs
- Captures ALL traffic (accepted, rejected, and all)
- Sends logs to CloudWatch Logs
- Retention: 30 days
- Log group: `/aws/vpc/flowlogs/{environmentSuffix}`

#### Network ACLs
- Public subnet NACL explicitly denies SSH (port 22) from 0.0.0.0/0
- All other traffic allowed for flexibility
- Rule priority ensures SSH denial takes precedence

#### Security Groups
- **Web Tier**: Allows HTTP (80) and HTTPS (443) from anywhere (0.0.0.0/0)
- **App Tier**: Allows HTTP (80) and HTTPS (443) only from web tier security group
- Both security groups allow all outbound traffic

### Routing

#### Route Tables
All route tables follow the naming pattern: `{environment}-{az}-{type}-rt-{suffix}`

- **Public Route Tables**: One per AZ, routes to Internet Gateway
- **Private Route Tables**: One per AZ, routes to respective NAT Gateway in same AZ

### Resource Tagging
All resources are tagged with:
- `Environment`: production
- `Project`: financial-app
- `ManagedBy`: cdk
- `Name`: Descriptive name with environmentSuffix

## Prerequisites

- AWS CDK 2.x installed (`npm install -g aws-cdk`)
- Node.js 16+ and npm
- AWS CLI configured with appropriate credentials
- TypeScript installed (`npm install -g typescript`)

## Installation

```bash
npm install
```

## Deployment

### Deploy with default environment suffix (dev)
```bash
cdk deploy
```

### Deploy with custom environment suffix
```bash
cdk deploy -c environmentSuffix=prod
```

### Synthesize CloudFormation template
```bash
cdk synth
```

### View differences before deployment
```bash
cdk diff
```

## Stack Outputs

After deployment, the stack exports the following outputs:

- **VpcId**: The VPC ID
- **VpcCidr**: The VPC CIDR block (10.0.0.0/16)
- **PublicSubnet1Id, PublicSubnet2Id, PublicSubnet3Id**: Public subnet IDs
- **PrivateSubnet1Id, PrivateSubnet2Id, PrivateSubnet3Id**: Private subnet IDs
- **WebSecurityGroupId**: Web tier security group ID
- **AppSecurityGroupId**: App tier security group ID
- **AvailabilityZones**: Comma-separated list of AZs used

## Usage Examples

### Reference VPC in another stack
```typescript
const vpcId = cdk.Fn.importValue(`VpcId-${environmentSuffix}`);
const vpc = ec2.Vpc.fromLookup(this, 'ImportedVpc', {
  vpcId: vpcId,
});
```

### Use security groups in EC2 instances
```typescript
const webSgId = cdk.Fn.importValue(`WebSecurityGroupId-${environmentSuffix}`);
const webSg = ec2.SecurityGroup.fromSecurityGroupId(this, 'WebSG', webSgId);
```

## Cost Considerations

### Expected Monthly Costs (us-east-1)
- **NAT Gateways**: ~$97.20 (3 gateways × $0.045/hour × 730 hours)
- **NAT Gateway Data**: Variable based on usage (~$0.045/GB processed)
- **VPC Flow Logs**: Variable based on traffic volume
- **CloudWatch Logs**: ~$0.50/GB ingested, ~$0.03/GB storage

**Total Estimated Cost**: ~$100-150/month plus data transfer charges

### Cost Optimization Options
For development/testing environments:
- Reduce NAT Gateways to 1 (saves ~$65/month)
- Disable VPC Flow Logs (saves log storage costs)
- Use shorter retention periods

## Security Best Practices

1. **Least Privilege**: Security groups follow least-privilege principle
2. **SSH Protection**: Network ACLs deny SSH from internet
3. **Logging**: VPC Flow Logs enabled for compliance and troubleshooting
4. **Encryption**: Flow logs can be sent to encrypted log groups
5. **No Public IPs**: Private subnets don't auto-assign public IPs

## Compliance Features

- VPC Flow Logs for audit trails
- Network segmentation with security groups
- Explicit SSH denial from public internet
- Resource tagging for governance
- Multi-AZ deployment for business continuity

## Troubleshooting

### VPC Flow Logs not appearing
- Check IAM role permissions
- Verify log group exists
- Check flow log status in VPC console

### NAT Gateway connectivity issues
- Verify Elastic IP allocation
- Check route table associations
- Ensure NAT Gateway is in public subnet

### Security group rules not working
- Verify security group IDs are correct
- Check for rule precedence issues
- Review VPC Flow Logs for traffic patterns

## Cleanup

To destroy all resources:
```bash
cdk destroy
```

Note: NAT Gateway Elastic IPs will be released automatically.

## References

- [AWS VPC Documentation](https://docs.aws.amazon.com/vpc/)
- [AWS CDK VPC Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html)
- [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)
- [Network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)
