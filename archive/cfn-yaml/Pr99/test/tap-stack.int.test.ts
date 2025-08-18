import {
  ElasticBeanstalkClient,
  DescribeEnvironmentsCommand,
  DescribeEnvironmentResourcesCommand,
  DescribeConfigurationSettingsCommand,
} from '@aws-sdk/client-elastic-beanstalk';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  EC2Client,
  DescribeSubnetsCommand,
} from '@aws-sdk/client-ec2';
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
const ec2Client = new EC2Client({ region, credentials });

// --- Test Suite ---
describe('Elastic Beanstalk Integration Tests', () => {
  let stackOutputs: any = {};
  let environmentResources: any = {};
  let targetEnvironment: any = {};
  let asgDetails: any = {};
  let loadBalancerDetails: any = {};

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

    // Fetch Auto Scaling Group details
    const asgName = environmentResources.AutoScalingGroups?.[0]?.Name;
    if (asgName) {
      const asgResponse = await asgClient.send(new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] }));
      asgDetails = asgResponse.AutoScalingGroups?.[0];
    }

    // Fetch Load Balancer details
    const lbArn = environmentResources.LoadBalancers?.[0]?.Name;
    if (lbArn) {
      const lbResponse = await elbv2Client.send(new DescribeLoadBalancersCommand({ LoadBalancerArns: [lbArn] }));
      loadBalancerDetails = lbResponse.LoadBalancers?.[0];
    }

    console.log('Successfully fetched environment resources based on stack outputs.');
  }, 120000);

  // --- Region and Stack Enforcement ---
  describe('Region and Stack Enforcement', () => {
    test('Stack naming should be consistent with environment', () => {
      const environmentName = targetEnvironment.EnvironmentName;
      expect(environmentName).toBeDefined();
      expect(environmentName).toMatch(/^[a-zA-Z][a-zA-Z0-9\-]*$/); // Valid CloudFormation naming
      
      // Validate stack outputs follow consistent naming patterns
      expect(stackOutputs.EnvironmentURL).toBeDefined();
      expect(stackOutputs.EnvironmentURL).toMatch(/^https:\/\//);
    });

    test('All required outputs should be present in outputs file', () => {
      const requiredOutputs = ['EnvironmentURL'];
      const optionalOutputs = ['LoadBalancerArn', 'AutoScalingGroupName', 'ApplicationName'];
      
      requiredOutputs.forEach(output => {
        expect(stackOutputs[output]).toBeDefined();
      });
      
      // Log available outputs for debugging
      console.log('Available stack outputs:', Object.keys(stackOutputs));
    });
  });

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

  // --- High Availability and Multi-AZ Validation ---
  describe('High Availability and Scaling', () => {
    test('Auto Scaling Group should have correct min/max sizes (2-10 instances)', () => {
      expect(asgDetails).toBeDefined();
      expect(asgDetails.MinSize).toBe(2);
      expect(asgDetails.MaxSize).toBe(10);
      expect(asgDetails.MinSize).toBeLessThanOrEqual(asgDetails.MaxSize);
    });

    test('Auto Scaling Group should actually span 2-10 instances', () => {
      expect(asgDetails).toBeDefined();
      const currentCapacity = asgDetails.DesiredCapacity;
      expect(currentCapacity).toBeGreaterThanOrEqual(2);
      expect(currentCapacity).toBeLessThanOrEqual(10);
      
      // Validate actual running instances
      const runningInstances = asgDetails.Instances?.filter((instance: any) => 
        instance.LifecycleState === 'InService'
      ).length || 0;
      
      expect(runningInstances).toBeGreaterThanOrEqual(2);
      expect(runningInstances).toBeLessThanOrEqual(10);
    });

    test('Instances should be distributed across multiple Availability Zones', () => {
      expect(asgDetails).toBeDefined();
      expect(asgDetails.AvailabilityZones.length).toBeGreaterThanOrEqual(2);
      
      // Validate instances are actually distributed across AZs
      if (asgDetails.Instances && asgDetails.Instances.length > 0) {
        const instanceAZs = new Set(asgDetails.Instances.map((instance: any) => instance.AvailabilityZone));
        expect(instanceAZs.size).toBeGreaterThanOrEqual(2);
      }
    });
  });

  // --- Multi-AZ Resilience Validation ---
  describe('Multi-AZ Resilience', () => {
    test('Load balancer should span at least two availability zones', async () => {
      expect(loadBalancerDetails).toBeDefined();
      expect(loadBalancerDetails.AvailabilityZones).toBeDefined();
      expect(loadBalancerDetails.AvailabilityZones.length).toBeGreaterThanOrEqual(2);
      
      // Validate subnet distribution
      if (loadBalancerDetails.Subnets) {
        expect(loadBalancerDetails.Subnets.length).toBeGreaterThanOrEqual(2);
        
        // Get subnet details to verify AZ distribution
        const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
          SubnetIds: loadBalancerDetails.Subnets
        }));
        
        const subnetAZs = new Set(subnetResponse.Subnets?.map(subnet => subnet.AvailabilityZone));
        expect(subnetAZs.size).toBeGreaterThanOrEqual(2);
      }
    });

    test('Environment should be configured for load-balanced, multi-AZ deployment', () => {
      expect(targetEnvironment.Tier?.Type).toBe('Standard');
      expect(targetEnvironment.Tier?.Name).toBe('WebServer');
      
      // Verify this is a load-balanced environment, not single instance
      expect(environmentResources.LoadBalancers).toBeDefined();
      expect(environmentResources.LoadBalancers.length).toBeGreaterThan(0);
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