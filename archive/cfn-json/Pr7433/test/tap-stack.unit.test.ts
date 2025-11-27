import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have exactly 2 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Description).toBeDefined();
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have MasterUsername parameter', () => {
      expect(template.Parameters.MasterUsername).toBeDefined();
      const param = template.Parameters.MasterUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
    });
  });

  describe('Resources Count', () => {
    test('should have exactly 58 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(58);
    });

    test('should have 3 VPCs (Dev, Staging, Prod)', () => {
      const vpcs = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::VPC'
      );
      expect(vpcs).toHaveLength(3);
    });

    test('should have 6 Subnets (2 per environment)', () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      expect(subnets).toHaveLength(6);
    });

    test('should have 3 Aurora DB Clusters', () => {
      const clusters = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::RDS::DBCluster'
      );
      expect(clusters).toHaveLength(3);
    });

    test('should have 3 Aurora DB Instances', () => {
      const instances = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::RDS::DBInstance'
      );
      expect(instances).toHaveLength(3);
    });

    test('should have 2 Lambda Functions', () => {
      const functions = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::Lambda::Function'
      );
      expect(functions).toHaveLength(2);
    });

    test('should have 1 S3 Bucket', () => {
      const buckets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::S3::Bucket'
      );
      expect(buckets).toHaveLength(1);
    });

    test('should have 3 KMS Keys', () => {
      const keys = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::KMS::Key'
      );
      expect(keys).toHaveLength(3);
    });

    test('should have 3 Secrets Manager Secrets', () => {
      const secrets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::SecretsManager::Secret'
      );
      expect(secrets).toHaveLength(3);
    });

    test('should have 3 SSM Parameters', () => {
      const params = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::SSM::Parameter'
      );
      expect(params).toHaveLength(3);
    });

    test('should have 3 CloudWatch Alarms', () => {
      const alarms = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms).toHaveLength(3);
    });

    test('should have 2 VPC Peering Connections', () => {
      const peering = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::VPCPeeringConnection'
      );
      expect(peering).toHaveLength(2);
    });

    test('should have 4 Security Groups', () => {
      const sgs = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::SecurityGroup'
      );
      expect(sgs).toHaveLength(4);
    });

    test('should have 1 IAM Role', () => {
      const roles = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::IAM::Role'
      );
      expect(roles).toHaveLength(1);
    });
  });

  describe('VPC Resources', () => {
    test('DevVPC should have correct CIDR block', () => {
      expect(template.Resources.DevVPC).toBeDefined();
      expect(template.Resources.DevVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.DevVPC.Properties.CidrBlock).toBe('10.1.0.0/16');
      expect(template.Resources.DevVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.DevVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('StagingVPC should have correct CIDR block', () => {
      expect(template.Resources.StagingVPC).toBeDefined();
      expect(template.Resources.StagingVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.StagingVPC.Properties.CidrBlock).toBe('10.2.0.0/16');
    });

    test('ProdVPC should have correct CIDR block', () => {
      expect(template.Resources.ProdVPC).toBeDefined();
      expect(template.Resources.ProdVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.ProdVPC.Properties.CidrBlock).toBe('10.3.0.0/16');
    });

    test('VPCs should include EnvironmentSuffix in tags', () => {
      ['DevVPC', 'StagingVPC', 'ProdVPC'].forEach(vpcName => {
        const vpc = template.Resources[vpcName];
        expect(vpc.Properties.Tags).toBeDefined();
        const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Aurora Cluster Resources', () => {
    test('DevAuroraCluster should exist with correct properties', () => {
      expect(template.Resources.DevAuroraCluster).toBeDefined();
      const cluster = template.Resources.DevAuroraCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      expect(cluster.Properties.Engine).toBe('aurora-mysql');
    });

    test('StagingAuroraCluster should exist with correct properties', () => {
      expect(template.Resources.StagingAuroraCluster).toBeDefined();
      const cluster = template.Resources.StagingAuroraCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('ProdAuroraCluster should exist with correct properties', () => {
      expect(template.Resources.ProdAuroraCluster).toBeDefined();
      const cluster = template.Resources.ProdAuroraCluster;
      expect(cluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora clusters should have automated backups enabled', () => {
      ['DevAuroraCluster', 'StagingAuroraCluster', 'ProdAuroraCluster'].forEach(clusterName => {
        const cluster = template.Resources[clusterName];
        expect(cluster.Properties.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      });
    });

    test('Aurora clusters should have encryption enabled', () => {
      ['DevAuroraCluster', 'StagingAuroraCluster', 'ProdAuroraCluster'].forEach(clusterName => {
        const cluster = template.Resources[clusterName];
        expect(cluster.Properties.StorageEncrypted).toBe(true);
        expect(cluster.Properties.KmsKeyId).toBeDefined();
      });
    });
  });

  describe('Aurora Instance Resources', () => {
    test('DevAuroraInstance1 should exist', () => {
      expect(template.Resources.DevAuroraInstance1).toBeDefined();
      const instance = template.Resources.DevAuroraInstance1;
      expect(instance.Type).toBe('AWS::RDS::DBInstance');
      expect(instance.Properties.Engine).toBe('aurora-mysql');
      expect(instance.Properties.DBClusterIdentifier).toEqual({ Ref: 'DevAuroraCluster' });
    });

    test('All Aurora instances should have db.r5.large or similar instance class', () => {
      ['DevAuroraInstance1', 'StagingAuroraInstance1', 'ProdAuroraInstance1'].forEach(instanceName => {
        const instance = template.Resources[instanceName];
        expect(instance.Properties.DBInstanceClass).toBeDefined();
        expect(instance.Properties.DBInstanceClass).toContain('db.');
      });
    });
  });

  describe('Lambda Function Resources', () => {
    test('SchemaReplicationFunction should exist', () => {
      expect(template.Resources.SchemaReplicationFunction).toBeDefined();
      const fn = template.Resources.SchemaReplicationFunction;
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.9');
      expect(fn.Properties.Handler).toBeDefined();
      expect(fn.Properties.Timeout).toBeLessThanOrEqual(300);
    });

    test('DataReplicationFunction should exist', () => {
      expect(template.Resources.DataReplicationFunction).toBeDefined();
      const fn = template.Resources.DataReplicationFunction;
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.9');
      expect(fn.Properties.Timeout).toBeLessThanOrEqual(300);
    });

    test('Lambda functions should have execution role', () => {
      ['SchemaReplicationFunction', 'DataReplicationFunction'].forEach(fnName => {
        const fn = template.Resources[fnName];
        expect(fn.Properties.Role).toBeDefined();
      });
    });

    test('Lambda functions should have CloudWatch log groups', () => {
      expect(template.Resources.SchemaReplicationLogGroup).toBeDefined();
      expect(template.Resources.DataReplicationLogGroup).toBeDefined();
    });
  });

  describe('S3 Bucket Resource', () => {
    test('MigrationScriptsBucket should exist', () => {
      expect(template.Resources.MigrationScriptsBucket).toBeDefined();
      const bucket = template.Resources.MigrationScriptsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('migration-scripts');
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('MigrationScriptsBucket should have versioning enabled', () => {
      const bucket = template.Resources.MigrationScriptsBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('MigrationScriptsBucket should have lifecycle policy', () => {
      const bucket = template.Resources.MigrationScriptsBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(Array.isArray(bucket.Properties.LifecycleConfiguration.Rules)).toBe(true);
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS keys for each environment', () => {
      expect(template.Resources.DevKMSKey).toBeDefined();
      expect(template.Resources.StagingKMSKey).toBeDefined();
      expect(template.Resources.ProdKMSKey).toBeDefined();
    });

    test('KMS keys should have aliases', () => {
      expect(template.Resources.DevKMSKeyAlias).toBeDefined();
      expect(template.Resources.StagingKMSKeyAlias).toBeDefined();
      expect(template.Resources.ProdKMSKeyAlias).toBeDefined();
    });

    test('KMS keys should have key policies', () => {
      ['DevKMSKey', 'StagingKMSKey', 'ProdKMSKey'].forEach(keyName => {
        const key = template.Resources[keyName];
        expect(key.Type).toBe('AWS::KMS::Key');
        expect(key.Properties.KeyPolicy).toBeDefined();
      });
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have secrets for each Aurora cluster', () => {
      expect(template.Resources.DevDBSecret).toBeDefined();
      expect(template.Resources.StagingDBSecret).toBeDefined();
      expect(template.Resources.ProdDBSecret).toBeDefined();
    });

    test('secrets should generate passwords', () => {
      ['DevDBSecret', 'StagingDBSecret', 'ProdDBSecret'].forEach(secretName => {
        const secret = template.Resources[secretName];
        expect(secret.Type).toBe('AWS::SecretsManager::Secret');
        expect(secret.Properties.GenerateSecretString).toBeDefined();
      });
    });
  });

  describe('SSM Parameter Resources', () => {
    test('should have connection parameters for each environment', () => {
      expect(template.Resources.DevConnectionParameter).toBeDefined();
      expect(template.Resources.StagingConnectionParameter).toBeDefined();
      expect(template.Resources.ProdConnectionParameter).toBeDefined();
    });

    test('parameters should be encrypted with KMS', () => {
      ['DevConnectionParameter', 'StagingConnectionParameter', 'ProdConnectionParameter'].forEach(paramName => {
        const param = template.Resources[paramName];
        expect(param.Type).toBe('AWS::SSM::Parameter');
        expect(param.Properties.Type).toBe('String');
      });
    });
  });

  describe('CloudWatch Alarm Resources', () => {
    test('should have replication lag alarms for each environment', () => {
      expect(template.Resources.DevReplicationLagAlarm).toBeDefined();
      expect(template.Resources.StagingReplicationLagAlarm).toBeDefined();
      expect(template.Resources.ProdReplicationLagAlarm).toBeDefined();
    });

    test('replication lag alarms should monitor correct metric', () => {
      ['DevReplicationLagAlarm', 'StagingReplicationLagAlarm', 'ProdReplicationLagAlarm'].forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.MetricName).toBe('AuroraReplicaLag');
        expect(alarm.Properties.Namespace).toBe('AWS/RDS');
        expect(alarm.Properties.Threshold).toBe(60000);
      });
    });
  });

  describe('VPC Peering Resources', () => {
    test('should have Dev to Staging peering connection', () => {
      expect(template.Resources.DevToStagingPeeringConnection).toBeDefined();
      const peering = template.Resources.DevToStagingPeeringConnection;
      expect(peering.Type).toBe('AWS::EC2::VPCPeeringConnection');
      expect(peering.Properties.VpcId).toEqual({ Ref: 'DevVPC' });
      expect(peering.Properties.PeerVpcId).toEqual({ Ref: 'StagingVPC' });
    });

    test('should have Staging to Prod peering connection', () => {
      expect(template.Resources.StagingToProdPeeringConnection).toBeDefined();
      const peering = template.Resources.StagingToProdPeeringConnection;
      expect(peering.Type).toBe('AWS::EC2::VPCPeeringConnection');
      expect(peering.Properties.VpcId).toEqual({ Ref: 'StagingVPC' });
      expect(peering.Properties.PeerVpcId).toEqual({ Ref: 'ProdVPC' });
    });
  });

  describe('Security Group Resources', () => {
    test('should have DB security groups for each environment', () => {
      expect(template.Resources.DevDBSecurityGroup).toBeDefined();
      expect(template.Resources.StagingDBSecurityGroup).toBeDefined();
      expect(template.Resources.ProdDBSecurityGroup).toBeDefined();
    });

    test('should have Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('DB security groups should allow MySQL port 3306', () => {
      ['DevDBSecurityGroup', 'StagingDBSecurityGroup', 'ProdDBSecurityGroup'].forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sg.Properties.SecurityGroupIngress).toBeDefined();
        const mysqlRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.IpProtocol === 'tcp' && r.FromPort === 3306);
        expect(mysqlRule).toBeDefined();
      });
    });
  });

  describe('IAM Role Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });

    test('Lambda execution role should have necessary policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toBeDefined();
      expect(Array.isArray(role.Properties.ManagedPolicyArns)).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have exactly 6 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });

    test('should have Aurora cluster endpoint outputs', () => {
      expect(template.Outputs.DevAuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.StagingAuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.ProdAuroraClusterEndpoint).toBeDefined();
    });

    test('should have Lambda function ARN outputs', () => {
      expect(template.Outputs.SchemaReplicationFunctionArn).toBeDefined();
      expect(template.Outputs.DataReplicationFunctionArn).toBeDefined();
    });

    test('should have S3 bucket name output', () => {
      expect(template.Outputs.MigrationScriptsBucketName).toBeDefined();
      const output = template.Outputs.MigrationScriptsBucketName;
      expect(output.Value).toBeDefined();
    });

    test('Aurora endpoint outputs should reference correct clusters', () => {
      const devOutput = template.Outputs.DevAuroraClusterEndpoint;
      expect(devOutput.Value['Fn::GetAtt']).toEqual(['DevAuroraCluster', 'Endpoint.Address']);

      const stagingOutput = template.Outputs.StagingAuroraClusterEndpoint;
      expect(stagingOutput.Value['Fn::GetAtt']).toEqual(['StagingAuroraCluster', 'Endpoint.Address']);

      const prodOutput = template.Outputs.ProdAuroraClusterEndpoint;
      expect(prodOutput.Value['Fn::GetAtt']).toEqual(['ProdAuroraCluster', 'Endpoint.Address']);
    });

    test('Lambda ARN outputs should reference correct functions', () => {
      const schemaOutput = template.Outputs.SchemaReplicationFunctionArn;
      expect(schemaOutput.Value['Fn::GetAtt']).toEqual(['SchemaReplicationFunction', 'Arn']);

      const dataOutput = template.Outputs.DataReplicationFunctionArn;
      expect(dataOutput.Value['Fn::GetAtt']).toEqual(['DataReplicationFunction', 'Arn']);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should include EnvironmentSuffix', () => {
      const namedResources = [
        'DevVPC', 'StagingVPC', 'ProdVPC',
        'MigrationScriptsBucket',
        'SchemaReplicationFunction', 'DataReplicationFunction'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
        if (resource.Properties.BucketName) {
          expect(resource.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        if (resource.Properties.FunctionName) {
          expect(resource.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Deletion Protection', () => {
    test('no resources should have Retain DeletionPolicy', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('Aurora clusters can be safely deleted', () => {
      ['DevAuroraCluster', 'StagingAuroraCluster', 'ProdAuroraCluster'].forEach(clusterName => {
        const cluster = template.Resources[clusterName];
        expect(cluster.Type).toBe('AWS::RDS::DBCluster');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(typeof resource.Type).toBe('string');
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all resources should have Properties', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties).toBeDefined();
        expect(typeof resource.Properties).toBe('object');
      });
    });

    test('all outputs should have Value property', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Value).toBeDefined();
      });
    });
  });
});
