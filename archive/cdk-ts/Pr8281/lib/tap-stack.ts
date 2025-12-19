import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Project: 'CloudEnvironmentSetup',
      ManagedBy: 'CDK',
    };

    // S3 Bucket with versioning enabled
    // LocalStack: Removed autoDeleteObjects to avoid custom resource Lambda upload issues
    const bucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `cloud-env-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Apply tags to S3 bucket
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(bucket).add(key, value);
    });

    // VPC for EC2 instance
    // LocalStack: Simplified VPC with restrictDefaultSecurityGroup disabled to avoid custom resources
    const vpc = new ec2.Vpc(this, 'CloudEnvVpc', {
      vpcName: `cloud-env-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 0,
      restrictDefaultSecurityGroup: false, // Disable to avoid custom resource Lambda
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Security Group allowing SSH access
    const securityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      securityGroupName: `cloud-env-sg-${environmentSuffix}`,
      description: 'Allow SSH access',
      allowAllOutbound: true,
    });

    // Add SSH rule - allowing from current IP (using 0.0.0.0/0 for demo, should be restricted)
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(), // In production, replace with ec2.Peer.ipv4('YOUR_IP/32')
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    // IAM role for EC2 instance
    const ec2Role = new iam.Role(this, 'Ec2S3AccessRole', {
      roleName: `cloud-env-ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instance with S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Grant S3 bucket access to the EC2 role
    bucket.grantReadWrite(ec2Role);

    // AMI - Use SSM parameter lookup which works better with LocalStack
    // This avoids direct EC2 DescribeImages API calls
    const ami = ec2.MachineImage.fromSsmParameter(
      '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
      {
        os: ec2.OperatingSystemType.LINUX,
      }
    );

    // EC2 Instance
    const instance = new ec2.Instance(this, 'CloudEnvInstance', {
      instanceName: `cloud-env-instance-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
    });

    // Elastic IP
    const eip = new ec2.CfnEIP(this, 'InstanceElasticIp', {
      domain: 'vpc',
      instanceId: instance.instanceId,
    });

    // Apply tags to all resources
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
      cdk.Tags.of(securityGroup).add(key, value);
      cdk.Tags.of(ec2Role).add(key, value);
      cdk.Tags.of(instance).add(key, value);
      cdk.Tags.of(eip).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'ElasticIp', {
      value: eip.ref,
      description: 'Elastic IP Address',
    });

    new cdk.CfnOutput(this, 'InstanceRole', {
      value: ec2Role.roleArn,
      description: 'EC2 Instance Role ARN',
    });

    // Future enhancements comments:
    // TODO: Consider using Amazon ElastiCache Serverless for caching layer
    // TODO: Evaluate storage optimized EC2 I8g instances for better performance when available
  }
}
