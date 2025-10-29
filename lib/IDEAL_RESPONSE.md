# Infrastructure Guardrails - AWS CDK TypeScript Implementation

## Overview

This solution implements infrastructure guardrails that protect systems and make remediation accountable using AWS CDK TypeScript. The implementation creates a comprehensive compliance monitoring and remediation system with the following key features:

- **Fast Evaluation**: Re-evaluates resource configurations within 15 minutes of changes using AWS Config
- **7-Year Retention**: Stores compliance data in S3 with lifecycle management
- **Lambda Timeout Enforcement**: Ensures all Lambda functions have maximum execution timeout of 5 minutes or less
- **IAM Access Key Detection**: Flags active IAM access keys, promoting IAM role usage
- **Audit Trail**: Comprehensive logging to S3 and CloudWatch before any remediation actions

## Architecture

The solution is organized into four main nested stacks:

### 1. ComplianceInfrastructureStack
Foundational infrastructure for compliance monitoring:

```typescript
class ComplianceInfrastructureStack extends cdk.NestedStack {
  public readonly complianceBucket: s3.Bucket;
  public readonly auditLogsBucket: s3.Bucket;
  public readonly remediationLogGroup: logs.LogGroup;
  public readonly complianceLogGroup: logs.LogGroup;
}
```

**Key Components:**
- **Compliance Bucket**: S3 bucket for AWS Config data with 7-year lifecycle
- **Audit Logs Bucket**: S3 bucket for remediation audit trails
- **CloudWatch Log Groups**: Structured logging for compliance and remediation events
- **AWS Config Recorder**: Tracks all supported AWS resource configurations
- **Delivery Channel**: Sends configuration snapshots to S3

### 2. LambdaTimeoutRuleStack
Enforces Lambda function timeout limits:

```typescript
class LambdaTimeoutRuleStack extends cdk.NestedStack {
  // Custom Lambda evaluator function
  // AWS Config rule for Lambda::Function resources
  // Maximum timeout enforcement: 300 seconds (5 minutes)
}
```

**Implementation Details:**
- Custom Lambda function evaluates timeout compliance
- Triggers on `AWS::Lambda::Function` configuration changes
- Reports COMPLIANT/NON_COMPLIANT to AWS Config
- Logs evaluation results to CloudWatch

### 3. IamAccessKeyRuleStack
Detects and flags IAM users with active access keys:

```typescript
class IamAccessKeyRuleStack extends cdk.NestedStack {
  // Custom Lambda evaluator function
  // AWS Config rule for IAM::User resources
  // Flags any users with active access keys
}
```

**Implementation Details:**
- Scans IAM users for active access keys
- Promotes IAM role usage over long-lived credentials
- Provides detailed compliance annotations
- Integrates with remediation workflows

### 4. RemediationWorkflowStack
Automated remediation with comprehensive audit logging:

```typescript
class RemediationWorkflowStack extends cdk.NestedStack {
  // Remediation Lambda function
  // EventBridge rule for compliance change triggers
  // Audit logging to S3 and CloudWatch BEFORE actions
}
```

**Critical Features:**
- **Audit-First Approach**: All actions logged BEFORE execution
- **Dual Logging**: CloudWatch Logs + S3 audit trail
- **Failure Handling**: Aborts remediation if audit logging fails
- **Extensible**: Placeholder structure for business-specific logic

## Key Implementation Highlights

### 1. Fast Evaluation (15-minute target)
```typescript
const configRecorder = new config.CfnConfigurationRecorder(
  this,
  'ConfigRecorder',
  {
    recordingGroup: {
      allSupported: true,
      includeGlobalResourceTypes: true,
    },
  }
);
```

### 2. 7-Year Data Retention
```typescript
lifecycleRules: [{
  id: 'SevenYearRetention',
  enabled: true,
  transitions: [
    { storageClass: s3.StorageClass.INFREQUENT_ACCESS, transitionAfter: cdk.Duration.days(90) },
    { storageClass: s3.StorageClass.GLACIER, transitionAfter: cdk.Duration.days(365) },
    { storageClass: s3.StorageClass.DEEP_ARCHIVE, transitionAfter: cdk.Duration.days(730) },
  ],
  expiration: cdk.Duration.days(2555), // 7 years
}]
```

### 3. Lambda Timeout Enforcement
```python
MAX_TIMEOUT_SECONDS = 300  # 5 minutes

def lambda_handler(event, context):
    timeout = response.get('Timeout', 0)
    
    if timeout <= MAX_TIMEOUT_SECONDS:
        compliance_type = 'COMPLIANT'
    else:
        compliance_type = 'NON_COMPLIANT'
```

### 4. IAM Access Key Detection
```python
def lambda_handler(event, context):
    response = iam_client.list_access_keys(UserName=resource_name)
    active_keys = [key for key in access_keys if key['Status'] == 'Active']
    
    if len(active_keys) == 0:
        compliance_type = 'COMPLIANT'
    else:
        compliance_type = 'NON_COMPLIANT'
```

### 5. Audit-First Remediation
```python
def write_audit_log(audit_data):
    # Log to CloudWatch
    logger.info(f"AUDIT LOG: {json.dumps(audit_data)}")
    
    # Log to S3
    s3_client.put_object(
        Bucket=AUDIT_BUCKET,
        Key=s3_key,
        Body=json.dumps(audit_data, indent=2)
    )
    
    # If audit logging fails, DO NOT proceed with remediation
    if audit_failed:
        raise Exception("Audit logging failed - remediation aborted")
```

## Resource Naming Convention

All resources follow a consistent naming pattern:
- **Format**: `tap-{service}-{account}-{region}-{environment}`
- **Examples**: 
  - `tap-compliance-123456789012-us-east-1-prod`
  - `tap-lambda-timeout-rule-us-east-1-dev`
  - `tap-remediation-us-east-1-staging`

## Security Features

### 1. Least Privilege IAM
- Service-specific IAM roles with minimal required permissions
- No hardcoded role names (allows CDK to generate unique names)
- Explicit permission grants for each service interaction

### 2. Encryption and Access Control
- S3 buckets with server-side encryption (S3-managed)
- Block all public access on compliance and audit buckets
- Bucket versioning enabled for data integrity

### 3. Audit Trail Integrity
- Dual logging (CloudWatch + S3) for redundancy
- Immutable audit logs with versioning
- Failure-safe remediation (stops if logging fails)

## Extensibility and Customization

The implementation includes placeholder sections for business-specific customization:

### 1. Remediation Logic Placeholders
```python
# PLACEHOLDER: Add business-specific logic here
# - Should this auto-remediate or require approval?
# - What should the new timeout be?
# - Should we notify specific teams?
```

### 2. EventBridge Rule Customization
```typescript
// PLACEHOLDER: Customize the event pattern based on:
// - Which rules should trigger auto-remediation
// - Whether to require manual approval first
// - Business hours restrictions
```

### 3. Additional Config Rules
The modular design allows easy addition of new compliance rules:
- Create new `*RuleStack` classes
- Follow the same pattern: Lambda evaluator + Config rule
- Integrate with existing remediation workflow

## Deployment and Operations

### Stack Dependencies
```typescript
lambdaTimeoutRuleStack.addDependency(complianceInfraStack);
iamAccessKeyRuleStack.addDependency(complianceInfraStack);
remediationStack.addDependency(complianceInfraStack);
```

### Environment Configuration
- Environment suffix support for multi-environment deployments
- Context-aware configuration via CDK context
- Consistent resource naming across environments

### Monitoring and Outputs
The stack provides comprehensive CloudFormation outputs for operational visibility:
- Bucket names for compliance and audit data
- Config rule names for monitoring
- Lambda function names for debugging
- EventBridge rule names for workflow tracking

## Compliance and Governance

### 1. Data Retention
- 7-year retention for all compliance data
- Automated lifecycle transitions to reduce costs
- Retain-on-delete policy for critical compliance buckets

### 2. Audit Requirements
- All remediation actions logged before execution
- Structured JSON logs for easy parsing and analysis
- Timestamp tracking for compliance reporting
- Error handling with audit trail preservation

### 3. Change Management
- AWS Config tracks all resource configuration changes
- EventBridge provides event-driven remediation
- CloudWatch Logs provide detailed execution traces

This implementation provides a robust, scalable, and auditable infrastructure guardrails system that meets enterprise compliance requirements while maintaining operational efficiency.