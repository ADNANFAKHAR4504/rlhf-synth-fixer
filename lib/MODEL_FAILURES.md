# Infrastructure Changes Required to Fix MODEL_RESPONSE.md

## 1. Aurora MySQL Engine Version

**Issue:** The MODEL_RESPONSE specified `rds.AuroraMysqlEngineVersion.VER_3_05_2` which does not exist in AWS.

**Fix:** Changed to `rds.AuroraMysqlEngineVersion.VER_3_04_1` which is a stable, widely available Aurora MySQL engine version across all AWS regions.

**Impact:** Prevents CREATE_FAILED errors for AWS::RDS::DBCluster resources during CloudFormation deployment.

## 2. Aurora Instance Type

**Issue:** The MODEL_RESPONSE used `ec2.InstanceClass.R6G` (Graviton ARM-based instances) which have limited regional availability.

**Fix:** Changed to `ec2.InstanceClass.R5` (x86-based instances) which are universally available across all AWS regions including us-east-1, eu-west-1, and ap-southeast-1.

**Impact:** Ensures Aurora cluster instances can be provisioned in any target region without capacity errors.

## 3. Resource Removal Policies

**Issue:** The MODEL_RESPONSE did not set explicit removal policies on most resources, defaulting to RETAIN which prevents stack deletion.

**Fix:** Added `removalPolicy: cdk.RemovalPolicy.DESTROY` to all resources including:
- KMS keys and aliases
- VPC and all child resources (subnets, route tables, NAT gateways)
- VPC endpoints
- Security groups
- IAM roles
- S3 buckets (with autoDeleteObjects: true)
- Aurora clusters and instances
- Lambda functions and versions
- SNS topics
- CloudWatch alarms and dashboards
- EventBridge rules
- VPC peering connections

**Impact:** Enables complete stack cleanup via CloudFormation delete operations without orphaned resources.

## 4. Explicit Resource Naming

**Issue:** The MODEL_RESPONSE used explicit names for S3 buckets, IAM roles, Lambda functions, Aurora clusters, Step Functions state machines, and SNS topics. This causes AlreadyExists errors when redeploying after a failed stack deletion.

**Fix:** Removed all explicit naming properties:
- Removed `bucketName` from S3 buckets
- Removed `roleName` from IAM roles
- Removed `functionName` from Lambda functions
- Removed `clusterIdentifier` from Aurora clusters
- Removed `stateMachineName` from Step Functions
- Removed `topicName` from SNS topics

**Impact:** CloudFormation auto-generates unique physical names, preventing resource conflicts on redeployment.

## 5. Environment Deployment Control

**Issue:** The MODEL_RESPONSE always deployed all three environments (prod, staging, dev) which creates excessive resources for test deployments.

**Fix:** Added `deployEnvironments` configuration option that defaults to `dev` only. The option accepts:
- `all` - Deploy all environments
- `dev`, `staging`, `prod` - Deploy single environment
- Comma-separated list - Deploy multiple specific environments

**Impact:** Reduces resource count from approximately 415 to 140 for test deployments, improving deployment speed and reducing costs.

## 6. Cross-Environment Methods

**Issue:** The MODEL_RESPONSE methods (configureCrossRegionReplication, createPeeringMesh, buildDashboardsAndAlarms, emitOutputs) iterated over ENVIRONMENT_ORDER regardless of which environments were actually created.

**Fix:** Updated all cross-environment methods to filter based on actually created environments using `Object.keys(this.artifacts)`.

**Impact:** Prevents errors when only a subset of environments are deployed.

## 7. S3 Bucket Auto-Delete Objects

**Issue:** S3 buckets with DESTROY removal policy still fail to delete if they contain objects.

**Fix:** Added `autoDeleteObjects: true` to all S3 bucket configurations.

**Impact:** S3 buckets are automatically emptied before CloudFormation attempts deletion.

## 8. Aurora Deletion Protection

**Issue:** Aurora clusters may have deletion protection enabled by default in some configurations.

**Fix:** Explicitly set `deletionProtection: false` on all Aurora clusters.

**Impact:** Allows Aurora clusters to be deleted during stack destruction without manual intervention.

## 9. Data API Configuration

**Issue:** The MODEL_RESPONSE enabled Data API access via `grantDataApiAccess`, which forces CloudFormation to set `EnableHttpEndpoint: true`. Provisioned Aurora MySQL clusters running engine versions below 3.07 reject Data API enablement and fail creation.

**Fix:** Removed Data API grants and instead granted Lambda functions read access to the generated cluster secret (`cluster.secret?.grantRead(fn)`).

**Impact:** Prevents `InvalidRequest` errors caused by unsupported Data API endpoints while keeping Lambda access to database credentials.

## 10. Aurora Instance Class

**Issue:** The MODEL_RESPONSE configured Aurora instances with `db.r5.medium`, which is not a supported size for provisioned Aurora MySQL clusters. CloudFormation fails with `Invalid DB Instance class: db.r5.medium`.

**Fix:** Updated `instanceProps.instanceType` to `ec2.InstanceType.of(ec2.InstanceClass.R5, ec2.InstanceSize.LARGE)` so every environment provisions a supported `db.r5.large` instance class.

**Impact:** Prevents `InvalidRequest` failures during cluster creation and aligns all environments with AWS-supported instance classes.

## 11. Lambda Reserved Concurrency

**Issue:** The MODEL_RESPONSE set `reservedConcurrentExecutions` for every Lambda environment. Sandbox AWS accounts often enforce a minimum unreserved concurrency of 100, so reserving concurrency for dev functions caused `InvalidRequest` errors (`decreases account's UnreservedConcurrentExecution below its minimum value of [100]`).

**Fix:** Removed reserved concurrency for the dev environment by only applying `reservedConcurrentExecutions` when `envKey !== 'dev'`. Production and staging retain their explicit reservations for deterministic capacity planning.

**Impact:** Dev deployments no longer exhaust the account-wide reserve while higher environments keep their concurrency guarantees.

## 12. Lambda Version Publishing

**Issue:** Using `fn.currentVersion` publishes Lambda versions with a deterministic code hash. After a failed deployment left behind version `1`, re-deployments hit `AlreadyExists` errors when the stack tried to create the same version again.

**Fix:** Replaced `fn.currentVersion` with explicit `lambda.Version` constructs to manage the stable release and removed the automatic creation of duplicate “canary” versions so CloudFormation isn’t forced to publish an identical code artifact twice.

**Impact:** Lambda versions are cleaned up during stack deletion, eliminating `AlreadyExists` failures on subsequent deployments while keeping alias routing deterministic across environments.
