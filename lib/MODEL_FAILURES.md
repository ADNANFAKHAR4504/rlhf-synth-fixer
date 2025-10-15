# Model Failures - Global REST API with AWS CDK

## Critical Failures (Task Non-Completion)

### 1. Missing Required Files
**Failure:** Model provides only 1 or 2 files instead of all 3 required files
- Omits `cdk.json`
- Omits `bin/tap.mjs`
- Only provides `lib/tap-stack.mjs`

**Impact:** Cannot run `cdk synth` or `cdk deploy`

**Example:**
```
Response only contains lib/tap-stack.mjs
Missing: bin/tap.mjs and cdk.json
```

### 2. Wrong File Extensions
**Failure:** Uses `.js` or `.ts` instead of `.mjs` files
- Creates `bin/tap.js` instead of `bin/tap.mjs`
- Uses TypeScript (`.ts`) when JavaScript was explicitly requested

**Impact:** ES module imports fail, code doesn't run

**Example:**
```javascript
// Wrong
bin/tap.js
lib/tap-stack.js

// Correct
bin/tap.mjs
lib/tap-stack.mjs
```

### 3. Missing Multi-Region Deployment
**Failure:** Only deploys to one region (usually us-east-1)
- Creates single stack instead of two
- No ap-south-1 deployment

**Impact:** Violates core requirement for global availability

**Example:**
```javascript
// Wrong - only one region
const stack = new TapStack(app, 'TapStack', {
  env: { region: 'us-east-1' }
});

// Correct - both regions
const usStack = new TapStack(app, 'TapStack-us-east-1', { ... });
const apStack = new TapStack(app, 'TapStack-ap-south-1', { ... });
```

### 4. No Provisioned Concurrency
**Failure:** Lambda functions without provisioned concurrency configuration
- Uses default Lambda without performance optimization
- Ignores "predictable performance" requirement

**Impact:** Cold starts cause latency spikes, fails requirement

**Example:**
```javascript
// Wrong - no provisioned concurrency
const fn = new lambda.Function(this, 'ApiFunction', { ... });

// Correct
const fn = new lambda.Function(this, 'ApiFunction', { ... });
const version = fn.currentVersion;
new lambda.Alias(this, 'Alias', {
  aliasName: 'prod',
  version,
  provisionedConcurrentExecutions: 50
});
```

### 5. Missing DynamoDB Global Table Replication
**Failure:** Creates separate DynamoDB tables in each region instead of Global Table
- Uses `new dynamodb.Table()` without `replicationRegions`
- No cross-region data synchronization

**Impact:** Data not synchronized across regions, violates consistency requirement

**Example:**
```javascript
// Wrong - separate tables
const table = new dynamodb.Table(this, 'Table', {
  tableName: `api-table-${region}` // Different tables
});

// Correct - Global Table
const table = new dynamodb.Table(this, 'GlobalTable', {
  tableName: 'global-api-table',
  replicationRegions: isPrimary ? ['ap-south-1'] : []
});
```

## Major Failures (Significant Requirements Missing)

### 6. Wrong API Gateway Endpoint Type
**Failure:** Uses Edge-Optimized instead of Regional
- Default `endpointTypes` is Edge-Optimized
- Doesn't explicitly set `REGIONAL`

**Impact:** Single CloudFront distribution, not true multi-region

**Example:**
```javascript
// Wrong
const api = new apigateway.RestApi(this, 'Api', {
  // endpointTypes defaults to EDGE
});

// Correct
const api = new apigateway.RestApi(this, 'Api', {
  endpointTypes: [apigateway.EndpointType.REGIONAL]
});
```

### 7. Missing Cross-Region S3 Replication
**Failure:** S3 buckets without cross-region replication configured
- Creates buckets but no CRR setup
- Missing replication role and permissions

**Impact:** Assets not replicated, single point of failure

### 8. Wrong WAF Scope
**Failure:** Uses `scope: 'CLOUDFRONT'` instead of `'REGIONAL'`
- WAF attached to wrong resource type
- Cannot associate with regional API Gateway

**Impact:** WAF protection not applied

**Example:**
```javascript
// Wrong
const waf = new wafv2.CfnWebACL(this, 'WAF', {
  scope: 'CLOUDFRONT' // For CloudFront only
});

// Correct
const waf = new wafv2.CfnWebACL(this, 'WAF', {
  scope: 'REGIONAL' // For regional resources
});
```

### 9. Missing CloudWatch Synthetics Canaries
**Failure:** No synthetic monitoring configured
- Only uses CloudWatch Alarms
- No proactive health checks

**Impact:** Cannot monitor uptime globally, violates monitoring requirement

### 10. No Encryption Configuration
**Failure:** Uses default encryption or no encryption
- DynamoDB without customer-managed keys
- S3 without KMS encryption
- No encryption at rest

**Impact:** Fails security and compliance requirements

### 11. Missing EventBridge Cross-Region Distribution
**Failure:** No EventBridge setup or no cross-region rules
- Creates event bus but no forwarding
- No event distribution architecture

**Impact:** Events not distributed across regions

### 12. No Route 53 Latency-Based Routing
**Failure:** Missing Route 53 configuration entirely
- No custom domain setup
- No failover mechanism
- Direct API Gateway URLs only

**Impact:** No intelligent routing, poor user experience

## Moderate Failures (Incomplete Implementation)

### 13. Missing IAM Least-Privilege
**Failure:** Overly permissive IAM policies
- Grants `*` permissions
- Uses `AmazonDynamoDBFullAccess` instead of specific grants
- No resource-level restrictions

**Example:**
```javascript
// Wrong
role.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess')
);

// Correct
table.grantReadWriteData(role);
```

### 14. Missing Resource Tagging
**Failure:** No tags or incomplete tagging
- Missing GDPR compliance tags
- No ownership or environment tags
- Inconsistent tagging across resources

**Impact:** Cannot track resources, compliance issues

### 15. No Log Retention Policy
**Failure:** Lambda and API Gateway logs without retention
- Logs kept indefinitely (expensive)
- No log management strategy

**Example:**
```javascript
// Wrong
const fn = new lambda.Function(this, 'Fn', { ... });

// Correct
const fn = new lambda.Function(this, 'Fn', {
  logRetention: logs.RetentionDays.TWO_WEEKS
});
```

### 16. Missing CloudWatch Dashboard
**Failure:** No dashboard or incomplete metrics
- Only creates alarms
- No operational visibility

### 17. No Point-in-Time Recovery
**Failure:** DynamoDB table without PITR
- Missing `pointInTimeRecovery: true`

**Impact:** Cannot recover from data corruption or accidental deletion

### 18. Incorrect Stack Dependencies
**Failure:** No dependency between primary and secondary stacks
- Secondary stack tries to replicate before primary exists
- DynamoDB Global Table creation fails

**Example:**
```javascript
// Wrong
const primary = new TapStack(app, 'Primary', { ... });
const secondary = new TapStack(app, 'Secondary', { ... });
// No dependency

// Correct
const primary = new TapStack(app, 'Primary', { ... });
const secondary = new TapStack(app, 'Secondary', { ... });
secondary.addDependency(primary);
```

### 19. Missing Health Checks
**Failure:** Route 53 latency routing without health checks
- No automatic failover on region failure
- Manual intervention required

### 20. No X-Ray Tracing
**Failure:** Lambda functions without X-Ray tracing enabled
- Cannot debug distributed system
- No performance insights

## Minor Failures (Best Practices)

### 21. Hardcoded Values
**Failure:** Region names, account IDs, or resource names hardcoded
- Not using `this.region` or `this.account`
- Brittle code that breaks in different environments

### 22. No CfnOutputs
**Failure:** Missing stack outputs for important resources
- API endpoint URL not exported
- Table names not exported
- Hard to integrate with other systems

### 23. Poor Resource Naming
**Failure:** Generic or inconsistent names
- All resources named 'Resource1', 'Resource2'
- No region identifiers in names
- Name collisions across regions

### 24. Missing Removal Policies
**Failure:** No `removalPolicy` specified for stateful resources
- DynamoDB tables deleted on stack deletion
- Data loss risk

**Example:**
```javascript
// Wrong
const table = new dynamodb.Table(this, 'Table', { ... });

// Correct
const table = new dynamodb.Table(this, 'Table', {
  removalPolicy: RemovalPolicy.RETAIN
});
```

### 25. No S3 Bucket Lifecycle Policies
**Failure:** S3 buckets without lifecycle management
- Backup bucket without Glacier transition
- No expiration policies
- High storage costs

### 26. Missing CORS Configuration
**Failure:** API Gateway without CORS headers
- Frontend cannot call API
- Browser blocks requests

### 27. No SSL Enforcement
**Failure:** S3 buckets allow HTTP access
- Missing `enforceSSL: true`
- Security vulnerability

### 28. Incomplete WAF Rules
**Failure:** Only CommonRuleSet, missing SQLiRuleSet or XSS protection
- Partial security coverage
- Vulnerable to specific attacks

### 29. No API Gateway Logging
**Failure:** API Gateway stage without logging enabled
- Cannot debug production issues
- No audit trail

**Example:**
```javascript
// Wrong
const api = new apigateway.RestApi(this, 'Api', {
  deployOptions: { stageName: 'prod' }
});

// Correct
const api = new apigateway.RestApi(this, 'Api', {
  deployOptions: {
    stageName: 'prod',
    loggingLevel: apigateway.MethodLoggingLevel.INFO,
    dataTraceEnabled: true,
    metricsEnabled: true
  }
});
```

### 30. Missing KMS Key Rotation
**Failure:** KMS keys without automatic rotation
- Security best practice violation
- Manual key rotation required

## Syntax and Code Quality Issues

### 31. Import/Export Syntax Errors
**Failure:** Mixing CommonJS and ES modules
- `require()` in .mjs files
- `module.exports` instead of `export`

### 32. Missing Shebang
**Failure:** `bin/tap.mjs` without `#!/usr/bin/env node`
- Cannot execute directly
- Not marked as executable

### 33. Async/Await Misuse
**Failure:** Lambda handler not async or improper Promise handling
- Unhandled promise rejections
- Race conditions

### 34. Undefined Variables
**Failure:** Referencing `isPrimary` or `otherRegion` without passing in props
- Runtime errors
- Stack creation fails

### 35. Circular Dependencies
**Failure:** Resources referencing each other incorrectly
- CloudFormation circular dependency error
- Deployment fails

### 36. Incorrect CDK Imports
**Failure:** Importing from wrong packages
- `import { Stack } from '@aws-cdk/core'` (v1) instead of `aws-cdk-lib` (v2)
- Version mismatch

### 37. Lambda Code Path Issues
**Failure:** `Code.fromAsset('lambda')` but no explanation that directory must exist
- Stack synth succeeds but deployment fails
- Misleading error messages

### 38. Type Errors in JavaScript
**Failure:** Passing wrong types to CDK constructs
- String instead of Duration
- Number instead of enum value

## Conceptual Misunderstandings

### 39. Active-Passive Instead of Active-Active
**Failure:** Implements failover routing instead of latency-based
- All traffic goes to primary
- Secondary only used on failure
- Not utilizing multi-region for performance

### 40. Edge Locations Confusion
**Failure:** Thinks Edge-Optimized API Gateway = Multi-region
- CloudFront edge locations ≠ regional deployments
- Single origin, not true multi-region

### 41. Global Table Misconception
**Failure:** Creates Global Table in both regions instead of only primary
- `replicationRegions` specified in both stacks
- Conflicting configurations

### 42. S3 Replication Direction
**Failure:** Configures replication in secondary region
- Replication must be configured in source bucket
- Destination referenced, not configured

### 43. WAF Regional vs Global
**Failure:** Creates one WAF and tries to use in both regions
- WAF is regional resource
- Must create separate WAF per region

### 44. Route 53 Routing Policy
**Failure:** Uses Weighted or Geolocation instead of Latency
- Not optimizing for user latency
- Wrong routing strategy

### 45. QuickSight Integration
**Failure:** Creates QuickSight resources with CDK
- QuickSight largely manual setup
- CDK support limited
- Should reference or document setup, not implement

## Validation and Testing Gaps

### 46. No Error Handling
**Failure:** Code assumes everything succeeds
- No try-catch blocks
- No validation of inputs
- Fails on edge cases

### 47. Missing Prerequisite Documentation
**Failure:** Code requires hosted zone but doesn't mention it
- User cannot deploy without setup
- No troubleshooting guidance

### 48. No Rollback Strategy
**Failure:** No mention of how to handle failed deployments
- Stateful resources orphaned
- Manual cleanup required

### 49. Incomplete Testing Strategy
**Failure:** No mention of how to validate deployment
- No smoke tests
- No integration test guidance

### 50. Missing Cost Considerations
**Failure:** No mention of costs
- Provisioned concurrency expensive
- Global Tables have cross-region replication costs
- User surprised by bill

## Summary of Most Common Failures

**Top 10 Critical Issues:**
1. Missing multi-region deployment
2. No provisioned concurrency
3. Wrong API Gateway endpoint type (Edge vs Regional)
4. No DynamoDB Global Table replication
5. Missing cross-region S3 replication
6. Wrong WAF scope
7. No CloudWatch Synthetics
8. Missing encryption configuration
9. No Route 53 latency routing
10. Incorrect stack dependencies

**Quick Detection:**
- Count files: should be exactly 3
- Check extensions: must be `.mjs`
- Grep for `replicationRegions`: must exist
- Grep for `provisionedConcurrentExecutions`: must exist
- Grep for `REGIONAL`: must exist for API Gateway and WAF
- Check for both region names: us-east-1 and ap-south-1

**Red Flags:**
- "Edge-Optimized" anywhere in code
- Only one stack creation
- No `isPrimary` logic
- Missing `@aws-sdk/client-*` for Lambda code
- No cross-region references
- Single DynamoDB table without replication