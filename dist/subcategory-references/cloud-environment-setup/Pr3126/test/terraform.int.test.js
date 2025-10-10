"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_rds_1 = require("@aws-sdk/client-rds");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const region = process.env.AWS_REGION || 'us-east-1';
// Read the actual Terraform outputs
let outputs = {};
const outputsPath = path_1.default.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
try {
    if (!fs_1.default.existsSync(outputsPath)) {
        throw new Error(`Outputs file not found at: ${outputsPath}`);
    }
    const rawOutputs = JSON.parse(fs_1.default.readFileSync(outputsPath, 'utf-8'));
    // Handle Terraform output format - outputs might be nested under 'value' key
    for (const [key, value] of Object.entries(rawOutputs)) {
        if (typeof value === 'object' && value !== null && 'value' in value) {
            outputs[key] = value.value;
        }
        else {
            outputs[key] = value;
        }
    }
    // Parse JSON strings if needed (for arrays)
    if (typeof outputs.public_subnet_ids === 'string') {
        try {
            outputs.public_subnet_ids = JSON.parse(outputs.public_subnet_ids);
        }
        catch {
            // If it's a comma-separated string
            outputs.public_subnet_ids = outputs.public_subnet_ids.split(',').map((s) => s.trim());
        }
    }
    if (typeof outputs.private_subnet_ids === 'string') {
        try {
            outputs.private_subnet_ids = JSON.parse(outputs.private_subnet_ids);
        }
        catch {
            // If it's a comma-separated string
            outputs.private_subnet_ids = outputs.private_subnet_ids.split(',').map((s) => s.trim());
        }
    }
    if (typeof outputs.nat_gateway_ids === 'string') {
        try {
            outputs.nat_gateway_ids = JSON.parse(outputs.nat_gateway_ids);
        }
        catch {
            // If it's a comma-separated string
            outputs.nat_gateway_ids = outputs.nat_gateway_ids.split(',').map((s) => s.trim());
        }
    }
    console.log('Loaded Terraform outputs:', JSON.stringify(outputs, null, 2));
}
catch (error) {
    console.error('Failed to load Terraform outputs:', error);
    throw new Error('Cannot run integration tests without valid Terraform outputs. Please run "terraform apply" and ensure outputs are exported.');
}
const ec2 = new client_ec2_1.EC2Client({ region });
const rds = new client_rds_1.RDSClient({ region });
describe('Terraform Infrastructure - AWS Resource Integration Tests', () => {
    beforeAll(() => {
        // Validate that we have essential outputs
        const essentialOutputs = ['vpc_id'];
        const missingOutputs = essentialOutputs.filter(key => !outputs[key]);
        if (missingOutputs.length > 0) {
            throw new Error(`Missing essential outputs: ${missingOutputs.join(', ')}`);
        }
    });
    describe('VPC and Networking', () => {
        test('VPC should exist and be available', async () => {
            const vpcId = outputs.vpc_id;
            expect(vpcId).toBeDefined();
            expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);
            const res = await ec2.send(new client_ec2_1.DescribeVpcsCommand({
                VpcIds: [vpcId],
            }));
            const vpc = res.Vpcs?.[0];
            expect(vpc).toBeDefined();
            expect(vpc?.State).toBe('available');
            expect(vpc?.CidrBlock).toBe(outputs.vpc_cidr || '10.0.0.0/16');
        });
        test('VPC should be tagged correctly', async () => {
            const vpcId = outputs.vpc_id;
            const res = await ec2.send(new client_ec2_1.DescribeVpcsCommand({ VpcIds: [vpcId] }));
            const tags = res.Vpcs?.[0]?.Tags || [];
            const nameTag = tags.find(tag => tag.Key === 'Name');
            expect(nameTag).toBeDefined();
            expect(nameTag?.Value).toContain('vpc');
            const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
            expect(managedByTag?.Value).toBe('Terraform');
        });
        test('Internet Gateway should exist and be attached', async () => {
            const vpcId = outputs.vpc_id;
            const res = await ec2.send(new client_ec2_1.DescribeInternetGatewaysCommand({
                Filters: [
                    {
                        Name: 'attachment.vpc-id',
                        Values: [vpcId],
                    },
                ],
            }));
            const igw = res.InternetGateways?.[0];
            expect(igw).toBeDefined();
            expect(igw?.Attachments?.[0]?.State).toBe('available');
            expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
        });
        test('NAT Gateway should exist and be available', async () => {
            const res = await ec2.send(new client_ec2_1.DescribeNatGatewaysCommand({
                Filter: [
                    {
                        Name: 'vpc-id',
                        Values: [outputs.vpc_id],
                    },
                    {
                        Name: 'state',
                        Values: ['available'],
                    },
                ],
            }));
            expect(res.NatGateways?.length).toBeGreaterThanOrEqual(1);
            const natGateway = res.NatGateways?.[0];
            expect(natGateway).toBeDefined();
            expect(natGateway?.State).toBe('available');
            expect(natGateway?.NatGatewayAddresses?.[0]?.PublicIp).toBeDefined();
            expect(natGateway?.VpcId).toBe(outputs.vpc_id);
            // If we have nat_gateway_ids in outputs, verify them
            if (outputs.nat_gateway_ids && Array.isArray(outputs.nat_gateway_ids)) {
                const natGatewayIds = res.NatGateways?.map(ng => ng.NatGatewayId);
                outputs.nat_gateway_ids.forEach((id) => {
                    expect(natGatewayIds).toContain(id);
                });
            }
        });
        test('NAT Gateway should be tagged correctly', async () => {
            const res = await ec2.send(new client_ec2_1.DescribeNatGatewaysCommand({
                Filter: [
                    {
                        Name: 'vpc-id',
                        Values: [outputs.vpc_id],
                    },
                ],
            }));
            const natGateway = res.NatGateways?.[0];
            const tags = natGateway?.Tags || [];
            const nameTag = tags.find(tag => tag.Key === 'Name');
            expect(nameTag).toBeDefined();
            const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
            expect(managedByTag?.Value).toBe('Terraform');
        });
    });
    describe('Subnets', () => {
        test('All public and private subnets should exist', async () => {
            const publicSubnetIds = outputs.public_subnet_ids;
            const privateSubnetIds = outputs.private_subnet_ids;
            expect(Array.isArray(publicSubnetIds)).toBe(true);
            expect(Array.isArray(privateSubnetIds)).toBe(true);
            expect(publicSubnetIds.length).toBe(2);
            expect(privateSubnetIds.length).toBe(2);
            const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
            const res = await ec2.send(new client_ec2_1.DescribeSubnetsCommand({
                SubnetIds: allSubnetIds,
            }));
            expect(res.Subnets?.length).toBe(4);
            res.Subnets?.forEach(subnet => {
                expect(subnet.State).toBe('available');
                expect(subnet.VpcId).toBe(outputs.vpc_id);
            });
        });
        test('Public subnets should have correct configuration', async () => {
            const publicSubnetIds = outputs.public_subnet_ids;
            const res = await ec2.send(new client_ec2_1.DescribeSubnetsCommand({
                SubnetIds: publicSubnetIds,
            }));
            res.Subnets?.forEach(subnet => {
                expect(subnet.MapPublicIpOnLaunch).toBe(true);
                expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);
            });
            const cidrs = res.Subnets?.map(s => s.CidrBlock).sort();
            expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
        });
        test('Private subnets should have correct configuration', async () => {
            const privateSubnetIds = outputs.private_subnet_ids;
            const res = await ec2.send(new client_ec2_1.DescribeSubnetsCommand({
                SubnetIds: privateSubnetIds,
            }));
            res.Subnets?.forEach(subnet => {
                expect(subnet.MapPublicIpOnLaunch).toBe(false);
                expect(subnet.CidrBlock).toMatch(/^10\.0\.1[01]\.0\/24$/);
            });
            const cidrs = res.Subnets?.map(s => s.CidrBlock).sort();
            expect(cidrs).toEqual(['10.0.10.0/24', '10.0.11.0/24']);
        });
        test('Subnets should be in different availability zones', async () => {
            const allSubnetIds = [...outputs.public_subnet_ids, ...outputs.private_subnet_ids];
            const res = await ec2.send(new client_ec2_1.DescribeSubnetsCommand({
                SubnetIds: allSubnetIds,
            }));
            const azs = res.Subnets?.map(s => s.AvailabilityZone);
            const uniqueAzs = new Set(azs);
            expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
        });
        test('Subnets should be tagged correctly', async () => {
            const publicSubnetIds = outputs.public_subnet_ids;
            const privateSubnetIds = outputs.private_subnet_ids;
            // Check public subnets
            const publicRes = await ec2.send(new client_ec2_1.DescribeSubnetsCommand({
                SubnetIds: publicSubnetIds,
            }));
            publicRes.Subnets?.forEach((subnet, index) => {
                const tags = subnet.Tags || [];
                const typeTag = tags.find(tag => tag.Key === 'Type');
                expect(typeTag?.Value).toBe('Public');
                const nameTag = tags.find(tag => tag.Key === 'Name');
                expect(nameTag).toBeDefined();
                expect(nameTag?.Value).toContain('public-subnet');
            });
            // Check private subnets
            const privateRes = await ec2.send(new client_ec2_1.DescribeSubnetsCommand({
                SubnetIds: privateSubnetIds,
            }));
            privateRes.Subnets?.forEach((subnet, index) => {
                const tags = subnet.Tags || [];
                const typeTag = tags.find(tag => tag.Key === 'Type');
                expect(typeTag?.Value).toBe('Private');
                const nameTag = tags.find(tag => tag.Key === 'Name');
                expect(nameTag).toBeDefined();
                expect(nameTag?.Value).toContain('private-subnet');
            });
        });
    });
    describe('Route Tables', () => {
        test('Public route tables should route to Internet Gateway', async () => {
            const publicSubnetIds = outputs.public_subnet_ids;
            const res = await ec2.send(new client_ec2_1.DescribeRouteTablesCommand({
                Filters: [
                    {
                        Name: 'vpc-id',
                        Values: [outputs.vpc_id],
                    },
                    {
                        Name: 'association.subnet-id',
                        Values: publicSubnetIds,
                    },
                ],
            }));
            expect(res.RouteTables?.length).toBeGreaterThanOrEqual(1);
            res.RouteTables?.forEach(routeTable => {
                const defaultRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
                expect(defaultRoute?.GatewayId).toMatch(/^igw-/);
                expect(defaultRoute?.State).toBe('active');
            });
        });
        test('Private route tables should route to NAT Gateway', async () => {
            const privateSubnetIds = outputs.private_subnet_ids;
            const res = await ec2.send(new client_ec2_1.DescribeRouteTablesCommand({
                Filters: [
                    {
                        Name: 'vpc-id',
                        Values: [outputs.vpc_id],
                    },
                    {
                        Name: 'association.subnet-id',
                        Values: privateSubnetIds,
                    },
                ],
            }));
            expect(res.RouteTables?.length).toBeGreaterThanOrEqual(1);
            res.RouteTables?.forEach(routeTable => {
                const defaultRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
                expect(defaultRoute?.NatGatewayId).toMatch(/^nat-/);
                expect(defaultRoute?.State).toBe('active');
            });
        });
        test('Route tables should be tagged correctly', async () => {
            const res = await ec2.send(new client_ec2_1.DescribeRouteTablesCommand({
                Filters: [
                    {
                        Name: 'vpc-id',
                        Values: [outputs.vpc_id],
                    },
                    {
                        Name: 'tag:ManagedBy',
                        Values: ['Terraform'],
                    },
                ],
            }));
            expect(res.RouteTables?.length).toBeGreaterThan(0);
            res.RouteTables?.forEach(routeTable => {
                const tags = routeTable.Tags || [];
                const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
                expect(managedByTag?.Value).toBe('Terraform');
            });
        });
    });
    describe('Security Groups', () => {
        test('Application Security Group should exist with correct configuration', async () => {
            const sgId = outputs.app_security_group_id;
            expect(sgId).toBeDefined();
            expect(sgId).toMatch(/^sg-[a-z0-9]+$/);
            const res = await ec2.send(new client_ec2_1.DescribeSecurityGroupsCommand({
                GroupIds: [sgId],
            }));
            const sg = res.SecurityGroups?.[0];
            expect(sg).toBeDefined();
            expect(sg?.VpcId).toBe(outputs.vpc_id);
            // Should have outbound rule allowing all traffic
            const egressRules = sg?.IpPermissionsEgress;
            const allOutboundRule = egressRules?.find(r => r.IpProtocol === '-1' &&
                r.IpRanges?.[0]?.CidrIp === '0.0.0.0/0');
            expect(allOutboundRule).toBeDefined();
        });
        test('RDS Security Group should exist with correct rules', async () => {
            const sgId = outputs.rds_security_group_id;
            expect(sgId).toBeDefined();
            expect(sgId).toMatch(/^sg-[a-z0-9]+$/);
            const res = await ec2.send(new client_ec2_1.DescribeSecurityGroupsCommand({
                GroupIds: [sgId],
            }));
            const sg = res.SecurityGroups?.[0];
            expect(sg).toBeDefined();
            expect(sg?.VpcId).toBe(outputs.vpc_id);
            // Should have inbound rule for MySQL from app security group
            const ingressRules = sg?.IpPermissions;
            const mysqlRule = ingressRules?.find(r => r.FromPort === 3306 &&
                r.ToPort === 3306 &&
                r.IpProtocol === 'tcp');
            expect(mysqlRule).toBeDefined();
            expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.app_security_group_id);
        });
        test('Security Groups should be tagged correctly', async () => {
            const sgIds = [outputs.app_security_group_id, outputs.rds_security_group_id];
            const res = await ec2.send(new client_ec2_1.DescribeSecurityGroupsCommand({
                GroupIds: sgIds,
            }));
            res.SecurityGroups?.forEach(sg => {
                const tags = sg.Tags || [];
                const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
                expect(managedByTag?.Value).toBe('Terraform');
            });
        });
    });
    describe('RDS Database', () => {
        test('RDS MySQL instance should exist and be available', async () => {
            const rdsEndpoint = outputs.rds_endpoint;
            expect(rdsEndpoint).toBeDefined();
            expect(rdsEndpoint).toMatch(/\.rds\.amazonaws\.com(:\d+)?$/);
            // Extract DB identifier from endpoint
            const dbIdentifier = rdsEndpoint.split('.')[0];
            const res = await rds.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: dbIdentifier,
            }));
            const dbInstance = res.DBInstances?.[0];
            expect(dbInstance).toBeDefined();
            expect(dbInstance?.DBInstanceStatus).toBe('available');
            expect(dbInstance?.Engine).toBe('mysql');
            expect(dbInstance?.StorageEncrypted).toBe(true);
            expect(dbInstance?.PubliclyAccessible).toBe(false);
        });
        test('RDS instance should have correct network configuration', async () => {
            const rdsEndpoint = outputs.rds_endpoint;
            const dbIdentifier = rdsEndpoint.split('.')[0];
            const res = await rds.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: dbIdentifier,
            }));
            const dbInstance = res.DBInstances?.[0];
            expect(dbInstance?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(outputs.rds_security_group_id);
            expect(dbInstance?.VpcSecurityGroups?.[0]?.Status).toBe('active');
            // Should be in private subnets
            const dbSubnetGroup = dbInstance?.DBSubnetGroup;
            expect(dbSubnetGroup).toBeDefined();
            expect(dbSubnetGroup?.VpcId).toBe(outputs.vpc_id);
        });
        test('RDS subnet group should exist with correct subnets', async () => {
            const rdsEndpoint = outputs.rds_endpoint;
            const dbIdentifier = rdsEndpoint.split('.')[0];
            const dbRes = await rds.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: dbIdentifier,
            }));
            const subnetGroupName = dbRes.DBInstances?.[0]?.DBSubnetGroup?.DBSubnetGroupName;
            expect(subnetGroupName).toBeDefined();
            const subnetRes = await rds.send(new client_rds_1.DescribeDBSubnetGroupsCommand({
                DBSubnetGroupName: subnetGroupName,
            }));
            const subnetGroup = subnetRes.DBSubnetGroups?.[0];
            expect(subnetGroup).toBeDefined();
            expect(subnetGroup?.VpcId).toBe(outputs.vpc_id);
            const subnetIds = subnetGroup?.Subnets?.map(s => s.SubnetIdentifier).sort();
            const expectedSubnetIds = outputs.private_subnet_ids.sort();
            expect(subnetIds).toEqual(expectedSubnetIds);
        });
        test('RDS instance should have correct backup configuration', async () => {
            const rdsEndpoint = outputs.rds_endpoint;
            const dbIdentifier = rdsEndpoint.split('.')[0];
            const res = await rds.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: dbIdentifier,
            }));
            const dbInstance = res.DBInstances?.[0];
            expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
            expect(dbInstance?.PreferredBackupWindow).toBeDefined();
            expect(dbInstance?.PreferredMaintenanceWindow).toBeDefined();
            expect(dbInstance?.CopyTagsToSnapshot).toBe(true);
        });
        test('RDS instance should have CloudWatch logs enabled', async () => {
            const rdsEndpoint = outputs.rds_endpoint;
            const dbIdentifier = rdsEndpoint.split('.')[0];
            const res = await rds.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: dbIdentifier,
            }));
            const dbInstance = res.DBInstances?.[0];
            const enabledLogs = dbInstance?.EnabledCloudwatchLogsExports || [];
            expect(enabledLogs).toContain('error');
            expect(enabledLogs).toContain('general');
            expect(enabledLogs).toContain('slowquery');
        });
        test('RDS instance should be tagged correctly', async () => {
            const rdsEndpoint = outputs.rds_endpoint;
            const dbIdentifier = rdsEndpoint.split('.')[0];
            const res = await rds.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: dbIdentifier,
            }));
            const dbInstance = res.DBInstances?.[0];
            const tags = dbInstance?.TagList || [];
            const nameTag = tags.find(tag => tag.Key === 'Name');
            expect(nameTag).toBeDefined();
            const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
            expect(managedByTag?.Value).toBe('Terraform');
        });
    });
    describe('Resource Tagging Consistency', () => {
        test('All major resources should have consistent tagging', async () => {
            // Check VPC
            const vpcRes = await ec2.send(new client_ec2_1.DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] }));
            const vpcTags = vpcRes.Vpcs?.[0]?.Tags || [];
            // Check Security Groups
            const sgRes = await ec2.send(new client_ec2_1.DescribeSecurityGroupsCommand({
                GroupIds: [outputs.app_security_group_id, outputs.rds_security_group_id],
            }));
            // Check Subnets
            const subnetRes = await ec2.send(new client_ec2_1.DescribeSubnetsCommand({
                SubnetIds: [...outputs.public_subnet_ids, ...outputs.private_subnet_ids],
            }));
            // All resources should have ManagedBy = Terraform
            [vpcTags, ...sgRes.SecurityGroups?.map(sg => sg.Tags) || [], ...subnetRes.Subnets?.map(s => s.Tags) || []].forEach(tags => {
                const managedByTag = tags?.find(tag => tag.Key === 'ManagedBy');
                expect(managedByTag?.Value).toBe('Terraform');
            });
        });
    });
    describe('Output Validation', () => {
        test('All required outputs should be present and valid', () => {
            const requiredOutputs = [
                'vpc_id',
                'public_subnet_ids',
                'private_subnet_ids',
                'app_security_group_id',
                'rds_security_group_id',
                'rds_endpoint',
                'rds_port',
            ];
            requiredOutputs.forEach(key => {
                expect(outputs[key]).toBeDefined();
                if (!Array.isArray(outputs[key])) {
                    expect(outputs[key]).not.toBe('');
                }
            });
        });
        test('Output values should have correct AWS resource ID format', () => {
            expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
            expect(outputs.app_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
            expect(outputs.rds_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
            expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com(:\d+)?$/);
            // Check subnet IDs
            outputs.public_subnet_ids.forEach((id) => {
                expect(id).toMatch(/^subnet-[a-z0-9]+$/);
            });
            outputs.private_subnet_ids.forEach((id) => {
                expect(id).toMatch(/^subnet-[a-z0-9]+$/);
            });
        });
        test('Subnet arrays should have expected counts', () => {
            expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
            expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
            expect(outputs.public_subnet_ids.length).toBe(2);
            expect(outputs.private_subnet_ids.length).toBe(2);
        });
    });
    describe('Infrastructure Health and Connectivity', () => {
        test('All availability zones should be different for redundancy', async () => {
            const allSubnetIds = [...outputs.public_subnet_ids, ...outputs.private_subnet_ids];
            const res = await ec2.send(new client_ec2_1.DescribeSubnetsCommand({
                SubnetIds: allSubnetIds,
            }));
            const azs = res.Subnets?.map(s => s.AvailabilityZone);
            const uniqueAzs = new Set(azs);
            // Should have at least 2 different AZs for redundancy
            expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
        });
        test('NAT Gateway should have Elastic IP assigned', async () => {
            const res = await ec2.send(new client_ec2_1.DescribeNatGatewaysCommand({
                Filter: [
                    {
                        Name: 'vpc-id',
                        Values: [outputs.vpc_id],
                    },
                    {
                        Name: 'state',
                        Values: ['available'],
                    },
                ],
            }));
            const natGateway = res.NatGateways?.[0];
            expect(natGateway?.NatGatewayAddresses?.length).toBeGreaterThanOrEqual(1);
            const address = natGateway?.NatGatewayAddresses?.[0];
            expect(address?.PublicIp).toBeDefined();
            expect(address?.AllocationId).toMatch(/^eipalloc-/);
        });
        test('Database should be accessible from application security group', async () => {
            // This test verifies the security group rules allow connectivity
            const rdsRes = await ec2.send(new client_ec2_1.DescribeSecurityGroupsCommand({
                GroupIds: [outputs.rds_security_group_id],
            }));
            const rdsSg = rdsRes.SecurityGroups?.[0];
            const mysqlRule = rdsSg?.IpPermissions?.find(r => r.FromPort === 3306 && r.ToPort === 3306);
            expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.app_security_group_id);
            // Verify the app security group exists
            const appRes = await ec2.send(new client_ec2_1.DescribeSecurityGroupsCommand({
                GroupIds: [outputs.app_security_group_id],
            }));
            expect(appRes.SecurityGroups?.[0]).toBeDefined();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFmb3JtLmludC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3ViY2F0ZWdvcnktcmVmZXJlbmNlcy9jbG91ZC1lbnZpcm9ubWVudC1zZXR1cC9QcjMxMjYvdGVzdC90ZXJyYWZvcm0uaW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxvREFRNkI7QUFDN0Isb0RBSTZCO0FBQzdCLDRDQUFvQjtBQUNwQixnREFBd0I7QUFFeEIsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksV0FBVyxDQUFDO0FBRXJELG9DQUFvQztBQUNwQyxJQUFJLE9BQU8sR0FBUSxFQUFFLENBQUM7QUFDdEIsTUFBTSxXQUFXLEdBQUcsY0FBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEVBQUUsK0JBQStCLENBQUMsQ0FBQztBQUU5RSxJQUFJLENBQUM7SUFDSCxJQUFJLENBQUMsWUFBRSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDO1FBQ2hDLE1BQU0sSUFBSSxLQUFLLENBQUMsOEJBQThCLFdBQVcsRUFBRSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBRSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztJQUVyRSw2RUFBNkU7SUFDN0UsS0FBSyxNQUFNLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztRQUN0RCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztZQUNwRSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUksS0FBYSxDQUFDLEtBQUssQ0FBQztRQUN0QyxD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QUUsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFFdEYsdUNBQXVDO1lBQ3ZDLE1BQU0sTUFBTSxHQUFHLE1BQU0sR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLDBDQUE2QixDQUFDO2dCQUM5RCxRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUM7YUFDMUMsQ0FBQyxDQUFDLENBQUM7WUFFSixNQUFNLENBQUMsTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDbkQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgRGVzY3JpYmVJbnRlcm5ldEdhdGV3YXlzQ29tbWFuZCxcbiAgRGVzY3JpYmVOYXRHYXRld2F5c0NvbW1hbmQsXG4gIERlc2NyaWJlUm91dGVUYWJsZXNDb21tYW5kLFxuICBEZXNjcmliZVNlY3VyaXR5R3JvdXBzQ29tbWFuZCxcbiAgRGVzY3JpYmVTdWJuZXRzQ29tbWFuZCxcbiAgRGVzY3JpYmVWcGNzQ29tbWFuZCxcbiAgRUMyQ2xpZW50XG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1lYzInO1xuaW1wb3J0IHtcbiAgRGVzY3JpYmVEQkluc3RhbmNlc0NvbW1hbmQsXG4gIERlc2NyaWJlREJTdWJuZXRHcm91cHNDb21tYW5kLFxuICBSRFNDbGllbnRcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LXJkcyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IHJlZ2lvbiA9IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfHwgJ3VzLWVhc3QtMSc7XG5cbi8vIFJlYWQgdGhlIGFjdHVhbCBUZXJyYWZvcm0gb3V0cHV0c1xubGV0IG91dHB1dHM6IGFueSA9IHt9O1xuY29uc3Qgb3V0cHV0c1BhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ2Nmbi1vdXRwdXRzL2ZsYXQtb3V0cHV0cy5qc29uJyk7XG5cbnRyeSB7XG4gIGlmICghZnMuZXhpc3RzU3luYyhvdXRwdXRzUGF0aCkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE91dHB1dHMgZmlsZSBub3QgZm91bmQgYXQ6ICR7b3V0cHV0c1BhdGh9YCk7XG4gIH1cbiAgXG4gIGNvbnN0IHJhd091dHB1dHMgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhvdXRwdXRzUGF0aCwgJ3V0Zi04JykpO1xuICBcbiAgLy8gSGFuZGxlIFRlcnJhZm9ybSBvdXRwdXQgZm9ybWF0IC0gb3V0cHV0cyBtaWdodCBiZSBuZXN0ZWQgdW5kZXIgJ3ZhbHVlJyBrZXlcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMocmF3T3V0cHV0cykpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAndmFsdWUnIGluIHZhbHVlKSB7XG4gICAgICBvdXRwdXRzW2tleV0gPSAodmFsdWUgYXMgYW55KS52YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0cHV0c1trZXldID0gdmFsdWU7XG4gICAgfVxuICB9XG4gIFxuICAvLyBQYXJzZSBKU09OIHN0cmluZ3MgaWYgbmVlZGVkIChmb3IgYXJyYXlzKVxuICBpZiAodHlwZW9mIG91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMgPT09ICdzdHJpbmcnKSB7XG4gICAgdHJ5IHtcbiAgICAgIG91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMgPSBKU09OLnBhcnNlKG91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gSWYgaXQncyBhIGNvbW1hLXNlcGFyYXRlZCBzdHJpbmdcbiAgICAgIG91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMgPSBvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzLnNwbGl0KCcsJykubWFwKChzOiBzdHJpbmcpID0+IHMudHJpbSgpKTtcbiAgICB9XG4gIH1cbiAgXG4gIGlmICh0eXBlb2Ygb3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHMgPT09ICdzdHJpbmcnKSB7XG4gICAgdHJ5IHtcbiAgICAgIG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzID0gSlNPTi5wYXJzZShvdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkcyk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBJZiBpdCdzIGEgY29tbWEtc2VwYXJhdGVkIHN0cmluZ1xuICAgICAgb3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHMgPSBvdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkcy5zcGxpdCgnLCcpLm1hcCgoczogc3RyaW5nKSA9PiBzLnRyaW0oKSk7XG4gICAgfVxuICB9XG4gIFxuICBpZiAodHlwZW9mIG91dHB1dHMubmF0X2dhdGV3YXlfaWRzID09PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICBvdXRwdXRzLm5hdF9nYXRld2F5X2lkcyA9IEpTT04ucGFyc2Uob3V0cHV0cy5uYXRfZ2F0ZXdheV9pZHMpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gSWYgaXQncyBhIGNvbW1hLXNlcGFyYXRlZCBzdHJpbmdcbiAgICAgIG91dHB1dHMubmF0X2dhdGV3YXlfaWRzID0gb3V0cHV0cy5uYXRfZ2F0ZXdheV9pZHMuc3BsaXQoJywnKS5tYXAoKHM6IHN0cmluZykgPT4gcy50cmltKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgY29uc29sZS5sb2coJ0xvYWRlZCBUZXJyYWZvcm0gb3V0cHV0czonLCBKU09OLnN0cmluZ2lmeShvdXRwdXRzLCBudWxsLCAyKSk7XG59IGNhdGNoIChlcnJvcikge1xuICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gbG9hZCBUZXJyYWZvcm0gb3V0cHV0czonLCBlcnJvcik7XG4gIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHJ1biBpbnRlZ3JhdGlvbiB0ZXN0cyB3aXRob3V0IHZhbGlkIFRlcnJhZm9ybSBvdXRwdXRzLiBQbGVhc2UgcnVuIFwidGVycmFmb3JtIGFwcGx5XCIgYW5kIGVuc3VyZSBvdXRwdXRzIGFyZSBleHBvcnRlZC4nKTtcbn1cblxuY29uc3QgZWMyID0gbmV3IEVDMkNsaWVudCh7IHJlZ2lvbiB9KTtcbmNvbnN0IHJkcyA9IG5ldyBSRFNDbGllbnQoeyByZWdpb24gfSk7XG5cbmRlc2NyaWJlKCdUZXJyYWZvcm0gSW5mcmFzdHJ1Y3R1cmUgLSBBV1MgUmVzb3VyY2UgSW50ZWdyYXRpb24gVGVzdHMnLCAoKSA9PiB7XG5cbiAgYmVmb3JlQWxsKCgpID0+IHtcbiAgICAvLyBWYWxpZGF0ZSB0aGF0IHdlIGhhdmUgZXNzZW50aWFsIG91dHB1dHNcbiAgICBjb25zdCBlc3NlbnRpYWxPdXRwdXRzID0gWyd2cGNfaWQnXTtcbiAgICBjb25zdCBtaXNzaW5nT3V0cHV0cyA9IGVzc2VudGlhbE91dHB1dHMuZmlsdGVyKGtleSA9PiAhb3V0cHV0c1trZXldKTtcbiAgICBcbiAgICBpZiAobWlzc2luZ091dHB1dHMubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBNaXNzaW5nIGVzc2VudGlhbCBvdXRwdXRzOiAke21pc3NpbmdPdXRwdXRzLmpvaW4oJywgJyl9YCk7XG4gICAgfVxuICB9KTtcblxuICBkZXNjcmliZSgnVlBDIGFuZCBOZXR3b3JraW5nJywgKCkgPT4ge1xuICAgIHRlc3QoJ1ZQQyBzaG91bGQgZXhpc3QgYW5kIGJlIGF2YWlsYWJsZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHZwY0lkID0gb3V0cHV0cy52cGNfaWQ7XG4gICAgICBleHBlY3QodnBjSWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QodnBjSWQpLnRvTWF0Y2goL152cGMtW2EtejAtOV0rJC8pO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVWcGNzQ29tbWFuZCh7XG4gICAgICAgIFZwY0lkczogW3ZwY0lkXSxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgdnBjID0gcmVzLlZwY3M/LlswXTtcbiAgICAgIGV4cGVjdCh2cGMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QodnBjPy5TdGF0ZSkudG9CZSgnYXZhaWxhYmxlJyk7XG4gICAgICBleHBlY3QodnBjPy5DaWRyQmxvY2spLnRvQmUob3V0cHV0cy52cGNfY2lkciB8fCAnMTAuMC4wLjAvMTYnKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1ZQQyBzaG91bGQgYmUgdGFnZ2VkIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHZwY0lkID0gb3V0cHV0cy52cGNfaWQ7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVWcGNzQ29tbWFuZCh7IFZwY0lkczogW3ZwY0lkXSB9KSk7XG4gICAgICBjb25zdCB0YWdzID0gcmVzLlZwY3M/LlswXT8uVGFncyB8fCBbXTtcblxuICAgICAgY29uc3QgbmFtZVRhZyA9IHRhZ3MuZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ05hbWUnKTtcbiAgICAgIGV4cGVjdChuYW1lVGFnKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG5hbWVUYWc/LlZhbHVlKS50b0NvbnRhaW4oJ3ZwYycpO1xuXG4gICAgICBjb25zdCBtYW5hZ2VkQnlUYWcgPSB0YWdzLmZpbmQodGFnID0+IHRhZy5LZXkgPT09ICdNYW5hZ2VkQnknKTtcbiAgICAgIGV4cGVjdChtYW5hZ2VkQnlUYWc/LlZhbHVlKS50b0JlKCdUZXJyYWZvcm0nKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0ludGVybmV0IEdhdGV3YXkgc2hvdWxkIGV4aXN0IGFuZCBiZSBhdHRhY2hlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHZwY0lkID0gb3V0cHV0cy52cGNfaWQ7XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZUludGVybmV0R2F0ZXdheXNDb21tYW5kKHtcbiAgICAgICAgRmlsdGVyczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICdhdHRhY2htZW50LnZwYy1pZCcsXG4gICAgICAgICAgICBWYWx1ZXM6IFt2cGNJZF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgaWd3ID0gcmVzLkludGVybmV0R2F0ZXdheXM/LlswXTtcbiAgICAgIGV4cGVjdChpZ3cpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoaWd3Py5BdHRhY2htZW50cz8uWzBdPy5TdGF0ZSkudG9CZSgnYXZhaWxhYmxlJyk7XG4gICAgICBleHBlY3QoaWd3Py5BdHRhY2htZW50cz8uWzBdPy5WcGNJZCkudG9CZSh2cGNJZCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdOQVQgR2F0ZXdheSBzaG91bGQgZXhpc3QgYW5kIGJlIGF2YWlsYWJsZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZU5hdEdhdGV3YXlzQ29tbWFuZCh7XG4gICAgICAgIEZpbHRlcjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICd2cGMtaWQnLFxuICAgICAgICAgICAgVmFsdWVzOiBbb3V0cHV0cy52cGNfaWRdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgTmFtZTogJ3N0YXRlJyxcbiAgICAgICAgICAgIFZhbHVlczogWydhdmFpbGFibGUnXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSkpO1xuXG4gICAgICBleHBlY3QocmVzLk5hdEdhdGV3YXlzPy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMSk7XG5cbiAgICAgIGNvbnN0IG5hdEdhdGV3YXkgPSByZXMuTmF0R2F0ZXdheXM/LlswXTtcbiAgICAgIGV4cGVjdChuYXRHYXRld2F5KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG5hdEdhdGV3YXk/LlN0YXRlKS50b0JlKCdhdmFpbGFibGUnKTtcbiAgICAgIGV4cGVjdChuYXRHYXRld2F5Py5OYXRHYXRld2F5QWRkcmVzc2VzPy5bMF0/LlB1YmxpY0lwKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG5hdEdhdGV3YXk/LlZwY0lkKS50b0JlKG91dHB1dHMudnBjX2lkKTtcbiAgICAgIFxuICAgICAgLy8gSWYgd2UgaGF2ZSBuYXRfZ2F0ZXdheV9pZHMgaW4gb3V0cHV0cywgdmVyaWZ5IHRoZW1cbiAgICAgIGlmIChvdXRwdXRzLm5hdF9nYXRld2F5X2lkcyAmJiBBcnJheS5pc0FycmF5KG91dHB1dHMubmF0X2dhdGV3YXlfaWRzKSkge1xuICAgICAgICBjb25zdCBuYXRHYXRld2F5SWRzID0gcmVzLk5hdEdhdGV3YXlzPy5tYXAobmcgPT4gbmcuTmF0R2F0ZXdheUlkKTtcbiAgICAgICAgb3V0cHV0cy5uYXRfZ2F0ZXdheV9pZHMuZm9yRWFjaCgoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgICAgIGV4cGVjdChuYXRHYXRld2F5SWRzKS50b0NvbnRhaW4oaWQpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRlc3QoJ05BVCBHYXRld2F5IHNob3VsZCBiZSB0YWdnZWQgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlTmF0R2F0ZXdheXNDb21tYW5kKHtcbiAgICAgICAgRmlsdGVyOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgTmFtZTogJ3ZwYy1pZCcsXG4gICAgICAgICAgICBWYWx1ZXM6IFtvdXRwdXRzLnZwY19pZF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgbmF0R2F0ZXdheSA9IHJlcy5OYXRHYXRld2F5cz8uWzBdO1xuICAgICAgY29uc3QgdGFncyA9IG5hdEdhdGV3YXk/LlRhZ3MgfHwgW107XG5cbiAgICAgIGNvbnN0IG5hbWVUYWcgPSB0YWdzLmZpbmQodGFnID0+IHRhZy5LZXkgPT09ICdOYW1lJyk7XG4gICAgICBleHBlY3QobmFtZVRhZykudG9CZURlZmluZWQoKTtcblxuICAgICAgY29uc3QgbWFuYWdlZEJ5VGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTWFuYWdlZEJ5Jyk7XG4gICAgICBleHBlY3QobWFuYWdlZEJ5VGFnPy5WYWx1ZSkudG9CZSgnVGVycmFmb3JtJyk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdTdWJuZXRzJywgKCkgPT4ge1xuICAgIHRlc3QoJ0FsbCBwdWJsaWMgYW5kIHByaXZhdGUgc3VibmV0cyBzaG91bGQgZXhpc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwdWJsaWNTdWJuZXRJZHMgPSBvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzO1xuICAgICAgY29uc3QgcHJpdmF0ZVN1Ym5ldElkcyA9IG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzO1xuXG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShwdWJsaWNTdWJuZXRJZHMpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocHJpdmF0ZVN1Ym5ldElkcykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QocHVibGljU3VibmV0SWRzLmxlbmd0aCkudG9CZSgyKTtcbiAgICAgIGV4cGVjdChwcml2YXRlU3VibmV0SWRzLmxlbmd0aCkudG9CZSgyKTtcblxuICAgICAgY29uc3QgYWxsU3VibmV0SWRzID0gWy4uLnB1YmxpY1N1Ym5ldElkcywgLi4ucHJpdmF0ZVN1Ym5ldElkc107XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVN1Ym5ldHNDb21tYW5kKHtcbiAgICAgICAgU3VibmV0SWRzOiBhbGxTdWJuZXRJZHMsXG4gICAgICB9KSk7XG5cbiAgICAgIGV4cGVjdChyZXMuU3VibmV0cz8ubGVuZ3RoKS50b0JlKDQpO1xuICAgICAgcmVzLlN1Ym5ldHM/LmZvckVhY2goc3VibmV0ID0+IHtcbiAgICAgICAgZXhwZWN0KHN1Ym5ldC5TdGF0ZSkudG9CZSgnYXZhaWxhYmxlJyk7XG4gICAgICAgIGV4cGVjdChzdWJuZXQuVnBjSWQpLnRvQmUob3V0cHV0cy52cGNfaWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdQdWJsaWMgc3VibmV0cyBzaG91bGQgaGF2ZSBjb3JyZWN0IGNvbmZpZ3VyYXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwdWJsaWNTdWJuZXRJZHMgPSBvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTdWJuZXRzQ29tbWFuZCh7XG4gICAgICAgIFN1Ym5ldElkczogcHVibGljU3VibmV0SWRzLFxuICAgICAgfSkpO1xuXG4gICAgICByZXMuU3VibmV0cz8uZm9yRWFjaChzdWJuZXQgPT4ge1xuICAgICAgICBleHBlY3Qoc3VibmV0Lk1hcFB1YmxpY0lwT25MYXVuY2gpLnRvQmUodHJ1ZSk7XG4gICAgICAgIGV4cGVjdChzdWJuZXQuQ2lkckJsb2NrKS50b01hdGNoKC9eMTBcXC4wXFwuWzEyXVxcLjBcXC8yNCQvKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjaWRycyA9IHJlcy5TdWJuZXRzPy5tYXAocyA9PiBzLkNpZHJCbG9jaykuc29ydCgpO1xuICAgICAgZXhwZWN0KGNpZHJzKS50b0VxdWFsKFsnMTAuMC4xLjAvMjQnLCAnMTAuMC4yLjAvMjQnXSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdQcml2YXRlIHN1Ym5ldHMgc2hvdWxkIGhhdmUgY29ycmVjdCBjb25maWd1cmF0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcHJpdmF0ZVN1Ym5ldElkcyA9IG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTdWJuZXRzQ29tbWFuZCh7XG4gICAgICAgIFN1Ym5ldElkczogcHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgIH0pKTtcblxuICAgICAgcmVzLlN1Ym5ldHM/LmZvckVhY2goc3VibmV0ID0+IHtcbiAgICAgICAgZXhwZWN0KHN1Ym5ldC5NYXBQdWJsaWNJcE9uTGF1bmNoKS50b0JlKGZhbHNlKTtcbiAgICAgICAgZXhwZWN0KHN1Ym5ldC5DaWRyQmxvY2spLnRvTWF0Y2goL14xMFxcLjBcXC4xWzAxXVxcLjBcXC8yNCQvKTtcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBjaWRycyA9IHJlcy5TdWJuZXRzPy5tYXAocyA9PiBzLkNpZHJCbG9jaykuc29ydCgpO1xuICAgICAgZXhwZWN0KGNpZHJzKS50b0VxdWFsKFsnMTAuMC4xMC4wLzI0JywgJzEwLjAuMTEuMC8yNCddKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1N1Ym5ldHMgc2hvdWxkIGJlIGluIGRpZmZlcmVudCBhdmFpbGFiaWxpdHkgem9uZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBhbGxTdWJuZXRJZHMgPSBbLi4ub3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcywgLi4ub3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHNdO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTdWJuZXRzQ29tbWFuZCh7XG4gICAgICAgIFN1Ym5ldElkczogYWxsU3VibmV0SWRzLFxuICAgICAgfSkpO1xuXG4gICAgICBjb25zdCBhenMgPSByZXMuU3VibmV0cz8ubWFwKHMgPT4gcy5BdmFpbGFiaWxpdHlab25lKTtcbiAgICAgIGNvbnN0IHVuaXF1ZUF6cyA9IG5ldyBTZXQoYXpzKTtcbiAgICAgIGV4cGVjdCh1bmlxdWVBenMuc2l6ZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgyKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1N1Ym5ldHMgc2hvdWxkIGJlIHRhZ2dlZCBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwdWJsaWNTdWJuZXRJZHMgPSBvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzO1xuICAgICAgY29uc3QgcHJpdmF0ZVN1Ym5ldElkcyA9IG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzO1xuXG4gICAgICAvLyBDaGVjayBwdWJsaWMgc3VibmV0c1xuICAgICAgY29uc3QgcHVibGljUmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU3VibmV0c0NvbW1hbmQoe1xuICAgICAgICBTdWJuZXRJZHM6IHB1YmxpY1N1Ym5ldElkcyxcbiAgICAgIH0pKTtcblxuICAgICAgcHVibGljUmVzLlN1Ym5ldHM/LmZvckVhY2goKHN1Ym5ldCwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgdGFncyA9IHN1Ym5ldC5UYWdzIHx8IFtdO1xuICAgICAgICBjb25zdCB0eXBlVGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnVHlwZScpO1xuICAgICAgICBleHBlY3QodHlwZVRhZz8uVmFsdWUpLnRvQmUoJ1B1YmxpYycpO1xuXG4gICAgICAgIGNvbnN0IG5hbWVUYWcgPSB0YWdzLmZpbmQodGFnID0+IHRhZy5LZXkgPT09ICdOYW1lJyk7XG4gICAgICAgIGV4cGVjdChuYW1lVGFnKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBleHBlY3QobmFtZVRhZz8uVmFsdWUpLnRvQ29udGFpbigncHVibGljLXN1Ym5ldCcpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIENoZWNrIHByaXZhdGUgc3VibmV0c1xuICAgICAgY29uc3QgcHJpdmF0ZVJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVN1Ym5ldHNDb21tYW5kKHtcbiAgICAgICAgU3VibmV0SWRzOiBwcml2YXRlU3VibmV0SWRzLFxuICAgICAgfSkpO1xuXG4gICAgICBwcml2YXRlUmVzLlN1Ym5ldHM/LmZvckVhY2goKHN1Ym5ldCwgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgdGFncyA9IHN1Ym5ldC5UYWdzIHx8IFtdO1xuICAgICAgICBjb25zdCB0eXBlVGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnVHlwZScpO1xuICAgICAgICBleHBlY3QodHlwZVRhZz8uVmFsdWUpLnRvQmUoJ1ByaXZhdGUnKTtcblxuICAgICAgICBjb25zdCBuYW1lVGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTmFtZScpO1xuICAgICAgICBleHBlY3QobmFtZVRhZykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KG5hbWVUYWc/LlZhbHVlKS50b0NvbnRhaW4oJ3ByaXZhdGUtc3VibmV0Jyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1JvdXRlIFRhYmxlcycsICgpID0+IHtcbiAgICB0ZXN0KCdQdWJsaWMgcm91dGUgdGFibGVzIHNob3VsZCByb3V0ZSB0byBJbnRlcm5ldCBHYXRld2F5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcHVibGljU3VibmV0SWRzID0gb3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcztcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlUm91dGVUYWJsZXNDb21tYW5kKHtcbiAgICAgICAgRmlsdGVyczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICd2cGMtaWQnLFxuICAgICAgICAgICAgVmFsdWVzOiBbb3V0cHV0cy52cGNfaWRdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgTmFtZTogJ2Fzc29jaWF0aW9uLnN1Ym5ldC1pZCcsXG4gICAgICAgICAgICBWYWx1ZXM6IHB1YmxpY1N1Ym5ldElkcyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSkpO1xuXG4gICAgICBleHBlY3QocmVzLlJvdXRlVGFibGVzPy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMSk7XG5cbiAgICAgIHJlcy5Sb3V0ZVRhYmxlcz8uZm9yRWFjaChyb3V0ZVRhYmxlID0+IHtcbiAgICAgICAgY29uc3QgZGVmYXVsdFJvdXRlID0gcm91dGVUYWJsZS5Sb3V0ZXM/LmZpbmQociA9PiByLkRlc3RpbmF0aW9uQ2lkckJsb2NrID09PSAnMC4wLjAuMC8wJyk7XG4gICAgICAgIGV4cGVjdChkZWZhdWx0Um91dGU/LkdhdGV3YXlJZCkudG9NYXRjaCgvXmlndy0vKTtcbiAgICAgICAgZXhwZWN0KGRlZmF1bHRSb3V0ZT8uU3RhdGUpLnRvQmUoJ2FjdGl2ZScpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdQcml2YXRlIHJvdXRlIHRhYmxlcyBzaG91bGQgcm91dGUgdG8gTkFUIEdhdGV3YXknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBwcml2YXRlU3VibmV0SWRzID0gb3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHM7XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVJvdXRlVGFibGVzQ29tbWFuZCh7XG4gICAgICAgIEZpbHRlcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAndnBjLWlkJyxcbiAgICAgICAgICAgIFZhbHVlczogW291dHB1dHMudnBjX2lkXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICdhc3NvY2lhdGlvbi5zdWJuZXQtaWQnLFxuICAgICAgICAgICAgVmFsdWVzOiBwcml2YXRlU3VibmV0SWRzLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSk7XG5cbiAgICAgIGV4cGVjdChyZXMuUm91dGVUYWJsZXM/Lmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgxKTtcblxuICAgICAgcmVzLlJvdXRlVGFibGVzPy5mb3JFYWNoKHJvdXRlVGFibGUgPT4ge1xuICAgICAgICBjb25zdCBkZWZhdWx0Um91dGUgPSByb3V0ZVRhYmxlLlJvdXRlcz8uZmluZChyID0+IHIuRGVzdGluYXRpb25DaWRyQmxvY2sgPT09ICcwLjAuMC4wLzAnKTtcbiAgICAgICAgZXhwZWN0KGRlZmF1bHRSb3V0ZT8uTmF0R2F0ZXdheUlkKS50b01hdGNoKC9ebmF0LS8pO1xuICAgICAgICBleHBlY3QoZGVmYXVsdFJvdXRlPy5TdGF0ZSkudG9CZSgnYWN0aXZlJyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1JvdXRlIHRhYmxlcyBzaG91bGQgYmUgdGFnZ2VkIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVJvdXRlVGFibGVzQ29tbWFuZCh7XG4gICAgICAgIEZpbHRlcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAndnBjLWlkJyxcbiAgICAgICAgICAgIFZhbHVlczogW291dHB1dHMudnBjX2lkXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICd0YWc6TWFuYWdlZEJ5JyxcbiAgICAgICAgICAgIFZhbHVlczogWydUZXJyYWZvcm0nXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSkpO1xuXG4gICAgICBleHBlY3QocmVzLlJvdXRlVGFibGVzPy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIFxuICAgICAgcmVzLlJvdXRlVGFibGVzPy5mb3JFYWNoKHJvdXRlVGFibGUgPT4ge1xuICAgICAgICBjb25zdCB0YWdzID0gcm91dGVUYWJsZS5UYWdzIHx8IFtdO1xuICAgICAgICBjb25zdCBtYW5hZ2VkQnlUYWcgPSB0YWdzLmZpbmQodGFnID0+IHRhZy5LZXkgPT09ICdNYW5hZ2VkQnknKTtcbiAgICAgICAgZXhwZWN0KG1hbmFnZWRCeVRhZz8uVmFsdWUpLnRvQmUoJ1RlcnJhZm9ybScpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdTZWN1cml0eSBHcm91cHMnLCAoKSA9PiB7XG4gICAgdGVzdCgnQXBwbGljYXRpb24gU2VjdXJpdHkgR3JvdXAgc2hvdWxkIGV4aXN0IHdpdGggY29ycmVjdCBjb25maWd1cmF0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc2dJZCA9IG91dHB1dHMuYXBwX3NlY3VyaXR5X2dyb3VwX2lkO1xuICAgICAgZXhwZWN0KHNnSWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc2dJZCkudG9NYXRjaCgvXnNnLVthLXowLTldKyQvKTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU2VjdXJpdHlHcm91cHNDb21tYW5kKHtcbiAgICAgICAgR3JvdXBJZHM6IFtzZ0lkXSxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3Qgc2cgPSByZXMuU2VjdXJpdHlHcm91cHM/LlswXTtcbiAgICAgIGV4cGVjdChzZykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChzZz8uVnBjSWQpLnRvQmUob3V0cHV0cy52cGNfaWQpO1xuXG4gICAgICAvLyBTaG91bGQgaGF2ZSBvdXRib3VuZCBydWxlIGFsbG93aW5nIGFsbCB0cmFmZmljXG4gICAgICBjb25zdCBlZ3Jlc3NSdWxlcyA9IHNnPy5JcFBlcm1pc3Npb25zRWdyZXNzO1xuICAgICAgY29uc3QgYWxsT3V0Ym91bmRSdWxlID0gZWdyZXNzUnVsZXM/LmZpbmQociA9PlxuICAgICAgICByLklwUHJvdG9jb2wgPT09ICctMScgJiZcbiAgICAgICAgci5JcFJhbmdlcz8uWzBdPy5DaWRySXAgPT09ICcwLjAuMC4wLzAnXG4gICAgICApO1xuICAgICAgZXhwZWN0KGFsbE91dGJvdW5kUnVsZSkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1JEUyBTZWN1cml0eSBHcm91cCBzaG91bGQgZXhpc3Qgd2l0aCBjb3JyZWN0IHJ1bGVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc2dJZCA9IG91dHB1dHMucmRzX3NlY3VyaXR5X2dyb3VwX2lkO1xuICAgICAgZXhwZWN0KHNnSWQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc2dJZCkudG9NYXRjaCgvXnNnLVthLXowLTldKyQvKTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU2VjdXJpdHlHcm91cHNDb21tYW5kKHtcbiAgICAgICAgR3JvdXBJZHM6IFtzZ0lkXSxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3Qgc2cgPSByZXMuU2VjdXJpdHlHcm91cHM/LlswXTtcbiAgICAgIGV4cGVjdChzZykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChzZz8uVnBjSWQpLnRvQmUob3V0cHV0cy52cGNfaWQpO1xuXG4gICAgICAvLyBTaG91bGQgaGF2ZSBpbmJvdW5kIHJ1bGUgZm9yIE15U1FMIGZyb20gYXBwIHNlY3VyaXR5IGdyb3VwXG4gICAgICBjb25zdCBpbmdyZXNzUnVsZXMgPSBzZz8uSXBQZXJtaXNzaW9ucztcbiAgICAgIGNvbnN0IG15c3FsUnVsZSA9IGluZ3Jlc3NSdWxlcz8uZmluZChyID0+XG4gICAgICAgIHIuRnJvbVBvcnQgPT09IDMzMDYgJiZcbiAgICAgICAgci5Ub1BvcnQgPT09IDMzMDYgJiZcbiAgICAgICAgci5JcFByb3RvY29sID09PSAndGNwJ1xuICAgICAgKTtcbiAgICAgIGV4cGVjdChteXNxbFJ1bGUpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QobXlzcWxSdWxlPy5Vc2VySWRHcm91cFBhaXJzPy5bMF0/Lkdyb3VwSWQpLnRvQmUob3V0cHV0cy5hcHBfc2VjdXJpdHlfZ3JvdXBfaWQpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnU2VjdXJpdHkgR3JvdXBzIHNob3VsZCBiZSB0YWdnZWQgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3Qgc2dJZHMgPSBbb3V0cHV0cy5hcHBfc2VjdXJpdHlfZ3JvdXBfaWQsIG91dHB1dHMucmRzX3NlY3VyaXR5X2dyb3VwX2lkXTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU2VjdXJpdHlHcm91cHNDb21tYW5kKHtcbiAgICAgICAgR3JvdXBJZHM6IHNnSWRzLFxuICAgICAgfSkpO1xuXG4gICAgICByZXMuU2VjdXJpdHlHcm91cHM/LmZvckVhY2goc2cgPT4ge1xuICAgICAgICBjb25zdCB0YWdzID0gc2cuVGFncyB8fCBbXTtcbiAgICAgICAgY29uc3QgbWFuYWdlZEJ5VGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTWFuYWdlZEJ5Jyk7XG4gICAgICAgIGV4cGVjdChtYW5hZ2VkQnlUYWc/LlZhbHVlKS50b0JlKCdUZXJyYWZvcm0nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnUkRTIERhdGFiYXNlJywgKCkgPT4ge1xuICAgIHRlc3QoJ1JEUyBNeVNRTCBpbnN0YW5jZSBzaG91bGQgZXhpc3QgYW5kIGJlIGF2YWlsYWJsZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJkc0VuZHBvaW50ID0gb3V0cHV0cy5yZHNfZW5kcG9pbnQ7XG4gICAgICBleHBlY3QocmRzRW5kcG9pbnQpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmRzRW5kcG9pbnQpLnRvTWF0Y2goL1xcLnJkc1xcLmFtYXpvbmF3c1xcLmNvbSg6XFxkKyk/JC8pO1xuXG4gICAgICAvLyBFeHRyYWN0IERCIGlkZW50aWZpZXIgZnJvbSBlbmRwb2ludFxuICAgICAgY29uc3QgZGJJZGVudGlmaWVyID0gcmRzRW5kcG9pbnQuc3BsaXQoJy4nKVswXTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmRzLnNlbmQobmV3IERlc2NyaWJlREJJbnN0YW5jZXNDb21tYW5kKHtcbiAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGRiSWRlbnRpZmllcixcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgZGJJbnN0YW5jZSA9IHJlcy5EQkluc3RhbmNlcz8uWzBdO1xuICAgICAgZXhwZWN0KGRiSW5zdGFuY2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZGJJbnN0YW5jZT8uREJJbnN0YW5jZVN0YXR1cykudG9CZSgnYXZhaWxhYmxlJyk7XG4gICAgICBleHBlY3QoZGJJbnN0YW5jZT8uRW5naW5lKS50b0JlKCdteXNxbCcpO1xuICAgICAgZXhwZWN0KGRiSW5zdGFuY2U/LlN0b3JhZ2VFbmNyeXB0ZWQpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QoZGJJbnN0YW5jZT8uUHVibGljbHlBY2Nlc3NpYmxlKS50b0JlKGZhbHNlKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1JEUyBpbnN0YW5jZSBzaG91bGQgaGF2ZSBjb3JyZWN0IG5ldHdvcmsgY29uZmlndXJhdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJkc0VuZHBvaW50ID0gb3V0cHV0cy5yZHNfZW5kcG9pbnQ7XG4gICAgICBjb25zdCBkYklkZW50aWZpZXIgPSByZHNFbmRwb2ludC5zcGxpdCgnLicpWzBdO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZHMuc2VuZChuZXcgRGVzY3JpYmVEQkluc3RhbmNlc0NvbW1hbmQoe1xuICAgICAgICBEQkluc3RhbmNlSWRlbnRpZmllcjogZGJJZGVudGlmaWVyLFxuICAgICAgfSkpO1xuXG4gICAgICBjb25zdCBkYkluc3RhbmNlID0gcmVzLkRCSW5zdGFuY2VzPy5bMF07XG4gICAgICBleHBlY3QoZGJJbnN0YW5jZT8uVnBjU2VjdXJpdHlHcm91cHM/LlswXT8uVnBjU2VjdXJpdHlHcm91cElkKS50b0JlKG91dHB1dHMucmRzX3NlY3VyaXR5X2dyb3VwX2lkKTtcbiAgICAgIGV4cGVjdChkYkluc3RhbmNlPy5WcGNTZWN1cml0eUdyb3Vwcz8uWzBdPy5TdGF0dXMpLnRvQmUoJ2FjdGl2ZScpO1xuXG4gICAgICAvLyBTaG91bGQgYmUgaW4gcHJpdmF0ZSBzdWJuZXRzXG4gICAgICBjb25zdCBkYlN1Ym5ldEdyb3VwID0gZGJJbnN0YW5jZT8uREJTdWJuZXRHcm91cDtcbiAgICAgIGV4cGVjdChkYlN1Ym5ldEdyb3VwKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGRiU3VibmV0R3JvdXA/LlZwY0lkKS50b0JlKG91dHB1dHMudnBjX2lkKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1JEUyBzdWJuZXQgZ3JvdXAgc2hvdWxkIGV4aXN0IHdpdGggY29ycmVjdCBzdWJuZXRzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmRzRW5kcG9pbnQgPSBvdXRwdXRzLnJkc19lbmRwb2ludDtcbiAgICAgIGNvbnN0IGRiSWRlbnRpZmllciA9IHJkc0VuZHBvaW50LnNwbGl0KCcuJylbMF07XG5cbiAgICAgIGNvbnN0IGRiUmVzID0gYXdhaXQgcmRzLnNlbmQobmV3IERlc2NyaWJlREJJbnN0YW5jZXNDb21tYW5kKHtcbiAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGRiSWRlbnRpZmllcixcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3Qgc3VibmV0R3JvdXBOYW1lID0gZGJSZXMuREJJbnN0YW5jZXM/LlswXT8uREJTdWJuZXRHcm91cD8uREJTdWJuZXRHcm91cE5hbWU7XG4gICAgICBleHBlY3Qoc3VibmV0R3JvdXBOYW1lKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICBjb25zdCBzdWJuZXRSZXMgPSBhd2FpdCByZHMuc2VuZChuZXcgRGVzY3JpYmVEQlN1Ym5ldEdyb3Vwc0NvbW1hbmQoe1xuICAgICAgICBEQlN1Ym5ldEdyb3VwTmFtZTogc3VibmV0R3JvdXBOYW1lLFxuICAgICAgfSkpO1xuXG4gICAgICBjb25zdCBzdWJuZXRHcm91cCA9IHN1Ym5ldFJlcy5EQlN1Ym5ldEdyb3Vwcz8uWzBdO1xuICAgICAgZXhwZWN0KHN1Ym5ldEdyb3VwKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHN1Ym5ldEdyb3VwPy5WcGNJZCkudG9CZShvdXRwdXRzLnZwY19pZCk7XG5cbiAgICAgIGNvbnN0IHN1Ym5ldElkcyA9IHN1Ym5ldEdyb3VwPy5TdWJuZXRzPy5tYXAocyA9PiBzLlN1Ym5ldElkZW50aWZpZXIpLnNvcnQoKTtcbiAgICAgIGNvbnN0IGV4cGVjdGVkU3VibmV0SWRzID0gb3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHMuc29ydCgpO1xuICAgICAgZXhwZWN0KHN1Ym5ldElkcykudG9FcXVhbChleHBlY3RlZFN1Ym5ldElkcyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdSRFMgaW5zdGFuY2Ugc2hvdWxkIGhhdmUgY29ycmVjdCBiYWNrdXAgY29uZmlndXJhdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJkc0VuZHBvaW50ID0gb3V0cHV0cy5yZHNfZW5kcG9pbnQ7XG4gICAgICBjb25zdCBkYklkZW50aWZpZXIgPSByZHNFbmRwb2ludC5zcGxpdCgnLicpWzBdO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZHMuc2VuZChuZXcgRGVzY3JpYmVEQkluc3RhbmNlc0NvbW1hbmQoe1xuICAgICAgICBEQkluc3RhbmNlSWRlbnRpZmllcjogZGJJZGVudGlmaWVyLFxuICAgICAgfSkpO1xuXG4gICAgICBjb25zdCBkYkluc3RhbmNlID0gcmVzLkRCSW5zdGFuY2VzPy5bMF07XG4gICAgICBleHBlY3QoZGJJbnN0YW5jZT8uQmFja3VwUmV0ZW50aW9uUGVyaW9kKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDcpO1xuICAgICAgZXhwZWN0KGRiSW5zdGFuY2U/LlByZWZlcnJlZEJhY2t1cFdpbmRvdykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChkYkluc3RhbmNlPy5QcmVmZXJyZWRNYWludGVuYW5jZVdpbmRvdykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChkYkluc3RhbmNlPy5Db3B5VGFnc1RvU25hcHNob3QpLnRvQmUodHJ1ZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdSRFMgaW5zdGFuY2Ugc2hvdWxkIGhhdmUgQ2xvdWRXYXRjaCBsb2dzIGVuYWJsZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZHNFbmRwb2ludCA9IG91dHB1dHMucmRzX2VuZHBvaW50O1xuICAgICAgY29uc3QgZGJJZGVudGlmaWVyID0gcmRzRW5kcG9pbnQuc3BsaXQoJy4nKVswXTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmRzLnNlbmQobmV3IERlc2NyaWJlREJJbnN0YW5jZXNDb21tYW5kKHtcbiAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGRiSWRlbnRpZmllcixcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgZGJJbnN0YW5jZSA9IHJlcy5EQkluc3RhbmNlcz8uWzBdO1xuICAgICAgY29uc3QgZW5hYmxlZExvZ3MgPSBkYkluc3RhbmNlPy5FbmFibGVkQ2xvdWR3YXRjaExvZ3NFeHBvcnRzIHx8IFtdO1xuICAgICAgZXhwZWN0KGVuYWJsZWRMb2dzKS50b0NvbnRhaW4oJ2Vycm9yJyk7XG4gICAgICBleHBlY3QoZW5hYmxlZExvZ3MpLnRvQ29udGFpbignZ2VuZXJhbCcpO1xuICAgICAgZXhwZWN0KGVuYWJsZWRMb2dzKS50b0NvbnRhaW4oJ3Nsb3dxdWVyeScpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUkRTIGluc3RhbmNlIHNob3VsZCBiZSB0YWdnZWQgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmRzRW5kcG9pbnQgPSBvdXRwdXRzLnJkc19lbmRwb2ludDtcbiAgICAgIGNvbnN0IGRiSWRlbnRpZmllciA9IHJkc0VuZHBvaW50LnNwbGl0KCcuJylbMF07XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJkcy5zZW5kKG5ldyBEZXNjcmliZURCSW5zdGFuY2VzQ29tbWFuZCh7XG4gICAgICAgIERCSW5zdGFuY2VJZGVudGlmaWVyOiBkYklkZW50aWZpZXIsXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IGRiSW5zdGFuY2UgPSByZXMuREJJbnN0YW5jZXM/LlswXTtcbiAgICAgIGNvbnN0IHRhZ3MgPSBkYkluc3RhbmNlPy5UYWdMaXN0IHx8IFtdO1xuXG4gICAgICBjb25zdCBuYW1lVGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTmFtZScpO1xuICAgICAgZXhwZWN0KG5hbWVUYWcpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IG1hbmFnZWRCeVRhZyA9IHRhZ3MuZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ01hbmFnZWRCeScpO1xuICAgICAgZXhwZWN0KG1hbmFnZWRCeVRhZz8uVmFsdWUpLnRvQmUoJ1RlcnJhZm9ybScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnUmVzb3VyY2UgVGFnZ2luZyBDb25zaXN0ZW5jeScsICgpID0+IHtcbiAgICB0ZXN0KCdBbGwgbWFqb3IgcmVzb3VyY2VzIHNob3VsZCBoYXZlIGNvbnNpc3RlbnQgdGFnZ2luZycsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIENoZWNrIFZQQ1xuICAgICAgY29uc3QgdnBjUmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlVnBjc0NvbW1hbmQoeyBWcGNJZHM6IFtvdXRwdXRzLnZwY19pZF0gfSkpO1xuICAgICAgY29uc3QgdnBjVGFncyA9IHZwY1Jlcy5WcGNzPy5bMF0/LlRhZ3MgfHwgW107XG5cbiAgICAgIC8vIENoZWNrIFNlY3VyaXR5IEdyb3Vwc1xuICAgICAgY29uc3Qgc2dSZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTZWN1cml0eUdyb3Vwc0NvbW1hbmQoe1xuICAgICAgICBHcm91cElkczogW291dHB1dHMuYXBwX3NlY3VyaXR5X2dyb3VwX2lkLCBvdXRwdXRzLnJkc19zZWN1cml0eV9ncm91cF9pZF0sXG4gICAgICB9KSk7XG5cbiAgICAgIC8vIENoZWNrIFN1Ym5ldHNcbiAgICAgIGNvbnN0IHN1Ym5ldFJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVN1Ym5ldHNDb21tYW5kKHtcbiAgICAgICAgU3VibmV0SWRzOiBbLi4ub3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcywgLi4ub3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHNdLFxuICAgICAgfSkpO1xuXG4gICAgICAvLyBBbGwgcmVzb3VyY2VzIHNob3VsZCBoYXZlIE1hbmFnZWRCeSA9IFRlcnJhZm9ybVxuICAgICAgW3ZwY1RhZ3MsIC4uLnNnUmVzLlNlY3VyaXR5R3JvdXBzPy5tYXAoc2cgPT4gc2cuVGFncykgfHwgW10sIC4uLnN1Ym5ldFJlcy5TdWJuZXRzPy5tYXAocyA9PiBzLlRhZ3MpIHx8IFtdXS5mb3JFYWNoKHRhZ3MgPT4ge1xuICAgICAgICBjb25zdCBtYW5hZ2VkQnlUYWcgPSB0YWdzPy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTWFuYWdlZEJ5Jyk7XG4gICAgICAgIGV4cGVjdChtYW5hZ2VkQnlUYWc/LlZhbHVlKS50b0JlKCdUZXJyYWZvcm0nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnT3V0cHV0IFZhbGlkYXRpb24nLCAoKSA9PiB7XG4gICAgdGVzdCgnQWxsIHJlcXVpcmVkIG91dHB1dHMgc2hvdWxkIGJlIHByZXNlbnQgYW5kIHZhbGlkJywgKCkgPT4ge1xuICAgICAgY29uc3QgcmVxdWlyZWRPdXRwdXRzID0gW1xuICAgICAgICAndnBjX2lkJyxcbiAgICAgICAgJ3B1YmxpY19zdWJuZXRfaWRzJyxcbiAgICAgICAgJ3ByaXZhdGVfc3VibmV0X2lkcycsXG4gICAgICAgICdhcHBfc2VjdXJpdHlfZ3JvdXBfaWQnLFxuICAgICAgICAncmRzX3NlY3VyaXR5X2dyb3VwX2lkJyxcbiAgICAgICAgJ3Jkc19lbmRwb2ludCcsXG4gICAgICAgICdyZHNfcG9ydCcsXG4gICAgICBdO1xuXG4gICAgICByZXF1aXJlZE91dHB1dHMuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgICBleHBlY3Qob3V0cHV0c1trZXldKS50b0JlRGVmaW5lZCgpO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkob3V0cHV0c1trZXldKSkge1xuICAgICAgICAgIGV4cGVjdChvdXRwdXRzW2tleV0pLm5vdC50b0JlKCcnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdPdXRwdXQgdmFsdWVzIHNob3VsZCBoYXZlIGNvcnJlY3QgQVdTIHJlc291cmNlIElEIGZvcm1hdCcsICgpID0+IHtcbiAgICAgIGV4cGVjdChvdXRwdXRzLnZwY19pZCkudG9NYXRjaCgvXnZwYy1bYS16MC05XSskLyk7XG4gICAgICBleHBlY3Qob3V0cHV0cy5hcHBfc2VjdXJpdHlfZ3JvdXBfaWQpLnRvTWF0Y2goL15zZy1bYS16MC05XSskLyk7XG4gICAgICBleHBlY3Qob3V0cHV0cy5yZHNfc2VjdXJpdHlfZ3JvdXBfaWQpLnRvTWF0Y2goL15zZy1bYS16MC05XSskLyk7XG4gICAgICBleHBlY3Qob3V0cHV0cy5yZHNfZW5kcG9pbnQpLnRvTWF0Y2goL1xcLnJkc1xcLmFtYXpvbmF3c1xcLmNvbSg6XFxkKyk/JC8pO1xuXG4gICAgICAvLyBDaGVjayBzdWJuZXQgSURzXG4gICAgICBvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzLmZvckVhY2goKGlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgZXhwZWN0KGlkKS50b01hdGNoKC9ec3VibmV0LVthLXowLTldKyQvKTtcbiAgICAgIH0pO1xuXG4gICAgICBvdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkcy5mb3JFYWNoKChpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGV4cGVjdChpZCkudG9NYXRjaCgvXnN1Ym5ldC1bYS16MC05XSskLyk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1N1Ym5ldCBhcnJheXMgc2hvdWxkIGhhdmUgZXhwZWN0ZWQgY291bnRzJywgKCkgPT4ge1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkob3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QoQXJyYXkuaXNBcnJheShvdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkcykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3Qob3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcy5sZW5ndGgpLnRvQmUoMik7XG4gICAgICBleHBlY3Qob3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHMubGVuZ3RoKS50b0JlKDIpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnSW5mcmFzdHJ1Y3R1cmUgSGVhbHRoIGFuZCBDb25uZWN0aXZpdHknLCAoKSA9PiB7XG4gICAgdGVzdCgnQWxsIGF2YWlsYWJpbGl0eSB6b25lcyBzaG91bGQgYmUgZGlmZmVyZW50IGZvciByZWR1bmRhbmN5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYWxsU3VibmV0SWRzID0gWy4uLm91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMsIC4uLm91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzXTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU3VibmV0c0NvbW1hbmQoe1xuICAgICAgICBTdWJuZXRJZHM6IGFsbFN1Ym5ldElkcyxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgYXpzID0gcmVzLlN1Ym5ldHM/Lm1hcChzID0+IHMuQXZhaWxhYmlsaXR5Wm9uZSk7XG4gICAgICBjb25zdCB1bmlxdWVBenMgPSBuZXcgU2V0KGF6cyk7XG5cbiAgICAgIC8vIFNob3VsZCBoYXZlIGF0IGxlYXN0IDIgZGlmZmVyZW50IEFacyBmb3IgcmVkdW5kYW5jeVxuICAgICAgZXhwZWN0KHVuaXF1ZUF6cy5zaXplKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDIpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnTkFUIEdhdGV3YXkgc2hvdWxkIGhhdmUgRWxhc3RpYyBJUCBhc3NpZ25lZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZU5hdEdhdGV3YXlzQ29tbWFuZCh7XG4gICAgICAgIEZpbHRlcjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICd2cGMtaWQnLFxuICAgICAgICAgICAgVmFsdWVzOiBbb3V0cHV0cy52cGNfaWRdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgTmFtZTogJ3N0YXRlJyxcbiAgICAgICAgICAgIFZhbHVlczogWydhdmFpbGFibGUnXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSkpO1xuXG4gICAgICBjb25zdCBuYXRHYXRld2F5ID0gcmVzLk5hdEdhdGV3YXlzPy5bMF07XG4gICAgICBleHBlY3QobmF0R2F0ZXdheT8uTmF0R2F0ZXdheUFkZHJlc3Nlcz8ubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDEpO1xuXG4gICAgICBjb25zdCBhZGRyZXNzID0gbmF0R2F0ZXdheT8uTmF0R2F0ZXdheUFkZHJlc3Nlcz8uWzBdO1xuICAgICAgZXhwZWN0KGFkZHJlc3M/LlB1YmxpY0lwKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGFkZHJlc3M/LkFsbG9jYXRpb25JZCkudG9NYXRjaCgvXmVpcGFsbG9jLS8pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnRGF0YWJhc2Ugc2hvdWxkIGJlIGFjY2Vzc2libGUgZnJvbSBhcHBsaWNhdGlvbiBzZWN1cml0eSBncm91cCcsIGFzeW5jICgpID0+IHtcbiAgICAgIC8vIFRoaXMgdGVzdCB2ZXJpZmllcyB0aGUgc2VjdXJpdHkgZ3JvdXAgcnVsZXMgYWxsb3cgY29ubmVjdGl2aXR5XG4gICAgICBjb25zdCByZHNSZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTZWN1cml0eUdyb3Vwc0NvbW1hbmQoe1xuICAgICAgICBHcm91cElkczogW291dHB1dHMucmRzX3NlY3VyaXR5X2dyb3VwX2lkXSxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgcmRzU2cgPSByZHNSZXMuU2VjdXJpdHlHcm91cHM/LlswXTtcbiAgICAgIGNvbnN0IG15c3FsUnVsZSA9IHJkc1NnPy5JcFBlcm1pc3Npb25zPy5maW5kKHIgPT5cbiAgICAgICAgci5Gcm9tUG9ydCA9PT0gMzMwNiAmJiByLlRvUG9ydCA9PT0gMzMwNlxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KG15c3FsUnVsZT8uVXNlcklkR3JvdXBQYWlycz8uWzBdPy5Hcm91cElkKS50b0JlKG91dHB1dHMuYXBwX3NlY3VyaXR5X2dyb3VwX2lkKTtcblxuICAgICAgLy8gVmVyaWZ5IHRoZSBhcHAgc2VjdXJpdHkgZ3JvdXAgZXhpc3RzXG4gICAgICBjb25zdCBhcHBSZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTZWN1cml0eUdyb3Vwc0NvbW1hbmQoe1xuICAgICAgICBHcm91cElkczogW291dHB1dHMuYXBwX3NlY3VyaXR5X2dyb3VwX2lkXSxcbiAgICAgIH0pKTtcblxuICAgICAgZXhwZWN0KGFwcFJlcy5TZWN1cml0eUdyb3Vwcz8uWzBdKS50b0JlRGVmaW5lZCgpO1xuICAgIH0pO1xuICB9KTtcbn0pOyJdfQ==