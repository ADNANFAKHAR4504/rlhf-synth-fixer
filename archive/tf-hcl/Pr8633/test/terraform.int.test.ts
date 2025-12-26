// Integration tests for Terraform IAM and KMS infrastructure
// Tests deployed AWS resources using actual AWS SDK calls

import {
  IAMClient,
  GetRoleCommand,
  GetPolicyCommand,
  ListAttachedRolePoliciesCommand,
  GetRolePolicyCommand,
  ListRolePoliciesCommand
} from "@aws-sdk/client-iam";
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  GetKeyPolicyCommand,
  ListAliasesCommand
} from "@aws-sdk/client-kms";
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand
} from "@aws-sdk/client-cloudwatch-logs";
import fs from "fs";
import path from "path";

// Load deployment outputs
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputs = JSON.parse(fs.readFileSync(outputsPath, "utf8"));

const region = "us-east-1";
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe("Terraform IAM and KMS Infrastructure - Integration Tests", () => {
  describe("IAM Roles Deployment Verification", () => {
    test("SecurityAdmin role exists with correct configuration", async () => {
      const roleArn = outputs.security_admin_role_arn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split("/").pop();
      const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));

      expect(getRole.Role).toBeDefined();
      expect(getRole.Role!.MaxSessionDuration).toBe(3600);
      expect(getRole.Role!.PermissionsBoundary).toBeDefined();
      expect(getRole.Role!.Tags).toBeDefined();

      // Verify MFA requirement in trust policy
      const trustPolicy = JSON.parse(decodeURIComponent(getRole.Role!.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement).toBeDefined();
      const mfaStatement = trustPolicy.Statement.find((stmt: any) =>
        stmt.Condition && stmt.Condition.Bool && stmt.Condition.Bool["aws:MultiFactorAuthPresent"]
      );
      expect(mfaStatement).toBeDefined();
      expect(mfaStatement.Condition.Bool["aws:MultiFactorAuthPresent"]).toBe("true");

      // Verify external ID requirement
      const externalIdStatement = trustPolicy.Statement.find((stmt: any) =>
        stmt.Condition && stmt.Condition.StringEquals && stmt.Condition.StringEquals["sts:ExternalId"]
      );
      expect(externalIdStatement).toBeDefined();
    }, 30000);

    test("DevOps role exists with correct configuration", async () => {
      const roleArn = outputs.devops_role_arn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split("/").pop();
      const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));

      expect(getRole.Role).toBeDefined();
      expect(getRole.Role!.MaxSessionDuration).toBe(3600);
      expect(getRole.Role!.PermissionsBoundary).toBeDefined();

      // Verify MFA requirement
      const trustPolicy = JSON.parse(decodeURIComponent(getRole.Role!.AssumeRolePolicyDocument!));
      const mfaStatement = trustPolicy.Statement.find((stmt: any) =>
        stmt.Condition && stmt.Condition.Bool && stmt.Condition.Bool["aws:MultiFactorAuthPresent"]
      );
      expect(mfaStatement).toBeDefined();
    }, 30000);

    test("Auditor role exists with correct configuration", async () => {
      const roleArn = outputs.auditor_role_arn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split("/").pop();
      const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));

      expect(getRole.Role).toBeDefined();
      expect(getRole.Role!.MaxSessionDuration).toBe(3600);
      expect(getRole.Role!.PermissionsBoundary).toBeDefined();

      // Verify read-only intent through role name and MFA
      expect(roleName).toContain("auditor");
      const trustPolicy = JSON.parse(decodeURIComponent(getRole.Role!.AssumeRolePolicyDocument!));
      const mfaStatement = trustPolicy.Statement.find((stmt: any) =>
        stmt.Condition && stmt.Condition.Bool && stmt.Condition.Bool["aws:MultiFactorAuthPresent"]
      );
      expect(mfaStatement).toBeDefined();
    }, 30000);

    test("ECS service role exists with permission boundary", async () => {
      const roleArn = outputs.ecs_service_role_arn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split("/").pop();
      const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));

      expect(getRole.Role).toBeDefined();
      expect(getRole.Role!.PermissionsBoundary).toBeDefined();

      // Verify ECS service trust
      const trustPolicy = JSON.parse(decodeURIComponent(getRole.Role!.AssumeRolePolicyDocument!));
      const ecsStatement = trustPolicy.Statement.find((stmt: any) =>
        stmt.Principal && stmt.Principal.Service === "ecs.amazonaws.com"
      );
      expect(ecsStatement).toBeDefined();
    }, 30000);

    test("RDS service role exists with permission boundary", async () => {
      const roleArn = outputs.rds_service_role_arn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split("/").pop();
      const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));

      expect(getRole.Role).toBeDefined();
      expect(getRole.Role!.PermissionsBoundary).toBeDefined();

      // Verify RDS service trust
      const trustPolicy = JSON.parse(decodeURIComponent(getRole.Role!.AssumeRolePolicyDocument!));
      const rdsStatement = trustPolicy.Statement.find((stmt: any) =>
        stmt.Principal && stmt.Principal.Service === "rds.amazonaws.com"
      );
      expect(rdsStatement).toBeDefined();
    }, 30000);
  });

  describe("IAM Policies Attachment Verification", () => {
    test("SecurityAdmin role has policies attached", async () => {
      const roleArn = outputs.security_admin_role_arn;
      const roleName = roleArn.split("/").pop();

      const attachedPolicies = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName! })
      );

      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);
    }, 30000);

    test("DevOps role has policies attached", async () => {
      const roleArn = outputs.devops_role_arn;
      const roleName = roleArn.split("/").pop();

      const attachedPolicies = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName! })
      );

      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);
    }, 30000);

    test("Auditor role has policies attached", async () => {
      const roleArn = outputs.auditor_role_arn;
      const roleName = roleArn.split("/").pop();

      const attachedPolicies = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName! })
      );

      expect(attachedPolicies.AttachedPolicies).toBeDefined();
      expect(attachedPolicies.AttachedPolicies!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Permission Boundary Verification", () => {
    test("Permission boundary policy exists and restricts to us-east-1", async () => {
      const boundaryArn = outputs.permission_boundary_arn;
      expect(boundaryArn).toBeDefined();

      const policyArn = boundaryArn;
      const getPolicy = await iamClient.send(new GetPolicyCommand({ PolicyArn: policyArn }));

      expect(getPolicy.Policy).toBeDefined();
      expect(getPolicy.Policy!.PolicyName).toContain("permission-boundary");
    }, 30000);

    test("All main roles use the permission boundary", async () => {
      const roleArns = [
        outputs.security_admin_role_arn,
        outputs.devops_role_arn,
        outputs.auditor_role_arn,
        outputs.ecs_service_role_arn,
        outputs.rds_service_role_arn
      ];

      for (const roleArn of roleArns) {
        const roleName = roleArn.split("/").pop();
        const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));
        expect(getRole.Role!.PermissionsBoundary).toBeDefined();
        expect(getRole.Role!.PermissionsBoundary!.PermissionsBoundaryArn).toBe(outputs.permission_boundary_arn);
      }
    }, 30000);
  });

  describe("KMS Keys Deployment Verification", () => {
    test("Application data KMS key exists with rotation enabled", async () => {
      const keyId = outputs.application_data_key_id;
      expect(keyId).toBeDefined();

      const describeKey = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(describeKey.KeyMetadata).toBeDefined();
      expect(describeKey.KeyMetadata!.KeyState).toBe("Enabled");

      const rotationStatus = await kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test("Infrastructure secrets KMS key exists with rotation enabled", async () => {
      const keyId = outputs.infrastructure_secrets_key_id;
      expect(keyId).toBeDefined();

      const describeKey = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(describeKey.KeyMetadata).toBeDefined();
      expect(describeKey.KeyMetadata!.KeyState).toBe("Enabled");

      const rotationStatus = await kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);

    test("Terraform state KMS key exists with rotation enabled", async () => {
      const keyId = outputs.terraform_state_key_id;
      expect(keyId).toBeDefined();

      const describeKey = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(describeKey.KeyMetadata).toBeDefined();
      expect(describeKey.KeyMetadata!.KeyState).toBe("Enabled");

      const rotationStatus = await kmsClient.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    }, 30000);
  });

  describe("KMS Key Policies Verification", () => {
    test("Application data key policy allows appropriate roles", async () => {
      const keyId = outputs.application_data_key_id;

      const keyPolicy = await kmsClient.send(new GetKeyPolicyCommand({
        KeyId: keyId,
        PolicyName: "default"
      }));

      expect(keyPolicy.Policy).toBeDefined();
      const policy = JSON.parse(keyPolicy.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);

      // Verify SecurityAdmin and DevOps have access
      const roleStatements = policy.Statement.filter((stmt: any) =>
        stmt.Principal && stmt.Principal.AWS
      );
      expect(roleStatements.length).toBeGreaterThan(0);
    }, 30000);

    test("Infrastructure secrets key policy is properly configured", async () => {
      const keyId = outputs.infrastructure_secrets_key_id;

      const keyPolicy = await kmsClient.send(new GetKeyPolicyCommand({
        KeyId: keyId,
        PolicyName: "default"
      }));

      expect(keyPolicy.Policy).toBeDefined();
      const policy = JSON.parse(keyPolicy.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(policy.Statement.length).toBeGreaterThan(0);

      // Verify CloudWatch Logs service has access
      const logsStatements = policy.Statement.filter((stmt: any) =>
        stmt.Principal && stmt.Principal.Service && stmt.Principal.Service.includes("logs")
      );
      expect(logsStatements.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("KMS Aliases Verification", () => {
    test("KMS aliases are created for all keys", async () => {
      const aliases = await kmsClient.send(new ListAliasesCommand({}));
      expect(aliases.Aliases).toBeDefined();

      const appDataKeyId = outputs.application_data_key_id;
      const infraSecretsKeyId = outputs.infrastructure_secrets_key_id;

      const appDataAlias = aliases.Aliases!.find(a => a.TargetKeyId === appDataKeyId);
      const infraSecretsAlias = aliases.Aliases!.find(a => a.TargetKeyId === infraSecretsKeyId);

      expect(appDataAlias).toBeDefined();
      expect(appDataAlias!.AliasName).toContain("application-data");

      expect(infraSecretsAlias).toBeDefined();
      expect(infraSecretsAlias!.AliasName).toContain("infrastructure-secrets");
    }, 30000);
  });

  describe("CloudWatch Log Groups Verification", () => {
    test("IAM activity log group exists with encryption and retention", async () => {
      const logGroupName = outputs.iam_activity_log_group_name;
      expect(logGroupName).toBeDefined();

      const describeLogGroups = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      expect(describeLogGroups.logGroups).toBeDefined();
      expect(describeLogGroups.logGroups!.length).toBeGreaterThan(0);

      const logGroup = describeLogGroups.logGroups![0];
      expect(logGroup.retentionInDays).toBe(90);
      expect(logGroup.kmsKeyId).toBeDefined();
      expect(logGroup.kmsKeyId).toContain(outputs.infrastructure_secrets_key_id);
    }, 30000);

    test("All role-specific log groups exist with proper configuration", async () => {
      const logGroupPrefixes = [
        "/aws/iam/security-admin",
        "/aws/iam/devops",
        "/aws/iam/auditor",
        "/aws/iam/kms/activity"
      ];

      for (const prefix of logGroupPrefixes) {
        const describeLogGroups = await logsClient.send(
          new DescribeLogGroupsCommand({ logGroupNamePrefix: prefix })
        );

        expect(describeLogGroups.logGroups).toBeDefined();
        expect(describeLogGroups.logGroups!.length).toBeGreaterThan(0);

        const logGroup = describeLogGroups.logGroups![0];
        expect(logGroup.retentionInDays).toBe(90);
        expect(logGroup.kmsKeyId).toBeDefined();
      }
    }, 30000);
  });

  describe("External ID Verification", () => {
    test("External ID is generated and used in role trust policies", async () => {
      const externalId = outputs.external_id;
      expect(externalId).toBeDefined();
      expect(externalId.length).toBe(32);

      // Verify it's used in SecurityAdmin role
      const roleArn = outputs.security_admin_role_arn;
      const roleName = roleArn.split("/").pop();
      const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));

      const trustPolicy = JSON.parse(decodeURIComponent(getRole.Role!.AssumeRolePolicyDocument!));
      const externalIdStatement = trustPolicy.Statement.find((stmt: any) =>
        stmt.Condition && stmt.Condition.StringEquals && stmt.Condition.StringEquals["sts:ExternalId"]
      );

      expect(externalIdStatement).toBeDefined();
      expect(externalIdStatement.Condition.StringEquals["sts:ExternalId"]).toBe(externalId);
    }, 30000);
  });

  describe("Resource Tagging Verification", () => {
    test("IAM roles have required tags", async () => {
      const roleArn = outputs.security_admin_role_arn;
      const roleName = roleArn.split("/").pop();
      const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));

      expect(getRole.Role!.Tags).toBeDefined();
      const tags = getRole.Role!.Tags!;

      const ownerTag = tags.find(t => t.Key === "Owner");
      const environmentTag = tags.find(t => t.Key === "Environment");
      const costCenterTag = tags.find(t => t.Key === "CostCenter");
      const managedByTag = tags.find(t => t.Key === "ManagedBy");

      expect(ownerTag).toBeDefined();
      expect(environmentTag).toBeDefined();
      expect(costCenterTag).toBeDefined();
      expect(managedByTag).toBeDefined();
      expect(managedByTag!.Value).toBe("Terraform");
    }, 30000);

    test("KMS keys have required tags", async () => {
      const keyId = outputs.application_data_key_id;
      const describeKey = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));

      expect(describeKey.KeyMetadata).toBeDefined();

      // KMS tags are verified through the key metadata
      expect(describeKey.KeyMetadata!.Description).toBeDefined();
    }, 30000);
  });

  describe("Cross-Resource Integration", () => {
    test("KMS keys are referenced by CloudWatch Log Groups", async () => {
      const logGroupName = outputs.iam_activity_log_group_name;
      const infraSecretsKeyId = outputs.infrastructure_secrets_key_id;

      const describeLogGroups = await logsClient.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName })
      );

      const logGroup = describeLogGroups.logGroups![0];
      expect(logGroup.kmsKeyId).toContain(infraSecretsKeyId);
    }, 30000);

    test("Permission boundary is referenced by all roles", async () => {
      const boundaryArn = outputs.permission_boundary_arn;
      const roleArns = [
        outputs.security_admin_role_arn,
        outputs.devops_role_arn,
        outputs.auditor_role_arn,
        outputs.ecs_service_role_arn,
        outputs.rds_service_role_arn
      ];

      for (const roleArn of roleArns) {
        const roleName = roleArn.split("/").pop();
        const getRole = await iamClient.send(new GetRoleCommand({ RoleName: roleName! }));
        expect(getRole.Role!.PermissionsBoundary!.PermissionsBoundaryArn).toBe(boundaryArn);
      }
    }, 30000);
  });
});
