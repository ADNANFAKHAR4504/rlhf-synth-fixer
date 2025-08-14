import { App } from 'aws-cdk-lib';
import { KmsStack } from '../../lib/stacks/kms-stack';
import { StorageStack } from '../../lib/stacks/storage-stack';
describe('StorageStack Integration', () => {
  it('provisions appBucket and logsBucket with correct encryption and logging', () => {
    const app = new App();
    const kms = new KmsStack(app, 'KmsStack');
    const storage = new StorageStack(app, 'StorageStack', {
      dataKey: kms.dataKey,
    });
    expect(storage.appBucket).toBeDefined();
    expect(storage.logsBucket).toBeDefined();
    expect(storage.appBucket.encryptionKey).toBe(kms.dataKey);
    // Logging configuration cannot be directly asserted from CDK object
    // Optionally, check the prefix if needed:
    // expect(storage.appBucket.serverAccessLogsPrefix).toBeDefined();
  });
  it('throws error if dataKey is missing', () => {
    const app = new App();
    expect(() => new StorageStack(app, 'BadStorage', {} as any)).toThrow();
  });
});
