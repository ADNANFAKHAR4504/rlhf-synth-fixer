const fs = require('fs');
const path = require('path');

describe('CloudFormation Template Unit Tests', () => {
  let template;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/tapstack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    it('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('RDS Aurora MySQL');
    });

    it('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    it('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    it('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    it('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
    });

    it('should have VpcId parameter', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('AWS::EC2::VPC::Id');
    });

    it('should have three private subnet parameters', () => {
      expect(template.Parameters.PrivateSubnet1).toBeDefined();
      expect(template.Parameters.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet::Id');
      expect(template.Parameters.PrivateSubnet2).toBeDefined();
      expect(template.Parameters.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet::Id');
      expect(template.Parameters.PrivateSubnet3).toBeDefined();
      expect(template.Parameters.PrivateSubnet3.Type).toBe('AWS::EC2::Subnet::Id');
    });

    it('should have three application subnet CIDR parameters', () => {
      expect(template.Parameters.ApplicationSubnetCidr1).toBeDefined();
      expect(template.Parameters.ApplicationSubnetCidr1.AllowedPattern).toBeDefined();
      expect(template.Parameters.ApplicationSubnetCidr2).toBeDefined();
      expect(template.Parameters.ApplicationSubnetCidr2.AllowedPattern).toBeDefined();
      expect(template.Parameters.ApplicationSubnetCidr3).toBeDefined();
      expect(template.Parameters.ApplicationSubnetCidr3.AllowedPattern).toBeDefined();
    });

    it('should have MasterUsername parameter with constraints', () => {
      expect(template.Parameters.MasterUsername).toBeDefined();
      expect(template.Parameters.MasterUsername.Type).toBe('String');
      expect(template.Parameters.MasterUsername.MinLength).toBe(1);
      expect(template.Parameters.MasterUsername.MaxLength).toBe(16);
      expect(template.Parameters.MasterUsername.AllowedPattern).toBeDefined();
    });

    it('should have MasterPassword parameter with NoEcho', () => {
      expect(template.Parameters.MasterPassword).toBeDefined();
      expect(template.Parameters.MasterPassword.NoEcho).toBe(true);
      expect(template.Parameters.MasterPassword.MinLength).toBe(8);
    });
  });

  describe('KMS Resources', () => {
    it('should create KMS key with proper configuration', () => {
      const kmsKey = template.Resources.DatabaseEncryptionKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(kmsKey.Properties.KeyPolicy).toBeDefined();
    });

    it('should have KMS key policy with RDS service permissions', () => {
      const kmsKey = template.Resources.DatabaseEncryptionKey;
      const statements = kmsKey.Properties.KeyPolicy.Statement;
      expect(statements).toBeDefined();
      expect(Array.isArray(statements)).toBe(true);

      const rdsStatement = statements.find(s => s.Sid === 'Allow RDS to use the key');
      expect(rdsStatement).toBeDefined();
      expect(rdsStatement.Principal.Service).toBe('rds.amazonaws.com');
      expect(rdsStatement.Action).toContain('kms:Decrypt');
      expect(rdsStatement.Action).toContain('kms:GenerateDataKey');
    });

    it('should have KMS key alias with environmentSuffix', () => {
      const alias = template.Resources.DatabaseEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should tag KMS key with environment', () => {
      const kmsKey = template.Resources.DatabaseEncryptionKey;
      expect(kmsKey.Properties.Tags).toBeDefined();
      expect(Array.isArray(kmsKey.Properties.Tags)).toBe(true);

      const nameTag = kmsKey.Properties.Tags.find(t => t.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Group', () => {
    it('should create security group with MySQL access rules', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress.length).toBe(3);
    });

    it('should allow MySQL port 3306 from application subnets', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      sg.Properties.SecurityGroupIngress.forEach(rule => {
        expect(rule.IpProtocol).toBe('tcp');
        expect(rule.FromPort).toBe(3306);
        expect(rule.ToPort).toBe(3306);
        expect(rule.CidrIp).toBeDefined();
      });
    });

    it('should use VpcId parameter', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Properties.VpcId.Ref).toBe('VpcId');
    });

    it('should include environmentSuffix in name', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('DB Subnet Group', () => {
    it('should create DB subnet group with three subnets', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
      expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
    });

    it('should reference all three private subnet parameters', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      const subnetRefs = subnetGroup.Properties.SubnetIds.map(s => s.Ref);
      expect(subnetRefs).toContain('PrivateSubnet1');
      expect(subnetRefs).toContain('PrivateSubnet2');
      expect(subnetRefs).toContain('PrivateSubnet3');
    });

    it('should include environmentSuffix in name', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Properties.DBSubnetGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('DB Parameter Groups', () => {
    it('should create cluster parameter group with UTF8MB4', () => {
      const paramGroup = template.Resources.DatabaseClusterParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBClusterParameterGroup');
      expect(paramGroup.Properties.Family).toBe('aurora-mysql8.0');
      expect(paramGroup.Properties.Parameters.character_set_server).toBe('utf8mb4');
      expect(paramGroup.Properties.Parameters.character_set_client).toBe('utf8mb4');
      expect(paramGroup.Properties.Parameters.character_set_database).toBe('utf8mb4');
      expect(paramGroup.Properties.Parameters.collation_server).toBe('utf8mb4_unicode_ci');
    });

    it('should create instance parameter group', () => {
      const paramGroup = template.Resources.DatabaseInstanceParameterGroup;
      expect(paramGroup).toBeDefined();
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Properties.Family).toBe('aurora-mysql8.0');
    });
  });

  describe('Aurora Cluster', () => {
    it('should create Aurora MySQL cluster', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster).toBeDefined();
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
    });

    it('should use MySQL 8.0 engine version', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.EngineVersion).toMatch(/^8\.0/);
    });

    it('should enable KMS encryption', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.StorageEncrypted).toBe(true);
      expect(cluster.Properties.KmsKeyId.Ref).toBe('DatabaseEncryptionKey');
    });

    it('should have 30-day backup retention', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.BackupRetentionPeriod).toBe(30);
    });

    it('should have backup window 03:00-04:00', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.PreferredBackupWindow).toBe('03:00-04:00');
    });

    it('should enable CloudWatch log exports', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('audit');
      expect(cluster.Properties.EnableCloudwatchLogsExports).toContain('error');
    });

    it('should have DeletionPolicy Delete', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
    });

    it('should have DeletionProtection disabled for testing', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });

    it('should include environmentSuffix in cluster identifier', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBClusterIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should reference parameter groups', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.DBClusterParameterGroupName.Ref).toBe('DatabaseClusterParameterGroup');
      expect(cluster.Properties.DBSubnetGroupName.Ref).toBe('DatabaseSubnetGroup');
    });

    it('should reference security group', () => {
      const cluster = template.Resources.AuroraCluster;
      expect(cluster.Properties.VpcSecurityGroupIds).toBeDefined();
      expect(cluster.Properties.VpcSecurityGroupIds[0].Ref).toBe('DatabaseSecurityGroup');
    });
  });

  describe('DB Instances', () => {
    it('should create writer instance', () => {
      const instance = template.Resources.AuroraWriterInstance;
      expect(instance).toBeDefined();
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.DBInstanceClass).toBe('db.r5.large');
    });

    it('should create two reader instances', () => {
      const reader1 = template.Resources.AuroraReaderInstance1;
      const reader2 = template.Resources.AuroraReaderInstance2;
      expect(reader1).toBeDefined();
      expect(reader1.Type).toBe('AWS::RDS::DBInstance');
      expect(reader1.Properties.DBInstanceClass).toBe('db.r5.large');
      expect(reader2).toBeDefined();
      expect(reader2.Type).toBe('AWS::RDS::DBInstance');
      expect(reader2.Properties.DBInstanceClass).toBe('db.r5.large');
    });

    it('should enable Performance Insights on all instances', () => {
      const writer = template.Resources.AuroraWriterInstance;
      const reader1 = template.Resources.AuroraReaderInstance1;
      const reader2 = template.Resources.AuroraReaderInstance2;

      [writer, reader1, reader2].forEach(instance => {
        expect(instance.Properties.EnablePerformanceInsights).toBe(true);
        expect(instance.Properties.PerformanceInsightsRetentionPeriod).toBe(7);
        expect(instance.Properties.PerformanceInsightsKMSKeyId.Ref).toBe('DatabaseEncryptionKey');
      });
    });

    it('should set PubliclyAccessible to false', () => {
      const writer = template.Resources.AuroraWriterInstance;
      const reader1 = template.Resources.AuroraReaderInstance1;
      const reader2 = template.Resources.AuroraReaderInstance2;

      [writer, reader1, reader2].forEach(instance => {
        expect(instance.Properties.PubliclyAccessible).toBe(false);
      });
    });

    it('should have DeletionPolicy Delete on all instances', () => {
      const writer = template.Resources.AuroraWriterInstance;
      const reader1 = template.Resources.AuroraReaderInstance1;
      const reader2 = template.Resources.AuroraReaderInstance2;

      [writer, reader1, reader2].forEach(instance => {
        expect(instance.DeletionPolicy).toBe('Delete');
      });
    });

    it('should include environmentSuffix in instance identifiers', () => {
      const writer = template.Resources.AuroraWriterInstance;
      const reader1 = template.Resources.AuroraReaderInstance1;
      const reader2 = template.Resources.AuroraReaderInstance2;

      expect(writer.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(reader1.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(reader2.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should tag instances with role', () => {
      const writer = template.Resources.AuroraWriterInstance;
      const reader1 = template.Resources.AuroraReaderInstance1;

      const writerRoleTag = writer.Properties.Tags.find(t => t.Key === 'Role');
      expect(writerRoleTag.Value).toBe('Writer');

      const readerRoleTag = reader1.Properties.Tags.find(t => t.Key === 'Role');
      expect(readerRoleTag.Value).toBe('Reader');
    });
  });

  describe('Outputs', () => {
    it('should output cluster endpoint', () => {
      const output = template.Outputs.ClusterEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('writer endpoint');
      expect(output.Value['Fn::GetAtt']).toEqual(['AuroraCluster', 'Endpoint.Address']);
    });

    it('should output reader endpoint', () => {
      const output = template.Outputs.ReaderEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toContain('reader endpoint');
      expect(output.Value['Fn::GetAtt']).toEqual(['AuroraCluster', 'ReadEndpoint.Address']);
    });

    it('should output cluster port', () => {
      const output = template.Outputs.ClusterPort;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['AuroraCluster', 'Endpoint.Port']);
    });

    it('should output KMS key ARN', () => {
      const output = template.Outputs.KmsKeyArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('KMS key');
      expect(output.Value['Fn::GetAtt']).toEqual(['DatabaseEncryptionKey', 'Arn']);
    });

    it('should output cluster identifier', () => {
      const output = template.Outputs.ClusterIdentifier;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('AuroraCluster');
    });

    it('should output security group ID', () => {
      const output = template.Outputs.SecurityGroupId;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('DatabaseSecurityGroup');
    });

    it('should export all outputs with stack name prefix', () => {
      Object.values(template.Outputs).forEach(output => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Resource Count', () => {
    it('should have exactly 10 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(10);
    });

    it('should have all required resource types', () => {
      const resourceTypes = Object.values(template.Resources).map(r => r.Type);
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::KMS::Alias');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::RDS::DBSubnetGroup');
      expect(resourceTypes).toContain('AWS::RDS::DBClusterParameterGroup');
      expect(resourceTypes).toContain('AWS::RDS::DBParameterGroup');
      expect(resourceTypes).toContain('AWS::RDS::DBCluster');
      expect(resourceTypes.filter(t => t === 'AWS::RDS::DBInstance').length).toBe(3);
    });
  });
});
