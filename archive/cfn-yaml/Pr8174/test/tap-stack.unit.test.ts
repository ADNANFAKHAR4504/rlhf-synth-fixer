import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Web Application Infrastructure', () => {
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
        'High-availability web application infrastructure with ALB, VPC, and RDS'
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
    const expectedParameters = [
      'DBMasterPassword',
      'DBInstanceType',
      'EC2InstanceType',
      'MinSize',
      'MaxSize',
      'DesiredCapacity',
      'Environment',
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('DBMasterPassword parameter should have correct properties', () => {
      const param = template.Parameters.DBMasterPassword;
      expect(param.Type).toBe('String');
      expect(param.NoEcho).toBe(true);
      expect(param.MinLength).toBe(8);
      expect(param.MaxLength).toBe(128);
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toContain('dev');
      expect(param.AllowedValues).toContain('staging');
      expect(param.AllowedValues).toContain('prod');
    });

    test('Scaling parameters should have valid constraints', () => {
      const minSize = template.Parameters.MinSize;
      const maxSize = template.Parameters.MaxSize;
      const desiredCapacity = template.Parameters.DesiredCapacity;

      expect(minSize.MinValue).toBe(1);
      expect(minSize.MaxValue).toBe(10);
      expect(maxSize.MinValue).toBe(1);
      expect(maxSize.MaxValue).toBe(20);
      expect(desiredCapacity.MinValue).toBe(1);
      expect(desiredCapacity.MaxValue).toBe(10);
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap for AMI IDs', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1'].AMI).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway and attachment', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.IGWAttachment;

      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'InternetGateway',
      });
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('should have public subnets in different AZs', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(publicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(publicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in different AZs', () => {
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(privateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(privateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });

    test('should have NAT Gateway with EIP', () => {
      const natEip = template.Resources.NATGatewayEIP1;
      const natGateway = template.Resources.NATGateway1;

      expect(natEip.Type).toBe('AWS::EC2::EIP');
      expect(natEip.Properties.Domain).toBe('vpc');
      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NATGatewayEIP1', 'AllocationId'],
      });
    });

    test('should have route tables and routes configured', () => {
      const publicRouteTable = template.Resources.PublicRouteTable;
      const privateRouteTable = template.Resources.PrivateRouteTable;
      const publicRoute = template.Resources.PublicRoute;
      const natRoute = template.Resources.NATRoute;

      expect(publicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(natRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with correct ingress rules', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = albSg.Properties.SecurityGroupIngress;
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group with ALB-only access', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      expect(ec2Sg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = ec2Sg.Properties.SecurityGroupIngress;
      expect(
        ingressRules.every((rule: any) => rule.SourceSecurityGroupId)
      ).toBe(true);
    });

    test('should have RDS security group with EC2-only access', () => {
      const rdsSg = template.Resources.RDSSecurityGroup;
      expect(rdsSg.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = rdsSg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(3306);
      expect(ingressRules[0].ToPort).toBe(3306);
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({
        Ref: 'EC2SecurityGroup',
      });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer with correct configuration', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
      ]);
    });

    test('should have Target Group with health check configuration', () => {
      const targetGroup = template.Resources.WebAppTargetGroup;
      expect(targetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(targetGroup.Properties.Port).toBe(80);
      expect(targetGroup.Properties.Protocol).toBe('HTTP');
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.Properties.HealthyThresholdCount).toBe(2);
      expect(targetGroup.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB Listener configured', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('RDS Resources', () => {
    test('should have RDS Subnet Group', () => {
      const subnetGroup = template.Resources.RDSSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });

    test('should have RDS instance with proper configuration', () => {
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(rdsInstance.Properties.Engine).toBe('mysql');
      expect(rdsInstance.Properties.EngineVersion).toBe('8.0.41');
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
      expect(rdsInstance.Properties.MultiAZ).toBe(true);
      expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
      expect(rdsInstance.Properties.BackupRetentionPeriod).toBe(7);
      expect(rdsInstance.DeletionPolicy).toBe('Snapshot');
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role with proper policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
      expect(role.Properties.Policies).toHaveLength(1);
    });

    test('should have instance profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have Launch Template with proper configuration', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toEqual({
        'Fn::FindInMap': ['RegionMap', { Ref: 'AWS::Region' }, 'AMI'],
      });
      expect(
        launchTemplate.Properties.LaunchTemplateData.UserData
      ).toBeDefined();
    });

    test('should have Auto Scaling Group with proper configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('should have scaling policies', () => {
      const scaleUpPolicy = template.Resources.ScaleUpPolicy;
      const scaleDownPolicy = template.Resources.ScaleDownPolicy;

      expect(scaleUpPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDownPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleUpPolicy.Properties.ScalingAdjustment).toBe(1);
      expect(scaleDownPolicy.Properties.ScalingAdjustment).toBe(-1);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have high CPU alarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.AlarmActions).toEqual([{ Ref: 'ScaleUpPolicy' }]);
    });

    test('should have low CPU alarm', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(25);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Properties.AlarmActions).toEqual([
        { Ref: 'ScaleDownPolicy' },
      ]);
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'ALBDNSName',
      'ALBHostedZoneID',
      'RDSEndpoint',
      'RDSPort',
      'EC2InstanceSecurityGroupId',
      'EC2InstanceRoleArn',
      'EC2InstanceProfileArn',
      'AutoScalingGroupName',
      'LaunchTemplateId',
      'ALBSecurityGroupId',
      'RDSSecurityGroupId',
      'WebAppTargetGroupArn',
      'NATGatewayId',
      'InternetGatewayId',
      'RDSSubnetGroupName',
      'ScaleUpPolicyArn',
      'ScaleDownPolicyArn',
      'HighCPUAlarmArn',
      'LowCPUAlarmArn',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('VPC output should reference VPC resource', () => {
      const output = template.Outputs.VPCId;
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });

    test('ALB DNS output should reference ALB DNSName attribute', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('RDS endpoint output should reference RDS endpoint attribute', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'],
      });
    });
  });

  describe('Resource Dependencies and References', () => {
    test('NAT Gateway should depend on IGW attachment', () => {
      const natEip = template.Resources.NATGatewayEIP1;
      expect(natEip.DependsOn).toBe('IGWAttachment');
    });

    test('Public route should depend on IGW attachment', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute.DependsOn).toBe('IGWAttachment');
    });

    test('Security groups should reference each other correctly', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      const rdsSg = template.Resources.RDSSecurityGroup;

      const ec2HttpRule = ec2Sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      expect(ec2HttpRule.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });

      const rdsMysqlRule = rdsSg.Properties.SecurityGroupIngress[0];
      expect(rdsMysqlRule.SourceSecurityGroupId).toEqual({
        Ref: 'EC2SecurityGroup',
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

    test('should have proper resource count for high-availability infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Comprehensive infrastructure
    });

    test('should have proper output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(24); // All infrastructure outputs
    });
  });

  describe('Naming Conventions', () => {
    test('resources should use environment-based naming', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': '${Environment}-webapp-vpc',
      });
    });

    test('export names should follow consistent pattern', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${Environment}-');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('RDS should have encryption enabled', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('EC2 instances should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });

    test('Database password should be marked as NoEcho', () => {
      const param = template.Parameters.DBMasterPassword;
      expect(param.NoEcho).toBe(true);
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy across multiple availability zones', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;

      expect(publicSubnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(publicSubnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });
    });

    test('RDS should be configured for Multi-AZ', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.MultiAZ).toBe(true);
    });

    test('Auto Scaling Group should span multiple subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toHaveLength(2);
    });
  });
});
