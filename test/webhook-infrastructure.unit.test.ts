import * as pulumi from '@pulumi/pulumi';
import type { Output } from '@pulumi/pulumi';

type RecordedResource = pulumi.runtime.MockResourceArgs & {
  state: any;
};

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

const resolve = async <T>(output: Output<T>) => output.promise();

describe('TapStack outputs', () => {
  let stackOutputs: {
    apiUrl: string;
    dynamoTableName: string;
    lambdaFunctionName: string;
    snsTopicArn: string;
    dlqUrl: string;
  };

  beforeAll(async () => {
    const { TapStack } = require('../lib/tap-stack');
    await pulumi.runtime.runInPulumiStack(async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        awsRegion: 'eu-west-1',
        tags: { Owner: 'qa' },
        alertEmail: 'alerts@example.com',
      });

      stackOutputs = {
        apiUrl: await resolve(stack.apiUrl),
        dynamoTableName: await resolve(stack.dynamoTableName),
        lambdaFunctionName: await resolve(stack.lambdaFunctionName),
        snsTopicArn: await resolve(stack.snsTopicArn),
        dlqUrl: await resolve(stack.dlqUrl),
      };
    });
  });

  it('exposes environment-specific resource identifiers', () => {
    expect(stackOutputs.dynamoTableName).toContain('webhook-events-test');
    expect(stackOutputs.lambdaFunctionName).toContain('webhook-processor-test');
    expect(stackOutputs.dlqUrl).toContain('webhook-dlq-test');
  });

  it('provides an API URL for the deployed stage', () => {
    expect(stackOutputs.apiUrl).toContain('https://');
    expect(stackOutputs.apiUrl).toContain('/test');
  });

  it('exports the failure notification topic ARN', () => {
    expect(stackOutputs.snsTopicArn).toContain('webhook-failures-test');
  });

  it('creates resources with expected names', () => {
    const resourceNames = recordedResources.map(resource => resource.name);
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
