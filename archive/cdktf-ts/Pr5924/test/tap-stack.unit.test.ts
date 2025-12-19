import { App } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

jest.mock('@cdktf/provider-aws/lib/s3-bucket', () => ({
  S3Bucket: jest.fn().mockImplementation((scope, id, config) => ({
    bucket: config.bucket,
    tags: config.tags,
  })),
}));

jest.mock('cdktf', () => {
  const actual = jest.requireActual('cdktf');
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
    TerraformStack: actual.TerraformStack,
  };
});

jest.mock('@cdktf/provider-aws/lib/provider', () => ({
  AwsProvider: jest.fn(),
}));

describe('TapStack Unit Tests', () => {
  const { TerraformOutput, S3Backend } = require('cdktf');
  const { AwsProvider } = require('@cdktf/provider-aws/lib/provider');
  const { S3Bucket } = require('@cdktf/provider-aws/lib/s3-bucket');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create TapStack with default configuration', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack');
    expect(stack).toBeDefined();
  });

  test('should configure AWS Provider with default region', () => {
    const app = new App();
    new TapStack(app, 'TestStack');
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({ region: 'us-east-1' })
    );
  });

  test('should create S3 bucket', () => {
    const app = new App();
    new TapStack(app, 'TestStack');
    expect(S3Bucket).toHaveBeenCalled();
  });

  test('should create terraform outputs', () => {
    const app = new App();
    new TapStack(app, 'TestStack');
    expect(TerraformOutput).toHaveBeenCalled();
  });

  test('should use custom AWS region when provided', () => {
    const app = new App();
    new TapStack(app, 'TestStack', { awsRegion: 'eu-west-1' });
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({ region: 'eu-west-1' })
    );
  });

  test('should use custom environment suffix', () => {
    const app = new App();
    new TapStack(app, 'TestStack', { environmentSuffix: 'prod' });
    expect(S3Bucket).toHaveBeenCalledWith(
      expect.anything(),
      'example-bucket',
      expect.objectContaining({ bucket: 'tap-project-prod-example' })
    );
  });

  test('should configure S3 backend with custom bucket', () => {
    const app = new App();
    new TapStack(app, 'TestStack', {
      stateBucket: 'custom-bucket',
      stateBucketRegion: 'us-west-2',
    });
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'custom-bucket',
        region: 'us-west-2',
      })
    );
  });

  test('should apply custom default tags', () => {
    const app = new App();
    const customTags = { tags: { Environment: 'test', Project: 'demo' } };
    new TapStack(app, 'TestStack', { defaultTags: customTags });
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({ defaultTags: [customTags] })
    );
  });
});
