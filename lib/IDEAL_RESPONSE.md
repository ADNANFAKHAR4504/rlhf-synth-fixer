## Ideal Response

This document describes the ideal implementation for the VPC and networking infrastructure requirements.

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: this.availabilityZones.slice(0, 2),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      restrictDefaultSecurityGroup: true,
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const vpcLogGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for VPC Flow Logs with least privilege
    const flowLogsRole = new iam.Role(this, 'VpcFlowLogsRole', {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        flowLogsDeliveryRolePolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              resources: [vpcLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Enable VPC Flow Logs
    new ec2.FlowLog(this, 'VpcFlowLogs', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcLogGroup,
        flowLogsRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Apply Environment: Production tag to all resources
    cdk.Tags.of(this).add('Environment', 'Production');

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
      exportName: `${this.stackName}-PublicSubnetIds`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${this.stackName}-PrivateSubnetIds`,
    });

    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: vpc.availabilityZones.join(','),
      description: 'Availability Zones used',
      exportName: `${this.stackName}-AvailabilityZones`,
    });

    new cdk.CfnOutput(this, 'FlowLogsRoleArn', {
      value: flowLogsRole.roleArn,
      description: 'VPC Flow Logs IAM Role ARN',
      exportName: `${this.stackName}-FlowLogsRoleArn`,
    });

    new cdk.CfnOutput(this, 'FlowLogsLogGroupArn', {
      value: vpcLogGroup.logGroupArn,
      description: 'VPC Flow Logs CloudWatch Log Group ARN',
      exportName: `${this.stackName}-FlowLogsLogGroupArn`,
    });
  }
}
```

### Key Differences for LocalStack

The actual implementation adapts the ideal response for LocalStack compatibility:

1. **NAT Gateways**: Changed from `natGateways: 2` to `natGateways: 0` (LocalStack Community Edition limitation)
2. **Private Subnets**: Changed from `PRIVATE_WITH_EGRESS` to `PRIVATE_ISOLATED` (no NAT Gateway support)
3. **Default Security Group**: Changed from `restrictDefaultSecurityGroup: true` to `false` (requires Lambda custom resource which needs Docker-in-Docker)

