# Payment Processing Platform Infrastructure

Hey team,

We need to build a production-ready infrastructure for our fintech startup's payment processing web application. The business has asked us to deploy a highly available Node.js API backend on AWS with automated deployment capabilities. We've decided to implement this using **Pulumi with TypeScript** to take advantage of type safety and modern development practices.

The payment processing application is critical for our business operations, so we need proper high availability, security, and scalability built in from day one. The infrastructure needs to support our container-based deployment strategy with proper networking isolation, database redundancy, and auto-scaling capabilities to handle varying payment loads throughout the day.

Our team is working in the **ap-northeast-2** region to serve our primary customer base in that geography. We need to ensure all resources are properly tagged, encrypted, and follow security best practices since we're handling sensitive financial data.

## What we need to build

Create a production-grade container orchestration platform using **Pulumi with TypeScript** for deploying our payment processing application on AWS ECS with Fargate.

### Core Requirements

1. **Network Infrastructure**
   - VPC with public and private subnets across 2 availability zones
   - Internet Gateway for public subnet access
   - NAT Gateway for private subnet outbound connectivity
   - Route tables configured appropriately for each subnet type

2. **Load Balancing and Traffic Management**
   - Application Load Balancer in public subnets
   - HTTPS listener on port 443 with SSL certificate from ACM
   - Target groups configured for ECS service integration
   - Route53 hosted zone with alias record pointing to ALB

3. **Container Orchestration**
   - ECS cluster using Fargate launch type
   - ECS task definition with 512 CPU units and 1024 MiB memory
   - Network mode set to 'awsvpc' for task definitions
   - ECS service running 3 tasks initially
   - Container images sourced from private ECR repository
   - Auto-scaling configuration: minimum 3 tasks, maximum 10 tasks based on CPU utilization

4. **Database Layer**
   - RDS PostgreSQL instance using db.t3.micro instance class
   - Multi-AZ deployment for high availability
   - Deployed in private subnets for security
   - Deletion protection enabled (but infrastructure must remain destroyable for testing)
   - Database credentials fetched from AWS Secrets Manager (existing secret, not created)

5. **Security and Access Control**
   - Security groups controlling traffic between ALB, ECS tasks, and RDS
   - ALB security group allowing HTTPS traffic on port 443
   - ECS security group allowing traffic from ALB on port 3000
   - RDS security group allowing PostgreSQL traffic from ECS on port 5432
   - IAM roles and policies following principle of least privilege
   - ECS task execution role with permissions for ECR and CloudWatch Logs
   - ECS task role with permissions for application-level AWS service access

6. **Logging and Monitoring**
   - CloudWatch log groups for ECS tasks
   - 7-day retention policy for logs
   - Proper log stream configuration for container stdout/stderr

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **@pulumi/aws** package version 5.x or higher
- Deploy to **ap-northeast-2** region
- Resource names must include **environmentSuffix** for uniqueness and multi-environment support
- Follow naming convention: `{resource-type}-{purpose}-${environmentSuffix}`
- All resources tagged with: Environment='production', ManagedBy='pulumi'
- Encryption at rest using AWS KMS for all applicable resources
- Encryption in transit using TLS/SSL for all data transfer
- All resources must be destroyable (careful with deletion protection settings)
- Container image from private ECR repository (path to be specified)
- Proper error handling and validation in code

### Constraints

- RDS instance must use db.t3.micro instance class for cost optimization
- ECS tasks configured with exactly 512 CPU units and 1024 MiB memory
- Network mode must be 'awsvpc' for ECS task definitions
- ALB must use SSL certificate from AWS Certificate Manager
- Database credentials must be fetched from existing AWS Secrets Manager secret
- No hardcoded credentials or sensitive data in code
- All IAM policies must follow principle of least privilege
- Resources must support tagging with Environment and ManagedBy tags
- Infrastructure must be fully destroyable for testing and CI/CD pipelines

## Success Criteria

- **Functionality**: Complete working ECS cluster with containerized application accessible via HTTPS through ALB
- **High Availability**: Multi-AZ deployment for both application and database layers
- **Security**: All traffic encrypted, proper network isolation, least privilege IAM policies
- **Scalability**: Auto-scaling configuration responds to CPU utilization metrics
- **Observability**: CloudWatch logs capturing all container output with appropriate retention
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Outputs**: ALB DNS name and database endpoint exported for integration testing
- **Code Quality**: Well-structured TypeScript code with proper type definitions and documentation

## What to deliver

- Complete **Pulumi with TypeScript** implementation
- VPC, Subnets, Internet Gateway, NAT Gateway, Route Tables
- Application Load Balancer with Target Groups and Listeners
- ECS Cluster, Task Definition, and Service configuration
- RDS PostgreSQL instance with Multi-AZ setup
- Security Groups for ALB, ECS, and RDS
- Route53 hosted zone and DNS records
- CloudWatch log groups with retention policies
- Auto Scaling configuration for ECS service
- IAM roles and policies for ECS tasks
- Integration with AWS Secrets Manager for database credentials
- Proper KMS encryption configuration
- Unit tests for infrastructure components
- Documentation with deployment instructions and architecture overview
- Exported outputs for ALB DNS name and database endpoint
