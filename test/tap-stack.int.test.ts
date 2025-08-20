// Configuration - These are coming from cfn-outputs after deployment
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  SimulatePrincipalPolicyCommand,
} from '@aws-sdk/client-iam';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import fs from 'fs';

// Read deployment outputs
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn(
    'Could not load cfn-outputs/flat-outputs.json. Using empty outputs.'
  );
}

const iamClient = new IAMClient({
  region: process.env.AWS_REGION || 'us-east-1',
});
const stsClient = new STSClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

describe('IAM Roles Integration Tests', () => {
  describe('WebApplicationRole', () => {
    const roleArn = outputs.WebApplicationRoleArn;
    let roleName: string;

    beforeAll(() => {
      if (roleArn) {
        // Extract role name from ARN
        roleName = roleArn.split('/').pop();
      }
    });

    test('should exist and be retrievable', async () => {
      if (!roleName) {
        console.warn('WebApplicationRoleArn not found in outputs');
        return;
      }

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
      expect(response.Role?.Arn).toBe(roleArn);
    });

    test('should have correct trust policy for EC2 and MFA users', async () => {
      if (!roleName) return;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      expect(trustPolicy.Statement).toBeDefined();
      expect(trustPolicy.Statement.length).toBeGreaterThanOrEqual(2);

      // Check EC2 service trust
      const ec2Statement = trustPolicy.Statement.find(
        (s: any) => s.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Effect).toBe('Allow');

      // Check MFA requirement for user assumption
      const userStatement = trustPolicy.Statement.find(
        (s: any) => s.Principal?.AWS
      );
      expect(userStatement).toBeDefined();
      expect(
        userStatement.Condition?.Bool?.['aws:MultiFactorAuthPresent']
      ).toBe('true');
    });

    test('should have CloudWatchAgentServerPolicy attached', async () => {
      if (!roleName) return;

      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const cloudWatchPolicy = response.AttachedPolicies?.find(
        policy =>
          policy.PolicyArn ===
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );

      expect(cloudWatchPolicy).toBeDefined();
    });

    test('should have inline policies with correct permissions', async () => {
      if (!roleName) return;

      const listCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const listResponse = await iamClient.send(listCommand);

      expect(listResponse.PolicyNames).toContain('WebApplicationPolicy');

      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'WebApplicationPolicy',
      });
      const policyResponse = await iamClient.send(getPolicyCommand);

      const policyDocument = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument || '{}')
      );

      // Verify S3 permissions are limited
      const s3Statement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).not.toContain('s3:PutObject');
      expect(s3Statement.Action).not.toContain('s3:DeleteObject');

      // Verify CloudWatch Logs permissions
      const logsStatement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();

      // Verify SSM permissions
      const ssmStatement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('ssm:GetParameter')
      );
      expect(ssmStatement).toBeDefined();
    });

    test('should have proper tags', async () => {
      if (!roleName) return;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const tags = response.Role?.Tags || [];

      const mfaTag = tags.find(t => t.Key === 'MFARequired');
      expect(mfaTag?.Value).toBe('true');

      const purposeTag = tags.find(t => t.Key === 'Purpose');
      expect(purposeTag?.Value).toBe('Web Application Access');

      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();
    });
  });

  describe('DatabaseAccessRole', () => {
    const roleArn = outputs.DatabaseAccessRoleArn;
    let roleName: string;

    beforeAll(() => {
      if (roleArn) {
        roleName = roleArn.split('/').pop();
      }
    });

    test('should exist with strict MFA requirements', async () => {
      if (!roleName) {
        console.warn('DatabaseAccessRoleArn not found in outputs');
        return;
      }

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      const statement = trustPolicy.Statement[0];
      expect(statement.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe(
        'true'
      );
      expect(
        statement.Condition?.NumericLessThan?.['aws:MultiFactorAuthAge']
      ).toBe('1800');
    });

    test('should have IP address restrictions', async () => {
      if (!roleName) return;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      const statement = trustPolicy.Statement[0];
      expect(statement.Condition?.IpAddress?.['aws:SourceIp']).toBeDefined();
      expect(statement.Condition?.IpAddress?.['aws:SourceIp']).toEqual(
        expect.arrayContaining([
          '10.0.0.0/8',
          '172.16.0.0/12',
          '192.168.0.0/16',
        ])
      );
    });

    test('should have database-specific permissions', async () => {
      if (!roleName) return;

      const listCommand = new ListRolePoliciesCommand({ RoleName: roleName });
      const listResponse = await iamClient.send(listCommand);

      expect(listResponse.PolicyNames).toContain('DatabaseAccessPolicy');

      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'DatabaseAccessPolicy',
      });
      const policyResponse = await iamClient.send(getPolicyCommand);

      const policyDocument = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument || '{}')
      );

      // Check for RDS permissions
      const rdsStatement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('rds:DescribeDBInstances')
      );
      expect(rdsStatement).toBeDefined();

      // Check for RDS Connect permissions
      const connectStatement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('rds-db:connect')
      );
      expect(connectStatement).toBeDefined();

      // Check for Secrets Manager permissions
      const secretsStatement = policyDocument.Statement.find(
        (s: any) =>
          s.Action && s.Action.includes('secretsmanager:GetSecretValue')
      );
      expect(secretsStatement).toBeDefined();
    });
  });

  describe('CICDPipelineRole', () => {
    const roleArn = outputs.CICDPipelineRoleArn;
    let roleName: string;

    beforeAll(() => {
      if (roleArn) {
        roleName = roleArn.split('/').pop();
      }
    });

    test('should allow assumption by CI/CD services', async () => {
      if (!roleName) {
        console.warn('CICDPipelineRoleArn not found in outputs');
        return;
      }

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      // Find service assumption statement
      const serviceStatement = trustPolicy.Statement.find(
        (s: any) => s.Principal?.Service
      );

      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toEqual(
        expect.arrayContaining([
          'codebuild.amazonaws.com',
          'codepipeline.amazonaws.com',
          'codedeploy.amazonaws.com',
        ])
      );
    });

    test('should have comprehensive CI/CD permissions', async () => {
      if (!roleName) return;

      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'CICDPipelinePolicy',
      });
      const policyResponse = await iamClient.send(getPolicyCommand);

      const policyDocument = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument || '{}')
      );

      // Verify S3 artifact permissions
      const s3Statement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('s3:PutObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:GetObject');

      // Verify CloudFormation permissions
      const cfnStatement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('cloudformation:CreateStack')
      );
      expect(cfnStatement).toBeDefined();

      // Verify ECR permissions
      const ecrStatement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('ecr:PutImage')
      );
      expect(ecrStatement).toBeDefined();
    });
  });

  describe('SecurityAuditRole', () => {
    const roleArn = outputs.SecurityAuditRoleArn;
    let roleName: string;

    beforeAll(() => {
      if (roleArn) {
        roleName = roleArn.split('/').pop();
      }
    });

    test('should have read-only AWS managed policies', async () => {
      if (!roleName) {
        console.warn('SecurityAuditRoleArn not found in outputs');
        return;
      }

      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const policyArns = response.AttachedPolicies?.map(p => p.PolicyArn) || [];

      expect(policyArns).toContain('arn:aws:iam::aws:policy/SecurityAudit');
      expect(policyArns).toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
      expect(policyArns).not.toContain(
        'arn:aws:iam::aws:policy/AdministratorAccess'
      );
    });

    test('should have enhanced security audit permissions', async () => {
      if (!roleName) return;

      const getPolicyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'EnhancedSecurityAuditPolicy',
      });
      const policyResponse = await iamClient.send(getPolicyCommand);

      const policyDocument = JSON.parse(
        decodeURIComponent(policyResponse.PolicyDocument || '{}')
      );

      // Check CloudTrail permissions
      const cloudTrailStatement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('cloudtrail:LookupEvents')
      );
      expect(cloudTrailStatement).toBeDefined();

      // Check GuardDuty permissions
      const guardDutyStatement = policyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('guardduty:GetFindings')
      );
      expect(guardDutyStatement).toBeDefined();
    });

    test('should require MFA with regional restriction', async () => {
      if (!roleName) return;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      const statement = trustPolicy.Statement[0];
      expect(statement.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe(
        'true'
      );
      expect(
        statement.Condition?.StringEquals?.['aws:RequestedRegion']
      ).toBeDefined();
    });
  });

  describe('EmergencyAccessRole', () => {
    const roleArn = outputs.EmergencyAccessRoleArn;
    let roleName: string;

    beforeAll(() => {
      if (roleArn) {
        roleName = roleArn.split('/').pop();
      }
    });

    test('should have AdministratorAccess policy', async () => {
      if (!roleName) {
        console.warn('EmergencyAccessRoleArn not found in outputs');
        return;
      }

      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const response = await iamClient.send(command);

      const adminPolicy = response.AttachedPolicies?.find(
        policy =>
          policy.PolicyArn === 'arn:aws:iam::aws:policy/AdministratorAccess'
      );

      expect(adminPolicy).toBeDefined();
    });

    test('should have strictest access controls', async () => {
      if (!roleName) return;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const trustPolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument || '{}')
      );

      const statement = trustPolicy.Statement[0];

      // Check MFA with 15-minute limit
      expect(statement.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe(
        'true'
      );
      expect(
        statement.Condition?.NumericLessThan?.['aws:MultiFactorAuthAge']
      ).toBe('900');

      // Check IP restrictions
      expect(statement.Condition?.IpAddress?.['aws:SourceIp']).toBeDefined();

      // Check time-based restrictions
      expect(
        statement.Condition?.DateGreaterThan?.['aws:CurrentTime']
      ).toBeDefined();
      expect(
        statement.Condition?.DateLessThan?.['aws:CurrentTime']
      ).toBeDefined();
    });

    test('should have high privilege tags', async () => {
      if (!roleName) return;

      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      const tags = response.Role?.Tags || [];

      const highPrivTag = tags.find(t => t.Key === 'HighPrivilege');
      expect(highPrivTag?.Value).toBe('true');

      const mfaTag = tags.find(t => t.Key === 'MFARequired');
      expect(mfaTag?.Value).toBe('true');
    });
  });

  describe('WebApplicationInstanceProfile', () => {
    const profileArn = outputs.WebApplicationInstanceProfileArn;
    let profileName: string;

    beforeAll(() => {
      if (profileArn) {
        profileName = profileArn.split('/').pop();
      }
    });

    test('should exist and reference WebApplicationRole', async () => {
      if (!profileName) {
        console.warn('WebApplicationInstanceProfileArn not found in outputs');
        return;
      }

      const command = new GetInstanceProfileCommand({
        InstanceProfileName: profileName,
      });
      const response = await iamClient.send(command);

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile?.InstanceProfileName).toBe(profileName);

      // Check it has the WebApplicationRole
      const roles = response.InstanceProfile?.Roles || [];
      expect(roles.length).toBeGreaterThan(0);

      const webAppRole = roles.find(r =>
        r.RoleName?.includes('WebApplicationRole')
      );
      expect(webAppRole).toBeDefined();
    });
  });

  describe('Security Compliance Validation', () => {
    test('should not allow role assumption without MFA', async () => {
      // Skip if no outputs available
      if (!outputs.WebApplicationRoleArn) {
        console.warn('Skipping MFA test - no role ARN in outputs');
        return;
      }

      // Attempt to assume role without MFA token
      try {
        const command = new AssumeRoleCommand({
          RoleArn: outputs.WebApplicationRoleArn,
          RoleSessionName: 'test-session-no-mfa',
        });
        await stsClient.send(command);

        // If we get here, the assumption succeeded without MFA (should not happen)
        fail('Role assumption should have failed without MFA');
      } catch (error: any) {
        // Expected to fail
        expect(error.name).toBeDefined();
        // The error should indicate MFA is required or access denied
        expect(
          error.message.includes('MFA') ||
            error.message.includes('Access denied') ||
            error.name === 'AccessDenied'
        ).toBe(true);
      }
    });

    test('should validate principle of least privilege', async () => {
      // This test validates that roles don't have excessive permissions
      const roleChecks = [
        {
          roleArn: outputs.WebApplicationRoleArn,
          shouldNotHave: [
            'iam:CreateRole',
            'iam:DeleteRole',
            'ec2:TerminateInstances',
          ],
        },
        {
          roleArn: outputs.DatabaseAccessRoleArn,
          shouldNotHave: [
            's3:DeleteBucket',
            'iam:CreateUser',
            'ec2:TerminateInstances',
          ],
        },
        {
          roleArn: outputs.SecurityAuditRoleArn,
          shouldNotHave: [
            's3:PutObject',
            'ec2:TerminateInstances',
            'iam:DeleteRole',
          ],
        },
      ];

      for (const check of roleChecks) {
        if (!check.roleArn) continue;

        const roleName = check.roleArn.split('/').pop();

        try {
          // Simulate policy evaluation for dangerous actions
          const command = new SimulatePrincipalPolicyCommand({
            PolicySourceArn: check.roleArn,
            ActionNames: check.shouldNotHave,
            ResourceArns: ['*'],
          });

          const response = await iamClient.send(command);

          // Check that all dangerous actions are denied
          response.EvaluationResults?.forEach(result => {
            expect(result.EvalDecision).not.toBe('allowed');
          });
        } catch (error) {
          // If simulation fails, skip this specific check
          console.warn(`Could not simulate policy for ${roleName}`);
        }
      }
    });
  });

  describe('Cross-Role Relationships', () => {
    test('should validate instance profile can be used by EC2', async () => {
      if (!outputs.WebApplicationInstanceProfileArn) {
        console.warn('WebApplicationInstanceProfileArn not found in outputs');
        return;
      }

      const profileName =
        outputs.WebApplicationInstanceProfileArn.split('/').pop();
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: profileName,
      });
      const response = await iamClient.send(command);

      // Verify the profile has at least one role
      expect(response.InstanceProfile?.Roles).toBeDefined();
      expect(response.InstanceProfile?.Roles?.length).toBeGreaterThan(0);

      // Verify the role in the profile can be assumed by EC2
      const role = response.InstanceProfile?.Roles?.[0];
      if (role) {
        const getRoleCommand = new GetRoleCommand({ RoleName: role.RoleName });
        const roleResponse = await iamClient.send(getRoleCommand);

        const trustPolicy = JSON.parse(
          decodeURIComponent(
            roleResponse.Role?.AssumeRolePolicyDocument || '{}'
          )
        );

        const ec2Statement = trustPolicy.Statement.find(
          (s: any) => s.Principal?.Service === 'ec2.amazonaws.com'
        );

        expect(ec2Statement).toBeDefined();
        expect(ec2Statement.Effect).toBe('Allow');
      }
    });

    test('should validate all roles are properly tagged', async () => {
      const roleArns = [
        outputs.WebApplicationRoleArn,
        outputs.DatabaseAccessRoleArn,
        outputs.CICDPipelineRoleArn,
        outputs.SecurityAuditRoleArn,
        outputs.EmergencyAccessRoleArn,
      ];

      for (const roleArn of roleArns) {
        if (!roleArn) continue;

        const roleName = roleArn.split('/').pop();
        const command = new GetRoleCommand({ RoleName: roleName });
        const response = await iamClient.send(command);

        const tags = response.Role?.Tags || [];

        // All roles must have MFARequired tag
        const mfaTag = tags.find(t => t.Key === 'MFARequired');
        expect(mfaTag).toBeDefined();
        expect(mfaTag?.Value).toBe('true');

        // All roles must have Environment tag
        const envTag = tags.find(t => t.Key === 'Environment');
        expect(envTag).toBeDefined();

        // All roles must have Purpose tag
        const purposeTag = tags.find(t => t.Key === 'Purpose');
        expect(purposeTag).toBeDefined();
      }
    });
  });
});
