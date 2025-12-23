import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ComputeProps {
  environment: string;
  environmentSuffix: string;
  lambdaConcurrency: number;
  role: aws.iam.Role;
}

export class ComputeComponent extends pulumi.ComponentResource {
  public paymentProcessorFunction: aws.lambda.Function;
  public validationFunction: aws.lambda.Function;

  constructor(
    name: string,
    props: ComputeProps,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:compute:ComputeComponent', name, {}, opts);

    // Payment processor Lambda
    this.paymentProcessorFunction = new aws.lambda.Function(
      `payment-processor-${props.environment}-${props.environmentSuffix}`,
      {
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: props.role.arn,
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: props.lambdaConcurrency,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Processing payment:', JSON.stringify(event));

  // Extract payment details from event
  const paymentData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  // Process payment (simplified for demo)
  const result = {
    transactionId: \`txn-\${Date.now()}\`,
    status: 'processed',
    amount: paymentData.amount,
    timestamp: new Date().toISOString(),
  };

  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
        `),
        }),
        environment: {
          variables: {
            ENVIRONMENT: props.environment,
            LOG_LEVEL: 'INFO',
          },
        },
        tags: {
          Name: `payment-processor-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    // Validation Lambda
    this.validationFunction = new aws.lambda.Function(
      `payment-validation-${props.environment}-${props.environmentSuffix}`,
      {
        runtime: 'nodejs20.x',
        handler: 'index.handler',
        role: props.role.arn,
        memorySize: 512,
        timeout: 15,
        reservedConcurrentExecutions: props.lambdaConcurrency,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
  console.log('Validating payment:', JSON.stringify(event));

  // Extract validation data
  const data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  // Validate payment data
  const isValid = data.amount > 0 && data.currency && data.customerId;

  return {
    statusCode: 200,
    body: JSON.stringify({
      valid: isValid,
      checks: {
        amount: data.amount > 0,
        currency: !!data.currency,
        customer: !!data.customerId,
      },
    }),
  };
};
        `),
        }),
        environment: {
          variables: {
            ENVIRONMENT: props.environment,
            LOG_LEVEL: 'INFO',
          },
        },
        tags: {
          Name: `payment-validation-${props.environment}-${props.environmentSuffix}`,
          Environment: props.environment,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      paymentProcessorArn: this.paymentProcessorFunction.arn,
      validationFunctionArn: this.validationFunction.arn,
    });
  }
}
