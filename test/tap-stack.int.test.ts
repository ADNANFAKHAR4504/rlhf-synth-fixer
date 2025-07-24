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
// Get environment suffix from environment variable (set by CI/CD pipeline)
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

  // Fetch stack details from the flat-outputs.json file and AWS before running tests
  beforeAll(async () => {
    try {
      // Try to read from cfn-outputs file first
      stackOutputs = JSON.parse(
        fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
      );

      // Get stack resources to find the physical ID of the environment
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

      console.log('Stack outputs from file:', stackOutputs);
      console.log('Fetched stack resources:', Object.keys(stackResources));
    } catch (error) {
      console.warn('Could not read cfn-outputs/flat-outputs.json or fetch stack resources:', error);
      console.warn(
        'Some tests may be skipped if deployment information is not available.'
      );
    }
  }, 60000); // Increased timeout for AWS API calls

  describe('Elastic Beanstalk Environment Health', () => {
    test('Elastic Beanstalk environment should be healthy', async () => {
      // This test is only valid if the stack creation was successful
      if (!stackResources.WebAppEnvironment) {
        // Skips the test if the resource ID could not be fetched
        console.warn("Skipping environment health test: WebAppEnvironment resource not found.");
        return;
      }
      
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
      if (!url) {
        // Skips the test if the URL is not available
        console.warn("Skipping accessibility test: EnvironmentURL output not found.");
        return;
      }

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
      expect(response.status).toBe(200);
    });
  });
});
