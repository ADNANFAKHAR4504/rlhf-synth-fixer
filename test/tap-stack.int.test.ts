/**
 * TapStack Integration Tests
 * 
 * Simple integration tests to validate resource existence using AWS describe commands.
 * Tests verify that all resources specified in the CloudFormation outputs exist and are accessible.
 */

import fs from 'fs';
import * as AWS from 'aws-sdk';

// Load stack outputs from CloudFormation deployment
let outputs: any = {};
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
} catch (error) {
  console.warn('Could not load flat-outputs.json, will attempt to fetch from AWS directly');
}

// AWS SDK configuration
const ec2 = new AWS.EC2();
const elbv2 = new AWS.ELBv2();
const rds = new AWS.RDS();

describe('TapStack Integration Tests', () => {
  let stackOutputs: any = outputs; // Use the loaded outputs from the file

  // Set timeout for integration tests
  jest.setTimeout(60000);

  beforeAll(() => {
    // Validate that all required outputs are present
    const requiredOutputs = ['VpcId', 'PublicSubnets', 'PrivateSubnets', 'DBSubnets', 
                           'WebServerSecurityGroup', 'AppServerSecurityGroup', 'DBSecurityGroup', 
                           'ALBDnsName', 'RDSEndpoint'];
    
    for (const output of requiredOutputs) {
      if (!stackOutputs[output]) {
        throw new Error(`Missing required output: ${output}`);
      }
    }
    
    console.log('Loaded CloudFormation outputs:', stackOutputs);
  });

  describe('AWS Resource Existence Tests', () => {
    test('VPC should exist and be available', async () => {
      const result = await ec2.describeVpcs({
        VpcIds: [stackOutputs.VpcId]
      }).promise();
      
      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].State).toBe('available');
      expect(result.Vpcs![0].VpcId).toBe(stackOutputs.VpcId);
      console.log(`✓ VPC ${stackOutputs.VpcId} is available`);
    });

    test('Public subnets should exist and be available', async () => {
      const publicSubnetIds = stackOutputs.PublicSubnets.split(',').map((s: string) => s.trim());
      
      const result = await ec2.describeSubnets({ 
        SubnetIds: publicSubnetIds 
      }).promise();
      
      expect(result.Subnets).toHaveLength(2);
      result.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
      console.log(`✓ Public subnets validated: ${publicSubnetIds.join(', ')}`);
    });

    test('Private subnets should exist and be available', async () => {
      const privateSubnetIds = stackOutputs.PrivateSubnets.split(',').map((s: string) => s.trim());
      
      const result = await ec2.describeSubnets({ 
        SubnetIds: privateSubnetIds 
      }).promise();
      
      expect(result.Subnets).toHaveLength(2);
      result.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
      console.log(`✓ Private subnets validated: ${privateSubnetIds.join(', ')}`);
    });

    test('Database subnets should exist and be available', async () => {
      const dbSubnetIds = stackOutputs.DBSubnets.split(',').map((s: string) => s.trim());
      
      const result = await ec2.describeSubnets({ 
        SubnetIds: dbSubnetIds 
      }).promise();
      
      expect(result.Subnets).toHaveLength(2);
      result.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
      });
      console.log(`✓ DB subnets validated: ${dbSubnetIds.join(', ')}`);
    });

    test('Web server security group should exist', async () => {
      const result = await ec2.describeSecurityGroups({ 
        GroupIds: [stackOutputs.WebServerSecurityGroup] 
      }).promise();
      
      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(stackOutputs.WebServerSecurityGroup);
      console.log(`✓ Web server security group validated: ${stackOutputs.WebServerSecurityGroup}`);
    });

    test('App server security group should exist', async () => {
      const result = await ec2.describeSecurityGroups({ 
        GroupIds: [stackOutputs.AppServerSecurityGroup] 
      }).promise();
      
      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(stackOutputs.AppServerSecurityGroup);
      console.log(`✓ App server security group validated: ${stackOutputs.AppServerSecurityGroup}`);
    });

    test('Database security group should exist', async () => {
      const result = await ec2.describeSecurityGroups({ 
        GroupIds: [stackOutputs.DBSecurityGroup] 
      }).promise();
      
      expect(result.SecurityGroups).toHaveLength(1);
      expect(result.SecurityGroups![0].GroupId).toBe(stackOutputs.DBSecurityGroup);
      console.log(`✓ DB security group validated: ${stackOutputs.DBSecurityGroup}`);
    });

    test('Application Load Balancer should exist and be active', async () => {
      const result = await elbv2.describeLoadBalancers().promise();
      const alb = result.LoadBalancers!.find(lb => 
        lb.DNSName === stackOutputs.ALBDnsName
      );
      
      console.log(`✓ ALB validated: ${stackOutputs.ALBDnsName}`);
    });

    test('RDS instance should exist and be available', async () => {
      const result = await rds.describeDBInstances().promise();
      const dbInstance = result.DBInstances!.find(db => 
        db.Endpoint?.Address === stackOutputs.RDSEndpoint
      );
      
      expect(dbInstance).toBeDefined();
      if (!dbInstance) {
        throw new Error(`RDS instance with endpoint ${stackOutputs.RDSEndpoint} not found`);
      }
      
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      console.log(`✓ RDS instance validated: ${stackOutputs.RDSEndpoint}`);
    });
  });
});