# Serverless Media Processing Pipeline - CDK TypeScript Implementation

This implementation creates a serverless image processing pipeline using AWS CDK with TypeScript. The solution includes S3 buckets for source images and thumbnails, a Lambda function with Sharp library for image processing, and proper IAM permissions following least privilege principles.

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';

new TapStack(app, `TapStack-${environmentSuffix}`, {
  environmentSuffix: environmentSuffix,
  environment: environment,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `Serverless Media Processing Pipeline - ${environment} environment`,
});

app.synth();
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environment: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, environment } = props;

    // Source S3 bucket for image uploads
    const sourceBucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: `image-source-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(90),
          id: 'CleanupOldImages',
        },
      ],
    });

    // Destination S3 bucket for thumbnails
    const thumbnailBucket = new s3.Bucket(this, 'ThumbnailBucket', {
      bucketName: `image-thumbnail-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      lifecycleRules: [
        {
          enabled: true,
          expiration: cdk.Duration.days(90),
          id: 'CleanupOldThumbnails',
        },
      ],
    });

    // CloudWatch Log Group for Lambda
    const logGroup = new logs.LogGroup(this, 'ProcessImageLogGroup', {
      logGroupName: `/aws/lambda/process-image-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_WEEK,
    });

    // IAM role for Lambda execution
    const lambdaRole = new iam.Role(this, 'ProcessImageRole', {
      roleName: `process-image-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for image processing Lambda function',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant specific S3 permissions to Lambda role (least privilege)
    sourceBucket.grantRead(lambdaRole);
    thumbnailBucket.grantWrite(lambdaRole);

    // Lambda function for image processing
    const processImageFunction = new lambda.Function(this, 'ProcessImageFunction', {
      functionName: `process-image-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda', 'process-image')),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      environment: {
        THUMBNAIL_BUCKET: thumbnailBucket.bucketName,
        ENVIRONMENT: environment,
        LOG_LEVEL: 'INFO',
      },
      logGroup: logGroup,
      description: 'Processes uploaded images and generates thumbnails',
      reservedConcurrentExecutions: 10,
    });

    // Add S3 event notification to trigger Lambda on object creation
    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processImageFunction),
      {
        suffix: '.jpg',
      }
    );

    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processImageFunction),
      {
        suffix: '.jpeg',
      }
    );

    sourceBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processImageFunction),
      {
        suffix: '.png',
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'SourceBucketName', {
      value: sourceBucket.bucketName,
      description: 'Name of the source S3 bucket for image uploads',
      exportName: `SourceBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ThumbnailBucketName', {
      value: thumbnailBucket.bucketName,
      description: 'Name of the destination S3 bucket for thumbnails',
      exportName: `ThumbnailBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ProcessImageFunctionArn', {
      value: processImageFunction.functionArn,
      description: 'ARN of the image processing Lambda function',
      exportName: `ProcessImageFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group for Lambda function',
      exportName: `LogGroupName-${environmentSuffix}`,
    });

    // Tags for resource management
    cdk.Tags.of(this).add('Environment', environment);
    cdk.Tags.of(this).add('Project', 'MediaProcessingPipeline');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
```

## File: lib/lambda/process-image/index.ts

```typescript
import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { Readable } from 'stream';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const THUMBNAIL_BUCKET = process.env.THUMBNAIL_BUCKET || '';
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 200;

/**
 * Converts a readable stream to a buffer
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

/**
 * Lambda handler for processing S3 image uploads
 */
export const handler: S3Handler = async (event: S3Event): Promise<void> => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const sourceBucket = record.s3.bucket.name;
    const sourceKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing image: ${sourceKey} from bucket: ${sourceBucket}`);

    try {
      // Validate thumbnail bucket configuration
      if (!THUMBNAIL_BUCKET) {
        throw new Error('THUMBNAIL_BUCKET environment variable is not set');
      }

      // Get the original image from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: sourceBucket,
        Key: sourceKey,
      });

      const response = await s3Client.send(getObjectCommand);

      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }

      // Convert stream to buffer
      const imageBuffer = await streamToBuffer(response.Body as Readable);

      console.log(`Image size: ${imageBuffer.length} bytes`);

      // Validate image file
      if (imageBuffer.length === 0) {
        throw new Error('Image file is empty');
      }

      // Generate thumbnail using Sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      console.log(`Thumbnail size: ${thumbnailBuffer.length} bytes`);

      // Generate thumbnail key (add 'thumb-' prefix)
      const thumbnailKey = `thumb-${sourceKey}`;

      // Upload thumbnail to destination bucket
      const putObjectCommand = new PutObjectCommand({
        Bucket: THUMBNAIL_BUCKET,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: 'image/jpeg',
        Metadata: {
          'original-key': sourceKey,
          'original-bucket': sourceBucket,
          'processed-at': new Date().toISOString(),
        },
      });

      await s3Client.send(putObjectCommand);

      console.log(`Successfully created thumbnail: ${thumbnailKey} in bucket: ${THUMBNAIL_BUCKET}`);
    } catch (error) {
      console.error('Error processing image:', error);

      // Log detailed error information
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      // Re-throw to mark Lambda execution as failed
      throw error;
    }
  }

  console.log('All images processed successfully');
};
```

## File: lib/lambda/process-image/package.json

```json
{
  "name": "process-image-function",
  "version": "1.0.0",
  "description": "Lambda function for processing images and generating thumbnails",
  "main": "index.js",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.700.0",
    "sharp": "^0.33.5"
  },
  "devDependencies": {
    "@types/aws-lambda": "^8.10.145",
    "@types/node": "^22.10.1",
    "@types/sharp": "^0.32.0",
    "typescript": "^5.7.2"
  }
}
```

## File: lib/lambda/process-image/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

## File: test/tap-stack.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      environment: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('Creates source S3 bucket with correct properties', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'image-source-test',
    });
  });

  test('Creates thumbnail S3 bucket with correct properties', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'image-thumbnail-test',
    });
  });

  test('Creates Lambda function with correct configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: 'process-image-test',
      Runtime: 'nodejs20.x',
      Timeout: 30,
      MemorySize: 1024,
    });
  });

  test('Creates IAM role for Lambda with correct name', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: 'process-image-role-test',
      AssumedRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('Creates CloudWatch Log Group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/lambda/process-image-test',
      RetentionInDays: 7,
    });
  });

  test('Configures S3 event notifications for Lambda', () => {
    template.hasResourceProperties('Custom::S3BucketNotifications', {
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [
          {
            Events: ['s3:ObjectCreated:*'],
            Filter: {
              Key: {
                FilterRules: [
                  {
                    Name: 'suffix',
                    Value: '.jpg',
                  },
                ],
              },
            },
          },
          {
            Events: ['s3:ObjectCreated:*'],
            Filter: {
              Key: {
                FilterRules: [
                  {
                    Name: 'suffix',
                    Value: '.jpeg',
                  },
                ],
              },
            },
          },
          {
            Events: ['s3:ObjectCreated:*'],
            Filter: {
              Key: {
                FilterRules: [
                  {
                    Name: 'suffix',
                    Value: '.png',
                  },
                ],
              },
            },
          },
        ],
      },
    });
  });

  test('All S3 buckets have removal policy DESTROY', () => {
    const buckets = template.findResources('AWS::S3::Bucket');
    Object.values(buckets).forEach((bucket: any) => {
      expect(bucket.DeletionPolicy).toBe('Delete');
    });
  });

  test('Creates CloudFormation outputs', () => {
    template.hasOutput('SourceBucketName', {});
    template.hasOutput('ThumbnailBucketName', {});
    template.hasOutput('ProcessImageFunctionArn', {});
    template.hasOutput('LogGroupName', {});
  });

  test('Stack has correct tags', () => {
    const stackTags = cdk.Tags.of(stack);
    // Tags are applied at the stack level
    expect(stack.tags.tagValues()).toEqual(
      expect.objectContaining({
        Environment: 'test',
        Project: 'MediaProcessingPipeline',
        ManagedBy: 'CDK',
      })
    );
  });
});
```

## File: lib/README.md

```markdown
# Serverless Media Processing Pipeline

A serverless image processing pipeline that automatically generates thumbnails when images are uploaded to S3.

## Architecture

- **Source S3 Bucket**: Receives image uploads (JPEG, PNG formats)
- **Lambda Function**: Triggered by S3 events, processes images using Sharp library
- **Destination S3 Bucket**: Stores generated thumbnails
- **CloudWatch Logs**: Captures Lambda execution logs for monitoring

## Infrastructure Components

### S3 Buckets
- **Source Bucket**: `image-source-{environmentSuffix}`
  - Receives original image uploads
  - Triggers Lambda on `.jpg`, `.jpeg`, `.png` files
  - Auto-cleanup after 90 days

- **Thumbnail Bucket**: `image-thumbnail-{environmentSuffix}`
  - Stores generated thumbnails
  - Auto-cleanup after 90 days

### Lambda Function
- **Name**: `process-image-{environmentSuffix}`
- **Runtime**: Node.js 20.x
- **Memory**: 1024 MB
- **Timeout**: 30 seconds
- **Concurrency**: Limited to 10 concurrent executions

### IAM Role
- **Name**: `process-image-role-{environmentSuffix}`
- **Permissions**:
  - Read access to source S3 bucket
  - Write access to thumbnail S3 bucket
  - CloudWatch Logs write permissions

## Deployment

### Prerequisites
```bash
npm install
```

### Deploy to Development
```bash
npx cdk deploy --context environmentSuffix=dev --context environment=dev
```

### Deploy to Staging
```bash
npx cdk deploy --context environmentSuffix=staging --context environment=staging
```

### Deploy to Production
```bash
npx cdk deploy --context environmentSuffix=prod --context environment=prod
```

## Testing

Upload an image to the source bucket:
```bash
aws s3 cp test-image.jpg s3://image-source-{environmentSuffix}/test-image.jpg
```

Check thumbnail generation:
```bash
aws s3 ls s3://image-thumbnail-{environmentSuffix}/
```

View Lambda logs:
```bash
aws logs tail /aws/lambda/process-image-{environmentSuffix} --follow
```

## Image Processing Details

- **Thumbnail Size**: 200x200 pixels
- **Fit Mode**: Inside (maintains aspect ratio, no enlargement)
- **Output Format**: JPEG with 85% quality
- **Naming**: Thumbnails are prefixed with `thumb-`

## Error Handling

The Lambda function includes comprehensive error handling:
- Validates environment configuration
- Checks for empty files
- Handles Sharp processing errors
- Logs detailed error information to CloudWatch

## Cleanup

Destroy the stack:
```bash
npx cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` and will be completely removed.

## CI/CD Integration

This infrastructure supports automated deployment through GitHub Actions. See `lib/ci-cd.yml` for the complete pipeline configuration including:
- Automated dev deployments
- Manual approval gates for staging/prod
- Security scanning with cdk-nag
- Cross-account deployments
```
