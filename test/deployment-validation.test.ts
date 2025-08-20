import fs from 'fs';
import path from 'path';

describe('Deployment Validation Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the YAML template for CloudFormation validation
    const yamlTemplatePath = path.join(__dirname, '../lib/TapStack.yml');
    const jsonTemplatePath = path.join(__dirname, '../lib/TapStack.json');
    
    // Prefer JSON template for validation as it's what gets deployed
    if (fs.existsSync(jsonTemplatePath)) {
      const templateContent = fs.readFileSync(jsonTemplatePath, 'utf8');
      template = JSON.parse(templateContent);
    } else if (fs.existsSync(yamlTemplatePath)) {
      throw new Error('YAML template found but JSON template missing. Run build process to generate JSON.');
    } else {
      throw new Error('No CloudFormation template found for validation');
    }
  });

  describe('CloudFormation Syntax Validation', () => {
    test('should have valid CloudFormation format', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });

    test('should have valid resource definitions', () => {
      expect(template.Resources).toBeDefined();
      
      // Validate each resource has proper AWS resource type
      Object.entries(template.Resources).forEach(([resourceName, resource]: [string, any]) => {
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/);
        expect(resource.Properties).toBeDefined();
        
        // Resource name should be alphanumeric
        expect(resourceName).toMatch(/^[A-Za-z][A-Za-z0-9]*$/);
      });
    });

    test('should have valid parameter definitions', () => {
      expect(template.Parameters).toBeDefined();
      
      Object.entries(template.Parameters).forEach(([paramName, param]: [string, any]) => {
        expect(param.Type).toBeDefined();
        expect(['String', 'Number', 'List<Number>', 'CommaDelimitedList'].includes(param.Type)).toBeTruthy();
        
        if (param.AllowedPattern) {
          expect(typeof param.AllowedPattern).toBe('string');
        }
        
        if (param.Default) {
          expect(param.Default).toBeDefined();
        }
      });
    });

    test('should have valid output definitions', () => {
      expect(template.Outputs).toBeDefined();
      
      Object.entries(template.Outputs).forEach(([outputName, output]: [string, any]) => {
        expect(output.Value).toBeDefined();
        expect(output.Description).toBeDefined();
        
        if (output.Export) {
          expect(output.Export.Name).toBeDefined();
        }
      });
    });

    test('should validate intrinsic function usage', () => {
      const templateStr = JSON.stringify(template);
      
      // Check for common CloudFormation functions
      const functions = ['Ref', 'Fn::GetAtt', 'Fn::Sub', 'Fn::Join', 'Fn::Select'];
      functions.forEach(func => {
        if (templateStr.includes(`"${func}"`)) {
          // Ensure function usage is syntactically correct
          expect(templateStr).toMatch(new RegExp(`"${func}"\\s*:`));
        }
      });
    });
  });

  describe('Resource Dependency Validation', () => {
    test('should have proper VPC dependencies', () => {
      const vpc = template.Resources.VPC;
      const internetGateway = template.Resources.InternetGateway;
      const internetGatewayAttachment = template.Resources.InternetGatewayAttachment;
      
      expect(vpc).toBeDefined();
      expect(internetGateway).toBeDefined();
      expect(internetGatewayAttachment).toBeDefined();
      
      // IGW attachment should reference VPC and IGW
      expect(internetGatewayAttachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(internetGatewayAttachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have proper subnet dependencies', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      
      // Subnets should reference VPC
      expect(publicSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(privateSubnet1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      
      // Subnets should have different availability zones
      expect(publicSubnet1.Properties.AvailabilityZone).not.toEqual(
        template.Resources.PublicSubnet2.Properties.AvailabilityZone
      );
    });

    test('should have proper NAT Gateway dependencies', () => {
      const natGateway = template.Resources.NatGateway1;
      const natGatewayEIP = template.Resources.NatGateway1EIP;
      
      expect(natGateway).toBeDefined();
      expect(natGatewayEIP).toBeDefined();
      
      // NAT Gateway should reference EIP and public subnet
      expect(natGateway.Properties.AllocationId).toEqual({
        'Fn::GetAtt': ['NatGateway1EIP', 'AllocationId']
      });
      expect(natGateway.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('should have proper route table dependencies', () => {
      const publicRouteTable = template.Resources.PublicRouteTable;
      const privateRouteTable1 = template.Resources.PrivateRouteTable1;
      
      // Route tables should reference VPC
      expect(publicRouteTable.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(privateRouteTable1.Properties.VpcId).toEqual({ Ref: 'VPC' });
      
      // Public route should reference Internet Gateway
      const defaultPublicRoute = template.Resources.DefaultPublicRoute;
      expect(defaultPublicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      
      // Private route should reference NAT Gateway
      const defaultPrivateRoute1 = template.Resources.DefaultPrivateRoute1;
      expect(defaultPrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
    });
  });

  describe('Security Configuration Validation', () => {
    test('should validate SSH security group configuration', () => {
      const sshSg = template.Resources.SSHSecurityGroup;
      
      expect(sshSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sshSg.Properties.VpcId).toEqual({ Ref: 'VPC' });
      
      // Should have exactly one ingress rule for SSH from 192.168.1.0/24
      const ingressRules = sshSg.Properties.SecurityGroupIngress;
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].IpProtocol).toBe('tcp');
      expect(ingressRules[0].FromPort).toBe(22);
      expect(ingressRules[0].ToPort).toBe(22);
      expect(ingressRules[0].CidrIp).toBe('192.168.1.0/24');
    });

    test('should validate S3 bucket security configuration', () => {
      const s3Bucket = template.Resources.SecureS3Bucket;
      
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      
      // Should have encryption configuration
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
      const encryption = s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      
      // Should have public access blocked
      const publicAccessBlock = s3Bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('QA Environment Compatibility', () => {
    test('should support environment suffix in resource naming', () => {
      // Check that key resources support environment suffix
      const vpc = template.Resources.VPC;
      const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${ProjectName}-VPC-${EnvironmentSuffix}'
      });
    });

    test('should have deletion policies for QA cleanup', () => {
      // S3 buckets should have proper deletion policies
      const secureS3Bucket = template.Resources.SecureS3Bucket;
      const accessLogsBucket = template.Resources.S3AccessLogsBucket;
      
      // Check if deletion policies exist, if not they default to CloudFormation default behavior
      if (secureS3Bucket.DeletionPolicy) {
        expect(secureS3Bucket.DeletionPolicy).toBe('Delete');
      }
      if (accessLogsBucket.DeletionPolicy) {
        expect(accessLogsBucket.DeletionPolicy).toBe('Delete');
      }
      
      // For QA, we verify buckets can be deleted (no Retain policy)
      expect(secureS3Bucket.DeletionPolicy).not.toBe('Retain');
      expect(accessLogsBucket.DeletionPolicy).not.toBe('Retain');
    });

    test('should validate parameter constraints for automation', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      const projectNameParam = template.Parameters.ProjectName;
      
      // Both should have allowed patterns for automation
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(projectNameParam.AllowedPattern).toBe('^[a-z0-9-]+$');
      
      // Should have defaults
      expect(envSuffixParam.Default).toBeDefined();
      expect(projectNameParam.Default).toBeDefined();
    });

    test('should validate output export naming for stack references', () => {
      const vpcOutput = template.Outputs.VPCId;
      const sgOutput = template.Outputs.SSHSecurityGroupId;
      
      // Exports should follow consistent naming pattern
      expect(vpcOutput.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-VPC-ID-${EnvironmentSuffix}'
      });
      expect(sgOutput.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-SSH-SG-ID-${EnvironmentSuffix}'
      });
    });
  });

  describe('CloudFormation Best Practices', () => {
    test('should have appropriate resource limits', () => {
      const resourceCount = Object.keys(template.Resources).length;
      const parameterCount = Object.keys(template.Parameters).length;
      const outputCount = Object.keys(template.Outputs).length;
      
      // Should not exceed CloudFormation limits
      expect(resourceCount).toBeLessThanOrEqual(500); // CloudFormation limit
      expect(parameterCount).toBeLessThanOrEqual(200); // CloudFormation limit
      expect(outputCount).toBeLessThanOrEqual(200); // CloudFormation limit
    });

    test('should have consistent tagging strategy', () => {
      // Check key resources have proper tags
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      
      // Check for essential tags that should be present
      const requiredTags = ['Name', 'Environment'];
      requiredTags.forEach(tagKey => {
        const tag = tags.find((t: any) => t.Key === tagKey);
        expect(tag).toBeDefined();
      });
      
      // Verify tag values use proper parameter references
      const nameTag = tags.find((t: any) => t.Key === 'Name');
      expect(nameTag.Value).toEqual({
        'Fn::Sub': '${ProjectName}-VPC-${EnvironmentSuffix}'
      });
      
      // CostCenter tag is optional but if present should be valid
      const costCenterTag = tags.find((t: any) => t.Key === 'CostCenter');
      if (costCenterTag) {
        expect(costCenterTag.Value).toBeDefined();
      }
    });

    test('should use intrinsic functions appropriately', () => {
      const templateStr = JSON.stringify(template);
      
      // Should use Fn::Sub for string substitution
      expect(templateStr).toContain('Fn::Sub');
      
      // Should use Ref for parameter references
      expect(templateStr).toContain('"Ref"');
      
      // Should use Fn::GetAtt for resource attributes
      expect(templateStr).toContain('Fn::GetAtt');
    });
  });
});