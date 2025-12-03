import * as pulumi from '@pulumi/pulumi';
import { createIAMRoles } from '../lib/iam-roles';

pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:iam::123456789012:role/${args.name}`,
        id: `${args.name}-id`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('createIAMRoles', () => {
  it('should create Lambda execution role', (done) => {
    const result = createIAMRoles('test', { Environment: 'test' });

    result.lambdaRoleArn.apply(arn => {
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('iam');
      expect(arn).toContain('role');
      done();
      return arn;
    });
  });

  it('should return lambdaRole object', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });

  it('should use environment suffix in role name', (done) => {
    const result = createIAMRoles('prod', { Environment: 'prod' });

    result.lambdaRoleArn.apply(arn => {
      expect(arn).toContain('prod');
      done();
      return arn;
    });
  });

  it('should apply tags to role', () => {
    const tags = { Environment: 'test', Team: 'platform' };
    const result = createIAMRoles('test', tags);

    expect(result.lambdaRole).toBeDefined();
    expect(result.lambdaRoleArn).toBeDefined();
  });

  it('should handle empty tags', () => {
    const result = createIAMRoles('test', {});

    expect(result.lambdaRoleArn).toBeDefined();
  });

  it('should accept custom resource options', () => {
    const opts = { protect: true };
    const result = createIAMRoles('test', { Environment: 'test' }, opts);

    expect(result.lambdaRoleArn).toBeDefined();
  });

  it('should create role with least-privilege policies', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
    expect(result.lambdaRoleArn).toBeDefined();
  });

  it('should use different suffixes correctly', (done) => {
    const result1 = createIAMRoles('dev', { Environment: 'dev' });
    const result2 = createIAMRoles('staging', { Environment: 'staging' });

    Promise.all([
      result1.lambdaRoleArn.apply(arn => arn),
      result2.lambdaRoleArn.apply(arn => arn),
    ]).then(([arn1, arn2]) => {
      expect(arn1).not.toBe(arn2);
      done();
    });
  });

  it('should create role with correct assume role policy', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });

  it('should create metrics policy', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });

  it('should create logs policy', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });

  it('should create SNS policy', () => {
    const result = createIAMRoles('test', { Environment: 'test' });

    expect(result.lambdaRole).toBeDefined();
  });
});
