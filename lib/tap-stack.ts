import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';
    const projectName = `secure-company-${environmentSuffix}`;

    // Create KMS key for encryption with customer management
    const kmsKey = new kms.Key(this, 'EncryptionKey', {
      alias: `${projectName}-encryption-key`,
      description: 'Customer-managed encryption key for all services',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create IAM role for EC2 instances with exactly 3 managed policies and 2 inline policies (total 5)
    const ec2Role = new iam.Role(this, 'EC2Role', {
      roleName: `${projectName}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with limited policies',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // Add custom policy for KMS access (Policy 4 of 5)
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:DescribeKey', 'kms:GenerateDataKey'],
        resources: [kmsKey.keyArn],
      })
    );

    // Add custom policy for CloudWatch Logs (Policy 5 of 5)
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: ['arn:aws:logs:*:*:*'],
      })
    );

    // Detect LocalStack environment
    const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.AWS_ENDPOINT_URL?.includes('4566');

    // Create VPC with private and public subnets (simplified to avoid EIP limits)
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${projectName}-vpc`,
      maxAzs: 2,
      natGateways: 0, // No NAT gateways to avoid EIP limits
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${projectName}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${projectName}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      // Disable restrictDefaultSecurityGroup for LocalStack to avoid custom resource Lambda
      restrictDefaultSecurityGroup: !isLocalStack,
    });

    // Create Security Group with no open access
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: vpc,
      securityGroupName: `${projectName}-sg`,
      description: 'Security group with restricted access',
      allowAllOutbound: false,
    });

    // Add HTTPS access only
    securityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'), // Private IP range only
      ec2.Port.tcp(443),
      'HTTPS access from private network'
    );

    // Create secure S3 bucket for application data
    const dataBucket = new s3.Bucket(this, 'DataBucket', {
      bucketName: `${projectName}-data-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Disable autoDeleteObjects for LocalStack to avoid custom resource Lambda
      autoDeleteObjects: !isLocalStack,
    });

    // Create bucket for logs
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `${projectName}-logs-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Disable autoDeleteObjects for LocalStack to avoid custom resource Lambda
      autoDeleteObjects: !isLocalStack,
    });

    // Output important values
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for the secure infrastructure',
      exportName: `${projectName}-vpc-id`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'Name of the data bucket',
      exportName: `${projectName}-data-bucket`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'Name of the logs bucket',
      exportName: `${projectName}-logs-bucket`,
    });

    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: ec2Role.roleArn,
      description: 'ARN of the EC2 IAM role',
      exportName: `${projectName}-ec2-role-arn`,
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: kmsKey.keyArn,
      description: 'ARN of the KMS encryption key',
      exportName: `${projectName}-kms-key-arn`,
    });
  }
}
