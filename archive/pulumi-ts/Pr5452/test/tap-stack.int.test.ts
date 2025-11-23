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
  const stackConfig = {
    environmentSuffix: 'staging',
    tags: { Owner: 'Payments' },
  };

  const deployStack = async () => {
    resetResources();

    return pulumi.runtime.runInPulumiStack(async () => {
      const stack = new TapStack('tap', stackConfig);
      const apiEndpoint = await stack.apiEndpoint.promise();
      const tableName = await stack.tableName.promise();
      const bucketName = await stack.bucketName.promise();

      return { apiEndpoint, tableName, bucketName };
    });
  };

  it('exposes expected stack outputs', async () => {
    const { apiEndpoint, tableName, bucketName } = await deployStack();

    expect(tableName).toBe('transactions-table-staging');
    expect(bucketName).toBe('payment-reports-staging');
    expect(apiEndpoint).toBe(
      'https://payment-api-staging_id.execute-api.ap-southeast-2.amazonaws.com/prod/webhook'
    );
  });

  it('creates the DynamoDB table with the staging suffix', async () => {
    await deployStack();

    const dynamoTable = createdResources.find(r => r.type === 'aws:dynamodb/table:Table');
    expect(dynamoTable).toBeDefined();
    expect(dynamoTable?.inputs.name).toBe('transactions-table-staging');
  });

  it('creates the S3 bucket for payment reports', async () => {
    await deployStack();

    const bucket = createdResources.find(r => r.type === 'aws:s3/bucket:Bucket');
    expect(bucket).toBeDefined();
    expect(bucket?.inputs.bucket).toBe('payment-reports-staging');
  });

  it('names the API Gateway REST API with the staging suffix', async () => {
    await deployStack();

    const restApi = createdResources.find(r => r.type === 'aws:apigateway/restApi:RestApi');
    expect(restApi).toBeDefined();
    expect(restApi?.inputs.name).toBe('payment-api-staging');
  });

  it('applies expected tags to tagged resources', async () => {
    await deployStack();

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
