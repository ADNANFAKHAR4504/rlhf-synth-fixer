import * as fs from 'fs';
import * as path from 'path';

describe('Highly Available Web Application CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(50);
      expect(template.Description).toContain('Highly available');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have AppName parameter', () => {
      const param = template.Parameters.AppName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('WebApp');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have Environment parameter', () => {
      const param = template.Parameters.Environment;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have VpcCidr parameter', () => {
      const param = template.Parameters.VpcCidr;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have InstanceType parameter', () => {
      const param = template.Parameters.InstanceType;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.micro');
      expect(param.AllowedValues).toContain('t3.micro');
    });

    test('should have database username parameter', () => {
      const username = template.Parameters.DBMasterUsername;

      expect(username).toBeDefined();
      expect(username.Type).toBe('String');
      expect(username.Default).toBe('admin');
    });

    test('should have database password secret instead of parameter', () => {
      const secret = template.Resources.DatabasePasswordSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
    });

    test('should have tag parameters', () => {
      const project = template.Parameters.ProjectTag;
      const owner = template.Parameters.OwnerTag;

      expect(project).toBeDefined();
      expect(project.Default).toBe('HighAvailabilityWebApp');

      expect(owner).toBeDefined();
      expect(owner.Default).toBe('DevOpsTeam');
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');

      expect(subnet2).toBeDefined();
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap with valid AMI IDs', () => {
      const regionMap = template.Mappings.RegionMap;
      expect(regionMap).toBeDefined();
      expect(regionMap['us-east-1']).toBeDefined();
      expect(regionMap['us-west-2']).toBeDefined();
      expect(regionMap['us-east-1'].AMI).toMatch(/^ami-[a-f0-9]{17}$/);
      expect(regionMap['us-west-2'].AMI).toMatch(/^ami-[a-f0-9]{17}$/);
    });
  });

  describe('Security Groups', () => {
    test('should have WebServerSecurityGroup', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress.length).toBe(2);

      // Check HTTP from ALB
      const httpRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toBeDefined();

      // Check SSH from VPC
      const sshRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 22
      );
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('10.0.0.0/8');
    });

    test('should have LoadBalancerSecurityGroup', () => {
      const sg = template.Resources.LoadBalancerSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress.length).toBe(2);

      // Check HTTP and HTTPS from internet
      const httpRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      const httpsRule = sg.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have DatabaseSecurityGroup', () => {
      const sg = template.Resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress.length).toBe(1);

      // Check MySQL from web servers
      const mysqlRule = sg.Properties.SecurityGroupIngress[0];
      expect(mysqlRule.FromPort).toBe(3306);
      expect(mysqlRule.ToPort).toBe(3306);
      expect(mysqlRule.SourceSecurityGroupId).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have WebServerRole', () => {
      const role = template.Resources.WebServerRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('should have WebServerInstanceProfile', () => {
      const profile = template.Resources.WebServerInstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toBeDefined();
    });
  });

  describe('Launch Template', () => {
    test('should have WebServerLaunchTemplate', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData).toBeDefined();

      const data = lt.Properties.LaunchTemplateData;
      expect(data.ImageId).toBeDefined();
      expect(data.ImageId['Fn::FindInMap']).toBeDefined();
      expect(data.InstanceType).toBeDefined();
      expect(data.IamInstanceProfile).toBeDefined();
      expect(data.SecurityGroupIds).toBeDefined();
      expect(data.UserData).toBeDefined();
    });

    test('should have proper UserData script', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      const userData = lt.Properties.LaunchTemplateData.UserData;
      expect(userData['Fn::Base64']).toBeDefined();

      const script = userData['Fn::Base64']['Fn::Sub'];
      expect(script).toContain('yum update -y');
      expect(script).toContain('yum install -y httpd');
      expect(script).toContain('systemctl start httpd');
      expect(script).toContain('Hello World from ${AppName}');
    });

    test('should have proper tag specifications', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      const tagSpecs = lt.Properties.LaunchTemplateData.TagSpecifications;
      expect(tagSpecs).toBeDefined();
      expect(tagSpecs.length).toBe(1);
      expect(tagSpecs[0].ResourceType).toBe('instance');
      expect(tagSpecs[0].Tags).toBeDefined();
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have ApplicationLoadBalancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.SecurityGroups).toBeDefined();
      expect(alb.Properties.Subnets).toBeDefined();
    });

    test('should have WebServerTargetGroup', () => {
      const tg = template.Resources.WebServerTargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('should have LoadBalancerListener', () => {
      const listener = template.Resources.LoadBalancerListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions).toBeDefined();
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have AutoScalingGroup', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(4);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.LaunchTemplate).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asg.Properties.TargetGroupARNs).toBeDefined();
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('should have scaling policies', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;

      expect(scaleUp).toBeDefined();
      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleUp.Properties.AdjustmentType).toBe('ChangeInCapacity');

      expect(scaleDown).toBeDefined();
      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
      expect(scaleDown.Properties.AdjustmentType).toBe('ChangeInCapacity');
    });

    test('should have update policy', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.UpdatePolicy).toBeDefined();
      expect(asg.UpdatePolicy.AutoScalingRollingUpdate).toBeDefined();
      expect(
        asg.UpdatePolicy.AutoScalingRollingUpdate.MinInstancesInService
      ).toBe(1);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have HighCPUAlarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.AlarmActions).toBeDefined();
    });

    test('should have LowCPUAlarm', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Properties.AlarmActions).toBeDefined();
    });

    test('should link alarms to scaling policies', () => {
      const highCPU = template.Resources.HighCPUAlarm;
      const lowCPU = template.Resources.LowCPUAlarm;

      expect(highCPU.Properties.AlarmActions).toContainEqual({
        Ref: 'ScaleUpPolicy',
      });
      expect(lowCPU.Properties.AlarmActions).toContainEqual({
        Ref: 'ScaleDownPolicy',
      });
    });
  });

  describe('Database Resources', () => {
    test('should have DBSubnetGroup', () => {
      const dbsg = template.Resources.DBSubnetGroup;
      expect(dbsg).toBeDefined();
      expect(dbsg.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(dbsg.Properties.SubnetIds).toBeDefined();
    });

    test('should have DatabaseInstance', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(db.Properties.AllocatedStorage).toBe(20);
      expect(db.Properties.StorageType).toBe('gp2');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.BackupRetentionPeriod).toBe(7);
    });
  });

  describe('Naming Convention', () => {
    test('should follow AppName-Environment-ResourceType naming', () => {
      const resources = [
        'WebServerSecurityGroup',
        'LoadBalancerSecurityGroup',
        'DatabaseSecurityGroup',
        'ApplicationLoadBalancer',
        'WebServerTargetGroup',
        'AutoScalingGroup',
      ];

      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (
          resource.Properties.Name ||
          resource.Properties.GroupName ||
          resource.Properties.AutoScalingGroupName
        ) {
          const name =
            resource.Properties.Name ||
            resource.Properties.GroupName ||
            resource.Properties.AutoScalingGroupName;
          expect(name['Fn::Sub']).toContain('${AppName}-${Environment}');
        }
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should have Project and Owner tags on all resources', () => {
      const taggedResources = [
        'WebServerSecurityGroup',
        'LoadBalancerSecurityGroup',
        'DatabaseSecurityGroup',
        'WebServerRole',
        'ApplicationLoadBalancer',
        'WebServerTargetGroup',
        'DBSubnetGroup',
        'DatabaseInstance',
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const projectTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Project'
        );
        const ownerTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Owner'
        );

        expect(projectTag).toBeDefined();
        expect(ownerTag).toBeDefined();
      });
    });

    test('should have proper tag propagation in Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.Tags).toBeDefined();

      asg.Properties.Tags.forEach((tag: any) => {
        expect(tag.PropagateAtLaunch).toBe(true);
      });
    });
  });

  describe('High Availability Features', () => {
    test('should deploy across multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();

      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();

      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.MultiAZ).toBe(true);
    });

    test('should have minimum 2 instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Security Best Practices', () => {
    test('should have encrypted database storage', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('should have proper security group isolation', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const dbSG = template.Resources.DatabaseSecurityGroup;

      // Web servers should only accept traffic from ALB
      const webHttpRule = webSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 80
      );
      expect(webHttpRule.SourceSecurityGroupId).toBeDefined();

      // Database should only accept traffic from web servers
      const dbRule = dbSG.Properties.SecurityGroupIngress[0];
      expect(dbRule.SourceSecurityGroupId).toBeDefined();
    });

    test('should have IAM role for EC2 instances', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'LoadBalancerDNSName',
        'LoadBalancerURL',
        'DatabaseEndpoint',
        'DatabasePort',
        'AutoScalingGroupName',
        'WebServerSecurityGroupId',
        'DatabaseSecurityGroupId',
        'HighCPUAlarmName',
        'LowCPUAlarmName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should export key resource identifiers', () => {
      const albDNS = template.Outputs.LoadBalancerDNSName;
      expect(albDNS.Value['Fn::GetAtt']).toEqual([
        'ApplicationLoadBalancer',
        'DNSName',
      ]);

      const dbEndpoint = template.Outputs.DatabaseEndpoint;
      expect(dbEndpoint.Value['Fn::GetAtt']).toEqual([
        'DatabaseInstance',
        'Endpoint.Address',
      ]);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(28); // All required resources including VPC infrastructure
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8); // All configuration parameters including DBMasterPassword
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(10); // All key outputs including DatabaseIdentifier
    });
  });
});
