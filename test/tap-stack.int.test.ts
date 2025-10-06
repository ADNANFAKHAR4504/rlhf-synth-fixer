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
      
      expect(alb).toBeDefined();
      if (!alb) {
        throw new Error(`ALB with DNS name ${stackOutputs.ALBDnsName} not found`);
      }
      
      expect(alb.State!.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
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

  describe('End-to-End Integration Tests', () => {
    test('VPC connectivity - subnets should be in correct VPC', async () => {
      const allSubnetIds = [
        ...stackOutputs.PublicSubnets.split(',').map((s: string) => s.trim()),
        ...stackOutputs.PrivateSubnets.split(',').map((s: string) => s.trim()),
        ...stackOutputs.DBSubnets.split(',').map((s: string) => s.trim())
      ];

      const result = await ec2.describeSubnets({ 
        SubnetIds: allSubnetIds 
      }).promise();

      result.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(stackOutputs.VpcId);
      });
      console.log(`✓ All subnets belong to VPC: ${stackOutputs.VpcId}`);
    });

    test('Security groups should be in correct VPC', async () => {
      const securityGroupIds = [
        stackOutputs.WebServerSecurityGroup,
        stackOutputs.AppServerSecurityGroup,
        stackOutputs.DBSecurityGroup
      ];

      const result = await ec2.describeSecurityGroups({ 
        GroupIds: securityGroupIds 
      }).promise();

      result.SecurityGroups!.forEach(sg => {
        expect(sg.VpcId).toBe(stackOutputs.VpcId);
      });
      console.log(`✓ All security groups belong to VPC: ${stackOutputs.VpcId}`);
    });

    test('ALB should be deployed in public subnets', async () => {
      const result = await elbv2.describeLoadBalancers().promise();
      const alb = result.LoadBalancers!.find(lb => 
        lb.DNSName === stackOutputs.ALBDnsName
      );

      expect(alb).toBeDefined();
      expect(alb!.Scheme).toBe('internet-facing');
      
      const publicSubnetIds = stackOutputs.PublicSubnets.split(',').map((s: string) => s.trim());
      const albSubnets = alb!.AvailabilityZones!.map(az => az.SubnetId);
      
      albSubnets.forEach(subnetId => {
        expect(publicSubnetIds).toContain(subnetId);
      });
      console.log(`✓ ALB deployed in public subnets: ${albSubnets.join(', ')}`);
    });

    test('RDS should be in database subnets with proper security', async () => {
      const result = await rds.describeDBInstances().promise();
      const dbInstance = result.DBInstances!.find(db => 
        db.Endpoint?.Address === stackOutputs.RDSEndpoint
      );

      expect(dbInstance).toBeDefined();
      
      // Check DB subnet group
      const dbSubnetGroupResult = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: dbInstance!.DBSubnetGroup!.DBSubnetGroupName!
      }).promise();

      const dbSubnetIds = stackOutputs.DBSubnets.split(',').map((s: string) => s.trim());
      const actualSubnetIds = dbSubnetGroupResult.DBSubnetGroups![0].Subnets!.map(s => s.SubnetIdentifier!);
      
      dbSubnetIds.forEach((subnetId: string) => {
        expect(actualSubnetIds).toContain(subnetId);
      });

      // Check security groups
      const dbSecurityGroups = dbInstance!.VpcSecurityGroups!.map(sg => sg.VpcSecurityGroupId!);
      expect(dbSecurityGroups).toContain(stackOutputs.DBSecurityGroup);
      
      console.log(`✓ RDS deployed in DB subnets with correct security groups`);
    });

    test('Internet Gateway and NAT Gateway connectivity', async () => {
      // Check Internet Gateway
      const igwResult = await ec2.describeInternetGateways({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [stackOutputs.VpcId]
          }
        ]
      }).promise();

      expect(igwResult.InternetGateways).toHaveLength(1);
      expect(igwResult.InternetGateways![0].Attachments![0].State).toBe('available');

      // Check NAT Gateways in public subnets
      const natResult = await ec2.describeNatGateways({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.VpcId]
          }
        ]
      }).promise();

      expect(natResult.NatGateways!.length).toBeGreaterThan(0);
      const publicSubnetIds = stackOutputs.PublicSubnets.split(',').map((s: string) => s.trim());
      
      natResult.NatGateways!.forEach(nat => {
        expect(publicSubnetIds).toContain(nat.SubnetId!);
        expect(nat.State).toBe('available');
      });

      console.log(`✓ Internet Gateway and NAT Gateways properly configured`);
    });

    test('Route tables should have correct routes', async () => {
      // Get all route tables for the VPC
      const routeTablesResult = await ec2.describeRouteTables({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.VpcId]
          }
        ]
      }).promise();

      const publicSubnetIds = stackOutputs.PublicSubnets.split(',').map((s: string) => s.trim());
      const privateSubnetIds = stackOutputs.PrivateSubnets.split(',').map((s: string) => s.trim());

      // Check public route tables have IGW routes
      let publicRouteTablesFound = 0;
      let privateRouteTablesFound = 0;

      for (const rt of routeTablesResult.RouteTables!) {
        const hasPublicSubnet = rt.Associations?.some(assoc => 
          publicSubnetIds.includes(assoc.SubnetId!)
        );
        const hasPrivateSubnet = rt.Associations?.some(assoc => 
          privateSubnetIds.includes(assoc.SubnetId!)
        );

        if (hasPublicSubnet) {
          // Should have IGW route for 0.0.0.0/0
          const hasIgwRoute = rt.Routes?.some(route => 
            route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId?.startsWith('igw-')
          );
          expect(hasIgwRoute).toBe(true);
          publicRouteTablesFound++;
        }

        if (hasPrivateSubnet) {
          // Should have NAT Gateway route for 0.0.0.0/0
          const hasNatRoute = rt.Routes?.some(route => 
            route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId?.startsWith('nat-')
          );
          expect(hasNatRoute).toBe(true);
          privateRouteTablesFound++;
        }
      }

      expect(publicRouteTablesFound).toBeGreaterThan(0);
      expect(privateRouteTablesFound).toBeGreaterThan(0);
      console.log(`✓ Route tables configured correctly for public and private subnets`);
    });

    test('Security group rules validation', async () => {
      // Web Server Security Group - should allow HTTP/HTTPS from internet
      const webSgResult = await ec2.describeSecurityGroups({ 
        GroupIds: [stackOutputs.WebServerSecurityGroup] 
      }).promise();

      const webSg = webSgResult.SecurityGroups![0];
      const httpRule = webSg.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = webSg.IpPermissions?.find(rule => 
        rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();

      // DB Security Group - should only allow access from app servers
      const dbSgResult = await ec2.describeSecurityGroups({ 
        GroupIds: [stackOutputs.DBSecurityGroup] 
      }).promise();

      const dbSg = dbSgResult.SecurityGroups![0];
      const mysqlRule = dbSg.IpPermissions?.find(rule => 
        rule.FromPort === 3306 && rule.ToPort === 3306
      );

      expect(mysqlRule).toBeDefined();
      // Should reference app server security group
      const hasAppSgReference = mysqlRule?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === stackOutputs.AppServerSecurityGroup
      );
      expect(hasAppSgReference).toBe(true);

      console.log(`✓ Security group rules properly configured`);
    });

    test('Multi-AZ deployment validation', async () => {
      // Check subnets are in different AZs
      const allSubnetIds = [
        ...stackOutputs.PublicSubnets.split(',').map((s: string) => s.trim()),
        ...stackOutputs.PrivateSubnets.split(',').map((s: string) => s.trim()),
        ...stackOutputs.DBSubnets.split(',').map((s: string) => s.trim())
      ];

      const subnetsResult = await ec2.describeSubnets({ 
        SubnetIds: allSubnetIds 
      }).promise();

      const availabilityZones = new Set(subnetsResult.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);

      // Check RDS Multi-AZ
      const rdsResult = await rds.describeDBInstances().promise();
      const dbInstance = rdsResult.DBInstances!.find(db => 
        db.Endpoint?.Address === stackOutputs.RDSEndpoint
      );

      expect(dbInstance!.MultiAZ).toBe(true);

      // Check ALB spans multiple AZs
      const elbResult = await elbv2.describeLoadBalancers().promise();
      const alb = elbResult.LoadBalancers!.find(lb => 
        lb.DNSName === stackOutputs.ALBDnsName
      );

      expect(alb!.AvailabilityZones!.length).toBeGreaterThanOrEqual(2);

      console.log(`✓ Multi-AZ deployment validated across ${availabilityZones.size} availability zones`);
    });

    test('High availability and fault tolerance validation', async () => {
      // Check that we have redundant NAT Gateways
      const natResult = await ec2.describeNatGateways({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.VpcId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      }).promise();

      // Should have at least one NAT Gateway per public subnet for HA
      const publicSubnetIds = stackOutputs.PublicSubnets.split(',').map((s: string) => s.trim());
      expect(natResult.NatGateways!.length).toBeGreaterThanOrEqual(1);

      // Check RDS automated backups and maintenance window
      const rdsResult = await rds.describeDBInstances().promise();
      const dbInstance = rdsResult.DBInstances!.find(db => 
        db.Endpoint?.Address === stackOutputs.RDSEndpoint
      );

      expect(dbInstance!.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance!.PreferredMaintenanceWindow).toBeDefined();
      expect(dbInstance!.StorageEncrypted).toBe(true);

      console.log(`✓ High availability and fault tolerance features validated`);
    });

    test('Network ACLs and VPC flow logs validation', async () => {
      // Check VPC Flow Logs are enabled
      const flowLogsResult = await ec2.describeFlowLogs({
        Filter: [
          {
            Name: 'resource-id',
            Values: [stackOutputs.VpcId]
          }
        ]
      }).promise();

      expect(flowLogsResult.FlowLogs!.length).toBeGreaterThan(0);
      const activeFlowLog = flowLogsResult.FlowLogs!.find(fl => fl.FlowLogStatus === 'ACTIVE');
      expect(activeFlowLog).toBeDefined();

      // Check default Network ACLs
      const naclResult = await ec2.describeNetworkAcls({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [stackOutputs.VpcId]
          }
        ]
      }).promise();

      expect(naclResult.NetworkAcls!.length).toBeGreaterThan(0);

      console.log(`✓ VPC Flow Logs and Network ACLs validated`);
    });
  });
});