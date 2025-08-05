import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import 'cdktf/lib/testing/adapters/jest';


// Mock the modules since we're testing the stack that uses them
// This prevents the tests from failing due to missing files (like 'lambda1.zip')
// and allows us to test the stack's logic in isolation.
jest.mock('../lib/modules', () => {
  return {
    LambdaModule: jest.fn(() => ({
      lambdaFunction: {
        functionName: 'mock-function',
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function',
        version: '1',
      },
      lambdaAlias: {
        arn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function:live',
        functionName: 'mock-function',
      },
    })),
    ApiGatewayModule: jest.fn(() => ({
      api: {
        apiEndpoint: 'https://mock-api.execute-api.us-east-1.amazonaws.com',
        executionArn:
          'arn:aws:execute-api:us-east-1:123456789012:mock-api-id',
      },
      stage: {
        name: 'v1',
      },
      addRoute: jest.fn(),
    })),
    CanaryDeploymentModule: jest.fn(() => ({
      application: {
        name: 'mock-app',
      },
    })),
    createCommonTags: jest.fn(() => ({
      Environment: 'test',
      Project: 'ServerlessMicroservices',
      Cloud: 'AWS',
    })),
  };
});

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('TapStack instantiates successfully via props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
      defaultTags: {
        tags: {
          Environment: 'prod',
          Repository: 'test-repo',
          CommitAuthor: 'test-author',
        },
      },
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors via props
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toMatchSnapshot();
  });

  test('TapStack uses default values when no props provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors when no props are provided
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toMatchSnapshot();
  });
});

describe('Module Instantiation and Integration', () => {
  let app: App;
  let stack: TapStack;
  let synth: any;

  beforeEach(() => {
    // Reset mocks for each test to get a clean count
    jest.clearAllMocks();
    app = Testing.app();
    stack = new TapStack(app, 'TestTapStack');
    synth = Testing.fullSynth(stack);
  });

  test('creates two LambdaModule instances with correct configurations', () => {
    const mockLambdaModule = require('../lib/modules').LambdaModule;
    expect(mockLambdaModule).toHaveBeenCalledTimes(2);

    expect(mockLambdaModule).toHaveBeenCalledWith(
      expect.anything(),
      'lambda-1',
      expect.objectContaining({
        functionName: 'serverless-function-1',
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        // Update the filename here to match the new path
      })
    );

    expect(mockLambdaModule).toHaveBeenCalledWith(
      expect.anything(),
      'lambda-2',
      expect.objectContaining({
        functionName: 'serverless-function-2',
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        // Update the filename here to match the new path
      })
    );
  });

  test('creates one ApiGatewayModule instance with correct configuration', () => {
    const mockApiGatewayModule = require('../lib/modules').ApiGatewayModule;
    expect(mockApiGatewayModule).toHaveBeenCalledTimes(1);

    expect(mockApiGatewayModule).toHaveBeenCalledWith(
      expect.anything(),
      'api-gateway',
      expect.objectContaining({
        apiName: 'serverless-microservices-api',
        stageName: 'v1',
      })
    );
  });

  test('configures API Gateway with routes for both Lambdas', () => {
    const mockApiGatewayModule = require('../lib/modules').ApiGatewayModule;
    const mockApiGatewayInstance = mockApiGatewayModule.mock.results[0].value;

    expect(mockApiGatewayInstance.addRoute).toHaveBeenCalledTimes(2);

    expect(mockApiGatewayInstance.addRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        routeKey: 'GET /v1/function1',
      })
    );

    expect(mockApiGatewayInstance.addRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        routeKey: 'GET /v1/function2',
      })
    );
  });

  test('creates two CanaryDeploymentModule instances with correct configurations', () => {
    const mockCanaryDeploymentModule = require('../lib/modules').CanaryDeploymentModule;
    expect(mockCanaryDeploymentModule).toHaveBeenCalledTimes(2);

    expect(mockCanaryDeploymentModule).toHaveBeenCalledWith(
      expect.anything(),
      'canary-1',
      expect.objectContaining({
        applicationName: 'serverless-function-1-app',
      })
    );

    expect(mockCanaryDeploymentModule).toHaveBeenCalledWith(
      expect.anything(),
      'canary-2',
      expect.objectContaining({
        applicationName: 'serverless-function-2-app',
      })
    );
  });
});