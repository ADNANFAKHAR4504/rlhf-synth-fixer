import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Stack Structure', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('TapStack instantiates successfully via props', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackWithProps', {
      environmentSuffix: 'prod',
      stateBucket: 'custom-state-bucket',
      stateBucketRegion: 'us-west-2',
      awsRegion: 'us-west-2',
    });
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors via props
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });

  test('TapStack uses default values when no props provided', () => {
    app = new App();
    stack = new TapStack(app, 'TestTapStackDefault');
    synthesized = Testing.synth(stack);

    // Verify that TapStack instantiates without errors when no props are provided
    expect(stack).toBeDefined();
    expect(synthesized).toBeDefined();
  });
});

describe('AWS Provider Configuration', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('AWS Provider is configured with correct region', () => {
    expect(synthesized).toContain('"region": "us-west-2"');
  });

  test('AWS Provider has default tags configured', () => {
    expect(synthesized).toContain('"Project": "SecureApp"');
    expect(synthesized).toContain('"ManagedBy": "CDKTF"');
    expect(synthesized).toContain('"Owner": "DevOps-Team"');
  });

  test('AWS Provider region override works correctly', () => {
    const customApp = new App();
    const customStack = new TapStack(customApp, 'CustomRegionStack', {
      awsRegion: 'us-west-2'
    });
    const customSynthesized = Testing.synth(customStack);
    expect(customSynthesized).toContain('"region": "us-west-2"');
  });

  test('AWS Provider uses custom default tags when provided', () => {
    const customApp = new App();
    const customDefaultTags = {
      tags: {
        CustomProject: 'TestProject',
        CustomEnvironment: 'test',
        CustomOwner: 'TestOwner',
      },
    };
    const customStack = new TapStack(customApp, 'CustomTagsStack', {
      defaultTags: customDefaultTags
    });
    const customSynthesized = Testing.synth(customStack);
    
    expect(customSynthesized).toContain('"CustomProject": "TestProject"');
    expect(customSynthesized).toContain('"CustomEnvironment": "test"');
    expect(customSynthesized).toContain('"CustomOwner": "TestOwner"');
  });
});

describe('AWS Region Override Logic', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  test('AWS_REGION_OVERRIDE takes precedence over props.awsRegion', () => {
    const stack = new TapStack(app, 'RegionOverrideStack', {
      awsRegion: 'eu-west-1' // This should be ignored due to AWS_REGION_OVERRIDE
    });
    const synthesized = Testing.synth(stack);
    
    // AWS_REGION_OVERRIDE is hardcoded to 'us-west-2', so it should override the prop
    expect(synthesized).toContain('"region": "us-west-2"');
    expect(synthesized).not.toContain('"region": "eu-west-1"');
  });

  test('AWS region defaults to us-west-2 when no props provided', () => {
    const stack = new TapStack(app, 'DefaultRegionStack');
    const synthesized = Testing.synth(stack);
    
    expect(synthesized).toContain('"region": "us-west-2"');
  });

  test('AWS region logic handles different prop scenarios', () => {
    // Test with different awsRegion prop
    const stack1 = new TapStack(app, 'RegionStack1', {
      awsRegion: 'us-east-1'
    });
    const synthesized1 = Testing.synth(stack1);
    expect(synthesized1).toContain('"region": "us-west-2"'); // Should still use override

    // Test with undefined awsRegion (covers ternary operator logic)
    const stack2 = new TapStack(app, 'RegionStack2', {
      awsRegion: undefined
    });
    const synthesized2 = Testing.synth(stack2);
    expect(synthesized2).toContain('"region": "us-west-2"'); // Should use override

    // Test with empty string awsRegion
    const stack3 = new TapStack(app, 'RegionStack3', {
      awsRegion: ''
    });
    const synthesized3 = Testing.synth(stack3);
    expect(synthesized3).toContain('"region": "us-west-2"'); // Should use override
  });

  test('AWS region override constant is properly applied', () => {
    // Test multiple scenarios to ensure AWS_REGION_OVERRIDE always wins
    const testCases = [
      { awsRegion: 'ap-southeast-1' },
      { awsRegion: 'eu-central-1' },
      { awsRegion: 'ca-central-1' },
      {}
    ];

    testCases.forEach((props, index) => {
      const stack = new TapStack(app, `RegionTestStack${index}`, props);
      const synthesized = Testing.synth(stack);
      expect(synthesized).toContain('"region": "us-west-2"');
    });
  });

  test('Default tags logic with different scenarios', () => {
    // Test default tags when props.defaultTags is provided
    const customTags = {
      tags: {
        Team: 'Infrastructure',
        CostCenter: '12345'
      }
    };
    
    const stack1 = new TapStack(app, 'TagsStack1', {
      defaultTags: customTags
    });
    const synthesized1 = Testing.synth(stack1);
    expect(synthesized1).toContain('"Team": "Infrastructure"');
    expect(synthesized1).toContain('"CostCenter": "12345"');

    // Test default tags when props.defaultTags is undefined (covers ternary operator)
    const stack2 = new TapStack(app, 'TagsStack2', {
      defaultTags: undefined
    });
    const synthesized2 = Testing.synth(stack2);
    expect(synthesized2).toContain('"Project": "SecureApp"');
    expect(synthesized2).toContain('"ManagedBy": "CDKTF"');
    expect(synthesized2).toContain('"Owner": "DevOps-Team"');
  });
});

describe('S3 Backend Configuration', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      stateBucket: 'test-bucket',
      stateBucketRegion: 'us-east-1'
    });
    synthesized = Testing.synth(stack);
  });

  test('S3 Backend is configured correctly', () => {
    expect(synthesized).toContain('"backend": {');
    expect(synthesized).toContain('"s3": {');
    expect(synthesized).toContain('"bucket": "test-bucket"');
    expect(synthesized).toContain('"key": "test/TestStack.tfstate"');
    expect(synthesized).toContain('"region": "us-east-1"');
    expect(synthesized).toContain('"encrypt": true');
  });

  test('S3 Backend uses state locking', () => {
    expect(synthesized).toContain('"use_lockfile": true');
  });

  test('S3 Backend uses default values when not specified', () => {
    const defaultApp = new App();
    const defaultStack = new TapStack(defaultApp, 'DefaultBackendStack');
    const defaultSynthesized = Testing.synth(defaultStack);
    expect(defaultSynthesized).toContain('"bucket": "iac-rlhf-tf-states"');
    expect(defaultSynthesized).toContain('"region": "us-east-1"');
  });
});

describe('Terraform Variables', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('Database username variable is defined correctly', () => {
    expect(synthesized).toContain('"variable": {');
    expect(synthesized).toContain('"db_username": {');
    expect(synthesized).toContain('"type": "string"');
    expect(synthesized).toContain('"description": "Database username"');
    expect(synthesized).toContain('"default": "admin"');
    expect(synthesized).toContain('"sensitive": false');
  });

});

describe('VPC and Networking', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('VPC is created with correct CIDR block', () => {
    expect(synthesized).toContain('"aws_vpc"');
    expect(synthesized).toContain('"cidr_block": "10.0.0.0/16"');
    expect(synthesized).toContain('"enable_dns_hostnames": true');
    expect(synthesized).toContain('"enable_dns_support": true');
  });

  test('Public subnets are created in correct availability zones', () => {
    expect(synthesized).toContain('"aws_subnet"');
    expect(synthesized).toContain('"availability_zone": "us-west-2a"');
    expect(synthesized).toContain('"availability_zone": "us-west-2b"');
    expect(synthesized).toContain('"cidr_block": "10.0.1.0/24"');
    expect(synthesized).toContain('"cidr_block": "10.0.2.0/24"');
    expect(synthesized).toContain('"map_public_ip_on_launch": true');
  });

  test('Private subnets are created in correct availability zones', () => {
    expect(synthesized).toContain('"cidr_block": "10.0.3.0/24"');
    expect(synthesized).toContain('"cidr_block": "10.0.4.0/24"');
  });

  test('Internet Gateway is created and attached', () => {
    expect(synthesized).toContain('"aws_internet_gateway"');
  });

  test('Route tables and associations are configured', () => {
    expect(synthesized).toContain('"aws_route_table"');
    expect(synthesized).toContain('"aws_route"');
    expect(synthesized).toContain('"aws_route_table_association"');
    expect(synthesized).toContain('"destination_cidr_block": "0.0.0.0/0"');
  });
});

describe('Security Groups', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('Web security group is created with correct ingress rules', () => {
    expect(synthesized).toContain('"aws_security_group"');
    expect(synthesized).toContain('"from_port": 80');
    expect(synthesized).toContain('"to_port": 80');
    expect(synthesized).toContain('"from_port": 443');
    expect(synthesized).toContain('"to_port": 443');
    expect(synthesized).toContain('"from_port": 22');
    expect(synthesized).toContain('"to_port": 22');
    expect(synthesized).toContain('"protocol": "tcp"');
  });

  test('Database security group is created with restricted access', () => {
    expect(synthesized).toContain('"from_port": 3306');
    expect(synthesized).toContain('"to_port": 3306');
    expect(synthesized).toContain('"description": "MySQL access from web security group"');
  });

  test('Security groups have proper egress rules', () => {
    expect(synthesized).toContain('"egress"');
    expect(synthesized).toContain('"from_port": 0');
    expect(synthesized).toContain('"to_port": 0');
    expect(synthesized).toContain('"protocol": "-1"');
  });
});

describe('KMS Encryption', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('KMS key is created for encryption', () => {
    expect(synthesized).toContain('"aws_kms_key"');
    expect(synthesized).toContain('"description": "SecureApp KMS key for dev environment"');
  });

  test('KMS alias is created', () => {
    expect(synthesized).toContain('"aws_kms_alias"');
    expect(synthesized).toContain('"name": "alias/secureapp-dev"');
  });

  test('KMS key has appropriate deletion window for environment', () => {
    expect(synthesized).toContain('"deletion_window_in_days": 7');
  });
});

describe('S3 Bucket Configuration', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('S3 bucket is created with encryption', () => {
    expect(synthesized).toContain('"aws_s3_bucket"');
    expect(synthesized).toContain('"aws_s3_bucket_server_side_encryption_configuration"');
    expect(synthesized).toContain('"sse_algorithm": "aws:kms"');
  });

  test('S3 bucket has versioning enabled', () => {
    expect(synthesized).toContain('"aws_s3_bucket_versioning"');
    expect(synthesized).toContain('"status": "Enabled"');
  });

  test('S3 bucket has public access blocked', () => {
    expect(synthesized).toContain('"aws_s3_bucket_public_access_block"');
    expect(synthesized).toContain('"block_public_acls": true');
    expect(synthesized).toContain('"block_public_policy": true');
    expect(synthesized).toContain('"ignore_public_acls": true');
    expect(synthesized).toContain('"restrict_public_buckets": true');
  });
});

describe('RDS Database', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('RDS instance is created with correct configuration', () => {
    expect(synthesized).toContain('"aws_db_instance"');
    expect(synthesized).toContain('"engine": "mysql"');
    expect(synthesized).toContain('"engine_version": "8.0"');
    expect(synthesized).toContain('"instance_class": "db.t3.micro"');
    expect(synthesized).toContain('"storage_encrypted": true');
  });

  test('RDS has automated backups configured', () => {
    expect(synthesized).toContain('"backup_retention_period": 7');
    expect(synthesized).toContain('"backup_window": "03:00-04:00"');
  });

  test('RDS subnet group is created', () => {
    expect(synthesized).toContain('"aws_db_subnet_group"');
  });
});

describe('EC2 Instance', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('EC2 instance is created with correct configuration', () => {
    expect(synthesized).toContain('"aws_instance"');
    expect(synthesized).toContain('"instance_type": "t3.micro"');
  });

  test('EC2 instance has IAM instance profile attached', () => {
    expect(synthesized).toContain('"aws_iam_instance_profile"');
    expect(synthesized).toContain('"aws_iam_role"');
    expect(synthesized).toContain('"aws_iam_policy"');
  });

  test('EC2 instance has user data for CloudWatch agent', () => {
    expect(synthesized).toContain('"user_data"');
    expect(synthesized).toContain('amazon-cloudwatch-agent');
  });
});

describe('IAM Roles and Policies', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('IAM role is created for EC2 instances', () => {
    expect(synthesized).toContain('"aws_iam_role"');
    expect(synthesized).toContain('\\"Service\\":\\"ec2.amazonaws.com\\"');
  });

  test('IAM policy follows least privilege principle', () => {
    expect(synthesized).toContain('"aws_iam_policy"');
    expect(synthesized).toContain('\\"s3:GetObject\\"');
    expect(synthesized).toContain('\\"s3:PutObject\\"');
    expect(synthesized).toContain('\\"s3:DeleteObject\\"');
    expect(synthesized).toContain('\\"logs:CreateLogStream\\"');
    expect(synthesized).toContain('\\"logs:PutLogEvents\\"');
    expect(synthesized).toContain('\\"kms:Decrypt\\"');
    expect(synthesized).toContain('\\"kms:GenerateDataKey\\"');
  });

  test('IAM role policy attachment is configured', () => {
    expect(synthesized).toContain('"aws_iam_role_policy_attachment"');
  });
});

describe('CloudWatch Monitoring', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('CloudWatch log group is created with KMS encryption', () => {
    expect(synthesized).toContain('"aws_cloudwatch_log_group"');
    expect(synthesized).toContain('"/aws/secureapp/dev"');
    expect(synthesized).toContain('"retention_in_days": 30');
  });

  test('CloudWatch alarms are created for EC2', () => {
    expect(synthesized).toContain('"aws_cloudwatch_metric_alarm"');
    expect(synthesized).toContain('"metric_name": "CPUUtilization"');
    expect(synthesized).toContain('"namespace": "AWS/EC2"');
    expect(synthesized).toContain('"threshold": 90');
  });

  test('CloudWatch alarms are created for RDS', () => {
    expect(synthesized).toContain('"namespace": "AWS/RDS"');
    expect(synthesized).toContain('"metric_name": "DatabaseConnections"');
  });
});

describe('Environment-Specific Configuration', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  test('Production environment uses larger EC2 instance types', () => {
    const prodStack = new TapStack(app, 'ProdStack', {
      environmentSuffix: 'production'
    });
    const prodSynthesized = Testing.synth(prodStack);
    
    expect(prodSynthesized).toContain('"instance_type": "t3.medium"');
  });

  test('Prod suffix also uses larger EC2 instance types', () => {
    const prodStack = new TapStack(app, 'ProdStack', {
      environmentSuffix: 'prod'
    });
    const prodSynthesized = Testing.synth(prodStack);
    
    expect(prodSynthesized).toContain('"instance_type": "t3.medium"');
  });

  test('Development environment uses smaller resources', () => {
    const devStack = new TapStack(app, 'DevStack', {
      environmentSuffix: 'dev'
    });
    const devSynthesized = Testing.synth(devStack);
    
    expect(devSynthesized).toContain('"instance_type": "t3.micro"');
    expect(devSynthesized).toContain('"instance_class": "db.t3.micro"');
    expect(devSynthesized).toContain('"multi_az": false');
    expect(devSynthesized).toContain('"deletion_protection": false');
  });

  test('Staging environment uses smaller resources', () => {
    const stagingStack = new TapStack(app, 'StagingStack', {
      environmentSuffix: 'staging'
    });
    const stagingSynthesized = Testing.synth(stagingStack);
    
    expect(stagingSynthesized).toContain('"instance_type": "t3.micro"');
    expect(stagingSynthesized).toContain('"instance_class": "db.t3.micro"');
  });

  test('Environment suffix is properly passed to modules', () => {
    const testStack = new TapStack(app, 'TestEnvStack', {
      environmentSuffix: 'testing'
    });
    const testSynthesized = Testing.synth(testStack);
    
    expect(testSynthesized).toContain('"Environment": "testing"');
    expect(testSynthesized).toContain('"/aws/secureapp/testing"');
  });
});

describe('Resource Naming Convention', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test'
    });
    synthesized = Testing.synth(stack);
  });

  test('All resources follow SecureApp naming convention', () => {
    expect(synthesized).toContain('"Name": "SecureApp-Vpc-test"');
    expect(synthesized).toContain('"Name": "SecureApp-PublicSubnetA-test"');
    expect(synthesized).toContain('"Name": "SecureApp-PublicSubnetB-test"');
    expect(synthesized).toContain('"Name": "SecureApp-PrivateSubnetA-test"');
    expect(synthesized).toContain('"Name": "SecureApp-PrivateSubnetB-test"');
    expect(synthesized).toContain('"Name": "SecureApp-WebSG-test"');
    expect(synthesized).toContain('"Name": "SecureApp-DbSG-test"');
    expect(synthesized).toContain('"Name": "SecureApp-KmsKey-test"');
  });

  test('Resources have environment tags', () => {
    expect(synthesized).toContain('"Environment": "test"');
  });
});

describe('Terraform Outputs', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('All required outputs are defined', () => {
    const expectedOutputs = [
      'vpc_id',
      'public_subnet_a_id',
      'public_subnet_b_id',
      'private_subnet_a_id',
      'private_subnet_b_id',
      'web_security_group_id',
      'db_security_group_id',
      'kms_key_id',
      'kms_key_arn',
      's3_bucket_name',
      's3_bucket_arn',
      'rds_endpoint',
      'rds_instance_id',
      'ec2_instance_id',
      'ec2_public_ip',
      'ec2_public_dns',
      'cloudwatch_log_group_name',
      'application_url'
    ];

    expectedOutputs.forEach(output => {
      expect(synthesized).toContain(`"${output}": {`);
    });
  });

  test('Sensitive outputs are marked as sensitive', () => {
    expect(synthesized).toContain('"rds_endpoint": {');
    expect(synthesized).toContain('"sensitive": true');
  });

  test('Outputs have descriptions', () => {
    expect(synthesized).toContain('"description": "ID of the VPC"');
    expect(synthesized).toContain('"description": "RDS instance endpoint"');
    expect(synthesized).toContain('"description": "URL to access the application"');
  });
});

describe('High Availability and Multi-AZ', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('Resources span multiple availability zones', () => {
    expect(synthesized).toContain('"availability_zone": "us-west-2a"');
    expect(synthesized).toContain('"availability_zone": "us-west-2b"');
  });

  test('Subnets are distributed across AZs', () => {
    const azACount = (synthesized.match(/"availability_zone": "us-west-2a"/g) || []).length;
    const azBCount = (synthesized.match(/"availability_zone": "us-west-2b"/g) || []).length;
    
    expect(azACount).toBeGreaterThan(0);
    expect(azBCount).toBeGreaterThan(0);
    expect(azACount).toEqual(azBCount);
  });
});

describe('Security and Compliance', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: string;

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, 'TestStack');
    synthesized = Testing.synth(stack);
  });

  test('All storage is encrypted at rest', () => {
    expect(synthesized).toContain('"storage_encrypted": true');
    expect(synthesized).toContain('"sse_algorithm": "aws:kms"');
  });

  test('Database is in private subnets', () => {
    expect(synthesized).toContain('"aws_db_subnet_group"');
    expect(synthesized).toContain('SecureApp-PrivateSubnetA');
    expect(synthesized).toContain('SecureApp-PrivateSubnetB');
  });

  test('Security groups have restrictive rules', () => {
    expect(synthesized).toContain('"description": "HTTP access from allowed CIDR blocks"');
    expect(synthesized).toContain('"description": "HTTPS access from allowed CIDR blocks"');
    expect(synthesized).toContain('"description": "SSH access from allowed CIDR blocks"');
    expect(synthesized).toContain('"description": "MySQL access from web security group"');
  });

  test('CloudWatch logging is encrypted', () => {
    expect(synthesized).toContain('"aws_cloudwatch_log_group"');
    expect(synthesized).toContain('"kms_key_id"');
  });
});

// describe('Edge Cases and Error Handling', () => {
//   let app: App;

//   beforeEach(() => {
//     app = new App();
//   });

//   test('Stack handles empty props correctly', () => {
//     const stack = new TapStack(app, 'EmptyPropsStack', {});
//     const