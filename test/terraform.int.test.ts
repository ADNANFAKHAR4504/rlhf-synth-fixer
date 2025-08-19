import { beforeAll, describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import path from 'path';

interface TerraformOutput {
  sensitive: boolean;
  type: string | string[];
  value: any;
}

interface TerraformOutputs {
  [key: string]: TerraformOutput;
}

describe('Terraform Infrastructure Integration Tests', () => {
  let tf: TerraformOutputs;

  beforeAll(() => {
    const tfOutputPath = path.resolve(
      process.cwd(),
      'tf-outputs',
      'tfplan.json'
    );
    const raw = readFileSync(tfOutputPath, 'utf8');
    tf = JSON.parse(raw).outputs;
  });

  it('should output a valid VPC ID', () => {
    expect(tf.vpc_id.value).toMatch(/^vpc-[a-z0-9]+$/);
  });

  it('should output public subnet IDs', () => {
    expect(tf.public_subnet_ids.value).toBeInstanceOf(Array);
    expect(tf.public_subnet_ids.value.length).toBeGreaterThan(0);
    tf.public_subnet_ids.value.forEach((id: string) => {
      expect(id).toMatch(/^subnet-[a-z0-9]+$/);
    });
  });

  it('should output private subnet IDs', () => {
    expect(tf.private_subnet_ids.value).toBeInstanceOf(Array);
    expect(tf.private_subnet_ids.value.length).toBeGreaterThan(0);
    tf.private_subnet_ids.value.forEach((id: string) => {
      expect(id).toMatch(/^subnet-[a-z0-9]+$/);
    });
  });

  it('should output private route table IDs', () => {
    expect(tf.private_route_table_ids.value).toBeInstanceOf(Array);
    expect(tf.private_route_table_ids.value.length).toBeGreaterThan(0);
    tf.private_route_table_ids.value.forEach((id: string) => {
      expect(id).toMatch(/^rtb-[a-z0-9]+$/);
    });
  });

  it('should output a valid EC2 Security Group ID', () => {
    expect(tf.ec2_sg_id.value).toMatch(/^sg-[a-z0-9]+$/);
  });

  it('should output a valid ALB Security Group ID', () => {
    expect(tf.alb_sg_id.value).toMatch(/^sg-[a-z0-9]+$/);
  });

  it('should output a valid RDS Security Group ID', () => {
    expect(tf.rds_sg_id.value).toMatch(/^sg-[a-z0-9]+$/);
  });

  it('should output a valid VPC Endpoint Security Group ID', () => {
    expect(tf.vpc_endpoint_sg_id.value).toMatch(/^sg-[a-z0-9]+$/);
  });

  it('should output a valid KMS key ID', () => {
    expect(tf.kms_key_id.value).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
    );
  });

  it('should output a valid KMS key ARN', () => {
    expect(tf.kms_key_arn.value).toMatch(
      /^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-z0-9-]+$/
    );
  });

  it('should output a valid S3 data bucket name', () => {
    expect(tf.s3_data_bucket_name.value).toBeDefined();
  });

  it('should output a valid S3 data bucket ARN', () => {
    expect(tf.s3_data_bucket_arn.value).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
  });

  it('should output a valid S3 VPC Endpoint ID', () => {
    expect(tf.vpc_endpoint_s3_id.value).toMatch(/^vpce-[a-z0-9]+$/);
  });

  it('should output a valid instance profile name', () => {
    expect(tf.ec2_instance_profile_name.value).toBeDefined();
  });

  it('should output a valid ALB DNS name', () => {
    expect(tf.alb_dns_name.value).toBeDefined();
  });

  it('should output a valid RDS endpoint', () => {
    expect(tf.rds_endpoint.value).toBeDefined();
  });

  it('should output a valid CloudTrail ARN', () => {
    expect(tf.cloudtrail_arn.value).toMatch(
      /^arn:aws:cloudtrail:[a-z0-9-]+:\d{12}:trail\/[a-z0-9-]+$/
    );
  });
});
