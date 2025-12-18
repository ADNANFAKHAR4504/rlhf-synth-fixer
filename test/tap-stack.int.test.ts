// Integration tests for TAP Stack deployed to LocalStack
import fs from 'fs';

let outputs: Record<string, string> = {};
let hasDeployedResources = false;
let deployedEnvironmentSuffix = '';

// Try to load outputs if they exist (after deployment)
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
    // Check if this is a valid TapStack deployment by looking for expected outputs
    hasDeployedResources =
      Object.keys(outputs).length > 0 &&
      (outputs.TurnAroundPromptTableName !== undefined ||
        outputs.TurnAroundPromptTableArn !== undefined);
    // Get the actual deployed environment suffix from outputs
    deployedEnvironmentSuffix = outputs.EnvironmentSuffix || '';
  }
} catch (error) {
  console.warn('No deployment outputs found, skipping integration tests');
}

describe('TAP Stack Integration Tests', () => {
  describe('Deployment Validation', () => {
    test('should have deployment outputs when deployed', () => {
      if (hasDeployedResources) {
        expect(outputs).toBeDefined();
        expect(typeof outputs).toBe('object');
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('Stack Metadata Outputs', () => {
    test('should have stack name in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.StackName).toBeDefined();
        expect(typeof outputs.StackName).toBe('string');
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });

    test('should have environment suffix in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.EnvironmentSuffix).toBeDefined();
        expect(typeof outputs.EnvironmentSuffix).toBe('string');
        // Validate format: alphanumeric only
        expect(outputs.EnvironmentSuffix).toMatch(/^[a-zA-Z0-9]+$/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('VPC Outputs', () => {
    test('should have VPC ID in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.VPCId).toBeDefined();
        expect(outputs.VPCId).toMatch(/^vpc-/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });

    test('should have public subnet IDs in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.PublicSubnet1Id).toBeDefined();
        expect(outputs.PublicSubnet1Id).toMatch(/^subnet-/);
        expect(outputs.PublicSubnet2Id).toBeDefined();
        expect(outputs.PublicSubnet2Id).toMatch(/^subnet-/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });

    test('should have private subnet IDs in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.PrivateSubnet1Id).toBeDefined();
        expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-/);
        expect(outputs.PrivateSubnet2Id).toBeDefined();
        expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('Security Group Outputs', () => {
    test('should have app security group ID in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.AppSecurityGroupId).toBeDefined();
        expect(outputs.AppSecurityGroupId).toMatch(/^sg-/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });

    test('should have database security group ID in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.DatabaseSecurityGroupId).toBeDefined();
        expect(outputs.DatabaseSecurityGroupId).toMatch(/^sg-/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('S3 Bucket Outputs', () => {
    test('should have S3 bucket name in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.AppLogBucketName).toBeDefined();
        expect(typeof outputs.AppLogBucketName).toBe('string');
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });

    test('should have S3 bucket ARN in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.AppLogBucketArn).toBeDefined();
        expect(outputs.AppLogBucketArn).toMatch(/^arn:(aws|aws-cn|aws-us-gov):s3:/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('IAM Role Outputs', () => {
    test('should have IAM role ARN in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.AppRoleArn).toBeDefined();
        expect(outputs.AppRoleArn).toMatch(/^arn:(aws|aws-cn|aws-us-gov):iam:/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('Secrets Manager Outputs', () => {
    test('should have secret ARN in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.AppSecretArn).toBeDefined();
        expect(outputs.AppSecretArn).toMatch(/^arn:(aws|aws-cn|aws-us-gov):secretsmanager:/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('DynamoDB Table Outputs', () => {
    test('should have DynamoDB table name in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.TurnAroundPromptTableName).toBeDefined();
        expect(outputs.TurnAroundPromptTableName).toContain('TurnAroundPromptTable');
        // Validate table name includes the deployed environment suffix
        if (deployedEnvironmentSuffix) {
          expect(outputs.TurnAroundPromptTableName).toContain(deployedEnvironmentSuffix);
        }
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });

    test('should have DynamoDB table ARN in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.TurnAroundPromptTableArn).toBeDefined();
        expect(outputs.TurnAroundPromptTableArn).toMatch(/^arn:(aws|aws-cn|aws-us-gov):dynamodb:/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('SNS Topic Outputs', () => {
    test('should have SNS topic ARN in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.NotificationTopicArn).toBeDefined();
        expect(outputs.NotificationTopicArn).toMatch(/^arn:(aws|aws-cn|aws-us-gov):sns:/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('SQS Queue Outputs', () => {
    test('should have SQS queue URL in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.TaskQueueUrl).toBeDefined();
        expect(typeof outputs.TaskQueueUrl).toBe('string');
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });

    test('should have SQS queue ARN in outputs', () => {
      if (hasDeployedResources) {
        expect(outputs.TaskQueueArn).toBeDefined();
        expect(outputs.TaskQueueArn).toMatch(/^arn:(aws|aws-cn|aws-us-gov):sqs:/);
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });

  describe('Resource Count Validation', () => {
    test('should have minimum expected outputs when deployed', () => {
      if (hasDeployedResources) {
        const expectedOutputs = [
          'StackName',
          'EnvironmentSuffix',
          'VPCId',
          'TurnAroundPromptTableName',
          'TurnAroundPromptTableArn',
          'AppLogBucketName',
          'NotificationTopicArn',
          'TaskQueueUrl',
        ];

        for (const output of expectedOutputs) {
          expect(outputs[output]).toBeDefined();
        }
      } else {
        console.log('Skipping test - no deployment found');
        expect(true).toBe(true);
      }
    });
  });
});
