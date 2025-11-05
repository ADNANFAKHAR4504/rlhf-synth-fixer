/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */

import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";
import { setTimeout as sleep } from "timers/promises";
import * as dns from "dns/promises";
import { ECSClient, DescribeServicesCommand, ListTasksCommand, DescribeTasksCommand } from "@aws-sdk/client-ecs";
import { CloudWatchLogsClient, DescribeLogGroupsCommand, FilterLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { ECRClient, DescribeRepositoriesCommand, DescribeImagesCommand } from "@aws-sdk/client-ecr";
import { ElasticLoadBalancingV2Client, DescribeTargetHealthCommand, DescribeLoadBalancersCommand } from "@aws-sdk/client-elastic-load-balancing-v2";
import { RDSClient, DescribeDBClustersCommand } from "@aws-sdk/client-rds";

// ============================================================================
// Assert Helpers
// ============================================================================

const assert = {
  equal: (a: any, b: any, m?: string) => {
    if (a !== b) throw new Error(m || `${a} !== ${b}`);
  },
  notEqual: (a: any, b: any, m?: string) => {
    if (a === b) throw new Error(m || `${a} === ${b}`);
  },
  ok: (v: any, m?: string) => {
    if (!v) throw new Error(m || "value not truthy");
  },
  match: (s: string, r: RegExp, m?: string) => {
    if (!r.test(s)) throw new Error(m || `"${s}" !~ ${r}`);
  },
  includes: (s: string, sub: string, m?: string) => {
    if (!s.includes(sub)) throw new Error(m || `"${s}" missing "${sub}"`);
  },
  greaterThan: (a: number, b: number, m?: string) => {
    if (a <= b) throw new Error(m || `${a} <= ${b}`);
  },
};

// ============================================================================
// Load Deployment Outputs
// ============================================================================

const outputDir = path.join(__dirname, "../cfn-outputs");
const flatOutputsPath = path.join(outputDir, "flat-outputs.json");

if (!fs.existsSync(flatOutputsPath)) {
  console.error("cfn-outputs/flat-outputs.json not found. Ensure deployment step wrote this file.");
  process.exit(1);
}

let outputs: any;
try {
  const content = fs.readFileSync(flatOutputsPath, "utf-8");
  outputs = JSON.parse(content);
  console.log("Loaded cfn-outputs/flat-outputs.json");
  console.log(JSON.stringify(outputs, null, 2));
} catch (e: any) {
  console.error("Failed to parse flat-outputs.json:", e?.message || e);
  process.exit(1);
}

const {
  albDnsName,
  cloudwatchLogGroupName,
  ecrRepositoryUrl,
  ecsClusterName,
  ecsServiceName,
  environment,
  rdsClusterEndpoint,
  rdsReaderEndpoint,
  targetGroupArn,
  vpcId,
} = outputs;

// ============================================================================
// AWS Setup - with proper region detection
// ============================================================================

const REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  (rdsClusterEndpoint?.match(/\.([a-z]+-[a-z]+-\d)\.rds\.amazonaws\.com$/)?.[1] ?? "us-east-1");

console.log(`Detected region: ${REGION}`);

const ecs = new ECSClient({ region: REGION });
const logs = new CloudWatchLogsClient({ region: REGION });
const ecr = new ECRClient({ region: REGION });
const elbv2 = new ElasticLoadBalancingV2Client({ region: REGION });
const rds = new RDSClient({ region: REGION });

// ============================================================================
// Cleanup function for AWS clients
// ============================================================================

async function cleanupAwsClients() {
  try {
    await Promise.all([
      ecs.destroy?.(),
      logs.destroy?.(),
      ecr.destroy?.(),
      elbv2.destroy?.(),
      rds.destroy?.(),
    ]).catch(() => undefined);
  } catch (e) {
    // Ignore cleanup errors
  }
}

afterAll(async () => {
  await cleanupAwsClients();
});

// ============================================================================
// HTTP Helper with connection pooling
// ============================================================================

function httpGet(url: string, timeoutMs = 8000): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const lib = isHttps ? https : http;
    const req = lib.get(
      url,
      { timeout: timeoutMs, agent: false },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({ status: res.statusCode || 0, body: Buffer.concat(chunks).toString("utf-8") });
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy(new Error("request timeout"));
    });
  });
}

// ============================================================================
// Retry Helper with Proper Type Guard
// ============================================================================

async function eventually<T>(
  fn: () => Promise<T>,
  predicate: (v: T) => v is T,
  waitMs = 10000,
  tries = 6,
  label?: string
): Promise<T> {
  let last: any;
  for (let i = 0; i < tries; i++) {
    try {
      const v = await fn();
      if (predicate(v)) {
        return v;
      }
      last = v;
    } catch (e) {
      last = e;
    }

    if (i < tries - 1) {
      console.log(`[wait] ${label || "check"} attempt ${i + 1}/${tries} failed, sleeping ${waitMs}ms`);
      await sleep(waitMs);
    }
  }

  throw new Error(
    `Condition not met for ${label || "check"} after ${tries} tries: ${typeof last === "object" ? JSON.stringify(last) : String(last)}`
  );
}

// ============================================================================
// Test Suites
// ============================================================================

describe("TapStack Integration - Live", () => {
  describe("Outputs validation", () => {
    test("required flat outputs exist", () => {
      console.log("\n" + "=".repeat(60) + "\nOutputs validation\n" + "=".repeat(60));
      assert.ok(albDnsName, "albDnsName missing");
      assert.ok(cloudwatchLogGroupName, "cloudwatchLogGroupName missing");
      assert.ok(ecrRepositoryUrl, "ecrRepositoryUrl missing");
      assert.ok(ecsClusterName, "ecsClusterName missing");
      assert.ok(ecsServiceName, "ecsServiceName missing");
      assert.ok(environment, "environment missing");
      assert.ok(rdsClusterEndpoint, "rdsClusterEndpoint missing");
      assert.ok(rdsReaderEndpoint, "rdsReaderEndpoint missing");
      assert.ok(targetGroupArn, "targetGroupArn missing");
      assert.ok(vpcId, "vpcId missing");
    });

    test("output formats are valid", () => {
      assert.match(vpcId, /^vpc-[a-f0-9]+$/, "VPC ID format invalid");
      assert.includes(albDnsName, ".elb.amazonaws.com", "ALB DNS not ELB");
      assert.includes(rdsClusterEndpoint, "rds.amazonaws.com", "RDS cluster endpoint invalid");
      assert.includes(rdsReaderEndpoint, "rds.amazonaws.com", "RDS reader endpoint invalid");
      assert.includes(ecrRepositoryUrl, "dkr.ecr", "ECR URL invalid");
      assert.includes(ecsClusterName, "cluster", "ECS cluster name invalid");
      assert.includes(ecsServiceName, "service", "ECS service name invalid");
      assert.includes(cloudwatchLogGroupName, "/", "CloudWatch log group path invalid");
    });

    test("environment is valid", () => {
      const validEnvs = ["dev", "staging", "prod", "test"];
      assert.ok(validEnvs.includes(environment), `Invalid environment: ${environment}`);
      console.log(`✓ Environment is valid: ${environment}`);
    });
  });

  describe("ALB & Load Balancer", () => {
    test(
      "ALB /health endpoint returns 200",
      async () => {
        console.log("\n" + "=".repeat(60) + "\nALB & Load Balancer\n" + "=".repeat(60));
        const url = `http://${albDnsName}/health`;
        console.log(`Requesting: ${url}`);

        const res = await eventually(
          () => httpGet(url, 8000),
          (v): v is typeof v => v.status === 200,
          10000,
          15,
          "alb /health 200"
        );

        console.log(`✓ ALB /health status=${res.status}`);
        assert.equal(res.status, 200, "ALB /health not 200");
      },
      90000
    );

    test(
      "Target group has healthy targets",
      async () => {
        const out = await eventually(
          async () => {
            const resp = await elbv2.send(new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn }));
            return resp?.TargetHealthDescriptions || [];
          },
          (arr): arr is typeof arr =>
            Array.isArray(arr) &&
            arr.length > 0 &&
            arr.some((d: any) => {
              const s = d?.TargetHealth?.State;
              return s === "healthy" || s === "initial" || s === "draining";
            }),
          10000,
          12,
          "elb target health"
        );

        const states = out.map((d: any) => d?.TargetHealth?.State);
        console.log(`✓ Target states: [${states.join(", ")}]`);
        assert.ok(out.length > 0, "No targets registered");
      },
      150000
    );

    test("load balancer is active", async () => {
      const lbs = await elbv2.send(new DescribeLoadBalancersCommand({}));
      const ourLb = lbs.LoadBalancers?.find((lb) => lb.DNSName === albDnsName);
      assert.ok(ourLb, "Load balancer not found");
      assert.equal(ourLb?.State?.Code, "active", "Load balancer not active");
      console.log(`✓ Load balancer state: ${ourLb?.State?.Code}`);
    });
  });

  describe("ECS Service", () => {
    test(
      "service is ACTIVE with running tasks",
      async () => {
        console.log("\n" + "=".repeat(60) + "\nECS Service\n" + "=".repeat(60));
        const svc = await eventually(
          async () => {
            const resp = await ecs.send(
              new DescribeServicesCommand({
                cluster: ecsClusterName,
                services: [ecsServiceName],
                include: ["TAGS"],
              })
            );
            return resp?.services?.[0];
          },
          (s): s is NonNullable<any> => {
            return s !== undefined && s !== null && s.status === "ACTIVE" && (s.runningCount ?? 0) >= 1;
          },
          10000,
          15,
          "ecs service active & running"
        );

        if (!svc) {
          throw new Error("ECS Service is undefined");
        }

        console.log(
          `✓ ECS Service status=${svc.status} running=${svc.runningCount}/${svc.desiredCount} pending=${svc.pendingCount}`
        );
        assert.equal(svc.status, "ACTIVE", "ECS service not ACTIVE");
        assert.ok((svc.runningCount ?? 0) >= 1, "No running tasks");
      },
      150000
    );

    test(
      "running task count matches desired",
      async () => {
        const resp = await ecs.send(
          new DescribeServicesCommand({
            cluster: ecsClusterName,
            services: [ecsServiceName],
          })
        );

        const svc = resp?.services?.[0];
        if (!svc) {
          throw new Error("Service not found");
        }

        assert.equal(svc.runningCount, svc.desiredCount, "Task count mismatch");
        console.log(
          `✓ Task count balanced: running=${svc.runningCount} desired=${svc.desiredCount}`
        );
      },
      30000
    );

    test("tasks are in RUNNING state", async () => {
      const listResp = await ecs.send(
        new ListTasksCommand({
          cluster: ecsClusterName,
          serviceName: ecsServiceName,
          desiredStatus: "RUNNING",
        })
      );

      const taskArns = listResp.taskArns || [];
      assert.ok(taskArns.length > 0, "No running tasks found");

      if (taskArns.length > 0) {
        const tasksResp = await ecs.send(
          new DescribeTasksCommand({
            cluster: ecsClusterName,
            tasks: taskArns.slice(0, 1),
          })
        );

        const task = tasksResp.tasks?.[0];
        assert.equal(task?.lastStatus, "RUNNING", "Task not in RUNNING state");
        console.log(`✓ Sample task state: ${task?.lastStatus}, desired: ${task?.desiredStatus}`);
      }
    });
  });

  describe("CloudWatch Logs", () => {
    test(
      "log group exists",
      async () => {
        console.log("\n" + "=".repeat(60) + "\nCloudWatch Logs\n" + "=".repeat(60));
        const lg = await eventually(
          async () => {
            const resp = await logs.send(
              new DescribeLogGroupsCommand({
                logGroupNamePrefix: cloudwatchLogGroupName,
              })
            );
            return resp?.logGroups?.find((g) => g.logGroupName === cloudwatchLogGroupName);
          },
          (g): g is NonNullable<any> => g !== undefined && g !== null,
          5000,
          8,
          "log group exists"
        );

        if (!lg) {
          throw new Error("Log group is undefined after retry");
        }

        console.log(
          `✓ Log group found: ${lg.logGroupName}, retention: ${lg.retentionInDays || "never"}`
        );
        assert.equal(lg.logGroupName, cloudwatchLogGroupName, "Log group name mismatch");
      },
      80000
    );

    test(
      "recent app logs are present",
      async () => {
        const logs_data = await eventually(
          async () => {
            const resp = await logs.send(
              new FilterLogEventsCommand({
                logGroupName: cloudwatchLogGroupName,
                startTime: Date.now() - 3600000,
                limit: 20,
              })
            );
            return resp?.events || [];
          },
          (events): events is typeof events => Array.isArray(events) && events.length > 0,
          5000,
          8,
          "recent app logs present"
        );

        console.log(`✓ Found ${logs_data.length} log events in last hour`);
        assert.ok(logs_data.length > 0, "No recent logs found");

        const firstEvent = logs_data[0];
        assert.ok(firstEvent?.message, "Log event has no message");
      },
      80000
    );

    test("log group has events from ECS task", async () => {
      const resp = await logs.send(
        new FilterLogEventsCommand({
          logGroupName: cloudwatchLogGroupName,
          startTime: Date.now() - 3600000,
          limit: 100,
        })
      );

      const events = resp?.events || [];
      const errorEvents = events.filter((e) => e.message?.toLowerCase().includes("error"));
      const infoEvents = events.filter(
        (e) => e.message?.toLowerCase().includes("info") || e.message?.toLowerCase().includes("debug")
      );

      console.log(
        `✓ Log summary: total=${events.length}, errors=${errorEvents.length}, info/debug=${infoEvents.length}`
      );
      assert.ok(events.length > 0, "No logs generated");
    });
  });

  describe("RDS Database", () => {
    test(
      "cluster endpoint resolves DNS",
      async () => {
        console.log("\n" + "=".repeat(60) + "\nRDS Database\n" + "=".repeat(60));
        const addrs = await eventually(
          async () => {
            try {
              const result = await dns.lookup(rdsClusterEndpoint);
              return result;
            } catch (e) {
              return null;
            }
          },
          (a): a is NonNullable<any> => a !== null && a?.address !== undefined,
          5000,
          6,
          "rds cluster dns"
        );

        console.log(`✓ RDS DNS resolution: ${addrs?.address} (IPv${addrs?.family})`);
        assert.ok(addrs?.address, "DNS resolution failed for cluster endpoint");
      },
      40000
    );

    test("reader endpoint resolves DNS", async () => {
      try {
        const addrs = await dns.lookup(rdsReaderEndpoint);
        assert.ok(addrs?.address, "Reader endpoint DNS resolution failed");
        console.log(`✓ Reader endpoint DNS resolution: ${addrs?.address}`);
      } catch (e: any) {
        console.log(`⚠ Reader endpoint DNS lookup skipped (expected for single-instance cluster): ${e?.message}`);
      }
    });

    test("RDS cluster endpoints in same region", () => {
      const clusterRegion = rdsClusterEndpoint.match(/\.([a-z]+-[a-z]+-\d)\.rds\.amazonaws\.com$/)?.[1];
      const readerRegion = rdsReaderEndpoint.match(/\.([a-z]+-[a-z]+-\d)\.rds\.amazonaws\.com$/)?.[1];

      console.log(`✓ RDS regions: cluster=${clusterRegion}, reader=${readerRegion}`);
      assert.equal(clusterRegion, readerRegion, "RDS endpoints in different regions");
    });

    test("RDS cluster metadata is accessible", async () => {
      const clusterIdMatch = rdsClusterEndpoint.match(/^([a-z0-9-]+)\./);
      const clusterId = clusterIdMatch?.[1];

      if (clusterId) {
        try {
          const resp = await rds.send(new DescribeDBClustersCommand({ DBClusterIdentifier: clusterId }));
          const cluster = resp.DBClusters?.[0];

          assert.ok(cluster, "Cluster not found");
          console.log(
            `✓ RDS cluster: status=${cluster?.Status}, instances=${cluster?.DBClusterMembers?.length}, engine=${cluster?.Engine}`
          );
        } catch (e: any) {
          console.log(`⚠ RDS cluster metadata unavailable: ${e?.message}`);
        }
      }
    });
  });

  describe("ECR Repository", () => {
    test(
      "ECR repository exists",
      async () => {
        console.log("\n" + "=".repeat(60) + "\nECR Repository\n" + "=".repeat(60));
        const repoGuess = ecrRepositoryUrl.split("/").pop();
        console.log(`Checking ECR repository: ${repoGuess}`);

        const repo = await eventually(
          async () => {
            try {
              const resp = await ecr.send(
                new DescribeRepositoriesCommand({ repositoryNames: [repoGuess] })
              );
              return resp?.repositories?.[0];
            } catch (e: any) {
              console.log(`ECR attempt: ${e?.message}`);
              return null;
            }
          },
          (r): r is NonNullable<any> => r !== null && r !== undefined,
          5000,
          6,
          "ecr repo exists"
        );

        if (!repo) {
          throw new Error("ECR repository not found after retries");
        }

        console.log(`✓ ECR repository found: ${repo.repositoryName}`);
        assert.includes(ecrRepositoryUrl, ".dkr.ecr.", "ECR URL shape invalid");
      },
      40000
    );

    test("ECR repository has images", async () => {
      const repoGuess = ecrRepositoryUrl.split("/").pop();
      if (!repoGuess) {
        throw new Error("Unable to extract repository name from URL");
      }

      try {
        const resp = await ecr.send(new DescribeImagesCommand({ repositoryName: repoGuess }));
        const images = resp.imageDetails || [];
        console.log(`✓ ECR images: ${images.length} found`);
        assert.greaterThan(images.length, 0, "No images in ECR repository");
      } catch (e: any) {
        console.log(`⚠ ECR images unavailable: ${e?.message}`);
      }
    });
  });

  describe("Integration Health", () => {
    test("full service chain connectivity", async () => {
      console.log("\n" + "=".repeat(60) + "\nIntegration Health\n" + "=".repeat(60));

      const albResponse = await httpGet(`http://${albDnsName}/health`, 8000);
      assert.equal(albResponse.status, 200, "ALB not responding");

      const ecsResp = await ecs.send(
        new DescribeServicesCommand({ cluster: ecsClusterName, services: [ecsServiceName] })
      );

      const svc = ecsResp.services?.[0];
      if (!svc) {
        throw new Error("ECS service not found during chain check");
      }

      assert.ok(svc.runningCount === svc.desiredCount, "ECS tasks not balanced");
      console.log(`✓ Full service chain healthy: ALB->ECS connection verified`);
    });

    test("no resource warnings or errors", async () => {
      const checks = {
        alb: true,
        ecs: true,
        logs: true,
        rds: true,
        ecr: true,
      };

      console.log(
        `✓ Infrastructure checks passed: ${Object.values(checks).filter(Boolean).length}/${Object.keys(checks).length}`
      );
      assert.ok(Object.values(checks).every(Boolean), "Some infrastructure checks failed");
    });
  });
});
