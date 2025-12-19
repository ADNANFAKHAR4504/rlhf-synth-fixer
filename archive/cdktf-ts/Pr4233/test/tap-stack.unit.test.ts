import { Testing } from "cdktf";
import { EksDrStack } from "../lib/tap-stack";

describe("EKS DR Stack Unit Tests", () => {
  let synthesized: any;

  beforeAll(() => {
    const app = Testing.app();
    const stack = new EksDrStack(app, "EksDrStack");
    synthesized = JSON.parse(Testing.synth(stack));
  });

  const findResources = (type: string) => Object.values(synthesized.resource[type] || {});

  it("should create providers for primary and DR regions", () => {
    const providers = synthesized.provider.aws;
    expect(providers).toEqual(expect.arrayContaining([
      expect.objectContaining({ alias: "us-east-2", region: "us-east-2" }),
      expect.objectContaining({ alias: "eu-central-1", region: "eu-central-1" }),
    ]));
  });

  it("should create a VPC in each region with correct CIDRs", () => {
    const vpcs = findResources("aws_vpc") as any[];
    expect(vpcs.length).toBe(2);
    expect(vpcs.some(v => v.cidr_block === '10.0.0.0/16')).toBe(true);
    expect(vpcs.some(v => v.cidr_block === '172.16.0.0/16')).toBe(true);
  });

  it("should create an EKS Cluster and Node Group in each region", () => {
    expect(findResources("aws_eks_cluster")).toHaveLength(2);
    const nodeGroups = findResources("aws_eks_node_group") as any[];
    expect(nodeGroups).toHaveLength(2);
    expect(nodeGroups[0].instance_types).toEqual(['m5.xlarge']);

    // scaling_config is an object, not an array
    expect(nodeGroups[0].scaling_config.min_size).toBe(2);
    expect(nodeGroups[0].scaling_config.max_size).toBe(6);
  });

  it("should create an App Mesh and all related components in each region", () => {
    expect(findResources("aws_appmesh_mesh")).toHaveLength(2);
    expect(findResources("aws_appmesh_virtual_node")).toHaveLength(2);
    expect(findResources("aws_appmesh_virtual_router")).toHaveLength(2);
    expect(findResources("aws_appmesh_route")).toHaveLength(2);
    expect(findResources("aws_appmesh_virtual_service")).toHaveLength(2);
  });

  it("should create Route 53 failover records", () => {
    const records = findResources("aws_route53_record") as any[];
    expect(records.length).toBe(2);

    // failover_routing_policy is an object, not an array
    const primaryRecord = records.find(r => r.failover_routing_policy?.type === 'PRIMARY');
    const secondaryRecord = records.find(r => r.failover_routing_policy?.type === 'SECONDARY');

    expect(primaryRecord).toBeDefined();
    expect(secondaryRecord).toBeDefined();
  });

  it("should create CloudWatch alarms", () => {
    const alarms = findResources("aws_cloudwatch_metric_alarm");
    expect(alarms.length).toBe(2);
  });

  it("should attach all required policies to the IAM Roles", () => {
    const attachments = findResources("aws_iam_role_policy_attachment") as any[];

    // FIX: The total number of attachments is 10
    // EKS Cluster Role (x2 regions) = 1 attachment each = 2
    // EKS Node Role (x2 regions) = 4 attachments each = 8
    expect(attachments.length).toBe(10);
  });

  it("should apply common tags to key resources", () => {
    const vpc = findResources("aws_vpc")[0] as any;
    expect(vpc.tags).toEqual(expect.objectContaining({ Project: 'iac-rlhf-amazon' }));

    const eksCluster = findResources("aws_eks_cluster")[0] as any;
    expect(eksCluster.tags).toEqual(expect.objectContaining({ Project: 'iac-rlhf-amazon' }));
  });

  it("should have all required outputs", () => {
    expect(synthesized.output).toHaveProperty("PrimaryEKSClusterName");
    expect(synthesized.output).toHaveProperty("DREKSClusterName");
    expect(synthesized.output).toHaveProperty("Route53FailoverDNS");
    expect(synthesized.output).toHaveProperty("AppMeshName");
  });
});
