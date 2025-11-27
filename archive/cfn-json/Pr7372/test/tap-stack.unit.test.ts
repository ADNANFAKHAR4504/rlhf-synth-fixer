import * as fs from 'fs';
import * as path from 'path';

describe('TapStack - Product Catalog API Infrastructure Unit Tests', () => {
  // Test configuration
  const templatePath = path.resolve(__dirname, '../lib/TapStack.json');
  const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

  // Load template and outputs
  let template: any = {};
  let deployedOutputs: any = {};
  let region = 'unknown-region';
  let currentStackName = 'unknown-stack';
  let currentEnvironmentSuffix = 'unknown-suffix';

  beforeAll(() => {
    // Load template
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

    // Load outputs if available
    try {
      if (fs.existsSync(outputsPath)) {
        deployedOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

        // Extract region dynamically from outputs
        region = process.env.AWS_REGION ||
          deployedOutputs.StackRegion ||
          'us-east-1';

        // Extract stack name directly from outputs
        currentStackName = deployedOutputs.StackName || 'TapStack';

        // Extract environment suffix from outputs
        currentEnvironmentSuffix = deployedOutputs.EnvironmentSuffix || 'test';

        // Debug logging for extracted values
        console.log('=== Debug Information ===');
        console.log('Region:', region);
        console.log('Stack Name:', currentStackName);
        console.log('Environment Suffix:', currentEnvironmentSuffix);
        console.log('=========================');
      }
    } catch (error) {
      console.log('Note: No deployment outputs found. Skipping deployment validation tests.');
    }
  });

  // Helper function to validate resource exists in template
  const validateResourceExists = (resourceName: string, resourceType: string) => {
    expect(template.Resources).toHaveProperty(resourceName);
    expect(template.Resources[resourceName].Type).toBe(resourceType);
  };

  // Helper function to validate output exists
  const validateOutputExists = (outputName: string) => {
    expect(template.Outputs).toHaveProperty(outputName);
    expect(template.Outputs[outputName]).toHaveProperty('Value');
    expect(template.Outputs[outputName]).toHaveProperty('Export');
  };

  // =================
  // BASIC VALIDATION
  // =================
  describe('Template Structure Validation', () => {
    test('Template has all required CloudFormation sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');

      expect(template).toHaveProperty('Description');
      expect(template.Description).toContain('Product Catalog API');
      expect(template.Description).toContain('ALB');
      expect(template.Description).toContain('Auto Scaling');

      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('Template contains all expected AWS resource types', () => {
      const expectedResourceTypes = [
        'AWS::EC2::SecurityGroup',
        'AWS::IAM::Role',
        'AWS::IAM::InstanceProfile',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::ElasticLoadBalancingV2::Listener',
        'AWS::EC2::LaunchTemplate',
        'AWS::AutoScaling::AutoScalingGroup',
        'AWS::AutoScaling::ScalingPolicy',
        'AWS::CloudWatch::Alarm'
      ];

      const actualResourceTypes = Object.values(template.Resources).map((r: any) => r.Type);
      expectedResourceTypes.forEach(resourceType => {
        expect(actualResourceTypes).toContain(resourceType);
      });
    });
  });

  // ===========
  // PARAMETERS
  // ===========
  describe('Parameters Section - Input Validation', () => {
    test('EnvironmentSuffix parameter supports parallel deployments', () => {
      expect(template.Parameters).toHaveProperty('EnvironmentSuffix');
      const param = template.Parameters.EnvironmentSuffix;

      expect(param.Type).toBe('String');
      expect(param.Description).toContain('Unique suffix');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(20);
    });

    test('VpcId parameter is properly configured', () => {
      expect(template.Parameters).toHaveProperty('VpcId');
      const param = template.Parameters.VpcId;

      expect(param.Type).toBe('AWS::EC2::VPC::Id');
      expect(param.Description).toContain('VPC ID');
    });

    test('PublicSubnetIds parameter supports multi-AZ deployment', () => {
      expect(template.Parameters).toHaveProperty('PublicSubnetIds');
      const param = template.Parameters.PublicSubnetIds;

      expect(param.Type).toBe('List<AWS::EC2::Subnet::Id>');
      expect(param.Description).toContain('public subnet');
      expect(param.Description).toContain('3 AZs');
    });

    test('PrivateSubnetIds parameter supports multi-AZ deployment', () => {
      expect(template.Parameters).toHaveProperty('PrivateSubnetIds');
      const param = template.Parameters.PrivateSubnetIds;

      expect(param.Type).toBe('List<AWS::EC2::Subnet::Id>');
      expect(param.Description).toContain('private subnet');
      expect(param.Description).toContain('3 AZs');
    });

    test('CertificateArn parameter for HTTPS termination', () => {
      expect(template.Parameters).toHaveProperty('CertificateArn');
      const param = template.Parameters.CertificateArn;

      expect(param.Type).toBe('String');
      expect(param.Description).toContain('ACM certificate');
      expect(param.Description).toContain('HTTPS');
    });

    test('LatestAmiId parameter uses SSM parameter store', () => {
      expect(template.Parameters).toHaveProperty('LatestAmiId');
      const param = template.Parameters.LatestAmiId;

      expect(param.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(param.Default).toContain('/aws/service/ami-amazon-linux-latest/');
      expect(param.Description).toContain('AMI ID');
    });
  });

  // ==================
  // SECURITY GROUPS
  // ==================
  describe('Security Groups - Network Security', () => {
    test('ALB Security Group allows HTTPS from internet', () => {
      validateResourceExists('ALBSecurityGroup', 'AWS::EC2::SecurityGroup');
      const sg = template.Resources.ALBSecurityGroup;

      expect(sg.Properties.GroupDescription).toContain('HTTPS');
      expect(sg.Properties.GroupDescription).toContain('internet');
      expect(sg.Properties.VpcId).toHaveProperty('Ref', 'VpcId');

      const httpsIngress = sg.Properties.SecurityGroupIngress.find((rule: any) =>
        rule.IpProtocol === 'tcp' && rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsIngress).toBeDefined();
      expect(httpsIngress.CidrIp).toBe('0.0.0.0/0');
    });

    test('Instance Security Group allows HTTP only from ALB', () => {
      validateResourceExists('InstanceSecurityGroup', 'AWS::EC2::SecurityGroup');
      const sg = template.Resources.InstanceSecurityGroup;

      expect(sg.Properties.GroupDescription).toContain('HTTP');
      expect(sg.Properties.GroupDescription).toContain('ALB only');
      expect(sg.Properties.VpcId).toHaveProperty('Ref', 'VpcId');

      // Check egress allows all outbound
      const allOutbound = sg.Properties.SecurityGroupEgress.find((rule: any) =>
        rule.IpProtocol === '-1' && rule.CidrIp === '0.0.0.0/0'
      );
      expect(allOutbound).toBeDefined();
    });

    test('Security group references are properly configured', () => {
      // ALB to Instance egress
      validateResourceExists('ALBToInstanceEgress', 'AWS::EC2::SecurityGroupEgress');
      const albEgress = template.Resources.ALBToInstanceEgress;
      expect(albEgress.Properties.GroupId).toHaveProperty('Ref', 'ALBSecurityGroup');
      expect(albEgress.Properties.IpProtocol).toBe('tcp');
      expect(albEgress.Properties.FromPort).toBe(80);
      expect(albEgress.Properties.ToPort).toBe(80);
      expect(albEgress.Properties.DestinationSecurityGroupId).toHaveProperty('Ref', 'InstanceSecurityGroup');

      // Instance from ALB ingress
      validateResourceExists('InstanceFromALBIngress', 'AWS::EC2::SecurityGroupIngress');
      const instanceIngress = template.Resources.InstanceFromALBIngress;
      expect(instanceIngress.Properties.GroupId).toHaveProperty('Ref', 'InstanceSecurityGroup');
      expect(instanceIngress.Properties.IpProtocol).toBe('tcp');
      expect(instanceIngress.Properties.FromPort).toBe(80);
      expect(instanceIngress.Properties.ToPort).toBe(80);
      expect(instanceIngress.Properties.SourceSecurityGroupId).toHaveProperty('Ref', 'ALBSecurityGroup');
    });

    test('Security groups have proper naming and tags', () => {
      const securityGroups = ['ALBSecurityGroup', 'InstanceSecurityGroup'];

      securityGroups.forEach(sgName => {
        const sg = template.Resources[sgName];
        expect(sg.Properties.GroupName).toHaveProperty('Fn::Sub');
        expect(sg.Properties.GroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');

        expect(sg.Properties.Tags).toBeDefined();
        const nameTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag.Value).toHaveProperty('Fn::Sub');
        expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');

        const envTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toBe('Production');

        const appTag = sg.Properties.Tags.find((tag: any) => tag.Key === 'Application');
        expect(appTag).toBeDefined();
        expect(appTag.Value).toBe('ProductCatalogAPI');
      });
    });
  });

  // ===============
  // IAM RESOURCES
  // ===============
  describe('IAM Roles and Policies - Access Management', () => {
    test('Instance Role has proper assume role policy', () => {
      validateResourceExists('InstanceRole', 'AWS::IAM::Role');
      const role = template.Resources.InstanceRole;

      expect(role.Properties.RoleName).toHaveProperty('Fn::Sub');
      expect(role.Properties.RoleName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      const policy = role.Properties.AssumeRolePolicyDocument;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('Instance Role has CloudWatch agent permissions', () => {
      const role = template.Resources.InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('Instance Role has SSM parameter access', () => {
      const role = template.Resources.InstanceRole;
      const ssmPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'ParameterStoreAccess');
      expect(ssmPolicy).toBeDefined();

      const ssmStatement = ssmPolicy.PolicyDocument.Statement[0];
      expect(ssmStatement.Effect).toBe('Allow');
      expect(ssmStatement.Action).toEqual(['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath']);
      expect(ssmStatement.Resource).toHaveProperty('Fn::Sub');
      expect(ssmStatement.Resource['Fn::Sub']).toContain('${AWS::Region}');
      expect(ssmStatement.Resource['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('Instance Role has CloudWatch logs permissions', () => {
      const role = template.Resources.InstanceRole;
      const logsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(logsPolicy).toBeDefined();

      const logsStatement = logsPolicy.PolicyDocument.Statement[0];
      expect(logsStatement.Effect).toBe('Allow');
      expect(logsStatement.Action).toEqual(['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents', 'logs:DescribeLogStreams']);
      expect(logsStatement.Resource).toHaveProperty('Fn::Sub');
      expect(logsStatement.Resource['Fn::Sub']).toContain('/aws/ec2/product-catalog-${EnvironmentSuffix}');
    });

    test('Instance Profile is properly configured', () => {
      validateResourceExists('InstanceProfile', 'AWS::IAM::InstanceProfile');
      const profile = template.Resources.InstanceProfile;

      expect(profile.Properties.InstanceProfileName).toHaveProperty('Fn::Sub');
      expect(profile.Properties.InstanceProfileName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(profile.Properties.Roles).toEqual([{ 'Ref': 'InstanceRole' }]);
    });
  });

  // =======================
  // LOAD BALANCER
  // =======================
  describe('Application Load Balancer - Traffic Distribution', () => {
    test('ALB is internet-facing and spans multiple AZs', () => {
      validateResourceExists('ApplicationLoadBalancer', 'AWS::ElasticLoadBalancingV2::LoadBalancer');
      const alb = template.Resources.ApplicationLoadBalancer;

      expect(alb.Properties.Name).toHaveProperty('Fn::Sub');
      expect(alb.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.IpAddressType).toBe('ipv4');
      expect(alb.Properties.Subnets).toHaveProperty('Ref', 'PublicSubnetIds');
      expect(alb.Properties.SecurityGroups).toEqual([{ 'Ref': 'ALBSecurityGroup' }]);
    });

    test('ALB has proper tags', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Tags).toBeDefined();

      const nameTag = alb.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value).toHaveProperty('Fn::Sub');

      const envTag = alb.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
      expect(envTag.Value).toBe('Production');

      const appTag = alb.Properties.Tags.find((tag: any) => tag.Key === 'Application');
      expect(appTag.Value).toBe('ProductCatalogAPI');
    });

    test('Target Group has proper health check configuration', () => {
      validateResourceExists('TargetGroup', 'AWS::ElasticLoadBalancingV2::TargetGroup');
      const tg = template.Resources.TargetGroup;

      expect(tg.Properties.Name).toHaveProperty('Fn::Sub');
      expect(tg.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.VpcId).toHaveProperty('Ref', 'VpcId');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/api/v1/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
      expect(tg.Properties.TargetType).toBe('instance');
    });

    test('Target Group has proper attributes', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.TargetGroupAttributes).toBeDefined();
      expect(tg.Properties.TargetGroupAttributes.length).toBe(4);

      const attributes = tg.Properties.TargetGroupAttributes;
      expect(attributes.find((attr: any) => attr.Key === 'stickiness.enabled' && attr.Value === 'true')).toBeDefined();
      expect(attributes.find((attr: any) => attr.Key === 'stickiness.type' && attr.Value === 'lb_cookie')).toBeDefined();
      expect(attributes.find((attr: any) => attr.Key === 'stickiness.lb_cookie.duration_seconds' && attr.Value === '86400')).toBeDefined();
      expect(attributes.find((attr: any) => attr.Key === 'deregistration_delay.timeout_seconds' && attr.Value === '30')).toBeDefined();
    });

    test('HTTPS Listener forwards traffic to target group', () => {
      validateResourceExists('ALBListener', 'AWS::ElasticLoadBalancingV2::Listener');
      const listener = template.Resources.ALBListener;

      expect(listener.Properties.LoadBalancerArn).toHaveProperty('Ref', 'ApplicationLoadBalancer');
      expect(listener.Properties.Port).toBe(443);
      expect(listener.Properties.Protocol).toBe('HTTPS');
      expect(listener.Properties.Certificates).toEqual([{ 'CertificateArn': { 'Ref': 'CertificateArn' } }]);
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toHaveProperty('Ref', 'TargetGroup');
    });
  });

  // ======================
  // COMPUTE RESOURCES
  // ======================
  describe('EC2 and Auto Scaling - Compute Infrastructure', () => {
    test('Launch Template uses dynamic AMI and proper configuration', () => {
      validateResourceExists('LaunchTemplate', 'AWS::EC2::LaunchTemplate');
      const lt = template.Resources.LaunchTemplate;

      expect(lt.Properties.LaunchTemplateName).toHaveProperty('Fn::Sub');
      expect(lt.Properties.LaunchTemplateName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(lt.Properties.LaunchTemplateData.ImageId).toHaveProperty('Ref', 'LatestAmiId');
      expect(lt.Properties.LaunchTemplateData.InstanceType).toBe('t3.medium');
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Arn).toHaveProperty('Fn::GetAtt', ['InstanceProfile', 'Arn']);
      expect(lt.Properties.LaunchTemplateData.SecurityGroupIds).toEqual([{ 'Ref': 'InstanceSecurityGroup' }]);
    });

    test('Launch Template has security hardening', () => {
      const lt = template.Resources.LaunchTemplate;
      const metadataOptions = lt.Properties.LaunchTemplateData.MetadataOptions;

      expect(metadataOptions).toBeDefined();
      expect(metadataOptions.HttpTokens).toBe('required');
      expect(metadataOptions.HttpPutResponseHopLimit).toBe(1);
      expect(metadataOptions.HttpEndpoint).toBe('enabled');
    });

    test('Launch Template has user data for web server setup', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.UserData).toHaveProperty('Fn::Base64');
      const userData = lt.Properties.LaunchTemplateData.UserData['Fn::Base64'];
      expect(userData).toHaveProperty('Fn::Sub');

      const userDataScript = userData['Fn::Sub'];
      expect(userDataScript).toContain('yum update -y');
      expect(userDataScript).toContain('yum install -y amazon-cloudwatch-agent');
      expect(userDataScript).toContain('yum install -y httpd');
      expect(userDataScript).toContain('systemctl start httpd');
      expect(userDataScript).toContain('systemctl enable httpd');
      expect(userDataScript).toContain('/var/www/html/api/v1/health');
      expect(userDataScript).toContain('Product Catalog API');
    });

    test('Launch Template has proper tags', () => {
      const lt = template.Resources.LaunchTemplate;
      const tagSpecs = lt.Properties.LaunchTemplateData.TagSpecifications;

      expect(tagSpecs).toBeDefined();
      expect(tagSpecs.length).toBe(2);

      // Instance tags
      const instanceTags = tagSpecs.find((spec: any) => spec.ResourceType === 'instance');
      expect(instanceTags).toBeDefined();
      expect(instanceTags.Tags.find((tag: any) => tag.Key === 'Name')).toBeDefined();
      expect(instanceTags.Tags.find((tag: any) => tag.Key === 'Environment' && tag.Value === 'Production')).toBeDefined();
      expect(instanceTags.Tags.find((tag: any) => tag.Key === 'Application' && tag.Value === 'ProductCatalogAPI')).toBeDefined();

      // Volume tags
      const volumeTags = tagSpecs.find((spec: any) => spec.ResourceType === 'volume');
      expect(volumeTags).toBeDefined();
      expect(volumeTags.Tags.find((tag: any) => tag.Key === 'Name')).toBeDefined();
    });

    test('Auto Scaling Group spans multiple AZs with proper configuration', () => {
      validateResourceExists('AutoScalingGroup', 'AWS::AutoScaling::AutoScalingGroup');
      const asg = template.Resources.AutoScalingGroup;

      expect(asg.Properties.AutoScalingGroupName).toHaveProperty('Fn::Sub');
      expect(asg.Properties.AutoScalingGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(asg.Properties.LaunchTemplate.LaunchTemplateId).toHaveProperty('Ref', 'LaunchTemplate');
      expect(asg.Properties.LaunchTemplate.Version).toHaveProperty('Fn::GetAtt', ['LaunchTemplate', 'LatestVersionNumber']);
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(8);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
      expect(asg.Properties.VPCZoneIdentifier).toHaveProperty('Ref', 'PrivateSubnetIds');
      expect(asg.Properties.TargetGroupARNs).toEqual([{ 'Ref': 'TargetGroup' }]);
    });

    test('Auto Scaling Group has proper tags', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.Tags).toBeDefined();

      const nameTag = asg.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.PropagateAtLaunch).toBe(false);

      const envTag = asg.Properties.Tags.find((tag: any) => tag.Key === 'Environment' && tag.Value === 'Production');
      expect(envTag).toBeDefined();
      expect(envTag.PropagateAtLaunch).toBe(true);

      const appTag = asg.Properties.Tags.find((tag: any) => tag.Key === 'Application' && tag.Value === 'ProductCatalogAPI');
      expect(appTag).toBeDefined();
      expect(appTag.PropagateAtLaunch).toBe(true);
    });

    test('Scale Up Policy uses target tracking scaling', () => {
      validateResourceExists('ScaleUpPolicy', 'AWS::AutoScaling::ScalingPolicy');
      const policy = template.Resources.ScaleUpPolicy;

      expect(policy.Properties.AutoScalingGroupName).toHaveProperty('Ref', 'AutoScalingGroup');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.Properties.TargetTrackingConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ASGAverageCPUUtilization');
      expect(policy.Properties.TargetTrackingConfiguration.TargetValue).toBe(70.0);
    });
  });

  // =======================
  // CLOUDWATCH ALARMS
  // =======================
  describe('CloudWatch Alarms - Monitoring and Alerting', () => {
    test('High CPU Alarm monitors ASG CPU utilization', () => {
      validateResourceExists('HighCPUAlarm', 'AWS::CloudWatch::Alarm');
      const alarm = template.Resources.HighCPUAlarm;

      expect(alarm.Properties.AlarmName).toHaveProperty('Fn::Sub');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(alarm.Properties.AlarmDescription).toContain('ASG average CPU exceeds 70%');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(70);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(alarm.Properties.Dimensions[0].Value).toHaveProperty('Ref', 'AutoScalingGroup');
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });

    test('Low CPU Alarm monitors ASG CPU utilization', () => {
      validateResourceExists('LowCPUAlarm', 'AWS::CloudWatch::Alarm');
      const alarm = template.Resources.LowCPUAlarm;

      expect(alarm.Properties.AlarmName).toHaveProperty('Fn::Sub');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(alarm.Properties.AlarmDescription).toContain('ASG average CPU falls below 30%');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/EC2');
      expect(alarm.Properties.Statistic).toBe('Average');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(30);
      expect(alarm.Properties.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.Properties.Dimensions[0].Name).toBe('AutoScalingGroupName');
      expect(alarm.Properties.Dimensions[0].Value).toHaveProperty('Ref', 'AutoScalingGroup');
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });
  });

  // =================
  // OUTPUTS VALIDATION
  // =================
  describe('Outputs Section - Resource Exports', () => {
    test('LoadBalancerDNS output is properly configured', () => {
      validateOutputExists('LoadBalancerDNS');
      const output = template.Outputs.LoadBalancerDNS;

      expect(output.Description).toContain('DNS name');
      expect(output.Description).toContain('Application Load Balancer');
      expect(output.Value).toHaveProperty('Fn::GetAtt', ['ApplicationLoadBalancer', 'DNSName']);
      expect(output.Export.Name).toHaveProperty('Fn::Sub');
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}-ALB-DNS');
    });

    test('TargetGroupArn output is properly configured', () => {
      validateOutputExists('TargetGroupArn');
      const output = template.Outputs.TargetGroupArn;

      expect(output.Description).toContain('ARN of the Target Group');
      expect(output.Value).toHaveProperty('Ref', 'TargetGroup');
      expect(output.Export.Name).toHaveProperty('Fn::Sub');
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}-TargetGroup-ARN');
    });

    test('AutoScalingGroupName output is properly configured', () => {
      validateOutputExists('AutoScalingGroupName');
      const output = template.Outputs.AutoScalingGroupName;

      expect(output.Description).toContain('Name of the Auto Scaling Group');
      expect(output.Value).toHaveProperty('Ref', 'AutoScalingGroup');
      expect(output.Export.Name).toHaveProperty('Fn::Sub');
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}-ASG-Name');
    });

    test('InstanceSecurityGroupId output is properly configured', () => {
      validateOutputExists('InstanceSecurityGroupId');
      const output = template.Outputs.InstanceSecurityGroupId;

      expect(output.Description).toContain('Security Group ID for EC2 instances');
      expect(output.Value).toHaveProperty('Ref', 'InstanceSecurityGroup');
      expect(output.Export.Name).toHaveProperty('Fn::Sub');
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}-Instance-SG');
    });

    test('ALBSecurityGroupId output is properly configured', () => {
      validateOutputExists('ALBSecurityGroupId');
      const output = template.Outputs.ALBSecurityGroupId;

      expect(output.Description).toContain('Security Group ID for Application Load Balancer');
      expect(output.Value).toHaveProperty('Ref', 'ALBSecurityGroup');
      expect(output.Export.Name).toHaveProperty('Fn::Sub');
      expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}-ALB-SG');
    });
  });

});
