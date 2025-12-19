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
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(paramGroups).toBeDefined();
      expect(paramGroups.length).toBeGreaterThanOrEqual(5);

      const groupLabels = paramGroups.map((g: any) => g.Label.default);
      expect(groupLabels).toContain('Environment Configuration');
      expect(groupLabels).toContain('Network Configuration');
      expect(groupLabels).toContain('EC2 Configuration');
      expect(groupLabels).toContain('Database Configuration');
      expect(groupLabels).toContain('Load Balancer Configuration');
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have VPC CIDR parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Type).toBe('String');
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
    });

    test('should have subnet CIDR parameters', () => {
      const subnetParams = [
        'PublicSubnet1CIDR', 'PublicSubnet2CIDR', 'PublicSubnet3CIDR',
        'PrivateSubnet1CIDR', 'PrivateSubnet2CIDR', 'PrivateSubnet3CIDR'
      ];

      subnetParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
      });
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(template.Parameters.LatestAmiId.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('should have database parameters', () => {
      expect(template.Parameters.DBName).toBeDefined();
      expect(template.Parameters.DBUser).toBeDefined();
      expect(template.Parameters.DBClass).toBeDefined();
      expect(template.Parameters.DBAllocatedStorage).toBeDefined();

      expect(template.Parameters.DBName.Default).toBe('proddb');
      expect(template.Parameters.DBUser.Default).toBe('admin');
    });

    test('should have instance type parameters', () => {
      expect(template.Parameters.BastionInstanceType).toBeDefined();
      expect(template.Parameters.AppInstanceType).toBeDefined();

      expect(template.Parameters.BastionInstanceType.Default).toBe('t3.micro');
      expect(template.Parameters.AppInstanceType.Default).toBe('t3.small');
    });

    test('should have BastionAllowedCIDR parameter', () => {
      expect(template.Parameters.BastionAllowedCIDR).toBeDefined();
      expect(template.Parameters.BastionAllowedCIDR.Default).toBe('0.0.0.0/0');
      expect(template.Parameters.BastionAllowedCIDR.AllowedPattern).toBeDefined();
    });

    test('should have SSLCertificateARN parameter', () => {
      expect(template.Parameters.SSLCertificateARN).toBeDefined();
      expect(template.Parameters.SSLCertificateARN.Type).toBe('String');
      expect(template.Parameters.SSLCertificateARN.Default).toBe('');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('VPC should use EnvironmentSuffix in tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      const envTag = tags.find((t: any) => t.Key === 'Environment');

      expect(nameTag.Value['Fn::Sub']).toBe('${EnvironmentSuffix} VPC');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();

      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach((subnet, index) => {
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(true);
        expect(template.Resources[subnet].Properties.AvailabilityZone['Fn::Select'][0]).toBe(index);
      });
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();

      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach((subnet, index) => {
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(false);
        expect(template.Resources[subnet].Properties.AvailabilityZone['Fn::Select'][0]).toBe(index);
      });
    });

    test('should have 3 NAT Gateways with EIPs', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway3EIP).toBeDefined();

      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();

      ['NatGateway1EIP', 'NatGateway2EIP', 'NatGateway3EIP'].forEach(eip => {
        expect(template.Resources[eip].Type).toBe('AWS::EC2::EIP');
        expect(template.Resources[eip].Properties.Domain).toBe('vpc');
        expect(template.Resources[eip].DependsOn).toBe('InternetGatewayAttachment');
      });
    });

    test('should have route tables', () => {
      const routeTables = [
        'PublicRouteTable1', 'PublicRouteTable2', 'PublicRouteTable3',
        'PrivateRouteTable1', 'PrivateRouteTable2', 'PrivateRouteTable3'
      ];

      routeTables.forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('should have public routes to Internet Gateway', () => {
      ['DefaultPublicRoute1', 'DefaultPublicRoute2', 'DefaultPublicRoute3'].forEach(route => {
        expect(template.Resources[route]).toBeDefined();
        expect(template.Resources[route].Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(template.Resources[route].Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      });
    });

    test('should have private routes to NAT Gateways', () => {
      expect(template.Resources.DefaultPrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(template.Resources.DefaultPrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
      expect(template.Resources.DefaultPrivateRoute3.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway3' });
    });

    test('should have route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation', 'PublicSubnet3RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation', 'PrivateSubnet2RouteTableAssociation', 'PrivateSubnet3RouteTableAssociation'
      ];

      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have Bastion security group', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      const sg = template.Resources.BastionSecurityGroup.Properties;

      expect(sg.GroupDescription).toBe('Security group for bastion hosts');
      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(sg.SecurityGroupIngress[0].ToPort).toBe(22);
      expect(sg.SecurityGroupIngress[0].CidrIp).toEqual({ Ref: 'BastionAllowedCIDR' });
    });

    test('should have Web Server security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const sg = template.Resources.WebServerSecurityGroup.Properties;

      expect(sg.SecurityGroupIngress).toHaveLength(3);

      // HTTP from ALB
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'LoadBalancerSecurityGroup' });

      // HTTPS from ALB
      expect(sg.SecurityGroupIngress[1].FromPort).toBe(443);
      expect(sg.SecurityGroupIngress[1].SourceSecurityGroupId).toEqual({ Ref: 'LoadBalancerSecurityGroup' });

      // SSH from Bastion
      expect(sg.SecurityGroupIngress[2].FromPort).toBe(22);
      expect(sg.SecurityGroupIngress[2].SourceSecurityGroupId).toEqual({ Ref: 'BastionSecurityGroup' });
    });

    test('should have Load Balancer security group', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      const sg = template.Resources.LoadBalancerSecurityGroup.Properties;

      expect(sg.SecurityGroupIngress).toHaveLength(2);
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.SecurityGroupIngress[0].CidrIp).toBe('0.0.0.0/0');
      expect(sg.SecurityGroupIngress[1].FromPort).toBe(443);
      expect(sg.SecurityGroupIngress[1].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Database security group with restricted access', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const sg = template.Resources.DatabaseSecurityGroup.Properties;

      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(sg.SecurityGroupIngress[0].ToPort).toBe(3306);
      expect(sg.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('security groups should use EnvironmentSuffix in tags', () => {
      ['BastionSecurityGroup', 'WebServerSecurityGroup', 'LoadBalancerSecurityGroup', 'DatabaseSecurityGroup'].forEach(sg => {
        const tags = template.Resources[sg].Properties.Tags;
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Log configured', () => {
      expect(template.Resources.VpcFlowLog).toBeDefined();
      const flowLog = template.Resources.VpcFlowLog.Properties;

      expect(flowLog.ResourceType).toBe('VPC');
      expect(flowLog.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.TrafficType).toBe('ALL');
    });

    test('VPC Flow Log should not have DeliverLogsPermissionArn for S3 destination', () => {
      const flowLog = template.Resources.VpcFlowLog.Properties;
      expect(flowLog.DeliverLogsPermissionArn).toBeUndefined();
    });

    test('should have S3 bucket for flow logs', () => {
      expect(template.Resources.FlowLogsBucket).toBeDefined();
      expect(template.Resources.FlowLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.FlowLogsBucket.Properties;
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.FlowLogsBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 bucket should not have retention policy', () => {
      expect(template.Resources.FlowLogsBucket.DeletionPolicy).toBeUndefined();
    });

    test('should have S3 bucket policy', () => {
      expect(template.Resources.FlowLogsBucketPolicy).toBeDefined();
      const policy = template.Resources.FlowLogsBucketPolicy.Properties.PolicyDocument;

      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Principal.Service).toBe('delivery.logs.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('s3:PutObject');
    });
  });

  describe('EC2 Key Pair', () => {
    test('should have EC2 KeyPair resource', () => {
      expect(template.Resources.BastionKeyPair).toBeDefined();
      expect(template.Resources.BastionKeyPair.Type).toBe('AWS::EC2::KeyPair');
    });

    test('KeyPair should use stack name in key name', () => {
      const keyPair = template.Resources.BastionKeyPair.Properties;
      expect(keyPair.KeyName['Fn::Sub']).toBe('${AWS::StackName}-bastion-key');
    });

    test('KeyPair should use EnvironmentSuffix in tags', () => {
      const tags = template.Resources.BastionKeyPair.Properties.Tags;
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have correct engine configuration', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.Engine).toBe('MySQL');
      expect(rds.DBInstanceClass).toEqual({ Ref: 'DBClass' });
      expect(rds.AllocatedStorage).toEqual({ Ref: 'DBAllocatedStorage' });
    });

    test('RDS should be Multi-AZ', () => {
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
    });

    test('RDS should have encryption enabled', () => {
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should have deletion protection disabled', () => {
      expect(template.Resources.RDSInstance.Properties.DeletionProtection).toBe(false);
    });

    test('RDS should delete automated backups on deletion', () => {
      expect(template.Resources.RDSInstance.Properties.DeleteAutomatedBackups).toBe(true);
    });

    test('RDS should have backup retention period', () => {
      expect(template.Resources.RDSInstance.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const dbSubnet = template.Resources.DBSubnetGroup.Properties;

      expect(dbSubnet.SubnetIds).toHaveLength(3);
      expect(dbSubnet.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(dbSubnet.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(dbSubnet.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet3' });
    });

    test('should have database password secret', () => {
      expect(template.Resources.DBPasswordSecret).toBeDefined();
      expect(template.Resources.DBPasswordSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('database secret should use EnvironmentSuffix in description', () => {
      const secret = template.Resources.DBPasswordSecret.Properties;
      expect(secret.Description['Fn::Sub']).toBe('Secret for ${EnvironmentSuffix} RDS Database Password');
    });

    test('database secret should generate password', () => {
      const secret = template.Resources.DBPasswordSecret.Properties;
      expect(secret.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.GenerateSecretString.PasswordLength).toBe(16);
    });

    test('RDS should use credentials from Secrets Manager', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.MasterUsername).toEqual({ Ref: 'DBUser' });
      expect(rds.MasterUserPassword['Fn::Join']).toBeDefined();
    });

    test('RDS should use EnvironmentSuffix in tags', () => {
      const tags = template.Resources.RDSInstance.Properties.Tags;
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('SNS and CloudWatch Alarms', () => {
    test('should have SNS topic for alarms', () => {
      expect(template.Resources.AlarmNotificationTopic).toBeDefined();
      expect(template.Resources.AlarmNotificationTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should use EnvironmentSuffix in display name', () => {
      const topic = template.Resources.AlarmNotificationTopic.Properties;
      expect(topic.DisplayName['Fn::Sub']).toBe('${EnvironmentSuffix}InfraAlarms');
    });

    test('should have CPU alarm for auto scaling group', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmHigh.Type).toBe('AWS::CloudWatch::Alarm');

      const alarm = template.Resources.CPUAlarmHigh.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(75);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have database CPU alarm', () => {
      expect(template.Resources.DatabaseCPUAlarm).toBeDefined();
      const alarm = template.Resources.DatabaseCPUAlarm.Properties;

      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/RDS');
      expect(alarm.Threshold).toBe(80);
    });
  });

  describe('IAM Roles', () => {
    test('should have EC2 instance role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      const statement = role.AssumeRolePolicyDocument.Statement[0];

      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('EC2 role should follow least privilege with managed policies', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.ManagedPolicyArns).toHaveLength(2);
    });

    test('should have instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');

      const profile = template.Resources.EC2InstanceProfile.Properties;
      expect(profile.Roles).toContainEqual({ Ref: 'EC2InstanceRole' });
    });
  });

  describe('Bastion Host', () => {
    test('should have Bastion Host instance', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.BastionHost.Type).toBe('AWS::EC2::Instance');
    });

    test('Bastion should use LatestAmiId parameter', () => {
      const bastion = template.Resources.BastionHost.Properties;
      expect(bastion.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('Bastion should use BastionKeyPair', () => {
      const bastion = template.Resources.BastionHost.Properties;
      expect(bastion.KeyName).toEqual({ Ref: 'BastionKeyPair' });
    });

    test('Bastion should have encrypted EBS volume', () => {
      const bastion = template.Resources.BastionHost.Properties;
      expect(bastion.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(bastion.BlockDeviceMappings[0].Ebs.DeleteOnTermination).toBe(true);
      expect(bastion.BlockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
    });

    test('Bastion should be in public subnet', () => {
      const bastion = template.Resources.BastionHost.Properties;
      expect(bastion.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('Bastion should use EnvironmentSuffix in tags', () => {
      const tags = template.Resources.BastionHost.Properties.Tags;
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      const envTag = tags.find((t: any) => t.Key === 'Environment');

      expect(nameTag.Value['Fn::Sub']).toBe('${EnvironmentSuffix} Bastion Host');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should span multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Subnets).toHaveLength(3);
      expect(alb.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
      expect(alb.Subnets).toContainEqual({ Ref: 'PublicSubnet3' });
    });

    test('should have HTTP listener with HTTPS redirect', () => {
      expect(template.Resources.HTTPListener).toBeDefined();
      const listener = template.Resources.HTTPListener.Properties;

      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.DefaultActions[0].Type).toBe('redirect');
      expect(listener.DefaultActions[0].RedirectConfig.Protocol).toBe('HTTPS');
      expect(listener.DefaultActions[0].RedirectConfig.StatusCode).toBe('HTTP_301');
    });

    test('should have HTTPS listener with condition', () => {
      expect(template.Resources.HTTPSListener).toBeDefined();
      expect(template.Resources.HTTPSListener.Condition).toBe('HasSSLCertificate');

      const listener = template.Resources.HTTPSListener.Properties;
      expect(listener.Port).toBe(443);
      expect(listener.Protocol).toBe('HTTPS');
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      const tg = template.Resources.TargetGroup.Properties;

      expect(tg.Port).toBe(80);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.TargetType).toBe('instance');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthCheckPath).toBe('/');
    });
  });

  describe('Launch Template and Auto Scaling', () => {
    test('should have launch template', () => {
      expect(template.Resources.AppServerLaunchTemplate).toBeDefined();
      expect(template.Resources.AppServerLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should use LatestAmiId', () => {
      const lt = template.Resources.AppServerLaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('launch template should have encrypted EBS', () => {
      const lt = template.Resources.AppServerLaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(lt.BlockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
    });

    test('launch template should use EnvironmentSuffix in UserData', () => {
      const lt = template.Resources.AppServerLaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.UserData['Fn::Base64']['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have auto scaling group', () => {
      expect(template.Resources.AppServerAutoScalingGroup).toBeDefined();
      expect(template.Resources.AppServerAutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('auto scaling group should have correct capacity', () => {
      const asg = template.Resources.AppServerAutoScalingGroup.Properties;
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
    });

    test('auto scaling group should use EnvironmentSuffix in tags', () => {
      const asg = template.Resources.AppServerAutoScalingGroup.Properties;
      const nameTag = asg.Tags.find((t: any) => t.Key === 'Name');
      const envTag = asg.Tags.find((t: any) => t.Key === 'Environment');

      expect(nameTag.Value['Fn::Sub']).toBe('${EnvironmentSuffix} App Server');
      expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have auto scaling policy', () => {
      expect(template.Resources.AppServerScaleUpPolicy).toBeDefined();
      const policy = template.Resources.AppServerScaleUpPolicy.Properties;

      expect(policy.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.TargetTrackingConfiguration.TargetValue).toBe(70);
    });
  });

  describe('Conditions', () => {
    test('should have HasSSLCertificate condition', () => {
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
      expect(template.Conditions.HasSSLCertificate['Fn::Not']).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      const output = template.Outputs.VpcId;
      expect(output).toBeDefined();
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('should have PublicSubnets output', () => {
      const output = template.Outputs.PublicSubnets;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Public subnets');
      expect(output.Value['Fn::Join'][0]).toBe(',');
    });

    test('should have PrivateSubnets output', () => {
      const output = template.Outputs.PrivateSubnets;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Private subnets');
    });

    test('should have BastionIP output', () => {
      const output = template.Outputs.BastionIP;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Bastion host public IP');
      expect(output.Value['Fn::GetAtt']).toEqual(['BastionHost', 'PublicIp']);
    });

    test('should have LoadBalancerDNS output', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output).toBeDefined();
      expect(output.Description).toBe('DNS name of the load balancer');
      expect(output.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
    });

    test('should have RDSEndpoint output', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toBe('RDS endpoint address');
      expect(output.Value['Fn::GetAtt']).toEqual(['RDSInstance', 'Endpoint.Address']);
    });

    test('should have FlowLogsBucketName output', () => {
      const output = template.Outputs.FlowLogsBucketName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Name of the S3 bucket for VPC flow logs');
    });

    test('outputs should have export names', () => {
      ['VpcId', 'PublicSubnets', 'PrivateSubnets', 'BastionIP', 'LoadBalancerDNS', 'RDSEndpoint', 'FlowLogsBucketName'].forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.Properties.BucketEncryption).toBeDefined();
        }
      });
    });

    test('all EBS volumes should be encrypted', () => {
      // Check Bastion Host
      const bastion = template.Resources.BastionHost.Properties;
      expect(bastion.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);

      // Check Launch Template
      const lt = template.Resources.AppServerLaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('database should not be publicly accessible', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.PubliclyAccessible).toBeUndefined();
    });

    test('security groups should not allow unrestricted access except for ALB', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.Type === 'AWS::EC2::SecurityGroup' && key !== 'LoadBalancerSecurityGroup') {
          if (resource.Properties.SecurityGroupIngress) {
            resource.Properties.SecurityGroupIngress.forEach((rule: any) => {
              if (rule.CidrIp === '0.0.0.0/0') {
                // Only bastion should allow 0.0.0.0/0 for SSH
                expect(key).toBe('BastionSecurityGroup');
                expect(rule.FromPort).toBe(22);
              }
            });
          }
        }
      });
    });

    test('all resources should use EnvironmentSuffix for environment tagging', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
          if (envTag) {
            expect(envTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
          }
        }
      });
    });

    test('RDS should have backup retention configured', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.BackupRetentionPeriod).toBe(7);
    });

    test('RDS should be Multi-AZ for high availability', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.MultiAZ).toBe(true);
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50);
    });

    test('should have expected number of parameters', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(17);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });

    test('should have expected number of conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(1);
    });
  });

  describe('CloudFormation Schema Validation', () => {
    test('all resources should have valid Type', () => {
      const validTypes = [
        'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment', 'AWS::EC2::RouteTable', 'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation', 'AWS::EC2::EIP', 'AWS::EC2::NatGateway',
        'AWS::EC2::SecurityGroup', 'AWS::EC2::Instance', 'AWS::EC2::LaunchTemplate',
        'AWS::EC2::FlowLog', 'AWS::EC2::KeyPair',
        'AWS::RDS::DBInstance', 'AWS::RDS::DBSubnetGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer', 'AWS::ElasticLoadBalancingV2::Listener',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::AutoScaling::AutoScalingGroup', 'AWS::AutoScaling::ScalingPolicy',
        'AWS::IAM::Role', 'AWS::IAM::InstanceProfile',
        'AWS::S3::Bucket', 'AWS::S3::BucketPolicy',
        'AWS::SecretsManager::Secret',
        'AWS::SNS::Topic', 'AWS::CloudWatch::Alarm'
      ];

      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        expect(validTypes).toContain(resource.Type);
      });
    });

    test('all parameter types should be valid', () => {
      const validParamTypes = [
        'String', 'Number', 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      ];

      Object.keys(template.Parameters).forEach(key => {
        const param = template.Parameters[key];
        expect(validParamTypes).toContain(param.Type);
      });
    });

    test('all intrinsic functions should be valid', () => {
      const validFunctions = [
        'Ref', 'Fn::GetAtt', 'Fn::Sub', 'Fn::Join', 'Fn::Select',
        'Fn::GetAZs', 'Fn::Base64', 'Fn::Not', 'Fn::Equals'
      ];

      const checkIntrinsics = (obj: any) => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => {
            if (key.startsWith('Fn::') || key === 'Ref') {
              expect(validFunctions).toContain(key);
            }
            checkIntrinsics(obj[key]);
          });
        }
      };

      checkIntrinsics(template);
    });
  });

  describe('IAM Least Privilege Validation', () => {
    test('EC2 instance role should only have necessary permissions', () => {
      const role = template.Resources.EC2InstanceRole.Properties;

      // Should only have SSM and CloudWatch policies
      expect(role.ManagedPolicyArns).toHaveLength(2);
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');

      // Should not have admin or full access policies
      role.ManagedPolicyArns.forEach((arn: string) => {
        expect(arn).not.toContain('AdministratorAccess');
        expect(arn).not.toContain('PowerUserAccess');
        expect(arn).not.toContain('FullAccess');
      });
    });

    test('IAM roles should have explicit assume role policies', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.Type === 'AWS::IAM::Role') {
          expect(resource.Properties.AssumeRolePolicyDocument).toBeDefined();
          expect(resource.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
        }
      });
    });
  });

  describe('Deletion Protection Validation', () => {
    test('RDS should have deletion protection disabled', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.DeletionProtection).toBe(false);
    });

    test('S3 buckets should not have retention policy', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.Type === 'AWS::S3::Bucket') {
          expect(resource.DeletionPolicy).toBeUndefined();
        }
      });
    });

    test('RDS should delete automated backups on stack deletion', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.DeleteAutomatedBackups).toBe(true);
    });
  });
});
