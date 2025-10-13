# Lessons Learned - IaC Synthetic Task Generation

This document contains common patterns, failures, and solutions discovered during synthetic task generation. Reference this before starting tasks to avoid known pitfalls and reduce deployment attempts.

## Common Deployment Failures & Quick Fixes

### 1. Lambda Reserved Concurrency Issues

**Symptom**: `Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [10]`

**Root Cause**: Setting `reservedConcurrentExecutions` too high or when account has limited capacity

**Quick Fix**:
- Remove `reservedConcurrentExecutions` parameter entirely (use default unreserved pool)
- If required, set to a low value (1-5) and verify account limits first

**Applies to**: CDK, CDKTF, CloudFormation, Pulumi, Terraform

---

### 2. Lambda Runtime - AWS SDK Missing

**Symptom**: `Runtime.ImportModuleError: Error: Cannot find module 'aws-sdk'`

**Root Cause**: AWS SDK v2 not available in Node.js 18.x+ runtimes

**Quick Fix**:
- For Node.js 18.x+: Use AWS SDK v3 (`@aws-sdk/client-*`) or extract data from event object
- For Node.js 16.x: AWS SDK v2 available by default
- Better: Avoid SDK dependency when event data contains all needed information

**Example**:
```javascript
// DON'T (Node.js 18+)
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

// DO (extract from event)
const bucket = event.Records[0].s3.bucket.name;
const key = event.Records[0].s3.object.key;
```

---

### 3. Hardcoded Environment Suffixes

**Symptom**: Resource conflicts, deployment failures in CI/CD with "already exists" errors

**Root Cause**: Resource names without `environmentSuffix` cause collisions across parallel deployments

**Quick Fix**:
- ALL resource names must include `environmentSuffix` or `environment_suffix`
- Pattern: `resourceName-${environmentSuffix}` or `resourceName-${props.environmentSuffix}`

**Check with**: `bash scripts/pre-validate-iac.sh`

---

### 4. S3 Bucket Deletion Failures

**Symptom**: Stack deletion fails with "Bucket must be empty" error

**Root Cause**: S3 buckets with objects cannot be deleted

**Quick Fix**:
- CDK: Set `autoDeleteObjects: true` and `removalPolicy: RemovalPolicy.DESTROY`
- CloudFormation: Add Lambda custom resource to empty bucket before deletion
- Terraform: Use `force_destroy = true`

**CRITICAL**: All synthetic tasks MUST create destroyable resources

---

### 5. RDS Multi-AZ Deployment Time

**Symptom**: Deployments take 20-30+ minutes, often timeout

**Root Cause**: RDS Multi-AZ and non-serverless instances are slow to provision

**Quick Fix**:
- Prefer Aurora Serverless v2 (faster provisioning, auto-scaling)
- If Multi-AZ required, mention in PROMPT.md and increase timeouts
- Use `backup_retention_period = 1` (minimum) for faster creation
- Set `skip_final_snapshot = true` for destroyability

---

### 6. NAT Gateway Costs

**Symptom**: High AWS costs from synthetic tasks

**Root Cause**: NAT Gateways cost ~$0.045/hour (~$32/month) each

**Quick Fix**:
- Prefer VPC Endpoints (S3, DynamoDB, etc.) - free for most services
- If NAT required, create only 1 (not per AZ) for synthetic tasks
- Document in PROMPT.md when NAT is truly necessary

---

## Resource Naming Patterns

### Standard Format
```
{resource-type}-{environment-suffix}
```

### CDK/CDKTF TypeScript
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  bucketName: `data-bucket-${environmentSuffix}`,
  // ...
});
```

### CDK/Pulumi Python
```python
bucket = s3.Bucket(
    "data_bucket",
    bucket_name=f"data-bucket-{environment_suffix}",
    # ...
)
```

### CloudFormation YAML
```yaml
Resources:
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'data-bucket-${EnvironmentSuffix}'
```

### Terraform HCL
```hcl
resource "aws_s3_bucket" "data_bucket" {
  bucket = "data-bucket-${var.environment_suffix}"
}
```

---

## Region-Specific Configurations

### Default Region
- Use `us-east-1` unless specified in `lib/AWS_REGION`
- Always check for `lib/AWS_REGION` file first

### Multi-Region Tasks
- Verify regions in task description match actual deployment regions
- Common mismatch: task says "us-east-1 and eu-west-1" but code uses different regions
- Cross-region references require explicit ARNs or exports

### Region-Specific Service Availability
- Not all services available in all regions
- Check AWS docs for service regional endpoints
- Common issues: SageMaker features, specific instance types

---

## Platform-Specific Best Practices

### CDK (TypeScript/Python/Java)

**Pattern**: Constructs not Stacks
```typescript
// GOOD: Use Constructs for modularity
export class NetworkingStack extends Construct {
  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);
    // ...
  }
}

// AVOID: Multiple Stack classes create complex cross-stack references
export class NetworkingStack extends cdk.Stack { }
```

**Entry Point**: Single TapStack orchestrator
- `bin/tap.ts` instantiates TapStack
- TapStack instantiates all Constructs
- Maintains clean dependency management

**Common Mistakes**:
- Creating resources directly in TapStack (use separate Constructs)
- Modifying bin/ directory entry point unnecessarily
- Not using `this` as parent for nested stacks

---

### CDKTF (TypeScript/Python)

**Pattern**: Similar to CDK but with Terraform constructs

**Watch Out For**:
- Provider configuration must be explicit
- State management differs from CDK
- Cross-stack references use Terraform data sources

---

### CloudFormation (YAML/JSON)

**Nested Stacks**: Keep logical separation
```yaml
Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: !Sub 'https://s3.amazonaws.com/templates/network.yaml'
      Parameters:
        EnvironmentSuffix: !Ref EnvironmentSuffix
```

**Common Issues**:
- Circular dependencies between stacks
- Missing `DependsOn` for resource ordering
- Forgetting to pass EnvironmentSuffix to nested stacks

---

### Terraform (HCL)

**Module Structure**: Use modules for reusability
```hcl
module "networking" {
  source              = "./modules/networking"
  environment_suffix  = var.environment_suffix
}
```

**State Management**:
- Always configure remote state (S3 + DynamoDB)
- Use workspace isolation or separate state files per environment

**Common Issues**:
- Not using `depends_on` for implicit dependencies
- Incorrect variable interpolation
- Missing provider version constraints

---

### Pulumi (TypeScript/Python/Java/Go)

**Stack Exports**: Use outputs for cross-stack references
```typescript
export const vpcId = vpc.id;
```

**Config Management**:
- Use Pulumi config for environment-specific values
- Don't hardcode stack names

**Common Issues**:
- Stack naming conflicts
- Not using `apply()` for output values
- Incorrect resource options (parent, dependsOn)

---

## Testing Patterns

### Unit Tests

**Coverage Requirements**: 90%+ statements

**Common Patterns**:
```typescript
// CDK - Snapshot testing
expect(template.toJSON()).toMatchSnapshot();

// Resource count
template.resourceCountIs('AWS::S3::Bucket', 1);

// Property testing
template.hasResourceProperties('AWS::S3::Bucket', {
  BucketEncryption: Match.objectLike({
    ServerSideEncryptionConfiguration: Match.anyValue()
  })
});
```

**Watch Out For**:
- Don't test hardcoded environmentSuffix values
- Use flexible matchers for arrays vs objects
- Account for singleton resources (log retention Lambdas)

---

### Integration Tests

**Use Real Outputs**: Load from `cfn-outputs/flat-outputs.json`

```typescript
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Test with actual deployed resources
const bucketName = outputs.S3BucketName;
```

**Assertions**:
- Test complete workflows, not just individual resources
- Verify resource connectivity and permissions
- No mocking - use real AWS SDK calls

---

## Cost Optimization Patterns

### Prefer Serverless
- Lambda over EC2
- Aurora Serverless over provisioned RDS
- DynamoDB on-demand over provisioned
- S3 over EBS for object storage
- API Gateway over ALB for APIs

### Avoid Expensive Resources
- NAT Gateways (~$32/month each)
- RDS Multi-AZ non-serverless (~$350+/month)
- Large EC2 instances
- Provisioned IOPS volumes
- Multiple Availability Zones (when 1 AZ sufficient for synthetic tasks)

### Use Lifecycle Policies
- S3: Transition to IA/Glacier
- CloudWatch Logs: Set retention periods (7-14 days for synthetic)
- DynamoDB: Enable TTL for automatic cleanup

---

## Security Best Practices

### IAM Least Privilege
```typescript
// GOOD: Specific permissions
{
  actions: ['s3:GetObject', 's3:PutObject'],
  resources: [bucket.arnForObjects('*')]
}

// AVOID: Overly broad
{
  actions: ['s3:*'],
  resources: ['*']
}
```

### Encryption
- S3: Enable `SSE-S3` or `SSE-KMS` (prefer SSE-S3 for simplicity)
- RDS: Enable encryption at rest
- DynamoDB: Encryption enabled by default
- Lambda environment variables: Use KMS when storing secrets

### Secrets Management
- Use AWS Secrets Manager or SSM Parameter Store (secure string)
- Never hardcode secrets in code
- Rotate credentials regularly

---

## When to Update This Document

Add entries when you discover:
1. A failure pattern that repeats across tasks
2. A solution that saves deployment attempts
3. Platform-specific quirks not in AWS docs
4. Cost optimization opportunities
5. Security anti-patterns to avoid

**Format**: Problem → Root Cause → Quick Fix → Example (when helpful)

---

## Quick Reference Commands

**Pre-validate before deployment**:
```bash
bash scripts/pre-validate-iac.sh
```

**Check resource naming**:
```bash
grep -rni "environmentSuffix" lib/
```

**Find hardcoded values**:
```bash
grep -rniE "(prod-|dev-|stage-)" lib/
```

**Verify destroyability**:
```bash
grep -rni "RETAIN\|DeletionPolicy.*Retain\|deletion_protection.*true" lib/
```

---

*Last Updated: 2025-10-13*
*This document is maintained by the task-coordinator and updated after each task completion.*

