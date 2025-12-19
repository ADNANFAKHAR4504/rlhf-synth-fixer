import { TerraformStack, Testing } from 'cdktf';
import { ApiGatewayStack } from '../lib/api-gateway-stack';

const TRANSACTION_PROCESSOR_ARN =
  'arn:aws:lambda:us-east-1:123456789012:function:transaction-processor';
const TRANSACTION_PROCESSOR_INVOKE_ARN =
  'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:transaction-processor/invocations';
const STATUS_CHECKER_ARN =
  'arn:aws:lambda:us-east-1:123456789012:function:status-checker';
const STATUS_CHECKER_INVOKE_ARN =
  'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:status-checker/invocations';

describe('ApiGatewayStack', () => {
  let stack: TerraformStack;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ApiGatewayStack instantiates with all required props', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStack');

    const apiGatewayStack = new ApiGatewayStack(stack, 'ApiGatewayStack', {
      environmentSuffix: 'test',
      transactionProcessorArn: TRANSACTION_PROCESSOR_ARN,
      transactionProcessorInvokeArn: TRANSACTION_PROCESSOR_INVOKE_ARN,
      statusCheckerArn: STATUS_CHECKER_ARN,
      statusCheckerInvokeArn: STATUS_CHECKER_INVOKE_ARN,
    });

    expect(apiGatewayStack).toBeDefined();
    expect(apiGatewayStack.api).toBeDefined();
    expect(apiGatewayStack.apiUrl).toBeDefined();
  });

  test('ApiGatewayStack uses dynamic region detection', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackDefaultRegion');

    const apiGatewayStack = new ApiGatewayStack(stack, 'ApiGatewayStack', {
      environmentSuffix: 'default-region',
      transactionProcessorArn: TRANSACTION_PROCESSOR_ARN,
      transactionProcessorInvokeArn: TRANSACTION_PROCESSOR_INVOKE_ARN,
      statusCheckerArn: STATUS_CHECKER_ARN,
      statusCheckerInvokeArn: STATUS_CHECKER_INVOKE_ARN,
    });

    expect(apiGatewayStack).toBeDefined();
    expect(apiGatewayStack.api).toBeDefined();
    expect(apiGatewayStack.apiUrl).toBeDefined();
  });

  test('ApiGatewayStack creates transactions endpoint', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackTransactions');

    new ApiGatewayStack(stack, 'ApiGatewayStack', {
      environmentSuffix: 'staging',
      transactionProcessorArn: TRANSACTION_PROCESSOR_ARN,
      transactionProcessorInvokeArn: TRANSACTION_PROCESSOR_INVOKE_ARN,
      statusCheckerArn: STATUS_CHECKER_ARN,
      statusCheckerInvokeArn: STATUS_CHECKER_INVOKE_ARN,
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('transactions');
    expect(synthesized).toContain('POST');
  });

  test('ApiGatewayStack creates status endpoint', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackStatus');

    new ApiGatewayStack(stack, 'ApiGatewayStack', {
      environmentSuffix: 'dev',
      transactionProcessorArn: TRANSACTION_PROCESSOR_ARN,
      transactionProcessorInvokeArn: TRANSACTION_PROCESSOR_INVOKE_ARN,
      statusCheckerArn: STATUS_CHECKER_ARN,
      statusCheckerInvokeArn: STATUS_CHECKER_INVOKE_ARN,
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('status');
    expect(synthesized).toContain('GET');
  });

  test('ApiGatewayStack creates CORS configuration', () => {
    const app = Testing.app();
    stack = new TerraformStack(app, 'TestStackCors');

    new ApiGatewayStack(stack, 'ApiGatewayStack', {
      environmentSuffix: 'cors-test',
      transactionProcessorArn: TRANSACTION_PROCESSOR_ARN,
      transactionProcessorInvokeArn: TRANSACTION_PROCESSOR_INVOKE_ARN,
      statusCheckerArn: STATUS_CHECKER_ARN,
      statusCheckerInvokeArn: STATUS_CHECKER_INVOKE_ARN,
    });

    const synthesized = Testing.synth(stack);
    expect(synthesized).toContain('OPTIONS');
    expect(synthesized).toContain('Access-Control-Allow-Origin');
  });
});

