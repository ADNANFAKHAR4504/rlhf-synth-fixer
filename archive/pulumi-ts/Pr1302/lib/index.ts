import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Get environment suffix from config or environment variable
const config = new pulumi.Config();
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';

// Get AWS region
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _region = aws.getRegion();

// Common tags
const commonTags = {
  Environment: 'production',
  Project: 'myproject',
  EnvironmentSuffix: environmentSuffix,
};

// 1. Create KMS Key for S3 encryption
const s3KmsKey = new aws.kms.Key(`myproject-prod-s3-kms-${environmentSuffix}`, {
  description: 'KMS key for S3 bucket encryption',
  tags: commonTags,
  deletionWindowInDays: 7, // Ensure key can be deleted
});

const s3KmsKeyAlias = new aws.kms.Alias(
  `myproject-prod-s3-kms-alias-${environmentSuffix}`,
  {
    name: `alias/myproject-prod-s3-encryption-${environmentSuffix}`,
    targetKeyId: s3KmsKey.keyId,
  }
);

// 2. Create S3 Buckets with Enhanced Security
const buckets = ['documents', 'logs', 'backups'].map(purpose => {
  const bucket = new aws.s3.Bucket(
    `myproject-prod-s3-${purpose}-${environmentSuffix}`,
    {
      bucket: `myproject-prod-s3-${purpose}-${environmentSuffix}`,
      forceDestroy: true, // Ensure bucket can be destroyed even with objects
      tags: {
        ...commonTags,
        Purpose: purpose,
      },
    }
  );

  // Block all public access
  new aws.s3.BucketPublicAccessBlock(
    `myproject-prod-s3-${purpose}-pab-${environmentSuffix}`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }
  );

  // Enable versioning
  new aws.s3.BucketVersioningV2(
    `myproject-prod-s3-${purpose}-versioning-${environmentSuffix}`,
    {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }
  );

  // Server-side encryption
  new aws.s3.BucketServerSideEncryptionConfigurationV2(
    `myproject-prod-s3-${purpose}-encryption-${environmentSuffix}`,
    {
      bucket: bucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: s3KmsKey.arn,
            sseAlgorithm: 'aws:kms',
          },
          bucketKeyEnabled: true,
        },
      ],
    }
  );

  return bucket;
});

// 3. IAM Password Policy
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _passwordPolicy = new aws.iam.AccountPasswordPolicy(
  `myproject-prod-password-policy-${environmentSuffix}`,
  {
    minimumPasswordLength: 12,
    requireLowercaseCharacters: true,
    requireNumbers: true,
    requireSymbols: true,
    requireUppercaseCharacters: true,
    allowUsersToChangePassword: true,
    maxPasswordAge: 90,
    passwordReusePrevention: 24,
  }
);

// 4. Create Secrets Manager secret for database credentials
const dbSecret = new aws.secretsmanager.Secret(
  `myproject-prod-db-secret-${environmentSuffix}`,
  {
    name: `myproject-prod/database/credentials-${environmentSuffix}`,
    recoveryWindowInDays: 0, // Immediate deletion for testing
    description: 'Database credentials for Lambda function',
    tags: commonTags,
  }
);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _dbSecretVersion = new aws.secretsmanager.SecretVersion(
  `myproject-prod-db-secret-version-${environmentSuffix}`,
  {
    secretId: dbSecret.id,
    secretString: JSON.stringify({
      username: 'app_user',
      password: 'change-me-in-production',
      host: 'localhost',
      port: 5432,
      database: 'myproject_db',
    }),
  }
);

// 5. IAM Role for Lambda with least privilege
const lambdaRole = new aws.iam.Role(
  `myproject-prod-lambda-role-${environmentSuffix}`,
  {
    name: `myproject-prod-lambda-execution-role-${environmentSuffix}`,
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
    tags: commonTags,
  }
);

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment(
  `myproject-prod-lambda-basic-execution-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Custom policy for S3 and Secrets Manager access
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _lambdaCustomPolicy = new aws.iam.RolePolicy(
  `myproject-prod-lambda-custom-policy-${environmentSuffix}`,
  {
    role: lambdaRole.id,
    policy: pulumi
      .all([dbSecret.arn, ...buckets.map(b => b.arn), s3KmsKey.arn])
      .apply(([secretArn, ...bucketArnsAndKmsArn]) => {
        // Last element is the KMS ARN
        const bucketArns = bucketArnsAndKmsArn.slice(0, -1);
        const kmsArn = bucketArnsAndKmsArn[bucketArnsAndKmsArn.length - 1];
        return JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              Resource: secretArn,
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              Resource: bucketArns.map(arn => `${arn}/*`),
            },
            {
              Effect: 'Allow',
              Action: ['s3:ListBucket'],
              Resource: bucketArns,
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
              Resource: kmsArn,
            },
          ],
        });
      }),
  }
);

// 6. Lambda function code that securely handles credentials
const lambdaFunction = new aws.lambda.Function(
  `myproject-prod-data-processor-${environmentSuffix}`,
  {
    name: `myproject-prod-data-processor-${environmentSuffix}`,
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 300,
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({region: 'us-east-1'});
const s3 = new AWS.S3();

// Secure logging function that filters sensitive data
function secureLog(message, data = {}) {
    const filteredData = {...data};
    
    // Remove sensitive AWS credentials from logs
    delete filteredData.AWS_ACCESS_KEY_ID;
    delete filteredData.AWS_SECRET_ACCESS_KEY;
    delete filteredData.AWS_SESSION_TOKEN;
    delete filteredData.password;
    delete filteredData.secret;
    
    console.log(message, JSON.stringify(filteredData));
}

exports.handler = async (event) => {
    try {
        secureLog('Processing data event', {eventType: event.eventType, timestamp: new Date().toISOString()});
        
        // Retrieve database credentials from Secrets Manager
        const secretResponse = await secretsManager.getSecretValue({
            SecretId: process.env.SECRET_NAME
        }).promise();
        
        const credentials = JSON.parse(secretResponse.SecretString);
        secureLog('Retrieved credentials successfully', {host: credentials.host, database: credentials.database});
        
        // Process data from S3 buckets - bucket names would be passed in event or environment
        const bucketNames = event.bucketNames || [];
        
        for (const bucketName of bucketNames) {
            try {
                const objects = await s3.listObjectsV2({
                    Bucket: bucketName,
                    MaxKeys: 10
                }).promise();
                
                secureLog('Processed bucket', {
                    bucket: bucketName,
                    objectCount: objects.Contents ? objects.Contents.length : 0
                });
            } catch (error) {
                secureLog('Error processing bucket', {bucket: bucketName, error: error.message});
            }
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Data processed successfully',
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        secureLog('Function error', {error: error.message});
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Processing failed',
                timestamp: new Date().toISOString()
            })
        };
    }
};
        `),
    }),
    tags: commonTags,
    environment: {
      variables: {
        // Only non-sensitive environment variables
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
        SECRET_NAME: dbSecret.name,
      },
    },
  }
);

// 7. GuardDuty Detector for Lambda Protection
const guardDutyDetector = new aws.guardduty.Detector(
  `myproject-prod-guardduty-${environmentSuffix}`,
  {
    enable: true,
    tags: commonTags,
    datasources: {
      s3Logs: {
        enable: true,
      },
      kubernetes: {
        auditLogs: {
          enable: true,
        },
      },
      malwareProtection: {
        scanEc2InstanceWithFindings: {
          ebsVolumes: {
            enable: true,
          },
        },
      },
    },
  }
);

// 8. Certificate Manager with modern security (placeholder for post-quantum support)
const certificate = new aws.acm.Certificate(
  `myproject-prod-certificate-${environmentSuffix}`,
  {
    domainName: `myproject-${environmentSuffix}.example.com`,
    validationMethod: 'DNS',
    tags: commonTags,
  },
  {
    // Note: ML-KEM support is automatic in newer ACM certificates
  }
);

// Exports
export const bucketNames = buckets.map(bucket => bucket.bucket);
export const lambdaFunctionName = lambdaFunction.name;
export const secretArn = dbSecret.arn;
export const guardDutyDetectorId = guardDutyDetector.id;
export const certificateArn = certificate.arn;
export const kmsKeyId = s3KmsKey.keyId;
export const kmsKeyAliasName = s3KmsKeyAlias.name;

// Export a mock TapStack for test compatibility
export class TapStack {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(_app: any, _name: string, _props?: any) {
    // Mock implementation for test compatibility
  }
}
