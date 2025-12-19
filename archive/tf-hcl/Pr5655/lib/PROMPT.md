# Infrastructure Automation Project

## Project Overview

Create a Terraform configuration to deploy a containerized web application on AWS ECS with high availability.

## Requirements

The Terraform configuration must include the following components:

1. **ECS Cluster Setup**
   - Use Fargate launch type across 3 availability zones

2. **Application Load Balancer**
   - Configure HTTPS listeners
   - Implement path-based routing

3. **Database Infrastructure**
   - Deploy RDS Aurora MySQL cluster
   - Enable automated backups and encryption

4. **Auto-scaling Configuration**
   - Configure ECS service with auto-scaling
   - Base scaling on CPU and memory metrics

5. **Deployment Strategy**
   - Implement blue-green deployment capability using target groups

6. **DNS and Health Monitoring**
   - Set up Route53 health checks
   - Configure failover routing

7. **Container Registry**
   - Create ECR repository
   - Implement lifecycle policies for image management

8. **Monitoring and Alerting**
   - Configure CloudWatch alarms for service health monitoring

9. **Security**
   - Implement proper IAM roles and security groups with least privilege

10. **Observability**
    - Enable container insights and X-Ray tracing for the ECS service

## Expected Output

A modular Terraform configuration that provisions the complete infrastructure and provides:
- ALB DNS name
- Database endpoint
- Deployment instructions for updating the application

## Business Context

A fintech startup needs to deploy their payment processing web application with strict uptime requirements. The application requires container orchestration, load balancing, and a managed database with automated backups.

## Environment Details

**Production-grade web application infrastructure** deployed in the `us-east-1` region with the following components:

- **Container Orchestration**: ECS Fargate for running containerized applications
- **Load Balancing**: Application Load Balancer for traffic distribution
- **Database**: RDS Aurora MySQL for data persistence
- **Network Architecture**: 
  - VPC spanning 3 availability zones
  - Public subnets for ALB
  - Private subnets for ECS tasks and RDS
  - NAT gateways for outbound internet access for containers
- **Container Registry**: ECR repository with automated security scanning enabled

## Technical Constraints

### Security Requirements
- ECS tasks must run in private subnets with no direct internet access
- ALB must enforce TLS 1.2 minimum and use AWS Certificate Manager certificates
- Container images must pass vulnerability scanning before deployment
- Database passwords must be stored in AWS Secrets Manager and rotated automatically

### Database Requirements
- RDS cluster must have point-in-time recovery enabled with 7-day retention

### Operational Requirements
- All resources must be tagged with Environment, Project, and CostCenter tags
- ECS service must maintain at least 2 running tasks during deployments
- CloudWatch logs retention must be set to 30 days with encryption enabled