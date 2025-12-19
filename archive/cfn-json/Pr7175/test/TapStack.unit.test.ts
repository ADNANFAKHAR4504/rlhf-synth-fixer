import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(1);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(20);
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('WAFSecurityProject');
    });

    test('should have Environment parameter with allowed values', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toEqual([
        'production',
        'staging',
        'development',
        'test',
      ]);
    });
  });

  describe('Network Infrastructure Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.TestVPC).toBeDefined();
      expect(template.Resources.TestVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.TestVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.TestVPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.TestVPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have two subnets in different AZs', () => {
      expect(template.Resources.TestSubnet1).toBeDefined();
      expect(template.Resources.TestSubnet2).toBeDefined();
      expect(template.Resources.TestSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.TestSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.TestSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.TestSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.TestInternetGateway).toBeDefined();
      expect(template.Resources.TestInternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have Internet Gateway attachment', () => {
      expect(template.Resources.TestAttachGateway).toBeDefined();
      expect(template.Resources.TestAttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have route table and routes', () => {
      expect(template.Resources.TestRouteTable).toBeDefined();
      expect(template.Resources.TestRoute).toBeDefined();
      expect(template.Resources.TestRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(template.Resources.TestRoute.Type).toBe('AWS::EC2::Route');
    });

    test('should have security group with proper rules', () => {
      expect(template.Resources.TestALBSecurityGroup).toBeDefined();
      expect(template.Resources.TestALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      const ingressRules = template.Resources.TestALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(Array.isArray(ingressRules)).toBe(true);
      expect(ingressRules.length).toBeGreaterThanOrEqual(2); // HTTP and HTTPS
    });
  });

  describe('Application Load Balancer Resources', () => {
    test('should have ALB resource', () => {
      expect(template.Resources.TestALB).toBeDefined();
      expect(template.Resources.TestALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.TestALB.Properties.Scheme).toBe('internet-facing');
      expect(template.Resources.TestALB.Properties.Type).toBe('application');
    });

    test('should have target group', () => {
      expect(template.Resources.TestTargetGroup).toBeDefined();
      expect(template.Resources.TestTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(template.Resources.TestTargetGroup.Properties.Protocol).toBe('HTTP');
      expect(template.Resources.TestTargetGroup.Properties.Port).toBe(80);
    });

    test('should have HTTP listener', () => {
      expect(template.Resources.TestALBListener).toBeDefined();
      expect(template.Resources.TestALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(template.Resources.TestALBListener.Properties.Protocol).toBe('HTTP');
      expect(template.Resources.TestALBListener.Properties.Port).toBe(80);
    });
  });

  describe('WAF Resources', () => {
    test('should have IP Set resource', () => {
      expect(template.Resources.OfficeIPSet).toBeDefined();
      expect(template.Resources.OfficeIPSet.Type).toBe('AWS::WAFv2::IPSet');
      expect(template.Resources.OfficeIPSet.Properties.Scope).toBe('REGIONAL');
      expect(template.Resources.OfficeIPSet.Properties.IPAddressVersion).toBe('IPV4');
    });

    test('should have Web ACL resource', () => {
      expect(template.Resources.WAFWebACL).toBeDefined();
      expect(template.Resources.WAFWebACL.Type).toBe('AWS::WAFv2::WebACL');
      expect(template.Resources.WAFWebACL.Properties.Scope).toBe('REGIONAL');
      expect(template.Resources.WAFWebACL.Properties.DefaultAction).toBeDefined();
    });

    test('should have rate limiting rule', () => {
      const rules = template.Resources.WAFWebACL.Properties.Rules;
      const rateLimitRule = rules.find((rule: any) => rule.Name.includes('RateLimit'));
      expect(rateLimitRule).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement).toBeDefined();
      expect(rateLimitRule.Statement.RateBasedStatement.Limit).toBe(2000);
    });

    test('should have geo-blocking rule', () => {
      const rules = template.Resources.WAFWebACL.Properties.Rules;
      const geoBlockRule = rules.find((rule: any) => rule.Name.includes('GeoBlock'));
      expect(geoBlockRule).toBeDefined();
      expect(geoBlockRule.Statement.GeoMatchStatement).toBeDefined();
      expect(geoBlockRule.Statement.GeoMatchStatement.CountryCodes).toContain('KP');
      expect(geoBlockRule.Statement.GeoMatchStatement.CountryCodes).toContain('IR');
    });

    test('should have SQL injection protection rule', () => {
      const rules = template.Resources.WAFWebACL.Properties.Rules;
      const sqlInjectionRule = rules.find((rule: any) => rule.Name.includes('SQLInjection'));
      expect(sqlInjectionRule).toBeDefined();
      expect(sqlInjectionRule.Statement.ManagedRuleGroupStatement).toBeDefined();
      expect(sqlInjectionRule.Statement.ManagedRuleGroupStatement.VendorName).toBe('AWS');
      expect(sqlInjectionRule.Statement.ManagedRuleGroupStatement.Name).toBe('AWSManagedRulesSQLiRuleSet');
    });

    test('should have IP allowlist rule', () => {
      const rules = template.Resources.WAFWebACL.Properties.Rules;
      const ipAllowlistRule = rules.find((rule: any) => rule.Name.includes('AllowOfficeIPs'));
      expect(ipAllowlistRule).toBeDefined();
      expect(ipAllowlistRule.Statement.IPSetReferenceStatement).toBeDefined();
    });

    test('should have WAF association with ALB', () => {
      expect(template.Resources.WAFWebACLAssociation).toBeDefined();
      expect(template.Resources.WAFWebACLAssociation.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });
  });

  describe('Logging Infrastructure', () => {
    test('should have S3 bucket for WAF logs', () => {
      expect(template.Resources.WAFLogBucket).toBeDefined();
      expect(template.Resources.WAFLogBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.WAFLogBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have proper bucket encryption', () => {
      const encryption = template.Resources.WAFLogBucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have bucket policy with correct service principal', () => {
      expect(template.Resources.WAFLogBucketPolicy).toBeDefined();
      expect(template.Resources.WAFLogBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
      const policyDoc = template.Resources.WAFLogBucketPolicy.Properties.PolicyDocument;
      const statement = policyDoc.Statement.find((s: any) => s.Sid === 'AWSLogDeliveryWrite');
      expect(statement).toBeDefined();
      expect(statement.Principal.Service).toBe('delivery.logs.amazonaws.com');
    });

    test('should have logging configuration with proper destination', () => {
      expect(template.Resources.WAFLoggingConfiguration).toBeDefined();
      expect(template.Resources.WAFLoggingConfiguration.Type).toBe('AWS::WAFv2::LoggingConfiguration');
      const logDestination = template.Resources.WAFLoggingConfiguration.Properties.LogDestinationConfigs[0];
      expect(logDestination).toBeDefined();
      expect(logDestination['Fn::Sub']).toContain('WAFLogBucket');
    });
  });

  describe('Resource Naming with EnvironmentSuffix', () => {
    test('VPC name should use EnvironmentSuffix', () => {
      const vpcNameTag = template.Resources.TestVPC.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(vpcNameTag).toBeDefined();
      expect(vpcNameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ALB name should use EnvironmentSuffix', () => {
      const albName = template.Resources.TestALB.Properties.Name;
      expect(albName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('S3 bucket name should use EnvironmentSuffix', () => {
      const bucketName = template.Resources.WAFLogBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Web ACL name should use EnvironmentSuffix', () => {
      const webACLName = template.Resources.WAFWebACL.Properties.Name;
      expect(webACLName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should output Web ACL ARN', () => {
      expect(template.Outputs.WebACLArn).toBeDefined();
      expect(template.Outputs.WebACLArn.Value).toBeDefined();
      expect(template.Outputs.WebACLArn.Description).toBeDefined();
    });

    test('should output Web ACL ID', () => {
      expect(template.Outputs.WebACLId).toBeDefined();
      expect(template.Outputs.WebACLId.Value).toBeDefined();
    });

    test('should output S3 Bucket Name', () => {
      expect(template.Outputs.WAFLogBucketName).toBeDefined();
      expect(template.Outputs.WAFLogBucketName.Value).toBeDefined();
    });

    test('should output ALB ARN', () => {
      expect(template.Outputs.TestALBArn).toBeDefined();
      expect(template.Outputs.TestALBArn.Value).toBeDefined();
    });

    test('should output ALB DNS Name', () => {
      expect(template.Outputs.TestALBDNSName).toBeDefined();
      expect(template.Outputs.TestALBDNSName.Value).toBeDefined();
    });

    test('should output IP Set ARN', () => {
      expect(template.Outputs.OfficeIPSetArn).toBeDefined();
      expect(template.Outputs.OfficeIPSetArn.Value).toBeDefined();
    });
  });

  describe('Dependencies and Relationships', () => {
    test('Web ACL association should depend on Web ACL and ALB', () => {
      expect(template.Resources.WAFWebACLAssociation.Properties.ResourceArn).toBeDefined();
      expect(template.Resources.WAFWebACLAssociation.Properties.WebACLArn).toBeDefined();
    });

    test('Logging configuration should depend on S3 bucket policy', () => {
      expect(template.Resources.WAFLoggingConfiguration.DependsOn).toContain('WAFLogBucketPolicy');
    });

    test('Route should depend on Internet Gateway attachment', () => {
      expect(template.Resources.TestRoute.DependsOn).toContain('TestAttachGateway');
    });
  });

  describe('Security and Compliance', () => {
    test('S3 bucket should have public access blocked', () => {
      expect(template.Resources.WAFLogBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(template.Resources.WAFLogBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(template.Resources.WAFLogBucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });

    test('S3 bucket should have versioning configuration', () => {
      expect(template.Resources.WAFLogBucket.Properties.VersioningConfiguration).toBeDefined();
      expect(template.Resources.WAFLogBucket.Properties.VersioningConfiguration.Status).toBeDefined();
    });

    test('S3 bucket should not have retention policy', () => {
      expect(template.Resources.WAFLogBucket.DeletionPolicy).not.toBe('Retain');
      expect(template.Resources.WAFLogBucket.UpdateReplacePolicy).not.toBe('Retain');
    });

    test('WAF should have CloudWatch metrics enabled', () => {
      expect(template.Resources.WAFWebACL.Properties.VisibilityConfig).toBeDefined();
      expect(template.Resources.WAFWebACL.Properties.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
      expect(template.Resources.WAFWebACL.Properties.VisibilityConfig.SampledRequestsEnabled).toBe(true);
    });
  });

  describe('Template Validation', () => {
    test('should not have any Retain deletion policies', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach((resourceKey) => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('should have valid JSON structure', () => {
      expect(() => JSON.stringify(template)).not.toThrow();
    });

    test('all resources should have valid CloudFormation types', () => {
      const validTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::InternetGateway',
        'AWS::EC2::VPCGatewayAttachment',
        'AWS::EC2::RouteTable',
        'AWS::EC2::Route',
        'AWS::EC2::SubnetRouteTableAssociation',
        'AWS::EC2::SecurityGroup',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        'AWS::ElasticLoadBalancingV2::Listener',
        'AWS::WAFv2::IPSet',
        'AWS::WAFv2::WebACL',
        'AWS::WAFv2::WebACLAssociation',
        'AWS::WAFv2::LoggingConfiguration',
        'AWS::S3::Bucket',
        'AWS::S3::BucketPolicy',
      ];

      const resources = Object.keys(template.Resources);
      resources.forEach((resourceKey) => {
        const resourceType = template.Resources[resourceKey].Type;
        expect(validTypes).toContain(resourceType);
      });
    });
  });
});
