# Production VPC Network Architecture

CloudFormation template for deploying a production-grade VPC network architecture for financial services applications with multi-AZ high availability.

## Architecture Overview

This infrastructure creates:

- VPC with CIDR block 10.0.0.0/16 and DNS hostnames enabled
- 6 subnets across 3 availability zones (us-east-1a, 1b, 1c)
  - 3 public subnets for internet-facing resources
  - 3 private subnets for backend systems
- Internet Gateway for public subnet internet access
- 3 NAT Gateways with Elastic IPs (one per AZ) for high availability
- Separate route tables for public and private subnets
- VPC Flow Logs to CloudWatch Logs with 30-day retention
- IAM role for VPC Flow Logs permissions
- Custom Network ACLs with explicit rules for ports 80, 443, and 22
- Mappings section for regional subnet CIDR consistency

## Requirements

All 9 mandatory requirements are implemented:

1. VPC with CIDR 10.0.0.0/16 and DNS hostnames enabled
2. 6 subnets across 3 AZs (3 public, 3 private)
3. Internet Gateway with proper route table configuration
4. 3 NAT Gateways with Elastic IPs in each public subnet
5. Separate route tables for public and private subnets
6. VPC Flow Logs to CloudWatch with 30-day retention and IAM role
7. Custom Network ACLs with explicit inbound/outbound rules
8. Mappings section for subnet CIDRs across regions
9. Consistent tagging with Environment and Department keys

## Constraints Met

All 9 constraints are satisfied:

1. VPC CIDR is exactly 10.0.0.0/16
2. Each AZ has exactly one public and one private subnet
3. NAT Gateways deployed in high-availability mode (one per AZ)
4. Private subnets route through NAT Gateway in same AZ
5. VPC Flow Logs enabled with 30-day CloudWatch retention
6. Network ACLs allow only ports 80, 443, 22
7. All resources tagged with Environment and Department
8. Resource names follow pattern: {ResourceType}-{AZ}-{Environment}
9. Template uses Mappings for subnet CIDR blocks

## Parameters

The template accepts the following parameters:

- **EnvironmentSuffix**: Environment suffix for resource naming (default: "dev")
  - Used to create unique resource names for multiple deployments
  - Must be alphanumeric characters only

- **Environment**: Environment name for tagging (default: "production")
  - Used for cost allocation and resource organization

- **Department**: Department name for cost allocation (default: "finance")
  - Used for tracking departmental costs

## Deployment Instructions

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create VPC, subnets, NAT Gateways, IAM roles, and CloudWatch resources
- Sufficient Elastic IP quota (requires 3 EIPs)

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name vpc-network-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=Department,ParameterValue=finance \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-network-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-network-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### Update the Stack

If you need to modify the stack:

```bash
aws cloudformation update-stack \
  --stack-name vpc-network-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=Department,ParameterValue=finance \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### Clean Up

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name vpc-network-dev \
  --region us-east-1
```

Wait for deletion to complete:

```bash
aws cloudformation wait stack-delete-complete \
  --stack-name vpc-network-dev \
  --region us-east-1
```

## Outputs

The stack exports the following outputs:

- **VPCID**: The ID of the created VPC
- **PublicSubnet1ID**: Public subnet in us-east-1a
- **PublicSubnet2ID**: Public subnet in us-east-1b
- **PublicSubnet3ID**: Public subnet in us-east-1c
- **PrivateSubnet1ID**: Private subnet in us-east-1a
- **PrivateSubnet2ID**: Private subnet in us-east-1b
- **PrivateSubnet3ID**: Private subnet in us-east-1c
- **NATGateway1IP**: Elastic IP for NAT Gateway 1
- **NATGateway2IP**: Elastic IP for NAT Gateway 2
- **NATGateway3IP**: Elastic IP for NAT Gateway 3

## Network Configuration

### Subnet CIDR Blocks (us-east-1)

- Public Subnet 1 (us-east-1a): 10.0.0.0/24
- Public Subnet 2 (us-east-1b): 10.0.1.0/24
- Public Subnet 3 (us-east-1c): 10.0.2.0/24
- Private Subnet 1 (us-east-1a): 10.0.10.0/24
- Private Subnet 2 (us-east-1b): 10.0.11.0/24
- Private Subnet 3 (us-east-1c): 10.0.12.0/24

### Routing

**Public Subnets**:
- Route 0.0.0.0/0 → Internet Gateway
- Allow inbound/outbound internet traffic

**Private Subnets**:
- Route 0.0.0.0/0 → NAT Gateway (same AZ)
- Outbound internet access only
- No direct inbound internet access

### Network ACLs

**Inbound Rules**:
- Rule 100: Allow TCP port 80 (HTTP) from 0.0.0.0/0
- Rule 110: Allow TCP port 443 (HTTPS) from 0.0.0.0/0
- Rule 120: Allow TCP port 22 (SSH) from 10.0.0.0/8

**Outbound Rules**:
- Rule 100: Allow all traffic to 0.0.0.0/0

## VPC Flow Logs

VPC Flow Logs are enabled and configured to:
- Capture ALL traffic (accepted and rejected)
- Send logs to CloudWatch Logs group: `/aws/vpc/flowlogs`
- Retain logs for 30 days
- Use IAM role with CloudWatch Logs permissions

## Cost Considerations

This infrastructure includes:
- 3 NAT Gateways (approximately $0.045/hour each = $97/month total)
- 3 Elastic IPs (no charge while attached to NAT Gateways)
- CloudWatch Logs storage (charged based on retention and volume)
- Data transfer charges for NAT Gateway traffic

Estimated monthly cost: $100-150 (excluding data transfer)

## Security Best Practices

This template follows security best practices:

1. Private subnets for backend systems with no direct internet access
2. NAT Gateways for controlled outbound traffic from private subnets
3. Network ACLs for subnet-level security controls
4. VPC Flow Logs for network traffic monitoring and security analysis
5. Proper IAM role with minimal permissions for Flow Logs
6. Consistent tagging for resource tracking and compliance

## Multi-Region Support

The template includes a Mappings section for multi-region deployment. To deploy in a different region:

1. Add the region to the SubnetConfig mapping in the template
2. Define appropriate subnet CIDR blocks for that region
3. Update the AvailabilityZone properties in subnet resources
4. Deploy using `--region <region-name>` flag

## Troubleshooting

### Stack Creation Fails

**Issue**: Stack creation fails with "Elastic IP quota exceeded"
**Solution**: Request Elastic IP quota increase or remove unused EIPs

**Issue**: Stack creation fails with "NAT Gateway creation failed"
**Solution**: Ensure public subnets are properly configured and Internet Gateway is attached

**Issue**: VPC Flow Logs not appearing in CloudWatch
**Solution**: Verify IAM role permissions and CloudWatch Logs group exists

### Network Connectivity Issues

**Issue**: Private subnet instances cannot reach internet
**Solution**: Verify NAT Gateway is running and route table has correct 0.0.0.0/0 → NAT route

**Issue**: Public subnet instances cannot reach internet
**Solution**: Verify Internet Gateway attachment and route table configuration

## Support

For issues or questions:
- Review CloudFormation stack events for detailed error messages
- Check VPC Flow Logs for network traffic analysis
- Verify all resources are in the expected state using AWS Console

## License

This template is provided as-is for infrastructure deployment purposes.
