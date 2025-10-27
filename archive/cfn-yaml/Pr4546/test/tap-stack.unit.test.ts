import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Write Integration TESTS', () => {
    test('Dont forget!', async () => {
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
        'Secure AWS Environment - Complete Security Configuration Template'
      );
    });

    test('should have mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.SubnetConfig).toBeDefined();
    });

    test('should have conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasDomainName).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have core infrastructure parameters', () => {
      expect(template.Parameters.VpcCidrBlock).toBeDefined();
      expect(template.Parameters.SshAllowedCidr).toBeDefined();
      // DbInstanceClass parameter removed - now using environment-based mappings for cost optimization
      expect(template.Parameters.DbMasterUsername).toBeDefined();
      expect(template.Parameters.DomainName).toBeDefined();
    });

    test('should have tagging parameters', () => {
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('VpcCidrBlock parameter should have correct properties', () => {
      const param = template.Parameters.VpcCidrBlock;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.Description).toBe('CIDR block for the VPC');
    });

    test('Environment parameter should have allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Development'); // Changed for cost optimization
      expect(param.AllowedValues).toEqual(['Development', 'Staging', 'Production']);
    });

    test('should have exactly 8 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8); // Reduced from 9 due to DbInstanceClass removal
    });
  });

  describe('Resources', () => {
    test('should have core infrastructure resources', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have security resources', () => {
      expect(template.Resources.S3KmsKey).toBeDefined();
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.WAFWebACL).toBeDefined();
    });

    test('should have application resources', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.RDSInstance).toBeDefined();
    });

    test('should have monitoring and compliance resources', () => {
      expect(template.Resources.CloudTrail).toBeDefined();
      expect(template.Resources.CloudTrailBucket).toBeDefined();
      expect(template.Resources.ConfigRecorder).toBeDefined();
      expect(template.Resources.ConfigBucket).toBeDefined();
      expect(template.Resources.RootAccountUsageAlarm).toBeDefined();
      expect(template.Resources.IAMPolicyChangesAlarm).toBeDefined();
    });

    test('VPC should have correct type and properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('S3KmsKey should be a KMS key', () => {
      const key = template.Resources.S3KmsKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.Description).toBe('KMS key for S3 bucket encryption');
    });

    test('RDSInstance should have correct properties', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      // MultiAZ is now environment-dependent for cost optimization
      expect(rds.Properties.MultiAZ).toBeDefined();
    });

    test('WAFWebACL should have correct scope', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'CloudTrailBucketName',
        'ConfigBucketName',
        'RDSEndpoint',
        'WAFWebACLId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-vpc-id',
      });
    });

    test('ALBDNSName output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-alb-dns',
      });
    });

    test('RDSEndpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('RDS Instance Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-rds-endpoint',
      });
    });

    test('WAFWebACLId output should be correct', () => {
      const output = template.Outputs.WAFWebACLId;
      expect(output.Description).toBe('WAF Web ACL ID');
      expect(output.Value).toEqual({ Ref: 'WAFWebACL' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-waf-acl-id',
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
      expect(template.Mappings).not.toBeNull();
      expect(template.Conditions).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Infrastructure template has many resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(8); // Reduced from 9 due to DbInstanceClass removal for cost optimization
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });

    test('should have conditions for optional resources', () => {
      expect(template.Conditions.HasDomainName).toBeDefined();
    });

    test('should have subnet configuration mappings', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });
  });

  describe('Security Configuration', () => {
    test('should have KMS encryption configured', () => {
      const kmsKey = template.Resources.S3KmsKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have WAF protection configured', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('should have security groups configured', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
    });

    test('should have CloudTrail logging configured', () => {
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail).toBeDefined();
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have AWS Config compliance monitoring', () => {
      expect(template.Resources.ConfigRecorder).toBeDefined();
      expect(template.Resources.S3BucketPublicReadProhibited).toBeDefined();
      expect(template.Resources.EncryptedVolumes).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('resource names should use stack name for uniqueness', () => {
      const resources = template.Resources;
      
      // Check that key resources use stack name in their naming
      expect(resources.ApplicationLoadBalancer.Properties.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-alb',
      });
      
      expect(resources.AutoScalingGroup.Properties.AutoScalingGroupName).toEqual({
        'Fn::Sub': '${AWS::StackName}-asg',
      });
      
      expect(resources.WAFWebACL.Properties.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-${AWS::AccountId}-web-acl',
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual(
          expect.objectContaining({
            'Fn::Sub': expect.stringMatching(/^\${AWS::StackName}-.+/)
          })
        );
      });
    });
  });

  describe('Cost Optimization Features', () => {
    test('should have environment-based cost optimization mappings', () => {
      expect(template.Mappings.InstanceTypeMapping).toBeDefined();
      expect(template.Mappings.RDSConfig).toBeDefined();
      
      // Verify cost optimization for different environments
      expect(template.Mappings.InstanceTypeMapping.Development.OnDemandPercentage).toBe(0);
      expect(template.Mappings.InstanceTypeMapping.Production.OnDemandPercentage).toBe(50);
    });

    test('should have cost optimization conditions', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsNotDevelopment).toBeDefined();
      expect(template.Conditions.EnablePerformanceInsights).toBeDefined();
    });

    test('AutoScalingGroup should use MixedInstancesPolicy for cost optimization', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MixedInstancesPolicy).toBeDefined();
      expect(asg.Properties.MixedInstancesPolicy.InstancesDistribution).toBeDefined();
      expect(asg.Properties.MixedInstancesPolicy.LaunchTemplate.Overrides).toBeDefined();
    });

    test('should have target tracking scaling policy', () => {
      const scalingPolicy = template.Resources.AutoScalingPolicy;
      expect(scalingPolicy.Type).toBe('AWS::AutoScaling::ScalingPolicy');
      expect(scalingPolicy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('RDS should use environment-based configuration for cost optimization', () => {
      const rds = template.Resources.RDSInstance;
      // Verify that instance class comes from mapping
      expect(rds.Properties.DBInstanceClass).toEqual({
        'Fn::FindInMap': ['RDSConfig', { 'Ref': 'Environment' }, 'InstanceClass']
      });
      // Verify storage autoscaling
      expect(rds.Properties.MaxAllocatedStorage).toBeDefined();
    });

    test('NAT Gateway should have conditional deployment for cost optimization', () => {
      const natGateway2 = template.Resources.NatGateway2;
      expect(natGateway2.Condition).toBe('IsNotDevelopment');
      
      const natGateway2EIP = template.Resources.NatGateway2EIP;
      expect(natGateway2EIP.Condition).toBe('IsNotDevelopment');
    });

    test('Launch Template should use ARM-based Graviton instances', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      const imageId = launchTemplate.Properties.LaunchTemplateData.ImageId;
      // Should use ARM64 AMI for Graviton2 instances
      expect(imageId).toContain('arm64');
    });
  });
});
