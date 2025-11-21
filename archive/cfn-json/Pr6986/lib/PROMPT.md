# Loan Application Web Portal Infrastructure

Hey team,

We need to build infrastructure for a customer-facing web portal that processes loan applications for a financial services company. The business is looking for high availability, secure data handling, and the ability to automatically scale during peak traffic hours when most loan applications come in.

This is a production-grade deployment that needs to handle variable traffic patterns. During business hours, especially around lunch time and early evening, we see significant spikes in applications. The system needs to scale automatically to handle these peaks while keeping costs reasonable during off-hours.

The infrastructure will be deployed in us-east-2 across multiple availability zones for resilience. We're dealing with sensitive financial data, so security and compliance are top priorities. All database credentials need automatic rotation, and we have strict logging requirements for audit purposes.

## What we need to build

Create a complete loan processing web application infrastructure using **CloudFormation with JSON** for deployment to AWS.

### Core Infrastructure Requirements

1. **VPC and Networking**
   - VPC with 3 public subnets and 3 private subnets across 3 availability zones
   - NAT Gateways in each AZ for outbound traffic from private subnets
   - Internet Gateway for public subnet access
   - Route tables properly configured for public and private subnets

2. **Application Layer**
   - ECS Fargate service running Node.js containerized application
   - Minimum 2 tasks, maximum 10 tasks for auto scaling
   - Tasks deployed in private subnets across multiple AZs
   - Application listens on port 3000
   - Health checks on /health endpoint

3. **Load Balancing**
   - Application Load Balancer in public subnets
   - Health checks configured for /health endpoint
   - Distributes traffic across ECS tasks in multiple AZs
   - Only the ALB should have public access

4. **Database Layer**
   - RDS Aurora MySQL cluster with Multi-AZ deployment
   - 2 database instances across different availability zones
   - Deletion protection enabled
   - Backup retention set to 7 days
   - Deployed in private subnets

5. **Static Assets and CDN**
   - S3 bucket for hosting static assets
   - Versioning enabled on S3 bucket
   - Lifecycle policy for 90-day object expiration
   - CloudFront distribution for content delivery
   - CORS configuration for frontend domain only

6. **Auto Scaling**
   - ECS service auto scaling based on ALB RequestCountPerTarget metric
   - Step scaling policies to handle traffic spikes gradually
   - Scale out when request count increases
   - Scale in during low traffic periods

### Security and Access Control

1. **IAM Roles and Policies**
   - ECS task execution role for pulling container images
   - ECS task role with least privilege access to RDS and S3
   - No overly permissive wildcard permissions
   - Proper trust relationships for service principals

2. **Security Groups**
   - ALB security group allowing inbound HTTP/HTTPS from internet
   - ECS task security group allowing traffic only from ALB on port 3000
   - RDS security group allowing traffic only from ECS tasks
   - No direct public access to ECS tasks or RDS

3. **Secrets Management**
   - Database credentials stored in AWS Secrets Manager
   - Automatic credential rotation enabled
   - ECS tasks retrieve credentials from Secrets Manager at runtime
   - No hardcoded credentials in templates or containers

### Monitoring and Alerting

1. **CloudWatch Dashboard**
   - ALB metrics: Request count, response time, target health
   - ECS metrics: CPU utilization, memory utilization, task count
   - RDS metrics: Database connections, CPU usage, storage

2. **CloudWatch Logs**
   - Centralized logging for ECS tasks
   - Log retention set to exactly 30 days for compliance
   - Structured logging for easy analysis

3. **SNS Notifications**
   - SNS topic for critical infrastructure alerts
   - Alarm when ECS tasks fail or become unhealthy
   - Alarm when RDS CPU exceeds 80 percent
   - Email or SMS notifications to operations team

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Deploy to **us-east-2** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable with no Retain deletion policies
- Proper resource dependencies defined in template
- Use CloudFormation parameters for environment-specific values
- Include outputs for key resource ARNs and endpoints

### Mandatory Constraints

- All database credentials stored in AWS Secrets Manager with automatic rotation
- Application logs centralized in CloudWatch with exactly 30 days retention
- CORS explicitly configured for frontend domain only on S3/CloudFront
- All S3 buckets must have versioning enabled
- S3 lifecycle policies for 90-day object expiration
- Auto Scaling must use step scaling policies based on ALB request count

### Deployment Requirements (CRITICAL)

- All resources must be fully destroyable (no DeletionPolicy: Retain)
- Resource naming must include environmentSuffix for multi-environment deployment
- Template must use Parameters for configurable values
- Avoid slow-deploying resources where possible
- Prefer Aurora Serverless over provisioned instances if appropriate
- Ensure proper dependency order using DependsOn where needed

## Success Criteria

- **Functionality**: Complete working loan application infrastructure that scales automatically
- **High Availability**: Multi-AZ deployment for all critical components
- **Security**: Least privilege IAM roles, encrypted data at rest and in transit, credentials in Secrets Manager
- **Monitoring**: Comprehensive CloudWatch dashboard with critical alarms
- **Compliance**: 30-day log retention, versioned S3 buckets, audit trails
- **Performance**: Auto scaling handles traffic spikes, CloudFront reduces latency
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: Clean teardown with no retained resources

## What to deliver

- Complete CloudFormation JSON template (lib/TapStack.json)
- Parameters section for environment-specific configuration
- All AWS resources: VPC, subnets, NAT gateways, ALB, ECS Fargate, RDS Aurora MySQL, S3, CloudFront, Auto Scaling, IAM roles, CloudWatch dashboard, SNS topic, Secrets Manager
- Security groups with proper ingress/egress rules
- CloudWatch alarms for critical metrics
- Outputs section with resource ARNs, endpoints, and URLs
- Clear resource dependencies and proper ordering
- Documentation of deployment parameters and expected outputs
