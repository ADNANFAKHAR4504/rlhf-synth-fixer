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
    if (!outputs) {
      throw new Error(`Could not find stack outputs for EksDrStack in ${outputsFilePath}`);
    }
  });

  // Initialize AWS SDK v2 clients
  const primaryEks = new AWS.EKS({ region: primaryRegion });
  const drEks = new AWS.EKS({ region: drRegion });
  const primaryAppMesh = new AWS.AppMesh({ region: primaryRegion });
  const primaryEc2 = new AWS.EC2({ region: primaryRegion }); // Added for VPC/Subnet checks

  describe('Core Application Components', () => {
    it('should have an active primary EKS cluster', async () => {
      console.log(`Checking primary EKS cluster: ${outputs.PrimaryEKSClusterName}`);
      const response = await primaryEks.describeCluster({ name: outputs.PrimaryEKSClusterName }).promise();
      expect(response.cluster?.status).toBe("ACTIVE");
      console.log(" Primary EKS cluster is active.");
    });

    it('should have an active DR EKS cluster', async () => {
      console.log(`Checking DR EKS cluster: ${outputs.DREKSClusterName}`);
      const response = await drEks.describeCluster({ name: outputs.DREKSClusterName }).promise();
      expect(response.cluster?.status).toBe("ACTIVE");
      console.log(" DR EKS cluster is active.");
    });

    it('should have an active App Mesh', async () => {
      console.log(`Checking App Mesh: ${outputs.AppMeshName}`);
      const response = await primaryAppMesh.describeMesh({ meshName: outputs.AppMeshName }).promise();
      expect(response.mesh?.status?.status).toBe("ACTIVE");
      console.log(" App Mesh is active.");
    });

    it('should have the Route 53 DNS failover record defined in outputs', () => {
      console.log(`Verifying Route53FailoverDNS output: ${outputs.Route53FailoverDNS}`);
      expect(outputs.Route53FailoverDNS).toBeDefined();
      expect(outputs.Route53FailoverDNS).toContain('.');
      console.log(` Route 53 DNS output found: ${outputs.Route53FailoverDNS}`);
    });
  });

  describe('Primary Region Networking Components', () => {
    // **RELIABLE TEST**: Check primary VPC exists and is available, using tags for specificity.
    it('should have an available primary VPC tagged correctly', async () => {
      console.log(`Checking primary VPC state and tags...`);
      const vpcs = await primaryEc2.describeVpcs({
        Filters: [
          { Name: 'cidr', Values: ['10.0.0.0/16'] }, // CIDR from tap-stack.ts
          { Name: 'tag:Project', Values: ['iac-rlhf-amazon'] } // Tag from tap-stack.ts
        ]
      }).promise();
      expect(vpcs.Vpcs?.length).toBe(1); // Expect exactly one VPC with this CIDR and Tag
      expect(vpcs.Vpcs?.[0]?.State).toBe('available');
      console.log(` Primary VPC found and available (ID: ${vpcs.Vpcs?.[0]?.VpcId}).`);
    });

    // **RELIABLE TEST**: Check for the exact number of subnets with specific CIDRs within the tagged VPC.
    it('should have 4 subnets in the primary VPC with correct CIDRs', async () => {
      const vpcs = await primaryEc2.describeVpcs({ Filters: [{ Name: 'tag:Project', Values: ['iac-rlhf-amazon'] }] }).promise();
      const vpcId = vpcs.Vpcs?.[0]?.VpcId;
      expect(vpcId).toBeDefined();

      console.log(`Checking subnets for VPC ${vpcId}...`);
      const subnets = await primaryEc2.describeSubnets({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId!] },
          // Specific CIDRs defined in tap-stack.ts
          { Name: 'cidr-block', Values: ['10.0.1.0/24', '10.0.2.0/24', '10.0.10.0/24', '10.0.11.0/24'] }
        ]
      }).promise();
      expect(subnets.Subnets?.length).toBe(4); // Expect exactly 4 subnets matching these CIDRs
      console.log(` Found 4 subnets with correct CIDRs.`);
    });

    // **RELIABLE TEST**: Check for the Public Route Table using tags.
    it('should have a public route table for the primary VPC', async () => {
      const vpcs = await primaryEc2.describeVpcs({ Filters: [{ Name: 'tag:Project', Values: ['iac-rlhf-amazon'] }] }).promise();
      const vpcId = vpcs.Vpcs?.[0]?.VpcId;
      expect(vpcId).toBeDefined();

      console.log(`Checking public route table for VPC ${vpcId}...`);
      const routeTables = await primaryEc2.describeRouteTables({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId!] },
          { Name: 'tag:Project', Values: ['iac-rlhf-amazon'] },
          // Add another tag if needed for uniqueness, e.g., Name tag if consistent
        ]
      }).promise();
      // Find the route table that has a route to the Internet Gateway
      const publicRt = routeTables.RouteTables?.find(rt => rt.Routes?.some(r => r.GatewayId?.startsWith('igw-')));
      expect(publicRt).toBeDefined();
      console.log(` Public Route Table found (ID: ${publicRt?.RouteTableId}).`);
    });

    // **RELIABLE TEST**: Check for the Internet Gateway attached to the VPC using tags.
    it('should have an Internet Gateway attached to the primary VPC', async () => {
      const vpcs = await primaryEc2.describeVpcs({ Filters: [{ Name: 'tag:Project', Values: ['iac-rlhf-amazon'] }] }).promise();
      const vpcId = vpcs.Vpcs?.[0]?.VpcId;
      expect(vpcId).toBeDefined();

      console.log(`Checking Internet Gateway for VPC ${vpcId}...`);
      const igws = await primaryEc2.describeInternetGateways({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [vpcId!] },
          { Name: 'tag:Project', Values: ['iac-rlhf-amazon'] }
        ]
      }).promise();
      expect(igws.InternetGateways?.length).toBe(1); // Expect exactly one IGW attached
      console.log(` Internet Gateway found and attached (ID: ${igws.InternetGateways?.[0]?.InternetGatewayId}).`);
    });

    // **RELIABLE TEST**: Check for the NAT Gateway state using tags.
    it('should have an available NAT Gateway in the primary VPC', async () => {
      const vpcs = await primaryEc2.describeVpcs({ Filters: [{ Name: 'tag:Project', Values: ['iac-rlhf-amazon'] }] }).promise();
      const vpcId = vpcs.Vpcs?.[0]?.VpcId;
      expect(vpcId).toBeDefined();

      console.log(`Checking NAT Gateway for VPC ${vpcId}...`);
      const natGws = await primaryEc2.describeNatGateways({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId!] },
          { Name: 'tag:Project', Values: ['iac-rlhf-amazon'] }
          // NAT Gateway doesn't inherit VPC tags directly, check if tap-stack.ts adds tags to NAT GW
          // If not, filter just by VPC ID and expect one result
        ]
      }).promise();
      expect(natGws.NatGateways?.length).toBeGreaterThanOrEqual(1); // tap-stack creates one NAT GW
      expect(natGws.NatGateways?.[0]?.State).toBe('available');
      console.log(` NAT Gateway found and available (ID: ${natGws.NatGateways?.[0]?.NatGatewayId}).`);
    });
  });

});
