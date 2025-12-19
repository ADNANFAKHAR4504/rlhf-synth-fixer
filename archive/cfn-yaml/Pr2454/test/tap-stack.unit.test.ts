import * as fs from 'fs';
import * as path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      expect(template.Description).toBe(
        'Secure, production-ready serverless architecture with S3, CloudFront, Lambda, API Gateway, and DynamoDB'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('prod');
      expect(envParam.Description).toBe(
        'Environment name for resource tagging'
      );
      expect(envParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('CloudFormation Resources', () => {

    test('KMSKey resource is defined correctly', () => {
      const kms = template.Resources.KMSKey;
      expect(kms).toBeDefined();
      expect(kms.Type).toBe('AWS::KMS::Key');
      const props = kms.Properties;
      expect(props.Description['Fn::Sub']).toContain('KMS key for ${ProjectName} encryption');
      expect(Array.isArray(props.Tags)).toBe(true);
    });

    test('KMSKeyAlias resource has correct alias name and target', () => {
      const alias = template.Resources.KMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName['Fn::Sub']).toBe('alias/${ProjectName}-${Environment}-key');
      expect(alias.Properties.TargetKeyId.Ref).toBe('KMSKey');
    });

    test('S3Bucket has versioning, encryption, logging, and public access block', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      const p = bucket.Properties;
      expect(p.VersioningConfiguration.Status).toBe('Enabled');
      expect(p.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(p.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(p.LoggingConfiguration.DestinationBucketName.Ref).toBe('S3LoggingBucket');
    });

    test('S3LoggingBucket has AES256 encryption and lifecycle rule', () => {
      const logBucket = template.Resources.S3LoggingBucket;
      expect(logBucket).toBeDefined();
      expect(logBucket.Type).toBe('AWS::S3::Bucket');
      const p = logBucket.Properties;
      expect(p.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      const rule = p.LifecycleConfiguration.Rules.find((r: any) => r.Id === 'DeleteOldLogs');
      expect(rule).toBeDefined();
      expect(rule.ExpirationInDays).toBe(90);
    });

    test('CloudFrontOriginAccessControl is configured for S3 with sigv4', () => {
      const oac = template.Resources.CloudFrontOriginAccessControl;
      expect(oac).toBeDefined();
      expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
      const cfg = oac.Properties.OriginAccessControlConfig;
      expect(cfg.SigningProtocol).toBe('sigv4');
      expect(cfg.SigningBehavior).toBe('always');
      expect(cfg.OriginAccessControlOriginType).toBe('s3');
    });

    test('CloudFrontDistribution has correct default settings', () => {
      const dist = template.Resources.CloudFrontDistribution;
      expect(dist).toBeDefined();
      expect(dist.Type).toBe('AWS::CloudFront::Distribution');
      const cfg = dist.Properties.DistributionConfig;
      expect(cfg.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
      expect(cfg.Enabled).toBe(true);
      expect(cfg.PriceClass).toBe('PriceClass_100');
      expect(cfg.DefaultRootObject).toBe('index.html');
    });

    test('S3BucketPolicy allows CloudFront to GetObject only from this distribution', () => {
      const policy = template.Resources.S3BucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      const stmt = policy.Properties.PolicyDocument.Statement[0];
      expect(stmt.Principal.Service).toBe('cloudfront.amazonaws.com');
      expect(stmt.Action).toBe('s3:GetObject');
    });

    test('DynamoDBTable uses KMS encryption and has correct key schema', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      const p = table.Properties;
      expect(p.SSESpecification.SSEEnabled).toBe(true);
      expect(p.SSESpecification.SSEType).toBe('KMS');
      expect(p.KeySchema[0].AttributeName).toBe('id');
      expect(p.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
    });

    test('LambdaExecutionRole has necessary managed policies and inline policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const arns = role.Properties.ManagedPolicyArns;
      expect(arns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      const policyNames = role.Properties.Policies.map((p: any) => p.PolicyName);
      expect(policyNames).toEqual(
        expect.arrayContaining(['S3Access', 'DynamoDBAccess', 'KMSAccess', 'S3NotificationAccess'])
      );
    });

    test('LambdaFunction has environment variables and correct handler/runtime', () => {
      const fn = template.Resources.LambdaFunction;
      expect(fn).toBeDefined();
      expect(fn.Type).toBe('AWS::Lambda::Function');
      const p = fn.Properties;
      expect(p.Runtime).toBe('python3.9');
      expect(p.Handler).toBe('index.lambda_handler');
      expect(p.Environment.Variables.DYNAMODB_TABLE.Ref).toBe('DynamoDBTable');
      expect(p.Timeout).toBe(30);
    });

    test('API Gateway RestApi, Resource, Method, Deployment, and Stage are all present', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
      expect(template.Resources.ApiGatewayResource).toBeDefined();
      expect(template.Resources.ApiGatewayMethod).toBeDefined();
      expect(template.Resources.ApiGatewayDeployment).toBeDefined();
      expect(template.Resources.ApiGatewayStage).toBeDefined();

      const method = template.Resources.ApiGatewayMethod.Properties;
      expect(method.HttpMethod).toBe('POST');
      expect(method.Integration.Type).toBe('AWS_PROXY');
    });

    test('LogGroups for Lambda and API Gateway use KMSKey', () => {
      const lambdaLG = template.Resources.LambdaLogGroup;
      const apiLG = template.Resources.ApiGatewayLogGroup;
      expect(lambdaLG.Properties.KmsKeyId['Fn::GetAtt'][1]).toBe('Arn');
      expect(apiLG.Properties.KmsKeyId['Fn::GetAtt'][1]).toBe('Arn');
    });

    test('Lambda permissions allow S3 and API Gateway invocation', () => {
      const permS3 = template.Resources.LambdaInvokePermissionS3;
      const permApi = template.Resources.LambdaInvokePermissionApi;
      expect(permS3.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permApi.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('Custom Resource Lambda and Custom Resource exist for S3 notifications', () => {
      expect(template.Resources.S3NotificationCustomResourceLambda).toBeDefined();
      expect(template.Resources.S3NotificationCustomResource).toBeDefined();
      expect(template.Resources.S3NotificationCustomResource.DependsOn).toContain('LambdaInvokePermissionS3');
    });
  });


  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketArn',
        'S3BucketName',
        'CloudFrontDistributionId',
        'CloudFrontDomainName',
        'StackName',
        'Environment',
        'DynamoDBTableName',
        'DynamoDBTableArn',
      ];

      expectedOutputs.forEach((outputName) => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.Environment;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'Environment' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Environment',
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

    test('should have 24 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(24);
    });

    test('should have exactly four parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have exactly fourteen outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(14);
    });
  });

  describe('Resource Naming Convention', () => {
    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
