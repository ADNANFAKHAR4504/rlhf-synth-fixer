import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  cidrMappings: Record<string, string>;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    const { environment, region, suffix, environmentSuffix, cidrMappings } =
      props;

    // Get CIDR from mappings with non-overlapping ranges
    const cidrKey = `${environment}-${region}`;
    const cidr = cidrMappings[cidrKey] || '10.0.0.0/16';

    // Create VPC with non-overlapping CIDR blocks - Requirement 1
    this.vpc = new ec2.Vpc(this, `Vpc${environmentSuffix}${region}`, {
      vpcName: `${environment}-${region}-vpc-${suffix}`,
      cidr: cidr,
      maxAzs: 3,
      natGateways: 2, // For high availability
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 26,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Apply tags to VPC and all subnets
    cdk.Tags.of(this.vpc).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.vpc).add('Environment', environment);
    cdk.Tags.of(this.vpc).add('Region', region);
    cdk.Tags.of(this.vpc).add('Name', `${environment}-${region}-vpc-${suffix}`);

    // VPC Flow Logs for security and compliance
    const flowLogGroup = new logs.LogGroup(
      this,
      `VpcFlowLogGroup${environmentSuffix}${region}`,
      {
        logGroupName: `/aws/vpc/flowlogs/${environment}-${region}-${suffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion when stack fails
      }
    );

    new ec2.FlowLog(this, `VpcFlowLog${environmentSuffix}${region}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // VPC Endpoints for private access to AWS services (cost optimization)
    this.vpc.addGatewayEndpoint(`S3Endpoint${environmentSuffix}${region}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });

    this.vpc.addGatewayEndpoint(
      `DynamoDbEndpoint${environmentSuffix}${region}`,
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [
          { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        ],
      }
    );

    // Interface endpoints for other AWS services
    this.vpc.addInterfaceEndpoint(
      `SecretsManagerEndpoint${environmentSuffix}${region}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    this.vpc.addInterfaceEndpoint(
      `CloudWatchEndpoint${environmentSuffix}${region}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );
  }
}
