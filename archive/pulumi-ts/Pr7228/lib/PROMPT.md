Hey team,

We need to build production infrastructure for our e-commerce platform's product catalog API. The business is launching flash sales campaigns that will drive 50,000 concurrent users, and our current infrastructure can't handle that load while maintaining sub-200ms response times. I've been asked to create this using Pulumi with TypeScript to provision a scalable, highly available web application infrastructure.

The product team runs a Node.js API for real-time inventory updates, and we need to deploy it across multiple availability zones with automated scaling. Marketing wants CloudFront distribution for static assets to reduce load times, and the database team needs Aurora PostgreSQL Serverless v2 with read replicas for the existing database workload. Operations wants comprehensive monitoring and alarms so we can respond to issues during peak traffic.

The architecture needs VPC networking with public and private subnets, Application Load Balancer for traffic distribution, Lambda functions running the containerized Node.js API, CloudFront CDN for static content, Aurora PostgreSQL cluster with read replicas, and full CloudWatch monitoring. Everything must scale automatically based on CPU utilization and handle traffic spikes gracefully.

## What we need to build

Create a high-performance web application infrastructure using **Pulumi with TypeScript** for an e-commerce platform product catalog API.

### Core Requirements

1. **VPC Network Architecture**
   - Create VPC with 3 public subnets and 3 private subnets across different availability zones
   - Deploy NAT Gateways in each availability zone for outbound connectivity from private subnets
   - Configure route tables for public and private subnet traffic routing
   - Enable DNS hostnames and DNS resolution in the VPC

2. **Lambda Container Functions**
   - Deploy Lambda functions running containerized Node.js API
   - Configure Lambda with 3GB memory allocation for optimal cold start performance
   - Use ARM-based Graviton2 processors for cost optimization
   - Set up auto-scaling from 2 to 10 concurrent executions
   - Place Lambda functions in private subnets with security group access to Aurora

3. **Application Load Balancer**
   - Configure ALB in public subnets with path-based routing rules
   - Implement sticky sessions for user session persistence
   - Set health check interval to 5 seconds with 2-second timeout
   - Create target groups for Lambda function integration
   - Configure security groups for ALB to accept HTTP/HTTPS traffic

4. **CloudFront Distribution**
   - Create CloudFront distribution with S3 origin for static assets
   - Add ALB origin for API traffic routing
   - Configure custom error pages for 4xx and 5xx responses
   - Enable origin access identity for S3 bucket access
   - Set up cache behaviors for static and dynamic content

5. **Aurora PostgreSQL Serverless v2**
   - Provision Aurora PostgreSQL Serverless v2 cluster with one writer instance
   - Deploy two reader instances for read scaling
   - Place Aurora cluster in private subnets across multiple availability zones
   - Configure security groups for database access from Lambda functions
   - Set up subnet group for Aurora cluster placement

6. **RDS Proxy**
   - Create RDS Proxy for connection pooling to Aurora cluster
   - Limit concurrent database connections to 100
   - Configure IAM authentication for secure database access
   - Place RDS Proxy in private subnets with security group rules

7. **Lambda@Edge Functions**
   - Implement Lambda@Edge function for request authentication
   - Add header manipulation logic for security headers
   - Associate with CloudFront distribution for edge processing
   - Configure appropriate IAM role for Lambda@Edge execution

8. **DynamoDB Tables**
   - Create DynamoDB tables for handling traffic spikes
   - Configure pay-per-request billing mode for automatic scaling
   - Set up tables for session management and caching
   - Add appropriate indexes for query performance

9. **API Gateway**
   - Configure API Gateway with usage plans
   - Implement 10,000 requests per second throttling limit
   - Set up API keys and usage plans for rate limiting
   - Integrate API Gateway with Lambda functions

10. **CloudWatch Monitoring**
    - Create CloudWatch dashboards with custom metrics for API latency
    - Add custom metrics for error rates and request counts
    - Configure CloudWatch Logs for Lambda function logs
    - Set up log groups with retention policies

11. **CloudWatch Alarms**
    - Create alarms for ALB target health monitoring
    - Set up alarms for EC2 task count tracking
    - Configure alarms for RDS connection count monitoring
    - Add alarms for Lambda function errors and throttling
    - Configure SNS topics for alarm notifications

12. **Auto Scaling Policies**
    - Implement Auto Scaling policies based on CPU utilization
    - Configure scale-out trigger at 70% CPU utilization
    - Set up scale-in policies for cost optimization
    - Define minimum and maximum capacity limits

13. **S3 Buckets**
    - Create S3 bucket for static assets with CloudFront origin access
    - Set up S3 bucket for application logs with encryption
    - Create S3 bucket for application artifacts and deployment packages
    - Enable versioning on all buckets
    - Configure lifecycle policies for 30-day retention
    - Enable server-side encryption with AES-256 or KMS

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-east-1** region across 3 availability zones
- Use **VPC** with public and private subnet architecture
- Use **Lambda** with container image support for Node.js API
- Use **Application Load Balancer** for traffic distribution
- Use **CloudFront** for CDN and edge caching
- Use **S3** for static assets, logs, and artifacts storage
- Use **Aurora PostgreSQL Serverless v2** with read replicas
- Use **Lambda@Edge** for edge computing and authentication
- Use **CloudWatch** for monitoring, logging, and dashboards
- Use **Auto Scaling** for dynamic capacity management
- Use **DynamoDB** with on-demand billing for traffic spikes
- Use **API Gateway** with usage plans and throttling
- Use **RDS Proxy** for connection pooling
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must support clean teardown with no Retain policies

### Security and Configuration Management

- **Database Credentials**: Aurora PostgreSQL cluster password is configurable via Pulumi config
   A default test password can be  provided via variable
- **IAM Roles**: All services use least-privilege IAM roles
- **Encryption**: S3 buckets use server-side encryption (AES-256 or KMS)
- **Network Security**: Private subnets for databases and Lambda, security groups for access control
- **Secrets Management**: Sensitive values stored as Pulumi secrets and marked with `pulumi.secret()`

### Deployment Requirements (CRITICAL)

- All named resources must include **environmentSuffix** string parameter in their names
- Use pattern: bucket-name-environment-suffix, table-name-environment-suffix, etc.
- No resources should have RemovalPolicy.RETAIN or DeletionProtection enabled
- All resources must be fully destroyable for testing and cleanup
- Lambda functions must use Node.js 18+ runtime with proper IAM roles
- Security groups must follow least privilege principle
- All S3 buckets must block public access unless explicitly required for CloudFront

### Constraints

- Lambda functions must have exactly 3GB memory allocation
- DynamoDB tables must use pay-per-request billing mode only
- API Gateway throttling limit must be 10,000 requests per second
- RDS Proxy connection limit must be 100 concurrent connections
- CloudFront must have custom error pages configured
- S3 buckets must have versioning enabled
- S3 lifecycle policies must enforce 30-day retention
- Lambda functions must use ARM-based Graviton2 architecture
- ALB health checks must run every 5 seconds with 2-second timeout
- Aurora cluster must be in private subnets only
- NAT Gateways required in each availability zone for Lambda internet access

## Success Criteria

- **Functionality**: All AWS services provisioned and integrated correctly
- **Scalability**: Auto-scaling configured for Lambda and Aurora read replicas
- **Performance**: Infrastructure supports 50,000 concurrent users with sub-200ms latency
- **High Availability**: Resources deployed across 3 availability zones
- **Monitoring**: CloudWatch dashboards and alarms operational for all critical metrics
- **Security**: Resources in private subnets, security groups configured, encryption enabled
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be cleanly torn down without manual intervention
- **Code Quality**: TypeScript code with proper typing, error handling, and Pulumi best practices

## What to deliver

- Complete Pulumi TypeScript program implementing all infrastructure components
- VPC with 3 public and 3 private subnets across availability zones with NAT Gateways
- Lambda functions with container support, 3GB memory, ARM architecture
- Application Load Balancer with path-based routing and sticky sessions
- CloudFront distribution with S3 and ALB origins, custom error pages
- Aurora PostgreSQL Serverless v2 cluster with 1 writer and 2 readers
- Lambda@Edge function for authentication and header manipulation
- RDS Proxy with 100 connection limit
- DynamoDB tables with pay-per-request billing
- API Gateway with 10,000 req/sec throttling
- CloudWatch dashboards with custom metrics for latency and errors
- CloudWatch alarms for ALB health, task count, and RDS connections
- Auto Scaling policies triggering at 70% CPU
- S3 buckets with encryption, versioning, and 30-day lifecycle policies
- Proper IAM roles and security groups for all services
- Documentation on deployment and configuration
