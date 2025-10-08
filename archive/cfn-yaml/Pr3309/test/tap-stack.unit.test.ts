import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Cost-Efficient Web Infrastructure CloudFormation Template', () => {
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

    test('should have a description for cost-efficient web infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Cost-efficient web infrastructure for startup with 3,000 daily users'
      );
    });

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
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
    });

    test('should have LatestAmiId parameter for dynamic AMI selection', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      const amiParam = template.Parameters.LatestAmiId;
      expect(amiParam.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(amiParam.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
    });

    test('should have auto scaling parameters', () => {
      expect(template.Parameters.DesiredCapacity).toBeDefined();
      expect(template.Parameters.MinSize).toBeDefined();
      expect(template.Parameters.MaxSize).toBeDefined();

      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
      expect(template.Parameters.MinSize.Default).toBe(1);
      expect(template.Parameters.MaxSize.Default).toBe(4);
    });
  });

  describe('VPC and Network Resources', () => {
    test('should have VPC resource with correct CIDR', () => {
      expect(template.Resources.VPC).toBeDefined();
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets in different AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();

      const pubSub1 = template.Resources.PublicSubnet1;
      const pubSub2 = template.Resources.PublicSubnet2;

      expect(pubSub1.Type).toBe('AWS::EC2::Subnet');
      expect(pubSub2.Type).toBe('AWS::EC2::Subnet');
      expect(pubSub1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(pubSub2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(pubSub1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(pubSub2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets for EC2 instances', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      const privSub1 = template.Resources.PrivateSubnet1;
      const privSub2 = template.Resources.PrivateSubnet2;

      expect(privSub1.Type).toBe('AWS::EC2::Subnet');
      expect(privSub2.Type).toBe('AWS::EC2::Subnet');
      expect(privSub1.Properties.CidrBlock).toBe('10.0.10.0/24');
      expect(privSub2.Properties.CidrBlock).toBe('10.0.11.0/24');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with HTTP access', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      const albSG = template.Resources.ALBSecurityGroup;
      expect(albSG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = albSG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(80);
      expect(ingressRules[0].ToPort).toBe(80);
      expect(ingressRules[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group with restricted access', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      const ec2SG = template.Resources.EC2SecurityGroup;
      expect(ec2SG.Type).toBe('AWS::EC2::SecurityGroup');

      const ingressRules = ec2SG.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(2);

      // HTTP from ALB
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });

      // SSH from VPC
      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('10.0.0.0/16');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have Target Group with health checks', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      const tg = template.Resources.TargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      const listener = template.Resources.ALBListener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('S3 Resources', () => {
    test('should have S3 bucket for static assets', () => {
      expect(template.Resources.StaticAssetsBucket).toBeDefined();
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      // Should have encryption
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');

      // Should have versioning
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');

      // Should have lifecycle policy
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].NoncurrentVersionExpirationInDays).toBe(30);
    });

    test('S3 bucket should have appropriate public access configuration', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(false); // Allows bucket policy
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(false); // Allows public access through policy
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('Auto Scaling Group should reference correct subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const subnets = asg.Properties.VPCZoneIdentifier;
      expect(subnets).toHaveLength(2);
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PrivateSubnet2' });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'LoadBalancerURL',
        'StaticAssetsBucketName',
        'VPCId'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('LoadBalancerURL output should be correct', () => {
      const output = template.Outputs.LoadBalancerURL;
      expect(output.Description).toBe('URL of the Application Load Balancer');
      expect(output.Value).toEqual({
        'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}'
      });
    });

    test('StaticAssetsBucketName output should be correct', () => {
      const output = template.Outputs.StaticAssetsBucketName;
      expect(output.Description).toBe('Name of the S3 bucket for static assets');
      expect(output.Value).toEqual({ Ref: 'StaticAssetsBucket' });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const vpc = template.Resources.VPC;
      const vpcName = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name').Value;
      expect(vpcName).toEqual({
        'Fn::Sub': 'VPC-${EnvironmentSuffix}'
      });

      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Name).toEqual({
        'Fn::Sub': 'ALB-${EnvironmentSuffix}'
      });
    });

  });

  describe('Security Best Practices', () => {
    test('should not expose EC2 instances directly to internet', () => {
      // Private subnets should not have direct internet gateway routes
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBeUndefined();
      expect(privateSubnet2.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('should have encrypted S3 bucket', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
    });

    test('should have restrictive security group rules', () => {
      const ec2SG = template.Resources.EC2SecurityGroup;
      const ingressRules = ec2SG.Properties.SecurityGroupIngress;

      // No rule should allow all traffic from anywhere
      ingressRules.forEach((rule: any) => {
        if (rule.CidrIp === '0.0.0.0/0') {
          expect(rule.IpProtocol).not.toBe('-1');
        }
      });
    });
  });

  describe('Cost Optimization', () => {
    test('should use cost-effective configurations', () => {
      // Auto scaling parameters should be reasonable for cost
      expect(template.Parameters.MinSize.Default).toBe(1); // Start small
      expect(template.Parameters.MaxSize.Default).toBeLessThanOrEqual(4); // Don't over-scale
      expect(template.Parameters.DesiredCapacity.Default).toBe(2); // Reasonable starting point
    });

    test('should have S3 lifecycle policy for cost savings', () => {
      const bucket = template.Resources.StaticAssetsBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].Status).toBe('Enabled');
      expect(lifecycleRules[0].NoncurrentVersionExpirationInDays).toBe(30);
    });
  });
});
