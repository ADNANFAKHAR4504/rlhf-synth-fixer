# Multi-Region Disaster Recovery Infrastructure - IDEAL RESPONSE

## Architecture Overview

This document outlines the correct implementation for a multi-region disaster recovery solution for a critical trading platform. The architecture addresses all fundamental issues found in the MODEL_RESPONSE and provides a production-ready approach to automated failover across AWS regions.

## Critical Design Decisions

### 1. Aurora Global Database Implementation

**Correct Approach**: Use `CfnGlobalCluster` + Regional Clusters

```typescript
// Primary Stack (us-east-1)
const globalCluster = new rds.CfnGlobalCluster(
  this,
  `TradingGlobalDBCluster-${environmentSuffix}`,
  {
    globalClusterIdentifier: `trading-global-db-${environmentSuffix}`,
    engine: 'aurora-postgresql',
    engineVersion: '15.4',
    deletionProtection: false, // Required for destroyability
  }
);

const primaryDbCluster = new rds.DatabaseCluster(
  this,
  `TradingDBClusterPrimary-${environmentSuffix}`,
  {
    clusterIdentifier: `trading-db-primary-${environmentSuffix}`,
    engine: rds.DatabaseClusterEngine.auroraPostgres({
      version: rds.AuroraPostgresEngineVersion.VER_15_4,
    }),
    credentials: rds.Credentials.fromGeneratedSecret('dbadmin'),
    writer: rds.ClusterInstance.serverlessV2(`Writer-${environmentSuffix}`),
    vpc: primaryVpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    storageEncrypted: true,
  }
);

// Attach primary cluster to global cluster
primaryDbCluster.node.addDependency(globalCluster);

const cfnPrimaryCluster = primaryDbCluster.node.defaultChild as rds.CfnDBCluster;
cfnPrimaryCluster.globalClusterIdentifier = globalCluster.globalClusterIdentifier;

// Export for secondary stack
new cdk.CfnOutput(this, 'GlobalClusterIdentifier', {
  value: globalCluster.globalClusterIdentifier!,
  exportName: `GlobalClusterIdentifier-${environmentSuffix}`,
});
```

```typescript
// Secondary Stack (us-east-2)
const globalClusterIdentifier = cdk.Fn.importValue(
  `GlobalClusterIdentifier-${environmentSuffix}`
);

const secondaryDbCluster = new rds.DatabaseCluster(
  this,
  `TradingDBClusterSecondary-${environmentSuffix}`,
  {
    clusterIdentifier: `trading-db-secondary-${environmentSuffix}`,
    engine: rds.DatabaseClusterEngine.auroraPostgres({
      version: rds.AuroraPostgresEngineVersion.VER_15_4,
    }),
    // No credentials - secondary inherits from global cluster
    readers: [
      rds.ClusterInstance.serverlessV2(`Reader-${environmentSuffix}`, {
        scaleWithWriter: true,
      }),
    ],
    vpc: secondaryVpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    },
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    storageEncrypted: true,
  }
);

// Attach secondary cluster to global cluster
const cfnSecondaryCluster = secondaryDbCluster.node.defaultChild as rds.CfnDBCluster;
cfnSecondaryCluster.globalClusterIdentifier = globalClusterIdentifier;

// Store secondary cluster ID for failover operations
new ssm.StringParameter(this, 'SecondaryClusterParam', {
  parameterName: `/trading/secondary-cluster-id/${environmentSuffix}`,
  stringValue: secondaryDbCluster.clusterIdentifier,
});
```

### 2. Multi-Region Stack Architecture

**Correct Approach**: Separate Stacks with Dependencies

```typescript
// File: lib/multi-region-dr-primary-stack.ts
export class MultiRegionDRPrimaryStack extends cdk.Stack {
  public readonly globalClusterIdentifier: string;
  public readonly primaryVpcId: string;
  public readonly configBucketName: string;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, {
      ...props,
      env: { region: 'us-east-1', account: props.env?.account },
    });

    // Create global resources
    // Export values for secondary stack
  }
}
```

```typescript
// File: lib/multi-region-dr-secondary-stack.ts
export class MultiRegionDRSecondaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecondaryStackProps) {
    super(scope, id, {
      ...props,
      env: { region: 'us-east-2', account: props.env?.account },
    });

    // Import values from primary stack
    // Create regional resources
  }
}
```

```typescript
// File: lib/tap-stack.ts
const app = new cdk.App();
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const primaryStack = new MultiRegionDRPrimaryStack(
  app,
  `TapStackPrimary${environmentSuffix}`,
  {
    environmentSuffix,
    env: {
      region: 'us-east-1',
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
  }
);

const secondaryStack = new MultiRegionDRSecondaryStack(
  app,
  `TapStackSecondary${environmentSuffix}`,
  {
    environmentSuffix,
    globalClusterIdentifier: primaryStack.globalClusterIdentifier,
    primaryVpcCidr: primaryStack.vpcCidr,
    env: {
      region: 'us-east-2',
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
  }
);

// Ensure primary deploys first
secondaryStack.addDependency(primaryStack);
```

### 3. VPC Networking Configuration

**Correct Approach**: Proper Subnet Types + VPC Endpoints

```typescript
// Primary VPC with proper subnet configuration
const primaryVpc = new ec2.Vpc(this, `TradingVPCPrimary-${environmentSuffix}`, {
  vpcName: `trading-vpc-primary-${environmentSuffix}`,
  maxAzs: 3,
  natGateways: 1, // Minimum for Lambda egress
  subnetConfiguration: [
    {
      name: 'Public',
      subnetType: ec2.SubnetType.PUBLIC,
      cidrMask: 24,
    },
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      cidrMask: 24,
    },
    {
      name: 'Isolated',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      cidrMask: 24,
    },
  ],
});

// Add VPC endpoints for AWS services
primaryVpc.addGatewayEndpoint('DynamoDBEndpoint', {
  service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
});

primaryVpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
});

primaryVpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
});

primaryVpc.addInterfaceEndpoint('RDSEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.RDS,
});

primaryVpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
});

primaryVpc.addInterfaceEndpoint('SQSEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SQS,
});
```

### 4. Lambda Functions Configuration

**Correct Approach**: Place in PRIVATE_WITH_EGRESS or Add All Required Endpoints

```typescript
const tradeProcessorLambda = new lambda.Function(
  this,
  `TradeProcessor-${environmentSuffix}`,
  {
    functionName: `trade-processor-us-east-1-${environmentSuffix}`,
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('lib/lambda/trade-processor'),
    timeout: cdk.Duration.seconds(30),
    vpc: primaryVpc,
    vpcSubnets: {
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // ✅ Has internet via NAT
    },
    environment: {
      DB_CLUSTER_ARN: primaryDbCluster.clusterArn,
      DB_SECRET_ARN: primaryDbCluster.secret?.secretArn || '',
      SESSION_TABLE_NAME: sessionTable.tableName,
      REGION: 'us-east-1',
    },
  }
);

// Grant permissions
sessionTable.grantReadWriteData(tradeProcessorLambda);
primaryDbCluster.grantDataApiAccess(tradeProcessorLambda);
tradeOrderQueue.grantConsumeMessages(tradeProcessorLambda);
```

### 5. S3 Cross-Region Replication

**Correct Approach**: Create Destination Buckets First

```typescript
// In Secondary Stack - Create destination buckets
const secondaryConfigBucket = new s3.Bucket(
  this,
  `ConfigBucketSecondary-${environmentSuffix}`,
  {
    bucketName: `trading-config-us-east-2-${environmentSuffix}`,
    versioned: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  }
);

new cdk.CfnOutput(this, 'SecondaryConfigBucketArn', {
  value: secondaryConfigBucket.bucketArn,
  exportName: `SecondaryConfigBucketArn-${environmentSuffix}`,
});

const secondaryAuditLogsBucket = new s3.Bucket(
  this,
  `AuditLogsBucketSecondary-${environmentSuffix}`,
  {
    bucketName: `trading-audit-logs-us-east-2-${environmentSuffix}`,
    versioned: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  }
);

new cdk.CfnOutput(this, 'SecondaryAuditLogsBucketArn', {
  value: secondaryAuditLogsBucket.bucketArn,
  exportName: `SecondaryAuditLogsBucketArn-${environmentSuffix}`,
});
```

```typescript
// In Primary Stack - Setup replication
const secondaryConfigBucketArn = cdk.Fn.importValue(
  `SecondaryConfigBucketArn-${environmentSuffix}`
);

const replicationRole = new iam.Role(
  this,
  `S3ReplicationRole-${environmentSuffix}`,
  {
    assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    inlinePolicies: {
      replicationPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: [
              's3:GetReplicationConfiguration',
              's3:ListBucket',
            ],
            resources: [primaryConfigBucket.bucketArn],
          }),
          new iam.PolicyStatement({
            actions: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            resources: [`${primaryConfigBucket.bucketArn}/*`],
          }),
          new iam.PolicyStatement({
            actions: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            resources: [`${secondaryConfigBucketArn}/*`],
          }),
        ],
      }),
    },
  }
);

const cfnConfigBucket = primaryConfigBucket.node.defaultChild as s3.CfnBucket;
cfnConfigBucket.replicationConfiguration = {
  role: replicationRole.roleArn,
  rules: [
    {
      id: `ConfigReplication-${environmentSuffix}`,
      status: 'Enabled',
      priority: 1,
      filter: {},
      destination: {
        bucket: secondaryConfigBucketArn,
        replicationTime: {
          status: 'Enabled',
          time: { minutes: 15 },
        },
        metrics: {
          status: 'Enabled',
          eventThreshold: { minutes: 15 },
        },
      },
      deleteMarkerReplication: { status: 'Enabled' },
    },
  ],
};
```

### 6. Step Functions Failover Orchestration

**Correct Approach**: Reference Actual Global Cluster and Secondary Cluster

```typescript
// Import secondary cluster ID from SSM Parameter Store
const secondaryClusterId = ssm.StringParameter.valueFromLookup(
  this,
  `/trading/secondary-cluster-id/${environmentSuffix}`
);

const promoteDBTask = new tasks.CallAwsService(
  this,
  `PromoteDB-${environmentSuffix}`,
  {
    service: 'rds',
    action: 'failoverGlobalCluster',
    parameters: {
      GlobalClusterIdentifier: globalCluster.globalClusterIdentifier,
      TargetDbClusterIdentifier: secondaryClusterId, // ✅ Actual cluster ID
    },
    iamResources: ['*'],
    resultPath: '$.promoteResult',
  }
);

// Wait for promotion to complete
const waitForPromotion = new sfn.Wait(this, `WaitForPromotion-${environmentSuffix}`, {
  time: sfn.WaitTime.duration(cdk.Duration.seconds(60)),
});

// Update Route53 to point to secondary region
const updateRoute53Task = new tasks.CallAwsService(
  this,
  `UpdateRoute53-${environmentSuffix}`,
  {
    service: 'route53',
    action: 'changeResourceRecordSets',
    parameters: {
      HostedZoneId: hostedZone.hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: `api-${environmentSuffix}.${hostedZone.zoneName}`,
              Type: 'A',
              SetIdentifier: 'Secondary',
              Failover: 'PRIMARY',
              AliasTarget: {
                HostedZoneId: 'Z1UJRXOUMOOFQ8', // us-east-2 API Gateway zone ID
                DNSName: secondaryApiDomainName,
                EvaluateTargetHealth: true,
              },
            },
          },
        ],
      },
    },
    iamResources: [hostedZone.hostedZoneArn],
  }
);

// Validate failover success
const validateFailoverTask = new tasks.LambdaInvoke(
  this,
  `ValidateFailover-${environmentSuffix}`,
  {
    lambdaFunction: failoverTestLambda,
    payload: sfn.TaskInput.fromObject({
      action: 'validate',
      region: 'us-east-2',
    }),
  }
);

// Create failover definition with error handling
const failoverDefinition = promoteDBTask
  .next(waitForPromotion)
  .next(updateRoute53Task)
  .next(validateFailoverTask)
  .addCatch(new tasks.SnsPublish(this, 'FailoverErrorNotification', {
    topic: alertTopic,
    message: sfn.TaskInput.fromText('Failover process failed'),
  }));

const failoverStateMachine = new sfn.StateMachine(
  this,
  `FailoverStateMachine-${environmentSuffix}`,
  {
    stateMachineName: `failover-orchestration-${environmentSuffix}`,
    definition: failoverDefinition,
    timeout: cdk.Duration.minutes(15),
  }
);
```

### 7. DynamoDB Global Table Configuration

**Correct Approach**: Full Global Table Setup

```typescript
const sessionTable = new dynamodb.Table(
  this,
  `SessionTable-${environmentSuffix}`,
  {
    tableName: `trading-sessions-${environmentSuffix}`,
    partitionKey: {
      name: 'sessionId',
      type: dynamodb.AttributeType.STRING,
    },
    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    pointInTimeRecovery: true,
    stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,

    // Global table replication
    replicationRegions: ['us-east-2'],
    replicationTimeout: cdk.Duration.hours(2),
  }
);

// Monitor replication lag
const replicationLatencyAlarm = new cloudwatch.Alarm(
  this,
  `DDBReplicationLatency-${environmentSuffix}`,
  {
    metric: new cloudwatch.Metric({
      namespace: 'AWS/DynamoDB',
      metricName: 'ReplicationLatency',
      dimensionsMap: {
        TableName: sessionTable.tableName,
        ReceivingRegion: 'us-east-2',
      },
      statistic: 'Average',
    }),
    threshold: 1000, // 1 second
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  }
);

replicationLatencyAlarm.addAlarmAction(new actions.SnsAction(alertTopic));
```

### 8. Route53 Health Checks

**Correct Approach**: Complete Health Check Configuration

```typescript
// Create comprehensive health check Lambda
const healthLambda = new lambda.Function(
  this,
  `HealthCheck-${environmentSuffix}`,
  {
    functionName: `health-check-us-east-1-${environmentSuffix}`,
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    code: lambda.Code.fromAsset('lib/lambda/health-check'),
    timeout: cdk.Duration.seconds(10),
    environment: {
      SESSION_TABLE_NAME: sessionTable.tableName,
      DB_CLUSTER_ID: primaryDbCluster.clusterIdentifier,
      QUEUE_URL: tradeOrderQueue.queueUrl,
    },
  }
);

// Grant permissions
sessionTable.grantReadData(healthLambda);
primaryDbCluster.grantConnect(healthLambda);
tradeOrderQueue.grantSendMessages(healthLambda);

// Add health endpoint to API
const healthIntegration = new apigateway.LambdaIntegration(healthLambda);
api.root.addResource('health').addMethod('GET', healthIntegration);

// Create Route53 health check
const healthCheck = new route53.CfnHealthCheck(
  this,
  `APIHealthCheck-${environmentSuffix}`,
  {
    healthCheckConfig: {
      type: 'HTTPS',
      resourcePath: `/${api.deploymentStage.stageName}/health`,
      fullyQualifiedDomainName: `${api.restApiId}.execute-api.us-east-1.amazonaws.com`,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
    },
    healthCheckTags: [
      {
        key: 'Name',
        value: `api-health-primary-${environmentSuffix}`,
      },
      {
        key: 'Region',
        value: 'us-east-1',
      },
    ],
  }
);
```

### 9. CloudWatch Monitoring and Alarming

**Correct Approach**: Comprehensive Monitoring

```typescript
// Lambda error monitoring
const lambdaErrorAlarm = new cloudwatch.Alarm(
  this,
  `LambdaErrorAlarm-${environmentSuffix}`,
  {
    alarmName: `lambda-errors-${environmentSuffix}`,
    metric: tradeProcessorLambda.metricErrors({
      statistic: 'Sum',
    }),
    threshold: 5,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  }
);

lambdaErrorAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

// API Gateway latency monitoring
const apiLatencyAlarm = new cloudwatch.Alarm(
  this,
  `APILatencyAlarm-${environmentSuffix}`,
  {
    alarmName: `api-latency-${environmentSuffix}`,
    metric: api.metricLatency({
      statistic: 'Average',
    }),
    threshold: 1000, // 1 second
    evaluationPeriods: 3,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  }
);

apiLatencyAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

// RDS CPU monitoring
const rdsAlarm = new cloudwatch.Alarm(
  this,
  `RDSCPUAlarm-${environmentSuffix}`,
  {
    alarmName: `rds-cpu-${environmentSuffix}`,
    metric: new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        DBClusterIdentifier: primaryDbCluster.clusterIdentifier,
      },
      statistic: 'Average',
    }),
    threshold: 80,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
  }
);

rdsAlarm.addAlarmAction(new actions.SnsAction(alertTopic));
```

### 10. EventBridge Cross-Region Event Distribution

**Correct Approach**: Create Target Event Bus First

```typescript
// In Secondary Stack
const secondaryEventBus = new events.EventBus(
  this,
  `TradingEventBusSecondary-${environmentSuffix}`,
  {
    eventBusName: `trading-events-us-east-2-${environmentSuffix}`,
  }
);

// Grant permissions for cross-region events
secondaryEventBus.addToResourcePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [new iam.ServicePrincipal('events.amazonaws.com')],
    actions: ['events:PutEvents'],
    resources: [secondaryEventBus.eventBusArn],
    conditions: {
      StringEquals: {
        'aws:SourceAccount': cdk.Stack.of(this).account,
      },
    },
  })
);

new cdk.CfnOutput(this, 'SecondaryEventBusArn', {
  value: secondaryEventBus.eventBusArn,
  exportName: `SecondaryEventBusArn-${environmentSuffix}`,
});
```

```typescript
// In Primary Stack
const secondaryEventBusArn = cdk.Fn.importValue(
  `SecondaryEventBusArn-${environmentSuffix}`
);

const crossRegionRule = new events.Rule(
  this,
  `CrossRegionForwarding-${environmentSuffix}`,
  {
    eventBus: primaryEventBus,
    eventPattern: {
      source: ['trading.platform'],
      detailType: [
        'Order Processed',
        'Session Created',
        'Critical Alert',
        'Failover Event',
      ],
    },
  }
);

crossRegionRule.addTarget(
  new targets.EventBus(
    events.EventBus.fromEventBusArn(
      this,
      'TargetEventBus',
      secondaryEventBusArn
    ),
    {
      deadLetterQueue: new sqs.Queue(this, 'EventsDLQ', {
        queueName: `events-dlq-${environmentSuffix}`,
      }),
    }
  )
);
```

## Summary of Key Improvements

1. **Aurora Global Database**: Proper use of `CfnGlobalCluster` with regional cluster attachments
2. **Multi-Region Architecture**: Separate primary and secondary stacks with explicit dependencies
3. **Cross-Region References**: Use of CloudFormation exports and SSM Parameter Store
4. **VPC Networking**: Proper subnet configuration with NAT Gateway and VPC endpoints
5. **S3 Replication**: Destination buckets created before source bucket replication setup
6. **Lambda Configuration**: Placed in subnets with egress capability
7. **Step Functions**: References actual resources with proper error handling
8. **DynamoDB Global Tables**: Complete configuration with replication monitoring
9. **Route53 Health Checks**: Comprehensive health validation with proper configuration
10. **EventBridge**: Proper cross-region event forwarding with permissions and DLQ

## Deployment Strategy

1. Deploy Primary Stack first (us-east-1)
2. Wait for all resources to be created
3. Deploy Secondary Stack (us-east-2) - depends on primary exports
4. Validate cross-region replication (DynamoDB, S3)
5. Test failover orchestration in non-production environment
6. Configure monitoring and alerting
7. Document failover procedures

## Testing Requirements

- Unit tests for all Constructs (100% coverage)
- Integration tests using actual stack outputs
- Failover simulation tests
- Performance testing under load
- Disaster recovery runbook validation

## Cost Optimization Notes

- NAT Gateway: $32/month (required for Lambda egress)
- VPC Endpoints: ~$7/month each × 5 = $35/month
- Aurora Serverless v2: Pay per ACU consumed
- DynamoDB Global Tables: Pay per replicated write
- Cross-region data transfer: $0.02/GB

Total estimated monthly cost (baseline): ~$150-200/month
