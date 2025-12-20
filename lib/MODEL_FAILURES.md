# Model Failures for Multi-Region Web Application

This document details the specific failures in the initial model response and how they were corrected.

## Critical Failure 1: AutoScaling and Load Balancer Usage

Model tried to use AutoScaling Groups and Application Load Balancers which are not available in LocalStack Community Edition.

Wrong approach:
```typescript
// NOT SUPPORTED IN LOCALSTACK COMMUNITY
const asg = new autoscaling.AutoScalingGroup(this, 'ASG', {
  vpc: props.vpc,
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
  machineImage: ec2.MachineImage.latestAmazonLinux2(),
  minCapacity: 2,
  maxCapacity: 6,
});

const alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
  vpc: props.vpc,
  internetFacing: true,
});
```

Fix: Use standalone EC2 instances deployed directly
```typescript
// Create 2 instances for basic redundancy
for (let i = 1; i <= 2; i++) {
  const instance = new ec2.Instance(this, `WebServer${i}`, {
    vpc: props.vpc,
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    machineImage: ec2.MachineImage.latestAmazonLinux2(),
    // ... other props
  });
}
```

Why this matters: LocalStack Community doesn't support AutoScaling or ELBv2, so attempting to use them causes deployment to fail. Using simple EC2 instances works in LocalStack while still demonstrating multi-instance deployment.

## Critical Failure 2: Private Subnets with NAT Gateways

Model created VPC with private subnets requiring NAT Gateways which cause issues in LocalStack.

Wrong approach:
```typescript
subnetConfiguration: [
  {
    name: 'public',
    subnetType: ec2.SubnetType.PUBLIC,
  },
  {
    name: 'private',
    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,  // Creates NAT Gateway
  },
],
```

Fix: Use only public subnets
```typescript
subnetConfiguration: [
  {
    name: 'public',
    subnetType: ec2.SubnetType.PUBLIC,
    cidrMask: 24,
  },
  // No private subnets needed for LocalStack
],
```

Why this matters: NAT Gateways have deployment issues in LocalStack. Public subnets work fine and simplify the architecture for LocalStack testing.

## Failure 3: Route 53 Health Checks and Failover

Model attempted to use Route 53 health checks for automatic failover which aren't fully supported in LocalStack.

Wrong approach:
```typescript
const healthCheck = new route53.HealthCheck(this, 'PrimaryHealthCheck', {
  type: route53.HealthCheckType.HTTPS,
  resourcePath: '/',
});

new route53.ARecord(this, 'PrimaryRecord', {
  zone: hostedZone,
  recordName: domainName,
  target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(alb)),
  failover: route53.FailoverType.PRIMARY,
});
```

Fix: Use simple CNAME records that can be manually updated
```typescript
new route53.CnameRecord(this, 'PrimaryRegionRecord', {
  zone: hostedZone,
  recordName: `primary.${domainName}`,
  domainName: 'primary-alb-placeholder.us-east-1.elb.amazonaws.com',
  ttl: cdk.Duration.minutes(5),
});
```

Why this matters: Health checks aren't functional in LocalStack, so the failover wouldn't work. Simple CNAME records work reliably and can be tested.

## Failure 4: VPC Flow Logs

Model added VPC Flow Logs which have limited support in LocalStack.

Wrong approach:
```typescript
new ec2.FlowLog(this, 'VPCFlowLog', {
  resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
  destination: ec2.FlowLogDestination.toCloudWatchLogs(),
  trafficType: ec2.FlowLogTrafficType.ALL,
});
```

Fix: Remove VPC Flow Logs for LocalStack
```typescript
// LocalStack: VPC Flow Logs removed (not fully supported)
// Commented out for LocalStack compatibility
```

Why this matters: VPC Flow Logs depend on CloudWatch Logs which has limited LocalStack support. Removing them prevents deployment issues.

## Failure 5: Too Many Availability Zones

Model used maxAzs: 3 which may exceed LocalStack's simulation capabilities.

Wrong:
```typescript
maxAzs: 3,
```

Fix:
```typescript
maxAzs: 2,  // Reduced to 2 AZs for LocalStack
```

Why this matters: LocalStack simulates AZs but using fewer keeps the deployment faster and more reliable.

## Failure 6: Missing RemovalPolicy

Model didn't include RemovalPolicy.DESTROY on resources, making cleanup difficult.

Wrong:
```typescript
const instance = new ec2.Instance(this, 'WebServer', {
  // ... props
});
// No removal policy
```

Fix:
```typescript
const instance = new ec2.Instance(this, 'WebServer', {
  // ... props
});
instance.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
```

Why this matters: Without RemovalPolicy.DESTROY, resources aren't cleaned up when the stack is destroyed, which is important for LocalStack testing where stacks are frequently created and destroyed.

## Summary of Required Changes

To make this LocalStack-compatible, the model needed to:

1. Replace AutoScaling Groups with standalone EC2 instances
2. Remove Application Load Balancers
3. Use only public subnets (no NAT Gateways)
4. Simplify Route 53 to basic CNAME records without health checks
5. Remove VPC Flow Logs
6. Reduce maxAzs from 3 to 2
7. Add RemovalPolicy.DESTROY to all stateful resources

All these changes maintain the core multi-region architecture while ensuring the infrastructure can actually deploy and run in LocalStack Community Edition.
