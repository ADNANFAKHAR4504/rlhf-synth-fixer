Hey team,

We need to build a disaster recovery solution for our payment processing system. Last quarter we had a 4-hour outage in our primary region that cost us significant revenue, and the business has made it clear this can't happen again. I've been asked to create this infrastructure using **Terraform with HCL**.

The finance team processes thousands of payment transactions every hour, and they need confidence that if our primary region goes down, we can automatically fail over to a disaster recovery region with minimal data loss and downtime. They've specified an RTO of under 15 minutes and an RPO of under 5 minutes, which means we need robust replication and automated failover.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Terraform with HCL** for a payment processing system spanning US East regions.

### Core Requirements

1. **Multi-Region Provider Configuration**
   - Configure AWS provider for us-east-1 (primary region)
   - Configure AWS provider for us-east-2 (DR region) using provider aliases
   - Both regions must be managed from a single Terraform configuration

2. **Database Layer - Aurora Global Database**
   - Primary Aurora PostgreSQL cluster in us-east-1
   - Secondary Aurora PostgreSQL cluster in us-east-2
   - Use Aurora Global Database for automatic replication
   - Replication lag must support RPO under 5 minutes
   - Deploy across 3 availability zones in each region for high availability

3. **Storage Layer - S3 Cross-Region Replication**
   - S3 bucket in us-east-1 for transaction logs (primary)
   - S3 bucket in us-east-2 for transaction logs (DR replica)
   - Enable cross-region replication from primary to DR bucket
   - Enable versioning on both buckets
   - Configure encryption at rest for compliance

4. **Compute Layer - Lambda Functions**
   - Deploy identical Lambda functions in both regions for payment processing logic
   - Functions must be deployed in private subnets with NAT Gateway connectivity
   - Ensure functions have appropriate IAM roles with least privilege access
   - Configure environment variables and runtime settings consistently

5. **API Layer - API Gateway with Custom Domains**
   - Set up REST API in us-east-1 (primary)
   - Set up REST API in us-east-2 (DR)
   - Configure custom domain names for both API endpoints
   - Integrate APIs with respective Lambda functions in each region

6. **Health Monitoring - Route 53 Health Checks**
   - Create health check monitoring the primary region API endpoint
   - Health check must evaluate endpoint availability and response time
   - Configure SNS notifications for health check failures

7. **DNS Failover - Route 53 Failover Routing**
   - Configure Route 53 failover routing policy
   - Primary record pointing to us-east-1 API endpoint
   - Failover record pointing to us-east-2 API endpoint
   - Automatic traffic switching based on health check status
   - Target RTO of under 15 minutes

8. **Monitoring and Alerting - CloudWatch Alarms**
   - CloudWatch alarms in us-east-1 monitoring Aurora replication lag
   - CloudWatch alarms in us-east-2 monitoring Aurora replication lag
   - Alert when replication lag exceeds threshold (supporting RPO requirements)
   - Additional alarms for API Gateway error rates and Lambda failures

9. **Networking Infrastructure**
   - VPCs in both regions with private subnets across 3 AZs each
   - NAT Gateways for Lambda outbound connectivity
   - Security groups with appropriate ingress/egress rules
   - VPC endpoints where beneficial for cost optimization

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Terraform 1.5+** with **AWS provider 5.x**
- Use **Aurora PostgreSQL Global Database** for cross-region replication
- Use **S3 cross-region replication** for transaction log backup
- Use **Lambda** for payment processing functions
- Use **API Gateway REST API** for external endpoints
- Use **Route 53** for health checks and DNS failover
- Use **CloudWatch** for monitoring and alerting
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Primary region: **us-east-1**
- DR region: **us-east-2**

### Constraints

- RTO (Recovery Time Objective) must be under 15 minutes
- RPO (Recovery Point Objective) must be under 5 minutes
- All resources must be tagged with Environment and DR-Role tags
- All resources must be fully destroyable (no Retain policies)
- Database credentials must use AWS Secrets Manager (fetch existing secrets, don't create)
- Enable encryption at rest for all data stores
- Follow principle of least privilege for all IAM roles
- Use Terraform workspaces or modules to manage both regions efficiently
- Environment uses AWS Organizations with separate production account
- Include proper error handling and logging

### Cost Optimization

- Prefer Aurora Serverless v2 where appropriate for faster provisioning
- Minimize NAT Gateway costs (consider VPC endpoints)
- Use appropriate instance sizes for Lambda and database
- Implement lifecycle policies for S3 objects

## Success Criteria

- **Functionality**: Complete multi-region DR setup with automated failover
- **Performance**: RTO under 15 minutes, RPO under 5 minutes
- **Reliability**: Health checks detect failures and trigger automatic DNS failover
- **Security**: Encryption at rest and in transit, least privilege IAM, secrets management
- **Resource Naming**: All resources include environmentSuffix variable
- **Code Quality**: Clean HCL code, well-organized, properly documented
- **Monitoring**: CloudWatch alarms track replication lag and system health
- **Completeness**: All specified AWS services implemented and integrated

## What to deliver

- Complete Terraform HCL configuration files (main.tf, variables.tf, outputs.tf, etc.)
- Multi-region provider configuration with aliases
- Aurora Global Database setup (primary and secondary clusters)
- S3 buckets with cross-region replication
- Lambda functions deployed to both regions
- API Gateway REST APIs with custom domains in both regions
- Route 53 health checks and failover routing policy
- CloudWatch alarms for replication lag monitoring
- VPC networking infrastructure in both regions
- Comprehensive outputs showing all endpoints and resource identifiers
- Documentation explaining the DR architecture and failover process
