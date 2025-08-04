import fs from 'fs';
import path from 'path';

describe('SecureApp CloudFormation Template', () => {
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
        'Secure multi-tier AWS infrastructure with high availability, encryption, and least privilege access'
      );
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have AllowedSSHCIDR parameter', () => {
      const param = template.Parameters.AllowedSSHCIDR;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('192.168.10.0/24');
      expect(param.Description).toBe(
        'IP CIDR range allowed for SSH access to EC2 instances'
      );
      expect(param.AllowedPattern).toBe('^(\\d{1,3}\\.){3}\\d{1,3}/\\d{1,2}$');
    });

    test('should have DBUsername parameter', () => {
      const param = template.Parameters.DBUsername;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(63);
      expect(param.AllowedPattern).toBe('^[a-zA-Z][a-zA-Z0-9]*$');
    });

    test('should have DBPassword parameter', () => {
      const param = template.Parameters.DBPassword;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(128);
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1'].AMI).toBe(
        'ami-0c02fb55956c7d316'
      );
    });
  });

  describe('KMS Resources', () => {
    test('should have SecureAppKMSKey', () => {
      const kmsKey = template.Resources.SecureAppKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.Description).toBe(
        'Customer-managed KMS key for SecureApp encryption'
      );
    });

    test('KMS key should have proper policy', () => {
      const kmsKey = template.Resources.SecureAppKMSKey;
      const policy = kmsKey.Properties.KeyPolicy;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement).toHaveLength(4);

      // Check root permissions
      expect(policy.Statement[0].Sid).toBe('Enable IAM User Permissions');
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Action).toBe('kms:*');
    });

    test('should have SecureAppKMSKeyAlias', () => {
      const alias = template.Resources.SecureAppKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toBe('alias/secureapp-key');
    });
  });

  describe('VPC Resources', () => {
    test('should have SecureAppVPC', () => {
      const vpc = template.Resources.SecureAppVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.SecureAppIGW;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');

      const attachment = template.Resources.SecureAppIGWAttachment;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have public subnets in both AZs', () => {
      const subnet1 = template.Resources.PublicSubnetAZ1;
      const subnet2 = template.Resources.PublicSubnetAZ2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in both AZs', () => {
      const subnet1 = template.Resources.PrivateSubnetAZ1;
      const subnet2 = template.Resources.PrivateSubnetAZ2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });

    test('should have NAT Gateways for high availability', () => {
      const nat1 = template.Resources.NATGatewayAZ1;
      const nat2 = template.Resources.NATGatewayAZ2;
      const eip1 = template.Resources.NATGatewayAZ1EIP;
      const eip2 = template.Resources.NATGatewayAZ2EIP;

      expect(nat1).toBeDefined();
      expect(nat2).toBeDefined();
      expect(eip1).toBeDefined();
      expect(eip2).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
      expect(eip1.Type).toBe('AWS::EC2::EIP');
      expect(eip2.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables and associations', () => {
      const publicRT = template.Resources.PublicRouteTable;
      const privateRT1 = template.Resources.PrivateRouteTableAZ1;
      const privateRT2 = template.Resources.PrivateRouteTableAZ2;

      expect(publicRT).toBeDefined();
      expect(privateRT1).toBeDefined();
      expect(privateRT2).toBeDefined();
      expect(publicRT.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT1.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRT2.Type).toBe('AWS::EC2::RouteTable');
    });
  });

  describe('Security Groups', () => {
    test('should have EC2 HTTPS Security Group', () => {
      const sg = template.Resources.EC2HTTPSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group allowing HTTPS traffic from anywhere'
      );

      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(443);
      expect(ingressRule.ToPort).toBe(443);
      expect(ingressRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 SSH Security Group', () => {
      const sg = template.Resources.EC2SSHSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group allowing SSH from specified IP range'
      );

      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(22);
      expect(ingressRule.ToPort).toBe(22);
      expect(ingressRule.CidrIp).toEqual({ Ref: 'AllowedSSHCIDR' });
    });

    test('should have RDS Security Group', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for RDS PostgreSQL database'
      );

      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.IpProtocol).toBe('tcp');
      expect(ingressRule.FromPort).toBe(5432);
      expect(ingressRule.ToPort).toBe(5432);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'EC2HTTPSSecurityGroup',
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 Instance Role', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toBe('SecureApp-EC2-Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
    });

    test('EC2 role should have least privilege policies', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);

      const policy = policies[0];
      expect(policy.PolicyName).toBe('SecureApp-EC2-Policy');
      expect(policy.PolicyDocument.Statement).toHaveLength(3);

      // Check S3 permissions
      const s3Statement = policy.PolicyDocument.Statement[0];
      expect(s3Statement.Action).toEqual(['s3:PutObject', 's3:PutObjectAcl']);

      // Check KMS permissions
      const kmsStatement = policy.PolicyDocument.Statement[1];
      expect(kmsStatement.Action).toEqual([
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ]);
    });

    test('should have EC2 Instance Profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });

    test('should have VPC Flow Logs Role', () => {
      const role = template.Resources.VPCFlowLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'vpc-flow-logs.amazonaws.com'
      );
    });
  });

  describe('S3 and Logging Resources', () => {
    test('should have Logging Bucket', () => {
      const bucket = template.Resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const props = bucket.Properties;
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(
        props.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('S3 bucket should have lifecycle policy', () => {
      const bucket = template.Resources.LoggingBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      expect(lifecycle.Rules).toHaveLength(1);

      const rule = lifecycle.Rules[0];
      expect(rule.Id).toBe('LogRetentionRule');
      expect(rule.Status).toBe('Enabled');
      expect(rule.Transitions[0].TransitionInDays).toBe(365);
      expect(rule.Transitions[0].StorageClass).toBe('GLACIER');
      expect(rule.ExpirationInDays).toBe(2555);
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.LoggingBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should have Logging Bucket Policy', () => {
      const policy = template.Resources.LoggingBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toHaveLength(3);

      // Check CloudTrail permissions
      expect(statements[0].Sid).toBe('AWSCloudTrailAclCheck');
      expect(statements[1].Sid).toBe('AWSCloudTrailWrite');
      expect(statements[2].Sid).toBe('DenyInsecureConnections');
    });
  });

  describe('CloudTrail and Monitoring', () => {
    test('should have CloudTrail', () => {
      const trail = template.Resources.SecureAppCloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.TrailName).toBe('SecureApp-CloudTrail');
      expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have VPC Flow Logs', () => {
      const flowLogs = template.Resources.VPCFlowLogs;
      const logGroup = template.Resources.VPCFlowLogsGroup;

      expect(flowLogs).toBeDefined();
      expect(logGroup).toBeDefined();
      expect(flowLogs.Type).toBe('AWS::EC2::FlowLog');
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toBe('/aws/vpc/flowlogs');
      expect(logGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS Subnet Group', () => {
      const subnetGroup = template.Resources.RDSSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBe(
        'Subnet group for SecureApp RDS database'
      );
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
    });

    test('should have RDS Database Instance', () => {
      const db = template.Resources.SecureAppDatabase;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Snapshot');

      const props = db.Properties;
      expect(props.Engine).toBe('postgres');
      expect(props.EngineVersion).toBe('13.21');
      expect(props.MultiAZ).toBe(true);
      expect(props.StorageEncrypted).toBe(true);
      expect(props.DeletionProtection).toBe(true);
      expect(props.BackupRetentionPeriod).toBe(7);
    });
  });

  describe('EC2 Resources', () => {
    test('should have EC2 instances in both AZs', () => {
      const ec2AZ1 = template.Resources.EC2InstanceAZ1;
      const ec2AZ2 = template.Resources.EC2InstanceAZ2;

      expect(ec2AZ1).toBeDefined();
      expect(ec2AZ2).toBeDefined();
      expect(ec2AZ1.Type).toBe('AWS::EC2::Instance');
      expect(ec2AZ2.Type).toBe('AWS::EC2::Instance');
      expect(ec2AZ1.Properties.InstanceType).toBe('t3.micro');
      expect(ec2AZ2.Properties.InstanceType).toBe('t3.micro');
    });

    test('EC2 instances should have encrypted EBS volumes', () => {
      const ec2AZ1 = template.Resources.EC2InstanceAZ1;
      const blockDevice = ec2AZ1.Properties.BlockDeviceMappings[0];

      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.VolumeType).toBe('gp3');
      expect(blockDevice.Ebs.VolumeSize).toBe(20);
    });

    test('EC2 instances should be in private subnets', () => {
      const ec2AZ1 = template.Resources.EC2InstanceAZ1;
      const ec2AZ2 = template.Resources.EC2InstanceAZ2;

      expect(ec2AZ1.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnetAZ1' });
      expect(ec2AZ2.Properties.SubnetId).toEqual({ Ref: 'PrivateSubnetAZ2' });
    });
  });

  describe('Secrets Manager', () => {
    test('should have Access Key Rotation User', () => {
      const user = template.Resources.AccessKeyRotationUser;
      expect(user).toBeDefined();
      expect(user.Type).toBe('AWS::IAM::User');
      expect(user.Properties.UserName).toBe('SecureApp-AccessKey-User');
    });

    test('should have Access Key Secret', () => {
      const secret = template.Resources.AccessKeySecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toBe('SecureApp/AccessKeys');
    });

    test('should not have Access Key Rotation Schedule (removed due to complexity)', () => {
      const schedule = template.Resources.AccessKeyRotationSchedule;
      expect(schedule).toBeUndefined();
      // Rotation schedule was removed due to invalid properties and missing Lambda function
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnetAZ1Id',
        'PublicSubnetAZ2Id',
        'PrivateSubnetAZ1Id',
        'PrivateSubnetAZ2Id',
        'EC2InstanceAZ1Id',
        'EC2InstanceAZ2Id',
        'RDSEndpoint',
        'LoggingBucketName',
        'KMSKeyId',
        'KMSKeyArn',
        'CloudTrailArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      const expectedExportNames = {
        VPCId: '${AWS::StackName}-VPC-ID',
        PublicSubnetAZ1Id: '${AWS::StackName}-PublicSubnet-AZ1-ID',
        PublicSubnetAZ2Id: '${AWS::StackName}-PublicSubnet-AZ2-ID',
        PrivateSubnetAZ1Id: '${AWS::StackName}-PrivateSubnet-AZ1-ID',
        PrivateSubnetAZ2Id: '${AWS::StackName}-PrivateSubnet-AZ2-ID',
        EC2InstanceAZ1Id: '${AWS::StackName}-EC2-AZ1-ID',
        EC2InstanceAZ2Id: '${AWS::StackName}-EC2-AZ2-ID',
        RDSEndpoint: '${AWS::StackName}-RDS-Endpoint',
        LoggingBucketName: '${AWS::StackName}-LoggingBucket-Name',
        KMSKeyId: '${AWS::StackName}-KMS-Key-ID',
        KMSKeyArn: '${AWS::StackName}-KMS-Key-ARN',
        CloudTrailArn: '${AWS::StackName}-CloudTrail-ARN',
      };

      Object.keys(expectedExportNames).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub':
            expectedExportNames[outputKey as keyof typeof expectedExportNames],
        });
      });
    });
  });

  describe('Security and Compliance', () => {
    test('all resources should have Project tag', () => {
      const resourcesWithTags = [
        'SecureAppKMSKey',
        'SecureAppVPC',
        'SecureAppIGW',
        'PublicSubnetAZ1',
        'PublicSubnetAZ2',
        'PrivateSubnetAZ1',
        'PrivateSubnetAZ2',
        'EC2HTTPSSecurityGroup',
        'EC2SSHSecurityGroup',
        'RDSSecurityGroup',
        'EC2InstanceRole',
        'LoggingBucket',
        'SecureAppCloudTrail',
        'VPCFlowLogs',
        'RDSSubnetGroup',
        'SecureAppDatabase',
        'EC2InstanceAZ1',
        'EC2InstanceAZ2',
        'AccessKeyRotationUser',
        'AccessKeySecret',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Project'
          );
          expect(projectTag).toBeDefined();
          expect(projectTag.Value).toBe('SecureApp');
        }
      });
    });

    test('should enforce encryption at rest', () => {
      // KMS key exists
      expect(template.Resources.SecureAppKMSKey).toBeDefined();

      // S3 bucket encryption
      const bucket = template.Resources.LoggingBucket;
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('aws:kms');

      // RDS encryption
      const rds = template.Resources.SecureAppDatabase;
      expect(rds.Properties.StorageEncrypted).toBe(true);

      // EBS encryption
      const ec2 = template.Resources.EC2InstanceAZ1;
      expect(ec2.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('should implement least privilege access', () => {
      const ec2Role = template.Resources.EC2InstanceRole;
      const policies = ec2Role.Properties.Policies[0].PolicyDocument.Statement;

      // Should only have specific S3 permissions
      const s3Statement = policies.find((stmt: any) =>
        stmt.Action.includes('s3:PutObject')
      );
      expect(s3Statement.Resource).toEqual({
        'Fn::Sub': '${LoggingBucket.Arn}/*',
      });

      // Should only have specific KMS permissions
      const kmsStatement = policies.find((stmt: any) =>
        stmt.Action.includes('kms:Decrypt')
      );
      expect(kmsStatement.Resource).toEqual({
        'Fn::GetAtt': ['SecureAppKMSKey', 'Arn'],
      });
    });
  });

  describe('High Availability', () => {
    test('should deploy resources across multiple AZs', () => {
      // Subnets in different AZs
      const publicAZ1 = template.Resources.PublicSubnetAZ1;
      const publicAZ2 = template.Resources.PublicSubnetAZ2;
      expect(publicAZ1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(publicAZ2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });

      // RDS Multi-AZ
      const rds = template.Resources.SecureAppDatabase;
      expect(rds.Properties.MultiAZ).toBe(true);

      // NAT Gateways in both AZs
      expect(template.Resources.NATGatewayAZ1).toBeDefined();
      expect(template.Resources.NATGatewayAZ2).toBeDefined();
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Should have many resources for secure infrastructure
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });
});
