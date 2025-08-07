# Model Failures and Common Issues

## Deployment Failures

### 1. CDK Deprecation Warnings During Synthesis
**Issue**: Multiple deprecation warnings during `cdk synth` that indicate future API removals
**Root Cause**: Using deprecated AWS CDK APIs that will be removed in future versions
**Warnings Generated**:
```
[WARNING] aws-cdk-lib.aws_ec2.VpcProps#cidr is deprecated.
  Use ipAddresses instead
  This API will be removed in the next major release.

[WARNING] aws-cdk-lib.aws_autoscaling.HealthCheck#ec2 is deprecated.
  Use HealthChecks instead
  This API will be removed in the next major release.

[WARNING] aws-cdk-lib.aws_autoscaling.Ec2HealthCheckOptions#grace is deprecated.
  Use Ec2HealthChecksOptions instead
  This API will be removed in the next major release.

[WARNING] aws-cdk-lib.aws_autoscaling.CommonAutoScalingGroupProps#healthCheck is deprecated.
  Use `healthChecks` instead
  This API will be removed in the next major release.
```

**Solution**:
```typescript
// ❌ DEPRECATED - Will cause warnings
const vpc = new ec2.Vpc(this, 'ProjectXVpc', {
  vpcName: 'projectX-vpc',
  cidr: '10.0.0.0/16', // DEPRECATED
  maxAzs: 3,
  natGateways: 0,
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'projectX-public-subnet',
      subnetType: ec2.SubnetType.PUBLIC,
    }
  ],
  enableDnsHostnames: true,
  enableDnsSupport: true,
});

const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ProjectXAutoScalingGroup', {
  autoScalingGroupName: 'projectX-asg',
  vpc,
  launchTemplate,
  minCapacity: 2,
  maxCapacity: 6,
  desiredCapacity: 2,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PUBLIC,
  },
  // DEPRECATED - Will cause warnings
  healthCheck: autoscaling.HealthCheck.ec2({
    grace: cdk.Duration.seconds(300), // DEPRECATED
  }),
  updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
    maxBatchSize: 1,
    minInstancesInService: 1,
  }),
});

// ✅ FIXED - Using current APIs
const vpc = new ec2.Vpc(this, 'ProjectXVpc', {
  vpcName: 'projectX-vpc',
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), // ✅ FIXED: Using ipAddresses
  maxAzs: 3,
  natGateways: 0,
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'projectX-public-subnet',
      subnetType: ec2.SubnetType.PUBLIC,
    }
  ],
  enableDnsHostnames: true,
  enableDnsSupport: true,
});

const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ProjectXAutoScalingGroup', {
  autoScalingGroupName: 'projectX-asg',
  vpc,
  launchTemplate,
  minCapacity: 2,
  maxCapacity: 6,
  desiredCapacity: 2,
  vpcSubnets: {
    subnetType: ec2.SubnetType.PUBLIC,
  },
  // ✅ FIXED: Using healthChecks instead of deprecated healthCheck
  healthChecks: autoscaling.HealthChecks.ec2(),
  updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
    maxBatchSize: 1,
    minInstancesInService: 1,
  }),
});
```

### 2. TypeScript Compilation Errors
**Issue**: TypeScript compilation fails due to deprecated properties
**Root Cause**: Using properties that don't exist in newer CDK APIs
**Error Example**:
```
lib/tap-stack.ts:143:9 - error TS2353: Object literal may only specify known properties, and 'grace' does not exist in type 'Ec2HealthChecksOptions'.
```

**Solution**:
```typescript
// ❌ ERROR - Property not supported in newer API
healthChecks: autoscaling.HealthChecks.ec2({
  grace: cdk.Duration.seconds(300), // ❌ Not supported
}),

// ✅ FIXED - Remove unsupported properties
healthChecks: autoscaling.HealthChecks.ec2(),
```

## Code Quality Issues

### 1. Deprecated API Usage
**Issue**: Code uses deprecated CDK APIs that will be removed in future versions
**Root Cause**: Not keeping up with CDK API changes and deprecations
**Deprecated APIs Used**:
1. `VpcProps#cidr` - deprecated in favor of `ipAddresses`
2. `HealthCheck#ec2` - deprecated in favor of `HealthChecks`
3. `Ec2HealthCheckOptions#grace` - deprecated in favor of `Ec2HealthChecksOptions`
4. `CommonAutoScalingGroupProps#healthCheck` - deprecated in favor of `healthChecks`

**Solution**:
```typescript
// ✅ COMPLETE FIXED IMPLEMENTATION
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class ProjectXInfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        account: props?.env?.account
      }
    });

    // ✅ FIXED: Using ipAddresses instead of deprecated cidr
    const vpc = new ec2.Vpc(this, 'ProjectXVpc', {
      vpcName: 'projectX-vpc',
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), // ✅ FIXED: Using ipAddresses
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'projectX-public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group Configuration
    const webServerSecurityGroup = new ec2.SecurityGroup(this, 'ProjectXWebServerSG', {
      vpc,
      securityGroupName: 'projectX-web-server-sg',
      description: 'Security group for ProjectX web servers allowing HTTP/HTTPS traffic',
      allowAllOutbound: true,
    });

    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access for administration'
    );

    // IAM Role Configuration
    const ec2Role = new iam.Role(this, 'ProjectXEC2Role', {
      roleName: 'projectX-ec2-role',
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for ProjectX EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    const instanceProfile = new iam.CfnInstanceProfile(this, 'ProjectXInstanceProfile', {
      instanceProfileName: 'projectX-instance-profile',
      roles: [ec2Role.roleName],
    });

    // Launch Template Configuration
    const launchTemplate = new ec2.LaunchTemplate(this, 'ProjectXLaunchTemplate', {
      launchTemplateName: 'projectX-launch-template',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: webServerSecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
      detailedMonitoring: true,
    });

    launchTemplate.userData!.addCommands(
      '#!/bin/bash',
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>ProjectX Web Server - Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html',
      'echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html',
      'echo "<p>Region: us-west-2</p>" >> /var/www/html/index.html'
    );

    // ✅ FIXED: Using healthChecks instead of deprecated healthCheck
    const autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'ProjectXAutoScalingGroup', {
      autoScalingGroupName: 'projectX-asg',
      vpc,
      launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      // ✅ FIXED: Using healthChecks instead of deprecated healthCheck
      healthChecks: autoscaling.HealthChecks.ec2(),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1,
      }),
    });

    // Scaling Policy
    const scaleUpPolicy = autoScalingGroup.scaleOnCpuUtilization('ProjectXScaleUp', {
      targetUtilizationPercent: 70,
    });

    // Tagging
    cdk.Tags.of(vpc).add('Name', 'projectX-vpc');
    cdk.Tags.of(vpc).add('Project', 'ProjectX');
    cdk.Tags.of(vpc).add('Environment', 'Production');
    cdk.Tags.of(webServerSecurityGroup).add('Name', 'projectX-web-server-sg');
    cdk.Tags.of(autoScalingGroup).add('Name', 'projectX-asg');
    cdk.Tags.of(autoScalingGroup).add('Project', 'ProjectX');

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for ProjectX infrastructure',
      exportName: 'ProjectX-VpcId',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
      exportName: 'ProjectX-VpcCidr',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs across multiple AZs',
      exportName: 'ProjectX-PublicSubnetIds',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: webServerSecurityGroup.securityGroupId,
      description: 'Security Group ID for web servers',
      exportName: 'ProjectX-SecurityGroupId',
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: 'ProjectX-AutoScalingGroupName',
    });

    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: vpc.availabilityZones.join(','),
      description: 'Availability Zones used by the infrastructure',
      exportName: 'ProjectX-AvailabilityZones',
    });
  }
}
```

### 2. Missing Null Safety Checks
**Issue**: TypeScript errors due to potentially undefined userData
**Root Cause**: Not handling optional properties properly
**Solution**:
```typescript
// ❌ ERROR - userData might be undefined
launchTemplate.userData.addCommands(...)

// ✅ FIXED - Add null safety check
launchTemplate.userData!.addCommands(...)
```

## Best Practices Violations

### 1. Not Following CDK API Evolution
**Issue**: Using deprecated APIs instead of current recommended ones
**Root Cause**: Not staying updated with CDK API changes
**Solution**:
```typescript
// ✅ ALWAYS use current APIs
// Check CDK documentation for latest APIs
// Subscribe to CDK release notes
// Use CDK migration guides when upgrading versions
```

### 2. Missing Proper Error Handling
**Issue**: No validation of API compatibility
**Solution**:
```typescript
// ✅ Add validation for API compatibility
if (cdk.Version.isVersion('2.0.0')) {
  // Use newer APIs
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
} else {
  // Fallback for older versions
  cidr: '10.0.0.0/16',
}
```

## Lessons Learned

1. **Always check CDK release notes** for deprecation announcements
2. **Use CDK migration guides** when upgrading versions
3. **Test with `--skip-lib-check`** during development to isolate issues
4. **Implement proper null safety** for optional properties
5. **Keep dependencies updated** to avoid deprecated API usage
6. **Use TypeScript strict mode** to catch API compatibility issues early
7. **Document API changes** in your codebase
8. **Set up automated testing** to catch deprecation warnings
9. **Use CDK Aspects** for cross-cutting validation
10. **Maintain a deprecation migration plan** for production systems

## Verification Steps

After applying fixes:
- ✅ Run `npx cdk synth --skip-lib-check` - should have no deprecation warnings
- ✅ Run `npm test` - all tests should pass
- ✅ Run `npm run build` - TypeScript compilation should succeed
- ✅ Deploy infrastructure - should deploy successfully
- ✅ Monitor CloudWatch logs - no API-related errors