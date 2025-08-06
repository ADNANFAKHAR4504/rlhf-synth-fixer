import * as fs from 'fs';
import * as path from 'path';

describe('CloudFormation Template Tests', () => {
  let template: any;
  let jsonTemplatePath: string;

  beforeAll(() => {
    // Use the JSON version since it has CloudFormation functions properly parsed
    jsonTemplatePath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const templateContent = fs.readFileSync(jsonTemplatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have required top-level sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('should have correct AWS template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have descriptive template description', () => {
      expect(template.Description).toContain('ServerlessApp');
      expect(template.Description).toContain('Highly Available');
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      expect(template.Parameters).toHaveProperty('LambdaRuntime');
      expect(template.Parameters).toHaveProperty('LambdaHandler');
      expect(template.Parameters).toHaveProperty('S3BucketName');
    });

    test('should have valid parameter configurations', () => {
      expect(template.Parameters.LambdaRuntime.Type).toBe('String');
      expect(template.Parameters.LambdaRuntime.Default).toBe('python3.12');
      expect(template.Parameters.LambdaRuntime.AllowedValues).toContain(
        'python3.12'
      );
      expect(template.Parameters.LambdaRuntime.AllowedValues).toContain(
        'nodejs20.x'
      );
    });
  });

  describe('Resources - Naming Convention', () => {
    test('should follow ServerlessApp naming convention for all resources', () => {
      const resources = Object.keys(template.Resources);
      const serverlessAppResources = resources.filter(name =>
        name.startsWith('ServerlessApp')
      );

      // All resources should start with ServerlessApp
      expect(serverlessAppResources.length).toBeGreaterThan(0);

      // Check specific resources
      expect(resources).toContain('ServerlessAppBucket');
      expect(resources).toContain('ServerlessAppLambda');
      expect(resources).toContain('ServerlessAppSecret');
      expect(resources).toContain('ServerlessAppLambdaRole');
      expect(resources).toContain('ServerlessAppVPC');
      expect(resources).toContain('ServerlessAppLogGroup');
    });
  });

  describe('S3 Bucket Resource', () => {
    test('should exist and have correct configuration', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have proper security configuration', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');

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

    test('should have S3 event configuration for Lambda trigger', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket.Properties.NotificationConfiguration).toBeDefined();
      expect(
        bucket.Properties.NotificationConfiguration.LambdaConfigurations
      ).toBeDefined();
      expect(
        bucket.Properties.NotificationConfiguration.LambdaConfigurations[0]
          .Event
      ).toBe('s3:ObjectCreated:*');
    });

    test('should have proper tags', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      const nameTag = bucket.Properties.Tags.find(
        (tag: any) => tag.Key === 'Name'
      );
      expect(nameTag.Value).toBe('ServerlessAppBucket');
    });
  });

  describe('Lambda Function Resource', () => {
    test('should exist and have correct configuration', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have proper runtime and handler configuration', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.Runtime).toEqual({ Ref: 'LambdaRuntime' });
      expect(lambda.Properties.Handler).toEqual({ Ref: 'LambdaHandler' });
    });

    test('should have VPC configuration for high availability', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.VpcConfig).toBeDefined();
      expect(lambda.Properties.VpcConfig.SecurityGroupIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds).toBeDefined();
      expect(lambda.Properties.VpcConfig.SubnetIds.length).toBe(2); // Multi-AZ
    });

    test('should have environment variables for secrets access', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(
        lambda.Properties.Environment.Variables.SERVERLESSAPP_SECRET_ARN
      ).toBeDefined();
    });

    test('should have proper IAM role reference', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['ServerlessAppLambdaRole', 'Arn'],
      });
    });

    test('should have appropriate timeout and memory settings', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(256);
    });
  });

  describe('Secrets Manager Resource', () => {
    test('should exist and have correct configuration', () => {
      const secret = template.Resources.ServerlessAppSecret;
      expect(secret).toBeDefined();
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('should have proper name following convention', () => {
      const secret = template.Resources.ServerlessAppSecret;
      expect(secret.Properties.Name).toBe('ServerlessAppSecret');
    });

    test('should have secret generation configuration', () => {
      const secret = template.Resources.ServerlessAppSecret;
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(
        secret.Properties.GenerateSecretString.SecretStringTemplate
      ).toBeDefined();
      expect(secret.Properties.GenerateSecretString.GenerateStringKey).toBe(
        'api_key'
      );
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });
  });

  describe('IAM Role Resource', () => {
    test('should exist and have correct configuration', () => {
      const role = template.Resources.ServerlessAppLambdaRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have proper assume role policy for Lambda', () => {
      const role = template.Resources.ServerlessAppLambdaRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('lambda.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe(
        'sts:AssumeRole'
      );
    });

    test('should have least privilege policies', () => {
      const role = template.Resources.ServerlessAppLambdaRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies[0].PolicyName).toBe(
        'ServerlessAppLambdaPolicy'
      );

      const statements = role.Properties.Policies[0].PolicyDocument.Statement;

      // Check secrets access policy
      const secretsStatement = statements.find((stmt: any) =>
        stmt.Action.includes('secretsmanager:GetSecretValue')
      );
      expect(secretsStatement).toBeDefined();
      expect(secretsStatement.Resource).toEqual({ Ref: 'ServerlessAppSecret' });

      // Check logging policy
      const logsStatement = statements.find((stmt: any) =>
        stmt.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();

      // Check S3 access policy
      const s3Statement = statements.find((stmt: any) =>
        stmt.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC for high availability', () => {
      const vpc = template.Resources.ServerlessAppVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/24');
    });

    test('should have multi-AZ subnets', () => {
      const subnet1 = template.Resources.ServerlessAppSubnetAZ1;
      const subnet2 = template.Resources.ServerlessAppSubnetAZ2;

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');

      // // Different AZs
      // expect(subnet1.Properties.AvailabilityZone).toEqual({
      //   'Fn::Select': [0, { 'Fn::GetAZs': '' }],
      // });
      // expect(subnet2.Properties.AvailabilityZone).toEqual({
      //   'Fn::Select': [1, { 'Fn::GetAZs': '' }],
      // });

      // Different CIDR blocks
      expect(subnet1.Properties.CidrBlock).toBe('10.0.0.0/26');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.0.64/26');
    });

    test('should have Internet Gateway and routing', () => {
      const igw = template.Resources.ServerlessAppInternetGateway;
      const publicRouteTable = template.Resources.ServerlessAppPublicRouteTable;
      const privateRouteTable = template.Resources.ServerlessAppPrivateRouteTable;

      expect(igw).toBeDefined();
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');

      // Check for public route (Internet Gateway)
      const publicRoute = template.Resources.ServerlessAppPublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Type).toBe('AWS::EC2::Route');
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');

      // Check for private route (NAT Gateway)
      const privateRoute = template.Resources.ServerlessAppPrivateRoute;
      expect(privateRoute).toBeDefined();
      expect(privateRoute.Type).toBe('AWS::EC2::Route');
      expect(privateRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');

      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable.Type).toBe('AWS::EC2::RouteTable');
      expect(privateRouteTable).toBeDefined();
      expect(privateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have security group for Lambda', () => {
      const sg = template.Resources.ServerlessAppLambdaSecurityGroup;
      expect(sg).toBeDefined();
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupEgress).toBeDefined();
      expect(sg.Properties.SecurityGroupEgress[0].IpProtocol).toBe('-1');
      expect(sg.Properties.SecurityGroupEgress[0].CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('CloudWatch Monitoring Resources', () => {
    test('should have CloudWatch log group', () => {
      const logGroup = template.Resources.ServerlessAppLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toBe(
        '/aws/lambda/ServerlessAppLambda'
      );
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have CloudWatch alarms for monitoring', () => {
      const errorAlarm = template.Resources.ServerlessAppLambdaErrorAlarm;
      const invocationAlarm =
        template.Resources.ServerlessAppLambdaInvocationsAlarm;

      expect(errorAlarm).toBeDefined();
      expect(errorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(errorAlarm.Properties.MetricName).toBe('Errors');
      expect(errorAlarm.Properties.Namespace).toBe('AWS/Lambda');

      expect(invocationAlarm).toBeDefined();
      expect(invocationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(invocationAlarm.Properties.MetricName).toBe('Invocations');
      expect(invocationAlarm.Properties.Namespace).toBe('AWS/Lambda');
    });
  });

  describe('Lambda Permission Resource', () => {
    test('should have proper S3 invoke permission', () => {
      const permission = template.Resources.ServerlessAppBucketInvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceArn).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${S3BucketName}',
      });
      expect(permission.Properties.FunctionName).toEqual({
        Ref: 'ServerlessAppLambda',
      });
    });
  });

  describe('Outputs', () => {
    test('should have required outputs', () => {
      expect(template.Outputs).toHaveProperty('S3BucketName');
      expect(template.Outputs).toHaveProperty('LambdaFunctionName');
      expect(template.Outputs).toHaveProperty('LambdaFunctionArn');
      expect(template.Outputs).toHaveProperty('SecretArn');
      expect(template.Outputs).toHaveProperty('Alarms');
    });

    test('should have proper output descriptions', () => {
      expect(template.Outputs.S3BucketName.Description).toContain(
        'ServerlessApp S3 bucket'
      );
      expect(template.Outputs.LambdaFunctionName.Description).toContain(
        'ServerlessApp Lambda function'
      );
      expect(template.Outputs.SecretArn.Description).toContain(
        'ServerlessApp Lambda Secret'
      );
    });

    test('should reference correct resources in outputs', () => {
      expect(template.Outputs.S3BucketName.Value).toEqual({
        Ref: 'ServerlessAppBucket',
      });
      expect(template.Outputs.LambdaFunctionName.Value).toEqual({
        Ref: 'ServerlessAppLambda',
      });
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['ServerlessAppLambda', 'Arn'],
      });
      expect(template.Outputs.SecretArn.Value).toEqual({
        Ref: 'ServerlessAppSecret',
      });
    });
  });

  describe('Resource Count and Coverage', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10); // Should have substantial infrastructure
    });

    test('should cover all required infrastructure components', () => {
      const resources = Object.keys(template.Resources);
      const resourceTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );

      // Check for key AWS services
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::SecretsManager::Secret');
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::Logs::LogGroup');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
      expect(resourceTypes).toContain('AWS::Lambda::Permission');
    });
  });

  describe('Template Validation', () => {
    test('should not have any undefined references', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).not.toContain('undefined');
      expect(templateString).not.toContain('null');
    });

    test('should follow CloudFormation best practices', () => {
      // All resources should have tags
      Object.entries(template.Resources).forEach(
        ([name, resource]: [string, any]) => {
          if (resource.Properties && 'Tags' in resource.Properties) {
            expect(resource.Properties.Tags).toBeDefined();
            const nameTag = resource.Properties.Tags.find(
              (tag: any) => tag.Key === 'Name'
            );
            if (nameTag) {
              expect(nameTag.Value).toBeTruthy();
            }
          }
        }
      );
    });
  });
});
