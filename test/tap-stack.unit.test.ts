import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { EnvironmentConstruct } from '../lib/environment-construct';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: environmentSuffix,
      env: {
        region: 'us-west-2',
        account: '123456789012'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct properties', () => {
      expect(stack.stackName).toBe('TestStack');
      expect(stack.node.tryGetContext('environmentSuffix')).toBeUndefined();
    });

    test('should apply global tags', () => {
      const tags = cdk.Tags.of(stack);
      expect(stack.tags).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should create shared IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            }
          }]
        },
        RoleName: `shared-instance-role-${environmentSuffix}`,
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith(['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/AmazonSSMManagedInstanceCore'])
            ])
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith(['arn:', { Ref: 'AWS::Partition' }, ':iam::aws:policy/CloudWatchAgentServerPolicy'])
            ])
          })
        ])
      });
    });

    test('should create VPC Flow Logs roles for each environment', () => {
      const environments = ['development', 'staging', 'production'];
      environments.forEach(env => {
        template.hasResourceProperties('AWS::IAM::Role', {
          RoleName: `vpc-flow-logs-role-${env}-${environmentSuffix}`,
          AssumeRolePolicyDocument: {
            Statement: [{
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com'
              }
            }]
          }
        });
      });
    });
  });

  describe('VPC Resources', () => {
    test('should create temporary VPC for shared security group', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '192.168.0.0/16',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `temp-vpc-${environmentSuffix}`
          })
        ])
      });
    });

    test('should create VPC for each environment with correct CIDR blocks', () => {
      const environments = [
        { name: 'development', cidr: '10.0.0.0/16' },
        { name: 'staging', cidr: '10.1.0.0/16' },
        { name: 'production', cidr: '10.2.0.0/16' }
      ];

      environments.forEach(env => {
        template.hasResourceProperties('AWS::EC2::VPC', {
          CidrBlock: env.cidr,
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: `${env.name}-vpc-${environmentSuffix}`
            })
          ])
        });
      });
    });

    test('should create subnets for each environment', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        // Check for public subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
          MapPublicIpOnLaunch: true,
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'aws-cdk:subnet-name',
              Value: `${env}-public`
            })
          ])
        });

        // Check for private subnets
        template.hasResourceProperties('AWS::EC2::Subnet', {
          MapPublicIpOnLaunch: false,
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'aws-cdk:subnet-name',
              Value: `${env}-private`
            })
          ])
        });
      });
    });

    test('should create NAT gateways for each environment', () => {
      // Each environment should have 2 NAT gateways (one per AZ)
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(6); // 3 environments * 2 NAT gateways
    });

    test('should create Internet Gateways for each VPC', () => {
      const igws = template.findResources('AWS::EC2::InternetGateway');
      expect(Object.keys(igws).length).toBe(4); // 3 environments + 1 temp VPC
    });
  });

  describe('Security Groups', () => {
    test('should create shared security group with correct rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `shared-sg-${environmentSuffix}`,
        GroupDescription: 'Shared security group for common rules across environments',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'SSH access'
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            Description: 'HTTP access'
          })
        ])
      });
    });

    test('should create environment-specific security groups', () => {
      const environments = ['development', 'staging', 'production'];
      const cidrs = ['10.0.0.0/16', '10.1.0.0/16', '10.2.0.0/16'];
      
      environments.forEach((env, index) => {
        template.hasResourceProperties('AWS::EC2::SecurityGroup', {
          GroupName: `${env}-sg-${environmentSuffix}`,
          GroupDescription: `Security group for ${env} environment`,
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              CidrIp: cidrs[index],
              IpProtocol: 'tcp',
              Description: 'Allow all TCP traffic within VPC'
            })
          ])
        });
      });
    });
  });

  describe('Network ACLs', () => {
    test('should create restrictive Network ACLs for each environment', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        template.hasResourceProperties('AWS::EC2::NetworkAcl', {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Name',
              Value: Match.stringLikeRegexp(`.*${env}-restrictive-nacl-${environmentSuffix}.*`)
            })
          ])
        });
      });
    });

    test('production environment should deny staging traffic', () => {
      // Check for Network ACL entry that denies staging traffic in production
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        CidrBlock: '10.1.0.0/16', // Staging CIDR
        RuleAction: 'deny',
        RuleNumber: 90
      });
    });
  });

  describe('EC2 Instances', () => {
    test('should create EC2 instances with correct types for each environment', () => {
      // Development instance - t2.micro
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't2.micro',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `development-test-instance-${environmentSuffix}`
          })
        ])
      });

      // Staging instance - t3.medium
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.medium',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `staging-test-instance-${environmentSuffix}`
          })
        ])
      });

      // Production instance - m5.large
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 'm5.large',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: `production-test-instance-${environmentSuffix}`
          })
        ])
      });
    });

    test('should configure IMDSv2 on all EC2 instances', () => {
      const instances = template.findResources('AWS::EC2::Instance');
      Object.keys(instances).forEach(key => {
        const instance = instances[key];
        expect(instance.Properties.MetadataOptions).toMatchObject({
          HttpTokens: 'required',
          HttpPutResponseHopLimit: 1,
          HttpEndpoint: 'enabled'
        });
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC Flow Logs for each environment', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        template.hasResourceProperties('AWS::Logs::LogGroup', {
          LogGroupName: `/aws/vpc/flowlogs/${env}-${environmentSuffix}`,
          RetentionInDays: 7
        });
      });
    });

    test('should create Flow Log resources for each VPC', () => {
      const flowLogs = template.findResources('AWS::EC2::FlowLog');
      expect(Object.keys(flowLogs).length).toBe(3); // One for each environment
    });
  });

  describe('Outputs', () => {
    test('should have VPC ID outputs for all environments', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        template.hasOutput(`${env}VpcId`, {
          Description: `VPC ID for ${env} environment`,
          Export: {
            Name: `${env}-vpc-id-${environmentSuffix}`
          }
        });
      });
    });

    test('should have Instance ID outputs for all environments', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        template.hasOutput(`${env}InstanceId`, {
          Description: `Instance ID for ${env} environment`,
          Export: {
            Name: `${env}-instance-id-${environmentSuffix}`
          }
        });
      });
    });

    test('should have Instance Private IP outputs for all environments', () => {
      const environments = ['development', 'staging', 'production'];
      
      environments.forEach(env => {
        template.hasOutput(`${env}InstancePrivateIp`, {
          Description: `Private IP for ${env} instance`,
          Export: {
            Name: `${env}-instance-ip-${environmentSuffix}`
          }
        });
      });
    });
  });

  describe('Resource Deletion Policies', () => {
    test('all log groups should have Delete removal policy', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.keys(logGroups).forEach(key => {
        const logGroup = logGroups[key];
        expect(logGroup.DeletionPolicy).toBe('Delete');
        expect(logGroup.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('no resources should have Retain deletion policy', () => {
      const allResources = template.toJSON().Resources;
      Object.keys(allResources).forEach(key => {
        const resource = allResources[key];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });
  });

  describe('Environment Suffix Implementation', () => {
    test('all named resources should include environment suffix', () => {
      // Check IAM role names
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`)
      });

      // Check security group names
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`)
      });

      // Check VPC names in tags
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`.*${environmentSuffix}.*`)
          })
        ])
      });
    });
  });

  describe('Cross-Environment Isolation', () => {
    test('each environment should have its own VPC', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      // 4 VPCs: 3 environments + 1 temp VPC
      expect(Object.keys(vpcs).length).toBe(4);
    });

    test('security groups should be VPC-specific', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const vpcRefs = new Set();
      
      Object.values(securityGroups).forEach((sg: any) => {
        if (sg.Properties.VpcId) {
          vpcRefs.add(JSON.stringify(sg.Properties.VpcId));
        }
      });
      
      // Should have at least 4 different VPC references
      expect(vpcRefs.size).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('EnvironmentConstruct Unit Tests', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let construct: EnvironmentConstruct;
  let template: Template;
  const environmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');
    
    const sharedRole = new cdk.aws_iam.Role(stack, 'TestRole', {
      assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com')
    });
    
    const tempVpc = new ec2.Vpc(stack, 'TempVpc', {
      ipAddresses: ec2.IpAddresses.cidr('192.168.0.0/16'),
      maxAzs: 1
    });
    
    const sharedSg = new ec2.SecurityGroup(stack, 'TestSG', {
      vpc: tempVpc
    });
    
    construct = new EnvironmentConstruct(stack, 'TestEnv', {
      environmentConfig: {
        name: 'test',
        vpcCidr: '10.0.0.0/16',
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24']
      },
      environmentSuffix: environmentSuffix,
      sharedInstanceRole: sharedRole,
      sharedSecurityGroup: sharedSg
    });
    
    template = Template.fromStack(stack);
  });

  test('should expose VPC property', () => {
    expect(construct.vpc).toBeDefined();
    expect(construct.vpc).toBeInstanceOf(ec2.Vpc);
  });

  test('should expose environment name', () => {
    expect(construct.environmentName).toBe('test');
  });

  test('should expose instance ID', () => {
    expect(construct.instanceId).toBeDefined();
  });

  test('should expose instance private IP', () => {
    expect(construct.instancePrivateIp).toBeDefined();
  });

  test('should create VPC with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: `test-vpc-${environmentSuffix}`
        })
      ])
    });
  });

  test('should create Flow Logs with correct log group name', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: `/aws/vpc/flowlogs/test-${environmentSuffix}`,
      RetentionInDays: 7
    });
  });

  test('should create environment-specific security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: `test-sg-${environmentSuffix}`,
      GroupDescription: 'Security group for test environment'
    });
  });

  test('should create EC2 instance with correct properties', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't2.micro',
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: `test-test-instance-${environmentSuffix}`
        })
      ])
    });
  });

  test('should create Network ACL with correct name', () => {
    template.hasResourceProperties('AWS::EC2::NetworkAcl', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: Match.stringLikeRegexp(`.*test-restrictive-nacl-${environmentSuffix}.*`)
        })
      ])
    });
  });
});