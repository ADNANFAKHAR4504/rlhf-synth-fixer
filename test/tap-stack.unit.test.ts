import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Use environment variables like the actual implementation
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Mock VPC lookup to avoid actual AWS API calls during testing
    jest.spyOn(cdk.Fn, 'importValue').mockReturnValue('mocked-value');

    app = new cdk.App({
      context: {
        // Mock VPC lookup context to avoid actual AWS calls
        'vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true':
          {
            vpcId: 'vpc-12345',
            vpcCidrBlock: '10.0.0.0/16',
            availabilityZones: ['us-east-1a', 'us-east-1b'],
            subnetGroups: [
              {
                name: 'Public',
                type: 'Public',
                subnets: [
                  {
                    subnetId: 'subnet-12345',
                    availabilityZone: 'us-east-1a',
                    routeTableId: 'rt-12345',
                  },
                  {
                    subnetId: 'subnet-67890',
                    availabilityZone: 'us-east-1b',
                    routeTableId: 'rt-67890',
                  },
                ],
              },
            ],
          },
      },
    });

    // Use CDK environment variables like the actual implementation
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
      },
    });

    template = Template.fromStack(stack);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('KMS Key Configuration', () => {
    test('should create a KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for encrypting EBS volumes and RDS database',
        EnableKeyRotation: true,
        KeyPolicy: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue(),
              },
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        },
      });
    });

    test('should create a KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/tap-${environmentSuffix}-key`,
        TargetKeyId: Match.anyValue(),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
          },
        ],
      });
    });

    test('should create EC2 security group with ALB access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });

      // Check for security group ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 80,
        IpProtocol: 'tcp',
        ToPort: 80,
        SourceSecurityGroupId: Match.anyValue(),
      });
    });

    test('should create RDS security group with MySQL access from EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '255.255.255.255/32',
            IpProtocol: 'icmp',
          }),
        ]),
      });

      // Check for RDS security group ingress rule
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 3306,
        IpProtocol: 'tcp',
        ToPort: 3306,
        SourceSecurityGroupId: Match.anyValue(),
      });
    });
  });

  describe('IAM Role for EC2', () => {
    test('should create EC2 role with proper managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: Match.arrayWith([
          // Check for SSM managed instance core policy
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '', // The delimiter (empty string)
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore'),
              ]),
            ]),
          }),
          // Check for CloudWatch agent policy
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '', // The delimiter (empty string)
              Match.arrayWith([
                Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('should create instance profiles for EC2 role', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 2); // One for each EC2 instance
    });
  });

  describe('EC2 Instances', () => {
    test('should create EC2 instances with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              Encrypted: true,
              KmsKeyId: Match.anyValue(),
              VolumeSize: 20,
              VolumeType: 'gp3',
            },
          },
        ],
        IamInstanceProfile: Match.anyValue(),
        SecurityGroupIds: [Match.anyValue()],
        UserData: Match.anyValue(),
      });
    });

    test('should create two EC2 instances across different AZs', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);

      // Check instances are in different AZs
      const instances = template.findResources('AWS::EC2::Instance');
      const instanceKeys = Object.keys(instances);
      expect(instanceKeys).toHaveLength(2);

      const instance1 = instances[instanceKeys[0]];
      const instance2 = instances[instanceKeys[1]];

      expect(instance1.Properties.AvailabilityZone).toBeDefined();
      expect(instance2.Properties.AvailabilityZone).toBeDefined();
      expect(instance1.Properties.AvailabilityZone).not.toBe(
        instance2.Properties.AvailabilityZone
      );
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          LoadBalancerAttributes: Match.arrayWith([
            {
              Key: 'deletion_protection.enabled',
              Value: 'false',
            },
          ]),
          Name: `tap-${environmentSuffix}-alb`,
          Scheme: 'internet-facing',
          SecurityGroups: [Match.anyValue()],
          Type: 'application',
        }
      );
    });

    test('should create target group with health check configuration', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: `tap-${environmentSuffix}-tg`,
          Port: 80,
          Protocol: 'HTTP',
          TargetType: 'instance',
          HealthCheckEnabled: true,
          HealthCheckIntervalSeconds: 30,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          Matcher: {
            HttpCode: '200',
          },
          UnhealthyThresholdCount: 3,
          Targets: Match.arrayWith([
            { Id: Match.anyValue() },
            { Id: Match.anyValue() },
          ]),
        }
      );
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        DefaultActions: [
          {
            TargetGroupArn: Match.anyValue(),
            Type: 'forward',
          },
        ],
        LoadBalancerArn: Match.anyValue(),
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
        DBSubnetGroupName: `tap-${environmentSuffix}-db-subnet-group`,
        SubnetIds: Match.anyValue(),
      });
    });

    test('should create RDS instance with Multi-AZ and encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.micro',
        DBInstanceIdentifier: `tap-${environmentSuffix}-database`,
        DBName: 'tapdb',
        Engine: 'mysql',
        MultiAZ: true,
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: false,
        DeletionProtection: false,
        AllocatedStorage: '20',
        StorageType: 'gp3',
        AutoMinorVersionUpgrade: true,
        VPCSecurityGroups: [Match.anyValue()],
        MasterUsername: 'admin',
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create EC2 status check alarms', () => {
      // Test that status check alarms exist (recovery actions are added in the stack)
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('.*status check failed.*'),
        MetricName: 'StatusCheckFailed',
        Namespace: 'AWS/EC2',
        Statistic: 'Maximum',
        Threshold: 1,
        EvaluationPeriods: 2,
        TreatMissingData: 'breaching',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create EC2 CPU utilization alarms', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmDescription: Match.stringLikeRegexp('.*High CPU utilization.*'),
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create RDS CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-${environmentSuffix}-rds-cpu`,
        AlarmDescription: 'RDS high CPU utilization',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create RDS database connections alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-${environmentSuffix}-db-connections`,
        AlarmDescription: 'High database connection count',
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create ALB response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `tap-${environmentSuffix}-alb-response-time`,
        AlarmDescription: 'ALB target response time too high',
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        Statistic: 'Average',
        Threshold: 1,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should create LoadBalancerDNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
        Export: {
          Name: `tap-${environmentSuffix}-alb-dns`,
        },
      });
    });

    test('should create DatabaseEndpoint output', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
        Export: {
          Name: `tap-${environmentSuffix}-db-endpoint`,
        },
      });
    });

    test('should create KMSKeyId output', () => {
      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
        Export: {
          Name: `tap-${environmentSuffix}-kms-key-id`,
        },
      });
    });

    test('should create RDSSubnetType output', () => {
      template.hasOutput('RDSSubnetType', {
        Description: 'Subnet type used for RDS deployment',
        Export: {
          Name: `tap-${environmentSuffix}-rds-subnet-type`,
        },
      });
    });
  });

  describe('Resource Counting', () => {
    test('should create expected number of security groups', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 3);
    });

    test('should create expected number of CloudWatch alarms', () => {
      // 2 status check + 2 CPU + 1 RDS CPU + 1 RDS connections + 1 ALB response time = 7 alarms
      template.resourceCountIs('AWS::CloudWatch::Alarm', 7);
    });

    test('should create one KMS key', () => {
      template.resourceCountIs('AWS::KMS::Key', 1);
    });

    test('should create one RDS instance', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('should create one Application Load Balancer', () => {
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    });

    test('should create two EC2 instances', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
    });
  });

  describe('Naming Convention', () => {
    test('should follow project-stage-resource naming convention', () => {
      // Test that resource names follow the expected pattern
      const resources = template.toJSON().Resources;

      // Check KMS Key alias follows naming convention
      const kmsAliases = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::KMS::Alias'
      );
      expect(kmsAliases).toHaveLength(1);
      expect((kmsAliases[0] as any).Properties.AliasName).toBe(
        `alias/tap-${environmentSuffix}-key`
      );

      // Check ALB name follows naming convention
      const loadBalancers = Object.values(resources).filter(
        (resource: any) =>
          resource.Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(loadBalancers).toHaveLength(1);
      expect((loadBalancers[0] as any).Properties.Name).toBe(
        `tap-${environmentSuffix}-alb`
      );

      // Check RDS instance name follows naming convention
      const rdsInstances = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::RDS::DBInstance'
      );
      expect(rdsInstances).toHaveLength(1);
      expect((rdsInstances[0] as any).Properties.DBInstanceIdentifier).toBe(
        `tap-${environmentSuffix}-database`
      );
    });
  });

  describe('Stack Tags', () => {
    test('should apply proper tags to stack resources', () => {
      // Check that resources have proper tags by examining individual resources
      const resources = template.findResources('AWS::KMS::Key');
      const kmsKeyResource = Object.values(resources)[0] as any;

      expect(kmsKeyResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Project', Value: 'tap' }),
          expect.objectContaining({
            Key: 'Environment',
            Value: environmentSuffix,
          }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
        ])
      );
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use provided environment suffix', () => {
      const customApp = new cdk.App({
        context: {
          'vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true':
            {
              vpcId: 'vpc-12345',
              vpcCidrBlock: '10.0.0.0/16',
              availabilityZones: ['us-east-1a', 'us-east-1b'],
              subnetGroups: [
                {
                  name: 'Public',
                  type: 'Public',
                  subnets: [
                    {
                      subnetId: 'subnet-12345',
                      availabilityZone: 'us-east-1a',
                      routeTableId: 'rt-12345',
                    },
                    {
                      subnetId: 'subnet-67890',
                      availabilityZone: 'us-east-1b',
                      routeTableId: 'rt-67890',
                    },
                  ],
                },
              ],
            },
        },
      });

      const customStack = new TapStack(customApp, 'TestStackCustom', {
        environmentSuffix: 'custom',
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
          region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
        },
      });

      const customTemplate = Template.fromStack(customStack);

      // Should use custom environment suffix in resource names
      // CDK automatically prefixes with stack name, so check for the construct path
      customTemplate.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*tap-custom-instance-1.*'),
          },
        ]),
      });
    });

    test('should use context environment suffix when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
          'vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true':
            {
              vpcId: 'vpc-12345',
              vpcCidrBlock: '10.0.0.0/16',
              availabilityZones: ['us-east-1a', 'us-east-1b'],
              subnetGroups: [
                {
                  name: 'Public',
                  type: 'Public',
                  subnets: [
                    {
                      subnetId: 'subnet-12345',
                      availabilityZone: 'us-east-1a',
                      routeTableId: 'rt-12345',
                    },
                    {
                      subnetId: 'subnet-67890',
                      availabilityZone: 'us-east-1b',
                      routeTableId: 'rt-67890',
                    },
                  ],
                },
              ],
            },
        },
      });

      const contextStack = new TapStack(contextApp, 'TestStackContext', {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
          region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);

      // Should use context environment suffix
      contextTemplate.hasResourceProperties('AWS::EC2::Instance', {
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*tap-context-env-instance-1.*'),
          },
        ]),
      });
    });
  });

  describe('Subnet Selection Logic', () => {
    test('should use private subnets when available', () => {
      const privateSubnetApp = new cdk.App({
        context: {
          'vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true':
            {
              vpcId: 'vpc-12345',
              vpcCidrBlock: '10.0.0.0/16',
              availabilityZones: ['us-east-1a', 'us-east-1b'],
              subnetGroups: [
                {
                  name: 'Public',
                  type: 'Public',
                  subnets: [
                    {
                      subnetId: 'subnet-public-1',
                      availabilityZone: 'us-east-1a',
                      routeTableId: 'rt-public-1',
                    },
                    {
                      subnetId: 'subnet-public-2',
                      availabilityZone: 'us-east-1b',
                      routeTableId: 'rt-public-2',
                    },
                  ],
                },
                {
                  name: 'Private',
                  type: 'Private',
                  subnets: [
                    {
                      subnetId: 'subnet-private-1',
                      availabilityZone: 'us-east-1a',
                      routeTableId: 'rt-private-1',
                    },
                    {
                      subnetId: 'subnet-private-2',
                      availabilityZone: 'us-east-1b',
                      routeTableId: 'rt-private-2',
                    },
                  ],
                },
              ],
            },
        },
      });

      const privateStack = new TapStack(privateSubnetApp, 'TestStackPrivate', {
        environmentSuffix: 'private-test',
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
          region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
        },
      });

      const privateTemplate = Template.fromStack(privateStack);

      // Should create RDS subnet group (description is static, not subnet-type specific)
      privateTemplate.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
        SubnetIds: ['subnet-private-1', 'subnet-private-2'],
      });

      // Should output that private subnets are being used
      privateTemplate.hasOutput('RDSSubnetType', {
        Value: 'Private',
      });
    });

    test('should use isolated subnets when private not available', () => {
      const isolatedSubnetApp = new cdk.App({
        context: {
          'vpc-provider:account=123456789012:filter.isDefault=true:region=us-east-1:returnAsymmetricSubnets=true':
            {
              vpcId: 'vpc-12345',
              vpcCidrBlock: '10.0.0.0/16',
              availabilityZones: ['us-east-1a', 'us-east-1b'],
              subnetGroups: [
                {
                  name: 'Public',
                  type: 'Public',
                  subnets: [
                    {
                      subnetId: 'subnet-public-1',
                      availabilityZone: 'us-east-1a',
                      routeTableId: 'rt-public-1',
                    },
                    {
                      subnetId: 'subnet-public-2',
                      availabilityZone: 'us-east-1b',
                      routeTableId: 'rt-public-2',
                    },
                  ],
                },
                {
                  name: 'Isolated',
                  type: 'Isolated',
                  subnets: [
                    {
                      subnetId: 'subnet-isolated-1',
                      availabilityZone: 'us-east-1a',
                      routeTableId: 'rt-isolated-1',
                    },
                    {
                      subnetId: 'subnet-isolated-2',
                      availabilityZone: 'us-east-1b',
                      routeTableId: 'rt-isolated-2',
                    },
                  ],
                },
              ],
            },
        },
      });

      const isolatedStack = new TapStack(
        isolatedSubnetApp,
        'TestStackIsolated',
        {
          environmentSuffix: 'isolated-test',
          env: {
            account: process.env.CDK_DEFAULT_ACCOUNT || '123456789012',
            region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
          },
        }
      );

      const isolatedTemplate = Template.fromStack(isolatedStack);

      // Should create RDS subnet group (description is static, not subnet-type specific)
      isolatedTemplate.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
        SubnetIds: ['subnet-isolated-1', 'subnet-isolated-2'],
      });

      // Should output that isolated subnets are being used
      isolatedTemplate.hasOutput('RDSSubnetType', {
        Value: 'Isolated',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should enable IMDSv2 on EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          MetadataOptions: {
            HttpTokens: 'required',
          },
        },
      });
    });

    test('should encrypt EBS volumes with KMS', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        BlockDeviceMappings: [
          {
            DeviceName: '/dev/xvda',
            Ebs: {
              Encrypted: true,
              KmsKeyId: Match.anyValue(),
            },
          },
        ],
      });
    });

    test('should encrypt RDS storage with KMS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
      });
    });

    test('should enable RDS backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: false,
      });
    });
  });
});
