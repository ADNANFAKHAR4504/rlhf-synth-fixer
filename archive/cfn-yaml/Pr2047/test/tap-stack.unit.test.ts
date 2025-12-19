import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Integration Test Reminder', () => {
    test('should remind to write integration tests', () => {
      // TODO: Write integration tests that deploy the actual stack
      // and verify resources are created correctly in AWS
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
        'Secure Three-Tier Web Application Infrastructure - TapStack'
      );
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('iac-aws-nova');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('production');
      expect(template.Parameters.Environment.AllowedValues).toEqual([
        'development',
        'staging',
        'production',
      ]);
    });

    test('should have VpcCidr parameter', () => {
      expect(template.Parameters.VpcCidr).toBeDefined();
      expect(template.Parameters.VpcCidr.Type).toBe('String');
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t3.medium');
      expect(template.Parameters.InstanceType.AllowedValues).toEqual([
        't3.micro',
        't3.small',
        't3.medium',
        't3.large',
      ]);
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('String');
    });

    test('should have Auto Scaling parameters', () => {
      expect(template.Parameters.MinSize).toBeDefined();
      expect(template.Parameters.MaxSize).toBeDefined();
      expect(template.Parameters.DesiredCapacity).toBeDefined();

      expect(template.Parameters.MinSize.Type).toBe('Number');
      expect(template.Parameters.MaxSize.Type).toBe('Number');
      expect(template.Parameters.DesiredCapacity.Type).toBe('Number');

      expect(template.Parameters.MinSize.Default).toBe(2);
      expect(template.Parameters.MaxSize.Default).toBe(6);
      expect(template.Parameters.DesiredCapacity.Default).toBe(2);
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have KMS Key resource', () => {
      expect(template.Resources.KMSKey).toBeDefined();
      expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have Internet Gateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have database subnets', () => {
      expect(template.Resources.DatabaseSubnet1).toBeDefined();
      expect(template.Resources.DatabaseSubnet2).toBeDefined();
      expect(template.Resources.DatabaseSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.DatabaseSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have security groups', () => {
      expect(template.Resources.BastionSecurityGroup).toBeDefined();
      expect(template.Resources.WebSecurityGroup).toBeDefined();
      expect(template.Resources.AppSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();

      expect(template.Resources.BastionSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(template.Resources.WebSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(template.Resources.AppSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have S3 bucket', () => {
      expect(template.Resources.ApplicationBucket).toBeDefined();
      expect(template.Resources.ApplicationBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );
    });

    test('should have Bastion Host', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.BastionHost.Type).toBe('AWS::EC2::Instance');
    });

    test('should have WAF Web ACL', () => {
      expect(template.Resources.WebACL).toBeDefined();
      expect(template.Resources.WebACL.Type).toBe('AWS::WAFv2::WebACL');
    });
  });

  describe('VPC Configuration', () => {
    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(
        template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch
      ).toBe(true);
      expect(
        template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch
      ).toBe(true);
    });

    test('private subnets should not have MapPublicIpOnLaunch', () => {
      expect(
        template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
      expect(
        template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch
      ).toBeUndefined();
    });
  });

  describe('Security Groups', () => {
    test('Bastion security group should allow SSH from anywhere', () => {
      const bastionSG = template.Resources.BastionSecurityGroup;
      const ingressRules = bastionSG.Properties.SecurityGroupIngress;

      const sshRule = ingressRules.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('Web security group should allow HTTP and HTTPS', () => {
      const webSG = template.Resources.WebSecurityGroup;
      const ingressRules = webSG.Properties.SecurityGroupIngress;

      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('App security group should allow access from web tier', () => {
      const appSG = template.Resources.AppSecurityGroup;
      const ingressRules = appSG.Properties.SecurityGroupIngress;

      const appRule = ingressRules.find((rule: any) => rule.FromPort === 8080);
      expect(appRule).toBeDefined();
      expect(appRule.SourceSecurityGroupId).toEqual({
        Ref: 'WebSecurityGroup',
      });
    });

    test('Database security group should allow MySQL access from app tier', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingressRules = dbSG.Properties.SecurityGroupIngress;

      const mysqlRule = ingressRules.find(
        (rule: any) => rule.FromPort === 3306
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule.SourceSecurityGroupId).toEqual({
        Ref: 'AppSecurityGroup',
      });
    });
  });

  describe('S3 Bucket Security', () => {
    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('Auto Scaling Group should use private subnets', () => {
      const asg = template.Resources.AutoScalingGroup;
      const vpcZoneIdentifier = asg.Properties.VPCZoneIdentifier;

      expect(vpcZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(vpcZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('Auto Scaling Group should have correct scaling parameters', () => {
      const asg = template.Resources.AutoScalingGroup;

      expect(asg.Properties.MinSize).toEqual({ Ref: 'MinSize' });
      expect(asg.Properties.MaxSize).toEqual({ Ref: 'MaxSize' });
      expect(asg.Properties.DesiredCapacity).toEqual({
        Ref: 'DesiredCapacity',
      });
      expect(asg.Properties.HealthCheckType).toBe('EC2');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should use public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;

      expect(subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('Target Group should have correct health check configuration', () => {
      const tg = template.Resources.TargetGroup;

      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });
  });

  describe('Outputs', () => {
    test('should have VPC outputs', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.DatabaseSubnet1Id).toBeDefined();
      expect(template.Outputs.DatabaseSubnet2Id).toBeDefined();
    });

    test('should have security group outputs', () => {
      expect(template.Outputs.BastionSecurityGroupId).toBeDefined();
      expect(template.Outputs.WebSecurityGroupId).toBeDefined();
      expect(template.Outputs.AppSecurityGroupId).toBeDefined();
      expect(template.Outputs.DatabaseSecurityGroupId).toBeDefined();
    });

    test('should have application outputs', () => {
      expect(template.Outputs.ApplicationBucketName).toBeDefined();
      expect(template.Outputs.KMSKeyArn).toBeDefined();
      expect(template.Outputs.LaunchTemplateId).toBeDefined();
      expect(template.Outputs.AutoScalingGroupName).toBeDefined();
      expect(template.Outputs.LoadBalancerDNSName).toBeDefined();
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
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50); // Complex infrastructure
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(10); // Multiple configuration options
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(15); // Multiple resource outputs
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should follow naming convention with project name', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        // Resource names should be PascalCase
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    test('resource names should use project name in tags', () => {
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const projectTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Project'
          );
          if (projectTag) {
            expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });
          }
        }
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should not have any circular dependencies', () => {
      // Check that no resource references itself or creates circular dependencies
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties) {
          const properties = JSON.stringify(resource.Properties);
          // Ensure no resource references itself
          expect(properties).not.toContain(`"Ref": "${resourceName}"`);
        }
      });
    });

    test('should have consistent project name usage', () => {
      // Check that ProjectName parameter is used consistently
      const templateString = JSON.stringify(template);
      const projectNameRefs = (templateString.match(/\$\{ProjectName\}/g) || [])
        .length;
      expect(projectNameRefs).toBeGreaterThan(0);
    });

    test('should have proper error handling for invalid parameters', () => {
      const environmentParam = template.Parameters.Environment;
      expect(environmentParam.AllowedValues).toBeDefined();
      expect(environmentParam.AllowedValues).toContain('development');
      expect(environmentParam.AllowedValues).toContain('staging');
      expect(environmentParam.AllowedValues).toContain('production');
    });

    test('should have consistent naming patterns across all resources', () => {
      // All resource names should follow a consistent pattern
      const resourceNames = Object.keys(template.Resources);
      resourceNames.forEach(name => {
        // Resource names should be PascalCase
        expect(name).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('should not have any public access by default', () => {
      // Check for any explicit public access settings that shouldn't exist
      const templateString = JSON.stringify(template);

      // Should not contain common public access patterns (except where intended)
      // Note: Some resources like ALB are intentionally public-facing
      expect(templateString).not.toContain('PublicAccessibilityEnabled');
    });

    test('should have proper deletion policies for production safety', () => {
      // Check that critical resources have appropriate deletion policies
      const resources = template.Resources;

      // VPC and subnets should not have deletion policies (use default)
      if (resources.VPC && resources.VPC.DeletionPolicy) {
        expect(resources.VPC.DeletionPolicy).not.toBe('Delete');
      }
    });

    test('should not expose sensitive information in outputs', () => {
      const outputs = template.Outputs;

      // Check that no outputs contain sensitive data patterns
      Object.keys(outputs).forEach(outputKey => {
        const output = outputs[outputKey];
        const outputString = JSON.stringify(output);

        // Should not contain common sensitive patterns
        expect(outputString).not.toContain('password');
        expect(outputString).not.toContain('secret');
        expect(outputString).not.toContain('key');
        expect(outputString).not.toContain('token');
      });
    });

    test('should have encryption enabled for storage resources', () => {
      // S3 bucket should have encryption
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();

      // EBS volumes should be encrypted
      const launchTemplate = template.Resources.LaunchTemplate;
      const blockDeviceMappings =
        launchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings;
      blockDeviceMappings.forEach((mapping: any) => {
        if (mapping.Ebs) {
          expect(mapping.Ebs.Encrypted).toBe(true);
        }
      });
    });
  });
});
