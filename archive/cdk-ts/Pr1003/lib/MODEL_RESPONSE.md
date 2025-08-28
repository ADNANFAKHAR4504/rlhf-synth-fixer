```

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class ProductionVpcEc2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        ...props?.env,
      },
    });

    // Create VPC with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, 'ProductionVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
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
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add environment tag to VPC
    cdk.Tags.of(vpc).add('Environment', 'dev');

    // Create Security Group for EC2 instance
    const webServerSecurityGroup = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc,
      description: 'Security group for web server allowing HTTP and SSH access',
      allowAllOutbound: true,
    });

    // Add inbound rules for HTTP and SSH
    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from anywhere'
    );

    webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere'
    );

    // Add environment tag to Security Group
    cdk.Tags.of(webServerSecurityGroup).add('Environment', 'dev');

    // Create Key Pair for EC2 instance
    const keyPair = new ec2.KeyPair(this, 'WebServerKeyPair', {
      keyPairName: 'web-server-keypair',
      type: ec2.KeyPairType.RSA,
      format: ec2.KeyPairFormat.PEM,
    });

    // Add environment tag to Key Pair
    cdk.Tags.of(keyPair).add('Environment', 'dev');

    // Get the latest Amazon Linux 2 AMI
    const amazonLinuxAmi = ec2.MachineImage.latestAmazonLinux2({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    // Create EC2 instance in public subnet
    const webServerInstance = new ec2.Instance(this, 'WebServerInstance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: amazonLinuxAmi,
      keyPair: keyPair,
      securityGroup: webServerSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      associatePublicIpAddress: true,
      userData: ec2.UserData.forLinux(),
    });

    // Add basic user data to install and start Apache web server
    webServerInstance.addUserData(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from AWS CDK!</h1>" > /var/www/html/index.html'
    );

    // Add environment tag to EC2 instance
    cdk.Tags.of(webServerInstance).add('Environment', 'dev');

    // Stack Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'EC2PublicIp', {
      value: webServerInstance.instancePublicIp,
      description: 'EC2 Instance Public IP Address',
      exportName: `${this.stackName}-EC2PublicIp`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: webServerInstance.instanceId,
      description: 'EC2 Instance ID',
      exportName: `${this.stackName}-EC2InstanceId`,
    });

    new cdk.CfnOutput(this, 'KeyPairName', {
      value: keyPair.keyPairName,
      description: 'Key Pair Name for SSH access',
      exportName: `${this.stackName}-KeyPairName`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: webServerSecurityGroup.securityGroupId,
      description: 'Security Group ID',
      exportName: `${this.stackName}-SecurityGroupId`,
    });
  }
}

// App instantiation
const app = new cdk.App();
new ProductionVpcEc2Stack(app, 'ProductionVpcEc2Stack', {
  description: 'Production-ready VPC with EC2 instance in public subnet',
  tags: {
    Environment: 'dev',
    Project: 'WebServer',
    Owner: 'DevOps',
  },
});

```
