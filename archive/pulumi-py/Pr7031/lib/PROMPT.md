Hey team,

We need to deploy a secure web application infrastructure for a fintech startup's loan processing system. The application handles sensitive financial documents and requires strict compliance for data residency and audit trails. We need to maintain detailed access logs for regulatory audits while ensuring sub-second response times for customer-facing operations.

I've been asked to create this using **Pulumi with Python**. The business needs production-grade infrastructure with proper security, monitoring, and compliance controls.

## What we need to build

Create a secure loan processing infrastructure using **Pulumi with Python** that meets financial services compliance requirements.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 availability zones in eu-west-2
   - Public subnets for Application Load Balancer
   - Private subnets for ECS tasks and RDS Aurora
   - NAT Gateways for outbound connectivity from private subnets
   - Security groups with least-privilege access

2. **Compute Layer**
   - ECS Fargate cluster for containerized web application
   - Auto-scaling ECS service based on CPU/memory metrics
   - Tasks running in private subnets with no direct internet access

3. **Database Layer**
   - RDS Aurora MySQL cluster with Multi-AZ deployment
   - Encrypted storage using customer-managed KMS keys
   - IAM authentication enabled (no password authentication)
   - Deployed in private subnets

4. **Load Balancing**
   - Application Load Balancer with HTTPS listener
   - Target groups configured for ECS tasks
   - Access logs enabled and stored in S3

5. **Logging and Monitoring**
   - CloudWatch Log Groups with 365-day retention for all services
   - S3 bucket for ALB access logs with lifecycle policy (90-day transition to Glacier)
   - Proper log group naming and retention policies

6. **Security and Compliance**
   - Least-privilege IAM roles for ECS task execution and RDS access
   - Customer-managed KMS keys for RDS encryption
   - S3 buckets with versioning enabled and public access blocked
   - Required tags on all resources: Environment, CostCenter, ComplianceLevel

7. **Optional Enhancements** (if time permits)
   - WAF rules on ALB for SQL injection protection
   - Route 53 health checks with failover records
   - AWS Secrets Manager for database credentials rotation

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Deploy to **eu-west-2** region (no cross-region replication)
- Use **VPC** for network isolation
- Use **ECS Fargate** for containerized application
- Use **RDS Aurora MySQL** with encryption and IAM authentication
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch** for logging with 365-day retention
- Use **S3** for ALB access logs with lifecycle policies
- Use **KMS** for customer-managed encryption keys
- Use **NAT Gateway** for private subnet outbound connectivity
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`

### Constraints

- All resources must remain in eu-west-2 region (data residency requirement)
- RDS Aurora must use encrypted storage with customer-managed KMS keys
- Database connections must use IAM authentication (no passwords)
- ECS tasks must run in private subnets with no direct internet access
- ALB access logs must be enabled and stored in S3
- S3 buckets must have versioning enabled and block public access
- CloudWatch logs must have 365-day retention for compliance
- All resources must be destroyable (no Retain policies)
- All resources must be tagged: Environment, CostCenter, ComplianceLevel
- Include proper error handling and logging
- Support 10,000 concurrent users with auto-scaling

### Deployment Requirements (CRITICAL)

1. **environmentSuffix Usage**: ALL named resources (S3 buckets, KMS keys, log groups, etc.) must include the environmentSuffix parameter in their names to avoid naming conflicts across parallel deployments. Use format: `f"{resource_name}-{environment_suffix}"`

2. **Destroyability**: All resources must be completely destroyable after testing. DO NOT use any Retain removal policies or deletion protection flags. This is required for automated cleanup.

3. **RDS Aurora Serverless**: Prefer Aurora Serverless v2 over provisioned instances for faster deployment and cost optimization. Configure with proper scaling and backup settings for destroyability.

4. **NAT Gateway Cost Warning**: NAT Gateways are expensive (~$32/month each). Consider using only 1 NAT Gateway instead of per-AZ deployment for cost optimization in non-production environments.

5. **Lambda Runtime Compatibility** (if using Lambda): Node.js 18+ runtimes do not include AWS SDK v2. Use AWS SDK v3 or extract required data from event objects.

## Success Criteria

- **Functionality**: Complete infrastructure deployment with all core AWS services
- **Performance**: Support 10,000 concurrent users with auto-scaling
- **Reliability**: Multi-AZ deployment for high availability
- **Security**: Encryption at rest and in transit, IAM authentication, least-privilege roles
- **Compliance**: 365-day log retention, data residency in eu-west-2, required tags
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: Infrastructure can be fully destroyed without manual intervention
- **Code Quality**: Python best practices, well-tested, documented

## What to deliver

- Complete Pulumi Python implementation
- VPC with 3 AZs, public/private subnets, NAT Gateways
- ECS Fargate cluster with auto-scaling service
- RDS Aurora MySQL with encryption and IAM authentication
- Application Load Balancer with HTTPS listener
- CloudWatch Log Groups with 365-day retention
- S3 bucket for ALB logs with lifecycle policy
- Least-privilege IAM roles
- Customer-managed KMS keys
- Required resource tags
- Unit tests for all components
- Documentation and deployment instructions
