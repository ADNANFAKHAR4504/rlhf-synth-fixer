import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets';
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketNotification } from '@cdktf/provider-aws/lib/s3-bucket-notification';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import {
  App,
  AssetType,
  TerraformAsset,
  TerraformOutput,
  TerraformStack,
} from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';

export class TapStack extends TerraformStack {
  constructor(
    scope: Construct,
    id: string,
    props?: {
      environmentSuffix?: string;
      stateBucket?: string;
      stateBucketRegion?: string;
      awsRegion?: string;
      vpcId?: string;
      defaultTags?: { tags: Record<string, string> };
    }
  ) {
    super(scope, id);

    const awsRegion = props?.awsRegion || 'us-east-1';

    // AWS Provider configuration
    new AwsProvider(this, 'aws', {
      region: awsRegion,
    });

    // Data sources for account ID and region
    const current = new DataAwsCallerIdentity(this, 'current');
    const currentRegion = new DataAwsRegion(this, 'current-region');

    // Get environment suffix from props, defaulting to 'dev'
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Project prefix for consistent naming as per requirements
    const projectPrefix = `projectXYZ-${environmentSuffix}`;

    // VPC Configuration - use data source to get default VPC instead of hardcoded value
    const defaultVpc = new DataAwsVpc(this, 'default-vpc', {
      default: true,
    });
    const vpcId = props?.vpcId || defaultVpc.id;

    // Get subnets for the specified VPC
    const vpcSubnets = new DataAwsSubnets(this, 'vpc-subnets', {
      filter: [
        {
          name: 'vpc-id',
          values: [vpcId],
        },
      ],
    });

    // Create dedicated security group for Lambda
    const lambdaSecurityGroup = new SecurityGroup(
      this,
      'lambda-security-group',
      {
        name: `${projectPrefix}-lambda-sg`,
        description: 'Security group for Lambda data processing function',
        vpcId: vpcId,
        egress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound for S3/KMS API calls',
          },
        ],
        tags: {
          Name: `${projectPrefix}-lambda-sg`,
          Project: projectPrefix,
          Environment: environmentSuffix,
        },
      }
    );

    // KMS Key for S3 encryption at rest
    const s3KmsKey = new KmsKey(this, 's3-kms-key', {
      description: `${projectPrefix} S3 encryption key`,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable Key Management',
            Effect: 'Allow',
            Principal: {
              AWS: [
                `arn:aws:iam::${current.accountId}:root`,
                // Restrict to specific roles if needed
              ],
            },
            Action: [
              'kms:Create*',
              'kms:Describe*',
              'kms:Enable*',
              'kms:List*',
              'kms:Put*',
              'kms:Update*',
              'kms:Revoke*',
              'kms:Disable*',
              'kms:Get*',
              'kms:Delete*',
              'kms:TagResource',
              'kms:UntagResource',
              'kms:ScheduleKeyDeletion',
              'kms:CancelKeyDeletion',
            ],
            Resource: '*',
          },
          {
            Sid: 'Allow S3 Service Access',
            Effect: 'Allow',
            Principal: {
              Service: 's3.amazonaws.com',
            },
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:ViaService': `s3.${awsRegion}.amazonaws.com`,
              },
            },
          },
          {
            Sid: 'Allow Lambda Service Access',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: ['kms:Decrypt'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:ViaService': `s3.${awsRegion}.amazonaws.com`,
              },
            },
          },
        ],
      }),
      tags: {
        Name: `${projectPrefix}-s3-kms-key`,
        Project: projectPrefix,
        Environment: environmentSuffix,
      },
    });

    // KMS Key Alias for easier reference
    new KmsAlias(this, 's3-kms-key-alias', {
      name: `alias/${projectPrefix}-s3-encryption`,
      targetKeyId: s3KmsKey.keyId,
    });

    // S3 Bucket for data processing
    const dataBucket = new S3Bucket(this, 'data-bucket', {
      bucket: `${projectPrefix.toLowerCase()}-data-processing-${current.accountId}`,
      tags: {
        Name: `${projectPrefix}-data-processing-bucket`,
        Project: projectPrefix,
        Environment: environmentSuffix,
      },
    });

    // S3 Bucket Server-Side Encryption Configuration
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'data-bucket-encryption',
      {
        bucket: dataBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: s3KmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // S3 Bucket Public Access Block - security best practice
    new S3BucketPublicAccessBlock(this, 'data-bucket-pab', {
      bucket: dataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // S3 Bucket Policy to enforce HTTPS and encryption
    new S3BucketPolicy(this, 'data-bucket-policy', {
      bucket: dataBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyInsecureConnections',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [dataBucket.arn, `${dataBucket.arn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'DenyUnencryptedObjectUploads',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: `${dataBucket.arn}/*`,
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
              },
            },
          },
        ],
      }),
    });

    // Lambda function code asset from dedicated asset file
    const lambdaAsset = new TerraformAsset(this, 'lambda-asset', {
      path: path.resolve(__dirname, 'lambda'),
      type: AssetType.ARCHIVE,
    });

    // IAM Role for Lambda execution with least privilege
    const lambdaRole = new IamRole(this, 'lambda-execution-role', {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${projectPrefix}-lambda-execution-role`,
        Project: projectPrefix,
        Environment: environmentSuffix,
      },
    });

    // Attach Lambda VPC execution policy (includes basic execution)
    new IamRolePolicyAttachment(this, 'lambda-vpc-execution', {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Custom IAM Policy for S3 and KMS access (principle of least privilege)
    const lambdaS3KmsPolicy = new IamPolicy(this, 'lambda-s3-kms-policy', {
      description: 'Policy for Lambda to access S3 bucket and KMS key',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:GetObjectVersion'],
            Resource: `${dataBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: s3KmsKey.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: `arn:aws:logs:${currentRegion.name}:${current.accountId}:log-group:/aws/lambda/${projectPrefix}-*`,
          },
        ],
      }),
      tags: {
        Name: `${projectPrefix}-lambda-s3-kms-policy`,
        Project: projectPrefix,
        Environment: environmentSuffix,
      },
    });

    // Attach custom policy to Lambda role
    new IamRolePolicyAttachment(this, 'lambda-s3-kms-attachment', {
      role: lambdaRole.name,
      policyArn: lambdaS3KmsPolicy.arn,
    });

    // Lambda function for data processing
    const dataProcessorLambda = new LambdaFunction(
      this,
      'data-processor-lambda',
      {
        functionName: `${projectPrefix}-data-processor`,
        filename: lambdaAsset.path,
        sourceCodeHash: lambdaAsset.assetHash,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        timeout: 300,
        memorySize: 512,
        vpcConfig: {
          subnetIds: vpcSubnets.ids,
          securityGroupIds: [lambdaSecurityGroup.id],
        },
        environment: {
          variables: {
            BUCKET_NAME: dataBucket.bucket,
            KMS_KEY_ID: s3KmsKey.keyId,
            PROJECT_PREFIX: projectPrefix,
          },
        },
        tags: {
          Name: `${projectPrefix}-data-processor`,
          Project: projectPrefix,
          Environment: environmentSuffix,
        },
      }
    );

    // Lambda permission to allow S3 to invoke the function
    new LambdaPermission(this, 's3-lambda-permission', {
      statementId: 'AllowExecutionFromS3Bucket',
      action: 'lambda:InvokeFunction',
      functionName: dataProcessorLambda.functionName,
      principal: 's3.amazonaws.com',
      sourceArn: dataBucket.arn,
    });

    // S3 Bucket Notification to trigger Lambda on object creation
    // Must depend on the Lambda permission to avoid validation errors
    const bucketNotification = new S3BucketNotification(
      this,
      'bucket-notification',
      {
        bucket: dataBucket.id,
        lambdaFunction: [
          {
            lambdaFunctionArn: dataProcessorLambda.arn,
            events: ['s3:ObjectCreated:*'],
            filterPrefix: 'input/',
            filterSuffix: '.json',
          },
        ],
      }
    );

    // Ensure the Lambda permission is created before the bucket notification
    bucketNotification.addOverride('depends_on', [
      'aws_lambda_permission.s3-lambda-permission',
    ]);

    // Terraform Outputs
    new TerraformOutput(this, 'bucket-name', {
      value: dataBucket.bucket,
      description: 'Name of the S3 bucket for data processing',
    });

    new TerraformOutput(this, 'lambda-function-name', {
      value: dataProcessorLambda.functionName,
      description: 'Name of the Lambda function for data processing',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: s3KmsKey.keyId,
      description: 'KMS Key ID used for S3 encryption',
    });

    new TerraformOutput(this, 'lambda-role-arn', {
      value: lambdaRole.arn,
      description: 'ARN of the Lambda execution role',
    });
  }
}

// CDKTF App
const app = new App();
new TapStack(app, 'serverless-data-processing');
app.synth();
