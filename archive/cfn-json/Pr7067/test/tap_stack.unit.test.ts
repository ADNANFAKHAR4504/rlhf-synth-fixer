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
        AllowedPattern: '^[a-zA-Z0-9]+$'
      });
    });

    test('should have ContainerImage parameter', () => {
      template.hasParameter('ContainerImage', {
        Type: 'String',
        Default: 'nginx:latest',
        Description: Match.stringLikeRegexp('Docker container image')
      });
    });

    test('should have DBUsername parameter', () => {
      template.hasParameter('DBUsername', {
        Type: 'String',
        Default: 'admin',
        Description: Match.stringLikeRegexp('Master username'),
        MinLength: '1',
        MaxLength: '16',
        AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*'
      });
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC', () => {
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
          })
        ])
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Type',
            Value: 'Public'
          })
        ])
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Type',
            Value: 'Public'
          })
        ])
      });
    });

    test('should create private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.11.0/24',
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Type',
            Value: 'Private'
          })
        ])
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.12.0/24',
        Tags: Match.arrayWith([
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
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
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
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            SourceSecurityGroupId: Match.anyValue()
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
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
            SourceSecurityGroupId: Match.anyValue()
          })
        ])
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: Match.objectLike({
          'Fn::Sub': 'ALB-${EnvironmentSuffix}'
        }),
        Type: 'application',
        Scheme: 'internet-facing',
        IpAddressType: 'ipv4'
      });
    });

    test('should create ALB target group', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: Match.objectLike({
          'Fn::Sub': 'ALBTargetGroup-${EnvironmentSuffix}'
        }),
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/health',
        HealthCheckProtocol: 'HTTP'
      });
    });

    test('should create ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward'
          })
        ])
      });
    });

    test('should create ALB listener rules', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 1,
        Conditions: Match.arrayWith([
          Match.objectLike({
            Field: 'path-pattern',
            Values: ['/api/*']
          })
        ])
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule', {
        Priority: 2,
        Conditions: Match.arrayWith([
          Match.objectLike({
            Field: 'path-pattern',
            Values: ['/health']
          })
        ])
      });
    });
  });

  describe('RDS Aurora Resources', () => {
    test('should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupName: Match.objectLike({
          'Fn::Sub': 'DBSubnetGroup-${EnvironmentSuffix}'
        }),
        DBSubnetGroupDescription: 'Subnet group for RDS Aurora cluster'
      });
    });

    test('should create Aurora cluster', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        DBClusterIdentifier: Match.objectLike({
          'Fn::Sub': 'aurora-cluster-${EnvironmentSuffix}'
        }),
        Engine: 'aurora-mysql',
        EngineVersion: '8.0.mysql_aurora.3.04.0',
        DatabaseName: 'inventorydb',
        DeletionProtection: false,
        BackupRetentionPeriod: 7,
        EnableCloudwatchLogsExports: Match.arrayWith(['error', 'general', 'slowquery'])
      });
    });

    test('should create Aurora instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceIdentifier: Match.objectLike({
          'Fn::Sub': 'aurora-instance-${EnvironmentSuffix}'
        }),
        DBInstanceClass: 'db.t3.medium',
        Engine: 'aurora-mysql',
        PubliclyAccessible: false
      });
    });
  });

  describe('Secrets Manager', () => {
    test('should create database secret', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: Match.objectLike({
          'Fn::Sub': 'DBSecret-${EnvironmentSuffix}'
        }),
        Description: 'Database credentials for Aurora cluster',
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: Match.anyValue(),
          GenerateStringKey: 'password',
          PasswordLength: 32
        })
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

    test('should create ECS task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: Match.objectLike({
          'Fn::Sub': 'inventory-app-${EnvironmentSuffix}'
        }),
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: Match.arrayWith(['FARGATE']),
        Cpu: '1024',
        Memory: '2048',
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'inventory-app',
            Image: Match.anyValue(),
            Essential: true,
            PortMappings: Match.arrayWith([
              Match.objectLike({
                ContainerPort: 80,
                Protocol: 'tcp'
              })
            ]),
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

  describe('IAM Resources', () => {
    test('should create ECS task execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.objectLike({
          'Fn::Sub': 'ECSTaskExecutionRole-${EnvironmentSuffix}'
        }),
        AssumeRolePolicyDocument: Match.objectLike({
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
  });

  describe('CloudWatch Resources', () => {
    test('should create CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: Match.objectLike({
          'Fn::Sub': '/ecs/inventory-app-${EnvironmentSuffix}'
        }),
        RetentionInDays: 7
      });
    });
  });

  describe('Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Value: Match.anyValue(),
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
        Value: Match.anyValue(),
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
        Value: Match.anyValue(),
        Export: Match.objectLike({
          Name: Match.objectLike({
            'Fn::Sub': '${AWS::StackName}-RDSEndpoint'
          })
        })
      });
    });

    test('should export ECS cluster name', () => {
      template.hasOutput('ECSClusterName', {
        Description: 'Name of the ECS cluster',
        Value: Match.anyValue(),
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
        Value: Match.anyValue(),
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
        Value: Match.anyValue()
      });
    });
  });
});

