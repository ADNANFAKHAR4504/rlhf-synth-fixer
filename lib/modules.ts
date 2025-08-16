import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketNotification } from '@cdktf/provider-aws/lib/s3-bucket-notification';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

/**
 * Configuration interface for Lambda function module
 */
export interface LambdaModuleConfig {
  functionName: string;
  s3BucketName: string; // bucket where the zip is stored
  s3Key: string; // key of the zip file
  vpcId: string;
  runtime?: string;
  timeout?: number;
  memorySize?: number;
  environment?: { [key: string]: string };
}

/**
 * Configuration interface for S3 bucket module
 */
export interface S3ModuleConfig {
  bucketName: string;
  lambdaFunctionArn: string;
  lambdaFunction: LambdaFunction; // optional: pass instance
}

/**
 * Reusable Lambda function module with VPC integration and CloudWatch logging
 * This module creates a Lambda function with proper IAM roles, VPC configuration,
 * and CloudWatch log group following AWS best practices
 */
export class LambdaModule extends Construct {
  public readonly function: LambdaFunction;
  public readonly role: IamRole;
  public readonly logGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: LambdaModuleConfig) {
    super(scope, id);

    // Get VPC data for subnet configuration
    // const vpc = new DataAwsVpc(this, 'vpc', {
    //   id: config.vpcId,
    // });

    // Get private subnets for Lambda VPC configuration
    const subnets = new DataAwsSubnets(this, 'subnets', {
      filter: [
        {
          name: 'vpc-id',
          values: [config.vpcId],
        },
        {
          name: 'tag:Type', // Assuming subnets are tagged with Type=private
          values: ['private'],
        },
      ],
    });

    // CloudWatch Log Group for Lambda function logs
    // Retention set to 14 days to balance cost and debugging needs
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/corp-${config.functionName}`,
      retentionInDays: 14,
      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
      },
    });

    // IAM assume role policy document for Lambda service
    const assumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'assume-role-policy',
      {
        statement: [
          {
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['lambda.amazonaws.com'],
              },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      }
    );

    // IAM role for Lambda function with corporate naming convention
    this.role = new IamRole(this, 'lambda-role', {
      name: `corp-${config.functionName}-role`,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
      },
    });

    // Custom IAM policy for S3 bucket access and CloudWatch logging
    const lambdaPolicy = new DataAwsIamPolicyDocument(this, 'lambda-policy', {
      statement: [
        {
          // S3 read permissions for the specific bucket
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:GetObjectVersion'],
          resources: [`arn:aws:s3:::corp-${config.s3BucketName}/*`],
        },
        {
          // CloudWatch Logs permissions for function logging
          effect: 'Allow',
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: [`${this.logGroup.arn}:*`],
        },
        {
          // VPC permissions required for Lambda VPC integration
          effect: 'Allow',
          actions: [
            'ec2:CreateNetworkInterface',
            'ec2:DescribeNetworkInterfaces',
            'ec2:DeleteNetworkInterface',
            'ec2:AttachNetworkInterface',
            'ec2:DetachNetworkInterface',
          ],
          resources: ['*'],
        },
      ],
    });

    // Attach custom policy to Lambda role
    new IamRolePolicy(this, 'lambda-policy-attachment', {
      name: `corp-${config.functionName}-policy`,
      role: this.role.id,
      policy: lambdaPolicy.json,
    });

    // Attach AWS managed VPC execution role for Lambda
    new IamRolePolicyAttachment(this, 'vpc-execution-role', {
      role: this.role.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Lambda function with VPC configuration and best practices
    this.function = new LambdaFunction(this, 'function', {
      functionName: `corp-${config.functionName}`,
      role: this.role.arn,
      handler: 'index.handler',
      runtime: config.runtime || 'python3.9',
      s3Bucket: config.s3BucketName,
      s3Key: config.s3Key,

      // Performance and cost optimization settings
      timeout: config.timeout || 30, // 30 seconds default, sufficient for most image processing
      memorySize: config.memorySize || 256, // 256MB default, can be adjusted based on workload

      // VPC configuration for secure network access
      vpcConfig: {
        subnetIds: subnets.ids,
        securityGroupIds: [], // Should be provided via variables in production
      },

      // Environment variables for runtime configuration
      environment: {
        variables: {
          LOG_LEVEL: 'INFO',
          S3_BUCKET: `corp-${config.s3BucketName}`,
          ...config.environment,
        },
      },

      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
      },

      dependsOn: [this.logGroup],
    });
  }
}

/**
 * Reusable S3 bucket module with Lambda trigger configuration
 * This module creates an S3 bucket with event notifications to trigger Lambda functions
 * on object uploads, following AWS best practices for event-driven architecture
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketNotification: S3BucketNotification;
  public readonly lambdaPermission: LambdaPermission;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // S3 bucket for image uploads with corporate naming convention
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: `corp-${config.bucketName}`,

      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
        Purpose: 'image-uploads',
      },
    });

    // Create the public access block as a separate resource
    new S3BucketPublicAccessBlock(this, 'bucket-public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable versioning for the S3 bucket
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Server-side encryption for data at rest
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-sse', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });
    // Lambda permission to allow S3 to invoke the function
    this.lambdaPermission = new LambdaPermission(this, 'lambda-permission', {
      statementId: 'AllowExecutionFromS3Bucket',
      action: 'lambda:InvokeFunction',
      functionName: config.lambdaFunctionArn,
      principal: 's3.amazonaws.com',
      sourceArn: this.bucket.arn,
    });

    // S3 bucket notification configuration to trigger Lambda on uploads
    this.bucketNotification = new S3BucketNotification(
      this,
      'bucket-notification',
      {
        bucket: this.bucket.id,
        lambdaFunction: [
          {
            lambdaFunctionArn: config.lambdaFunctionArn,
            events: ['s3:ObjectCreated:*'],
          },
        ],
        dependsOn: [
          ...(config.lambdaFunction ? [config.lambdaFunction] : []),
          this.lambdaPermission,
        ],
      }
    );
  }
}

/**
 * CloudWatch Log Group module for centralized logging
 * This module creates log groups with appropriate retention policies
 * and tagging for cost management and compliance
 */
export class CloudWatchModule extends Construct {
  public readonly logGroup: CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    logGroupName: string,
    retentionDays: number = 14
  ) {
    super(scope, id);

    // CloudWatch Log Group with corporate naming and retention policy
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `corp-${logGroupName}`,
      retentionInDays: retentionDays,

      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
        CostCenter: 'engineering',
      },
    });
  }
}
