// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${config.projectName}-${config.environment}`,
      cidrBlock: config.cidrBlock,
    },
    publicSubnetIds: [`subnet-public-1`, `subnet-public-2`],
    privateSubnetIds: [`subnet-private-1`, `subnet-private-2`],
  })),

  SecurityGroupsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    albSecurityGroup: {
      id: `sg-alb-${config.projectName}-${config.environment}`,
      name: `alb-sg-${config.projectName}`,
    },
    ec2SecurityGroup: {
      id: `sg-ec2-${config.projectName}-${config.environment}`,
      name: `ec2-sg-${config.projectName}`,
    },
  })),

  IamRolesModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    lambdaRole: {
      arn: `arn:aws:iam::123456789012:role/lambda-role-${config.projectName}`,
      name: `lambda-role-${config.projectName}`,
    },
    ec2InstanceProfile: {
      name: `ec2-profile-${config.projectName}`,
      arn: `arn:aws:iam::123456789012:instance-profile/ec2-profile-${config.projectName}`,
    },
  })),

  AlbModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    alb: {
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb-${config.projectName}`,
      dnsName: `alb-${config.projectName}.elb.amazonaws.com`,
      id: `alb-${config.projectName}`,
    },
    targetGroup: {
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-${config.projectName}`,
      id: `tg-${config.projectName}`,
    },
  })),

  AsgModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    autoScalingGroup: {
      name: `asg-${config.projectName}-${config.environment}`,
      id: `asg-${config.projectName}`,
      arn: `arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:asg-${config.projectName}`,
    },
  })),

  LambdaModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    function: {
      arn: `arn:aws:lambda:us-east-1:123456789012:function:lambda-${config.projectName}`,
      functionName: `lambda-${config.projectName}-${config.environment}`,
      invokeArn: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:lambda-${config.projectName}/invocations`,
    },
  })),

  SqsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    queue: {
      arn: `arn:aws:sqs:us-east-1:123456789012:${config.queueName}`,
      url: `https://sqs.us-east-1.amazonaws.com/123456789012/${config.queueName}`,
      name: config.queueName,
    },
  })),

  CloudWatchModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dashboard: {
      id: `dashboard-${config.projectName}`,
      dashboardName: `${config.projectName}-${config.environment}-dashboard`,
    },
    alarms: {
      highCpu: { id: `alarm-cpu-${config.projectName}` },
      lambdaErrors: { id: `alarm-lambda-${config.projectName}` },
    },
  })),

  SsmModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    parameters: Object.keys(config.parameters).map(key => ({
      name: `/${config.projectName}/${config.environment}/${key}`,
      value: config.parameters[key],
    })),
  })),
}));

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

// Mock Archive Provider
jest.mock("@cdktf/provider-archive/lib/provider", () => ({
  ArchiveProvider: jest.fn(),
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation((scope: any, config: any) => ({
      addOverride: jest.fn()
    })),
    TerraformStack: actual.TerraformStack,
  };
});

describe("TapStack Unit Tests", () => {
  const {
    VpcModule,
    SecurityGroupsModule,
    IamRolesModule,
    AlbModule,
    AsgModule,
    LambdaModule,
    SqsModule,
    CloudWatchModule,
    SsmModule,
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { ArchiveProvider } = require("@cdktf/provider-archive/lib/provider");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      // Verify Archive Provider is configured
      expect(ArchiveProvider).toHaveBeenCalledWith(
        expect.anything(),
        'archive'
      );
    });

    test("should create TapStack with custom AWS region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );
    });

    test("should create TapStack with custom default tags", () => {
      const app = new App();
      const customTags = { tags: { Owner: 'DevOps', Environment: 'Production' } };

      new TapStack(app, "TestStack", {
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [customTags]
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );

      TapStack.prototype.addOverride = originalPrototype;
    });

    test("should configure S3 backend with custom state bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'my-custom-state-bucket',
        stateBucketRegion: 'ap-southeast-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-state-bucket',
          region: 'ap-southeast-1'
        })
      );
    });

    test("should configure S3 backend with production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/TestStack.tfstate'
        })
      );
    });
  });

  describe("VPC Module Configuration", () => {
    test("should create VPC with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          projectName: 'myapp',
          environment: 'dev'
        })
      );
    });

    test("should create VPC with environment-specific configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          environment: 'staging'
        })
      );
    });
  });

  describe("SQS Module Configuration", () => {
    test("should create SQS queue with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SqsModule).toHaveBeenCalledWith(
        expect.anything(),
        'sqs',
        expect.objectContaining({
          queueName: 'myapp-dev-processing-queue',
          environment: 'dev'
        })
      );
    });

    test("should create SQS queue with environment-specific name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(SqsModule).toHaveBeenCalledWith(
        expect.anything(),
        'sqs',
        expect.objectContaining({
          queueName: 'myapp-prod-processing-queue',
          environment: 'prod'
        })
      );
    });
  });

  describe("Security Groups Module Configuration", () => {
    test("should create security groups with VPC ID", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        'security-groups',
        expect.objectContaining({
          vpcId: 'vpc-myapp-dev',
          projectName: 'myapp',
          environment: 'dev'
        })
      );
    });
  });

  describe("IAM Roles Module Configuration", () => {
    test("should create IAM roles with SQS queue ARN", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(IamRolesModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam-roles',
        expect.objectContaining({
          projectName: 'myapp',
          environment: 'dev',
          sqsQueueArn: 'arn:aws:sqs:us-east-1:123456789012:myapp-dev-processing-queue'
        })
      );
    });
  });

  describe("ALB Module Configuration", () => {
    test("should create ALB with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({
          projectName: 'myapp',
          environment: 'dev',
          vpcId: 'vpc-myapp-dev',
          publicSubnetIds: ['subnet-public-1', 'subnet-public-2'],
          securityGroupId: 'sg-alb-myapp-dev',
          logBucket: 'myapp-dev-alb-logs-us-east-1'
        })
      );
    });

    test("should use correct log bucket name with custom region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-central-1'
      });

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({
          logBucket: 'myapp-dev-alb-logs-eu-central-1'
        })
      );
    });
  });

  describe("ASG Module Configuration", () => {
    test("should create ASG with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'asg',
        expect.objectContaining({
          projectName: 'myapp',
          environment: 'dev',
          vpcId: 'vpc-myapp-dev',
          privateSubnetIds: ['subnet-private-1', 'subnet-private-2'],
          targetGroupArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-myapp',
          securityGroupId: 'sg-ec2-myapp-dev',
          instanceProfileName: 'ec2-profile-myapp',
          minSize: 1,
          maxSize: 3,
          desiredCapacity: 2
        })
      );
    });
  });

  describe("Lambda Module Configuration", () => {
    test("should create Lambda with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'lambda',
        expect.objectContaining({
          projectName: 'myapp',
          environment: 'dev',
          roleArn: 'arn:aws:iam::123456789012:role/lambda-role-myapp',
          sqsQueueArn: 'arn:aws:sqs:us-east-1:123456789012:myapp-dev-processing-queue',
          timeout: 300
        })
      );
    });

    test("should create Lambda with environment-specific configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'lambda',
        expect.objectContaining({
          environment: 'staging',
          sqsQueueArn: 'arn:aws:sqs:us-east-1:123456789012:myapp-staging-processing-queue'
        })
      );
    });
  });

  describe("CloudWatch Module Configuration", () => {
    test("should create CloudWatch monitoring with correct resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        'cloudwatch',
        expect.objectContaining({
          projectName: 'myapp',
          environment: 'dev',
          asgName: 'asg-myapp-dev',
          lambdaFunctionName: 'lambda-myapp-dev',
          albArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/alb-myapp'
        })
      );
    });
  });

  describe("SSM Module Configuration", () => {
    test("should create SSM parameters with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SsmModule).toHaveBeenCalledWith(
        expect.anything(),
        'ssm',
        expect.objectContaining({
          projectName: 'myapp',
          environment: 'dev',
          parameters: {
            db_host: 'localhost',
            db_port: '5432',
            app_version: '1.0.0',
            feature_flags: '{"newFeature":true}'
          }
        })
      );
    });

    test("should create SSM parameters with environment-specific configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(SsmModule).toHaveBeenCalledWith(
        expect.anything(),
        'ssm',
        expect.objectContaining({
          environment: 'prod'
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(9);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('alb-dns-name');
      expect(outputIds).toContain('asg-name');
      expect(outputIds).toContain('lambda-function-name');
      expect(outputIds).toContain('lambda-function-arn');
      expect(outputIds).toContain('sqs-queue-url');
      expect(outputIds).toContain('sqs-queue-arn');
    });

    test("should output correct VPC and subnet information", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      const publicSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );
      const privateSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-subnet-ids'
      );

      expect(vpcOutput[2].value).toBe('vpc-myapp-dev');
      expect(publicSubnetsOutput[2].value).toEqual(['subnet-public-1', 'subnet-public-2']);
      expect(privateSubnetsOutput[2].value).toEqual(['subnet-private-1', 'subnet-private-2']);
    });

    test("should output ALB DNS name", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );

      expect(albOutput[2].value).toBe('alb-myapp.elb.amazonaws.com');
      expect(albOutput[2].description).toBe('ALB DNS name');
    });

    test("should output Lambda function details", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaNameOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'lambda-function-name'
      );
      const lambdaArnOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'lambda-function-arn'
      );

      expect(lambdaNameOutput[2].value).toBe('lambda-myapp-dev');
      expect(lambdaArnOutput[2].value).toBe(
        'arn:aws:lambda:us-east-1:123456789012:function:lambda-myapp'
      );
    });

    test("should output SQS queue details", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const queueUrlOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'sqs-queue-url'
      );
      const queueArnOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'sqs-queue-arn'
      );

      expect(queueUrlOutput[2].value).toBe(
        'https://sqs.us-east-1.amazonaws.com/123456789012/myapp-dev-processing-queue'
      );
      expect(queueArnOutput[2].value).toBe(
        'arn:aws:sqs:us-east-1:123456789012:myapp-dev-processing-queue'
      );
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({ environment: 'dev' })
      );

      expect(SqsModule).toHaveBeenCalledWith(
        expect.anything(),
        'sqs',
        expect.objectContaining({ 
          queueName: 'myapp-dev-processing-queue',
          environment: 'dev' 
        })
      );
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'lambda',
        expect.objectContaining({ environment: 'staging' })
      );

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        'cloudwatch',
        expect.objectContaining({ 
          environment: 'staging',
          lambdaFunctionName: 'lambda-myapp-staging'
        })
      );
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        'asg',
        expect.objectContaining({ environment: 'prod' })
      );

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({ 
          environment: 'prod',
          logBucket: 'myapp-prod-alb-logs-us-east-1'
        })
      );
    });
  });

  describe("Module Dependencies and Order", () => {
    test("should create modules in correct dependency order", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // VPC should be created first
      const vpcOrder = VpcModule.mock.invocationCallOrder[0];
      
      // SQS should be created before IAM (IAM needs SQS ARN)
      const sqsOrder = SqsModule.mock.invocationCallOrder[0];
      const iamOrder = IamRolesModule.mock.invocationCallOrder[0];
      expect(sqsOrder).toBeLessThan(iamOrder);

      // Security Groups need VPC
      const sgOrder = SecurityGroupsModule.mock.invocationCallOrder[0];
      expect(vpcOrder).toBeLessThan(sgOrder);

      // ALB needs VPC, subnets, and security groups
      const albOrder = AlbModule.mock.invocationCallOrder[0];
      expect(sgOrder).toBeLessThan(albOrder);

      // ASG needs ALB target group
      const asgOrder = AsgModule.mock.invocationCallOrder[0];
      expect(albOrder).toBeLessThan(asgOrder);

      // Lambda needs IAM role
      const lambdaOrder = LambdaModule.mock.invocationCallOrder[0];
      expect(iamOrder).toBeLessThan(lambdaOrder);

      // CloudWatch needs ASG and Lambda
      const cloudWatchOrder = CloudWatchModule.mock.invocationCallOrder[0];
      expect(asgOrder).toBeLessThan(cloudWatchOrder);
      expect(lambdaOrder).toBeLessThan(cloudWatchOrder);
    });

    test("should pass VPC outputs to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;

      // Security Groups should receive VPC ID
      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ vpcId: vpcModule.vpc.id })
      );

      // ALB should receive VPC ID and subnets
      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ 
          vpcId: vpcModule.vpc.id,
          publicSubnetIds: vpcModule.publicSubnetIds 
        })
      );

      // ASG should receive VPC ID and private subnets
      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ 
          vpcId: vpcModule.vpc.id,
          privateSubnetIds: vpcModule.privateSubnetIds 
        })
      );
    });

    test("should pass security group IDs to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const sgModule = SecurityGroupsModule.mock.results[0].value;

      // ALB should receive ALB security group
      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ 
          securityGroupId: sgModule.albSecurityGroup.id 
        })
      );

      // ASG should receive EC2 security group
      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ 
          securityGroupId: sgModule.ec2SecurityGroup.id 
        })
      );
    });

    test("should pass IAM resources to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamRolesModule.mock.results[0].value;

      // Lambda should receive Lambda role ARN
      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ 
          roleArn: iamModule.lambdaRole.arn 
        })
      );

      // ASG should receive EC2 instance profile
      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ 
          instanceProfileName: iamModule.ec2InstanceProfile.name 
        })
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", undefined);

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1'
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {});

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          environment: 'dev'
        })
      );
    });

    test("should handle all props being set", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        environmentSuffix: 'prod',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'ap-southeast-2',
        defaultTags: { tags: { Owner: 'TeamA' } }
      });

      expect(stack).toBeDefined();

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-2',
          defaultTags: [{ tags: { Owner: 'TeamA' } }]
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-state-bucket',
          key: 'prod/TestStack.tfstate',
          region: 'eu-west-1'
        })
      );

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({
          logBucket: 'myapp-prod-alb-logs-ap-southeast-2'
        })
      );
    });
  });

  describe("Resource Naming Conventions", () => {
    test("should follow consistent naming pattern across all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'test'
      });

      // Check SQS queue naming
      expect(SqsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          queueName: 'myapp-test-processing-queue'
        })
      );

      // Check ALB log bucket naming
      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          logBucket: 'myapp-test-alb-logs-us-east-1'
        })
      );

      // Check all modules receive consistent project name and environment
      const modules = [
        VpcModule,
        SecurityGroupsModule,
        IamRolesModule,
        AlbModule,
        AsgModule,
        LambdaModule,
        CloudWatchModule,
        SsmModule
      ];

      modules.forEach(module => {
        if (module === SqsModule) return; // SQS has different props structure
        
        expect(module).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            projectName: 'myapp',
            environment: 'test'
          })
        );
      });
    });

    test("should maintain naming consistency in outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const asgOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'asg-name'
      );
      const lambdaOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'lambda-function-name'
      );

      expect(asgOutput[2].value).toBe('asg-myapp-staging');
      expect(lambdaOutput[2].value).toBe('lambda-myapp-staging');
    });
  });

  describe("Integration Tests", () => {
    test("should create complete infrastructure stack", () => {
      const app = new App();
      const stack = new TapStack(app, "IntegrationTest");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(ArchiveProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SqsModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
      expect(IamRolesModule).toHaveBeenCalledTimes(1);
      expect(AlbModule).toHaveBeenCalledTimes(1);
      expect(AsgModule).toHaveBeenCalledTimes(1);
      expect(LambdaModule).toHaveBeenCalledTimes(1);
      expect(CloudWatchModule).toHaveBeenCalledTimes(1);
      expect(SsmModule).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(9);

      expect(stack).toBeDefined();
    });

    test("should maintain resource relationships and dependencies", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Verify correct resource relationships
      const sqsModule = SqsModule.mock.results[0].value;
      const iamModule = IamRolesModule.mock.results[0].value;
      const sgModule = SecurityGroupsModule.mock.results[0].value;
      const albModule = AlbModule.mock.results[0].value;
      const asgModule = AsgModule.mock.results[0].value;
      const lambdaModule = LambdaModule.mock.results[0].value;

      // IAM should use SQS ARN
      expect(IamRolesModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          sqsQueueArn: sqsModule.queue.arn
        })
      );

      // ASG should use ALB target group
      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          targetGroupArn: albModule.targetGroup.arn
        })
      );

      // Lambda should use IAM role and SQS
      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          roleArn: iamModule.lambdaRole.arn,
          sqsQueueArn: sqsModule.queue.arn
        })
      );

      // CloudWatch should monitor ASG, Lambda, and ALB
      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          asgName: asgModule.autoScalingGroup.name,
          lambdaFunctionName: lambdaModule.function.functionName,
          albArn: albModule.alb.arn
        })
      );
    });

    test("should handle AWS region configuration across all resources", () => {
      const app = new App();
      new TapStack(app, "RegionTest", {
        awsRegion: 'eu-central-1',
        stateBucketRegion: 'us-west-2',
        environmentSuffix: 'prod'
      });

      // Verify provider uses correct region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1'
        })
      );

      // Verify state bucket uses different region
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-west-2'
        })
      );

      // Verify ALB log bucket uses correct region suffix
      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          logBucket: 'myapp-prod-alb-logs-eu-central-1'
        })
      );
    });

    test("should create all outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "OutputTest", {
        environmentSuffix: 'qa'
      });

      // Verify outputs reference the correct module outputs
      const vpcIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      const albDnsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );
      const sqsUrlOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'sqs-queue-url'
      );

      expect(vpcIdOutput[2].value).toBe('vpc-myapp-qa');
      expect(albDnsOutput[2].value).toBe('alb-myapp.elb.amazonaws.com');
      expect(sqsUrlOutput[2].value).toBe('https://sqs.us-east-1.amazonaws.com/123456789012/myapp-qa-processing-queue');
    });
  });
});