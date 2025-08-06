import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Integration Tests', () => {
  let template: any;
  let templatePath: string;

  beforeAll(() => {
    templatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('End-to-End Template Validation', () => {
    test('should create a complete serverless application stack', () => {
      // Verify we have a complete application with all necessary components
      const resources = template.Resources;

      // Core serverless components
      expect(resources.ServerlessAppBucket).toBeDefined();
      expect(resources.ServerlessAppLambda).toBeDefined();
      expect(resources.ServerlessAppSecret).toBeDefined();

      // High availability infrastructure
      expect(resources.ServerlessAppVPC).toBeDefined();
      expect(resources.ServerlessAppSubnetAZ1).toBeDefined();
      expect(resources.ServerlessAppSubnetAZ2).toBeDefined();

      // Security and access control
      expect(resources.ServerlessAppLambdaRole).toBeDefined();
      expect(resources.ServerlessAppLambdaSecurityGroup).toBeDefined();

      // Monitoring and observability
      expect(resources.ServerlessAppLogGroup).toBeDefined();
      expect(resources.ServerlessAppLambdaErrorAlarm).toBeDefined();
      expect(resources.ServerlessAppLambdaInvocationsAlarm).toBeDefined();
    });

    test('should establish proper resource dependencies', () => {
      const resources = template.Resources;

      // Lambda should depend on VPC components
      const lambda = resources.ServerlessAppLambda;
      expect(lambda.Properties.VpcConfig.SubnetIds).toContainEqual({
        Ref: 'ServerlessAppSubnetAZ1',
      });
      expect(lambda.Properties.VpcConfig.SubnetIds).toContainEqual({
        Ref: 'ServerlessAppSubnetAZ2',
      });
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toContainEqual({
        Ref: 'ServerlessAppLambdaSecurityGroup',
      });

      // Lambda should have proper IAM role
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['ServerlessAppLambdaRole', 'Arn'],
      });

      // S3 bucket should reference Lambda
      const bucket = resources.ServerlessAppBucket;
      expect(
        bucket.Properties.NotificationConfiguration.LambdaConfigurations[0]
          .Function
      ).toEqual({ 'Fn::GetAtt': ['ServerlessAppLambda', 'Arn'] });

      // Lambda permission should link S3 and Lambda
      const permission = resources.ServerlessAppBucketInvokePermission;
      expect(permission.Properties.FunctionName).toEqual({
        Ref: 'ServerlessAppLambda',
      });
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${S3BucketName}',
      });
    });

    test('should implement proper security controls', () => {
      const resources = template.Resources;

      // S3 bucket security
      const bucket = resources.ServerlessAppBucket;
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);

      // IAM least privilege
      const role = resources.ServerlessAppLambdaRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      // Should only access specific secret
      const secretsStatement = policy.Statement.find((stmt: any) =>
        stmt.Action.includes('secretsmanager:GetSecretValue')
      );
      expect(secretsStatement.Resource).toEqual({ Ref: 'ServerlessAppSecret' });

      // Should only access specific S3 bucket
      const s3Statement = policy.Statement.find((stmt: any) =>
        stmt.Action.includes('s3:GetObject')
      );
      expect(s3Statement.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${S3BucketName}/*',
      });
    });

    test('should provide high availability across multiple AZs', () => {
      const resources = template.Resources;

      // Multiple subnets in different AZs
      const subnet1 = resources.ServerlessAppSubnetAZ1;
      const subnet2 = resources.ServerlessAppSubnetAZ2;

      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      });

      // Different CIDR blocks
      expect(subnet1.Properties.CidrBlock).toBe('10.0.0.0/26');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.0.64/26');

      // Lambda deployed across both subnets
      const lambda = resources.ServerlessAppLambda;
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);
    });

    test('should implement comprehensive monitoring', () => {
      const resources = template.Resources;

      // CloudWatch log group with retention
      const logGroup = resources.ServerlessAppLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
      expect(logGroup.Properties.LogGroupName).toBe(
        '/aws/lambda/ServerlessAppLambda'
      );

      // Error monitoring
      const errorAlarm = resources.ServerlessAppLambdaErrorAlarm;
      expect(errorAlarm.Properties.MetricName).toBe('Errors');
      expect(errorAlarm.Properties.Threshold).toBe(1);
      expect(errorAlarm.Properties.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );

      // Invocation monitoring
      const invocationAlarm = resources.ServerlessAppLambdaInvocationsAlarm;
      expect(invocationAlarm.Properties.MetricName).toBe('Invocations');
      expect(invocationAlarm.Properties.Threshold).toBe(100);
      expect(invocationAlarm.Properties.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('should handle secrets management securely', () => {
      const resources = template.Resources;

      // Secret with proper configuration
      const secret = resources.ServerlessAppSecret;
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe(
        'api_key'
      );

      // Lambda environment variable referencing secret
      const lambda = resources.ServerlessAppLambda;
      expect(
        lambda.Properties.Environment.Variables.SERVERLESSAPP_SECRET_ARN
      ).toEqual({ Ref: 'ServerlessAppSecret' });

      // IAM policy allowing access to the specific secret
      const role = resources.ServerlessAppLambdaRole;
      const secretPolicy =
        role.Properties.Policies[0].PolicyDocument.Statement.find((stmt: any) =>
          stmt.Action.includes('secretsmanager:GetSecretValue')
        );
      expect(secretPolicy.Resource).toEqual({ Ref: 'ServerlessAppSecret' });
    });

    test('should provide proper networking infrastructure', () => {
      const resources = template.Resources;

      // VPC with proper CIDR
      const vpc = resources.ServerlessAppVPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/24');

      // Internet Gateway attached
      const attachment = resources.ServerlessAppVPCGatewayAttachment;
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'ServerlessAppVPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({
        Ref: 'ServerlessAppInternetGateway',
      });

      // Proper routing - check public route
      const publicRoute = resources.ServerlessAppPublicRoute;
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.Properties.GatewayId).toEqual({
        Ref: 'ServerlessAppInternetGateway',
      });

      // Check private route  
      const privateRoute = resources.ServerlessAppPrivateRoute;
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privateRoute.Properties.NatGatewayId).toEqual({
        Ref: 'ServerlessAppNATGateway',
      });

      // Security group allowing outbound traffic
      const sg = resources.ServerlessAppLambdaSecurityGroup;
      expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe('-1');
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should expose necessary outputs for integration', () => {
      const outputs = template.Outputs;

      // All key resources should be exposed
      expect(outputs.S3BucketName.Value).toEqual({
        Ref: 'ServerlessAppBucket',
      });
      expect(outputs.LambdaFunctionName.Value).toEqual({
        Ref: 'ServerlessAppLambda',
      });
      expect(outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['ServerlessAppLambda', 'Arn'],
      });
      expect(outputs.SecretArn.Value).toEqual({ Ref: 'ServerlessAppSecret' });

      // Alarms output for monitoring integration
      expect(outputs.Alarms).toBeDefined();
      expect(outputs.Alarms.Value).toEqual({
        'Fn::Join': [
          ', ',
          [
            { Ref: 'ServerlessAppLambdaErrorAlarm' },
            { Ref: 'ServerlessAppLambdaInvocationsAlarm' },
          ],
        ],
      });
    });
  });

  describe('Template Compliance with Requirements', () => {
    test('should comply with serverless application requirements', () => {
      const resources = template.Resources;

      // Lambda function as core compute
      expect(resources.ServerlessAppLambda.Type).toBe('AWS::Lambda::Function');

      // S3 bucket for file upload triggers
      expect(resources.ServerlessAppBucket.Type).toBe('AWS::S3::Bucket');
      expect(
        resources.ServerlessAppBucket.Properties.NotificationConfiguration
          .LambdaConfigurations
      ).toBeDefined();

      // Secrets Manager for sensitive data
      expect(resources.ServerlessAppSecret.Type).toBe(
        'AWS::SecretsManager::Secret'
      );

      // CloudWatch monitoring
      expect(resources.ServerlessAppLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(resources.ServerlessAppLambdaErrorAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('should use proper resource naming convention', () => {
      const resourceNames = Object.keys(template.Resources);

      // All resources should start with ServerlessApp
      resourceNames.forEach(name => {
        expect(name).toMatch(/^ServerlessApp/);
      });

      // Specific naming requirements
      expect(resourceNames).toContain('ServerlessAppBucket');
      expect(resourceNames).toContain('ServerlessAppLambda');
      expect(resourceNames).toContain('ServerlessAppSecret');
    });

    test('should implement all required AWS services', () => {
      const resourceTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );

      // Required services from the prompt
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::SecretsManager::Secret');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');

      // High availability components
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
    });

    test('should meet fault tolerance requirements', () => {
      const resources = template.Resources;

      // Multi-AZ deployment
      expect(resources.ServerlessAppSubnetAZ1).toBeDefined();
      expect(resources.ServerlessAppSubnetAZ2).toBeDefined();

      // Lambda deployed across multiple subnets
      const lambda = resources.ServerlessAppLambda;
      expect(lambda.Properties.VpcConfig.SubnetIds).toHaveLength(2);

      // Proper error handling with alarms
      expect(resources.ServerlessAppLambdaErrorAlarm).toBeDefined();
    });
  });

  describe('Operational Readiness', () => {
    test('should be ready for production deployment', () => {
      // Template should be valid JSON
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');

      // Should have all required sections
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();

      // Should have substantial infrastructure (not a toy example)
      expect(Object.keys(template.Resources).length).toBeGreaterThan(10);
    });

    test('should support parameterization for different environments', () => {
      const parameters = template.Parameters;

      // Runtime can be configured
      expect(parameters.LambdaRuntime.AllowedValues).toContain('python3.12');
      expect(parameters.LambdaRuntime.AllowedValues).toContain('nodejs20.x');

      // Handler can be configured
      expect(parameters.LambdaHandler.Type).toBe('String');

      // Bucket name can be configured
      expect(parameters.S3BucketName.Type).toBe('String');
    });

    test('should follow AWS best practices', () => {
      const resources = template.Resources;

      // Resources should have appropriate tags
      Object.entries(resources).forEach(([name, resource]: [string, any]) => {
        if (resource.Properties && 'Tags' in resource.Properties) {
          expect(resource.Properties.Tags).toBeDefined();
          expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        }
      });

      // Encryption enabled where applicable
      const bucket = resources.ServerlessAppBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();

      // Public access blocked for S3
      expect(
        bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
    });
  });
});
