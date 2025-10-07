```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export class PaymentApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // Ensure the stack is configured for the correct region as per the requirement.
    super(scope, id, { ...props, env: { ...props?.env, region: 'us-west-2' } });

    // --- 1. Lambda Functions (with Inline Code) ---
    // The Lambda function code is now defined directly within the stack
    // using `lambda.Code.fromInline` for a self-contained construct.

    const paymentsHandler = new lambda.Function(this, 'PaymentsHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          try {
            const requestBody = event.body ? JSON.parse(event.body) : {};
            console.log('Processing payment with details:', requestBody);
            
            // Placeholder for actual payment processing logic
            const paymentId = \`pid_\${Math.random().toString(36).substr(2, 9)}\`;
            
            return {
              statusCode: 201,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({
                message: 'Payment processed successfully.',
                paymentId: paymentId,
              }),
            };
          } catch (error) {
            console.error('Error processing payment:', error);
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'An internal error occurred.' }),
            };
          }
        };
      `),
    });
    // Ensure Lambda is destroyed on stack removal for non-production environments.
    paymentsHandler.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const transactionsHandler = new lambda.Function(
      this,
      'TransactionsHandler',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            try {
              console.log('Query parameters:', event.queryStringParameters);

              // Placeholder for data retrieval logic from a database
              const transactions = [
                { transactionId: 'txn_123', amount: 100.00, currency: 'USD', status: 'succeeded' },
                { transactionId: 'txn_456', amount: 50.50, currency: 'USD', status: 'succeeded' },
              ];

              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify(transactions),
              };
            } catch (error) {
              console.error('Error fetching transactions:', error);
              return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'An internal error occurred.' }),
              };
            }
          };
        `),
      }
    );
    transactionsHandler.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // --- 2. API Gateway (REST API) ---
    // Defines the core REST API with specific configurations for logging, tracing, and CORS.
    const api = new apigateway.RestApi(this, 'PaymentProcessingApi', {
      restApiName: 'PaymentProcessingApi',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.origins(['https://*.example.com']),
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });
    api.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // --- 3. API Endpoints & Lambda Integrations ---
    // Creates the /payments and /transactions resources and integrates them
    // with the Lambda functions, requiring an API key for access.
    const paymentsResource = api.root.addResource('payments');
    paymentsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(paymentsHandler),
      {
        apiKeyRequired: true,
      }
    );

    const transactionsResource = api.root.addResource('transactions');
    transactionsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(transactionsHandler),
      {
        apiKeyRequired: true,
      }
    );

    // --- 4. API Key and Usage Plan ---
    // Creates an API Key and a Usage Plan to control access and prevent abuse
    // by setting throttling and quota limits.
    const apiKey = new apigateway.ApiKey(this, 'ApiKey');
    apiKey.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: 'Standard',
      throttle: { rateLimit: 10, burstLimit: 20 },
      quota: { limit: 1000, period: apigateway.Period.DAY },
    });
    usagePlan.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    usagePlan.addApiStage({ stage: api.deploymentStage });
    usagePlan.addApiKey(apiKey);

    // --- 5. Custom Domain Name (Optional Configuration) ---
    // This section demonstrates how to link a custom domain to your API Gateway.
    // Replace the placeholder values to enable this functionality.

    // const domainName = 'api.your-domain.com';
    // const hostedZoneId = 'YOUR_HOSTED_ZONE_ID';
    // const certificateArn = 'arn:aws:acm:us-west-2:123456789012:certificate/your-certificate-id';

    // const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
    //   hostedZoneId: hostedZoneId,
    //   zoneName: domainName,
    // });

    // const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);

    // const apiDomain = new apigateway.DomainName(this, 'ApiDomain', {
    //   domainName,
    //   certificate,
    //   endpointType: apigateway.EndpointType.EDGE,
    // });
    // apiDomain.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // new apigateway.BasePathMapping(this, 'ApiBasePathMapping', {
    //   domainName: apiDomain,
    //   restApi: api,
    // });

    // new route53.ARecord(this, 'ApiAliasRecord', {
    //   zone: hostedZone,
    //   target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomain)),
    // });

    // --- 6. Stack Outputs ---
    // Exports the API endpoint URL and the API Key ID for easy access after deployment.
    new cdk.CfnOutput(this, 'ApiInvokeUrl', {
      value: api.url,
      description: 'The invoke URL for the deployed API stage',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'The ID of the created API Key',
    });
  }
}
```
