/**
 * LambdaStack - manages Lambda functions and associated resources
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class LambdaStack extends pulumi.ComponentResource {
    constructor(name, args = {}, opts) {
        super('tap:lambda:LambdaStack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        const sourceBucket = args.sourceBucket;

        // Create IAM role for Lambda execution
        this.lambdaRole = this.createLambdaExecutionRole(environmentSuffix, tags);

        // Create dead letter queue for fault tolerance
        this.deadLetterQueue = new aws.sqs.Queue(`tap-dlq-${environmentSuffix}`, {
            messageRetentionSeconds: 1209600, // 14 days
            tags: {
                ...tags,
                Purpose: 'DeadLetterQueue'
            }
        }, { parent: this });

        // Create Lambda functions
        this.functions = this.createLambdaFunctions(environmentSuffix, tags, sourceBucket);

        // Set up Lambda permissions for S3
        this.s3Permissions = this.setupS3LambdaPermissions(environmentSuffix, sourceBucket);

        this.functionArns = {
            imageProcessor: this.functions.imageProcessor.arn,
            dataValidator: this.functions.dataValidator.arn,
            notificationHandler: this.functions.notificationHandler.arn
        };

        this.registerOutputs({
            functions: this.functions,
            functionArns: this.functionArns,
            lambdaRole: this.lambdaRole.arn,
            s3Permissions: this.s3Permissions
        });
    }

    createLambdaExecutionRole(environmentSuffix, tags) {
        const role = new aws.iam.Role(`tap-lambda-role-${environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [{
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'lambda.amazonaws.com'
                    }
                }]
            }),
            tags: {
                ...tags,
                Purpose: 'LambdaExecution'
            }
        }, { parent: this });

        // Attach basic Lambda execution policy
        const basicPolicy = new aws.iam.RolePolicyAttachment(`tap-lambda-basic-${environmentSuffix}`, {
            role: role.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        }, { parent: this });

        // Custom policy for S3 and SQS access
        const customPolicy = new aws.iam.RolePolicy(`tap-lambda-policy-${environmentSuffix}`, {
            role: role.id,
            policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: [
                            's3:GetObject',
                            's3:PutObject',
                            's3:DeleteObject'
                        ],
                        Resource: 'arn:aws:s3:::*/*'
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'sqs:SendMessage',
                            'sqs:ReceiveMessage',
                            'sqs:DeleteMessage'
                        ],
                        Resource: '*'
                    },
                    {
                        Effect: 'Allow',
                        Action: [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        Resource: 'arn:aws:logs:*:*:*'
                    }
                ]
            })
        }, { parent: this });

        return role;
    }

    createLambdaFunctions(environmentSuffix, tags, sourceBucket) {
        const lambdaConfig = {
            runtime: 'nodejs20.x',
            timeout: 300,
            memorySize: 512,
            role: this.lambdaRole.arn,
            deadLetterConfig: {
                targetArn: this.deadLetterQueue.arn
            },
            environment: {
                variables: {
                    ENVIRONMENT: environmentSuffix,
                    SOURCE_BUCKET: sourceBucket ? sourceBucket.bucket : '',
                    DLQ_URL: this.deadLetterQueue.url
                }
            },
            tags: {
                ...tags,
                Purpose: 'ServerlessProcessing'
            }
        };

        // Image processing Lambda
        const imageProcessor = new aws.lambda.Function(`tap-image-processor-${environmentSuffix}`, {
            ...lambdaConfig,
            name: `tap-image-processor-${environmentSuffix}`,
            handler: 'image-processor.handler',
            code: new pulumi.asset.AssetArchive({
                'image-processor.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Processing S3 event:', JSON.stringify(event, null, 2));
    
    for (const record of event.Records) {
        if (record.eventSource === 'aws:s3') {
            const bucket = record.s3.bucket.name;
            const key = record.s3.object.key;
            
            console.log(\`Processing image: \${key} from bucket: \${bucket}\`);
            
            // Simulate image processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Image processed successfully',
                    bucket: bucket,
                    key: key,
                    timestamp: new Date().toISOString()
                })
            };
        }
    }
    
    return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No S3 records found' })
    };
};
                `)
            }),
            environment: {
                variables: {
                    ...lambdaConfig.environment.variables,
                    FUNCTION_TYPE: 'image-processor'
                }
            }
        }, { parent: this });

        // Data validation Lambda
        const dataValidator = new aws.lambda.Function(`tap-data-validator-${environmentSuffix}`, {
            ...lambdaConfig,
            name: `tap-data-validator-${environmentSuffix}`,
            handler: 'data-validator.handler',
            code: new pulumi.asset.AssetArchive({
                'data-validator.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Validating data from S3 event:', JSON.stringify(event, null, 2));
    
    for (const record of event.Records) {
        if (record.eventSource === 'aws:s3') {
            const bucket = record.s3.bucket.name;
            const key = record.s3.object.key;
            
            console.log(\`Validating data: \${key} from bucket: \${bucket}\`);
            
            // Simulate data validation
            const isValid = Math.random() > 0.1; // 90% success rate
            
            if (!isValid) {
                throw new Error('Data validation failed');
            }
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Data validation successful',
                    bucket: bucket,
                    key: key,
                    isValid: isValid,
                    timestamp: new Date().toISOString()
                })
            };
        }
    }
    
    return {
        statusCode: 400,
        body: JSON.stringify({ message: 'No S3 records found' })
    };
};
                `)
            }),
            environment: {
                variables: {
                    ...lambdaConfig.environment.variables,
                    FUNCTION_TYPE: 'data-validator'
                }
            }
        }, { parent: this });

        // Notification handler Lambda (for API Gateway)
        const notificationHandler = new aws.lambda.Function(`tap-notification-handler-${environmentSuffix}`, {
            ...lambdaConfig,
            name: `tap-notification-handler-${environmentSuffix}`,
            handler: 'notification-handler.handler',
            code: new pulumi.asset.AssetArchive({
                'notification-handler.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Handling notification request:', JSON.stringify(event, null, 2));
    
    const method = event.httpMethod || event.requestContext?.http?.method;
    const path = event.path || event.requestContext?.http?.path;
    
    if (method === 'GET' && path === '/notifications') {
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Notifications endpoint active',
                timestamp: new Date().toISOString(),
                environment: process.env.ENVIRONMENT
            })
        };
    }
    
    if (method === 'POST' && path === '/notifications') {
        const body = event.body ? JSON.parse(event.body) : {};
        
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Notification created successfully',
                data: body,
                timestamp: new Date().toISOString()
            })
        };
    }
    
    return {
        statusCode: 404,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ message: 'Endpoint not found' })
    };
};
                `)
            }),
            environment: {
                variables: {
                    ...lambdaConfig.environment.variables,
                    FUNCTION_TYPE: 'notification-handler'
                }
            }
        }, { parent: this });

        return {
            imageProcessor,
            dataValidator,
            notificationHandler
        };
    }

    setupS3LambdaPermissions(environmentSuffix, sourceBucket) {
        if (!sourceBucket) {
            return {};
        }
        
        // Allow S3 to invoke the image processor Lambda
        const imageProcessorPermission = new aws.lambda.Permission(`tap-image-processor-s3-permission-${environmentSuffix}`, {
            statementId: 'AllowExecutionFromS3Bucket',
            action: 'lambda:InvokeFunction',
            function: this.functions.imageProcessor.name,
            principal: 's3.amazonaws.com',
            sourceArn: sourceBucket.arn
        }, { parent: this });

        // Allow S3 to invoke the data validator Lambda
        const dataValidatorPermission = new aws.lambda.Permission(`tap-data-validator-s3-permission-${environmentSuffix}`, {
            statementId: 'AllowExecutionFromS3Bucket',
            action: 'lambda:InvokeFunction',
            function: this.functions.dataValidator.name,
            principal: 's3.amazonaws.com',
            sourceArn: sourceBucket.arn
        }, { parent: this });

        return { imageProcessorPermission, dataValidatorPermission };
    }
}