"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const apigateway = __importStar(require("aws-cdk-lib/aws-apigateway"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
class ApiStack extends cdk.NestedStack {
    restApi;
    apiKey;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environmentSuffix, imageProcessorFunction } = props;
        // CloudWatch Log Group for API Gateway
        const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
            logGroupName: `/aws/apigateway/serverlessapp-image-detector-api-${environmentSuffix}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
        // Create API Gateway with security and monitoring configurations
        this.restApi = new apigateway.RestApi(this, 'ImageDetectorApi', {
            restApiName: `serverlessapp-image-detector-api-${environmentSuffix}`,
            description: 'Production-ready API for serverless image detection system',
            deployOptions: {
                stageName: environmentSuffix,
                loggingLevel: apigateway.MethodLoggingLevel.INFO,
                dataTraceEnabled: environmentSuffix !== 'prod',
                metricsEnabled: true,
                accessLogDestination: new apigateway.LogGroupLogDestination(apiLogGroup),
                accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
                    caller: true,
                    httpMethod: true,
                    ip: true,
                    protocol: true,
                    requestTime: true,
                    resourcePath: true,
                    responseLength: true,
                    status: true,
                    user: true,
                }),
            },
            defaultCorsPreflightOptions: {
                allowOrigins: environmentSuffix === 'prod'
                    ? ['https://yourdomain.com'] // Replace with actual domain
                    : apigateway.Cors.ALL_ORIGINS,
                allowMethods: ['GET', 'POST', 'OPTIONS'],
                allowHeaders: [
                    'Content-Type',
                    'X-Amz-Date',
                    'Authorization',
                    'X-Api-Key',
                    'X-Amz-Security-Token',
                ],
                maxAge: cdk.Duration.hours(1),
            },
            binaryMediaTypes: ['image/*', 'multipart/form-data'],
        });
        // API Key with rotation capability
        this.apiKey = new apigateway.ApiKey(this, 'ApiKey', {
            apiKeyName: `serverlessapp-api-key-${environmentSuffix}`,
            description: 'API key for image detector service',
            value: environmentSuffix === 'prod'
                ? undefined // Let AWS generate in production
                : 'dev-key-12345-do-not-use-in-prod',
        });
        // Usage Plan with appropriate limits
        const usagePlan = this.restApi.addUsagePlan('UsagePlan', {
            name: `serverlessapp-usage-plan-${environmentSuffix}`,
            description: 'Usage plan for image detector API',
            throttle: {
                rateLimit: environmentSuffix === 'prod' ? 1000 : 100,
                burstLimit: environmentSuffix === 'prod' ? 2000 : 200,
            },
            quota: {
                limit: environmentSuffix === 'prod' ? 100000 : 10000,
                period: apigateway.Period.MONTH,
            },
        });
        usagePlan.addApiKey(this.apiKey);
        usagePlan.addApiStage({
            stage: this.restApi.deploymentStage,
        });
        // Lambda integration with error handling
        const lambdaIntegration = new apigateway.LambdaIntegration(imageProcessorFunction, {
            requestTemplates: {
                'application/json': JSON.stringify({
                    body: '$input.json("$")',
                    headers: {
                        '#foreach($header in $input.params().header.keySet())': '"$header": "$util.escapeJavaScript($input.params().header.get($header))"#if($foreach.hasNext),#end#end',
                    },
                    pathParameters: {
                        '#foreach($param in $input.params().path.keySet())': '"$param": "$util.escapeJavaScript($input.params().path.get($param))"#if($foreach.hasNext),#end#end',
                    },
                    queryStringParameters: {
                        '#foreach($queryParam in $input.params().querystring.keySet())': '"$queryParam": "$util.escapeJavaScript($input.params().querystring.get($queryParam))"#if($foreach.hasNext),#end#end',
                    },
                }),
            },
            integrationResponses: [
                {
                    statusCode: '200',
                    responseTemplates: {
                        'application/json': '$input.json("$")',
                    },
                },
                {
                    statusCode: '400',
                    selectionPattern: '4\\d{2}',
                    responseTemplates: {
                        'application/json': JSON.stringify({
                            error: 'Bad Request',
                            message: '$input.path("$.errorMessage")',
                        }),
                    },
                },
                {
                    statusCode: '500',
                    selectionPattern: '5\\d{2}',
                    responseTemplates: {
                        'application/json': JSON.stringify({
                            error: 'Internal Server Error',
                            message: '$input.path("$.errorMessage")',
                        }),
                    },
                },
            ],
        });
        // Request validator for input validation
        const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
            restApi: this.restApi,
            requestValidatorName: 'request-validator',
            validateRequestBody: true,
            validateRequestParameters: true,
        });
        // Request models for validation
        const imageUploadModel = new apigateway.Model(this, 'ImageUploadModel', {
            restApi: this.restApi,
            modelName: 'ImageUploadModel',
            contentType: 'application/json',
            schema: {
                type: apigateway.JsonSchemaType.OBJECT,
                properties: {
                    imageData: {
                        type: apigateway.JsonSchemaType.STRING,
                        description: 'Base64 encoded image data',
                        minLength: 100,
                        maxLength: 10485760, // 10MB limit
                    },
                    fileName: {
                        type: apigateway.JsonSchemaType.STRING,
                        description: 'Original filename',
                        minLength: 1,
                        maxLength: 255,
                        pattern: '^[a-zA-Z0-9._-]+\\.(jpg|jpeg|png|gif|bmp)$',
                    },
                    contentType: {
                        type: apigateway.JsonSchemaType.STRING,
                        description: 'Image MIME type',
                        enum: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
                    },
                },
                required: ['imageData', 'fileName', 'contentType'],
                additionalProperties: false,
            },
        });
        // API Resources and Methods
        const imagesResource = this.restApi.root.addResource('images', {
            defaultCorsPreflightOptions: {
                allowOrigins: environmentSuffix === 'prod'
                    ? ['https://yourdomain.com']
                    : apigateway.Cors.ALL_ORIGINS,
                allowMethods: ['GET', 'POST', 'OPTIONS'],
            },
        });
        // POST /images - Upload image for processing
        imagesResource.addMethod('POST', lambdaIntegration, {
            apiKeyRequired: true,
            requestValidator,
            requestModels: {
                'application/json': imageUploadModel,
            },
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        'application/json': apigateway.Model.EMPTY_MODEL,
                    },
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Origin': true,
                    },
                },
                {
                    statusCode: '400',
                    responseModels: {
                        'application/json': apigateway.Model.ERROR_MODEL,
                    },
                },
                {
                    statusCode: '429', // Rate limit exceeded
                    responseModels: {
                        'application/json': apigateway.Model.ERROR_MODEL,
                    },
                },
                {
                    statusCode: '500',
                    responseModels: {
                        'application/json': apigateway.Model.ERROR_MODEL,
                    },
                },
            ],
        });
        // GET /images - List processed images with pagination
        imagesResource.addMethod('GET', lambdaIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.querystring.status': false,
                'method.request.querystring.limit': false,
                'method.request.querystring.nextToken': false,
                'method.request.querystring.animal': false,
            },
            requestValidator: new apigateway.RequestValidator(this, 'GetImagesValidator', {
                restApi: this.restApi,
                requestValidatorName: 'get-images-validator',
                validateRequestParameters: true,
            }),
        });
        // GET /images/{id} - Get specific image details
        const imageResource = imagesResource.addResource('{id}');
        imageResource.addMethod('GET', lambdaIntegration, {
            apiKeyRequired: true,
            requestParameters: {
                'method.request.path.id': true,
            },
            requestValidator: new apigateway.RequestValidator(this, 'GetImageValidator', {
                restApi: this.restApi,
                requestValidatorName: 'get-image-validator',
                validateRequestParameters: true,
            }),
        });
        // Health check endpoint (no API key required)
        const healthResource = this.restApi.root.addResource('health');
        healthResource.addMethod('GET', new apigateway.MockIntegration({
            integrationResponses: [
                {
                    statusCode: '200',
                    responseTemplates: {
                        'application/json': JSON.stringify({
                            status: 'healthy',
                            timestamp: '$context.requestTime',
                            service: 'serverless-image-detector',
                        }),
                    },
                },
            ],
            requestTemplates: {
                'application/json': JSON.stringify({ statusCode: 200 }),
            },
        }), {
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        'application/json': apigateway.Model.EMPTY_MODEL,
                    },
                },
            ],
        });
        // Add resource tags
        cdk.Tags.of(this).add('Component', 'API');
        cdk.Tags.of(this).add('Environment', environmentSuffix);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
    }
}
exports.ApiStack = ApiStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBpLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1RUFBeUQ7QUFFekQsMkRBQTZDO0FBVTdDLE1BQWEsUUFBUyxTQUFRLEdBQUcsQ0FBQyxXQUFXO0lBQzNCLE9BQU8sQ0FBcUI7SUFDNUIsTUFBTSxDQUFvQjtJQUUxQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQW9CO1FBQzVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxzQkFBc0IsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUU1RCx1Q0FBdUM7UUFDdkMsTUFBTSxXQUFXLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUNoRSxZQUFZLEVBQUUsb0RBQW9ELGlCQUFpQixFQUFFO1lBQ3JGLFNBQVMsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVE7WUFDdEMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsT0FBTztTQUN6QyxDQUFDLENBQUM7UUFFSCxpRUFBaUU7UUFDakUsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO1lBQzlELFdBQVcsRUFBRSxvQ0FBb0MsaUJBQWlCLEVBQUU7WUFDcEUsV0FBVyxFQUFFLDREQUE0RDtZQUN6RSxhQUFhLEVBQUU7Z0JBQ2IsU0FBUyxFQUFFLGlCQUFpQjtnQkFDNUIsWUFBWSxFQUFFLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJO2dCQUNoRCxnQkFBZ0IsRUFBRSxpQkFBaUIsS0FBSyxNQUFNO2dCQUM5QyxjQUFjLEVBQUUsSUFBSTtnQkFDcEIsb0JBQW9C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QUcsRUFBRSxDQUFDO2FBQ3hEO1NBQ0YsQ0FBQyxFQUNGO1lBQ0UsZUFBZSxFQUFFO2dCQUNmO29CQUNFLFVBQVUsRUFBRSxLQUFLO29CQUNqQixjQUFjLEVBQUU7d0JBQ2Qsa0JBQWtCLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxXQUFXO3FCQUNqRDtpQkFDRjthQUNGO1NBQ0YsQ0FDRixDQUFDO1FBRUYsb0JBQW9CO1FBQ3BCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGO0FBcFRELDRCQW9UQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBhcGlnYXRld2F5IGZyb20gJ2F3cy1jZGstbGliL2F3cy1hcGlnYXRld2F5JztcbmltcG9ydCAqIGFzIGxhbWJkYSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbGFtYmRhJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFwaVN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuTmVzdGVkU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG4gIGltYWdlUHJvY2Vzc29yRnVuY3Rpb246IGxhbWJkYS5GdW5jdGlvbjtcbiAgaW1hZ2VCdWNrZXQ6IHMzLkJ1Y2tldDtcbn1cblxuZXhwb3J0IGNsYXNzIEFwaVN0YWNrIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHJlc3RBcGk6IGFwaWdhdGV3YXkuUmVzdEFwaTtcbiAgcHVibGljIHJlYWRvbmx5IGFwaUtleTogYXBpZ2F0ZXdheS5BcGlLZXk7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IEFwaVN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnRTdWZmaXgsIGltYWdlUHJvY2Vzc29yRnVuY3Rpb24gfSA9IHByb3BzO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2cgR3JvdXAgZm9yIEFQSSBHYXRld2F5XG4gICAgY29uc3QgYXBpTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnQXBpR2F0ZXdheUxvZ0dyb3VwJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9hcGlnYXRld2F5L3NlcnZlcmxlc3NhcHAtaW1hZ2UtZGV0ZWN0b3ItYXBpLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBBUEkgR2F0ZXdheSB3aXRoIHNlY3VyaXR5IGFuZCBtb25pdG9yaW5nIGNvbmZpZ3VyYXRpb25zXG4gICAgdGhpcy5yZXN0QXBpID0gbmV3IGFwaWdhdGV3YXkuUmVzdEFwaSh0aGlzLCAnSW1hZ2VEZXRlY3RvckFwaScsIHtcbiAgICAgIHJlc3RBcGlOYW1lOiBgc2VydmVybGVzc2FwcC1pbWFnZS1kZXRlY3Rvci1hcGktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdQcm9kdWN0aW9uLXJlYWR5IEFQSSBmb3Igc2VydmVybGVzcyBpbWFnZSBkZXRlY3Rpb24gc3lzdGVtJyxcbiAgICAgIGRlcGxveU9wdGlvbnM6IHtcbiAgICAgICAgc3RhZ2VOYW1lOiBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgICAgbG9nZ2luZ0xldmVsOiBhcGlnYXRld2F5Lk1ldGhvZExvZ2dpbmdMZXZlbC5JTkZPLFxuICAgICAgICBkYXRhVHJhY2VFbmFibGVkOiBlbnZpcm9ubWVudFN1ZmZpeCAhPT0gJ3Byb2QnLFxuICAgICAgICBtZXRyaWNzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgYWNjZXNzTG9nRGVzdGluYXRpb246IG5ldyBhcGlnYXRld2F5LkxvZ0dyb3VwTG9nRGVzdGluYXRpb24oXG4gICAgICAgICAgYXBpTG9nR3JvdXBcbiAgICAgICAgKSxcbiAgICAgICAgYWNjZXNzTG9nRm9ybWF0OiBhcGlnYXRld2F5LkFjY2Vzc0xvZ0Zvcm1hdC5qc29uV2l0aFN0YW5kYXJkRmllbGRzKHtcbiAgICAgICAgICBjYWxsZXI6IHRydWUsXG4gICAgICAgICAgaHR0cE1ldGhvZDogdHJ1ZSxcbiAgICAgICAgICBpcDogdHJ1ZSxcbiAgICAgICAgICBwcm90b2NvbDogdHJ1ZSxcbiAgICAgICAgICByZXF1ZXN0VGltZTogdHJ1ZSxcbiAgICAgICAgICByZXNvdXJjZVBhdGg6IHRydWUsXG4gICAgICAgICAgcmVzcG9uc2VMZW5ndGg6IHRydWUsXG4gICAgICAgICAgc3RhdHVzOiB0cnVlLFxuICAgICAgICAgIHVzZXI6IHRydWUsXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICAgIGRlZmF1bHRDb3JzUHJlZmxpZ2h0T3B0aW9uczoge1xuICAgICAgICBhbGxvd09yaWdpbnM6XG4gICAgICAgICAgZW52aXJvbm1lbnRTdWZmaXggPT09ICdwcm9kJ1xuICAgICAgICAgICAgPyBbJ2h0dHBzOi8veW91cmRvbWFpbi5jb20nXSAvLyBSZXBsYWNlIHdpdGggYWN0dWFsIGRvbWFpblxuICAgICAgICAgICAgOiBhcGlnYXRld2F5LkNvcnMuQUxMX09SSUdJTlMsXG4gICAgICAgIGFsbG93TWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdPUFRJT05TJ10sXG4gICAgICAgIGFsbG93SGVhZGVyczogW1xuICAgICAgICAgICdDb250ZW50LVR5cGUnLFxuICAgICAgICAgICdYLUFtei1EYXRlJyxcbiAgICAgICAgICAnQXV0aG9yaXphdGlvbicsXG4gICAgICAgICAgJ1gtQXBpLUtleScsXG4gICAgICAgICAgJ1gtQW16LVNlY3VyaXR5LVRva2VuJyxcbiAgICAgICAgXSxcbiAgICAgICAgbWF4QWdlOiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICB9LFxuICAgICAgYmluYXJ5TWVkaWFUeXBlczogWydpbWFnZS8qJywgJ211bHRpcGFydC9mb3JtLWRhdGEnXSxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBLZXkgd2l0aCByb3RhdGlvbiBjYXBhYmlsaXR5XG4gICAgdGhpcy5hcGlLZXkgPSBuZXcgYXBpZ2F0ZXdheS5BcGlLZXkodGhpcywgJ0FwaUtleScsIHtcbiAgICAgIGFwaUtleU5hbWU6IGBzZXJ2ZXJsZXNzYXBwLWFwaS1rZXktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdBUEkga2V5IGZvciBpbWFnZSBkZXRlY3RvciBzZXJ2aWNlJyxcbiAgICAgIHZhbHVlOlxuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnXG4gICAgICAgICAgPyB1bmRlZmluZWQgLy8gTGV0IEFXUyBnZW5lcmF0ZSBpbiBwcm9kdWN0aW9uXG4gICAgICAgICAgOiAnZGV2LWtleS0xMjM0NS1kby1ub3QtdXNlLWluLXByb2QnLFxuICAgIH0pO1xuXG4gICAgLy8gVXNhZ2UgUGxhbiB3aXRoIGFwcHJvcHJpYXRlIGxpbWl0c1xuICAgIGNvbnN0IHVzYWdlUGxhbiA9IHRoaXMucmVzdEFwaS5hZGRVc2FnZVBsYW4oJ1VzYWdlUGxhbicsIHtcbiAgICAgIG5hbWU6IGBzZXJ2ZXJsZXNzYXBwLXVzYWdlLXBsYW4tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgZGVzY3JpcHRpb246ICdVc2FnZSBwbGFuIGZvciBpbWFnZSBkZXRlY3RvciBBUEknLFxuICAgICAgdGhyb3R0bGU6IHtcbiAgICAgICAgcmF0ZUxpbWl0OiBlbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnID8gMTAwMCA6IDEwMCxcbiAgICAgICAgYnVyc3RMaW1pdDogZW52aXJvbm1lbnRTdWZmaXggPT09ICdwcm9kJyA/IDIwMDAgOiAyMDAsXG4gICAgICB9LFxuICAgICAgcXVvdGE6IHtcbiAgICAgICAgbGltaXQ6IGVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCcgPyAxMDAwMDAgOiAxMDAwMCxcbiAgICAgICAgcGVyaW9kOiBhcGlnYXRld2F5LlBlcmlvZC5NT05USCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB1c2FnZVBsYW4uYWRkQXBpS2V5KHRoaXMuYXBpS2V5KTtcbiAgICB1c2FnZVBsYW4uYWRkQXBpU3RhZ2Uoe1xuICAgICAgc3RhZ2U6IHRoaXMucmVzdEFwaS5kZXBsb3ltZW50U3RhZ2UsXG4gICAgfSk7XG5cbiAgICAvLyBMYW1iZGEgaW50ZWdyYXRpb24gd2l0aCBlcnJvciBoYW5kbGluZ1xuICAgIGNvbnN0IGxhbWJkYUludGVncmF0aW9uID0gbmV3IGFwaWdhdGV3YXkuTGFtYmRhSW50ZWdyYXRpb24oXG4gICAgICBpbWFnZVByb2Nlc3NvckZ1bmN0aW9uLFxuICAgICAge1xuICAgICAgICByZXF1ZXN0VGVtcGxhdGVzOiB7XG4gICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBib2R5OiAnJGlucHV0Lmpzb24oXCIkXCIpJyxcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgJyNmb3JlYWNoKCRoZWFkZXIgaW4gJGlucHV0LnBhcmFtcygpLmhlYWRlci5rZXlTZXQoKSknOlxuICAgICAgICAgICAgICAgICdcIiRoZWFkZXJcIjogXCIkdXRpbC5lc2NhcGVKYXZhU2NyaXB0KCRpbnB1dC5wYXJhbXMoKS5oZWFkZXIuZ2V0KCRoZWFkZXIpKVwiI2lmKCRmb3JlYWNoLmhhc05leHQpLCNlbmQjZW5kJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwYXRoUGFyYW1ldGVyczoge1xuICAgICAgICAgICAgICAnI2ZvcmVhY2goJHBhcmFtIGluICRpbnB1dC5wYXJhbXMoKS5wYXRoLmtleVNldCgpKSc6XG4gICAgICAgICAgICAgICAgJ1wiJHBhcmFtXCI6IFwiJHV0aWwuZXNjYXBlSmF2YVNjcmlwdCgkaW5wdXQucGFyYW1zKCkucGF0aC5nZXQoJHBhcmFtKSlcIiNpZigkZm9yZWFjaC5oYXNOZXh0KSwjZW5kI2VuZCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcXVlcnlTdHJpbmdQYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICcjZm9yZWFjaCgkcXVlcnlQYXJhbSBpbiAkaW5wdXQucGFyYW1zKCkucXVlcnlzdHJpbmcua2V5U2V0KCkpJzpcbiAgICAgICAgICAgICAgICAnXCIkcXVlcnlQYXJhbVwiOiBcIiR1dGlsLmVzY2FwZUphdmFTY3JpcHQoJGlucHV0LnBhcmFtcygpLnF1ZXJ5c3RyaW5nLmdldCgkcXVlcnlQYXJhbSkpXCIjaWYoJGZvcmVhY2guaGFzTmV4dCksI2VuZCNlbmQnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfSxcbiAgICAgICAgaW50ZWdyYXRpb25SZXNwb25zZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdGF0dXNDb2RlOiAnMjAwJyxcbiAgICAgICAgICAgIHJlc3BvbnNlVGVtcGxhdGVzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogJyRpbnB1dC5qc29uKFwiJFwiKScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogJzQwMCcsXG4gICAgICAgICAgICBzZWxlY3Rpb25QYXR0ZXJuOiAnNFxcXFxkezJ9JyxcbiAgICAgICAgICAgIHJlc3BvbnNlVGVtcGxhdGVzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGVycm9yOiAnQmFkIFJlcXVlc3QnLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICckaW5wdXQucGF0aChcIiQuZXJyb3JNZXNzYWdlXCIpJyxcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3RhdHVzQ29kZTogJzUwMCcsXG4gICAgICAgICAgICBzZWxlY3Rpb25QYXR0ZXJuOiAnNVxcXFxkezJ9JyxcbiAgICAgICAgICAgIHJlc3BvbnNlVGVtcGxhdGVzOiB7XG4gICAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIGVycm9yOiAnSW50ZXJuYWwgU2VydmVyIEVycm9yJyxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnJGlucHV0LnBhdGgoXCIkLmVycm9yTWVzc2FnZVwiKScsXG4gICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBSZXF1ZXN0IHZhbGlkYXRvciBmb3IgaW5wdXQgdmFsaWRhdGlvblxuICAgIGNvbnN0IHJlcXVlc3RWYWxpZGF0b3IgPSBuZXcgYXBpZ2F0ZXdheS5SZXF1ZXN0VmFsaWRhdG9yKFxuICAgICAgdGhpcyxcbiAgICAgICdSZXF1ZXN0VmFsaWRhdG9yJyxcbiAgICAgIHtcbiAgICAgICAgcmVzdEFwaTogdGhpcy5yZXN0QXBpLFxuICAgICAgICByZXF1ZXN0VmFsaWRhdG9yTmFtZTogJ3JlcXVlc3QtdmFsaWRhdG9yJyxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0Qm9keTogdHJ1ZSxcbiAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gUmVxdWVzdCBtb2RlbHMgZm9yIHZhbGlkYXRpb25cbiAgICBjb25zdCBpbWFnZVVwbG9hZE1vZGVsID0gbmV3IGFwaWdhdGV3YXkuTW9kZWwodGhpcywgJ0ltYWdlVXBsb2FkTW9kZWwnLCB7XG4gICAgICByZXN0QXBpOiB0aGlzLnJlc3RBcGksXG4gICAgICBtb2RlbE5hbWU6ICdJbWFnZVVwbG9hZE1vZGVsJyxcbiAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICBzY2hlbWE6IHtcbiAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5PQkpFQ1QsXG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBpbWFnZURhdGE6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdCYXNlNjQgZW5jb2RlZCBpbWFnZSBkYXRhJyxcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMTAwLFxuICAgICAgICAgICAgbWF4TGVuZ3RoOiAxMDQ4NTc2MCwgLy8gMTBNQiBsaW1pdFxuICAgICAgICAgIH0sXG4gICAgICAgICAgZmlsZU5hbWU6IHtcbiAgICAgICAgICAgIHR5cGU6IGFwaWdhdGV3YXkuSnNvblNjaGVtYVR5cGUuU1RSSU5HLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdPcmlnaW5hbCBmaWxlbmFtZScsXG4gICAgICAgICAgICBtaW5MZW5ndGg6IDEsXG4gICAgICAgICAgICBtYXhMZW5ndGg6IDI1NSxcbiAgICAgICAgICAgIHBhdHRlcm46ICdeW2EtekEtWjAtOS5fLV0rXFxcXC4oanBnfGpwZWd8cG5nfGdpZnxibXApJCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb250ZW50VHlwZToge1xuICAgICAgICAgICAgdHlwZTogYXBpZ2F0ZXdheS5Kc29uU2NoZW1hVHlwZS5TVFJJTkcsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ltYWdlIE1JTUUgdHlwZScsXG4gICAgICAgICAgICBlbnVtOiBbJ2ltYWdlL2pwZWcnLCAnaW1hZ2UvcG5nJywgJ2ltYWdlL2dpZicsICdpbWFnZS9ibXAnXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydpbWFnZURhdGEnLCAnZmlsZU5hbWUnLCAnY29udGVudFR5cGUnXSxcbiAgICAgICAgYWRkaXRpb25hbFByb3BlcnRpZXM6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIEFQSSBSZXNvdXJjZXMgYW5kIE1ldGhvZHNcbiAgICBjb25zdCBpbWFnZXNSZXNvdXJjZSA9IHRoaXMucmVzdEFwaS5yb290LmFkZFJlc291cmNlKCdpbWFnZXMnLCB7XG4gICAgICBkZWZhdWx0Q29yc1ByZWZsaWdodE9wdGlvbnM6IHtcbiAgICAgICAgYWxsb3dPcmlnaW5zOlxuICAgICAgICAgIGVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCdcbiAgICAgICAgICAgID8gWydodHRwczovL3lvdXJkb21haW4uY29tJ11cbiAgICAgICAgICAgIDogYXBpZ2F0ZXdheS5Db3JzLkFMTF9PUklHSU5TLFxuICAgICAgICBhbGxvd01ldGhvZHM6IFsnR0VUJywgJ1BPU1QnLCAnT1BUSU9OUyddLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFBPU1QgL2ltYWdlcyAtIFVwbG9hZCBpbWFnZSBmb3IgcHJvY2Vzc2luZ1xuICAgIGltYWdlc1Jlc291cmNlLmFkZE1ldGhvZCgnUE9TVCcsIGxhbWJkYUludGVncmF0aW9uLCB7XG4gICAgICBhcGlLZXlSZXF1aXJlZDogdHJ1ZSxcbiAgICAgIHJlcXVlc3RWYWxpZGF0b3IsXG4gICAgICByZXF1ZXN0TW9kZWxzOiB7XG4gICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogaW1hZ2VVcGxvYWRNb2RlbCxcbiAgICAgIH0sXG4gICAgICBtZXRob2RSZXNwb25zZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRU1QVFlfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXNwb25zZVBhcmFtZXRlcnM6IHtcbiAgICAgICAgICAgICdtZXRob2QucmVzcG9uc2UuaGVhZGVyLkFjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MDAnLFxuICAgICAgICAgIHJlc3BvbnNlTW9kZWxzOiB7XG4gICAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IGFwaWdhdGV3YXkuTW9kZWwuRVJST1JfTU9ERUwsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHN0YXR1c0NvZGU6ICc0MjknLCAvLyBSYXRlIGxpbWl0IGV4Y2VlZGVkXG4gICAgICAgICAgcmVzcG9uc2VNb2RlbHM6IHtcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgc3RhdHVzQ29kZTogJzUwMCcsXG4gICAgICAgICAgcmVzcG9uc2VNb2RlbHM6IHtcbiAgICAgICAgICAgICdhcHBsaWNhdGlvbi9qc29uJzogYXBpZ2F0ZXdheS5Nb2RlbC5FUlJPUl9NT0RFTCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvaW1hZ2VzIC0gTGlzdCBwcm9jZXNzZWQgaW1hZ2VzIHdpdGggcGFnaW5hdGlvblxuICAgIGltYWdlc1Jlc291cmNlLmFkZE1ldGhvZCgnR0VUJywgbGFtYmRhSW50ZWdyYXRpb24sIHtcbiAgICAgIGFwaUtleVJlcXVpcmVkOiB0cnVlLFxuICAgICAgcmVxdWVzdFBhcmFtZXRlcnM6IHtcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLnN0YXR1cyc6IGZhbHNlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcubGltaXQnOiBmYWxzZSxcbiAgICAgICAgJ21ldGhvZC5yZXF1ZXN0LnF1ZXJ5c3RyaW5nLm5leHRUb2tlbic6IGZhbHNlLFxuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucXVlcnlzdHJpbmcuYW5pbWFsJzogZmFsc2UsXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihcbiAgICAgICAgdGhpcyxcbiAgICAgICAgJ0dldEltYWdlc1ZhbGlkYXRvcicsXG4gICAgICAgIHtcbiAgICAgICAgICByZXN0QXBpOiB0aGlzLnJlc3RBcGksXG4gICAgICAgICAgcmVxdWVzdFZhbGlkYXRvck5hbWU6ICdnZXQtaW1hZ2VzLXZhbGlkYXRvcicsXG4gICAgICAgICAgdmFsaWRhdGVSZXF1ZXN0UGFyYW1ldGVyczogdHJ1ZSxcbiAgICAgICAgfVxuICAgICAgKSxcbiAgICB9KTtcblxuICAgIC8vIEdFVCAvaW1hZ2VzL3tpZH0gLSBHZXQgc3BlY2lmaWMgaW1hZ2UgZGV0YWlsc1xuICAgIGNvbnN0IGltYWdlUmVzb3VyY2UgPSBpbWFnZXNSZXNvdXJjZS5hZGRSZXNvdXJjZSgne2lkfScpO1xuICAgIGltYWdlUmVzb3VyY2UuYWRkTWV0aG9kKCdHRVQnLCBsYW1iZGFJbnRlZ3JhdGlvbiwge1xuICAgICAgYXBpS2V5UmVxdWlyZWQ6IHRydWUsXG4gICAgICByZXF1ZXN0UGFyYW1ldGVyczoge1xuICAgICAgICAnbWV0aG9kLnJlcXVlc3QucGF0aC5pZCc6IHRydWUsXG4gICAgICB9LFxuICAgICAgcmVxdWVzdFZhbGlkYXRvcjogbmV3IGFwaWdhdGV3YXkuUmVxdWVzdFZhbGlkYXRvcihcbiAgICAgICAgdGhpcyxcbiAgICAgICAgJ0dldEltYWdlVmFsaWRhdG9yJyxcbiAgICAgICAge1xuICAgICAgICAgIHJlc3RBcGk6IHRoaXMucmVzdEFwaSxcbiAgICAgICAgICByZXF1ZXN0VmFsaWRhdG9yTmFtZTogJ2dldC1pbWFnZS12YWxpZGF0b3InLFxuICAgICAgICAgIHZhbGlkYXRlUmVxdWVzdFBhcmFtZXRlcnM6IHRydWUsXG4gICAgICAgIH1cbiAgICAgICksXG4gICAgfSk7XG5cbiAgICAvLyBIZWFsdGggY2hlY2sgZW5kcG9pbnQgKG5vIEFQSSBrZXkgcmVxdWlyZWQpXG4gICAgY29uc3QgaGVhbHRoUmVzb3VyY2UgPSB0aGlzLnJlc3RBcGkucm9vdC5hZGRSZXNvdXJjZSgnaGVhbHRoJyk7XG4gICAgaGVhbHRoUmVzb3VyY2UuYWRkTWV0aG9kKFxuICAgICAgJ0dFVCcsXG4gICAgICBuZXcgYXBpZ2F0ZXdheS5Nb2NrSW50ZWdyYXRpb24oe1xuICAgICAgICBpbnRlZ3JhdGlvblJlc3BvbnNlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICAgICAgcmVzcG9uc2VUZW1wbGF0ZXM6IHtcbiAgICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgc3RhdHVzOiAnaGVhbHRoeScsXG4gICAgICAgICAgICAgICAgdGltZXN0YW1wOiAnJGNvbnRleHQucmVxdWVzdFRpbWUnLFxuICAgICAgICAgICAgICAgIHNlcnZpY2U6ICdzZXJ2ZXJsZXNzLWltYWdlLWRldGVjdG9yJyxcbiAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHJlcXVlc3RUZW1wbGF0ZXM6IHtcbiAgICAgICAgICAnYXBwbGljYXRpb24vanNvbic6IEpTT04uc3RyaW5naWZ5KHsgc3RhdHVzQ29kZTogMjAwIH0pLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICB7XG4gICAgICAgIG1ldGhvZFJlc3BvbnNlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6ICcyMDAnLFxuICAgICAgICAgICAgcmVzcG9uc2VNb2RlbHM6IHtcbiAgICAgICAgICAgICAgJ2FwcGxpY2F0aW9uL2pzb24nOiBhcGlnYXRld2F5Lk1vZGVsLkVNUFRZX01PREVMLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBBZGQgcmVzb3VyY2UgdGFnc1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnQ29tcG9uZW50JywgJ0FQSScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudFN1ZmZpeCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gIH1cbn1cbiJdfQ==