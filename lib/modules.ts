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
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Utility: Create a temporary ZIP for Lambda deployment
 * Accepts Python code string and returns a filename for the LambdaFunction
 */
function createLambdaZip(lambdaCode: string, lambdaName: string): string {
  const tempDir = path.resolve(__dirname, 'tmp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const pyFile = path.join(tempDir, 'lambda_function.py');
  fs.writeFileSync(pyFile, lambdaCode);

  const zipFile = path.join(tempDir, `${lambdaName}.zip`);
  execSync(`zip -j ${zipFile} ${pyFile}`); // -j = no folder structure
  return zipFile;
}

/**
 * Configuration interface for Lambda function module
 */
export interface LambdaModuleConfig {
  functionName: string;
  s3BucketName: string;
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

    // CloudWatch Log Group
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: `/aws/lambda/corp-${config.functionName}`,
      retentionInDays: 14,
      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
      },
    });

    // IAM Role for Lambda
    const assumeRolePolicy = new DataAwsIamPolicyDocument(this, 'assume-role', {
      statement: [
        {
          effect: 'Allow',
          principals: [
            { type: 'Service', identifiers: ['lambda.amazonaws.com'] },
          ],
          actions: ['sts:AssumeRole'],
        },
      ],
    });

    this.role = new IamRole(this, 'lambda-role', {
      name: `corp-${config.functionName}-role`,
      assumeRolePolicy: assumeRolePolicy.json,
      tags: {
        Environment: 'production',
        Service: 'serverless-image-processing',
      },
    });

    // Attach S3 read & CloudWatch log policies
    const policyDoc = new DataAwsIamPolicyDocument(this, 'lambda-policy', {
      statement: [
        {
          effect: 'Allow',
          actions: ['s3:GetObject', 's3:GetObjectVersion'],
          resources: [`arn:aws:s3:::corp-${config.s3BucketName}/*`],
        },
        {
          effect: 'Allow',
          actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
          resources: [`${this.logGroup.arn}:*`],
        },
      ],
    });

    new IamRolePolicy(this, 'lambda-policy-attachment', {
      name: `corp-${config.functionName}-policy`,
      role: this.role.id,
      policy: policyDoc.json,
    });

    new IamRolePolicyAttachment(this, 'vpc-execution-role', {
      role: this.role.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Python code inline
    const lambdaCode = `
def handler(event, context):
    print("Received event:", event)
    return {"statusCode": 200, "body": "Hello from Lambda!"}
`;

    const zipFile = createLambdaZip(lambdaCode, config.functionName);
    const subnets = new DataAwsSubnets(this, 'subnets', {
      filter: [
        { name: 'vpc-id', values: [config.vpcId] },
        { name: 'tag:Type', values: ['private'] }, // assuming private subnets are tagged
      ],
    });

    // Lambda Function
    this.function = new LambdaFunction(this, 'function', {
      functionName: `corp-${config.functionName}`,
      role: this.role.arn,
      handler: 'lambda_function.handler',
      runtime: 'python3.9',
      filename: zipFile,
      timeout: config.timeout || 30,
      memorySize: config.memorySize || 256,
      environment: { variables: { ...config.environment } },
      vpcConfig: {
        subnetIds: subnets.ids,
        securityGroupIds: [], // add security group IDs here
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

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // S3 bucket for image uploads with corporate naming convention
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: `corp-${config.bucketName}`,

      // Security and compliance settings
      versioning: {
        enabled: true, // Enable versioning for data protection
      },

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
    new LambdaPermission(this, 'lambda-permission', {
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
            events: ['s3:ObjectCreated:*'], // Trigger on any object creation event
            filterPrefix: '', // No prefix filter - process all uploads
            filterSuffix: '', // No suffix filter - process all file types
          },
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
