import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const normalize = (value?: string): string => (value ? value.trim() : '');

export const parseAllowedOrigins = (value?: string): string[] => {
  const sanitized = (value ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(origin => origin.length > 0);

  return sanitized.length > 0 ? sanitized : ['*'];
};

export interface ResolvedEnvironmentConfig {
  environmentSuffix: string;
  awsRegion: string;
  inputBucketName: string;
  outputBucketName: string;
}

export const resolveEnvironmentConfig = (
  env: NodeJS.ProcessEnv,
  fallbackRegion: string = aws.config.region ?? 'us-east-1'
): ResolvedEnvironmentConfig => {
  const environmentSuffix = normalize(env.ENVIRONMENT_SUFFIX) || 'dev';
  const awsRegion = normalize(env.AWS_REGION) || fallbackRegion || 'us-east-1';
  const inputBucketName =
    normalize(env.INPUT_BUCKET_NAME) || `image-input-${environmentSuffix}`;
  const outputBucketName =
    normalize(env.OUTPUT_BUCKET_NAME) || `image-output-${environmentSuffix}`;

  return {
    environmentSuffix,
    awsRegion,
    inputBucketName,
    outputBucketName,
  };
};

const { environmentSuffix, awsRegion, inputBucketName, outputBucketName } =
  resolveEnvironmentConfig(process.env);

const allowedOrigins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);

// Create KMS key for Lambda environment variable encryption
const kmsKey = new aws.kms.Key(`lambda-encryption-key-${environmentSuffix}`, {
  description: 'KMS key for Lambda environment variable encryption',
  enableKeyRotation: true,
  tags: {
    Name: `lambda-encryption-key-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Create KMS key alias for easier reference
new aws.kms.Alias(`lambda-encryption-alias-${environmentSuffix}`, {
  name: `alias/lambda-encryption-${environmentSuffix}`,
  targetKeyId: kmsKey.keyId,
});

// Create S3 buckets for image processing
const inputBucket = new aws.s3.Bucket(
  `image-input-bucket-${environmentSuffix}`,
  {
    bucket: inputBucketName,
    forceDestroy: true,
    tags: {
      Name: inputBucketName,
      Environment: environmentSuffix,
    },
  }
);

const outputBucket = new aws.s3.Bucket(
  `image-output-bucket-${environmentSuffix}`,
  {
    bucket: outputBucketName,
    forceDestroy: true,
    tags: {
      Name: outputBucketName,
      Environment: environmentSuffix,
    },
  }
);

// Create Lambda Layer for shared dependencies
const sharedLayer = new aws.lambda.LayerVersion(
  `shared-dependencies-layer-${environmentSuffix}`,
  {
    layerName: `shared-dependencies-${environmentSuffix}`,
    code: new pulumi.asset.AssetArchive({
      nodejs: new pulumi.asset.FileArchive(
        './lambda-layers/shared-dependencies'
      ),
    }),
    compatibleRuntimes: ['nodejs18.x', 'nodejs20.x'],
    description: 'Shared dependencies for image processing Lambda functions',
  }
);

// Create IAM role for Lambda functions with S3 access
const lambdaRole = new aws.iam.Role(
  `lambda-execution-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Effect: 'Allow',
        },
      ],
    }),
    tags: {
      Name: `lambda-execution-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment(
  `lambda-basic-execution-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Attach X-Ray write access
new aws.iam.RolePolicyAttachment(`lambda-xray-access-${environmentSuffix}`, {
  role: lambdaRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess',
});

// Create policy for S3 access with least privilege
const s3AccessPolicy = new aws.iam.Policy(
  `lambda-s3-access-policy-${environmentSuffix}`,
  {
    description: 'Least privilege S3 access for Lambda functions',
    policy: pulumi
      .all([inputBucket.arn, outputBucket.arn])
      .apply(([inputArn, outputArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject'],
              Resource: `${inputArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['s3:PutObject'],
              Resource: `${outputArn}/*`,
            },
          ],
        })
      ),
  }
);

const s3PolicyAttachment = new aws.iam.RolePolicyAttachment(
  `lambda-s3-policy-attachment-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn: s3AccessPolicy.arn,
  }
);

// Create policy for KMS access
const kmsAccessPolicy = new aws.iam.Policy(
  `lambda-kms-access-policy-${environmentSuffix}`,
  {
    description: 'KMS access for Lambda environment variable decryption',
    policy: kmsKey.arn.apply(keyArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: keyArn,
          },
        ],
      })
    ),
  }
);

const kmsAccessAttachment = new aws.iam.RolePolicyAttachment(
  `lambda-kms-policy-attachment-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn: kmsAccessPolicy.arn,
  }
);

// CloudWatch Log Groups with 7-day retention
const thumbnailLogGroup = new aws.cloudwatch.LogGroup(
  `thumbnail-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/thumbnail-generator-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `thumbnail-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const watermarkLogGroup = new aws.cloudwatch.LogGroup(
  `watermark-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/watermark-applier-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `watermark-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const metadataLogGroup = new aws.cloudwatch.LogGroup(
  `metadata-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/metadata-extractor-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `metadata-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Thumbnail Generator Lambda Function (Node.js with ARM64)
const thumbnailFunction = new aws.lambda.Function(
  `thumbnail-generator-${environmentSuffix}`,
  {
    name: `thumbnail-generator-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        './lambda-functions/thumbnail-generator'
      ),
    }),
    memorySize: 1024,
    timeout: 60,
    architectures: ['arm64'],
    reservedConcurrentExecutions: 50,
    layers: [sharedLayer.arn],
    environment: {
      variables: {
        INPUT_BUCKET: inputBucketName,
        OUTPUT_BUCKET: outputBucketName,
        ALLOWED_ORIGINS: allowedOrigins.join(','),
      },
    },
    kmsKeyArn: kmsKey.arn,
    tracingConfig: {
      mode: 'Active',
    },
    tags: {
      Name: `thumbnail-generator-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { dependsOn: [thumbnailLogGroup, s3PolicyAttachment, kmsAccessAttachment] }
);

// Watermark Applier Lambda Function (Java with ARM64 and SnapStart)
const watermarkFunction = new aws.lambda.Function(
  `watermark-applier-${environmentSuffix}`,
  {
    name: `watermark-applier-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.Java11,
    handler: 'com.example.WatermarkHandler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive('./lambda-functions/watermark-applier'),
    }),
    memorySize: 512,
    timeout: 60,
    architectures: ['arm64'],
    reservedConcurrentExecutions: 25,
    environment: {
      variables: {
        INPUT_BUCKET: inputBucketName,
        OUTPUT_BUCKET: outputBucketName,
        ALLOWED_ORIGINS: allowedOrigins.join(','),
      },
    },
    kmsKeyArn: kmsKey.arn,
    tracingConfig: {
      mode: 'Active',
    },
    snapStart: {
      applyOn: 'PublishedVersions',
    },
    tags: {
      Name: `watermark-applier-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { dependsOn: [watermarkLogGroup, s3PolicyAttachment, kmsAccessAttachment] }
);

// Metadata Extractor Lambda Function (Node.js with ARM64)
const metadataFunction = new aws.lambda.Function(
  `metadata-extractor-${environmentSuffix}`,
  {
    name: `metadata-extractor-${environmentSuffix}`,
    runtime: aws.lambda.Runtime.NodeJS18dX,
    handler: 'index.handler',
    role: lambdaRole.arn,
    code: new pulumi.asset.AssetArchive({
      '.': new pulumi.asset.FileArchive(
        './lambda-functions/metadata-extractor'
      ),
    }),
    memorySize: 256,
    timeout: 30,
    architectures: ['arm64'],
    reservedConcurrentExecutions: 25,
    layers: [sharedLayer.arn],
    environment: {
      variables: {
        INPUT_BUCKET: inputBucketName,
        OUTPUT_BUCKET: outputBucketName,
        ALLOWED_ORIGINS: allowedOrigins.join(','),
      },
    },
    kmsKeyArn: kmsKey.arn,
    tracingConfig: {
      mode: 'Active',
    },
    tags: {
      Name: `metadata-extractor-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { dependsOn: [metadataLogGroup, s3PolicyAttachment, kmsAccessAttachment] }
);

// Configure X-Ray sampling rule (10% sampling)
new aws.xray.SamplingRule(`image-processing-sampling-${environmentSuffix}`, {
  ruleName: `image-processing-${environmentSuffix}`,
  priority: 1000,
  version: 1,
  reservoirSize: 1,
  fixedRate: 0.1, // 10% sampling
  urlPath: '*',
  host: '*',
  httpMethod: '*',
  serviceName: '*',
  serviceType: '*',
  resourceArn: '*',
  tags: {
    Name: `image-processing-sampling-${environmentSuffix}`,
    Environment: environmentSuffix,
  },
});

// Lambda Function URLs with IAM authentication
const thumbnailFunctionUrl = new aws.lambda.FunctionUrl(
  `thumbnail-url-${environmentSuffix}`,
  {
    functionName: thumbnailFunction.name,
    authorizationType: 'AWS_IAM',
    cors: {
      allowOrigins: allowedOrigins,
      allowMethods: ['POST'],
      allowHeaders: [
        'content-type',
        'x-amz-date',
        'authorization',
        'x-api-key',
      ],
      maxAge: 86400,
    },
  }
);

const watermarkFunctionUrl = new aws.lambda.FunctionUrl(
  `watermark-url-${environmentSuffix}`,
  {
    functionName: watermarkFunction.name,
    authorizationType: 'AWS_IAM',
    cors: {
      allowOrigins: allowedOrigins,
      allowMethods: ['POST'],
      allowHeaders: [
        'content-type',
        'x-amz-date',
        'authorization',
        'x-api-key',
      ],
      maxAge: 86400,
    },
  }
);

const metadataFunctionUrl = new aws.lambda.FunctionUrl(
  `metadata-url-${environmentSuffix}`,
  {
    functionName: metadataFunction.name,
    authorizationType: 'AWS_IAM',
    cors: {
      allowOrigins: allowedOrigins,
      allowMethods: ['POST'],
      allowHeaders: [
        'content-type',
        'x-amz-date',
        'authorization',
        'x-api-key',
      ],
      maxAge: 86400,
    },
  }
);

// Exports
export const inputBucketArn = inputBucket.arn;
export const outputBucketArn = outputBucket.arn;
export const thumbnailFunctionArn = thumbnailFunction.arn;
export const watermarkFunctionArn = watermarkFunction.arn;
export const metadataFunctionArn = metadataFunction.arn;
export const thumbnailUrl = thumbnailFunctionUrl.functionUrl;
export const watermarkUrl = watermarkFunctionUrl.functionUrl;
export const metadataUrl = metadataFunctionUrl.functionUrl;
export const kmsKeyId = kmsKey.keyId;
export const sharedLayerArn = sharedLayer.arn;
export const region = awsRegion;
export const environment = environmentSuffix;
