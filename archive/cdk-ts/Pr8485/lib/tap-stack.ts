import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// Detect LocalStack environment (for potential future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment suffix from context or environment variable
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'synthtrainr268';

    // Create VPC with public subnet
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      vpcName: `tap-vpc-${environmentSuffix}`,
      maxAzs: 1,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'TapSecurityGroup', {
      vpc: vpc,
      securityGroupName: `tap-sg-${environmentSuffix}`,
      description: 'Security group for web server',
      allowAllOutbound: true,
    });

    // Add ingress rules
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere'
    );

    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP access from anywhere'
    );

    // Add tags to security group
    cdk.Tags.of(securityGroup).add('Environment', 'dev');
    cdk.Tags.of(securityGroup).add('Project', 'SampleProject');

    // Get the latest Amazon Linux 2 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2();

    // Create EC2 Instance
    const ec2Instance = new ec2.Instance(this, 'TapInstance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      securityGroup: securityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // Add tags to EC2 instance
    cdk.Tags.of(ec2Instance).add('Name', `tap-instance-${environmentSuffix}`);
    cdk.Tags.of(ec2Instance).add('Environment', 'dev');
    cdk.Tags.of(ec2Instance).add('Project', 'SampleProject');

    // Create Elastic IP and associate with EC2 instance
    const elasticIp = new ec2.CfnEIP(this, 'TapElasticIP', {
      instanceId: ec2Instance.instanceId,
    });

    // Create S3 Bucket
    const s3Bucket = new s3.Bucket(this, 'TapBucket', {
      bucketName: `tap-bucket-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Add tags to S3 bucket
    cdk.Tags.of(s3Bucket).add('Environment', 'dev');
    cdk.Tags.of(s3Bucket).add('Project', 'SampleProject');

    // Stack Outputs
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: elasticIp.ref,
      description: 'Public IP address of the EC2 instance',
    });
  }
}
