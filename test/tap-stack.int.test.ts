import {
  APIGatewayClient,
  GetMethodCommand,
  GetResourcesCommand,
  GetRestApisCommand,
} from '@aws-sdk/client-api-gateway';
import {
  CloudFrontClient,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import { DescribeTableCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetFunctionCommand, LambdaClient } from '@aws-sdk/client-lambda';
import {
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';

// Helper function to get environment-specific resource names
const getResourceName = (
  baseName: string,
  environment: string,
  region: string
) => {
  return `cms-${environment}-${region}-${baseName}`;
};

describe('TapStack Integration Tests', () => {
  const environment = process.env.ENVIRONMENT_SUFFIX || 'test';
  const regions = ['us-east-1', 'us-west-2', 'eu-central-1'];

  regions.forEach(region => {
    describe(`Region: ${region}`, () => {
      let s3: S3Client;
      let dynamodb: DynamoDBClient;
      let lambda: LambdaClient;
      let apigateway: APIGatewayClient;
      let cloudfront: CloudFrontClient;
      const resourcePrefix = `cms-${environment}-${region}`;

      beforeAll(() => {
        s3 = new S3Client({ region });
        dynamodb = new DynamoDBClient({ region });
        lambda = new LambdaClient({ region });
        apigateway = new APIGatewayClient({ region });
        cloudfront = new CloudFrontClient({ region });
      });

      test('S3 Bucket exists with correct configuration', async () => {
        const bucketName = getResourceName('content', environment, region);
        await expect(
          s3.send(new HeadBucketCommand({ Bucket: bucketName }))
        ).resolves.toBeDefined();

        const versioning = await s3.send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );
        expect(versioning.Status).toBe('Enabled');

        const publicAccessBlock = await s3.send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls
        ).toBe(true);
        expect(
          publicAccessBlock.PublicAccessBlockConfiguration
            ?.RestrictPublicBuckets
        ).toBe(true);
      });

      test('DynamoDB Table exists with correct configuration', async () => {
        const tableName = getResourceName(
          'content-metadata',
          environment,
          region
        );
        const table = await dynamodb.send(
          new DescribeTableCommand({ TableName: tableName })
        );
        expect(table).toBeDefined();
        expect(table.Table?.BillingModeSummary?.BillingMode).toBe(
          'PAY_PER_REQUEST'
        );

        const gsi = table.Table?.GlobalSecondaryIndexes?.find(
          index => index.IndexName === 'ContentTypeIndex'
        );
        expect(gsi).toBeDefined();
        expect(gsi?.Projection?.ProjectionType).toBe('ALL');
      });

      test('Lambda Function exists with correct configuration', async () => {
        const functionName = getResourceName(
          'content-handler',
          environment,
          region
        );
        const lambdaFunction = await lambda.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );
        expect(lambdaFunction).toBeDefined();
        expect(lambdaFunction.Configuration?.Runtime).toBe('python3.9');
        expect(lambdaFunction.Configuration?.Timeout).toBe(30);
      });

      test('API Gateway exists with correct configuration', async () => {
        const apis = await apigateway.send(new GetRestApisCommand({}));
        const api = apis.items?.find(
          api => api.name === `${resourcePrefix}-api`
        );
        expect(api).toBeDefined();

        const resources = await apigateway.send(
          new GetResourcesCommand({ restApiId: api!.id! })
        );
        const contentResource = resources.items?.find(
          res => res.path === '/content'
        );
        expect(contentResource).toBeDefined();

        const methods = await apigateway.send(
          new GetMethodCommand({
            restApiId: api!.id!,
            resourceId: contentResource!.id!,
            httpMethod: 'GET',
          })
        );
        expect(methods).toBeDefined();
      });

      test('CloudFront Distribution exists with correct configuration', async () => {
        const distributions = await cloudfront.send(
          new ListDistributionsCommand({})
        );
        const distribution = distributions.DistributionList?.Items?.find(dist =>
          dist.Comment?.includes(`${resourcePrefix} CMS Distribution`)
        );
        expect(distribution).toBeDefined();
        expect(distribution?.DefaultCacheBehavior?.ViewerProtocolPolicy).toBe(
          'redirect-to-https'
        );
      });
    });
  });
});
