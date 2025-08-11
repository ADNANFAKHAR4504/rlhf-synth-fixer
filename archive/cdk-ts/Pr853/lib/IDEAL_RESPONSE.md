# Ideal Response: Production-Grade Web Application Infrastructure

## Overview
This document describes the ideal CDK implementation for a production-grade web application infrastructure that meets all compliance and security requirements.

## Architecture Components

### 1. VPC and Networking
- **VPC**: Custom VPC in us-west-2 with DNS support enabled
- **Subnets**: 
  - 2 Public subnets across different AZs (us-west-2a, us-west-2b)
  - 2 Private subnets across different AZs (us-west-2a, us-west-2b)
- **Internet Gateway**: For public subnet internet access
- **NAT Gateway**: For private subnet outbound internet access
- **Route Tables**: Properly configured routing for public and private subnets

### 2. Compute Resources
- **EC2 Instances**: Deployed in private subnets for security
- **IAM Role**: S3 read-only access attached to EC2 instances
- **Instance Profile**: Proper IAM role attachment mechanism

### 3. Load Balancing
- **Application Load Balancer**: Deployed across public subnets in two AZs
- **Listeners**:
  - HTTP (port 80): Redirects to HTTPS
  - HTTPS (port 443): Terminates SSL and forwards to targets
- **Target Groups**: Health check configuration for EC2 instances

### 4. Database
- **RDS PostgreSQL**: Multi-AZ deployment with encryption at rest
- **Placement**: Deployed in private subnets for security
- **Backup**: Automated backups enabled

### 5. Storage and CDN
- **S3 Bucket**: 
  - Versioning enabled for data protection
  - Public access blocked
  - SSL enforcement via bucket policy
- **CloudFront Distribution**: 
  - Serves content from S3 bucket
  - HTTPS redirection enforced
  - SSL certificate integration

### 6. Security
- **Security Groups**:
  - ALB Security Group: HTTP (80) and HTTPS (443) from internet
  - EC2 Security Group: HTTP from ALB, SSH from restricted CIDR
  - RDS Security Group: PostgreSQL (5432) from EC2 instances only
- **SSL/TLS**: HTTPS enforcement across all public endpoints

### 7. Monitoring
- **CloudWatch Alarms**: 
  - EC2 CPU utilization monitoring
  - Database performance monitoring
  - Application Load Balancer health monitoring
- **SNS Topic**: Alert notifications via email

### 8. Compliance Requirements
- **Region**: All resources deployed in us-west-2
- **Tagging**: Every resource tagged with `env: production`
- **Encryption**: RDS encryption at rest, S3 SSL enforcement
- **High Availability**: Multi-AZ deployment for RDS and ALB

## Expected CDK Structure

```typescript
// lib/production-web-app-stack.ts
export class ProductionWebAppStack extends Stack {
  // VPC and networking components
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.Subnet[];
  public readonly privateSubnets: ec2.Subnet[];
  
  // Compute and storage
  public readonly ec2Instance: ec2.Instance;
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly s3Bucket: s3.Bucket;
  
  // Load balancing and CDN
  public readonly applicationLoadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly cloudFrontDistribution: cloudfront.Distribution;
  
  // Monitoring
  public readonly alarmTopic: sns.Topic;
  public readonly cpuAlarm: cloudwatch.Alarm;
}
```

## Configuration Requirements

### Environment Variables
- `APPROVED_SSH_CIDR`: Restricted CIDR for SSH access (not 0.0.0.0/0)
- `ALARM_EMAIL`: Email for CloudWatch alarm notifications
- `CERTIFICATE_ARN`: SSL certificate ARN for HTTPS listeners
- `DB_PASSWORD`: Secure database password (use AWS Secrets Manager)

### Parameters
- All configurable values should be parameterized
- Instance types should be configurable but default to production-suitable sizes
- CIDR blocks should be configurable with sensible defaults

## Validation Criteria
1. ✅ All resources in us-west-2 region
2. ✅ All resources tagged with `env: production`
3. ✅ VPC with public/private subnets across 2 AZs
4. ✅ RDS Multi-AZ with encryption enabled
5. ✅ S3 bucket with versioning and public access blocked
6. ✅ CloudFront distribution with HTTPS enforcement
7. ✅ Application Load Balancer with HTTP/HTTPS listeners
8. ✅ Security groups allowing only required ports (22, 80, 443)
9. ✅ IAM role with S3 read-only permissions
10. ✅ CloudWatch alarms for monitoring

This implementation should provide a secure, scalable, and compliant production environment for web applications.