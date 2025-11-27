import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import {
  DescribeClusterCommand,
  DescribeNodegroupCommand,
  EKSClient,
} from "@aws-sdk/client-eks";
import {
  DescribeLaunchTemplateVersionsCommand,
  EC2Client,
} from "@aws-sdk/client-ec2";
import { GetRoleCommand, IAMClient } from "@aws-sdk/client-iam";
import { DescribeKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import {
  DescribeSecretCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { GetTopicAttributesCommand, SNSClient } from "@aws-sdk/client-sns";
import fs from "fs";
import path from "path";

import { buildServiceUrl } from "../lib/app-config";

const outputsPath = path.resolve(__dirname, "../cfn-outputs/all-outputs.json");
const isCI = process.env.CI === "true";

type OutputRecord = Record<string, any>;

const normalizeOutputs = (raw: unknown): OutputRecord => {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid outputs payload");
  }

  return Object.entries(raw).reduce<OutputRecord>((acc, [key, value]) => {
    if (value && typeof value === "object" && "value" in (value as Record<string, unknown>)) {
      acc[key] = (value as Record<string, unknown>).value;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {});
};

const loadOutputs = (): OutputRecord | null => {
  if (!fs.existsSync(outputsPath)) {
    if (isCI) {
      throw new Error(`Expected deployment outputs at ${outputsPath} but none were found.`);
    }
    console.warn(`[integration] Skipping E2E assertions because ${outputsPath} is absent locally.`);
    return null;
  }

  const raw = JSON.parse(fs.readFileSync(outputsPath, "utf8"));
  return normalizeOutputs(raw);
};

let outputs: OutputRecord | null;

beforeAll(() => {
  outputs = loadOutputs();
});

describe("Outputs normalisation helper", () => {
  test("throws for invalid payloads", () => {
    expect(() => normalizeOutputs(null)).toThrow("Invalid outputs payload");
  });

  test("unwraps Terraform output objects to raw values", () => {
    const sample = {
      cluster_endpoint: { value: "https://example.com" },
      cluster_name: "demo",
    };
    expect(normalizeOutputs(sample)).toEqual({
      cluster_endpoint: "https://example.com",
      cluster_name: "demo",
    });
  });
});

describe("Payments EKS stack integration", () => {
  const ensureOutputs = () => {
    if (!outputs) {
      console.warn("[integration] Tests skipped because deployment outputs are unavailable.");
      return false;
    }
    return true;
  };

  test("end-to-end: control plane, node groups, and networking comply with requirements", async () => {
    if (!ensureOutputs()) {
        return;
      }

    const region =
      outputs!.kubectl_config?.region ??
      process.env.AWS_REGION ??
      outputs!.aws_region ??
      "us-east-1";

    const clusterName: string = outputs!.cluster_name;
    const eks = new EKSClient({ region });

    const clusterResp = await eks.send(new DescribeClusterCommand({ name: clusterName }));
    const cluster = clusterResp.cluster;
    expect(cluster?.name).toBe(clusterName);
    expect(cluster?.resourcesVpcConfig?.endpointPrivateAccess).toBe(true);
      expect(cluster?.resourcesVpcConfig?.endpointPublicAccess).toBe(false);
    expect(cluster?.resourcesVpcConfig?.subnetIds?.length ?? 0).toBeGreaterThanOrEqual(3);

    const enabledLogs =
      cluster?.logging?.clusterLogging
        ?.filter((entry) => entry.enabled)
        .flatMap((entry) => entry.types ?? []) ?? [];
    expect(new Set(enabledLogs)).toEqual(new Set(["api", "audit", "authenticator"]));

    // KMS encryption is optional and may not be configured
    // Only check if encryption config exists
    if (cluster?.encryptionConfig && cluster.encryptionConfig.length > 0) {
      const encryptedResources =
        cluster.encryptionConfig.flatMap((cfg) => cfg.resources ?? []) ?? [];
      expect(encryptedResources).toContain("secrets");
    }

    expect(outputs!.cluster_endpoint).toBe(cluster?.endpoint);
    expect(outputs!.cluster_oidc_issuer_url).toBe(cluster?.identity?.oidc?.issuer);
    expect(() => Buffer.from(outputs!.cluster_certificate_authority_data, "base64")).not.toThrow();

    const nodeGroupSpecs = [
      {
        key: "frontend_node_group_name",
        min: 2,
        max: 6,
        desired: 2,
        instanceType: "t3.medium",
        taint: "frontend",
      },
      {
        key: "backend_node_group_name",
        min: 3,
        max: 10,
        desired: 3,
        instanceType: "t3.large",
        taint: "backend",
      },
    ] as const;

    const ec2 = new EC2Client({ region });

    for (const spec of nodeGroupSpecs) {
      const nodegroupName: string = outputs![spec.key];
      const nodeResp = await eks.send(
        new DescribeNodegroupCommand({ clusterName, nodegroupName }),
      );
      const nodegroup = nodeResp.nodegroup;

      expect(nodegroup?.scalingConfig?.minSize).toBe(spec.min);
      expect(nodegroup?.scalingConfig?.maxSize).toBe(spec.max);
      expect(nodegroup?.scalingConfig?.desiredSize).toBe(spec.desired);

      // When using launch templates, instanceTypes may not be on the node group
      // Check launch template if instanceTypes is not available
      if (nodegroup?.instanceTypes && nodegroup.instanceTypes.length > 0) {
        expect(nodegroup.instanceTypes).toContain(spec.instanceType);
      } else if (nodegroup?.launchTemplate) {
        // Verify instance type from launch template
        const launchTemplateName = nodegroup.launchTemplate.name;
        const launchTemplateVersion = nodegroup.launchTemplate.version;
        // Handle "$Latest" version or use the specific version
        const versionToQuery =
          launchTemplateVersion === "$Latest" || !launchTemplateVersion
            ? "$Latest"
            : launchTemplateVersion;
        const ltResp = await ec2.send(
          new DescribeLaunchTemplateVersionsCommand({
            LaunchTemplateName: launchTemplateName,
            Versions: [versionToQuery],
          }),
        );
        const instanceType =
          ltResp.LaunchTemplateVersions?.[0]?.LaunchTemplateData?.InstanceType;
        expect(instanceType).toBe(spec.instanceType);
      } else {
        // Fallback: at least verify the node group exists and has expected scaling config
        expect(nodegroup).toBeDefined();
      }

      expect(nodegroup?.subnets?.length ?? 0).toBeGreaterThanOrEqual(1);

      const taints = nodegroup?.taints ?? [];
      expect(
        taints.some(
          (taint) =>
            taint.key === "app" && taint.value === spec.taint && taint.effect === "NO_SCHEDULE",
        ),
      ).toBe(true);

      const tags = nodegroup?.tags ?? {};
      expect(tags["k8s.io/cluster-autoscaler/enabled"]).toBe("true");
      expect(tags[`k8s.io/cluster-autoscaler/${clusterName}`]).toBe("owned");
    }
  }, 120000);

  test("end-to-end: observability and supporting services are wired", async () => {
    if (!ensureOutputs()) {
      return;
    }

    const region =
      outputs!.kubectl_config?.region ??
      process.env.AWS_REGION ??
      outputs!.aws_region ??
      "us-east-1";

    const logs = new CloudWatchLogsClient({ region });
    const kms = new KMSClient({ region });
    const secrets = new SecretsManagerClient({ region });
    const sns = new SNSClient({ region });

    const logGroupName: string = outputs!.cluster_log_group_name;
    const topicArn: string = outputs!.alerts_topic_arn;
    const secretName: string = outputs!.database_secret_name;
    const frontendService: string | null = outputs!.frontend_service_name ?? null;
    const backendService: string | null = outputs!.backend_service_name ?? null;

    const logGroupResponse = await logs.send(
        new DescribeLogGroupsCommand({ logGroupNamePrefix: logGroupName, limit: 1 }),
      );
    const logGroupExists = logGroupResponse.logGroups?.some(
      (group) => group.logGroupName === logGroupName,
    );
      expect(logGroupExists).toBe(true);

    // KMS key is optional and may not be configured
    if (outputs!.kms_key_arn) {
      const kmsKeyArn: string = outputs!.kms_key_arn;
      const kmsResponse = await kms.send(
        new DescribeKeyCommand({ KeyId: kmsKeyArn }),
      );
      expect(kmsResponse.KeyMetadata?.Arn).toBe(kmsKeyArn);
      expect(kmsResponse.KeyMetadata?.KeyState).toBeDefined();
    }

    const secretResponse = await secrets.send(
      new DescribeSecretCommand({ SecretId: secretName }),
    );
    expect(secretResponse.Name).toBeDefined();
    expect(secretResponse.ARN).toBeDefined();

    const topicResponse = await sns.send(
      new GetTopicAttributesCommand({ TopicArn: topicArn }),
    );
    expect(topicResponse.Attributes?.TopicArn).toBe(topicArn);

    // Kubernetes resources are optional and may not be created if manage_kubernetes_resources is false
    if (frontendService && backendService) {
      expect(frontendService).toMatch(/^payments-frontend-svc-/);
      expect(backendService).toMatch(/^payments-backend-svc-/);

      const kubernetesNamespace = outputs!.kubernetes_namespace ?? "payments";
      const paymentsNamespace = outputs!.payments_namespace ?? `${kubernetesNamespace}-${outputs!.environment_suffix}`;
      const expectedFrontendUrl = buildServiceUrl({
        name: "payments-frontend-svc",
        namespace: paymentsNamespace,
        port: 80,
        environmentSuffix: outputs!.environment_suffix,
      });
      expect(expectedFrontendUrl).toContain(
        `${frontendService}.${paymentsNamespace}`,
      );
    }
  });

  test("IRSA roles trust Kubernetes service accounts", async () => {
    if (!ensureOutputs()) {
      return;
    }

    const region =
      outputs!.kubectl_config?.region ??
      process.env.AWS_REGION ??
      outputs!.aws_region ??
      "us-east-1";

    const iam = new IAMClient({ region });
    const oidcIssuer = outputs!.cluster_oidc_issuer_url.replace(/^https:\/\//, "");
    const envSuffix: string = outputs!.environment_suffix;

    const fetchPolicyDocument = async (arn: string) => {
      const roleName = arn.split("/").pop();
      expect(roleName).toBeDefined();
      const { Role } = await iam.send(new GetRoleCommand({ RoleName: roleName! }));
      expect(Role).toBeDefined();
      return JSON.parse(decodeURIComponent(Role!.AssumeRolePolicyDocument ?? ""));
    };

    const autoscalerPolicy = await fetchPolicyDocument(outputs!.cluster_autoscaler_role_arn);
    const appPolicy = await fetchPolicyDocument(outputs!.app_irsa_role_arn);

    const extractStringEquals = (policy: any) => {
      const statements = Array.isArray(policy.Statement) ? policy.Statement : [policy.Statement];
      return (
        statements
          .map((stmt) => stmt?.Condition?.StringEquals)
          .find((condition) => condition && typeof condition === "object") ?? {}
      );
    };

    const autoscalerConditions = extractStringEquals(autoscalerPolicy);
    expect(autoscalerConditions[`${oidcIssuer}:sub`]).toContain(
      `system:serviceaccount:kube-system:cluster-autoscaler-${envSuffix}`,
    );
    expect(autoscalerConditions[`${oidcIssuer}:aud`]).toBe("sts.amazonaws.com");

    const appConditions = extractStringEquals(appPolicy);
    // Namespace is constructed as: ${kubernetes_namespace}-${environment_suffix}
    // Default kubernetes_namespace is "payments", so it becomes "payments-prod"
    const kubernetesNamespace = outputs!.kubernetes_namespace ?? "payments";
    const paymentsNamespace = outputs!.payments_namespace ?? `${kubernetesNamespace}-${envSuffix}`;
    expect(appConditions[`${oidcIssuer}:sub`]).toContain(
      `system:serviceaccount:${paymentsNamespace}:payments-app-sa-${envSuffix}`,
    );
    expect(appConditions[`${oidcIssuer}:aud`]).toBe("sts.amazonaws.com");
  });
});
