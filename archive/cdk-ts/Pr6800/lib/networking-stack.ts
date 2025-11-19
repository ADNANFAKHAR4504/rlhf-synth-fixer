import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingStackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    // Create VPC with exactly 3 AZs, CIDR 10.0.0.0/16
    this.vpc = new ec2.Vpc(this, 'TradingPlatformVpc', {
      vpcName: `trading-platform-vpc-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 1, // Cost optimization: single NAT gateway
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
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // VPC Flow Logs for security monitoring
    const logGroup = new cdk.aws_logs.LogGroup(this, 'VpcFlowLogs', {
      logGroupName: `/aws/vpc/flow-logs-${props.environmentSuffix}`,
      retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(this, 'FlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(logGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // VPC Endpoints for cost optimization (avoid NAT charges)
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    cdk.Tags.of(this.vpc).add(
      'Name',
      `trading-platform-vpc-${props.environmentSuffix}`
    );
  }
}
