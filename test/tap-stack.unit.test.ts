// test/tap-stack.unit.test.ts
import { App, Testing } from 'cdktf';
import 'cdktf/lib/testing/adapters/jest';
import { TapStack } from '../lib/tap-stack';

// --- Mocking the Modules ---
// This mock setup is crucial for isolating the TapStack logic during tests.
jest.mock('../lib/modules', () => {
  return {
    VpcModule: jest.fn(() => ({
      vpc: { id: 'mock-vpc-id' },
      privateSubnetIds: ['mock-private-subnet-1', 'mock-private-subnet-2'],
    })),
    KmsModule: jest.fn(() => ({
      kmsKey: {
        id: 'mock-kms-key-id',
        arn: 'mock-kms-arn',
      },
    })),
    Ec2Module: jest.fn(() => ({
      instance: {
        id: 'mock-instance-id',
        privateIp: 'mock-private-ip',
      },
    })),
    RdsModule: jest.fn(() => ({
      db: {
        id: 'mock-rds-id',
        endpoint: 'mock-rds-endpoint',
      },
      dbSecret: { arn: 'mock-rds-secret-arn' },
    })),
    S3Module: jest.fn((scope, id, props) => ({
      bucket: {
        bucket: 'mock-s3-bucket',
        arn: 'mock-s3-bucket-arn',
        bucketRegionalDomainName: 'mock-s3-domain.com',
      },
      // Only include OAI if CloudFront is enabled
      ...(props?.enableCloudFront && {
        oai: {
          cloudfrontAccessIdentityPath: 'origin-access-identity/cloudfront/mock-oai-id',
          iamArn: 'arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity mock-oai-id',
        },
      }),
    })),
    CloudFrontModule: jest.fn(() => ({})),
    CloudTrailModule: jest.fn(() => ({})),
    IamModule: jest.fn(() => ({})),
  };
});

describe('TapStack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  // Import the mocked modules after jest.mock() has been called.
  const {
    VpcModule,
    KmsModule,
    Ec2Module,
    RdsModule,
    S3Module,
    CloudFrontModule,
    CloudTrailModule,
    IamModule,
  } = require('../lib/modules');

  // Clear all mocks before each test to ensure a clean state.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------
  // Stack Configuration Tests
  // ------------------------
  describe('Stack Configuration and Synthesis', () => {
    test('TapStack should instantiate with custom props', () => {
      app = new App();
      stack = new TapStack(app, 'TestCustomStack', {
        environmentSuffix: 'prod',
        stateBucket: 'my-custom-state-bucket',
        awsRegion: 'us-west-2',
        defaultTags: { tags: { Project: 'TAP' } },
        project: 'custom-project',
        acmCertArn: 'arn:aws:acm:us-east-1:123456789012:certificate/custom',
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.bucket).toBe('my-custom-state-bucket');
      expect(parsed.terraform.backend.s3.key).toBe('prod/TestCustomStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2');
      expect(synthesized).toMatchSnapshot();
    });

    test('TapStack should use default values when no props are provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestDefaultStack');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
      expect(parsed.terraform.backend.s3.key).toBe('dev/TestDefaultStack.tfstate');
      expect(parsed.provider.aws[0].region).toBe('us-west-2');
      expect(synthesized).toMatchSnapshot();
    });
  });

  // ------------------------
  // S3 Backend Tests
  // ------------------------
  describe('S3 Backend Configuration', () => {
    beforeEach(() => {
        app = new App();
        stack = new TapStack(app, 'TestBackend');
        synthesized = Testing.synth(stack);
    });

    test('should configure the S3 backend with correct defaults', () => {
        const parsed = JSON.parse(synthesized);
        expect(parsed.terraform.backend.s3).toBeDefined();
        expect(parsed.terraform.backend.s3.bucket).toBe('iac-rlhf-tf-states');
        expect(parsed.terraform.backend.s3.key).toBe('dev/TestBackend.tfstate');
        expect(parsed.terraform.backend.s3.region).toBe('us-east-1');
        expect(parsed.terraform.backend.s3.encrypt).toBe(true);
    });

    test('should enable S3 backend state locking via escape hatch', () => {
        const parsed = JSON.parse(synthesized);
        expect(parsed.terraform.backend.s3.use_lockfile).toBe(true);
    });
  });

  // ------------------------
  // Provider Configuration Tests
  // ------------------------
  describe('Provider Configuration', () => {
    test('should configure AWS and Random providers', () => {
      app = new App();
      stack = new TapStack(app, 'TestProviders');
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.provider.aws).toBeDefined();
      expect(parsed.provider.random).toBeDefined();
    });

    test('should apply default tags to AWS provider when provided', () => {
      app = new App();
      stack = new TapStack(app, 'TestTags', {
        defaultTags: { tags: { Environment: 'test', Owner: 'team' } },
      });
      synthesized = Testing.synth(stack);
      const parsed = JSON.parse(synthesized);

      expect(parsed.provider.aws[0].default_tags[0].tags).toEqual({
        Environment: 'test',
        Owner: 'team',
      });
    });
  });

  // ------------------------
  // Module Instantiation and Wiring Logic
  // ------------------------
  describe('Module Instantiation and Wiring', () => {
    describe('when acmCertArn is NOT provided', () => {
      beforeEach(() => {
        app = new App();
        stack = new TapStack(app, 'TestStackWithoutCloudFront');
        Testing.fullSynth(stack);
      });

      test('should create all modules EXCEPT CloudFront', () => {
        expect(VpcModule).toHaveBeenCalledTimes(1);
        expect(KmsModule).toHaveBeenCalledTimes(1);
        expect(S3Module).toHaveBeenCalledTimes(1);
        expect(RdsModule).toHaveBeenCalledTimes(1);
        expect(Ec2Module).toHaveBeenCalledTimes(1);
        expect(CloudTrailModule).toHaveBeenCalledTimes(1);
        expect(IamModule).toHaveBeenCalledTimes(1);
        expect(CloudFrontModule).toHaveBeenCalledTimes(0);
      });

      test('should pass enableCloudFront: false to S3Module when no ACM cert provided', () => {
        expect(S3Module).toHaveBeenCalledWith(
          expect.anything(),
          's3',
          expect.objectContaining({
            enableCloudFront: false,
          })
        );
      });
    });

    describe('when acmCertArn IS provided', () => {
      const mockAcmCertArn = 'arn:aws:acm:us-east-1:123456789012:certificate/fake-cert';

      beforeEach(() => {
        app = new App();
        stack = new TapStack(app, 'TestStackWithCloudFront', {
          acmCertArn: mockAcmCertArn,
        });
        Testing.fullSynth(stack);
      });

      test('should create exactly one instance of EACH module', () => {
        expect(VpcModule).toHaveBeenCalledTimes(1);
        expect(KmsModule).toHaveBeenCalledTimes(1);
        expect(S3Module).toHaveBeenCalledTimes(1);
        expect(RdsModule).toHaveBeenCalledTimes(1);
        expect(Ec2Module).toHaveBeenCalledTimes(1);
        expect(CloudTrailModule).toHaveBeenCalledTimes(1);
        expect(IamModule).toHaveBeenCalledTimes(1);
        expect(CloudFrontModule).toHaveBeenCalledTimes(1);
      });

      test('should pass enableCloudFront: true to S3Module when ACM cert is provided', () => {
        expect(S3Module).toHaveBeenCalledWith(
          expect.anything(),
          's3',
          expect.objectContaining({
            enableCloudFront: true,
          })
        );
      });

      test('should wire KMS key correctly to dependent modules', () => {
        const kms = KmsModule.mock.results[0].value;
        expect(S3Module).toHaveBeenCalledWith(expect.anything(), 's3', expect.objectContaining({ kmsKeyArn: kms.kmsKey.arn }));
        expect(RdsModule).toHaveBeenCalledWith(expect.anything(), 'rds', expect.objectContaining({ kmsKeyArn: kms.kmsKey.arn }));
        expect(Ec2Module).toHaveBeenCalledWith(expect.anything(), 'ec2', expect.objectContaining({ kmsKeyId: kms.kmsKey.id }));
        expect(CloudTrailModule).toHaveBeenCalledWith(expect.anything(), 'cloudtrail', expect.objectContaining({ kmsKeyId: kms.kmsKey.id }));
      });

      test('should wire VPC components correctly to dependent modules', () => {
        const vpc = VpcModule.mock.results[0].value;
        expect(Ec2Module).toHaveBeenCalledWith(expect.anything(), 'ec2', expect.objectContaining({ vpcId: vpc.vpc.id, subnetId: vpc.privateSubnetIds[0] }));
        expect(RdsModule).toHaveBeenCalledWith(expect.anything(), 'rds', expect.objectContaining({ subnetIds: vpc.privateSubnetIds }));
      });

      test('should wire CloudFront correctly with S3 OAI', () => {
        const s3 = S3Module.mock.results[0].value;
        expect(CloudFrontModule).toHaveBeenCalledWith(
          expect.anything(),
          'cloudfront',
          expect.objectContaining({
            acmCertArn: mockAcmCertArn,
            s3OriginDomainName: s3.bucket.bucketRegionalDomainName,
            originAccessIdentity: s3.oai.cloudfrontAccessIdentityPath,
          })
        );
      });
    });
  });

  // ------------------------
  // CloudFront Conditional Logic Tests
  // ------------------------
  describe('CloudFront Conditional Logic', () => {
    test('should NOT create CloudFront when acmCertArn is null', () => {
      app = new App();
      stack = new TapStack(app, 'TestNullCert', {
        acmCertArn: null as any,
      });
      Testing.fullSynth(stack);

      expect(CloudFrontModule).toHaveBeenCalledTimes(0);
    });

    test('should NOT create CloudFront when acmCertArn is empty string', () => {
      app = new App();
      stack = new TapStack(app, 'TestEmptyCert', {
        acmCertArn: '',
      });
      Testing.fullSynth(stack);

      expect(CloudFrontModule).toHaveBeenCalledTimes(0);
    });

    test('should create CloudFront when acmCertArn is provided and S3 has OAI', () => {
      app = new App();
      stack = new TapStack(app, 'TestValidCert', {
        acmCertArn: 'arn:aws:acm:us-east-1:123456789012:certificate/valid',
      });
      Testing.fullSynth(stack);

      expect(CloudFrontModule).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------
  // Terraform Outputs Tests
  // ------------------------
  describe('Terraform Outputs', () => {
    test('should create all required outputs with correct values and descriptions', () => {
      app = new App();
      stack = new TapStack(app, 'TestOutputs');
      synthesized = Testing.synth(stack);
      const outputs = JSON.parse(synthesized).output;

      expect(outputs.VpcId).toEqual({ value: 'mock-vpc-id', description: 'ID of the provisioned VPC' });
      expect(outputs.PrivateSubnetIds).toEqual({ value: ['mock-private-subnet-1', 'mock-private-subnet-2'], description: 'IDs of the private subnets' });
      expect(outputs.S3BucketName).toEqual({ value: 'mock-s3-bucket', description: 'Name of the secure S3 bucket' });
      expect(outputs.S3BucketArn).toEqual({ value: 'mock-s3-bucket-arn', description: 'ARN of the secure S3 bucket' });
      expect(outputs.Ec2InstanceId).toEqual({ value: 'mock-instance-id', description: 'ID of the EC2 instance' });
      expect(outputs.Ec2InstancePrivateIp).toEqual({ value: 'mock-private-ip', description: 'Private IP address of the EC2 instance' });
      expect(outputs.RdsInstanceId).toEqual({ value: 'mock-rds-id', description: 'ID of the RDS instance' });
      expect(outputs.RdsEndpoint).toEqual({ value: 'mock-rds-endpoint', description: 'RDS instance endpoint' });
      expect(outputs.RdsSecretArn).toEqual({ value: 'mock-rds-secret-arn', description: 'ARN of the RDS credentials secret' });
      expect(outputs.KmsKeyId).toEqual({ value: 'mock-kms-key-id', description: 'ID of the KMS key used for encryption' });
      expect(outputs.KmsKeyArn).toEqual({ value: 'mock-kms-arn', description: 'ARN of the KMS key used for encryption' });
    });
  });

  // ------------------------
  // Error Handling Tests
  // ------------------------
  describe('Error Handling', () => {
    test('should fail gracefully if a module instantiation throws an error', () => {
      KmsModule.mockImplementationOnce(() => {
        throw new Error('KMS module failed');
      });

      app = new App();
      expect(() => {
        new TapStack(app, 'TestError');
      }).toThrow('KMS module failed');
    });

    test('should handle missing S3 OAI gracefully when CloudFront is requested', () => {
      // Mock S3Module to not return OAI even when enableCloudFront is true
      S3Module.mockImplementationOnce(() => ({
        bucket: {
          bucket: 'mock-s3-bucket',
          arn: 'mock-s3-bucket-arn',
          bucketRegionalDomainName: 'mock-s3-domain.com',
        },
        // No OAI property
      }));

      app = new App();
      stack = new TapStack(app, 'TestMissingOAI', {
        acmCertArn: 'arn:aws:acm:us-east-1:123456789012:certificate/test',
      });
      Testing.fullSynth(stack);

      // CloudFront should not be created if OAI is missing
      expect(CloudFrontModule).toHaveBeenCalledTimes(0);
    });
  });


});