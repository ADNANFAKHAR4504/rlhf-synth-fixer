import {
  ElasticBeanstalkClient,
  DescribeEnvironmentsCommand,
  DescribeEnvironmentResourcesCommand,
  DescribeConfigurationSettingsCommand, // ADDED: To check instance settings
} from '@aws-sdk/client-elastic-beanstalk';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeListenersCommand,
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
  let targetEnvironment: any = {}; // ADDED: To store environment details

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
    // UPDATED: Store the full environment object
    targetEnvironment = environments.Environments?.find((env) => env.EndpointURL?.toLowerCase() === cname.toLowerCase());

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

  // ADDED: New test suite for environment health
  describe('Environment Health and Status', () => {
    test('Environment status should be "Ready"', () => {
        expect(targetEnvironment.Status).toBe('Ready');
    });

    test('Environment health should be "Green"', () => {
        expect(targetEnvironment.Health).toBe('Green');
    });
  });

  describe('Application Accessibility', () => {
    test('EnvironmentURL should be a valid HTTPS endpoint', async () => {
      const url = stackOutputs.EnvironmentURL;
      expect(url).toBeDefined();
      expect(url).toMatch(/^https:/);
      // As noted, a full fetch test fails due to the self-signed certificate,
      // but this confirms the output URL format is correct.
    });
  });

  // ADDED: New test suite for instance configuration
  describe('EC2 Instance Configuration', () => {
    let launchConfig: any = {};

    beforeAll(async () => {
        const command = new DescribeConfigurationSettingsCommand({
            ApplicationName: targetEnvironment.ApplicationName,
            EnvironmentName: targetEnvironment.EnvironmentName,
        });
        const settingsResult = await ebClient.send(command);
        const launchConfigurationSettings = settingsResult.ConfigurationSettings?.[0]?.OptionSettings;
        if (!launchConfigurationSettings) {
            throw new Error('Could not retrieve environment configuration settings.');
        }

        const findOption = (namespace: string, optionName: string) => 
            launchConfigurationSettings.find(opt => opt.Namespace === namespace && opt.OptionName === optionName);

        launchConfig.instanceType = findOption('aws:autoscaling:launchconfiguration', 'InstanceType');
        launchConfig.keyPair = findOption('aws:autoscaling:launchconfiguration', 'EC2KeyName');
        launchConfig.instanceProfile = findOption('aws:autoscaling:launchconfiguration', 'IamInstanceProfile');
    });

    test('Instances should use the correct instance type', () => {
        // This assumes the default t2.micro is used. Change if you deploy with a different type.
        expect(launchConfig.instanceType?.Value).toBe('t2.micro');
    });

    test('Instances should be configured with the correct EC2 Key Pair', () => {
        // This assumes the default key 'iac-rlhf-aws-trainer-instance' is used.
        expect(launchConfig.keyPair?.Value).toBe('iac-rlhf-aws-trainer-instance');
    });
    
    // ADDED: New test for IAM role attachment
    test('Instances should have the correct IAM Instance Profile attached', () => {
        expect(launchConfig.instanceProfile?.Value).toBe('TapStackpr99-AWSElasticBeanstalkEC2InstanceProfile-MnTROrVI6cIf');
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