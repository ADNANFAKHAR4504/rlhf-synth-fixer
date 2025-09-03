import { App } from 'aws-cdk-lib';
import { KmsStack } from '../../lib/stacks/kms-stack';
describe('KmsStack Integration', () => {
  it('provisions a KMS key and can be used by other stacks', () => {
    const app = new App();
    const kms = new KmsStack(app, 'KmsStack');
    expect(kms.dataKey).toBeDefined();
  });
});
