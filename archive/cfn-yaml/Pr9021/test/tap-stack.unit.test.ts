// tap-stack.unit.test.ts

import * as fs from 'fs';
import * as path from 'path';

interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Resources?: { [name: string]: any };
  Parameters?: { [name: string]: any };
  Outputs?: { [name: string]: any };
}

describe('TapStack CloudFormation template (Aurora + DAS)', () => {
  let template: CloudFormationTemplate;
  let resources: { [name: string]: any };
  let parameters: { [name: string]: any };
  let outputs: { [name: string]: any };
  let yamlText: string;

  beforeAll(() => {
    const jsonPath = path.join(__dirname, '../lib/TapStack.json');
    const yamlPath = path.join(__dirname, '../lib/TapStack.yml');

    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    template = JSON.parse(jsonContent);
    resources = template.Resources ?? {};
    parameters = template.Parameters ?? {};
    outputs = template.Outputs ?? {};

    yamlText = fs.readFileSync(yamlPath, 'utf8');
  });

  // 1
  it('should load the template JSON with Resources section', () => {
    expect(template).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(Object.keys(resources).length).toBeGreaterThan(0);
  });

  // 2
  it('should define CloudFormation metadata like AWSTemplateFormatVersion and Description in YAML', () => {
    expect(yamlText).toContain('AWSTemplateFormatVersion');
    expect(yamlText).toContain('TapStack.yml — Aurora MySQL 8.0 cluster across 3 AZs');
  });

  // 3
  it('should define core parameters including EnvironmentSuffix and DBInstanceClass', () => {
    expect(parameters.EnvironmentSuffix).toBeDefined();
    expect(parameters.DBInstanceClass).toBeDefined();
    expect(parameters.BackupRetentionDays).toBeDefined();
  });

  // 4
  it('should define ActivityStream parameters (ActivityStreamEnabled and ActivityStreamMode)', () => {
    expect(parameters.ActivityStreamEnabled).toBeDefined();
    expect(parameters.ActivityStreamMode).toBeDefined();
  });

  // 5
  it('should include Vpc resource with correct type and CIDR block', () => {
    const vpc = resources.Vpc;
    expect(vpc).toBeDefined();
    expect(vpc.Type).toBe('AWS::EC2::VPC');
    expect(vpc.Properties).toBeDefined();
    expect(vpc.Properties.CidrBlock).toBe('10.20.0.0/16');
  });

  // 6
  it('should define three private subnets across AZs', () => {
    const subnetA = resources.SubnetPrivateA;
    const subnetB = resources.SubnetPrivateB;
    const subnetC = resources.SubnetPrivateC;

    expect(subnetA).toBeDefined();
    expect(subnetB).toBeDefined();
    expect(subnetC).toBeDefined();

    expect(subnetA.Type).toBe('AWS::EC2::Subnet');
    expect(subnetB.Type).toBe('AWS::EC2::Subnet');
    expect(subnetC.Type).toBe('AWS::EC2::Subnet');

    expect(subnetA.Properties.CidrBlock).toBe('10.20.10.0/24');
    expect(subnetB.Properties.CidrBlock).toBe('10.20.20.0/24');
    expect(subnetC.Properties.CidrBlock).toBe('10.20.30.0/24');
  });

  // 7
  it('should define DbSubnetGroup using all three private subnets', () => {
    const dbSubnetGroup = resources.DbSubnetGroup;
    expect(dbSubnetGroup).toBeDefined();
    expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');

    const subnetIds = dbSubnetGroup.Properties?.SubnetIds;
    expect(Array.isArray(subnetIds)).toBe(true);
    expect(subnetIds.length).toBe(3);
  });

  // 8
  it('should define AppTierSecurityGroup and DbSecurityGroup with correct types', () => {
    const appSg = resources.AppTierSecurityGroup;
    const dbSg = resources.DbSecurityGroup;

    expect(appSg).toBeDefined();
    expect(appSg.Type).toBe('AWS::EC2::SecurityGroup');

    expect(dbSg).toBeDefined();
    expect(dbSg.Type).toBe('AWS::EC2::SecurityGroup');
  });

  // 9
  it('should define AuroraDBCluster with engine aurora-mysql and encryption enabled', () => {
    const cluster = resources.AuroraDBCluster;
    expect(cluster).toBeDefined();
    expect(cluster.Type).toBe('AWS::RDS::DBCluster');

    const props = cluster.Properties ?? {};
    expect(props.Engine).toBe('aurora-mysql');
    expect(props.StorageEncrypted).toBe(true);
  });

  // 10
  it('should configure AuroraDBCluster with 72h backtrack window', () => {
    const cluster = resources.AuroraDBCluster;
    const props = cluster.Properties ?? {};
    expect(props.BacktrackWindow).toBe(259200);
  });

  // 11
  it('should enable CloudWatch logs exports (audit, error, general, slowquery)', () => {
    const cluster = resources.AuroraDBCluster;
    const props = cluster.Properties ?? {};
    const logs = props.EnableCloudwatchLogsExports;

    expect(Array.isArray(logs)).toBe(true);
    expect(logs).toEqual(
      expect.arrayContaining(['audit', 'error', 'general', 'slowquery'])
    );
  });

  // 12
  it('should define three DB instances (1 writer + 2 readers) attached to the cluster', () => {
    const writer = resources.AuroraWriterInstance;
    const readerA = resources.AuroraReaderAInstance;
    const readerB = resources.AuroraReaderBInstance;

    expect(writer).toBeDefined();
    expect(readerA).toBeDefined();
    expect(readerB).toBeDefined();

    [writer, readerA, readerB].forEach((inst) => {
      expect(inst.Type).toBe('AWS::RDS::DBInstance');
      expect(inst.Properties.Engine).toBe('aurora-mysql');
      expect(inst.Properties.DBClusterIdentifier).toBeDefined();
    });
  });

  // 13
  it('should configure DB instances with Enhanced Monitoring role and interval parameter', () => {
    const writer = resources.AuroraWriterInstance;
    const props = writer.Properties ?? {};

    expect(props.MonitoringInterval).toBeDefined();
    expect(props.MonitoringRoleArn).toBeDefined();
  });

  // 14
  it('should define EnhancedMonitoringRole with AmazonRDSEnhancedMonitoringRole managed policy', () => {
    const role = resources.EnhancedMonitoringRole;
    expect(role).toBeDefined();
    expect(role.Type).toBe('AWS::IAM::Role');

    const managedPolicies = role.Properties?.ManagedPolicyArns ?? [];
    expect(managedPolicies).toContain(
      'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
    );
  });

  // 15
  it('should define MasterSecret in Secrets Manager with generated password', () => {
    const secret = resources.MasterSecret;
    expect(secret).toBeDefined();
    expect(secret.Type).toBe('AWS::SecretsManager::Secret');

    const gen = secret.Properties?.GenerateSecretString ?? {};
    expect(gen.GenerateStringKey).toBe('password');
    expect(gen.PasswordLength).toBe(32);
  });

  // 16
  it('should configure AuroraDBCluster with DeletionPolicy Snapshot', () => {
    const cluster = resources.AuroraDBCluster;
    // DeletionPolicy is at resource-level, not under Properties
    expect(cluster.DeletionPolicy).toBe('Snapshot');
    expect(cluster.UpdateReplacePolicy).toBe('Snapshot');
  });

  // 17
  it('should create a dedicated KMS CMK (DasKmsKey) with key rotation enabled', () => {
    const key = resources.DasKmsKey;
    expect(key).toBeDefined();
    expect(key.Type).toBe('AWS::KMS::Key');

    const props = key.Properties ?? {};
    expect(props.EnableKeyRotation).toBe(true);
  });

  // 18
  it('should create KMS alias for DasKmsKey', () => {
    const alias = resources.DasKmsAlias;
    expect(alias).toBeDefined();
    expect(alias.Type).toBe('AWS::KMS::Alias');

    const props = alias.Properties ?? {};
    expect(props.TargetKeyId).toBeDefined();
  });

  // 19
  it('should define ActivityStreamLambda with python3.12 runtime and proper role', () => {
    const fn = resources.ActivityStreamLambda;
    expect(fn).toBeDefined();
    expect(fn.Type).toBe('AWS::Lambda::Function');

    const props = fn.Properties ?? {};
    expect(props.Runtime).toBe('python3.12');
    expect(props.Role).toBeDefined();
    expect(props.Timeout).toBeGreaterThanOrEqual(300);
  });

  // 20
  it('should define ActivityStreamLambdaRole with RDS and KMS permissions scoped to DasKmsKey', () => {
    const role = resources.ActivityStreamLambdaRole;
    expect(role).toBeDefined();
    expect(role.Type).toBe('AWS::IAM::Role');

    const policies = role.Properties?.Policies ?? [];
    expect(Array.isArray(policies)).toBe(true);
    expect(policies.length).toBeGreaterThan(0);

    const policyDoc = policies[0].PolicyDocument;
    const statements = policyDoc?.Statement ?? [];
    expect(Array.isArray(statements)).toBe(true);

    const kmsDescribeStmt = statements.find((s: any) => {
      const actions = Array.isArray(s.Action) ? s.Action : [s.Action];
      return actions.includes('kms:DescribeKey');
    });

    const kmsGrantStmt = statements.find((s: any) => {
      const actions = Array.isArray(s.Action) ? s.Action : [s.Action];
      return actions.includes('kms:CreateGrant');
    });

    expect(kmsDescribeStmt).toBeDefined();
    expect(kmsGrantStmt).toBeDefined();

    // Ensure CreateGrant is conditioned for AWS RDS usage
    const cond = kmsGrantStmt.Condition ?? {};
    expect(cond.Bool?.['kms:GrantIsForAWSResource']).toBe('true');
    expect(cond.StringEquals?.['kms:ViaService']).toBeDefined();
  });

  // 21
  it('should define ActivityStreamEnabler custom resource with correct type and condition', () => {
    const cr = resources.ActivityStreamEnabler;
    expect(cr).toBeDefined();
    expect(cr.Type).toBe('Custom::RDSActivityStream');
    expect(cr.Condition).toBe('EnableActivityStreams');
  });

  // 22
  it('should wire ActivityStreamEnabler to ActivityStreamLambda via ServiceToken', () => {
    const cr = resources.ActivityStreamEnabler;
    const props = cr.Properties ?? {};
    expect(props.ServiceToken).toBeDefined();
  });

  // 23
  it('should configure auto-scaling for read replicas on RDSReaderAverageCPUUtilization', () => {
    const target = resources.AuroraReadReplicaScalableTarget;
    const policy = resources.AuroraReadReplicaScalingPolicy;

    expect(target).toBeDefined();
    expect(policy).toBeDefined();

    expect(target.Properties?.ScalableDimension).toBe(
      'rds:cluster:ReadReplicaCount'
    );

    const tt = policy.Properties?.TargetTrackingScalingPolicyConfiguration;
    const metricSpec = tt?.PredefinedMetricSpecification;
    expect(metricSpec?.PredefinedMetricType).toBe(
      'RDSReaderAverageCPUUtilization'
    );
  });

  // 24
  it('should define SNS topic for failover notifications', () => {
    const topic = resources.FailoverSnsTopic;
    expect(topic).toBeDefined();
    expect(topic.Type).toBe('AWS::SNS::Topic');
  });

  // 25
  it('should define replica lag alarm on AuroraReplicaLagMaximum metric', () => {
    const alarm = resources.ReplicaLagAlarm;
    expect(alarm).toBeDefined();
    expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

    const props = alarm.Properties ?? {};
    expect(props.MetricName).toBe('AuroraReplicaLagMaximum');
    expect(props.Namespace).toBe('AWS/RDS');
  });

  // 26
  it('should define writer CPU alarm with 80% threshold on CPUUtilization metric', () => {
    const alarm = resources.WriterCpuAlarm;
    expect(alarm).toBeDefined();
    expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');

    const props = alarm.Properties ?? {};
    expect(props.MetricName).toBe('CPUUtilization');
    expect(props.Threshold).toBe(80);
  });

  // 27
  it('should expose key outputs (ClusterEndpoint, ReaderEndpoint, AppTierSecurityGroupId)', () => {
    expect(outputs.ClusterEndpoint).toBeDefined();
    expect(outputs.ReaderEndpoint).toBeDefined();
    expect(outputs.AppTierSecurityGroupId).toBeDefined();
  });
});
