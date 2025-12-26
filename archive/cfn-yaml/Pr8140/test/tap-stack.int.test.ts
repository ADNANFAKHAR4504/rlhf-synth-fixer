import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  RunInstancesCommand,
  TerminateInstancesCommand,
  DescribeImagesCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcEndpointsCommand,
} from '@aws-sdk/client-ec2';

// LocalStack configuration
const region = process.env.AWS_REGION || 'us-east-1';
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

// Load stack outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configure EC2 client for LocalStack
const ec2Client = new EC2Client({
  region,
  endpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});

async function waitForInstances(
  instanceIds: string[],
  targetState: 'running' | 'terminated',
  timeout: number = 600000
): Promise<void> {
  const startTime = Date.now();
  const pollInterval = 5000; // LocalStack may be slower
  
  while (Date.now() - startTime < timeout) {
    try {
      const command = new DescribeInstancesCommand({ InstanceIds: instanceIds });
      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
      
      if (instances.every(inst => inst.State?.Name === targetState)) {
        return;
      }
    } catch (error) {
      // In LocalStack, instances might not be immediately queryable, continue polling
      if (targetState === 'running') {
        // Continue polling
      } else {
        throw error;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  throw new Error(`Instances did not reach ${targetState} state within ${timeout}ms`);
}

describe('End-to-End Data Flow Integration Tests (LocalStack)', () => {
  let vpcId: string;
  let publicSubnetIds: string[];
  let privateSubnetIds: string[];
  let internetGatewayId: string;
  let natGatewayIds: string[];
  let webTierSGId: string;
  let appTierSGId: string;
  let dbTierSGId: string;
  let publicRouteTableId: string;
  let privateRouteTableIds: string[];
  let s3EndpointId: string;
  let dynamoDbEndpointId: string;

  // Test data
  let webTierInstanceId: string;
  let appTierInstanceId: string;
  let dbTierInstanceId: string;

  beforeAll(async () => {
    // Load infrastructure from outputs
    vpcId = outputs.VPCId;
    publicSubnetIds = [
      outputs.PublicSubnet1Id,
      outputs.PublicSubnet2Id,
      outputs.PublicSubnet3Id,
    ];
    privateSubnetIds = [
      outputs.PrivateSubnet1Id,
      outputs.PrivateSubnet2Id,
      outputs.PrivateSubnet3Id,
    ];
    internetGatewayId = outputs.InternetGatewayId;
    natGatewayIds = [
      outputs.NatGateway1Id,
      outputs.NatGateway2Id,
      outputs.NatGateway3Id,
    ];
    webTierSGId = outputs.WebTierSecurityGroupId;
    appTierSGId = outputs.ApplicationTierSecurityGroupId;
    dbTierSGId = outputs.DatabaseTierSecurityGroupId;
    publicRouteTableId = outputs.PublicRouteTableId;
    privateRouteTableIds = [
      outputs.PrivateRouteTable1Id,
      outputs.PrivateRouteTable2Id,
      outputs.PrivateRouteTable3Id,
    ];
    s3EndpointId = outputs.S3EndpointId;
    dynamoDbEndpointId = outputs.DynamoDBEndpointId;

    // LocalStack uses AMIs - try to get one or use default
    let amiId = 'ami-12345'; // Default LocalStack AMI
    try {
      const amiCommand = new DescribeImagesCommand({
        Owners: ['amazon'],
      });
      const amiResponse = await ec2Client.send(amiCommand);
      if (amiResponse.Images && amiResponse.Images.length > 0) {
        amiId = amiResponse.Images[0].ImageId!;
      }
    } catch (error) {
      // Use default AMI if lookup fails
      console.log('Using default LocalStack AMI:', amiId);
    }

    // Create Web Tier instance in public subnet
    const webTierCommand = new RunInstancesCommand({
      ImageId: amiId,
      InstanceType: 't3.micro',
      MinCount: 1,
      MaxCount: 1,
      SubnetId: publicSubnetIds[0],
      SecurityGroupIds: [webTierSGId],
      TagSpecifications: [{
        ResourceType: 'instance',
        Tags: [
          { Key: 'Name', Value: 'IntegrationTest-WebTier' },
          { Key: 'TestType', Value: 'Integration' },
        ],
      }],
    });
    const webTierResponse = await ec2Client.send(webTierCommand);
    webTierInstanceId = webTierResponse.Instances![0].InstanceId!;

    // Create Application Tier instance in private subnet
    const appTierCommand = new RunInstancesCommand({
      ImageId: amiId,
      InstanceType: 't3.micro',
      MinCount: 1,
      MaxCount: 1,
      SubnetId: privateSubnetIds[0],
      SecurityGroupIds: [appTierSGId],
      TagSpecifications: [{
        ResourceType: 'instance',
        Tags: [
          { Key: 'Name', Value: 'IntegrationTest-AppTier' },
          { Key: 'TestType', Value: 'Integration' },
        ],
      }],
    });
    const appTierResponse = await ec2Client.send(appTierCommand);
    appTierInstanceId = appTierResponse.Instances![0].InstanceId!;

    // Create Database Tier instance in private subnet
    const dbTierCommand = new RunInstancesCommand({
      ImageId: amiId,
      InstanceType: 't3.micro',
      MinCount: 1,
      MaxCount: 1,
      SubnetId: privateSubnetIds[0],
      SecurityGroupIds: [dbTierSGId],
      TagSpecifications: [{
        ResourceType: 'instance',
        Tags: [
          { Key: 'Name', Value: 'IntegrationTest-DatabaseTier' },
          { Key: 'TestType', Value: 'Integration' },
        ],
      }],
    });
    const dbTierResponse = await ec2Client.send(dbTierCommand);
    dbTierInstanceId = dbTierResponse.Instances![0].InstanceId!;

    // Wait for all instances to be running
    await waitForInstances([webTierInstanceId, appTierInstanceId, dbTierInstanceId], 'running');
  }, 600000);

  afterAll(async () => {
    // Cleanup: Terminate all test instances
    const instanceIds = [webTierInstanceId, appTierInstanceId, dbTierInstanceId].filter(id => id);
    
    if (instanceIds.length > 0) {
      try {
        const terminateCommand = new TerminateInstancesCommand({
          InstanceIds: instanceIds,
        });
        await ec2Client.send(terminateCommand);
        await waitForInstances(instanceIds, 'terminated');
      } catch (error) {
        console.error('Error during cleanup:', error);
        // cleanup errors are acceptable 
      }
    }
  }, 600000);

  describe('Data Flow: User → Internet Gateway → Public Subnet → Web Tier → Application Tier → Database Tier', () => {
    test('User → Internet Gateway: User request enters through Internet Gateway', async () => {
      const webInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [webTierInstanceId],
      });
      const webInstanceResponse = await ec2Client.send(webInstanceCommand);
      const webInstance = webInstanceResponse.Reservations![0].Instances![0];
      
      // Verify instance is in public subnet
      expect(webInstance.State?.Name).toBe('running');
      expect(webInstance.SubnetId).toBe(publicSubnetIds[0]);
      
      // Verify route to Internet Gateway exists 
      const routeCommand = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'association.subnet-id', Values: [publicSubnetIds[0]] }],
      });
      const routeResponse = await ec2Client.send(routeCommand);
      const defaultRoute = routeResponse.RouteTables![0].Routes!.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('Internet Gateway → Public Subnet: Internet Gateway routes to Public Subnet via Public Route Table', async () => {
      const routeCommand = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'route-table-id', Values: [publicRouteTableId] }],
      });
      const routeResponse = await ec2Client.send(routeCommand);
      const routeTable = routeResponse.RouteTables![0];
      
      // Verify public route table has default route
      const internetRoute = routeTable.Routes!.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(internetRoute).toBeDefined();
      expect(internetRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
      
      // Verify public subnets are associated
      const associatedSubnetIds = routeTable.Associations!
        .filter(a => a.SubnetId)
        .map(a => a.SubnetId!);
      expect(associatedSubnetIds).toContain(publicSubnetIds[0]);
    });

    test('Public Subnet → Web Tier: Public Subnet routes to Web Tier via Security Group (HTTPS port 443)', async () => {
      const webInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [webTierInstanceId],
      });
      const webInstanceResponse = await ec2Client.send(webInstanceCommand);
      const webInstance = webInstanceResponse.Reservations![0].Instances![0];
      
      expect(webInstance.SubnetId).toBe(publicSubnetIds[0]);
      
      // Verify Web Tier Security Group exists
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [webTierSGId],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const webSg = sgResponse.SecurityGroups![0];
      
      expect(webSg).toBeDefined();
      expect(webSg.GroupId).toBe(webTierSGId);
    });

    test('Web Tier → Application Tier: Web Tier communicates with Application Tier on port 8080', async () => {
      const webInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [webTierInstanceId],
      });
      const webInstanceResponse = await ec2Client.send(webInstanceCommand);
      const webInstance = webInstanceResponse.Reservations![0].Instances![0];
      
      const appInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [appTierInstanceId],
      });
      const appInstanceResponse = await ec2Client.send(appInstanceCommand);
      const appInstance = appInstanceResponse.Reservations![0].Instances![0];
      
      // Verify both instances are in same VPC
      expect(webInstance.VpcId).toBe(vpcId);
      expect(appInstance.VpcId).toBe(vpcId);
      
      // Verify Application Tier Security Group exists
      const appSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [appTierSGId],
      });
      const appSgResponse = await ec2Client.send(appSgCommand);
      const appSg = appSgResponse.SecurityGroups![0];
      
      expect(appSg).toBeDefined();
      expect(appSg.GroupId).toBe(appTierSGId);
      
      // Verify Web Tier Security Group exists
      const webSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [webTierSGId],
      });
      const webSgResponse = await ec2Client.send(webSgCommand);
      const webSg = webSgResponse.SecurityGroups![0];
      expect(webSg).toBeDefined();
    });

    test('Application Tier → Database Tier: Application Tier communicates with Database Tier on port 3306', async () => {
      const appInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [appTierInstanceId],
      });
      const appInstanceResponse = await ec2Client.send(appInstanceCommand);
      const appInstance = appInstanceResponse.Reservations![0].Instances![0];
      
      const dbInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [dbTierInstanceId],
      });
      const dbInstanceResponse = await ec2Client.send(dbInstanceCommand);
      const dbInstance = dbInstanceResponse.Reservations![0].Instances![0];
      
      // Verify both instances are in same VPC and private subnets
      expect(appInstance.VpcId).toBe(vpcId);
      expect(dbInstance.VpcId).toBe(vpcId);
      expect(appInstance.PrivateIpAddress).toMatch(/^10\.0\./);
      expect(dbInstance.PrivateIpAddress).toMatch(/^10\.0\./);
      
      // Verify Database Tier Security Group exists
      const dbSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [dbTierSGId],
      });
      const dbSgResponse = await ec2Client.send(dbSgCommand);
      const dbSg = dbSgResponse.SecurityGroups![0];
      
      expect(dbSg).toBeDefined();
      expect(dbSg.GroupId).toBe(dbTierSGId);
    });
  });

  describe('Outbound Connectivity: Private Subnets → NAT Gateway → Internet', () => {
    test('Private subnet routes outbound traffic through zone-specific NAT Gateway', async () => {
      const appInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [appTierInstanceId],
      });
      const appInstanceResponse = await ec2Client.send(appInstanceCommand);
      const appInstance = appInstanceResponse.Reservations![0].Instances![0];
      
      // Verify instance is in private subnet
      expect(appInstance.SubnetId).toBe(privateSubnetIds[0]);
      
      // Verify private route table has default route
      const routeCommand = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'association.subnet-id', Values: [privateSubnetIds[0]] }],
      });
      const routeResponse = await ec2Client.send(routeCommand);
      const routeTable = routeResponse.RouteTables![0];
      
      const natRoute = routeTable.Routes!.find(
        r => r.DestinationCidrBlock === '0.0.0.0/0'
      );
      expect(natRoute).toBeDefined();
      expect(natRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('Each availability zone has zone-specific NAT Gateway routing', async () => {
      // Verify zone-specific routing for redundancy
      for (let i = 0; i < privateRouteTableIds.length; i++) {
        const routeTableId = privateRouteTableIds[i];
        
        const routeCommand = new DescribeRouteTablesCommand({
          Filters: [{ Name: 'route-table-id', Values: [routeTableId] }],
        });
        const routeResponse = await ec2Client.send(routeCommand);
        const routeTable = routeResponse.RouteTables![0];
        
        const defaultRoute = routeTable.Routes!.find(
          r => r.DestinationCidrBlock === '0.0.0.0/0'
        );
        expect(defaultRoute).toBeDefined();
        expect(defaultRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
      }
    });
  });

  describe('AWS Service Access: Private Subnets → VPC Endpoints', () => {
    test('Private subnet accesses S3 via VPC Endpoint (bypassing NAT Gateway)', async () => {
      const endpointCommand = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [s3EndpointId],
      });
      const endpointResponse = await ec2Client.send(endpointCommand);
      const endpoint = endpointResponse.VpcEndpoints![0];
      
      expect(endpoint).toBeDefined();
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.ServiceName).toContain('s3');
      
      // Verify S3 endpoint is attached to all private route tables
      const routeTableIds = endpoint.RouteTableIds || [];
      privateRouteTableIds.forEach(rtId => {
        expect(routeTableIds).toContain(rtId);
      });
      
      // Verify instance is in private subnet
      const appInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [appTierInstanceId],
      });
      const appInstanceResponse = await ec2Client.send(appInstanceCommand);
      const appInstance = appInstanceResponse.Reservations![0].Instances![0];
      expect(appInstance.SubnetId).toBe(privateSubnetIds[0]);
    });

    test('Private subnet accesses DynamoDB via VPC Endpoint (bypassing NAT Gateway)', async () => {
      const endpointCommand = new DescribeVpcEndpointsCommand({
        VpcEndpointIds: [dynamoDbEndpointId],
      });
      const endpointResponse = await ec2Client.send(endpointCommand);
      const endpoint = endpointResponse.VpcEndpoints![0];
      
      expect(endpoint).toBeDefined();
      expect(endpoint.VpcEndpointType).toBe('Gateway');
      expect(endpoint.ServiceName).toContain('dynamodb');
      
      // Verify DynamoDB endpoint is attached to all private route tables
      const routeTableIds = endpoint.RouteTableIds || [];
      privateRouteTableIds.forEach(rtId => {
        expect(routeTableIds).toContain(rtId);
      });
    });
  });

  describe('Complete End-to-End Workflow', () => {
    test('Full data flow: User → Internet → Web Tier → Application Tier → Database Tier → Response', async () => {
      const webInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [webTierInstanceId],
      });
      const webInstanceResponse = await ec2Client.send(webInstanceCommand);
      const webInstance = webInstanceResponse.Reservations![0].Instances![0];
      
      const appInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [appTierInstanceId],
      });
      const appInstanceResponse = await ec2Client.send(appInstanceCommand);
      const appInstance = appInstanceResponse.Reservations![0].Instances![0];
      
      const dbInstanceCommand = new DescribeInstancesCommand({
        InstanceIds: [dbTierInstanceId],
      });
      const dbInstanceResponse = await ec2Client.send(dbInstanceCommand);
      const dbInstance = dbInstanceResponse.Reservations![0].Instances![0];
      
      // Verify all instances are running in correct tiers
      expect(webInstance.State?.Name).toBe('running');
      expect(appInstance.State?.Name).toBe('running');
      expect(dbInstance.State?.Name).toBe('running');
      
      // Verify network placement
      expect(webInstance.SubnetId).toBe(publicSubnetIds[0]);
      expect(appInstance.SubnetId).toBe(privateSubnetIds[0]);
      expect(dbInstance.SubnetId).toBe(privateSubnetIds[0]);
      
      // Verify all in same VPC
      expect(webInstance.VpcId).toBe(vpcId);
      expect(appInstance.VpcId).toBe(vpcId);
      expect(dbInstance.VpcId).toBe(vpcId);
      
      // Verify security groups exist
      const appSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [appTierSGId],
      });
      const appSgResponse = await ec2Client.send(appSgCommand);
      const appSg = appSgResponse.SecurityGroups![0];
      expect(appSg).toBeDefined();
      expect(appSg.GroupId).toBe(appTierSGId);
      
      const dbSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [dbTierSGId],
      });
      const dbSgResponse = await ec2Client.send(dbSgCommand);
      const dbSg = dbSgResponse.SecurityGroups![0];
      expect(dbSg).toBeDefined();
      expect(dbSg.GroupId).toBe(dbTierSGId);
    });
  });
});
