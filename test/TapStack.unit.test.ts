/**
 * Unit tests for CloudFormation TapStack template
 * Tests template structure, resource configuration, and CloudFormation best practices
 */

import * as fs from 'fs';
import { describe, it, expect, beforeAll } from '@jest/globals';

describe('CloudFormation TapStack Template Unit Tests', () => {
  let template: any;
  let templatePath: string;

  beforeAll(() => {
    templatePath = 'lib/TapStack.json';
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    it('should have valid AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(10);
    });

    it('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(typeof template.Parameters).toBe('object');
    });

    it('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(typeof template.Resources).toBe('object');
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    it('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(typeof template.Outputs).toBe('object');
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    it('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(typeof template.Conditions).toBe('object');
    });
  });

  describe('Parameters', () => {
    it('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    it('should have EnvironmentType parameter', () => {
      expect(template.Parameters.EnvironmentType).toBeDefined();
      expect(template.Parameters.EnvironmentType.Type).toBe('String');
      expect(template.Parameters.EnvironmentType.AllowedValues).toContain('development');
      expect(template.Parameters.EnvironmentType.AllowedValues).toContain('staging');
      expect(template.Parameters.EnvironmentType.AllowedValues).toContain('production');
    });

    it('should validate EnvironmentSuffix pattern', () => {
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('[a-z0-9]+');
      expect(template.Parameters.EnvironmentSuffix.MinLength).toBe(3);
      expect(template.Parameters.EnvironmentSuffix.MaxLength).toBe(10);
    });
  });

  describe('Conditions', () => {
    it('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals']).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    it('should create VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    it('should have VPC with proper name tag including EnvironmentSuffix', () => {
      const nameTag = template.Resources.VPC.Properties.Tags.find((tag: any) => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should create InternetGateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    it('should attach InternetGateway to VPC', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(template.Resources.VPCGatewayAttachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(template.Resources.VPCGatewayAttachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    it('should create public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    it('should create private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    it('should use different availability zones for subnets', () => {
      const sub1AZ = template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select'][0];
      const sub2AZ = template.Resources.PublicSubnet2.Properties.AvailabilityZone['Fn::Select'][0];
      expect(sub1AZ).not.toBe(sub2AZ);
    });

    it('should create VPC endpoints for S3 and DynamoDB', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });
  });

  describe('IAM Resources', () => {
    it('should create Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    it('should have Lambda execution role with proper name including EnvironmentSuffix', () => {
      const roleName = template.Resources.LambdaExecutionRole.Properties.RoleName;
      expect(roleName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should have Lambda trust relationship', () => {
      const trustPolicy = template.Resources.LambdaExecutionRole.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    it('should attach VPC execution policy to Lambda role', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole');
    });

    it('should have S3 access policy', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
    });

    it('should have DynamoDB access policy', () => {
      const policies = template.Resources.LambdaExecutionRole.Properties.Policies;
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
    });
  });

  describe('S3 Bucket', () => {
    it('should create S3 bucket with proper naming', () => {
      expect(template.Resources.AnalyticsDataBucket).toBeDefined();
      expect(template.Resources.AnalyticsDataBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.AnalyticsDataBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(template.Resources.AnalyticsDataBucket.Properties.BucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    it('should enable versioning on S3 bucket', () => {
      expect(template.Resources.AnalyticsDataBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    it('should enable encryption on S3 bucket', () => {
      const encryption = template.Resources.AnalyticsDataBucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    it('should have lifecycle policy for Glacier transition', () => {
      const rules = template.Resources.AnalyticsDataBucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThan(0);
      const glacierRule = rules.find((r: any) => r.Id === 'TransitionToGlacier');
      expect(glacierRule).toBeDefined();
      expect(glacierRule.Transitions[0].TransitionInDays).toBe(90);
      expect(glacierRule.Transitions[0].StorageClass).toBe('GLACIER');
    });

    it('should have Delete deletion policy for non-production', () => {
      expect(template.Resources.AnalyticsDataBucket.DeletionPolicy).toBe('Delete');
      expect(template.Resources.AnalyticsDataBucket.UpdateReplacePolicy).toBe('Delete');
    });

    it('should have bucket policy with explicit deny statements', () => {
      expect(template.Resources.AnalyticsDataBucketPolicy).toBeDefined();
      const statements = template.Resources.AnalyticsDataBucketPolicy.Properties.PolicyDocument.Statement;

      const denyUnencrypted = statements.find((s: any) => s.Sid === 'DenyUnencryptedObjectUploads');
      expect(denyUnencrypted).toBeDefined();
      expect(denyUnencrypted.Effect).toBe('Deny');

      const denyInsecure = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyInsecure).toBeDefined();
      expect(denyInsecure.Effect).toBe('Deny');
    });
  });

  describe('DynamoDB Table', () => {
    it('should create DynamoDB table with proper naming', () => {
      expect(template.Resources.MetadataTable).toBeDefined();
      expect(template.Resources.MetadataTable.Type).toBe('AWS::DynamoDB::Table');
      expect(template.Resources.MetadataTable.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should use on-demand billing mode', () => {
      expect(template.Resources.MetadataTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have proper key schema', () => {
      const keySchema = template.Resources.MetadataTable.Properties.KeySchema;
      expect(keySchema.length).toBe(1);
      expect(keySchema[0].AttributeName).toBe('file_id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    it('should have global secondary index', () => {
      const gsi = template.Resources.MetadataTable.Properties.GlobalSecondaryIndexes;
      expect(gsi).toBeDefined();
      expect(gsi.length).toBeGreaterThan(0);
      expect(gsi[0].IndexName).toBe('timestamp-index');
    });

    it('should have conditional point-in-time recovery', () => {
      const pitr = template.Resources.MetadataTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled).toBeDefined();
      expect(pitr.PointInTimeRecoveryEnabled['Fn::If']).toBeDefined();
    });

    it('should have Delete deletion policy', () => {
      expect(template.Resources.MetadataTable.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Lambda Function', () => {
    it('should create CSV processor Lambda function', () => {
      expect(template.Resources.CSVProcessorFunction).toBeDefined();
      expect(template.Resources.CSVProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    it('should use Python 3.9 runtime', () => {
      expect(template.Resources.CSVProcessorFunction.Properties.Runtime).toBe('python3.9');
    });

    it('should have 3GB memory allocation', () => {
      expect(template.Resources.CSVProcessorFunction.Properties.MemorySize).toBe(3072);
    });

    it('should have 5 minute timeout', () => {
      expect(template.Resources.CSVProcessorFunction.Properties.Timeout).toBe(300);
    });

    it('should have environment variables', () => {
      const envVars = template.Resources.CSVProcessorFunction.Properties.Environment.Variables;
      expect(envVars.DYNAMODB_TABLE).toEqual({ Ref: 'MetadataTable' });
      expect(envVars.ENVIRONMENT_TYPE).toEqual({ Ref: 'EnvironmentType' });
    });

    it('should be in VPC configuration', () => {
      const vpcConfig = template.Resources.CSVProcessorFunction.Properties.VpcConfig;
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SubnetIds).toHaveLength(2);
      expect(vpcConfig.SecurityGroupIds).toHaveLength(1);
    });

    it('should have proper IAM role reference', () => {
      expect(template.Resources.CSVProcessorFunction.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    it('should have inline Lambda code', () => {
      const code = template.Resources.CSVProcessorFunction.Properties.Code.ZipFile;
      expect(code).toBeDefined();
      expect(code).toContain('lambda_handler');
      expect(code).toContain('boto3');
      expect(code).toContain('csv');
    });
  });

  describe('Lambda Permission', () => {
    it('should allow S3 to invoke Lambda', () => {
      expect(template.Resources.CSVProcessorFunctionPermission).toBeDefined();
      expect(template.Resources.CSVProcessorFunctionPermission.Type).toBe('AWS::Lambda::Permission');
      expect(template.Resources.CSVProcessorFunctionPermission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(template.Resources.CSVProcessorFunctionPermission.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('SNS Topics', () => {
    it('should create policy compliance SNS topic', () => {
      expect(template.Resources.PolicyComplianceTopic).toBeDefined();
      expect(template.Resources.PolicyComplianceTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.PolicyComplianceTopic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should create drift detection SNS topic', () => {
      expect(template.Resources.DriftDetectionSNSTopic).toBeDefined();
      expect(template.Resources.DriftDetectionSNSTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.DriftDetectionSNSTopic.Properties.TopicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('CloudWatch Dashboard', () => {
    it('should create CloudWatch dashboard', () => {
      expect(template.Resources.AnalyticsDashboard).toBeDefined();
      expect(template.Resources.AnalyticsDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    it('should have proper dashboard name with EnvironmentSuffix', () => {
      const dashboardName = template.Resources.AnalyticsDashboard.Properties.DashboardName;
      expect(dashboardName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should have dashboard body with widgets', () => {
      const dashboardBody = template.Resources.AnalyticsDashboard.Properties.DashboardBody;
      expect(dashboardBody).toBeDefined();
      expect(dashboardBody['Fn::Sub']).toBeDefined();
      expect(dashboardBody['Fn::Sub']).toContain('widgets');
    });
  });

  describe('Service Catalog', () => {
    it('should create Service Catalog portfolio', () => {
      expect(template.Resources.ServiceCatalogPortfolio).toBeDefined();
      expect(template.Resources.ServiceCatalogPortfolio.Type).toBe('AWS::ServiceCatalog::Portfolio');
    });

    it('should have portfolio with EnvironmentSuffix in name', () => {
      const displayName = template.Resources.ServiceCatalogPortfolio.Properties.DisplayName;
      expect(displayName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('Security Group', () => {
    it('should create Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    it('should allow all outbound traffic', () => {
      const egress = template.Resources.LambdaSecurityGroup.Properties.SecurityGroupEgress;
      expect(egress).toBeDefined();
      expect(egress[0].IpProtocol).toBe('-1');
      expect(egress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Outputs', () => {
    it('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.VPCId.Export).toBeDefined();
    });

    it('should have DataBucketName output', () => {
      expect(template.Outputs.DataBucketName).toBeDefined();
      expect(template.Outputs.DataBucketName.Value).toEqual({ Ref: 'AnalyticsDataBucket' });
    });

    it('should have MetadataTableName output', () => {
      expect(template.Outputs.MetadataTableName).toBeDefined();
      expect(template.Outputs.MetadataTableName.Value).toEqual({ Ref: 'MetadataTable' });
    });

    it('should have Lambda function ARN output', () => {
      expect(template.Outputs.CSVProcessorFunctionArn).toBeDefined();
      expect(template.Outputs.CSVProcessorFunctionArn.Value['Fn::GetAtt']).toEqual(['CSVProcessorFunction', 'Arn']);
    });

    it('should have Lambda function name output', () => {
      expect(template.Outputs.CSVProcessorFunctionName).toBeDefined();
      expect(template.Outputs.CSVProcessorFunctionName.Value).toEqual({ Ref: 'CSVProcessorFunction' });
    });

    it('should have dashboard URL output', () => {
      expect(template.Outputs.DashboardURL).toBeDefined();
      expect(template.Outputs.DashboardURL.Value['Fn::Sub']).toContain('cloudwatch');
    });

    it('should have all required subnet outputs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    it('should have SNS topic ARN outputs', () => {
      expect(template.Outputs.PolicyComplianceTopicArn).toBeDefined();
      expect(template.Outputs.DriftDetectionTopicArn).toBeDefined();
    });

    it('should have Service Catalog portfolio ID output', () => {
      expect(template.Outputs.ServiceCatalogPortfolioId).toBeDefined();
      expect(template.Outputs.ServiceCatalogPortfolioId.Value).toEqual({ Ref: 'ServiceCatalogPortfolio' });
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use EnvironmentSuffix in all resource names', () => {
      const resourcesWithNames = [
        'VPC',
        'AnalyticsDataBucket',
        'MetadataTable',
        'CSVProcessorFunction',
        'LambdaExecutionRole',
        'LambdaSecurityGroup',
        'PolicyComplianceTopic',
        'DriftDetectionSNSTopic'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();

        let hasEnvironmentSuffix = false;
        const props = resource.Properties;

        if (props.BucketName && props.BucketName['Fn::Sub']) {
          hasEnvironmentSuffix = props.BucketName['Fn::Sub'].includes('${EnvironmentSuffix}');
        } else if (props.TableName && props.TableName['Fn::Sub']) {
          hasEnvironmentSuffix = props.TableName['Fn::Sub'].includes('${EnvironmentSuffix}');
        } else if (props.FunctionName && props.FunctionName['Fn::Sub']) {
          hasEnvironmentSuffix = props.FunctionName['Fn::Sub'].includes('${EnvironmentSuffix}');
        } else if (props.RoleName && props.RoleName['Fn::Sub']) {
          hasEnvironmentSuffix = props.RoleName['Fn::Sub'].includes('${EnvironmentSuffix}');
        } else if (props.GroupName && props.GroupName['Fn::Sub']) {
          hasEnvironmentSuffix = props.GroupName['Fn::Sub'].includes('${EnvironmentSuffix}');
        } else if (props.TopicName && props.TopicName['Fn::Sub']) {
          hasEnvironmentSuffix = props.TopicName['Fn::Sub'].includes('${EnvironmentSuffix}');
        } else if (props.Tags) {
          const nameTag = props.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag && nameTag.Value['Fn::Sub']) {
            hasEnvironmentSuffix = nameTag.Value['Fn::Sub'].includes('${EnvironmentSuffix}');
          }
        }

        expect(hasEnvironmentSuffix).toBe(true);
      });
    });
  });

  describe('Tags', () => {
    it('should have Environment tag on all taggable resources', () => {
      const taggableResources = [
        'VPC',
        'InternetGateway',
        'AnalyticsDataBucket',
        'MetadataTable',
        'CSVProcessorFunction',
        'LambdaExecutionRole',
        'LambdaSecurityGroup',
        'PolicyComplianceTopic',
        'DriftDetectionSNSTopic',
        'ServiceCatalogPortfolio'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const envTag = resource.Properties.Tags.find((t: any) => t.Key === 'Environment');
        if (!envTag) {
          console.log(`Missing Environment tag on resource: ${resourceName}`);
          console.log(`Tags:`, JSON.stringify(resource.Properties.Tags, null, 2));
        }
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'EnvironmentType' });
      });
    });
  });

  describe('Dependencies', () => {
    it('should have proper dependency on VPCGatewayAttachment for PublicRoute', () => {
      expect(template.Resources.PublicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  describe('CloudFormation Intrinsic Functions', () => {
    it('should use Fn::Sub for string substitution', () => {
      const vpcName = template.Resources.VPC.Properties.Tags.find((t: any) => t.Key === 'Name');
      expect(vpcName.Value['Fn::Sub']).toBeDefined();
    });

    it('should use Fn::GetAtt for resource attributes', () => {
      expect(template.Outputs.CSVProcessorFunctionArn.Value['Fn::GetAtt']).toBeDefined();
      expect(template.Outputs.CSVProcessorFunctionArn.Value['Fn::GetAtt'][0]).toBe('CSVProcessorFunction');
      expect(template.Outputs.CSVProcessorFunctionArn.Value['Fn::GetAtt'][1]).toBe('Arn');
    });

    it('should use Fn::If for conditional values', () => {
      const pitr = template.Resources.MetadataTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled['Fn::If']).toBeDefined();
      expect(pitr.PointInTimeRecoveryEnabled['Fn::If'][0]).toBe('IsProduction');
    });

    it('should use Fn::Select for availability zones', () => {
      const az = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      expect(az['Fn::Select']).toBeDefined();
      expect(az['Fn::Select'][1]['Fn::GetAZs']).toBe('');
    });

    it('should use Ref for parameter references', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
    });
  });

  describe('Best Practices', () => {
    it('should not have hardcoded region values', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/us-east-1|us-west-2|eu-west-1/);
    });

    it('should not have hardcoded account IDs except in bucket naming', () => {
      const templateStr = JSON.stringify(template);
      const accountIdMatches = templateStr.match(/\d{12}/g) || [];
      expect(accountIdMatches.length).toBe(0);
    });

    it('should use AWS::Region pseudo parameter', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::Region');
    });

    it('should use AWS::AccountId pseudo parameter', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('AWS::AccountId');
    });

    it('should have all resources with proper resource types', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(resource.Type).toMatch(/^AWS::/);
      });
    });
  });
});
