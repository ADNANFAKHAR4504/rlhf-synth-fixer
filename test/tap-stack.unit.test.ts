// tests/tap-stack.unit.test.ts
import { Testing } from "cdktf";
import { MultiRegionDrStack } from "../lib/tap-stack"; // Use the correct class name

describe("MultiRegionDrStack Unit Tests", () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app({ stackTraces: false });
    const stack = new MultiRegionDrStack(app, "MultiRegionDrStack"); // Use the correct stack name
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResources = (type: string) => Object.values(synthesized.resource[type] || {});

  describe("Provider and Region Setup", () => {
    it("should configure AWS providers for us-east-1 and us-west-2", () => {
      expect(synthesized.provider.aws).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ alias: "us-east-1", region: "us-east-1" }),
          expect.objectContaining({ alias: "us-west-2", region: "us-west-2" }),
        ])
      );
    });
  });

  describe("Regional Infrastructure Components", () => {
    it("should create a VPC in each region", () => {
      expect(findResources("aws_vpc")).toHaveLength(2);
    });

    it("should create 8 subnets total (2 public, 2 private per region)", () => {
      expect(findResources("aws_subnet")).toHaveLength(8); // 4 per region
    });

    it("should create an ALB with listener in each region", () => {
      expect(findResources("aws_lb")).toHaveLength(2);
      expect(findResources("aws_lb_listener")).toHaveLength(2);
    });

    it("should create an ECS Cluster and Service in each region", () => {
      expect(findResources("aws_ecs_cluster")).toHaveLength(2);
      expect(findResources("aws_ecs_service")).toHaveLength(2);
    });

    it("should create an Aurora PostgreSQL cluster in each region", () => {
      expect(findResources("aws_rds_cluster")).toHaveLength(2);
      expect(findResources("aws_rds_cluster_instance")).toHaveLength(2); // One instance per cluster
      expect(findResources("aws_db_subnet_group")).toHaveLength(2);
    });

    it("should create a KMS key for encryption in each region", () => {
      // One main key in primary, one regional key per RDS cluster
      expect(findResources("aws_kms_key")).toHaveLength(3);
    });

    it("should create Secrets Manager resources for DB credentials", () => {
      expect(findResources("aws_secretsmanager_secret")).toHaveLength(1); // Only one secret needed
      expect(findResources("aws_secretsmanager_secret_version")).toHaveLength(1);
    });
  });

  describe("Cross-Region Components", () => {
    it("should create Transit Gateways and attachments", () => {
      expect(findResources("aws_ec2_transit_gateway")).toHaveLength(2); // One per region
      expect(findResources("aws_ec2_transit_gateway_vpc_attachment")).toHaveLength(2); // One per VPC
    });

    it("should create Route 53 resources for failover", () => {
      expect(findResources("aws_route53_zone")).toHaveLength(1);
      expect(findResources("aws_route53_health_check")).toHaveLength(2); // One per region
      expect(findResources("aws_route53_record")).toHaveLength(2); // Primary and Secondary records
    });

    it("should create CloudWatch alarms for health checks", () => {
      expect(findResources("aws_cloudwatch_metric_alarm")).toHaveLength(2); // One per health check
    });
  });


  describe("Outputs", () => {
    it("should have all required outputs defined", () => {
      expect(synthesized.output).toHaveProperty("PrimaryAuroraClusterArn");
      expect(synthesized.output).toHaveProperty("DRAuroraClusterArn");
      expect(synthesized.output).toHaveProperty("PrimaryAlbDnsName");
      expect(synthesized.output).toHaveProperty("DrAlbDnsName");
      expect(synthesized.output).toHaveProperty("Route53FailoverDns");
      expect(synthesized.output).toHaveProperty("ECSServicePrimary");
      expect(synthesized.output).toHaveProperty("ECSServiceDR");
      expect(synthesized.output).toHaveProperty("TransitGatewayId");
    });
  });
});
