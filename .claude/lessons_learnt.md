# Lessons Learned - IaC Synthetic Task Generation

This document contains common patterns, failures, and solutions discovered during synthetic task generation. Reference this before starting tasks to avoid known pitfalls and reduce deployment attempts.

**For comprehensive validation procedures, see `.claude/validation_and_testing_guide.md`**  
**For quick reference, see `.claude/quick_validation_checklist.md`**

## Critical Data Integrity Requirements (MUST READ FIRST)

### CSV File Corruption Prevention (CRITICAL)

**Symptom**: .claude/tasks.csv file gets corrupted with only current task's data, all other task rows are lost/overwritten

**Root Cause**: Not preserving all rows when updating CSV file, or not validating write operations

**Prevention Rules** (MANDATORY for ALL CSV operations):
1. **ALWAYS create backup before ANY modification**: `shutil.copy2('.claude/tasks.csv', '.claude/tasks.csv.backup')`
2. **ALWAYS read ALL rows into memory** before modifying any single row
3. **ALWAYS validate row count** before and after write operations
4. **ALWAYS verify fieldnames** are present and non-empty
5. **ALWAYS restore from backup** if ANY validation fails
6. **NEVER write CSV without these safeguards**

**Safe CSV Update Pattern**:
```python
import csv
import shutil
import sys

# 1. BACKUP
shutil.copy2('.claude/tasks.csv', '.claude/tasks.csv.backup')

# 2. READ ALL ROWS
rows = []
original_count = 0
with open('.claude/tasks.csv', 'r', newline='', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        original_count += 1
        # Modify specific row(s)
        if row['task_id'] == target_id:
            row['status'] = 'new_status'
        rows.append(row)  # CRITICAL: append ALL rows

# 3. VALIDATE BEFORE WRITE
if len(rows) != original_count or not fieldnames:
    print("ERROR: Data validation failed")
    shutil.copy2('.claude/tasks.csv.backup', '.claude/tasks.csv')
    sys.exit(1)

# 4. WRITE ALL ROWS
with open('.claude/tasks.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)  # Write ALL rows

# 5. VERIFY WRITE
verify_count = sum(1 for _ in csv.DictReader(open('.claude/tasks.csv', 'r')))
if verify_count != original_count:
    print("ERROR: Write verification failed")
    shutil.copy2('.claude/tasks.csv.backup', '.claude/tasks.csv')
    sys.exit(1)
```

**Applies to**: ALL agents that modify .claude/tasks.csv (task-selector, task-coordinator)

**Recovery**: If corruption occurs:
1. Use the validation tool: `python3 .claude/scripts/validate-tasks-csv.py --restore`
2. Or manually restore: `cp .claude/tasks.csv.backup .claude/tasks.csv`
3. Or use git: `git checkout .claude/tasks.csv` (if committed)

**Validation Tool**: Use `python3 .claude/scripts/validate-tasks-csv.py` to:
- Validate CSV structure and integrity
- Check backup file status
- Create backups: `--create-backup`
- Restore from backup: `--restore`

---

## Critical Quality Requirements (MUST READ FIRST)

### 0. Task Description Validation (CRITICAL - NEW)

**Symptom**: Task h1w06e requested "migrate infrastructure from us-east-1 to us-east-1" (same region)

**Root Cause**: Task description contains logically impossible requirements

**Impact**:
- Multi-region migration cannot occur within same region
- VPC peering fails between same-region VPCs with overlapping CIDRs
- Cross-region replication becomes meaningless
- Wastes development time on undeployable architecture

**Prevention**:
- **VALIDATE task description for logical consistency BEFORE code generation**
- Multi-region tasks MUST specify different source and target regions
- Check for contradictory requirements (e.g., "import existing VPC" + "create from scratch")
- Flag tasks with placeholder dependencies (Lambda code, ACM certificates)

**Quick Validation Checklist**:
```bash
# For multi-region tasks, verify:
grep -i "region" lib/PROMPT.md | grep -E "(us-east-1|us-west-2|eu-west-1)"
# Should show DIFFERENT regions for source and target

# For "import existing" tasks, verify:
grep -i "import\|existing\|data source" lib/PROMPT.md
# If found, ensure task is designed for existing infra or make it optional
```

**Resolution**: Mark task as "error" and document issue for task quality improvement

**Applies to**: ALL tasks, validated in Phase 1.5

---

### 1. Platform and Language Compliance (CRITICAL)

**Symptom**: Task requires Pulumi+Go but generated code is CDK+TypeScript, or task requires Terraform but code is in Pulumi

**Root Cause**: Not reading or honoring the platform/language constraints from metadata.json or .claude/tasks.csv

**Quick Fix**:
- **ALWAYS read metadata.json FIRST** before generating any code
- metadata.json platform and language are MANDATORY, NON-NEGOTIABLE constraints
- PROMPT.md MUST explicitly state the platform and language in the opening paragraph
- Example: "Create infrastructure using **Pulumi with Go**" or "Use **AWS CDK with TypeScript**"
- Verify generated code matches the required platform/language before proceeding

**Validation**:
```bash
# Check metadata
cat metadata.json | jq -r '"\(.platform) - \(.language)"'

# Verify code matches
# For Pulumi Go: should have package main, pulumi.Run()
# For CDK TypeScript: should have import * as cdk
# For Terraform: should have resource "aws_..." blocks
```

**Applies to**: ALL platforms, ALL agents

---

### 2. Complete Task Requirements (CRITICAL)

**Symptom**: Generated infrastructure missing AWS services explicitly mentioned in task description

**Root Cause**: Summarizing or simplifying task requirements during PROMPT.md generation

**Quick Fix**:
- Include ALL AWS services mentioned in task description
- Include ALL constraints (region, security, compliance, performance)
- Include ALL specific configurations mentioned
- Do NOT simplify or assume "similar" services are acceptable
- If task says "ECS Fargate", don't use EC2 instances
- If task says "RDS PostgreSQL", don't use Aurora MySQL

**Validation**: Cross-check PROMPT.md against original task description for completeness

---

### 3. Training Quality Standards (CRITICAL)

**Symptom**: Training quality scores below 8 or tasks provide minimal learning value

**Root Cause**: Generated code too simple, missing best practices, or doesn't exercise model's capabilities

**CRITICAL REQUIREMENTS**:
- **MINIMUM acceptable score: 8/10** (enforced - PR creation will be BLOCKED if score < 8)
- **TARGET score: 9/10** (aim for this in all tasks)
- Score 10 reserved for exceptional learning opportunities with novel patterns
- Tasks scoring below 8 MUST be improved before PR creation

**Guidelines**:
- Training quality score < 8 = Insufficient training data (BLOCKED)
- Target range: 8-9 for most tasks (with 9 as the goal)
- Include 2-3 AWS best practices or features relevant to the task
- Security, compliance, and monitoring should ALWAYS be included when applicable
- Avoid trivial implementations that don't teach meaningful patterns
- MODEL_FAILURES.md should demonstrate significant learning opportunities

**Red Flags for Low Quality** (will result in score < 8):
- Only basic resources with no integrations
- No security configurations (missing KMS, IAM, encryption)
- No monitoring or logging
- Missing error handling
- Hardcoded values instead of proper configuration
- Platform/language mismatch with metadata.json (-5 points automatic penalty)
- Missing required AWS services from task description (-2 points per missing service)

**How to Improve Training Quality**:
1. Add security features: KMS encryption, IAM least privilege, security groups
2. Add observability: CloudWatch logs/metrics, X-Ray tracing, alarms
3. Add resilience: Multi-AZ deployment, auto-scaling, retry logic
4. Add cost optimization: Resource tagging, auto-scaling policies
5. Implement AWS best practices from Well-Architected Framework
6. Ensure ALL requirements from task description are implemented

**Edge Case: Model Already Too Good (Task 5962726542)**:

**Symptom**: Training quality score 5/10 despite production-ready code that meets all requirements

**Scenario**: Generated infrastructure was 95% correct from MODEL_RESPONSE:
- Perfect code quality (10/10 pylint)
- All AWS services implemented correctly
- PCI DSS compliant
- Multi-AZ high availability
- All requirements met
- Only 5 minor bugs fixed (duplicate URN, missing outputs, linting, env config)

**Scoring Calculation** (per training-quality-guide.md v2.0):
- Base Score: 8
- MODEL_FAILURES: 5 fixes, all Category C (minor) → Category D penalty: -3
- Complexity: Multi-service + HA + Security = +2 (max bonus)
- Calculation: 8 - 3 + 2 = 7 → Adjusted to 5 (recognize minimal learning value)
- **Final: 5/10**

**Why Score Was Low**:
- Minimal training value when model is already highly competent
- Fixes were tactical (configuration), not strategic (architecture)
- No new AWS service knowledge gained
- Limited learning opportunity for model improvement

**Decision**: Task marked as "error" per policy (training_quality < 8 = BLOCKED)

**Lesson Learned**:
- Training quality measures **learning value**, not code quality
- Even production-ready code can have low training value if model was already correct
- This is actually a **POSITIVE signal** about model capability
- Policy correctly blocks tasks that don't provide sufficient training data
- Consider this outcome as "model has mastered this pattern" rather than "task failed"
- **See training-quality-guide.md Special Case 1** for detailed explanation

---

## Common Deployment Failures & Quick Fixes

### 1. AWS GuardDuty - Account-Level Resource Constraint

**Symptom**: `The request is rejected because a detector already exists for the current account`

**Root Cause**: GuardDuty allows only ONE detector per AWS account/region. It's an account-level service, not a stack-level resource.

**Quick Fix**:
- Remove GuardDuty from infrastructure code entirely
- Document that GuardDuty should be enabled manually at account level
- Alternative: Use CloudFormation custom resource to check if detector exists before creating

**Applies to**: All platforms when deploying GuardDuty

**Note**: If task explicitly requires GuardDuty in requirements, add comment in code explaining account-level limitation and manual setup requirement.

---

### 2. AWS Config IAM Role - Managed Policy Name

**Symptom**: `Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist` or `Policy arn:aws:iam::aws:policy/AWS_ConfigRole does not exist`

**Root Cause**: Model hallucinates incorrect AWS Config managed policy names

**Quick Fix**:
- **Correct managed policy**: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole` (note `service-role/AWS_` prefix)
- **Alternative**: Use AWS Config service-linked role `AWSServiceRoleForConfig` (recommended, auto-created)
- **Last resort**: Create custom inline policy with Config permissions

**Example (CDK Python)**:
```python
# CORRECT - Use actual managed policy
config_role = iam.Role(
    self, "ConfigRole",
    assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
            "service-role/AWS_ConfigRole"  # Note: service-role/ prefix
        )
    ]
)
```

**Applies to**: CDK, CloudFormation, Terraform, Pulumi when using AWS Config

**Reference**: AWS Docs - [AWS_ConfigRole Managed Policy](https://docs.aws.amazon.com/aws-managed-policy/latest/reference/AWS_ConfigRole.html)

---

### 3. Lambda Reserved Concurrency Issues

**Symptom**: `Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [10]`

**Root Cause**: Setting `reservedConcurrentExecutions` too high or when account has limited capacity

**Quick Fix**:
- Remove `reservedConcurrentExecutions` parameter entirely (use default unreserved pool)
- If required, set to a low value (1-5) and verify account limits first

**Applies to**: CDK, CDKTF, CloudFormation, Pulumi, Terraform

---

### 4. Lambda Runtime - AWS SDK Missing

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

### 5. Hardcoded Environment Suffixes

**Symptom**: Resource conflicts, deployment failures in CI/CD with "already exists" errors

**Root Cause**: Resource names without `environmentSuffix` cause collisions across parallel deployments

**Quick Fix**:
- ALL resource names must include `environmentSuffix` or `environment_suffix`
- Pattern: `resourceName-${environmentSuffix}` or `resourceName-${props.environmentSuffix}`

**Check with**: `bash scripts/pre-validate-iac.sh`

---

### 6. S3 Bucket Considerations

**Note**: Resource cleanup (including S3 bucket deletion) is handled after manual PR review. The infrastructure code does not need special deletion configurations for synthetic tasks.

---

### 7. RDS Multi-AZ Deployment Time

**Symptom**: Deployments take 20-30+ minutes, often timeout

**Root Cause**: RDS Multi-AZ and non-serverless instances are slow to provision

**Quick Fix**:
- Prefer Aurora Serverless v2 (faster provisioning, auto-scaling)
- If Multi-AZ required, mention in PROMPT.md and increase timeouts
- Use `backup_retention_period = 1` (minimum) for faster creation
- Set `skip_final_snapshot = true` for destroyability

---

### 8. NAT Gateway Costs

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

*Last Updated: 2025-11-06*
*This document is maintained by the task-coordinator and updated after each task completion.*

