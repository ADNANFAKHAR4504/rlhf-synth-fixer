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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVycmFmb3JtLmludC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGVycmFmb3JtLmludC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUEsb0RBUTZCO0FBQzdCLG9EQUk2QjtBQUM3Qiw0Q0FBb0I7QUFDcEIsZ0RBQXdCO0FBRXhCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQztBQUVyRCxvQ0FBb0M7QUFDcEMsSUFBSSxPQUFPLEdBQVEsRUFBRSxDQUFDO0FBQ3RCLE1BQU0sV0FBVyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxFQUFFLCtCQUErQixDQUFDLENBQUM7QUFFOUUsSUFBSSxDQUFDO0lBQ0gsSUFBSSxDQUFDLFlBQUUsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQztRQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixXQUFXLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQUUsQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFFckUsNkVBQTZFO0lBQzdFLEtBQUssTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFDdEQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxPQUFPLElBQUksS0FBSyxFQUFFLENBQUM7WUFDcEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFJLEtBQWEsQ0FBQyxLQUFLLENBQUM7UUFDdEMsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3ZCLENBQUM7SUFDSCxDQUFD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cUIsQ0FBQyxDQUFDO1lBRXRGLHVDQUF1QztZQUN2QyxNQUFNLE1BQU0sR0FBRyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSwwQ0FBNkIsQ0FBQztnQkFDOUQsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLHFCQUFxQixDQUFDO2FBQzFDLENBQUMsQ0FBQyxDQUFDO1lBRUosTUFBTSxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ25ELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIERlc2NyaWJlSW50ZXJuZXRHYXRld2F5c0NvbW1hbmQsXG4gIERlc2NyaWJlTmF0R2F0ZXdheXNDb21tYW5kLFxuICBEZXNjcmliZVJvdXRlVGFibGVzQ29tbWFuZCxcbiAgRGVzY3JpYmVTZWN1cml0eUdyb3Vwc0NvbW1hbmQsXG4gIERlc2NyaWJlU3VibmV0c0NvbW1hbmQsXG4gIERlc2NyaWJlVnBjc0NvbW1hbmQsXG4gIEVDMkNsaWVudFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtZWMyJztcbmltcG9ydCB7XG4gIERlc2NyaWJlREJJbnN0YW5jZXNDb21tYW5kLFxuICBEZXNjcmliZURCU3VibmV0R3JvdXBzQ29tbWFuZCxcbiAgUkRTQ2xpZW50XG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1yZHMnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5jb25zdCByZWdpb24gPSBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIHx8ICd1cy1lYXN0LTEnO1xuXG4vLyBSZWFkIHRoZSBhY3R1YWwgVGVycmFmb3JtIG91dHB1dHNcbmxldCBvdXRwdXRzOiBhbnkgPSB7fTtcbmNvbnN0IG91dHB1dHNQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICdjZm4tb3V0cHV0cy9mbGF0LW91dHB1dHMuanNvbicpO1xuXG50cnkge1xuICBpZiAoIWZzLmV4aXN0c1N5bmMob3V0cHV0c1BhdGgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBPdXRwdXRzIGZpbGUgbm90IGZvdW5kIGF0OiAke291dHB1dHNQYXRofWApO1xuICB9XG4gIFxuICBjb25zdCByYXdPdXRwdXRzID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmMob3V0cHV0c1BhdGgsICd1dGYtOCcpKTtcbiAgXG4gIC8vIEhhbmRsZSBUZXJyYWZvcm0gb3V0cHV0IGZvcm1hdCAtIG91dHB1dHMgbWlnaHQgYmUgbmVzdGVkIHVuZGVyICd2YWx1ZScga2V5XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKHJhd091dHB1dHMpKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgJ3ZhbHVlJyBpbiB2YWx1ZSkge1xuICAgICAgb3V0cHV0c1trZXldID0gKHZhbHVlIGFzIGFueSkudmFsdWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dHNba2V5XSA9IHZhbHVlO1xuICAgIH1cbiAgfVxuICBcbiAgLy8gUGFyc2UgSlNPTiBzdHJpbmdzIGlmIG5lZWRlZCAoZm9yIGFycmF5cylcbiAgaWYgKHR5cGVvZiBvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzID09PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICBvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzID0gSlNPTi5wYXJzZShvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIElmIGl0J3MgYSBjb21tYS1zZXBhcmF0ZWQgc3RyaW5nXG4gICAgICBvdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzID0gb3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcy5zcGxpdCgnLCcpLm1hcCgoczogc3RyaW5nKSA9PiBzLnRyaW0oKSk7XG4gICAgfVxuICB9XG4gIFxuICBpZiAodHlwZW9mIG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzID09PSAnc3RyaW5nJykge1xuICAgIHRyeSB7XG4gICAgICBvdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkcyA9IEpTT04ucGFyc2Uob3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHMpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gSWYgaXQncyBhIGNvbW1hLXNlcGFyYXRlZCBzdHJpbmdcbiAgICAgIG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzID0gb3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHMuc3BsaXQoJywnKS5tYXAoKHM6IHN0cmluZykgPT4gcy50cmltKCkpO1xuICAgIH1cbiAgfVxuICBcbiAgaWYgKHR5cGVvZiBvdXRwdXRzLm5hdF9nYXRld2F5X2lkcyA9PT0gJ3N0cmluZycpIHtcbiAgICB0cnkge1xuICAgICAgb3V0cHV0cy5uYXRfZ2F0ZXdheV9pZHMgPSBKU09OLnBhcnNlKG91dHB1dHMubmF0X2dhdGV3YXlfaWRzKTtcbiAgICB9IGNhdGNoIHtcbiAgICAgIC8vIElmIGl0J3MgYSBjb21tYS1zZXBhcmF0ZWQgc3RyaW5nXG4gICAgICBvdXRwdXRzLm5hdF9nYXRld2F5X2lkcyA9IG91dHB1dHMubmF0X2dhdGV3YXlfaWRzLnNwbGl0KCcsJykubWFwKChzOiBzdHJpbmcpID0+IHMudHJpbSgpKTtcbiAgICB9XG4gIH1cbiAgXG4gIGNvbnNvbGUubG9nKCdMb2FkZWQgVGVycmFmb3JtIG91dHB1dHM6JywgSlNPTi5zdHJpbmdpZnkob3V0cHV0cywgbnVsbCwgMikpO1xufSBjYXRjaCAoZXJyb3IpIHtcbiAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGxvYWQgVGVycmFmb3JtIG91dHB1dHM6JywgZXJyb3IpO1xuICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBydW4gaW50ZWdyYXRpb24gdGVzdHMgd2l0aG91dCB2YWxpZCBUZXJyYWZvcm0gb3V0cHV0cy4gUGxlYXNlIHJ1biBcInRlcnJhZm9ybSBhcHBseVwiIGFuZCBlbnN1cmUgb3V0cHV0cyBhcmUgZXhwb3J0ZWQuJyk7XG59XG5cbmNvbnN0IGVjMiA9IG5ldyBFQzJDbGllbnQoeyByZWdpb24gfSk7XG5jb25zdCByZHMgPSBuZXcgUkRTQ2xpZW50KHsgcmVnaW9uIH0pO1xuXG5kZXNjcmliZSgnVGVycmFmb3JtIEluZnJhc3RydWN0dXJlIC0gQVdTIFJlc291cmNlIEludGVncmF0aW9uIFRlc3RzJywgKCkgPT4ge1xuXG4gIGJlZm9yZUFsbCgoKSA9PiB7XG4gICAgLy8gVmFsaWRhdGUgdGhhdCB3ZSBoYXZlIGVzc2VudGlhbCBvdXRwdXRzXG4gICAgY29uc3QgZXNzZW50aWFsT3V0cHV0cyA9IFsndnBjX2lkJ107XG4gICAgY29uc3QgbWlzc2luZ091dHB1dHMgPSBlc3NlbnRpYWxPdXRwdXRzLmZpbHRlcihrZXkgPT4gIW91dHB1dHNba2V5XSk7XG4gICAgXG4gICAgaWYgKG1pc3NpbmdPdXRwdXRzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyBlc3NlbnRpYWwgb3V0cHV0czogJHttaXNzaW5nT3V0cHV0cy5qb2luKCcsICcpfWApO1xuICAgIH1cbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1ZQQyBhbmQgTmV0d29ya2luZycsICgpID0+IHtcbiAgICB0ZXN0KCdWUEMgc2hvdWxkIGV4aXN0IGFuZCBiZSBhdmFpbGFibGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB2cGNJZCA9IG91dHB1dHMudnBjX2lkO1xuICAgICAgZXhwZWN0KHZwY0lkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHZwY0lkKS50b01hdGNoKC9ednBjLVthLXowLTldKyQvKTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlVnBjc0NvbW1hbmQoe1xuICAgICAgICBWcGNJZHM6IFt2cGNJZF0sXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IHZwYyA9IHJlcy5WcGNzPy5bMF07XG4gICAgICBleHBlY3QodnBjKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHZwYz8uU3RhdGUpLnRvQmUoJ2F2YWlsYWJsZScpO1xuICAgICAgZXhwZWN0KHZwYz8uQ2lkckJsb2NrKS50b0JlKG91dHB1dHMudnBjX2NpZHIgfHwgJzEwLjAuMC4wLzE2Jyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdWUEMgc2hvdWxkIGJlIHRhZ2dlZCBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB2cGNJZCA9IG91dHB1dHMudnBjX2lkO1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlVnBjc0NvbW1hbmQoeyBWcGNJZHM6IFt2cGNJZF0gfSkpO1xuICAgICAgY29uc3QgdGFncyA9IHJlcy5WcGNzPy5bMF0/LlRhZ3MgfHwgW107XG5cbiAgICAgIGNvbnN0IG5hbWVUYWcgPSB0YWdzLmZpbmQodGFnID0+IHRhZy5LZXkgPT09ICdOYW1lJyk7XG4gICAgICBleHBlY3QobmFtZVRhZykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChuYW1lVGFnPy5WYWx1ZSkudG9Db250YWluKCd2cGMnKTtcblxuICAgICAgY29uc3QgbWFuYWdlZEJ5VGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTWFuYWdlZEJ5Jyk7XG4gICAgICBleHBlY3QobWFuYWdlZEJ5VGFnPy5WYWx1ZSkudG9CZSgnVGVycmFmb3JtJyk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdJbnRlcm5ldCBHYXRld2F5IHNob3VsZCBleGlzdCBhbmQgYmUgYXR0YWNoZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCB2cGNJZCA9IG91dHB1dHMudnBjX2lkO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVJbnRlcm5ldEdhdGV3YXlzQ29tbWFuZCh7XG4gICAgICAgIEZpbHRlcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAnYXR0YWNobWVudC52cGMtaWQnLFxuICAgICAgICAgICAgVmFsdWVzOiBbdnBjSWRdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IGlndyA9IHJlcy5JbnRlcm5ldEdhdGV3YXlzPy5bMF07XG4gICAgICBleHBlY3QoaWd3KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGlndz8uQXR0YWNobWVudHM/LlswXT8uU3RhdGUpLnRvQmUoJ2F2YWlsYWJsZScpO1xuICAgICAgZXhwZWN0KGlndz8uQXR0YWNobWVudHM/LlswXT8uVnBjSWQpLnRvQmUodnBjSWQpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnTkFUIEdhdGV3YXkgc2hvdWxkIGV4aXN0IGFuZCBiZSBhdmFpbGFibGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVOYXRHYXRld2F5c0NvbW1hbmQoe1xuICAgICAgICBGaWx0ZXI6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAndnBjLWlkJyxcbiAgICAgICAgICAgIFZhbHVlczogW291dHB1dHMudnBjX2lkXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICdzdGF0ZScsXG4gICAgICAgICAgICBWYWx1ZXM6IFsnYXZhaWxhYmxlJ10sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgICAgZXhwZWN0KHJlcy5OYXRHYXRld2F5cz8ubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDEpO1xuXG4gICAgICBjb25zdCBuYXRHYXRld2F5ID0gcmVzLk5hdEdhdGV3YXlzPy5bMF07XG4gICAgICBleHBlY3QobmF0R2F0ZXdheSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChuYXRHYXRld2F5Py5TdGF0ZSkudG9CZSgnYXZhaWxhYmxlJyk7XG4gICAgICBleHBlY3QobmF0R2F0ZXdheT8uTmF0R2F0ZXdheUFkZHJlc3Nlcz8uWzBdPy5QdWJsaWNJcCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChuYXRHYXRld2F5Py5WcGNJZCkudG9CZShvdXRwdXRzLnZwY19pZCk7XG4gICAgICBcbiAgICAgIC8vIElmIHdlIGhhdmUgbmF0X2dhdGV3YXlfaWRzIGluIG91dHB1dHMsIHZlcmlmeSB0aGVtXG4gICAgICBpZiAob3V0cHV0cy5uYXRfZ2F0ZXdheV9pZHMgJiYgQXJyYXkuaXNBcnJheShvdXRwdXRzLm5hdF9nYXRld2F5X2lkcykpIHtcbiAgICAgICAgY29uc3QgbmF0R2F0ZXdheUlkcyA9IHJlcy5OYXRHYXRld2F5cz8ubWFwKG5nID0+IG5nLk5hdEdhdGV3YXlJZCk7XG4gICAgICAgIG91dHB1dHMubmF0X2dhdGV3YXlfaWRzLmZvckVhY2goKGlkOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICBleHBlY3QobmF0R2F0ZXdheUlkcykudG9Db250YWluKGlkKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdOQVQgR2F0ZXdheSBzaG91bGQgYmUgdGFnZ2VkIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZU5hdEdhdGV3YXlzQ29tbWFuZCh7XG4gICAgICAgIEZpbHRlcjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICd2cGMtaWQnLFxuICAgICAgICAgICAgVmFsdWVzOiBbb3V0cHV0cy52cGNfaWRdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IG5hdEdhdGV3YXkgPSByZXMuTmF0R2F0ZXdheXM/LlswXTtcbiAgICAgIGNvbnN0IHRhZ3MgPSBuYXRHYXRld2F5Py5UYWdzIHx8IFtdO1xuXG4gICAgICBjb25zdCBuYW1lVGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTmFtZScpO1xuICAgICAgZXhwZWN0KG5hbWVUYWcpLnRvQmVEZWZpbmVkKCk7XG5cbiAgICAgIGNvbnN0IG1hbmFnZWRCeVRhZyA9IHRhZ3MuZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ01hbmFnZWRCeScpO1xuICAgICAgZXhwZWN0KG1hbmFnZWRCeVRhZz8uVmFsdWUpLnRvQmUoJ1RlcnJhZm9ybScpO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnU3VibmV0cycsICgpID0+IHtcbiAgICB0ZXN0KCdBbGwgcHVibGljIGFuZCBwcml2YXRlIHN1Ym5ldHMgc2hvdWxkIGV4aXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcHVibGljU3VibmV0SWRzID0gb3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcztcbiAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXRJZHMgPSBvdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkcztcblxuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkocHVibGljU3VibmV0SWRzKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KHByaXZhdGVTdWJuZXRJZHMpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KHB1YmxpY1N1Ym5ldElkcy5sZW5ndGgpLnRvQmUoMik7XG4gICAgICBleHBlY3QocHJpdmF0ZVN1Ym5ldElkcy5sZW5ndGgpLnRvQmUoMik7XG5cbiAgICAgIGNvbnN0IGFsbFN1Ym5ldElkcyA9IFsuLi5wdWJsaWNTdWJuZXRJZHMsIC4uLnByaXZhdGVTdWJuZXRJZHNdO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTdWJuZXRzQ29tbWFuZCh7XG4gICAgICAgIFN1Ym5ldElkczogYWxsU3VibmV0SWRzLFxuICAgICAgfSkpO1xuXG4gICAgICBleHBlY3QocmVzLlN1Ym5ldHM/Lmxlbmd0aCkudG9CZSg0KTtcbiAgICAgIHJlcy5TdWJuZXRzPy5mb3JFYWNoKHN1Ym5ldCA9PiB7XG4gICAgICAgIGV4cGVjdChzdWJuZXQuU3RhdGUpLnRvQmUoJ2F2YWlsYWJsZScpO1xuICAgICAgICBleHBlY3Qoc3VibmV0LlZwY0lkKS50b0JlKG91dHB1dHMudnBjX2lkKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUHVibGljIHN1Ym5ldHMgc2hvdWxkIGhhdmUgY29ycmVjdCBjb25maWd1cmF0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcHVibGljU3VibmV0SWRzID0gb3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcztcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU3VibmV0c0NvbW1hbmQoe1xuICAgICAgICBTdWJuZXRJZHM6IHB1YmxpY1N1Ym5ldElkcyxcbiAgICAgIH0pKTtcblxuICAgICAgcmVzLlN1Ym5ldHM/LmZvckVhY2goc3VibmV0ID0+IHtcbiAgICAgICAgZXhwZWN0KHN1Ym5ldC5NYXBQdWJsaWNJcE9uTGF1bmNoKS50b0JlKHRydWUpO1xuICAgICAgICBleHBlY3Qoc3VibmV0LkNpZHJCbG9jaykudG9NYXRjaCgvXjEwXFwuMFxcLlsxMl1cXC4wXFwvMjQkLyk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2lkcnMgPSByZXMuU3VibmV0cz8ubWFwKHMgPT4gcy5DaWRyQmxvY2spLnNvcnQoKTtcbiAgICAgIGV4cGVjdChjaWRycykudG9FcXVhbChbJzEwLjAuMS4wLzI0JywgJzEwLjAuMi4wLzI0J10pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUHJpdmF0ZSBzdWJuZXRzIHNob3VsZCBoYXZlIGNvcnJlY3QgY29uZmlndXJhdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXRJZHMgPSBvdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkcztcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU3VibmV0c0NvbW1hbmQoe1xuICAgICAgICBTdWJuZXRJZHM6IHByaXZhdGVTdWJuZXRJZHMsXG4gICAgICB9KSk7XG5cbiAgICAgIHJlcy5TdWJuZXRzPy5mb3JFYWNoKHN1Ym5ldCA9PiB7XG4gICAgICAgIGV4cGVjdChzdWJuZXQuTWFwUHVibGljSXBPbkxhdW5jaCkudG9CZShmYWxzZSk7XG4gICAgICAgIGV4cGVjdChzdWJuZXQuQ2lkckJsb2NrKS50b01hdGNoKC9eMTBcXC4wXFwuMVswMV1cXC4wXFwvMjQkLyk7XG4gICAgICB9KTtcblxuICAgICAgY29uc3QgY2lkcnMgPSByZXMuU3VibmV0cz8ubWFwKHMgPT4gcy5DaWRyQmxvY2spLnNvcnQoKTtcbiAgICAgIGV4cGVjdChjaWRycykudG9FcXVhbChbJzEwLjAuMTAuMC8yNCcsICcxMC4wLjExLjAvMjQnXSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdTdWJuZXRzIHNob3VsZCBiZSBpbiBkaWZmZXJlbnQgYXZhaWxhYmlsaXR5IHpvbmVzJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYWxsU3VibmV0SWRzID0gWy4uLm91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMsIC4uLm91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzXTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU3VibmV0c0NvbW1hbmQoe1xuICAgICAgICBTdWJuZXRJZHM6IGFsbFN1Ym5ldElkcyxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgYXpzID0gcmVzLlN1Ym5ldHM/Lm1hcChzID0+IHMuQXZhaWxhYmlsaXR5Wm9uZSk7XG4gICAgICBjb25zdCB1bmlxdWVBenMgPSBuZXcgU2V0KGF6cyk7XG4gICAgICBleHBlY3QodW5pcXVlQXpzLnNpemUpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMik7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdTdWJuZXRzIHNob3VsZCBiZSB0YWdnZWQgY29ycmVjdGx5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcHVibGljU3VibmV0SWRzID0gb3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcztcbiAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXRJZHMgPSBvdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkcztcblxuICAgICAgLy8gQ2hlY2sgcHVibGljIHN1Ym5ldHNcbiAgICAgIGNvbnN0IHB1YmxpY1JlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVN1Ym5ldHNDb21tYW5kKHtcbiAgICAgICAgU3VibmV0SWRzOiBwdWJsaWNTdWJuZXRJZHMsXG4gICAgICB9KSk7XG5cbiAgICAgIHB1YmxpY1Jlcy5TdWJuZXRzPy5mb3JFYWNoKChzdWJuZXQsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBzdWJuZXQuVGFncyB8fCBbXTtcbiAgICAgICAgY29uc3QgdHlwZVRhZyA9IHRhZ3MuZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ1R5cGUnKTtcbiAgICAgICAgZXhwZWN0KHR5cGVUYWc/LlZhbHVlKS50b0JlKCdQdWJsaWMnKTtcblxuICAgICAgICBjb25zdCBuYW1lVGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTmFtZScpO1xuICAgICAgICBleHBlY3QobmFtZVRhZykudG9CZURlZmluZWQoKTtcbiAgICAgICAgZXhwZWN0KG5hbWVUYWc/LlZhbHVlKS50b0NvbnRhaW4oJ3B1YmxpYy1zdWJuZXQnKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBDaGVjayBwcml2YXRlIHN1Ym5ldHNcbiAgICAgIGNvbnN0IHByaXZhdGVSZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTdWJuZXRzQ29tbWFuZCh7XG4gICAgICAgIFN1Ym5ldElkczogcHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgIH0pKTtcblxuICAgICAgcHJpdmF0ZVJlcy5TdWJuZXRzPy5mb3JFYWNoKChzdWJuZXQsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHRhZ3MgPSBzdWJuZXQuVGFncyB8fCBbXTtcbiAgICAgICAgY29uc3QgdHlwZVRhZyA9IHRhZ3MuZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ1R5cGUnKTtcbiAgICAgICAgZXhwZWN0KHR5cGVUYWc/LlZhbHVlKS50b0JlKCdQcml2YXRlJyk7XG5cbiAgICAgICAgY29uc3QgbmFtZVRhZyA9IHRhZ3MuZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ05hbWUnKTtcbiAgICAgICAgZXhwZWN0KG5hbWVUYWcpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChuYW1lVGFnPy5WYWx1ZSkudG9Db250YWluKCdwcml2YXRlLXN1Ym5ldCcpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdSb3V0ZSBUYWJsZXMnLCAoKSA9PiB7XG4gICAgdGVzdCgnUHVibGljIHJvdXRlIHRhYmxlcyBzaG91bGQgcm91dGUgdG8gSW50ZXJuZXQgR2F0ZXdheScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHB1YmxpY1N1Ym5ldElkcyA9IG91dHB1dHMucHVibGljX3N1Ym5ldF9pZHM7XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVJvdXRlVGFibGVzQ29tbWFuZCh7XG4gICAgICAgIEZpbHRlcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAndnBjLWlkJyxcbiAgICAgICAgICAgIFZhbHVlczogW291dHB1dHMudnBjX2lkXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICdhc3NvY2lhdGlvbi5zdWJuZXQtaWQnLFxuICAgICAgICAgICAgVmFsdWVzOiBwdWJsaWNTdWJuZXRJZHMsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgICAgZXhwZWN0KHJlcy5Sb3V0ZVRhYmxlcz8ubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDEpO1xuXG4gICAgICByZXMuUm91dGVUYWJsZXM/LmZvckVhY2gocm91dGVUYWJsZSA9PiB7XG4gICAgICAgIGNvbnN0IGRlZmF1bHRSb3V0ZSA9IHJvdXRlVGFibGUuUm91dGVzPy5maW5kKHIgPT4gci5EZXN0aW5hdGlvbkNpZHJCbG9jayA9PT0gJzAuMC4wLjAvMCcpO1xuICAgICAgICBleHBlY3QoZGVmYXVsdFJvdXRlPy5HYXRld2F5SWQpLnRvTWF0Y2goL15pZ3ctLyk7XG4gICAgICAgIGV4cGVjdChkZWZhdWx0Um91dGU/LlN0YXRlKS50b0JlKCdhY3RpdmUnKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUHJpdmF0ZSByb3V0ZSB0YWJsZXMgc2hvdWxkIHJvdXRlIHRvIE5BVCBHYXRld2F5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcHJpdmF0ZVN1Ym5ldElkcyA9IG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVSb3V0ZVRhYmxlc0NvbW1hbmQoe1xuICAgICAgICBGaWx0ZXJzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgTmFtZTogJ3ZwYy1pZCcsXG4gICAgICAgICAgICBWYWx1ZXM6IFtvdXRwdXRzLnZwY19pZF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAnYXNzb2NpYXRpb24uc3VibmV0LWlkJyxcbiAgICAgICAgICAgIFZhbHVlczogcHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSkpO1xuXG4gICAgICBleHBlY3QocmVzLlJvdXRlVGFibGVzPy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbk9yRXF1YWwoMSk7XG5cbiAgICAgIHJlcy5Sb3V0ZVRhYmxlcz8uZm9yRWFjaChyb3V0ZVRhYmxlID0+IHtcbiAgICAgICAgY29uc3QgZGVmYXVsdFJvdXRlID0gcm91dGVUYWJsZS5Sb3V0ZXM/LmZpbmQociA9PiByLkRlc3RpbmF0aW9uQ2lkckJsb2NrID09PSAnMC4wLjAuMC8wJyk7XG4gICAgICAgIGV4cGVjdChkZWZhdWx0Um91dGU/Lk5hdEdhdGV3YXlJZCkudG9NYXRjaCgvXm5hdC0vKTtcbiAgICAgICAgZXhwZWN0KGRlZmF1bHRSb3V0ZT8uU3RhdGUpLnRvQmUoJ2FjdGl2ZScpO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdSb3V0ZSB0YWJsZXMgc2hvdWxkIGJlIHRhZ2dlZCBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVSb3V0ZVRhYmxlc0NvbW1hbmQoe1xuICAgICAgICBGaWx0ZXJzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgTmFtZTogJ3ZwYy1pZCcsXG4gICAgICAgICAgICBWYWx1ZXM6IFtvdXRwdXRzLnZwY19pZF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAndGFnOk1hbmFnZWRCeScsXG4gICAgICAgICAgICBWYWx1ZXM6IFsnVGVycmFmb3JtJ10sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgICAgZXhwZWN0KHJlcy5Sb3V0ZVRhYmxlcz8ubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgICBcbiAgICAgIHJlcy5Sb3V0ZVRhYmxlcz8uZm9yRWFjaChyb3V0ZVRhYmxlID0+IHtcbiAgICAgICAgY29uc3QgdGFncyA9IHJvdXRlVGFibGUuVGFncyB8fCBbXTtcbiAgICAgICAgY29uc3QgbWFuYWdlZEJ5VGFnID0gdGFncy5maW5kKHRhZyA9PiB0YWcuS2V5ID09PSAnTWFuYWdlZEJ5Jyk7XG4gICAgICAgIGV4cGVjdChtYW5hZ2VkQnlUYWc/LlZhbHVlKS50b0JlKCdUZXJyYWZvcm0nKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgnU2VjdXJpdHkgR3JvdXBzJywgKCkgPT4ge1xuICAgIHRlc3QoJ0FwcGxpY2F0aW9uIFNlY3VyaXR5IEdyb3VwIHNob3VsZCBleGlzdCB3aXRoIGNvcnJlY3QgY29uZmlndXJhdGlvbicsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHNnSWQgPSBvdXRwdXRzLmFwcF9zZWN1cml0eV9ncm91cF9pZDtcbiAgICAgIGV4cGVjdChzZ0lkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHNnSWQpLnRvTWF0Y2goL15zZy1bYS16MC05XSskLyk7XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVNlY3VyaXR5R3JvdXBzQ29tbWFuZCh7XG4gICAgICAgIEdyb3VwSWRzOiBbc2dJZF0sXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IHNnID0gcmVzLlNlY3VyaXR5R3JvdXBzPy5bMF07XG4gICAgICBleHBlY3Qoc2cpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc2c/LlZwY0lkKS50b0JlKG91dHB1dHMudnBjX2lkKTtcblxuICAgICAgLy8gU2hvdWxkIGhhdmUgb3V0Ym91bmQgcnVsZSBhbGxvd2luZyBhbGwgdHJhZmZpY1xuICAgICAgY29uc3QgZWdyZXNzUnVsZXMgPSBzZz8uSXBQZXJtaXNzaW9uc0VncmVzcztcbiAgICAgIGNvbnN0IGFsbE91dGJvdW5kUnVsZSA9IGVncmVzc1J1bGVzPy5maW5kKHIgPT5cbiAgICAgICAgci5JcFByb3RvY29sID09PSAnLTEnICYmXG4gICAgICAgIHIuSXBSYW5nZXM/LlswXT8uQ2lkcklwID09PSAnMC4wLjAuMC8wJ1xuICAgICAgKTtcbiAgICAgIGV4cGVjdChhbGxPdXRib3VuZFJ1bGUpLnRvQmVEZWZpbmVkKCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdSRFMgU2VjdXJpdHkgR3JvdXAgc2hvdWxkIGV4aXN0IHdpdGggY29ycmVjdCBydWxlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHNnSWQgPSBvdXRwdXRzLnJkc19zZWN1cml0eV9ncm91cF9pZDtcbiAgICAgIGV4cGVjdChzZ0lkKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHNnSWQpLnRvTWF0Y2goL15zZy1bYS16MC05XSskLyk7XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVNlY3VyaXR5R3JvdXBzQ29tbWFuZCh7XG4gICAgICAgIEdyb3VwSWRzOiBbc2dJZF0sXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IHNnID0gcmVzLlNlY3VyaXR5R3JvdXBzPy5bMF07XG4gICAgICBleHBlY3Qoc2cpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3Qoc2c/LlZwY0lkKS50b0JlKG91dHB1dHMudnBjX2lkKTtcblxuICAgICAgLy8gU2hvdWxkIGhhdmUgaW5ib3VuZCBydWxlIGZvciBNeVNRTCBmcm9tIGFwcCBzZWN1cml0eSBncm91cFxuICAgICAgY29uc3QgaW5ncmVzc1J1bGVzID0gc2c/LklwUGVybWlzc2lvbnM7XG4gICAgICBjb25zdCBteXNxbFJ1bGUgPSBpbmdyZXNzUnVsZXM/LmZpbmQociA9PlxuICAgICAgICByLkZyb21Qb3J0ID09PSAzMzA2ICYmXG4gICAgICAgIHIuVG9Qb3J0ID09PSAzMzA2ICYmXG4gICAgICAgIHIuSXBQcm90b2NvbCA9PT0gJ3RjcCdcbiAgICAgICk7XG4gICAgICBleHBlY3QobXlzcWxSdWxlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KG15c3FsUnVsZT8uVXNlcklkR3JvdXBQYWlycz8uWzBdPy5Hcm91cElkKS50b0JlKG91dHB1dHMuYXBwX3NlY3VyaXR5X2dyb3VwX2lkKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1NlY3VyaXR5IEdyb3VwcyBzaG91bGQgYmUgdGFnZ2VkIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHNnSWRzID0gW291dHB1dHMuYXBwX3NlY3VyaXR5X2dyb3VwX2lkLCBvdXRwdXRzLnJkc19zZWN1cml0eV9ncm91cF9pZF07XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVNlY3VyaXR5R3JvdXBzQ29tbWFuZCh7XG4gICAgICAgIEdyb3VwSWRzOiBzZ0lkcyxcbiAgICAgIH0pKTtcblxuICAgICAgcmVzLlNlY3VyaXR5R3JvdXBzPy5mb3JFYWNoKHNnID0+IHtcbiAgICAgICAgY29uc3QgdGFncyA9IHNnLlRhZ3MgfHwgW107XG4gICAgICAgIGNvbnN0IG1hbmFnZWRCeVRhZyA9IHRhZ3MuZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ01hbmFnZWRCeScpO1xuICAgICAgICBleHBlY3QobWFuYWdlZEJ5VGFnPy5WYWx1ZSkudG9CZSgnVGVycmFmb3JtJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1JEUyBEYXRhYmFzZScsICgpID0+IHtcbiAgICB0ZXN0KCdSRFMgTXlTUUwgaW5zdGFuY2Ugc2hvdWxkIGV4aXN0IGFuZCBiZSBhdmFpbGFibGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZHNFbmRwb2ludCA9IG91dHB1dHMucmRzX2VuZHBvaW50O1xuICAgICAgZXhwZWN0KHJkc0VuZHBvaW50KS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJkc0VuZHBvaW50KS50b01hdGNoKC9cXC5yZHNcXC5hbWF6b25hd3NcXC5jb20oOlxcZCspPyQvKTtcblxuICAgICAgLy8gRXh0cmFjdCBEQiBpZGVudGlmaWVyIGZyb20gZW5kcG9pbnRcbiAgICAgIGNvbnN0IGRiSWRlbnRpZmllciA9IHJkc0VuZHBvaW50LnNwbGl0KCcuJylbMF07XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJkcy5zZW5kKG5ldyBEZXNjcmliZURCSW5zdGFuY2VzQ29tbWFuZCh7XG4gICAgICAgIERCSW5zdGFuY2VJZGVudGlmaWVyOiBkYklkZW50aWZpZXIsXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IGRiSW5zdGFuY2UgPSByZXMuREJJbnN0YW5jZXM/LlswXTtcbiAgICAgIGV4cGVjdChkYkluc3RhbmNlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGRiSW5zdGFuY2U/LkRCSW5zdGFuY2VTdGF0dXMpLnRvQmUoJ2F2YWlsYWJsZScpO1xuICAgICAgZXhwZWN0KGRiSW5zdGFuY2U/LkVuZ2luZSkudG9CZSgnbXlzcWwnKTtcbiAgICAgIGV4cGVjdChkYkluc3RhbmNlPy5TdG9yYWdlRW5jcnlwdGVkKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KGRiSW5zdGFuY2U/LlB1YmxpY2x5QWNjZXNzaWJsZSkudG9CZShmYWxzZSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdSRFMgaW5zdGFuY2Ugc2hvdWxkIGhhdmUgY29ycmVjdCBuZXR3b3JrIGNvbmZpZ3VyYXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZHNFbmRwb2ludCA9IG91dHB1dHMucmRzX2VuZHBvaW50O1xuICAgICAgY29uc3QgZGJJZGVudGlmaWVyID0gcmRzRW5kcG9pbnQuc3BsaXQoJy4nKVswXTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmRzLnNlbmQobmV3IERlc2NyaWJlREJJbnN0YW5jZXNDb21tYW5kKHtcbiAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGRiSWRlbnRpZmllcixcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgZGJJbnN0YW5jZSA9IHJlcy5EQkluc3RhbmNlcz8uWzBdO1xuICAgICAgZXhwZWN0KGRiSW5zdGFuY2U/LlZwY1NlY3VyaXR5R3JvdXBzPy5bMF0/LlZwY1NlY3VyaXR5R3JvdXBJZCkudG9CZShvdXRwdXRzLnJkc19zZWN1cml0eV9ncm91cF9pZCk7XG4gICAgICBleHBlY3QoZGJJbnN0YW5jZT8uVnBjU2VjdXJpdHlHcm91cHM/LlswXT8uU3RhdHVzKS50b0JlKCdhY3RpdmUnKTtcblxuICAgICAgLy8gU2hvdWxkIGJlIGluIHByaXZhdGUgc3VibmV0c1xuICAgICAgY29uc3QgZGJTdWJuZXRHcm91cCA9IGRiSW5zdGFuY2U/LkRCU3VibmV0R3JvdXA7XG4gICAgICBleHBlY3QoZGJTdWJuZXRHcm91cCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChkYlN1Ym5ldEdyb3VwPy5WcGNJZCkudG9CZShvdXRwdXRzLnZwY19pZCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdSRFMgc3VibmV0IGdyb3VwIHNob3VsZCBleGlzdCB3aXRoIGNvcnJlY3Qgc3VibmV0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJkc0VuZHBvaW50ID0gb3V0cHV0cy5yZHNfZW5kcG9pbnQ7XG4gICAgICBjb25zdCBkYklkZW50aWZpZXIgPSByZHNFbmRwb2ludC5zcGxpdCgnLicpWzBdO1xuXG4gICAgICBjb25zdCBkYlJlcyA9IGF3YWl0IHJkcy5zZW5kKG5ldyBEZXNjcmliZURCSW5zdGFuY2VzQ29tbWFuZCh7XG4gICAgICAgIERCSW5zdGFuY2VJZGVudGlmaWVyOiBkYklkZW50aWZpZXIsXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IHN1Ym5ldEdyb3VwTmFtZSA9IGRiUmVzLkRCSW5zdGFuY2VzPy5bMF0/LkRCU3VibmV0R3JvdXA/LkRCU3VibmV0R3JvdXBOYW1lO1xuICAgICAgZXhwZWN0KHN1Ym5ldEdyb3VwTmFtZSkudG9CZURlZmluZWQoKTtcblxuICAgICAgY29uc3Qgc3VibmV0UmVzID0gYXdhaXQgcmRzLnNlbmQobmV3IERlc2NyaWJlREJTdWJuZXRHcm91cHNDb21tYW5kKHtcbiAgICAgICAgREJTdWJuZXRHcm91cE5hbWU6IHN1Ym5ldEdyb3VwTmFtZSxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3Qgc3VibmV0R3JvdXAgPSBzdWJuZXRSZXMuREJTdWJuZXRHcm91cHM/LlswXTtcbiAgICAgIGV4cGVjdChzdWJuZXRHcm91cCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChzdWJuZXRHcm91cD8uVnBjSWQpLnRvQmUob3V0cHV0cy52cGNfaWQpO1xuXG4gICAgICBjb25zdCBzdWJuZXRJZHMgPSBzdWJuZXRHcm91cD8uU3VibmV0cz8ubWFwKHMgPT4gcy5TdWJuZXRJZGVudGlmaWVyKS5zb3J0KCk7XG4gICAgICBjb25zdCBleHBlY3RlZFN1Ym5ldElkcyA9IG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzLnNvcnQoKTtcbiAgICAgIGV4cGVjdChzdWJuZXRJZHMpLnRvRXF1YWwoZXhwZWN0ZWRTdWJuZXRJZHMpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUkRTIGluc3RhbmNlIHNob3VsZCBoYXZlIGNvcnJlY3QgYmFja3VwIGNvbmZpZ3VyYXRpb24nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZHNFbmRwb2ludCA9IG91dHB1dHMucmRzX2VuZHBvaW50O1xuICAgICAgY29uc3QgZGJJZGVudGlmaWVyID0gcmRzRW5kcG9pbnQuc3BsaXQoJy4nKVswXTtcblxuICAgICAgY29uc3QgcmVzID0gYXdhaXQgcmRzLnNlbmQobmV3IERlc2NyaWJlREJJbnN0YW5jZXNDb21tYW5kKHtcbiAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGRiSWRlbnRpZmllcixcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgZGJJbnN0YW5jZSA9IHJlcy5EQkluc3RhbmNlcz8uWzBdO1xuICAgICAgZXhwZWN0KGRiSW5zdGFuY2U/LkJhY2t1cFJldGVudGlvblBlcmlvZCkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCg3KTtcbiAgICAgIGV4cGVjdChkYkluc3RhbmNlPy5QcmVmZXJyZWRCYWNrdXBXaW5kb3cpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZGJJbnN0YW5jZT8uUHJlZmVycmVkTWFpbnRlbmFuY2VXaW5kb3cpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QoZGJJbnN0YW5jZT8uQ29weVRhZ3NUb1NuYXBzaG90KS50b0JlKHRydWUpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnUkRTIGluc3RhbmNlIHNob3VsZCBoYXZlIENsb3VkV2F0Y2ggbG9ncyBlbmFibGVkJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmRzRW5kcG9pbnQgPSBvdXRwdXRzLnJkc19lbmRwb2ludDtcbiAgICAgIGNvbnN0IGRiSWRlbnRpZmllciA9IHJkc0VuZHBvaW50LnNwbGl0KCcuJylbMF07XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IHJkcy5zZW5kKG5ldyBEZXNjcmliZURCSW5zdGFuY2VzQ29tbWFuZCh7XG4gICAgICAgIERCSW5zdGFuY2VJZGVudGlmaWVyOiBkYklkZW50aWZpZXIsXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IGRiSW5zdGFuY2UgPSByZXMuREJJbnN0YW5jZXM/LlswXTtcbiAgICAgIGNvbnN0IGVuYWJsZWRMb2dzID0gZGJJbnN0YW5jZT8uRW5hYmxlZENsb3Vkd2F0Y2hMb2dzRXhwb3J0cyB8fCBbXTtcbiAgICAgIGV4cGVjdChlbmFibGVkTG9ncykudG9Db250YWluKCdlcnJvcicpO1xuICAgICAgZXhwZWN0KGVuYWJsZWRMb2dzKS50b0NvbnRhaW4oJ2dlbmVyYWwnKTtcbiAgICAgIGV4cGVjdChlbmFibGVkTG9ncykudG9Db250YWluKCdzbG93cXVlcnknKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ1JEUyBpbnN0YW5jZSBzaG91bGQgYmUgdGFnZ2VkIGNvcnJlY3RseScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJkc0VuZHBvaW50ID0gb3V0cHV0cy5yZHNfZW5kcG9pbnQ7XG4gICAgICBjb25zdCBkYklkZW50aWZpZXIgPSByZHNFbmRwb2ludC5zcGxpdCgnLicpWzBdO1xuXG4gICAgICBjb25zdCByZXMgPSBhd2FpdCByZHMuc2VuZChuZXcgRGVzY3JpYmVEQkluc3RhbmNlc0NvbW1hbmQoe1xuICAgICAgICBEQkluc3RhbmNlSWRlbnRpZmllcjogZGJJZGVudGlmaWVyLFxuICAgICAgfSkpO1xuXG4gICAgICBjb25zdCBkYkluc3RhbmNlID0gcmVzLkRCSW5zdGFuY2VzPy5bMF07XG4gICAgICBjb25zdCB0YWdzID0gZGJJbnN0YW5jZT8uVGFnTGlzdCB8fCBbXTtcblxuICAgICAgY29uc3QgbmFtZVRhZyA9IHRhZ3MuZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ05hbWUnKTtcbiAgICAgIGV4cGVjdChuYW1lVGFnKS50b0JlRGVmaW5lZCgpO1xuXG4gICAgICBjb25zdCBtYW5hZ2VkQnlUYWcgPSB0YWdzLmZpbmQodGFnID0+IHRhZy5LZXkgPT09ICdNYW5hZ2VkQnknKTtcbiAgICAgIGV4cGVjdChtYW5hZ2VkQnlUYWc/LlZhbHVlKS50b0JlKCdUZXJyYWZvcm0nKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ1Jlc291cmNlIFRhZ2dpbmcgQ29uc2lzdGVuY3knLCAoKSA9PiB7XG4gICAgdGVzdCgnQWxsIG1ham9yIHJlc291cmNlcyBzaG91bGQgaGF2ZSBjb25zaXN0ZW50IHRhZ2dpbmcnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBDaGVjayBWUENcbiAgICAgIGNvbnN0IHZwY1JlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVZwY3NDb21tYW5kKHsgVnBjSWRzOiBbb3V0cHV0cy52cGNfaWRdIH0pKTtcbiAgICAgIGNvbnN0IHZwY1RhZ3MgPSB2cGNSZXMuVnBjcz8uWzBdPy5UYWdzIHx8IFtdO1xuXG4gICAgICAvLyBDaGVjayBTZWN1cml0eSBHcm91cHNcbiAgICAgIGNvbnN0IHNnUmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU2VjdXJpdHlHcm91cHNDb21tYW5kKHtcbiAgICAgICAgR3JvdXBJZHM6IFtvdXRwdXRzLmFwcF9zZWN1cml0eV9ncm91cF9pZCwgb3V0cHV0cy5yZHNfc2VjdXJpdHlfZ3JvdXBfaWRdLFxuICAgICAgfSkpO1xuXG4gICAgICAvLyBDaGVjayBTdWJuZXRzXG4gICAgICBjb25zdCBzdWJuZXRSZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVTdWJuZXRzQ29tbWFuZCh7XG4gICAgICAgIFN1Ym5ldElkczogWy4uLm91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMsIC4uLm91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzXSxcbiAgICAgIH0pKTtcblxuICAgICAgLy8gQWxsIHJlc291cmNlcyBzaG91bGQgaGF2ZSBNYW5hZ2VkQnkgPSBUZXJyYWZvcm1cbiAgICAgIFt2cGNUYWdzLCAuLi5zZ1Jlcy5TZWN1cml0eUdyb3Vwcz8ubWFwKHNnID0+IHNnLlRhZ3MpIHx8IFtdLCAuLi5zdWJuZXRSZXMuU3VibmV0cz8ubWFwKHMgPT4gcy5UYWdzKSB8fCBbXV0uZm9yRWFjaCh0YWdzID0+IHtcbiAgICAgICAgY29uc3QgbWFuYWdlZEJ5VGFnID0gdGFncz8uZmluZCh0YWcgPT4gdGFnLktleSA9PT0gJ01hbmFnZWRCeScpO1xuICAgICAgICBleHBlY3QobWFuYWdlZEJ5VGFnPy5WYWx1ZSkudG9CZSgnVGVycmFmb3JtJyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ091dHB1dCBWYWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIHRlc3QoJ0FsbCByZXF1aXJlZCBvdXRwdXRzIHNob3VsZCBiZSBwcmVzZW50IGFuZCB2YWxpZCcsICgpID0+IHtcbiAgICAgIGNvbnN0IHJlcXVpcmVkT3V0cHV0cyA9IFtcbiAgICAgICAgJ3ZwY19pZCcsXG4gICAgICAgICdwdWJsaWNfc3VibmV0X2lkcycsXG4gICAgICAgICdwcml2YXRlX3N1Ym5ldF9pZHMnLFxuICAgICAgICAnYXBwX3NlY3VyaXR5X2dyb3VwX2lkJyxcbiAgICAgICAgJ3Jkc19zZWN1cml0eV9ncm91cF9pZCcsXG4gICAgICAgICdyZHNfZW5kcG9pbnQnLFxuICAgICAgICAncmRzX3BvcnQnLFxuICAgICAgXTtcblxuICAgICAgcmVxdWlyZWRPdXRwdXRzLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgZXhwZWN0KG91dHB1dHNba2V5XSkudG9CZURlZmluZWQoKTtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KG91dHB1dHNba2V5XSkpIHtcbiAgICAgICAgICBleHBlY3Qob3V0cHV0c1trZXldKS5ub3QudG9CZSgnJyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnT3V0cHV0IHZhbHVlcyBzaG91bGQgaGF2ZSBjb3JyZWN0IEFXUyByZXNvdXJjZSBJRCBmb3JtYXQnLCAoKSA9PiB7XG4gICAgICBleHBlY3Qob3V0cHV0cy52cGNfaWQpLnRvTWF0Y2goL152cGMtW2EtejAtOV0rJC8pO1xuICAgICAgZXhwZWN0KG91dHB1dHMuYXBwX3NlY3VyaXR5X2dyb3VwX2lkKS50b01hdGNoKC9ec2ctW2EtejAtOV0rJC8pO1xuICAgICAgZXhwZWN0KG91dHB1dHMucmRzX3NlY3VyaXR5X2dyb3VwX2lkKS50b01hdGNoKC9ec2ctW2EtejAtOV0rJC8pO1xuICAgICAgZXhwZWN0KG91dHB1dHMucmRzX2VuZHBvaW50KS50b01hdGNoKC9cXC5yZHNcXC5hbWF6b25hd3NcXC5jb20oOlxcZCspPyQvKTtcblxuICAgICAgLy8gQ2hlY2sgc3VibmV0IElEc1xuICAgICAgb3V0cHV0cy5wdWJsaWNfc3VibmV0X2lkcy5mb3JFYWNoKChpZDogc3RyaW5nKSA9PiB7XG4gICAgICAgIGV4cGVjdChpZCkudG9NYXRjaCgvXnN1Ym5ldC1bYS16MC05XSskLyk7XG4gICAgICB9KTtcblxuICAgICAgb3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHMuZm9yRWFjaCgoaWQ6IHN0cmluZykgPT4ge1xuICAgICAgICBleHBlY3QoaWQpLnRvTWF0Y2goL15zdWJuZXQtW2EtejAtOV0rJC8pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdTdWJuZXQgYXJyYXlzIHNob3VsZCBoYXZlIGV4cGVjdGVkIGNvdW50cycsICgpID0+IHtcbiAgICAgIGV4cGVjdChBcnJheS5pc0FycmF5KG91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KEFycmF5LmlzQXJyYXkob3V0cHV0cy5wcml2YXRlX3N1Ym5ldF9pZHMpKS50b0JlKHRydWUpO1xuICAgICAgZXhwZWN0KG91dHB1dHMucHVibGljX3N1Ym5ldF9pZHMubGVuZ3RoKS50b0JlKDIpO1xuICAgICAgZXhwZWN0KG91dHB1dHMucHJpdmF0ZV9zdWJuZXRfaWRzLmxlbmd0aCkudG9CZSgyKTtcbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0luZnJhc3RydWN0dXJlIEhlYWx0aCBhbmQgQ29ubmVjdGl2aXR5JywgKCkgPT4ge1xuICAgIHRlc3QoJ0FsbCBhdmFpbGFiaWxpdHkgem9uZXMgc2hvdWxkIGJlIGRpZmZlcmVudCBmb3IgcmVkdW5kYW5jeScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGFsbFN1Ym5ldElkcyA9IFsuLi5vdXRwdXRzLnB1YmxpY19zdWJuZXRfaWRzLCAuLi5vdXRwdXRzLnByaXZhdGVfc3VibmV0X2lkc107XG5cbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGVjMi5zZW5kKG5ldyBEZXNjcmliZVN1Ym5ldHNDb21tYW5kKHtcbiAgICAgICAgU3VibmV0SWRzOiBhbGxTdWJuZXRJZHMsXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IGF6cyA9IHJlcy5TdWJuZXRzPy5tYXAocyA9PiBzLkF2YWlsYWJpbGl0eVpvbmUpO1xuICAgICAgY29uc3QgdW5pcXVlQXpzID0gbmV3IFNldChhenMpO1xuXG4gICAgICAvLyBTaG91bGQgaGF2ZSBhdCBsZWFzdCAyIGRpZmZlcmVudCBBWnMgZm9yIHJlZHVuZGFuY3lcbiAgICAgIGV4cGVjdCh1bmlxdWVBenMuc2l6ZSkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgyKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ05BVCBHYXRld2F5IHNob3VsZCBoYXZlIEVsYXN0aWMgSVAgYXNzaWduZWQnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXMgPSBhd2FpdCBlYzIuc2VuZChuZXcgRGVzY3JpYmVOYXRHYXRld2F5c0NvbW1hbmQoe1xuICAgICAgICBGaWx0ZXI6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBOYW1lOiAndnBjLWlkJyxcbiAgICAgICAgICAgIFZhbHVlczogW291dHB1dHMudnBjX2lkXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIE5hbWU6ICdzdGF0ZScsXG4gICAgICAgICAgICBWYWx1ZXM6IFsnYXZhaWxhYmxlJ10sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pKTtcblxuICAgICAgY29uc3QgbmF0R2F0ZXdheSA9IHJlcy5OYXRHYXRld2F5cz8uWzBdO1xuICAgICAgZXhwZWN0KG5hdEdhdGV3YXk/Lk5hdEdhdGV3YXlBZGRyZXNzZXM/Lmxlbmd0aCkudG9CZUdyZWF0ZXJUaGFuT3JFcXVhbCgxKTtcblxuICAgICAgY29uc3QgYWRkcmVzcyA9IG5hdEdhdGV3YXk/Lk5hdEdhdGV3YXlBZGRyZXNzZXM/LlswXTtcbiAgICAgIGV4cGVjdChhZGRyZXNzPy5QdWJsaWNJcCkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChhZGRyZXNzPy5BbGxvY2F0aW9uSWQpLnRvTWF0Y2goL15laXBhbGxvYy0vKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ0RhdGFiYXNlIHNob3VsZCBiZSBhY2Nlc3NpYmxlIGZyb20gYXBwbGljYXRpb24gc2VjdXJpdHkgZ3JvdXAnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBUaGlzIHRlc3QgdmVyaWZpZXMgdGhlIHNlY3VyaXR5IGdyb3VwIHJ1bGVzIGFsbG93IGNvbm5lY3Rpdml0eVxuICAgICAgY29uc3QgcmRzUmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU2VjdXJpdHlHcm91cHNDb21tYW5kKHtcbiAgICAgICAgR3JvdXBJZHM6IFtvdXRwdXRzLnJkc19zZWN1cml0eV9ncm91cF9pZF0sXG4gICAgICB9KSk7XG5cbiAgICAgIGNvbnN0IHJkc1NnID0gcmRzUmVzLlNlY3VyaXR5R3JvdXBzPy5bMF07XG4gICAgICBjb25zdCBteXNxbFJ1bGUgPSByZHNTZz8uSXBQZXJtaXNzaW9ucz8uZmluZChyID0+XG4gICAgICAgIHIuRnJvbVBvcnQgPT09IDMzMDYgJiYgci5Ub1BvcnQgPT09IDMzMDZcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChteXNxbFJ1bGU/LlVzZXJJZEdyb3VwUGFpcnM/LlswXT8uR3JvdXBJZCkudG9CZShvdXRwdXRzLmFwcF9zZWN1cml0eV9ncm91cF9pZCk7XG5cbiAgICAgIC8vIFZlcmlmeSB0aGUgYXBwIHNlY3VyaXR5IGdyb3VwIGV4aXN0c1xuICAgICAgY29uc3QgYXBwUmVzID0gYXdhaXQgZWMyLnNlbmQobmV3IERlc2NyaWJlU2VjdXJpdHlHcm91cHNDb21tYW5kKHtcbiAgICAgICAgR3JvdXBJZHM6IFtvdXRwdXRzLmFwcF9zZWN1cml0eV9ncm91cF9pZF0sXG4gICAgICB9KSk7XG5cbiAgICAgIGV4cGVjdChhcHBSZXMuU2VjdXJpdHlHcm91cHM/LlswXSkudG9CZURlZmluZWQoKTtcbiAgICB9KTtcbiAgfSk7XG59KTsiXX0=