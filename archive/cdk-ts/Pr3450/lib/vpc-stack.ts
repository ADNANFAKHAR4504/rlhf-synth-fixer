import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface VpcStackProps extends cdk.StackProps {
  cidr: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly routeTableIds: string[] = [];

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    // Create a VPC with public, private, and isolated subnets
    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 3,
      cidr: props.cidr,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      natGateways: 1, // Reduced to 1 to avoid EIP quota issues
    });

    // Collect route table IDs for VPC peering
    // Store route table IDs for peering setup
    this.vpc.publicSubnets.forEach(subnet => {
      if (subnet.routeTable) {
        this.routeTableIds.push(subnet.routeTable.routeTableId);
      }
    });

    this.vpc.privateSubnets.forEach(subnet => {
      if (subnet.routeTable) {
        this.routeTableIds.push(subnet.routeTable.routeTableId);
      }
    });

    this.vpc.isolatedSubnets.forEach(subnet => {
      if (subnet.routeTable) {
        this.routeTableIds.push(subnet.routeTable.routeTableId);
      }
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `${this.stackName}:VpcId`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      exportName: `${this.stackName}:VpcCidr`,
    });
  }
}
