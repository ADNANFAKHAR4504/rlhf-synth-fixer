import * as fs from 'fs';
import * as path from 'path';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';

describe('TAP Stack Integration Tests', () => {
  let outputs: any;
  let dynamoClient: DynamoDBClient;
  let pipelineClient: CodePipelineClient;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found: ${outputsPath}. Run deployment first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

    // Initialize AWS clients
    const region = process.env.AWS_REGION || 'us-east-1';
    dynamoClient = new DynamoDBClient({ region });
    pipelineClient = new CodePipelineClient({ region });
  });

  afterAll(async () => {
    // Cleanup clients
    dynamoClient.destroy();
    pipelineClient.destroy();
  });

  describe('Stack Outputs Validation', () => {
    it('has required deploymentTableName output', () => {
      expect(outputs.deploymentTableName).toBeDefined();
      expect(typeof outputs.deploymentTableName).toBe('string');
      expect(outputs.deploymentTableName.length).toBeGreaterThan(0);
    });

    it('has required pipelineUrl output', () => {
      expect(outputs.pipelineUrl).toBeDefined();
      expect(typeof outputs.pipelineUrl).toBe('string');
      expect(outputs.pipelineUrl).toContain('console.aws.amazon.com');
      expect(outputs.pipelineUrl).toContain('codepipeline');
    });

    it('deployment table name contains environment identifier', () => {
      expect(outputs.deploymentTableName).toMatch(/deployment-history-/);
    });

    it('pipeline URL contains pipeline name', () => {
      expect(outputs.pipelineUrl).toContain('pipeline-');
    });
  });

  describe('DynamoDB Table Integration', () => {
    it('deployment table exists and is accessible', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.deploymentTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableName).toBe(outputs.deploymentTableName);
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    it('deployment table has correct key schema', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.deploymentTableName,
      });
      const response = await dynamoClient.send(command);

      expect(response.Table?.KeySchema).toBeDefined();
      const hashKey = response.Table?.KeySchema?.find(
        key => key.KeyType === 'HASH'
      );
      expect(hashKey).toBeDefined();
      expect(hashKey?.AttributeName).toBe('deploymentId');
    });

    it('can write item to deployment table', async () => {
      const testId = `test-${Date.now()}`;
      const putCommand = new PutItemCommand({
        TableName: outputs.deploymentTableName,
        Item: {
          deploymentId: { S: testId },
          timestamp: { S: new Date().toISOString() },
          status: { S: 'test' },
        },
      });
      await dynamoClient.send(putCommand);

      // Verify item was written
      const getCommand = new GetItemCommand({
        TableName: outputs.deploymentTableName,
        Key: { deploymentId: { S: testId } },
      });
      const response = await dynamoClient.send(getCommand);
      expect(response.Item).toBeDefined();
      expect(response.Item?.deploymentId.S).toBe(testId);

      // Cleanup
      const deleteCommand = new DeleteItemCommand({
        TableName: outputs.deploymentTableName,
        Key: { deploymentId: { S: testId } },
      });
      await dynamoClient.send(deleteCommand);
    });

    it('supports read-write operations', async () => {
      const testId = `integration-test-${Date.now()}`;
      const testData = {
        deploymentId: { S: testId },
        pipeline: { S: 'test-pipeline' },
        status: { S: 'SUCCESS' },
        timestamp: { S: new Date().toISOString() },
      };

      // Write
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.deploymentTableName,
          Item: testData,
        })
      );

      // Read
      const readResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.deploymentTableName,
          Key: { deploymentId: { S: testId } },
        })
      );
      expect(readResponse.Item?.pipeline.S).toBe('test-pipeline');
      expect(readResponse.Item?.status.S).toBe('SUCCESS');

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: outputs.deploymentTableName,
          Key: { deploymentId: { S: testId } },
        })
      );
    });
  });

  describe('CodePipeline Integration', () => {
    let pipelineName: string;

    beforeAll(() => {
      // Extract pipeline name from URL
      const urlMatch = outputs.pipelineUrl.match(/pipelines\/([^/]+)\//);
      if (urlMatch) {
        pipelineName = urlMatch[1];
      }
    });

    it('pipeline exists and is accessible', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline?.name).toBe(pipelineName);
    });

    it('pipeline has correct stage configuration', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);

      expect(response.pipeline?.stages).toBeDefined();
      expect(response.pipeline?.stages?.length).toBeGreaterThan(0);

      // Check for required stages
      const stageNames = response.pipeline?.stages?.map(stage => stage.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
    });

    it('pipeline has artifact store configured', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);

      // Pipeline uses either artifactStore or artifactStores
      const hasStore =
        response.pipeline?.artifactStore ||
        response.pipeline?.artifactStores;
      expect(hasStore).toBeDefined();
    });

    it('pipeline state can be retrieved', async () => {
      const command = new GetPipelineStateCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
    });

    it('pipeline has Source stage with GitHub action', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);

      const sourceStage = response.pipeline?.stages?.find(
        stage => stage.name === 'Source'
      );
      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions).toBeDefined();
      expect(sourceStage?.actions?.length).toBeGreaterThan(0);

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.actionTypeId?.category).toBe('Source');
      expect(sourceAction?.actionTypeId?.provider).toBe('GitHub');
    });

    it('pipeline has Build stage with CodeBuild action', async () => {
      const command = new GetPipelineCommand({
        name: pipelineName,
      });
      const response = await pipelineClient.send(command);

      const buildStage = response.pipeline?.stages?.find(
        stage => stage.name === 'Build'
      );
      expect(buildStage).toBeDefined();
      expect(buildStage?.actions).toBeDefined();
      expect(buildStage?.actions?.length).toBeGreaterThan(0);

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.actionTypeId?.category).toBe('Build');
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
    });
  });

  describe('End-to-End Workflow Validation', () => {
    it('can simulate deployment tracking workflow', async () => {
      const deploymentId = `e2e-test-${Date.now()}`;

      // Step 1: Record deployment start
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.deploymentTableName,
          Item: {
            deploymentId: { S: deploymentId },
            status: { S: 'STARTED' },
            timestamp: { S: new Date().toISOString() },
            pipelineName: { S: 'test-pipeline' },
          },
        })
      );

      // Step 2: Verify deployment record
      const getResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.deploymentTableName,
          Key: { deploymentId: { S: deploymentId } },
        })
      );
      expect(getResponse.Item?.status.S).toBe('STARTED');

      // Step 3: Update deployment status
      await dynamoClient.send(
        new PutItemCommand({
          TableName: outputs.deploymentTableName,
          Item: {
            deploymentId: { S: deploymentId },
            status: { S: 'COMPLETED' },
            timestamp: { S: new Date().toISOString() },
            pipelineName: { S: 'test-pipeline' },
            completedAt: { S: new Date().toISOString() },
          },
        })
      );

      // Step 4: Verify final status
      const finalResponse = await dynamoClient.send(
        new GetItemCommand({
          TableName: outputs.deploymentTableName,
          Key: { deploymentId: { S: deploymentId } },
        })
      );
      expect(finalResponse.Item?.status.S).toBe('COMPLETED');
      expect(finalResponse.Item?.completedAt).toBeDefined();

      // Cleanup
      await dynamoClient.send(
        new DeleteItemCommand({
          TableName: outputs.deploymentTableName,
          Key: { deploymentId: { S: deploymentId } },
        })
      );
    });

    it('infrastructure supports CI/CD pipeline workflow', async () => {
      // Verify pipeline is ready
      const pipelineUrlMatch = outputs.pipelineUrl.match(/pipelines\/([^/]+)\//);
      expect(pipelineUrlMatch).toBeTruthy();
      const pipelineName = pipelineUrlMatch[1];

      const pipelineCommand = new GetPipelineCommand({ name: pipelineName });
      const pipelineResponse = await pipelineClient.send(pipelineCommand);
      expect(pipelineResponse.pipeline).toBeDefined();

      // Verify deployment table is ready
      const tableCommand = new DescribeTableCommand({
        TableName: outputs.deploymentTableName,
      });
      const tableResponse = await dynamoClient.send(tableCommand);
      expect(tableResponse.Table?.TableStatus).toBe('ACTIVE');

      // Both components are operational
      expect(pipelineResponse.pipeline?.name).toBe(pipelineName);
      expect(tableResponse.Table?.TableName).toBe(
        outputs.deploymentTableName
      );
    });
  });
});
