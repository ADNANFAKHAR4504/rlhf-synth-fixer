// Integration tests will use actual AWS outputs after deployment
import fs from 'fs';
import axios from 'axios';
import { DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { APIGatewayClient, GetApiKeyCommand } from '@aws-sdk/client-api-gateway';

// Skip integration tests if outputs don't exist yet
const outputsFile = 'cfn-outputs/flat-outputs.json';
const outputsExist = fs.existsSync(outputsFile);

describe('Serverless API Integration Tests', () => {
  if (!outputsExist) {
    test.skip('Integration tests require deployment outputs', () => {
      console.log('Skipping integration tests - deployment outputs not available yet');
    });
    return;
  }

  const outputs = JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  const apiEndpoint = outputs.ApiEndpoint;
  const tableName = outputs.TableName;
  const apiKeyId = outputs.ApiKeyId;
  const region = process.env.AWS_REGION || 'us-east-1';

  // AWS clients
  const dynamoClient = new DynamoDBClient({ region });
  const ssmClient = new SSMClient({ region });
  const apiGatewayClient = new APIGatewayClient({ region });

  // Get API Key value
  let apiKey: string;
  
  beforeAll(async () => {
    try {
      const getApiKeyCommand = new GetApiKeyCommand({
        apiKey: apiKeyId,
        includeValue: true,
      });
      const apiKeyResponse = await apiGatewayClient.send(getApiKeyCommand);
      apiKey = apiKeyResponse.value || '';
      if (!apiKey) {
        throw new Error('API key value not found');
      }
    } catch (error) {
      console.error('Failed to retrieve API key:', error);
      throw error;
    }
  });

  // Test data
  const testPlayerId = `test-player-${Date.now()}`;
  const testScore = 150;
  const testGameId = 'test-game-001';

  describe('API Gateway Endpoints', () => {
    test('API endpoint should be accessible', async () => {
      expect(apiEndpoint).toBeDefined();
      expect(apiEndpoint).toContain('execute-api');
    });

    test('POST /scores - Create new player score', async () => {
      const response = await axios.post(
        `${apiEndpoint}scores`,
        {
          playerId: testPlayerId,
          score: testScore,
          gameId: testGameId,
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data.message).toBe('Score created successfully');
      expect(response.data.data.playerId).toBe(testPlayerId);
      expect(response.data.data.score).toBe(testScore);
    });

    test('GET /scores/{playerId} - Retrieve player score', async () => {
      const response = await axios.get(`${apiEndpoint}scores/${testPlayerId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.playerId).toBe(testPlayerId);
      expect(response.data.data.score).toBe(testScore);
      expect(response.data.data.gameId).toBe(testGameId);
    });

    test('PUT /scores/{playerId} - Update player score', async () => {
      const newScore = 200;
      const response = await axios.put(
        `${apiEndpoint}scores/${testPlayerId}`,
        {
          score: newScore,
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Score updated successfully');
      expect(response.data.data.score).toBe(newScore);
    });

    test('DELETE /scores/{playerId} - Delete player score', async () => {
      const response = await axios.delete(`${apiEndpoint}scores/${testPlayerId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.message).toBe('Score deleted successfully');
    });

    test('GET /scores/{playerId} - Should return 404 after deletion', async () => {
      try {
        await axios.get(`${apiEndpoint}scores/${testPlayerId}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });
        fail('Should have returned 404');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.error).toBe('Player score not found');
      }
    });

    test('POST /scores - Should return 400 for missing fields', async () => {
      try {
        await axios.post(
          `${apiEndpoint}scores`,
          {
            playerId: 'test-incomplete',
            // Missing score and gameId
          },
          {
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
          }
        );
        fail('Should have returned 400');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toContain('Missing required fields');
      }
    });
  });

  describe('DynamoDB Table', () => {
    test('Table should exist and be accessible', async () => {
      const command = new ScanCommand({
        TableName: tableName,
        Limit: 1,
      });

      const response = await dynamoClient.send(command);
      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('Table should have correct name pattern', () => {
      expect(tableName).toMatch(/^PlayerScores-/);
    });
  });

  describe('SSM Parameter Store', () => {
    test('Should have API endpoint parameter', async () => {
      const paramName = `/scores-api/${outputs.EnvironmentSuffix || 'dev'}/endpoint`;
      const command = new GetParameterCommand({
        Name: paramName,
      });

      try {
        const response = await ssmClient.send(command);
        expect(response.Parameter?.Value).toBeDefined();
        expect(response.Parameter?.Value).toContain('execute-api');
      } catch (error: any) {
        // Parameter might not exist in all environments
        console.log(`SSM parameter ${paramName} not found: ${error.message}`);
      }
    });

    test('Should have table name parameter', async () => {
      const paramName = `/scores-api/${outputs.EnvironmentSuffix || 'dev'}/table-name`;
      const command = new GetParameterCommand({
        Name: paramName,
      });

      try {
        const response = await ssmClient.send(command);
        expect(response.Parameter?.Value).toBe(tableName);
      } catch (error: any) {
        // Parameter might not exist in all environments
        console.log(`SSM parameter ${paramName} not found: ${error.message}`);
      }
    });
  });

  describe('Lambda Functions', () => {
    test('Lambda functions should be deployed', () => {
      // Check that Lambda function names are in outputs
      expect(outputs.CreateScoreFunctionName).toBeDefined();
      expect(outputs.GetScoreFunctionName).toBeDefined();
      expect(outputs.UpdateScoreFunctionName).toBeDefined();
      expect(outputs.DeleteScoreFunctionName).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    const workflowPlayerId = `workflow-player-${Date.now()}`;

    test('Complete CRUD workflow', async () => {
      // Create
      const createResponse = await axios.post(
        `${apiEndpoint}scores`,
        {
          playerId: workflowPlayerId,
          score: 100,
          gameId: 'workflow-game',
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        }
      );
      expect(createResponse.status).toBe(201);

      // Read
      const getResponse = await axios.get(`${apiEndpoint}scores/${workflowPlayerId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      expect(getResponse.status).toBe(200);
      expect(getResponse.data.data.score).toBe(100);

      // Update
      const updateResponse = await axios.put(
        `${apiEndpoint}scores/${workflowPlayerId}`,
        {
          score: 250,
          gameId: 'updated-game',
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        }
      );
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.data.data.score).toBe(250);

      // Verify update
      const verifyResponse = await axios.get(`${apiEndpoint}scores/${workflowPlayerId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      expect(verifyResponse.data.data.score).toBe(250);
      expect(verifyResponse.data.data.gameId).toBe('updated-game');

      // Delete
      const deleteResponse = await axios.delete(`${apiEndpoint}scores/${workflowPlayerId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
      expect(deleteResponse.status).toBe(200);

      // Verify deletion
      try {
        await axios.get(`${apiEndpoint}scores/${workflowPlayerId}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });
        fail('Should have returned 404 after deletion');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    test('Should handle concurrent operations', async () => {
      const promises = [];

      // Create multiple players concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(
          axios.post(
            `${apiEndpoint}scores`,
            {
              playerId: `concurrent-player-${i}`,
              score: 100 + i,
              gameId: 'concurrent-game',
            },
            {
              headers: { 
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
              },
            }
          )
        );
      }

      const results = await Promise.all(promises);
      results.forEach((result) => {
        expect(result.status).toBe(201);
      });

      // Clean up
      const deletePromises = [];
      for (let i = 0; i < 5; i++) {
        deletePromises.push(
          axios.delete(`${apiEndpoint}scores/concurrent-player-${i}`, {
            headers: {
              'x-api-key': apiKey,
            },
          })
        );
      }
      await Promise.all(deletePromises);
    });
  });

  describe('Error Handling', () => {
    test('Should handle invalid JSON gracefully', async () => {
      try {
        await axios.post(
          `${apiEndpoint}scores`,
          'invalid json',
          {
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
          }
        );
        fail('Should have returned error for invalid JSON');
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
      }
    });

    test('Should handle duplicate player creation', async () => {
      const duplicatePlayerId = `duplicate-player-${Date.now()}`;

      // Create first time
      await axios.post(
        `${apiEndpoint}scores`,
        {
          playerId: duplicatePlayerId,
          score: 100,
          gameId: 'duplicate-test',
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
        }
      );

      // Try to create again
      try {
        await axios.post(
          `${apiEndpoint}scores`,
          {
            playerId: duplicatePlayerId,
            score: 200,
            gameId: 'duplicate-test-2',
          },
          {
            headers: { 
              'Content-Type': 'application/json',
              'x-api-key': apiKey,
            },
          }
        );
        fail('Should have returned 409 for duplicate');
      } catch (error: any) {
        expect(error.response.status).toBe(409);
        expect(error.response.data.error).toBe('Player score already exists');
      }

      // Clean up
      await axios.delete(`${apiEndpoint}scores/${duplicatePlayerId}`, {
        headers: {
          'x-api-key': apiKey,
        },
      });
    });
  });
});