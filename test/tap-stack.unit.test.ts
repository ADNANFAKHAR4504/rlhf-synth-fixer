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

    it('should create 4 subnets (2 app, 2 db)', () => {
      const subnets = Object.values(synthesized.resource.aws_subnet || {});
      expect(subnets.length).toBe(4);
    });
  });

  describe('Compute', () => {
    it('should create a Launch Template with prevent_destroy', () => {
      const lt: any = findResource('aws_launch_template', () => true);
      expect(lt).toBeDefined();
      expect(lt.name).toBe('test-lt-app');
      expect(lt.lifecycle.prevent_destroy).toBe(true);
    });

    it('should create an Auto Scaling Group with correct naming', () => {
      const asg: any = findResource('aws_autoscaling_group', () => true);
      expect(asg).toBeDefined();
      expect(asg.name).toBe('test-asg-app');
    });
  });

  describe('Database', () => {
    it('should create an RDS instance with prevent_destroy', () => {
      const rds: any = findResource('aws_db_instance', () => true);
      expect(rds).toBeDefined();
      expect(rds.identifier).toBe('test-rds-main');
      expect(rds.lifecycle.prevent_destroy).toBe(true);
    });
  });

  describe('Remote Backend', () => {
    it('should create an S3 bucket and DynamoDB table for remote state', () => {
      const bucket: any = findResource('aws_s3_bucket', () => true);
      expect(bucket).toBeDefined();
      expect(bucket.bucket).toBe('enterprise-tfstate-bucket-test');

      const table: any = findResource('aws_dynamodb_table', () => true);
      expect(table).toBeDefined();
      expect(table.name).toBe('enterprise-terraform-locks-test');
    });
  });
});
