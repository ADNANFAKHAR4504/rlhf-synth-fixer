import fs from 'fs';
import path from 'path';

describe('Portfolio Website CloudFormation Template', () => {
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

    test('should have a descriptive title', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Portfolio Website');
    });
  });

  describe('Parameters', () => {
    test('should have DomainName parameter', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
      expect(template.Parameters.DomainName.Description).toBeTruthy();
    });

    test('should have SenderEmail parameter', () => {
      expect(template.Parameters.SenderEmail).toBeDefined();
      expect(template.Parameters.SenderEmail.Type).toBe('String');
      expect(template.Parameters.SenderEmail.AllowedPattern).toBeTruthy();
    });

    test('should have ReceiverEmail parameter', () => {
      expect(template.Parameters.ReceiverEmail).toBeDefined();
      expect(template.Parameters.ReceiverEmail.Type).toBe('String');
      expect(template.Parameters.ReceiverEmail.AllowedPattern).toBeTruthy();
    });

    test('should have exactly 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });
  });

  describe('S3 Storage Resources', () => {
    test('should have WebsiteBucket resource', () => {
      expect(template.Resources.WebsiteBucket).toBeDefined();
      expect(template.Resources.WebsiteBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('WebsiteBucket should have static website hosting configured', () => {
      const bucket = template.Resources.WebsiteBucket;
      expect(bucket.Properties.WebsiteConfiguration).toBeDefined();
      expect(bucket.Properties.WebsiteConfiguration.IndexDocument).toBe(
        'index.html'
      );
      expect(bucket.Properties.WebsiteConfiguration.ErrorDocument).toBe(
        'error.html'
      );
    });

    test('WebsiteBucket should have public access configuration', () => {
      const bucket = template.Resources.WebsiteBucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock).toBeDefined();
      expect(publicAccessBlock.BlockPublicAcls).toBe(false);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(false);
    });

    test('should have WebsiteBucketPolicy with public read access', () => {
      expect(template.Resources.WebsiteBucketPolicy).toBeDefined();
      const policy = template.Resources.WebsiteBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement[0].Effect).toBe(
        'Allow'
      );
      expect(policy.Properties.PolicyDocument.Statement[0].Action).toBe(
        's3:GetObject'
      );
    });
  });

  describe('CloudFront Distribution', () => {
    test('should have CloudFrontDistribution resource', () => {
      expect(template.Resources.CloudFrontDistribution).toBeDefined();
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Type).toBe('AWS::CloudFront::Distribution');
    });

    test('CloudFront should be enabled', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(distribution.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('CloudFront should enforce HTTPS', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const behavior =
        distribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });

    test('CloudFront should use S3 bucket as origin', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origins = distribution.Properties.DistributionConfig.Origins;
      expect(origins).toHaveLength(1);
      expect(origins[0].DomainName).toBeDefined();
      expect(origins[0].DomainName['Fn::GetAtt']).toEqual([
        'WebsiteBucket',
        'RegionalDomainName',
      ]);
    });

    test('CloudFront should have default root object', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      expect(
        distribution.Properties.DistributionConfig.DefaultRootObject
      ).toBe('index.html');
    });
  });

  describe('Route53 DNS Configuration', () => {
    test('should have Route53RecordSet resource', () => {
      expect(template.Resources.Route53RecordSet).toBeDefined();
      const recordSet = template.Resources.Route53RecordSet;
      expect(recordSet.Type).toBe('AWS::Route53::RecordSet');
    });

    test('Route53 should create A record', () => {
      const recordSet = template.Resources.Route53RecordSet;
      expect(recordSet.Properties.Type).toBe('A');
    });

    test('Route53 should alias to CloudFront distribution', () => {
      const recordSet = template.Resources.Route53RecordSet;
      expect(recordSet.Properties.AliasTarget).toBeDefined();
      expect(recordSet.Properties.AliasTarget.DNSName).toBeDefined();
      expect(recordSet.Properties.AliasTarget.HostedZoneId).toBe(
        'Z2FDTNDATAQYW2'
      );
    });

    test('Route53 should use DomainName parameter', () => {
      const recordSet = template.Resources.Route53RecordSet;
      expect(recordSet.Properties.Name).toEqual({ Ref: 'DomainName' });
    });
  });

  describe('Lambda Function', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have SES permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('SESEmailPolicy');
      expect(policies[0].PolicyDocument.Statement[0].Action).toBe(
        'ses:SendEmail'
      );
    });

    test('should have ContactFormLambda function', () => {
      expect(template.Resources.ContactFormLambda).toBeDefined();
      const lambda = template.Resources.ContactFormLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should use Python 3.9 runtime', () => {
      const lambda = template.Resources.ContactFormLambda;
      expect(lambda.Properties.Runtime).toBe('python3.9');
    });

    test('Lambda should have environment variables for email addresses', () => {
      const lambda = template.Resources.ContactFormLambda;
      expect(lambda.Properties.Environment.Variables.SENDER_EMAIL).toEqual({
        Ref: 'SenderEmail',
      });
      expect(lambda.Properties.Environment.Variables.RECEIVER_EMAIL).toEqual({
        Ref: 'ReceiverEmail',
      });
    });

    test('Lambda should have inline code defined', () => {
      const lambda = template.Resources.ContactFormLambda;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('ses_client');
    });

    test('Lambda should have appropriate timeout and memory', () => {
      const lambda = template.Resources.ContactFormLambda;
      expect(lambda.Properties.Timeout).toBe(30);
      expect(lambda.Properties.MemorySize).toBe(128);
    });
  });

  describe('API Gateway Configuration', () => {
    test('should have ContactFormApi REST API', () => {
      expect(template.Resources.ContactFormApi).toBeDefined();
      const api = template.Resources.ContactFormApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have ContactResource at /contact path', () => {
      expect(template.Resources.ContactResource).toBeDefined();
      const resource = template.Resources.ContactResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.PathPart).toBe('contact');
    });

    test('should have POST method on /contact', () => {
      expect(template.Resources.ContactPostMethod).toBeDefined();
      const method = template.Resources.ContactPostMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('POST');
    });

    test('POST method should integrate with Lambda', () => {
      const method = template.Resources.ContactPostMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
      expect(method.Properties.Integration.Uri).toBeDefined();
    });

    test('should have OPTIONS method for CORS', () => {
      expect(template.Resources.ContactOptionsMethod).toBeDefined();
      const method = template.Resources.ContactOptionsMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('OPTIONS');
    });

    test('OPTIONS method should configure CORS headers', () => {
      const method = template.Resources.ContactOptionsMethod;
      const response = method.Properties.Integration.IntegrationResponses[0];
      expect(
        response.ResponseParameters[
          'method.response.header.Access-Control-Allow-Origin'
        ]
      ).toBe("'*'");
      expect(
        response.ResponseParameters[
          'method.response.header.Access-Control-Allow-Methods'
        ]
      ).toBe("'POST,OPTIONS'");
    });

    test('should have API deployment', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.Properties.StageName).toBe('prod');
    });

    test('should have Lambda invocation permission', () => {
      expect(template.Resources.LambdaApiGatewayPermission).toBeDefined();
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have LambdaErrorAlarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('alarm should monitor Lambda errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
    });

    test('alarm should trigger on errors greater than 0', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.Threshold).toBe(0);
      expect(alarm.Properties.ComparisonOperator).toBe(
        'GreaterThanThreshold'
      );
    });

    test('alarm should evaluate over 5 minutes', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
    });
  });

  describe('Resource Tagging', () => {
    const taggedResourceTypes = [
      'WebsiteBucket',
      'CloudFrontDistribution',
      'LambdaExecutionRole',
      'ContactFormLambda',
      'ContactFormApi',
    ];

    taggedResourceTypes.forEach(resourceName => {
      test(`${resourceName} should have Project tag`, () => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const projectTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Project'
        );
        expect(projectTag).toBeDefined();
        expect(projectTag.Value).toBe('iac-rlhf-amazon');
      });
    });
  });

  describe('Outputs', () => {
    test('should have WebsiteURL output', () => {
      expect(template.Outputs.WebsiteURL).toBeDefined();
      const output = template.Outputs.WebsiteURL;
      expect(output.Description).toBeTruthy();
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have ApiEndpoint output', () => {
      expect(template.Outputs.ApiEndpoint).toBeDefined();
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBeTruthy();
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('should have S3BucketName output', () => {
      expect(template.Outputs.S3BucketName).toBeDefined();
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBeTruthy();
      expect(output.Value).toEqual({ Ref: 'WebsiteBucket' });
    });

    test('should have CloudFrontDistributionId output', () => {
      expect(template.Outputs.CloudFrontDistributionId).toBeDefined();
      const output = template.Outputs.CloudFrontDistributionId;
      expect(output.Description).toBeTruthy();
      expect(output.Value).toEqual({ Ref: 'CloudFrontDistribution' });
    });

    test('should have exactly 4 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });

    test('all outputs should have exports with stack name prefix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
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

    test('should have all required resources', () => {
      const requiredResources = [
        'WebsiteBucket',
        'WebsiteBucketPolicy',
        'CloudFrontDistribution',
        'Route53RecordSet',
        'LambdaExecutionRole',
        'ContactFormLambda',
        'ContactFormApi',
        'ContactResource',
        'ContactPostMethod',
        'ContactOptionsMethod',
        'ApiDeployment',
        'LambdaApiGatewayPermission',
        'LambdaErrorAlarm',
      ];

      requiredResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(13);
    });
  });

  describe('Integration Requirements', () => {
    test('Lambda should reference execution role', () => {
      const lambda = template.Resources.ContactFormLambda;
      expect(lambda.Properties.Role['Fn::GetAtt']).toEqual([
        'LambdaExecutionRole',
        'Arn',
      ]);
    });

    test('API Gateway methods should reference contact resource', () => {
      const postMethod = template.Resources.ContactPostMethod;
      const optionsMethod = template.Resources.ContactOptionsMethod;

      expect(postMethod.Properties.ResourceId).toEqual({
        Ref: 'ContactResource',
      });
      expect(optionsMethod.Properties.ResourceId).toEqual({
        Ref: 'ContactResource',
      });
    });

    test('CloudWatch alarm should monitor correct Lambda function', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      const dimensions = alarm.Properties.Dimensions;
      expect(dimensions).toHaveLength(1);
      expect(dimensions[0].Name).toBe('FunctionName');
      expect(dimensions[0].Value).toEqual({ Ref: 'ContactFormLambda' });
    });

    test('API deployment should depend on methods', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toBeDefined();
      expect(deployment.DependsOn).toContain('ContactPostMethod');
      expect(deployment.DependsOn).toContain('ContactOptionsMethod');
    });
  });
});
