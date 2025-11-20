# MODEL_FAILURES.md

This document tracks common model failures and issues when generating Infrastructure as Code for the Transaction Processing Pipeline.

## Common Failure Categories

### 1. Lambda Concurrency Issues

**Failure Type:** AWS Account Limit Exceeded

**Description:**
Models often set `reserved_concurrent_executions` to 100 per Lambda function without considering AWS account-wide unreserved concurrency requirements. AWS requires at least 100 unreserved concurrent executions for the entire account.

**Example Error:**
```
Error: Error creating Lambda function: InvalidParameterValueException: Specified ReservedConcurrentExecutions for function decreases account's UnreservedConcurrentExecution below its minimum value of [100].
```

**Fix Applied:**
Reduced `reserved_concurrent_executions` from 100 to 10 per function in lib/tap_stack.py:399, 428, 457

---

### 2. Lambda Deployment Package Path Issues

**Failure Type:** File Path Resolution

**Description:**
CDKTF runs Terraform from `cdktf.out/stacks/<stack-name>/` directory, requiring relative path adjustments for Lambda deployment packages. Models often use absolute paths or incorrect relative paths.

**Example Error:**
```
Error: Error creating Lambda function: InvalidParameterValueException: Could not open zip file or directory
```

**Fix Applied:**
- Create zip file using absolute path in project root
- Reference zip file using relative path `../../../lambda_placeholder_<suffix>.zip` in Terraform
- See lib/tap_stack.py:60-76 for implementation

---

### 3. Container Image Deployment

**Failure Type:** Missing Container Images

**Description:**
Models generate Lambda functions expecting container images but the images don't exist in ECR yet, causing deployment failures.

**Example Error:**
```
Error: Error creating Lambda function: InvalidParameterValueException: The image manifest or layer media type for the source image [...] is not supported
```

**Solution:**
Use placeholder zip file for initial deployment, then update to container images after ECR repositories are created.

---

### 4. VPC Endpoint Configuration

**Failure Type:** Incorrect VPC Endpoint Type

**Description:**
Models sometimes use Interface endpoints for services that only support Gateway endpoints (like DynamoDB and S3), or vice versa.

**Example Error:**
```
Error: Error creating VPC Endpoint: InvalidParameter: Interface VPC Endpoint is not supported for com.amazonaws.us-east-1.dynamodb
```

**Correct Configuration:**
- DynamoDB: Gateway endpoint (lib/tap_stack.py:170-178)
- S3: Gateway endpoint (lib/tap_stack.py:180-189)
- Step Functions: Interface endpoint (lib/tap_stack.py:191-202)

---

### 5. IAM Policy Resource ARNs

**Failure Type:** Circular Dependencies

**Description:**
Models sometimes create IAM policies that reference resources before they're created, causing circular dependencies.

**Example Error:**
```
Error: Cycle: aws_iam_policy.lambda_execution_policy, aws_lambda_function.validation_lambda
```

**Solution:**
Ensure IAM policies are created before Lambda functions, and use proper `depends_on` relationships.

---

### 6. Step Functions State Machine Definition

**Failure Type:** Invalid JSON in State Machine

**Description:**
Models may generate invalid state machine definitions with incorrect Lambda ARN references or malformed JSON.

**Example Error:**
```
Error: Error creating Step Functions state machine: InvalidDefinition: Invalid State Machine Definition
```

**Correct Configuration:**
- Use `arn:aws:states:::lambda:invoke` resource (lib/tap_stack.py:559)
- Include proper retry and catch configurations (lib/tap_stack.py:564-582)
- Use `json.dumps()` to serialize definition (lib/tap_stack.py:661)

---

### 7. DynamoDB Attribute Definitions

**Failure Type:** Unused Attribute Definitions

**Description:**
Models often define attributes that aren't used in keys or global secondary indexes, causing validation errors.

**Example Error:**
```
Error: ValidationException: One or more parameter values were invalid: Number of attributes in AttributeDefinitions does not exactly match number of attributes defined in KeySchema and GlobalSecondaryIndexes
```

**Solution:**
Only define attributes used in partition key, sort key, or GSI keys (lib/tap_stack.py:212-215).

---

### 8. CloudWatch Log Group Naming

**Failure Type:** Invalid Log Group Names

**Description:**
Models may generate log group names that don't follow AWS naming conventions or conflict with auto-created log groups.

**Example Error:**
```
Error: ResourceAlreadyExistsException: The specified log group already exists
```

**Solution:**
- Use proper prefixes: `/aws/lambda/` for Lambda, `/aws/vendedlogs/states/` for Step Functions
- Create log groups before Lambda functions using `depends_on`
- See lib/tap_stack.py:362-384, 544-550

---

### 9. SNS Encryption Configuration

**Failure Type:** Missing KMS Key

**Description:**
Models may enable SNS encryption without specifying a valid KMS key.

**Example Error:**
```
Error: InvalidParameter: Invalid keyId
```

**Solution:**
Use AWS managed key alias: `alias/aws/sns` (lib/tap_stack.py:226)

---

### 10. Security Group Egress Rules

**Failure Type:** Overly Permissive or Missing Rules

**Description:**
Models may create security groups with no egress rules or overly permissive rules.

**Best Practice:**
- HTTPS only for Lambda (port 443) - lib/tap_stack.py:156-162
- Specify description for each rule
- Use minimal CIDR blocks when possible

---

## Testing Recommendations

### Unit Tests
Models should generate code that can be tested with:
```python
import pytest
from lib.tap_stack import TapStack
from cdktf import Testing

def test_lambda_concurrency():
    app = Testing.app()
    stack = TapStack(app, "test-stack")
    synth = Testing.synth(stack)
    assert "reserved_concurrent_executions" in synth
```

### Integration Tests
Models should consider:
1. Deployment order (VPC → Subnets → Lambda → Step Functions)
2. IAM policy propagation delays
3. VPC endpoint availability
4. ECR image availability

---

## Model Improvement Suggestions

1. **Context Awareness**: Models should understand AWS account limits and regional service availability
2. **Path Resolution**: Better understanding of CDKTF directory structure and relative paths
3. **Dependency Management**: Proper ordering of resource creation and `depends_on` usage
4. **Service Constraints**: Knowledge of service-specific requirements (Gateway vs Interface endpoints)
5. **Best Practices**: Follow AWS Well-Architected Framework principles

---

## Recovery Procedures

### When Deployment Fails:

1. **Check CloudWatch Logs**: Review Lambda and Step Functions logs
2. **Verify IAM Policies**: Ensure proper permissions are granted
3. **Check Resource Limits**: Verify AWS account limits aren't exceeded
4. **Review Network Configuration**: Ensure VPC, subnets, and endpoints are configured correctly
5. **Validate State Machine**: Use Step Functions console to validate state machine definition

### Common Fix Commands:

```bash
# View Lambda logs
aws logs tail /aws/lambda/transaction-validation-dev --follow

# Check Lambda concurrency settings
aws lambda get-function-concurrency --function-name transaction-validation-dev

# Verify VPC endpoints
aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=<vpc-id>"

# Test Step Functions state machine
aws stepfunctions start-execution \
  --state-machine-arn <arn> \
  --input '{"transaction_id":"test-123","amount":100,"currency":"USD","merchant_id":"merchant-001","customer_id":"customer-001"}'
```

---

## End of MODEL_FAILURES.md
