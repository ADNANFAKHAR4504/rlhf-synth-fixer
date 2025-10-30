# AWS Environment Migration Infrastructure - Pulumi TypeScript Implementation

I'll create a comprehensive Pulumi TypeScript solution for migrating your development environment with enhanced security configurations.

## File: lib/index.ts

The complete implementation in `lib/index.ts` provides:

**Architecture Overview:**
- VPC (10.0.0.0/16) with DNS support enabled
- 2 public subnets (10.0.1.0/24, 10.0.2.0/24) across 2 AZs for NAT Gateways
- 2 private subnets (10.0.11.0/24, 10.0.12.0/24) across 2 AZs for applications
- Internet Gateway for public subnet connectivity
- NAT Gateway with Elastic IP for private subnet internet access
- VPC Endpoint (Gateway type) for S3 to avoid internet traffic

**Security Configuration:**
- EC2 Security Group with all egress allowed
- RDS Security Group allowing MySQL (3306) only from EC2 security group
- All resources deployed in private subnets (EC2, RDS)
- No public IP addresses on EC2 instances

**Database Layer:**
- RDS MySQL 8.0 (db.t3.micro) with storage encryption
- Multi-AZ subnet group spanning both private subnets
- Automated backups with 7-day retention
- skipFinalSnapshot: true for destroyability
- Not publicly accessible

**Compute Layer:**
- 2 x EC2 t3.medium instances running Amazon Linux 2
- Deployed in separate private subnets for HA
- IAM instance profile attached with S3 permissions
- No public IP addresses assigned

**Storage Layer:**
- S3 bucket with versioning enabled
- Server-side encryption (AES256)
- IAM roles for EC2 access and replication

**IAM Configuration:**
- EC2 role with least-privilege S3 permissions (GetObject, PutObject, ListBucket)
- Instance profile for EC2 associations
- S3 replication role with cross-account trust policy

**Resource Naming:**
- All resources include `environmentSuffix` parameter
- Pattern: `{resource-type}-{environmentSuffix}`
- Enables parallel deployments without conflicts

**Tagging:**
- Environment: dev
- MigrationDate: current date (YYYY-MM-DD)
- Name: includes environmentSuffix

**Exports:**
- vpcId, publicSubnetIds, privateSubnetIds
- rdsEndpoint, rdsAddress
- ec2Instance1PrivateIp, ec2Instance2PrivateIp
- s3BucketName, s3BucketArn
- natGatewayPublicIp, s3VpcEndpointId

## File: lib/Pulumi.yaml

```yaml
name: migration-infrastructure
runtime: nodejs
description: AWS Environment Migration Infrastructure with Pulumi TypeScript
config:
  environmentSuffix:
    description: Environment suffix for resource naming
```

## Configuration

Set configuration values:
```bash
pulumi config set environmentSuffix <value>
pulumi config set --secret dbPassword <password>
pulumi config set aws:region us-east-1
```

## Deployment

```bash
cd lib
pulumi up --yes
```

## Key Features

1. **High Availability**: Multi-AZ deployment for subnets, EC2 instances, and RDS
2. **Security**: Private subnets, security groups, VPC endpoints, no public IPs
3. **Encryption**: Storage encryption for RDS and S3 (AES256)
4. **Backup**: 7-day automated backup retention for RDS
5. **IAM**: Least-privilege policies for EC2 S3 access
6. **Cost Optimization**: t3.micro RDS, t3.medium EC2
7. **Destroyability**: skipFinalSnapshot=true, no Retain policies

## Migration Notes

For database snapshot import:
1. Share snapshot from source account to target account
2. Modify RDS resource to use `snapshotIdentifier` parameter

For S3 cross-account replication:
1. Configure source bucket replication via AWS CLI/Console
2. Use replication role ARN in source bucket configuration
