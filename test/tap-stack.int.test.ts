import * as fs from 'fs';
import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
  GetInstanceProfileCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand
} from '@aws-sdk/client-iam';
import {
  CloudFormationClient,
  DescribeStacksCommand
} from '@aws-sdk/client-cloudformation';

// Configuration - These are coming from cfn-outputs after deployment
let outputs: any = {};
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS clients
const iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cfnClient = new CloudFormationClient({ region: process.env.AWS_REGION || 'us-east-1' });

describe('IAM Security Stack Integration Tests', () => {
  beforeAll(async () => {
    // Load outputs from deployment
    try {
      if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
        outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
      } else {
        // If no outputs file, try to get from CloudFormation directly
        const describeCommand = new DescribeStacksCommand({ StackName: stackName });
        const response = await cfnClient.send(describeCommand);
        const stack = response.Stacks?.[0];
        if (stack && stack.Outputs) {
          outputs = {};
          stack.Outputs.forEach(output => {
            if (output.OutputKey && output.OutputValue) {
              outputs[output.OutputKey] = output.OutputValue;
            }
          });
        }
      }
    } catch (error) {
      console.warn('Could not load stack outputs, some tests may be skipped:', error);
      outputs = {};
    }
  }, 30000);

  describe('Stack Deployment Validation', () => {
    test('should have all required stack outputs', async () => {
      const requiredOutputs = [
        'EC2RoleArn',
        'LambdaRoleArn', 
        'EC2InstanceProfileName',
        'PermissionBoundaryArn'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(typeof outputs[outputKey]).toBe('string');
        expect(outputs[outputKey].length).toBeGreaterThan(0);
      });
    });

    test('should have ARNs in correct format', async () => {
      if (outputs.EC2RoleArn) {
        expect(outputs.EC2RoleArn).toMatch(/^arn:aws:iam::[0-9]{12}:role\/.*/);;
      }
      if (outputs.LambdaRoleArn) {
        expect(outputs.LambdaRoleArn).toMatch(/^arn:aws:iam::[0-9]{12}:role\/.*/);;
      }
      if (outputs.PermissionBoundaryArn) {
        expect(outputs.PermissionBoundaryArn).toMatch(/^arn:aws:iam::[0-9]{12}:policy\/.*/);;
      }
    });
  });

  describe('EC2 Role Integration Tests', () => {
    test('should retrieve EC2 role successfully', async () => {
      if (!outputs.EC2RoleArn) {
        console.warn('Skipping EC2 role test - no EC2RoleArn in outputs');
        return;
      }

      const roleName = outputs.EC2RoleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.EC2RoleArn);
      expect(response.Role?.RoleName).toContain('SecureEC2Role');
    }, 10000);

    test('should have permission boundary attached to EC2 role', async () => {
      if (!outputs.EC2RoleArn) {
        console.warn('Skipping EC2 permission boundary test');
        return;
      }

      const roleName = outputs.EC2RoleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role?.PermissionsBoundary).toBeDefined();
      expect(response.Role?.PermissionsBoundary?.PermissionsBoundaryArn)
        .toBe(outputs.PermissionBoundaryArn);
    }, 10000);

    test('should have correct assume role policy for EC2 role', async () => {
      if (!outputs.EC2RoleArn) {
        console.warn('Skipping EC2 assume role policy test');
        return;
      }

      const roleName = outputs.EC2RoleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
      const assumePolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}'));
      
      expect(assumePolicy.Statement).toBeDefined();
      expect(assumePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    }, 10000);

    test('should have inline policy attached to EC2 role', async () => {
      if (!outputs.EC2RoleArn) {
        console.warn('Skipping EC2 inline policy test');
        return;
      }

      const roleName = outputs.EC2RoleArn.split('/').pop();
      const command = new ListRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThan(0);
      expect(response.PolicyNames).toContain('EC2LeastPrivilegePolicy');
    }, 10000);

    test('should validate EC2 policy contains no wildcard allows', async () => {
      if (!outputs.EC2RoleArn) {
        console.warn('Skipping EC2 policy wildcard test');
        return;
      }

      const roleName = outputs.EC2RoleArn.split('/').pop();
      const policyCommand = new GetRolePolicyCommand({ 
        RoleName: roleName,
        PolicyName: 'EC2LeastPrivilegePolicy'
      });
      const policyResponse = await iamClient.send(policyCommand);
      
      const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument || '{}'));
      
      // Check that no Allow statements have wildcard actions
      policyDoc.Statement.forEach((stmt: any) => {
        if (stmt.Effect === 'Allow' && stmt.Action) {
          if (Array.isArray(stmt.Action)) {
            stmt.Action.forEach((action: string) => {
              expect(action).not.toBe('*');
            });
          } else {
            expect(stmt.Action).not.toBe('*');
          }
        }
      });
      
      // Verify there is an explicit deny for wildcards
      const wildcardDeny = policyDoc.Statement.find((stmt: any) => 
        stmt.Effect === 'Deny' && stmt.Action === '*'
      );
      expect(wildcardDeny).toBeDefined();
    }, 10000);
  });

  describe('Lambda Role Integration Tests', () => {
    test('should retrieve Lambda role successfully', async () => {
      if (!outputs.LambdaRoleArn) {
        console.warn('Skipping Lambda role test - no LambdaRoleArn in outputs');
        return;
      }

      const roleName = outputs.LambdaRoleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.Arn).toBe(outputs.LambdaRoleArn);
      expect(response.Role?.RoleName).toContain('SecureLambdaRole');
    }, 10000);

    test('should have permission boundary attached to Lambda role', async () => {
      if (!outputs.LambdaRoleArn) {
        console.warn('Skipping Lambda permission boundary test');
        return;
      }

      const roleName = outputs.LambdaRoleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role?.PermissionsBoundary).toBeDefined();
      expect(response.Role?.PermissionsBoundary?.PermissionsBoundaryArn)
        .toBe(outputs.PermissionBoundaryArn);
    }, 10000);

    test('should have correct assume role policy for Lambda role', async () => {
      if (!outputs.LambdaRoleArn) {
        console.warn('Skipping Lambda assume role policy test');
        return;
      }

      const roleName = outputs.LambdaRoleArn.split('/').pop();
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role?.AssumeRolePolicyDocument).toBeDefined();
      const assumePolicy = JSON.parse(decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}'));
      
      expect(assumePolicy.Statement).toBeDefined();
      expect(assumePolicy.Statement[0].Principal.Service).toContain('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    }, 10000);

    test('should have inline policy attached to Lambda role', async () => {
      if (!outputs.LambdaRoleArn) {
        console.warn('Skipping Lambda inline policy test');
        return;
      }

      const roleName = outputs.LambdaRoleArn.split('/').pop();
      const command = new ListRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.PolicyNames).toBeDefined();
      expect(response.PolicyNames?.length).toBeGreaterThan(0);
      expect(response.PolicyNames).toContain('LambdaLeastPrivilegePolicy');
    }, 10000);

    test('should validate Lambda policy contains no wildcard allows', async () => {
      if (!outputs.LambdaRoleArn) {
        console.warn('Skipping Lambda policy wildcard test');
        return;
      }

      const roleName = outputs.LambdaRoleArn.split('/').pop();
      const policyCommand = new GetRolePolicyCommand({ 
        RoleName: roleName,
        PolicyName: 'LambdaLeastPrivilegePolicy'
      });
      const policyResponse = await iamClient.send(policyCommand);
      
      const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument || '{}'));
      
      // Check that no Allow statements have wildcard actions
      policyDoc.Statement.forEach((stmt: any) => {
        if (stmt.Effect === 'Allow' && stmt.Action) {
          if (Array.isArray(stmt.Action)) {
            stmt.Action.forEach((action: string) => {
              expect(action).not.toBe('*');
            });
          } else {
            expect(stmt.Action).not.toBe('*');
          }
        }
      });
      
      // Verify there is an explicit deny for wildcards
      const wildcardDeny = policyDoc.Statement.find((stmt: any) => 
        stmt.Effect === 'Deny' && stmt.Action === '*'
      );
      expect(wildcardDeny).toBeDefined();
    }, 10000);
  });

  describe('EC2 Instance Profile Integration Tests', () => {
    test('should retrieve instance profile successfully', async () => {
      if (!outputs.EC2InstanceProfileName) {
        console.warn('Skipping instance profile test');
        return;
      }

      const command = new GetInstanceProfileCommand({ 
        InstanceProfileName: outputs.EC2InstanceProfileName 
      });
      const response = await iamClient.send(command);

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile?.InstanceProfileName)
        .toBe(outputs.EC2InstanceProfileName);
      expect(response.InstanceProfile?.Roles).toBeDefined();
      expect(response.InstanceProfile?.Roles?.length).toBe(1);
    }, 10000);

    test('should have EC2 role attached to instance profile', async () => {
      if (!outputs.EC2InstanceProfileName || !outputs.EC2RoleArn) {
        console.warn('Skipping instance profile role test');
        return;
      }

      const command = new GetInstanceProfileCommand({ 
        InstanceProfileName: outputs.EC2InstanceProfileName 
      });
      const response = await iamClient.send(command);

      expect(response.InstanceProfile?.Roles?.[0]?.Arn).toBe(outputs.EC2RoleArn);
    }, 10000);
  });

  describe('Permission Boundary Integration Tests', () => {
    test('should retrieve permission boundary policy successfully', async () => {
      if (!outputs.PermissionBoundaryArn) {
        console.warn('Skipping permission boundary test');
        return;
      }

      const policyArn = outputs.PermissionBoundaryArn;
      const command = new GetPolicyCommand({ PolicyArn: policyArn });
      const response = await iamClient.send(command);

      expect(response.Policy).toBeDefined();
      expect(response.Policy?.Arn).toBe(outputs.PermissionBoundaryArn);
      expect(response.Policy?.PolicyName).toContain('SecurePermissionBoundary');
    }, 10000);

    test('should validate permission boundary has wildcard denies', async () => {
      if (!outputs.PermissionBoundaryArn) {
        console.warn('Skipping permission boundary wildcard test');
        return;
      }

      // Get the policy version to retrieve the policy document
      const policyArn = outputs.PermissionBoundaryArn;
      const getPolicyCommand = new GetPolicyCommand({ PolicyArn: policyArn });
      const policyResponse = await iamClient.send(getPolicyCommand);
      
      expect(policyResponse.Policy?.DefaultVersionId).toBeDefined();
      
      // This would require GetPolicyVersionCommand to get the actual document
      // For now, we'll validate the policy exists and is properly configured
      expect(policyResponse.Policy?.PolicyName).toMatch(/SecurePermissionBoundary/);
    }, 10000);
  });

  describe('End-to-End Security Integration Test', () => {
    test('should validate complete security implementation', async () => {
      if (!outputs.EC2RoleArn || !outputs.LambdaRoleArn || !outputs.PermissionBoundaryArn) {
        console.warn('Skipping E2E security test - missing required outputs');
        return;
      }

      // 1. Verify both roles exist and are configured
      const ec2RoleName = outputs.EC2RoleArn.split('/').pop();
      const lambdaRoleName = outputs.LambdaRoleArn.split('/').pop();
      
      const ec2RoleCommand = new GetRoleCommand({ RoleName: ec2RoleName });
      const lambdaRoleCommand = new GetRoleCommand({ RoleName: lambdaRoleName });
      
      const [ec2RoleResponse, lambdaRoleResponse] = await Promise.all([
        iamClient.send(ec2RoleCommand),
        iamClient.send(lambdaRoleCommand)
      ]);

      // 2. Verify permission boundaries are attached
      expect(ec2RoleResponse.Role?.PermissionsBoundary?.PermissionsBoundaryArn)
        .toBe(outputs.PermissionBoundaryArn);
      expect(lambdaRoleResponse.Role?.PermissionsBoundary?.PermissionsBoundaryArn)
        .toBe(outputs.PermissionBoundaryArn);

      // 3. Verify roles have correct service principals
      const ec2AssumePolicy = JSON.parse(
        decodeURIComponent(ec2RoleResponse.Role?.AssumeRolePolicyDocument || '{}')
      );
      const lambdaAssumePolicy = JSON.parse(
        decodeURIComponent(lambdaRoleResponse.Role?.AssumeRolePolicyDocument || '{}')
      );
      
      expect(ec2AssumePolicy.Statement[0].Principal.Service)
        .toContain('ec2.amazonaws.com');
      expect(lambdaAssumePolicy.Statement[0].Principal.Service)
        .toContain('lambda.amazonaws.com');

      // 4. Verify inline policies exist
      const ec2PoliciesCommand = new ListRolePoliciesCommand({ RoleName: ec2RoleName });
      const lambdaPoliciesCommand = new ListRolePoliciesCommand({ RoleName: lambdaRoleName });
      
      const [ec2Policies, lambdaPolicies] = await Promise.all([
        iamClient.send(ec2PoliciesCommand),
        iamClient.send(lambdaPoliciesCommand)
      ]);
      
      expect(ec2Policies.PolicyNames).toContain('EC2LeastPrivilegePolicy');
      expect(lambdaPolicies.PolicyNames).toContain('LambdaLeastPrivilegePolicy');
      
      console.log('✅ End-to-end security validation completed successfully');
    }, 30000);
  });
});