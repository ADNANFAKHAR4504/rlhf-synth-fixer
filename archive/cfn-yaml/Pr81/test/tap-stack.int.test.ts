import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  ElasticBeanstalkClient,
  DescribeEnvironmentsCommand,
} from '@aws-sdk/client-elastic-beanstalk';
import fs from 'fs';

// --- Configuration ---
// Ensure this matches the suffix used for deployment.
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr99';
const stackName = `TapStack${environmentSuffix}`;
const region = 'us-east-1'; // The region where the stack is deployed.

// --- AWS SDK Clients ---
const cfnClient = new CloudFormationClient({ region });
const ebClient = new ElasticBeanstalkClient({ region });

// --- Test Suite ---
describe('Elastic Beanstalk Integration Tests', () => {
  let stackOutputs: any = {};
  let stackResources: any = {};

  // Fetch stack details before running tests
  beforeAll(async () => {
    try {
      // Get stack outputs
      const describeStacksCommand = new DescribeStacksCommand({
        StackName: stackName,
      });
      const stackResult = await cfnClient.send(describeStacksCommand);

      if (stackResult.Stacks?.[0]?.Outputs) {
        stackResult.Stacks[0].Outputs.forEach(output => {
          if (output.OutputKey && output.OutputValue) {
            stackOutputs[output.OutputKey] = output.OutputValue;
          }
        });
      }

      // Get stack resources
      const listResourcesCommand = new ListStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResult = await cfnClient.send(listResourcesCommand);

      if (resourcesResult.StackResourceSummaries) {
        resourcesResult.StackResourceSummaries.forEach(resource => {
          if (resource.LogicalResourceId && resource.PhysicalResourceId) {
            stackResources[resource.LogicalResourceId] =
              resource.PhysicalResourceId;
          }
        });
      }

      console.log('Stack outputs:', stackOutputs);
      console.log('Stack resources:', Object.keys(stackResources));
    } catch (error) {
      console.warn('Could not fetch stack information:', error);
      console.warn(
        'Some tests may be skipped if deployment outputs are not available.'
      );
    }
  }, 60000); // Increased timeout for AWS API calls

  describe('CloudFormation Stack Validation', () => {
    test('stack should exist and be in a successful state', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const result = await cfnClient.send(command);
      expect(result.Stacks).toHaveLength(1);
      // The stack should be in a complete state
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
        result.Stacks![0].StackStatus
      );
    });

    test('stack should have all expected Elastic Beanstalk resources', async () => {
      const expectedResources = [
        'AWSElasticBeanstalkServiceRole',
        'AWSElasticBeanstalkEC2Role',
        'AWSElasticBeanstalkEC2InstanceProfile',
        'WebAppApplication',
        'WebAppEnvironment',
      ];

      expectedResources.forEach(resourceName => {
        expect(stackResources[resourceName]).toBeDefined();
      });
    });

    test('stack should have the required EnvironmentURL output', async () => {
      expect(stackOutputs.EnvironmentURL).toBeDefined();
      expect(stackOutputs.EnvironmentURL).toContain('http://');
      expect(stackOutputs.EnvironmentURL).toContain('.us-east-1.elb.amazonaws.com');
    });
  });

  describe('Elastic Beanstalk Environment Health', () => {
    test('Elastic Beanstalk environment should be healthy', async () => {
      const command = new DescribeEnvironmentsCommand({
        EnvironmentIds: [stackResources.WebAppEnvironment],
      });

      const result = await ebClient.send(command);
      expect(result.Environments).toHaveLength(1);

      const environment = result.Environments![0];
      // A successfully deployed environment should have a 'Green' health status
      expect(environment.Health).toBe('Green');
      expect(environment.Status).toBe('Ready');
    });
  });

  describe('Application Accessibility', () => {
    test('EnvironmentURL should be accessible over the internet', async () => {
      const url = stackOutputs.EnvironmentURL;
      expect(url).toBeDefined();

      let response;
      try {
        response = await fetch(url);
      } catch (error) {
        // Fail the test if the fetch itself throws an error (e.g., DNS resolution failure)
        fail(`Failed to fetch the EnvironmentURL: ${error}`);
      }
      
      // Since no application is deployed, we expect a 503 (Service Unavailable)
      // from the load balancer as it can't get a healthy response from the instances.
      // Getting any valid HTTP response proves the networking is up.
      expect(response.status).toBe(503);
    });
  });
});
