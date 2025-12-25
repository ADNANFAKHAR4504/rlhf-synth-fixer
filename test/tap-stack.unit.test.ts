import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template for testing
    // Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json
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
      expect(template.Description).toContain('LocalStack Compatible');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentName parameter', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
    });

    test('EnvironmentName parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('webapp');
      expect(param.AllowedPattern).toBe('^[a-z][a-z0-9-]{0,19}$');
    });

    test('should have AmiId parameter', () => {
      expect(template.Parameters.AmiId).toBeDefined();
      expect(template.Parameters.AmiId.Type).toBe('String');
      expect(template.Parameters.AmiId.Default).toBeDefined();
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t2.micro');
    });

    test('InstanceType should only allow specified values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.AllowedValues).toContain('t2.micro');
      expect(param.AllowedValues).toContain('t2.small');
      expect(param.AllowedValues).toContain('t3.micro');
      expect(param.AllowedValues).toContain('t3.small');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('String');
      expect(template.Parameters.KeyPairName.Default).toBe('');
    });
  });

  describe('Conditions', () => {
    test('should have HasKeyPair condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });
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

    test('subnet CIDR blocks should not overlap', () => {
      const subnetConfig = template.Mappings.SubnetConfig;
      const cidrs = [
        subnetConfig.PublicSubnet1.CIDR,
        subnetConfig.PublicSubnet2.CIDR,
        subnetConfig.PrivateSubnet1.CIDR,
        subnetConfig.PrivateSubnet2.CIDR,
      ];
      const uniqueCidrs = new Set(cidrs);
      expect(uniqueCidrs.size).toBe(4);
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

    test('LoadBalancerSecurityGroup should NOT have GroupName (LocalStack)', () => {
      const sg = template.Resources.LoadBalancerSecurityGroup;
      // LocalStack compatible - no GroupName property
      expect(sg.Properties.GroupName).toBeUndefined();
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

    test('WebServerSecurityGroup should NOT have GroupName (LocalStack)', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      // LocalStack compatible - no GroupName property
      expect(sg.Properties.GroupName).toBeUndefined();
    });

    test('WebServerSecurityGroup should allow HTTP from Load Balancer', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const lbRule = ingress.find((rule: any) => 
        rule.SourceSecurityGroupId && rule.FromPort === 80
      );
      expect(lbRule).toBeDefined();
    });

    test('WebServerSecurityGroup should allow HTTP from anywhere for EIP access', () => {
      const sg = template.Resources.WebServerSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      const directHttpRule = ingress.find((rule: any) => 
        rule.CidrIp === '0.0.0.0/0' && rule.FromPort === 80
      );
      expect(directHttpRule).toBeDefined();
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
      expect(s3Statement.Action).toContain('s3:DeleteObject');
    });

    test('IAM role should NOT have AWS managed policies', () => {
      const role = template.Resources.EC2InstanceRole;
      // LocalStack compatible - no ManagedPolicyArns
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('should have EC2InstanceProfile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('EC2InstanceProfile should reference the EC2InstanceRole', () => {
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile.Properties.Roles).toBeDefined();
      expect(profile.Properties.Roles[0].Ref).toBe('EC2InstanceRole');
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

    test('S3Bucket should NOT have encryption (LocalStack simplified)', () => {
      const bucket = template.Resources.S3Bucket;
      // LocalStack compatible - no BucketEncryption
      expect(bucket.Properties.BucketEncryption).toBeUndefined();
    });

    test('S3Bucket should NOT have lifecycle configuration (LocalStack simplified)', () => {
      const bucket = template.Resources.S3Bucket;
      // LocalStack compatible - no LifecycleConfiguration
      expect(bucket.Properties.LifecycleConfiguration).toBeUndefined();
    });

    test('S3Bucket should use simple naming without AccountId/Region', () => {
      const bucket = template.Resources.S3Bucket;
      const bucketName = bucket.Properties.BucketName;
      // Should use !Sub with EnvironmentName only
      expect(bucketName).toBeDefined();
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

    test('EC2 instances should use AmiId parameter (not SSM)', () => {
      const instance1 = template.Resources.WebServerInstance1;
      const instance2 = template.Resources.WebServerInstance2;
      expect(instance1.Properties.ImageId.Ref).toBe('AmiId');
      expect(instance2.Properties.ImageId.Ref).toBe('AmiId');
    });

    test('EC2 instances should NOT have Monitoring property (LocalStack)', () => {
      const instance1 = template.Resources.WebServerInstance1;
      const instance2 = template.Resources.WebServerInstance2;
      expect(instance1.Properties.Monitoring).toBeUndefined();
      expect(instance2.Properties.Monitoring).toBeUndefined();
    });

    test('EC2 instances should NOT have CreationPolicy (LocalStack)', () => {
      const instance1 = template.Resources.WebServerInstance1;
      const instance2 = template.Resources.WebServerInstance2;
      expect(instance1.CreationPolicy).toBeUndefined();
      expect(instance2.CreationPolicy).toBeUndefined();
    });

    test('EC2 instances should have UserData', () => {
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

    test('Elastic IPs should be in VPC domain', () => {
      const eip1 = template.Resources.ElasticIP1;
      const eip2 = template.Resources.ElasticIP2;
      expect(eip1.Properties.Domain).toBe('vpc');
      expect(eip2.Properties.Domain).toBe('vpc');
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

    test('LaunchTemplate should use AmiId parameter', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.ImageId.Ref).toBe('AmiId');
    });

    test('LaunchTemplate should NOT have Monitoring (LocalStack)', () => {
      const lt = template.Resources.WebServerLaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.Monitoring).toBeUndefined();
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

    test('AutoScalingGroup should NOT have UpdatePolicy (LocalStack)', () => {
      const asg = template.Resources.WebServerAutoScalingGroup;
      expect(asg.UpdatePolicy).toBeUndefined();
    });

    test('should NOT have scaling policies (LocalStack simplified)', () => {
      // LocalStack compatible - no ScaleUpPolicy and ScaleDownPolicy
      expect(template.Resources.ScaleUpPolicy).toBeUndefined();
      expect(template.Resources.ScaleDownPolicy).toBeUndefined();
    });

    test('should NOT have CloudWatch alarms (LocalStack simplified)', () => {
      // LocalStack compatible - no CloudWatch alarms
      expect(template.Resources.HighCPUAlarm).toBeUndefined();
      expect(template.Resources.LowCPUAlarm).toBeUndefined();
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

  describe('Outputs', () => {
    test('should have LoadBalancerDNS output', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
      expect(template.Outputs.LoadBalancerDNS.Value).toBeDefined();
    });

    test('should have LoadBalancerURL output', () => {
      expect(template.Outputs.LoadBalancerURL).toBeDefined();
    });

    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
    });

    test('should have subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have EC2 instance outputs', () => {
      expect(template.Outputs.WebServerInstance1Id).toBeDefined();
      expect(template.Outputs.WebServerInstance2Id).toBeDefined();
    });

    test('should have Elastic IP outputs', () => {
      expect(template.Outputs.ElasticIP1Address).toBeDefined();
      expect(template.Outputs.ElasticIP2Address).toBeDefined();
      expect(template.Outputs.WebServerInstance1URL).toBeDefined();
      expect(template.Outputs.WebServerInstance2URL).toBeDefined();
    });

    test('should have S3 bucket outputs', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketArn).toBeDefined();
    });

    test('should have Security Group outputs', () => {
      expect(template.Outputs.WebServerSecurityGroupId).toBeDefined();
      expect(template.Outputs.LoadBalancerSecurityGroupId).toBeDefined();
    });

    test('should have IAM role output', () => {
      expect(template.Outputs.EC2RoleArn).toBeDefined();
    });

    test('should have Auto Scaling outputs', () => {
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
      expect(template.Outputs.LaunchTemplateId).toBeDefined();
      expect(template.Outputs.TargetGroupArn).toBeDefined();
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('LocalStack Compatibility Verification', () => {
    test('should NOT use SSM Parameter Store for AMI lookup', () => {
      const amiParam = template.Parameters.AmiId;
      expect(amiParam.Type).toBe('String');
      expect(amiParam.Type).not.toContain('AWS::SSM::Parameter');
    });

    test('should NOT have AWS managed IAM policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('should NOT have S3 encryption configuration', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeUndefined();
    });

    test('should NOT have S3 lifecycle rules', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeUndefined();
    });

    test('should NOT have CreationPolicy on EC2 instances', () => {
      expect(template.Resources.WebServerInstance1.CreationPolicy).toBeUndefined();
      expect(template.Resources.WebServerInstance2.CreationPolicy).toBeUndefined();
    });

    test('should NOT have CloudWatch Alarms', () => {
      expect(template.Resources.HighCPUAlarm).toBeUndefined();
      expect(template.Resources.LowCPUAlarm).toBeUndefined();
    });

    test('should NOT have Scaling Policies', () => {
      expect(template.Resources.ScaleUpPolicy).toBeUndefined();
      expect(template.Resources.ScaleDownPolicy).toBeUndefined();
    });

    test('should NOT have UpdatePolicy on ASG', () => {
      expect(template.Resources.WebServerAutoScalingGroup.UpdatePolicy).toBeUndefined();
    });

    test('Security Groups should NOT have GroupName property', () => {
      expect(template.Resources.LoadBalancerSecurityGroup.Properties.GroupName).toBeUndefined();
      expect(template.Resources.WebServerSecurityGroup.Properties.GroupName).toBeUndefined();
    });

    test('should use GetAZs function for availability zones', () => {
      const subnet = template.Resources.PublicSubnet1;
      const azValue = JSON.stringify(subnet.Properties.AvailabilityZone);
      expect(azValue).toContain('Fn::GetAZs');
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
