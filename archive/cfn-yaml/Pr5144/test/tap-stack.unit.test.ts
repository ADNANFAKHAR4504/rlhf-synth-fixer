import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - PCI-DSS Database Infrastructure', () => {
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
      expect(template.Description).toContain('PCI-DSS compliant');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have DBName parameter', () => {
      expect(template.Parameters.DBName).toBeDefined();
      expect(template.Parameters.DBName.Type).toBe('String');
      expect(template.Parameters.DBName.Default).toBe('transactions');
    });

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.Type).toBe('String');
      expect(template.Parameters.DBInstanceClass.AllowedValues).toContain('db.t3.small');
    });

    test('should have CacheNodeType parameter', () => {
      expect(template.Parameters.CacheNodeType).toBeDefined();
      expect(template.Parameters.CacheNodeType.Type).toBe('String');
      expect(template.Parameters.CacheNodeType.AllowedValues).toContain('cache.t3.micro');
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('VPC should have PCI-DSS compliance tag', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      const complianceTag = tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('PCI-DSS');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('private subnets should have PCI-DSS compliance tag', () => {
      const privateSubnet1Tags = template.Resources.PrivateSubnet1.Properties.Tags;
      const complianceTag = privateSubnet1Tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('PCI-DSS');
    });

    test('subnets should be in different availability zones', () => {
      const subnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(subnet1AZ).toBeDefined();
      expect(subnet2AZ).toBeDefined();
      expect(subnet1AZ['Fn::Select'][0]).toBe(0);
      expect(subnet2AZ['Fn::Select'][0]).toBe(1);
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have public route to internet gateway', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({Ref: 'InternetGateway'});
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have RDS security group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ElastiCache security group', () => {
      expect(template.Resources.ElastiCacheSecurityGroup).toBeDefined();
      expect(template.Resources.ElastiCacheSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have Application security group', () => {
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS security group should allow MySQL from application tier', () => {
      const rdsSecurityGroup = template.Resources.RDSSecurityGroup;
      const ingress = rdsSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(3306);
      expect(ingress.ToPort).toBe(3306);
      expect(ingress.SourceSecurityGroupId).toEqual({Ref: 'ApplicationSecurityGroup'});
    });

    test('ElastiCache security group should allow Redis from application tier', () => {
      const elasticacheSecurityGroup = template.Resources.ElastiCacheSecurityGroup;
      const ingress = elasticacheSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingress.IpProtocol).toBe('tcp');
      expect(ingress.FromPort).toBe(6379);
      expect(ingress.ToPort).toBe(6379);
      expect(ingress.SourceSecurityGroupId).toEqual({Ref: 'ApplicationSecurityGroup'});
    });

    test('security groups should have PCI-DSS compliance tag', () => {
      const rdsTags = template.Resources.RDSSecurityGroup.Properties.Tags;
      const complianceTag = rdsTags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('PCI-DSS');
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have database secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('database secret should generate password', () => {
      const dbSecret = template.Resources.DBSecret;
      expect(dbSecret.Properties.GenerateSecretString).toBeDefined();
      expect(dbSecret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(dbSecret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
    });

    test('should have Redis auth secret', () => {
      expect(template.Resources.RedisAuthSecret).toBeDefined();
      expect(template.Resources.RedisAuthSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have secret rotation schedule', () => {
      expect(template.Resources.SecretRotationSchedule).toBeDefined();
      expect(template.Resources.SecretRotationSchedule.Type).toBe('AWS::SecretsManager::RotationSchedule');
    });

    test('secret rotation should be every 30 days', () => {
      const rotationSchedule = template.Resources.SecretRotationSchedule;
      expect(rotationSchedule.Properties.RotationRules.AutomaticallyAfterDays).toBe(30);
    });

    test('secrets should have PCI-DSS compliance tag', () => {
      const secretTags = template.Resources.DBSecret.Properties.Tags;
      const complianceTag = secretTags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('PCI-DSS');
    });
  });

  describe('Lambda Rotation Function', () => {
    test('should have rotation Lambda function', () => {
      expect(template.Resources.RotationLambdaFunction).toBeDefined();
      expect(template.Resources.RotationLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have rotation Lambda execution role', () => {
      expect(template.Resources.RotationLambdaExecutionRole).toBeDefined();
      expect(template.Resources.RotationLambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('rotation Lambda should be in VPC', () => {
      const lambdaFunction = template.Resources.RotationLambdaFunction;
      expect(lambdaFunction.Properties.VpcConfig).toBeDefined();
      expect(lambdaFunction.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambdaFunction.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
    });

    test('should have Lambda invoke permission', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      expect(template.Resources.LambdaInvokePermission.Type).toBe('AWS::Lambda::Permission');
      expect(template.Resources.LambdaInvokePermission.Properties.Principal).toBe('secretsmanager.amazonaws.com');
    });

    test('Lambda execution role should have Secrets Manager permissions', () => {
      const role = template.Resources.RotationLambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('SecretsManagerRotationPolicy');
      const statements = policy.PolicyDocument.Statement;
      const secretsManagerStmt = statements.find((s: any) =>
        s.Action.some((a: any) => a.includes('secretsmanager'))
      );
      expect(secretsManagerStmt).toBeDefined();
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS instance', () => {
      expect(template.Resources.DBInstance).toBeDefined();
      expect(template.Resources.DBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS instance should be MySQL', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.Engine).toBe('mysql');
      expect(dbInstance.Properties.EngineVersion).toBe('8.0.43');
    });

    test('RDS instance should be Multi-AZ', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.MultiAZ).toBe(true);
    });

    test('RDS instance should have storage encryption enabled', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS instance should have backup retention of 7 days', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('RDS instance should have CloudWatch logs exports enabled', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.EnableCloudwatchLogsExports).toBeDefined();
      expect(dbInstance.Properties.EnableCloudwatchLogsExports).toContain('error');
      expect(dbInstance.Properties.EnableCloudwatchLogsExports).toContain('audit');
    });

    test('RDS instance should not be publicly accessible', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS instance should have deletion protection disabled', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.DeletionProtection).toBe(false);
    });

    test('RDS instance should have Delete deletion policy', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.DeletionPolicy).toBe('Delete');
    });

    test('RDS instance should reference Secrets Manager for credentials', () => {
      const dbInstance = template.Resources.DBInstance;
      expect(dbInstance.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      });
      expect(dbInstance.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      });
    });

    test('RDS instance should have PCI-DSS compliance tag', () => {
      const dbInstance = template.Resources.DBInstance;
      const tags = dbInstance.Properties.Tags;
      const complianceTag = tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('PCI-DSS');
    });
  });

  describe('ElastiCache Resources', () => {
    test('should have ElastiCache subnet group', () => {
      expect(template.Resources.CacheSubnetGroup).toBeDefined();
      expect(template.Resources.CacheSubnetGroup.Type).toBe('AWS::ElastiCache::SubnetGroup');
    });

    test('should have ElastiCache replication group', () => {
      expect(template.Resources.RedisCluster).toBeDefined();
      expect(template.Resources.RedisCluster.Type).toBe('AWS::ElastiCache::ReplicationGroup');
    });

    test('Redis cluster should be Multi-AZ', () => {
      const redisCluster = template.Resources.RedisCluster;
      expect(redisCluster.Properties.MultiAZEnabled).toBe(true);
      expect(redisCluster.Properties.AutomaticFailoverEnabled).toBe(true);
    });

    test('Redis cluster should have encryption at rest enabled', () => {
      const redisCluster = template.Resources.RedisCluster;
      expect(redisCluster.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('Redis cluster should have snapshot retention', () => {
      const redisCluster = template.Resources.RedisCluster;
      expect(redisCluster.Properties.SnapshotRetentionLimit).toBe(5);
    });

    test('Redis cluster should have two cache clusters', () => {
      const redisCluster = template.Resources.RedisCluster;
      expect(redisCluster.Properties.NumCacheClusters).toBe(2);
    });

    test('Redis cluster should have PCI-DSS compliance tag', () => {
      const redisCluster = template.Resources.RedisCluster;
      const tags = redisCluster.Properties.Tags;
      const complianceTag = tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('PCI-DSS');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have RDS log group', () => {
      expect(template.Resources.RDSLogGroup).toBeDefined();
      expect(template.Resources.RDSLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('RDS log group should have retention period', () => {
      const logGroup = template.Resources.RDSLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnets',
        'PrivateSubnets',
        'RDSEndpoint',
        'RDSPort',
        'DBSecretArn',
        'RedisEndpoint',
        'RedisPort',
        'RedisAuthSecretArn',
        'ApplicationSecurityGroupId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('RDS endpoint output should reference DBInstance', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DBInstance', 'Endpoint.Address']
      });
    });

    test('Redis endpoint output should reference RedisCluster', () => {
      const output = template.Outputs.RedisEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RedisCluster', 'PrimaryEndPoint.Address']
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should use environmentSuffix', () => {
      const namedResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicRouteTable',
        'PrivateRouteTable',
        'RDSSecurityGroup',
        'ElastiCacheSecurityGroup',
        'ApplicationSecurityGroup',
        'DBSecret',
        'RedisAuthSecret',
        'RotationLambdaExecutionRole',
        'RotationLambdaFunction',
        'DBSubnetGroup',
        'DBInstance',
        'CacheSubnetGroup',
        'RedisCluster',
        'RDSLogGroup'
      ];

      namedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        // Check for environment suffix in properties
        const properties = resource.Properties;
        let hasEnvSuffix = false;

        // Check various name properties
        const nameProps = [
          'Name',
          'GroupName',
          'FunctionName',
          'RoleName',
          'DBInstanceIdentifier',
          'DBSubnetGroupName',
          'CacheSubnetGroupName',
          'ReplicationGroupId',
          'LogGroupName'
        ];

        nameProps.forEach(prop => {
          if (properties && properties[prop]) {
            const value = properties[prop];
            if (typeof value === 'object' && value['Fn::Sub']) {
              hasEnvSuffix = value['Fn::Sub'].includes('EnvironmentSuffix');
            }
          }
        });

        // Check tags for Name
        if (properties && properties.Tags) {
          const nameTag = properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag && typeof nameTag.Value === 'object' && nameTag.Value['Fn::Sub']) {
            hasEnvSuffix = nameTag.Value['Fn::Sub'].includes('EnvironmentSuffix');
          }
        }

        // Some resources don't need explicit naming (like AttachGateway, Routes, Associations)
        const exemptResources = ['AttachGateway', 'PublicRoute'];
        if (!exemptResources.includes(resourceName)) {
          expect(hasEnvSuffix).toBe(true);
        }
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

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });

    test('should have all resources with Types', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        expect(template.Resources[resourceKey].Type).toBeDefined();
      });
    });
  });
});
