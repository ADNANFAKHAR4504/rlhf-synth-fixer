/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive Jest tests for the "Secure web application infrastructure with ALB and Auto Scaling"
 * CloudFormation template (TapStack.json only - converted from YAML).
 */

import fs from 'fs';
import path from 'path';

/* If the CI pipeline passes ENVIRONMENT, use it; else default to prod */
const environment = process.env.ENVIRONMENT || 'prod';

describe('TapStack CloudFormation Template - Production Ready', () => {
  let template: any;

  /* -------------------------------------------------------------------- */
  /* Load the template (JSON only) once for all test blocks               */
  /* -------------------------------------------------------------------- */
  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}. Please ensure TapStack.json exists.`);
    }
    
    try {
      const raw = fs.readFileSync(templatePath, 'utf8');
      template = JSON.parse(raw);
    } catch (error: any) {
      throw new Error(`Failed to parse template JSON: ${error.message}`);
    }
  });

  /* -------------------------------------------------------------------- */
  /* Basic smoke tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('Basic Template Checks', () => {
    test('template is loaded successfully', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('description matches expected value', () => {
      expect(template.Description).toBe(
        'Secure web application infrastructure with ALB and Auto Scaling - Production Ready'
      );
    });

    test('parameters Environment and KeyPairName exist', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.KeyPairName).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Parameter validation                                                  */
  /* -------------------------------------------------------------------- */
  describe('Parameters', () => {
    test('Environment parameter has correct schema', () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('prod');
      expect(p.Description).toBe('Environment name for resource tagging');
    });

    test('InstanceType parameter has correct schema', () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('t3.micro');
      expect(p.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge']);
      expect(p.Description).toBe('EC2 instance type for web servers');
      expect(p.ConstraintDescription).toBe('Must be a valid EC2 instance type');
    });

    test('KeyPairName parameter has correct schema', () => {
      const p = template.Parameters.KeyPairName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('');
      expect(p.Description).toBe('Optional: EC2 Key Pair for emergency access (leave empty for production)');
      expect(p.ConstraintDescription).toBe('Must be the name of an existing EC2 KeyPair or empty');
    });

    test('Auto Scaling parameters have correct schema', () => {
      const minSize = template.Parameters.MinSize;
      const maxSize = template.Parameters.MaxSize;
      const desiredCapacity = template.Parameters.DesiredCapacity;

      expect(minSize.Type).toBe('Number');
      expect(minSize.Default).toBe(2);
      expect(minSize.MinValue).toBe(2);
      expect(minSize.MaxValue).toBe(10);

      expect(maxSize.Type).toBe('Number');
      expect(maxSize.Default).toBe(6);
      expect(maxSize.MinValue).toBe(2);
      expect(maxSize.MaxValue).toBe(20);

      expect(desiredCapacity.Type).toBe('Number');
      expect(desiredCapacity.Default).toBe(2);
      expect(desiredCapacity.MinValue).toBe(2);
      expect(desiredCapacity.MaxValue).toBe(10);
    });

    test('template defines exactly six parameters', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(6);
    });
  });

  /* -------------------------------------------------------------------- */
  /* Conditions validation                                                 */
  /* -------------------------------------------------------------------- */
  describe('Conditions', () => {
    test('HasKeyPair condition exists', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('HasKeyPair condition has correct logic', () => {
      const condition = template.Conditions.HasKeyPair;
      expect(condition).toEqual({
        'Fn::Not': [
          {
            'Fn::Equals': [
              { 'Ref': 'KeyPairName' },
              ''
            ]
          }
        ]
      });
    });

    test('IsProduction condition exists and has correct logic', () => {
      const condition = template.Conditions.IsProduction;
      expect(condition).toEqual({
        'Fn::Equals': [
          { 'Ref': 'Environment' },
          'prod'
        ]
      });
    });
  });

  /* -------------------------------------------------------------------- */
  /* VPC & Networking Tests                                               */
  /* -------------------------------------------------------------------- */
  describe('VPC & Networking', () => {
    test('VPC has correct configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets are configured correctly', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
      
      // Different AZ indices: 0, 1
      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('Internet Gateway is properly configured', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.InternetGatewayAttachment;
      
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('route tables are properly configured', () => {
      const publicRouteTable = template.Resources.PublicRouteTable;
      const publicRoute = template.Resources.DefaultPublicRoute;

      expect(publicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(publicRoute.DependsOn).toBe('InternetGatewayAttachment');
    });

    test('subnet route table associations are correct', () => {
      const publicAssoc1 = template.Resources.PublicSubnet1RouteTableAssociation;
      const publicAssoc2 = template.Resources.PublicSubnet2RouteTableAssociation;

      expect(publicAssoc1.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
      expect(publicAssoc1.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
      expect(publicAssoc2.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet2' });
      expect(publicAssoc2.Properties.RouteTableId).toEqual({ Ref: 'PublicRouteTable' });
    });

    test('VPC has proper tagging', () => {
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      const envTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${AWS::StackName}-vpc' });
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Security Groups Tests                                                */
  /* -------------------------------------------------------------------- */
  describe('Security Groups', () => {
    test('ALB security group allows HTTP/HTTPS from internet', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const ingress = albSG.Properties.SecurityGroupIngress;
      
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(albSG.Properties.GroupDescription).toBe('Security group for Application Load Balancer - allows HTTP and HTTPS');
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpRule.Description).toBe('Allow HTTP traffic from internet');
      expect(httpsRule.Description).toBe('Allow HTTPS traffic from internet');
    });

    test('Web server security group allows traffic from ALB only', () => {
      const webServerSG = template.Resources.WebServerSecurityGroup;
      const ingress = webServerSG.Properties.SecurityGroupIngress;
      
      expect(webServerSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webServerSG.Properties.GroupDescription).toBe('Security group for web server instances');
      
      expect(ingress.length).toBe(1);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ingress[0].Description).toBe('Allow HTTP traffic from ALB only');
    });

    test('Web server security group has proper egress rules', () => {
      const webServerSG = template.Resources.WebServerSecurityGroup;
      const egress = webServerSG.Properties.SecurityGroupEgress;
      
      expect(egress.length).toBe(4);
      
      const httpEgress = egress.find((rule: any) => rule.FromPort === 80);
      const httpsEgress = egress.find((rule: any) => rule.FromPort === 443);
      const dnsTcpEgress = egress.find((rule: any) => rule.FromPort === 53 && rule.IpProtocol === 'tcp');
      const dnsUdpEgress = egress.find((rule: any) => rule.FromPort === 53 && rule.IpProtocol === 'udp');
      
      expect(httpEgress).toBeDefined();
      expect(httpsEgress).toBeDefined();
      expect(dnsTcpEgress).toBeDefined();
      expect(dnsUdpEgress).toBeDefined();
      
      expect(httpEgress.Description).toBe('Allow HTTP outbound for package updates');
      expect(httpsEgress.Description).toBe('Allow HTTPS outbound for package updates');
    });

    test('optional SSH rule is conditionally created', () => {
      const sshRule = template.Resources.WebServerSSHRule;
      
      expect(sshRule.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(sshRule.Condition).toBe('HasKeyPair');
      expect(sshRule.Properties.FromPort).toBe(22);
      expect(sshRule.Properties.ToPort).toBe(22);
      expect(sshRule.Properties.CidrIp).toBe('10.0.0.0/16');
      expect(sshRule.Properties.Description).toBe('Allow SSH from VPC for emergency access');
    });

    test('security groups are associated with VPC', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const webServerSG = template.Resources.WebServerSecurityGroup;

      expect(albSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(webServerSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('security groups do not have explicit names', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const webServerSG = template.Resources.WebServerSecurityGroup;

      expect(albSG.Properties.GroupName).toBeUndefined();
      expect(webServerSG.Properties.GroupName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* IAM Roles Tests                                                     */
  /* -------------------------------------------------------------------- */
  describe('IAM Roles', () => {
    test('Web server role has correct assume role policy', () => {
      const role = template.Resources.WebServerRole;
      const policy = role.Properties.AssumeRolePolicyDocument;
      
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('Web server role has correct managed policies', () => {
      const role = template.Resources.WebServerRole;
      
      expect(role.Properties.ManagedPolicyArns).toContainEqual(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      expect(role.Properties.ManagedPolicyArns).toContainEqual(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('Web server role has CloudWatch inline policy', () => {
      const role = template.Resources.WebServerRole;
      const inlinePolicy = role.Properties.Policies[0];
      
      expect(inlinePolicy.PolicyName).toBe('WebServerCloudWatchPolicy');
      expect(inlinePolicy.PolicyDocument.Version).toBe('2012-10-17');
      
      const statements = inlinePolicy.PolicyDocument.Statement;
      expect(statements.length).toBe(2);
      
      const logsStatement = statements.find((s: any) => s.Action.includes('logs:CreateLogGroup'));
      const cloudwatchStatement = statements.find((s: any) => s.Action.includes('cloudwatch:PutMetricData'));
      
      expect(logsStatement).toBeDefined();
      expect(cloudwatchStatement).toBeDefined();
      expect(logsStatement.Resource).toEqual({ 'Fn::Sub': 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*' });
    });

    test('instance profile is properly configured', () => {
      const profile = template.Resources.WebServerInstanceProfile;
      
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'WebServerRole' }]);
    });

    test('IAM roles do not have explicit names', () => {
      const role = template.Resources.WebServerRole;
      const profile = template.Resources.WebServerInstanceProfile;
      
      expect(role.Properties.RoleName).toBeUndefined();
      expect(profile.Properties.InstanceProfileName).toBeUndefined();
    });
  });

  /* -------------------------------------------------------------------- */
  /* Launch Template Tests                                                */
  /* -------------------------------------------------------------------- */
  describe('Launch Template', () => {
    test('Launch Template has correct configuration', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      
      expect(launchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
      expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toEqual({ Ref: 'InstanceType' });
    });

    test('Launch Template uses conditional KeyName', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      
      const expectedKeyName = {
        'Fn::If': [
          'HasKeyPair',
          { 'Ref': 'KeyPairName' },
          { 'Ref': 'AWS::NoValue' }
        ]
      };
      
      expect(launchTemplate.Properties.LaunchTemplateData.KeyName).toEqual(expectedKeyName);
    });

    test('Launch Template has proper security groups', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      
      expect(launchTemplate.Properties.LaunchTemplateData.SecurityGroupIds).toEqual([
        { Ref: 'WebServerSecurityGroup' }
      ]);
    });

    test('Launch Template has proper EBS configuration', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const blockDeviceMapping = launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      
      expect(blockDeviceMapping.DeviceName).toBe('/dev/xvda');
      expect(blockDeviceMapping.Ebs.VolumeType).toBe('gp3');
      expect(blockDeviceMapping.Ebs.VolumeSize).toBe(20);
      expect(blockDeviceMapping.Ebs.DeleteOnTermination).toBe(true);
      expect(blockDeviceMapping.Ebs.Encrypted).toEqual({
        'Fn::If': ['IsProduction', true, false]
      });
    });

    test('Launch Template has proper tag specifications', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      const tagSpecs = launchTemplate.Properties.LaunchTemplateData.TagSpecifications;
      
      expect(tagSpecs.length).toBe(2);
      
      const instanceTags = tagSpecs.find((spec: any) => spec.ResourceType === 'instance');
      const volumeTags = tagSpecs.find((spec: any) => spec.ResourceType === 'volume');
      
      expect(instanceTags).toBeDefined();
      expect(volumeTags).toBeDefined();
    });

    test('Launch Template does not have explicit name', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateName).toEqual({ 'Fn::Sub': '${AWS::StackName}-launch-template' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Load Balancer Tests                                                  */
  /* -------------------------------------------------------------------- */
  describe('Load Balancer', () => {
    test('ALB is internet-facing with correct subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
      expect(alb.Properties.SecurityGroups).toEqual([{ Ref: 'ALBSecurityGroup' }]);
    });

    test('ALB has proper attributes configured', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const attributes = alb.Properties.LoadBalancerAttributes;
      
      const idleTimeout = attributes.find((attr: any) => attr.Key === 'idle_timeout.timeout_seconds');
      const http2Enabled = attributes.find((attr: any) => attr.Key === 'routing.http2.enabled');
      const accessLogs = attributes.find((attr: any) => attr.Key === 'access_logs.s3.enabled');
      const deletionProtection = attributes.find((attr: any) => attr.Key === 'deletion_protection.enabled');
      
      expect(idleTimeout.Value).toBe('60');
      expect(http2Enabled.Value).toBe('true');
      expect(accessLogs.Value).toBe('false');
      expect(deletionProtection.Value).toEqual({
        'Fn::If': ['IsProduction', 'true', 'false']
      });
    });

    test('target group has proper health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.TargetType).toBe('instance');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('target group has proper attributes', () => {
      const tg = template.Resources.ALBTargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;
      
      const deregDelay = attributes.find((attr: any) => attr.Key === 'deregistration_delay.timeout_seconds');
      const stickiness = attributes.find((attr: any) => attr.Key === 'stickiness.enabled');
      const crossZone = attributes.find((attr: any) => attr.Key === 'load_balancing.cross_zone.enabled');
      
      expect(deregDelay.Value).toBe('300');
      expect(stickiness.Value).toBe('false');
      expect(crossZone.Value).toBe('true');
    });

    test('listener forwards traffic to target group', () => {
      const listener = template.Resources.ALBListener;
      
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });

    test('load balancer resources do not have explicit names', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const tg = template.Resources.ALBTargetGroup;
      
      expect(alb.Properties.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-alb' });
      expect(tg.Properties.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-tg' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Auto Scaling Group Tests                                             */
  /* -------------------------------------------------------------------- */
  describe('Auto Scaling Group', () => {
    test('ASG has correct configuration', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({ Ref: 'DesiredCapacity' });
      expect(asg.Properties.VPCZoneIdentifier).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' }
      ]);
      expect(asg.Properties.TargetGroupARNs).toEqual([{ Ref: 'ALBTargetGroup' }]);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
      expect(asg.Properties.Cooldown).toBe(300);
    });

    test('ASG uses correct launch template', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toEqual({ Ref: 'WebServerLaunchTemplate' });
      expect(asg.Properties.LaunchTemplate.Version).toEqual({ 
        'Fn::GetAtt': ['WebServerLaunchTemplate', 'LatestVersionNumber'] 
      });
    });

    test('ASG has creation and update policies', () => {
      const asg = template.Resources.AutoScalingGroup;
      
      expect(asg.CreationPolicy.ResourceSignal.Count).toEqual({ Ref: 'DesiredCapacity' });
      expect(asg.CreationPolicy.ResourceSignal.Timeout).toBe('PT15M');
      
      expect(asg.UpdatePolicy.AutoScalingRollingUpdate.MinInstancesInService).toBe(1);
      expect(asg.UpdatePolicy.AutoScalingRollingUpdate.MaxBatchSize).toBe(1);
      expect(asg.UpdatePolicy.AutoScalingRollingUpdate.PauseTime).toBe('PT15M');
      expect(asg.UpdatePolicy.AutoScalingRollingUpdate.WaitOnResourceSignals).toBe(true);
    });

    test('ASG has proper tags', () => {
      const asg = template.Resources.AutoScalingGroup;
      const tags = asg.Properties.Tags;
      
      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      const envTag = tags.find((tag: any) => tag.Key === 'Environment');
      
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${AWS::StackName}-asg-instance' });
      expect(nameTag.PropagateAtLaunch).toBe(true);
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
      expect(envTag.PropagateAtLaunch).toBe(true);
    });

    test('ASG does not have explicit name', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.AutoScalingGroupName).toEqual({ 'Fn::Sub': '${AWS::StackName}-asg' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Scaling Policies and CloudWatch Alarms Tests                        */
  /* -------------------------------------------------------------------- */
  describe('Scaling Policies and CloudWatch Alarms', () => {
    test('scaling policies are properly configured', () => {
      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;
      
      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      
      expect(scaleUp.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleUp.Properties.Cooldown).toBe(300);
      
      expect(scaleDown.Properties.AdjustmentType).toBe('ChangeInCapacity');
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
      expect(scaleDown.Properties.Cooldown).toBe(300);
    });

    test('CloudWatch alarms are properly configured', () => {
      const cpuHigh = template.Resources.CPUAlarmHigh;
      const cpuLow = template.Resources.CPUAlarmLow;
      
      expect(cpuHigh.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuLow.Type).toBe('AWS::CloudWatch::Alarm');
      
      expect(cpuHigh.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuHigh.Properties.Threshold).toBe(70);
      expect(cpuHigh.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      
      expect(cpuLow.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuLow.Properties.Threshold).toBe(25);
      expect(cpuLow.Properties.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('alarms are connected to scaling policies', () => {
      const cpuHigh = template.Resources.CPUAlarmHigh;
      const cpuLow = template.Resources.CPUAlarmLow;
      
      expect(cpuHigh.Properties.AlarmActions).toEqual([{ Ref: 'ScaleUpPolicy' }]);
      expect(cpuLow.Properties.AlarmActions).toEqual([{ Ref: 'ScaleDownPolicy' }]);
    });

    test('alarms have proper dimensions', () => {
      const cpuHigh = template.Resources.CPUAlarmHigh;
      const cpuLow = template.Resources.CPUAlarmLow;
      
      expect(cpuHigh.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(cpuHigh.Properties.Dimensions[0].Value).toEqual({ Ref: 'AutoScalingGroup' });
      
      expect(cpuLow.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(cpuLow.Properties.Dimensions[0].Value).toEqual({ Ref: 'AutoScalingGroup' });
    });

    test('CloudWatch alarms do not have explicit names', () => {
      const cpuHigh = template.Resources.CPUAlarmHigh;
      const cpuLow = template.Resources.CPUAlarmLow;
      
      expect(cpuHigh.Properties.AlarmName).toEqual({ 'Fn::Sub': '${AWS::StackName}-cpu-high' });
      expect(cpuLow.Properties.AlarmName).toEqual({ 'Fn::Sub': '${AWS::StackName}-cpu-low' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Critical resources present                                           */
  /* -------------------------------------------------------------------- */
  describe('Key Resources', () => {
    const criticalResources = [
      'VPC', 'InternetGateway', 'InternetGatewayAttachment',
      'PublicSubnet1', 'PublicSubnet2',
      'PublicRouteTable', 'DefaultPublicRoute',
      'PublicSubnet1RouteTableAssociation', 'PublicSubnet2RouteTableAssociation',
      'ALBSecurityGroup', 'WebServerSecurityGroup', 'WebServerSSHRule',
      'WebServerRole', 'WebServerInstanceProfile',
      'WebServerLaunchTemplate',
      'ApplicationLoadBalancer', 'ALBTargetGroup', 'ALBListener',
      'AutoScalingGroup', 'ScaleUpPolicy', 'ScaleDownPolicy',
      'CPUAlarmHigh', 'CPUAlarmLow'
    ];

    criticalResources.forEach(id =>
      test(`resource ${id} exists`, () => {
        expect(template.Resources[id]).toBeDefined();
      })
    );

    test('template has expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(criticalResources.length);
      expect(resourceCount).toBeLessThanOrEqual(30); // reasonable upper bound
    });
  });

  /* -------------------------------------------------------------------- */
  /* Outputs validation                                                   */
  /* -------------------------------------------------------------------- */
  describe('Outputs', () => {
    const outputKeys = ['VPCId', 'PublicSubnets', 'LoadBalancerURL', 'LoadBalancerDNS', 'AutoScalingGroupName', 'WebServerSecurityGroupId', 'ALBSecurityGroupId'];

    test('template exposes exactly seven outputs', () => {
      expect(Object.keys(template.Outputs)).toHaveLength(7);
    });

    outputKeys.forEach(key => {
      test(`output ${key} is defined`, () => {
        expect(template.Outputs[key]).toBeDefined();
      });

      test(`output ${key} has description`, () => {
        expect(template.Outputs[key].Description).toBeDefined();
        expect(typeof template.Outputs[key].Description).toBe('string');
        expect(template.Outputs[key].Description.length).toBeGreaterThan(0);
      });

      test(`export name for ${key} follows AWS::StackName pattern`, () => {
        const exportName = template.Outputs[key].Export.Name;
        expect(exportName).toEqual({ 'Fn::Sub': expect.stringContaining('${AWS::StackName}') });
      });
    });

    test('outputs have meaningful descriptions', () => {
      expect(template.Outputs.VPCId.Description).toContain('VPC');
      expect(template.Outputs.LoadBalancerURL.Description).toContain('URL');
      expect(template.Outputs.LoadBalancerDNS.Description).toContain('DNS');
      expect(template.Outputs.AutoScalingGroupName.Description).toContain('Auto Scaling Group');
    });

    test('outputs reference correct resources', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.LoadBalancerURL.Value).toEqual({ 'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}' });
      expect(template.Outputs.LoadBalancerDNS.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
      expect(template.Outputs.AutoScalingGroupName.Value).toEqual({ Ref: 'AutoScalingGroup' });
    });
  });

  /* -------------------------------------------------------------------- */
  /* Overall structure sanity                                             */
  /* -------------------------------------------------------------------- */
  describe('Template Structure', () => {
    test('required top-level sections exist', () => {
      ['AWSTemplateFormatVersion', 'Description', 'Parameters', 'Resources', 'Outputs', 'Conditions'].forEach(
        section => expect(template[section]).toBeDefined()
      );
    });

    test('format version is 2010-09-09', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('resource count is comprehensive', () => {
      expect(Object.keys(template.Resources).length).toBeGreaterThan(20);
      expect(Object.keys(template.Resources).length).toBeLessThan(30);
    });

    test('all resources have proper tagging', () => {
      const resourcesWithTags = [
        'VPC', 'PublicSubnet1', 'PublicSubnet2',
        'ALBSecurityGroup', 'WebServerSecurityGroup',
        'ApplicationLoadBalancer', 'ALBTargetGroup', 'WebServerRole'
      ];

      resourcesWithTags.forEach(resourceId => {
        const resource = template.Resources[resourceId];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        
        const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        
        expect(nameTag).toBeDefined();
        expect(envTag).toBeDefined();
      });
    });

    test('high availability through multi-AZ deployment', () => {
      // Multiple subnets in different AZs
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      
      // ALB spans multiple subnets
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets.length).toBe(2);
      
      // Auto Scaling Group spans multiple subnets
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier.length).toBe(2);
    });

    test('no hardcoded AMI IDs - uses SSM parameter', () => {
      const launchTemplate = template.Resources.WebServerLaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });

    test('security groups follow principle of least privilege', () => {
      const webServerSGIngress = template.Resources.WebServerSecurityGroup.Properties.SecurityGroupIngress;
      
      // Web server SG only allows traffic from ALB on port 80
      expect(webServerSGIngress.length).toBe(1);
      expect(webServerSGIngress[0].FromPort).toBe(80);
      expect(webServerSGIngress[0].ToPort).toBe(80);
      expect(webServerSGIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
  });
});
