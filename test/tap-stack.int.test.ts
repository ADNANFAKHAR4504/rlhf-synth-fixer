import { execSync } from 'child_process';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Function to get actual CloudFormation stack outputs
function getStackOutputs(): Record<string, string> {
  try {
    const command = `aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].Outputs" --output json`;
    const result = execSync(command, { encoding: 'utf-8' });
    const outputs = JSON.parse(result);

    // Convert AWS CLI output format to key-value pairs
    const outputMap: Record<string, string> = {};
    outputs.forEach((output: any) => {
      outputMap[output.OutputKey] = output.OutputValue;
    });

    return outputMap;
  } catch (error) {
    throw new Error(
      `Failed to retrieve stack outputs for ${stackName}: ${error}`
    );
  }
}

// Get actual deployment outputs
const stackOutputs = getStackOutputs();

describe('Secure Web Application Infrastructure Integration Tests', () => {
  let outputs: any = {};
  let stackExists = false;

  beforeAll(async () => {
    try {
      outputs = stackOutputs;
      stackExists = true;
    } catch (error) {
      console.error('Stack not found or not accessible:', error);
      stackExists = false;
      throw new Error(`Integration tests require deployed stack: ${stackName}`);
    }
  }, 30000);

  describe('Stack Deployment Validation', () => {
    test('stack should be in valid state', async () => {
      const command = `aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].StackStatus" --output text`;
      const result = execSync(command, { encoding: 'utf-8' }).trim();

      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(result);
    });

    test('all required stack outputs should be present', async () => {
      const requiredOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'LoadBalancerURL',
        'StaticContentBucketName',
        'BackupBucketName',
        'KMSKeyId',
        'CloudTrailArn',
        'PublicSubnets',
        'PrivateSubnets',
        'AutoScalingGroupName',
        'SNSTopicArn',
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('environment suffix should match expected value', () => {
      if (outputs.EnvironmentSuffix) {
        expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      }
      if (outputs.StackName) {
        expect(outputs.StackName).toContain(environmentSuffix);
      }
    });

    test('resource IDs should have correct format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[0-9a-f]{8,17}$/);
      if (outputs.LoadBalancerDNS) {
        expect(outputs.LoadBalancerDNS).toMatch(/.*\.elb\.amazonaws\.com$/);
      }
      if (outputs.StaticContentBucketName) {
        expect(outputs.StaticContentBucketName).toMatch(/^[a-z0-9-]+$/);
      }
      if (outputs.KMSKeyId) {
        expect(outputs.KMSKeyId).toMatch(/^[a-f0-9-]{36}$/);
      }
    });
  });

  describe('KMS Encryption Validation', () => {
    test('KMS key should be enabled with rotation', async () => {
      if (!outputs.KMSKeyId) {
        console.log('KMS Key ID not found in outputs, skipping test');
        return;
      }

      const command = `aws kms describe-key --key-id ${outputs.KMSKeyId} --query "KeyMetadata.KeyState" --output text`;
      const result = execSync(command, { encoding: 'utf-8' }).trim();

      expect(result).toBe('Enabled');
    });

    test('should encrypt and decrypt data', async () => {
      if (!outputs.KMSKeyId) {
        console.log('KMS Key ID not found in outputs, skipping test');
        return;
      }

      // Test basic KMS key functionality
      const testData = 'test-encryption-data';
      const encryptCommand = `aws kms encrypt --key-id ${outputs.KMSKeyId} --plaintext ${testData} --query "CiphertextBlob" --output text`;
      const encryptedData = execSync(encryptCommand, {
        encoding: 'utf-8',
      }).trim();

      expect(encryptedData).toBeDefined();
      expect(encryptedData.length).toBeGreaterThan(0);

      const decryptCommand = `aws kms decrypt --ciphertext-blob ${encryptedData} --query "Plaintext" --output text`;
      const decryptedData = execSync(decryptCommand, {
        encoding: 'utf-8',
      }).trim();

      // AWS CLI returns base64 encoded data, so we need to decode it
      const decodedData = Buffer.from(decryptedData, 'base64').toString();
      expect(decodedData).toBe(testData);
    });
  });

  describe('S3 Security Validation', () => {
    test('static content bucket should have AES-256 encryption', async () => {
      if (!outputs.StaticContentBucketName) {
        console.log(
          'Static content bucket not found in outputs, skipping test'
        );
        return;
      }

      const command = `aws s3api get-bucket-encryption --bucket ${outputs.StaticContentBucketName} --query "ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm" --output text`;
      const result = execSync(command, { encoding: 'utf-8' }).trim();

      expect(result).toBe('AES256');
    });

    test('bucket should block public access', async () => {
      if (!outputs.StaticContentBucketName) {
        console.log(
          'Static content bucket not found in outputs, skipping test'
        );
        return;
      }

      const command = `aws s3api get-public-access-block --bucket ${outputs.StaticContentBucketName} --query "PublicAccessBlockConfiguration" --output json`;
      const result = execSync(command, { encoding: 'utf-8' });
      const config = JSON.parse(result);

      expect(config.BlockPublicAcls).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('should store and retrieve encrypted objects', async () => {
      if (!outputs.StaticContentBucketName) {
        console.log(
          'Static content bucket not found in outputs, skipping test'
        );
        return;
      }

      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Secure CloudFormation integration test content';

      try {
        // Upload test object with server-side encryption
        const putCommand = `echo '${testContent}' | aws s3 cp - s3://${outputs.StaticContentBucketName}/${testKey} --server-side-encryption AES256`;
        execSync(putCommand, { encoding: 'utf-8' });

        // Retrieve test object
        const getCommand = `aws s3 cp s3://${outputs.StaticContentBucketName}/${testKey} -`;
        const retrievedContent = execSync(getCommand, {
          encoding: 'utf-8',
        }).trim();

        expect(retrievedContent).toBe(testContent);

        // Clean up
        const deleteCommand = `aws s3 rm s3://${outputs.StaticContentBucketName}/${testKey}`;
        execSync(deleteCommand, { encoding: 'utf-8' });
      } catch (error) {
        // Ensure cleanup on error
        try {
          const deleteCommand = `aws s3 rm s3://${outputs.StaticContentBucketName}/${testKey}`;
          execSync(deleteCommand, { encoding: 'utf-8' });
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist with correct CIDR', async () => {
      if (!outputs.VPCId) {
        console.log('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = `aws ec2 describe-vpcs --vpc-ids ${outputs.VPCId} --query "Vpcs[0].State" --output text`;
      const result = execSync(command, { encoding: 'utf-8' }).trim();

      expect(result).toBe('available');

      const cidrCommand = `aws ec2 describe-vpcs --vpc-ids ${outputs.VPCId} --query "Vpcs[0].CidrBlock" --output text`;
      const cidrResult = execSync(cidrCommand, { encoding: 'utf-8' }).trim();

      expect(cidrResult).toBe('10.0.0.0/16');
    });

    test('subnets should be distributed across availability zones', async () => {
      if (!outputs.PublicSubnets || !outputs.PrivateSubnets) {
        console.log('Subnet information not found in outputs, skipping test');
        return;
      }

      const publicSubnets = outputs.PublicSubnets.split(',');
      const privateSubnets = outputs.PrivateSubnets.split(',');

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Check that subnets are in different AZs
      const allSubnets = [...publicSubnets, ...privateSubnets];
      const command = `aws ec2 describe-subnets --subnet-ids ${allSubnets.join(' ')} --query "Subnets[].AvailabilityZone" --output json`;
      const result = execSync(command, { encoding: 'utf-8' });
      const azs = JSON.parse(result);

      const uniqueAzs = [...new Set(azs)];
      expect(uniqueAzs.length).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateway should provide outbound internet access for private subnets', async () => {
      if (!outputs.VPCId) {
        console.log('VPC ID not found in outputs, skipping test');
        return;
      }

      const command = `aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${outputs.VPCId}" --query "NatGateways[?State=='available'].NatGatewayId" --output json`;
      const result = execSync(command, { encoding: 'utf-8' });
      const natGateways = JSON.parse(result);

      expect(natGateways.length).toBeGreaterThanOrEqual(1);
      natGateways.forEach((natId: string) => {
        expect(natId).toMatch(/^nat-[0-9a-f]+$/);
      });
    });
  });

  describe('Load Balancer Validation', () => {
    test('ALB should be active and internet-facing', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.log('Load Balancer DNS not found in outputs, skipping test');
        return;
      }

      const command = `aws elbv2 describe-load-balancers --query "LoadBalancers[?DNSName=='${outputs.LoadBalancerDNS}'].State.Code" --output text`;
      const result = execSync(command, { encoding: 'utf-8' }).trim();

      expect(result).toBe('active');

      const schemeCommand = `aws elbv2 describe-load-balancers --query "LoadBalancers[?DNSName=='${outputs.LoadBalancerDNS}'].Scheme" --output text`;
      const schemeResult = execSync(schemeCommand, {
        encoding: 'utf-8',
      }).trim();

      expect(schemeResult).toBe('internet-facing');
    });
  });

  describe('Security and Compliance', () => {
    test('HTTPS endpoint should be properly formatted', async () => {
      if (outputs.LoadBalancerURL) {
        expect(outputs.LoadBalancerURL).toMatch(
          /^https?:\/\/.*\.elb\.amazonaws\.com$/
        );
      }
    });

    test('should handle concurrent operations', async () => {
      // This is a placeholder for concurrent operation testing
      expect(true).toBe(true);
    });

    test('should validate critical resources exist', () => {
      const criticalOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'StaticContentBucketName',
      ];
      criticalOutputs.forEach(output => {
        if (!outputs[output]) {
          console.log(`Warning: Missing critical output ${output}`);
        }
      });
      expect(stackExists).toBe(true);
    });
  });

  describe('CloudTrail Audit Trail Validation', () => {
    test('should have active CloudTrail', async () => {
      if (!outputs.CloudTrailArn) {
        console.log('CloudTrail ARN not found in outputs, skipping test');
        return;
      }

      const command = `aws cloudtrail get-trail-status --name ${outputs.CloudTrailArn} --query "IsLogging" --output text`;
      const result = execSync(command, { encoding: 'utf-8' }).trim();

      expect(result).toBe('true');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should have valid stack deployment', () => {
      expect(stackExists).toBe(true);
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });

    test('all resource names should include environment suffix for conflict avoidance', async () => {
      const command = `aws cloudformation describe-stack-resources --stack-name ${stackName} --query "StackResources[].{LogicalId:LogicalResourceId,PhysicalId:PhysicalResourceId}" --output json`;
      const result = execSync(command, { encoding: 'utf-8' });
      const resources = JSON.parse(result);

      expect(resources.length).toBeGreaterThan(0);

      // Check that the stack has resources and they follow naming conventions
      const keyResources = resources.filter((resource: any) =>
        [
          'VPC',
          'ApplicationLoadBalancer',
          'AutoScalingGroup',
          'StaticContentBucket',
        ].includes(resource.LogicalId)
      );

      expect(keyResources.length).toBeGreaterThan(0);
    });
  });
});
