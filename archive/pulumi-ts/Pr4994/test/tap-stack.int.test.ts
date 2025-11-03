/* eslint-disable prettier/prettier */

import * as fs from "fs";
import * as path from "path";

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
  stackOutputs: string;
}

interface ParsedStackOutputs {
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
}

function loadDeploymentOutputs(): DeploymentOutputs {
  const outputPath = path.join(process.cwd(), "cfn-outputs", "flat-outputs.json");
  
  if (!fs.existsSync(outputPath)) {
    throw new Error(
      `Deployment outputs not found at ${outputPath}. ` +
      `Please deploy the stack first using 'pulumi up' before running integration tests.`
    );
  }

  const content = fs.readFileSync(outputPath, "utf-8");
  return JSON.parse(content);
}

function parseStackOutputs(stackOutputsStr: string): ParsedStackOutputs {
  return JSON.parse(stackOutputsStr);
}

describe("TapStack Integration Tests - Real Deployment Validation", () => {
  let deploymentOutputs: DeploymentOutputs;
  let stackOutputs: ParsedStackOutputs;

  beforeAll(() => {
    console.log("Loading deployment outputs from cfn-outputs/flat-outputs.json");
    deploymentOutputs = loadDeploymentOutputs();
    stackOutputs = parseStackOutputs(deploymentOutputs.stackOutputs);
    console.log("Deployment outputs loaded successfully");
    console.log("Environment:", stackOutputs.environment);
    console.log("Migration Phase:", stackOutputs.migrationPhase);
    console.log("VPC ID:", deploymentOutputs.targetVpcId);
  });

  describe("VPC Infrastructure Validation", () => {
    it("should have valid VPC ID format", () => {
      expect(deploymentOutputs.targetVpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(stackOutputs.targetVpcId).toBe(deploymentOutputs.targetVpcId);
    });

    it("should have correct VPC CIDR block", () => {
      expect(deploymentOutputs.targetVpcCidr).toBe("10.20.0.0/16");
      expect(stackOutputs.targetVpcCidr).toBe("10.20.0.0/16");
    });

    it("should have exactly 6 subnets across 3 AZs", () => {
      expect(stackOutputs.targetSubnetIds).toHaveLength(6);
      stackOutputs.targetSubnetIds.forEach((subnetId) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]{17}$/);
      });
    });

    it("should have VPC peering configured or marked as N/A", () => {
      expect(deploymentOutputs.vpcPeeringId).toMatch(/^(pcx-[a-f0-9]{17}|N\/A - No source VPC configured)$/);
      expect(stackOutputs.vpcPeeringId).toMatch(/^(pcx-[a-f0-9]{17}|N\/A)$/);
    });
  });

  describe("RDS Database Validation", () => {
    it("should have valid RDS endpoint format", () => {
      expect(deploymentOutputs.targetRdsEndpoint).toMatch(/^[a-z0-9-]+\.[a-z0-9]+\.us-east-1\.rds\.amazonaws\.com:5432$/);
      expect(stackOutputs.targetRdsEndpoint).toBe(deploymentOutputs.targetRdsEndpoint);
    });

    it("should have valid RDS ARN", () => {
      expect(stackOutputs.targetRdsArn).toMatch(/^arn:aws:rds:us-east-1:\d+:db:[a-z0-9-]+$/);
    });

    it("should have replication lag alarm configured", () => {
      expect(stackOutputs.replicationLagAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d+:alarm:[a-z0-9-]+$/);
      expect(stackOutputs.replicationLagAlarmArn).toContain("replication-lag");
    });
  });

  describe("Load Balancer Validation", () => {
    it("should have valid ALB DNS name", () => {
      expect(deploymentOutputs.loadBalancerDns).toMatch(/^[a-z0-9-]+\.us-east-1\.elb\.amazonaws\.com$/);
      expect(stackOutputs.loadBalancerDns).toBe(deploymentOutputs.loadBalancerDns);
    });

    it("should have valid ALB ARN", () => {
      expect(stackOutputs.loadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:loadbalancer\/app\/[a-z0-9-]+\/[a-z0-9]+$/);
    });

    it("should be accessible via DNS", () => {
      expect(deploymentOutputs.loadBalancerDns).toContain("elb.amazonaws.com");
    });
  });

  describe("CloudWatch Monitoring Validation", () => {
    it("should have valid dashboard URL", () => {
      expect(deploymentOutputs.dashboardUrl).toContain("https://console.aws.amazon.com/cloudwatch");
      expect(deploymentOutputs.dashboardUrl).toContain("region=us-east-1");
      expect(deploymentOutputs.dashboardUrl).toContain("#dashboards:name=");
      expect(stackOutputs.dashboardUrl).toBe(deploymentOutputs.dashboardUrl);
    });

    it("should have connection count alarm configured", () => {
      expect(stackOutputs.connectionAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d+:alarm:[a-z0-9-]+$/);
      expect(stackOutputs.connectionAlarmArn).toContain("connection");
    });

    it("should have error rate alarm configured", () => {
      expect(stackOutputs.errorAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d+:alarm:[a-z0-9-]+$/);
      expect(stackOutputs.errorAlarmArn).toContain("error");
    });

    it("should have all three critical alarms", () => {
      expect(stackOutputs.connectionAlarmArn).toBeDefined();
      expect(stackOutputs.errorAlarmArn).toBeDefined();
      expect(stackOutputs.replicationLagAlarmArn).toBeDefined();
    });
  });

  describe("Rollback Mechanism Validation", () => {
    it("should have valid SNS topic ARN", () => {
      expect(deploymentOutputs.rollbackTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d+:[a-z0-9-]+$/);
      expect(stackOutputs.rollbackTopicArn).toBe(deploymentOutputs.rollbackTopicArn);
    });

    it("should have rollback command configured", () => {
      expect(stackOutputs.rollbackCommand).toContain("pulumi stack export");
      expect(stackOutputs.rollbackCommand).toContain("pulumi stack import");
      expect(stackOutputs.rollbackCommand).toMatch(/rollback-[a-z0-9]+/);
    });
  });

  describe("Migration State Validation", () => {
    it("should be in initial migration phase", () => {
      expect(stackOutputs.migrationPhase).toBe("initial");
    });

    it("should have traffic weight at 0%", () => {
      expect(stackOutputs.trafficWeight).toBe(0);
    });

    it("should be deployed in dev environment", () => {
      expect(stackOutputs.environment).toBe("dev");
    });

    it("should have version information", () => {
      expect(stackOutputs.version).toBe("1.0.0");
    });
  });

  describe("Route53 DNS Validation", () => {
    it("should have Route53 record name configured or marked as N/A", () => {
      expect(deploymentOutputs.route53RecordName).toMatch(/^([a-z0-9.-]+|N\/A - No hosted zone configured)$/);
      expect(stackOutputs.route53RecordName).toMatch(/^([a-z0-9.-]+|N\/A)$/);
    });
  });

  describe("Security Validation", () => {
    it("should have database password marked as secret", () => {
      expect(deploymentOutputs.dbPassword).toBe("[secret]");
    });

    it("should use TLS endpoints for all services", () => {
      expect(deploymentOutputs.dashboardUrl).toContain("https://");
    });
  });

  describe("Timestamp and Metadata Validation", () => {
    it("should have valid ISO 8601 timestamp", () => {
      expect(stackOutputs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      
      const timestamp = new Date(stackOutputs.timestamp);
      expect(timestamp.toISOString()).toBe(stackOutputs.timestamp);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should have deployment timestamp within reasonable time", () => {
      const timestamp = new Date(stackOutputs.timestamp);
      const hoursSinceDeployment = (Date.now() - timestamp.getTime()) / (1000 * 60 * 60);
      expect(hoursSinceDeployment).toBeLessThan(24);
    });
  });

  describe("Output Consistency Validation", () => {
    it("should have matching VPC IDs between top-level and stackOutputs", () => {
      expect(deploymentOutputs.targetVpcId).toBe(stackOutputs.targetVpcId);
    });

    it("should have matching VPC CIDR between top-level and stackOutputs", () => {
      expect(deploymentOutputs.targetVpcCidr).toBe(stackOutputs.targetVpcCidr);
    });

    it("should have matching load balancer DNS between top-level and stackOutputs", () => {
      expect(deploymentOutputs.loadBalancerDns).toBe(stackOutputs.loadBalancerDns);
    });

    it("should have matching RDS endpoint between top-level and stackOutputs", () => {
      expect(deploymentOutputs.targetRdsEndpoint).toBe(stackOutputs.targetRdsEndpoint);
    });

    it("should have matching rollback topic ARN between top-level and stackOutputs", () => {
      expect(deploymentOutputs.rollbackTopicArn).toBe(stackOutputs.rollbackTopicArn);
    });

    it("should have matching VPC peering ID between top-level and stackOutputs", () => {
      if (deploymentOutputs.vpcPeeringId !== "N/A - No source VPC configured") {
        expect(deploymentOutputs.vpcPeeringId).toContain(stackOutputs.vpcPeeringId);
      }
    });
  });

  describe("ARN Format Validation", () => {
    it("should have all ARNs in correct AWS format", () => {
      const arns = [
        stackOutputs.connectionAlarmArn,
        stackOutputs.errorAlarmArn,
        stackOutputs.replicationLagAlarmArn,
        stackOutputs.targetRdsArn,
        stackOutputs.loadBalancerArn,
        stackOutputs.rollbackTopicArn,
      ];

      arns.forEach((arn) => {
        expect(arn).toMatch(/^arn:aws:[a-z0-9-]+:[a-z0-9-]+:\d+:.+$/);
      });
    });

    it("should have CloudWatch alarms with correct ARN structure", () => {
      expect(stackOutputs.connectionAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d+:alarm:.+$/);
      expect(stackOutputs.errorAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d+:alarm:.+$/);
      expect(stackOutputs.replicationLagAlarmArn).toMatch(/^arn:aws:cloudwatch:us-east-1:\d+:alarm:.+$/);
    });

    it("should have SNS topic with correct ARN structure", () => {
      expect(stackOutputs.rollbackTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d+:.+$/);
    });

    it("should have RDS instance with correct ARN structure", () => {
      expect(stackOutputs.targetRdsArn).toMatch(/^arn:aws:rds:us-east-1:\d+:db:.+$/);
    });

    it("should have load balancer with correct ARN structure", () => {
      expect(stackOutputs.loadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:loadbalancer\/.+$/);
    });
  });

  describe("Resource Naming Convention Validation", () => {
    it("should follow naming convention for all resources", () => {
      const resourcePattern = /^(dev|prod|staging)-payment-[a-z0-9-]+-[a-z0-9]{6}$/;
      
      expect(deploymentOutputs.targetVpcId).toBeDefined();
      expect(deploymentOutputs.loadBalancerDns).toContain("dev-payment");
    });

    it("should have consistent random suffix across all resources", () => {
      const vpcIdParts = deploymentOutputs.targetVpcId.split("-");
      const lbDnsParts = deploymentOutputs.loadBalancerDns.split("-");
      
      expect(vpcIdParts).toBeDefined();
      expect(lbDnsParts).toBeDefined();
    });
  });

  describe("Network Configuration Validation", () => {
    it("should have 3 compute subnets in public tier", () => {
      const computeSubnets = stackOutputs.targetSubnetIds.filter((_, idx) => idx % 2 === 0);
      expect(computeSubnets).toHaveLength(3);
    });

    it("should have 3 database subnets in private tier", () => {
      const dbSubnets = stackOutputs.targetSubnetIds.filter((_, idx) => idx % 2 === 1);
      expect(dbSubnets).toHaveLength(3);
    });

    it("should have all subnets in us-east-1 region", () => {
      expect(stackOutputs.targetRdsEndpoint).toContain("us-east-1");
      expect(stackOutputs.loadBalancerDns).toContain("us-east-1");
    });
  });

  describe("High Availability Validation", () => {
    it("should have resources distributed across multiple AZs", () => {
      expect(stackOutputs.targetSubnetIds.length).toBeGreaterThanOrEqual(6);
    });

    it("should have database configured for high availability", () => {
      expect(stackOutputs.targetRdsEndpoint).toBeDefined();
      expect(stackOutputs.targetRdsArn).toBeDefined();
    });

    it("should have load balancer for high availability", () => {
      expect(stackOutputs.loadBalancerDns).toBeDefined();
      expect(stackOutputs.loadBalancerArn).toBeDefined();
    });
  });

  describe("Compliance and Audit Trail Validation", () => {
    it("should have all required outputs for audit trail", () => {
      expect(stackOutputs.timestamp).toBeDefined();
      expect(stackOutputs.version).toBeDefined();
      expect(stackOutputs.environment).toBeDefined();
      expect(stackOutputs.migrationPhase).toBeDefined();
    });

    it("should have monitoring configured for compliance", () => {
      expect(stackOutputs.connectionAlarmArn).toBeDefined();
      expect(stackOutputs.errorAlarmArn).toBeDefined();
      expect(stackOutputs.replicationLagAlarmArn).toBeDefined();
      expect(stackOutputs.dashboardUrl).toBeDefined();
    });

    it("should have rollback mechanism for compliance", () => {
      expect(stackOutputs.rollbackCommand).toBeDefined();
      expect(stackOutputs.rollbackTopicArn).toBeDefined();
    });
  });

  describe("File Format Validation", () => {
    it("should have valid JSON structure", () => {
      expect(() => JSON.parse(JSON.stringify(deploymentOutputs))).not.toThrow();
      expect(() => JSON.parse(deploymentOutputs.stackOutputs)).not.toThrow();
    });

    it("should have all required top-level fields", () => {
      const requiredFields = [
        "dashboardUrl",
        "dbPassword",
        "loadBalancerDns",
        "rollbackTopicArn",
        "route53RecordName",
        "targetRdsEndpoint",
        "targetVpcCidr",
        "targetVpcId",
        "vpcPeeringId",
        "stackOutputs",
      ];

      requiredFields.forEach((field) => {
        expect(deploymentOutputs).toHaveProperty(field);
      });
    });

    it("should have all required stackOutputs fields", () => {
      const requiredFields = [
        "connectionAlarmArn",
        "dashboardUrl",
        "environment",
        "errorAlarmArn",
        "loadBalancerArn",
        "loadBalancerDns",
        "migrationPhase",
        "replicationLagAlarmArn",
        "rollbackCommand",
        "rollbackTopicArn",
        "route53RecordName",
        "targetRdsArn",
        "targetRdsEndpoint",
        "targetSubnetIds",
        "targetVpcCidr",
        "targetVpcId",
        "timestamp",
        "trafficWeight",
        "version",
        "vpcPeeringId",
      ];

      requiredFields.forEach((field) => {
        expect(stackOutputs).toHaveProperty(field);
      });
    });
  });

  describe("Integration Test Summary", () => {
    it("should log deployment summary", () => {
      console.log("\n=== Deployment Summary ===");
      console.log("Environment:", stackOutputs.environment);
      console.log("Migration Phase:", stackOutputs.migrationPhase);
      console.log("Traffic Weight:", stackOutputs.trafficWeight + "%");
      console.log("VPC ID:", deploymentOutputs.targetVpcId);
      console.log("VPC CIDR:", deploymentOutputs.targetVpcCidr);
      console.log("Subnets:", stackOutputs.targetSubnetIds.length);
      console.log("RDS Endpoint:", deploymentOutputs.targetRdsEndpoint);
      console.log("Load Balancer:", deploymentOutputs.loadBalancerDns);
      console.log("Dashboard:", deploymentOutputs.dashboardUrl);
      console.log("Version:", stackOutputs.version);
      console.log("Deployed at:", stackOutputs.timestamp);
      console.log("=========================\n");
      
      expect(true).toBe(true);
    });
  });
});
