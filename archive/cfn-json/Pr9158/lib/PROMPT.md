# Task: Multi-Region Aurora Global Database with Automated Failover

## Platform and Language
**Use CloudFormation with JSON format exclusively**

## Background
A financial services company requires zero-downtime database operations with automatic failover capabilities across multiple regions. Their transaction processing system must maintain sub-second switchover times during regional failures while preserving data consistency.

## Problem Statement
Create a CloudFormation template to deploy a multi-region Aurora Global Database with automated health monitoring and DNS-based failover. The configuration must:

1. Deploy Aurora MySQL Global Database with primary cluster in us-east-1 that replicates to secondary cluster in eu-west-1.
2. Configure writer and reader endpoints that Lambda functions connect to for health monitoring.
3. Implement Lambda-based health checks that connect to cluster endpoints every 30 seconds and publish metrics to CloudWatch.
4. Create Route 53 health checks that evaluate Lambda function responses with 10-second intervals and 2-failure threshold.
5. Configure Route 53 weighted routing policy that switches DNS records to secondary region automatically on failure.
6. Set up CloudWatch alarms that trigger on replication lag exceeding 1000ms and notify operations team.
7. Enable deletion protection on production clusters only.
8. Implement point-in-time recovery with 7-day backup retention stored in S3.

## Expected Output
A CloudFormation template in JSON format that creates fault-tolerant Aurora infrastructure with automated regional failover, maintaining RPO < 1 second and RTO < 30 seconds.

## Constraints
1. Aurora clusters must use encrypted storage with customer-managed KMS keys
2. Lambda health check functions must complete within 5 seconds timeout
3. Route 53 health checks must use HTTPS protocol on port 3306
4. Secondary region must have at least 2 read replicas for load distribution
5. Backtrack must be enabled with 24-hour window on primary cluster
6. Parameter groups must disable binary logging for read replicas
7. Subnet groups must span at least 3 availability zones per region
8. CloudWatch Logs must retain Aurora slow query logs for 30 days

## Environment
Multi-region AWS deployment spanning us-east-1 primary region and eu-west-1 secondary region with Aurora MySQL 5.7 compatible Global Database. Requires VPCs with private subnets in both regions connected through cross-region VPC peering. Lambda functions deployed in each region connect to database endpoints for health monitoring. Route 53 hosted zone manages DNS failover routing. CloudFormation StackSets enabled for multi-region coordination. Minimum db.r5.large instances for production workloads.

## Core AWS Services Required
- RDS Aurora for Aurora MySQL Global Database spanning multiple regions
- Lambda for health check functions monitoring database endpoints
- Route 53 for DNS failover routing between regions

## Region Requirements
- Primary Region: us-east-1
- Secondary Region: eu-west-1

## Critical Requirements
- ALL resource names MUST include `${EnvironmentSuffix}` parameter for uniqueness
- NO RemovalPolicy.RETAIN or DeletionProtection except production clusters as specified
- Enable destroyability: set skip_final_snapshot or equivalent where applicable
- Use JSON format exclusively for CloudFormation template
- Implement proper error handling and monitoring
- Follow AWS best practices for multi-region deployments

## Deliverables
1. Complete CloudFormation JSON template
2. All resources properly configured with environmentSuffix
3. Health checks and monitoring in place
4. Automated failover capability
5. Comprehensive documentation
