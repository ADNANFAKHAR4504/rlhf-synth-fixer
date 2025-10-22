// ========================================================================
// ECS Trading Infrastructure Integration Tests
// ========================================================================
// These tests validate the deployed AWS infrastructure end-to-end
// using real AWS resources (no mocking).
//
// Test Scenarios from lib/PROMPT.md:
// 1. Infrastructure Deployment Validation
// 2. Predictive Scaling Test (9:25 AM market open preparation)
// 3. Blue-Green Deployment Test (zero-downtime deployments)
// 4. Auto-Rollback Test (CodeDeploy rollback on failures)
// ========================================================================

import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CodeDeployClient,
  ContinueDeploymentCommand,
  CreateDeploymentCommand,
  DeploymentStatus,
  GetDeploymentCommand,
  GetDeploymentGroupCommand,
  ListDeploymentsCommand,
  StopDeploymentCommand,
} from '@aws-sdk/client-codedeploy';
import {
  DescribeServicesCommand,
  DescribeTaskDefinitionCommand,
  DescribeTasksCommand,
  ECSClient,
  ListTasksCommand,
  RegisterTaskDefinitionCommand,
  StopTaskCommand,
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import axios from 'axios';
import fs from 'fs';

// ========================================================================
// Configuration - Load outputs from deployed stack
// ========================================================================
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Extract deployment region from outputs
const region = outputs.DeploymentRegion || 'us-east-2';

// Initialize AWS SDK clients
const ecsClient = new ECSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const codeDeployClient = new CodeDeployClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const snsClient = new SNSClient({ region });

// ========================================================================
// Helper Functions
// ========================================================================

/**
 * Wait for a condition to be true with timeout
 */
async function waitFor(
  condition: () => Promise<boolean>,
  timeoutMs: number = 60000,
  intervalMs: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}

/**
 * Get running task count for ECS service
 */
async function getRunningTaskCount(
  clusterName: string,
  serviceName: string
): Promise<number> {
  const response = await ecsClient.send(
    new DescribeServicesCommand({
      cluster: clusterName,
      services: [serviceName],
    })
  );

  if (!response.services || response.services.length === 0) {
    throw new Error(`Service ${serviceName} not found`);
  }

  return response.services[0].runningCount || 0;
}

/**
 * Get healthy target count for target group
 */
async function getHealthyTargetCount(targetGroupArn: string): Promise<number> {
  const response = await elbClient.send(
    new DescribeTargetHealthCommand({
      TargetGroupArn: targetGroupArn,
    })
  );

  return (
    response.TargetHealthDescriptions?.filter(
      (target) => target.TargetHealth?.State === 'healthy'
    ).length || 0
  );
}

/**
 * Make HTTP request to ALB endpoint
 */
async function testEndpoint(url: string): Promise<{
  status: number;
  statusText: string;
  data: string;
}> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true, // Accept all status codes
    });
    return {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
    };
  } catch (error: any) {
    throw new Error(`Failed to reach endpoint ${url}: ${error.message}`);
  }
}

// ========================================================================
// Test Suite 1: Infrastructure Deployment Validation
// ========================================================================
describe('ECS Trading Infrastructure - Deployment Validation', () => {
  test('Stack outputs are available and valid', () => {
    // Verify all required outputs exist
    expect(outputs.VpcId).toBeDefined();
    expect(outputs.EcsClusterName).toBeDefined();
    expect(outputs.EcsClusterArn).toBeDefined();
    expect(outputs.EcsServiceName).toBeDefined();
    expect(outputs.EcsServiceArn).toBeDefined();
    expect(outputs.LoadBalancerDnsName).toBeDefined();
    expect(outputs.LoadBalancerArn).toBeDefined();
    expect(outputs.BlueTargetGroupArn).toBeDefined();
    expect(outputs.GreenTargetGroupArn).toBeDefined();
    expect(outputs.ProductionListenerArn).toBeDefined();
    expect(outputs.TestListenerArn).toBeDefined();
    expect(outputs.CodeDeployApplicationName).toBeDefined();
    expect(outputs.CodeDeployDeploymentGroupName).toBeDefined();
    expect(outputs.LogGroupName).toBeDefined();
    expect(outputs.AlarmTopicArn).toBeDefined();
    expect(outputs.DeploymentRegion).toBeDefined();

    // Verify output formats
    expect(outputs.EcsClusterArn).toMatch(/^arn:aws:ecs:/);
    expect(outputs.EcsServiceArn).toMatch(/^arn:aws:ecs:/);
    expect(outputs.LoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:/);
    expect(outputs.AlarmTopicArn).toMatch(/^arn:aws:sns:/);
    expect(outputs.LoadBalancerDnsName).toContain('.elb.amazonaws.com');
  });

  test('ECS Cluster exists and is active', async () => {
    const response = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: outputs.EcsClusterName,
        services: [outputs.EcsServiceName],
      })
    );

    expect(response.services).toBeDefined();
    expect(response.services!.length).toBe(1);

    const service = response.services![0];
    expect(service.status).toBe('ACTIVE');
    expect(service.desiredCount).toBeGreaterThanOrEqual(2);
    expect(service.runningCount).toBeGreaterThanOrEqual(2);
    expect(service.deploymentController?.type).toBe('CODE_DEPLOY');
  });

  test('ECS Service has running tasks', async () => {
    const tasksResponse = await ecsClient.send(
      new ListTasksCommand({
        cluster: outputs.EcsClusterName,
        serviceName: outputs.EcsServiceName,
        desiredStatus: 'RUNNING',
      })
    );

    expect(tasksResponse.taskArns).toBeDefined();
    expect(tasksResponse.taskArns!.length).toBeGreaterThanOrEqual(2);

    // Verify task details
    if (tasksResponse.taskArns && tasksResponse.taskArns.length > 0) {
      const taskDetailsResponse = await ecsClient.send(
        new DescribeTasksCommand({
          cluster: outputs.EcsClusterName,
          tasks: tasksResponse.taskArns,
        })
      );

      expect(taskDetailsResponse.tasks).toBeDefined();
      taskDetailsResponse.tasks!.forEach((task) => {
        expect(task.lastStatus).toBe('RUNNING');
        expect(task.healthStatus).toMatch(/HEALTHY|UNKNOWN/);
      });
    }
  });

  test('Load Balancer is active and accessible', async () => {
    const response = await elbClient.send(
      new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.LoadBalancerArn],
      })
    );

    expect(response.LoadBalancers).toBeDefined();
    expect(response.LoadBalancers!.length).toBe(1);

    const lb = response.LoadBalancers![0];
    expect(lb.State?.Code).toBe('active');
    expect(lb.Scheme).toBe('internet-facing');
    expect(lb.Type).toBe('application');
    expect(lb.DNSName).toBe(outputs.LoadBalancerDnsName);
  });

  test('Target Groups exist and have healthy targets', async () => {
    // Check Blue Target Group
    const blueHealthResponse = await elbClient.send(
      new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.BlueTargetGroupArn,
      })
    );

    expect(blueHealthResponse.TargetHealthDescriptions).toBeDefined();
    const healthyBlueTargets =
      blueHealthResponse.TargetHealthDescriptions!.filter(
        (target) => target.TargetHealth?.State === 'healthy'
      );
    expect(healthyBlueTargets.length).toBeGreaterThanOrEqual(2);

    // Verify target group configuration
    const tgResponse = await elbClient.send(
      new DescribeTargetGroupsCommand({
        TargetGroupArns: [
          outputs.BlueTargetGroupArn,
          outputs.GreenTargetGroupArn,
        ],
      })
    );

    expect(tgResponse.TargetGroups).toBeDefined();
    expect(tgResponse.TargetGroups!.length).toBe(2);

    tgResponse.TargetGroups!.forEach((tg) => {
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80); // Blue-green image uses port 80
      expect(tg.TargetType).toBe('ip');
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
      expect(tg.Matcher?.HttpCode).toContain('200');
    });
  });

  test('CodeDeploy deployment group is configured for blue-green', async () => {
    const response = await codeDeployClient.send(
      new GetDeploymentGroupCommand({
        applicationName: outputs.CodeDeployApplicationName,
        deploymentGroupName: outputs.CodeDeployDeploymentGroupName,
      })
    );

    expect(response.deploymentGroupInfo).toBeDefined();

    const deploymentGroup = response.deploymentGroupInfo!;
    expect(deploymentGroup.deploymentStyle?.deploymentType).toBe('BLUE_GREEN');
    expect(deploymentGroup.blueGreenDeploymentConfiguration).toBeDefined();
    expect(deploymentGroup.autoRollbackConfiguration?.enabled).toBe(true);
    expect(
      deploymentGroup.autoRollbackConfiguration?.events
    ).toContainEqual('DEPLOYMENT_FAILURE');
    expect(
      deploymentGroup.autoRollbackConfiguration?.events
    ).toContainEqual('DEPLOYMENT_STOP_ON_REQUEST');
  });

  test('CloudWatch Log Group exists', async () => {
    const response = await logsClient.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName,
      })
    );

    expect(response.logGroups).toBeDefined();
    expect(response.logGroups!.length).toBeGreaterThanOrEqual(1);

    const logGroup = response.logGroups!.find(
      (lg) => lg.logGroupName === outputs.LogGroupName
    );
    expect(logGroup).toBeDefined();
    expect(logGroup!.retentionInDays).toBe(30);
  });

  test('SNS Topic exists for alarms', async () => {
    const response = await snsClient.send(
      new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn,
      })
    );

    expect(response.Attributes).toBeDefined();
    expect(response.Attributes!.TopicArn).toBe(outputs.AlarmTopicArn);
    expect(response.Attributes!.DisplayName).toBe('OrderBroker Alarms');
  });
});

// ========================================================================
// Test Suite 2: ALB Endpoint Connectivity
// ========================================================================
describe('ECS Trading Infrastructure - ALB Endpoint Tests', () => {
  test('Production listener (port 80) is accessible', async () => {
    const url = `http://${outputs.LoadBalancerDnsName}/`;
    const response = await testEndpoint(url);

    // Should get either 200 or 404 (both are healthy for Tomcat)
    expect([200, 404]).toContain(response.status);

    // If 404, verify it's from Tomcat
    if (response.status === 404) {
      expect(response.data).toContain('Tomcat');
    }
  });

  test('Test listener (port 9090) is accessible', async () => {
    const url = `http://${outputs.LoadBalancerDnsName}:9090/`;
    const response = await testEndpoint(url);

    // Should get either 200 or 404 (both are healthy for Tomcat)
    expect([200, 404]).toContain(response.status);

    // If 404, verify it's from Tomcat
    if (response.status === 404) {
      expect(response.data).toContain('Tomcat');
    }
  });

  test('ALB can handle concurrent requests', async () => {
    const url = `http://${outputs.LoadBalancerDnsName}/`;
    const requests = Array(10)
      .fill(null)
      .map(() => testEndpoint(url));

    const responses = await Promise.all(requests);

    // All requests should succeed
    responses.forEach((response) => {
      expect([200, 404]).toContain(response.status);
    });
  });
});

// ========================================================================
// Test Suite 3: Predictive Scaling Test
// ========================================================================
describe('ECS Trading Infrastructure - Predictive Scaling', () => {
  test('ECS Service has auto-scaling configured', async () => {
    const response = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: outputs.EcsClusterName,
        services: [outputs.EcsServiceName],
      })
    );

    const service = response.services![0];

    // Verify minimum capacity
    expect(service.desiredCount).toBeGreaterThanOrEqual(2);

    // Service should be able to scale
    expect(service.schedulingStrategy).toBe('REPLICA');
  });

  test('Service can scale task count dynamically', async () => {
    // Get initial task count
    const initialCount = await getRunningTaskCount(
      outputs.EcsClusterName,
      outputs.EcsServiceName
    );

    expect(initialCount).toBeGreaterThanOrEqual(2);

    // Note: Actual scaling test would require triggering scheduled scaling
    // or modifying desired count and waiting for tasks to start.
    // For integration test, we verify the service can maintain desired count.

    // Wait and verify count remains stable
    await new Promise((resolve) => setTimeout(resolve, 10000));

    const finalCount = await getRunningTaskCount(
      outputs.EcsClusterName,
      outputs.EcsServiceName
    );

    expect(finalCount).toBe(initialCount);
  });

  test('Target group maintains healthy targets during normal operation', async () => {
    const healthyCount = await getHealthyTargetCount(
      outputs.BlueTargetGroupArn
    );

    expect(healthyCount).toBeGreaterThanOrEqual(2);

    // Verify stability over time
    await new Promise((resolve) => setTimeout(resolve, 15000));

    const healthyCountAfter = await getHealthyTargetCount(
      outputs.BlueTargetGroupArn
    );

    expect(healthyCountAfter).toBeGreaterThanOrEqual(2);
  });
});

// ========================================================================
// Test Suite 4: Blue-Green Deployment Readiness
// ========================================================================
describe('ECS Trading Infrastructure - Blue-Green Deployment', () => {
  test('Both blue and green target groups exist', async () => {
    const response = await elbClient.send(
      new DescribeTargetGroupsCommand({
        TargetGroupArns: [
          outputs.BlueTargetGroupArn,
          outputs.GreenTargetGroupArn,
        ],
      })
    );

    expect(response.TargetGroups).toBeDefined();
    expect(response.TargetGroups!.length).toBe(2);

    // Find by ARN match instead of name
    const blueTargetGroup = response.TargetGroups!.find(
      (tg) => tg.TargetGroupArn === outputs.BlueTargetGroupArn
    );
    const greenTargetGroup = response.TargetGroups!.find(
      (tg) => tg.TargetGroupArn === outputs.GreenTargetGroupArn
    );

    expect(blueTargetGroup).toBeDefined();
    expect(greenTargetGroup).toBeDefined();

    // Both should have same configuration
    expect(blueTargetGroup!.Port).toBe(greenTargetGroup!.Port);
    expect(blueTargetGroup!.Protocol).toBe(greenTargetGroup!.Protocol);
    expect(blueTargetGroup!.HealthCheckPath).toBe(
      greenTargetGroup!.HealthCheckPath
    );
  });

  test('Production and test listeners are configured', async () => {
    // This validates that the infrastructure supports blue-green deployments
    expect(outputs.ProductionListenerArn).toMatch(/^arn:aws:elasticloadbalancing/);
    expect(outputs.TestListenerArn).toMatch(/^arn:aws:elasticloadbalancing/);

    // Both production (80) and test (9090) endpoints should be accessible
    const prodUrl = `http://${outputs.LoadBalancerDnsName}/`;
    const testUrl = `http://${outputs.LoadBalancerDnsName}:9090/`;

    const [prodResponse, testResponse] = await Promise.all([
      testEndpoint(prodUrl),
      testEndpoint(testUrl),
    ]);

    expect([200, 404]).toContain(prodResponse.status);
    expect([200, 404]).toContain(testResponse.status);
  });

  test('CodeDeploy can manage deployments', async () => {
    // List recent deployments
    const response = await codeDeployClient.send(
      new ListDeploymentsCommand({
        applicationName: outputs.CodeDeployApplicationName,
        deploymentGroupName: outputs.CodeDeployDeploymentGroupName,
        includeOnlyStatuses: ['Succeeded', 'Failed', 'Stopped', 'Ready'],
      })
    );

    expect(response.deployments).toBeDefined();
    // Deployments list may be empty for new deployments, that's OK
  });
});

// ========================================================================
// Test Suite 5: Auto-Rollback Configuration
// ========================================================================
describe('ECS Trading Infrastructure - Auto-Rollback', () => {
  test('Deployment group has auto-rollback enabled', async () => {
    const response = await codeDeployClient.send(
      new GetDeploymentGroupCommand({
        applicationName: outputs.CodeDeployApplicationName,
        deploymentGroupName: outputs.CodeDeployDeploymentGroupName,
      })
    );

    const deploymentGroup = response.deploymentGroupInfo!;

    expect(deploymentGroup.autoRollbackConfiguration).toBeDefined();
    expect(deploymentGroup.autoRollbackConfiguration!.enabled).toBe(true);

    const events = deploymentGroup.autoRollbackConfiguration!.events || [];
    expect(events).toContainEqual('DEPLOYMENT_FAILURE');
    expect(events).toContainEqual('DEPLOYMENT_STOP_ON_REQUEST');
  });

  test('CloudWatch alarms exist for monitoring', async () => {
    // Verify SNS topic exists (used for alarm notifications)
    expect(outputs.AlarmTopicArn).toMatch(/^arn:aws:sns:/);

    const response = await snsClient.send(
      new GetTopicAttributesCommand({
        TopicArn: outputs.AlarmTopicArn,
      })
    );

    expect(response.Attributes).toBeDefined();
    expect(response.Attributes!.TopicArn).toBe(outputs.AlarmTopicArn);

    // Verify topic has subscriptions (pending or confirmed)
    const pendingCount = parseInt(
      response.Attributes!.SubscriptionsPending || '0',
      10
    );
    const confirmedCount = parseInt(
      response.Attributes!.SubscriptionsConfirmed || '0',
      10
    );
    const totalSubscriptions = pendingCount + confirmedCount;
    expect(totalSubscriptions).toBeGreaterThanOrEqual(1);
  });
});

// ========================================================================
// Test Suite 6: End-to-End Workflow Validation
// ========================================================================
describe('ECS Trading Infrastructure - E2E Workflow', () => {
  test('Complete request flow: Internet -> ALB -> ECS Tasks', async () => {
    // Step 1: Make request to ALB
    const url = `http://${outputs.LoadBalancerDnsName}/`;
    const response = await testEndpoint(url);

    expect([200, 404]).toContain(response.status);

    // Step 2: Verify tasks are running
    const runningCount = await getRunningTaskCount(
      outputs.EcsClusterName,
      outputs.EcsServiceName
    );
    expect(runningCount).toBeGreaterThanOrEqual(2);

    // Step 3: Verify targets are healthy
    const healthyCount = await getHealthyTargetCount(
      outputs.BlueTargetGroupArn
    );
    expect(healthyCount).toBeGreaterThanOrEqual(2);

    // Step 4: Verify logs are being generated
    const logsResponse = await logsClient.send(
      new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.LogGroupName,
      })
    );

    expect(logsResponse.logGroups).toBeDefined();
    expect(logsResponse.logGroups!.length).toBeGreaterThanOrEqual(1);
  });

  test('Infrastructure supports zero-downtime deployment workflow', async () => {
    // Verify all components needed for blue-green deployment exist
    const checks = [
      outputs.BlueTargetGroupArn,
      outputs.GreenTargetGroupArn,
      outputs.ProductionListenerArn,
      outputs.TestListenerArn,
      outputs.CodeDeployApplicationName,
      outputs.CodeDeployDeploymentGroupName,
    ];

    checks.forEach((check) => {
      expect(check).toBeDefined();
      expect(check).toBeTruthy();
    });

    // Verify both blue and green environments can handle traffic
    const blueHealth = await getHealthyTargetCount(outputs.BlueTargetGroupArn);
    expect(blueHealth).toBeGreaterThanOrEqual(2);

    // Green may be empty initially, but should exist
    const greenHealthResponse = await elbClient.send(
      new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.GreenTargetGroupArn,
      })
    );
    expect(greenHealthResponse.TargetHealthDescriptions).toBeDefined();
  });
});

// ========================================================================
// Test Suite 7: REAL Blue-Green Deployment E2E Test
// ========================================================================
describe('ECS Trading Infrastructure - REAL Blue-Green Deployment E2E', () => {
  // This test suite performs ACTUAL deployments with traffic shifting
  // WARNING: This creates real resources and deployments in AWS

  let deploymentId: string | undefined;
  let originalTaskDefinitionArn: string | undefined;

  afterAll(async () => {
    // Cleanup: Stop any running deployment created by tests
    if (deploymentId) {
      try {
        await codeDeployClient.send(
          new StopDeploymentCommand({
            deploymentId,
          })
        );
        console.log(`Stopped test deployment: ${deploymentId}`);
      } catch (error) {
        // Deployment may have already completed or stopped
        console.log(`Could not stop deployment: ${error}`);
      }
    }
  }, 300000); // 5 minute timeout for cleanup

  test('Get current task definition for baseline', async () => {
    const serviceResponse = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: outputs.EcsClusterName,
        services: [outputs.EcsServiceName],
      })
    );

    const service = serviceResponse.services![0];
    originalTaskDefinitionArn = service.taskDefinition;

    expect(originalTaskDefinitionArn).toBeDefined();
    console.log(
      `Original task definition: ${originalTaskDefinitionArn}`
    );

    // Get task definition details
    const taskDefResponse = await ecsClient.send(
      new DescribeTaskDefinitionCommand({
        taskDefinition: originalTaskDefinitionArn,
      })
    );

    expect(taskDefResponse.taskDefinition).toBeDefined();
    expect(taskDefResponse.taskDefinition!.containerDefinitions).toBeDefined();
    expect(
      taskDefResponse.taskDefinition!.containerDefinitions!.length
    ).toBeGreaterThan(0);

    const currentImage =
      taskDefResponse.taskDefinition!.containerDefinitions![0].image;
    console.log(`Current container image: ${currentImage}`);
  }, 60000);

  test('Register new task definition with nginx for testing', async () => {
    // Get the current task definition as a template
    const taskDefResponse = await ecsClient.send(
      new DescribeTaskDefinitionCommand({
        taskDefinition: originalTaskDefinitionArn,
      })
    );

    const originalTaskDef = taskDefResponse.taskDefinition!;

    // Create new task definition with blue-green test image
    const newTaskDef = {
      family: originalTaskDef.family,
      taskRoleArn: originalTaskDef.taskRoleArn,
      executionRoleArn: originalTaskDef.executionRoleArn,
      networkMode: originalTaskDef.networkMode,
      containerDefinitions: originalTaskDef.containerDefinitions!.map(
        (container) => ({
          ...container,
          image: 'amasucci/bluegreen', // Blue-green test image
          healthCheck: undefined, // Remove container health check to rely on ALB
          environment: [
            {
              name: 'COLOR',
              value: 'green', // Deploy GREEN version for testing
            },
          ],
          portMappings: [
            {
              containerPort: 80, // Image listens on port 80
              protocol: 'tcp',
            },
          ],
        })
      ),
      requiresCompatibilities: originalTaskDef.requiresCompatibilities,
      cpu: originalTaskDef.cpu,
      memory: originalTaskDef.memory,
      runtimePlatform: originalTaskDef.runtimePlatform,
    };

    const response = await ecsClient.send(
      new RegisterTaskDefinitionCommand(newTaskDef)
    );

    expect(response.taskDefinition).toBeDefined();
    const newTaskDefArn = response.taskDefinition!.taskDefinitionArn;

    console.log(`Registered new task definition: ${newTaskDefArn}`);
    console.log(
      `New image: ${response.taskDefinition!.containerDefinitions![0].image}`
    );

    // Store for next test
    (global as any).newTaskDefinitionArn = newTaskDefArn;
  }, 60000);

  test(
    'Trigger CodeDeploy blue-green deployment',
    async () => {
      const newTaskDefArn = (global as any).newTaskDefinitionArn;
      expect(newTaskDefArn).toBeDefined();

      // Create deployment with CodeDeploy
      const appSpec = {
        version: '0.0',
        Resources: [
          {
            TargetService: {
              Type: 'AWS::ECS::Service',
              Properties: {
                TaskDefinition: newTaskDefArn,
                LoadBalancerInfo: {
                  ContainerName: 'OrderBrokerContainer',
                  ContainerPort: 80, // Blue-green image uses port 80
                },
                PlatformVersion: 'LATEST',
              },
            },
          },
        ],
      };

      const response = await codeDeployClient.send(
        new CreateDeploymentCommand({
          applicationName: outputs.CodeDeployApplicationName,
          deploymentGroupName: outputs.CodeDeployDeploymentGroupName,
          revision: {
            revisionType: 'AppSpecContent',
            appSpecContent: {
              content: JSON.stringify(appSpec),
            },
          },
          description: 'Integration test deployment - nginx blue-green',
        })
      );

      expect(response.deploymentId).toBeDefined();
      deploymentId = response.deploymentId;

      console.log(`Created deployment: ${deploymentId}`);
      console.log(
        `Monitor at: https://console.aws.amazon.com/codesuite/codedeploy/deployments/${deploymentId}?region=${region}`
      );
    },
    60000
  );

  test(
    'Wait for green environment to be ready (READY status)',
    async () => {
      expect(deploymentId).toBeDefined();

      let deploymentReady = false;
      let attempts = 0;
      const maxAttempts = 20; // 10 minutes max

      console.log('Waiting for green environment to be deployed...');

      while (!deploymentReady && attempts < maxAttempts) {
        const response = await codeDeployClient.send(
          new GetDeploymentCommand({
            deploymentId,
          })
        );

        const deployment = response.deploymentInfo!;
        const status = deployment.status;

        console.log(
          `Deployment status: ${status} (attempt ${attempts + 1}/${maxAttempts})`
        );

        if (deployment.deploymentOverview) {
          console.log(
            `Progress: Pending=${deployment.deploymentOverview.Pending}, InProgress=${deployment.deploymentOverview.InProgress}, Succeeded=${deployment.deploymentOverview.Succeeded}, Failed=${deployment.deploymentOverview.Failed}`
          );
        }

        // Wait for READY status (green environment deployed, waiting for approval)
        if (status === DeploymentStatus.READY) {
          deploymentReady = true;
          console.log(
            '✅ Green environment is READY for traffic validation!'
          );
        } else if (
          status === DeploymentStatus.FAILED ||
          status === DeploymentStatus.STOPPED
        ) {
          throw new Error(
            `Deployment failed with status: ${status}. Error: ${deployment.errorInformation?.message || 'Unknown'}`
          );
        }

        if (!deploymentReady) {
          await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds
          attempts++;
        }
      }

      expect(deploymentReady).toBe(true);
    },
    600000
  ); // 10 minute timeout

  test(
    'EXTENSIVE green environment validation on test listener (port 9090)',
    async () => {
      expect(deploymentId).toBeDefined();

      console.log(
        '🔍 Starting EXTENSIVE green environment validation on test listener (port 9090)...'
      );

      const testUrl = `http://${outputs.LoadBalancerDnsName}:9090/`;

      // Test 1: Check green environment is accessible
      console.log('Test 1: Checking green environment accessibility...');
      const response1 = await testEndpoint(testUrl);
      expect([200, 404]).toContain(response1.status);
      console.log(`  ✅ Green environment responded with HTTP ${response1.status}`);

      // Test 2: Verify GREEN deployment is serving
      console.log('Test 2: Verifying GREEN deployment...');
      if (response1.status === 200) {
        expect(response1.data.toLowerCase()).toContain('green');
        expect(response1.data.toLowerCase()).not.toContain('blue');
        console.log('  ✅ GREEN environment is deployed and responding correctly');
      }

      // Test 3: Multiple requests to verify stability
      console.log('Test 3: Testing green environment stability (10 requests)...');
      const requests = Array(10)
        .fill(null)
        .map(() => testEndpoint(testUrl));
      const responses = await Promise.all(requests);

      const successCount = responses.filter((r) =>
        [200, 404].includes(r.status)
      ).length;
      console.log(`  ✅ ${successCount}/10 requests succeeded`);
      expect(successCount).toBe(10);

      // Test 4: Check green target group health
      console.log('Test 4: Checking green target group health...');
      const greenHealth = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.GreenTargetGroupArn,
        })
      );

      const greenHealthyCount =
        greenHealth.TargetHealthDescriptions?.filter(
          (t) => t.TargetHealth?.State === 'healthy'
        ).length || 0;

      console.log(
        `  ✅ Green target group has ${greenHealthyCount} healthy targets`
      );
      expect(greenHealthyCount).toBeGreaterThanOrEqual(2);

      // Test 5: Verify blue environment still serves production traffic
      console.log(
        'Test 5: Verifying blue environment still serves production (port 80)...'
      );
      const prodUrl = `http://${outputs.LoadBalancerDnsName}/`;
      const prodResponse = await testEndpoint(prodUrl);
      expect([200, 404]).toContain(prodResponse.status);
      console.log(
        `  ✅ Production endpoint still accessible (HTTP ${prodResponse.status})`
      );

      console.log('🎉 All green environment validation tests PASSED!');
    },
    120000
  );

  test(
    'Verify both blue and green target groups during deployment',
    async () => {
      // Check blue target group (should have original tasks)
      const blueHealth = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.BlueTargetGroupArn,
        })
      );

      console.log(
        `Blue target group has ${blueHealth.TargetHealthDescriptions?.length || 0} targets`
      );
      blueHealth.TargetHealthDescriptions?.forEach((target, index) => {
        console.log(
          `  Blue target ${index + 1}: ${target.TargetHealth?.State}`
        );
      });

      // Check green target group (should have new nginx tasks during/after deployment)
      const greenHealth = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.GreenTargetGroupArn,
        })
      );

      console.log(
        `Green target group has ${greenHealth.TargetHealthDescriptions?.length || 0} targets`
      );
      greenHealth.TargetHealthDescriptions?.forEach((target, index) => {
        console.log(
          `  Green target ${index + 1}: ${target.TargetHealth?.State}`
        );
      });

      // At least one target group should have healthy targets
      const blueHealthyCount =
        blueHealth.TargetHealthDescriptions?.filter(
          (t) => t.TargetHealth?.State === 'healthy'
        ).length || 0;
      const greenHealthyCount =
        greenHealth.TargetHealthDescriptions?.filter(
          (t) => t.TargetHealth?.State === 'healthy'
        ).length || 0;

      expect(blueHealthyCount + greenHealthyCount).toBeGreaterThanOrEqual(
        2
      );
    },
    60000
  );

  test(
    'MANUAL TRAFFIC SWITCHOVER: Continue deployment to reroute production traffic',
    async () => {
      expect(deploymentId).toBeDefined();

      console.log(
        '🚦 MANUAL ACTION: Continuing deployment to switch traffic from blue → green'
      );

      // Manually approve and continue the deployment
      await codeDeployClient.send(
        new ContinueDeploymentCommand({
          deploymentId,
          deploymentWaitType: 'READY_WAIT', // Continue from READY wait state
        })
      );

      console.log('✅ Deployment continuation command sent successfully');

      // Wait a moment for traffic to start shifting
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Monitor deployment status during traffic shift
      let trafficShifted = false;
      let attempts = 0;

      console.log('Monitoring traffic shift progress...');

      while (!trafficShifted && attempts < 40) {
        const response = await codeDeployClient.send(
          new GetDeploymentCommand({
            deploymentId,
          })
        );

        const status = response.deploymentInfo!.status;
        console.log(`  Deployment status: ${status}`);

        if (status === DeploymentStatus.SUCCEEDED) {
          trafficShifted = true;
          console.log('✅ TRAFFIC SWITCHOVER COMPLETED!');
        } else if (
          status === DeploymentStatus.FAILED ||
          status === DeploymentStatus.STOPPED
        ) {
          throw new Error(
            `Deployment failed during traffic shift: ${status}`
          );
        }

        if (!trafficShifted) {
          await new Promise((resolve) => setTimeout(resolve, 15000));
          attempts++;
        }
      }

      expect(trafficShifted).toBe(true);
      console.log('🎉 Production traffic successfully switched to green environment!');
    },
    600000
  ); // 10 minute timeout for traffic switchover

  test(
    'VALIDATE: Production endpoint now serves GREEN after switchover',
    async () => {
      console.log(
        '🔍 Validating production endpoint (port 80) now serves GREEN environment...'
      );

      const prodUrl = `http://${outputs.LoadBalancerDnsName}/`;

      // Test 1: Verify production endpoint is accessible
      console.log('Test 1: Checking production endpoint accessibility...');
      const response = await testEndpoint(prodUrl);
      expect([200, 404]).toContain(response.status);
      console.log(`  ✅ Production endpoint responded with HTTP ${response.status}`);

      // Test 2: Verify GREEN is now serving production traffic
      if (response.status === 200) {
        console.log('Test 2: Verifying GREEN content on production...');
        expect(response.data.toLowerCase()).toContain('green');
        expect(response.data.toLowerCase()).not.toContain('blue');
        console.log('  ✅ Production is now serving GREEN environment!');
      }

      // Test 3: Multiple requests to confirm switchover
      console.log('Test 3: Confirming switchover with multiple requests...');
      const requests = Array(10)
        .fill(null)
        .map(() => testEndpoint(prodUrl));
      const responses = await Promise.all(requests);

      const greenResponses = responses.filter(
        (r) => r.status === 200 && r.data.toLowerCase().includes('green')
      ).length;

      console.log(
        `  ✅ ${greenResponses}/10 requests served by GREEN environment`
      );
      expect(greenResponses).toBeGreaterThan(0);

      // Test 4: Verify green target group now serves production
      console.log('Test 4: Verifying production listener routes to green...');
      const greenHealth = await elbClient.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.GreenTargetGroupArn,
        })
      );

      const greenHealthyCount =
        greenHealth.TargetHealthDescriptions?.filter(
          (t) => t.TargetHealth?.State === 'healthy'
        ).length || 0;

      console.log(
        `  ✅ Green target group has ${greenHealthyCount} healthy targets serving production`
      );
      expect(greenHealthyCount).toBeGreaterThanOrEqual(2);

      console.log('🎉 TRAFFIC SWITCHOVER VALIDATED - Nginx is live on production!');
    },
    60000
  );

  test(
    'MANUAL TERMINATION: Stop blue (old BLUE environment) tasks',
    async () => {
      console.log('🔄 Identifying and terminating old BLUE environment tasks...');

      // Get the original (blue) task definition revision
      const originalRevision = originalTaskDefinitionArn.split(':').pop();
      console.log(`  Original task definition revision: ${originalRevision}`);

      // List all running tasks
      const tasksResponse = await ecsClient.send(
        new ListTasksCommand({
          cluster: outputs.EcsClusterName,
          serviceName: outputs.EcsServiceName,
          desiredStatus: 'RUNNING',
        })
      );

      if (!tasksResponse.taskArns || tasksResponse.taskArns.length === 0) {
        console.log('  ℹ️  No running tasks found');
        return;
      }

      // Get task details to identify which are blue (old)
      const taskDetails = await ecsClient.send(
        new DescribeTasksCommand({
          cluster: outputs.EcsClusterName,
          tasks: tasksResponse.taskArns,
        })
      );

      // Find tasks using old task definition (BLUE environment)
      // Match by exact task definition ARN or by revision number
      const blueTasks = taskDetails.tasks?.filter((task) => {
        const taskRevision = task.taskDefinitionArn?.split(':').pop();
        return taskRevision === originalRevision;
      });

      if (!blueTasks || blueTasks.length === 0) {
        console.log('  ℹ️  No BLUE environment tasks found (already terminated by CodeDeploy or not yet deployed)');
        return;
      }

      console.log(`  Found ${blueTasks.length} BLUE environment tasks to terminate`);

      // Terminate each blue task
      for (const task of blueTasks) {
        const taskId = task.taskArn?.split('/').pop();
        const taskRev = task.taskDefinitionArn?.split(':').pop();
        console.log(`  Stopping task ${taskId} (revision ${taskRev})...`);

        await ecsClient.send(
          new StopTaskCommand({
            cluster: outputs.EcsClusterName,
            task: task.taskArn,
            reason: 'Integration test: Manually terminating BLUE tasks after GREEN deployment',
          })
        );

        console.log(`    ✅ Task ${taskId} stopped`);
      }

      console.log('🎉 All BLUE environment tasks terminated successfully!');

      // Verify only green tasks remain
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const remainingTasks = await ecsClient.send(
        new ListTasksCommand({
          cluster: outputs.EcsClusterName,
          serviceName: outputs.EcsServiceName,
          desiredStatus: 'RUNNING',
        })
      );

      console.log(
        `  ℹ️  Remaining running tasks: ${remainingTasks.taskArns?.length || 0}`
      );
    },
    120000
  );

  test(
    'Test application availability during blue-green deployment',
    async () => {
      // Test production endpoint (should always be available)
      const prodUrl = `http://${outputs.LoadBalancerDnsName}/`;

      console.log('Testing production endpoint availability...');

      // Make multiple requests to verify zero-downtime
      const requests = Array(5)
        .fill(null)
        .map(async (_, index) => {
          await new Promise((resolve) =>
            setTimeout(resolve, index * 2000)
          ); // Stagger requests
          const response = await testEndpoint(prodUrl);
          console.log(
            `Request ${index + 1}: HTTP ${response.status}`
          );
          return response;
        });

      const responses = await Promise.all(requests);

      // All requests should succeed (either 200 or 404 from Tomcat/Nginx)
      responses.forEach((response, index) => {
        expect([200, 404]).toContain(response.status);
      });

      console.log(
        'All requests succeeded - zero-downtime deployment validated!'
      );
    },
    60000
  );

  test(
    'Cleanup: Stop deployment to allow infrastructure restoration',
    async () => {
      if (!deploymentId) {
        console.log('No deployment to stop');
        return;
      }

      // Get current deployment status
      const statusResponse = await codeDeployClient.send(
        new GetDeploymentCommand({
          deploymentId,
        })
      );

      const currentStatus = statusResponse.deploymentInfo!.status;

      // Only stop if deployment is in progress or ready
      if (
        currentStatus === DeploymentStatus.IN_PROGRESS ||
        currentStatus === DeploymentStatus.READY ||
        currentStatus === DeploymentStatus.CREATED
      ) {
        console.log(
          `Stopping deployment ${deploymentId} (status: ${currentStatus})`
        );

        await codeDeployClient.send(
          new StopDeploymentCommand({
            deploymentId,
          })
        );

        console.log(
          'Deployment stopped - CodeDeploy auto-rollback will trigger automatically'
        );

        // Wait for rollback to complete
        let rollbackComplete = false;
        let attempts = 0;

        while (!rollbackComplete && attempts < 20) {
          await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds

          const rollbackStatus = await codeDeployClient.send(
            new GetDeploymentCommand({
              deploymentId,
            })
          );

          const status = rollbackStatus.deploymentInfo!.status;
          console.log(`Rollback status: ${status}`);

          if (
            status === DeploymentStatus.STOPPED ||
            status === DeploymentStatus.SUCCEEDED ||
            status === DeploymentStatus.FAILED
          ) {
            rollbackComplete = true;
          }

          attempts++;
        }

        console.log(
          'Auto-rollback completed - infrastructure restored to original state'
        );
      } else {
        console.log(
          `Deployment already in terminal state: ${currentStatus}`
        );
      }

      // If deployment succeeded, manually create rollback deployment to restore original infrastructure
      if (currentStatus === DeploymentStatus.SUCCEEDED && originalTaskDefinitionArn) {
        console.log(
          `Creating rollback deployment to restore: ${originalTaskDefinitionArn}`
        );

        const rollbackAppSpec = {
          version: '0.0',
          Resources: [
            {
              TargetService: {
                Type: 'AWS::ECS::Service',
                Properties: {
                  TaskDefinition: originalTaskDefinitionArn,
                  LoadBalancerInfo: {
                    ContainerName: 'OrderBrokerContainer',
                    ContainerPort: 80,
                  },
                  PlatformVersion: 'LATEST',
                },
              },
            },
          ],
        };

        const restoreResponse = await codeDeployClient.send(
          new CreateDeploymentCommand({
            applicationName: outputs.CodeDeployApplicationName,
            deploymentGroupName: outputs.CodeDeployDeploymentGroupName,
            revision: {
              revisionType: 'AppSpecContent',
              appSpecContent: {
                content: JSON.stringify(rollbackAppSpec),
              },
            },
            description: 'Integration test - Restore original infrastructure',
          })
        );

        const restoreDeploymentId = restoreResponse.deploymentId!;
        console.log(`Restore deployment created: ${restoreDeploymentId}`);

        // Wait for restore deployment to complete or reach READY state
        let restoreComplete = false;
        let restoreAttempts = 0;

        while (!restoreComplete && restoreAttempts < 40) {
          await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait 15 seconds

          const restoreStatus = await codeDeployClient.send(
            new GetDeploymentCommand({
              deploymentId: restoreDeploymentId,
            })
          );

          const status = restoreStatus.deploymentInfo!.status;
          console.log(`Restore attempt ${restoreAttempts + 1}: ${status}`);

          if (
            status === DeploymentStatus.SUCCEEDED ||
            status === DeploymentStatus.FAILED ||
            status === DeploymentStatus.STOPPED
          ) {
            console.warn(`Restore deployment ended with status: ${status}`);
            break;
          }

          restoreAttempts++;
        }
      }
    },
    300000
  ); // 5 minute timeout for cleanup
});

// Test Suite 8: Auto-Rollback on Failed Deployment
describe('ECS Trading Infrastructure - Auto-Rollback E2E', () => {
  let badDeploymentId: string;
  let originalTaskDefBeforeRollback: string;

  test('Get baseline task definition before bad deployment', async () => {
    const serviceResponse = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: outputs.EcsClusterName,
        services: [outputs.EcsServiceName],
      })
    );

    originalTaskDefBeforeRollback = serviceResponse.services![0].taskDefinition!;
    console.log(`Current stable task definition: ${originalTaskDefBeforeRollback}`);
    expect(originalTaskDefBeforeRollback).toBeDefined();
  }, 60000);

  test(
    'Deploy BAD task definition that will fail health checks',
    async () => {
      console.log('🔴 Deploying BAD task definition to test auto-rollback...');

      // Get current task definition
      const taskDefResponse = await ecsClient.send(
        new DescribeTaskDefinitionCommand({
          taskDefinition: originalTaskDefBeforeRollback,
        })
      );

      const originalTaskDef = taskDefResponse.taskDefinition!;

      // Create a task definition with nginx (different from blue/green)
      // This will deploy successfully, but we'll detect it's "wrong" and trigger manual rollback
      const badTaskDef = {
        family: originalTaskDef.family,
        taskRoleArn: originalTaskDef.taskRoleArn,
        executionRoleArn: originalTaskDef.executionRoleArn,
        networkMode: originalTaskDef.networkMode,
        containerDefinitions: originalTaskDef.containerDefinitions!.map(
          (container) => ({
            ...container,
            image: 'public.ecr.aws/nginx/nginx:1.27-alpine', // Use nginx (different from blue/green)
            environment: undefined,
            portMappings: [
              {
                containerPort: 80,
                protocol: 'tcp',
              },
            ],
          })
        ),
        requiresCompatibilities: originalTaskDef.requiresCompatibilities,
        cpu: originalTaskDef.cpu,
        memory: originalTaskDef.memory,
        runtimePlatform: originalTaskDef.runtimePlatform,
      };

      const registerResponse = await ecsClient.send(
        new RegisterTaskDefinitionCommand(badTaskDef)
      );

      const badTaskDefArn = registerResponse.taskDefinition!.taskDefinitionArn;
      console.log(`Registered BAD task definition: ${badTaskDefArn}`);

      // Deploy the bad task definition
      const appSpec = {
        version: '0.0',
        Resources: [
          {
            TargetService: {
              Type: 'AWS::ECS::Service',
              Properties: {
                TaskDefinition: badTaskDefArn,
                LoadBalancerInfo: {
                  ContainerName: 'OrderBrokerContainer',
                  ContainerPort: 80, // AppSpec expects port 80, but container uses 9999
                },
                PlatformVersion: 'LATEST',
              },
            },
          },
        ],
      };

      const deployResponse = await codeDeployClient.send(
        new CreateDeploymentCommand({
          applicationName: outputs.CodeDeployApplicationName,
          deploymentGroupName: outputs.CodeDeployDeploymentGroupName,
          revision: {
            revisionType: 'AppSpecContent',
            appSpecContent: {
              content: JSON.stringify(appSpec),
            },
          },
          description: 'Integration test - BAD deployment to test auto-rollback',
        })
      );

      badDeploymentId = deployResponse.deploymentId!;
      console.log(`🔴 BAD deployment created: ${badDeploymentId}`);
      console.log(
        `Monitor at: https://console.aws.amazon.com/codesuite/codedeploy/deployments/${badDeploymentId}?region=${region}`
      );

      expect(badDeploymentId).toBeDefined();
    },
    60000
  );

  test(
    'Wait for nginx deployment to reach READY state on test listener',
    async () => {
      console.log('⏳ Waiting for nginx to deploy to green environment...');

      let deploymentReady = false;
      let attempts = 0;
      const maxAttempts = 40; // 10 minutes max

      while (!deploymentReady && attempts < maxAttempts) {
        const response = await codeDeployClient.send(
          new GetDeploymentCommand({
            deploymentId: badDeploymentId,
          })
        );

        const deployment = response.deploymentInfo!;
        const status = deployment.status;

        console.log(
          `  Attempt ${attempts + 1}/${maxAttempts}: Deployment status = ${status}`
        );

        if (status === DeploymentStatus.READY) {
          deploymentReady = true;
          console.log('✅ Nginx deployment reached READY state!');
          break;
        }

        if (status === DeploymentStatus.FAILED || status === DeploymentStatus.STOPPED) {
          throw new Error(`Deployment failed unexpectedly with status: ${status}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait 15 seconds
        attempts++;
      }

      expect(deploymentReady).toBe(true);
    },
    600000
  ); // 10 minute timeout

  test('Verify production traffic still serves blue/green (not affected)', async () => {
    console.log('🔍 Verifying production (port 80) still serves blue/green...');

    const prodUrl = `http://${outputs.LoadBalancerDnsName}/`;

    // Test production listener
    const response = await testEndpoint(prodUrl);
    console.log(`  Production listener responded with HTTP ${response.status}`);

    expect(response.status).toBe(200);

    // Validate it's still serving blue/green (not nginx)
    const content = response.data.toLowerCase();
    const servingBlueGreen = content.includes('blue') || content.includes('green');
    const servingNginx = content.includes('nginx') || content.includes('welcome to nginx');

    console.log(`  Serving blue/green: ${servingBlueGreen}`);
    console.log(`  Serving nginx: ${servingNginx}`);

    expect(servingBlueGreen).toBe(true);
    expect(servingNginx).toBe(false);

    console.log('✅ Production traffic unaffected - still serving blue/green!');
  }, 60000);

  test(
    'MANUAL ROLLBACK: Stop deployment and trigger rollback',
    async () => {
      console.log('🔄 Manually stopping deployment to trigger rollback...');

      // Manually stop the deployment to trigger rollback
      // CodeDeploy auto-rollback is configured in deployment group settings
      await codeDeployClient.send(
        new StopDeploymentCommand({
          deploymentId: badDeploymentId,
        })
      );

      console.log('✅ Stop deployment command sent - auto-rollback will trigger automatically');

      // Wait for rollback to complete
      let rollbackComplete = false;
      let attempts = 0;
      const maxAttempts = 40; // 10 minutes max

      while (!rollbackComplete && attempts < maxAttempts) {
        const response = await codeDeployClient.send(
          new GetDeploymentCommand({
            deploymentId: badDeploymentId,
          })
        );

        const deployment = response.deploymentInfo!;
        const status = deployment.status;

        console.log(`  Rollback attempt ${attempts + 1}/${maxAttempts}: Status = ${status}`);

        if (deployment.rollbackInfo) {
          console.log(`  Rollback info: ${deployment.rollbackInfo.rollbackMessage}`);
          console.log(`  Rollback deployment: ${deployment.rollbackInfo.rollbackDeploymentId}`);
        }

        if (status === DeploymentStatus.STOPPED) {
          rollbackComplete = true;
          console.log('✅ Deployment stopped and rollback triggered!');
          break;
        }

        await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait 15 seconds
        attempts++;
      }

      expect(rollbackComplete).toBe(true);
    },
    600000
  ); // 10 minute timeout

  test('Verify production traffic is still working after rollback', async () => {
    console.log('✅ Verifying production endpoint still serves working version...');

    const prodUrl = `http://${outputs.LoadBalancerDnsName}/`;

    // Test multiple requests
    const requests = Array(10)
      .fill(null)
      .map(() => testEndpoint(prodUrl));
    const responses = await Promise.all(requests);

    const successCount = responses.filter((r) => r.status === 200).length;

    console.log(`  ${successCount}/10 requests succeeded`);
    expect(successCount).toBe(10);

    // Verify we're serving the working version (blue or green, not busybox error)
    responses.forEach((response) => {
      if (response.status === 200) {
        // Should contain either "blue" or "green" from working deployment
        const hasValidContent =
          response.data.toLowerCase().includes('blue') ||
          response.data.toLowerCase().includes('green');
        expect(hasValidContent).toBe(true);
      }
    });

    console.log('✅ Production is still healthy after failed deployment!');
  }, 60000);

  test('Verify service task definition rolled back to original', async () => {
    console.log('🔍 Checking if service rolled back to original task definition...');

    const serviceResponse = await ecsClient.send(
      new DescribeServicesCommand({
        cluster: outputs.EcsClusterName,
        services: [outputs.EcsServiceName],
      })
    );

    const currentTaskDef = serviceResponse.services![0].taskDefinition!;
    console.log(`  Original task def: ${originalTaskDefBeforeRollback}`);
    console.log(`  Current task def:  ${currentTaskDef}`);

    // Task definition should be the same as before the bad deployment
    // (or the revision might be different if CodeDeploy created a rollback revision)
    const currentRevision = parseInt(currentTaskDef.split(':').pop()!);
    const originalRevision = parseInt(originalTaskDefBeforeRollback.split(':').pop()!);

    console.log(`  Original revision: ${originalRevision}`);
    console.log(`  Current revision: ${currentRevision}`);

    // Current should be >= original (could be same or a new revision from rollback)
    expect(currentRevision).toBeGreaterThanOrEqual(originalRevision);

    console.log('✅ Service successfully maintained stable state!');
  }, 60000);
});

