# Infrastructure as Code Task: Automated IAM Security Monitoring and Remediation System

## Objective
Create a **CDK (AWS Cloud Development Kit) application using TypeScript** that implements an automated IAM security monitoring and remediation system for a financial services company.

## Platform & Language
- **Platform**: AWS CDK
- **Language**: TypeScript

## Problem Statement
A financial services company needs to implement automated security controls that enforce least-privilege access patterns and monitor for policy violations. The security team requires a solution that can detect and remediate excessive permissions in real-time while maintaining an audit trail.

## Core Requirements

### 1. IAM Policy Analysis Lambda Function
- Deploy a Lambda function that analyzes IAM policies for overly permissive actions
- Detect patterns like:
  - `'*'` in Action fields
  - `'*'` in Resource fields
- Must have execution timeout of **60 seconds or less**

### 2. KMS Encryption Keys
- Create custom KMS keys for encrypting security audit logs
- Enable **automatic key rotation**
- KMS key policies must **restrict key usage to specific AWS services only**

### 3. CloudWatch Log Groups
- Set up CloudWatch Log Groups with **90-day retention** for all security events
- Must use **KMS encryption with customer-managed keys**

### 4. EventBridge Rules
- Configure EventBridge rules to trigger the Lambda function when IAM policies are:
  - Created
  - Modified
- Must include **dead letter queues for failed invocations**

### 5. IAM Roles with Session Policies
- Implement IAM roles with session policies that restrict access to sensitive resources based on request context
- All IAM policies must use **explicit deny statements for sensitive actions**

### 6. CloudWatch Alarms
- Generate CloudWatch alarms for detecting unusual IAM activity patterns
- Threshold: More than **5 policy changes in 10 minutes**

### 7. SNS Topic for Security Alerts
- Create an SNS topic for security alerts
- Configure email subscriptions for the security team

### 8. Scheduled Daily Audit Lambda
- Deploy a scheduled Lambda function that runs **daily** to audit all existing IAM policies
- Must have execution timeout of **60 seconds or less**

### 9. Resource Tagging for Compliance
- Implement resource tags for compliance tracking
- Mandatory tags:
  - `Environment`
  - `Owner`
  - `DataClassification`

### 10. Cross-Account IAM Roles
- Configure cross-account IAM roles for security auditing
- Must include **external ID validation**

## Constraints (Critical Requirements)

1. **Lambda Execution**: All Lambda functions must have execution timeouts of **60 seconds or less**
2. **IAM Policies**: All IAM policies must use **explicit deny statements for sensitive actions**
3. **KMS Key Policies**: Must **restrict key usage to specific AWS services only**
4. **Log Encryption**: CloudWatch log groups must use **KMS encryption with customer-managed keys**
5. **EventBridge Resilience**: EventBridge rules must include **dead letter queues for failed invocations**

## Expected Deliverables

A complete CDK application (TypeScript) that includes:

1. **Infrastructure Code**: All AWS resources defined using CDK constructs
2. **Lambda Functions**:
   - Real-time IAM policy analyzer
   - Daily scheduled IAM policy auditor
3. **Security Components**:
   - KMS keys with rotation
   - Encrypted CloudWatch log groups
   - EventBridge rules with DLQs
   - SNS topics for alerting
4. **Monitoring & Alerting**:
   - CloudWatch alarms for unusual activity
   - Real-time security notifications
5. **Compliance Features**:
   - Proper resource tagging
   - Cross-account audit roles
   - Audit trail maintenance

## Success Criteria

The deployed system should:
- Provide **real-time alerts** for overly permissive IAM policies
- Maintain **compliance with security best practices**
- Include **automated remediation capabilities**
- Ensure **proper IAM permissions** for all components
- Use **encrypted logging** throughout
- Support **cross-account security auditing**

## Technical Implementation Notes

- Use CDK L2 constructs where possible for better abstractions
- Ensure all resources follow the principle of least privilege
- Implement proper error handling and logging in Lambda functions
- Use CDK aspects or custom constructs for enforcing mandatory tags
- Configure proper Lambda retry policies and DLQs
- Ensure KMS key policies allow CloudWatch Logs service to encrypt logs
- Implement CloudWatch metrics for tracking security events

## Project Structure

Use a **single-file stack approach** with the following structure:
- **lib/tap-stack.ts** - Single file containing all CDK infrastructure definitions
- **lib/lambda/** - Directory containing Lambda function code (separate files for each function)
- **bin/** - CDK app entry point
- **test/** - Integration and unit tests
- **cdk.json** - CDK configuration

All CDK constructs (KMS keys, Lambda functions, EventBridge rules, CloudWatch alarms, SNS topics, IAM roles, etc.) should be defined in the single stack file `lib/iam-security-stack.ts`.

## Integration Testing Requirements

- Test that Lambda functions can analyze IAM policies correctly
- Verify EventBridge rules trigger on IAM policy changes
- Confirm CloudWatch alarms activate on threshold breaches
- Validate SNS notifications are sent successfully
- Ensure KMS encryption is working for log groups
- Test cross-account role assumption with external ID validation
