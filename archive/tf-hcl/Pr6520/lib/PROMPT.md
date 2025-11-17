# Task: AWS CloudFormation - Payment Processing Application Migration

## Problem Statement

Create a CloudFormation template to migrate an on-premises payment processing application to AWS using a blue-green deployment strategy.

MANDATORY REQUIREMENTS (Must complete):
1. Deploy an ECS Fargate cluster with task definition for the payment processor container (CORE: ECS)
2. Create RDS Aurora PostgreSQL cluster with Multi-AZ deployment and encryption (CORE: RDS)
3. Configure Application Load Balancer with target groups for blue and green environments
4. Implement ECS services for both blue and green deployments with identical configurations
5. Store database connection strings in Parameter Store with SecureString type
6. Create CloudWatch Log Groups with 30-day retention for application logs
7. Set up auto-scaling policies targeting 70% CPU utilization
8. Define security groups allowing only ALB to communicate with ECS tasks

OPTIONAL ENHANCEMENTS (If time permits):
- Add Route 53 weighted routing for gradual traffic shifting (OPTIONAL: Route 53) - enables controlled migration
- Implement AWS Backup plan for Aurora cluster (OPTIONAL: AWS Backup) - ensures data protection
- Configure AWS Config rules for compliance checking (OPTIONAL: AWS Config) - maintains security standards

Expected output: A complete CloudFormation YAML template that provisions all infrastructure needed for blue-green deployment migration, with parameters for environment-specific values and outputs for key resource identifiers.

## Background

A financial services company is migrating their legacy payment processing system from on-premises to AWS. The application currently runs on physical servers with a PostgreSQL database and needs to be containerized for the cloud migration. The migration must be completed with zero downtime using a blue-green deployment strategy.

## Environment

Production environment migration in us-east-1 region. Infrastructure includes ECS Fargate cluster for containerized payment processor, RDS Aurora PostgreSQL Multi-AZ cluster, and Application Load Balancer. VPC with 3 availability zones, each containing public and private subnets. NAT Gateways in public subnets for outbound internet access from private resources. AWS Systems Manager Parameter Store for secrets management. CloudWatch Logs and Container Insights for observability. Requires AWS CLI configured with appropriate permissions.

## Constraints

- Use AWS Fargate for container hosting to avoid EC2 instance management
- Database must use RDS Aurora PostgreSQL with encryption at rest enabled
- All traffic must flow through an Application Load Balancer with health checks
- Implement blue-green deployment capability using ECS services
- Use Parameter Store for database credentials instead of hardcoding
- Enable CloudWatch Container Insights for monitoring
- Configure auto-scaling for ECS tasks based on CPU utilization
- Use private subnets for all compute resources
- Set up CloudWatch alarms for service health monitoring
- Implement least-privilege IAM roles for ECS task execution

## Platform Details

- Platform: Terraform (tf)
- Language: HCL
- Difficulty: hard
- Subject Labels: aws, infrastructure, environment-migration
