import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Secure Web Application Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure and Metadata', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure Web Application Infrastructure with S3, Lambda, CloudFront, WAF, and API Gateway'
      );
      expect(template.Description.length).toBeGreaterThan(50);
    });

    test('should have metadata section with CloudFormation interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

  });

  describe('Parameters', () => {
    test('should have all 4 required parameters', () => {
      const expectedParams = [
        'Environment',
        'ProjectName',
        'Owner',
        'ACMCertificateArn',
      ];

      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });

      expect(Object.keys(template.Parameters).length).toBe(4);
    });

    describe('Environment Parameter', () => {
      test('should have correct type and default', () => {
        const envParam = template.Parameters.Environment;
        expect(envParam.Type).toBe('String');
        expect(envParam.Default).toBe('Development');
      });

      test('should have allowed values constraint', () => {
        const envParam = template.Parameters.Environment;
        expect(envParam.AllowedValues).toBeDefined();
        expect(envParam.AllowedValues).toEqual([
          'Development',
          'Staging',
          'Production',
        ]);
      });

      test('should have descriptive text', () => {
        const envParam = template.Parameters.Environment;
        expect(envParam.Description).toBe('Environment name for tagging');
      });
    });

    describe('ProjectName Parameter', () => {
      test('should have lowercase default with hyphens', () => {
        const projectParam = template.Parameters.ProjectName;
        expect(projectParam.Type).toBe('String');
        expect(projectParam.Default).toBe('secure-web-app');
        expect(projectParam.Default).toMatch(/^[a-z-]+$/);
      });

      test('should have descriptive text', () => {
        const projectParam = template.Parameters.ProjectName;
        expect(projectParam.Description).toBe('Project name for tagging');
      });
    });

    describe('Owner Parameter', () => {
      test('should have correct type and default', () => {
        const ownerParam = template.Parameters.Owner;
        expect(ownerParam.Type).toBe('String');
        expect(ownerParam.Default).toBe('DevOps Team');
      });

      test('should have descriptive text', () => {
        const ownerParam = template.Parameters.Owner;
        expect(ownerParam.Description).toBe('Owner name for tagging');
      });
    });

    describe('ACMCertificateArn Parameter', () => {
      test('should be optional String type', () => {
        const certParam = template.Parameters.ACMCertificateArn;
        expect(certParam.Type).toBe('String');
        expect(certParam.Default).toBe('');
      });

      test('should specify us-east-1 requirement', () => {
        const certParam = template.Parameters.ACMCertificateArn;
        expect(certParam.Description).toContain('us-east-1');
        expect(certParam.Description).toContain('optional');
      });
    });
  });

  describe('Conditions', () => {
    test('should have both required conditions', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.HasSSLCertificate).toBeDefined();
      expect(template.Conditions.IsUsEast1).toBeDefined();
      expect(Object.keys(template.Conditions).length).toBe(2);
    });

    describe('HasSSLCertificate Condition', () => {
      test('should use Fn::Not and Fn::Equals logic', () => {
        const condition = template.Conditions.HasSSLCertificate;
        expect(condition['Fn::Not']).toBeDefined();
        expect(condition['Fn::Not'][0]['Fn::Equals']).toBeDefined();
        expect(condition['Fn::Not'][0]['Fn::Equals'][0]).toEqual({
          Ref: 'ACMCertificateArn',
        });
        expect(condition['Fn::Not'][0]['Fn::Equals'][1]).toBe('');
      });
    });

    describe('IsUsEast1 Condition', () => {
      test('should check for us-east-1 region', () => {
        const condition = template.Conditions.IsUsEast1;
        expect(condition['Fn::Equals']).toBeDefined();
        expect(condition['Fn::Equals'][0]).toEqual({ Ref: 'AWS::Region' });
        expect(condition['Fn::Equals'][1]).toBe('us-east-1');
      });
    });
  });

  describe('Resources - KMS Encryption', () => {
    describe('KMSKey', () => {
      test('should exist and be correct type', () => {
        const kmsKey = template.Resources.KMSKey;
        expect(kmsKey).toBeDefined();
        expect(kmsKey.Type).toBe('AWS::KMS::Key');
      });

      test('should have descriptive text', () => {
        const kmsKey = template.Resources.KMSKey;
        expect(kmsKey.Properties.Description).toBe(
          'Customer-managed KMS key for S3 bucket encryption'
        );
      });

      test('should have key policy with correct version', () => {
        const kmsKey = template.Resources.KMSKey;
        expect(kmsKey.Properties.KeyPolicy).toBeDefined();
        expect(kmsKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
      });

      test('should have IAM root permissions statement', () => {
        const kmsKey = template.Resources.KMSKey;
        const statements = kmsKey.Properties.KeyPolicy.Statement;
        const rootStatement = statements.find(
          (s: any) => s.Sid === 'Enable IAM User Permissions'
        );

        expect(rootStatement).toBeDefined();
        expect(rootStatement.Effect).toBe('Allow');
        expect(rootStatement.Principal.AWS).toEqual({
          'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root',
        });
        expect(rootStatement.Action).toBe('kms:*');
        expect(rootStatement.Resource).toBe('*');
      });

      test('should have S3 service permissions statement', () => {
        const kmsKey = template.Resources.KMSKey;
        const statements = kmsKey.Properties.KeyPolicy.Statement;
        const s3Statement = statements.find(
          (s: any) => s.Sid === 'Allow S3 to use the key'
        );

        expect(s3Statement).toBeDefined();
        expect(s3Statement.Effect).toBe('Allow');
        expect(s3Statement.Principal.Service).toBe('s3.amazonaws.com');
        expect(s3Statement.Action).toEqual([
          'kms:Decrypt',
          'kms:Encrypt',
          'kms:GenerateDataKey',
        ]);
        expect(s3Statement.Resource).toBe('*');
      });

      test('should have all required tags', () => {
        const kmsKey = template.Resources.KMSKey;
        const tags = kmsKey.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);

        const envTag = tags.find((t: any) => t.Key === 'Environment');
        const projectTag = tags.find((t: any) => t.Key === 'Project');
        const ownerTag = tags.find((t: any) => t.Key === 'Owner');

        expect(envTag.Value).toEqual({ Ref: 'Environment' });
        expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });
        expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
      });
    });

    describe('KMSKeyAlias', () => {
      test('should exist and be correct type', () => {
        const alias = template.Resources.KMSKeyAlias;
        expect(alias).toBeDefined();
        expect(alias.Type).toBe('AWS::KMS::Alias');
      });

      test('should have correct alias name format', () => {
        const alias = template.Resources.KMSKeyAlias;
        expect(alias.Properties.AliasName).toEqual({
          'Fn::Sub': 'alias/${ProjectName}-s3-key',
        });
      });

      test('should reference KMSKey', () => {
        const alias = template.Resources.KMSKeyAlias;
        expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
      });
    });
  });

  describe('Resources - S3 Storage', () => {
    describe('S3Bucket', () => {
      test('should exist and be correct type', () => {
        const bucket = template.Resources.S3Bucket;
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('should have unique bucket name with account ID', () => {
        const bucket = template.Resources.S3Bucket;
        expect(bucket.Properties.BucketName).toEqual({
          'Fn::Sub': '${ProjectName}-assets-${AWS::AccountId}',
        });
      });

      test('should have versioning enabled', () => {
        const bucket = template.Resources.S3Bucket;
        expect(
          bucket.Properties.VersioningConfiguration.Status
        ).toBe('Enabled');
      });

      test('should have KMS encryption configured', () => {
        const bucket = template.Resources.S3Bucket;
        const encryption =
          bucket.Properties.BucketEncryption
            .ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault;

        expect(encryption.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });
      });

      test('should have all public access blocked', () => {
        const bucket = template.Resources.S3Bucket;
        const publicAccessBlock =
          bucket.Properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });

      test('should have all required tags', () => {
        const bucket = template.Resources.S3Bucket;
        const tags = bucket.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);

        const envTag = tags.find((t: any) => t.Key === 'Environment');
        const projectTag = tags.find((t: any) => t.Key === 'Project');
        const ownerTag = tags.find((t: any) => t.Key === 'Owner');

        expect(envTag.Value).toEqual({ Ref: 'Environment' });
        expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });
        expect(ownerTag.Value).toEqual({ Ref: 'Owner' });
      });
    });

    describe('S3BucketPolicy', () => {
      test('should exist and be correct type', () => {
        const policy = template.Resources.S3BucketPolicy;
        expect(policy).toBeDefined();
        expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      });

      test('should reference S3 bucket', () => {
        const policy = template.Resources.S3BucketPolicy;
        expect(policy.Properties.Bucket).toEqual({ Ref: 'S3Bucket' });
      });

      test('should allow CloudFront service access', () => {
        const policy = template.Resources.S3BucketPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];

        expect(statement.Sid).toBe('AllowCloudFrontAccess');
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toBe('cloudfront.amazonaws.com');
        expect(statement.Action).toBe('s3:GetObject');
      });

      test('should use bucket ARN with wildcard for resource', () => {
        const policy = template.Resources.S3BucketPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];

        expect(statement.Resource).toEqual({
          'Fn::Sub': '${S3Bucket.Arn}/*',
        });
      });

      test('should have source ARN condition for CloudFront', () => {
        const policy = template.Resources.S3BucketPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];

        expect(statement.Condition.StringEquals['AWS:SourceArn']).toEqual({
          'Fn::Sub':
            'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}',
        });
      });
    });

    describe('OriginAccessControl', () => {
      test('should exist and be correct type', () => {
        const oac = template.Resources.OriginAccessControl;
        expect(oac).toBeDefined();
        expect(oac.Type).toBe('AWS::CloudFront::OriginAccessControl');
      });

      test('should have correct origin type', () => {
        const oac = template.Resources.OriginAccessControl;
        expect(
          oac.Properties.OriginAccessControlConfig.OriginAccessControlOriginType
        ).toBe('s3');
      });

      test('should have signing behavior always', () => {
        const oac = template.Resources.OriginAccessControl;
        expect(
          oac.Properties.OriginAccessControlConfig.SigningBehavior
        ).toBe('always');
      });

      test('should use sigv4 protocol', () => {
        const oac = template.Resources.OriginAccessControl;
        expect(
          oac.Properties.OriginAccessControlConfig.SigningProtocol
        ).toBe('sigv4');
      });

      test('should have descriptive name', () => {
        const oac = template.Resources.OriginAccessControl;
        expect(oac.Properties.OriginAccessControlConfig.Name).toEqual({
          'Fn::Sub': '${ProjectName}-OAC',
        });
      });
    });
  });

  describe('Resources - Secrets Management', () => {
    describe('ApiSecret', () => {
      test('should exist and be correct type', () => {
        const secret = template.Resources.ApiSecret;
        expect(secret).toBeDefined();
        expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      });

      test('should have correct name format', () => {
        const secret = template.Resources.ApiSecret;
        expect(secret.Properties.Name).toEqual({
          'Fn::Sub': '${ProjectName}-api-key',
        });
      });

      test('should have descriptive text', () => {
        const secret = template.Resources.ApiSecret;
        expect(secret.Properties.Description).toBe(
          'API key for Lambda function'
        );
      });

      test('should have valid JSON secret structure', () => {
        const secret = template.Resources.ApiSecret;
        const secretString = secret.Properties.SecretString['Fn::Sub'];

        expect(secretString).toBeDefined();
        expect(secretString).toContain('apiKey');
        expect(secretString).toContain('${AWS::StackId}');

        // Validate JSON structure
        const testJson = secretString.replace('${AWS::StackId}', 'test-id');
        expect(() => JSON.parse(testJson)).not.toThrow();
      });

      test('should have all required tags', () => {
        const secret = template.Resources.ApiSecret;
        const tags = secret.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);

        expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'Project')).toBeDefined();
        expect(tags.find((t: any) => t.Key === 'Owner')).toBeDefined();
      });
    });
  });

  describe('Resources - IAM and Lambda', () => {
    describe('LambdaExecutionRole', () => {
      test('should exist and be correct type', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('should have descriptive role name', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Properties.RoleName).toEqual({
          'Fn::Sub': '${ProjectName}-lambda-execution-role',
        });
      });

      test('should have trust policy for Lambda service', () => {
        const role = template.Resources.LambdaExecutionRole;
        const trustPolicy = role.Properties.AssumeRolePolicyDocument;

        expect(trustPolicy.Version).toBe('2012-10-17');
        expect(trustPolicy.Statement[0].Effect).toBe('Allow');
        expect(trustPolicy.Statement[0].Principal.Service).toBe(
          'lambda.amazonaws.com'
        );
        expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have VPC access managed policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
        );
      });

      test('should have Secrets Manager read-only policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const policies = role.Properties.Policies;
        const secretsPolicy = policies.find(
          (p: any) => p.PolicyName === 'SecretsManagerReadOnly'
        );

        expect(secretsPolicy).toBeDefined();
        expect(secretsPolicy.PolicyDocument.Version).toBe('2012-10-17');

        const statement = secretsPolicy.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('secretsmanager:GetSecretValue');
        expect(statement.Action).toContain('secretsmanager:DescribeSecret');
        expect(statement.Resource).toEqual({ Ref: 'ApiSecret' });
      });

      test('should have S3 read-only policy with least privilege', () => {
        const role = template.Resources.LambdaExecutionRole;
        const policies = role.Properties.Policies;
        const s3Policy = policies.find((p: any) => p.PolicyName === 'S3ReadOnly');

        expect(s3Policy).toBeDefined();
        expect(s3Policy.PolicyDocument.Statement.length).toBe(2);

        const objectStatement = s3Policy.PolicyDocument.Statement[0];
        expect(objectStatement.Effect).toBe('Allow');
        expect(objectStatement.Action).toContain('s3:GetObject');
        expect(objectStatement.Action).toContain('s3:GetObjectVersion');
        expect(objectStatement.Resource).toEqual({
          'Fn::Sub': '${S3Bucket.Arn}/*',
        });

        const bucketStatement = s3Policy.PolicyDocument.Statement[1];
        expect(bucketStatement.Effect).toBe('Allow');
        expect(bucketStatement.Action).toContain('s3:ListBucket');
        expect(bucketStatement.Resource).toEqual({
          'Fn::GetAtt': ['S3Bucket', 'Arn'],
        });
      });

      test('should have KMS decrypt policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const policies = role.Properties.Policies;
        const kmsPolicy = policies.find(
          (p: any) => p.PolicyName === 'KMSDecrypt'
        );

        expect(kmsPolicy).toBeDefined();

        const statement = kmsPolicy.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('kms:Decrypt');
        expect(statement.Action).toContain('kms:DescribeKey');
        expect(statement.Resource).toEqual({
          'Fn::GetAtt': ['KMSKey', 'Arn'],
        });
      });

      test('should have exactly 3 inline policies', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Properties.Policies.length).toBe(3);
      });

      test('should have all required tags', () => {
        const role = template.Resources.LambdaExecutionRole;
        const tags = role.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);
      });
    });

    describe('LambdaFunction', () => {
      test('should exist and be correct type', () => {
        const lambda = template.Resources.LambdaFunction;
        expect(lambda).toBeDefined();
        expect(lambda.Type).toBe('AWS::Lambda::Function');
      });

      test('should have correct function name', () => {
        const lambda = template.Resources.LambdaFunction;
        expect(lambda.Properties.FunctionName).toEqual({
          'Fn::Sub': '${ProjectName}-function',
        });
      });

      test('should use Python 3.9 runtime', () => {
        const lambda = template.Resources.LambdaFunction;
        expect(lambda.Properties.Runtime).toBe('python3.9');
      });

      test('should have correct handler', () => {
        const lambda = template.Resources.LambdaFunction;
        expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      });

      test('should reference Lambda execution role', () => {
        const lambda = template.Resources.LambdaFunction;
        expect(lambda.Properties.Role).toEqual({
          'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
        });
      });

      test('should have inline code with Secrets Manager access', () => {
        const lambda = template.Resources.LambdaFunction;
        const code = lambda.Properties.Code.ZipFile;

        expect(code).toContain('import json');
        expect(code).toContain('import boto3');
        expect(code).toContain('import os');
        expect(code).toContain('def lambda_handler(event, context)');
        expect(code).toContain("boto3.client('secretsmanager')");
        expect(code).toContain('get_secret_value');
      });

      test('should have environment variables for Secret and S3', () => {
        const lambda = template.Resources.LambdaFunction;
        const envVars = lambda.Properties.Environment.Variables;

        expect(envVars.SECRET_NAME).toEqual({ Ref: 'ApiSecret' });
        expect(envVars.S3_BUCKET).toEqual({ Ref: 'S3Bucket' });
      });

      test('should have appropriate timeout and memory settings', () => {
        const lambda = template.Resources.LambdaFunction;
        expect(lambda.Properties.Timeout).toBe(30);
        expect(lambda.Properties.MemorySize).toBe(256);
      });

      test('should have all required tags', () => {
        const lambda = template.Resources.LambdaFunction;
        const tags = lambda.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);
      });
    });
  });

  describe('Resources - WAF Protection', () => {
    describe('WAFWebACL', () => {
      test('should exist and be correct type', () => {
        const waf = template.Resources.WAFWebACL;
        expect(waf).toBeDefined();
        expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      });

      test('should be conditional on IsUsEast1', () => {
        const waf = template.Resources.WAFWebACL;
        expect(waf.Condition).toBe('IsUsEast1');
      });

      test('should have CLOUDFRONT scope', () => {
        const waf = template.Resources.WAFWebACL;
        expect(waf.Properties.Scope).toBe('CLOUDFRONT');
      });

      test('should have correct name format', () => {
        const waf = template.Resources.WAFWebACL;
        expect(waf.Properties.Name).toEqual({
          'Fn::Sub': '${ProjectName}-WebACL',
        });
      });

      test('should have default allow action', () => {
        const waf = template.Resources.WAFWebACL;
        expect(waf.Properties.DefaultAction.Allow).toEqual({});
      });

      test('should have rate limit rule', () => {
        const waf = template.Resources.WAFWebACL;
        const rateRule = waf.Properties.Rules.find(
          (r: any) => r.Name === 'RateLimitRule'
        );

        expect(rateRule).toBeDefined();
        expect(rateRule.Priority).toBe(1);
        expect(rateRule.Statement.RateBasedStatement.Limit).toBe(2000);
        expect(rateRule.Statement.RateBasedStatement.AggregateKeyType).toBe(
          'IP'
        );
        expect(rateRule.Action.Block).toEqual({});
      });

      test('should have AWS managed common rule set', () => {
        const waf = template.Resources.WAFWebACL;
        const commonRule = waf.Properties.Rules.find(
          (r: any) => r.Name === 'AWSManagedRulesCommonRuleSet'
        );

        expect(commonRule).toBeDefined();
        expect(commonRule.Priority).toBe(2);
        expect(
          commonRule.Statement.ManagedRuleGroupStatement.VendorName
        ).toBe('AWS');
        expect(commonRule.Statement.ManagedRuleGroupStatement.Name).toBe(
          'AWSManagedRulesCommonRuleSet'
        );
        expect(commonRule.OverrideAction.None).toEqual({});
      });

      test('should have AWS managed known bad inputs rule set', () => {
        const waf = template.Resources.WAFWebACL;
        const badInputsRule = waf.Properties.Rules.find(
          (r: any) => r.Name === 'AWSManagedRulesKnownBadInputsRuleSet'
        );

        expect(badInputsRule).toBeDefined();
        expect(badInputsRule.Priority).toBe(3);
        expect(
          badInputsRule.Statement.ManagedRuleGroupStatement.VendorName
        ).toBe('AWS');
        expect(badInputsRule.Statement.ManagedRuleGroupStatement.Name).toBe(
          'AWSManagedRulesKnownBadInputsRuleSet'
        );
      });

      test('should have exactly 3 rules', () => {
        const waf = template.Resources.WAFWebACL;
        expect(waf.Properties.Rules.length).toBe(3);
      });

      test('should have visibility config for all rules', () => {
        const waf = template.Resources.WAFWebACL;
        waf.Properties.Rules.forEach((rule: any) => {
          expect(rule.VisibilityConfig).toBeDefined();
          expect(rule.VisibilityConfig.SampledRequestsEnabled).toBe(true);
          expect(rule.VisibilityConfig.CloudWatchMetricsEnabled).toBe(true);
          expect(rule.VisibilityConfig.MetricName).toBeDefined();
        });
      });

      test('should have global visibility config', () => {
        const waf = template.Resources.WAFWebACL;
        expect(waf.Properties.VisibilityConfig).toBeDefined();
        expect(waf.Properties.VisibilityConfig.SampledRequestsEnabled).toBe(
          true
        );
        expect(waf.Properties.VisibilityConfig.CloudWatchMetricsEnabled).toBe(
          true
        );
      });

      test('should have all required tags', () => {
        const waf = template.Resources.WAFWebACL;
        const tags = waf.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);
      });
    });
  });

  describe('Resources - CloudFront CDN', () => {
    describe('CloudFrontDistribution', () => {
      test('should exist and be correct type', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf).toBeDefined();
        expect(cf.Type).toBe('AWS::CloudFront::Distribution');
      });

      test('should be enabled', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf.Properties.DistributionConfig.Enabled).toBe(true);
      });

      test('should have descriptive comment', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf.Properties.DistributionConfig.Comment).toEqual({
          'Fn::Sub': '${ProjectName} CloudFront Distribution',
        });
      });

      test('should have default root object', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf.Properties.DistributionConfig.DefaultRootObject).toBe(
          'index.html'
        );
      });

      test('should have S3 origin with OAC', () => {
        const cf = template.Resources.CloudFrontDistribution;
        const origin = cf.Properties.DistributionConfig.Origins[0];

        expect(origin.Id).toBe('S3Origin');
        expect(origin.DomainName).toEqual({
          'Fn::GetAtt': ['S3Bucket', 'RegionalDomainName'],
        });
        expect(origin.S3OriginConfig.OriginAccessIdentity).toBe('');
        expect(origin.OriginAccessControlId).toEqual({
          Ref: 'OriginAccessControl',
        });
      });

      test('should have default cache behavior with HTTPS redirect', () => {
        const cf = template.Resources.CloudFrontDistribution;
        const behavior = cf.Properties.DistributionConfig.DefaultCacheBehavior;

        expect(behavior.TargetOriginId).toBe('S3Origin');
        expect(behavior.ViewerProtocolPolicy).toBe('redirect-to-https');
        expect(behavior.AllowedMethods).toEqual(['GET', 'HEAD', 'OPTIONS']);
        expect(behavior.CachedMethods).toEqual(['GET', 'HEAD']);
        expect(behavior.Compress).toBe(true);
      });

      test('should have managed cache policy', () => {
        const cf = template.Resources.CloudFrontDistribution;
        const behavior = cf.Properties.DistributionConfig.DefaultCacheBehavior;

        expect(behavior.CachePolicyId).toBe(
          '658327ea-f89d-4fab-a63d-7e88639e58f6'
        );
      });

      test('should have managed response headers policy', () => {
        const cf = template.Resources.CloudFrontDistribution;
        const behavior = cf.Properties.DistributionConfig.DefaultCacheBehavior;

        expect(behavior.ResponseHeadersPolicyId).toBe(
          '67f7725c-6f97-4210-82d7-5512b31e9d03'
        );
      });

      test('should use PriceClass_100', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf.Properties.DistributionConfig.PriceClass).toBe(
          'PriceClass_100'
        );
      });

      test('should have conditional SSL certificate configuration', () => {
        const cf = template.Resources.CloudFrontDistribution;
        const viewerCert = cf.Properties.DistributionConfig.ViewerCertificate;

        expect(viewerCert['Fn::If']).toBeDefined();
        expect(viewerCert['Fn::If'][0]).toBe('HasSSLCertificate');

        // With SSL certificate
        const withSSL = viewerCert['Fn::If'][1];
        expect(withSSL.AcmCertificateArn).toEqual({
          Ref: 'ACMCertificateArn',
        });
        expect(withSSL.SslSupportMethod).toBe('sni-only');
        expect(withSSL.MinimumProtocolVersion).toBe('TLSv1.2_2021');

        // Without SSL certificate
        const withoutSSL = viewerCert['Fn::If'][2];
        expect(withoutSSL.CloudFrontDefaultCertificate).toBe(true);
      });

      test('should have conditional WAF association', () => {
        const cf = template.Resources.CloudFrontDistribution;
        const webAclId = cf.Properties.DistributionConfig.WebACLId;

        expect(webAclId['Fn::If']).toBeDefined();
        expect(webAclId['Fn::If'][0]).toBe('IsUsEast1');
        expect(webAclId['Fn::If'][1]).toEqual({
          'Fn::GetAtt': ['WAFWebACL', 'Arn'],
        });
        expect(webAclId['Fn::If'][2]).toEqual({ Ref: 'AWS::NoValue' });
      });

      test('should support HTTP/2 and HTTP/3', () => {
        const cf = template.Resources.CloudFrontDistribution;
        expect(cf.Properties.DistributionConfig.HttpVersion).toBe('http2and3');
      });

      test('should have all required tags', () => {
        const cf = template.Resources.CloudFrontDistribution;
        const tags = cf.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);
      });
    });
  });

  describe('Resources - API Gateway', () => {
    describe('ApiGatewayLogGroup', () => {
      test('should exist and be correct type', () => {
        const logGroup = template.Resources.ApiGatewayLogGroup;
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      });

      test('should have correct log group name', () => {
        const logGroup = template.Resources.ApiGatewayLogGroup;
        expect(logGroup.Properties.LogGroupName).toEqual({
          'Fn::Sub': '/aws/apigateway/${ProjectName}',
        });
      });

      test('should have 30-day retention', () => {
        const logGroup = template.Resources.ApiGatewayLogGroup;
        expect(logGroup.Properties.RetentionInDays).toBe(30);
      });
    });

    describe('ApiGatewayRestApi', () => {
      test('should exist and be correct type', () => {
        const api = template.Resources.ApiGatewayRestApi;
        expect(api).toBeDefined();
        expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      });

      test('should have correct name', () => {
        const api = template.Resources.ApiGatewayRestApi;
        expect(api.Properties.Name).toEqual({
          'Fn::Sub': '${ProjectName}-API',
        });
      });

      test('should have descriptive text', () => {
        const api = template.Resources.ApiGatewayRestApi;
        expect(api.Properties.Description).toBe(
          'Secure API Gateway for web application'
        );
      });

      test('should be regional endpoint', () => {
        const api = template.Resources.ApiGatewayRestApi;
        expect(api.Properties.EndpointConfiguration.Types).toEqual([
          'REGIONAL',
        ]);
      });

      test('should have all required tags', () => {
        const api = template.Resources.ApiGatewayRestApi;
        const tags = api.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);
      });
    });

    describe('ApiGatewayAccount', () => {
      test('should exist and be correct type', () => {
        const account = template.Resources.ApiGatewayAccount;
        expect(account).toBeDefined();
        expect(account.Type).toBe('AWS::ApiGateway::Account');
      });

      test('should reference CloudWatch role', () => {
        const account = template.Resources.ApiGatewayAccount;
        expect(account.Properties.CloudWatchRoleArn).toEqual({
          'Fn::GetAtt': ['ApiGatewayCloudWatchRole', 'Arn'],
        });
      });
    });

    describe('ApiGatewayCloudWatchRole', () => {
      test('should exist and be correct type', () => {
        const role = template.Resources.ApiGatewayCloudWatchRole;
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('should have trust policy for API Gateway', () => {
        const role = template.Resources.ApiGatewayCloudWatchRole;
        const trustPolicy = role.Properties.AssumeRolePolicyDocument;

        expect(trustPolicy.Version).toBe('2012-10-17');
        expect(trustPolicy.Statement[0].Effect).toBe('Allow');
        expect(trustPolicy.Statement[0].Principal.Service).toBe(
          'apigateway.amazonaws.com'
        );
        expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('should have managed policy for CloudWatch Logs', () => {
        const role = template.Resources.ApiGatewayCloudWatchRole;
        expect(role.Properties.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
        );
      });

      test('should have all required tags', () => {
        const role = template.Resources.ApiGatewayCloudWatchRole;
        const tags = role.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);
      });
    });

    describe('ApiGatewayResource', () => {
      test('should exist and be correct type', () => {
        const resource = template.Resources.ApiGatewayResource;
        expect(resource).toBeDefined();
        expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      });

      test('should reference root resource', () => {
        const resource = template.Resources.ApiGatewayResource;
        expect(resource.Properties.ParentId).toEqual({
          'Fn::GetAtt': ['ApiGatewayRestApi', 'RootResourceId'],
        });
      });

      test('should have path part "data"', () => {
        const resource = template.Resources.ApiGatewayResource;
        expect(resource.Properties.PathPart).toBe('data');
      });

      test('should reference REST API', () => {
        const resource = template.Resources.ApiGatewayResource;
        expect(resource.Properties.RestApiId).toEqual({
          Ref: 'ApiGatewayRestApi',
        });
      });
    });

    describe('ApiGatewayMethod', () => {
      test('should exist and be correct type', () => {
        const method = template.Resources.ApiGatewayMethod;
        expect(method).toBeDefined();
        expect(method.Type).toBe('AWS::ApiGateway::Method');
      });

      test('should be GET method', () => {
        const method = template.Resources.ApiGatewayMethod;
        expect(method.Properties.HttpMethod).toBe('GET');
      });

      test('should reference resource', () => {
        const method = template.Resources.ApiGatewayMethod;
        expect(method.Properties.ResourceId).toEqual({
          Ref: 'ApiGatewayResource',
        });
      });

      test('should have no authorization', () => {
        const method = template.Resources.ApiGatewayMethod;
        expect(method.Properties.AuthorizationType).toBe('NONE');
      });

      test('should have AWS_PROXY integration', () => {
        const method = template.Resources.ApiGatewayMethod;
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
        expect(method.Properties.Integration.IntegrationHttpMethod).toBe(
          'POST'
        );
      });

      test('should integrate with Lambda function', () => {
        const method = template.Resources.ApiGatewayMethod;
        expect(method.Properties.Integration.Uri).toEqual({
          'Fn::Sub':
            'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations',
        });
      });
    });

    describe('ApiGatewayDeployment', () => {
      test('should exist and be correct type', () => {
        const deployment = template.Resources.ApiGatewayDeployment;
        expect(deployment).toBeDefined();
        expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      });

      test('should depend on method', () => {
        const deployment = template.Resources.ApiGatewayDeployment;
        expect(deployment.DependsOn).toContain('ApiGatewayMethod');
      });

      test('should reference REST API', () => {
        const deployment = template.Resources.ApiGatewayDeployment;
        expect(deployment.Properties.RestApiId).toEqual({
          Ref: 'ApiGatewayRestApi',
        });
      });
    });

    describe('ApiGatewayStage', () => {
      test('should exist and be correct type', () => {
        const stage = template.Resources.ApiGatewayStage;
        expect(stage).toBeDefined();
        expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      });

      test('should be named "prod"', () => {
        const stage = template.Resources.ApiGatewayStage;
        expect(stage.Properties.StageName).toBe('prod');
      });

      test('should reference deployment', () => {
        const stage = template.Resources.ApiGatewayStage;
        expect(stage.Properties.DeploymentId).toEqual({
          Ref: 'ApiGatewayDeployment',
        });
      });

      test('should have method settings with logging', () => {
        const stage = template.Resources.ApiGatewayStage;
        const methodSettings = stage.Properties.MethodSettings[0];

        expect(methodSettings.ResourcePath).toBe('/*');
        expect(methodSettings.HttpMethod).toBe('*');
        expect(methodSettings.LoggingLevel).toBe('INFO');
        expect(methodSettings.DataTraceEnabled).toBe(true);
        expect(methodSettings.MetricsEnabled).toBe(true);
      });

      test('should have throttling configured', () => {
        const stage = template.Resources.ApiGatewayStage;
        const methodSettings = stage.Properties.MethodSettings[0];

        expect(methodSettings.ThrottlingBurstLimit).toBe(5000);
        expect(methodSettings.ThrottlingRateLimit).toBe(10000);
      });

      test('should have access logging configured', () => {
        const stage = template.Resources.ApiGatewayStage;
        expect(stage.Properties.AccessLogSetting.DestinationArn).toEqual({
          'Fn::GetAtt': ['ApiGatewayLogGroup', 'Arn'],
        });
        expect(stage.Properties.AccessLogSetting.Format).toBeDefined();
      });

      test('should have X-Ray tracing enabled', () => {
        const stage = template.Resources.ApiGatewayStage;
        expect(stage.Properties.TracingEnabled).toBe(true);
      });

      test('should have all required tags', () => {
        const stage = template.Resources.ApiGatewayStage;
        const tags = stage.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.length).toBe(3);
      });
    });

    describe('LambdaApiGatewayPermission', () => {
      test('should exist and be correct type', () => {
        const permission = template.Resources.LambdaApiGatewayPermission;
        expect(permission).toBeDefined();
        expect(permission.Type).toBe('AWS::Lambda::Permission');
      });

      test('should reference Lambda function', () => {
        const permission = template.Resources.LambdaApiGatewayPermission;
        expect(permission.Properties.FunctionName).toEqual({
          Ref: 'LambdaFunction',
        });
      });

      test('should allow invoke action', () => {
        const permission = template.Resources.LambdaApiGatewayPermission;
        expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      });

      test('should have API Gateway principal', () => {
        const permission = template.Resources.LambdaApiGatewayPermission;
        expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      });

      test('should have source ARN for API Gateway', () => {
        const permission = template.Resources.LambdaApiGatewayPermission;
        expect(permission.Properties.SourceArn).toEqual({
          'Fn::Sub':
            'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*',
        });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all 4 required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'CloudFrontDistributionDomain',
        'ApiGatewayUrl',
        'LambdaFunctionArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });

      expect(Object.keys(template.Outputs).length).toBe(4);
    });

    describe('S3BucketName Output', () => {
      test('should have correct structure', () => {
        const output = template.Outputs.S3BucketName;
        expect(output.Description).toBe('Name of the S3 bucket');
        expect(output.Value).toEqual({ Ref: 'S3Bucket' });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-S3Bucket',
        });
      });
    });

    describe('CloudFrontDistributionDomain Output', () => {
      test('should have correct structure', () => {
        const output = template.Outputs.CloudFrontDistributionDomain;
        expect(output.Description).toBe('CloudFront distribution domain name');
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['CloudFrontDistribution', 'DomainName'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-CloudFrontDomain',
        });
      });
    });

    describe('ApiGatewayUrl Output', () => {
      test('should have correct structure with prod stage', () => {
        const output = template.Outputs.ApiGatewayUrl;
        expect(output.Description).toBe('API Gateway URL');
        expect(output.Value).toEqual({
          'Fn::Sub':
            'https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/prod',
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-ApiUrl',
        });
      });
    });

    describe('LambdaFunctionArn Output', () => {
      test('should have correct structure', () => {
        const output = template.Outputs.LambdaFunctionArn;
        expect(output.Description).toBe('Lambda function ARN');
        expect(output.Value).toEqual({
          'Fn::GetAtt': ['LambdaFunction', 'Arn'],
        });
        expect(output.Export.Name).toEqual({
          'Fn::Sub': '${AWS::StackName}-LambdaArn',
        });
      });
    });
  });

  describe('Template Validation and Best Practices', () => {
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
      expect(template.Conditions).not.toBeNull();
      expect(template.Metadata).not.toBeNull();
    });

    test('should have exactly 4 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have exactly 2 conditions', () => {
      const conditionCount = Object.keys(template.Conditions).length;
      expect(conditionCount).toBe(2);
    });

    test('should have exactly 4 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });

    test('all resources should have unique logical IDs', () => {
      const resourceIds = Object.keys(template.Resources);
      const uniqueIds = new Set(resourceIds);
      expect(resourceIds.length).toBe(uniqueIds.size);
    });

    test('all outputs should have unique names', () => {
      const outputNames = Object.keys(template.Outputs);
      const uniqueNames = new Set(outputNames);
      expect(outputNames.length).toBe(uniqueNames.size);
    });
  });

  describe('Security and Compliance Validation', () => {
    test('all taggable resources should have Environment, Project, and Owner tags', () => {
      const taggableResources = [
        'KMSKey',
        'S3Bucket',
        'ApiSecret',
        'LambdaExecutionRole',
        'LambdaFunction',
        'WAFWebACL',
        'CloudFrontDistribution',
        'ApiGatewayRestApi',
        'ApiGatewayCloudWatchRole',
        'ApiGatewayStage',
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Condition === 'IsUsEast1' && resourceName === 'WAFWebACL') {
          // WAF is conditional, but when it exists, it should have tags
          expect(resource.Properties.Tags).toBeDefined();
          expect(resource.Properties.Tags.length).toBe(3);
        } else {
          expect(resource.Properties.Tags).toBeDefined();
          expect(resource.Properties.Tags.length).toBe(3);

          const envTag = resource.Properties.Tags.find(
            (t: any) => t.Key === 'Environment'
          );
          const projectTag = resource.Properties.Tags.find(
            (t: any) => t.Key === 'Project'
          );
          const ownerTag = resource.Properties.Tags.find(
            (t: any) => t.Key === 'Owner'
          );

          expect(envTag).toBeDefined();
          expect(projectTag).toBeDefined();
          expect(ownerTag).toBeDefined();
        }
      });
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('S3 bucket should have versioning enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('CloudFront should enforce HTTPS', () => {
      const cf = template.Resources.CloudFrontDistribution;
      expect(
        cf.Properties.DistributionConfig.DefaultCacheBehavior
          .ViewerProtocolPolicy
      ).toBe('redirect-to-https');
    });

    test('API Gateway should have logging enabled', () => {
      const stage = template.Resources.ApiGatewayStage;
      expect(stage.Properties.AccessLogSetting).toBeDefined();
      expect(stage.Properties.AccessLogSetting.DestinationArn).toBeDefined();
    });

    test('API Gateway should have throttling configured', () => {
      const stage = template.Resources.ApiGatewayStage;
      const methodSettings = stage.Properties.MethodSettings[0];

      expect(methodSettings.ThrottlingBurstLimit).toBeDefined();
      expect(methodSettings.ThrottlingRateLimit).toBeDefined();
      expect(methodSettings.ThrottlingBurstLimit).toBeGreaterThan(0);
      expect(methodSettings.ThrottlingRateLimit).toBeGreaterThan(0);
    });

    test('Lambda role should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;

      // Each policy should target specific resources
      policies.forEach((policy: any) => {
        policy.PolicyDocument.Statement.forEach((statement: any) => {
          expect(statement.Resource).toBeDefined();
          expect(statement.Resource).not.toBe('*');
        });
      });
    });

    test('WAF should have rate limiting configured', () => {
      const waf = template.Resources.WAFWebACL;
      const rateRule = waf.Properties.Rules.find(
        (r: any) => r.Name === 'RateLimitRule'
      );

      expect(rateRule.Statement.RateBasedStatement.Limit).toBeDefined();
      expect(rateRule.Statement.RateBasedStatement.Limit).toBeGreaterThan(0);
    });

    test('all IAM roles should have assume role policies', () => {
      const roles = [
        'LambdaExecutionRole',
        'ApiGatewayCloudWatchRole',
      ];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
        expect(
          role.Properties.AssumeRolePolicyDocument.Statement.length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('resource names should use Fn::Sub with ProjectName', () => {
      const resourcesWithNames = [
        { name: 'KMSKeyAlias', property: 'AliasName' },
        { name: 'S3Bucket', property: 'BucketName' },
        { name: 'ApiSecret', property: 'Name' },
        { name: 'LambdaExecutionRole', property: 'RoleName' },
        { name: 'LambdaFunction', property: 'FunctionName' },
        { name: 'WAFWebACL', property: 'Name' },
        { name: 'ApiGatewayRestApi', property: 'Name' },
        { name: 'ApiGatewayLogGroup', property: 'LogGroupName' },
      ];

      resourcesWithNames.forEach(({ name, property }) => {
        const resource = template.Resources[name];
        expect(resource.Properties[property]).toBeDefined();
        expect(resource.Properties[property]['Fn::Sub']).toBeDefined();
        expect(resource.Properties[property]['Fn::Sub']).toContain(
          'ProjectName'
        );
      });
    });

  });

  describe('Resource Dependencies', () => {
    test('S3BucketPolicy should reference S3Bucket and CloudFrontDistribution', () => {
      const policy = template.Resources.S3BucketPolicy;
      const policyDoc = JSON.stringify(policy);

      expect(policyDoc).toContain('S3Bucket');
      expect(policyDoc).toContain('CloudFrontDistribution');
    });

    test('Lambda function should reference execution role', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
      });
    });

    test('Lambda execution role policies should reference resources', () => {
      const role = template.Resources.LambdaExecutionRole;
      const roleDoc = JSON.stringify(role);

      expect(roleDoc).toContain('ApiSecret');
      expect(roleDoc).toContain('S3Bucket');
      expect(roleDoc).toContain('KMSKey');
    });

    test('API Gateway deployment should depend on method', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment.DependsOn).toContain('ApiGatewayMethod');
    });

    test('CloudFront should reference S3 bucket and OAC', () => {
      const cf = template.Resources.CloudFrontDistribution;
      const cfDoc = JSON.stringify(cf);

      expect(cfDoc).toContain('S3Bucket');
      expect(cfDoc).toContain('OriginAccessControl');
    });
  });

  describe('Intrinsic Functions Usage', () => {
    test('should use Fn::Sub for string substitution', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::Sub');
    });

    test('should use Fn::GetAtt for attribute retrieval', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::GetAtt');
    });

    test('should use Ref for resource references', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('"Ref"');
    });

    test('should use Fn::If for conditional logic', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::If');
    });

    test('should use Fn::Equals for comparisons', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::Equals');
    });

    test('should use Fn::Not for negation', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).toContain('Fn::Not');
    });
  });
});
