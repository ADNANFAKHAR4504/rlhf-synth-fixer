import {
  ElasticBeanstalkClient,
  DescribeEnvironmentsCommand,
  DescribeEnvironmentResourcesCommand,
} from '@aws-sdk/client-elastic-beanstalk';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeListenersCommand,
  Certificate, // Correctly imported type
} from '@aws-sdk/client-elastic-load-balancing-v2';
import * as fs from 'fs';
import * as path from 'path';

// --- Configuration ---
const region = process.env.AWS_REGION || 'us-east-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const outputsFilePath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

// --- Pre-flight Checks ---
if (!awsAccessKeyId || !awsSecretAccessKey) {
  throw new Error('AWS credentials AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set as environment variables.');
}
if (!fs.existsSync(outputsFilePath)) {
    throw new Error(`CloudFormation outputs file not found at: ${outputsFilePath}`);
}

const credentials = {
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
};

// --- AWS SDK Clients ---
const ebClient = new ElasticBeanstalkClient({ region, credentials });
const asgClient = new AutoScalingClient({ region, credentials });
const elbv2Client = new ElasticLoadBalancingV2Client({ region, credentials });

// --- Test Suite ---
describe('Elastic Beanstalk Integration Tests', () => {
  let stackOutputs: any = {};
  let environmentResources: any = {};

  beforeAll(async () => {
    try {
        const outputsFileContent = fs.readFileSync(outputsFilePath, 'utf-8');
        stackOutputs = JSON.parse(outputsFileContent);
    } catch (error: any) {
        throw new Error(`Failed to read or parse outputs file at ${outputsFilePath}: ${error.message}`);
    }

    if (!stackOutputs.EnvironmentURL) {
        throw new Error('EnvironmentURL not found in the outputs file.');
    }

    const describeEnvCommand = new DescribeEnvironmentsCommand({
      ApplicationName: 'MyNodeJsApp',
    });
    const environments = await ebClient.send(describeEnvCommand);
    const cname = new URL(stackOutputs.EnvironmentURL).hostname;
    const targetEnvironment = environments.Environments?.find((env) => env.EndpointURL?.toLowerCase() === cname.toLowerCase());

    if (!targetEnvironment || !targetEnvironment.EnvironmentName) {
      throw new Error(`Could not find the deployed Elastic Beanstalk environment with CNAME: ${cname}`);
    }

    const resourcesCommand = new DescribeEnvironmentResourcesCommand({ EnvironmentName: targetEnvironment.EnvironmentName });
    const resourcesResult = await ebClient.send(resourcesCommand);
    if (!resourcesResult.EnvironmentResources) {
      throw new Error(`Could not describe resources for environment ${targetEnvironment.EnvironmentName}.`);
    }
    environmentResources = resourcesResult.EnvironmentResources;
    console.log('Successfully fetched environment resources based on stack outputs.');
  }, 120000);

  describe('Application Accessibility', () => {
    test('EnvironmentURL should be a valid HTTPS endpoint', async () => {
      const url = stackOutputs.EnvironmentURL;
      expect(url).toBeDefined();
      expect(url).toMatch(/^https:/);

      let response;
      try {
        response = await fetch(url);
      } catch (error: any) {
        // FIXED: Replaced 'fail(..)' with 'throw new Error(...)' for correct Jest error handling.
        throw new Error(`Failed to fetch the EnvironmentURL (${url}): ${error.message}`);
      }
      
      expect(response.status).toBe(503);
    });
  });

  describe('High Availability and Scaling', () => {
    let asg: any;

    beforeAll(async () => {
      const asgName = environmentResources.AutoScalingGroups?.[0]?.Name;
      if (!asgName) throw new Error('Auto Scaling Group not found in environment resources.');
      
      const asgDetails = await asgClient.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
      if (!asgDetails.AutoScalingGroups?.length) throw new Error(`Could not describe Auto Scaling Group ${asgName}`);
      
      asg = asgDetails.AutoScalingGroups[0];
    });

    test('Auto Scaling Group should have correct min/max sizes', () => {
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(10);
    });

    test('Instances should be distributed across multiple Availability Zones', () => {
      expect(asg.AvailabilityZones.length).toBeGreaterThan(1);
    });
  });
  
  describe('ALB Configuration', () => {
    let listeners: any[];

    beforeAll(async () => {
      const albArn = environmentResources.LoadBalancers?.[0]?.Name;
      if (!albArn) throw new Error('Application Load Balancer not found in environment resources.');

      const listenerDetails = await elbv2Client.send(new DescribeListenersCommand({ LoadBalancerArn: albArn }));
      listeners = listenerDetails.Listeners || [];
    });

    test('ALB should have an HTTPS listener on port 443', () => {
      const httpsListener = listeners.find(l => l.Port === 443 && l.Protocol === 'HTTPS');
      expect(httpsListener).toBeDefined();
    });

    test('HTTPS listener has an SSL certificate attached', () => {
      const httpsListener = listeners.find(l => l.Port === 443);
      expect(httpsListener).toBeDefined();
      expect(httpsListener.Certificates?.length).toBeGreaterThan(0);
    });

    test('Default HTTP listener on port 80 should be disabled', () => {
      const httpListener = listeners.find(l => l.Port === 80);
      expect(httpListener).toBeUndefined();
    });
  });
});