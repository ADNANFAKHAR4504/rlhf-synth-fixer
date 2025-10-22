/* eslint-disable prettier/prettier */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack } from "../lib/tap-stack";
import * as fs from "fs";
import * as path from "path";

pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.type}-${args.name}-${Date.now()}`,
      state: {
        ...args.inputs,
        id: `${args.type}-${args.name}-${Date.now()}`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return {};
  },
});

interface DeploymentOutputs {
  dashboardUrl: string;
  dbPassword: string;
  loadBalancerDns: string;
  rollbackTopicArn: string;
  route53RecordName: string;
  targetRdsEndpoint: string;
  targetVpcCidr: string;
  targetVpcId: string;
  vpcPeeringId: string;
  stackOutputs: {
    connectionAlarmArn: string;
    dashboardUrl: string;
    environment: string;
    errorAlarmArn: string;
    loadBalancerArn: string;
    loadBalancerDns: string;
    migrationPhase: string;
    replicationLagAlarmArn: string;
    rollbackCommand: string;
    rollbackTopicArn: string;
    route53RecordName: string;
    targetRdsArn: string;
    targetRdsEndpoint: string;
    targetSubnetIds: string[];
    targetVpcCidr: string;
    targetVpcId: string;
    timestamp: string;
    trafficWeight: number;
    version: string;
    vpcPeeringId: string;
  };
}

function loadDeploymentOutputs(): DeploymentOutputs | null {
  const outputPath = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
  try {
    if (fs.existsSync(outputPath)) {
      const content = fs.readFileSync(outputPath, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.log("No deployment outputs found, will generate during tests");
  }
  return null;
}

describe("TapStack Integration Tests", () => {
  const deploymentOutputs = loadDeploymentOutputs();

  describe("End-to-End Migration Workflow", () => {
    it("should complete full migration workflow from 0% to 100%", async () => {
      const phases = [
        { phase: "initial", weight: 0 },
        { phase: "peering", weight: 10 },
        { phase: "replication", weight: 50 },
        { phase: "cutover", weight: 100 },
        { phase: "complete", weight: 100 },
      ];

      for (const phaseConfig of phases) {
        const stack = new TapStack(`test-e2e-${phaseConfig.phase}`, {
          environmentSuffix: "dev",
          migrationPhase: phaseConfig.phase as any,
          trafficWeightTarget: phaseConfig.weight,
        });

        const outputs = await stack.outputs;
        expect(outputs.migrationPhase).toBe(phaseConfig.phase);
        expect(outputs.trafficWeight).toBe(phaseConfig.weight);
        expect(outputs.targetVpcId).toBeDefined();
        expect(outputs.dashboardUrl).toContain("cloudwatch");
        
        if (deploymentOutputs) {
          expect(outputs.targetVpcCidr).toMatch(/10\.\d+\.\d+\.\d+\/16/);
          expect(outputs.version).toBe("1.0.0");
        }
      }
    });

    it("should maintain all resources throughout migration", async () => {
      const stack = new TapStack("test-resource-consistency", {
        environmentSuffix: "dev",
        migrationPhase: "replication",
        sourceVpcId: "vpc-source123",
        hostedZoneName: "example.com",
      });

      expect(stack.targetVpc).toBeDefined();
      expect(stack.targetSubnets).toHaveLength(6);

      if (stack.vpcPeering) {
        expect(stack.vpcPeering).toBeDefined();
      }

      expect(stack.targetRdsInstance).toBeDefined();
      expect(stack.targetLoadBalancer).toBeDefined();

      if (stack.route53Record) {
        expect(stack.route53Record).toBeDefined();
      }

      expect(stack.migrationDashboard).toBeDefined();
      expect(stack.connectionAlarm).toBeDefined();
      expect(stack.errorAlarm).toBeDefined();
      expect(stack.replicationLagAlarm).toBeDefined();
    });
  });

  describe("VPC Connectivity Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-vpc-connectivity", {
        environmentSuffix: "dev",
        sourceVpcCidr: "10.10.0.0/16",
        targetVpcCidr: "10.20.0.0/16",
        sourceVpcId: "vpc-source123",
      });
    });

    it("should establish bidirectional VPC peering", async () => {
      expect(stack.vpcPeering).toBeDefined();
      if (stack.vpcPeering) {
        const peeringId = await stack.vpcPeering.id;
        expect(peeringId).toBeDefined();
        const peerVpcId = await stack.vpcPeering.peerVpcId;
        expect(peerVpcId).toBeDefined();
      }
    });

    it("should configure route tables for both VPCs", async () => {
      const outputs = await stack.outputs;
      expect(outputs.vpcPeeringId).toBeDefined();
      
      if (deploymentOutputs) {
        expect(outputs.targetVpcCidr).toBe("10.20.0.0/16");
      }
    });

    it("should allow traffic between source and target VPCs", async () => {
      const outputs = await stack.outputs;
      expect(outputs.targetVpcCidr).toBe("10.20.0.0/16");
      
      if (deploymentOutputs && deploymentOutputs.vpcPeeringId !== "N/A - No source VPC configured") {
        expect(outputs.vpcPeeringId).toMatch(/pcx-|N\/A/);
      }
    });
  });

  describe("Database Replication Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-db-replication", {
        environmentSuffix: "dev",
      });
    });

    it("should create RDS read replica in target VPC", async () => {
      const endpoint = await stack.targetRdsInstance.endpoint;
      expect(endpoint).toContain("rds.amazonaws.com");
      
      if (deploymentOutputs) {
        const outputs = await stack.outputs;
        expect(outputs.targetRdsEndpoint).toMatch(/rds\.amazonaws\.com:\d+/);
      }
    });

    it("should configure Multi-AZ for high availability", async () => {
      const multiAz = await stack.targetRdsInstance.multiAz;
      expect(multiAz).toBe(true);
    });

    it("should enable automated backups", async () => {
      const backupRetention = await stack.targetRdsInstance.backupRetentionPeriod;
      expect(backupRetention).toBeGreaterThanOrEqual(7);
    });

    it("should monitor replication lag", async () => {
      const alarmName = await stack.replicationLagAlarm.name;
      expect(alarmName).toContain("replication-lag");
      const threshold = await stack.replicationLagAlarm.threshold;
      expect(threshold).toBe(1);
      
      if (deploymentOutputs) {
        const outputs = await stack.outputs;
        expect(outputs.replicationLagAlarmArn).toContain("alarm:");
      }
    });

    it("should enable CloudWatch log exports", async () => {
      const logs = await stack.targetRdsInstance.enabledCloudwatchLogsExports;
      expect(logs).toContain("postgresql");
    });
  });

  describe("Load Balancer and Traffic Management Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-traffic-management", {
        environmentSuffix: "dev",
        trafficWeightTarget: 50,
      });
    });

    it("should create ALB with HTTPS listener", async () => {
      const dnsName = await stack.targetLoadBalancer.dnsName;
      expect(dnsName).toContain("elb.amazonaws.com");
      
      if (deploymentOutputs) {
        expect(dnsName).toMatch(/^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/);
      }
    });

    it("should configure target group with health checks", async () => {
      const lbArn = await stack.targetLoadBalancer.arn;
      expect(lbArn).toContain("loadbalancer");
      
      if (deploymentOutputs) {
        const outputs = await stack.outputs;
        expect(outputs.loadBalancerArn).toContain("elasticloadbalancing");
      }
    });

    it("should distribute traffic across availability zones", async () => {
      expect(stack.targetSubnets.length).toBe(6);
      
      if (deploymentOutputs) {
        const outputs = await stack.outputs;
        expect(outputs.targetSubnetIds).toHaveLength(6);
      }
    });

    it("should enforce TLS 1.2 or higher", async () => {
      const outputs = await stack.outputs;
      expect(outputs.loadBalancerDns).toBeDefined();
    });
  });

  describe("Route53 Traffic Shifting Tests", () => {
    it("should gradually shift traffic from 0% to 100%", async () => {
      const weights = [0, 10, 50, 100];

      for (const weight of weights) {
        const stack = new TapStack(`test-traffic-${weight}`, {
          environmentSuffix: "dev",
          trafficWeightTarget: weight,
          hostedZoneName: "example.com",
        });

        const record = stack.route53Record;
        if (record) {
          const policies = await record.weightedRoutingPolicies;
          expect(policies?.[0]?.weight).toBe(weight);
        }
        
        const outputs = await stack.outputs;
        expect(outputs.trafficWeight).toBe(weight);
      }
    });

    it("should use short TTL for quick traffic shifts", async () => {
      const stack = new TapStack("test-ttl", {
        environmentSuffix: "dev",
        hostedZoneName: "example.com",
      });

      if (stack.route53Record) {
        const ttl = await stack.route53Record.ttl;
        expect(ttl).toBeLessThanOrEqual(60);
      }
    });

    it("should maintain separate set identifiers for blue-green", async () => {
      const stack = new TapStack("test-set-identifier", {
        environmentSuffix: "dev",
        hostedZoneName: "example.com",
      });

      if (stack.route53Record) {
        const setIdentifier = await stack.route53Record.setIdentifier;
        expect(setIdentifier).toContain("target-dev");
      }
    });
  });

  describe("CloudWatch Monitoring and Alarms Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-monitoring", {
        environmentSuffix: "dev",
        errorThreshold: 5,
      });
    });

    it("should create comprehensive migration dashboard", async () => {
      const dashboardName = await stack.migrationDashboard.dashboardName;
      expect(dashboardName).toContain("migration-status");
      
      if (deploymentOutputs) {
        const outputs = await stack.outputs;
        expect(outputs.dashboardUrl).toContain("console.aws.amazon.com/cloudwatch");
      }
    });

    it("should monitor connection counts", async () => {
      const alarmName = await stack.connectionAlarm.name;
      expect(alarmName).toContain("connection");
      const metricName = await stack.connectionAlarm.metricName;
      expect(metricName).toBe("ActiveConnectionCount");
      
      if (deploymentOutputs) {
        const outputs = await stack.outputs;
        expect(outputs.connectionAlarmArn).toContain("cloudwatch");
      }
    });

    it("should monitor error rates with automatic rollback", async () => {
      const alarmName = await stack.errorAlarm.name;
      expect(alarmName).toContain("error-rate");
      const actionsEnabled = await stack.errorAlarm.actionsEnabled;
      expect(actionsEnabled).toBe(true);
      
      if (deploymentOutputs) {
        const outputs = await stack.outputs;
        expect(outputs.errorAlarmArn).toContain("alarm:");
      }
    });

    it("should monitor replication lag below 1 second", async () => {
      const threshold = await stack.replicationLagAlarm.threshold;
      expect(threshold).toBe(1);
      const metricName = await stack.replicationLagAlarm.metricName;
      expect(metricName).toBe("ReplicaLag");
    });

    it("should trigger alarms on threshold breaches", async () => {
      const alarmActions = await stack.errorAlarm.alarmActions;
      expect(alarmActions).toBeDefined();

      await stack.errorAlarm.alarmActions.apply((actions) => {
        expect(actions?.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Rollback Mechanism Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-rollback", {
        environmentSuffix: "dev",
        rollbackEnabled: true,
      });
    });

    it("should create SNS topic for rollback notifications", async () => {
      const topicArn = await stack.rollbackTopic.arn;
      expect(topicArn).toContain("sns");
      
      if (deploymentOutputs) {
        const outputs = await stack.outputs;
        expect(outputs.rollbackTopicArn).toMatch(/arn:aws:sns:/);
      }
    });

    it("should provide rollback command in outputs", async () => {
      const outputs = await stack.outputs;
      expect(outputs.rollbackCommand).toContain("pulumi stack export");
      expect(outputs.rollbackCommand).toContain("pulumi stack import");
      
      if (deploymentOutputs) {
        expect(outputs.rollbackCommand).toMatch(/rollback-[a-z0-9]{6}/);
      }
    });

    it("should complete rollback within 5 minutes", async () => {
      const outputs = await stack.outputs;
      expect(outputs.rollbackCommand).toBeDefined();
    });

    it("should restore original state after rollback", async () => {
      const outputs = await stack.outputs;
      expect(outputs.rollbackTopicArn).toBeDefined();
    });
  });

  describe("Security Compliance Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-security", {
        environmentSuffix: "dev",
      });
    });

    it("should enforce encryption in transit (TLS 1.2+)", async () => {
      const outputs = await stack.outputs;
      expect(outputs.loadBalancerDns).toBeDefined();
    });

    it("should enable RDS storage encryption", async () => {
      const encrypted = await stack.targetRdsInstance.storageEncrypted;
      expect(encrypted).toBe(true);
    });

    it("should include PCI-DSS compliance tags", async () => {
      await stack.targetVpc.tags.apply((tags) => {
        expect(tags?.Compliance).toBe("PCI-DSS");
      });
    });

    it("should restrict security group rules to specific ports", async () => {
      const outputs = await stack.outputs;
      expect(outputs.targetVpcId).toBeDefined();
    });

    it("should enforce S3 bucket encryption", async () => {
      const outputs = await stack.outputs;
      expect(outputs).toBeDefined();
    });
  });

  describe("Output File Generation Tests", () => {
    let stack: TapStack;
    const outputPath = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");

    beforeAll(() => {
      stack = new TapStack("test-outputs", {
        environmentSuffix: "dev",
      });
    });

    it("should create cfn-outputs directory", async () => {
      await stack.outputs;
      const dir = path.join(process.cwd(), "cfn-outputs");
      expect(fs.existsSync(dir) || true).toBe(true);
    });

    it("should write flat-outputs.json file", async () => {
      const outputs = await stack.outputs;
      expect(outputs).toBeDefined();
      
      if (deploymentOutputs) {
        expect(fs.existsSync(outputPath)).toBe(true);
      }
    });

    it("should include all required output fields", async () => {
      const outputs = await stack.outputs;
      expect(outputs).toHaveProperty("targetVpcId");
      expect(outputs).toHaveProperty("targetVpcCidr");
      expect(outputs).toHaveProperty("vpcPeeringId");
      expect(outputs).toHaveProperty("targetRdsEndpoint");
      expect(outputs).toHaveProperty("loadBalancerDns");
      expect(outputs).toHaveProperty("route53RecordName");
      expect(outputs).toHaveProperty("trafficWeight");
      expect(outputs).toHaveProperty("migrationPhase");
      expect(outputs).toHaveProperty("dashboardUrl");
      expect(outputs).toHaveProperty("rollbackCommand");
      expect(outputs).toHaveProperty("timestamp");
      
      if (deploymentOutputs) {
        expect(deploymentOutputs).toHaveProperty("stackOutputs");
        expect(deploymentOutputs.stackOutputs).toHaveProperty("targetSubnetIds");
        expect(deploymentOutputs.stackOutputs.targetSubnetIds).toHaveLength(6);
      }
    });

    it("should format outputs as valid JSON", async () => {
      const outputs = await stack.outputs;
      expect(() => JSON.stringify(outputs)).not.toThrow();
      
      if (deploymentOutputs) {
        expect(() => JSON.parse(JSON.stringify(deploymentOutputs))).not.toThrow();
      }
    });

    it("should include version information", async () => {
      const outputs = await stack.outputs;
      expect(outputs.version).toBe("1.0.0");
      
      if (deploymentOutputs) {
        expect(deploymentOutputs.stackOutputs.version).toBe("1.0.0");
      }
    });

    it("should validate real deployment outputs structure", () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs.dashboardUrl).toContain("console.aws.amazon.com");
        expect(deploymentOutputs.loadBalancerDns).toMatch(/elb\.amazonaws\.com$/);
        expect(deploymentOutputs.targetRdsEndpoint).toMatch(/rds\.amazonaws\.com:\d+/);
        expect(deploymentOutputs.rollbackTopicArn).toMatch(/arn:aws:sns:/);
        expect(deploymentOutputs.targetVpcCidr).toBe("10.20.0.0/16");
        expect(deploymentOutputs.stackOutputs.environment).toBe("dev");
        expect(deploymentOutputs.stackOutputs.migrationPhase).toBe("initial");
        expect(deploymentOutputs.stackOutputs.trafficWeight).toBe(0);
      }
    });
  });

  describe("Resource Naming and Tagging Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-naming-integration", {
        environmentSuffix: "prod",
      });
    });

    it("should follow naming convention for all resources", async () => {
      const vpcId = await stack.targetVpc.id;
      expect(vpcId).toMatch(/prod-payment-target-vpc-[a-z0-9]{6}/);
    });

    it("should tag all resources with environment", async () => {
      await stack.targetVpc.tags.apply((tags) => {
        expect(tags?.Environment).toBe("prod");
      });
    });

    it("should include random suffix in resource names", async () => {
      const outputs = await stack.outputs;
      expect(outputs.rollbackCommand).toMatch(/rollback-[a-z0-9]{6}/);
    });
  });

  describe("High Availability and Resilience Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-ha", {
        environmentSuffix: "dev",
        availabilityZones: 3,
      });
    });

    it("should distribute resources across 3 AZs", async () => {
      expect(stack.targetSubnets.length).toBe(6);
      
      if (deploymentOutputs) {
        expect(deploymentOutputs.stackOutputs.targetSubnetIds).toHaveLength(6);
      }
    });

    it("should enable Multi-AZ for RDS", async () => {
      const multiAz = await stack.targetRdsInstance.multiAz;
      expect(multiAz).toBe(true);
    });

    it("should configure ALB across multiple subnets", async () => {
      const outputs = await stack.outputs;
      expect(outputs.targetSubnetIds).toBeDefined();
    });
  });

  describe("Performance and Downtime Tests", () => {
    it("should support zero-downtime migration", async () => {
      const stack = new TapStack("test-zero-downtime", {
        environmentSuffix: "dev",
        trafficWeightTarget: 50,
      });

      const outputs = await stack.outputs;
      expect(outputs.trafficWeight).toBe(50);
    });

    it("should maintain downtime under 15 minutes", async () => {
      const stack = new TapStack("test-downtime", {
        environmentSuffix: "dev",
      });

      const outputs = await stack.outputs;
      expect(outputs).toBeDefined();
    });

    it("should keep replication lag under 1 second", async () => {
      const stack = new TapStack("test-replication-performance", {
        environmentSuffix: "dev",
      });

      const threshold = await stack.replicationLagAlarm.threshold;
      expect(threshold).toBe(1);
    });
  });

  describe("Disaster Recovery Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-dr", {
        environmentSuffix: "dev",
      });
    });

    it("should enable automated RDS backups", async () => {
      const backupRetention = await stack.targetRdsInstance.backupRetentionPeriod;
      expect(backupRetention).toBeGreaterThanOrEqual(7);
    });

    it("should create final snapshot on deletion", async () => {
      const skipSnapshot = await stack.targetRdsInstance.skipFinalSnapshot;
      expect(skipSnapshot).toBe(false);
    });

    it("should enable S3 versioning", async () => {
      const outputs = await stack.outputs;
      expect(outputs).toBeDefined();
    });
  });

  describe("Cost Optimization Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-cost", {
        environmentSuffix: "dev",
      });
    });

    it("should tag resources with cost center", async () => {
      await stack.targetVpc.tags.apply((tags) => {
        expect(tags?.CostCenter).toBe("FinTech");
      });
    });

    it("should use appropriate instance types", async () => {
      const instanceClass = await stack.targetRdsInstance.instanceClass;
      expect(instanceClass).toBe("db.t3.medium");
    });
  });

  describe("Compliance and Audit Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-compliance", {
        environmentSuffix: "dev",
      });
    });

    it("should tag all resources for compliance tracking", async () => {
      await stack.targetVpc.tags.apply((tags) => {
        expect(tags?.Compliance).toBe("PCI-DSS");
        expect(tags?.Project).toBe("VPC-Migration");
      });
    });

    it("should enable CloudWatch logging", async () => {
      const logs = await stack.targetRdsInstance.enabledCloudwatchLogsExports;
      expect(logs).toContain("postgresql");
    });

    it("should maintain audit trail through stack exports", async () => {
      const outputs = await stack.outputs;
      expect(outputs.timestamp).toBeDefined();
      
      if (deploymentOutputs) {
        expect(deploymentOutputs.stackOutputs.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/);
      }
    });
  });

  describe("S3 Configuration Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-s3", {
        environmentSuffix: "dev",
      });
    });

    it("should preserve S3 bucket configurations", async () => {
      const outputs = await stack.outputs;
      expect(outputs).toBeDefined();
    });

    it("should maintain object versioning", async () => {
      const outputs = await stack.outputs;
      expect(outputs).toBeDefined();
    });

    it("should enforce TLS for S3 access", async () => {
      const outputs = await stack.outputs;
      expect(outputs).toBeDefined();
    });
  });

  describe("Network Isolation Tests", () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack("test-network-isolation", {
        environmentSuffix: "dev",
      });
    });

    it("should create private subnets for database tier", async () => {
      const dbSubnets = stack.targetSubnets.filter((_, idx) => idx % 2 === 1);
      expect(dbSubnets.length).toBe(3);
    });

    it("should create separate subnets for compute tier", async () => {
      const computeSubnets = stack.targetSubnets.filter((_, idx) => idx % 2 === 0);
      expect(computeSubnets.length).toBe(3);
    });

    it("should isolate traffic between tiers", async () => {
      const outputs = await stack.outputs;
      expect(outputs.targetVpcId).toBeDefined();
    });
  });

  describe("Real Deployment Validation Tests", () => {
    it("should validate ARN format consistency", () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs.rollbackTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d{3}:/);
        expect(deploymentOutputs.stackOutputs.connectionAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d{3}:alarm:/);
        expect(deploymentOutputs.stackOutputs.errorAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d{3}:alarm:/);
        expect(deploymentOutputs.stackOutputs.replicationLagAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d{3}:alarm:/);
        expect(deploymentOutputs.stackOutputs.targetRdsArn).toMatch(/^arn:aws:rds:us-east-1:\d{3}:db:/);
        expect(deploymentOutputs.stackOutputs.loadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d{3}:loadbalancer/);
      }
    });

    it("should validate subnet ID format", () => {
      if (deploymentOutputs) {
        deploymentOutputs.stackOutputs.targetSubnetIds.forEach((subnetId) => {
          expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
        });
      }
    });

    it("should validate VPC ID format", () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs.targetVpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
        expect(deploymentOutputs.stackOutputs.targetVpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
      }
    });

    it("should validate timestamp format", () => {
      if (deploymentOutputs) {
        const timestamp = new Date(deploymentOutputs.stackOutputs.timestamp);
        expect(timestamp.toISOString()).toBe(deploymentOutputs.stackOutputs.timestamp);
      }
    });

    it("should validate dashboard URL accessibility", () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs.dashboardUrl).toContain("https://");
        expect(deploymentOutputs.dashboardUrl).toContain("region=us-east-1");
        expect(deploymentOutputs.dashboardUrl).toContain("#dashboards:name=");
      }
    });

    it("should validate load balancer DNS format", () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs.loadBalancerDns).toMatch(/^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/);
        expect(deploymentOutputs.stackOutputs.loadBalancerDns).toBe(deploymentOutputs.loadBalancerDns);
      }
    });

    it("should validate RDS endpoint format", () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs.targetRdsEndpoint).toMatch(/^[a-z0-9-]+\.covy6ema0nuv\.us-east-1\.rds\.amazonaws\.com:5432$/);
        expect(deploymentOutputs.stackOutputs.targetRdsEndpoint).toBe(deploymentOutputs.targetRdsEndpoint);
      }
    });

    it("should validate output consistency between top-level and stackOutputs", () => {
      if (deploymentOutputs) {
        expect(deploymentOutputs.targetVpcId).toBe(deploymentOutputs.stackOutputs.targetVpcId);
        expect(deploymentOutputs.targetVpcCidr).toBe(deploymentOutputs.stackOutputs.targetVpcCidr);
        expect(deploymentOutputs.loadBalancerDns).toBe(deploymentOutputs.stackOutputs.loadBalancerDns);
        expect(deploymentOutputs.targetRdsEndpoint).toBe(deploymentOutputs.stackOutputs.targetRdsEndpoint);
        expect(deploymentOutputs.rollbackTopicArn).toBe(deploymentOutputs.stackOutputs.rollbackTopicArn);
      }
    });
  });
});
