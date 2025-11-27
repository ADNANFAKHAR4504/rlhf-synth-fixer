Hey team,

We're building a multi-region disaster recovery infrastructure for a healthcare SaaS platform that processes patient data. The business has strict RPO and RTO requirements of 15 minutes, which means we need a warm standby setup that can automatically fail over if the primary region goes down. This isn't just about redundancy - it's about ensuring continuous availability for critical healthcare operations.

The architecture needs to span two regions with a primary in us-east-1 handling active traffic and a DR region in us-west-2 maintaining a warm standby. Everything needs to replicate between regions - the database, application state, static assets, and even events. When a failure happens, Route53 should automatically redirect traffic to the healthy region without manual intervention.

I've been asked to create this using **Pulumi with TypeScript**. The business wants a robust failover system that demonstrates their commitment to reliability and meets healthcare industry standards for uptime and data availability. They're particularly concerned about maintaining data consistency during replication and ensuring the failover process is seamless.

## What we need to build

Create a multi-region disaster recovery infrastructure using **Pulumi with TypeScript** for a healthcare SaaS platform spanning us-east-1 (primary) and us-west-2 (DR) regions with automatic failover capabilities.

### Core Requirements

1. **Aurora Global Database**
   - Primary Aurora PostgreSQL cluster in us-east-1
   - Secondary Aurora PostgreSQL cluster in us-west-2
   - Global database cluster linking both regions
   - Automated replication from primary to secondary
   - Enable automated backups and point-in-time recovery
   - Database must be destroyable with proper deletion settings
   - Use PostgreSQL version 14.6 or later (verified compatible with Global Database)

2. **Multi-Region Compute**
   - Deploy Lambda functions in both us-east-1 and us-west-2
   - Application Load Balancers in each region
   - Target groups connecting ALBs to Lambda functions
   - Identical function configuration across both regions
   - **Lambda functions MUST implement /health endpoint** for Route53 health checks
   - Lambda should return proper ALB-compatible response format
   - Proper VPC integration for Lambda functions

3. **DNS and Health Checks**
   - Route53 hosted zone for primary domain
   - Health checks monitoring ALB endpoints in both regions
   - **Use HTTP (port 80) for health checks, not HTTPS** (no ACM certificate required)
   - Health checks must target /health path
   - Failover routing policy with primary and secondary records
   - Automatic traffic redirection on health check failure
   - 30-second health check intervals with 3 failure threshold

4. **Cross-Region Storage Replication**
   - S3 bucket in us-east-1 for static assets
   - S3 bucket in us-west-2 as replication target
   - Enable versioning on both buckets
   - Configure cross-region replication rules
   - **Add bucket policy to destination bucket allowing replication role to write**
   - Lifecycle policies for cost optimization

5. **Event Distribution**
   - EventBridge event buses in both regions
   - Rules for cross-region event forwarding
   - Event patterns matching application events
   - **Add resource-based policy to DR event bus to accept cross-region events**
   - Ensure events propagate to both regions

6. **Cross-Region Monitoring**
   - CloudWatch dashboard showing metrics from both regions
   - Monitor ALB request counts, Lambda invocations, Aurora connections
   - Display health check status
   - Include custom metrics for failover readiness
   - **Add CloudWatch alarms** for critical metrics:
     - Route53 health check failures
     - RDS CPU and connection count
     - Lambda errors and throttles
     - ALB target health

7. **Network Infrastructure**
   - VPC in us-east-1 with private subnets across 3 availability zones
   - VPC in us-west-2 with private subnets across 3 availability zones
   - VPC peering connection between regions
   - **Route tables properly configured with peering routes in both directions**
   - **Pass VPC peering connection ID to regional infrastructure components**
   - Security groups allowing necessary traffic
   - Consider cost optimization: evaluate if Lambda needs VPC or if VPC endpoints can reduce NAT Gateway costs

8. **Infrastructure Outputs**
   - Primary endpoint URL (Route53 FQDN)
   - Failover endpoint URL (us-west-2 ALB)
   - Global database cluster identifier
   - S3 bucket names for both regions
   - VPC peering connection ID
   - CloudWatch dashboard URL

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon RDS Aurora PostgreSQL** for Global Database
- Use **AWS Lambda** with Node.js runtime for application functions
- Use **Amazon EC2** for Application Load Balancers and target groups
- Use **Amazon Route53** for DNS and health checks
- Use **Amazon S3** with cross-region replication
- Use **Amazon EventBridge** for event distribution
- Use **Amazon CloudWatch** for monitoring and dashboards
- Use **Amazon VPC** for network isolation and peering
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-region-environment-suffix (consistent)
- Deploy infrastructure in **us-east-1** (primary) and **us-west-2** (DR)
- Pulumi 3.x, TypeScript 4.x, Node.js 16+ compatibility
- All resources must be tagged with Environment, Region, and DR-Role tags

### Deployment Requirements (CRITICAL)

- All resource names must include **environmentSuffix** for uniqueness to avoid collisions in CI/CD
- All resources must be destroyable - no RemovalPolicy.RETAIN or deletion protection
- Aurora clusters must have skipFinalSnapshot: true and deletionProtection: false
- S3 buckets must have forceDestroy: true for automated cleanup
- Lambda functions must not use reserved concurrency (causes deployment failures)
- Use Pulumi ComponentResource pattern for modular, reusable components
- All resources properly tagged: Environment, Region, DR-Role (primary/secondary)
- **Create Pulumi.dev.yaml with required configuration**:
  ```yaml
  config:
    TapStack:environmentSuffix: synthj5p6r0e5
    aws:region: us-east-1
  ```

### Constraints

- Primary region must be us-east-1, DR region must be us-west-2
- Aurora Global Database: Use PostgreSQL 14.6 or later (verified compatible)
- VPC CIDR blocks must not overlap (10.0.0.0/16 for us-east-1, 10.1.0.0/16 for us-west-2)
- VPC peering requires proper route table entries in both regions
- Route53 health checks use HTTP (port 80) targeting /health endpoint
- Lambda functions must have Node.js 16+ runtime (Node.js 18+ requires AWS SDK v3, not v2)
- Lambda must implement /health endpoint returning 200 OK
- S3 replication requires versioning enabled on both source and destination buckets
- S3 destination bucket needs policy allowing replication role to write
- EventBridge cross-region rules require event bus permissions in both regions
- All resources must be destroyable (no Retain policies)
- Include proper error handling and CloudWatch logging for Lambda functions
- Health check failover time is approximately 90-120 seconds (30s interval × 3 failures)

### Optional Enhancements

If time permits after core implementation:
- AWS Backup for centralized cross-region backup management
- Lambda functions for automated failover testing and validation
- Systems Manager Parameter Store replication for configuration synchronization
- SNS notifications for failover events

## Additional Requirements (Iteration 1)

Based on the initial implementation review, we identified several critical gaps that need to be addressed to ensure successful deployment and testing:

### 1. Lambda Health Endpoint Implementation

The Lambda functions must implement a proper /health endpoint that:
- Returns HTTP 200 status code
- Returns JSON response compatible with ALB target groups
- Includes region identification for debugging
- Handles both ALB health checks and Route53 health checks
- Does not require database connectivity (health endpoint should be lightweight)

Example response format:
```json
{
  "status": "healthy",
  "region": "us-east-1",
  "timestamp": "2025-11-25T13:00:00Z"
}
```

### 2. ALB HTTP Listener (No HTTPS/ACM Certificate)

For testing and development:
- Use HTTP listener on port 80 (not HTTPS on port 443)
- No ACM certificate required
- Route53 health checks target HTTP endpoint
- Security group allows inbound port 80 from 0.0.0.0/0

This simplifies deployment and avoids the need for ACM certificate creation or DNS validation.

### 3. VPC Peering Routing Configuration

The VPC peering connection must be properly wired:
- Create peering connection at top level in tap-stack.ts
- Accept peering connection in both regions
- Pass peering connection ID to RegionalInfrastructure components
- Add routes in both private AND public route tables
- Primary to DR: route 10.1.0.0/16 → peering connection
- DR to Primary: route 10.0.0.0/16 → peering connection
- Include explicit dependencies to ensure peering is accepted before adding routes

### 4. S3 Replication Destination Bucket Policy

The destination bucket in us-west-2 must have a bucket policy allowing the replication role to write:
- Grant s3:ReplicateObject permission
- Grant s3:ReplicateDelete permission
- Grant s3:ReplicateTags permission
- Grant s3:GetObjectVersionForReplication permission
- Principal should be the replication IAM role ARN

### 5. CloudWatch Alarms for Operational Monitoring

Add CloudWatch alarms to enable proactive monitoring:
- Route53 health check status alarm (alert when health check fails)
- RDS CPU utilization alarm (alert at >80%)
- RDS DatabaseConnections alarm (alert approaching max connections)
- Lambda error rate alarm (alert at >5% error rate)
- Lambda throttle alarm (alert on any throttles)
- ALB target health alarm (alert when no healthy targets)
- Create SNS topic for alarm notifications (optional email subscription)

### 6. Cost Optimization Considerations

Document and optionally optimize costs:
- Current: db.r5.large instances (~$525/month for RDS)
- Consider: db.t4g.medium for development (~$70/month)
- Current: 3 NAT Gateways per region (~$192/month)
- Consider: Use VPC endpoints for AWS services to reduce NAT Gateway dependency
- Make instance class and NAT Gateway count configurable
- Document estimated monthly costs in README

### 7. Pulumi Stack Configuration File

Create Pulumi.dev.yaml at project root with required configuration:
```yaml
config:
  TapStack:environmentSuffix: synthj5p6r0e5
  aws:region: us-east-1
```

This ensures the code can access the required `environmentSuffix` configuration parameter without deployment failure.

### 8. Consistent Resource Naming

All resources must follow consistent naming pattern:
- Pattern: `{service}-{purpose}-{region}-{environmentSuffix}`
- Example: `aurora-cluster-us-east-1-synthj5p6r0e5`
- Include region in ALL resource names for clarity
- Makes debugging and resource identification easier

## Success Criteria

- Functionality: Multi-region infrastructure deploys successfully in both regions
- Database Replication: Aurora Global Database replicating data from primary to secondary
- Automatic Failover: Route53 health checks trigger failover on primary region failure
- **Health Endpoints**: Lambda /health endpoint responds with 200 OK
- Storage Replication: S3 objects replicate to DR region with proper permissions
- Event Distribution: EventBridge forwards events across regions with proper policies
- Monitoring: CloudWatch dashboard shows unified view with alarms for critical metrics
- Network Connectivity: VPC peering enables cross-region communication with proper routing
- Resource Naming: All resources include environmentSuffix and region consistently
- Destroyability: All resources can be cleanly destroyed without manual intervention
- **Testing**: 100% unit test coverage and integration tests using deployed resources
- Code Quality: Clean TypeScript, modular ComponentResources, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation with all fixes applied
- Aurora Global Database with PostgreSQL 14.6+ and proper configuration
- Lambda functions with /health endpoint implementation
- ALB HTTP listeners (port 80) for development/testing
- Route53 hosted zone with HTTP health checks (not HTTPS)
- S3 buckets with cross-region replication and destination bucket policy
- EventBridge rules with proper cross-region permissions
- CloudWatch dashboard with alarms for critical metrics
- VPCs with peering connection and proper route table configuration
- Security groups and IAM roles following least privilege
- Pulumi.dev.yaml with required configuration
- Stack outputs for all critical resource identifiers
- Comprehensive unit tests (100% coverage)
- Integration tests using cfn-outputs/flat-outputs.json
- Documentation with cost estimates and deployment instructions
