// Mock Pulumi modules
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function() {
    this.registerOutputs = jest.fn();
  }),
  interpolate: jest.fn(strings => "interpolated-string")
}));

jest.mock("@pulumi/aws", () => ({
  ec2: {
    getAmi: jest.fn(() => Promise.resolve({ id: "ami-12345" })),
    LaunchTemplate: jest.fn().mockImplementation(() => ({ 
      id: "lt-test",
      name: "webapp-lt-test"
    }))
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({ 
      name: "webapp-role-test",
      arn: "arn:aws:iam::123456789012:role/webapp-role-test"
    })),
    RolePolicyAttachment: jest.fn().mockImplementation(() => ({ id: "attachment-test" })),
    InstanceProfile: jest.fn().mockImplementation(() => ({ 
      name: "webapp-profile-test",
      arn: "arn:aws:iam::123456789012:instance-profile/webapp-profile-test"
    }))
  },
  autoscaling: {
    Group: jest.fn().mockImplementation(() => ({ 
      name: "webapp-asg-test",
      id: "asg-test",
      arn: "arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:test"
    })),
    Policy: jest.fn().mockImplementation(() => ({ 
      id: "policy-test",
      arn: "arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:test"
    }))
  }
}));

import * as aws from "@pulumi/aws";
import { ComputeStack } from "../lib/compute-stack.mjs";

describe("ComputeStack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockArgs = {
    environmentSuffix: "test",
    tags: { Project: "TAP" },
    vpc: { id: "vpc-mock" },
    privateSubnets: [{ id: "subnet-private-1" }, { id: "subnet-private-2" }],
    publicSubnets: [{ id: "subnet-public-1" }, { id: "subnet-public-2" }],
    albSecurityGroup: { id: "sg-alb" },
    instanceSecurityGroup: { id: "sg-instance" },
    targetGroup: { 
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test",
      arnSuffix: "targetgroup/test"
    }
  };

  describe("IAM Configuration", () => {
    it("should create IAM role for EC2 instances", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        "webapp-instance-role-test",
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining("ec2.amazonaws.com"),
          tags: expect.objectContaining({
            Name: "webapp-instance-role-test",
            Component: "compute"
          })
        }),
        expect.any(Object)
      );
    });

    it("should attach CloudWatch agent policy to role", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        "webapp-cloudwatch-policy-test",
        expect.objectContaining({
          policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        }),
        expect.any(Object)
      );
    });

    it("should create instance profile", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith(
        "webapp-instance-profile-test",
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: "webapp-instance-profile-test"
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("Launch Template", () => {
    it("should create launch template with correct configuration", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
        "webapp-lt-test",
        expect.objectContaining({
          name: "webapp-lt-test",
          instanceType: "t3.micro",
          vpcSecurityGroupIds: ["sg-instance"],
          tagSpecifications: expect.arrayContaining([
            expect.objectContaining({
              resourceType: "instance",
              tags: expect.objectContaining({
                Name: "webapp-instance-test"
              })
            }),
            expect.objectContaining({
              resourceType: "volume",
              tags: expect.objectContaining({
                Name: "webapp-volume-test"
              })
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should configure EBS volumes with encryption", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          blockDeviceMappings: expect.arrayContaining([
            expect.objectContaining({
              deviceName: "/dev/xvda",
              ebs: expect.objectContaining({
                volumeSize: 8,
                volumeType: "gp3",
                deleteOnTermination: true,
                encrypted: true
              })
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should enable IMDSv2 for security", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          metadataOptions: expect.objectContaining({
            httpEndpoint: "enabled",
            httpTokens: "required",
            httpPutResponseHopLimit: 2
          })
        }),
        expect.any(Object)
      );
    });

    it("should include user data script", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userData: expect.any(String)
        }),
        expect.any(Object)
      );
    });
  });

  describe("Auto Scaling Group", () => {
    it("should create Auto Scaling Group with correct capacity", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(
        "webapp-asg-test",
        expect.objectContaining({
          name: "webapp-asg-test",
          minSize: 2,
          maxSize: 5,
          desiredCapacity: 2,
          healthCheckType: "ELB",
          healthCheckGracePeriod: 300
        }),
        expect.any(Object)
      );
    });

    it("should use private subnets for instances", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          vpcZoneIdentifiers: ["subnet-private-1", "subnet-private-2"]
        }),
        expect.any(Object)
      );
    });

    it("should attach to target group", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          targetGroupArns: [mockArgs.targetGroup.arn]
        }),
        expect.any(Object)
      );
    });

    it("should configure instance refresh with 2025 features", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          instanceRefresh: expect.objectContaining({
            strategy: "Rolling",
            preferences: expect.objectContaining({
              minHealthyPercentage: 50,
              instanceWarmup: 300,
              checkpointPercentages: [20, 50, 100],
              checkpointDelay: 600
            })
          })
        }),
        expect.any(Object)
      );
    });

    it("should use enhanced termination policies", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          terminationPolicies: ["OldestLaunchTemplate", "OldestInstance"]
        }),
        expect.any(Object)
      );
    });
  });

  describe("Auto Scaling Policies", () => {
    it("should create CPU target tracking scaling policy", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.autoscaling.Policy).toHaveBeenCalledWith(
        "webapp-cpu-scaling-policy-test",
        expect.objectContaining({
          name: "webapp-cpu-scaling-policy-test",
          policyType: "TargetTrackingScaling",
          targetTrackingConfiguration: expect.objectContaining({
            targetValue: 70.0,
            predefinedMetricSpecification: expect.objectContaining({
              predefinedMetricType: "ASGAverageCPUUtilization"
            }),
            disableScaleIn: false
          })
        }),
        expect.any(Object)
      );
    });

    it.skip("should create ALB request count target tracking policy", () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.autoscaling.Policy).toHaveBeenCalledWith(
        "webapp-alb-scaling-policy-test",
        expect.objectContaining({
          name: "webapp-alb-scaling-policy-test",
          policyType: "TargetTrackingScaling",
          targetTrackingConfiguration: expect.objectContaining({
            targetValue: 1000.0,
            predefinedMetricSpecification: expect.objectContaining({
              predefinedMetricType: "ALBRequestCountPerTarget"
            }),
            scaleOutCooldown: 300,
            scaleInCooldown: 300
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("AMI Selection", () => {
    it("should use latest Amazon Linux 2 AMI", async () => {
      new ComputeStack("test-compute", mockArgs);
      
      expect(aws.ec2.getAmi).toHaveBeenCalledWith(
        expect.objectContaining({
          mostRecent: true,
          owners: ["amazon"],
          filters: expect.arrayContaining([
            expect.objectContaining({
              name: "name",
              values: ["amzn2-ami-hvm-*-x86_64-gp2"]
            }),
            expect.objectContaining({
              name: "virtualization-type",
              values: ["hvm"]
            })
          ])
        })
      );
    });
  });

  describe("Stack Outputs", () => {
    it("should register required outputs", () => {
      const stack = new ComputeStack("test-compute", mockArgs);
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          autoScalingGroupName: stack.autoScalingGroup.name,
          launchTemplateId: stack.launchTemplate.id
        })
      );
    });

    it("should expose Auto Scaling Group and Launch Template", () => {
      const stack = new ComputeStack("test-compute", mockArgs);
      
      expect(stack.autoScalingGroup).toBeDefined();
      expect(stack.autoScalingGroup.name).toBe("webapp-asg-test");
      expect(stack.launchTemplate).toBeDefined();
      expect(stack.launchTemplate.id).toBe("lt-test");
    });
  });

  describe("Tags and Environment", () => {
    it("should propagate tags correctly", () => {
      new ComputeStack("test-compute", {
        ...mockArgs,
        tags: { Project: "TAP", Owner: "DevOps" }
      });
      
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.arrayContaining([
            expect.objectContaining({
              key: "Project",
              value: "TAP",
              propagateAtLaunch: true
            }),
            expect.objectContaining({
              key: "Owner",
              value: "DevOps",
              propagateAtLaunch: true
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should use environment suffix in resource names", () => {
      new ComputeStack("test-compute", {
        ...mockArgs,
        environmentSuffix: "prod"
      });
      
      expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
        "webapp-lt-prod",
        expect.any(Object),
        expect.any(Object)
      );
      
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(
        "webapp-asg-prod",
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});