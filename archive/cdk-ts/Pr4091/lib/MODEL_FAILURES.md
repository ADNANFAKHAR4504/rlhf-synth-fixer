# Infrastructure Changes Required

## 1. Multi-Region Architecture Incompatibility

The model implemented a multi-region architecture with separate primary and secondary stacks in us-east-1 and us-west-1. This design is incompatible with the CI/CD pipeline which deploys to a single region based on environment variables.

Change the bin/tap.ts from creating two stacks with isPrimary property to creating a single stack with environmentSuffix property that aligns with the CI/CD pipeline's ENVIRONMENT_SUFFIX variable.

## 2. Aurora Global Database Configuration

The model used CfnGlobalCluster with hardcoded global cluster identifier tap-global-database and separate cluster configurations for primary and secondary regions. For test environments in a single region, use a standard DatabaseCluster without global database configuration.

Replace the Aurora Global Database setup with a standard regional Aurora cluster using the DatabaseCluster construct with proper cluster identifier based on environment suffix.

## 3. DynamoDB Global Table Replication

The model configured DynamoDB with replicationRegions pointing to the opposite region. In a single-region deployment, remove the replicationRegions property entirely to create a standard regional table.

## 4. Resource Retention Policies

The model set removalPolicy to RETAIN and deletionProtection to true on Aurora clusters and other resources. For test environments that need easy cleanup, all resources should use RemovalPolicy.DESTROY and deletionProtection should be false.

Update all KMS keys, Secrets, DynamoDB tables, and Aurora clusters to use removalPolicy: cdk.RemovalPolicy.DESTROY and set deletionProtection: false on the Aurora cluster.

## 5. Route53 Health Checks with Placeholder Values

The model created Route53 health checks with hardcoded placeholder IP addresses like 127.0.0.1 and example.com endpoints. These are non-functional and would fail in deployment.

Remove the health check configuration or use actual cluster endpoints. For a single-region deployment, simplify to a basic A record pointing to a placeholder IP derived from VPC subnet CIDR.

## 6. Security Hub Standards Subscription

The model attempted to subscribe to PCI-DSS standards with a specific ARN that may not exist or may not be enabled in the account. This can cause deployment failures.

Change Security Hub configuration to only enable the hub without subscribing to default standards by setting enableDefaultStandards: false.

## 7. Secondary Cluster Instance Creation

The model manually created secondary Aurora cluster instances using CfnDBInstance in a loop with separate monitoring roles for each instance. This is complex and unnecessary for a standard single-region cluster.

Use the instances property on DatabaseCluster to specify the number of instances, allowing CDK to handle instance creation automatically.

## 8. Lambda Runtime Version

The model used lambda.Runtime.NODEJS_18_X which may be approaching end of support. Use the latest LTS runtime.

Update to lambda.Runtime.NODEJS_20_X for better long-term support.

## 9. VPC NAT Gateway Configuration

The model did not specify natGateways, potentially defaulting to one NAT gateway per availability zone which is costly for test environments.

Add natGateways: 1 to the VPC configuration to minimize costs in test environments.

## 10. CloudWatch Logs Retention

The model set cloudwatchLogsRetention to 90 days. For test environments, shorter retention reduces costs.

Change cloudwatchLogsRetention to 7 days for Aurora cluster logs.

## 11. Aurora Backup Retention Period

The model configured 35 days backup retention for enterprise compliance. Test environments do not need extended retention.

Reduce backup retention to cdk.Duration.days(7) for test environments.

## 12. ElastiCache Snapshot Retention

The model set snapshotRetentionLimit to 14 days. For test environments, reduce this to minimize storage costs.

Change snapshotRetentionLimit to 5 days for Redis cluster.

## 13. Instance Type Selection

The model used production-grade instance types like db.r6g.large for Aurora and cache.r6g.large for Redis. Test environments should use smaller, cost-effective instances.

Change Aurora to ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MEDIUM) and Redis to cache.t4g.micro.

## 14. Lambda Memory Configuration

The model allocated 1024 MB memory to the Lambda function. For simple backup metadata recording, this is excessive.

Reduce Lambda memorySize to 512 MB.

## 15. CloudWatch Alarm Thresholds

The model set CPU utilization alarm threshold at 75 percent. For test environments, adjust thresholds to appropriate levels.

Update threshold to 80 for CPU utilization to reduce false alarms in test environments.

## 16. Aurora Monitoring Interval

The model configured 30-second monitoring intervals for Aurora. For test environments, 60-second intervals are sufficient and more cost-effective.

Change monitoringInterval to cdk.Duration.seconds(60).

## 17. Stack Props Interface

The model used isPrimary: boolean property which is not compatible with the existing tap.ts implementation that uses environmentSuffix.

Change TapStackProps interface to use environmentSuffix?: string instead of isPrimary: boolean.

## 18. Route53 Hosted Zone Naming

The model used a static zoneName financial.internal which could conflict across multiple test environments.

Include environment suffix in the zone name using financial-${environmentSuffix}.internal.

## 19. ElastiCache and Aurora Resource Naming

The model did not specify explicit resource names or used hardcoded identifiers, leading to potential conflicts when multiple environments are deployed.

Add explicit naming using environment suffix for clusterIdentifier, tableName, cacheSubnetGroupName, replicationGroupId, and eventBusName.

## 20. Missing CloudFormation Outputs

The model did not export critical resource identifiers needed for integration testing.

Add CfnOutput declarations for VpcId, AuroraClusterEndpoint, AuroraClusterIdentifier, MetadataTableName, RedisClusterEndpoint, BackupLambdaArn, EventBusName, and DatabaseSecretArn with proper export names including environment suffix.

## 21. DynamoDB Alarm Metric Limitation

The model did not include a DynamoDB alarm, but if using metricThrottledRequestsForOperations(), this creates a math expression that aggregates metrics for all operations and exceeds CloudWatch's 10-metric limit for alarms on math expressions.

Use a simpler metric like metricUserErrors() which monitors a single metric instead of aggregating multiple operation-level metrics.

## 22. Missing Multi-Region Architecture

The model implemented a single-region stack, failing to meet the PROMPT requirement for Aurora Global Database spanning us-east-1 and us-west-1 with DynamoDB Global Tables.

Implement multi-region architecture with:
- Stack props including isPrimary, primaryRegion, secondaryRegion, globalClusterId, globalTableName
- Primary region creates CfnGlobalCluster and attaches DatabaseCluster to it
- Secondary region creates DatabaseCluster that references existing global cluster
- DynamoDB table in primary with replicationRegions array for global tables
- Both regions deploy independent VPC, Redis, Lambda, EventBridge, Security Hub, and KMS keys
- Route53 DNS records with region-specific names for service discovery
- bin/tap.ts deploys two stacks with cross-region references enabled
- Unit tests validate both primary and secondary stacks
- Integration tests verify cross-region replication and failover scenarios

## 23. Deprecated Aurora Properties

The model used deprecated properties instances and instanceProps which will be removed in future CDK versions.

Use writer and readers pattern with ClusterInstance.provisioned() for explicit writer and reader instance configuration.

## 24. Missing Route53 Health Checks and Failover

The model did not implement Route53 health checks or DNS failover policies for automatic routing during regional incidents.

Add Route53 health checks monitoring Aurora and Redis endpoints, configure failover or weighted routing policies, and implement automated DNS updates during failures.

## 25. DynamoDB Global Tables Encryption Limitation

DynamoDB Global Tables do not support CUSTOMER_MANAGED encryption with custom KMS keys. Attempting to use TableEncryption.CUSTOMER_MANAGED with replicationRegions will cause a validation error.

Use AWS_MANAGED encryption for global tables, or use CUSTOMER_MANAGED encryption only for single-region tables. Conditional logic based on isPrimary and secondaryRegion props determines the encryption type.

## 26. Security Hub Already Enabled Conflict

Attempting to create CfnHub resource when Security Hub is already enabled in the AWS account causes a CREATE_FAILED error with status code 409 (AlreadyExists).

Add an optional `enableSecurityHub` prop to TapStackProps (default: false). Only create the Security Hub resource when explicitly enabled via context parameter: `cdk deploy -c enableSecurityHub=true`. This prevents conflicts in accounts where Security Hub is already enabled manually or by other stacks.

## 27. Aurora Global Database Instance Class Restriction

Aurora Global Database does not support T3, T4G, or other burstable instance classes. Using `db.t4g.medium` causes CREATE_FAILED error: "The requested instance class is not supported by global databases: db.t4g.medium (Service: Rds, Status Code: 400)".

Aurora Global Database requires production-grade instance classes like R5 or R6G. Use `ec2.InstanceClass.R6G` with `ec2.InstanceSize.LARGE` or larger for both writer and reader instances. R6G instances provide ARM-based Graviton2 processors with better price-performance for production workloads.

## 28. ElastiCache Redis Configuration Endpoint vs Primary Endpoint

Using `attrConfigurationEndPointAddress` for a standard Redis replication group causes CREATE_FAILED error: "Template error: Configuration endpoint was not found for replication group". The ConfigurationEndPointAddress attribute only exists when cluster mode is enabled (numNodeGroups > 1).

For standard replication groups (numNodeGroups: 1 with replicas), use `attrPrimaryEndPointAddress` instead. This provides the primary node endpoint for read/write operations. Update Route53 records and CloudFormation outputs to reference the correct endpoint attribute.