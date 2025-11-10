Hey team,

We need to build infrastructure for a payment processing web application for a fintech startup. They have strict compliance requirements to meet PCI DSS standards and need high availability with automated scaling. I've been asked to create this infrastructure using CDKTF with TypeScript.

The business is launching their payment gateway and requires a production-grade deployment that can handle variable traffic loads while maintaining security and reliability. They need the application containerized on ECS Fargate with a PostgreSQL database backend, all deployed across multiple availability zones for redundancy.

This is a critical production deployment where downtime could impact financial transactions, so we need proper load balancing, auto-scaling, secure credential management, and comprehensive monitoring from day one.

## What we need to build

Create a containerized web application infrastructure using **CDKTF with TypeScript** for AWS deployment in the us-east-1 region.

### Core Requirements

1. **Network Infrastructure**
   - Create a VPC with 3 public and 3 private subnets across 3 availability zones
   - Deploy NAT Gateways for outbound internet access from private subnets
   - Configure proper routing tables for public and private subnets

2. **Load Balancing and Traffic Management**
   - Deploy an Application Load Balancer in public subnets with HTTPS listener
   - Configure path-based routing for /api/* and /admin/* endpoints
   - Use ACM certificates for SSL/TLS termination

3. **Container Orchestration**
   - Set up ECS cluster with Fargate service running minimum 3 tasks
   - Use Fargate Spot instances for cost optimization
   - Store container images in private ECR repositories only
   - Configure ECS task definition to pull secrets from Secrets Manager

4. **Auto-Scaling Configuration**
   - Configure auto-scaling for ECS service with min: 3, max: 10 tasks
   - Set target CPU utilization at 70% for scaling triggers
   - Implement proper scaling policies for responsive performance

5. **Database Infrastructure**
   - Create RDS PostgreSQL instance (db.t3.medium) with Multi-AZ enabled
   - Enable encrypted storage with automated backups
   - Store database connection string in AWS Secrets Manager
   - Configure in private subnets with proper security groups

6. **Monitoring and Observability**
   - Set up CloudWatch Container Insights for the ECS cluster
   - Enable detailed monitoring for all critical resources
   - Configure CloudWatch log groups for application and infrastructure logs

7. **Security Configuration**
   - Security group allowing HTTPS from internet to ALB
   - Security group allowing ALB to ECS on port 8080
   - Security group allowing ECS to RDS on port 5432
   - Configure IAM roles for ECS task execution and secrets access
   - All traffic between ALB and ECS must use HTTPS

8. **Resource Tagging**
   - Tag all resources with Environment=production and Project=payment-app
   - All named resources must include environmentSuffix for uniqueness

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use AWS VPC for network isolation
- Use AWS Application Load Balancer for traffic distribution
- Use AWS ECS Fargate for container orchestration
- Use AWS RDS PostgreSQL for database
- Use AWS Secrets Manager for credential storage
- Use AWS ECR for container image storage
- Use AWS CloudWatch for monitoring
- Use AWS ACM for SSL certificates
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- Deploy across exactly 3 availability zones

### Constraints

- Use Fargate Spot instances for cost optimization
- RDS PostgreSQL must use encrypted storage
- Container images must be stored in private ECR repositories only
- All traffic between ALB and ECS must use HTTPS with ACM certificates
- Database credentials must be stored in AWS Secrets Manager
- Implement auto-scaling based on CPU utilization at 70%
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging
- Meet PCI DSS compliance requirements for payment processing

## Success Criteria

- Functionality: Infrastructure deploys successfully with all components properly connected
- Performance: Auto-scaling responds to CPU utilization at 70% threshold
- Reliability: Multi-AZ deployment ensures high availability
- Security: All credentials stored in Secrets Manager, encrypted storage, proper security groups
- Resource Naming: All resources include environmentSuffix
- Code Quality: TypeScript code, well-structured, properly documented

## What to deliver

- Complete CDKTF TypeScript implementation
- VPC with 3 public and 3 private subnets across 3 AZs
- Application Load Balancer with HTTPS and path-based routing
- ECS Fargate cluster with auto-scaling (3-10 tasks)
- RDS PostgreSQL Multi-AZ with encrypted storage
- Secrets Manager integration for database credentials
- CloudWatch Container Insights monitoring
- Security groups for ALB, ECS, and RDS
- IAM roles for ECS task execution
- ECR repository configuration
- Deployment instructions and documentation
