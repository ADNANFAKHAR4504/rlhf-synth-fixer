1. Create two separate stacks in bin/tap.ts for source region (us-east-1) and target region (eu-west-1) instead of a single stack. Add stack dependency with targetStack.addDependency(sourceStack).
2. Add isSourceRegion, sourceRegion, and targetRegion props to TapStackProps interface. Remove environmentSuffix-only interface.
3. Create DynamoDB Global Table only in source region with replicationRegions: [targetRegion] and AWS_MANAGED encryption. In target region, import table using Fn.importValue instead of creating a new table.
4. Configure S3 cross-region replication only in source region: create IAM replication role, add bucket resource policy, and set replicationConfiguration on CfnBucket. Target bucket name must match the bucket created in target region stack.
5. Create VPC peering connection in target region stack using CfnVPCPeeringConnection with peerRegion set to sourceRegion. Add routes in target region private subnets pointing to source VPC CIDR (10.0.0.0/16). Export VPC ID from source region and import in target region.
6. Export DynamoDB table name and VPC ID from source region stack. Import these in target region stack using Fn.importValue for cross-region references.
7. Update Lambda environment variables to include SOURCE_REGION, TARGET_REGION, and CURRENT_REGION. Use Fn.importValue for TABLE_NAME in target region.
8. Ensure S3 bucket names include region suffix for proper cross-region replication: tap-logs-{environmentSuffix}-{account}-{region}.
