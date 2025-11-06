# Multi-AZ VPC Migration Infrastructure

This CloudFormation template creates a complete multi-AZ VPC infrastructure for migrating payment processing systems from single-AZ to highly available multi-AZ configuration.

## Architecture Overview

The template deploys:
- 1 VPC with configurable CIDR block
- 3 Public Subnets across 3 Availability Zones
- 3 Private Subnets across 3 Availability Zones
- 1 Internet Gateway
- 3 NAT Gateways (one per AZ for high availability)
- Route Tables for public and private subnets
- Security Groups for web tier (HTTPS) and database tier (PostgreSQL)
- S3 bucket for migration logs with versioning and encryption
- VPC Endpoint for S3 (cost optimization)

## Prerequisites

- AWS CLI configured with appropriate credentials
- IAM permissions for VPC, EC2, S3, and CloudFormation services
- Available Elastic IP addresses (3 required for NAT Gateways)

## Deployment Instructions

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name payment-migration-vpc \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=VpcCidr,ParameterValue=172.16.0.0/16 \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=Project,ParameterValue=payment-migration \
    ParameterKey=Owner,ParameterValue=infrastructure-team \
  --region us-east-1
```

### Using AWS Console

1. Navigate to CloudFormation in AWS Console
2. Click "Create Stack" > "With new resources"
3. Upload the `lib/TapStack.json` template
4. Fill in the parameters:
   - **VpcCidr**: CIDR block for VPC (default: 172.16.0.0/16)
   - **EnvironmentSuffix**: Unique suffix for resource naming (e.g., prod-001)
   - **Environment**: Environment name (development/staging/production)
   - **Project**: Project name for cost allocation
   - **Owner**: Team or individual responsible for resources
5. Review and create the stack

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| VpcCidr | String | 172.16.0.0/16 | CIDR block for the VPC |
| EnvironmentSuffix | String | (required) | Unique suffix for resource naming |
| Environment | String | production | Environment name for tagging |
| Project | String | payment-migration | Project name for cost allocation |
| Owner | String | (required) | Team or individual owner |

## Outputs

The template exports the following outputs for use in subsequent migration steps:

| Output | Description |
|--------|-------------|
| VPCId | VPC ID for the new multi-AZ environment |
| PublicSubnetAId | Public Subnet A ID in first AZ |
| PublicSubnetBId | Public Subnet B ID in second AZ |
| PublicSubnetCId | Public Subnet C ID in third AZ |
| PrivateSubnetAId | Private Subnet A ID in first AZ |
| PrivateSubnetBId | Private Subnet B ID in second AZ |
| PrivateSubnetCId | Private Subnet C ID in third AZ |
| WebTierSecurityGroupId | Security Group ID for web tier |
| DatabaseTierSecurityGroupId | Security Group ID for database tier |
| MigrationLogsBucketName | S3 bucket name for migration logs |
| MigrationLogsBucketArn | S3 bucket ARN for migration logs |
| S3VPCEndpointId | VPC Endpoint ID for S3 service |

## Security Features

1. **Least Privilege Security Groups**: Database tier only accepts connections from web tier
2. **Private Subnets**: Database and sensitive resources isolated from internet
3. **NAT Gateways**: Outbound internet access for private resources without direct exposure
4. **S3 Encryption**: Migration logs encrypted at rest with AWS managed keys
5. **VPC Endpoints**: S3 access without traversing public internet

## Cost Optimization

- **VPC Endpoint for S3**: Reduces data transfer costs by keeping traffic within AWS network
- **Multi-AZ NAT Gateways**: While more expensive, provides high availability required for production payment processing

## Validation

After deployment, verify the stack:

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name payment-migration-vpc \
  --region us-east-1

# List stack outputs
aws cloudformation describe-stacks \
  --stack-name payment-migration-vpc \
  --query 'Stacks[0].Outputs' \
  --region us-east-1

# Verify VPC
aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=vpc-*" \
  --region us-east-1

# Verify NAT Gateways are active
aws ec2 describe-nat-gateways \
  --filter "Name=state,Values=available" \
  --region us-east-1
```

## Next Steps

After successful deployment:

1. Use the VPC ID and subnet IDs to launch EC2 instances
2. Create RDS instances in private subnets using the database security group
3. Configure application load balancers in public subnets
4. Migrate data from legacy VPC to new infrastructure
5. Update DNS records to point to new environment
6. Decommission legacy single-AZ infrastructure

## Cleanup

To delete the stack and all resources:

```bash
# Empty S3 bucket first (versioned buckets require special handling)
aws s3 rm s3://migration-logs-<environment-suffix> --recursive
aws s3api delete-bucket-versioning \
  --bucket migration-logs-<environment-suffix>

# Delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name payment-migration-vpc \
  --region us-east-1
```

## Tags

All resources are tagged with:
- **Environment**: Environment name (production/staging/development)
- **Project**: Project name for cost allocation
- **Owner**: Team or individual responsible for resources

These tags enable cost tracking and resource management across the organization.
