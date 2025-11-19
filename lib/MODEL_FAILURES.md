# Model Response Failures Analysis

This analysis documents critical failures in the MODEL_RESPONSE that prevent successful deployment of the multi-region disaster recovery infrastructure. The generated code demonstrates fundamental misunderstandings of Aurora Global Database architecture, multi-region CDK deployment patterns, and cross-region resource coordination.

## Critical Failures

### 1. Aurora Global Database Architecture Misunderstanding

**Impact Level**: Critical (Deployment Blocker)

**MODEL_RESPONSE Issue**:
The code creates a standard regional `rds.DatabaseCluster` but attempts to use `failoverGlobalCluster` API operations:

```typescript
// MODEL_RESPONSE: Lines 146-170
const dbCluster = new rds.DatabaseCluster(
  this,
  `TradingDBCluster-${environmentSuffix}`,
  {
    engine: rds.DatabaseClusterEngine.auroraPostgres({
      version: rds.AuroraPostgresEngineVersion.VER_15_4,
    }),
    // ... standard regional cluster configuration
  }
);

// Lines 380-392 - Attempting global cluster operation on regional cluster
const promoteDBTask = new tasks.CallAwsService(
  this,
  `PromoteDB-${environmentSuffix}`,
  {
    service: 'rds',
    action: 'failoverGlobalCluster', // ❌ This API doesn't work with regional clusters
    parameters: {
      GlobalClusterIdentifier: dbCluster.clusterIdentifier, // ❌ Not a global cluster
      TargetDbClusterIdentifier: `secondary-cluster-${environmentSuffix}`, // ❌ Doesn't exist
    },
  }
);
```

**IDEAL_RESPONSE Fix**:
```typescript
// Use CfnGlobalCluster for proper Aurora Global Database
const globalCluster = new rds.CfnGlobalCluster(
  this,
  `TradingGlobalDBCluster-${environmentSuffix}`,
  {
    globalClusterIdentifier: `trading-global-db-${environmentSuffix}`,
    engine: 'aurora-postgresql',
    engineVersion: '15.4',
    deletionProtection: false, // Must be false for destroyability
  }
);

// Primary regional cluster attached to global cluster
const primaryDbCluster = new rds.DatabaseCluster(
  this,
  `TradingDBClusterPrimary-${environmentSuffix}`,
  {
    engine: rds.DatabaseClusterEngine.auroraPostgres({
      version: rds.AuroraPostgresEngineVersion.VER_15_4,
    }),
    // ... configuration
  }
);

// Attach primary cluster to global cluster
const primaryClusterAttachment = new rds.CfnDBClusterMembership(
  this,
  `PrimaryClusterAttachment-${environmentSuffix}`,
  {
    globalClusterIdentifier: globalCluster.globalClusterIdentifier,
    dbClusterIdentifier: primaryDbCluster.clusterIdentifier,
  }
);

// Secondary cluster must be created in secondary region stack
// with similar attachment process
```

**Root Cause**:
- Model confused AWS RDS regional clusters with Aurora Global Database
- Failed to understand that Global Database requires `CfnGlobalCluster` + regional cluster attachments
- Didn't comprehend that `failoverGlobalCluster` only works with actual global clusters

**AWS Documentation Reference**:
https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html

**Impact**:
- Deployment would fail during Step Functions execution
- Unable to perform cross-region failover
- Complete redesign of database architecture required

---

### 2. Multi-Region Deployment Architecture Wrong

**Impact Level**: Critical (Deployment Blocker)

**MODEL_RESPONSE Issue**:
Code is structured as a single-region deployment with region-conditional logic, but PROMPT requires simultaneous deployment to both us-east-1 and us-east-2:

```typescript
// MODEL_RESPONSE: Lines 32-34
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-east-2';
const currentRegion = stack.region; // ❌ Only deploys to ONE region

// Lines 100-142 - Conditional S3 replication logic
if (currentRegion === primaryRegion) {
  // S3 replication setup
  // ❌ This means secondary region never gets replication configured
}

// Lines 379-461 - Failover orchestration only in primary
if (currentRegion === primaryRegion) {
  // Step Functions, etc.
  // ❌ Secondary region has no failover orchestration
}
```

**IDEAL_RESPONSE Fix**:
```typescript
// Separate stack classes for each region
export class MultiRegionDRPrimaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MultiRegionDRStackProps) {
    super(scope, id, {
      ...props,
      env: { region: 'us-east-1' }
    });

    // Primary region resources with cross-region references
    const globalCluster = new rds.CfnGlobalCluster(/*...*/);
    const primaryCluster = new rds.DatabaseCluster(/*...*/);

    // Export values for secondary stack
    new cdk.CfnOutput(this, 'GlobalClusterArn', {
      value: globalCluster.attrArn,
      exportName: `GlobalClusterArn-${props.environmentSuffix}`
    });
  }
}

export class MultiRegionDRSecondaryStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MultiRegionDRSecondaryStackProps) {
    super(scope, id, {
      ...props,
      env: { region: 'us-east-2' }
    });

    // Import global cluster identifier from primary
    const globalClusterArn = cdk.Fn.importValue(
      `GlobalClusterArn-${props.environmentSuffix}`
    );

    // Create secondary cluster and attach to global cluster
    const secondaryCluster = new rds.DatabaseCluster(/*...*/);
    new rds.CfnDBClusterMembership(/*...*/);
  }
}

// In tap-stack.ts - deploy BOTH stacks
const app = new cdk.App();
const primaryStack = new MultiRegionDRPrimaryStack(app, `TapStackPrimary${environmentSuffix}`, {/*...*/});
const secondaryStack = new MultiRegionDRSecondaryStack(app, `TapStackSecondary${environmentSuffix}`, {
  globalClusterProps: primaryStack.globalClusterProps
});

secondaryStack.addDependency(primaryStack); // Ensure primary deploys first
```

**Root Cause**:
- Model doesn't understand CDK multi-region deployment patterns
- Confused conditional logic within single stack vs separate region-specific stacks
- Failed to grasp that cross-region references require explicit stack dependencies

**Cost/Security/Performance Impact**:
- Unable to deploy to both regions
- No actual disaster recovery capability
- Violates core PROMPT requirement for multi-region architecture

---

### 3. Missing Secondary Cluster Definition

**Impact Level**: Critical (Deployment Blocker)

**MODEL_RESPONSE Issue**:
Step Functions references `secondary-cluster-${environmentSuffix}` that is never created:

```typescript
// MODEL_RESPONSE: Line 388
TargetDbClusterIdentifier: `secondary-cluster-${environmentSuffix}`,
// ❌ This cluster identifier doesn't exist anywhere in the code
```

**IDEAL_RESPONSE Fix**:
```typescript
// In secondary stack
const secondaryCluster = new rds.DatabaseCluster(
  this,
  `TradingDBClusterSecondary-${environmentSuffix}`,
  {
    clusterIdentifier: `trading-db-secondary-${environmentSuffix}`, // Explicit identifier
    // ... configuration
  }
);

// Export for cross-region reference
new ssm.StringParameter(this, 'SecondaryClusterParam', {
  parameterName: `/trading/secondary-cluster-id/${environmentSuffix}`,
  stringValue: secondaryCluster.clusterIdentifier,
});

// In primary stack failover logic - import secondary cluster ID
const secondaryClusterId = ssm.StringParameter.valueFromLookup(
  this,
  `/trading/secondary-cluster-id/${environmentSuffix}`
);

const promoteDBTask = new tasks.CallAwsService(/*...*/, {
  parameters: {
    GlobalClusterIdentifier: globalCluster.globalClusterIdentifier,
    TargetDbClusterIdentifier: secondaryClusterId, // ✅ Uses actual cluster ID
  },
});
```

**Root Cause**:
- Model invented a cluster identifier without creating the resource
- No understanding of cross-stack resource references
- Demonstrates lack of validation against actual deployed resources

---

### 4. Hardcoded Placeholder Values

**Impact Level**: Critical (Deployment Blocker)

**MODEL_RESPONSE Issue**:
Multiple hardcoded placeholder values that would fail at runtime:

```typescript
// Lines 401, 412
HostedZoneId: 'HOSTED_ZONE_ID', // ❌ Invalid placeholder
HostedZoneId: 'Z1234567890ABC', // ❌ Invalid placeholder

// Line 407
Name: 'api.trading-platform.com', // ❌ Hardcoded domain (not using environmentSuffix)
```

**IDEAL_RESPONSE Fix**:
```typescript
// Create hosted zone if needed, or use existing via lookup
const hostedZone = route53.HostedZone.fromLookup(this, 'ExistingZone', {
  domainName: process.env.DOMAIN_NAME || 'example.com',
}) || new route53.PublicHostedZone(this, `TradingZone-${environmentSuffix}`, {
  zoneName: `trading-${environmentSuffix}.example.com`,
});

// Use actual API Gateway regional hosted zone ID
const apiGatewayZoneId = stack.regionalHostedZoneId;

// Dynamic domain name with environment suffix
const apiDomainName = `api-${environmentSuffix}.${hostedZone.zoneName}`;

// Proper health check configuration
const healthCheck = new route53.CfnHealthCheck(
  this,
  `APIHealthCheck-${environmentSuffix}`,
  {
    healthCheckConfig: {
      type: 'HTTPS',
      resourcePath: '/health',
      fullyQualifiedDomainName: apiDomainName,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
    },
  }
);
```

**Root Cause**:
- Model left placeholder values instead of implementing proper resource resolution
- No awareness that CDK can create or lookup Route53 resources
- Failed to use environment-specific naming as required by PROMPT

**Impact**:
- Step Functions would fail on execution
- Route53 operations would fail with invalid hosted zone IDs
- Unable to perform automated failover

---

### 5. VPC Networking Issues for Multi-Region

**Impact Level**: High (Performance/Connectivity)

**MODEL_RESPONSE Issue**:
Each region creates isolated VPCs with no connectivity or peering:

```typescript
// Lines 36-47
const vpc = new ec2.Vpc(this, `TradingPlatformVPC-${environmentSuffix}`, {
  natGateways: 0, // ✅ Good for cost
  subnetConfiguration: [
    {
      name: 'Private',
      subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // ❌ No internet connectivity
    },
  ],
});
// ❌ No VPC peering setup between regions
// ❌ No transit gateway for cross-region communication
```

**IDEAL_RESPONSE Fix**:
```typescript
// In primary stack
const primaryVpc = new ec2.Vpc(this, `TradingVPCPrimary-${environmentSuffix}`, {
  natGateways: 1, // Need at least one for Lambda internet access
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
  maxAzs: 3,
});

// VPC Peering for cross-region communication
const vpcPeeringConnection = new ec2.CfnVPCPeeringConnection(
  this,
  `VPCPeering-${environmentSuffix}`,
  {
    vpcId: primaryVpc.vpcId,
    peerVpcId: secondaryVpcId, // From secondary stack
    peerRegion: 'us-east-2',
  }
);

// Update route tables for peered VPC access
primaryVpc.privateSubnets.forEach((subnet, index) => {
  new ec2.CfnRoute(this, `PeerRoute${index}-${environmentSuffix}`, {
    routeTableId: subnet.routeTable.routeTableId,
    destinationCidrBlock: secondaryVpcCidr,
    vpcPeeringConnectionId: vpcPeeringConnection.ref,
  });
});
```

**Root Cause**:
- Model didn't consider cross-region network connectivity requirements
- No understanding of subnet types and egress requirements for Lambda
- Failed to implement VPC peering as mentioned in PROMPT (line 93)

**Performance Impact**:
- Lambdas in PRIVATE_ISOLATED subnets cannot reach AWS service endpoints
- No cross-region communication for event forwarding
- EventBridge cross-region rules will work, but no direct VPC-to-VPC communication

---

### 6. Lambda VPC Configuration Prevents AWS Service Access

**Impact Level**: High (Deployment Blocker)

**MODEL_RESPONSE Issue**:
Lambdas are placed in PRIVATE_ISOLATED subnets without NAT Gateway or VPC endpoints for all needed services:

```typescript
// Lines 50-56 - Only 2 VPC endpoints configured
vpc.addInterfaceEndpoint(`RDSEndpoint-${environmentSuffix}`, {
  service: ec2.InterfaceVpcEndpointAwsService.RDS,
});
vpc.addInterfaceEndpoint(`LambdaEndpoint-${environmentSuffix}`, {
  service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
});
// ❌ Missing: DynamoDB, SQS, CloudWatch Logs, Secrets Manager, SSM

// Lines 194-197
vpc,
vpcSubnets: {
  subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // ❌ No internet or endpoint access
},
```

**IDEAL_RESPONSE Fix**:
```typescript
// Option 1: Use PRIVATE_WITH_EGRESS subnets (requires NAT Gateway)
vpcSubnets: {
  subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
},

// Option 2: Add all necessary VPC endpoints for PRIVATE_ISOLATED
vpc.addGatewayEndpoint('DynamoDBEndpoint', {
  service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
});

vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
});

vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
});

vpc.addInterfaceEndpoint('SQSEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SQS,
});

vpc.addInterfaceEndpoint('SSMEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SSM,
});

// Keep RDS endpoint
vpc.addInterfaceEndpoint('RDSEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.RDS,
});

// Estimate: 5 interface endpoints × $7/month = $35/month additional cost
// vs NAT Gateway: $32/month + data transfer costs
```

**Root Cause**:
- Model attempted cost optimization with natGateways: 0
- Didn't recognize that PRIVATE_ISOLATED requires VPC endpoints for ALL AWS services
- No understanding of Lambda networking requirements in VPC

**Deployment Impact**:
- Lambda functions will timeout trying to reach DynamoDB, SQS, CloudWatch
- Unable to retrieve database credentials from Secrets Manager
- Functions will fail to process any requests

---

### 7. S3 Cross-Region Replication Incomplete

**Impact Level**: High (Data Loss Risk)

**MODEL_RESPONSE Issue**:
S3 replication is only configured in primary region, and secondary buckets are never created:

```typescript
// Lines 100-142 - Only runs in primary region
if (currentRegion === primaryRegion) {
  const replicationRole = new iam.Role(/*...*/);

  const cfnConfigBucket = configBucket.node.defaultChild as s3.CfnBucket;
  cfnConfigBucket.replicationConfiguration = {
    role: replicationRole.roleArn,
    rules: [
      {
        id: `ConfigReplication-${environmentSuffix}`,
        status: 'Enabled',
        destination: {
          bucket: `arn:aws:s3:::trading-config-${secondaryRegion}-${environmentSuffix}`,
          // ❌ This bucket doesn't exist - never created in secondary region
        },
      },
    ],
  };
}
```

**IDEAL_RESPONSE Fix**:
```typescript
// In secondary stack - create destination buckets
const secondaryConfigBucket = new s3.Bucket(
  this,
  `ConfigBucketSecondary-${environmentSuffix}`,
  {
    bucketName: `trading-config-${secondaryRegion}-${environmentSuffix}`,
    versioned: true,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  }
);

// Export bucket ARN for primary stack to reference
new cdk.CfnOutput(this, 'SecondaryConfigBucketArn', {
  value: secondaryConfigBucket.bucketArn,
  exportName: `SecondaryConfigBucket-${environmentSuffix}`,
});

// In primary stack - setup replication to actual bucket
const secondaryConfigBucketArn = cdk.Fn.importValue(
  `SecondaryConfigBucket-${environmentSuffix}`
);

const cfnConfigBucket = configBucket.node.defaultChild as s3.CfnBucket;
cfnConfigBucket.replicationConfiguration = {
  role: replicationRole.roleArn,
  rules: [
    {
      id: `ConfigReplication-${environmentSuffix}`,
      status: 'Enabled',
      priority: 1,
      filter: {}, // Replicate all objects
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

// Grant replication role permissions for destination bucket
replicationRole.addToPolicy(
  new iam.PolicyStatement({
    actions: [
      's3:ReplicateObject',
      's3:ReplicateDelete',
      's3:ReplicateTags',
      's3:GetObjectVersionTagging',
    ],
    resources: [`${secondaryConfigBucketArn}/*`],
  })
);
```

**Root Cause**:
- Model assumed destination buckets exist without creating them
- No cross-stack bucket references implemented
- Missing required replication permissions and configurations

**Data Loss Risk**:
- Replication setup would fail - source bucket deployment error
- No backup of configuration data in secondary region
- DR failover would have no config data available

---

### 8. DynamoDB Global Table Misconfiguration

**Impact Level**: High (Data Consistency)

**MODEL_RESPONSE Issue**:
DynamoDB table specifies replicationRegions but this doesn't fully configure global tables:

```typescript
// Lines 59-74
const sessionTable = new dynamodb.Table(
  this,
  `SessionTable-${environmentSuffix}`,
  {
    tableName: `trading-sessions-${environmentSuffix}`,
    replicationRegions: [secondaryRegion], // ❌ Partial configuration
    stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    // ❌ Missing: replica table tags, encryption keys per region
  }
);
```

**IDEAL_RESPONSE Fix**:
```typescript
// CDK v2 handles global tables via replicationRegions, but needs proper configuration
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

    // Global table configuration
    replicationRegions: [secondaryRegion],
    replicationTimeout: cdk.Duration.hours(2),

    // Ensure KMS keys for each region
    encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
    encryptionKey: new kms.Key(this, `SessionTableKey-${environmentSuffix}`, {
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    }),

    // Replica-specific settings
    replicaTableClass: dynamodb.TableClass.STANDARD,
    replicaGlobalSecondaryIndexes: {}, // Ensure GSIs replicated
  }
);

// Add CloudWatch alarms for replication lag
const replicationLatencyAlarm = new cloudwatch.Alarm(
  this,
  `DDBReplicationLatency-${environmentSuffix}`,
  {
    metric: sessionTable.metricSystemErrorsForOperations({
      operations: [dynamodb.Operation.PUT_ITEM, dynamodb.Operation.UPDATE_ITEM],
      statistic: 'Sum',
    }),
    threshold: 10,
    evaluationPeriods: 2,
  }
);
```

**Root Cause**:
- Basic replicationRegions usage without understanding full global table requirements
- No consideration for encryption keys in multiple regions
- Missing replication monitoring

**Data Consistency Impact**:
- Potential replication lag not monitored
- Encryption configuration may cause cross-region issues
- No visibility into global table health

---

### 9. EventBridge Cross-Region Configuration Incomplete

**Impact Level**: Medium (Event Loss)

**MODEL_RESPONSE Issue**:
EventBridge setup is incomplete for cross-region event forwarding:

```typescript
// Lines 464-476
const eventBus = new events.EventBus(
  this,
  `TradingEventBus-${environmentSuffix}`,
  {
    eventBusName: `trading-events-${currentRegion}-${environmentSuffix}`,
  }
);

// Lines 478-500
const crossRegionRule = new events.Rule(/*...*/);
crossRegionRule.addTarget(
  new targets.EventBus(
    events.EventBus.fromEventBusArn(
      this,
      `TargetEventBus-${environmentSuffix}`,
      `arn:aws:events:${secondaryRegion}:${stack.account}:event-bus/trading-events-${secondaryRegion}-${environmentSuffix}`,
      // ❌ This event bus ARN is hardcoded and may not exist
    )
  )
);
```

**IDEAL_RESPONSE Fix**:
```typescript
// In secondary stack - create event bus and export ARN
const secondaryEventBus = new events.EventBus(
  this,
  `TradingEventBusSecondary-${environmentSuffix}`,
  {
    eventBusName: `trading-events-us-east-2-${environmentSuffix}`,
  }
);

new cdk.CfnOutput(this, 'SecondaryEventBusArn', {
  value: secondaryEventBus.eventBusArn,
  exportName: `SecondaryEventBusArn-${environmentSuffix}`,
});

// Grant cross-region event forwarding permissions
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

// In primary stack - reference secondary event bus
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
      detailType: ['Order Processed', 'Session Created', 'Critical Alert'],
    },
    targets: [
      new targets.EventBus(
        events.EventBus.fromEventBusArn(
          this,
          'TargetEventBus',
          secondaryEventBusArn
        )
      ),
    ],
  }
);
```

**Root Cause**:
- Hardcoded ARN construction without verifying target exists
- No resource policy on target event bus to allow cross-region events
- Missing proper event pattern filtering

**Event Loss Risk**:
- Cross-region rule will fail to deliver events
- No error handling or dead letter queue for failed events
- Monitoring gaps for event delivery

---

### 10. API Gateway Health Check Implementation Incomplete

**Impact Level**: Medium (Monitoring)

**MODEL_RESPONSE Issue**:
Route53 health check references placeholders and incomplete configurations:

```typescript
// Lines 277-313
const healthLambda = new lambda.Function(/*...inline code*/);

const healthCheck = new route53.CfnHealthCheck(
  this,
  `APIHealthCheck-${environmentSuffix}`,
  {
    healthCheckConfig: {
      type: 'HTTPS',
      resourcePath: '/health',
      fullyQualifiedDomainName: `${api.restApiId}.execute-api.${currentRegion}.amazonaws.com`,
      // ❌ Missing port
      // ❌ Missing requestInterval
      // ❌ Missing failureThreshold
    },
  }
);
// ❌ Health check not integrated with failover routing policy
```

**IDEAL_RESPONSE Fix**:
```typescript
// Create health check Lambda with proper dependencies testing
const healthLambda = new lambda.Function(
  this,
  `HealthCheck-${environmentSuffix}`,
  {
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'index.handler',
    code: lambda.Code.fromInline(`
      const { DynamoDBClient, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
      const { RDSClient, DescribeDBClustersCommand } = require('@aws-sdk/client-rds');

      exports.handler = async () => {
        // Test DynamoDB connectivity
        const ddb = new DynamoDBClient({});
        await ddb.send(new DescribeTableCommand({
          TableName: process.env.SESSION_TABLE_NAME
        }));

        // Test RDS connectivity
        const rds = new RDSClient({});
        await rds.send(new DescribeDBClustersCommand({
          DBClusterIdentifier: process.env.DB_CLUSTER_ID
        }));

        return {
          statusCode: 200,
          body: JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            checks: {
              dynamodb: 'ok',
              rds: 'ok'
            }
          })
        };
      };
    `),
    environment: {
      SESSION_TABLE_NAME: sessionTable.tableName,
      DB_CLUSTER_ID: dbCluster.clusterIdentifier,
    },
    timeout: cdk.Duration.seconds(10),
  }
);

// Grant health check Lambda read permissions
sessionTable.grantReadData(healthLambda);
dbCluster.grantConnect(healthLambda);

// API Gateway integration with health endpoint
const healthIntegration = new apigateway.LambdaIntegration(healthLambda);
api.root.addResource('health').addMethod('GET', healthIntegration);

// Route53 health check with proper configuration
const healthCheck = new route53.CfnHealthCheck(
  this,
  `APIHealthCheck-${environmentSuffix}`,
  {
    healthCheckConfig: {
      type: 'HTTPS',
      resourcePath: `/${api.deploymentStage.stageName}/health`,
      fullyQualifiedDomainName: `${api.restApiId}.execute-api.${currentRegion}.amazonaws.com`,
      port: 443,
      requestInterval: 30, // Check every 30 seconds
      failureThreshold: 3, // Fail after 3 consecutive failures
    },
    healthCheckTags: [
      {
        key: 'Name',
        value: `api-health-${environmentSuffix}`,
      },
      {
        key: 'Region',
        value: currentRegion,
      },
    ],
  }
);

// Use health check in Route53 failover routing
const recordSet = new route53.ARecord(this, `APIRecord-${environmentSuffix}`, {
  zone: hostedZone,
  recordName: `api-${environmentSuffix}`,
  target: route53.RecordTarget.fromAlias(
    new targets.ApiGateway(api)
  ),
  // Associate with health check
  healthCheck: healthCheck.attrHealthCheckId,
});
```

**Root Cause**:
- Incomplete health check configuration
- Health Lambda doesn't actually test dependent services
- No integration between health check and failover routing

---

## Summary

**Total Failures: 10 (7 Critical, 3 High, 0 Medium)**

**Primary Knowledge Gaps:**
1. **Aurora Global Database Architecture** - Model completely misunderstood how to implement Aurora Global DB with CDK, attempting to use global cluster operations on regional clusters
2. **CDK Multi-Region Deployment Patterns** - Failed to implement proper cross-stack communication, separate region-specific stacks, and resource dependencies
3. **Cross-Region Resource References** - No understanding of how to share resource identifiers across regions using SSM Parameter Store, CloudFormation exports, or stack properties

**Training Value**: **HIGH**

This example provides exceptional training value because it demonstrates complete failures in:
- Understanding AWS service architecture constraints (Aurora Global Database)
- Multi-region infrastructure patterns in CDK
- Cross-region resource coordination and references
- Placeholder vs. actual resource resolution
- Network architecture for multi-region applications

The model generated code that passes synthesis but would fail immediately upon deployment, highlighting the importance of deep AWS architecture understanding beyond basic CDK syntax.

**Recommended Training Focus:**
1. Aurora Global Database vs Regional Database Clusters
2. CDK cross-region stack patterns and dependencies
3. Resource reference patterns across regions (SSM, exports, stack props)
4. VPC networking for multi-region architectures
5. Lambda VPC configurations and endpoint requirements
6. Validation of generated code against deployment requirements
