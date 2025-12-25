import fs from "fs";
import path from "path";

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Transform?: string | string[];
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Resources?: Record<
    string,
    { Type: string; Properties?: any; DeletionPolicy?: string; UpdateReplacePolicy?: string }
  >;
  Outputs?: Record<string, { Value: any; Export?: { Name: any }; Description?: string }>;
};

const jsonPath = path.resolve(process.cwd(), "lib", "TapStack.json");
if (!fs.existsSync(jsonPath)) {
  throw new Error(
    `TapStack.json not found at ${jsonPath}. Ensure your "YAML -> JSON" step runs before unit tests.`
  );
}

const tpl = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as CfnTemplate;

function getResource(type: string) {
  const res = tpl.Resources || {};
  for (const [logicalId, def] of Object.entries(res)) {
    if ((def as any).Type === type) return { id: logicalId, resource: def as any };
  }
  return null;
}

function getAllResources(type: string) {
  const hits: Array<{ id: string; resource: any }> = [];
  const res = tpl.Resources || {};
  for (const [logicalId, def] of Object.entries(res)) {
    if ((def as any).Type === type) hits.push({ id: logicalId, resource: def });
  }
  return hits;
}

function isSubString(v: any, needle: string) {
  if (typeof v === "string") return v.includes(needle);
  if (v && typeof v === "object" && "Fn::Sub" in v) {
    const s = (v as any)["Fn::Sub"];
    if (typeof s === "string") return s.includes(needle);
  }
  return false;
}

/* --------------------- Mode detection (Hosted vs RDS-managed) --------------------- */
const transform = tpl.Transform;
const hasSecretsTransform =
  (typeof transform === "string" && transform.startsWith("AWS::SecretsManager-")) ||
  (Array.isArray(transform) && transform.some((x) => typeof x === "string" && x.startsWith("AWS::SecretsManager-")));

const hasHostedSecret = !!getResource("AWS::SecretsManager::Secret");
const hasRotationSchedule = !!getResource("AWS::SecretsManager::RotationSchedule");

const hostedMode = hasSecretsTransform || hasHostedSecret || hasRotationSchedule;
const rdsManagedMode = !hostedMode;

/* ----------------------------------- Tests ----------------------------------- */

describe("TapStack template — core structure", () => {
  test("1) Template version and description present", () => {
    expect(typeof tpl.AWSTemplateFormatVersion).toBe("string");
    expect(typeof tpl.Description).toBe("string");
    expect(tpl.Description!.length).toBeGreaterThan(10);
  });

  test("2) Secrets/Rotation strategy is valid for either Hosted or RDS-managed", () => {
    const cluster = getResource("AWS::RDS::DBCluster");
    expect(cluster).toBeTruthy();

    if (hostedMode) {
      // Hosted rotation path (Transform + Secret + RotationSchedule)
      expect(hasSecretsTransform).toBe(true);
      expect(hasHostedSecret).toBe(true);
      expect(hasRotationSchedule).toBe(true);
      // In hosted mode, we typically DON'T require ManageMasterUserPassword
      // but if present it's fine. No strict assertion here.
    } else {
      // RDS-managed path: no Transform, no Secret/RotationSchedule; require ManageMasterUserPassword+KMS
      expect(hasSecretsTransform).toBe(false);
      expect(hasHostedSecret).toBe(false);
      expect(hasRotationSchedule).toBe(false);

      const props = cluster!.resource.Properties || {};
      expect(props.ManageMasterUserPassword).toBe(true);
      expect(props.MasterUserSecret && props.MasterUserSecret.KmsKeyId).toBeDefined();
    }
  });

  test("3) Parameters: EnvironmentSuffix exists with default and regex", () => {
    const ps = tpl.Parameters || {};
    expect(ps.EnvironmentSuffix).toBeDefined();
    expect(ps.EnvironmentSuffix.AllowedPattern).toBe("^[a-z0-9]+(-[a-z0-9]+)*$");
    expect(typeof ps.EnvironmentSuffix.Default).toBe("string");
  });

  test("4) Parameters: AlarmEmail exists with default and email regex", () => {
    const ps = tpl.Parameters || {};
    expect(ps.AlarmEmail).toBeDefined();
    expect(ps.AlarmEmail.AllowedPattern).toBe("^[^@]+@[^@]+\\.[^@]+$");
    expect(typeof ps.AlarmEmail.Default).toBe("string");
  });

  test("5) Mappings: Tags.Common includes Environment, Team, Service", () => {
    const m = tpl.Mappings || {};
    expect(m.Tags).toBeDefined();
    expect(m.Tags.Common).toBeDefined();
    expect(m.Tags.Common.Environment).toBeDefined();
    expect(m.Tags.Common.Team).toBeDefined();
    expect(m.Tags.Common.Service).toBeDefined();
  });
});

describe("Networking & security", () => {
  test("6) VPC and three private subnets exist", () => {
    expect(getResource("AWS::EC2::VPC")).toBeTruthy();
    const subnets = getAllResources("AWS::EC2::Subnet");
    expect(subnets.length).toBeGreaterThanOrEqual(3);
  });

  test("7) RDS DBSubnetGroup exists with three subnet IDs", () => {
    const g = getResource("AWS::RDS::DBSubnetGroup");
    expect(g).toBeTruthy();
    const props = g!.resource.Properties || {};
    expect(Array.isArray(props.SubnetIds)).toBe(true);
    expect(props.SubnetIds.length).toBeGreaterThanOrEqual(3);
    expect(isSubString(props.DBSubnetGroupName, "${EnvironmentSuffix}")).toBe(true);
  });

  test("8) Security groups: app, rotation, and db SGs exist", () => {
    const sgs = getAllResources("AWS::EC2::SecurityGroup").map((x) => x.id);
    expect(sgs).toEqual(
      expect.arrayContaining(["AppSecurityGroup", "RotationLambdaSecurityGroup", "DbSecurityGroup"])
    );
  });
});

describe("KMS & Secrets strategy", () => {
  test("10) KMS Key and Alias exist with rotation enabled", () => {
    const key = getResource("AWS::KMS::Key");
    const alias = getResource("AWS::KMS::Alias");
    expect(key).toBeTruthy();
    expect(alias).toBeTruthy();
    const kp = key!.resource.Properties || {};
    expect(kp.EnableKeyRotation).toBe(true);
  });

  test("11) Secret/Outputs wiring aligns with the selected mode", () => {
    const outs = tpl.Outputs || {};
    expect(outs.SecretArn).toBeDefined();

    if (hostedMode) {
      // Hosted mode -> standalone Secret exists; SecretArn output usually !Ref DbSecret
      const secret = getResource("AWS::SecretsManager::Secret");
      expect(secret).toBeTruthy();

      const val = outs.SecretArn.Value;
      // Accept either Ref DbSecret or GetAtt of Secret.Arn depending on authoring
      const isRefDbSecret = val && typeof val === "object" && "Ref" in val && val.Ref === "DbSecret";
      const isGetAttSecretArn =
        val &&
        typeof val === "object" &&
        "Fn::GetAtt" in val &&
        (Array.isArray((val as any)["Fn::GetAtt"])
          ? (val as any)["Fn::GetAtt"][0] === "DbSecret"
          : (val as any)["Fn::GetAtt"] === "DbSecret.Arn");
      expect(isRefDbSecret || isGetAttSecretArn).toBe(true);
    } else {
      // RDS-managed -> no Secret resource; output should be GetAtt DbCluster.MasterUserSecret.SecretArn
      expect(getResource("AWS::SecretsManager::Secret")).toBeNull();
      const val = outs.SecretArn.Value;
      const isGetAttArray =
        val &&
        typeof val === "object" &&
        "Fn::GetAtt" in val &&
        Array.isArray((val as any)["Fn::GetAtt"]) &&
        (val as any)["Fn::GetAtt"][0] === "DbCluster" &&
        (val as any)["Fn::GetAtt"][1] === "MasterUserSecret.SecretArn";
      const isGetAttString =
        val &&
        typeof val === "object" &&
        "Fn::GetAtt" in val &&
        typeof (val as any)["Fn::GetAtt"] === "string" &&
        (val as any)["Fn::GetAtt"] === "DbCluster.MasterUserSecret.SecretArn";
      expect(isGetAttArray || isGetAttString).toBe(true);
    }
  });

  test("12) Rotation indicator aligns with the selected mode", () => {
    const rotRes = getResource("AWS::SecretsManager::RotationSchedule");
    const outs = tpl.Outputs || {};
    expect(outs.RotationScheduleArn).toBeDefined();

    if (hostedMode) {
      // Rotation schedule resource with HostedRotationLambda and 30d rule
      expect(rotRes).toBeTruthy();
      const p = rotRes!.resource.Properties || {};
      expect(p.SecretId).toBeDefined();
      expect(p.RotationRules?.AutomaticallyAfterDays).toBe(30);
      expect(p.HostedRotationLambda?.RotationType).toBeDefined();
    } else {
      // RDS-managed: no RotationSchedule resource; output is a constant indicator
      expect(rotRes).toBeNull();
      expect(outs.RotationScheduleArn.Value).toBe("managed-by-rds");
    }
  });
});

describe("Parameter groups", () => {
  test("13) Cluster parameter group exists with query_cache_size = 0", () => {
    const g = getResource("AWS::RDS::DBClusterParameterGroup");
    expect(g).toBeTruthy();
    const p = g!.resource.Properties || {};
    expect(p.Family).toBe("aurora-mysql5.7");
    expect(p.Parameters?.query_cache_size).toBe("0");
  });

  test("14) Instance parameter group exists with max_connections = 16000", () => {
    const g = getResource("AWS::RDS::DBParameterGroup");
    expect(g).toBeTruthy();
    const p = g!.resource.Properties || {};
    expect(p.Family).toBe("aurora-mysql5.7");
    expect(p.Parameters?.max_connections).toBe("16000");
  });
});

describe("Aurora cluster & instances", () => {
  test("15) DBCluster exists with aurora-mysql, backtrack=72h, backup retention=7", () => {
    const c = getResource("AWS::RDS::DBCluster");
    expect(c).toBeTruthy();
    const p = c!.resource.Properties || {};
    expect(p.Engine).toBe("aurora-mysql");
    expect(p.BacktrackWindow).toBe(259200);
    expect(p.BackupRetentionPeriod).toBe(7);
  });

  test("16) Cluster references cluster parameter group and DBSubnetGroup", () => {
    const c = getResource("AWS::RDS::DBCluster")!;
    const p = c.resource.Properties || {};
    expect(p.DBClusterParameterGroupName).toBeDefined();
    expect(p.DBSubnetGroupName).toBeDefined();
  });

  test("17) Three DB instances exist (1 writer + 2 readers) with PI enabled retention=7", () => {
    const insts = getAllResources("AWS::RDS::DBInstance");
    expect(insts.length).toBeGreaterThanOrEqual(3);
    insts.forEach(({ resource }) => {
      const p = resource.Properties || {};
      expect(p.EnablePerformanceInsights).toBe(true);
      expect(p.PerformanceInsightsRetentionPeriod).toBe(7);
    });
  });

  test("18) Stateful resources have Snapshot/Retain policies", () => {
    const c = getResource("AWS::RDS::DBCluster")!;
    const i1 = getResource("AWS::RDS::DBInstance")!;
    expect(c.resource.DeletionPolicy).toBe("Snapshot");
    expect(c.resource.UpdateReplacePolicy).toBe("Snapshot");
    expect(i1.resource.DeletionPolicy).toBe("Snapshot");
    expect(i1.resource.UpdateReplacePolicy).toBe("Snapshot");

    const kms = getResource("AWS::KMS::Key")!;
    expect(kms.resource.DeletionPolicy).toBe("Retain");
    expect(kms.resource.UpdateReplacePolicy).toBe("Retain");
  });
});

describe("Alarms & SNS", () => {
  test("19) SNS Topic and Subscription exist", () => {
    const topic = getResource("AWS::SNS::Topic");
    const sub = getResource("AWS::SNS::Subscription");
    expect(topic).toBeTruthy();
    expect(sub).toBeTruthy();
    const sp = sub!.resource.Properties || {};
    expect(sp.TopicArn).toBeDefined();
    expect(sp.Protocol).toBe("email");
    expect(sp.Endpoint && typeof sp.Endpoint.Ref === "string").toBe(true);
  });

  test("20) CPU > 80% alarm targets writer DBInstanceIdentifier", () => {
    const alarms = getAllResources("AWS::CloudWatch::Alarm");
    const cpu = alarms.find((x) => isSubString(x.resource.Properties?.AlarmName, "cpu80"));
    expect(cpu).toBeTruthy();
    const p = cpu!.resource.Properties;
    expect(p.Threshold).toBe(80);
    const dims = p.Dimensions || [];
    const hasWriterDim = dims.some((d: any) => d.Name === "DBInstanceIdentifier" && typeof d.Value.Ref === "string");
    expect(hasWriterDim).toBe(true);
  });

  test("21) Connections > 14000 alarm targets writer DBInstanceIdentifier and threshold is 14000", () => {
    const alarms = getAllResources("AWS::CloudWatch::Alarm");
    const con = alarms.find((x) => isSubString(x.resource.Properties?.AlarmName, "connections"));
    expect(con).toBeTruthy();
    const p = con!.resource.Properties;
    expect(p.Threshold).toBe(14000);
    const dims = p.Dimensions || [];
    const hasWriterDim = dims.some((d: any) => d.Name === "DBInstanceIdentifier" && typeof d.Value.Ref === "string");
    expect(hasWriterDim).toBe(true);
  });

  test("22) ReadLatency and WriteLatency alarms target writer and use threshold 0.2 (200ms)", () => {
    const alarms = getAllResources("AWS::CloudWatch::Alarm");
    const read = alarms.find((x) => isSubString(x.resource.Properties?.AlarmName, "read-latency"));
    const write = alarms.find((x) => isSubString(x.resource.Properties?.AlarmName, "write-latency"));
    expect(read).toBeTruthy();
    expect(write).toBeTruthy();
    expect(read!.resource.Properties.Threshold).toBe(0.2);
    expect(write!.resource.Properties.Threshold).toBe(0.2);
  });

  test("23) Replica lag alarm binds to DBClusterIdentifier and uses 1 second threshold", () => {
    const alarms = getAllResources("AWS::CloudWatch::Alarm");
    const lag = alarms.find((x) => isSubString(x.resource.Properties?.AlarmName, "replica-lag"));
    expect(lag).toBeTruthy();
    const p = lag!.resource.Properties;
    expect(p.Threshold).toBe(1);
    const dims = p.Dimensions || [];
    const hasClusterDim = dims.some((d: any) => d.Name === "DBClusterIdentifier" && typeof d.Value.Ref === "string");
    expect(hasClusterDim).toBe(true);
  });
});

describe("Naming, tags, outputs", () => {
  test("24) Critical named resources include EnvironmentSuffix in their names", () => {
    const expectSuffix = (val: any) => expect(isSubString(val, "${EnvironmentSuffix}")).toBe(true);

    expectSuffix(getResource("AWS::RDS::DBSubnetGroup")!.resource.Properties.DBSubnetGroupName);
    expectSuffix(getResource("AWS::RDS::DBCluster")!.resource.Properties.DBClusterIdentifier);
    expectSuffix(getAllResources("AWS::RDS::DBInstance")[0].resource.Properties.DBInstanceIdentifier);
  });

  test("25) Outputs include writer/reader endpoints and cluster identifiers/ARNs", () => {
    const o = tpl.Outputs || {};
    const mustHave = [
      "ClusterArn",
      "ClusterIdentifier",
      "WriterEndpoint",
      "ReaderEndpoint",
      "EngineVersionOut",
      "DBInstanceWriterArn",
      "DBInstanceReader1Arn",
      "DBInstanceReader2Arn",
      "SecretArn",
      "RotationScheduleArn",
      "SnsTopicArn",
      "AlarmCpuArn",
      "AlarmConnectionsArn",
      "AlarmReadLatencyArn",
      "AlarmWriteLatencyArn",
      "AlarmReplicaLagArn",
      "VpcId",
      "DbSecurityGroupId",
      "AppSecurityGroupId",
      "DbSubnetGroupName",
      "PrivateSubnetIds",
    ];
    mustHave.forEach((k) => expect(o[k]).toBeDefined());
  });

  test("26) Sanity: template contains Resources and Outputs sections", () => {
    expect(typeof tpl.Resources).toBe("object");
    expect(typeof tpl.Outputs).toBe("object");
  });
});
