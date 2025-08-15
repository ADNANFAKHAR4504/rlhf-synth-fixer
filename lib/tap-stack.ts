/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { S3Stack } from './s3-stack';
import { IAMStack } from './iam-stack';
import { RDSStack } from './rds-stack';
import { DynamoDBStack } from './dynamodb-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export interface InfrastructureSummary {
  s3Bucket: string;
  iamRole: string;
  rdsEndpoint: string;
  dynamoTable: string;
  region: string;
  encryptionStatus: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly s3BucketId: pulumi.Output<string>;
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly iamRoleArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly rdsInstanceId: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly dynamoTableArn: pulumi.Output<string>;
  public readonly infrastructureSummary: pulumi.Output<InfrastructureSummary>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = 'us-east-1';
    const namePrefix = 'corp';
    const uniqueId = 'prod-001';

    // Common tags for all resources
    const commonTags = {
      Environment: 'production',
      Project: 'corporate-infrastructure',
      ManagedBy: 'pulumi',
      Owner: 'infrastructure-team',
      CostCenter: 'IT-Operations',
      ...args.tags,
    };

    // --- Instantiate Nested Components Here ---

    // S3 Stack - Create secure S3 bucket with encryption
    const s3Stack = new S3Stack(
      'tap-s3',
      {
        environmentSuffix: environmentSuffix,
        tags: commonTags,
        namePrefix: namePrefix,
        uniqueId: uniqueId,
      },
      { parent: this }
    );

    // IAM Stack - Create IAM role with restricted S3 access
    const iamStack = new IAMStack(
      'tap-iam',
      {
        environmentSuffix: environmentSuffix,
        tags: commonTags,
        namePrefix: namePrefix,
        uniqueId: uniqueId,
        bucketArn: s3Stack.bucketArn,
        region: region,
      },
      { parent: this }
    );

    // RDS Stack - Create encrypted RDS instance
    const rdsStack = new RDSStack(
      'tap-rds',
      {
        environmentSuffix: environmentSuffix,
        tags: commonTags,
        namePrefix: namePrefix,
        uniqueId: uniqueId,
      },
      { parent: this }
    );

    // DynamoDB Stack - Create DynamoDB table with comprehensive configuration
    const dynamoStack = new DynamoDBStack(
      'tap-dynamodb',
      {
        environmentSuffix: environmentSuffix,
        tags: commonTags,
        namePrefix: namePrefix,
        uniqueId: uniqueId,
      },
      { parent: this }
    );

    // --- Expose Outputs from Nested Components ---
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

    // Register the outputs of this component.
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
