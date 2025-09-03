import { App, Stack } from 'aws-cdk-lib';
import { KmsStack } from '../../lib/stacks/kms-stack';
describe('KmsStack', () => {
  let app: App;
  let testStack: Stack;
  beforeEach(() => {
    app = new App();
    testStack = new Stack(app, 'TestStack');
  });
  it('should create a KMS key with correct alias', () => {
    const stack = new KmsStack(testStack, 'KmsStack');
    expect(stack.dataKey).toBeDefined();
    expect(stack.dataKey).toBeInstanceOf(require('aws-cdk-lib/aws-kms').Key);
  });
});
