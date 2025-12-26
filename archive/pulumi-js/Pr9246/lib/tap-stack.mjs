/**
 * tap-stack.mjs
 *
 * Secure Infrastructure Stack implementing comprehensive security controls
 * including S3 bucket security, IAM policies, Lambda functions, and monitoring
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// LocalStack configuration detection
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK_HOSTNAME !== undefined;

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - Environment suffix for resource naming
 * @property {Object<string, string>} [tags] - Default tags to apply to resources
 */

/**
 * Secure Infrastructure Stack for the TAP project
 * Implements comprehensive security controls following AWS best practices
 */
export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args?.environmentSuffix || 'prod';
    const tags = {
      Environment: environmentSuffix,
      Project: 'myproject',
      SecurityCompliance: 'true',
      ManagedBy: 'Pulumi',
      ...args?.tags,
    };

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(`myproject-${environmentSuffix}-kms-key`, {
      description: 'KMS key for securing data encryption',
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,
      tags: {
        ...tags,
        Name: `myproject-${environmentSuffix}-kms-key`,
      },
    }, { parent: this });

    const kmsKeyAlias = new aws.kms.Alias(`myproject-${environmentSuffix}-kms-alias`, {
      name: `alias/myproject-${environmentSuffix}-key`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // Create S3 access logging bucket first
    const accessLogsBucket = new aws.s3.Bucket(`myproject-${environmentSuffix}-s3-logs`, {
      bucket: `myproject-${environmentSuffix}-s3-access-logs-${Math.random().toString(36).substr(2, 9)}`,
      tags: {
        ...tags,
        Name: `myproject-${environmentSuffix}-s3-logs`,
        Purpose: 'AccessLogs',
      },
    }, { parent: this });

    // Block all public access for logging bucket
    const accessLogsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `myproject-${environmentSuffix}-logs-pab`,
      {
        bucket: accessLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Enable versioning on logging bucket
    const accessLogsBucketVersioning = new aws.s3.BucketVersioningV2(
      `myproject-${environmentSuffix}-logs-versioning`,
      {
        bucket: accessLogsBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Encryption for logging bucket
    const accessLogsBucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
      `myproject-${environmentSuffix}-logs-encryption`,
      {
        bucket: accessLogsBucket.id,
        rules: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        }],
      },
      { parent: this }
    );

    // Create three primary S3 buckets with comprehensive security
    const bucketNames = ['data', 'backups', 'artifacts'];
    const buckets = {};

    bucketNames.forEach((bucketName) => {
      const bucket = new aws.s3.Bucket(`myproject-${environmentSuffix}-s3-${bucketName}`, {
        bucket: `myproject-${environmentSuffix}-${bucketName}-${Math.random().toString(36).substr(2, 9)}`,
        tags: {
          ...tags,
          Name: `myproject-${environmentSuffix}-s3-${bucketName}`,
          Purpose: bucketName.charAt(0).toUpperCase() + bucketName.slice(1),
        },
      }, { parent: this });

      // Block all public access
      new aws.s3.BucketPublicAccessBlock(`myproject-${environmentSuffix}-${bucketName}-pab`, {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }, { parent: this });

      // Enable versioning
      new aws.s3.BucketVersioningV2(`myproject-${environmentSuffix}-${bucketName}-versioning`, {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }, { parent: this });

      // Server-side encryption
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `myproject-${environmentSuffix}-${bucketName}-encryption`,
        {
          bucket: bucket.id,
          rules: [{
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          }],
        },
        { parent: this }
      );

      // Access logging
      new aws.s3.BucketLoggingV2(`myproject-${environmentSuffix}-${bucketName}-logging`, {
        bucket: bucket.id,
        targetBucket: accessLogsBucket.id,
        targetPrefix: `${bucketName}-access-logs/`,
      }, { parent: this });

      // Bucket policy to deny unsecured transport
      new aws.s3.BucketPolicy(`myproject-${environmentSuffix}-${bucketName}-policy`, {
        bucket: bucket.id,
        policy: bucket.arn.apply(arn => JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'DenyInsecureConnections',
              Effect: 'Deny',
              Principal: '*',
              Action: 's3:*',
              Resource: [
                arn,
                `${arn}/*`,
              ],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
          ],
        })),
      }, { parent: this });

      buckets[bucketName] = bucket;
    });

    // IAM Account Password Policy
    const passwordPolicy = new aws.iam.AccountPasswordPolicy(`myproject-${environmentSuffix}-password-policy`, {
      minimumPasswordLength: 12,
      requireLowercaseCharacters: true,
      requireUppercaseCharacters: true,
      requireNumbers: true,
      requireSymbols: true,
      maxPasswordAge: 90,
      passwordReusePrevention: 12,
      hardExpiry: true,
      allowUsersToChangePassword: true,
    }, { parent: this });

    // Lambda execution role with least privilege
    const lambdaRole = new aws.iam.Role(`myproject-${environmentSuffix}-lambda-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
        }],
      }),
      tags: {
        ...tags,
        Name: `myproject-${environmentSuffix}-lambda-role`,
      },
    }, { parent: this });

    // Lambda policy with minimal required permissions
    const lambdaPolicy = new aws.iam.Policy(`myproject-${environmentSuffix}-lambda-policy`, {
      description: 'Minimal permissions for secure Lambda function',
      policy: buckets.data.arn.apply(arn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
            ],
            Resource: `${arn}/*`,
          },
        ],
      })),
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`myproject-${environmentSuffix}-lambda-policy-attachment`, {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    }, { parent: this });

    // CloudWatch log group for Lambda
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(`myproject-${environmentSuffix}-lambda-logs`, {
      name: `/aws/lambda/myproject-${environmentSuffix}-secure-processor`,
      retentionInDays: 14,
      // Note: AWS managed encryption is used by default for CloudWatch Logs
      tags: {
        ...tags,
        Name: `myproject-${environmentSuffix}-lambda-logs`,
      },
    }, { parent: this });

    // Secure Lambda function
    const lambdaFunction = new aws.lambda.Function(`myproject-${environmentSuffix}-lambda-processor`, {
      name: `myproject-${environmentSuffix}-secure-processor`,
      role: lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      timeout: 30,
      memorySize: 128,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
// Secure Lambda function that processes data without exposing sensitive information
// Note: AWS SDK v3 is included in Node.js 18.x runtime

// Environment variables that should never be logged
const SENSITIVE_ENV_VARS = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_SESSION_TOKEN',
  'AWS_SECURITY_TOKEN'
];

// Function to safely log environment info without exposing secrets
function logSafeEnvironmentInfo() {
  const safeEnvVars = {};
  Object.keys(process.env).forEach(key => {
    if (!SENSITIVE_ENV_VARS.some(sensitiveVar => key.includes(sensitiveVar))) {
      safeEnvVars[key] = process.env[key];
    } else {
      safeEnvVars[key] = '[REDACTED]';
    }
  });
  
  console.log('Safe environment variables:', JSON.stringify(safeEnvVars, null, 2));
}

exports.handler = async (event, context) => {
  console.log('Lambda function started');
  console.log('Event received:', JSON.stringify(event, null, 2));
  
  // Log safe environment info
  logSafeEnvironmentInfo();
  
  try {
    // Simulate secure data processing
    const processedData = {
      timestamp: new Date().toISOString(),
      eventId: context.awsRequestId,
      status: 'processed',
      recordsProcessed: event.Records ? event.Records.length : 1
    };
    
    console.log('Data processed successfully:', JSON.stringify(processedData, null, 2));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Data processed securely',
        data: processedData
      })
    };
    
  } catch (error) {
    // Secure error handling - log error without exposing sensitive details
    const safeError = {
      message: 'Processing failed',
      timestamp: new Date().toISOString(),
      requestId: context.awsRequestId
    };
    
    console.error('Processing error occurred:', JSON.stringify(safeError, null, 2));
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal processing error',
        requestId: context.awsRequestId
      })
    };
  }
};
        `),
      }),
      environment: {
        variables: {
          NODE_ENV: 'production',
          LOG_LEVEL: 'info',
          BUCKET_NAME: buckets.data.id,
          AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL || '',
        },
      },
      dependsOn: [lambdaLogGroup],
      tags: {
        ...tags,
        Name: `myproject-${environmentSuffix}-lambda-processor`,
      },
    }, { parent: this });

    // Security Hub - Enable for centralized security posture management
    // Note: Security Hub might already be enabled at the account level
    // Since Security Hub is a singleton resource per account, we'll comment it out if it already exists
    // Uncomment this if Security Hub is not already enabled in your account
    /*
    const securityHub = new aws.securityhub.Account(`myproject-${environmentSuffix}-security-hub`, {
      enableDefaultStandards: true,
    }, { parent: this });
    */
    // For now, we'll create a placeholder for the output
    const securityHub = { arn: pulumi.output('security-hub-already-enabled') };

    // CloudWatch alarms for monitoring
    const bucketSizeAlarm = new aws.cloudwatch.MetricAlarm(`myproject-${environmentSuffix}-bucket-size-alarm`, {
      name: `myproject-${environmentSuffix}-bucket-size-high`,
      description: 'Alert when S3 bucket size is high',
      metricName: 'BucketSizeBytes',
      namespace: 'AWS/S3',
      statistic: 'Average',
      period: 86400,
      evaluationPeriods: 1,
      threshold: 10737418240, // 10GB in bytes
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        BucketName: buckets.data.id,
        StorageType: 'StandardStorage',
      },
      tags: {
        ...tags,
        Name: `myproject-${environmentSuffix}-bucket-size-alarm`,
      },
    }, { parent: this });

    // Register outputs
    this.registerOutputs({
      dataBucketName: buckets.data.id,
      backupsBucketName: buckets.backups.id,
      artifactsBucketName: buckets.artifacts.id,
      accessLogsBucketName: accessLogsBucket.id,
      lambdaFunctionName: lambdaFunction.name,
      lambdaFunctionArn: lambdaFunction.arn,
      kmsKeyId: kmsKey.keyId,
      kmsKeyArn: kmsKey.arn,
      securityHubArn: securityHub.arn,
    });

    // Store references for external access
    this.buckets = buckets;
    this.lambdaFunction = lambdaFunction;
    this.kmsKey = kmsKey;
    this.securityHub = securityHub;
  }
}

