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
import * as fs from 'fs';
import * as path from 'path';

// Prioritize AWS_REGION, then AWS_DEFAULT_REGION, and finally fall back to 'us-east-1'
const awsRegion = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region: awsRegion });
const apigwClient = new ApiGatewayV2Client({ region: awsRegion });
const codedeployClient = new CodeDeployClient({ region: awsRegion });

describe('TAP Stack AWS Infrastructure Integration Tests', () => {
  let apiId: string;
  let function1Name: string;
  let function2Name: string;
  let app1Name: string;
  let app2Name: string;

  beforeAll(() => {
    // Load flat-outputs.json from shared path
    const suffix = process.env.ENVIRONMENT_SUFFIX;
    if (!suffix) {
      throw new Error('ENVIRONMENT_SUFFIX environment variable is not set.');
    }

    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    const stackKey = Object.keys(outputs).find(k => k.includes(suffix));

    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}`);
    }

    const stackOutputs = outputs[stackKey];

    const apiUrl = stackOutputs['api-gateway-url'];
    function1Name = stackOutputs['lambda-function-1-name'];
    function2Name = stackOutputs['lambda-function-2-name'];
    app1Name = stackOutputs['codedeploy-application-1'];
    app2Name = stackOutputs['codedeploy-application-2'];

    if (!apiUrl || !function1Name || !app1Name) {
      throw new Error(`Missing one or more required outputs in stack: api-gateway-url, lambda-function-1-name, codedeploy-application-1`);
    }

    // Derive API ID from the URL
    apiId = apiUrl.split('//')[1].split('.')[0];
    console.log(`Derived API ID: ${apiId}`);
  });

  // Lambda Function Tests
  describe('Lambda Functions and Aliases', () => {
    test(`should have function "${function1Name}" configured correctly`, async () => {
      const { Configuration } = await lambdaClient.send(new GetFunctionCommand({
        FunctionName: function1Name,
      }));

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
      const alias = await lambdaClient.send(new GetAliasCommand({
        FunctionName: function1Name,
        Name: 'live',
      }));

      expect(alias).toBeDefined();
      expect(alias.FunctionVersion).toBeDefined();
      expect(alias.FunctionVersion).not.toBe('$LATEST');
    }, 20000);
  });

  // API Gateway Tests
  describe('API Gateway V2 Configuration', () => {
    test('should have the HTTP API configured correctly', async () => {
      const api = await apigwClient.send(new GetApiCommand({ ApiId: apiId }));

      expect(api).toBeDefined();
      expect(api.Name).toBe('serverless-microservices-api');
      expect(api.ProtocolType).toBe('HTTP');
      expect(api.CorsConfiguration?.AllowOrigins).toContain('*');
    }, 20000);

    test('should have the "v1" stage with auto-deploy', async () => {
      const stage = await apigwClient.send(new GetStageCommand({
        ApiId: apiId,
        StageName: 'v1',
      }));

      expect(stage).toBeDefined();
      expect(stage.StageName).toBe('v1');
      expect(stage.AutoDeploy).toBe(true);
    }, 20000);

    test('should have route GET /v1/function1 integrated with Lambda alias', async () => {
      const { Items } = await apigwClient.send(new GetRoutesCommand({ ApiId: apiId }));
      const route = Items?.find(r => r.RouteKey === 'GET /v1/function1');

      expect(route).toBeDefined();
      expect(route?.Target).toMatch(/^integrations\//);
    }, 20000);
  });

  // CodeDeploy Canary Deployment Tests
  describe('CodeDeploy Canary Deployment', () => {
    test(`should have CodeDeploy application "${app1Name}"`, async () => {
      const { application } = await codedeployClient.send(new GetApplicationCommand({
        applicationName: app1Name,
      }));

      expect(application).toBeDefined();
      expect(application?.applicationName).toBe(app1Name);
      expect(application?.computePlatform).toBe('Lambda');
    }, 20000);

    test(`should have CodeDeploy deployment group for "${app1Name}" with custom config`, async () => {
      const { deploymentGroupInfo } = await codedeployClient.send(new GetDeploymentGroupCommand({
        applicationName: app1Name,
        deploymentGroupName: 'serverless-function-1-deployment-group',
      }));

      expect(deploymentGroupInfo).toBeDefined();
      expect(deploymentGroupInfo?.deploymentStyle?.deploymentType).toBe('BLUE_GREEN');
      expect(deploymentGroupInfo?.deploymentConfigName).toBe('serverless-function-1-app-canary-10-percent-5-minutes');
    }, 20000);
  });
});
