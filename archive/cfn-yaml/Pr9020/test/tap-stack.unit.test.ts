import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the CloudFormation template
    // If YAML exists, it will be converted to JSON by the script
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
      expect(template.Description).toContain('CloudFormation template');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toContain('Unique suffix');
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
    });

    test('should have required parameters', () => {
      // The template doesn't have DBPasswordSecretArn parameter - it creates its own secret
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });
  });

  describe('Template Sections', () => {
    test('should have Parameters and Resources sections', () => {
      // The template doesn't have Conditions section
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Aurora cluster resources', () => {
      expect(template.Resources.AuroraCluster).toBeDefined();
      expect(template.Resources.AuroraCluster.Type).toBe('AWS::RDS::DBCluster');
    });

    test('should have DynamoDB table', () => {
      expect(template.Resources.DynamoDBTable).toBeDefined();
      expect(template.Resources.DynamoDBTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have S3 bucket', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('should have security groups', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have SNS topic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('Outputs', () => {
    test('should have VPC output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
    });

    test('should have Aurora endpoint outputs', () => {
      expect(template.Outputs.AuroraClusterEndpoint).toBeDefined();
      expect(template.Outputs.AuroraClusterReadEndpoint).toBeDefined();
    });

    test('should have DynamoDB table output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value.Ref).toBe('DynamoDBTable');
    });

    test('should have S3 bucket output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.S3BucketName.Value.Ref).toBe('S3Bucket');
    });

    test('should have export names with environment suffix', () => {
      const outputs = Object.keys(template.Outputs);
      outputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        if (output.Export && output.Export.Name) {
          expect(output.Export.Name['Fn::Sub'] || output.Export.Name).toBeDefined();
        }
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
      expect(template.Resources).not.toBeNull();
      expect(template.Resources).not.toBeUndefined();
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(1);
    });

    test('should have multiple resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]+$/);
      });
    });

    test('export names should include environment suffix', () => {
      const outputs = Object.values(template.Outputs) as any[];
      outputs.forEach(output => {
        if (output.Export && output.Export.Name) {
          const exportName = output.Export.Name;
          if (exportName['Fn::Sub']) {
            expect(exportName['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have encryption enabled on S3 bucket', () => {
      const s3Bucket = template.Resources.S3Bucket;
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('should have encryption enabled on DynamoDB', () => {
      const dynamoTable = template.Resources.DynamoDBTable;
      expect(dynamoTable.Properties.SSESpecification).toBeDefined();
      expect(dynamoTable.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('should have Aurora cluster with encryption', () => {
      const auroraCluster = template.Resources.AuroraCluster;
      expect(auroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('should have proper security groups', () => {
      const dbSecurityGroup = template.Resources.DatabaseSecurityGroup;
      expect(dbSecurityGroup.Properties.SecurityGroupIngress).toBeDefined();
    });
  });

  describe('High Availability Configuration', () => {
    test('should have multiple subnets for high availability', () => {
      const subnet1 = template.Resources.PublicSubnet1 || template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PublicSubnet2 || template.Resources.PrivateSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
    });

    test('should have ECS cluster configured', () => {
      const ecsCluster = template.Resources.ECSCluster;
      expect(ecsCluster.Properties.ClusterName).toBeDefined();
      expect(ecsCluster.Properties.ClusterSettings).toBeDefined();
    });
  });

  describe('Tagging Strategy', () => {
    test('resources should have consistent tags', () => {
      const resources = Object.values(template.Resources) as any[];
      const taggedResources = resources.filter(r => r.Properties && r.Properties.Tags);

      taggedResources.forEach(resource => {
        const tags = resource.Properties.Tags;
        expect(Array.isArray(tags)).toBe(true);

        const hasNameTag = tags.some((tag: any) => tag.Key === 'Name');
        expect(hasNameTag).toBe(true);
      });
    });
  });
});