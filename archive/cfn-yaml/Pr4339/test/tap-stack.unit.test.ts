import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('PostgreSQL RDS E-commerce CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the converted JSON template for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description for e-commerce PostgreSQL RDS', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Production-ready PostgreSQL RDS with Multi-AZ, Read Replicas, KMS encryption, Performance Insights, CloudWatch monitoring, and S3 backup exports'
      );
      expect(template.Description).toContain('PostgreSQL');
      expect(template.Description).toContain('Multi-AZ');
      expect(template.Description).toContain('Read Replicas');
      expect(template.Description).toContain('KMS encryption');
    });

    test('should have valid JSON structure without syntax errors', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });
  });

  describe('Parameters Configuration', () => {
    test('should have all required e-commerce parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'DBInstanceClass',
        'ReadReplicaInstanceClass',
        'DBName',
        'DBMasterUsername',
        'BackupRetentionDays',
        'ApplicationSubnetCIDR',
        'ManagementCIDR',
        'AllocatedStorage',
        'MaxAllocatedStorage',
        'KMSKeyARN'
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should be properly configured', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.Description).toContain('Environment suffix');
    });

    test('DBInstanceClass should have appropriate values for e-commerce workloads', () => {
      const dbParam = template.Parameters.DBInstanceClass;
      expect(dbParam.Type).toBe('String');
      expect(dbParam.Default).toBe('db.m5.large');
      expect(dbParam.AllowedValues).toContain('db.m5.large');
      expect(dbParam.AllowedValues).toContain('db.r5.large');
    });

    test('storage parameters should be configured for e-commerce growth', () => {
      const allocatedStorage = template.Parameters.AllocatedStorage;
      const maxStorage = template.Parameters.MaxAllocatedStorage;

      expect(allocatedStorage.Default).toBe(100);
      expect(allocatedStorage.MinValue).toBe(20);
      expect(maxStorage.Default).toBe(1000);
      expect(maxStorage.MinValue).toBe(100);
    });

    test('backup retention should meet production requirements', () => {
      const backupParam = template.Parameters.BackupRetentionDays;
      expect(backupParam.Type).toBe('Number');
      expect(backupParam.Default).toBe(7);
      expect(backupParam.MinValue).toBe(7);
      expect(backupParam.MaxValue).toBe(35);
    });
  });

  describe('Conditions Logic', () => {
    test('should have conditional logic for KMS key creation', () => {
      expect(template.Conditions.CreateKMSKey).toBeDefined();
      expect(template.Conditions.CreateKMSKey).toEqual({
        'Fn::Equals': [
          { 'Ref': 'KMSKeyARN' },
          ''
        ]
      });
    });

    test('should have conditional logic for enhanced monitoring', () => {
      expect(template.Conditions.EnableEnhancedMonitoring).toBeDefined();
      expect(template.Conditions.EnableEnhancedMonitoring).toEqual({
        'Fn::Not': [
          { 'Fn::Equals': [{ 'Ref': 'EnhancedMonitoringInterval' }, 0] }
        ]
      });
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should create VPC with proper configuration for e-commerce', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create private subnets in multiple AZs for high availability', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.20.0/24');

      // Validate different AZs
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create NAT gateway for private subnet internet access', () => {
      const natGateway = template.Resources.NATGateway1;
      const natEIP = template.Resources.NATGatewayEIP1;

      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natEIP.Type).toBe('AWS::EC2::EIP');
      expect(natEIP.Properties.Domain).toBe('vpc');
    });

    test('should create security group with proper database access rules', () => {
      const securityGroup = template.Resources.DBSecurityGroup;
      expect(securityGroup.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = securityGroup.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      // Check PostgreSQL port 5432 access
      ingressRules.forEach(rule => {
        expect(rule.FromPort).toBe(5432);
        expect(rule.ToPort).toBe(5432);
        expect(rule.IpProtocol).toBe('tcp');
      });
    });
  });

  describe('Database Infrastructure', () => {
    test('should create RDS parameter group for PostgreSQL optimization', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Properties.Family).toBe('postgres16');
      expect(paramGroup.Properties.Parameters.shared_preload_libraries).toBe('pg_stat_statements');
      expect(paramGroup.Properties.Parameters.log_min_duration_statement).toBe(1000);
    });

    test('should create primary database with production-ready configuration', () => {
      const primaryDB = template.Resources.PrimaryDB;
      expect(primaryDB.Type).toBe('AWS::RDS::DBInstance');
      expect(primaryDB.DeletionPolicy).toBe('Snapshot');
      expect(primaryDB.Properties.Engine).toBe('postgres');
      expect(primaryDB.Properties.EngineVersion).toBe('16.6');
      expect(primaryDB.Properties.MultiAZ).toBe(true);
      expect(primaryDB.Properties.StorageEncrypted).toBe(true);
      expect(primaryDB.Properties.StorageType).toBe('gp3');
      expect(primaryDB.Properties.EnableIAMDatabaseAuthentication).toBe(true);
      expect(primaryDB.Properties.EnablePerformanceInsights).toBe(true);
    });

    test('should create read replicas for read-heavy e-commerce workloads', () => {
      const replica1 = template.Resources.ReadReplica1;
      const replica2 = template.Resources.ReadReplica2;

      expect(replica1.Type).toBe('AWS::RDS::DBInstance');
      expect(replica2.Type).toBe('AWS::RDS::DBInstance');
      expect(replica1.DeletionPolicy).toBe('Delete');
      expect(replica2.DeletionPolicy).toBe('Delete');

      // Validate replicas reference primary database
      expect(replica1.Properties.SourceDBInstanceIdentifier).toEqual({ 'Ref': 'PrimaryDB' });
      expect(replica2.Properties.SourceDBInstanceIdentifier).toEqual({ 'Ref': 'PrimaryDB' });

      // Validate replicas are in different AZs
      expect(replica1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }]
      });
      expect(replica2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }]
      });
    });

    test('should create DB subnet group spanning multiple AZs', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { 'Ref': 'PrivateSubnet1' },
        { 'Ref': 'PrivateSubnet2' }
      ]);
    });
  });

  describe('Security Configuration', () => {
    test('should create KMS key for database encryption', () => {
      const kmsKey = template.Resources.DBEncryptionKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Condition).toBe('CreateKMSKey');
      expect(kmsKey.DeletionPolicy).toBe('Retain');
      expect(kmsKey.UpdateReplacePolicy).toBe('Retain');

      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toHaveLength(3);
      expect(keyPolicy.Statement[1].Principal.Service).toBe('rds.amazonaws.com');
    });

    test('should create Secrets Manager secret for database password', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('should create IAM roles with least-privilege access', () => {
      const exportRole = template.Resources.RDSExportRole;
      const monitoringRole = template.Resources.EnhancedMonitoringRole;
      const iamAuthRole = template.Resources.DBIAMAuthRole;

      expect(exportRole.Type).toBe('AWS::IAM::Role');
      expect(monitoringRole.Type).toBe('AWS::IAM::Role');
      expect(iamAuthRole.Type).toBe('AWS::IAM::Role');

      // Validate monitoring role has correct managed policy
      expect(monitoringRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });
  });

  describe('Backup and Storage Configuration', () => {
    test('should create S3 bucket for database backups with proper policies', () => {
      const bucket = template.Resources.BackupBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Retain'); // Changed for automated testing
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Validate lifecycle rules for cost optimization
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toHaveLength(3);

      const transitionRule = lifecycleRules.find((rule: any) => rule.Id === 'TransitionToIA');
      expect(transitionRule.Transitions[0].TransitionInDays).toBe(30);
      expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');
    });

    test('should configure bucket policy for secure access', () => {
      const bucketPolicy = template.Resources.BackupBucketPolicy;
      expect(bucketPolicy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = bucketPolicy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(2);

      // Validate RDS export permissions
      const exportStatement = statements.find(stmt => stmt.Sid === 'AllowRDSExport');
      expect(exportStatement.Principal.Service).toBe('export.rds.amazonaws.com');

      // Validate secure transport requirement
      const securityStatement = statements.find(stmt => stmt.Sid === 'DenyInsecureTransport');
      expect(securityStatement.Effect).toBe('Deny');
      expect(securityStatement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });
  });

  describe('Monitoring and Alerting', () => {
    test('should create CloudWatch alarms for database monitoring', () => {
      const alarmResources = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );

      expect(alarmResources).toHaveLength(8);

      // Validate specific alarms exist
      expect(template.Resources.PrimaryHighCPUAlarm).toBeDefined();
      expect(template.Resources.Replica1LagAlarm).toBeDefined();
      expect(template.Resources.ReadLatencyAlarm).toBeDefined();
      expect(template.Resources.WriteLatencyAlarm).toBeDefined();
      expect(template.Resources.LowStorageAlarm).toBeDefined();
    });

    test('should configure CPU alarm thresholds appropriately', () => {
      const cpuAlarm = template.Resources.PrimaryHighCPUAlarm;
      expect(cpuAlarm.Properties.Threshold).toBe(75);
      expect(cpuAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should configure replica lag alarms for read consistency', () => {
      const lagAlarm = template.Resources.Replica1LagAlarm;
      expect(lagAlarm.Properties.Threshold).toBe(30000); // 30 seconds in milliseconds
      expect(lagAlarm.Properties.MetricName).toBe('ReplicaLag');
    });

    test('should create CloudWatch dashboard for monitoring', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');

      const dashboardBody = JSON.parse(dashboard.Properties.DashboardBody['Fn::Sub'][0]);
      expect(dashboardBody.widgets).toHaveLength(6);
      expect(dashboardBody.widgets[0].properties.title).toBe('CPU Utilization');
      expect(dashboardBody.widgets[3].properties.title).toBe('Replica Lag');
    });
  });

  describe('Template Outputs', () => {
    test('should provide all necessary connection outputs', () => {
      const connectionOutputs = [
        'PrimaryDBEndpoint',
        'PrimaryDBPort',
        'ReadReplica1Endpoint',
        'ReadReplica2Endpoint',
        'ConnectionString',
        'ReadConnectionStrings'
      ];

      connectionOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should provide security and credential outputs', () => {
      const securityOutputs = [
        'DBSecretArn',
        'KMSKeyId',
        'DBIAMAuthRoleArn',
        'IAMAuthTokenCommand',
        'RetrievePasswordCommand'
      ];

      securityOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should provide monitoring and operational outputs', () => {
      const operationalOutputs = [
        'CloudWatchDashboardURL',
        'PerformanceInsightsURL',
        'BackupBucketName',
        'SnapshotExportCommand'
      ];

      operationalOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should format connection strings correctly', () => {
      const connectionString = template.Outputs.ConnectionString;
      expect(connectionString.Value['Fn::Sub']).toContain('postgresql://');
      expect(connectionString.Value['Fn::Sub']).toContain('${DBMasterUsername}');
      expect(connectionString.Value['Fn::Sub']).toContain('${PrimaryDB.Endpoint.Address}');
    });
  });

  describe('Resource Naming Conventions', () => {
    test('should use consistent naming pattern with environment suffix', () => {
      const resourcesWithNaming = [
        'VPC',
        'PrimaryDB',
        'ReadReplica1',
        'BackupBucket',
        'DBSecurityGroup'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find(tag => tag.Key === 'Name');
          expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('should include environment tags on all taggable resources', () => {
      const taggedResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const envTag = resource.Properties.Tags.find(tag => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ 'Ref': 'EnvironmentSuffix' });
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have appropriate number of resources for e-commerce RDS infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Comprehensive infrastructure
      expect(resourceCount).toBeLessThan(60); // Not overly complex
    });

    test('should have comprehensive parameter coverage', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBeGreaterThanOrEqual(12);
    });

    test('should have adequate output coverage', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(20);
    });

    test('should reference all critical AWS services for e-commerce workload', () => {
      const resourceTypes = Object.values(template.Resources).map((resource: any) => resource.Type);

      // Validate presence of critical resource types
      expect(resourceTypes).toContain('AWS::RDS::DBInstance'); // Primary and replicas
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::SecretsManager::Secret');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::CloudWatch::Dashboard');
      expect(resourceTypes).toContain('AWS::IAM::Role');
    });
  });
});
