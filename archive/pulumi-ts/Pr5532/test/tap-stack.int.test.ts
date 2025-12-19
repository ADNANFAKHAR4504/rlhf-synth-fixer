import * as pulumi from '@pulumi/pulumi';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

type RecordedResource = {
  type: string;
  name: string;
  inputs: Record<string, any>;
  state: Record<string, any>;
};

const createdResources: RecordedResource[] = [];

const resetResources = () => {
  createdResources.length = 0;
};

const resolveValue = async <T>(value: pulumi.Input<T> | T): Promise<T> => {
  return pulumi.output(value).promise();
};

pulumi.runtime.setMocks({
  newResource: args => {
    const state = {
      ...args.inputs,
      name: args.inputs?.name ?? args.name,
      arn: args.inputs?.arn ?? `${args.name}-arn`,
      id: args.inputs?.id ?? `${args.name}-id`,
    };

    createdResources.push({
      type: args.type,
      name: args.name,
      inputs: args.inputs,
      state,
    });

    return {
      id: `${args.name}_id`,
      state,
    };
  },
  call: args => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '342597974367',
        arn: 'arn:aws:iam::342597974367:user/integration-test',
        userId: 'AIDAI00000000000000',
      };
    }
    return args.inputs;
  },
});

const suppressPulumiWarnings = () => {
  const patterns = [
    'BucketVersioningV2 is deprecated',
    'BucketServerSideEncryptionConfigurationV2 is deprecated',
    'BucketLifecycleConfigurationV2 is deprecated',
  ];

  const isPulumiDeprecation = (message: unknown) =>
    typeof message === 'string' && patterns.some(pattern => message.includes(pattern));

  let warnSpy: jest.SpyInstance | undefined;

  beforeAll(() => {
    const originalWarn = console.warn;

    warnSpy = jest.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (args.length > 0 && isPulumiDeprecation(args[0])) {
        return;
      }
      originalWarn(...(args as [unknown, ...unknown[]]));
    });
  });

  afterAll(() => {
    warnSpy?.mockRestore();
  });
};

const deployStack = async (overrides: Partial<TapStackArgs> = {}) => {
  resetResources();

  return pulumi.runtime.runInPulumiStack(async () => {
    const stack = new TapStack('tap', {
      environmentSuffix: 'staging',
      tags: { Owner: 'Analytics', CostCenter: 'Finance' },
      ...overrides,
    });

    const [bucketName, logGroupName, kmsKeyArn, analystRoleArn] = await Promise.all([
      resolveValue(stack.bucketName),
      resolveValue(stack.logGroupName),
      resolveValue(stack.kmsKeyArn),
      resolveValue(stack.dataAnalystRoleArn),
    ]);

    return {
      bucketName,
      logGroupName,
      kmsKeyArn,
      analystRoleArn,
    };
  });
};

describe('TapStack Integration', () => {
  suppressPulumiWarnings();

  it('provisions core resources with staging suffix', async () => {
    const { bucketName, logGroupName, kmsKeyArn } = await deployStack();

    expect(bucketName).toContain('datalake-bucket-staging');
    expect(logGroupName).toBe('/aws/s3/datalake-staging');
    expect(kmsKeyArn).toContain('datalake-kms-key-staging');

    const bucketResource = createdResources.find(r => r.type === 'aws:s3/bucket:Bucket');
    expect(bucketResource?.inputs?.bucket).toBe('financial-datalake-staging');
  });

  it('creates the three IAM personas with scoped assume role policies', async () => {
    await deployStack();

    const roleResources = createdResources.filter(r => r.type === 'aws:iam/role:Role');
    const roleNames = roleResources.map(r => r.inputs.name);

    expect(roleNames).toEqual(
      expect.arrayContaining([
        'DataAnalyst-staging',
        'DataEngineer-staging',
        'DataAdmin-staging',
      ])
    );

    for (const role of roleResources) {
      const policy = await resolveValue<string>(role.inputs.assumeRolePolicy);
      expect(policy).toContain('arn:aws:iam::342597974367:root');
    }
  });

  it('enforces encryption and lifecycle controls on the bucket', async () => {
    await deployStack();

    const encryption = createdResources.find(
      r => r.type === 'aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2'
    );
    const lifecycle = createdResources.find(
      r => r.type === 'aws:s3/bucketLifecycleConfigurationV2:BucketLifecycleConfigurationV2'
    );
    const versioning = createdResources.find(
      r => r.type === 'aws:s3/bucketVersioningV2:BucketVersioningV2'
    );

    expect(encryption?.inputs?.rules).toBeDefined();
    expect(versioning?.inputs?.versioningConfiguration?.status).toBe('Enabled');

    const lifecycleRules = lifecycle?.inputs?.rules || [];
    const ruleIds = lifecycleRules.map((rule: { id?: string }) => rule.id);
    expect(ruleIds).toEqual(expect.arrayContaining(['glacier-transition', 'abort-incomplete-multipart-uploads']));
  });

  it('applies restrictive bucket access policies', async () => {
    await deployStack();

    const bucketPolicy = createdResources.find(r => r.type === 'aws:s3/bucketPolicy:BucketPolicy');
    expect(bucketPolicy).toBeDefined();

    const rawPolicy = bucketPolicy?.inputs?.policy;
    const policyDocument = rawPolicy ? JSON.parse(await resolveValue<string>(rawPolicy)) : null;
    expect(policyDocument).not.toBeNull();

    const denyHttps = policyDocument.Statement.find((s: { Sid?: string }) => s.Sid === 'DenyInsecureTransport');
    const denyUnencrypted = policyDocument.Statement.find((s: { Sid?: string }) => s.Sid === 'DenyUnencryptedObjectUploads');

    expect(denyHttps).toBeDefined();
    expect(denyHttps.Condition.Bool['aws:SecureTransport']).toBe('false');
    expect(denyUnencrypted).toBeDefined();
    expect(denyUnencrypted.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
  });

  it('allows overriding tags and environment suffix for alternate deployments', async () => {
    const { bucketName, logGroupName, analystRoleArn } = await deployStack({
      environmentSuffix: 'prod',
      tags: { Owner: 'ProdAnalytics' },
    });

    expect(bucketName).toContain('datalake-bucket-prod');
    expect(logGroupName).toBe('/aws/s3/datalake-prod');
    expect(analystRoleArn).toContain('data-analyst-role-prod');

    const bucketResource = createdResources.find(r => r.type === 'aws:s3/bucket:Bucket');
    expect(bucketResource?.inputs?.bucket).toBe('financial-datalake-prod');

    const taggedResources = createdResources.filter(r => r.inputs.tags);
    await Promise.all(
      taggedResources.map(async resource => {
        const tags = await resolveValue<Record<string, string>>(resource.inputs.tags);
        expect(tags.Owner).toBe('ProdAnalytics');
        expect(tags.Environment).toBe('prod');
      })
    );
  });
});
