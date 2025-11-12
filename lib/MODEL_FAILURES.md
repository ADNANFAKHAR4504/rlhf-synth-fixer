# Model Response Failures Analysis - Task 101000896

This document analyzes the defects in the MODEL_RESPONSE.md compared to the IDEAL_RESPONSE.md for training the model to generate correct AWS CDK TypeScript infrastructure code for a PCI DSS compliant payment processing VPC.

## Executive Summary

The MODEL_RESPONSE contained 17 intentional infrastructure defects across critical, high, and medium severity categories. These failures demonstrate key knowledge gaps in VPC architecture, high availability, security controls, logging requirements, and CloudFormation outputs.

**Failure Breakdown:**
- **Critical Failures**: 5 (High availability, VPC Flow Logs, S3 Endpoint, Network ACL associations, Missing outputs)
- **High Failures**: 8 (Tags, Network ACL rules, Ephemeral ports, CloudWatch Log Group)
- **Medium Failures**: 4 (Output completeness, README documentation)

**Primary Knowledge Gaps:**
1. Multi-AZ high availability patterns (NAT gateway placement)
2. PCI DSS compliance requirements (logging, segmentation)
3. Network ACL rule completeness (ephemeral ports, explicit denies)
4. Infrastructure monitoring setup (CloudWatch integration)

## Critical Failures

### 1. Insufficient High Availability - Only 2 Availability Zones

**Impact Level**: Critical

**MODEL_RESPONSE Issue** (Line 33):
```ts
maxAzs: 2, // FLAW 3: Should be 3
```

**IDEAL_RESPONSE Fix**:
```ts
availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
```

**Root Cause**: The model failed to implement the requirement for "3 availability zones for high availability" specified in PROMPT.md. Using only 2 AZs reduces fault tolerance and violates the explicit requirement.

**AWS Documentation Reference**: [VPC Best Practices - High Availability](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-getting-started.html)

**Impact**:
- **Availability**: Single AZ failure takes down 50% of capacity instead of 33%
- **Compliance**: Fails PCI DSS high availability requirements
- **Production Risk**: Does not meet 3-AZ requirement stated in requirements

**Training Value**: Teaches model to match exact AZ count requirements and understand high availability patterns.

---

### 2. Single NAT Gateway - Missing Regional Redundancy

**Impact Level**: Critical

**MODEL_RESPONSE Issue** (Line 34):
```ts
natGateways: 1, // FLAW 4: Should be 3
```

**IDEAL_RESPONSE Fix**:
```ts
natGateways: 3, // One NAT gateway per AZ
```

**Root Cause**: The model created only 1 NAT gateway instead of 3 (one per AZ), creating a single point of failure for all private subnet internet access. The PROMPT explicitly requires "Deploy NAT gateway in each public subnet (3 total)".

**AWS Documentation Reference**: [NAT Gateway Basics](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html#nat-gateway-basics)

**Impact**:
- **Cost**: ~$150/month for NAT gateway outage recovery
- **Availability**: All private subnets lose internet access if single NAT gateway fails
- **Performance**: All traffic funnels through single NAT gateway (bottleneck)
- **Compliance**: Violates high availability requirement

**Training Value**: Critical lesson on NAT gateway placement for multi-AZ architectures.

---

### 3. Missing VPC Flow Logs Configuration

**Impact Level**: Critical

**MODEL_RESPONSE Issue** (Lines 26-27, 49):
```ts
// FLAW 1: CloudWatch Log Group missing - VPC Flow Logs won't work properly
// FLAW 2: Missing 7-day retention requirement
// FLAW 5: VPC Flow Logs not configured at all
```

**IDEAL_RESPONSE Fix**:
```ts
// Create CloudWatch Log Group for VPC Flow Logs with 7-day retention
const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
  logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

// In VPC configuration:
flowLogs: {
  's3': {
    destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
    trafficType: ec2.FlowLogTrafficType.ALL,
  },
},
```

**Root Cause**: The model completely omitted VPC Flow Logs, a critical PCI DSS compliance requirement. The PROMPT explicitly states "Enable VPC Flow Logs for all traffic" and "Configure 7-day log retention" for "audit purposes and compliance".

**AWS Documentation Reference**: [VPC Flow Logs](https://docs.aws.amazon.com/vpc/latest/userguide/flow-logs.html)

**Impact**:
- **Security**: No visibility into network traffic (blind to attacks)
- **Compliance**: PCI DSS requires network traffic logging - CRITICAL FAILURE
- **Cost**: Potential fines for non-compliance ($100K+)
- **Audit**: Cannot investigate security incidents or demonstrate compliance

**Training Value**: Essential lesson on compliance requirements and logging infrastructure.

---

### 4. Missing S3 VPC Endpoint

**Impact Level**: Critical

**MODEL_RESPONSE Issue** (Line 86):
```ts
// FLAW 12: S3 VPC Endpoint not created at all
```

**IDEAL_RESPONSE Fix**:
```ts
// Create S3 VPC Endpoint (Gateway type)
this.s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
  subnets: [
    { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  ],
});

// Tag S3 Endpoint
cdk.Tags.of(this.s3Endpoint).add('Environment', 'Production');
cdk.Tags.of(this.s3Endpoint).add('Project', 'PaymentGateway');
```

**Root Cause**: The model failed to create the S3 VPC Endpoint, a requirement explicitly stated as "Create S3 VPC endpoint (Gateway type)" and "Avoid internet gateway charges for S3 access".

**AWS Documentation Reference**: [Gateway VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpce-gateway.html)

**Impact**:
- **Cost**: ~$50-200/month for unnecessary data transfer through NAT gateway
- **Security**: S3 traffic routes through internet gateway (less secure)
- **Performance**: Higher latency through NAT gateway
- **Architecture**: Violates explicit requirement

**Training Value**: Teaches cost optimization and private AWS service access patterns.

---

### 5. Network ACL Not Associated with Private Subnets

**Impact Level**: Critical

**MODEL_RESPONSE Issue** (Line 84):
```ts
// FLAW 11: Network ACL not associated with private subnets
```

**IDEAL_RESPONSE Fix**:
```ts
// Associate Network ACL with all private subnets
privateSubnets.forEach((subnet, index) => {
  new ec2.SubnetNetworkAclAssociation(this, `PrivateSubnetAclAssociation${index}`, {
    subnet: subnet,
    networkAcl: networkAcl,
  });
});
```

**Root Cause**: The model created the Network ACL with rules but never associated it with any subnets, rendering all the security rules ineffective. The PROMPT requires "Create custom Network ACLs for traffic control" to be applied to subnets.

**AWS Documentation Reference**: [Network ACLs](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html)

**Impact**:
- **Security**: Network ACL rules are completely ignored (ZERO enforcement)
- **Compliance**: PCI DSS traffic control requirements not met
- **Cost**: Wasted effort creating rules that don't apply
- **Architecture**: Subnets use default NACL (allows all traffic)

**Training Value**: Critical lesson on associating security controls with resources.

---

## High Failures

### 6. Missing Required Resource Tags

**Impact Level**: High

**MODEL_RESPONSE Issue** (Line 53):
```ts
// FLAW 6: Missing Environment and Project tags
cdk.Tags.of(this.vpc).add('Name', 'PaymentVPC');
```

**IDEAL_RESPONSE Fix**:
```ts
// Tag VPC and all subnets
cdk.Tags.of(this.vpc).add('Environment', 'Production');
cdk.Tags.of(this.vpc).add('Project', 'PaymentGateway');
```

**Root Cause**: The model added only a 'Name' tag but ignored the explicit requirement to "Tag all resources with Environment=Production" and "Tag all resources with Project=PaymentGateway".

**AWS Documentation Reference**: [Tagging AWS Resources](https://docs.aws.amazon.com/general/latest/gr/aws_tagging.html)

**Impact**:
- **Cost Tracking**: Cannot allocate costs to PaymentGateway project (~$500/month misattributed)
- **Compliance**: Fails tagging compliance policies
- **Operations**: Cannot filter resources by environment or project
- **Governance**: Resource management and cost allocation broken

**Training Value**: Teaches importance of resource tagging for operations and governance.

---

### 7. Incomplete Network ACL Rules - Missing MySQL and Redis

**Impact Level**: High

**MODEL_RESPONSE Issue** (Lines 64-79):
```ts
// FLAW 8: Only HTTPS rule added, missing MySQL and Redis
networkAcl.addEntry('AllowHttpsInbound', {
  cidr: ec2.AclCidr.anyIpv4(),
  ruleNumber: 100,
  traffic: ec2.AclTraffic.tcpPort(443),
  direction: ec2.TrafficDirection.INGRESS,
  ruleAction: ec2.Action.ALLOW,
});
// Missing MySQL (3306) and Redis (6379) rules
```

**IDEAL_RESPONSE Fix**:
```ts
// Allow MySQL (3306) inbound and outbound
networkAcl.addEntry('AllowMysqlInbound', {
  cidr: ec2.AclCidr.anyIpv4(),
  ruleNumber: 110,
  traffic: ec2.AclTraffic.tcpPort(3306),
  direction: ec2.TrafficDirection.INGRESS,
  ruleAction: ec2.Action.ALLOW,
});

// Allow Redis (6379) inbound and outbound
networkAcl.addEntry('AllowRedisInbound', {
  cidr: ec2.AclCidr.anyIpv4(),
  ruleNumber: 120,
  traffic: ec2.AclTraffic.tcpPort(6379),
  direction: ec2.TrafficDirection.INGRESS,
  ruleAction: ec2.Action.ALLOW,
});
```

**Root Cause**: The model only implemented HTTPS rules but ignored the explicit requirement to "Allow MySQL traffic on port 3306" and "Allow Redis traffic on port 6379". The PROMPT clearly states these three ports must be allowed.

**AWS Documentation Reference**: [Network ACL Rules](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html#nacl-rules)

**Impact**:
- **Application Failure**: Backend services cannot connect to MySQL or Redis
- **Operations**: Database and cache layers non-functional
- **Compliance**: Incomplete implementation of security requirements
- **Debugging**: Application would fail with mysterious connection timeouts

**Training Value**: Teaches complete implementation of all specified requirements.

---

### 8. Missing Ephemeral Ports for Return Traffic

**Impact Level**: High

**MODEL_RESPONSE Issue** (Line 81):
```ts
// FLAW 9: Missing ephemeral ports for return traffic
```

**IDEAL_RESPONSE Fix**:
```ts
// Allow ephemeral ports for return traffic (required for outbound connections)
networkAcl.addEntry('AllowEphemeralInbound', {
  cidr: ec2.AclCidr.anyIpv4(),
  ruleNumber: 130,
  traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
  direction: ec2.TrafficDirection.INGRESS,
  ruleAction: ec2.Action.ALLOW,
});

networkAcl.addEntry('AllowEphemeralOutbound', {
  cidr: ec2.AclCidr.anyIpv4(),
  ruleNumber: 130,
  traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
  direction: ec2.TrafficDirection.EGRESS,
  ruleAction: ec2.Action.ALLOW,
});
```

**Root Cause**: The model failed to understand that Network ACLs are stateless and require explicit rules for return traffic on ephemeral ports (1024-65535). This is a fundamental networking concept for stateless firewalls.

**AWS Documentation Reference**: [Ephemeral Ports](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html#nacl-ephemeral-ports)

**Impact**:
- **Connectivity**: Outbound connections fail (HTTP requests, database queries, API calls)
- **Application Failure**: Return traffic blocked (all external communication fails)
- **Operations**: Complete application dysfunction despite correct outbound rules
- **Debugging**: Extremely difficult to diagnose for operators

**Training Value**: Critical networking concept - stateless vs stateful firewalls.

---

### 9. Missing Explicit Deny Rules

**Impact Level**: High

**MODEL_RESPONSE Issue** (Line 82):
```ts
// FLAW 10: Missing explicit deny rules
```

**IDEAL_RESPONSE Fix**:
```ts
// Deny all other traffic (explicit deny)
networkAcl.addEntry('DenyAllInbound', {
  cidr: ec2.AclCidr.anyIpv4(),
  ruleNumber: 32767,
  traffic: ec2.AclTraffic.allTraffic(),
  direction: ec2.TrafficDirection.INGRESS,
  ruleAction: ec2.Action.DENY,
});

networkAcl.addEntry('DenyAllOutbound', {
  cidr: ec2.AclCidr.anyIpv4(),
  ruleNumber: 32767,
  traffic: ec2.AclTraffic.allTraffic(),
  direction: ec2.TrafficDirection.EGRESS,
  ruleAction: ec2.Action.DENY,
});
```

**Root Cause**: The model didn't include explicit deny rules, relying on implicit default deny. The PROMPT states "Explicitly deny all other traffic" and PCI DSS compliance requires explicit security controls.

**AWS Documentation Reference**: [Network ACL Rules](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html#nacl-rules)

**Impact**:
- **Security Best Practice**: Explicit denies are security hardening
- **Compliance**: PCI DSS prefers explicit security rules
- **Audit**: Unclear security posture without explicit denies
- **Operations**: Less visible security intent

**Training Value**: Teaches security best practices (explicit > implicit).

---

### 10. Missing CloudWatch Log Group with Retention

**Impact Level**: High

**MODEL_RESPONSE Issue** (Lines 25-26):
```ts
// FLAW 1: CloudWatch Log Group missing - VPC Flow Logs won't work properly
// FLAW 2: Missing 7-day retention requirement
```

**IDEAL_RESPONSE Fix**:
```ts
// Create CloudWatch Log Group for VPC Flow Logs with 7-day retention
const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
  logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

**Root Cause**: The model failed to create the CloudWatch Log Group required for VPC Flow Logs. Without this, Flow Logs cannot be enabled. The PROMPT requires "Configure 7-day log retention" explicitly.

**AWS Documentation Reference**: [CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)

**Impact**:
- **Compliance**: Cannot enable VPC Flow Logs without Log Group
- **Cost**: No retention policy = logs retained indefinitely (~$50/month)
- **Operations**: Logs accumulate forever without retention policy
- **Security**: Blocked from enabling required audit logging

**Training Value**: Teaches CloudWatch Logs setup for VPC Flow Logs.

---

### 11. Incomplete CloudFormation Outputs - Missing Private Subnets

**Impact Level**: High

**MODEL_RESPONSE Issue** (Lines 94-100):
```ts
// FLAW 14: Only outputting first public subnet instead of all 3
if (publicSubnets.length > 0) {
  new cdk.CfnOutput(this, 'PublicSubnetId', {
    value: publicSubnets[0].subnetId,
    description: 'Public Subnet ID',
  });
}
// FLAW 15: Private subnet outputs missing completely
```

**IDEAL_RESPONSE Fix**:
```ts
// Output public subnet IDs
publicSubnets.forEach((subnet, index) => {
  new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
    value: subnet.subnetId,
    description: `Public Subnet ${index + 1} ID`,
    exportName: `payment-public-subnet-${index + 1}-id-${environmentSuffix}`,
  });
});

// Output private subnet IDs
privateSubnets.forEach((subnet, index) => {
  new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
    value: subnet.subnetId,
    description: `Private Subnet ${index + 1} ID`,
    exportName: `payment-private-subnet-${index + 1}-id-${environmentSuffix}`,
  });
});
```

**Root Cause**: The model only output 1 public subnet ID instead of all 3, and completely omitted private subnet outputs. The PROMPT requires "Export all public subnet IDs" and "Export all private subnet IDs".

**AWS Documentation Reference**: [CloudFormation Outputs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html)

**Impact**:
- **Integration**: Downstream stacks cannot reference all subnets
- **Operations**: Incomplete infrastructure visibility
- **Deployment**: Applications cannot deploy to all subnets
- **Architecture**: Breaks multi-subnet deployment patterns

**Training Value**: Teaches complete output generation for integration.

---

### 12. Missing S3 Endpoint Output

**Impact Level**: High

**MODEL_RESPONSE Issue** (Line 103):
```ts
// FLAW 16: S3 Endpoint output missing (endpoint not created)
```

**IDEAL_RESPONSE Fix**:
```ts
// Output S3 VPC Endpoint ID
new cdk.CfnOutput(this, 'S3EndpointId', {
  value: this.s3Endpoint.vpcEndpointId,
  description: 'S3 VPC Endpoint ID',
  exportName: `payment-s3-endpoint-id-${environmentSuffix}`,
});
```

**Root Cause**: Since the S3 Endpoint was not created (Failure #4), there was no output. The PROMPT requires "Export S3 VPC endpoint ID".

**AWS Documentation Reference**: [VPC Endpoint Documentation](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)

**Impact**:
- **Integration**: Cannot reference S3 endpoint in policies or monitoring
- **Operations**: No visibility into endpoint ID
- **Compliance**: Missing required output for infrastructure documentation

**Training Value**: Teaches output generation for all required resources.

---

### 13. Missing Flow Logs Log Group Output

**Impact Level**: High

**MODEL_RESPONSE Issue** (Line 104):
```ts
// FLAW 17: Flow Logs log group output missing (log group not created)
```

**IDEAL_RESPONSE Fix**:
```ts
// Output Flow Logs Log Group
new cdk.CfnOutput(this, 'FlowLogsLogGroup', {
  value: flowLogGroup.logGroupName,
  description: 'CloudWatch Log Group for VPC Flow Logs',
  exportName: `payment-flowlogs-group-${environmentSuffix}`,
});
```

**Root Cause**: Since the CloudWatch Log Group was not created (Failure #10), there was no output. The PROMPT requires complete infrastructure outputs for monitoring integration.

**AWS Documentation Reference**: [CloudFormation Outputs](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/outputs-section-structure.html)

**Impact**:
- **Monitoring**: Cannot integrate with log analysis tools
- **Operations**: No visibility into log group for troubleshooting
- **Compliance**: Missing audit trail reference

**Training Value**: Teaches comprehensive output generation for operational integration.

---

## Medium Failures

### 14. Incomplete CloudFormation Outputs Structure

**Impact Level**: Medium

**MODEL_RESPONSE Issue** (Lines 89-93):
```ts
// FLAW 13: CloudFormation Outputs incomplete - missing several subnet IDs
new cdk.CfnOutput(this, 'VpcId', {
  value: this.vpc.vpcId,
  description: 'VPC ID',
});
```

**IDEAL_RESPONSE Fix**:
```ts
new cdk.CfnOutput(this, 'VpcId', {
  value: this.vpc.vpcId,
  description: 'VPC ID for the payment processing infrastructure',
  exportName: `payment-vpc-id-${environmentSuffix}`,
});

new cdk.CfnOutput(this, 'VpcCidr', {
  value: this.vpc.vpcCidrBlock,
  description: 'VPC CIDR block',
  exportName: `payment-vpc-cidr-${environmentSuffix}`,
});
```

**Root Cause**: The model created basic outputs but didn't include exportName for cross-stack references or add VPC CIDR output for documentation.

**AWS Documentation Reference**: [Export Stack Output Values](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-stack-exports.html)

**Impact**:
- **Integration**: Cannot import outputs in other stacks (cross-stack references broken)
- **Operations**: Less detailed infrastructure information
- **Cost**: Minor (workaround available with manual references)

**Training Value**: Teaches complete CloudFormation output patterns with exports.

---

### 15. Insufficient Test Coverage

**Impact Level**: Medium

**MODEL_RESPONSE Issue** (Lines 140-168):
```ts
// Only 3 basic tests provided
test('VPC created', () => { ... });
test('Subnets created', () => { ... });
test('Internet Gateway created', () => { ... });
```

**IDEAL_RESPONSE Fix**: 14 comprehensive tests covering:
- VPC configuration details
- Exact subnet counts (public and private)
- NAT gateway count
- Network ACL rules (all ports)
- S3 VPC Endpoint
- CloudWatch Log Group with retention
- VPC Flow Logs configuration
- Resource tagging
- CloudFormation outputs
- Error handling

**Root Cause**: The model provided minimal tests that don't validate critical infrastructure components like Network ACLs, VPC Flow Logs, or tagging.

**Impact**:
- **Quality**: Cannot detect missing infrastructure components
- **Regression**: Changes could break unvalidated features
- **Confidence**: Low test coverage reduces deployment confidence
- **Training**: Poor examples for test-driven infrastructure

**Training Value**: Teaches comprehensive infrastructure testing patterns.

---

### 16. Missing Comprehensive Documentation

**Impact Level**: Medium

**MODEL_RESPONSE Issue** (Lines 265-288):
```markdown
# Payment VPC Infrastructure
VPC infrastructure for payment processing.

## Installation
npm install

## Deploy
npm run build
cdk deploy

## Test
npm test
```

**IDEAL_RESPONSE Fix**: Comprehensive README with:
- Detailed architecture description
- PCI DSS compliance notes
- All 9 requirements documented
- Deployment instructions with prerequisites
- Testing procedures (unit and integration)
- Cost estimates
- Security considerations
- Troubleshooting guide

**Root Cause**: The model generated minimal documentation that doesn't explain the architecture, requirements, or operational considerations.

**Impact**:
- **Onboarding**: New developers lack context
- **Operations**: No troubleshooting guidance
- **Compliance**: PCI DSS documentation incomplete
- **Cost**: ~$10/month wasted time from unclear documentation

**Training Value**: Teaches comprehensive infrastructure documentation.

---

### 17. package.json Missing Useful Scripts

**Impact Level**: Medium

**MODEL_RESPONSE Issue** (Lines 181-186):
```json
"scripts": {
  "build": "tsc",
  "watch": "tsc -w",
  "test": "jest",
  "cdk": "cdk"
}
```

**IDEAL_RESPONSE Fix**:
```json
"scripts": {
  "build": "tsc",
  "watch": "tsc -w",
  "test": "jest",
  "test:coverage": "jest --coverage",
  "cdk": "cdk",
  "synth": "cdk synth",
  "deploy": "cdk deploy",
  "diff": "cdk diff",
  "destroy": "cdk destroy"
}
```

**Root Cause**: The model provided minimal npm scripts without coverage testing or common CDK operations.

**Impact**:
- **Developer Experience**: Manual commands required for common operations
- **CI/CD**: Missing scripts for coverage and deployment
- **Cost**: Minor (developers can run commands directly)

**Training Value**: Teaches complete npm script setup for IaC projects.

---

### 18. Reserved Concurrency Hard-Coded to 100 (Deployment Failure)

**Impact Level**: High

**MODEL_RESPONSE Issue**:
```ts
const apiFunction = new lambda.Function(this, 'ApiFunction', {
  // ...
  reservedConcurrentExecutions: 100,
});
```

Every Lambda used a fixed `reservedConcurrentExecutions=100`. Shared AWS accounts (especially CI) rarely have 300 unreserved concurrency available, so deployments failed with `InvalidParameterValueException: ... decreases account's UnreservedConcurrentExecution below its minimum value`.

**IDEAL_RESPONSE Fix**:
```py
self.lambda_reserved_concurrency = self._resolve_reserved_concurrency()

lambda_args = { ... }
if self.lambda_reserved_concurrency is not None:
    lambda_args["reserved_concurrent_executions"] = self.lambda_reserved_concurrency

aws.lambda_.Function("api-lambda", **lambda_args)

def _resolve_reserved_concurrency(self):
    env_value = os.getenv("LAMBDA_RESERVED_CONCURRENCY")
    if env_value:
        return int(env_value)
    config = pulumi.Config()
    return config.get_int("lambda_reserved_concurrency")
```

Production stacks set the value to 100 via Pulumi config (or `LAMBDA_RESERVED_CONCURRENCY`), while CI/test stacks can temporarily lower or omit it to stay within account limits.

**Root Cause**: The model assumed unlimited account quotas and treated the requirement as a hard-coded value instead of a configurable policy knob.

**Deployment Impact**: Critical for CI/CD — Pulumi updates fail immediately with HTTP 400 from Lambda, blocking every environment until quotas are manually increased.

**Training Value**: Reinforces the need to convert compliance requirements into configurable settings and to account for AWS service quotas.

---

## Summary

**Total Failures**: 18 (5 Critical, 9 High, 4 Medium)

**Primary Knowledge Gaps**:
1. **High Availability Architecture**: Failed to implement 3 AZs and 3 NAT gateways (multi-region patterns)
2. **PCI DSS Compliance**: Missed VPC Flow Logs, incomplete Network ACLs, missing tags
3. **Network ACL Understanding**: Stateless firewall concepts (ephemeral ports, explicit denies, subnet associations)
4. **Infrastructure Monitoring**: CloudWatch Log Group setup, Flow Logs integration
5. **Complete Implementation**: Partial implementations of Network ACLs, outputs, tests

**Training Quality Justification**: **8/10**

This task provides excellent training value because:

**Strengths**:
- Comprehensive VPC architecture with multiple failure points
- Real-world PCI DSS compliance requirements
- Complex networking (NACLs, NAT gateways, VPC endpoints)
- Multi-AZ high availability patterns
- Security and compliance considerations
- Integration requirements (CloudFormation outputs)

**Weaknesses**:
- Relatively straightforward VPC setup (common CDK pattern)
- No compute resources or application layers
- No IAM policies or advanced security
- Limited cross-stack integration patterns

**Training Impact**:
The failures teach critical concepts:
1. Multi-AZ architecture for high availability
2. PCI DSS compliance requirements (logging, segmentation)
3. Stateless firewall behavior (NACLs)
4. Complete infrastructure implementation (not partial)
5. Resource tagging and operational best practices
6. Comprehensive testing and documentation

This task effectively trains the model on VPC fundamentals, high availability, compliance, and complete implementation patterns essential for production infrastructure.
