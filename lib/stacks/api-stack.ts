import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  imageProcessorFunction: lambda.Function;
  imageBucket: s3.Bucket;
}

export class ApiStack extends cdk.NestedStack {
  public readonly restApi: apigateway.RestApi;
  public readonly apiKey: apigateway.ApiKey;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const { environmentSuffix, imageProcessorFunction } = props;

    // CloudWatch role creation disabled to avoid deployment issues
    // For production, enable API Gateway logging by setting up CloudWatch role manually:
    // 1. Create role: aws iam create-role --role-name APIGatewayCloudWatchRole --assume-role-policy-document file://trust-policy.json
    // 2. Attach policy: aws iam attach-role-policy --role-name APIGatewayCloudWatchRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
    // 3. Set account: aws apigateway put-account --cloud-watch-role-arn arn:aws:iam::ACCOUNT:role/APIGatewayCloudWatchRole
    // 4. Then change loggingLevel back to ERROR or INFO in deployOptions

    // Create API Gateway with security and monitoring configurations
    this.restApi = new apigateway.RestApi(this, 'ImageDetectorApi', {
      restApiName: `serverlessapp-image-detector-api-${environmentSuffix}`,
      description: 'Production-ready API for serverless image detection system',
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.ERROR, // Enable ERROR level logging for production debugging
        dataTraceEnabled: false,
        metricsEnabled: true,
        tracingEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins:
          environmentSuffix === 'prod'
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
      value:
        environmentSuffix === 'prod'
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
    // Detect LocalStack for proxy integration
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    const lambdaIntegration = new apigateway.LambdaIntegration(
      imageProcessorFunction,
      {
        // Use proxy integration for LocalStack to avoid request template issues
        proxy: isLocalStack,
        timeout: cdk.Duration.minutes(1), // Increased for cold starts
        requestTemplates: isLocalStack
          ? undefined
          : {
              'application/json': JSON.stringify({
                body: '$input.json("$")',
                headers: {
                  '#foreach($header in $input.params().header.keySet())':
                    '"$header": "$util.escapeJavaScript($input.params().header.get($header))"#if($foreach.hasNext),#end#end',
                },
                pathParameters: {
                  '#foreach($param in $input.params().path.keySet())':
                    '"$param": "$util.escapeJavaScript($input.params().path.get($param))"#if($foreach.hasNext),#end#end',
                },
                queryStringParameters: {
                  '#foreach($queryParam in $input.params().querystring.keySet())':
                    '"$queryParam": "$util.escapeJavaScript($input.params().querystring.get($queryParam))"#if($foreach.hasNext),#end#end',
                },
              }),
            },
        integrationResponses: isLocalStack
          ? undefined
          : [
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
      }
    );

    // Request validator for input validation
    const requestValidator = new apigateway.RequestValidator(
      this,
      'RequestValidator',
      {
        restApi: this.restApi,
        requestValidatorName: 'request-validator',
        validateRequestBody: true,
        validateRequestParameters: true,
      }
    );

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
            pattern: '^[a-zA-Z0-9._-]+\\.(jpg|jpeg|png|gif|bmp|webp)$',
          },
          contentType: {
            type: apigateway.JsonSchemaType.STRING,
            description: 'Image MIME type',
            enum: [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/bmp',
              'image/webp',
            ],
          },
        },
        required: ['imageData', 'fileName', 'contentType'],
        additionalProperties: false,
      },
    });

    // API Resources and Methods
    const imagesResource = this.restApi.root.addResource('images', {
      defaultCorsPreflightOptions: {
        allowOrigins:
          environmentSuffix === 'prod'
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
      requestValidator: new apigateway.RequestValidator(
        this,
        'GetImagesValidator',
        {
          restApi: this.restApi,
          requestValidatorName: 'get-images-validator',
          validateRequestParameters: true,
        }
      ),
    });

    // GET /images/{id} - Get specific image details
    const imageResource = imagesResource.addResource('{id}');
    imageResource.addMethod('GET', lambdaIntegration, {
      apiKeyRequired: true,
      requestParameters: {
        'method.request.path.id': true,
      },
      requestValidator: new apigateway.RequestValidator(
        this,
        'GetImageValidator',
        {
          restApi: this.restApi,
          requestValidatorName: 'get-image-validator',
          validateRequestParameters: true,
        }
      ),
    });

    // Health check endpoint (no API key required)
    const healthResource = this.restApi.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
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
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    // Add resource tags
    cdk.Tags.of(this).add('Component', 'API');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
