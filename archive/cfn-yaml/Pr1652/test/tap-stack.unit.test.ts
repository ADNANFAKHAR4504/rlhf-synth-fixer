import fs from 'fs';
import path from 'path';

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

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions || {}).toBeDefined();
      expect(template.Mappings || {}).toBeDefined();
    });
  });

  describe('Parameters', () => {
    const requiredParameters = [
      'UseExistingVPC',
      'ExistingVPCId',
      'VPCCIDR',
      'InstanceType',
      'SSHLocation',
      'CreateDatabase',
      'DBInstanceClass',
      'DBUsername',
      'DBPassword',
      'UseExistingKMSKey',
      'ExistingKMSKeyARN',
      'UseExistingEC2Role',
      'ExistingEC2RoleName',
      'CreateNATGateway',
      'CreateS3Bucket',
      'CreateEC2Instance',
    ];

    test('should have all required parameters', () => {
      requiredParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('UseExistingVPC parameter should have correct properties', () => {
      const param = template.Parameters.UseExistingVPC;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('no');
      expect(param.AllowedValues).toEqual(['yes', 'no']);
      expect(param.Description).toBeDefined();
    });

    test('ExistingVPCId parameter should have correct properties', () => {
      const param = template.Parameters.ExistingVPCId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.Description).toBeDefined();
    });

    test('VPCCIDR parameter should have correct properties', () => {
      const param = template.Parameters.VPCCIDR;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.small');
      expect(param.AllowedValues).toContain('t3.medium');
      expect(param.AllowedValues).toContain('m5.large');
    });

    test('SSHLocation parameter should have correct properties', () => {
      const param = template.Parameters.SSHLocation;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('0.0.0.0/0');
      expect(param.MinLength).toBe(9);
      expect(param.MaxLength).toBe(18);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('DBInstanceClass parameter should have correct properties', () => {
      const param = template.Parameters.DBInstanceClass;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('db.t3.micro');
      expect(param.AllowedValues).toContain('db.t3.micro');
      expect(param.AllowedValues).toContain('db.t3.small');
      expect(param.AllowedValues).toContain('db.m5.large');
    });

    test('DBUsername parameter should have correct properties', () => {
      const param = template.Parameters.DBUsername;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dbadmin');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(16);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('DBPassword parameter should have correct properties', () => {
      const param = template.Parameters.DBPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.Default).toBe('dummyPassword123!');
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(41);
      expect(param.AllowedPattern).toBeDefined();
    });

    test('UseExistingKMSKey parameter should have correct properties', () => {
      const param = template.Parameters.UseExistingKMSKey;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('no');
      expect(param.AllowedValues).toEqual(['yes', 'no']);
    });

    test('ExistingKMSKeyARN parameter should have correct properties', () => {
      const param = template.Parameters.ExistingKMSKeyARN;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('UseExistingEC2Role parameter should have correct properties', () => {
      const param = template.Parameters.UseExistingEC2Role;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('no');
      expect(param.AllowedValues).toEqual(['yes', 'no']);
    });

    test('ExistingEC2RoleName parameter should have correct properties', () => {
      const param = template.Parameters.ExistingEC2RoleName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings?.RegionMap).toBeDefined();
    });

    test('RegionMap should have us-west-2 and us-east-1 regions', () => {
      expect(template.Mappings?.RegionMap['us-west-2']).toBeDefined();
      expect(template.Mappings?.RegionMap['us-west-2'].AMI).toBeDefined();
      expect(template.Mappings?.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings?.RegionMap['us-east-1'].AMI).toBeDefined();
    });

    test('AMI mapping should use SSM parameter', () => {
      const amiMapping = template.Mappings?.RegionMap['us-west-2'].AMI;
      expect(amiMapping).toBeDefined();
      expect(amiMapping).toContain(
        'resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2:1'
      );
    });

    test('Both regions should have same AMI mapping', () => {
      const usWest2AMI = template.Mappings?.RegionMap['us-west-2'].AMI;
      const usEast1AMI = template.Mappings?.RegionMap['us-east-1'].AMI;
      expect(usWest2AMI).toBe(usEast1AMI);
    });
  });

  describe('Conditions', () => {
    const requiredConditions = [
      'CreateNewVPC',
      'CreateNewKMSKey',
      'CreateNewEC2Role',
      'CreateNewDatabase',
      'CreateNATGateway',
      'CreateNewS3Bucket',
      'CreateNewEC2Instance',
    ];

    test('should have all required conditions', () => {
      requiredConditions.forEach(conditionName => {
        expect(template.Conditions?.[conditionName]).toBeDefined();
      });
    });

    test('CreateNewVPC condition should check UseExistingVPC parameter', () => {
      const condition = template.Conditions?.CreateNewVPC;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('UseExistingVPC');
      expect(condition['Fn::Equals'][1]).toBe('no');
    });

    test('CreateNewKMSKey condition should check UseExistingKMSKey parameter', () => {
      const condition = template.Conditions?.CreateNewKMSKey;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('UseExistingKMSKey');
      expect(condition['Fn::Equals'][1]).toBe('no');
    });

    test('CreateNewEC2Role condition should check UseExistingEC2Role parameter', () => {
      const condition = template.Conditions?.CreateNewEC2Role;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('UseExistingEC2Role');
      expect(condition['Fn::Equals'][1]).toBe('no');
    });

    test('CreateNewDatabase condition should check CreateDatabase parameter', () => {
      const condition = template.Conditions?.CreateNewDatabase;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('CreateDatabase');
      expect(condition['Fn::Equals'][1]).toBe('yes');
    });

    test('CreateNATGateway condition should check CreateNATGateway parameter', () => {
      const condition = template.Conditions?.CreateNATGateway;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('CreateNATGateway');
      expect(condition['Fn::Equals'][1]).toBe('yes');
    });

    test('CreateNewS3Bucket condition should check CreateS3Bucket parameter', () => {
      const condition = template.Conditions?.CreateNewS3Bucket;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('CreateS3Bucket');
      expect(condition['Fn::Equals'][1]).toBe('yes');
    });

    test('CreateNewEC2Instance condition should check CreateEC2Instance parameter', () => {
      const condition = template.Conditions?.CreateNewEC2Instance;
      expect(condition['Fn::Equals']).toBeDefined();
      expect(condition['Fn::Equals'][0]['Ref']).toBe('CreateEC2Instance');
      expect(condition['Fn::Equals'][1]).toBe('yes');
    });
  });

  describe('Resources', () => {
    const vpcResources = [
      'VPC',
      'InternetGateway',
      'VPCGatewayAttachment',
      'PublicSubnet1',
      'PublicSubnet2',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'NatGatewayEIP',
      'NatGateway',
      'PublicRouteTable',
      'DefaultPublicRoute',
      'PublicSubnet1RouteTableAssociation',
      'PublicSubnet2RouteTableAssociation',
      'PrivateRouteTable',
      'DefaultPrivateRoute',
      'PrivateSubnet1RouteTableAssociation',
      'PrivateSubnet2RouteTableAssociation',
    ];

    const securityGroupResources = [
      'WebServerSecurityGroup',
      'DatabaseSecurityGroup',
    ];

    const encryptionResources = ['KMSKey', 'KMSKeyAlias'];

    const iamResources = ['EC2Role', 'EC2InstanceProfile'];

    const storageResources = ['ApplicationLogsBucket'];
    const monitoringResources = [
      'VPCFlowLogRole',
      'VPCFlowLogs',
      'VPCFlowLogsDelivery',
    ];

    const databaseResources = ['DBSubnetGroup', 'DBParameterGroup', 'Database'];

    const computeResources = ['LaunchTemplate', 'WebInstance'];

    const allResources = [
      ...vpcResources,
      ...securityGroupResources,
      ...encryptionResources,
      ...iamResources,
      ...storageResources,
      ...monitoringResources,
      ...databaseResources,
      ...computeResources,
    ];

    test('should have all required resources', () => {
      allResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    describe('VPC Resources', () => {
      test('VPC should be conditional and have correct properties', () => {
        const vpc = template.Resources.VPC;
        expect(vpc.Type).toBe('AWS::EC2::VPC');
        expect(vpc.Condition).toBe('CreateNewVPC');
        expect(vpc.Properties.CidrBlock['Ref']).toBe('VPCCIDR');
        expect(vpc.Properties.EnableDnsHostnames).toBe(true);
        expect(vpc.Properties.EnableDnsSupport).toBe(true);
      });

      test('InternetGateway should be conditional', () => {
        const igw = template.Resources.InternetGateway;
        expect(igw.Type).toBe('AWS::EC2::InternetGateway');
        expect(igw.Condition).toBe('CreateNewVPC');
      });

      test('VPCGatewayAttachment should be conditional', () => {
        const attachment = template.Resources.VPCGatewayAttachment;
        expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(attachment.Condition).toBe('CreateNewVPC');
        expect(attachment.Properties.VpcId['Ref']).toBe('VPC');
        expect(attachment.Properties.InternetGatewayId['Ref']).toBe(
          'InternetGateway'
        );
      });

      test('Public subnets should be conditional and have correct properties', () => {
        ['PublicSubnet1', 'PublicSubnet2'].forEach(subnetName => {
          const subnet = template.Resources[subnetName];
          expect(subnet.Type).toBe('AWS::EC2::Subnet');
          expect(subnet.Condition).toBe('CreateNewVPC');
          expect(subnet.Properties.VpcId['Ref']).toBe('VPC');
          expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        });
      });

      test('Private subnets should be conditional and have correct properties', () => {
        ['PrivateSubnet1', 'PrivateSubnet2'].forEach(subnetName => {
          const subnet = template.Resources[subnetName];
          expect(subnet.Type).toBe('AWS::EC2::Subnet');
          expect(subnet.Condition).toBe('CreateNewVPC');
          expect(subnet.Properties.VpcId['Ref']).toBe('VPC');
          expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
        });
      });

      test('NAT Gateway should be conditional and have correct properties', () => {
        const natGateway = template.Resources.NatGateway;
        expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
        expect(natGateway.Condition).toBe('CreateNATGateway');
        expect(natGateway.Properties.AllocationId['Fn::GetAtt']).toEqual([
          'NatGatewayEIP',
          'AllocationId',
        ]);
        expect(natGateway.Properties.SubnetId['Fn::If']).toBeDefined();
        expect(natGateway.Properties.SubnetId['Fn::If'][0]).toBe(
          'CreateNewVPC'
        );
        expect(natGateway.Properties.SubnetId['Fn::If'][1]['Ref']).toBe(
          'PublicSubnet1'
        );
        expect(natGateway.Properties.SubnetId['Fn::If'][2]['Ref']).toBe(
          'AWS::NoValue'
        );
      });

      test('NAT Gateway EIP should be conditional', () => {
        const natGatewayEIP = template.Resources.NatGatewayEIP;
        expect(natGatewayEIP.Type).toBe('AWS::EC2::EIP');
        expect(natGatewayEIP.Condition).toBe('CreateNATGateway');
        expect(natGatewayEIP.Properties.Domain).toBe('vpc');
      });

      test('Route tables should be conditional', () => {
        ['PublicRouteTable', 'PrivateRouteTable'].forEach(rtName => {
          const rt = template.Resources[rtName];
          expect(rt.Type).toBe('AWS::EC2::RouteTable');
          expect(rt.Condition).toBe('CreateNewVPC');
          expect(rt.Properties.VpcId['Ref']).toBe('VPC');
        });
      });
    });

    describe('Security Groups', () => {
      test('WebServerSecurityGroup should have correct properties', () => {
        const sg = template.Resources.WebServerSecurityGroup;
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sg.Properties.GroupDescription).toBeDefined();
        expect(sg.Properties.VpcId['Fn::If']).toBeDefined();
        expect(sg.Properties.SecurityGroupIngress).toBeDefined();
        expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      });

      test('WebServerSecurityGroup should allow HTTP, HTTPS, and SSH', () => {
        const sg = template.Resources.WebServerSecurityGroup;
        const ingress = sg.Properties.SecurityGroupIngress;

        const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
        const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
        const sshRule = ingress.find((rule: any) => rule.FromPort === 22);

        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(sshRule).toBeDefined();
        expect(sshRule.CidrIp['Ref']).toBe('SSHLocation');
      });

      test('DatabaseSecurityGroup should have correct properties', () => {
        const sg = template.Resources.DatabaseSecurityGroup;
        expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
        expect(sg.Properties.GroupDescription).toBeDefined();
        expect(sg.Properties.VpcId['Fn::If']).toBeDefined();
        expect(sg.Properties.SecurityGroupIngress).toBeDefined();
        expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      });

      test('DatabaseSecurityGroup should allow MySQL from web servers', () => {
        const sg = template.Resources.DatabaseSecurityGroup;
        const ingress = sg.Properties.SecurityGroupIngress;

        const mysqlRule = ingress.find((rule: any) => rule.FromPort === 3306);
        expect(mysqlRule).toBeDefined();
        expect(mysqlRule.SourceSecurityGroupId['Fn::GetAtt']).toEqual([
          'WebServerSecurityGroup',
          'GroupId',
        ]);
      });
    });

    describe('Encryption Resources', () => {
      test('KMSKey should be conditional and have correct properties', () => {
        const key = template.Resources.KMSKey;
        expect(key.Type).toBe('AWS::KMS::Key');
        expect(key.Condition).toBe('CreateNewKMSKey');
        expect(key.DeletionPolicy).toBe('Retain');
        expect(key.Properties.EnableKeyRotation).toBe(true);
        expect(key.Properties.KeyPolicy).toBeDefined();
      });

      test('KMSKeyAlias should be conditional and reference KMSKey', () => {
        const alias = template.Resources.KMSKeyAlias;
        expect(alias.Type).toBe('AWS::KMS::Alias');
        expect(alias.Condition).toBe('CreateNewKMSKey');
        expect(alias.Properties.TargetKeyId['Ref']).toBe('KMSKey');
      });
    });

    describe('IAM Resources', () => {
      test('EC2Role should be conditional and have correct properties', () => {
        const role = template.Resources.EC2Role;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Condition).toBe('CreateNewEC2Role');
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.Policies).toBeDefined();
      });

      test('EC2InstanceProfile should be conditional and reference EC2Role', () => {
        const profile = template.Resources.EC2InstanceProfile;
        expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
        expect(profile.Condition).toBe('CreateNewEC2Role');
        expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
      });
    });

    describe('Storage Resources', () => {
      test('ApplicationLogsBucket should be conditional and have correct properties', () => {
        const bucket = template.Resources.ApplicationLogsBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Condition).toBe('CreateNewS3Bucket');
        expect(bucket.DeletionPolicy).toBe('Retain');
        expect(bucket.Properties.VersioningConfiguration.Status).toBe(
          'Enabled'
        );
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.Properties.LoggingConfiguration).toBeDefined();
        expect(
          bucket.Properties.LoggingConfiguration.DestinationBucketName[
            'Fn::Sub'
          ]
        ).toBeDefined();
        expect(bucket.Properties.LoggingConfiguration.LogFilePrefix).toBe(
          's3-access-logs/'
        );
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      });

      test('ApplicationLogsBucket should have encryption enabled', () => {
        const bucket = template.Resources.ApplicationLogsBucket;
        const encryption =
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0];
        expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
          'AES256'
        );
      });

      test('ApplicationLogsBucket should block public access', () => {
        const bucket = template.Resources.ApplicationLogsBucket;
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });

      test('ApplicationLogsBucket should have logging configuration', () => {
        const bucket = template.Resources.ApplicationLogsBucket;
        const logging = bucket.Properties.LoggingConfiguration;
        expect(logging.DestinationBucketName['Fn::Sub']).toBeDefined();
        expect(logging.LogFilePrefix).toBe('s3-access-logs/');
      });

      test('ApplicationLogsBucket should have lifecycle rules for logs', () => {
        const bucket = template.Resources.ApplicationLogsBucket;
        const lifecycle = bucket.Properties.LifecycleConfiguration;
        expect(lifecycle.Rules).toHaveLength(2);

        const deleteOldLogsRule = lifecycle.Rules.find(
          (rule: any) => rule.Id === 'DeleteOldLogs'
        );
        const deleteOldAccessLogsRule = lifecycle.Rules.find(
          (rule: any) => rule.Id === 'DeleteOldAccessLogs'
        );

        expect(deleteOldLogsRule).toBeDefined();
        expect(deleteOldAccessLogsRule).toBeDefined();
        expect(deleteOldAccessLogsRule.Prefix).toBe('s3-access-logs/');
        expect(deleteOldAccessLogsRule.ExpirationInDays).toBe(90);
      });
    });

    describe('Monitoring Resources', () => {
      test('VPCFlowLogRole should be conditional and have correct properties', () => {
        const role = template.Resources.VPCFlowLogRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Condition).toBe('CreateNewVPC');
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.Policies).toBeDefined();
        expect(role.Properties.Policies[0].PolicyName['Fn::Sub']).toBeDefined();
        expect(
          role.Properties.Policies[0].PolicyDocument.Statement
        ).toHaveLength(1);
      });

      test('VPCFlowLogs should be conditional and have correct properties', () => {
        const logGroup = template.Resources.VPCFlowLogs;
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Condition).toBe('CreateNewVPC');
        expect(logGroup.Properties.LogGroupName['Fn::Sub']).toBeDefined();
        expect(logGroup.Properties.RetentionInDays).toBe(30);
      });

      test('VPCFlowLogsDelivery should be conditional and have correct properties', () => {
        const flowLog = template.Resources.VPCFlowLogsDelivery;
        expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
        expect(flowLog.Condition).toBe('CreateNewVPC');
        expect(flowLog.Properties.ResourceType).toBe('VPC');
        expect(flowLog.Properties.TrafficType).toBe('ALL');
        expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
      });
    });
  });

  describe('Database Resources', () => {
    test('DBSubnetGroup should be conditional and have correct properties', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Condition).toBe('CreateNewDatabase');
      expect(subnetGroup.Properties.DBSubnetGroupDescription).toBeDefined();
      expect(subnetGroup.Properties.SubnetIds).toBeDefined();
    });

    test('DBParameterGroup should be conditional and have correct properties', () => {
      const paramGroup = template.Resources.DBParameterGroup;
      expect(paramGroup.Type).toBe('AWS::RDS::DBParameterGroup');
      expect(paramGroup.Condition).toBe('CreateNewDatabase');
      expect(paramGroup.Properties.Family).toBe('mysql8.0');
      expect(paramGroup.Properties.Parameters).toBeDefined();
    });

    test('Database should be conditional and have correct properties', () => {
      const database = template.Resources.Database;
      expect(database.Type).toBe('AWS::RDS::DBInstance');
      expect(database.Condition).toBe('CreateNewDatabase');
      expect(database.DeletionPolicy).toBe('Snapshot');
      expect(database.Properties.Engine).toBe('mysql');
      expect(database.Properties.EngineVersion).toBe('8.0.43');
      expect(database.Properties.StorageEncrypted).toBe(true);
      expect(database.Properties.PubliclyAccessible).toBe(false);
      expect(database.Properties.DeletionProtection).toBe(true);
    });

    test('Database should reference parameters correctly', () => {
      const database = template.Resources.Database;
      expect(database.Properties.DBInstanceClass['Ref']).toBe(
        'DBInstanceClass'
      );
      expect(database.Properties.MasterUsername['Ref']).toBe('DBUsername');
      expect(database.Properties.MasterUserPassword['Ref']).toBe('DBPassword');
    });
  });

  describe('Compute Resources', () => {
    test('LaunchTemplate should be conditional and have correct properties', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Condition).toBe('CreateNewEC2Instance');
      expect(lt.Properties.LaunchTemplateData).toBeDefined();
      expect(
        lt.Properties.LaunchTemplateData.ImageId['Fn::FindInMap']
      ).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.InstanceType['Ref']).toBe(
        'InstanceType'
      );
    });

    test('LaunchTemplate should have encryption enabled', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevice =
        lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.KmsKeyId['Fn::If']).toBeDefined();
    });

    test('LaunchTemplate should have IMDSv2 enabled', () => {
      const lt = template.Resources.LaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpEndpoint).toBe('enabled');
      expect(metadata.HttpTokens).toBe('required');
      expect(metadata.HttpPutResponseHopLimit).toBe(2);
    });

    test('WebInstance should be conditional and reference LaunchTemplate', () => {
      const instance = template.Resources.WebInstance;
      expect(instance.Type).toBe('AWS::EC2::Instance');
      expect(instance.Condition).toBe('CreateNewEC2Instance');
      expect(instance.Properties.LaunchTemplate.LaunchTemplateId['Ref']).toBe(
        'LaunchTemplate'
      );
      expect(instance.Properties.LaunchTemplate.Version['Fn::GetAtt']).toEqual([
        'LaunchTemplate',
        'LatestVersionNumber',
      ]);
    });
  });

  describe('Outputs', () => {
    const requiredOutputs = [
      'VPCId',
      'PublicSubnets',
      'PrivateSubnets',
      'WebServerSecurityGroupId',
      'DatabaseSecurityGroupId',
      'DatabaseEndpoint',
      'ApplicationLogsBucketName',
      'KMSKeyArn',
      'WebInstanceId',
      'VPCFlowLogsLogGroupName',
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be conditional', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBeDefined();
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('PublicSubnets output should be conditional', () => {
      const output = template.Outputs.PublicSubnets;
      expect(output.Description).toBeDefined();
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('PrivateSubnets output should be conditional', () => {
      const output = template.Outputs.PrivateSubnets;
      expect(output.Description).toBeDefined();
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('WebServerSecurityGroupId output should reference security group', () => {
      const output = template.Outputs.WebServerSecurityGroupId;
      expect(output.Description).toBeDefined();
      expect(output.Value['Ref']).toBe('WebServerSecurityGroup');
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('DatabaseSecurityGroupId output should reference security group', () => {
      const output = template.Outputs.DatabaseSecurityGroupId;
      expect(output.Description).toBeDefined();
      expect(output.Value['Ref']).toBe('DatabaseSecurityGroup');
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('DatabaseEndpoint output should be conditional', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBeDefined();
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('ApplicationLogsBucketName output should be conditional', () => {
      const output = template.Outputs.ApplicationLogsBucketName;
      expect(output.Description).toBeDefined();
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Value['Fn::If'][0]).toBe('CreateNewS3Bucket');
      expect(output.Value['Fn::If'][1]['Ref']).toBe('ApplicationLogsBucket');
      expect(output.Value['Fn::If'][2]).toBe('No bucket created');
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('KMSKeyArn output should be conditional', () => {
      const output = template.Outputs.KMSKeyArn;
      expect(output.Description).toBeDefined();
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('WebInstanceId output should be conditional', () => {
      const output = template.Outputs.WebInstanceId;
      expect(output.Description).toBeDefined();
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Value['Fn::If'][0]).toBe('CreateNewEC2Instance');
      expect(output.Value['Fn::If'][1]['Ref']).toBe('WebInstance');
      expect(output.Value['Fn::If'][2]).toBe('No instance created');
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
    });

    test('VPCFlowLogsLogGroupName output should be conditional', () => {
      const output = template.Outputs.VPCFlowLogsLogGroupName;
      expect(output.Description).toBeDefined();
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Value['Fn::If'][0]).toBe('CreateNewVPC');
      expect(output.Value['Fn::If'][1]['Ref']).toBe('VPCFlowLogs');
      expect(output.Value['Fn::If'][2]).toBe('No VPC created');
      expect(output.Export.Name['Fn::Sub']).toBeDefined();
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
      expect(template.Conditions).not.toBeNull();
      expect(template.Mappings).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(0);
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(16);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10);
    });

    test('should have correct number of conditions', () => {
      const conditionCount = Object.keys(template.Conditions || {}).length;
      expect(conditionCount).toBe(7);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use stack name in tags', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Name'
          );
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toBeDefined();
            expect(nameTag.Value['Fn::Sub']).toContain('${AWS::StackName}');
          }
        }
      });
    });

    test('all outputs should use stack name in export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name['Fn::Sub']).toBeDefined();
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('database should not be publicly accessible', () => {
      const database = template.Resources.Database;
      expect(database.Properties.PubliclyAccessible).toBe(false);
    });

    test('database should have deletion protection enabled', () => {
      const database = template.Resources.Database;
      expect(database.Properties.DeletionProtection).toBe(true);
    });

    test('database should have encryption enabled', () => {
      const database = template.Resources.Database;
      expect(database.Properties.StorageEncrypted).toBe(true);
    });

    test('S3 bucket should have appropriate public access settings', () => {
      const bucket = template.Resources.ApplicationLogsBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ApplicationLogsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('EC2 launch template should have IMDSv2 enabled', () => {
      const lt = template.Resources.LaunchTemplate;
      const metadata = lt.Properties.LaunchTemplateData.MetadataOptions;
      expect(metadata.HttpTokens).toBe('required');
    });

    test('EC2 volumes should be encrypted', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevice =
        lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
    });
  });
});
