import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
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
} from '@aws-sdk/client-elastic-load-balancing-v2';

// --- Configuration ---
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr99';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';
const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
// The SSL Certificate ARN is needed to validate the listener configuration
const sslCertificateArn = process.env.SSL_CERTIFICATE_ARN;

// --- Pre-flight Checks ---
if (!awsAccessKeyId || !awsSecretAccessKey) {
  throw new Error('AWS credentials AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set as environment variables.');
}
if (!sslCertificateArn) {
  throw new Error('SSL_CERTIFICATE_ARN environment variable must be set for validation.');
}

const credentials = {
  accessKeyId: awsAccessKeyId,
  secretAccessKey: awsSecretAccessKey,
};

// --- AWS SDK Clients ---
const cfnClient = new CloudFormationClient({ region, credentials });
const ebClient = new ElasticBeanstalkClient({ region, credentials });
const asgClient = new AutoScalingClient({ region, credentials });
const elbv2Client = new ElasticLoadBalancingV2Client({ region, credentials });

// --- Test Suite ---
describe('Elastic Beanstalk Integration Tests', () => {
  let stackOutputs: any = {};
  let environmentResources: any = {};

  // Fetch live data from the deployed AWS resources before running tests
  beforeAll(async () => {
    // 1. Get Stack Outputs (like the environment URL)
    const describeStacksCommand = new DescribeStacksCommand({ StackName: stackName });
    const stackInfo = await cfnClient.send(describeStacksCommand);
    if (!stackInfo.Stacks || stackInfo.Stacks.length === 0) {
      throw new Error(`Stack ${stackName} not found.`);
    }
    stackInfo.Stacks[0].Outputs?.forEach(output => {
      if (output.OutputKey) {
        stackOutputs[output.OutputKey] = output.OutputValue;
      }
    });

    // 2. Find the correct Elastic Beanstalk environment using its CNAME
    const describeEnvCommand = new DescribeEnvironmentsCommand({
      ApplicationName: 'MyNodeJsApp', // Matches the default Parameter
    });
    const environments = await ebClient.send(describeEnvCommand);
    const cname = new URL(stackOutputs.EnvironmentURL).hostname;
    const targetEnvironment = environments.Environments?.find(env => env.CNAME === cname);

    if (!targetEnvironment || !targetEnvironment.EnvironmentName) {
      throw new Error("Could not find the deployed Elastic Beanstalk environment by its CNAME.");
    }

    // 3. Fetch the physical resources of the environment (ALB, ASG, etc.)
    const resourcesCommand = new DescribeEnvironmentResourcesCommand({ EnvironmentName: targetEnvironment.EnvironmentName });
    const resourcesResult = await ebClient.send(resourcesCommand);
    if (!resourcesResult.EnvironmentResources) {
      throw new Error(`Could not describe resources for environment ${targetEnvironment.EnvironmentName}.`);
    }
    environmentResources = resourcesResult.EnvironmentResources;
    console.log('Successfully fetched stack outputs and environment resources.');
  }, 120000); // Increased timeout for multiple AWS API calls

  describe('Application Accessibility', () => {
    test('EnvironmentURL should be a valid HTTPS endpoint', async () => {
      const url = stackOutputs.EnvironmentURL;
      expect(url).toBeDefined();
      expect(url).toMatch(/^https:/);

      let response;
      try {
        // Since no app is deployed, a 503 proves the ALB is routing traffic correctly.
        response = await fetch(url);
      } catch (error) {
        fail(`Failed to fetch the EnvironmentURL (${url}): ${error}`);
      }
      
      expect(response.status).toBe(503); // 503 Service Unavailable is expected
    });
  });

  describe('High Availability and Scaling', () => {
    let asg: any;

    beforeAll(async () => {
      const asgName = environmentResources.AutoScalingGroups?.[0]?.Name;
      if (!asgName) fail('Auto Scaling Group not found in environment resources.');
      
      const asgDetails = await asgClient.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
      if (!asgDetails.AutoScalingGroups?.length) fail(`Could not describe Auto Scaling Group ${asgName}`);
      
      asg = asgDetails.AutoScalingGroups[0];
    });

    test('Auto Scaling Group should have correct min/max sizes', () => {
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(10);
    });

    test('Instances should be distributed across multiple Availability Zones', () => {
      // A highly available setup should span at least two AZs.
      expect(asg.AvailabilityZones.length).toBeGreaterThan(1);
    });
  });
  
  describe('ALB Configuration', () => {
    let listeners: any[];

    beforeAll(async () => {
      const albArn = environmentResources.LoadBalancers?.[0]?.Name;
      if (!albArn) fail('Application Load Balancer not found in environment resources.');

      const listenerDetails = await elbv2Client.send(new DescribeListenersCommand({ LoadBalancerArn: albArn }));
      listeners = listenerDetails.Listeners || [];
    });

    test('ALB should have an HTTPS listener on port 443', () => {
      const httpsListener = listeners.find(l => l.Port === 443 && l.Protocol === 'HTTPS');
      expect(httpsListener).toBeDefined();
    });

    test('HTTPS listener should use the correct SSL certificate', () => {
      const httpsListener = listeners.find(l => l.Port === 443);
      expect(httpsListener).toBeDefined();
      
      const certificate = httpsListener.Certificates?.find(cert => cert.CertificateArn === sslCertificateArn);
      expect(certificate).toBeDefined();
    });

    test('Default HTTP listener on port 80 should be disabled', () => {
      const httpListener = listeners.find(l => l.Port === 80);
      // The listener is removed by the template setting, so it should be undefined.
      expect(httpListener).toBeUndefined();
    });
  });
});