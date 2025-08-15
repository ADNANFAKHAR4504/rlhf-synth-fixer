import * as fs from 'fs';
import * as path from 'path';
const hcl = require('hcl-to-json');

describe('Terraform Infrastructure Unit Tests', () => {
  let config: any;

  // Helper function to find a resource by type and name
  const findResource = (type: string, name: string) => {
    if (
      config.resource &&
      config.resource[type] &&
      config.resource[type][name]
    ) {
      return config.resource[type][name][0]; // Parser wraps resource in an array
    }
    return null;
  };

  // Helper function to find a data source by type and name
  const findData = (type: string, name: string) => {
    if (config.data && config.data[type] && config.data[type][name]) {
      return config.data[type][name][0];
    }
    return null;
  };

  beforeAll(() => {
    // 1. Read and parse the main.tf file before running tests
    const tfPath = path.join(__dirname, '../lib/main.tf');
    const tfFile = fs.readFileSync(tfPath, 'utf8');
    config = JSON.parse(hcl(tfFile));
  });

  // ##################################################################
  // ## Test Suite 1: Global Resources & IAM                         ##
  // ##################################################################
  describe('Global Resources and IAM', () => {
    it('should define a central S3 bucket for logs', () => {
      const bucket = findResource('aws_s3_bucket', 'logs');
      expect(bucket).toBeDefined();
      // Naming convention check
      expect(bucket.bucket).toContain(
        '${local.project_name}-${local.environment}-central-logs'
      );
    });

    it('should configure a multi-region CloudTrail', () => {
      const trail = findResource('aws_cloudtrail', 'main');
      expect(trail).toBeDefined();
      expect(trail.is_multi_region_trail).toBe(true);
      expect(trail.s3_bucket_name).toBe('${aws_s3_bucket.logs.id}');
    });

    it('should define a least-privilege IAM role for EC2 instances', () => {
      const role = findResource('aws_iam_role', 'ec2_role');
      expect(role).toBeDefined();
      const assumePolicy = JSON.parse(role.assume_role_policy);
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
    });

    it('should define an IAM policy with specific, non-wildcard permissions', () => {
      const policyDoc = findData('aws_iam_policy_document', 'ec2_policy');
      expect(policyDoc).toBeDefined();

      const s3Statement = policyDoc.statement.find(
        (s: any) => s.sid === 'AllowS3ReadOnly'
      );
      expect(s3Statement).toBeDefined();

      // Validate no wildcard actions for S3
      expect(s3Statement.actions).not.toContain('s3:*');
      expect(s3Statement.actions).toEqual(
        expect.arrayContaining(['s3:GetObject', 's3:ListBucket'])
      );

      // Validate resource ARN is specific and not '*'
      expect(s3Statement.resources).toEqual(
        expect.arrayContaining([
          '${aws_s3_bucket.primary_data.arn}',
          '${aws_s3_bucket.primary_data.arn}/*',
        ])
      );

      const ssmStatement = policyDoc.statement.find(
        (s: any) => s.sid === 'AllowSSMSessionManager'
      );
      expect(ssmStatement).toBeDefined();
    });
  });

  // ##################################################################
  // ## Test Suite 2: Multi-Region Network & Peering                 ##
  // ##################################################################
  describe('Multi-Region Network & Peering', () => {
    it('should create a VPC in us-east-1', () => {
      const vpc = findResource('aws_vpc', 'useast1');
      expect(vpc).toBeDefined();
      expect(vpc.provider).toBe('aws.useast1');
      expect(vpc.cidr_block).toBe('${var.vpc_cidrs["us-east-1"]}');
    });

    it('should create a VPC in us-west-2', () => {
      const vpc = findResource('aws_vpc', 'uswest2');
      expect(vpc).toBeDefined();
      expect(vpc.provider).toBe('aws.uswest2');
      expect(vpc.cidr_block).toBe('${var.vpc_cidrs["us-west-2"]}');
    });

    it('should establish a VPC peering connection between regions', () => {
      const peering = findResource(
        'aws_vpc_peering_connection',
        'nova_peering'
      );
      expect(peering).toBeDefined();
      expect(peering.vpc_id).toBe('${aws_vpc.useast1.id}');
      expect(peering.peer_vpc_id).toBe('${aws_vpc.uswest2.id}');
      expect(peering.peer_region).toBe('us-west-2');
    });

    it('should update route tables to enable peered traffic', () => {
      const route1 = findResource('aws_route', 'useast1_to_uswest2_private');
      expect(route1).toBeDefined();
      expect(route1.destination_cidr_block).toBe(
        '${aws_vpc.uswest2.cidr_block}'
      );
      expect(route1.vpc_peering_connection_id).toBe(
        '${aws_vpc_peering_connection.nova_peering.id}'
      );

      const route2 = findResource('aws_route', 'uswest2_to_useast1_private');
      expect(route2).toBeDefined();
      expect(route2.destination_cidr_block).toBe(
        '${aws_vpc.useast1.cidr_block}'
      );
      expect(route2.vpc_peering_connection_id).toBe(
        '${aws_vpc_peering_connection.nova_peering.id}'
      );
    });
  });

  // ##################################################################
  // ## Test Suite 3: Compute, Database & Encryption (per region)    ##
  // ##################################################################
  describe.each([
    {
      region: 'us-east-1',
      alias: 'useast1',
      rdsSg: 'rds_useast1',
      ec2Sg: 'ec2_useast1',
      ec2: 'app_useast1',
      rds: 'rds_useast1',
      kms: 'useast1',
    },
    {
      region: 'us-west-2',
      alias: 'uswest2',
      rdsSg: 'rds_uswest2',
      ec2Sg: 'ec2_uswest2',
      ec2: 'app_uswest2',
      rds: 'rds_uswest2',
      kms: 'uswest2',
    },
  ])(
    'Regional Resources in $region',
    ({ alias, rdsSg, ec2Sg, ec2, rds, kms }) => {
      it('should place EC2 and RDS instances in private subnets', () => {
        const ec2Instance = findResource('aws_instance', ec2);
        expect(ec2Instance.subnet_id).toMatch(/\${aws_subnet\.private_.*\.id}/);

        const rdsInstance = findResource('aws_db_instance', rds);
        expect(rdsInstance.db_subnet_group_name).toBeDefined();
        expect(rdsInstance.publicly_accessible).toBe(false);
      });

      it('should provision correct EC2 and RDS instance types', () => {
        const ec2Instance = findResource('aws_instance', ec2);
        expect(ec2Instance.instance_type).toBe('t3.micro');

        const rdsInstance = findResource('aws_db_instance', rds);
        expect(rdsInstance.instance_class).toBe('db.t3.micro');
        expect(rdsInstance.engine).toBe('postgres');
        expect(rdsInstance.multi_az).toBe(true);
      });

      it('should encrypt all data-handling resources with a regional KMS key', () => {
        const ec2Instance = findResource('aws_instance', ec2);
        expect(ec2Instance.root_block_device[0].encrypted).toBe(true);
        expect(ec2Instance.root_block_device[0].kms_key_id).toBe(
          `\${aws_kms_key.${kms}.arn}`
        );

        const rdsInstance = findResource('aws_db_instance', rds);
        expect(rdsInstance.storage_encrypted).toBe(true);
        expect(rdsInstance.kms_key_id).toBe(`\${aws_kms_key.${kms}.arn}`);
      });

      it('should enforce strict, least-privilege security group rules for RDS', () => {
        const rdsSecurityGroup = findResource('aws_security_group', rdsSg);
        expect(rdsSecurityGroup).toBeDefined();

        const ingressRule = rdsSecurityGroup.ingress[0];
        expect(ingressRule.from_port).toBe(5432);
        expect(ingressRule.to_port).toBe(5432);
        expect(ingressRule.protocol).toBe('tcp');
        // Crucial check: ensures access is from another SG, not a wide CIDR block
        expect(ingressRule.security_groups).toEqual([
          `\${aws_security_group.${ec2Sg}.id}`,
        ]);
        expect(ingressRule.cidr_blocks).toBeUndefined();
      });

      it('should enable VPC Flow Logs directed to the central logging bucket', () => {
        const flowLog = findResource('aws_flow_log', `vpc_${alias}`);
        expect(flowLog).toBeDefined();
        expect(flowLog.log_destination_type).toBe('s3');
        expect(flowLog.log_destination).toBe('${aws_s3_bucket.logs.arn}');
      });
    }
  );

  // ##################################################################
  // ## Test Suite 4: S3 Cross-Region Replication                    ##
  // ##################################################################
  describe('S3 Data Protection and Replication', () => {
    it('should enable versioning on the primary S3 bucket', () => {
      const versioning = findResource(
        'aws_s3_bucket_versioning',
        'primary_data'
      );
      expect(versioning).toBeDefined();
      expect(versioning.versioning_configuration[0].status).toBe('Enabled');
    });

    it('should configure Cross-Region Replication from primary to backup bucket', () => {
      const replication = findResource(
        'aws_s3_bucket_replication_configuration',
        'primary_data_replication'
      );
      expect(replication).toBeDefined();
      expect(replication.role).toBe('${aws_iam_role.s3_replication.arn}');

      const dest = replication.rule[0].destination[0];
      expect(dest.bucket).toBe('${aws_s3_bucket.backup_data.arn}');
      expect(dest.encryption_configuration[0].replica_kms_key_id).toBe(
        '${aws_kms_key.uswest2.arn}'
      );
    });

    it('should enforce SSE-KMS encryption on both S3 buckets', () => {
      const primaryEncryption = findResource(
        'aws_s3_bucket_server_side_encryption_configuration',
        'primary_data'
      );
      expect(
        primaryEncryption.rule[0].apply_server_side_encryption_by_default[0]
          .sse_algorithm
      ).toBe('aws:kms');
      expect(
        primaryEncryption.rule[0].apply_server_side_encryption_by_default[0]
          .kms_master_key_id
      ).toBe('${aws_kms_key.useast1.arn}');

      const backupEncryption = findResource(
        'aws_s3_bucket_server_side_encryption_configuration',
        'backup_data'
      );
      expect(
        backupEncryption.rule[0].apply_server_side_encryption_by_default[0]
          .sse_algorithm
      ).toBe('aws:kms');
      expect(
        backupEncryption.rule[0].apply_server_side_encryption_by_default[0]
          .kms_master_key_id
      ).toBe('${aws_kms_key.uswest2.arn}');
    });

    it('should block all public access to S3 data buckets', () => {
      const primaryBlock = findResource(
        'aws_s3_bucket_public_access_block',
        'primary_data'
      );
      expect(primaryBlock.block_public_acls).toBe(true);
      expect(primaryBlock.block_public_policy).toBe(true);
      expect(primaryBlock.ignore_public_acls).toBe(true);
      expect(primaryBlock.restrict_public_buckets).toBe(true);

      const backupBlock = findResource(
        'aws_s3_bucket_public_access_block',
        'backup_data'
      );
      expect(backupBlock.block_public_acls).toBe(true);
      expect(backupBlock.block_public_policy).toBe(true);
      expect(backupBlock.ignore_public_acls).toBe(true);
      expect(backupBlock.restrict_public_buckets).toBe(true);
    });
  });

  // ##################################################################
  // ## Test Suite 5: Outputs                                        ##
  // ##################################################################
  describe('Terraform Outputs', () => {
    it('should define all required outputs', () => {
      expect(config.output['primary_region_details']).toBeDefined();
      expect(config.output['secondary_region_details']).toBeDefined();
      expect(config.output['central_logging_bucket']).toBeDefined();
      expect(config.output['vpc_peering_connection_id']).toBeDefined();
    });

    it('should not output any sensitive information', () => {
      // Check that the sensitive db_password variable is not used in any output
      const outputsString = JSON.stringify(config.output);
      expect(outputsString).not.toContain('db_password');
    });
  });
});
