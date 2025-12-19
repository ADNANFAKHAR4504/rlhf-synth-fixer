import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { IdentityInfrastructure } from "../lib/components/identity";
import { NetworkingInfrastructure } from "../lib/components/networking";
import { ElasticBeanstalkInfrastructure } from "../lib/components/elastic_beanstalk";
import { MonitoringInfrastructure } from "../lib/components/monitoring";
import { TapStack } from "../lib/tap-stack";

// Mock console methods to reduce test noise
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock the aws.getAvailabilityZones function BEFORE setting Pulumi mocks
jest.mock("@pulumi/aws", () => {
  const actualAws = jest.requireActual("@pulumi/aws");
  return {
    ...actualAws,
    getAvailabilityZones: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        names: ["us-east-1a", "us-east-1b", "us-west-1a", "us-west-1b"],
        zoneIds: ["use1-az1", "use1-az2", "usw1-az1", "usw1-az2"],
        groupNames: [],
        id: "mock-az-result",
      });
    }),
    getCallerIdentity: jest.fn().mockResolvedValue({
      accountId: "123456789012",
      arn: "arn:aws:iam::123456789012:user/test-user",
      userId: "AIDACKCEVSQ6C2EXAMPLE",
    }),
  };
});

// Enhanced Pulumi runtime mock
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const mockId = `${args.name}-${Math.random().toString(36).substr(2, 9)}`;
    
    let state: any = { 
      id: mockId,
    };
    
    switch (args.type) {
      case "aws:ec2/vpc:Vpc":
        state = {
          ...state,
          cidrBlock: args.inputs.cidrBlock || "10.0.0.0/16",
          enableDnsHostnames: args.inputs.enableDnsHostnames || true,
          enableDnsSupport: args.inputs.enableDnsSupport || true,
        };
        break;
        
      case "aws:ec2/subnet:Subnet":
        state = {
          ...state,
          vpcId: args.inputs.vpcId || "vpc-mock-id",
          cidrBlock: args.inputs.cidrBlock || "10.0.1.0/24",
          availabilityZone: args.inputs.availabilityZone || "us-east-1a",
          mapPublicIpOnLaunch: args.inputs.mapPublicIpOnLaunch || false,
        };
        break;
        
      case "aws:ec2/internetGateway:InternetGateway":
        state = {
          ...state,
          vpcId: args.inputs.vpcId || "vpc-mock-id",
        };
        break;
        
      case "aws:ec2/eip:Eip":
        state = {
          ...state,
          domain: args.inputs.domain || "vpc",
          allocationId: `eipalloc-${mockId}`,
        };
        break;
        
      case "aws:ec2/natGateway:NatGateway":
        state = {
          ...state,
          allocationId: args.inputs.allocationId || "eipalloc-mock",
          subnetId: args.inputs.subnetId || "subnet-mock",
        };
        break;
        
      case "aws:ec2/routeTable:RouteTable":
        state = {
          ...state,
          vpcId: args.inputs.vpcId || "vpc-mock-id",
          routes: args.inputs.routes || [],
        };
        break;
        
      case "aws:ec2/securityGroup:SecurityGroup":
        state = {
          ...state,
          vpcId: args.inputs.vpcId || "vpc-mock-id",
          ingress: args.inputs.ingress || [],
          egress: args.inputs.egress || [],
        };
        break;
        
      case "aws:iam/role:Role":
        state = {
          ...state,
          name: args.inputs.name || `mock-role-${mockId}`,
          arn: `arn:aws:iam::123456789012:role/${args.inputs.name || mockId}`,
          assumeRolePolicy: args.inputs.assumeRolePolicy,
        };
        break;
        
      case "aws:iam/instanceProfile:InstanceProfile":
        state = {
          ...state,
          name: args.inputs.name || `mock-profile-${mockId}`,
          arn: `arn:aws:iam::123456789012:instance-profile/${args.inputs.name || mockId}`,
          role: args.inputs.role,
        };
        break;
        
      case "aws:iam/policy:Policy":
        state = {
          ...state,
          name: args.inputs.name || `mock-policy-${mockId}`,
          arn: `arn:aws:iam::123456789012:policy/${args.inputs.name || mockId}`,
          policy: args.inputs.policy,
        };
        break;
        
      case "aws:elasticbeanstalk/application:Application":
        state = {
          ...state,
          name: args.inputs.name || `mock-app-${mockId}`,
          arn: `arn:aws:elasticbeanstalk:us-east-1:123456789012:application/${args.inputs.name || mockId}`,
        };
        break;
        
      case "aws:elasticbeanstalk/configurationTemplate:ConfigurationTemplate":
        state = {
          ...state,
          name: args.inputs.name || `mock-template-${mockId}`,
          application: args.inputs.application,
          solutionStackName: args.inputs.solutionStackName,
        };
        break;
        
      case "aws:elasticbeanstalk/environment:Environment":
        state = {
          ...state,
          name: args.inputs.name || `mock-env-${mockId}`,
          application: args.inputs.application,
          endpointUrl: `http://${args.inputs.name || mockId}.us-east-1.elasticbeanstalk.com`,
          cname: `${args.inputs.name || mockId}.us-east-1.elasticbeanstalk.com`,
        };
        break;
        
      case "aws:sns/topic:Topic":
        state = {
          ...state,
          name: args.inputs.name || `mock-topic-${mockId}`,
          arn: `arn:aws:sns:us-east-1:123456789012:${args.inputs.name || mockId}`,
          displayName: args.inputs.displayName,
        };
        break;
        
      case "aws:sns/topicPolicy:TopicPolicy":
        state = {
          ...state,
          arn: args.inputs.arn || `arn:aws:sns:us-east-1:123456789012:mock-topic`,
          policy: args.inputs.policy,
        };
        break;
        
      case "aws:cloudwatch/dashboard:Dashboard":
        state = {
          ...state,
          dashboardName: args.inputs.dashboardName || `mock-dashboard-${mockId}`,
          dashboardBody: args.inputs.dashboardBody,
        };
        break;
        
      case "aws:cloudwatch/metricAlarm:MetricAlarm":
        state = {
          ...state,
          name: args.inputs.name || `mock-alarm-${mockId}`,
          metricName: args.inputs.metricName,
          namespace: args.inputs.namespace,
          threshold: args.inputs.threshold,
        };
        break;
        
      case "pulumi:providers:aws":
        state = {
          ...state,
          region: args.inputs.region || "us-east-1",
        };
        break;
        
      default:
        state = {
          ...state,
          ...args.inputs,
        };
    }
    
    return { id: mockId, state };
  },
  
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === "aws:getAvailabilityZones") {
      return Promise.resolve({
        names: ["us-east-1a", "us-east-1b", "us-west-1a", "us-west-1b"],
        zoneIds: ["use1-az1", "use1-az2", "usw1-az1", "usw1-az2"],
        groupNames: [],
        id: "mock-az-call-result",
      });
    }
    
    if (args.token === "aws:getCallerIdentity") {
      return Promise.resolve({
        accountId: "123456789012",
        arn: "arn:aws:iam::123456789012:user/test-user",
        userId: "AIDACKCEVSQ6C2EXAMPLE",
      });
    }
    
    return Promise.resolve({});
  },
});

// Helper function to resolve Pulumi Output values
async function resolveOutput<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => {
    output.apply((value: T) => {
      resolve(value);
      return value;
    });
  });
}

describe("Infrastructure Components End-to-End Tests", () => {
  // Increase timeout for async operations
  jest.setTimeout(60000);

  const testTags = {
    Environment: "test",
    Project: "IaC-AWS-Nova-Model-Breaking",
    Application: "nova-web-app",
    ManagedBy: "Pulumi",
  };

  describe("IdentityInfrastructure", () => {
    let identity: IdentityInfrastructure;

    beforeEach(() => {
      identity = new IdentityInfrastructure("test-identity", {
        tags: testTags,
      });
    });

    it("should create all required IAM resources", () => {
      expect(identity.ebServiceRole).toBeDefined();
      expect(identity.ebInstanceRole).toBeDefined();
      expect(identity.ebInstanceProfile).toBeDefined();
      expect(identity.autoscalingRole).toBeDefined();
      expect(identity.ebInstancePolicy).toBeDefined();
      expect(identity.autoscalingPolicy).toBeDefined();
    });

    it("should create EB service role with correct ARN", async () => {
      const arn = await resolveOutput(identity.ebServiceRoleArn);
      expect(arn).toMatch(/^arn:aws:iam::123456789012:role\//);
    });

    it("should create EB instance role with correct ARN", async () => {
      const arn = await resolveOutput(identity.ebInstanceRoleArn);
      expect(arn).toMatch(/^arn:aws:iam::123456789012:role\//);
    });

    it("should create instance profile with correct name", async () => {
      const name = await resolveOutput(identity.ebInstanceProfileName);
      expect(name).toContain("nova-eb-instance-profile");
    });

    it("should create autoscaling role with correct ARN", async () => {
      const arn = await resolveOutput(identity.autoscalingRoleArn);
      expect(arn).toMatch(/^arn:aws:iam::123456789012:role\//);
    });

    it("should have proper resource types", () => {
      expect(identity.ebServiceRole).toHaveProperty('urn');
      expect(identity.ebInstanceRole).toHaveProperty('urn');
      expect(identity.ebInstanceProfile).toHaveProperty('urn');
      expect(identity.autoscalingRole).toHaveProperty('urn');
    });

    it("should create policies for roles", () => {
      expect(identity.ebInstancePolicy).toBeDefined();
      expect(identity.autoscalingPolicy).toBeDefined();
      expect(identity.ebInstancePolicy).toHaveProperty('urn');
      expect(identity.autoscalingPolicy).toHaveProperty('urn');
    });
  });

  describe("NetworkingInfrastructure", () => {
    let networking: NetworkingInfrastructure;

    beforeEach(() => {
      networking = new NetworkingInfrastructure("test-networking", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        tags: testTags,
      });
    });

    it("should create VPC with correct CIDR for primary region", async () => {
      const cidr = await resolveOutput(networking.vpc.cidrBlock);
      expect(cidr).toBe("10.0.0.0/16");
    });

    it("should create VPC with secondary CIDR for non-primary region", async () => {
      const secondaryNetworking = new NetworkingInfrastructure("test-networking-secondary", {
        region: "us-west-1",
        isPrimary: false,
        environment: "test",
        tags: testTags,
      });
      
      expect(secondaryNetworking).toBeDefined();
      const cidr = await resolveOutput(secondaryNetworking.vpc.cidrBlock);
      expect(cidr).toBe("10.1.0.0/16");
    });

    it("should create public and private subnets", () => {
      expect(networking.publicSubnets).toBeDefined();
      expect(networking.privateSubnets).toBeDefined();
      expect(Array.isArray(networking.publicSubnets)).toBe(true);
      expect(Array.isArray(networking.privateSubnets)).toBe(true);
    });

    it("should create internet gateway", () => {
      expect(networking.igw).toBeDefined();
      expect(networking.igw).toHaveProperty('urn');
    });

    it("should create NAT gateways", () => {
      expect(networking.natGateways).toBeDefined();
      expect(Array.isArray(networking.natGateways)).toBe(true);
    });

    it("should create route tables", () => {
      expect(networking.publicRt).toBeDefined();
      expect(networking.privateRts).toBeDefined();
      expect(Array.isArray(networking.privateRts)).toBe(true);
    });

    it("should create security groups", () => {
      expect(networking.albSecurityGroup).toBeDefined();
      expect(networking.ebSecurityGroup).toBeDefined();
    });

    it("should expose correct property getters", async () => {
      const vpcId = await resolveOutput(networking.vpcId);
      const albSgId = await resolveOutput(networking.albSecurityGroupId);
      const ebSgId = await resolveOutput(networking.ebSecurityGroupId);
      
      expect(vpcId).toBeDefined();
      expect(albSgId).toBeDefined();
      expect(ebSgId).toBeDefined();
    });

    it("should have proper subnet arrays", () => {
      expect(networking.publicSubnetIds).toBeDefined();
      expect(networking.privateSubnetIds).toBeDefined();
      expect(Array.isArray(networking.publicSubnetIds)).toBe(true);
      expect(Array.isArray(networking.privateSubnetIds)).toBe(true);
    });

    it("should handle different regions properly", async () => {
      const region1 = new NetworkingInfrastructure("region1", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        tags: testTags,
      });

      const region2 = new NetworkingInfrastructure("region2", {
        region: "us-west-1",
        isPrimary: false,
        environment: "test",
        tags: testTags,
      });

      const cidr1 = await resolveOutput(region1.vpc.cidrBlock);
      const cidr2 = await resolveOutput(region2.vpc.cidrBlock);

      expect(cidr1).toBe("10.0.0.0/16");
      expect(cidr2).toBe("10.1.0.0/16");
    });
  });

  describe("ElasticBeanstalkInfrastructure", () => {
    let eb: ElasticBeanstalkInfrastructure;
    let identity: IdentityInfrastructure;
    let networking: NetworkingInfrastructure;

    beforeEach(() => {
      identity = new IdentityInfrastructure("test-identity-eb", {
        tags: testTags,
      });

      networking = new NetworkingInfrastructure("test-networking-eb", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        tags: testTags,
      });

      eb = new ElasticBeanstalkInfrastructure("test-eb", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        environmentSuffix: "useast1-test",
        vpcId: networking.vpcId,
        publicSubnetIds: networking.publicSubnetIds,
        privateSubnetIds: networking.privateSubnetIds,
        albSecurityGroupId: networking.albSecurityGroupId,
        ebSecurityGroupId: networking.ebSecurityGroupId,
        ebServiceRoleArn: identity.ebServiceRoleArn,
        ebInstanceProfileName: identity.ebInstanceProfileName,
        tags: testTags,
      });
    });

    it("should create Elastic Beanstalk application", () => {
      expect(eb.application).toBeDefined();
      expect(eb.application).toHaveProperty('urn');
    });

    it("should create configuration template", () => {
      expect(eb.configTemplate).toBeDefined();
      expect(eb.configTemplate).toHaveProperty('urn');
    });

    it("should create Elastic Beanstalk environment", () => {
      expect(eb.ebEnvironment).toBeDefined();
      expect(eb.ebEnvironment).toHaveProperty('urn');
    });

    it("should expose correct property getters", async () => {
      const appName = await resolveOutput(eb.applicationName);
      const envName = await resolveOutput(eb.environmentName);
      const envUrl = await resolveOutput(eb.environmentUrl);
      const envCname = await resolveOutput(eb.environmentCname);

      expect(appName).toBeDefined();
      expect(envName).toBeDefined();
      expect(envUrl).toMatch(/^http:\/\/.+\.elasticbeanstalk\.com$/);
      expect(envCname).toMatch(/\.elasticbeanstalk\.com$/);
    });

    it("should use deterministic environment naming based on environmentSuffix", async () => {
      const envName = await resolveOutput(eb.environmentName);
      
      // Environment name should include the region suffix and environment suffix
      expect(envName).toMatch(/^nova-env-useast1-/);
      expect(envName).toContain("useast1-test");
    });

    it("should create consistent environment names across multiple instances", async () => {
      // Create two instances with the same parameters
      const eb1 = new ElasticBeanstalkInfrastructure("test-eb-1", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        environmentSuffix: "consistent-test",
        vpcId: networking.vpcId,
        publicSubnetIds: networking.publicSubnetIds,
        privateSubnetIds: networking.privateSubnetIds,
        albSecurityGroupId: networking.albSecurityGroupId,
        ebSecurityGroupId: networking.ebSecurityGroupId,
        ebServiceRoleArn: identity.ebServiceRoleArn,
        ebInstanceProfileName: identity.ebInstanceProfileName,
        tags: testTags,
      });

      const eb2 = new ElasticBeanstalkInfrastructure("test-eb-2", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        environmentSuffix: "consistent-test",
        vpcId: networking.vpcId,
        publicSubnetIds: networking.publicSubnetIds,
        privateSubnetIds: networking.privateSubnetIds,
        albSecurityGroupId: networking.albSecurityGroupId,
        ebSecurityGroupId: networking.ebSecurityGroupId,
        ebServiceRoleArn: identity.ebServiceRoleArn,
        ebInstanceProfileName: identity.ebInstanceProfileName,
        tags: testTags,
      });

      const envName1 = await resolveOutput(eb1.environmentName);
      const envName2 = await resolveOutput(eb2.environmentName);

      // Both should follow the same naming pattern (deterministic)
      expect(envName1).toMatch(/^nova-env-useast1-consistent-test$/);
      expect(envName2).toMatch(/^nova-env-useast1-consistent-test$/);
    });

    it("should use different environment names for different environmentSuffix values", async () => {
      const eb1 = new ElasticBeanstalkInfrastructure("test-eb-diff-1", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        environmentSuffix: "suffix1",
        vpcId: networking.vpcId,
        publicSubnetIds: networking.publicSubnetIds,
        privateSubnetIds: networking.privateSubnetIds,
        albSecurityGroupId: networking.albSecurityGroupId,
        ebSecurityGroupId: networking.ebSecurityGroupId,
        ebServiceRoleArn: identity.ebServiceRoleArn,
        ebInstanceProfileName: identity.ebInstanceProfileName,
        tags: testTags,
      });

      const eb2 = new ElasticBeanstalkInfrastructure("test-eb-diff-2", {
        region: "us-west-1",
        isPrimary: false,
        environment: "test", 
        environmentSuffix: "suffix2",
        vpcId: networking.vpcId,
        publicSubnetIds: networking.publicSubnetIds,
        privateSubnetIds: networking.privateSubnetIds,
        albSecurityGroupId: networking.albSecurityGroupId,
        ebSecurityGroupId: networking.ebSecurityGroupId,
        ebServiceRoleArn: identity.ebServiceRoleArn,
        ebInstanceProfileName: identity.ebInstanceProfileName,
        tags: testTags,
      });

      const envName1 = await resolveOutput(eb1.environmentName);
      const envName2 = await resolveOutput(eb2.environmentName);

      expect(envName1).toBe("nova-env-useast1-suffix1");
      expect(envName2).toBe("nova-env-uswest1-suffix2");
      expect(envName1).not.toBe(envName2);
    });

    it("should handle empty subnet arrays gracefully", () => {
      // Test with empty subnet arrays to cover warning branches (lines 109-112, 120-123)
      const ebWithEmptySubnets = new ElasticBeanstalkInfrastructure("test-eb-empty-subnets", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        environmentSuffix: "empty-test",
        vpcId: pulumi.output("vpc-mock"),
        publicSubnetIds: [], // Empty array to trigger warning
        privateSubnetIds: [], // Empty array to trigger warning
        albSecurityGroupId: pulumi.output("sg-alb-mock"),
        ebSecurityGroupId: pulumi.output("sg-eb-mock"),
        ebServiceRoleArn: pulumi.output("arn:aws:iam::123456789012:role/mock-role"),
        ebInstanceProfileName: pulumi.output("mock-instance-profile"),
        tags: testTags,
      });

      // Verify the infrastructure is still created despite empty subnets
      expect(ebWithEmptySubnets.application).toBeDefined();
      expect(ebWithEmptySubnets.configTemplate).toBeDefined();
      expect(ebWithEmptySubnets.ebEnvironment).toBeDefined();
    });
  });

  describe("MonitoringInfrastructure", () => {
    let monitoring: MonitoringInfrastructure;

    beforeEach(() => {
      monitoring = new MonitoringInfrastructure("test-monitoring", {
        region: "us-east-1",
        environment: "test",
        tags: testTags,
      });
    });

    it("should create SNS topic", () => {
      expect(monitoring.snsTopic).toBeDefined();
      expect(monitoring.snsTopic).toHaveProperty('urn');
    });

    it("should create SNS topic policy", () => {
      expect(monitoring.snsTopicPolicy).toBeDefined();
      expect(monitoring.snsTopicPolicy).toHaveProperty('urn');
    });

    it("should create CloudWatch dashboard", () => {
      expect(monitoring.dashboard).toBeDefined();
      expect(monitoring.dashboard).toHaveProperty('urn');
    });

    it("should expose correct property getters", async () => {
      const dashboardName = await resolveOutput(monitoring.dashboardName);
      const snsTopicArn = await resolveOutput(monitoring.snsTopicArn);

      expect(dashboardName).toBeDefined();
      expect(snsTopicArn).toMatch(/^arn:aws:sns:us-east-1:123456789012:/);
    });

    it("should create CPU alarm with correct configuration", () => {
      const environmentName = pulumi.output("test-env");
      const asgName = pulumi.output("test-asg");
      
      const alarm = monitoring.createCpuAlarm(environmentName, asgName);
      
      expect(alarm).toBeDefined();
      expect(alarm).toHaveProperty('urn');
    });

    it("should create error alarm with correct configuration", () => {
      const environmentName = pulumi.output("test-env");
      
      const alarm = monitoring.createErrorAlarm(environmentName);
      
      expect(alarm).toBeDefined();
      expect(alarm).toHaveProperty('urn');
    });

    it("should create health alarm with correct configuration", () => {
      const environmentName = pulumi.output("test-env");
      
      const alarm = monitoring.createHealthAlarm(environmentName);
      
      expect(alarm).toBeDefined();
      expect(alarm).toHaveProperty('urn');
    });

    it("should create response time alarm with correct configuration", () => {
      const lbFullName = pulumi.output("test-lb");
      
      const alarm = monitoring.createResponseTimeAlarm(lbFullName);
      
      expect(alarm).toBeDefined();
      expect(alarm).toHaveProperty('urn');
    });

    it("should handle different regions", () => {
      const monitoring2 = new MonitoringInfrastructure("test-monitoring-west", {
        region: "us-west-1",
        environment: "prod",
        tags: testTags,
      });

      expect(monitoring2).toBeDefined();
      expect(monitoring2.snsTopic).toBeDefined();
    });
  });

  describe("TapStack Integration", () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack("test-stack", {
        environmentSuffix: "test",
        regions: ["us-east-1"],
        tags: testTags,
        isLocalStack: false, // Force EB creation for unit tests
      });
    });

    it("should create stack with correct configuration", () => {
      expect(stack.environmentSuffix).toBe("test");
      expect(stack.regions).toEqual(["us-east-1"]);
      expect(stack.tags).toEqual(testTags);
    });

    it("should create identity infrastructure", () => {
      expect(stack.identity).toBeDefined();
      expect(stack.identity).toBeInstanceOf(IdentityInfrastructure);
    });

    it("should create regional networks for specified regions", () => {
      expect(stack.regionalNetworks["us-east-1"]).toBeDefined();
      expect(stack.regionalNetworks["us-east-1"]).toBeInstanceOf(NetworkingInfrastructure);
    });

    it("should create regional monitoring for specified regions", () => {
      expect(stack.regionalMonitoring["us-east-1"]).toBeDefined();
      expect(stack.regionalMonitoring["us-east-1"]).toBeInstanceOf(MonitoringInfrastructure);
    });

    it("should create regional Elastic Beanstalk for specified regions", () => {
      expect(stack.regionalElasticBeanstalk["us-east-1"]).toBeDefined();
      expect(stack.regionalElasticBeanstalk["us-east-1"]).toBeInstanceOf(ElasticBeanstalkInfrastructure);
    });

    it("should create AWS providers for specified regions", () => {
      expect(stack.providers["us-east-1"]).toBeDefined();
      expect(stack.providers["us-east-1"]).toHaveProperty('urn');
    });

    it("should handle default configuration", () => {
      const defaultStack = new TapStack("default-stack");

      expect(defaultStack.environmentSuffix).toBe("prod");
      expect(defaultStack.regions).toEqual(["us-east-1", "us-west-1"]);
      expect(defaultStack.tags).toHaveProperty("Project", "IaC-AWS-Nova-Model-Breaking");
      expect(defaultStack.tags).toHaveProperty("ManagedBy", "Pulumi");
    });

    it("should handle custom tags", () => {
      const customTags = {
        CustomTag: "CustomValue",
        Environment: "custom",
      };

      const customStack = new TapStack("custom-stack", {
        tags: customTags,
      });

      expect(customStack.tags).toEqual(customTags);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle missing optional parameters", () => {
      expect(() => {
        new IdentityInfrastructure("minimal-identity", {
          tags: {},
        });
      }).not.toThrow();
    });

    it("should handle different region configurations", () => {
      const govCloudNetworking = new NetworkingInfrastructure("govcloud-networking", {
        region: "us-gov-west-1",
        isPrimary: true,
        environment: "prod",
        tags: testTags,
      });

      expect(govCloudNetworking).toBeDefined();
    });

    it("should use fallback AZs for unknown regions", () => {
      // Use an unknown region that's not in the regionAzMap
      const unknownRegionNetworking = new NetworkingInfrastructure("unknown-region-networking", {
        region: "af-south-1",
        isPrimary: true,
        environment: "test",
        tags: testTags,
      });

      expect(unknownRegionNetworking).toBeDefined();
      expect(unknownRegionNetworking.publicSubnets.length).toBeGreaterThan(0);
      expect(unknownRegionNetworking.privateSubnets.length).toBeGreaterThan(0);
    });


    it("should validate VPC CIDR blocks", async () => {
      const primaryNetworking = new NetworkingInfrastructure("primary-net", {
        region: "us-east-1",
        isPrimary: true,
        environment: "test",
        tags: testTags,
      });

      const secondaryNetworking = new NetworkingInfrastructure("secondary-net", {
        region: "us-west-1",
        isPrimary: false,
        environment: "test",
        tags: testTags,
      });

      const primaryCidr = await resolveOutput(primaryNetworking.vpc.cidrBlock);
      const secondaryCidr = await resolveOutput(secondaryNetworking.vpc.cidrBlock);

      expect(primaryCidr).toBe("10.0.0.0/16");
      expect(secondaryCidr).toBe("10.1.0.0/16");
    });

    it("should validate IAM role ARN formats", async () => {
      const identity = new IdentityInfrastructure("arn-test-identity", {
        tags: testTags,
      });

      const serviceRoleArn = await resolveOutput(identity.ebServiceRoleArn);
      const instanceRoleArn = await resolveOutput(identity.ebInstanceRoleArn);
      const autoscalingRoleArn = await resolveOutput(identity.autoscalingRoleArn);

      expect(serviceRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+/);
      expect(instanceRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+/);
      expect(autoscalingRoleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.+/);
    });
  });
});