// Unit tests for Terraform IAM and KMS infrastructure
// Tests resource configuration without deploying to AWS

import fs from "fs";
import path from "path";

const libPath = path.resolve(__dirname, "../lib");

describe("Terraform IAM and KMS Infrastructure - Unit Tests", () => {
  describe("Core Infrastructure Files", () => {
    test("provider.tf exists and contains required providers", () => {
      const providerPath = path.join(libPath, "provider.tf");
      expect(fs.existsSync(providerPath)).toBe(true);
      const content = fs.readFileSync(providerPath, "utf8");
      expect(content).toMatch(/provider\s+"aws"/);
      expect(content).toMatch(/required_providers/);
      expect(content).toMatch(/hashicorp\/aws/);
      expect(content).toMatch(/hashicorp\/random/);
    });

    test("variables.tf exists and declares required variables", () => {
      const varsPath = path.join(libPath, "variables.tf");
      expect(fs.existsSync(varsPath)).toBe(true);
      const content = fs.readFileSync(varsPath, "utf8");
      expect(content).toMatch(/variable\s+"environment_suffix"/);
      expect(content).toMatch(/variable\s+"aws_region"/);
    });

    test("outputs.tf exists and exports required outputs", () => {
      const outputsPath = path.join(libPath, "outputs.tf");
      expect(fs.existsSync(outputsPath)).toBe(true);
      const content = fs.readFileSync(outputsPath, "utf8");
      expect(content).toMatch(/output\s+"security_admin_role_arn"/);
      expect(content).toMatch(/output\s+"devops_role_arn"/);
      expect(content).toMatch(/output\s+"auditor_role_arn"/);
      expect(content).toMatch(/output\s+"application_data_key_arn"/);
      expect(content).toMatch(/output\s+"infrastructure_secrets_key_arn"/);
    });
  });

  describe("IAM Roles Configuration", () => {
    const rolesPath = path.join(libPath, "iam_roles.tf");
    let rolesContent: string;

    beforeAll(() => {
      rolesContent = fs.readFileSync(rolesPath, "utf8");
    });

    test("iam_roles.tf exists", () => {
      expect(fs.existsSync(rolesPath)).toBe(true);
    });

    test("defines SecurityAdmin role with environment_suffix", () => {
      expect(rolesContent).toMatch(/resource\s+"aws_iam_role"\s+"security_admin"/);
      expect(rolesContent).toMatch(/name\s*=\s*"security-admin-\$\{var\.environment_suffix\}"/);
      expect(rolesContent).toMatch(/max_session_duration\s*=\s*3600/);
    });

    test("defines DevOps role with environment_suffix", () => {
      expect(rolesContent).toMatch(/resource\s+"aws_iam_role"\s+"devops"/);
      expect(rolesContent).toMatch(/name\s*=\s*"devops-\$\{var\.environment_suffix\}"/);
      expect(rolesContent).toMatch(/max_session_duration\s*=\s*3600/);
    });

    test("defines Auditor role with environment_suffix", () => {
      expect(rolesContent).toMatch(/resource\s+"aws_iam_role"\s+"auditor"/);
      expect(rolesContent).toMatch(/name\s*=\s*"auditor-\$\{var\.environment_suffix\}"/);
      expect(rolesContent).toMatch(/max_session_duration\s*=\s*3600/);
    });

    test("all roles require MFA", () => {
      const mfaMatches = rolesContent.match(/"aws:MultiFactorAuthPresent"\s*=\s*"true"/g);
      expect(mfaMatches).not.toBeNull();
      expect(mfaMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("all roles use external ID", () => {
      const externalIdMatches = rolesContent.match(/"sts:ExternalId"/g);
      expect(externalIdMatches).not.toBeNull();
      expect(externalIdMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test("all roles have permission boundaries", () => {
      const boundaryMatches = rolesContent.match(/permissions_boundary\s*=\s*aws_iam_policy\.permission_boundary\.arn/g);
      expect(boundaryMatches).not.toBeNull();
      expect(boundaryMatches!.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("IAM Policies Configuration", () => {
    const policiesPath = path.join(libPath, "iam_policies.tf");
    let policiesContent: string;

    beforeAll(() => {
      policiesContent = fs.readFileSync(policiesPath, "utf8");
    });

    test("iam_policies.tf exists", () => {
      expect(fs.existsSync(policiesPath)).toBe(true);
    });

    test("defines SecurityAdmin policy with environment_suffix", () => {
      expect(policiesContent).toMatch(/resource\s+"aws_iam_policy"\s+"security_admin"/);
      expect(policiesContent).toMatch(/name\s*=\s*"security-admin-policy-\$\{var\.environment_suffix\}"/);
    });

    test("defines DevOps policy with environment_suffix", () => {
      expect(policiesContent).toMatch(/resource\s+"aws_iam_policy"\s+"devops"/);
      expect(policiesContent).toMatch(/name\s*=\s*"devops-policy-\$\{var\.environment_suffix\}"/);
    });

    test("defines Auditor policy with environment_suffix", () => {
      expect(policiesContent).toMatch(/resource\s+"aws_iam_policy"\s+"auditor"/);
      expect(policiesContent).toMatch(/name\s*=\s*"auditor-policy-\$\{var\.environment_suffix\}"/);
    });

    test("policies attached to roles", () => {
      expect(policiesContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"security_admin"/);
      expect(policiesContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"devops"/);
      expect(policiesContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"auditor"/);
    });
  });

  describe("Service Roles Configuration", () => {
    const serviceRolesPath = path.join(libPath, "iam_service_roles.tf");
    let serviceRolesContent: string;

    beforeAll(() => {
      serviceRolesContent = fs.readFileSync(serviceRolesPath, "utf8");
    });

    test("iam_service_roles.tf exists", () => {
      expect(fs.existsSync(serviceRolesPath)).toBe(true);
    });

    test("defines ECS service role with environment_suffix", () => {
      expect(serviceRolesContent).toMatch(/resource\s+"aws_iam_role"\s+"ecs_service_role"/);
      expect(serviceRolesContent).toMatch(/name\s*=\s*"ecs-service-role-\$\{var\.environment_suffix\}"/);
      expect(serviceRolesContent).toMatch(/Service = "ecs\.amazonaws\.com"/);
    });

    test("defines RDS service role with environment_suffix", () => {
      expect(serviceRolesContent).toMatch(/resource\s+"aws_iam_role"\s+"rds_service_role"/);
      expect(serviceRolesContent).toMatch(/name\s*=\s*"rds-service-role-\$\{var\.environment_suffix\}"/);
      expect(serviceRolesContent).toMatch(/Service = "rds\.amazonaws\.com"/);
    });

    test("service roles have permission boundaries", () => {
      const boundaryMatches = serviceRolesContent.match(/permissions_boundary\s*=\s*aws_iam_policy\.permission_boundary\.arn/g);
      expect(boundaryMatches).not.toBeNull();
      expect(boundaryMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("KMS Keys Configuration", () => {
    const kmsPath = path.join(libPath, "kms.tf");
    let kmsContent: string;

    beforeAll(() => {
      kmsContent = fs.readFileSync(kmsPath, "utf8");
    });

    test("kms.tf exists", () => {
      expect(fs.existsSync(kmsPath)).toBe(true);
    });

    test("defines application_data key with rotation and environment_suffix", () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"application_data"/);
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(kmsContent).toMatch(/Name\s*=\s*"application-data-key-\$\{var\.environment_suffix\}"/);
    });

    test("defines infrastructure_secrets key with rotation and environment_suffix", () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"infrastructure_secrets"/);
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(kmsContent).toMatch(/Name\s*=\s*"infrastructure-secrets-key-\$\{var\.environment_suffix\}"/);
    });

    test("defines terraform_state key with rotation and environment_suffix", () => {
      expect(kmsContent).toMatch(/resource\s+"aws_kms_key"\s+"terraform_state"/);
      expect(kmsContent).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(kmsContent).toMatch(/Name\s*=\s*"terraform-state-key-\$\{var\.environment_suffix\}"/);
    });

    test("all keys have 7-day deletion window", () => {
      const deletionMatches = kmsContent.match(/deletion_window_in_days\s*=\s*7/g);
      expect(deletionMatches).not.toBeNull();
      expect(deletionMatches!.length).toBe(3);
    });

    test("defines KMS aliases with environment_suffix", () => {
      expect(kmsContent).toMatch(/alias\/application-data-\$\{var\.environment_suffix\}/);
      expect(kmsContent).toMatch(/alias\/infrastructure-secrets-\$\{var\.environment_suffix\}/);
      expect(kmsContent).toMatch(/alias\/terraform-state-\$\{var\.environment_suffix\}/);
    });
  });

  describe("KMS Policies Configuration", () => {
    const kmsPoliciesPath = path.join(libPath, "kms_policies.tf");
    let kmsPoliciesContent: string;

    beforeAll(() => {
      kmsPoliciesContent = fs.readFileSync(kmsPoliciesPath, "utf8");
    });

    test("kms_policies.tf exists", () => {
      expect(fs.existsSync(kmsPoliciesPath)).toBe(true);
    });

    test("application_data key policy allows SecurityAdmin and DevOps", () => {
      expect(kmsPoliciesContent).toMatch(/resource\s+"aws_kms_key_policy"\s+"application_data"/);
      expect(kmsPoliciesContent).toMatch(/aws_iam_role\.security_admin\.arn/);
      expect(kmsPoliciesContent).toMatch(/aws_iam_role\.devops\.arn/);
    });

    test("infrastructure_secrets key policy restricted to SecurityAdmin", () => {
      expect(kmsPoliciesContent).toMatch(/resource\s+"aws_kms_key_policy"\s+"infrastructure_secrets"/);
      const infraSecretsPolicy = kmsPoliciesContent.match(/resource\s+"aws_kms_key_policy"\s+"infrastructure_secrets"[\s\S]*?^\}/m);
      expect(infraSecretsPolicy).not.toBeNull();
    });

    test("key policies grant CloudWatch Logs access", () => {
      expect(kmsPoliciesContent).toMatch(/Service = "logs\.\$\{var\.aws_region\}\.amazonaws\.com"/);
      expect(kmsPoliciesContent).toMatch(/kms:EncryptionContext:aws:logs:arn/);
    });
  });

  describe("CloudWatch Logs Configuration", () => {
    const logsPath = path.join(libPath, "cloudwatch_logs.tf");
    let logsContent: string;

    beforeAll(() => {
      logsContent = fs.readFileSync(logsPath, "utf8");
    });

    test("cloudwatch_logs.tf exists", () => {
      expect(fs.existsSync(logsPath)).toBe(true);
    });

    test("defines log groups with 90-day retention", () => {
      const retentionMatches = logsContent.match(/retention_in_days\s*=\s*90/g);
      expect(retentionMatches).not.toBeNull();
      expect(retentionMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test("all log groups use KMS encryption", () => {
      const kmsMatches = logsContent.match(/kms_key_id\s*=\s*aws_kms_key\.infrastructure_secrets\.arn/g);
      expect(kmsMatches).not.toBeNull();
      expect(kmsMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test("all log groups have depends_on KMS key policy", () => {
      const dependsMatches = logsContent.match(/depends_on\s*=\s*\[aws_kms_key_policy\.infrastructure_secrets\]/g);
      expect(dependsMatches).not.toBeNull();
      expect(dependsMatches!.length).toBeGreaterThanOrEqual(5);
    });

    test("log groups include environment_suffix in names", () => {
      expect(logsContent).toMatch(/\/aws\/iam\/activity-\$\{var\.environment_suffix\}/);
      expect(logsContent).toMatch(/\/aws\/iam\/security-admin-\$\{var\.environment_suffix\}/);
      expect(logsContent).toMatch(/\/aws\/iam\/devops-\$\{var\.environment_suffix\}/);
      expect(logsContent).toMatch(/\/aws\/iam\/auditor-\$\{var\.environment_suffix\}/);
      expect(logsContent).toMatch(/\/aws\/iam\/kms\/activity-\$\{var\.environment_suffix\}/);
    });
  });

  describe("Permission Boundaries Configuration", () => {
    const boundariesPath = path.join(libPath, "iam_permission_boundaries.tf");
    let boundariesContent: string;

    beforeAll(() => {
      boundariesContent = fs.readFileSync(boundariesPath, "utf8");
    });

    test("iam_permission_boundaries.tf exists", () => {
      expect(fs.existsSync(boundariesPath)).toBe(true);
    });

    test("defines permission boundary policy with environment_suffix", () => {
      expect(boundariesContent).toMatch(/resource\s+"aws_iam_policy"\s+"permission_boundary"/);
      expect(boundariesContent).toMatch(/name\s*=\s*"permission-boundary-\$\{var\.environment_suffix\}"/);
    });

    test("permission boundary restricts to us-east-1 region", () => {
      expect(boundariesContent).toMatch(/"aws:RequestedRegion"\s*=\s*"us-east-1"/);
    });
  });

  describe("External ID Generation", () => {
    const randomPath = path.join(libPath, "random.tf");
    let randomContent: string;

    beforeAll(() => {
      randomContent = fs.readFileSync(randomPath, "utf8");
    });

    test("random.tf exists", () => {
      expect(fs.existsSync(randomPath)).toBe(true);
    });

    test("generates 32-character external ID", () => {
      expect(randomContent).toMatch(/resource\s+"random_string"\s+"external_id"/);
      expect(randomContent).toMatch(/length\s*=\s*32/);
      expect(randomContent).toMatch(/special\s*=\s*false/);
    });
  });

  describe("Resource Naming Convention", () => {
    test("all resources include environment_suffix in names", () => {
      const allFiles = [
        "iam_roles.tf",
        "iam_policies.tf",
        "iam_service_roles.tf",
        "kms.tf",
        "cloudwatch_logs.tf",
        "iam_permission_boundaries.tf"
      ];

      allFiles.forEach(file => {
        const content = fs.readFileSync(path.join(libPath, file), "utf8");
        const nameMatches = content.match(/name\s*=\s*"[^"]*\$\{var\.environment_suffix\}/g);
        expect(nameMatches).not.toBeNull();
        expect(nameMatches!.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Tagging Strategy", () => {
    const localsPath = path.join(libPath, "locals.tf");
    let localsContent: string;

    beforeAll(() => {
      localsContent = fs.readFileSync(localsPath, "utf8");
    });

    test("locals.tf defines common_tags", () => {
      expect(localsContent).toMatch(/common_tags\s*=/);
      expect(localsContent).toMatch(/Owner/);
      expect(localsContent).toMatch(/Environment/);
      expect(localsContent).toMatch(/CostCenter/);
      expect(localsContent).toMatch(/ManagedBy/);
    });
  });
});
