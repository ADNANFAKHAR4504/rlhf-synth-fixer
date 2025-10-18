// test/tap-stack.int.test.ts
import AWS from 'aws-sdk'; // Using AWS SDK v2
import * as fs from 'fs';
import * as path from 'path';
import * as dns from 'dns/promises';

// Pattern from your successful example: Check for the CI/CD output file
const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const cfnOutputsExist = fs.existsSync(outputsFilePath);
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

// Wrap the entire suite in the conditional describe block
describeIf(cfnOutputsExist)('EKS DR Live Infrastructure Integration Tests (AWS SDK v2)', () => {

  let outputs: any;
  // Define regions based on your tap-stack.ts
  const primaryRegion = 'us-east-2';
  const drRegion = 'eu-central-1';

  // Set a longer timeout for AWS API calls
  jest.setTimeout(300000); // 5 minutes

  // Read and parse the correct output file before tests run
  beforeAll(() => {
    const outputsFile = fs.readFileSync(outputsFilePath, 'utf8');
    const outputsJson = JSON.parse(outputsFile);
    // Correctly access the nested outputs object using the stack name from deploy log
    outputs = outputsJson.EksDrStack;
  });

  // Initialize AWS SDK v2 clients
  const primaryEks = new AWS.EKS({ region: primaryRegion });
  const drEks = new AWS.EKS({ region: drRegion });
  const primaryAppMesh = new AWS.AppMesh({ region: primaryRegion });
  const primaryEc2 = new AWS.EC2({ region: primaryRegion }); // Added for VPC/Subnet checks
  const iam = new AWS.IAM(); // IAM is global, no region needed

  describe('EKS Clusters', () => {
    it('should have an active primary EKS cluster', async () => {
      console.log(`Checking primary EKS cluster: ${outputs.PrimaryEKSClusterName}`);
      const response = await primaryEks.describeCluster({ name: outputs.PrimaryEKSClusterName }).promise();
      expect(response.cluster?.status).toBe("ACTIVE");
      console.log("Primary EKS cluster is active.");
    });

    it('should have an active DR EKS cluster', async () => {
      console.log(`Checking DR EKS cluster: ${outputs.DREKSClusterName}`);
      const response = await drEks.describeCluster({ name: outputs.DREKSClusterName }).promise();
      expect(response.cluster?.status).toBe("ACTIVE");
      console.log("DR EKS cluster is active.");
    });
  });

  describe('App Mesh and Networking', () => {
    it('should have an active App Mesh', async () => {
      console.log(`Checking App Mesh: ${outputs.AppMeshName}`);
      const response = await primaryAppMesh.describeMesh({ meshName: outputs.AppMeshName }).promise();
      expect(response.mesh?.status?.status).toBe("ACTIVE");
      console.log("App Mesh is active.");
    });

    it('should have a resolvable Route 53 DNS failover record', async () => {
      console.log(`Resolving DNS for: ${outputs.Route53FailoverDNS}`);
      const addresses = await dns.resolve(outputs.Route53FailoverDNS, 'CNAME');
      expect(addresses.length).toBeGreaterThan(0);
      console.log(`Route 53 DNS resolved to: ${addresses[0]}`);
    });

    // **NEW EASY TEST**: Check if the primary VPC exists and is available
    it('should have an available primary VPC', async () => {
      // We need the VPC ID - assuming it's tagged consistently or identifiable
      // This example assumes we can find it by a known tag or CIDR block
      console.log(`Checking primary VPC state...`);
      const vpcs = await primaryEc2.describeVpcs({
        Filters: [{ Name: 'cidr', Values: ['10.0.0.0/16'] }] // Filter by CIDR used in tap-stack.ts
      }).promise();
      expect(vpcs.Vpcs?.length).toBe(1);
      expect(vpcs.Vpcs?.[0]?.State).toBe('available');
      console.log(` Primary VPC found and available (ID: ${vpcs.Vpcs?.[0]?.VpcId}).`);
    });

    // **NEW EASY TEST**: Check if the expected number of public subnets exist in the primary VPC
    it('should have 2 public subnets in the primary VPC', async () => {
      // Find VPC ID first
      const vpcs = await primaryEc2.describeVpcs({
        Filters: [{ Name: 'cidr', Values: ['10.0.0.0/16'] }]
      }).promise();
      const vpcId = vpcs.Vpcs?.[0]?.VpcId;
      expect(vpcId).toBeDefined();

      console.log(`Checking public subnets for VPC ${vpcId}...`);
      const subnets = await primaryEc2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId!] },
          { Name: 'cidr-block', Values: ['10.0.1.0/24', '10.0.2.0/24'] } // CIDRs used for public subnets
        ]
      }).promise();
      expect(subnets.Subnets?.length).toBe(2);
      console.log(`Found 2 public subnets.`);
    });
  });

  describe('IAM Roles', () => {
    // **NEW EASY TEST**: Check if the EKS Cluster role exists
    it('should have the primary EKS Cluster IAM role created', async () => {
      // Extract role name structure from tap-stack.ts
      const roleNamePrefix = `eks-cluster-role-${primaryRegion}`;
      console.log(`Checking for IAM role starting with: ${roleNamePrefix}`);
      const roles = await iam.listRoles({ PathPrefix: '/' }).promise(); // List roles (might need pagination for many roles)
      const foundRole = roles.Roles.find(role => role.RoleName.startsWith(roleNamePrefix));
      expect(foundRole).toBeDefined();
      console.log(`Primary EKS Cluster role found (Name: ${foundRole?.RoleName}).`);
    });

    // **NEW EASY TEST**: Check if the EKS Node role exists
    it('should have the primary EKS Node IAM role created', async () => {
      const roleNamePrefix = `eks-node-role-${primaryRegion}`;
      console.log(`Checking for IAM role starting with: ${roleNamePrefix}`);
      const roles = await iam.listRoles({ PathPrefix: '/' }).promise();
      const foundRole = roles.Roles.find(role => role.RoleName.startsWith(roleNamePrefix));
      expect(foundRole).toBeDefined();
      console.log(`Primary EKS Node role found (Name: ${foundRole?.RoleName}).`);
    });
  });
});
