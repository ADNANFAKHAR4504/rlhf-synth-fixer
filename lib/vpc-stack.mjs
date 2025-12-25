import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

class VpcStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    // Create VPC with specified CIDR
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      vpcName: `secure-vpc-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: 1, // Use single NAT Gateway to reduce costs while maintaining functionality
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create IAM role for VPC Flow Logs with least privilege
    this.flowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
      roleName: `vpc-flow-log-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      description: 'IAM role for VPC Flow Logs with least privilege access',
    });

    // Add minimal policy for VPC Flow Logs
    this.flowLogRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: ['arn:aws:logs:*:*:*'],
      })
    );

    // Create CloudWatch Log Group for VPC Flow Logs
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/vpc/flowlogs/${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Enable VPC Flow Logs
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        vpcFlowLogGroup,
        this.flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Tag all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Component', 'Networking');

    // Output VPC and subnet information
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(s => s.subnetId).join(','),
      description: 'Public Subnet IDs',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(s => s.subnetId).join(','),
      description: 'Private Subnet IDs',
    });
  }
}

export { VpcStack };