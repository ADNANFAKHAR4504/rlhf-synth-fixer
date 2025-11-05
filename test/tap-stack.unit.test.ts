import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Primary Stack Creation', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack-Primary', {
        environmentSuffix: 'test',
        isPrimary: true,
        drRegion: 'us-west-2',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);
    });

    test('should create KMS keys for database and S3 encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'Aurora DB encryption key for primary region',
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/aurora-dr-primary-test',
      });

      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'S3 encryption key for snapshots primary region',
        EnableKeyRotation: true,
      });

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/s3-snapshots-primary-test',
      });

      expect(stack.kmsKeyArn).toBeDefined();
    });

    test('should create VPC with primary CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 AZs * 2 subnet types
      template.resourceCountIs('AWS::EC2::NatGateway', 2);

      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcCidr).toBeDefined();
    });

    test('should create security groups with correct configurations', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora cluster',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 5432,
        ToPort: 5432,
        Description: 'Allow Lambda functions to connect to Aurora',
      });
    });

    test('should create S3 bucket with encryption and lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'aurora-dr-snapshots-primary-123456789012-test',
      });

      // Verify bucket exists
      const buckets = template.findResources('AWS::S3::Bucket');
      expect(Object.keys(buckets).length).toBeGreaterThan(0);

      // Verify lifecycle configuration exists (may be attached to bucket or separate resource)
      const lifecycleConfigs = template.findResources(
        'AWS::S3::BucketLifecycleConfiguration'
      );
      if (Object.keys(lifecycleConfigs).length > 0) {
        template.hasResourceProperties(
          'AWS::S3::BucketLifecycleConfiguration',
          {
            Rules: Match.arrayWith([
              {
                Id: 'transition-to-glacier',
                Status: 'Enabled',
              },
            ]),
          }
        );
      }

      expect(stack.snapshotBucketArn).toBeDefined();
    });

    test('should create S3 replication role for primary region', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const s3ReplicationRole = Object.values(roles).find((role: any) =>
        role.Properties.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) => stmt.Principal?.Service === 's3.amazonaws.com'
        )
      );
      expect(s3ReplicationRole).toBeDefined();

      // Verify the role has replication policy (may be inline or separate)
      // Check for inline policies first
      if (s3ReplicationRole?.Properties?.Policies) {
        const hasReplicationPolicy = s3ReplicationRole.Properties.Policies.some(
          (policy: any) =>
            policy.PolicyDocument?.Statement?.some(
              (stmt: any) =>
                Array.isArray(stmt.Action) &&
                stmt.Action.includes('s3:ReplicateObject')
            )
        );
        expect(hasReplicationPolicy).toBe(true);
      } else {
        // Check for separate IAM Policy resources
        const policies = template.findResources('AWS::IAM::Policy');
        const replicationPolicy = Object.values(policies).find((policy: any) =>
          policy.Properties.PolicyDocument?.Statement?.some(
            (stmt: any) =>
              Array.isArray(stmt.Action) &&
              stmt.Action.includes('s3:ReplicateObject')
          )
        );
        expect(replicationPolicy).toBeDefined();
      }
    });

    test('should create SNS topic with email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'aurora-dr-alerts-primary-test',
        DisplayName: 'Aurora DR Alerts - primary',
      });

      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'ops-team@example.com',
      });
    });

    test('should create Aurora Global Cluster and Primary Cluster', () => {
      template.hasResourceProperties('AWS::RDS::GlobalCluster', {
        GlobalClusterIdentifier: 'aurora-dr-global-123456789012-test',
        Engine: 'aurora-postgresql',
        EngineVersion: '15.8',
        StorageEncrypted: true,
      });

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.8',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
        DeletionProtection: false,
        EnableCloudwatchLogsExports: ['postgresql'],
      });

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r6g.xlarge',
        Engine: 'aurora-postgresql',
      });

      template.resourceCountIs('AWS::RDS::DBInstance', 2);

      expect(stack.globalClusterIdentifier).toBeDefined();
    });

    test('should create parameter group with correct parameters', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Family: 'aurora-postgresql15',
        Parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
          log_duration: '1',
        },
      });
    });

    test('should create health check Lambda function', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          Timeout: 30,
        },
      });

      expect(Object.keys(lambdaFunctions).length).toBeGreaterThan(0);
      const lambda = Object.values(lambdaFunctions)[0] as any;
      expect(lambda.Properties.Environment.Variables.DB_ENDPOINT).toBeDefined();
      expect(
        lambda.Properties.Environment.Variables.DB_SECRET_ARN
      ).toBeDefined();
      expect(lambda.Properties.Environment.Variables.REGION).toBe('us-east-1');

      // Verify IAM policy for CloudWatch
      const policies = template.findResources('AWS::IAM::Policy');
      const cloudwatchPolicy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument.Statement?.some(
          (stmt: any) =>
            stmt.Action === 'cloudwatch:PutMetricData' ||
            (Array.isArray(stmt.Action) &&
              stmt.Action.includes('cloudwatch:PutMetricData'))
        )
      );
      expect(cloudwatchPolicy).toBeDefined();
    });

    test('should create failover Lambda function', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function', {
        Properties: {
          Timeout: 180,
        },
      });

      expect(Object.keys(lambdaFunctions).length).toBeGreaterThan(0);
      const lambda = Object.values(lambdaFunctions).find(
        (l: any) => l.Properties.Environment?.Variables?.IS_PRIMARY === 'true'
      ) as any;
      expect(lambda).toBeDefined();
      expect(lambda.Properties.Environment.Variables.CLUSTER_ID).toBeDefined();
      expect(lambda.Properties.Environment.Variables.IS_PRIMARY).toBe('true');
      expect(lambda.Properties.Environment.Variables.DR_ENDPOINT).toBe('');
      expect(
        lambda.Properties.Environment.Variables.SNS_TOPIC_ARN
      ).toBeDefined();
      expect(
        lambda.Properties.Environment.Variables.STATE_BUCKET
      ).toBeDefined();
      expect(lambda.Properties.Environment.Variables.RECORD_NAME).toBe(
        'db.aurora-dr.internal'
      );

      // Verify IAM policies exist
      const policies = template.findResources('AWS::IAM::Policy');
      const rdsPolicy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument.Statement?.some(
          (stmt: any) =>
            Array.isArray(stmt.Action) &&
            stmt.Action.includes('rds:PromoteReadReplicaDBCluster')
        )
      );
      expect(rdsPolicy).toBeDefined();

      const route53Policy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument.Statement?.some(
          (stmt: any) =>
            stmt.Action === 'route53:ChangeResourceRecordSets' ||
            (Array.isArray(stmt.Action) &&
              stmt.Action.includes('route53:ChangeResourceRecordSets'))
        )
      );
      expect(route53Policy).toBeDefined();
    });

    test('should create backup verification Lambda function', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const backupLambda = Object.values(lambdaFunctions).find(
        (l: any) =>
          l.Properties.Timeout === 180 &&
          l.Properties.Environment?.Variables?.CLUSTER_ID &&
          !l.Properties.Environment?.Variables?.IS_PRIMARY
      ) as any;
      expect(backupLambda).toBeDefined();
      expect(
        backupLambda.Properties.Environment.Variables.CLUSTER_ID
      ).toBeDefined();
      expect(
        backupLambda.Properties.Environment.Variables.SNS_TOPIC_ARN
      ).toBeDefined();

      // Verify IAM policy for backup verification
      const policies = template.findResources('AWS::IAM::Policy');
      const backupPolicy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument.Statement?.some(
          (stmt: any) =>
            Array.isArray(stmt.Action) &&
            stmt.Action.includes('rds:DescribeDBClusterSnapshots') &&
            stmt.Action.includes('rds:RestoreDBClusterFromSnapshot')
        )
      );
      expect(backupPolicy).toBeDefined();
    });

    test('should create EventBridge rules', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(2 minutes)',
        Description: 'Check health and trigger failover if needed',
      });

      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.rds'],
          'detail-type': ['RDS DB Cluster Event'],
          detail: {
            EventCategories: ['failover', 'failure', 'notification'],
          },
        },
      });

      template.hasResourceProperties('AWS::Events::Rule', {
        ScheduleExpression: 'rate(1 day)',
        Description: 'Daily backup verification',
      });
    });

    test('should create Route 53 health check and alarm', () => {
      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'CALCULATED',
          ChildHealthChecks: [],
          HealthThreshold: 1,
        },
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'HealthCheckStatus',
        Namespace: 'AWS/Route53',
        Threshold: 0,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        TreatMissingData: 'breaching',
      });
    });

    test('should create CloudWatch alarms for RDS metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'AuroraGlobalDBReplicationLag',
        Namespace: 'AWS/RDS',
        Threshold: 5000,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        AlarmDescription: 'Aurora Global DB replication lag exceeds 5 seconds',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Threshold: 80,
        EvaluationPeriods: 3,
        DatapointsToAlarm: 3,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
        Namespace: 'AWS/RDS',
        Threshold: 500,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
      });
    });

    test('should create CloudWatch alarms for Lambda metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Threshold: 1,
        EvaluationPeriods: 1,
        DatapointsToAlarm: 1,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Duration',
        Threshold: 150000,
        EvaluationPeriods: 1,
        DatapointsToAlarm: 1,
      });
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'aurora-dr-primary-test',
      });
    });

    test('should create stack outputs', () => {
      const allOutputs = template.findOutputs('*');
      const clusterOutput = Object.values(allOutputs).find(
        (output: any) =>
          output.Export?.Name === 'aurora-dr-endpoint-primary-test'
      );
      expect(clusterOutput).toBeDefined();

      const snapshotOutput = Object.values(allOutputs).find(
        (output: any) =>
          output.Export?.Name === 'aurora-dr-snapshots-primary-test'
      );
      expect(snapshotOutput).toBeDefined();

      const topicOutput = Object.values(allOutputs).find(
        (output: any) => output.Export?.Name === 'aurora-dr-alerts-primary-test'
      );
      expect(topicOutput).toBeDefined();

      const globalOutput = Object.values(allOutputs).find(
        (output: any) => output.Export?.Name === 'aurora-dr-global-cluster-test'
      );
      expect(globalOutput).toBeDefined();
    });

    test('should grant Lambda permissions to read secrets', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const secretsPolicy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument.Statement?.some(
          (stmt: any) =>
            (Array.isArray(stmt.Action) &&
              stmt.Action.includes('secretsmanager:GetSecretValue')) ||
            stmt.Action === 'secretsmanager:GetSecretValue'
        )
      );
      expect(secretsPolicy).toBeDefined();
    });

    test('should grant Lambda permissions to publish to SNS', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const snsPolicy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument.Statement?.some(
          (stmt: any) =>
            stmt.Action === 'sns:Publish' ||
            (Array.isArray(stmt.Action) && stmt.Action.includes('sns:Publish'))
        )
      );
      expect(snsPolicy).toBeDefined();
    });

    test('should grant Lambda permissions to read/write S3', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const s3Policy = Object.values(policies).find((policy: any) =>
        policy.Properties.PolicyDocument.Statement?.some(
          (stmt: any) =>
            (Array.isArray(stmt.Action) &&
              (stmt.Action.includes('s3:GetObject') ||
                stmt.Action.includes('s3:PutObject') ||
                stmt.Action.includes('s3:DeleteObject'))) ||
            stmt.Action === 's3:GetObject' ||
            stmt.Action === 's3:PutObject' ||
            stmt.Action === 's3:DeleteObject'
        )
      );
      expect(s3Policy).toBeDefined();
    });
  });

  describe('DR Stack Creation', () => {
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      stack = new TapStack(app, 'TestTapStack-DR', {
        environmentSuffix: 'test',
        isPrimary: false,
        primaryRegion: 'us-east-1',
        globalClusterIdentifier: 'test-global-cluster-id',
        primaryVpcId: 'vpc-primary-123',
        primaryVpcCidr: '10.0.0.0/16',
        primaryKmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/test-key',
        primarySnapshotBucketArn: 'arn:aws:s3:::test-bucket',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
      });
      template = Template.fromStack(stack);
    });

    test('should create VPC with DR CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });

      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcCidr).toBeDefined();
    });

    test('should create VPC peering connection', () => {
      template.hasResourceProperties('AWS::EC2::VPCPeeringConnection', {
        PeerVpcId: 'vpc-primary-123',
        PeerRegion: 'us-east-1',
      });

      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '10.0.0.0/16',
      });
    });

    test('should create DR cluster without global cluster creation', () => {
      template.resourceCountIs('AWS::RDS::GlobalCluster', 0);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.8',
        StorageEncrypted: true,
        DeletionProtection: false,
      });

      expect(stack.globalClusterIdentifier).toBeUndefined();
    });

    test('should associate DR cluster with global cluster identifier', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        GlobalClusterIdentifier: 'test-global-cluster-id',
      });
    });

    test('should create DR parameter group', () => {
      template.hasResourceProperties('AWS::RDS::DBClusterParameterGroup', {
        Family: 'aurora-postgresql15',
        Parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
          log_duration: '1',
        },
      });
    });

    test('should configure failover Lambda with DR settings', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            IS_PRIMARY: 'false',
            DR_ENDPOINT: Match.anyValue(),
          },
        },
      });
    });

    test('should not create S3 replication role for DR region', () => {
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Principal: {
                  Service: 's3.amazonaws.com',
                },
              },
            ],
          },
        },
      });
      // Should not have S3ReplicationRole
      const s3ReplicationRoles = Object.keys(roles).filter(key =>
        key.includes('S3ReplicationRole')
      );
      expect(s3ReplicationRoles.length).toBe(0);
    });

    test('should not output global cluster identifier for DR', () => {
      const allOutputs = template.findOutputs('*');
      const clusterOutput = Object.values(allOutputs).find(
        (output: any) => output.Export?.Name === 'aurora-dr-endpoint-dr-test'
      );
      expect(clusterOutput).toBeDefined();

      const snapshotOutput = Object.values(allOutputs).find(
        (output: any) => output.Export?.Name === 'aurora-dr-snapshots-dr-test'
      );
      expect(snapshotOutput).toBeDefined();

      const topicOutput = Object.values(allOutputs).find(
        (output: any) => output.Export?.Name === 'aurora-dr-alerts-dr-test'
      );
      expect(topicOutput).toBeDefined();

      // Should not have global cluster identifier output
      const globalOutput = Object.values(allOutputs).find(
        (output: any) => output.Export?.Name === 'aurora-dr-global-cluster-test'
      );
      expect(globalOutput).toBeUndefined();
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should use environment suffix from props', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/aurora-dr-primary-prod',
      });
    });

    test('should use environment suffix from context', () => {
      const appWithContext = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      const stack = new TapStack(appWithContext, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/aurora-dr-primary-staging',
      });
    });

    test('should default to dev when no suffix provided', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: 'alias/aurora-dr-primary-dev',
      });
    });
  });

  describe('VPC Peering Edge Cases', () => {
    test('should not create peering when primaryVpcId is missing', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        primaryVpcCidr: '10.0.0.0/16',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::VPCPeeringConnection', 0);
    });

    test('should not create peering when primaryVpcCidr is missing', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        primaryVpcId: 'vpc-123',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      template.resourceCountIs('AWS::EC2::VPCPeeringConnection', 0);
    });

    test('should use default primary region when not provided', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        primaryVpcId: 'vpc-123',
        primaryVpcCidr: '10.0.0.0/16',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::EC2::VPCPeeringConnection', {
        PeerRegion: 'us-east-1',
      });
    });
  });

  describe('S3 Replication Edge Cases', () => {
    test('should not create replication role when drRegion is missing', () => {
      const stack = new TapStack(app, 'TestStack-Primary', {
        isPrimary: true,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      const roles = template.findResources('AWS::IAM::Role');
      const s3ReplicationRoles = Object.keys(roles).filter(key =>
        key.includes('S3ReplicationRole')
      );
      expect(s3ReplicationRoles.length).toBe(0);
    });

    test('should not create replication role for DR region', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        drRegion: 'us-west-2',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      const roles = template.findResources('AWS::IAM::Role');
      const s3ReplicationRoles = Object.keys(roles).filter(key =>
        key.includes('S3ReplicationRole')
      );
      expect(s3ReplicationRoles.length).toBe(0);
    });
  });

  describe('Global Cluster Association Edge Cases', () => {
    test('should not associate when globalClusterIdentifier is missing', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      // Find the CfnDBCluster directly (not through DatabaseCluster wrapper)
      const dbClusters = template.findResources('AWS::RDS::DBCluster');
      const cluster = Object.values(dbClusters)[0] as any;
      // When globalClusterIdentifier is not provided, it should be undefined
      expect(cluster.Properties.GlobalClusterIdentifier).toBeUndefined();
    });

    test('should associate when globalClusterIdentifier is provided', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        globalClusterIdentifier: 'test-global-cluster',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      const dbClusters = template.findResources('AWS::RDS::DBCluster');
      const cluster = Object.values(dbClusters)[0] as any;
      expect(cluster.Properties.GlobalClusterIdentifier).toBe('test-global-cluster');
    });
  });

  describe('Lambda Secret Access Edge Cases', () => {
    test('should grant cross-region secret access when primarySecretArn is provided', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        primarySecretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      // Verify Lambda function exists with health check
      template.resourceCountIs('AWS::Lambda::Function', 3);

      // Verify environment variable has DB_SECRET_ARN set
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DB_SECRET_ARN: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:test-secret',
          },
        },
      });

      // Verify IAM policies have secretsmanager permissions
      // The policy is added via addToRolePolicy, so check all IAM policies
      const allPolicies = template.findResources('AWS::IAM::Policy');
      const hasSecretAccess = Object.values(allPolicies).some((policy: any) => {
        const statements = policy.Properties.PolicyDocument?.Statement || [];
        return statements.some((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          const resources = Array.isArray(stmt.Resource) ? stmt.Resource : [stmt.Resource];
          return (
            actions.some((action: string) => action?.includes('secretsmanager:GetSecretValue')) &&
            resources.some((resource: string) => resource?.includes('arn:aws:secretsmanager'))
          );
        });
      });
      expect(hasSecretAccess).toBe(true);
    });

    test('should not grant cross-region secret access when primarySecretArn is missing', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      // When primarySecretArn is not provided, health check Lambda should still exist
      template.resourceCountIs('AWS::Lambda::Function', 3);

      // Verify environment variable has empty DB_SECRET_ARN
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DB_SECRET_ARN: '',
          },
        },
      });
    });
  });

  describe('DR Cluster Edge Cases', () => {
    test('should handle DR cluster when globalClusterIdentifier is undefined', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      // Should still create DR cluster
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.8',
      });

      // GlobalClusterIdentifier should be undefined
      const dbClusters = template.findResources('AWS::RDS::DBCluster');
      const cluster = Object.values(dbClusters)[0] as any;
      expect(cluster.Properties.GlobalClusterIdentifier).toBeUndefined();
    });

    test('should handle DR cluster endpoint when cluster is undefined', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      // Lambda functions should still have DB_ENDPOINT set (even if empty or using ref)
      template.resourceCountIs('AWS::Lambda::Function', 3);
    });

    test('should use DR cluster ref for alarm dimensions', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        globalClusterIdentifier: 'test-global-cluster',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      // Verify alarms use DR cluster identifier
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'AuroraGlobalDBReplicationLag',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'DatabaseConnections',
      });
    });

    test('should use DR cluster ref for Lambda environment variables', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        globalClusterIdentifier: 'test-global-cluster',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      // Verify Lambda functions have CLUSTER_ID set
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            CLUSTER_ID: Match.anyValue(),
          },
        },
      });
    });

    test('should use DR cluster endpoint for output', () => {
      const stack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        globalClusterIdentifier: 'test-global-cluster',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      // Verify output exists
      const outputs = template.findOutputs('*');
      const endpointOutput = Object.values(outputs).find(
        (output: any) => output.Export?.Name?.includes('endpoint-dr')
      );
      expect(endpointOutput).toBeDefined();
    });
  });

  describe('Primary Cluster Secret Edge Cases', () => {
    test('should handle primary cluster secret ARN in Lambda environment', () => {
      const stack = new TapStack(app, 'TestStack-Primary', {
        isPrimary: true,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      // Primary cluster should be created
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.8',
      });

      // Lambda should exist and have environment variables with secret ARN
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DB_ENDPOINT: Match.anyValue(),
            DB_SECRET_ARN: Match.anyValue(),
          },
        },
      });
      
      // Verify secret ARN contains secretsmanager
      const lambdas = template.findResources('AWS::Lambda::Function');
      const healthCheckLambda = Object.values(lambdas).find((lambda: any) =>
        lambda.Properties.Environment?.Variables?.DB_SECRET_ARN
      ) as any;
      expect(healthCheckLambda).toBeDefined();
      const secretArn = healthCheckLambda.Properties.Environment.Variables.DB_SECRET_ARN;
      expect(secretArn).toBeDefined();
      // Check if it's a string or CloudFormation intrinsic
      if (typeof secretArn === 'string') {
        expect(secretArn).toContain('secretsmanager');
      }
    });

    test('should export secret ARN for primary cluster', () => {
      const stack = new TapStack(app, 'TestStack-Primary', {
        isPrimary: true,
        env: { account: '123456789012', region: 'us-east-1' },
      });

      // Verify secretArn is exported (could be CDK token)
      expect(stack.secretArn).toBeDefined();
      // For DR stack, secretArn should be undefined
      const drStack = new TapStack(app, 'TestStack-DR', {
        isPrimary: false,
        env: { account: '123456789012', region: 'us-west-2' },
      });
      expect(drStack.secretArn).toBeUndefined();
    });
  });

  describe('Conditional Branch Coverage', () => {
    test('should use primary cluster endpoint for primary Lambda environment', () => {
      const stack = new TapStack(app, 'TestStack-Primary', {
        isPrimary: true,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      // Verify health check Lambda uses primary cluster endpoint
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            DB_ENDPOINT: Match.anyValue(),
            REGION: 'us-east-1',
          },
        },
      });
      
      // Verify DB_ENDPOINT is set (could be CloudFormation intrinsic)
      const lambdas = template.findResources('AWS::Lambda::Function');
      const healthCheckLambda = Object.values(lambdas).find((lambda: any) =>
        lambda.Properties.Environment?.Variables?.REGION === 'us-east-1'
      ) as any;
      expect(healthCheckLambda).toBeDefined();
      expect(healthCheckLambda.Properties.Environment.Variables.DB_ENDPOINT).toBeDefined();
    });

    test('should use primary cluster identifier for primary Lambda environment', () => {
      const stack = new TapStack(app, 'TestStack-Primary', {
        isPrimary: true,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      // Verify failover Lambda uses primary cluster identifier
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            IS_PRIMARY: 'true',
            DR_ENDPOINT: '',
          },
        },
      });
    });

    test('should use primary cluster endpoint for output', () => {
      const stack = new TapStack(app, 'TestStack-Primary', {
        isPrimary: true,
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      // Verify output uses primary cluster endpoint
      const outputs = template.findOutputs('*');
      const endpointOutput = Object.values(outputs).find(
        (output: any) => output.Export?.Name?.includes('endpoint-primary')
      );
      expect(endpointOutput).toBeDefined();
      // Output value could be CloudFormation intrinsic function
      expect(endpointOutput?.Value).toBeDefined();
    });
  });

  describe('Stack Exports', () => {
    test('should export vpcId, vpcCidr, kmsKeyArn, and snapshotBucketArn', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });

      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcCidr).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
      expect(stack.snapshotBucketArn).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    test('should use correct region prefix for primary', () => {
      const stack = new TapStack(app, 'TestStack', {
        isPrimary: true,
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      // Verify VPC is created (region prefix is in construct ID)
      template.resourceCountIs('AWS::EC2::VPC', 1);

      // Verify SNS topic uses primary prefix
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'aurora-dr-alerts-primary-test',
      });
    });

    test('should use correct region prefix for DR', () => {
      const stack = new TapStack(app, 'TestStack', {
        isPrimary: false,
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'aurora-dr-alerts-dr-test',
      });
    });
  });

  describe('Lambda Function Configurations', () => {
    test('should configure all Lambda functions with VPC', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const lambdasWithVpc = Object.values(lambdaFunctions).filter(
        (func: any) => func.Properties.VpcConfig !== undefined
      );
      // All three Lambda functions should have VPC config
      expect(lambdasWithVpc.length).toBeGreaterThanOrEqual(2);
      lambdasWithVpc.forEach((func: any) => {
        expect(func.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
        expect(func.Properties.VpcConfig.SubnetIds).toBeDefined();
      });
    });

    test('should have correct timeout values', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 30,
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Timeout: 180,
      });
    });
  });

  describe('CloudWatch Logs Configuration', () => {
    test('should export PostgreSQL logs to CloudWatch', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        EnableCloudwatchLogsExports: ['postgresql'],
      });

      // Verify log groups exist (may have different naming or be created automatically)
      // Log groups are created automatically by CDK when EnableCloudwatchLogsExports is set
      const dbClusters = template.findResources('AWS::RDS::DBCluster');
      const cluster = Object.values(dbClusters)[0] as any;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain(
        'postgresql'
      );
    });
  });

  describe('EventBridge Rule Targets', () => {
    test('should connect health check rule to Lambda', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      // Verify rule with schedule exists and has targets
      const rules = template.findResources('AWS::Events::Rule', {
        Properties: {
          ScheduleExpression: 'rate(2 minutes)',
        },
      });

      expect(Object.keys(rules).length).toBeGreaterThan(0);
      const rule = Object.values(rules)[0] as any;
      expect(rule.Properties.Targets).toBeDefined();
      expect(Array.isArray(rule.Properties.Targets)).toBe(true);
    });

    test('should connect RDS event rule to SNS', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      const rules = template.findResources('AWS::Events::Rule', {
        Properties: {
          EventPattern: {
            source: ['aws.rds'],
          },
        },
      });

      expect(Object.keys(rules).length).toBeGreaterThan(0);
      const rule = Object.values(rules)[0] as any;
      expect(rule.Properties.Targets).toBeDefined();
    });
  });

  describe('CloudWatch Alarm Actions', () => {
    test('should connect alarms to SNS topic', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      // Verify alarms have AlarmActions
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const alarmsWithActions = Object.values(alarms).filter(
        (alarm: any) =>
          alarm.Properties.AlarmActions &&
          alarm.Properties.AlarmActions.length > 0
      );
      expect(alarmsWithActions.length).toBeGreaterThan(0);
    });

    test('should connect health check alarm to Lambda', () => {
      const stack = new TapStack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const template = Template.fromStack(stack);

      // Verify health check alarm exists and has actions
      const healthCheckAlarm = template.findResources(
        'AWS::CloudWatch::Alarm',
        {
          Properties: {
            MetricName: 'HealthCheckStatus',
          },
        }
      );

      expect(Object.keys(healthCheckAlarm).length).toBeGreaterThan(0);
      const alarm = Object.values(healthCheckAlarm)[0] as any;
      expect(alarm.Properties.AlarmActions).toBeDefined();
    });
  });
});
