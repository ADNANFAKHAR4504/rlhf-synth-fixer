import { Match, Template } from 'aws-cdk-lib/assertions';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: Template;

  beforeEach(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const templateJson = JSON.parse(templateContent);
    template = Template.fromJSON(templateJson);
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      template.hasParameter('EnvironmentSuffix', {
        Type: 'String',
        Default: 'dev',
        Description: Match.stringLikeRegexp('Environment suffix'),
        AllowedPattern: '^[a-zA-Z0-9]+$',
        ConstraintDescription: Match.stringLikeRegexp('alphanumeric'),
      });
    });

    test('should have ContainerImage parameter', () => {
      template.hasParameter('ContainerImage', {
        Type: 'String',
        Default: 'nginx:latest',
        Description: Match.stringLikeRegexp('Docker container image'),
      });
    });

    test('should have DBUsername parameter', () => {
      template.hasParameter('DBUsername', {
        Type: 'String',
        Default: 'admin',
        Description: Match.stringLikeRegexp('Master username'),
        MinLength: '1',
        MaxLength: '16',
        AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*',
        ConstraintDescription: Match.stringLikeRegexp('alphanumeric'),
      });
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.objectLike({
              'Fn::Sub': 'VPC-${EnvironmentSuffix}'
            })
          }),
          Match.objectLike({
            Key: 'Environment',
            Value: Match.objectLike({
              Ref: 'EnvironmentSuffix'
            })
          })
        ])
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        VpcId: Match.objectLike({ Ref: 'VPC' }),
        CidrBlock: '10.0.1.0/24',
        AvailabilityZone: Match.objectLike({
          'Fn::Select': [0, Match.objectLike({ 'Fn::GetAZs': '' })]
        }),
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.objectLike({
              'Fn::Sub': 'PublicSubnet1-${EnvironmentSuffix}'
            })
          }),
          Match.objectLike({
            Key: 'Type',
            Value: 'Public'
          })
        ])
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        VpcId: Match.objectLike({ Ref: 'VPC' }),
        CidrBlock: '10.0.2.0/24',
        AvailabilityZone: Match.objectLike({
          'Fn::Select': [1, Match.objectLike({ 'Fn::GetAZs': '' })]
        }),
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.objectLike({
              'Fn::Sub': 'PublicSubnet2-${EnvironmentSuffix}'
            })
          }),
          Match.objectLike({
            Key: 'Type',
            Value: 'Public'
          })
        ])
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        VpcId: Match.objectLike({ Ref: 'VPC' }),
        CidrBlock: '10.0.11.0/24',
        AvailabilityZone: Match.objectLike({
          'Fn::Select': [0, Match.objectLike({ 'Fn::GetAZs': '' })]
        }),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.objectLike({
              'Fn::Sub': 'PrivateSubnet1-${EnvironmentSuffix}'
            })
          }),
          Match.objectLike({
            Key: 'Type',
            Value: 'Private'
          })
        ])
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        VpcId: Match.objectLike({ Ref: 'VPC' }),
        CidrBlock: '10.0.12.0/24',
        AvailabilityZone: Match.objectLike({
          'Fn::Select': [1, Match.objectLike({ 'Fn::GetAZs': '' })]
        }),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.objectLike({
              'Fn::Sub': 'PrivateSubnet2-${EnvironmentSuffix}'
            })
          }),
          Match.objectLike({
            Key: 'Type',
            Value: 'Private'
          })
        ])
      });
    });

    test('should create internet gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.objectLike({
              'Fn::Sub': 'IGW-${EnvironmentSuffix}'
            })
          })
        ])
      });
    });

    test('should create NAT gateways', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        AllocationId: Match.objectLike({
          'Fn::GetAtt': ['NATGateway1EIP', 'AllocationId']
        }),
        SubnetId: Match.objectLike({ Ref: 'PublicSubnet1' }),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.objectLike({
              'Fn::Sub': 'NATGW1-${EnvironmentSuffix}'
            })
          })
        ])
      });

      template.hasResourceProperties('AWS::EC2::NatGateway', {
        AllocationId: Match.objectLike({
          'Fn::GetAtt': ['NATGateway2EIP', 'AllocationId']
        }),
        SubnetId: Match.objectLike({ Ref: 'PublicSubnet2' }),
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.objectLike({
              'Fn::Sub': 'NATGW2-${EnvironmentSuffix}'
            })
          })
        ])
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.objectLike({
          'Fn::Sub': 'ALBSecurityGroup-${EnvironmentSuffix}'
        }),
        GroupDescription: 'Security group for Application Load Balancer',
        VpcId: Match.objectLike({ Ref: 'VPC' }),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          })
        ]),
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: '-1',
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('should create ECS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.objectLike({
          'Fn::Sub': 'ECSSecurityGroup-${EnvironmentSuffix}'
        }),
        GroupDescription: 'Security group for ECS tasks',
        VpcId: Match.objectLike({ Ref: 'VPC' }),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            SourceSecurityGroupId: Match.objectLike({ Ref: 'ALBSecurityGroup' })
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 3000,
            ToPort: 3000,
            SourceSecurityGroupId: Match.objectLike({ Ref: 'ALBSecurityGroup' })
          })
        ])
      });
    });

    test('should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.objectLike({
          'Fn::Sub': 'RDSSecurityGroup-${EnvironmentSuffix}'
        }),
        GroupDescription: 'Security group for RDS Aurora cluster',
        VpcId: Match.objectLike({ Ref: 'VPC' }),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
            SourceSecurityGroupId: Match.objectLike({ Ref: 'ECSSecurityGroup' })
          })
        ])
      });
    });
  });

  describe('Load Balancer', () => {
    test('should create application load balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: Match.objectLike({
          'Fn::Sub': 'ALB-${EnvironmentSuffix}'
        }),
        Type: 'application',
        Scheme: 'internet-facing',
        IpAddressType: 'ipv4',
        Subnets: Match.arrayWith([
          Match.objectLike({ Ref: 'PublicSubnet1' }),
          Match.objectLike({ Ref: 'PublicSubnet2' })
        ]),
        SecurityGroups: Match.arrayWith([
          Match.objectLike({ Ref: 'ALBSecurityGroup' })
        ])
      });
    });

    test('should create target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: Match.objectLike({
          'Fn::Sub': 'ALBTargetGroup-${EnvironmentSuffix}'
        }),
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        VpcId: Match.objectLike({ Ref: 'VPC' }),
        HealthCheckEnabled: true,
        HealthCheckPath: '/health',
        HealthCheckProtocol: 'HTTP',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        Matcher: Match.objectLike({
          HttpCode: '200'
        })
      });
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        LoadBalancerArn: Match.objectLike({ Ref: 'ApplicationLoadBalancer' }),
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
            TargetGroupArn: Match.objectLike({ Ref: 'ALBTargetGroup' })
          })
        ])
      });
    });

    test('should create listener rules', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        ListenerArn: Match.objectLike({ Ref: 'ALBListener' }),
        Priority: 1,
        Conditions: Match.arrayWith([
          Match.objectLike({
            Field: 'path-pattern',
            Values: ['/api/*']
          })
        ]),
        Actions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
            TargetGroupArn: Match.objectLike({ Ref: 'ALBTargetGroup' })
          })
        ])
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        ListenerArn: Match.objectLike({ Ref: 'ALBListener' }),
        Priority: 2,
        Conditions: Match.arrayWith([
          Match.objectLike({
            Field: 'path-pattern',
            Values: ['/health']
          })
        ]),
        Actions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
            TargetGroupArn: Match.objectLike({ Ref: 'ALBTargetGroup' })
          })
        ])
      });
    });
  });

  describe('Database Resources', () => {
    test('should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: Match.objectLike({
          'Fn::Sub': 'DBSubnetGroup-${EnvironmentSuffix}'
        }),
        DBSubnetGroupDescription: 'Subnet group for RDS Aurora cluster',
        SubnetIds: Match.arrayWith([
          Match.objectLike({ Ref: 'PrivateSubnet1' }),
          Match.objectLike({ Ref: 'PrivateSubnet2' })
        ])
      });
    });

    test('should create database secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: Match.objectLike({
          'Fn::Sub': Match.stringLikeRegexp('DBSecret-')
        }),
        Description: 'Database credentials for Aurora cluster',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.objectLike({
            'Fn::Sub': Match.stringLikeRegexp('username')
          }),
          GenerateStringKey: 'password',
          PasswordLength: 32,
          ExcludeCharacters: '"@/\\'
        })
      });
    });

    test('should create Aurora cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: Match.objectLike({
          'Fn::Sub': 'aurora-cluster-${EnvironmentSuffix}'
        }),
        Engine: 'aurora-mysql',
        EngineVersion: '8.0.mysql_aurora.3.04.0',
        MasterUsername: Match.objectLike({
          'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
        }),
        MasterUserPassword: Match.objectLike({
          'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
        }),
        DatabaseName: 'inventorydb',
        DBSubnetGroupName: Match.objectLike({ Ref: 'DBSubnetGroup' }),
        VpcSecurityGroupIds: Match.arrayWith([
          Match.objectLike({ Ref: 'RDSSecurityGroup' })
        ]),
        DeletionProtection: false,
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'mon:04:00-mon:05:00',
        EnableCloudwatchLogsExports: Match.arrayWith(['error', 'general', 'slowquery'])
      });
    });

    test('should create Aurora instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: Match.objectLike({
          'Fn::Sub': 'aurora-instance-${EnvironmentSuffix}'
        }),
        DBClusterIdentifier: Match.objectLike({ Ref: 'AuroraCluster' }),
        Engine: 'aurora-mysql',
        DBInstanceClass: 'db.t3.medium',
        PubliclyAccessible: false
      });
    });
  });

  describe('ECS Resources', () => {
    test('should create ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: Match.objectLike({
          'Fn::Sub': 'ECSCluster-${EnvironmentSuffix}'
        }),
        ClusterSettings: Match.arrayWith([
          Match.objectLike({
            Name: 'containerInsights',
            Value: 'enabled'
          })
        ])
      });
    });

    test('should create ECS task execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.objectLike({
          'Fn::Sub': 'ECSTaskExecutionRole-${EnvironmentSuffix}'
        }),
        AssumeRolePolicyDocument: Match.objectLike({
          Version: '2012-10-17',
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ecs-tasks.amazonaws.com'
              }),
              Action: 'sts:AssumeRole'
            })
          ])
        }),
        ManagedPolicyArns: Match.arrayWith([
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
        ])
      });
    });

    test('should create ECS task role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.objectLike({
          'Fn::Sub': 'ECSTaskRole-${EnvironmentSuffix}'
        }),
        AssumeRolePolicyDocument: Match.objectLike({
          Version: '2012-10-17',
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ecs-tasks.amazonaws.com'
              }),
              Action: 'sts:AssumeRole'
            })
          ])
        })
      });
    });

    test('should create CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.objectLike({
          'Fn::Sub': '/ecs/inventory-app-${EnvironmentSuffix}'
        }),
        RetentionInDays: 7
      });
    });

    test('should create ECS task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: Match.objectLike({
          'Fn::Sub': 'inventory-app-${EnvironmentSuffix}'
        }),
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: Match.arrayWith(['FARGATE']),
        Cpu: '1024',
        Memory: '2048',
        ExecutionRoleArn: Match.objectLike({
          'Fn::GetAtt': ['ECSTaskExecutionRole', 'Arn']
        }),
        TaskRoleArn: Match.objectLike({
          'Fn::GetAtt': ['ECSTaskRole', 'Arn']
        }),
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'inventory-app',
            Image: Match.objectLike({ Ref: 'ContainerImage' }),
            Essential: true,
            PortMappings: Match.arrayWith([
              Match.objectLike({
                ContainerPort: 80,
                Protocol: 'tcp'
              })
            ]),
            Environment: Match.arrayWith([
              Match.objectLike({
                Name: 'DB_HOST',
                Value: Match.objectLike({
                  'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address']
                })
              }),
              Match.objectLike({
                Name: 'DB_PORT',
                Value: '3306'
              }),
              Match.objectLike({
                Name: 'DB_NAME',
                Value: 'inventorydb'
              })
            ]),
            Secrets: Match.arrayWith([
              Match.objectLike({
                Name: 'DB_USERNAME',
                ValueFrom: Match.objectLike({
                  'Fn::Sub': '${DBSecret}:username::'
                })
              }),
              Match.objectLike({
                Name: 'DB_PASSWORD',
                ValueFrom: Match.objectLike({
                  'Fn::Sub': '${DBSecret}:password::'
                })
              })
            ]),
            LogConfiguration: Match.objectLike({
              LogDriver: 'awslogs',
              Options: Match.objectLike({
                'awslogs-group': Match.objectLike({ Ref: 'CloudWatchLogGroup' }),
                'awslogs-region': Match.objectLike({ Ref: 'AWS::Region' }),
                'awslogs-stream-prefix': 'ecs'
              })
            }),
            HealthCheck: Match.objectLike({
              Command: Match.arrayWith([
                'CMD-SHELL',
                'curl -f http://localhost/health || exit 1'
              ]),
              Interval: 30,
              Timeout: 5,
              Retries: 3,
              StartPeriod: 60
            })
          })
        ])
      });
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Value: Match.objectLike({ Ref: 'VPC' }),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': '${AWS::StackName}-VPCId'
          })
        })
      });
    });

    test('should export ALB DNS name', () => {
      template.hasOutput('ALBDNSName', {
        Description: 'DNS name of the Application Load Balancer',
        Value: Match.objectLike({
          'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
        }),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': '${AWS::StackName}-ALBDNSName'
          })
        })
      });
    });

    test('should export ALB URL', () => {
      template.hasOutput('ALBUrl', {
        Description: 'URL of the Application Load Balancer',
        Value: Match.objectLike({
          'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}'
        })
      });
    });

    test('should export RDS endpoint', () => {
      template.hasOutput('RDSEndpoint', {
        Description: 'RDS Aurora cluster endpoint',
        Value: Match.objectLike({
          'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address']
        }),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': '${AWS::StackName}-RDSEndpoint'
          })
        })
      });
    });

    test('should export RDS port', () => {
      template.hasOutput('RDSPort', {
        Description: 'RDS Aurora cluster port',
        Value: Match.objectLike({
          'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Port']
        })
      });
    });

    test('should export ECS cluster name', () => {
      template.hasOutput('ECSClusterName', {
        Description: 'Name of the ECS cluster',
        Value: Match.objectLike({ Ref: 'ECSCluster' }),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': '${AWS::StackName}-ECSClusterName'
          })
        })
      });
    });

    test('should export secret ARN', () => {
      template.hasOutput('SecretArn', {
        Description: 'ARN of the database credentials secret',
        Value: Match.objectLike({ Ref: 'DBSecret' }),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': '${AWS::StackName}-SecretArn'
          })
        })
      });
    });

    test('should export environment suffix', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix used for this deployment',
        Value: Match.objectLike({ Ref: 'EnvironmentSuffix' })
      });
    });
  });
});
