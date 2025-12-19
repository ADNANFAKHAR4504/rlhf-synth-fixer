import { App, Testing } from "cdktf";
import { TapStack } from "../lib/tap-stack";

describe("VPC Infrastructure Stack", () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Instantiation", () => {
    test("TapStack instantiates successfully with required config", () => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));

      expect(stack).toBeDefined();
      expect(synthesized).toBeDefined();
    });

    test("Stack uses correct region from config", () => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "prod",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));

      const provider = synthesized.provider.aws[0];
      expect(provider.region).toBe("us-east-1");
    });
  });

  describe("VPC Configuration", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("VPC is created with correct CIDR block", () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.cidr_block).toBe("10.0.0.0/16");
    });

    test("VPC has DNS support enabled", () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.enable_dns_hostnames).toBe(true);
      expect(vpc.enable_dns_support).toBe(true);
    });

    test("VPC has appropriate tags", () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toContain("financial-vpc-test");
      expect(vpc.tags.Environment).toBe("test");
    });
  });

  describe("Subnet Configuration", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("Creates exactly 3 public subnets", () => {
      const subnets = Object.values(synthesized.resource.aws_subnet).filter(
        (s: any) => s.tags.Tier === "Public"
      );
      expect(subnets.length).toBe(3);
    });

    test("Creates exactly 3 private subnets", () => {
      const subnets = Object.values(synthesized.resource.aws_subnet).filter(
        (s: any) => s.tags.Tier === "Private"
      );
      expect(subnets.length).toBe(3);
    });

    test("Public subnets have correct CIDR blocks", () => {
      const subnets = Object.values(synthesized.resource.aws_subnet).filter(
        (s: any) => s.tags.Tier === "Public"
      );
      const cidrBlocks = subnets.map((s: any) => s.cidr_block).sort();
      expect(cidrBlocks).toEqual(["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]);
    });

    test("Private subnets have correct CIDR blocks", () => {
      const subnets = Object.values(synthesized.resource.aws_subnet).filter(
        (s: any) => s.tags.Tier === "Private"
      );
      const cidrBlocks = subnets.map((s: any) => s.cidr_block).sort();
      expect(cidrBlocks).toEqual([
        "10.0.101.0/24",
        "10.0.102.0/24",
        "10.0.103.0/24",
      ]);
    });

    test("Subnets span 3 availability zones", () => {
      const subnets = Object.values(synthesized.resource.aws_subnet);
      const azs = [...new Set(subnets.map((s: any) => s.availability_zone))];
      expect(azs.length).toBe(3);
      expect(azs).toContain("us-east-1a");
      expect(azs).toContain("us-east-1b");
      expect(azs).toContain("us-east-1c");
    });

    test("Public subnets have map_public_ip_on_launch enabled", () => {
      const publicSubnets = Object.values(synthesized.resource.aws_subnet).filter(
        (s: any) => s.tags.Tier === "Public"
      );
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBe(true);
      });
    });

    test("Private subnets have map_public_ip_on_launch disabled", () => {
      const privateSubnets = Object.values(synthesized.resource.aws_subnet).filter(
        (s: any) => s.tags.Tier === "Private"
      );
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.map_public_ip_on_launch).toBe(false);
      });
    });
  });

  describe("Internet Gateway", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("Internet Gateway is created", () => {
      const igw = synthesized.resource.aws_internet_gateway;
      expect(Object.keys(igw).length).toBe(1);
    });

    test("Internet Gateway has appropriate tags", () => {
      const igw = Object.values(synthesized.resource.aws_internet_gateway)[0] as any;
      expect(igw.tags.Name).toContain("igw-test");
      expect(igw.tags.Environment).toBe("test");
    });
  });

  describe("NAT Gateway Configuration", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("Creates exactly 3 NAT Gateways", () => {
      const natGateways = Object.values(synthesized.resource.aws_nat_gateway);
      expect(natGateways.length).toBe(3);
    });

    test("Creates exactly 3 Elastic IPs", () => {
      const eips = Object.values(synthesized.resource.aws_eip);
      expect(eips.length).toBe(3);
    });

    test("Elastic IPs use vpc domain", () => {
      const eips = Object.values(synthesized.resource.aws_eip);
      eips.forEach((eip: any) => {
        expect(eip.domain).toBe("vpc");
      });
    });

    test("NAT Gateways have appropriate tags", () => {
      const natGateways = Object.values(synthesized.resource.aws_nat_gateway);
      natGateways.forEach((nat: any) => {
        expect(nat.tags.Name).toContain("nat-gateway");
        expect(nat.tags.Name).toContain("test");
        expect(nat.tags.Environment).toBe("test");
      });
    });
  });

  describe("Route Table Configuration", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("Creates public route table", () => {
      const routeTables = Object.values(synthesized.resource.aws_route_table);
      const publicRT = routeTables.find((rt: any) =>
        rt.tags.Name.includes("public-rt")
      );
      expect(publicRT).toBeDefined();
    });

    test("Creates 3 private route tables", () => {
      const routeTables = Object.values(synthesized.resource.aws_route_table);
      const privateRTs = routeTables.filter((rt: any) =>
        rt.tags.Name.includes("private-rt")
      );
      expect(privateRTs.length).toBe(3);
    });

    test("Public route exists to Internet Gateway", () => {
      const routes = Object.values(synthesized.resource.aws_route);
      const publicRoute = routes.find(
        (r: any) => r.destination_cidr_block === "0.0.0.0/0" && r.gateway_id
      );
      expect(publicRoute).toBeDefined();
    });

    test("Private routes exist to NAT Gateways", () => {
      const routes = Object.values(synthesized.resource.aws_route);
      const privateRoutes = routes.filter(
        (r: any) => r.destination_cidr_block === "0.0.0.0/0" && r.nat_gateway_id
      );
      expect(privateRoutes.length).toBe(3);
    });

    test("All subnets have explicit route table associations", () => {
      const associations = Object.values(
        synthesized.resource.aws_route_table_association
      );
      // 3 public + 3 private = 6 total associations
      expect(associations.length).toBe(6);
    });
  });

  describe("Network ACL Configuration", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("Network ACL is created", () => {
      const nacl = synthesized.resource.aws_network_acl;
      expect(Object.keys(nacl).length).toBe(1);
    });

    test("Network ACL has SSH deny rule", () => {
      const rules = Object.values(synthesized.resource.aws_network_acl_rule);
      const sshDenyRule = rules.find(
        (rule: any) =>
          rule.rule_action === "deny" &&
          rule.from_port === 22 &&
          rule.to_port === 22 &&
          rule.egress === false
      );
      expect(sshDenyRule).toBeDefined();
      expect((sshDenyRule as any).rule_number).toBe(100);
      expect((sshDenyRule as any).protocol).toBe("6"); // TCP
    });

    test("Network ACL has allow inbound rule", () => {
      const rules = Object.values(synthesized.resource.aws_network_acl_rule);
      const allowInbound = rules.find(
        (rule: any) =>
          rule.rule_action === "allow" &&
          rule.egress === false &&
          rule.rule_number === 200
      );
      expect(allowInbound).toBeDefined();
    });

    test("Network ACL has allow outbound rule", () => {
      const rules = Object.values(synthesized.resource.aws_network_acl_rule);
      const allowOutbound = rules.find(
        (rule: any) => rule.rule_action === "allow" && rule.egress === true
      );
      expect(allowOutbound).toBeDefined();
    });
  });

  describe("VPC Flow Logs and S3", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("S3 bucket is created for flow logs", () => {
      const bucket = synthesized.resource.aws_s3_bucket;
      expect(Object.keys(bucket).length).toBe(1);
    });

    test("S3 bucket has encryption configured", () => {
      const encryption =
        synthesized.resource.aws_s3_bucket_server_side_encryption_configuration;
      expect(Object.keys(encryption).length).toBe(1);
      const config = Object.values(encryption)[0] as any;
      expect(
        config.rule[0].apply_server_side_encryption_by_default.sse_algorithm
      ).toBe("AES256");
    });

    test("S3 bucket has public access blocked", () => {
      const publicAccessBlock =
        synthesized.resource.aws_s3_bucket_public_access_block;
      expect(Object.keys(publicAccessBlock).length).toBe(1);
      const config = Object.values(publicAccessBlock)[0] as any;
      expect(config.block_public_acls).toBe(true);
      expect(config.block_public_policy).toBe(true);
      expect(config.ignore_public_acls).toBe(true);
      expect(config.restrict_public_buckets).toBe(true);
    });

    test("S3 bucket has 90-day lifecycle policy", () => {
      const lifecycle = synthesized.resource.aws_s3_bucket_lifecycle_configuration;
      expect(Object.keys(lifecycle).length).toBe(1);
      const config = Object.values(lifecycle)[0] as any;
      expect(config.rule[0].status).toBe("Enabled");
      expect(config.rule[0].expiration[0].days).toBe(90);
    });

    test("VPC Flow Log is created", () => {
      const flowLog = synthesized.resource.aws_flow_log;
      expect(Object.keys(flowLog).length).toBe(1);
      const log = Object.values(flowLog)[0] as any;
      expect(log.traffic_type).toBe("ALL");
      expect(log.log_destination_type).toBe("s3");
    });
  });

  describe("CloudWatch Alarms", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("Creates 3 CloudWatch alarms for NAT Gateways", () => {
      const alarms = Object.values(synthesized.resource.aws_cloudwatch_metric_alarm);
      expect(alarms.length).toBe(3);
    });

    test("Alarms monitor BytesOutToDestination metric", () => {
      const alarms = Object.values(synthesized.resource.aws_cloudwatch_metric_alarm);
      alarms.forEach((alarm: any) => {
        expect(alarm.metric_name).toBe("BytesOutToDestination");
        expect(alarm.namespace).toBe("AWS/NATGateway");
      });
    });

    test("Alarms have correct threshold (1GB)", () => {
      const alarms = Object.values(synthesized.resource.aws_cloudwatch_metric_alarm);
      alarms.forEach((alarm: any) => {
        expect(alarm.threshold).toBe(1073741824); // 1GB in bytes
        expect(alarm.period).toBe(300); // 5 minutes
        expect(alarm.statistic).toBe("Sum");
      });
    });

    test("Alarms are enabled", () => {
      const alarms = Object.values(synthesized.resource.aws_cloudwatch_metric_alarm);
      alarms.forEach((alarm: any) => {
        expect(alarm.actions_enabled).toBe(true);
      });
    });
  });

  describe("Outputs", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "test",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("VPC ID output is defined", () => {
      expect(synthesized.output.vpc_id).toBeDefined();
      expect(synthesized.output.vpc_id.description).toBe("VPC ID");
    });

    test("Public subnet IDs output is defined", () => {
      expect(synthesized.output.public_subnet_ids).toBeDefined();
      expect(synthesized.output.public_subnet_ids.description).toBe(
        "Public Subnet IDs"
      );
    });

    test("Private subnet IDs output is defined", () => {
      expect(synthesized.output.private_subnet_ids).toBeDefined();
      expect(synthesized.output.private_subnet_ids.description).toBe(
        "Private Subnet IDs"
      );
    });

    test("NAT Gateway IDs output is defined", () => {
      expect(synthesized.output.nat_gateway_ids).toBeDefined();
      expect(synthesized.output.nat_gateway_ids.description).toBe(
        "NAT Gateway IDs"
      );
    });

    test("Internet Gateway ID output is defined", () => {
      expect(synthesized.output.internet_gateway_id).toBeDefined();
      expect(synthesized.output.internet_gateway_id.description).toBe(
        "Internet Gateway ID"
      );
    });

    test("Flow logs bucket output is defined", () => {
      expect(synthesized.output.flow_logs_bucket).toBeDefined();
      expect(synthesized.output.flow_logs_bucket.description).toBe(
        "S3 Bucket for VPC Flow Logs"
      );
    });
  });

  describe("Resource Naming Convention", () => {
    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "test-stack", {
        environmentSuffix: "prod",
        region: "us-east-1",
      });
      synthesized = JSON.parse(Testing.synth(stack));
    });

    test("Resources use environmentSuffix in names", () => {
      const vpc = Object.values(synthesized.resource.aws_vpc)[0] as any;
      expect(vpc.tags.Name).toContain("prod");

      const subnets = Object.values(synthesized.resource.aws_subnet);
      subnets.forEach((subnet: any) => {
        expect(subnet.tags.Name).toContain("prod");
      });

      const igw = Object.values(synthesized.resource.aws_internet_gateway)[0] as any;
      expect(igw.tags.Name).toContain("prod");
    });
  });
});
