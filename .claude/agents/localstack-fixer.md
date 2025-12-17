---
name: localstack-fixer
description: Iteratively fixes IaC tasks to make them LocalStack-compatible, applying minimal targeted changes focused on compatibility.
color: orange
model: sonnet
---

# LocalStack Fixer Agent

Fixes IaC tasks to make them deployable to LocalStack with minimal, focused changes.

## Configuration

This agent uses settings from `.claude/config/localstack.yaml`. Key configurable options:

```yaml
# From .claude/config/localstack.yaml
iteration:
  max_fix_iterations: 3 # Configurable max iterations
  use_batch_fix: true # Enable/disable batch fix approach

batch_fix:
  enabled: true
  apply_preventive_fixes: true
  fix_priority: [...] # Order of fix application
  preventive_fixes: [...] # Fixes to apply proactively
  conditional_fixes: [...] # Fixes based on error patterns
```

## Input Parameters

- `WORK_DIR` - Working directory containing task files
- `PLATFORM` - IaC platform (cdk, cfn, tf, pulumi)
- `LANGUAGE` - Programming language
- `DEPLOY_ERRORS` - Array of deployment errors
- `TEST_ERRORS` - Array of test errors
- `CONFIG_FILE` - Optional: Path to localstack.yaml (default: `.claude/config/localstack.yaml`)

## Metadata Validation

**CRITICAL**: Before creating a PR, the metadata.json MUST be validated against the schema at `config/schemas/metadata.schema.json`.

### Schema Requirements

The schema has `additionalProperties: false`, meaning ONLY these fields are allowed:

**Required Fields:**

- `platform` - enum: cdk, cdktf, cfn, tf, pulumi, analysis, cicd
- `language` - enum: ts, js, py, java, go, hcl, yaml, json, sh, yml
- `complexity` - enum: medium, hard, expert
- `turn_type` - enum: single, multi
- `po_id` - string (min 1 char)
- `team` - enum: 2, 3, 4, 5, 6, synth, synth-1, synth-2, stf
- `startedAt` - ISO 8601 datetime
- `subtask` - enum (see below)
- `provider` - enum: aws, localstack
- `subject_labels` - array of enums (see below)
- `aws_services` - array of strings

### Valid `subtask` Values

```
- "Provisioning of Infrastructure Environments"
- "Application Deployment"
- "CI/CD Pipeline Integration"
- "Failure Recovery and High Availability"
- "Security, Compliance, and Governance"
- "IaC Program Optimization"
- "Infrastructure QA and Management"
```

### Valid `subject_labels` Values

```
- "Environment Migration"
- "Cloud Environment Setup"
- "Multi-Environment Consistency"
- "Web Application Deployment"
- "Serverless Infrastructure (Functions as Code)"
- "CI/CD Pipeline"
- "Failure Recovery Automation"
- "Security Configuration as Code"
- "IaC Diagnosis/Edits"
- "IaC Optimization"
- "Infrastructure Analysis/Monitoring"
- "General Infrastructure Tooling QA"
```

### Fields NOT Allowed (must be removed)

These fields exist in some old tasks but are NOT allowed by the schema:

- `task_id` - remove (use `po_id` instead)
- `training_quality` - remove
- `coverage` - remove
- `author` - remove
- `dockerS3Location` - remove
- `pr_id` - remove
- `original_pr_id` - remove
- `localstack_migration` - remove

### Common Subtask Mappings

When migrating old tasks with invalid subtask values:

| Invalid Value                            | Map To                                        |
| ---------------------------------------- | --------------------------------------------- |
| "Security and Compliance Implementation" | "Security, Compliance, and Governance"        |
| "Security Configuration"                 | "Security, Compliance, and Governance"        |
| "Database Management"                    | "Provisioning of Infrastructure Environments" |
| "Network Configuration"                  | "Provisioning of Infrastructure Environments" |
| "Monitoring Setup"                       | "Infrastructure QA and Management"            |
| "Performance Optimization"               | "IaC Program Optimization"                    |
| "Access Control"                         | "Security, Compliance, and Governance"        |
| "Infrastructure Monitoring"              | "Infrastructure QA and Management"            |
| "Cost Optimization"                      | "IaC Program Optimization"                    |
| "Resource Provisioning"                  | "Provisioning of Infrastructure Environments" |
| "Deployment Automation"                  | "Application Deployment"                      |
| "Disaster Recovery"                      | "Failure Recovery and High Availability"      |
| (any other invalid value)                | "Infrastructure QA and Management"            |

### Common Subject Label Mappings

| Invalid Label              | Map To                               |
| -------------------------- | ------------------------------------ |
| "Security Configuration"   | "Security Configuration as Code"     |
| "Database Management"      | "General Infrastructure Tooling QA"  |
| "Network Configuration"    | "Cloud Environment Setup"            |
| "Access Control"           | "Security Configuration as Code"     |
| "Monitoring Setup"         | "Infrastructure Analysis/Monitoring" |
| "Performance Optimization" | "IaC Optimization"                   |
| "Cost Management"          | "IaC Optimization"                   |
| "Resource Management"      | "General Infrastructure Tooling QA"  |
| "Backup Configuration"     | "Failure Recovery Automation"        |
| "Logging Setup"            | "Infrastructure Analysis/Monitoring" |
| "Container Orchestration"  | "Web Application Deployment"         |
| "API Management"           | "Web Application Deployment"         |
| "Data Pipeline"            | "General Infrastructure Tooling QA"  |
| "Storage Configuration"    | "Cloud Environment Setup"            |
| "Compute Provisioning"     | "Cloud Environment Setup"            |
| (any other invalid value)  | "General Infrastructure Tooling QA"  |

## 🔴 CRITICAL: Metadata Fix (MUST BE APPLIED FIRST)

**The metadata.json fix is the MOST IMPORTANT fix and MUST be applied BEFORE any other fixes.**

The CI/CD pipeline will FAIL at the "Detect Project Files" step if metadata.json is invalid.

### Metadata Fix Script

Apply this fix to sanitize metadata.json for schema compliance:

```bash
fix_metadata() {
  local metadata_file="$1"

  if [ ! -f "$metadata_file" ]; then
    echo "❌ metadata.json not found"
    return 1
  fi

  echo "🔧 Sanitizing metadata.json for schema compliance..."

  # Valid enum values from schema
  VALID_SUBTASKS='["Provisioning of Infrastructure Environments","Application Deployment","CI/CD Pipeline Integration","Failure Recovery and High Availability","Security, Compliance, and Governance","IaC Program Optimization","Infrastructure QA and Management"]'

  VALID_LABELS='["Environment Migration","Cloud Environment Setup","Multi-Environment Consistency","Web Application Deployment","Serverless Infrastructure (Functions as Code)","CI/CD Pipeline","Failure Recovery Automation","Security Configuration as Code","IaC Diagnosis/Edits","IaC Optimization","Infrastructure Analysis/Monitoring","General Infrastructure Tooling QA"]'

  VALID_PLATFORMS='["cdk","cdktf","cfn","tf","pulumi","analysis","cicd"]'
  VALID_LANGUAGES='["ts","js","py","java","go","hcl","yaml","json","sh","yml"]'
  VALID_COMPLEXITIES='["medium","hard","expert"]'
  VALID_TURN_TYPES='["single","multi"]'
  VALID_TEAMS='["2","3","4","5","6","synth","synth-1","synth-2","stf"]'

  # Create sanitized metadata.json
  jq --argjson valid_subtasks "$VALID_SUBTASKS" \
     --argjson valid_labels "$VALID_LABELS" \
     --argjson valid_platforms "$VALID_PLATFORMS" \
     --argjson valid_languages "$VALID_LANGUAGES" \
     --argjson valid_complexities "$VALID_COMPLEXITIES" \
     --argjson valid_turn_types "$VALID_TURN_TYPES" \
     --argjson valid_teams "$VALID_TEAMS" '

    # Map invalid subtask to valid ones
    def map_subtask:
      if . == null then "Infrastructure QA and Management"
      elif . == "Security and Compliance Implementation" then "Security, Compliance, and Governance"
      elif . == "Security Configuration" then "Security, Compliance, and Governance"
      elif . == "Database Management" then "Provisioning of Infrastructure Environments"
      elif . == "Network Configuration" then "Provisioning of Infrastructure Environments"
      elif . == "Monitoring Setup" then "Infrastructure QA and Management"
      elif . == "Performance Optimization" then "IaC Program Optimization"
      elif . == "Access Control" then "Security, Compliance, and Governance"
      elif . == "Infrastructure Monitoring" then "Infrastructure QA and Management"
      elif . == "Cost Optimization" then "IaC Program Optimization"
      elif . == "Resource Provisioning" then "Provisioning of Infrastructure Environments"
      elif . == "Deployment Automation" then "Application Deployment"
      elif . == "Disaster Recovery" then "Failure Recovery and High Availability"
      elif ($valid_subtasks | index(.)) then .
      else "Infrastructure QA and Management"
      end;

    # Map invalid subject_label to valid one
    def map_label:
      if . == "Security Configuration" then "Security Configuration as Code"
      elif . == "Database Management" then "General Infrastructure Tooling QA"
      elif . == "Network Configuration" then "Cloud Environment Setup"
      elif . == "Access Control" then "Security Configuration as Code"
      elif . == "Monitoring Setup" then "Infrastructure Analysis/Monitoring"
      elif . == "Performance Optimization" then "IaC Optimization"
      elif . == "Cost Management" then "IaC Optimization"
      elif . == "Resource Management" then "General Infrastructure Tooling QA"
      elif . == "Backup Configuration" then "Failure Recovery Automation"
      elif . == "Logging Setup" then "Infrastructure Analysis/Monitoring"
      elif . == "Container Orchestration" then "Web Application Deployment"
      elif . == "API Management" then "Web Application Deployment"
      elif . == "Data Pipeline" then "General Infrastructure Tooling QA"
      elif . == "Storage Configuration" then "Cloud Environment Setup"
      elif . == "Compute Provisioning" then "Cloud Environment Setup"
      else .
      end;

    # Ensure platform is valid
    def validate_platform:
      if ($valid_platforms | index(.)) then . else "cfn" end;

    # Ensure language is valid
    def validate_language:
      if ($valid_languages | index(.)) then . else "yaml" end;

    # Ensure complexity is valid
    def validate_complexity:
      if ($valid_complexities | index(.)) then . else "medium" end;

    # Ensure turn_type is valid
    def validate_turn_type:
      if ($valid_turn_types | index(.)) then . else "single" end;

    # Ensure team is valid
    def validate_team:
      if ($valid_teams | index(.)) then . else "synth" end;

    # Ensure startedAt is valid ISO 8601
    def validate_started_at:
      if . == null or . == "" then (now | todate)
      else .
      end;

    # Build the sanitized metadata object with ONLY allowed fields
    {
      platform: (.platform | validate_platform),
      language: (.language | validate_language),
      complexity: (.complexity | validate_complexity),
      turn_type: (.turn_type | validate_turn_type),
      po_id: (.po_id // .task_id // "unknown"),
      team: (.team | validate_team),
      startedAt: (.startedAt | validate_started_at),
      subtask: (.subtask | map_subtask),
      provider: "localstack",
      subject_labels: (
        [.subject_labels[]? | map_label]
        | unique
        | map(select(. as $l | $valid_labels | index($l)))
        | if length == 0 then ["General Infrastructure Tooling QA"] else . end
      ),
      aws_services: (.aws_services // [])
    }
  ' "$metadata_file" > "${metadata_file}.tmp"

  if [ $? -eq 0 ]; then
    mv "${metadata_file}.tmp" "$metadata_file"
    echo "✅ metadata.json sanitized successfully"

    # Validate result
    echo "📋 Sanitized metadata:"
    jq -c '{platform, language, subtask, provider, subject_labels_count: (.subject_labels | length)}' "$metadata_file"
    return 0
  else
    echo "❌ Failed to sanitize metadata.json"
    rm -f "${metadata_file}.tmp"
    return 1
  fi
}
```

### Metadata Validation Check

After fixing, validate the metadata.json:

```bash
validate_metadata() {
  local metadata_file="$1"
  local schema_file="config/schemas/metadata.schema.json"

  echo "🔍 Validating metadata.json against schema..."

  # Check required fields exist
  REQUIRED_FIELDS=("platform" "language" "complexity" "turn_type" "po_id" "team" "startedAt" "subtask" "provider" "subject_labels" "aws_services")

  for field in "${REQUIRED_FIELDS[@]}"; do
    if ! jq -e ".$field" "$metadata_file" > /dev/null 2>&1; then
      echo "❌ Missing required field: $field"
      return 1
    fi
  done

  # Check no additional fields (schema has additionalProperties: false)
  EXTRA_FIELDS=$(jq -r 'keys[]' "$metadata_file" | grep -v -E "^(platform|language|complexity|turn_type|po_id|team|startedAt|subtask|provider|subject_labels|aws_services)$")

  if [ -n "$EXTRA_FIELDS" ]; then
    echo "❌ Extra fields not allowed by schema:"
    echo "$EXTRA_FIELDS"
    return 1
  fi

  # Check subject_labels has at least 1 item
  LABELS_COUNT=$(jq '.subject_labels | length' "$metadata_file")
  if [ "$LABELS_COUNT" -lt 1 ]; then
    echo "❌ subject_labels must have at least 1 item"
    return 1
  fi

  echo "✅ metadata.json validation passed"
  return 0
}
```

## Core Principles

1. **Minimal Changes**: Only modify what's necessary for LocalStack compatibility
2. **Preserve Logic**: Never change business logic or core functionality
3. **Document Everything**: Log all changes in execution-output.md
4. **Batch Fix Approach**: Analyze ALL errors and apply ALL known fixes in one iteration before re-testing (NOT one fix at a time)
5. **Maximum 3 Iterations**: Apply batch fixes, only iterate for unexpected errors (reduced from 5 due to batch approach)

## Fix Strategy

### Batch Fix Approach

**Key principle**: Apply ALL known fixes in ONE iteration before re-deploying, instead of fixing one issue at a time.

This dramatically reduces deployment cycles:

- Old: 5 fixes = 5 deploys (~5 minutes)
- New: 5 fixes = 1-2 deploys (~1-2 minutes)

### Iteration Loop (Batch Mode)

```bash
MAX_ITERATIONS=3  # Reduced from 5 since we batch fix
ITERATION=0
FIX_SUCCESS=false
FIX_FAILURE_REASON=""
ITERATIONS_USED=0
FIXES_APPLIED=()

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
  ITERATION=$((ITERATION + 1))
  ITERATIONS_USED=$ITERATION

  echo ""
  echo "═══════════════════════════════════════════════════"
  echo "🔧 FIX ITERATION $ITERATION of $MAX_ITERATIONS (BATCH MODE)"
  echo "═══════════════════════════════════════════════════"
  echo ""

  # Document iteration start
  echo "" >> execution-output.md
  echo "## Fix Iteration $ITERATION (Batch Mode)" >> execution-output.md
  echo "" >> execution-output.md

  # ═══════════════════════════════════════════════════════════════
  # STEP 1: Analyze ALL current errors
  # ═══════════════════════════════════════════════════════════════
  echo "📋 Analyzing ALL errors..."
  analyze_all_errors  # Parses DEPLOY_ERRORS and TEST_ERRORS

  # ═══════════════════════════════════════════════════════════════
  # STEP 2: Identify ALL applicable fixes (including preventive)
  # ═══════════════════════════════════════════════════════════════
  echo "🔍 Identifying ALL applicable fixes..."
  FIXES_TO_APPLY=()
  identify_all_fixes  # Populates FIXES_TO_APPLY array

  # ═══════════════════════════════════════════════════════════════
  # STEP 3: Apply ALL fixes BEFORE re-deploying
  # ═══════════════════════════════════════════════════════════════
  echo "🔧 Applying ${#FIXES_TO_APPLY[@]} fixes in batch..."
  echo "" >> execution-output.md
  echo "### Batch Fixes Applied:" >> execution-output.md

  for fix in "${FIXES_TO_APPLY[@]}"; do
    apply_fix "$fix"
    FIXES_APPLIED+=("$fix")
  done

  # ═══════════════════════════════════════════════════════════════
  # STEP 4: Single re-deployment after ALL fixes
  # ═══════════════════════════════════════════════════════════════
  echo ""
  echo "🚀 Re-deploying after batch fixes..."
  test_deployment

  # ═══════════════════════════════════════════════════════════════
  # STEP 5: Check result
  # ═══════════════════════════════════════════════════════════════
  if [ "$DEPLOY_SUCCESS" = true ] && [ "$TEST_SUCCESS" = true ]; then
    FIX_SUCCESS=true
    echo "✅ All batch fixes successful on iteration $ITERATION"
    echo "" >> execution-output.md
    echo "**Result:** ✅ Deployment and tests successful!" >> execution-output.md
    break
  fi

  # Only continue if new/unexpected errors
  echo "⚠️ Some issues remain, will analyze new errors in next iteration..."
  echo "" >> execution-output.md
  echo "**Result:** Some issues remain, continuing to next iteration..." >> execution-output.md
done

if [ "$FIX_SUCCESS" != true ]; then
  FIX_FAILURE_REASON="Maximum iterations ($MAX_ITERATIONS) reached without success"
fi
```

### Fix Identification Checklist

For EACH iteration, check and apply ALL of these if applicable:

```bash
identify_all_fixes() {
  FIXES_TO_APPLY=()

  # ═══════════════════════════════════════════════════════════════
  # 0. METADATA FIX (CRITICAL - MUST BE FIRST)
  # The CI/CD pipeline validates metadata.json BEFORE anything else
  # If metadata.json is invalid, ALL other jobs will be SKIPPED
  # ═══════════════════════════════════════════════════════════════
  echo "   🔴 CRITICAL: Checking metadata.json schema compliance..."
  FIXES_TO_APPLY+=("metadata_fix")  # ALWAYS apply to ensure compliance

  # ═══════════════════════════════════════════════════════════════
  # 1. ENDPOINT CONFIGURATION (almost always needed)
  # ═══════════════════════════════════════════════════════════════
  if ! grep -rq "AWS_ENDPOINT_URL\|localhost:4566\|isLocalStack" lib/ 2>/dev/null; then
    echo "   ➕ Will add: LocalStack endpoint configuration"
    FIXES_TO_APPLY+=("endpoint_config")
  fi

  # ═══════════════════════════════════════════════════════════════
  # 2. S3 PATH-STYLE ACCESS (if using S3)
  # ═══════════════════════════════════════════════════════════════
  if grep -riq "s3\|bucket" lib/ 2>/dev/null; then
    if ! grep -rq "forcePathStyle\|s3_use_path_style\|path.style" lib/ 2>/dev/null; then
      echo "   ➕ Will add: S3 path-style access"
      FIXES_TO_APPLY+=("s3_path_style")
    fi
  fi

  # ═══════════════════════════════════════════════════════════════
  # 3. REMOVAL POLICY (always needed for LocalStack)
  # ═══════════════════════════════════════════════════════════════
  if ! grep -rq "RemovalPolicy.DESTROY\|removal_policy.*destroy" lib/ 2>/dev/null; then
    echo "   ➕ Will add: RemovalPolicy.DESTROY for resources"
    FIXES_TO_APPLY+=("removal_policy")
  fi

  # ═══════════════════════════════════════════════════════════════
  # 4. IAM SIMPLIFICATION (if IAM errors detected)
  # ═══════════════════════════════════════════════════════════════
  if echo "$DEPLOY_ERRORS" | grep -qiE "policy|iam|principal|malformed"; then
    echo "   ➕ Will add: IAM policy simplification"
    FIXES_TO_APPLY+=("iam_simplify")
  fi

  # ═══════════════════════════════════════════════════════════════
  # 5. RESOURCE NAMING (if naming errors detected)
  # ═══════════════════════════════════════════════════════════════
  if echo "$DEPLOY_ERRORS" | grep -qiE "name|invalid.*bucket|too long|character"; then
    echo "   ➕ Will add: Resource naming simplification"
    FIXES_TO_APPLY+=("resource_naming")
  fi

  # ═══════════════════════════════════════════════════════════════
  # 6. UNSUPPORTED SERVICE HANDLING (if service errors detected)
  # ═══════════════════════════════════════════════════════════════
  if echo "$DEPLOY_ERRORS" | grep -qiE "not supported|unsupported|not available|appsync|amplify|sagemaker"; then
    echo "   ➕ Will add: Unsupported service conditional"
    FIXES_TO_APPLY+=("unsupported_service")
  fi

  # ═══════════════════════════════════════════════════════════════
  # 7. TEST CONFIGURATION (if test/ directory exists)
  # ═══════════════════════════════════════════════════════════════
  if [ -d "test" ]; then
    if ! grep -rq "AWS_ENDPOINT_URL\|localhost:4566" test/ 2>/dev/null; then
      echo "   ➕ Will add: Test endpoint configuration"
      FIXES_TO_APPLY+=("test_config")
    fi
  fi

  # ═══════════════════════════════════════════════════════════════
  # 8. MISSING PARAMETERS (if parameter errors detected)
  # ═══════════════════════════════════════════════════════════════
  if echo "$DEPLOY_ERRORS" | grep -qiE "parameter|missing.*required|undefined"; then
    echo "   ➕ Will add: Default parameter values"
    FIXES_TO_APPLY+=("default_parameters")
  fi

  echo ""
  echo "📋 Total fixes to apply: ${#FIXES_TO_APPLY[@]}"
}
```

### Preventive Fixes Matrix

Apply these fixes proactively (even if no specific error):

| Fix                           | When to Apply           | Priority        |
| ----------------------------- | ----------------------- | --------------- |
| **Metadata sanitization**     | **ALWAYS (first)**      | 🔴 **CRITICAL** |
| LocalStack endpoint detection | Always (if not present) | 🔴 Critical     |
| S3 path-style access          | If using S3/buckets     | 🔴 Critical     |
| RemovalPolicy.DESTROY         | Always (if not present) | 🟡 High         |
| Test endpoint config          | If test/ exists         | 🟡 High         |
| IAM simplification            | If IAM errors           | 🟡 Medium       |
| Resource naming               | If naming errors        | 🟡 Medium       |
| Unsupported services          | If service errors       | 🟡 Medium       |

**⚠️ WARNING**: If metadata.json is not fixed, the CI/CD pipeline will fail at "Detect Project Files" and ALL subsequent jobs will be SKIPPED.

## Common Fixes by Error Type

### 1. Missing LocalStack Endpoint Configuration

**Error Pattern**: `UnrecognizedClientException`, `Could not connect`

**CDK TypeScript Fix**:

```typescript
// Add at top of stack file
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

// For resources that need it
if (isLocalStack) {
  // LocalStack-specific configuration
}
```

**CDK Python Fix**:

```python
import os

is_localstack = 'localhost' in os.environ.get('AWS_ENDPOINT_URL', '') or \
                '4566' in os.environ.get('AWS_ENDPOINT_URL', '')
```

**Terraform Fix**:

```hcl
# Add to providers.tf or main.tf
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  s3_use_path_style          = true

  endpoints {
    s3             = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    iam            = "http://localhost:4566"
    sts            = "http://localhost:4566"
    cloudformation = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    logs           = "http://localhost:4566"
    sns            = "http://localhost:4566"
    sqs            = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
    ssm            = "http://localhost:4566"
    kms            = "http://localhost:4566"
    events         = "http://localhost:4566"
    apigateway     = "http://localhost:4566"
    kinesis        = "http://localhost:4566"
    ec2            = "http://localhost:4566"
    rds            = "http://localhost:4566"
    ecs            = "http://localhost:4566"
  }
}
```

**Pulumi Fix**:

```typescript
// In Pulumi.localstack.yaml or code
const awsConfig = new pulumi.Config('aws');
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost');

// Set provider config programmatically if needed
```

### 2. S3 Path-Style Access Issues

**Error Pattern**: `InvalidBucketName`, `The bucket you are attempting to access must be addressed using the specified endpoint`

**Fix - Environment Variables**:

```bash
export AWS_S3_FORCE_PATH_STYLE=true
export S3_SKIP_SIGNATURE_VALIDATION=1
```

**Fix - CDK TypeScript**:

```typescript
// S3 buckets work, but ensure no virtual-hosted style URLs
const bucket = new s3.Bucket(this, 'MyBucket', {
  bucketName: `my-bucket-${environmentSuffix}`, // Simple names work best
  removalPolicy: isLocalStack
    ? cdk.RemovalPolicy.DESTROY
    : cdk.RemovalPolicy.RETAIN,
  autoDeleteObjects: isLocalStack,
});
```

### 3. Unsupported AWS Services

**Error Pattern**: `Service not available`, `UnsupportedOperation`

**LocalStack Community Limitations**:

- AppSync - Not available (Pro only)
- Amplify - Not available (Pro only)
- SageMaker - Not available (Pro only)
- EKS - Limited (Pro only for full support)
- Some advanced features of supported services

**Fix Strategy - Conditional Resource Creation**:

```typescript
// CDK TypeScript
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost');

// Only create in real AWS, skip for LocalStack
if (!isLocalStack) {
  const api = new appsync.GraphqlApi(this, 'Api', {
    // AppSync config
  });
}

// Or provide a mock/stub for LocalStack
const apiEndpoint = isLocalStack
  ? 'http://localhost:4566/mock-api'
  : api.graphqlUrl;
```

**Fix Strategy - CloudFormation Conditions**:

```yaml
Conditions:
  IsNotLocalStack: !Not [!Equals [!Ref AWS::StackName, 'tap-stack-localstack']]

Resources:
  MyAppSyncApi:
    Type: AWS::AppSync::GraphQLApi
    Condition: IsNotLocalStack
    Properties:
      # ...
```

### 4. IAM Policy Issues

**Error Pattern**: `MalformedPolicyDocument`, `Invalid principal`

**Fix - Simplify IAM for LocalStack**:

```typescript
// CDK - Simplified IAM for LocalStack
const policy = isLocalStack
  ? new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['*'],
      resources: ['*'],
    })
  : new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:PutObject'],
      resources: [bucket.arnForObjects('*')],
    });
```

**CloudFormation Fix**:

```yaml
# Use simpler policy structure
PolicyDocument:
  Version: '2012-10-17'
  Statement:
    - Effect: Allow
      Action:
        - 's3:*'
      Resource: '*'
```

### 5. Resource Naming Issues

**Error Pattern**: `Invalid resource name`, `Name too long`

**Fix - Use Simpler Names**:

```typescript
// CDK
const resourceName = isLocalStack
  ? `simple-${environmentSuffix}`
  : `complex-multi-part-name-${region}-${environmentSuffix}`;
```

### 6. Missing Parameters

**Error Pattern**: `Parameter validation failed`, `Missing required parameter`

**Fix - CloudFormation Default Parameters**:

```yaml
Parameters:
  Environment:
    Type: String
    Default: dev
    Description: Environment suffix

  # Add defaults for all parameters
  VpcCidr:
    Type: String
    Default: '10.0.0.0/16'
```

### 7. RemovalPolicy Issues

**Error Pattern**: Resources not cleaning up, stuck deployments

**Fix - Set DESTROY for LocalStack**:

```typescript
// CDK
const removalPolicy = isLocalStack
  ? cdk.RemovalPolicy.DESTROY
  : cdk.RemovalPolicy.RETAIN;

new s3.Bucket(this, 'Bucket', {
  removalPolicy,
  autoDeleteObjects: isLocalStack,
});

new dynamodb.Table(this, 'Table', {
  removalPolicy,
});
```

### 8. Integration Test Fixes

**Error Pattern**: Tests failing with connection errors

**Fix - Update Test Configuration**:

```typescript
// test/tap-stack.int.test.ts
import { S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';

const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost');

// Load outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf-8')
);

// Configure clients for LocalStack
const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
});

describe('Integration Tests', () => {
  test('should connect to S3', async () => {
    // Test implementation
  });
});
```

## Fix Application Process

````bash
apply_fix() {
  local fix_type="$1"
  local file="$2"
  local description="$3"

  echo "### Fix: $description" >> execution-output.md
  echo "" >> execution-output.md
  echo "**File:** \`$file\`" >> execution-output.md
  echo "" >> execution-output.md
  echo "**Change:**" >> execution-output.md
  echo '```diff' >> execution-output.md

  # Apply the fix and capture diff
  # ... (fix implementation)

  echo '```' >> execution-output.md
  echo "" >> execution-output.md
}
````

## Re-Deployment Test

After each fix, re-run deployment:

```bash
test_deployment() {
  echo "🔄 Testing deployment after fix..."

  # Reset LocalStack state
  curl -X POST http://localhost:4566/_localstack/state/reset 2>/dev/null || true

  # Run deployment based on platform
  case "$PLATFORM" in
    cdk)
      cdklocal deploy --all --require-approval never 2>&1
      ;;
    cfn)
      awslocal cloudformation create-stack \
        --stack-name tap-stack-localstack \
        --template-body file://lib/TapStack.yml \
        --capabilities CAPABILITY_IAM 2>&1
      ;;
    tf)
      cd lib && tflocal apply -auto-approve 2>&1 && cd ..
      ;;
    pulumi)
      pulumi up --yes 2>&1
      ;;
  esac

  return $?
}
```

## Output Variables

```bash
# Set at end of agent execution
FIX_SUCCESS=true/false
FIX_FAILURE_REASON="reason if failed"
ITERATIONS_USED=N
FIXES_APPLIED="list of fixes applied"
```

## Exit Codes

- `0` - Successfully fixed, deployment and tests pass
- `1` - Unable to fix within maximum iterations
- `2` - Uses unsupported services that cannot be fixed

## Documentation

All changes MUST be documented in `execution-output.md`:

````markdown
## Fix Iteration 1

**Error Analyzed:**
UnrecognizedClientException: The security token included in the request is invalid

**Root Cause:**
Missing LocalStack endpoint configuration

**Fix Applied:**

- File: `lib/tap-stack.ts`
- Added LocalStack detection and endpoint configuration

```diff
+ const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost');
+
  export class TapStack extends cdk.Stack {
```
````

**Result:** Deployment still failing (different error)

---

## Fix Iteration 2

**Error Analyzed:**
S3 bucket creation failed - InvalidBucketName

**Root Cause:**
Bucket name too complex for LocalStack

**Fix Applied:**

- File: `lib/tap-stack.ts`
- Simplified bucket naming for LocalStack

```diff
- bucketName: `my-complex-bucket-name-${region}-${account}-${suffix}`,
+ bucketName: isLocalStack ? `bucket-${suffix}` : `my-complex-bucket-name-${region}-${account}-${suffix}`,
```

**Result:** ✅ Deployment successful!

````

## Escalation

If fixes fail after maximum iterations (now 3 with batch approach):

```bash
if [ "$FIX_SUCCESS" != true ]; then
  echo "" >> execution-output.md
  echo "## ⚠️ ESCALATION REQUIRED" >> execution-output.md
  echo "" >> execution-output.md
  echo "Unable to fix within $MAX_ITERATIONS iterations (batch mode)." >> execution-output.md
  echo "" >> execution-output.md
  echo "**Fixes Attempted:**" >> execution-output.md
  for fix in "${FIXES_APPLIED[@]}"; do
    echo "- $fix" >> execution-output.md
  done
  echo "" >> execution-output.md
  echo "**Remaining Issues:**" >> execution-output.md
  echo "- $DEPLOY_ERRORS" >> execution-output.md
  echo "- $TEST_ERRORS" >> execution-output.md
  echo "" >> execution-output.md
  echo "**Possible Causes:**" >> execution-output.md
  echo "1. Uses Pro-only LocalStack features (AppSync, EKS full, etc.)" >> execution-output.md
  echo "2. Complex service dependencies not supported in Community" >> execution-output.md
  echo "3. Non-standard configuration requiring manual intervention" >> execution-output.md
  echo "4. Bug in original task code" >> execution-output.md

  FIX_FAILURE_REASON="Max iterations reached with batch fixes - manual review required"
fi
````

## Performance Improvement

With batch fix approach:

| Scenario       | Old (One-at-a-time) | New (Batch)            | Time Saved |
| -------------- | ------------------- | ---------------------- | ---------- |
| 5 fixes needed | 5 deploys (~5 min)  | 1-2 deploys (~1-2 min) | **60-80%** |
| 3 fixes needed | 3 deploys (~3 min)  | 1 deploy (~1 min)      | **66%**    |
| Complex task   | Up to 5 iterations  | Max 3 iterations       | **40%**    |

The batch approach significantly speeds up migrations by:

1. Applying ALL known fixes before first re-deploy
2. Including preventive fixes (not just reactive)
3. Reducing maximum iterations from 5 to 3
