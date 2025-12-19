# Multi-AZ VPC Infrastructure - CloudFormation

This CloudFormation template deploys a production-ready multi-AZ VPC infrastructure for a financial services trading platform with high availability, security, and PCI-DSS compliance considerations.

## Architecture Overview

The infrastructure consists of:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Public Subnets**: Three subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across us-east-1a, us-east-1b, us-east-1c
- **Private Subnets**: Three subnets (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across the same AZs
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: Three NAT gateways (one per AZ) for high-availability outbound internet access from private subnets
- **Route Tables**: Separate route tables for public and private subnets with proper routing configuration
- **Security Group**: HTTPS (443) inbound access with all outbound traffic allowed

## Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create VPC, Subnet, Internet Gateway, NAT Gateway, Route Table, and Security Group resources
- AWS account with available Elastic IPs (3 required for NAT Gateways)

## Deployment Instructions

### 1. Validate the Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.yaml \
  --region us-east-1
```

### 2. Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name trading-platform-vpc-prod \
  --template-body file://lib/TapStack.yaml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --region us-east-1 \
  --tags Key=Environment,Value=Production Key=Project,Value=TradingPlatform
```

### 3. Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

Or watch events in real-time:

```bash
aws cloudformation describe-stack-events \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1 \
  --max-items 10
```

### 4. Retrieve Outputs

Once the stack is deployed successfully:

```bash
aws cloudformation describe-stacks \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Stack Outputs

The template exports the following outputs for use by other stacks:

- **VPCId**: VPC identifier
- **PublicSubnet1Id, PublicSubnet2Id, PublicSubnet3Id**: Public subnet identifiers
- **PrivateSubnet1Id, PrivateSubnet2Id, PrivateSubnet3Id**: Private subnet identifiers
- **HTTPSSecurityGroupId**: HTTPS security group identifier
- **NATGateway1Id, NATGateway2Id, NATGateway3Id**: NAT Gateway identifiers
- **VPCCidr**: VPC CIDR block

## Using Outputs in Other Stacks

Reference these outputs in other CloudFormation templates:

```yaml
Resources:
  MyResource:
    Type: AWS::SomeService::Resource
    Properties:
      VpcId: !ImportValue 'trading-platform-vpc-prod-VPC-ID'
      SubnetIds:
        - !ImportValue 'trading-platform-vpc-prod-PrivateSubnet1-ID'
        - !ImportValue 'trading-platform-vpc-prod-PrivateSubnet2-ID'
        - !ImportValue 'trading-platform-vpc-prod-PrivateSubnet3-ID'
```

## Cost Considerations

**Monthly Cost Estimate (approximate):**

- NAT Gateway (3): ~$98/month ($32.40 per NAT Gateway)
- Data Processing: Variable based on traffic (starts at $0.045/GB)
- Elastic IPs: Free when attached to running NAT Gateways
- VPC, Subnets, Route Tables, Internet Gateway: No charge

**Total estimated monthly cost**: $100-150 depending on data transfer

## Clean Up

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1
```

Monitor deletion:

```bash
aws cloudformation describe-stacks \
  --stack-name trading-platform-vpc-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

**Note**: All resources in this template are designed to be fully deletable. No DeletionPolicy: Retain is used.

## Security Considerations

1. **Network Isolation**: Private subnets have no direct internet access
2. **HTTPS Only**: Security group restricts inbound traffic to HTTPS (443)
3. **Multi-AZ Design**: Resources distributed across three availability zones for fault tolerance
4. **NAT Gateway HA**: Each AZ has its own NAT Gateway to prevent single point of failure
5. **PCI-DSS Ready**: Network segmentation supports PCI-DSS compliance requirements

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name trading-platform-vpc-prod \
     --region us-east-1
   ```

2. Common issues:
   - **Insufficient Elastic IPs**: Request limit increase if you've reached the EIP limit
   - **Service Limits**: Check VPC, subnet, and NAT Gateway limits in your account
   - **Invalid CIDR**: Ensure 10.0.0.0/16 doesn't conflict with existing VPCs

### NAT Gateway Not Working

1. Verify NAT Gateway status:
   ```bash
   aws ec2 describe-nat-gateways \
     --region us-east-1 \
     --filter "Name=vpc-id,Values=<VPC_ID>"
   ```

2. Check route table associations and routes

### Connectivity Issues

1. Verify security group rules
2. Check Network ACLs (default allows all traffic)
3. Ensure proper route table associations

## Next Steps

After deploying this VPC infrastructure, you can:

1. Deploy RDS databases in private subnets
2. Deploy Application Load Balancers in public subnets
3. Launch EC2 instances in appropriate subnets
4. Configure additional security groups for application tiers
5. Set up VPC Flow Logs for network monitoring

## Support

For issues or questions about this infrastructure:
- Review CloudFormation documentation
- Check AWS VPC best practices
- Contact your AWS support team
