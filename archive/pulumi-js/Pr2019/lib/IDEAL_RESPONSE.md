# Highly Available Web Application Infrastructure - Technical Documentation

## Overview

This documentation describes a production-ready, highly available web application infrastructure implemented using Pulumi and JavaScript. The infrastructure follows AWS Well-Architected Framework principles and provides scalable, secure, and resilient hosting for web applications.

## Architecture

### High-Level Design

The infrastructure implements a standard 3-tier web application architecture:

1. **Presentation Tier**: Application Load Balancer (ALB) in public subnets
2. **Application Tier**: Auto Scaling Group of EC2 instances in private subnets
3. **Data Tier**: RDS MySQL database in private subnets with Multi-AZ deployment

### Network Architecture

- **VPC**: 10.0.0.0/16 CIDR block providing isolated network environment
- **Public Subnets**: 10.0.1.0/24 and 10.0.2.0/24 across two availability zones
- **Private Subnets**: 10.0.3.0/24 and 10.0.4.0/24 across two availability zones
- **Internet Gateway**: Provides internet access for public subnets
- **NAT Gateways**: Enable outbound internet access for private subnets (one per AZ for HA)
- **Route Tables**: Separate routing configuration for public and private subnets

## Components

### 1. Networking Infrastructure

#### VPC Configuration
- **CIDR**: 10.0.0.0/16
- **DNS Support**: Enabled for hostname resolution
- **DNS Hostnames**: Enabled for public DNS assignment

#### Subnet Design
- **Multi-AZ Deployment**: Resources distributed across 2 availability zones
- **Public Subnets**: Host load balancer and NAT gateways
- **Private Subnets**: Host application instances and database

#### Internet Connectivity
- **Internet Gateway**: Attached to VPC for public internet access
- **NAT Gateways**: One per public subnet for high availability
- **Elastic IPs**: Associated with NAT gateways for static outbound IPs

### 2. Security

#### Security Groups
- **ALB Security Group**: Allows HTTP (80) and HTTPS (443) from internet
- **EC2 Security Group**: Allows HTTP from ALB, SSH from VPC
- **RDS Security Group**: Allows MySQL (3306) from EC2 instances only

#### IAM Roles and Policies
- **EC2 Instance Role**: Provides CloudWatch and S3 read access
- **RDS Monitoring Role**: Enables enhanced monitoring
- **Least Privilege**: Minimal permissions required for functionality

### 3. Compute Layer

#### Launch Template
- **AMI**: Latest Amazon Linux 2
- **Instance Type**: t3.micro (cost-effective for testing)
- **Security**: Attached to EC2 security group
- **User Data**: Installs and configures Apache HTTP server

#### Auto Scaling Group
- **Multi-AZ**: Instances distributed across private subnets
- **Capacity**: Min: 2, Max: 6, Desired: 2
- **Health Checks**: ELB health checks with 5-minute grace period
- **Scaling Policies**: CPU-based scaling (scale up at 70%, down at 30%)

### 4. Load Balancing

#### Application Load Balancer
- **Type**: Application Load Balancer for Layer 7 routing
- **Placement**: Deployed in public subnets
- **Target Group**: Routes traffic to healthy EC2 instances
- **Health Checks**: HTTP checks on root path (/)

### 5. Database Layer

#### RDS MySQL Configuration
- **Engine**: MySQL 8.0
- **Instance Class**: db.t3.micro
- **Storage**: 20GB GP2 with encryption enabled
- **Multi-AZ**: Enabled for high availability
- **Backups**: 7-day retention with automated backups
- **Monitoring**: Performance Insights enabled (7-day retention)
- **Enhanced Monitoring**: 60-second intervals

### 6. Storage

#### S3 Bucket
- **Purpose**: Static asset storage
- **Encryption**: Server-side encryption (AES256)
- **Versioning**: Enabled for object history
- **Access Control**: Block all public access
- **Security**: HTTPS-only policy

### 7. Monitoring and Logging

#### CloudWatch Components
- **Dashboard**: Visual monitoring of key metrics
- **Alarms**: CPU-based scaling triggers
- **Log Groups**: Separate groups for EC2 and ALB logs
- **Metrics**: Application, database, and infrastructure metrics

#### Performance Insights
- **Database Monitoring**: RDS performance analysis
- **Query Analysis**: Database query performance tracking
- **Wait Events**: Database bottleneck identification

## Latest AWS Features Integration

### 1. CloudWatch Database Insights
- **Feature**: Enhanced database monitoring and correlation
- **Implementation**: Performance Insights enabled on RDS instance
- **Benefits**: Correlate application performance with database metrics
- **Retention**: 7-day performance data retention

### 2. Enhanced Monitoring Capabilities
- **Feature**: Comprehensive infrastructure monitoring
- **Implementation**: CloudWatch agents, enhanced RDS monitoring
- **Benefits**: Deep visibility into system performance
- **Granularity**: 60-second monitoring intervals

## Security Best Practices

### Network Security
- Private subnets for application and database tiers
- Security groups with minimal required access
- No direct internet access to application instances

### Data Protection
- Encryption at rest for RDS and S3
- HTTPS-only policies for S3 bucket
- Automated database backups

### Access Control
- IAM roles with least privilege principle
- Instance profiles for EC2 service access
- Separate roles for different functions

## High Availability Design

### Multi-AZ Deployment
- Resources distributed across 2 availability zones
- RDS Multi-AZ for database failover
- Auto Scaling Group spans multiple AZs

### Fault Tolerance
- Load balancer health checks
- Auto Scaling replaces unhealthy instances
- Database automatic failover capability

### Redundancy
- Multiple NAT gateways for private subnet internet access
- Application instances in separate AZs
- Database standby replica in different AZ

## Scalability Features

### Horizontal Scaling
- Auto Scaling Group with CPU-based policies
- Application Load Balancer distributes traffic
- Database read replicas can be added if needed

### Vertical Scaling
- Launch template allows instance type changes
- RDS supports instance class modifications
- Storage can be expanded without downtime

## Cost Optimization

### Instance Selection
- t3.micro instances for cost-effective compute
- db.t3.micro for development/testing workloads
- GP2 storage for balanced performance and cost

### Resource Management
- Auto Scaling prevents over-provisioning
- 14-day log retention reduces storage costs
- Performance Insights free tier utilization

## Maintenance and Operations

### Automated Backups
- RDS automated backups with 7-day retention
- S3 versioning for asset recovery
- Point-in-time recovery capability

### Maintenance Windows
- Database maintenance: Sunday 04:00-05:00
- Backup window: Daily 03:00-04:00
- Non-overlapping schedule prevents conflicts

### Monitoring and Alerting
- CloudWatch alarms for scaling decisions
- Dashboard for operational visibility
- Log aggregation for troubleshooting

## Deployment Considerations

### Prerequisites
- AWS CLI configured with appropriate permissions
- Pulumi CLI installed and configured
- Node.js runtime for Pulumi JavaScript

### Deployment Process
1. Run `pulumi up` to preview and deploy infrastructure
2. Verify outputs include VPC ID, ALB DNS name, and other resources
3. Test application accessibility via load balancer DNS name
4. Monitor CloudWatch dashboard for system health

### Post-Deployment
- Configure application deployment pipeline
- Set up monitoring alerts and notifications
- Implement backup and recovery procedures
- Test scaling and failover scenarios

## Resource Outputs

The infrastructure provides the following outputs:
- **VPC ID**: For network integration
- **ALB DNS Name**: Application access endpoint  
- **Bucket Name**: Static asset storage reference
- **RDS Endpoint**: Database connection string
- **Dashboard URL**: CloudWatch monitoring dashboard

This infrastructure provides a solid foundation for hosting production web applications with high availability, security, and scalability built-in from the ground up.