// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Stack Outputs Validation', () => {
    test('should have all required outputs from deployment', () => {
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.AlbDnsName).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.SqsQueueUrl).toBeDefined();
      expect(outputs.CloudFrontDomainName).toBeDefined();
    });

    test('should have valid AWS resource identifiers', () => {
      const vpcId = outputs.VpcId;
      const albDns = outputs.AlbDnsName;
      const s3Bucket = outputs.S3BucketName;
      const cloudfrontDomain = outputs.CloudFrontDomainName;

      expect(vpcId).toMatch(/^vpc-[a-f0-9]{8,17}$/);
      expect(albDns).toContain('.elb.amazonaws.com');
      expect(s3Bucket).toMatch(/^[a-z0-9-]+$/);
      expect(cloudfrontDomain).toContain('.cloudfront.net');
    });
  });
});
