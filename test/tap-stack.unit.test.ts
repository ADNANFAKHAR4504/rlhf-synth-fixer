import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('ServerlessApp CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON version of the template for testing
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
      expect(template.Description).toContain('ServerlessApp');
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParams = ['LambdaRuntime', 'LambdaHandler', 'S3BucketName'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('LambdaRuntime parameter should have correct properties', () => {
      const runtimeParam = template.Parameters.LambdaRuntime;
      expect(runtimeParam.Type).toBe('String');
      expect(runtimeParam.Default).toBe('python3.12');
      expect(runtimeParam.AllowedValues).toContain('python3.12');
      expect(runtimeParam.AllowedValues).toContain('nodejs20.x');
    });

    test('LambdaHandler parameter should have correct properties', () => {
      const handlerParam = template.Parameters.LambdaHandler;
      expect(handlerParam.Type).toBe('String');
      expect(handlerParam.Default).toBe('lambda_function.lambda_handler');
    });

    test('S3BucketName parameter should have correct properties', () => {
      const bucketParam = template.Parameters.S3BucketName;
      expect(bucketParam.Type).toBe('String');
      expect(bucketParam.Default).toBe('serverlessapp-bucket');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap mapping', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2']).toBeDefined();
      expect(template.Mappings.RegionMap['us-west-2'].AZ1).toBe('us-west-2a');
      expect(template.Mappings.RegionMap['us-west-2'].AZ2).toBe('us-west-2b');
    });
  });

  describe('S3 Resources', () => {
    test('should have ServerlessAppBucket resource', () => {
      expect(template.Resources.ServerlessAppBucket).toBeDefined();
      expect(template.Resources.ServerlessAppBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have correct properties', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      const properties = bucket.Properties;

      expect(properties.BucketName).toEqual({ Ref: 'S3BucketName' });
      expect(properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(properties.NotificationConfiguration.LambdaConfigurations).toBeDefined();
    });

    test('should have S3 bucket invoke permission', () => {
      expect(template.Resources.ServerlessAppBucketInvokePermission).toBeDefined();
      const permission = template.Resources.ServerlessAppBucketInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.ServerlessAppVPC).toBeDefined();
      expect(template.Resources.ServerlessAppVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.ServerlessAppVPC.Properties.CidrBlock).toBe('10.0.0.0/24');
    });

    test('should have multi-AZ subnets', () => {
      expect(template.Resources.ServerlessAppSubnetAZ1).toBeDefined();
      expect(template.Resources.ServerlessAppSubnetAZ2).toBeDefined();
      
      const subnet1 = template.Resources.ServerlessAppSubnetAZ1;
      const subnet2 = template.Resources.ServerlessAppSubnetAZ2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.0.0/26');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.0.64/26');
    });

    test('should have internet gateway and routing', () => {
      expect(template.Resources.ServerlessAppInternetGateway).toBeDefined();
      expect(template.Resources.ServerlessAppVPCGatewayAttachment).toBeDefined();
      expect(template.Resources.ServerlessAppRouteTable).toBeDefined();
      expect(template.Resources.ServerlessAppRoute).toBeDefined();
    });

    test('should have security group for Lambda', () => {
      expect(template.Resources.ServerlessAppLambdaSecurityGroup).toBeDefined();
      const sg = template.Resources.ServerlessAppLambdaSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.GroupDescription).toBe('Allow Lambda internet access');
    });
  });

  describe('Lambda Resources', () => {
    test('should have ServerlessAppLambda resource', () => {
      expect(template.Resources.ServerlessAppLambda).toBeDefined();
      expect(template.Resources.ServerlessAppLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda function should have correct properties', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      const properties = lambda.Properties;

      expect(properties.FunctionName).toBe('ServerlessAppLambda');
      expect(properties.MemorySize).toBe(256);
      expect(properties.Timeout).toBe(60);
      expect(properties.Environment.Variables.SERVERLESSAPP_SECRET_ARN).toBeDefined();
    });

    test('Lambda function should have VPC configuration', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      const vpcConfig = lambda.Properties.VpcConfig;
      
      expect(vpcConfig).toBeDefined();
      expect(vpcConfig.SecurityGroupIds).toBeDefined();
      expect(vpcConfig.SubnetIds).toBeDefined();
    });

    test('Lambda function should have proper IAM role reference', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['ServerlessAppLambdaRole', 'Arn']
      });
    });
  });

  describe('IAM Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.ServerlessAppLambdaRole).toBeDefined();
      expect(template.Resources.ServerlessAppLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM role should have correct assume role policy', () => {
      const role = template.Resources.ServerlessAppLambdaRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('IAM role should have least privilege policies', () => {
      const role = template.Resources.ServerlessAppLambdaRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      // Check that it has at least the basic permissions
      expect(policies.length).toBeGreaterThan(0);
      
      // Look for secrets manager access
      const hasSecretsAccess = policies.some((stmt: any) => 
        stmt.Action && stmt.Action.includes('secretsmanager:GetSecretValue')
      );
      expect(hasSecretsAccess).toBe(true);

      // Look for S3 access
      const hasS3Access = policies.some((stmt: any) => 
        stmt.Action && stmt.Action.includes('s3:GetObject')
      );
      expect(hasS3Access).toBe(true);
    });
  });

  describe('Secrets Manager Resources', () => {
    test('should have ServerlessAppSecret resource', () => {
      expect(template.Resources.ServerlessAppSecret).toBeDefined();
      expect(template.Resources.ServerlessAppSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('Secret should have proper structure', () => {
      const secret = template.Resources.ServerlessAppSecret;
      expect(secret.Properties.Name).toBe('ServerlessAppSecret');
      expect(secret.Properties.Description).toContain('Sensitive information');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have Lambda log group', () => {
      expect(template.Resources.ServerlessAppLogGroup).toBeDefined();
      expect(template.Resources.ServerlessAppLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.ServerlessAppLogGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have CloudWatch alarms', () => {
      const expectedAlarms = [
        'ServerlessAppLambdaErrorAlarm',
        'ServerlessAppLambdaInvocationsAlarm'
      ];

      expectedAlarms.forEach(alarmName => {
        expect(template.Resources[alarmName]).toBeDefined();
        expect(template.Resources[alarmName].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });

    test('Error alarm should have correct threshold', () => {
      const errorAlarm = template.Resources.ServerlessAppLambdaErrorAlarm;
      expect(errorAlarm.Properties.Threshold).toBe(1);
      expect(errorAlarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('Invocation alarm should have correct configuration', () => {
      const invocationAlarm = template.Resources.ServerlessAppLambdaInvocationsAlarm;
      expect(invocationAlarm.Properties.Threshold).toBe(100);
      expect(invocationAlarm.Properties.Period).toBe(300);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'SecretArn',
        'Alarms'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
      });
    });
  });

  describe('Security and Best Practices', () => {
    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.ServerlessAppBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('should have proper resource tagging', () => {
      const resourcesWithTags = [
        'ServerlessAppBucket',
        'ServerlessAppSecret',
        'ServerlessAppLambdaRole',
        'ServerlessAppLogGroup',
        'ServerlessAppLambda'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const tags = resource.Properties.Tags;
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
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
    });

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
      expect(resourceCount).toBeLessThan(25);
    });

    test('should have appropriate number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have appropriate number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should be prefixed with ServerlessApp', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        expect(resourceName).toMatch(/^ServerlessApp/);
      });
    });
  });

  describe('High Availability Design', () => {
    test('should deploy across multiple availability zones', () => {
      expect(template.Resources.ServerlessAppSubnetAZ1).toBeDefined();
      expect(template.Resources.ServerlessAppSubnetAZ2).toBeDefined();
      
      const subnet1 = template.Resources.ServerlessAppSubnetAZ1;
      const subnet2 = template.Resources.ServerlessAppSubnetAZ2;
      
      // Should reference different AZs from mapping
      expect(subnet1.Properties.AvailabilityZone).toEqual({
        'Fn::FindInMap': ['RegionMap', 'us-west-2', 'AZ1']
      });
      expect(subnet2.Properties.AvailabilityZone).toEqual({
        'Fn::FindInMap': ['RegionMap', 'us-west-2', 'AZ2']
      });
    });

    test('Lambda should be configured for multiple subnets', () => {
      const lambda = template.Resources.ServerlessAppLambda;
      const subnetIds = lambda.Properties.VpcConfig.SubnetIds;
      
      expect(subnetIds).toHaveLength(2);
      expect(subnetIds).toContainEqual({ Ref: 'ServerlessAppSubnetAZ1' });
      expect(subnetIds).toContainEqual({ Ref: 'ServerlessAppSubnetAZ2' });
    });
  });
});