import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import * as aws from '@cdktf/provider-aws';
import {
  S3Module,
  Ec2Module,
  IamLambdaModule,
  RdsModule,
  DynamoDbModule,
  RedshiftModule,
  CloudTrailConfigModule,
  ElbModule,
  ApiGatewayModule,
  EcrModule,
  SnsModule,
  MonitoringModule,
  CloudFrontWafModule,
  CommonTags,
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
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Common tags for all resources
    const commonTags: CommonTags = {
      Environment: 'Production',
      Security: 'Enabled',
      Compliance: 'True',
      Owner: 'DevOps Team',
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
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here

    // Create KMS key for encryption
    const kmsKey = new aws.kmsKey.KmsKey(this, 'master-kms-key', {
      description: 'Master KMS key for encryption',
      enableKeyRotation: true,
      tags: commonTags,
    });

    new aws.kmsAlias.KmsAlias(this, 'master-kms-alias', {
      name: 'alias/tap-master-key',
      targetKeyId: kmsKey.id,
    });

    // Create centralized logging bucket first
    const loggingBucket = new S3Module(
      this,
      'central-logging',
      'tap-central-logging-bucket',
      kmsKey.arn,
      'tap-central-logging-bucket', // Self-logging
      commonTags
    );

    // CloudTrail and Config
    const cloudTrailConfig = new CloudTrailConfigModule(
      this,
      'cloudtrail-config',
      kmsKey.arn,
      commonTags
    );

    // S3 Buckets
    const applicationBucket = new S3Module(
      this,
      'app-bucket',
      'tap-application-data',
      kmsKey.arn,
      loggingBucket.bucket.id,
      commonTags
    );

    new S3Module(
      this,
      'backup-bucket',
      'tap-backup-data',
      kmsKey.arn,
      loggingBucket.bucket.id,
      commonTags
    );

    // VPC data source (using existing VPC)
    const vpcData = new aws.dataAwsVpc.DataAwsVpc(this, 'existing-vpc', {
      id: 'vpc-abc123',
    });

    // Get subnets in specific availability zones
    const subnetA = new aws.dataAwsSubnet.DataAwsSubnet(this, 'subnet-a', {
      vpcId: 'vpc-abc123',
      availabilityZone: availabilityZones[0],
      filter: [
        {
          name: 'tag:Name',
          values: ['*private*'],
        },
      ],
    });

    const subnetB = new aws.dataAwsSubnet.DataAwsSubnet(this, 'subnet-b', {
      vpcId: 'vpc-abc123',
      availabilityZone: availabilityZones[1],
      filter: [
        {
          name: 'tag:Name',
          values: ['*private*'],
        },
      ],
    });

    const subnetIds = [subnetA.id, subnetB.id];

    // EC2 Instance
    const ec2Instance = new Ec2Module(
      this,
      'web-server',
      't3.medium',
      ami.id,
      subnetA.id,
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
      'nodejs18.x',
      applicationBucket.bucket.id,
      'lambda/api-processor.zip',
      kmsKey.arn,
      commonTags
    );

    // RDS Database
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

    // Redshift Cluster
    new RedshiftModule(
      this,
      'analytics',
      'tap-analytics-cluster',
      'dc2.large',
      2,
      availabilityZones[0],
      commonTags
    );

    // Application Load Balancer
    const alb = new ElbModule(
      this,
      'main-alb',
      vpcData.id,
      subnetIds,
      loggingBucket.bucket.bucket!,
      commonTags
    );

    // API Gateway
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

    // CloudFront with WAF
    const cloudFront = new CloudFrontWafModule(
      this,
      'cdn',
      alb.alb.dnsName,
      loggingBucket.bucket.bucketDomainName!,
      commonTags
    );

    // Outputs for compliance verification
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

    new TerraformOutput(this, 'cloudtrail-enabled', {
      value: cloudTrailConfig.trail.name,
      description: 'CloudTrail name',
    });

    new TerraformOutput(this, 'waf-enabled', {
      value: cloudFront.waf.name,
      description: 'WAF Web ACL name',
    });

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
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
