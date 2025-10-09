import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    vpc: {
      id: `vpc-${props.projectName}-${props.environment}`,
      cidrBlock: props.cidrBlock
    },
    publicSubnets: Array.from({ length: props.azCount }, (_, i) => ({
      id: `public-subnet-${i}-${props.projectName}-${props.environment}`,
      cidrBlock: `10.0.${i * 2}.0/24`,
      availabilityZone: `${props.region}${String.fromCharCode(97 + i)}`
    })),
    privateSubnets: Array.from({ length: props.azCount }, (_, i) => ({
      id: `private-subnet-${i}-${props.projectName}-${props.environment}`,
      cidrBlock: `10.0.${i * 2 + 1}.0/24`,
      availabilityZone: `${props.region}${String.fromCharCode(97 + i)}`
    })),
    natGateways: props.enableNatGateway ? Array.from({ length: props.azCount }, (_, i) => ({
      id: `nat-gateway-${i}-${props.projectName}-${props.environment}`
    })) : [],
    internetGateway: {
      id: `igw-${props.projectName}-${props.environment}`
    }
  })),

  Ec2Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    webAsg: {
      name: `${props.projectName}-${props.environment}-WebASG`,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity
    },
    backendAsg: {
      name: `${props.projectName}-${props.environment}-BackendASG`,
      minSize: props.minSize,
      maxSize: props.maxSize,
      desiredCapacity: props.desiredCapacity
    },
    alb: {
      arn: `arn:aws:elasticloadbalancing:${props.region}:123456789012:loadbalancer/app/${props.projectName}-${props.environment}-ALB`,
      dnsName: `${props.projectName}-${props.environment}-alb-123456789.${props.region}.elb.amazonaws.com`,
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
    }
  })),

  RdsModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    dbInstance: {
      id: `${props.projectName}-${props.environment}-new-db`,
      endpoint: `${props.projectName}-${props.environment}-new-db.cluster-xyz.${props.region}.rds.amazonaws.com`,
      masterUserSecret: {
        get: jest.fn().mockReturnValue({ 
          secretArn: `arn:aws:secretsmanager:${props.region}:123456789012:secret:${props.projectName}-${props.environment}-DBSecret-abc123` 
        })
      }
    },
    dbSecurityGroup: {
      id: `sg-db-${props.projectName}-${props.environment}`,
      name: `${props.projectName}-${props.environment}-DBSG`
    },
    dbSubnetGroup: {
      name: `${props.projectName}-${props.environment}-dbsubnet`,
      id: `${props.projectName}-${props.environment}-dbsubnet`
    },
    dbSecret: {
      id: `${props.projectName}-${props.environment}-DBSecret`,
      arn: `arn:aws:secretsmanager:${props.region}:123456789012:secret:${props.projectName}-${props.environment}-DBSecret`
    }
  })),

  S3Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    bucket: {
      id: props.bucketName || `${props.projectName}-${props.environment}-assets-${Date.now()}`,
      bucket: props.bucketName || `${props.projectName}-${props.environment}-assets-123456`,
      arn: `arn:aws:s3:::${props.bucketName || `${props.projectName}-${props.environment}-assets-123456`}`
    },
    bucketPolicy: props.publicReadAccess ? {
      id: `${props.bucketName}-policy`,
      bucket: props.bucketName
    } : undefined
  })),

  MonitoringModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    snsTopic: {
      arn: `arn:aws:sns:${props.region}:123456789012:${props.projectName}-${props.environment}-Alerts`,
      name: `${props.projectName}-${props.environment}-Alerts`
    },
    alarms: [
      {
        alarmName: `${props.projectName}-${props.environment}-Web-HighCPU`,
        alarmDescription: "This metric monitors ec2 cpu utilization"
      },
      {
        alarmName: `${props.projectName}-${props.environment}-ALB-UnhealthyTargets`,
        alarmDescription: "Alert when we have any unhealthy targets"
      },
      {
        alarmName: `${props.projectName}-${props.environment}-DB-HighCPU`,
        alarmDescription: "Database CPU utilization"
      },
      {
        alarmName: `${props.projectName}-${props.environment}-DB-LowStorage`,
        alarmDescription: "Database free storage space"
      }
    ]
  })),

  Route53Module: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    hostedZone: {
      zoneId: `Z1234567890ABC`,
      name: props.domainName,
      nameServers: [
        "ns-123.awsdns-12.com",
        "ns-456.awsdns-34.net",
        "ns-789.awsdns-56.org",
        "ns-012.awsdns-78.co.uk"
      ]
    },
    records: props.albDnsName ? [
      {
        name: props.domainName,
        type: 'A'
      },
      {
        name: `www.${props.domainName}`,
        type: 'CNAME'
      }
    ] : []
  })),

  SsmModule: jest.fn().mockImplementation((scope: any, id: string, props: any) => ({
    parameters: props.parameters.map((param: any, index: number) => ({
      name: `/${props.projectName}/${props.environment}/${param.name}`,
      value: param.value,
      type: param.type || 'SecureString',
      arn: `arn:aws:ssm:${props.region}:123456789012:parameter/${props.projectName}/${props.environment}/${param.name}`
    }))
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
    TerraformStack: actual.TerraformStack,
    Fn: {
      element: jest.fn((list, index) => list[index])
    }
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws/lib/data-aws-availability-zones", () => ({
  DataAwsAvailabilityZones: jest.fn().mockImplementation(() => ({
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c']
  }))
}));

describe("TapStack Unit Tests", () => {
  const { 
    VpcModule, 
    Ec2Module, 
    RdsModule,
    S3Module,
    MonitoringModule,
    Route53Module,
    SsmModule
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
      const customTags = { tags: { Owner: 'Platform-Team', CostCenter: 'Engineering' } };

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

    test("should handle custom domain name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        domainName: 'custom.example.com'
      });

      expect(Route53Module).toHaveBeenCalledWith(
        expect.anything(),
        'route53',
        expect.objectContaining({
          domainName: 'custom.example.com'
        })
      );
    });

    test("should handle custom alert email", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        alertEmail: 'ops-team@example.com'
      });

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          emailEndpoint: 'ops-team@example.com'
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
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-central-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-state-bucket',
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

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          cidrBlock: '10.0.0.0/16',
          azCount: 2,
          enableNatGateway: true,
          enableVpnGateway: false,
          tags: expect.objectContaining({
            Project: 'tap-infrastructure',
            Environment: 'dev',
            ManagedBy: 'CDKTF',
            Owner: 'DevOps'
          })
        })
      );
    });

    test("should create VPC with NAT Gateway enabled", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].enableNatGateway).toBe(true);

      const vpcModule = VpcModule.mock.results[0].value;
      expect(vpcModule.natGateways).toHaveLength(2);
    });

    test("should create correct number of subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      expect(vpcModule.publicSubnets).toHaveLength(2);
      expect(vpcModule.privateSubnets).toHaveLength(2);
    });
  });

  describe("EC2 Module Tests", () => {
    test("should create EC2 module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;

      expect(Ec2Module).toHaveBeenCalledWith(
        expect.anything(),
        'ec2',
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          vpc: vpcModule,
          instanceType: 't2.micro',
          amiId: 'ami-084a7d336e816906b',
          minSize: 1,
          maxSize: 2,
          desiredCapacity: 1,
          tags: expect.objectContaining({
            Project: 'tap-infrastructure',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create Web and Backend Auto Scaling Groups", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = Ec2Module.mock.results[0].value;
      
      expect(ec2Module.webAsg).toBeDefined();
      expect(ec2Module.webAsg.name).toBe('tap-infrastructure-dev-WebASG');
      expect(ec2Module.webAsg.minSize).toBe(1);
      expect(ec2Module.webAsg.maxSize).toBe(2);
      
      expect(ec2Module.backendAsg).toBeDefined();
      expect(ec2Module.backendAsg.name).toBe('tap-infrastructure-dev-BackendASG');
    });

    test("should create Application Load Balancer", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = Ec2Module.mock.results[0].value;
      
      expect(ec2Module.alb).toBeDefined();
      expect(ec2Module.alb.dnsName).toContain('tap-infrastructure-dev-alb');
      expect(ec2Module.alb.zoneId).toBe('Z35SXDOTRQ7X7K');
    });

    test("should create security groups for web and backend", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = Ec2Module.mock.results[0].value;
      
      expect(ec2Module.webSecurityGroup).toBeDefined();
      expect(ec2Module.webSecurityGroup.name).toBe('tap-infrastructure-dev-WebSG');
      
      expect(ec2Module.backendSecurityGroup).toBeDefined();
      expect(ec2Module.backendSecurityGroup.name).toBe('tap-infrastructure-dev-BackendSG');
    });
  });

  describe("RDS Module Tests", () => {
    test("should create RDS instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          vpc: vpcModule,
          instanceClass: 'db.t3.medium',
          engine: 'mysql',
          allocatedStorage: 20,
          databaseName: 'appdb',
          masterUsername: 'admin',
          multiAz: false,
          backupRetentionPeriod: 7,
          tags: expect.objectContaining({
            Project: 'tap-infrastructure',
            Environment: 'dev'
          })
        })
      );
    });

    test("should enable Multi-AZ for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].multiAz).toBe(true);
      expect(rdsCall[2].backupRetentionPeriod).toBe(30);
    });

    test("should create database security group and subnet group", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsModule = RdsModule.mock.results[0].value;
      
      expect(rdsModule.dbSecurityGroup).toBeDefined();
      expect(rdsModule.dbSecurityGroup.name).toBe('tap-infrastructure-dev-DBSG');
      
      expect(rdsModule.dbSubnetGroup).toBeDefined();
      expect(rdsModule.dbSubnetGroup.name).toBe('tap-infrastructure-dev-dbsubnet');
    });

    test("should manage database password with Secrets Manager", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsModule = RdsModule.mock.results[0].value;
      
      expect(rdsModule.dbSecret).toBeDefined();
      expect(rdsModule.dbInstance.masterUserSecret.get).toBeDefined();
      
      const secretArn = rdsModule.dbInstance.masterUserSecret.get(0).secretArn;
      expect(secretArn).toContain('secret:tap-infrastructure-dev-DBSecret');
    });
  });

  describe("S3 Module Tests", () => {
    test("should create public S3 bucket for app assets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-public',
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          bucketName: 'tap-infrastructure-dev-public-assets',
          versioning: true,
          encryption: true,
          publicReadAccess: true,
          tags: expect.objectContaining({
            Project: 'tap-infrastructure',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create private S3 bucket for internal data", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        's3-private',
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          bucketName: 'tap-infrastructure-dev-private-data',
          versioning: true,
          encryption: true,
          publicReadAccess: false,
          tags: expect.objectContaining({
            Project: 'tap-infrastructure',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create bucket policy for public bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const publicS3Module = S3Module.mock.results[0].value;
      expect(publicS3Module.bucketPolicy).toBeDefined();
      
      const privateS3Module = S3Module.mock.results[1].value;
      expect(privateS3Module.bucketPolicy).toBeUndefined();
    });
  });

  describe("Route53 Module Tests", () => {
    test("should create Route53 hosted zone with domain", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = Ec2Module.mock.results[0].value;

      expect(Route53Module).toHaveBeenCalledWith(
        expect.anything(),
        'route53',
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          domainName: 'dev.yourdomain.com',
          albDnsName: ec2Module.alb.dnsName,
          albZoneId: ec2Module.alb.zoneId,
          tags: expect.objectContaining({
            Project: 'tap-infrastructure',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create A record and CNAME record for ALB", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const route53Module = Route53Module.mock.results[0].value;
      
      expect(route53Module.records).toHaveLength(2);
      expect(route53Module.records[0].type).toBe('A');
      expect(route53Module.records[1].type).toBe('CNAME');
    });

    test("should handle custom domain name", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        domainName: 'app.example.com'
      });

      const route53Call = Route53Module.mock.calls[0];
      expect(route53Call[2].domainName).toBe('app.example.com');
    });
  });

  describe("Monitoring Module Tests", () => {
    test("should create monitoring module with SNS topic", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = Ec2Module.mock.results[0].value;
      const rdsModule = RdsModule.mock.results[0].value;

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          emailEndpoint: 'alerts@yourdomain.com',
          ec2Module: ec2Module,
          rdsModule: rdsModule,
          tags: expect.objectContaining({
            Project: 'tap-infrastructure',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create CloudWatch alarms for EC2 and RDS", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const monitoringModule = MonitoringModule.mock.results[0].value;
      
      expect(monitoringModule.alarms).toHaveLength(4);
      
      const alarmNames = monitoringModule.alarms.map((a: any) => a.alarmName);
      expect(alarmNames).toContain('tap-infrastructure-dev-Web-HighCPU');
      expect(alarmNames).toContain('tap-infrastructure-dev-ALB-UnhealthyTargets');
      expect(alarmNames).toContain('tap-infrastructure-dev-DB-HighCPU');
      expect(alarmNames).toContain('tap-infrastructure-dev-DB-LowStorage');
    });

    test("should configure email subscription for alerts", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        alertEmail: 'custom-alerts@example.com'
      });

      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].emailEndpoint).toBe('custom-alerts@example.com');
    });
  });

  describe("SSM Parameter Store Module Tests", () => {
    test("should create SSM parameters for application configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SsmModule).toHaveBeenCalledWith(
        expect.anything(),
        'ssm',
        expect.objectContaining({
          projectName: 'tap-infrastructure',
          environment: 'dev',
          region: 'us-east-1',
          parameters: [
            {
              name: 'api/endpoint',
              value: 'https://dev.yourdomain.com/api',
              type: 'String',
              description: 'API endpoint URL'
            },
            {
              name: 'app/version',
              value: '1.0.0',
              type: 'String',
              description: 'Application version'
            },
            {
              name: 'features/enabled',
              value: 'true',
              type: 'String',
              description: 'Feature flags'
            }
          ],
          tags: expect.objectContaining({
            Project: 'tap-infrastructure',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create parameters with correct naming convention", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ssmModule = SsmModule.mock.results[0].value;
      
      expect(ssmModule.parameters).toHaveLength(3);
      expect(ssmModule.parameters[0].name).toBe('/tap-infrastructure/dev/api/endpoint');
      expect(ssmModule.parameters[1].name).toBe('/tap-infrastructure/dev/app/version');
      expect(ssmModule.parameters[2].name).toBe('/tap-infrastructure/dev/features/enabled');
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
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('alb-dns-name');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('public-s3-bucket-name');
      expect(outputIds).toContain('private-s3-bucket-name');
      expect(outputIds).toContain('monitoring-sns-topic-arn');
      expect(outputIds).toContain('route53-zone-id');
      expect(outputIds).toContain('ssm-parameters');
    });

    test("should output VPC and subnet information", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      expect(vpcOutput[2].value).toBe('vpc-tap-infrastructure-dev');

      const publicSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );
      expect(publicSubnetsOutput[2].value).toHaveLength(2);
    });

    test("should output ALB DNS name", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const albOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );
      expect(albOutput[2].value).toContain('tap-infrastructure-dev-alb');
      expect(albOutput[2].description).toBe('Application Load Balancer DNS name');
    });

    test("should output S3 bucket names", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const publicBucketOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-s3-bucket-name'
      );
      expect(publicBucketOutput[2].value).toContain('tap-infrastructure-dev');

      const privateBucketOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-s3-bucket-name'
      );
      expect(privateBucketOutput[2].value).toContain('tap-infrastructure-dev');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC module to EC2 and RDS modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      
      const ec2Call = Ec2Module.mock.calls[0];
      expect(ec2Call[2].vpc).toBe(vpcModule);

      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].vpc).toBe(vpcModule);
    });

    test("should pass EC2 and RDS modules to Monitoring module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = Ec2Module.mock.results[0].value;
      const rdsModule = RdsModule.mock.results[0].value;
      
      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].ec2Module).toBe(ec2Module);
      expect(monitoringCall[2].rdsModule).toBe(rdsModule);
    });

    test("should pass ALB details to Route53 module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const ec2Module = Ec2Module.mock.results[0].value;
      
      const route53Call = Route53Module.mock.calls[0];
      expect(route53Call[2].albDnsName).toBe(ec2Module.alb.dnsName);
      expect(route53Call[2].albZoneId).toBe(ec2Module.alb.zoneId);
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const vpcCallIndex = VpcModule.mock.invocationCallOrder[0];
      const ec2CallIndex = Ec2Module.mock.invocationCallOrder[0];
      const rdsCallIndex = RdsModule.mock.invocationCallOrder[0];
      const monitoringCallIndex = MonitoringModule.mock.invocationCallOrder[0];
      
      expect(vpcCallIndex).toBeLessThan(ec2CallIndex);
      expect(vpcCallIndex).toBeLessThan(rdsCallIndex);
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

      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].multiAz).toBe(false);
      expect(rdsCall[2].backupRetentionPeriod).toBe(7);

      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].environment).toBe('dev');
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].multiAz).toBe(true);
      expect(rdsCall[2].backupRetentionPeriod).toBe(30);

      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].environment).toBe('prod');
    });

    test("should update SSM parameter values based on environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging',
        domainName: 'staging.example.com'
      });

      const ssmCall = SsmModule.mock.calls[0];
      const apiEndpointParam = ssmCall[2].parameters.find(
        (p: any) => p.name === 'api/endpoint'
      );
      expect(apiEndpointParam.value).toBe('https://staging.example.com/api');
    });
  });

  describe("Tag Propagation", () => {
    test("should propagate common tags to all modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const expectedTags = {
        Project: 'tap-infrastructure',
        Environment: 'dev',
        ManagedBy: 'CDKTF',
        Owner: 'DevOps'
      };

      const moduleCallChecks = [
        VpcModule,
        Ec2Module,
        RdsModule,
        S3Module,
        MonitoringModule,
        Route53Module,
        SsmModule
      ];

      moduleCallChecks.forEach(Module => {
        const call = Module.mock.calls[0];
        expect(call[2].tags).toMatchObject(expectedTags);
      });
    });

    test("should merge custom tags with common tags", () => {
      const app = new App();
      const customDefaultTags = {
        tags: {
          CostCenter: 'Engineering',
          Team: 'Platform'
        }
      };

      new TapStack(app, "TestStack", {
        defaultTags: customDefaultTags
      });

      // Common tags should still be applied to modules
      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].tags).toMatchObject({
        Project: 'tap-infrastructure',
        Environment: 'dev',
        ManagedBy: 'CDKTF',
        Owner: 'DevOps'
      });
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
          domainName: 'dev.yourdomain.com'
        })
      );

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring',
        expect.objectContaining({
          emailEndpoint: 'alerts@yourdomain.com'
        })
      );
    });

    test("should handle empty string environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: ''
      });

    });
  });

  describe("Complete Infrastructure Stack", () => {
    test("should create all infrastructure components", () => {
      const app = new App();
      const stack = new TapStack(app, "CompleteStackTest");

      expect(stack).toBeDefined();

      // Verify all modules are created
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(Ec2Module).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(2); // Public and Private
      expect(MonitoringModule).toHaveBeenCalledTimes(1);
      expect(Route53Module).toHaveBeenCalledTimes(1);
      expect(SsmModule).toHaveBeenCalledTimes(1);

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
      const vpcModule = VpcModule.mock.results[0].value;
      const ec2Module = Ec2Module.mock.results[0].value;
      const rdsModule = RdsModule.mock.results[0].value;

      // Verify EC2 module received VPC module
      const ec2Call = Ec2Module.mock.calls[0];
      expect(ec2Call[2].vpc).toBe(vpcModule);

      // Verify RDS module received VPC module
      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].vpc).toBe(vpcModule);

      // Verify Monitoring module received EC2 and RDS modules
      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].ec2Module).toBe(ec2Module);
      expect(monitoringCall[2].rdsModule).toBe(rdsModule);

      // Verify Route53 module received ALB details
      const route53Call = Route53Module.mock.calls[0];
      expect(route53Call[2].albDnsName).toBe(ec2Module.alb.dnsName);
      expect(route53Call[2].albZoneId).toBe(ec2Module.alb.zoneId);
    });
  });
});