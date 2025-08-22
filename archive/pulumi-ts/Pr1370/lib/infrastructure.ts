/**
 * infrastructure.ts
 *
 * This module defines the Infrastructure class that instantiates and orchestrates
 * all infrastructure components with consistent naming conventions.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { S3Stack } from './s3-stack';
import { IAMStack } from './iam-stack';
import { RDSStack } from './rds-stack';
import { DynamoDBStack } from './dynamodb-stack';

export interface InfrastructureArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export interface InfrastructureSummary {
  s3Bucket: string;
  iamRole: string;
  rdsEndpoint: string;
  dynamoTable: string;
  region: string;
  encryptionStatus: string;
}

export class Infrastructure extends pulumi.ComponentResource {
  public readonly s3BucketId: pulumi.Output<string>;
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly iamRoleArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly rdsInstanceId: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly dynamoTableArn: pulumi.Output<string>;
  public readonly infrastructureSummary: pulumi.Output<InfrastructureSummary>;

  constructor(name: string, args: InfrastructureArgs, opts?: ResourceOptions) {
    super('tap:infrastructure:Infrastructure', name, args, opts);

    const region = 'ap-south-1';
    const namePrefix = 'corp';

    // Create AWS Provider for the specific region
    const awsProvider = new aws.Provider(
      'aws-provider',
      {
        region: region,
        defaultTags: {
          tags: {
            Environment: args.environmentSuffix,
            Project: 'corporate-infrastructure',
            ManagedBy: 'pulumi',
            Region: region,
          },
        },
      },
      { parent: this }
    );

    // Common tags for all resources
    const commonTags = {
      Environment: args.environmentSuffix,
      Project: 'corporate-infrastructure',
      ManagedBy: 'pulumi',
      Owner: 'infrastructure-team',
      CostCenter: 'IT-Operations',
      Region: region,
      ...args.tags,
    };

    // Provider options to ensure all resources use the correct region
    const providerOpts: ResourceOptions = {
      parent: this,
      provider: awsProvider,
    };

    // --- Instantiate Infrastructure Components ---

    // S3 Stack - Create secure S3 bucket with encryption
    const s3Stack = new S3Stack(
      'tap-s3',
      {
        environmentSuffix: args.environmentSuffix,
        tags: commonTags,
        namePrefix: namePrefix,
      },
      providerOpts
    );

    // IAM Stack - Create IAM role with restricted S3 access
    const iamStack = new IAMStack(
      'tap-iam',
      {
        environmentSuffix: args.environmentSuffix,
        tags: commonTags,
        namePrefix: namePrefix,
        bucketArn: s3Stack.bucketArn,
        region: region,
      },
      providerOpts
    );

    // RDS Stack - Create encrypted RDS instance
    const rdsStack = new RDSStack(
      'tap-rds',
      {
        environmentSuffix: args.environmentSuffix,
        tags: commonTags,
        namePrefix: namePrefix,
      },
      providerOpts
    );

    // DynamoDB Stack - Create DynamoDB table with comprehensive configuration
    const dynamoStack = new DynamoDBStack(
      'tap-dynamodb',
      {
        environmentSuffix: args.environmentSuffix,
        tags: commonTags,
        namePrefix: namePrefix,
      },
      providerOpts
    );

    // --- Expose Outputs from Infrastructure Components ---
    this.s3BucketId = s3Stack.bucketId;
    this.s3BucketArn = s3Stack.bucketArn;
    this.iamRoleArn = iamStack.roleArn;
    this.rdsEndpoint = rdsStack.endpoint;
    this.rdsInstanceId = rdsStack.instanceId;
    this.dynamoTableName = dynamoStack.tableName;
    this.dynamoTableArn = dynamoStack.tableArn;

    // Infrastructure summary for verification
    this.infrastructureSummary = pulumi
      .all([
        this.s3BucketId,
        this.iamRoleArn,
        this.rdsEndpoint,
        this.dynamoTableName,
      ])
      .apply(([bucketId, roleArn, dbEndpoint, tableId]) => ({
        s3Bucket: bucketId,
        iamRole: roleArn,
        rdsEndpoint: dbEndpoint,
        dynamoTable: tableId,
        region: region,
        encryptionStatus: 'All resources encrypted with AWS-managed KMS keys',
      }));

    // Register the outputs of this component
    this.registerOutputs({
      s3BucketId: this.s3BucketId,
      s3BucketArn: this.s3BucketArn,
      iamRoleArn: this.iamRoleArn,
      rdsEndpoint: this.rdsEndpoint,
      rdsInstanceId: this.rdsInstanceId,
      dynamoTableName: this.dynamoTableName,
      dynamoTableArn: this.dynamoTableArn,
      infrastructureSummary: this.infrastructureSummary,
    });
  }
}
