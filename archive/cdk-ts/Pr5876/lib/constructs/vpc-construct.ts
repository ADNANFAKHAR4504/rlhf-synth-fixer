import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { StackConfig } from '../interfaces/config-interfaces';
import { CidrAllocator } from '../utils/cidr-allocator';
import { NamingUtil } from '../utils/naming';

interface VpcConstructProps extends StackConfig {}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const { config } = props;

    // Allocate non-overlapping CIDR block based on environment
    const cidrBlock = CidrAllocator.allocateVpcCidr(config.environment);

    // Create VPC with proper configuration
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: NamingUtil.generateResourceName(config, 'vpc', false),
      cidr: cidrBlock,
      maxAzs: 3,
      natGateways: config.environment === 'prod' ? 3 : 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create CloudWatch log group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs/${NamingUtil.generateResourceName(config, 'vpc', false)}`,
      retention:
        config.environment === 'prod'
          ? logs.RetentionDays.ONE_MONTH
          : logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add VPC Flow Logs with proper configuration
    this.vpc.addFlowLog('FlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
      maxAggregationInterval: ec2.FlowLogMaxAggregationInterval.ONE_MINUTE,
    });

    // Create S3 Gateway Endpoint for S3 access without NAT costs
    this.vpc.addGatewayEndpoint('S3GatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
        { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    // Create DynamoDB Gateway Endpoint
    this.vpc.addGatewayEndpoint('DynamoDbGatewayEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
        { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    // Add interface endpoints for commonly used services (cost vs convenience trade-off)
    if (config.environment === 'prod') {
      // Only in prod to manage costs
      this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
      });

      this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
      });
    }

    // Apply tags
    cdk.Tags.of(this.vpc).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.vpc).add(
      'Name',
      NamingUtil.generateResourceName(config, 'vpc', false)
    );
  }
}
