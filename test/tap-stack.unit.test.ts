import * as fs from "fs";
import * as path from "path";

const yamlPath = path.resolve(__dirname, "../lib/TapStack.yml");
const jsonPath = path.resolve(__dirname, "../lib/TapStack.json");

// Utility: safe file read
function readFileSafe(p: string): string {
  expect(fs.existsSync(p)).toBe(true);
  return fs.readFileSync(p, "utf8");
}

// Utility: find YAML section existence by regex
function expectMatch(text: string, re: RegExp, hint?: string) {
  const ok = re.test(text);
  if (!ok) {
    // Helpful failure message
    // eslint-disable-next-line no-console
    console.error(`Pattern not found${hint ? ` (${hint})` : ""}:`, re);
  }
  expect(ok).toBe(true);
}

describe("TapStack templates — existence & basic sanity", () => {
  it("YAML file exists at ../lib/TapStack.yml", () => {
    expect(fs.existsSync(yamlPath)).toBe(true);
  });

  it("JSON file exists at ../lib/TapStack.json", () => {
    expect(fs.existsSync(jsonPath)).toBe(true);
  });

  it("JSON parses successfully", () => {
    const raw = readFileSafe(jsonPath);
    const obj = JSON.parse(raw);
    expect(typeof obj).toBe("object");
    expect(obj).toBeTruthy();
  });
});

describe("TapStack.yml — global / parameters / validations", () => {
  const yaml = readFileSafe(yamlPath);

  it("Contains AWSTemplateFormatVersion and Description", () => {
    expectMatch(yaml, /AWSTemplateFormatVersion:\s*'2010-09-09'/);
    expectMatch(yaml, /Description:\s*>/);
  });

  it("MetricNamespace parameter present with sensible default", () => {
    expectMatch(yaml, /MetricNamespace:[\s\S]*Default:\s*Payments\/Observability/);
  });

  it("Contains threshold parameters (error, latency p95, success) with defaults", () => {
    expectMatch(yaml, /ThresholdErrorRateCritical:[\s\S]*Default:\s*5/);
    expectMatch(yaml, /ThresholdErrorRateWarning:[\s\S]*Default:\s*2/);
    expectMatch(yaml, /ThresholdLatencyP95Critical:[\s\S]*Default:\s*1500/);
    expectMatch(yaml, /ThresholdLatencyP95Warning:[\s\S]*Default:\s*800/);
    expectMatch(yaml, /ThresholdSuccessRateCritical:[\s\S]*Default:\s*95/);
    expectMatch(yaml, /ThresholdSuccessRateWarning:[\s\S]*Default:\s*98/);
  });
});

describe("TapStack.yml — SSM thresholds are written by the stack (no external dependency)", () => {
  const yaml = readFileSafe(yamlPath);

  it("SSM parameters for error rate thresholds are created", () => {
    expectMatch(yaml, /Type:\s*AWS::SSM::Parameter[\s\S]*\/payments\/\${EnvironmentSuffix}\/thresholds\/errorRate\/critical/);
    expectMatch(yaml, /Type:\s*AWS::SSM::Parameter[\s\S]*\/payments\/\${EnvironmentSuffix}\/thresholds\/errorRate\/warning/);
  });

  it("SSM parameters for latency and success thresholds are created", () => {
    expectMatch(yaml, /\/thresholds\/latencyP95\/critical/);
    expectMatch(yaml, /\/thresholds\/latencyP95\/warning/);
    expectMatch(yaml, /\/thresholds\/successRate\/critical/);
    expectMatch(yaml, /\/thresholds\/successRate\/warning/);
  });
});

describe("TapStack.yml — Log groups & retention", () => {
  const yaml = readFileSafe(yamlPath);

  it("Application log group with 90-day retention", () => {
    expectMatch(yaml, /Type:\s*AWS::Logs::LogGroup[\s\S]*\/payments\/app\/\${EnvironmentSuffix}[\s\S]*RetentionInDays:\s*90/);
  });

  it("VPC flow logs log group with 90-day retention", () => {
    expectMatch(yaml, /Type:\s*AWS::Logs::LogGroup[\s\S]*\/payments\/vpcflow\/\${EnvironmentSuffix}[\s\S]*RetentionInDays:\s*90/);
  });

  it("Functions log group with 90-day retention", () => {
    expectMatch(yaml, /Type:\s*AWS::Logs::LogGroup[\s\S]*\/payments\/functions\/\${EnvironmentSuffix}[\s\S]*RetentionInDays:\s*90/);
  });
});

describe("TapStack.yml — Metric filters and custom metrics", () => {
  const yaml = readFileSafe(yamlPath);

  it("Metric filter for TransactionsCount is present", () => {
    expectMatch(yaml, /AWS::Logs::MetricFilter[\s\S]*TransactionsCount-\${EnvironmentSuffix}/);
  });

  it("Metric filters for SUCCESS and ERROR are present", () => {
    expectMatch(yaml, /AWS::Logs::MetricFilter[\s\S]*TransactionsSuccess-\${EnvironmentSuffix}/);
    expectMatch(yaml, /AWS::Logs::MetricFilter[\s\S]*TransactionsErrors-\${EnvironmentSuffix}/);
  });

  it("Metric filter for latency_ms exists and emits milliseconds", () => {
    expectMatch(yaml, /AWS::Logs::MetricFilter[\s\S]*LatencyMs-\${EnvironmentSuffix}[\s\S]*Unit:\s*Milliseconds/);
  });
});

describe("TapStack.yml — SNS topics & subscriptions", () => {
  const yaml = readFileSafe(yamlPath);

  it("Critical/Warning/Info topics are defined with ENV suffix", () => {
    expectMatch(yaml, /TopicName:\s*!\s*Sub\s*"Alerts-Critical-\${EnvironmentSuffix}"/);
    expectMatch(yaml, /TopicName:\s*!\s*Sub\s*"Alerts-Warning-\${EnvironmentSuffix}"/);
    expectMatch(yaml, /TopicName:\s*!\s*Sub\s*"Alerts-Info-\${EnvironmentSuffix}"/);
  });

  it("Email and SMS subscriptions configured for each severity", () => {
    expectMatch(yaml, /AWS::SNS::Subscription[\s\S]*TopicArn:[\s\S]*TopicCritical[\s\S]*Protocol:\s*email/);
    expectMatch(yaml, /AWS::SNS::Subscription[\s\S]*TopicArn:[\s\S]*TopicCritical[\s\S]*Protocol:\s*sms/);
    expectMatch(yaml, /AWS::SNS::Subscription[\s\S]*TopicArn:[\s\S]*TopicWarning[\s\S]*Protocol:\s*email/);
    expectMatch(yaml, /AWS::SNS::Subscription[\s\S]*TopicArn:[\s\S]*TopicWarning[\s\S]*Protocol:\s*sms/);
    expectMatch(yaml, /AWS::SNS::Subscription[\s\S]*TopicArn:[\s\S]*TopicInfo[\s\S]*Protocol:\s*email/);
    expectMatch(yaml, /AWS::SNS::Subscription[\s\S]*TopicArn:[\s\S]*TopicInfo[\s\S]*Protocol:\s*sms/);
  });
});

describe("TapStack.yml — Alarms (error rate, latency p95, success rate) with safe metric math", () => {
  const yaml = readFileSafe(yamlPath);

  it("ErrorRateCritical uses IF(total>0,(errors/total)*100,0)", () => {
    expectMatch(yaml, /AlarmName:\s*!\s*Sub\s*"ErrorRateCritical-\${EnvironmentSuffix}"[\s\S]*Expression:\s*"IF\(total>0,\(errors\/total\)\*100,0\)"/);
  });

  it("SuccessRateCritical uses IF(total>0,(success/total)*100,100)", () => {
    expectMatch(yaml, /AlarmName:\s*!\s*Sub\s*"SuccessRateCritical-\${EnvironmentSuffix}"[\s\S]*Expression:\s*"IF\(total>0,\(success\/total\)\*100,100\)"/);
  });

  it("LatencyP95Critical uses p95 stat on LatencyMs metric", () => {
    expectMatch(yaml, /AlarmName:\s*!\s*Sub\s*"LatencyP95Critical-\${EnvironmentSuffix}"[\s\S]*Stat:\s*p95/);
  });
});

describe("TapStack.yml — Composite health alarm & composite alarm rule", () => {
  const yaml = readFileSafe(yamlPath);

  it("ServiceHealthCritical has a single ReturnData:true expression (health)", () => {
    // Check presence of health expression and only one ReturnData: true in that block
    const blockMatch = yaml.match(/AlarmName:\s*!\s*Sub\s*"ServiceHealthCritical-\${EnvironmentSuffix}"[\s\S]*?AlarmActions:/);
    expect(blockMatch).toBeTruthy();
    const block = blockMatch![0];
    const trueCount = (block.match(/ReturnData:\s*true/g) || []).length;
    expect(trueCount).toBe(1);
    expect(block).toMatch(/Id:\s*health[\s\S]*ReturnData:\s*true/);
  });

  it("CompositeCritical AlarmRule is a single line without leading/trailing whitespace", () => {
    // Should be like: AlarmRule: !Sub "ALARM(\"${AlarmErrorRateCritical.Arn}\") OR ..."
    const lineMatch = yaml.match(/AlarmRule:\s*!\s*Sub\s*".+"/);
    expect(lineMatch).toBeTruthy();
    // Ensure it doesn't span multiple lines
    if (lineMatch) {
      expect(lineMatch[0]).not.toMatch(/\n/);
      // Ensure starts right after the quote and ends with quote (no trailing spaces before final quote)
      expect(lineMatch[0]).toMatch(/AlarmRule:\s*!\s*Sub\s*"[^\s].*[^\s]"/);
    }
  });
});

describe("TapStack.yml — EventBridge remediation flow", () => {
  const yaml = readFileSafe(yamlPath);

  it("Defines a Lambda function with python3.12 runtime", () => {
    expectMatch(yaml, /Type:\s*AWS::Lambda::Function[\s\S]*Runtime:\s*python3\.12/);
  });

  it("EventBridge Rule filters on CloudWatch Alarm State Change and ALARM state", () => {
    expectMatch(yaml, /Type:\s*AWS::Events::Rule[\s\S]*detail-type:[\s\S]*CloudWatch Alarm State Change/);
    expectMatch(yaml, /detail:[\s\S]*state:[\s\S]*value:[\s\S]*- ALARM/);
  });

  it("Lambda permission allows events.amazonaws.com to invoke the function", () => {
    expectMatch(yaml, /Type:\s*AWS::Lambda::Permission[\s\S]*Principal:\s*events\.amazonaws\.com/);
  });
});

describe("TapStack.yml — Logs Insights saved queries & dashboard", () => {
  const yaml = readFileSafe(yamlPath);

  it("Saved queries include TopErrors and P95LatencyByComponent", () => {
    expectMatch(yaml, /Type:\s*AWS::Logs::QueryDefinition[\s\S]*Name:\s*!\s*Sub\s*"TopErrorsLast15m-\${EnvironmentSuffix}"/);
    expectMatch(yaml, /Type:\s*AWS::Logs::QueryDefinition[\s\S]*Name:\s*!\s*Sub\s*"P95LatencyByComponent1h-\${EnvironmentSuffix}"/);
  });

  it("Dashboard has liveData charts and Success Rate expression uses IF() safe division", () => {
    expectMatch(yaml, /Type:\s*AWS::CloudWatch::Dashboard/);
    expectMatch(yaml, /"liveData":\s*true/);
    expectMatch(yaml, /"expression":\s*"IF\(m1>0,\(m2\/m1\)\*100,100\)"/);
  });
});

describe("TapStack.yml — Outputs sanity", () => {
  const yaml = readFileSafe(yamlPath);

  it("Outputs include DashboardUrl and Topic ARNs", () => {
    expectMatch(yaml, /Outputs:\s*[\s\S]*DashboardUrl:/);
    expectMatch(yaml, /TopicCriticalArn:/);
    expectMatch(yaml, /TopicWarningArn:/);
    expectMatch(yaml, /TopicInfoArn:/);
  });

  it("AlarmNames output includes CompositeCritical", () => {
    expectMatch(yaml, /AlarmNames:[\s\S]*CompositeCritical/);
  });
});
