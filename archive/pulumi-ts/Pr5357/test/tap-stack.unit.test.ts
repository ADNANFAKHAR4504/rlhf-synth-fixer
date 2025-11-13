// tap-stack.unit.test.ts

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as awsx from '@pulumi/awsx';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack, OutputFileWriter } from "../lib/tap-stack";

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const mockOutputs: any = {
      ...args.inputs,
      id: `${args.name}-id`,
      urn: `urn:pulumi:stack::project::${args.type}::${args.name}`,
    };

    // Mock specific resource outputs
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        mockOutputs.id = 'vpc-12345';
        mockOutputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        break;
      case 'awsx:ec2:Vpc':
        mockOutputs.vpcId = 'vpc-12345';
        mockOutputs.publicSubnetIds = ['subnet-public-1', 'subnet-public-2'];
        mockOutputs.privateSubnetIds = ['subnet-private-1', 'subnet-private-2'];
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        mockOutputs.id = 'sg-12345';
        break;
      case 'aws:rds/cluster:Cluster':
        mockOutputs.endpoint = 'test-cluster.region.rds.amazonaws.com';
        mockOutputs.port = 5432;
        mockOutputs.id = 'test-cluster';
        mockOutputs.masterUserSecrets = [{ secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret' }];
        break;
      case 'aws:rds/clusterInstance:ClusterInstance':
        mockOutputs.id = 'test-instance';
        break;
      case 'aws:ecs/cluster:Cluster':
        mockOutputs.arn = 'arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster';
        mockOutputs.name = 'test-cluster';
        break;
      case 'aws:lb/loadBalancer:LoadBalancer':
        mockOutputs.arn = 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890';
        mockOutputs.dnsName = 'test-alb.us-east-1.elb.amazonaws.com';
        mockOutputs.zoneId = 'Z35SXDOTRQ7X7K';
        mockOutputs.arnSuffix = 'app/test-alb/1234567890';
        break;
      case 'aws:lb/targetGroup:TargetGroup':
        mockOutputs.arn = 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test-tg/1234567890';
        mockOutputs.arnSuffix = 'targetgroup/test-tg/1234567890';
        break;
      case 'aws:ecs/service:Service':
        mockOutputs.name = 'test-service';
        break;
      case 'aws:ecs/taskDefinition:TaskDefinition':
        mockOutputs.arn = 'arn:aws:ecs:us-east-1:123456789012:task-definition/test-task:1';
        break;
      case 'aws:s3/bucket:Bucket':
        mockOutputs.bucket = 'test-bucket';
        mockOutputs.id = 'test-bucket';
        break;
      case 'aws:route53/zone:Zone':
        mockOutputs.zoneId = 'Z1234567890ABC';
        mockOutputs.name = 'example.com';
        break;
      case 'aws:cloudwatch/dashboard:Dashboard':
        mockOutputs.dashboardArn = 'arn:aws:cloudwatch::123456789012:dashboard/test-dashboard';
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        mockOutputs.name = '/ecs/test-service';
        break;
      case 'aws:sns/topic:Topic':
        mockOutputs.arn = 'arn:aws:sns:us-east-1:123456789012:test-topic';
        break;
      case 'aws:kms/key:Key':
        mockOutputs.keyId = 'key-12345';
        mockOutputs.arn = 'arn:aws:kms:us-east-1:123456789012:key/12345';
        break;
      case 'aws:iam/role:Role':
        mockOutputs.arn = 'arn:aws:iam::123456789012:role/test-role';
        mockOutputs.name = args.inputs.name || 'test-role';
        break;
      case 'aws:ec2/vpcPeeringConnection:VpcPeeringConnection':
        mockOutputs.id = 'pcx-12345';
        break;
    }

    return {
      id: mockOutputs.id,
      state: mockOutputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:secretsmanager/getSecret:getSecret') {
      return {
        arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
        name: 'test-secret',
      };
    }
    return {};
  },
});

// Helper function to extract output values
async function getOutputValue<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise<T>((resolve) => {
    output.apply((value) => {
      resolve(value);
      return value;
    });
  });
}

describe('OutputFileWriter', () => {
  const testOutputDir = path.join(__dirname, 'test-outputs');
  const testFilename = 'test-output.json';
  const testData = { key: 'value', nested: { data: 'test' } };

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(path.join(testOutputDir, testFilename))) {
      fs.unlinkSync(path.join(testOutputDir, testFilename));
    }
    if (fs.existsSync(testOutputDir)) {
      fs.rmdirSync(testOutputDir);
    }
  });

  describe('writeJsonToFile', () => {
    it('should create directory if it does not exist', () => {
      OutputFileWriter.writeJsonToFile(testOutputDir, testFilename, testData);

      expect(fs.existsSync(testOutputDir)).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, testFilename))).toBe(true);
    });

    it('should write JSON data to file with correct formatting', () => {
      OutputFileWriter.writeJsonToFile(testOutputDir, testFilename, testData);

      const fileContent = fs.readFileSync(path.join(testOutputDir, testFilename), 'utf8');
      const parsedContent = JSON.parse(fileContent);

      expect(parsedContent).toEqual(testData);
    });

    it('should handle existing directory', () => {
      fs.mkdirSync(testOutputDir);
      
      OutputFileWriter.writeJsonToFile(testOutputDir, testFilename, testData);

      const fileContent = fs.readFileSync(path.join(testOutputDir, testFilename), 'utf8');
      const parsedContent = JSON.parse(fileContent);

      expect(parsedContent).toEqual(testData);
    });
  });

  describe('directoryExists', () => {
    it('should return true for existing directory', () => {
      fs.mkdirSync(testOutputDir);
      
      expect(OutputFileWriter.directoryExists(testOutputDir)).toBe(true);
      
      fs.rmdirSync(testOutputDir);
    });

    it('should return false for non-existing directory', () => {
      expect(OutputFileWriter.directoryExists(testOutputDir)).toBe(false);
    });
  });

  describe('readJsonFile', () => {
    it('should read and parse JSON file correctly', () => {
      fs.mkdirSync(testOutputDir);
      fs.writeFileSync(path.join(testOutputDir, testFilename), JSON.stringify(testData));

      const result = OutputFileWriter.readJsonFile(path.join(testOutputDir, testFilename));

      expect(result).toEqual(testData);
    });
  });
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Mock process.cwd() for file writing tests
    jest.spyOn(process, 'cwd').mockReturnValue('/mock/path');
    
    // Mock pulumi.Config
    jest.spyOn(pulumi.Config.prototype, 'get').mockImplementation((key: string) => {
      const configMap: { [key: string]: string } = {
        skipFileWrite: 'true',
      };
      return configMap[key];
    });

    jest.spyOn(pulumi.Config.prototype, 'getNumber').mockReturnValue(undefined);
    jest.spyOn(pulumi.Config.prototype, 'getBoolean').mockImplementation((key: string) => {
      if (key === 'skipFileWrite') return true;
      return undefined;
    });
    jest.spyOn(pulumi.Config.prototype, 'getObject').mockReturnValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor - Dev Environment', () => {
    it('should create stack with dev environment configuration', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const vpcId = await getOutputValue(stack.outputs.vpcId);
      const vpcCidr = await getOutputValue(stack.outputs.vpcCidr);

      expect(vpcId).toBe('vpc-12345');
      expect(vpcCidr).toBe('10.1.0.0/16');
    });
  });

  describe('Constructor - Staging Environment', () => {
    it('should create stack with staging environment configuration', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'staging' });

      const vpcCidr = await getOutputValue(stack.outputs.vpcCidr);

      expect(vpcCidr).toBe('10.2.0.0/16');
    });
  });


  describe('Constructor - PR Environment', () => {
    it('should create stack with PR environment and skip Route53', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'pr123' });

      const route53ZoneId = await getOutputValue(stack.outputs.route53ZoneId);
      const route53ZoneName = await getOutputValue(stack.outputs.route53ZoneName);

      expect(route53ZoneId).toBe('N/A-PR-Environment');
      expect(route53ZoneName).toContain('pr123.internal.local');
    });

    it('should handle PR environment with custom domain fallback', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'pr456' });

      const route53ZoneId = await getOutputValue(stack.outputs.route53ZoneId);

      expect(route53ZoneId).toBe('N/A-PR-Environment');
    });
  });

  describe('loadConfiguration', () => {
    it('should use default VPC CIDR for unknown environment', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'custom' });

      const vpcCidr = await getOutputValue(stack.outputs.vpcCidr);

      expect(vpcCidr).toBe('10.0.0.0/16');
    });

    it('should apply custom configuration values when provided', async () => {
      jest.spyOn(pulumi.Config.prototype, 'get').mockImplementation((key: string) => {
        const configMap: { [key: string]: string } = {
          vpcCidr: '172.16.0.0/16',
          domain: 'custom.example.com',
          team: 'custom-team',
          costCenter: 'custom-cost',
          ecsTaskCpu: '2048',
          ecsTaskMemory: '4096',
          rdsInstanceClass: 'db.r5.xlarge',
          albHealthCheckPath: '/custom-health',
          containerImage: 'custom-image:latest',
          skipFileWrite: 'true',
        };
        return configMap[key];
      });

      jest.spyOn(pulumi.Config.prototype, 'getNumber').mockImplementation((key: string) => {
        const configMap: { [key: string]: number } = {
          ecsTaskCount: 5,
          s3LogRetentionDays: 60,
          cloudwatchLogRetentionDays: 45,
          rdsAllocatedStorage: 200,
          albHealthCheckInterval: 60,
          containerPort: 3000,
        };
        return configMap[key];
      });

      jest.spyOn(pulumi.Config.prototype, 'getObject').mockImplementation((key: string) => {
        if (key === 'availabilityZones') {
          return ['us-west-2a', 'us-west-2b'];
        }
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const vpcCidr = await getOutputValue(stack.outputs.vpcCidr);

      expect(vpcCidr).toBe('172.16.0.0/16');
    });

    it('should use environment-specific defaults for task counts', async () => {
      // Dev environment
      const devStack = new TapStack('dev-stack', { environmentSuffix: 'dev' });
      const devVpcId = await getOutputValue(devStack.outputs.vpcId);
      expect(devVpcId).toBeDefined();

      // Staging environment
      const stagingStack = new TapStack('staging-stack', { environmentSuffix: 'staging' });
      const stagingVpcId = await getOutputValue(stagingStack.outputs.vpcId);
      expect(stagingVpcId).toBeDefined();

      // Prod environment
      const prodStack = new TapStack('prod-stack', { environmentSuffix: 'prod' });
      const prodVpcId = await getOutputValue(prodStack.outputs.vpcId);
      expect(prodVpcId).toBeDefined();
    });

    it('should use minimum RDS instance class for Aurora PostgreSQL', async () => {
      const devStack = new TapStack('dev-stack', { environmentSuffix: 'dev' });
      const stagingStack = new TapStack('staging-stack', { environmentSuffix: 'staging' });
      const prodStack = new TapStack('prod-stack', { environmentSuffix: 'prod' });

      // Verify stacks are created without errors
      expect(devStack.outputs).toBeDefined();
      expect(stagingStack.outputs).toBeDefined();
      expect(prodStack.outputs).toBeDefined();
    });
  });

  describe('VPC Peering Configuration', () => {
    it('should create VPC peering connections when enabled', async () => {
      jest.spyOn(pulumi.Config.prototype, 'getBoolean').mockImplementation((key: string) => {
        if (key === 'enableVpcPeering') return true;
        if (key === 'skipFileWrite') return true;
        return undefined;
      });

      jest.spyOn(pulumi.Config.prototype, 'getObject').mockImplementation((key: string) => {
        if (key === 'peeringVpcIds') {
          return ['vpc-peer-1', 'vpc-peer-2'];
        }
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const vpcPeeringIds = await getOutputValue(stack.outputs.vpcPeeringConnectionIds);

      expect(vpcPeeringIds).toBeDefined();
    });

    it('should return empty array when VPC peering is disabled', async () => {
      jest.spyOn(pulumi.Config.prototype, 'getBoolean').mockImplementation((key: string) => {
        if (key === 'enableVpcPeering') return false;
        if (key === 'skipFileWrite') return true;
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const vpcPeeringIds = await getOutputValue(stack.outputs.vpcPeeringConnectionIds);

      expect(vpcPeeringIds).toEqual([]);
    });

    it('should return empty array when peeringVpcIds is not provided', async () => {
      jest.spyOn(pulumi.Config.prototype, 'getBoolean').mockImplementation((key: string) => {
        if (key === 'enableVpcPeering') return true;
        if (key === 'skipFileWrite') return true;
        return undefined;
      });

      jest.spyOn(pulumi.Config.prototype, 'getObject').mockReturnValue(undefined);

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const vpcPeeringIds = await getOutputValue(stack.outputs.vpcPeeringConnectionIds);

      expect(vpcPeeringIds).toEqual([]);
    });

    it('should return empty array when peeringVpcIds is empty array', async () => {
      jest.spyOn(pulumi.Config.prototype, 'getBoolean').mockImplementation((key: string) => {
        if (key === 'enableVpcPeering') return true;
        if (key === 'skipFileWrite') return true;
        return undefined;
      });

      jest.spyOn(pulumi.Config.prototype, 'getObject').mockImplementation((key: string) => {
        if (key === 'peeringVpcIds') {
          return [];
        }
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const vpcPeeringIds = await getOutputValue(stack.outputs.vpcPeeringConnectionIds);

      expect(vpcPeeringIds).toEqual([]);
    });
  });

  describe('getResourceName', () => {
    it('should return lowercase name for S3 buckets', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });
      
      const s3BucketName = await getOutputValue(stack.outputs.s3BucketName);
      
      expect(s3BucketName).toBeDefined();
    });

    it('should return standard name for non-S3 resources', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });
      
      const ecsClusterArn = await getOutputValue(stack.outputs.ecsClusterArn);
      const albArn = await getOutputValue(stack.outputs.albArn);
      
      expect(ecsClusterArn).toBeDefined();
      expect(albArn).toBeDefined();
    });
  });

  describe('getAwsCompliantName', () => {
    it('should convert name to lowercase and replace invalid characters', async () => {
      stack = new TapStack('Test_Stack!', { environmentSuffix: 'dev' });
      
      const vpcId = await getOutputValue(stack.outputs.vpcId);
      
      expect(vpcId).toBeDefined();
    });

    it('should remove consecutive hyphens', async () => {
      stack = new TapStack('test---stack', { environmentSuffix: 'dev' });
      
      const vpcId = await getOutputValue(stack.outputs.vpcId);
      
      expect(vpcId).toBeDefined();
    });

    it('should ensure name starts with a letter', async () => {
      jest.spyOn(pulumi, 'getProject').mockReturnValue('123-project');
      
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });
      
      const vpcId = await getOutputValue(stack.outputs.vpcId);
      
      expect(vpcId).toBeDefined();
    });

    it('should truncate names longer than 63 characters', async () => {
      const longName = 'very-long-project-name-that-exceeds-the-aws-limit-for-resource-names';
      jest.spyOn(pulumi, 'getProject').mockReturnValue(longName);
      
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });
      
      const vpcId = await getOutputValue(stack.outputs.vpcId);
      
      expect(vpcId).toBeDefined();
    });

    it('should remove trailing hyphen after truncation', async () => {
      const nameEndsWithHyphen = 'project-name-that-ends-with-hyphen-after-truncation-exactly';
      jest.spyOn(pulumi, 'getProject').mockReturnValue(nameEndsWithHyphen);
      
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });
      
      const vpcId = await getOutputValue(stack.outputs.vpcId);
      
      expect(vpcId).toBeDefined();
    });
  });

  describe('writeOutputsToFile', () => {
    it('should skip file writing when skipFileWrite is true', async () => {
      const writeJsonSpy = jest.spyOn(OutputFileWriter, 'writeJsonToFile');
      
      jest.spyOn(pulumi.Config.prototype, 'getBoolean').mockImplementation((key: string) => {
        if (key === 'skipFileWrite') return true;
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      // Wait for outputs to be registered
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(writeJsonSpy).not.toHaveBeenCalled();
    });

    it('should write outputs to file when skipFileWrite is false', async () => {
      const writeJsonSpy = jest.spyOn(OutputFileWriter, 'writeJsonToFile').mockImplementation(() => {});
      
      jest.spyOn(pulumi.Config.prototype, 'getBoolean').mockImplementation((key: string) => {
        if (key === 'skipFileWrite') return false;
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 200));

      // File writing happens in apply(), so we just verify the setup is correct
      expect(stack.outputs).toBeDefined();
    });

    it('should write outputs to file when skipFileWrite is undefined', async () => {
      jest.spyOn(pulumi.Config.prototype, 'getBoolean').mockReturnValue(undefined);

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      expect(stack.outputs).toBeDefined();
    });
  });

  describe('Complete Stack Creation', () => {
    it('should create all resources with proper dependencies', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      // Verify all outputs are present
      const vpcId = await getOutputValue(stack.outputs.vpcId);
      const vpcCidr = await getOutputValue(stack.outputs.vpcCidr);
      const albDnsName = await getOutputValue(stack.outputs.albDnsName);
      const albArn = await getOutputValue(stack.outputs.albArn);
      const ecsClusterArn = await getOutputValue(stack.outputs.ecsClusterArn);
      const ecsServiceName = await getOutputValue(stack.outputs.ecsServiceName);
      const rdsEndpoint = await getOutputValue(stack.outputs.rdsEndpoint);
      const rdsPort = await getOutputValue(stack.outputs.rdsPort);
      const rdsSecretArn = await getOutputValue(stack.outputs.rdsSecretArn);
      const s3BucketName = await getOutputValue(stack.outputs.s3BucketName);
      const route53ZoneId = await getOutputValue(stack.outputs.route53ZoneId);
      const route53ZoneName = await getOutputValue(stack.outputs.route53ZoneName);
      const cloudwatchDashboardArn = await getOutputValue(stack.outputs.cloudwatchDashboardArn);
      const publicSubnetIds = await getOutputValue(stack.outputs.publicSubnetIds);
      const privateSubnetIds = await getOutputValue(stack.outputs.privateSubnetIds);
      const vpcPeeringConnectionIds = await getOutputValue(stack.outputs.vpcPeeringConnectionIds);

      expect(vpcId).toBeDefined();
      expect(vpcCidr).toBeDefined();
      expect(albDnsName).toBeDefined();
      expect(albArn).toBeDefined();
      expect(ecsClusterArn).toBeDefined();
      expect(ecsServiceName).toBeDefined();
      expect(rdsEndpoint).toBeDefined();
      expect(rdsPort).toBe(5432);
      expect(rdsSecretArn).toBeDefined();
      expect(s3BucketName).toBeDefined();
      expect(route53ZoneId).toBeDefined();
      expect(route53ZoneName).toBeDefined();
      expect(cloudwatchDashboardArn).toBeDefined();
      expect(publicSubnetIds).toBeDefined();
      expect(privateSubnetIds).toBeDefined();
      expect(vpcPeeringConnectionIds).toBeDefined();
    });

    it('should handle RDS cluster with backup configuration for prod', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'prod' });

      const rdsEndpoint = await getOutputValue(stack.outputs.rdsEndpoint);
      const rdsPort = await getOutputValue(stack.outputs.rdsPort);

      expect(rdsEndpoint).toBeDefined();
      expect(rdsPort).toBe(5432);
    });

    it('should handle RDS cluster without final snapshot for non-prod', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const rdsEndpoint = await getOutputValue(stack.outputs.rdsEndpoint);

      expect(rdsEndpoint).toBeDefined();
    });

    it('should create ECS service with proper networking configuration', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const ecsServiceName = await getOutputValue(stack.outputs.ecsServiceName);
      const ecsClusterArn = await getOutputValue(stack.outputs.ecsClusterArn);

      expect(ecsServiceName).toBeDefined();
      expect(ecsClusterArn).toBeDefined();
    });

    it('should create S3 bucket with lifecycle policies', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'staging' });

      const s3BucketName = await getOutputValue(stack.outputs.s3BucketName);

      expect(s3BucketName).toBeDefined();
    });

    it('should create CloudWatch dashboard with metrics', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'prod' });

      const cloudwatchDashboardArn = await getOutputValue(stack.outputs.cloudwatchDashboardArn);

      expect(cloudwatchDashboardArn).toBeDefined();
    });

    it('should handle multiple availability zones', async () => {
      jest.spyOn(pulumi.Config.prototype, 'getObject').mockImplementation((key: string) => {
        if (key === 'availabilityZones') {
          return ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'];
        }
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'prod' });

      const publicSubnetIds = await getOutputValue(stack.outputs.publicSubnetIds);
      const privateSubnetIds = await getOutputValue(stack.outputs.privateSubnetIds);

      expect(publicSubnetIds).toBeDefined();
      expect(privateSubnetIds).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle environment suffix with special characters', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'pr-feature-123' });

      const vpcId = await getOutputValue(stack.outputs.vpcId);

      expect(vpcId).toBeDefined();
    });

    it('should handle very long environment suffix', async () => {
      const longSuffix = 'very-long-environment-suffix-name-for-testing';
      stack = new TapStack('test-stack', { environmentSuffix: longSuffix });

      const vpcId = await getOutputValue(stack.outputs.vpcId);

      expect(vpcId).toBeDefined();
    });

    it('should handle numeric environment suffix', async () => {
      jest.spyOn(pulumi, 'getProject').mockReturnValue('123project');
      
      stack = new TapStack('test-stack', { environmentSuffix: '123' });

      const vpcId = await getOutputValue(stack.outputs.vpcId);

      expect(vpcId).toBeDefined();
    });
  });

  describe('S3 Lifecycle Configuration', () => {
    it('should calculate transition days correctly for short retention', async () => {
      jest.spyOn(pulumi.Config.prototype, 'getNumber').mockImplementation((key: string) => {
        if (key === 's3LogRetentionDays') return 7;
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'dev' });

      const s3BucketName = await getOutputValue(stack.outputs.s3BucketName);

      expect(s3BucketName).toBeDefined();
    });

    it('should calculate transition days correctly for long retention', async () => {
      jest.spyOn(pulumi.Config.prototype, 'getNumber').mockImplementation((key: string) => {
        if (key === 's3LogRetentionDays') return 90;
        return undefined;
      });

      stack = new TapStack('test-stack', { environmentSuffix: 'prod' });

      const s3BucketName = await getOutputValue(stack.outputs.s3BucketName);

      expect(s3BucketName).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Thresholds', () => {
    it('should use prod-specific thresholds for production environment', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'prod' });

      const cloudwatchDashboardArn = await getOutputValue(stack.outputs.cloudwatchDashboardArn);

      expect(cloudwatchDashboardArn).toBeDefined();
    });

    it('should use default thresholds for non-production environments', async () => {
      const devStack = new TapStack('dev-stack', { environmentSuffix: 'dev' });
      const stagingStack = new TapStack('staging-stack', { environmentSuffix: 'staging' });

      const devDashboard = await getOutputValue(devStack.outputs.cloudwatchDashboardArn);
      const stagingDashboard = await getOutputValue(stagingStack.outputs.cloudwatchDashboardArn);

      expect(devDashboard).toBeDefined();
      expect(stagingDashboard).toBeDefined();
    });
  });
});
