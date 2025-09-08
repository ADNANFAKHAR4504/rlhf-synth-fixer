// tapstack.ts

import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

import { Construct } from 'constructs';

// Import your modules (you'll need to create these based on your requirements)
import {
  KmsModule,
  S3Module,
  IamModule,
  VpcModule,
  SecurityGroupModule,
  Ec2Module,
  RdsModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Handle AWS_REGION_OVERRIDE environment variable
    const awsRegionOverride = process.env.AWS_REGION_OVERRIDE;
    const awsRegion =
      awsRegionOverride && awsRegionOverride.trim() !== ''
        ? awsRegionOverride.trim()
        : props?.awsRegion || 'us-east-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate your modules here
    const project = 'tap-project';

    // Create KMS key for encryption
    const kmsModule = new KmsModule(this, 'kms', {
      project,
      environment: environmentSuffix,
      description: `KMS key for ${project} ${environmentSuffix} environment`,
      accountId: current.accountId,
    });

    // Create S3 bucket for application data
    const s3Module = new S3Module(this, 's3-app-data', {
      project,
      environment: environmentSuffix,
      bucketName: `${project}-${environmentSuffix}-app-data`,
      kmsKey: kmsModule.key,
    });

    // Generate a random password for RDS - in production, use AWS Secrets Manager
    // For testing, we'll create a simple password that meets RDS requirements
    const dbPassword = `TempPass${environmentSuffix}123!`;

    // Create CloudTrail for auditing
    // const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail', {
    //   project,
    //   environment: environmentSuffix,
    //   kmsKey: kmsModule.key,
    //   accountId: current.accountId,
    //   region: awsRegion,
    // });

    // Create IAM role and instance profile for EC2
    const iamModule = new IamModule(this, 'iam', {
      project,
      environment: environmentSuffix,
      appDataBucketArn: s3Module.bucket.arn,
    });

    // Create VPC with public and private subnets
    const vpcModule = new VpcModule(this, 'vpc', {
      project,
      environment: environmentSuffix,
      cidrBlock: '10.0.0.0/16',
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
    });

    // Create security group for public EC2 instances
    const publicEc2SecurityGroup = new SecurityGroupModule(
      this,
      'public-ec2-sg',
      {
        project,
        environment: environmentSuffix,
        name: 'public-ec2',
        description: 'Security group for public EC2 instances',
        vpcId: vpcModule.vpc.id,
        rules: [
          {
            type: 'ingress',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['203.0.113.0/24'], // SSH access from trusted IP range
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
      }
    );

    // Create security group for private EC2 instances
    const privateEc2SecurityGroup = new SecurityGroupModule(
      this,
      'private-ec2-sg',
      {
        project,
        environment: environmentSuffix,
        name: 'private-ec2',
        description: 'Security group for private EC2 instances',
        vpcId: vpcModule.vpc.id,
        rules: [
          {
            type: 'ingress',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            sourceSecurityGroupId: publicEc2SecurityGroup.securityGroup.id,
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
      }
    );

    // Create security group for RDS
    const rdsSecurityGroup = new SecurityGroupModule(this, 'rds-sg', {
      project,
      environment: environmentSuffix,
      name: 'rds',
      description: 'Security group for RDS instances',
      vpcId: vpcModule.vpc.id,
      rules: [
        {
          type: 'ingress',
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          sourceSecurityGroupId: privateEc2SecurityGroup.securityGroup.id,
        },
      ],
    });

    // Create public S3 bucket for app assets
    const publicS3Module = new S3Module(this, 's3-public-assets', {
      project,
      environment: environmentSuffix,
      bucketName: `${project}-${environmentSuffix}-public-assets`,
      kmsKey: kmsModule.key,
      isPublic: true,
    });

    // Create private S3 bucket for internal data
    const privateS3Module = new S3Module(this, 's3-private-data', {
      project,
      environment: environmentSuffix,
      bucketName: `${project}-${environmentSuffix}-private-data`,
      kmsKey: kmsModule.key,
      isPublic: false,
    });

    // Create public EC2 instance
    const publicEc2Module = new Ec2Module(this, 'public-ec2', {
      project,
      environment: environmentSuffix,
      instanceType: 't3.micro',
      subnetId: vpcModule.publicSubnets[0].id,
      securityGroupIds: [publicEc2SecurityGroup.securityGroup.id],
      instanceProfile: iamModule.instanceProfile,
      // keyName: 'turing-key', // Optional: Replace with your key pair name if needed
      userData: `#!/bin/bash
        yum update -y
        # Add your initialization scripts here
      `,
    });

    // Create private EC2 instance
    const privateEc2Module = new Ec2Module(this, 'private-ec2', {
      project,
      environment: environmentSuffix,
      instanceType: 't3.micro',
      subnetId: vpcModule.privateSubnets[0].id,
      securityGroupIds: [privateEc2SecurityGroup.securityGroup.id],
      instanceProfile: iamModule.instanceProfile,
      // keyName: 'turing-key', // Optional: Replace with your key pair name if needed
    });

    // Create RDS instance
    const rdsModule = new RdsModule(this, 'rds', {
      project,
      environment: environmentSuffix,
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'dbadmin',
      password: dbPassword,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [rdsSecurityGroup.securityGroup.id],
      kmsKey: kmsModule.key,
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'public-ec2-instance-id', {
      value: publicEc2Module.instance.id,
      description: 'Public EC2 instance ID',
    });

    new TerraformOutput(this, 'public-ec2-public-ip', {
      value: publicEc2Module.instance.publicIp,
      description: 'Public EC2 instance public IP address',
    });

    new TerraformOutput(this, 'private-ec2-instance-id', {
      value: privateEc2Module.instance.id,
      description: 'Private EC2 instance ID',
    });

    new TerraformOutput(this, 'private-ec2-private-ip', {
      value: privateEc2Module.instance.privateIp,
      description: 'Private EC2 instance private IP address',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for app assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-name', {
      value: privateS3Module.bucket.bucket,
      description: 'Private S3 bucket name for internal data',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
