# Environment Migration Infrastructure

Hey team,

We need to build a comprehensive environment migration system for our application. The business needs a reliable way to migrate workloads from on-premises to AWS while maintaining high availability during the transition. This infrastructure will support database migration, containerized applications with blue-green deployments, and advanced traffic routing capabilities.

Our platform team has been tasked with creating this using **Pulumi with TypeScript**. We've had some challenges with similar migrations before, so we need to make sure this implementation covers all the critical requirements including proper DNS management, container security scanning, and zero-downtime deployment strategies.

The goal is to have a production-ready migration environment that can handle both the data layer migration through DMS and application layer migration through ECS with sophisticated deployment controls. The business is particularly interested in having fine-grained traffic control during cutover phases.

## What we need to build

Create a comprehensive environment migration infrastructure using **Pulumi with TypeScript** for AWS cloud deployment. This system needs to orchestrate database migration from on-premises to AWS RDS Aurora while simultaneously supporting containerized application deployment with advanced routing and blue-green deployment capabilities.

### Core Requirements

1. **Network Infrastructure**
   - VPC with high availability across 3 Availability Zones
   - Public and private subnets for proper network segmentation
   - VPN Gateway for secure on-premises connectivity during migration
   - NAT Gateway for outbound internet access (use 1 for cost optimization)
   - Internet Gateway for public subnet access

2. **Database Migration**
   - Amazon RDS Aurora PostgreSQL cluster with serverless configuration for cost optimization
   - AWS DMS (Database Migration Service) replication instance for on-premises to Aurora migration
   - DMS endpoints for both source and target databases
   - DMS replication task for continuous data synchronization
   - Appropriate security groups and subnet groups for database access

3. **Container Infrastructure**
   - Amazon ECR repository with vulnerability scanning enabled for container image security
   - ECS Fargate cluster for serverless container execution
   - ECS service configured with CODE_DEPLOY deployment controller for blue-green deployments
   - Two target groups (blue and green) for zero-downtime deployments
   - Application Load Balancer for traffic distribution

4. **Blue-Green Deployment System**
   - AWS CodeDeploy application for ECS
   - CodeDeploy deployment group configured for ECS blue-green deployment
   - Proper IAM roles for CodeDeploy to manage ECS deployments
   - Integration with ALB target groups for traffic shifting

5. **Advanced Traffic Routing**
   - Route53 hosted zone for DNS management
   - Route53 weighted routing policies supporting gradual traffic shifting
   - Support for 0%, 25%, 50%, 75%, and 100% traffic distribution configurations
   - DNS records pointing to Application Load Balancer

6. **Additional Storage and Caching**
   - DynamoDB table for application state management
   - S3 bucket for application data storage

7. **Lambda Functions**
   - Lambda function for database migration validation
   - Lambda function for health check monitoring
   - Proper IAM roles and policies for Lambda execution

8. **Monitoring and Observability**
   - CloudWatch Log Groups for ECS tasks, Lambda functions, and DMS
   - CloudWatch Alarms for critical metrics
   - CloudWatch Dashboard for unified monitoring view

9. **Security and Access Control**
   - Security groups with proper ingress/egress rules
   - IAM roles and policies following least privilege principle
   - VPC security configurations for isolation

10. **Infrastructure Configuration**
    - All resources deployed to us-east-1 region
    - Resource names must include environmentSuffix for uniqueness across deployments
    - Follow naming convention: resource-type-environment-suffix
    - All resources must be destroyable with no retention policies for development environments

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS ECS Fargate for containerized workloads
- Use AWS RDS Aurora Serverless PostgreSQL for database
- Use AWS DMS for database migration orchestration
- Use Amazon ECR with image scanning enabled for container security
- Use AWS CodeDeploy for blue-green ECS deployments
- Use Route53 with weighted routing for advanced traffic control
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: {resource-type}-environment-suffix
- Deploy to **us-east-1** region
- Use 1 NAT Gateway for cost optimization instead of one per AZ

### Constraints

- All resources must be destroyable with no Retain policies
- Use Aurora Serverless for cost optimization
- Avoid slow-provisioning resources where possible
- ECR repository must have image scanning enabled for security compliance
- ECS service must use CODE_DEPLOY deployment controller for blue-green support
- Route53 weighted routing must support multiple weight configurations
- Security groups must follow principle of least privilege
- Include proper error handling and logging
- All container images must be stored in ECR
- Lambda functions should have appropriate timeout and memory configurations

## Success Criteria

- **Functionality**: All 10 requirement categories implemented and working
- **Database Migration**: DMS successfully configured for on-premises to Aurora migration
- **Blue-Green Deployment**: CodeDeploy properly integrated with ECS and ALB target groups
- **Traffic Control**: Route53 weighted routing supports 0%, 25%, 50%, 75%, 100% traffic splits
- **Security**: ECR vulnerability scanning enabled, proper IAM roles, security groups configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Deployability**: Infrastructure can be deployed and destroyed cleanly
- **Monitoring**: CloudWatch configured for comprehensive observability
- **Cost Optimization**: Uses serverless options and single NAT Gateway
- **Code Quality**: TypeScript with proper types, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC with 3 AZ support and VPN Gateway
- RDS Aurora PostgreSQL with DMS for migration
- ECS Fargate with ECR repository (scanning enabled)
- Application Load Balancer with 2 target groups
- CodeDeploy configuration for blue-green ECS deployments
- Route53 with weighted routing policies (0%, 25%, 50%, 75%, 100%)
- DynamoDB table and S3 bucket
- Lambda functions for validation and health checks
- CloudWatch monitoring with logs, alarms, and dashboards
- Unit tests for all components
- Documentation and deployment instructions
