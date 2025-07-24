import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe.only('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => { });
  });

  /**
   *   console.warn
    [WARNING] aws-cdk-lib.aws_ecs.CfnTaskDefinitionProps#inferenceAccelerators is deprecated.
      this property has been deprecated
      This API will be removed in the next major release.
   */


  beforeEach(() => {

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('should create a TapStack instance', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack).toBeDefined()
    });
  });
});
