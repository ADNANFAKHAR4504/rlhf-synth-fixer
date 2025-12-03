import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { KmsStack } from './kms-stack';
import { DatabaseStack } from './database-stack';
import { DynamodbStack } from './dynamodb-stack';
import { S3Stack } from './s3-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
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
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states-342597974367';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
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

    // Create KMS keys first (needed by other stacks)
    const kmsStack = new KmsStack(this, 'kms', {
      environmentSuffix,
      awsRegion,
    });

    // Create networking stack
    const networkingStack = new NetworkingStack(this, 'networking', {
      environmentSuffix,
      vpcCidr: '10.0.0.0/16',
    });

    // Create database stack
    const databaseStack = new DatabaseStack(this, 'database', {
      environmentSuffix,
      privateSubnets: networkingStack.privateSubnets,
      securityGroup: networkingStack.databaseSecurityGroup,
      kmsKey: kmsStack.databaseKey,
    });

    // Create DynamoDB stack
    const dynamodbStack = new DynamodbStack(this, 'dynamodb', {
      environmentSuffix,
    });

    // Create S3 stack
    const s3Stack = new S3Stack(this, 's3', {
      environmentSuffix,
      kmsKey: kmsStack.s3Key,
    });

    // Create Lambda stack
    const lambdaStack = new LambdaStack(this, 'lambda', {
      environmentSuffix,
      awsRegion,
      rawDataBucket: s3Stack.rawDataBucket,
      processedDataBucket: s3Stack.processedDataBucket,
      sessionsTable: dynamodbStack.sessionsTable,
      securityGroup: networkingStack.lambdaSecurityGroup,
      privateSubnets: networkingStack.privateSubnets,
      kmsKey: kmsStack.lambdaKey,
    });

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(this, 'api-gateway', {
      environmentSuffix,
      lambdaFunction: lambdaStack.dataProcessorFunction,
    });

    // Create outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networkingStack.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'database-endpoint', {
      value: databaseStack.clusterEndpoint,
      description: 'Aurora database endpoint',
    });

    new TerraformOutput(this, 'api-gateway-url', {
      value: apiGatewayStack.apiUrl,
      description: 'API Gateway URL',
    });

    new TerraformOutput(this, 'raw-data-bucket', {
      value: s3Stack.rawDataBucket.id,
      description: 'Raw data S3 bucket name',
    });

    new TerraformOutput(this, 'processed-data-bucket', {
      value: s3Stack.processedDataBucket.id,
      description: 'Processed data S3 bucket name',
    });

    new TerraformOutput(this, 'archive-bucket', {
      value: s3Stack.archiveBucket.id,
      description: 'Archive S3 bucket name',
    });

    new TerraformOutput(this, 'sessions-table', {
      value: dynamodbStack.sessionsTable.name,
      description: 'DynamoDB sessions table name',
    });

    new TerraformOutput(this, 'api-keys-table', {
      value: dynamodbStack.apiKeysTable.name,
      description: 'DynamoDB API keys table name',
    });
  }
}
