```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

export class PaymentProcessingApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        ...props?.env,
      },
    });

    // Apply RemovalPolicy.DESTROY to all resources
    this.applyRemovalPolicy();

    // ==========================================
    // 1. Lambda Functions
    // ==========================================

    // Payment Handler Lambda
    const paymentsHandler = new NodejsFunction(this, 'PaymentsHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      handler: 'handler',
      entry: path.join(__dirname, 'lambda/payments-handler.ts'),
      // Inline code for demo purposes - normally this would be in a separate file
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing payment:', event);
          
          try {
            const body = JSON.parse(event.body || '{}');
            
            // Placeholder payment processing logic
            const paymentResult = {
              transactionId: 'txn_' + Date.now(),
              amount: body.amount,
              currency: body.currency || 'USD',
              status: 'approved',
              timestamp: new Date().toISOString()
            };
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify(paymentResult)
            };
          } catch (error) {
            console.error('Payment processing error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Payment processing failed' })
            };
          }
        };
      `),
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // Transactions Handler Lambda
    const transactionsHandler = new NodejsFunction(
      this,
      'TransactionsHandler',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        handler: 'handler',
        entry: path.join(__dirname, 'lambda/transactions-handler.ts'),
        // Inline code for demo purposes
        code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Fetching transactions:', event);
          
          try {
            // Placeholder transaction retrieval logic
            const transactions = [
              {
                transactionId: 'txn_001',
                amount: 100.00,
                currency: 'USD',
                status: 'completed',
                timestamp: '2024-01-01T10:00:00Z'
              },
              {
                transactionId: 'txn_002',
                amount: 250.50,
                currency: 'USD',
                status: 'pending',
                timestamp: '2024-01-01T11:30:00Z'
              }
            ];
            
            return {
              statusCode: 200,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              body: JSON.stringify({
                transactions,
                count: transactions.length
              })
            };
          } catch (error) {
            console.error('Error fetching transactions:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'Failed to fetch transactions' })
            };
          }
        };
      `),
        environment: {
          NODE_OPTIONS: '--enable-source-maps',
        },
      }
    );

    // ==========================================
    // 2. API Gateway (REST API)
    // ==========================================

    const api = new apigateway.RestApi(this, 'PaymentProcessingApi', {
      restApiName: 'PaymentProcessingApi',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.allowOrigins(['https://*.example.com']),
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Api-Key', 'Authorization'],
        allowCredentials: true,
      },
      cloudWatchRole: true,
      endpointTypes: [apigateway.EndpointType.EDGE],
    });

    // ==========================================
    // 3. API Endpoints & Lambda Integrations
    // ==========================================

    // Create /payments resource
    const paymentsResource = api.root.addResource('payments');

    // Add POST method to /payments with Lambda integration
    const paymentsIntegration = new apigateway.LambdaIntegration(
      paymentsHandler,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    paymentsResource.addMethod('POST', paymentsIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // Create /transactions resource
    const transactionsResource = api.root.addResource('transactions');

    // Add GET method to /transactions with Lambda integration
    const transactionsIntegration = new apigateway.LambdaIntegration(
      transactionsHandler,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    );

    transactionsResource.addMethod('GET', transactionsIntegration, {
      apiKeyRequired: true,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // ==========================================
    // 4. API Key and Usage Plan
    // ==========================================

    // Create API Key
    const apiKey = new apigateway.ApiKey(this, 'PaymentApiKey', {
      apiKeyName: 'payment-processing-api-key',
      description: 'API Key for Payment Processing API',
      enabled: true,
    });

    // Create Usage Plan
    const usagePlan = new apigateway.UsagePlan(this, 'PaymentApiUsagePlan', {
      name: 'PaymentProcessingUsagePlan',
      description: 'Usage plan for Payment Processing API',
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
      quota: {
        limit: 1000,
        period: apigateway.Period.DAY,
      },
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage,
        },
      ],
    });

    // Add API Key to Usage Plan
    usagePlan.addApiKey(apiKey);

    // ==========================================
    // 5. Custom Domain Name
    // ==========================================

    // Note: Assuming ACM Certificate and Route 53 Hosted Zone already exist
    // You would need to replace these with actual values
    const certificateArn =
      'arn:aws:acm:us-east-1:123456789012:certificate/example-cert-id';
    const domainName = 'api.payments.example.com';

    // Import existing certificate (for EDGE endpoints, cert must be in us-east-1)
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'PaymentApiCertificate',
      certificateArn
    );

    // Create custom domain
    const customDomain = new apigateway.DomainName(this, 'PaymentApiDomain', {
      domainName: domainName,
      certificate: certificate,
      endpointType: apigateway.EndpointType.EDGE,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
    });

    // Create base path mapping
    new apigateway.BasePathMapping(this, 'PaymentApiBasePathMapping', {
      domainName: customDomain,
      restApi: api,
      basePath: '', // Map to root path
      stage: api.deploymentStage,
    });

    // ==========================================
    // 6. Stack Outputs
    // ==========================================

    // Output API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.deploymentStage.urlForPath('/'),
      description: 'API Gateway Invoke URL for prod stage',
      exportName: 'PaymentProcessingApiUrl',
    });

    // Output API Key ID
    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'ID of the created API Key',
      exportName: 'PaymentProcessingApiKeyId',
    });

    // Additional helpful outputs
    new cdk.CfnOutput(this, 'CustomDomainUrl', {
      value: `https://${domainName}`,
      description: 'Custom domain URL for the API',
    });

    new cdk.CfnOutput(this, 'PaymentsEndpoint', {
      value: `${api.deploymentStage.urlForPath('/payments')}`,
      description: 'Payments endpoint URL',
    });

    new cdk.CfnOutput(this, 'TransactionsEndpoint', {
      value: `${api.deploymentStage.urlForPath('/transactions')}`,
      description: 'Transactions endpoint URL',
    });
  }

  // Helper method to apply RemovalPolicy.DESTROY to all resources
  private applyRemovalPolicy(): void {
    cdk.Aspects.of(this).add({
      visit(node: cdk.IConstruct) {
        if (node instanceof cdk.CfnResource) {
          node.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        }
      },
    });
  }
}

// App initialization
const app = new cdk.App();
new PaymentProcessingApiStack(app, 'PaymentProcessingApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description: 'Secure and scalable REST API for payment processing system',
});

app.synth();
```
