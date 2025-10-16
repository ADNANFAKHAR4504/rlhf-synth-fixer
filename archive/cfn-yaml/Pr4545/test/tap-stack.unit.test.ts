import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Secure and Highly Available Production Environment'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have only EnvironmentSuffix parameter', () => {
      expect(Object.keys(template.Parameters)).toEqual(['EnvironmentSuffix']);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming'
      );
    });
  });

  describe('Resources', () => {
    test('should have all expected resources', () => {
      const expectedResources = [
        'EC2KeyPair', 'DbSecret', 'KMSKey', 'KMSKeyAlias', 'VPC',
        'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2',
        'InternetGateway', 'AttachGateway', 'NATGatewayEIP', 'NATGateway',
        'PublicRouteTable', 'PrivateRouteTable', 'PublicRoute', 'PrivateRoute',
        'PublicSubnetRouteTableAssociation1', 'PublicSubnetRouteTableAssociation2',
        'PrivateSubnetRouteTableAssociation1', 'PrivateSubnetRouteTableAssociation2',
        'ApplicationLoadBalancerSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup',
        'EC2Role', 'EC2RolePolicy', 'EC2InstanceProfile', 'DynamoDBAutoScaleRole',
        'ApplicationLoadBalancer', 'ALBTargetGroup', 'ALBListener', 'EC2Instance',
        'S3Bucket', 'S3BucketPolicy', 'DynamoDBTable',
        'DynamoDBTableWriteCapacityScalableTarget', 'DynamoDBTableWriteScalingPolicy',
        'DynamoDBTableReadCapacityScalableTarget', 'DynamoDBTableReadScalingPolicy',
        'DBSubnetGroup', 'RDSInstance', 'CloudTrailBucket', 'CloudTrailBucketPolicy',
        'CloudTrail', 'EC2CPUAlarm', 'RDSStorageAlarm'
      ];

      expectedResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have correct total number of resources', () => {
      expect(Object.keys(template.Resources)).toHaveLength(46);
    });
  });

  describe('EC2 KeyPair', () => {
    test('should be configured correctly', () => {
      const keyPair = template.Resources.EC2KeyPair;
      expect(keyPair.Type).toBe('AWS::EC2::KeyPair');
      expect(keyPair.DeletionPolicy).toBe('Delete');
      expect(keyPair.Properties.KeyName).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-ec2-keypair'
      });
    });
  });

  describe('Secrets Manager', () => {
    test('DbSecret should be configured correctly', () => {
      const secret = template.Resources.DbSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.DeletionPolicy).toBe('Delete');
      expect(secret.Properties.Name).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-db-credentials'
      });
      expect(secret.Properties.GenerateSecretString.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });
  });

  describe('KMS Key', () => {
    test('should be configured correctly', () => {
      const kmsKey = template.Resources.KMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description).toBe('KMS key for encrypting production resources');
      expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
    });

    test('should have correct alias', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/${EnvironmentSuffix}-kms-key'
      });
    });
  });

  describe('VPC and Networking', () => {
    test('VPC should be configured correctly', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have correct subnet configuration', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.20.0/24');
    });

    test('should have NAT Gateway configuration', () => {
      const natGateway = template.Resources.NATGateway;
      const natEip = template.Resources.NATGatewayEIP;

      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natEip.Type).toBe('AWS::EC2::EIP');
      expect(natEip.Properties.Domain).toBe('vpc');
    });
  });

  describe('Security Groups', () => {
    test('ALB Security Group should allow HTTP/HTTPS', () => {
      const albSg = template.Resources.ApplicationLoadBalancerSecurityGroup;
      const ingress = albSg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('EC2 Security Group should allow ALB traffic and SSH', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      const ingress = ec2Sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(3);
      expect(ingress[2].FromPort).toBe(22);
      expect(ingress[2].CidrIp).toBe('10.0.0.0/16');
    });

    test('RDS Security Group should allow MySQL from EC2', () => {
      const rdsSg = template.Resources.RDSSecurityGroup;
      const ingress = rdsSg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('EC2Role should have correct trust policy', () => {
      const ec2Role = template.Resources.EC2Role;
      const trustPolicy = ec2Role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2RolePolicy should have required permissions', () => {
      const policy = template.Resources.EC2RolePolicy;
      const statements = policy.Properties.PolicyDocument.Statement;

      const sids = statements.map((stmt: any) => stmt.Sid);
      expect(sids).toContain('S3Access');
      expect(sids).toContain('DynamoDBAccess');
      expect(sids).toContain('KMSAccess');
      expect(sids).toContain('SecretsManagerAccess');
    });

    test('DynamoDBAutoScaleRole should have inline policy', () => {
      const role = template.Resources.DynamoDBAutoScaleRole;
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyName).toBe('DynamoDBAutoScalingPolicy');
    });
  });

  describe('Application Load Balancer', () => {
    test('should be configured correctly', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have target group and listener', () => {
      const targetGroup = template.Resources.ALBTargetGroup;
      const listener = template.Resources.ALBListener;

      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.Port).toBe(80);
    });
  });

  describe('EC2 Instance', () => {
    test('should be configured correctly', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Properties.InstanceType).toBe('t3.micro');
      expect(instance.Properties.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
    });

    test('should have encrypted EBS volume', () => {
      const instance = template.Resources.EC2Instance;
      const blockDevice = instance.Properties.BlockDeviceMappings[0];

      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.VolumeSize).toBe(30);
    });

    test('should have UserData for Python server', () => {
      const instance = template.Resources.EC2Instance;
      expect(instance.Properties.UserData['Fn::Base64']['Fn::Sub']).toContain('python3');
      expect(instance.Properties.UserData['Fn::Base64']['Fn::Sub']).toContain('pymysql');
      expect(instance.Properties.UserData['Fn::Base64']['Fn::Sub']).toContain('test_rds_connection');
      expect(instance.Properties.UserData['Fn::Base64']['Fn::Sub']).toContain('test_dynamodb_connection');
    });
  });

  describe('S3 Buckets', () => {
    test('main S3Bucket should have encryption and public access block', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('CloudTrail bucket should be configured correctly', () => {
      const bucket = template.Resources.CloudTrailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': '${EnvironmentSuffix}-cloudtrail-logs-${AWS::AccountId}'
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should be configured correctly', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
      expect(table.Properties.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
      expect(table.Properties.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
    });

    test('should have correct key schema', () => {
      const table = template.Resources.DynamoDBTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('timestamp');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('should have auto scaling configured', () => {
      const writeTarget = template.Resources.DynamoDBTableWriteCapacityScalableTarget;
      const readTarget = template.Resources.DynamoDBTableReadCapacityScalableTarget;

      expect(writeTarget.Properties.MaxCapacity).toBe(100);
      expect(writeTarget.Properties.MinCapacity).toBe(5);
      expect(readTarget.Properties.MaxCapacity).toBe(100);
      expect(readTarget.Properties.MinCapacity).toBe(5);
    });
  });

  describe('RDS Instance', () => {
    test('should be configured correctly', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.DeletionPolicy).toBe('Delete');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBe('8.4.6');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.micro');
    });

    test('should use Secrets Manager for credentials', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MasterUsername).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DbSecret}:SecretString:username}}'
      });
      expect(rds.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DbSecret}:SecretString:password}}'
      });
    });

    test('should have no backup retention for easy deletion', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.BackupRetentionPeriod).toBe(0);
      expect(rds.Properties.DeleteAutomatedBackups).toBe(true);
    });
  });

  describe('CloudTrail', () => {
    test('should be configured correctly', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have data event selectors', () => {
      const trail = template.Resources.CloudTrail;
      const eventSelectors = trail.Properties.EventSelectors[0];
      const dataResources = eventSelectors.DataResources;

      expect(dataResources).toHaveLength(2);
      expect(dataResources[0].Type).toBe('AWS::S3::Object');
      expect(dataResources[1].Type).toBe('AWS::DynamoDB::Table');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have EC2 CPU alarm', () => {
      const alarm = template.Resources.EC2CPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(80);
    });

    test('should have RDS storage alarm', () => {
      const alarm = template.Resources.RDSStorageAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('FreeStorageSpace');
      expect(alarm.Properties.Threshold).toBe(2147483648); // 2GB
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'S3BucketName',
        'DynamoDBTableName',
        'RDSEndpoint',
        'EC2InstanceId',
        'CloudTrailName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('ALBDNSName output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('RDSEndpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS Instance Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'],
      });
    });

    test('should have correct total number of outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(7);
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

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 7 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use EnvironmentSuffix in naming', () => {
      const resourcesWithNaming = [
        'EC2KeyPair', 'DbSecret', 'KMSKeyAlias', 'VPC', 'PublicSubnet1',
        'PrivateSubnet1', 'PrivateSubnet2', 'InternetGateway', 'NATGatewayEIP', 'NATGateway',
        'PublicRouteTable', 'PrivateRouteTable', 'ApplicationLoadBalancerSecurityGroup',
        'EC2SecurityGroup', 'RDSSecurityGroup', 'ApplicationLoadBalancer', 'ALBTargetGroup',
        'EC2Instance', 'S3Bucket', 'DynamoDBTable', 'DynamoDBTableWriteScalingPolicy',
        'DynamoDBTableReadScalingPolicy', 'RDSInstance', 'CloudTrailBucket', 'CloudTrail',
        'EC2CPUAlarm', 'RDSStorageAlarm'
      ];

      resourcesWithNaming.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const hasEnvironmentSuffixInName = JSON.stringify(resource.Properties).includes('${EnvironmentSuffix}');
        expect(hasEnvironmentSuffixInName).toBe(true);
      });
    });

    test('all resources should have Environment tag with EnvironmentSuffix', () => {
      const resourcesWithTags = [
        'EC2KeyPair', 'DbSecret', 'KMSKey', 'VPC', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'InternetGateway', 'NATGatewayEIP', 'NATGateway',
        'PublicRouteTable', 'PrivateRouteTable', 'ApplicationLoadBalancerSecurityGroup',
        'EC2SecurityGroup', 'RDSSecurityGroup', 'EC2Role', 'DynamoDBAutoScaleRole',
        'ApplicationLoadBalancer', 'ALBTargetGroup', 'EC2Instance', 'S3Bucket',
        'DynamoDBTable', 'DBSubnetGroup', 'RDSInstance', 'CloudTrailBucket', 'CloudTrail'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.Tags) {
          const environmentTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          expect(environmentTag).toBeDefined();
          expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Security Configuration', () => {
    test('all deletion policies should be Delete for easy cleanup', () => {
      const resourcesWithDeletionPolicy = ['EC2KeyPair', 'DbSecret', 'S3Bucket', 'CloudTrailBucket', 'RDSInstance'];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });

    test('all encryption should use customer managed KMS key', () => {
      // S3 Buckets
      expect(template.Resources.S3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      expect(template.Resources.CloudTrailBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });

      // DynamoDB
      expect(template.Resources.DynamoDBTable.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'KMSKey' });

      // RDS
      expect(template.Resources.RDSInstance.Properties.KmsKeyId).toEqual({ Ref: 'KMSKey' });

      // EC2 EBS
      expect(template.Resources.EC2Instance.Properties.BlockDeviceMappings[0].Ebs.KmsKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('all S3 buckets should block public access', () => {
      const s3Buckets = ['S3Bucket', 'CloudTrailBucket'];

      s3Buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('High Availability', () => {
    test('should deploy across multiple AZs', () => {
      // Public subnets in different AZs for ALB
      expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
      // Private subnets in different AZs for RDS Multi-AZ
      expect(template.Resources.PrivateSubnet1.Properties.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(template.Resources.PrivateSubnet2.Properties.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('RDS should be Multi-AZ', () => {
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
    });

    test('ALB should span multiple public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });
  });

  describe('Python Server Configuration', () => {
    test('UserData should contain Python server setup', () => {
      const userData = template.Resources.EC2Instance.Properties.UserData['Fn::Base64']['Fn::Sub'];

      // Check for required packages
      expect(userData).toContain('yum install -y python3 python3-pip mysql jq');
      expect(userData).toContain('pip3 install pymysql boto3');

      // Check for environment variables
      expect(userData).toContain('RDS_ENDPOINT="${RDSInstance.Endpoint.Address}"');
      expect(userData).toContain('SECRET_ARN="${DbSecret}"');
      expect(userData).toContain('DYNAMODB_TABLE="${DynamoDBTable}"');

      // Check for server functions
      expect(userData).toContain('def test_rds_connection():');
      expect(userData).toContain('def test_dynamodb_connection():');

      // Check for HTTP server
      expect(userData).toContain('HTTPServer');
      expect(userData).toContain('port 80');
    });
  });
});
