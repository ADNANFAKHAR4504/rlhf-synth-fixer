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

## Deployment Success Checklist (Reference During Code Generation)

**Before generating code, ensure PROMPT.md includes**:

- [ ] environmentSuffix requirement for ALL named resources
- [ ] Destroyability requirement (no Retain policies)
- [ ] GuardDuty warning (if GuardDuty mentioned)
- [ ] AWS Config IAM policy requirement (if Config mentioned)
- [ ] Lambda Node.js 18+ SDK warning (if Lambda mentioned)
- [ ] CloudWatch Synthetics runtime version (if Synthetics mentioned)
- [ ] RDS destroyability settings (if RDS mentioned)
- [ ] NAT Gateway cost warning (if NAT mentioned)

**After code generation, verify**:

- [ ] All resource names include environmentSuffix
- [ ] No RemovalPolicy.RETAIN found
- [ ] No deletionProtection: true found
- [ ] No deprecated AWS service versions
- [ ] No GuardDuty detector creation
- [ ] AWS Config uses correct IAM policy
- [ ] Lambda functions compatible with Node.js 18+
- [ ] No hardcoded environment values

**Before deployment attempt, run code analysis**:

- [ ] Scan for missing environmentSuffix in resource names
- [ ] Scan for Retain policies and DeletionProtection
- [ ] Scan for deprecated AWS service versions
- [ ] Scan for GuardDuty detector creation
- [ ] Scan for AWS Config IAM policy issues
- [ ] Fix all issues found before deployment

**Expected Outcome**:
- Deployment success rate: 70-80% (up from 30-40%)
- Average iterations per PR: 1-2 (down from 3-5)
- Common preventable failures eliminated

---

*Last Updated: 2025-01-XX*
*This document is maintained by the task-coordinator and updated after each task completion.*

