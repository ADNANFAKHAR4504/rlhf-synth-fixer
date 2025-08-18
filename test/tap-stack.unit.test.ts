import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('has correct format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain(
        'Scalable and secure web application'
      );
    });

    test('has required parameters', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBUsername.Type).toBe('String');
      expect(template.Parameters.DBUsername.Default).toBe('admin');
      expect(template.Parameters.DBUsername.MinLength).toBe(1);
      expect(template.Parameters.DBUsername.MaxLength).toBe(16);
      expect(template.Parameters.DBUsername.AllowedPattern).toBe(
        '[a-zA-Z][a-zA-Z0-9]*'
      );
      expect(template.Parameters.DBUsername.ConstraintDescription).toBe(
        'Must begin with a letter and contain only alphanumeric characters'
      );

      expect(template.Parameters.SSLCertificateArn).toBeDefined();
      expect(template.Parameters.SSLCertificateArn.Type).toBe('String');
      expect(template.Parameters.SSLCertificateArn.Description).toBe(
        'ARN of SSL certificate for ALB (must be in us-east-1)'
      );
      expect(template.Parameters.SSLCertificateArn.Default).toBe('');
    });
  });

  describe('VPC and Networking', () => {
    test('defines core networking resources', () => {
      const r = template.Resources;
      expect(r.VPC).toBeDefined();
      expect(r.VPC.Type).toBe('AWS::EC2::VPC');
      expect(r.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(r.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(r.VPC.Properties.EnableDnsSupport).toBe(true);

      expect(r.PublicSubnet1).toBeDefined();
      expect(r.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(r.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(r.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');

      expect(r.PublicSubnet2).toBeDefined();
      expect(r.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');

      expect(r.PrivateSubnet1).toBeDefined();
      expect(r.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.3.0/24');

      expect(r.PrivateSubnet2).toBeDefined();
      expect(r.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('uses dynamic availability zones', () => {
      const pub1 = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const pub2 = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      const priv1 =
        template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const priv2 =
        template.Resources.PrivateSubnet2.Properties.AvailabilityZone;

      expect(pub1['Fn::Select']).toBeDefined();
      expect(pub2['Fn::Select']).toBeDefined();
      expect(priv1['Fn::Select']).toBeDefined();
      expect(priv2['Fn::Select']).toBeDefined();
    });

    test('defines internet gateway and attachment', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe(
        'AWS::EC2::VPCGatewayAttachment'
      );
    });

    test('defines NAT gateways with EIPs', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('defines route tables and associations', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
      expect(template.Resources.DefaultPublicRoute).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute1).toBeDefined();
      expect(template.Resources.DefaultPrivateRoute2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('defines ALB security group with correct ingress rules', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSg.Properties.GroupName).toBe('WebApp-ALB-SecurityGroup');
      expect(albSg.Properties.VpcId.Ref).toBe('VPC');

      const ingress = albSg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].FromPort).toBe(443);
      expect(ingress[0].ToPort).toBe(443);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[1].FromPort).toBe(80);
      expect(ingress[1].ToPort).toBe(80);
    });

    test('defines web server security group', () => {
      const webSg = template.Resources.WebServerSecurityGroup;
      expect(webSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSg.Properties.GroupName).toBe('WebApp-WebServer-SecurityGroup');
      expect(webSg.Properties.VpcId.Ref).toBe('VPC');

      const ingress = webSg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(2);
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe('ALBSecurityGroup');
      expect(ingress[1].SourceSecurityGroupId.Ref).toBe('ALBSecurityGroup');
    });

    test('defines database security group', () => {
      const dbSg = template.Resources.DatabaseSecurityGroup;
      expect(dbSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(dbSg.Properties.GroupName).toBe('WebApp-Database-SecurityGroup');
      expect(dbSg.Properties.VpcId.Ref).toBe('VPC');

      const ingress = dbSg.Properties.SecurityGroupIngress;
      expect(ingress).toHaveLength(1);
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].ToPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId.Ref).toBe(
        'WebServerSecurityGroup'
      );
    });
  });

  describe('IAM and Security', () => {
    test('defines EC2 role with correct policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toBe('WebApp-EC2-Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe(
        'Allow'
      );
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('ec2.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe(
        'sts:AssumeRole'
      );

      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );

      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(2);
      expect(policies[0].PolicyName).toBe('SecretsManagerAccess');
      expect(policies[1].PolicyName).toBe('S3Access');
    });

    test('defines EC2 instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.InstanceProfileName).toBe(
        'WebApp-EC2-InstanceProfile'
      );
      expect(profile.Properties.Roles).toHaveLength(1);
      expect(profile.Properties.Roles[0].Ref).toBe('EC2Role');
    });

    test('defines database secret with correct properties', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.Name).toBe('WebApp-Database-Credentials');
      expect(secret.Properties.Description).toBe(
        'Database credentials for web application'
      );
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe(
        'password'
      );
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(16);
    });
  });

  describe('RDS Database', () => {
    test('defines database subnet group', () => {
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.DBSubnetGroupName).toBe(
        'webapp-database-subnet-group'
      );
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(subnetGroup.Properties.SubnetIds[1].Ref).toBe('PrivateSubnet2');
    });

    test('RDS is multi-AZ, encrypted, and uses Secrets Manager dynamic refs', () => {
      const db = template.Resources.Database;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Snapshot');
      expect(db.UpdateReplacePolicy).toBe('Snapshot');
      expect(db.Properties.DBInstanceIdentifier).toBe('webapp-database');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.43');
      expect(db.Properties.AllocatedStorage).toBe(20);
      expect(db.Properties.StorageType).toBe('gp2');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
      expect(db.Properties.DeletionProtection).toBe(true);

      expect(db.Properties.MasterUsername['Fn::Sub']).toContain(
        'resolve:secretsmanager:'
      );
      expect(db.Properties.MasterUserPassword['Fn::Sub']).toContain(
        'resolve:secretsmanager:'
      );
    });
  });

  describe('Load Balancer', () => {
    test('ALB is configured with HTTPS listener and HTTP->HTTPS redirect', () => {
      const r = template.Resources;
      expect(r.ApplicationLoadBalancer).toBeDefined();
      expect(r.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(r.ApplicationLoadBalancer.Properties.Name).toBe('WebApp-ALB');
      expect(r.ApplicationLoadBalancer.Properties.Scheme).toBe(
        'internet-facing'
      );
      expect(r.ApplicationLoadBalancer.Properties.Type).toBe('application');
      expect(r.ApplicationLoadBalancer.Properties.Subnets).toHaveLength(2);
      expect(r.ApplicationLoadBalancer.Properties.SecurityGroups).toHaveLength(
        1
      );

      expect(r.ALBTargetGroup).toBeDefined();
      expect(r.ALBTargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
      expect(r.ALBTargetGroup.Properties.Name).toBe('WebApp-TargetGroup');
      expect(r.ALBTargetGroup.Properties.Port).toBe(80);
      expect(r.ALBTargetGroup.Properties.Protocol).toBe('HTTP');
      expect(r.ALBTargetGroup.Properties.VpcId.Ref).toBe('VPC');
      expect(r.ALBTargetGroup.Properties.HealthCheckPath).toBe('/');

      const https = r.ALBListener.Properties;
      expect(https.Port).toBe(443);
      expect(https.Protocol).toBe('HTTPS');
      expect(Array.isArray(https.Certificates)).toBe(true);

      const http = r.ALBListenerHTTP.Properties;
      expect(http.Port).toBe(80);
      expect(http.Protocol).toBe('HTTP');
      expect(http.DefaultActions[0].Type).toBe('redirect');
      expect(http.DefaultActions[0].RedirectConfig.Protocol).toBe('HTTPS');
      expect(http.DefaultActions[0].RedirectConfig.StatusCode).toBe('HTTP_301');
    });
  });

  describe('Launch Template and Auto Scaling', () => {
    test('defines launch template with correct properties', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateName).toBe('WebApp-LaunchTemplate');

      const data = lt.Properties.LaunchTemplateData;
      expect(data.ImageId).toContain(
        'resolve:ssm:/aws/service/ami-amazon-linux-latest'
      );
      expect(data.InstanceType).toBe('t3.micro');
      expect(data.IamInstanceProfile.Arn['Fn::GetAtt']).toBeDefined();
      expect(data.SecurityGroupIds).toHaveLength(1);
      expect(data.SecurityGroupIds[0].Ref).toBe('WebServerSecurityGroup');
      expect(data.UserData['Fn::Base64']).toContain('#!/bin/bash');
    });

    test('ASG has desired capacity range 2-5', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.AutoScalingGroupName).toBe('WebApp-ASG');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(5);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
      expect(asg.Properties.TargetGroupARNs).toHaveLength(1);
    });
  });

  describe('CloudWatch and Scaling', () => {
    test('defines CPU alarms and scaling policies', () => {
      expect(template.Resources.CPUAlarm).toBeDefined();
      expect(template.Resources.CPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.CPUAlarm.Properties.AlarmName).toBe(
        'WebApp-High-CPU-Usage'
      );
      expect(template.Resources.CPUAlarm.Properties.Threshold).toBe(70);
      expect(template.Resources.CPUAlarm.Properties.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );

      expect(template.Resources.CPUAlarmLow).toBeDefined();
      expect(template.Resources.CPUAlarmLow.Properties.AlarmName).toBe(
        'WebApp-Low-CPU-Usage'
      );
      expect(template.Resources.CPUAlarmLow.Properties.Threshold).toBe(25);
      expect(template.Resources.CPUAlarmLow.Properties.ComparisonOperator).toBe(
        'LessThanThreshold'
      );

      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(
        template.Resources.ScaleUpPolicy.Properties.ScalingAdjustment
      ).toBe(1);
      expect(
        template.Resources.ScaleDownPolicy.Properties.ScalingAdjustment
      ).toBe(-1);
    });
  });

  describe('S3 and Storage', () => {
    test('S3 bucket has versioning enabled', () => {
      const s3 = template.Resources.S3Bucket;
      expect(s3.Type).toBe('AWS::S3::Bucket');
      expect(s3.Properties.BucketName['Fn::Sub']).toContain(
        'webapp-static-content'
      );
      expect(s3.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(
        s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toHaveLength(1);
      expect(
        s3.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      expect(s3.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(
        true
      );
      expect(
        s3.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('outputs include the ALB DNS name', () => {
      const outputs = template.Outputs;
      expect(outputs.ApplicationLoadBalancerDNS).toBeDefined();
      expect(outputs.ApplicationLoadBalancerDNS.Description).toBe(
        'DNS name of the Application Load Balancer'
      );
      expect(
        outputs.ApplicationLoadBalancerDNS.Value['Fn::GetAtt']
      ).toBeDefined();
      expect(
        outputs.ApplicationLoadBalancerDNS.Export.Name['Fn::Sub']
      ).toContain('ALB-DNS');
    });

    test('outputs include VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Description).toBe('VPC ID');
      expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
    });

    test('outputs include database endpoint', () => {
      expect(template.Outputs.DatabaseEndpoint).toBeDefined();
      expect(template.Outputs.DatabaseEndpoint.Description).toBe(
        'RDS Database Endpoint'
      );
      expect(
        template.Outputs.DatabaseEndpoint.Value['Fn::GetAtt']
      ).toBeDefined();
    });

    test('outputs include S3 bucket name', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Description).toBe(
        'S3 Bucket Name for Static Content'
      );
      expect(template.Outputs.S3BucketName.Value.Ref).toBe('S3Bucket');
    });
  });

  describe('Resource Counts', () => {
    test('has correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources
    });

    test('has correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('has correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });
});
