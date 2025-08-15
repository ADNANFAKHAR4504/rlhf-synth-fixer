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

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      availabilityZones: this.availabilityZones.slice(0, 2), // Use first 2 AZs
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
      natGateways: 2, // One NAT Gateway per AZ for high availability
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const vpcLogGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for VPC Flow Logs
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

    // Apply Environment: Production tag to all resources in this stack (as per requirements)
    cdk.Tags.of(this).add('Environment', 'Production');

    // Apply additional tags
    cdk.Tags.of(this).add('Project', 'TapStack');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);

    // Output the VPC ID and subnet IDs for reference
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
  }
}
