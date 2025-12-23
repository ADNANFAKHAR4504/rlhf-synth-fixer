import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkingConstructProps {
  environmentSuffix: string;
  commonTags: Record<string, string>;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Create VPC with public and private subnets across multiple AZs
    this.vpc = new ec2.Vpc(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-vpc`,
      {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        maxAzs: 3,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: `${props.commonTags.ProjectName}-${props.environmentSuffix}-public`,
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            cidrMask: 24,
            name: `${props.commonTags.ProjectName}-${props.environmentSuffix}-private`,
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          {
            cidrMask: 28,
            name: `${props.commonTags.ProjectName}-${props.environmentSuffix}-isolated`,
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
        // Optimize NAT gateway usage - using only 1 due to limits
        natGateways: 1,
        flowLogs: {
          cloudwatch: {
            destination: ec2.FlowLogDestination.toCloudWatchLogs(),
            trafficType: ec2.FlowLogTrafficType.ALL,
          },
        },
      }
    );

    // Apply tags to VPC
    Object.entries(props.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this.vpc).add(key, value);
    });

    // VPC Endpoints for secure AWS service access
    this.vpc.addGatewayEndpoint(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-s3-endpoint`,
      {
        service: ec2.GatewayVpcEndpointAwsService.S3,
        subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      }
    );

    this.vpc.addGatewayEndpoint(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-dynamodb-endpoint`,
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      }
    );

    // Interface endpoints for other AWS services
    this.vpc.addInterfaceEndpoint(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-secrets-endpoint`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    this.vpc.addInterfaceEndpoint(
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-ssm-endpoint`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.SSM,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    // Apply tags to VPC
    Object.entries(props.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this.vpc).add(key, value);
    });
  }
}
