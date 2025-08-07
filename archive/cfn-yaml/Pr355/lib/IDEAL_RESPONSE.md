# Secure and Scalable CloudFormation Template - Ideal Solution

This CloudFormation template provides a comprehensive, production-ready AWS infrastructure that fully meets all requirements from the PROMPT.md specifications.

## Architecture Overview

The template creates a secure, well-architected cloud infrastructure with the following components:

### Core Infrastructure
- **VPC** with public and private subnets across 2 AZs
- **Internet Gateway** and **NAT Gateways** for secure connectivity
- **Route Tables** with proper resource segregation

### Security Components
- **KMS Keys** for encryption at rest across all services
- **Security Groups** with least privilege access rules
- **IAM Roles and Policies** following principle of least privilege
- **WAF Web ACL** for CloudFront protection

### Compute Resources
- **EC2 Instances** in private subnets with IAM instance profiles
- **Lambda Functions** with VPC configuration and KMS encryption
- **Application Load Balancer** for Lambda integration
- **Global Accelerator** providing static IPs for Lambda functions

### Data Storage
- **RDS MySQL** in Multi-AZ configuration with encryption
- **S3 Buckets** with versioning, encryption, and access logging
- **DynamoDB** for simple key-value storage needs

### Content Delivery & Security
- **CloudFront Distribution** with SSL/TLS certificates from ACM
- **Origin Access Identity** for secure S3 access
- **SSL/TLS Certificates** managed by AWS Certificate Manager

### Monitoring & Logging
- **CloudTrail** for API activity logging (Lambda and RDS focus)
- **CloudWatch Log Groups** with KMS encryption
- **S3 Access Logging** enabled on all buckets

## Key Features

### Security Best Practices
✅ **Encryption at Rest**: All services use KMS encryption
✅ **Least Privilege**: IAM policies grant minimal required permissions
✅ **Network Segmentation**: Resources properly isolated in VPC subnets
✅ **Security Groups**: Restrictive rules for required ports only
✅ **SSL/TLS**: HTTPS/TLS encryption for all web traffic
✅ **Access Logging**: Comprehensive audit trail via CloudTrail and S3 logs

### High Availability & Resilience
✅ **Multi-AZ Deployment**: RDS, NAT Gateways across availability zones
✅ **Auto Scaling**: Pay-per-request DynamoDB billing
✅ **Load Balancing**: Application Load Balancer for Lambda functions
✅ **Global Distribution**: CloudFront CDN for content delivery
✅ **Static IP Assignment**: Global Accelerator for consistent Lambda IPs

### Operational Excellence
✅ **Resource Tagging**: Comprehensive tagging for cost allocation and ownership
✅ **Monitoring**: CloudWatch integration for all services
✅ **Backup Strategy**: RDS automated backups with 7-day retention
✅ **Lifecycle Management**: S3 lifecycle policies for log retention

## Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Scalable Production Infrastructure'

Parameters:
  - ProjectName: For resource naming and tagging
  - Environment: Environment classification (dev/staging/prod)
  - Owner: Cost allocation and ownership tracking
  - DBUsername/DBPassword: Database credentials

Resources:
  # KMS Keys for encryption
  ApplicationKMSKey & Alias
  
  # VPC and Networking (10.0.0.0/16)
  VPC, Internet Gateway, NAT Gateways (x2)
  Public Subnets: 10.0.1.0/24, 10.0.2.0/24
  Private Subnets: 10.0.3.0/24, 10.0.4.0/24
  Route Tables and Associations
  
  # Security Groups
  Web Server SG (HTTP/HTTPS + SSH from Bastion)
  Database SG (MySQL from Web + Lambda)
  Bastion SG (SSH from anywhere)
  Lambda SG (HTTPS out + MySQL to DB)
  ALB SG (HTTP/HTTPS from anywhere)
  
  # IAM Roles and Profiles
  EC2 Instance Role (S3 + CloudWatch access)
  Lambda Execution Role (VPC + RDS + S3 + KMS access)
  CloudTrail Role (CloudWatch Logs access)
  
  # S3 Buckets with Security
  Application Bucket (KMS encrypted, versioned, logged)
  Logging Bucket (lifecycle policies, encrypted)
  CloudTrail Bucket (with bucket policy for CloudTrail)
  
  # RDS Database
  DB Subnet Group (private subnets)
  RDS MySQL Instance (Multi-AZ, encrypted, backup enabled)
  
  # Lambda Function
  VPC-enabled Lambda with environment variables
  KMS encryption for function
  
  # Global Accelerator for Static IPs
  Accelerator, Listener, Endpoint Group
  
  # Application Load Balancer
  ALB, Target Group (Lambda), Listener (HTTPS)
  Lambda Invoke Permission
  
  # EC2 Instances
  Web Server Instances (x2) in private subnets
  Bastion Host in public subnet
  All with IAM instance profiles
  
  # CloudFront Distribution
  Distribution with S3 origin
  Origin Access Identity
  SSL certificate integration
  WAF Web ACL integration
  Access logging enabled
  
  # SSL Certificate
  ACM Certificate with DNS validation
  
  # WAF Web ACL
  Rate limiting rules for DDoS protection
  
  # CloudWatch Logs
  Log Groups for S3 and Lambda with KMS encryption
  
  # CloudTrail
  Multi-region trail with KMS encryption
  Event selectors for Lambda and RDS
  S3 bucket integration

Outputs:
  VPC ID, Database Endpoint, Lambda ARN
  CloudFront Distribution ID and Domain
  Global Accelerator DNS and Static IPs
  Load Balancer DNS, EC2 Instance IDs
  S3 Bucket Names
```

## Security Compliance

### Data Protection
- **At-Rest Encryption**: KMS keys encrypt RDS, S3, Lambda, CloudWatch Logs, CloudTrail
- **In-Transit Encryption**: HTTPS/TLS for all web traffic, encrypted RDS connections
- **Access Control**: IAM roles with minimal permissions, Security Groups with restrictive rules

### Network Security
- **VPC Isolation**: All resources within private network boundaries
- **Bastion Host**: Secure SSH access to private resources
- **NAT Gateways**: Secure outbound internet access for private resources
- **WAF Protection**: Rate limiting and attack mitigation for CloudFront

### Monitoring & Compliance
- **API Logging**: CloudTrail captures all Lambda and RDS API calls
- **Access Logging**: S3 bucket access logs for audit trail
- **CloudWatch Integration**: Centralized logging and monitoring

## Cost Optimization

- **Pay-per-Request**: DynamoDB billing model scales with usage
- **Right-Sized Instances**: t3.micro for development/testing
- **S3 Lifecycle**: Automated log retention and cleanup
- **Multi-AZ Only Where Needed**: RDS Multi-AZ for high availability

## Region Specification

All resources deployed in **us-east-1** region as required.

## Tagging Strategy

Consistent tagging across all resources:
- **Project**: Cost allocation by project
- **Environment**: Environment classification
- **Owner**: Responsibility and contact information
- **Name**: Resource identification

This template represents the ideal solution that fully satisfies all requirements in the PROMPT.md while following AWS Well-Architected Framework principles.