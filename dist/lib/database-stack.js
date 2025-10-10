"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseStack = void 0;
const constructs_1 = require("constructs");
const db_instance_1 = require("@cdktf/provider-aws/lib/db-instance");
const db_subnet_group_1 = require("@cdktf/provider-aws/lib/db-subnet-group");
const security_group_1 = require("@cdktf/provider-aws/lib/security-group");
const security_group_rule_1 = require("@cdktf/provider-aws/lib/security-group-rule");
const elasticache_serverless_cache_1 = require("@cdktf/provider-aws/lib/elasticache-serverless-cache");
const s3_bucket_1 = require("@cdktf/provider-aws/lib/s3-bucket");
const s3_bucket_versioning_1 = require("@cdktf/provider-aws/lib/s3-bucket-versioning");
const s3_bucket_public_access_block_1 = require("@cdktf/provider-aws/lib/s3-bucket-public-access-block");
class DatabaseStack extends constructs_1.Construct {
    dbInstance;
    // public readonly readReplica: DbInstance;
    elasticacheServerless;
    historicalDataBucket;
    constructor(scope, id, props) {
        super(scope, id);
        const dbSecurityGroup = new security_group_1.SecurityGroup(this, 'db-sg', {
            vpcId: props.vpc.id,
            description: 'Security group for RDS PostgreSQL',
            tags: {
                Name: 'portfolio-db-sg',
            },
        });
        new security_group_rule_1.SecurityGroupRule(this, 'db-ingress', {
            type: 'ingress',
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroupId: dbSecurityGroup.id,
            cidrBlocks: ['172.32.0.0/16'],
        });
        new security_group_rule_1.SecurityGroupRule(this, 'db-egress', {
            type: 'egress',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            securityGroupId: dbSecurityGroup.id,
            cidrBlocks: ['0.0.0.0/0'],
        });
        const dbSubnetGroup = new db_subnet_group_1.DbSubnetGroup(this, 'db-subnet-group', {
            name: `portfolio-db-subnet-group-${props.environmentSuffix}`,
            subnetIds: props.privateSubnets.map(subnet => subnet.id),
            tags: {
                Name: 'portfolio-db-subnet-group',
            },
        });
        this.dbInstance = new db_instance_1.DbInstance(this, 'postgres-db', {
            identifier: `portfolio-holdings-db-${props.environmentSuffix}`,
            engine: 'postgres',
            engineVersion: '15.14',
            instanceClass: 'db.t3.medium',
            allocatedStorage: 100,
            storageType: 'gp3',
            storageEncrypted: true,
            dbName: 'portfoliodb',
            username: 'dbadmin',
            password: 'TempPassword123!ChangeMe',
            vpcSecurityGroupIds: [dbSecurityGroup.id],
            dbSubnetGroupName: dbSubnetGroup.name,
            backupRetentionPeriod: 7,
            backupWindow: '03:00-04:00',
            maintenanceWindow: 'sun:04:00-sun:05:00',
            multiAz: true,
            skipFinalSnapshot: true,
            deletionProtection: false,
            tags: {
                Name: 'portfolio-holdings-db',
            },
        });
        // Read replica is not supported with existing database that uses Secrets Manager
        // this.readReplica = new DbInstance(this, 'postgres-read-replica', {
        //   identifier: `portfolio-read-replica-${props.environmentSuffix}`,
        //   replicateSourceDb: this.dbInstance.identifier,
        //   instanceClass: 'db.t3.medium',
        //   skipFinalSnapshot: true,
        //   tags: {
        //     Name: 'portfolio-holdings-read-replica',
        //   },
        // });
        const cacheSecurityGroup = new security_group_1.SecurityGroup(this, 'cache-sg', {
            vpcId: props.vpc.id,
            description: 'Security group for ElastiCache',
            tags: {
                Name: 'portfolio-cache-sg',
            },
        });
        new security_group_rule_1.SecurityGroupRule(this, 'cache-ingress', {
            type: 'ingress',
            fromPort: 6379,
            toPort: 6379,
            protocol: 'tcp',
            securityGroupId: cacheSecurityGroup.id,
            cidrBlocks: ['172.32.0.0/16'],
        });
        new security_group_rule_1.SecurityGroupRule(this, 'cache-egress', {
            type: 'egress',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            securityGroupId: cacheSecurityGroup.id,
            cidrBlocks: ['0.0.0.0/0'],
        });
        this.elasticacheServerless = new elasticache_serverless_cache_1.ElasticacheServerlessCache(this, 'market-data-cache', {
            name: `portfolio-market-cache-${props.environmentSuffix}`,
            engine: 'valkey',
            cacheUsageLimits: [
                {
                    dataStorage: [
                        {
                            unit: 'GB',
                            maximum: 10,
                        },
                    ],
                    ecpuPerSecond: [
                        {
                            maximum: 5000,
                        },
                    ],
                },
            ],
            dailySnapshotTime: '03:00',
            description: 'Market data cache with 1-minute TTL',
            securityGroupIds: [cacheSecurityGroup.id],
            subnetIds: props.privateSubnets.map(subnet => subnet.id),
            tags: {
                Name: 'portfolio-market-cache',
            },
        });
        this.historicalDataBucket = new s3_bucket_1.S3Bucket(this, 'historical-data', {
            bucket: `portfolio-hist-${props.environmentSuffix}-${Date.now()}`,
            tags: {
                Name: `portfolio-historical-data-${props.environmentSuffix}`,
            },
        });
        new s3_bucket_versioning_1.S3BucketVersioningA(this, 'historical-data-versioning', {
            bucket: this.historicalDataBucket.id,
            versioningConfiguration: {
                status: 'Enabled',
            },
        });
        new s3_bucket_public_access_block_1.S3BucketPublicAccessBlock(this, 'historical-data-pab', {
            bucket: this.historicalDataBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        });
    }
}
exports.DatabaseStack = DatabaseStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvZGF0YWJhc2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMkNBQXVDO0FBR3ZDLHFFQUFpRTtBQUNqRSw2RUFBd0U7QUFDeEUsMkVBQXVFO0FBQ3ZFLHFGQUFnRjtBQUNoRix1R0FBa0c7QUFDbEcsaUVBQTZEO0FBQzdELHVGQUFtRjtBQUNuRix5R0FBa0c7QUFTbEcsTUFBYSxhQUFjLFNBQVEsc0JBQVM7SUFDMUIsVUFBVSxDQUFhO0lBQ3ZDLDJDQUEyQztJQUMzQixxQkFBcUIsQ0FBNkI7SUFDbEQsb0JBQW9CLENBQVc7SUFFL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF5QjtRQUNqRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sZUFBZSxHQUFHLElBQUksOEJBQWEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO1lBQ3ZELEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbkIsV0FBVyxFQUFFLG1DQUFtQztZQUNoRCxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLGlCQUFpQjthQUN4QjtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksdUNBQWlCLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUN4QyxJQUFJLEVBQUUsU0FBUztZQUNmLFFBQVEsRUFBRSxJQUFJO1lBQ2QsTUFBTSxFQUFFLElBQUk7WUFDWixRQUFRLEVBQUUsS0FBSztZQUNmLGVBQWUsRUFBRSxlQUFlLENBQUMsRUFBRTtZQUNuQyxVQUFVLEVBQUUsQ0FBQyxlQUFlLENBQUM7U0FDOUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSx1Q0FBaUIsQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFO1lBQ3ZDLElBQUksRUFBRSxRQUFRO1lBQ2QsUUFBUSxFQUFFLENBQUM7WUFDWCxNQUFNLEVBQUUsQ0FBQztZQUNU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QUM1QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE3SkQsc0NBNkpDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBWcGMgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi92cGMnO1xuaW1wb3J0IHsgU3VibmV0IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvc3VibmV0JztcbmltcG9ydCB7IERiSW5zdGFuY2UgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9kYi1pbnN0YW5jZSc7XG5pbXBvcnQgeyBEYlN1Ym5ldEdyb3VwIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvZGItc3VibmV0LWdyb3VwJztcbmltcG9ydCB7IFNlY3VyaXR5R3JvdXAgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zZWN1cml0eS1ncm91cCc7XG5pbXBvcnQgeyBTZWN1cml0eUdyb3VwUnVsZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3NlY3VyaXR5LWdyb3VwLXJ1bGUnO1xuaW1wb3J0IHsgRWxhc3RpY2FjaGVTZXJ2ZXJsZXNzQ2FjaGUgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9lbGFzdGljYWNoZS1zZXJ2ZXJsZXNzLWNhY2hlJztcbmltcG9ydCB7IFMzQnVja2V0IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0JztcbmltcG9ydCB7IFMzQnVja2V0VmVyc2lvbmluZ0EgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zMy1idWNrZXQtdmVyc2lvbmluZyc7XG5pbXBvcnQgeyBTM0J1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvczMtYnVja2V0LXB1YmxpYy1hY2Nlc3MtYmxvY2snO1xuXG5pbnRlcmZhY2UgRGF0YWJhc2VTdGFja1Byb3BzIHtcbiAgdnBjOiBWcGM7XG4gIHByaXZhdGVTdWJuZXRzOiBTdWJuZXRbXTtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZVN0YWNrIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2U6IERiSW5zdGFuY2U7XG4gIC8vIHB1YmxpYyByZWFkb25seSByZWFkUmVwbGljYTogRGJJbnN0YW5jZTtcbiAgcHVibGljIHJlYWRvbmx5IGVsYXN0aWNhY2hlU2VydmVybGVzczogRWxhc3RpY2FjaGVTZXJ2ZXJsZXNzQ2FjaGU7XG4gIHB1YmxpYyByZWFkb25seSBoaXN0b3JpY2FsRGF0YUJ1Y2tldDogUzNCdWNrZXQ7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IERhdGFiYXNlU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCBkYlNlY3VyaXR5R3JvdXAgPSBuZXcgU2VjdXJpdHlHcm91cCh0aGlzLCAnZGItc2cnLCB7XG4gICAgICB2cGNJZDogcHJvcHMudnBjLmlkLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgUkRTIFBvc3RncmVTUUwnLFxuICAgICAgdGFnczoge1xuICAgICAgICBOYW1lOiAncG9ydGZvbGlvLWRiLXNnJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBuZXcgU2VjdXJpdHlHcm91cFJ1bGUodGhpcywgJ2RiLWluZ3Jlc3MnLCB7XG4gICAgICB0eXBlOiAnaW5ncmVzcycsXG4gICAgICBmcm9tUG9ydDogNTQzMixcbiAgICAgIHRvUG9ydDogNTQzMixcbiAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZDogZGJTZWN1cml0eUdyb3VwLmlkLFxuICAgICAgY2lkckJsb2NrczogWycxNzIuMzIuMC4wLzE2J10sXG4gICAgfSk7XG5cbiAgICBuZXcgU2VjdXJpdHlHcm91cFJ1bGUodGhpcywgJ2RiLWVncmVzcycsIHtcbiAgICAgIHR5cGU6ICdlZ3Jlc3MnLFxuICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICB0b1BvcnQ6IDAsXG4gICAgICBwcm90b2NvbDogJy0xJyxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZDogZGJTZWN1cml0eUdyb3VwLmlkLFxuICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGRiU3VibmV0R3JvdXAgPSBuZXcgRGJTdWJuZXRHcm91cCh0aGlzLCAnZGItc3VibmV0LWdyb3VwJywge1xuICAgICAgbmFtZTogYHBvcnRmb2xpby1kYi1zdWJuZXQtZ3JvdXAtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgc3VibmV0SWRzOiBwcm9wcy5wcml2YXRlU3VibmV0cy5tYXAoc3VibmV0ID0+IHN1Ym5ldC5pZCksXG4gICAgICB0YWdzOiB7XG4gICAgICAgIE5hbWU6ICdwb3J0Zm9saW8tZGItc3VibmV0LWdyb3VwJyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICB0aGlzLmRiSW5zdGFuY2UgPSBuZXcgRGJJbnN0YW5jZSh0aGlzLCAncG9zdGdyZXMtZGInLCB7XG4gICAgICBpZGVudGlmaWVyOiBgcG9ydGZvbGlvLWhvbGRpbmdzLWRiLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIGVuZ2luZTogJ3Bvc3RncmVzJyxcbiAgICAgIGVuZ2luZVZlcnNpb246ICcxNS4xNCcsXG4gICAgICBpbnN0YW5jZUNsYXNzOiAnZGIudDMubWVkaXVtJyxcbiAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IDEwMCxcbiAgICAgIHN0b3JhZ2VUeXBlOiAnZ3AzJyxcbiAgICAgIHN0b3JhZ2VFbmNyeXB0ZWQ6IHRydWUsXG4gICAgICBkYk5hbWU6ICdwb3J0Zm9saW9kYicsXG4gICAgICB1c2VybmFtZTogJ2RiYWRtaW4nLFxuICAgICAgcGFzc3dvcmQ6ICdUZW1wUGFzc3dvcmQxMjMhQ2hhbmdlTWUnLFxuICAgICAgdnBjU2VjdXJpdHlHcm91cElkczogW2RiU2VjdXJpdHlHcm91cC5pZF0sXG4gICAgICBkYlN1Ym5ldEdyb3VwTmFtZTogZGJTdWJuZXRHcm91cC5uYW1lLFxuICAgICAgYmFja3VwUmV0ZW50aW9uUGVyaW9kOiA3LFxuICAgICAgYmFja3VwV2luZG93OiAnMDM6MDAtMDQ6MDAnLFxuICAgICAgbWFpbnRlbmFuY2VXaW5kb3c6ICdzdW46MDQ6MDAtc3VuOjA1OjAwJyxcbiAgICAgIG11bHRpQXo6IHRydWUsXG4gICAgICBza2lwRmluYWxTbmFwc2hvdDogdHJ1ZSxcbiAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogZmFsc2UsXG4gICAgICB0YWdzOiB7XG4gICAgICAgIE5hbWU6ICdwb3J0Zm9saW8taG9sZGluZ3MtZGInLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFJlYWQgcmVwbGljYSBpcyBub3Qgc3VwcG9ydGVkIHdpdGggZXhpc3RpbmcgZGF0YWJhc2UgdGhhdCB1c2VzIFNlY3JldHMgTWFuYWdlclxuICAgIC8vIHRoaXMucmVhZFJlcGxpY2EgPSBuZXcgRGJJbnN0YW5jZSh0aGlzLCAncG9zdGdyZXMtcmVhZC1yZXBsaWNhJywge1xuICAgIC8vICAgaWRlbnRpZmllcjogYHBvcnRmb2xpby1yZWFkLXJlcGxpY2EtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgIC8vICAgcmVwbGljYXRlU291cmNlRGI6IHRoaXMuZGJJbnN0YW5jZS5pZGVudGlmaWVyLFxuICAgIC8vICAgaW5zdGFuY2VDbGFzczogJ2RiLnQzLm1lZGl1bScsXG4gICAgLy8gICBza2lwRmluYWxTbmFwc2hvdDogdHJ1ZSxcbiAgICAvLyAgIHRhZ3M6IHtcbiAgICAvLyAgICAgTmFtZTogJ3BvcnRmb2xpby1ob2xkaW5ncy1yZWFkLXJlcGxpY2EnLFxuICAgIC8vICAgfSxcbiAgICAvLyB9KTtcblxuICAgIGNvbnN0IGNhY2hlU2VjdXJpdHlHcm91cCA9IG5ldyBTZWN1cml0eUdyb3VwKHRoaXMsICdjYWNoZS1zZycsIHtcbiAgICAgIHZwY0lkOiBwcm9wcy52cGMuaWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBFbGFzdGlDYWNoZScsXG4gICAgICB0YWdzOiB7XG4gICAgICAgIE5hbWU6ICdwb3J0Zm9saW8tY2FjaGUtc2cnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIG5ldyBTZWN1cml0eUdyb3VwUnVsZSh0aGlzLCAnY2FjaGUtaW5ncmVzcycsIHtcbiAgICAgIHR5cGU6ICdpbmdyZXNzJyxcbiAgICAgIGZyb21Qb3J0OiA2Mzc5LFxuICAgICAgdG9Qb3J0OiA2Mzc5LFxuICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgc2VjdXJpdHlHcm91cElkOiBjYWNoZVNlY3VyaXR5R3JvdXAuaWQsXG4gICAgICBjaWRyQmxvY2tzOiBbJzE3Mi4zMi4wLjAvMTYnXSxcbiAgICB9KTtcblxuICAgIG5ldyBTZWN1cml0eUdyb3VwUnVsZSh0aGlzLCAnY2FjaGUtZWdyZXNzJywge1xuICAgICAgdHlwZTogJ2VncmVzcycsXG4gICAgICBmcm9tUG9ydDogMCxcbiAgICAgIHRvUG9ydDogMCxcbiAgICAgIHByb3RvY29sOiAnLTEnLFxuICAgICAgc2VjdXJpdHlHcm91cElkOiBjYWNoZVNlY3VyaXR5R3JvdXAuaWQsXG4gICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgIH0pO1xuXG4gICAgdGhpcy5lbGFzdGljYWNoZVNlcnZlcmxlc3MgPSBuZXcgRWxhc3RpY2FjaGVTZXJ2ZXJsZXNzQ2FjaGUoXG4gICAgICB0aGlzLFxuICAgICAgJ21hcmtldC1kYXRhLWNhY2hlJyxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHBvcnRmb2xpby1tYXJrZXQtY2FjaGUtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBlbmdpbmU6ICd2YWxrZXknLFxuICAgICAgICBjYWNoZVVzYWdlTGltaXRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZGF0YVN0b3JhZ2U6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHVuaXQ6ICdHQicsXG4gICAgICAgICAgICAgICAgbWF4aW11bTogMTAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgZWNwdVBlclNlY29uZDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbWF4aW11bTogNTAwMCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgZGFpbHlTbmFwc2hvdFRpbWU6ICcwMzowMCcsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWFya2V0IGRhdGEgY2FjaGUgd2l0aCAxLW1pbnV0ZSBUVEwnLFxuICAgICAgICBzZWN1cml0eUdyb3VwSWRzOiBbY2FjaGVTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgc3VibmV0SWRzOiBwcm9wcy5wcml2YXRlU3VibmV0cy5tYXAoc3VibmV0ID0+IHN1Ym5ldC5pZCksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiAncG9ydGZvbGlvLW1hcmtldC1jYWNoZScsXG4gICAgICAgIH0sXG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuaGlzdG9yaWNhbERhdGFCdWNrZXQgPSBuZXcgUzNCdWNrZXQodGhpcywgJ2hpc3RvcmljYWwtZGF0YScsIHtcbiAgICAgIGJ1Y2tldDogYHBvcnRmb2xpby1oaXN0LSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9LSR7RGF0ZS5ub3coKX1gLFxuICAgICAgdGFnczoge1xuICAgICAgICBOYW1lOiBgcG9ydGZvbGlvLWhpc3RvcmljYWwtZGF0YS0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgbmV3IFMzQnVja2V0VmVyc2lvbmluZ0EodGhpcywgJ2hpc3RvcmljYWwtZGF0YS12ZXJzaW9uaW5nJywge1xuICAgICAgYnVja2V0OiB0aGlzLmhpc3RvcmljYWxEYXRhQnVja2V0LmlkLFxuICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgbmV3IFMzQnVja2V0UHVibGljQWNjZXNzQmxvY2sodGhpcywgJ2hpc3RvcmljYWwtZGF0YS1wYWInLCB7XG4gICAgICBidWNrZXQ6IHRoaXMuaGlzdG9yaWNhbERhdGFCdWNrZXQuaWQsXG4gICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==