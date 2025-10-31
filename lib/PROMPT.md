# AWS CDK Security Framework Implementation Prompt

⚠️ **CRITICAL REQUIREMENT: Everything must be implemented in a SINGLE FILE: `lib/tap-stack.ts`** ⚠️

## Objective
Create a comprehensive AWS CDK program using **TypeScript** that implements a production-ready security framework for sensitive data processing, meeting PCI DSS compliance requirements for a financial technology startup's payment processing infrastructure.

## Platform and Language
- **Platform**: AWS CDK (Cloud Development Kit) - **NOT CDKTF**
- **Language**: TypeScript
- **Target Cloud Provider**: AWS
- **File Structure**: **SINGLE FILE ONLY** - `lib/tap-stack.ts`

## IMPORTANT: Single File Structure Requirement
**All infrastructure implementation MUST be in a single file: `lib/tap-stack.ts`**

### Allowed Project Files:
✅ `lib/tap-stack.ts` - **Main stack file (all infrastructure code here)**
✅ `test/` - Test directory and test files
✅ `package.json` - NPM package configuration
✅ `tsconfig.json` - TypeScript configuration
✅ `cdk.json` - CDK configuration
✅ `bin/` - CDK app entry point (minimal, just instantiates the stack)
✅ `README.md` - Documentation

### What Must Be in lib/tap-stack.ts (Single File):
✅ All AWS resource definitions (KMS, IAM, S3, Lambda, CloudWatch, SNS, EventBridge)
✅ All TypeScript interfaces and type definitions
✅ All constants and configuration values
✅ Lambda function code (as inline strings)
✅ Helper functions or utilities
✅ All CDK Outputs
✅ All policy documents
✅ All tag configurations

### What Should NOT Be Created:
❌ Separate construct files like `src/constructs/kms/KmsKeyHierarchy.ts`
❌ Separate Lambda function files like `src/lambda/remediation/index.ts`
❌ Separate configuration files like `src/config/types.ts` or `src/config/environments.ts`
❌ Separate utility files like `src/utils/tagging.ts`
❌ Multiple stack files
❌ Any subdirectory structure under `lib/` or `src/` for constructs/resources

### Expected Project Structure:
```
✅ CORRECT - Single Stack File Structure:
security-framework/
├── bin/
│   └── app.ts                     # CDK app entry (just instantiates TapStack)
├── lib/
│   └── tap-stack.ts               # ALL INFRASTRUCTURE CODE HERE (single file)
├── test/
│   └── tap-stack.test.ts          # Unit tests
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

```
❌ WRONG - Multi-file Structure (DO NOT CREATE THIS):
security-framework/
├── src/
│   ├── constructs/
│   │   ├── kms/
│   │   │   └── KmsKeyHierarchy.ts    # ❌ NO separate files
│   │   ├── iam/
│   │   │   └── SecurityRoles.ts       # ❌ NO separate files
│   │   └── storage/
│   │       └── SecureS3Buckets.ts     # ❌ NO separate files
│   └── lambda/
│       └── remediation/
│           └── index.ts                # ❌ NO separate files
├── lib/
│   └── main-stack.ts
└── ...
```

**ALL infrastructure code, Lambda functions, types, and utilities MUST be in the single file `lib/tap-stack.ts`** as a CDK Stack class.

### How to Organize lib/tap-stack.ts:
```typescript
// ============================================================================
// IMPORTS
// ============================================================================
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as events from 'aws-cdk-lib/aws-events';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
// ... other AWS CDK imports

// ============================================================================
// INTERFACES & TYPES
// ============================================================================
interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

interface SecurityConfig {
  allowedIpRanges: string[];
  mfaRequired: boolean;
  // ... other config
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
const RETENTION_DAYS = 2557; // 7 years for PCI DSS compliance
const SESSION_DURATION_HOURS = 1;
const KEY_ROTATION_DAYS = 30;

// ============================================================================
// LAMBDA FUNCTION CODE (inline)
// ============================================================================
const remediationLambdaCode = `
import boto3
import json
import os

def lambda_handler(event, context):
    """Remediate non-compliant S3 objects"""
    s3_client = boto3.client('s3')

    # Remediation logic here
    # ... implementation

    return {
        'statusCode': 200,
        'body': json.dumps('Remediation complete')
    }
`;

// ============================================================================
// MAIN STACK CLASS
// ============================================================================
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // ========================================================================
    // 1. KMS KEYS - Multi-region with automatic rotation
    // ========================================================================
    const piiKmsKey = new kms.Key(this, 'PiiKmsKey', {
      // ... configuration
    });

    const financialKmsKey = new kms.Key(this, 'FinancialKmsKey', {
      // ... configuration
    });

    // ... other KMS keys

    // ========================================================================
    // 2. IAM ROLES & POLICIES - Least privilege with MFA
    // ========================================================================
    const appServicesRole = new iam.Role(this, 'AppServicesRole', {
      // ... configuration
    });

    // ... other roles

    // ========================================================================
    // 3. S3 BUCKETS - Encrypted with tag-based policies
    // ========================================================================
    const piiDataBucket = new s3.Bucket(this, 'PiiDataBucket', {
      // ... configuration
    });

    // ... other buckets

    // ========================================================================
    // 4. LAMBDA FUNCTIONS - Private subnet remediation
    // ========================================================================
    const remediationFunction = new lambda.Function(this, 'RemediationFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.lambda_handler',
      code: lambda.Code.fromInline(remediationLambdaCode),
      // ... configuration
    });

    // ========================================================================
    // 5. CLOUDWATCH LOG GROUPS - 7-year retention with encryption
    // ========================================================================
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      // ... configuration
    });

    // ========================================================================
    // 6. SNS TOPICS - Security notifications
    // ========================================================================
    const securityNotificationTopic = new sns.Topic(this, 'SecurityNotifications', {
      // ... configuration
    });

    // ========================================================================
    // 7. EVENTBRIDGE RULES - Key rotation monitoring
    // ========================================================================
    const keyRotationRule = new events.Rule(this, 'KeyRotationRule', {
      // ... configuration
    });

    // ========================================================================
    // 8. CLOUDWATCH ALARMS - Security monitoring
    // ========================================================================
    const unauthorizedAccessAlarm = new cloudwatch.Alarm(this, 'UnauthorizedAccessAlarm', {
      // ... configuration
    });

    // ========================================================================
    // 9. CDK OUTPUTS - Export critical resource ARNs
    // ========================================================================
    new cdk.CfnOutput(this, 'PiiKmsKeyArn', {
      value: piiKmsKey.keyArn,
      description: 'KMS Key ARN for PII data encryption',
      exportName: `PiiKmsKeyArn-${environmentSuffix}`
    });

    // ... other outputs
  }
}
```

**This entire structure must exist in one file: `lib/tap-stack.ts`**

## Core Requirements

### 1. KMS Key Hierarchy with Automatic Rotation
Implement a multi-tiered KMS key structure:
- **Multi-region configuration** for disaster recovery on all keys
- **Automatic rotation enabled** on all KMS keys
- Create separate KMS keys for different data classifications:
  - **PII (Personally Identifiable Information)** key
  - **Financial data** key
  - **Operational data** key
  - **CloudWatch Logs** key (separate from application data)
- Configure automated key rotation schedules with **SNS notifications 30 days before expiration**
- Ensure all keys have proper key policies with least-privilege access

### 2. IAM Roles with Least-Privilege Access
Define granular IAM roles for different personas:
- **Application Services Role**: Limited to specific operations needed for payment processing
- **Data Analysts Role**: Read-only access to operational data with MFA requirement
- **Security Auditors Role**: Read-only access to all security resources and audit logs
- **Cross-account Security Scanner Role**: Read-only permissions for external security tools
- All roles must:
  - Have **maximum session duration of 1 hour**
  - Use **condition keys to enforce request source IP ranges**
  - Require **MFA for all privileged operations**

### 3. S3 Bucket Policies with Tag-Based Encryption
Create S3 buckets with advanced security controls:
- **Block all public access** on all buckets
- Enforce **TLS 1.2 minimum** for all connections
- Implement bucket policies that:
  - Enforce encryption-at-rest using specific KMS keys based on object tags
  - Deny uploads without appropriate encryption headers
  - Enforce appropriate KMS key selection based on data classification tags (e.g., `DataType: PII` → PII KMS key)
- Enable versioning and lifecycle policies

### 4. Lambda Functions for Automatic Remediation
Create Lambda functions that automatically remediate non-compliant resources:
- **Lambda must run in private subnets with no internet access**
  - **IMPORTANT**: Since VPC configuration is mentioned as a constraint but we're told to assume VPC exists, you can either:
    - Option A: Reference existing VPC using `ec2.Vpc.fromLookup()` if VPC exists
    - Option B: Create a comment noting that VPC configuration should be added when VPC details are available
    - Option C: Skip VPC attachment for now and add a TODO comment, focusing on other Lambda configurations
- Functions should:
  - Scan S3 objects for missing or incorrect tags
  - Apply required tags based on object metadata or content patterns
  - Re-encrypt objects with the correct KMS key if misconfigured
  - Send notifications to security team for critical violations
- Configure Lambda with appropriate IAM execution roles with permissions for:
  - S3 object tagging and encryption operations
  - KMS encrypt/decrypt operations
  - SNS publish for notifications
- Set up EventBridge/CloudWatch Events triggers for automated execution
- Use Python 3.11 runtime with inline code

### 5. CloudWatch Log Groups with Encryption
Implement comprehensive audit logging:
- Create CloudWatch Log Groups for:
  - Lambda function logs
  - API access logs
  - Security event logs
  - Audit trail logs
- **Encrypt all log groups using the dedicated CloudWatch Logs KMS key** (separate from application data)
- Set **retention policies of 7 years** (2,557 days) for compliance
- Enable log group encryption at creation time

### 6. Cross-Account IAM Roles
Configure secure cross-account access:
- Create IAM roles for external security scanning tools
- Provide **read-only permissions** with appropriate trust policies
- Implement external ID requirement for additional security
- Document the role ARNs for integration

### 7. Resource Deletion Protection Policies
Implement SCP-like resource policies:
- Create IAM policies that **prevent deletion of security resources** including:
  - KMS keys
  - CloudWatch Log Groups
  - S3 buckets containing audit data
  - Security-related IAM roles and policies
- Use explicit Deny statements with condition keys
- Apply to all roles except break-glass administrator role

### 8. CloudWatch Alarms for Security Monitoring
Set up comprehensive monitoring:
- Create CloudWatch alarms for:
  - Unauthorized KMS key access attempts
  - Policy violation events
  - Failed authentication attempts
  - Unusual API call patterns
  - S3 bucket policy changes
  - IAM role/policy modifications
- Configure SNS topics for alarm notifications
- Set appropriate thresholds and evaluation periods

### 9. MFA Enforcement Policies
Implement strict MFA requirements:
- Create IAM policies that enforce MFA for:
  - All write operations on security resources
  - Access to PII and financial data
  - Administrative operations
  - Cross-account role assumptions
- Use `aws:MultiFactorAuthPresent` condition key

### 10. Key Rotation Notifications
Implement proactive key management:
- Set up EventBridge rules to monitor KMS key rotation events
- Create SNS topics for notifications
- Send alerts **30 days before key rotation** is required
- Include key ARN and rotation schedule in notifications

## Technical Constraints

### Mandatory Security Constraints
1. All KMS keys must use **multi-region configuration** for disaster recovery
2. IAM policies must use **condition keys to enforce request source IP ranges**
3. S3 buckets must **block all public access and require TLS 1.2 minimum**
4. Lambda functions must **run in private subnets with no internet access**
5. CloudWatch Logs must use **separate KMS keys from application data**
6. All IAM roles must have **maximum session duration of 1 hour**

### Business Context
A financial technology startup needs to implement strict security controls for their payment processing infrastructure. The company requires automated security policy enforcement, encryption key rotation, and audit logging to meet **PCI DSS compliance requirements**.

## Expected Deliverables

### 1. Single-File CDK Stack Implementation
Create a well-organized single-file CDK stack (`lib/tap-stack.ts`) with:
- **All resources defined within the TapStack class constructor**
- **Logical sections with clear comments** separating different resource types
- **Dependency management** between resources (ensure proper creation order using CDK dependencies)
- **TypeScript typing** and interfaces for configuration (defined at the top of the file)
- **Environment configuration** support using the environmentSuffix prop (dev, staging, production)
- **Helper functions** defined as private methods or constants within the file if needed
- **Inline Lambda code** as strings or using Code.fromInline() for Lambda functions

### 2. Security Audit Report Generation
Generate a comprehensive security audit report that includes:
- **All created resources** with their full configurations
- **Compliance mapping** showing how each resource meets PCI DSS requirements
- **Security posture summary** with encryption status, access controls, and monitoring coverage
- **Export format**: JSON and/or Markdown
- **Include**: Resource ARNs, policy documents, encryption settings, rotation schedules

### 3. Critical Resource Outputs
Output the ARNs and identifiers of critical security resources:
- All KMS key ARNs (by data classification)
- IAM role ARNs (for application integration)
- S3 bucket names and ARNs
- CloudWatch Log Group names
- Lambda function ARNs
- SNS topic ARNs for notifications
- CloudWatch alarm names
- Format outputs for easy integration with external security tools (SIEM, scanners, etc.)

## Implementation Guidelines

### Code Quality Standards
- Use TypeScript best practices with strict type checking
- Implement proper error handling and validation
- Add comprehensive inline documentation
- Follow CDKTF construct patterns and conventions
- Use descriptive resource names with consistent naming conventions

### Infrastructure Best Practices
- Tag all resources appropriately (Environment, Owner, DataClassification, Compliance)
- Implement least-privilege principle throughout
- Use AWS-managed policies where appropriate, custom policies where needed
- Enable AWS CloudTrail integration for all resources
- Design for multi-region disaster recovery

### Testing and Validation
- Include unit tests for custom constructs
- Provide integration test examples
- Document deployment steps and prerequisites
- Include rollback and disaster recovery procedures

### Documentation Requirements
- README with setup instructions
- Architecture diagram showing resource relationships
- Compliance matrix mapping requirements to implementations
- Operational runbook for key rotation and incident response
- Cost estimation guide

## Success Criteria
The solution is considered complete when:
1. All 10 core requirements are fully implemented
2. All 6 technical constraints are enforced
3. CDKTF synthesis succeeds without errors
4. Security audit report is generated and comprehensive
5. All critical resource ARNs are properly outputted
6. Code follows TypeScript and CDKTF best practices
7. Solution is deployable to AWS without manual intervention

## Additional Notes
- Assume the AWS account is already configured with basic networking (VPC, private subnets)
- Use AWS CDK native L2 constructs where possible (e.g., `aws_kms.Key`, `aws_iam.Role`, `aws_s3.Bucket`)
- Implement idempotent operations for Lambda remediation functions
- Consider cost optimization while maintaining security requirements
- Plan for future scalability and additional data classifications

## Single-File Implementation Best Practices

### File Organization within tap-stack.ts
Organize the code in this order:
1. **Imports** - All AWS CDK imports at the top
2. **Interfaces & Types** - TypeScript interfaces and type definitions
3. **Constants** - Any configuration constants or helper values
4. **Lambda Function Code** - Define Lambda handler code as const strings
5. **TapStack Class** - Main stack implementation
   - KMS Keys section
   - IAM Roles & Policies section
   - S3 Buckets section
   - Lambda Functions section
   - CloudWatch Log Groups section
   - EventBridge Rules section
   - CloudWatch Alarms section
   - SNS Topics section
   - CDK Outputs section

### Lambda Function Code
Since Lambda functions must be defined inline:
```typescript
const remediationLambdaCode = `
import boto3
import json

def lambda_handler(event, context):
    # Lambda remediation logic here
    s3 = boto3.client('s3')
    # ... implementation
    return {
        'statusCode': 200,
        'body': json.dumps('Remediation complete')
    }
`;

// Then use it in the Lambda function definition
const remediationFunction = new lambda.Function(this, 'RemediationFunction', {
  runtime: lambda.Runtime.PYTHON_3_11,
  handler: 'index.lambda_handler',
  code: lambda.Code.fromInline(remediationLambdaCode),
  // ... other properties
});
```

### Resource Naming Convention
Use consistent naming with environment suffix:
- `${resourceType}-${classification}-${environmentSuffix}`
- Example: `kms-key-pii-dev`, `iam-role-app-services-prod`

### CDK Outputs
Create comprehensive outputs using `new cdk.CfnOutput()` for all critical resources:
```typescript
new cdk.CfnOutput(this, 'PiiKmsKeyArn', {
  value: piiKmsKey.keyArn,
  description: 'KMS Key ARN for PII data encryption',
  exportName: `PiiKmsKeyArn-${environmentSuffix}`
});
```

---

## 🎯 FINAL REMINDER: Single File Implementation

### The Golden Rule:
**ONE STACK FILE = `lib/tap-stack.ts`**

Everything infrastructure-related goes in this single file:
- 4 KMS Keys (PII, Financial, Operational, CloudWatch Logs)
- 4+ IAM Roles (Application, Data Analyst, Security Auditor, Cross-Account Scanner)
- Multiple S3 Buckets with encryption policies
- Lambda Functions with inline Python code
- CloudWatch Log Groups with 7-year retention
- SNS Topics for notifications
- EventBridge Rules for monitoring
- CloudWatch Alarms for security events
- IAM Policies for MFA and resource protection
- All CDK Outputs for resource ARNs

### File Size:
The resulting `lib/tap-stack.ts` file will likely be **500-1000+ lines** - this is expected and correct for a comprehensive security framework in a single file.

### Remember:
✅ Standard CDK project files (package.json, tsconfig.json, cdk.json, test/) are fine
✅ All infrastructure code in `lib/tap-stack.ts`
❌ No separate construct files
❌ No separate Lambda directories
❌ No src/ directory with subdirectories for resources
