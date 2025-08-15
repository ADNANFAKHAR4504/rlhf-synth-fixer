import { Testing, App } from 'cdktf';
import { EnterpriseStack } from '../lib/tap-stack';

describe('EnterpriseStack Unit Tests', () => {
  let synthesized: any;

  beforeAll(() => {
    const app = new App();
    const stack = new EnterpriseStack(app, 'unit-test-stack', 'test');
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResource = (type: string, matchProperty: (res: any) => boolean) => {
    const resources = synthesized.resource?.[type] || {};
    return Object.values(resources).find(matchProperty);
  };

  describe('Networking', () => {
    it('should create a VPC with prevent_destroy lifecycle policy', () => {
      const vpc: any = findResource('aws_vpc', () => true);
      expect(vpc).toBeDefined();
      expect(vpc.tags.Name).toBe('test-vpc-main');
      expect(vpc.lifecycle.prevent_destroy).toBe(true);
    });

    it('should create a NAT Gateway for private subnets', () => {
      const natGateway: any = findResource('aws_nat_gateway', () => true);
      expect(natGateway).toBeDefined();
    });
  });

  describe('Compute', () => {
    it('should create a Launch Template with a dynamic name', () => {
      const lt: any = findResource('aws_launch_template', () => true);
      expect(lt).toBeDefined();
      expect(lt.name).toContain('test-lt-app-');
    });
  });

  describe('Database', () => {
    it('should create an RDS instance with a dynamic identifier', () => {
      const rds: any = findResource('aws_db_instance', () => true);
      expect(rds).toBeDefined();
      expect(rds.identifier).toContain('test-rds-main-');
    });

    it('should create a random password for the database', () => {
      const password: any = findResource('random_password', () => true);
      expect(password).toBeDefined();
    });
  });

  describe('Remote Backend S3 Bucket', () => {
    it('should have versioning enabled', () => {
      const versioning: any = findResource(
        'aws_s3_bucket_versioning', // FIX: Removed the "_a" suffix
        () => true
      );
      expect(versioning).toBeDefined();
      expect(versioning.versioning_configuration.status).toBe('Enabled');
    });

    it('should have server-side encryption enabled', () => {
      const encryption: any = findResource(
        'aws_s3_bucket_server_side_encryption_configuration', // FIX: Removed the "_a" suffix
        () => true
      );
      expect(encryption).toBeDefined();
      expect(
        encryption.rule[0].apply_server_side_encryption_by_default.sse_algorithm
      ).toBe('AES256');
    });

    it('should have public access blocked', () => {
      const publicBlock: any = findResource(
        'aws_s3_bucket_public_access_block',
        () => true
      );
      expect(publicBlock).toBeDefined();
      expect(publicBlock.block_public_acls).toBe(true);
      expect(publicBlock.block_public_policy).toBe(true);
    });
  });
});
