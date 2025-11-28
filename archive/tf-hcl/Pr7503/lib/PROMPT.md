# Loan Processing Infrastructure for Fintech Startup

Hey team,

We need to build a production-grade loan application processing system for a fintech startup that's experiencing rapid growth. The system needs to handle variable traffic spikes during business hours while maintaining sub-second response times for credit decisions. This is critical because customers expect instant feedback on their loan applications, and any delays directly impact conversion rates.

The infrastructure must meet strict PCI DSS compliance requirements since we're handling sensitive financial data. We're deploying this using **Terraform with HCL** to ensure reproducible infrastructure deployments and easy scaling as the business grows.

The current challenge is that our manual processes can't keep up with demand, and we need automated, scalable infrastructure that can handle anywhere from 100 to 10,000 requests per hour depending on the time of day. The system also needs to support batch processing jobs that run overnight to reassess existing loans based on updated credit scores.

## What we need to build

Create a complete loan processing infrastructure using **Terraform with HCL** for a production environment in us-east-1 spanning 3 availability zones. The infrastructure needs to support containerized microservices, handle variable traffic loads, and meet strict security and compliance requirements.

### Core Requirements

1. **Network Infrastructure**
   - VPC with 3 public and 3 private subnets across 3 availability zones
   - Internet Gateway for public subnet connectivity
   - NAT Gateways in each AZ for private subnet internet access
   - Route tables configured for proper traffic routing
   - Network ACLs for subnet-level security

2. **Compute Layer**
   - ECS cluster with Fargate launch type for serverless container management
   - ECS services running the loan processing API
   - Task definitions with proper CPU and memory allocations
   - Service discovery for inter-service communication
   - Auto Scaling policies based on CPU and memory metrics

3. **Database Layer**
   - Aurora PostgreSQL Serverless v2 cluster with 0.5-1 ACU scaling
   - Multi-AZ deployment for high availability
   - Point-in-time recovery enabled
   - Automated backups with 7-day retention
   - IAM database authentication configured

4. **Load Balancing**
   - Application Load Balancer in public subnets
   - Target groups for ECS services
   - Health checks configured for container health
   - Path-based routing to different microservices
   - Sticky sessions for stateful operations

5. **Monitoring and Logging**
   - CloudWatch Container Insights for ECS cluster monitoring
   - CloudWatch log groups for application logs
   - Custom CloudWatch metrics for business KPIs
   - CloudWatch alarms for critical metrics
   - CloudWatch dashboard for operational visibility

6. **Storage**
   - S3 bucket for application logs with lifecycle policies
   - S3 bucket for loan document storage with versioning
   - Bucket policies for access control
   - Lifecycle transitions to Glacier for cost optimization

7. **Content Delivery**
   - CloudFront distribution for static assets
   - S3 origin configuration
   - Cache behaviors optimized for asset types
   - Custom error pages

8. **Security**
   - AWS WAF v2 WebACL attached to ALB
   - Managed rule groups for SQL injection protection
   - Managed rule groups for XSS protection
   - Custom rules for rate limiting
   - IP-based access controls

9. **Event Processing**
   - EventBridge rules for scheduled batch processing
   - Targets configured for ECS task execution
   - Cron expressions for nightly jobs
   - Dead letter queues for failed events

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation with 3 public and 3 private subnets across 3 AZs
- Use **ECS Fargate** for containerized application hosting
- Use **Aurora PostgreSQL Serverless v2** for database with 0.5-1 ACU scaling
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch** for monitoring and logging with Container Insights
- Use **S3** for storage with lifecycle policies
- Use **CloudFront** for content delivery
- Use **AWS WAF** for application security
- Use **EventBridge** for scheduled batch processing
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-${var.environment_suffix}
- Deploy to **us-east-1** region
- Use proper Terraform modules for reusability

### Deployment Requirements (CRITICAL)

All resources MUST be configured for complete destroyability:
- No lifecycle policies with prevent_destroy = true
- No RETAIN deletion policies
- All S3 buckets must have force_destroy = true
- All KMS keys must allow deletion
- Database instances must skip final snapshot or use automated cleanup
- Resources must be tagged consistently for tracking
- All resources MUST include environmentSuffix in their names for uniqueness

### Constraints

1. **Encryption**: All data must be encrypted at rest using customer-managed KMS keys with automatic rotation enabled
2. **Authentication**: RDS instances must use IAM database authentication instead of password-based authentication
3. **TLS**: ALB must terminate TLS with AWS Certificate Manager certificates and enforce TLS 1.2 minimum
4. **Cost Optimization**: While Auto Scaling Groups requirement mentions mixed instances with 20% spot, for ECS Fargate we'll use Fargate Spot capacity provider strategy for 20% spot allocation
5. **Network Security**: All compute resources must be deployed in private subnets with no direct internet access
6. **High Availability**: Multi-AZ deployment required for all critical components
7. **Compliance**: Logging and monitoring must capture all access for audit trails
8. **Destroyability**: All resources must be fully destroyable without manual intervention (FORBIDDEN: prevent_destroy, RETAIN policies)

## Success Criteria

- **Functionality**: All components deploy successfully and can handle loan processing requests
- **Performance**: Aurora scales between 0.5-1 ACU, ECS services auto-scale based on load
- **Reliability**: Multi-AZ deployment ensures high availability
- **Security**: WAF protects against common attacks, all data encrypted at rest and in transit
- **Monitoring**: CloudWatch provides full visibility into system health
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Code Quality**: Clean HCL code, well-organized, properly documented
- **Compliance**: Meets PCI DSS requirements for data handling

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC with proper subnet configuration across 3 AZs
- ECS Fargate cluster with auto-scaling capabilities
- Aurora PostgreSQL Serverless v2 with IAM authentication
- Application Load Balancer with WAF protection
- CloudWatch monitoring with Container Insights
- S3 buckets for logs and documents
- CloudFront distribution for static content
- EventBridge rules for batch processing
- KMS keys for encryption with auto-rotation
- Variables file with all configurable parameters including environmentSuffix
- Outputs file with key resource identifiers
- Provider configuration with required versions
