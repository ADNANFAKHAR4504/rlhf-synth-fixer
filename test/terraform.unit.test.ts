import fs from 'fs';
import path from 'path';

describe('TapStack Terraform Unit Tests (Full Coverage)', () => {
  let tfContent: string;

  beforeAll(() => {
    const tfPath = path.join(__dirname, '../lib/tap_stack.tf');
    tfContent = fs.readFileSync(tfPath, 'utf8');
  });

  // Helper
  const countMatches = (regex: RegExp): number => (tfContent.match(regex) || []).length;

  // -------------------------
  // Variables
  // -------------------------
  describe('Variables', () => {
    test('defines all expected variables', () => {
      const expectedVariables = [
        'region',
        'projectname',
        'environment',
        'vpccidr',
        'dbinstanceclass',
        'ec2instancetype',
        'minsize',
        'maxsize',
        'desiredcapacity'
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
    test('defines common_tags, resourceprefix, and other key locals', () => {
      const expectedLocals = [
        'commontags',
        'resourceprefix',
        'uniquesuffix',
        'vpcname',
        'rdsname',
        's3bucketname',
        'cloudtrailname',
        'configname',
        'kmsalias',
        'snstopicname',
        'launchtemplatename'
      ];
      expectedLocals.forEach(l =>
        expect(tfContent).toMatch(new RegExp(`${l}\\s*=`))
      );
    });

    test('commontags contains all standard tag keys', () => {
      ['Project', 'Environment', 'ManagedBy'].forEach(t =>
        expect(tfContent).toMatch(new RegExp(`${t}\\s*=\\s*`))
      );
    });

    test('resource suffixing logic exists', () => {
      expect(tfContent).toMatch(/randomstring\.suffix\.result/);
      expect(tfContent).toMatch(/local\.resourceprefix/);
    });
  });

  // -------------------------
  // Data Sources
  // -------------------------
  describe('Data Sources', () => {
    test('references availability zones and AMI', () => {
      expect(tfContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(tfContent).toMatch(/data\s+"aws_ami"\s+"amazonlinux2"/);
    });
  });

  // -------------------------
  // KMS Resources
  // -------------------------
  describe('KMS Resources', () => {
    test('KMS key and alias are present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_kms_key"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_kms_alias"\s+"main"/);
    });

    test('KMS key has rotation enabled', () => {
      expect(tfContent).toMatch(/enable_key_rotation\s*=\s*true/);
    });
  });

  // -------------------------
  // Networking Resources
  // -------------------------
  describe('Networking Resources', () => {
    test('VPC, Internet Gateway, subnets exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test('NAT Gateway(s), EIP(s) configured and depend on IGW', () => {
      expect(tfContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(tfContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });

    test('Route tables and associations exist for subnets', () => {
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(tfContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  // -------------------------
  // Security Groups
  // -------------------------
  describe('Security Groups', () => {
    ['rds', 'ec2', 'alb', 'lambda'].forEach(sg =>
      test(`${sg} security group defined`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`));
      })
    );
    test('RDS security group allows MySQL/Aurora inbound from EC2/Lambda', () => {
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/security_groups\s*=.*(aws_security_group\.ec2\.id|aws_security_group\.lambda\.id)/);
    });
  });

  // -------------------------
  // RDS Database
  // -------------------------
  describe('RDS Database', () => {
    test('DB subnet group and RDS instance(s) defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test('RDS is MySQL, multi-AZ, with backup and encryption', () => {
      expect(tfContent).toMatch(/engine\s*=\s*"mysql"/);
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
      expect(tfContent).toMatch(/backup_retention_period\s*=\s*7/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test('RDS read replica exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_db_instance"\s+"readreplica"/);
    });
  });

  // -------------------------
  // Secrets and Parameter Store
  // -------------------------
  describe('Secrets and SSM Parameters', () => {
    test('Secrets Manager secret for DB credentials exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret"\s+"dbcredentials"/);
      expect(tfContent).toMatch(/resource\s+"aws_secretsmanager_secret_version"\s+"dbcredentials"/);
    });

    test('SSM Parameter Store for username and password exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"dbusername"/);
      expect(tfContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"dbpassword"/);
    });
  });

  // -------------------------
  // S3 Buckets
  // -------------------------
  describe('S3 Buckets', () => {
    [
      'main',
      'logs',
      'cloudtrail',
      'config'
    ].forEach(bucket =>
      test(`S3 bucket "${bucket}" exists`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${bucket}"`));
      })
    );
    [
      'main',
      'logs',
      'cloudtrail',
      'config'
    ].forEach(bucket =>
      test(`S3 public access block for "${bucket}"`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_public_access_block"\\s+"${bucket}"`));
      })
    );
    [
      'main',
      'logs',
      'cloudtrail',
      'config'
    ].forEach(bucket =>
      test(`S3 bucket encryption for "${bucket}"`, () => {
        expect(tfContent).toMatch(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${bucket}"`));
      })
    );
    test('S3 bucket versioning for main bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"main"/);
    });
  });

  // -------------------------
  // Lambda and IAM
  // -------------------------
  describe('Lambda and IAM', () => {
    test('IAM role/policy for Lambda function', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"lambdarole"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"lambdapolicy"/);
    });

    test('Lambda function processor exists and receives events from S3', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lambda_function"\s+"processor"/);
      expect(tfContent).toMatch(/resource\s+"aws_lambda_permission"\s+"allows3"/);
      expect(tfContent).toMatch(/principal\s*=\s*"s3\.amazonaws\.com"/);
    });

    test('References inline Lambda code zip and event handler', () => {
      expect(tfContent).toMatch(/data\s+"archive_file"\s+"lambdacode"/);
      expect(tfContent).toMatch(/filename\s*=.*\.zip/);
      expect(tfContent).toMatch(/handler\s*=\s*"index\.lambdahandler"/);
    });
  });

  // -------------------------
  // CloudFront, WAF, and ALB
  // -------------------------
  describe('CloudFront, WAF, and ALB', () => {
    test('CloudFront distribution references OAI and S3 bucket', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudfront_origin_access_identity"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudfront_distribution"/);
      expect(tfContent).toMatch(/origin_access_identity/);
    });

    test('WAF web ACL is created and attached', () => {
      expect(tfContent).toMatch(/resource\s+"aws_wafv2_web_acl"\s+"main"/);
      expect(tfContent).toMatch(/web_acl_id\s*=\s*aws_wafv2_web_acl\.main\.arn/);
    });

    test('Application Load Balancer and listener exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    });
    test('ALB Target Group exists', () => {
      expect(tfContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    });
  });

  // -------------------------
  // Auto Scaling
  // -------------------------
  describe('Auto Scaling Group and Policies', () => {
    test('Auto Scaling group and launch template exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    });

    test('Scale up/down policies exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scaleup"/);
      expect(tfContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scaledown"/);
    });
  });

  // -------------------------
  // AWS Config
  // -------------------------
  describe('AWS Config Resources', () => {
    test('Config delivery channel, recorder, recorder status present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_config_delivery_channel"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_config_configuration_recorder_status"\s+"main"/);
    });

    test('Recorder depends on delivery channel', () => {
      expect(tfContent).toMatch(/depends_on\s*=\s*\[aws_config_delivery_channel\.main\]/);
    });
  });

  // -------------------------
  // CloudTrail
  // -------------------------
  describe('CloudTrail Resources', () => {
    test('CloudTrail main resource and bucket policy exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudtrail"\s+"main"/);
      expect(tfContent).toMatch(/resource\s+"aws_s3_bucket_policy"\s+"cloudtrail"/);
    });
    test('CloudTrail references S3 bucket and KMS key', () => {
      expect(tfContent).toMatch(/s3_bucket_name\s*=\s*aws_s3_bucket\.cloudtrail\.id/);
      expect(tfContent).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });
  });

  // -------------------------
  // IAM for EC2
  // -------------------------
  describe('IAM for EC2', () => {
    test('IAM role and instance profile exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2role"/);
      expect(tfContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2profile"/);
    });

    test('IAM policy attachment for SSM is present', () => {
      expect(tfContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ec2ssm"/);
      expect(tfContent).toMatch(/policy_arn\s*=.*AmazonSSMManagedInstanceCore/);
    });
  });

  // -------------------------
  // SNS Topics
  // -------------------------
  describe('SNS Topics', () => {
    test('SNS Topic for alerts and subscription defined', () => {
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic"\s+"alerts"/);
      expect(tfContent).toMatch(/resource\s+"aws_sns_topic_subscription"\s+"email"/);
    });
  });

  // -------------------------
  // CloudWatch
  // -------------------------
  describe('CloudWatch Alarms', () => {
    test('High/Low CPU and instance health alarms exist', () => {
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"highcpu"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"lowcpu"/);
      expect(tfContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"instancehealth"/);
    });
  });

  // -------------------------
  // Outputs
  // -------------------------
  describe('Outputs', () => {
    const expectedOutputs: string[] = [
      'vpcid', 'vpccidr', 'publicsubnetids', 'privatesubnetids',
      'natgatewayids', 'internetgatewayid', 'rdsendpoint',
      'rdsreadreplicaendpoint', 'rdsinstanceid', 's3bucketname',
      's3bucketarn', 'lambdafunctionname', 'lambdafunctionarn',
      'cloudfrontdistributionid', 'cloudfrontdomainname', 'albdnsname',
      'albarn', 'autoscalinggroupname', 'autoscalinggrouparn', 'snstopicarn',
      'kmskeyid', 'kmskeyarn', 'cloudtrailname', 'cloudtrailarn',
      'configrecordername', 'wafwebaclid', 'wafwebaclarn', 'ec2iamrolearn',
      'lambdaiamrolearn', 'amiid', 'launchtemplateid', 'secretsmanagersecretarn',
      'parameterstoredbusername', 'parameterstoredbpassword',
      'securitygrouprdsid', 'securitygroupec2id', 'securitygroupalbid', 'securitygrouplambdaid'
    ];
    expectedOutputs.forEach(output => {
      test(`output ${output} exists`, () => {
        expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
      });
    });
  });
});
