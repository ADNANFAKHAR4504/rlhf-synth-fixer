# Infrastructure Fixes Required for Production Deployment

## Critical Issue 1: IAM Role Assignment Error

### Problem
The original code attempted to assign an IAM role directly to the `BastionHostLinux` construct using a `role` property that doesn't exist:

```typescript
const bastionHost = new ec2.BastionHostLinux(this, `BastionHost${index + 1}`, {
  vpc: this.vpc,
  subnetSelection: { subnets: [subnet] },
  securityGroup: bastionSecurityGroup,
  role: bastionRole,  // ❌ This property doesn't exist
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
});
```

This would cause a TypeScript compilation error and deployment failure.

### Solution
The `BastionHostLinux` construct automatically creates its own IAM role. To add custom permissions, we must access the underlying instance and add policies to the existing role:

```typescript
const bastionHost = new ec2.BastionHostLinux(this, `BastionHost${index + 1}`, {
  vpc: this.vpc,
  subnetSelection: { subnets: [subnet] },
  securityGroup: bastionSecurityGroup,
  instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
});

// ✅ Add permissions to the auto-created role
bastionHost.instance.addToRolePolicy(new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'ssm:UpdateInstanceInformation',
    'ssm:SendCommand',
    'ssmmessages:CreateControlChannel',
    'ssmmessages:CreateDataChannel',
    'ssmmessages:OpenControlChannel',
    'ssmmessages:OpenDataChannel',
    'ec2messages:GetEndpoint',
    'ec2messages:GetMessages',
    'ec2messages:SendReply',
  ],
  resources: ['*'],
}));
```

## Critical Issue 2: Unused Bastion Role

### Problem
The original code created a custom IAM role for bastion hosts that was never used:

```typescript
const bastionRole = new iam.Role(this, 'BastionRole', {
  assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
  ],
  // ... additional inline policies
});
```

This creates unnecessary resources and potential confusion about which role is actually being used.

### Solution
Remove the unused role entirely and rely on the auto-created role from `BastionHostLinux`, adding only the necessary permissions through the instance's role policy.

## Critical Issue 3: Missing CloudFormation Outputs

### Problem
The original implementation didn't export the bastion host instance IDs, which are critical for:
- Integration testing
- Operations and monitoring
- Session Manager connections
- Troubleshooting

### Solution
Added CloudFormation outputs for each bastion host instance ID:

```typescript
this.bastionHosts.forEach((bastion, index) => {
  new cdk.CfnOutput(this, `BastionHost${index + 1}BastionHostId`, {
    value: bastion.instance.instanceId,
    description: `Bastion Host ${index + 1} Instance ID`,
  });
});
```

## Minor Issue 4: Unused Constructor Parameter

### Problem
The `SecurityStack` constructor accepted a `props` parameter but never used it:

```typescript
constructor(scope: Construct, id: string, props: SecurityStackProps) {
  super(scope, id);
  // props was never referenced in the constructor body
}
```

This triggers linting warnings and suggests incomplete implementation.

### Solution
Prefix the parameter with an underscore to indicate it's intentionally unused:

```typescript
constructor(scope: Construct, id: string, _props: SecurityStackProps) {
  super(scope, id);
}
```

## Impact Summary

These fixes ensure:
1. **Successful Deployment**: The infrastructure can actually be deployed without TypeScript or CloudFormation errors
2. **Proper IAM Configuration**: Bastion hosts have the correct permissions for Session Manager access
3. **Resource Efficiency**: No unnecessary IAM roles are created
4. **Operational Visibility**: All critical resource IDs are exported for monitoring and management
5. **Code Quality**: No linting warnings or unused variables

Without these fixes, the infrastructure would fail to compile and deploy, making it impossible to provision the secure production environment as requested.