# MODEL_FAILURES.md

## Infrastructure Issues, Fixes, and Lessons Learned

This document details the infrastructure issues encountered during the development and deployment of the secure multi-tier AWS environment, the fixes applied, and the lessons learned from each failure.

## 1. Environment Suffix Implementation Issues

### **Issue**: Environment suffix not properly applied to resource names
**Severity**: HIGH  
**Impact**: Resources not properly isolated between environments

**Problem Description**:
- The `environmentSuffix` was not being consistently applied to all resource names
- Some resources were using hardcoded names instead of dynamic naming
- This caused conflicts when deploying multiple environments

**Root Cause**:
- Inconsistent retrieval of `environmentSuffix` across different methods
- Some methods were using hardcoded values instead of the dynamic suffix
- Missing environment suffix in resource properties like `bucketName`, `logGroupName`, etc.

**Fix Applied**:
```typescript
// Before (problematic)
const logGroup = new logs.LogGroup(this, 'VPCFlowLogGroup', {
  logGroupName: '/aws/vpc/flowlogs/financial-platform',
  // ...
});

// After (fixed)
const environmentSuffix = this.node.tryGetContext('environmentSuffix') || 'prod';
const logGroup = new logs.LogGroup(this, `VPCFlowLogGroup${environmentSuffix}`, {
  logGroupName: `/aws/vpc/flowlogs/financial-platform-${environmentSuffix}`,
  // ...
});
```

**Lessons Learned**:
- Always use dynamic naming for all resources to support multi-environment deployments
- Implement consistent environment suffix retrieval pattern across all methods
- Test with different environment suffixes to ensure proper isolation

## 2. TypeScript Compilation Errors

### **Issue**: Multiple TypeScript compilation errors in CDK constructs
**Severity**: HIGH  
**Impact**: Build failures preventing deployment

**Problem Description**:
- `Property 'instanceArn' does not exist on type 'Instance'`
- `Property 'CfnResolverEndpoint' does not exist on type 'typeof import(...)'`
- `Namespace '...' has no exported member 'IConstruct'`
- Incorrect enum usage for Network ACL rules

**Root Cause**:
- Incorrect property access patterns for CDK constructs
- Missing imports for specific CDK modules
- Using deprecated or incorrect enum values

**Fix Applied**:
```typescript
// Before (problematic)
this.bastionHost.instanceArn

// After (fixed)
`arn:aws:ec2:${this.region}:${this.account}:instance/${this.bastionHost.instanceId}`

// Before (problematic)
import * as route53 from 'aws-cdk-lib/aws-route53';
route53.CfnResolverEndpoint

// After (fixed)
import * as route53resolver from 'aws-cdk-lib/aws-route53resolver';
route53resolver.CfnResolverEndpoint

// Before (problematic)
cdk.IConstruct

// After (fixed)
import { Construct, IConstruct } from 'constructs';
IConstruct

// Before (problematic)
ruleAction: ec2.Action.ALLOW

// After (fixed)
ruleAction: ec2.AclAction.ALLOW
```

**Lessons Learned**:
- Always use correct CDK construct property access patterns
- Import specific modules for specialized constructs
- Use correct enum values for CDK constructs
- Run `npm run build` frequently during development to catch errors early

## 3. Network ACL Configuration Errors

### **Issue**: Network ACL rules not properly configured
**Severity**: MEDIUM  
**Impact**: Network security rules not applied correctly

**Problem Description**:
- Network ACL entries missing required properties
- Incorrect enum usage for rule actions
- Missing CIDR specifications for rules

**Root Cause**:
- Incomplete understanding of Network ACL rule structure
- Using incorrect enum values for rule actions
- Missing required properties in rule definitions

**Fix Applied**:
```typescript
// Before (problematic)
dataNetworkAcl.addEntry('AllowPrivateInbound', {
  ruleNumber: 100,
  direction: ec2.TrafficDirection.INGRESS,
  traffic: ec2.AclTraffic.allTraffic(),
  ruleAction: ec2.Action.ALLOW,
});

// After (fixed)
dataNetworkAcl.addEntry(`AllowPrivateInbound${environmentSuffix}`, {
  ruleNumber: 100,
  direction: ec2.TrafficDirection.INGRESS,
  cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
  traffic: ec2.AclTraffic.allTraffic(),
  ruleAction: ec2.AclAction.ALLOW,
});
```

**Lessons Learned**:
- Network ACL rules require explicit CIDR specifications
- Use correct enum values (`AclAction` instead of `Action`)
- Include environment suffix in rule names for uniqueness

## 4. IAM Policy Configuration Issues

### **Issue**: IAM policies not properly configured for MFA enforcement
**Severity**: MEDIUM  
**Impact**: Security policy not enforced correctly

**Problem Description**:
- MFA policy not properly attached to bastion host role
- Incorrect ARN format for instance resources
- Missing policy attachment to roles

**Root Cause**:
- Incorrect ARN construction for EC2 instances
- Policy not properly associated with the correct role
- Missing policy attachment mechanism

**Fix Applied**:
```typescript
// Before (problematic)
new iam.Policy(this, `SessionManagerMFAPolicy${environmentSuffix}`, {
  statements: [
    new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: ['ssm:StartSession'],
      resources: [this.bastionHost.instanceArn],
      conditions: {
        BoolIfExists: {
          'aws:MultiFactorAuthPresent': 'false',
        },
      },
    }),
  ],
});

// After (fixed)
new iam.Policy(this, `SessionManagerMFAPolicy${environmentSuffix}`, {
  statements: [
    new iam.PolicyStatement({
      effect: iam.Effect.DENY,
      actions: ['ssm:StartSession'],
      resources: [`arn:aws:ec2:${this.region}:${this.account}:instance/${this.bastionHost.instanceId}`],
      conditions: {
        BoolIfExists: {
          'aws:MultiFactorAuthPresent': 'false',
        },
      },
    }),
  ],
});
```

**Lessons Learned**:
- Use correct ARN format for EC2 instance resources
- Ensure policies are properly attached to roles
- Test IAM policies with actual AWS service calls

## 5. Unit Test Configuration Issues

### **Issue**: Unit tests failing due to environment suffix not being set
**Severity**: MEDIUM  
**Impact**: Test failures preventing CI/CD pipeline success

**Problem Description**:
- Tests expecting "test" environment suffix but getting "prod" default
- Resource count mismatches due to incorrect expectations
- Test assertions not matching actual CloudFormation output

**Root Cause**:
- Tests not properly setting context for environment suffix
- Incorrect resource count expectations
- Test assertions too strict for CloudFormation template structure

**Fix Applied**:
```typescript
// Before (problematic)
beforeEach(() => {
  app = new cdk.App();
  stack = new TapStack(app, 'TestTapStack', {
    environmentSuffix: 'test',
    // ...
  });
});

// After (fixed)
beforeEach(() => {
  app = new cdk.App();
  app.node.setContext('environmentSuffix', 'test');
  stack = new TapStack(app, 'TestTapStack', {
    environmentSuffix: 'test',
    // ...
  });
});
```

**Lessons Learned**:
- Always set context in tests to ensure proper environment configuration
- Use flexible test assertions that match actual CloudFormation output
- Verify resource counts match actual implementation

## 6. CDK Deprecation Warnings

### **Issue**: Multiple CDK deprecation warnings
**Severity**: LOW  
**Impact**: Future compatibility issues

**Problem Description**:
- `VpcProps#cidr is deprecated. Use ipAddresses instead`
- `MachineImage#latestAmazonLinux is deprecated. use MachineImage.latestAmazonLinux2 instead`

**Root Cause**:
- Using deprecated CDK APIs
- Not keeping up with CDK version updates

**Fix Applied**:
```typescript
// Before (deprecated)
this.vpc = new ec2.Vpc(this, `SecureFinancialVPC${environmentSuffix}`, {
  cidr: '10.0.0.0/16',
  // ...
});

// After (updated)
this.vpc = new ec2.Vpc(this, `SecureFinancialVPC${environmentSuffix}`, {
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
  // ...
});

// Before (deprecated)
machineImage: ec2.MachineImage.latestAmazonLinux({
  generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
}),

// After (updated)
machineImage: ec2.MachineImage.latestAmazonLinux2(),
```

**Lessons Learned**:
- Keep CDK dependencies updated
- Address deprecation warnings proactively
- Use modern CDK APIs for better future compatibility

## 7. Resource Naming Conflicts

### **Issue**: Resource naming conflicts in CloudFormation
**Severity**: MEDIUM  
**Impact**: Deployment failures due to duplicate resource names

**Problem Description**:
- Multiple resources with same logical ID
- Network ACL entry names not unique
- Policy names conflicting

**Root Cause**:
- Not including environment suffix in all resource names
- Using static names instead of dynamic naming
- Missing uniqueness in resource identifiers

**Fix Applied**:
```typescript
// Before (problematic)
dataNetworkAcl.addEntry('AllowPrivateInbound', {
  // ...
});

// After (fixed)
dataNetworkAcl.addEntry(`AllowPrivateInbound${environmentSuffix}`, {
  // ...
});
```

**Lessons Learned**:
- Always use unique resource names across environments
- Include environment suffix in all resource identifiers
- Test resource naming in multiple environments

## 8. Security Group Configuration Issues

### **Issue**: Security group rules not properly configured
**Severity**: MEDIUM  
**Impact**: Network security not properly enforced

**Problem Description**:
- Missing security group ingress rules
- Incorrect port configurations
- Missing egress rule restrictions

**Root Cause**:
- Incomplete security group rule definitions
- Not following security best practices
- Missing outbound traffic restrictions

**Fix Applied**:
```typescript
// Before (problematic)
const bastionSecurityGroup = new ec2.SecurityGroup(this, `BastionSecurityGroup${environmentSuffix}`, {
  vpc: this.vpc,
  description: 'Security group for bastion host',
  allowAllOutbound: true, // Too permissive
});

// After (fixed)
const bastionSecurityGroup = new ec2.SecurityGroup(this, `BastionSecurityGroup${environmentSuffix}`, {
  vpc: this.vpc,
  description: 'Security group for bastion host - Session Manager only',
  allowAllOutbound: false, // Restrict outbound
});

// Only allow HTTPS for Session Manager
bastionSecurityGroup.addEgressRule(
  ec2.Peer.ipv4('0.0.0.0/0'),
  ec2.Port.tcp(443),
  'Allow HTTPS for Session Manager'
);
```

**Lessons Learned**:
- Follow principle of least privilege for security groups
- Explicitly define all required ingress and egress rules
- Restrict outbound traffic where possible

## 9. Lambda Function Configuration Issues

### **Issue**: Lambda functions not properly configured for failover
**Severity**: MEDIUM  
**Impact**: NAT failover not working correctly

**Problem Description**:
- Lambda function missing proper IAM permissions
- Incorrect environment variable configuration
- Missing CloudWatch alarm integration

**Root Cause**:
- Incomplete IAM policy for Lambda execution
- Missing environment variables for VPC context
- Not properly integrating with CloudWatch alarms

**Fix Applied**:
```typescript
// Before (problematic)
const natFailoverFunction = new lambda.Function(this, `NatFailoverFunction${environmentSuffix}`, {
  runtime: lambda.Runtime.PYTHON_3_9,
  handler: 'index.handler',
  code: lambda.Code.fromInline(`
    // Lambda code
  `),
  timeout: cdk.Duration.minutes(2),
});

// After (fixed)
const natFailoverFunction = new lambda.Function(this, `NatFailoverFunction${environmentSuffix}`, {
  runtime: lambda.Runtime.PYTHON_3_9,
  handler: 'index.handler',
  code: lambda.Code.fromInline(`
    // Lambda code
  `),
  timeout: cdk.Duration.minutes(2),
  environment: {
    VPC_ID: this.vpc.vpcId,
  },
});

// Grant proper permissions
natFailoverFunction.role?.attachInlinePolicy(new iam.Policy(this, `NatFailoverPolicy${environmentSuffix}`, {
  statements: [
    new iam.PolicyStatement({
      actions: [
        'ec2:DescribeInstances',
        'ec2:DescribeRouteTables',
        'ec2:ReplaceRoute',
        'ec2:CreateRoute',
        'ec2:DeleteRoute',
      ],
      resources: ['*'],
    }),
  ],
}));
```

**Lessons Learned**:
- Provide all necessary IAM permissions for Lambda functions
- Include environment variables for runtime context
- Test Lambda functions with actual AWS service calls

## 10. CloudWatch Integration Issues

### **Issue**: CloudWatch alarms not properly integrated with Lambda functions
**Severity**: MEDIUM  
**Impact**: Automated failover not working

**Problem Description**:
- CloudWatch alarms not triggering Lambda functions
- Missing Lambda permissions for CloudWatch invocation
- Incorrect alarm configuration

**Root Cause**:
- Missing Lambda permission for CloudWatch service
- Incorrect alarm action configuration
- Not properly binding alarm actions to Lambda functions

**Fix Applied**:
```typescript
// Before (problematic)
const statusCheckAlarm = new cloudwatch.Alarm(this, `NatStatusCheckAlarm${environmentSuffix}${index}`, {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/EC2',
    metricName: 'StatusCheckFailed',
    dimensionsMap: {
      InstanceId: instance.instanceId,
    },
    statistic: 'Maximum',
    period: cdk.Duration.minutes(1),
  }),
  threshold: 1,
  evaluationPeriods: 2,
  alarmDescription: `NAT instance ${index + 1} status check failed`,
});

// After (fixed)
const statusCheckAlarm = new cloudwatch.Alarm(this, `NatStatusCheckAlarm${environmentSuffix}${index}`, {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/EC2',
    metricName: 'StatusCheckFailed',
    dimensionsMap: {
      InstanceId: instance.instanceId,
    },
    statistic: 'Maximum',
    period: cdk.Duration.minutes(1),
  }),
  threshold: 1,
  evaluationPeriods: 2,
  alarmDescription: `NAT instance ${index + 1} status check failed`,
});

// Add Lambda as alarm action
statusCheckAlarm.addAlarmAction({
  bind: () => ({
    alarmActionArn: natFailoverFunction.functionArn,
  }),
});

// Grant Lambda permission to be invoked by CloudWatch
natFailoverFunction.grantInvoke(new iam.ServicePrincipal('lambda.alarms.cloudwatch.amazonaws.com'));
```

**Lessons Learned**:
- Always grant proper permissions for CloudWatch to invoke Lambda functions
- Use correct service principal for CloudWatch integration
- Test alarm-triggered Lambda functions in actual AWS environment

## Summary of Key Lessons Learned

1. **Environment Management**: Always use dynamic naming and environment suffixes for multi-environment support
2. **CDK Best Practices**: Use correct CDK construct patterns and keep dependencies updated
3. **Security**: Follow principle of least privilege and implement proper security controls
4. **Testing**: Write comprehensive tests and verify them with actual CloudFormation output
5. **Error Handling**: Address compilation errors and warnings proactively
6. **Resource Naming**: Ensure unique resource names across environments
7. **IAM Permissions**: Provide all necessary permissions for AWS service integrations
8. **Monitoring**: Properly integrate CloudWatch with Lambda functions for automation
9. **Documentation**: Document all fixes and lessons learned for future reference
10. **Iterative Development**: Test frequently and fix issues as they arise

## Prevention Strategies

1. **Code Reviews**: Implement thorough code reviews focusing on CDK best practices
2. **Automated Testing**: Use comprehensive unit and integration tests
3. **Environment Validation**: Test deployments in multiple environments
4. **Security Audits**: Regular security reviews of IAM policies and network configurations
5. **Documentation**: Maintain up-to-date documentation of all configurations
6. **Monitoring**: Implement comprehensive monitoring and alerting
7. **Backup Strategies**: Implement proper backup and disaster recovery procedures
8. **Version Control**: Use proper version control and change management processes

This document serves as a reference for future infrastructure development and helps prevent similar issues from occurring in subsequent projects.