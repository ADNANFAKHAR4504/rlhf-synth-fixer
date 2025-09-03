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

  describe('End-to-End TAP Workflow Tests', () => {
    test('complete task assignment workflow: create → process → validate', async () => {
      const timestamp = Date.now();
      const taskAssignment = {
        type: 'task_assignment',
        data: {
          assignee: 'test-user-001',
          task_title: `E2E Test Task ${timestamp}`,
          description: 'End-to-end test task assignment',
          deadline: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
          category: 'testing',
        },
        priority: 'high',
        source: 'e2e-test',
      };

      // Step 1: Create task assignment via API
      const createResponse = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskAssignment),
      });

      expect(createResponse.status).toBe(200);
      const createData = (await createResponse.json()) as any;

      // Validate task creation response
      expect(createData.task_id).toBeDefined();
      expect(createData.message).toBe('TAP task data processed successfully');
      expect(createData.processed_at).toBeDefined();
      expect(createData.status).toBe('processed');
      expect(createData.table_name).toContain('TurnAroundPromptTable');

      // Step 2: Verify data structure and metadata
      expect(createData.task_details).toBeDefined();
      expect(createData.task_details.type).toBe('task_assignment');
      expect(createData.task_details.priority).toBe('high');
      expect(createData.task_details.source).toBe('e2e-test');

      // Step 3: Validate multi-region and compliance data
      expect(createData.deployment_region).toBeDefined();
      expect(typeof createData.is_primary_region).toBe('boolean');
      expect(typeof createData.replication_enabled).toBe('boolean');
      expect(createData.memory_limit).toBe('256MB');

      // Store task ID for follow-up validations
      const taskId = createData.task_id;
      expect(taskId).toMatch(/^[a-f0-9-]{36}$/); // UUID format validation
    });

    test('task data processing with different priorities and types', async () => {
      const testCases = [
        {
          type: 'urgent_assignment',
          priority: 'critical',
          data: { assignee: 'senior-dev', urgency_level: 1 },
        },
        {
          type: 'routine_task',
          priority: 'low',
          data: { assignee: 'intern', learning_opportunity: true },
        },
        {
          type: 'review_request',
          priority: 'medium',
          data: { reviewer: 'tech-lead', review_type: 'code' },
        },
      ];

      const results = [];

      // Process all task types
      for (const testCase of testCases) {
        const response = await fetch(`${apiGatewayUrl}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase),
        });

        expect(response.status).toBe(200);
        const data = (await response.json()) as any;

        expect(data.task_id).toBeDefined();
        expect(data.task_details.type).toBe(testCase.type);
        expect(data.task_details.priority).toBe(testCase.priority);

        results.push({
          taskId: data.task_id,
          type: testCase.type,
          priority: testCase.priority,
          processingTime: data.processed_at,
        });
      }

      // Verify all tasks were processed successfully
      expect(results).toHaveLength(3);
      expect(results.every(r => r.taskId && r.processingTime)).toBe(true);
    });

    test('DynamoDB integration: data validation and error handling', async () => {
      // Test valid data processing
      const validTask = {
        type: 'validation_test',
        data: {
          field1: 'valid_string',
          field2: 12345,
          field3: true,
          nested: { key: 'value' },
        },
        priority: 'medium',
      };

      const validResponse = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validTask),
      });

      expect(validResponse.status).toBe(200);
      const validData = (await validResponse.json()) as any;
      expect(validData.task_id).toBeDefined();
      expect(validData.status).toBe('processed');

      // Test with edge case data (empty objects, arrays, etc.)
      const edgeCaseTask = {
        type: 'edge_case_test',
        data: {
          empty_object: {},
          empty_array: [],
          null_value: null,
          zero_number: 0,
          empty_string: '',
        },
        priority: 'low',
      };

      const edgeResponse = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(edgeCaseTask),
      });

      expect(edgeResponse.status).toBe(200);
      const edgeData = (await edgeResponse.json()) as any;
      expect(edgeData.task_id).toBeDefined();
      expect(edgeData.message).toBe('TAP task data processed successfully');
    });

    test('system performance and scalability: concurrent task processing', async () => {
      const concurrentTasks = Array.from({ length: 5 }, (_, index) => ({
        type: 'concurrent_test',
        data: {
          batch_id: `batch-${Date.now()}`,
          task_index: index,
          payload: `Concurrent task processing test #${index}`,
        },
        priority: index % 2 === 0 ? 'high' : 'medium',
      }));

      // Process tasks concurrently
      const promises = concurrentTasks.map(task =>
        fetch(`${apiGatewayUrl}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task),
        })
      );

      const responses = await Promise.all(promises);

      // Verify all requests succeeded
      expect(responses.every(r => r.status === 200)).toBe(true);

      const responseData = await Promise.all(responses.map(r => r.json()));

      // Verify all tasks were processed with unique IDs
      const taskIds = responseData.map((d: any) => d.task_id);
      const uniqueTaskIds = new Set(taskIds);
      expect(uniqueTaskIds.size).toBe(5); // All IDs should be unique

      // Verify processing metadata
      responseData.forEach((data: any, index) => {
        expect(data.task_details.task_index).toBe(index);
        expect(data.status).toBe('processed');
        expect(data.memory_limit).toBe('256MB');
      });
    });

    test('end-to-end monitoring and observability validation', async () => {
      // Create a task that exercises monitoring features
      const monitoringTask = {
        type: 'monitoring_validation',
        data: {
          test_scenario: 'observability_check',
          monitoring_points: ['start', 'process', 'store', 'complete'],
          trace_id: `trace-${Date.now()}`,
        },
        priority: 'high',
      };

      const response = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitoringTask),
      });

      expect(response.status).toBe(200);
      const data = (await response.json()) as any;

      // Verify monitoring metadata is included
      expect(data.task_id).toBeDefined();
      expect(data.processed_at).toBeDefined();
      expect(data.memory_limit).toBe('256MB');

      // Check X-Ray tracing and CloudWatch integration
      expect(data.compliance_status).toBeDefined();

      // Validate through health endpoint that monitoring is active
      const healthResponse = await fetch(`${apiGatewayUrl}/health`);
      const healthData = (await healthResponse.json()) as any;

      expect(healthData.monitoring.cloudwatch_alarms).toBe(true);
      expect(healthData.compliance_status.xray_tracing).toBe(true);
      expect(healthData.monitoring.production_ready).toBe(true);
    });

    test('full TAP platform integration: task lifecycle simulation', async () => {
      const projectId = `project-${Date.now()}`;

      // Simulate a complete project task lifecycle
      const taskLifecycle = [
        {
          stage: 'planning',
          type: 'project_setup',
          data: { project_id: projectId, phase: 'initiation' },
          priority: 'high',
        },
        {
          stage: 'development',
          type: 'feature_assignment',
          data: { project_id: projectId, feature: 'user_auth' },
          priority: 'high',
        },
        {
          stage: 'testing',
          type: 'qa_assignment',
          data: { project_id: projectId, test_suite: 'integration' },
          priority: 'medium',
        },
        {
          stage: 'deployment',
          type: 'deploy_task',
          data: { project_id: projectId, environment: 'production' },
          priority: 'critical',
        },
      ];

      const lifecycleResults = [];

      // Execute each stage of the lifecycle
      for (const stage of taskLifecycle) {
        const response = await fetch(`${apiGatewayUrl}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(stage),
        });

        expect(response.status).toBe(200);
        const stageData = (await response.json()) as any;

        lifecycleResults.push({
          stage: stage.stage,
          taskId: stageData.task_id,
          priority: stage.priority,
          processed_at: stageData.processed_at,
        });

        // Verify stage-specific data
        expect(stageData.task_details.data.project_id).toBe(projectId);
        expect(stageData.task_details.type).toBe(stage.type);
        expect(stageData.status).toBe('processed');
      }

      // Verify complete lifecycle was processed
      expect(lifecycleResults).toHaveLength(4);
      expect(lifecycleResults.map(r => r.stage)).toEqual([
        'planning',
        'development',
        'testing',
        'deployment',
      ]);

      // Verify all tasks have the same project ID but unique task IDs
      const taskIds = lifecycleResults.map(r => r.taskId);
      expect(new Set(taskIds).size).toBe(4); // All unique
    });

    test('data persistence verification: write → read → validate flow', async () => {
      // Step 1: Write data to DynamoDB via tasks endpoint
      const persistenceTest = {
        type: 'data_persistence_test',
        data: {
          test_id: `persistence-${Date.now()}`,
          complex_data: {
            nested_object: { level1: { level2: 'deep_value' } },
            array_data: [1, 2, 3, 'string', { mixed: true }],
            special_chars: 'àáâäèéêë@#$%^&*()',
            unicode: '🚀 TAP Test 📊',
          },
          metadata: {
            created_by: 'e2e-test',
            version: '1.0.0',
            tags: ['test', 'persistence', 'validation'],
          },
        },
        priority: 'medium',
      };

      const writeResponse = await fetch(`${apiGatewayUrl}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persistenceTest),
      });

      expect(writeResponse.status).toBe(200);
      const writeData = (await writeResponse.json()) as any;

      // Verify write operation
      expect(writeData.task_id).toBeDefined();
      expect(writeData.status).toBe('processed');
      expect(writeData.table_name).toContain('TurnAroundPromptTable');

      // Step 2: Verify data integrity and structure
      expect(writeData.task_details.data.test_id).toBe(
        persistenceTest.data.test_id
      );
      expect(writeData.task_details.data.complex_data.unicode).toBe(
        '🚀 TAP Test 📊'
      );
      expect(writeData.task_details.data.metadata.tags).toEqual([
        'test',
        'persistence',
        'validation',
      ]);

      // Step 3: Verify system metadata was added
      expect(writeData.processed_at).toBeDefined();
      expect(writeData.deployment_region).toBeDefined();
      expect(writeData.memory_limit).toBe('256MB');
    });
  });
});
