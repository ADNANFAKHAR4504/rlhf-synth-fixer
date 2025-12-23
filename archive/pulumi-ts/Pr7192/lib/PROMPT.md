# Multi-Region Database Migration Infrastructure

Hey team,

We need to build a robust multi-region database migration and disaster recovery system for a critical application that's currently running on-premises with Oracle databases. The business has decided to migrate to AWS Aurora PostgreSQL with a global presence across three regions for high availability and disaster recovery. I've been asked to create this infrastructure using **Pulumi with TypeScript**.

The migration needs to happen with minimal downtime, and we need to ensure the application can failover seamlessly between regions if there's an outage. The business is particularly concerned about data consistency during the migration and wants comprehensive monitoring throughout the process.

This is a complex expert-level task involving multi-region coordination, database replication, application deployment with blue-green capabilities, and migration orchestration. We need to be thoughtful about cost optimization while maintaining production-grade reliability.

## What we need to build

Create a multi-region disaster recovery and database migration infrastructure using **Pulumi with TypeScript** to migrate from on-premises Oracle to AWS Aurora PostgreSQL Global Database across three regions (us-east-1 primary, eu-west-1 and ap-southeast-1 replicas).

### Core Requirements

1. **Multi-Region Aurora PostgreSQL Global Database**
   - Primary cluster in us-east-1 with Aurora Serverless v2 for cost optimization
   - Read replica clusters in eu-west-1 and ap-southeast-1
   - Automatic cross-region replication with low latency
   - Encryption at rest using AWS KMS
   - Automated backups with 7-day retention
   - All database resources must include environmentSuffix for uniqueness

2. **ECS Fargate Application Deployment**
   - ECS clusters in all three regions
   - Fargate services with blue-green deployment configuration
   - Application Load Balancers with weighted target groups for traffic shifting
   - Auto-scaling based on CPU and memory utilization
   - Container definitions with minimal resource allocation (256 CPU, 512 memory) for cost optimization
   - Security groups with least privilege access
   - All ECS resources must include environmentSuffix

3. **Database Migration with DMS (Optional)**
   - AWS DMS replication instance (optional, controlled by createDms config flag)
   - Source endpoint for on-premises Oracle database
   - Target endpoint for Aurora PostgreSQL
   - Replication task for continuous data replication
   - Document that DMS requires actual Oracle database connection for production use
   - Use placeholder Oracle endpoint in configuration with default value

4. **Site-to-Site VPN (Optional)**
   - VPN connection between on-premises and AWS (optional, controlled by createVpn config flag)
   - Customer gateway configuration
   - Virtual private gateway attached to VPC
   - VPN connection with routing configuration
   - Document that VPN requires actual customer gateway IP for production use
   - Use placeholder customer gateway IP in configuration with default value

5. **Migration State Tracking**
   - DynamoDB table for tracking migration progress and state
   - Store metadata about migrated records, timestamps, and status
   - Point-in-time recovery enabled
   - On-demand billing mode for cost efficiency
   - All DynamoDB resources must include environmentSuffix

6. **Configuration Management**
   - Systems Manager Parameter Store with hierarchical paths
   - Store database connection strings under /migration/db/*
   - Store application configuration under /migration/app/*
   - Secure string parameters for sensitive data
   - All parameters must include environmentSuffix

7. **Monitoring and Alerting**
   - CloudWatch dashboard for migration metrics
   - Track database replication lag, DMS task status, application health
   - CloudWatch alarms for critical thresholds
   - SNS topics for notifications to operations team
   - Log groups for application and infrastructure logs
   - All monitoring resources must include environmentSuffix

8. **Data Validation**
   - Lambda function for data validation between source and target
   - Compare row counts, checksums, and data integrity
   - Triggered on schedule or manually
   - Results published to SNS topic
   - CloudWatch logs for validation results
   - All Lambda resources must include environmentSuffix

9. **Networking**
   - VPC in each region with public and private subnets
   - Single NAT Gateway per region for cost optimization (not per AZ)
   - VPC endpoints for S3 and DynamoDB to avoid NAT charges
   - Security groups with proper ingress and egress rules
   - All network resources must include environmentSuffix

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Aurora Serverless v2** for faster provisioning and auto-scaling
- Use **single NAT Gateway per region** (not per AZ) for cost optimization
- Configure ECS with **minimal task definitions** (256 CPU, 512 memory)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy primary infrastructure to **us-east-1** region
- All resources must be destroyable (no Retain deletion policies)
- Use Pulumi configuration (Pulumi.yaml and Pulumi.dev.yaml) for all external dependencies
- DMS and VPN should be optional via configuration flags (createDms and createVpn)
- Include proper error handling and logging
- Target monthly cost under $500

### Deployment Requirements (CRITICAL)

1. **Resource Naming**
   - ALL named resources MUST include environmentSuffix parameter
   - Format: `resourceName-${environmentSuffix}` or `${resourceName}-${config.require('environmentSuffix')}`
   - This applies to: S3 buckets, DynamoDB tables, Lambda functions, ECS clusters, RDS clusters, ALBs, SNS topics, CloudWatch log groups, Parameter Store paths

2. **Destroyability**
   - NO RemovalPolicy.RETAIN allowed on any resource
   - NO DeletionProtection enabled on databases
   - All resources must be fully destroyable for test environments
   - Set skipFinalSnapshot: true on Aurora clusters

3. **Configuration Management**
   - Use Pulumi.yaml for project configuration
   - Use Pulumi.dev.yaml for stack-specific values
   - ALL external dependencies must use config.get() with sensible defaults
   - DO NOT use config.require() for optional items (DMS endpoints, VPN IPs)
   - createDms: default false (optional feature)
   - createVpn: default false (optional feature)
   - environmentSuffix: required parameter
   - oracleEndpoint: default "onprem-oracle.example.com" (placeholder)
   - customerGatewayIp: default "203.0.113.1" (placeholder from RFC 5737)

4. **Service-Specific Requirements**
   - Aurora: Use Serverless v2 for faster provisioning and cost savings
   - NAT Gateways: Create only ONE per region, not per availability zone
   - ECS: Use minimal task sizes (256 CPU, 512 MB memory)
   - Lambda: Use Node.js 18.x runtime with AWS SDK v3 (@aws-sdk/client-*)
   - DMS: Make optional via createDms flag, document Oracle connection requirement
   - VPN: Make optional via createVpn flag, document customer gateway IP requirement

### Constraints

- Must support phased migration with validation at each step
- Zero downtime requirement for cutover
- Data consistency must be verifiable at all times
- Automated rollback capability if migration fails
- Compliance with data residency requirements per region
- All resources must follow AWS Well-Architected Framework best practices
- Cost-optimized architecture targeting under $500/month
- Must be deployable to real AWS account without external dependencies (when optional features disabled)

## Success Criteria

- **Functionality**: Multi-region Aurora Global Database with automatic replication, ECS Fargate deployment with blue-green capabilities, migration state tracking, comprehensive monitoring
- **Performance**: Database replication lag under 1 second, application response time under 200ms, migration throughput sufficient for business requirements
- **Reliability**: 99.99% availability target, automatic failover between regions, zero data loss RPO
- **Security**: Encryption at rest and in transit, least privilege IAM roles, network isolation, secure parameter storage
- **Resource Naming**: All resources include environmentSuffix for parallel deployment isolation
- **Destroyability**: All resources can be fully deleted without manual intervention
- **Code Quality**: TypeScript code with proper typing, well-structured, comprehensive error handling, 100% test coverage
- **Cost Optimization**: Monthly cost under $500, serverless-first approach, minimal NAT Gateway usage
- **Deployment Readiness**: Can deploy with example configuration, optional features configurable, no hardcoded external dependencies

## What to deliver

- Complete **Pulumi TypeScript** implementation in lib/ directory
- Aurora PostgreSQL Global Database (Serverless v2) in three regions
- ECS Fargate services with Application Load Balancers
- DynamoDB table for migration state tracking
- Systems Manager Parameter Store configuration hierarchy
- CloudWatch dashboards and alarms
- Lambda function for data validation with SNS notifications
- Optional DMS replication configuration (controlled by createDms flag)
- Optional Site-to-Site VPN configuration (controlled by createVpn flag)
- VPC networking with cost-optimized NAT Gateway setup
- Pulumi.yaml project configuration
- Pulumi.dev.yaml with example configuration values
- Unit tests for all infrastructure components with 100% coverage
- Documentation in lib/README.md with deployment instructions and configuration guide