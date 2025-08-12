"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGION_CONFIGS = void 0;
/**
 * Default configurations for different regions
 */
exports.REGION_CONFIGS = {
    'us-east-1': {
        region: 'us-east-1',
        environment: 'Production',
        vpcCidr: '10.0.0.0/16',
        database: {
            instanceClass: 'db.t3.micro',
            engine: 'mysql',
            engineVersion: '8.0.35',
            allocatedStorage: 20,
            multiAz: true,
            backupRetention: 7,
            deletionProtection: true,
            storageEncrypted: true,
            performanceInsights: true
        },
        autoScaling: {
            instanceType: 't3.micro',
            minCapacity: 2,
            maxCapacity: 10,
            desiredCapacity: 3,
            healthCheckGracePeriod: 300,
            scaleUpThreshold: 70,
            scaleDownThreshold: 30,
            scaleUpCooldown: 300,
            scaleDownCooldown: 300
        },
        loadBalancer: {
            healthCheckPath: '/',
            healthCheckInterval: 30,
            healthCheckTimeout: 5,
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 3
        },
        monitoring: {
            logRetentionDays: 7,
            alarmThresholds: {
                cpuUtilization: 80,
                memoryUtilization: 85,
                diskUtilization: 90,
                alb5xxErrorRate: 5,
                rdsCpuUtilization: 80,
                rdsFreeStorageSpace: 1000000000 // 1 GB in bytes
            }
        },
        security: {
            allowSSHAccess: true,
            sshAllowedCidrs: ['0.0.0.0/0'], // In production, restrict to specific IPs
            enableVpcFlowLogs: true,
            enableDetailedMonitoring: true
        },
        tags: {
            Environment: 'Production',
            Project: 'MultiRegionApp',
            Owner: 'Prakhar-Jain',
            Region: 'us-east-1'
        }
    },
    'us-west-2': {
        region: 'us-west-2',
        environment: 'Production',
        vpcCidr: '10.1.0.0/16',
        database: {
            instanceClass: 'db.t3.micro',
            engine: 'mysql',
            engineVersion: '8.0.35',
            allocatedStorage: 20,
            multiAz: true,
            backupRetention: 7,
            deletionProtection: true,
            storageEncrypted: true,
            performanceInsights: true
        },
        autoScaling: {
            instanceType: 't3.micro',
            minCapacity: 2,
            maxCapacity: 10,
            desiredCapacity: 3,
            healthCheckGracePeriod: 300,
            scaleUpThreshold: 70,
            scaleDownThreshold: 30,
            scaleUpCooldown: 300,
            scaleDownCooldown: 300
        },
        loadBalancer: {
            healthCheckPath: '/',
            healthCheckInterval: 30,
            healthCheckTimeout: 5,
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 3
        },
        monitoring: {
            logRetentionDays: 7,
            alarmThresholds: {
                cpuUtilization: 80,
                memoryUtilization: 85,
                diskUtilization: 90,
                alb5xxErrorRate: 5,
                rdsCpuUtilization: 80,
                rdsFreeStorageSpace: 1000000000 // 1 GB in bytes
            }
        },
        security: {
            allowSSHAccess: true,
            sshAllowedCidrs: ['0.0.0.0/0'], // In production, restrict to specific IPs
            enableVpcFlowLogs: true,
            enableDetailedMonitoring: true
        },
        tags: {
            Environment: 'Production',
            Project: 'MultiRegionApp',
            Owner: 'Prakhar-Jain',
            Region: 'us-west-2'
        }
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhY2stY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3RhY2stY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQTBFRTs7R0FFRztBQUNVLFFBQUEsY0FBYyxHQUFzQztJQUMvRCxXQUFXLEVBQUU7UUFDWCxNQUFNLEVBQUUsV0FBVztRQUNuQixXQUFXLEVBQUUsWUFBWTtRQUN6QixPQUFPLEVBQUUsYUFBYTtRQUN0QixRQUFRLEVBQUU7WUFDUixhQUFhLEVBQUUsYUFBYTtZQUM1QixNQUFNLEVBQUUsT0FBTztZQUNmLGFBQWEsRUFBRSxRQUFRO1lBQ3ZCLGdCQUFnQixFQUFFLEVBQUU7WUFDcEIsT0FBTyxFQUFFLElBQUk7WUFDYixlQUFlLEVBQUUsQ0FBQztZQUNsQixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsbUJBQW1CLEVBQUUsSUFBSTtTQUMxQjtRQUNELFdBQVcsRUFBRTtZQUNYLFlBQVksRUFBRSxVQUFVO1lBQ3hCLFdBQVcsRUFBRSxDQUFDO1lBQ2QsV0FBVyxFQUFFLEVBQUU7WUFDZixlQUFlLEVBQUUsQ0FBQztZQUNsQixzQkFBc0IsRUFBRSxHQUFHO1lBQzNCLGdCQUFnQixFQUFFLEVBQUU7WUFDcEIsa0JBQWtCLEVBQUUsRUFBRTtZQUN0QixlQUFlLEVBQUUsR0FBRztZQUNwQixpQkFBaUIsRUFBRSxHQUFHO1NBQ3ZCO1FBQ0QsWUFBWSxFQUFFO1lBQ1osZUFBZSxFQUFFLEdBQUc7WUFDcEIsbUJBQW1CLEVBQUUsRUFBRTtZQUN2QixrQkFBa0IsRUFBRSxDQUFDO1lBQ3JCLHFCQUFxQixFQUFFLENBQUM7WUFDeEIsdUJBQXVCLEVBQUUsQ0FBQztTQUMzQjtRQUNELFVBQVUsRUFBRTtZQUNWLGdCQUFnQixFQUFFLENBQUM7WUFDbkIsZUFBZSxFQUFFO2dCQUNmLGNBQWMsRUFBRSxFQUFFO2dCQUNsQixpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixlQUFlLEVBQUUsRUFBRTtnQkFDbkIsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxnQkFBZ0I7YUFDakQ7U0FDRjtRQUNELFFBQVEsRUFBRTtZQUNSLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLDBDQUEwQztZQUMxRSxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLHdCQUF3QixFQUFFLElBQUk7U0FDL0I7UUFDRCxJQUFJLEVBQUU7WUFDSixXQUFXLEVBQUUsWUFBWTtZQUN6QixPQUFPLEVBQUUsZ0JBQWdCO1lBQ3pCLEtBQUssRUFBRSxjQUFjO1lBQ3JCLE1BQU0sRUFBRSxXQUFXO1NBQ3BCO0tBQ0Y7SUFDRCxXQUFXLEVBQUU7UUFDWCxNQUFNLEVBQUUsV0FBVztRQUNuQixXQUFXLEVBQUUsWUFBWTtRQUN6QixPQUFPLEVBQUUsYUFBYTtRQUN0QixRQUFRLEVBQUU7WUFDUixhQUFhLEVBQUUsYUFBYTtZQUM1QixNQUFNLEVBQUUsT0FBTztZQUNmLGFBQWEsRUFBRSxRQUFRO1lBQ3ZCLGdCQUFnQixFQUFFLEVBQUU7WUFDcEIsT0FBTyxFQUFFLElBQUk7WUFDYixlQUFlLEVBQUUsQ0FBQztZQUNsQixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsbUJBQW1CLEVBQUUsSUFBSTtTQUMxQjtRQUNELFdBQVcsRUFBRTtZQUNYLFlBQVksRUFBRSxVQUFVO1lBQ3hCLFdBQVcsRUFBRSxDQUFDO1lBQ2QsV0FBVyxFQUFFLEVBQUU7WUFDZixlQUFlLEVBQUUsQ0FBQztZQUNsQixzQkFBc0IsRUFBRSxHQUFHO1lBQzNCLGdCQUFnQixFQUFFLEVBQUU7WUFDcEIsa0JBQWtCLEVBQUUsRUFBRTtZQUN0QixlQUFlLEVBQUUsR0FBRztZQUNwQixpQkFBaUIsRUFBRSxHQUFHO1NBQ3ZCO1FBQ0QsWUFBWSxFQUFFO1lBQ1osZUFBZSxFQUFFLEdBQUc7WUFDcEIsbUJBQW1CLEVBQUUsRUFBRTtZQUN2QixrQkFBa0IsRUFBRSxDQUFDO1lBQ3JCLHFCQUFxQixFQUFFLENBQUM7WUFDeEIsdUJBQXVCLEVBQUUsQ0FBQztTQUMzQjtRQUNELFVBQVUsRUFBRTtZQUNWLGdCQUFnQixFQUFFLENBQUM7WUFDbkIsZUFBZSxFQUFFO2dCQUNmLGNBQWMsRUFBRSxFQUFFO2dCQUNsQixpQkFBaUIsRUFBRSxFQUFFO2dCQUNyQixlQUFlLEVBQUUsRUFBRTtnQkFDbkIsZUFBZSxFQUFFLENBQUM7Z0JBQ2xCLGlCQUFpQixFQUFFLEVBQUU7Z0JBQ3JCLG1CQUFtQixFQUFFLFVBQVUsQ0FBQyxnQkFBZ0I7YUFDakQ7U0FDRjtRQUNELFFBQVEsRUFBRTtZQUNSLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxFQUFFLDBDQUEwQztZQUMxRSxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLHdCQUF3QixFQUFFLElBQUk7U0FDL0I7UUFDRCxJQUFJLEVBQUU7WUFDSixXQUFXLEVBQUUsWUFBWTtZQUN6QixPQUFPLEVBQUUsZ0JBQWdCO1lBQ3pCLEtBQUssRUFBRSxjQUFjO1lBQ3JCLE1BQU0sRUFBRSxXQUFXO1NBQ3BCO0tBQ0Y7Q0FDRixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb25maWd1cmF0aW9uIGludGVyZmFjZSBmb3IgbXVsdGktcmVnaW9uIHN0YWNrIGRlcGxveW1lbnRcbiAqIERlZmluZXMgdGhlIHN0cnVjdHVyZSBmb3IgcmVnaW9uLXNwZWNpZmljIGFuZCBnbG9iYWwgY29uZmlndXJhdGlvbnNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBTdGFja0NvbmZpZyB7XG4gICAgLyoqIEFXUyByZWdpb24gZm9yIGRlcGxveW1lbnQgKi9cbiAgICByZWdpb246IHN0cmluZztcbiAgICBcbiAgICAvKiogRW52aXJvbm1lbnQgbmFtZSAoZS5nLiwgcHJvZHVjdGlvbiwgc3RhZ2luZykgKi9cbiAgICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICAgIFxuICAgIC8qKiBWUEMgQ0lEUiBibG9jayBmb3IgdGhlIHJlZ2lvbiAqL1xuICAgIHZwY0NpZHI6IHN0cmluZztcbiAgICBcbiAgICAvKiogRGF0YWJhc2UgY29uZmlndXJhdGlvbiAqL1xuICAgIGRhdGFiYXNlOiB7XG4gICAgICBpbnN0YW5jZUNsYXNzOiBzdHJpbmc7XG4gICAgICBlbmdpbmU6IHN0cmluZztcbiAgICAgIGVuZ2luZVZlcnNpb246IHN0cmluZztcbiAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IG51bWJlcjtcbiAgICAgIG11bHRpQXo6IGJvb2xlYW47XG4gICAgICBiYWNrdXBSZXRlbnRpb246IG51bWJlcjtcbiAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogYm9vbGVhbjtcbiAgICAgIHN0b3JhZ2VFbmNyeXB0ZWQ6IGJvb2xlYW47XG4gICAgICBwZXJmb3JtYW5jZUluc2lnaHRzOiBib29sZWFuO1xuICAgIH07XG4gICAgXG4gICAgLyoqIEVDMiBBdXRvIFNjYWxpbmcgY29uZmlndXJhdGlvbiAqL1xuICAgIGF1dG9TY2FsaW5nOiB7XG4gICAgICBpbnN0YW5jZVR5cGU6IHN0cmluZztcbiAgICAgIG1pbkNhcGFjaXR5OiBudW1iZXI7XG4gICAgICBtYXhDYXBhY2l0eTogbnVtYmVyO1xuICAgICAgZGVzaXJlZENhcGFjaXR5OiBudW1iZXI7XG4gICAgICBoZWFsdGhDaGVja0dyYWNlUGVyaW9kOiBudW1iZXI7XG4gICAgICBzY2FsZVVwVGhyZXNob2xkOiBudW1iZXI7XG4gICAgICBzY2FsZURvd25UaHJlc2hvbGQ6IG51bWJlcjtcbiAgICAgIHNjYWxlVXBDb29sZG93bjogbnVtYmVyO1xuICAgICAgc2NhbGVEb3duQ29vbGRvd246IG51bWJlcjtcbiAgICB9O1xuICAgIFxuICAgIC8qKiBMb2FkIEJhbGFuY2VyIGNvbmZpZ3VyYXRpb24gKi9cbiAgICBsb2FkQmFsYW5jZXI6IHtcbiAgICAgIGhlYWx0aENoZWNrUGF0aDogc3RyaW5nO1xuICAgICAgaGVhbHRoQ2hlY2tJbnRlcnZhbDogbnVtYmVyO1xuICAgICAgaGVhbHRoQ2hlY2tUaW1lb3V0OiBudW1iZXI7XG4gICAgICBoZWFsdGh5VGhyZXNob2xkQ291bnQ6IG51bWJlcjtcbiAgICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiBudW1iZXI7XG4gICAgfTtcbiAgICBcbiAgICAvKiogTW9uaXRvcmluZyBjb25maWd1cmF0aW9uICovXG4gICAgbW9uaXRvcmluZzoge1xuICAgICAgbG9nUmV0ZW50aW9uRGF5czogbnVtYmVyO1xuICAgICAgYWxhcm1UaHJlc2hvbGRzOiB7XG4gICAgICAgIGNwdVV0aWxpemF0aW9uOiBudW1iZXI7XG4gICAgICAgIG1lbW9yeVV0aWxpemF0aW9uOiBudW1iZXI7XG4gICAgICAgIGRpc2tVdGlsaXphdGlvbjogbnVtYmVyO1xuICAgICAgICBhbGI1eHhFcnJvclJhdGU6IG51bWJlcjtcbiAgICAgICAgcmRzQ3B1VXRpbGl6YXRpb246IG51bWJlcjtcbiAgICAgICAgcmRzRnJlZVN0b3JhZ2VTcGFjZTogbnVtYmVyO1xuICAgICAgfTtcbiAgICB9O1xuICAgIFxuICAgIC8qKiBTZWN1cml0eSBjb25maWd1cmF0aW9uICovXG4gICAgc2VjdXJpdHk6IHtcbiAgICAgIGFsbG93U1NIQWNjZXNzOiBib29sZWFuO1xuICAgICAgc3NoQWxsb3dlZENpZHJzOiBzdHJpbmdbXTtcbiAgICAgIGVuYWJsZVZwY0Zsb3dMb2dzOiBib29sZWFuO1xuICAgICAgZW5hYmxlRGV0YWlsZWRNb25pdG9yaW5nOiBib29sZWFuO1xuICAgIH07XG4gICAgXG4gICAgLyoqIENvbW1vbiB0YWdzIGFwcGxpZWQgdG8gYWxsIHJlc291cmNlcyAqL1xuICAgIHRhZ3M6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWZhdWx0IGNvbmZpZ3VyYXRpb25zIGZvciBkaWZmZXJlbnQgcmVnaW9uc1xuICAgKi9cbiAgZXhwb3J0IGNvbnN0IFJFR0lPTl9DT05GSUdTOiB7IFtyZWdpb246IHN0cmluZ106IFN0YWNrQ29uZmlnIH0gPSB7XG4gICAgJ3VzLWVhc3QtMSc6IHtcbiAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMScsXG4gICAgICBlbnZpcm9ubWVudDogJ1Byb2R1Y3Rpb24nLFxuICAgICAgdnBjQ2lkcjogJzEwLjAuMC4wLzE2JyxcbiAgICAgIGRhdGFiYXNlOiB7XG4gICAgICAgIGluc3RhbmNlQ2xhc3M6ICdkYi50My5taWNybycsXG4gICAgICAgIGVuZ2luZTogJ215c3FsJyxcbiAgICAgICAgZW5naW5lVmVyc2lvbjogJzguMC4zNScsXG4gICAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IDIwLFxuICAgICAgICBtdWx0aUF6OiB0cnVlLFxuICAgICAgICBiYWNrdXBSZXRlbnRpb246IDcsXG4gICAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgc3RvcmFnZUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0czogdHJ1ZVxuICAgICAgfSxcbiAgICAgIGF1dG9TY2FsaW5nOiB7XG4gICAgICAgIGluc3RhbmNlVHlwZTogJ3QzLm1pY3JvJyxcbiAgICAgICAgbWluQ2FwYWNpdHk6IDIsXG4gICAgICAgIG1heENhcGFjaXR5OiAxMCxcbiAgICAgICAgZGVzaXJlZENhcGFjaXR5OiAzLFxuICAgICAgICBoZWFsdGhDaGVja0dyYWNlUGVyaW9kOiAzMDAsXG4gICAgICAgIHNjYWxlVXBUaHJlc2hvbGQ6IDcwLFxuICAgICAgICBzY2FsZURvd25UaHJlc2hvbGQ6IDMwLFxuICAgICAgICBzY2FsZVVwQ29vbGRvd246IDMwMCxcbiAgICAgICAgc2NhbGVEb3duQ29vbGRvd246IDMwMFxuICAgICAgfSxcbiAgICAgIGxvYWRCYWxhbmNlcjoge1xuICAgICAgICBoZWFsdGhDaGVja1BhdGg6ICcvJyxcbiAgICAgICAgaGVhbHRoQ2hlY2tJbnRlcnZhbDogMzAsXG4gICAgICAgIGhlYWx0aENoZWNrVGltZW91dDogNSxcbiAgICAgICAgaGVhbHRoeVRocmVzaG9sZENvdW50OiAyLFxuICAgICAgICB1bmhlYWx0aHlUaHJlc2hvbGRDb3VudDogM1xuICAgICAgfSxcbiAgICAgIG1vbml0b3Jpbmc6IHtcbiAgICAgICAgbG9nUmV0ZW50aW9uRGF5czogNyxcbiAgICAgICAgYWxhcm1UaHJlc2hvbGRzOiB7XG4gICAgICAgICAgY3B1VXRpbGl6YXRpb246IDgwLFxuICAgICAgICAgIG1lbW9yeVV0aWxpemF0aW9uOiA4NSxcbiAgICAgICAgICBkaXNrVXRpbGl6YXRpb246IDkwLFxuICAgICAgICAgIGFsYjV4eEVycm9yUmF0ZTogNSxcbiAgICAgICAgICByZHNDcHVVdGlsaXphdGlvbjogODAsXG4gICAgICAgICAgcmRzRnJlZVN0b3JhZ2VTcGFjZTogMTAwMDAwMDAwMCAvLyAxIEdCIGluIGJ5dGVzXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZWN1cml0eToge1xuICAgICAgICBhbGxvd1NTSEFjY2VzczogdHJ1ZSxcbiAgICAgICAgc3NoQWxsb3dlZENpZHJzOiBbJzAuMC4wLjAvMCddLCAvLyBJbiBwcm9kdWN0aW9uLCByZXN0cmljdCB0byBzcGVjaWZpYyBJUHNcbiAgICAgICAgZW5hYmxlVnBjRmxvd0xvZ3M6IHRydWUsXG4gICAgICAgIGVuYWJsZURldGFpbGVkTW9uaXRvcmluZzogdHJ1ZVxuICAgICAgfSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdQcm9kdWN0aW9uJyxcbiAgICAgICAgUHJvamVjdDogJ011bHRpUmVnaW9uQXBwJyxcbiAgICAgICAgT3duZXI6ICdQcmFraGFyLUphaW4nLFxuICAgICAgICBSZWdpb246ICd1cy1lYXN0LTEnXG4gICAgICB9XG4gICAgfSxcbiAgICAndXMtd2VzdC0yJzoge1xuICAgICAgcmVnaW9uOiAndXMtd2VzdC0yJyxcbiAgICAgIGVudmlyb25tZW50OiAnUHJvZHVjdGlvbicsXG4gICAgICB2cGNDaWRyOiAnMTAuMS4wLjAvMTYnLFxuICAgICAgZGF0YWJhc2U6IHtcbiAgICAgICAgaW5zdGFuY2VDbGFzczogJ2RiLnQzLm1pY3JvJyxcbiAgICAgICAgZW5naW5lOiAnbXlzcWwnLFxuICAgICAgICBlbmdpbmVWZXJzaW9uOiAnOC4wLjM1JyxcbiAgICAgICAgYWxsb2NhdGVkU3RvcmFnZTogMjAsXG4gICAgICAgIG11bHRpQXo6IHRydWUsXG4gICAgICAgIGJhY2t1cFJldGVudGlvbjogNyxcbiAgICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICBzdG9yYWdlRW5jcnlwdGVkOiB0cnVlLFxuICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzOiB0cnVlXG4gICAgICB9LFxuICAgICAgYXV0b1NjYWxpbmc6IHtcbiAgICAgICAgaW5zdGFuY2VUeXBlOiAndDMubWljcm8nLFxuICAgICAgICBtaW5DYXBhY2l0eTogMixcbiAgICAgICAgbWF4Q2FwYWNpdHk6IDEwLFxuICAgICAgICBkZXNpcmVkQ2FwYWNpdHk6IDMsXG4gICAgICAgIGhlYWx0aENoZWNrR3JhY2VQZXJpb2Q6IDMwMCxcbiAgICAgICAgc2NhbGVVcFRocmVzaG9sZDogNzAsXG4gICAgICAgIHNjYWxlRG93blRocmVzaG9sZDogMzAsXG4gICAgICAgIHNjYWxlVXBDb29sZG93bjogMzAwLFxuICAgICAgICBzY2FsZURvd25Db29sZG93bjogMzAwXG4gICAgICB9LFxuICAgICAgbG9hZEJhbGFuY2VyOiB7XG4gICAgICAgIGhlYWx0aENoZWNrUGF0aDogJy8nLFxuICAgICAgICBoZWFsdGhDaGVja0ludGVydmFsOiAzMCxcbiAgICAgICAgaGVhbHRoQ2hlY2tUaW1lb3V0OiA1LFxuICAgICAgICBoZWFsdGh5VGhyZXNob2xkQ291bnQ6IDIsXG4gICAgICAgIHVuaGVhbHRoeVRocmVzaG9sZENvdW50OiAzXG4gICAgICB9LFxuICAgICAgbW9uaXRvcmluZzoge1xuICAgICAgICBsb2dSZXRlbnRpb25EYXlzOiA3LFxuICAgICAgICBhbGFybVRocmVzaG9sZHM6IHtcbiAgICAgICAgICBjcHVVdGlsaXphdGlvbjogODAsXG4gICAgICAgICAgbWVtb3J5VXRpbGl6YXRpb246IDg1LFxuICAgICAgICAgIGRpc2tVdGlsaXphdGlvbjogOTAsXG4gICAgICAgICAgYWxiNXh4RXJyb3JSYXRlOiA1LFxuICAgICAgICAgIHJkc0NwdVV0aWxpemF0aW9uOiA4MCxcbiAgICAgICAgICByZHNGcmVlU3RvcmFnZVNwYWNlOiAxMDAwMDAwMDAwIC8vIDEgR0IgaW4gYnl0ZXNcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHNlY3VyaXR5OiB7XG4gICAgICAgIGFsbG93U1NIQWNjZXNzOiB0cnVlLFxuICAgICAgICBzc2hBbGxvd2VkQ2lkcnM6IFsnMC4wLjAuMC8wJ10sIC8vIEluIHByb2R1Y3Rpb24sIHJlc3RyaWN0IHRvIHNwZWNpZmljIElQc1xuICAgICAgICBlbmFibGVWcGNGbG93TG9nczogdHJ1ZSxcbiAgICAgICAgZW5hYmxlRGV0YWlsZWRNb25pdG9yaW5nOiB0cnVlXG4gICAgICB9LFxuICAgICAgdGFnczoge1xuICAgICAgICBFbnZpcm9ubWVudDogJ1Byb2R1Y3Rpb24nLFxuICAgICAgICBQcm9qZWN0OiAnTXVsdGlSZWdpb25BcHAnLFxuICAgICAgICBPd25lcjogJ1ByYWtoYXItSmFpbicsXG4gICAgICAgIFJlZ2lvbjogJ3VzLXdlc3QtMidcbiAgICAgIH1cbiAgICB9XG4gIH07Il19