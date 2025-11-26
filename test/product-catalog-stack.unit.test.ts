import * as fs from 'fs';
import * as path from 'path';

describe('Product Catalog CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have Description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(3);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(20);
    });

    test('should have VpcId parameter', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('AWS::EC2::VPC::Id');
    });

    test('should have PublicSubnetIds parameter', () => {
      expect(template.Parameters.PublicSubnetIds).toBeDefined();
      expect(template.Parameters.PublicSubnetIds.Type).toBe('List<AWS::EC2::Subnet::Id>');
    });

    test('should have PrivateSubnetIds parameter', () => {
      expect(template.Parameters.PrivateSubnetIds).toBeDefined();
      expect(template.Parameters.PrivateSubnetIds.Type).toBe('List<AWS::EC2::Subnet::Id>');
    });

    test('should have CertificateArn parameter', () => {
      expect(template.Parameters.CertificateArn).toBeDefined();
      expect(template.Parameters.CertificateArn.Type).toBe('String');
    });

    test('should have LatestAmiId parameter with default value', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(template.Parameters.LatestAmiId.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });
  });

  describe('Security Groups', () => {
    test('should have ALBSecurityGroup resource', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG).toBeDefined();
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALBSecurityGroup should allow HTTPS from internet', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const httpsIngress = albSG.Properties.SecurityGroupIngress.find(
        (rule: any) => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsIngress).toBeDefined();
      expect(httpsIngress.CidrIp).toBe('0.0.0.0/0');
      expect(httpsIngress.IpProtocol).toBe('tcp');
    });

    test('ALBSecurityGroup should have environmentSuffix in name', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG.Properties.GroupName).toHaveProperty('Fn::Sub');
      expect(albSG.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have InstanceSecurityGroup resource', () => {
      const instanceSG = template.Resources.InstanceSecurityGroup;
      expect(instanceSG).toBeDefined();
      expect(instanceSG.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('InstanceSecurityGroup should have environmentSuffix in name', () => {
      const instanceSG = template.Resources.InstanceSecurityGroup;
      expect(instanceSG.Properties.GroupName).toHaveProperty('Fn::Sub');
      expect(instanceSG.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('InstanceSecurityGroup should allow all outbound traffic', () => {
      const instanceSG = template.Resources.InstanceSecurityGroup;
      const egressRule = instanceSG.Properties.SecurityGroupEgress[0];
      expect(egressRule.IpProtocol).toBe('-1');
      expect(egressRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have ALBToInstanceEgress rule', () => {
      const egress = template.Resources.ALBToInstanceEgress;
      expect(egress).toBeDefined();
      expect(egress.Type).toBe('AWS::EC2::SecurityGroupEgress');
      expect(egress.Properties.FromPort).toBe(80);
      expect(egress.Properties.ToPort).toBe(80);
    });

    test('should have InstanceFromALBIngress rule', () => {
      const ingress = template.Resources.InstanceFromALBIngress;
      expect(ingress).toBeDefined();
      expect(ingress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingress.Properties.FromPort).toBe(80);
      expect(ingress.Properties.ToPort).toBe(80);
    });

    test('security groups should reference VpcId parameter', () => {
      expect(template.Resources.ALBSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VpcId' });
      expect(template.Resources.InstanceSecurityGroup.Properties.VpcId).toEqual({ Ref: 'VpcId' });
    });
  });

  describe('IAM Resources', () => {
    test('should have InstanceRole resource', () => {
      const role = template.Resources.InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('InstanceRole should have environmentSuffix in name', () => {
      const role = template.Resources.InstanceRole;
      expect(role.Properties.RoleName).toHaveProperty('Fn::Sub');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('InstanceRole should allow EC2 service to assume role', () => {
      const role = template.Resources.InstanceRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('InstanceRole should have CloudWatch Agent policy', () => {
      const role = template.Resources.InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('InstanceRole should have Parameter Store access policy', () => {
      const role = template.Resources.InstanceRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'ParameterStoreAccess');
      expect(policy).toBeDefined();
      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('ssm:GetParameter');
      expect(statement.Action).toContain('ssm:GetParameters');
      expect(statement.Action).toContain('ssm:GetParametersByPath');
    });

    test('InstanceRole should have CloudWatch Logs access policy', () => {
      const role = template.Resources.InstanceRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(policy).toBeDefined();
      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:CreateLogStream');
      expect(statement.Action).toContain('logs:PutLogEvents');
    });

    test('should have InstanceProfile resource', () => {
      const profile = template.Resources.InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('InstanceProfile should have environmentSuffix in name', () => {
      const profile = template.Resources.InstanceProfile;
      expect(profile.Properties.InstanceProfileName).toHaveProperty('Fn::Sub');
      expect(profile.Properties.InstanceProfileName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('InstanceProfile should reference InstanceRole', () => {
      const profile = template.Resources.InstanceProfile;
      expect(profile.Properties.Roles[0]).toEqual({ Ref: 'InstanceRole' });
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ApplicationLoadBalancer resource', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should have environmentSuffix in name', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Name).toHaveProperty('Fn::Sub');
      expect(alb.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be application type', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should use PublicSubnetIds parameter', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toEqual({ Ref: 'PublicSubnetIds' });
    });

    test('ALB should use ALBSecurityGroup', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups[0]).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('ALB should have proper tags', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const tags = alb.Properties.Tags;
      expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
      expect(tags.find((t: any) => t.Key === 'Application')).toBeDefined();
    });
  });

  describe('Target Group', () => {
    test('should have TargetGroup resource', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('TargetGroup should have environmentSuffix in name', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.Name).toHaveProperty('Fn::Sub');
      expect(tg.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('TargetGroup should use port 80 and HTTP protocol', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
    });

    test('TargetGroup should have health check path /api/v1/health', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckPath).toBe('/api/v1/health');
    });

    test('TargetGroup should have health check interval of 30 seconds', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });

    test('TargetGroup should have stickiness enabled', () => {
      const tg = template.Resources.TargetGroup;
      const stickinessAttr = tg.Properties.TargetGroupAttributes.find(
        (attr: any) => attr.Key === 'stickiness.enabled'
      );
      expect(stickinessAttr).toBeDefined();
      expect(stickinessAttr.Value).toBe('true');
    });

    test('TargetGroup should have deregistration delay of 30 seconds', () => {
      const tg = template.Resources.TargetGroup;
      const delayAttr = tg.Properties.TargetGroupAttributes.find(
        (attr: any) => attr.Key === 'deregistration_delay.timeout_seconds'
      );
      expect(delayAttr).toBeDefined();
      expect(delayAttr.Value).toBe('30');
    });
  });

  describe('ALB Listener', () => {
    test('should have ALBListener resource', () => {
      const listener = template.Resources.ALBListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('Listener should use port 443 and HTTPS protocol', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
    });

    test('Listener should reference CertificateArn parameter', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.Certificates[0].CertificateArn).toEqual({ Ref: 'CertificateArn' });
    });

    test('Listener should forward to TargetGroup', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  describe('Launch Template', () => {
    test('should have LaunchTemplate resource', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('LaunchTemplate should have environmentSuffix in name', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateName).toHaveProperty('Fn::Sub');
      expect(lt.Properties.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('LaunchTemplate should use LatestAmiId parameter', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
    });

    test('LaunchTemplate should use t3.medium instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.medium');
    });

    test('LaunchTemplate should require IMDSv2', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
    });

    test('LaunchTemplate should have UserData with health endpoint setup', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
      const userData = lt.Properties.LaunchTemplateData.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('/api/v1/health');
      expect(userData).toContain('httpd');
    });

    test('LaunchTemplate should reference InstanceProfile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toHaveProperty('Fn::GetAtt');
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn['Fn::GetAtt'][0]).toBe('InstanceProfile');
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have AutoScalingGroup resource', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('AutoScalingGroup should have environmentSuffix in name', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.AutoScalingGroupName).toHaveProperty('Fn::Sub');
      expect(asg.Properties.AutoScalingGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('AutoScalingGroup should have min size of 2', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
    });

    test('AutoScalingGroup should have max size of 8', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MaxSize).toBe(8);
    });

    test('AutoScalingGroup should have desired capacity of 2', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('AutoScalingGroup should use ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('AutoScalingGroup should have health check grace period of 300 seconds', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('AutoScalingGroup should use PrivateSubnetIds parameter', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toEqual({ Ref: 'PrivateSubnetIds' });
    });

    test('AutoScalingGroup should reference TargetGroup', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs[0]).toEqual({ Ref: 'TargetGroup' });
    });

    test('AutoScalingGroup should depend on ALBListener', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.DependsOn).toContain('ALBListener');
    });
  });

  describe('Auto Scaling Policy', () => {
    test('should have ScaleUpPolicy resource', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
    });

    test('ScaleUpPolicy should be target tracking type', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('ScaleUpPolicy should target 70% CPU utilization', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70.0);
    });

    test('ScaleUpPolicy should use ASGAverageCPUUtilization metric', () => {
      const policy = template.Resources.ScaleUpPolicy;
      expect(policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ASGAverageCPUUtilization');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have HighCPUAlarm resource', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('HighCPUAlarm should have environmentSuffix in name', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.AlarmName).toHaveProperty('Fn::Sub');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('HighCPUAlarm should monitor CPUUtilization', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
    });

    test('HighCPUAlarm should trigger at 70% threshold', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('HighCPUAlarm should evaluate for 2 periods of 300 seconds', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
    });

    test('should have LowCPUAlarm resource', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LowCPUAlarm should have environmentSuffix in name', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm.Properties.AlarmName).toHaveProperty('Fn::Sub');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('LowCPUAlarm should trigger at 30% threshold', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have LoadBalancerDNS output', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output).toBeDefined();
      expect(output.Value).toHaveProperty('Fn::GetAtt');
      expect(output.Value['Fn::GetAtt'][0]).toBe('ApplicationLoadBalancer');
      expect(output.Value['Fn::GetAtt'][1]).toBe('DNSName');
    });

    test('should have TargetGroupArn output', () => {
      const output = template.Outputs.TargetGroupArn;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'TargetGroup' });
    });

    test('should have AutoScalingGroupName output', () => {
      const output = template.Outputs.AutoScalingGroupName;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'AutoScalingGroup' });
    });

    test('should have InstanceSecurityGroupId output', () => {
      const output = template.Outputs.InstanceSecurityGroupId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'InstanceSecurityGroup' });
    });

    test('should have ALBSecurityGroupId output', () => {
      const output = template.Outputs.ALBSecurityGroupId;
      expect(output).toBeDefined();
      expect(output.Value).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('all outputs should have exports', () => {
      const outputs = ['LoadBalancerDNS', 'TargetGroupArn', 'AutoScalingGroupName', 'InstanceSecurityGroupId', 'ALBSecurityGroupId'];
      outputs.forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toHaveProperty('Fn::Sub');
      });
    });
  });

  describe('Resource Naming Convention', () => {
    const resourcesWithNames = [
      'ALBSecurityGroup',
      'InstanceSecurityGroup',
      'InstanceRole',
      'InstanceProfile',
      'ApplicationLoadBalancer',
      'TargetGroup',
      'LaunchTemplate',
      'AutoScalingGroup',
      'HighCPUAlarm',
      'LowCPUAlarm'
    ];

    resourcesWithNames.forEach(resourceName => {
      test(`${resourceName} should include environmentSuffix in its name`, () => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.GroupName ||
                           resource.Properties.RoleName ||
                           resource.Properties.InstanceProfileName ||
                           resource.Properties.Name ||
                           resource.Properties.LaunchTemplateName ||
                           resource.Properties.AutoScalingGroupName ||
                           resource.Properties.AlarmName;

        expect(nameProperty).toBeDefined();
        if (typeof nameProperty === 'object' && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });

  describe('Resource Tags', () => {
    const resourcesWithTags = [
      'ALBSecurityGroup',
      'InstanceSecurityGroup',
      'InstanceRole',
      'ApplicationLoadBalancer',
      'TargetGroup',
      'AutoScalingGroup'
    ];

    resourcesWithTags.forEach(resourceName => {
      test(`${resourceName} should have Environment tag`, () => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
      });

      test(`${resourceName} should have Application tag`, () => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const appTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Application');
        expect(appTag).toBeDefined();
      });
    });
  });

  describe('No Retain Policies', () => {
    test('no resources should have DeletionPolicy set to Retain', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('no resources should have UpdateReplacePolicy set to Retain', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Resource Count', () => {
    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(14); // Including the new security group rules
    });

    test('should have all required resource types', () => {
      const resourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::IAM::InstanceProfile');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::Listener');
      expect(resourceTypes).toContain('AWS::EC2::LaunchTemplate');
      expect(resourceTypes).toContain('AWS::AutoScaling::AutoScalingGroup');
      expect(resourceTypes).toContain('AWS::AutoScaling::ScalingPolicy');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
    });
  });
});
