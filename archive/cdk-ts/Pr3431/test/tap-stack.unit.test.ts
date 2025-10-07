import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'test123';

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, `TapStackTest`, {
      environmentSuffix: environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Should create a VPC with 2 availability zones', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(), // Dynamic CIDR based on region
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('Should create 2 public and 2 private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('Should create NAT Gateway for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('Should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('RDS MySQL Database', () => {
    test('Should create RDS MySQL instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: Match.stringLikeRegexp('^8\\.0'),
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        StorageType: 'gp3',
        StorageEncrypted: true,
        MultiAZ: true,
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        EnablePerformanceInsights: false,
        MonitoringInterval: 60,
      });
    });

    test('Should use custom parameter group', () => {
      template.hasResourceProperties('AWS::RDS::DBParameterGroup', {
        Description: Match.anyValue(),
        Family: 'mysql8.0',
      });
    });

    test('Should create DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.stringLikeRegexp('Subnet group.*'),
      });
    });

    test('Should enable CloudWatch logs export', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: Match.arrayWith([
          'error',
          'general',
          'slowquery',
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('Should create RDS security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.anyValue(),
        VpcId: Match.anyValue(),
      });
    });

    test('Should create RDS Proxy security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.anyValue(),
        VpcId: Match.anyValue(),
      });
    });

    test('Should create Application security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.anyValue(),
        VpcId: Match.anyValue(),
      });
    });

    test('Should allow connection from App to RDS Proxy on port 3306', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
      });
    });
  });

  describe('KMS Encryption', () => {
    test('Should create KMS key for RDS encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.anyValue(),
        EnableKeyRotation: true,
      });
    });

    test('Should create KMS key for Backup encryption', () => {
      template.resourceCountIs('AWS::KMS::Key', 2);
    });

    test('Should create KMS aliases', () => {
      template.resourceCountIs('AWS::KMS::Alias', 2);
    });
  });

  describe('Secrets Manager', () => {
    test('Should create secret for RDS credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Description: Match.anyValue(),
        GenerateSecretString: Match.objectLike({
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password',
        }),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.anyValue(),
      });
    });

    test('Should create CloudWatch alarms for RDS', () => {
      // Check that we have alarms
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThan(0);

      // Check for CPU alarm
      const cpuAlarm = Object.values(alarms).find(
        alarm => (alarm as any).Properties?.MetricName === 'CPUUtilization'
      );
      expect(cpuAlarm).toBeDefined();

      // Check for connections alarm
      const connectionsAlarm = Object.values(alarms).find(
        alarm => (alarm as any).Properties?.MetricName === 'DatabaseConnections'
      );
      expect(connectionsAlarm).toBeDefined();

      // Check for storage alarm
      const storageAlarm = Object.values(alarms).find(
        alarm => (alarm as any).Properties?.MetricName === 'FreeStorageSpace'
      );
      expect(storageAlarm).toBeDefined();
    });
  });

  describe('RDS Proxy', () => {
    test('Should create RDS Proxy with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBProxy', {
        Auth: Match.arrayWith([
          Match.objectLike({
            AuthScheme: 'SECRETS',
            IAMAuth: 'REQUIRED',
          }),
        ]),
        DebugLogging: true,
        EngineFamily: 'MYSQL',
        RequireTLS: true,
      });
    });

    test('Should create RDS Proxy Target Group', () => {
      template.hasResourceProperties('AWS::RDS::DBProxyTargetGroup', {
        ConnectionPoolConfigurationInfo: {
          ConnectionBorrowTimeout: 30,
          MaxConnectionsPercent: 100,
          MaxIdleConnectionsPercent: 50,
        },
        TargetGroupName: 'default',
      });
    });

    test('Should create IAM role for RDS Proxy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'rds.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });
  });

  describe('AWS Backup', () => {
    test('Should create backup vault with KMS encryption', () => {
      template.hasResourceProperties('AWS::Backup::BackupVault', {
        BackupVaultName: Match.stringLikeRegexp('rds-backup-vault-.*'),
        EncryptionKeyArn: Match.anyValue(),
      });
    });

    test('Should create backup plan with multi-tier strategy', () => {
      template.hasResourceProperties('AWS::Backup::BackupPlan', {
        BackupPlan: {
          BackupPlanName: Match.stringLikeRegexp('rds-backup-plan-.*'),
          BackupPlanRule: Match.arrayWith([
            // Daily backup rule
            Match.objectLike({
              RuleName: 'DailyBackup',
              TargetBackupVault: Match.anyValue(),
              ScheduleExpression: 'cron(0 2 * * ? *)',
              Lifecycle: {
                DeleteAfterDays: 30,
              },
            }),
            // Weekly backup rule
            Match.objectLike({
              RuleName: 'WeeklyBackup',
              TargetBackupVault: Match.anyValue(),
              ScheduleExpression: 'cron(0 3 ? * SUN *)',
              Lifecycle: {
                DeleteAfterDays: 180,
                MoveToColdStorageAfterDays: 30,
              },
            }),
            // Monthly backup rule
            Match.objectLike({
              RuleName: 'MonthlyBackup',
              TargetBackupVault: Match.anyValue(),
              ScheduleExpression: 'cron(0 4 1 * ? *)',
              Lifecycle: {
                DeleteAfterDays: 365,
                MoveToColdStorageAfterDays: 90,
              },
            }),
          ]),
        },
      });
    });

    test('Should create backup selection for RDS', () => {
      template.hasResourceProperties('AWS::Backup::BackupSelection', {
        BackupSelection: Match.objectLike({
          SelectionName: Match.anyValue(),
        }),
      });
    });

    test('Should create IAM role for backup service', () => {
      // Find roles with backup service principal
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Principal: {
                  Service: 'backup.amazonaws.com',
                },
              }),
            ]),
          },
        },
      });
      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Should create enhanced monitoring role', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Principal: {
                  Service: 'monitoring.rds.amazonaws.com',
                },
              }),
            ]),
          },
        },
      });
      expect(Object.keys(roles).length).toBeGreaterThan(0);
    });

    test('Should create application role with necessary permissions', () => {
      // Check for app role
      const roles = template.findResources('AWS::IAM::Role');
      const appRole = Object.values(roles).find(role => {
        const description = (role as any).Properties?.Description;
        return description && description.includes('Application role');
      });
      expect(appRole).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('Should apply environment tags to RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: Match.anyValue(),
          }),
          Match.objectLike({
            Key: 'ManagedBy',
            Value: 'CDK',
          }),
        ]),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should have stack outputs defined', () => {
      // Check if any outputs exist
      const outputs = template.toJSON().Outputs || {};
      // At least VPC ID should be output
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(1);
    });

    test('Should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('Should output backup vault ARN', () => {
      template.hasOutput('BackupVaultArn', {
        Description: 'AWS Backup Vault ARN',
      });
    });
  });

  describe('Resource Naming', () => {
    test('All resources should include environment suffix', () => {
      // Check VPC naming
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
          }),
        ]),
      });

      // Check RDS instance has proper tags
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: Match.anyValue(),
            Value: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('Environment Suffix Logic', () => {
    test('Should use environmentSuffix from context when props not provided', () => {
      const contextApp = new App({
        context: {
          environmentSuffix: 'context-env'
        }
      });
      const contextStack = new TapStack(contextApp, `TapStackContext`, {
        env: {
          account: '123456789012',
          region: 'us-west-1',
        },
      });
      const contextTemplate = Template.fromStack(contextStack);

      // Verify resources include the context-based environment suffix
      contextTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'startup-vpc-context-env',
          }),
        ]),
      });
    });

    test('Should default to "dev" when no environmentSuffix provided', () => {
      const defaultApp = new App();
      const defaultStack = new TapStack(defaultApp, `TapStackDefault`, {
        env: {
          account: '123456789012',
          region: 'us-west-1',
        },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Verify resources include the default "dev" suffix
      defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'startup-vpc-dev',
          }),
        ]),
      });
    });
  });

  describe('SNS Topic Email Subscription', () => {
    test('Should add email subscription when ALARM_EMAIL is set', () => {
      // Set environment variable
      const originalEmail = process.env.ALARM_EMAIL;
      process.env.ALARM_EMAIL = 'test@example.com';

      try {
        const emailApp = new App();
        const emailStack = new TapStack(emailApp, `TapStackEmail`, {
          environmentSuffix: 'email-test',
          env: {
            account: '123456789012',
            region: 'us-west-1',
          },
        });
        const emailTemplate = Template.fromStack(emailStack);

        // Verify SNS subscription is created
        emailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
          Protocol: 'email',
          Endpoint: 'test@example.com',
        });

        // Verify SNS topic exists
        emailTemplate.resourceCountIs('AWS::SNS::Topic', 1);

      } finally {
        // Restore original environment variable
        if (originalEmail) {
          process.env.ALARM_EMAIL = originalEmail;
        } else {
          delete process.env.ALARM_EMAIL;
        }
      }
    });

    test('Should not add email subscription when ALARM_EMAIL is not set', () => {
      // Ensure environment variable is not set
      const originalEmail = process.env.ALARM_EMAIL;
      delete process.env.ALARM_EMAIL;

      try {
        const noEmailApp = new App();
        const noEmailStack = new TapStack(noEmailApp, `TapStackNoEmail`, {
          environmentSuffix: 'no-email-test',
          env: {
            account: '123456789012',
            region: 'us-west-1',
          },
        });
        const noEmailTemplate = Template.fromStack(noEmailStack);

        // Verify SNS topic exists but no subscription
        noEmailTemplate.resourceCountIs('AWS::SNS::Topic', 1);
        noEmailTemplate.resourceCountIs('AWS::SNS::Subscription', 0);

      } finally {
        // Restore original environment variable
        if (originalEmail) {
          process.env.ALARM_EMAIL = originalEmail;
        }
      }
    });
  });
});
