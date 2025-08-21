import * as cdk from 'aws-cdk-lib';
jest.mock('../lib/stacks/iam-stack');
jest.mock('../lib/stacks/kms-stack');
jest.mock('../lib/stacks/mfa-scp-stack');
jest.mock('../lib/stacks/rds-stack');
jest.mock('../lib/stacks/s3-stack');
jest.mock('../lib/stacks/vpc-stack');

import { IamStack } from '../lib/stacks/iam-stack';
import { KmsStack } from '../lib/stacks/kms-stack';
import { MfaEnforcementScpStack } from '../lib/stacks/mfa-scp-stack';
import { RdsStack } from '../lib/stacks/rds-stack';
import { S3Stack } from '../lib/stacks/s3-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';

describe('tap.ts', () => {
  let app: cdk.App;
  beforeEach(() => {
    app = new cdk.App();
    jest.clearAllMocks();
  });

  it('provisions all stacks for each region', () => {
    const regions = ['us-east-2', 'us-west-2'];
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    app.node.setContext('dept', 'eng');
    app.node.setContext('environmentSuffix', 'int');
    app.node.setContext('purpose', 'integration');
    app.node.setContext('enableOrgScp', false);
    app.node.setContext('orgTargetId', undefined);
    require('../bin/tap').main(app);
    regions.forEach(region => {
      expect(KmsStack).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(`kms-${region}`),
        expect.objectContaining({ env: expect.objectContaining({ region }) })
      );
      expect(S3Stack).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(`s3-${region}`),
        expect.objectContaining({ env: expect.objectContaining({ region }) })
      );
      expect(VpcStack).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(`vpc-${region}`),
        expect.objectContaining({ env: expect.objectContaining({ region }) })
      );
      expect(RdsStack).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(`rds-${region}`),
        expect.objectContaining({ env: expect.objectContaining({ region }) })
      );
      expect(IamStack).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining(`iam-${region}`),
        expect.objectContaining({ env: expect.objectContaining({ region }) })
      );
    });
  });

  it('provisions MfaEnforcementScpStack only if enabled and orgTargetId is set', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    const mockApp = new cdk.App();
    mockApp.node.setContext('dept', 'eng');
    mockApp.node.setContext('environmentSuffix', 'int');
    mockApp.node.setContext('purpose', 'integration');
    mockApp.node.setContext('enableOrgScp', true);
    mockApp.node.setContext('orgTargetId', 'ou-9999');
    jest.resetModules();
    jest.clearAllMocks();
    const { main } = require('../bin/tap');
    const { MfaEnforcementScpStack } = require('../lib/stacks/mfa-scp-stack');
    main(mockApp);
    expect(MfaEnforcementScpStack).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('mfa-scp'),
      expect.objectContaining({ orgTargetId: 'ou-9999' })
    );
  });

  it('does not provision MfaEnforcementScpStack if not enabled', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
    app.node.setContext('dept', 'eng');
    app.node.setContext('environmentSuffix', 'int');
    app.node.setContext('purpose', 'integration');
    app.node.setContext('enableOrgScp', false);
    app.node.setContext('orgTargetId', 'ou-9999');
    require('../bin/tap');
    expect(MfaEnforcementScpStack).not.toHaveBeenCalled();
  });
});
