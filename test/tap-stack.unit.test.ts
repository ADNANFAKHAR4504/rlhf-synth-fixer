import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('AWS Nova Model CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // This custom schema is required to correctly parse CloudFormation intrinsic functions.
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
        construct: data => {
          const parts = data.split('.');
          return { 'Fn::GetAtt': parts };
        },
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
      expect(template.Description).toContain('AWS Nova Model');
    });

    test('should define all required parameters with correct types and defaults', () => {
      const params = template.Parameters;
      expect(Object.keys(params).length).toBe(12);

      expect(params.ProjectName).toBeDefined();
      expect(params.ProjectName.Type).toBe('String');
      expect(params.ProjectName.Default).toBe('novamodel');

      expect(params.VPCId).toBeDefined();
      expect(params.VPCId.Type).toBe('AWS::EC2::VPC::Id');

      expect(params.ASGMinSize).toBeDefined();
      expect(params.ASGMinSize.Type).toBe('Number');
      expect(params.ASGMinSize.Default).toBe(2);

      expect(params.DomainName.Default).toBe(
        'app.tap-us-east-1.turing229221.com'
      );
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
      expect(ingressRules.length).toBe(2);
    });

    test('EC2 Security Group should only allow inbound traffic from the ALB Security Group', () => {
      const ec2Sg = template.Resources.EC2InstanceSecurityGroup;
      const ingressRule = ec2Sg.Properties.SecurityGroupIngress[0];

      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
      expect(ec2Sg.Properties.SecurityGroupIngress.length).toBe(1);
    });

    test('EC2 IAM Role should have an inline policy for least privilege', () => {
      const role = template.Resources.EC2InstanceRole;
      const policy = role.Properties.Policies[0].PolicyDocument.Statement;

      const s3GetObject = policy.find((s: any) =>
        s.Action.includes('s3:GetObject')
      );
      const cwLogs = policy.find((s: any) =>
        s.Action.includes('logs:PutLogEvents')
      );

      expect(s3GetObject).toBeDefined();
      expect(cwLogs).toBeDefined();

      // This role uses inline policies, not managed policies.
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });
  });

  describe('Storage, Networking, and Load Balancing', () => {
    test('S3 Bucket should be private, encrypted, and have versioning enabled', () => {
      const bucket = template.Resources.ApplicationS3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const accessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(accessBlock.BlockPublicAcls).toBe(true);
      expect(accessBlock.BlockPublicPolicy).toBe(true);
      expect(accessBlock.IgnorePublicAcls).toBe(true);
      expect(accessBlock.RestrictPublicBuckets).toBe(true);

      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );

      const versioning = bucket.Properties.VersioningConfiguration;
      expect(versioning.Status).toBe('Enabled');
    });

    test('Application Load Balancer should be internet-facing', () => {
      const alb = template.Resources.ALBLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toEqual({ Ref: 'PublicSubnetIds' });
    });

    test('ALB should have both HTTP->HTTPS redirect and HTTPS listeners', () => {
      const httpsListener = template.Resources.ALBListenerHTTPS;
      expect(httpsListener.Properties.Protocol).toBe('HTTPS');
      expect(httpsListener.Properties.Port).toBe(443);
      expect(httpsListener.Properties.DefaultActions[0].Type).toBe('forward');

      const httpListener = template.Resources.ALBListenerHTTPRedirect;
      expect(httpListener.Properties.Protocol).toBe('HTTP');
      expect(httpListener.Properties.Port).toBe(80);
      expect(httpListener.Properties.DefaultActions[0].Type).toBe('redirect');
    });
  });

  describe('Compute, Auto Scaling, and Scaling Policies', () => {
    test('Launch Template should enable detailed monitoring and EBS encryption', () => {
      const lt = template.Resources.AppLaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;

      expect(data.Monitoring.Enabled).toBe(true);
      expect(data.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(data.IamInstanceProfile.Arn).toEqual({
        'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'],
      });
    });

    test('Auto Scaling Group should be configured for high availability', () => {
      const asg = template.Resources.AppAutoScalingGroup;

      expect(asg.Properties.MinSize).toEqual({ Ref: 'ASGMinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'ASGMaxSize' });
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.VPCZoneIdentifier).toEqual({
        Ref: 'PublicSubnetIds',
      });
    });

    test('Step Scaling policies and alarms should be correctly configured', () => {
      const scaleOutPolicy = template.Resources.ScaleOutPolicy;
      const scaleInPolicy = template.Resources.ScaleInPolicy;
      expect(scaleOutPolicy.Properties.ScalingAdjustment).toBeUndefined(); // Part of StepAdjustments now
      expect(
        scaleOutPolicy.Properties.StepAdjustments[0].ScalingAdjustment
      ).toBe(1);

      expect(
        scaleInPolicy.Properties.StepAdjustments[0].ScalingAdjustment
      ).toBe(-1);

      const cpuAlarmHigh = template.Resources.CPUAlarmHigh;
      expect(cpuAlarmHigh.Properties.Threshold).toBe(70);
      expect(cpuAlarmHigh.Properties.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
      expect(cpuAlarmHigh.Properties.AlarmActions).toContainEqual({
        Ref: 'ScaleOutPolicy',
      });

      const cpuAlarmLow = template.Resources.CPUAlarmLow;
      expect(cpuAlarmLow.Properties.Threshold).toBe(30);
      expect(cpuAlarmLow.Properties.ComparisonOperator).toBe(
        'LessThanThreshold'
      );
      expect(cpuAlarmLow.Properties.AlarmActions).toContainEqual({
        Ref: 'ScaleInPolicy',
      });
    });
  });

  describe('Backup, DNS, and Monitoring', () => {
    test('Backup Plan should be configured for daily backups with 7-day retention', () => {
      const plan = template.Resources.BackupPlan.Properties.BackupPlan;
      const rule = plan.BackupPlanRule[0];

      expect(rule.RuleName).toBe('DailyBackupRule');
      expect(rule.ScheduleExpression).toBe('cron(0 5 * * ? *)');
      expect(rule.Lifecycle.DeleteAfterDays).toBe(7);
    });

    test('Backup Selection should select resources by tag', () => {
      const selection =
        template.Resources.BackupSelection.Properties.BackupSelection;
      const tag = selection.ListOfTags[0];

      expect(tag.ConditionType).toBe('STRINGEQUALS');
      expect(tag.ConditionKey).toBe('Backup');
      expect(tag.ConditionValue).toBe('true');
    });

    test('Route53 DNS record should be an Alias pointing to the ALB', () => {
      const record = template.Resources.DNSRecord;

      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.AliasTarget).toBeDefined();
      expect(record.Properties.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['ALBLoadBalancer', 'DNSName'],
      });
      expect(record.Properties.HostedZoneId).toEqual({ Ref: 'HostedZoneId' });
    });
  });

  describe('Outputs', () => {
    test('should define all 4 required outputs', () => {
      const outputs = template.Outputs;
      expect(Object.keys(outputs).length).toBe(4);

      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ApplicationS3BucketName).toBeDefined();
      expect(outputs.NotificationSNSTopicArn).toBeDefined();
      expect(outputs.Route53DomainName).toBeDefined();
    });

    test('ALBDNSName output should correctly reference the ALB DNS', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ALBLoadBalancer', 'DNSName'],
      });
      expect(output.Export.Name).toBeDefined();
    });
  });
});
