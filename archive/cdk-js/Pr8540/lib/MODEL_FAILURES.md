## Infrastructure Changes Required

### 1. ElastiCache Redis Configuration

**Issue**: The MODEL_RESPONSE uses CfnReplicationGroup with automaticFailoverEnabled, atRestEncryptionEnabled, and transitEncryptionEnabled, which adds complexity and prevents clean stack deletion.

**Fix**: Use CfnCacheCluster instead with minimal configuration for easier deletion:
```javascript
const redisCluster = new elasticache.CfnCacheCluster(this, 'BookingRedis', {
  cacheNodeType: 'cache.t3.micro',
  engine: 'redis',
  numCacheNodes: 1,
  cacheSubnetGroupName: redisSubnetGroup.ref,
  vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId]
});
```

### 2. DynamoDB Table Deletion Policy

**Issue**: The MODEL_RESPONSE sets removalPolicy to RETAIN and enables pointInTimeRecovery, preventing stack deletion.

**Fix**: Change to DESTROY and disable point-in-time recovery:
```javascript
const bookingTable = new dynamodb.Table(this, 'BookingTable', {
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  removalPolicy: RemovalPolicy.DESTROY,
  pointInTimeRecovery: false
});
```

### 3. VPC Deletion Policy

**Issue**: VPC does not have explicit removal policy set.

**Fix**: Add DESTROY removal policy to VPC:
```javascript
const vpc = new ec2.Vpc(this, 'BookingVpc', {
  maxAzs: 2,
  natGateways: 1,
  removalPolicy: RemovalPolicy.DESTROY
});
```

### 4. Lambda Function Code Deployment

**Issue**: The MODEL_RESPONSE uses lambda.Code.fromAsset() which requires external lambda directories that don't exist.

**Fix**: Use inline Lambda code with lambda.Code.fromInline() to embed function logic directly in the stack.

### 5. Lambda Runtime Version

**Issue**: The MODEL_RESPONSE uses NODEJS_18_X which may not be the latest supported runtime.

**Fix**: Update to NODEJS_20_X:
```javascript
runtime: lambda.Runtime.NODEJS_20_X
```

### 6. API Gateway Usage Plan Stage Association

**Issue**: The MODEL_RESPONSE creates a usage plan but doesn't explicitly associate it with the API deployment stage.

**Fix**: Add stage association:
```javascript
const apiKey = api.addApiKey('ApiKey');
usagePlan.addApiKey(apiKey);
usagePlan.addApiStage({ stage: api.deploymentStage });
```

### 7. Resource Naming with Environment Suffix

**Issue**: The MODEL_RESPONSE doesn't use environment suffix for EventBus name, API name, and dashboard name, which can cause conflicts in multi-environment deployments.

**Fix**: Add environment suffix to resource names:
```javascript
const eventBus = new events.EventBus(this, 'BookingEventBus', {
  eventBusName: `booking-platform-events-${environmentSuffix}`
});

const api = new apigw.RestApi(this, 'BookingApi', {
  restApiName: `BookingApi-${environmentSuffix}`,
  description: 'Booking Platform API',
  // ...
});

const dashboard = new cloudwatch.Dashboard(this, 'BookingPlatformDashboard', {
  dashboardName: `BookingPlatform-${environmentSuffix}`
});
```

### 8. Redis Endpoint Attributes

**Issue**: The MODEL_RESPONSE uses redisReplicationGroup.attrPrimaryEndPointAddress and attrPrimaryEndPointPort which are specific to replication groups.

**Fix**: Use CfnCacheCluster attributes:
```javascript
REDIS_ENDPOINT: redisCluster.attrRedisEndpointAddress,
REDIS_PORT: redisCluster.attrRedisEndpointPort
```

### 9. Unnecessary IAM Roles

**Issue**: The MODEL_RESPONSE creates an unused EventBridgeRole and ExternalSystemRole.

**Fix**: Remove unused IAM roles. Only keep LambdaExecutionRole and grant necessary permissions to it.

### 10. Missing Import Statements

**Issue**: The MODEL_RESPONSE imports unused modules like logs and targets.

**Fix**: Remove unused imports:
```javascript
import * as logs from 'aws-cdk-lib/aws-logs';
import * as targets from 'aws-cdk-lib/aws-events-targets';
```

### 11. Stack Output Export Names

**Issue**: The MODEL_RESPONSE doesn't set export names for stack outputs, making cross-stack references difficult.

**Fix**: Add export names to all outputs:
```javascript
new CfnOutput(this, 'ApiEndpoint', {
  value: api.url,
  description: 'API Gateway endpoint URL',
  exportName: `${id}-ApiEndpoint`
});
```