# Special Subtask Requirements

This document details the unique requirements and workflows for subtasks that deviate from standard IaC task patterns.

---

## Overview

Most IaC tasks follow the standard workflow: generate infrastructure code → deploy → test. However, three subtask categories have special requirements:

1. **CI/CD Pipeline Integration** - Requires additional workflow file
2. **IaC Program Optimization** - Requires optimization script + baseline infrastructure
3. **Infrastructure QA and Management** - Uses analysis scripts instead of IaC code

---

## 1. CI/CD Pipeline Integration

**Subtask**: `CI/CD Pipeline Integration`  
**Subject Labels**: `["CI/CD Pipeline"]`

### Required Files

#### Standard Files (Same as all IaC tasks)
```
lib/PROMPT.md
lib/MODEL_RESPONSE.md
lib/IDEAL_RESPONSE.md
lib/MODEL_FAILURES.md
lib/tap-stack.{ts|py|go|etc}    # Platform-specific infrastructure code
bin/tap.{ts|py|go|etc}          # Entry point (if needed)
test/                            # Unit and integration tests
metadata.json                    # Task metadata
```

#### **SPECIAL REQUIREMENT: lib/ci-cd.yml** ⭐

**Purpose**: GitHub Actions workflow reference demonstrating CI/CD pipeline integration

**Location**: `lib/ci-cd.yml` (MUST be in lib/, not root)

**Template Source**: `templates/cicd-yml/lib/ci-cd.yml`

**Auto-Created By**:
- `cli/create-task.ts` (when "CI/CD Pipeline" subject label is selected)
- `.claude/scripts/create-task-files.sh` (when subtask is "CI/CD Pipeline Integration")

**Content**: Multi-stage GitHub Actions workflow showing:
- Source stage with GitHub OIDC authentication
- Build stage with CDK synth and cdk-nag security scanning
- Deploy stages (dev → staging → prod)
- Manual approval gates
- Cross-account role assumptions
- Encrypted artifacts with KMS
- Slack/webhook notifications

### Task Generation Instructions

**For Generator Agent (`iac-infra-generator.md`)**:

When generating PROMPT.md for CI/CD Pipeline Integration tasks:

```markdown
## Infrastructure to Build

Create [infrastructure description] using **{PLATFORM} with {LANGUAGE}**.

The infrastructure will be deployed through a multi-stage CI/CD pipeline:
- Automated deployment to dev environment on commits
- Manual approval gates for staging and production
- GitHub Actions workflow with OIDC authentication
- Security scanning with cdk-nag (for CDK) or equivalent
- Cross-account deployments using IAM role assumption

### CI/CD Workflow Requirements

Reference the provided `lib/ci-cd.yml` for:
1. GitHub OIDC authentication (no long-lived credentials)
2. Build stage: Install dependencies, run synth, security scanning
3. Deploy stages: dev (auto) → staging (approval) → prod (approval)
4. Notification hooks for deployment status
5. Artifact encryption with KMS

### Infrastructure Requirements

The infrastructure code should:
- Support multi-environment deployment (dev/staging/prod)
- Use environment-specific parameters from GitHub Actions contexts
- Include proper IAM roles for cross-account access
- Be compatible with automated CI/CD deployment
```

**Validation Checklist**:
- [ ] `lib/ci-cd.yml` exists
- [ ] File contains valid GitHub Actions workflow syntax
- [ ] Workflow includes OIDC authentication
- [ ] Multi-stage deployment configured (dev → staging → prod)
- [ ] Manual approval gates present
- [ ] Infrastructure code supports environment parameters
- [ ] IDEAL_RESPONSE.md includes infrastructure code (not just workflow)
- [ ] MODEL_FAILURES.md documents any CI/CD-specific issues

### Deployment Notes

- Infrastructure is deployed using standard platform commands
- The `lib/ci-cd.yml` file serves as a reference/template
- Actual deployment happens via the main repository's `.github/workflows/ci-cd.yml`
- Task focuses on infrastructure code that works with CI/CD automation

---

## 2. IaC Program Optimization

**Subtask**: `IaC Program Optimization`  
**Subject Labels**: `["IaC Optimization", "IaC Diagnosis/Edits"]`

### Required Files

#### Standard Files
```
lib/PROMPT.md
lib/MODEL_RESPONSE.md
lib/IDEAL_RESPONSE.md
lib/MODEL_FAILURES.md
lib/tap-stack.{ts|py|go|etc}    # BASELINE (non-optimized) infrastructure
bin/tap.{ts|py|go|etc}          # Entry point
test/                            # Unit and integration tests
metadata.json
```

#### **SPECIAL REQUIREMENT: lib/optimize.py** ⭐⭐

**Purpose**: Python script that optimizes live AWS resources after deployment

**Location**: `lib/optimize.py` (MUST be in lib/)

**Template Source**: `templates/optimize/optimize.py`

**Auto-Created By**:
- `cli/create-task.ts` (when "IaC Optimization" subject label is selected)
- Should be copied by bash script (needs to be added if missing)

**What optimize.py Does**:
1. Connects to AWS using boto3
2. Finds deployed resources using naming patterns with `environmentSuffix`
3. Modifies live resources to reduce costs:
   - Aurora: Reduce min/max ACU capacity, backup retention
   - ElastiCache: Reduce node count
   - ECS: Reduce task count
   - RDS: Adjust instance sizes, backup settings
4. Calculates and reports cost savings estimates
5. Includes error handling and dry-run mode

**Key Characteristics**:
```python
class InfrastructureOptimizer:
    def __init__(self, environment_suffix: str, region_name: str):
        self.environment_suffix = environment_suffix
        self.rds_client = boto3.client('rds', region_name=region_name)
        # ... other AWS clients
    
    def optimize_aurora_database(self) -> bool:
        # Find resources using environmentSuffix pattern
        # Modify via AWS APIs (not file editing)
        
    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        # Calculate estimated savings
```

### CRITICAL: Infrastructure Code is BASELINE

**Important**: The infrastructure code in `lib/tap-stack.*` contains **non-optimized** values:
- High Aurora capacity (min: 2 ACU, max: 4 ACU)
- Multiple ElastiCache nodes (3 nodes)
- Multiple ECS tasks (3 tasks)
- Long backup retention (14 days)

**This is intentional!** The infrastructure establishes the baseline that `optimize.py` will optimize.

### Task Generation Instructions

**For Generator Agent (`iac-infra-generator.md`)**:

When generating PROMPT.md for IaC Optimization tasks:

```markdown
## Infrastructure to Build

Create [infrastructure description] using **{PLATFORM} with {LANGUAGE}**.

This task focuses on **infrastructure optimization**. You'll:
1. Deploy baseline infrastructure with standard (higher) resource allocations
2. Create an optimization script that reduces costs on live resources
3. Demonstrate cost savings through automated optimization

### Baseline Infrastructure Requirements

Deploy infrastructure with these baseline configurations:
- Aurora Serverless v2: minCapacity=2 ACU, maxCapacity=4 ACU, backupRetention=14 days
- ElastiCache Redis: 3 cache nodes
- ECS Fargate: 3 tasks
- [other services as specified]

### Optimization Script Requirements

Create `lib/optimize.py` that:
1. Reads `ENVIRONMENT_SUFFIX` from environment variable
2. Finds resources using naming pattern: `{resource-name}-{environmentSuffix}`
3. Optimizes resources via AWS APIs (boto3):
   - Aurora: minCapacity=0.5 ACU, maxCapacity=1 ACU, backupRetention=1 day
   - ElastiCache: 2 nodes
   - ECS: 2 tasks
4. Calculates and displays monthly cost savings
5. Includes error handling and waiter logic
6. Supports --dry-run mode for testing

### Success Criteria

- Infrastructure deploys with baseline configuration
- `lib/optimize.py` successfully finds and modifies resources
- Cost savings are calculated and reported
- Integration tests verify optimizations on actual AWS resources
```

**Validation Checklist**:
- [ ] `lib/optimize.py` exists
- [ ] Script uses boto3 to connect to AWS
- [ ] Script reads `ENVIRONMENT_SUFFIX` from environment
- [ ] Resource discovery uses proper naming patterns
- [ ] Modifications use AWS APIs (not file editing)
- [ ] Cost savings calculation included
- [ ] Error handling and waiters implemented
- [ ] Stack files contain BASELINE (non-optimized) values
- [ ] IDEAL_RESPONSE.md shows the corrected `optimize.py` script
- [ ] Integration tests verify optimizations work on deployed resources
- [ ] MODEL_FAILURES.md documents optimization-specific issues

### Special Validation Rules

**For QA Agent (`iac-infra-qa-trainer.md`)**:

When `metadata.json` has `subject_labels` containing "IaC Optimization":

```bash
# Detect optimization task
SUBJECT_LABELS=$(jq -r '.subject_labels[]? // empty' metadata.json)
if echo "$SUBJECT_LABELS" | grep -q "IaC Optimization"; then
  IS_OPTIMIZATION_TASK=true
fi
```

**If optimization task**:
1. **SKIP platform/language validation on stack files** - baseline is intentional
2. **PRIMARY FOCUS**: Validate `lib/optimize.py` quality
3. **Deploy infrastructure first** (baseline configuration)
4. **Run optimize.py** against deployed resources
5. **Verify optimizations** using integration tests
6. **Do NOT penalize** high resource allocations in stack files

**For Code Reviewer Agent (`iac-code-reviewer.md`)**:

Already has special handling (Step 3.5):
- Detects optimization tasks
- Skips platform compliance check on stack files
- Focuses on `optimize.py` quality evaluation
- Expects IDEAL_RESPONSE.md to contain optimized script

---

## 3. Infrastructure QA and Management

**Subtask**: `Infrastructure QA and Management`  
**Subject Labels**: `["Infrastructure Analysis/Monitoring", "General Infrastructure Tooling QA"]`

### Required Files

#### **DIFFERENT STRUCTURE** - No Infrastructure Code!

```
lib/analyse.py OR lib/analyse.sh  # Analysis/monitoring script
lib/PROMPT.md
lib/MODEL_RESPONSE.md
lib/IDEAL_RESPONSE.md
lib/MODEL_FAILURES.md
tests/                             # Tests for analysis script
metadata.json                      # platform="analysis", language="py" or "sh"
```

**NO bin/ directory** (typically)  
**NO tap-stack files** (no infrastructure deployment)  
**NO cdk.json, Pulumi.yaml, cdktf.json** (not IaC)

#### **SPECIAL: platform="analysis"** ⭐⭐⭐

Unlike standard IaC tasks, these use:
- **Platform**: `analysis` (not cdk, pulumi, tf, cfn, cdktf)
- **Language**: `py` or `sh` (for the analysis script)
- **Template**: `templates/analysis-py/` or `templates/analysis-sh/`

### Analysis Script Requirements

**lib/analyse.py** (Python version):
```python
#!/usr/bin/env python3
"""
Infrastructure analysis script for {purpose}.
Analyzes existing AWS resources and generates reports.
"""

import boto3
from typing import Dict, List, Any

def analyze_infrastructure(environment_suffix: str, region: str) -> Dict[str, Any]:
    """
    Analyze deployed infrastructure.
    
    Args:
        environment_suffix: Environment to analyze
        region: AWS region
        
    Returns:
        Analysis results with metrics and recommendations
    """
    # Connect to AWS
    ec2 = boto3.client('ec2', region_name=region)
    cloudwatch = boto3.client('cloudwatch', region_name=region)
    
    # Find resources
    # Analyze metrics
    # Generate recommendations
    
    return {
        'resources_found': [],
        'metrics': {},
        'recommendations': [],
        'cost_analysis': {}
    }

if __name__ == "__main__":
    # CLI interface with argparse
    # Read environment variables
    # Run analysis
    # Print report
```

**lib/analyse.sh** (Shell version):
```bash
#!/bin/bash
# Infrastructure analysis script for {purpose}

set -euo pipefail

ENVIRONMENT_SUFFIX="${ENVIRONMENT_SUFFIX:-dev}"
AWS_REGION="${AWS_REGION:-us-east-1}"

# Function to analyze resources
analyze_resources() {
    echo "Analyzing infrastructure for: $ENVIRONMENT_SUFFIX"
    
    # Use AWS CLI to query resources
    # Generate metrics
    # Create recommendations
}

# Main execution
main() {
    analyze_resources
    # Print report
}

main "$@"
```

### Task Generation Instructions

**For Generator Agent (`iac-infra-generator.md`)**:

**DETECT ANALYSIS TASK FIRST**:
```bash
SUBTASK=$(jq -r '.subtask' metadata.json)
if [ "$SUBTASK" = "Infrastructure QA and Management" ]; then
  IS_ANALYSIS_TASK=true
fi
```

When generating PROMPT.md for Analysis tasks:

```markdown
## Analysis Script to Build

Create an infrastructure analysis script using **Python** (or **Bash**).

This task **DOES NOT deploy infrastructure**. Instead, you'll create a script that:
- Analyzes existing AWS resources
- Collects metrics and health data
- Generates reports and recommendations
- Identifies cost optimization opportunities
- Validates compliance and best practices

### Script Requirements

Create `lib/analyse.py` (or `lib/analyse.sh`) that:

1. **Resource Discovery**:
   - Finds resources using naming patterns with environmentSuffix
   - Queries resource configurations
   - Retrieves resource metadata

2. **Metrics Collection**:
   - Fetches CloudWatch metrics
   - Analyzes resource utilization
   - Tracks performance indicators

3. **Analysis**:
   - Identifies underutilized resources
   - Finds security misconfigurations
   - Detects compliance violations
   - Calculates cost optimization opportunities

4. **Reporting**:
   - Generates human-readable reports
   - Outputs JSON for automation
   - Provides actionable recommendations

### Environment Variables

- `ENVIRONMENT_SUFFIX`: Environment to analyze (default: dev)
- `AWS_REGION`: Target AWS region (default: us-east-1)

### Success Criteria

- Script runs successfully against deployed infrastructure
- Accurate resource discovery using environmentSuffix patterns
- Meaningful metrics and recommendations
- Clear, actionable output
- Error handling for missing resources
- Support for dry-run mode
```

**Validation Checklist**:
- [ ] `lib/analyse.py` OR `lib/analyse.sh` exists
- [ ] `metadata.json` has `platform: "analysis"`
- [ ] `metadata.json` has `language: "py"` or `"sh"`
- [ ] Script uses AWS SDK (boto3/AWS CLI) to query resources
- [ ] Script reads `ENVIRONMENT_SUFFIX` from environment
- [ ] Resource discovery logic implemented
- [ ] Metrics collection and analysis present
- [ ] Report generation included
- [ ] Error handling implemented
- [ ] Tests validate analysis logic
- [ ] IDEAL_RESPONSE.md contains the analysis script code
- [ ] **NO infrastructure deployment code** (no stacks, no bin/)

### Special Validation Rules

**Platform Detection** (from `.claude/scripts/validate-code-platform.sh`):

```bash
# Special handling for analysis platform
if [ "$EXPECTED_PLATFORM" = "analysis" ]; then
    # SKIP IaC platform validation
    
    # Verify analysis script exists
    if [ -f "lib/analyse.py" ] || [ -f "lib/analyze.py" ] || [ -f "lib/analyse.sh" ]; then
        # Validate language matches
        if [ "$EXPECTED_LANGUAGE" = "py" ]; then
            # Check for Python code in IDEAL_RESPONSE.md
        elif [ "$EXPECTED_LANGUAGE" = "sh" ]; then
            # Check for Bash code in IDEAL_RESPONSE.md
        fi
    else
        # ERROR: No analysis script found
    fi
fi
```

**For QA Agent** - Different workflow:

1. **NO deployment step** - script analyzes existing infrastructure
2. **NO synth step** - not generating infrastructure templates
3. **Tests validate**: Script logic, not deployed resources
4. **Integration tests**: May use mock AWS responses or test against pre-deployed resources

---

## Summary Table

| Aspect | CI/CD Pipeline Integration | IaC Optimization | Infrastructure QA |
|--------|---------------------------|------------------|-------------------|
| **Platform** | Standard (cdk/pulumi/tf/cfn/cdktf) | Standard (cdk/pulumi/tf/cfn/cdktf) | `analysis` |
| **Language** | Standard (ts/py/go/etc) | Standard (ts/py/go/etc) | `py` or `sh` |
| **Template** | Platform template + cicd-yml | Platform template + optimize | analysis-py or analysis-sh |
| **Special File** | `lib/ci-cd.yml` | `lib/optimize.py` | `lib/analyse.py` or `lib/analyse.sh` |
| **Infrastructure Code** | ✅ Yes (standard) | ✅ Yes (baseline, non-optimized) | ❌ No |
| **Deploys Resources** | ✅ Yes | ✅ Yes | ❌ No |
| **Special Script** | GitHub Actions workflow | AWS resource optimizer | Infrastructure analyzer |
| **bin/ directory** | ✅ Usually | ✅ Yes | ❌ Usually not |
| **Integration Tests** | Uses deployed resources | Verifies optimizations | Validates analysis logic |

---

## Quick Reference for Agents

### Detection Logic

```bash
# Read metadata
SUBTASK=$(jq -r '.subtask' metadata.json)
SUBJECT_LABELS=$(jq -r '.subject_labels[]? // empty' metadata.json)

# Detect special types
IS_CICD_TASK=false
IS_OPTIMIZATION_TASK=false
IS_ANALYSIS_TASK=false

if [ "$SUBTASK" = "CI/CD Pipeline Integration" ]; then
  IS_CICD_TASK=true
  echo "🔄 CI/CD Pipeline Integration task detected"
fi

if echo "$SUBJECT_LABELS" | grep -q "IaC Optimization"; then
  IS_OPTIMIZATION_TASK=true
  echo "📊 IaC Optimization task detected"
fi

if [ "$SUBTASK" = "Infrastructure QA and Management" ]; then
  IS_ANALYSIS_TASK=true
  echo "🔍 Infrastructure Analysis task detected"
fi
```

### Required File Verification

```bash
# Verify special files exist
if [ "$IS_CICD_TASK" = true ] && [ ! -f "lib/ci-cd.yml" ]; then
  echo "❌ ERROR: lib/ci-cd.yml missing for CI/CD task"
  exit 1
fi

if [ "$IS_OPTIMIZATION_TASK" = true ] && [ ! -f "lib/optimize.py" ]; then
  echo "❌ ERROR: lib/optimize.py missing for Optimization task"
  exit 1
fi

if [ "$IS_ANALYSIS_TASK" = true ]; then
  if [ ! -f "lib/analyse.py" ] && [ ! -f "lib/analyse.sh" ]; then
    echo "❌ ERROR: lib/analyse.py or lib/analyse.sh missing"
    exit 1
  fi
fi
```

