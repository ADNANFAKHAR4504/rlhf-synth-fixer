import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VPCModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    vpc: {
      id: `vpc-${props.projectName}-${props.environment}`,
      cidrBlock: props.cidrBlock
    },
    publicSubnets: props.availabilityZones.map((az: string, i: number) => ({
      id: `public-subnet-${i}-${props.projectName}-${props.environment}`,
      cidrBlock: `10.0.${i * 2}.0/24`,
      availabilityZone: az
    })),
    privateSubnets: props.availabilityZones.map((az: string, i: number) => ({
      id: `private-subnet-${i}-${props.projectName}-${props.environment}`,
      cidrBlock: `10.0.${i * 2 + 1}.0/24`,
      availabilityZone: az
    })),
    natGateways: props.availabilityZones.map((az: string, i: number) => ({
      id: `nat-gateway-${i}-${props.projectName}-${props.environment}`
    })),
    internetGateway: {
      id: `igw-${props.projectName}-${props.environment}`
    }
  })),

  EC2Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    webInstances: props.publicSubnetIds.map((subnetId: string, i: number) => ({
      id: `i-web-${i}-${props.projectName}-${props.environment}`,
      instanceType: props.webInstanceType
    })),
    backendAsg: {
      name: `${props.projectName}-${props.environment}-Backend-ASG`,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity
    },
    alb: {
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${props.projectName}-${props.environment}-ALB`,
      dnsName: `${props.projectName}-${props.environment}-alb-123456789.us-east-1.elb.amazonaws.com`,
      zoneId: "Z35SXDOTRQ7X7K",
      arnSuffix: `app/${props.projectName}-${props.environment}-ALB/50dc6c495c0c9188`
    },
    webSecurityGroup: {
      id: `sg-web-${props.projectName}-${props.environment}`,
      name: `${props.projectName}-${props.environment}-WebSG`
    },
    backendSecurityGroup: {
      id: `sg-backend-${props.projectName}-${props.environment}`,
      name: `${props.projectName}-${props.environment}-BackendSG`
    },
    albSecurityGroup: {
      id: `sg-alb-${props.projectName}-${props.environment}`,
      name: `${props.projectName}-${props.environment}-ALBSG`
    },
    targetGroup: {
      arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${props.projectName}-${props.environment}-TG`
    }
  })),

  RDSModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    dbInstance: {
      id: `${props.projectName}-${props.environment}-db`,
      endpoint: `${props.projectName}-${props.environment}-db.cluster-xyz.us-east-1.rds.amazonaws.com`,
      port: 3306,
      address: `${props.projectName}-${props.environment}-db.cluster-xyz.us-east-1.rds.amazonaws.com`
    },
    dbSecurityGroup: {
      id: `sg-db-${props.projectName}-${props.environment}`,
      name: `${props.projectName}-${props.environment}-DBSG`
    },
    dbSubnetGroup: {
      name: `${props.projectName}-${props.environment}-dbsubnet`,
      id: `${props.projectName}-${props.environment}-dbsubnet`
    }
  })),

  S3Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    bucket: {
      id: props.bucketName,
      bucket: props.bucketName,
      arn: `arn:aws:s3:::${props.bucketName}`,
      bucketDomainName: `${props.bucketName}.s3.amazonaws.com`
    },
    bucketPolicy: props.enablePublicRead ? {
      id: `${props.bucketName}-policy`,
      bucket: props.bucketName
    } : undefined,
    bucketPublicAccessBlock: {
      id: `${props.bucketName}-pab`,
      bucket: props.bucketName
    }
  })),

  LambdaModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    function: {
      arn: `arn:aws:lambda:us-east-1:123456789012:function:${props.functionName}`,
      functionName: props.functionName,
      id: props.functionName,
      invokeArn: `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${props.functionName}/invocations`
    },
    role: {
      arn: `arn:aws:iam::123456789012:role/${props.projectName}-${props.environment}-Lambda-Role`,
      name: `${props.projectName}-${props.environment}-Lambda-Role`,
      id: `${props.projectName}-${props.environment}-Lambda-Role`
    },
    logGroup: {
      name: `/aws/lambda/${props.functionName}`,
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/${props.functionName}`,
      id: `/aws/lambda/${props.functionName}`
    }
  })),

  MonitoringModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    snsTopic: {
      arn: `arn:aws:sns:us-east-1:123456789012:${props.projectName}-${props.environment}-Alerts`,
      name: `${props.projectName}-${props.environment}-Alerts`,
      id: `${props.projectName}-${props.environment}-Alerts`
    },
    alarms: [
      ...(props.instanceIds || []).map((id: string, i: number) => ({
        alarmName: `${props.projectName}-${props.environment}-EC2-CPU-High-${i}`,
        alarmDescription: "This metric monitors ec2 cpu utilization"
      })),
      {
        alarmName: `${props.projectName}-${props.environment}-ALB-UnhealthyTargets`,
        alarmDescription: "Alert when we have unhealthy targets"
      },
      {
        alarmName: `${props.projectName}-${props.environment}-RDS-CPU-High`,
        alarmDescription: "RDS instance high CPU"
      },
      {
        alarmName: `${props.projectName}-${props.environment}-RDS-Connection-High`,
        alarmDescription: "RDS instance high connection count"
      }
    ]
  })),

  Route53Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    hostedZone: {
      zoneId: `Z1234567890ABC`,
      name: props.domainName,
      id: props.domainName,
      nameServers: [
        "ns-123.awsdns-12.com",
        "ns-456.awsdns-34.net",
        "ns-789.awsdns-56.org",
        "ns-012.awsdns-78.co.uk"
      ]
    },
    records: props.createARecords ? [
      {
        name: `www.${props.domainName}`,
        type: 'A',
        fqdn: `www.${props.domainName}`
      },
      {
        name: props.domainName,
        type: 'A',
        fqdn: props.domainName
      }
    ] : []
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

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    VPCModule, 
    EC2Module, 
    RDSModule,
    S3Module,
    LambdaModule,
    MonitoringModule,
    Route53Module
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

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

    test("should use correct project name and owner", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(VPCModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'tap-project',
          owner: 'DevOps-Team'
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

  describe("VPC Module Tests", () => {
    test("should create VPC with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(VPCModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          owner: 'DevOps-Team',
          cidrBlock: '10.0.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          enableDnsHostnames: true,
          enableDnsSupport: true
        })
      );
    });

    test("should create VPC with custom region availability zones", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      const vpcCall = VPCModule.mock.calls[0];
      expect(vpcCall[2].availabilityZones).toEqual(['eu-west-1a', 'eu-west-1b']);
    });

    test("should create correct number of subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;
      expect(vpcModule.publicSubnets).toHaveLength(2);
      expect(vpcModule.privateSubnets).toHaveLength(2);
      expect(vpcModule.natGateways).toHaveLength(2);
    });
  });

  describe("EC2 Module Tests", () => {
    test("should create EC2 module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;

    });

    test("should pass correct subnet IDs to EC2 module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;
      const ec2Call = EC2Module.mock.calls[0];

      expect(ec2Call[2].publicSubnetIds).toEqual(
        vpcModule.publicSubnets.map((s: any) => s.id)
      );
      expect(ec2Call[2].privateSubnetIds).toEqual(
        vpcModule.privateSubnets.map((s: any) => s.id)
      );
    });

    test("should create Backend Auto Scaling Group", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = EC2Module.mock.results[0].value;
      
      expect(ec2Module.backendAsg).toBeDefined();
      expect(ec2Module.backendAsg.name).toBe('tap-project-dev-Backend-ASG');
      expect(ec2Module.backendAsg.minSize).toBe(1);
      expect(ec2Module.backendAsg.maxSize).toBe(3);
      expect(ec2Module.backendAsg.desiredCapacity).toBe(2);
    });

    test("should create Application Load Balancer", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = EC2Module.mock.results[0].value;
      
      expect(ec2Module.alb).toBeDefined();
      expect(ec2Module.alb.dnsName).toContain('tap-project-dev-alb');
      expect(ec2Module.alb.zoneId).toBe('Z35SXDOTRQ7X7K');
    });

    test("should create web instances based on public subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = EC2Module.mock.results[0].value;
      
      expect(ec2Module.webInstances).toBeDefined();
      expect(ec2Module.webInstances).toHaveLength(2);
      expect(ec2Module.webInstances[0].instanceType).toBe('t3.micro');
    });
  });

  describe("RDS Module Tests", () => {
    test("should create RDS instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;

      expect(RDSModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          owner: 'DevOps-Team',
          vpcId: vpcModule.vpc.id,
          engine: 'mysql',
          instanceClass: 'db.t3.small',
          allocatedStorage: 20,
          storageEncrypted: true,
          multiAz: false,
          backupRetentionPeriod: 7,
          preferredBackupWindow: '03:00-04:00',
          preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
          databaseName: 'tapdb',
          masterUsername: 'admin',
          masterPasswordSsmParameter: '/tap/dev/db/password'
        })
      );
    });

    test("should pass correct private subnet IDs to RDS module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;
      const rdsCall = RDSModule.mock.calls[0];

      expect(rdsCall[2].privateSubnetIds).toEqual(
        vpcModule.privateSubnets.map((s: any) => s.id)
      );
    });

    test("should configure SSM parameter path for database password", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const rdsCall = RDSModule.mock.calls[0];
      expect(rdsCall[2].masterPasswordSsmParameter).toBe('/tap/staging/db/password');
    });

    test("should create database subnet group", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsModule = RDSModule.mock.results[0].value;
      
      expect(rdsModule.dbSubnetGroup).toBeDefined();
      expect(rdsModule.dbSubnetGroup.name).toBe('tap-project-dev-dbsubnet');
    });
  });

  describe("S3 Module Tests", () => {
    test("should create public S3 bucket with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-public',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          owner: 'DevOps-Team',
          bucketName: 'tap-project-dev-public-assets',
          enableVersioning: true,
          enablePublicRead: true
        })
      );
    });

    test("should create private S3 bucket with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-private',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          owner: 'DevOps-Team',
          bucketName: 'tap-project-dev-private-data',
          enableVersioning: true,
          enablePublicRead: false
        })
      );
    });

    test("should configure lifecycle rules for public bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const publicS3Call = S3Module.mock.calls[0];
      const lifecycleRules = publicS3Call[2].lifecycleRules;

      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].id).toBe('expire-old-objects');
      expect(lifecycleRules[0].expiration.days).toBe(90);
      expect(lifecycleRules[0].noncurrentVersionExpiration.noncurrent_days).toBe(30);
    });

    test("should configure lifecycle rules for private bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const privateS3Call = S3Module.mock.calls[1];
      const lifecycleRules = privateS3Call[2].lifecycleRules;

      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].id).toBe('transition-to-ia');
      expect(lifecycleRules[0].transition[0].storageClass).toBe('STANDARD_IA');
      expect(lifecycleRules[0].transition[0].days).toBe(30);
    });

    test("should create bucket policy for public bucket only", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const publicS3Module = S3Module.mock.results[0].value;
      const privateS3Module = S3Module.mock.results[1].value;

      expect(publicS3Module.bucketPolicy).toBeDefined();
      expect(privateS3Module.bucketPolicy).toBeUndefined();
    });
  });

  describe("Lambda Module Tests", () => {
    test("should create Lambda function with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;
      const ec2Module = EC2Module.mock.results[0].value;

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        'lambda',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          owner: 'DevOps-Team',
          functionName: 'tap-project-dev-processor',
          runtime: 'nodejs18.x',
          handler: 'index.handler',
          sourceBucket: 'test12345-ts',
          sourceKey: 'lambda/lambda-function.zip',
          timeout: 30,
          memorySize: 256
        })
      );
    });

    test("should configure VPC settings for Lambda", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;
      const ec2Module = EC2Module.mock.results[0].value;
      const lambdaCall = LambdaModule.mock.calls[0];

      expect(lambdaCall[2].vpcConfig).toBeDefined();
      expect(lambdaCall[2].vpcConfig.subnetIds).toEqual(
        vpcModule.privateSubnets.map((s: any) => s.id)
      );
      expect(lambdaCall[2].vpcConfig.securityGroupIds).toContain(
        ec2Module.backendSecurityGroup.id
      );
    });

    test("should create Lambda IAM role", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaModule = LambdaModule.mock.results[0].value;
      
      expect(lambdaModule.role).toBeDefined();
      expect(lambdaModule.role.name).toBe('tap-project-dev-Lambda-Role');
    });

    test("should create CloudWatch Log Group for Lambda", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaModule = LambdaModule.mock.results[0].value;
      
      expect(lambdaModule.logGroup).toBeDefined();
      expect(lambdaModule.logGroup.name).toBe('/aws/lambda/tap-project-dev-processor');
    });
  });

  describe("Route53 Module Tests", () => {
    test("should create Route53 hosted zone with domain", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = EC2Module.mock.results[0].value;

      expect(Route53Module).toHaveBeenCalledWith(
        expect.anything(),
        'route53',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          owner: 'DevOps-Team',
          domainName: 'dev.tap-project.com',
          albDnsName: ec2Module.alb.dnsName,
          albZoneId: ec2Module.alb.zoneId,
          createARecords: true
        })
      );
    });

    test("should create A records for www and apex domain", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const route53Module = Route53Module.mock.results[0].value;
      
      expect(route53Module.records).toHaveLength(2);
      
      const recordNames = route53Module.records.map((r: any) => r.name);
      expect(recordNames).toContain('www.dev.tap-project.com');
      expect(recordNames).toContain('dev.tap-project.com');
    });

    test("should use environment-specific domain", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const route53Call = Route53Module.mock.calls[0];
      expect(route53Call[2].domainName).toBe('staging.tap-project.com');
    });
  });

  describe("Monitoring Module Tests", () => {
    test("should create monitoring module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = EC2Module.mock.results[0].value;
      const rdsModule = RDSModule.mock.results[0].value;

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          projectName: 'tap-project',
          environment: 'dev',
          owner: 'DevOps-Team',
          alarmEmail: 'devops@tap-project.com',
          instanceIds: ec2Module.webInstances.map((i: any) => i.id),
          albArn: ec2Module.alb.arn,
          rdsIdentifier: rdsModule.dbInstance.id
        })
      );
    });

    test("should create CloudWatch alarms for EC2, ALB, and RDS", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const monitoringModule = MonitoringModule.mock.results[0].value;
      
      expect(monitoringModule.alarms).toBeDefined();
      expect(monitoringModule.alarms.length).toBeGreaterThanOrEqual(4);
      
      const alarmNames = monitoringModule.alarms.map((a: any) => a.alarmName);
      expect(alarmNames.some((n: string) => n.includes('EC2-CPU-High'))).toBe(true);
      expect(alarmNames.some((n: string) => n.includes('ALB-UnhealthyTargets'))).toBe(true);
      expect(alarmNames.some((n: string) => n.includes('RDS-CPU-High'))).toBe(true);
      expect(alarmNames.some((n: string) => n.includes('RDS-Connection-High'))).toBe(true);
    });

    test("should create SNS topic for alerts", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const monitoringModule = MonitoringModule.mock.results[0].value;
      
      expect(monitoringModule.snsTopic).toBeDefined();
      expect(monitoringModule.snsTopic.name).toBe('tap-project-dev-Alerts');
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(10);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('alb-dns-name');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('public-s3-bucket-name');
      expect(outputIds).toContain('private-s3-bucket-arn');
      expect(outputIds).toContain('lambda-function-arn');
      expect(outputIds).toContain('monitoring-sns-topic-arn');
      expect(outputIds).toContain('route53-zone-id');
      expect(outputIds).toContain('backend-asg-name');
      expect(outputIds).toContain('nat-gateway-ids');
    });

    test("should output VPC information", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      expect(vpcOutput[2].value).toBe('vpc-tap-project-dev');
      expect(vpcOutput[2].description).toBe('VPC ID');
    });

    test("should output ALB DNS name", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );
      expect(albOutput[2].value).toContain('tap-project-dev-alb');
      expect(albOutput[2].description).toBe('Application Load Balancer DNS name');
    });

    test("should output Lambda function ARN", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'lambda-function-arn'
      );
      expect(lambdaOutput[2].value).toContain('function:tap-project-dev-processor');
      expect(lambdaOutput[2].description).toBe('Lambda function ARN');
    });

    test("should output NAT Gateway IDs as array", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const natOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'nat-gateway-ids'
      );
      expect(Array.isArray(natOutput[2].value)).toBe(true);
      expect(natOutput[2].value).toHaveLength(2);
      expect(natOutput[2].description).toBe('NAT Gateway IDs for private subnet internet access');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC ID to EC2, RDS, Lambda modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;
      
      const ec2Call = EC2Module.mock.calls[0];
      expect(ec2Call[2].vpcId).toBe(vpcModule.vpc.id);

      const rdsCall = RDSModule.mock.calls[0];
      expect(rdsCall[2].vpcId).toBe(vpcModule.vpc.id);
    });

    test("should pass EC2 and RDS information to Monitoring module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = EC2Module.mock.results[0].value;
      const rdsModule = RDSModule.mock.results[0].value;
      
      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].instanceIds).toEqual(
        ec2Module.webInstances.map((i: any) => i.id)
      );
      expect(monitoringCall[2].albArn).toBe(ec2Module.alb.arn);
      expect(monitoringCall[2].rdsIdentifier).toBe(rdsModule.dbInstance.id);
    });

    test("should pass ALB details to Route53 module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = EC2Module.mock.results[0].value;
      
      const route53Call = Route53Module.mock.calls[0];
      expect(route53Call[2].albDnsName).toBe(ec2Module.alb.dnsName);
      expect(route53Call[2].albZoneId).toBe(ec2Module.alb.zoneId);
    });

    test("should pass private subnets and security group to Lambda module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;
      const ec2Module = EC2Module.mock.results[0].value;
      
      const lambdaCall = LambdaModule.mock.calls[0];
      expect(lambdaCall[2].vpcConfig.subnetIds).toEqual(
        vpcModule.privateSubnets.map((s: any) => s.id)
      );
      expect(lambdaCall[2].vpcConfig.securityGroupIds).toContain(
        ec2Module.backendSecurityGroup.id
      );
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const vpcCallIndex = VPCModule.mock.invocationCallOrder[0];
      const ec2CallIndex = EC2Module.mock.invocationCallOrder[0];
      const rdsCallIndex = RDSModule.mock.invocationCallOrder[0];
      const lambdaCallIndex = LambdaModule.mock.invocationCallOrder[0];
      const monitoringCallIndex = MonitoringModule.mock.invocationCallOrder[0];
      
      expect(vpcCallIndex).toBeLessThan(ec2CallIndex);
      expect(vpcCallIndex).toBeLessThan(rdsCallIndex);
      expect(vpcCallIndex).toBeLessThan(lambdaCallIndex);
      expect(ec2CallIndex).toBeLessThan(monitoringCallIndex);
      expect(rdsCallIndex).toBeLessThan(monitoringCallIndex);
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      const vpcCall = VPCModule.mock.calls[0];
      expect(vpcCall[2].environment).toBe('dev');

      const rdsCall = RDSModule.mock.calls[0];
      expect(rdsCall[2].multiAz).toBe(false);
      expect(rdsCall[2].backupRetentionPeriod).toBe(7);
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const vpcCall = VPCModule.mock.calls[0];
      expect(vpcCall[2].environment).toBe('prod');

      const lambdaCall = LambdaModule.mock.calls[0];
      expect(lambdaCall[2].functionName).toBe('tap-project-prod-processor');

      const route53Call = Route53Module.mock.calls[0];
      expect(route53Call[2].domainName).toBe('prod.tap-project.com');
    });

    test("should configure bucket names based on environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const publicS3Call = S3Module.mock.calls[0];
      expect(publicS3Call[2].bucketName).toBe('tap-project-staging-public-assets');

      const privateS3Call = S3Module.mock.calls[1];
      expect(privateS3Call[2].bucketName).toBe('tap-project-staging-private-data');
    });
  });

  describe("Tag Propagation", () => {
    test("should propagate common tags to all modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const expectedTags = {
        projectName: 'tap-project',
        environment: 'dev',
        owner: 'DevOps-Team'
      };

      const moduleCallChecks = [
        VPCModule,
        EC2Module,
        RDSModule,
        S3Module,
        LambdaModule,
        MonitoringModule,
        Route53Module
      ];

      moduleCallChecks.forEach(Module => {
        const call = Module.mock.calls[0];
        expect(call[2]).toMatchObject(expectedTags);
      });
    });

    test("should update tags based on environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      const vpcCall = VPCModule.mock.calls[0];
      expect(vpcCall[2].environment).toBe('production');

      const ec2Call = EC2Module.mock.calls[0];
      expect(ec2Call[2].environment).toBe('production');
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      
      // Should use all default values
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      expect(Route53Module).toHaveBeenCalledWith(
        expect.anything(),
        'route53',
        expect.objectContaining({
          domainName: 'dev.tap-project.com'
        })
      );

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          alarmEmail: 'devops@tap-project.com'
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
      expect(VPCModule).toHaveBeenCalledTimes(1);
      expect(EC2Module).toHaveBeenCalledTimes(1);
      expect(RDSModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(2); // Public and Private
      expect(LambdaModule).toHaveBeenCalledTimes(1);
      expect(MonitoringModule).toHaveBeenCalledTimes(1);
      expect(Route53Module).toHaveBeenCalledTimes(1);

      // Verify provider and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);

      // Verify outputs
      expect(TerraformOutput).toHaveBeenCalledTimes(10);
    });

    test("should maintain proper module relationships", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Get module instances
      const vpcModule = VPCModule.mock.results[0].value;
      const ec2Module = EC2Module.mock.results[0].value;
      const rdsModule = RDSModule.mock.results[0].value;

      // Verify EC2 module received VPC details
      const ec2Call = EC2Module.mock.calls[0];
      expect(ec2Call[2].vpcId).toBe(vpcModule.vpc.id);

      // Verify RDS module received VPC details
      const rdsCall = RDSModule.mock.calls[0];
      expect(rdsCall[2].vpcId).toBe(vpcModule.vpc.id);

      // Verify Lambda module received VPC and security group details
      const lambdaCall = LambdaModule.mock.calls[0];
      expect(lambdaCall[2].vpcConfig.subnetIds).toEqual(
        vpcModule.privateSubnets.map((s: any) => s.id)
      );

      // Verify Monitoring module received EC2 and RDS details
      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].albArn).toBe(ec2Module.alb.arn);
      expect(monitoringCall[2].rdsIdentifier).toBe(rdsModule.dbInstance.id);

      // Verify Route53 module received ALB details
      const route53Call = Route53Module.mock.calls[0];
      expect(route53Call[2].albDnsName).toBe(ec2Module.alb.dnsName);
      expect(route53Call[2].albZoneId).toBe(ec2Module.alb.zoneId);
    });

    test("should create consistent resource naming", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'qa'
      });

      // All resources should follow the naming pattern: projectName-environment-resourceType
      const ec2Module = EC2Module.mock.results[0].value;
      expect(ec2Module.backendAsg.name).toBe('tap-project-qa-Backend-ASG');

      const rdsModule = RDSModule.mock.results[0].value;
      expect(rdsModule.dbInstance.id).toBe('tap-project-qa-db');

      const lambdaModule = LambdaModule.mock.results[0].value;
      expect(lambdaModule.function.functionName).toBe('tap-project-qa-processor');

      const monitoringModule = MonitoringModule.mock.results[0].value;
      expect(monitoringModule.snsTopic.name).toBe('tap-project-qa-Alerts');
    });
  });

  describe("S3 Module Lifecycle Rules", () => {
    test("should configure expiration for public bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const publicS3Call = S3Module.mock.calls[0];
      const lifecycleRules = publicS3Call[2].lifecycleRules;

      expect(lifecycleRules[0].expiration.days).toBe(90);
      expect(lifecycleRules[0].noncurrentVersionExpiration.noncurrent_days).toBe(30);
    });

    test("should configure storage class transition for private bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const privateS3Call = S3Module.mock.calls[1];
      const lifecycleRules = privateS3Call[2].lifecycleRules;

      expect(lifecycleRules[0].transition).toBeDefined();
      expect(lifecycleRules[0].transition[0].days).toBe(30);
      expect(lifecycleRules[0].transition[0].storageClass).toBe('STANDARD_IA');
    });
  });

  describe("Lambda VPC Configuration", () => {
    test("should configure Lambda with VPC access", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const lambdaCall = LambdaModule.mock.calls[0];
      
      expect(lambdaCall[2].vpcConfig).toBeDefined();
      expect(lambdaCall[2].vpcConfig.subnetIds).toBeDefined();
      expect(lambdaCall[2].vpcConfig.securityGroupIds).toBeDefined();
      expect(lambdaCall[2].vpcConfig.subnetIds.length).toBeGreaterThan(0);
      expect(lambdaCall[2].vpcConfig.securityGroupIds.length).toBeGreaterThan(0);
    });

    test("should use private subnets for Lambda", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VPCModule.mock.results[0].value;
      const lambdaCall = LambdaModule.mock.calls[0];
      
      expect(lambdaCall[2].vpcConfig.subnetIds).toEqual(
        vpcModule.privateSubnets.map((s: any) => s.id)
      );
    });
  });
});