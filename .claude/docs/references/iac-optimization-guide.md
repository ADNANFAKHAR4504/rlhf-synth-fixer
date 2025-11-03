# IaC Optimization Task Reference

## Overview

IaC Optimization tasks are a special category where the goal is **NOT to deploy infrastructure**, but to **optimize existing deployed infrastructure**.

## Key Differences from Standard IaC Tasks

### Standard IaC Tasks
- Focus: Deploy infrastructure from scratch
- Key files: `lib/*-stack.ts/py/java/go`, infrastructure code
- Testing: Unit tests validate CloudFormation templates, integration tests verify deployments
- Training quality: Assessed on infrastructure code quality

### IaC Optimization Tasks
- Focus: Optimize already-deployed infrastructure for cost/performance/security
- **Key file: `lib/optimize.py`** - The optimization script that uses boto3/AWS SDK
- Testing: Integration tests verify optimizations were applied to live resources
- Training quality: Assessed on **optimization script quality**, not infrastructure code

## Identifying IaC Optimization Tasks

Check `metadata.json`:
```json
{
  "subtask": "IaC Program Optimization",
  "subject_labels": ["IaC Optimization"]
}
```

## File Structure for Optimization Tasks

### Required Files

1. **`lib/optimize.py`** ⭐ **PRIMARY FILE** ⭐
   - Python script using boto3
   - Analyzes and modifies deployed AWS resources
   - Does NOT modify CDK/Terraform/Pulumi code
   - Applies optimizations via AWS APIs

2. **Infrastructure Stack Files** (baseline, non-optimized)
   - `lib/*-stack.ts/py/etc.` - Deployed with intentionally high resource allocations
   - Purpose: Establish baseline for optimization
   - Example: Aurora with 2-4 ACU (to be optimized down to 0.5-1 ACU)

3. **`lib/PROMPT.md`**
   - Describes the optimization requirements
   - Shows baseline infrastructure code
   - Specifies what should be optimized

4. **`lib/MODEL_RESPONSE.md`**
   - The AI-generated `optimize.py` script
   - May contain errors or inefficiencies

5. **`lib/IDEAL_RESPONSE.md`**
   - Corrected `optimize.py` script
   - Properly handles AWS API calls, error handling, resource discovery

6. **`test/*.int.test.ts`**
   - Integration tests that verify optimizations were applied
   - Check actual AWS resource configurations (ACU, node counts, task counts)

## Training Quality Assessment for Optimization Tasks

### What to Evaluate

**DO evaluate** (in `lib/optimize.py`):
- ✅ AWS SDK usage (boto3 client calls)
- ✅ Resource discovery logic (finding clusters, services, databases)
- ✅ Error handling and validation
- ✅ Multi-AZ/HA considerations
- ✅ Optimization logic correctness
- ✅ Integration with CI/CD (environment variable handling)

**DO NOT evaluate** (infrastructure stack files are baseline only):
- ❌ Stack file quality (these are intentionally non-optimized)
- ❌ CDK/Terraform/Pulumi patterns
- ❌ Infrastructure architecture

### Training Quality Scoring

Use the standard training-quality-guide.md but focus on `lib/optimize.py`:

**Category A (Significant) - Examples:**
- Fixed AWS API pagination for large result sets
- Added proper error handling for missing resources
- Implemented Multi-AZ aware replica removal
- Added resource discovery fallback strategies
- Fixed environment variable detection (ENVIRONMENT_SUFFIX)

**Category B (Moderate) - Examples:**
- Improved resource naming pattern matching
- Added status logging and progress indicators
- Configured proper wait times for async operations
- Added dry-run mode for testing

**Category C (Minor) - Examples:**
- Fixed import statements
- Corrected boto3 parameter names
- Added type hints
- Fixed linting errors

**Complexity Factors:**
- Multiple AWS services optimized (+1): Aurora, ElastiCache, ECS
- Handles Multi-AZ constraints (+1): ElastiCache HA considerations
- Integration with deployment workflow (+1): Reads CloudFormation outputs
- Production-safe validation (+1): Checks before modifying resources

## Validation Checklist

For IaC Optimization tasks:

- [ ] `lib/optimize.py` exists and is executable
- [ ] Script uses boto3/AWS SDK (not CDK/Terraform modifications)
- [ ] Script reads `ENVIRONMENT_SUFFIX` environment variable
- [ ] Script includes resource discovery logic (finds clusters/services by name)
- [ ] Script handles errors gracefully (resources not found, API failures)
- [ ] Script respects Multi-AZ and HA requirements
- [ ] Integration tests verify optimizations applied to actual resources
- [ ] Integration tests check specific resource configurations:
  - Aurora: MinCapacity, MaxCapacity, BackupRetentionPeriod
  - ElastiCache: MemberClusters count
  - ECS: DesiredCount
- [ ] `lib/PROMPT.md` shows baseline (non-optimized) infrastructure code
- [ ] `lib/PROMPT.md` specifies optimization targets

## Common Mistakes to Avoid

### ❌ Wrong: Modifying Infrastructure Code
```python
# WRONG - Don't edit CDK/Terraform files
with open('lib/database-stack.ts', 'r+') as f:
    content = f.read()
    content = content.replace('minCapacity: 2', 'minCapacity: 0.5')
    f.write(content)
```

### ✅ Right: Using AWS APIs
```python
# CORRECT - Use boto3 to modify deployed resources
rds_client.modify_db_cluster(
    DBClusterIdentifier=cluster_id,
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 0.5,
        'MaxCapacity': 1.0
    },
    ApplyImmediately=True
)
```

## Integration Test Requirements

Tests must verify optimizations on **actual deployed resources**:

```typescript
// Example: Verify Aurora optimization
const cluster = await rdsClient.send(new DescribeDBClustersCommand({}));
expect(cluster.ServerlessV2ScalingConfiguration.MinCapacity).toBe(0.5);
expect(cluster.ServerlessV2ScalingConfiguration.MaxCapacity).toBe(1);
expect(cluster.BackupRetentionPeriod).toBe(1);

// Example: Verify ElastiCache optimization
const replicationGroup = await elastiCacheClient.send(...);
expect(replicationGroup.MemberClusters.length).toBe(2);

// Example: Verify ECS optimization
const service = await ecsClient.send(...);
expect(service.desiredCount).toBe(2);
```

## Workflow Order

1. **Deploy baseline** (via deploy.sh) → High-cost configuration
2. **Run optimize.py** → Modifies resources via AWS APIs
3. **Integration tests** → Verify optimizations applied
4. **Cleanup** → Destroy resources

## References

- Training quality assessment: `.claude/docs/policies/training-quality-guide.md`
- Standard validation checkpoints: `.claude/docs/references/validation-checkpoints.md`
- Subtask definitions: `.claude/docs/references/iac-subtasks-subject-labels.json`

