// tests/tap-stack.int.test.ts
import AWS from 'aws-sdk'; // Using AWS SDK v2
import * as fs from 'fs';
import * as path from 'path';

// Conditionally run tests only if the output file exists
const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const cfnOutputsExist = fs.existsSync(outputsFilePath);
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

// Define the outputs we expect from the stack
interface StackOutputs {
  PrimaryALBEndpoint: string;
  DrALBEndpoint: string;
  Route53FailoverDNS: string;
  PrimaryDBClusterEndpoint: string;
  ReplicaDBClusterEndpoint: string;
  PrimaryDBClusterIdentifier: string;
  ReplicaDBClusterIdentifier: string;
  PrimaryASGName: string;
  DrASGName: string;
  // New outputs for better tests
  PrimaryALBArn: string;
  DrALBArn: string;
  HostedZoneId: string;
}

// Wrap the entire suite in the conditional describe block
describeIf(cfnOutputsExist)('Multi-Region Independent Cluster Live Tests', () => {

  let outputs: StackOutputs;
  const primaryRegion = 'us-east-1';
  const drRegion = 'us-west-2';

  // Set a longer timeout for AWS API calls
  jest.setTimeout(600000); // 10 minutes

  // beforeAll runs once to read the output file
  beforeAll(() => {
    try {
      const outputsFile = fs.readFileSync(outputsFilePath, 'utf8');
      const outputsJson = JSON.parse(outputsFile);
      const stackName = Object.keys(outputsJson)[0];
      outputs = outputsJson[stackName];

      // Verify all required outputs for testing are present
      if (!outputs || !outputs.PrimaryDBClusterIdentifier || !outputs.ReplicaDBClusterIdentifier || !outputs.PrimaryASGName || !outputs.DrASGName || !outputs.PrimaryALBArn || !outputs.DrALBArn || !outputs.HostedZoneId) {
        throw new Error(`Required outputs for integration testing are missing from ${outputsFilePath}`);
      }
      console.log("Successfully loaded outputs for integration tests:", outputs);
    } catch (error) {
      console.error("CRITICAL ERROR reading or parsing outputs file:", error);
      process.exit(1);
    }
  });

  // Initialize AWS SDK v2 clients
  const primaryRds = new AWS.RDS({ region: primaryRegion });
  const drRds = new AWS.RDS({ region: drRegion });
  const primaryAsg = new AWS.AutoScaling({ region: primaryRegion });
  const drAsg = new AWS.AutoScaling({ region: drRegion });
  // --- NEW SDK CLIENTS ---
  const primaryElb = new AWS.ELBv2({ region: primaryRegion });
  const drElb = new AWS.ELBv2({ region: drRegion });
  const route53 = new AWS.Route53({ region: primaryRegion }); // Route 53 is global, use primary

  describe('Database Checks (SDK)', () => {

    it('should have an available primary Aurora DB cluster', async () => {
      console.log(`Checking primary RDS cluster: ${outputs.PrimaryDBClusterIdentifier}`);
      const response = await primaryRds.describeDBClusters({ DBClusterIdentifier: outputs.PrimaryDBClusterIdentifier }).promise();
      expect(response.DBClusters).toHaveLength(1);
      const dbStatus = response.DBClusters?.[0]?.Status;
      expect(dbStatus).toMatch(/creating|available/);
      console.log(` Primary RDS DB cluster status is ${dbStatus}.`);
    });

    it('should have an available DR Aurora DB cluster', async () => {
      console.log(`Checking DR cluster: ${outputs.ReplicaDBClusterIdentifier}`);
      const response = await drRds.describeDBClusters({ DBClusterIdentifier: outputs.ReplicaDBClusterIdentifier }).promise();
      expect(response.DBClusters).toHaveLength(1);
      const dbStatus = response.DBClusters?.[0]?.Status;
      expect(dbStatus).toMatch(/creating|available/);
      console.log(` DR cluster status is ${dbStatus}.`);
    });
  });

  describe('Compute Checks (SDK)', () => {

    it('should have the primary Auto Scaling Group with desired capacity', async () => {
      console.log(`Checking primary ASG: ${outputs.PrimaryASGName}`);
      const response = await primaryAsg.describeAutoScalingGroups({ AutoScalingGroupNames: [outputs.PrimaryASGName] }).promise();
      expect(response.AutoScalingGroups).toHaveLength(1);
      expect(response.AutoScalingGroups?.[0]?.DesiredCapacity).toBe(1);
      console.log(` Primary ASG found with desired capacity of 1.`);
    });

    it('should have the DR Auto Scaling Group with desired capacity', async () => {
      console.log(`Checking DR ASG: ${outputs.DrASGName}`);
      const response = await drAsg.describeAutoScalingGroups({ AutoScalingGroupNames: [outputs.DrASGName] }).promise();
      expect(response.AutoScalingGroups).toHaveLength(1);
      expect(response.AutoScalingGroups?.[0]?.DesiredCapacity).toBe(1);
      console.log(` DR ASG found with desired capacity of 1.`);
    });
  });

  describe('Load Balancer Checks (SDK)', () => {

    it('should have an active primary ALB', async () => {
      console.log(`Checking primary ALB state: ${outputs.PrimaryALBArn}`);
      const response = await primaryElb.describeLoadBalancers({ LoadBalancerArns: [outputs.PrimaryALBArn] }).promise();
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers?.[0]?.State?.Code).toBe('active');
      console.log(` Primary ALB is active.`);
    });

    it('should have an active DR ALB', async () => {
      console.log(`Checking DR ALB state: ${outputs.DrALBArn}`);
      const response = await drElb.describeLoadBalancers({ LoadBalancerArns: [outputs.DrALBArn] }).promise();
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers?.[0]?.State?.Code).toBe('active');
      console.log(` DR ALB is active.`);
    });
  });

  // --- NEW TEST BLOCK ---
  describe('Route 53 Failover Record Checks (SDK)', () => {

    let recordSets: AWS.Route53.ResourceRecordSet[] = [];

    beforeAll(async () => {
      console.log(`Fetching record sets from Zone ID: ${outputs.HostedZoneId}`);
      // --- FIX: Remove StartRecordName and StartRecordType to fetch all records ---
      const response = await route53.listResourceRecordSets({
        HostedZoneId: outputs.HostedZoneId,
      }).promise();
      // --- END FIX ---

      // Filter just the 'A' records for our app
      recordSets = response.ResourceRecordSets.filter(
        r => r.Name === `${outputs.Route53FailoverDNS}.` && r.Type === 'A'
      );
      console.log(`Found ${recordSets.length} matching 'A' records.`);
    });

    it('should find both PRIMARY and SECONDARY failover records', () => {
      expect(recordSets.length).toBe(2);
      expect(recordSets.map(r => r.Failover)).toEqual(
        expect.arrayContaining(['PRIMARY', 'SECONDARY'])
      );
    });

    it('should have the PRIMARY record pointing to the primary ALB', () => {
      const primaryRecord = recordSets.find(r => r.SetIdentifier === 'primary');
      expect(primaryRecord).toBeDefined();
      expect(primaryRecord?.Failover).toBe('PRIMARY');
      // ALB DNS names in Route 53 aliases have a trailing dot
      expect(primaryRecord?.AliasTarget?.DNSName).toBe(`${outputs.PrimaryALBEndpoint}.`);
      console.log(` Primary record points to ${primaryRecord?.AliasTarget?.DNSName}`);
    });

    it('should have the SECONDARY record pointing to the DR ALB', () => {
      const secondaryRecord = recordSets.find(r => r.SetIdentifier === 'secondary');
      expect(secondaryRecord).toBeDefined();
      expect(secondaryRecord?.Failover).toBe('SECONDARY');
      expect(secondaryRecord?.AliasTarget?.DNSName).toBe(`${outputs.DrALBEndpoint}.`);
      console.log(` Secondary record points to ${secondaryRecord?.AliasTarget?.DNSName}`);
    });
  });

  describe('Output Format Checks (Non-SDK)', () => {

    it('should have a valid Route 53 DNS failover record', () => {
      console.log(`Verifying Route53FailoverDNS: ${outputs.Route53FailoverDNS}`);
      expect(outputs.Route53FailoverDNS).toContain('trading-');
      console.log(` Route 53 DNS output format is valid.`);
    });

    it('should have a valid primary ALB DNS name', () => {
      console.log(`Verifying PrimaryALBEndpoint: ${outputs.PrimaryALBEndpoint}`);
      expect(outputs.PrimaryALBEndpoint).toContain('elb.amazonaws.com');
      console.log(` Primary ALB DNS name format is valid.`);
    });

    it('should have a valid DR ALB DNS name', () => {
      console.log(`Verifying DrALBEndpoint: ${outputs.DrALBEndpoint}`);
      expect(outputs.DrALBEndpoint).toContain('elb.amazonaws.com');
      console.log(` DR ALB DNS name format is valid.`);
    });
  });
});
