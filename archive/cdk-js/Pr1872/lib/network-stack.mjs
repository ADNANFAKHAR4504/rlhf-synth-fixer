import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

class NetworkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with multiple availability zones for us-east-1
    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      vpcName: `app-vpc-${environmentSuffix}`,
      maxAzs: 3, // us-east-1 has 6 AZs, using 3 for cost efficiency
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1, // Use 1 NAT gateway for cost optimization
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Output VPC ID for reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the application infrastructure',
      exportName: `${this.stackName}-VpcId`,
    });
  }
}

export { NetworkStack };