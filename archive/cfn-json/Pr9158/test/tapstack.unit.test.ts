import fs from "fs";
import path from "path";

const templatePath = path.resolve(__dirname, "../lib/TapStack.json");

describe("TapStack CloudFormation Unit Tests", () => {
  let template: any;

  beforeAll(() => {
    const content = fs.readFileSync(templatePath, "utf-8");
    template = JSON.parse(content);
  });

  test("PrimaryDBCluster resource exists", () => {
    expect(template.Resources.PrimaryDBCluster).toBeDefined();
  });

  test("PrimaryDBCluster engine is aurora-mysql", () => {
    const cluster = template.Resources.PrimaryDBCluster;
    expect(cluster.Properties.Engine).toBe("aurora-mysql");
  });

  test("PrimaryDBCluster engine version is valid", () => {
    const cluster = template.Resources.PrimaryDBCluster;
    expect(typeof cluster.Properties.EngineVersion).toBe("string");
    expect(cluster.Properties.EngineVersion).toMatch(/^5\.7|5\.6/);
  });

  test("PrimaryDBCluster storage encryption enabled", () => {
    expect(template.Resources.PrimaryDBCluster.Properties.StorageEncrypted).toBe(true);
  });

  test("PrimaryDBCluster has GlobalClusterIdentifier reference", () => {
    const globalClusterId = template.Resources.PrimaryDBCluster.Properties.GlobalClusterIdentifier;
    if (typeof globalClusterId === "object" && "Ref" in globalClusterId) {
      expect(globalClusterId.Ref).toMatch(/GlobalCluster/);
    } else {
      expect(typeof globalClusterId).toBe("string");
      expect(globalClusterId).toMatch(/GlobalCluster/);
    }
  });

  test("DB subnet group references all 3 private subnets", () => {
    const subnetGroup = template.Resources.DBSubnetGroup;
    expect(subnetGroup.Properties.SubnetIds.length).toBe(3);
    subnetGroup.Properties.SubnetIds.forEach((subnetRef: any) => {
      if (typeof subnetRef === "object" && "Ref" in subnetRef) {
        expect(subnetRef.Ref).toMatch(/PrivateSubnet\d/);
      }
    });
  });

  test("Private subnets defined with valid CIDRs", () => {
    ["PrivateSubnet1", "PrivateSubnet2", "PrivateSubnet3"].forEach(subnetKey => {
      expect(template.Resources[subnetKey]).toBeDefined();
      const subnet = template.Resources[subnetKey];
      expect(subnet.Properties.VpcId).toBeDefined();
      expect(subnet.Properties.CidrBlock).toMatch(/^10\.0\./);
    });
  });

  test("Lambda health check function exists with reasonable timeout", () => {
    const lambda = template.Resources.HealthCheckFunction;
    expect(lambda).toBeDefined();
    expect(lambda.Type).toBe("AWS::Lambda::Function");
    expect(lambda.Properties.Timeout).toBeLessThanOrEqual(10);
  });
});
