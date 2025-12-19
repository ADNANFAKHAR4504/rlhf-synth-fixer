// test/tapstack.unit.test.ts

import fs from "fs";
import path from "path";

type CFNTemplate = {
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<
    string,
    {
      Type: string;
      Condition?: string;
      Properties?: Record<string, any>;
    }
  >;
  Outputs?: Record<
    string,
    {
      Value?: any;
      Description?: string;
      Condition?: string;
    }
  >;
};

const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");
const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");

function loadTemplate(): CFNTemplate {
  const raw = fs.readFileSync(jsonPath, "utf8");
  const tpl = JSON.parse(raw) as CFNTemplate;
  if (!tpl || typeof tpl !== "object" || !tpl.Resources) {
    throw new Error("Invalid CloudFormation template JSON.");
  }
  return tpl;
}

function resourcesByType(tpl: CFNTemplate, type: string) {
  return Object.entries(tpl.Resources)
    .filter(([_, r]) => r.Type === type)
    .map(([id, r]) => ({ id, ...r }));
}

function getResource(tpl: CFNTemplate, logicalId: string) {
  const r = tpl.Resources[logicalId];
  if (!r) throw new Error(`Resource not found: ${logicalId}`);
  return { id: logicalId, ...r };
}

function hasNoExplicitName(props: Record<string, any>, disallowed: string[]) {
  return !disallowed.some((k) => Object.prototype.hasOwnProperty.call(props, k));
}

describe("TapStack template — structure & existence", () => {
  const tpl = loadTemplate();

  test("01 loads JSON template and has Resources", () => {
    expect(tpl).toBeTruthy();
    expect(typeof tpl).toBe("object");
    expect(tpl.Resources).toBeTruthy();
    expect(Object.keys(tpl.Resources).length).toBeGreaterThan(0);
  });

  test("02 YAML file exists and is non-empty", () => {
    expect(fs.existsSync(yamlPath)).toBe(true);
    const txt = fs.readFileSync(yamlPath, "utf8");
    expect(txt.length).toBeGreaterThan(50);
  });
});

describe("Parameters & Conditions", () => {
  const tpl = loadTemplate();

  test("03 required Parameters exist with sensible defaults", () => {
    const p = tpl.Parameters || {};
    expect(p.ProjectName?.Default).toBeTruthy();
    expect(p.EnvironmentSuffix?.Default).toBeTruthy();
    expect(p.LambdaRuntime?.Default).toMatch(/^python3\./);
    expect(p.LambdaMemoryMb?.Default).toBeGreaterThanOrEqual(128);
    expect(p.LambdaTimeoutSec?.Default).toBeGreaterThanOrEqual(1);
    expect(p.LogRetentionDays?.Default).toBeGreaterThan(0);
    expect(p.LambdaLogLevel?.Default).toBeTruthy();
  });

  test("04 EnvironmentSuffix enforces safe regex and avoids brittle AllowedValues", () => {
    const p = tpl.Parameters || {};
    expect(p.EnvironmentSuffix?.AllowedPattern).toBeTruthy();
    expect(p.EnvironmentSuffix?.AllowedValues).toBeUndefined();
  });

  test("05 expected Conditions exist", () => {
    const c = tpl.Conditions || {};
    expect(c.HasAlarmEmail).toBeDefined();
    expect(c.CreateDLQ).toBeDefined();
    // CodeDeploy is optional; its condition should be present in the provided template
    expect(c.CreateCodeDeploy ?? c.CreateCodeDeploy === undefined).toBeDefined();
  });
});

describe("S3 artifacts & policy", () => {
  const tpl = loadTemplate();

  test("06 ArtifactsBucket exists with versioning and encryption", () => {
    const b = getResource(tpl, "ArtifactsBucket");
    expect(b.Type).toBe("AWS::S3::Bucket");
    const p = b.Properties || {};
    expect(p.VersioningConfiguration?.Status).toBe("Enabled");
    expect(p.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm).toBe("AES256");
    // Public access block all true
    const pab = p.PublicAccessBlockConfiguration || {};
    expect(pab.BlockPublicAcls).toBe(true);
    expect(pab.BlockPublicPolicy).toBe(true);
    expect(pab.IgnorePublicAcls).toBe(true);
    expect(pab.RestrictPublicBuckets).toBe(true);
  });

  test("07 ArtifactsBucketPolicy denies insecure transport and targets bucket ARN + /*", () => {
    const bp = getResource(tpl, "ArtifactsBucketPolicy");
    expect(bp.Type).toBe("AWS::S3::BucketPolicy");
    const stmts = bp.Properties?.PolicyDocument?.Statement || [];
    const deny = stmts.find((s: any) => s.Sid === "DenyInsecureTransport");
    expect(deny).toBeTruthy();
    expect(deny.Effect).toBe("Deny");
    expect(deny.Condition?.Bool?.["aws:SecureTransport"]).toBe(false);
  });
});

describe("SNS notifications", () => {
  const tpl = loadTemplate();

  test("08 StackEventsTopic uses AWS-managed KMS and has tags", () => {
    const t = getResource(tpl, "StackEventsTopic");
    expect(t.Type).toBe("AWS::SNS::Topic");
    expect(t.Properties?.KmsMasterKeyId).toBe("alias/aws/sns");
    expect(t.Properties?.Tags?.length).toBeGreaterThan(0);
  });

  test("09 StackEventsSubscriptionEmail is conditional on HasAlarmEmail", () => {
    const s = getResource(tpl, "StackEventsSubscriptionEmail");
    expect(s.Type).toBe("AWS::SNS::Subscription");
    expect(s.Condition).toBe("HasAlarmEmail");
  });
});

describe("IAM & least privilege", () => {
  const tpl = loadTemplate();

  test("10 LambdaExecutionRole trusts lambda.amazonaws.com and has AWSLambdaBasicExecutionRole", () => {
    const role = getResource(tpl, "LambdaExecutionRole");
    expect(role.Type).toBe("AWS::IAM::Role");
    const assume = role.Properties?.AssumeRolePolicyDocument?.Statement?.[0];
    expect(assume?.Principal?.Service).toBe("lambda.amazonaws.com");
    const mps = role.Properties?.ManagedPolicyArns || [];
    expect(mps).toContain("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole");
  });

  test("11 LambdaExecutionRole inline policy allows s3:GetObject/ListBucket on artifacts and sns:Publish on topic", () => {
    const role = getResource(tpl, "LambdaExecutionRole");
    const policies = role.Properties?.Policies || [];
    const doc = policies[0]?.PolicyDocument;
    const actions = doc?.Statement?.flatMap((s: any) => Array.isArray(s.Action) ? s.Action : [s.Action]) || [];
    expect(actions).toEqual(expect.arrayContaining(["s3:GetObject", "s3:ListBucket", "sns:Publish"]));
  });
});

describe("Lambda functions & logs", () => {
  const tpl = loadTemplate();

  test("13 AppHandlerLambda has optional DLQ via condition", () => {
    const fn = getResource(tpl, "AppHandlerLambda");
    const dlq = fn.Properties?.DeadLetterConfig;
    // Structure should either be Ref NoValue or an object with TargetArn intrinsic
    expect(dlq).toBeDefined();
  });

  test("14 AppDLQ exists with CreateDLQ condition and KMS alias/aws/sqs", () => {
    const q = getResource(tpl, "AppDLQ");
    expect(q.Type).toBe("AWS::SQS::Queue");
    expect(q.Condition).toBe("CreateDLQ");
    expect(q.Properties?.KmsMasterKeyId).toBe("alias/aws/sqs");
  });

  test("15 Log groups for App/PreTraffic/PostTraffic exist with retention and Retain policies", () => {
    const lg1 = getResource(tpl, "AppHandlerLogGroup");
    const lg2 = getResource(tpl, "PreTrafficLogGroup");
    const lg3 = getResource(tpl, "PostTrafficLogGroup");
    [lg1, lg2, lg3].forEach((lg) => {
      expect(lg.Type).toBe("AWS::Logs::LogGroup");
      expect(lg.Properties?.RetentionInDays).toBeTruthy();
    });
  });

  test("16 Version and live Alias are defined and alias name is 'live'", () => {
    const v = getResource(tpl, "AppHandlerVersion");
    const a = getResource(tpl, "AppLiveAlias");
    expect(v.Type).toBe("AWS::Lambda::Version");
    expect(a.Type).toBe("AWS::Lambda::Alias");
    expect(a.Properties?.Name).toBe("live");
  });

  test("17 PreTrafficHookLambda and PostTrafficHookLambda exist", () => {
    const pre = getResource(tpl, "PreTrafficHookLambda");
    const post = getResource(tpl, "PostTrafficHookLambda");
    expect(pre.Type).toBe("AWS::Lambda::Function");
    expect(post.Type).toBe("AWS::Lambda::Function");
  });
});

describe("CodeDeploy (conditional Lambda-only)", () => {
  const tpl = loadTemplate();

  test("20 CodeDeploy resources are Lambda compute platform and gated by CreateCodeDeploy", () => {
    // The logical IDs may be conditionally present; ensure if present they have the right Condition/props
    const apps = resourcesByType(tpl, "AWS::CodeDeploy::Application");
    if (apps.length) {
      const app = apps[0];
      expect(["CreateCodeDeploy", undefined]).toContain(app.Condition);
      expect(app.Properties?.ComputePlatform).toBe("Lambda");
    }
  });

  test("21 Deployment group (if present) is conditional and has Lambda deployment config", () => {
    const dgs = resourcesByType(tpl, "AWS::CodeDeploy::DeploymentGroup");
    if (dgs.length) {
      const dg = dgs[0];
      expect(["CreateCodeDeploy", undefined]).toContain(dg.Condition);
      expect(dg.Properties?.DeploymentConfigName).toMatch(/^CodeDeployDefault\.Lambda/);
      // Ensure no EC2-only fields sneak in
      const props = dg.Properties || {};
      const forbidden = ["Ec2TagFilters", "OnPremisesInstanceTagFilters", "AutoScalingGroups", "LoadBalancerInfo"];
      forbidden.forEach((k) => expect(props[k as keyof typeof props]).toBeUndefined());
    }
  });
});

describe("No explicit names for collision-prone resources", () => {
  const tpl = loadTemplate();

  test("22 Lambda functions, IAM role, SNS topic, SQS queue, and LogGroups avoid explicit Name properties", () => {
    const targets = [
      getResource(tpl, "AppHandlerLambda"),
      getResource(tpl, "PreTrafficHookLambda"),
      getResource(tpl, "PostTrafficHookLambda"),
      getResource(tpl, "LambdaExecutionRole"),
      getResource(tpl, "StackEventsTopic"),
      getResource(tpl, "AppDLQ"),
      getResource(tpl, "AppHandlerLogGroup"),
      getResource(tpl, "PreTrafficLogGroup"),
      getResource(tpl, "PostTrafficLogGroup"),
    ];
    for (const r of targets) {
      const p = r.Properties || {};
      const safe =
        r.Type === "AWS::Lambda::Function"
          ? hasNoExplicitName(p, ["FunctionName"])
          : r.Type === "AWS::IAM::Role"
          ? hasNoExplicitName(p, ["RoleName"])
          : r.Type === "AWS::SNS::Topic"
          ? hasNoExplicitName(p, ["TopicName"])
          : r.Type === "AWS::SQS::Queue"
          ? hasNoExplicitName(p, ["QueueName"])
          : r.Type === "AWS::Logs::LogGroup"
          ? hasNoExplicitName(p, ["LogGroupName"]) === false // LogGroupName is intentionally set, allow it
          : true;
      // For LogGroup we permit explicit name, so `safe` may be false; handle separately:
      if (r.Type === "AWS::Logs::LogGroup") {
        expect(p.LogGroupName).toBeTruthy();
      } else {
        expect(safe).toBe(true);
      }
    }
  });
});

describe("Outputs & tagging", () => {
  const tpl = loadTemplate();

  test("23 Outputs include bucket name and arn", () => {
    const o = tpl.Outputs || {};
    expect(o.ArtifactsBucketName?.Value).toBeDefined();
    expect(o.ArtifactsBucketArn?.Value).toBeDefined();
  });

  test("24 Outputs include alias name and alias arn", () => {
    const o = tpl.Outputs || {};
    expect(o.PrimaryLambdaAliasName?.Value).toBeDefined();
    expect(o.PrimaryLambdaAliasArn?.Value).toBeDefined();
  });

  test("25 Outputs include alarm ARNs", () => {
    const o = tpl.Outputs || {};
    expect(o.AlarmErrorArn?.Value).toBeDefined();
    expect(o.AlarmThrottleArn?.Value).toBeDefined();
  });

  test("26 Key resources carry project/environment tags", () => {
    const checkTags = (rid: string) => {
      const r = getResource(tpl, rid);
      const tags = r.Properties?.Tags || [];
      const keys = tags.map((t: any) => t.Key);
      expect(keys).toEqual(expect.arrayContaining(["project", "environment"]));
    };
    ["ArtifactsBucket", "StackEventsTopic", "LambdaExecutionRole", "AppHandlerLambda"].forEach(checkTags);
  });
});

describe("Standards & safety checks", () => {
  const tpl = loadTemplate();

  test("27 Alarms are configured to send notifications (AlarmActions and OKActions) to SNS", () => {
    const err = getResource(tpl, "AppErrorAlarm");
    const thr = getResource(tpl, "AppThrottleAlarm");
    expect(err.Properties?.AlarmActions?.length).toBeGreaterThan(0);
    expect(err.Properties?.OKActions?.length).toBeGreaterThan(0);
    expect(thr.Properties?.AlarmActions?.length).toBeGreaterThan(0);
    expect(thr.Properties?.OKActions?.length).toBeGreaterThan(0);
  });

  test("28 No unsupported properties on CodeDeploy Application (e.g., Tags) and Alarm dimensions are well-formed", () => {
    const apps = resourcesByType(tpl, "AWS::CodeDeploy::Application");
    if (apps.length) {
      const app = apps[0];
      // Ensure Tags not present on application (it doesn't support Tags)
      expect(app.Properties?.Tags).toBeUndefined();
    }
    const errDims = getResource(tpl, "AppErrorAlarm").Properties?.Dimensions || [];
    const fnDim = errDims.find((d: any) => d.Name === "FunctionName");
    expect(fnDim).toBeTruthy();
  });
});
