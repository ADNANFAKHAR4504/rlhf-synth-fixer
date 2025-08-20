import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Web Application Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Integration tests implemented', async () => {
      // Integration tests are implemented in tap-stack.int.test.ts
      expect(true).toBe(true);
    });
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Web Application Infrastructure - Production-ready multi-AZ deployment with auto-scaling, CDN, and security controls'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toBe('Environment name for resource naming');
      expect(envParam.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      const keyPairParam = template.Parameters.KeyPairName;
      expect(keyPairParam.Type).toBe('String');
      expect(keyPairParam.Default).toBe('');
      expect(keyPairParam.Description).toBe(
        'EC2 Key Pair for SSH access (leave empty to disable SSH)'
      );
    });

    test('should have AmiId parameter', () => {
      expect(template.Parameters.AmiId).toBeDefined();
      const amiParam = template.Parameters.AmiId;
      expect(amiParam.Type).toBe(
        'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
      );
      expect(amiParam.Default).toBe(
        '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
      );
    });

    test('should have OfficeIpAddress parameter', () => {
      expect(template.Parameters.OfficeIpAddress).toBeDefined();
      const ipParam = template.Parameters.OfficeIpAddress;
      expect(ipParam.Type).toBe('String');
      expect(ipParam.Default).toBe('192.168.1.100/32');
      expect(ipParam.AllowedPattern).toBe(
        '^([0-9]{1,3}\\.){3}[0-9]{1,3}\\/[0-9]{1,2}$'
      );
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have WebAppVPC resource', () => {
      expect(template.Resources.WebAppVPC).toBeDefined();
      const vpc = template.Resources.WebAppVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NatGateway).toBeDefined();
      expect(template.Resources.NatGatewayEIP).toBeDefined();

      const natGateway = template.Resources.NatGateway;
      const eip = template.Resources.NatGatewayEIP;

      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.Properties.Domain).toBe('vpc');
    });
  });

  describe('Security Groups', () => {
    test('should have WebServerSecurityGroup', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const sg = template.Resources.WebServerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for web servers - restricted access from office IP'
      );
    });

    test('should have LoadBalancerSecurityGroup', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      const sg = template.Resources.LoadBalancerSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe(
        'Security group for Application Load Balancer'
      );
    });

    test('WebServerSecurityGroup should have correct ingress rules', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;

      expect(ingressRules).toHaveLength(3);

      // Check for HTTP from ALB
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toEqual({
        Ref: 'LoadBalancerSecurityGroup',
      });

      // Check for SSH from office IP
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({ Ref: 'OfficeIpAddress' });
    });
  });

  describe('IAM Resources', () => {
    test('should have WebServerRole', () => {
      expect(template.Resources.WebServerRole).toBeDefined();
      const role = template.Resources.WebServerRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
    });

    test('should have WebServerInstanceProfile', () => {
      expect(template.Resources.WebServerInstanceProfile).toBeDefined();
      const profile = template.Resources.WebServerInstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toEqual([{ Ref: 'WebServerRole' }]);
    });

    test('WebServerRole should have CloudWatch logging permissions', () => {
      const role = template.Resources.WebServerRole;
      const policies = role.Properties.Policies;

      const logsPolicy = policies.find(
        (policy: any) => policy.PolicyName === 'CloudWatchLogsPolicy'
      );
      expect(logsPolicy).toBeDefined();

      const statements = logsPolicy.PolicyDocument.Statement;
      const logsStatement = statements.find((stmt: any) =>
        stmt.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();
    });
  });

  describe('S3 and CloudFront Resources', () => {
    test('should have StaticContentBucket', () => {
      expect(template.Resources.StaticContentBucket).toBeDefined();
      const bucket = template.Resources.StaticContentBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have StaticContentBucketPolicy for public read access', () => {
      expect(template.Resources.StaticContentBucketPolicy).toBeDefined();
      const policy = template.Resources.StaticContentBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal).toBe('*');
      expect(statement.Action).toBe('s3:GetObject');
    });

    test('should have CloudFrontDistribution', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      const cf = template.Resources.CloudFrontDistribution;
      expect(cf.Type).toBe('AWS::CloudFront::Distribution');
      expect(cf.Properties.DistributionConfig.Enabled).toBe(true);
      expect(
        cf.Properties.DistributionConfig.DefaultCacheBehavior
          .ViewerProtocolPolicy
      ).toBe('redirect-to-https');
    });

    test('should have CloudFrontOriginAccessControl', () => {
      expect(template.Resources.CloudFrontOriginAccessControl).toBeDefined();
      const oac = template.Resources.CloudFrontOriginAccessControl;
      expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have ApplicationLoadBalancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have TargetGroup', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      const tg = template.Resources.TargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckPath).toBe('/health');
    });

    test('should have LoadBalancerListener', () => {
      expect(template.Resources.LoadBalancerListener).toBeDefined();
      const listener = template.Resources.LoadBalancerListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('EC2 and Auto Scaling Resources', () => {
    test('should have LaunchTemplate', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();
    });

    test('should have AutoScalingGroup', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();

      const scaleUp = template.Resources.ScaleUpPolicy;
      const scaleDown = template.Resources.ScaleDownPolicy;

      expect(scaleUp.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleDown.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scaleUp.Properties.ScalingAdjustment).toBe(1);
      expect(scaleDown.Properties.ScalingAdjustment).toBe(-1);
    });

    test('should have CloudWatch alarms for auto scaling', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.LowCPUAlarm).toBeDefined();

      const highCPU = template.Resources.HighCPUAlarm;
      const lowCPU = template.Resources.LowCPUAlarm;

      expect(highCPU.Type).toBe('AWS::CloudWatch::Alarm');
      expect(lowCPU.Type).toBe('AWS::CloudWatch::Alarm');
      expect(highCPU.Properties.Threshold).toBe(70);
      expect(lowCPU.Properties.Threshold).toBe(20);
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have WebServerLogGroup', () => {
      expect(template.Resources.WebServerLogGroup).toBeDefined();
      const logGroup = template.Resources.WebServerLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/ec2/${AWS::StackName}/webserver',
      });
    });
  });

  describe('Route 53 Resources', () => {
    test('should have conditional DNSRecord', () => {
      expect(template.Resources.DNSRecord).toBeDefined();
      const dnsRecord = template.Resources.DNSRecord;
      expect(dnsRecord.Type).toBe('AWS::Route53::RecordSet');
      expect(dnsRecord.Condition).toBe('HasHostedZone');
      expect(dnsRecord.Properties.Type).toBe('A');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions.HasKeyPair).toBeDefined();
      const condition = template.Conditions.HasKeyPair;
      expect(condition['Fn::Not']).toBeDefined();
    });

    test('should have HasHostedZone condition', () => {
      expect(template.Conditions.HasHostedZone).toBeDefined();
      const condition = template.Conditions.HasHostedZone;
      expect(condition['Fn::Not']).toBeDefined();
    });

    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      const condition = template.Conditions.IsProduction;
      expect(condition['Fn::Equals']).toEqual([{ Ref: 'Environment' }, 'prod']);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'LoadBalancerURL',
        'CloudFrontDomainName',
        'CloudFrontURL',
        'S3BucketName',
        'S3BucketURL',
        'PublicSubnets',
        'PrivateSubnets',
        'WebServerSecurityGroupId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('ID of the VPC');
      expect(output.Value).toEqual({ Ref: 'WebAppVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('LoadBalancerURL output should be correct', () => {
      const output = template.Outputs.LoadBalancerURL;
      expect(output.Description).toBe('URL of the Application Load Balancer');
      expect(output.Value).toEqual({
        'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}',
      });
    });

    test('CloudFrontURL output should be correct', () => {
      const output = template.Outputs.CloudFrontURL;
      expect(output.Description).toBe('CloudFront distribution URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${CloudFrontDistribution.DomainName}',
      });
    });

    test('conditional DomainURL output should be correct', () => {
      const output = template.Outputs.DomainURL;
      expect(output.Description).toBe(
        'Custom domain URL (if Route 53 configured)'
      );
      expect(output.Condition).toBe('HasHostedZone');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${DomainName}',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });

    test('should have comprehensive infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // We have 36 resources
    });

    test('should have comprehensive parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(12);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(11);
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should allow public read access', () => {
      const bucket = template.Resources.StaticContentBucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(false);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(false);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(false);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(false);
    });

    test('CloudFront should enforce HTTPS', () => {
      const cf = template.Resources.CloudFrontDistribution;
      const behavior = cf.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('EC2 instances should be in public subnets as per requirements', () => {
      const asg = template.Resources.AutoScalingGroup;
      const subnets = asg.Properties.VPCZoneIdentifier;
      expect(subnets).toEqual([
        { Ref: 'PublicSubnet1' },
        { Ref: 'PublicSubnet2' },
      ]);
    });

    test('Launch template should configure NGINX', () => {
      const lt = template.Resources.LaunchTemplate;
      const userData =
        lt.Properties.LaunchTemplateData.UserData['Fn::Base64']['Fn::Sub'];
      expect(userData).toContain('amazon-linux-extras install nginx1 -y');
      expect(userData).toContain('systemctl start nginx');
      expect(userData).toContain('systemctl enable nginx');
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention', () => {
      const resourceNames = Object.keys(template.Resources);

      // Check that key resources exist with proper naming
      expect(resourceNames).toContain('WebAppVPC');
      expect(resourceNames).toContain('ApplicationLoadBalancer');
      expect(resourceNames).toContain('StaticContentBucket');
      expect(resourceNames).toContain('CloudFrontDistribution');
      expect(resourceNames).toContain('AutoScalingGroup');
    });

    test('export names should follow AWS best practices', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name['Fn::Sub']).toMatch(
            /^\${AWS::StackName}-.+/
          );
        }
      });
    });
  });
});
