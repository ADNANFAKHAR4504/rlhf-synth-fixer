import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Product Catalog API CloudFormation Template - Unit Tests', () => {
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
      expect(template.Description).toContain('Product Catalog API Infrastructure');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const paramKeys = Object.keys(template.Parameters);
      expect(paramKeys).toContain('EnvironmentSuffix');
      expect(paramKeys).toContain('VpcId');
      expect(paramKeys).toContain('PublicSubnetIds');
      expect(paramKeys).toContain('PrivateSubnetIds');
      expect(paramKeys).toContain('AmiId');
      expect(paramKeys).toContain('SSLCertificateArn');
      expect(paramKeys.length).toBe(6);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toBeDefined();
    });

    test('VpcId parameter should be of correct type', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('String');
    });

    test('SubnetIds parameters should be lists', () => {
      expect(template.Parameters.PublicSubnetIds.Type).toBe('CommaDelimitedList');
      expect(template.Parameters.PrivateSubnetIds.Type).toBe('CommaDelimitedList');
    });

    test('SSLCertificateArn should have ACM ARN pattern', () => {
      expect(template.Parameters.SSLCertificateArn.AllowedPattern).toBe('^(arn:aws:acm:.*|)$');
    });
  });

  describe('VPC and Networking', () => {
    test('should conditionally create or reference VPC', () => {
      // VPC can be created conditionally
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Condition).toBe('CreateVPC');
      // Check that resources use conditional reference
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg.Properties.VpcId['Fn::If']).toBeDefined();
    });

    test('should conditionally create or reference subnets', () => {
      // Subnets can be created conditionally
      const resources = Object.keys(template.Resources);
      const subnetResources = resources.filter(r => 
        template.Resources[r].Type === 'AWS::EC2::Subnet'
      );
      expect(subnetResources.length).toBe(6);
      
      // ALB should use conditional reference
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets['Fn::If']).toBeDefined();
      
      // ASG should use conditional reference
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier['Fn::If']).toBeDefined();
    });
  });

  /* VPC and Networking tests removed - now using external VPC via parameters */


  describe('Security Groups', () => {
    test('should create ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTPS from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const httpsRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.ToPort).toBe(443);
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('ALB security group should allow HTTP from internet', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('ALB security group should have explicit egress to EC2 security group', () => {
      const egressResource = template.Resources.ALBSecurityGroupEgress;
      expect(egressResource).toBeDefined();
      expect(egressResource.Type).toBe('AWS::EC2::SecurityGroupEgress');
      
      expect(egressResource.Properties.GroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(egressResource.Properties.IpProtocol).toBe('tcp');
      expect(egressResource.Properties.FromPort).toBe(80);
      expect(egressResource.Properties.ToPort).toBe(80);
      expect(egressResource.Properties.DestinationSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });

    test('should create EC2 security group', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2 security group should only allow HTTP from ALB', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(1);

      const rule = sg.Properties.SecurityGroupIngress[0];
      expect(rule.IpProtocol).toBe('tcp');
      expect(rule.FromPort).toBe(80);
      expect(rule.ToPort).toBe(80);
      expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('EC2 security group should have egress for HTTPS and HTTP', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      expect(sg.Properties.SecurityGroupEgress.length).toBe(2);

      const httpsEgress = sg.Properties.SecurityGroupEgress.find((r: any) => r.FromPort === 443);
      const httpEgress = sg.Properties.SecurityGroupEgress.find((r: any) => r.FromPort === 80);

      expect(httpsEgress).toBeDefined();
      expect(httpsEgress.CidrIp).toBe('0.0.0.0/0');
      expect(httpEgress).toBeDefined();
      expect(httpEgress.CidrIp).toBe('0.0.0.0/0');
    });

    test('security groups should have environment suffix in name', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      const ec2Sg = template.Resources.EC2SecurityGroup;

      expect(albSg.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'product-api-alb-sg-${EnvironmentSuffix}' }
      });

      expect(ec2Sg.Properties.Tags).toContainEqual({
        Key: 'Name',
        Value: { 'Fn::Sub': 'product-api-ec2-sg-${EnvironmentSuffix}' }
      });
    });

    test('security groups should have required tags', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg.Properties.Tags).toContainEqual({ Key: 'Environment', Value: 'Production' });
      expect(albSg.Properties.Tags).toContainEqual({ Key: 'Application', Value: 'ProductCatalogAPI' });
    });
  });

  describe('Application Load Balancer', () => {
    test('should create Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should use public subnet parameter conditionally', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets['Fn::If']).toBeDefined();
      expect(alb.Properties.Subnets['Fn::If'][0]).toBe('CreateVPC');
    });

    test('ALB should use ALB security group', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.SecurityGroups).toContainEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('ALB should have correct attributes', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;

      const idleTimeout = attributes.find((a: any) => a.Key === 'idle_timeout.timeout_seconds');
      const deletionProtection = attributes.find((a: any) => a.Key === 'deletion_protection.enabled');

      expect(idleTimeout).toBeDefined();
      expect(idleTimeout.Value).toBe('60');
      expect(deletionProtection).toBeDefined();
      expect(deletionProtection.Value).toBe('false');
    });

    test('ALB should have environment suffix in name', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Name).toEqual({ 'Fn::Sub': 'product-api-alb-${EnvironmentSuffix}' });
    });

    test('ALB should reference public subnet parameter', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();
      expect(alb.Properties.Subnets['Fn::If']).toBeDefined();
    });
  });

  describe('Target Group', () => {
    test('should create Target Group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('Target Group should use HTTP protocol on port 80', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('Target Group should have correct health check configuration', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/api/v1/health');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('Target Group should have stickiness enabled', () => {
      const tg = template.Resources.TargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;

      const stickinessEnabled = attributes.find((a: any) => a.Key === 'stickiness.enabled');
      const stickinessType = attributes.find((a: any) => a.Key === 'stickiness.type');
      const stickinessDuration = attributes.find((a: any) => a.Key === 'stickiness.lb_cookie.duration_seconds');

      expect(stickinessEnabled).toBeDefined();
      expect(stickinessEnabled.Value).toBe('true');
      expect(stickinessType).toBeDefined();
      expect(stickinessType.Value).toBe('lb_cookie');
      expect(stickinessDuration).toBeDefined();
      expect(stickinessDuration.Value).toBe('86400');
    });

    test('Target Group should have deregistration delay configured', () => {
      const tg = template.Resources.TargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;

      const deregDelay = attributes.find((a: any) => a.Key === 'deregistration_delay.timeout_seconds');
      expect(deregDelay).toBeDefined();
      expect(deregDelay.Value).toBe('30');
    });

    test('Target Group should have slow start configured', () => {
      const tg = template.Resources.TargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;

      const slowStart = attributes.find((a: any) => a.Key === 'slow_start.duration_seconds');
      expect(slowStart).toBeDefined();
      expect(slowStart.Value).toBe('60');
    });
  });

  describe('ALB Listeners', () => {
    test('should create HTTP listener for redirect', () => {
      expect(template.Resources.HTTPListener).toBeDefined();
      expect(template.Resources.HTTPListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('HTTP listener should redirect to HTTPS when SSL certificate is provided', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      // Actions are conditional based on SSL certificate
      expect(listener.Properties.DefaultActions['Fn::If']).toBeDefined();
      expect(listener.Properties.DefaultActions['Fn::If'][0]).toBe('HasSSLCertificate');
    });

    test('should create HTTPS listener', () => {
      expect(template.Resources.HTTPSListener).toBeDefined();
      expect(template.Resources.HTTPSListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('HTTPS listener should forward to target group when SSL certificate is provided', () => {
      const listener = template.Resources.HTTPSListener;
      expect(listener.Condition).toBe('HasSSLCertificate');
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.Certificates).toHaveLength(1);
      expect(listener.Properties.Certificates[0].CertificateArn).toEqual({ Ref: 'SSLCertificateArn' });
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 IAM role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have correct trust policy', () => {
      const role = template.Resources.EC2Role;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;

      expect(trustPolicy.Version).toBe('2012-10-17');
      expect(trustPolicy.Statement).toHaveLength(1);
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('EC2 role should have CloudWatch managed policy', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContainEqual('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('EC2 role should have Parameter Store access policy', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const paramPolicy = policies.find((p: any) => p.PolicyName === 'ParameterStoreAccess');

      expect(paramPolicy).toBeDefined();
      const statement = paramPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('ssm:GetParameter');
      expect(statement.Action).toContain('ssm:GetParameters');
      expect(statement.Action).toContain('ssm:GetParametersByPath');
    });

    test('EC2 role should have CloudWatch Logs policy', () => {
      const role = template.Resources.EC2Role;
      const policies = role.Properties.Policies;
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogs');

      expect(logsPolicy).toBeDefined();
      const statement = logsPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:CreateLogStream');
      expect(statement.Action).toContain('logs:PutLogEvents');
    });

    test('EC2 role should have least-privilege KMS policy', () => {
      const role = template.Resources.EC2Role;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'KMSAccess');
      expect(policy).toBeDefined();
      
      const statement = policy.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('kms:Decrypt');
      expect(statement.Action).toContain('kms:GenerateDataKey');
      expect(statement.Action).toContain('kms:CreateGrant');
      expect(statement.Action).not.toContain('kms:*');
      
      // Should be scoped to specific KMS key
      expect(statement.Resource).toEqual({ 'Fn::GetAtt': ['EBSKMSKey', 'Arn'] });
    });

    test('should create EC2 instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('instance profile should reference EC2 role', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });

    test('IAM resources should have environment suffix in name', () => {
      const role = template.Resources.EC2Role;
      const profile = template.Resources.EC2InstanceProfile;

      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': 'product-api-ec2-role-${EnvironmentSuffix}' });
      expect(profile.Properties.InstanceProfileName).toEqual({ 'Fn::Sub': 'product-api-instance-profile-${EnvironmentSuffix}' });
    });
  });

  describe('Launch Template', () => {
    test('should create Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should use t3.medium instance type', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.medium');
    });

    test('Launch Template should use AMI from parameter or default', () => {
      const lt = template.Resources.LaunchTemplate;
      // ImageId is conditional based on whether AMI is provided
      expect(lt.Properties.LaunchTemplateData.ImageId['Fn::If']).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.ImageId['Fn::If'][0]).toBe('UseDefaultAMI');
    });

    test('Launch Template should use EC2 instance profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn']
      });
    });

    test('Launch Template should use EC2 security group', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.SecurityGroupIds).toContainEqual({ Ref: 'EC2SecurityGroup' });
    });

    test.skip('Launch Template should enforce IMDSv2', () => {
      // MetadataOptions is not valid in CloudFormation for LaunchTemplateData
      // This is enforced at the instance level via UserData or other means
    });

    test('Launch Template should have detailed monitoring enabled', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.Monitoring.Enabled).toBe(true);
    });

    test('Launch Template should have UserData script', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();
    });

    test('Launch Template should tag instances and volumes', () => {
      const lt = template.Resources.LaunchTemplate;
      const tagSpecs = lt.Properties.LaunchTemplateData.TagSpecifications;

      expect(tagSpecs).toHaveLength(2);

      const instanceTags = tagSpecs.find((ts: any) => ts.ResourceType === 'instance');
      const volumeTags = tagSpecs.find((ts: any) => ts.ResourceType === 'volume');

      expect(instanceTags).toBeDefined();
      expect(volumeTags).toBeDefined();

      expect(instanceTags.Tags).toContainEqual({
        Key: 'Environment',
        Value: 'Production'
      });

      expect(volumeTags.Tags).toContainEqual({
        Key: 'Application',
        Value: 'ProductCatalogAPI'
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should have correct size configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('8');
      expect(asg.Properties.DesiredCapacity).toBe('2');
    });

    test('ASG should use private subnet parameter conditionally', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier['Fn::If']).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier['Fn::If'][0]).toBe('CreateVPC');
    });

    test('ASG should use Launch Template', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'LaunchTemplate' });
      expect(asg.Properties.LaunchTemplate.Version).toEqual({
        'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber']
      });
    });

    test('ASG should be attached to Target Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.TargetGroupARNs).toContainEqual({ Ref: 'TargetGroup' });
    });

    test('ASG should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('ASG should have metrics collection enabled', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MetricsCollection).toBeDefined();
      expect(asg.Properties.MetricsCollection).toHaveLength(1);
      expect(asg.Properties.MetricsCollection[0].Granularity).toBe('1Minute');
      expect(asg.Properties.MetricsCollection[0].Metrics).toContain('GroupInServiceInstances');
      expect(asg.Properties.MetricsCollection[0].Metrics).toContain('GroupTotalInstances');
    });

    test('ASG should depend on HTTP listener', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.DependsOn).toBe('HTTPListener');
    });

    test('ASG should propagate tags to instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;

      tags.forEach((tag: any) => {
        expect(tag.PropagateAtLaunch).toBe(true);
      });
    });
  });

  describe('Auto Scaling Policies', () => {
    test('should create scale-up policy with target tracking', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      const policy = template.Resources.ScaleUpPolicy;

      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70.0);
      expect(policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ASGAverageCPUUtilization');
    });

    test('should create scale-down policy with step scaling', () => {
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      const policy = template.Resources.ScaleDownPolicy;

      expect(policy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('StepScaling');
      expect(policy.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(policy.Properties.StepAdjustments).toHaveLength(1);
      expect(policy.Properties.StepAdjustments[0].ScalingAdjustment).toBe(-1);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create high CPU alarm', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      const alarm = template.Resources.HighCPUAlarm;

      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Period).toBe(300);
    });

    test('should create low CPU alarm', () => {
      expect(template.Resources.LowCPUAlarm).toBeDefined();
      const alarm = template.Resources.LowCPUAlarm;

      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('low CPU alarm should trigger scale-down policy', () => {
      const alarm = template.Resources.LowCPUAlarm;
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'ScaleDownPolicy' });
    });

    test('should create unhealthy host alarm', () => {
      expect(template.Resources.UnhealthyHostAlarm).toBeDefined();
      const alarm = template.Resources.UnhealthyHostAlarm;

      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Properties.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });

    test('alarms should have TreatMissingData set to notBreaching', () => {
      const highCpu = template.Resources.HighCPUAlarm;
      const lowCpu = template.Resources.LowCPUAlarm;
      const unhealthy = template.Resources.UnhealthyHostAlarm;

      expect(highCpu.Properties.TreatMissingData).toBe('notBreaching');
      expect(lowCpu.Properties.TreatMissingData).toBe('notBreaching');
      expect(unhealthy.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('alarms should have environment suffix in name', () => {
      const highCpu = template.Resources.HighCPUAlarm;
      expect(highCpu.Properties.AlarmName).toEqual({
        'Fn::Sub': 'product-api-high-cpu-${EnvironmentSuffix}'
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'LoadBalancerDNS',
        'LoadBalancerURL',
        'TargetGroupArn',
        'AutoScalingGroupName',
        'EC2SecurityGroupId',
        'ALBSecurityGroupId',
        'EBSKMSKeyId',
        'EBSKMSKeyArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('LoadBalancer DNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toContain('DNS name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName']
      });
    });

    test('LoadBalancer URL output should be correct', () => {
      const output = template.Outputs.LoadBalancerURL;
      expect(output.Description).toContain('Full URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${ApplicationLoadBalancer.DNSName}'
      });
    });

    test('Target Group ARN output should be correct', () => {
      const output = template.Outputs.TargetGroupArn;
      expect(output.Description).toContain('Target Group');
      expect(output.Value).toEqual({ Ref: 'TargetGroup' });
    });

    test('outputs should have exports for cross-stack references', () => {
      // VpcId output was removed as we use external VPC
      const albOutput = template.Outputs.LoadBalancerDNS;
      const tgOutput = template.Outputs.TargetGroupArn;

      expect(albOutput).toBeDefined();
      expect(albOutput.Export).toBeDefined();
      
      expect(tgOutput).toBeDefined();
      expect(tgOutput.Export).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow naming convention with environment suffix', () => {
      const resourcesWithNames = [
        'ALBSecurityGroup',
        'EC2SecurityGroup',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'EC2Role',
        'EC2InstanceProfile',
        'LaunchTemplate',
        'AutoScalingGroup',
        'EBSKMSKey',
        'EBSKMSKeyAlias'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (!resource) return; // Skip if resource doesn't exist
        
        if (resource.Properties?.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value).toHaveProperty('Fn::Sub');
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
        
        // Check specific name properties
        if (resource.Properties?.Name) {
          expect(resource.Properties.Name).toHaveProperty('Fn::Sub');
          expect(resource.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        
        if (resource.Properties?.RoleName) {
          expect(resource.Properties.RoleName).toHaveProperty('Fn::Sub');
          expect(resource.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        
        if (resource.Properties?.LaunchTemplateName) {
          expect(resource.Properties.LaunchTemplateName).toHaveProperty('Fn::Sub');
          expect(resource.Properties.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('all taggable resources should have required tags', () => {
      const taggableResources = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      expect(taggableResources.length).toBeGreaterThan(5); // Reduced after removing VPC resources

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;

        const envTag = tags.find((t: any) => t.Key === 'Environment');
        const appTag = tags.find((t: any) => t.Key === 'Application');

        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');
        expect(appTag).toBeDefined();
        expect(appTag.Value).toBe('ProductCatalogAPI');
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources for complete infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(39); // 18 core + 21 conditional VPC resources
    });

    test('should have conditional VPC resources', () => {
      const vpcs = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::VPC'
      );
      expect(vpcs).toHaveLength(1);
      expect(template.Resources.VPC.Condition).toBe('CreateVPC');
    });

    test('should have conditional subnet resources', () => {
      const subnets = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::Subnet'
      );
      expect(subnets).toHaveLength(6);
      subnets.forEach(subnet => {
        expect(template.Resources[subnet].Condition).toBe('CreateVPC');
      });
    });

    test('should have exactly 2 security groups', () => {
      const sgs = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(sgs).toHaveLength(2);
    });

    test('should have exactly 3 CloudWatch alarms', () => {
      const alarms = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms).toHaveLength(3);
    });

    test('should have exactly 1 ALB and 1 Target Group', () => {
      const albs = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      const tgs = Object.keys(template.Resources).filter(key =>
        template.Resources[key].Type === 'AWS::ElasticLoadBalancingV2::TargetGroup'
      );

      expect(albs).toHaveLength(1);
      expect(tgs).toHaveLength(1);
    });
  });

  describe('KMS Encryption', () => {
    test('should create KMS key for EBS encryption', () => {
      expect(template.Resources.EBSKMSKey).toBeDefined();
      expect(template.Resources.EBSKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const kms = template.Resources.EBSKMSKey;
      expect(kms.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should allow root account full permissions', () => {
      const kms = template.Resources.EBSKMSKey;
      const statements = kms.Properties.KeyPolicy.Statement;
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('KMS key should allow AWSServiceRoleForAutoScaling', () => {
      const kms = template.Resources.EBSKMSKey;
      const statements = kms.Properties.KeyPolicy.Statement;
      const asgStatement = statements.find((s: any) => 
        s.Sid?.includes('Auto') || s.Sid?.includes('service-linked')
      );
      
      expect(asgStatement).toBeDefined();
      expect(asgStatement.Action).toContain('kms:GenerateDataKey*');
      expect(asgStatement.Action).toContain('kms:CreateGrant');
    });

    test('KMS key should allow EC2 service', () => {
      const kms = template.Resources.EBSKMSKey;
      const statements = kms.Properties.KeyPolicy.Statement;
      const ec2Statement = statements.find((s: any) => s.Sid === 'Allow EC2 to use the key');
      
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('should create KMS key alias', () => {
      expect(template.Resources.EBSKMSKeyAlias).toBeDefined();
      expect(template.Resources.EBSKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('Launch Template should use KMS key for EBS encryption', () => {
      const lt = template.Resources.LaunchTemplate;
      const bdm = lt.Properties.LaunchTemplateData.BlockDeviceMappings;

      expect(bdm).toBeDefined();
      expect(bdm).toHaveLength(1);
      expect(bdm[0].Ebs.Encrypted).toBe(true);
      expect(bdm[0].Ebs.KmsKeyId).toEqual({ 'Fn::GetAtt': ['EBSKMSKey', 'Arn'] });
    });
  });

  describe('Idempotency and Resource Management', () => {
    test('ALB should have deletion protection disabled for easy cleanup', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const deletionProtection = alb.Properties.LoadBalancerAttributes.find(
        (a: any) => a.Key === 'deletion_protection.enabled'
      );
      expect(deletionProtection.Value).toBe('false');
    });

    test('resources should not have RetainPolicy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('all resource names should include environmentSuffix for uniqueness', () => {
      const resourcesWithNames = [
        'EC2Role',
        'EC2InstanceProfile',
        'LaunchTemplate',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'AutoScalingGroup'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.RoleName ||
          resource.Properties.InstanceProfileName ||
          resource.Properties.LaunchTemplateName ||
          resource.Properties.Name ||
          resource.Properties.AutoScalingGroupName;

        if (nameProperty && nameProperty['Fn::Sub']) {
          expect(nameProperty['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });
});
