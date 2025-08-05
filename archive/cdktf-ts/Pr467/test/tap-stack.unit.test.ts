import { AwsProviderDefaultTags } from '@cdktf/provider-aws/lib/provider';
import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  const baseProps = {
    environmentSuffix: 'testenv',
    stateBucket: 'test-bucket',
    stateBucketRegion: 'us-west-2',
    awsRegion: 'us-west-2',
    defaultTags: {
      tags: { Project: 'unit-test', Owner: 'QA' },
    } as AwsProviderDefaultTags,
  };

  it('should synthesize with correct S3 backend and lockfile config', () => {
    const app = new App();
    const stack = new TapStack(app, 'TapStackTest', baseProps);
    const synth = Testing.synth(stack);
    // S3 backend config
    expect(JSON.stringify(synth)).toContain('test-bucket');
    expect(JSON.stringify(synth)).toContain('testenv/TapStackTest.tfstate');
    expect(JSON.stringify(synth)).toContain('use_lockfile');
  });

  it('should use default values if props are not provided', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TapStackDefault');
    const synth = Testing.synth(stack);
    expect(JSON.stringify(synth)).toContain('iac-rlhf-tf-states');
    expect(JSON.stringify(synth)).toContain('dev/TapStackDefault.tfstate');
    expect(JSON.stringify(synth)).toContain('us-east-1');
  });

  it('should instantiate ServerlessCms for each region in AWS_REGION_OVERRIDE', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TapStackMultiRegion', baseProps);
    const synth = Testing.synth(stack);
    // Should create ServerlessCms for all regions
    ['us-east-1', 'us-west-2', 'eu-central-1'].forEach(region => {
      expect(JSON.stringify(synth)).toContain(`serverless-cms-${region}`);
      expect(JSON.stringify(synth)).toContain(
        `region_${region.replace(/-/g, '_')}`
      );
      expect(JSON.stringify(synth)).toContain(region);
    });
  });

  it('should apply defaultTags to all providers', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'TapStackTags', baseProps);
    const synth = Testing.synth(stack);
    expect(JSON.stringify(synth)).toContain('unit-test');
    expect(JSON.stringify(synth)).toContain('Owner');
  });
});
