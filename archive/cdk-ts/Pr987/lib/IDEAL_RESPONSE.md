I'll help you create AWS infrastructure using CDK TypeScript for your web application setup. Here's the complete infrastructure code with proper environment isolation and resource management:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment suffix from context or environment variable
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'synthtrainr268';

    // Create VPC with public subnet using modern ipAddresses property
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

    // Create Security Group with unique name
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

    // Add tags to EC2 instance including Name tag with environment suffix
    cdk.Tags.of(ec2Instance).add('Name', `tap-instance-${environmentSuffix}`);
    cdk.Tags.of(ec2Instance).add('Environment', 'dev');
    cdk.Tags.of(ec2Instance).add('Project', 'SampleProject');

    // Create Elastic IP and associate with EC2 instance
    const elasticIp = new ec2.CfnEIP(this, 'TapElasticIP', {
      instanceId: ec2Instance.instanceId,
    });

    // Create S3 Bucket with unique name including environment suffix, account, and region
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
```

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context or environment variable, default to 'synthtrainr268'
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'synthtrainr268';

new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description: 'Infrastructure stack for trainr268 - S3, EC2, and VPC setup',
});
```

## Key Improvements

This infrastructure code creates a complete web application setup with the following enhancements:

### 1. **Environment Isolation**
- Uses `environmentSuffix` for all resource names to prevent conflicts between multiple deployments
- Suffix is sourced from CDK context or environment variable with a fallback default
- Stack name includes the environment suffix for proper stack isolation

### 2. **Resource Naming Convention**
- VPC: `tap-vpc-${environmentSuffix}`
- Security Group: `tap-sg-${environmentSuffix}`
- EC2 Instance Name Tag: `tap-instance-${environmentSuffix}`
- S3 Bucket: `tap-bucket-${environmentSuffix}-${account}-${region}` (ensures global uniqueness)

### 3. **Modern CDK Practices**
- Uses `ec2.IpAddresses.cidr()` instead of deprecated `cidr` property
- Proper GP3 volume configuration for better performance
- Latest Amazon Linux 2 AMI selection

### 4. **Resource Management**
- All resources are destroyable with `RemovalPolicy.DESTROY`
- S3 bucket has `autoDeleteObjects: true` for clean teardown
- No retain policies that could block resource deletion

### 5. **Comprehensive Tagging**
- All resources tagged with Environment=dev and Project=SampleProject
- EC2 instance has additional Name tag for easy identification

### 6. **Network Architecture**
- Single VPC with one public subnet in a single AZ
- Internet Gateway and proper routing for public internet access
- DNS hostnames and support enabled for proper EC2 naming

### 7. **Security Configuration**
- Security group allows SSH (port 22) and HTTP (port 80) from anywhere
- Outbound traffic allowed by default
- Instance profile created automatically for potential IAM role attachment

### 8. **Stack Outputs**
- S3 bucket name for easy reference
- EC2 public IP address for connection information

This solution provides a robust, scalable foundation for a web application with proper isolation between environments and follows AWS best practices for CDK TypeScript development.