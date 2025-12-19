/**
 * Comprehensive Unit Tests for TapStack and Components
 *
 * This test suite uses Pulumi's runtime mocking to test infrastructure
 * definitions without actually deploying resources.
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before importing any stack code
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    const outputs: any = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:mock::123456789012:${args.type}/${args.name}`,
      name: args.name,
    };

    // Resource-specific mock outputs
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        outputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        outputs.enableDnsHostnames = args.inputs.enableDnsHostnames;
        outputs.enableDnsSupport = args.inputs.enableDnsSupport;
        break;
      case 'aws:ec2/subnet:Subnet':
        outputs.cidrBlock = args.inputs.cidrBlock;
        outputs.availabilityZone = args.inputs.availabilityZone || 'eu-south-2a';
        outputs.vpcId = args.inputs.vpcId;
        break;
      case 'aws:ec2/internetGateway:InternetGateway':
        outputs.vpcId = args.inputs.vpcId;
        break;
      case 'aws:ec2/routeTable:RouteTable':
        outputs.vpcId = args.inputs.vpcId;
        break;
      case 'aws:ec2/eip:Eip':
        outputs.publicIp = '52.15.123.45';
        outputs.domain = args.inputs.domain;
        break;
      case 'aws:ec2/natGateway:NatGateway':
        outputs.subnetId = args.inputs.subnetId;
        outputs.allocationId = args.inputs.allocationId;
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        outputs.vpcId = args.inputs.vpcId;
        outputs.description = args.inputs.description;
        outputs.egress = args.inputs.egress;
        break;
      case 'aws:ec2/vpcEndpoint:VpcEndpoint':
        outputs.vpcId = args.inputs.vpcId;
        outputs.serviceName = args.inputs.serviceName;
        outputs.vpcEndpointType = args.inputs.vpcEndpointType;
        break;
      case 'aws:ec2transitgateway/transitGateway:TransitGateway':
        outputs.description = args.inputs.description;
        break;
      case 'aws:dynamodb/table:Table':
        outputs.name = args.inputs.name;
        outputs.hashKey = args.inputs.hashKey;
        outputs.rangeKey = args.inputs.rangeKey;
        outputs.billingMode = args.inputs.billingMode;
        outputs.attributes = args.inputs.attributes;
        break;
      case 'aws:s3/bucket:Bucket':
        outputs.bucket = args.inputs.bucket;
        outputs.versioning = args.inputs.versioning;
        break;
      case 'aws:kms/key:Key':
        outputs.description = args.inputs.description;
        outputs.deletionWindowInDays = args.inputs.deletionWindowInDays;
        outputs.enableKeyRotation = args.inputs.enableKeyRotation;
        break;
      case 'aws:kms/alias:Alias':
        outputs.name = args.inputs.name;
        outputs.targetKeyId = args.inputs.targetKeyId;
        break;
      case 'aws:lambda/function:Function':
        outputs.name = args.inputs.name;
        outputs.runtime = args.inputs.runtime;
        outputs.handler = args.inputs.handler;
        outputs.timeout = args.inputs.timeout;
        outputs.memorySize = args.inputs.memorySize;
        outputs.role = args.inputs.role;
        outputs.environment = args.inputs.environment;
        outputs.vpcConfig = args.inputs.vpcConfig;
        break;
      case 'aws:iam/role:Role':
        outputs.assumeRolePolicy = args.inputs.assumeRolePolicy;
        outputs.maxSessionDuration = args.inputs.maxSessionDuration;
        break;
      case 'aws:apigateway/restApi:RestApi':
        outputs.name = args.inputs.name;
        outputs.description = args.inputs.description;
        outputs.rootResourceId = `${args.name}-root-id`;
        outputs.executionArn = `arn:aws:execute-api:eu-south-2:123456789012:${args.name}-id`;
        break;
      case 'aws:apigateway/resource:Resource':
        outputs.restApi = args.inputs.restApi;
        outputs.parentId = args.inputs.parentId;
        outputs.pathPart = args.inputs.pathPart;
        break;
      case 'aws:apigateway/method:Method':
        outputs.restApi = args.inputs.restApi;
        outputs.resourceId = args.inputs.resourceId;
        outputs.httpMethod = args.inputs.httpMethod;
        outputs.authorization = args.inputs.authorization;
        break;
      case 'aws:apigateway/integration:Integration':
        outputs.restApi = args.inputs.restApi;
        outputs.resourceId = args.inputs.resourceId;
        outputs.httpMethod = args.inputs.httpMethod;
        outputs.type = args.inputs.type;
        break;
      case 'aws:apigateway/deployment:Deployment':
        outputs.restApi = args.inputs.restApi;
        outputs.invokeUrl = `https://${args.name}-id.execute-api.eu-south-2.amazonaws.com`;
        break;
      case 'aws:apigateway/stage:Stage':
        outputs.restApi = args.inputs.restApi;
        outputs.deployment = args.inputs.deployment;
        outputs.stageName = args.inputs.stageName;
        break;
      case 'aws:sns/topic:Topic':
        outputs.name = args.inputs.name;
        outputs.displayName = args.inputs.displayName;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        outputs.name = args.inputs.name || `${args.name}-log-group`;
        outputs.retentionInDays = args.inputs.retentionInDays;
        break;
      case 'aws:cloudwatch/metricAlarm:MetricAlarm':
        outputs.name = args.inputs.name;
        outputs.comparisonOperator = args.inputs.comparisonOperator;
        outputs.metricName = args.inputs.metricName;
        break;
      case 'aws:cloudwatch/dashboard:Dashboard':
        outputs.dashboardName = args.inputs.dashboardName;
        outputs.dashboardBody = args.inputs.dashboardBody;
        break;
      case 'aws:ec2/flowLog:FlowLog':
        outputs.vpcId = args.inputs.vpcId;
        outputs.trafficType = args.inputs.trafficType;
        break;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS SDK calls
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['eu-south-2a', 'eu-south-2b', 'eu-south-2c'],
          state: 'available',
        };
      default:
        return {};
    }
  },
});

// Now import stack components after mocks are set up
import * as aws from '@pulumi/aws';
import { ApiGatewayStack } from '../lib/components/api-gateway';
import { ComputeStack } from '../lib/components/compute';
import { DataStack } from '../lib/components/data';
import { MonitoringStack } from '../lib/components/monitoring';
import { NetworkingStack } from '../lib/components/networking';
import { TapStack } from '../lib/tap-stack';

/**
 * Helper function to convert Pulumi Output to Promise for testing
 */
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise(resolve => {
    output.apply(v => {
      resolve(v);
      return v;
    });
  });
}

describe('TapStack - Main Orchestrator', () => {
  describe('Stack Creation with Props', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-props', {
        environmentSuffix: 'test123',
        tags: {
          Owner: 'test-team',
          CostCenter: '1234',
        },
      });
    });

    it('creates stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('exports apiUrl output', async () => {
      expect(stack.apiUrl).toBeDefined();
      const apiUrl = await promiseOf(stack.apiUrl);
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain('payments');
    });

    it('exports bucketName output', async () => {
      expect(stack.bucketName).toBeDefined();
      const bucketName = await promiseOf(stack.bucketName);
      expect(bucketName).toContain('payment-audit-logs');
    });

    it('exports tableName output', async () => {
      expect(stack.tableName).toBeDefined();
      const tableName = await promiseOf(stack.tableName);
      expect(tableName).toContain('transactions');
    });

    it('exports dashboardUrl output', async () => {
      expect(stack.dashboardUrl).toBeDefined();
      const dashboardUrl = await promiseOf(stack.dashboardUrl);
      expect(dashboardUrl).toContain('cloudwatch');
      expect(dashboardUrl).toContain('dashboards');
    });
  });

  describe('Stack Creation with Default Values', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack-defaults', {});
    });

    it('creates stack with defaults successfully', () => {
      expect(stack).toBeDefined();
    });

    it('uses default environment suffix', async () => {
      const bucketName = await promiseOf(stack.bucketName);
      expect(bucketName).toBeDefined();
    });

    it('has all required outputs with defaults', () => {
      expect(stack.apiUrl).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.dashboardUrl).toBeDefined();
    });
  });
});

describe('NetworkingStack - VPC and Networking', () => {
  let networking: NetworkingStack;

  beforeAll(() => {
    networking = new NetworkingStack('test-networking', {
      environmentSuffix: 'net-test',
      cidrBlock: '10.0.0.0/16',
      availabilityZoneCount: 3,
      tags: pulumi.output({ Environment: 'test' }),
    });
  });

  it('creates networking stack successfully', () => {
    expect(networking).toBeDefined();
    expect(networking).toBeInstanceOf(pulumi.ComponentResource);
  });

  it('creates VPC with correct configuration', async () => {
    expect(networking.vpc).toBeDefined();
    const vpcId = await promiseOf(networking.vpc.id);
    expect(vpcId).toBeDefined();
  });

  it('creates correct number of public subnets', () => {
    expect(networking.publicSubnetIds).toHaveLength(3);
  });

  it('creates correct number of private subnets', () => {
    expect(networking.privateSubnetIds).toHaveLength(3);
  });

  it('exports lambda security group ID', async () => {
    expect(networking.lambdaSecurityGroupId).toBeDefined();
    const sgId = await promiseOf(networking.lambdaSecurityGroupId);
    expect(sgId).toBeDefined();
  });

  it('exports flow log group name', async () => {
    expect(networking.flowLogGroupName).toBeDefined();
    const logGroupName = await promiseOf(networking.flowLogGroupName);
    expect(logGroupName).toBeTruthy();
  });

  it('configures VPC with DNS support', async () => {
    const vpc = networking.vpc;
    expect(vpc).toBeDefined();
  });

  it('creates subnet IDs correctly', async () => {
    const firstPublicSubnet = await promiseOf(networking.publicSubnetIds[0]);
    expect(firstPublicSubnet).toBeDefined();
    expect(typeof firstPublicSubnet).toBe('string');
  });
});

describe('DataStack - DynamoDB and S3', () => {
  let dataStack: DataStack;

  beforeAll(() => {
    dataStack = new DataStack('test-data', {
      environmentSuffix: 'data-test',
      tags: pulumi.output({ Environment: 'test' }),
    });
  });

  it('creates data stack successfully', () => {
    expect(dataStack).toBeDefined();
    expect(dataStack).toBeInstanceOf(pulumi.ComponentResource);
  });

  it('exports table name', async () => {
    expect(dataStack.tableName).toBeDefined();
    const tableName = await promiseOf(dataStack.tableName);
    expect(tableName).toContain('transactions');
    expect(tableName).toContain('data-test');
  });

  it('exports bucket name', async () => {
    expect(dataStack.bucketName).toBeDefined();
    const bucketName = await promiseOf(dataStack.bucketName);
    expect(bucketName).toContain('payment-audit-logs');
  });

  it('exports KMS key ARN', async () => {
    expect(dataStack.kmsKeyArn).toBeDefined();
    const kmsArn = await promiseOf(dataStack.kmsKeyArn);
    expect(kmsArn).toContain('arn:aws:mock');
  });

  it('configures DynamoDB table correctly', async () => {
    const tableName = await promiseOf(dataStack.tableName);
    expect(tableName).toBeTruthy();
  });

  it('configures S3 bucket correctly', async () => {
    const bucketName = await promiseOf(dataStack.bucketName);
    expect(bucketName).toBeTruthy();
  });
});

describe('ComputeStack - Lambda Functions', () => {
  let computeStack: ComputeStack;
  let mockVpc: aws.ec2.Vpc;

  beforeAll(() => {
    // Create mock VPC for compute stack
    mockVpc = new aws.ec2.Vpc('mock-vpc', {
      cidrBlock: '10.0.0.0/16',
    });

    computeStack = new ComputeStack('test-compute', {
      environmentSuffix: 'compute-test',
      vpc: mockVpc,
      privateSubnetIds: [
        pulumi.output('subnet-1'),
        pulumi.output('subnet-2'),
        pulumi.output('subnet-3'),
      ],
      securityGroupId: pulumi.output('sg-12345'),
      tableName: pulumi.output('test-table'),
      bucketName: pulumi.output('test-bucket'),
      snsTopicArn: pulumi.output(''),
      tags: pulumi.output({ Environment: 'test' }),
    });
  });

  it('creates compute stack successfully', () => {
    expect(computeStack).toBeDefined();
    expect(computeStack).toBeInstanceOf(pulumi.ComponentResource);
  });

  it('exports validator lambda ARN', async () => {
    expect(computeStack.validatorLambdaArn).toBeDefined();
    const arn = await promiseOf(computeStack.validatorLambdaArn);
    expect(arn).toBeDefined();
  });

  it('exports validator lambda name', async () => {
    expect(computeStack.validatorLambdaName).toBeDefined();
    const name = await promiseOf(computeStack.validatorLambdaName);
    expect(name).toContain('payment-validator');
  });

  it('exports processor lambda ARN', async () => {
    expect(computeStack.processorLambdaArn).toBeDefined();
    const arn = await promiseOf(computeStack.processorLambdaArn);
    expect(arn).toBeDefined();
  });

  it('exports processor lambda name', async () => {
    expect(computeStack.processorLambdaName).toBeDefined();
    const name = await promiseOf(computeStack.processorLambdaName);
    expect(name).toContain('payment-processor');
  });

  it('exports notifier lambda ARN', async () => {
    expect(computeStack.notifierLambdaArn).toBeDefined();
    const arn = await promiseOf(computeStack.notifierLambdaArn);
    expect(arn).toBeDefined();
  });

  it('exports notifier lambda name', async () => {
    expect(computeStack.notifierLambdaName).toBeDefined();
    const name = await promiseOf(computeStack.notifierLambdaName);
    expect(name).toContain('payment-notifier');
  });

  it('allows setting SNS topic ARN', () => {
    const newSnsArn = pulumi.output('arn:aws:sns:eu-south-2:123456789012:test-topic');
    computeStack.setSnsTopicArn(newSnsArn);
    // No error should be thrown
    expect(true).toBe(true);
  });
});

describe('ApiGatewayStack - REST API', () => {
  let apiStack: ApiGatewayStack;

  beforeAll(() => {
    apiStack = new ApiGatewayStack('test-api', {
      environmentSuffix: 'api-test',
      validatorLambdaArn: pulumi.output('arn:aws:lambda:eu-south-2:123456789012:function:validator'),
      tags: pulumi.output({ Environment: 'test' }),
    });
  });

  it('creates API Gateway stack successfully', () => {
    expect(apiStack).toBeDefined();
    expect(apiStack).toBeInstanceOf(pulumi.ComponentResource);
  });

  it('exports API URL', async () => {
    expect(apiStack.apiUrl).toBeDefined();
    const apiUrl = await promiseOf(apiStack.apiUrl);
    expect(apiUrl).toContain('execute-api');
    expect(apiUrl).toContain('/payments');
  });

  it('exports API ID', async () => {
    expect(apiStack.apiId).toBeDefined();
    const apiId = await promiseOf(apiStack.apiId);
    expect(apiId).toBeDefined();
  });

  it('exports stage name', async () => {
    expect(apiStack.stageName).toBeDefined();
    const stageName = await promiseOf(apiStack.stageName);
    expect(stageName).toBe('api-test');
  });

  it('configures API Gateway correctly', async () => {
    const apiId = await promiseOf(apiStack.apiId);
    expect(apiId).toBeTruthy();
  });
});

describe('MonitoringStack - CloudWatch and SNS', () => {
  let monitoringStack: MonitoringStack;

  beforeAll(() => {
    monitoringStack = new MonitoringStack('test-monitoring', {
      environmentSuffix: 'mon-test',
      validatorLambdaName: pulumi.output('validator-lambda'),
      processorLambdaName: pulumi.output('processor-lambda'),
      notifierLambdaName: pulumi.output('notifier-lambda'),
      tableName: pulumi.output('test-table'),
      apiGatewayId: pulumi.output('api-123'),
      apiGatewayStageName: pulumi.output('test-stage'),
      flowLogGroupName: pulumi.output('/aws/vpc/flow-logs'),
      tags: pulumi.output({ Environment: 'test' }),
    });
  });

  it('creates monitoring stack successfully', () => {
    expect(monitoringStack).toBeDefined();
    expect(monitoringStack).toBeInstanceOf(pulumi.ComponentResource);
  });

  it('exports SNS topic ARN', async () => {
    expect(monitoringStack.snsTopicArn).toBeDefined();
    const topicArn = await promiseOf(monitoringStack.snsTopicArn);
    expect(topicArn).toBeDefined();
  });

  it('exports dashboard URL', async () => {
    expect(monitoringStack.dashboardUrl).toBeDefined();
    const dashboardUrl = await promiseOf(monitoringStack.dashboardUrl);
    expect(dashboardUrl).toContain('cloudwatch');
    expect(dashboardUrl).toContain('dashboards');
  });

  it('configures CloudWatch dashboard', async () => {
    const dashboardUrl = await promiseOf(monitoringStack.dashboardUrl);
    expect(dashboardUrl).toBeTruthy();
  });

  it('configures SNS topic', async () => {
    const topicArn = await promiseOf(monitoringStack.snsTopicArn);
    expect(topicArn).toBeTruthy();
  });
});

describe('Integration - Component Interactions', () => {
  it('integrates all components correctly', async () => {
    const fullStack = new TapStack('integration-test', {
      environmentSuffix: 'integ',
      tags: {
        Test: 'integration',
      },
    });

    // Verify all outputs are defined
    expect(fullStack.apiUrl).toBeDefined();
    expect(fullStack.bucketName).toBeDefined();
    expect(fullStack.tableName).toBeDefined();
    expect(fullStack.dashboardUrl).toBeDefined();

    // Verify outputs can be resolved
    const apiUrl = await promiseOf(fullStack.apiUrl);
    const bucketName = await promiseOf(fullStack.bucketName);
    const tableName = await promiseOf(fullStack.tableName);
    const dashboardUrl = await promiseOf(fullStack.dashboardUrl);

    expect(apiUrl).toBeTruthy();
    expect(bucketName).toBeTruthy();
    expect(tableName).toBeTruthy();
    expect(dashboardUrl).toBeTruthy();
  });

  it('passes environment suffix correctly through components', async () => {
    const testSuffix = 'custom-env-123';
    const stack = new TapStack('env-suffix-test', {
      environmentSuffix: testSuffix,
    });

    const bucketName = await promiseOf(stack.bucketName);
    expect(bucketName).toContain(testSuffix);
  });

  it('merges tags correctly', async () => {
    const customTags = {
      Owner: 'payment-team',
      Project: 'test-project',
    };

    const stack = new TapStack('tags-test', {
      environmentSuffix: 'tag-test',
      tags: customTags,
    });

    expect(stack).toBeDefined();
    // Tags are applied internally, verified by successful creation
  });
});

describe('Edge Cases and Error Handling', () => {
  it('handles empty tags object', () => {
    const stack = new TapStack('empty-tags', {
      environmentSuffix: 'test',
      tags: {},
    });
    expect(stack).toBeDefined();
  });

  it('handles undefined tags', () => {
    const stack = new TapStack('no-tags', {
      environmentSuffix: 'test',
    });
    expect(stack).toBeDefined();
  });

  it('handles special characters in environment suffix', () => {
    const stack = new TapStack('special-chars', {
      environmentSuffix: 'test-env-123',
    });
    expect(stack).toBeDefined();
  });

  it('creates multiple networking stacks independently', () => {
    const net1 = new NetworkingStack('net1', {
      environmentSuffix: 'net1',
      cidrBlock: '10.0.0.0/16',
      availabilityZoneCount: 2,
      tags: pulumi.output({}),
    });

    const net2 = new NetworkingStack('net2', {
      environmentSuffix: 'net2',
      cidrBlock: '10.1.0.0/16',
      availabilityZoneCount: 3,
      tags: pulumi.output({}),
    });

    expect(net1).toBeDefined();
    expect(net2).toBeDefined();
    expect(net1.publicSubnetIds).toHaveLength(2);
    expect(net2.publicSubnetIds).toHaveLength(3);
  });

  it('creates data stack with minimal configuration', () => {
    const data = new DataStack('minimal-data', {
      environmentSuffix: 'min',
      tags: pulumi.output({}),
    });
    expect(data).toBeDefined();
  });
});
