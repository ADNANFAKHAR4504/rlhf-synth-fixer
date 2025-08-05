import {
  LambdaClient,
  GetFunctionCommand,
  GetAliasCommand,
} from '@aws-sdk/client-lambda';
import {
  ApiGatewayV2Client,
  GetApiCommand,
  GetStageCommand,
  GetRoutesCommand,
} from '@aws-sdk/client-apigatewayv2';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
} from '@aws-sdk/client-codedeploy';
import { execSync } from 'child_process';

// Strongly typed outputs from `cdktf output -json`
interface TerraformOutput {
  'api-gateway-url': { value: string };
  'lambda-function-1-name': { value: string };
  'lambda-function-1-alias-arn': { value: string };
  'lambda-function-2-name': { value: string };
  'lambda-function-2-alias-arn': { value: string };
  'codedeploy-application-1': { value: string };
  'codedeploy-application-2': { value: string };
}

// Region selection with fallback
const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region: awsRegion });
const apigwClient = new ApiGatewayV2Client({ region: awsRegion });
const codedeployClient = new CodeDeployClient({ region: awsRegion });

describe('TAP Stack AWS Infrastructure Integration Tests', () => {
  let outputs: TerraformOutput;
  let apiId: string;

  beforeAll(() => {
    try {
      console.log('Fetching Terraform outputs from the deployed stack...');
      const outputJson = execSync('cdktf output -json', { encoding: 'utf-8' });
      outputs = JSON.parse(outputJson);

      const apiUrl = outputs['api-gateway-url']?.value;
      if (!apiUrl) {
        throw new Error('API Gateway URL not found in terraform output.');
      }
      apiId = apiUrl.split('//')[1].split('.')[0];
      console.log(`Successfully fetched outputs and derived API ID: ${apiId}`);
    } catch (error) {
      console.error(
        'Failed to fetch terraform outputs. Error:',
        error instanceof Error ? error.message : String(error)
      );
      console.error(
        'Ensure the stack is deployed with `cdktf deploy` and tests are run from the project root.'
      );
      process.exit(1);
    }
  });

  // Test Suite for AWS Lambda Functions
  describe('Lambda Functions and Aliases', () => {
    const function1Name = 'serverless-function-1';

    test(`should have function "${function1Name}" configured correctly`, async () => {
      const command = new GetFunctionCommand({ FunctionName: function1Name });
      const { Configuration } = await lambdaClient.send(command);

      expect(Configuration).toBeDefined();
      expect(Configuration?.FunctionName).toBe(function1Name);
      expect(Configuration?.Runtime).toBe('nodejs18.x');
      expect(Configuration?.Handler).toBe('index.handler');
      expect(Configuration?.Timeout).toBe(30);
      expect(Configuration?.MemorySize).toBe(256);
      expect(Configuration?.Environment?.Variables).toEqual({
        NODE_ENV: 'production',
        SERVICE_NAME: 'function-1',
      });
    }, 20000);

    test(`should have a "live" alias for function "${function1Name}"`, async () => {
      const command = new GetAliasCommand({ FunctionName: function1Name, Name: 'live' });
      const alias = await lambdaClient.send(command);

      expect(alias).toBeDefined();
      expect(alias.FunctionVersion).toBeDefined();
      expect(alias.FunctionVersion).not.toBe('$LATEST');
    }, 20000);
  });

  // Test Suite for API Gateway V2
  describe('API Gateway V2 Configuration', () => {
    test('should have the HTTP API configured correctly', async () => {
      const command = new GetApiCommand({ ApiId: apiId });
      const api = await apigwClient.send(command);

      expect(api).toBeDefined();
      expect(api.Name).toBe('serverless-microservices-api');
      expect(api.ProtocolType).toBe('HTTP');
      expect(api.CorsConfiguration?.AllowOrigins).toContain('*');
    }, 20000);

    test('should have the "v1" stage configured for auto-deployment', async () => {
      const command = new GetStageCommand({ ApiId: apiId, StageName: 'v1' });
      const stage = await apigwClient.send(command);

      expect(stage).toBeDefined();
      expect(stage.StageName).toBe('v1');
      expect(stage.AutoDeploy).toBe(true);
    }, 20000);

    test('should have a route "GET /v1/function1" integrated with the correct Lambda alias', async () => {
      const command = new GetRoutesCommand({ ApiId: apiId });
      const { Items } = await apigwClient.send(command);
      const route = Items?.find(r => r.RouteKey === 'GET /v1/function1');

      expect(route).toBeDefined();
      expect(route?.Target).toMatch(/^integrations\//);
    }, 20000);
  });

  // Test Suite for AWS CodeDeploy
  describe('CodeDeploy Canary Deployment Configuration', () => {
    const app1Name = 'serverless-function-1-app';

    test(`should have the CodeDeploy application "${app1Name}"`, async () => {
      const command = new GetApplicationCommand({ applicationName: app1Name });
      const { application } = await codedeployClient.send(command);

      expect(application).toBeDefined();
      expect(application?.applicationName).toBe(app1Name);
      expect(application?.computePlatform).toBe('Lambda');
    }, 20000);

    test(`should have the CodeDeploy deployment group for "${app1Name}"`, async () => {
      const command = new GetDeploymentGroupCommand({
        applicationName: app1Name,
        deploymentGroupName: 'serverless-function-1-deployment-group',
      });
      const { deploymentGroupInfo } = await codedeployClient.send(command);

      expect(deploymentGroupInfo).toBeDefined();
      expect(deploymentGroupInfo?.deploymentStyle?.deploymentType).toBe('BLUE_GREEN');
      expect(deploymentGroupInfo?.deploymentConfigName).toBe('serverless-function-1-app-canary-10-percent-5-minutes');
    }, 20000);
  });
});
