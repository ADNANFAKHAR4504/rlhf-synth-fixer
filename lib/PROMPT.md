# E-Commerce Web Application Infrastructure

Hey team,

We need to build production-grade infrastructure for an e-commerce platform that's experiencing growth and needs a reliable, scalable deployment. I've been asked to create this in **CDKTF with Python**. The business wants a high-availability setup that can handle product catalogs and shopping cart operations with both static asset delivery and dynamic API endpoints.

The platform currently struggles with scaling during peak traffic and needs better database management with automatic credential rotation. They also want protection against DDoS attacks and rate limiting to prevent abuse. The infrastructure needs to support blue/green deployments so we can roll out updates without downtime.

This is a production workload going to us-east-1, so we need to follow AWS best practices for multi-AZ deployments, security groups, and resource tagging. The team wants everything automated through infrastructure as code so we can recreate environments consistently.

## What we need to build

Create a complete e-commerce infrastructure using **CDKTF with Python** for deploying a containerized web application with database persistence and CDN-backed static assets.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 2 public subnets and 4 private subnets across 2 availability zones
   - Internet Gateway for public subnet access
   - NAT Gateways for private subnet outbound connectivity
   - Route tables properly configured for public and private subnet routing

2. **Database Layer**
   - Aurora Serverless v2 PostgreSQL cluster deployed in private subnets
   - Minimum capacity of 0.5 ACUs and maximum of 1 ACU
   - Multi-AZ configuration for high availability
   - Automated backups with point-in-time recovery
   - Security group allowing access only from application tier

3. **Static Asset Delivery**
   - S3 bucket for hosting static assets (images, CSS, JavaScript)
   - CloudFront distribution with Origin Access Identity for secure S3 access
   - Cache optimization for static content
   - HTTPS enforcement with default CloudFront certificate

4. **Security and Secrets**
   - AWS Secrets Manager for storing database credentials
   - Automatic secret rotation configured for 30-day intervals
   - Encryption at rest for secrets
   - IAM roles for secret access from application tier

5. **Web Application Protection**
   - AWS WAF WebACL attached to Application Load Balancer
   - Rate limiting rule allowing maximum 2000 requests per 5-minute window
   - IP-based rate limiting to prevent abuse
   - Protection against common web exploits

6. **Compute and Auto-Scaling**
   - ECS Fargate for running containerized web application
   - Auto Scaling Group configured to scale based on 70% CPU utilization
   - Minimum of 2 tasks for high availability
   - Application Load Balancer distributing traffic across tasks

7. **Load Balancing and Security Groups**
   - Application Load Balancer in public subnets
   - Security group allowing HTTPS (port 443) traffic from internet
   - Target groups for blue/green deployment support
   - Health checks configured for ECS tasks

8. **Resource Management**
   - Consistent tagging across all resources: Environment, Project, Owner
   - Resource naming convention including environmentSuffix parameter
   - All resources must be destroyable (no Retain policies)

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS VPC** for network isolation
- Use **Amazon Aurora Serverless v2** for database with PostgreSQL engine
- Use **Amazon S3** with **CloudFront** for static content delivery
- Use **AWS Secrets Manager** for credential management with rotation
- Use **AWS WAF** for web application firewall
- Use **Amazon ECS Fargate** for containerized application deployment
- Use **Application Load Balancer** for traffic distribution
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Python 3.8+ with CDKTF 0.15+ required

### Deployment Requirements (CRITICAL)

- All resources must include the environmentSuffix parameter in their naming
- Resource naming pattern: servicename-environmentsuffix (e.g., "ecommerce-db-prod123")
- All resources must be destroyable - NO Retain policies allowed
- RemovalPolicy must be DESTROY for all stateful resources
- Lambda functions using Node.js 18+ must explicitly import AWS SDK v3 modules
- ECS tasks must use appropriate IAM task roles with least privilege
- Aurora cluster credentials must be stored in Secrets Manager only

### Constraints

- Use Python 3.8+ with CDKTF constructs for all infrastructure definitions
- Deploy web tier using ECS Fargate with exactly 2 tasks for high availability
- Configure Aurora Serverless v2 PostgreSQL with min 0.5 ACUs, max 1 ACU
- Implement blue/green deployment capability using ALB target group switching
- Store all sensitive configuration in Secrets Manager with automatic rotation
- Use S3 with CloudFront with Origin Access Identity (OAI)
- Enable AWS WAF on ALB with 2000 requests per 5-minute rate limit
- Configure auto-scaling for ECS based on 70% CPU utilization threshold
- All resources must have consistent tagging: Environment, Project, Owner
- All resources must be destroyable for testing and cleanup
- Include proper error handling and CloudWatch logging

## Success Criteria

- **Functionality**: Complete VPC, Aurora, ECS, ALB, S3, CloudFront, WAF, Secrets Manager deployment
- **High Availability**: Multi-AZ configuration with minimum 2 ECS tasks
- **Performance**: Auto-scaling triggers at 70% CPU, Aurora scales between 0.5-1 ACU
- **Security**: WAF rate limiting active, secrets rotated every 30 days, HTTPS only
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Python, well-tested, documented, follows CDKTF patterns
- **Destroyability**: All resources can be torn down completely (no Retain policies)

## What to deliver

- Complete CDKTF Python implementation in main stack file
- VPC with 2 public and 4 private subnets across 2 AZs
- Aurora Serverless v2 PostgreSQL cluster in private subnets
- ECS Fargate service with ALB and auto-scaling
- S3 bucket with CloudFront distribution
- AWS WAF with rate limiting rules
- Secrets Manager with 30-day rotation
- Comprehensive unit tests with high coverage
- Documentation and deployment instructions
