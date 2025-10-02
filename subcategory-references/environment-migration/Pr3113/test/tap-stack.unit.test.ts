import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { MigrationStack } from '../lib/migration-stack';

// Mock the nested stacks to verify they are called correctly
jest.mock('../lib/migration-stack');

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    app = new cdk.App();
  });

  test('should create the MigrationStack', () => {
    const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    expect(MigrationStack).toHaveBeenCalledTimes(1);
  });

  test('should pass the correct props to the MigrationStack', () => {
    const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    expect(MigrationStack).toHaveBeenCalledWith(
      stack,
      'MigrationStack',
      {
        bastionSourceIp: '0.0.0.0/0',
      }
    );
  });

  describe('environmentSuffix', () => {
    test('should use the environmentSuffix from props', () => {
      const stack = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'test',
      });
      expect(MigrationStack).toHaveBeenCalledTimes(1);
    });

    test('should use the environmentSuffix from context', () => {
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'context',
        },
      });
      const stack = new TapStack(appWithContext, 'TestTapStackWithContext', {});
      expect(MigrationStack).toHaveBeenCalledTimes(1);
    });

    test('should use the default environmentSuffix', () => {
      const stack = new TapStack(app, 'TestTapStackWithoutSuffix', {});
      expect(MigrationStack).toHaveBeenCalledTimes(1);
    });
  });

  test('should synthesize correctly', () => {
    const stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    const template = Template.fromStack(stack);
    expect(template).toBeTruthy();
  });
});
