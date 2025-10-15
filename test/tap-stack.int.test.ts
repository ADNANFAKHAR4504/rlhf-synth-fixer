import { EKS, AppMesh } from "aws-sdk";
import * as fs from "fs";
import * as path from "path";
import * as dns from 'dns/promises';

jest.setTimeout(300000); // 5-minute timeout

interface StackOutputs {
  PrimaryEKSClusterName: { value: string };
  DREKSClusterName: { value: string };
  Route53FailoverDNS: { value: string };
  AppMeshName: { value: string };
}

const getStackOutputs = (): StackOutputs | null => {
  try {
    const outputPath = path.join(__dirname, "../cdktf.out/stacks/EksDrStack/outputs.json");
    if (fs.existsSync(outputPath)) {
      const outputs = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      if (outputs.PrimaryEKSClusterName && outputs.DREKSClusterName && outputs.Route53FailoverDNS && outputs.AppMeshName) {
        return outputs;
      }
    }
    return null;
  } catch (error) {
    console.warn("Could not read CDKTF output file.", error);
    return null;
  }
};

const outputs = getStackOutputs();

// Conditionally run tests only if the deployment outputs file exists
if (outputs) {
  describe("EKS DR Live Infrastructure Integration Tests", () => {

    const primaryEks = new EKS({ region: 'us-east-2' });
    const drEks = new EKS({ region: 'us-west-1' });
    const primaryAppMesh = new AppMesh({ region: 'us-east-2' });

    it("should have an active primary EKS cluster", async () => {
      console.log(`Checking primary EKS cluster: ${outputs.PrimaryEKSClusterName.value}`);
      const response = await primaryEks.describeCluster({ name: outputs.PrimaryEKSClusterName.value }).promise();
      expect(response.cluster?.status).toBe("ACTIVE");
      console.log("✅ Primary EKS cluster is active.");
    });

    it("should have an active DR EKS cluster", async () => {
      console.log(`Checking DR EKS cluster: ${outputs.DREKSClusterName.value}`);
      const response = await drEks.describeCluster({ name: outputs.DREKSClusterName.value }).promise();
      expect(response.cluster?.status).toBe("ACTIVE");
      console.log("✅ DR EKS cluster is active.");
    });

    it("should have an active App Mesh", async () => {
      console.log(`Checking App Mesh: ${outputs.AppMeshName.value}`);
      const response = await primaryAppMesh.describeMesh({ meshName: outputs.AppMeshName.value }).promise();
      expect(response.mesh?.status?.status).toBe("ACTIVE");
      console.log("✅ App Mesh is active.");
    });

    it("should have a resolvable Route 53 DNS failover record", async () => {
      console.log(`Resolving DNS for: ${outputs.Route53FailoverDNS.value}`);
      // This test verifies that the DNS name is registered and resolves.
      // It doesn't check which region it points to, just that it's a valid CNAME.
      const addresses = await dns.resolve(outputs.Route53FailoverDNS.value, 'CNAME');
      expect(addresses.length).toBeGreaterThan(0);
      console.log(`✅ Route 53 DNS resolved to: ${addresses[0]}`);
    });
  });
} else {
  describe("Integration Tests Skipped", () => {
    it("logs a warning because CDKTF output file was not found", () => {
      console.warn("\n⚠️ WARNING: CDKTF output file not found. Skipping live integration tests.\n");
    });
  });
}
