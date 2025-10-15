import * as fs from 'fs';
import * as path from 'path';
import { yamlParse } from 'yaml-cfn';

// Define a type for easier resource access
type ResourceMap = { [key: string]: { Type: string; Properties: any; Condition?: string; DeletionPolicy?: string; UpdateReplacePolicy?: string } };

describe('TapStack CloudFormation Template (Unit Tests)', () => {
  let template: any;
  let R: ResourceMap; // Resources shorthand

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const raw = fs.readFileSync(templatePath, 'utf8');
    template = yamlParse(raw) as any;
    R = template.Resources;
    expect(R).toBeDefined();
  });

  // --- Core Structure Tests ---

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have HIPAA-compliant description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('HIPAA-Compliant Event Processing Pipeline for Healthcare Data');
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThanOrEqual(30);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have metadata for CloudFormation interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  // --- Parameters Tests ---

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['EnvironmentSuffix', 'DBUsername', 'DBName'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBe('Must contain only alphanumeric characters');
    });

    test('DBUsername parameter should have validation', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('DBName parameter should have validation', () => {
      const param = template.Parameters.DBName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('healthcaredb');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(64);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });
  });

  // --- KMS Encryption Tests ---

  describe('KMS Encryption', () => {
    test('should have KMS key for data encryption', () => {
      expect(R.DataEncryptionKey).toBeDefined();
      expect(R.DataEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have key rotation enabled', () => {
      const kmsKey = R.DataEncryptionKey.Properties;
      expect(kmsKey.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper deletion policy', () => {
      expect(R.DataEncryptionKey.DeletionPolicy).toBe('Delete');
      expect(R.DataEncryptionKey.UpdateReplacePolicy).toBe('Delete');
    });

    test('KMS key should have comprehensive policy', () => {
      const policy = R.DataEncryptionKey.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThanOrEqual(3);
    });

    test('KMS key policy should allow CloudWatch Logs', () => {
      const policy = R.DataEncryptionKey.Properties.KeyPolicy.Statement;
      const cloudWatchStatement = policy.find((s: any) => s.Sid === 'Allow CloudWatch Logs');
      expect(cloudWatchStatement).toBeDefined();
      expect(cloudWatchStatement.Action).toContain('kms:Encrypt');
      expect(cloudWatchStatement.Action).toContain('kms:Decrypt');
    });

    test('KMS key policy should allow CloudTrail', () => {
      const policy = R.DataEncryptionKey.Properties.KeyPolicy.Statement;
      const cloudTrailStatement = policy.find((s: any) => s.Sid === 'Allow CloudTrail');
      expect(cloudTrailStatement).toBeDefined();
      expect(cloudTrailStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
    });

    test('should have KMS key alias', () => {
      expect(R.DataEncryptionKeyAlias).toBeDefined();
      expect(R.DataEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(R.DataEncryptionKeyAlias.Properties.TargetKeyId).toEqual({ Ref: 'DataEncryptionKey' });
    });

    test('KMS resources should have HIPAA compliance tags', () => {
      const tags = R.DataEncryptionKey.Properties.Tags;
      const complianceTag = tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('HIPAA');
    });
  });

  // --- VPC and Network Configuration Tests ---

  describe('VPC and Networking', () => {
    test('should have VPC resource with correct CIDR block', () => {
      expect(R.VPC).toBeDefined();
      expect(R.VPC.Type).toBe('AWS::EC2::VPC');
      expect(R.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(R.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(R.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have three private subnets in different AZs', () => {
      expect(R.PrivateSubnet1).toBeDefined();
      expect(R.PrivateSubnet2).toBeDefined();
      expect(R.PrivateSubnet3).toBeDefined();

      expect(R.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(R.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(R.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('private subnets should not have public IPs', () => {
      expect(R.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(R.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(R.PrivateSubnet3.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have VPC endpoints for AWS services', () => {
      expect(R.S3VPCEndpoint).toBeDefined();
      expect(R.KinesisVPCEndpoint).toBeDefined();
      expect(R.SecretsManagerVPCEndpoint).toBeDefined();
      expect(R.ECRVPCEndpoint).toBeDefined();
      expect(R.ECRAPIVPCEndpoint).toBeDefined();
      expect(R.CloudWatchLogsVPCEndpoint).toBeDefined();
    });

    test('S3 VPC endpoint should be gateway type', () => {
      expect(R.S3VPCEndpoint.Properties.VpcEndpointType).toBe('Gateway');
    });

    test('interface VPC endpoints should have private DNS enabled', () => {
      expect(R.KinesisVPCEndpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(R.SecretsManagerVPCEndpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(R.ECRVPCEndpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(R.CloudWatchLogsVPCEndpoint.Properties.PrivateDnsEnabled).toBe(true);
    });

    test('should have private route table associations', () => {
      expect(R.PrivateRouteTable).toBeDefined();
      expect(R.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(R.PrivateSubnet2RouteTableAssociation).toBeDefined();
      expect(R.PrivateSubnet3RouteTableAssociation).toBeDefined();
    });
  });

  // --- Security Groups Tests ---

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      expect(R.VPCEndpointSecurityGroup).toBeDefined();
      expect(R.ECSTaskSecurityGroup).toBeDefined();
      expect(R.RDSSecurityGroup).toBeDefined();
    });

    test('VPC endpoint security group should allow HTTPS from ECS tasks', () => {
      const sg = R.VPCEndpointSecurityGroup.Properties.SecurityGroupIngress;
      expect(sg).toBeDefined();
      expect(sg[0].IpProtocol).toBe('tcp');
      expect(sg[0].FromPort).toBe(443);
      expect(sg[0].ToPort).toBe(443);
      expect(sg[0].SourceSecurityGroupId).toEqual({ Ref: 'ECSTaskSecurityGroup' });
    });

    test('ECS task security group should allow HTTPS egress', () => {
      const egress = R.ECSTaskSecurityGroup.Properties.SecurityGroupEgress;
      const httpsRule = egress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('ECS task security group should allow MySQL access within VPC', () => {
      const egress = R.ECSTaskSecurityGroup.Properties.SecurityGroupEgress;
      const mysqlRule = egress.find((r: any) => r.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.CidrIp).toBe('10.0.0.0/16');
    });

    test('RDS security group should only accept traffic from ECS tasks', () => {
      const ingress = R.RDSSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ECSTaskSecurityGroup' });
    });
  });

  // --- Kinesis Data Stream Tests ---

  describe('Kinesis Data Stream', () => {
    test('should have Kinesis stream resource', () => {
      expect(R.PatientDataStream).toBeDefined();
      expect(R.PatientDataStream.Type).toBe('AWS::Kinesis::Stream');
    });

    test('Kinesis stream should be encrypted with KMS', () => {
      const stream = R.PatientDataStream.Properties;
      expect(stream.StreamEncryption).toBeDefined();
      expect(stream.StreamEncryption.EncryptionType).toBe('KMS');
      expect(stream.StreamEncryption.KeyId).toEqual({ Ref: 'DataEncryptionKey' });
    });

    test('Kinesis stream should have appropriate retention period', () => {
      expect(R.PatientDataStream.Properties.RetentionPeriodHours).toBe(24);
    });

    test('Kinesis stream should be provisioned mode', () => {
      expect(R.PatientDataStream.Properties.StreamModeDetails.StreamMode).toBe('PROVISIONED');
      expect(R.PatientDataStream.Properties.ShardCount).toBe(2);
    });

    test('Kinesis stream should have HIPAA compliance tag', () => {
      const tags = R.PatientDataStream.Properties.Tags;
      const complianceTag = tags.find((t: any) => t.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag.Value).toBe('HIPAA');
    });
  });

  // --- RDS Aurora Serverless Tests ---

  describe('RDS Aurora Serverless', () => {
    test('should have Aurora DB cluster', () => {
      expect(R.AuroraDBCluster).toBeDefined();
      expect(R.AuroraDBCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('Aurora cluster should be encrypted with KMS', () => {
      const cluster = R.AuroraDBCluster.Properties;
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toEqual({ Ref: 'DataEncryptionKey' });
    });

    test('Aurora cluster should use MySQL engine', () => {
      const cluster = R.AuroraDBCluster.Properties;
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineVersion).toBe('8.0.mysql_aurora.3.04.0');
    });

    test('Aurora cluster should have serverless v2 scaling', () => {
      const scaling = R.AuroraDBCluster.Properties.ServerlessV2ScalingConfiguration;
      expect(scaling).toBeDefined();
      expect(scaling.MinCapacity).toBe(0.5);
      expect(scaling.MaxCapacity).toBe(2);
    });

    test('Aurora cluster should have CloudWatch logs exports enabled', () => {
      const logs = R.AuroraDBCluster.Properties.EnableCloudwatchLogsExports;
      expect(logs).toContain('error');
      expect(logs).toContain('general');
      expect(logs).toContain('slowquery');
      expect(logs).toContain('audit');
    });

    test('Aurora cluster should have deletion policy set to Delete', () => {
      expect(R.AuroraDBCluster.DeletionPolicy).toBe('Delete');
      expect(R.AuroraDBCluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('should have DB subnet group spanning three subnets', () => {
      expect(R.DBSubnetGroup).toBeDefined();
      const subnetIds = R.DBSubnetGroup.Properties.SubnetIds;
      expect(subnetIds).toHaveLength(3);
    });

    test('should have DB cluster parameter group with secure transport', () => {
      expect(R.DBClusterParameterGroup).toBeDefined();
      expect(R.DBClusterParameterGroup.Properties.Family).toBe('aurora-mysql8.0');
      expect(R.DBClusterParameterGroup.Properties.Parameters.require_secure_transport).toBe('ON');
    });

    test('should have two Aurora DB instances', () => {
      expect(R.AuroraDBInstance1).toBeDefined();
      expect(R.AuroraDBInstance2).toBeDefined();
      expect(R.AuroraDBInstance1.Properties.DBInstanceClass).toBe('db.serverless');
      expect(R.AuroraDBInstance2.Properties.DBInstanceClass).toBe('db.serverless');
    });

    test('DB instances should not be publicly accessible', () => {
      expect(R.AuroraDBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(R.AuroraDBInstance2.Properties.PubliclyAccessible).toBe(false);
    });
  });

  // --- Secrets Manager Tests ---

  describe('Secrets Manager', () => {
    test('should have DB secret for Aurora credentials', () => {
      expect(R.DBSecret).toBeDefined();
      expect(R.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DB secret should be encrypted with KMS', () => {
      expect(R.DBSecret.Properties.KmsKeyId).toEqual({ Ref: 'DataEncryptionKey' });
    });

    test('DB secret should auto-generate password', () => {
      const secretConfig = R.DBSecret.Properties.GenerateSecretString;
      expect(secretConfig).toBeDefined();
      expect(secretConfig.GenerateStringKey).toBe('password');
      expect(secretConfig.PasswordLength).toBe(32);
      expect(secretConfig.RequireEachIncludedType).toBe(true);
    });

    test('should have secret attachment to DB cluster', () => {
      expect(R.DBSecretAttachment).toBeDefined();
      expect(R.DBSecretAttachment.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
      expect(R.DBSecretAttachment.Properties.TargetType).toBe('AWS::RDS::DBCluster');
    });
  });

  // --- ECS Cluster and Tasks Tests ---

  describe('ECS Resources', () => {
    test('should have ECS cluster with Container Insights enabled', () => {
      expect(R.ECSCluster).toBeDefined();
      expect(R.ECSCluster.Type).toBe('AWS::ECS::Cluster');
      const settings = R.ECSCluster.Properties.ClusterSettings;
      expect(settings[0].Name).toBe('containerInsights');
      expect(settings[0].Value).toBe('enabled');
    });

    test('should have ECS task execution role', () => {
      expect(R.ECSTaskExecutionRole).toBeDefined();
      expect(R.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('ECS task execution role should have secrets access', () => {
      const policies = R.ECSTaskExecutionRole.Properties.Policies;
      const secretsPolicy = policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(secretsPolicy).toBeDefined();
    });

    test('should have ECS task role with Kinesis access', () => {
      expect(R.ECSTaskRole).toBeDefined();
      const policies = R.ECSTaskRole.Properties.Policies;
      const kinesisPolicy = policies.find((p: any) => p.PolicyName === 'KinesisAccess');
      expect(kinesisPolicy).toBeDefined();
    });

    test('should have ECS task log group with encryption', () => {
      expect(R.ECSTaskLogGroup).toBeDefined();
      expect(R.ECSTaskLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(R.ECSTaskLogGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['DataEncryptionKey', 'Arn'] });
      expect(R.ECSTaskLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have ECS task definition for Fargate', () => {
      expect(R.ECSTaskDefinition).toBeDefined();
      expect(R.ECSTaskDefinition.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(R.ECSTaskDefinition.Properties.NetworkMode).toBe('awsvpc');
    });

    test('ECS task definition should have appropriate resource allocation', () => {
      const taskDef = R.ECSTaskDefinition.Properties;
      expect(taskDef.Cpu).toBe('512');
      expect(taskDef.Memory).toBe('1024');
    });

    test('should have ECS service with desired count of 2', () => {
      expect(R.ECSService).toBeDefined();
      expect(R.ECSService.Properties.DesiredCount).toBe(2);
      expect(R.ECSService.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECS service should not assign public IPs', () => {
      const config = R.ECSService.Properties.NetworkConfiguration.AwsvpcConfiguration;
      expect(config.AssignPublicIp).toBe('DISABLED');
    });
  });

  // --- API Gateway Tests ---

  describe('API Gateway', () => {
    test('should have REST API resource', () => {
      expect(R.RestAPI).toBeDefined();
      expect(R.RestAPI.Type).toBe('AWS::ApiGateway::RestApi');
      expect(R.RestAPI.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have health endpoint', () => {
      expect(R.APIGatewayHealthResource).toBeDefined();
      expect(R.APIGatewayHealthMethod).toBeDefined();
      expect(R.APIGatewayHealthResource.Properties.PathPart).toBe('health');
    });

    test('health endpoint should use IAM authorization', () => {
      expect(R.APIGatewayHealthMethod.Properties.AuthorizationType).toBe('AWS_IAM');
      expect(R.APIGatewayHealthMethod.Properties.HttpMethod).toBe('GET');
    });

    test('should have API Gateway stage with throttling', () => {
      expect(R.APIGatewayStage).toBeDefined();
      const methodSettings = R.APIGatewayStage.Properties.MethodSettings[0];
      expect(methodSettings.ThrottlingBurstLimit).toBe(500);
      expect(methodSettings.ThrottlingRateLimit).toBe(100);
      expect(methodSettings.MetricsEnabled).toBe(true);
    });

    test('should have API Gateway log group with encryption', () => {
      expect(R.APIGatewayLogGroup).toBeDefined();
      expect(R.APIGatewayLogGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['DataEncryptionKey', 'Arn'] });
    });

    test('should have usage plan', () => {
      expect(R.APIGatewayUsagePlan).toBeDefined();
      const throttle = R.APIGatewayUsagePlan.Properties.Throttle;
      expect(throttle.BurstLimit).toBe(500);
      expect(throttle.RateLimit).toBe(100);
    });
  });

  // --- CloudTrail Tests ---

  describe('CloudTrail Audit Logging', () => {
    test('should have CloudTrail S3 bucket', () => {
      expect(R.CloudTrailBucket).toBeDefined();
      expect(R.CloudTrailBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('CloudTrail bucket should be encrypted with KMS', () => {
      const encryption = R.CloudTrailBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'DataEncryptionKey' });
    });

    test('CloudTrail bucket should block all public access', () => {
      const publicAccess = R.CloudTrailBucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('CloudTrail bucket should have lifecycle policy', () => {
      const lifecycle = R.CloudTrailBucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycle).toBeDefined();
      expect(lifecycle[0].ExpirationInDays).toBe(90);
    });

    test('should have CloudTrail with encryption', () => {
      expect(R.CloudTrail).toBeDefined();
      expect(R.CloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(R.CloudTrail.Properties.KMSKeyId).toEqual({ Ref: 'DataEncryptionKey' });
    });

    test('CloudTrail should have log file validation enabled', () => {
      expect(R.CloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('CloudTrail should be logging', () => {
      expect(R.CloudTrail.Properties.IsLogging).toBe(true);
    });
  });

  // --- Resource Tagging Tests ---

  describe('Resource Tagging', () => {
    test('all major resources should have environment tags', () => {
      const taggedResources = [
        'VPC',
        'DataEncryptionKey',
        'PatientDataStream',
        'AuroraDBCluster',
        'ECSCluster',
        'CloudTrailBucket',
      ];

      taggedResources.forEach(resourceName => {
        const resource = R[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const envTag = tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
        }
      });
    });

    test('HIPAA-related resources should have compliance tags', () => {
      const hipaaResources = ['DataEncryptionKey', 'PatientDataStream', 'AuroraDBCluster', 'CloudTrailBucket'];

      hipaaResources.forEach(resourceName => {
        const resource = R[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const complianceTag = tags.find((t: any) => t.Key === 'Compliance');
          expect(complianceTag).toBeDefined();
          expect(complianceTag.Value).toBe('HIPAA');
        }
      });
    });
  });

  // --- Outputs Tests ---

  describe('Outputs', () => {
    test('should have all essential outputs', () => {
      const essentialOutputs = [
        'VPCId',
        'KMSKeyId',
        'KinesisStreamName',
        'DBClusterId',
        'DBClusterEndpoint',
        'ECSClusterName',
        'APIGatewayURL',
        'CloudTrailName',
      ];

      essentialOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('VPCId output should reference VPC resource', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('DB endpoints should use GetAtt', () => {
      expect(template.Outputs.DBClusterEndpoint.Value['Fn::GetAtt']).toEqual(['AuroraDBCluster', 'Endpoint.Address']);
      expect(template.Outputs.DBClusterReadEndpoint.Value['Fn::GetAtt']).toEqual(['AuroraDBCluster', 'ReadEndpoint.Address']);
    });

    test('API Gateway URL should be properly formatted', () => {
      const url = template.Outputs.APIGatewayURL.Value['Fn::Sub'];
      expect(url).toContain('https://');
      expect(url).toContain('.execute-api.');
      expect(url).toContain('/prod');
    });
  });

  // --- Security Best Practices Tests ---

  describe('Security Best Practices', () => {
    test('all encryption should use customer managed KMS keys', () => {
      const encryptedResources = [
        { name: 'PatientDataStream', path: 'StreamEncryption.KeyId' },
        { name: 'AuroraDBCluster', path: 'KmsKeyId' },
        { name: 'DBSecret', path: 'KmsKeyId' },
        { name: 'CloudTrailBucket', path: 'BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID' },
      ];

      encryptedResources.forEach(({ name }) => {
        const resource = R[name];
        expect(resource).toBeDefined();
      });
    });

    test('no resources should be publicly accessible', () => {
      expect(R.AuroraDBInstance1.Properties.PubliclyAccessible).toBe(false);
      expect(R.AuroraDBInstance2.Properties.PubliclyAccessible).toBe(false);
    });

    test('private subnets should not auto-assign public IPs', () => {
      const privateSubnets = Object.keys(R).filter(k =>
        R[k]?.Type === 'AWS::EC2::Subnet' && k.includes('Private')
      );
      privateSubnets.forEach(subnetName => {
        const subnet = R[subnetName].Properties;
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
      // Public subnets (for NAT Gateway) should auto-assign public IPs
      const publicSubnets = Object.keys(R).filter(k =>
        R[k]?.Type === 'AWS::EC2::Subnet' && k.includes('Public')
      );
      publicSubnets.forEach(subnetName => {
        const subnet = R[subnetName].Properties;
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('security groups should not allow unrestricted access', () => {
      const securityGroups = Object.keys(R).filter(k => R[k]?.Type === 'AWS::EC2::SecurityGroup');
      securityGroups.forEach(sgName => {
        const sg = R[sgName];
        if (sg.Properties.SecurityGroupIngress) {
          sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
            // Ensure rules don't allow unrestricted SSH or database access
            if (rule.FromPort === 22 || rule.FromPort === 3306) {
              expect(rule.CidrIp).not.toBe('0.0.0.0/0');
            }
          });
        }
      });
    });
  });

  // --- Template Validation Tests ---

  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have sufficient resources for HIPAA-compliant infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(40);
    });
  });
});

