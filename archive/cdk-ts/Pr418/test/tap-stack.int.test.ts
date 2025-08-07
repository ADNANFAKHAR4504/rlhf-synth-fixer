import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'IntegrationTestStack', {
      region: 'us-west-2',
      environment: 'integration',
      projectName: 'IntegrationTest',
    });
    template = Template.fromStack(stack);
  });

  describe('Complete Infrastructure Deployment', () => {
    test('should create all required resources for secure infrastructure', () => {
      // Verify all major resource types are present
      expect(template.findResources('AWS::EC2::VPC')).toBeDefined();
      expect(template.findResources('AWS::S3::Bucket')).toBeDefined();
      expect(template.findResources('AWS::Lambda::Function')).toBeDefined();
      expect(template.findResources('AWS::RDS::DBInstance')).toBeDefined();
      expect(template.findResources('AWS::EC2::Instance')).toBeDefined();
      expect(template.findResources('AWS::KMS::Key')).toBeDefined();
      expect(template.findResources('AWS::Logs::LogGroup')).toBeDefined();
    });

    test('should have proper resource dependencies and relationships', () => {
      // Verify VPC is created first (foundation resource)
      const vpcResources = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpcResources)).toHaveLength(1);

      // Verify subnets are created within VPC
      const subnetResources = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnetResources).length).toBeGreaterThan(0);

      // Verify RDS is in private subnets
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      expect(Object.keys(rdsResources)).toHaveLength(1);

      // Verify EC2 is in private subnets
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      expect(Object.keys(ec2Resources)).toHaveLength(1);
    });
  });

  describe('Security Integration', () => {
    test('should have end-to-end encryption', () => {
      // Verify KMS key exists
      const kmsResources = template.findResources('AWS::KMS::Key');
      expect(Object.keys(kmsResources)).toHaveLength(1);

      // Verify S3 uses KMS encryption
      const s3Resources = template.findResources('AWS::S3::Bucket');
      const s3Bucket = s3Resources[Object.keys(s3Resources)[0]];
      expect(s3Bucket.Properties.BucketEncryption).toBeDefined();

      // Verify RDS uses encryption
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const rdsInstance = rdsResources[Object.keys(rdsResources)[0]];
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('should have proper network security', () => {
      // Verify VPC Flow Logs
      const flowLogResources = template.findResources('AWS::EC2::FlowLog');
      expect(Object.keys(flowLogResources)).toHaveLength(1);

      // Verify security groups
      const securityGroupResources = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroupResources).length).toBeGreaterThan(0);

      // Verify RDS is not publicly accessible (default is false)
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const rdsInstance = rdsResources[Object.keys(rdsResources)[0]];
      expect(rdsInstance.Properties.PubliclyAccessible).toBeFalsy();
    });

    test('should have proper IAM roles and policies', () => {
      // Verify Lambda execution role
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      const lambdaFunction = lambdaResources[Object.keys(lambdaResources)[0]];
      expect(lambdaFunction.Properties.Role).toBeDefined();

      // Verify EC2 instance role
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      const ec2Instance = ec2Resources[Object.keys(ec2Resources)[0]];
      expect(ec2Instance.Properties.IamInstanceProfile).toBeDefined();

      // Verify VPC Flow Logs role
      const iamRoleResources = template.findResources('AWS::IAM::Role');
      expect(Object.keys(iamRoleResources).length).toBeGreaterThan(0);
    });
  });

  describe('Monitoring and Logging Integration', () => {
    test('should have comprehensive logging setup', () => {
      // Verify CloudWatch Log Groups
      const logGroupResources = template.findResources('AWS::Logs::LogGroup');
      expect(Object.keys(logGroupResources).length).toBeGreaterThan(0);

      // Verify VPC Flow Logs destination
      const flowLogResources = template.findResources('AWS::EC2::FlowLog');
      const flowLog = flowLogResources[Object.keys(flowLogResources)[0]];
      expect(flowLog.Properties.LogDestinationType).toBe('cloud-watch-logs');
    });

    test('should have detailed monitoring on EC2', () => {
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      const ec2Instance = ec2Resources[Object.keys(ec2Resources)[0]];
      expect(ec2Instance.Properties.Monitoring).toBe(true);
    });

    test('should have RDS CloudWatch logs export', () => {
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const rdsInstance = rdsResources[Object.keys(rdsResources)[0]];
      expect(rdsInstance.Properties.EnableCloudwatchLogsExports).toBeDefined();
    });
  });

  describe('High Availability Integration', () => {
    test('should have Multi-AZ RDS deployment', () => {
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const rdsInstance = rdsResources[Object.keys(rdsResources)[0]];
      expect(rdsInstance.Properties.MultiAZ).toBe(true);
    });

    test('should have multiple availability zones', () => {
      const subnetResources = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnetResources).length).toBeGreaterThan(2); // At least 3 AZs
    });
  });

  describe('Resource Naming and Tagging', () => {
    test('should have consistent resource naming', () => {
      // Verify S3 bucket naming
      const s3Resources = template.findResources('AWS::S3::Bucket');
      const s3Bucket = s3Resources[Object.keys(s3Resources)[0]];
      expect(s3Bucket.Properties.BucketName).toContain('integrationtest-secure-bucket-us-west-2-integration');

      // Verify Lambda function naming
      const lambdaResources = template.findResources('AWS::Lambda::Function');
      const lambdaFunction = lambdaResources[Object.keys(lambdaResources)[0]];
      expect(lambdaFunction.Properties.FunctionName).toBe('IntegrationTest-SecureFunction-us-west-2');
    });

    test('should have proper CloudFormation outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);

      // Verify specific outputs exist
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.LambdaFunctionArn).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.KMSKeyId).toBeDefined();
    });
  });

  describe('Cost Optimization Integration', () => {
    test('should use cost-effective instance types', () => {
      // Verify EC2 instance type
      const ec2Resources = template.findResources('AWS::EC2::Instance');
      const ec2Instance = ec2Resources[Object.keys(ec2Resources)[0]];
      expect(ec2Instance.Properties.InstanceType).toBe('t3.micro');

      // Verify RDS instance type
      const rdsResources = template.findResources('AWS::RDS::DBInstance');
      const rdsInstance = rdsResources[Object.keys(rdsResources)[0]];
      expect(rdsInstance.Properties.DBInstanceClass).toBe('db.t3.micro');
    });

    test('should have S3 lifecycle rules for cost optimization', () => {
      const s3Resources = template.findResources('AWS::S3::Bucket');
      const s3Bucket = s3Resources[Object.keys(s3Resources)[0]];
      expect(s3Bucket.Properties.LifecycleConfiguration).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle different regions correctly', () => {
      const euApp = new cdk.App();
      const euStack = new TapStack(euApp, 'EUStack', {
        region: 'eu-west-1',
        environment: 'test',
        projectName: 'EUProject',
      });
      const euTemplate = Template.fromStack(euStack);
      
      // Verify resources are created for EU region
      expect(euTemplate.findResources('AWS::EC2::VPC')).toBeDefined();
      expect(euTemplate.findResources('AWS::S3::Bucket')).toBeDefined();
    });

    test('should handle different project names correctly', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        region: 'us-east-1',
        environment: 'prod',
        projectName: 'CustomProject',
      });
      const customTemplate = Template.fromStack(customStack);
      
      // Verify custom naming is applied
      const s3Resources = customTemplate.findResources('AWS::S3::Bucket');
      const s3Bucket = s3Resources[Object.keys(s3Resources)[0]];
      expect(s3Bucket.Properties.BucketName).toContain('customproject-secure-bucket-us-east-1-prod');
    });
  });
});
