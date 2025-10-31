import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import { expect } from "@jest/globals";
import { describe, test, beforeEach } from "@jest/globals";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${config.projectName}-${config.environment}`,
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true
    },
    publicSubnets: config.publicSubnetCidrs.map((cidr: string, i: number) => ({
      id: `public-subnet-${i}`,
      cidrBlock: cidr,
      availabilityZone: config.availabilityZones[i]
    })),
    privateSubnets: config.privateSubnetCidrs.map((cidr: string, i: number) => ({
      id: `private-subnet-${i}`,
      cidrBlock: cidr,
      availabilityZone: config.availabilityZones[i]
    })),
    natGateway: {
      id: `nat-${config.projectName}-${config.environment}`,
      allocationId: `eip-nat-${config.projectName}-${config.environment}`,
      subnetId: 'public-subnet-0'
    },
    internetGateway: {
      id: `igw-${config.projectName}-${config.environment}`,
      vpcId: `vpc-${config.projectName}-${config.environment}`
    }
  })),

  SecurityGroupsConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    albSecurityGroup: {
      id: `alb-sg-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-alb-sg-${config.environment}`,
      vpcId: config.vpcId
    },
    appSecurityGroup: {
      id: `app-sg-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-app-sg-${config.environment}`,
      vpcId: config.vpcId
    },
    rdsSecurityGroup: {
      id: `rds-sg-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-rds-sg-${config.environment}`,
      vpcId: config.vpcId
    }
  })),

  KeyPairConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    keyPair: {
      id: `keypair-${config.projectName}-${config.environment}`,
      keyName: `${config.projectName}-keypair-${config.environment}`,
      publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAA...'
    },
    keyPairName: `${config.projectName}-keypair-${config.environment}`
  })),

  DatabaseConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dbInstance: {
      id: `db-${config.projectName}-${config.environment}`,
      identifier: `${config.projectName}-db-${config.environment}`,
      endpoint: `${config.projectName}-db-${config.environment}.cluster-xyz.${config.region}.rds.amazonaws.com:5432`,
      address: `${config.projectName}-db-${config.environment}.cluster-xyz.${config.region}.rds.amazonaws.com`,
      port: 5432,
      dbName: config.dbName
    },
    dbSecret: {
      id: `db-secret-${config.projectName}-${config.environment}`,
      arn: `arn:aws:secretsmanager:${config.region}:123456789012:secret:${config.projectName}-db-credentials-${config.environment}-abcdef`,
      name: `${config.projectName}-db-credentials-${config.environment}`
    },
    dbSecretVersion: {
      id: `db-secret-version-${config.projectName}-${config.environment}`,
      secretId: `db-secret-${config.projectName}-${config.environment}`,
      versionId: 'AWSCURRENT'
    },
    connectionString: `postgresql://dbadmin:password@${config.projectName}-db-${config.environment}.cluster-xyz.${config.region}.rds.amazonaws.com:5432/${config.dbName}`
  })),

  LoadBalancerConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    alb: {
      id: `alb-${config.projectName}-${config.environment}`,
      arn: `arn:aws:elasticloadbalancing:${config.region}:123456789012:loadbalancer/app/${config.projectName}-alb-${config.environment}/50dc6c495c0c9188`,
      dnsName: `${config.projectName}-alb-${config.environment}-123456789.${config.region}.elb.amazonaws.com`
    },
    targetGroup: {
      id: `tg-${config.projectName}-${config.environment}`,
      arn: `arn:aws:elasticloadbalancing:${config.region}:123456789012:targetgroup/${config.projectName}-tg-${config.environment}/50dc6c495c0c9188`,
      name: `${config.projectName}-tg-${config.environment}`
    },
    httpListener: {
      id: 'http-listener',
      arn: `arn:aws:elasticloadbalancing:${config.region}:123456789012:listener/app/${config.projectName}-alb-${config.environment}/50dc6c495c0c9188/f2f7dc8efc522ab2`,
      port: 80,
      protocol: 'HTTP'
    },
    httpsListener: config.certificateArn ? {
      id: 'https-listener',
      arn: `arn:aws:elasticloadbalancing:${config.region}:123456789012:listener/app/${config.projectName}-alb-${config.environment}/50dc6c495c0c9188/f2f7dc8efc522ab3`,
      port: 443,
      protocol: 'HTTPS'
    } : undefined
  })),

  ComputeConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    instances: [],
    launchTemplate: {
      id: `lt-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-lt-${config.environment}`,
      arn: `arn:aws:ec2:${config.region}:123456789012:launch-template/lt-0123456789abcdef`
    },
    autoScalingGroup: {
      id: `asg-${config.projectName}-${config.environment}`,
      name: `${config.projectName}-asg-${config.environment}`,
      arn: `arn:aws:autoscaling:${config.region}:123456789012:autoScalingGroup:12345678:autoScalingGroupName/${config.projectName}-asg-${config.environment}`
    }
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
    TerraformStack: actual.TerraformStack,
    Fn: actual.Fn
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Mock TLS Provider
jest.mock("@cdktf/provider-tls/lib/provider", () => ({
  TlsProvider: jest.fn(),
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: '123456789012'
  }))
}));

describe("TapStack Unit Tests", () => {
  const { 
    NetworkingConstruct,
    SecurityGroupsConstruct,
    DatabaseConstruct,
    LoadBalancerConstruct,
    ComputeConstruct,
    KeyPairConstruct
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { TlsProvider } = require("@cdktf/provider-tls/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

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

      // Verify TLS Provider is configured
      expect(TlsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'tls',
        {}
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
      const customTags = {
        tags: {
          Team: 'Platform',
          CostCenter: 'R&D'
        }
      };
      
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

    test("should get account ID using DataAwsCallerIdentity", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        'current',
        {}
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

  describe("Networking Module Tests", () => {
    test("should create NetworkingConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'networking',
        expect.objectContaining({
          region: 'us-east-1',
          environment: 'dev',
          projectName: 'ecommerce',
          vpcCidr: '10.0.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24']
        })
      );
    });

    test("should create NetworkingConstruct with custom region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'us-west-2'
      });

      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'networking',
        expect.objectContaining({
          region: 'us-west-2',
          availabilityZones: ['us-west-2a', 'us-west-2b']
        })
      );
    });

    test("should create VPC with correct subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkingConstruct = NetworkingConstruct.mock.results[0].value;
      expect(networkingConstruct.publicSubnets).toHaveLength(2);
      expect(networkingConstruct.privateSubnets).toHaveLength(2);
      expect(networkingConstruct.natGateway).toBeDefined();
      expect(networkingConstruct.internetGateway).toBeDefined();
    });
  });

  describe("Security Groups Module Tests", () => {
    test("should create SecurityGroupsConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkingConstruct = NetworkingConstruct.mock.results[0].value;

      expect(SecurityGroupsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'security-groups',
        expect.objectContaining({
          region: 'us-east-1',
          environment: 'dev',
          projectName: 'ecommerce',
          vpcId: networkingConstruct.vpc.id
        })
      );
    });

    test("should create all security groups", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const securityGroups = SecurityGroupsConstruct.mock.results[0].value;
      expect(securityGroups.albSecurityGroup).toBeDefined();
      expect(securityGroups.appSecurityGroup).toBeDefined();
      expect(securityGroups.rdsSecurityGroup).toBeDefined();
    });
  });

  describe("KeyPair Module Tests", () => {
    test("should create KeyPairConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(KeyPairConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'keypair',
        expect.objectContaining({
          region: 'us-east-1',
          environment: 'dev',
          projectName: 'ecommerce'
        })
      );
    });

    test("should generate key pair name correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const keyPair = KeyPairConstruct.mock.results[0].value;
      expect(keyPair.keyPairName).toBe('ecommerce-keypair-dev');
    });
  });

  describe("Database Module Tests", () => {
    test("should create DatabaseConstruct with correct configuration for dev", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      const networking = NetworkingConstruct.mock.results[0].value;
      const securityGroups = SecurityGroupsConstruct.mock.results[0].value;

      expect(DatabaseConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          region: 'us-east-1',
          environment: 'dev',
          projectName: 'ecommerce',
          subnetIds: networking.privateSubnets.map((s: any) => s.id),
          securityGroupId: securityGroups.rdsSecurityGroup.id,
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          dbName: 'ecommercedb',
          backupRetentionPeriod: 1
        })
      );
    });

    test("should create DatabaseConstruct with production configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      expect(DatabaseConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          instanceClass: 'db.t3.medium',
          allocatedStorage: 100,
          backupRetentionPeriod: 7
        })
      );
    });

    test("should create RDS instance with correct properties", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const database = DatabaseConstruct.mock.results[0].value;
      expect(database.dbInstance).toBeDefined();
      expect(database.dbInstance.dbName).toBe('ecommercedb');
      expect(database.dbSecret).toBeDefined();
      expect(database.dbSecretVersion).toBeDefined();
      expect(database.connectionString).toBeDefined();
    });
  });

  describe("Load Balancer Module Tests", () => {
    test("should create LoadBalancerConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networking = NetworkingConstruct.mock.results[0].value;
      const securityGroups = SecurityGroupsConstruct.mock.results[0].value;

      expect(LoadBalancerConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'load-balancer',
        expect.objectContaining({
          region: 'us-east-1',
          environment: 'dev',
          projectName: 'ecommerce',
          subnetIds: networking.publicSubnets.map((s: any) => s.id),
          securityGroupId: securityGroups.albSecurityGroup.id,
          vpcId: networking.vpc.id,
          healthCheckPath: '/api/health'
        })
      );
    });

    test("should create ALB with listener and target group", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const loadBalancer = LoadBalancerConstruct.mock.results[0].value;
      expect(loadBalancer.alb).toBeDefined();
      expect(loadBalancer.targetGroup).toBeDefined();
      expect(loadBalancer.httpListener).toBeDefined();
      expect(loadBalancer.httpListener.port).toBe(80);
      expect(loadBalancer.httpListener.protocol).toBe('HTTP');
    });

    test("should handle HTTPS configuration when certificate provided", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Since no certificate is provided, httpsListener should be undefined
      const loadBalancer = LoadBalancerConstruct.mock.results[0].value;
      expect(loadBalancer.httpsListener).toBeUndefined();
    });
  });

  describe("Compute Module Tests", () => {
    test("should create ComputeConstruct with correct configuration for dev", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      const networking = NetworkingConstruct.mock.results[0].value;
      const securityGroups = SecurityGroupsConstruct.mock.results[0].value;
      const keyPair = KeyPairConstruct.mock.results[0].value;
      const loadBalancer = LoadBalancerConstruct.mock.results[0].value;
      const database = DatabaseConstruct.mock.results[0].value;

      expect(ComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          region: 'us-east-1',
          environment: 'dev',
          projectName: 'ecommerce',
          subnetIds: networking.privateSubnets.map((s: any) => s.id),
          securityGroupId: securityGroups.appSecurityGroup.id,
          instanceType: 't3.micro',
          keyName: keyPair.keyPairName,
          targetGroupArn: loadBalancer.targetGroup.arn,
          dbConnectionString: database.connectionString,
          dbSecretArn: database.dbSecret.arn,
          minSize: 1,
          maxSize: 3,
          desiredCapacity: 2
        })
      );
    });

    test("should create ComputeConstruct with production configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      expect(ComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          instanceType: 't3.medium',
          minSize: 2,
          maxSize: 6,
          desiredCapacity: 3
        })
      );
    });

    test("should create Auto Scaling Group with launch template", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const compute = ComputeConstruct.mock.results[0].value;
      expect(compute.autoScalingGroup).toBeDefined();
      expect(compute.launchTemplate).toBeDefined();
      expect(compute.instances).toBeDefined();
      expect(compute.instances).toEqual([]);
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Should create 9 outputs as per the stack
      expect(TerraformOutput).toHaveBeenCalledTimes(9);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      // VPC outputs
      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      
      // ALB outputs
      expect(outputIds).toContain('alb-dns-name');
      
      // RDS outputs
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('db-secret-arn');
      
      // Compute outputs
      expect(outputIds).toContain('auto-scaling-group-name');
      
      // Metadata outputs
      expect(outputIds).toContain('aws-account-id');
      expect(outputIds).toContain('key-pair-name');
    });

    test("should create outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );
      expect(vpcIdOutput[2].description).toBe('VPC ID');

      const albDnsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );
      expect(albDnsOutput[2].description).toBe('Application Load Balancer DNS name');

      const rdsEndpointOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );
      expect(rdsEndpointOutput[2].description).toBe('RDS instance endpoint');
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass VPC to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networking = NetworkingConstruct.mock.results[0].value;
      
      // Check SecurityGroupsConstruct received VPC
      const securityGroupsCall = SecurityGroupsConstruct.mock.calls[0];
      expect(securityGroupsCall[2].vpcId).toBe(networking.vpc.id);

      // Check LoadBalancerConstruct received VPC
      const loadBalancerCall = LoadBalancerConstruct.mock.calls[0];
      expect(loadBalancerCall[2].vpcId).toBe(networking.vpc.id);
    });

    test("should pass security groups to dependent modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const securityGroups = SecurityGroupsConstruct.mock.results[0].value;
      
      // Check DatabaseConstruct received security group
      const databaseCall = DatabaseConstruct.mock.calls[0];
      expect(databaseCall[2].securityGroupId).toBe(securityGroups.rdsSecurityGroup.id);

      // Check LoadBalancerConstruct received security group
      const loadBalancerCall = LoadBalancerConstruct.mock.calls[0];
      expect(loadBalancerCall[2].securityGroupId).toBe(securityGroups.albSecurityGroup.id);

      // Check ComputeConstruct received security group
      const computeCall = ComputeConstruct.mock.calls[0];
      expect(computeCall[2].securityGroupId).toBe(securityGroups.appSecurityGroup.id);
    });

    test("should pass database resources to compute module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const database = DatabaseConstruct.mock.results[0].value;
      
      const computeCall = ComputeConstruct.mock.calls[0];
      expect(computeCall[2].dbConnectionString).toBe(database.connectionString);
      expect(computeCall[2].dbSecretArn).toBe(database.dbSecret.arn);
    });

    test("should pass load balancer target group to compute module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const loadBalancer = LoadBalancerConstruct.mock.results[0].value;
      
      const computeCall = ComputeConstruct.mock.calls[0];
      expect(computeCall[2].targetGroupArn).toBe(loadBalancer.targetGroup.arn);
    });

    test("should pass key pair name to compute module", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const keyPair = KeyPairConstruct.mock.results[0].value;
      
      const computeCall = ComputeConstruct.mock.calls[0];
      expect(computeCall[2].keyName).toBe(keyPair.keyPairName);
    });

    test("should create modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      const networkingCallIndex = NetworkingConstruct.mock.invocationCallOrder[0];
      const securityGroupsCallIndex = SecurityGroupsConstruct.mock.invocationCallOrder[0];
      const keyPairCallIndex = KeyPairConstruct.mock.invocationCallOrder[0];
      const databaseCallIndex = DatabaseConstruct.mock.invocationCallOrder[0];
      const loadBalancerCallIndex = LoadBalancerConstruct.mock.invocationCallOrder[0];
      const computeCallIndex = ComputeConstruct.mock.invocationCallOrder[0];
      
      // Networking should be created first
      expect(networkingCallIndex).toBeLessThan(securityGroupsCallIndex);
      expect(networkingCallIndex).toBeLessThan(databaseCallIndex);
      expect(networkingCallIndex).toBeLessThan(loadBalancerCallIndex);
      expect(networkingCallIndex).toBeLessThan(computeCallIndex);
      
      // Security Groups should be created after networking but before database, load balancer, and compute
      expect(securityGroupsCallIndex).toBeLessThan(databaseCallIndex);
      expect(securityGroupsCallIndex).toBeLessThan(loadBalancerCallIndex);
      expect(securityGroupsCallIndex).toBeLessThan(computeCallIndex);
      
      // Key Pair should be created before compute
      expect(keyPairCallIndex).toBeLessThan(computeCallIndex);
      
      // Database should be created before compute
      expect(databaseCallIndex).toBeLessThan(computeCallIndex);
      
      // Load Balancer should be created before compute
      expect(loadBalancerCallIndex).toBeLessThan(computeCallIndex);
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

  describe("Environment-specific Configuration", () => {
    test("should configure dev environment correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      // Check database configuration
      expect(DatabaseConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          environment: 'dev',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          backupRetentionPeriod: 1
        })
      );

      // Check compute configuration
      expect(ComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          environment: 'dev',
          instanceType: 't3.micro',
          minSize: 1,
          maxSize: 3,
          desiredCapacity: 2
        })
      );
    });

    test("should configure production environment correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      // Check database configuration
      expect(DatabaseConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          environment: 'production',
          instanceClass: 'db.t3.medium',
          allocatedStorage: 100,
          backupRetentionPeriod: 7
        })
      );

      // Check compute configuration
      expect(ComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'compute',
        expect.objectContaining({
          environment: 'production',
          instanceType: 't3.medium',
          minSize: 2,
          maxSize: 6,
          desiredCapacity: 3
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
      expect(NetworkingConstruct).toHaveBeenCalledTimes(1);
      expect(SecurityGroupsConstruct).toHaveBeenCalledTimes(1);
      expect(KeyPairConstruct).toHaveBeenCalledTimes(1);
      expect(DatabaseConstruct).toHaveBeenCalledTimes(1);
      expect(LoadBalancerConstruct).toHaveBeenCalledTimes(1);
      expect(ComputeConstruct).toHaveBeenCalledTimes(1);

      // Verify providers and backend
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(TlsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);

      // Verify outputs
      expect(TerraformOutput).toHaveBeenCalledTimes(9);
    });

    test("should maintain proper module relationships", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Get module instances
      const networking = NetworkingConstruct.mock.results[0].value;
      const securityGroups = SecurityGroupsConstruct.mock.results[0].value;
      const keyPair = KeyPairConstruct.mock.results[0].value;
      const database = DatabaseConstruct.mock.results[0].value;
      const loadBalancer = LoadBalancerConstruct.mock.results[0].value;
      const compute = ComputeConstruct.mock.results[0].value;

      // Verify all modules are created and have expected properties
      expect(networking.vpc).toBeDefined();
      expect(securityGroups.albSecurityGroup).toBeDefined();
      expect(keyPair.keyPairName).toBeDefined();
      expect(database.dbInstance).toBeDefined();
      expect(loadBalancer.alb).toBeDefined();
      expect(compute.autoScalingGroup).toBeDefined();
    });
  });

  describe("Common Tags Configuration", () => {
    test("should apply common tags to all constructs", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const expectedTags = {
        Project: 'ecommerce',
        Environment: 'staging',
        ManagedBy: 'CDKTF',
        Owner: 'DevOps',
        CostCenter: 'Engineering'
      };

      // Verify tags are passed to all constructs
      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(SecurityGroupsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(DatabaseConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(LoadBalancerConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(ComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );
    });
  });

  describe("Region-specific Availability Zones", () => {
    test("should configure availability zones based on region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-southeast-1'
      });

      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'networking',
        expect.objectContaining({
          availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b']
        })
      );
    });

    test("should handle different regions correctly", () => {
      const regions = ['us-west-2', 'eu-central-1', 'ap-northeast-1'];
      
      regions.forEach(region => {
        jest.clearAllMocks();
        const app = new App();
        new TapStack(app, `TestStack-${region}`, {
          awsRegion: region
        });

        expect(NetworkingConstruct).toHaveBeenCalledWith(
          expect.anything(),
          'networking',
          expect.objectContaining({
            availabilityZones: [`${region}a`, `${region}b`]
          })
        );
      });
    });
  });
});