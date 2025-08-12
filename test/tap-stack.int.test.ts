import fs from 'fs';
import path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    // Path to the flat outputs file generated after deploy
    const outputsFile = path.resolve(
      __dirname,
      '../cfn-output/flat-outputs.json'
    );

    if (!fs.existsSync(outputsFile)) {
      throw new Error(
        `Outputs file not found at ${outputsFile}. Did you run 'terraform apply'?`
      );
    }

    const fileContent = fs.readFileSync(outputsFile, 'utf-8');
    outputs = JSON.parse(fileContent);
  });

  test('Networking outputs are present', () => {
    expect(outputs['vpc-id']).toMatch(/^vpc-/);
    expect(Array.isArray(outputs['public-subnet-ids'])).toBe(true);
    expect(outputs['public-subnet-ids'].length).toBeGreaterThan(0);
    expect(Array.isArray(outputs['private-subnet-ids'])).toBe(true);
    expect(outputs['private-subnet-ids'].length).toBeGreaterThan(0);
    expect(Array.isArray(outputs['availability-zones'])).toBe(true);
    expect(outputs['availability-zones'].length).toBeGreaterThanOrEqual(3);
  });

  test('S3 outputs are valid', () => {
    expect(outputs['s3-bucket-name']).toMatch(/^[a-z0-9.-]+$/);
    expect(outputs['s3-bucket-arn']).toMatch(/^arn:aws:s3:::.*$/);
    expect(outputs['s3-bucket-domain-name']).toContain('amazonaws.com');
  });

  test('IAM outputs are valid', () => {
    expect(outputs['ec2-role-arn']).toMatch(/^arn:aws:iam::\d+:role\/.+$/);
    expect(outputs['ec2-instance-profile-name']).toBeTruthy();
  });

  test('Security Group outputs are valid', () => {
    expect(outputs['web-security-group-id']).toMatch(/^sg-/);
    expect(outputs['app-security-group-id']).toMatch(/^sg-/);
  });

  test('RDS outputs are valid', () => {
    expect(outputs['rds-endpoint']).toContain('.');
    expect(Number(outputs['rds-port'])).toBeGreaterThan(0);
    expect(outputs['rds-db-name']).toBeTruthy();
    expect(outputs['rds-security-group-id']).toMatch(/^sg-/);
  });

  test('Environment and region outputs are set', () => {
    expect(outputs['region']).toMatch(/^[a-z]{2}-[a-z]+-\d$/);
    expect(outputs['environment']).toMatch(/^[a-z]+$/);
  });
});
