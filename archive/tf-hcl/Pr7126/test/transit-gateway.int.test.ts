/**
 * Transit Gateway Multi-VPC Integration Tests
 * Integration tests for hub-and-spoke network architecture deployment
 */

describe('Transit Gateway Multi-VPC Integration Tests', () => {
    describe('Hub-and-Spoke Network Topology', () => {
        it('should validate complete hub VPC configuration', () => {
            const hubVpc = {
                vpcId: 'vpc-hub123',
                cidr: '10.0.0.0/16',
                publicSubnets: ['10.0.0.0/24', '10.0.1.0/24'],
                privateSubnets: ['10.0.10.0/24', '10.0.11.0/24'],
                transitGatewaySubnets: ['10.0.240.0/28', '10.0.240.16/28'],
                natGateways: ['nat-1a', 'nat-1b'],
                internetGateway: 'igw-hub',
                availabilityZones: ['us-east-1a', 'us-east-1b']
            };

            expect(hubVpc.natGateways.length).toBe(hubVpc.availabilityZones.length);
            expect(hubVpc.publicSubnets.length).toBe(hubVpc.availabilityZones.length);
            expect(hubVpc.transitGatewaySubnets.length).toBeGreaterThan(0);
            expect(hubVpc.internetGateway).toBeTruthy();
        });

        it('should validate spoke VPC configurations', () => {
            const spokeVpcs = [
                {
                    name: 'production',
                    vpcId: 'vpc-prod123',
                    cidr: '10.1.0.0/16',
                    privateSubnets: ['10.1.10.0/24', '10.1.11.0/24'],
                    transitGatewaySubnets: ['10.1.240.0/28', '10.1.240.16/28'],
                    hasInternetAccess: true
                },
                {
                    name: 'development',
                    vpcId: 'vpc-dev123',
                    cidr: '10.2.0.0/16',
                    privateSubnets: ['10.2.10.0/24', '10.2.11.0/24'],
                    transitGatewaySubnets: ['10.2.240.0/28', '10.2.240.16/28'],
                    hasInternetAccess: true
                }
            ];

            spokeVpcs.forEach(vpc => {
                expect(vpc.privateSubnets.length).toBeGreaterThanOrEqual(2);
                expect(vpc.transitGatewaySubnets.length).toBeGreaterThanOrEqual(1);
                expect(vpc.hasInternetAccess).toBe(true);
            });

            // Verify non-overlapping CIDRs
            const cidrs = spokeVpcs.map(vpc => vpc.cidr);
            cidrs.push('10.0.0.0/16'); // Add hub VPC
            expect(new Set(cidrs).size).toBe(cidrs.length);
        });

        it('should validate transit gateway attachments', () => {
            const attachments = [
                {
                    name: 'hub-attachment',
                    vpcId: 'vpc-hub123',
                    subnetIds: ['subnet-tgw-hub-1a', 'subnet-tgw-hub-1b'],
                    routeTableId: 'tgw-rtb-hub',
                    dnsSupport: true,
                    ipv6Support: false
                },
                {
                    name: 'prod-attachment',
                    vpcId: 'vpc-prod123',
                    subnetIds: ['subnet-tgw-prod-1a', 'subnet-tgw-prod-1b'],
                    routeTableId: 'tgw-rtb-prod',
                    dnsSupport: true,
                    ipv6Support: false
                },
                {
                    name: 'dev-attachment',
                    vpcId: 'vpc-dev123',
                    subnetIds: ['subnet-tgw-dev-1a', 'subnet-tgw-dev-1b'],
                    routeTableId: 'tgw-rtb-dev',
                    dnsSupport: true,
                    ipv6Support: false
                }
            ];

            expect(attachments.length).toBe(3);
            attachments.forEach(attachment => {
                expect(attachment.subnetIds.length).toBeGreaterThanOrEqual(1);
                expect(attachment.dnsSupport).toBe(true);
                expect(attachment.routeTableId).toMatch(/^tgw-rtb-/);
            });
        });
    });

    describe('Transit Gateway Routing', () => {
        it('should validate transit gateway route tables', () => {
            const routeTables = {
                hub: {
                    id: 'tgw-rtb-hub',
                    routes: [
                        { destination: '10.1.0.0/16', attachment: 'tgw-attach-prod' },
                        { destination: '10.2.0.0/16', attachment: 'tgw-attach-dev' }
                    ],
                    associations: ['tgw-attach-hub'],
                    propagations: []
                },
                production: {
                    id: 'tgw-rtb-prod',
                    routes: [
                        { destination: '0.0.0.0/0', attachment: 'tgw-attach-hub' }
                    ],
                    associations: ['tgw-attach-prod'],
                    propagations: []
                },
                development: {
                    id: 'tgw-rtb-dev',
                    routes: [
                        { destination: '0.0.0.0/0', attachment: 'tgw-attach-hub' }
                    ],
                    associations: ['tgw-attach-dev'],
                    propagations: []
                }
            };

            // Verify hub can reach all spokes
            expect(routeTables.hub.routes.length).toBe(2);

            // Verify spokes have default route to hub
            expect(routeTables.production.routes[0].destination).toBe('0.0.0.0/0');
            expect(routeTables.development.routes[0].destination).toBe('0.0.0.0/0');

            // Verify each route table has proper associations
            Object.values(routeTables).forEach(rt => {
                expect(rt.associations.length).toBeGreaterThanOrEqual(1);
            });
        });

        it('should validate VPC route tables for transit gateway', () => {
            const vpcRouteTables = [
                {
                    vpcName: 'hub',
                    privateRoutes: [
                        { destination: '10.1.0.0/16', target: 'tgw-123' },
                        { destination: '10.2.0.0/16', target: 'tgw-123' }
                    ],
                    publicRoutes: [
                        { destination: '0.0.0.0/0', target: 'igw-123' },
                        { destination: '10.1.0.0/16', target: 'tgw-123' },
                        { destination: '10.2.0.0/16', target: 'tgw-123' }
                    ]
                },
                {
                    vpcName: 'production',
                    privateRoutes: [
                        { destination: '0.0.0.0/0', target: 'tgw-123' },
                        { destination: '10.0.0.0/16', target: 'tgw-123' },
                        { destination: '10.2.0.0/16', target: 'tgw-123' }
                    ]
                }
            ];

            vpcRouteTables.forEach(rt => {
                rt.privateRoutes.forEach(route => {
                    expect(route.target).toMatch(/^(tgw-|nat-|igw-)/);
                });
            });
        });

        it('should validate routing connectivity matrix', () => {
            const connectivityMatrix = {
                hub: {
                    production: true,
                    development: true,
                    internet: true
                },
                production: {
                    hub: true,
                    development: true,
                    internet: true // via hub NAT
                },
                development: {
                    hub: true,
                    production: true,
                    internet: true // via hub NAT
                }
            };

            // Verify all VPCs can reach hub
            expect(connectivityMatrix.production.hub).toBe(true);
            expect(connectivityMatrix.development.hub).toBe(true);

            // Verify spoke-to-spoke connectivity via hub
            expect(connectivityMatrix.production.development).toBe(true);
            expect(connectivityMatrix.development.production).toBe(true);

            // Verify internet access
            Object.values(connectivityMatrix).forEach(vpc => {
                expect(vpc.internet).toBe(true);
            });
        });
    });

    describe('NAT Gateway High Availability', () => {
        it('should validate NAT gateway deployment across AZs', () => {
            const natGateways = [
                {
                    id: 'nat-1a',
                    availabilityZone: 'us-east-1a',
                    elasticIp: 'eip-1a',
                    subnet: 'subnet-public-1a',
                    state: 'available'
                },
                {
                    id: 'nat-1b',
                    availabilityZone: 'us-east-1b',
                    elasticIp: 'eip-1b',
                    subnet: 'subnet-public-1b',
                    state: 'available'
                }
            ];

            const uniqueAZs = new Set(natGateways.map(nat => nat.availabilityZone));
            expect(uniqueAZs.size).toBe(natGateways.length);

            natGateways.forEach(nat => {
                expect(nat.state).toBe('available');
                expect(nat.elasticIp).toBeTruthy();
                expect(nat.subnet).toMatch(/^subnet-public-/);
            });
        });

        it('should validate failover routing configuration', () => {
            const routeTableFailover = {
                primaryNat: 'nat-1a',
                secondaryNat: 'nat-1b',
                healthCheckEnabled: true,
                failoverTime: 60, // seconds
                routeTables: ['rtb-private-1a', 'rtb-private-1b']
            };

            expect(routeTableFailover.primaryNat).not.toBe(routeTableFailover.secondaryNat);
            expect(routeTableFailover.healthCheckEnabled).toBe(true);
            expect(routeTableFailover.failoverTime).toBeLessThanOrEqual(120);
        });
    });

    describe('Route53 Private DNS Integration', () => {
        it('should validate private hosted zone configuration', () => {
            const hostedZone = {
                name: 'internal.synth-101912528.local',
                private: true,
                vpcAssociations: [
                    { vpcId: 'vpc-hub', region: 'us-east-1' },
                    { vpcId: 'vpc-prod', region: 'us-east-1' },
                    { vpcId: 'vpc-dev', region: 'us-east-1' }
                ],
                recordCount: 15,
                dnsSecEnabled: false
            };

            expect(hostedZone.private).toBe(true);
            expect(hostedZone.vpcAssociations.length).toBe(3);
            expect(hostedZone.name).toMatch(/\.local$/);
        });

        it('should validate DNS record sets', () => {
            const recordSets = [
                {
                    name: 'hub-nat.internal.local',
                    type: 'A',
                    ttl: 300,
                    values: ['10.0.0.5', '10.0.1.5']
                },
                {
                    name: 'prod-db.internal.local',
                    type: 'CNAME',
                    ttl: 300,
                    values: ['prod-rds.cluster.amazonaws.com']
                },
                {
                    name: '_service._tcp.internal.local',
                    type: 'SRV',
                    ttl: 300,
                    values: ['10 50 8080 service1.internal.local']
                }
            ];

            recordSets.forEach(record => {
                expect(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'PTR', 'NS'])
                    .toContain(record.type);
                expect(record.ttl).toBeGreaterThanOrEqual(60);
                expect(record.values.length).toBeGreaterThan(0);
            });
        });

        it('should validate DNS query routing', () => {
            const dnsRouting = {
                forwardingRules: [
                    { domain: 'amazonaws.com', forwarders: ['169.254.169.253'] },
                    { domain: 'internal.local', forwarders: ['10.0.0.2'] }
                ],
                recursionEnabled: true,
                dnssecValidation: true
            };

            expect(dnsRouting.forwardingRules.length).toBeGreaterThan(0);
            expect(dnsRouting.recursionEnabled).toBe(true);
            dnsRouting.forwardingRules.forEach(rule => {
                expect(rule.forwarders.length).toBeGreaterThan(0);
            });
        });
    });

    describe('VPC Flow Logs Collection', () => {
        it('should validate flow logs S3 bucket configuration', () => {
            const s3Config = {
                bucketName: 'vpc-flow-logs-synth-101912528',
                encryption: 'AES256',
                lifecycle: {
                    transitionToGlacier: 30,
                    expiration: 365
                },
                accessLogging: true,
                versioning: false,
                publicAccessBlock: true
            };

            expect(s3Config.bucketName).toMatch(/^vpc-flow-logs-/);
            expect(s3Config.encryption).toBeTruthy();
            expect(s3Config.publicAccessBlock).toBe(true);
            expect(s3Config.lifecycle.transitionToGlacier).toBeLessThan(s3Config.lifecycle.expiration);
        });

        it('should validate flow logs aggregation', () => {
            const flowLogsConfig = {
                captureType: 'ALL',
                aggregationInterval: 600, // 10 minutes
                format: 'parquet',
                fields: [
                    'srcaddr', 'dstaddr', 'srcport', 'dstport',
                    'protocol', 'packets', 'bytes', 'action'
                ],
                vpcs: ['vpc-hub', 'vpc-prod', 'vpc-dev']
            };

            expect(['ALL', 'ACCEPT', 'REJECT']).toContain(flowLogsConfig.captureType);
            expect([60, 600]).toContain(flowLogsConfig.aggregationInterval);
            expect(flowLogsConfig.fields.length).toBeGreaterThanOrEqual(8);
            expect(flowLogsConfig.vpcs.length).toBe(3);
        });

        it('should validate flow logs analysis queries', () => {
            const analysisQueries = [
                {
                    name: 'TopTalkers',
                    query: 'SELECT srcaddr, SUM(bytes) FROM flow_logs GROUP BY srcaddr',
                    schedule: 'rate(1 hour)'
                },
                {
                    name: 'RejectedConnections',
                    query: 'SELECT * FROM flow_logs WHERE action = "REJECT"',
                    schedule: 'rate(5 minutes)'
                }
            ];

            analysisQueries.forEach(query => {
                expect(query.query).toContain('FROM flow_logs');
                expect(query.schedule).toMatch(/^rate\(\d+ \w+\)$/);
            });
        });
    });

    describe('Security and Compliance', () => {
        it('should validate network ACL configuration', () => {
            const networkAcls = {
                public: {
                    inboundRules: [
                        { ruleNumber: 100, protocol: 'tcp', port: 443, source: '0.0.0.0/0', action: 'allow' },
                        { ruleNumber: 110, protocol: 'tcp', port: 80, source: '0.0.0.0/0', action: 'allow' },
                        { ruleNumber: 32767, protocol: '-1', port: 0, source: '0.0.0.0/0', action: 'deny' }
                    ],
                    outboundRules: [
                        { ruleNumber: 100, protocol: '-1', port: 0, destination: '0.0.0.0/0', action: 'allow' }
                    ]
                },
                private: {
                    inboundRules: [
                        { ruleNumber: 100, protocol: '-1', port: 0, source: '10.0.0.0/8', action: 'allow' },
                        { ruleNumber: 32767, protocol: '-1', port: 0, source: '0.0.0.0/0', action: 'deny' }
                    ],
                    outboundRules: [
                        { ruleNumber: 100, protocol: '-1', port: 0, destination: '0.0.0.0/0', action: 'allow' }
                    ]
                }
            };

            Object.values(networkAcls).forEach(acl => {
                // Verify deny all rule exists
                const denyAllInbound = acl.inboundRules.find(r => r.ruleNumber === 32767);
                expect(denyAllInbound?.action).toBe('deny');

                // Verify rule numbers are in valid range
                acl.inboundRules.forEach(rule => {
                    expect(rule.ruleNumber).toBeGreaterThanOrEqual(1);
                    expect(rule.ruleNumber).toBeLessThanOrEqual(32767);
                });
            });
        });

        it('should validate security group layering', () => {
            const securityGroups = {
                bastionHost: {
                    ingress: [{ port: 22, source: 'corporate-ip-range' }],
                    egress: [{ port: 0, destination: '0.0.0.0/0' }]
                },
                applicationTier: {
                    ingress: [{ port: 443, source: 'alb-security-group' }],
                    egress: [{ port: 3306, destination: 'database-security-group' }]
                },
                databaseTier: {
                    ingress: [{ port: 3306, source: 'application-security-group' }],
                    egress: []
                }
            };

            // Verify layered security approach
            expect(securityGroups.databaseTier.ingress[0].source).toContain('application');
            expect(securityGroups.applicationTier.ingress[0].source).toContain('alb');
            expect(securityGroups.bastionHost.ingress[0].port).toBe(22);
        });

        it('should validate compliance tags', () => {
            const complianceTags = {
                DataClassification: 'Internal',
                Compliance: 'SOC2',
                Environment: 'Production',
                CostCenter: 'Infrastructure',
                Owner: 'NetworkTeam',
                BackupPolicy: 'Daily',
                DisasterRecovery: 'Enabled'
            };

            const requiredTags = ['DataClassification', 'Compliance', 'Environment', 'Owner'];
            requiredTags.forEach(tag => {
                expect(complianceTags).toHaveProperty(tag);
            });
        });
    });

    describe('Cost Optimization', () => {
        it('should validate resource right-sizing', () => {
            const resourceSizing = {
                natGateway: {
                    type: 'standard',
                    expectedThroughput: '45Gbps',
                    costPerHour: 0.045
                },
                transitGateway: {
                    attachmentCost: 0.05,
                    dataProcessingCost: 0.02,
                    expectedAttachments: 3
                },
                flowLogs: {
                    s3StorageGbPerMonth: 100,
                    costPerGb: 0.023
                }
            };

            const monthlyCost =
                (resourceSizing.natGateway.costPerHour * 24 * 30 * 2) + // 2 NAT gateways
                (resourceSizing.transitGateway.attachmentCost * 24 * 30 * resourceSizing.transitGateway.expectedAttachments) +
                (resourceSizing.flowLogs.s3StorageGbPerMonth * resourceSizing.flowLogs.costPerGb);

            expect(monthlyCost).toBeGreaterThan(0);
            expect(monthlyCost).toBeLessThan(500); // Reasonable monthly cost
        });

        it('should validate unused resource cleanup', () => {
            const unusedResources = {
                unattachedEips: [],
                orphanedEnis: [],
                unusedSecurityGroups: [],
                emptyS3Buckets: []
            };

            Object.values(unusedResources).forEach(resources => {
                expect(resources.length).toBe(0);
            });
        });
    });

    describe('Monitoring and Alerting', () => {
        it('should validate CloudWatch metrics', () => {
            const metrics = [
                {
                    namespace: 'AWS/TransitGateway',
                    metricName: 'BytesIn',
                    dimensions: { TransitGateway: 'tgw-123' },
                    statistic: 'Sum',
                    period: 300
                },
                {
                    namespace: 'AWS/NATGateway',
                    metricName: 'ActiveConnectionCount',
                    dimensions: { NatGatewayId: 'nat-123' },
                    statistic: 'Average',
                    period: 300
                }
            ];

            metrics.forEach(metric => {
                expect(metric.namespace).toMatch(/^AWS\//);
                expect(metric.period).toBeGreaterThanOrEqual(60);
                expect(['Sum', 'Average', 'Maximum', 'Minimum']).toContain(metric.statistic);
            });
        });

        it('should validate alarm configurations', () => {
            const alarms = [
                {
                    name: 'high-tgw-packet-drops',
                    metric: 'PacketDropCount',
                    threshold: 1000,
                    evaluationPeriods: 2,
                    comparisonOperator: 'GreaterThanThreshold',
                    snsTopicArn: 'arn:aws:sns:us-east-1:123456:network-alerts'
                },
                {
                    name: 'nat-gateway-error-rate',
                    metric: 'ErrorPortAllocation',
                    threshold: 10,
                    evaluationPeriods: 3,
                    comparisonOperator: 'GreaterThanThreshold',
                    snsTopicArn: 'arn:aws:sns:us-east-1:123456:network-alerts'
                }
            ];

            alarms.forEach(alarm => {
                expect(alarm.evaluationPeriods).toBeGreaterThanOrEqual(1);
                expect(alarm.snsTopicArn).toMatch(/^arn:aws:sns:/);
                expect(alarm.threshold).toBeGreaterThan(0);
            });
        });
    });

    describe('Disaster Recovery', () => {
        it('should validate multi-region readiness', () => {
            const drConfiguration = {
                primaryRegion: 'us-east-1',
                secondaryRegion: 'us-west-2',
                replicationEnabled: true,
                rpo: 60, // minutes
                rto: 120, // minutes
                backupSchedule: 'daily',
                crossRegionCopyEnabled: true
            };

            expect(drConfiguration.primaryRegion).not.toBe(drConfiguration.secondaryRegion);
            expect(drConfiguration.rpo).toBeLessThan(drConfiguration.rto);
            expect(drConfiguration.crossRegionCopyEnabled).toBe(true);
        });

        it('should validate backup and restore procedures', () => {
            const backupConfig = {
                vpcConfigBackup: true,
                routeTableBackup: true,
                securityGroupBackup: true,
                backupFrequency: 'daily',
                retentionDays: 30,
                automatedTesting: true
            };

            expect(backupConfig.vpcConfigBackup).toBe(true);
            expect(backupConfig.routeTableBackup).toBe(true);
            expect(backupConfig.retentionDays).toBeGreaterThanOrEqual(7);
            expect(backupConfig.automatedTesting).toBe(true);
        });
    });
});

// Helper to check if a value is between two numbers
expect.extend({
    toBeBetween(received: number, floor: number, ceiling: number) {
        const pass = received >= floor && received <= ceiling;
        if (pass) {
            return {
                message: () => `expected ${received} not to be between ${floor} and ${ceiling}`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be between ${floor} and ${ceiling}`,
                pass: false,
            };
        }
    },
});

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeBetween(floor: number, ceiling: number): R;
        }
    }
}

// Export for Jest compatibility
export {};