import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingStackProps {
  environmentSuffix: string;
}

export class NetworkingStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly s3Endpoint: ec2.GatewayVpcEndpoint;
  public readonly dynamoEndpoint: ec2.GatewayVpcEndpoint;
  public readonly apiGatewayEndpoint: ec2.InterfaceVpcEndpoint;

  constructor(scope: Construct, id: string, _props: NetworkingStackProps) {
    super(scope, id);

    // VPC Configuration
    this.vpc = new ec2.Vpc(this, 'ProdDocumentProcessingVpc', {
      maxAzs: 2,
      natGateways: 0, // No NAT Gateway needed with VPC endpoints
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for Lambda functions
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'ProdLambdaSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: false,
      }
    );

    // Add outbound rule for HTTPS
    this.lambdaSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for AWS services'
    );

    // VPC Endpoints
    this.s3Endpoint = this.vpc.addGatewayEndpoint('ProdS3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    this.dynamoEndpoint = this.vpc.addGatewayEndpoint('ProdDynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
    });

    this.apiGatewayEndpoint = this.vpc.addInterfaceEndpoint(
      'ProdApiGatewayEndpoint',
      {
        service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [this.lambdaSecurityGroup],
      }
    );
  }
}
