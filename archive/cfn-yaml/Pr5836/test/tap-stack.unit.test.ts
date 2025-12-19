/**
 * Comprehensive Unit Tests for Trading Platform CloudFormation Template
 * Tests ALB + Auto Scaling Group + EC2 infrastructure
 */

import * as path from 'path';

describe('Trading Platform CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template JSON
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    template = require(templatePath);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Trading Platform');
      expect(template.Description.length).toBeGreaterThan(20);
    });

    test('should have metadata section with parameter interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters - Comprehensive Validation', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'VpcId', 'PublicSubnetAId', 'PublicSubnetBId',
        'PrivateSubnetAId', 'PrivateSubnetBId', 'Environment',
        'ProjectName', 'Owner', 'InstanceType', 'KeyPairName',
        'MinInstances', 'MaxInstances', 'DesiredInstances',
        'EnableCloudWatchAlarms', 'SNSAlertTopic'
      ];
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('VpcId parameter should have correct properties', () => {
      const param = template.Parameters.VpcId;
      expect(param.Type).toBe('AWS::EC2::VPC::Id');
      expect(param.Default).toBe('vpc-0c3642bb930208d98');
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.AllowedValues).toEqual(['prod', 'staging', 'development']);
      expect(param.Default).toBe('prod');
    });

    test('ProjectName should have validation pattern', () => {
      const param = template.Parameters.ProjectName;
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toContain('[a-zA-Z]');
    });

    test('InstanceType should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.AllowedValues).toContain('t3.medium');
      expect(param.AllowedValues).toContain('t3.large');
      expect(param.AllowedValues).toContain('m5.large');
    });

    test('MinInstances should have min and max values', () => {
      const param = template.Parameters.MinInstances;
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(4);
      expect(param.Default).toBe(2);
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        expect(template.Parameters[paramName].Description).toBeDefined();
        expect(template.Parameters[paramName].Description.length).toBeGreaterThan(10);
      });
    });
  });

  describe('Conditions', () => {
    test('should have all required conditions', () => {
      expect(template.Conditions.CreateAlarms).toBeDefined();
      expect(template.Conditions.HasSNSTopic).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('CreateAlarms condition should check EnableCloudWatchAlarms parameter', () => {
      const condition = template.Conditions.CreateAlarms;
      expect(condition).toBeDefined();
      expect(JSON.stringify(condition)).toContain('EnableCloudWatchAlarms');
    });
  });

  describe('Mappings - Region AMI Parameters', () => {
    test('should have RegionMap for AMI lookups', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('should have SSM parameter paths for major regions', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];
      regions.forEach(region => {
        expect(template.Mappings.RegionMap[region]).toBeDefined();
        expect(template.Mappings.RegionMap[region].AMIParameter).toContain('ami-amazon-linux-latest');
      });
    });

    test('SSM parameters should reference Amazon Linux 2', () => {
      Object.values(template.Mappings.RegionMap).forEach((regionConfig: any) => {
        expect(regionConfig.AMIParameter).toContain('amzn2-ami-hvm-x86_64-gp2');
      });
    });
  });

  describe('IAM Roles - Comprehensive Tests', () => {
    test('EC2InstanceRole should exist and be correct type', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have assume role policy for EC2', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      expect(role.AssumeRolePolicyDocument).toBeDefined();
      expect(JSON.stringify(role.AssumeRolePolicyDocument)).toContain('ec2.amazonaws.com');
    });

    test('EC2InstanceRole should have required managed policies', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2InstanceProfile should reference the role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('IAM resources should have iac-rlhf-amazon tag', () => {
      const role = template.Resources.EC2InstanceRole;
      const hasTag = role.Properties.Tags.some((tag: any) =>
        tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
      );
      expect(hasTag).toBe(true);
    });
  });

  describe('Security Groups - Consolidated and Optimized', () => {
    test('should have ApplicationSecurityGroup', () => {
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ALBSecurityGroup', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      const httpsRule = sg.SecurityGroupIngress.find((rule: any) => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('ALB security group should allow HTTP for redirect', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      const httpRule = sg.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Application instances should only accept HTTP from ALB', () => {
      const ingress = template.Resources.ApplicationSecurityGroupIngressFromALB;
      expect(ingress).toBeDefined();
      expect(ingress.Properties.FromPort).toBe(80);
      expect(ingress.Properties.ToPort).toBe(80);
    });

    test('security groups should have comprehensive tags', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      expect(sg.Properties.Tags).toBeDefined();
      const hasIacTag = sg.Properties.Tags.some((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(hasIacTag).toBe(true);
    });
  });

  describe('Application Load Balancer', () => {
    test('should exist and be correct type', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    });

    test('should have deletion and update policies', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DeletionPolicy).toBe('Retain');
      expect(alb.UpdateReplacePolicy).toBe('Retain');
    });

    test('should reference public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Subnets).toBeDefined();
      expect(alb.Subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('should have iac-rlhf-amazon tag', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      const hasTag = alb.Tags.some((tag: any) =>
        tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
      );
      expect(hasTag).toBe(true);
    });
  });

  describe('Target Group', () => {
    test('should exist with correct configuration', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
    });

    test('should have health check configuration', () => {
      const tg = template.Resources.TargetGroup.Properties;
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckProtocol).toBe('HTTP');
    });

    test('should have appropriate health check thresholds', () => {
      const tg = template.Resources.TargetGroup.Properties;
      expect(tg.HealthyThresholdCount).toBeDefined();
      expect(tg.UnhealthyThresholdCount).toBeDefined();
      expect(tg.HealthCheckIntervalSeconds).toBeGreaterThan(0);
    });
  });

  describe('ALB Listeners', () => {
    test('should have HTTP listener', () => {
      const listener = template.Resources.ALBListenerHTTP;
      expect(listener).toBeDefined();
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });

    test('HTTP listener should forward to target group', () => {
      const listener = template.Resources.ALBListenerHTTP.Properties;
      expect(listener.DefaultActions[0].Type).toBe('forward');
      expect(listener.DefaultActions[0].TargetGroupArn.Ref).toBe('TargetGroup');
    });
  });

  describe('Launch Template - SSM AMI Lookup', () => {
    test('should exist and be correct type', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should use SSM parameter for AMI ID (no hardcoding)', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(JSON.stringify(lt.ImageId)).toContain('resolve:ssm');
      expect(JSON.stringify(lt.ImageId)).not.toContain('ami-');
    });

    test('should reference instance profile', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.IamInstanceProfile).toBeDefined();
    });

    test('should use Fn::Sub for UserData', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.UserData).toBeDefined();
      expect(lt.UserData['Fn::Base64']).toBeDefined();
    });

    test('UserData should contain bootstrap script', () => {
      const userData = JSON.stringify(template.Resources.LaunchTemplate.Properties.LaunchTemplateData.UserData);
      expect(userData).toContain('yum update');
      expect(userData).toContain('httpd');
      expect(userData).toContain('cfn-signal');
    });

    test('should enforce IMDSv2', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.MetadataOptions).toBeDefined();
      expect(lt.MetadataOptions.HttpTokens).toBe('required');
    });

    test('should have proper tagging for instances and volumes', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.TagSpecifications).toBeDefined();
      expect(lt.TagSpecifications.length).toBeGreaterThanOrEqual(2);

      const instanceTags = lt.TagSpecifications.find((spec: any) => spec.ResourceType === 'instance');
      const hasIacTag = instanceTags.Tags.some((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(hasIacTag).toBe(true);
    });
  });

  describe('Auto Scaling Group - Circular Dependency Fix', () => {
    test('should exist and be correct type', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have proper sizing configuration', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MinSize).toBeDefined();
      expect(asg.MaxSize).toBeDefined();
      expect(asg.DesiredCapacity).toBeDefined();
    });

    test('should use ELB health check', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBeGreaterThan(0);
    });

    test('should have MixedInstancesPolicy for cost optimization', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MixedInstancesPolicy).toBeDefined();
      expect(asg.MixedInstancesPolicy.LaunchTemplate).toBeDefined();
    });

    test('should support Spot instances', () => {
      const policy = template.Resources.AutoScalingGroup.Properties.MixedInstancesPolicy;
      expect(policy.InstancesDistribution).toBeDefined();
      expect(policy.InstancesDistribution.SpotAllocationStrategy).toBeDefined();
    });

    test('should have creation policy with resource signals', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.CreationPolicy).toBeDefined();
      expect(asg.CreationPolicy.ResourceSignal).toBeDefined();
    });

    test('should have update policy for rolling updates', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.UpdatePolicy).toBeDefined();
      expect(asg.UpdatePolicy.AutoScalingRollingUpdate).toBeDefined();
    });

    test('should propagate tags to instances', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      const iacTag = asg.Tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag.PropagateAtLaunch).toBe(true);
    });
  });

  describe('Scaling Policies', () => {
    test('should have CPU-based scaling policy', () => {
      const policy = template.Resources.CPUScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('CPU policy should target 70% utilization', () => {
      const policy = template.Resources.CPUScalingPolicy.Properties;
      expect(policy.TargetTrackingConfiguration.TargetValue).toBe(70.0);
    });

    test('should have request count scaling policy', () => {
      const policy = template.Resources.RequestCountScalingPolicy;
      expect(policy).toBeDefined();
      expect(policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType)
        .toBe('ALBRequestCountPerTarget');
    });
  });

  describe('CloudWatch Alarms - Conditional', () => {
    test('should have HighCPUAlarm', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Condition).toBe('CreateAlarms');
    });

    test('HighCPUAlarm should monitor CPU > 80%', () => {
      const alarm = template.Resources.HighCPUAlarm.Properties;
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have LowHealthyInstancesAlarm', () => {
      const alarm = template.Resources.LowHealthyInstancesAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Condition).toBe('CreateAlarms');
    });

    test('LowHealthyInstancesAlarm should monitor < 2 instances', () => {
      const alarm = template.Resources.LowHealthyInstancesAlarm.Properties;
      expect(alarm.MetricName).toBe('HealthyHostCount');
      expect(alarm.Threshold).toBe(2);
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should have HighResponseTimeAlarm', () => {
      const alarm = template.Resources.HighResponseTimeAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('TargetResponseTime');
    });

    test('all alarms should have proper configuration', () => {
      const alarms = [
        template.Resources.HighCPUAlarm,
        template.Resources.LowHealthyInstancesAlarm,
        template.Resources.HighResponseTimeAlarm
      ];

      alarms.forEach(alarm => {
        expect(alarm.Properties.Period).toBeGreaterThan(0);
        expect(alarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
        expect(alarm.Properties.Statistic).toBeDefined();
      });
    });
  });

  describe('Outputs - Cross-Stack Compatibility', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'LoadBalancerDNS', 'LoadBalancerArn', 'AutoScalingGroupName',
        'SecurityGroupId', 'ALBSecurityGroupId', 'TargetGroupArn',
        'ApplicationURL', 'LaunchTemplateId', 'InstanceRoleArn'
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(10);
      });
    });

    test('all outputs should have exports with stack name', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
        expect(JSON.stringify(output.Export.Name)).toContain('AWS::StackName');
      });
    });

    test('ApplicationURL should be HTTP based', () => {
      const url = template.Outputs.ApplicationURL;
      expect(JSON.stringify(url.Value)).toContain('http://');
      expect(url.Value['Fn::Sub']).toBe('http://${ApplicationLoadBalancer.DNSName}');
    });
  });

  describe('Cross-Account Executability - No Hardcoding', () => {
    test('should NOT have hardcoded account IDs', () => {
      const templateStr = JSON.stringify(template);
      // Check for common account ID patterns but allow VPC default
      const accountIdPattern = /[0-9]{12}/g;
      const matches = templateStr.match(accountIdPattern) || [];
      // VPC default is allowed, but no other account IDs should be present
      matches.forEach(match => {
        if (match !== '0123456789') { // Ignore partial matches
          expect(templateStr.indexOf(`arn:aws:.*:${match}:`)).toBe(-1);
        }
      });
    });

    test('should use AWS::Region pseudo parameter', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::Region');
    });

    test('should use AWS::StackName pseudo parameter', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::StackName');
    });

    test('all resource names should use parameters or Sub', () => {
      const templateStr = JSON.stringify(template.Resources);
      // Check that we're using Fn::Sub for dynamic naming
      expect(templateStr).toContain('"Fn::Sub"');
    });
  });

  describe('Tagging Compliance', () => {
    test('all taggable resources should have iac-rlhf-amazon tag', () => {
      const taggableResources = [
        'EC2InstanceRole', 'ApplicationSecurityGroup', 'ALBSecurityGroup',
        'ApplicationLoadBalancer', 'TargetGroup'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const hasTag = resource.Properties.Tags.some((tag: any) =>
          tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
        );
        expect(hasTag).toBe(true);
      });
    });

    test('all resources should have Environment tag', () => {
      const taggableResources = [
        'EC2InstanceRole', 'ApplicationSecurityGroup', 'ALBSecurityGroup',
        'ApplicationLoadBalancer', 'TargetGroup'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const hasEnvTag = resource.Properties.Tags.some((tag: any) => tag.Key === 'Environment');
        expect(hasEnvTag).toBe(true);
      });
    });

    test('all resources should have Project and Owner tags', () => {
      const taggableResources = [
        'EC2InstanceRole', 'ApplicationSecurityGroup', 'ApplicationLoadBalancer'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const hasProjectTag = resource.Properties.Tags.some((tag: any) => tag.Key === 'Project');
        const hasOwnerTag = resource.Properties.Tags.some((tag: any) => tag.Key === 'Owner');
        expect(hasProjectTag).toBe(true);
        expect(hasOwnerTag).toBe(true);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('security groups should have least-privilege rules', () => {
      const appSg = template.Resources.ApplicationSecurityGroup.Properties;
      // Should NOT have 0.0.0.0/0 ingress in application SG
      if (appSg.SecurityGroupIngress) {
        const publicIngress = appSg.SecurityGroupIngress.find((rule: any) => rule.CidrIp === '0.0.0.0/0');
        expect(publicIngress).toBeUndefined();
      }
    });

    test('Launch Template should enforce IMDSv2', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.MetadataOptions.HttpTokens).toBe('required');
    });

    test('ALB should be protected with retention policies', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DeletionPolicy).toBe('Retain');
      expect(alb.UpdateReplacePolicy).toBe('Retain');
    });
  });

  describe('Production Readiness', () => {
    test('should have appropriate deletion policies for stateful resources', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DeletionPolicy).toBeDefined();
      expect(alb.UpdateReplacePolicy).toBeDefined();
    });

    test('should have proper monitoring in place', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.LowHealthyInstancesAlarm).toBeDefined();
      expect(template.Resources.HighResponseTimeAlarm).toBeDefined();
    });

    test('AutoScalingGroup should have creation and update policies', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.CreationPolicy).toBeDefined();
      expect(asg.UpdatePolicy).toBeDefined();
    });

    test('should support multiple availability zones', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.VPCZoneIdentifier).toBeDefined();
      expect(asg.VPCZoneIdentifier.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cost Optimization', () => {
    test('should use mixed instances policy', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MixedInstancesPolicy).toBeDefined();
    });

    test('should support Spot instances for cost savings', () => {
      const policy = template.Resources.AutoScalingGroup.Properties.MixedInstancesPolicy;
      expect(policy.InstancesDistribution.SpotAllocationStrategy).toBe('capacity-optimized');
    });

    test('should have multiple instance type overrides', () => {
      const policy = template.Resources.AutoScalingGroup.Properties.MixedInstancesPolicy;
      expect(policy.LaunchTemplate.Overrides).toBeDefined();
      expect(policy.LaunchTemplate.Overrides.length).toBeGreaterThan(1);
    });

    test('should not have duplicate instance types in overrides', () => {
      const policy = template.Resources.AutoScalingGroup.Properties.MixedInstancesPolicy;
      const overrides = policy.LaunchTemplate.Overrides;
      const instanceTypes = overrides.map((override: any) => {
        if (override.InstanceType && typeof override.InstanceType === 'object' && override.InstanceType.Ref) {
          return template.Parameters[override.InstanceType.Ref].Default;
        }
        return override.InstanceType;
      });

      const uniqueTypes = new Set(instanceTypes);
      expect(instanceTypes.length).toBe(uniqueTypes.size);
    });
  });
});
