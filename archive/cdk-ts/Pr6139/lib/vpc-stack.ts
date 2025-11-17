import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC with private and public subnets
    this.vpc = new ec2.Vpc(this, `PaymentVpc${environmentSuffix}`, {
      vpcName: `payment-processing-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Default security group for the VPC
    this.securityGroup = new ec2.SecurityGroup(
      this,
      `VpcDefaultSecurityGroup${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Default security group for payment processing VPC',
        allowAllOutbound: true,
      }
    );

    // VPC endpoints for AWS services (to avoid NAT Gateway costs for private subnets)
    this.vpc.addInterfaceEndpoint('LambdaEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
    });

    this.vpc.addInterfaceEndpoint('SQSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SQS,
    });

    this.vpc.addInterfaceEndpoint('APIGatewayEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
    });

    this.vpc.addInterfaceEndpoint('CloudWatchEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH,
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
    });

    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Outputs for cross-stack references
    new cdk.CfnOutput(this, `VpcId${environmentSuffix}`, {
      value: this.vpc.vpcId,
      exportName: `PaymentVpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `VpcSecurityGroup${environmentSuffix}`, {
      value: this.securityGroup.securityGroupId,
      exportName: `PaymentVpcSecurityGroup-${environmentSuffix}`,
    });
  }
}
