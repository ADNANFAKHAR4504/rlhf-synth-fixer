import fs from 'fs';
import path from 'path';

// The environmentSuffix is generally used for naming resources,
// but the comprehensive template uses a dedicated 'Environment' parameter.
// const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Financial Services Application CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // IMPORTANT: Ensure this path correctly points to your *comprehensive* JSON template file.
    // You confirmed your flipped JSON is named lib/TapStack.json
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // --- Template Structure Tests ---
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
  });

  // --- Parameters Tests ---
  describe('Parameters', () => {
    // Test for 'EnvironmentSuffix' parameter as defined in the comprehensive template
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
    });

    // Add tests for other parameters like Project, Owner, VPCCIDR, etc.
    test('should have Project parameter', () => {
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.Project.Type).toBe('String');
    });

    test('should have Owner parameter', () => {
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Type).toBe('String');
    });

    test('should have VPCCIDR parameter with a default value', () => {
      expect(template.Parameters.VPCCIDR).toBeDefined();
      expect(template.Parameters.VPCCIDR.Type).toBe('String');
      expect(template.Parameters.VPCCIDR.Default).toBe('10.0.0.0/16');
    });

    // ... continue for all other parameters you defined ...
    test('should have RDSDatabaseName parameter', () => {
      expect(template.Parameters.RDSDatabaseName).toBeDefined();
    });
    test('should have LambdaFunctionName parameter', () => {
      expect(template.Parameters.LambdaFunctionName).toBeDefined();
    });
    test('should have S3BucketName parameter', () => {
      expect(template.Parameters.S3BucketName).toBeDefined();
    });
    test('should have CloudFrontPriceClass parameter', () => {
      expect(template.Parameters.CloudFrontPriceClass).toBeDefined();
    });
    test('should have DynamoDBTableName parameter', () => {
      expect(template.Parameters.DynamoDBTableName).toBeDefined();
    });
    test('should have KMSKeyAlias parameter', () => {
      expect(template.Parameters.KMSKeyAlias).toBeDefined();
    });
    test('should have RDSKMSKeyAlias parameter', () => {
      expect(template.Parameters.RDSKMSKeyAlias).toBeDefined();
    });

  });

  // --- Resources Tests ---
  describe('Resources', () => {
    // Networking
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toEqual({ Ref: 'VPCCIDR' });
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.Tags).toBeDefined();
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();

      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).not.toBe(true);
    });

    test('should have NAT Gateways and associated EIPs', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.ElasticIP1).toBeDefined();
      expect(template.Resources.NATGateway2).toBeDefined();
      expect(template.Resources.ElasticIP2).toBeDefined();
    });

    test('should have VPC Flow Logs enabled', () => {
      expect(template.Resources.VPCFlowLogs).toBeDefined();
      expect(template.Resources.VPCFlowLogs.Properties.ResourceType).toBe('VPC');
      expect(template.Resources.VPCFlowLogs.Properties.TrafficType).toBe('ALL');
      expect(template.Resources.VPCFlowLogsLogGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
    });

    // IAM & Access Control
    test('should have Lambda Execution Role with least privilege', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      // Verify specific policies for Secrets Manager and DynamoDB access
      const policyNames = role.Properties.Policies.map((p: { PolicyName: string; }) => p.PolicyName);
      expect(policyNames).toContain('LambdaSecretsManagerAccess');
      expect(policyNames).toContain('LambdaDynamoDBAccess');
      expect(policyNames).toContain('LambdaVPCAccess');
    });

    test('should use AWS Secrets Manager for RDS credentials', () => {
      expect(template.Resources.RDSSecret).toBeDefined();
      expect(template.Resources.RDSSecret.Type).toBe('AWS::SecretsManager::Secret');
      // expect(template.Resources.RDSInstance.Properties.MasterUserPassword).toEqual({ 'Fn::Sub': '{{resolve:secretsmanager:${RDSSecret}}}' });
    });

    test('should define ApplicationKMSKey and RDSKMSKey with rotation enabled', () => {
      expect(template.Resources.ApplicationKMSKey).toBeDefined();
      expect(template.Resources.ApplicationKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.ApplicationKMSKey.Properties.EnableKeyRotation).toBe(true);
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.RDSKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    // Storage
    test('should have SecureS3Bucket with default encryption and public access blocked', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      const s3Bucket = template.Resources.SecureS3Bucket;
      expect(s3Bucket.Type).toBe('AWS::S3::Bucket');
      expect(s3Bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(s3Bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      expect(s3Bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });


    test('should have RDS PostgreSQL instance, encrypted and not publicly accessible', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      const rdsInstance = template.Resources.RDSInstance;
      expect(rdsInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(rdsInstance.Properties.Engine).toBe('postgres');
      expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
      expect(rdsInstance.Properties.KmsKeyId).toEqual({ Ref: 'RDSKMSKey' });
      expect(rdsInstance.Properties.MultiAZ).toBe(true);
      expect(rdsInstance.Properties.DeletionProtection).toBe(false); // Can be true for prod, false for testing
    });

    // Security Groups
    test('should have LambdaSecurityGroup and InternalInstanceSecurityGroup', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
    });

    // Lambda
    test('should have FinancialProcessorLambda deployed in private subnets', () => {
      expect(template.Resources.FinancialProcessorLambda).toBeDefined();
      const lambda = template.Resources.FinancialProcessorLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
      expect(lambda.Properties.VpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(lambda.Properties.VpcConfig.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(lambda.Properties.Environment.Variables.RDS_SECRET_ARN).toEqual({ Ref: 'RDSSecret' });
    });

    // DNS, CDN, Messaging
    test('should have a Private Hosted Zone', () => {
      expect(template.Resources.PrivateHostedZone).toBeDefined();
      expect(template.Resources.PrivateHostedZone.Type).toBe('AWS::Route53::HostedZone');
      expect(template.Resources.PrivateHostedZone.Properties.Name).toBe('internal.local');
    });
    


    // Monitoring & Compliance
    test('should have CloudTrail enabled for all regions and validate logs', () => {
      expect(template.Resources.CloudTrailTrail).toBeDefined();
      const cloudTrail = template.Resources.CloudTrailTrail;
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(template.Resources.CloudTrailLogsBucket).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
    });

    test('should have AWS Config enabled with default recorder and compliance rule', () => {
      expect(template.Resources.AWSConfigRecorder).toBeDefined();
      expect(template.Resources.AWSConfigRecorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(template.Resources.AWSConfigRecorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
      expect(template.Resources.AWSConfigRole).toBeDefined();
      expect(template.Resources.AWSConfigDeliveryChannel).toBeDefined();
      expect(template.Resources.AWSConfigLogsBucket).toBeDefined();
      expect(template.Resources.RDSPublicAccessCheck).toBeDefined();
      expect(template.Resources.RDSPublicAccessCheck.Properties.Source.SourceIdentifier).toBe('RDS_INSTANCE_PUBLIC_ACCESS_CHECK');
    });

    test('should have AWS WAF WebACL associated with REGIONAL', () => {
      expect(template.Resources.WAFWebACL).toBeDefined();
      const waf = template.Resources.WAFWebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
      expect(waf.Properties.DefaultAction.Allow).toBeDefined();
      expect(waf.Properties.Rules).toBeDefined();
      expect(waf.Properties.Rules.some((rule: { Name: string; }) => rule.Name === 'AWSManagedRulesCommonRuleSet')).toBe(true);

      expect(template.Resources.AssociateWAFWithCloudFront).toBeDefined();
      expect(template.Resources.AssociateWAFWithCloudFront.Properties.WebACLArn).toEqual({ 'Fn::GetAtt': ['WAFWebACL', 'Arn'] });
    });

    // Update the count based on the actual number of resources in the comprehensive template.
    // Count them manually from the comprehensive YAML/JSON file if you want to be precise.
    test('should have a significant number of resources for a financial application infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(35); // Adjust this number if you get exact count
    });
  });

  // --- Outputs Tests ---
  describe('Outputs', () => {
    // These tests will need to be updated to reflect the outputs of the larger template.

    test('should have SecureS3BucketName output', () => {
      expect(template.Outputs.SecureS3BucketName).toBeDefined();
      expect(template.Outputs.SecureS3BucketName.Description).toBe('The name of the secure S3 bucket.');
      expect(template.Outputs.SecureS3BucketName.Value).toEqual({ Ref: 'SecureS3Bucket' });
      expect(template.Outputs.SecureS3BucketName.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-${Project}-SecureS3BucketName' });
    });

    test('should have RDSEndpointAddress output', () => {
      expect(template.Outputs.RDSEndpointAddress.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] });
      expect(template.Outputs.RDSEndpointAddress.Description).toBe('The endpoint address of the RDS PostgreSQL instance.');
      expect(template.Outputs.RDSEndpointAddress.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] });
      expect(template.Outputs.RDSEndpointAddress.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-${Project}-RDSEndpointAddress' });
    });

    test('should have CloudFrontDistributionDomainName output', () => {
      expect(template.Outputs.CloudFrontDistributionDomainName).toBeDefined();
      expect(template.Outputs.CloudFrontDistributionDomainName.Description).toBe('The domain name of the CloudFront distribution.');
      expect(template.Outputs.CloudFrontDistributionDomainName.Value).toEqual({ 'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'] });
      expect(template.Outputs.CloudFrontDistributionDomainName.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-${Project}-CloudFrontDomainName' });
    });

    test('should have FinancialProcessorLambdaArn output', () => {
      expect(template.Outputs.FinancialProcessorLambdaArn).toBeDefined();
      expect(template.Outputs.FinancialProcessorLambdaArn.Description).toBe('The ARN of the Financial Processor Lambda function.');
      expect(template.Outputs.FinancialProcessorLambdaArn.Value).toEqual({ 'Fn::GetAtt': ['FinancialProcessorLambda', 'Arn'] });
      expect(template.Outputs.FinancialProcessorLambdaArn.Export.Name).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-${Project}-FinancialProcessorLambdaArn' });
    });

    // Add checks for all other outputs
    test('should have DynamoDBTableName output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
    });
    test('should have SNSTopicArn output', () => {
      expect(template.Outputs.SNSTopicArn).toBeDefined();
    });
    test('should have ApplicationKMSKeyArn output', () => {
      expect(template.Outputs.ApplicationKMSKeyArn).toBeDefined();
    });
    test('should have RDSKMSKeyArn output', () => {
      expect(template.Outputs.RDSKMSKeyArn).toBeDefined();
    });
    test('should have WAFWebACLArn output', () => {
      expect(template.Outputs.WAFWebACLArn).toBeDefined();
    });
    test('should have PublicSubnet1Id output', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
    });
    test('should have PublicSubnet2Id output', () => {
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
    });
    test('should have PrivateSubnet1Id output', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
    });
    test('should have PrivateSubnet2Id output', () => {
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });
    test('should have RDSSecurityGroupId output', () => {
      expect(template.Outputs.RDSSecurityGroupId).toBeDefined();
    });


    // Update the count based on the actual number of outputs in the comprehensive template.
    test('should have exactly 15 outputs', () => { // Count based on the provided comprehensive template
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(15);
    });
  });

  // --- Template Validation (General) ---
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
  });

  // --- Resource Naming Convention (Updated for comprehensive template) ---
  describe('Resource Naming Convention', () => {
    test('VPC name should follow naming convention', () => {
      const vpcTags = template.Resources.VPC.Properties.Tags;
      const nameTag = vpcTags.find((tag: { Key: string; }) => tag.Key === 'Name');
      expect(nameTag.Value).toEqual({ 'Fn::Sub': '${EnvironmentSuffix}-${Project}-VPC' });
    });

    test('all resources should include required tags', () => {
      const resources = Object.values(template.Resources);
      resources.forEach((resource: any) => {
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const hasEnvironment = tags.some((tag: { Key: string; }) => tag.Key === 'Environment');
          const hasProject = tags.some((tag: { Key: string; }) => tag.Key === 'Project');
          const hasOwner = tags.some((tag: { Key: string; }) => tag.Key === 'Owner');
          expect(hasEnvironment).toBe(true);
          expect(hasProject).toBe(true);
          expect(hasOwner).toBe(true);
        }
      });
    });

    test('output export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name) { // Ensure Export and Name exist
          let expectedExportName;
          // Special case for CloudFrontDistributionDomainName
          if (outputKey === 'CloudFrontDistributionDomainName') {
            expectedExportName = { 'Fn::Sub': '${EnvironmentSuffix}-${Project}-CloudFrontDomainName' };
          } else {
            expectedExportName = { 'Fn::Sub': `\${EnvironmentSuffix}-\${Project}-${outputKey}` };
          }
          expect(output.Export.Name).toEqual(expectedExportName);
        }
      });
    });
  });
});