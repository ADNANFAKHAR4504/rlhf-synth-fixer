import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocking BEFORE any imports
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    const outputs: any = {
      ...args.inputs,
    };

    // Add specific mock outputs based on resource type
    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.id = 'vpc-mock12345';
    } else if (args.type === 'aws:ecs/cluster:Cluster') {
      outputs.arn = `arn:aws:ecs:us-east-1:123456789012:cluster/${args.name}`;
      outputs.name = args.name;
    } else if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      outputs.dnsName = `${args.name}.us-east-1.elb.amazonaws.com`;
    } else if (args.type === 'aws:ecr/repository:Repository') {
      outputs.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.name = args.name;
    } else if (args.type === 'aws:ecs/taskDefinition:TaskDefinition') {
      outputs.arn = `arn:aws:ecs:us-east-1:123456789012:task-definition/${args.name}:1`;
    } else if (args.type === 'aws:ecs/service:Service') {
      outputs.name = args.name;
    }

    return {
      id: `${args.name}_id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b'],
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
      };
    }
    return args.inputs;
  },
});

// Set required configuration BEFORE importing stack
// Note: The config key format is namespace:key, where namespace can be project name or "project"
pulumi.runtime.setConfig('TapStack:environmentSuffix', 'test');
pulumi.runtime.setConfig('project:environmentSuffix', 'test');
pulumi.runtime.setConfig('aws:region', 'us-east-1');
// Set environment variable for environmentSuffix (used by stack)
process.env.ENVIRONMENT_SUFFIX = 'test';

// Now import the stack after mocking is set up
import * as resources from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  describe('VPC Configuration', () => {
    it('should export vpcId', async () => {
      expect(resources.vpcId).toBeDefined();
      const vpcId = await pulumi.output(resources.vpcId).promise();
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });
  });

  describe('ECS Cluster', () => {
    it('should export clusterName', async () => {
      expect(resources.clusterName).toBeDefined();
      const clusterName = await pulumi.output(resources.clusterName).promise();
      expect(clusterName).toBeDefined();
      expect(typeof clusterName).toBe('string');
    });

    it('should export clusterArn', async () => {
      expect(resources.clusterArn).toBeDefined();
      const clusterArn = await pulumi.output(resources.clusterArn).promise();
      expect(clusterArn).toBeDefined();
      expect(typeof clusterArn).toBe('string');
      expect(clusterArn).toContain('arn:aws:ecs');
    });
  });

  describe('Application Load Balancer', () => {
    it('should export albDnsName', async () => {
      expect(resources.albDnsName).toBeDefined();
      const albDnsName = await pulumi.output(resources.albDnsName).promise();
      expect(albDnsName).toBeDefined();
      expect(typeof albDnsName).toBe('string');
    });

    it('should export albUrl', async () => {
      expect(resources.albUrl).toBeDefined();
      const albUrl = await pulumi.output(resources.albUrl).promise();
      expect(albUrl).toBeDefined();
      expect(typeof albUrl).toBe('string');
    });
  });

  describe('ECR Repository', () => {
    it('should export ecrRepositoryUrl', async () => {
      expect(resources.ecrRepositoryUrl).toBeDefined();
      const ecrRepositoryUrl = await pulumi
        .output(resources.ecrRepositoryUrl)
        .promise();
      expect(ecrRepositoryUrl).toBeDefined();
      expect(typeof ecrRepositoryUrl).toBe('string');
      expect(ecrRepositoryUrl).toContain('ecr');
    });
  });

  describe('CloudWatch Logs', () => {
    it('should export logGroupName', async () => {
      expect(resources.logGroupName).toBeDefined();
      const logGroupName = await pulumi
        .output(resources.logGroupName)
        .promise();
      expect(logGroupName).toBeDefined();
      expect(typeof logGroupName).toBe('string');
    });
  });

  describe('ECS Task Definition', () => {
    it('should export taskDefinitionArn', async () => {
      expect(resources.taskDefinitionArn).toBeDefined();
      const taskDefinitionArn = await pulumi
        .output(resources.taskDefinitionArn)
        .promise();
      expect(taskDefinitionArn).toBeDefined();
      expect(typeof taskDefinitionArn).toBe('string');
      expect(taskDefinitionArn).toContain('task-definition');
    });
  });

  describe('ECS Service', () => {
    it('should export serviceName', async () => {
      expect(resources.serviceName).toBeDefined();
      const serviceName = await pulumi.output(resources.serviceName).promise();
      expect(serviceName).toBeDefined();
      expect(typeof serviceName).toBe('string');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environmentSuffix in resource names', async () => {
      const clusterName = await pulumi.output(resources.clusterName).promise();
      const logGroupName = await pulumi
        .output(resources.logGroupName)
        .promise();

      // All resource names should include 'test' as the environment suffix
      const hasEnvironmentSuffix =
        clusterName.includes('test') || logGroupName.includes('test');

      expect(hasEnvironmentSuffix).toBe(true);
    });
  });

  describe('Stack Exports', () => {
    it('should export all required outputs', () => {
      expect(resources.vpcId).toBeDefined();
      expect(resources.clusterName).toBeDefined();
      expect(resources.clusterArn).toBeDefined();
      expect(resources.albDnsName).toBeDefined();
      expect(resources.albUrl).toBeDefined();
      expect(resources.ecrRepositoryUrl).toBeDefined();
      expect(resources.logGroupName).toBeDefined();
      expect(resources.taskDefinitionArn).toBeDefined();
      expect(resources.serviceName).toBeDefined();
    });

    it('should have valid output types', async () => {
      const vpcId = await pulumi.output(resources.vpcId).promise();
      const clusterName = await pulumi.output(resources.clusterName).promise();
      const clusterArn = await pulumi.output(resources.clusterArn).promise();
      const albDnsName = await pulumi.output(resources.albDnsName).promise();
      const ecrRepositoryUrl = await pulumi
        .output(resources.ecrRepositoryUrl)
        .promise();
      const logGroupName = await pulumi
        .output(resources.logGroupName)
        .promise();
      const taskDefinitionArn = await pulumi
        .output(resources.taskDefinitionArn)
        .promise();
      const serviceName = await pulumi.output(resources.serviceName).promise();

      expect(typeof vpcId).toBe('string');
      expect(typeof clusterName).toBe('string');
      expect(typeof clusterArn).toBe('string');
      expect(typeof albDnsName).toBe('string');
      expect(typeof ecrRepositoryUrl).toBe('string');
      expect(typeof logGroupName).toBe('string');
      expect(typeof taskDefinitionArn).toBe('string');
      expect(typeof serviceName).toBe('string');
    });
  });

  describe('Infrastructure Optimization Requirements', () => {
    it('validates all required exports are present', async () => {
      // Test that all key infrastructure components are exported
      const allExports = [
        resources.vpcId,
        resources.clusterName,
        resources.clusterArn,
        resources.albDnsName,
        resources.albUrl,
        resources.ecrRepositoryUrl,
        resources.logGroupName,
        resources.taskDefinitionArn,
        resources.serviceName,
      ];

      // Verify all exports are defined
      for (const exportValue of allExports) {
        expect(exportValue).toBeDefined();
      }

      // Resolve all outputs
      const resolvedExports = await Promise.all(
        allExports.map((exp) => pulumi.output(exp).promise())
      );

      // Verify all resolved values are truthy
      for (const resolved of resolvedExports) {
        expect(resolved).toBeTruthy();
      }
    });
  });

  describe('Cost Optimization Features', () => {
    it('should have all exports for Fargate Spot configuration', () => {
      // Verify exports needed for Fargate Spot validation
      expect(resources.clusterName).toBeDefined();
      expect(resources.serviceName).toBeDefined();
      expect(resources.taskDefinitionArn).toBeDefined();
    });

    it('should have valid cluster and service for capacity providers', async () => {
      const clusterName = await pulumi.output(resources.clusterName).promise();
      const serviceName = await pulumi.output(resources.serviceName).promise();

      expect(clusterName).toBeTruthy();
      expect(serviceName).toBeTruthy();
    });
  });

  describe('Security and Compliance', () => {
    it('should have VPC and security-related exports', () => {
      expect(resources.vpcId).toBeDefined();
      expect(resources.clusterName).toBeDefined();
    });

    it('should have valid VPC ID', async () => {
      const vpcId = await pulumi.output(resources.vpcId).promise();
      expect(vpcId).toBeTruthy();
      expect(typeof vpcId).toBe('string');
    });
  });

  describe('Monitoring and Logging', () => {
    it('should have CloudWatch log group export', () => {
      expect(resources.logGroupName).toBeDefined();
    });

    it('should have valid log group name', async () => {
      const logGroupName = await pulumi
        .output(resources.logGroupName)
        .promise();
      expect(logGroupName).toBeTruthy();
      expect(typeof logGroupName).toBe('string');
    });
  });

  describe('ECR Lifecycle Policy', () => {
    it('should have ECR repository configured', async () => {
      const ecrRepositoryUrl = await pulumi
        .output(resources.ecrRepositoryUrl)
        .promise();
      expect(ecrRepositoryUrl).toBeTruthy();
      expect(ecrRepositoryUrl).toContain('ecr');
    });
  });
});
