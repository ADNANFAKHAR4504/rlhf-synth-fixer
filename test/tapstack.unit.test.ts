import { describe, it, expect, beforeAll } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template;
  let resources;
  let parameters;
  let outputs;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
    resources = template.Resources;
    parameters = template.Parameters;
    outputs = template.Outputs;
  });

  describe('Template Structure', () => {
    it('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.length).toBeGreaterThan(0);
    });

    it('should have Parameters section', () => {
      expect(parameters).toBeDefined();
      expect(Object.keys(parameters).length).toBeGreaterThan(0);
    });

    it('should have Resources section', () => {
      expect(resources).toBeDefined();
      expect(Object.keys(resources).length).toBeGreaterThan(0);
    });

    it('should have Outputs section', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    it('should have EnvironmentSuffix parameter with default', () => {
      expect(parameters.EnvironmentSuffix).toBeDefined();
      expect(parameters.EnvironmentSuffix.Type).toBe('String');
      expect(parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    it('should have DatabaseName parameter with default', () => {
      expect(parameters.DatabaseName).toBeDefined();
      expect(parameters.DatabaseName.Default).toBe('financialdb');
    });

    it('should have MasterUsername parameter', () => {
      expect(parameters.MasterUsername).toBeDefined();
      expect(parameters.MasterUsername.Default).toBe('admin');
    });

    it('should have MasterUserPassword parameter with NoEcho', () => {
      expect(parameters.MasterUserPassword).toBeDefined();
      expect(parameters.MasterUserPassword.NoEcho).toBe(true);
      expect(parameters.MasterUserPassword.MinLength).toBe(8);
    });

    it('should have EnableDeletionProtection parameter', () => {
      expect(parameters.EnableDeletionProtection).toBeDefined();
      expect(parameters.EnableDeletionProtection.Default).toBe('false');
      expect(parameters.EnableDeletionProtection.AllowedValues).toEqual(['true', 'false']);
    });
  });

  describe('VPC Resources', () => {
    it('should have VPC resource', () => {
      expect(resources.VPC).toBeDefined();
      expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    it('VPC should have correct CIDR block', () => {
      expect(resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    it('VPC should enable DNS hostnames and support', () => {
      expect(resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    it('should have three private subnets', () => {
      expect(resources.PrivateSubnet1).toBeDefined();
      expect(resources.PrivateSubnet2).toBeDefined();
      expect(resources.PrivateSubnet3).toBeDefined();
    });

    it('private subnets should have correct CIDR blocks', () => {
      expect(resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    it('private subnets should be in different AZs', () => {
      const subnet1AZ = resources.PrivateSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = resources.PrivateSubnet2.Properties.AvailabilityZone;
      const subnet3AZ = resources.PrivateSubnet3.Properties.AvailabilityZone;

      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
      expect(subnet3AZ['Fn::Select'][0]).toBe(2);
    });
  });

  describe('KMS Resources', () => {
    it('should have KMS key resource', () => {
      expect(resources.PrimaryKMSKey).toBeDefined();
      expect(resources.PrimaryKMSKey.Type).toBe('AWS::KMS::Key');
    });

    it('KMS key should have proper policy', () => {
      const keyPolicy = resources.PrimaryKMSKey.Properties.KeyPolicy;
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
    });

    it('KMS key should allow RDS service', () => {
      const keyPolicy = resources.PrimaryKMSKey.Properties.KeyPolicy;
      const rdsStatement = keyPolicy.Statement.find(
        (stmt) => stmt.Principal && stmt.Principal.Service === 'rds.amazonaws.com'
      );
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Action).toContain('kms:Decrypt');
    });

    it('should have KMS key alias', () => {
      expect(resources.PrimaryKMSKeyAlias).toBeDefined();
      expect(resources.PrimaryKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    it('KMS alias should reference KMS key', () => {
      expect(resources.PrimaryKMSKeyAlias.Properties.TargetKeyId.Ref).toBe('PrimaryKMSKey');
    });
  });

  describe('Aurora Global Database', () => {
    it('should have Global Cluster resource', () => {
      expect(resources.GlobalCluster).toBeDefined();
      expect(resources.GlobalCluster.Type).toBe('AWS::RDS::GlobalCluster');
    });

    it('Global Cluster should use Aurora MySQL', () => {
      const props = resources.GlobalCluster.Properties;
      expect(props.Engine).toBe('aurora-mysql');
      expect(props.EngineVersion).toBe('5.7.mysql_aurora.2.11.2');
    });

    it('Global Cluster should have storage encryption', () => {
      expect(resources.GlobalCluster.Properties.StorageEncrypted).toBe(true);
    });

    it('Global Cluster identifier should include EnvironmentSuffix', () => {
      const identifier = resources.GlobalCluster.Properties.GlobalClusterIdentifier;
      expect(identifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('DB Subnet Group', () => {
    it('should have DB subnet group', () => {
      expect(resources.DBSubnetGroup).toBeDefined();
      expect(resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    it('should reference all three subnets', () => {
      const subnetIds = resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(3);
      expect(subnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(subnetIds[1].Ref).toBe('PrivateSubnet2');
      expect(subnetIds[2].Ref).toBe('PrivateSubnet3');
    });

    it('should have environmentSuffix in name', () => {
      const name = resources.DBSubnetGroup.Properties.DBSubnetGroupName;
      expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('DB Parameter Groups', () => {
    it('should have cluster parameter group', () => {
      expect(resources.DBClusterParameterGroup).toBeDefined();
      expect(resources.DBClusterParameterGroup.Type).toBe('AWS::RDS::DBClusterParameterGroup');
    });

    it('cluster parameter group should disable binary logging', () => {
      const params = resources.DBClusterParameterGroup.Properties.Parameters;
      expect(params.binlog_format).toBe('OFF');
    });

    it('should have instance parameter group', () => {
      expect(resources.DBParameterGroup).toBeDefined();
      expect(resources.DBParameterGroup.Type).toBe('AWS::RDS::DBParameterGroup');
    });

    it('instance parameter group should enable slow query log', () => {
      const params = resources.DBParameterGroup.Properties.Parameters;
      expect(params.slow_query_log).toBe('1');
      expect(params.long_query_time).toBe('2');
    });

    it('parameter groups should have correct family', () => {
      expect(resources.DBClusterParameterGroup.Properties.Family).toBe('aurora-mysql5.7');
      expect(resources.DBParameterGroup.Properties.Family).toBe('aurora-mysql5.7');
    });
  });

  describe('Security Group', () => {
    it('should have DB security group', () => {
      expect(resources.DBSecurityGroup).toBeDefined();
      expect(resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    it('should reference VPC', () => {
      expect(resources.DBSecurityGroup.Properties.VpcId.Ref).toBe('VPC');
    });

    it('should allow MySQL port 3306', () => {
      const ingress = resources.DBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].IpProtocol).toBe('tcp');
    });

    it('should include environmentSuffix in name', () => {
      const name = resources.DBSecurityGroup.Properties.GroupName;
      expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Primary DB Cluster', () => {
    it('should have primary DB cluster', () => {
      expect(resources.PrimaryDBCluster).toBeDefined();
      expect(resources.PrimaryDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    it('should depend on Global Cluster', () => {
      expect(resources.PrimaryDBCluster.DependsOn).toBe('GlobalCluster');
    });

    it('should reference Global Cluster', () => {
      const gcIdentifier = resources.PrimaryDBCluster.Properties.GlobalClusterIdentifier;
      expect(gcIdentifier.Ref).toBe('GlobalCluster');
    });

    it('should use correct engine and version', () => {
      const props = resources.PrimaryDBCluster.Properties;
      expect(props.Engine).toBe('aurora-mysql');
      expect(props.EngineVersion).toBe('5.7.mysql_aurora.2.11.2');
    });

    it('should have 7-day backup retention', () => {
      expect(resources.PrimaryDBCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    it('should have backup window configured', () => {
      expect(resources.PrimaryDBCluster.Properties.PreferredBackupWindow).toBe('03:00-04:00');
    });

    it('should have maintenance window configured', () => {
      expect(resources.PrimaryDBCluster.Properties.PreferredMaintenanceWindow).toBe('mon:04:00-mon:05:00');
    });

    it('should have storage encryption enabled', () => {
      expect(resources.PrimaryDBCluster.Properties.StorageEncrypted).toBe(true);
    });

    it('should use KMS key', () => {
      expect(resources.PrimaryDBCluster.Properties.KmsKeyId.Ref).toBe('PrimaryKMSKey');
    });

    it('should export CloudWatch logs', () => {
      const logs = resources.PrimaryDBCluster.Properties.EnableCloudwatchLogsExports;
      expect(logs).toContain('slowquery');
      expect(logs).toContain('error');
    });

    it('should have 24-hour backtrack window', () => {
      expect(resources.PrimaryDBCluster.Properties.BacktrackWindow).toBe(86400);
    });

    it('should reference deletion protection parameter', () => {
      const delProtection = resources.PrimaryDBCluster.Properties.DeletionProtection;
      expect(delProtection.Ref).toBe('EnableDeletionProtection');
    });

    it('should include environmentSuffix in identifier', () => {
      const identifier = resources.PrimaryDBCluster.Properties.DBClusterIdentifier;
      expect(identifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should reference subnet group', () => {
      expect(resources.PrimaryDBCluster.Properties.DBSubnetGroupName.Ref).toBe('DBSubnetGroup');
    });

    it('should reference cluster parameter group', () => {
      expect(resources.PrimaryDBCluster.Properties.DBClusterParameterGroupName.Ref).toBe('DBClusterParameterGroup');
    });

    it('should reference security group', () => {
      const sgIds = resources.PrimaryDBCluster.Properties.VpcSecurityGroupIds;
      expect(sgIds).toHaveLength(1);
      expect(sgIds[0].Ref).toBe('DBSecurityGroup');
    });
  });

  describe('DB Instances', () => {
    it('should have two primary instances', () => {
      expect(resources.PrimaryDBInstance1).toBeDefined();
      expect(resources.PrimaryDBInstance2).toBeDefined();
    });

    it('instances should be correct type', () => {
      expect(resources.PrimaryDBInstance1.Type).toBe('AWS::RDS::DBInstance');
      expect(resources.PrimaryDBInstance2.Type).toBe('AWS::RDS::DBInstance');
    });

    it('instances should reference primary cluster', () => {
      expect(resources.PrimaryDBInstance1.Properties.DBClusterIdentifier.Ref).toBe('PrimaryDBCluster');
      expect(resources.PrimaryDBInstance2.Properties.DBClusterIdentifier.Ref).toBe('PrimaryDBCluster');
    });

    it('instances should use db.r5.large', () => {
      expect(resources.PrimaryDBInstance1.Properties.DBInstanceClass).toBe('db.r5.large');
      expect(resources.PrimaryDBInstance2.Properties.DBInstanceClass).toBe('db.r5.large');
    });

    it('instances should not be publicly accessible', () => {
      expect(resources.PrimaryDBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(resources.PrimaryDBInstance2.Properties.PubliclyAccessible).toBe(false);
    });

    it('instances should use aurora-mysql engine', () => {
      expect(resources.PrimaryDBInstance1.Properties.Engine).toBe('aurora-mysql');
      expect(resources.PrimaryDBInstance2.Properties.Engine).toBe('aurora-mysql');
    });

    it('instances should reference parameter group', () => {
      expect(resources.PrimaryDBInstance1.Properties.DBParameterGroupName.Ref).toBe('DBParameterGroup');
      expect(resources.PrimaryDBInstance2.Properties.DBParameterGroupName.Ref).toBe('DBParameterGroup');
    });

    it('instances should include environmentSuffix in identifiers', () => {
      const id1 = resources.PrimaryDBInstance1.Properties.DBInstanceIdentifier['Fn::Sub'];
      const id2 = resources.PrimaryDBInstance2.Properties.DBInstanceIdentifier['Fn::Sub'];
      expect(id1).toContain('${EnvironmentSuffix}');
      expect(id2).toContain('${EnvironmentSuffix}');
    });
  });

  describe('CloudWatch Resources', () => {
    it('should have replication lag alarm', () => {
      expect(resources.ReplicationLagAlarm).toBeDefined();
      expect(resources.ReplicationLagAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    it('alarm should monitor correct metric', () => {
      const props = resources.ReplicationLagAlarm.Properties;
      expect(props.MetricName).toBe('AuroraGlobalDBReplicationLag');
      expect(props.Namespace).toBe('AWS/RDS');
    });

    it('alarm should have 1000ms threshold', () => {
      expect(resources.ReplicationLagAlarm.Properties.Threshold).toBe(1000);
    });

    it('alarm should check every 60 seconds', () => {
      expect(resources.ReplicationLagAlarm.Properties.Period).toBe(60);
    });

    it('alarm should evaluate 2 periods', () => {
      expect(resources.ReplicationLagAlarm.Properties.EvaluationPeriods).toBe(2);
    });

    it('alarm should use Average statistic', () => {
      expect(resources.ReplicationLagAlarm.Properties.Statistic).toBe('Average');
    });

    it('alarm should monitor primary cluster', () => {
      const dimensions = resources.ReplicationLagAlarm.Properties.Dimensions;
      expect(dimensions).toHaveLength(1);
      expect(dimensions[0].Name).toBe('DBClusterIdentifier');
      expect(dimensions[0].Value.Ref).toBe('PrimaryDBCluster');
    });

    it('should have slow query log group', () => {
      expect(resources.SlowQueryLogGroup).toBeDefined();
      expect(resources.SlowQueryLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    it('should have error log group', () => {
      expect(resources.ErrorLogGroup).toBeDefined();
      expect(resources.ErrorLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    it('log groups should have 30-day retention', () => {
      expect(resources.SlowQueryLogGroup.Properties.RetentionInDays).toBe(30);
      expect(resources.ErrorLogGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Lambda Resources', () => {
    it('should have Lambda execution role', () => {
      expect(resources.LambdaExecutionRole).toBeDefined();
      expect(resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    it('execution role should trust Lambda service', () => {
      const trustPolicy = resources.LambdaExecutionRole.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    it('execution role should have managed policies', () => {
      const policies = resources.LambdaExecutionRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    it('execution role should have RDS describe permissions', () => {
      const policies = resources.LambdaExecutionRole.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('RDSDescribeAccess');
      const actions = policies[0].PolicyDocument.Statement[0].Action;
      expect(actions).toContain('rds:DescribeDBClusters');
      expect(actions).toContain('rds:DescribeDBInstances');
    });

    it('should have health check function', () => {
      expect(resources.HealthCheckFunction).toBeDefined();
      expect(resources.HealthCheckFunction.Type).toBe('AWS::Lambda::Function');
    });

    it('health check should use Python 3.11', () => {
      expect(resources.HealthCheckFunction.Properties.Runtime).toBe('python3.11');
    });

    it('health check should have 5 second timeout', () => {
      expect(resources.HealthCheckFunction.Properties.Timeout).toBe(5);
    });

    it('health check should reference execution role', () => {
      const role = resources.HealthCheckFunction.Properties.Role['Fn::GetAtt'];
      expect(role[0]).toBe('LambdaExecutionRole');
      expect(role[1]).toBe('Arn');
    });

    it('health check should be in VPC', () => {
      const vpcConfig = resources.HealthCheckFunction.Properties.VpcConfig;
      expect(vpcConfig.SubnetIds).toHaveLength(3);
      expect(vpcConfig.SecurityGroupIds).toHaveLength(1);
    });

    it('health check should have environment variables', () => {
      const env = resources.HealthCheckFunction.Properties.Environment.Variables;
      expect(env.CLUSTER_ENDPOINT).toBeDefined();
      expect(env.CLUSTER_IDENTIFIER).toBeDefined();
    });

    it('health check should have inline code', () => {
      const code = resources.HealthCheckFunction.Properties.Code.ZipFile;
      expect(code).toContain('def lambda_handler');
      expect(code).toContain('boto3');
    });

    it('health check function name should include environmentSuffix', () => {
      const name = resources.HealthCheckFunction.Properties.FunctionName;
      expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('EventBridge Resources', () => {
    it('should have health check schedule rule', () => {
      expect(resources.HealthCheckScheduleRule).toBeDefined();
      expect(resources.HealthCheckScheduleRule.Type).toBe('AWS::Events::Rule');
    });

    it('schedule should run every 30 seconds', () => {
      expect(resources.HealthCheckScheduleRule.Properties.ScheduleExpression).toBe('rate(30 seconds)');
    });

    it('schedule should be enabled', () => {
      expect(resources.HealthCheckScheduleRule.Properties.State).toBe('ENABLED');
    });

    it('schedule should target health check function', () => {
      const targets = resources.HealthCheckScheduleRule.Properties.Targets;
      expect(targets).toHaveLength(1);
      expect(targets[0].Arn['Fn::GetAtt'][0]).toBe('HealthCheckFunction');
    });

    it('should have Lambda permission for EventBridge', () => {
      expect(resources.HealthCheckPermission).toBeDefined();
      expect(resources.HealthCheckPermission.Type).toBe('AWS::Lambda::Permission');
    });

    it('permission should allow EventBridge to invoke', () => {
      const props = resources.HealthCheckPermission.Properties;
      expect(props.Action).toBe('lambda:InvokeFunction');
      expect(props.Principal).toBe('events.amazonaws.com');
    });

    it('permission should reference function and rule', () => {
      const props = resources.HealthCheckPermission.Properties;
      expect(props.FunctionName.Ref).toBe('HealthCheckFunction');
      expect(props.SourceArn['Fn::GetAtt'][0]).toBe('HealthCheckScheduleRule');
    });
  });

  describe('Outputs', () => {
    it('should have Global Cluster Identifier output', () => {
      expect(outputs.GlobalClusterIdentifier).toBeDefined();
      expect(outputs.GlobalClusterIdentifier.Value.Ref).toBe('GlobalCluster');
    });

    it('should have Primary Cluster Endpoint output', () => {
      expect(outputs.PrimaryClusterEndpoint).toBeDefined();
      const getAtt = outputs.PrimaryClusterEndpoint.Value['Fn::GetAtt'];
      expect(getAtt[0]).toBe('PrimaryDBCluster');
      expect(getAtt[1]).toBe('Endpoint.Address');
    });

    it('should have Primary Cluster Reader Endpoint output', () => {
      expect(outputs.PrimaryClusterReaderEndpoint).toBeDefined();
      const getAtt = outputs.PrimaryClusterReaderEndpoint.Value['Fn::GetAtt'];
      expect(getAtt[0]).toBe('PrimaryDBCluster');
      expect(getAtt[1]).toBe('ReadEndpoint.Address');
    });

    it('should have KMS Key ID output', () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyId.Value.Ref).toBe('PrimaryKMSKey');
    });

    it('should have VPC ID output', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId.Value.Ref).toBe('VPC');
    });

    it('should have subnet ID outputs', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet3Id).toBeDefined();
    });

    it('should have security group output', () => {
      expect(outputs.DBSecurityGroupId).toBeDefined();
      expect(outputs.DBSecurityGroupId.Value.Ref).toBe('DBSecurityGroup');
    });

    it('should have Lambda function ARN output', () => {
      expect(outputs.LambdaHealthCheckFunctionArn).toBeDefined();
    });

    it('critical outputs should have exports', () => {
      expect(outputs.GlobalClusterIdentifier.Export).toBeDefined();
      expect(outputs.PrimaryClusterEndpoint.Export).toBeDefined();
      expect(outputs.PrimaryClusterReaderEndpoint.Export).toBeDefined();
      expect(outputs.VPCId.Export).toBeDefined();
    });

    it('exports should include environmentSuffix', () => {
      const gcExport = outputs.GlobalClusterIdentifier.Export.Name['Fn::Sub'];
      const pcExport = outputs.PrimaryClusterEndpoint.Export.Name['Fn::Sub'];
      const vpcExport = outputs.VPCId.Export.Name['Fn::Sub'];

      expect(gcExport).toContain('${EnvironmentSuffix}');
      expect(pcExport).toContain('${EnvironmentSuffix}');
      expect(vpcExport).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Resource Naming Convention', () => {
    it('all named resources should include environmentSuffix', () => {
      const namedResources = [
        'VPC',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
        'PrimaryKMSKeyAlias',
        'GlobalCluster',
        'DBSubnetGroup',
        'DBClusterParameterGroup',
        'DBParameterGroup',
        'DBSecurityGroup',
        'PrimaryDBCluster',
        'PrimaryDBInstance1',
        'PrimaryDBInstance2',
        'ReplicationLagAlarm',
        'SlowQueryLogGroup',
        'ErrorLogGroup',
        'LambdaExecutionRole',
        'HealthCheckFunction',
        'HealthCheckScheduleRule'
      ];

      namedResources.forEach((resourceName) => {
        const resource = resources[resourceName];
        expect(resource).toBeDefined();

        const props = resource.Properties;
        const nameFields = [
          'Name', 'GroupName', 'DBClusterIdentifier', 'DBInstanceIdentifier',
          'GlobalClusterIdentifier', 'DBSubnetGroupName', 'AlarmName',
          'LogGroupName', 'RoleName', 'FunctionName', 'AliasName'
        ];

        let hasEnvironmentSuffix = false;
        nameFields.forEach((field) => {
          if (props[field]) {
            const value = props[field]['Fn::Sub'] || props[field];
            if (typeof value === 'string' && value.includes('${EnvironmentSuffix}')) {
              hasEnvironmentSuffix = true;
            }
          }
        });

        if (['Tags'].some(field => props[field])) {
          const tags = props.Tags;
          if (Array.isArray(tags)) {
            tags.forEach(tag => {
              if (tag.Key === 'Name' && tag.Value && tag.Value['Fn::Sub']) {
                if (tag.Value['Fn::Sub'].includes('${EnvironmentSuffix}')) {
                  hasEnvironmentSuffix = true;
                }
              }
            });
          }
        }

        if (!hasEnvironmentSuffix) {
          console.log(`MISSING environmentSuffix: ${resourceName}`);
        }
        expect(hasEnvironmentSuffix).toBe(true);
      });
    });
  });

  describe('Security Best Practices', () => {
    it('password parameter should use NoEcho', () => {
      expect(parameters.MasterUserPassword.NoEcho).toBe(true);
    });

    it('DB instances should not be publicly accessible', () => {
      expect(resources.PrimaryDBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(resources.PrimaryDBInstance2.Properties.PubliclyAccessible).toBe(false);
    });

    it('storage should be encrypted', () => {
      expect(resources.GlobalCluster.Properties.StorageEncrypted).toBe(true);
      expect(resources.PrimaryDBCluster.Properties.StorageEncrypted).toBe(true);
    });

    it('should use customer-managed KMS keys', () => {
      expect(resources.PrimaryDBCluster.Properties.KmsKeyId.Ref).toBe('PrimaryKMSKey');
    });

    it('security group should restrict access to private CIDR', () => {
      const ingress = resources.DBSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.CidrIp).toBe('10.0.0.0/8');
    });

    it('IAM role should have least privilege', () => {
      const policies = resources.LambdaExecutionRole.Properties.Policies[0];
      const actions = policies.PolicyDocument.Statement[0].Action;
      expect(actions).not.toContain('*');
      expect(actions).not.toContain('rds:*');
    });
  });

  describe('High Availability Configuration', () => {
    it('should have backups enabled', () => {
      expect(resources.PrimaryDBCluster.Properties.BackupRetentionPeriod).toBeGreaterThan(0);
    });

    it('should have multiple instances', () => {
      expect(resources.PrimaryDBInstance1).toBeDefined();
      expect(resources.PrimaryDBInstance2).toBeDefined();
    });

    it('should span multiple availability zones', () => {
      const subnet1AZ = resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
      const subnet2AZ = resources.PrivateSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
      const subnet3AZ = resources.PrivateSubnet3.Properties.AvailabilityZone['Fn::Select'][0];

      expect(subnet1AZ).not.toBe(subnet2AZ);
      expect(subnet2AZ).not.toBe(subnet3AZ);
      expect(subnet1AZ).not.toBe(subnet3AZ);
    });

    it('should have monitoring enabled', () => {
      expect(resources.ReplicationLagAlarm).toBeDefined();
      expect(resources.HealthCheckFunction).toBeDefined();
      expect(resources.HealthCheckScheduleRule).toBeDefined();
    });
  });

  describe('Compliance Requirements', () => {
    it('should have 7-day backup retention', () => {
      expect(resources.PrimaryDBCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    it('should have 24-hour backtrack window', () => {
      expect(resources.PrimaryDBCluster.Properties.BacktrackWindow).toBe(86400);
    });

    it('should have 30-day log retention', () => {
      expect(resources.SlowQueryLogGroup.Properties.RetentionInDays).toBe(30);
      expect(resources.ErrorLogGroup.Properties.RetentionInDays).toBe(30);
    });

    it('should export slow query and error logs', () => {
      const logs = resources.PrimaryDBCluster.Properties.EnableCloudwatchLogsExports;
      expect(logs).toContain('slowquery');
      expect(logs).toContain('error');
    });

    it('should disable binary logging on cluster', () => {
      const params = resources.DBClusterParameterGroup.Properties.Parameters;
      expect(params.binlog_format).toBe('OFF');
    });
  });
});
