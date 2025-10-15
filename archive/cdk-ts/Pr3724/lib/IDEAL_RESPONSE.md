```typescript:Payment API CDK Stack:lib/tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';

export class PaymentApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // Set the region as required by the prompt.
    super(scope, id, {
      ...props,
      env: { region: 'us-west-2', ...props?.env },
    });

    // Use CDK Aspects to apply a RemovalPolicy to all resources in the stack.
    // This is a best practice for non-production environments to ensure clean teardown
    // and avoid orphaned resources. It's more efficient than setting it on each resource.
    cdk.Aspects.of(this).add({
      visit(node) {
        if (node instanceof cdk.CfnResource) {
          node.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        }
      },
    });

    // =================================================================
    // 1. Lambda Functions
    // =================================================================
    // Using lambda.Function with inline code for simplicity, as per the user's example.
    // For larger, real-world applications, using NodejsFunction with separate handler files is recommended.
    const paymentsHandler = new lambda.Function(this, 'PaymentsHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const { randomUUID } = require('crypto');
        exports.handler = async (event) => {
          console.log('Received payment request:', JSON.stringify(event, null, 2));
          try {
            const body = event.body ? JSON.parse(event.body) : {};
            // Placeholder for actual payment processing logic (e.g., call Stripe, Adyen)
            return {
              statusCode: 201, // 201 Created is appropriate for a successful POST
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                message: 'Payment processed successfully',
                paymentId: 'pay_' + randomUUID(),
                amount: body.amount || 0,
              }),
            };
          } catch (error) {
            console.error('Error processing payment:', error);
            return {
              statusCode: 500,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: 'Internal Server Error processing payment' }),
            };
          }
        };
      `),
    });

    const transactionsHandler = new lambda.Function(this, 'TransactionsHandler', {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const { randomUUID } = require('crypto');
          exports.handler = async (event) => {
            console.log('Received transactions request:', JSON.stringify(event, null, 2));
            try {
              // Placeholder for fetching transactions from a database
              const transactions = [
                { transactionId: 'txn_' + randomUUID(), amount: 199.99, status: 'completed' },
                { transactionId: 'txn_' + randomUUID(), amount: 49.50, status: 'completed' }
              ];
              return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions }),
              };
            } catch (error) {
              console.error('Error fetching transactions:', error);
              return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Internal Server Error fetching transactions' }),
              };
            }
          };
        `),
    });

    // =================================================================
    // 2. API Gateway (REST API)
    // =================================================================
    // A comprehensive API Gateway setup with detailed logging, tracing, and a robust CORS policy.
    const api = new apigateway.RestApi(this, 'PaymentProcessingApi', {
      restApiName: 'PaymentProcessingApi',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true, // Enable detailed CloudWatch metrics
        tracingEnabled: true, // Enable AWS X-Ray tracing for performance monitoring
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.origins(['https://*.example.com']),
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
        allowCredentials: true,
      },
      cloudWatchRole: true, // Automatically create a role for API Gateway to push logs to CloudWatch
    });

    // =================================================================
    // 3. API Endpoints & Lambda Integrations
    // =================================================================
    const paymentsResource = api.root.addResource('payments');
    paymentsResource.addMethod('POST', new apigateway.LambdaIntegration(paymentsHandler), {
      apiKeyRequired: true,
    });

    const transactionsResource = api.root.addResource('transactions');
    transactionsResource.addMethod('GET', new apigateway.LambdaIntegration(transactionsHandler), {
      apiKeyRequired: true,
    });

    // =================================================================
    // 4. API Key and Usage Plan
    // =================================================================
    const apiKey = new apigateway.ApiKey(this, 'ApiKey');

    const usagePlan = new apigateway.UsagePlan(this, 'UsagePlan', {
      name: 'StandardUsagePlan',
      throttle: { rateLimit: 10, burstLimit: 20 },
      quota: { limit: 1000, period: apigateway.Period.DAY },
    });

    usagePlan.addApiStage({ stage: api.deploymentStage });
    usagePlan.addApiKey(apiKey);

    // =================================================================
    // 5. Custom Domain Name
    // =================================================================
    // A complete, working example for setting up a custom domain.
    // Replace placeholder values with your actual domain details to enable this feature.
    const rootDomain = 'example.com';
    const apiSubdomain = 'api';
    const fullDomainName = `${apiSubdomain}.${rootDomain}`;
    const hostedZoneId = 'Z0123456789ABCDEFGHIJ'; // <-- REPLACE with your Hosted Zone ID
    const certificateArn = `arn:aws:acm:us-west-2:${this.account}:certificate/12345678-1234-1234-1234-123456789012`; // <-- REPLACE with your Certificate ARN

    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: hostedZoneId,
      zoneName: rootDomain,
    });

    const certificate = acm.Certificate.fromCertificateArn(this, 'Certificate', certificateArn);

    const apiDomain = new apigateway.DomainName(this, 'ApiDomain', {
      domainName: fullDomainName,
      certificate,
      endpointType: apigateway.EndpointType.EDGE,
      securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
    });

    // Map the custom domain to the API Gateway's root.
    apiDomain.addBasePathMapping(api);

    // Create an A record in Route 53 to point the custom domain to the API Gateway.
    new route53.ARecord(this, 'ApiAliasRecord', {
      zone: hostedZone,
      recordName: apiSubdomain,
      target: route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(apiDomain)),
    });

    // =================================================================
    // 6. Stack Outputs
    // =================================================================
    // Providing multiple, useful outputs for easier consumption of the stack resources.
    new cdk.CfnOutput(this, 'ApiInvokeUrl', {
      value: api.url,
      description: 'The invoke URL for the deployed API stage',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'The ID of the created API Key',
    });

    new cdk.CfnOutput(this, 'CustomDomainUrl', {
        value: `https://${fullDomainName}/`,
        description: 'The full custom domain URL for the API',
    });
  }
}
```
