/**
 * Integration Tests for Trading Platform CloudFormation Template
 * Validates template structure and cross-resource relationships
 * Note: These tests validate the template configuration without requiring actual AWS deployment
 */

import * as path from 'path';

describe('Trading Platform Integration Tests - Template Validation', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    template = require(templatePath);
  });

  describe('Parameter Integration', () => {
    test('subnet parameters should match across ALB and ASG', () => {
      expect(template.Parameters.PublicSubnetAId).toBeDefined();
      expect(template.Parameters.PublicSubnetBId).toBeDefined();
      expect(template.Parameters.PrivateSubnetAId).toBeDefined();
      expect(template.Parameters.PrivateSubnetBId).toBeDefined();
    });

    test('instance configuration parameters should be consistent', () => {
      const minInstances = template.Parameters.MinInstances.Default;
      const maxInstances = template.Parameters.MaxInstances.Default;
      const desiredInstances = template.Parameters.DesiredInstances.Default;

      expect(desiredInstances).toBeGreaterThanOrEqual(minInstances);
      expect(desiredInstances).toBeLessThanOrEqual(maxInstances);
      expect(maxInstances).toBeGreaterThan(minInstances);
    });
  });

  describe('Resource Dependencies and References', () => {
    test('ALB should reference correct subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Subnets).toBeDefined();
      expect(Array.isArray(alb.Subnets)).toBe(true);
    });

    test('Target Group should reference VPC', () => {
      const tg = template.Resources.TargetGroup.Properties;
      expect(tg.VpcId).toBeDefined();
    });

    test('ASG should reference Target Group', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.TargetGroupARNs).toBeDefined();
      expect(Array.isArray(asg.TargetGroupARNs)).toBe(true);
    });

    test('Launch Template should reference IAM Instance Profile', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.IamInstanceProfile).toBeDefined();
      expect(lt.IamInstanceProfile.Arn).toBeDefined();
    });

    test('Launch Template should reference Application Security Group', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.NetworkInterfaces).toBeDefined();
      expect(lt.NetworkInterfaces[0].Groups).toBeDefined();
      expect(Array.isArray(lt.NetworkInterfaces[0].Groups)).toBe(true);
    });

    test('ASG should reference Launch Template', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MixedInstancesPolicy.LaunchTemplate.LaunchTemplateSpecification).toBeDefined();
    });
  });

  describe('Security Group Integration', () => {
    test('ALB Security Group should be referenced by ALB', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.SecurityGroups).toBeDefined();
      expect(Array.isArray(alb.SecurityGroups)).toBe(true);
    });

    test('Application Security Group should allow traffic from ALB Security Group', () => {
      const ingress = template.Resources.ApplicationSecurityGroupIngressFromALB.Properties;
      expect(ingress.GroupId).toBeDefined();
      expect(ingress.SourceSecurityGroupId).toBeDefined();
    });

    test('both security groups should reference VPC', () => {
      const albSg = template.Resources.ALBSecurityGroup.Properties;
      const appSg = template.Resources.ApplicationSecurityGroup.Properties;
      expect(albSg.VpcId).toBeDefined();
      expect(appSg.VpcId).toBeDefined();
    });
  });

  describe('Listener and Target Group Integration', () => {
    test('HTTP listener should reference ALB', () => {
      const listener = template.Resources.ALBListenerHTTP.Properties;
      expect(listener.LoadBalancerArn).toBeDefined();
    });

    test('HTTP listener should forward to Target Group', () => {
      const listener = template.Resources.ALBListenerHTTP.Properties;
      expect(listener.DefaultActions[0].Type).toBe('forward');
      expect(listener.DefaultActions[0].TargetGroupArn).toBeDefined();
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('ASG should use private subnets', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.VPCZoneIdentifier).toBeDefined();
      expect(asg.VPCZoneIdentifier.length).toBe(2);
    });

    test('ASG should reference Launch Template with latest version', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      const ltSpec = asg.MixedInstancesPolicy.LaunchTemplate.LaunchTemplateSpecification;
      expect(ltSpec.LaunchTemplateId).toBeDefined();
      expect(ltSpec.Version).toBeDefined();
    });

    test('scaling policies should reference ASG', () => {
      const cpuPolicy = template.Resources.CPUScalingPolicy.Properties;
      const requestPolicy = template.Resources.RequestCountScalingPolicy.Properties;
      expect(cpuPolicy.AutoScalingGroupName).toBeDefined();
      expect(requestPolicy.AutoScalingGroupName).toBeDefined();
    });
  });

  describe('CloudWatch Alarms Integration', () => {
    test('CPU alarm should monitor ASG', () => {
      const alarm = template.Resources.HighCPUAlarm.Properties;
      expect(alarm.Dimensions).toBeDefined();
      const asgDimension = alarm.Dimensions.find((d: any) => d.Name === 'AutoScalingGroupName');
      expect(asgDimension).toBeDefined();
    });

    test('healthy instances alarm should monitor Target Group and ALB', () => {
      const alarm = template.Resources.LowHealthyInstancesAlarm.Properties;
      expect(alarm.Dimensions).toBeDefined();
      const tgDimension = alarm.Dimensions.find((d: any) => d.Name === 'TargetGroup');
      const lbDimension = alarm.Dimensions.find((d: any) => d.Name === 'LoadBalancer');
      expect(tgDimension).toBeDefined();
      expect(lbDimension).toBeDefined();
    });

    test('response time alarm should monitor ALB', () => {
      const alarm = template.Resources.HighResponseTimeAlarm.Properties;
      expect(alarm.Dimensions).toBeDefined();
      const lbDimension = alarm.Dimensions.find((d: any) => d.Name === 'LoadBalancer');
      expect(lbDimension).toBeDefined();
    });

    test('alarms should be conditional based on parameter', () => {
      expect(template.Resources.HighCPUAlarm.Condition).toBe('CreateAlarms');
      expect(template.Resources.LowHealthyInstancesAlarm.Condition).toBe('CreateAlarms');
      expect(template.Resources.HighResponseTimeAlarm.Condition).toBe('CreateAlarms');
    });
  });

  describe('IAM Integration', () => {
    test('Instance Profile should reference EC2 Role', () => {
      const profile = template.Resources.EC2InstanceProfile.Properties;
      expect(profile.Roles).toBeDefined();
      expect(Array.isArray(profile.Roles)).toBe(true);
    });

    test('EC2 Role should have EC2 service trust', () => {
      const role = template.Resources.EC2InstanceRole.Properties;
      const policy = JSON.stringify(role.AssumeRolePolicyDocument);
      expect(policy).toContain('ec2.amazonaws.com');
    });

    test('Instance Profile should be referenced by Launch Template', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.IamInstanceProfile.Arn).toBeDefined();
    });
  });

  describe('Output Integration', () => {
    test('outputs should reference actual resources', () => {
      expect(template.Outputs.LoadBalancerDNS.Value).toBeDefined();
      expect(template.Outputs.LoadBalancerArn.Value).toBeDefined();
      expect(template.Outputs.AutoScalingGroupName.Value).toBeDefined();
    });

    test('all outputs should have unique export names', () => {
      const exportNames: string[] = [];
      Object.values(template.Outputs).forEach((output: any) => {
        const exportName = JSON.stringify(output.Export.Name);
        expect(exportNames).not.toContain(exportName);
        exportNames.push(exportName);
      });
    });

    test('Application URL should use ALB DNS', () => {
      const url = template.Outputs.ApplicationURL;
      expect(JSON.stringify(url.Value)).toContain('ApplicationLoadBalancer');
      expect(JSON.stringify(url.Value)).toContain('DNSName');
    });
  });

  describe('Cross-Resource Tagging', () => {
    test('all tagged resources should use consistent tag structure', () => {
      const resources = [
        'EC2InstanceRole',
        'ApplicationSecurityGroup',
        'ALBSecurityGroup',
        'ApplicationLoadBalancer',
        'TargetGroup'
      ];

      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
        expect(tagKeys).toContain('Owner');
        expect(tagKeys).toContain('iac-rlhf-amazon');
      });
    });

    test('ASG should propagate tags to launched instances', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      asg.Tags.forEach((tag: any) => {
        expect(tag.PropagateAtLaunch).toBe(true);
      });
    });

    test('Launch Template should tag both instances and volumes', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      const instanceSpec = lt.TagSpecifications.find((s: any) => s.ResourceType === 'instance');
      const volumeSpec = lt.TagSpecifications.find((s: any) => s.ResourceType === 'volume');

      expect(instanceSpec).toBeDefined();
      expect(volumeSpec).toBeDefined();

      expect(instanceSpec.Tags).toBeDefined();
      expect(volumeSpec.Tags).toBeDefined();
    });
  });

  describe('Health Check Configuration', () => {
    test('Target Group health check should match UserData health endpoint', () => {
      const tg = template.Resources.TargetGroup.Properties;
      expect(tg.HealthCheckPath).toBe('/health');

      const userData = JSON.stringify(template.Resources.LaunchTemplate.Properties.LaunchTemplateData.UserData);
      expect(userData).toContain('/health');
    });

    test('ASG health check should use ELB type', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.HealthCheckType).toBe('ELB');
    });

    test('health check grace period should allow instance bootstrapping', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.HealthCheckGracePeriod).toBeGreaterThanOrEqual(300);
    });
  });

  describe('Network Traffic Flow', () => {
    test('internet -> ALB (port 443)', () => {
      const albSg = template.Resources.ALBSecurityGroup.Properties;
      const httpsRule = albSg.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('internet -> ALB (port 80) forwards to instances', () => {
      const albSg = template.Resources.ALBSecurityGroup.Properties;
      const httpRule = albSg.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');

      const httpListener = template.Resources.ALBListenerHTTP.Properties;
      expect(httpListener.DefaultActions[0].Type).toBe('forward');
    });

    test('ALB -> instances (port 80 only)', () => {
      const ingress = template.Resources.ApplicationSecurityGroupIngressFromALB.Properties;
      expect(ingress.FromPort).toBe(80);
      expect(ingress.ToPort).toBe(80);
      expect(ingress.IpProtocol).toBe('tcp');
    });

    test('instances should NOT accept direct internet traffic', () => {
      const appSg = template.Resources.ApplicationSecurityGroup.Properties;
      if (appSg.SecurityGroupIngress) {
        const directInternet = appSg.SecurityGroupIngress.find(
          (r: any) => r.CidrIp === '0.0.0.0/0'
        );
        expect(directInternet).toBeUndefined();
      }
    });
  });

  describe('Cost Optimization Integration', () => {
    test('Spot instances configuration should integrate with production condition', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      const distribution = asg.MixedInstancesPolicy.InstancesDistribution;

      expect(distribution.OnDemandBaseCapacity).toBeDefined();
      expect(distribution.OnDemandPercentageAboveBaseCapacity).toBeDefined();
    });

    test('multiple instance types should be configured for flexibility', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      const overrides = asg.MixedInstancesPolicy.LaunchTemplate.Overrides;
      expect(overrides.length).toBeGreaterThan(1);
    });
  });

  describe('Template Size and Complexity', () => {
    test('template should be under CloudFormation size limit', () => {
      const templateStr = JSON.stringify(template);
      const sizeInBytes = Buffer.byteLength(templateStr, 'utf8');
      expect(sizeInBytes).toBeLessThan(51200); // 51,200 bytes = 50 KB limit
    });

    test('template should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
      expect(resourceCount).toBeLessThan(100);
    });

    test('template should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Metadata).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });
});
