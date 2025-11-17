import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingProps {
  isPrimary: boolean;
  maxAzs: number;
  environmentSuffix: string;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly vpcPeeringConnection?: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: NetworkingProps) {
    super(scope, id);

    const suffix = props.environmentSuffix;
    const regionType = props.isPrimary ? 'primary' : 'secondary';

    // Create VPC with private subnets across 3 AZs
    this.vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `aurora-dr-${regionType}-vpc-${suffix}`,
      maxAzs: props.maxAzs,
      ipAddresses: ec2.IpAddresses.cidr(
        props.isPrimary ? '10.0.0.0/16' : '10.1.0.0/16'
      ),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create VPC endpoints for AWS services
    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    });

    this.vpc.addInterfaceEndpoint('KMSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });

    this.vpc.addInterfaceEndpoint('SNSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
    });

    // Add S3 gateway endpoint
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });
  }
}
