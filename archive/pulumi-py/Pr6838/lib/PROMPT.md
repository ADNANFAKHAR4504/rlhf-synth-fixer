# Multi-Region Disaster Recovery Infrastructure

Hey team,

We need to build a comprehensive multi-region disaster recovery infrastructure for our application. This is a critical initiative to ensure business continuity - if one AWS region goes down, our entire system should automatically failover to the backup region with minimal disruption. The business requires this to be highly automated, with cross-region replication for all critical data and automatic traffic routing.

I've been asked to create this using **Pulumi with Python**. The infrastructure needs to span two regions (us-east-1 as primary and us-east-2 as secondary), with active-active configurations where possible and automated failover mechanisms throughout.

The challenge here is orchestrating multiple AWS services across regions while maintaining data consistency, handling automatic failover, and ensuring that configuration data stays synchronized. We also need to make sure everything can be torn down cleanly for testing purposes.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Pulumi with Python** that provides automated failover and data replication across AWS regions.

### Core Requirements

1. **Cross-Region Networking**
   - Deploy VPCs in both us-east-1 and us-east-2 regions
   - Configure VPC peering between regions for secure communication
   - Set up public and private subnets in multiple availability zones
   - Network Load Balancers in both regions for traffic distribution

2. **Global Traffic Management**
   - AWS Global Accelerator with static anycast IP addresses
   - Endpoint groups pointing to Network Load Balancers in both regions
   - Automatic traffic routing based on health and proximity
   - Route 53 health checks with failover routing policies
   - Health checks must monitor actual service endpoints (API Gateway URLs or NLB DNS names)

3. **API Gateway Multi-Region Deployment**
   - Deploy API Gateway with custom domain names in each region
   - AWS Certificate Manager certificates for custom domains
   - Domain names should be configurable via Pulumi Config
   - Regional API endpoints with consistent configuration

4. **Configuration Data Replication**
   - AWS Systems Manager Parameter Store with cross-region replication
   - Store critical configuration data (database endpoints, API keys, feature flags)
   - Automatic synchronization of parameter updates across regions
   - Secure storage with encryption at rest

5. **Cross-Region Data Storage**
   - S3 buckets with cross-region replication enabled
   - Replication Time Control (RTC) for predictable replication timing
   - DynamoDB Global Tables for multi-region data replication with automatic conflict resolution
   - Aurora Global Database spanning both regions with automated failover
   - AWS Backup plans for automated cross-region backup of Aurora databases

6. **Compute Layer**
   - Lambda functions deployed in both regions with identical configurations
   - EventBridge Global Endpoints for event routing across regions
   - Automatic event failover if primary region becomes unavailable

7. **Monitoring and Alerting**
   - CloudWatch dashboards showing health metrics from both regions
   - SNS topics for alerting on failover events and health check failures
   - Metrics for replication lag, Lambda invocations, and API Gateway requests

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Primary region: **us-east-1**
- Secondary region: **us-east-2**
- Use **VPC, Global Accelerator, Route 53, API Gateway, ACM, Systems Manager Parameter Store, S3, DynamoDB, Aurora, Lambda, EventBridge, CloudWatch, SNS, AWS Backup**
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- All Aurora clusters: `skip_final_snapshot=True`, `deletion_protection=False`
- All resources must be fully destroyable (no retention policies)

### Deployment Requirements (CRITICAL)

**Resource Naming**: Every resource MUST include the environmentSuffix parameter in its name. This ensures multiple deployments can coexist without naming conflicts.

**Destroyability**: All resources must be configured for clean deletion:
- Aurora: `skip_final_snapshot=True`, `deletion_protection=False`
- S3: No retention policies that block deletion
- DynamoDB: No deletion protection
- No RETAIN removal policies anywhere

**Global Accelerator Completeness**: The Global Accelerator setup must be complete and functional:
- Create Global Accelerator
- Create listener on port 443
- Create endpoint groups in BOTH regions
- Add Network Load Balancers as endpoints
- Document why endpoint groups are critical (accelerator without endpoints does nothing)

**Health Check Configuration**: Route 53 health checks must monitor actual infrastructure:
- Use API Gateway invoke URLs as targets (not placeholder domains)
- Use NLB DNS names as targets
- Do not hardcode "example.com" or placeholder domains
- Health checks should reference outputs from created resources

**Custom Domain Names**: API Gateway deployments must include:
- ACM certificates (can be placeholder ARNs via Config)
- Custom domain name configuration for each regional API Gateway
- Make domain names configurable through Pulumi Config
- Document that actual DNS configuration happens externally

**Parameter Store Replication**: Systems Manager Parameter Store must include:
- Parameters created in primary region
- Replication configuration to secondary region
- Example configuration data (database endpoints, feature flags)
- This was a requirement that was completely missed previously

### Service-Specific Requirements

**Lambda Functions**:
- If using Node.js 18+, note that AWS SDK v3 must be explicitly included
- For Python runtimes, boto3 is pre-installed
- Bundle dependencies appropriately for each runtime

**Aurora Global Database**:
- Primary cluster in us-east-1
- Secondary cluster in us-east-2
- Use Aurora Serverless v2 for cost optimization
- Ensure proper IAM configuration for replication

**EventBridge Global Endpoints**:
- Configure primary and secondary event buses
- Set up automatic failover routing
- Include health checks for endpoint availability

### Constraints

- All infrastructure must be deployed across exactly two regions
- Data replication must be bidirectional where supported (DynamoDB) or primary-to-secondary (Aurora, S3)
- Failover mechanisms must be automated (no manual intervention required)
- All resources must be fully destroyable for testing and teardown
- Configuration changes must propagate to both regions automatically
- Include proper error handling and logging throughout

## Success Criteria

- **Functionality**: Complete infrastructure spanning two regions with all services configured
- **Failover**: Automatic traffic routing via Global Accelerator and Route 53 health checks
- **Data Replication**: S3 RTC, DynamoDB Global Tables, Aurora Global Database all operational
- **Configuration Sync**: Parameter Store replication working across regions
- **Monitoring**: CloudWatch dashboards showing metrics from both regions
- **Resource Naming**: All resources include environmentSuffix in names
- **Destroyability**: All resources can be deleted without manual intervention
- **Completeness**: Global Accelerator has endpoint groups, health checks monitor real resources, Parameter Store replication configured
- **Code Quality**: Clean Python code, well-structured, properly documented

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- TapStack class with TapStackArgs for environment configuration
- All AWS services: VPC, Global Accelerator, Route 53, API Gateway, ACM, Parameter Store, S3, DynamoDB, Aurora, Lambda, EventBridge, CloudWatch, SNS, Backup
- Lambda function code in lib/lambda/ directory
- MODEL_RESPONSE.md with all code blocks properly formatted
- Documentation explaining the multi-region architecture and failover mechanisms
