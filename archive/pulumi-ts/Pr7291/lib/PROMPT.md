Hey team,

We need to build a multi-region trading platform infrastructure for a financial services company. They need low latency and automatic failover capabilities to keep their trading operations running smoothly even during regional outages. The business has asked us to create this using **Pulumi with TypeScript** to manage the infrastructure across two AWS regions.

The trading platform will handle real-time financial transactions, so reliability and performance are critical. We need to deploy in both us-east-1 as the primary region and eu-west-1 as the secondary region. The infrastructure should automatically fail over if the primary region becomes unavailable, with a recovery time objective of less than 60 seconds.

## What we need to build

Create a multi-region financial trading platform infrastructure using **Pulumi with TypeScript** for high availability and disaster recovery.

### Core Requirements

1. **Multi-Region VPC Architecture**
   - VPCs in both us-east-1 (primary) and eu-west-1 (secondary)
   - Each VPC with 3 private subnets across different Availability Zones
   - VPC peering connection between regions with appropriate route tables
   - Ensure proper CIDR planning to avoid overlaps

2. **Aurora Global Database**
   - Deploy Aurora Global Database with PostgreSQL 14.6 compatibility
   - Primary cluster in us-east-1
   - Read replica cluster in eu-west-1 with automatic promotion enabled
   - Configure proper security groups and subnet groups in both regions

3. **Application Tier**
   - Lambda functions deployed in both regions running the trading application
   - Application Load Balancers in each region with target groups pointing to EC2 instances
   - Ensure proper integration between ALB and compute resources
   - Configure health checks and auto-scaling policies

4. **Global Traffic Management**
   - AWS Global Accelerator with endpoints in both regions
   - Route 53 hosted zone with health check-based routing policies
   - Health checks with 10-second intervals for fast failover detection
   - Intelligent traffic routing for optimal latency

5. **Security and Secrets Management**
   - Secrets Manager entries in both regions
   - Configure automatic rotation schedules every 30 days
   - Ensure secrets are properly encrypted and access controlled

6. **Monitoring and Compliance**
   - CloudWatch dashboards aggregating metrics from both regions
   - Cross-region monitoring for comprehensive visibility
   - AWS Config with rules for security compliance monitoring
   - Proper alerting for critical metrics

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Deploy to **us-east-1** (primary) and **eu-west-1** (secondary) regions
- Use **VPC** for network isolation in both regions
- Use **Aurora Global Database** with PostgreSQL 14.6 for data tier
- Use **Lambda** for serverless compute workloads
- Use **Application Load Balancer** for traffic distribution
- Use **AWS Global Accelerator** for global traffic optimization
- Use **Route 53** for DNS and health-based routing
- Use **Secrets Manager** for credential management with rotation
- Use **CloudWatch** for monitoring and observability
- Use **AWS Config** for compliance tracking
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- All resources must be destroyable (no Retain policies or deletion protection)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: All named resources (S3 buckets, Lambda functions, RDS instances, ALBs, etc.) MUST include the environmentSuffix parameter in their names. This ensures uniqueness across parallel deployments and prevents resource conflicts. Example: `trading-lambda-${environmentSuffix}` or `database-${environmentSuffix}`.

- **Destroyability Requirement**: NO resources should have RemovalPolicy.RETAIN, DeletionPolicy: Retain, or deletion_protection: true. All resources must be cleanly destroyable after testing for cost management and CI/CD automation.

- **Aurora Global Database Timing**: Be aware that Aurora Global Database secondary clusters require the primary cluster to reach "available" state (20-30 minutes) before attachment. Consider adding explicit dependencies and state checks.

- **AWS Config IAM Policy**: If using AWS Config, ensure the correct managed policy name is used: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole` (note the `service-role/AWS_` prefix). Incorrect policy names like `ConfigRole` or `AWS_ConfigRole` without the service-role prefix will fail.

- **Lambda Node.js 18+ SDK**: If using Lambda with Node.js 18.x or higher runtimes, AWS SDK v2 is not available by default. Either use AWS SDK v3 (`@aws-sdk/client-*`) or extract necessary data from event objects instead of making additional SDK calls.

- **ALB Public Subnets**: Application Load Balancers require public subnets (not private subnets) for internet-facing configurations. Ensure ALBs are deployed to subnets with internet gateway routes.

### Constraints

- RTO (Recovery Time Objective) must be less than 60 seconds for regional failover
- Route 53 health checks must have 10-second intervals
- Secrets Manager must rotate credentials every 30 days
- All resources must support automatic failover capabilities
- Deploy exactly in us-east-1 and eu-west-1 regions
- No hardcoded values - use configuration management
- Include proper error handling and logging throughout

### Tagging Strategy

- Apply consistent tagging across all resources:
  - Environment: Use environmentSuffix value
  - Region: AWS region identifier (us-east-1, eu-west-1)
  - CostCenter: For financial tracking and cost allocation

## Success Criteria

- **Functionality**: Complete multi-region infrastructure with automatic failover
- **Performance**: RTO less than 60 seconds for regional failover
- **Reliability**: Aurora Global Database with cross-region replication
- **Security**: Secrets Manager with 30-day rotation, proper IAM policies, security groups
- **Monitoring**: CloudWatch dashboards with cross-region metrics
- **Compliance**: AWS Config rules tracking security compliance
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be cleanly destroyed (no Retain policies)
- **Code Quality**: TypeScript, well-tested, properly documented

## What to deliver

- Complete Pulumi TypeScript implementation
- VPC infrastructure in both us-east-1 and eu-west-1
- Aurora Global Database with PostgreSQL 14.6
- Lambda functions and Application Load Balancers in both regions
- AWS Global Accelerator and Route 53 configuration
- Secrets Manager with rotation schedules
- CloudWatch dashboards and AWS Config rules
- Unit tests for all components
- Documentation including deployment instructions and architecture overview
