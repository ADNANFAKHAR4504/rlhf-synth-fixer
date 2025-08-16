// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  const apiGatewayUrl = outputs.ApiGatewayUrl;
  const turnAroundPromptTableName = outputs.TurnAroundPromptTableName;
  
  describe('API Gateway Endpoints', () => {
    test('health endpoint should return healthy status', async () => {
      const response = await fetch(`${apiGatewayUrl}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('TAP - Task Assignment Platform');
      expect(data.region).toBeDefined();
    });

    test('hello endpoint should return greeting', async () => {
      const response = await fetch(`${apiGatewayUrl}/hello`);
      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.message).toBe('Hello from TAP (Task Assignment Platform)!');
      expect(data.region).toBeDefined();
      expect(data.environment_suffix).toBeDefined();
    });

    test('tasks endpoint should accept POST requests and store data', async () => {
      const taskData = {
        type: 'test-task',
        data: 'Integration test data',
        priority: 'high'
      };

      const response = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.message).toBe('TAP task data processed successfully');
      expect(data.task_id).toBeDefined();
      expect(data.region).toBeDefined();
    });
  });

  describe('DynamoDB Integration', () => {
    test('DynamoDB table should exist', () => {
      expect(turnAroundPromptTableName).toBeDefined();
      expect(turnAroundPromptTableName).toContain('TurnAroundPromptTable');
    });
  });

  describe('API CORS Configuration', () => {
    test('API should support CORS for browser requests', async () => {
      const response = await fetch(`${apiGatewayUrl}/hello`, {
        method: 'OPTIONS'
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(response.headers.get('access-control-allow-methods')).toBeDefined();
    });
  });
});
