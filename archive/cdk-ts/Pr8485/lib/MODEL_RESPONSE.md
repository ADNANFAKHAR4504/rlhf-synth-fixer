I'll help you create AWS infrastructure using CDK TypeScript for your web application setup. Here's the complete infrastructure code organized into separate files:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public subnet
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 1,
      cidr: '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // Create Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'TapSecurityGroup', {
      vpc: vpc,
      description: 'Security group for web server',
      allowAllOutbound: true
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
    const ami = ec2.MachineImage.latestAmazonLinux2({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
    });

    // Create EC2 Instance
    const ec2Instance = new ec2.Instance(this, 'TapInstance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ami,
      securityGroup: securityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(8, {
            volumeType: ec2.EbsDeviceVolumeType.GP3
          })
        }
      ]
    });

    // Add tags to EC2 instance
    cdk.Tags.of(ec2Instance).add('Environment', 'dev');
    cdk.Tags.of(ec2Instance).add('Project', 'SampleProject');

    // Create Elastic IP and associate with EC2 instance
    const elasticIp = new ec2.CfnEIP(this, 'TapElasticIP', {
      instanceId: ec2Instance.instanceId
    });

    // Create S3 Bucket
    const s3Bucket = new s3.Bucket(this, 'TapBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // Add tags to S3 bucket
    cdk.Tags.of(s3Bucket).add('Environment', 'dev');
    cdk.Tags.of(s3Bucket).add('Project', 'SampleProject');

    // Stack Outputs
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket'
    });

    new cdk.CfnOutput(this, 'EC2PublicIP', {
      value: elasticIp.ref,
      description: 'Public IP address of the EC2 instance'
    });
  }
}
```

This infrastructure code creates:

1. **VPC Infrastructure**: A VPC with a single public subnet, internet gateway, and route table for public internet access
2. **Security Group**: Allows SSH (port 22) and HTTP (port 80) from anywhere, properly tagged
3. **EC2 Instance**: Amazon Linux 2 instance in the public subnet with GP3 EBS volume for better performance
4. **Elastic IP**: Static public IP address associated with the EC2 instance
5. **S3 Bucket**: Versioning-enabled bucket for storage
6. **Proper Tagging**: All resources tagged with Environment=dev and Project=SampleProject
7. **Stack Outputs**: Bucket name and public IP address for easy reference

The infrastructure follows AWS best practices with proper networking setup and uses the latest EBS GP3 volume type for improved performance.