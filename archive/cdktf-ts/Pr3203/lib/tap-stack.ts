import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  SecureVpc,
  SecureIamRole,
  SecureS3Bucket,
  SecureCloudTrail,
  SecureEc2Instance,
  SecureRdsInstance,
  SecureLambdaFunction,
  SecureParameter,
  SecureWaf,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Create KMS key for encryption
    const identity = new DataAwsCallerIdentity(this, 'current');
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: 'KMS key for encrypting resources',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Id: 'Key policy',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${identity.accountId}:root`, // Explicitly grant root account access
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudTrail to encrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:GenerateDataKey*', 'kms:Decrypt'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Environment: 'Production',
      },
    });

    // Create VPC and subnets
    const vpc = new SecureVpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      subnetCidrBlocks: [
        '10.0.0.0/24',
        '10.0.1.0/24',
        '10.0.2.0/24', // AZ 1 (public, private, db)
        '10.0.3.0/24',
        '10.0.4.0/24',
        '10.0.5.0/24', // AZ 2 (public, private, db)
      ],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      enableDnsSupport: true,
      enableDnsHostnames: true,
    });

    // Create S3 logging bucket
    const loggingBucket = new SecureS3Bucket(this, 'logging-bucket', {
      name: 'secure-tap-logging-bucket',
      kmsKeyId: kmsKey.id,
    });

    // Create CloudTrail S3 bucket
    const cloudtrailBucket = new SecureS3Bucket(this, 'cloudtrail-bucket', {
      name: 'secure-tap-cloudtrail-bucket',
      kmsKeyId: kmsKey.id,
      logging: {
        targetBucket: loggingBucket.bucket.bucket,
        targetPrefix: 'cloudtrail-logs/',
      },
    });

    // Create application S3 bucket
    const appBucket = new SecureS3Bucket(this, 'app-bucket', {
      name: 'secure-tap-app-bucket',
      kmsKeyId: kmsKey.id,
      logging: {
        targetBucket: loggingBucket.bucket.bucket,
        targetPrefix: 'app-logs/',
      },
    });

    // Create CloudTrail
    const cloudtrail = new SecureCloudTrail(this, 'cloudtrail', {
      name: 'secure-tap-cloudtrail',
      s3BucketName: cloudtrailBucket.bucket.bucket,
      kmsKeyId: kmsKey.arn,
    });

    // Create Lambda IAM role
    const lambdaRole = new SecureIamRole(this, 'lambda-role', {
      name: 'secure-tap-lambda-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      policies: [
        {
          name: 'lambda-vpc-execution',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'ec2:CreateNetworkInterface',
                  'ec2:DescribeNetworkInterfaces',
                  'ec2:DeleteNetworkInterface',
                ],
                Resource: '*',
              },
            ],
          }),
        },
        {
          name: 'lambda-s3-access',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject'],
                Resource: `${appBucket.bucket.arn}/*`,
              },
            ],
          }),
        },
      ],
    });

    // Create EC2 IAM role
    const ec2Role = new SecureIamRole(this, 'ec2-role', {
      name: 'secure-tap-ec2-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      policies: [
        {
          name: 'ec2-ssm-access',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'ssm:GetParameter',
                  'ssm:GetParameters',
                  'ssm:GetParametersByPath',
                ],
                Resource: 'arn:aws:ssm:*:*:parameter/secure-tap/*',
              },
            ],
          }),
        },
      ],
    });

    const ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'secure-tap-ec2-profile',
        role: ec2Role.role.name,
      }
    );

    // In the TapStack class, create a security group for Lambda
    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      vpcId: vpc.vpc.id,
      description: 'Security group for Lambda functions',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: 'secure-tap-lambda-sg',
        Environment: 'Production',
      },
    });

    // Create Lambda function using S3
    const lambda = new SecureLambdaFunction(this, 'lambda', {
      functionName: 'secure-tap-function',
      handler: 'index.handler',
      runtime: 'nodejs20.x',
      role: lambdaRole.role.arn,
      s3Bucket: 'test12345-ts', // Use the app bucket you already created
      s3Key: 'lambda/lambda-function.zip', // Simple S3 key
      vpcConfig: {
        subnetIds: vpc.privateSubnets.map(subnet => subnet.id),
        securityGroupIds: [lambdaSecurityGroup.id],
      },
      environment: {
        DB_HOST: 'secure-tap-db.instance.endpoint',
        DB_NAME: 'mydatabase',
        DB_USER_PARAM: '/secure-tap/db/username',
        DB_PASSWORD_PARAM: '/secure-tap/db/password',
      },
      timeout: 30,
      memorySize: 512,
    });

    // Create a security group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      vpcId: vpc.vpc.id,
      description: 'Security group for RDS instances',
      ingress: [
        {
          description: 'MySQL/Aurora from Lambda',
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [lambdaSecurityGroup.id],
        },
      ],
      tags: {
        Name: 'secure-tap-rds-sg',
        Environment: 'Production',
      },
    });

    // Create RDS instance
    const rds = new SecureRdsInstance(this, 'rds', {
      identifier: 'secure-tap-db',
      allocatedStorage: 20,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      dbName: 'mydatabase',
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'changeme123!',
      subnetIds: vpc.databaseSubnets.map(subnet => subnet.id),
      vpcSecurityGroupIds: [rdsSecurityGroup.id], // Replace with actual SG
      kmsKeyId: kmsKey.arn,
    });

    // Store database credentials in Parameter Store
    new SecureParameter(this, 'db-username', {
      name: '/secure-tap/db/username',
      value: 'admin',
      type: 'SecureString',
      kmsKeyId: kmsKey.id,
    });

    new SecureParameter(this, 'db-password', {
      name: '/secure-tap/db/password',
      value: 'GenerateAStrongPasswordHere', // In a real scenario, this would be generated and not hardcoded
      type: 'SecureString',
      kmsKeyId: kmsKey.id,
    });

    // Create an actual security group for the EC2 instance
    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      vpcId: vpc.vpc.id,
      description: 'Security group for EC2 instances',
      ingress: [
        {
          description: 'SSH from VPC',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [vpc.vpc.cidrBlock],
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: 'secure-tap-ec2-sg',
        Environment: 'Production',
      },
    });

    // Create EC2 instance
    new SecureEc2Instance(this, 'ec2', {
      instanceType: 't3.micro',
      amiId: 'ami-0c02fb55956c7d316',
      subnetId: vpc.privateSubnets[0].id,
      securityGroupIds: [ec2SecurityGroup.id], // Use the actual SG created above
      iamInstanceProfile: ec2InstanceProfile.name,
      userData: `
        #!/bin/bash
        echo "Setting up secure instance"
        # Install AWS CLI
        apt-get update
        apt-get install -y awscli
        # Get database credentials from Parameter Store
        DB_USER=$(aws ssm get-parameter --name "/secure-tap/db/username" --with-decryption --query "Parameter.Value" --output text)
        DB_PASSWORD=$(aws ssm get-parameter --name "/secure-tap/db/password" --with-decryption --query "Parameter.Value" --output text)
        # Configure application
        echo "DB_USER=$DB_USER" > /etc/environment
        echo "DB_PASSWORD=$DB_PASSWORD" >> /etc/environment
      `,
    });

    // Create WAF web ACL
    new SecureWaf(this, 'waf', {
      name: 'secure-tap-waf',
      scope: 'REGIONAL',
      region: awsRegion,
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpc.id,
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'database_subnet_ids', {
      value: vpc.databaseSubnets.map(subnet => subnet.id),
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: rds.instance.endpoint,
    });

    new TerraformOutput(this, 'logging_bucket_name', {
      value: loggingBucket.bucket.bucket,
    });

    new TerraformOutput(this, 'cloudtrail_bucket_name', {
      value: cloudtrailBucket.bucket.bucket,
    });

    new TerraformOutput(this, 'app_bucket_name', {
      value: appBucket.bucket.bucket,
    });

    new TerraformOutput(this, 'cloudtrail_arn', {
      value: cloudtrail.trail.arn,
    });

    new TerraformOutput(this, 'lambda_arn', {
      value: lambda.function.arn,
    });

    new TerraformOutput(this, 'kms_key_id', {
      value: kmsKey.id,
    });
  }
}
