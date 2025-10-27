# AWS Migration Pipeline Infrastructure

## Problem Statement

Hey, I need you to build me a solid AWS migration pipeline infrastructure using **AWS CDK (Cloud Development Kit) with TypeScript**. This thing needs to automate everything - data migration, validation, replication, monitoring - the whole nine yards with built-in ways to fix issues when they pop up.

**Important**: Use **nested CDK stacks** inside one main stack. Everything goes in one file (`lib/tap-stack.ts`). Deploy to **us-west-2** region.

## Architecture Overview

Build an end-to-end migration pipeline that handles data transfer, validation, and replication across multiple AWS services with automated monitoring and self-healing capabilities.

## Pipeline Flow

1. **Data Ingestion**: DataSync agents on EC2 transfer files from on-premise to S3
2. **Trigger Processing**: S3 events (via EventBridge) trigger Lambda functions
3. **Data Validation**: Lambda invokes Glue ETL jobs to validate data
4. **Notification**: Glue jobs publish results to SNS topics
5. **Orchestration**: Step Functions state machines orchestrate DMS replication
6. **Database Replication**: DMS replicates metadata from on-premise MySQL to Aurora
7. **Monitoring**: EventBridge rules watch the entire pipeline
8. **Remediation**: EventBridge triggers remediation Lambda when stuff breaks
9. **Audit Logging**: Everything gets logged to OpenSearch

## Stack Architecture

Implement these **11 nested stacks** inside the main `TapStack`:

1. **NetworkStack**: VPC (public/private/isolated subnets), security groups for DB, DMS, OpenSearch, Lambda, DataSync
2. **StorageStack**: S3 buckets (data bucket with EventBridge enabled, script bucket for Glue)
3. **DatabaseStack**: Aurora MySQL 3.09.0 cluster (writer + reader, R6G.LARGE instances)
4. **GlueStack**: Glue database, validation ETL jobs, IAM roles
5. **MessagingStack**: SNS topics for notifications, SQS dead-letter queues
6. **DMSStack**: DMS replication instance (t3.medium), source/target endpoints, replication tasks
7. **LambdaStack**: Three Lambda functions (Glue trigger, Step Functions trigger, remediation)
8. **OrchestrationStack**: Step Functions state machine for DMS orchestration
9. **DataSyncStack**: EC2-based DataSync agent with resilient activation (always succeeds even if activation fails)
10. **MonitoringStack**: EventBridge rules monitoring Glue, DMS, Step Functions, S3
11. **LoggingStack**: OpenSearch 2.11 domain (single-node t3.small.search) for audit logs

## Key Implementation Details

### 1. Main Stack Structure

```typescript
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, { env: { region: 'us-west-2', account: process.env.CDK_DEFAULT_ACCOUNT }});
    const environmentSuffix = props?.environmentSuffix || 'dev';
    // Create all 11 nested stacks with proper dependencies
```

### 2. NetworkStack - Foundation

```typescript
class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  // Create VPC with maxAzs: 2, natGateways: 1
  // Three subnet types: PUBLIC, PRIVATE_WITH_EGRESS, PRIVATE_ISOLATED
  // Security groups: dbSecurityGroup, dmsSecurityGroup, openSearchSecurityGroup, lambdaSecurityGroup, dataSyncSecurityGroup
```

### 3. StorageStack - S3 Buckets

```typescript
class StorageStack extends cdk.NestedStack {
  public readonly dataBucket: s3.Bucket;
  // Data bucket: versioned, S3_MANAGED encryption, eventBridgeEnabled: true (NOT Lambda notifications)
  // Script bucket: versioned, S3_MANAGED encryption
  // Lifecycle rule: delete old versions after 90 days
```

### 4. DatabaseStack - Aurora MySQL

```typescript
class DatabaseStack extends cdk.NestedStack {
  public readonly auroraCluster: rds.DatabaseCluster;
  // Aurora MySQL 3.09.0, writer + reader (R6G.LARGE)
  // Credentials from Secrets Manager, lives in PRIVATE_ISOLATED subnets
  // 7-day backup retention, CloudWatch logs enabled (error, general, slowquery, audit)
```

### 5. GlueStack - ETL Jobs

```typescript
class GlueStack extends cdk.NestedStack {
  public readonly validationJob: glue.CfnJob;
  // Glue database catalog, validation job with Glue 4.0, Python 3
  // IAM role with AWSGlueServiceRole, read/write to data bucket
  // Job bookmarks enabled, CloudWatch logs/metrics enabled
```

### 6. MessagingStack - SNS & SQS

```typescript
class MessagingStack extends cdk.NestedStack {
  public readonly validationTopic: sns.Topic;
  // SNS topic for validation results with email subscription
  // SQS dead-letter queue with KMS encryption, 14-day retention
```

### 7. DMSStack - Database Migration

```typescript
class DMSStack extends cdk.NestedStack {
  public readonly replicationTask: dms.CfnReplicationTask;
  // DMS t3.medium instance in private subnets
  // Source endpoint (on-premise MySQL - needs config), target endpoint (Aurora)
  // Replication task: full-load-and-cdc, includes all tables
```

### 8. LambdaStack - Three Functions

```typescript
class LambdaStack extends cdk.NestedStack {
  // glueTriggerFunction: Python 3.12, starts Glue job when S3 files arrive (reads from EventBridge event)
  // stepFunctionTriggerFunction: Python 3.12, starts state machine execution
  // remediationFunction: Python 3.12, publishes alerts to SNS when failures detected
  // All inline code, run in VPC private subnets, 1-minute timeout
```

### 9. OrchestrationStack - Step Functions

```typescript
class OrchestrationStack extends cdk.NestedStack {
  public readonly stateMachine: sfn.StateMachine;
  // Start DMS task → Wait 5 min → Check status → Choice (success/failure/loop)
  // Publishes to SNS on completion, 2-hour timeout
  // CloudWatch Logs with ALL level logging
```

### 10. DataSyncStack - RESILIENT VERSION (Critical!)

```typescript
class DataSyncStack extends cdk.NestedStack {
  // EC2 M5.LARGE in public subnet with DataSync AMI (ami-0f508ba5fd9db6606 for us-west-2)
  // Custom resource Lambda with Node.js 20: tries agent activation 10 times with 45s waits
  // ALWAYS SUCCEEDS: Returns dummy ARN if activation fails (allows manual activation later)
  // S3 location always created with proper IAM roles (bucket + object level permissions)
```

**CRITICAL**: DataSync activation uses a custom resource that NEVER fails the stack. If auto-activation doesn't work, it returns a placeholder ARN so CloudFormation completes successfully. You can manually activate the agent later using the EC2 instance.

### 11. MonitoringStack - EventBridge Rules

```typescript
class MonitoringStack extends cdk.NestedStack {
  // Four EventBridge rules targeting remediation Lambda:
  // 1. Glue failures (FAILED, TIMEOUT states)
  // 2. DMS failures (ReplicationTaskStopped events)
  // 3. Step Functions failures (FAILED, TIMED_OUT, ABORTED)
```

### 12. LoggingStack - OpenSearch

```typescript
class LoggingStack extends cdk.NestedStack {
  public readonly openSearchDomain: opensearch.Domain;
  // OpenSearch 2.11, single-node t3.small.search, 20GB GP3 volume
  // Lives in private subnet, HTTPS enforced, encryption at rest
  // Slow search, app, and slow index logs enabled
```

### 13. EventBridge Integration

```typescript
// In main TapStack (not nested stack):
const s3ToLambdaRule = new events.Rule(this, 'S3ObjectCreatedRule', {
  eventPattern: { source: ['aws.s3'], detailType: ['Object Created'],
    detail: { bucket: { name: [dataBucket.bucketName] }, object: { key: [{ prefix: 'incoming/' }] }}},
});
s3ToLambdaRule.addTarget(new targets.LambdaFunction(glueTriggerFunction));
```

**Important**: S3 uses EventBridge notifications (not direct Lambda notifications). The rule filters for objects with `incoming/` prefix.

### 14. Stack Dependencies

```typescript
// Explicit dependency order:
storageStack.addDependency(networkStack);
databaseStack.addDependency(networkStack);
glueStack.addDependency(storageStack);
messagingStack.addDependency(glueStack);
dmsStack.addDependency(networkStack); dmsStack.addDependency(databaseStack);
// ... and so on for all 11 stacks
```

### 15. Outputs

```typescript
// Stack outputs for all major resources:
new cdk.CfnOutput(this, 'VpcId', { value: networkStack.vpc.vpcId });
new cdk.CfnOutput(this, 'DataBucketName', { value: storageStack.dataBucket.bucketName });
new cdk.CfnOutput(this, 'StateMachineArn', { value: orchestrationStack.stateMachine.stateMachineArn });
new cdk.CfnOutput(this, 'OpenSearchDomainEndpoint', { value: loggingStack.openSearchDomain.domainEndpoint });
// DataSync outputs include: AgentArn, InstanceId, ActivationSuccess, S3LocationArn, SetupInstructions
```

## Important Implementation Notes

### S3 Event Handling
- Data bucket has `eventBridgeEnabled: true`
- Do NOT use `dataBucket.addEventNotification()` with Lambda
- Use EventBridge rule in main stack to connect S3 → Lambda

### DataSync Resilience
- Custom resource Lambda tries activation 10 times (90s initial wait, 45s between retries)
- If all attempts fail, returns dummy ARN like `arn:aws:datasync:us-west-2:123456789012:agent/agent-placeholder-1234567890`
- Stack completes successfully regardless of activation status
- Outputs include `DataSyncActivationSuccess` (true/false) and instance ID for manual activation

### DMS Configuration
- Source endpoint needs real on-premise database details (currently has placeholder values)
- Replace `serverName: 'on-premise-db.example.com'` with actual hostname
- Replace hardcoded password with Secrets Manager reference
- Target endpoint uses Aurora cluster endpoint and auto-generated credentials

### Lambda Functions
- All three functions use inline Python 3.12 code
- Run in VPC private subnets with egress
- Glue trigger reads bucket/key from EventBridge event detail
- Step Functions trigger gets STATE_MACHINE_ARN via environment variable (wired in main stack)
- Remediation publishes to SNS with hardcoded topic ARN

### Environment Suffix
- Used for resource naming: `migration-validation-${environmentSuffix}`
- Defaults to 'dev', can override via props or CDK context
- Controls removal policy: RETAIN for prod, DESTROY for dev

## Deployment

```bash
# Set environment
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-west-2

# Deploy with environment suffix
cdk deploy --context environmentSuffix=dev

# Or with props
cdk deploy TapStack --parameters environmentSuffix=prod
```

## Expected Outputs

After deployment:
- VPC with all networking components
- S3 buckets ready for data ingestion
- Aurora cluster running and accessible
- DMS replication instance configured (needs source endpoint update)
- Glue jobs ready (need scripts uploaded to script bucket)
- Lambda functions deployed and wired to EventBridge
- Step Functions state machine ready to orchestrate
- DataSync agent running on EC2 (check activation status in outputs)
- EventBridge rules monitoring all services
- OpenSearch domain for audit logs

## Success Criteria

- Stack deploys successfully (even if DataSync auto-activation fails)
- Files uploaded to S3 `incoming/` folder trigger Lambda → Glue pipeline
- Glue validation results publish to SNS
- Step Functions successfully orchestrate DMS tasks
- Validation failures trigger remediation Lambda
- All events logged to OpenSearch
- Infrastructure fully reproducible via CDK

## Additional Notes

- All Lambda functions have 1-minute timeout
- Glue job has 60-minute timeout, 2 max retries
- Step Functions has 2-hour timeout
- OpenSearch has open access policy (restrict for production!)
- SNS email subscription needs manual confirmation
- DMS source endpoint needs real credentials
- Glue validation script needs to be uploaded to `s3://script-bucket/scripts/validate.py`
- All resources use environment-specific naming

---

**Technology**: AWS CDK with TypeScript  
**Architecture**: Nested stacks in single file  
**Target**: Production-ready migration pipeline  
**Region**: us-west-2