Hey team,

We need to build a production-grade order processing API deployment on AWS that can handle the demands of a growing e-commerce platform. The current setup struggles during traffic spikes from payment webhooks, and the business needs a reliable containerized solution that scales automatically while keeping costs under control.

The platform processes customer orders and payment notifications in real-time. During peak sales events, traffic can spike dramatically, so we need infrastructure that responds quickly to load changes. The order data needs to persist reliably in a database that supports the high read and write demands of the order processing workflow.

I've been asked to create this using **Pulumi with TypeScript** since that's our team's standard. The infrastructure needs to support blue-green deployments for zero-downtime updates, comprehensive monitoring for the operations team, and proper security controls including request throttling and secrets management.

## What we need to build

Create a containerized order processing API infrastructure using **Pulumi with TypeScript** for deployment in the us-east-1 region.

### Core Requirements

1. **VPC and Networking**
   - Create a VPC spanning 3 availability zones for high availability
   - Set up public subnets for the Application Load Balancer
   - Set up private subnets for ECS tasks and RDS instances
   - Deploy NAT gateways in each AZ to enable outbound internet access for container image pulls
   - Configure proper routing tables and internet gateway

2. **ECS Cluster with Fargate**
   - Create an ECS cluster for running the order API containers
   - Pull container images from ECR repository
   - Configure both regular Fargate and Fargate Spot capacity providers
   - Set capacity provider strategy with weighted distribution for at least 50 percent Spot instances
   - Enable CloudWatch Container Insights for detailed performance monitoring
   - Run tasks in private subnets with security group restrictions

3. **Application Load Balancer Configuration**
   - Deploy internet-facing Application Load Balancer in public subnets
   - Set up path-based routing rules for the order API
   - Configure health checks pointing to /health endpoint
   - Implement connection draining and deregistration delay
   - Create proper security groups allowing inbound HTTPS traffic

4. **Auto-Scaling Policies**
   - Configure auto-scaling based on CPU utilization with 70 percent target threshold
   - Set up custom CloudWatch metric for pending orders count
   - Create scaling policies triggered by pending orders metric
   - Define minimum and maximum task counts for scaling boundaries
   - Ensure scaling actions respond quickly to demand changes

5. **RDS Aurora MySQL Cluster**
   - Provision Aurora MySQL cluster for order data persistence
   - Deploy across multiple availability zones with automated failover
   - Create read replicas for improved read performance
   - Configure automated backups and maintenance windows
   - Enable encryption at rest for data protection
   - Size appropriately for order processing workload

6. **AWS WAF Integration**
   - Attach AWS WAF web ACL to the Application Load Balancer
   - Implement rate limiting rules allowing 100 requests per 5 minutes per IP address
   - Configure rules to protect against common web exploits
   - Set up monitoring for blocked requests

7. **Secrets Manager and Parameter Store**
   - Store database credentials in AWS Secrets Manager with automatic rotation capability
   - Store application configuration in Systems Manager Parameter Store
   - Grant ECS task IAM role permissions to access secrets and parameters
   - Inject secrets as environment variables in container tasks

8. **CloudWatch Monitoring and Dashboards**
   - Enable Container Insights at cluster level
   - Create custom CloudWatch dashboard for key metrics including task count, CPU, memory, request latency
   - Set up log groups for container logs with appropriate retention periods
   - Configure structured logging for easier debugging

9. **Blue-Green Deployment Support**
   - Create two target groups for blue and green environments
   - Configure listener rules supporting traffic shifting between target groups
   - Enable connection draining for graceful task termination
   - Set up infrastructure to support gradual traffic migration

10. **CloudWatch Alarms**
    - Create alarm for high error rate threshold from ALB target group metrics
    - Create alarm for database connection failures or high connection count
    - Configure alarm actions for notification when thresholds breach
    - Set appropriate evaluation periods and thresholds

11. **Resource Naming and Tagging**
    - Use environmentSuffix in all resource names for uniqueness across deployments
    - Follow naming convention: resource-type-environment-suffix
    - Tag all resources consistently for cost tracking and organization
    - Ensure all resources are fully destroyable with no Retain deletion policies

12. **Stack Outputs**
    - Export Application Load Balancer DNS name for accessing the API
    - Export ECS service ARN for operational monitoring and management
    - Export RDS cluster endpoint for database connection configuration

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** with public and private subnets across 3 AZs
- Use **ECS Fargate** with both regular and Spot capacity providers
- Use **ECR** for container image storage
- Use **Application Load Balancer** for traffic distribution
- Use **RDS Aurora MySQL** for database with Multi-AZ deployment
- Use **AWS WAF** for rate limiting and security
- Use **AWS Secrets Manager** for database credentials
- Use **Systems Manager Parameter Store** for application config
- Use **CloudWatch** for Container Insights, dashboards, alarms, and logging
- Use **IAM** roles and policies following least privilege principle
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region
- All resources must support clean destruction without manual intervention

### Constraints

- Must use Fargate Spot instances for at least 50 percent of ECS tasks to reduce infrastructure costs
- Must implement blue-green deployment capability using two target groups
- Auto-scaling must respond to both CPU utilization and custom CloudWatch metrics
- All database credentials and API keys must be stored in AWS Secrets Manager, never hardcoded
- Must deploy across exactly 3 availability zones for high availability requirements
- Request throttling must be implemented at ALB level using AWS WAF rate limiting rules
- All non-sensitive configuration values must use Systems Manager Parameter Store
- CloudWatch Container Insights must be enabled for detailed container performance monitoring
- NAT gateways required for container image pulls from private subnets
- Database must support read replicas for improved read performance
- Include proper error handling and validation throughout the code
- Use strongly-typed TypeScript throughout the implementation

## Success Criteria

- **Functionality**: ECS service successfully deploys containerized order API with proper connectivity to Aurora database
- **High Availability**: Infrastructure spans 3 availability zones with automatic failover for both compute and database
- **Load Balancing**: ALB distributes traffic to healthy ECS tasks with functioning health checks on /health endpoint
- **Auto-Scaling**: Service scales automatically based on CPU utilization above 70 percent and custom pending orders metric
- **Cost Optimization**: At least 50 percent of ECS tasks run on Fargate Spot for reduced costs
- **Security**: Database credentials secured in Secrets Manager, WAF rate limiting active, proper security group isolation
- **Monitoring**: CloudWatch Container Insights enabled, custom dashboard created, alarms configured for errors and database issues
- **Blue-Green Support**: Two target groups configured enabling traffic shifting for zero-downtime deployments
- **Database**: Aurora MySQL cluster operational with read replicas across multiple AZs
- **Networking**: VPC with public and private subnets, NAT gateways for outbound access
- **Resource Naming**: All resources include environmentSuffix in their names following the standard convention
- **Code Quality**: Clean strongly-typed TypeScript code following Pulumi best practices
- **Destroyability**: All resources can be cleanly destroyed without manual intervention or Retain policies

## What to deliver

- Complete Pulumi TypeScript implementation in the lib/ directory
- VPC with public and private subnets across 3 availability zones
- NAT gateways for outbound internet access from private subnets
- ECS cluster with Fargate and Fargate Spot capacity providers
- ECS service with weighted capacity provider strategy favoring Spot instances
- Task definition for order API container from ECR
- Application Load Balancer with health checks on /health endpoint
- AWS WAF web ACL with rate limiting rule allowing 100 requests per 5 minutes per IP
- Two target groups supporting blue-green deployment pattern
- Auto-scaling policies based on CPU utilization and custom pending orders metric
- RDS Aurora MySQL cluster with Multi-AZ deployment and read replicas
- AWS Secrets Manager secrets for database credentials
- Systems Manager Parameter Store parameters for application configuration
- CloudWatch Container Insights configuration
- CloudWatch dashboard with key infrastructure and application metrics
- CloudWatch alarms for high error rates and database connection failures
- IAM roles and policies for ECS tasks with least privilege permissions
- Security groups for ALB, ECS tasks, and RDS cluster
- Stack outputs for ALB DNS name, ECS service ARN, and RDS cluster endpoint
- Unit tests with 100 percent coverage verifying resource creation and configuration
- Documentation explaining the architecture, deployment process, and operational considerations