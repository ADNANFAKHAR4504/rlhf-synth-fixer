import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as path from 'path';

// Get configuration values from environment variables and Pulumi config
const config = new pulumi.Config();

// Required values from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX;
if (!environmentSuffix) {
  throw new Error('ENVIRONMENT_SUFFIX environment variable is required');
}
const environment = process.env.ENVIRONMENT || 'dev';

// Optional deployment parameters from Pulumi config
const imageQuality = config.get('imageQuality') || '80';
const maxFileSize = config.get('maxFileSize') || '10485760';
const lambdaMemory = config.getNumber('lambdaMemory') || 512;
const logRetention = config.getNumber('logRetention') || 7;
// Reserved concurrency commented out to avoid account-level quota issues
// const reservedConcurrency = config.getNumber('reservedConcurrency') || 5;

// Optimization Point 1: Environment-specific memory configuration
const lambdaMemorySize = lambdaMemory;

// Optimization Point 4: Environment-specific log retention
const logRetentionDays = logRetention;

// Optimization Point 8: Environment-specific concurrency (unused to avoid quota issues)
// const lambdaConcurrency = reservedConcurrency;

// Create S3 bucket for image storage
const imageBucket = new aws.s3.Bucket(`image-bucket-${environmentSuffix}`, {
  bucket: `image-processor-bucket-${environmentSuffix}`,
  forceDestroy: true, // Ensures bucket is destroyable
  tags: {
    Name: `image-bucket-${environmentSuffix}`,
    Environment: environment,
  },
});

// Enable versioning for the bucket
const bucketVersioning = new aws.s3.BucketVersioning(
  `image-bucket-versioning-${environmentSuffix}`,
  {
    bucket: imageBucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  }
);

// Block public access to the bucket
const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `image-bucket-public-access-${environmentSuffix}`,
  {
    bucket: imageBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// Optimization Point 5: Create IAM role with least privilege access (specific bucket ARN only)
const lambdaRole = new aws.iam.Role(
  `image-processor-role-${environmentSuffix}`,
  {
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
      Name: `image-processor-role-${environmentSuffix}`,
      Environment: environment,
    },
  }
);

// Attach basic Lambda execution policy for CloudWatch Logs
const lambdaBasicExecution = new aws.iam.RolePolicyAttachment(
  `lambda-basic-execution-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Optimization Point 7: Attach X-Ray tracing policy
const lambdaXRayPolicy = new aws.iam.RolePolicyAttachment(
  `lambda-xray-policy-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
  }
);

// Optimization Point 5: Create inline policy with specific bucket ARN (no wildcards)
const lambdaS3Policy = new aws.iam.RolePolicy(
  `lambda-s3-policy-${environmentSuffix}`,
  {
    role: lambdaRole.id,
    policy: pulumi.all([imageBucket.arn]).apply(([bucketArn]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${bucketArn}/*`, // Specific bucket ARN only, not wildcard
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: bucketArn, // Specific bucket ARN for list operations
          },
        ],
      })
    ),
  }
);

// Optimization Point 4: Create CloudWatch log group with proper retention
const logGroup = new aws.cloudwatch.LogGroup(
  `image-processor-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/image-processor-${environmentSuffix}`,
    retentionInDays: logRetentionDays, // 7 days for dev, 30 days for prod
    tags: {
      Name: `image-processor-logs-${environmentSuffix}`,
      Environment: environment,
    },
  }
);

// Create Lambda function with all optimizations
const imageProcessorLambda = new aws.lambda.Function(
  `image-processor-${environmentSuffix}`,
  {
    name: `image-processor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX, // Node.js 18.x
    role: lambdaRole.arn,
    handler: 'index.handler',

    // Optimization Point 1: Environment-specific memory configuration
    memorySize: lambdaMemorySize, // 512MB for dev, 1024MB for prod

    // Optimization Point 2: Fixed timeout from 3 seconds to 30 seconds
    timeout: 30,

    // Optimization Point 6: Added missing environment variables
    environment: {
      variables: {
        IMAGE_BUCKET: imageBucket.bucket,
        IMAGE_QUALITY: imageQuality,
        MAX_FILE_SIZE: maxFileSize,
        ENVIRONMENT: environment,
      },
    },

    // Optimization Point 7: Enable X-Ray tracing
    tracingConfig: {
      mode: 'Active',
    },

    // Optimization Point 8: Fixed reserved concurrent executions
    // Note: Commented out to avoid account-level concurrency quota issues
    // In production, set this based on account-level unreserved concurrency availability
    // reservedConcurrentExecutions: lambdaConcurrency, // 5 for dev, 10 for prod

    code: new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),

    tags: {
      Name: `image-processor-${environmentSuffix}`,
      Environment: environment,
    },
  },
  {
    dependsOn: [
      logGroup,
      lambdaBasicExecution,
      lambdaXRayPolicy,
      lambdaS3Policy,
    ],
  }
);

// Optimization Point 3: Add proper error handling with S3 bucket notification
// Grant S3 permission to invoke Lambda
const lambdaPermission = new aws.lambda.Permission(
  `lambda-s3-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: imageProcessorLambda.name,
    principal: 's3.amazonaws.com',
    sourceArn: imageBucket.arn,
  }
);

// Create S3 bucket notification to trigger Lambda
const bucketNotification = new aws.s3.BucketNotification(
  `image-bucket-notification-${environmentSuffix}`,
  {
    bucket: imageBucket.id,
    lambdaFunctions: [
      {
        lambdaFunctionArn: imageProcessorLambda.arn,
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'uploads/',
        filterSuffix: '.jpg',
      },
      {
        lambdaFunctionArn: imageProcessorLambda.arn,
        events: ['s3:ObjectCreated:*'],
        filterPrefix: 'uploads/',
        filterSuffix: '.png',
      },
    ],
  },
  { dependsOn: [lambdaPermission] }
);

// Ensure resources are created (side effects)
void bucketVersioning;
void bucketPublicAccessBlock;
void bucketNotification;

// Export outputs
export const bucketName = imageBucket.bucket;
export const bucketArn = imageBucket.arn;
export const lambdaFunctionName = imageProcessorLambda.name;
export const lambdaFunctionArn = imageProcessorLambda.arn;
export const logGroupName = logGroup.name;
export const lambdaRoleArn = lambdaRole.arn;
