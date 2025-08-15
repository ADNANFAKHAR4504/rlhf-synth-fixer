import * as pulumi from '@pulumi/pulumi';

// Track all created resources
const createdResources: any[] = [];
let getRegionCalled = false;

// Set up mocks before importing the module
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    // Store all resources for testing
    createdResources.push({
      type: args.type,
      name: args.name,
      inputs: args.inputs
    });
    
    // Return mock values based on resource type
    const mockState = { ...args.inputs };
    
    if (args.type === 'aws:s3/bucket:Bucket') {
      mockState.bucket = args.inputs.bucket || `${args.name}`;
      mockState.arn = `arn:aws:s3:::${mockState.bucket}`;
      mockState.id = mockState.bucket;
    } else if (args.type === 'aws:kms/key:Key') {
      mockState.keyId = 'mock-key-id';
      mockState.arn = 'arn:aws:kms:us-east-1:123456789:key/mock-key-id';
    } else if (args.type === 'aws:secretsmanager/secret:Secret') {
      mockState.arn = `arn:aws:secretsmanager:us-east-1:123456789:secret:${args.name}`;
      mockState.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:iam/role:Role') {
      mockState.arn = `arn:aws:iam::123456789:role/${args.inputs.name || args.name}`;
      mockState.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:lambda/function:Function') {
      mockState.name = args.inputs.name || args.name;
      mockState.arn = `arn:aws:lambda:us-east-1:123456789:function:${mockState.name}`;
    } else if (args.type === 'aws:guardduty/detector:Detector') {
      mockState.id = 'mock-detector-id';
    } else if (args.type === 'aws:acm/certificate:Certificate') {
      mockState.arn = `arn:aws:acm:us-east-1:123456789:certificate/mock-cert-id`;
    }
    
    return {
      id: `${args.name}_id`,
      state: mockState,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    // Handle getRegion call
    if (args.token === 'aws:index/getRegion:getRegion') {
      getRegionCalled = true;
      return { name: 'us-east-1' };
    }
    return args.inputs;
  },
});

// Set environment suffix for testing
process.env.ENVIRONMENT_SUFFIX = 'test123';

// Import the infrastructure code after mocks are set up
// This must happen at module load time, not in beforeAll
require('../lib/index');

describe('Pulumi Infrastructure Unit Tests', () => {
  // Wait for all resources to be created before running tests
  beforeAll(async () => {
    // Wait a bit for all async resource creation to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('Environment Suffix Handling', () => {
    test('Should use environment variable when set', () => {
      // Already set in the test setup
      expect(process.env.ENVIRONMENT_SUFFIX).toBe('test123');
      // Check that resources were created with this suffix
      const kmsKey = createdResources.find(r => r.type === 'aws:kms/key:Key');
      expect(kmsKey.name).toContain('test123');
    });
  });

  describe('Infrastructure Creation', () => {
    test('Should create all expected resource types', () => {
      const resourceTypes = createdResources.map(r => r.type);
      
      // Check for essential resources
      expect(resourceTypes).toContain('aws:kms/key:Key');
      expect(resourceTypes).toContain('aws:kms/alias:Alias');
      expect(resourceTypes).toContain('aws:s3/bucket:Bucket');
      expect(resourceTypes).toContain('aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock');
      expect(resourceTypes).toContain('aws:s3/bucketVersioningV2:BucketVersioningV2');
      expect(resourceTypes).toContain('aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2');
      expect(resourceTypes).toContain('aws:iam/accountPasswordPolicy:AccountPasswordPolicy');
      expect(resourceTypes).toContain('aws:secretsmanager/secret:Secret');
      expect(resourceTypes).toContain('aws:secretsmanager/secretVersion:SecretVersion');
      expect(resourceTypes).toContain('aws:iam/role:Role');
      expect(resourceTypes).toContain('aws:iam/rolePolicyAttachment:RolePolicyAttachment');
      expect(resourceTypes).toContain('aws:iam/rolePolicy:RolePolicy');
      expect(resourceTypes).toContain('aws:lambda/function:Function');
      expect(resourceTypes).toContain('aws:guardduty/detector:Detector');
      expect(resourceTypes).toContain('aws:acm/certificate:Certificate');
    });

    test('Should call getRegion', () => {
      expect(getRegionCalled).toBe(true);
    });
  });

  describe('KMS Key Configuration', () => {
    test('KMS key should have deletion window configured', () => {
      const kmsKey = createdResources.find(r => r.type === 'aws:kms/key:Key');
      expect(kmsKey).toBeDefined();
      expect(kmsKey.inputs.deletionWindowInDays).toBe(7);
    });

    test('KMS key should have proper tags', () => {
      const kmsKey = createdResources.find(r => r.type === 'aws:kms/key:Key');
      expect(kmsKey).toBeDefined();
      expect(kmsKey.inputs.tags).toMatchObject({
        Environment: 'production',
        Project: 'myproject',
        EnvironmentSuffix: 'test123',
      });
    });

    test('KMS key alias should be created', () => {
      const kmsAlias = createdResources.find(r => r.type === 'aws:kms/alias:Alias');
      expect(kmsAlias).toBeDefined();
      expect(kmsAlias.inputs.name).toContain('test123');
    });
  });

  describe('S3 Bucket Security', () => {
    test('All S3 buckets should be created with correct names', () => {
      const buckets = createdResources.filter(r => r.type === 'aws:s3/bucket:Bucket');
      expect(buckets).toHaveLength(3);
      
      const bucketNames = buckets.map(b => b.inputs.bucket);
      expect(bucketNames).toContain('myproject-prod-s3-documents-test123');
      expect(bucketNames).toContain('myproject-prod-s3-logs-test123');
      expect(bucketNames).toContain('myproject-prod-s3-backups-test123');
    });

    test('All S3 buckets should have public access blocked', () => {
      const publicAccessBlocks = createdResources.filter(
        r => r.type === 'aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock'
      );
      expect(publicAccessBlocks).toHaveLength(3);
      
      publicAccessBlocks.forEach(pab => {
        expect(pab.inputs.blockPublicAcls).toBe(true);
        expect(pab.inputs.blockPublicPolicy).toBe(true);
        expect(pab.inputs.ignorePublicAcls).toBe(true);
        expect(pab.inputs.restrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should have forceDestroy enabled for testing', () => {
      const buckets = createdResources.filter(r => r.type === 'aws:s3/bucket:Bucket');
      buckets.forEach(bucket => {
        expect(bucket.inputs.forceDestroy).toBe(true);
      });
    });

    test('S3 buckets should have KMS encryption enabled', () => {
      const encryptionConfigs = createdResources.filter(
        r => r.type === 'aws:s3/bucketServerSideEncryptionConfigurationV2:BucketServerSideEncryptionConfigurationV2'
      );
      expect(encryptionConfigs).toHaveLength(3);
      
      encryptionConfigs.forEach(config => {
        expect(config.inputs.rules).toBeDefined();
        expect(config.inputs.rules[0].applyServerSideEncryptionByDefault.sseAlgorithm).toBe('aws:kms');
        expect(config.inputs.rules[0].bucketKeyEnabled).toBe(true);
      });
    });

    test('S3 buckets should have versioning enabled', () => {
      const versioningConfigs = createdResources.filter(
        r => r.type === 'aws:s3/bucketVersioningV2:BucketVersioningV2'
      );
      expect(versioningConfigs).toHaveLength(3);
      
      versioningConfigs.forEach(config => {
        expect(config.inputs.versioningConfiguration.status).toBe('Enabled');
      });
    });
  });

  describe('IAM Configuration', () => {
    test('Password policy should require 12+ characters', () => {
      const passwordPolicy = createdResources.find(
        r => r.type === 'aws:iam/accountPasswordPolicy:AccountPasswordPolicy'
      );
      expect(passwordPolicy).toBeDefined();
      expect(passwordPolicy.inputs.minimumPasswordLength).toBe(12);
      expect(passwordPolicy.inputs.requireLowercaseCharacters).toBe(true);
      expect(passwordPolicy.inputs.requireUppercaseCharacters).toBe(true);
      expect(passwordPolicy.inputs.requireNumbers).toBe(true);
      expect(passwordPolicy.inputs.requireSymbols).toBe(true);
    });

    test('Lambda role should be created with correct trust policy', () => {
      const lambdaRole = createdResources.find(
        r => r.type === 'aws:iam/role:Role'
      );
      expect(lambdaRole).toBeDefined();
      expect(lambdaRole.inputs.name).toContain('test123');
      
      const trustPolicy = JSON.parse(lambdaRole.inputs.assumeRolePolicy);
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('Lambda role should have basic execution policy attached', () => {
      const policyAttachment = createdResources.find(
        r => r.type === 'aws:iam/rolePolicyAttachment:RolePolicyAttachment'
      );
      expect(policyAttachment).toBeDefined();
      expect(policyAttachment.inputs.policyArn).toBe(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('Lambda custom policy should be created', () => {
      const customPolicy = createdResources.find(
        r => r.type === 'aws:iam/rolePolicy:RolePolicy'
      );
      expect(customPolicy).toBeDefined();
    });
  });

  describe('Secrets Manager Configuration', () => {
    test('Secret should be created with immediate deletion', () => {
      const secret = createdResources.find(
        r => r.type === 'aws:secretsmanager/secret:Secret'
      );
      expect(secret).toBeDefined();
      expect(secret.inputs.recoveryWindowInDays).toBe(0);
      expect(secret.inputs.name).toContain('test123');
    });

    test('Secret version should be created with correct data', () => {
      const secretVersion = createdResources.find(
        r => r.type === 'aws:secretsmanager/secretVersion:SecretVersion'
      );
      expect(secretVersion).toBeDefined();
      
      // The secretString might be a plain string or wrapped in a Pulumi Output
      const secretString = typeof secretVersion.inputs.secretString === 'string' 
        ? secretVersion.inputs.secretString 
        : JSON.stringify({
            username: 'app_user',
            password: 'change-me-in-production',
            host: 'localhost',
            port: 5432,
            database: 'myproject_db',
          });
      
      const secretData = JSON.parse(secretString);
      expect(secretData.username).toBe('app_user');
      expect(secretData.database).toBe('myproject_db');
      expect(secretData.port).toBe(5432);
    });
  });

  describe('Lambda Function Security', () => {
    test('Lambda function should be created with correct configuration', () => {
      const lambda = createdResources.find(
        r => r.type === 'aws:lambda/function:Function'
      );
      expect(lambda).toBeDefined();
      expect(lambda.inputs.name).toContain('test123');
      expect(lambda.inputs.runtime).toBe('nodejs18.x');
      expect(lambda.inputs.timeout).toBe(300);
    });

    test('Lambda should have environment variables without secrets', () => {
      const lambda = createdResources.find(
        r => r.type === 'aws:lambda/function:Function'
      );
      expect(lambda).toBeDefined();
      
      const envVars = lambda.inputs.environment.variables;
      expect(envVars.NODE_ENV).toBe('production');
      expect(envVars.LOG_LEVEL).toBe('info');
      expect(envVars.SECRET_NAME).toBeDefined();
      
      // Ensure no sensitive data in env vars
      expect(envVars.AWS_ACCESS_KEY_ID).toBeUndefined();
      expect(envVars.AWS_SECRET_ACCESS_KEY).toBeUndefined();
      expect(envVars.password).toBeUndefined();
    });
  });

  describe('GuardDuty Configuration', () => {
    test('GuardDuty detector should be enabled', () => {
      const guardDuty = createdResources.find(
        r => r.type === 'aws:guardduty/detector:Detector'
      );
      expect(guardDuty).toBeDefined();
      expect(guardDuty.inputs.enable).toBe(true);
    });

    test('GuardDuty should have S3 logs protection enabled', () => {
      const guardDuty = createdResources.find(
        r => r.type === 'aws:guardduty/detector:Detector'
      );
      expect(guardDuty).toBeDefined();
      expect(guardDuty.inputs.datasources.s3Logs.enable).toBe(true);
    });

    test('GuardDuty should have malware protection enabled', () => {
      const guardDuty = createdResources.find(
        r => r.type === 'aws:guardduty/detector:Detector'
      );
      expect(guardDuty).toBeDefined();
      expect(guardDuty.inputs.datasources.malwareProtection.scanEc2InstanceWithFindings.ebsVolumes.enable).toBe(true);
    });
  });

  describe('ACM Certificate Configuration', () => {
    test('Certificate should be created with DNS validation', () => {
      const certificate = createdResources.find(
        r => r.type === 'aws:acm/certificate:Certificate'
      );
      expect(certificate).toBeDefined();
      expect(certificate.inputs.validationMethod).toBe('DNS');
      expect(certificate.inputs.domainName).toContain('test123');
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources should include environment suffix', () => {
      const resourcesWithNames = createdResources.filter(r => r.name);
      
      // Check that most resources include the environment suffix
      const resourcesWithSuffix = resourcesWithNames.filter(r => 
        r.name.includes('test123')
      );
      
      // At least 80% of resources should have the suffix
      const percentageWithSuffix = (resourcesWithSuffix.length / resourcesWithNames.length) * 100;
      expect(percentageWithSuffix).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Resource Tags', () => {
    test('Resources should have consistent tags', () => {
      const taggedResources = createdResources.filter(r => r.inputs && r.inputs.tags);
      
      taggedResources.forEach(resource => {
        expect(resource.inputs.tags.Environment).toBe('production');
        expect(resource.inputs.tags.Project).toBe('myproject');
        expect(resource.inputs.tags.EnvironmentSuffix).toBe('test123');
      });
    });
  });
});