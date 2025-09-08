import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  SecurityGroupsModule,
  EC2Module,
  S3Module,
  RDSModule,
  CloudFrontModule,
  LambdaModule,
  CloudWatchModule,
  DynamoDBModule,
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
    // Variables - Configuration without hardcoded values
    const vpcCidrBlock = '10.0.0.0/16';
    const bucketPrefix = `production-app-123456-${environmentSuffix}`;
    const amiId = 'ami-0bbc328167dee8f3c';
    const dbName = 'production-dynamodb-table';

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

    // ? Add your stack instantiations here
    // VPC Infrastructure
    const vpc = new VpcModule(this, 'vpc', vpcCidrBlock);

    // Security Groups
    const securityGroups = new SecurityGroupsModule(
      this,
      'security-groups',
      vpc.vpc.id
    );

    // EC2 Instances in private subnets
    const ec2 = new EC2Module(
      this,
      'ec2',
      vpc.privateSubnets.map(subnet => subnet.id),
      securityGroups.webSecurityGroup.id,
      amiId
    );

    // S3 Buckets with encryption and versioning
    const s3 = new S3Module(this, 's3', bucketPrefix);

    // RDS Database with Multi-AZ
    const rds = new RDSModule(
      this,
      'rds',
      vpc.privateSubnets.map(subnet => subnet.id),
      securityGroups.databaseSecurityGroup.id
    );

    // CloudFront Distribution
    const cloudfront = new CloudFrontModule(
      this,
      'cloudfront',
      s3.contentBucket.bucketDomainName,
      s3.contentBucket.id
    );

    // Lambda Functions in VPC
    const lambda = new LambdaModule(
      this,
      'lambda',
      vpc.privateSubnets.map(subnet => subnet.id),
      securityGroups.lambdaSecurityGroup.id
    );

    // CloudWatch Alarms
    const cloudwatch = new CloudWatchModule(
      this,
      'cloudwatch',
      ec2.instances.map(instance => instance.id)
    );

    // DynamoDB with auto-scaling
    const dynamodb = new DynamoDBModule(this, 'dynamodb', dbName);

    // Outputs - Important resource identifiers
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.vpc.id,
      description: 'VPC ID for the production environment',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: ec2.instances.map(instance => instance.id),
      description: 'EC2 instance IDs for web servers',
    });

    new TerraformOutput(this, 's3-content-bucket-name', {
      value: s3.contentBucket.id,
      description: 'S3 content bucket name',
    });

    new TerraformOutput(this, 's3-logs-bucket-name', {
      value: s3.logsBucket.id,
      description: 'S3 access logs bucket name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS database endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'cloudfront-distribution-domain', {
      value: cloudfront.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: cloudfront.distribution.id,
      description: 'CloudFront distribution ID',
    });

    new TerraformOutput(this, 'dynamodb-table-name', {
      value: dynamodb.table.name,
      description: 'DynamoDB table name',
    });

    new TerraformOutput(this, 'lambda-function-arns', {
      value: lambda.functions.map(func => func.arn),
      description: 'Lambda function ARNs',
    });

    new TerraformOutput(this, 'cloudwatch-alarm-arns', {
      value: cloudwatch.alarms.map(alarm => alarm.arn),
      description: 'CloudWatch alarm ARNs',
    });

    new TerraformOutput(this, 'nat-gateway-ip', {
      value: vpc.natGateway.publicIp,
      description: 'NAT Gateway public IP address',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpc.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpc.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
