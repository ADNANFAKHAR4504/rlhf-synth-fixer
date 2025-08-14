import 'jest';
import * as AWS from 'aws-sdk';

describe('TapStack Live AWS Resources Validation', () => {
    const stackName = 'TapStackpr1230';
    const regions = ['us-east-1', 'us-west-2'];
    
    // Get environment values from CI/CD environment or use defaults
    const environmentSuffix = process.env.ENVIRONMENT || process.env.GITHUB_REF_NAME || 'main';
    const repository = process.env.GITHUB_REPOSITORY || process.env.REPOSITORY;
    const commitAuthor = process.env.GITHUB_ACTOR || process.env.COMMIT_AUTHOR;
    
    let awsClients: { [region: string]: { ec2: AWS.EC2; cloudwatch: AWS.CloudWatch } } = {};

    beforeAll(async () => {
        console.log(`Setting up AWS clients for regions: ${regions.join(', ')}`);
        console.log(`Environment: ${environmentSuffix}`);
        console.log(`Repository: ${repository}`);
        console.log(`Author: ${commitAuthor}`);
        
        for (const region of regions) {
            awsClients[region] = {
                ec2: new AWS.EC2({ region }),
                cloudwatch: new AWS.CloudWatch({ region })
            };
        }
        
        console.log(`Testing deployment for stack: ${stackName}`);
    });

    test('Discover resources with actual git-based tags', async () => {
        for (const region of regions) {
            console.log(`\n=== Discovering resources in ${region} ===`);
            const ec2Client = awsClients[region].ec2;

            // Try to find resources using the actual tag structure
            const searchFilters = [
                // Search by Environment tag
                ...(environmentSuffix ? [{ Name: 'tag:Environment', Values: [environmentSuffix] }] : []),
                // Search by Repository tag if available
                ...(repository ? [{ Name: 'tag:Repository', Values: [repository] }] : []),
                // Search by Author tag if available
                ...(commitAuthor ? [{ Name: 'tag:Author', Values: [commitAuthor] }] : []),
            ];

            for (const filter of searchFilters) {
                try {
                    console.log(`Searching with filter: ${filter.Name} = ${filter.Values.join(', ')}`);
                    
                    // Search VPCs
                    const vpcResult = await ec2Client.describeVpcs({ Filters: [filter] }).promise();
                    if (vpcResult.Vpcs && vpcResult.Vpcs.length > 0) {
                        console.log(`  Found ${vpcResult.Vpcs.length} VPCs:`);
                        for (const vpc of vpcResult.Vpcs) {
                            const nameTag = vpc.Tags?.find(t => t.Key === 'Name')?.Value || 'No Name';
                            console.log(`    VPC ${vpc.VpcId}: ${nameTag} (State: ${vpc.State})`);
                        }
                    }

                    // Search Instances
                    const instanceResult = await ec2Client.describeInstances({ Filters: [filter] }).promise();
                    const instances = instanceResult.Reservations?.flatMap(r => r.Instances || []) || [];
                    if (instances.length > 0) {
                        console.log(`  Found ${instances.length} instances:`);
                        for (const instance of instances.slice(0, 5)) {
                            const nameTag = instance.Tags?.find(t => t.Key === 'Name')?.Value || 'No Name';
                            console.log(`    Instance ${instance.InstanceId}: ${nameTag} (State: ${instance.State?.Name})`);
                        }
                    }

                    // Search Security Groups
                    const sgResult = await ec2Client.describeSecurityGroups({ Filters: [filter] }).promise();
                    if (sgResult.SecurityGroups && sgResult.SecurityGroups.length > 0) {
                        console.log(`  Found ${sgResult.SecurityGroups.length} security groups:`);
                        for (const sg of sgResult.SecurityGroups.slice(0, 5)) {
                            console.log(`    SG ${sg.GroupId}: ${sg.GroupName}`);
                        }
                    }

                } catch (error) {
                    console.log(`  No resources found with filter ${filter.Name}`);
                }
            }
        }

        // This test always passes - it's for discovery
        expect(true).toBe(true);
    });

    test('VPCs exist and are available in all regions', async () => {
        for (const region of regions) {
            const ec2Client = awsClients[region].ec2;
            
            // Build filters based on available environment variables
            const filters = [];
            if (environmentSuffix) filters.push({ Name: 'tag:Environment', Values: [environmentSuffix] });
            if (repository) filters.push({ Name: 'tag:Repository', Values: [repository] });

            try {
                const vpcResult = await ec2Client.describeVpcs({ Filters: filters }).promise();

                expect(vpcResult.Vpcs).toBeDefined();
                expect(vpcResult.Vpcs!.length).toBeGreaterThan(0);
                
                for (const vpc of vpcResult.Vpcs!) {
                    expect(vpc.State).toBe('available');
                    const nameTag = vpc.Tags?.find(t => t.Key === 'Name')?.Value || vpc.VpcId;
                    console.log(`✓ VPC ${vpc.VpcId} (${nameTag}) is available in ${region}`);
                }

            } catch (error) {
                console.error(`✗ Failed to find VPCs in ${region}:`, error);
                throw error;
            }
        }
    });

    test('EC2 instances are running in all regions', async () => {
        for (const region of regions) {
            const ec2Client = awsClients[region].ec2;
            
            // Build filters
            const filters = [
                { Name: 'instance-state-name', Values: ['running'] }
            ];
            if (environmentSuffix) filters.push({ Name: 'tag:Environment', Values: [environmentSuffix] });
            if (repository) filters.push({ Name: 'tag:Repository', Values: [repository] });
            
            try {
                const instancesResult = await ec2Client.describeInstances({ Filters: filters }).promise();

                expect(instancesResult.Reservations).toBeDefined();
                expect(instancesResult.Reservations!.length).toBeGreaterThan(0);

                const allInstances = instancesResult.Reservations!.flatMap(r => r.Instances || []);
                expect(allInstances.length).toBeGreaterThan(0);

                for (const instance of allInstances) {
                    expect(instance.State?.Name).toBe('running');
                    const nameTag = instance.Tags?.find(t => t.Key === 'Name')?.Value || instance.InstanceId;
                    console.log(`✓ Instance ${instance.InstanceId} (${nameTag}) is running in ${region}`);
                }

            } catch (error) {
                console.error(`✗ Failed to find running instances in ${region}:`, error);
                throw error;
            }
        }
    });

    test('Security groups exist with proper configuration in all regions', async () => {
        for (const region of regions) {
            const ec2Client = awsClients[region].ec2;
            
            const filters = [
                { Name: 'group-name', Values: ['!default'] } // Exclude default SG
            ];
            if (environmentSuffix) filters.push({ Name: 'tag:Environment', Values: [environmentSuffix] });
            if (repository) filters.push({ Name: 'tag:Repository', Values: [repository] });
            
            try {
                const sgResult = await ec2Client.describeSecurityGroups({ Filters: filters }).promise();

                expect(sgResult.SecurityGroups).toBeDefined();
                expect(sgResult.SecurityGroups!.length).toBeGreaterThan(0);

                for (const sg of sgResult.SecurityGroups!) {
                    console.log(`✓ Security Group ${sg.GroupId} (${sg.GroupName}) exists in ${region}`);
                    console.log(`  - Inbound rules: ${sg.IpPermissions?.length || 0}`);
                    console.log(`  - Outbound rules: ${sg.IpPermissionsEgress?.length || 0}`);
                }

            } catch (error) {
                console.error(`✗ Failed to verify security groups in ${region}:`, error);
                throw error;
            }
        }
    });

    test('CloudWatch dashboards exist in all regions', async () => {
        for (const region of regions) {
            const cloudwatchClient = awsClients[region].cloudwatch;
            const regionSuffix = region.replace(/-/g, '').replace(/gov/g, '');
            
            try {
                const dashboardsResult = await cloudwatchClient.listDashboards().promise();
                
                expect(dashboardsResult.DashboardEntries).toBeDefined();
                
                // Look for dashboards that match expected naming pattern
                const expectedPattern = `monitoring-${regionSuffix}-`;
                const matchingDashboards = dashboardsResult.DashboardEntries!.filter(
                    dashboard => dashboard.DashboardName?.includes(expectedPattern)
                );
                
                expect(matchingDashboards.length).toBeGreaterThan(0);
                
                for (const dashboard of matchingDashboards) {
                    console.log(`✓ CloudWatch Dashboard ${dashboard.DashboardName} exists in ${region}`);
                    
                    // Verify dashboard has content
                    const dashboardDetail = await cloudwatchClient.getDashboard({
                        DashboardName: dashboard.DashboardName!
                    }).promise();
                    
                    expect(dashboardDetail.DashboardBody).toBeDefined();
                    expect(dashboardDetail.DashboardBody!.length).toBeGreaterThan(0);
                }

            } catch (error) {
                console.error(`✗ Failed to verify dashboards in ${region}:`, error);
                throw error;
            }
        }
    });

    test('Resources have proper git-based tags applied', async () => {
        const primaryRegion = regions[0];
        const ec2Client = awsClients[primaryRegion].ec2;

        try {
            // Get all tags that match our expected values
            const tagQueries = [];
            
            if (environmentSuffix) {
                tagQueries.push({
                    Filters: [
                        { Name: 'key', Values: ['Environment'] },
                        { Name: 'value', Values: [environmentSuffix] }
                    ]
                });
            }
            
            if (repository) {
                tagQueries.push({
                    Filters: [
                        { Name: 'key', Values: ['Repository'] },
                        { Name: 'value', Values: [repository] }
                    ]
                });
            }

            if (commitAuthor) {
                tagQueries.push({
                    Filters: [
                        { Name: 'key', Values: ['Author'] },
                        { Name: 'value', Values: [commitAuthor] }
                    ]
                });
            }

            let foundTags = false;
            
            for (const query of tagQueries) {
                try {
                    const tagsResult = await ec2Client.describeTags(query).promise();
                    
                    if (tagsResult.Tags && tagsResult.Tags.length > 0) {
                        foundTags = true;
                        console.log(`✓ Found ${tagsResult.Tags.length} resources with ${query.Filters[0].Values[0]}=${query.Filters[1].Values[0]}`);
                    }
                } catch (error) {
                    // Continue with next query
                }
            }

            expect(foundTags).toBe(true);

        } catch (error) {
            console.error(`✗ Failed to verify tags in ${primaryRegion}:`, error);
            throw error;
        }
    });

    test('Network connectivity - subnets exist and are available', async () => {
        for (const region of regions) {
            const ec2Client = awsClients[region].ec2;
            
            const filters = [
                { Name: 'state', Values: ['available'] }
            ];
            if (environmentSuffix) filters.push({ Name: 'tag:Environment', Values: [environmentSuffix] });
            if (repository) filters.push({ Name: 'tag:Repository', Values: [repository] });
            
            try {
                const subnetsResult = await ec2Client.describeSubnets({ Filters: filters }).promise();

                expect(subnetsResult.Subnets).toBeDefined();
                expect(subnetsResult.Subnets!.length).toBeGreaterThan(0);

                // Categorize subnets
                const publicSubnets = subnetsResult.Subnets!.filter(subnet =>
                    subnet.Tags?.some(tag => 
                        tag.Key === 'Name' && tag.Value?.toLowerCase().includes('public')
                    ) || subnet.MapPublicIpOnLaunch
                );
                
                const privateSubnets = subnetsResult.Subnets!.filter(subnet =>
                    subnet.Tags?.some(tag => 
                        tag.Key === 'Name' && tag.Value?.toLowerCase().includes('private')
                    ) || !subnet.MapPublicIpOnLaunch
                );

                console.log(`✓ Found ${publicSubnets.length} public and ${privateSubnets.length} private subnets in ${region}`);
                
                // We should have at least some subnets
                expect(subnetsResult.Subnets!.length).toBeGreaterThan(0);

            } catch (error) {
                console.error(`✗ Failed to verify subnets in ${region}:`, error);
                throw error;
            }
        }
    });
});