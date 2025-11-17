import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import { DatabaseStack } from '../lib/database-stack';

describe('DatabaseStack', () => {
  const app = new cdk.App();
  const environmentSuffix = 'test123';

  // Create VPC for testing
  const vpcStack = new cdk.Stack(app, 'TestVpcStack');
  const vpc = new ec2.Vpc(vpcStack, 'TestVpc', {
    maxAzs: 3,
  });

  // Create SNS topic for testing
  const alertTopic = new sns.Topic(vpcStack, 'TestTopic');

  const stack = new DatabaseStack(app, 'TestDatabaseStack', {
    environmentSuffix: environmentSuffix,
    vpc: vpc,
    alertTopic: alertTopic,
  });

  const template = Template.fromStack(stack);

  test('RDS instance created with correct configuration', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      DBInstanceIdentifier: `trading-db-${environmentSuffix}`,
      Engine: 'postgres',
      EngineVersion: Match.stringLikeRegexp('15\\.4'),
      DBInstanceClass: 'db.r6g.large',
      MultiAZ: true,
      AllocatedStorage: '100',
      StorageType: 'gp3',
      DeletionProtection: false,
    });
  });

  test('RDS has skipFinalSnapshot set to true', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      SkipFinalSnapshot: true,
    });
  });

  test('RDS subnet group created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupName: `db-subnet-group-${environmentSuffix}`,
      DBSubnetGroupDescription: 'Subnet group for RDS',
    });
  });

  test('RDS security group created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for RDS PostgreSQL',
      GroupName: `db-sg-${environmentSuffix}`,
    });
  });

  test('Redis cluster created with correct configuration', () => {
    template.hasResourceProperties('AWS::ElastiCache::CacheCluster', {
      ClusterName: `trading-redis-${environmentSuffix}`,
      Engine: 'redis',
      CacheNodeType: 'cache.t3.micro',
      NumCacheNodes: 1,
      EngineVersion: '7.0',
    });
  });

  test('Redis subnet group created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
      CacheSubnetGroupName: `redis-subnet-${environmentSuffix}`,
      Description: 'Subnet group for Redis',
    });
  });

  test('Redis security group created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ElastiCache Redis',
      GroupName: `redis-sg-${environmentSuffix}`,
    });
  });

  test('Migration Lambda function created', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      FunctionName: `db-migration-${environmentSuffix}`,
      Runtime: 'nodejs18.x',
      Handler: 'index.handler',
      Timeout: 900, // 15 minutes
    });
  });

  test('Migration Lambda role created with environmentSuffix', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      RoleName: `migration-lambda-role-${environmentSuffix}`,
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          }),
        ]),
      }),
    });
  });

  test('Migration Lambda has VPC configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      VpcConfig: Match.objectLike({
        SubnetIds: Match.anyValue(),
        SecurityGroupIds: Match.anyValue(),
      }),
    });
  });

  test('CloudWatch log group created with 30-day retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: Match.stringLikeRegexp('/aws/rds/instance/trading-db-.*'),
      RetentionInDays: 30,
    });
  });

  test('RDS CPU alarm created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'CPUUtilization',
      Namespace: 'AWS/RDS',
      Threshold: 80,
      EvaluationPeriods: 2,
      DatapointsToAlarm: 2,
    });
  });

  test('Security group ingress rules for PostgreSQL', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 5432,
      ToPort: 5432,
    });
  });

  test('Security group ingress rules for Redis', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      IpProtocol: 'tcp',
      FromPort: 6379,
      ToPort: 6379,
    });
  });

  test('RDS endpoint output exported with environmentSuffix', () => {
    template.hasOutput('RDSEndpoint', {
      Export: {
        Name: `RDSEndpoint-${environmentSuffix}`,
      },
    });
  });

  test('Redis endpoint output exported with environmentSuffix', () => {
    template.hasOutput('RedisEndpoint', {
      Export: {
        Name: `RedisEndpoint-${environmentSuffix}`,
      },
    });
  });

  test('Migration Lambda ARN output exported with environmentSuffix', () => {
    template.hasOutput('MigrationLambdaArn', {
      Export: {
        Name: `MigrationLambdaArn-${environmentSuffix}`,
      },
    });
  });

  test('Backup retention set to 7 days', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 7,
    });
  });
});
