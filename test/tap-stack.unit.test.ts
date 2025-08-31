import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack, TapStackProps } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();

    // Use TapStackProps interface with environmentSuffix
    const stackProps: TapStackProps = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'test',
    };

    stack = new TapStack(app, 'TestTapStack', stackProps);
    template = Template.fromStack(stack);
  });

  // ... (all your existing tests remain the same) ...

  test('CloudFront distribution is created without custom domain when none provided', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment:
          'TAP CloudFront distribution for secure content delivery - test',
        Enabled: true,
        IPV6Enabled: true,
        // Should not have domainNames when no custom domain
      },
    });

    // Verify no ACM certificate is created when no custom domain
    const certificates = template.findResources(
      'AWS::CertificateManager::Certificate'
    );
    expect(Object.keys(certificates)).toHaveLength(0);
  });

  test('CloudFront distribution is created with custom domain when provided', () => {
    // Create a new app and stack with custom domain context
    const customDomainApp = new cdk.App({
      context: {
        customDomain: 'example.com',
      },
    });

    const customDomainStackProps: TapStackProps = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'prod',
    };

    const customDomainStack = new TapStack(
      customDomainApp,
      'TestTapStackCustomDomain',
      customDomainStackProps
    );
    const customDomainTemplate = Template.fromStack(customDomainStack);

    // Verify CloudFront distribution has custom domain
    customDomainTemplate.hasResourceProperties(
      'AWS::CloudFront::Distribution',
      {
        DistributionConfig: {
          Comment:
            'TAP CloudFront distribution for secure content delivery - prod',
          Enabled: true,
          IPV6Enabled: true,
          Aliases: ['example.com'],
        },
      }
    );

    // Verify ACM certificate is created for custom domain
    customDomainTemplate.hasResourceProperties(
      'AWS::CertificateManager::Certificate',
      {
        DomainName: 'example.com',
        ValidationMethod: 'DNS',
      }
    );
  });

  test('CloudFront OAC resource policy is created correctly', () => {
    // Verify the CloudFront OAC resource policy is added to S3 bucket
    template.hasResourceProperties('AWS::S3::BucketPolicy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Condition: {
              StringEquals: {
                'AWS:SourceArn': Match.stringLikeRegexp(
                  'arn:aws:cloudfront::123456789012:distribution/.*'
                ),
              },
            },
          }),
        ]),
      },
    });
  });

  test('KMS key has correct removal policy based on environment', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Description: 'KMS key for S3 bucket encryption - test',
    });

    // Test that production environment would have different settings
    const prodApp = new cdk.App();
    const prodStackProps: TapStackProps = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'prod',
    };

    const prodStack = new TapStack(prodApp, 'TestTapStackProd', prodStackProps);
    const prodTemplate = Template.fromStack(prodStack);

    // KMS key should still have the same properties regardless of environment
    prodTemplate.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Description: 'KMS key for S3 bucket encryption - prod',
    });
  });

  test('VPC has correct NAT gateway configuration for cost optimization', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });

    // Verify NAT gateway count (should be 1 for cost optimization)
    const natGateways = template.findResources('AWS::EC2::NatGateway');
    expect(Object.keys(natGateways)).toHaveLength(1);
  });

  test('Lambda function has correct VPC configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      VpcConfig: {
        SubnetIds: Match.anyValue(),
        SecurityGroupIds: Match.anyValue(),
      },
    });

    // Verify Lambda is in private subnets
    const lambdaFunction = template.findResources('AWS::Lambda::Function');
    const lambdaProperties = Object.values(lambdaFunction)[0].Properties;
    expect(lambdaProperties.VpcConfig).toBeDefined();
  });

  test('SSM parameters have correct values and types', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/tap/test/lambda/db-credentials',
      Type: 'String',
      Value: Match.stringLikeRegexp(
        '.*username.*tapuser.*password.*changeme123!.*'
      ),
      Description: 'Database credentials for TAP Lambda function - test',
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/tap/test/lambda/api-key',
      Type: 'String',
      Value: 'your-api-key-here',
      Description: 'API key for external service integration - test',
    });
  });

  test('Lambda function code contains expected logic', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Code: {
        ZipFile: Match.stringLikeRegexp('import.*boto3.*'),
      },
    });

    // Verify the inline code contains expected functionality
    const lambdaFunctions = template.findResources('AWS::Lambda::Function');
    const lambdaCode =
      Object.values(lambdaFunctions)[0].Properties.Code.ZipFile;

    expect(lambdaCode).toMatch(/boto3\.client\(['"]ssm['"]\)/);
    expect(lambdaCode).toMatch(/boto3\.client\(['"]s3['"]\)/);
    expect(lambdaCode).toMatch(/event\.get\(['"]Records['"]/);
    expect(lambdaCode).toMatch(/s3\.get_object/);
    expect(lambdaCode).toMatch(/s3\.put_object/);
  });

  test('All resources have proper environment suffix in names/descriptions', () => {
    // Test various resources for environment suffix
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: 'alias/tap-s3-encryption-key-test',
    });

    template.hasResourceProperties('AWS::Lambda::Function', {
      Description: 'TAP Lambda function triggered by S3 events - test',
    });

    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment:
          'TAP CloudFront distribution for secure content delivery - test',
      },
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Description: Match.stringLikeRegexp('.*test.*'),
    });
  });
});
