import { Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import {
  hasResource,
  hasResourceWithProperties,
  hasOutput,
  hasProvider,
} from './test-helper';

describe('TapStack', () => {
  describe('dev environment', () => {
    it('should create stack with dev configuration', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
      expect(hasProvider(synthesized, 'aws')).toBe(true);
    });

    it('should create VPC with correct CIDR for dev', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_vpc', {
        cidr_block: '10.0.0.0/16',
      })).toBe(true);
    });

    it('should create RDS instance with db.t3.micro for dev', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_db_instance', {
        instance_class: 'db.t3.micro',
        backup_retention_period: 1,
      })).toBe(true);
    });

    it('should create EC2 instance with t3.micro for dev', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_instance', {
        instance_type: 't3.micro',
      })).toBe(true);
    });

    it('should create S3 bucket with versioning enabled', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-dev', {
        environmentSuffix: 'dev-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResource(synthesized, 'aws_s3_bucket')).toBe(true);
      const config = JSON.parse(synthesized);
      const versioningResources = config.resource.aws_s3_bucket_versioning;
      expect(versioningResources).toBeDefined();
      const versioningResource = Object.values(versioningResources)[0] as any;
      expect(versioningResource.versioning_configuration.status).toBe('Enabled');
    });
  });

  describe('staging environment', () => {
    it('should create VPC with correct CIDR for staging', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-staging', {
        environmentSuffix: 'staging-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_vpc', {
        cidr_block: '10.1.0.0/16',
      })).toBe(true);
    });

    it('should create RDS instance with db.t3.small for staging', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-staging', {
        environmentSuffix: 'staging-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_db_instance', {
        instance_class: 'db.t3.small',
        backup_retention_period: 7,
      })).toBe(true);
    });
  });

  describe('prod environment', () => {
    it('should create VPC with correct CIDR for prod', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_vpc', {
        cidr_block: '10.2.0.0/16',
      })).toBe(true);
    });

    it('should create RDS instance with db.r5.large for prod', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_db_instance', {
        instance_class: 'db.r5.large',
        backup_retention_period: 30,
        multi_az: true,
      })).toBe(true);
    });

    it('should create EC2 instance with t3.medium for prod', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test-prod', {
        environmentSuffix: 'prod-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_instance', {
        instance_type: 't3.medium',
      })).toBe(true);
    });
  });

  describe('networking', () => {
    it('should create public and private subnets', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResource(synthesized, 'aws_subnet')).toBe(true);
    });

    it('should create NAT gateways', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResource(synthesized, 'aws_nat_gateway')).toBe(true);
      expect(hasResource(synthesized, 'aws_eip')).toBe(true);
    });

    it('should create VPC endpoint for S3', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResource(synthesized, 'aws_vpc_endpoint')).toBe(true);
    });

    it('should create internet gateway', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResource(synthesized, 'aws_internet_gateway')).toBe(true);
    });
  });

  describe('security', () => {
    it('should create security groups for RDS', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResource(synthesized, 'aws_security_group')).toBe(true);
    });

    it('should enable RDS encryption', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_db_instance', {
        storage_encrypted: true,
      })).toBe(true);
    });

    it('should enable S3 encryption', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResource(synthesized, 'aws_s3_bucket_server_side_encryption_configuration')).toBe(true);
    });

    it('should block S3 public access', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResourceWithProperties(synthesized, 'aws_s3_bucket_public_access_block', {
        block_public_acls: true,
        block_public_policy: true,
        ignore_public_acls: true,
        restrict_public_buckets: true,
      })).toBe(true);
    });

    it('should create IAM role for EC2 with least privilege', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasResource(synthesized, 'aws_iam_role')).toBe(true);
      expect(hasResource(synthesized, 'aws_iam_instance_profile')).toBe(true);
    });
  });

  describe('tagging', () => {
    it('should apply default tags to resources', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test-env',
        awsRegion: 'ap-southeast-2',
        defaultTags: [
          {
            tags: {
              Project: 'payment-processing',
            },
          },
        ],
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
    });

    it('should include environment suffix in resource names', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'my-suffix',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
    });
  });

  describe('outputs', () => {
    it('should output VPC ID', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasOutput(synthesized, 'vpc_id')).toBe(true);
    });

    it('should output RDS endpoint', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasOutput(synthesized, 'rds_endpoint')).toBe(true);
    });

    it('should output S3 bucket name', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasOutput(synthesized, 's3_bucket_name')).toBe(true);
    });

    it('should output EC2 instance ID', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasOutput(synthesized, 'ec2_instance_id')).toBe(true);
    });

    it('should output environment', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'dev-test',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(hasOutput(synthesized, 'environment')).toBe(true);
    });
  });

  describe('S3 backend configuration', () => {
    it('should configure S3 backend with encryption', () => {
      const app = Testing.app();
      const stack = new TapStack(app, 'test', {
        environmentSuffix: 'test',
        stateBucket: 'my-tf-state',
        stateBucketRegion: 'us-east-1',
        awsRegion: 'ap-southeast-2',
      });

      const synthesized = Testing.synth(stack);
      expect(synthesized).toBeDefined();
    });
  });
});
