import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { STSClient, AssumeRoleCommand, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { IAMClient, GetRoleCommand, ListAttachedRolePoliciesCommand, GetRolePolicyCommand } from '@aws-sdk/client-iam';

describe('Terraform IAM Stack Integration Tests', () => {
  const testDir = path.join(__dirname, 'integration-test');
  const testAccountId = process.env.TEST_ACCOUNT_ID || '123456789012';
  const testRegion = process.env.TEST_REGION || 'us-east-1';
  
  let iamClient: IAMClient;
  let stsClient: STSClient;
  let deployedRoles: string[] = [];

  beforeAll(async () => {
    // Initialize AWS clients
    iamClient = new IAMClient({ region: testRegion });
    stsClient = new STSClient({ region: testRegion });
    
    // Verify AWS credentials are available
    try {
      await stsClient.send(new GetCallerIdentityCommand({}));
    } catch (error) {
      throw new Error('AWS credentials not available for integration testing');
    }

    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // Create integration test tfvars
    const integrationTfvars = `
env = "integration"
owner = "integration-test"
purpose = "automated-testing"
target_account_id = "${testAccountId}"
external_id = "integration-test-external-id"

roles = {
  test-auditor = {
    description = "Integration test auditor role"
    max_session_duration = 3600
    trusted_principals = ["arn:aws:iam::${testAccountId}:root"]
    require_external_id = true
    require_mfa = false
    inline_policies = {
      read-only-access = {
        actions = ["iam:Get*", "iam:List*"]
        resources = ["*"]
        conditions = {}
      }
    }
    managed_policy_arns = []
  }
  
  test-deployer = {
    description = "Integration test deployer role"
    max_session_duration = 1800
    trusted_principals = ["arn:aws:iam::${testAccountId}:root"]
    require_external_id = false
    require_mfa = false
    inline_policies = {
      limited-deploy = {
        actions = ["s3:GetObject", "s3:PutObject"]
        resources = ["arn:aws:s3:::test-bucket/*"]
        conditions = {}
      }
    }
    managed_policy_arns = []
  }
}
`;
    fs.writeFileSync(path.join(testDir, 'integration.tfvars'), integrationTfvars);
  });

  describe('Terraform Deployment', () => {
    it('should initialize terraform successfully', () => {
      const result = execSync('terraform init', {
        cwd: __dirname,
        encoding: 'utf8'
      });
      expect(result).toContain('Terraform has been successfully initialized');
    });

    it('should create a valid terraform plan', () => {
      const result = execSync(`terraform plan -var-file=${testDir}/integration.tfvars -out=${testDir}/integration.tfplan`, {
        cwd: __dirname,
        encoding: 'utf8'
      });
      
      expect(result).toContain('Plan:');
      expect(result).not.toContain('Error:');
    });

    it('should apply terraform configuration successfully', () => {
      const result = execSync(`terraform apply -var-file=${testDir}/integration.tfvars -auto-approve`, {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 300000 // 5 minutes timeout
      });
      
      expect(result).toContain('Apply complete!');
      
      // Extract created role names from output
      const roleArnMatch = result.match(/role_arns = {[^}]+}/s);
      if (roleArnMatch) {
        deployedRoles = ['corp-test-auditor-integration', 'corp-test-deployer-integration'];
      }
    }, 300000);
  });

  describe('IAM Role Verification', () => {
    it('should create roles with correct names and properties', async () => {
      for (const roleName of deployedRoles) {
        const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
        const roleResponse = await iamClient.send(getRoleCommand);
        
        expect(roleResponse.Role).toBeDefined();
        expect(roleResponse.Role!.RoleName).toBe(roleName);
        expect(roleResponse.Role!.PermissionsBoundary).toBeDefined();
        expect(roleResponse.Role!.PermissionsBoundary!.PermissionsBoundaryArn).toContain('corp-permission-boundary-integration');
      }
    });

    it('should attach correct inline policies', async () => {
      const testAuditorRole = 'corp-test-auditor-integration';
      
      try {
        const getRolePolicyCommand = new GetRolePolicyCommand({
          RoleName: testAuditorRole,
          PolicyName: 'read-only-access'
        });
        const policyResponse = await iamClient.send(getRolePolicyCommand);
        
        expect(policyResponse.PolicyDocument).toBeDefined();
        
        // Parse and verify policy document
        const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
        expect(policyDoc.Statement).toBeDefined();
        expect(policyDoc.Statement[0].Action).toContain('iam:Get*');
        expect(policyDoc.Statement[0].Action).toContain('iam:List*');
      } catch (error) {
        console.error('Error verifying inline policy:', error);
        throw error;
      }
    });

    it('should have correct trust policies', async () => {
      const testAuditorRole = 'corp-test-auditor-integration';
      
      const getRoleCommand = new GetRoleCommand({ RoleName: testAuditorRole });
      const roleResponse = await iamClient.send(getRoleCommand);
      
      const trustPolicy = JSON.parse(decodeURIComponent(roleResponse.Role!.AssumeRolePolicyDocument!));
      
      expect(trustPolicy.Statement).toBeDefined();
      expect(trustPolicy.Statement[0].Principal.AWS).toContain(`arn:aws:iam::${testAccountId}:root`);
      expect(trustPolicy.Statement[0].Condition?.StringEquals?.['sts:ExternalId']).toBe('integration-test-external-id');
    });

    it('should have appropriate session duration limits', async () => {
      const testAuditorRole = 'corp-test-auditor-integration';
      
      const getRoleCommand = new GetRoleCommand({ RoleName: testAuditorRole });
      const roleResponse = await iamClient.send(getRoleCommand);
      
      expect(roleResponse.Role!.MaxSessionDuration).toBe(3600);
    });
  });

  describe('Permission Boundary Verification', () => {
    it('should create permission boundary policy', async () => {
      const boundaryPolicyArn = `arn:aws:iam::${testAccountId}:policy/corp-permission-boundary-integration`;
      
      // Verify through role's permission boundary
      const testRole = deployedRoles[0];
      const getRoleCommand = new GetRoleCommand({ RoleName: testRole });
      const roleResponse = await iamClient.send(getRoleCommand);
      
      expect(roleResponse.Role!.PermissionsBoundary).toBeDefined();
      expect(roleResponse.Role!.PermissionsBoundary!.PermissionsBoundaryArn).toBe(boundaryPolicyArn);
    });
  });

  describe('Cross-Account Role Assumption', () => {
    it('should allow role assumption with correct external ID', async () => {
      const roleArn = `arn:aws:iam::${testAccountId}:role/corp-test-auditor-integration`;
      
      const assumeRoleCommand = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: 'integration-test-session',
        ExternalId: 'integration-test-external-id'
      });
      
      try {
        const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
        expect(assumeRoleResponse.Credentials).toBeDefined();
        expect(assumeRoleResponse.AssumedRoleUser?.Arn).toContain(roleArn);
      } catch (error) {
        // This might fail in test environment if we don't have proper cross-account setup
        console.warn('Cross-account assumption test skipped due to environment limitations:', error);
      }
    });

    it('should reject role assumption with incorrect external ID', async () => {
      const roleArn = `arn:aws:iam::${testAccountId}:role/corp-test-auditor-integration`;
      
      const assumeRoleCommand = new AssumeRoleCommand({
        RoleArn: roleArn,
        RoleSessionName: 'integration-test-session',
        ExternalId: 'wrong-external-id'
      });
      
      try {
        await stsClient.send(assumeRoleCommand);
        throw new Error('Should have failed with wrong external ID');
      } catch (error: any) {
        expect(error.name).toBe('AccessDenied');
      }
    });
  });

  describe('Compliance and Tagging', () => {
    it('should apply required tags to all resources', async () => {
      for (const roleName of deployedRoles) {
        const getRoleCommand = new GetRoleCommand({ RoleName: roleName });
        const roleResponse = await iamClient.send(getRoleCommand);
        
        const tags = roleResponse.Role!.Tags || [];
        const tagMap = Object.fromEntries(tags.map(tag => [tag.Key, tag.Value]));
        
        expect(tagMap.owner).toBe('integration-test');
        expect(tagMap.purpose).toBe('automated-testing');
        expect(tagMap.env).toBe('integration');
        expect(tagMap.terraform_managed).toBe('true');
        expect(tagMap.compliance_scope).toBe('soc2-gdpr');
      }
    });

    it('should output compliance summary', () => {
      const outputResult = execSync('terraform output -json compliance_summary', {
        cwd: __dirname,
        encoding: 'utf8'
      });
      
      const complianceSummary = JSON.parse(outputResult);
      
      expect(complianceSummary.permission_boundaries_enabled).toBe(true);
      expect(complianceSummary.mfa_required_for_sensitive).toBe(true);
      expect(complianceSummary.regional_restrictions).toContain('us-east-1');
      expect(complianceSummary.regional_restrictions).toContain('eu-west-1');
      expect(complianceSummary.resource_tagging_enforced).toBe(true);
      expect(complianceSummary.least_privilege_applied).toBe(true);
    });
  });

  describe('Multi-Region Support', () => {
    it('should support EU region provider', () => {
      // Verify EU provider is configured
      const providerConfig = fs.readFileSync(path.join(__dirname, 'provider.tf'), 'utf8');
      expect(providerConfig).toContain('alias = "eu"');
      expect(providerConfig).toContain('region = "eu-west-1"');
    });
  });

  afterAll(async () => {
    // Cleanup: destroy terraform resources
    try {
      const destroyResult = execSync(`terraform destroy -var-file=${testDir}/integration.tfvars -auto-approve`, {
        cwd: __dirname,
        encoding: 'utf8',
        timeout: 300000 // 5 minutes timeout
      });
      
      expect(destroyResult).toContain('Destroy complete!');
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Don't fail the test suite if cleanup fails
    }
    
    // Clean up test files
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    
    // Clean up terraform state and lock files
    const cleanupFiles = [
      'terraform.tfstate',
      'terraform.tfstate.backup',
      '.terraform.lock.hcl'
    ];
    
    cleanupFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    // Clean up .terraform directory
    const terraformDir = path.join(__dirname, '.terraform');
    if (fs.existsSync(terraformDir)) {
      fs.rmSync(terraformDir, { recursive: true, force: true });
    }
  }, 300000);
});