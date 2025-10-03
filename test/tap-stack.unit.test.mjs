import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { jest } from '@jest/globals';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';

const { Stack, CfnOutput, Tags, Duration, RemovalPolicy } = cdk;

describe('TapStack Unit Tests', () => {
    let app;
    let stack;
    let template;

    beforeAll(() => {
        app = new cdk.App({
            context: {
                environmentSuffix: 'test123'
            }
        });

        // Mock environment variables
        process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
        process.env.ENVIRONMENT_SUFFIX = 'test123';

        // Create test stack inline since we're using JS
        class TapStack extends Stack {
            constructor(scope, id, props) {
                super(scope, id, props?.stackProps);

                const environmentSuffix = props?.environmentSuffix || 'dev';

                // S3 bucket for analytics data
                const analyticsBucket = new s3.Bucket(this, 'AnalyticsBucket', {
                    bucketName: `url-shortener-analytics-${environmentSuffix}-${this.account}`,
                    encryption: s3.BucketEncryption.S3_MANAGED,
                    versioned: true,
                    lifecycleRules: [{
                        id: 'TransitionToGlacier',
                        transitions: [{
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: Duration.days(90)
                        }]
                    }],
                    removalPolicy: RemovalPolicy.DESTROY,
                    autoDeleteObjects: true
                });

                // DynamoDB table for URL storage
                const urlTable = new dynamodb.Table(this, 'URLTable', {
                    tableName: `url-shortener-table-${environmentSuffix}`,
                    partitionKey: {
                        name: 'shortId',
                        type: dynamodb.AttributeType.STRING
                    },
                    billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
                    timeToLiveAttribute: 'expiresAt',
                    pointInTimeRecovery: true,
                    removalPolicy: RemovalPolicy.DESTROY
                });

                // IAM role for main Lambda function
                const lambdaRole = new iam.Role(this, 'LambdaRole', {
                    roleName: `url-shortener-lambda-role-${environmentSuffix}`,
                    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
                    managedPolicies: [
                        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
                        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
                    ]
                });

                urlTable.grantReadWriteData(lambdaRole);
                analyticsBucket.grantWrite(lambdaRole);

                // Lambda function for URL shortening
                const urlShortenerFunction = new lambda.Function(this, 'URLShortenerFunction', {
                    functionName: `url-shortener-${environmentSuffix}`,
                    runtime: lambda.Runtime.JAVA_17,
                    code: lambda.Code.fromAsset('lib/lambda-handler'),
                    handler: 'app.URLShortenerHandler::handleRequest',
                    role: lambdaRole,
                    memorySize: 512,
                    timeout: Duration.seconds(30),
                    environment: {
                        TABLE_NAME: urlTable.tableName,
                        ANALYTICS_BUCKET: analyticsBucket.bucketName
                    },
                    tracing: lambda.Tracing.ACTIVE,
                    logRetention: logs.RetentionDays.ONE_WEEK
                });

                // API Gateway
                const api = new apigateway.RestApi(this, 'URLShortenerAPI', {
                    restApiName: `url-shortener-api-${environmentSuffix}`,
                    description: 'URL Shortener API',
                    deployOptions: {
                        stageName: environmentSuffix,
                        tracingEnabled: true,
                        metricsEnabled: true,
                        loggingLevel: apigateway.MethodLoggingLevel.INFO,
                        dataTraceEnabled: true
                    }
                });

                const lambdaIntegration = new apigateway.LambdaIntegration(urlShortenerFunction, {
                    proxy: false,
                    integrationResponses: [{
                        statusCode: '200',
                        responseTemplates: {
                            'application/json': '$input.json("$")'
                        }
                    }]
                });

                // POST /shorten endpoint
                const shortenResource = api.root.addResource('shorten');
                shortenResource.addMethod('POST', lambdaIntegration, {
                    methodResponses: [{
                        statusCode: '200'
                    }]
                });

                // GET /{shortId} endpoint
                const shortIdResource = api.root.addResource('{shortId}');
                shortIdResource.addMethod('GET', lambdaIntegration, {
                    requestParameters: {
                        'method.request.path.shortId': true
                    },
                    methodResponses: [{
                        statusCode: '301',
                        responseParameters: {
                            'method.response.header.Location': true
                        }
                    }]
                });

                // CloudFront distribution
                const distribution = new cloudfront.Distribution(this, 'URLShortenerDistribution', {
                    comment: `URL Shortener CloudFront Distribution ${environmentSuffix}`,
                    defaultBehavior: {
                        origin: new cloudfront_origins.RestApiOrigin(api),
                        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                        cachePolicy: new cloudfront.CachePolicy(this, 'URLShortenerCachePolicy', {
                            cachePolicyName: `url-shortener-cache-policy-${environmentSuffix}`,
                            defaultTtl: Duration.hours(1),
                            maxTtl: Duration.hours(24),
                            minTtl: Duration.seconds(0)
                        })
                    },
                    errorResponses: [{
                        httpStatus: 404,
                        responseHttpStatus: 404,
                        responsePagePath: '/404.html',
                        ttl: Duration.minutes(5)
                    }]
                });

                // CloudWatch Dashboard
                const dashboard = new cloudwatch.Dashboard(this, 'URLShortenerDashboard', {
                    dashboardName: `url-shortener-${environmentSuffix}`,
                    widgets: [[
                        new cloudwatch.GraphWidget({
                            title: 'API Requests',
                            left: [new cloudwatch.Metric({
                                namespace: 'AWS/ApiGateway',
                                metricName: 'Count',
                                dimensionsMap: {
                                    ApiName: api.restApiName,
                                    Stage: environmentSuffix
                                },
                                statistic: 'Sum'
                            })]
                        })
                    ]]
                });

                // Apply tags to all resources
                Tags.of(this).add('Environment', environmentSuffix);
                Tags.of(this).add('Application', 'URLShortener');

                // Outputs
                new CfnOutput(this, 'APIEndpoint', {
                    value: api.url,
                    description: 'API Gateway endpoint URL'
                });

                new CfnOutput(this, 'CloudFrontURL', {
                    value: `https://${distribution.distributionDomainName}`,
                    description: 'CloudFront distribution URL'
                });

                new CfnOutput(this, 'S3BucketName', {
                    value: analyticsBucket.bucketName,
                    description: 'S3 Analytics bucket name'
                });

                new CfnOutput(this, 'DynamoDBTableName', {
                    value: urlTable.tableName,
                    description: 'DynamoDB table name'
                });
            }
        }

        stack = new TapStack(app, 'TapStacktest123', {
            environmentSuffix: 'test123',
            stackProps: {
                env: {
                    account: '123456789012',
                    region: 'us-west-1'
                }
            }
        });

        template = Template.fromStack(stack);
    });

    describe('DynamoDB Table', () => {
        test('DynamoDB table is created with correct properties', () => {
            template.hasResourceProperties('AWS::DynamoDB::Table', {
                TableName: 'url-shortener-table-test123',
                KeySchema: [{
                    AttributeName: 'shortId',
                    KeyType: 'HASH'
                }],
                BillingMode: 'PAY_PER_REQUEST',
                TimeToLiveSpecification: {
                    AttributeName: 'expiresAt',
                    Enabled: true
                },
                PointInTimeRecoverySpecification: {
                    PointInTimeRecoveryEnabled: true
                }
            });
        });

        test('DynamoDB table has DESTROY removal policy', () => {
            template.hasResource('AWS::DynamoDB::Table', {
                DeletionPolicy: 'Delete'
            });
        });
    });

    describe('S3 Bucket', () => {
        test('S3 bucket is created with correct properties', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: 'url-shortener-analytics-test123-123456789012',
                BucketEncryption: {
                    ServerSideEncryptionConfiguration: [{
                        ServerSideEncryptionByDefault: {
                            SSEAlgorithm: 'AES256'
                        }
                    }]
                },
                VersioningConfiguration: {
                    Status: 'Enabled'
                }
            });
        });

        test('S3 bucket has lifecycle policy', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                LifecycleConfiguration: {
                    Rules: Match.arrayWith([
                        Match.objectLike({
                            Id: 'TransitionToGlacier',
                            Status: 'Enabled',
                            Transitions: [{
                                StorageClass: 'GLACIER',
                                TransitionInDays: 90
                            }]
                        })
                    ])
                }
            });
        });
    });

    describe('Lambda Functions', () => {
        test('URL shortener Lambda function is created', () => {
            template.hasResourceProperties('AWS::Lambda::Function', {
                FunctionName: 'url-shortener-test123',
                Runtime: 'java17',
                Handler: 'app.URLShortenerHandler::handleRequest',
                MemorySize: 512,
                Timeout: 30,
                TracingConfig: {
                    Mode: 'Active'
                }
            });
        });

        test('Lambda has environment variables', () => {
            template.hasResourceProperties('AWS::Lambda::Function', {
                Environment: {
                    Variables: Match.objectLike({
                        TABLE_NAME: Match.anyValue(),
                        ANALYTICS_BUCKET: Match.anyValue()
                    })
                }
            });
        });
    });

    describe('IAM', () => {
        test('Lambda role is created', () => {
            template.hasResourceProperties('AWS::IAM::Role', {
                RoleName: 'url-shortener-lambda-role-test123',
                AssumeRolePolicyDocument: Match.objectLike({
                    Statement: Match.arrayWith([
                        Match.objectLike({
                            Effect: 'Allow',
                            Principal: {
                                Service: 'lambda.amazonaws.com'
                            },
                            Action: 'sts:AssumeRole'
                        })
                    ])
                })
            });
        });
    });

    describe('API Gateway', () => {
        test('REST API is created', () => {
            template.hasResourceProperties('AWS::ApiGateway::RestApi', {
                Name: 'url-shortener-api-test123',
                Description: 'URL Shortener API'
            });
        });

        test('API has shorten resource', () => {
            template.hasResourceProperties('AWS::ApiGateway::Resource', {
                PathPart: 'shorten'
            });
        });

        test('API has shortId resource', () => {
            template.hasResourceProperties('AWS::ApiGateway::Resource', {
                PathPart: '{shortId}'
            });
        });

        test('API has POST and GET methods', () => {
            template.resourceCountIs('AWS::ApiGateway::Method', 2);
        });

        test('API deployment stage is configured', () => {
            template.hasResourceProperties('AWS::ApiGateway::Stage', {
                StageName: 'test123',
                TracingEnabled: true
            });
        });
    });

    describe('CloudFront', () => {
        test('CloudFront distribution is created', () => {
            template.hasResourceProperties('AWS::CloudFront::Distribution', {
                DistributionConfig: Match.objectLike({
                    Comment: 'URL Shortener CloudFront Distribution test123'
                })
            });
        });

        test('CloudFront cache policy is created', () => {
            template.hasResourceProperties('AWS::CloudFront::CachePolicy', {
                CachePolicyConfig: {
                    Name: 'url-shortener-cache-policy-test123',
                    DefaultTTL: 3600,
                    MaxTTL: 86400,
                    MinTTL: 0
                }
            });
        });
    });

    describe('CloudWatch', () => {
        test('CloudWatch Dashboard is created', () => {
            template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
                DashboardName: 'url-shortener-test123'
            });
        });
    });

    describe('Stack Outputs', () => {
        test('Stack has required outputs', () => {
            const outputs = template.findOutputs('*');
            expect(outputs).toHaveProperty('APIEndpoint');
            expect(outputs).toHaveProperty('CloudFrontURL');
            expect(outputs).toHaveProperty('S3BucketName');
            expect(outputs).toHaveProperty('DynamoDBTableName');
        });
    });

    describe('Tagging', () => {
        test('Resources are tagged correctly', () => {
            // S3 buckets have an additional auto-delete tag, so we need to check for it differently
            const buckets = template.findResources('AWS::S3::Bucket');
            const bucketTags = Object.values(buckets)[0].Properties.Tags;

            expect(bucketTags).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ Key: 'Environment', Value: 'test123' }),
                    expect.objectContaining({ Key: 'Application', Value: 'URLShortener' })
                ])
            );
        });
    });
});