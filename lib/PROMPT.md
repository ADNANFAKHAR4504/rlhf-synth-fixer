# Financial Services Web Portal Infrastructure

Hey team,

We need to build infrastructure for a customer-facing web portal that handles account management and transaction history for a financial services company. The business is really pushing for strict security compliance and rock-solid availability - they've committed to a 99.95% uptime SLA with their customers. This means we need multi-region failover capabilities and automated scaling that accounts for trading hours when traffic spikes.

The application team has been building out the container-based application and they're ready for us to provision the infrastructure. This needs to handle real financial data, so security and compliance are non-negotiable. The business has also asked for cost optimization where possible, especially during off-peak hours, but not at the expense of reliability during trading hours.

We're looking at a fairly complex setup here - ECS Fargate for the application layer, Aurora Serverless for the database to handle the variable load patterns, and CloudFront with WAF for security at the edge. The compliance team has also mandated encryption everywhere and comprehensive logging for audit purposes.

## What we need to build

Create infrastructure using **Terraform with HCL** for a production-ready financial services web portal with high availability and automated scaling.

### Core Requirements

1. **Container Orchestration**
   - Deploy ECS Fargate service with minimum 3 tasks across multiple availability zones
   - Use Fargate Spot instances for cost optimization with on-demand fallback
   - Configure auto-scaling based on ALB request count and CPU metrics
   - Support zero-downtime deployments

2. **Database Layer**
   - Create Aurora PostgreSQL Serverless v2 cluster with read replicas
   - Enable automated backups with point-in-time recovery
   - Encrypt data at rest using customer-managed KMS keys
   - Configure across multiple AZs for high availability

3. **Load Balancing and Routing**
   - Configure Application Load Balancer with path-based routing
   - Implement SSL termination at the ALB
   - Set up health checks using custom HTTP endpoints with specific response codes
   - Distribute traffic across multiple availability zones

4. **Content Delivery and Edge Security**
   - Implement CloudFront distribution with custom origin headers
   - Configure geo-blocking for sanctioned countries
   - Set up WAF rules for SQL injection and XSS protection
   - Enable CloudFront access logging

5. **DNS and Failover**
   - Create Route53 health checks with failover routing policy
   - Configure DNS records for the web portal
   - Implement automated failover between regions

6. **Monitoring and Observability**
   - Create custom CloudWatch dashboard with key application metrics
   - Enable VPC flow logs for network analysis
   - Configure CloudWatch Logs for all services
   - Set up alarms for critical metrics

7. **Security and Compliance**
   - Implement IAM roles with least privilege access for all services
   - Enable encryption at rest for all data stores using KMS
   - Configure security groups with minimal required access
   - Enable audit logging for compliance requirements

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **ECS Fargate** for container orchestration
- Use **Aurora PostgreSQL Serverless v2** for database
- Use **Application Load Balancer** for traffic distribution
- Use **CloudFront** for content delivery and edge caching
- Use **WAF** for application-level security
- Use **CloudWatch** for monitoring and logging
- Use **Route53** for DNS and health checks
- Use **KMS** for encryption key management
- Deploy to **ap-southeast-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain deletion policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resources MUST include an environmentSuffix variable for resource naming to ensure uniqueness across deployments
- **Destroyability**: All resources must be fully destroyable. Do NOT use any retention policies that prevent deletion
- **Resource Tagging**: All resources must be tagged with CostCenter, Environment, and Compliance tags

### Special Constraints

- ALB health checks must use custom HTTP endpoints with specific response codes
- ECS tasks must use Fargate Spot with on-demand fallback for cost optimization
- Aurora cluster must have automated backups enabled
- All data at rest must be encrypted using customer-managed KMS keys
- CloudFront distribution must implement geo-blocking for sanctioned countries
- Auto-scaling policies must consider both CPU and custom CloudWatch metrics
- VPC must span multiple availability zones for high availability
- Security groups must follow least privilege principle
- All resources must have proper tagging for cost allocation and compliance

## Success Criteria

- **Functionality**: All AWS services deployed and properly configured with inter-service communication working
- **High Availability**: Infrastructure spans multiple AZs with automated failover capabilities
- **Security**: WAF rules active, encryption enabled everywhere, IAM roles following least privilege
- **Scalability**: Auto-scaling configured for ECS based on load metrics
- **Monitoring**: CloudWatch dashboard showing all key metrics, logs flowing properly
- **Compliance**: All audit logging enabled, proper tagging in place
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Cost Optimization**: Fargate Spot instances configured where appropriate
- **Code Quality**: HCL code, well-structured, with proper variable definitions

## What to deliver

- Complete Terraform HCL implementation
- VPC with public and private subnets across multiple AZs
- ECS Fargate cluster with service and task definitions
- Aurora PostgreSQL Serverless v2 cluster configuration
- Application Load Balancer with target groups and listeners
- CloudFront distribution with origin configuration
- WAF rules for SQL injection and XSS protection
- Route53 hosted zone and health checks
- KMS keys for encryption
- IAM roles and policies for all services
- CloudWatch dashboards, alarms, and log groups
- Security groups and network ACLs
- Variable definitions for environment customization
- Outputs for key resource identifiers
