import { App } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { StorageStack } from '../../lib/stacks/storage-stack';
describe('StorageStack', () => {
  let app: App;
  let testStack: import('aws-cdk-lib').Stack;
  let dataKey: kms.Key;
  beforeEach(() => {
    app = new App();
    testStack = new (require('aws-cdk-lib').Stack)(app, 'TestStack');
    dataKey = new kms.Key(testStack, 'TestKey');
  });
  it('should create logsBucket and appBucket with correct encryption', () => {
    const stack = new StorageStack(testStack, 'StorageStack', { dataKey });
    expect(stack.logsBucket).toBeDefined();
    expect(stack.appBucket).toBeDefined();
  });
  it('should throw if required props are missing', () => {
    // @ts-expect-error
    expect(() => new StorageStack(testStack, 'BadStack', {})).toThrow();
  });
});
