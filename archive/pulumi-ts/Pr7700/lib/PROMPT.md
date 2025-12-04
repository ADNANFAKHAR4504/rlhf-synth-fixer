# RDS PostgreSQL Optimization Project

Hey team,

We have an RDS PostgreSQL instance that is seriously overprovisioned and costing us way too much. The current setup is running on a db.r5.4xlarge instance with only 15% CPU utilization, and we're keeping backups for 35 days when we really only need 7. Plus, we have read-heavy reporting queries that are hitting the primary database and impacting performance.

I need your help to build an optimization solution using **Pulumi with TypeScript**. This is an infrastructure optimization task, so we'll be creating both the baseline infrastructure and an optimization script that reduces costs on live resources.

The business wants to see significant cost savings while maintaining performance and reliability. We also need proper monitoring and alerting in place so we can catch issues before they become problems.

## What we need to build

Create an RDS PostgreSQL optimization solution using **Pulumi with TypeScript** that demonstrates cost reduction through infrastructure optimization.

### Approach

This task uses a two-phase approach:

1. Deploy baseline infrastructure with standard resource allocations
2. Create an optimization script that reduces costs on the deployed resources

### Baseline Infrastructure Requirements

Deploy an RDS PostgreSQL setup with these baseline configurations:

1. **Primary RDS Instance**
   - Instance class: db.t3.large (optimized from overprovisioned db.r5.4xlarge)
   - Engine: PostgreSQL (latest stable version)
   - Deletion protection: enabled
   - Multi-AZ: false (single AZ for cost optimization)
   - Storage: General Purpose SSD (gp3) with appropriate size

2. **Performance Insights**
   - Enabled with 7-day retention
   - Helps identify slow queries and performance bottlenecks

3. **Backup Configuration**
   - Backup retention: 7 days (baseline before optimization)
   - Automated backups enabled
   - Backup window: during low-traffic hours

4. **Read Replica**
   - Create read replica in the same AZ
   - Instance class: db.t3.large
   - Purpose: offload read-heavy reporting queries

5. **CloudWatch Alarms**
   - CPU utilization > 80% alarm with SNS notifications
   - Free storage space < 15% alarm with SNS notifications
   - Create SNS topic for alarm notifications

6. **Parameter Group Optimization**
   - Custom parameter group with optimized settings:
   - shared_buffers = 25% of available memory
   - effective_cache_size = 75% of available memory

7. **Resource Tagging**
   - Environment tag
   - Owner tag
   - CostCenter tag

8. **Maintenance Window**
   - Configure for low-traffic hours: Sunday 3:00-5:00 AM UTC

### Optimization Script Requirements

Create lib/optimize.py that:

1. Reads ENVIRONMENT_SUFFIX from environment variable
2. Finds deployed RDS resources using naming pattern: rds-{environmentSuffix}
3. Optimizes resources via AWS APIs using boto3:
   - Reduce backup retention from 7 days to 1 day
   - Verify instance sizing is appropriate
   - Adjust any over-allocated resources
4. Calculates and displays monthly cost savings
5. Includes proper error handling and waiter logic
6. Supports dry-run mode for testing

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS RDS for PostgreSQL database
- Use CloudWatch for monitoring and alarms
- Use SNS for notifications
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: rds-{environmentSuffix}, replica-{environmentSuffix}
- Deploy to us-east-1 region
- All resources must be destroyable (no Retain policies)

### Deployment Requirements (CRITICAL)

- Resource names MUST include environmentSuffix parameter
- Example: rds-${environmentSuffix}, replica-${environmentSuffix}
- All resources MUST be destroyable (no retention policies that prevent deletion)
- Set deletion protection on primary RDS instance
- Use skipFinalSnapshot option on RDS instances to allow destruction

### Constraints

- Must use us-east-1 region
- Optimize for cost while maintaining performance
- Follow AWS Well-Architected Framework principles
- Ensure proper error handling and logging
- All resources must be destroyable for testing purposes

## Success Criteria

- Infrastructure deploys successfully with baseline configuration
- RDS primary instance running on db.t3.large
- Read replica deployed and functional
- Performance Insights enabled and collecting data
- CloudWatch alarms configured and sending notifications
- Parameter group optimizations applied
- lib/optimize.py successfully finds and modifies resources
- Cost savings are calculated and reported
- All resources include environmentSuffix in naming
- Integration tests verify optimizations work on actual AWS resources

## What to deliver

- Complete Pulumi TypeScript implementation
- RDS PostgreSQL primary instance with optimized settings
- Read replica for reporting queries
- CloudWatch alarms with SNS notifications
- Custom parameter group with memory optimizations
- lib/optimize.py script for runtime optimizations
- Unit tests for all components
- Integration tests for optimization validation
- Documentation with deployment and optimization instructions
