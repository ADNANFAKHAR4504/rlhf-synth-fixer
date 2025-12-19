import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import * as aws from '@cdktf/provider-aws';
import * as random from '@cdktf/provider-random';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  IamModule,
  SecretsModule,
  S3Module,
  CloudFrontModule,
  Ec2Module,
  RdsModule,
  CloudWatchModule,
  OpenSearchModule,
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
    const project = 'CloudFormationSetup';
    const environment = environmentSuffix;
    const region = awsRegion;

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: project,
            Environment: environment,
            ManagedBy: 'CDKTF',
          },
        },
      ],
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

    // ? Add your stack instantiations here
    // Configure Random Provider
    new random.provider.RandomProvider(this, 'random');

    // Create KMS Key for encryption
    const kmsKey = new aws.kmsKey.KmsKey(this, 'main-kms-key', {
      description: `KMS key for ${environment} environment`,
      enableKeyRotation: true,
      tags: {
        Project: project,
        Environment: environment,
        Name: `${environment}-security-kms-key`,
      },
    });

    new aws.kmsAlias.KmsAlias(this, 'kms-alias', {
      name: `alias/${environment}-main-key`,
      targetKeyId: kmsKey.id,
    });

    // 1. VPC Module
    const vpcModule = new VpcModule(this, 'vpc', {
      environment,
      project,
      region,
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      availabilityZones: [`${region}a`, `${region}b`],
      allowedSshCidr: '0.0.0.0/32', // Change this to your IP for better security
    });

    // 2. Secrets Module (must be before RDS)
    const secretsModule = new SecretsModule(this, 'secrets', {
      environment,
      project,
      region,
      kmsKeyId: kmsKey.id,
    });

    // 3. S3 Module
    const s3Module = new S3Module(this, 's3', {
      environment,
      project,
      region,
      kmsKeyId: kmsKey.id,
    });

    // 4. IAM Module
    const iamModule = new IamModule(this, 'iam', {
      environment,
      project,
      region,
      s3BucketArn: s3Module.bucket.arn,
    });

    // 5. CloudFront Module
    const cloudFrontModule = new CloudFrontModule(this, 'cloudfront', {
      environment,
      project,
      region,
      s3BucketDomainName: s3Module.bucket.bucketRegionalDomainName,
      s3BucketArn: s3Module.bucket.arn,
      s3BucketName: s3Module.bucket.id,
    });

    // 6. RDS Module
    const rdsModule = new RdsModule(this, 'rds', {
      environment,
      project,
      region,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      kmsKeyArn: kmsKey.arn,
      secretArn: '', // No longer needed
      allowedSecurityGroupId: vpcModule.securityGroupWeb.id,
    });

    // 7. EC2 Module
    const ec2Module = new Ec2Module(this, 'ec2', {
      environment,
      project,
      region,
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.publicSubnets.map(s => s.id),
      securityGroupIds: [
        vpcModule.securityGroupWeb.id,
        vpcModule.securityGroupSsh.id,
      ],
      instanceType: 't3.micro',
      iamInstanceProfile: iamModule.ec2Role.name,
      keyName: 'tap-ssh-key', // Change this to your key pair name
    });

    // 8. CloudWatch Module
    const cloudWatchModule = new CloudWatchModule(this, 'cloudwatch', {
      environment,
      project,
      region,
      ec2InstanceIds: ec2Module.instances.map(i => i.id),
      rdsInstanceId: rdsModule.dbInstance.id,
      snsTopicArn: '', // Will use internal SNS topic
    });

    // 9. OpenSearch Module
    const openSearchModule = new OpenSearchModule(this, 'opensearch', {
      environment,
      project,
      region,
      kmsKeyId: kmsKey.id,
    });

    // 10. Create CloudTrail for auditing
    const cloudTrailBucket = new aws.s3Bucket.S3Bucket(
      this,
      'cloudtrail-bucket',
      {
        bucket: `${environment}-audit-cloudtrail`,
        tags: {
          Project: project,
          Environment: environment,
        },
      }
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'cloudtrail-bucket-pab',
      {
        bucket: cloudTrailBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    new aws.s3BucketPolicy.S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: cloudTrailBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: cloudTrailBucket.arn,
          },
          {
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${cloudTrailBucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
        ],
      }),
    });

    const cloudTrail = new aws.cloudtrail.Cloudtrail(this, 'cloudtrail', {
      name: `${environment}-audit-trail`,
      s3BucketName: cloudTrailBucket.bucket,
      enableLogging: true,
      enableLogFileValidation: true,
      includeGlobalServiceEvents: true,
      tags: {
        Project: project,
        Environment: environment,
      },
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(s => s.id).join(','),
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(s => s.id).join(','),
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: ec2Module.instances.map(i => i.id).join(','),
      description: 'EC2 Instance IDs',
    });

    new TerraformOutput(this, 'ec2-public-ips', {
      value: ec2Module.instances.map(i => i.publicIp).join(','),
      description: 'EC2 Public IP Addresses',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS Database Endpoint',
    });

    new TerraformOutput(this, 'rds-arn', {
      value: rdsModule.dbInstance.arn,
      description: 'RDS Database ARN',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.id,
      description: 'S3 Bucket Name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'S3 Bucket ARN',
    });

    new TerraformOutput(this, 'cloudfront-domain-name', {
      value: cloudFrontModule.distribution.domainName,
      description: 'CloudFront Distribution Domain Name',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: cloudFrontModule.distribution.id,
      description: 'CloudFront Distribution ID',
    });

    new TerraformOutput(this, 'ec2-role-arn', {
      value: iamModule.ec2Role.arn,
      description: 'EC2 IAM Role ARN',
    });

    new TerraformOutput(this, 'lambda-role-arn', {
      value: iamModule.lambdaRole.arn,
      description: 'Lambda IAM Role ARN',
    });

    new TerraformOutput(this, 'admin-role-arn', {
      value: iamModule.adminRole.arn,
      description: 'Admin IAM Role ARN',
    });

    new TerraformOutput(this, 'database-secret-arn', {
      value: secretsModule.databaseSecret.arn,
      description: 'Database Secrets Manager ARN',
    });

    new TerraformOutput(this, 'config-secret-arn', {
      value: secretsModule.configSecret.arn,
      description: 'Config Secrets Manager ARN',
    });

    new TerraformOutput(this, 'opensearch-endpoint', {
      value: openSearchModule.domain.endpoint,
      description: 'OpenSearch Domain Endpoint',
    });

    new TerraformOutput(this, 'opensearch-arn', {
      value: openSearchModule.domain.arn,
      description: 'OpenSearch Domain ARN',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: cloudTrail.arn,
      description: 'CloudTrail ARN',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: cloudWatchModule.snsTopic.arn,
      description: 'SNS Topic ARN for Alarms',
    });

    new TerraformOutput(this, 'ec2-cpu-alarm-arns', {
      value: cloudWatchModule.ec2CpuAlarms.map(a => a.arn).join(','),
      description: 'EC2 CPU Alarm ARNs',
    });

    new TerraformOutput(this, 'rds-cpu-alarm-arn', {
      value: cloudWatchModule.rdsCpuAlarm.arn,
      description: 'RDS CPU Alarm ARN',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsKey.id,
      description: 'KMS Key ID',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
