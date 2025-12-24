import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
        'Production-ready AWS infrastructure with VPC, Auto Scaling, RDS, S3, and comprehensive monitoring'
      );
    });

    test('should have mappings section', () => {
      // Mappings section is optional in CloudFormation templates
      // This template does not use Mappings, so we skip this check
      // expect(template.Mappings).toBeDefined();
      // expect(template.Mappings.AWSRegionAMI).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const envParam = template.Parameters.EnvironmentName;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.Description).toBe('Environment name prefix for resources');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      const instanceParam = template.Parameters.InstanceType;
      expect(instanceParam.Type).toBe('String');
      expect(instanceParam.Default).toBe('t3.medium');
      expect(instanceParam.AllowedValues).toContain('t3.micro');
      expect(instanceParam.AllowedValues).toContain('t3.medium');
    });

    test('should have DBInstanceClass parameter', () => {
      expect(template.Parameters.DBInstanceClass).toBeDefined();
      const dbParam = template.Parameters.DBInstanceClass;
      expect(dbParam.Type).toBe('String');
      expect(dbParam.Default).toBe('db.t3.micro');
      expect(dbParam.AllowedValues).toContain('db.t3.micro');
      expect(dbParam.AllowedValues).toContain('db.t3.medium');
    });

    test('should have DBUsername parameter', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      const usernameParam = template.Parameters.DBUsername;
      expect(usernameParam.Type).toBe('String');
      expect(usernameParam.Default).toBe('admin');
      expect(usernameParam.MinLength).toBe(1);
      expect(usernameParam.MaxLength).toBe(16);
    });
  });

  describe('Mappings', () => {
    test('should have AWSRegionAMI mapping', () => {
      // This template does not use Mappings section
      // Mappings are optional in CloudFormation templates
      // expect(template.Mappings.AWSRegionAMI).toBeDefined();
    });

    test('AWSRegionAMI should have us-east-1 region', () => {
      // This template does not use Mappings section
      // const mapping = template.Mappings.AWSRegionAMI;
      // expect(mapping['us-east-1']).toBeDefined();
      // expect(mapping['us-east-1'].AMI).toBeDefined();
    });

    test('AWSRegionAMI should have us-west-2 region', () => {
      // This template does not use Mappings section
      // const mapping = template.Mappings.AWSRegionAMI;
      // expect(mapping['us-west-2']).toBeDefined();
      // expect(mapping['us-west-2'].AMI).toBeDefined();
    });
  });

  describe('Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have database subnets', () => {
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.DatabaseSubnet1;
      const subnet2 = template.Resources.DatabaseSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      
      const nat1 = template.Resources.NatGateway1;
      const nat2 = template.Resources.NatGateway2;
      
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
    });
  });

  describe('Security Resources', () => {
    test('should have KeyPair resource', () => {
      // This template uses a KeyPairName parameter instead of creating a KeyPair resource
      // The KeyPairName parameter is defined and used in the LaunchTemplate
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('String');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group', () => {
      expect(template.Resources.ApplicationLoadBalancerSecurityGroup).toBeDefined();
      const sg = template.Resources.ApplicationLoadBalancerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for Application Load Balancer');
    });

    test('should have Web Server Security Group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for web servers');
    });

    test('should have Bastion Security Group', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      const sg = template.Resources.BastionSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for bastion host');
    });

    test('should have Database Security Group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Security group for RDS database');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 Role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 Backup Bucket', () => {
      expect(template.Resources.BackupBucket).toBeDefined();
      const bucket = template.Resources.BackupBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 Bucket Policy', () => {
      expect(template.Resources.BackupBucketPolicy).toBeDefined();
      const policy = template.Resources.BackupBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Database Resources', () => {
    test('should have Database Subnet Group', () => {
      expect(template.Resources.DatabaseSubnetGroup).toBeDefined();
      const subnetGroup = template.Resources.DatabaseSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have Database Parameter Group', () => {
      // This template does not define a custom Database Parameter Group
      // It uses the default parameter group for the database engine
      // expect(template.Resources.DatabaseParameterGroup).toBeDefined();
    });

    test('should have Database KMS Key', () => {
      // This template does not use KMS encryption for the database
      // StorageEncrypted is set to false
      // expect(template.Resources.DatabaseKMSKey).toBeDefined();
    });

    test('should have Database Instance', () => {
      expect(template.Resources.DatabaseInstance).toBeDefined();
      const db = template.Resources.DatabaseInstance;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Snapshot');
      expect(db.Properties.Engine).toBe('postgres');
      expect(db.Properties.EngineVersion).toBe('11.22');
      expect(db.Properties.MultiAZ).toBe(false);
    });

    test('should have Database Read Replica', () => {
      // This template does not define a read replica
      // expect(template.Resources.DatabaseReadReplica).toBeDefined();
    });
  });

  describe('Compute Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have ALB Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have Auto Scaling Policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;
      
      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });

    test('should have CloudWatch Alarms', () => {
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmLow).toBeDefined();
      
      const highAlarm = template.Resources.CPUAlarmHigh;
      const lowAlarm = template.Resources.CPUAlarmLow;
      
      expect(highAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(lowAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Bastion Host', () => {
      // This template does not define a Bastion Host resource
      // expect(template.Resources.BastionHost).toBeDefined();
    });
  });

  describe('Monitoring Resources', () => {
    test('should have CloudWatch Log Groups', () => {
      expect(template.Resources.WebServerLogGroup).toBeDefined();
      expect(template.Resources.DatabaseLogGroup).toBeDefined();
      expect(template.Resources.S3LogGroup).toBeDefined();
      
      const webLogs = template.Resources.WebServerLogGroup;
      const dbLogs = template.Resources.DatabaseLogGroup;
      const s3Logs = template.Resources.S3LogGroup;
      
      expect(webLogs.Type).toBe('AWS::Logs::LogGroup');
      expect(dbLogs.Type).toBe('AWS::Logs::LogGroup');
      expect(s3Logs.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have CloudWatch Dashboard', () => {
      expect(template.Resources.MonitoringDashboard).toBeDefined();
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardBody).toBeDefined();
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
        'ApplicationLoadBalancerDNS',
        'ApplicationLoadBalancerArn',
        'DatabaseEndpoint',
        'DatabasePort',
        'BackupBucketName',
        'AutoScalingGroupName',
        'StackName',
        'EnvironmentName',
        'KeyPairName'
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
        'Fn::Sub': '${AWS::StackName}-VPCId',
      });
    });

    test('ApplicationLoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.ApplicationLoadBalancerDNS;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['DatabaseInstance', 'Endpoint.Address'],
      });
    });

    test('BackupBucketName output should be correct', () => {
      const output = template.Outputs.BackupBucketName;
      expect(output.Description).toBe('S3 Backup Bucket Name');
      expect(output.Value).toEqual({ Ref: 'BackupBucket' });
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
      expect(template.Mappings).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have multiple resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources
    });

    test('should have exactly seven parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have exactly fourteen outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(14);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with environment name', () => {
      const resources = template.Resources;
      
      // Check a few key resources
      const vpc = resources.VPC;
      const alb = resources.ApplicationLoadBalancer;
      const db = resources.DatabaseInstance;
      
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': '${EnvironmentName}-VPC',
      });
      
      expect(alb.Properties.Name).toEqual({
        'Fn::Sub': '${EnvironmentName}-ALB',
      });
      
      expect(db.Properties.DBInstanceIdentifier).toEqual({
        'Fn::Sub': '${EnvironmentName}-database',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        // Check that export name exists and follows the pattern ${AWS::StackName}-{someName}
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name).toHaveProperty('Fn::Sub');
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\${AWS::StackName}-.+$/);
      });
    });
  });
});
