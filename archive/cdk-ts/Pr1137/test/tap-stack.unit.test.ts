/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-env jest */
import { describe, expect, test } from '@jest/globals';
import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  test('creates encrypted, versioned S3 bucket and Lambda with notifications (primary region)', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: Match.objectLike({}),
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Timeout: 300,
      Environment: Match.objectLike({
        Variables: Match.objectLike({ DEST_REGION: 'us-west-2' }),
      }),
    });
    // One Lambda permission (CDK reuses a single permission for multiple S3 notifications to same function)
    template.resourceCountIs('AWS::Lambda::Permission', 1);
  });

  test('peer region resolution flips when deployed to backup region', () => {
    const app = new cdk.App({
      context: { primaryRegion: 'us-east-1', backupRegion: 'us-west-2' },
    });
    const stack = new TapStack(app, 'TestTapStackWest', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-west-2' },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs18.x',
      Environment: Match.objectLike({
        Variables: Match.objectLike({ DEST_REGION: 'us-east-1' }),
      }),
    });
  });

  test('creates SSM parameter for local bucket name with expected path', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackParam', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: `/corp/tap/${environmentSuffix.toLowerCase()}/us-east-1/bucket-name`,
      Type: 'String',
    });
  });

  test('creates CloudWatch Dashboard with region and account in name', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackDash', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: `Corp-Replication-${environmentSuffix.toLowerCase()}-us-east-1-111111111111`,
    });
  });

  test('emits CloudFormation outputs for key resources', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TestTapStackOutputs', {
      environmentSuffix,
      env: { account: '111111111111', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);
    const json = template.toJSON();

    expect(json.Outputs.CorpBucketName.Export.Name).toBe(
      `Corp-BucketName-${environmentSuffix.toLowerCase()}-us-east-1`
    );
    expect(json.Outputs.CorpSyncFunctionArn.Export.Name).toBe(
      `Corp-SyncFunctionArn-${environmentSuffix.toLowerCase()}-us-east-1`
    );
    expect(json.Outputs.CorpDashboardUrl.Export.Name).toBe(
      `Corp-DashboardUrl-${environmentSuffix.toLowerCase()}-us-east-1`
    );
    expect(json.Outputs.CorpPeerRegion.Export.Name).toBe(
      `Corp-PeerRegion-${environmentSuffix.toLowerCase()}-us-east-1`
    );
  });
});
