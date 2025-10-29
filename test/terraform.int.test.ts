/**
 * Terraform Integration Tests for Three-Tier VPC Architecture
 * 
 * Tests real AWS resources deployed via Terraform.
 * Uses cfn-outputs/flat-outputs.json for dynamic resource references.
 * No mocking - validates actual AWS SDK calls and resource interactions.
 * 
 * Infrastructure components:
 * - VPC (10.0.0.0/16 with DNS enabled)
 * - 9 Subnets across 3 AZs (3 public, 3 private, 3 database)
 * - Internet Gateway
 * - 3 NAT Gateways (one per AZ)
 * - Route Tables with proper routing
 * - Network ACLs for database isolation
 * - DB Subnet Group for RDS
 */

import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const TEST_TIMEOUT = 90000; // 90 seconds
let deployedResources: any = {};
let awsRegion: string = 'us-west-2'; // Default for this project

// AWS SDK service clients (initialized after region detection)
let ec2: AWS.EC2;
let rds: AWS.RDS;

describe('Terraform Integration Tests - Three-Tier VPC Architecture', () => {
  beforeAll(() => {
    // Step 1: Read deployed resource outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
      deployedResources = JSON.parse(outputsContent);
      console.log('✓ Loaded deployed resources from outputs');
    } else {
      console.warn('⚠ No cfn-outputs/flat-outputs.json found - using environment variables');
      
      // Fallback to environment variables if outputs file doesn't exist
      deployedResources = {
        vpc_id: process.env.VPC_ID,
        public_subnet_ids: process.env.PUBLIC_SUBNET_IDS?.split(','),
        private_subnet_ids: process.env.PRIVATE_SUBNET_IDS?.split(','),
        database_subnet_ids: process.env.DATABASE_SUBNET_IDS?.split(','),
        internet_gateway_id: process.env.INTERNET_GATEWAY_ID,
        nat_gateway_ids: process.env.NAT_GATEWAY_IDS?.split(','),
        db_subnet_group_name: process.env.DB_SUBNET_GROUP_NAME
      };
    }
    
    // Step 2: Configure AWS SDK with correct region
    AWS.config.update({ region: awsRegion });
    console.log(`✓ AWS SDK configured for region: ${awsRegion}`);
    
    // Step 3: Initialize AWS service clients
    ec2 = new AWS.EC2();
    rds = new AWS.RDS();
    console.log('✓ AWS service clients initialized');
  });

  describe('Output Validation Tests', () => {
    test('should have all required outputs defined', () => {
      expect(deployedResources).toBeDefined();
      console.log('✓ Deployed Resources:', Object.keys(deployedResources));
    });

    test('should have VPC ID output', () => {
      expect(deployedResources.vpc_id).toBeDefined();
      expect(typeof deployedResources.vpc_id).toBe('string');
      expect(deployedResources.vpc_id).toMatch(/^vpc-/);
      console.log('✓ VPC ID:', deployedResources.vpc_id);
    });

    test('should have 3 public subnet IDs', () => {
      expect(deployedResources.public_subnet_ids).toBeDefined();
      expect(Array.isArray(deployedResources.public_subnet_ids)).toBe(true);
      expect(deployedResources.public_subnet_ids.length).toBe(3);
      deployedResources.public_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-/);
      });
      console.log('✓ Public Subnets:', deployedResources.public_subnet_ids);
    });

    test('should have 3 private subnet IDs', () => {
      expect(deployedResources.private_subnet_ids).toBeDefined();
      expect(Array.isArray(deployedResources.private_subnet_ids)).toBe(true);
      expect(deployedResources.private_subnet_ids.length).toBe(3);
      deployedResources.private_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-/);
      });
      console.log('✓ Private Subnets:', deployedResources.private_subnet_ids);
    });

    test('should have 3 database subnet IDs', () => {
      expect(deployedResources.database_subnet_ids).toBeDefined();
      expect(Array.isArray(deployedResources.database_subnet_ids)).toBe(true);
      expect(deployedResources.database_subnet_ids.length).toBe(3);
      deployedResources.database_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-/);
      });
      console.log('✓ Database Subnets:', deployedResources.database_subnet_ids);
    });

    test('should have Internet Gateway ID', () => {
      expect(deployedResources.internet_gateway_id).toBeDefined();
      expect(typeof deployedResources.internet_gateway_id).toBe('string');
      expect(deployedResources.internet_gateway_id).toMatch(/^igw-/);
      console.log('✓ Internet Gateway:', deployedResources.internet_gateway_id);
    });

    test('should have 3 NAT Gateway IDs', () => {
      expect(deployedResources.nat_gateway_ids).toBeDefined();
      expect(Array.isArray(deployedResources.nat_gateway_ids)).toBe(true);
      expect(deployedResources.nat_gateway_ids.length).toBe(3);
      deployedResources.nat_gateway_ids.forEach((id: string) => {
        expect(id).toMatch(/^nat-/);
      });
      console.log('✓ NAT Gateways:', deployedResources.nat_gateway_ids);
    });

    test('should have DB subnet group name', () => {
      expect(deployedResources.db_subnet_group_name).toBeDefined();
      expect(typeof deployedResources.db_subnet_group_name).toBe('string');
      expect(deployedResources.db_subnet_group_name.length).toBeGreaterThan(0);
      console.log('✓ DB Subnet Group:', deployedResources.db_subnet_group_name);
    });
  });

  describe('VPC Resource Validation', () => {
    test('should verify VPC exists and is accessible', async () => {
      const vpcId = deployedResources.vpc_id;
      
      const response = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
      console.log('✓ VPC exists and is accessible');
    });

    test('should verify VPC uses 10.0.0.0/16 CIDR block', async () => {
      const vpcId = deployedResources.vpc_id;
      
      const response = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();
      
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      console.log('✓ VPC CIDR block verified: 10.0.0.0/16');
    });

    test('should verify VPC has DNS support enabled', async () => {
      const vpcId = deployedResources.vpc_id;
      
      const response = await ec2.describeVpcAttribute({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      }).promise();
      
      expect(response.EnableDnsSupport?.Value).toBe(true);
      console.log('✓ DNS support enabled');
    });

    test('should verify VPC has DNS hostnames enabled', async () => {
      const vpcId = deployedResources.vpc_id;
      
      const response = await ec2.describeVpcAttribute({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      }).promise();
      
      expect(response.EnableDnsHostnames?.Value).toBe(true);
      console.log('✓ DNS hostnames enabled');
    });

    test('should verify VPC has proper tags', async () => {
      const vpcId = deployedResources.vpc_id;
      
      const response = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();
      
      const tags = response.Vpcs![0].Tags || [];
      const tagKeys = tags.map(tag => tag.Key);
      
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('ManagedBy');
      console.log('✓ VPC has required tags');
    });
  });

  describe('Subnet Configuration Validation', () => {
    test('should verify all 9 subnets exist', async () => {
      const allSubnetIds = [
        ...deployedResources.public_subnet_ids,
        ...deployedResources.private_subnet_ids,
        ...deployedResources.database_subnet_ids
      ];
      
      const response = await ec2.describeSubnets({
        SubnetIds: allSubnetIds
      }).promise();
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(9);
      console.log('✓ All 9 subnets exist');
    });

    test('should verify subnets are distributed across 3 availability zones', async () => {
      const allSubnetIds = [
        ...deployedResources.public_subnet_ids,
        ...deployedResources.private_subnet_ids,
        ...deployedResources.database_subnet_ids
      ];
      
      const response = await ec2.describeSubnets({
        SubnetIds: allSubnetIds
      }).promise();
      
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);
      console.log('✓ Subnets distributed across 3 AZs:', Array.from(azs));
    });

    test('should verify public subnets use correct CIDR blocks', async () => {
      const response = await ec2.describeSubnets({
        SubnetIds: deployedResources.public_subnet_ids
      }).promise();
      
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
      console.log('✓ Public subnet CIDRs verified:', cidrBlocks);
    });

    test('should verify private subnets use correct CIDR blocks', async () => {
      const response = await ec2.describeSubnets({
        SubnetIds: deployedResources.private_subnet_ids
      }).promise();
      
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']);
      console.log('✓ Private subnet CIDRs verified:', cidrBlocks);
    });

    test('should verify database subnets use correct CIDR blocks', async () => {
      const response = await ec2.describeSubnets({
        SubnetIds: deployedResources.database_subnet_ids
      }).promise();
      
      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']);
      console.log('✓ Database subnet CIDRs verified:', cidrBlocks);
    });

    test('should verify public subnets have auto-assign public IP enabled', async () => {
      const response = await ec2.describeSubnets({
        SubnetIds: deployedResources.public_subnet_ids
      }).promise();
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
      console.log('✓ Public subnets auto-assign public IPs');
    });

    test('should verify all subnets have proper tags', async () => {
      const allSubnetIds = [
        ...deployedResources.public_subnet_ids,
        ...deployedResources.private_subnet_ids,
        ...deployedResources.database_subnet_ids
      ];
      
      const response = await ec2.describeSubnets({
        SubnetIds: allSubnetIds
      }).promise();
      
      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const tagKeys = tags.map(tag => tag.Key);
        
        expect(tagKeys).toContain('Name');
        expect(tagKeys).toContain('Tier');
      });
      console.log('✓ All subnets have required tags');
    });
  });

  describe('Internet Gateway Validation', () => {
    test('should verify Internet Gateway exists', async () => {
      const igwId = deployedResources.internet_gateway_id;
      
      const response = await ec2.describeInternetGateways({
        InternetGatewayIds: [igwId]
      }).promise();
      
      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBe(1);
      console.log('✓ Internet Gateway exists');
    });

    test('should verify Internet Gateway is attached to VPC', async () => {
      const igwId = deployedResources.internet_gateway_id;
      const vpcId = deployedResources.vpc_id;
      
      const response = await ec2.describeInternetGateways({
        InternetGatewayIds: [igwId]
      }).promise();
      
      const attachments = response.InternetGateways![0].Attachments || [];
      expect(attachments.length).toBe(1);
      expect(attachments[0].VpcId).toBe(vpcId);
      expect(attachments[0].State).toBe('available');
      console.log('✓ Internet Gateway attached to VPC');
    });
  });

  describe('NAT Gateway Validation', () => {
    test('should verify all 3 NAT Gateways exist', async () => {
      const natIds = deployedResources.nat_gateway_ids;
      
      const response = await ec2.describeNatGateways({
        NatGatewayIds: natIds
      }).promise();
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(3);
      console.log('✓ All 3 NAT Gateways exist');
    });

    test('should verify NAT Gateways are in available state', async () => {
      const natIds = deployedResources.nat_gateway_ids;
      
      const response = await ec2.describeNatGateways({
        NatGatewayIds: natIds
      }).promise();
      
      response.NatGateways!.forEach(nat => {
        expect(nat.State).toBe('available');
      });
      console.log('✓ All NAT Gateways are available');
    });

    test('should verify NAT Gateways are in public subnets', async () => {
      const natIds = deployedResources.nat_gateway_ids;
      const publicSubnetIds = deployedResources.public_subnet_ids;
      
      const response = await ec2.describeNatGateways({
        NatGatewayIds: natIds
      }).promise();
      
      response.NatGateways!.forEach(nat => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
      console.log('✓ NAT Gateways are in public subnets');
    });

    test('should verify each NAT Gateway has an Elastic IP', async () => {
      const natIds = deployedResources.nat_gateway_ids;
      
      const response = await ec2.describeNatGateways({
        NatGatewayIds: natIds
      }).promise();
      
      response.NatGateways!.forEach(nat => {
        expect(nat.NatGatewayAddresses).toBeDefined();
        expect(nat.NatGatewayAddresses!.length).toBeGreaterThan(0);
        expect(nat.NatGatewayAddresses![0].AllocationId).toMatch(/^eipalloc-/);
      });
      console.log('✓ Each NAT Gateway has an Elastic IP');
    });
  });

  describe('Route Table Configuration Validation', () => {
    test('should verify public subnets route to Internet Gateway', async () => {
      const publicSubnetIds = deployedResources.public_subnet_ids;
      const igwId = deployedResources.internet_gateway_id;
      
      for (const subnetId of publicSubnetIds) {
        const response = await ec2.describeRouteTables({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] }
          ]
        }).promise();
        
        expect(response.RouteTables).toBeDefined();
        expect(response.RouteTables!.length).toBeGreaterThan(0);
        
        const routes = response.RouteTables![0].Routes || [];
        const igwRoute = routes.find(route => 
          route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId === igwId
        );
        
        expect(igwRoute).toBeDefined();
      }
      console.log('✓ Public subnets route to Internet Gateway');
    });

    test('should verify private subnets route to NAT Gateways', async () => {
      const privateSubnetIds = deployedResources.private_subnet_ids;
      const natGatewayIds = deployedResources.nat_gateway_ids;
      
      for (const subnetId of privateSubnetIds) {
        const response = await ec2.describeRouteTables({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] }
          ]
        }).promise();
        
        expect(response.RouteTables).toBeDefined();
        expect(response.RouteTables!.length).toBeGreaterThan(0);
        
        const routes = response.RouteTables![0].Routes || [];
        const natRoute = routes.find(route => 
          route.DestinationCidrBlock === '0.0.0.0/0' && 
          natGatewayIds.includes(route.NatGatewayId || '')
        );
        
        expect(natRoute).toBeDefined();
      }
      console.log('✓ Private subnets route to NAT Gateways');
    });

    test('should verify database subnets have no internet routes', async () => {
      const databaseSubnetIds = deployedResources.database_subnet_ids;
      
      for (const subnetId of databaseSubnetIds) {
        const response = await ec2.describeRouteTables({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] }
          ]
        }).promise();
        
        expect(response.RouteTables).toBeDefined();
        expect(response.RouteTables!.length).toBeGreaterThan(0);
        
        const routes = response.RouteTables![0].Routes || [];
        const internetRoute = routes.find(route => 
          route.DestinationCidrBlock === '0.0.0.0/0'
        );
        
        expect(internetRoute).toBeUndefined();
      }
      console.log('✓ Database subnets have no internet routes');
    });

    test('should verify database subnets only have local VPC routes', async () => {
      const databaseSubnetIds = deployedResources.database_subnet_ids;
      const vpcId = deployedResources.vpc_id;
      
      for (const subnetId of databaseSubnetIds) {
        const response = await ec2.describeRouteTables({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] }
          ]
        }).promise();
        
        const routes = response.RouteTables![0].Routes || [];
        
        // All routes should be local (within VPC CIDR)
        routes.forEach(route => {
          if (route.GatewayId) {
            expect(route.GatewayId).toBe('local');
          }
        });
      }
      console.log('✓ Database subnets only have local VPC routes');
    });
  });

  describe('Network ACL Validation', () => {
    test('should verify database subnets have custom Network ACL', async () => {
      const databaseSubnetIds = deployedResources.database_subnet_ids;
      
      const response = await ec2.describeNetworkAcls({
        Filters: [
          { Name: 'association.subnet-id', Values: databaseSubnetIds }
        ]
      }).promise();
      
      expect(response.NetworkAcls).toBeDefined();
      expect(response.NetworkAcls!.length).toBeGreaterThan(0);
      
      // Should not be the default NACL
      const defaultNacl = response.NetworkAcls!.find(nacl => nacl.IsDefault);
      expect(defaultNacl).toBeUndefined();
      
      console.log('✓ Database subnets have custom Network ACL');
    });

    test('should verify Network ACL allows VPC internal traffic', async () => {
      const databaseSubnetIds = deployedResources.database_subnet_ids;
      
      const response = await ec2.describeNetworkAcls({
        Filters: [
          { Name: 'association.subnet-id', Values: databaseSubnetIds }
        ]
      }).promise();
      
      const nacl = response.NetworkAcls![0];
      const ingressEntries = nacl.Entries?.filter(entry => !entry.Egress) || [];
      
      // Should have an allow rule for VPC CIDR (10.0.0.0/16)
      const vpcAllowRule = ingressEntries.find(entry => 
        entry.CidrBlock === '10.0.0.0/16' && entry.RuleAction === 'allow'
      );
      
      expect(vpcAllowRule).toBeDefined();
      console.log('✓ Network ACL allows VPC internal traffic');
    });

    test('should verify Network ACL denies all internet traffic', async () => {
      const databaseSubnetIds = deployedResources.database_subnet_ids;
      
      const response = await ec2.describeNetworkAcls({
        Filters: [
          { Name: 'association.subnet-id', Values: databaseSubnetIds }
        ]
      }).promise();
      
      const nacl = response.NetworkAcls![0];
      const ingressEntries = nacl.Entries?.filter(entry => !entry.Egress) || [];
      
      // Should have a deny rule for all traffic (0.0.0.0/0)
      const denyAllRule = ingressEntries.find(entry => 
        entry.CidrBlock === '0.0.0.0/0' && entry.RuleAction === 'deny'
      );
      
      expect(denyAllRule).toBeDefined();
      console.log('✓ Network ACL denies all internet traffic');
    });
  });

  describe('DB Subnet Group Validation', () => {
    test('should verify DB subnet group exists', async () => {
      const dbSubnetGroupName = deployedResources.db_subnet_group_name;
      
      const response = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: dbSubnetGroupName
      }).promise();
      
      expect(response.DBSubnetGroups).toBeDefined();
      expect(response.DBSubnetGroups!.length).toBe(1);
      console.log('✓ DB subnet group exists');
    });

    test('should verify DB subnet group contains all 3 database subnets', async () => {
      const dbSubnetGroupName = deployedResources.db_subnet_group_name;
      const databaseSubnetIds = deployedResources.database_subnet_ids;
      
      const response = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: dbSubnetGroupName
      }).promise();
      
      const subnetGroup = response.DBSubnetGroups![0];
      const subnetIds = subnetGroup.Subnets?.map(subnet => subnet.SubnetIdentifier) || [];
      
      expect(subnetIds.length).toBe(3);
      databaseSubnetIds.forEach((id: string) => {
        expect(subnetIds).toContain(id);
      });
      console.log('✓ DB subnet group contains all database subnets');
    });

    test('should verify DB subnet group spans multiple AZs', async () => {
      const dbSubnetGroupName = deployedResources.db_subnet_group_name;
      
      const response = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: dbSubnetGroupName
      }).promise();
      
      const subnetGroup = response.DBSubnetGroups![0];
      const azs = new Set(subnetGroup.Subnets?.map(subnet => subnet.SubnetAvailabilityZone?.Name));
      
      expect(azs.size).toBe(3);
      console.log('✓ DB subnet group spans 3 availability zones');
    });

    test('should verify DB subnet group is in correct VPC', async () => {
      const dbSubnetGroupName = deployedResources.db_subnet_group_name;
      const vpcId = deployedResources.vpc_id;
      
      const response = await rds.describeDBSubnetGroups({
        DBSubnetGroupName: dbSubnetGroupName
      }).promise();
      
      const subnetGroup = response.DBSubnetGroups![0];
      expect(subnetGroup.VpcId).toBe(vpcId);
      console.log('✓ DB subnet group is in correct VPC');
    });
  });

  describe('Security and Compliance Validation', () => {
    test('should verify VPC has proper tagging for compliance', async () => {
      const vpcId = deployedResources.vpc_id;
      
      const response = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();
      
      const tags = response.Vpcs![0].Tags || [];
      const tagMap: { [key: string]: string } = {};
      tags.forEach(tag => {
        if (tag.Key) tagMap[tag.Key] = tag.Value || '';
      });
      
      expect(tagMap['Environment']).toBeDefined();
      expect(tagMap['Project']).toBeDefined();
      expect(tagMap['CostCenter']).toBeDefined();
      expect(tagMap['ManagedBy']).toBe('Terraform');
      console.log('✓ VPC has proper compliance tags');
    });

    test('should verify no database subnet has internet connectivity', async () => {
      const databaseSubnetIds = deployedResources.database_subnet_ids;
      
      for (const subnetId of databaseSubnetIds) {
        const response = await ec2.describeRouteTables({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] }
          ]
        }).promise();
        
        const routes = response.RouteTables![0].Routes || [];
        const hasInternetRoute = routes.some(route => 
          route.DestinationCidrBlock === '0.0.0.0/0' && 
          (route.GatewayId?.startsWith('igw-') || route.NatGatewayId?.startsWith('nat-'))
        );
        
        expect(hasInternetRoute).toBe(false);
      }
      console.log('✓ Database subnets have no internet connectivity');
    });

    test('should verify NAT Gateways provide outbound-only access', async () => {
      const privateSubnetIds = deployedResources.private_subnet_ids;
      
      for (const subnetId of privateSubnetIds) {
        const response = await ec2.describeRouteTables({
          Filters: [
            { Name: 'association.subnet-id', Values: [subnetId] }
          ]
        }).promise();
        
        const routes = response.RouteTables![0].Routes || [];
        const natRoute = routes.find(route => 
          route.DestinationCidrBlock === '0.0.0.0/0' && 
          route.NatGatewayId?.startsWith('nat-')
        );
        
        expect(natRoute).toBeDefined();
        expect(natRoute!.GatewayId).toBeUndefined(); // Should NOT have IGW
      }
      console.log('✓ Private subnets use NAT for outbound-only access');
    });

    test('should verify all resources exist in us-west-2 region', async () => {
      const vpcId = deployedResources.vpc_id;
      
      // VPC describe call already using us-west-2 from beforeAll
      const response = await ec2.describeVpcs({
        VpcIds: [vpcId]
      }).promise();
      
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      console.log('✓ All resources confirmed in us-west-2 region');
    });
  });

  describe('High Availability Validation', () => {
    test('should verify resources are distributed across exactly 3 AZs', async () => {
      const allSubnetIds = [
        ...deployedResources.public_subnet_ids,
        ...deployedResources.private_subnet_ids,
        ...deployedResources.database_subnet_ids
      ];
      
      const response = await ec2.describeSubnets({
        SubnetIds: allSubnetIds
      }).promise();
      
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBe(3);
      
      const azArray = Array.from(azs);
      expect(azArray.some(az => az === 'us-west-2a')).toBe(true);
      expect(azArray.some(az => az === 'us-west-2b')).toBe(true);
      expect(azArray.some(az => az === 'us-west-2c')).toBe(true);
      
      console.log('✓ Resources distributed across us-west-2a, us-west-2b, us-west-2c');
    });

    test('should verify each AZ has one NAT Gateway', async () => {
      const natIds = deployedResources.nat_gateway_ids;
      
      const response = await ec2.describeNatGateways({
        NatGatewayIds: natIds
      }).promise();
      
      // Get subnets to find their AZs
      const subnetIds = response.NatGateways!.map(nat => nat.SubnetId!);
      const subnetResponse = await ec2.describeSubnets({
        SubnetIds: subnetIds
      }).promise();
      
      const natAZs = subnetResponse.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAZs = new Set(natAZs);
      
      expect(uniqueAZs.size).toBe(3);
      console.log('✓ Each AZ has one NAT Gateway for high availability');
    });

    test('should verify each tier has subnets in all 3 AZs', async () => {
      // Check public subnets
      let response = await ec2.describeSubnets({
        SubnetIds: deployedResources.public_subnet_ids
      }).promise();
      let azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
      
      // Check private subnets
      response = await ec2.describeSubnets({
        SubnetIds: deployedResources.private_subnet_ids
      }).promise();
      azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
      
      // Check database subnets
      response = await ec2.describeSubnets({
        SubnetIds: deployedResources.database_subnet_ids
      }).promise();
      azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(3);
      
      console.log('✓ Each tier has subnets in all 3 AZs');
    });
  });
});
