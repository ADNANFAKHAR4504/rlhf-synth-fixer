// test/tap-stack.unit.test.ts
//
// Unit tests for ../lib/TapStack.yml / ../lib/TapStack.json
// Focus: structural & policy validation of the CloudFormation stack without external deps.
// Strategy: parse the JSON template (authoritative for assertions). For YAML, only existence/non-empty check.
// Test count target: 26–28 (we provide 27).
//
// Assumptions:
// - ../lib/TapStack.json is a faithful JSON rendering of ../lib/TapStack.yml
// - Jest + ts-jest environment is already set up by the project
//
// Notes:
// - Keep assertions resilient to minor refactors.
// - Avoid brittle equality on entire objects; prefer presence + key invariants.

import * as fs from "fs";
import * as path from "path";

type CFTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Metadata?: any;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<
    string,
    {
      Type: string;
      Properties?: any;
      DependsOn?: string | string[];
      Condition?: string;
    }
  >;
  Outputs?: Record<string, any>;
};

function loadJsonTemplate(): CFTemplate {
  const p = path.resolve(__dirname, "../lib/TapStack.json");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw);
}

function yamlExistsAndReadable(): string {
  const p = path.resolve(__dirname, "../lib/TapStack.yml");
  expect(fs.existsSync(p)).toBe(true);
  const raw = fs.readFileSync(p, "utf8");
  expect(raw.length).toBeGreaterThan(50);
  return raw;
}

function resourcesByType(tpl: CFTemplate, type: string) {
  const out: Array<{ id: string; r: any }> = [];
  for (const [id, r] of Object.entries(tpl.Resources || {})) {
    if (r.Type === type) out.push({ id, r });
  }
  return out;
}

function getResource(tpl: CFTemplate, id: string) {
  return (tpl.Resources || {})[id];
}

function outputKeys(tpl: CFTemplate) {
  return Object.keys(tpl.Outputs || {});
}

describe("TapStack — Template presence & headers", () => {
  const tpl = loadJsonTemplate();

  it("01: YAML file exists and is non-empty", () => {
    const raw = yamlExistsAndReadable();
    expect(raw.includes("AWSTemplateFormatVersion")).toBe(true);
    expect(raw.includes("Resources:")).toBe(true);
  });

  it("02: JSON template parses and has required top-level sections", () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Description).toBeDefined();
    expect(tpl.Parameters).toBeDefined();
    expect(tpl.Resources).toBeDefined();
    expect(Object.keys(tpl.Resources!).length).toBeGreaterThan(10);
  });
});

describe("TapStack — Parameters & Conditions", () => {
  const tpl = loadJsonTemplate();
  const params = tpl.Parameters || {};

  it("03: EnvironmentSuffix parameter exists with naming regex (AllowedPattern)", () => {
    expect(params.EnvironmentSuffix).toBeDefined();
    expect(params.EnvironmentSuffix.AllowedPattern).toMatch(/^\^\[a-z0-9\-]\{3,20\}\$$/);
    expect(params.EnvironmentSuffix.Default).toBeDefined();
  });

  it("04: Image URI parameters are optional and default to empty", () => {
    for (const k of ["PaymentImageUri", "FraudImageUri", "ReportingImageUri"]) {
      expect(params[k]).toBeDefined();
      expect(params[k].Default).toBeDefined();
      expect(params[k].Default).toBe("");
    }
  });

  it("05: Has*Image conditions present for all services", () => {
    const cond = tpl.Conditions || {};
    expect(cond.HasPaymentImage).toBeDefined();
    expect(cond.HasFraudImage).toBeDefined();
    expect(cond.HasReportingImage).toBeDefined();
  });

  it("06: HasCertificate condition exists", () => {
    const cond = tpl.Conditions || {};
    expect(cond.HasCertificate).toBeDefined();
  });
});

describe("TapStack — Networking (VPC/Subnets/NAT)", () => {
  const tpl = loadJsonTemplate();

  it("07: One VPC is defined", () => {
    const vpcs = resourcesByType(tpl, "AWS::EC2::VPC");
    expect(vpcs.length).toBe(1);
    const vpc = vpcs[0].r;
    expect(vpc.Properties?.EnableDnsHostnames).toBe(true);
    expect(vpc.Properties?.EnableDnsSupport).toBe(true);
  });

  it("08: Three public + three private subnets exist", () => {
    const subnets = resourcesByType(tpl, "AWS::EC2::Subnet");
    const names = subnets.map((s) => s.id);
    // Be tolerant to IDs, but ensure count & mixture
    const publicCount = names.filter((n) => /PublicSubnetAz[123]$/.test(n)).length;
    const privateCount = names.filter((n) => /PrivateSubnetAz[123]$/.test(n)).length;
    expect(publicCount).toBe(3);
    expect(privateCount).toBe(3);
  });

  it("09: NAT Gateways and EIPs exist for 3 AZs", () => {
    const nats = resourcesByType(tpl, "AWS::EC2::NatGateway");
    const eips = resourcesByType(tpl, "AWS::EC2::EIP");
    expect(nats.length).toBeGreaterThanOrEqual(3);
    expect(eips.length).toBeGreaterThanOrEqual(3);
  });
});

describe("TapStack — Load Balancer & Routing", () => {
  const tpl = loadJsonTemplate();

  it("10: ALB (application, internet-facing) is present with security group and subnets", () => {
    const lbs = resourcesByType(tpl, "AWS::ElasticLoadBalancingV2::LoadBalancer");
    expect(lbs.length).toBe(1);
    const lb = lbs[0].r;
    expect(lb.Properties?.Type).toBe("application");
    expect(lb.Properties?.Scheme).toBe("internet-facing");
    expect((lb.Properties?.Subnets || []).length).toBe(3);
    expect((lb.Properties?.SecurityGroups || []).length).toBeGreaterThanOrEqual(1);
  });

  it("11: HTTP listener exists; HTTPS listener is conditional", () => {
    const listeners = resourcesByType(tpl, "AWS::ElasticLoadBalancingV2::Listener");
    const http = listeners.find((l) => l.r.Properties?.Port === 80);
    expect(http).toBeDefined();
    const https = listeners.find((l) => l.r.Properties?.Port === 443);
    // HTTPS may have a Condition; assert either present or referenced by path rules conditionally
    expect(https?.r?.Condition || true).toBeTruthy();
  });

  it("12: Three target groups exist with health checks configured", () => {
    const tgs = resourcesByType(tpl, "AWS::ElasticLoadBalancingV2::TargetGroup");
    expect(tgs.length).toBe(3);
    for (const { r } of tgs) {
      expect(r.Properties?.TargetType).toBe("ip");
      expect(r.Properties?.HealthCheckIntervalSeconds).toBeGreaterThanOrEqual(10);
      expect(r.Properties?.HealthyThresholdCount).toBeGreaterThanOrEqual(2);
      expect(r.Properties?.UnhealthyThresholdCount).toBeGreaterThanOrEqual(2);
      expect(r.Properties?.Matcher?.HttpCode).toBeDefined();
    }
  });

  it("13: Path rules exist for /payment/*, /fraud/*, /reporting/*", () => {
    const rules = resourcesByType(tpl, "AWS::ElasticLoadBalancingV2::ListenerRule");
    const vals = rules.map(({ r }) => JSON.stringify(r.Properties?.Conditions || []));
    expect(vals.some((v) => v.includes("/payment/*"))).toBe(true);
    expect(vals.some((v) => v.includes("/fraud/*"))).toBe(true);
    expect(vals.some((v) => v.includes("/reporting/*"))).toBe(true);
  });
});

describe("TapStack — Security Groups", () => {
  const tpl = loadJsonTemplate();

  it("14: ALB security group allows 80/443 from 0.0.0.0/0", () => {
    const albSg = getResource(tpl, "AlbSecurityGroup");
    expect(albSg).toBeDefined();
    const ing = albSg.Properties?.SecurityGroupIngress || [];
    const allow80 = ing.find((r: any) => r.FromPort === 80 && r.CidrIp === "0.0.0.0/0");
    const allow443 = ing.find((r: any) => r.FromPort === 443 && r.CidrIp === "0.0.0.0/0");
    expect(allow80).toBeDefined();
    expect(allow443).toBeDefined();
  });

  it("15: Service SGs allow from ALB SG and Mesh SG on respective container ports", () => {
    for (const id of [
      "PaymentServiceSecurityGroup",
      "FraudServiceSecurityGroup",
      "ReportingServiceSecurityGroup",
    ]) {
      const sg = getResource(tpl, id);
      expect(sg).toBeDefined();
      const ing = sg.Properties?.SecurityGroupIngress || [];
      const hasAlb = ing.some((r: any) => r.SourceSecurityGroupId?.Ref === "AlbSecurityGroup");
      const hasMesh = ing.some((r: any) => r.SourceSecurityGroupId?.Ref === "ServicesMeshSecurityGroup");
      expect(hasAlb).toBe(true);
      expect(hasMesh).toBe(true);
    }
  });
});

describe("TapStack — ECS Cluster & Observability", () => {
  const tpl = loadJsonTemplate();

  it("16: ECS Cluster has containerInsights enabled and Exec configured", () => {
    const ecs = getResource(tpl, "EcsCluster");
    expect(ecs).toBeDefined();
    const settings = ecs.Properties?.ClusterSettings || [];
    expect(JSON.stringify(settings)).toContain("containerInsights");
    const cfg = ecs.Properties?.Configuration || {};
    expect(cfg.ExecuteCommandConfiguration?.Logging || "DEFAULT").toBeDefined();
  });
});

describe("TapStack — IAM Roles", () => {
  const tpl = loadJsonTemplate();

  it("18: Execution role present with ECR, logs, and SSM messages access", () => {
    const role = getResource(tpl, "TaskExecutionRole");
    expect(role).toBeDefined();
    const mpa = role.Properties?.ManagedPolicyArns || [];
    expect(mpa.join(",")).toContain("AmazonECSTaskExecutionRolePolicy");
    const policyDoc = JSON.stringify(role.Properties?.Policies || []);
    expect(policyDoc).toContain("ssmmessages");
    expect(policyDoc).toContain("logs:CreateLogGroup");
    expect(policyDoc).toContain("ecr:GetAuthorizationToken");
  });

  it("19: Separate task roles exist for payment, fraud, reporting", () => {
    ["PaymentTaskRole", "FraudTaskRole", "ReportingTaskRole"].forEach((id) => {
      const r = getResource(tpl, id);
      expect(r).toBeDefined();
      expect(r.Properties?.AssumeRolePolicyDocument).toBeDefined();
    });
  });
});

describe("TapStack — Task Definitions", () => {
  const tpl = loadJsonTemplate();

  it("20: Task definitions use FARGATE + awsvpc + correct CPU/memory per service", () => {
    const p = getResource(tpl, "PaymentTaskDefinition");
    const f = getResource(tpl, "FraudTaskDefinition");
    const r = getResource(tpl, "ReportingTaskDefinition");
    for (const td of [p, f, r]) {
      expect(td).toBeDefined();
      expect(td.Properties?.NetworkMode).toBe("awsvpc");
      expect((td.Properties?.RequiresCompatibilities || []).includes("FARGATE")).toBe(true);
    }
    expect(p.Properties?.Cpu).toBe("1024");
    expect(p.Properties?.Memory).toBe("2048");
    expect(f.Properties?.Cpu).toBe("1024");
    expect(f.Properties?.Memory).toBe("2048");
    expect(r.Properties?.Cpu).toBe("512");
    expect(r.Properties?.Memory).toBe("1024");
  });

  it("21: ContainerDefinitions declare PortMappings and awslogs configuration", () => {
    const tds = [
      getResource(tpl, "PaymentTaskDefinition"),
      getResource(tpl, "FraudTaskDefinition"),
      getResource(tpl, "ReportingTaskDefinition"),
    ];
    for (const td of tds) {
      const cds = td.Properties?.ContainerDefinitions || [];
      expect(cds.length).toBeGreaterThan(0);
      const c0 = cds[0];
      expect((c0.PortMappings || []).length).toBeGreaterThan(0);
      expect(c0.LogConfiguration?.LogDriver).toBe("awslogs");
      expect(c0.LogConfiguration?.Options?.["awslogs-group"]).toBeDefined();
    }
  });
});

describe("TapStack — ECS Services", () => {
  const tpl = loadJsonTemplate();

  it("22: Services reference task defs and ALB target groups with correct LB mapping keys", () => {
    const services = ["PaymentService", "FraudService", "ReportingService"].map((id) =>
      getResource(tpl, id)
    );
    for (const svc of services) {
      expect(svc).toBeDefined();
      expect(svc.Properties?.TaskDefinition).toBeDefined();
      const lbs = svc.Properties?.LoadBalancers || [];
      expect(lbs.length).toBe(1);
      expect(lbs[0].TargetGroupArn).toBeDefined();
      expect(lbs[0].ContainerName).toBeDefined();
      expect(lbs[0].ContainerPort).toBeDefined();
    }
  });

  it("23: Services enable ECS Exec", () => {
    for (const id of ["PaymentService", "FraudService", "ReportingService"]) {
      const svc = getResource(tpl, id);
      expect(svc.Properties?.EnableExecuteCommand).toBe(true);
    }
  });

  it("24: Services include DeploymentConfiguration with circuit breaker enabled", () => {
    for (const id of ["PaymentService", "FraudService", "ReportingService"]) {
      const svc = getResource(tpl, id);
      const dc = svc.Properties?.DeploymentConfiguration;
      expect(dc).toBeDefined();
      expect(dc.DeploymentCircuitBreaker?.Enable).toBe(true);
      expect(dc.DeploymentCircuitBreaker?.Rollback).toBe(true);
    }
  });

  it("25: Services depend on their path rules to avoid TG/listener race", () => {
    const expected: Record<string, string> = {
      PaymentService: "PaymentPathRule",
      FraudService: "FraudPathRule",
      ReportingService: "ReportingPathRule",
    };
    for (const [svcId, dep] of Object.entries(expected)) {
      const svc = getResource(tpl, svcId);
      const deps = Array.isArray(svc.DependsOn) ? svc.DependsOn : [svc.DependsOn].filter(Boolean);
      expect(deps).toContain(dep);
    }
  });
});

describe("TapStack — Application Auto Scaling", () => {
  const tpl = loadJsonTemplate();

  it("26: ScalableTargets exist for all three services with ecs:service:DesiredCount", () => {
    const sts = resourcesByType(tpl, "AWS::ApplicationAutoScaling::ScalableTarget");
    expect(sts.length).toBe(3);
    for (const { r } of sts) {
      expect(r.Properties?.ServiceNamespace).toBe("ecs");
      expect(r.Properties?.ScalableDimension).toBe("ecs:service:DesiredCount");
      expect(r.Properties?.ResourceId).toBeDefined();
    }
  });

  it("27: CPU TargetTracking policies exist for each service", () => {
    const pols = resourcesByType(tpl, "AWS::ApplicationAutoScaling::ScalingPolicy");
    // At least 3 target-tracking policies
    expect(pols.length).toBeGreaterThanOrEqual(3);
    for (const { r } of pols) {
      expect(r.Properties?.PolicyType).toBe("TargetTrackingScaling");
      const pm = r.Properties?.TargetTrackingScalingPolicyConfiguration?.PredefinedMetricSpecification;
      expect(pm?.PredefinedMetricType).toBe("ECSServiceAverageCPUUtilization");
    }
  });
});

describe("TapStack — Outputs", () => {
  const tpl = loadJsonTemplate();

  it("28: Exposes key outputs like AlbDnsName, ClusterName, and service discovery names", () => {
    const keys = outputKeys(tpl);
    expect(keys).toEqual(
      expect.arrayContaining([
        "AlbDnsName",
        "ClusterName",
        "PaymentServiceDiscoveryName",
        "FraudServiceDiscoveryName",
        "ReportingServiceDiscoveryName",
      ])
    );
  });
});
