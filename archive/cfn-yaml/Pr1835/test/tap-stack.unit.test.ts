import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('TAP Multi-Tier Architecture CloudFormation Template - Unit Tests', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBe('TAP - Cloud formation Template for  Multi-Tier AWS Architecture');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have LatestAmiId parameter', () => {
      const param = template.Parameters.LatestAmiId;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toBe('/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64');
    });
  });

  describe('Mappings', () => {
    test('should have TagsMap with correct values', () => {
      const tagsMap = template.Mappings.TagsMap;
      expect(tagsMap).toBeDefined();
      expect(tagsMap.Common.Environment).toBe('Demo');
      expect(tagsMap.Common.ProjectName).toBe('SecureArchitecture');
      expect(tagsMap.Common.Owner).toBe('SecOps');
      expect(tagsMap.Common.CostCenter).toBe('CC-001');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      expect(template.Resources.IGW).toBeDefined();
      expect(template.Resources.IGW.Type).toBe('AWS::EC2::InternetGateway');
      
      const attach = template.Resources.VPCIGWAttach;
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attach.Properties.VpcId.Ref).toBe('VPC');
      expect(attach.Properties.InternetGatewayId.Ref).toBe('IGW');
    });

    test('should have 6 subnets across 3 tiers', () => {
      const subnets = [
        'PublicSubnetAz1', 'PublicSubnetAz2',
        'PrivateAppSubnetAz1', 'PrivateAppSubnetAz2',
        'PrivateDbSubnetAz1', 'PrivateDbSubnetAz2'
      ];
      
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have correct subnet CIDR blocks', () => {
      expect(template.Resources.PublicSubnetAz1.Properties.CidrBlock).toBe('10.0.0.0/20');
      expect(template.Resources.PublicSubnetAz2.Properties.CidrBlock).toBe('10.0.16.0/20');
      expect(template.Resources.PrivateAppSubnetAz1.Properties.CidrBlock).toBe('10.0.32.0/20');
      expect(template.Resources.PrivateAppSubnetAz2.Properties.CidrBlock).toBe('10.0.48.0/20');
      expect(template.Resources.PrivateDbSubnetAz1.Properties.CidrBlock).toBe('10.0.64.0/20');
      expect(template.Resources.PrivateDbSubnetAz2.Properties.CidrBlock).toBe('10.0.80.0/20');
    });

    test('should have 2 NAT Gateways with EIPs', () => {
      expect(template.Resources.NatEipAz1).toBeDefined();
      expect(template.Resources.NatEipAz2).toBeDefined();
      expect(template.Resources.NatGwAz1).toBeDefined();
      expect(template.Resources.NatGwAz2).toBeDefined();
      
      expect(template.Resources.NatGwAz1.Properties.SubnetId.Ref).toBe('PublicSubnetAz1');
      expect(template.Resources.NatGwAz2.Properties.SubnetId.Ref).toBe('PublicSubnetAz2');
    });

    test('should have correct route tables', () => {
      const routeTables = ['RtPublic', 'RtAppAz1', 'RtAppAz2', 'RtDb'];
      routeTables.forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
      });
    });
  });

  describe('Network ACLs', () => {
    test('should have NACLs for each tier', () => {
      const nacls = ['NaclPublic', 'NaclApp', 'NaclDb'];
      nacls.forEach(nacl => {
        expect(template.Resources[nacl]).toBeDefined();
        expect(template.Resources[nacl].Type).toBe('AWS::EC2::NetworkAcl');
      });
    });

    test('should have public NACL rules', () => {
      const inRule = template.Resources.NaclPublicIn80;
      expect(inRule.Properties.Protocol).toBe(6);
      expect(inRule.Properties.RuleAction).toBe('allow');
      expect(inRule.Properties.PortRange.From).toBe(80);
      expect(inRule.Properties.PortRange.To).toBe(80);
      expect(inRule.Properties.CidrBlock).toBe('0.0.0.0/0');
    });

    test('should have app NACL SSH rule from admin CIDR', () => {
      const sshRule = template.Resources.NaclAppIn22FromAdmin;
      expect(sshRule.Properties.CidrBlock).toBe('203.0.113.0/24');
      expect(sshRule.Properties.PortRange.From).toBe(22);
      expect(sshRule.Properties.PortRange.To).toBe(22);
    });

    test('should have DB NACL rules restricting to app subnets', () => {
      const dbRule1 = template.Resources.NaclDbIn3306FromApp1;
      expect(dbRule1.Properties.CidrBlock).toBe('10.0.32.0/20');
      expect(dbRule1.Properties.PortRange.From).toBe(3306);
      
      const dbRule2 = template.Resources.NaclDbIn3306FromApp2;
      expect(dbRule2.Properties.CidrBlock).toBe('10.0.48.0/20');
      expect(dbRule2.Properties.PortRange.From).toBe(3306);
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      const sg = template.Resources.SgALB;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.Properties.SecurityGroupIngress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have App security group with restricted SSH', () => {
      const sg = template.Resources.SgApp;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const httpRule = sg.Properties.SecurityGroupIngress[0];
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.SourceSecurityGroupId.Ref).toBe('SgALB');
      
      const sshRule = sg.Properties.SecurityGroupIngress[1];
      expect(sshRule.FromPort).toBe(22);
      expect(sshRule.CidrIp).toBe('203.0.113.0/24');
    });

    test('should have DB security group', () => {
      const sg = template.Resources.SgDb;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const rules = sg.Properties.SecurityGroupIngress;
      expect(rules[0].FromPort).toBe(3306);
      expect(rules[0].SourceSecurityGroupId.Ref).toBe('SgApp');
      expect(rules[1].SourceSecurityGroupId.Ref).toBe('SgRotation');
    });

    test('should have VPC endpoint security group', () => {
      const sg = template.Resources.SgEndpointSM;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      
      const rules = sg.Properties.SecurityGroupIngress;
      expect(rules[0].FromPort).toBe(443);
      expect(rules[0].SourceSecurityGroupId.Ref).toBe('SgApp');
      expect(rules[1].SourceSecurityGroupId.Ref).toBe('SgRotation');
    });
  });

  describe('VPC Endpoint', () => {
    test('should have Secrets Manager VPC endpoint', () => {
      const endpoint = template.Resources.VPCEndpointSecretsManager;
      expect(endpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
      expect(endpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(endpoint.Properties.ServiceName['Fn::Sub']).toContain('secretsmanager');
    });
  });

  describe('KMS Keys', () => {
    test('should have data CMK with rotation', () => {
      const cmk = template.Resources.CMKData;
      expect(cmk.Type).toBe('AWS::KMS::Key');
      expect(cmk.Properties.EnableKeyRotation).toBe(true);
      expect(cmk.Properties.Description).toBe('CMK for app data (S3, RDS, EBS)');
    });

    test('should have logs CMK with rotation', () => {
      const cmk = template.Resources.CMKLogs;
      expect(cmk.Type).toBe('AWS::KMS::Key');
      expect(cmk.Properties.EnableKeyRotation).toBe(true);
      expect(cmk.Properties.Description).toBe('CMK for logs (CloudWatch Logs/S3 logs)');
    });

    test('should have KMS aliases', () => {
      expect(template.Resources.CMKDataAlias.Properties.AliasName).toBe('alias/secure/data');
      expect(template.Resources.CMKLogsAlias.Properties.AliasName).toBe('alias/secure/logs');
    });

    test('should have CloudWatch Logs service permission in logs CMK', () => {
      const policy = template.Resources.CMKLogs.Properties.KeyPolicy;
      const logsStatement = policy.Statement.find((s: any) => s.Sid === 'AllowLogsService');
      expect(logsStatement).toBeDefined();
      expect(logsStatement.Principal.Service['Fn::Sub']).toContain('logs');
    });
  });

  describe('S3 Buckets', () => {
    test('should have data bucket with KMS encryption', () => {
      const bucket = template.Resources.S3Data;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('CMKData');
    });

    test('should have logs bucket with KMS encryption', () => {
      const bucket = template.Resources.S3Logs;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('CMKLogs');
    });

    test('should have public access blocked on both buckets', () => {
      ['S3Data', 'S3Logs'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const config = bucket.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should have versioning enabled', () => {
      ['S3Data', 'S3Logs'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('should enforce TLS in bucket policies', () => {
      ['S3DataPolicy', 'S3LogsPolicy'].forEach(policyName => {
        const policy = template.Resources[policyName];
        const statement = policy.Properties.PolicyDocument.Statement[0];
        expect(statement.Sid).toBe('DenyInsecureTransport');
        expect(statement.Effect).toBe('Deny');
        expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have VPC Flow Logs log group', () => {
      const logGroup = template.Resources.LogGroupFlow;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toBe('/secure/vpc/flow');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
      expect(logGroup.Properties.KmsKeyId['Fn::GetAtt']).toEqual(['CMKLogs', 'Arn']);
    });

    test('should have VPC Flow Logs configuration', () => {
      const flowLog = template.Resources.VpcFlow;
      expect(flowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(flowLog.Properties.ResourceType).toBe('VPC');
      expect(flowLog.Properties.TrafficType).toBe('ALL');
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('should have Flow Logs IAM role', () => {
      const role = template.Resources.RoleFlowLogs;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('delivery.logs.amazonaws.com');
    });
  });

  describe('IAM Resources', () => {
    test('should have MFA-required group', () => {
      const group = template.Resources.GroupMFARequired;
      expect(group.Type).toBe('AWS::IAM::Group');
      expect(group.Properties.GroupName).toBe('MFAEnforced');
      
      const policy = group.Properties.Policies[0];
      expect(policy.PolicyName).toBe('DenyWithoutMFA');
      
      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Action).toBe('*');
      expect(statement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe(false);
    });

    test('should have App IAM role with least privilege', () => {
      const role = template.Resources.RoleApp;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;
      
      // Check DB secret access
      const secretAccess = policies.find((p: any) => p.Sid === 'ReadDBSecret');
      expect(secretAccess.Action).toBe('secretsmanager:GetSecretValue');
      expect(secretAccess.Resource.Ref).toBe('SecretDB');
      
      // Check KMS access
      const kmsAccess = policies.find((p: any) => p.Sid === 'UseDataCMK');
      expect(kmsAccess.Action).toContain('kms:Decrypt');
      expect(kmsAccess.Action).toContain('kms:Encrypt');
      
      // Check S3 access
      const s3List = policies.find((p: any) => p.Sid === 'S3DataAccess');
      expect(s3List.Action).toContain('s3:ListBucket');
      
      const s3Objects = policies.find((p: any) => p.Sid === 'S3DataObjects');
      expect(s3Objects.Action).toContain('s3:GetObject');
      expect(s3Objects.Action).toContain('s3:PutObject');
    });
  });

  describe('EC2 Launch Template and Auto Scaling', () => {
    test('should have launch template with encrypted EBS', () => {
      const lt = template.Resources.LTApp;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      
      const data = lt.Properties.LaunchTemplateData;
      expect(data.InstanceType).toBe('t3.micro');
      
      const blockDevice = data.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
      expect(blockDevice.Ebs.KmsKeyId.Ref).toBe('CMKData');
      expect(blockDevice.Ebs.VolumeSize).toBe(8);
    });

    test('should have network interface without public IP', () => {
      const lt = template.Resources.LTApp;
      const ni = lt.Properties.LaunchTemplateData.NetworkInterfaces[0];
      expect(ni.AssociatePublicIpAddress).toBe(false);
      expect(ni.Groups[0].Ref).toBe('SgApp');
    });

    test('should have ASG with zero capacity', () => {
      const asg = template.Resources.ASGApp;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe('0');
      expect(asg.Properties.MaxSize).toBe('0');
      expect(asg.Properties.DesiredCapacity).toBe('0');
    });

    test('should have ASG in private subnets', () => {
      const asg = template.Resources.ASGApp;
      const subnets = asg.Properties.VPCZoneIdentifier;
      expect(subnets[0].Ref).toBe('PrivateAppSubnetAz1');
      expect(subnets[1].Ref).toBe('PrivateAppSubnetAz2');
    });
  });

  describe('Load Balancer', () => {
    test('should have ALB in public subnets', () => {
      const alb = template.Resources.ALB;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      
      const subnets = alb.Properties.Subnets;
      expect(subnets[0].Ref).toBe('PublicSubnetAz1');
      expect(subnets[1].Ref).toBe('PublicSubnetAz2');
    });

    test('should have target group', () => {
      const tg = template.Resources.TG;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.TargetType).toBe('instance');
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });

    test('should have HTTP listener', () => {
      const listener = template.Resources.Listener80;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('RDS Database', () => {
    test('should have DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      
      const subnets = subnetGroup.Properties.SubnetIds;
      expect(subnets[0].Ref).toBe('PrivateDbSubnetAz1');
      expect(subnets[1].Ref).toBe('PrivateDbSubnetAz2');
    });

    test('should have RDS instance with encryption', () => {
      const db = template.Resources.DBInstance;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.41');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.KmsKeyId.Ref).toBe('CMKData');
      expect(db.Properties.PubliclyAccessible).toBe(false);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have DB credentials in Secrets Manager', () => {
      const secret = template.Resources.SecretDB;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toBe('secure-rds-master');
      expect(secret.Properties.KmsKeyId.Ref).toBe('CMKData');
      
      const genString = secret.Properties.GenerateSecretString;
      expect(genString.SecretStringTemplate).toBe('{"username":"dbadmin"}');
      expect(genString.GenerateStringKey).toBe('password');
      expect(genString.PasswordLength).toBe(20);
      expect(genString.ExcludePunctuation).toBe(true);
    });

    test('should have secret rotation configuration', () => {
      const rotation = template.Resources.SecretRotation;
      expect(rotation.Type).toBe('AWS::SecretsManager::RotationSchedule');
      expect(rotation.Properties.RotationRules.ScheduleExpression).toBe('rate(30 days)');
      expect(rotation.Properties.RotationRules.Duration).toBe('2h');
    });

    test('should have rotation Lambda function', () => {
      const fn = template.Resources.SecretRotationFn;
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.Runtime).toBe('python3.12');
      expect(fn.Properties.Handler).toBe('index.handler');
      expect(fn.Properties.Timeout).toBe(60);
    });
  });

  describe('SNS Topic', () => {
    test('should have security alerts topic', () => {
      const topic = template.Resources.TopicSecurityAlerts;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName).toBe('security-alerts');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = ['VpcId', 'ALBDNS', 'RDSEndpoint', 'DataBucketName', 'LogsBucketName'];
      
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('should have correct output values', () => {
      expect(template.Outputs.VpcId.Value.Ref).toBe('VPC');
      expect(template.Outputs.ALBDNS.Value['Fn::GetAtt']).toEqual(['ALB', 'DNSName']);
      expect(template.Outputs.RDSEndpoint.Value['Fn::GetAtt']).toEqual(['DBInstance', 'Endpoint.Address']);
      expect(template.Outputs.DataBucketName.Value.Ref).toBe('S3Data');
      expect(template.Outputs.LogsBucketName.Value.Ref).toBe('S3Logs');
    });
  });

  describe('Security Best Practices', () => {
    test('should enforce encryption everywhere', () => {
      // KMS keys have rotation
      expect(template.Resources.CMKData.Properties.EnableKeyRotation).toBe(true);
      expect(template.Resources.CMKLogs.Properties.EnableKeyRotation).toBe(true);
      
      // S3 buckets encrypted
      expect(template.Resources.S3Data.Properties.BucketEncryption).toBeDefined();
      expect(template.Resources.S3Logs.Properties.BucketEncryption).toBeDefined();
      
      // RDS encrypted
      expect(template.Resources.DBInstance.Properties.StorageEncrypted).toBe(true);
      
      // EBS encrypted
      expect(template.Resources.LTApp.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('should block public access on S3', () => {
      ['S3Data', 'S3Logs'].forEach(bucket => {
        const config = template.Resources[bucket].Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should enforce TLS for S3', () => {
      ['S3DataPolicy', 'S3LogsPolicy'].forEach(policy => {
        const statement = template.Resources[policy].Properties.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Deny');
        expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
      });
    });

    test('should restrict SSH to admin CIDR only', () => {
      // Security Group
      const sgSsh = template.Resources.SgApp.Properties.SecurityGroupIngress[1];
      expect(sgSsh.CidrIp).toBe('203.0.113.0/24');
      
      // NACL
      const naclSsh = template.Resources.NaclAppIn22FromAdmin;
      expect(naclSsh.Properties.CidrBlock).toBe('203.0.113.0/24');
    });

    test('should have no public IPs in private subnets', () => {
      ['PrivateAppSubnetAz1', 'PrivateAppSubnetAz2', 'PrivateDbSubnetAz1', 'PrivateDbSubnetAz2'].forEach(subnet => {
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('should enforce MFA for sensitive operations', () => {
      const group = template.Resources.GroupMFARequired;
      const policy = group.Properties.Policies[0].PolicyDocument.Statement[0];
      expect(policy.Effect).toBe('Deny');
      expect(policy.Condition.Bool['aws:MultiFactorAuthPresent']).toBe(false);
    });

    test('should use VPC endpoint for Secrets Manager', () => {
      const endpoint = template.Resources.VPCEndpointSecretsManager;
      expect(endpoint.Properties.PrivateDnsEnabled).toBe(true);
      expect(endpoint.Properties.VpcEndpointType).toBe('Interface');
    });
  });

  describe('Template Validation', () => {
    test('should have valid resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50); // Complex multi-tier architecture
    });

    test('all resource types should be valid', () => {
      const validTypes = [
        'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment', 'AWS::EC2::EIP', 'AWS::EC2::NatGateway',
        'AWS::EC2::RouteTable', 'AWS::EC2::Route', 'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::NetworkAcl', 'AWS::EC2::NetworkAclEntry', 'AWS::EC2::SubnetNetworkAclAssociation',
        'AWS::EC2::SecurityGroup', 'AWS::EC2::VPCEndpoint', 'AWS::EC2::FlowLog',
        'AWS::EC2::LaunchTemplate', 'AWS::AutoScaling::AutoScalingGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer', 'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::ElasticLoadBalancingV2::Listener', 'AWS::KMS::Key', 'AWS::KMS::Alias',
        'AWS::S3::Bucket', 'AWS::S3::BucketPolicy', 'AWS::Logs::LogGroup',
        'AWS::IAM::Role', 'AWS::IAM::Group', 'AWS::IAM::InstanceProfile',
        'AWS::RDS::DBSubnetGroup', 'AWS::RDS::DBInstance',
        'AWS::SecretsManager::Secret', 'AWS::SecretsManager::SecretTargetAttachment',
        'AWS::SecretsManager::RotationSchedule', 'AWS::Lambda::Function',
        'AWS::Lambda::Permission', 'AWS::SNS::Topic'
      ];
      
      Object.values(template.Resources).forEach((resource: any) => {
        expect(validTypes).toContain(resource.Type);
      });
    });
  });
});