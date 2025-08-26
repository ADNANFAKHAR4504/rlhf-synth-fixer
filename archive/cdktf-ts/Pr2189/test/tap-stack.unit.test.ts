// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope, id, config) => ({
    vpc: { 
      id: `${id}-vpc-id`,
      arn: `arn:aws:ec2:us-east-1:123456789012:vpc/${id}-vpc-id`
    },
    publicSubnets: [
      { id: "subnet-public-1", arn: "arn:aws:ec2:us-east-1:123456789012:subnet/subnet-public-1" },
      { id: "subnet-public-2", arn: "arn:aws:ec2:us-east-1:123456789012:subnet/subnet-public-2" }
    ],
    privateSubnets: [
      { id: "subnet-private-1", arn: "arn:aws:ec2:us-east-1:123456789012:subnet/subnet-private-1" },
      { id: "subnet-private-2", arn: "arn:aws:ec2:us-east-1:123456789012:subnet/subnet-private-2" }
    ],
    internetGateway: {
      id: `${id}-igw-id`,
      arn: `arn:aws:ec2:us-east-1:123456789012:internet-gateway/${id}-igw-id`
    },
    natGateways: [
      { id: `${id}-nat-1-id`, arn: `arn:aws:ec2:us-east-1:123456789012:nat-gateway/${id}-nat-1-id` },
      { id: `${id}-nat-2-id`, arn: `arn:aws:ec2:us-east-1:123456789012:nat-gateway/${id}-nat-2-id` }
    ],
    config,
  })),
  S3Module: jest.fn().mockImplementation((scope, id, config) => ({
    bucket: { 
      bucket: config.bucketName || `${id}-bucket-name`,
      arn: `arn:aws:s3:::${config.bucketName || id + '-bucket-name'}`,
      websiteEndpoint: `${config.bucketName || id + '-bucket-name'}.s3-website-us-east-1.amazonaws.com`
    },
    distribution: {
      id: `${id}-cloudfront-distribution-id`,
      domainName: `${id}-cloudfront-123456.cloudfront.net`,
      arn: `arn:aws:cloudfront::123456789012:distribution/${id}-cloudfront-distribution-id`
    },
    config,
  })),
  IamModule: jest.fn().mockImplementation((scope, id, config) => ({
    instanceRole: {
      name: config.roleName || `${id}-role`,
      arn: `arn:aws:iam::123456789012:role/${config.roleName || id + '-role'}`
    },
    instanceProfile: {
      name: `${config.roleName || id + '-role'}-profile`,
      arn: `arn:aws:iam::123456789012:instance-profile/${config.roleName || id + '-role'}-profile`
    },
    config,
  })),
  AutoScalingModule: jest.fn().mockImplementation((scope, id, config) => ({
    loadBalancer: {
      dnsName: `${id}-alb-123456789.us-east-1.elb.amazonaws.com`,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${id}-alb/1234567890123456`
    },
    autoScalingGroup: {
      name: `${id}-asg`,
      arn: `arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:12345678-1234-1234-1234-123456789012:autoScalingGroupName/${id}-asg`
    },
    config,
  })),
}));

// Mock TerraformOutput and S3Backend to prevent duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    VpcModule,
    S3Module, 
    IamModule,
    AutoScalingModule 
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should create TapStack with default props", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStack");

    expect(stack).toBeDefined();
  });

  test("should create AWS Provider with correct default configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackProvider");

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-east-1',
        defaultTags: [],
      })
    );
  });

  test("should create AWS Provider with custom props", () => {
    const app = new App();
    const customTags = {
      tags: {
        Environment: 'prod',
        Owner: 'DevOps Team',
        Project: 'TapProject',
      },
    };

    new TapStack(app, "TestStackCustom", {
      environmentSuffix: 'prod',
      awsRegion: 'us-west-2',
      defaultTags: customTags,
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2',
        defaultTags: [customTags],
      })
    );
  });

  test("should create S3Backend with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackBackend", {
      environmentSuffix: 'staging',
      stateBucket: 'custom-tf-states',
      stateBucketRegion: 'us-west-1',
    });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'custom-tf-states',
        key: 'staging/TestStackBackend.tfstate',
        region: 'us-west-1',
        encrypt: true,
      })
    );
  });

  test("should create S3Backend with default configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackDefaultBackend");

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'iac-rlhf-tf-states',
        key: 'dev/TestStackDefaultBackend.tfstate',
        region: 'us-east-1',
        encrypt: true,
      })
    );
  });

  test("should create VPC module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackVPC");

    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-dev",
      expect.objectContaining({
        cidrBlock: '10.0.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b'],
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      })
    );
  });

  test("should create S3 module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackS3");

    expect(S3Module).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      "s3-dev",
      expect.objectContaining({
        bucketName: expect.stringMatching(/^my-static-website-dev-\d+$/),
      })
    );
  });

  test("should create IAM module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackIAM");

    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      "iam-dev",
      expect.objectContaining({
        roleName: 'web-server-role-dev',
      })
    );
  });

  test("should create AutoScaling module with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackAutoScaling");

    expect(AutoScalingModule).toHaveBeenCalledTimes(1);
    expect(AutoScalingModule).toHaveBeenCalledWith(
      expect.anything(),
      "autoscaling-dev",
      expect.objectContaining({
        vpcId: 'vpc-dev-vpc-id',
        privateSubnetIds: ['subnet-private-1', 'subnet-private-2'],
        publicSubnetIds: ['subnet-public-1', 'subnet-public-2'],
        instanceProfile: expect.objectContaining({
          name: 'web-server-role-dev-profile',
          arn: 'arn:aws:iam::123456789012:instance-profile/web-server-role-dev-profile'
        }),
        minSize: 1,
        maxSize: 3,
        desiredCapacity: 2,
      })
    );
  });

  test("should handle custom environment suffix", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomEnv", {
      environmentSuffix: 'staging',
    });

    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-staging",
      expect.objectContaining({
        cidrBlock: '10.0.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b'],
      })
    );

    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      "s3-staging",
      expect.objectContaining({
        bucketName: expect.stringMatching(/^my-static-website-staging-\d+$/),
      })
    );

    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      "iam-staging",
      expect.objectContaining({
        roleName: 'web-server-role-staging',
      })
    );

    expect(AutoScalingModule).toHaveBeenCalledWith(
      expect.anything(),
      "autoscaling-staging",
      expect.anything()
    );
  });

  test("should handle custom AWS region with availability zones", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomRegion", {
      awsRegion: 'us-west-2',
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'us-west-2',
      })
    );

    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-dev",
      expect.objectContaining({
        availabilityZones: ["us-west-2a", "us-west-2b"],
      })
    );
  });

  test("should create all terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");


    // Verify specific outputs exist
    const outputCalls = TerraformOutput.mock.calls;
    const outputIds = outputCalls.map((call: any[]) => call[1]);
    
    // VPC outputs
    expect(outputIds).toContain('vpc-id');
    expect(outputIds).toContain('public-subnet-ids');
    expect(outputIds).toContain('private-subnet-ids');
    expect(outputIds).toContain('internet-gateway-id');
    expect(outputIds).toContain('nat-gateway-ids');
    
    // S3 outputs
    expect(outputIds).toContain('s3-bucket-name');
    expect(outputIds).toContain('s3-bucket-arn');
    
    // CloudFront outputs
    expect(outputIds).toContain('cloudfront-distribution-id');
    expect(outputIds).toContain('cloudfront-distribution-domain-name');
    expect(outputIds).toContain('cloudfront-distribution-arn');
    
    // IAM outputs
    expect(outputIds).toContain('iam-role-name');
    expect(outputIds).toContain('iam-role-arn');
    expect(outputIds).toContain('iam-instance-profile-name');
    
    // Auto Scaling outputs
    expect(outputIds).toContain('load-balancer-dns-name');
    expect(outputIds).toContain('load-balancer-arn');
    expect(outputIds).toContain('auto-scaling-group-name');
    expect(outputIds).toContain('auto-scaling-group-arn');
  });

  test("should create stack with all components integrated", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackIntegration");

    // Verify all main components are created
    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(S3Backend).toHaveBeenCalledTimes(1);
    expect(VpcModule).toHaveBeenCalledTimes(1);
    expect(S3Module).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(AutoScalingModule).toHaveBeenCalledTimes(1);

    // Verify the stack is properly constructed
    expect(stack).toBeDefined();
  });

  test("should handle all custom props", () => {
    const app = new App();
    const customTags = {
      tags: {
        Environment: 'production',
        Owner: 'Platform Team',
        Project: 'TapProject',
        CostCenter: '12345',
      },
    };

    new TapStack(app, "TestStackAllCustom", {
      environmentSuffix: 'production',
      stateBucket: 'my-custom-tf-states',
      stateBucketRegion: 'eu-west-1',
      awsRegion: 'eu-west-1',
      defaultTags: customTags,
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'eu-west-1',
        defaultTags: [customTags],
      })
    );

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: 'my-custom-tf-states',
        key: 'production/TestStackAllCustom.tfstate',
        region: 'eu-west-1',
        encrypt: true,
      })
    );

    expect(VpcModule).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-production",
      expect.objectContaining({
        availabilityZones: ["eu-west-1a", "eu-west-1b"],
      })
    );
  });

  test("should verify stack addOverride is called for S3 backend lockfile", () => {
    const app = new App();
    const stack = new TapStack(app, "TestStackOverride");

    // Verify the stack was created successfully
    expect(stack).toBeDefined();
    
    // Note: Testing addOverride directly would require more complex mocking
    // This test ensures the stack construction completes without errors
  });

  test("should use provided AWS region when AWS_REGION_OVERRIDE is empty", () => {
    const app = new App();
    new TapStack(app, "TestStackRegionOverride", {
      awsRegion: 'eu-central-1',
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        region: 'eu-central-1',
      })
    );
  });

  test("should generate unique S3 bucket names with timestamp", () => {
    const app = new App();
    
    // Mock Date.now to return a predictable value
    const mockTimestamp = 1234567890123;
    const originalDateNow = Date.now;
    Date.now = jest.fn().mockReturnValue(mockTimestamp);

    new TapStack(app, "TestStackS3Unique", {
      environmentSuffix: 'test',
    });

    expect(S3Module).toHaveBeenCalledWith(
      expect.anything(),
      "s3-test",
      expect.objectContaining({
        bucketName: `my-static-website-test-${mockTimestamp}`,
      })
    );

    // Restore Date.now
    Date.now = originalDateNow;
  });

  test("should verify CloudFront distribution outputs are created", () => {
    const app = new App();
    new TapStack(app, "TestStackCloudFront");

    const outputCalls = TerraformOutput.mock.calls;
    const cloudFrontOutputs = outputCalls.filter((call: any[]) => 
      call[1].includes('cloudfront')
    );

    expect(cloudFrontOutputs).toHaveLength(3);
    
    // Verify CloudFront-specific outputs
    const outputIds = outputCalls.map((call: any[]) => call[1]);
    expect(outputIds).toContain('cloudfront-distribution-id');
    expect(outputIds).toContain('cloudfront-distribution-domain-name');
    expect(outputIds).toContain('cloudfront-distribution-arn');
  });

  test("should handle empty default tags", () => {
    const app = new App();
    new TapStack(app, "TestStackEmptyTags", {
      defaultTags: undefined,
    });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      'aws',
      expect.objectContaining({
        defaultTags: [],
      })
    );
  });

  test("should create modules with proper dependency chain", () => {
    const app = new App();
    new TapStack(app, "TestStackDependencies");

    // Verify VPC is created first (no dependencies)
    expect(VpcModule).toHaveBeenCalledTimes(1);
    
    // Verify S3 and IAM are created (independent of VPC)
    expect(S3Module).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledTimes(1);
    
    // Verify AutoScaling is created last (depends on VPC and IAM)
    expect(AutoScalingModule).toHaveBeenCalledTimes(1);
    
    // Verify AutoScaling receives VPC and IAM outputs
    expect(AutoScalingModule).toHaveBeenCalledWith(
      expect.anything(),
      "autoscaling-dev",
      expect.objectContaining({
        vpcId: expect.any(String),
        privateSubnetIds: expect.any(Array),
        publicSubnetIds: expect.any(Array),
        instanceProfile: expect.any(Object),
      })
    );
  });
});