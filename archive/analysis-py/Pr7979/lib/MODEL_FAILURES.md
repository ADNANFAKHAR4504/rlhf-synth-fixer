# Model Failures

## Summary

The model initially generated infrastructure code using the wrong platform and language combination. The task required a Python analysis script (`platform: analysis`, `language: py`) but the model generated Pulumi TypeScript code (`platform: pulumi`, `language: ts`). This fundamental mismatch caused CI/CD pipeline failures.

## Failures

### 1. Platform/Language Mismatch (CRITICAL)

**Category**: Configuration Error
**Severity**: Critical
**Impact**: Complete deployment failure

The model failed to recognize that the subject label "Infrastructure Analysis/Monitoring" requires a Python analysis script, not infrastructure-as-code. The metadata.json was incorrectly configured with:

**Incorrect Configuration**:
```json
{
  "platform": "pulumi",
  "language": "ts"
}
```

**Correct Configuration**:
```json
{
  "platform": "analysis",
  "language": "py"
}
```

**Error Message**:
```
Error: Subject label 'Infrastructure Analysis/Monitoring' requires platform='analysis', but got 'pulumi'
```

**Fix Applied**:
- Updated metadata.json to use `platform: "analysis"` and `language: "py"`
- Rewrote PROMPT.md to specify Python analysis requirements
- Created analyse.py instead of Pulumi TypeScript code

### 2. Incorrect Implementation Approach (CRITICAL)

**Category**: Architectural Error
**Severity**: Critical
**Impact**: Wrong deliverable type

The model created infrastructure deployment code (Pulumi TypeScript) when the task required an infrastructure analysis/validation script (Python). This represents a fundamental misunderstanding of the task requirements.

**What Was Generated**:
- Pulumi TypeScript code to deploy CloudWatch resources
- S3 buckets, Lambda functions, SNS topics, CloudWatch alarms
- Infrastructure-as-code for creating resources

**What Was Required**:
- Python analysis script to validate existing resources
- boto3 API calls to check resource configurations
- Compliance scoring and recommendation generation
- Report generation for infrastructure validation

**Fix Applied**:
- Created `lib/analyse.py` with InfrastructureAnalyzer class
- Implemented boto3-based AWS API calls for resource validation
- Added compliance scoring algorithm (0-100%)
- Added recommendation generation for missing/misconfigured resources

### 3. Missing Test Structure (MODERATE)

**Category**: Testing Error
**Severity**: Medium
**Impact**: Test suite incomplete

The model did not create the correct test structure for a Python analysis script. Python analysis tasks require:

**Required Test Files**:
- `tests/__init__.py` - Package init
- `tests/unit/__init__.py` - Unit tests package init
- `tests/unit/test_analyse.py` - Unit tests with mocking
- `tests/integration/__init__.py` - Integration tests package init
- `tests/integration/test_analyse.py` - Integration tests against AWS
- `tests/test-analysis-analyse.py` - Analysis tests for CI/CD

**Fix Applied**:
- Created all required test package init files
- Created comprehensive unit tests with mocked AWS services
- Created integration tests for deployed resource validation
- Created analysis tests for CI/CD pipeline

## Root Causes

1. **Subject Label Misinterpretation**: The model did not correctly map the subject label "Infrastructure Analysis/Monitoring" to the required platform type "analysis".

2. **Platform Confusion**: The model assumed all AWS infrastructure tasks should use IaC platforms (Pulumi, Terraform, CDK) rather than analysis scripts.

3. **PROMPT.md Mismatch**: The initial PROMPT.md content did not clearly specify Python analysis requirements, allowing the model to interpret it as an IaC task.

## Training Value

These failures represent critical learning opportunities:

1. **Subject Label to Platform Mapping**: Models must learn the correct mapping between subject labels and required platforms:
   - "Infrastructure Analysis/Monitoring" -> platform: "analysis"
   - "Infrastructure Deployment" -> platform: "pulumi" | "terraform" | "cdk"

2. **Task Type Recognition**: Analysis/validation tasks require different deliverables than deployment tasks:
   - Analysis: Python scripts using boto3 to validate existing resources
   - Deployment: IaC code to create/manage resources

3. **Test Structure Requirements**: Different platforms have different test structure requirements:
   - Python analysis: unittest with mocking, pytest-compatible
   - TypeScript IaC: Jest-based tests

## Corrective Actions Taken

1. Fixed metadata.json with correct platform/language
2. Rewrote PROMPT.md with clear Python analysis requirements
3. Created analyse.py with InfrastructureAnalyzer class
4. Created complete test suite (unit, integration, analysis)
5. Updated IDEAL_RESPONSE.md with complete Python source code
6. Documented failures in MODEL_FAILURES.md

## Prevention Recommendations

1. Always verify subject label requirements before selecting platform
2. Check metadata.json validation rules in CI/CD scripts
3. Ensure PROMPT.md clearly specifies platform and language requirements
4. Validate that deliverable type matches task category (analysis vs deployment)
