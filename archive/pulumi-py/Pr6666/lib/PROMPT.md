# Banking Portal Infrastructure Project

## Project Overview

This project contains Infrastructure as Code (IaC) automation for deploying a secure, scalable three-tier web application infrastructure designed specifically for a banking portal. The infrastructure is built using Pulumi with Python and follows financial services security best practices.

## Business Requirements

A financial services company needed to deploy a new online banking portal with the following requirements:
- **High Availability**: The system must be resilient to failures and provide 99.9% uptime
- **Security**: Strict security controls and compliance with financial regulations
- **Scalability**: Ability to handle varying loads automatically
- **Agile Development**: Support for automated deployment processes

## Architecture Overview

The infrastructure is deployed across multiple availability zones in the `us-east-1` region and consists of three main tiers:

### 1. **Presentation Tier (Web Layer)**
- **CloudFront Distribution**: Global content delivery network for fast, secure content delivery
- **Application Load Balancer**: Distributes incoming HTTPS traffic across multiple application servers
- **Public Subnets**: Host the load balancers with internet connectivity

### 2. **Application Tier (Logic Layer)**
- **Auto Scaling Groups**: Automatically scales EC2 instances based on demand
- **Launch Templates**: Standardized configuration for application servers
- **Private Subnets**: Isolated environment for application servers without direct internet access

### 3. **Data Tier (Database Layer)**
- **RDS PostgreSQL Multi-AZ**: Highly available database with automatic failover
- **Database Subnets**: Isolated network segments for database instances
- **KMS Encryption**: Data encryption at rest for security compliance

## Key Infrastructure Components

### Networking
- **VPC (Virtual Private Cloud)**: Isolated network environment with:
  - 3 Public subnets for load balancers
  - 3 Private subnets for application servers
  - 3 Database subnets for data storage
  - All distributed across different Availability Zones for high availability

### Storage
- **S3 Buckets**: Secure storage for:
  - Static website assets (images, CSS, JavaScript)
  - Application logs and audit trails
  - Configured with encryption and appropriate access policies

### Security
- **IAM Roles and Policies**: Implement least privilege access principles
- **Security Groups**: Network-level firewall rules with strict ingress/egress controls
- **KMS Keys**: Encryption key management for data at rest

### Monitoring and Alerting
- **CloudWatch Alarms**: Monitor critical metrics including:
  - CPU utilization across EC2 instances
  - Memory usage patterns
  - Database connection counts
- **SNS Topics**: Automated alerting when performance thresholds are breached

## Expected Deliverables

The Pulumi program creates a complete, production-ready infrastructure that includes:

- All networking components with proper subnet routing
- Load balancing and auto-scaling capabilities
- Secure database setup with backup and recovery
- Content delivery optimization
- Comprehensive monitoring and alerting
- Security controls and compliance features

### Key Outputs
- CloudFront distribution URL for public access
- Application Load Balancer DNS name for direct access
- RDS endpoint for database connections

## Technical Implementation

The infrastructure code uses Pulumi's Python SDK with:
- Strong typing for resource definitions
- Proper dependency management between resources
- Error handling for resource creation failures
- Modular design for maintainability and reusability