import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
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
        'Serverless infrastructure with S3 triggers, Lambda processing, API Gateway, and DynamoDB'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.BucketName).toBeDefined();
      expect(template.Parameters.TableName).toBeDefined();
      expect(template.Parameters.Environment).toBeDefined();
    });

    test('BucketName parameter should have correct properties', () => {
      const param = template.Parameters.BucketName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('serverless-processing-bucket');
      expect(param.Description).toBe('S3 bucket name for file uploads');
    });

    test('TableName parameter should have correct properties', () => {
      const param = template.Parameters.TableName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('ProcessingTable');
      expect(param.Description).toBe('DynamoDB table name');
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Production');
      expect(param.Description).toBe('Environment tag for all resources');
    });
  });

  describe('S3 Bucket Resource', () => {
    test('should have ProcessingBucket resource', () => {
      expect(template.Resources.ProcessingBucket).toBeDefined();
    });

    test('ProcessingBucket should be an S3 bucket', () => {
      const bucket = template.Resources.ProcessingBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ProcessingBucket should have versioning enabled', () => {
      const bucket = template.Resources.ProcessingBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('ProcessingBucket should have public access blocked', () => {
      const bucket = template.Resources.ProcessingBucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('ProcessingBucket should have Environment tag', () => {
      const bucket = template.Resources.ProcessingBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      const envTag = bucket.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });
  });

  describe('DynamoDB Table Resource', () => {
    test('should have ProcessingTable resource', () => {
      expect(template.Resources.ProcessingTable).toBeDefined();
    });

    test('ProcessingTable should be a DynamoDB table', () => {
      const table = template.Resources.ProcessingTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('ProcessingTable should have composite primary key', () => {
      const table = template.Resources.ProcessingTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(2);

      const partitionKey = keySchema.find((key: any) => key.KeyType === 'HASH');
      expect(partitionKey).toBeDefined();
      expect(partitionKey.AttributeName).toBe('PartitionKey');

      const sortKey = keySchema.find((key: any) => key.KeyType === 'RANGE');
      expect(sortKey).toBeDefined();
      expect(sortKey.AttributeName).toBe('SortKey');
    });

    test('ProcessingTable should have correct attribute definitions', () => {
      const table = template.Resources.ProcessingTable;
      const attributes = table.Properties.AttributeDefinitions;

      expect(attributes).toHaveLength(2);

      const partitionKeyAttr = attributes.find(
        (attr: any) => attr.AttributeName === 'PartitionKey'
      );
      expect(partitionKeyAttr).toBeDefined();
      expect(partitionKeyAttr.AttributeType).toBe('S');

      const sortKeyAttr = attributes.find(
        (attr: any) => attr.AttributeName === 'SortKey'
      );
      expect(sortKeyAttr).toBeDefined();
      expect(sortKeyAttr.AttributeType).toBe('S');
    });

    test('ProcessingTable should have PAY_PER_REQUEST billing mode', () => {
      const table = template.Resources.ProcessingTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('ProcessingTable should have streams enabled', () => {
      const table = template.Resources.ProcessingTable;
      expect(table.Properties.StreamSpecification).toBeDefined();
      expect(table.Properties.StreamSpecification.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
    });

    test('ProcessingTable should have Environment tag', () => {
      const table = template.Resources.ProcessingTable;
      expect(table.Properties.Tags).toBeDefined();
      const envTag = table.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });
  });

  describe('Lambda Function Resource', () => {
    test('should have ProcessingFunction resource', () => {
      expect(template.Resources.ProcessingFunction).toBeDefined();
    });

    test('ProcessingFunction should be a Lambda function', () => {
      const func = template.Resources.ProcessingFunction;
      expect(func.Type).toBe('AWS::Lambda::Function');
    });

    test('ProcessingFunction should have correct runtime and handler', () => {
      const func = template.Resources.ProcessingFunction;
      expect(func.Properties.Runtime).toBe('python3.11');
      expect(func.Properties.Handler).toBe('index.lambda_handler');
    });

    test('ProcessingFunction should have correct configuration', () => {
      const func = template.Resources.ProcessingFunction;
      expect(func.Properties.Timeout).toBe(300);
      expect(func.Properties.MemorySize).toBe(256);
    });

    test('ProcessingFunction should have environment variables', () => {
      const func = template.Resources.ProcessingFunction;
      expect(func.Properties.Environment).toBeDefined();
      expect(func.Properties.Environment.Variables).toBeDefined();
      expect(func.Properties.Environment.Variables.TABLE_NAME).toBeDefined();
      expect(func.Properties.Environment.Variables.BUCKET_NAME).toBeDefined();
    });

    test('ProcessingFunction should have Environment tag', () => {
      const func = template.Resources.ProcessingFunction;
      expect(func.Properties.Tags).toBeDefined();
      const envTag = func.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });
  });

  describe('IAM Role Resource', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be an IAM role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Version).toBe('2012-10-17');
      expect(assumeRolePolicy.Statement).toHaveLength(1);
      expect(assumeRolePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const dynamoPolicy = policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );

      expect(dynamoPolicy).toBeDefined();
      expect(dynamoPolicy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:GetItem'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:PutItem'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Action).toContain(
        'dynamodb:Query'
      );
    });

    test('LambdaExecutionRole should have S3 access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');

      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:GetObject'
      );
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain(
        's3:GetObjectVersion'
      );
    });

    test('LambdaExecutionRole should have Environment tag', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.Tags).toBeDefined();
      const envTag = role.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });
  });

  describe('API Gateway Resources', () => {
    test('should have ProcessingApi resource', () => {
      expect(template.Resources.ProcessingApi).toBeDefined();
    });

    test('ProcessingApi should be a REST API', () => {
      const api = template.Resources.ProcessingApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('ProcessingApi should have regional endpoint', () => {
      const api = template.Resources.ProcessingApi;
      expect(api.Properties.EndpointConfiguration).toBeDefined();
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have ApiResource', () => {
      expect(template.Resources.ApiResource).toBeDefined();
      const resource = template.Resources.ApiResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('process');
    });

    test('should have GET method', () => {
      expect(template.Resources.ApiGetMethod).toBeDefined();
      const method = template.Resources.ApiGetMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should have POST method', () => {
      expect(template.Resources.ApiPostMethod).toBeDefined();
      const method = template.Resources.ApiPostMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should have OPTIONS method for CORS', () => {
      expect(template.Resources.ApiOptionsMethod).toBeDefined();
      const method = template.Resources.ApiOptionsMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('OPTIONS');
      expect(method.Properties.Integration.Type).toBe('MOCK');
    });

    test('should have API deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toBe('prod');
    });

    test('ProcessingApi should have Environment tag', () => {
      const api = template.Resources.ProcessingApi;
      expect(api.Properties.Tags).toBeDefined();
      const envTag = api.Properties.Tags.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(envTag).toBeDefined();
      expect(envTag.Value).toEqual({ Ref: 'Environment' });
    });
  });

  describe('Lambda Permissions', () => {
    test('should have S3 invoke permission', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });

    test('should have API Gateway invoke permissions', () => {
      expect(template.Resources.ApiGatewayInvokePermission).toBeDefined();
      expect(template.Resources.ApiGatewayGetInvokePermission).toBeDefined();

      const postPermission = template.Resources.ApiGatewayInvokePermission;
      expect(postPermission.Type).toBe('AWS::Lambda::Permission');
      expect(postPermission.Properties.Principal).toBe(
        'apigateway.amazonaws.com'
      );

      const getPermission = template.Resources.ApiGatewayGetInvokePermission;
      expect(getPermission.Type).toBe('AWS::Lambda::Permission');
      expect(getPermission.Properties.Principal).toBe(
        'apigateway.amazonaws.com'
      );
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'DynamoDBTableName',
        'LambdaFunctionName',
        'ApiGatewayUrl',
        'ApiGatewayRestApiId',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the S3 bucket');
      expect(output.Value).toEqual({ Ref: 'ProcessingBucket' });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'ProcessingTable' });
    });

    test('LambdaFunctionName output should be correct', () => {
      const output = template.Outputs.LambdaFunctionName;
      expect(output.Description).toBe('Name of the Lambda function');
      expect(output.Value).toEqual({ Ref: 'ProcessingFunction' });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toBeDefined();
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all taggable resources should have Environment tag', () => {
      const taggableResources = [
        'ProcessingBucket',
        'ProcessingTable',
        'LambdaExecutionRole',
        'ProcessingFunction',
        'ProcessingApi',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties) {
          expect(resource.Properties.Tags).toBeDefined();
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
          expect(envTag.Value).toEqual({ Ref: 'Environment' });
        }
      });
    });

    test('IAM policies should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      // Check DynamoDB policy is restricted to specific table
      const dynamoPolicy = policies.find(
        (p: any) => p.PolicyName === 'DynamoDBAccess'
      );
      expect(dynamoPolicy.PolicyDocument.Statement[0].Resource).toBeDefined();
      expect(
        dynamoPolicy.PolicyDocument.Statement[0].Resource['Fn::GetAtt']
      ).toEqual(['ProcessingTable', 'Arn']);

      // Check S3 policy is restricted to specific bucket
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3Access');
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toBeDefined();
      expect(
        s3Policy.PolicyDocument.Statement[0].Resource['Fn::Sub']
      ).toContain('arn:aws:s3:::');
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.ProcessingBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(13); // 13 resources after removing custom resources
    });

    test('should have exactly three parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have exactly five outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });
  });
});
