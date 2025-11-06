1. Create two separate stacks in bin/tap.ts for source region (us-east-1) and target region (us-east-2) instead of a single stack. Add stack dependency with targetStack.addDependency(sourceStack). Use environmentSuffix from context instead of stackPrefix. Add Tags for Environment, Repository, and Author.

2. Update TapStackProps interface to use environmentSuffix, isSourceRegion, sourceRegion, and targetRegion. Remove crossRegionResources, replicationConfig, migrationPhases, logsRetentionDays, and stackPrefix props.

3. Create DynamoDB Global Table only in source region with replicationRegions: [targetRegion] and AWS_MANAGED encryption. In target region, use SSM Parameter Store and Custom Resource Lambda to read table name from source region instead of Fn.importValue. Create SSM StringParameter in source region for table name at /tap/{environmentSuffix}/dynamodb/table-name.

4. Replace CloudFormation exports and Fn.importValue with SSM Parameter Store for cross-region value sharing. Create SSM StringParameter in source region for VPC ID at /tap/{environmentSuffix}/vpc/id. In target region, create Custom Resource Lambda (Node.js 16.x runtime) with retry logic to read SSM parameters from source region. Use Custom Resource Provider pattern to fetch values.

5. Replace direct S3 replication configuration with Custom Resource Lambda (Node.js 16.x runtime). Lambda should check if target bucket exists before configuring replication. If target bucket does not exist, return success immediately to allow source stack deployment. Configure replication only when target bucket is available.

6. Replace CfnVPCPeeringConnection with Custom Resource Lambda (Node.js 16.x runtime) for VPC peering management. Lambda must handle creation in source region, acceptance in target region with retry logic, status polling until active, deletion of failed/rejected/expired connections with verification, reuse of existing active connections, and acceptance of pending connections. Add routes in target region private subnets with dependency on peering Custom Resource.

7. Use different VPC CIDR blocks to avoid overlap: 10.0.0.0/16 for source region and 10.1.0.0/16 for target region. Set cidr property explicitly on Vpc construct. Update route destinationCidrBlock in target region to point to source VPC CIDR (10.0.0.0/16).

8. Implement CDK Aspect to grant DynamoDB ReplicaProvider IAM Role and Policy cross-region permissions for dynamodb:DeleteTableReplica and related actions. Aspect should detect ReplicaProvider roles and policies by path or name and add wildcard region permissions.

9. In target region, replace transactionsTable.grantReadWriteData with explicit IAM policy statements using regional table ARN (arn:aws:dynamodb:{currentRegion}:{account}:table/{tableName}). Grant permissions to regional replica of Global Table, not imported table reference.

10. Update Lambda environment variables to use tableNameResource.getAttString('Value') in target region instead of Fn.importValue. Include SOURCE_REGION, TARGET_REGION, and CURRENT_REGION in all Lambda functions.

11. Use environmentSuffix for all resource naming instead of stackPrefix. Format: tap-{resource}-{environmentSuffix}. Update all resource IDs and names accordingly.

12. Use Node.js 16.x runtime for Custom Resource Lambdas (S3 replication, SSM reader, VPC peering) to support AWS SDK v2. Use Node.js 18.x runtime for application Lambdas (processor, validator).

13. Simplify cdk.json context by removing custom context values (account, emailSubscribers, crossRegionResources, replicationConfig, migrationPhases, logsRetentionDays). Keep only CDK feature flags and use environmentSuffix from context or default to 'dev'.

14. Update resource removal policies: set KMS key and DynamoDB table to DESTROY for test environment. Set S3 bucket autoDeleteObjects to true and removalPolicy to DESTROY. Set LogGroup removalPolicy to DESTROY.
