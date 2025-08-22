/**
 * Main TapStack component - orchestrates all serverless infrastructure
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { S3Stack } from './s3-stack.mjs';
import { LambdaStack } from './lambda-stack.mjs';
import { ApiGatewayStack } from './api-gateway-stack.mjs';

export class TapStack extends pulumi.ComponentResource {
    constructor(name, args = {}, opts) {
        super('tap:stack:TapStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = {
            ...(args.tags || {}),
            Project: 'TapServerless',
            Environment: environmentSuffix,
            ManagedBy: 'Pulumi'
        };

        // Create S3 stack for object storage and events
        const s3Stack = new S3Stack('tap-s3', {
            environmentSuffix,
            tags
        }, { parent: this });

        // Create Lambda functions and IAM roles
        const lambdaStack = new LambdaStack('tap-lambda', {
            environmentSuffix,
            tags,
            sourceBucket: s3Stack.bucket
        }, { parent: this });

        // Create API Gateway for HTTP endpoints
        const apiStack = new ApiGatewayStack('tap-api', {
            environmentSuffix,
            tags,
            lambdaFunctions: lambdaStack.functions
        }, { parent: this });

        // Set up S3 event notifications to Lambda
        this.setupS3EventNotifications(s3Stack, lambdaStack);

        // Export important outputs
        this.bucketName = s3Stack.bucket.bucket;
        this.apiUrl = apiStack.apiUrl;
        this.lambdaArns = lambdaStack.functionArns;

        this.registerOutputs({
            bucketName: this.bucketName,
            apiUrl: this.apiUrl,
            lambdaArns: this.lambdaArns
        });
    }

    setupS3EventNotifications(s3Stack, lambdaStack) {
        // Wait for Lambda permissions to be established before creating notifications
        const dependsOnPermissions = Object.values(lambdaStack.s3Permissions || {});
        
        // Configure S3 bucket notifications for Lambda triggers
        const bucketNotification = new aws.s3.BucketNotification('tap-bucket-notification', {
            bucket: s3Stack.bucket.bucket,
            lambdaFunctions: [
                {
                    lambdaFunctionArn: lambdaStack.functions.imageProcessor.arn,
                    events: ['s3:ObjectCreated:*'],
                    filterPrefix: 'images/',
                },
                {
                    lambdaFunctionArn: lambdaStack.functions.dataValidator.arn,
                    events: ['s3:ObjectCreated:*'],
                    filterPrefix: 'data/',
                },
            ]
        }, { 
            parent: this,
            dependsOn: dependsOnPermissions.length > 0 ? dependsOnPermissions : undefined
        });

        return bucketNotification;
    }
}

