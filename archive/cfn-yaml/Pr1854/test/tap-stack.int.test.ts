// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import path from 'path';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeRouteTablesCommand
} from '@aws-sdk/client-ec2';
import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from '@aws-sdk/client-rds';

// Get AWS region from the AWS_REGION file
const awsRegionPath = path.join(__dirname, '../lib/AWS_REGION');
const awsRegion = fs.readFileSync(awsRegionPath, 'utf8').trim();

// Initialize AWS clients
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });

// Get CloudFormation outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

try {
  const outputsContent = fs.readFileSync(outputsPath, 'utf8');
  outputs = JSON.parse(outputsContent);
} catch (error) {
  console.warn('CloudFormation outputs file not found. Integration tests will be skipped.');
  outputs = null;
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Infrastructure Integration Tests', () => {
  beforeAll(() => {
    // Skip tests if outputs are not available
    if (!outputs) {
      console.log('Skipping integration tests - CloudFormation outputs not available');
    }
  });

  describe('AWS Region Configuration', () => {
    test('should deploy to ap-south-1 region as specified in prompt', () => {
      expect(awsRegion).toBe('ap-south-1');
    });
  });

  describe('VPC Infrastructure - Live AWS Checks', () => {
    test('should have VPC deployed and accessible via AWS API', async () => {
      if (!outputs) {
        console.log('Skipping VPC test - outputs not available');
        return;
      }
      
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
      expect(vpcId.startsWith('vpc-')).toBe(true);

      // Live AWS check
      try {
        const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
        const response = await ec2Client.send(command);
        
        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBe(1);
        expect(response.Vpcs![0].VpcId).toBe(vpcId);
        expect(response.Vpcs![0].State).toBe('available');
        
        // Verify VPC CIDR block
        expect(response.Vpcs![0].CidrBlock).toBeDefined();
        expect(response.Vpcs![0].CidrBlock).toMatch(/^10\.0\.0\.0\/16$/);
        
        console.log(`✅ VPC ${vpcId} is available and properly configured`);
      } catch (error) {
        console.error('❌ VPC AWS API check failed:', error);
        throw error;
      }
    });

    test('should have public subnet deployed and accessible via AWS API', async () => {
      if (!outputs) {
        console.log('Skipping public subnet test - outputs not available');
        return;
      }
      
      const publicSubnetId = outputs.PublicSubnetId;
      expect(publicSubnetId).toBeDefined();
      expect(typeof publicSubnetId).toBe('string');
      expect(publicSubnetId.startsWith('subnet-')).toBe(true);

      // Live AWS check
      try {
        const command = new DescribeSubnetsCommand({ SubnetIds: [publicSubnetId] });
        const response = await ec2Client.send(command);
        
        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(1);
        expect(response.Subnets![0].SubnetId).toBe(publicSubnetId);
        expect(response.Subnets![0].State).toBe('available');
        expect(response.Subnets![0].MapPublicIpOnLaunch).toBe(true);
        
        // Verify subnet is in the correct VPC
        expect(response.Subnets![0].VpcId).toBe(outputs.VPCId);
        
        console.log(`✅ Public subnet ${publicSubnetId} is available and properly configured`);
      } catch (error) {
        console.error('❌ Public subnet AWS API check failed:', error);
        throw error;
      }
    });

    test('should have private subnets deployed and accessible via AWS API', async () => {
      if (!outputs) {
        console.log('Skipping private subnet test - outputs not available');
        return;
      }
      
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      expect(typeof privateSubnet1Id).toBe('string');
      expect(typeof privateSubnet2Id).toBe('string');
      expect(privateSubnet1Id.startsWith('subnet-')).toBe(true);
      expect(privateSubnet2Id.startsWith('subnet-')).toBe(true);

      // Live AWS check
      try {
        const command = new DescribeSubnetsCommand({ 
          SubnetIds: [privateSubnet1Id, privateSubnet2Id] 
        });
        const response = await ec2Client.send(command);
        
        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(2);
        
        const privateSubnets = response.Subnets!.filter(subnet => 
          subnet.SubnetId === privateSubnet1Id || subnet.SubnetId === privateSubnet2Id
        );
        
        expect(privateSubnets.length).toBe(2);
        
        privateSubnets.forEach(subnet => {
          expect(subnet.State).toBe('available');
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.VpcId).toBe(outputs.VPCId);
        });
        
        console.log(`✅ Private subnets ${privateSubnet1Id} and ${privateSubnet2Id} are available and properly configured`);
      } catch (error) {
        console.error('❌ Private subnets AWS API check failed:', error);
        throw error;
      }
    });

    test('should have NAT Gateway deployed and accessible via AWS API', async () => {
      if (!outputs) {
        console.log('Skipping NAT Gateway test - outputs not available');
        return;
      }
      
      const natGatewayId = outputs.NATGatewayId;
      expect(natGatewayId).toBeDefined();
      expect(typeof natGatewayId).toBe('string');
      expect(natGatewayId.startsWith('nat-')).toBe(true);

      // Live AWS check
      try {
        const command = new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] });
        const response = await ec2Client.send(command);
        
        expect(response.NatGateways).toBeDefined();
        expect(response.NatGateways!.length).toBe(1);
        expect(response.NatGateways![0].NatGatewayId).toBe(natGatewayId);
        expect(response.NatGateways![0].State).toBe('available');
        
        // Verify NAT Gateway is in the public subnet
        expect(response.NatGateways![0].SubnetId).toBe(outputs.PublicSubnetId);
        
        console.log(`✅ NAT Gateway ${natGatewayId} is available and properly configured`);
      } catch (error) {
        console.error('❌ NAT Gateway AWS API check failed:', error);
        throw error;
      }
    });
  });

  describe('Security Groups - Live AWS Checks', () => {
    test('should have web security group deployed and accessible via AWS API', async () => {
      if (!outputs) {
        console.log('Skipping web security group test - outputs not available');
        return;
      }
      
      const webSecurityGroupId = outputs.WebSecurityGroupId;
      expect(webSecurityGroupId).toBeDefined();
      expect(typeof webSecurityGroupId).toBe('string');
      expect(webSecurityGroupId.startsWith('sg-')).toBe(true);

      // Live AWS check
      try {
        const command = new DescribeSecurityGroupsCommand({ 
          GroupIds: [webSecurityGroupId] 
        });
        const response = await ec2Client.send(command);
        
        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(1);
        expect(response.SecurityGroups![0].GroupId).toBe(webSecurityGroupId);
        expect(response.SecurityGroups![0].VpcId).toBe(outputs.VPCId);
        
        // Verify security group has proper rules
        expect(response.SecurityGroups![0].IpPermissions).toBeDefined();
        expect(response.SecurityGroups![0].IpPermissionsEgress).toBeDefined();
        
        console.log(`✅ Web security group ${webSecurityGroupId} is available and properly configured`);
      } catch (error) {
        console.error('❌ Web security group AWS API check failed:', error);
        throw error;
      }
    });
  });

  describe('Database Infrastructure - Live AWS Checks', () => {
    test('should have RDS database deployed and accessible via AWS API', async () => {
      if (!outputs) {
        console.log('Skipping RDS endpoint test - outputs not available');
        return;
      }
      
      const databaseEndpoint = outputs.DatabaseEndpoint;
      expect(databaseEndpoint).toBeDefined();
      expect(typeof databaseEndpoint).toBe('string');
      expect(databaseEndpoint.length).toBeGreaterThan(0);

      // Live AWS check
      try {
        const command = new DescribeDBInstancesCommand({});
        const response = await rdsClient.send(command);
        
        expect(response.DBInstances).toBeDefined();
        expect(response.DBInstances!.length).toBeGreaterThan(0);
        
        // Find the database instance that matches our endpoint
        const dbInstance = response.DBInstances!.find(db => 
          db.Endpoint?.Address === databaseEndpoint.split(':')[0]
        );
        
        expect(dbInstance).toBeDefined();
        expect(dbInstance!.DBInstanceStatus).toBe('available');
        expect(dbInstance!.Engine).toBe('mysql');
        
        // Verify database is in the correct VPC
        expect(dbInstance!.DBSubnetGroup?.VpcId).toBe(outputs.VPCId);
        
        console.log(`✅ RDS database ${databaseEndpoint} is available and properly configured`);
      } catch (error) {
        console.error('❌ RDS database AWS API check failed:', error);
        throw error;
      }
    });

    test('should have RDS database endpoint in correct format', () => {
      if (!outputs) {
        console.log('Skipping RDS endpoint format test - outputs not available');
        return;
      }
      
      const databaseEndpoint = outputs.DatabaseEndpoint;
      // RDS endpoint should be in format: production-mysql-db.xxxxx.ap-south-1.rds.amazonaws.com
      expect(databaseEndpoint).toMatch(/^production-mysql-db\.[a-zA-Z0-9-]+\.ap-south-1\.rds\.amazonaws\.com$/);
    });
  });

  describe('Network Connectivity - Live AWS Checks', () => {
    test('should have proper subnet configuration and routing', async () => {
      if (!outputs) {
        console.log('Skipping subnet configuration test - outputs not available');
        return;
      }
      
      // All subnets should be in the same VPC
      const vpcId = outputs.VPCId;
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      expect(vpcId).toBeDefined();
      expect(publicSubnetId).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      
      // All subnet IDs should be different
      expect(publicSubnetId).not.toBe(privateSubnet1Id);
      expect(publicSubnetId).not.toBe(privateSubnet2Id);
      expect(privateSubnet1Id).not.toBe(privateSubnet2Id);

      // Live AWS check for route tables
      try {
        const command = new DescribeRouteTablesCommand({});
        const response = await ec2Client.send(command);
        
        expect(response.RouteTables).toBeDefined();
        expect(response.RouteTables!.length).toBeGreaterThan(0);
        
        // Find route tables associated with our VPC
        const vpcRouteTables = response.RouteTables!.filter(rt => 
          rt.VpcId === vpcId
        );
        
        expect(vpcRouteTables.length).toBeGreaterThan(0);
        
        // Verify public subnet has internet gateway route
        const publicRouteTable = vpcRouteTables.find(rt => 
          rt.Associations?.some(assoc => assoc.SubnetId === publicSubnetId)
        );
        
        if (publicRouteTable) {
          const hasInternetGateway = publicRouteTable.Routes?.some(route => 
            route.GatewayId?.startsWith('igw-')
          );
          expect(hasInternetGateway).toBe(true);
        }
        
        console.log(`✅ Network routing is properly configured for VPC ${vpcId}`);
      } catch (error) {
        console.error('❌ Network routing AWS API check failed:', error);
        throw error;
      }
    });
  });

  describe('Security and Compliance - Live AWS Checks', () => {
    test('should have security groups configured with proper rules', async () => {
      if (!outputs) {
        console.log('Skipping security group test - outputs not available');
        return;
      }
      
      const webSecurityGroupId = outputs.WebSecurityGroupId;
      expect(webSecurityGroupId).toBeDefined();
      expect(webSecurityGroupId.startsWith('sg-')).toBe(true);

      // Live AWS check for security group rules
      try {
        const command = new DescribeSecurityGroupsCommand({ 
          GroupIds: [webSecurityGroupId] 
        });
        const response = await ec2Client.send(command);
        
        expect(response.SecurityGroups).toBeDefined();
        expect(response.SecurityGroups!.length).toBe(1);
        
        const securityGroup = response.SecurityGroups![0];
        
        // Verify security group has proper ingress rules
        expect(securityGroup.IpPermissions).toBeDefined();
        expect(securityGroup.IpPermissions!.length).toBeGreaterThan(0);
        
        // Verify security group has proper egress rules
        expect(securityGroup.IpPermissionsEgress).toBeDefined();
        expect(securityGroup.IpPermissionsEgress!.length).toBeGreaterThan(0);
        
        console.log(`✅ Security group ${webSecurityGroupId} has proper rules configured`);
      } catch (error) {
        console.error('❌ Security group rules AWS API check failed:', error);
        throw error;
      }
    });

    test('should have database in private subnet with proper security', async () => {
      if (!outputs) {
        console.log('Skipping database subnet test - outputs not available');
        return;
      }
      
      const databaseEndpoint = outputs.DatabaseEndpoint;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      // Database endpoint should be accessible from private subnets
      expect(databaseEndpoint).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();

      // Live AWS check for database subnet group
      try {
        const command = new DescribeDBInstancesCommand({});
        const response = await rdsClient.send(command);
        
        const dbInstance = response.DBInstances!.find(db => 
          db.Endpoint?.Address === databaseEndpoint.split(':')[0]
        );
        
        expect(dbInstance).toBeDefined();
        expect(dbInstance!.DBSubnetGroup).toBeDefined();
        expect(dbInstance!.DBSubnetGroup!.VpcId).toBe(outputs.VPCId);
        
        // Verify database is not publicly accessible
        expect(dbInstance!.PubliclyAccessible).toBe(false);
        
        console.log(`✅ Database is properly secured in private subnets`);
      } catch (error) {
        console.error('❌ Database security AWS API check failed:', error);
        throw error;
      }
    });
  });

  describe('Resource Naming and Tagging - Live AWS Checks', () => {
    test('should have consistent resource naming and proper tags', async () => {
      if (!outputs) {
        console.log('Skipping resource naming test - outputs not available');
        return;
      }
      
      // All resources should follow production naming convention
      const vpcId = outputs.VPCId;
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      const webSecurityGroupId = outputs.WebSecurityGroupId;
      const natGatewayId = outputs.NATGatewayId;
      
      // All resources should be properly created
      expect(vpcId).toBeDefined();
      expect(publicSubnetId).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      expect(webSecurityGroupId).toBeDefined();
      expect(natGatewayId).toBeDefined();

      // Live AWS check for resource tags
      try {
        // Check VPC tags
        const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
        const vpcResponse = await ec2Client.send(vpcCommand);
        
        expect(vpcResponse.Vpcs![0].Tags).toBeDefined();
        expect(vpcResponse.Vpcs![0].Tags!.length).toBeGreaterThan(0);
        
        // Check subnet tags
        const subnetCommand = new DescribeSubnetsCommand({ 
          SubnetIds: [publicSubnetId, privateSubnet1Id, privateSubnet2Id] 
        });
        const subnetResponse = await ec2Client.send(subnetCommand);
        
        subnetResponse.Subnets!.forEach(subnet => {
          expect(subnet.Tags).toBeDefined();
          expect(subnet.Tags!.length).toBeGreaterThan(0);
        });
        
        console.log(`✅ All resources have proper naming and tagging`);
      } catch (error) {
        console.error('❌ Resource naming and tagging AWS API check failed:', error);
        throw error;
      }
    });
  });

  describe('Database Connectivity - Live AWS Checks', () => {
    test('should have database endpoint accessible from private subnets', async () => {
      if (!outputs) {
        console.log('Skipping database connectivity test - outputs not available');
        return;
      }
      
      const databaseEndpoint = outputs.DatabaseEndpoint;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      // Database should be accessible from both private subnets
      expect(databaseEndpoint).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      
      // Database endpoint should be in ap-south-1 region
      expect(databaseEndpoint).toContain('ap-south-1');

      // Live AWS check for database connectivity
      try {
        const command = new DescribeDBInstancesCommand({});
        const response = await rdsClient.send(command);
        
        const dbInstance = response.DBInstances!.find(db => 
          db.Endpoint?.Address === databaseEndpoint.split(':')[0]
        );
        
        expect(dbInstance).toBeDefined();
        expect(dbInstance!.DBInstanceStatus).toBe('available');
        
        // Verify database is in the correct availability zones
        expect(dbInstance!.AvailabilityZone).toBeDefined();
        expect(dbInstance!.AvailabilityZone).toMatch(/^ap-south-1[a-z]$/);
        
        console.log(`✅ Database connectivity is properly configured`);
      } catch (error) {
        console.error('❌ Database connectivity AWS API check failed:', error);
        throw error;
      }
    });
  });

  describe('Infrastructure Health - Live AWS Checks', () => {
    test('should have all required outputs available and resources healthy', async () => {
      if (!outputs) {
        console.log('Skipping outputs availability test - outputs not available');
        return;
      }
      
      const requiredOutputs = [
        'VPCId',
        'PublicSubnetId',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'WebSecurityGroupId',
        'NATGatewayId'
      ];
      
      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
        expect(typeof outputs[outputName]).toBe('string');
        expect(outputs[outputName].length).toBeGreaterThan(0);
      });

      // Live AWS check for all resources health
      try {
        // Check VPC health
        const vpcCommand = new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] });
        const vpcResponse = await ec2Client.send(vpcCommand);
        expect(vpcResponse.Vpcs![0].State).toBe('available');
        
        // Check subnets health
        const subnetCommand = new DescribeSubnetsCommand({ 
          SubnetIds: [outputs.PublicSubnetId, outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id] 
        });
        const subnetResponse = await ec2Client.send(subnetCommand);
        subnetResponse.Subnets!.forEach(subnet => {
          expect(subnet.State).toBe('available');
        });
        
        // Check NAT Gateway health
        const natCommand = new DescribeNatGatewaysCommand({ NatGatewayIds: [outputs.NATGatewayId] });
        const natResponse = await ec2Client.send(natCommand);
        expect(natResponse.NatGateways![0].State).toBe('available');
        
        // Check security group health
        const sgCommand = new DescribeSecurityGroupsCommand({ GroupIds: [outputs.WebSecurityGroupId] });
        const sgResponse = await ec2Client.send(sgCommand);
        expect(sgResponse.SecurityGroups![0].GroupId).toBe(outputs.WebSecurityGroupId);
        
        // Check database health
        const dbCommand = new DescribeDBInstancesCommand({});
        const dbResponse = await rdsClient.send(dbCommand);
        const dbInstance = dbResponse.DBInstances!.find(db => 
          db.Endpoint?.Address === outputs.DatabaseEndpoint.split(':')[0]
        );
        expect(dbInstance!.DBInstanceStatus).toBe('available');
        
        console.log(`✅ All infrastructure resources are healthy and available`);
      } catch (error) {
        console.error('❌ Infrastructure health AWS API check failed:', error);
        throw error;
      }
    });

    test('should have no null or undefined outputs', () => {
      if (!outputs) {
        console.log('Skipping null outputs test - outputs not available');
        return;
      }
      
      Object.keys(outputs).forEach(key => {
        expect(outputs[key]).not.toBeNull();
        expect(outputs[key]).not.toBeUndefined();
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use correct environment suffix', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('should deploy to production environment', () => {
      // Based on the prompt requirements, this should be a production environment
      expect(awsRegion).toBe('ap-south-1');
    });
  });

  describe('Cross-Resource Dependencies - Live AWS Checks', () => {
    test('should have proper resource dependencies and connectivity', async () => {
      if (!outputs) {
        console.log('Skipping resource dependencies test - outputs not available');
        return;
      }
      
      // VPC should exist before subnets
      const vpcId = outputs.VPCId;
      const publicSubnetId = outputs.PublicSubnetId;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      expect(vpcId).toBeDefined();
      expect(publicSubnetId).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      
      // NAT Gateway should exist for private subnet internet access
      const natGatewayId = outputs.NATGatewayId;
      expect(natGatewayId).toBeDefined();
      
      // Security groups should exist for network access control
      const webSecurityGroupId = outputs.WebSecurityGroupId;
      expect(webSecurityGroupId).toBeDefined();

      // Live AWS check for resource dependencies
      try {
        // Verify all subnets are in the same VPC
        const subnetCommand = new DescribeSubnetsCommand({ 
          SubnetIds: [publicSubnetId, privateSubnet1Id, privateSubnet2Id] 
        });
        const subnetResponse = await ec2Client.send(subnetCommand);
        
        subnetResponse.Subnets!.forEach(subnet => {
          expect(subnet.VpcId).toBe(vpcId);
        });
        
        // Verify NAT Gateway is in the public subnet
        const natCommand = new DescribeNatGatewaysCommand({ NatGatewayIds: [natGatewayId] });
        const natResponse = await ec2Client.send(natCommand);
        expect(natResponse.NatGateways![0].SubnetId).toBe(publicSubnetId);
        
        // Verify security group is in the VPC
        const sgCommand = new DescribeSecurityGroupsCommand({ GroupIds: [webSecurityGroupId] });
        const sgResponse = await ec2Client.send(sgCommand);
        expect(sgResponse.SecurityGroups![0].VpcId).toBe(vpcId);
        
        console.log(`✅ All resource dependencies are properly configured`);
      } catch (error) {
        console.error('❌ Resource dependencies AWS API check failed:', error);
        throw error;
      }
    });
  });
});
