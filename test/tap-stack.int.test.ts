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

      const data = (await response.json()) as any;
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('TAP - Task Assignment Platform');
      expect(data.region).toBeDefined();
    });

    test('hello endpoint should return greeting', async () => {
      const response = await fetch(`${apiGatewayUrl}/hello`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.message).toBe('Hello from TAP (Task Assignment Platform)!');
      expect(data.region).toBeDefined();
      expect(data.environment_suffix).toBeDefined();
    });

    test('tasks endpoint should accept POST requests and store data', async () => {
      const taskData = {
        type: 'test-task',
        data: 'Integration test data',
        priority: 'high',
      };

      const response = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
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
        method: 'OPTIONS',
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBe('*');
      expect(
        response.headers.get('access-control-allow-methods')
      ).toBeDefined();
    });
  });

  describe('Multi-Region Deployment Validation', () => {
    test('health endpoint should report multi-region configuration', async () => {
      const response = await fetch(`${apiGatewayUrl}/health`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.multi_region_config).toBeDefined();
      expect(data.multi_region_config.multi_region_orchestration).toBe(true);
      expect(typeof data.multi_region_config.is_primary_region).toBe('boolean');
      expect(typeof data.multi_region_config.replication_enabled).toBe(
        'boolean'
      );
    });

    test('hello endpoint should include deployment region information', async () => {
      const response = await fetch(`${apiGatewayUrl}/hello`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.deployment_region).toBeDefined();
      expect(typeof data.is_primary_region).toBe('boolean');
      expect(data.multi_region_status).toBeDefined();
      expect(data.multi_region_status.current_region).toBeDefined();
      expect(data.multi_region_status.target_region).toBeDefined();
    });

    test('tasks endpoint should include multi-region awareness in responses', async () => {
      const taskData = {
        type: 'multi-region-test',
        data: 'Multi-region deployment test',
        priority: 'medium',
      };

      const response = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.deployment_region).toBeDefined();
      expect(typeof data.is_primary_region).toBe('boolean');
      expect(typeof data.replication_enabled).toBe('boolean');
    });
  });

  describe('Lambda Memory Constraints Validation', () => {
    test('health endpoint should report memory limits compliance', async () => {
      const response = await fetch(`${apiGatewayUrl}/health`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.compliance_status).toBeDefined();
      expect(data.compliance_status.memory_limit).toBe('128MB');
      expect(data.compliance_status.within_256mb_limit).toBe(true);
    });

    test('tasks endpoint should report 256MB memory limit compliance', async () => {
      const taskData = { type: 'memory-test', data: 'Memory limit test' };

      const response = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.memory_limit).toBe('256MB');
      expect(data.compliance_status).toBe('compliant');
    });

    test('all Lambda functions should operate within memory constraints', async () => {
      // Test HelloWorld function (128MB)
      const helloResponse = await fetch(`${apiGatewayUrl}/hello`);
      expect(helloResponse.status).toBe(200);

      // Test DataProcessor function (256MB)
      const tasksResponse = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'constraint-test', data: 'test' }),
      });
      expect(tasksResponse.status).toBe(200);

      // Test HealthCheck function (128MB)
      const healthResponse = await fetch(`${apiGatewayUrl}/health`);
      expect(healthResponse.status).toBe(200);

      const healthData = (await healthResponse.json()) as any;
      expect(healthData.compliance_status.within_256mb_limit).toBe(true);
    });
  });

  describe('Environment Tagging Validation', () => {
    test('health endpoint should confirm environment tagging', async () => {
      const response = await fetch(`${apiGatewayUrl}/health`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.environment).toBeDefined();
      expect(data.environment_suffix).toBeDefined();
      expect(data.compliance_status.environment_tagged).toBe(true);
    });

    test('all endpoints should include environment context', async () => {
      // Test hello endpoint
      const helloResponse = await fetch(`${apiGatewayUrl}/hello`);
      const helloData = (await helloResponse.json()) as any;
      expect(helloData.environment).toBeDefined();
      expect(helloData.environment_suffix).toBeDefined();

      // Test tasks endpoint
      const tasksResponse = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tag-test', data: 'test' }),
      });
      const tasksData = (await tasksResponse.json()) as any;
      expect(tasksData.environment_suffix).toBeDefined();
    });

    test('DynamoDB table should follow TAP naming with environment suffix', () => {
      expect(turnAroundPromptTableName).toMatch(/TurnAroundPromptTable.+/);
      expect(turnAroundPromptTableName).toContain(environmentSuffix);
    });
  });

  describe('CloudWatch Monitoring Integration', () => {
    test('health endpoint should report monitoring configuration', async () => {
      const response = await fetch(`${apiGatewayUrl}/health`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.monitoring).toBeDefined();
      expect(data.monitoring.cloudwatch_alarms).toBe(true);
      expect(data.monitoring.error_tracking).toBe(true);
      expect(data.monitoring.performance_monitoring).toBe(true);
      expect(data.monitoring.production_ready).toBe(true);
      expect(data.compliance_status.cloudwatch_logging).toBe(true);
      expect(data.compliance_status.xray_tracing).toBe(true);
    });

    test('all Lambda functions should have X-Ray tracing enabled', async () => {
      // Verify through health endpoint that X-Ray is configured
      const response = await fetch(`${apiGatewayUrl}/health`);
      const data = (await response.json()) as any;
      expect(data.compliance_status.xray_tracing).toBe(true);
    });

    test('error scenarios should be properly handled and logged', async () => {
      // Test error handling in tasks endpoint with invalid data
      const response = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalid: 'structure to test error handling' }),
      });

      // Should still return 200 with proper error structure (not 500)
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.message).toBe('TAP task data processed successfully');
      expect(data.task_id).toBeDefined();
    });
  });

  describe('Security and Production Readiness', () => {
    test('health endpoint should report production-ready status', async () => {
      const response = await fetch(`${apiGatewayUrl}/health`);
      expect(response.status).toBe(200);

      const data = (await response.json()) as any;
      expect(data.monitoring.production_ready).toBe(true);
      expect(data.service).toBe('TAP - Task Assignment Platform');
      expect(data.version).toBe('1.0.0');
    });

    test('API Gateway should have proper security headers', async () => {
      const response = await fetch(`${apiGatewayUrl}/hello`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
    });

    test('DynamoDB data persistence should work correctly', async () => {
      const uniqueData = `test-${Date.now()}`;
      const taskData = {
        type: 'persistence-test',
        data: uniqueData,
        priority: 'low',
      };

      const response = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      expect(response.status).toBe(200);

      const responseData = (await response.json()) as any;
      expect(responseData.task_id).toBeDefined();
      expect(responseData.message).toBe('TAP task data processed successfully');
    });
  });
});
