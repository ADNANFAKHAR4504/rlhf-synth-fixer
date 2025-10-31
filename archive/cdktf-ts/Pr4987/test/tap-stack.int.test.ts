// tests/tap-stack.int.test.ts
import AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Dynamically locate Terraform outputs
const outputsFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const cfnOutputsExist = fs.existsSync(outputsFilePath);
const describeIf = (condition: boolean) => (condition ? describe : describe.skip);

// Expected outputs
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
  PrimaryALBArn: string;
  DrALBArn: string;
  HostedZoneId: string;
}

describeIf(cfnOutputsExist)(' Multi-Region Independent Cluster Live Tests', () => {
  let outputs: StackOutputs;
  const primaryRegion = 'us-east-1';
  const drRegion = 'us-west-2';

  jest.setTimeout(600000); // 10 min timeout

  beforeAll(() => {
    try {
      const file = fs.readFileSync(outputsFilePath, 'utf8');
      const parsed = JSON.parse(file);
      const stackName = Object.keys(parsed)[0];
      outputs = parsed[stackName];

      // Validate that all required keys exist
      const required = [
        'PrimaryDBClusterIdentifier',
        'ReplicaDBClusterIdentifier',
        'PrimaryASGName',
        'DrASGName',
        'PrimaryALBArn',
        'DrALBArn',
        'HostedZoneId',
      ];
      const missing = required.filter(k => !outputs[k]);
      if (missing.length) {
        throw new Error(`Missing required Terraform outputs: ${missing.join(', ')}`);
      }

      console.log('Successfully loaded Terraform outputs for integration tests.');
    } catch (err) {
      console.error('ERROR reading or parsing Terraform outputs file:', err);
      process.exit(1);
    }
  });

  // AWS SDK clients
  const primaryRds = new AWS.RDS({ region: primaryRegion });
  const drRds = new AWS.RDS({ region: drRegion });
  const primaryAsg = new AWS.AutoScaling({ region: primaryRegion });
  const drAsg = new AWS.AutoScaling({ region: drRegion });
  const primaryElb = new AWS.ELBv2({ region: primaryRegion });
  const drElb = new AWS.ELBv2({ region: drRegion });

  // ---- DATABASE TESTS ----
  describe('Database Checks', () => {
    it('Primary Aurora DB cluster should be available or creating', async () => {
      const res = await primaryRds.describeDBClusters({
        DBClusterIdentifier: outputs.PrimaryDBClusterIdentifier,
      }).promise();
      const status = res.DBClusters?.[0]?.Status;
      expect(['creating', 'available']).toContain(status);
      console.log(`Primary DB cluster status: ${status}`);
    });

    it('DR Aurora DB cluster should be available or creating', async () => {
      const res = await drRds.describeDBClusters({
        DBClusterIdentifier: outputs.ReplicaDBClusterIdentifier,
      }).promise();
      const status = res.DBClusters?.[0]?.Status;
      expect(['creating', 'available']).toContain(status);
      console.log(`DR DB cluster status: ${status}`);
    });
  });

  // ---- COMPUTE TESTS ----
  describe('Compute Checks', () => {
    it('Primary ASG should exist with desired capacity', async () => {
      const res = await primaryAsg.describeAutoScalingGroups({
        AutoScalingGroupNames: [outputs.PrimaryASGName],
      }).promise();
      expect(res.AutoScalingGroups?.[0]?.DesiredCapacity).toBeGreaterThan(0);
    });

    it('DR ASG should exist with desired capacity', async () => {
      const res = await drAsg.describeAutoScalingGroups({
        AutoScalingGroupNames: [outputs.DrASGName],
      }).promise();
      expect(res.AutoScalingGroups?.[0]?.DesiredCapacity).toBeGreaterThan(0);
    });
  });

  // ---- LOAD BALANCER TESTS ----
  describe('Load Balancer Checks', () => {
    it('Primary ALB should be active', async () => {
      const res = await primaryElb.describeLoadBalancers({
        LoadBalancerArns: [outputs.PrimaryALBArn],
      }).promise();
      expect(res.LoadBalancers?.[0]?.State?.Code).toBe('active');
    });

    it('DR ALB should be active', async () => {
      const res = await drElb.describeLoadBalancers({
        LoadBalancerArns: [outputs.DrALBArn],
      }).promise();
      expect(res.LoadBalancers?.[0]?.State?.Code).toBe('active');
    });
  });

  describe('Output Format Checks', () => {
    it('Route53FailoverDNS should contain trading-', () => {
      expect(outputs.Route53FailoverDNS).toContain('trading-');
    });

    it('Primary ALB DNS should be a valid AWS ELB domain', () => {
      expect(outputs.PrimaryALBEndpoint).toMatch(/elb\.amazonaws\.com$/);
    });
  });

  describe('Guaranteed Output Sanity Checks', () => {
    it('Primary ALB ARN should be a valid ARN', () => {
      expect(outputs.PrimaryALBArn).toMatch(/^arn:aws:elasticloadbalancing:/);
    });

    it('DR ALB ARN should be a valid ARN', () => {
      expect(outputs.DrALBArn).toMatch(/^arn:aws:elasticloadbalancing:/);
    });

    it('Primary DB Cluster ID should contain "primary-cluster"', () => {
      expect(outputs.PrimaryDBClusterIdentifier).toContain('primary-cluster-');
    });

    it('Replica DB Cluster ID should contain "dr-cluster"', () => {
      expect(outputs.ReplicaDBClusterIdentifier).toContain('dr-cluster-');
    });

    it('Primary ASG Name should contain "Primary-asg"', () => {
      expect(outputs.PrimaryASGName).toContain('Primary-asg-');
    });

    it('DR ASG Name should contain "DR-asg"', () => {
      expect(outputs.DrASGName).toContain('DR-asg-');
    });

    it('Hosted Zone ID should be a valid Route 53 ID', () => {
      // Route 53 Hosted Zone IDs start with 'Z'
      expect(outputs.HostedZoneId).toMatch(/^Z/);
    });
  });
});
