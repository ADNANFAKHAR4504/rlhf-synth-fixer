```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as path from 'path';

export class PaymentApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      // Configure the stack for the us-west-2 region as required
      ...props,
      env: {
        region: 'us-west-2',
        account: process.env.CDK_DEFAULT_ACCOUNT,
      },
    });

    // --- 1. Lambda Functions ---
    // This construct automatically bundles the TypeScript code, uses esbuild, and creates the necessary IAM role.
    // It is assumed that you have a 'lambda' folder at the root of your project.

    const paymentsHandler = new NodejsFunction(this, 'PaymentsHandler', {
      entry: path.join(__dirname, '../lambda/payments.ts'), // Assumes lambda/payments.ts
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      environment: {
        // Environment variables are encrypted by default using a default KMS key
        TABLE_NAME: 'PaymentsTable',
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
    });

    const transactionsHandler = new NodejsFunction(
      this,
      'TransactionsHandler',
      {
        entry: path.join(__dirname, '../lambda/transactions.ts'), // Assumes lambda/transactions.ts
        handler: 'handler',
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          TABLE_NAME: 'TransactionsTable',
        },
        bundling: {
          minify: true,
          sourceMap: true,
        },
      }
    );

    // Apply the DESTROY removal policy for this non-production environment
    paymentsHandler.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    transactionsHandler.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // --- 2. API Gateway (REST API) ---
    const api = new apigateway.RestApi(this, 'PaymentProcessingApi', {
      restApiName: 'PaymentProcessingApi',
      description: 'Unified API for payment processing microservices.',
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      // Enable CORS for all origins under the example.com domain
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.origins(['https://*.example.com']),
        allowMethods: apigateway.Cors.ALL_METHODS, // Allows GET, POST, etc.
      },
    });

    // --- 3. API Endpoints & Lambda Integrations ---
    const paymentsResource = api.root.addResource('payments');
    paymentsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(paymentsHandler),
      {
        apiKeyRequired: true, // Require API key for this method
      }
    );

    const transactionsResource = api.root.addResource('transactions');
    transactionsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(transactionsHandler),
      {
        apiKeyRequired: true, // Require API key for this method
      }
    );

    // --- 4. API Key and Usage Plan ---
    const apiKey = new apigateway.ApiKey(this, 'ApiKey');

    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: 'StandardUsagePlan',
      description: 'Standard usage plan with daily quota and throttling.',
      throttle: {
        rateLimit: 10, // 10 requests per second
        burstLimit: 20, // Allows for bursts up to 20 requests
      },
      quota: {
        limit: 1000, // 1000 requests per day
        period: apigateway.Period.DAY,
      },
    });

    // Associate the API key and the 'prod' stage with the usage plan
    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // --- 5. Custom Domain Name ---
    // This section assumes you have a hosted zone in Route 53 and a validated ACM certificate.
    const domainName = 'api.example.com'; // Replace with your custom domain
    const hostedZoneId = 'Z0123456789ABCDEFGHIJK'; // Replace with your Hosted Zone ID
    const certificateArn =
      'arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id'; // Replace with your ACM Cert ARN for us-east-1

    // Look up the hosted zone
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: hostedZoneId,
        zoneName: domainName,
      }
    );

    // Reference the existing ACM certificate
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      'Certificate',
      certificateArn
    );

    // Create the custom domain for the API Gateway
    const apiDomain = new apigateway.DomainName(this, 'ApiDomain', {
      domainName: domainName,
      certificate: certificate,
      endpointType: apigateway.EndpointType.EDGE, // Edge-optimized endpoint
    });

    // Map the custom domain to our API's base path
    apiDomain.addBasePathMapping(api);

    // Create a Route 53 A record to point the custom domain to the API Gateway
    new route53.ARecord(this, 'ApiDnsRecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayDomain(apiDomain)
      ),
    });

    // --- 6. Stack Outputs ---
    new cdk.CfnOutput(this, 'ApiInvokeUrl', {
      value: api.url,
      description: 'Invoke URL for the API Gateway prod stage',
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'ID of the created API Key',
    });
  }
}
```
