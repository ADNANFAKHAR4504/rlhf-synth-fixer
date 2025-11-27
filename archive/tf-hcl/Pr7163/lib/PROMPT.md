# Cross-Region RDS Disaster Recovery with Automated Failover

Hey team,

We need to build a production-ready disaster recovery solution for our PostgreSQL databases. The business wants automatic failover between regions if the primary database goes down or replication lag gets too high. I've been asked to create this using **Terraform with HCL**.

Our operations team has been dealing with manual failover procedures that take hours when problems happen. They need something automated that can detect issues and promote the standby database within minutes. The database team also wants comprehensive monitoring so they can see replication health in real-time.

## What we need to build

Create a cross-region RDS disaster recovery system using **Terraform with HCL** that automatically monitors and fails over PostgreSQL databases between us-east-1 and us-west-2.

### Core Requirements

1. **Database Infrastructure**
   - Deploy PostgreSQL RDS instances in us-east-1 (primary) and us-west-2 (standby)
   - Configure cross-region read replicas for disaster recovery
   - Use encrypted storage with customer-managed KMS keys for both regions
   - Enable automated backups with 7-day retention and point-in-time recovery

2. **Network Configuration**
   - Set up VPC peering between us-east-1 and us-west-2 with encryption in transit
   - Configure route tables to allow traffic between peered VPCs
   - Ensure proper CIDR block allocation to avoid conflicts
   - Add security groups to control database access

3. **Automated Failover Monitoring**
   - Create Lambda function to monitor replication lag via CloudWatch metrics
   - Trigger automatic promotion of read replica if lag exceeds 60 seconds
   - Use boto3 to query CloudWatch and promote replicas via RDS API
   - Include proper error handling and logging for failover operations

4. **Alerting and Monitoring**
   - Set up CloudWatch alarms for database CPU utilization
   - Monitor database connections and alert on threshold breaches
   - Track replication lag and alert before it becomes critical
   - Create alarms that integrate with the failover Lambda

5. **Security and Secrets Management**
   - Store all database passwords in AWS Secrets Manager
   - Enable automatic rotation for database credentials
   - Implement IAM roles with least privilege for Lambda execution
   - Ensure Lambda only has permissions needed for monitoring and promotion

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **RDS PostgreSQL** for database instances in both regions
- Use **Lambda** with boto3 for replication monitoring and failover logic
- Use **CloudWatch** for metrics collection and alarms
- Use **Secrets Manager** for credential storage and rotation
- Use **KMS** for encryption keys in both regions
- Use **VPC** peering for cross-region connectivity
- Use **IAM** roles with least privilege access
- Use **S3** with **DynamoDB** for Terraform state management and locking
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: {resource-type}-{environment-suffix}
- Use data sources to dynamically fetch latest PostgreSQL engine versions
- Deploy primary resources to **us-east-1** region
- Deploy DR resources to **us-west-2** region

### Deployment Requirements (CRITICAL)

- **Environment-Based Sizing**: Support test and prod environments
  - Test environment: db.t3.micro, single-AZ, minimal monitoring
  - Production environment: db.r6g.large, multi-AZ, full monitoring
  - Use environment variable to control sizing
- **Fast Deployment**: Test environment must deploy in under 15 minutes
- **Cost Optimization**: Test environment cost must be under $50/month
- **Destroyability**: Set skip_final_snapshot=true and deletion_protection=false
- **No Retain Policies**: All resources must be destroyable (no RemovalPolicy: RETAIN)
- **No External Dependencies**: Do not require pre-existing hosted zones or resources
- **Self-Sufficient**: All required resources created by this Terraform code

### Constraints

- RDS parameter groups must enable slow query logging and performance insights
- Network traffic between regions must use VPC peering (no NAT gateways)
- All resources must be tagged with Environment=DR and CostCenter=Infrastructure
- Lambda function must check replica lag using CloudWatch GetMetricStatistics API
- Do not create Route53 health checks (they don't work with RDS DNS endpoints)
- VPC peering routes must be configured in both region's route tables
- Use serverless components where possible to minimize costs

### Important Architecture Notes

**Route53 Health Checks Are Not Supported**

Route53 TCP health checks cannot monitor RDS endpoints because:
- RDS endpoints are DNS names that resolve to different IPs after failover
- TCP checks require static IP addresses, not DNS names
- Health checks would fail immediately after replica promotion

Alternative approaches for DNS failover (document in README):
- Application-level health checks with Route53 updates via Lambda
- AWS Global Accelerator with health checking
- RDS Proxy with built-in health monitoring
- Manual DNS updates triggered by CloudWatch alarms

**VPC Peering Configuration**

VPC peering requires bidirectional routes:
- Primary VPC route table needs route to DR VPC CIDR via peering connection
- DR VPC route table needs route to primary VPC CIDR via peering connection
- Both peering connection accepter and requester must configure routes

## Success Criteria

- **Functionality**: Replication lag monitoring triggers promotion within 60 seconds
- **Performance**: Database queries complete with acceptable latency in both regions
- **Reliability**: System survives primary region failure with automated recovery
- **Security**: All credentials stored in Secrets Manager with rotation enabled
- **Resource Naming**: All resources include environmentSuffix for unique identification
- **Cost Efficiency**: Test environment costs under $50/month
- **Deployment Speed**: Test environment deploys in under 15 minutes
- **Code Quality**: Valid HCL, passes terraform fmt and terraform validate
- **Monitoring**: CloudWatch dashboards show replication health and database metrics
- **Documentation**: Clear README with deployment instructions and architecture decisions

## What to deliver

- Complete **Terraform with HCL** implementation
- Main configuration files (main.tf, variables.tf, outputs.tf, providers.tf)
- VPC and networking configuration for both regions
- RDS primary and read replica configurations
- Lambda function code for replication monitoring and failover
- CloudWatch alarms for monitoring
- IAM roles and policies
- KMS keys for encryption
- Secrets Manager configuration
- S3 backend configuration for state management
- Environment-based variable configuration (test vs prod)
- Unit tests for Lambda function
- Integration tests
- README with architecture decisions and deployment guide
