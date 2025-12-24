Hey team,

We've got a customer-facing loan application system to build for a financial services company. The business is really concerned about high availability and security compliance since we're handling sensitive financial data. They need something that can handle variable traffic loads without breaking a sweat, and it has to stay up even if an entire availability zone goes down.

I've been asked to create the infrastructure for this using **CloudFormation with JSON**. The architecture they want is a classic three-tier setup: web tier for the load balancer and CDN, application tier for the compute instances, and database tier for data persistence. We need to make sure everything is properly isolated with security groups and that we're following the principle of least privilege throughout.

The tricky part here is coordinating all the moving pieces. We have CloudFront distributions pointing to both S3 static content and the ALB, a WAF that needs to protect against SQL injection attacks, database credentials that rotate automatically, and auto-scaling that responds intelligently to load changes. Everything needs to work together seamlessly.

## What we need to build

Create a production-ready three-tier web application infrastructure using **CloudFormation with JSON** for a financial services loan application platform.

### Core Requirements

1. **Network Foundation**
   - VPC spanning 3 availability zones in us-east-1
   - 3 public subnets for load balancers and NAT gateways
   - 3 private subnets for application servers
   - 3 isolated database subnets for RDS
   - Internet Gateway and NAT Gateways for outbound connectivity
   - Route tables properly configured for each subnet tier

2. **Load Balancing and CDN**
   - Application Load Balancer deployed across public subnets
   - Target groups configured for application tier instances
   - CloudFront distribution with S3 origin for static content
   - CloudFront custom origin pointing to ALB for dynamic content
   - SSL/TLS certificate from ACM for custom domain

3. **Compute Tier**
   - Auto Scaling Groups in private subnets with 2-6 instance range
   - Launch templates specifying Amazon Linux 2 AMI
   - Instance types: t3.medium for web tier, t3.large for application tier
   - Scaling policies: scale-out at 70% CPU, scale-in at 30% CPU
   - Health checks integrated with ALB target groups

4. **Database Tier**
   - RDS Aurora MySQL cluster in database subnets
   - Multi-AZ deployment with one writer and two read replicas
   - Automated backups retained for 7 days
   - Database credentials stored in Secrets Manager
   - Automatic credential rotation every 30 days using Lambda

5. **Security and Protection**
   - AWS WAF web ACL attached to Application Load Balancer
   - Rate-based rules to prevent DDoS attacks
   - SQL injection protection rules
   - Security groups for each tier with minimal required access
   - No direct internet access to application or database tiers

6. **Storage and Logging**
   - S3 bucket for static assets with versioning enabled
   - S3 bucket for application logs with appropriate retention
   - Lifecycle policy transitioning static content to Glacier after 90 days
   - Bucket policies restricting access appropriately

7. **Monitoring**
   - CloudWatch dashboard displaying key metrics
   - ALB request count and latency metrics
   - Auto Scaling group CPU and network metrics
   - RDS connection count and query performance metrics
   - CloudFront cache hit ratio and error rates

8. **Secrets Management**
   - Secrets Manager secret for database credentials
   - Lambda function for automatic rotation logic
   - IAM roles and policies for rotation function
   - Integration with RDS cluster for seamless updates

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **VPC** for network isolation
- Use **Application Load Balancer** for traffic distribution
- Use **Auto Scaling Groups** with **EC2** instances for compute
- Use **RDS Aurora MySQL** for database with Multi-AZ
- Use **CloudFront** for CDN with **S3** static content
- Use **AWS WAF** for application protection
- Use **Secrets Manager** with **Lambda** for credential rotation
- Use **CloudWatch** for monitoring and dashboards
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environmentSuffix
- Deploy to **us-east-1** region
- All resources must use Delete removal policy (no Retain policies)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: MUST be included as a CloudFormation parameter and used in ALL resource names to ensure uniqueness across multiple deployments
- **Destroyability**: ALL resources MUST use appropriate deletion policies. S3 buckets should be empty before stack deletion. Database snapshots optional but not required for dev/test
- **No Retain Policies**: Do not use DeletionPolicy Retain or UpdateReplacePolicy Retain on any resources
- **RDS Considerations**: Aurora clusters can take 15-20 minutes to create. Use db.t3.small or db.t4g.small for cost efficiency in non-production
- **NAT Gateway Warning**: NAT Gateways are expensive and slow to provision. Consider using single NAT Gateway for dev/test, three for production HA
- **Lambda Runtime**: If using Node.js 18 or higher for rotation function, SDK v3 is built-in, do not bundle aws-sdk

### Constraints

- All EC2 instances must use Amazon Linux 2 AMI (latest version)
- Instance types: t3.medium for web tier, t3.large for application tier
- RDS Multi-AZ deployment required with 7-day backup retention
- ALB must have WAF web ACL with SQL injection and rate-based rules
- Auto Scaling: minimum 2, maximum 6 instances
- Scale-out threshold: 70% CPU utilization
- Scale-in threshold: 30% CPU utilization
- All resources tagged with Environment, Application, and CostCenter
- Database credentials rotated every 30 days automatically
- CloudFront must use ACM certificate for custom SSL
- S3 static assets bucket with versioning and Glacier transition at 90 days
- Security groups must follow least-privilege access principles

## Success Criteria

- **Functionality**: Complete three-tier architecture with all components properly integrated
- **High Availability**: Multi-AZ deployment across all tiers, survives AZ failure
- **Security**: WAF protection active, security groups properly configured, credentials encrypted
- **Scalability**: Auto Scaling responds correctly to load changes within defined thresholds
- **Monitoring**: CloudWatch dashboard shows real-time metrics from all infrastructure tiers
- **Automation**: Database credential rotation works automatically without manual intervention
- **Resource Naming**: All resources include environmentSuffix parameter for deployment uniqueness
- **Code Quality**: Valid JSON CloudFormation template, proper dependencies, well-documented parameters

## What to deliver

- Complete CloudFormation JSON template with all infrastructure components
- Parameters for environment-specific customization (instance types, database size, environmentSuffix)
- Outputs for important endpoints (CloudFront distribution URL, ALB DNS name, RDS endpoint)
- Proper resource dependencies ensuring correct creation order
- Security group rules for inter-tier communication
- IAM roles and policies for Lambda rotation function
- CloudWatch dashboard configuration with key metrics
- S3 bucket policies and lifecycle rules
- Documentation in comments explaining complex configurations
- Unit tests validating template structure and resource properties
