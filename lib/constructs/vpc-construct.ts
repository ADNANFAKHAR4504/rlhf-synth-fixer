import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  environment: string;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const { environment } = props;

    // Create VPC with 3 public and 3 private subnets across 3 AZs
    this.vpc = new ec2.Vpc(this, `VPC-${environment}`, {
      maxAzs: 3,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${environment}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${environment}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 3, // One NAT Gateway per AZ for high availability
    });

    // Create Network ACLs for additional security
    const privateNetworkAcl = new ec2.NetworkAcl(
      this,
      `PrivateNetworkAcl-${environment}`,
      {
        vpc: this.vpc,
        subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    // Allow HTTPS outbound for private subnets
    privateNetworkAcl.addEntry(`AllowHTTPSOutbound-${environment}`, {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow HTTP outbound for private subnets
    privateNetworkAcl.addEntry(`AllowHTTPOutbound-${environment}`, {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports inbound for responses
    privateNetworkAcl.addEntry(`AllowEphemeralInbound-${environment}`, {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Tag all VPC resources
    cdk.Tags.of(this.vpc).add('Name', `VPC-${environment}`);
    cdk.Tags.of(this.vpc).add('Component', 'Network');
    cdk.Tags.of(this.vpc).add('Environment', environment);

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(
      this,
      `VPCFlowLogGroup-${environment}`,
      {
        retention: logs.RetentionDays.ONE_YEAR,
        logGroupName: `/aws/vpc/${environment}/flow-logs`,
      }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(this, `VPCFlowLogRole-${environment}`, {
      assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      inlinePolicies: {
        VPCFlowLogPolicy: new iam.PolicyDocument({
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
              resources: [flowLogGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    // Enable VPC Flow Logs
    this.vpc.addFlowLog(`VPCFlowLog-${environment}`, {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogGroup,
        flowLogRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE,
    });

    // Tag VPC Flow Log resources
    cdk.Tags.of(flowLogGroup).add('Name', `VPCFlowLogGroup-${environment}`);
    cdk.Tags.of(flowLogGroup).add('Component', 'Network');
    cdk.Tags.of(flowLogGroup).add('Environment', environment);
    cdk.Tags.of(flowLogRole).add('Name', `VPCFlowLogRole-${environment}`);
    cdk.Tags.of(flowLogRole).add('Component', 'Network');
    cdk.Tags.of(flowLogRole).add('Environment', environment);
  }
}
