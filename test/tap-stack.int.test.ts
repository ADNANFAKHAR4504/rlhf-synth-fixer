import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

type RecordedResource = {
  type: string;
  name: string;
  inputs: Record<string, any>;
};

const createdResources: RecordedResource[] = [];

const resetResources = () => {
  createdResources.length = 0;
};

pulumi.runtime.setMocks({
  newResource: args => {
    createdResources.push({
      type: args.type,
      name: args.name,
      inputs: args.inputs,
    });

    const state = {
      ...args.inputs,
      name: args.inputs?.name ?? args.name,
      arn: args.inputs?.arn ?? `${args.name}-arn`,
      id: args.inputs?.id ?? `${args.name}-id`,
    };

    return {
      id: `${args.name}_id`,
      state,
    };
  },
  call: () => ({}),
});

describe('Turn Around Prompt API Integration Tests', () => {
  beforeEach(() => {
    resetResources();
  });

  it('provisions the payment processing stack with coherent resource wiring', async () => {
    await pulumi.runtime.runInPulumiStack(async () => {
      const stack = new TapStack('tap', {
        environmentSuffix: 'staging',
        tags: { Owner: 'Payments' },
      });

      const apiEndpoint = await stack.apiEndpoint.promise();
      const tableName = await stack.tableName.promise();
      const bucketName = await stack.bucketName.promise();

      expect(tableName).toBe('transactions-table-staging');
      expect(bucketName).toBe('payment-reports-staging');
      expect(apiEndpoint).toBe(
        'https://payment-api-staging_id.execute-api.ap-southeast-2.amazonaws.com/prod/webhook'
      );

      const dynamoTable = createdResources.find(r => r.type === 'aws:dynamodb/table:Table');
      expect(dynamoTable).toBeDefined();
      expect(dynamoTable?.inputs.name).toBe('transactions-table-staging');

      const bucket = createdResources.find(r => r.type === 'aws:s3/bucket:Bucket');
      expect(bucket).toBeDefined();
      expect(bucket?.inputs.bucket).toBe('payment-reports-staging');

      const restApi = createdResources.find(r => r.type === 'aws:apigateway/restApi:RestApi');
      expect(restApi).toBeDefined();
      expect(restApi?.inputs.name).toBe('payment-api-staging');

      const anyTaggedResource = createdResources.filter(r => r.inputs?.tags).map(r => r.inputs.tags);
      expect(anyTaggedResource.length).toBeGreaterThan(0);
      anyTaggedResource.forEach(tags => {
        expect(tags).toMatchObject({
          Environment: 'staging',
          Project: 'payment-processor',
          Owner: 'Payments',
        });
      });
    });
  });
});
