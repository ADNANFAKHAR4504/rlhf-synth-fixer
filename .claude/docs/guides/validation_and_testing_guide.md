# Validation and Testing Guide for IaC Synthetic Tasks

## Overview

This guide provides comprehensive instructions for validating and testing IaC synthetic tasks to ensure they pass all stages: lint, synth, build, unit tests, integration tests, and deploy.

## Critical Success Criteria

Before marking a task as complete, ALL of the following must pass:

1. ✅ **Lint**: Zero linting errors
2. ✅ **Build**: Successful compilation
3. ✅ **Synth**: Successful template generation
4. ✅ **Pre-Deployment Validation**: Pass all checks
5. ✅ **Unit Tests**: **100% code coverage** (statements, functions, lines)
6. ✅ **Deploy**: Successful AWS deployment
7. ✅ **Integration Tests**: All tests pass with real AWS resources

**CRITICAL**: Test coverage requirement is now **100%**, not 90%. See Section 3.1 for details.

**Note**: Resource cleanup/destruction is handled after manual PR review and is NOT part of the automated task completion.


## Phase 1: Code Generation Quality Checks

### 1.1 Platform and Language Compliance (CRITICAL)

**Before generating any code, verify:**

```bash
# Read metadata.json
cat metadata.json | jq -r '"\(.platform) - \(.language)"'

# Example outputs:
# "cdk - ts"
# "pulumi - go"
# "cdktf - py"
# "cfn - yaml"
# "tf - hcl"
```

**MANDATORY Requirements:**
- PROMPT.md MUST explicitly state platform and language in the opening
- Generated code MUST match the platform/language from metadata.json
- No exceptions - wrong platform/language = CRITICAL FAILURE

**Validation Examples:**

| Platform | Language | Required Code Patterns |
|----------|----------|----------------------|
| Pulumi | Go | `package main`, `pulumi.Run()`, `import "github.com/pulumi/pulumi-aws/sdk/..."` |
| CDK | TypeScript | `import * as cdk from 'aws-cdk-lib'`, `new cdk.Stack()` |
| CDKTF | Python | `from cdktf import TerraformStack`, `cdktf.App()` |
| CloudFormation | YAML | `AWSTemplateFormatVersion`, `Resources:`, `Type: AWS::` |
| Terraform | HCL | `provider "aws"`, `resource "aws_..."` |

### 1.2 Complete Requirements Coverage

**Checklist:**
- [ ] All AWS services from task description are included
- [ ] All constraints (region, compliance, security) are addressed
- [ ] All specific configurations are implemented
- [ ] No simplifications or assumptions without justification

### 1.3 Resource Naming Standards

**MANDATORY Pattern:**
```
{resource-type}-${environmentSuffix}
```

**Examples by Platform:**

**CDK TypeScript:**
```typescript
const bucket = new s3.Bucket(this, 'DataBucket', {
  bucketName: `data-bucket-${environmentSuffix}`,
});
```

**Pulumi Go:**
```go
bucket, err := s3.NewBucket(ctx, "data-bucket", &s3.BucketArgs{
    Bucket: pulumi.String(fmt.Sprintf("data-bucket-%s", environmentSuffix)),
})
```

**CloudFormation YAML:**
```yaml
Resources:
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'data-bucket-${EnvironmentSuffix}'
```

**Terraform HCL:**
```hcl
resource "aws_s3_bucket" "data_bucket" {
  bucket = "data-bucket-${var.environment_suffix}"
}
```

## Phase 2: Pre-Deployment Validation

### 2.1 Run Pre-Validation Script

**MANDATORY before any deployment attempt:**

```bash
bash .claude/scripts/pre-validate-iac.sh
```

**This checks for:**
- Hardcoded environment values (prod-, dev-, stage-)
- Missing environmentSuffix in resource names
- Expensive resource configurations
- Platform-specific requirements

**Action Required:**
- ❌ Errors: MUST fix before proceeding
- ⚠️ Warnings: Review and fix if possible
- ✅ Pass: Proceed to lint/build/synth

### 2.2 Lint Checks

**Run platform-specific linters:**

```bash
# CDK/CDKTF TypeScript
npm run lint

# CDK/CDKTF Python
pipenv run lint

# Go
go vet ./lib/...

# Java
./gradlew check

# CloudFormation
pipenv run cfn-validate-json  # or cfn-validate-yaml
```

**Success Criteria:**
- Zero linting errors
- Python: Score ≥ 7.0/10
- All other platforms: No errors

**Common Fixes:**
- Unused imports: Remove them
- Missing semicolons: Add them
- Formatting issues: Run `npm run format` or `pipenv run format`
- Type errors: Add proper type annotations

### 2.3 Build Checks

**Run platform-specific builds:**

```bash
# TypeScript projects
npm run build

# Python projects
pipenv install --dev

# Go projects
go build -o /dev/null ./...

# Java projects
./gradlew build
```

**Success Criteria:**
- Build completes without errors
- All dependencies resolve correctly
- No compilation errors

### 2.4 Synthesis Checks

**Generate deployment templates:**

```bash
# CDK
npm run synth

# CDKTF
cdktf synth

# Pulumi
pulumi preview

# Terraform
terraform plan

# CloudFormation (templates are already synthesized)
```

**Success Criteria:**
- Template generation completes successfully
- No resource validation errors
- All cross-resource references resolve

**Common Issues:**
- Circular dependencies: Refactor resource dependencies
- Missing required properties: Add required resource properties
- Invalid resource configurations: Check AWS documentation

## Phase 3: Unit Testing

### 3.1 Coverage Requirements

**MANDATORY: 100% code coverage**

```bash
# Run tests with coverage
npm run test:unit          # TypeScript
pipenv run test:unit       # Python
go test -cover ./...       # Go
./gradlew test            # Java
```

**Coverage Targets (ALL must be 100%):**
- **Statements: 100%** (every statement must be executed)
- **Functions: 100%** (every function must be called)
- **Lines: 100%** (every line must be executed)
- **Branches: ≥ 95%** (almost all conditional branches tested)

**Why 100%?**
- Ensures all code paths are validated
- Catches edge cases and error handling
- Demonstrates thorough testing practices
- Provides high-quality training data
- Prevents untested code from reaching production

**Note**: 100% coverage means exactly 100.0%, not 99.9%. Any rounding up is not acceptable.

### 3.2 Testing Patterns

**CDK TypeScript Example:**
```typescript
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const stack = new TapStack(app, 'TestStack', {
    environmentSuffix: 'test123',
  });
  
  const template = Template.fromStack(stack);
  
  // Count resources
  template.resourceCountIs('AWS::S3::Bucket', 1);
  
  // Check properties
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }
      ]
    }
  });
});
```

**CDKTF TypeScript Example:**
```typescript
import "cdktf/lib/testing/adapters/jest";
import { Testing } from "cdktf";
import { TapStack } from "../lib/tap-stack";

describe("TapStack", () => {
  it("should create S3 bucket", () => {
    const app = Testing.app();
    const stack = new TapStack(app, "test", {
      environmentSuffix: "test123",
    });
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toHaveResource("aws_s3_bucket");
    expect(synthesized).toHaveResourceWithProperties("aws_s3_bucket", {
      bucket: expect.stringContaining("test123"),
    });
  });
});
```

**Pulumi Go Example:**
```go
package main

import (
    "sync"
    "testing"

    "github.com/pulumi/pulumi/sdk/v3/go/common/resource"
    "github.com/pulumi/pulumi/sdk/v3/go/pulumi"
    "github.com/stretchr/testify/assert"
)

type mocks int

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
    return args.Name + "_id", args.Inputs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
    return args.Args, nil
}

func TestInfrastructure(t *testing.T) {
    err := pulumi.RunErr(func(ctx *pulumi.Context) error {
        // Your infrastructure code here
        return nil
    }, pulumi.WithMocks("project", "stack", mocks(0)))
    assert.NoError(t, err)
}
```

**CloudFormation YAML Testing (Python):**
```python
import json
import yaml
import unittest

class TestCloudFormationTemplate(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open('lib/template.yaml', 'r') as f:
            cls.template = yaml.safe_load(f)
    
    def test_s3_bucket_exists(self):
        resources = self.template['Resources']
        bucket_found = False
        for resource in resources.values():
            if resource['Type'] == 'AWS::S3::Bucket':
                bucket_found = True
                # Check encryption
                self.assertIn('BucketEncryption', resource['Properties'])
        self.assertTrue(bucket_found, "S3 bucket not found in template")
```

### 3.3 Test Coverage Best Practices

**What to Test:**
- ✅ All resources are created
- ✅ Resource properties are correct
- ✅ Security configurations (encryption, IAM policies)
- ✅ Resource naming includes environmentSuffix
- ✅ Cross-resource relationships
- ✅ Error handling and validation

**What NOT to Test:**
- ❌ Hardcoded environmentSuffix values
- ❌ AWS SDK internals
- ❌ Third-party library behavior

## Phase 4: Deployment

### 4.1 Pre-Deployment Checklist

- [ ] Lint passed
- [ ] Build passed
- [ ] Synth passed
- [ ] Unit tests passed with 90%+ coverage
- [ ] Pre-validation script passed

### 4.2 Deployment Process

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="synth${TASK_ID}"

# Deploy
bash scripts/deploy.sh
```

**Maximum Attempts: 5**

**Common Deployment Failures and Fixes:**

| Error | Root Cause | Fix |
|-------|-----------|------|
| "already exists" | Missing environmentSuffix | Add environmentSuffix to resource names |
| "Bucket not empty" | S3 deletion issue | Add `autoDeleteObjects: true` |
| "ReservedConcurrentExecutions" | Lambda quota | Remove reservedConcurrentExecutions |
| "Runtime.ImportModuleError" | AWS SDK v2 not available | Use AWS SDK v3 or extract from event |
| "AccessDenied" | Missing IAM permissions | Add required permissions to role |
| "Resource limit exceeded" | AWS quota | Request quota increase or optimize |

### 4.3 Extract Outputs

**After successful deployment:**

```bash
# Extract outputs to flat format
bash scripts/extract-outputs.sh

# Verify outputs file
cat cfn-outputs/flat-outputs.json
```

**Expected format:**
```json
{
  "VPCId": "vpc-0f0ff2b1b8ca0c424",
  "S3BucketName": "data-bucket-synth123456-us-east-1",
  "RDSEndpoint": "database-synth123456.abc123.us-east-1.rds.amazonaws.com",
  "LoadBalancerDNS": "alb-synth123456.us-east-1.elb.amazonaws.com"
}
```

## Phase 5: Integration Testing

### 5.1 Integration Test Requirements

**MANDATORY:**
- Use real outputs from `cfn-outputs/flat-outputs.json`
- No mocking - test actual AWS resources
- Test complete workflows, not just individual resources
- Verify resource connectivity and permissions
- Test typical use cases and data flows

### 5.2 Integration Test Patterns

**TypeScript Example:**
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import * as fs from 'fs';

describe('Integration Tests', () => {
  let outputs: any;
  
  beforeAll(() => {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  });
  
  test('S3 bucket is accessible', async () => {
    const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    
    // Put an object
    await s3.send(new PutObjectCommand({
      Bucket: outputs.S3BucketName,
      Key: 'test-file.txt',
      Body: 'test content'
    }));
    
    // Get the object
    const result = await s3.send(new GetObjectCommand({
      Bucket: outputs.S3BucketName,
      Key: 'test-file.txt'
    }));
    
    expect(result).toBeDefined();
  });
  
  test('RDS database is accessible', async () => {
    const rds = new RDSClient({ region: process.env.AWS_REGION || 'us-east-1' });
    
    // Extract DB instance identifier from endpoint
    const dbIdentifier = outputs.RDSEndpoint.split('.')[0];
    
    const result = await rds.send(new DescribeDBInstancesCommand({
      DBInstanceIdentifier: dbIdentifier
    }));
    
    expect(result.DBInstances).toHaveLength(1);
    expect(result.DBInstances[0].DBInstanceStatus).toBe('available');
  });
});
```

**Python Example:**
```python
import json
import boto3
import unittest

class IntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open('cfn-outputs/flat-outputs.json', 'r') as f:
            cls.outputs = json.load(f)
        cls.region = os.environ.get('AWS_REGION', 'us-east-1')
    
    def test_s3_bucket_accessible(self):
        s3 = boto3.client('s3', region_name=self.region)
        
        # Put object
        s3.put_object(
            Bucket=self.outputs['S3BucketName'],
            Key='test-file.txt',
            Body=b'test content'
        )
        
        # Get object
        response = s3.get_object(
            Bucket=self.outputs['S3BucketName'],
            Key='test-file.txt'
        )
        
        self.assertEqual(response['Body'].read(), b'test content')
    
    def test_rds_database_accessible(self):
        rds = boto3.client('rds', region_name=self.region)
        
        # Extract DB identifier from endpoint
        db_identifier = self.outputs['RDSEndpoint'].split('.')[0]
        
        response = rds.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        
        self.assertEqual(len(response['DBInstances']), 1)
        self.assertEqual(response['DBInstances'][0]['DBInstanceStatus'], 'available')
```

### 5.3 Integration Test Best Practices

**DO:**
- ✅ Load all values from cfn-outputs/flat-outputs.json
- ✅ Test complete workflows (e.g., write to S3, trigger Lambda, check DynamoDB)
- ✅ Test cross-service integrations (e.g., API Gateway → Lambda → RDS)
- ✅ Verify security configurations (encryption, access controls)
- ✅ Test error scenarios (invalid inputs, missing resources)

**DON'T:**
- ❌ Assert on environmentSuffix values
- ❌ Assert on specific resource ARNs (use patterns)
- ❌ Mock AWS SDK calls
- ❌ Test only resource existence without functionality

## Phase 6: Documentation

### 6.1 Generate IDEAL_RESPONSE.md

**Requirements:**
- Show the complete, working infrastructure code
- Include all files in code blocks
- Match the structure of the latest MODEL_RESPONSE.md
- Include comments explaining key decisions
- Focus on code, minimal explanatory text

### 6.2 Generate MODEL_FAILURES.md

**Structure:**

```markdown
# Model Response Failures Analysis

## Summary

This document analyzes the failures found in the MODEL_RESPONSE and the fixes applied to create the IDEAL_RESPONSE.

## Critical Failures

### 1. [Failure Category]

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
[Description of what was wrong]

**IDEAL_RESPONSE Fix**:
[Description of the fix]

**Root Cause**:
[Why the model made this mistake]

**Cost/Security/Performance Impact**:
[Quantify the impact]

---

## High Priority Failures

### 2. [Next failure...]

[Continue pattern]

---

## Summary

- Total failures: X Critical, Y High, Z Medium, W Low
- Primary knowledge gaps: [List key areas]
- Training value: [Justify training_quality score]
```

**Categorization:**
- **Critical**: Security vulnerabilities, deployment blockers, data loss, wrong platform/language
- **High**: Cost impact >$50/month, major performance issues, incorrect architecture
- **Medium**: Suboptimal configurations, missing best practices, cost $10-50/month
- **Low**: Naming conventions, minor optimizations, code style

## Common Failure Patterns and Solutions

### Pattern 1: Platform/Language Mismatch

**Symptom**: Code generated in wrong platform/language
**Impact**: CRITICAL - Task completely fails
**Fix**: Regenerate code with explicit platform/language constraints in PROMPT.md

### Pattern 2: Missing environmentSuffix

**Symptom**: Deployment conflicts, "already exists" errors
**Impact**: High - Deployment fails
**Fix**: Add environmentSuffix to ALL resource names

### Pattern 3: Low Test Coverage

**Symptom**: Coverage < 100%
**Impact**: CRITICAL - Fails quality gate and blocks PR
**Fix**: Add tests for untested code paths until 100% coverage achieved

**How to achieve 100%**:
1. Run coverage report to identify untested lines
2. Add tests for all uncovered functions
3. Test all conditional branches (if/else, switch, ternary)
4. Test error handling paths (try/catch, error callbacks)
5. Test edge cases and boundary conditions
6. Verify coverage report shows 100.0% for statements, functions, and lines

### Pattern 4: Hardcoded Values

**Symptom**: Pre-validation fails
**Impact**: Medium - Deployment issues in different environments
**Fix**: Replace with variables/parameters

### Pattern 5: Expensive Resources

**Symptom**: High AWS costs
**Impact**: Medium - Budget concerns
**Fix**: Use serverless alternatives or optimize configurations

### Pattern 6: Missing Integration Tests

**Symptom**: Integration tests don't test actual functionality
**Impact**: Medium - Poor quality validation
**Fix**: Add comprehensive workflow tests using cfn-outputs

## Validation Checklist

Before marking a task as complete:

### Code Quality
- [ ] Platform and language match metadata.json
- [ ] All task requirements implemented
- [ ] All resource names include environmentSuffix
- [ ] No hardcoded values (prod-, dev-, stage-)
- [ ] Cost-optimized configurations

### Testing
- [ ] Lint passed (zero errors)
- [ ] Build passed (zero errors)
- [ ] Synth passed (templates generated)
- [ ] Pre-validation passed
- [ ] **Unit tests passed with 100% coverage** (statements, functions, lines)
- [ ] Deployment succeeded
- [ ] Outputs extracted to cfn-outputs/flat-outputs.json
- [ ] Integration tests passed (using real outputs)

**Note**: Resource cleanup is NOT required. Resources will be destroyed after manual PR review.


### Documentation
- [ ] IDEAL_RESPONSE.md created
- [ ] MODEL_FAILURES.md created with proper categorization
- [ ] All code files properly documented

## Quick Reference

**Pre-validate before deployment:**
```bash
bash .claude/scripts/pre-validate-iac.sh
```

**Check platform and language:**
```bash
cat metadata.json | jq -r '"\(.platform) - \(.language)"'
```

**Run full CI/CD pipeline locally:**
```bash
export ENVIRONMENT_SUFFIX="synth${TASK_ID}"
bash scripts/build.sh
bash scripts/synth.sh
bash scripts/lint.sh
bash scripts/unit-tests.sh
bash scripts/deploy.sh
bash scripts/integration-tests.sh
# Note: Resource cleanup (destroy.sh) is NOT run - handled after PR review
```

**Check for missing environmentSuffix:**
```bash
grep -rni "environmentSuffix\|environment_suffix" lib/
```

**Verify test coverage:**
```bash
npm run test:unit          # TypeScript
pipenv run test:unit       # Python
go test -cover ./...       # Go
```

---

*Last Updated: 2025-10-13*
*This document is maintained to ensure high-quality IaC synthetic task generation.*

