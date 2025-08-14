import 'jest';
import * as AWS from 'aws-sdk';

describe('TapStack Live AWS Resources Validation', () => {
    const stackName = 'TapStackpr1230';
    const environmentSuffix = 'prod'; // or get from env var
    const regions = ['us-east-1', 'us-west-2']; // or get from env vars
    
    let awsClients: { [region: string]: { ec2: AWS.EC2; cloudwatch: AWS.CloudWatch } } = {};

    beforeAll(async () => {
        console.log(`Setting up AWS clients for regions: ${regions.join(', ')}`);
        
        // Initialize AWS clients for each region
        for (const region of regions) {
            awsClients[region] = {
                ec2: new AWS.EC2({ region }),
                cloudwatch: new AWS.CloudWatch({ region })
            };
        }
        
        console.log(`Testing deployment for stack: ${stackName}`);
    });

    test('VPCs exist and are available in all regions', async () => {
        for (const region of regions) {
            const ec2Client = awsClients[region].ec2;
            const regionSuffix = region.replace(/-/g, '').replace(/gov/g, '');
            
            // Expected VPC name based on your naming pattern
            const expectedVpcName = `network-${regionSuffix}-${environmentSuffix}-vpc`;
            
            try {
                const vpcResult = await ec2Client.describeVpcs({
                    Filters: [
                        {
                            Name: 'tag:Name',
                            Values: [expectedVpcName]
                        },
                        {
                            Name: 'tag:ManagedBy',
                            Values: ['Pulumi']
                        },
                        {
                            Name: 'tag:Environment',
                            Values: [environmentSuffix]
                        }
                    ]
                }).promise();

                expect(vpcResult.Vpcs).toBeDefined();
                expect(vpcResult.Vpcs!.length).toBeGreaterThan(0);
                
                const vpc = vpcResult.Vpcs![0];
                expect(vpc.State).toBe('available');

                console.log(`✓ VPC ${vpc.VpcId} (${expectedVpcName}) is available in ${region}`);

            } catch (error) {
                console.error(`✗ Failed to find VPC in ${region}:`, error);
                throw error;
            }
        }
    });

    test('EC2 instances are running in all regions', async () => {
        for (const region of regions) {
            const ec2Client = awsClients[region].ec2;
            const regionSuffix = region.replace(/-/g, '').replace(/gov/g, '');
            
            try {
                const instancesResult = await ec2Client.describeInstances({
                    Filters: [
                        {
                            Name: 'tag:ManagedBy',
                            Values: ['Pulumi']
                        },
                        {
                            Name: 'tag:Environment',
                            Values: [environmentSuffix]
                        },
                        {
                            Name: 'tag:Project',
                            Values: ['Pulumi-Tap-Stack']
                        },
                        {
                            Name: 'instance-state-name',
                            Values: ['running']
                        }
                    ]
                }).promise();

                expect(instancesResult.Reservations).toBeDefined();
                expect(instancesResult.Reservations!.length).toBeGreaterThan(0);

                const allInstances = instancesResult.Reservations!.flatMap(r => r.Instances || []);
                expect(allInstances.length).toBeGreaterThan(0);

                // Verify all instances are running
                for (const instance of allInstances) {
                    expect(instance.State?.Name).toBe('running');
                    console.log(`✓ Instance ${instance.InstanceId} is running in ${region}`);
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
            
            try {
                const sgResult = await ec2Client.describeSecurityGroups({
                    Filters: [
                        {
                            Name: 'tag:ManagedBy',
                            Values: ['Pulumi']
                        },
                        {
                            Name: 'tag:Environment',
                            Values: [environmentSuffix]
                        },
                        {
                            Name: 'group-name',
                            Values: [`*${environmentSuffix}*`] // Flexible matching
                        }
                    ]
                }).promise();

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
            
            // Expected dashboard name based on your naming pattern
            const expectedDashboardPattern = `monitoring-${regionSuffix}-${environmentSuffix}`;
            
            try {
                const dashboardsResult = await cloudwatchClient.listDashboards().promise();
                
                expect(dashboardsResult.DashboardEntries).toBeDefined();
                
                const matchingDashboards = dashboardsResult.DashboardEntries!.filter(
                    dashboard => dashboard.DashboardName?.includes(expectedDashboardPattern)
                );
                
                expect(matchingDashboards.length).toBeGreaterThan(0);
                
                for (const dashboard of matchingDashboards) {
                    console.log(`✓ CloudWatch Dashboard ${dashboard.DashboardName} exists in ${region}`);
                    
                    // Verify dashboard content exists
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

    test('Resources have proper tags applied', async () => {
        const primaryRegion = regions[0];
        const ec2Client = awsClients[primaryRegion].ec2;

        try {
            // Get all resources with Pulumi tags
            const tagsResult = await ec2Client.describeTags({
                Filters: [
                    {
                        Name: 'key',
                        Values: ['ManagedBy']
                    },
                    {
                        Name: 'value',
                        Values: ['Pulumi']
                    }
                ]
            }).promise();

            expect(tagsResult.Tags).toBeDefined();
            expect(tagsResult.Tags!.length).toBeGreaterThan(0);

            // Check for expected tags
            const environmentTags = tagsResult.Tags!.filter(tag => 
                tag.Key === 'Environment' && tag.Value === environmentSuffix
            );
            const projectTags = tagsResult.Tags!.filter(tag => 
                tag.Key === 'Project' && tag.Value === 'Pulumi-Tap-Stack'
            );

            expect(environmentTags.length).toBeGreaterThan(0);
            expect(projectTags.length).toBeGreaterThan(0);

            console.log(`✓ Found ${environmentTags.length} resources with Environment=${environmentSuffix}`);
            console.log(`✓ Found ${projectTags.length} resources with Project=Pulumi-Tap-Stack`);

        } catch (error) {
            console.error(`✗ Failed to verify tags in ${primaryRegion}:`, error);
            throw error;
        }
    });

    test('Network connectivity - subnets exist and are available', async () => {
        for (const region of regions) {
            const ec2Client = awsClients[region].ec2;
            
            try {
                const subnetsResult = await ec2Client.describeSubnets({
                    Filters: [
                        {
                            Name: 'tag:ManagedBy',
                            Values: ['Pulumi']
                        },
                        {
                            Name: 'tag:Environment',
                            Values: [environmentSuffix]
                        },
                        {
                            Name: 'state',
                            Values: ['available']
                        }
                    ]
                }).promise();

                expect(subnetsResult.Subnets).toBeDefined();
                expect(subnetsResult.Subnets!.length).toBeGreaterThan(0);

                // Should have both public and private subnets
                const publicSubnets = subnetsResult.Subnets!.filter(subnet =>
                    subnet.Tags?.some(tag => tag.Key === 'Type' && tag.Value?.includes('public'))
                );
                const privateSubnets = subnetsResult.Subnets!.filter(subnet =>
                    subnet.Tags?.some(tag => tag.Key === 'Type' && tag.Value?.includes('private'))
                );

                expect(publicSubnets.length).toBeGreaterThan(0);
                expect(privateSubnets.length).toBeGreaterThan(0);

                console.log(`✓ Found ${publicSubnets.length} public and ${privateSubnets.length} private subnets in ${region}`);

            } catch (error) {
                console.error(`✗ Failed to verify subnets in ${region}:`, error);
                throw error;
            }
        }
    });
});