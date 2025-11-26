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

2. **Multi-Region Compute**
   - Deploy Lambda functions in both us-east-1 and us-west-2
   - Application Load Balancers in each region
   - Target groups connecting ALBs to Lambda functions
   - Identical function configuration across both regions
   - Proper VPC integration for Lambda functions

3. **DNS and Health Checks**
   - Route53 hosted zone for primary domain
   - Health checks monitoring ALB endpoints in both regions
   - Failover routing policy with primary and secondary records
   - Automatic traffic redirection on health check failure
   - 30-second health check intervals with 3 failure threshold

4. **Cross-Region Storage Replication**
   - S3 bucket in us-east-1 for static assets
   - S3 bucket in us-west-2 as replication target
   - Enable versioning on both buckets
   - Configure cross-region replication rules
   - Lifecycle policies for cost optimization

5. **Event Distribution**
   - EventBridge event buses in both regions
   - Rules for cross-region event forwarding
   - Event patterns matching application events
   - Ensure events propagate to both regions

6. **Cross-Region Monitoring**
   - CloudWatch dashboard showing metrics from both regions
   - Monitor ALB request counts, Lambda invocations, Aurora connections
   - Display health check status
   - Include custom metrics for failover readiness

7. **Network Infrastructure**
   - VPC in us-east-1 with private subnets across 3 availability zones
   - VPC in us-west-2 with private subnets across 3 availability zones
   - VPC peering connection between regions
   - Route tables configured for cross-region communication
   - Security groups allowing necessary traffic

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
- Follow naming convention: resource-type-environment-suffix
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

### Constraints

- Primary region must be us-east-1, DR region must be us-west-2
- Aurora Global Database requires PostgreSQL 11.9+ or 12.4+ for global cluster support
- VPC CIDR blocks must not overlap (10.0.0.0/16 for us-east-1, 10.1.0.0/16 for us-west-2)
- VPC peering requires proper route table entries in both regions
- Route53 health checks require public ALB endpoints (or CloudWatch alarm integration)
- Lambda functions must have Node.js 16+ runtime (Node.js 18+ requires AWS SDK v3, not v2)
- S3 replication requires versioning enabled on both source and destination buckets
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
- Additional CloudWatch alarms for proactive monitoring

## Success Criteria

- Functionality: Multi-region infrastructure deployed successfully in both regions
- Database Replication: Aurora Global Database replicating data from primary to secondary
- Automatic Failover: Route53 health checks trigger failover on primary region failure
- Storage Replication: S3 objects replicate to DR region within minutes
- Event Distribution: EventBridge forwards events across regions
- Monitoring: CloudWatch dashboard shows unified view of both regions
- Network Connectivity: VPC peering enables cross-region communication
- Resource Naming: All resources include environmentSuffix for CI/CD compatibility
- Destroyability: All resources can be cleanly destroyed without manual intervention
- Code Quality: Clean TypeScript, modular ComponentResources, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- Aurora Global Database with primary and secondary clusters
- Lambda functions behind ALBs in both regions
- Route53 hosted zone with failover routing policy
- S3 buckets with cross-region replication
- EventBridge rules for cross-region event forwarding
- CloudWatch dashboard with multi-region metrics
- VPCs with peering connection and route tables
- Security groups and IAM roles
- Stack outputs for all critical resource identifiers
- Unit tests for all components
- Documentation and deployment instructions
