/**
 * Integration tests for CloudFormation TapStack template
 * Validates template structure and resource definitions
 */

import * as fs from 'fs';
import * as path from 'path';
import { describe, it, expect } from '@jest/globals';

describe('CloudFormation TapStack Integration Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    expect(fs.existsSync(templatePath)).toBe(true);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    it('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    it('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('data analytics platform');
    });

    it('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentType).toBeDefined();
    });

    it('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    it('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Resources', () => {
    it('should define VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    it('should define public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    it('should define private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    it('should define VPC endpoints for S3 and DynamoDB', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.S3VPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
      expect(template.Resources.DynamoDBVPCEndpoint.Type).toBe('AWS::EC2::VPCEndpoint');
    });

    it('should define Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });
  });

  describe('S3 Bucket Resources', () => {
    it('should define S3 bucket', () => {
      expect(template.Resources.AnalyticsDataBucket).toBeDefined();
      expect(template.Resources.AnalyticsDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    it('should enable versioning', () => {
      const bucket = template.Resources.AnalyticsDataBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    it('should enable encryption', () => {
      const bucket = template.Resources.AnalyticsDataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    it('should have lifecycle policy for Glacier transition', () => {
      const bucket = template.Resources.AnalyticsDataBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules.length).toBeGreaterThan(0);
      const glacierRule = rules.find((r: any) => r.Id === 'TransitionToGlacier');
      expect(glacierRule).toBeDefined();
      expect(glacierRule.Transitions[0].StorageClass).toBe('GLACIER');
    });

    it('should define bucket policy', () => {
      expect(template.Resources.AnalyticsDataBucketPolicy).toBeDefined();
      expect(template.Resources.AnalyticsDataBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('DynamoDB Table Resources', () => {
    it('should define DynamoDB table', () => {
      expect(template.Resources.MetadataTable).toBeDefined();
      expect(template.Resources.MetadataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    it('should use PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.MetadataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    it('should have correct key schema', () => {
      const table = template.Resources.MetadataTable;
      expect(table.Properties.KeySchema).toBeDefined();
      expect(table.Properties.KeySchema[0].AttributeName).toBe('file_id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    it('should have global secondary index', () => {
      const table = template.Resources.MetadataTable;
      expect(table.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(table.Properties.GlobalSecondaryIndexes.length).toBeGreaterThan(0);
      expect(table.Properties.GlobalSecondaryIndexes[0].IndexName).toBe('timestamp-index');
    });
  });

  describe('Lambda Function Resources', () => {
    it('should define Lambda function', () => {
      expect(template.Resources.CSVProcessorFunction).toBeDefined();
      expect(template.Resources.CSVProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    it('should use Python 3.9 runtime', () => {
      const lambda = template.Resources.CSVProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.9');
    });

    it('should have 3GB memory allocation', () => {
      const lambda = template.Resources.CSVProcessorFunction;
      expect(lambda.Properties.MemorySize).toBe(3072);
    });

    it('should have 5 minute timeout', () => {
      const lambda = template.Resources.CSVProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(300);
    });

    it('should have VPC configuration', () => {
      const lambda = template.Resources.CSVProcessorFunction;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
    });

    it('should have environment variables', () => {
      const lambda = template.Resources.CSVProcessorFunction;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.DYNAMODB_TABLE).toBeDefined();
    });

    it('should define Lambda permission for S3', () => {
      expect(template.Resources.CSVProcessorFunctionPermission).toBeDefined();
      expect(template.Resources.CSVProcessorFunctionPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('IAM Resources', () => {
    it('should define Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    it('should have S3 access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.Policies).toBeDefined();
      const s3Policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy).toBeDefined();
    });

    it('should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.Policies).toBeDefined();
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
      expect(dynamoPolicy).toBeDefined();
    });

    it('should have trust relationship with Lambda service', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
    });
  });

  describe('Security Group Resources', () => {
    it('should define Lambda security group', () => {
      expect(template.Resources.LambdaSecurityGroup).toBeDefined();
      expect(template.Resources.LambdaSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    it('should have egress rules', () => {
      const sg = template.Resources.LambdaSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      expect(sg.Properties.SecurityGroupEgress.length).toBeGreaterThan(0);
    });
  });

  describe('SNS Resources', () => {
    it('should define policy compliance topic', () => {
      expect(template.Resources.PolicyComplianceTopic).toBeDefined();
      expect(template.Resources.PolicyComplianceTopic.Type).toBe('AWS::SNS::Topic');
    });

    it('should define drift detection topic', () => {
      expect(template.Resources.DriftDetectionSNSTopic).toBeDefined();
      expect(template.Resources.DriftDetectionSNSTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('CloudWatch Resources', () => {
    it('should define CloudWatch dashboard', () => {
      expect(template.Resources.AnalyticsDashboard).toBeDefined();
      expect(template.Resources.AnalyticsDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    it('should have dashboard body with widgets', () => {
      const dashboard = template.Resources.AnalyticsDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });
  });

  describe('Service Catalog Resources', () => {
    it('should define Service Catalog portfolio', () => {
      expect(template.Resources.ServiceCatalogPortfolio).toBeDefined();
      expect(template.Resources.ServiceCatalogPortfolio.Type).toBe('AWS::ServiceCatalog::Portfolio');
    });

    it('should have proper display name', () => {
      const portfolio = template.Resources.ServiceCatalogPortfolio;
      expect(portfolio.Properties.DisplayName).toBeDefined();
    });
  });

  describe('Template Outputs', () => {
    it('should export VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toBeDefined();
    });

    it('should export S3 bucket name', () => {
      expect(template.Outputs.DataBucketName).toBeDefined();
      expect(template.Outputs.DataBucketName.Value).toBeDefined();
    });

    it('should export DynamoDB table name', () => {
      expect(template.Outputs.MetadataTableName).toBeDefined();
      expect(template.Outputs.MetadataTableName.Value).toBeDefined();
    });

    it('should export Lambda function ARN', () => {
      expect(template.Outputs.CSVProcessorFunctionArn).toBeDefined();
      expect(template.Outputs.CSVProcessorFunctionArn.Value).toBeDefined();
    });

    it('should export Lambda function name', () => {
      expect(template.Outputs.CSVProcessorFunctionName).toBeDefined();
      expect(template.Outputs.CSVProcessorFunctionName.Value).toBeDefined();
    });

    it('should export Lambda execution role ARN', () => {
      expect(template.Outputs.LambdaExecutionRoleArn).toBeDefined();
      expect(template.Outputs.LambdaExecutionRoleArn.Value).toBeDefined();
    });

    it('should export Lambda security group ID', () => {
      expect(template.Outputs.LambdaSecurityGroupId).toBeDefined();
      expect(template.Outputs.LambdaSecurityGroupId.Value).toBeDefined();
    });

    it('should export SNS topic ARNs', () => {
      expect(template.Outputs.PolicyComplianceTopicArn).toBeDefined();
      expect(template.Outputs.DriftDetectionTopicArn).toBeDefined();
    });

    it('should export dashboard URL', () => {
      expect(template.Outputs.DashboardURL).toBeDefined();
      expect(template.Outputs.DashboardURL.Value).toBeDefined();
    });

    it('should export Service Catalog portfolio ID', () => {
      expect(template.Outputs.ServiceCatalogPortfolioId).toBeDefined();
      expect(template.Outputs.ServiceCatalogPortfolioId.Value).toBeDefined();
    });

    it('should export subnet IDs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    it('should use environment suffix in resource names', () => {
      const resources = template.Resources;

      // Check VPC resource
      expect(resources.VPC.Properties.Tags[0].Value['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check S3 bucket
      expect(resources.AnalyticsDataBucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check DynamoDB table
      expect(resources.MetadataTable.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');

      // Check Lambda function
      expect(resources.CSVProcessorFunction.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('should use environment type in tags', () => {
      const resources = template.Resources;

      // Check multiple resources have Environment tag
      expect(resources.VPC.Properties.Tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(resources.AnalyticsDataBucket.Properties.Tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      expect(resources.MetadataTable.Properties.Tags.some((t: any) => t.Key === 'Environment')).toBe(true);
    });
  });

  describe('Resource Dependencies', () => {
    it('should define VPC gateway attachment', () => {
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
      expect(template.Resources.VPCGatewayAttachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    it('should have route table associations', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PrivateSubnet2RouteTableAssociation).toBeDefined();
    });

    it('should have public route with dependency', () => {
      const publicRoute = template.Resources.PublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.DependsOn).toBe('VPCGatewayAttachment');
    });
  });

  describe('Conditional Resources', () => {
    it('should define IsProduction condition', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    it('should use condition for point-in-time recovery', () => {
      const table = template.Resources.MetadataTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled['Fn::If']).toBeDefined();
    });
  });
});
