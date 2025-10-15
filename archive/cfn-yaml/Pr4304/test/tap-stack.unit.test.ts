import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('StreamFlix Metadata API CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON for testing
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
      expect(template.Description).toContain('StreamFlix');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBUsername.Type).toBe('String');
      expect(template.Parameters.DBUsername.Default).toBe('streamflixadmin');
    });

    test('should have DBInstanceClass parameter with allowed values', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      expect(template.Parameters.DBInstanceClass.AllowedValues).toContain(
        'db.t3.micro'
      );
    });

    test('should have CacheNodeType parameter with allowed values', () => {
      expect(template.Parameters.CacheNodeType).toBeDefined();
      expect(template.Parameters.CacheNodeType.AllowedValues).toContain(
        'cache.t3.micro'
      );
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block and DNS settings', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have Internet Gateway Attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.0.11.0/24'
      );
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.0.12.0/24'
      );
    });

    test('subnets should be in different availability zones', () => {
      const publicSubnet1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const publicSubnet2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(publicSubnet1AZ).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(publicSubnet2AZ).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });

  describe('Route Tables', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe(
        'AWS::EC2::RouteTable'
      );
    });

    test('should have default public route to Internet Gateway', () => {
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPublicRoute.Properties.DestinationCidrBlock).toBe(
        '0.0.0.0/0'
      );
    });

    test('should have route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have API Gateway security group', () => {
      expect(template.Resources.ApiGatewaySecurityGroup).toBeDefined();
      expect(template.Resources.ApiGatewaySecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have Cache security group', () => {
      expect(template.Resources.CacheSecurityGroup).toBeDefined();
      expect(template.Resources.CacheSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('Cache security group should allow Redis port 6379', () => {
      const cacheIngressRules = template.Resources.CacheSecurityGroup.Properties.SecurityGroupIngress;
      expect(cacheIngressRules).toBeDefined();
      expect(cacheIngressRules[0].FromPort).toBe(6379);
      expect(cacheIngressRules[0].ToPort).toBe(6379);
      expect(cacheIngressRules[0].IpProtocol).toBe('tcp');
    });

    test('should have Database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('Database security group should allow PostgreSQL port 5432', () => {
      const dbIngressRules = template.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress;
      expect(dbIngressRules).toBeDefined();
      expect(dbIngressRules[0].FromPort).toBe(5432);
      expect(dbIngressRules[0].ToPort).toBe(5432);
      expect(dbIngressRules[0].IpProtocol).toBe('tcp');
    });
  });

  describe('Secrets Manager', () => {
    test('should have database secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );
    });

    test('database secret should have GenerateSecretString configuration', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });

    test('database secret name should use environment suffix', () => {
      const secretName = template.Resources.DBSecret.Properties.Name;
      expect(secretName).toEqual({
        'Fn::Sub': 'streamflix-db-credentials-${EnvironmentSuffix}'
      });
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe(
        'AWS::RDS::DBSubnetGroup'
      );
    });

    test('RDS subnet group should use private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have RDS database instance', () => {
      expect(template.Resources.MetadataDatabase).toBeDefined();
      expect(template.Resources.MetadataDatabase.Type).toBe(
        'AWS::RDS::DBInstance'
      );
    });

    test('RDS instance should be PostgreSQL', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.Engine).toBe('postgres');
      expect(db.Properties.EngineVersion).toBe('15.8');
    });

    test('RDS instance should have Multi-AZ enabled', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('RDS instance should have encryption enabled', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS instance should have deletion protection disabled for testing', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.DeletionProtection).toBe(false);
    });

    test('RDS instance should not be publicly accessible', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('RDS instance should have correct deletion policy', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.UpdateReplacePolicy).toBe('Delete');
    });

    test('RDS instance should have CloudWatch logs exports', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.EnableCloudwatchLogsExports).toContain('postgresql');
    });

    test('RDS instance should use Secrets Manager for credentials', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.MasterUsername).toEqual({
        'Fn::Sub': expect.stringContaining('resolve:secretsmanager')
      });
      expect(db.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': expect.stringContaining('resolve:secretsmanager')
      });
    });
  });

  describe('ElastiCache Resources', () => {
    test('should have ElastiCache subnet group', () => {
      expect(template.Resources.CacheSubnetGroup).toBeDefined();
      expect(template.Resources.CacheSubnetGroup.Type).toBe(
        'AWS::ElastiCache::SubnetGroup'
      );
    });

    test('ElastiCache subnet group should use private subnets', () => {
      const subnetGroup = template.Resources.CacheSubnetGroup;
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have ElastiCache replication group', () => {
      expect(template.Resources.MetadataCache).toBeDefined();
      expect(template.Resources.MetadataCache.Type).toBe(
        'AWS::ElastiCache::ReplicationGroup'
      );
    });

    test('ElastiCache should be Redis', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.Engine).toBe('redis');
      expect(cache.Properties.EngineVersion).toBe('7.0');
    });

    test('ElastiCache should have automatic failover enabled', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.AutomaticFailoverEnabled).toBe(true);
    });

    test('ElastiCache should have Multi-AZ enabled', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.MultiAZEnabled).toBe(true);
    });

    test('ElastiCache should have at least 2 cache clusters', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.NumCacheClusters).toBeGreaterThanOrEqual(2);
    });

    test('ElastiCache should have encryption at rest enabled', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('ElastiCache should have encryption in transit disabled', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.TransitEncryptionEnabled).toBe(false);
    });

    test('ElastiCache should have auto minor version upgrade enabled', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.AutoMinorVersionUpgrade).toBe(true);
    });
  });

  describe('API Gateway Resources', () => {
    test('should have API Gateway REST API', () => {
      expect(template.Resources.MetadataApi).toBeDefined();
      expect(template.Resources.MetadataApi.Type).toBe(
        'AWS::ApiGateway::RestApi'
      );
    });

    test('API Gateway should be regional', () => {
      const api = template.Resources.MetadataApi;
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have metadata resource', () => {
      expect(template.Resources.MetadataResource).toBeDefined();
      expect(template.Resources.MetadataResource.Type).toBe(
        'AWS::ApiGateway::Resource'
      );
      expect(template.Resources.MetadataResource.Properties.PathPart).toBe('metadata');
    });

    test('should have movies resource', () => {
      expect(template.Resources.MovieResource).toBeDefined();
      expect(template.Resources.MovieResource.Type).toBe(
        'AWS::ApiGateway::Resource'
      );
      expect(template.Resources.MovieResource.Properties.PathPart).toBe('movies');
    });

    test('should have movieId resource with path parameter', () => {
      expect(template.Resources.MovieIdResource).toBeDefined();
      expect(template.Resources.MovieIdResource.Properties.PathPart).toBe('{movieId}');
    });

    test('should have GET method for movies', () => {
      expect(template.Resources.GetMovieMethod).toBeDefined();
      expect(template.Resources.GetMovieMethod.Type).toBe(
        'AWS::ApiGateway::Method'
      );
      expect(template.Resources.GetMovieMethod.Properties.HttpMethod).toBe('GET');
    });

    test('should have API deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      expect(template.Resources.ApiDeployment.Type).toBe(
        'AWS::ApiGateway::Deployment'
      );
    });

    test('should have API stage', () => {
      expect(template.Resources.ApiStage).toBeDefined();
      expect(template.Resources.ApiStage.Type).toBe('AWS::ApiGateway::Stage');
    });

    test('API stage should have tracing enabled', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.TracingEnabled).toBe(true);
    });

    test('API stage should have metrics enabled', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.MethodSettings).toBeDefined();
      expect(stage.Properties.MethodSettings[0].MetricsEnabled).toBe(true);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have CloudWatch log group for API Gateway', () => {
      expect(template.Resources.ApiLogGroup).toBeDefined();
      expect(template.Resources.ApiLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have 7 days retention', () => {
      const logGroup = template.Resources.ApiLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'DatabasePort',
        'DatabaseSecretArn',
        'CacheEndpoint',
        'CachePort',
        'ApiGatewayUrl',
        'ApiGatewayId',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should have export', () => {
      const output = template.Outputs.VPCId;
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCId'
      });
    });

    test('DatabaseEndpoint output should use GetAtt', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['MetadataDatabase', 'Endpoint.Address']
      });
    });

    test('CacheEndpoint output should use GetAtt', () => {
      const output = template.Outputs.CacheEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['MetadataCache', 'PrimaryEndPoint.Address']
      });
    });

    test('ApiGatewayUrl output should be properly formatted', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Value).toEqual({
        'Fn::Sub': expect.stringContaining('https://')
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('VPC name should use environment suffix', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': 'streamflix-vpc-${EnvironmentSuffix}'
      });
    });

    test('database identifier should use environment suffix', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': 'streamflix-metadata-db-${EnvironmentSuffix}'
      });
    });

    test('cache replication group ID should use environment suffix', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.ReplicationGroupId).toEqual({
        'Fn::Sub': 'streamflix-cache-${EnvironmentSuffix}'
      });
    });

    test('API name should use environment suffix', () => {
      const api = template.Resources.MetadataApi;
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'streamflix-metadata-api-${EnvironmentSuffix}'
      });
    });
  });

  describe('Tags', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'ApiGatewaySecurityGroup',
        'CacheSecurityGroup',
        'DatabaseSecurityGroup',
        'DBSecret',
        'MetadataDatabase',
        'MetadataApi',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
        }
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('RDS should be configured for Multi-AZ', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('ElastiCache should have automatic failover', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.AutomaticFailoverEnabled).toBe(true);
      expect(cache.Properties.MultiAZEnabled).toBe(true);
    });

    test('resources should span multiple availability zones', () => {
      const subnet1AZ = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const subnet2AZ = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;
      expect(subnet1AZ).not.toEqual(subnet2AZ);
    });
  });

  describe('Security Configuration', () => {
    test('RDS should have encryption enabled', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('ElastiCache should have encryption at rest enabled', () => {
      const cache = template.Resources.MetadataCache;
      expect(cache.Properties.AtRestEncryptionEnabled).toBe(true);
      expect(cache.Properties.TransitEncryptionEnabled).toBe(false);
    });

    test('database should not be publicly accessible', () => {
      const db = template.Resources.MetadataDatabase;
      expect(db.Properties.PubliclyAccessible).toBe(false);
    });

    test('database and cache should be in private subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      const cacheSubnetGroup = template.Resources.CacheSubnetGroup;

      expect(dbSubnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
      expect(cacheSubnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' }
      ]);
    });
  });
});
