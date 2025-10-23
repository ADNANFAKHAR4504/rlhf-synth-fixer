# AWS Migration Pipeline Infrastructure

## Problem Statement

Hello, I want you to build me a comprehensive AWS migration pipeline infrastructure using **AWS CDK (Cloud Development Kit) with TypeScript**. This pipeline will automate the process of data migration, validation, replication, and monitoring with built-in remediation capabilities.

**Important**: Each major component should be implemented as a **separate, independent CDK stack** to enable modular deployment, better organization, and independent lifecycle management. It should be deployed to the **us-west-2** region.

**Note**: Organize stacks into single file (e.g., `lib/tap-stack.ts`).

## Architecture Overview

Design and deploy an end-to-end migration pipeline that orchestrates data transfer, validation, and replication across multiple AWS services with automated monitoring and remediation.

## Pipeline Flow

The migration pipeline should follow this sequence:

1. **Data Ingestion**: EC2 DataSync agents transfer files from source systems to Amazon S3
2. **Trigger Processing**: S3 events trigger AWS Lambda functions
3. **Data Validation**: Lambda functions invoke AWS Glue ETL jobs to validate data integrity
4. **Notification**: Glue ETL jobs publish validation results to Amazon SNS topics
5. **Orchestration**: SNS topics trigger AWS Step Functions state machines
6. **Metadata Replication**: Step Functions orchestrate AWS DMS (Database Migration Service) to replicate metadata to Amazon Aurora
7. **Monitoring**: Amazon EventBridge rules continuously monitor the entire pipeline flow
8. **Remediation**: EventBridge invokes remediation Lambda functions when validation failures are detected
9. **Audit Logging**: All audit trails and logs are stored in Amazon OpenSearch for analysis and compliance

## Technical Requirements

### Stack Architecture

Implement the following **independent CDK stacks**:

1. **NetworkStack**: VPC, subnets, security groups, and networking components
2. **StorageStack**: S3 buckets with event configurations
3. **DataSyncStack**: DataSync agents, tasks, and locations
4. **LambdaStack**: All Lambda functions (trigger and remediation)
5. **GlueStack**: Glue ETL jobs and related resources
6. **MessagingStack**: SNS topics and subscriptions
7. **OrchestrationStack**: Step Functions state machines
8. **DatabaseStack**: Aurora cluster configuration
9. **DMSStack**: DMS replication instances and tasks
10. **MonitoringStack**: EventBridge rules and CloudWatch alarms
11. **LoggingStack**: OpenSearch domain and log configuration

Each stack should be independently deployable and properly reference resources from other stacks using cross-stack references.

### Services to Implement

- **AWS DataSync**: Configure DataSync agents on EC2 instances for file transfer
- **Amazon S3**: Storage buckets for incoming data with event notifications
- **AWS Lambda**: 
  - Functions to trigger Glue jobs
  - Remediation functions for handling failures
- **AWS Glue**: ETL jobs for data validation and integrity checks
- **Amazon SNS**: Topics for publishing validation results and notifications
- **AWS Step Functions**: State machines for orchestrating the DMS replication workflow
- **AWS DMS**: Database Migration Service for replicating metadata to Aurora
- **Amazon Aurora**: Target database for metadata storage
- **Amazon EventBridge**: Rules for monitoring pipeline events and triggering remediation
- **Amazon OpenSearch**: Centralized logging and audit trail storage

### Implementation Details

Use **AWS CDK with TypeScript** to define all infrastructure as code. Your solution should include:

#### 1. DataSync Configuration (DataSyncStack)

```typescript
// Example structure (not complete implementation)
import * as datasync from 'aws-cdk-lib/aws-datasync';

// Configure DataSync task and location
const dataSyncTask = new datasync.CfnTask(this, 'DataSyncTask', {
  sourceLocationArn: sourceLocationArn,
  destinationLocationArn: s3LocationArn,
  // Additional configuration
});
```

#### 2. S3 Bucket with Event Notifications (StorageStack)

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';

// Create S3 bucket and configure event notifications
const dataBucket = new s3.Bucket(this, 'MigrationDataBucket', {
  eventBridgeEnabled: true,
  versioned: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
});

// Add Lambda trigger for S3 events
dataBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(triggerFunction)
);

// Export bucket ARN for cross-stack reference
this.bucketArn = dataBucket.bucketArn;
```

#### 3. Lambda Functions (LambdaStack)

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';

// Glue Trigger Lambda
const glueTriggerFunction = new nodejs.NodejsFunction(this, 'GlueTriggerFunction', {
  entry: 'lambda/glue-trigger/index.ts',
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_20_X,
  timeout: Duration.minutes(5),
  environment: {
    GLUE_JOB_NAME: glueJobName,
  },
});

// Remediation Lambda
const remediationFunction = new nodejs.NodejsFunction(this, 'RemediationFunction', {
  entry: 'lambda/remediation/index.ts',
  handler: 'handler',
  runtime: lambda.Runtime.NODEJS_20_X,
  timeout: Duration.minutes(5),
  deadLetterQueueEnabled: true,
});

// Export function ARNs for cross-stack reference
this.glueTriggerFunctionArn = glueTriggerFunction.functionArn;
this.remediationFunctionArn = remediationFunction.functionArn;
```

**Functions to implement**:
- **Glue Trigger Lambda**: Invokes Glue ETL jobs when files arrive in S3
- **Remediation Lambda**: Handles validation failures and implements retry logic

#### 4. Glue ETL Jobs (GlueStack)

```typescript
import * as glue from 'aws-cdk-lib/aws-glue';
import * as iam from 'aws-cdk-lib/aws-iam';

// Create Glue job role
const glueJobRole = new iam.Role(this, 'GlueJobRole', {
  assumedBy: new iam.ServicePrincipal('glue.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSGlueServiceRole'),
  ],
});

// Create Glue ETL job
const validationJob = new glue.CfnJob(this, 'DataValidationJob', {
  name: 'data-validation-etl',
  role: glueJobRole.roleArn,
  command: {
    name: 'glueetl',
    scriptLocation: `s3://${scriptBucket}/scripts/validation.py`,
    pythonVersion: '3',
  },
  glueVersion: '4.0',
});

// Export job name for cross-stack reference
this.validationJobName = validationJob.name;
```

**Responsibilities**:
- Validate data integrity (schema validation, data quality checks, completeness)
- Publish results to SNS topics
- Handle both success and failure scenarios

#### 5. SNS Topic Configuration (MessagingStack)

```typescript
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

// Create SNS topic for validation results
const validationTopic = new sns.Topic(this, 'ValidationResultsTopic', {
  displayName: 'Data Validation Results',
  topicName: 'migration-validation-results',
});

// Add subscription to trigger Step Functions
validationTopic.addSubscription(
  new subscriptions.LambdaSubscription(stepFunctionTriggerLambda)
);

// Export topic ARN for cross-stack reference
this.validationTopicArn = validationTopic.topicArn;
```

#### 6. Step Functions State Machine (OrchestrationStack)

```typescript
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

// Define tasks
const startDmsTask = new tasks.CallAwsService(this, 'StartDMSTask', {
  service: 'databasemigration',
  action: 'startReplicationTask',
  parameters: {
    ReplicationTaskArn: dmsTaskArn,
    StartReplicationTaskType: 'start-replication',
  },
  iamResources: ['*'],
});

// Define state machine
const definition = startDmsTask
  .next(new sfn.Wait(this, 'WaitForCompletion', {
    time: sfn.WaitTime.duration(Duration.seconds(30)),
  }))
  .next(new sfn.Succeed(this, 'Success'));

const dmsOrchestrator = new sfn.StateMachine(this, 'DMSOrchestrator', {
  definitionBody: sfn.DefinitionBody.fromChainable(definition),
  stateMachineName: 'dms-metadata-replication',
  timeout: Duration.hours(2),
});

// Export state machine ARN for cross-stack reference
this.stateMachineArn = dmsOrchestrator.stateMachineArn;
```

**Responsibilities**:
- Orchestrate DMS task execution
- Handle success/failure paths
- Coordinate metadata replication workflow

#### 7. DMS Configuration (DMSStack)

```typescript
import * as dms from 'aws-cdk-lib/aws-dms';

// Create DMS replication instance
const replicationInstance = new dms.CfnReplicationInstance(this, 'ReplicationInstance', {
  replicationInstanceClass: 'dms.t3.medium',
  replicationInstanceIdentifier: 'migration-replication-instance',
  allocatedStorage: 100,
  vpcSecurityGroupIds: [securityGroup.securityGroupId],
  replicationSubnetGroupIdentifier: subnetGroup.replicationSubnetGroupIdentifier,
  publiclyAccessible: false,
});

// Create source endpoint
const sourceEndpoint = new dms.CfnEndpoint(this, 'SourceEndpoint', {
  endpointType: 'source',
  engineName: 'mysql', // or appropriate engine
  endpointIdentifier: 'source-endpoint',
  // Additional configuration
});

// Create target endpoint (Aurora)
const targetEndpoint = new dms.CfnEndpoint(this, 'TargetEndpoint', {
  endpointType: 'target',
  engineName: 'aurora',
  endpointIdentifier: 'aurora-target-endpoint',
  // Additional configuration
});

// Create replication task
const replicationTask = new dms.CfnReplicationTask(this, 'ReplicationTask', {
  replicationTaskIdentifier: 'metadata-replication-task',
  sourceEndpointArn: sourceEndpoint.ref,
  targetEndpointArn: targetEndpoint.ref,
  replicationInstanceArn: replicationInstance.ref,
  migrationType: 'full-load-and-cdc',
  tableMappings: JSON.stringify({
    rules: [
      {
        'rule-type': 'selection',
        'rule-id': '1',
        'rule-name': '1',
        'object-locator': {
          'schema-name': '%',
          'table-name': '%',
        },
        'rule-action': 'include',
      },
    ],
  }),
});

// Export task ARN for cross-stack reference
this.replicationTaskArn = replicationTask.ref;
```

**Components**:
- Replication instance
- Source and target endpoints
- Replication tasks for metadata migration

#### 8. Aurora Database (DatabaseStack)

```typescript
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

// Create Aurora cluster
const auroraCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
  engine: rds.DatabaseClusterEngine.auroraMysql({
    version: rds.AuroraMysqlEngineVersion.VER_3_05_2,
  }),
  credentials: rds.Credentials.fromGeneratedSecret('admin'),
  writer: rds.ClusterInstance.provisioned('writer', {
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
  }),
  readers: [
    rds.ClusterInstance.provisioned('reader', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
    }),
  ],
  vpc: vpc,
  securityGroups: [dbSecurityGroup],
  storageEncrypted: true,
  backup: {
    retention: Duration.days(7),
  },
});

// Export cluster endpoint for cross-stack reference
this.clusterEndpoint = auroraCluster.clusterEndpoint.hostname;
this.clusterArn = auroraCluster.clusterArn;
```

**Configuration**:
- Configure Aurora cluster as DMS target
- Set up proper security groups and IAM roles
- Enable encryption and backups

#### 9. EventBridge Rules (MonitoringStack)

```typescript
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

// Monitor Glue job failures
const glueFailureRule = new events.Rule(this, 'GlueFailureRule', {
  eventPattern: {
    source: ['aws.glue'],
    detailType: ['Glue Job State Change'],
    detail: {
      state: ['FAILED', 'TIMEOUT'],
    },
  },
  ruleName: 'glue-job-failure-monitor',
});

glueFailureRule.addTarget(new targets.LambdaFunction(remediationFunction));

// Monitor Step Functions failures
const stepFunctionFailureRule = new events.Rule(this, 'StepFunctionFailureRule', {
  eventPattern: {
    source: ['aws.states'],
    detailType: ['Step Functions Execution Status Change'],
    detail: {
      status: ['FAILED', 'TIMED_OUT', 'ABORTED'],
    },
  },
  ruleName: 'step-function-failure-monitor',
});

stepFunctionFailureRule.addTarget(new targets.LambdaFunction(remediationFunction));

// Monitor DMS task status
const dmsMonitorRule = new events.Rule(this, 'DMSMonitorRule', {
  eventPattern: {
    source: ['aws.dms'],
    detailType: ['DMS Replication Task State Change'],
  },
  ruleName: 'dms-task-monitor',
});

dmsMonitorRule.addTarget(new targets.LambdaFunction(remediationFunction));
```

**Monitoring scope**:
- Glue job execution status
- Step Functions state changes
- DMS replication task status
- Lambda function failures

#### 10. OpenSearch Domain (LoggingStack)

```typescript
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

// Create OpenSearch domain
const openSearchDomain = new opensearch.Domain(this, 'AuditLogDomain', {
  version: opensearch.EngineVersion.OPENSEARCH_2_11,
  capacity: {
    dataNodes: 2,
    dataNodeInstanceType: 'r6g.large.search',
  },
  ebs: {
    volumeSize: 100,
    volumeType: ec2.EbsDeviceVolumeType.GP3,
  },
  vpc: vpc,
  vpcSubnets: [{
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
  }],
  securityGroups: [openSearchSecurityGroup],
  enforceHttps: true,
  nodeToNodeEncryption: true,
  encryptionAtRest: {
    enabled: true,
  },
  logging: {
    slowSearchLogEnabled: true,
    appLogEnabled: true,
    slowIndexLogEnabled: true,
  },
});

// Create log subscription filter for Lambda logs
const logGroup = logs.LogGroup.fromLogGroupName(
  this,
  'PipelineLogGroup',
  '/aws/lambda/migration-pipeline'
);

// Configure log ingestion to OpenSearch
// Note: Implement log streaming via Lambda or Kinesis Firehose

// Export domain endpoint for cross-stack reference
this.domainEndpoint = openSearchDomain.domainEndpoint;
this.domainArn = openSearchDomain.domainArn;
```

**Features**:
- Configure OpenSearch cluster for audit logging
- Set up log ingestion from all pipeline components
- Configure retention policies
- Enable encryption and access controls

#### 11. CDK App Structure

**Option A: Single File Implementation (bin/app.ts)**

All stacks defined in one file for simplicity:

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as glue from 'aws-cdk-lib/aws-glue';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as events from 'aws-cdk-lib/aws-events';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
// ... other imports

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// NetworkStack
class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly dmsSecurityGroup: ec2.SecurityGroup;
  public readonly openSearchSecurityGroup: ec2.SecurityGroup;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // Define VPC, security groups, etc.
  }
}

// StorageStack
class StorageStack extends cdk.Stack {
  public readonly dataBucket: s3.Bucket;
  public readonly scriptBucket: s3.Bucket;
  public readonly dataBucketArn: string;

  constructor(scope: cdk.App, id: string, props: cdk.StackProps & { vpc: ec2.Vpc }) {
    super(scope, id, props);
    // Define S3 buckets
  }
}

// DatabaseStack
class DatabaseStack extends cdk.Stack {
  public readonly auroraCluster: rds.DatabaseCluster;

  constructor(scope: cdk.App, id: string, props: cdk.StackProps & { 
    vpc: ec2.Vpc; 
    dbSecurityGroup: ec2.SecurityGroup;
  }) {
    super(scope, id, props);
    // Define Aurora cluster
  }
}

// ... Define all other stacks similarly ...

// Instantiate all stacks
const networkStack = new NetworkStack(app, 'MigrationNetworkStack', { env });
const storageStack = new StorageStack(app, 'MigrationStorageStack', {
  env,
  vpc: networkStack.vpc,
});
// ... instantiate remaining stacks ...

app.synth();
```

**Option B: Multi-File Implementation (bin/app.ts)**

Stacks defined in separate files and imported:

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { StorageStack } from '../lib/storage-stack';
import { DatabaseStack } from '../lib/database-stack';
import { LambdaStack } from '../lib/lambda-stack';
import { GlueStack } from '../lib/glue-stack';
import { MessagingStack } from '../lib/messaging-stack';
import { DataSyncStack } from '../lib/datasync-stack';
import { DMSStack } from '../lib/dms-stack';
import { OrchestrationStack } from '../lib/orchestration-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { LoggingStack } from '../lib/logging-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// Deploy stacks in dependency order
const networkStack = new NetworkStack(app, 'MigrationNetworkStack', { env });

const storageStack = new StorageStack(app, 'MigrationStorageStack', {
  env,
  vpc: networkStack.vpc,
});

const databaseStack = new DatabaseStack(app, 'MigrationDatabaseStack', {
  env,
  vpc: networkStack.vpc,
  dbSecurityGroup: networkStack.dbSecurityGroup,
});

const lambdaStack = new LambdaStack(app, 'MigrationLambdaStack', {
  env,
  dataBucket: storageStack.dataBucket,
});

const glueStack = new GlueStack(app, 'MigrationGlueStack', {
  env,
  scriptBucket: storageStack.scriptBucket,
});

const messagingStack = new MessagingStack(app, 'MigrationMessagingStack', {
  env,
  stepFunctionTriggerLambda: lambdaStack.stepFunctionTriggerFunction,
});

const dataSyncStack = new DataSyncStack(app, 'MigrationDataSyncStack', {
  env,
  vpc: networkStack.vpc,
  s3BucketArn: storageStack.dataBucketArn,
});

const dmsStack = new DMSStack(app, 'MigrationDMSStack', {
  env,
  vpc: networkStack.vpc,
  auroraCluster: databaseStack.auroraCluster,
  securityGroup: networkStack.dmsSecurityGroup,
});

const orchestrationStack = new OrchestrationStack(app, 'MigrationOrchestrationStack', {
  env,
  dmsTaskArn: dmsStack.replicationTaskArn,
  validationTopicArn: messagingStack.validationTopicArn,
});

const monitoringStack = new MonitoringStack(app, 'MigrationMonitoringStack', {
  env,
  remediationFunction: lambdaStack.remediationFunction,
});

const loggingStack = new LoggingStack(app, 'MigrationLoggingStack', {
  env,
  vpc: networkStack.vpc,
  openSearchSecurityGroup: networkStack.openSearchSecurityGroup,
});

// Add stack dependencies explicitly
storageStack.addDependency(networkStack);
databaseStack.addDependency(networkStack);
lambdaStack.addDependency(storageStack);
glueStack.addDependency(storageStack);
messagingStack.addDependency(lambdaStack);
dataSyncStack.addDependency(storageStack);
dmsStack.addDependency(databaseStack);
orchestrationStack.addDependency(dmsStack);
orchestrationStack.addDependency(messagingStack);
monitoringStack.addDependency(lambdaStack);
monitoringStack.addDependency(glueStack);
monitoringStack.addDependency(orchestrationStack);
loggingStack.addDependency(networkStack);

app.synth();
```

**Key Points**:
- Each stack is instantiated separately with clear dependencies
- Cross-stack references are passed as constructor parameters
- Stack dependencies are explicitly declared using `addDependency()`
- Environment configuration is centralized

## Deliverables

Your CDK TypeScript application should include:

1. **Individual CDK Stacks** - Each stack should be:
   - Independently deployable
   - Self-contained with proper cross-stack references
   - Following single responsibility principle
   - Documented with clear purpose and dependencies
   - **Can be defined in a single file OR separate files** - your choice!

2. **IAM Roles and Policies** with least privilege access for each service
3. **Cross-Stack References** using CDK exports and imports (or direct object references if in single file)
4. **Security Groups** for all components with proper ingress/egress rules
5. **CloudWatch Alarms** for critical metrics in each stack
6. **Proper error handling** and retry mechanisms
7. **Comprehensive documentation** explaining:
   - Architecture and data flow
   - Stack dependencies
   - Deployment order
   - Configuration parameters

8. **Deployment Scripts** for:
   - Sequential stack deployment
   - Stack teardown
   - Environment-specific configurations

## Stack Deployment Order

Deploy the stacks in the following order to satisfy dependencies (applies to both single-file and multi-file approaches):

1. **NetworkStack** - Foundation (VPC, subnets, security groups)
2. **StorageStack** - S3 buckets (depends on NetworkStack)
3. **DatabaseStack** - Aurora cluster (depends on NetworkStack)
4. **LambdaStack** - Lambda functions (depends on StorageStack)
5. **GlueStack** - Glue ETL jobs (depends on StorageStack, LambdaStack)
6. **MessagingStack** - SNS topics (depends on LambdaStack)
7. **DataSyncStack** - DataSync agents and tasks (depends on StorageStack, NetworkStack)
8. **DMSStack** - DMS replication (depends on DatabaseStack, NetworkStack)
9. **OrchestrationStack** - Step Functions (depends on DMSStack, MessagingStack)
10. **MonitoringStack** - EventBridge rules (depends on LambdaStack, GlueStack, OrchestrationStack)
11. **LoggingStack** - OpenSearch domain (depends on NetworkStack)

**Important**: 
- **Single File**: Pass resources directly between stack constructors (e.g., `vpc: networkStack.vpc`)
- **Multi File**: Use CDK exports/imports or pass resources as constructor parameters
- Use CDK context parameters or environment variables for configuration
- Each stack should export necessary values (ARNs, names, IDs) and dependent stacks should import or receive them

## Expected Outputs

- All resources deployed via CDK
- Working pipeline from data ingestion to audit logging
- Automated remediation on validation failures
- Comprehensive monitoring and alerting
- Searchable audit trails in OpenSearch

## Success Criteria

- Files transferred via DataSync successfully trigger the pipeline
- Glue jobs validate data and publish results
- Step Functions successfully orchestrate DMS tasks
- Validation failures trigger automatic remediation
- All events are logged to OpenSearch
- Infrastructure is fully reproducible via CDK

## Additional Considerations

- Implement proper error handling at each stage
- Use dead-letter queues (DLQ) for failed Lambda invocations
- Configure appropriate timeouts and retries
- Implement cost optimization strategies
- Follow AWS Well-Architected Framework principles
- Ensure all components are properly tagged for cost allocation
- Implement encryption at rest and in transit

---

**Technology**: AWS CDK with TypeScript  
**Architecture**: Modular, independent stacks with cross-stack references  
**Target**: Production-ready migration pipeline infrastructure