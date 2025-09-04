# Cloud Environment Setup

I need to set up a comprehensive cloud environment for a new application that will be deployed across multiple AWS regions for high availability and disaster recovery. The application requires a robust infrastructure that can handle production workloads with proper security, monitoring, and scalability.

Please create infrastructure code that includes:

## Core Networking
- VPC with public and private subnets across multiple availability zones
- Internet Gateway and NAT Gateways for internet access
- Route tables and security groups with appropriate rules
- VPC Endpoints for AWS services to reduce data transfer costs

## Compute Infrastructure
- Auto Scaling Group with EC2 instances for the application tier
- Application Load Balancer for traffic distribution
- Launch Template with proper instance configuration
- Target groups for health checking

## Database Layer
- RDS Aurora Serverless v2 cluster for automatic scaling
- Read replicas in secondary regions for disaster recovery
- Proper security groups and subnet groups for database isolation

## Storage Solutions
- S3 buckets with versioning and cross-region replication
- CloudFront distribution for content delivery
- EFS file system for shared storage needs

## Security and Access Management
- IAM roles and policies following least privilege principle
- AWS Systems Manager Parameter Store for configuration management
- AWS Certificate Manager for SSL certificates
- Security groups with minimal required access

## Monitoring and Logging
- CloudWatch dashboards and alarms for key metrics
- CloudWatch Logs groups for application logging
- AWS Shield Advanced for DDoS protection
- SNS topics for alerting

## Latest AWS Features
Include Amazon ECS with built-in blue/green deployments for safer container application deployments and AWS Certificate Manager with exportable public SSL/TLS certificates for hybrid workloads.

The infrastructure should be production-ready, follow AWS best practices, and be cost-optimized. Please provide the infrastructure code with one code block per file.