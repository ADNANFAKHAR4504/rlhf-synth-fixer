import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface SecureEnvironmentStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class SecureEnvironmentStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: SecureEnvironmentStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'OrgSecureVpc', {
      vpcName: `org-secure-vpc-${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `org-public-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `org-private-subnet-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create KMS key for encryption
    const encryptionKey = new kms.Key(this, 'OrgEncryptionKey', {
      description: `org-encryption-key-${environmentSuffix}`,
      enableKeyRotation: true,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    encryptionKey.addAlias(`alias/org-encryption-key-${environmentSuffix}`);

    // Create IAM role for EC2 instance following least privilege
    const ec2Role = new iam.Role(this, 'OrgEc2InstanceRole', {
      roleName: `org-ec2-instance-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instance with minimal permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add custom policy for Security Hub compliance
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'cloudwatch:PutMetricData',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:RequestedRegion': 'us-west-2',
          },
        },
      })
    );

    // Create instance profile
    new iam.CfnInstanceProfile(this, 'OrgInstanceProfile', {
      instanceProfileName: `org-instance-profile-${environmentSuffix}`,
      roles: [ec2Role.roleName],
    });

    // Security group for SSH access from specific IP range
    const sshSecurityGroup = new ec2.SecurityGroup(
      this,
      'OrgSshSecurityGroup',
      {
        securityGroupName: `org-ssh-sg-${environmentSuffix}`,
        vpc,
        description:
          'Security group allowing SSH access from specific IP range',
        allowAllOutbound: true,
      }
    );

    // Allow SSH from specific IP range (example: 203.0.113.0/24)
    sshSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(22),
      'Allow SSH from specific IP range'
    );

    // Create EC2 Key Pair with unique name to avoid replacement issues
    const keyPair = new ec2.CfnKeyPair(this, 'OrgKeyPair', {
      keyName: `org-keypair-${environmentSuffix}-${cdk.Aws.STACK_NAME}`,
    });

    // Store key pair name in SSM Parameter
    new ssm.StringParameter(this, 'KeyPairParameter', {
      parameterName: `/org/ec2/keypair/${environmentSuffix}`,
      stringValue: keyPair.keyName,
      description: `EC2 Key Pair name for ${environmentSuffix} environment`,
    });

    // Get Amazon Linux 2023 AMI
    const ami = ec2.MachineImage.latestAmazonLinux2023();
    const amiId = ami.getImage(this).imageId;

    // Get private subnets for the instance
    const privateSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    });

    // Create instance profile for the EC2 instance
    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      'OrgSecureInstanceProfile',
      {
        instanceProfileName: `org-secure-instance-profile-${environmentSuffix}`,
        roles: [ec2Role.roleName],
      }
    );

    // Create EC2 instance using CfnInstance for LocalStack compatibility
    // LocalStack doesn't support LaunchTemplate.LatestVersionNumber attribute
    const ec2Instance = new ec2.CfnInstance(this, 'OrgSecureInstance', {
      instanceType: 't3.micro',
      imageId: amiId,
      subnetId: privateSubnets.subnetIds[0],
      securityGroupIds: [sshSecurityGroup.securityGroupId],
      iamInstanceProfile: instanceProfile.instanceProfileName,
      keyName: keyPair.keyName,
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 20,
            volumeType: 'gp3',
            encrypted: true,
            kmsKeyId: encryptionKey.keyId,
          },
        },
      ],
      monitoring: true,
      metadataOptions: {
        httpTokens: 'required',
        httpEndpoint: 'enabled',
      },
      tags: [
        {
          key: 'Name',
          value: `org-secure-instance-${environmentSuffix}`,
        },
      ],
    });

    // Add dependency on instance profile
    ec2Instance.addDependency(instanceProfile);

    // Create S3 bucket with encryption and versioning
    const secureS3Bucket = new s3.Bucket(this, 'OrgSecureS3Bucket', {
      bucketName: `org-secure-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: `org-lifecycle-rule-${environmentSuffix}`,
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // Create IAM role for S3 Access Point with ABAC
    const s3AccessPointRole = new iam.Role(this, 'OrgS3AccessPointRole', {
      roleName: `org-s3-access-point-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      description: 'IAM role for S3 Access Point with ABAC controls',
    });

    // Add ABAC policy for S3 Access Point
    s3AccessPointRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [secureS3Bucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            's3:ExistingObjectTag/Environment':
              '${aws:PrincipalTag/Environment}',
            's3:ExistingObjectTag/Department': '${aws:PrincipalTag/Department}',
          },
        },
      })
    );

    // Create S3 Access Point with simplified configuration
    const s3AccessPoint = new s3.CfnAccessPoint(this, 'OrgS3AccessPoint', {
      bucket: secureS3Bucket.bucketName,
      name: `org-access-point-${environmentSuffix}`,
    });

    // Add tags for ABAC
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Department', 'security');
    cdk.Tags.of(this).add('Project', 'org-secure-environment');

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `org-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'InstanceId', {
      value: ec2Instance.ref,
      description: 'EC2 Instance ID',
      exportName: `org-instance-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureS3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `org-s3-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3AccessPointArn', {
      value: s3AccessPoint.attrArn,
      description: 'S3 Access Point ARN',
      exportName: `org-s3-access-point-arn-${environmentSuffix}`,
    });
  }
}
