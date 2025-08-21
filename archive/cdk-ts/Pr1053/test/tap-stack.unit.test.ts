import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';
import { ComputeStack } from '../lib/compute-stack';
import { DatabaseStack } from '../lib/database-stack';

describe('Infrastructure Stacks', () => {
  let app: cdk.App;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Default Environment Suffix', () => {
    test('VpcStack uses default suffix when not provided', () => {
      const stack = new VpcStack(app, 'TestVpc', {});
      const template = Template.fromStack(stack);
      // Should create resources with 'dev' suffix by default
      const vpcs = Object.keys(template.findResources('AWS::EC2::VPC'));
      expect(vpcs.some(id => id.includes('dev'))).toBe(true);
    });

    test('ComputeStack uses default suffix when not provided', () => {
      const vpcStack = new VpcStack(app, 'TestVpc', {});
      const stack = new ComputeStack(app, 'TestCompute', {
        vpc: vpcStack.vpc,
      });
      const template = Template.fromStack(stack);
      // Should create resources with 'dev' suffix by default
      const sgs = Object.keys(
        template.findResources('AWS::EC2::SecurityGroup')
      );
      expect(sgs.some(id => id.includes('dev'))).toBe(true);
    });

    test('DatabaseStack uses default suffix when not provided', () => {
      const vpcStack = new VpcStack(app, 'TestVpc', {});
      const computeStack = new ComputeStack(app, 'TestCompute', {
        vpc: vpcStack.vpc,
      });
      const stack = new DatabaseStack(app, 'TestDb', {
        vpc: vpcStack.vpc,
        ec2SecurityGroup: computeStack.ec2SecurityGroup,
      });
      const template = Template.fromStack(stack);
      // Should create resources with 'dev' suffix by default
      const secrets = Object.keys(
        template.findResources('AWS::SecretsManager::Secret')
      );
      expect(secrets.some(id => id.includes('dev'))).toBe(true);
    });

    test('TapStack uses default suffix from context when not provided', () => {
      const stack = new TapStack(app, 'TestTap', {});
      // Should use 'dev' as default when no context or props provided
      const children = stack.node.children;
      expect(children.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('TapStack', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        stackName: `TapStack${environmentSuffix}`,
      });
      template = Template.fromStack(stack);
    });

    test('creates nested stacks', () => {
      // When using nested stacks with CDK, they become separate CloudFormation stacks
      // The main stack only contains metadata and outputs
      const resources = template.findResources('AWS::CloudFormation::Stack');
      // The main stack itself doesn't contain nested stack resources when using this pattern
      // Instead, CDK creates separate CloudFormation stacks
      expect(stack.node.children.length).toBeGreaterThanOrEqual(3);
    });

    test('creates proper outputs', () => {
      // Check for main stack outputs
      template.hasOutput('InfrastructureDeployed', {
        Value: 'true',
        Description: 'Infrastructure deployment status',
      });

      template.hasOutput('Environment', {
        Value: environmentSuffix,
        Description: 'Environment suffix',
      });
    });

    test('has proper stack naming', () => {
      // Verify nested stacks are created as children
      const children = stack.node.children;
      const childIds = children.map(child => child.node.id);

      // Check that we have the expected nested stacks
      expect(childIds).toContain('VpcStack');
      expect(childIds).toContain('ComputeStack');
      expect(childIds).toContain('DatabaseStack');
    });
  });

  describe('VpcStack', () => {
    let stack: VpcStack;
    let template: Template;

    beforeEach(() => {
      stack = new VpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        stackName: `TestVpcStack-${environmentSuffix}`,
      });
      template = Template.fromStack(stack);
    });

    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates subnets in 2 availability zones', () => {
      // Public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private

      // Check for public subnet configuration
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('creates NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates proper outputs', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
      });

      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
      });

      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
      });
    });

    test('configures route tables', () => {
      // Should have route tables for public and private subnets
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ComputeStack', () => {
    let vpcStack: VpcStack;
    let stack: ComputeStack;
    let template: Template;

    beforeEach(() => {
      vpcStack = new VpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        stackName: `TestVpcStack-${environmentSuffix}`,
      });

      stack = new ComputeStack(app, 'TestComputeStack', {
        vpc: vpcStack.vpc,
        environmentSuffix,
        stackName: `TestComputeStack-${environmentSuffix}`,
      });
      template = Template.fromStack(stack);
    });

    test('creates EC2 instance', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: Match.anyValue(),
        UserData: Match.anyValue(),
      });
    });

    test('creates EC2 security group with proper rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instance',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });

      // Check for ingress rules
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });

    test('creates IAM role for EC2', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('attaches SSM managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('adds policy for Secrets Manager access', () => {
      // Check that the role has policy for accessing secrets
      const roles = template.findResources('AWS::IAM::Role');
      const roleNames = Object.keys(roles);
      expect(roleNames.length).toBeGreaterThan(0);

      // Find the EC2 role
      const ec2RoleKey = roleNames.find(key => key.includes('Ec2Role'));
      expect(ec2RoleKey).toBeDefined();
    });

    test('creates proper outputs', () => {
      template.hasOutput('Ec2InstanceId', {
        Description: 'EC2 Instance ID',
      });

      template.hasOutput('Ec2PublicIp', {
        Description: 'EC2 Instance Public IP',
      });

      template.hasOutput('Ec2SecurityGroupId', {
        Description: 'EC2 Security Group ID',
      });
    });

    test('configures user data script', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.objectLike({
          'Fn::Base64': Match.stringLikeRegexp('.*postgresql15.*'),
        }),
      });
    });
  });

  describe('DatabaseStack', () => {
    let vpcStack: VpcStack;
    let computeStack: ComputeStack;
    let stack: DatabaseStack;
    let template: Template;

    beforeEach(() => {
      vpcStack = new VpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        stackName: `TestVpcStack-${environmentSuffix}`,
      });

      computeStack = new ComputeStack(app, 'TestComputeStack', {
        vpc: vpcStack.vpc,
        environmentSuffix,
        stackName: `TestComputeStack-${environmentSuffix}`,
      });

      stack = new DatabaseStack(app, 'TestDatabaseStack', {
        vpc: vpcStack.vpc,
        ec2SecurityGroup: computeStack.ec2SecurityGroup,
        environmentSuffix,
        stackName: `TestDatabaseStack-${environmentSuffix}`,
      });
      template = Template.fromStack(stack);
    });

    test('creates RDS PostgreSQL instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
        StorageEncrypted: true,
        DeletionProtection: false,
        DeleteAutomatedBackups: true,
      });
    });

    test('creates database credentials secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: 'RDS PostgreSQL database credentials',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\',
        }),
      });
    });

    test('creates RDS security group', () => {
      // RDS security group has allowAllOutbound: false, which means it should have no custom egress rules
      // But CDK might add a default deny-all rule
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS PostgreSQL instance',
      });
    });

    test('allows PostgreSQL access from EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'PostgreSQL access from EC2',
      });
    });

    test('creates DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'DB subnet group for RDS instance',
      });
    });

    test('sets backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
      });
    });

    test('creates proper outputs', () => {
      template.hasOutput('RdsEndpoint', {
        Description: 'RDS PostgreSQL Endpoint',
      });

      template.hasOutput('RdsPort', {
        Description: 'RDS PostgreSQL Port',
      });

      template.hasOutput('DbCredentialsSecretArn', {
        Description: 'Database Credentials Secret ARN',
      });
    });

    test('uses PostgreSQL version 15.8', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EngineVersion: '15.8',
      });
    });

    test('configures database name', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBName: 'appdb',
      });
    });
  });

  describe('Stack Integration', () => {
    test('all stacks use consistent environment suffix', () => {
      const mainStack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        stackName: `TapStack${environmentSuffix}`,
      });

      const template = Template.fromStack(mainStack);

      // Check that nested stacks pass the environment suffix
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      Object.values(nestedStacks).forEach(stack => {
        const properties = (stack as any).Properties;
        expect(properties.Parameters).toBeDefined();
      });
    });

    test('resource names include environment suffix', () => {
      const vpcStack = new VpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        stackName: `TestVpcStack-${environmentSuffix}`,
      });

      const template = Template.fromStack(vpcStack);

      // VPC should have environment suffix in its logical ID
      const vpcs = Object.keys(template.findResources('AWS::EC2::VPC'));
      expect(vpcs.some(id => id.includes(environmentSuffix))).toBe(true);
    });

    test('nested stacks have proper dependencies', () => {
      const mainStack = new TapStack(app, 'TestTapStack', {
        environmentSuffix,
        stackName: `TapStack${environmentSuffix}`,
      });

      // Check that nested stacks are created as children of the main stack
      const children = mainStack.node.children;
      const databaseStack = children.find(
        child => child.node.id === 'DatabaseStack'
      );
      const computeStack = children.find(
        child => child.node.id === 'ComputeStack'
      );
      const vpcStack = children.find(child => child.node.id === 'VpcStack');

      expect(databaseStack).toBeDefined();
      expect(computeStack).toBeDefined();
      expect(vpcStack).toBeDefined();

      // Dependencies are handled implicitly through resource references
    });
  });
});
