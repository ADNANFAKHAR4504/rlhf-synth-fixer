AWSTemplateFormatVersion: '2010-09-09'

Resources:

# IAM Role for EC2 Instances

EC2InstanceRole:
Type: AWS::IAM::Role
Properties:
AssumeRolePolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Principal:
Service: ec2.amazonaws.com
Action: sts:AssumeRole
Policies: - PolicyName: S3ReadOnlyAccess
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - s3:Get* - s3:List*
Resource: arn:aws:s3:::_ - Effect: Deny
Action: - s3:Put_ - s3:Delete*
Resource: arn:aws:s3:::*

# IAM Policy for a Specific User

S3ReadOnlyPolicy:
Type: AWS::IAM::Policy
Properties:
PolicyName: S3SpecificBucketReadOnly
PolicyDocument:
Version: '2012-10-17'
Statement: - Effect: Allow
Action: - s3:Get* - s3:List*
Resource: - arn:aws:s3:::my-specific-bucket - arn:aws:s3:::my-specific-bucket/\*

# Attach the S3ReadOnlyPolicy to a specific IAM User

AttachPolicyToUser:
Type: AWS::IAM::UserPolicy
Properties:
UserName: my-specific-user
PolicyName: S3SpecificBucketReadOnly

Outputs:
EC2InstanceRoleARN:
Description: ARN of the EC2 Instance Role
Value: !GetAtt EC2InstanceRole.Arn

S3ReadOnlyPolicyARN:
Description: ARN of the S3 Read-Only Policy
Value: !Ref S3ReadOnlyPolicy

# IAM Security Configuration Integration Tests

This document describes the integration tests for validating IAM security configurations in the TAP (Turnaround Prompt) stack deployment.

## Overview

The integration tests verify that AWS resources are properly configured with appropriate security settings, following the principle of least privilege and AWS security best practices.

## Test Configuration

### Prerequisites

- AWS CDK deployment completed
- CloudFormation outputs available in `cfn-outputs/flat-outputs.json`
- Environment suffix set via `ENVIRONMENT_SUFFIX` environment variable (defaults to 'dev')

### AWS Clients

The tests use the following AWS SDK clients:

- **IAMClient** - For IAM role, user, and policy validation
- **S3Client** - For S3 bucket configuration verification
- **DynamoDBClient** - For DynamoDB table validation

## Test Suites

### 1. S3 Bucket Configuration Tests

#### Test: S3 Bucket Creation and Configuration

**Purpose**: Validates that the test S3 bucket is created with proper security configurations.

**Validations**:

- Bucket exists and contains environment suffix
- Bucket location is retrievable
- Encryption configuration (if present)
- Versioning configuration (if present)

**Expected Outputs**:

- `TestS3BucketName` - Name of the created S3 bucket

### 2. IAM Role Configuration Tests

#### Test: EC2 Instance Role Configuration

**Purpose**: Ensures EC2 instance role has correct permissions and policies.

**Validations**:

- Role exists and contains environment suffix
- Assume role policy allows EC2 service
- Has AmazonS3ReadOnlyAccess managed policy attached
- Contains explicit deny policies (security hardening)

**Expected Outputs**:

- `EC2InstanceRoleName` - Name of the EC2 instance role

#### Test: Instance Profile Attachment

**Purpose**: Verifies instance profile is properly configured with the role.

**Validations**:

- Instance profile exists
- Contains exactly one role
- Role matches the EC2 instance role

**Expected Outputs**:

- `EC2InstanceProfileName` - Name of the instance profile
- `EC2InstanceRoleName` - Associated role name

### 3. IAM User and Policy Configuration Tests

#### Test: IAM User Creation

**Purpose**: Validates that test IAM user is created correctly.

**Validations**:

- User exists and contains environment suffix
- User details are retrievable

**Expected Outputs**:

- `TestIAMUserName` - Name of the test IAM user

#### Test: S3-Specific Policy Attachment

**Purpose**: Ensures IAM user has resource-specific S3 access policy.

**Validations**:

- User has inline policies attached
- Policy contains S3-related permissions
- Policy document is valid JSON

**Dynamic Discovery**: Tests automatically discover policy names by searching for keywords like "s3", "bucket", or "specific".

### 4. DynamoDB Table Configuration Tests

#### Test: DynamoDB Table Creation

**Purpose**: Verifies DynamoDB table is properly configured.

**Validations**:

- Table exists
- Table is in ACTIVE status
- Table name matches expected output

**Expected Outputs**:

- `TurnAroundPromptTableName` - Name of the DynamoDB table

### 5. Security Best Practices Validation Tests

#### Test: Principle of Least Privilege for EC2 Role

**Purpose**: Ensures EC2 role follows security best practices.

**Validations**:

- Limited number of managed policies (≤ 2)
- Has S3ReadOnlyAccess policy
- Contains explicit deny policies for security hardening

#### Test: Resource-Scoped IAM User Policies

**Purpose**: Validates that IAM user policies are scoped to specific resources.

**Validations**:

- User policies contain resource restrictions
- Policies are not overly permissive
- Resource ARNs are properly specified

## Error Handling

### Graceful Degradation

- Tests skip when required CloudFormation outputs are missing
- Warning messages are logged for missing configurations
- Dynamic discovery handles CDK-generated resource names

### Common Error Scenarios

1. **Missing Outputs**: Tests skip with warning when CloudFormation outputs are unavailable
2. **Resource Not Found**: Tests handle AWS API errors gracefully
3. **Policy Parsing**: JSON parsing errors are caught and handled

## Dynamic Resource Discovery

The tests use dynamic discovery patterns to handle CDK-generated resource names:

### Naming Pattern Matching

- **Environment Suffix**: All resources must contain the environment suffix
- **Keyword Search**: Policies are discovered using keywords like "s3", "bucket", "deny"
- **Flexible Matching**: Tests adapt to CDK's automatic name generation

### Discovery Strategies

```typescript
// Example: Finding S3-related policies
const policyName = PolicyNames?.find(
  name =>
    name.includes(environmentSuffix) ||
    name.toLowerCase().includes('s3') ||
    name.toLowerCase().includes('bucket') ||
    name.toLowerCase().includes('specific')
);
```

## Running the Tests

### Prerequisites

```bash
# Ensure CDK deployment outputs are available
cdk deploy --outputs-file cfn-outputs/outputs.json

# Set environment suffix (optional)
export ENVIRONMENT_SUFFIX=pr201
```

### Test Execution

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run with verbose output
npm test -- --verbose
```

## Security Validation Checklist

- [ ] S3 bucket has proper encryption (if configured)
- [ ] S3 bucket versioning is enabled (if configured)
- [ ] EC2 role has minimal required permissions
- [ ] EC2 role includes explicit deny policies
- [ ] IAM user policies are resource-scoped
- [ ] DynamoDB table is in active state
- [ ] All resources follow naming conventions
- [ ] No overly permissive policies are attached

## Troubleshooting

### Common Issues

1. **CloudFormation Outputs Missing**
   - Ensure CDK deployment completed successfully
   - Check `cfn-outputs/flat-outputs.json` exists and is valid JSON

2. **Resource Name Mismatches**
   - CDK generates unique names; tests use dynamic discovery
   - Verify environment suffix is correctly set

3. **AWS Permissions**
   - Ensure test execution has sufficient IAM permissions
   - Required permissions: IAM read, S3 read, DynamoDB read

4. **Network Connectivity**
   - Tests require internet access to AWS APIs
   - Verify AWS credentials are properly configured

## Test Coverage

The integration tests provide comprehensive coverage of:

- **Resource Creation**: All specified resources are created
- **Security Configuration**: Proper IAM policies and permissions
- **Best Practices**: Adherence to AWS security guidelines
- **Environment Isolation**: Resources are properly tagged/named
