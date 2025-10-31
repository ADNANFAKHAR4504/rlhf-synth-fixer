import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'primary_region',
        'secondary_region',
        'environment',
        'project_name',
        'aurora_instance_class',
        'aurora_engine_version',
        'backup_retention_period',
        'enable_backtrack',
        'backtrack_window'
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
    test('defines all expected locals', () => {
      const expectedLocals = [
        'common_tags',
        'vpc_name_primary',
        'vpc_name_secondary',
        'db_cluster_identifier',
        'db_name',
        'db_port',
        's3_bucket_primary',
        's3_bucket_secondary',
        'route53_zone_name',
        'lambda_function_name',
        'dms_replication_instance',
        'alarm_topic_name'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`local\\s+"?${l}"?\\s*=`))
      );
    });
  });

  // -------------------------
  // IAM Roles and Policies
  // -------------------------
  describe('IAM Roles and Policies', () => {
    ['lambdafailover', 'auroramonitoring', 'dms', 'auroramonitoringsecondary', 's3replication'].forEach(role => {
      test(`IAM role ${role} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_iam_role"\\s+"${role}"`));
      });

      test(`IAM role policy for ${role} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_iam_role_policy"\\s+"${role}"`));
      });
    });
  });

  // -------------------------
  // Lambda Functions
  // -------------------------
  describe('Lambda Functions', () => {
    ['failoverorchestrator', 'ingestion_primary'].forEach(lambda => {
      test(`Lambda function ${lambda} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_lambda_function"\\s+"${lambda}"`));
      });
    });
  });

  // -------------------------
  // Networking Resources
  // -------------------------
  describe('Networking Resources', () => {
    ['primary', 'secondary'].forEach(region => {
      test(`VPC ${region} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_vpc"\\s+"${region}"`));
      });

      ['public', 'private'].forEach(type => {
        test(`Subnet ${region}${type} should exist`, () => {
          expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}${type}"`));
        });

        test(`Route table ${region}${type} should exist`, () => {
          expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}${type}"`));
        });

        test(`Route table association ${region}${type} should exist`, () => {
          expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_route_table_association"\\s+"${region}${type}"`));
        });
      });

      test(`NAT Gateway for ${region} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"${region}"`));
      });

      test(`EIP for NAT Gateway for ${region} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_eip"\\s+"${region}nat"`));
      });
    });

    test('VPC Peering connections should exist', () => {
      ['primarytosecondary', 'secondary', 'primarytosecondaryaccepter'].forEach(resource => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_vpc_peering_connection.*"${resource}"`));
      });
    });
  });

  // -------------------------
  // Security Groups
  // -------------------------
  describe('Security Groups', () => {
    ['auroraprimary', 'aurorasecondary', 'dms'].forEach(sg => {
      test(`Security group ${sg} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`));
      });
    });
  });

  // -------------------------
  // RDS Clusters and Instances
  // -------------------------
  describe('RDS Resources', () => {
    ['auroraglobal', 'primary', 'secondary'].forEach(cluster => {
      test(`RDS cluster ${cluster} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_rds_(global_)?cluster"\\s+"${cluster}"`));
      });
    });

    ['primarywriter', 'primaryreader', 'secondary'].forEach(instance => {
      test(`RDS cluster instance ${instance} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_rds_cluster_instance"\\s+"${instance}"`));
      });
    });
  });

  // -------------------------
  // S3 Buckets and Replication
  // -------------------------
  describe('S3 Buckets', () => {
    ['backupprimary', 'backupsecondary'].forEach(bucket => {
      test(`S3 bucket ${bucket} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`));
      });
    });

    test('S3 replication configuration should exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_replication_configuration"/);
    });
  });

  // -------------------------
  // CloudWatch Log Groups
  // -------------------------
  describe('CloudWatch Log Groups', () => {
    ['lambdafailover', 'rdsprimary', 'rdssecondary'].forEach(logGroup => {
      test(`CloudWatch Log Group ${logGroup} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_cloudwatch_log_group"\\s+"${logGroup}"`));
      });
    });
  });

  // -------------------------
  // Route53 Health Checks
  // -------------------------
  describe('Route53 Health Checks', () => {
    ['primary', 'secondary'].forEach(healthCheck => {
      test(`Route53 health check ${healthCheck} should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_route53_health_check"\\s+"${healthCheck}"`));
      });
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs = [
      'securitygroupdmsid',
      'cloudwatchalarmprimarycpuname',
      'cloudwatchalarmreplicationlagname',
      'parameterstoredbendpointprimary',
      'parameterstoredbendpointsecondary',
      'awsprimaryregion',
      'awssecondaryregion',
      'vpcprimaryid',
      'vpcsecondaryid',
      'vpcpeeringconnectionid',
      'auroraglobalclusterid',
      'auroraprimaryclusterendpoint',
      'auroraprimaryreaderendpoint',
      'aurorasecondaryclusterendpoint',
      'aurorasecondaryreaderendpoint',
      'route53zoneid',
      'route53zonenameservers',
      'route53dbendpoint',
      's3bucketprimaryid',
      's3bucketsecondaryid',
      'dmsreplicationinstanceid',
      'lambdafunctionarn',
      'lambdafunctionname',
      'snstopicarn',
      'kmskeyprimaryid',
      'kmskeysecondaryid',
      'natgatewayprimaryid',
      'natgatewaysecondaryid',
      'primaryprivatesubnetids',
      'secondaryprivatesubnetids',
      'dbsubnetgroupprimaryname',
      'dbsubnetgroupsecondaryname',
      'securitygroupauroraprimaryid',
      'securitygroupaurorasecondaryid'
    ];

    expectedOutputs.forEach(output => {
      test(`Output "${output}" should exist`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});

