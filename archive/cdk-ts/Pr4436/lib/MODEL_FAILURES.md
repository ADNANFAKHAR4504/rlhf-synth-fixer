# Model Response Failures

## Critical Deployment Failures

### 1. **Deprecated CDK APIs - Multiple Breaking Changes**

**Issue**: Model used deprecated CDK APIs that are scheduled for removal in next major release.

**MODEL_RESPONSE (Wrong)**:
```typescript
// VPC with deprecated cidr property
const vpc = new ec2.Vpc(this, 'PrimaryVpc', {
  cidr: '10.0.0.0/16',
});

// RDS with deprecated instanceProps and instances
this.primaryCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
  instanceProps: {
    vpc: primaryVpc,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.XLARGE4),
  },
  instances: 3,
});

// DynamoDB with deprecated pointInTimeRecovery
this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
  pointInTimeRecovery: true,
});

// Step Functions with deprecated definition property
this.stateMachine = new stepfunctions.StateMachine(this, 'FailoverStateMachine', {
  definition,
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
// VPC with new ipAddresses property
const vpc = new ec2.Vpc(this, `Vpc-${currentRegion}`, {
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
});

// RDS with new writer and readers properties
const cluster = new rds.DatabaseCluster(this, `Cluster-${currentRegion}`, {
  vpc: vpc,
  writer: rds.ClusterInstance.provisioned('writer', {
    instanceType: ec2.InstanceType.of(
      ec2.InstanceClass.R6G,
      ec2.InstanceSize.XLARGE4
    ),
  }),
  readers: [
    rds.ClusterInstance.provisioned('reader1', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.R6G,
        ec2.InstanceSize.XLARGE4
      ),
    }),
    rds.ClusterInstance.provisioned('reader2', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.R6G,
        ec2.InstanceSize.XLARGE4
      ),
    }),
  ],
});

// DynamoDB with new pointInTimeRecoverySpecification
this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
  pointInTimeRecoverySpecification: {
    pointInTimeRecoveryEnabled: true,
  },
});

// Step Functions with new definitionBody property
this.stateMachine = new stepfunctions.StateMachine(
  this,
  'FailoverStateMachine',
  {
    definitionBody: stepfunctions.DefinitionBody.fromChainable(definition),
  }
);
```

**Impact**: Code fails to compile and generates warnings. Will break in next major CDK release.

---

### 2. **Deprecated Aurora MySQL Version**

**Issue**: Used Aurora MySQL 5.7 (version 2.10.2) which is deprecated and not available.

**MODEL_RESPONSE (Wrong)**:
```typescript
engine: rds.DatabaseClusterEngine.auroraMysql({
  version: rds.AuroraMysqlEngineVersion.VER_2_10_2,
}),
engineVersion: '5.7.mysql_aurora.2.10.2',
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
engine: rds.DatabaseClusterEngine.auroraMysql({
  version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
}),
// Uses Aurora MySQL 8.0 compatible version 3.x
```

**Impact**: Deployment fails with "Cannot find version 5.7.mysql_aurora.2.10.2 for aurora-mysql"

---

### 3. **Unsupported Aurora MySQL 8.0 Parameters**

**Issue**: Used Aurora MySQL 5.7 parameters that don't exist in MySQL 8.0.

**MODEL_RESPONSE (Wrong)**:
```typescript
parameters: {
  'aurora_binlog_replication_max_yield_seconds': '0',
  'aurora_enable_repl_bin_log_filtering': '0',
}
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
parameters: {
  innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
  max_connections: '5000',
  innodb_lock_wait_timeout: '5',
  binlog_format: 'ROW',
  // aurora_binlog_replication_max_yield_seconds: Not supported in MySQL 8.0
  // aurora_enable_repl_bin_log_filtering: Not supported in MySQL 8.0
}
```

**Impact**: Deployment fails with parameter validation errors.

---

### 4. **Backtrack Not Supported for Global Databases**

**Issue**: Enabled backtrack feature which is incompatible with Aurora Global Databases.

**MODEL_RESPONSE (Wrong)**:
```typescript
enableBacktrack: true,

if (props.enableBacktrack) {
  const cfnCluster = this.primaryCluster.node.defaultChild as rds.CfnDBCluster;
  cfnCluster.backtrackWindow = 72;
}
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
enableBacktrack: false, // Backtrack not supported for Global Databases
// Removed backtrack configuration code entirely
```

**Impact**: Deployment fails with "Backtrack is not supported for global databases"

---

### 5. **Missing ARM64 Architecture for Lambda Functions**

**Issue**: Lambda functions didn't specify ARM64 architecture, missing cost and performance optimization.

**MODEL_RESPONSE (Wrong)**:
```typescript
const chaosRunner = new lambda.Function(this, 'ChaosRunner', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  // No architecture specified - defaults to x86_64
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
const chaosRunner = new lambda.Function(this, 'ChaosRunner', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'index.handler',
  architecture: lambda.Architecture.ARM_64, // Graviton2 for better performance and cost
});
```

**Impact**: Higher costs and lower performance (Graviton2 offers ~20% better price-performance).

---

### 6. **Missing Environment Suffix Support**

**Issue**: No support for environment isolation (dev, staging, prod), causing resource name conflicts.

**MODEL_RESPONSE (Wrong)**:
```typescript
export interface TapStackProps extends cdk.StackProps {
  domainName: string;
  certificateArn: string;
  alertEmail: string;
  // No environmentSuffix
}

topicName: 'financial-app-global-alerts', // Hard-coded, no environment
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
export interface TapStackProps extends cdk.StackProps {
  domainName?: string;
  certificateArn?: string;
  alertEmail: string;
  environmentSuffix?: string; // Added for environment isolation
}

const environmentSuffix =
  props?.environmentSuffix ||
  this.node.tryGetContext('environmentSuffix') ||
  'dev';

topicName: `financial-app-alerts-${this.region}-${environmentSuffix}`,
```

**Impact**: Cannot deploy multiple environments (dev, staging, prod) to same account/region.

---

### 7. **Hard-Coded Non-Unique Resource Names**

**Issue**: Hard-coded resource names without region/environment context cause "AlreadyExists" errors.

**MODEL_RESPONSE (Wrong)**:
```typescript
// Global cluster ID - not unique across environments
globalClusterIdentifier: 'financial-app-global-cluster',

// SNS topic - not unique across regions/environments
topicName: 'financial-app-global-alerts',

// Dashboard - not unique across regions
dashboardName: 'financial-app-global-dr',

// State machine - not unique across regions
stateMachineName: 'financial-app-failover',

// Lambda functions - not unique across regions
functionName: 'financial-app-health-checker',
functionName: 'financial-app-chaos-runner',

// SSM parameter - not unique across regions
parameterName: '/financial-app/chaos-testing/enabled',

// KMS alias - not unique across regions
alias: 'financial-app-db-key',
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
// All resources include region and environment suffix
globalClusterIdentifier: `financial-app-global-cluster-${envSuffix}`,
topicName: `financial-app-alerts-${this.region}-${environmentSuffix}`,
dashboardName: `financial-app-dr-${this.region}-${environmentSuffix}`,
stateMachineName: `financial-app-failover-${stackRegion}-${envSuffix}`,
functionName: `financial-app-health-checker-${stackRegion}-${envSuffix}`,
functionName: `financial-app-chaos-runner-${stackRegion}-${envSuffix}`,
parameterName: `/financial-app/chaos-testing/enabled-${stackRegion}-${envSuffix}`,
alias: `financial-app-db-key-${currentRegion}-${envSuffix}`,
```

**Impact**: Multiple deployment failures with "AlreadyExists" errors for global cluster, SNS topics, dashboards, state machines, Lambda functions, and other resources.

---

### 8. **Incorrect Global Cluster Creation**

**Issue**: Global cluster created with conflicting properties and wrong pattern.

**MODEL_RESPONSE (Wrong)**:
```typescript
this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
  globalClusterIdentifier: 'financial-app-global-cluster',
  sourceDbClusterIdentifier: undefined, // Set later - WRONG PATTERN
  storageEncrypted: true,
  engine: 'aurora-mysql',
  engineVersion: '5.7.mysql_aurora.2.10.2',
});

// Later tries to update it
this.globalCluster.sourceDbClusterIdentifier = this.primaryCluster.clusterArn;
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
// Only create in primary region
if (isPrimaryRegion) {
  // When using sourceDbClusterIdentifier, engine properties are inherited
  this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
    globalClusterIdentifier: `financial-app-global-cluster-${envSuffix}`,
    sourceDbClusterIdentifier: cluster.clusterArn, // Set immediately
    // NO engine, engineVersion, storageEncrypted - they're inherited
  });
}
```

**Impact**: Deployment fails with "Properties validation failed" and "Global cluster already exists"

---

### 9. **Incorrect Multi-Region Deployment Pattern**

**Issue**: Attempted to create all regional resources in a single stack, which doesn't work for multi-region.

**MODEL_RESPONSE (Wrong)**:
```typescript
// Tries to create all regions in ONE stack
private deployRegionalInfrastructure(props: TapStackProps) {
  for (const region of REGIONS) {
    const regionalApi = new RegionalApi(this, `RegionalApi-${region}`, {
      region: region,
      // Creates resources in stack's region, not target region
    });
  }
}

// All secondary clusters created in primary region's VPCs
private createSecondaryClusters(regions: string[], encryptionKey: kms.IKey) {
  for (const region of regions) {
    const secondaryVpc = new ec2.Vpc(this, `SecondaryVpc-${region}`, {
      // Creates VPC in PRIMARY region, not secondary
    });
  }
}
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
// Each stack deploys only to ITS region
private deployRegionalInfrastructure(props: TapStackProps) {
  const regionalApi = new RegionalApi(this, `RegionalApi-${this.region}`, {
    region: this.region, // Only current stack's region
    isPrimary: this.region === PRIMARY_REGION,
  });
  this.regionalApis.set(this.region, regionalApi);
}

// Secondary clusters created in their own stacks
// Method removed as each regional stack creates its own cluster
```

**Impact**: All resources deployed to single region instead of distributed across regions. Complete architecture failure.

---

### 10. **Required Props Should Be Optional**

**Issue**: Domain name and certificate marked as required, preventing dev/test deployments.

**MODEL_RESPONSE (Wrong)**:
```typescript
export interface TapStackProps extends cdk.StackProps {
  domainName: string; // Required
  certificateArn: string; // Required
  alertEmail: string;
}

export interface RegionalApiProps {
  certificateArn: string; // Required
  domainName: string; // Required
}
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
export interface TapStackProps extends cdk.StackProps {
  domainName?: string; // Optional
  certificateArn?: string; // Optional
  alertEmail: string;
  environmentSuffix?: string;
}

export interface RegionalApiProps {
  certificateArn?: string; // Optional
  domainName?: string; // Optional
  environmentSuffix?: string;
}

// Conditional domain setup
if (props.domainName && props.certificateArn) {
  this.apiGatewayDomainName = new apigateway.DomainName(this, 'ApiDomain', {
    // ...
  });
}
```

**Impact**: Cannot deploy to dev/test environments without domain and certificate.

---

### 11. **Incorrect Lambda Asset Paths**

**Issue**: Lambda code paths pointed to root `lambda/` directory instead of `lib/lambda/`.

**MODEL_RESPONSE (Wrong)**:
```typescript
code: lambda.Code.fromAsset('lambda/transaction-processor'),
code: lambda.Code.fromAsset('lambda/health-checker'),
code: lambda.Code.fromAsset('lambda/promote-replica'),
code: lambda.Code.fromAsset('lambda/chaos-runner'),
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
code: lambda.Code.fromAsset('lib/lambda/transaction-processor'),
code: lambda.Code.fromAsset('lib/lambda/health-checker'),
code: lambda.Code.fromAsset('lib/lambda/promote-replica'),
code: lambda.Code.fromAsset('lib/lambda/chaos-runner'),
```

**Impact**: Lambda deployment fails with "Asset path not found"

---

### 12. **DynamoDB Replication Regions Include Current Region**

**Issue**: DynamoDB Global Table replicationRegions included the current region, which is invalid.

**MODEL_RESPONSE (Wrong)**:
```typescript
this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
  replicationRegions: props.isPrimary ? ['us-east-1', 'eu-west-1', 'ap-southeast-1'] : undefined,
  // Includes 'us-east-1' which might be the current region
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
  removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
  // replicationRegions: For production, enable global tables across regions
  // Must filter out current region from replicationRegions
});
```

**Impact**: Deployment fails with "ValidationError: replicationRegions cannot include the region where this stack is deployed"

---

### 13. **Missing Removal Policies for Dev/Test**

**Issue**: No removal policies set, making cleanup impossible in dev/test environments.

**MODEL_RESPONSE (Wrong)**:
```typescript
// No removal policies specified
this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
  // No removalPolicy
});

// No log group management
logRetention: logs.RetentionDays.ONE_WEEK,
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
this.sessionTable = new dynamodb.Table(this, 'SessionTable', {
  removalPolicy: cdk.RemovalPolicy.DESTROY, // For dev/test environments
});

// Explicit log group creation with removal policy
const transactionLogGroup = new logs.LogGroup(
  this,
  'TransactionProcessorLogGroup',
  {
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  }
);
```

**Impact**: Resources persist after stack deletion, causing cleanup issues and potential costs.

---

### 14. **Route53 Property Name Mismatch**

**Issue**: Used `healthCheckId` instead of `healthCheck` in Route53 RecordSet.

**MODEL_RESPONSE (Wrong)**:
```typescript
new route53.RecordSet(this, 'GlobalLatencyRouting', {
  healthCheckId: this.healthCheckSystem.getHealthCheckId(PRIMARY_REGION),
  // Wrong property name
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
// Property removed as healthCheck requires IHealthCheck interface, not ID
// Health checks handled separately via Route53.CfnHealthCheck
```

**Impact**: TypeScript compilation error: "Property 'healthCheckId' does not exist. Did you mean 'healthCheck'?"

---

### 15. **Incorrect Certificate Import**

**Issue**: Used non-existent `apigateway.Certificate` class instead of `certificatemanager.Certificate`.

**MODEL_RESPONSE (Wrong)**:
```typescript
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

certificate: apigateway.Certificate.fromCertificateArn(
  this,
  'Certificate',
  props.certificateArn
),
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';

certificate: certificatemanager.Certificate.fromCertificateArn(
  this,
  'Certificate',
  props.certificateArn
),
```

**Impact**: TypeScript error: "Property 'Certificate' does not exist on type apigateway"

---

### 16. **Missing Explicit Log Groups**

**Issue**: Used `logRetention` property which doesn't support RemovalPolicy.

**MODEL_RESPONSE (Wrong)**:
```typescript
const healthChecker = new lambda.Function(this, 'HealthChecker', {
  logRetention: logs.RetentionDays.ONE_WEEK,
  // Cannot apply RemovalPolicy to logRetention
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
const healthCheckerLogGroup = new logs.LogGroup(
  this,
  'HealthCheckerLogGroup',
  {
    logGroupName: `/aws/lambda/financial-app-health-checker-${stackRegion}-${envSuffix}`,
    retention: logs.RetentionDays.ONE_WEEK,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  }
);

const healthChecker = new lambda.Function(this, 'HealthChecker', {
  logGroup: healthCheckerLogGroup,
});
```

**Impact**: Log groups persist after deletion, and cannot set removal policies.

---

### 17. **No Region-Awareness in Resource Naming**

**Issue**: Resources not tagged with region, causing duplication errors in multi-region deployments.

**MODEL_RESPONSE (Wrong)**:
```typescript
// VPC name doesn't include region
const primaryVpc = new ec2.Vpc(this, 'PrimaryVpc', {});

// Database credentials without region
this.credentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
  // No region-specific naming
});

// Dashboard without region
dashboardName: 'financial-app-health',
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
// VPC includes region
const vpc = new ec2.Vpc(this, `Vpc-${currentRegion}`, {});

// Database credentials include region and environment
credentials: rds.Credentials.fromGeneratedSecret('admin', {
  secretName: `findb-${currentRegion}-${envSuffix}`,
});

// Dashboard includes region and environment
dashboardName: `financial-app-health-${stackRegion}-${envSuffix}`,
```

**Impact**: Resources conflict across regions, deployment fails with "already exists" errors.

---

### 18. **Missing Comprehensive Outputs**

**Issue**: No stack outputs for testing and integration.

**MODEL_RESPONSE (Wrong)**:
```typescript
// No outputs defined in stack
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
private outputApiEndpoints() {
  // API Gateway endpoints
  new cdk.CfnOutput(this, `${region}-ApiEndpoint`, {
    value: api.api.url,
    exportName: `${this.stackName}-${region}-api-endpoint`,
  });

  // API IDs
  new cdk.CfnOutput(this, `${region}-ApiId`, {
    value: api.api.restApiId,
  });

  // DynamoDB table names
  new cdk.CfnOutput(this, `${region}-SessionTableName`, {
    value: api.sessionTable.tableName,
  });

  // Lambda ARNs and names
  // Database endpoints, ports, secrets
  // Dashboard URLs
  // Region information
}
```

**Impact**: Difficult to test deployed infrastructure, no way to get resource identifiers.

---

### 19. **S3 Bucket Name Exceeds 63 Character Limit**

**Issue**: S3 bucket name too long, violating AWS 63-character limit.

**MODEL_RESPONSE (Wrong)**:
```typescript
bucketName: `financial-app-chaos-test-results-${cdk.Stack.of(this).account}`,
// Could exceed 63 characters with account ID
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
bucketName: `chaos-results-${stackRegion}-${envSuffix}-${cdk.Stack.of(this).account}`,
// Shortened prefix to stay under 63 characters
```

**Impact**: Deployment fails with S3 bucket name validation error.

---

### 20. **Missing S3 Module Import**

**Issue**: Used `cdk.aws_s3` instead of importing s3 module properly.

**MODEL_RESPONSE (Wrong)**:
```typescript
// No s3 import
const bucket = new cdk.aws_s3.Bucket(this, 'ChaosTestResults', {
  encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

new s3.Bucket(this, 'ChaosTestResults', {
  encryption: s3.BucketEncryption.S3_MANAGED,
});
```

**Impact**: TypeScript compilation error.

---

### 21. **Route53 Health Check Configuration Error**

**Issue**: Health check properties placed at wrong level in Route53.CfnHealthCheck.

**MODEL_RESPONSE (Wrong)**:
```typescript
const healthCheck = new route53.CfnHealthCheck(this, `HealthCheck-${region}`, {
  type: 'HTTPS', // Wrong level
  resourcePath: '/health',
  fullyQualifiedDomainName: api.apiGatewayDomainName.domainName,
  port: 443,
  requestInterval: 30,
  failureThreshold: 2,
  measureLatency: true,
  healthCheckConfig: {
    // Duplicate properties
    port: 443,
    type: 'HTTPS',
    // ...
  },
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
const healthCheck = new route53.CfnHealthCheck(
  this,
  `HealthCheck-${region}`,
  {
    healthCheckConfig: {
      port: 443,
      type: 'HTTPS',
      resourcePath: '/health',
      fullyQualifiedDomainName: api.apiGatewayDomainName.domainName,
      requestInterval: 30,
      failureThreshold: 2,
      measureLatency: true,
    },
  }
);
```

**Impact**: TypeScript error: "Object literal may only specify known properties, and 'type' does not exist"

---

### 22. **Lambda Reserved Concurrency Exceeds Limits**

**Issue**: Always reserved 1000 concurrency, exceeding account limits in dev/test.

**MODEL_RESPONSE (Wrong)**:
```typescript
this.transactionProcessor = new lambda.Function(this, 'TransactionProcessor', {
  reservedConcurrentExecutions: 1000, // Always reserved, even in dev
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
const envSuffix = props.environmentSuffix || 'dev';
const reservedConcurrency = envSuffix === 'prod' ? 1000 : undefined;

this.transactionProcessor = new lambda.Function(
  this,
  'TransactionProcessor',
  {
    reservedConcurrentExecutions: reservedConcurrency,
  }
);
```

**Impact**: Deployment fails in dev/test: "ReservedConcurrentExecutions decreases account's UnreservedConcurrentExecution below minimum"

---

### 23. **Missing currentRegion Parameter**

**Issue**: GlobalDatabase didn't know which region it was being deployed to.

**MODEL_RESPONSE (Wrong)**:
```typescript
export interface GlobalDatabaseProps {
  primaryRegion: string;
  secondaryRegions: string[];
  // No currentRegion
}

// No way to determine if this is primary or secondary region
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
export interface GlobalDatabaseProps {
  primaryRegion: string;
  secondaryRegions: string[];
  currentRegion?: string; // The region this stack is being deployed to
}

const currentRegion = props.currentRegion || cdk.Stack.of(this).region;
const isPrimaryRegion = currentRegion === props.primaryRegion;

// Only create global cluster in primary region
if (isPrimaryRegion) {
  this.globalCluster = new rds.CfnGlobalCluster(this, 'GlobalCluster', {
    // ...
  });
}
```

**Impact**: Global cluster created in every region, causing "AlreadyExists" errors.

---

### 24. **Health Check Return Type Mismatch**

**Issue**: getHealthCheckId() declared to return string but could return undefined.

**MODEL_RESPONSE (Wrong)**:
```typescript
public getHealthCheckId(region: string): string {
  return this.healthChecks.get(region)!.attrHealthCheckId;
  // Assumes health check always exists
}
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
public getHealthCheckId(region: string): string | undefined {
  const healthCheck = this.healthChecks.get(region);
  return healthCheck?.attrHealthCheckId;
}
```

**Impact**: Runtime errors when health check doesn't exist (e.g., no custom domain configured).

---

### 25. **Missing Environment Suffix in Interface Definitions**

**Issue**: Construct interfaces didn't include environmentSuffix parameter.

**MODEL_RESPONSE (Wrong)**:
```typescript
export interface GlobalDatabaseProps {
  // No environmentSuffix
}

export interface HealthCheckSystemProps {
  // No environmentSuffix  
}

export interface FailoverOrchestratorProps {
  // No environmentSuffix
}

export interface ChaosTestingSystemProps {
  // No environmentSuffix
}
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
export interface GlobalDatabaseProps {
  environmentSuffix?: string;
}

export interface HealthCheckSystemProps {
  environmentSuffix?: string;
}

export interface FailoverOrchestratorProps {
  environmentSuffix?: string;
}

export interface ChaosTestingSystemProps {
  environmentSuffix?: string;
}
```

**Impact**: Cannot pass environment context to constructs, all resources use default naming.

---

### 26. **Missing Conditional Logic for Optional Features**

**Issue**: Assumed all features always enabled (domain, hosted zone, etc.).

**MODEL_RESPONSE (Wrong)**:
```typescript
// Always sets up Route53
this.setupGlobalRouting(props.domainName);

// Always creates health checks with domain
const healthCheck = new route53.CfnHealthCheck(this, `HealthCheck-${region}`, {
  fullyQualifiedDomainName: api.apiGatewayDomainName.domainName,
  // Assumes domain always exists
});

// Always uses domain for health endpoint
apiEndpoint: `https://${api.apiGatewayDomainName.domainName}`,
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
// Conditional Route53 setup
if (props.domainName && props.certificateArn) {
  this.setupGlobalRouting(props.domainName);
} else {
  this.outputApiEndpoints();
}

// Conditional health check creation
if (api.apiGatewayDomainName) {
  const healthCheck = new route53.CfnHealthCheck(/*...*/);
}

// Fallback to API URL if no domain
const apiEndpoint = api.apiGatewayDomainName
  ? `https://${api.apiGatewayDomainName.domainName}`
  : api.api.url;
```

**Impact**: Runtime errors when optional features not configured, prevents dev/test deployments.

---

### 27. **Non-Deterministic Secret Names**

**Issue**: Database secret names not unique across regions, causing conflicts.

**MODEL_RESPONSE (Wrong)**:
```typescript
this.credentials = new secretsmanager.Secret(this, 'DatabaseCredentials', {
  // No specific secretName - auto-generated but not region-specific
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: 'admin' }),
    generateStringKey: 'password',
  },
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
credentials: rds.Credentials.fromGeneratedSecret('admin', {
  secretName: `findb-${currentRegion}-${envSuffix}`,
  // Unique per region and environment
}),
```

**Impact**: Secret name conflicts in multi-region deployments: "secret already exists"

---

### 28. **Creating Duplicate Parameter Groups**

**Issue**: Created new parameter group for each cluster instead of reusing.

**MODEL_RESPONSE (Wrong)**:
```typescript
this.primaryCluster = new rds.DatabaseCluster(this, 'PrimaryCluster', {
  parameterGroup: this.createParameterGroup(), // Creates one
});

const secondaryCluster = new rds.DatabaseCluster(this, `SecondaryCluster-${region}`, {
  parameterGroup: this.createParameterGroup(), // Creates another with same name!
});
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
// Create parameter group once as class property
this.parameterGroup = this.createParameterGroup();

// Reuse for all clusters
const cluster = new rds.DatabaseCluster(this, `Cluster-${currentRegion}`, {
  parameterGroup: this.parameterGroup,
});
```

**Impact**: Deployment fails: "Construct with name 'AuroraParameterGroup' already exists"

---

### 29. **Wrong Property Type Assignments**

**Issue**: Tried to assign to readonly metric properties.

**MODEL_RESPONSE (Wrong)**:
```typescript
export class RegionalApi extends Construct {
  public readonly latencyMetric: cloudwatch.Metric;
  
  private setupMetrics() {
    this.latencyMetric = new cloudwatch.Metric({ /*...*/ });
    // Assigning to readonly property
  }
}
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
export class RegionalApi extends Construct {
  public latencyMetric!: cloudwatch.Metric; // Definite assignment assertion
  
  private setupMetrics() {
    this.latencyMetric = new cloudwatch.Metric({ /*...*/ });
  }
}
```

**Impact**: TypeScript error: "Cannot assign to 'latencyMetric' because it is a read-only property"

---

### 30. **Missing Region Context in Global Dashboard**

**Issue**: Dashboard for replication lag assumed all regions, not region-specific deployment.

**MODEL_RESPONSE (Wrong)**:
```typescript
private createGlobalDashboard() {
  for (const region of REGIONS) {
    widgets.push(
      new cloudwatch.SingleValueWidget({
        title: `${region} - Database Replication Lag`,
        metrics: [this.globalDatabase.getReplicationLagMetric(region)],
      })
    );
  }
}
```

**IDEAL_RESPONSE (Fixed)**:
```typescript
private createGlobalDashboard() {
  for (const region of Array.from(this.regionalApis.keys())) {
    // Only regions deployed in THIS stack
    
    // Only add replication lag widget for secondary regions
    if (region !== PRIMARY_REGION) {
      const metric = this.globalDatabase.getReplicationLagMetric(region);
      if (metric) {
        widgets.push(/*...*/);
      }
    }
  }
}
```

**Impact**: Tries to access metrics for regions not deployed in current stack.
