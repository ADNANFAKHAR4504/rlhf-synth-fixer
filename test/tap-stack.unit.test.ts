import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

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
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors via props
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors when no props are provided
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default awsRegion when not provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackNoRegion', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('us-east-1');
  });

  test('TapStack uses default stateBucketRegion when not provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackNoStateBucketRegion', {
      environmentSuffix: 'staging',
      awsRegion: 'eu-west-1',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default stateBucket when not provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackNoStateBucket', {
      environmentSuffix: 'dev',
      awsRegion: 'ap-southeast-1',
      stateBucketRegion: 'ap-southeast-1',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('iac-rlhf-tf-states');
  });

  test('TapStack with custom defaultTags', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithTags', {
      environmentSuffix: 'prod',
      awsRegion: 'us-east-1',
      defaultTags: [
        {
          tags: {
            Environment: 'production',
            Team: 'platform',
          },
        },
      ],
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('production');
    expect(synthesized).toContain('platform');
  });

  test('TapStack with empty defaultTags array', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackEmptyTags', {
      environmentSuffix: 'qa',
      defaultTags: [],
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with partial props (only environmentSuffix)', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackPartial', {
      environmentSuffix: 'integration',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack with all default values except environmentSuffix', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackMinimal', {
      environmentSuffix: 'minimal',
    });
    synthesized = Testing.synth(stack);

    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
    // Verify defaults are used
    expect(synthesized).toContain('us-east-1');
    expect(synthesized).toContain('iac-rlhf-tf-states');
  });
});

describe('Stack Components', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TapStack creates VPC infrastructure', () => {
    app = new App();
    stack = new TapStack(app, 'TestVpcStack', {
      environmentSuffix: 'vpc-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_vpc');
    expect(synthesized).toContain('VpcStack');
  });

  test('TapStack creates KMS encryption resources', () => {
    app = new App();
    stack = new TapStack(app, 'TestKmsStack', {
      environmentSuffix: 'kms-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_kms_key');
    expect(synthesized).toContain('KmsStack');
  });

  test('TapStack creates DynamoDB table', () => {
    app = new App();
    stack = new TapStack(app, 'TestDynamoStack', {
      environmentSuffix: 'dynamo-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_dynamodb_table');
    expect(synthesized).toContain('DynamodbStack');
  });

  test('TapStack creates SQS queue', () => {
    app = new App();
    stack = new TapStack(app, 'TestSqsStack', {
      environmentSuffix: 'sqs-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_sqs_queue');
    expect(synthesized).toContain('SqsStack');
  });

  test('TapStack creates SNS topic', () => {
    app = new App();
    stack = new TapStack(app, 'TestSnsStack', {
      environmentSuffix: 'sns-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_sns_topic');
    expect(synthesized).toContain('SnsStack');
  });

  test('TapStack creates IAM roles', () => {
    app = new App();
    stack = new TapStack(app, 'TestIamStack', {
      environmentSuffix: 'iam-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_iam_role');
    expect(synthesized).toContain('IamStack');
  });

  test('TapStack creates Lambda functions', () => {
    app = new App();
    stack = new TapStack(app, 'TestLambdaStack', {
      environmentSuffix: 'lambda-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_lambda_function');
    expect(synthesized).toContain('LambdaStack');
  });

  test('TapStack creates API Gateway', () => {
    app = new App();
    stack = new TapStack(app, 'TestApiGwStack', {
      environmentSuffix: 'apigw-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_api_gateway_rest_api');
    expect(synthesized).toContain('ApiGatewayStack');
  });

  test('TapStack creates CloudWatch resources', () => {
    app = new App();
    stack = new TapStack(app, 'TestCloudwatchStack', {
      environmentSuffix: 'cw-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('aws_cloudwatch_dashboard');
    expect(synthesized).toContain('CloudwatchStack');
  });

  test('TapStack creates all required outputs', () => {
    app = new App();
    stack = new TapStack(app, 'TestOutputsStack', {
      environmentSuffix: 'outputs-test',
    });
    synthesized = Testing.synth(stack);

    expect(synthesized).toContain('api_url');
    expect(synthesized).toContain('dynamodb_table_name');
    expect(synthesized).toContain('sqs_queue_url');
    expect(synthesized).toContain('sns_topic_arn');
  });
});

// add more test suites and cases as needed
