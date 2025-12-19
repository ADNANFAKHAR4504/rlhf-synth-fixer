import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as pulumi from '@pulumi/pulumi';

// PULUMI MOCKS SETUP (replacing setup.ts)


// Mock all Pulumi components and resources
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi') as any;
  return {
    ...actual,
    ComponentResource: class MockComponentResource {
      constructor(type: string, name: string, props?: any, opts?: any) {
        // Mock the component resource
        Object.assign(this, props || {});
      }
      
      // Add the registerOutputs method
      registerOutputs(outputs: any): void {
        // Mock implementation - just store the outputs
        Object.assign(this, outputs);
      }
    },
    CustomResource: class MockCustomResource {
      constructor(type: string, name: string, props?: any, opts?: any) {
        // Mock custom resources
        Object.assign(this, props || {});
      }
      
      // Add the registerOutputs method
      registerOutputs(outputs: any): void {
        // Mock implementation - just store the outputs
        Object.assign(this, outputs);
      }
    }
  };
});

// Mock AWS provider with proper typing
jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn(),
  config: {
    region: 'us-east-1',
    accountId: '123456789012'
  },
  getCallerIdentity: jest.fn(() => Promise.resolve({
    accountId: '123456789012',
    arn: 'arn:aws:iam::123456789012:user/test',
    userId: 'AIDACKCEVSQ6C2EXAMPLE',
  })),
  getRegion: jest.fn(() => Promise.resolve({
    name: 'us-east-1',
  })),
  ec2: {
    Vpc: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        cidrBlock: propsObj?.cidrBlock || '10.0.0.0/16',
        arn: `arn:aws:ec2:us-east-1:123456789012:vpc/${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    Subnet: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:ec2:us-east-1:123456789012:subnet/${nameStr}_id`,
        availabilityZone: propsObj?.availabilityZone || 'us-east-1a',
        ...(propsObj || {})
      };
    }),
    InternetGateway: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:ec2:us-east-1:123456789012:internet-gateway/${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    InternetGatewayAttachment: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    NatGateway: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    Eip: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        publicIp: '1.2.3.4',
        allocationId: `eipalloc-${nameStr}`,
        ...(propsObj || {})
      };
    }),
    RouteTable: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    Route: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    RouteTableAssociation: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    SecurityGroup: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:ec2:us-east-1:123456789012:security-group/${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    SecurityGroupRule: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    Instance: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        privateIp: '10.0.1.100',
        publicIp: '54.123.45.67',
        arn: `arn:aws:ec2:us-east-1:123456789012:instance/${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    LaunchTemplate: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      // Return different latestVersion types based on name for testing coverage
      let latestVersion: string | number | { apply: (fn: (v: number) => string) => string } = '1';
      if (nameStr.includes('numeric')) {
        latestVersion = 123; // Test fallback case with number
      } else if (nameStr.includes('output')) {
        latestVersion = {
          apply: (fn: (v: number) => string) => fn(1),
        }; // Test pulumi output case
      }
      return {
        id: `${nameStr}_id`,
        latestVersion,
        ...(propsObj || {})
      };
    }),
    getAmi: jest.fn(() => Promise.resolve({
      id: 'ami-12345678',
      name: 'amzn2-ami-hvm-2.0.20220606.1-x86_64-gp2',
      architecture: 'x86_64',
    }))
  },
  autoscaling: {
    Group: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        name: propsObj?.name || nameStr,
        arn: `arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:${nameStr}_id`,
        ...(propsObj || {})
      };
    })
  },
  lb: {
    LoadBalancer: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${nameStr}/${nameStr}_id`,
        dnsName: `${nameStr}-123456789.us-east-1.elb.amazonaws.com`,
        ...(propsObj || {})
      };
    }),
    Listener: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:listener/app/${nameStr}/${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    TargetGroup: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${nameStr}/${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    TargetGroupAttachment: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    })
  },
  s3: {
    Bucket: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:s3:::${nameStr}`,
        bucketDomainName: `${nameStr}.s3.amazonaws.com`,
        ...(propsObj || {})
      };
    }),
    BucketPolicy: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    })
  },
  rds: {
    Instance: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:rds:us-east-1:123456789012:db:${nameStr}`,
        endpoint: `${nameStr}.123456789012.us-east-1.rds.amazonaws.com`,
        ...(propsObj || {})
      };
    }),
    SubnetGroup: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:rds:us-east-1:123456789012:subgrp:${nameStr}`,
        ...(propsObj || {})
      };
    }),
    ParameterGroup: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:rds:us-east-1:123456789012:pg:${nameStr}`,
        ...(propsObj || {})
      };
    })
  },
  iam: {
    Role: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:iam::123456789012:role/${nameStr}`,
        ...(propsObj || {})
      };
    }),
    RolePolicyAttachment: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    Policy: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:iam::123456789012:policy/${nameStr}`,
        ...(propsObj || {})
      };
    }),
    InstanceProfile: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:iam::123456789012:instance-profile/${nameStr}`,
        ...(propsObj || {})
      };
    })
  },
  kms: {
    Key: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:kms:us-east-1:123456789012:key/${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    Alias: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:kms:us-east-1:123456789012:alias/${nameStr}`,
        ...(propsObj || {})
      };
    })
  },
  cloudwatch: {
    LogGroup: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:logs:us-east-1:123456789012:log-group:${nameStr}`,
        ...(propsObj || {})
      };
    }),
    MetricAlarm: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${nameStr}`,
        ...(propsObj || {})
      };
    }),
    Dashboard: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        dashboardArn: `arn:aws:cloudwatch::123456789012:dashboard/${nameStr}`,
        ...(propsObj || {})
      };
    })
  },
  cfg: {
    ConfigurationRecorder: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    DeliveryChannel: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    })
  },
  ssm: {
    Parameter: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:ssm:us-east-1:123456789012:parameter${propsObj?.name || nameStr}`,
        ...(propsObj || {})
      };
    })
  },
  secretsmanager: {
    Secret: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${nameStr}-AbCdEf`,
        ...(propsObj || {})
      };
    }),
    SecretVersion: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${nameStr}-AbCdEf`,
        versionId: 'AWSCURRENT',
        ...(propsObj || {})
      };
    })
  },
  acm: {
    Certificate: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        arn: `arn:aws:acm:us-east-1:123456789012:certificate/${nameStr}_id`,
        ...(propsObj || {})
      };
    }),
    CertificateValidation: jest.fn().mockImplementation((name: unknown, props: unknown) => {
      const nameStr = name as string;
      const propsObj = props as any;
      return {
        id: `${nameStr}_id`,
        ...(propsObj || {})
      };
    })
  }
}));

// Setup Pulumi runtime mocks
const setupPulumiMocks = () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs): {id: string; state: any} => {
      return {
        id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
        state: {
          ...args.inputs,
          arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.inputs.name || 'mock'}`,
          id: args.inputs.name ? `${args.inputs.name}_id` : 'mock_id',
        },
      };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
      if (args.token === 'aws:getCallerIdentity/getCallerIdentity') {
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/test',
          userId: 'AIDACKCEVSQ6C2EXAMPLE',
        };
      }
      if (args.token === 'aws:getRegion/getRegion') {
        return { name: 'us-east-1' };
      }
      if (args.token === 'aws:ec2/getAmi:getAmi') {
        return {
          id: 'ami-12345678',
          name: 'amzn2-ami-hvm-2.0.20220606.1-x86_64-gp2',
          architecture: 'x86_64',
        };
      }
      return {};
    },
  } as any, 'project', 'stack', true);
};

// Reset function for tests
const resetPulumiMocks = () => {
  setupPulumiMocks();
};

// Initialize mocks
setupPulumiMocks();


// COMPONENT IMPORTS


// Import all components
import { VpcComponent, createVpc } from '../lib/components/vpc/vpc';
import { SubnetComponent, SubnetGroupComponent, createSubnet, createSubnetGroup } from '../lib/components/vpc/subnet';
import { NatGatewayComponent, MultiAzNatGatewayComponent, createNatGateway, createMultiAzNatGateway } from '../lib/components/vpc/natGateway';
import { InternetGatewayComponent, createInternetGateway } from '../lib/components/vpc/internetGateway';
import { RouteTableComponent, RouteTableAssociationComponent, RouteTablesComponent, createRouteTable, createRouteTableAssociation, createRouteTables } from '../lib/components/vpc/routeTable';
import { SecurityGroupComponent, WebSecurityGroupComponent, DatabaseSecurityGroupComponent, ApplicationSecurityGroupComponent, createSecurityGroup, createWebSecurityGroup, createDatabaseSecurityGroup, createApplicationSecurityGroup } from '../lib/components/security/securityGroup';
import { IamRoleComponent, IamPolicyComponent, Ec2InstanceRoleComponent, RdsRoleComponent, AlbRoleComponent, createIamRole, createIamPolicy, createEc2InstanceRole, createRdsRole, createAlbRole } from '../lib/components/security/iam';
import { KmsKeyComponent, KmsAliasComponent, ApplicationKmsKeyComponent, DatabaseKmsKeyComponent, S3KmsKeyComponent, createKmsKey, createKmsAlias, createApplicationKmsKey, createDatabaseKmsKey, createS3KmsKey } from '../lib/components/security/kms';
import { Ec2InstanceComponent, LaunchTemplateComponent, AutoScalingGroupComponent, createEc2Instance, createLaunchTemplate, createAutoScalingGroup } from '../lib/components/compute/ec2';
import { AlbComponent, AlbListenerComponent, HttpsAlbComponent, createAlb, createAlbListener, createHttpsAlb } from '../lib/components/compute/alb';
import { TargetGroupComponent, TargetGroupAttachmentComponent, ApplicationTargetGroupComponent, NetworkTargetGroupComponent, createTargetGroup, createTargetGroupAttachment, createApplicationTargetGroup, createNetworkTargetGroup } from '../lib/components/compute/targetGroup';
import { S3BucketComponent, S3BucketPolicyComponent, SecureS3BucketComponent, createS3Bucket, createS3BucketPolicy, createSecureS3Bucket } from '../lib/components/storage/s3';
import { RdsSubnetGroupComponent, RdsParameterGroupComponent, RdsInstanceComponent, SecureRdsInstanceComponent, createRdsSubnetGroup, createRdsParameterGroup, createRdsInstance, createSecureRdsInstance } from '../lib/components/storage/rds';
import { CloudWatchLogGroupComponent, CloudWatchMetricAlarmComponent, CloudWatchDashboardComponent, ApplicationLogGroupsComponent, createCloudWatchLogGroup, createCloudWatchMetricAlarm, createCloudWatchDashboard, createApplicationLogGroups } from '../lib/components/monitoring/cloudWatch';
import { ConfigServiceRoleComponent, ConfigDeliveryChannelComponent, ConfigConfigurationRecorderComponent, AwsConfigComponent, createConfigServiceRole, createConfigDeliveryChannel, createConfigConfigurationRecorder, createAwsConfig } from '../lib/components/monitoring/config';
import { ParameterStoreParameterComponent, DatabaseParametersComponent, ApplicationParametersComponent, createParameterStoreParameter, createDatabaseParameters, createApplicationParameters } from '../lib/components/secrets/parameterStore';
import { SecretsManagerSecretComponent, SecretsManagerSecretVersionComponent, DatabaseCredentialsComponent, ApiKeysComponent, createSecretsManagerSecret, createSecretsManagerSecretVersion, createDatabaseCredentials, createApiKeys } from '../lib/components/secrets/secretsManager';
import { AcmCertificateComponent, AcmCertificateValidationComponent, DnsValidatedCertificateComponent, createAcmCertificate, createAcmCertificateValidation, createDnsValidatedCertificate } from '../lib/components/certificate/acm';
import { TapStack } from '../lib/tap-stack';


// TESTS

describe('AWS Model Breaking Infrastructure Components', () => {
  beforeEach(() => {
    resetPulumiMocks(); 
    jest.clearAllMocks();
  });



  // VPC COMPONENTS TESTS

  describe('VPC Components', () => {
    describe('VpcComponent', () => {
      it('should create VPC component with required parameters', async () => {
        const vpc = new VpcComponent('test-vpc', {
          cidrBlock: '10.0.0.0/16',
          name: 'test-vpc',
        });

        const vpcId = await vpc.vpcId;
        const cidrBlock = await vpc.cidrBlock;

        expect(vpcId).toBe('test-vpc-vpc_id');
        expect(cidrBlock).toBe('10.0.0.0/16');
        expect(vpc.vpc).toBeDefined();
      });

      it('should create VPC with custom DNS and tags', async () => {
        const vpc = new VpcComponent('test-vpc-custom', {
          cidrBlock: '172.16.0.0/16',
          name: 'test-vpc-custom',
          enableDnsHostnames: false,
          enableDnsSupport: false,
          tags: { Environment: 'test', CustomTag: 'value' },
        });

        const vpcId = await vpc.vpcId;
        expect(vpcId).toBe('test-vpc-custom-vpc_id');
      });

      it('should use default DNS settings when not specified', async () => {
        const vpc = new VpcComponent('test-vpc-defaults', {
          cidrBlock: '10.0.0.0/16',
          name: 'test-vpc-defaults',
        });

        expect(vpc).toBeDefined();
      });
    });

    describe('createVpc function', () => {
      it('should create VPC using factory function', async () => {
        const result = createVpc('factory-vpc', {
          cidrBlock: '192.168.0.0/16',
          name: 'factory-vpc',
        });

        const vpcId = await result.vpcId;
        expect(vpcId).toBe('factory-vpc-vpc_id');
        expect(result.vpc).toBeDefined();
        expect(result.cidrBlock).toBeDefined();
      });
    });
  });


  // SUBNET COMPONENTS TESTS
 

  describe('Subnet Components', () => {
    describe('SubnetComponent', () => {
      it('should create public subnet', async () => {
        const subnet = new SubnetComponent('test-subnet', {
          vpcId: 'vpc-123',
          cidrBlock: '10.0.1.0/24',
          availabilityZone: 'us-east-1a',
          isPublic: true,
          name: 'test-subnet',
        });

        const subnetId = await subnet.subnetId;
        expect(subnetId).toBe('test-subnet-subnet_id');
        expect(subnet.subnet).toBeDefined();
      });

      it('should create private subnet', async () => {
        const subnet = new SubnetComponent('test-private-subnet', {
          vpcId: 'vpc-123',
          cidrBlock: '10.0.10.0/24',
          availabilityZone: 'us-east-1a',
          isPublic: false,
          mapPublicIpOnLaunch: false,
          name: 'test-private-subnet',
        });

        const subnetId = await subnet.subnetId;
        expect(subnetId).toBe('test-private-subnet-subnet_id');
      });
    });



    describe('createSubnet function', () => {
      it('should create subnet using factory function', async () => {
        const result = createSubnet('factory-subnet', {
          vpcId: 'vpc-123',
          cidrBlock: '10.0.2.0/24',
          availabilityZone: 'us-east-1b',
          isPublic: true,
          name: 'factory-subnet',
        });

        const subnetId = await result.subnetId;
        expect(subnetId).toBe('factory-subnet-subnet_id');
        expect(result.subnet).toBeDefined();
      });
    });

    describe('SubnetGroupComponent', () => {
      it('should create subnet group with public and private subnets', async () => {
        const subnetGroup = new SubnetGroupComponent('test-subnet-group', {
          vpcId: 'vpc-123',
          publicSubnets: [
            { cidrBlock: '10.0.1.0/24', availabilityZone: 'us-east-1a', name: 'public-1' },
            { cidrBlock: '10.0.2.0/24', availabilityZone: 'us-east-1b', name: 'public-2' },
          ],
          privateSubnets: [
            { cidrBlock: '10.0.10.0/24', availabilityZone: 'us-east-1a', name: 'private-1' },
            { cidrBlock: '10.0.11.0/24', availabilityZone: 'us-east-1b', name: 'private-2' },
          ],
          tags: { Environment: 'test' },
        });

        expect(subnetGroup).toBeDefined();
        expect(subnetGroup.publicSubnets).toBeDefined();
        expect(subnetGroup.privateSubnets).toBeDefined();
        expect(subnetGroup.publicSubnetIds).toBeDefined();
        expect(subnetGroup.privateSubnetIds).toBeDefined();
      });

      it('should create subnet group with empty subnets', async () => {
        const subnetGroup = new SubnetGroupComponent('test-empty-subnet-group', {
          vpcId: 'vpc-123',
          publicSubnets: [],
          privateSubnets: [],
        });

        expect(subnetGroup).toBeDefined();
      });
    });

    describe('createSubnetGroup function', () => {
      it('should create subnet group using factory function', async () => {
        const result = createSubnetGroup('factory-subnet-group', {
          vpcId: 'vpc-123',
          publicSubnets: [
            { cidrBlock: '10.0.1.0/24', availabilityZone: 'us-east-1a', name: 'public-1' },
          ],
          privateSubnets: [
            { cidrBlock: '10.0.10.0/24', availabilityZone: 'us-east-1a', name: 'private-1' },
          ],
        });

        expect(result).toBeDefined();
        expect(result.publicSubnets).toBeDefined();
        expect(result.privateSubnets).toBeDefined();
      });
    });

  });


  // NAT GATEWAY COMPONENTS TESTS


  describe('NAT Gateway Components', () => {
    describe('NatGatewayComponent', () => {
      it('should create public NAT gateway with EIP', async () => {
        const natGateway = new NatGatewayComponent('test-nat', {
          subnetId: 'subnet-123',
          connectivityType: 'public',
          name: 'test-nat',
        });

        const natGatewayId = await natGateway.natGatewayId;
        expect(natGatewayId).toBe('test-nat-nat_id');
        expect(natGateway.elasticIp).toBeDefined();
        expect(natGateway.publicIp).toBeDefined();
      });

      it('should create private NAT gateway', async () => {
        const natGateway = new NatGatewayComponent('test-private-nat', {
          subnetId: 'subnet-123',
          connectivityType: 'private',
          name: 'test-private-nat',
        });

        const natGatewayId = await natGateway.natGatewayId;
        expect(natGatewayId).toBe('test-private-nat-nat_id');
      });

      it('should create NAT gateway with existing allocation ID', async () => {
        const natGateway = new NatGatewayComponent('test-existing-eip-nat', {
          subnetId: 'subnet-123',
          allocationId: 'eipalloc-123',
          name: 'test-existing-eip-nat',
        });

        const natGatewayId = await natGateway.natGatewayId;
        expect(natGatewayId).toBe('test-existing-eip-nat-nat_id');
      });
    });

    describe('MultiAzNatGatewayComponent', () => {
      it('should create multiple NAT gateways across AZs', async () => {
        const multiAzNat = new MultiAzNatGatewayComponent('test-multi-az-nat', {
          publicSubnetIds: ['subnet-1', 'subnet-2'],
          name: 'test-multi-az-nat',
        });

        expect(multiAzNat.natGateways).toHaveLength(2);
        expect(multiAzNat.natGatewayIds).toHaveLength(2);
      });
    });

    describe('createNatGateway function', () => {
      it('should create NAT gateway using factory function', async () => {
        const result = createNatGateway('factory-nat', {
          subnetId: 'subnet-123',
          name: 'factory-nat',
        });

        const natGatewayId = await result.natGatewayId;
        expect(natGatewayId).toBe('factory-nat-nat_id');
        expect(result.natGateway).toBeDefined();
      });
    });

    describe('createMultiAzNatGateway function', () => {
      it('should create multi-AZ NAT gateway using factory function', async () => {
        const result = createMultiAzNatGateway('factory-multi-nat', {
          publicSubnetIds: ['subnet-1', 'subnet-2'],
          name: 'factory-multi-nat',
        });

        expect(result.natGateways).toHaveLength(2);
        expect(result.natGatewayIds).toHaveLength(2);
      });
    });
  });

  
  // INTERNET GATEWAY COMPONENTS TESTS
   

  describe('Internet Gateway Components', () => {
    describe('InternetGatewayComponent', () => {
      it('should create internet gateway', async () => {
        const igw = new InternetGatewayComponent('test-igw', {
          vpcId: 'vpc-123',
          name: 'test-igw',
        });

        const igwId = await igw.internetGatewayId;
        expect(igwId).toBe('test-igw-igw_id');
        expect(igw.internetGateway).toBeDefined();
        expect(igw.vpcAttachment).toBeDefined();
      });

      it('should create internet gateway with custom tags', async () => {
        const igw = new InternetGatewayComponent('test-igw-tags', {
          vpcId: 'vpc-123',
          name: 'test-igw-tags',
          tags: { Environment: 'test' },
        });

        const igwId = await igw.internetGatewayId;
        expect(igwId).toBe('test-igw-tags-igw_id');
      });
    });

    describe('createInternetGateway function', () => {
      it('should create internet gateway using factory function', async () => {
        const result = createInternetGateway('factory-igw', {
          vpcId: 'vpc-123',
          name: 'factory-igw',
        });

        const igwId = await result.internetGatewayId;
        expect(igwId).toBe('factory-igw-igw_id');
        expect(result.internetGateway).toBeDefined();
        expect(result.vpcAttachment).toBeDefined();
      });
    });
  });

   
  // ROUTE TABLE COMPONENTS TESTS
  

  describe('Route Table Components', () => {
    describe('RouteTableComponent', () => {
      it('should create route table without additional routes', async () => {
        const routeTable = new RouteTableComponent('test-rt', {
          vpcId: 'vpc-123',
          name: 'test-rt',
        });

        const rtId = await routeTable.routeTableId;
        expect(rtId).toBe('test-rt-rt_id');
        expect(routeTable.routes).toHaveLength(0);
      });

      it('should create route table with additional routes', async () => {
        const routeTable = new RouteTableComponent('test-rt-routes', {
          vpcId: 'vpc-123',
          name: 'test-rt-routes',
          routes: [
            {
              cidrBlock: '0.0.0.0/0',
              gatewayId: 'igw-123',
            },
          ],
        });

        const rtId = await routeTable.routeTableId;
        expect(rtId).toBe('test-rt-routes-rt_id');
        expect(routeTable.routes).toHaveLength(1);
      });
    });

    describe('RouteTableAssociationComponent', () => {
      it('should create route table association', async () => {
        const association = new RouteTableAssociationComponent('test-assoc', {
          routeTableId: 'rt-123',
          subnetId: 'subnet-123',
          name: 'test-assoc',
        });

        expect(association.association).toBeDefined();
      });
    });

    describe('RouteTablesComponent', () => {
      it('should create public and private route tables', async () => {
        const routeTables = new RouteTablesComponent(
          'test-routes',
          {
            vpcId: 'vpc-123',
            internetGatewayId: 'igw-123',
            publicSubnetIds: ['subnet-1'],
            name: 'test-public',
          },
          {
            vpcId: 'vpc-123',
            natGatewayIds: ['nat-123'],
            privateSubnetIds: ['subnet-10'],
            name: 'test-private',
          }
        );

        expect(routeTables.publicRouteTable).toBeDefined();
        expect(routeTables.privateRouteTables).toHaveLength(1);
        expect(routeTables.publicAssociations).toHaveLength(1);
        expect(routeTables.privateAssociations).toHaveLength(1);
      });

      it('should handle single natGatewayId (not array)', async () => {
        const routeTables = new RouteTablesComponent(
          'test-routes-single-nat',
          {
            vpcId: 'vpc-123',
            internetGatewayId: 'igw-123',
            publicSubnetIds: 'subnet-1' as any,
            name: 'test-public-single',
          },
          {
            vpcId: 'vpc-123',
            natGatewayIds: 'nat-123' as any,
            privateSubnetIds: 'subnet-10' as any,
            name: 'test-private-single',
          }
        );

        expect(routeTables.publicRouteTable).toBeDefined();
        expect(routeTables.privateRouteTables).toBeDefined();
      });

      it('should create route tables with multiple NAT gateways', async () => {
        const routeTables = new RouteTablesComponent(
          'test-routes-multi-nat',
          {
            vpcId: 'vpc-123',
            internetGatewayId: 'igw-123',
            publicSubnetIds: ['subnet-1', 'subnet-2'],
            name: 'test-public-multi',
          },
          {
            vpcId: 'vpc-123',
            natGatewayIds: ['nat-123', 'nat-456'],
            privateSubnetIds: ['subnet-10', 'subnet-11'],
            name: 'test-private-multi',
          }
        );

        expect(routeTables.publicRouteTable).toBeDefined();
        expect(routeTables.privateRouteTables.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Factory functions', () => {
      it('should create route table using factory function', async () => {
        const result = createRouteTable('factory-rt', {
          vpcId: 'vpc-123',
          name: 'factory-rt',
        });

        const rtId = await result.routeTableId;
        expect(rtId).toBe('factory-rt-rt_id');
        expect(result.routeTable).toBeDefined();
      });

      it('should create route table association using factory function', async () => {
        const result = createRouteTableAssociation('factory-assoc', {
          routeTableId: 'rt-123',
          subnetId: 'subnet-123',
          name: 'factory-assoc',
        });

        expect(result).toBeDefined();
      });

      it('should create route tables using factory function', async () => {
        const result = createRouteTables(
          'factory-routes',
          {
            vpcId: 'vpc-123',
            internetGatewayId: 'igw-123',
            publicSubnetIds: ['subnet-1'],
            name: 'factory-public',
          },
          {
            vpcId: 'vpc-123',
            natGatewayIds: ['nat-123'],
            privateSubnetIds: ['subnet-10'],
            name: 'factory-private',
          }
        );

        expect(result.publicRouteTable).toBeDefined();
        expect(result.privateRouteTables).toHaveLength(1);
      });
    });
  });

  
  // SECURITY GROUP COMPONENTS TESTS
  

  describe('Security Group Components', () => {
    describe('SecurityGroupComponent', () => {
      it('should create basic security group', async () => {
        const sg = new SecurityGroupComponent('test-sg', {
          name: 'test-sg',
          description: 'Test security group',
          vpcId: 'vpc-123',
        });

        const sgId = await sg.securityGroupId;
        expect(sgId).toBe('test-sg-sg_id');
        expect(sg.rules).toHaveLength(0);
      });

      it('should create security group with rules', async () => {
        const sg = new SecurityGroupComponent('test-sg-rules', {
          name: 'test-sg-rules',
          description: 'Test security group with rules',
          vpcId: 'vpc-123',
          rules: [
            {
              type: 'ingress',
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
            },
            {
              type: 'egress',
              fromPort: 0,
              toPort: 65535,
              protocol: 'tcp',
              sourceSecurityGroupId: 'sg-123',
            },
          ],
        });

        const sgId = await sg.securityGroupId;
        expect(sgId).toBe('test-sg-rules-sg_id');
        expect(sg.rules).toHaveLength(2);
      });
    });

    describe('WebSecurityGroupComponent', () => {
      it('should create web security group', async () => {
        const webSg = new WebSecurityGroupComponent('test-web-sg', {
          name: 'test-web-sg',
          vpcId: 'vpc-123',
        });

        const sgId = await webSg.securityGroupId;
        expect(sgId).toBe('test-web-sg-sg_id');
        expect(webSg.rules.length).toBeGreaterThan(0);
      });
    });

    describe('DatabaseSecurityGroupComponent', () => {
      it('should create database security group', async () => {
        const dbSg = new DatabaseSecurityGroupComponent('test-db-sg', {
          name: 'test-db-sg',
          vpcId: 'vpc-123',
          webSecurityGroupId: 'sg-web-123',
        });

        const sgId = await dbSg.securityGroupId;
        expect(sgId).toBe('test-db-sg-sg_id');
        expect(dbSg.rules.length).toBeGreaterThan(0);
      });

      it('should create database security group with custom port', async () => {
        const dbSg = new DatabaseSecurityGroupComponent('test-db-sg-5432', {
          name: 'test-db-sg-5432',
          vpcId: 'vpc-123',
          webSecurityGroupId: 'sg-web-123',
          databasePort: 5432,
        });

        const sgId = await dbSg.securityGroupId;
        expect(sgId).toBe('test-db-sg-5432-sg_id');
      });
    });

    describe('ApplicationSecurityGroupComponent', () => {
      it('should create application security group', async () => {
        const appSg = new ApplicationSecurityGroupComponent('test-app-sg', {
          name: 'test-app-sg',
          vpcId: 'vpc-123',
          albSecurityGroupId: 'sg-alb-123',
        });

        const sgId = await appSg.securityGroupId;
        expect(sgId).toBe('test-app-sg-sg_id');
        expect(appSg.rules.length).toBeGreaterThan(0);
      });

      it('should create application security group with custom port', async () => {
        const appSg = new ApplicationSecurityGroupComponent('test-app-sg-3000', {
          name: 'test-app-sg-3000',
          vpcId: 'vpc-123',
          albSecurityGroupId: 'sg-alb-123',
          applicationPort: 3000,
        });

        const sgId = await appSg.securityGroupId;
        expect(sgId).toBe('test-app-sg-3000-sg_id');
      });
    });

    describe('Security Group Factory Functions', () => {
      it('should create security group using factory function', async () => {
        const result = createSecurityGroup('factory-sg', {
          name: 'factory-sg',
          description: 'Factory security group',
          vpcId: 'vpc-123',
        });

        const sgId = await result.securityGroupId;
        expect(sgId).toBe('factory-sg-sg_id');
      });

      it('should create web security group using factory function', async () => {
        const result = createWebSecurityGroup('factory-web-sg', {
          name: 'factory-web-sg',
          vpcId: 'vpc-123',
        });

        const sgId = await result.securityGroupId;
        expect(sgId).toBe('factory-web-sg-sg_id');
      });

      it('should create database security group using factory function', async () => {
        const result = createDatabaseSecurityGroup('factory-db-sg', {
          name: 'factory-db-sg',
          vpcId: 'vpc-123',
          webSecurityGroupId: 'sg-web-123',
        });

        const sgId = await result.securityGroupId;
        expect(sgId).toBe('factory-db-sg-sg_id');
      });

      it('should create application security group using factory function', async () => {
        const result = createApplicationSecurityGroup('factory-app-sg', {
          name: 'factory-app-sg',
          vpcId: 'vpc-123',
          albSecurityGroupId: 'sg-alb-123',
        });

        const sgId = await result.securityGroupId;
        expect(sgId).toBe('factory-app-sg-sg_id');
      });
    });
  });

  
  // EC2 COMPUTE COMPONENTS TESTS

  describe('EC2 Compute Components', () => {
    describe('Ec2InstanceComponent', () => {
      it('should create EC2 instance with basic configuration', async () => {
        const instance = new Ec2InstanceComponent('test-ec2', {
          name: 'test-ec2',
          instanceType: 't3.micro',
          subnetId: 'subnet-123',
          securityGroupIds: ['sg-123'],
        });

        const instanceId = await instance.instanceId;
        const privateIp = await instance.privateIp;
        expect(instanceId).toBe('test-ec2-instance_id');
        expect(privateIp).toBeDefined();
        expect(instance.instance).toBeDefined();
      });

      it('should create EC2 instance with custom configuration', async () => {
        const instance = new Ec2InstanceComponent('test-ec2-custom', {
          name: 'test-ec2-custom',
          instanceType: 't3.small',
          amiId: 'ami-custom-123',
          subnetId: 'subnet-123',
          securityGroupIds: ['sg-123', 'sg-456'],
          keyName: 'my-key',
          iamInstanceProfile: 'instance-profile-arn',
          userData: 'echo "Hello World"',
          ebsOptimized: false,
          monitoring: false,
          rootBlockDevice: {
            volumeType: 'gp2',
            volumeSize: 10,
            deleteOnTermination: false,
            encrypted: false,
          },
          tags: { Environment: 'test' },
        });

        const instanceId = await instance.instanceId;
        expect(instanceId).toBe('test-ec2-custom-instance_id');
      });
    });

    describe('LaunchTemplateComponent', () => {
      it('should create launch template with basic configuration', async () => {
        const launchTemplate = new LaunchTemplateComponent('test-lt', {
          name: 'test-lt',
          instanceType: 't3.micro',
          securityGroupIds: ['sg-123'],
        });

        const ltId = await launchTemplate.launchTemplateId;
        const latestVersion = await launchTemplate.latestVersion;
        expect(ltId).toBe('test-lt-lt_id');
        expect(latestVersion).toBeDefined();
        expect(launchTemplate.launchTemplate).toBeDefined();
      });

      it('should create launch template with custom configuration', async () => {
        const launchTemplate = new LaunchTemplateComponent('test-lt-custom', {
          name: 'test-lt-custom',
          instanceType: 't3.small',
          amiId: 'ami-custom-123',
          securityGroupIds: ['sg-123'],
          keyName: 'my-key',
          iamInstanceProfile: { name: 'my-profile' },
          userData: Buffer.from('echo "Hello"').toString('base64'),
          ebsOptimized: false,
          monitoring: false,
          blockDeviceMappings: [
            {
              deviceName: '/dev/sda1',
              ebs: {
                volumeType: 'gp3',
                volumeSize: 30,
                deleteOnTermination: true,
                encrypted: true,
                kmsKeyId: 'key-123',
              },
            },
          ],
          tags: { Service: 'web' },
        });

        const ltId = await launchTemplate.launchTemplateId;
        expect(ltId).toBe('test-lt-custom-lt_id');
      });

      it('should handle latestVersion as pulumi output', async () => {
        // Test with pulumi output-like object (name contains 'output')
        const launchTemplate = new LaunchTemplateComponent('test-lt-output-version', {
          name: 'test-lt-output-version',
          instanceType: 't3.micro',
          securityGroupIds: ['sg-123'],
        });

        expect(launchTemplate.latestVersion).toBeDefined();
      });

      it('should handle latestVersion as numeric fallback case', async () => {
        // Test with numeric latestVersion (name contains 'numeric')
        const launchTemplate = new LaunchTemplateComponent('test-lt-numeric-version', {
          name: 'test-lt-numeric-version',
          instanceType: 't3.nano',
          securityGroupIds: ['sg-456'],
        });

        const latestVersion = await launchTemplate.latestVersion;
        expect(latestVersion).toBeDefined();
      });

      it('should handle latestVersion string case', async () => {
        const launchTemplate = new LaunchTemplateComponent('test-lt-string', {
          name: 'test-lt-string',
          instanceType: 't3.micro',
          securityGroupIds: ['sg-789'],
        });

        expect(launchTemplate.latestVersion).toBeDefined();
      });
    });

    describe('AutoScalingGroupComponent', () => {
      it('should create auto scaling group', async () => {
        const asg = new AutoScalingGroupComponent('test-asg', {
          name: 'test-asg',
          minSize: 1,
          maxSize: 3,
          desiredCapacity: 2,
          subnetIds: ['subnet-1', 'subnet-2'],
          launchTemplate: {
            id: 'lt-123',
            version: '$Latest',
          },
        });

        const asgName = await asg.autoScalingGroupName;
        const asgArn = await asg.autoScalingGroupArn;
        expect(asgName).toBe('test-asg');
        expect(asgArn).toBeDefined();
        expect(asg.autoScalingGroup).toBeDefined();
      });

      it('should create auto scaling group with target groups and custom settings', async () => {
        const asg = new AutoScalingGroupComponent('test-asg-full', {
          name: 'test-asg-full',
          minSize: 2,
          maxSize: 10,
          desiredCapacity: 4,
          subnetIds: ['subnet-1', 'subnet-2'],
          targetGroupArns: ['tg-123', 'tg-456'],
          healthCheckType: 'EC2',
          healthCheckGracePeriod: 600,
          launchTemplate: {
            id: 'lt-123',
            version: '1',
          },
          tags: { Environment: 'production' },
        });

        const asgName = await asg.autoScalingGroupName;
        expect(asgName).toBe('test-asg-full');
      });
    });

    describe('EC2 Factory Functions', () => {
      it('should create EC2 instance using factory function', async () => {
        const result = createEc2Instance('factory-ec2', {
          name: 'factory-ec2',
          instanceType: 't3.micro',
          subnetId: 'subnet-123',
          securityGroupIds: ['sg-123'],
        });

        const instanceId = await result.instanceId;
        expect(instanceId).toBe('factory-ec2-instance_id');
        expect(result.instance).toBeDefined();
      });

      it('should create launch template using factory function', async () => {
        const result = createLaunchTemplate('factory-lt', {
          name: 'factory-lt',
          instanceType: 't3.micro',
          securityGroupIds: ['sg-123'],
        });

        const ltId = await result.launchTemplateId;
        expect(ltId).toBe('factory-lt-lt_id');
        expect(result.launchTemplate).toBeDefined();
      });

      it('should create auto scaling group using factory function', async () => {
        const result = createAutoScalingGroup('factory-asg', {
          name: 'factory-asg',
          minSize: 1,
          maxSize: 3,
          desiredCapacity: 2,
          subnetIds: ['subnet-1'],
          launchTemplate: {
            id: 'lt-123',
            version: '$Latest',
          },
        });

        const asgName = await result.autoScalingGroupName;
        expect(asgName).toBe('factory-asg');
        expect(result.autoScalingGroup).toBeDefined();
      });
    });
  });
});