import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

import * as aws from '@cdktf/provider-aws';
import {
  S3Module,
  Ec2Module,
  IamLambdaModule,
  RdsModule,
  DynamoDbModule,
  RedshiftModule,
  ElbModule,
  ApiGatewayModule,
  EcrModule,
  SnsModule,
  MonitoringModule,
  CloudFrontWafModule,
  VpcModule,
  CloudTrailModule,
  CommonTags,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

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
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account ID
    const current = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current-account'
    );

    // Common tags for all resources
    const commonTags: CommonTags = {
      Environment: 'Production',
      Security: 'Enabled',
      Compliance: 'True',
      Owner: 'DevOps Team',
      Region: awsRegion, // Add region to tags
    };

    // Get latest Amazon Linux 2 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
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
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Create KMS key for encryption
    // Create KMS key for encryption with proper policy
    const kmsKey = new aws.kmsKey.KmsKey(this, 'master-kms-key', {
      description: 'Master KMS key for encryption',
      enableKeyRotation: true,
      tags: commonTags,

      // Add key policy to allow CloudTrail to use the key
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`,
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
            Action: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
            Resource: '*',
            Condition: {
              StringLike: {
                'kms:EncryptionContext:aws:cloudtrail:arn': [
                  `arn:aws:cloudtrail:*:${current.accountId}:trail/*`,
                ],
              },
            },
          },
          {
            Sid: 'Allow CloudTrail to decrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 'kms:CreateGrant',
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:GrantOperations': [
                  'Decrypt',
                  'GenerateDataKey',
                  'CreateGrant',
                  'DescribeKey',
                  'RetireGrant',
                ],
              },
            },
          },
        ],
      }),
    });

    new aws.kmsAlias.KmsAlias(this, 'master-kms-alias', {
      name: 'alias/tap-master-key',
      targetKeyId: kmsKey.id,
    });

    // Create centralized logging bucket with ALB permissions

    const loggingBucket = new S3Module(
      this,
      'central-logging',
      'tap-central-logging-unique-name',
      kmsKey.id,
      '', // No log bucket for the logging bucket itself
      commonTags,
      true, // This IS the logging bucket
      current.accountId, // Pass account ID
      awsRegion // Use the actual region variable instead of hardcoded 'eu-north-1'
    );

    // Add CloudTrail
    const cloudTrail = new CloudTrailModule(
      this,
      'cloudtrail',
      kmsKey.arn,
      commonTags
    );

    // S3 Buckets
    const applicationBucket = new S3Module(
      this,
      'app-bucket',
      `tap-application-data-${current.accountId}`, // Make unique
      kmsKey.arn,
      loggingBucket.bucket.id,
      commonTags
    );

    new S3Module(
      this,
      'backup-bucket',
      `tap-backup-data-${current.accountId}`, // Make unique
      kmsKey.arn,
      loggingBucket.bucket.id,
      commonTags
    );

    // Create NEW VPC instead of using existing one
    const vpc = new VpcModule(
      this,
      'main-vpc',
      '10.0.0.0/16',
      availabilityZones,
      commonTags
    );

    // Use the private subnet IDs from our new VPC
    const subnetIds = vpc.privateSubnets.map(subnet => subnet.id);

    // Create EC2 Instance with new VPC
    const ec2Instance = new Ec2Module(
      this,
      'web-server',
      't3.medium',
      ami.id,
      vpc.privateSubnets[0].id,
      vpc.vpc.id,
      availabilityZones[0],
      kmsKey.arn,
      commonTags
    );

    // Lambda Function
    new IamLambdaModule(
      this,
      'api-processor',
      'tap-api-processor',
      'index.handler',
      'nodejs20.x',
      'my-lambda-bucket777',
      'lambda/lambda-function.zip',
      kmsKey.arn,
      commonTags
    );

    // RDS Database with new subnets
    const rdsDatabase = new RdsModule(
      this,
      'main-db',
      'db.t3.medium',
      'postgres',
      subnetIds,
      availabilityZones[0],
      commonTags
    );

    // DynamoDB Table
    const dynamoTable = new DynamoDbModule(
      this,
      'session-table',
      'tap-user-sessions',
      commonTags
    );

    // Redshift Cluster - with corrected node type
    new RedshiftModule(
      this,
      'analytics',
      'tap-analytics-cluster',
      'ra3.xlplus',
      2,
      subnetIds, // Pass the subnet IDs from VPC
      commonTags
    );

    // Application Load Balancer with new VPC
    const alb = new ElbModule(
      this,
      'main-alb',
      vpc.vpc.id,
      vpc.publicSubnets.map(subnet => subnet.id),
      loggingBucket.bucket.bucket!,
      commonTags
    );

    // API Gateway with fixed implementation
    const apiGateway = new ApiGatewayModule(
      this,
      'rest-api',
      'tap-api',
      kmsKey.arn,
      commonTags
    );

    // ECR Repository
    const ecrRepo = new EcrModule(
      this,
      'app-repo',
      'tap-application',
      commonTags
    );

    // SNS Topic for notifications
    const snsTopic = new SnsModule(
      this,
      'alerts',
      'tap-security-alerts',
      kmsKey.arn,
      commonTags
    );

    // CloudWatch Monitoring
    new MonitoringModule(
      this,
      'security-monitoring',
      snsTopic.topic.arn,
      commonTags
    );

    // CloudFront without WAF (WAF requires us-east-1)
    const cloudFront = new CloudFrontWafModule(
      this,
      'cdn',
      alb.alb.dnsName,
      loggingBucket.bucket.bucketDomainName!,
      commonTags,
      false // Don't create WAF in non-us-east-1 regions
    );

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpc.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpc.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'aws-region', {
      value: awsRegion,
      description: 'AWS Region',
    });

    new TerraformOutput(this, 'availability-zones', {
      value: availabilityZones.join(', '),
      description: 'Availability zones used',
    });

    new TerraformOutput(this, 'ami-id', {
      value: ami.id,
      description: 'Amazon Linux 2 AMI ID',
    });

    new TerraformOutput(this, 's3-versioning-enabled', {
      value: applicationBucket.bucketVersioning.versioningConfiguration.status,
      description: 'S3 bucket versioning status',
    });

    new TerraformOutput(this, 'rds-encryption-enabled', {
      value: rdsDatabase.dbInstance.storageEncrypted,
      description: 'RDS encryption status',
    });

    // Add CloudTrail output
    new TerraformOutput(this, 'cloudtrail-enabled', {
      value: cloudTrail.trail.name,
      description: 'CloudTrail name',
    });

    new TerraformOutput(this, 'cloudtrail-bucket', {
      value: cloudTrail.trailBucket.bucket,
      description: 'CloudTrail S3 bucket name',
    });

    new TerraformOutput(this, 'cloudtrail-log-group', {
      value: cloudTrail.logGroup.name,
      description: 'CloudTrail CloudWatch Log Group',
    });

    // WAF output - only if WAF was created
    if (cloudFront.waf) {
      new TerraformOutput(this, 'waf-enabled', {
        value: cloudFront.waf.name,
        description: 'WAF Web ACL name',
      });
    }

    new TerraformOutput(this, 'api-gateway-logging', {
      value: apiGateway.stage.accessLogSettings?.destinationArn,
      description: 'API Gateway logging destination',
    });

    new TerraformOutput(this, 'dynamodb-pitr-enabled', {
      value: dynamoTable.table.pointInTimeRecovery?.enabled,
      description: 'DynamoDB PITR status',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: cloudFront.distribution.id,
      description: 'CloudFront distribution ID',
    });

    new TerraformOutput(this, 'ecr-repository-url', {
      value: ecrRepo.repository.repositoryUrl,
      description: 'ECR repository URL',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Instance.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsKey.id,
      description: 'Master KMS key ID',
    });

    new TerraformOutput(this, 'account-id', {
      value: current.accountId,
      description: 'AWS Account ID',
    });
  }
}
