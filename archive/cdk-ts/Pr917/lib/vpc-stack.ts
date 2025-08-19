import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly latticeServiceNetwork: vpclattice.CfnServiceNetwork;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with specified CIDR
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: 1, // Single NAT Gateway for cost optimization
    });

    // Create Security Group for HTTP/HTTPS traffic
    this.securityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `web-sg-${environmentSuffix}`,
      description: 'Security Group for web traffic',
      allowAllOutbound: true,
    });

    // Add HTTP and HTTPS inbound rules
    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, 'FlowLogRole', {
      roleName: `vpc-flow-log-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        FlowLogPolicy: new iam.PolicyDocument({
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
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const logGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create VPC Flow Logs
    new ec2.FlowLog(this, 'VpcFlowLog', {
      flowLogName: `vpc-flow-log-${environmentSuffix}`,
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        logGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // Create VPC Lattice Service Network
    this.latticeServiceNetwork = new vpclattice.CfnServiceNetwork(
      this,
      'LatticeServiceNetwork',
      {
        name: `service-network-${environmentSuffix}`,
        authType: 'NONE',
      }
    );

    // Associate VPC with Lattice Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(
      this,
      'LatticeVpcAssociation',
      {
        serviceNetworkIdentifier: this.latticeServiceNetwork.attrId,
        vpcIdentifier: this.vpc.vpcId,
      }
    );

    // CloudWatch Dashboard for monitoring
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, 'VpcDashboard', {
      dashboardName: `vpc-monitoring-${environmentSuffix}`,
    });

    // Add VPC metrics to dashboard
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'VPC Flow Logs',
        width: 12,
        height: 6,
        left: [
          new cdk.aws_cloudwatch.Metric({
            namespace: 'AWS/Logs',
            metricName: 'IncomingLogEvents',
            dimensionsMap: {
              LogGroupName: logGroup.logGroupName,
            },
            statistic: 'Sum',
          }),
        ],
      })
    );

    // Add tags to all resources
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Project', 'VPC-Infrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.securityGroup.securityGroupId,
      description: 'Web Security Group ID',
      exportName: `WebSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LatticeServiceNetworkId', {
      value: this.latticeServiceNetwork.attrId,
      description: 'VPC Lattice Service Network ID',
      exportName: `LatticeServiceNetworkId-${environmentSuffix}`,
    });
  }
}
