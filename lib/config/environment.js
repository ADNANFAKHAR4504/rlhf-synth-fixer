"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommonTags = exports.getEnvironmentConfig = void 0;
const getEnvironmentConfig = (env = 'dev', environmentSuffix = 'dev') => {
    const baseConfig = {
        project: 'tap-infrastructure',
        costCenter: 'engineering',
        owner: 'platform-team',
        environmentSuffix,
    };
    const configs = {
        dev: {
            ...baseConfig,
            environment: 'dev',
            trustedAccountId: '123456789012',
            createNatGateways: true,
            regions: [
                {
                    region: 'us-east-1',
                    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                    vpcCidr: '10.0.0.0/16',
                    publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
                    privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
                },
                {
                    region: 'eu-west-1',
                    availabilityZones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
                    vpcCidr: '10.1.0.0/16',
                    publicSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'],
                    privateSubnetCidrs: ['10.1.11.0/24', '10.1.12.0/24', '10.1.13.0/24'],
                },
                {
                    region: 'ap-southeast-2',
                    availabilityZones: [
                        'ap-southeast-2a',
                        'ap-southeast-2b',
                        'ap-southeast-2c',
                    ],
                    vpcCidr: '10.2.0.0/16',
                    publicSubnetCidrs: ['10.2.1.0/24', '10.2.2.0/24', '10.2.3.0/24'],
                    privateSubnetCidrs: ['10.2.11.0/24', '10.2.12.0/24', '10.2.13.0/24'],
                },
            ],
        },
        prod: {
            ...baseConfig,
            environment: 'prod',
            trustedAccountId: '987654321098',
            createNatGateways: true,
            regions: [
                {
                    region: 'us-east-1',
                    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
                    vpcCidr: '172.16.0.0/16',
                    publicSubnetCidrs: [
                        '172.16.1.0/24',
                        '172.16.2.0/24',
                        '172.16.3.0/24',
                    ],
                    privateSubnetCidrs: [
                        '172.16.11.0/24',
                        '172.16.12.0/24',
                        '172.16.13.0/24',
                    ],
                },
                {
                    region: 'eu-west-1',
                    availabilityZones: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
                    vpcCidr: '172.17.0.0/16',
                    publicSubnetCidrs: [
                        '172.17.1.0/24',
                        '172.17.2.0/24',
                        '172.17.3.0/24',
                    ],
                    privateSubnetCidrs: [
                        '172.17.11.0/24',
                        '172.17.12.0/24',
                        '172.17.13.0/24',
                    ],
                },
                {
                    region: 'ap-southeast-2',
                    availabilityZones: [
                        'ap-southeast-2a',
                        'ap-southeast-2b',
                        'ap-southeast-2c',
                    ],
                    vpcCidr: '172.18.0.0/16',
                    publicSubnetCidrs: [
                        '172.18.1.0/24',
                        '172.18.2.0/24',
                        '172.18.3.0/24',
                    ],
                    privateSubnetCidrs: [
                        '172.18.11.0/24',
                        '172.18.12.0/24',
                        '172.18.13.0/24',
                    ],
                },
            ],
        },
    };
    return configs[env] || configs.dev;
};
exports.getEnvironmentConfig = getEnvironmentConfig;
const getCommonTags = (config, region) => ({
    Environment: config.environment,
    Project: config.project,
    CostCenter: config.costCenter,
    Owner: config.owner,
    Region: region,
    ManagedBy: 'terraform',
    CreatedAt: new Date().toISOString().split('T')[0],
});
exports.getCommonTags = getCommonTags;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW52aXJvbm1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbnZpcm9ubWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFvQk8sTUFBTSxvQkFBb0IsR0FBRyxDQUNsQyxNQUFjLEtBQUssRUFDbkIsb0JBQTRCLEtBQUssRUFDZCxFQUFFO0lBQ3JCLE1BQU0sVUFBVSxHQUFHO1FBQ2pCLE9BQU8sRUFBRSxvQkFBb0I7UUFDN0IsVUFBVSxFQUFFLGFBQWE7UUFDekIsS0FBSyxFQUFFLGVBQWU7UUFDdEIsaUJBQWlCO0tBQ2xCLENBQUM7SUFFRixNQUFNLE9BQU8sR0FBc0M7UUFDakQsR0FBRyxFQUFFO1lBQ0gsR0FBRyxVQUFVO1lBQ2IsV0FBVyxFQUFFLEtBQUs7WUFDbEIsZ0JBQWdCLEVBQUUsY0FBYztZQUNoQyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxNQUFNLEVBQUUsV0FBVztvQkFDbkIsaUJBQWlCLEVBQUUsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLFlBQVksQ0FBQztvQkFDN0QsT0FBTyxFQUFFLGFBQWE7b0JBQ3RCLGlCQUFpQixFQUFFLENBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUM7b0JBQ2hFLGtCQUFrQixFQUFFLENBQUMsY0FBYyxFQUFFLGNBQWMsRUFBRSxjQUFjLENBQUM7aUJBQ3JFO2dCQUNEO29CQUNFLE1BQU0sRUFBRSxXQUFXO29CQUNuQixpQkFBaUIsRUFBRSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDO29CQUM3RCxPQUFPLEVBQUUsYUFBYTtvQkFDdEIsaUJBQWlCLEVBQUUsQ0FBQyxhQUFhLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQztvQkFDaEUsa0JBQWtCLEVBQUUsQ0FBQyxjQUFjLEVBQUUsY0FBYyxFQUFFLGNBQWMsQ0FBQztpQkFDckU7Z0JBQ0Q7b0JBQ0UsTUFBTSxFQUFFLGdCQUFnQjtvQkFDeEIsaUJBQWlCLEVBQUU7d0JBQ2pCLGlCQUFpQjt3QkFDakIsaUJBQWlCO3dCQUNqQixpQkFBaUI7cUJBQ2xCO29CQUNELE9BQU8sRUFBRSxhQUFhO29CQUN0QixpQkFBaUIsRUFBRSxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDO29CQUNoRSxrQkFBa0IsRUFBRSxDQUFDLGNBQWMsRUFBRSxjQUFjLEVBQUUsY0FBYyxDQUFDO2lCQUNyRTthQUNGO1NBQ0Y7UUFDRCxJQUFJLEVBQUU7WUFDSixHQUFHLFVBQVU7WUFDYixXQUFXLEVBQUUsTUFBTTtZQUNuQixnQkFBZ0IsRUFBRSxjQUFjO1lBQ2hDLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsT0FBTyxFQUFFO2dCQUNQO29CQUNFLE1BQU0sRUFBRSxXQUFXO29CQUNuQixpQkFBaUIsRUFBRSxDQUFDLFlBQVksRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDO29CQUM3RCxPQUFPLEVBQUUsZUFBZTtvQkFDeEIsaUJBQWlCLEVBQUU7d0JBQ2pCLGVBQWU7d0JBQ2YsZUFBZTt3QkFDZixlQUFlO3FCQUNoQjtvQkFDRCxrQkFBa0IsRUFBRTt3QkFDbEIsZ0JBQWdCO3dCQUNoQixnQkFBZ0I7d0JBQ2hCLGdCQUFnQjtxQkFDakI7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsTUFBTSxFQUFFLFdBQVc7b0JBQ25CLGlCQUFpQixFQUFFLENBQUMsWUFBWSxFQUFFLFlBQVksRUFBRSxZQUFZLENBQUM7b0JBQzdELE9BQU8sRUFBRSxlQUFlO29CQUN4QixpQkFBaUIsRUFBRTt3QkFDakIsZUFBZTt3QkFDZixlQUFlO3dCQUNmLGVBQWU7cUJBQ2hCO29CQUNELGtCQUFrQixFQUFFO3dCQUNsQixnQkFBZ0I7d0JBQ2hCLGdCQUFnQjt3QkFDaEIsZ0JBQWdCO3FCQUNqQjtpQkFDRjtnQkFDRDtvQkFDRSxNQUFNLEVBQUUsZ0JBQWdCO29CQUN4QixpQkFBaUIsRUFBRTt3QkFDakIsaUJBQWlCO3dCQUNqQixpQkFBaUI7d0JBQ2pCLGlCQUFpQjtxQkFDbEI7b0JBQ0QsT0FBTyxFQUFFLGVBQWU7b0JBQ3hCLGlCQUFpQixFQUFFO3dCQUNqQixlQUFlO3dCQUNmLGVBQWU7d0JBQ2YsZUFBZTtxQkFDaEI7b0JBQ0Qsa0JBQWtCLEVBQUU7d0JBQ2xCLGdCQUFnQjt3QkFDaEIsZ0JBQWdCO3dCQUNoQixnQkFBZ0I7cUJBQ2pCO2lCQUNGO2FBQ0Y7U0FDRjtLQUNGLENBQUM7SUFFRixPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDO0FBQ3JDLENBQUMsQ0FBQztBQXpHVyxRQUFBLG9CQUFvQix3QkF5Ry9CO0FBRUssTUFBTSxhQUFhLEdBQUcsQ0FBQyxNQUF5QixFQUFFLE1BQWMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzRSxXQUFXLEVBQUUsTUFBTSxDQUFDLFdBQVc7SUFDL0IsT0FBTyxFQUFFLE1BQU0sQ0FBQyxPQUFPO0lBQ3ZCLFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVTtJQUM3QixLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUs7SUFDbkIsTUFBTSxFQUFFLE1BQU07SUFDZCxTQUFTLEVBQUUsV0FBVztJQUN0QixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2xELENBQUMsQ0FBQztBQVJVLFFBQUEsYUFBYSxpQkFRdkIiLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgaW50ZXJmYWNlIFJlZ2lvbkNvbmZpZyB7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBhdmFpbGFiaWxpdHlab25lczogc3RyaW5nW107XG4gIHZwY0NpZHI6IHN0cmluZztcbiAgcHVibGljU3VibmV0Q2lkcnM6IHN0cmluZ1tdO1xuICBwcml2YXRlU3VibmV0Q2lkcnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVudmlyb25tZW50Q29uZmlnIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgcHJvamVjdDogc3RyaW5nO1xuICBjb3N0Q2VudGVyOiBzdHJpbmc7XG4gIG93bmVyOiBzdHJpbmc7XG4gIHJlZ2lvbnM6IFJlZ2lvbkNvbmZpZ1tdO1xuICBjcm9zc0FjY291bnRSb2xlQXJuPzogc3RyaW5nO1xuICB0cnVzdGVkQWNjb3VudElkPzogc3RyaW5nO1xuICBjcmVhdGVOYXRHYXRld2F5cz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjb25zdCBnZXRFbnZpcm9ubWVudENvbmZpZyA9IChcbiAgZW52OiBzdHJpbmcgPSAnZGV2JyxcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZyA9ICdkZXYnXG4pOiBFbnZpcm9ubWVudENvbmZpZyA9PiB7XG4gIGNvbnN0IGJhc2VDb25maWcgPSB7XG4gICAgcHJvamVjdDogJ3RhcC1pbmZyYXN0cnVjdHVyZScsXG4gICAgY29zdENlbnRlcjogJ2VuZ2luZWVyaW5nJyxcbiAgICBvd25lcjogJ3BsYXRmb3JtLXRlYW0nLFxuICAgIGVudmlyb25tZW50U3VmZml4LFxuICB9O1xuXG4gIGNvbnN0IGNvbmZpZ3M6IFJlY29yZDxzdHJpbmcsIEVudmlyb25tZW50Q29uZmlnPiA9IHtcbiAgICBkZXY6IHtcbiAgICAgIC4uLmJhc2VDb25maWcsXG4gICAgICBlbnZpcm9ubWVudDogJ2RldicsXG4gICAgICB0cnVzdGVkQWNjb3VudElkOiAnMTIzNDU2Nzg5MDEyJyxcbiAgICAgIGNyZWF0ZU5hdEdhdGV3YXlzOiB0cnVlLFxuICAgICAgcmVnaW9uczogW1xuICAgICAgICB7XG4gICAgICAgICAgcmVnaW9uOiAndXMtZWFzdC0xJyxcbiAgICAgICAgICBhdmFpbGFiaWxpdHlab25lczogWyd1cy1lYXN0LTFhJywgJ3VzLWVhc3QtMWInLCAndXMtZWFzdC0xYyddLFxuICAgICAgICAgIHZwY0NpZHI6ICcxMC4wLjAuMC8xNicsXG4gICAgICAgICAgcHVibGljU3VibmV0Q2lkcnM6IFsnMTAuMC4xLjAvMjQnLCAnMTAuMC4yLjAvMjQnLCAnMTAuMC4zLjAvMjQnXSxcbiAgICAgICAgICBwcml2YXRlU3VibmV0Q2lkcnM6IFsnMTAuMC4xMS4wLzI0JywgJzEwLjAuMTIuMC8yNCcsICcxMC4wLjEzLjAvMjQnXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJlZ2lvbjogJ2V1LXdlc3QtMScsXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZXM6IFsnZXUtd2VzdC0xYScsICdldS13ZXN0LTFiJywgJ2V1LXdlc3QtMWMnXSxcbiAgICAgICAgICB2cGNDaWRyOiAnMTAuMS4wLjAvMTYnLFxuICAgICAgICAgIHB1YmxpY1N1Ym5ldENpZHJzOiBbJzEwLjEuMS4wLzI0JywgJzEwLjEuMi4wLzI0JywgJzEwLjEuMy4wLzI0J10sXG4gICAgICAgICAgcHJpdmF0ZVN1Ym5ldENpZHJzOiBbJzEwLjEuMTEuMC8yNCcsICcxMC4xLjEyLjAvMjQnLCAnMTAuMS4xMy4wLzI0J10sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICByZWdpb246ICdhcC1zb3V0aGVhc3QtMicsXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZXM6IFtcbiAgICAgICAgICAgICdhcC1zb3V0aGVhc3QtMmEnLFxuICAgICAgICAgICAgJ2FwLXNvdXRoZWFzdC0yYicsXG4gICAgICAgICAgICAnYXAtc291dGhlYXN0LTJjJyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIHZwY0NpZHI6ICcxMC4yLjAuMC8xNicsXG4gICAgICAgICAgcHVibGljU3VibmV0Q2lkcnM6IFsnMTAuMi4xLjAvMjQnLCAnMTAuMi4yLjAvMjQnLCAnMTAuMi4zLjAvMjQnXSxcbiAgICAgICAgICBwcml2YXRlU3VibmV0Q2lkcnM6IFsnMTAuMi4xMS4wLzI0JywgJzEwLjIuMTIuMC8yNCcsICcxMC4yLjEzLjAvMjQnXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBwcm9kOiB7XG4gICAgICAuLi5iYXNlQ29uZmlnLFxuICAgICAgZW52aXJvbm1lbnQ6ICdwcm9kJyxcbiAgICAgIHRydXN0ZWRBY2NvdW50SWQ6ICc5ODc2NTQzMjEwOTgnLFxuICAgICAgY3JlYXRlTmF0R2F0ZXdheXM6IHRydWUsXG4gICAgICByZWdpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmVzOiBbJ3VzLWVhc3QtMWEnLCAndXMtZWFzdC0xYicsICd1cy1lYXN0LTFjJ10sXG4gICAgICAgICAgdnBjQ2lkcjogJzE3Mi4xNi4wLjAvMTYnLFxuICAgICAgICAgIHB1YmxpY1N1Ym5ldENpZHJzOiBbXG4gICAgICAgICAgICAnMTcyLjE2LjEuMC8yNCcsXG4gICAgICAgICAgICAnMTcyLjE2LjIuMC8yNCcsXG4gICAgICAgICAgICAnMTcyLjE2LjMuMC8yNCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBwcml2YXRlU3VibmV0Q2lkcnM6IFtcbiAgICAgICAgICAgICcxNzIuMTYuMTEuMC8yNCcsXG4gICAgICAgICAgICAnMTcyLjE2LjEyLjAvMjQnLFxuICAgICAgICAgICAgJzE3Mi4xNi4xMy4wLzI0JyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgcmVnaW9uOiAnZXUtd2VzdC0xJyxcbiAgICAgICAgICBhdmFpbGFiaWxpdHlab25lczogWydldS13ZXN0LTFhJywgJ2V1LXdlc3QtMWInLCAnZXUtd2VzdC0xYyddLFxuICAgICAgICAgIHZwY0NpZHI6ICcxNzIuMTcuMC4wLzE2JyxcbiAgICAgICAgICBwdWJsaWNTdWJuZXRDaWRyczogW1xuICAgICAgICAgICAgJzE3Mi4xNy4xLjAvMjQnLFxuICAgICAgICAgICAgJzE3Mi4xNy4yLjAvMjQnLFxuICAgICAgICAgICAgJzE3Mi4xNy4zLjAvMjQnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgcHJpdmF0ZVN1Ym5ldENpZHJzOiBbXG4gICAgICAgICAgICAnMTcyLjE3LjExLjAvMjQnLFxuICAgICAgICAgICAgJzE3Mi4xNy4xMi4wLzI0JyxcbiAgICAgICAgICAgICcxNzIuMTcuMTMuMC8yNCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHJlZ2lvbjogJ2FwLXNvdXRoZWFzdC0yJyxcbiAgICAgICAgICBhdmFpbGFiaWxpdHlab25lczogW1xuICAgICAgICAgICAgJ2FwLXNvdXRoZWFzdC0yYScsXG4gICAgICAgICAgICAnYXAtc291dGhlYXN0LTJiJyxcbiAgICAgICAgICAgICdhcC1zb3V0aGVhc3QtMmMnLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdnBjQ2lkcjogJzE3Mi4xOC4wLjAvMTYnLFxuICAgICAgICAgIHB1YmxpY1N1Ym5ldENpZHJzOiBbXG4gICAgICAgICAgICAnMTcyLjE4LjEuMC8yNCcsXG4gICAgICAgICAgICAnMTcyLjE4LjIuMC8yNCcsXG4gICAgICAgICAgICAnMTcyLjE4LjMuMC8yNCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBwcml2YXRlU3VibmV0Q2lkcnM6IFtcbiAgICAgICAgICAgICcxNzIuMTguMTEuMC8yNCcsXG4gICAgICAgICAgICAnMTcyLjE4LjEyLjAvMjQnLFxuICAgICAgICAgICAgJzE3Mi4xOC4xMy4wLzI0JyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiBjb25maWdzW2Vudl0gfHwgY29uZmlncy5kZXY7XG59O1xuXG5leHBvcnQgY29uc3QgZ2V0Q29tbW9uVGFncyA9IChjb25maWc6IEVudmlyb25tZW50Q29uZmlnLCByZWdpb246IHN0cmluZykgPT4gKHtcbiAgRW52aXJvbm1lbnQ6IGNvbmZpZy5lbnZpcm9ubWVudCxcbiAgUHJvamVjdDogY29uZmlnLnByb2plY3QsXG4gIENvc3RDZW50ZXI6IGNvbmZpZy5jb3N0Q2VudGVyLFxuICBPd25lcjogY29uZmlnLm93bmVyLFxuICBSZWdpb246IHJlZ2lvbixcbiAgTWFuYWdlZEJ5OiAndGVycmFmb3JtJyxcbiAgQ3JlYXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSxcbn0pO1xuIl19