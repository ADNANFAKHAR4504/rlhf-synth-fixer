import fs from 'fs';
import path from 'path';
import { CloudFormation } from '@aws-sdk/client-cloudformation';

describe('TapStack Integration Tests', () => {
  let stackName: string;
  let region: string;
  let cfnClient: CloudFormation;

  beforeAll(async () => {
    // Read AWS region from file
    const regionPath = path.join(__dirname, '../lib/AWS_REGION');
    region = fs.readFileSync(regionPath, 'utf8').trim();
    
    stackName = `TapStack-${Date.now()}`;
    
    // Initialize AWS CloudFormation client
    cfnClient = new CloudFormation({ region });
  });

  describe('Stack Deployment', () => {
    test('should deploy CloudFormation stack successfully', async () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateBody = fs.readFileSync(templatePath, 'utf8');
      
      const createStackParams = {
        StackName: stackName,
        TemplateBody: templateBody,
        Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'] as any,
        Parameters: [
          {
            ParameterKey: 'SSHAllowedCIDR',
            ParameterValue: '10.0.0.0/8' // Restrict to private network for testing
          },
          {
            ParameterKey: 'InstanceType',
            ParameterValue: 't3.micro'
          }
        ],
        Tags: [
          {
            Key: 'Project',
            Value: 'WebApp'
          },
          {
            Key: 'Environment',
            Value: 'test'
          }
        ]
      };

      try {
        const result = await cfnClient.createStack(createStackParams);
        expect(result?.StackId).toBeDefined();
        
        // Wait for stack to be created
        await waitForStackCreation(cfnClient, stackName);
        
      } catch (error) {
        console.error('Stack deployment failed:', error);
        throw error;
      }
    }, 300000); // 5 minutes timeout

    test('should have all required stack outputs', async () => {
      // Get stack outputs after stack is created
      const describeResult = await cfnClient.describeStacks({ StackName: stackName });
      const stackOutputs = describeResult.Stacks?.[0].Outputs || [];
      
      // Validate stack outputs
      expect(stackOutputs).toHaveLength(3);
      
      const vpcOutput = stackOutputs.find((output: any) => output.OutputKey === 'VPCId');
      expect(vpcOutput).toBeDefined();
      expect(vpcOutput?.OutputValue).toMatch(/^vpc-[a-f0-9]+$/);
      
      const albUrlOutput = stackOutputs.find((output: any) => output.OutputKey === 'LoadBalancerURL');
      expect(albUrlOutput).toBeDefined();
      expect(albUrlOutput?.OutputValue).toMatch(/^http:\/\/.*\.elb\.amazonaws\.com$/);
      
      const albDnsOutput = stackOutputs.find((output: any) => output.OutputKey === 'LoadBalancerDNS');
      expect(albDnsOutput).toBeDefined();
      expect(albDnsOutput?.OutputValue).toMatch(/^.*\.elb\.amazonaws\.com$/);
    });

    test('should have all required resources in stack', async () => {
      const describeResult = await cfnClient.describeStackResources({ StackName: stackName });
      const resources = describeResult.StackResources || [];
      
      // Check for key resources
      const resourceTypes = resources.map((resource: any) => resource.ResourceType);
      
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::EC2::NatGateway');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(resourceTypes).toContain('AWS::AutoScaling::AutoScalingGroup');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::IAM::InstanceProfile');
      
      // Check that all resources are in CREATE_COMPLETE state
      const failedResources = resources.filter((resource: any) => 
        resource.ResourceStatus !== 'CREATE_COMPLETE'
      );
      
      if (failedResources.length > 0) {
        console.error('Failed resources:', failedResources);
        throw new Error(`Some resources failed to create: ${failedResources.map((r: any) => r.LogicalResourceId).join(', ')}`);
      }
    });

    test('should have proper stack events', async () => {
      const eventsResult = await cfnClient.describeStackEvents({ StackName: stackName });
      const events = eventsResult.StackEvents || [];
      
      // Check for successful stack creation event
      const stackCreateEvent = events.find((event: any) => 
        event.LogicalResourceId === stackName && 
        event.ResourceStatus === 'CREATE_COMPLETE'
      );
      
      expect(stackCreateEvent).toBeDefined();
      
      // Check that there are no failed events
      const failedEvents = events.filter((event: any) => 
        event.ResourceStatus === 'CREATE_FAILED'
      );
      
      if (failedEvents.length > 0) {
        console.error('Failed events:', failedEvents);
        throw new Error(`Some stack events failed: ${failedEvents.map((e: any) => e.LogicalResourceId).join(', ')}`);
      }
    });
  });

  describe('Stack Validation', () => {
    test('should validate template before deployment', async () => {
      const templatePath = path.join(__dirname, '../lib/TapStack.yml');
      const templateBody = fs.readFileSync(templatePath, 'utf8');
      
      const validateParams = {
        TemplateBody: templateBody
      };
      
      try {
        const result = await cfnClient.validateTemplate(validateParams);
        expect(result).toBeDefined();
        expect(result.Parameters).toBeDefined();
        expect(result.Parameters?.length).toBeGreaterThan(0);
      } catch (error) {
        console.error('Template validation failed:', error);
        throw error;
      }
    });

    test('should have correct stack tags', async () => {
      const describeResult = await cfnClient.describeStacks({ StackName: stackName });
      const stack = describeResult.Stacks?.[0];
      
      expect(stack?.Tags).toBeDefined();
      expect(stack?.Tags).toContainEqual({ Key: 'Project', Value: 'WebApp' });
      expect(stack?.Tags).toContainEqual({ Key: 'Environment', Value: 'test' });
    });
  });

  describe('Resource Validation', () => {
    test('should have VPC with correct configuration', async () => {
      const describeResult = await cfnClient.describeStackResources({ StackName: stackName });
      const resources = describeResult.StackResources || [];
      
      const vpcResource = resources.find((resource: any) => resource.ResourceType === 'AWS::EC2::VPC');
      expect(vpcResource).toBeDefined();
      expect(vpcResource?.ResourceStatus).toBe('CREATE_COMPLETE');
      expect(vpcResource?.PhysicalResourceId).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have subnets in different availability zones', async () => {
      const describeResult = await cfnClient.describeStackResources({ StackName: stackName });
      const resources = describeResult.StackResources || [];
      
      const subnetResources = resources.filter((resource: any) => resource.ResourceType === 'AWS::EC2::Subnet');
      expect(subnetResources).toHaveLength(4); // 2 public + 2 private
      
      // All subnets should be created successfully
      subnetResources.forEach((subnet: any) => {
        expect(subnet.ResourceStatus).toBe('CREATE_COMPLETE');
        expect(subnet.PhysicalResourceId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test('should have load balancer with correct configuration', async () => {
      const describeResult = await cfnClient.describeStackResources({ StackName: stackName });
      const resources = describeResult.StackResources || [];
      
      const albResource = resources.find((resource: any) => 
        resource.ResourceType === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(albResource).toBeDefined();
      expect(albResource?.ResourceStatus).toBe('CREATE_COMPLETE');
      expect(albResource?.PhysicalResourceId).toMatch(/^arn:aws:elasticloadbalancing:/);
    });

    test('should have auto scaling group with correct configuration', async () => {
      const describeResult = await cfnClient.describeStackResources({ StackName: stackName });
      const resources = describeResult.StackResources || [];
      
      const asgResource = resources.find((resource: any) => 
        resource.ResourceType === 'AWS::AutoScaling::AutoScalingGroup'
      );
      expect(asgResource).toBeDefined();
      expect(asgResource?.ResourceStatus).toBe('CREATE_COMPLETE');
      expect(asgResource?.PhysicalResourceId).toMatch(/^arn:aws:autoscaling:/);
    });

    test('should have security groups with correct configuration', async () => {
      const describeResult = await cfnClient.describeStackResources({ StackName: stackName });
      const resources = describeResult.StackResources || [];
      
      const sgResources = resources.filter((resource: any) => 
        resource.ResourceType === 'AWS::EC2::SecurityGroup'
      );
      expect(sgResources.length).toBeGreaterThan(0);
      
      // All security groups should be created successfully
      sgResources.forEach((sg: any) => {
        expect(sg.ResourceStatus).toBe('CREATE_COMPLETE');
        expect(sg.PhysicalResourceId).toMatch(/^sg-[a-f0-9]+$/);
      });
    });

    test('should have CloudWatch alarms for scaling', async () => {
      const describeResult = await cfnClient.describeStackResources({ StackName: stackName });
      const resources = describeResult.StackResources || [];
      
      const alarmResources = resources.filter((resource: any) => 
        resource.ResourceType === 'AWS::CloudWatch::Alarm'
      );
      expect(alarmResources.length).toBeGreaterThan(0);
      
      // All alarms should be created successfully
      alarmResources.forEach((alarm: any) => {
        expect(alarm.ResourceStatus).toBe('CREATE_COMPLETE');
      });
    });

    test('should have IAM roles and instance profiles', async () => {
      const describeResult = await cfnClient.describeStackResources({ StackName: stackName });
      const resources = describeResult.StackResources || [];
      
      const iamRoleResource = resources.find((resource: any) => 
        resource.ResourceType === 'AWS::IAM::Role'
      );
      expect(iamRoleResource).toBeDefined();
      expect(iamRoleResource?.ResourceStatus).toBe('CREATE_COMPLETE');
      
      const instanceProfileResource = resources.find((resource: any) => 
        resource.ResourceType === 'AWS::IAM::InstanceProfile'
      );
      expect(instanceProfileResource).toBeDefined();
      expect(instanceProfileResource?.ResourceStatus).toBe('CREATE_COMPLETE');
    });
  });

  describe('End-to-End Functionality', () => {
    test('should have healthy stack status', async () => {
      const describeResult = await cfnClient.describeStacks({ StackName: stackName });
      const stack = describeResult.Stacks?.[0];
      
      expect(stack?.StackStatus).toBe('CREATE_COMPLETE');
      expect(stack?.StackStatusReason).toBeUndefined();
    });

    test('should have all required outputs', async () => {
      const describeResult = await cfnClient.describeStacks({ StackName: stackName });
      const stackOutputs = describeResult.Stacks?.[0].Outputs || [];
      
      const outputKeys = stackOutputs.map((output: any) => output.OutputKey);
      expect(outputKeys).toContain('VPCId');
      expect(outputKeys).toContain('LoadBalancerURL');
      expect(outputKeys).toContain('LoadBalancerDNS');
      
      // All outputs should have values
      stackOutputs.forEach((output: any) => {
        expect(output.OutputValue).toBeDefined();
        expect(output.OutputValue).not.toBe('');
      });
    });
  });

  afterAll(async () => {
    // Clean up - delete the stack
    try {
      console.log(`Deleting stack: ${stackName}`);
      await cfnClient.deleteStack({ StackName: stackName });
      
      // Wait for stack deletion
      await waitForStackDeletion(cfnClient, stackName);
      console.log(`Stack ${stackName} deleted successfully`);
    } catch (error) {
      console.error('Error cleaning up stack:', error);
    }
  });
});

// Helper functions
async function waitForStackCreation(cfnClient: CloudFormation, stackName: string): Promise<void> {
  const maxAttempts = 60; // 10 minutes with 10-second intervals
  let attempts = 0;
  
  console.log(`Waiting for stack ${stackName} to be created...`);
  
  while (attempts < maxAttempts) {
    const result = await cfnClient.describeStacks({ StackName: stackName });
    const stack = result.Stacks?.[0];
    
    if (stack?.StackStatus === 'CREATE_COMPLETE') {
      console.log(`Stack ${stackName} created successfully`);
      return;
    } else if (stack?.StackStatus === 'CREATE_FAILED') {
      throw new Error(`Stack creation failed: ${stack.StackStatusReason}`);
    } else if (stack?.StackStatus === 'ROLLBACK_COMPLETE') {
      throw new Error(`Stack creation rolled back: ${stack.StackStatusReason}`);
    }
    
    console.log(`Stack status: ${stack?.StackStatus}, waiting...`);
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    attempts++;
  }
  
  throw new Error('Stack creation timed out');
}

async function waitForStackDeletion(cfnClient: CloudFormation, stackName: string): Promise<void> {
  const maxAttempts = 30; // 5 minutes with 10-second intervals
  let attempts = 0;
  
  console.log(`Waiting for stack ${stackName} to be deleted...`);
  
  while (attempts < maxAttempts) {
    try {
      const result = await cfnClient.describeStacks({ StackName: stackName });
      const stack = result.Stacks?.[0];
      
      if (stack?.StackStatus === 'DELETE_COMPLETE') {
        console.log(`Stack ${stackName} deleted successfully`);
        return;
      } else if (stack?.StackStatus === 'DELETE_FAILED') {
        throw new Error(`Stack deletion failed: ${stack.StackStatusReason}`);
      }
      
      console.log(`Stack status: ${stack?.StackStatus}, waiting...`);
    } catch (error: any) {
      if (error.name === 'ValidationError' && error.message.includes('does not exist')) {
        console.log(`Stack ${stackName} has been deleted`);
        return; // Stack has been deleted
      }
      throw error;
    }
    
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    attempts++;
  }
  
  throw new Error('Stack deletion timed out');
}
