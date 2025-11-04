# Product Catalog API Infrastructure

Hey team,

We need to build a production-ready infrastructure for our retail product catalog API. The business is preparing for seasonal sales traffic spikes and needs a robust, scalable deployment that can handle high volumes while maintaining consistent performance. I've been asked to create this using **cdktf with py** targeting the eu-north-1 region.

The API is containerized and runs on port 3000, serving product data from a PostgreSQL database. During peak seasons, traffic can increase dramatically, so the infrastructure needs to scale automatically while keeping response times low. We also need global content delivery to ensure customers worldwide get fast responses.

The technical team has specified that we must use CDK L2 constructs for better abstraction and maintainability. Database credentials need to be securely managed, and all components must have proper logging for troubleshooting. Cost optimization is important, so we're looking at using Fargate Spot instances where possible.

## What we need to build

Create a containerized API deployment infrastructure using **cdktf with py** for a product catalog service that can handle variable traffic patterns and maintain high availability.

### Core Requirements

1. **Container Orchestration**
   - ECS Fargate service running the API container on port 3000
   - Use FARGATE_SPOT capacity provider for cost optimization
   - Allocate 1 vCPU and 2GB memory per task
   - Configure environment variables for database connection in ECS tasks

2. **Load Balancing and Health Monitoring**
   - Application Load Balancer for distributing traffic
   - Health checks on /health endpoint
   - 30 seconds interval with 2 consecutive failures threshold

3. **Database Layer**
   - RDS Aurora PostgreSQL in private subnets
   - Minimum db.t3.medium instance class
   - Automatic backups enabled
   - Database password stored in Secrets Manager

4. **Content Delivery**
   - CloudFront distribution for global content delivery
   - Use managed caching policy for API endpoints

5. **Auto-scaling Configuration**
   - Minimum 2 tasks, maximum 10 tasks
   - Scale based on CPU utilization

6. **Networking and Security**
   - VPC with public and private subnets across 2 availability zones
   - Security groups following least privilege principle
   - Allow ALB to ECS traffic
   - Allow ECS to RDS traffic

7. **Observability**
   - CloudWatch logging for all components
   - S3 log buckets with 30-day lifecycle policy

8. **Resource Organization**
   - Tag all resources with Environment=production
   - Tag all resources with Project=catalog-api
   - All resource names must include **environmentSuffix** for uniqueness

### Technical Requirements

- All infrastructure defined using **cdktf with py**
- Use CDK L2 constructs only (no L1 constructs)
- Resource naming convention: use f-strings with `{environment_suffix}` parameter
- Deploy to **eu-north-1** region
- Stack deployment must complete within 15 minutes
- All resources must be destroyable (no deletion protection, no retention policies)
- Follow naming convention: `resource-type-{environment_suffix}`

### Critical Implementation Guidelines

**S3 Backend Configuration:**
- Use `encrypt=True` for state encryption
- Do NOT use `use_lockfile` property - it does not exist in Terraform S3 backend configuration
- Do NOT use `add_override` to add invalid backend properties
- State locking via DynamoDB is handled automatically by Terraform S3 backend

**Aurora PostgreSQL Version Compatibility:**
- Verify engine version availability in the target region before deployment
- Version 15.3 is NOT available in eu-north-1
- Use version 16.4 or later for eu-north-1 region
- Check AWS documentation for region-specific engine version availability

**CloudFront Cache Behavior Configuration:**
- When using `cache_policy_id`, do NOT specify `forwarded_values`
- These parameters are mutually exclusive - using both causes deployment failure
- Managed cache policies control forwarding behavior
- Use cache_policy_id `4135ea2d-6df8-44a3-9df3-4b5a84be39ad` for CachingOptimized policy

**ECS Service Configuration:**
- Do NOT specify both `launch_type` and `capacity_provider_strategy` simultaneously
- When using capacity_provider_strategy, remove launch_type parameter
- Launch type is automatically inferred from the capacity provider

**S3 Lifecycle Configuration:**
- Every lifecycle rule MUST include either `filter` or `prefix` parameter
- Use empty prefix `prefix=""` to apply rule to all objects
- Import S3BucketLifecycleConfigurationRuleFilter when using filter parameter
- Missing filter/prefix will cause warnings and future deployment failures

**Secrets Manager Configuration:**
- Set `recovery_window_in_days=0` for test/dev environments to allow immediate deletion
- Secrets have 30-day retention by default which blocks recreation with same name
- Use version suffixes in secret names to avoid naming conflicts

### Common Deployment Failures to Avoid

Based on MODEL_FAILURES analysis, avoid these critical errors:

1. **Invalid S3 Backend Properties**: Do not use `add_override` to inject non-existent properties like `use_lockfile`
2. **Regional Version Incompatibility**: Aurora PostgreSQL 15.3 fails in eu-north-1, use 16.4 or later
3. **CloudFront Parameter Conflicts**: Cannot combine `cache_policy_id` with `forwarded_values`
4. **ECS Launch Type Conflicts**: Cannot specify both `launch_type` and `capacity_provider_strategy`
5. **S3 Lifecycle Missing Filter**: All lifecycle rules require `filter` or `prefix` parameter
6. **Secrets Manager Naming Conflicts**: Use version suffixes and set `recovery_window_in_days=0`

### Constraints

- ECS tasks must have exactly 1 vCPU and 2GB memory allocated
- RDS instance must use db.t3.medium class minimum
- CloudFront must use managed caching policy for API endpoints
- ALB health check settings: 30 seconds interval, 2 consecutive failures threshold
- S3 log buckets: 30-day lifecycle policy
- Security groups: least privilege principle
- Database password: stored in Secrets Manager
- ECS service: use FARGATE_SPOT capacity provider
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: ECS service successfully runs containers and connects to database
- **Performance**: Auto-scaling responds to CPU utilization changes
- **Reliability**: Multi-AZ deployment with health checks and automatic failover
- **Security**: Database credentials in Secrets Manager, proper security group isolation
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: py code, well-structured, properly typed, documented
- **Observability**: CloudWatch logs capture all component activity
- **Global Delivery**: CloudFront distributes content with proper caching

## What to deliver

- Complete cdktf py implementation in lib/tap_stack.py
- VPC with public and private subnets across 2 AZs
- ECS Fargate cluster and service with auto-scaling
- Application Load Balancer with health checks
- RDS Aurora PostgreSQL cluster with Secrets Manager integration
- CloudFront distribution
- Security groups for ALB, ECS, and RDS
- CloudWatch log groups
- S3 bucket for logs with lifecycle policy
- Stack outputs for CloudFront distribution URL and ALB DNS name
- Documentation and deployment instructions

## Documentation Excellence Standards

For training quality 10/10, provide comprehensive documentation suite:

### Architecture Documentation
- **ARCHITECTURE.md**: Complete system overview with diagrams, component details, and design decisions
- Network topology, security architecture, and scalability patterns
- Mermaid diagrams for visual representation
- Component interaction flows and data paths

### Security Documentation  
- **SECURITY_GUIDE.md**: Comprehensive security analysis and best practices
- Network security, IAM policies, encryption at rest and in transit
- Security group configurations and access patterns
- Compliance frameworks (SOC 2, GDPR, ISO 27001)
- Incident response procedures and security monitoring

### Operational Documentation
- **MONITORING_GUIDE.md**: Complete observability strategy
- CloudWatch metrics, alarms, and dashboards configuration
- Log analysis queries and troubleshooting playbooks
- Performance optimization and cost monitoring
- SLA definitions and alerting strategies

### Deployment and Troubleshooting
- **DEPLOYMENT_GUIDE.md**: Step-by-step deployment procedures
- **ERROR_RESOLUTION_SUMMARY.md**: Common issues and solutions
- Environment configuration and prerequisites
- Validation procedures and testing strategies

### Training Quality Indicators
- Comprehensive error analysis with MODEL_FAILURES documentation
- Real-world deployment scenarios and edge cases
- Production-ready configurations with security best practices
- Clear architectural decisions and trade-off explanations
- Advanced monitoring, alerting, and operational procedures