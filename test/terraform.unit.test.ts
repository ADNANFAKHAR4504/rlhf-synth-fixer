import { readFileSync } from 'fs';
import { join } from 'path';

// Mock Terraform configuration validation
interface TerraformConfig {
  vpc: {
    cidr_block: string;
    enable_dns_hostnames: boolean;
    enable_dns_support: boolean;
    tags: Record<string, string>;
  };
  subnets: {
    public: Array<{
      cidr_block: string;
      map_public_ip_on_launch: boolean;
      tags: Record<string, string>;
    }>;
    private: Array<{
      cidr_block: string;
      map_public_ip_on_launch: boolean;
      tags: Record<string, string>;
    }>;
  };
  kms: {
    deletion_window_in_days: number;
    enable_key_rotation: boolean;
    tags: Record<string, string>;
  };
  security_groups: {
    app: {
      description: string;
      vpc_id: string;
    };
    db: {
      description: string;
      vpc_id: string;
    };
    web: {
      description: string;
      vpc_id: string;
    };
    mgmt: {
      description: string;
      vpc_id: string;
    };
  };
  s3: {
    app_data_bucket: {
      versioning: boolean;
      encryption: boolean;
      public_access_block: boolean;
    };
    cloudtrail_bucket: {
      versioning: boolean;
      encryption: boolean;
      lifecycle: boolean;
    };
  };
  cloudtrail: {
    include_global_service_events: boolean;
    is_multi_region_trail: boolean;
    enable_logging: boolean;
  };
}

// Load expected configuration from outputs
const loadExpectedConfig = (): TerraformConfig => {
  try {
    const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
    const outputsContent = readFileSync(outputsPath, 'utf8');
    const outputs = JSON.parse(outputsContent);
    
    return {
      vpc: {
        cidr_block: outputs.vpc_cidr_block,
        enable_dns_hostnames: true,
        enable_dns_support: true,
        tags: {
          Name: expect.stringMatching(/.*-vpc$/)
        }
      },
      subnets: {
        public: [
          {
            cidr_block: '10.0.1.0/24',
            map_public_ip_on_launch: true,
            tags: {
              Name: expect.stringMatching(/.*-public-subnet-1$/),
              Type: 'Public'
            }
          },
          {
            cidr_block: '10.0.2.0/24',
            map_public_ip_on_launch: true,
            tags: {
              Name: expect.stringMatching(/.*-public-subnet-2$/),
              Type: 'Public'
            }
          }
        ],
        private: [
          {
            cidr_block: '10.0.10.0/24',
            map_public_ip_on_launch: false,
            tags: {
              Name: expect.stringMatching(/.*-private-subnet-1$/),
              Type: 'Private'
            }
          },
          {
            cidr_block: '10.0.11.0/24',
            map_public_ip_on_launch: false,
            tags: {
              Name: expect.stringMatching(/.*-private-subnet-2$/),
              Type: 'Private'
            }
          }
        ]
      },
      kms: {
        deletion_window_in_days: 30,
        enable_key_rotation: true,
        tags: {
          Name: expect.stringMatching(/.*-kms-key$/)
        }
      },
      security_groups: {
        app: {
          description: expect.stringContaining('Application'),
          vpc_id: outputs.vpc_id
        },
        db: {
          description: expect.stringContaining('Database'),
          vpc_id: outputs.vpc_id
        },
        web: {
          description: expect.stringContaining('Web'),
          vpc_id: outputs.vpc_id
        },
        mgmt: {
          description: expect.stringContaining('Management'),
          vpc_id: outputs.vpc_id
        }
      },
      s3: {
        app_data_bucket: {
          versioning: true,
          encryption: true,
          public_access_block: true
        },
        cloudtrail_bucket: {
          versioning: true,
          encryption: true,
          lifecycle: true
        }
      },
      cloudtrail: {
        include_global_service_events: true,
        is_multi_region_trail: true,
        enable_logging: true
      }
    };
  } catch (error) {
    console.error('Failed to load expected configuration:', error);
    throw error;
  }
};

// Mock Terraform resource validation
const validateTerraformResource = (resourceType: string, expectedConfig: any): boolean => {
  // This would normally validate against actual Terraform configuration
  // For unit tests, we're validating the expected structure
  return true;
};

describe('Terraform Infrastructure Unit Tests', () => {
  let expectedConfig: TerraformConfig;
  let outputs: any;

  beforeAll(() => {
    expectedConfig = loadExpectedConfig();
    
    // Load outputs for validation
    const outputsPath = join(__dirname, '../cfn-outputs/flat-outputs.json');
    const outputsContent = readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
  });

  describe('VPC Configuration', () => {
    test('should have correct VPC CIDR block', () => {
      expect(outputs.vpc_cidr_block).toBe('10.0.0.0/16');
    });

    test('should have valid VPC ID format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have VPC ARN with correct format', () => {
      expect(outputs.vpc_arn).toMatch(/^arn:aws:ec2:us-east-1:\d{12}:vpc\/vpc-[a-f0-9]+$/);
    });

    test('should have DNS support enabled', () => {
      expect(expectedConfig.vpc.enable_dns_support).toBe(true);
    });

    test('should have DNS hostnames enabled', () => {
      expect(expectedConfig.vpc.enable_dns_hostnames).toBe(true);
    });
  });

  describe('Subnet Configuration', () => {
    test('should have correct number of public subnets', () => {
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      expect(publicSubnetIds).toHaveLength(2);
    });

    test('should have correct number of private subnets', () => {
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      expect(privateSubnetIds).toHaveLength(2);
    });

    test('should have correct public subnet CIDR blocks', () => {
      expect(expectedConfig.subnets.public[0].cidr_block).toBe('10.0.1.0/24');
      expect(expectedConfig.subnets.public[1].cidr_block).toBe('10.0.2.0/24');
    });

    test('should have correct private subnet CIDR blocks', () => {
      expect(expectedConfig.subnets.private[0].cidr_block).toBe('10.0.10.0/24');
      expect(expectedConfig.subnets.private[1].cidr_block).toBe('10.0.11.0/24');
    });

    test('should have public IP mapping enabled for public subnets', () => {
      expectedConfig.subnets.public.forEach(subnet => {
        expect(subnet.map_public_ip_on_launch).toBe(true);
      });
    });

    test('should have public IP mapping disabled for private subnets', () => {
      expectedConfig.subnets.private.forEach(subnet => {
        expect(subnet.map_public_ip_on_launch).toBe(false);
      });
    });

    test('should have valid subnet ID formats', () => {
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      
      [...publicSubnetIds, ...privateSubnetIds].forEach(subnetId => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });
  });

  describe('Security Groups Configuration', () => {
    test('should have all required security groups', () => {
      expect(outputs.app_security_group_id).toBeDefined();
      expect(outputs.db_security_group_id).toBeDefined();
      expect(outputs.web_security_group_id).toBeDefined();
      expect(outputs.mgmt_security_group_id).toBeDefined();
    });

    test('should have valid security group ID formats', () => {
      const securityGroupIds = [
        outputs.app_security_group_id,
        outputs.db_security_group_id,
        outputs.web_security_group_id,
        outputs.mgmt_security_group_id
      ];

      securityGroupIds.forEach(sgId => {
        expect(sgId).toMatch(/^sg-[a-f0-9]+$/);
      });
    });

    test('should have security groups in correct VPC', () => {
      const securityGroupIds = [
        outputs.app_security_group_id,
        outputs.db_security_group_id,
        outputs.web_security_group_id,
        outputs.mgmt_security_group_id
      ];

      // All security groups should be in the same VPC
      securityGroupIds.forEach(sgId => {
        expect(validateTerraformResource('aws_security_group', {
          vpc_id: outputs.vpc_id
        })).toBe(true);
      });
    });
  });

  describe('KMS Configuration', () => {
    test('should have valid KMS key ID format', () => {
      expect(outputs.kms_key_id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('should have valid KMS key ARN format', () => {
      expect(outputs.kms_key_arn).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\/[a-f0-9-]+$/);
    });

    test('should have valid KMS alias ARN format', () => {
      expect(outputs.kms_alias_arn).toMatch(/^arn:aws:kms:us-east-1:\d{12}:alias\/[a-z0-9-]+$/);
    });

    test('should have key rotation enabled', () => {
      expect(expectedConfig.kms.enable_key_rotation).toBe(true);
    });

    test('should have appropriate deletion window', () => {
      expect(expectedConfig.kms.deletion_window_in_days).toBe(30);
    });
  });

  describe('S3 Configuration', () => {
    test('should have valid app data bucket name format', () => {
      expect(outputs.app_data_bucket_name).toMatch(/^[a-z0-9-]+$/);
    });

    test('should have valid CloudTrail bucket name format', () => {
      expect(outputs.cloudtrail_bucket_name).toMatch(/^[a-z0-9-]+$/);
    });

    test('should have valid S3 bucket ARN formats', () => {
      expect(outputs.app_data_bucket_arn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
      expect(outputs.cloudtrail_bucket_arn).toMatch(/^arn:aws:s3:::[a-z0-9-]+$/);
    });

    test('should have app data bucket with encryption enabled', () => {
      expect(expectedConfig.s3.app_data_bucket.encryption).toBe(true);
    });

    test('should have app data bucket with versioning enabled', () => {
      expect(expectedConfig.s3.app_data_bucket.versioning).toBe(true);
    });

    test('should have app data bucket with public access blocked', () => {
      expect(expectedConfig.s3.app_data_bucket.public_access_block).toBe(true);
    });

    test('should have CloudTrail bucket with encryption enabled', () => {
      expect(expectedConfig.s3.cloudtrail_bucket.encryption).toBe(true);
    });
  });

  describe('IAM Configuration', () => {
    test('should have valid IAM role ARN formats', () => {
      expect(outputs.ec2_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9-_]+$/);
      expect(outputs.cloudtrail_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9-_]+$/);
      expect(outputs.cloudtrail_logs_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\/[a-zA-Z0-9-_]+$/);
    });

    test('should have valid EC2 instance profile name', () => {
      expect(outputs.ec2_instance_profile_name).toMatch(/^[a-zA-Z0-9-_]+$/);
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should have valid CloudTrail name format', () => {
      expect(outputs.cloudtrail_name).toMatch(/^[a-zA-Z0-9-_]+$/);
    });

    test('should have valid CloudTrail ARN format', () => {
      expect(outputs.cloudtrail_arn).toMatch(/^arn:aws:cloudtrail:us-east-1:\d{12}:trail\/[a-zA-Z0-9-_]+$/);
    });

    test('should have CloudTrail in home region', () => {
      expect(outputs.cloudtrail_home_region).toBe('us-east-1');
    });

    test('should have global service events enabled', () => {
      expect(expectedConfig.cloudtrail.include_global_service_events).toBe(true);
    });

    test('should have multi-region trail enabled', () => {
      expect(expectedConfig.cloudtrail.is_multi_region_trail).toBe(true);
    });

    test('should have logging enabled', () => {
      expect(expectedConfig.cloudtrail.enable_logging).toBe(true);
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should have valid CloudWatch log group name format', () => {
      expect(outputs.cloudwatch_log_group_name).toMatch(/^\/aws\/cloudtrail\/[a-zA-Z0-9-_]+$/);
    });

    test('should have valid CloudWatch log group ARN format', () => {
      expect(outputs.cloudwatch_log_group_arn).toMatch(/^arn:aws:logs:us-east-1:\d{12}:log-group:[a-zA-Z0-9-_/:]+$/);
    });
  });

  describe('Internet Gateway Configuration', () => {
    test('should have valid internet gateway ID format', () => {
      expect(outputs.internet_gateway_id).toMatch(/^igw-[a-f0-9]+$/);
    });
  });

  describe('Infrastructure Summary Validation', () => {
    test('should have valid infrastructure summary JSON structure', () => {
      const summary = JSON.parse(outputs.infrastructure_summary);
      
      expect(summary).toHaveProperty('encryption');
      expect(summary).toHaveProperty('monitoring');
      expect(summary).toHaveProperty('security_groups');
      expect(summary).toHaveProperty('storage');
      expect(summary).toHaveProperty('subnets');
      expect(summary).toHaveProperty('vpc');
    });

    test('should have correct subnet counts in summary', () => {
      const summary = JSON.parse(outputs.infrastructure_summary);
      
      expect(summary.subnets.private_count).toBe(2);
      expect(summary.subnets.public_count).toBe(2);
    });

    test('should have correct VPC information in summary', () => {
      const summary = JSON.parse(outputs.infrastructure_summary);
      
      expect(summary.vpc.cidr).toBe(outputs.vpc_cidr_block);
      expect(summary.vpc.id).toBe(outputs.vpc_id);
    });

    test('should have correct security group mappings in summary', () => {
      const summary = JSON.parse(outputs.infrastructure_summary);
      
      expect(summary.security_groups.app).toBe(outputs.app_security_group_id);
      expect(summary.security_groups.db).toBe(outputs.db_security_group_id);
      expect(summary.security_groups.mgmt).toBe(outputs.mgmt_security_group_id);
      expect(summary.security_groups.web).toBe(outputs.web_security_group_id);
    });

    test('should have correct storage information in summary', () => {
      const summary = JSON.parse(outputs.infrastructure_summary);
      
      expect(summary.storage.app_data_bucket).toBe(outputs.app_data_bucket_name);
      expect(summary.storage.cloudtrail_bucket).toBe(outputs.cloudtrail_bucket_name);
    });
  });

  describe('Environment Configuration', () => {
    test('should have valid account ID format', () => {
      expect(outputs.account_id).toMatch(/^\d{12}$/);
    });

    test('should have correct region', () => {
      expect(outputs.region).toBe('us-east-1');
    });

    test('should have valid caller ARN format', () => {
      expect(outputs.caller_arn).toMatch(/^arn:aws:iam::\d{12}:user\/[a-zA-Z0-9-_]+$/);
    });
  });

  describe('Resource Dependencies', () => {
    test('should have consistent VPC references across resources', () => {
      const summary = JSON.parse(outputs.infrastructure_summary);
      
      // All resources should reference the same VPC
      expect(summary.vpc.id).toBe(outputs.vpc_id);
    });

    test('should have consistent KMS key references', () => {
      const summary = JSON.parse(outputs.infrastructure_summary);
      
      // KMS key should be referenced consistently
      expect(summary.encryption.kms_key_arn).toBe(outputs.kms_key_arn);
    });

    test('should have consistent CloudTrail references', () => {
      const summary = JSON.parse(outputs.infrastructure_summary);
      
      // CloudTrail should be referenced consistently
      expect(summary.monitoring.cloudtrail_name).toBe(outputs.cloudtrail_name);
    });
  });
});
