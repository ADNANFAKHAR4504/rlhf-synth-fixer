#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class BasicSetupStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get SSH IP from context or use default
    const sshAllowedIp = this.node.tryGetContext('sshIp') || '0.0.0.0/0';

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'MainVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'subnet-1',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'subnet-2',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
      natGateways: 0, // No NAT gateways needed for this simple setup
    });

    // Apply Environment tag to VPC
    cdk.Tags.of(vpc).add('Environment', 'Production');

    // Create S3 bucket with versioning enabled
    const bucket = new s3.Bucket(this, 'MainBucket', {
      versioned: true,
      bucketName: undefined, // Let CDK generate unique name
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      autoDeleteObjects: true, // For demo purposes
    });

    // Apply Environment tag to S3 bucket
    cdk.Tags.of(bucket).add('Environment', 'Production');

    // Create IAM role for EC2 instance following least-privilege principle
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instance with S3 and CloudWatch permissions',
    });

    // Add S3 permissions for the specific bucket only
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetObjectVersion',
        's3:DeleteObjectVersion'
      ],
      resources: [
        bucket.bucketArn,
        `${bucket.bucketArn}/*`
      ]
    }));

    // Add CloudWatch logging permissions
    ec2Role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
        'logs:DescribeLogGroups'
      ],
      resources: [
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*`,
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*:*`
      ]
    }));

    // Apply Environment tag to IAM role
    cdk.Tags.of(ec2Role).add('Environment', 'Production');

    // Create instance profile for the role
    const instanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [ec2Role.roleName],
    });

    // Create security group allowing SSH from specified IP only
    const securityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: vpc,
      description: 'Security group for EC2 instance allowing SSH from specific IP',
      allowAllOutbound: true,
    });

    // Add SSH inbound rule for specific IP
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(sshAllowedIp),
      ec2.Port.tcp(22),
      'Allow SSH access from specified IP'
    );

    // Apply Environment tag to security group
    cdk.Tags.of(securityGroup).add('Environment', 'Production');

    // Get the latest Amazon Linux 2 AMI
    const amzn2Ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // Launch EC2 instance in the first subnet
    const instance = new ec2.CfnInstance(this, 'MainInstance', {
      imageId: amzn2Ami.getImage(this).imageId,
      instanceType: 't3.medium',
      subnetId: vpc.publicSubnets[0].subnetId, // Use first subnet (10.0.1.0/24)
      securityGroupIds: [securityGroup.securityGroupId],
      iamInstanceProfile: instanceProfile.ref,
      tags: [
        {
          key: 'Name',
          value: 'MainInstance'
        },
        {
          key: 'Environment',
          value: 'Production'
        }
      ]
    });

    // Ensure instance profile is created before instance
    instance.addDependency(instanceProfile);

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID'
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket Name'
    });

    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.ref,
      description: 'EC2 Instance ID'
    });

    new cdk.CfnOutput(this, 'SSHCommand', {
      value: `ssh -i your-key.pem ec2-user@${instance.attrPublicIp}`,
      description: 'SSH command to connect to instance'
    });
  }
}

// CDK App
const app = new cdk.App();
new BasicSetupStack(app, 'BasicSetupStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  }
});