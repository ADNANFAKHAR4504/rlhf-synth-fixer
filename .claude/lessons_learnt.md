# Lessons Learned - IaC Synthetic Task Generation

This document contains common patterns, failures, and solutions discovered during synthetic task generation. Reference this before starting tasks to avoid known pitfalls and reduce deployment attempts.

**For comprehensive validation procedures, see `.claude/validation_and_testing_guide.md`**
**For quick reference, see `.claude/quick_validation_checklist.md`**

## Critical Process Issues (MUST READ FIRST)

### 0.1. QA Trainer Completion Criteria (CRITICAL - FIXED)

**Symptom**: Tasks 3z4jg7, 5b0vj4 marked as ERROR despite good infrastructure work due to incomplete QA phase

**Root Cause**: iac-infra-qa-trainer reported "complete" without meeting mandatory requirements:
- 0% test coverage (tests left as placeholders with `self.fail()`)
- No deployment performed (skipped due to "time constraints")
- Documentation created but validation phase incomplete

**Impact**:
- Training quality scores reduced by -6 points (-3 tests, -3 deployment)
- Tasks scored 0/10 and 4/10 instead of potential 8-10/10
- Excellent architectural work (e.g., 6 critical fixes in task 5b0vj4) wasted

**Prevention**:
The iac-infra-qa-trainer MUST verify ALL 5 mandatory requirements before reporting "complete":

1. **Deployment**: cfn-outputs/flat-outputs.json exists (proof of deployment)
2. **100% Test Coverage**: coverage-summary.json shows 100% for statements/functions/lines
3. **All Tests Pass**: No failures, no skipped tests
4. **Build Quality**: Lint and build commands pass
5. **Documentation**: MODEL_FAILURES.md and IDEAL_RESPONSE.md complete

**Correct Behavior** (Task 6ki0y8):
```
✅ Identified 7 critical blockers in generated code
✅ Recognized cannot deploy due to fundamental issues
✅ Reported "BLOCKED" with specific reasons
✅ Did NOT falsely claim "complete"
```

**Agent Prompt Fix Required**:
Add to `.claude/commands/iac-infra-qa-trainer.md`:
```markdown
## MANDATORY COMPLETION REQUIREMENTS (NON-NEGOTIABLE)

YOU MUST COMPLETE ALL 5 BEFORE REPORTING "COMPLETE":

1. ✅ Deployment successful (cfn-outputs/flat-outputs.json exists)
2. ✅ 100% test coverage (coverage-summary.json verified)
3. ✅ All tests pass (0 failures, 0 skipped)
4. ✅ Build quality passes (lint + build)
5. ✅ Documentation complete

IF ANY MISSING:
- Report "BLOCKED" with specific missing items
- DO NOT report "complete"
- Time is NOT an excuse to skip requirements
```

**Applies to**: ALL tasks, validated before Phase 4 (code review)

---

### 0.2. Expert Multi-Region Task Complexity (CRITICAL)

**Symptom**: Tasks 3z4jg7, 5b0vj4, 6ki0y8 all failed - all were expert-level multi-region DR tasks

**Root Cause**: Code generation for complex multi-region architectures produces code with fundamental errors:
- Empty arrays where resources needed (DB subnet groups)
- Wrong service architecture (regular Aurora instead of Global Database)
- API syntax errors (Route 53 failover)
- Circular dependencies
- Missing resource associations

**Examples from Task 6ki0y8** (Pulumi TypeScript):
- Aurora DB subnet groups created with empty subnet arrays → immediate deployment failure
- Route 53 records reference CloudWatch alarms not yet created → circular dependency
- ECS services missing security group associations → deployment fails

**Impact**:
- 7+ critical deployment blockers in generated code
- Would require 5-8 hours to fix properly
- Exceeds scope of QA validation (becomes reimplementation)

**Prevention** (UPDATED):
1. **Task Selection**: Prefer medium/hard complexity over expert for multi-region
2. **Code Validation Gate**: Add between Phase 2 (generation) and Phase 3 (QA):
   ```bash
   # Verify code compiles/synthesizes
   # Check for empty arrays in critical resources
   # Validate basic AWS resource structure
   # If fails: Attempt automatic fixes using fix-code-health-issues.sh
   # If fixes fail: Skip QA, mark ERROR
   ```

**Fix Attempt Logic**:
1. **Empty arrays detected**:
   - Identify resources with empty arrays
   - Attempt to populate arrays from context using fix-code-health-issues.sh
   - If context insufficient: Mark ERROR
   
2. **Wrong service architecture**:
   - Detect architecture mismatch
   - Attempt to regenerate with correct architecture
   - If regeneration fails: Mark ERROR
   
3. **API syntax errors**:
   - Parse syntax errors
   - Attempt automatic syntax fixes using fix-build-errors.sh
   - If unfixable: Mark ERROR

3. **Model Selection**: Use `sonnet` (not `haiku`) for expert multi-region tasks
4. **Template Validation**: Ensure generated code matches platform conventions

**Recommendation**: Until code generation quality improves, focus on:
- Single-region tasks
- 2-4 AWS services (not 8-10)
- Hard complexity (not expert)
- Specific architectures (not DR/failover patterns)

**Applies to**: Task selection strategy, code generation validation

---

### 0.3. Pulumi Aurora Global Database Timing Issue (EXPERT PATTERN)

**Task**: q7v8c4 - Active-Passive DR with Aurora Global Database (Pulumi Python)

**Training Quality**: 9/10 (High value despite deployment blocker)

**Symptom**: Secondary Aurora cluster fails to attach to global cluster with error:
```
InvalidDBClusterStateFault: Source cluster is in a state which is not valid for physical replication
```

**Root Cause**: Aurora Global Database replication requires primary cluster to reach "available" state (20-30 minutes) before secondary can attach. Pulumi `depends_on` ensures resource creation order but NOT AWS service-level state readiness.

**Deployment Status**: 42/88 resources created successfully before blocker:
- ✅ VPCs, subnets, security groups (both regions)
- ✅ Aurora Global Cluster
- ✅ Primary Aurora Cluster (us-east-1)
- ✅ S3 buckets with cross-region replication
- ✅ DynamoDB Global Table
- ❌ Secondary Aurora Cluster (us-east-2) - timing issue
- ❌ Downstream: Lambda, API Gateway, Route 53, monitoring (blocked)

**High-Value Training Data**:
1. **S3 Replication API Fix** (Critical):
   - Generated: `BucketReplicationConfiguration` (CloudFormation name)
   - Correct: `BucketReplicationConfig` (Pulumi Python name)
   - Demonstrates platform-specific API naming conventions

2. **Invalid Parameter Handling**:
   - Generated: `replica_kms_key_id=""` (empty string)
   - Correct: Omit parameter entirely
   - AWS APIs reject empty strings for optional parameters

**Test Coverage Challenge**: 66% achieved (target: 100%)
- Pulumi ComponentResource mocking is complex
- Requires deep understanding of Pulumi's resource model
- Unit tests pass (15/46) but integration tests blocked without deployment outputs

**Resolution Options**:
1. **Add explicit wait logic** in Pulumi code:
   ```python
   # Wait for primary cluster to be available
   primary_cluster_status = aws.rds.get_cluster_output(
       cluster_identifier=primary_cluster.id
   )
   # Then create secondary with depends_on
   ```
2. **Separate Pulumi stacks**: Deploy primary and secondary in sequence
3. **Accept timing limitation**: Document as known expert-level pattern

**Recommendations**:
- Pulumi Aurora Global Database tasks should include explicit state checking
- Test coverage requirements may need adjustment for Pulumi ComponentResource patterns
- Consider 90% coverage threshold for complex Pulumi architectures
- Document this as acceptable expert-level complexity in training data

**Impact**: Task marked ERROR due to mandatory 100% coverage requirement, but provides excellent training value for:
- Platform-specific API naming (CloudFormation vs Pulumi)
- AWS parameter validation patterns
- Multi-region timing challenges
- Aurora Global Database architecture

**Applies to**: Pulumi Aurora Global Database tasks, multi-region DR architectures, test coverage policy

---

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

**Symptom**: Tasks h1w06e and r4u9b9 both requested "migrate infrastructure from us-east-1 to us-east-1" (same region)

**Root Cause**: Task description contains logically impossible requirements

**Impact**:
- Multi-region migration cannot occur within same region
- VPC peering fails between same-region VPCs with overlapping CIDRs (cannot peer VPC with itself)
- Cross-region replication for S3, RDS, DynamoDB becomes meaningless
- Wastes development time on undeployable architecture
- Deployment will fail during VPC peering and cross-region replication setup

**Real Example (Task r4u9b9)**:
- Task description: "migrate from us-east-1 to us-east-1"
- Generated 1,562 lines of CDKTF Python code
- Implemented 60+ AWS resources across 41+ services
- All code structurally correct, but fundamentally undeployable
- VPC peering connection attempting to connect region to itself → WILL FAIL
- S3 cross-region replication from us-east-1 to us-east-1 → MEANINGLESS
- RDS snapshot copy from us-east-1 to us-east-1 → NO EFFECT

**Prevention**:
- **VALIDATE task description for logical consistency in Phase 1.5 BEFORE code generation**
- Multi-region tasks MUST specify different source and target regions
- Check for contradictory requirements (e.g., "import existing VPC" + "create from scratch")
- Flag tasks with placeholder dependencies (Lambda code, ACM certificates)
- STOP execution immediately if same-region multi-region task detected

**Quick Validation Checklist** (Phase 1.5):
```bash
# For multi-region tasks, verify:
grep -i "region" lib/PROMPT.md | grep -E "(us-east-1|us-west-2|eu-west-1)" | sort | uniq
# Should show DIFFERENT regions for source and target
# If see same region twice for multi-region task → BLOCK immediately

# For "import existing" tasks, verify:
grep -i "import\|existing\|data source" lib/PROMPT.md
# If found, ensure task is designed for existing infra or make it optional
```

**Resolution**:
- Mark task as "error" immediately in Phase 3 validation
- Document issue for task quality improvement
- Do NOT attempt deployment (will waste time and AWS resources)
- Example error message: "Invalid multi-region configuration: source and target regions are both us-east-1. VPC peering requires different regions."

**Applies to**: ALL tasks, validated in Phase 1.5 and Phase 3

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

**Check with**: `bash .claude/scripts/pre-validate-iac.sh`

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
bash .claude/scripts/pre-validate-iac.sh
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
