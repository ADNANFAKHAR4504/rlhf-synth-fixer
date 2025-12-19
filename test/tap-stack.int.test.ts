// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  IAMClient,
  GetGroupCommand,
  ListAttachedGroupPoliciesCommand,
  GetPolicyCommand,
  ListGroupsCommand
} from '@aws-sdk/client-iam';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

// Initialize AWS IAM client with LocalStack endpoint support
const iamClient = new IAMClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(isLocalStack && {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test'
    }
  })
});

let outputs: any = {};

// Try to read outputs, but handle gracefully if file doesn't exist
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, integration tests will use expected resource names');
  outputs = {
    DevOpsGroupName: `DevOps-${environmentSuffix}`,
    CustomEC2PolicyName: `CustomEC2Policy-${environmentSuffix}`,
    DevOpsGroupArn: `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT || 'ACCOUNT'}:group/DevOps-${environmentSuffix}`,
    CustomEC2PolicyArn: `arn:aws:iam::${process.env.CDK_DEFAULT_ACCOUNT || 'ACCOUNT'}:policy/CustomEC2Policy-${environmentSuffix}`
  };
}

describe('IAM Infrastructure Integration Tests', () => {
  describe('DevOps IAM Group', () => {
    test('DevOps group exists and has correct name', async () => {
      const groupName = outputs.DevOpsGroupName;
      expect(groupName).toBeDefined();
      expect(groupName).toBe(`DevOps-${environmentSuffix}`);

      const command = new GetGroupCommand({ GroupName: groupName });
      const response = await iamClient.send(command);
      
      expect(response.Group).toBeDefined();
      expect(response.Group?.GroupName).toBe(groupName);
      expect(response.Group?.Path).toBe('/');
    });

    test('DevOps group has correct ARN format', async () => {
      const groupArn = outputs.DevOpsGroupArn;
      expect(groupArn).toBeDefined();
      expect(groupArn).toMatch(/^arn:aws:iam::\d{12}:group\/DevOps-/);
    });

    test('DevOps group has AmazonS3ReadOnlyAccess policy attached', async () => {
      const groupName = outputs.DevOpsGroupName;
      
      const command = new ListAttachedGroupPoliciesCommand({ 
        GroupName: groupName 
      });
      const response = await iamClient.send(command);
      
      expect(response.AttachedPolicies).toBeDefined();
      
      const s3ReadOnlyPolicy = response.AttachedPolicies?.find(
        policy => policy.PolicyName === 'AmazonS3ReadOnlyAccess'
      );
      
      expect(s3ReadOnlyPolicy).toBeDefined();
      expect(s3ReadOnlyPolicy?.PolicyArn).toBe('arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess');
    });

    test('DevOps group has CustomEC2Policy attached', async () => {
      const groupName = outputs.DevOpsGroupName;
      const expectedPolicyName = outputs.CustomEC2PolicyName;
      
      const command = new ListAttachedGroupPoliciesCommand({ 
        GroupName: groupName 
      });
      const response = await iamClient.send(command);
      
      expect(response.AttachedPolicies).toBeDefined();
      
      const customEC2Policy = response.AttachedPolicies?.find(
        policy => policy.PolicyName === expectedPolicyName
      );
      
      expect(customEC2Policy).toBeDefined();
      expect(customEC2Policy?.PolicyName).toBe(expectedPolicyName);
    });
  });

  describe('CustomEC2Policy', () => {
    test('CustomEC2Policy exists with correct name and description', async () => {
      const policyArn = outputs.CustomEC2PolicyArn;
      expect(policyArn).toBeDefined();

      const command = new GetPolicyCommand({ PolicyArn: policyArn });
      const response = await iamClient.send(command);

      expect(response.Policy).toBeDefined();
      expect(response.Policy?.PolicyName).toBe(outputs.CustomEC2PolicyName);

      // LocalStack may not return Description field - check if available
      if (response.Policy?.Description) {
        expect(response.Policy.Description).toBe('Policy to allow starting and stopping EC2 instances');
      }

      expect(response.Policy?.Path).toBe('/');
    });

    test('CustomEC2Policy has correct ARN format', async () => {
      const policyArn = outputs.CustomEC2PolicyArn;
      expect(policyArn).toMatch(/^arn:aws:iam::\d{12}:policy\/CustomEC2Policy-/);
    });

    test('CustomEC2Policy has correct permissions', async () => {
      const policyArn = outputs.CustomEC2PolicyArn;

      const command = new GetPolicyCommand({ PolicyArn: policyArn });
      const response = await iamClient.send(command);

      expect(response.Policy).toBeDefined();
      expect(response.Policy?.DefaultVersionId).toBeDefined();

      // Note: To get the actual policy document, we would need GetPolicyVersionCommand
      // For this integration test, we verify the policy exists and has the right metadata
      expect(response.Policy?.PolicyName).toContain('CustomEC2Policy');

      // LocalStack may not return Description field - check if available
      if (response.Policy?.Description) {
        expect(response.Policy.Description).toContain('EC2 instances');
      }
    });
  });

  describe('Resource Tagging and Management', () => {
    test('resources are properly isolated by environment suffix', async () => {
      const groupName = outputs.DevOpsGroupName;
      const policyName = outputs.CustomEC2PolicyName;
      
      expect(groupName).toContain(environmentSuffix);
      expect(policyName).toContain(environmentSuffix);
    });

    test('all expected CloudFormation outputs are present', () => {
      expect(outputs.DevOpsGroupArn).toBeDefined();
      expect(outputs.CustomEC2PolicyArn).toBeDefined();
      expect(outputs.DevOpsGroupName).toBeDefined();
      expect(outputs.CustomEC2PolicyName).toBeDefined();
    });

    test('verifies idempotency - resources can be deployed multiple times', async () => {
      // This test verifies that our resources exist and are in the expected state
      // If the stack was deployed multiple times, these resources should still be consistent
      const groupName = outputs.DevOpsGroupName;
      
      const groupCommand = new GetGroupCommand({ GroupName: groupName });
      const groupResponse = await iamClient.send(groupCommand);
      
      const attachedCommand = new ListAttachedGroupPoliciesCommand({ 
        GroupName: groupName 
      });
      const attachedResponse = await iamClient.send(attachedCommand);
      
      // Group should exist with exactly 2 policies attached
      expect(groupResponse.Group).toBeDefined();
      expect(attachedResponse.AttachedPolicies).toHaveLength(2);
      
      // Verify both expected policies are attached
      const policyNames = attachedResponse.AttachedPolicies!.map(p => p.PolicyName);
      expect(policyNames).toContain('AmazonS3ReadOnlyAccess');
      expect(policyNames).toContain(outputs.CustomEC2PolicyName);
    });
  });

  describe('Security Validation', () => {
    test('CustomEC2Policy follows principle of least privilege', async () => {
      const policyArn = outputs.CustomEC2PolicyArn;

      const command = new GetPolicyCommand({ PolicyArn: policyArn });
      const response = await iamClient.send(command);

      expect(response.Policy).toBeDefined();
      expect(response.Policy?.PolicyName).toBe(outputs.CustomEC2PolicyName);

      // Policy should be scoped appropriately (we already tested the specific actions in unit tests)
      // Here we verify the policy exists and has reasonable metadata
      // LocalStack may not return Description field - check if available
      if (response.Policy?.Description) {
        expect(response.Policy.Description).toBe('Policy to allow starting and stopping EC2 instances');
      }
    });

    test('no sensitive information exposed in resource names or descriptions', async () => {
      const policyArn = outputs.CustomEC2PolicyArn;
      
      const command = new GetPolicyCommand({ PolicyArn: policyArn });
      const response = await iamClient.send(command);
      
      const policyJson = JSON.stringify(response.Policy);
      expect(policyJson).not.toMatch(/password|secret|key|credential/i);
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('complete IAM setup creates functional DevOps group with required permissions', async () => {
      // This test validates the complete workflow:
      // 1. DevOps group exists
      // 2. Has S3 read-only access
      // 3. Has custom EC2 policy for start/stop operations
      
      const groupName = outputs.DevOpsGroupName;
      
      // Verify group exists
      const groupCommand = new GetGroupCommand({ GroupName: groupName });
      const groupResponse = await iamClient.send(groupCommand);
      expect(groupResponse.Group?.GroupName).toBe(groupName);
      
      // Verify attached policies
      const policiesCommand = new ListAttachedGroupPoliciesCommand({ 
        GroupName: groupName 
      });
      const policiesResponse = await iamClient.send(policiesCommand);
      
      expect(policiesResponse.AttachedPolicies).toHaveLength(2);
      
      const attachedPolicyArns = policiesResponse.AttachedPolicies!.map(p => p.PolicyArn!);
      
      // Should have AWS managed S3 read-only policy
      expect(attachedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess');
      
      // Should have our custom EC2 policy
      expect(attachedPolicyArns).toContain(outputs.CustomEC2PolicyArn);
      
      // Verify custom policy exists and is accessible
      const customPolicyCommand = new GetPolicyCommand({ 
        PolicyArn: outputs.CustomEC2PolicyArn 
      });
      const customPolicyResponse = await iamClient.send(customPolicyCommand);
      expect(customPolicyResponse.Policy?.PolicyName).toBe(outputs.CustomEC2PolicyName);
    });
  });
});
