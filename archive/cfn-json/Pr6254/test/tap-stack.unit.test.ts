import fs from 'fs';
import path from 'path';

describe('Aurora PostgreSQL CloudFormation Template Unit Tests', () => {
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

    test('should have appropriate description for Aurora infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Aurora');
      expect(template.Description).toContain('PostgreSQL');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have DeploymentRegion parameter with eu-south-1 default', () => {
      expect(template.Parameters.DeploymentRegion).toBeDefined();
      expect(template.Parameters.DeploymentRegion.Type).toBe('String');
      expect(template.Parameters.DeploymentRegion.Default).toBe('eu-south-1');
      expect(template.Parameters.DeploymentRegion.AllowedValues).toContain('eu-south-1');
      expect(template.Parameters.DeploymentRegion.AllowedValues).toContain('eu-west-2');
      expect(template.Parameters.DeploymentRegion.AllowedValues).toContain('us-east-1');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('prod');
    });

    test('should have DatabaseName parameter with validation', () => {
      expect(template.Parameters.DatabaseName).toBeDefined();
      expect(template.Parameters.DatabaseName.Type).toBe('String');
      expect(template.Parameters.DatabaseName.Default).toBe('transactiondb');
      expect(template.Parameters.DatabaseName.AllowedPattern).toBeDefined();
    });

    test('should have MasterUsername parameter with constraints', () => {
      expect(template.Parameters.MasterUsername).toBeDefined();
      expect(template.Parameters.MasterUsername.Type).toBe('String');
      expect(template.Parameters.MasterUsername.Default).toBe('dbadmin');
      expect(template.Parameters.MasterUsername.MinLength).toBe('1');
      expect(template.Parameters.MasterUsername.MaxLength).toBe('16');
    });

    test('should NOT have VPC parameters (self-contained)', () => {
      expect(template.Parameters.SubnetId1).toBeUndefined();
      expect(template.Parameters.SubnetId2).toBeUndefined();
      expect(template.Parameters.VpcSecurityGroupId).toBeUndefined();
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC with correct CIDR', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have two private subnets in different AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have Database Security Group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = template.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(5432);
      expect(ingress.ToPort).toBe(5432);
    });
  });

  describe('Secrets Manager - DatabaseSecret', () => {
    test('should exist with correct type', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have Delete policies for cleanup', () => {
      expect(template.Resources.DatabaseSecret.DeletionPolicy).toBe('Delete');
      expect(template.Resources.DatabaseSecret.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have name with environmentSuffix', () => {
      const secretName = template.Resources.DatabaseSecret.Properties.Name;
      expect(secretName).toEqual({ 'Fn::Sub': 'aurora-credentials-${EnvironmentSuffix}' });
    });

    test('should generate strong password', () => {
      const genConfig = template.Resources.DatabaseSecret.Properties.GenerateSecretString;
      expect(genConfig.PasswordLength).toBe(32);
      expect(genConfig.RequireEachIncludedType).toBe(true);
      expect(genConfig.ExcludeCharacters).toBeDefined();
    });

    test('should include username in secret template', () => {
      const genConfig = template.Resources.DatabaseSecret.Properties.GenerateSecretString;
      expect(genConfig.SecretStringTemplate).toEqual({ 'Fn::Sub': '{"username":"${MasterUsername}"}' });
      expect(genConfig.GenerateStringKey).toBe('password');
    });

    test('should have proper tags', () => {
      const tags = template.Resources.DatabaseSecret.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment' && t.Value === 'Production')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'ManagedBy' && t.Value === 'CloudFormation')).toBe(true);
    });
  });

  describe('DB Subnet Group', () => {
    test('should exist with correct type', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have Delete policies', () => {
      expect(template.Resources.DBSubnetGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.DBSubnetGroup.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have name with environmentSuffix', () => {
      const name = template.Resources.DBSubnetGroup.Properties.DBSubnetGroupName;
      expect(name).toEqual({ 'Fn::Sub': 'aurora-subnet-group-${EnvironmentSuffix}' });
    });

    test('should reference both private subnets', () => {
      const subnetIds = template.Resources.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have appropriate description', () => {
      const description = template.Resources.DBSubnetGroup.Properties.DBSubnetGroupDescription;
      expect(description).toContain('2 AZ');
    });
  });

  describe('DB Cluster Parameter Group', () => {
    test('should exist with correct type', () => {
      expect(template.Resources.DBClusterParameterGroup).toBeDefined();
      expect(template.Resources.DBClusterParameterGroup.Type).toBe('AWS::RDS::DBClusterParameterGroup');
    });

    test('should have Delete policies', () => {
      expect(template.Resources.DBClusterParameterGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.DBClusterParameterGroup.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have name with environmentSuffix', () => {
      const name = template.Resources.DBClusterParameterGroup.Properties.DBClusterParameterGroupName;
      expect(name).toEqual({ 'Fn::Sub': 'aurora-pg-params-${EnvironmentSuffix}' });
    });

    test('should use PostgreSQL 15 family', () => {
      expect(template.Resources.DBClusterParameterGroup.Properties.Family).toBe('aurora-postgresql15');
    });

    test('should configure log_statement to all', () => {
      const params = template.Resources.DBClusterParameterGroup.Properties.Parameters;
      expect(params.log_statement).toBe('all');
    });
  });

  describe('Aurora Cluster', () => {
    test('should exist with correct type', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('should have Delete policies', () => {
      expect(template.Resources.AuroraCluster.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraCluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have implicit dependencies via Ref functions', () => {
      // CloudFormation automatically infers dependencies from Ref and Fn::GetAtt
      // No explicit DependsOn needed as cfn-lint W3005 warns about redundancy
      const props = template.Resources.AuroraCluster.Properties;
      expect(props.MasterUsername['Fn::Sub']).toContain('DatabaseSecret');
      expect(props.MasterUserPassword['Fn::Sub']).toContain('DatabaseSecret');
      expect(props.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
      expect(props.DBClusterParameterGroupName).toEqual({ Ref: 'DBClusterParameterGroup' });
    });

    test('should have identifier with environmentSuffix', () => {
      const id = template.Resources.AuroraCluster.Properties.DBClusterIdentifier;
      expect(id).toEqual({ 'Fn::Sub': 'aurora-postgres-cluster-${EnvironmentSuffix}' });
    });

    test('should use aurora-postgresql engine', () => {
      expect(template.Resources.AuroraCluster.Properties.Engine).toBe('aurora-postgresql');
    });

    test('should use provisioned engine mode for Serverless v2', () => {
      expect(template.Resources.AuroraCluster.Properties.EngineMode).toBe('provisioned');
    });

    test('should reference DatabaseName parameter', () => {
      expect(template.Resources.AuroraCluster.Properties.DatabaseName).toEqual({ Ref: 'DatabaseName' });
    });

    test('should use dynamic secrets resolution for credentials', () => {
      const username = template.Resources.AuroraCluster.Properties.MasterUsername;
      const password = template.Resources.AuroraCluster.Properties.MasterUserPassword;

      expect(username['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(username['Fn::Sub']).toContain(':SecretString:username');
      expect(password['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(password['Fn::Sub']).toContain(':SecretString:password');
    });

    test('should reference parameter group', () => {
      expect(template.Resources.AuroraCluster.Properties.DBClusterParameterGroupName).toEqual({ Ref: 'DBClusterParameterGroup' });
    });

    test('should reference subnet group', () => {
      expect(template.Resources.AuroraCluster.Properties.DBSubnetGroupName).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('should reference database security group', () => {
      const sgIds = template.Resources.AuroraCluster.Properties.VpcSecurityGroupIds;
      expect(sgIds[0]).toEqual({ Ref: 'DatabaseSecurityGroup' });
    });

    test('should have encryption enabled', () => {
      expect(template.Resources.AuroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have deletion protection disabled for testing', () => {
      expect(template.Resources.AuroraCluster.Properties.DeletionProtection).toBe(false);
    });

    test('should have 7-day backup retention', () => {
      expect(template.Resources.AuroraCluster.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have correct backup window', () => {
      expect(template.Resources.AuroraCluster.Properties.PreferredBackupWindow).toBe('03:00-04:00');
    });

    test('should have maintenance window configured', () => {
      expect(template.Resources.AuroraCluster.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('should export PostgreSQL logs to CloudWatch', () => {
      const logs = template.Resources.AuroraCluster.Properties.EnableCloudwatchLogsExports;
      expect(logs).toContain('postgresql');
    });

    test('should have Serverless v2 scaling configuration', () => {
      const scaling = template.Resources.AuroraCluster.Properties.ServerlessV2ScalingConfiguration;
      expect(scaling).toBeDefined();
      expect(scaling.MinCapacity).toBe(0.5);
      expect(scaling.MaxCapacity).toBe(1);
    });

    test('should have proper tags', () => {
      const tags = template.Resources.AuroraCluster.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.some((t: any) => t.Key === 'Environment' && t.Value === 'Production')).toBe(true);
      expect(tags.some((t: any) => t.Key === 'ManagedBy' && t.Value === 'CloudFormation')).toBe(true);
    });
  });

  describe('Aurora Instances', () => {
    test('should have AuroraInstance1', () => {
      expect(template.Resources.AuroraInstance1).toBeDefined();
      expect(template.Resources.AuroraInstance1.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have AuroraInstance2', () => {
      expect(template.Resources.AuroraInstance2).toBeDefined();
      expect(template.Resources.AuroraInstance2.Type).toBe('AWS::RDS::DBInstance');
    });

    test('AuroraInstance1 should have Delete policies', () => {
      expect(template.Resources.AuroraInstance1.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraInstance1.UpdateReplacePolicy).toBe('Delete');
    });

    test('AuroraInstance2 should have Delete policies', () => {
      expect(template.Resources.AuroraInstance2.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AuroraInstance2.UpdateReplacePolicy).toBe('Delete');
    });

    test('AuroraInstance1 should have implicit dependency on AuroraCluster via Ref', () => {
      // CloudFormation automatically infers dependency from Ref
      expect(template.Resources.AuroraInstance1.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraCluster' });
    });

    test('AuroraInstance2 should depend on AuroraInstance1', () => {
      expect(template.Resources.AuroraInstance2.DependsOn).toBe('AuroraInstance1');
    });

    test('instances should have identifiers with environmentSuffix', () => {
      const id1 = template.Resources.AuroraInstance1.Properties.DBInstanceIdentifier;
      const id2 = template.Resources.AuroraInstance2.Properties.DBInstanceIdentifier;
      expect(id1).toEqual({ 'Fn::Sub': 'aurora-instance-1-${EnvironmentSuffix}' });
      expect(id2).toEqual({ 'Fn::Sub': 'aurora-instance-2-${EnvironmentSuffix}' });
    });

    test('instances should use db.serverless class', () => {
      expect(template.Resources.AuroraInstance1.Properties.DBInstanceClass).toBe('db.serverless');
      expect(template.Resources.AuroraInstance2.Properties.DBInstanceClass).toBe('db.serverless');
    });

    test('instances should reference cluster', () => {
      expect(template.Resources.AuroraInstance1.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraCluster' });
      expect(template.Resources.AuroraInstance2.Properties.DBClusterIdentifier).toEqual({ Ref: 'AuroraCluster' });
    });

    test('instances should use aurora-postgresql engine', () => {
      expect(template.Resources.AuroraInstance1.Properties.Engine).toBe('aurora-postgresql');
      expect(template.Resources.AuroraInstance2.Properties.Engine).toBe('aurora-postgresql');
    });

    test('instances should not be publicly accessible', () => {
      expect(template.Resources.AuroraInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(template.Resources.AuroraInstance2.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('CloudWatch Alarm', () => {
    test('should exist with correct type', () => {
      expect(template.Resources.CPUUtilizationAlarm).toBeDefined();
      expect(template.Resources.CPUUtilizationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Delete policies', () => {
      expect(template.Resources.CPUUtilizationAlarm.DeletionPolicy).toBe('Delete');
      expect(template.Resources.CPUUtilizationAlarm.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have implicit dependency on AuroraCluster via Ref in dimensions', () => {
      // CloudFormation automatically infers dependency from Ref in dimensions
      const dimensions = template.Resources.CPUUtilizationAlarm.Properties.Dimensions;
      const clusterDimension = dimensions.find((d: any) => d.Name === 'DBClusterIdentifier');
      expect(clusterDimension.Value).toEqual({ Ref: 'AuroraCluster' });
    });

    test('should have name with environmentSuffix', () => {
      const name = template.Resources.CPUUtilizationAlarm.Properties.AlarmName;
      expect(name).toEqual({ 'Fn::Sub': 'aurora-cpu-high-${EnvironmentSuffix}' });
    });

    test('should monitor CPUUtilization metric', () => {
      expect(template.Resources.CPUUtilizationAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(template.Resources.CPUUtilizationAlarm.Properties.Namespace).toBe('AWS/RDS');
    });

    test('should use Average statistic', () => {
      expect(template.Resources.CPUUtilizationAlarm.Properties.Statistic).toBe('Average');
    });

    test('should have 5-minute period', () => {
      expect(template.Resources.CPUUtilizationAlarm.Properties.Period).toBe(300);
    });

    test('should have 80% threshold', () => {
      expect(template.Resources.CPUUtilizationAlarm.Properties.Threshold).toBe(80);
    });

    test('should trigger when greater than threshold', () => {
      expect(template.Resources.CPUUtilizationAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have 1 evaluation period', () => {
      expect(template.Resources.CPUUtilizationAlarm.Properties.EvaluationPeriods).toBe(1);
    });

    test('should have cluster dimension', () => {
      const dimensions = template.Resources.CPUUtilizationAlarm.Properties.Dimensions;
      expect(dimensions).toHaveLength(1);
      expect(dimensions[0].Name).toBe('DBClusterIdentifier');
      expect(dimensions[0].Value).toEqual({ Ref: 'AuroraCluster' });
    });

    test('should treat missing data as not breaching', () => {
      expect(template.Resources.CPUUtilizationAlarm.Properties.TreatMissingData).toBe('notBreaching');
    });
  });

  describe('Secret Target Attachment', () => {
    test('should exist with correct type', () => {
      expect(template.Resources.SecretTargetAttachment).toBeDefined();
      expect(template.Resources.SecretTargetAttachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
    });

    test('should have Delete policies', () => {
      expect(template.Resources.SecretTargetAttachment.DeletionPolicy).toBe('Delete');
      expect(template.Resources.SecretTargetAttachment.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have implicit dependencies on DatabaseSecret and AuroraCluster via Ref', () => {
      // CloudFormation automatically infers dependencies from Ref
      const props = template.Resources.SecretTargetAttachment.Properties;
      expect(props.SecretId).toEqual({ Ref: 'DatabaseSecret' });
      expect(props.TargetId).toEqual({ Ref: 'AuroraCluster' });
    });

    test('should reference DatabaseSecret', () => {
      expect(template.Resources.SecretTargetAttachment.Properties.SecretId).toEqual({ Ref: 'DatabaseSecret' });
    });

    test('should reference AuroraCluster', () => {
      expect(template.Resources.SecretTargetAttachment.Properties.TargetId).toEqual({ Ref: 'AuroraCluster' });
    });

    test('should specify correct target type', () => {
      expect(template.Resources.SecretTargetAttachment.Properties.TargetType).toBe('AWS::RDS::DBCluster');
    });
  });

  describe('Outputs', () => {
    test('should have ClusterEndpoint output', () => {
      expect(template.Outputs.ClusterEndpoint).toBeDefined();
      expect(template.Outputs.ClusterEndpoint.Value).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Address']
      });
    });

    test('should have ClusterReaderEndpoint output', () => {
      expect(template.Outputs.ClusterReaderEndpoint).toBeDefined();
      expect(template.Outputs.ClusterReaderEndpoint.Value).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'ReadEndpoint.Address']
      });
    });

    test('should have ClusterPort output', () => {
      expect(template.Outputs.ClusterPort).toBeDefined();
      expect(template.Outputs.ClusterPort.Value).toEqual({
        'Fn::GetAtt': ['AuroraCluster', 'Endpoint.Port']
      });
    });

    test('should have DatabaseSecretArn output', () => {
      expect(template.Outputs.DatabaseSecretArn).toBeDefined();
      expect(template.Outputs.DatabaseSecretArn.Value).toEqual({ Ref: 'DatabaseSecret' });
    });

    test('should have ClusterIdentifier output', () => {
      expect(template.Outputs.ClusterIdentifier).toBeDefined();
      expect(template.Outputs.ClusterIdentifier.Value).toEqual({ Ref: 'AuroraCluster' });
    });

    test('should have DBSubnetGroupName output', () => {
      expect(template.Outputs.DBSubnetGroupName).toBeDefined();
      expect(template.Outputs.DBSubnetGroupName.Value).toEqual({ Ref: 'DBSubnetGroup' });
    });

    test('should have CPUAlarmName output', () => {
      expect(template.Outputs.CPUAlarmName).toBeDefined();
      expect(template.Outputs.CPUAlarmName.Value).toEqual({ Ref: 'CPUUtilizationAlarm' });
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have exactly 14 resources (8 Aurora + 5 VPC + 1 Gateway Attachment)', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(14);
    });

    test('should have exactly 4 parameters (DeploymentRegion, EnvironmentSuffix, DatabaseName, MasterUsername)', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have exactly 10 outputs (8 Aurora + 2 VPC)', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });
  });

  describe('Naming Convention Compliance', () => {
    test('all resource names should include environmentSuffix', () => {
      const resourcesWithNames = [
        'DatabaseSecret',
        'DBSubnetGroup',
        'DBClusterParameterGroup',
        'AuroraCluster',
        'AuroraInstance1',
        'AuroraInstance2',
        'CPUUtilizationAlarm'
      ];

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const nameProperty = resource.Properties.Name ||
                           resource.Properties.DBSubnetGroupName ||
                           resource.Properties.DBClusterParameterGroupName ||
                           resource.Properties.DBClusterIdentifier ||
                           resource.Properties.DBInstanceIdentifier ||
                           resource.Properties.AlarmName;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Deletion Policy Compliance', () => {
    test('all Aurora resources should have Delete policies', () => {
      const auroraResources = ['DatabaseSecret', 'DBSubnetGroup', 'DBClusterParameterGroup', 
                               'AuroraCluster', 'AuroraInstance1', 'AuroraInstance2', 
                               'CPUUtilizationAlarm', 'SecretTargetAttachment'];
      auroraResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('VPC resources should exist (no deletion policy needed)', () => {
      const vpcResources = ['VPC', 'InternetGateway', 'AttachGateway', 
                           'PrivateSubnet1', 'PrivateSubnet2', 'DatabaseSecurityGroup'];
      vpcResources.forEach(resourceKey => {
        expect(template.Resources[resourceKey]).toBeDefined();
      });
    });
  });
});
