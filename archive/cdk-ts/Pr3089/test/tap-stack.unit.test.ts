import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

jest.mock('../lib/app-stack');

import { AppStack } from '../lib/app-stack';

const mockAppStack = AppStack as jest.MockedClass<typeof AppStack>;

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
  });

  describe('with environmentSuffix', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test'
      });
      template = Template.fromStack(stack);
    });

    test('creates AppStack with correct props', () => {
      expect(mockAppStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessApp',
        expect.objectContaining({
          environment: 'test'
        })
      );
    });

    test('is instance of cdk.Stack', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('has correct stack id', () => {
      expect(stack.node.id).toBe('TestTapStack');
    });
  });

  describe('with different environment suffixes', () => {
    test('handles dev environment', () => {
      stack = new TapStack(app, 'DevTapStack', {
        environmentSuffix: 'dev'
      });

      expect(mockAppStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessApp',
        expect.objectContaining({
          environment: 'dev'
        })
      );
    });

    test('handles prod environment', () => {
      stack = new TapStack(app, 'ProdTapStack', {
        environmentSuffix: 'prod'
      });

      expect(mockAppStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessApp',
        expect.objectContaining({
          environment: 'prod'
        })
      );
    });

    test('handles custom environment suffix', () => {
      stack = new TapStack(app, 'CustomTapStack', {
        environmentSuffix: 'staging'
      });

      expect(mockAppStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessApp',
        expect.objectContaining({
          environment: 'staging'
        })
      );
    });
  });

  describe('stack properties', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test'
      });
    });

    test('extends cdk.Stack', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('creates nested AppStack', () => {
      expect(mockAppStack).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    test('handles missing environmentSuffix gracefully', () => {
      expect(() => {
        new TapStack(app, 'TestTapStack', {
          environmentSuffix: ''
        });
      }).not.toThrow();
    });
  });
});
