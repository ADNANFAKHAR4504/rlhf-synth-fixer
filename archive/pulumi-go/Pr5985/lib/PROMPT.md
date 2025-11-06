# Payment Processing Infrastructure Migration

Hey team,

We need to migrate a payment processing system from on-premises to AWS. The company handles financial transactions for multiple merchants and needs a highly available, production-grade infrastructure that can handle thousands of concurrent payment requests while maintaining PCI DSS compliance.

The existing on-premises setup includes API servers handling payment requests, background job processors for batch operations, and PostgreSQL databases that need to be replicated in AWS with minimal downtime during the cutover phase.

## What we need to build

Create a complete payment processing infrastructure using **Pulumi with Go** that provides high availability across multiple availability zones in the us-east-1 region.

### Core Requirements

1. **VPC Infrastructure**
   - Create a VPC spanning 3 availability zones
   - Configure 3 public subnets for the Application Load Balancer
   - Configure 3 private subnets for ECS Fargate tasks and RDS Aurora cluster
   - Set up NAT Gateways in each availability zone to provide outbound internet access for private resources
   - Configure proper route tables and security groups

2. **Database Layer**
   - Deploy RDS Aurora PostgreSQL cluster with one writer instance and two reader instances
   - Deploy across private subnets in at least 2 availability zones for high availability
   - Enable encryption at rest using AWS managed KMS keys
   - Configure automated backups with point-in-time recovery
   - Store connection strings in AWS Secrets Manager with automatic rotation disabled for initial deployment

3. **Application Layer**
   - Set up ECS Fargate cluster with two services:
     - 'payment-api' service with 3 desired tasks for handling payment requests
     - 'job-processor' service with 2 desired tasks for batch operations
   - Configure proper task definitions with CPU and memory allocations
   - Enable auto-scaling based on CPU utilization
   - Deploy containers across multiple availability zones for fault tolerance

4. **Load Balancing**
   - Configure an Application Load Balancer in public subnets
   - Set up target groups for both ECS services
   - Configure path-based routing rules:
     - Route '/api/*' paths to the payment-api service
     - Route '/health' endpoint to both services for health checks
   - Enable connection draining and health checks

5. **Message Queue Infrastructure**
   - Create SQS queue named 'payment-jobs' for asynchronous job processing
   - Set message retention period to 14 days
   - Create dead-letter queue named 'payment-jobs-dlq' with 7-day retention for failed messages
   - Configure proper visibility timeout and receive message wait time

6. **Monitoring and Logging**
   - Configure CloudWatch Log Groups for each ECS service
   - Set retention period to 30 days for compliance
   - Enable CloudWatch Container Insights for ECS cluster metrics
   - Set up SNS topic named 'payment-alerts' for critical infrastructure events
   - Configure email subscription for operations team notifications

7. **Configuration Management**
   - Store non-sensitive configuration in Systems Manager Parameter Store
   - Create parameters for API timeout values and retry counts
   - Ensure proper IAM permissions for services to access parameters

8. **Resource Tagging**
   - Tag all resources with Environment='production'
   - Tag all resources with MigrationBatch='phase-1'
   - Include environmentSuffix in all resource names for uniqueness

### Technical Requirements

- All infrastructure defined using **Pulumi with Go**
- Deploy to **us-east-1** region
- Use AWS VPC for network isolation
- Use RDS Aurora PostgreSQL for database layer
- Use ECS Fargate for containerized applications with auto-scaling
- Use Application Load Balancer with path-based routing rules
- Use SQS for asynchronous job processing with DLQ configuration
- Use Secrets Manager for database credentials and API keys
- Use CloudWatch Logs for centralized logging with 30-day retention
- Use Systems Manager Parameter Store for non-sensitive configuration values
- Use SNS for alerting on critical infrastructure events
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must be destroyable (no Retain deletion policies)
- Include proper error handling and stack outputs

### Constraints

- Multi-AZ deployment required for high availability
- Private subnets for compute and database resources
- Public subnets only for load balancer
- Security groups must follow least privilege principle
- All data encryption at rest and in transit
- No DeletionProtection or Retain policies (testing infrastructure)
- Proper IAM roles with minimal permissions for inter-service communication

## Success Criteria

- **Functionality**: All AWS services deployed and integrated correctly
- **High Availability**: Resources distributed across at least 2 availability zones
- **Security**: Proper network segmentation, encryption, and IAM permissions
- **Monitoring**: CloudWatch logs and SNS alerts configured
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be destroyed cleanly after testing
- **Code Quality**: Well-structured Go code with proper error handling and documentation

## What to deliver

- Complete Pulumi Go implementation in single tap_stack.go file
- VPC with public and private subnets across 3 availability zones
- RDS Aurora PostgreSQL cluster with read replicas
- ECS Fargate cluster with two services (payment-api and job-processor)
- Application Load Balancer with path-based routing
- SQS queues for job processing (main queue and DLQ)
- Secrets Manager for database credentials
- CloudWatch Log Groups with 30-day retention
- SNS topic with email subscription
- Systems Manager parameters for application configuration
- Stack outputs including ALB DNS name, RDS cluster endpoint, and SQS queue URLs
- Proper IAM roles and security groups
- Resource tagging for Environment and MigrationBatch
