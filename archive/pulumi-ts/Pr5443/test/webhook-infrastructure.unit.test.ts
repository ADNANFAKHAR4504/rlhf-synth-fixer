import * as pulumi from '@pulumi/pulumi';
type RecordedResource = pulumi.runtime.MockResourceArgs & { state: any };
const recordedResources: RecordedResource[] = [];

pulumi.runtime.setMocks(
  {
    newResource: async args => {
      const state = {
        ...args.inputs,
        id: `${args.name}-id`,
        arn: `arn:mock:${args.type}:${args.name}`,
        name: args.inputs?.name ?? args.name,
      };
      recordedResources.push({ ...args, state });
      return {
        id: `${args.name}-id`,
        state,
      };
    },
    call: async args => {
      if (args.token === 'aws:index/getRegion:getRegion') {
        return { name: 'eu-west-1' };
      }
      return args.inputs;
    },
  },
  'tap-project',
  'tap-test'
);

const resolve = async <T>(value: pulumi.Input<T> | T) =>
  pulumi.output(value).promise();

const deployStack = async (
  name: string,
  args: Record<string, any> = {}
) => {
  recordedResources.length = 0;
  const { TapStack } = require('../lib/tap-stack');

  const outputs: Record<string, any> = {};

  await pulumi.runtime.runInPulumiStack(async () => {
    const stack = new TapStack(name, args);
    outputs.apiUrl = await resolve(stack.apiUrl);
    outputs.dynamoTableName = await resolve(stack.dynamoTableName);
    outputs.lambdaFunctionName = await resolve(stack.lambdaFunctionName);
    outputs.snsTopicArn = await resolve(stack.snsTopicArn);
    outputs.dlqUrl = await resolve(stack.dlqUrl);
  });

  const resourcesSnapshot = [...recordedResources];
  recordedResources.length = 0;
  return { outputs, resources: resourcesSnapshot };
};

describe('TapStack outputs', () => {
  it('exposes environment-specific resource identifiers', async () => {
    const { outputs } = await deployStack('outputs-test', {
      environmentSuffix: 'test',
      awsRegion: 'eu-west-1',
      tags: { Owner: 'qa' },
      alertEmail: 'alerts@example.com',
    });

    expect(outputs.dynamoTableName).toContain('webhook-events-test');
    expect(outputs.lambdaFunctionName).toContain('webhook-processor-test');
    expect(outputs.dlqUrl).toContain('webhook-dlq-test');
  });

  it('provides an API URL for the deployed stage', async () => {
    const { outputs } = await deployStack('api-url-test', {
      environmentSuffix: 'test',
      awsRegion: 'eu-west-1',
      alertEmail: 'alerts@example.com',
    });

    expect(outputs.apiUrl).toContain('https://');
    expect(outputs.apiUrl).toContain('/prod');
  });

  it('exports the failure notification topic ARN', async () => {
    const { outputs } = await deployStack('sns-topic-test', {
      environmentSuffix: 'test',
      awsRegion: 'eu-west-1',
      alertEmail: 'alerts@example.com',
    });

    expect(outputs.snsTopicArn).toContain('webhook-failures-test');
  });

  it('creates resources with expected names', async () => {
    const { resources } = await deployStack('resource-names-test', {
      environmentSuffix: 'test',
      awsRegion: 'eu-west-1',
      alertEmail: 'alerts@example.com',
    });

    const resourceNames = resources.map(resource => resource.name);
    expect(resourceNames).toEqual(
      expect.arrayContaining([
        'webhook-events-test',
        'webhook-dlq-test',
        'webhook-failures-test',
        'webhook-processor-test',
        'webhook-api-test',
      ])
    );
  });
});

describe('TapStack configuration fallbacks', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('derives AWS region from environment variable when args omit it', async () => {
    process.env.AWS_REGION = 'us-east-1';
    const { outputs } = await deployStack('region-env-test', {
      environmentSuffix: 'env',
      alertEmail: 'alerts@example.com',
    });

    expect(outputs.apiUrl).toContain('.us-east-1.amazonaws.com/');
  });

  it('honors additional tags while preserving defaults', async () => {
    const { resources } = await deployStack('tags-test', {
      environmentSuffix: 'tags',
      awsRegion: 'eu-west-1',
      tags: { Owner: 'qa', Project: 'tap' },
      alertEmail: 'alerts@example.com',
    });

    const table = resources.find(
      resource => resource.type === 'aws:dynamodb/table:Table'
    );
    expect(table?.inputs.tags).toMatchObject({
      Environment: 'tags',
      Application: 'webhook-processor',
      Owner: 'qa',
      Project: 'tap',
    });
  });

  it('falls back to environment-provided alert email when present', async () => {
    process.env.WEBHOOK_ALERT_EMAIL = 'alerts+prod@example.com';
    const { resources } = await deployStack('alert-env-test', {
      environmentSuffix: 'email',
      awsRegion: 'eu-west-1',
    });

    const subscription = resources.find(
      resource => resource.type === 'aws:sns/topicSubscription:TopicSubscription'
    );

    expect(subscription?.inputs.endpoint).toBe('alerts+prod@example.com');
  });

  it('uses default alert email when env variable is blank', async () => {
    process.env.WEBHOOK_ALERT_EMAIL = '   ';
    const { resources } = await deployStack('alert-default-test', {
      environmentSuffix: 'email',
      awsRegion: 'eu-west-1',
    });

    const subscription = resources.find(
      resource => resource.type === 'aws:sns/topicSubscription:TopicSubscription'
    );

    expect(subscription?.inputs.endpoint).toBe('alerts@example.com');
  });

  it('ignores non-object tags input and retains system defaults', async () => {
    const { resources } = await deployStack('invalid-tags-test', {
      environmentSuffix: 'invalid',
      awsRegion: 'eu-west-1',
      tags: 'not-an-object',
      alertEmail: 'alerts@example.com',
    });

    const queue = resources.find(
      resource => resource.type === 'aws:sqs/queue:Queue'
    );

    expect(queue?.inputs.tags).toMatchObject({
      Environment: 'invalid',
      Application: 'webhook-processor',
    });
    expect(queue?.inputs.tags.Owner).toBeUndefined();
  });

  it('falls back to default environment suffix and region when nothing supplied', async () => {
    delete process.env.AWS_REGION;
    const { outputs } = await deployStack('defaults-test', {
      alertEmail: 'alerts@example.com',
    });

    expect(outputs.apiUrl).toContain('.eu-west-1.amazonaws.com/');
    expect(outputs.apiUrl).toContain('/prod');
  });
});
