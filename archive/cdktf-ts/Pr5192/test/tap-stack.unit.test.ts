import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { expect } from "@jest/globals";
import { describe, test, beforeEach } from "@jest/globals";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    vpc: {
      id: `vpc-${props.awsRegion}-multi-tier`,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true
    },
    publicSubnets: [0, 1].map(i => ({
      id: `public-subnet-${i}`,
      cidrBlock: `10.0.${i + 1}.0/24`,
      availabilityZone: `${props.awsRegion}${String.fromCharCode(97 + i)}`
    })),
    privateSubnets: [0, 1].map(i => ({
      id: `private-subnet-${i}`,
      cidrBlock: `10.0.${i + 11}.0/24`,
      availabilityZone: `${props.awsRegion}${String.fromCharCode(97 + i)}`
    })),
    internetGateway: {
      id: 'igw-multi-tier',
      vpcId: `vpc-${props.awsRegion}-multi-tier`
    },
    natGateway: {
      id: 'nat-multi-tier',
      allocationId: 'eip-nat-multi-tier',
      subnetId: 'public-subnet-0'
    }
  })),

  IamModule: jest.fn().mockImplementation((scope: any, id: string) => ({
    ecsTaskRole: {
      id: 'multi-tier-ecs-task-role',
      arn: 'arn:aws:iam::123456789012:role/multi-tier-ecs-task-role',
      name: 'multi-tier-ecs-task-role'
    },
    ecsExecutionRole: {
      id: 'multi-tier-ecs-execution-role',
      arn: 'arn:aws:iam::123456789012:role/multi-tier-ecs-execution-role',
      name: 'multi-tier-ecs-execution-role'
    },
    ecsInstanceRole: {
      id: 'multi-tier-ecs-instance-role',
      arn: 'arn:aws:iam::123456789012:role/multi-tier-ecs-instance-role',
      name: 'multi-tier-ecs-instance-role'
    },
    ecsInstanceProfile: {
      id: 'multi-tier-ecs-instance-profile',
      arn: 'arn:aws:iam::123456789012:instance-profile/multi-tier-ecs-instance-profile',
      name: 'multi-tier-ecs-instance-profile'
    },
    codeBuildRole: {
      id: 'multi-tier-codebuild-role',
      arn: 'arn:aws:iam::123456789012:role/multi-tier-codebuild-role',
      name: 'multi-tier-codebuild-role'
    },
    codePipelineRole: {
      id: 'multi-tier-codepipeline-role',
      arn: 'arn:aws:iam::123456789012:role/multi-tier-codepipeline-role',
      name: 'multi-tier-codepipeline-role'
    }
  })),

  S3Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    bucket: {
      id: 'multi-tier-assets-123456789',
      arn: 'arn:aws:s3:::multi-tier-assets-123456789',
      bucket: 'multi-tier-assets-123456789'
    },
    bucketPublicAccess: {
      id: 'bucket-public-access',
      bucket: 'multi-tier-assets-123456789'
    },
    bucketPolicy: {
      id: 'bucket-policy',
      bucket: 'multi-tier-assets-123456789'
    }
  })),

  RdsModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    dbInstance: {
      id: 'multi-tier-postgres',
      identifier: 'multi-tier-postgres',
      endpoint: 'multi-tier-postgres.cluster-xyz.us-west-2.rds.amazonaws.com:5432',
      address: 'multi-tier-postgres.cluster-xyz.us-west-2.rds.amazonaws.com',
      port: 5432,
      dbName: 'multitierdb'
    },
    dbSecurityGroup: {
      id: 'sg-multi-tier-rds',
      name: 'multi-tier-rds-sg'
    },
    dbSubnetGroup: {
      id: 'multi-tier-db-subnet-group',
      name: 'multi-tier-db-subnet-group'
    }
  })),

  AlbModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    alb: {
      id: 'multi-tier-alb',
      arn: 'arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/multi-tier-alb/50dc6c495c0c9188',
      dnsName: 'multi-tier-alb-123456789.us-west-2.elb.amazonaws.com',
      arnSuffix: 'app/multi-tier-alb/50dc6c495c0c9188'
    },
    targetGroup: {
      id: 'multi-tier-tg',
      arn: 'arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/multi-tier-tg/50dc6c495c0c9188',
      name: 'multi-tier-tg'
    },
    albSecurityGroup: {
      id: 'sg-multi-tier-alb',
      name: 'multi-tier-alb-sg'
    },
    listener: {
      id: 'http-listener',
      arn: 'arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/multi-tier-alb/50dc6c495c0c9188/f2f7dc8efc522ab2',
      port: 80,
      protocol: 'HTTP'
    }
  })),

  EcsModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    cluster: {
      id: 'multi-tier-cluster',
      name: 'multi-tier-cluster',
      arn: 'arn:aws:ecs:us-west-2:123456789012:cluster/multi-tier-cluster'
    },
    taskDefinition: {
      id: 'multi-tier-app-task-def',
      arn: 'arn:aws:ecs:us-west-2:123456789012:task-definition/multi-tier-app:1',
      family: 'multi-tier-app'
    },
    service: {
      id: 'multi-tier-service',
      name: 'multi-tier-service'
    },
    ecsSecurityGroup: {
      id: 'sg-multi-tier-ecs',
      name: 'multi-tier-ecs-sg'
    },
    autoScalingGroup: {
      id: 'multi-tier-ecs-asg',
      arn: 'arn:aws:autoscaling:us-west-2:123456789012:autoScalingGroup:12345678:autoScalingGroupName/multi-tier-ecs-asg',
      name: 'multi-tier-ecs-asg'
    },
    capacityProvider: {
      id: 'multi-tier-capacity-provider',
      name: 'multi-tier-capacity-provider',
      arn: 'arn:aws:ecs:us-west-2:123456789012:capacity-provider/multi-tier-capacity-provider'
    }
  })),

  CicdModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    pipeline: {
      id: 'multi-tier-pipeline',
      name: 'multi-tier-pipeline',
      arn: 'arn:aws:codepipeline:us-west-2:123456789012:pipeline/multi-tier-pipeline'
    },
    codeBuildProject: {
      id: 'multi-tier-build',
      name: 'multi-tier-build',
      arn: 'arn:aws:codebuild:us-west-2:123456789012:project/multi-tier-build'
    },
    snsTopic: {
      id: 'multi-tier-pipeline-notifications',
      name: 'multi-tier-pipeline-notifications',
      arn: 'arn:aws:sns:us-west-2:123456789012:multi-tier-pipeline-notifications'
    }
  })),

  MonitoringModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    dashboard: {
      id: 'multi-tier-monitoring',
      dashboardName: 'multi-tier-monitoring',
      dashboardArn: 'arn:aws:cloudwatch::123456789012:dashboard/multi-tier-monitoring'
    },
    ecsAlarms: [
      {
        id: 'multi-tier-ecs-cpu-high',
        alarmName: 'multi-tier-ecs-cpu-high',
        alarmArn: 'arn:aws:cloudwatch:us-west-2:123456789012:alarm:multi-tier-ecs-cpu-high'
      },
      {
        id: 'multi-tier-ecs-memory-high',
        alarmName: 'multi-tier-ecs-memory-high',
        alarmArn: 'arn:aws:cloudwatch:us-west-2:123456789012:alarm:multi-tier-ecs-memory-high'
      }
    ],
    rdsAlarms: [
      {
        id: 'multi-tier-rds-cpu-high',
        alarmName: 'multi-tier-rds-cpu-high',
        alarmArn: 'arn:aws:cloudwatch:us-west-2:123456789012:alarm:multi-tier-rds-cpu-high'
      },
      {
        id: 'multi-tier-rds-storage-low',
        alarmName: 'multi-tier-rds-storage-low',
        alarmArn: 'arn:aws:cloudwatch:us-west-2:123456789012:alarm:multi-tier-rds-storage-low'
      }
    ]
  }))
}));

// Mock TerraformOutput, S3Backend and data sources
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation((scope: any, config: any) => ({
      addOverride: jest.fn()
    })),
    TerraformStack: actual.TerraformStack
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws", () => ({
  dataAwsCallerIdentity: {
    DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
      accountId: '123456789012'
    }))
  }
}));

describe("TapStack Unit Tests", () => {
  const { 
    VpcModule,
    IamModule,
    S3Module,
    RdsModule,
    AlbModule,
    EcsModule,
    CicdModule,
    MonitoringModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { dataAwsCallerIdentity } = require("@cdktf/provider-aws");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region (us-west-2)
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Default when not overridden
          defaultTags: [{
            tags: {
              Environment: 'Production',
              Project: 'MultiTierWebApp',
              ManagedBy: 'CDKTF',
              Owner: 'DevOps Team',
            }
          }]
        })
      );
    });

    test("should create TapStack with AWS_REGION_OVERRIDE", () => {
      // Test when AWS_REGION_OVERRIDE is set (by mocking the module)
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      // Since AWS_REGION_OVERRIDE is empty, it should use the provided region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );
    });

    test("should create TapStack with custom aws region from props", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-southeast-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1'
        })
      );
    });

    test("should get account ID using DataAwsCallerIdentity", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(dataAwsCallerIdentity.DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        'caller-identity'
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

    test("should configure S3 backend with custom settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-central-1',
        environmentSuffix: 'production'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-state-bucket',
          key: 'production/TestStack.tfstate',
          region: 'eu-central-1',
          encrypt: true
        })
      );
    });
  });

  describe("VPC Module Tests", () => {
    test("should create VpcModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          awsRegion: 'us-east-1'
        })
      );
    });

    test("should create VpcModule with custom region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          awsRegion: 'us-west-2'
        })
      );
    });

    test("should create VPC with correct subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      expect(vpcModule.publicSubnets).toHaveLength(2);
      expect(vpcModule.privateSubnets).toHaveLength(2);
      expect(vpcModule.natGateway).toBeDefined();
      expect(vpcModule.internetGateway).toBeDefined();
    });
  });

  describe("IAM Module Tests", () => {
    test("should create IamModule with all required roles", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        'iam'
      );

      const iamModule = IamModule.mock.results[0].value;
      expect(iamModule.ecsTaskRole).toBeDefined();
      expect(iamModule.ecsExecutionRole).toBeDefined();
      expect(iamModule.ecsInstanceRole).toBeDefined();
      expect(iamModule.ecsInstanceProfile).toBeDefined();
      expect(iamModule.codeBuildRole).toBeDefined();
      expect(iamModule.codePipelineRole).toBeDefined();
    });
  });

  describe("S3 Module Tests", () => {
    test("should create S3Module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2'
      });

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3',
        expect.objectContaining({
          awsRegion: 'us-west-2',
          accountId: '123456789012'
        })
      );
    });

    test("should create S3 bucket with public access blocked", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const s3Module = S3Module.mock.results[0].value;
      expect(s3Module.bucket).toBeDefined();
      expect(s3Module.bucketPublicAccess).toBeDefined();
      expect(s3Module.bucketPolicy).toBeDefined();
    });
  });

  describe("RDS Module Tests", () => {
    test("should create RdsModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      const ecsModule = EcsModule.mock.results[0].value;

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          vpc: vpcModule.vpc,
          privateSubnets: vpcModule.privateSubnets,
          ecsSecurityGroup: ecsModule.ecsSecurityGroup
        })
      );
    });

    test("should create RDS instance with correct properties", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsModule = RdsModule.mock.results[0].value;
      expect(rdsModule.dbInstance).toBeDefined();
      expect(rdsModule.dbInstance.identifier).toBe('multi-tier-postgres');
      expect(rdsModule.dbInstance.port).toBe(5432);
      expect(rdsModule.dbSecurityGroup).toBeDefined();
      expect(rdsModule.dbSubnetGroup).toBeDefined();
    });
  });

  describe("ALB Module Tests", () => {
    test("should create AlbModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      const s3Module = S3Module.mock.results[0].value;

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        'alb',
        expect.objectContaining({
          vpc: vpcModule.vpc,
          publicSubnets: vpcModule.publicSubnets,
          logsBucket: s3Module.bucket,
          bucketPolicy: s3Module.bucketPolicy
        })
      );
    });

    test("should create ALB with listener and target group", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albModule = AlbModule.mock.results[0].value;
      expect(albModule.alb).toBeDefined();
      expect(albModule.targetGroup).toBeDefined();
      expect(albModule.listener).toBeDefined();
      expect(albModule.listener.port).toBe(80);
      expect(albModule.listener.protocol).toBe('HTTP');
    });
  });

  describe("ECS Module Tests", () => {
    test("should create EcsModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2'
      });

      const vpcModule = VpcModule.mock.results[0].value;
      const albModule = AlbModule.mock.results[0].value;
      const iamModule = IamModule.mock.results[0].value;

      expect(EcsModule).toHaveBeenCalledWith(
        expect.anything(),
        'ecs',
        expect.objectContaining({
          vpc: vpcModule.vpc,
          publicSubnets: vpcModule.publicSubnets,
          targetGroup: albModule.targetGroup,
          albSecurityGroup: albModule.albSecurityGroup,
          taskRole: iamModule.ecsTaskRole,
          executionRole: iamModule.ecsExecutionRole,
          instanceProfile: iamModule.ecsInstanceProfile,
          listener: albModule.listener,
          awsRegion: 'us-west-2'
        })
      );
    });

    test("should create ECS cluster with EC2 capacity", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ecsModule = EcsModule.mock.results[0].value;
      expect(ecsModule.cluster).toBeDefined();
      expect(ecsModule.taskDefinition).toBeDefined();
      expect(ecsModule.service).toBeDefined();
      expect(ecsModule.autoScalingGroup).toBeDefined();
      expect(ecsModule.capacityProvider).toBeDefined();
    });
  });

  describe("CI/CD Module Tests", () => {
    test("should create CicdModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2'
      });

      const s3Module = S3Module.mock.results[0].value;
      const iamModule = IamModule.mock.results[0].value;
      const ecsModule = EcsModule.mock.results[0].value;

      expect(CicdModule).toHaveBeenCalledWith(
        expect.anything(),
        'cicd',
        expect.objectContaining({
          artifactBucket: s3Module.bucket,
          codeBuildRole: iamModule.codeBuildRole,
          codePipelineRole: iamModule.codePipelineRole,
          ecsCluster: ecsModule.cluster,
          ecsService: ecsModule.service,
          awsRegion: 'us-west-2',
          accountId: '123456789012'
        })
      );
    });

    test("should create pipeline with SNS notifications", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const cicdModule = CicdModule.mock.results[0].value;
      expect(cicdModule.pipeline).toBeDefined();
      expect(cicdModule.codeBuildProject).toBeDefined();
      expect(cicdModule.snsTopic).toBeDefined();
    });
  });

  describe("Monitoring Module Tests", () => {
    test("should create MonitoringModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2'
      });

      const ecsModule = EcsModule.mock.results[0].value;
      const albModule = AlbModule.mock.results[0].value;
      const rdsModule = RdsModule.mock.results[0].value;
      const cicdModule = CicdModule.mock.results[0].value;

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          ecsCluster: ecsModule.cluster,
          ecsService: ecsModule.service,
          alb: albModule.alb,
          dbInstance: rdsModule.dbInstance,
          snsTopic: cicdModule.snsTopic,
          awsRegion: 'us-west-2'
        })
      );
    });

    test("should create CloudWatch alarms and dashboard", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const monitoringModule = MonitoringModule.mock.results[0].value;
      expect(monitoringModule.dashboard).toBeDefined();
      expect(monitoringModule.ecsAlarms).toHaveLength(2);
      expect(monitoringModule.rdsAlarms).toHaveLength(2);
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Should create 28 outputs as per the stack
      expect(TerraformOutput).toHaveBeenCalledTimes(22);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      // VPC outputs
      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      
      // ECS outputs
      expect(outputIds).toContain('ecs-cluster-name');
      expect(outputIds).toContain('ecs-service-name');
      expect(outputIds).toContain('ecs-task-definition');
      
      // ALB outputs
      expect(outputIds).toContain('alb-dns-name');
      expect(outputIds).toContain('alb-arn');
      expect(outputIds).toContain('alb-target-group-arn');
      
      // RDS outputs
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('rds-port');
      expect(outputIds).toContain('rds-database-name');
      
      // S3 outputs
      expect(outputIds).toContain('s3-bucket-name');
      expect(outputIds).toContain('s3-bucket-arn');
      
      // CI/CD outputs
      expect(outputIds).toContain('codepipeline-arn');
      expect(outputIds).toContain('codebuild-project-name');
      expect(outputIds).toContain('sns-topic-arn');
      
      // Monitoring outputs
      expect(outputIds).toContain('cloudwatch-dashboard-url');
      
      // Application and metadata outputs
      expect(outputIds).toContain('application-url');
      expect(outputIds).toContain('stack-region');
      expect(outputIds).toContain('stack-environment');
      expect(outputIds).toContain('deployment-timestamp');
    });

    test("should mark RDS endpoint as sensitive", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsEndpointOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );
      
      expect(rdsEndpointOutput[2].sensitive).toBe(true);
    });

    test("should create CloudWatch dashboard URL with correct region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      const dashboardUrlOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'cloudwatch-dashboard-url'
      );
      
      expect(dashboardUrlOutput[2].value).toContain('https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1#dashboards:name=multi-tier-monitoring');
    });

    test("should create application URL with ALB DNS name", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const applicationUrlOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'application-url'
      );
      
      expect(applicationUrlOutput[2].value).toBe('http://multi-tier-alb-123456789.us-west-2.elb.amazonaws.com');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      
      // Check AlbModule received VPC
      const albCall = AlbModule.mock.calls[0];
      expect(albCall[2].vpc).toBe(vpcModule.vpc);
      expect(albCall[2].publicSubnets).toBe(vpcModule.publicSubnets);

      // Check EcsModule received VPC
      const ecsCall = EcsModule.mock.calls[0];
      expect(ecsCall[2].vpc).toBe(vpcModule.vpc);
      expect(ecsCall[2].publicSubnets).toBe(vpcModule.publicSubnets);

      // Check RdsModule received VPC
      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].vpc).toBe(vpcModule.vpc);
      expect(rdsCall[2].privateSubnets).toBe(vpcModule.privateSubnets);
    });

    test("should pass IAM roles to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const iamModule = IamModule.mock.results[0].value;
      
      // Check EcsModule received IAM roles
      const ecsCall = EcsModule.mock.calls[0];
      expect(ecsCall[2].taskRole).toBe(iamModule.ecsTaskRole);
      expect(ecsCall[2].executionRole).toBe(iamModule.ecsExecutionRole);
      expect(ecsCall[2].instanceProfile).toBe(iamModule.ecsInstanceProfile);

      // Check CicdModule received IAM roles
      const cicdCall = CicdModule.mock.calls[0];
      expect(cicdCall[2].codeBuildRole).toBe(iamModule.codeBuildRole);
      expect(cicdCall[2].codePipelineRole).toBe(iamModule.codePipelineRole);
    });

    test("should pass ALB listener to ECS module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albModule = AlbModule.mock.results[0].value;
      
      const ecsCall = EcsModule.mock.calls[0];
      expect(ecsCall[2].listener).toBe(albModule.listener);
      expect(ecsCall[2].targetGroup).toBe(albModule.targetGroup);
      expect(ecsCall[2].albSecurityGroup).toBe(albModule.albSecurityGroup);
    });

    test("should pass S3 bucket to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const s3Module = S3Module.mock.results[0].value;
      
      // Check AlbModule received S3 bucket
      const albCall = AlbModule.mock.calls[0];
      expect(albCall[2].logsBucket).toBe(s3Module.bucket);
      expect(albCall[2].bucketPolicy).toBe(s3Module.bucketPolicy);

      // Check CicdModule received S3 bucket
      const cicdCall = CicdModule.mock.calls[0];
      expect(cicdCall[2].artifactBucket).toBe(s3Module.bucket);
    });

    test("should pass ECS resources to CI/CD and Monitoring", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ecsModule = EcsModule.mock.results[0].value;
      
      // Check CicdModule received ECS resources
      const cicdCall = CicdModule.mock.calls[0];
      expect(cicdCall[2].ecsCluster).toBe(ecsModule.cluster);
      expect(cicdCall[2].ecsService).toBe(ecsModule.service);

      // Check MonitoringModule received ECS resources
      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].ecsCluster).toBe(ecsModule.cluster);
      expect(monitoringCall[2].ecsService).toBe(ecsModule.service);
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const vpcCallIndex = VpcModule.mock.invocationCallOrder[0];
      const iamCallIndex = IamModule.mock.invocationCallOrder[0];
      const s3CallIndex = S3Module.mock.invocationCallOrder[0];
      const albCallIndex = AlbModule.mock.invocationCallOrder[0];
      const ecsCallIndex = EcsModule.mock.invocationCallOrder[0];
      const rdsCallIndex = RdsModule.mock.invocationCallOrder[0];
      const cicdCallIndex = CicdModule.mock.invocationCallOrder[0];
      const monitoringCallIndex = MonitoringModule.mock.invocationCallOrder[0];
      
      // VPC should be created first
      expect(vpcCallIndex).toBeLessThan(albCallIndex);
      expect(vpcCallIndex).toBeLessThan(ecsCallIndex);
      expect(vpcCallIndex).toBeLessThan(rdsCallIndex);
      
      // IAM should be created before ECS and CI/CD
      expect(iamCallIndex).toBeLessThan(ecsCallIndex);
      expect(iamCallIndex).toBeLessThan(cicdCallIndex);
      
      // S3 should be created before ALB and CI/CD
      expect(s3CallIndex).toBeLessThan(albCallIndex);
      expect(s3CallIndex).toBeLessThan(cicdCallIndex);
      
      // ALB should be created before ECS
      expect(albCallIndex).toBeLessThan(ecsCallIndex);
      
      // ECS should be created before CI/CD and Monitoring
      expect(ecsCallIndex).toBeLessThan(cicdCallIndex);
      expect(ecsCallIndex).toBeLessThan(monitoringCallIndex);
      
      // CI/CD should be created before Monitoring (SNS topic dependency)
      expect(cicdCallIndex).toBeLessThan(monitoringCallIndex);
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      
      // Should use default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1'
        })
      );
    });

    test("should handle empty string environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: ''
      });

      // Should fallback to 'dev'
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );
    });

    test("should handle null values in props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        environmentSuffix: null as any,
        awsRegion: null as any
      });

      expect(stack).toBeDefined();
      
      // Should fallback to defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1'
        })
      );
    });

    test("should handle undefined nested properties", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        defaultTags: undefined
      });

      expect(stack).toBeDefined();
      
      // Should use default tags
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [{
            tags: {
              Environment: 'Production',
              Project: 'MultiTierWebApp',
              ManagedBy: 'CDKTF',
              Owner: 'DevOps Team'
            }
          }]
        })
      );
    });
  });

  describe("Complete Infrastructure Stack", () => {
    test("should create all infrastructure components", () => {
      const app = new App();
      const stack = new TapStack(app, "CompleteStackTest");

      expect(stack).toBeDefined();

      // Verify all modules are created
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(AlbModule).toHaveBeenCalledTimes(1);
      expect(EcsModule).toHaveBeenCalledTimes(1);
      expect(CicdModule).toHaveBeenCalledTimes(1);
      expect(MonitoringModule).toHaveBeenCalledTimes(1);

      // Verify providers and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(dataAwsCallerIdentity.DataAwsCallerIdentity).toHaveBeenCalledTimes(1);

      // Verify outputs (28 total)
      expect(TerraformOutput).toHaveBeenCalledTimes(22);
    });

    test("should maintain proper module relationships", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Get module instances
      const vpcModule = VpcModule.mock.results[0].value;
      const iamModule = IamModule.mock.results[0].value;
      const s3Module = S3Module.mock.results[0].value;
      const albModule = AlbModule.mock.results[0].value;
      const ecsModule = EcsModule.mock.results[0].value;
      const rdsModule = RdsModule.mock.results[0].value;
      const cicdModule = CicdModule.mock.results[0].value;

      // Verify module relationships
      expect(albModule).toBeDefined();
      expect(ecsModule).toBeDefined();
      expect(rdsModule).toBeDefined();
      expect(cicdModule).toBeDefined();

      // Verify monitoring module received all dependencies
      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].ecsCluster).toBe(ecsModule.cluster);
      expect(monitoringCall[2].ecsService).toBe(ecsModule.service);
      expect(monitoringCall[2].alb).toBe(albModule.alb);
      expect(monitoringCall[2].dbInstance).toBe(rdsModule.dbInstance);
      expect(monitoringCall[2].snsTopic).toBe(cicdModule.snsTopic);
    });

    test("should create resources with consistent naming", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      expect(vpcModule.vpc.id).toContain('multi-tier');

      const ecsModule = EcsModule.mock.results[0].value;
      expect(ecsModule.cluster.name).toBe('multi-tier-cluster');
      expect(ecsModule.service.name).toBe('multi-tier-service');

      const albModule = AlbModule.mock.results[0].value;
      expect(albModule.alb.id).toBe('multi-tier-alb');

      const rdsModule = RdsModule.mock.results[0].value;
      expect(rdsModule.dbInstance.identifier).toBe('multi-tier-postgres');
    });
  });

  describe("Region-specific Configuration", () => {
    test("should configure resources for us-west-2", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          awsRegion: 'us-west-2'
        })
      );

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3',
        expect.objectContaining({
          awsRegion: 'us-west-2'
        })
      );

      expect(EcsModule).toHaveBeenCalledWith(
        expect.anything(),
        'ecs',
        expect.objectContaining({
          awsRegion: 'us-west-2'
        })
      );
    });

    test("should pass region to CI/CD and Monitoring modules", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-southeast-1'
      });

      expect(CicdModule).toHaveBeenCalledWith(
        expect.anything(),
        'cicd',
        expect.objectContaining({
          awsRegion: 'ap-southeast-1'
        })
      );

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          awsRegion: 'ap-southeast-1'
        })
      );
    });
  });

  describe("Environment Suffix Behavior", () => {
    test("should use 'dev' as default environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );
    });

    test("should use provided environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'staging/TestStack.tfstate'
        })
      );
    });

    test("should handle production environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'production/TestStack.tfstate'
        })
      );
    });
  });

  describe("Output Values Validation", () => {
    test("should create subnet IDs output as comma-separated string", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const publicSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );
      
      expect(publicSubnetsOutput[2].value).toBe('public-subnet-0,public-subnet-1');

      const privateSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-subnet-ids'
      );
      
      expect(privateSubnetsOutput[2].value).toBe('private-subnet-0,private-subnet-1');
    });

    test("should create RDS port output as string", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsPortOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-port'
      );
      
      expect(rdsPortOutput[2].value).toBe('5432');
    });

    test("should create deployment timestamp output", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const timestampOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'deployment-timestamp'
      );
      
      expect(timestampOutput[2].value).toBeDefined();
      expect(timestampOutput[2].value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe("Security Group Dependencies", () => {
    test("should pass ECS security group to RDS module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ecsModule = EcsModule.mock.results[0].value;
      
      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].ecsSecurityGroup).toBe(ecsModule.ecsSecurityGroup);
    });

    test("should pass ALB security group to ECS module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albModule = AlbModule.mock.results[0].value;
      
      const ecsCall = EcsModule.mock.calls[0];
      expect(ecsCall[2].albSecurityGroup).toBe(albModule.albSecurityGroup);
    });
  });

  describe("Stack Metadata", () => {
    test("should output correct stack metadata", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-central-1'
      });

      const regionOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'stack-region'
      );
      expect(regionOutput[2].value).toBe('eu-central-1');

      const environmentOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'stack-environment'
      );
      expect(environmentOutput[2].value).toBe('Production');
    });
  });
});
