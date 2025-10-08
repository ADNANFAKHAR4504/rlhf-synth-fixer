# Cost-Efficient Web Infrastructure Solution

This CloudFormation template creates a reliable, cost-efficient web infrastructure for a startup expecting 3,000 daily users. The solution balances incoming traffic, maintains high uptime, and includes comprehensive monitoring.

## Architecture Overview

The infrastructure implements a highly available, auto-scaling web application using AWS best practices:

- **VPC Network**: Isolated network environment (10.0.0.0/16) with public and private subnets across multiple Availability Zones
- **Load Balancing**: Application Load Balancer distributing traffic across healthy EC2 instances
- **Auto Scaling**: Automatic capacity adjustment based on CPU utilization (1-4 instances)
- **Static Assets**: S3 bucket for serving static content with public access
- **Monitoring**: CloudWatch alarms, custom metrics, and dashboard for operational visibility
- **Security**: Properly configured security groups restricting access to necessary ports only

## Key Components

### Networking
- **VPC**: 10.0.0.0/16 CIDR with DNS support enabled
- **Public Subnets**: 10.0.1.0/24 and 10.0.2.0/24 for ALB placement
- **Private Subnets**: 10.0.10.0/24 and 10.0.11.0/24 for EC2 instances
- **NAT Gateways**: High-availability internet access for private subnets
- **Route Tables**: Proper routing configuration for public and private traffic

### Compute
- **EC2 Instances**: t3.micro instances optimized for cost efficiency
- **Auto Scaling**: Dynamic scaling between 1-4 instances based on demand
- **Launch Template**: Standardized instance configuration with Apache web server
- **IAM Role**: Minimal permissions for CloudWatch monitoring and S3 access

### Load Balancing
- **Application Load Balancer**: Internet-facing ALB handling HTTP traffic on port 80
- **Target Group**: Health check configuration ensuring only healthy instances receive traffic
- **Health Checks**: HTTP-based health monitoring with appropriate thresholds

### Storage
- **S3 Bucket**: Encrypted bucket for static assets with lifecycle policies
- **Bucket Policy**: Public read access for static content delivery
- **Versioning**: Enabled with automatic cleanup of old versions

### Monitoring & Alerting
- **CloudWatch Alarms**: CPU utilization, response time, and health monitoring
- **Auto Scaling Policies**: Scale-up/scale-down based on CPU thresholds
- **Custom Dashboard**: Comprehensive view of application performance metrics
- **CloudWatch Agent**: Detailed instance-level monitoring

## Security Features

### Network Security
- **ALB Security Group**: Only allows HTTP (port 80) inbound traffic
- **EC2 Security Group**: Restricts HTTP traffic to ALB source only, SSH from VPC
- **Private Subnets**: EC2 instances not directly accessible from internet

### Data Protection
- **S3 Encryption**: Server-side encryption enabled for static assets
- **IAM Policies**: Least-privilege access for EC2 instances
- **VPC Isolation**: Network-level isolation from other AWS accounts

## Cost Optimization

### Instance Sizing
- **t3.micro**: Cost-effective instance type suitable for 3,000 daily users
- **Burstable Performance**: CPU credits for handling traffic spikes

### Auto Scaling
- **Demand-Based**: Scales from 1-4 instances based on actual usage
- **Cost-Aware Thresholds**: 70% CPU scale-up, 20% scale-down for efficiency

### Storage Optimization
- **S3 Lifecycle**: Automatic cleanup of old object versions
- **Regional Deployment**: Single region deployment reduces data transfer costs

## High Availability

### Multi-AZ Deployment
- **Load Balancer**: Deployed across multiple Availability Zones
- **Auto Scaling**: Instances distributed across AZs for fault tolerance
- **NAT Gateways**: Redundant internet access for private subnets

### Health Monitoring
- **ELB Health Checks**: Automatic removal of unhealthy instances
- **CloudWatch Alarms**: Proactive monitoring of critical metrics
- **Auto Recovery**: Automatic replacement of failed instances

## Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Cost-efficient web infrastructure for startup with 3,000 daily users'

Parameters:
  EnvironmentSuffix: # For resource naming and environment isolation
  LatestAmiId: # Latest Amazon Linux 2 AMI from SSM
  DesiredCapacity: # Target number of instances (default: 2)
  MinSize: # Minimum instances (default: 1)
  MaxSize: # Maximum instances (default: 4)

Resources:
  # Network Infrastructure (VPC, Subnets, Gateways, Route Tables)
  # Security Groups (ALB and EC2 with proper restrictions)
  # S3 Bucket (Static assets with public access policy)
  # Load Balancer (ALB with target group and listener)
  # IAM (EC2 role with CloudWatch and S3 permissions)
  # Auto Scaling (Launch template, ASG, scaling policies)
  # Monitoring (CloudWatch alarms and dashboard)

Outputs:
  LoadBalancerURL: # Application endpoint
  StaticAssetsBucketName: # S3 bucket for static content
  VPCId: # VPC identifier for reference
  DashboardURL: # CloudWatch dashboard link
```

## Deployment Outputs

The template provides essential outputs for application integration:

- **LoadBalancerURL**: The public endpoint for accessing the web application
- **StaticAssetsBucketName**: S3 bucket name for uploading static assets
- **VPCId**: VPC identifier for potential future resources
- **DashboardURL**: Direct link to CloudWatch monitoring dashboard

## Operational Considerations

### Scaling Behavior
- **Scale-Up**: Triggers at 70% CPU utilization averaged over 10 minutes
- **Scale-Down**: Triggers at 20% CPU utilization averaged over 10 minutes
- **Cooldown**: 5-minute cooldown periods prevent thrashing

### Monitoring Metrics
- **Response Time**: ALB target response time tracking
- **Request Volume**: Total and successful request counts
- **Health Status**: Healthy/unhealthy target monitoring
- **CPU Utilization**: Instance-level CPU usage tracking

### Maintenance
- **Instance Updates**: Handled through launch template versioning
- **Security Patches**: Automatic via user data script on instance launch
- **Log Management**: CloudWatch Logs for centralized logging

This infrastructure provides a solid foundation for a startup's web application, balancing cost efficiency with reliability and scalability requirements.