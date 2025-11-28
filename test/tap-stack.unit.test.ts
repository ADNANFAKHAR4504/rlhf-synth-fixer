import fs from 'fs';
import path from 'path';

describe('Aurora Global Database CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Multi-Region Aurora Global Database with Automated Failover and Health Monitoring'
      );
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(20);
    });

    test('should have IsProduction parameter', () => {
      expect(template.Parameters.IsProduction).toBeDefined();
      const param = template.Parameters.IsProduction;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('false');
      expect(param.AllowedValues).toEqual(['true', 'false']);
    });

    test('should have DBMasterUsername parameter', () => {
      expect(template.Parameters.DBMasterUsername).toBeDefined();
      const param = template.Parameters.DBMasterUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
    });

    test('should have DBMasterPassword parameter with NoEcho and default', () => {
      expect(template.Parameters.DBMasterPassword).toBeDefined();
      const param = template.Parameters.DBMasterPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.Default).toBe('TempPassword123!');
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(41);
    });

    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      const param = template.Parameters.VpcCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
    });

    test('should have exactly 5 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });
  });

  describe('Conditions', () => {
    test('should have IsProductionCondition', () => {
      expect(template.Conditions.IsProductionCondition).toBeDefined();
      expect(template.Conditions.IsProductionCondition).toEqual({
        'Fn::Equals': [{ Ref: 'IsProduction' }, 'true']
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have PrimaryVPC', () => {
      const vpc = template.Resources.PrimaryVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPCGatewayAttachment', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'PrimaryVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet');
    });

    test('subnets should be in different AZs', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      const subnet3 = template.Resources.PrivateSubnet3;

      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
      expect(subnet3.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [2, { 'Fn::GetAZs': { Ref: 'AWS::Region' } }]
      });
    });

    test('subnets should not have public IPs', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have PrivateRouteTable', () => {
      const rt = template.Resources.PrivateRouteTable;
      expect(rt).toBeDefined();
      expect(rt.Type).toBe('AWS::EC2::RouteTable');
      expect(rt.Properties.VpcId).toEqual({ Ref: 'PrimaryVPC' });
    });

    test('should have route table associations for all subnets', () => {
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  describe('Route53 Private Hosted Zone', () => {
    test('should have PrivateHostedZone', () => {
      const hz = template.Resources.PrivateHostedZone;
      expect(hz).toBeDefined();
      expect(hz.Type).toBe('AWS::Route53::HostedZone');
    });

    test('PrivateHostedZone should be associated with VPC', () => {
      const hz = template.Resources.PrivateHostedZone;
      expect(hz.Properties.VPCs).toBeDefined();
      expect(hz.Properties.VPCs[0].VPCId).toEqual({ Ref: 'PrimaryVPC' });
    });

    test('PrivateHostedZone should use internal domain', () => {
      const hz = template.Resources.PrivateHostedZone;
      expect(hz.Properties.Name).toEqual({
        'Fn::Sub': 'aurora-${EnvironmentSuffix}.internal'
      });
    });
  });

  describe('KMS Resources', () => {
    test('should have PrimaryKMSKey with encryption enabled', () => {
      const kmsKey = template.Resources.PrimaryKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
    });

    test('PrimaryKMSKey should have proper IAM permissions', () => {
      const kmsKey = template.Resources.PrimaryKMSKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      expect(statements).toHaveLength(2);

      const rootStatement = statements[0];
      expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
      expect(rootStatement.Action).toBe('kms:*');

      const rdsStatement = statements[1];
      expect(rdsStatement.Sid).toBe('Allow RDS to use the key');
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
      expect(rdsStatement.Action).toContain('kms:Decrypt');
    });

    test('should have PrimaryKMSKeyAlias', () => {
      const alias = template.Resources.PrimaryKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/aurora-primary-${EnvironmentSuffix}'
      });
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'PrimaryKMSKey' });
    });

    test('KMS resources should include environmentSuffix in names', () => {
      const kmsKey = template.Resources.PrimaryKMSKey;
      expect(kmsKey.Properties.Description).toEqual({
        'Fn::Sub': 'KMS key for Aurora encryption in primary region - ${EnvironmentSuffix}'
      });
    });

    test('KMS resources should have proper tags', () => {
      const kmsKey = template.Resources.PrimaryKMSKey;
      const tags = kmsKey.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((tag: any) => tag.Key === 'Name')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'Region')).toBe(true);
    });
  });

  describe('Parameter Groups', () => {
    test('should have DBClusterParameterGroup with aurora-mysql5.7 family', () => {
      const paramGroup = template.Resources.DBClusterParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBClusterParameterGroup');
      expect(paramGroup.Properties.Family).toBe('aurora-mysql5.7');
    });

    test('DBClusterParameterGroup should disable binary logging', () => {
      const paramGroup = template.Resources.DBClusterParameterGroup;
      const params = paramGroup.Properties.Parameters;
      expect(params.binlog_format).toBe('OFF');
    });

    test('DBClusterParameterGroup should enable slow query log', () => {
      const paramGroup = template.Resources.DBClusterParameterGroup;
      const params = paramGroup.Properties.Parameters;
      expect(params.slow_query_log).toBe('1');
      expect(params.long_query_time).toBe('2');
    });

    test('should have DBParameterGroup', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Properties.Family).toBe('aurora-mysql5.7');
    });

    test('parameter groups should include environmentSuffix in names', () => {
      const clusterParamGroup = template.Resources.DBClusterParameterGroup;
      expect(clusterParamGroup.Properties.Description).toEqual({
        'Fn::Sub': 'Aurora MySQL 5.7 cluster parameter group - ${EnvironmentSuffix}'
      });
    });
  });

  describe('Security Groups', () => {
    test('should have AuroraSecurityGroup', () => {
      const sg = template.Resources.AuroraSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'PrimaryVPC' });
    });

    test('should have LambdaSecurityGroup', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.VpcId).toEqual({ Ref: 'PrimaryVPC' });
    });

    test('LambdaSecurityGroup should allow HTTPS egress', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      const egress = sg.Properties.SecurityGroupEgress;
      expect(egress).toHaveLength(1);
      expect(egress[0].FromPort).toBe(443);
      expect(egress[0].ToPort).toBe(443);
      expect(egress[0].IpProtocol).toBe('tcp');
    });

    test('should have AuroraSecurityGroupIngress from Lambda', () => {
      const ingress = template.Resources.AuroraSecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingress.Properties.FromPort).toBe(3306);
      expect(ingress.Properties.ToPort).toBe(3306);
      expect(ingress.Properties.SourceSecurityGroupId).toEqual({
        Ref: 'LambdaSecurityGroup'
      });
    });

    test('should have LambdaSecurityGroupEgress to Aurora', () => {
      const egress = template.Resources.LambdaSecurityGroupEgress;
      expect(egress).toBeDefined();
      expect(egress.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(egress.Properties.FromPort).toBe(3306);
      expect(egress.Properties.ToPort).toBe(3306);
      expect(egress.Properties.DestinationSecurityGroupId).toEqual({
        Ref: 'AuroraSecurityGroup'
      });
    });

    test('security groups should include environmentSuffix in names', () => {
      const sg = template.Resources.AuroraSecurityGroup;
      const name = sg.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(name.Value).toEqual({
        'Fn::Sub': 'aurora-sg-${EnvironmentSuffix}'
      });
    });
  });

  describe('DB Subnet Group', () => {
    test('should have PrimaryDBSubnetGroup', () => {
      const subnetGroup = template.Resources.PrimaryDBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('PrimaryDBSubnetGroup should reference created subnets', () => {
      const subnetGroup = template.Resources.PrimaryDBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
        { Ref: 'PrivateSubnet3' }
      ]);
    });

    test('PrimaryDBSubnetGroup should include environmentSuffix in name', () => {
      const subnetGroup = template.Resources.PrimaryDBSubnetGroup;
      expect(subnetGroup.Properties.DBSubnetGroupName).toEqual({
        'Fn::Sub': 'aurora-subnet-primary-${EnvironmentSuffix}'
      });
    });
  });

  describe('Aurora Global Cluster', () => {
    test('should have GlobalCluster', () => {
      const globalCluster = template.Resources.GlobalCluster;
      expect(globalCluster).toBeDefined();
      expect(globalCluster.Type).toBe('AWS::RDS::GlobalCluster');
      expect(globalCluster.Properties.Engine).toBe('aurora-mysql');
      expect(globalCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('GlobalCluster should use engine version 5.7.mysql_aurora.2.12.5', () => {
      const globalCluster = template.Resources.GlobalCluster;
      expect(globalCluster.Properties.EngineVersion).toBe('5.7.mysql_aurora.2.12.5');
    });

    test('GlobalCluster should have conditional deletion protection', () => {
      const globalCluster = template.Resources.GlobalCluster;
      expect(globalCluster.Properties.DeletionProtection).toEqual({
        'Fn::If': ['IsProductionCondition', true, false]
      });
    });

    test('GlobalCluster should include environmentSuffix in identifier', () => {
      const globalCluster = template.Resources.GlobalCluster;
      expect(globalCluster.Properties.GlobalClusterIdentifier).toEqual({
        'Fn::Sub': 'aurora-global-${EnvironmentSuffix}'
      });
    });
  });

  describe('Primary Aurora Cluster', () => {
    test('should have PrimaryCluster', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('PrimaryCluster should reference GlobalCluster', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.GlobalClusterIdentifier).toEqual({
        Ref: 'GlobalCluster'
      });
    });

    test('PrimaryCluster should have 7-day backup retention', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('PrimaryCluster should not have backtrack (not supported for global databases)', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.BacktrackWindow).toBeUndefined();
    });

    test('PrimaryCluster should enable IAM database authentication', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.EnableIAMDatabaseAuthentication).toBe(true);
    });

    test('PrimaryCluster should enable CloudWatch log exports', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toEqual(['slowquery', 'error']);
    });

    test('PrimaryCluster should use KMS encryption', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['PrimaryKMSKey', 'Arn']
      });
    });

    test('PrimaryCluster should have conditional deletion protection', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.DeletionProtection).toEqual({
        'Fn::If': ['IsProductionCondition', true, false]
      });
    });

    test('PrimaryCluster should reference security group', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.VpcSecurityGroupIds).toEqual([
        { Ref: 'AuroraSecurityGroup' }
      ]);
    });

    test('PrimaryCluster should reference parameter groups', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.DBClusterParameterGroupName).toEqual({
        Ref: 'DBClusterParameterGroup'
      });
    });

    test('PrimaryCluster should include environmentSuffix in identifier', () => {
      const cluster = template.Resources.PrimaryCluster;
      expect(cluster.Properties.DBClusterIdentifier).toEqual({
        'Fn::Sub': 'aurora-primary-${EnvironmentSuffix}'
      });
    });
  });

  describe('DB Instances', () => {
    test('should have PrimaryInstance1', () => {
      const instance = template.Resources.PrimaryInstance1;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-mysql');
      expect(instance.Properties.DBInstanceClass).toBe('db.r5.large');
    });

    test('should have PrimaryInstance2', () => {
      const instance = template.Resources.PrimaryInstance2;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-mysql');
      expect(instance.Properties.DBInstanceClass).toBe('db.r5.large');
    });

    test('instances should reference PrimaryCluster', () => {
      const instance1 = template.Resources.PrimaryInstance1;
      const instance2 = template.Resources.PrimaryInstance2;
      expect(instance1.Properties.DBClusterIdentifier).toEqual({ Ref: 'PrimaryCluster' });
      expect(instance2.Properties.DBClusterIdentifier).toEqual({ Ref: 'PrimaryCluster' });
    });

    test('instances should not be publicly accessible', () => {
      const instance1 = template.Resources.PrimaryInstance1;
      const instance2 = template.Resources.PrimaryInstance2;
      expect(instance1.Properties.PubliclyAccessible).toBe(false);
      expect(instance2.Properties.PubliclyAccessible).toBe(false);
    });

    test('instances should enable Performance Insights', () => {
      const instance1 = template.Resources.PrimaryInstance1;
      expect(instance1.Properties.EnablePerformanceInsights).toBe(true);
      expect(instance1.Properties.PerformanceInsightsRetentionPeriod).toBe(7);
    });

    test('instances should have enhanced monitoring', () => {
      const instance1 = template.Resources.PrimaryInstance1;
      expect(instance1.Properties.MonitoringInterval).toBe(60);
      expect(instance1.Properties.MonitoringRoleArn).toEqual({
        'Fn::GetAtt': ['RDSMonitoringRole', 'Arn']
      });
    });

    test('instances should include environmentSuffix in identifiers', () => {
      const instance1 = template.Resources.PrimaryInstance1;
      expect(instance1.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'aurora-primary-1-${EnvironmentSuffix}'
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have RDSMonitoringRole', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole'
      );
    });

    test('RDSMonitoringRole should trust monitoring.rds.amazonaws.com', () => {
      const role = template.Resources.RDSMonitoringRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('monitoring.rds.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('should have LambdaExecutionRole', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have VPC access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('LambdaExecutionRole should have RDS describe permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('RDSDescribeAccess');

      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('rds:DescribeDBClusters');
      expect(statement.Action).toContain('rds:DescribeDBInstances');
    });

    test('LambdaExecutionRole should have CloudWatch permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const statement = policy.PolicyDocument.Statement[1];
      expect(statement.Action).toContain('cloudwatch:PutMetricData');
    });

    test('LambdaExecutionRole should include environmentSuffix in name', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName).toEqual({
        'Fn::Sub': 'aurora-health-check-role-${EnvironmentSuffix}'
      });
    });
  });

  describe('Lambda Health Check', () => {
    test('should have PrimaryHealthCheckFunction', () => {
      const lambda = template.Resources.PrimaryHealthCheckFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('PrimaryHealthCheckFunction should have 5 second timeout', () => {
      const lambda = template.Resources.PrimaryHealthCheckFunction;
      expect(lambda.Properties.Timeout).toBe(5);
    });

    test('PrimaryHealthCheckFunction should have environment variables', () => {
      const lambda = template.Resources.PrimaryHealthCheckFunction;
      const env = lambda.Properties.Environment.Variables;
      expect(env.CLUSTER_ID).toEqual({ Ref: 'PrimaryCluster' });
      expect(env.REGION).toBe('us-east-1');
      expect(env.ENVIRONMENT_SUFFIX).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('PrimaryHealthCheckFunction should be in VPC with created subnets', () => {
      const lambda = template.Resources.PrimaryHealthCheckFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toEqual([
        { Ref: 'LambdaSecurityGroup' }
      ]);
      expect(lambda.Properties.VpcConfig.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
        { Ref: 'PrivateSubnet3' }
      ]);
    });

    test('PrimaryHealthCheckFunction should have inline code', () => {
      const lambda = template.Resources.PrimaryHealthCheckFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('boto3');
    });

    test('should have PrimaryHealthCheckSchedule with 1 minute rate', () => {
      const schedule = template.Resources.PrimaryHealthCheckSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Type).toBe('AWS::Events::Rule');
      expect(schedule.Properties.ScheduleExpression).toBe('rate(1 minute)');
      expect(schedule.Properties.State).toBe('ENABLED');
    });

    test('PrimaryHealthCheckSchedule should target lambda function', () => {
      const schedule = template.Resources.PrimaryHealthCheckSchedule;
      const target = schedule.Properties.Targets[0];
      expect(target.Arn).toEqual({
        'Fn::GetAtt': ['PrimaryHealthCheckFunction', 'Arn']
      });
    });

    test('should have PrimaryHealthCheckPermission', () => {
      const permission = template.Resources.PrimaryHealthCheckPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Route53 Health Check', () => {
    test('should have PrimaryRoute53HealthCheck', () => {
      const healthCheck = template.Resources.PrimaryRoute53HealthCheck;
      expect(healthCheck).toBeDefined();
      expect(healthCheck.Type).toBe('AWS::Route53::HealthCheck');
      expect(healthCheck.Properties.HealthCheckConfig.Type).toBe('CLOUDWATCH_METRIC');
    });

    test('PrimaryRoute53HealthCheck should monitor CloudWatch alarm', () => {
      const healthCheck = template.Resources.PrimaryRoute53HealthCheck;
      const config = healthCheck.Properties.HealthCheckConfig;
      expect(config.AlarmIdentifier.Name).toEqual({
        Ref: 'PrimaryClusterHealthAlarm'
      });
      expect(config.AlarmIdentifier.Region).toBe('us-east-1');
    });

    test('PrimaryRoute53HealthCheck should treat insufficient data as unhealthy', () => {
      const healthCheck = template.Resources.PrimaryRoute53HealthCheck;
      expect(healthCheck.Properties.HealthCheckConfig.InsufficientDataHealthStatus).toBe('Unhealthy');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have PrimaryClusterHealthAlarm', () => {
      const alarm = template.Resources.PrimaryClusterHealthAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ClusterHealth');
      expect(alarm.Properties.Namespace).toBe('Aurora/HealthCheck');
    });

    test('PrimaryClusterHealthAlarm should have correct threshold', () => {
      const alarm = template.Resources.PrimaryClusterHealthAlarm;
      expect(alarm.Properties.Threshold).toBe(0.5);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('PrimaryClusterHealthAlarm should treat missing data as breaching', () => {
      const alarm = template.Resources.PrimaryClusterHealthAlarm;
      expect(alarm.Properties.TreatMissingData).toBe('breaching');
    });

    test('should have ReplicationLagAlarm', () => {
      const alarm = template.Resources.ReplicationLagAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('AuroraGlobalDBReplicationLag');
    });

    test('ReplicationLagAlarm should have 1000ms threshold', () => {
      const alarm = template.Resources.ReplicationLagAlarm;
      expect(alarm.Properties.Threshold).toBe(1000);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('ReplicationLagAlarm should include environmentSuffix in name', () => {
      const alarm = template.Resources.ReplicationLagAlarm;
      expect(alarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'aurora-replication-lag-${EnvironmentSuffix}'
      });
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have SlowQueryLogGroup', () => {
      const logGroup = template.Resources.SlowQueryLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have ErrorLogGroup', () => {
      const logGroup = template.Resources.ErrorLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('log groups should reference PrimaryCluster', () => {
      const slowLog = template.Resources.SlowQueryLogGroup;
      const errorLog = template.Resources.ErrorLogGroup;
      expect(slowLog.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/rds/cluster/${PrimaryCluster}/slowquery'
      });
      expect(errorLog.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/rds/cluster/${PrimaryCluster}/error'
      });
    });
  });

  describe('Route53 DNS Records', () => {
    test('should have PrimaryDNSRecord', () => {
      const record = template.Resources.PrimaryDNSRecord;
      expect(record).toBeDefined();
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Type).toBe('CNAME');
    });

    test('PrimaryDNSRecord should reference PrivateHostedZone', () => {
      const record = template.Resources.PrimaryDNSRecord;
      expect(record.Properties.HostedZoneId).toEqual({ Ref: 'PrivateHostedZone' });
    });

    test('PrimaryDNSRecord should have weighted routing', () => {
      const record = template.Resources.PrimaryDNSRecord;
      expect(record.Properties.SetIdentifier).toBe('Primary');
      expect(record.Properties.Weight).toBe(100);
    });

    test('PrimaryDNSRecord should reference cluster endpoint', () => {
      const record = template.Resources.PrimaryDNSRecord;
      expect(record.Properties.ResourceRecords).toEqual([
        { 'Fn::GetAtt': ['PrimaryCluster', 'Endpoint.Address'] }
      ]);
    });

    test('PrimaryDNSRecord should reference health check', () => {
      const record = template.Resources.PrimaryDNSRecord;
      expect(record.Properties.HealthCheckId).toEqual({
        Ref: 'PrimaryRoute53HealthCheck'
      });
    });

    test('should have PrimaryReaderDNSRecord', () => {
      const record = template.Resources.PrimaryReaderDNSRecord;
      expect(record).toBeDefined();
      expect(record.Type).toBe('AWS::Route53::RecordSet');
    });

    test('PrimaryReaderDNSRecord should use reader endpoint', () => {
      const record = template.Resources.PrimaryReaderDNSRecord;
      expect(record.Properties.ResourceRecords).toEqual([
        { 'Fn::GetAtt': ['PrimaryCluster', 'ReadEndpoint.Address'] }
      ]);
    });

    test('DNS records should use internal domain names', () => {
      const primary = template.Resources.PrimaryDNSRecord;
      const reader = template.Resources.PrimaryReaderDNSRecord;
      expect(primary.Properties.Name).toEqual({
        'Fn::Sub': 'db.aurora-${EnvironmentSuffix}.internal'
      });
      expect(reader.Properties.Name).toEqual({
        'Fn::Sub': 'reader.db.aurora-${EnvironmentSuffix}.internal'
      });
    });
  });

  describe('Outputs', () => {
    test('should have VpcId output', () => {
      const output = template.Outputs.VpcId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PrimaryVPC' });
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet3Id).toBeDefined();
    });

    test('should have HostedZoneId output', () => {
      const output = template.Outputs.HostedZoneId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PrivateHostedZone' });
    });

    test('should have GlobalClusterId output', () => {
      const output = template.Outputs.GlobalClusterId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'GlobalCluster' });
      expect(output.Export).toBeDefined();
    });

    test('should have PrimaryClusterId output', () => {
      const output = template.Outputs.PrimaryClusterId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'PrimaryCluster' });
    });

    test('should have PrimaryClusterEndpoint output', () => {
      const output = template.Outputs.PrimaryClusterEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PrimaryCluster', 'Endpoint.Address']
      });
    });

    test('should have PrimaryClusterReaderEndpoint output', () => {
      const output = template.Outputs.PrimaryClusterReaderEndpoint;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PrimaryCluster', 'ReadEndpoint.Address']
      });
    });

    test('should have PrimaryClusterPort output', () => {
      const output = template.Outputs.PrimaryClusterPort;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PrimaryCluster', 'Endpoint.Port']
      });
    });

    test('should have KMS key outputs', () => {
      expect(template.Outputs.PrimaryKMSKeyId).toBeDefined();
      expect(template.Outputs.PrimaryKMSKeyArn).toBeDefined();
    });

    test('should have HealthCheckFunctionArn output', () => {
      const output = template.Outputs.HealthCheckFunctionArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['PrimaryHealthCheckFunction', 'Arn']
      });
    });

    test('should have AuroraSecurityGroupId output', () => {
      const output = template.Outputs.AuroraSecurityGroupId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'AuroraSecurityGroup' });
    });

    test('should have DNS endpoint outputs', () => {
      expect(template.Outputs.DNSEndpoint).toBeDefined();
      expect(template.Outputs.ReaderDNSEndpoint).toBeDefined();
    });

    test('DNS endpoint outputs should use internal domain format', () => {
      expect(template.Outputs.DNSEndpoint.Value).toEqual({
        'Fn::Sub': 'db.aurora-${EnvironmentSuffix}.internal'
      });
      expect(template.Outputs.ReaderDNSEndpoint.Value).toEqual({
        'Fn::Sub': 'reader.db.aurora-${EnvironmentSuffix}.internal'
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 36 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(36);
    });

    test('should have exactly 5 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(5);
    });

    test('should have exactly 17 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(17);
    });

    test('should have exactly 1 condition', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(1);
    });
  });

  describe('environmentSuffix Usage', () => {
    test('key resources should include environmentSuffix', () => {
      const resourcesWithSuffix = [
        'PrimaryKMSKey',
        'PrimaryKMSKeyAlias',
        'DBClusterParameterGroup',
        'DBParameterGroup',
        'AuroraSecurityGroup',
        'LambdaSecurityGroup',
        'PrimaryDBSubnetGroup',
        'GlobalCluster',
        'PrimaryCluster',
        'PrimaryInstance1',
        'PrimaryInstance2',
        'RDSMonitoringRole',
        'LambdaExecutionRole',
        'PrimaryHealthCheckFunction',
        'PrimaryHealthCheckSchedule',
        'PrimaryRoute53HealthCheck',
        'PrimaryClusterHealthAlarm',
        'ReplicationLagAlarm',
        'PrivateHostedZone',
        'PrimaryVPC'
      ];

      resourcesWithSuffix.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const resourceStr = JSON.stringify(resource);
        expect(resourceStr).toMatch(/EnvironmentSuffix/);
      });
    });
  });

  describe('Self-Contained Architecture', () => {
    test('template should create its own VPC', () => {
      expect(template.Resources.PrimaryVPC).toBeDefined();
      expect(template.Resources.PrimaryVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('template should create its own subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('template should create its own private hosted zone', () => {
      expect(template.Resources.PrivateHostedZone).toBeDefined();
      expect(template.Resources.PrivateHostedZone.Type).toBe('AWS::Route53::HostedZone');
    });

    test('all networking should reference created resources', () => {
      // Security groups should reference created VPC
      expect(template.Resources.AuroraSecurityGroup.Properties.VpcId).toEqual({ Ref: 'PrimaryVPC' });
      expect(template.Resources.LambdaSecurityGroup.Properties.VpcId).toEqual({ Ref: 'PrimaryVPC' });

      // Subnet group should reference created subnets
      expect(template.Resources.PrimaryDBSubnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
        { Ref: 'PrivateSubnet3' }
      ]);

      // DNS records should reference created hosted zone
      expect(template.Resources.PrimaryDNSRecord.Properties.HostedZoneId).toEqual({ Ref: 'PrivateHostedZone' });
      expect(template.Resources.PrimaryReaderDNSRecord.Properties.HostedZoneId).toEqual({ Ref: 'PrivateHostedZone' });
    });
  });
});
