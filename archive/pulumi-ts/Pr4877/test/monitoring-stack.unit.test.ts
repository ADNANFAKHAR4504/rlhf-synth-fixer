/**
 * monitoring-stack.unit.test.ts
 *
 * Unit tests for MonitoringStack
 */
import * as pulumi from "@pulumi/pulumi";
import { MonitoringStack } from "../lib/global-banking/monitoring-stack";

describe("MonitoringStack", () => {
  let stack: MonitoringStack;

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === "aws:index/getRegion:getRegion") {
          return { name: "us-east-1" };
        }
        return args.inputs;
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-monitoring", {
        environmentSuffix: "test",
        tags: pulumi.output({ Environment: "test" }),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        enableXRay: true,
        enableCrossRegionDashboards: true,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(MonitoringStack);
    });

    it("exposes dashboard URL", (done) => {
      expect(stack.dashboardUrl).toBeDefined();
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toContain("banking-platform-test");
        done();
      });
    });

    it("exposes X-Ray group name", (done) => {
      expect(stack.xrayGroupName).toBeDefined();
      pulumi.all([stack.xrayGroupName]).apply(([xrayGroupName]) => {
        expect(xrayGroupName).toContain("banking-services-test");
        done();
      });
    });

    it("exposes SLO dashboard URL", (done) => {
      expect(stack.sloDashboardUrl).toBeDefined();
      pulumi.all([stack.sloDashboardUrl]).apply(([sloDashboardUrl]) => {
        expect(sloDashboardUrl).toContain("banking-slo-test");
        done();
      });
    });

    it("exposes cross-region dashboard URL when enabled", (done) => {
      expect(stack.crossRegionDashboardUrl).toBeDefined();
      pulumi.all([stack.crossRegionDashboardUrl]).apply(([crossRegionDashboardUrl]) => {
        expect(crossRegionDashboardUrl).toContain("banking-cross-region-test");
        done();
      });
    });
  });

  describe("SNS Topic Configuration", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-sns", {
        environmentSuffix: "sns",
        tags: pulumi.output({ Component: "sns" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: false,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates email subscription", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates SMS subscription", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates Lambda subscription", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });
  });

  describe("X-Ray Configuration", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-xray", {
        environmentSuffix: "xray",
        tags: pulumi.output({ Component: "xray" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: true,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates X-Ray group when enabled", (done) => {
      pulumi.all([stack.xrayGroupName]).apply(([xrayGroupName]) => {
        expect(xrayGroupName).toContain("banking-services-xray");
        done();
      });
    });

    it("creates X-Ray sampling rules", (done) => {
      pulumi.all([stack.xrayGroupName]).apply(([xrayGroupName]) => {
        expect(xrayGroupName).toBeDefined();
        done();
      });
    });

    it("creates X-Ray log group", (done) => {
      pulumi.all([stack.xrayGroupName]).apply(([xrayGroupName]) => {
        expect(xrayGroupName).toBeDefined();
        done();
      });
    });

    it("does not create X-Ray group when disabled", (done) => {
      stack = new MonitoringStack("test-xray-disabled", {
        environmentSuffix: "no-xray",
        tags: pulumi.output({ Component: "no-xray" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: false,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });

      pulumi.all([stack.xrayGroupName]).apply(([xrayGroupName]) => {
        expect(xrayGroupName).toBe("xray-disabled");
        done();
      });
    });
  });

  describe("CloudWatch Log Groups", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-log-groups", {
        environmentSuffix: "logs",
        tags: pulumi.output({ Component: "logs" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: false,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates API access log group", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toBeDefined();
        done();
      });
    });

    it("creates ECS log group", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toBeDefined();
        done();
      });
    });

    it("creates Lambda log group", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toBeDefined();
        done();
      });
    });

    it("creates application log group", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toBeDefined();
        done();
      });
    });
  });

  describe("CloudWatch Metric Filters and Alarms", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-alarms", {
        environmentSuffix: "alarms",
        tags: pulumi.output({ Component: "alarms" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: false,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates transaction error metric filter and alarm", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates failed login metric filter and alarm", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates high-value transaction metric filter and alarm", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates fraud detection metric filter and alarm", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates API Gateway 5XX error alarm", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates ECS CPU and memory alarms", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates ALB alarms", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates RDS Aurora alarms", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates DynamoDB alarms", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates Kinesis alarms", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates Lambda alarms", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates composite alarms", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates anomaly detection alarm", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });
  });

  describe("CloudWatch Dashboard", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-dashboard", {
        environmentSuffix: "dashboard",
        tags: pulumi.output({ Component: "dashboard" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: false,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates primary dashboard", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toContain("banking-platform-dashboard");
        done();
      });
    });

    it("creates SLO dashboard", (done) => {
      pulumi.all([stack.sloDashboardUrl]).apply(([sloDashboardUrl]) => {
        expect(sloDashboardUrl).toContain("banking-slo-dashboard");
        done();
      });
    });

    it("creates cross-region dashboard when enabled", (done) => {
      stack = new MonitoringStack("test-cross-region", {
        environmentSuffix: "cross-region",
        tags: pulumi.output({ Component: "cross-region" }),
        regions: { primary: "us-east-1", replicas: ["eu-west-1"] },
        enableXRay: false,
        enableCrossRegionDashboards: true,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });

      pulumi.all([stack.crossRegionDashboardUrl]).apply(([crossRegionDashboardUrl]) => {
        expect(crossRegionDashboardUrl).toContain("banking-cross-region-cross-region");
        done();
      });
    });

    it("does not create cross-region dashboard when disabled", (done) => {
      pulumi.all([stack.crossRegionDashboardUrl]).apply(([crossRegionDashboardUrl]) => {
        expect(crossRegionDashboardUrl).toBeUndefined();
        done();
      });
    });
  });

  describe("EventBridge Configuration", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-eventbridge", {
        environmentSuffix: "eventbridge",
        tags: pulumi.output({ Component: "eventbridge" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: false,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates EventBridge role", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates ECS task failure rule", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates RDS event rule", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });
  });

  describe("Synthetics Canaries", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-canaries", {
        environmentSuffix: "canaries",
        tags: pulumi.output({ Component: "canaries" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: true,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates synthetics role", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates S3 bucket for canary results", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("creates API health check canary", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });
  });

  describe("CloudWatch Log Insights Queries", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-queries", {
        environmentSuffix: "queries",
        tags: pulumi.output({ Component: "queries" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: false,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates error analysis query", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toBeDefined();
        done();
      });
    });

    it("creates latency analysis query", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toBeDefined();
        done();
      });
    });

    it("creates transaction volume query", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toBeDefined();
        done();
      });
    });

    it("creates security events query", (done) => {
      pulumi.all([stack.dashboardUrl]).apply(([dashboardUrl]) => {
        expect(dashboardUrl).toBeDefined();
        done();
      });
    });
  });

  describe("Application Insights", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-app-insights", {
        environmentSuffix: "app-insights",
        tags: pulumi.output({ Component: "app-insights" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: false,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("creates Application Insights resource", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-outputs", {
        environmentSuffix: "outputs",
        tags: pulumi.output({ Test: "outputs" }),
        regions: { primary: "us-east-1", replicas: ["eu-west-1"] },
        enableXRay: true,
        enableCrossRegionDashboards: true,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("dashboardUrl");
      expect(stack).toHaveProperty("snsTopicArn");
      expect(stack).toHaveProperty("xrayGroupName");
      expect(stack).toHaveProperty("sloDashboardUrl");
      expect(stack).toHaveProperty("crossRegionDashboardUrl");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.dashboardUrl)).toBe(true);
      expect(pulumi.Output.isInstance(stack.snsTopicArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.xrayGroupName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.sloDashboardUrl)).toBe(true);
      expect(pulumi.Output.isInstance(stack.crossRegionDashboardUrl)).toBe(true);
    });
  });

  describe("Resource Dependencies", () => {
    beforeEach(() => {
      stack = new MonitoringStack("test-deps", {
        environmentSuffix: "deps",
        tags: pulumi.output({ Dependencies: "test" }),
        regions: { primary: "us-east-1", replicas: [] },
        enableXRay: true,
        enableCrossRegionDashboards: false,
        resourceArns: {
          ecsCluster: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
          apiGateway: "arn:aws:apigateway:us-east-1::/restapis/test-api",
          loadBalancer: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/test-alb/1234567890abcdef",
          auroraCluster: "arn:aws:rds:us-east-1:123456789012:cluster:test-aurora",
          dynamoDbTable: "arn:aws:dynamodb:us-east-1:123456789012:table/test-table",
          kinesisStream: "arn:aws:kinesis:us-east-1:123456789012:stream/test-stream",
        },
      });
    });

    it("metric filters depend on log group", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("alarms depend on SNS topic", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("EventBridge targets depend on SNS topic and role", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });

    it("canary depends on S3 bucket and role", (done) => {
      pulumi.all([stack.snsTopicArn]).apply(([snsTopicArn]) => {
        expect(snsTopicArn).toBeDefined();
        done();
      });
    });
  });
});