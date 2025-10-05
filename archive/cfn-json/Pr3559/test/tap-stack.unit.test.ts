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
    test('should have valid CloudFormation format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toContain('Portfolio Website');
    });
  });

  describe('Parameters', () => {
    test('should have all 3 parameters with correct types and default values', () => {
      const { DomainName, SenderEmail, ReceiverEmail } = template.Parameters;

      expect(DomainName).toBeDefined();
      expect(DomainName.Type).toBe('String');
      expect(DomainName.Default).toBe('my-portfolio.example.com');

      expect(SenderEmail).toBeDefined();
      expect(SenderEmail.Type).toBe('String');
      expect(SenderEmail.Default).toBe('sender@example.com');

      expect(ReceiverEmail).toBeDefined();
      expect(ReceiverEmail.Type).toBe('String');
      expect(ReceiverEmail.Default).toBe('receiver@example.com');
    });
  });

  describe('S3 & CloudFront (Content Delivery)', () => {
    test('should have an S3 bucket configured for website hosting', () => {
      const bucket = template.Resources.WebsiteBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.WebsiteConfiguration.IndexDocument).toBe('index.html');
    });

    test('should have a CloudFront Origin Access Identity (OAI)', () => {
      expect(template.Resources.CloudFrontOriginAccessIdentity).toBeDefined();
      expect(template.Resources.CloudFrontOriginAccessIdentity.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('S3 bucket policy should grant access only to the CloudFront OAI', () => {
      const policy = template.Resources.WebsiteBucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];

      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toBe('s3:GetObject');
      expect(statement.Principal.AWS['Fn::Sub']).toContain('CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity}');
    });

    test('CloudFront distribution should use the S3 bucket as a secure S3OriginConfig', () => {
      const distribution = template.Resources.CloudFrontDistribution;
      const origin = distribution.Properties.DistributionConfig.Origins[0];

      expect(distribution).toBeDefined();
      expect(origin.S3OriginConfig).toBeDefined();
      expect(origin.S3OriginConfig.OriginAccessIdentity).toBeDefined();
      expect(origin.CustomOriginConfig).toBeUndefined(); // Ensure old, incorrect config is gone
    });

    test('CloudFront should redirect HTTP to HTTPS', () => {
      const behavior = template.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior;
      expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    });
  });

  describe('API Backend (API Gateway & Lambda)', () => {
    test('should have a Lambda execution role with SES permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];

      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(policy.PolicyDocument.Statement[0].Action).toBe('ses:SendEmail');
    });

    test('should have a Lambda function with correct configuration', () => {
      const lambda = template.Resources.ContactFormLambda;

      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.Properties.Role['Fn::GetAtt']).toEqual(['LambdaExecutionRole', 'Arn']);
      expect(lambda.Properties.Code.ZipFile).not.toContain("region_name="); // Check for no hardcoded region
    });

    test('should have an API Gateway with a POST method on /contact', () => {
      const api = template.Resources.ContactFormApi;
      const resource = template.Resources.ContactResource;
      const postMethod = template.Resources.ContactPostMethod;

      expect(api).toBeDefined();
      expect(resource.Properties.PathPart).toBe('contact');
      expect(postMethod.Properties.HttpMethod).toBe('POST');
      expect(postMethod.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should have a CORS OPTIONS method on the /contact resource', () => {
      const optionsMethod = template.Resources.ContactOptionsMethod;
      const responseParams = optionsMethod.Properties.Integration.IntegrationResponses[0].ResponseParameters;

      expect(optionsMethod).toBeDefined();
      expect(optionsMethod.Properties.HttpMethod).toBe('OPTIONS');
      expect(responseParams['method.response.header.Access-Control-Allow-Origin']).toBe("'*'");
    });
  });

  describe('Monitoring & DNS', () => {
    test('should have a CloudWatch alarm for Lambda errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm;

      expect(alarm).toBeDefined();
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'ContactFormLambda' });
    });

    test('should have a Route53 A record aliased to CloudFront', () => {
      const recordSet = template.Resources.Route53RecordSet;

      expect(recordSet).toBeDefined();
      expect(recordSet.Properties.Type).toBe('A');
      expect(recordSet.Properties.AliasTarget.DNSName['Fn::GetAtt']).toEqual(['CloudFrontDistribution', 'DomainName']);
    });
  });

  describe('Outputs', () => {
    test('should define all 4 required outputs', () => {
      expect(template.Outputs.WebsiteURL).toBeDefined();
      expect(template.Outputs.ApiEndpoint).toBeDefined();
      expect(template.Outputs.S3BucketName).toBeDefined();
      expect(template.Outputs.CloudFrontDistributionId).toBeDefined();
    });
  });
});

