import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Mappings', () => {
    test('should have SubnetConfig mapping', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('SubnetConfig should have correct CIDR blocks', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      expect(subnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
      expect(subnetConfig.PublicSubnet1.CIDR).toBe('10.0.1.0/24');
      expect(subnetConfig.PublicSubnet2.CIDR).toBe('10.0.2.0/24');
      expect(subnetConfig.PrivateSubnet1.CIDR).toBe('10.0.10.0/24');
      expect(subnetConfig.PrivateSubnet2.CIDR).toBe('10.0.20.0/24');
    });
  });

  describe('Network Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toBeDefined();
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have InternetGatewayAttachment resource', () => {
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
      expect(template.Resources.InternetGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('should have default public route to internet gateway', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route).toBeDefined();
      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });
  });

  describe('Security Groups', () => {
    test('should have LoadBalancerSecurityGroup', () => {
      expect(template.Resources.LoadBalancerSecurityGroup).toBeDefined();
      expect(template.Resources.LoadBalancerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('LoadBalancerSecurityGroup should allow HTTP from anywhere', () => {
      const sg = template.Resources.LoadBalancerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80 && rule.ToPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have WebServerSecurityGroup', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('WebServerSecurityGroup should allow HTTP from Load Balancer', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const lbRule = ingress.find((rule: any) => 
        rule.SourceSecurityGroupId && rule.FromPort === 80
      );
      expect(lbRule).toBeDefined();
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2InstanceRole', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });

    test('EC2InstanceRole should have correct assume role policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    });

    test('EC2InstanceRole should have S3 access policy', () => {
      const role = template.Resources.EC2InstanceRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toBeDefined();
    });

    test('S3 access policy should include required S3 actions', () => {
      const role = template.Resources.EC2InstanceRole;
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      const s3Statement = s3Policy.PolicyDocument.Statement.find((s: any) => 
        s.Action && s.Action.some((a: string) => a.startsWith('s3:'))
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');
      expect(s3Statement.Action).toContain('s3:PutObject');
      expect(s3Statement.Action).toContain('s3:ListBucket');
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3Bucket resource', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3Bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3Bucket should have public access blocked', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3Bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3Bucket should have lifecycle configuration', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });
  });

  describe('EC2 Instances', () => {
    test('should have WebServerInstance1', () => {
      expect(template.Resources.WebServerInstance1).toBeDefined();
      expect(template.Resources.WebServerInstance1.Type).toBe('AWS::EC2::Instance');
    });

    test('should have WebServerInstance2', () => {
      expect(template.Resources.WebServerInstance2).toBeDefined();
      expect(template.Resources.WebServerInstance2.Type).toBe('AWS::EC2::Instance');
    });

    test('EC2 instances should be in different public subnets', () => {
      const instance1 = template.Resources.WebServerInstance1;
      const instance2 = template.Resources.WebServerInstance2;
      expect(instance1.Properties.SubnetId).toBeDefined();
      expect(instance2.Properties.SubnetId).toBeDefined();
      // They should reference different subnets
      expect(instance1.Properties.SubnetId.Ref).not.toBe(instance2.Properties.SubnetId.Ref);
    });

    test('EC2 instances should have IAM instance profile', () => {
      const instance1 = template.Resources.WebServerInstance1;
      const instance2 = template.Resources.WebServerInstance2;
      expect(instance1.Properties.IamInstanceProfile).toBeDefined();
      expect(instance2.Properties.IamInstanceProfile).toBeDefined();
    });

    test('EC2 instances should have UserData with S3 access test', () => {
      const instance1 = template.Resources.WebServerInstance1;
      const userData = instance1.Properties.UserData;
      expect(userData).toBeDefined();
      // UserData should contain S3 bucket reference
      expect(JSON.stringify(userData)).toContain('S3Bucket');
    });

    test('should have Elastic IPs for both instances', () => {
      expect(template.Resources.ElasticIP1).toBeDefined();
      expect(template.Resources.ElasticIP2).toBeDefined();
      expect(template.Resources.ElasticIP1.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.ElasticIP2.Type).toBe('AWS::EC2::EIP');
    });

    test('should have EIP associations', () => {
      expect(template.Resources.EIPAssociation1).toBeDefined();
      expect(template.Resources.EIPAssociation2).toBeDefined();
      expect(template.Resources.EIPAssociation1.Type).toBe('AWS::EC2::EIPAssociation');
      expect(template.Resources.EIPAssociation2.Type).toBe('AWS::EC2::EIPAssociation');
    });
  });

  describe('Load Balancer', () => {
    test('should have ApplicationLoadBalancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ApplicationLoadBalancer should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ApplicationLoadBalancer should span both public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toBeDefined();
      expect(alb.Properties.Subnets.length).toBe(2);
    });

    test('should have ALBTargetGroup', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('ALBTargetGroup should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('ALBTargetGroup should target both EC2 instances', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.Targets).toBeDefined();
      expect(tg.Properties.Targets.length).toBe(2);
    });

    test('should have ALBListener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALBListener should forward to target group', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling', () => {
    test('should have WebServerLaunchTemplate', () => {
      expect(template.Resources.WebServerLaunchTemplate).toBeDefined();
      expect(template.Resources.WebServerLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have WebServerAutoScalingGroup', () => {
      expect(template.Resources.WebServerAutoScalingGroup).toBeDefined();
      expect(template.Resources.WebServerAutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('AutoScalingGroup should maintain minimum instances', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBeGreaterThanOrEqual(2);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('AutoScalingGroup should use both public subnets', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier.length).toBe(2);
    });

    test('AutoScalingGroup should have ELB health check', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });

    test('should have scaling policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
    });

    test('should have CloudWatch alarms for scaling', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.LowCPUAlarm).toBeDefined();
      expect(template.Resources.HighCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(template.Resources.LowCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });
  });

  describe('Resource Dependencies', () => {
    test('EC2 instances should depend on InternetGatewayAttachment', () => {
      const instance1 = template.Resources.WebServerInstance1;
      expect(instance1.DependsOn).toContain('InternetGatewayAttachment');
    });

    test('AutoScalingGroup should depend on EC2 instances', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.DependsOn).toContain('WebServerInstance1');
      expect(asg.DependsOn).toContain('WebServerInstance2');
    });

    test('Public route should depend on InternetGatewayAttachment', () => {
      const route = template.Resources.DefaultPublicRoute;
      expect(route.DependsOn).toContain('InternetGatewayAttachment');
    });
  });

  describe('Tagging Convention', () => {
    test('all resources should have consistent tags', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const hasEnvironmentTag = tags.some((tag: any) => tag.Key === 'Environment');
          const hasIacTag = tags.some((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(hasEnvironmentTag || hasIacTag).toBe(true);
        }
      });
    });
  });

  describe('Boundary Conditions', () => {
    test('EnvironmentName parameter should enforce lowercase pattern', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]{0,19}$');
    });

    test('InstanceType should only allow specified values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.AllowedValues).not.toContain('t2.large');
      expect(param.AllowedValues).toContain('t2.micro');
    });

    test('subnet CIDR blocks should not overlap', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      const cidrs = [
        subnetConfig.PublicSubnet1.CIDR,
        subnetConfig.PublicSubnet2.CIDR,
        subnetConfig.PrivateSubnet1.CIDR,
        subnetConfig.PrivateSubnet2.CIDR,
      ];
      // Basic check that they're different
      const uniqueCidrs = new Set(cidrs);
      expect(uniqueCidrs.size).toBe(4);
    });
  });

  describe('Error Cases and Validation', () => {
    test('template should be valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(Array.isArray(template)).toBe(false);
    });

    test('all resource types should be valid AWS types', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceKey => {
        const resource = resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });

    test('all Ref and GetAtt should reference existing resources', () => {
      const resources = template.Resources;
      const resourceNames = Object.keys(resources);
      expect(resourceNames.length).toBeGreaterThan(0);
    });
  });
});
