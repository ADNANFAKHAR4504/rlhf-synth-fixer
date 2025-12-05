# Model Failures and Corrections

This document describes the initial issues in the MODEL_RESPONSE and how they were corrected to produce the ideal implementation.

## CRITICAL Failure 1: Aurora PostgreSQL Engine Version

**Severity:** CRITICAL - Blocks deployment

**What Was Wrong:**
```typescript
const globalCluster = new aws.rds.GlobalCluster(`aurora-global-${environmentSuffix}`, {
  engine: 'aurora-postgresql',
  engineVersion: '15.4',  // WRONG - Does not support global database
});
```

**Error Message:**
```
creating RDS Global Cluster: operation error RDS: CreateGlobalCluster,
api error InvalidParameterValue: The requested engine version was not found
or does not support global functionality
```

**How It Was Fixed:**
```typescript
const globalCluster = new aws.rds.GlobalCluster(`aurora-global-${environmentSuffix}`, {
  engine: 'aurora-postgresql',
  engineVersion: '14.6',  // CORRECTED - Supports global database
});
```

**Why It Matters:**
- Aurora PostgreSQL 15.4 does NOT support global database functionality
- AWS only supports specific versions for Aurora Global Database
- Supported versions include 14.6, 14.7 for PostgreSQL
- This error blocks the entire RDS infrastructure deployment

**Prevention:**
- Always verify engine version compatibility in AWS documentation
- Check https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-global-database.html

---

## CRITICAL Failure 2: Route 53 Reserved Domain Name

**Severity:** CRITICAL - Blocks deployment

**What Was Wrong:**
```typescript
const hostedZone = new aws.route53.Zone(`dr-zone-${environmentSuffix}`, {
  name: `dr-${environmentSuffix}.example.com`,  // WRONG - Reserved by AWS
});
```

**Error Message:**
```
creating Route53 Hosted Zone: operation error Route 53: CreateHostedZone,
InvalidDomainName: dr-synths7r8s6p6.example.com is reserved by AWS!
```

**How It Was Fixed:**
```typescript
const hostedZone = new aws.route53.Zone(`dr-zone-${environmentSuffix}`, {
  name: `dr-${environmentSuffix}.internal`,  // CORRECTED - Non-reserved domain
});
```

**Why It Matters:**
- AWS reserves example.com, example.net, example.org domains
- Cannot create Route53 hosted zones with these domains
- Affects DNS-based failover configuration

**Prevention:**
- Use .internal, .local, or organization-owned domains
- Never use example.com in production IaC code

---

## CRITICAL Failure 3: DynamoDB Global Table KMS Key

**Severity:** CRITICAL - Blocks deployment

**What Was Wrong:**
```typescript
const dynamoTable = new aws.dynamodb.Table(`session-table-${environmentSuffix}`, {
  replicas: [{ regionName: 'us-west-2' }],  // WRONG - Missing kmsKeyArn
  serverSideEncryption: { enabled: true, kmsKeyArn: primaryKmsKey.arn },
});
```

**Error Message:**
```
creating AWS DynamoDB Table: replicas: creating replica (us-west-2):
api error ValidationException: One or more parameter values were invalid:
KMSMasterKeyId must be specified for each replica
```

**How It Was Fixed:**
```typescript
const dynamoTable = new aws.dynamodb.Table(`session-table-${environmentSuffix}`, {
  replicas: [{ regionName: 'us-west-2', kmsKeyArn: drKmsKey.arn }],  // CORRECTED
  serverSideEncryption: { enabled: true, kmsKeyArn: primaryKmsKey.arn },
});
```

**Why It Matters:**
- When using KMS encryption with DynamoDB global tables, each replica needs its own KMS key
- The replica KMS key must be in the replica's region (us-west-2)
- Cannot use the primary region's KMS key for replicas

**Prevention:**
- Create region-specific KMS keys for each region in multi-region deployments
- Always specify kmsKeyArn in replica configurations when using SSE with KMS

---

## Failure 4: Incorrect Route 53 Health Check Property

**What Was Wrong:**
```typescript
const primaryHealthCheck = new aws.route53.HealthCheck(`primary-hc-${environmentSuffix}`, {
  type: 'HTTPS',
  resourcePath: '/',
  fullyQualifiedDomainName: primaryHealthUrl.functionUrl.apply(...),  // WRONG PROPERTY NAME
  port: 443,
  ...
});
```

**The Issue:**
The Pulumi AWS Route 53 HealthCheck resource uses `fqdn` as the property name, not `fullyQualifiedDomainName`. This caused TypeScript compilation errors.

**Error Message:**
```
error TS2353: Object literal may only specify known properties, and 'fullyQualifiedDomainName' does not exist in type 'HealthCheckArgs'.
```

**How It Was Fixed:**
```typescript
const primaryHealthCheck = new aws.route53.HealthCheck(`primary-hc-${environmentSuffix}`, {
  type: 'HTTPS',
  resourcePath: '/',
  fqdn: primaryHealthUrl.functionUrl.apply(...),  // CORRECTED PROPERTY NAME
  port: 443,
  ...
});
```

**Why It Matters:**
- Property names must match the Pulumi AWS provider's TypeScript definitions
- Using incorrect property names causes compilation failures
- The code won't deploy until this is fixed

**Prevention:**
- Always consult the Pulumi AWS provider documentation
- Use TypeScript's type checking during development
- Run `npm run build` to catch these errors early

## Potential Failure 2: Missing environmentSuffix in bin/tap.ts

**What Could Go Wrong:**
If `bin/tap.ts` doesn't pass the `environmentSuffix` parameter to TapStack, resources won't include the suffix and will fail uniqueness requirements.

**Correct Implementation:**
```typescript
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('dr-infrastructure', {
  environmentSuffix,  // CRITICAL: Must pass this
  tags: defaultTags,
});
```

**Why It Matters:**
- All resources require unique names
- Multiple deployments (CI/CD) need different suffixes
- Without suffix, deployments will conflict

## Potential Failure 3: Aurora Global Cluster Dependency

**What Could Go Wrong:**
If the DR cluster doesn't explicitly depend on the primary cluster, Pulumi might try to create them in parallel, causing the global cluster setup to fail.

**Correct Implementation:**
```typescript
const drCluster = new aws.rds.Cluster(`dr-cluster-${environmentSuffix}`, {
  // ...
}, {
  provider: drProvider,
  parent: this,
  dependsOn: [primaryCluster]  // CRITICAL: Explicit dependency
});
```

**Why It Matters:**
- Aurora Global Database requires primary cluster to be operational first
- Parallel creation causes race conditions
- Deployment fails without proper dependency ordering

## Potential Failure 4: S3 Replication Role Policy Timing

**What Could Go Wrong:**
If the S3 replication starts before the IAM role policy is attached, replication fails silently or with access denied errors.

**Correct Implementation:**
```typescript
const replPolicy = new aws.iam.RolePolicy(`s3-repl-policy-${environmentSuffix}`, {
  role: replRole.id,
  policy: ...,
}, { provider: primaryProvider, parent: this });

const primaryBucket = new aws.s3.Bucket(`artifacts-primary-${environmentSuffix}`, {
  // ...
  replicationConfiguration: { ... },
}, {
  provider: primaryProvider,
  parent: this,
  dependsOn: [replPolicy, drBucket]  // CRITICAL: Wait for policy
});
```

**Why It Matters:**
- IAM policies need time to propagate
- S3 validates replication configuration at creation time
- Without dependency, replication setup fails

## Potential Failure 5: Lambda VPC Configuration Without Private Subnets

**What Could Go Wrong:**
If Lambda functions are placed in public subnets or without proper security groups, they can't access RDS in private subnets.

**Correct Implementation:**
```typescript
const primaryTxnLambda = new aws.lambda.Function(`primary-txn-${environmentSuffix}`, {
  // ...
  vpcConfig: {
    subnetIds: primaryPrivateSubnets.map(s => s.id),  // CRITICAL: Private subnets
    securityGroupIds: [primaryLambdaSg.id],           // CRITICAL: Proper SG
  },
  // ...
});
```

**Why It Matters:**
- RDS is in private subnets for security
- Lambda needs to be in same VPC to access RDS
- Security groups must allow communication

## Potential Failure 6: ALB Target Group Lambda Permission

**What Could Go Wrong:**
Without explicit Lambda permission for ALB invocation, the ALB can't invoke the Lambda function even though it's in the target group.

**Correct Implementation:**
```typescript
new aws.lambda.Permission(`primary-lambda-perm-${environmentSuffix}`, {
  action: 'lambda:InvokeFunction',
  function: primaryTxnLambda.name,
  principal: 'elasticloadbalancing.amazonaws.com',
  sourceArn: primaryTg.arn,  // CRITICAL: Must specify source
}, { provider: primaryProvider, parent: this });
```

**Why It Matters:**
- Lambda resource policy controls invocation permissions
- ALB is a separate service requiring explicit permission
- Without this, requests return 502 errors

## Common Patterns for Success

### 1. Always Use environmentSuffix
```typescript
// GOOD
const resource = new aws.service.Resource(`name-${environmentSuffix}`, {
  name: `name-${environmentSuffix}`,
});

// BAD
const resource = new aws.service.Resource('name-prod', {
  name: 'name-prod',
});
```

### 2. Explicit Dependencies for Complex Resources
```typescript
// GOOD
const secondary = new Resource('secondary', {
  // ...
}, { dependsOn: [primary] });

// BAD - relies on implicit dependency
const secondary = new Resource('secondary', {
  relatedId: primary.id,  // Implicit dependency might not be enough
});
```

### 3. Proper Provider Assignment
```typescript
// GOOD
const drResource = new aws.service.Resource('dr-resource', {
  // ...
}, { provider: drProvider });  // Explicit region assignment

// BAD - uses default provider
const drResource = new aws.service.Resource('dr-resource', {
  region: 'us-west-2',  // This might not work for all resources
});
```

### 4. Security Group Ingress Rules
```typescript
// GOOD - allows VPC CIDR
ingress: [{
  protocol: 'tcp',
  fromPort: 5432,
  toPort: 5432,
  cidrBlocks: ['10.0.0.0/16']  // VPC CIDR
}]

// BAD - overly permissive
ingress: [{
  protocol: 'tcp',
  fromPort: 5432,
  toPort: 5432,
  cidrBlocks: ['0.0.0.0/0']  // Don't expose database to internet!
}]
```

### 5. Destroyability Configuration
```typescript
// GOOD
const cluster = new aws.rds.Cluster('cluster', {
  skipFinalSnapshot: true,      // Allows destroy
  deletionProtection: false,    // Allows destroy
  backupRetentionPeriod: 1,     // Minimum required
});

// BAD
const cluster = new aws.rds.Cluster('cluster', {
  skipFinalSnapshot: false,     // Blocks destroy
  deletionProtection: true,     // Blocks destroy
  backupRetentionPeriod: 7,     // Unnecessarily long for testing
});
```

## Lessons Learned

1. **Property Names Matter**: Always verify property names in TypeScript definitions
2. **Dependencies Are Critical**: Explicit dependencies prevent race conditions
3. **VPC Networking**: Lambda and RDS must be in compatible subnets
4. **Permissions Are Explicit**: AWS requires explicit permissions for cross-service access
5. **Multi-Region Complexity**: Providers must be correctly assigned to each resource
6. **Testing Is Essential**: Compile and validate before deploying

## Testing Checklist

- [ ] Code compiles without errors (`npm run build`)
- [ ] Lint passes without warnings (`npm run lint`)
- [ ] Synth succeeds (`npm run synth`)
- [ ] All resources include environmentSuffix
- [ ] RDS clusters have skipFinalSnapshot: true
- [ ] Lambda functions in correct subnets
- [ ] Security groups allow required traffic
- [ ] IAM policies follow least-privilege
- [ ] Dependencies explicitly defined
- [ ] Multi-region providers correctly assigned
