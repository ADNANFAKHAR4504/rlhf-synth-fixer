import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly api: apigateway.RestApi;
  public readonly paymentsHandler: lambda.Function;
  public readonly transactionsHandler: lambda.Function;
  public readonly apiKey: apigateway.ApiKey;
  public readonly usagePlan: apigateway.UsagePlan;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        account: props?.env?.account,
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 1. Create Lambda Functions
    this.paymentsHandler = new lambda.Function(this, 'PaymentsHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
exports.handler = async (event) => {
  console.log('Received payment request:', JSON.stringify(event, null, 2));
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Payment processed successfully',
        paymentId: 'pay_' + Date.now(),
        amount: body.amount || 0,
        status: 'success'
      })
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error processing payment',
        error: error.message || 'Unknown error'
      })
    };
  }
};
      `),
      environment: {
        ENVIRONMENT: environmentSuffix,
      },
    });
    this.paymentsHandler.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    this.transactionsHandler = new lambda.Function(
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
  console.log('Received transactions request:', JSON.stringify(event, null, 2));
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = queryParams.limit ? parseInt(queryParams.limit) : 10;
    const transactions = Array.from({ length: limit }, (_, i) => ({
      transactionId: 'txn_' + Date.now() + '_' + i,
      amount: Math.floor(Math.random() * 1000) + 1,
      status: 'completed',
      timestamp: new Date().toISOString()
    }));
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        transactions: transactions,
        count: transactions.length
      })
    };
  } catch (error) {
    console.error('Error retrieving transactions:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error retrieving transactions',
        error: error.message || 'Unknown error'
      })
    };
  }
};
      `),
        environment: {
          ENVIRONMENT: environmentSuffix,
        },
      }
    );
    this.transactionsHandler.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 2. Create API Gateway REST API
    this.api = new apigateway.RestApi(this, 'PaymentProcessingApi', {
      restApiName: `PaymentProcessingApi-${environmentSuffix}`,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // 3. Create API Endpoints & Lambda Integrations
    const paymentsResource = this.api.root.addResource('payments');
    paymentsResource.addMethod(
      'POST',
      new apigateway.LambdaIntegration(this.paymentsHandler),
      {
        apiKeyRequired: true,
      }
    );

    const transactionsResource = this.api.root.addResource('transactions');
    transactionsResource.addMethod(
      'GET',
      new apigateway.LambdaIntegration(this.transactionsHandler),
      {
        apiKeyRequired: true,
      }
    );

    // 4. Create API Key and Usage Plan
    this.apiKey = new apigateway.ApiKey(this, 'PaymentApiKey', {
      apiKeyName: `payment-api-key-${environmentSuffix}`,
      description: 'API Key for Payment Processing API',
    });

    this.usagePlan = new apigateway.UsagePlan(this, 'PaymentUsagePlan', {
      name: `payment-usage-plan-${environmentSuffix}`,
      description: 'Usage plan for Payment Processing API',
      throttle: {
        rateLimit: 10,
        burstLimit: 20,
      },
      quota: {
        limit: 1000,
        period: apigateway.Period.DAY,
      },
    });

    this.usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    this.usagePlan.addApiKey(this.apiKey);

    // 5. Stack Outputs
    new cdk.CfnOutput(this, 'ApiInvokeUrl', {
      value: this.api.url,
      description: 'Invoke URL for the Payment Processing API',
      exportName: `PaymentApiInvokeUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeyId', {
      value: this.apiKey.keyId,
      description: 'ID of the Payment Processing API Key',
      exportName: `PaymentApiKeyId-${environmentSuffix}`,
    });
  }
}
