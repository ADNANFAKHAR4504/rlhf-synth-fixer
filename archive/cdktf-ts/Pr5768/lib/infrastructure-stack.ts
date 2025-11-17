import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import {
  getEnvironmentConfig,
  validateEnvironmentConfig,
  EnvironmentConfig,
} from './environment-config';
import { S3BucketConstruct } from './s3-bucket-construct';
import { DynamodbTableConstruct } from './dynamodb-table-construct';
import { MonitoringConstruct } from './monitoring-construct';
import { IamConstruct } from './iam-construct';

export interface InfrastructureStackProps {
  environmentSuffix: string;
  region: string;
}

export class InfrastructureStack extends Construct {
  private config: EnvironmentConfig;

  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // Get and validate environment configuration
    this.config = getEnvironmentConfig(environmentSuffix);
    validateEnvironmentConfig(this.config);

    // Create S3 bucket with environment-specific configuration
    const s3Bucket = new S3BucketConstruct(this, 'S3Bucket', {
      environmentSuffix,
      config: this.config,
      region,
    });

    // Create DynamoDB table with environment-specific capacity
    const dynamodbTable = new DynamodbTableConstruct(this, 'DynamoDBTable', {
      environmentSuffix,
      config: this.config,
    });

    // Create monitoring with environment-specific thresholds
    const monitoring = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      config: this.config,
      tableName: dynamodbTable.tableName,
    });

    // Create IAM roles with least-privilege policies
    const iam = new IamConstruct(this, 'IAM', {
      environmentSuffix,
      config: this.config,
      bucketArn: s3Bucket.bucketArn,
      tableArn: dynamodbTable.tableArn,
    });

    // Create CloudFormation outputs for key resources
    new TerraformOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 'S3BucketArn', {
      value: s3Bucket.bucketArn,
      description: 'ARN of the S3 bucket',
    });

    new TerraformOutput(this, 'DynamoDBTableName', {
      value: dynamodbTable.tableName,
      description: 'Name of the DynamoDB table',
    });

    new TerraformOutput(this, 'DynamoDBTableArn', {
      value: dynamodbTable.tableArn,
      description: 'ARN of the DynamoDB table',
    });

    new TerraformOutput(this, 'SNSTopicArn', {
      value: monitoring.snsTopicArn,
      description: 'ARN of the SNS topic for alerts',
    });

    new TerraformOutput(this, 'DataAccessRoleArn', {
      value: iam.dataAccessRoleArn,
      description: 'ARN of the IAM role for data access',
    });

    new TerraformOutput(this, 'Environment', {
      value: this.config.environment,
      description: 'Environment name',
    });

    new TerraformOutput(this, 'BillingMode', {
      value: this.config.dynamodbBillingMode,
      description: 'DynamoDB billing mode for this environment',
    });
  }
}
