# MODEL_FAILURES.md

## Overview

This document catalogs common failure patterns and anti-patterns that models might produce when implementing the VPC infrastructure using CDKTF in TypeScript. Understanding these failures helps improve model training and ensures compliance with AWS best practices.

---

## Common Model Failures

### 1. Missing Service Connectivity Patterns

**Failure Description:**
Model fails to establish proper connections between network components.

**Examples of Failures:**
- Internet Gateway created but not attached to VPC
- NAT Gateway exists but no route from private subnets
- VPC Flow Logs configured without IAM role attachment
- Route tables created but not associated with subnets

**Impact:**
- Resources cannot communicate as intended
- Private subnets lack internet egress capability
- Network traffic monitoring is non-functional
- Deployment succeeds but infrastructure is broken

**Correct Implementation:**
- Internet Gateway must be explicitly attached to VPC
- Route tables must include routes pointing to gateways
- Subnets must be associated with appropriate route tables
- VPC Flow Logs require IAM role with proper trust policy

---

### 2. Insufficient High Availability Configuration

**Failure Description:**
Model deploys resources in single availability zone instead of multiple AZs.

**Examples of Failures:**
- All subnets created in same availability zone (us-east-1a only)
- Single subnet for public or private tier
- NAT Gateway redundancy not considered for critical workloads
- Hardcoded availability zones instead of dynamic assignment

**Impact:**
- Single point of failure violates production requirements
- Zone-level outages cause complete service disruption
- Does not meet AWS Well-Architected Framework standards
- Fails compliance checks for resilience

**Correct Implementation:**
- Minimum 2 availability zones (us-east-1a, us-east-1b)
- Separate public and private subnets in each AZ
- Dynamic AZ assignment using index-based logic
- Consider NAT Gateway redundancy for critical production systems

---

### 3. IAM Permission Misconfigurations

**Failure Description:**
Model creates overly permissive IAM policies or fails to properly scope permissions.

**Examples of Failures:**
- IAM policy uses `Resource: '*'` instead of specific log group ARN
- Missing trust policy allowing VPC Flow Logs service to assume role
- Incorrect service principal in assume role policy
- Actions include unnecessary permissions beyond logs:CreateLogStream and logs:PutLogEvents

**Impact:**
- Security audit failures
- Violates principle of least privilege
- VPC Flow Logs service cannot assume role (deployment fails)
- Potential unauthorized access to CloudWatch logs

**Correct Implementation:**
```typescript
// Correct IAM role policy with specific resource ARN
const flowLogPolicy = new IamRolePolicy(this, 'flow-log-policy', {
  role: flowLogRole.name,
  policy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: [
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      Resource: logGroup.arn
    }]
  })
});
```

---

### 4. Missing or Incorrect Resource Tagging

**Failure Description:**
Model fails to apply consistent tags or omits environment identification tags.

**Examples of Failures:**
- No tags applied to resources
- Inconsistent tag keys (Environment vs environment vs Env)
- Missing Environment: Production tag requirement
- Tags applied individually instead of using provider defaultTags
- Tag values not matching specification

**Impact:**
- Cost allocation and tracking failures
- Resource management and organization issues
- Compliance violations for environment identification
- Difficulty filtering resources in AWS console

**Correct Implementation:**
- Use AWS Provider defaultTags for consistency
- Apply Environment: Production tag as specified
- Ensure all resources inherit default tags
- Additional resource-specific tags where needed

---

### 5. CloudWatch Logs Configuration Issues

**Failure Description:**
Model incorrectly configures log retention or log group settings.

**Examples of Failures:**
- Log retention period not set (defaults to never expire)
- Retention set to incorrect value (not 30 days as required)
- Log group created without proper naming convention
- Missing log group entirely while configuring flow logs

**Impact:**
- Excessive log storage costs from infinite retention
- Compliance violations for log management
- VPC Flow Logs fail to create without valid log destination
- Audit trail requirements not met

**Correct Implementation:**
```typescript
const logGroup = new CloudwatchLogGroup(this, 'vpc-flow-logs', {
  name: '/aws/vpc/flow-logs',
  retentionInDays: 30
});
```

---

### 6. Route Table Configuration Errors

**Failure Description:**
Model creates route tables but fails to configure proper routes or associations.

**Examples of Failures:**
- Public route table missing route to Internet Gateway (0.0.0.0/0)
- Private route table missing route to NAT Gateway
- Route tables not associated with correct subnets
- Multiple default routes causing conflicts
- Route destination not properly configured

**Impact:**
- Subnets remain isolated without internet connectivity
- Public subnets cannot receive inbound traffic
- Private subnets cannot initiate outbound connections
- Deployment succeeds but networking is broken

**Correct Implementation:**
- Public route table: 0.0.0.0/0 -> Internet Gateway
- Private route table: 0.0.0.0/0 -> NAT Gateway
- Each subnet explicitly associated with appropriate route table
- Route targets reference gateway IDs, not names

---

### 7. NAT Gateway Dependencies Not Handled

**Failure Description:**
Model fails to properly sequence NAT Gateway creation with dependencies.

**Examples of Failures:**
- NAT Gateway created without Elastic IP
- NAT Gateway placed in private subnet instead of public
- Routes to NAT Gateway created before gateway exists
- Missing explicit depends_on relationships

**Impact:**
- Terraform/CDKTF dependency resolution failures
- NAT Gateway creation fails without public IP
- Private subnet routing broken
- Intermittent deployment failures

**Correct Implementation:**
```typescript
// Create Elastic IP first
const eip = new Eip(this, 'nat-eip', {
  domain: 'vpc'
});

// NAT Gateway depends on EIP and must be in public subnet
const natGateway = new NatGateway(this, 'nat-gateway', {
  allocationId: eip.id,
  subnetId: publicSubnets[0].id
});
```

---

### 8. Provider Configuration Issues

**Failure Description:**
Model misconfigures AWS provider or omits region specification.

**Examples of Failures:**
- AWS region not specified (defaults to incorrect region)
- Region hardcoded instead of using variable
- LocalStack endpoints not properly configured for testing
- Provider configuration duplicates tags unnecessarily

**Impact:**
- Resources deployed to wrong region
- LocalStack integration tests fail
- Tag duplication across resources
- Deployment targets incorrect environment

**Correct Implementation:**
```typescript
const awsProviderConfig = {
  region: awsRegion,
  defaultTags: defaultTags
};

new AwsProvider(this, 'aws', awsProviderConfig);
```

---

### 9. Subnet CIDR Block Misconfigurations

**Failure Description:**
Model assigns overlapping or incorrect CIDR blocks to subnets.

**Examples of Failures:**
- Multiple subnets using same CIDR block
- CIDR blocks outside VPC CIDR range
- Insufficient IP space allocation per subnet
- Hardcoded CIDR blocks without parameterization
- CIDR calculations incorrect for multiple subnets

**Impact:**
- Subnet creation fails due to overlap
- IP address exhaustion in production
- Routing conflicts between subnets
- Deployment errors

**Correct Implementation:**
- VPC CIDR: 10.0.0.0/16
- Public subnets: 10.0.1.0/24, 10.0.2.0/24
- Private subnets: 10.0.11.0/24, 10.0.12.0/24
- No overlapping ranges
- Sufficient IP space for workloads

---

### 10. State Backend Configuration Omissions

**Failure Description:**
Model fails to configure proper Terraform state backend for production use.

**Examples of Failures:**
- No S3 backend configured (state stored locally)
- S3 bucket region incorrect or not specified
- State locking not enabled
- Backend configuration hardcoded without variables

**Impact:**
- State file not shared across team
- Concurrent modifications cause state corruption
- No state versioning or backup
- Production deployments unsafe

**Correct Implementation:**
```typescript
new S3Backend(this, {
  bucket: stateBucket,
  key: `${stackName}.tfstate`,
  region: stateBucketRegion
});
```

---

## Testing Failures

### Syntax and Type Errors

**Common Issues:**
- TypeScript compilation errors
- Missing imports for CDKTF constructs
- Incorrect property types passed to resources
- Undefined variables or properties

### Linting Failures

**Common Issues:**
- Prettier formatting violations
- ESLint rule violations
- Unused imports
- Inconsistent code style

### Unit Test Failures

**Common Issues:**
- Missing test coverage for resource creation
- Incorrect resource count assertions
- Property value mismatches
- Dependencies not properly mocked

---

## Prevention Strategies

1. **Follow AWS Well-Architected Framework** principles
2. **Use explicit resource dependencies** to control creation order
3. **Implement least-privilege IAM policies** with specific ARNs
4. **Apply consistent tagging strategy** using provider defaults
5. **Test multi-AZ deployments** to ensure high availability
6. **Validate CIDR block assignments** before deployment
7. **Configure proper logging retention** to meet compliance
8. **Document service connectivity patterns** clearly
9. **Run linting and type checks** before committing code
10. **Perform integration tests** in LocalStack or test account

---

## Last Updated

**2025-12-23** — Comprehensive failure catalog for VPC infrastructure implementation