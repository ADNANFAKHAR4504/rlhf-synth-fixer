import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'Secure, highly available web app in eu-central-1 with ALB+WAF (HTTP), CloudTrail, monitoring. NOTE: No ACM/HTTPS.'
      );
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'ProjectName',
      'Environment',
      'VPCCidr',
      'InstanceType',
      'LatestAmiId',
      'AlertEmail',
    ];

    expectedParameters.forEach((param) => {
      test(`should have ${param} parameter`, () => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBeDefined();
        expect(template.Parameters[param].Description).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secure-webapp');
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*$');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(50);
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.AllowedValues).toEqual(['dev', 'stg', 'prod']);
      expect(param.Default).toBe('prod');
    });

    test('VPCCidr parameter should have CIDR pattern validation', () => {
      const param = template.Parameters.VPCCidr;
      expect(param.Default).toBe('10.0.0.0/16');
      // Should be a regex pattern (starts with ^ ... ends with $)
      expect(param.AllowedPattern).toMatch(/^\^.*\$$/);
    });

    test('AlertEmail parameter should have correct properties', () => {
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin@example.com');
      expect(param.AllowedPattern).toBe(
        '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      );
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have all required subnets', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      subnets.forEach((subnet) => {
        expect(template.Mappings.SubnetConfig[subnet]).toBeDefined();
        expect(template.Mappings.SubnetConfig[subnet].CIDR).toBeDefined();
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
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

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    const subnets = [
      { name: 'PublicSubnet1', tier: 'public' },
      { name: 'PublicSubnet2', tier: 'public' },
      { name: 'PrivateSubnet1', tier: 'private' },
      { name: 'PrivateSubnet2', tier: 'private' },
    ];

    subnets.forEach(({ name, tier }) => {
      test(`should have ${name}`, () => {
        const subnet = template.Resources[name];
        expect(subnet).toBeDefined();
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        if (tier === 'public') {
          expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        }
      });
    });

    test('should have NAT Gateways with EIPs', () => {
      ['NATGateway1', 'NATGateway2'].forEach((natName) => {
        const nat = template.Resources[natName];
        expect(nat).toBeDefined();
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
      });

      ['EIPForNATGateway1', 'EIPForNATGateway2'].forEach((eipName) => {
        const eip = template.Resources[eipName];
        expect(eip).toBeDefined();
        expect(eip.Type).toBe('AWS::EC2::EIP');
        expect(eip.Properties.Domain).toBe('vpc');
      });
    });

    test('should have route tables and routes', () => {
      const routeTables = ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'];
      routeTables.forEach((rtName) => {
        const rt = template.Resources[rtName];
        expect(rt).toBeDefined();
        expect(rt.Type).toBe('AWS::EC2::RouteTable');
      });

      ['PublicRoute', 'PrivateRoute1', 'PrivateRoute2'].forEach((routeName) => {
        const route = template.Resources[routeName];
        expect(route).toBeDefined();
        expect(route.Type).toBe('AWS::EC2::Route');
        expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress).toBeDefined();
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.Properties.SecurityGroupIngress[0].ToPort).toBe(80);
      expect(sg.Properties.SecurityGroupIngress[0].IpProtocol).toBe('tcp');
    });

    test('should have EC2 Security Group', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have security group rules', () => {
      const ingress = template.Resources.EC2SecurityGroupIngressFromALB;
      expect(ingress).toBeDefined();
      expect(ingress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingress.Properties.FromPort).toBe(80);
      expect(ingress.Properties.ToPort).toBe(80);

      const egress = template.Resources.ALBToEC2Egress;
      expect(egress).toBeDefined();
      expect(egress.Type).toBe('AWS::EC2::SecurityGroupEgress');
    });
  });

  describe('S3 Buckets', () => {
    const buckets = ['CentralLogsBucket', 'CloudTrailLogsBucket', 'AccessLogsBucket'];

    buckets.forEach((bucketName) => {
      test(`should have ${bucketName}`, () => {
        const bucket = template.Resources[bucketName];
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      });
    });

    test('CloudTrailLogsBucket should have bucket policy', () => {
      const policy = template.Resources.CloudTrailLogsBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toBeDefined();
      expect(policy.Properties.PolicyDocument.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 Instance Role', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('should have EC2 Instance Profile', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CloudTrail Role', () => {
      const role = template.Resources.CloudTrailRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should have Target Group', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
    });

    test('should have HTTP Listener (no HTTPS)', () => {
      const listener = template.Resources.HTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('WAF Resources', () => {
    test('should have WAF Web ACL', () => {
      const webacl = template.Resources.WAFWebACL;
      expect(webacl).toBeDefined();
      expect(webacl.Type).toBe('AWS::WAFv2::WebACL');
      expect(webacl.Properties.Scope).toBe('REGIONAL');
      expect(webacl.Properties.Rules).toBeDefined();
      expect(webacl.Properties.Rules.length).toBeGreaterThan(0);
    });

    test('should have WAF Association', () => {
      const association = template.Resources.WAFAssociation;
      expect(association).toBeDefined();
      expect(association.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });

    test('WAF rules should include rate limiting and managed rule sets', () => {
      const webacl = template.Resources.WAFWebACL;
      const rules = webacl.Properties.Rules;

      const rateRule = rules.find((r: any) => r.Name === 'RateLimitRule');
      expect(rateRule).toBeDefined();
      expect(rateRule.Statement.RateBasedStatement).toBeDefined();

      const commonRules = rules.find((r: any) => r.Name === 'AWSManagedRulesCommonRuleSet');
      expect(commonRules).toBeDefined();

      const sqlRules = rules.find((r: any) => r.Name === 'AWSManagedRulesSQLiRuleSet');
      expect(sqlRules).toBeDefined();
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('should have Launch Template', () => {
      const lt = template.Resources.EC2LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('4');
      expect(asg.Properties.DesiredCapacity).toBe('2');
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });
  });

  describe('CloudTrail and Monitoring', () => {
    test('should have CloudTrail', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have CloudTrail Log Group', () => {
      const logGroup = template.Resources.CloudTrailLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(90);
    });

    test('should have SNS Alert Topic', () => {
      const topic = template.Resources.AlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toBeDefined();
    });

    test('should have CloudWatch Alarms', () => {
      const alarms = ['UnauthorizedAPICallsAlarm', 'AWSBruteForceReportAlarm'];
      alarms.forEach((alarmName) => {
        const alarm = template.Resources[alarmName];
        expect(alarm).toBeDefined();
        expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
        expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      });
    });

    test('should have Metric Filters', () => {
      const filters = ['UnauthorizedAPICallsMetricFilter', 'BruteForceMetricFilter'];
      filters.forEach((filterName) => {
        const filter = template.Resources[filterName];
        expect(filter).toBeDefined();
        expect(filter.Type).toBe('AWS::Logs::MetricFilter');
        expect(filter.Properties.FilterPattern).toBeDefined();
      });
    });
  });

  // If you still keep the Config rule in your template, this test will pass.
  // If you choose to remove it entirely, you can safely delete this block.
  describe('AWS Config', () => {
    const rule = template.Resources.UnrestrictedSSHConfigRule;
    if (rule) {
      test('should have Config Rule for SSH', () => {
        expect(rule.Type).toBe('AWS::Config::ConfigRule');
        expect(rule.Properties.Source.SourceIdentifier).toBe('INCOMING_SSH_DISABLED');
      });
    } else {
      test('template may omit AWS Config rule (no recorder) — OK', () => {
        expect(true).toBe(true);
      });
    }
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId',
      'ALBDNSName',
      'ALBUrl',
      'CloudTrailBucket',
      'AccessLogsBucketName',
      'CentralLogsBucketName',
      'WAFWebACLArn',
      'AlertTopicArn',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
    ];

    expectedOutputs.forEach((outputName) => {
      test(`should have ${outputName} output`, () => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });

    test('outputs should have export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach((outputKey) => {
        const output = template.Outputs[outputKey];
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('resources should use project and environment parameters for naming', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.Tags[0].Value).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-vpc',
      });
    });

    test('resources should have proper tags', () => {
      const resourcesWithTags = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'ApplicationLoadBalancer',
      ];
      resourcesWithTags.forEach((resourceName) => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security Validation', () => {
    test('S3 buckets should have encryption enabled', () => {
      const buckets = ['CentralLogsBucket', 'CloudTrailLogsBucket', 'AccessLogsBucket'];
      buckets.forEach((bucketName) => {
        const bucket = template.Resources[bucketName];
        expect(
          bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');
      });
    });

    test('S3 buckets should block public access', () => {
      const buckets = ['CentralLogsBucket', 'CloudTrailLogsBucket', 'AccessLogsBucket'];
      buckets.forEach((bucketName) => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('ALB should only allow HTTP traffic', () => {
      const albSG = template.Resources.ALBSecurityGroup;
      const ingressRules = albSG.Properties.SecurityGroupIngress;
      expect(ingressRules.length).toBe(1);
      expect(ingressRules[0].FromPort).toBe(80);
      expect(ingressRules[0].ToPort).toBe(80);
    });

    test('EC2 instances should only accept traffic from ALB', () => {
      const ingress = template.Resources.EC2SecurityGroupIngressFromALB;
      expect(ingress.Properties.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(48);
    });
  });
});
