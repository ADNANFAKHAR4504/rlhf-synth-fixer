# Hub-and-Spoke Network Architecture with AWS Transit Gateway

This CloudFormation template creates a complete hub-and-spoke network architecture using AWS Transit Gateway for centralized routing and controlled inter-VPC communication.

## Architecture Overview

### Network Topology

```
                    Internet
                        |
                   [Hub VPC]
                  (10.0.0.0/16)
                        |
                 3 NAT Gateways
                        |
                [Transit Gateway]
                   /         \
                  /           \
           [Spoke VPC 1]  [Spoke VPC 2]
          (10.1.0.0/16)  (10.2.0.0/16)
```

### Key Features

- **Hub VPC**: 10.0.0.0/16 with 3 public subnets across 3 availability zones
- **Spoke VPC 1**: 10.1.0.0/16 with 3 private subnets across 3 availability zones
- **Spoke VPC 2**: 10.2.0.0/16 with 3 private subnets across 3 availability zones
- **Transit Gateway**: Central routing hub connecting all VPCs
- **Hub-Spoke Isolation**: Spokes can only communicate with hub, not with each other
- **Centralized Internet Access**: All spoke internet traffic routes through hub NAT Gateways
- **VPC Endpoints**: Systems Manager endpoints in all VPCs for private management
- **VPC Flow Logs**: Comprehensive network traffic logging to S3 in Parquet format
- **Security Groups**: HTTPS and SSH access control between VPCs

## Infrastructure Components

### Networking (79 Resources)

#### Hub VPC
- 1 VPC (10.0.0.0/16)
- 3 Public Subnets (across 3 AZs)
- 1 Internet Gateway
- 3 NAT Gateways with Elastic IPs
- 1 Public Route Table

#### Spoke VPCs
- 2 VPCs (10.1.0.0/16, 10.2.0.0/16)
- 6 Private Subnets (3 per spoke, across 3 AZs)
- 6 Private Route Tables (3 per spoke)

#### Transit Gateway
- 1 Transit Gateway
- 3 VPC Attachments (hub + 2 spokes)
- 2 Transit Gateway Route Tables (hub, spoke)
- Route table associations and propagations for hub-spoke isolation

#### Security Groups
- 1 HTTPS Security Group (hub)
- 1 SSH Security Group (hub)
- 2 HTTPS Security Groups (spokes)
- 2 SSH Security Groups (spokes)
- 3 VPC Endpoint Security Groups

#### VPC Endpoints
- 9 Interface Endpoints (3 per VPC):
  - Systems Manager (SSM)
  - SSM Messages
  - EC2 Messages

#### Monitoring
- 1 S3 Bucket for VPC Flow Logs
- 1 S3 Bucket Policy
- 3 VPC Flow Logs (one per VPC)

## Prerequisites

- AWS CLI 2.x configured with appropriate credentials
- IAM permissions to create:
  - VPC, Subnets, Route Tables
  - Transit Gateway and attachments
  - NAT Gateways and Elastic IPs
  - VPC Endpoints
  - Security Groups
  - S3 Buckets
  - VPC Flow Logs
- Service limits:
  - VPCs: 3+ available
  - Transit Gateways: 1+ available
  - NAT Gateways: 3+ available
  - Elastic IPs: 3+ available

## Deployment

### Step 1: Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.yml \
  --region us-east-1
```

### Step 2: Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name hub-spoke-network-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=HubVpcCidr,ParameterValue=10.0.0.0/16 \
    ParameterKey=Spoke1VpcCidr,ParameterValue=10.1.0.0/16 \
    ParameterKey=Spoke2VpcCidr,ParameterValue=10.2.0.0/16 \
  --tags \
    Key=Environment,Value=dev \
    Key=CostCenter,Value=networking \
    Key=DataClassification,Value=internal \
  --region us-east-1
```

### Step 3: Monitor Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name hub-spoke-network-dev \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1

# Watch stack events
aws cloudformation describe-stack-events \
  --stack-name hub-spoke-network-dev \
  --max-items 20 \
  --region us-east-1
```

Deployment typically takes 10-15 minutes due to Transit Gateway and NAT Gateway creation.

### Step 4: Retrieve Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name hub-spoke-network-dev \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Outputs

The stack exports the following outputs for use by other stacks:

### VPC Identifiers
- `HubVpcId`: Hub VPC ID
- `Spoke1VpcId`: Spoke VPC 1 ID
- `Spoke2VpcId`: Spoke VPC 2 ID

### Subnet Identifiers
- `HubPublicSubnet1Id`, `HubPublicSubnet2Id`, `HubPublicSubnet3Id`
- `Spoke1PrivateSubnet1Id`, `Spoke1PrivateSubnet2Id`, `Spoke1PrivateSubnet3Id`
- `Spoke2PrivateSubnet1Id`, `Spoke2PrivateSubnet2Id`, `Spoke2PrivateSubnet3Id`

### Transit Gateway
- `TransitGatewayId`: Transit Gateway ID
- `HubTgwRouteTableId`: Hub Transit Gateway route table ID
- `SpokeTgwRouteTableId`: Spoke Transit Gateway route table ID

### Route Tables
- `HubPublicRouteTableId`: Hub public route table ID
- `Spoke1PrivateRouteTable1Id`: Spoke 1 private route table ID
- `Spoke2PrivateRouteTable1Id`: Spoke 2 private route table ID

### Security Groups
- `HttpsSecurityGroupId`: HTTPS security group ID
- `SshFromHubSecurityGroupId`: SSH from hub security group ID

### Monitoring
- `FlowLogsBucketName`: VPC Flow Logs S3 bucket name

### NAT Gateways
- `HubNatGateway1Id`, `HubNatGateway2Id`, `HubNatGateway3Id`

## Testing and Verification

### Verify Transit Gateway Attachments

```bash
aws ec2 describe-transit-gateway-attachments \
  --filters "Name=state,Values=available" \
  --region us-east-1
```

### Verify Transit Gateway Route Tables

```bash
# Get Transit Gateway ID
TGW_ID=$(aws cloudformation describe-stacks \
  --stack-name hub-spoke-network-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`TransitGatewayId`].OutputValue' \
  --output text \
  --region us-east-1)

# Check route tables
aws ec2 describe-transit-gateway-route-tables \
  --filters "Name=transit-gateway-id,Values=$TGW_ID" \
  --region us-east-1
```

### Verify VPC Endpoints

```bash
# Get Spoke 1 VPC ID
SPOKE1_VPC=$(aws cloudformation describe-stacks \
  --stack-name hub-spoke-network-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`Spoke1VpcId`].OutputValue' \
  --output text \
  --region us-east-1)

# List VPC endpoints in Spoke 1
aws ec2 describe-vpc-endpoints \
  --filters "Name=vpc-id,Values=$SPOKE1_VPC" \
  --region us-east-1
```

### Verify VPC Flow Logs

```bash
# Get Flow Logs bucket name
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name hub-spoke-network-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`FlowLogsBucketName`].OutputValue' \
  --output text \
  --region us-east-1)

# List Flow Logs in S3 (after some traffic flows)
aws s3 ls s3://$BUCKET/ --recursive --region us-east-1
```

### Test Connectivity

To test hub-spoke connectivity, you can:

1. Launch EC2 instances in each VPC
2. Use Systems Manager Session Manager to connect (no SSH keys needed)
3. Test connectivity:
   - From hub to spoke 1: Should work
   - From hub to spoke 2: Should work
   - From spoke 1 to hub: Should work
   - From spoke 1 to internet: Should work (via hub NAT)
   - From spoke 1 to spoke 2: Should NOT work (blocked by Transit Gateway routing)

## Architecture Details

### Hub-and-Spoke Routing

The architecture implements true hub-spoke isolation using separate Transit Gateway route tables:

- **Hub Route Table**: Associated with hub VPC attachment, propagates routes from both spoke VPCs
- **Spoke Route Table**: Associated with both spoke VPC attachments, propagates routes only from hub VPC

This ensures:
- Hub can reach both spokes ✅
- Spoke 1 can reach hub ✅
- Spoke 2 can reach hub ✅
- Spoke 1 cannot reach spoke 2 ❌

### Internet Access Flow

Spoke VPCs access the internet through this path:

1. Spoke instance → Spoke subnet default route (0.0.0.0/0)
2. Route points to Transit Gateway
3. Transit Gateway routes to hub VPC
4. Hub VPC routes to NAT Gateway
5. NAT Gateway forwards to Internet Gateway
6. Return traffic follows reverse path

### VPC Endpoints for Management

All VPCs include interface endpoints for:
- `com.amazonaws.region.ssm` - Systems Manager
- `com.amazonaws.region.ssmmessages` - Session Manager messaging
- `com.amazonaws.region.ec2messages` - EC2 messaging

Benefits:
- Private access to AWS Systems Manager
- No internet gateway required for instance management
- Reduced data transfer costs
- Improved security posture

### VPC Flow Logs

Flow logs are configured with:
- **Destination**: S3 bucket with server-side encryption
- **Format**: Parquet (efficient for querying with AWS Athena)
- **Partitioning**: Per-hour partitions
- **Traffic Type**: ALL (accepted and rejected)

Query logs using AWS Athena for:
- Security analysis
- Compliance reporting
- Troubleshooting connectivity issues
- Cost optimization

## Cost Considerations

### Monthly Costs (us-east-1, approximate)

- **Transit Gateway**: $36.50 (1 TGW × $0.05/hour)
- **Transit Gateway Attachments**: $109.50 (3 attachments × $0.05/hour)
- **NAT Gateways**: $97.92 (3 NAT × $0.045/hour)
- **VPC Endpoints**: $21.60 (9 endpoints × $0.01/hour)
- **Data Transfer**: Variable based on usage
- **S3 Storage**: Variable based on Flow Logs volume

**Estimated Total**: ~$265/month (excluding data transfer and storage)

### Cost Optimization Tips

1. Use fewer NAT Gateways (1 instead of 3) if high availability isn't critical
2. Remove VPC endpoints if Systems Manager isn't required
3. Configure Flow Logs sampling if full traffic capture isn't needed
4. Use S3 Intelligent-Tiering for Flow Logs bucket
5. Set up S3 lifecycle policies to archive or delete old logs

## Security Best Practices

### Implemented

✅ Hub-spoke network isolation via Transit Gateway route tables
✅ Security groups restrict traffic to HTTPS and SSH
✅ SSH access only from hub to spokes
✅ VPC endpoints for private AWS service access
✅ S3 bucket encryption for Flow Logs
✅ S3 public access blocking
✅ All resources tagged for compliance tracking
✅ DeletionPolicy: Delete for clean teardown

### Recommended Additions

- Enable AWS Config for configuration compliance
- Set up CloudWatch alarms for VPC Flow Logs anomalies
- Implement AWS Network Firewall for deep packet inspection
- Use AWS GuardDuty for threat detection
- Enable VPC Traffic Mirroring for advanced monitoring
- Implement least-privilege IAM policies
- Use AWS Secrets Manager for storing credentials
- Enable MFA for all administrative access

## Troubleshooting

### Transit Gateway Attachment Not Available

Check attachment state:
```bash
aws ec2 describe-transit-gateway-attachments \
  --filters "Name=transit-gateway-id,Values=$TGW_ID" \
  --region us-east-1
```

Attachment creation can take 5-10 minutes. Wait for state to become "available".

### Spoke Cannot Reach Internet

1. Verify Transit Gateway route in spoke route table
2. Check NAT Gateway is active in hub VPC
3. Verify Transit Gateway route table propagation
4. Check security group allows outbound traffic

### VPC Endpoints Not Working

1. Verify private DNS is enabled
2. Check security group allows HTTPS (443)
3. Ensure subnets have route table associations
4. Verify endpoint is in "available" state

### Flow Logs Not Appearing in S3

1. Check VPC Flow Log status is "ACTIVE"
2. Verify S3 bucket policy allows log delivery service
3. Wait 10-15 minutes for first logs to appear
4. Check S3 bucket region matches VPC region

## Cleanup

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name hub-spoke-network-dev \
  --region us-east-1
```

### Monitor Deletion

```bash
aws cloudformation describe-stacks \
  --stack-name hub-spoke-network-dev \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

Deletion typically takes 5-10 minutes. NAT Gateways and Transit Gateway deletion are the slowest operations.

### Manual Cleanup (if needed)

If stack deletion fails, manually delete in this order:

1. VPC Flow Logs
2. VPC Endpoints
3. Transit Gateway Route Table associations
4. Transit Gateway Attachments
5. Transit Gateway
6. NAT Gateways
7. Elastic IPs
8. Route Tables
9. Subnets
10. Internet Gateway
11. VPCs
12. S3 Bucket (must be empty)

## Multi-Region Deployment

To deploy this architecture in multiple regions:

1. Change `--region` parameter in CLI commands
2. Update VPC CIDR blocks to avoid conflicts if using VPN/Direct Connect
3. Consider using AWS Transit Gateway Peering for inter-region connectivity
4. Replicate Flow Logs S3 bucket to central region for analysis

## References

- [AWS Transit Gateway Documentation](https://docs.aws.amazon.com/vpc/latest/tgw/)
- [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)
- [VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [CloudFormation VPC Resources](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpc.html)

## License

This CloudFormation template is provided as-is for demonstration and training purposes.
