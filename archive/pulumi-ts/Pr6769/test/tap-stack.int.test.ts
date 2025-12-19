import * as fs from 'fs';
import * as path from 'path';

/**
 * Integration tests for deployed infrastructure outputs
 *
 * These tests validate the deployment outputs from cfn-outputs/flat-outputs.json
 * without requiring AWS authentication. They verify:
 * - Outputs file exists and is valid JSON
 * - Required outputs are present
 * - Output values have correct formats (ARNs, URLs, IDs)
 * - Resource naming follows expected patterns
 */

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const OUTPUTS_FILE_PATH = path.join(
  process.cwd(),
  'cfn-outputs',
  'flat-outputs.json'
);

interface StackOutputs {
  // VPC and Networking
  vpcId?: string;
  blueVpcId?: string;
  greenVpcId?: string;
  transitGatewayId?: string;

  // Load Balancers
  albDnsName?: string;
  albUrl?: string;
  blueAlbDns?: string;
  greenAlbDns?: string;

  // ECS
  ecsClusterArn?: string;
  ecsClusterName?: string;
  ecsServiceName?: string;

  // RDS
  rdsEndpoint?: string;
  rdsClusterIdentifier?: string;
  blueDbEndpoint?: string;
  greenDbEndpoint?: string;

  // S3
  staticAssetsBucket?: string;
  flowLogsBucket?: string;
  transactionLogsBucketName?: string;
  complianceDocsBucketName?: string;

  // CloudFront
  cloudfrontDomainName?: string;
  cloudfrontUrl?: string;

  // Other
  ecrRepositoryUrl?: string;
  secretArn?: string;
  kmsKeyId?: string;

  [key: string]: string | undefined;
}

/**
 * Load and parse the deployment outputs JSON file
 */
const loadOutputs = (): StackOutputs => {
  if (!fs.existsSync(OUTPUTS_FILE_PATH)) {
    throw new Error(
      `Deployment outputs file not found at ${OUTPUTS_FILE_PATH}. ` +
        'Please ensure deployment completed successfully and outputs were saved.'
    );
  }

  const content = fs.readFileSync(OUTPUTS_FILE_PATH, 'utf-8');
  return JSON.parse(content);
};

/**
 * Helper functions for validation
 */
const validators = {
  isValidArn: (arn: string): boolean => {
    return /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:[a-zA-Z0-9\-\/:]+$/.test(arn);
  },

  isValidVpcId: (id: string): boolean => {
    return /^vpc-[a-f0-9]{8,17}$/.test(id);
  },

  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidDnsName: (dns: string): boolean => {
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(
      dns
    );
  },

  isValidS3BucketName: (name: string): boolean => {
    return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name) && name.length <= 63;
  },

  isValidTransitGatewayId: (id: string): boolean => {
    return /^tgw-[a-f0-9]{17}$/.test(id);
  },

  isValidCloudFrontDomain: (domain: string): boolean => {
    return /^[a-z0-9]+\.cloudfront\.net$/.test(domain);
  },
};

describe('Infrastructure Deployment Outputs - Integration Tests', () => {
  let outputs: StackOutputs;

  beforeAll(() => {
    outputs = loadOutputs();
    console.log('Loaded deployment outputs:', Object.keys(outputs).sort());
    console.log('Total output count:', Object.keys(outputs).length);
  });

  describe('Outputs File Validation', () => {
    it('should successfully load the outputs file', () => {
      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    it('should have valid JSON structure', () => {
      const content = fs.readFileSync(OUTPUTS_FILE_PATH, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should not contain null or undefined values', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).toBeDefined();
        expect(value).not.toBeNull();
        expect(value).not.toBe('');
      });
    });
  });

  describe('VPC Outputs', () => {
    it('should have at least one VPC ID', () => {
      const hasVpc =
        outputs.vpcId || outputs.blueVpcId || outputs.greenVpcId;
      expect(hasVpc).toBeDefined();
    });

    it('should have valid VPC ID format if present', () => {
      if (outputs.vpcId) {
        expect(validators.isValidVpcId(outputs.vpcId)).toBe(true);
      }
      if (outputs.blueVpcId) {
        expect(validators.isValidVpcId(outputs.blueVpcId)).toBe(true);
      }
      if (outputs.greenVpcId) {
        expect(validators.isValidVpcId(outputs.greenVpcId)).toBe(true);
      }
    });

    it('should have valid Transit Gateway ID if present', () => {
      if (outputs.transitGatewayId) {
        expect(validators.isValidTransitGatewayId(outputs.transitGatewayId)).toBe(
          true
        );
      }
    });
  });

  describe('Load Balancer Outputs', () => {
    it('should have at least one ALB DNS name', () => {
      const hasAlb =
        outputs.albDnsName || outputs.blueAlbDns || outputs.greenAlbDns;
      expect(hasAlb).toBeDefined();
    });

    it('should have valid ALB DNS format if present', () => {
      if (outputs.albDnsName) {
        expect(outputs.albDnsName).toContain('.elb.amazonaws.com');
        expect(validators.isValidDnsName(outputs.albDnsName)).toBe(true);
      }
      if (outputs.blueAlbDns) {
        expect(outputs.blueAlbDns).toContain('.elb.amazonaws.com');
      }
      if (outputs.greenAlbDns) {
        expect(outputs.greenAlbDns).toContain('.elb.amazonaws.com');
      }
    });

    it('should have valid ALB URL format if present', () => {
      if (outputs.albUrl) {
        expect(validators.isValidUrl(outputs.albUrl)).toBe(true);
        expect(outputs.albUrl).toMatch(/^https?:\/\//);
      }
    });
  });

  describe('ECS Outputs', () => {
    it('should have ECS cluster ARN if ECS is deployed', () => {
      if (outputs.ecsClusterName || outputs.ecsServiceName) {
        expect(outputs.ecsClusterArn).toBeDefined();
      }
    });

    it('should have valid ECS cluster ARN format if present', () => {
      if (outputs.ecsClusterArn) {
        expect(validators.isValidArn(outputs.ecsClusterArn)).toBe(true);
        expect(outputs.ecsClusterArn).toContain(':ecs:');
        expect(outputs.ecsClusterArn).toContain(':cluster/');
      }
    });

    it('should have matching cluster name in ARN if both present', () => {
      if (outputs.ecsClusterArn && outputs.ecsClusterName) {
        expect(outputs.ecsClusterArn).toContain(outputs.ecsClusterName);
      }
    });
  });

  describe('RDS Outputs', () => {
    it('should have at least one RDS endpoint', () => {
      const hasRds =
        outputs.rdsEndpoint || outputs.blueDbEndpoint || outputs.greenDbEndpoint;
      expect(hasRds).toBeDefined();
    });

    it('should have valid RDS cluster identifier if present', () => {
      if (outputs.rdsClusterIdentifier) {
        expect(outputs.rdsClusterIdentifier).toMatch(/^[a-z][a-z0-9-]*$/);
        expect(outputs.rdsClusterIdentifier.length).toBeLessThanOrEqual(63);
      }
    });
  });

  describe('S3 Outputs', () => {
    it('should have valid S3 bucket names if present', () => {
      if (outputs.staticAssetsBucket) {
        expect(validators.isValidS3BucketName(outputs.staticAssetsBucket)).toBe(
          true
        );
      }
      if (outputs.flowLogsBucket) {
        expect(validators.isValidS3BucketName(outputs.flowLogsBucket)).toBe(true);
      }
      if (outputs.transactionLogsBucketName) {
        expect(
          validators.isValidS3BucketName(outputs.transactionLogsBucketName)
        ).toBe(true);
      }
      if (outputs.complianceDocsBucketName) {
        expect(
          validators.isValidS3BucketName(outputs.complianceDocsBucketName)
        ).toBe(true);
      }
    });

    it('should have environment suffix in bucket names', () => {
      const bucketNames = [
        outputs.staticAssetsBucket,
        outputs.flowLogsBucket,
        outputs.transactionLogsBucketName,
        outputs.complianceDocsBucketName,
      ].filter(Boolean);

      bucketNames.forEach((bucket) => {
        expect(bucket).toContain(ENVIRONMENT_SUFFIX);
      });
    });
  });

  describe('CloudFront Outputs', () => {
    it('should have valid CloudFront domain if present', () => {
      if (outputs.cloudfrontDomainName) {
        expect(
          validators.isValidCloudFrontDomain(outputs.cloudfrontDomainName)
        ).toBe(true);
        expect(outputs.cloudfrontDomainName).toContain('.cloudfront.net');
      }
    });

    it('should have valid CloudFront URL if present', () => {
      if (outputs.cloudfrontUrl) {
        expect(validators.isValidUrl(outputs.cloudfrontUrl)).toBe(true);
        expect(outputs.cloudfrontUrl).toMatch(/^https:\/\//);
      }
    });
  });

  describe('ECR Outputs', () => {
    it('should have valid ECR repository URL if present', () => {
      if (outputs.ecrRepositoryUrl) {
        expect(outputs.ecrRepositoryUrl).toMatch(/^\d{12}\.dkr\.ecr\./);
        expect(outputs.ecrRepositoryUrl).toContain('.amazonaws.com/');
      }
    });
  });

  describe('Secrets Manager Outputs', () => {
    it('should have valid secret ARN if present', () => {
      if (outputs.secretArn) {
        expect(validators.isValidArn(outputs.secretArn)).toBe(true);
        expect(outputs.secretArn).toContain(':secretsmanager:');
        expect(outputs.secretArn).toContain(':secret:');
      }
    });
  });

  describe('KMS Outputs', () => {
    it('should have valid KMS key ID if present', () => {
      if (outputs.kmsKeyId) {
        expect(outputs.kmsKeyId).toMatch(
          /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
        );
      }
    });
  });

  describe('Resource Naming Convention', () => {
    it('should follow naming convention with environment suffix', () => {
      const outputsWithSuffix = Object.entries(outputs).filter(([_, value]) => {
        return typeof value === 'string' && value.includes(ENVIRONMENT_SUFFIX);
      });

      expect(outputsWithSuffix.length).toBeGreaterThan(0);
    });

    it('should not have resources with "latest" tags', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('tag')) {
          expect(value).not.toBe('latest');
        }
      });
    });
  });

  describe('Output Completeness', () => {
    it('should have core infrastructure outputs', () => {
      const hasCoreInfra = Boolean(
        (outputs.vpcId || outputs.blueVpcId) &&
          (outputs.albDnsName || outputs.blueAlbDns)
      );

      expect(hasCoreInfra).toBe(true);
    });

    it('should have consistent blue-green pairs if using blue-green deployment', () => {
      const hasBlue = Boolean(outputs.blueVpcId || outputs.blueAlbDns);
      const hasGreen = Boolean(outputs.greenVpcId || outputs.greenAlbDns);

      if (hasBlue && hasGreen) {
        // If one blue resource exists, corresponding green should exist
        if (outputs.blueVpcId) {
          expect(outputs.greenVpcId).toBeDefined();
        }
        if (outputs.blueAlbDns) {
          expect(outputs.greenAlbDns).toBeDefined();
        }
        if (outputs.blueDbEndpoint) {
          expect(outputs.greenDbEndpoint).toBeDefined();
        }
      }
    });
  });

  describe('Output Value Formats', () => {
    it('should not have outputs with placeholder values', () => {
      const placeholders = ['TODO', 'PLACEHOLDER', 'TBD', 'FIXME', 'XXX'];

      Object.entries(outputs).forEach(([key, value]) => {
        placeholders.forEach((placeholder) => {
          expect(value?.toUpperCase()).not.toContain(placeholder);
        });
      });
    });

    it('should have properly formatted URLs with protocols', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (key.toLowerCase().includes('url') && value) {
          expect(value).toMatch(/^https?:\/\//);
        }
      });
    });

    it('should have ARNs starting with arn:aws', () => {
      Object.entries(outputs).forEach(([key, value]) => {
        if (
          (key.toLowerCase().includes('arn') ||
            key.toLowerCase().includes('role')) &&
          value &&
          value.includes('arn')
        ) {
          expect(value).toMatch(/^arn:aws:/);
        }
      });
    });
  });

  describe('Output Documentation', () => {
    it('should write a summary report of all outputs', () => {
      const reportPath = path.join(process.cwd(), 'test-output-summary.txt');
      const lines = [
        '='.repeat(80),
        'Deployment Outputs Summary',
        `Environment: ${ENVIRONMENT_SUFFIX}`,
        `Generated: ${new Date().toISOString()}`,
        '='.repeat(80),
        '',
        'VPC Resources:',
        `  VPC ID: ${outputs.vpcId || outputs.blueVpcId || 'N/A'}`,
        `  Blue VPC: ${outputs.blueVpcId || 'N/A'}`,
        `  Green VPC: ${outputs.greenVpcId || 'N/A'}`,
        `  Transit Gateway: ${outputs.transitGatewayId || 'N/A'}`,
        '',
        'Load Balancers:',
        `  ALB DNS: ${outputs.albDnsName || outputs.blueAlbDns || 'N/A'}`,
        `  ALB URL: ${outputs.albUrl || 'N/A'}`,
        '',
        'ECS Resources:',
        `  Cluster ARN: ${outputs.ecsClusterArn || 'N/A'}`,
        `  Cluster Name: ${outputs.ecsClusterName || 'N/A'}`,
        `  Service Name: ${outputs.ecsServiceName || 'N/A'}`,
        '',
        'Database:',
        `  RDS Endpoint: ${outputs.rdsEndpoint || outputs.blueDbEndpoint || 'N/A'}`,
        `  Cluster ID: ${outputs.rdsClusterIdentifier || 'N/A'}`,
        '',
        'Storage:',
        `  Static Assets: ${outputs.staticAssetsBucket || 'N/A'}`,
        `  Flow Logs: ${outputs.flowLogsBucket || 'N/A'}`,
        `  Transaction Logs: ${outputs.transactionLogsBucketName || 'N/A'}`,
        '',
        'CDN:',
        `  CloudFront: ${outputs.cloudfrontDomainName || 'N/A'}`,
        `  CloudFront URL: ${outputs.cloudfrontUrl || 'N/A'}`,
        '',
        'Other:',
        `  ECR Repository: ${outputs.ecrRepositoryUrl || 'N/A'}`,
        `  Secret ARN: ${outputs.secretArn || 'N/A'}`,
        `  KMS Key: ${outputs.kmsKeyId || 'N/A'}`,
        '',
        '='.repeat(80),
      ];

      fs.writeFileSync(reportPath, lines.join('\n'));
      expect(fs.existsSync(reportPath)).toBe(true);
      console.log(`Output summary written to: ${reportPath}`);
    });
  });
});
