import { TestConfiguration, ResourceTestCase, AWS_RESOURCE_TYPE } from './types';

export const DEFAULT_TEST_CONFIG: TestConfiguration = {
  stackName: `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`,
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  environmentSuffix: process.env.ENVIRONMENT_SUFFIX || 'dev',
  timeouts: {
    unit: 30000, // 30 seconds
    integration: 300000, // 5 minutes
    deployment: 600000 // 10 minutes
  }
};

export const SECURITY_PARAMETERS = {
  ALLOWED_IP_RANGES: ['203.0.113.0/24', '198.51.100.0/24'],
  SUSPICIOUS_IP_RANGES: ['192.0.2.0/24', '203.0.113.100/32'],
  PROJECT_NAME: 'secure-infrastructure',
  ENVIRONMENT: 'production',
  OWNER: 'security-team'
};

export const EXPECTED_RESOURCE_COUNT = {
  TOTAL_RESOURCES: 22,
  S3_BUCKETS: 3,
  KMS_KEYS: 2,
  NETWORK_ACL_ENTRIES: 3,
  SUBNETS: 2
};

export const EXPECTED_OUTPUTS = [
  'S3BucketName',
  'S3BucketTwoName',
  'LoggingBucketName',
  'CloudFrontDistributionId',
  'CloudFrontDomainName',
  'WebACLId',
  'GuardDutyDetectorId',
  'VPCId',
  'RDSInstanceId',
  'RDSEndpoint'
];

export const REQUIRED_TAGS = ['Project', 'Environment', 'Owner'];

export const WAF_MANAGED_RULES = [
  'AWSManagedRulesCommonRuleSet',
  'AWSManagedRulesKnownBadInputsRuleSet',
  'AWSManagedRulesSQLiRuleSet'
];

export const SQL_INJECTION_PAYLOADS = [
  "1' OR '1'='1",
  "'; DROP TABLE users;--",
  "1 UNION SELECT NULL,username,password FROM users--",
  "<script>alert('XSS')</script>",
  "../../../etc/passwd"
];

export const PERFORMANCE_TEST_URLS = {
  VALID_REQUESTS: [
    '/index.html',
    '/assets/style.css',
    '/assets/script.js',
    '/favicon.ico'
  ],
  MALICIOUS_REQUESTS: [
    '/test?id=1\' OR \'1\'=\'1',
    '/admin?cmd=cat+/etc/passwd',
    '/test?input=<script>alert(1)</script>'
  ]
};

export const RESOURCE_TEST_CASES: ResourceTestCase[] = [
  {
    resourceType: 'AWS::S3::Bucket',
    logicalId: 'SecureS3Bucket',
    testCases: [
      {
        name: 'S3 Bucket Encryption',
        description: 'Should have KMS encryption enabled',
        assertions: [
          {
            property: 'Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm',
            expectedValue: 'aws:kms',
            condition: 'equals'
          },
          {
            property: 'Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled',
            expectedValue: true,
            condition: 'equals'
          }
        ]
      },
      {
        name: 'S3 Public Access Block',
        description: 'Should block all public access',
        assertions: [
          {
            property: 'Properties.PublicAccessBlockConfiguration.BlockPublicAcls',
            expectedValue: true,
            condition: 'equals'
          },
          {
            property: 'Properties.PublicAccessBlockConfiguration.BlockPublicPolicy',
            expectedValue: true,
            condition: 'equals'
          },
          {
            property: 'Properties.PublicAccessBlockConfiguration.IgnorePublicAcls',
            expectedValue: true,
            condition: 'equals'
          },
          {
            property: 'Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets',
            expectedValue: true,
            condition: 'equals'
          }
        ]
      },
      {
        name: 'S3 Versioning',
        description: 'Should have versioning enabled',
        assertions: [
          {
            property: 'Properties.VersioningConfiguration.Status',
            expectedValue: 'Enabled',
            condition: 'equals'
          }
        ]
      }
    ]
  },
  {
    resourceType: 'AWS::WAFv2::WebACL',
    logicalId: 'WebACL',
    testCases: [
      {
        name: 'WAF Scope',
        description: 'Should be configured for CloudFront',
        assertions: [
          {
            property: 'Properties.Scope',
            expectedValue: 'CLOUDFRONT',
            condition: 'equals'
          }
        ]
      },
      {
        name: 'WAF Rules Count',
        description: 'Should have at least 3 managed rules',
        assertions: [
          {
            property: 'Properties.Rules.length',
            expectedValue: 3,
            condition: 'greaterThan'
          }
        ]
      },
      {
        name: 'WAF Default Action',
        description: 'Should allow by default',
        assertions: [
          {
            property: 'Properties.DefaultAction.Allow',
            expectedValue: {},
            condition: 'exists'
          }
        ]
      }
    ]
  },
  {
    resourceType: 'AWS::RDS::DBInstance',
    logicalId: 'SecureRDSInstance',
    testCases: [
      {
        name: 'RDS Encryption',
        description: 'Should have storage encryption enabled',
        assertions: [
          {
            property: 'Properties.StorageEncrypted',
            expectedValue: true,
            condition: 'equals'
          }
        ]
      },
      {
        name: 'RDS Public Access',
        description: 'Should not be publicly accessible',
        assertions: [
          {
            property: 'Properties.PubliclyAccessible',
            expectedValue: false,
            condition: 'equals'
          }
        ]
      },
      {
        name: 'RDS Deletion Protection',
        description: 'Should have deletion protection enabled',
        assertions: [
          {
            property: 'Properties.DeletionProtection',
            expectedValue: true,
            condition: 'equals'
          }
        ]
      },
      {
        name: 'RDS Backup Retention',
        description: 'Should have backup retention of at least 7 days',
        assertions: [
          {
            property: 'Properties.BackupRetentionPeriod',
            expectedValue: 7,
            condition: 'greaterThan'
          }
        ]
      }
    ]
  },
  {
    resourceType: 'AWS::EC2::VPC',
    logicalId: 'SecureVPC',
    testCases: [
      {
        name: 'VPC CIDR Block',
        description: 'Should have correct CIDR block',
        assertions: [
          {
            property: 'Properties.CidrBlock',
            expectedValue: '10.0.0.0/16',
            condition: 'equals'
          }
        ]
      },
      {
        name: 'VPC DNS Settings',
        description: 'Should have DNS hostnames and support enabled',
        assertions: [
          {
            property: 'Properties.EnableDnsHostnames',
            expectedValue: true,
            condition: 'equals'
          },
          {
            property: 'Properties.EnableDnsSupport',
            expectedValue: true,
            condition: 'equals'
          }
        ]
      }
    ]
  },
  {
    resourceType: 'AWS::GuardDuty::Detector',
    logicalId: 'GuardDutyDetector',
    testCases: [
      {
        name: 'GuardDuty Enabled',
        description: 'Should be enabled',
        assertions: [
          {
            property: 'Properties.Enable',
            expectedValue: true,
            condition: 'equals'
          }
        ]
      },
      {
        name: 'GuardDuty S3 Logs',
        description: 'Should have S3 logs enabled',
        assertions: [
          {
            property: 'Properties.DataSources.S3Logs.Enable',
            expectedValue: true,
            condition: 'equals'
          }
        ]
      },
      {
        name: 'GuardDuty Malware Protection',
        description: 'Should have malware protection enabled',
        assertions: [
          {
            property: 'Properties.DataSources.MalwareProtection.ScanEc2InstanceWithFindings.EbsVolumes',
            expectedValue: true,
            condition: 'equals'
          }
        ]
      }
    ]
  }
];

export const COMPLIANCE_STANDARDS = {
  AWS_FOUNDATIONAL_SECURITY: {
    controls: [
      {
        id: 'S3.1',
        title: 'S3 buckets should prohibit public write access',
        category: 'S3'
      },
      {
        id: 'S3.2',
        title: 'S3 buckets should prohibit public read access',
        category: 'S3'
      },
      {
        id: 'S3.4',
        title: 'S3 buckets should have server-side encryption enabled',
        category: 'S3'
      },
      {
        id: 'RDS.3',
        title: 'RDS DB instances should have encryption at rest enabled',
        category: 'RDS'
      },
      {
        id: 'EC2.2',
        title: 'VPC default security group should restrict all traffic',
        category: 'EC2'
      },
      {
        id: 'GuardDuty.1',
        title: 'GuardDuty should be enabled',
        category: 'GuardDuty'
      }
    ]
  }
};

export const MOCK_STACK_OUTPUTS = {
  S3BucketName: 'secure-infrastructure-secure-bucket-123456789012-us-east-1',
  S3BucketTwoName: 'secure-infrastructure-secure-bucket-two-123456789012-us-east-1',
  LoggingBucketName: 'secure-access-logs-bucket-123456789012-us-east-1',
  CloudFrontDistributionId: 'E1234567890123',
  CloudFrontDomainName: 'd1234567890123.cloudfront.net',
  WebACLId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  GuardDutyDetectorId: '12345678901234567890123456789012',
  VPCId: 'vpc-1234567890abcdef0',
  RDSInstanceId: 'secure-infrastructure-secure-db',
  RDSEndpoint: 'secure-infrastructure-secure-db.abcdefghijkl.us-east-1.rds.amazonaws.com'
};

export const TEST_DATA_GENERATORS = {
  generateRandomString: (length: number = 8): string => {
    return Math.random().toString(36).substring(2, length + 2);
  },

  generateTestFileName: (): string => {
    const timestamp = Date.now();
    const random = TEST_DATA_GENERATORS.generateRandomString(4);
    return `integration-test-${timestamp}-${random}.txt`;
  },

  generateTestContent: (): string => {
    return `Test content generated at ${new Date().toISOString()}`;
  },

  generateMaliciousPayload: (type: 'sql' | 'xss' | 'path_traversal'): string => {
    const payloads = {
      sql: "1' OR '1'='1 --",
      xss: "<script>alert('XSS Test')</script>",
      path_traversal: "../../../etc/passwd"
    };
    return payloads[type];
  }
};

export const SECURITY_BENCHMARKS = {
  ENCRYPTION: {
    S3_KMS_REQUIRED: true,
    RDS_ENCRYPTION_REQUIRED: true,
    SECRETS_MANAGER_ENCRYPTION: true
  },
  NETWORK: {
    VPC_PRIVATE_SUBNETS: true,
    NO_PUBLIC_RDS: true,
    SECURITY_GROUP_RESTRICTIONS: true
  },
  MONITORING: {
    GUARDDUTY_ENABLED: true,
    ACCESS_LOGGING: true,
    CLOUDTRAIL_ENABLED: true
  },
  ACCESS_CONTROL: {
    PUBLIC_READ_BLOCKED: true,
    PUBLIC_WRITE_BLOCKED: true,
    IP_RESTRICTIONS: true
  }
};

export const PERFORMANCE_THRESHOLDS = {
  CLOUDFRONT_RESPONSE_TIME_MS: 2000,
  S3_UPLOAD_TIME_MS: 5000,
  WAF_PROCESSING_TIME_MS: 100,
  DATABASE_CONNECTION_TIME_MS: 3000,
  CONCURRENT_REQUEST_SUCCESS_RATE: 0.95
};