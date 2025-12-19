// Mock Pulumi before importing
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    public type: string;
    public name: string;
    public args: any;
    public opts: any;
    
    constructor(type: string, name: string, args: any, opts?: any) {
      this.type = type;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }
    registerOutputs(outputs: any) {
      Object.assign(this, outputs);
    }
  },
  all: jest.fn().mockImplementation(values => ({
    apply: jest.fn().mockImplementation(fn => {
      const result = fn(values);
      return {
        apply: jest.fn().mockImplementation(fn2 => fn2(result))
      };
    })
  })),
  Output: jest.fn().mockImplementation(value => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
  })),
  Config: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockReturnValue(undefined),
    getNumber: jest.fn().mockReturnValue(undefined),
    getObject: jest.fn().mockReturnValue(undefined),
  })),
  interpolate: jest.fn((template: string) => template),
  output: jest.fn().mockImplementation(value => ({
    apply: jest.fn().mockImplementation(fn => fn(value))
  })),
}));

// Mock AWS provider
jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation(() => ({ id: 'mock-provider-id' })),
  getCallerIdentity: jest.fn().mockResolvedValue({ accountId: '123456789012' }),
  getAvailabilityZones: jest.fn().mockResolvedValue({
    names: ['ap-south-1a', 'ap-south-1b', 'ap-south-1c'],
    state: 'available',
  }),
  ec2: {
    Vpc: jest.fn().mockImplementation(() => ({ id: 'vpc-12345' })),
    InternetGateway: jest.fn().mockImplementation(() => ({ id: 'igw-12345' })),
    Subnet: jest.fn().mockImplementation(() => ({ id: 'subnet-12345' })),
    RouteTable: jest.fn().mockImplementation(() => ({ id: 'rt-12345' })),
    RouteTableAssociation: jest.fn(),
    NatGateway: jest.fn().mockImplementation(() => ({ id: 'nat-12345' })),
    Eip: jest.fn().mockImplementation(() => ({ id: 'eip-12345' })),
    SecurityGroup: jest.fn().mockImplementation(() => ({ id: 'sg-12345' })),
    SecurityGroupRule: jest.fn(),
    LaunchTemplate: jest.fn().mockImplementation(() => ({ id: 'lt-12345' })),
    FlowLog: jest.fn(),
    getAmi: jest.fn().mockResolvedValue({
      id: 'ami-12345678',
      name: 'amzn2-ami-hvm-2.0.20231218.0-x86_64-gp2',
    }),
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({ 
      id: 'role-12345',
      name: 'mock-role',
      arn: 'arn:aws:iam::123456789012:role/mock-role'
    })),
    RolePolicy: jest.fn(),
    RolePolicyAttachment: jest.fn(),
    InstanceProfile: jest.fn().mockImplementation(() => ({ name: 'mock-profile' })),
    Policy: jest.fn().mockImplementation(() => ({ arn: 'arn:aws:iam::123456789012:policy/mock-policy' })),
  },
  kms: {
    Key: jest.fn().mockImplementation(() => ({ 
      id: 'key-12345',
      arn: 'arn:aws:kms:ap-south-1:123456789012:key/12345'
    })),
  },
  rds: {
    SubnetGroup: jest.fn().mockImplementation(() => ({ name: 'mock-subnet-group' })),
    Instance: jest.fn().mockImplementation(() => ({ 
      id: 'db-12345',
      endpoint: 'mock-db.ap-south-1.rds.amazonaws.com'
    })),
  },
  lb: {
    LoadBalancer: jest.fn().mockImplementation(() => ({ 
      id: 'alb-12345',
      arn: 'arn:aws:elasticloadbalancing:ap-south-1:123456789012:loadbalancer/app/mock-alb/12345',
      dnsName: 'mock-alb-12345.ap-south-1.elb.amazonaws.com'
    })),
    TargetGroup: jest.fn().mockImplementation(() => ({ 
      id: 'tg-12345',
      arn: 'arn:aws:elasticloadbalancing:ap-south-1:123456789012:targetgroup/mock-tg/12345',
      arnSuffix: 'targetgroup/mock-tg/12345'
    })),
    Listener: jest.fn().mockImplementation(() => ({ arn: 'arn:aws:elasticloadbalancing:ap-south-1:123456789012:listener/app/mock-alb/12345/12345' })),
    ListenerRule: jest.fn(),
  },
  autoscaling: {
    Group: jest.fn().mockImplementation(() => ({ name: 'mock-asg' })),
    Policy: jest.fn().mockImplementation(() => ({ arn: 'arn:aws:autoscaling:ap-south-1:123456789012:scalingPolicy:12345' })),
  },
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({ 
      id: 'mock-bucket',
      bucket: {
        apply: jest.fn().mockImplementation(fn => fn('mock-bucket-name'))
      }
    })),
    BucketVersioning: jest.fn(),
    BucketPublicAccessBlock: jest.fn(),
    BucketServerSideEncryptionConfiguration: jest.fn(),
    BucketLifecycleConfiguration: jest.fn(),
    BucketPolicy: jest.fn(),
  },
  secretsmanager: {
    Secret: jest.fn().mockImplementation(() => ({
      id: 'secret-12345',
      arn: 'arn:aws:secretsmanager:ap-south-1:123456789012:secret:mock-secret'
    })),
    SecretVersion: jest.fn(),
  },
  cloudwatch: {
    LogGroup: jest.fn().mockImplementation(() => ({ 
      arn: {
        apply: jest.fn().mockImplementation(fn => fn('arn:aws:logs:ap-south-1:123456789012:log-group:/aws/mock-log-group'))
      }
    })),
    MetricAlarm: jest.fn(),
  },
  cloudfront: {
    Distribution: jest.fn().mockImplementation(() => ({ 
      id: 'dist-12345',
      domainName: 'mock-dist.cloudfront.net'
    })),
  },
  wafv2: {
    WebAcl: jest.fn().mockImplementation(() => ({ 
      id: 'waf-12345',
      arn: 'arn:aws:wafv2:us-east-1:123456789012:global/webacl/mock-waf/12345'
    })),
  },
}));

// Mock random provider
jest.mock('@pulumi/random', () => ({
  RandomPassword: jest.fn().mockImplementation(() => ({ result: 'mock-password' })),
  RandomString: jest.fn().mockImplementation(() => ({ result: 'mock-secret' })),
}));

import { ScalableWebAppInfrastructure } from '../lib/scalable-web-app-infrastructure';

describe('ScalableWebAppInfrastructure Unit Tests', () => {
  let infrastructure: ScalableWebAppInfrastructure;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor Variations', () => {
    it('should instantiate successfully with minimal props', () => {
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test',
      });
      
      expect(infrastructure).toBeDefined();
      expect(infrastructure).toBeInstanceOf(ScalableWebAppInfrastructure);
    });

    it('should instantiate successfully with full props', () => {
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Project: 'tap-test',
          Owner: 'DevOps Team'
        }
      });
      
      expect(infrastructure).toBeDefined();
      expect(infrastructure).toBeInstanceOf(ScalableWebAppInfrastructure);
    });

    it('should handle different environment suffixes', () => {
      const environments = ['dev', 'staging', 'prod', 'test', 'demo'];
      
      environments.forEach(env => {
        const infra = new ScalableWebAppInfrastructure(`test-infra-${env}`, {
          environmentSuffix: env
        });
        expect(infra).toBeDefined();
      });
    });

    it('should handle custom tags', () => {
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test',
        tags: {
          Owner: 'DevOps Team',
          CostCenter: '12345',
          Project: 'TAP',
          Environment: 'test'
        }
      });
      
      expect(infrastructure).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined tags gracefully', () => {
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test',
        tags: undefined
      });
      
      expect(infrastructure).toBeDefined();
    });

    it('should handle empty tags object', () => {
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test',
        tags: {}
      });
      
      expect(infrastructure).toBeDefined();
    });

    it('should handle null values gracefully', () => {
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test',
        tags: null as any
      });
      
      expect(infrastructure).toBeDefined();
    });

    it('should handle special characters in environment suffix', () => {
      const specialEnvs = ['test-123', 'dev_v2', 'prod.1'];
      
      specialEnvs.forEach(env => {
        const infra = new ScalableWebAppInfrastructure(`test-infra-${env}`, {
          environmentSuffix: env
        });
        expect(infra).toBeDefined();
      });
    });
  });

  describe('AWS Provider Configuration', () => {
    it('should create AWS provider with correct region', () => {
      const { Provider } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(Provider).toHaveBeenCalledWith(
        'aws-provider-test',
        { region: 'ap-south-1' },
        expect.any(Object)
      );
    });

    it('should create us-east-1 provider for CloudFront WAF', () => {
      const { Provider } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(Provider).toHaveBeenCalledWith(
        'aws-provider-us-east-1-test',
        { region: 'us-east-1' },
        expect.any(Object)
      );
    });
  });

  describe('Security Components', () => {
    it('should create KMS keys with proper configuration', () => {
      const { kms } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      // Should create Secrets Manager KMS key
      expect(kms.Key).toHaveBeenCalledWith(
        'secrets-kms-key-test',
        expect.objectContaining({
          description: 'KMS key for Secrets Manager - test',
          deletionWindowInDays: 30,
          tags: expect.objectContaining({
            Name: 'secrets-kms-key-test',
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );

      // Should create RDS KMS key
      expect(kms.Key).toHaveBeenCalledWith(
        'rds-kms-key-test',
        expect.objectContaining({
          description: 'KMS key for RDS encryption - test',
          deletionWindowInDays: 30,
          tags: expect.objectContaining({
            Name: 'rds-kms-key-test',
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create security groups with proper rules', () => {
      const { ec2 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      // ALB Security Group
      expect(ec2.SecurityGroup).toHaveBeenCalledWith(
        'alb-sg-test',
        expect.objectContaining({
          name: 'alb-security-group-test',
          description: 'Security group for Application Load Balancer',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              description: 'HTTP from anywhere (CloudFront validated by header)',
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0']
            })
          ])
        }),
        expect.any(Object)
      );

      // EC2 Security Group
      expect(ec2.SecurityGroup).toHaveBeenCalledWith(
        'ec2-sg-test',
        expect.objectContaining({
          name: 'ec2-security-group-test',
          description: 'Security group for EC2 instances',
          egress: expect.arrayContaining([
            expect.objectContaining({
              description: 'HTTPS for updates and SSM',
              fromPort: 443,
              toPort: 443,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0']
            }),
            expect.objectContaining({
              description: 'HTTP for updates',
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0']
            })
          ])
        }),
        expect.any(Object)
      );

      // RDS Security Group
      expect(ec2.SecurityGroup).toHaveBeenCalledWith(
        'rds-sg-test',
        expect.objectContaining({
          name: 'rds-security-group-test',
          description: 'Security group for RDS database',
          egress: []
        }),
        expect.any(Object)
      );
    });

    it('should create security group rules for cross-references', () => {
      const { ec2 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      // ALB egress to EC2
      expect(ec2.SecurityGroupRule).toHaveBeenCalledWith(
        'alb-egress-to-ec2-test',
        expect.objectContaining({
          type: 'egress',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp'
        }),
        expect.any(Object)
      );

      // EC2 egress to RDS
      expect(ec2.SecurityGroupRule).toHaveBeenCalledWith(
        'ec2-egress-to-rds-test',
        expect.objectContaining({
          type: 'egress',
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp'
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC and Networking', () => {
    it('should create VPC with proper configuration', () => {
      const { ec2 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(ec2.Vpc).toHaveBeenCalledWith(
        'main-vpc-test',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: 'main-vpc-test',
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create public and private subnets', () => {
      const { ec2 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      // Public subnets
      expect(ec2.Subnet).toHaveBeenCalledWith(
        'public-subnet-1-test',
        expect.objectContaining({
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Name: 'public-subnet-1-test',
            Type: 'public'
          })
        }),
        expect.any(Object)
      );

      expect(ec2.Subnet).toHaveBeenCalledWith(
        'public-subnet-2-test',
        expect.objectContaining({
          cidrBlock: '10.0.2.0/24',
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Name: 'public-subnet-2-test',
            Type: 'public'
          })
        }),
        expect.any(Object)
      );

      // Private subnets
      expect(ec2.Subnet).toHaveBeenCalledWith(
        'private-subnet-1-test',
        expect.objectContaining({
          cidrBlock: '10.0.10.0/24',
          tags: expect.objectContaining({
            Name: 'private-subnet-1-test',
            Type: 'private'
          })
        }),
        expect.any(Object)
      );

      expect(ec2.Subnet).toHaveBeenCalledWith(
        'private-subnet-2-test',
        expect.objectContaining({
          cidrBlock: '10.0.11.0/24',
          tags: expect.objectContaining({
            Name: 'private-subnet-2-test',
            Type: 'private'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create internet gateway and NAT gateway', () => {
      const { ec2 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(ec2.InternetGateway).toHaveBeenCalledWith(
        'main-igw-test',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'main-igw-test'
          })
        }),
        expect.any(Object)
      );

      expect(ec2.Eip).toHaveBeenCalledWith(
        'nat-eip-test',
        expect.objectContaining({
          domain: 'vpc',
          tags: expect.objectContaining({
            Name: 'nat-eip-test'
          })
        }),
        expect.any(Object)
      );

      expect(ec2.NatGateway).toHaveBeenCalledWith(
        'nat-gateway-test',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'nat-gateway-test'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create route tables and associations', () => {
      const { ec2 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(ec2.RouteTable).toHaveBeenCalledWith(
        'public-rt-test',
        expect.objectContaining({
          routes: expect.arrayContaining([
            expect.objectContaining({
              cidrBlock: '0.0.0.0/0'
            })
          ]),
          tags: expect.objectContaining({
            Name: 'public-rt-test'
          })
        }),
        expect.any(Object)
      );

      expect(ec2.RouteTable).toHaveBeenCalledWith(
        'private-rt-test',
        expect.objectContaining({
          routes: expect.arrayContaining([
            expect.objectContaining({
              cidrBlock: '0.0.0.0/0'
            })
          ]),
          tags: expect.objectContaining({
            Name: 'private-rt-test'
          })
        }),
        expect.any(Object)
      );

      // Route table associations
      expect(ec2.RouteTableAssociation).toHaveBeenCalledTimes(4);
    });
  });

  describe('IAM Resources', () => {
    it('should create EC2 IAM role with proper policies', () => {
      const { iam } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(iam.Role).toHaveBeenCalledWith(
        'ec2-role-test',
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('ec2.amazonaws.com'),
          tags: expect.objectContaining({
            Name: 'ec2-role-test'
          })
        }),
        expect.any(Object)
      );

      expect(iam.Policy).toHaveBeenCalledWith(
        'cloudwatch-logs-policy-test',
        expect.objectContaining({
          description: 'EC2 -> CloudWatch Logs & metrics'
        }),
        expect.any(Object)
      );

      expect(iam.RolePolicyAttachment).toHaveBeenCalledWith(
        'ec2-ssm-policy-attachment-test',
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
        }),
        expect.any(Object)
      );

      expect(iam.InstanceProfile).toHaveBeenCalledWith(
        'ec2-instance-profile-test',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should create VPC Flow Logs IAM role', () => {
      const { iam } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(iam.Role).toHaveBeenCalledWith(
        'vpc-flow-logs-role-test',
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('vpc-flow-logs.amazonaws.com')
        }),
        expect.any(Object)
      );

      expect(iam.RolePolicy).toHaveBeenCalledWith(
        'vpc-flow-logs-policy-test',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should create RDS monitoring IAM role', () => {
      const { iam } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(iam.Role).toHaveBeenCalledWith(
        'rds-monitoring-role-test',
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('monitoring.rds.amazonaws.com')
        }),
        expect.any(Object)
      );

      expect(iam.RolePolicyAttachment).toHaveBeenCalledWith(
        'rds-monitoring-policy-test',
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Database Resources', () => {
    it('should create RDS subnet group', () => {
      const { rds } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(rds.SubnetGroup).toHaveBeenCalledWith(
        'rds-subnet-group-test',
        expect.objectContaining({
          name: 'rds-subnet-group-test',
          tags: expect.objectContaining({
            Name: 'rds-subnet-group-test'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create RDS instance with proper configuration', () => {
      const { rds } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(rds.Instance).toHaveBeenCalledWith(
        'app-database-test',
        expect.objectContaining({
          identifier: 'app-database-test',
          allocatedStorage: 30,
          maxAllocatedStorage: 100,
          storageType: 'gp3',
          storageEncrypted: true,
          engine: 'mysql',
          engineVersion: '8.0.39',
          instanceClass: 'db.t3.micro',
          dbName: 'appdb',
          username: 'admin',
          manageMasterUserPassword: true,
          backupRetentionPeriod: 30,
          multiAz: true,
          skipFinalSnapshot: false,
          deletionProtection: true,
          enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
          monitoringInterval: 60,
          autoMinorVersionUpgrade: true,
          tags: expect.objectContaining({
            Name: 'app-database-test',
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('Load Balancer Resources', () => {
    it('should create ALB with proper configuration', () => {
      const { lb } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(lb.LoadBalancer).toHaveBeenCalledWith(
        'app-alb-test',
        expect.objectContaining({
          name: 'app-alb-test',
          loadBalancerType: 'application',
          enableDeletionProtection: false,
          accessLogs: expect.objectContaining({
            enabled: true,
            prefix: 'alb-logs'
          }),
          tags: expect.objectContaining({
            Name: 'app-alb-test',
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create target group with health checks', () => {
      const { lb } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(lb.TargetGroup).toHaveBeenCalledWith(
        'app-target-group-test',
        expect.objectContaining({
          name: 'app-target-group-test',
          port: 80,
          protocol: 'HTTP',
          targetType: 'instance',
          healthCheck: expect.objectContaining({
            enabled: true,
            healthyThreshold: 2,
            unhealthyThreshold: 2,
            timeout: 5,
            interval: 30,
            path: '/',
            matcher: '200',
            port: 'traffic-port',
            protocol: 'HTTP'
          }),
          tags: expect.objectContaining({
            Name: 'app-target-group-test'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create ALB listener with CloudFront header validation', () => {
      const { lb } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(lb.Listener).toHaveBeenCalledWith(
        'app-alb-http-listener-test',
        expect.objectContaining({
          port: 80,
          protocol: 'HTTP',
          defaultActions: expect.arrayContaining([
            expect.objectContaining({
              type: 'fixed-response',
              fixedResponse: expect.objectContaining({
                statusCode: '403',
                messageBody: 'Access Denied'
              })
            })
          ])
        }),
        expect.any(Object)
      );

      expect(lb.ListenerRule).toHaveBeenCalledWith(
        'only-cf-header-test',
        expect.objectContaining({
          priority: 10,
          actions: expect.arrayContaining([
            expect.objectContaining({
              type: 'forward'
            })
          ]),
          conditions: expect.arrayContaining([
            expect.objectContaining({
              httpHeader: expect.objectContaining({
                httpHeaderName: 'X-From-CF'
              })
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe('Auto Scaling Resources', () => {
    it('should create launch template with proper configuration', () => {
      const { ec2 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(ec2.LaunchTemplate).toHaveBeenCalledWith(
        'app-launch-template-test',
        expect.objectContaining({
          name: 'app-launch-template-test',
          instanceType: 't3.micro',
          blockDeviceMappings: expect.arrayContaining([
            expect.objectContaining({
              deviceName: '/dev/xvda',
              ebs: expect.objectContaining({
                volumeSize: 20,
                volumeType: 'gp3',
                encrypted: 'true',
                deleteOnTermination: 'true'
              })
            })
          ]),
          metadataOptions: expect.objectContaining({
            httpEndpoint: 'enabled',
            httpTokens: 'required',
            httpPutResponseHopLimit: 1
          }),
          tagSpecifications: expect.arrayContaining([
            expect.objectContaining({
              resourceType: 'instance',
              tags: expect.objectContaining({
                Name: 'app-server-test',
                Environment: 'production'
              })
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it('should create auto scaling group', () => {
      const { autoscaling } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(autoscaling.Group).toHaveBeenCalledWith(
        'app-asg-test',
        expect.objectContaining({
          name: 'app-asg-test',
          healthCheckType: 'ELB',
          healthCheckGracePeriod: 300,
          launchTemplate: expect.objectContaining({
            version: '$Latest'
          }),
          minSize: 2,
          maxSize: 10,
          desiredCapacity: 3,
          tags: expect.arrayContaining([
            expect.objectContaining({
              key: 'Name',
              value: 'app-asg-instance-test',
              propagateAtLaunch: true
            }),
            expect.objectContaining({
              key: 'Environment',
              value: 'production',
              propagateAtLaunch: true
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it('should create scaling policies', () => {
      const { autoscaling } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(autoscaling.Policy).toHaveBeenCalledWith(
        'scale-up-policy-test',
        expect.objectContaining({
          name: 'scale-up-policy-test',
          scalingAdjustment: 1,
          adjustmentType: 'ChangeInCapacity',
          cooldown: 300,
          policyType: 'SimpleScaling'
        }),
        expect.any(Object)
      );

      expect(autoscaling.Policy).toHaveBeenCalledWith(
        'scale-down-policy-test',
        expect.objectContaining({
          name: 'scale-down-policy-test',
          scalingAdjustment: -1,
          adjustmentType: 'ChangeInCapacity',
          cooldown: 300,
          policyType: 'SimpleScaling'
        }),
        expect.any(Object)
      );
    });
  });

  describe('S3 Resources', () => {
    it('should create S3 bucket with security configurations', () => {
      const { s3 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(s3.Bucket).toHaveBeenCalledWith(
        'test-alb-logs-bucket',
        expect.objectContaining({
          forceDestroy: false,
          tags: expect.objectContaining({
            Name: 'test-alb-logs-bucket',
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );

      expect(s3.BucketVersioning).toHaveBeenCalledWith(
        'test-alb-logs-bucket-versioning',
        expect.objectContaining({
          versioningConfiguration: expect.objectContaining({
            status: 'Enabled'
          })
        }),
        expect.any(Object)
      );

      expect(s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalledWith(
        'test-alb-logs-bucket-encryption',
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: expect.objectContaining({
                sseAlgorithm: 'AES256'
              }),
              bucketKeyEnabled: true
            })
          ])
        }),
        expect.any(Object)
      );

      expect(s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        'test-alb-logs-bucket-pab',
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true
        }),
        expect.any(Object)
      );

      expect(s3.BucketLifecycleConfiguration).toHaveBeenCalledWith(
        'test-alb-logs-bucket-lifecycle',
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              id: 'delete-old-logs',
              status: 'Enabled',
              expiration: expect.objectContaining({
                days: 90
              })
            })
          ])
        }),
        expect.any(Object)
      );

      expect(s3.BucketPolicy).toHaveBeenCalledWith(
        'test-alb-logs-bucket-policy',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('CloudFront and WAF Resources', () => {
    it('should create CloudFront WAF in us-east-1', () => {
      const { wafv2 } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(wafv2.WebAcl).toHaveBeenCalledWith(
        'cf-web-acl-test',
        expect.objectContaining({
          scope: 'CLOUDFRONT',
          defaultAction: { allow: {} },
          rules: expect.arrayContaining([
            expect.objectContaining({
              name: 'AWS-AWSManagedRulesCommonRuleSet',
              priority: 0,
              overrideAction: { none: {} },
              statement: expect.objectContaining({
                managedRuleGroupStatement: expect.objectContaining({
                  vendorName: 'AWS',
                  name: 'AWSManagedRulesCommonRuleSet'
                })
              }),
              visibilityConfig: expect.objectContaining({
                cloudwatchMetricsEnabled: true,
                metricName: 'cfCommonRules-test',
                sampledRequestsEnabled: true
              })
            })
          ]),
          visibilityConfig: expect.objectContaining({
            cloudwatchMetricsEnabled: true,
            metricName: 'cfWebAcl-test',
            sampledRequestsEnabled: true
          })
        }),
        expect.any(Object)
      );
    });

    it('should create CloudFront distribution with WAF and custom headers', () => {
      const { cloudfront } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(cloudfront.Distribution).toHaveBeenCalledWith(
        'cf-dist-test',
        expect.objectContaining({
          enabled: true,
          origins: expect.arrayContaining([
            expect.objectContaining({
              originId: 'alb-origin-test',
              customOriginConfig: expect.objectContaining({
                originProtocolPolicy: 'http-only',
                httpPort: 80,
                httpsPort: 443,
                originSslProtocols: ['TLSv1.2']
              }),
              customHeaders: expect.arrayContaining([
                expect.objectContaining({
                  name: 'X-From-CF'
                })
              ])
            })
          ]),
          defaultCacheBehavior: expect.objectContaining({
            targetOriginId: 'alb-origin-test',
            viewerProtocolPolicy: 'redirect-to-https',
            allowedMethods: [
              'GET', 'HEAD', 'OPTIONS', 'PUT', 'PATCH', 'POST', 'DELETE'
            ],
            cachedMethods: ['GET', 'HEAD', 'OPTIONS'],
            forwardedValues: expect.objectContaining({
              queryString: true,
              cookies: { forward: 'all' }
            })
          }),
          priceClass: 'PriceClass_100',
          restrictions: { geoRestriction: { restrictionType: 'none' } },
          viewerCertificate: { cloudfrontDefaultCertificate: true },
          tags: expect.objectContaining({
            Name: 'cf-dist-test',
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('CloudWatch Resources', () => {
    it('should create CloudWatch log groups', () => {
      const { cloudwatch } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(cloudwatch.LogGroup).toHaveBeenCalledWith(
        'vpc-flow-logs-group-test',
        expect.objectContaining({
          name: '/aws/vpc/flowlogs-test',
          retentionInDays: 90,
          tags: expect.objectContaining({
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );

      expect(cloudwatch.LogGroup).toHaveBeenCalledWith(
        'ec2-log-group-test',
        expect.objectContaining({
          name: '/aws/ec2/application-test',
          retentionInDays: 90,
          tags: expect.objectContaining({
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );

      expect(cloudwatch.LogGroup).toHaveBeenCalledWith(
        'alb-log-group-test',
        expect.objectContaining({
          name: '/aws/alb/access-logs-test',
          retentionInDays: 90,
          tags: expect.objectContaining({
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create CloudWatch alarms', () => {
      const { cloudwatch } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      // CPU High Alarm
      expect(cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'cpu-high-alarm-test',
        expect.objectContaining({
          name: 'cpu-high-alarm-test',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          period: 120,
          statistic: 'Average',
          threshold: 80,
          alarmDescription: 'This metric monitors ec2 cpu utilization'
        }),
        expect.any(Object)
      );

      // CPU Low Alarm
      expect(cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'cpu-low-alarm-test',
        expect.objectContaining({
          name: 'cpu-low-alarm-test',
          comparisonOperator: 'LessThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          period: 120,
          statistic: 'Average',
          threshold: 10,
          alarmDescription: 'This metric monitors ec2 cpu utilization'
        }),
        expect.any(Object)
      );

      // RDS Connection Alarm
      expect(cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'rds-connections-alarm-test',
        expect.objectContaining({
          name: 'rds-connections-alarm-test',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'DatabaseConnections',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 15,
          alarmDescription: 'This metric monitors RDS connections'
        }),
        expect.any(Object)
      );

      // RDS CPU Alarm
      expect(cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'rds-cpu-alarm-test',
        expect.objectContaining({
          name: 'rds-cpu-alarm-test',
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'CPUUtilization',
          namespace: 'AWS/RDS',
          period: 300,
          statistic: 'Average',
          threshold: 80,
          alarmDescription: 'This metric monitors RDS CPU utilization'
        }),
        expect.any(Object)
      );

      // ALB Healthy Hosts Alarm
      expect(cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        'alb-healthy-hosts-alarm-test',
        expect.objectContaining({
          name: 'alb-healthy-hosts-alarm-test',
          comparisonOperator: 'LessThanThreshold',
          evaluationPeriods: 2,
          metricName: 'HealthyHostCount',
          namespace: 'AWS/ApplicationELB',
          period: 60,
          statistic: 'Average',
          threshold: 1,
          alarmDescription: 'This metric monitors ALB healthy hosts'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Secrets Manager Resources', () => {
    it('should create secrets with proper encryption', () => {
      const { secretsmanager } = require('@pulumi/aws');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(secretsmanager.Secret).toHaveBeenCalledWith(
        'test-db-secret',
        expect.objectContaining({
          description: 'DB credentials for test',
          tags: expect.objectContaining({
            Name: 'test-db-secret',
            Environment: 'production'
          })
        }),
        expect.any(Object)
      );

      expect(secretsmanager.SecretVersion).toHaveBeenCalledWith(
        'test-db-secret-version',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Random Resources', () => {
    it('should create random password and secret', () => {
      const { RandomPassword, RandomString } = require('@pulumi/random');
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(RandomPassword).toHaveBeenCalledWith(
        'test-db-password',
        expect.objectContaining({
          length: 32,
          special: true,
          upper: true,
          lower: true,
          numeric: true
        }),
        expect.any(Object)
      );

      expect(RandomString).toHaveBeenCalledWith(
        'cf-secret-test',
        expect.objectContaining({
          length: 32,
          special: false,
          upper: true,
          lower: true,
          numeric: true
        }),
        expect.any(Object)
      );
    });
  });

  describe('Output Registration', () => {
    it('should register all required outputs', () => {
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      // Verify outputs are set
      expect(infrastructure.albDnsName).toBeDefined();
      expect(infrastructure.vpcId).toBeDefined();
      expect(infrastructure.rdsEndpoint).toBeDefined();
      expect(infrastructure.autoScalingGroupName).toBeDefined();
      expect(infrastructure.cloudFrontDomain).toBeDefined();
    });

    it('should have correct output types', () => {
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(infrastructure.albDnsName).toBe('mock-alb-12345.ap-south-1.elb.amazonaws.com');
      expect(infrastructure.vpcId).toBe('vpc-12345');
      expect(infrastructure.rdsEndpoint).toBe('mock-db.ap-south-1.rds.amazonaws.com');
      expect(infrastructure.autoScalingGroupName).toBe('mock-asg');
      expect(infrastructure.cloudFrontDomain).toBe('mock-dist.cloudfront.net');
    });
  });

  describe('Resource Dependencies', () => {
    it('should create resources in correct order', () => {
      // Check if running in LocalStack environment
      const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') || 
                           process.env.AWS_ENDPOINT_URL?.includes('localstack');
      
      const { ec2 } = require('@pulumi/aws');
      (ec2.FlowLog as jest.Mock).mockClear();
      
      // Create infrastructure instance
      const testInfra = new ScalableWebAppInfrastructure('test-infra-flowlog', {
        environmentSuffix: 'test'
      });
      
      if (isLocalStack) {
        // When running on LocalStack, FlowLog should NOT be created
        expect(ec2.FlowLog).not.toHaveBeenCalled();
      } else {
        // When running on real AWS, FlowLog should be created with proper dependencies
        expect(ec2.FlowLog).toHaveBeenCalled();
        expect(ec2.FlowLog).toHaveBeenCalledWith(
          'vpc-flow-logs-test',
          expect.objectContaining({
            iamRoleArn: expect.anything(),
            logDestination: expect.anything(),
            logDestinationType: 'cloud-watch-logs',
            vpcId: expect.anything(),
            trafficType: 'ALL',
            maxAggregationInterval: 60,
          }),
          expect.objectContaining({
            dependsOn: expect.any(Array)
          })
        );
      }
    });
  });

  describe('Configuration Handling', () => {
    it('should use default values when config is not provided', () => {
      const { Config } = require('@pulumi/pulumi');
      const mockConfig = {
        get: jest.fn().mockReturnValue(undefined),
        getNumber: jest.fn().mockReturnValue(undefined),
        getObject: jest.fn().mockReturnValue(undefined),
      };
      Config.mockImplementation(() => mockConfig);
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(infrastructure).toBeDefined();
    });

    it('should handle custom configuration values', () => {
      const { Config } = require('@pulumi/pulumi');
      const mockConfig = {
        get: jest.fn().mockImplementation((key) => {
          if (key === 'dbUsername') return 'customuser';
          return undefined;
        }),
        getNumber: jest.fn().mockImplementation((key) => {
          if (key === 'minCapacity') return 1;
          if (key === 'maxCapacity') return 5;
          if (key === 'desiredCapacity') return 2;
          return undefined;
        }),
        getObject: jest.fn().mockReturnValue(undefined),
      };
      Config.mockImplementation(() => mockConfig);
      
      infrastructure = new ScalableWebAppInfrastructure('test-infra', {
        environmentSuffix: 'test'
      });
      
      expect(infrastructure).toBeDefined();
    });
  });
});