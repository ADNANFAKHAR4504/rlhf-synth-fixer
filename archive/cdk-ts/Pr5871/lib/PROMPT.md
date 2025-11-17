Create a single-file AWS CDK v2 (TypeScript) program named TapStack.ts that deploys a multi-region active-passive disaster recovery environment for a financial services platform.

Requirements:

    1.	Deploy the primary infrastructure with ECS Fargate services behind an Application Load Balancer.
    2.	Set up an RDS Aurora MySQL cluster with a cross-region read replica.
    3.	Configure DynamoDB global tables across both regions for session data replication.
    4.	Implement Route53 health checks with automatic DNS failover between regions (failover within 60 seconds).
    5.	Deploy Lambda functions in both regions for health monitoring and automated failover triggers using a circuit-breaker pattern.
    6.	Create S3 buckets with cross-region replication (S3 RTC enabled, 15-minute RPO) for static assets and backups.
    7.	Set up a CloudFront distribution with multiple origins for both regions (active-passive failover).
    8.	Configure VPC peering between the two regions for secure backend communication (no public Internet).
    9.	Implement custom CloudWatch metrics and alarms to drive failover decisions.
    10.	Create IAM roles with cross-account assume-role permissions for disaster recovery operations.

Constraints:

    •	Use customer-managed KMS keys in each region for encryption, with automatic key rotation enabled.
    •	Every resource must include a removal policy that destroys the resource upon stack deletion (RemovalPolicy.DESTROY, autoDeleteObjects for S3, and deletionProtection = false for databases).
    •	All logic, constructs, and configuration must exist in a single file named TapStack.ts.
    •	The code should be well-commented, human-readable, and demonstrate reusable patterns for multi-region deployments.
    •	Use CDK 2.x with TypeScript, Node.js 16+, and assume deployment via standard CDK commands (cdk bootstrap, cdk deploy).

Expected Output:

A single file named TapStack.ts that defines a deployable CDK stack creating identical infrastructure in both regions, supporting automatic failover, data synchronization, and health monitoring — all resources destroyed cleanly when the stack is removed.
