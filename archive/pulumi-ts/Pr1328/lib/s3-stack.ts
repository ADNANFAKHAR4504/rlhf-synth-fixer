import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketName: pulumi.Output<string>;
  public readonly lambdaCodeObject: aws.s3.BucketObject;

  constructor(name: string, args: S3StackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';

    // Create S3 bucket with versioning enabled
    // S3 bucket names must be lowercase and globally unique
    const stackName = pulumi.getStack().toLowerCase();
    this.bucket = new aws.s3.Bucket(
      `tap-app-bucket-${environmentSuffix}`,
      {
        bucket: `tap-app-bucket-${environmentSuffix}-primary-${stackName}`,
        tags: args.tags,
      },
      { parent: this }
    );

    // Configure versioning separately
    new aws.s3.BucketVersioning(
      `tap-bucket-versioning-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Configure bucket public access settings
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `tap-bucket-pab-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      { parent: this }
    );

    // Create bucket policy to allow public read access but restrict write access
    new aws.s3.BucketPolicy(
      `tap-bucket-policy-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        policy: pulumi.all([this.bucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'PublicReadGetObject',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:GetObject',
                Resource: `${bucketArn}/*`,
              },
              {
                Sid: 'PublicReadBucket',
                Effect: 'Allow',
                Principal: '*',
                Action: 's3:ListBucket',
                Resource: bucketArn,
              },
            ],
          })
        ),
      },
      { parent: this, dependsOn: [bucketPublicAccessBlock] }
    );

    // Upload Lambda function code to S3
    this.lambdaCodeObject = new aws.s3.BucketObject(
      `lambda-code-${environmentSuffix}`,
      {
        bucket: this.bucket.id,
        key: 'lambda-function.zip',
        source: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();
const eventbridge = new AWS.EventBridge();

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    try {
        // Retrieve database connection details from Parameter Store
        const dbConfig = await getDbConfig();
        console.log('Database configuration retrieved from Parameter Store');
        
        // Process S3 event if present
        let s3ProcessingResult = null;
        if (event.Records && event.Records[0] && event.Records[0].s3) {
            s3ProcessingResult = await processS3Event(event.Records[0].s3);
            
            // Publish event to EventBridge
            await publishProcessingEvent(s3ProcessingResult);
        }
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Lambda function executed successfully!',
                timestamp: new Date().toISOString(),
                dbConfigRetrieved: !!dbConfig,
                s3ProcessingResult: s3ProcessingResult,
                event: event
            }),
        };
    } catch (error) {
        console.error('Error in Lambda execution:', error);
        
        // Publish error event to EventBridge
        await publishProcessingEvent({ status: 'error', error: error.message });
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error in Lambda execution',
                error: error.message,
                timestamp: new Date().toISOString()
            }),
        };
    }
};

async function getDbConfig() {
    try {
        const params = [
            process.env.DB_ENDPOINT_PARAM,
            process.env.DB_USERNAME_PARAM,
            process.env.DB_PASSWORD_PARAM,
            process.env.DB_NAME_PARAM
        ];
        
        const parameterPromises = params.map(param => 
            ssm.getParameter({ Name: param, WithDecryption: true }).promise()
        );
        
        const results = await Promise.all(parameterPromises);
        
        return {
            endpoint: results[0].Parameter.Value,
            username: results[1].Parameter.Value,
            password: results[2].Parameter.Value,
            database: results[3].Parameter.Value
        };
    } catch (error) {
        console.error('Error retrieving database config:', error);
        throw error;
    }
}

async function processS3Event(s3Event) {
    const bucket = s3Event.bucket.name;
    const key = s3Event.object.key;
    
    console.log(\`Processing S3 object: s3://\${bucket}/\${key}\`);
    
    // Simulate processing
    return {
        status: 'success',
        bucket: bucket,
        key: key,
        processedAt: new Date().toISOString(),
        size: s3Event.object.size
    };
}

async function publishProcessingEvent(result) {
    try {
        const eventDetail = {
            status: result.status,
            bucket: result.bucket || 'unknown',
            key: result.key || 'unknown',
            processedAt: result.processedAt || new Date().toISOString(),
            ...(result.error && { error: result.error })
        };
        
        const params = {
            Entries: [{
                Source: process.env.EVENT_SOURCE,
                DetailType: 'S3 Object Processed',
                Detail: JSON.stringify(eventDetail),
                EventBusName: process.env.EVENT_BUS_NAME
            }]
        };
        
        const response = await eventbridge.putEvents(params).promise();
        console.log('Event published to EventBridge:', response);
        
        return response;
    } catch (error) {
        console.error('Error publishing to EventBridge:', error);
        throw error;
    }
}
        `),
        }),
        tags: args.tags,
      },
      { parent: this }
    );

    this.bucketName = this.bucket.bucket;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucket.arn,
    });
  }
}
