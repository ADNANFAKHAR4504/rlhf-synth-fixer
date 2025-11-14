import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix: string;
  createVpcEndpoints?: boolean;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    const { environmentSuffix, createVpcEndpoints = false } = props;

    this.vpc = new ec2.Vpc(this, `VPC-${environmentSuffix}`, {
      vpcName: `dr-vpc-${environmentSuffix}-${this.region}`,
      maxAzs: 3,
      // Cost optimization: No NAT Gateways ($0.045/hour + data transfer costs)
      // Using VPC endpoints instead for S3, DynamoDB, ECR, and CloudWatch Logs access
      // Trade-off: Private subnets are isolated without internet access
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC endpoints are optional to avoid hitting AWS service limits
    // In production, these should be created separately or limits should be increased
    if (createVpcEndpoints) {
      this.vpc.addGatewayEndpoint(`S3Endpoint-${environmentSuffix}`, {
        service: ec2.GatewayVpcEndpointAwsService.S3,
      });

      this.vpc.addGatewayEndpoint(`DynamoDBEndpoint-${environmentSuffix}`, {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      });

      this.vpc.addInterfaceEndpoint(`ECREndpoint-${environmentSuffix}`, {
        service: ec2.InterfaceVpcEndpointAwsService.ECR,
      });

      this.vpc.addInterfaceEndpoint(`ECRDockerEndpoint-${environmentSuffix}`, {
        service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      });

      this.vpc.addInterfaceEndpoint(`LogsEndpoint-${environmentSuffix}`, {
        service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      });
    }

    cdk.Tags.of(this.vpc).add('Name', `dr-vpc-${environmentSuffix}`);
    cdk.Tags.of(this.vpc).add('Environment', environmentSuffix);
  }
}
