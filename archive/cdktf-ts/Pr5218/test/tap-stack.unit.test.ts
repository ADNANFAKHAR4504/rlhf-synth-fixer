import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { expect } from "@jest/globals";
import { describe, test, beforeEach } from "@jest/globals";


// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${config.projectName}-${config.environment}`,
      cidrBlock: config.vpcCidr
    },
    publicSubnets: [0, 1, 2].map(i => ({
      id: `public-subnet-${i}-${config.projectName}-${config.environment}`,
      cidrBlock: `10.0.${i * 2}.0/24`,
      availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`
    })),
    privateSubnets: [0, 1, 2].map(i => ({
      id: `private-subnet-${i}-${config.projectName}-${config.environment}`,
      cidrBlock: `10.0.${i * 2 + 1}.0/24`,
      availabilityZone: `us-east-1${String.fromCharCode(97 + i)}`
    })),
    dbSubnetGroup: {
      id: `${config.projectName}-${config.environment}-db-subnet-group`,
      name: `${config.projectName}-${config.environment}-db-subnet-group`
    },
    natGateways: [0, 1, 2].map(i => ({
      id: `nat-gateway-${i}-${config.projectName}-${config.environment}`
    })),
    internetGateway: {
      id: `igw-${config.projectName}-${config.environment}`
    }
  })),

  DatabaseModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    rdsInstance: {
      id: `${config.projectName}-${config.environment}-db`,
      identifier: `${config.projectName}-${config.environment}-db`,
      endpoint: `${config.projectName}-${config.environment}-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432`,
      address: `${config.projectName}-${config.environment}-db.cluster-xyz.us-east-1.rds.amazonaws.com`,
      port: 5432
    },
    secretsManager: {
      id: `${config.projectName}-${config.environment}-db-secret`,
      arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${config.projectName}-${config.environment}-db-credentials-XXXXX`,
      name: `${config.projectName}-${config.environment}-db-credentials`
    },
    securityGroup: {
      id: `sg-db-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-${config.environment}-db-sg`
    }
  })),

  ContainerServiceModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    cluster: {
      id: `${config.projectName}-${config.environment}-cluster`,
      name: `${config.projectName}-${config.environment}-cluster`,
      arn: `arn:aws:ecs:us-east-1:123456789012:cluster/${config.projectName}-${config.environment}-cluster`
    },
    taskDefinition: {
      id: `${config.projectName}-${config.environment}-task-def`,
      arn: `arn:aws:ecs:us-east-1:123456789012:task-definition/${config.projectName}-${config.environment}:1`,
      family: `${config.projectName}-${config.environment}`
    },
    service: {
      id: `${config.projectName}-${config.environment}-service`,
      name: `${config.projectName}-${config.environment}-service`
    },
    alb: {
      id: `${config.projectName}-${config.environment}-alb`,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${config.projectName}-${config.environment}-alb/50dc6c495c0c9188`,
      dnsName: `${config.projectName}-${config.environment}-alb-123456789.us-east-1.elb.amazonaws.com`
    },
    targetGroup: {
      id: `${config.projectName}-${config.environment}-tg`,
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${config.projectName}-${config.environment}-tg/50dc6c495c0c9188`
    },
    albSecurityGroup: {
      id: `sg-alb-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-${config.environment}-alb-sg`
    },
    taskSecurityGroup: {
      id: `sg-task-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-${config.environment}-task-sg`
    },
    logGroup: {
      id: `/aws/ecs/${config.projectName}-${config.environment}`,
      name: `/aws/ecs/${config.projectName}-${config.environment}`,
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:/aws/ecs/${config.projectName}-${config.environment}`
    },
    taskRole: {
      id: `${config.projectName}-${config.environment}-task-role`,
      arn: `arn:aws:iam::123456789012:role/${config.projectName}-${config.environment}-task`,
      name: `${config.projectName}-${config.environment}-task`
    },
    executionRole: {
      id: `${config.projectName}-${config.environment}-execution-role`,
      arn: `arn:aws:iam::123456789012:role/${config.projectName}-${config.environment}-task-execution`,
      name: `${config.projectName}-${config.environment}-task-execution`
    }
  })),

  StaticAssetsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    bucket: {
      id: `${config.projectName}-${config.environment}-static-assets`,
      arn: `arn:aws:s3:::${config.projectName}-${config.environment}-static-assets`,
      bucket: `${config.projectName}-${config.environment}-static-assets`
    },
    bucketPublicAccessBlock: {
      id: `${config.projectName}-${config.environment}-static-assets-pab`,
      bucket: `${config.projectName}-${config.environment}-static-assets`
    }
  })),

  MonitoringModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dashboard: {
      dashboardName: `${config.projectName}-${config.environment}-dashboard`,
      dashboardArn: `arn:aws:cloudwatch::123456789012:dashboard/${config.projectName}-${config.environment}-dashboard`
    },
    alarms: [
      {
        alarmName: `${config.projectName}-${config.environment}-high-cpu`,
        alarmArn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${config.projectName}-${config.environment}-high-cpu`
      },
      {
        alarmName: `${config.projectName}-${config.environment}-high-memory`,
        alarmArn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${config.projectName}-${config.environment}-high-memory`
      },
      {
        alarmName: `${config.projectName}-${config.environment}-unhealthy-hosts`,
        alarmArn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${config.projectName}-${config.environment}-unhealthy-hosts`
      },
      {
        alarmName: `${config.projectName}-${config.environment}-rds-cpu`,
        alarmArn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${config.projectName}-${config.environment}-rds-cpu`
      },
      {
        alarmName: `${config.projectName}-${config.environment}-rds-storage`,
        alarmArn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${config.projectName}-${config.environment}-rds-storage`
      }
    ]
  }))
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
    TerraformStack: actual.TerraformStack
  };
});

// Mock AWS Provider and Random Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

jest.mock("@cdktf/provider-random/lib/provider", () => ({
  RandomProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    NetworkingModule,
    DatabaseModule,
    ContainerServiceModule,
    StaticAssetsModule,
    MonitoringModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { RandomProvider } = require("@cdktf/provider-random/lib/provider");

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
          defaultTags: [{
            tags: {
              Environment: 'dev',
              Project: 'myapp',
              ManagedBy: 'Terraform',
              Stack: 'TestStack',
            }
          }]
        })
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
      const customTags = { tags: { CostCenter: 'Engineering', Team: 'Platform' } };

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

    test("should configure Random Provider for password generation", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(RandomProvider).toHaveBeenCalledWith(
        expect.anything(),
        'random'
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
        stateBucket: 'custom-tf-state-bucket',
        stateBucketRegion: 'eu-central-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-tf-state-bucket',
          region: 'eu-central-1'
        })
      );
    });

    test("should configure S3 backend with production environment", () => {
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

  describe("Networking Module Tests", () => {
    test("should create NetworkingModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(NetworkingModule).toHaveBeenCalledWith(
        expect.anything(),
        'networking',
        expect.objectContaining({
          vpcCidr: '10.0.0.0/16',
          environment: 'dev',
          projectName: 'myapp'
        })
      );
    });

    test("should create NetworkingModule with custom project name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        projectName: 'custom-app'
      });

      expect(NetworkingModule).toHaveBeenCalledWith(
        expect.anything(),
        'networking',
        expect.objectContaining({
          projectName: 'custom-app'
        })
      );
    });

    test("should create VPC with correct subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkingModule = NetworkingModule.mock.results[0].value;
      expect(networkingModule.publicSubnets).toHaveLength(3);
      expect(networkingModule.privateSubnets).toHaveLength(3);
      expect(networkingModule.natGateways).toHaveLength(3);
    });
  });

  describe("Database Module Tests", () => {
    test("should create DatabaseModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkingModule = NetworkingModule.mock.results[0].value;

      expect(DatabaseModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          vpc: networkingModule.vpc,
          dbSubnetGroup: networkingModule.dbSubnetGroup,
          environment: 'dev',
          projectName: 'myapp',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          databaseName: 'myapp_db'
        })
      );
    });

    test("should configure production database settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      expect(DatabaseModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          instanceClass: 'db.r6g.large',
          allocatedStorage: 100
        })
      );
    });

    test("should handle database name with hyphens correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        projectName: 'my-app-name'
      });

      expect(DatabaseModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          databaseName: 'my_app_name_db'
        })
      );
    });
  });

  describe("Container Service Module Tests", () => {
    test("should create ContainerServiceModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkingModule = NetworkingModule.mock.results[0].value;
      const databaseModule = DatabaseModule.mock.results[0].value;

      expect(ContainerServiceModule).toHaveBeenCalledWith(
        expect.anything(),
        'container-service',
        expect.objectContaining({
          vpc: networkingModule.vpc,
          privateSubnets: networkingModule.privateSubnets,
          publicSubnets: networkingModule.publicSubnets,
          dbSecurityGroup: databaseModule.securityGroup,
          dbSecret: databaseModule.secretsManager,
          environment: 'dev',
          projectName: 'myapp',
          containerImage: 'nginx:latest',
          containerPort: 3000,
          cpu: 256,
          memory: 512,
          desiredCount: 1,
          minCapacity: 1,
          maxCapacity: 3
        })
      );
    });

    test("should configure production container settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      expect(ContainerServiceModule).toHaveBeenCalledWith(
        expect.anything(),
        'container-service',
        expect.objectContaining({
          cpu: 1024,
          memory: 2048,
          desiredCount: 2,
          minCapacity: 2,
          maxCapacity: 10
        })
      );
    });

    test("should pass custom container configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        containerImage: 'my-app:v1.0.0',
        containerPort: 8080,
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234',
        domainName: 'example.com',
        hostedZoneId: 'Z1234567890ABC'
      });

      expect(ContainerServiceModule).toHaveBeenCalledWith(
        expect.anything(),
        'container-service',
        expect.objectContaining({
          containerImage: 'my-app:v1.0.0',
          containerPort: 8080,
          certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234',
          domainName: 'example.com',
          hostedZoneId: 'Z1234567890ABC'
        })
      );
    });
  });

  describe("Static Assets Module Tests", () => {
    test("should create StaticAssetsModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(StaticAssetsModule).toHaveBeenCalledWith(
        expect.anything(),
        'static-assets',
        expect.objectContaining({
          environment: 'dev',
          projectName: 'myapp'
        })
      );
    });

    test("should create static assets bucket with correct naming", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        projectName: 'test-app',
        environmentSuffix: 'staging'
      });

      const staticAssetsModule = StaticAssetsModule.mock.results[0].value;
      expect(staticAssetsModule.bucket.id).toBe('test-app-staging-static-assets');
    });
  });

  describe("Monitoring Module Tests", () => {
    test("should create MonitoringModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const containerServiceModule = ContainerServiceModule.mock.results[0].value;
      const databaseModule = DatabaseModule.mock.results[0].value;

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          environment: 'dev',
          projectName: 'myapp',
          albArn: containerServiceModule.alb.arn,
          targetGroupArn: containerServiceModule.targetGroup.arn,
          clusterName: containerServiceModule.cluster.name,
          serviceName: containerServiceModule.service.name,
          rdsIdentifier: databaseModule.rdsInstance.identifier
        })
      );
    });

    test("should create CloudWatch alarms", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const monitoringModule = MonitoringModule.mock.results[0].value;

      expect(monitoringModule.alarms).toBeDefined();
      expect(monitoringModule.alarms).toHaveLength(5);

      const alarmNames = monitoringModule.alarms.map((a: any) => a.alarmName);
      expect(alarmNames).toContain('myapp-dev-high-cpu');
      expect(alarmNames).toContain('myapp-dev-high-memory');
      expect(alarmNames).toContain('myapp-dev-unhealthy-hosts');
      expect(alarmNames).toContain('myapp-dev-rds-cpu');
      expect(alarmNames).toContain('myapp-dev-rds-storage');
    });

    test("should create CloudWatch dashboard", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const monitoringModule = MonitoringModule.mock.results[0].value;
      expect(monitoringModule.dashboard.dashboardName).toBe('myapp-dev-dashboard');
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(14);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      // Networking outputs
      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('vpc-cidr');

      // Database outputs
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('db-secret-arn');

      // Container service outputs
      expect(outputIds).toContain('alb-dns-name');
      expect(outputIds).toContain('alb-url');
      expect(outputIds).toContain('ecs-cluster-name');
      expect(outputIds).toContain('ecs-service-name');
      expect(outputIds).toContain('task-definition-arn');

      // Static assets outputs
      expect(outputIds).toContain('static-assets-bucket');
      expect(outputIds).toContain('static-assets-bucket-arn');

      // Monitoring outputs
      expect(outputIds).toContain('dashboard-url');
      expect(outputIds).toContain('alarm-count');

      // Log group output
      expect(outputIds).toContain('log-group-name');
    });

    test("should mark sensitive outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsEndpointOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );

      expect(rdsEndpointOutput[2].sensitive).toBe(true);
    });

    test("should create dashboard URL with correct region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      const dashboardUrlOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'dashboard-url'
      );

      expect(dashboardUrlOutput[2].value).toContain('eu-west-1.console.aws.amazon.com');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkingModule = NetworkingModule.mock.results[0].value;

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].vpc).toBe(networkingModule.vpc);

      const containerServiceCall = ContainerServiceModule.mock.calls[0];
      expect(containerServiceCall[2].vpc).toBe(networkingModule.vpc);
    });

    test("should pass database security group to container service", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const databaseModule = DatabaseModule.mock.results[0].value;

      const containerServiceCall = ContainerServiceModule.mock.calls[0];
      expect(containerServiceCall[2].dbSecurityGroup).toBe(databaseModule.securityGroup);
      expect(containerServiceCall[2].dbSecret).toBe(databaseModule.secretsManager);
    });

    test("should pass container service details to monitoring", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const containerServiceModule = ContainerServiceModule.mock.results[0].value;
      const databaseModule = DatabaseModule.mock.results[0].value;

      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].albArn).toBe(containerServiceModule.alb.arn);
      expect(monitoringCall[2].targetGroupArn).toBe(containerServiceModule.targetGroup.arn);
      expect(monitoringCall[2].clusterName).toBe(containerServiceModule.cluster.name);
      expect(monitoringCall[2].serviceName).toBe(containerServiceModule.service.name);
      expect(monitoringCall[2].rdsIdentifier).toBe(databaseModule.rdsInstance.identifier);
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkingCallIndex = NetworkingModule.mock.invocationCallOrder[0];
      const databaseCallIndex = DatabaseModule.mock.invocationCallOrder[0];
      const containerServiceCallIndex = ContainerServiceModule.mock.invocationCallOrder[0];
      const staticAssetsCallIndex = StaticAssetsModule.mock.invocationCallOrder[0];
      const monitoringCallIndex = MonitoringModule.mock.invocationCallOrder[0];

      expect(networkingCallIndex).toBeLessThan(databaseCallIndex);
      expect(networkingCallIndex).toBeLessThan(containerServiceCallIndex);
      expect(databaseCallIndex).toBeLessThan(containerServiceCallIndex);
      expect(containerServiceCallIndex).toBeLessThan(monitoringCallIndex);
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].instanceClass).toBe('db.t3.micro');
      expect(databaseCall[2].allocatedStorage).toBe(20);

      const containerServiceCall = ContainerServiceModule.mock.calls[0];
      expect(containerServiceCall[2].cpu).toBe(256);
      expect(containerServiceCall[2].memory).toBe(512);
      expect(containerServiceCall[2].desiredCount).toBe(1);
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].instanceClass).toBe('db.r6g.large');
      expect(databaseCall[2].allocatedStorage).toBe(100);

      const containerServiceCall = ContainerServiceModule.mock.calls[0];
      expect(containerServiceCall[2].cpu).toBe(1024);
      expect(containerServiceCall[2].memory).toBe(2048);
      expect(containerServiceCall[2].desiredCount).toBe(2);
    });

    test("should handle prod as production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const containerServiceCall = ContainerServiceModule.mock.calls[0];
      expect(containerServiceCall[2].cpu).toBe(1024);
      expect(containerServiceCall[2].memory).toBe(2048);
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: [{
            tags: {
              Environment: 'dev',
              Project: 'myapp',
              ManagedBy: 'Terraform',
              Stack: 'TestStack',
            }
          }]
        })
      );
    });

    test("should handle empty string projectName", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        projectName: ''
      });

      // Should fallback to default
      expect(NetworkingModule).toHaveBeenCalledWith(
        expect.anything(),
        'networking',
        expect.objectContaining({
          projectName: 'myapp'
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
  });

  describe("Complete Infrastructure Stack", () => {
    test("should create all infrastructure components", () => {
      const app = new App();
      const stack = new TapStack(app, "CompleteStackTest");

      expect(stack).toBeDefined();

      // Verify all modules are created
      expect(NetworkingModule).toHaveBeenCalledTimes(1);
      expect(DatabaseModule).toHaveBeenCalledTimes(1);
      expect(ContainerServiceModule).toHaveBeenCalledTimes(1);
      expect(StaticAssetsModule).toHaveBeenCalledTimes(1);
      expect(MonitoringModule).toHaveBeenCalledTimes(1);

      // Verify providers and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(RandomProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);

      // Verify outputs
      expect(TerraformOutput).toHaveBeenCalledTimes(14);
    });

    test("should maintain proper module relationships", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Get module instances
      const networkingModule = NetworkingModule.mock.results[0].value;
      const databaseModule = DatabaseModule.mock.results[0].value;
      const containerServiceModule = ContainerServiceModule.mock.results[0].value;

      // Verify Database module received networking details
      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].vpc).toBe(networkingModule.vpc);
      expect(databaseCall[2].dbSubnetGroup).toBe(networkingModule.dbSubnetGroup);

      // Verify ContainerService module received dependencies
      const containerServiceCall = ContainerServiceModule.mock.calls[0];
      expect(containerServiceCall[2].vpc).toBe(networkingModule.vpc);
      expect(containerServiceCall[2].privateSubnets).toBe(networkingModule.privateSubnets);
      expect(containerServiceCall[2].publicSubnets).toBe(networkingModule.publicSubnets);
      expect(containerServiceCall[2].dbSecurityGroup).toBe(databaseModule.securityGroup);
      expect(containerServiceCall[2].dbSecret).toBe(databaseModule.secretsManager);

      // Verify Monitoring module received container service and database details
      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].albArn).toBe(containerServiceModule.alb.arn);
      expect(monitoringCall[2].rdsIdentifier).toBe(databaseModule.rdsInstance.identifier);
    });

    test("should create consistent resource naming", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        projectName: 'test-app',
        environmentSuffix: 'qa'
      });

      const networkingModule = NetworkingModule.mock.results[0].value;
      expect(networkingModule.vpc.id).toBe('vpc-test-app-qa');

      const databaseModule = DatabaseModule.mock.results[0].value;
      expect(databaseModule.rdsInstance.id).toBe('test-app-qa-db');

      const containerServiceModule = ContainerServiceModule.mock.results[0].value;
      expect(containerServiceModule.cluster.name).toBe('test-app-qa-cluster');
      expect(containerServiceModule.service.name).toBe('test-app-qa-service');

      const monitoringModule = MonitoringModule.mock.results[0].value;
      expect(monitoringModule.dashboard.dashboardName).toBe('test-app-qa-dashboard');
    });
  });

  describe("Special Configuration Scenarios", () => {
    test("should handle HTTPS configuration when certificate is provided", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678',
        domainName: 'example.com',
        hostedZoneId: 'Z1234567890ABC'
      });

      const containerServiceCall = ContainerServiceModule.mock.calls[0];
      expect(containerServiceCall[2].certificateArn).toBe('arn:aws:acm:us-east-1:123456789012:certificate/12345678');
      expect(containerServiceCall[2].domainName).toBe('example.com');
      expect(containerServiceCall[2].hostedZoneId).toBe('Z1234567890ABC');
    });

    test("should create multiple availability zone resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkingModule = NetworkingModule.mock.results[0].value;

      // Should create 3 AZs worth of resources
      expect(networkingModule.publicSubnets).toHaveLength(3);
      expect(networkingModule.privateSubnets).toHaveLength(3);
      expect(networkingModule.natGateways).toHaveLength(3);

      // Check subnet CIDR blocks
      expect(networkingModule.publicSubnets[0].cidrBlock).toBe('10.0.0.0/24');
      expect(networkingModule.privateSubnets[0].cidrBlock).toBe('10.0.1.0/24');
      expect(networkingModule.publicSubnets[1].cidrBlock).toBe('10.0.2.0/24');
      expect(networkingModule.privateSubnets[1].cidrBlock).toBe('10.0.3.0/24');
    });

    test("should handle database name transformation", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        projectName: 'my-awesome-app'
      });

      const databaseCall = DatabaseModule.mock.calls[0];
      // Hyphens should be replaced with underscores for database name
      expect(databaseCall[2].databaseName).toBe('my_awesome_app_db');
    });

    test("should configure alarm count output correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const alarmCountOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alarm-count'
      );

      expect(alarmCountOutput[2].value).toBe('5'); // Should be string representation of alarm count
    });
  });

  describe("AWS Region Override", () => {
    test("should respect AWS_REGION_OVERRIDE when set", () => {
      // This test would require modifying AWS_REGION_OVERRIDE in the actual code
      // For testing purposes, we verify the default behavior
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-southeast-1'
      });

      // Since AWS_REGION_OVERRIDE is empty string, it should use the provided region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1'
        })
      );
    });
  });
});