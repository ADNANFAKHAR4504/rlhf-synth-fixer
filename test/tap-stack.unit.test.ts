import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('IaC-AWS-Nova-Model CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // CORRECTION: The schema now includes a 'scalar' type for !GetAtt to handle the
    // shorthand dot-notation syntax (e.g., !GetAtt MyResource.Arn), which was causing the error.
    const cfnSchema = yaml.DEFAULT_SCHEMA.extend([
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: data => ({ Ref: data }),
      }),
      new yaml.Type('!Base64', {
        kind: 'scalar',
        construct: data => ({ 'Fn::Base64': data }),
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
        kind: 'scalar', // For handling shorthand syntax like !GetAtt MyResource.Arn
        construct: data => {
          const parts = data.split('.');
          const resource = parts.shift();
          const attribute = parts.join('.');
          return { 'Fn::GetAtt': [resource, attribute] };
        },
      }),
      new yaml.Type('!GetAtt', {
        kind: 'sequence',
        construct: data => ({ 'Fn::GetAtt': data }),
      }), // For array syntax
      new yaml.Type('!FindInMap', {
        kind: 'sequence',
        construct: data => ({ 'Fn::FindInMap': data }),
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Select': data }),
      }),
      new yaml.Type('!Split', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Split': data }),
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: data => ({ 'Fn::Join': data }),
      }),
    ]);

    // This loads and parses your YAML template file for testing.
    // Ensure the path points to your IaC-AWS-Nova-Model YAML file.
    const templatePath = path.join(__dirname, '../lib/TapStack.yml'); // IMPORTANT: Make sure this path is correct
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    // Pass the updated custom schema to the loader.
    template = yaml.load(templateContent, { schema: cfnSchema });
  });

  describe('Template Structure & Parameters', () => {
    test('should have a valid CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain('IaC-AWS-Nova-Model');
    });

    test('should define all required parameters with correct types and defaults', () => {
      const params = template.Parameters;
      expect(params.ProjectName).toBeDefined();
      expect(params.ProjectName.Type).toBe('String');
      expect(params.ProjectName.Default).toBe('iac-aws-nova-model');
      expect(params.ProjectName.AllowedPattern).toBeDefined();
      expect(params.ProjectName.MaxLength).toBe(30);

      expect(params.DomainName).toBeDefined();
      expect(params.DomainName.Type).toBe('String');

      expect(params.HostedZoneId).toBeDefined();
      expect(params.HostedZoneId.Type).toBe('AWS::Route53::HostedZone::Id');

      expect(params.CertificateArn).toBeDefined();
      expect(params.CertificateArn.Type).toBe('String');

      expect(params.LatestAmiId).toBeDefined();
      expect(params.LatestAmiId.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
    });
  });

  describe('Networking Resources', () => {
    test('should create a VPC', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });

    test('should create 3 public and 3 private subnets', () => {
      const resourceKeys = Object.keys(template.Resources);
      const publicSubnets = resourceKeys.filter(
        k =>
          k.startsWith('PublicSubnet') &&
          template.Resources[k].Type === 'AWS::EC2::Subnet'
      );
      const privateSubnets = resourceKeys.filter(
        k =>
          k.startsWith('PrivateSubnet') &&
          template.Resources[k].Type === 'AWS::EC2::Subnet'
      );

      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
    });

    test('should create an Internet Gateway and a NAT Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.NatGateway).toBeDefined();
    });

    test('Public Route Table should have a route to the Internet Gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route).toBeDefined();
      expect(route.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('Private Route Table should have a route to the NAT Gateway', () => {
      const route = template.Resources.DefaultPrivateRoute;
      expect(route).toBeDefined();
      expect(route.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway' });
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Configuration', () => {
    test('ALB Security Group should allow inbound HTTP/HTTPS from the internet', () => {
      const albSg = template.Resources.ALBSecurityGroup;
      expect(albSg).toBeDefined();
      const ingressRules = albSg.Properties.SecurityGroupIngress;

      const httpRule = ingressRules.find(r => r.FromPort === 80);
      const httpsRule = ingressRules.find(r => r.FromPort === 443);

      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('EC2 Security Group should only allow inbound traffic from the ALB Security Group', () => {
      const ec2Sg = template.Resources.EC2SecurityGroup;
      expect(ec2Sg).toBeDefined();
      const ingressRule = ec2Sg.Properties.SecurityGroupIngress[0];

      expect(ingressRule.FromPort).toBe(80);
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup',
      });
      // Ensure no other broad ingress rules exist
      expect(ec2Sg.Properties.SecurityGroupIngress.length).toBe(1);
    });

    test('EC2 IAM Role should follow least privilege', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('ec2.amazonaws.com');

      // Check for SSM Managed Policy for secure access
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );

      // Check inline policy for specific, non-wildcard actions
      const inlinePolicy = role.Properties.Policies[0].PolicyDocument.Statement;
      const s3Policy = inlinePolicy.find(p =>
        p.Action.includes('s3:GetObject')
      );
      expect(s3Policy).toBeDefined();
      // This confirms the policy is not s3:*
      expect(s3Policy.Action).toEqual(['s3:GetObject']);
      expect(s3Policy.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${S3AssetBucket}/*',
      });
    });
  });

  describe('Compute and Load Balancer Resources', () => {
    test('Application Load Balancer should be defined correctly', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets.length).toBe(3);
    });

    test('ALB Listeners should handle HTTP to HTTPS redirection', () => {
      const httpListener = template.Resources.ALBListenerHTTP;
      const httpsListener = template.Resources.ALBListenerHTTPS;

      expect(httpListener).toBeDefined();
      expect(httpListener.Properties.Port).toBe(80);
      expect(httpListener.Properties.DefaultActions[0].Type).toBe('redirect');
      expect(
        httpListener.Properties.DefaultActions[0].RedirectConfig.StatusCode
      ).toBe('HTTP_301');

      expect(httpsListener).toBeDefined();
      expect(httpsListener.Properties.Port).toBe(443);
      expect(httpsListener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(httpsListener.Properties.Certificates[0].CertificateArn).toEqual({
        Ref: 'CertificateArn',
      });
    });

    test('Auto Scaling Group should be configured for high availability', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toEqual({ Ref: 'ASGMinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'ASGMaxSize' });
      // Should be deployed across 3 private subnets
      expect(asg.Properties.VPCZoneIdentifier.length).toBe(3);
      expect(asg.Properties.LaunchTemplate).toBeDefined();
    });

    test('Auto Scaling policies and alarms should be configured for CPU scaling', () => {
      const scaleUpPolicy = template.Resources.ScaleUpPolicy;
      const cpuAlarmHigh = template.Resources.CPUAlarmHigh;
      expect(scaleUpPolicy).toBeDefined();
      expect(cpuAlarmHigh).toBeDefined();

      expect(cpuAlarmHigh.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarmHigh.Properties.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
      expect(cpuAlarmHigh.Properties.Threshold).toBe(70);
      expect(cpuAlarmHigh.Properties.AlarmActions).toContainEqual({
        Ref: 'ScaleUpPolicy',
      });
      expect(cpuAlarmHigh.Properties.AlarmActions).toContainEqual({
        Ref: 'SNSTopic',
      });
    });

    test('Launch Template should specify gp3 EBS volume and detailed monitoring', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt).toBeDefined();
      const data = lt.Properties.LaunchTemplateData;

      expect(data.Monitoring.Enabled).toBe(true);
      expect(data.UserData).toBeDefined();

      const ebs = data.BlockDeviceMappings[0].Ebs;
      expect(ebs.VolumeType).toBe('gp3');
    });
  });

  describe('Storage and Backup Resources', () => {
    test('S3 Asset Bucket should block all public access and have versioning', () => {
      const bucket = template.Resources.S3AssetBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const accessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(accessBlock.BlockPublicAcls).toBe(true);
      expect(accessBlock.BlockPublicPolicy).toBe(true);
      expect(accessBlock.IgnorePublicAcls).toBe(true);
      expect(accessBlock.RestrictPublicBuckets).toBe(true);

      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 Bucket name should be dynamically and safely constructed', () => {
      const bucket = template.Resources.S3AssetBucket;
      const bucketNameJoin = bucket.Properties.BucketName['Fn::Join'];
      expect(bucketNameJoin).toBeDefined();
      // Check that it's composed of multiple parts for uniqueness
      expect(bucketNameJoin[1].length).toBe(4);
      // Check that it uses the shortened StackId UUID trick
      expect(JSON.stringify(bucketNameJoin[1])).toContain('AWS::StackId');
    });

    test('AWS Backup plan should be defined for daily backups with 7-day retention', () => {
      const backupPlan = template.Resources.AppBackupPlan;
      expect(backupPlan).toBeDefined();

      const rule = backupPlan.Properties.BackupPlan.BackupPlanRule[0];
      expect(rule.RuleName).toBe('DailyBackups');
      expect(rule.ScheduleExpression).toBe('cron(0 5 ? * * *)');
      expect(rule.Lifecycle.DeleteAfterDays).toBe(7);
    });

    test('AWS Backup Selection should target resources by tag', () => {
      const backupSelection = template.Resources.AppBackupSelection;
      expect(backupSelection).toBeDefined();

      const tagCondition =
        backupSelection.Properties.BackupSelection.ListOfTags[0];
      expect(tagCondition.ConditionKey).toBe('Backup-Plan');
      expect(tagCondition.ConditionValue).toBe('Nova-Model-Daily');
      expect(tagCondition.ConditionType).toBe('STRINGEQUALS');
    });
  });

  describe('DNS & Notifications', () => {
    test('Route53 DNS record should be an Alias pointing to the ALB', () => {
      const record = template.Resources.DNSRecord;
      expect(record).toBeDefined();
      expect(record.Type).toBe('AWS::Route53::RecordSet');
      expect(record.Properties.Type).toBe('A');
      expect(record.Properties.AliasTarget).toBeDefined();
      expect(record.Properties.AliasTarget.DNSName).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
      expect(record.Properties.AliasTarget.HostedZoneId).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'CanonicalHostedZoneID'],
      });
    });

    test('SNS Topic and Subscription should be created for notifications', () => {
      const topic = template.Resources.SNSTopic;
      const sub = template.Resources.SNSSubscription;
      expect(topic).toBeDefined();
      expect(sub).toBeDefined();

      expect(sub.Properties.Protocol).toBe('email');
      expect(sub.Properties.Endpoint).toEqual({ Ref: 'NotificationEmail' });
      expect(sub.Properties.TopicArn).toEqual({ Ref: 'SNSTopic' });
    });
  });

  describe('Outputs', () => {
    test('should define all required outputs', () => {
      const outputs = template.Outputs;
      expect(outputs.ApplicationURL).toBeDefined();
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.S3AssetBucketName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('ApplicationURL output should be correctly formed', () => {
      const output = template.Outputs.ApplicationURL;
      expect(output.Value).toEqual({ 'Fn::Sub': 'https://${DomainName}' });
    });

    test('ALBDNSName output should export its value', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ALBDNSName',
      });
    });

    test('S3AssetBucketName should correctly reference the bucket', () => {
      const output = template.Outputs.S3AssetBucketName;
      expect(output.Value).toEqual({ Ref: 'S3AssetBucket' });
      expect(output.Export).toBeDefined();
    });
  });
});
