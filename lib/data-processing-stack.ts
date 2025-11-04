import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import {
  getEnvironmentConfig,
  validateEnvironment,
} from './environment-config';

interface DataProcessingStackProps {
  environmentSuffix: string;
  environment: string;
  awsRegion: string;
}

export class DataProcessingStack extends Construct {
  constructor(scope: Construct, id: string, props: DataProcessingStackProps) {
    super(scope, id);

    const { environmentSuffix, environment, awsRegion } = props;

    // Validate environment
    validateEnvironment(environment);

    // Get environment-specific configuration
    const config = getEnvironmentConfig(environment);

    // Initialize Archive Provider for Lambda packaging
    new ArchiveProvider(this, 'archive');

    // Project name for tagging
    const projectName = 'data-processing-pipeline';

    /**
     * S3 Bucket for Data Storage
     * Environment-specific naming with environmentSuffix for uniqueness
     */
    const dataBucket = new S3Bucket(this, 'DataBucket', {
      bucket: `company-data-${environment}-${environmentSuffix}`,
      forceDestroy: true, // Allow destruction for CI/CD
      tags: {
        Name: `company-data-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Enable versioning on the S3 bucket
    new S3BucketVersioningA(this, 'DataBucketVersioning', {
      bucket: dataBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'DataBucketEncryption',
      {
        bucket: dataBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    /**
     * DynamoDB Table for Job Tracking
     * Environment-specific capacity based on configuration
     */
    const jobTable = new DynamodbTable(this, 'JobTable', {
      name: `job-tracking-${environment}-${environmentSuffix}`,
      billingMode: 'PROVISIONED',
      readCapacity: config.dynamodbReadCapacity,
      writeCapacity: config.dynamodbWriteCapacity,
      hashKey: 'jobId',
      rangeKey: 'timestamp',
      attribute: [
        {
          name: 'jobId',
          type: 'S',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
        {
          name: 'status',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'StatusIndex',
          hashKey: 'status',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
          readCapacity: config.dynamodbReadCapacity,
          writeCapacity: config.dynamodbWriteCapacity,
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Name: `job-tracking-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    /**
     * IAM Role for Lambda Function
     * Includes cross-environment access restrictions
     */
    const lambdaRole = new IamRole(this, 'LambdaRole', {
      name: `data-processor-role-${environment}-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `data-processor-role-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Attach basic Lambda execution policy
    new IamRolePolicyAttachment(this, 'LambdaBasicExecution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    /**
     * IAM Policy with Cross-Environment Access Restrictions
     * Explicitly denies access to resources from other environments
     */
    const lambdaPolicy = new IamPolicy(this, 'LambdaPolicy', {
      name: `data-processor-policy-${environment}-${environmentSuffix}`,
      description: `Policy for data processor Lambda in ${environment} environment with cross-environment restrictions`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          // Allow access to S3 bucket in current environment
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: [`${dataBucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: [dataBucket.arn],
          },
          // Deny access to S3 buckets from other environments
          {
            Effect: 'Deny',
            Action: ['s3:*'],
            Resource: ['arn:aws:s3:::company-data-*'],
            Condition: {
              StringNotEquals: {
                's3:ExistingObjectTag/Environment': environment,
              },
            },
          },
          // Allow access to DynamoDB table in current environment
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [jobTable.arn, `${jobTable.arn}/index/*`],
          },
          // Deny access to DynamoDB tables from other environments
          {
            Effect: 'Deny',
            Action: ['dynamodb:*'],
            Resource: ['arn:aws:dynamodb:*:*:table/job-tracking-*'],
            Condition: {
              StringNotEquals: {
                'dynamodb:LeadingKeys': [`${environment}-*`],
              },
            },
          },
          // Allow CloudWatch Logs
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: ['arn:aws:logs:*:*:*'],
          },
        ],
      }),
      tags: {
        Name: `data-processor-policy-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'LambdaPolicyAttachment', {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    /**
     * CloudWatch Log Group with Environment-Specific Retention
     */
    const logGroup = new CloudwatchLogGroup(this, 'LambdaLogGroup', {
      name: `/aws/lambda/data-processor-${environment}-${environmentSuffix}`,
      retentionInDays: config.logRetentionDays,
      tags: {
        Name: `data-processor-logs-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    /**
     * Lambda Function Code Package
     */
    const lambdaArchive = new DataArchiveFile(this, 'LambdaArchive', {
      type: 'zip',
      sourceDir: `${__dirname}/lambda`,
      outputPath: `${__dirname}/.build/lambda-${environment}-${environmentSuffix}.zip`,
    });

    /**
     * Lambda Function for Data Processing
     * Environment-specific memory allocation
     */
    const dataProcessor = new LambdaFunction(this, 'DataProcessor', {
      functionName: `data-processor-${environment}-${environmentSuffix}`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      filename: lambdaArchive.outputPath,
      sourceCodeHash: lambdaArchive.outputBase64Sha256,
      memorySize: config.lambdaMemorySize,
      timeout: 300,
      environment: {
        variables: {
          ENVIRONMENT: environment,
          BUCKET_NAME: dataBucket.bucket,
          TABLE_NAME: jobTable.name,
          REGION: awsRegion,
        },
      },
      tags: {
        Name: `data-processor-${environment}-${environmentSuffix}`,
        Environment: environment,
        Project: projectName,
        EnvironmentSuffix: environmentSuffix,
      },
    });

    // Ensure log group is created before Lambda function
    dataProcessor.node.addDependency(logGroup);

    /**
     * Stack Outputs
     * Clearly identify deployed resources per environment
     */
    new TerraformOutput(this, 'BucketName', {
      value: dataBucket.bucket,
      description: `S3 bucket name for ${environment} environment`,
    });

    new TerraformOutput(this, 'BucketArn', {
      value: dataBucket.arn,
      description: `S3 bucket ARN for ${environment} environment`,
    });

    new TerraformOutput(this, 'TableName', {
      value: jobTable.name,
      description: `DynamoDB table name for ${environment} environment`,
    });

    new TerraformOutput(this, 'TableArn', {
      value: jobTable.arn,
      description: `DynamoDB table ARN for ${environment} environment`,
    });

    new TerraformOutput(this, 'LambdaFunctionName', {
      value: dataProcessor.functionName,
      description: `Lambda function name for ${environment} environment`,
    });

    new TerraformOutput(this, 'LambdaFunctionArn', {
      value: dataProcessor.arn,
      description: `Lambda function ARN for ${environment} environment`,
    });

    new TerraformOutput(this, 'LogGroupName', {
      value: logGroup.name,
      description: `CloudWatch log group name for ${environment} environment`,
    });

    new TerraformOutput(this, 'Environment', {
      value: environment,
      description: 'Deployed environment name',
    });

    new TerraformOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix for resource uniqueness',
    });
  }
}
