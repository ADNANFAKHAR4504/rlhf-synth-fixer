import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  environmentSuffix: string;
  region: string;
  apiEndpoint: string;
}

export class ComputeConstruct extends Construct {
  public readonly paymentProcessor: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    const apiParameter = new ssm.StringParameter(
      this,
      `ApiEndpointParam-${props.environmentSuffix}`,
      {
        parameterName: `/fintech/${props.environmentSuffix}/api-endpoint`,
        stringValue: props.apiEndpoint,
        description: `API endpoint for ${props.region}`,
      }
    );

    this.paymentProcessor = new lambda.Function(
      this,
      `PaymentProcessor-${props.environmentSuffix}`,
      {
        functionName: `payment-processor-${props.environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
        const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');

        exports.handler = async (event) => {
          const ssmClient = new SSMClient({ region: process.env.REGION });

          try {
            const command = new GetParameterCommand({
              Name: process.env.API_ENDPOINT_PARAM
            });
            const response = await ssmClient.send(command);
            const apiEndpoint = response.Parameter.Value;

            console.log('Processing payment event:', JSON.stringify(event));
            console.log('API Endpoint:', apiEndpoint);

            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Payment processed successfully' })
            };
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              body: JSON.stringify({ message: 'Error processing payment', error: error.message })
            };
          }
        };
      `),
        environment: {
          API_ENDPOINT_PARAM: apiParameter.parameterName,
          REGION: props.region,
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
      }
    );

    apiParameter.grantRead(this.paymentProcessor);

    cdk.Tags.of(this.paymentProcessor).add('Region', props.region);
  }
}
