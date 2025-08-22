import * as pulumi from "@pulumi/pulumi";
import "@pulumi/pulumi/runtime";
import { jest } from '@jest/globals';

// Track created resources
let createdResources = [];

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function(args) {
    // Add resource to tracking array
    createdResources.push({
      type: args.type,
      name: args.name,
      inputs: args.inputs,
      parent: args.parent
    });
    
    // Return appropriate mock based on resource type
    const mockId = `${args.type.split('/').pop()}-${args.name}`;
    
    switch (args.type) {
      case "aws:ec2/vpc:Vpc":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            arn: `arn:aws:ec2:us-west-2:123456789012:vpc/${mockId}`
          }
        };
      
      case "aws:ec2/subnet:Subnet":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            arn: `arn:aws:ec2:us-west-2:123456789012:subnet/${mockId}`
          }
        };
      
      case "aws:ec2/internetGateway:InternetGateway":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId
          }
        };
      
      case "aws:ec2/natGateway:NatGateway":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId
          }
        };
      
      case "aws:ec2/eip:Eip":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            publicIp: `54.123.45.${Math.floor(Math.random() * 255)}`
          }
        };
      
      case "aws:ec2/securityGroup:SecurityGroup":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            arn: `arn:aws:ec2:us-west-2:123456789012:security-group/${mockId}`
          }
        };
      
      case "aws:iam/role:Role":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            name: mockId,
            arn: `arn:aws:iam::123456789012:role/${mockId}`
          }
        };
      
      case "aws:iam/instanceProfile:InstanceProfile":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            name: mockId
          }
        };
      
      case "aws:s3/bucket:Bucket":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            bucket: args.inputs.bucket || mockId,
            websiteEndpoint: `${mockId}.s3-website-us-west-2.amazonaws.com`
          }
        };
      
      case "aws:lb/loadBalancer:LoadBalancer":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            arn: `arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/${mockId}`,
            dnsName: `${mockId}.us-west-2.elb.amazonaws.com`,
            zoneId: "Z1H1FL5HABSF5"
          }
        };
      
      case "aws:lb/targetGroup:TargetGroup":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            arn: `arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/${mockId}`
          }
        };
      
      case "aws:ec2/launchTemplate:LaunchTemplate":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId
          }
        };
      
      case "aws:autoscaling/group:Group":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            name: mockId
          }
        };
      
      case "aws:cloudwatch/metricAlarm:MetricAlarm":
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId,
            arn: `arn:aws:cloudwatch:us-west-2:123456789012:alarm:${mockId}`
          }
        };
      
      default:
        return {
          id: mockId,
          state: {
            ...args.inputs,
            id: mockId
          }
        };
    }
  },
  
  call: function(args) {
    switch (args.token) {
      case "aws:index/getAvailabilityZones:getAvailabilityZones":
        return {
          names: ["us-west-2a", "us-west-2b", "us-west-2c"],
          zoneIds: ["usw2-az1", "usw2-az2", "usw2-az3"],
          state: "available"
        };
      
      case "aws:ec2/getAmi:getAmi":
        return {
          id: "ami-0123456789abcdef0",
          architecture: "x86_64",
          name: "amzn2-ami-hvm-2.0.20231116.0-x86_64-gp2",
          description: "Amazon Linux 2 AMI"
        };
      
      default:
        return {};
    }
  }
});

// Import the component after setting up mocks
import { TapStack } from "../lib/tap-stack.mjs";

describe("TapStack Unit Tests", () => {
  beforeEach(() => {
    // Clear resource tracking before each test
    createdResources = [];
  });

  describe("Stack Initialization", () => {
    it("should create stack with default configuration", () => {
      const stack = new TapStack("test-stack", {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it("should create stack with custom environment suffix", () => {
      const stack = new TapStack("test-stack", { 
        environmentSuffix: "prod" 
      });
      expect(stack).toBeDefined();
      
      // Check that resources use the custom suffix
      const vpc = createdResources.find(r => r.type === "aws:ec2/vpc:Vpc");
      expect(vpc).toBeDefined();
      expect(vpc.name).toContain("prod");
    });

    it("should apply custom tags to resources", () => {
      const customTags = {
        Environment: "test",
        Owner: "qa-team",
        Project: "tap-test"
      };
      
      new TapStack("test-stack", { 
        environmentSuffix: "test",
        tags: customTags 
      });
      
      const vpc = createdResources.find(r => r.type === "aws:ec2/vpc:Vpc");
      expect(vpc).toBeDefined();
      expect(vpc.inputs.tags).toMatchObject(customTags);
    });
  });

  describe("Network Infrastructure", () => {
    let stack;
    
    beforeEach(() => {
      stack = new TapStack("test-stack", { environmentSuffix: "test" });
    });

    it("should create VPC with correct settings", () => {
      const vpc = createdResources.find(r => r.type === "aws:ec2/vpc:Vpc");
      expect(vpc).toBeDefined();
      expect(vpc.inputs.cidrBlock).toBe("10.0.0.0/16");
      expect(vpc.inputs.enableDnsHostnames).toBe(true);
      expect(vpc.inputs.enableDnsSupport).toBe(true);
    });

    it("should create Internet Gateway", () => {
      const igw = createdResources.find(r => 
        r.type === "aws:ec2/internetGateway:InternetGateway"
      );
      expect(igw).toBeDefined();
      expect(igw.name).toContain("tap-igw");
    });

    it("should create public and private subnets", () => {
      const subnets = createdResources.filter(r => r.type === "aws:ec2/subnet:Subnet");
      const publicSubnets = subnets.filter(s => s.name.includes("public"));
      const privateSubnets = subnets.filter(s => s.name.includes("private"));
      
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
      
      // Verify public subnets have public IP mapping enabled
      publicSubnets.forEach(subnet => {
        expect(subnet.inputs.mapPublicIpOnLaunch).toBe(true);
      });
    });

    it("should create NAT Gateways for high availability", () => {
      const natGateways = createdResources.filter(r => 
        r.type === "aws:ec2/natGateway:NatGateway"
      );
      expect(natGateways).toHaveLength(2);
    });

    it("should create Elastic IPs for NAT Gateways", () => {
      const eips = createdResources.filter(r => r.type === "aws:ec2/eip:Eip");
      expect(eips).toHaveLength(2);
      eips.forEach(eip => {
        expect(eip.inputs.tags).toBeDefined();
      });
    });

    it("should create route tables", () => {
      const routeTables = createdResources.filter(r => 
        r.type === "aws:ec2/routeTable:RouteTable"
      );
      // 1 public + 2 private route tables
      expect(routeTables.length).toBe(3);
    });

    it("should create routes for internet and NAT access", () => {
      const routes = createdResources.filter(r => r.type === "aws:ec2/route:Route");
      expect(routes.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Security Configuration", () => {
    beforeEach(() => {
      new TapStack("test-stack", { environmentSuffix: "test" });
    });

    it("should create ALB security group with HTTP/HTTPS ingress", () => {
      const albSg = createdResources.find(r => 
        r.type === "aws:ec2/securityGroup:SecurityGroup" && 
        r.name.includes("alb-sg")
      );
      expect(albSg).toBeDefined();
      // Check that ingress rules are defined
      expect(albSg.inputs.ingress).toBeDefined();
      expect(albSg.inputs.ingress.length).toBe(2);
    });

    it("should create web server security group", () => {
      const webSg = createdResources.find(r => 
        r.type === "aws:ec2/securityGroup:SecurityGroup" && 
        r.name.includes("web-sg")
      );
      expect(webSg).toBeDefined();
      expect(webSg.inputs.description).toBeDefined();
    });

    it("should create IAM role for EC2 instances", () => {
      const role = createdResources.find(r => 
        r.type === "aws:iam/role:Role" && 
        r.name.includes("ec2-role")
      );
      expect(role).toBeDefined();
      // Check assume role policy is a string (JSON)
      expect(typeof role.inputs.assumeRolePolicy).toBe('string');
    });

    it("should create instance profile", () => {
      const profile = createdResources.find(r => 
        r.type === "aws:iam/instanceProfile:InstanceProfile"
      );
      expect(profile).toBeDefined();
      expect(profile.name).toContain("instance-profile");
    });

    it("should attach necessary IAM policies", () => {
      // Check for role policy attachments
      const policyAttachments = createdResources.filter(r => 
        r.type === "aws:iam/rolePolicyAttachment:RolePolicyAttachment"
      );
      expect(policyAttachments).toHaveLength(2);
      
      // Check for S3 inline policy
      const s3Policy = createdResources.find(r => 
        r.type === "aws:iam/rolePolicy:RolePolicy" &&
        r.name.includes("s3-policy")
      );
      expect(s3Policy).toBeDefined();
    });
  });

  describe("Static Asset Storage", () => {
    beforeEach(() => {
      new TapStack("test-stack", { environmentSuffix: "test" });
    });

    it("should create S3 bucket for static assets", () => {
      const bucket = createdResources.find(r => 
        r.type === "aws:s3/bucket:Bucket" && 
        r.name.includes("static-assets")
      );
      expect(bucket).toBeDefined();
    });

    it("should configure bucket for website hosting", () => {
      const websiteConfig = createdResources.find(r => 
        r.type === "aws:s3/bucketWebsiteConfiguration:BucketWebsiteConfiguration"
      );
      expect(websiteConfig).toBeDefined();
      expect(websiteConfig.inputs.indexDocument).toEqual({ suffix: "index.html" });
      expect(websiteConfig.inputs.errorDocument).toEqual({ key: "error.html" });
    });

    it("should configure public access settings", () => {
      const publicAccessBlock = createdResources.find(r => 
        r.type === "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock"
      );
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.inputs.blockPublicAcls).toBe(false);
      expect(publicAccessBlock.inputs.blockPublicPolicy).toBe(false);
    });

    it("should create bucket policy for public read", () => {
      const bucketPolicy = createdResources.find(r => 
        r.type === "aws:s3/bucketPolicy:BucketPolicy"
      );
      expect(bucketPolicy).toBeDefined();
    });
  });

  describe("Load Balancing", () => {
    beforeEach(() => {
      new TapStack("test-stack", { environmentSuffix: "test" });
    });

    it("should create Application Load Balancer", () => {
      const alb = createdResources.find(r => 
        r.type === "aws:lb/loadBalancer:LoadBalancer"
      );
      expect(alb).toBeDefined();
      expect(alb.inputs.loadBalancerType).toBe("application");
    });

    it("should create target group with health checks", () => {
      const targetGroup = createdResources.find(r => 
        r.type === "aws:lb/targetGroup:TargetGroup"
      );
      expect(targetGroup).toBeDefined();
      expect(targetGroup.inputs.port).toBe(80);
      expect(targetGroup.inputs.protocol).toBe("HTTP");
      expect(targetGroup.inputs.healthCheck).toMatchObject({
        enabled: true,
        path: "/",
        interval: 30,
        timeout: 5
      });
    });

    it("should create ALB listener", () => {
      const listener = createdResources.find(r => 
        r.type === "aws:lb/listener:Listener"
      );
      expect(listener).toBeDefined();
      expect(listener.inputs.port).toBe("80");
      expect(listener.inputs.protocol).toBe("HTTP");
    });
  });

  describe("Auto Scaling", () => {
    beforeEach(() => {
      new TapStack("test-stack", { environmentSuffix: "test" });
    });

    it("should create launch template", () => {
      const launchTemplate = createdResources.find(r => 
        r.type === "aws:ec2/launchTemplate:LaunchTemplate"
      );
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.inputs.instanceType).toBe("t3.micro");
    });

    it("should create auto scaling group", () => {
      const asg = createdResources.find(r => 
        r.type === "aws:autoscaling/group:Group"
      );
      expect(asg).toBeDefined();
      expect(asg.inputs.minSize).toBe(2);
      expect(asg.inputs.maxSize).toBe(10);
      expect(asg.inputs.desiredCapacity).toBe(2);
      expect(asg.inputs.healthCheckType).toBe("ELB");
    });

    it("should create scaling policies", () => {
      const policies = createdResources.filter(r => 
        r.type === "aws:autoscaling/policy:Policy"
      );
      expect(policies).toHaveLength(2);
      
      const scaleUp = policies.find(p => p.name.includes("scale-up"));
      const scaleDown = policies.find(p => p.name.includes("scale-down"));
      
      expect(scaleUp).toBeDefined();
      expect(scaleUp.inputs.scalingAdjustment).toBe(2);
      
      expect(scaleDown).toBeDefined();
      expect(scaleDown.inputs.scalingAdjustment).toBe(-1);
    });

    it("should create CloudWatch alarms", () => {
      const alarms = createdResources.filter(r => 
        r.type === "aws:cloudwatch/metricAlarm:MetricAlarm"
      );
      expect(alarms).toHaveLength(2);
      
      const highCpu = alarms.find(a => a.name.includes("high-cpu"));
      const lowCpu = alarms.find(a => a.name.includes("low-cpu"));
      
      expect(highCpu).toBeDefined();
      expect(highCpu.inputs.threshold).toBe(80);
      
      expect(lowCpu).toBeDefined();
      expect(lowCpu.inputs.threshold).toBe(30);
    });
  });

  describe("Stack Outputs", () => {
    it("should export required outputs", () => {
      const stack = new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.staticBucketName).toBeDefined();
      expect(stack.staticBucketWebsiteEndpoint).toBeDefined();
    });
  });

  describe("Resource Naming", () => {
    beforeEach(() => {
      // Clear resource tracking before each test
      createdResources = [];
    });

    it("should use consistent naming with environment suffix", () => {
      const suffix = "staging";
      new TapStack("test-stack", { environmentSuffix: suffix });
      
      const resourceChecks = [
        { type: "aws:ec2/vpc:Vpc", namePattern: `tap-vpc-${suffix}` },
        { type: "aws:ec2/internetGateway:InternetGateway", namePattern: `tap-igw-${suffix}` },
        { type: "aws:lb/loadBalancer:LoadBalancer", namePattern: `tap-alb-${suffix}` },
        { type: "aws:autoscaling/group:Group", namePattern: `tap-asg-${suffix}` }
      ];
      
      resourceChecks.forEach(({ type, namePattern }) => {
        const resource = createdResources.find(r => r.type === type);
        expect(resource).toBeDefined();
        expect(resource.name).toBe(namePattern);
      });
    });
  });

  describe("High Availability", () => {
    beforeEach(() => {
      new TapStack("test-stack", { environmentSuffix: "test" });
    });

    it("should deploy resources across multiple AZs", () => {
      const subnets = createdResources.filter(r => r.type === "aws:ec2/subnet:Subnet");
      
      const publicSubnets = subnets.filter(s => s.name.includes("public"));
      const privateSubnets = subnets.filter(s => s.name.includes("private"));
      
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
    });

    it("should create redundant NAT Gateways", () => {
      const natGateways = createdResources.filter(r => 
        r.type === "aws:ec2/natGateway:NatGateway"
      );
      expect(natGateways).toHaveLength(2);
    });
  });
});