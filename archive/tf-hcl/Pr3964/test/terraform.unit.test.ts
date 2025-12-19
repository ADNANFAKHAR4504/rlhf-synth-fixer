// test/terraform.unit.test.ts
import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'region',
        'environment',
        'project_name',
        'alert_email'
      ];
      expectedVariables.forEach(v =>
        expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`))
      );
    });
  });

  // -------------------------
  // Locals
  // -------------------------
  describe('Locals', () => {
    test('defines expected locals', () => {
      const expectedLocals = [
        'random_suffix',
        'common_tags',
        'azs',
        'vpc_cidr',
        'public_subnet_cidrs',
        'private_subnet_cidrs'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('common_tags local contains all required keys', () => {
      expect(tfContent).toMatch(/Environment\s*=\s*var.environment/);
      expect(tfContent).toMatch(/Project\s*=\s*var.project_name/);
      expect(tfContent).toMatch(/ManagedBy\s*=\s*"terraform"/);
      expect(tfContent).toMatch(/Region\s*=\s*var.region/);
    });

    test('azs local slices first 3 availability zones', () => {
      expect(tfContent).toMatch(/slice\(data\.aws_availability_zones\.available\.names,\s*0,\s*3\)/);
    });

    test('vpc_cidr and subnet CIDRs are defined correctly', () => {
      expect(tfContent).toMatch(/vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/);
      expect(tfContent).toMatch(/\["10\.0\.1\.0\/24",\s*"10\.0\.2\.0\/24",\s*"10\.0\.3\.0\/24"\]/);
      expect(tfContent).toMatch(/\["10\.0\.11\.0\/24",\s*"10\.0\.12\.0\/24",\s*"10\.0\.13\.0\/24"\]/);
    });
  });

  // -------------------------
  // Data Sources
  // -------------------------
  describe('Data Sources', () => {
    test('aws_availability_zones and aws_caller_identity are defined', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    });
  });

  // -------------------------
  // Networking
  // -------------------------
  describe('Networking Resources', () => {
    test('VPC is defined with DNS hostnames and support enabled', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(tfContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test('Internet Gateway exists and linked to VPC', () => {
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/vpc_id\s*=\s*aws_vpc.main.id/);
    });

    test('Elastic IPs and NAT Gateways are configured', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway.main\]/);
    });

    test('Route tables and associations exist for subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // S3 Buckets
  // -------------------------
  describe('S3 Buckets', () => {
    test('Main S3 bucket with public access block, versioning, encryption', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    });

    test('CloudTrail and Config buckets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket"\s+"config"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"config"/);
    });
  });


  // -------------------------
  // RDS Database
  // -------------------------
  describe('RDS Database', () => {
    test('DB subnet group and RDS instance exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["error", "general", "slowquery"\]/);
    });
  });

  // AWS Config
  // -------------------------
  describe('AWS Config Resources', () => {
    test('Config recorder, delivery channel, and status exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel.main\]/);
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs: string[] = [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'nat_gateway_ids',
      'internet_gateway_id',
      'rds_instance_id',
      'rds_instance_endpoint',
      'rds_instance_port',
      'rds_subnet_group_name',
      'cloudtrail_name',
      'cloudtrail_arn',
      'config_recorder_name',
      'config_delivery_channel_name'
    ];
    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
