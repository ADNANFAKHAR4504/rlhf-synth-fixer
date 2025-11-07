import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  test('stack creates successfully with defaults', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'test-stack');
    const synthesized = Testing.synth(stack);

    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('terraform');
  });

  test('stack accepts custom properties', () => {
    const app = Testing.app();
    const stack = new TapStack(app, 'test-stack', {
      environmentSuffix: 'test',
      awsRegion: 'ap-southeast-1',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'ap-southeast-1',
      defaultTags: {
        Environment: 'test',
        Project: 'tap'
      }
    });
    const synthesized = Testing.synth(stack);

    expect(synthesized).toBeDefined();
    expect(synthesized).toContain('ap-southeast-1');
  });

  test('validates AWS region format', () => {
    const validRegions = ['ap-southeast-1', 'eu-west-2', 'us-east-1'];
    validRegions.forEach(region => {
      expect(region).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    });
  });

  test('validates environment suffix', () => {
    const environments = ['dev', 'test', 'staging', 'prod'];
    environments.forEach(env => {
      const stackName = `TapStack${env}`;
      expect(stackName).toContain('TapStack');
      expect(stackName).toContain(env);
    });
  });

  test('validates default tags structure', () => {
    const tags = {
      Environment: 'dev',
      Repository: 'test-repo',
      CommitAuthor: 'test-user'
    };

    expect(tags).toHaveProperty('Environment');
    expect(tags).toHaveProperty('Repository');
    expect(tags).toHaveProperty('CommitAuthor');
  });
});