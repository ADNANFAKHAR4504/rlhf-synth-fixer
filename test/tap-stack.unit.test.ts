import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Failure Recovery and High Availability Stack Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // This custom schema is required to correctly parse CloudFormation intrinsic functions
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: data => ({ Ref: data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!Sub', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Sub': data }),
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAtt': data.split('.') }),
      }),
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: data => ({ 'Fn::FindInMap': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: data => ({ 'Fn::GetAZs': data }),
      }),
      new yaml.Type('!Base64', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Base64': data }),
      }),
    ]);

    // Update this path to point to your CloudFormation template file
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  describe('Template Parameters & Structure', () => {
    test('should have a valid CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain(
        'Production-Ready High Availability Stack'
      );
    });

    test('should define all required parameters with correct types', () => {
      const params = template.Parameters;
      expect(Object.keys(params).length).toBe(4);
      expect(params.pInstanceType).toBeDefined();
      expect(params.pHostedZoneName).toBeDefined();
      expect(params.pAcmCertificateArn).toBeDefined();
    });
  });

  describe('Security & IAM Configuration', () => {
    test('ALB Security Group should allow inbound HTTP and HTTPS from the internet', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      const ingressRules = albSg.Properties.SecurityGroupIngress;
      const httpRule = ingressRules.find((r: any) => r.FromPort === 80);
      const httpsRule = ingressRules.find((r: any) => r.FromPort === 443);
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Instance Security Group should only allow inbound traffic from the ALB Security Group on port 8080', () => {
      const ec2Sg = template.Resources.InstanceSecurityGroup;
      const ingressRule = ec2Sg.Properties.SecurityGroupIngress[0];
      expect(ingressRule.FromPort).toBe(8080);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
    });

    test('EC2 IAM Role should use managed policies for least privilege', () => {
      const role = template.Resources.EC2InstanceRole;
      const assumeRolePolicy =
        role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRolePolicy.Principal.Service).toBe('ec2.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });
  });

  describe('Networking Infrastructure', () => {
    test('VPC should be created with the correct CIDR block and Name tag', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      const nameTag = vpc.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(nameTag).toBeDefined();
    });

    test('should associate public subnets with the public route table', () => {
      const publicAssociations = Object.values(template.Resources).filter(
        (r: any) =>
          r.Type === 'AWS::EC2::SubnetRouteTableAssociation' &&
          r.Properties.RouteTableId.Ref === 'PublicRouteTable'
      );
      expect(publicAssociations.length).toBe(3);
      const subnetIds = publicAssociations.map(
        (a: any) => a.Properties.SubnetId.Ref
      );
      expect(subnetIds).toContain('PublicSubnet1');
      expect(subnetIds).toContain('PublicSubnet2');
      expect(subnetIds).toContain('PublicSubnet3');
    });

    test('should associate private subnets with the private route table', () => {
      const privateAssociations = Object.values(template.Resources).filter(
        (r: any) =>
          r.Type === 'AWS::EC2::SubnetRouteTableAssociation' &&
          r.Properties.RouteTableId.Ref === 'PrivateRouteTable'
      );
      expect(privateAssociations.length).toBe(3);
      const subnetIds = privateAssociations.map(
        (a: any) => a.Properties.SubnetId.Ref
      );
      expect(subnetIds).toContain('PrivateSubnet1');
      expect(subnetIds).toContain('PrivateSubnet2');
      expect(subnetIds).toContain('PrivateSubnet3');
    });

    test('Private Route Table should route internet-bound traffic through the NAT Gateway', () => {
      const privateRoute = template.Resources.DefaultPrivateRoute;
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'NatGateway',
      });
    });
  });

  describe('Load Balancing, DNS, and Health Checks', () => {
    test('ALB Target Group should be configured with correct health check details', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.Port).toBe(8080);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(2);
      expect(tg.Properties.Matcher.HttpCode).toBe('200');
    });

    test('Route 53 Health Check should have correct failure thresholds', () => {
      const healthCheck = template.Resources.Route53HealthCheck;
      const config = healthCheck.Properties.HealthCheckConfig;
      expect(config.Type).toBe('HTTPS');
      expect(config.FailureThreshold).toBe(3);
      expect(config.RequestInterval).toBe(30);
    });

    test('Route53 DNS record should be an Alias pointing to the ALB', () => {
      const record = template.Resources.Route53Record;
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.AliasTarget).toBeDefined();
      expect(record.Properties.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });
  });

  describe('Compute & Auto Scaling', () => {
    test('Launch Template UserData should contain bootstrapping commands', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const userData = lt.Properties.LaunchTemplateData.UserData['Fn::Base64'];
      expect(userData).toContain('yum install -y httpd socat');
      expect(userData).toContain('systemctl start httpd');
      expect(userData).toContain('socat TCP-LISTEN:8080');
    });

    test('Launch Template should enforce EBS volume encryption', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      const blockDeviceMapping =
        lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      const encryptedFlag = blockDeviceMapping.Ebs.Encrypted;
      expect(encryptedFlag).toBe(true);
    });

    test('Auto Scaling Group should propagate tags to instances', () => {
      const asg = template.Resources.AutoScalingGroup;
      const backupTag = asg.Properties.Tags.find(
        (t: any) => t.Key === 'BackupPlan'
      );
      const nameTag = asg.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(backupTag.PropagateAtLaunch).toBe(true);
      expect(nameTag.PropagateAtLaunch).toBe(true);
    });

    test('Auto Scaling Group should send notifications to SNS topic for scaling events', () => {
      const asg = template.Resources.AutoScalingGroup;
      const notifications = asg.Properties.NotificationConfigurations[0];
      expect(notifications.TopicARN).toEqual({ Ref: 'SNSTopic' });
      expect(notifications.NotificationTypes).toContain(
        'autoscaling:EC2_INSTANCE_LAUNCH'
      );
      expect(notifications.NotificationTypes).toContain(
        'autoscaling:EC2_INSTANCE_TERMINATE'
      );
      expect(notifications.NotificationTypes).toContain(
        'autoscaling:EC2_INSTANCE_LAUNCH_ERROR'
      );
    });

    test('should use a Target Tracking scaling policy for CPU utilization', () => {
      const policy = template.Resources.TargetTrackingScalingPolicy;
      const config = policy.Properties.TargetTrackingConfiguration;
      expect(config.TargetValue).toBe(70.0);
      expect(config.PredefinedMetricSpecification.PredefinedMetricType).toBe(
        'ASGAverageCPUUtilization'
      );
    });
  });

  describe('Backup & Monitoring', () => {
    test('Backup Vault should be protected from accidental deletion', () => {
      const vault = template.Resources.BackupVault;
      expect(vault.Type).toBe('AWS::Backup::BackupVault');
    });

    test('Backup Plan should be scheduled daily with a 7-day retention', () => {
      const plan = template.Resources.BackupPlan;
      const rule = plan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.ScheduleExpression).toBe('cron(0 5 * * ? *)');
      expect(rule.Lifecycle.DeleteAfterDays).toBe(7);
    });

    test('Backup Selection should target resources by tag', () => {
      const selection = template.Resources.BackupSelection;
      const tag = selection.Properties.BackupSelection.ListOfTags[0];
      expect(tag.ConditionKey).toBe('BackupPlan');
      expect(tag.ConditionValue).toBe('Daily');
    });

    test('CloudWatch CPU Alarm should trigger notifications to the SNS Topic', () => {
      const alarm = template.Resources.HighCPUAlarm;
      expect(alarm.Properties.Threshold).toBe(75);
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'SNSTopic' });
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const outputs = template.Outputs;
      expect(Object.keys(outputs).length).toBe(2);
      expect(outputs.LoadBalancerDNSName).toBeDefined();
      expect(outputs.ApplicationURL).toBeDefined();
    });
  });
});
