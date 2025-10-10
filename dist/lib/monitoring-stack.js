"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringStack = void 0;
const constructs_1 = require("constructs");
const cloudwatch_dashboard_1 = require("@cdktf/provider-aws/lib/cloudwatch-dashboard");
class MonitoringStack extends constructs_1.Construct {
    dashboard;
    constructor(scope, id, props) {
        super(scope, id);
        const dashboardBody = {
            widgets: [
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            [
                                'AWS/EC2',
                                'CPUUtilization',
                                { stat: 'Average', label: 'EC2 CPU Usage' },
                            ],
                            ['.', '.', { stat: 'Maximum', label: 'EC2 CPU Max' }],
                        ],
                        period: 300,
                        stat: 'Average',
                        region: props.region,
                        title: 'EC2 CPU Utilization',
                        yAxis: {
                            left: {
                                min: 0,
                                max: 100,
                            },
                        },
                    },
                },
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            ['AWS/ApplicationELB', 'TargetResponseTime', { stat: 'Average' }],
                            [
                                'AWS/ApplicationELB',
                                'RequestCount',
                                { stat: 'Sum', yAxis: 'right' },
                            ],
                        ],
                        period: 300,
                        stat: 'Average',
                        region: props.region,
                        title: 'ALB Metrics',
                    },
                },
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
                            [
                                'AWS/RDS',
                                'CPUUtilization',
                                { stat: 'Average', yAxis: 'right' },
                            ],
                        ],
                        period: 300,
                        stat: 'Average',
                        region: props.region,
                        title: 'RDS Performance',
                    },
                },
                {
                    type: 'metric',
                    properties: {
                        metrics: [
                            ['AWS/AutoScaling', 'GroupDesiredCapacity', { stat: 'Average' }],
                            [
                                'AWS/AutoScaling',
                                'GroupInServiceInstances',
                                { stat: 'Average' },
                            ],
                        ],
                        period: 300,
                        stat: 'Average',
                        region: props.region,
                        title: 'Auto Scaling Group',
                    },
                },
            ],
        };
        this.dashboard = new cloudwatch_dashboard_1.CloudwatchDashboard(this, 'portfolio-dashboard', {
            dashboardName: 'portfolio-tracking-metrics',
            dashboardBody: JSON.stringify(dashboardBody),
        });
    }
}
exports.MonitoringStack = MonitoringStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9tb25pdG9yaW5nLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDJDQUF1QztBQUN2Qyx1RkFBbUY7QUFhbkYsTUFBYSxlQUFnQixTQUFRLHNCQUFTO0lBQzVCLFNBQVMsQ0FBc0I7SUFFL0MsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUEyQjtRQUNuRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sYUFBYSxHQUFHO1lBQ3BCLE9BQU8sRUFBRTtnQkFDUDtvQkFDRSxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1YsT0FBTyxFQUFFOzRCQUNQO2dDQUNFLFNBQVM7Z0NBQ1QsZ0JBQWdCO2dDQUNoQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGVBQWUsRUFBRTs2QkFDNUM7NEJBQ0QsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLENBQUM7eUJBQ3REO3dCQUNELE1BQU0sRUFBRSxHQUFHO3dCQUNYLElBQUksRUFBRSxTQUFTO3dCQUNmLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTt3QkFDcEIsS0FBSyxFQUFFLHFCQUFxQjt3QkFDNUIsS0FBSyxFQUFFOzRCQUNMLElBQUksRUFBRTtnQ0FDSixHQUFHLEVBQUUsQ0FBQztnQ0FDTixHQUFHLEVBQUUsR0FBRzs2QkFDVDt5QkFDRjtxQkFDRjtpQkFDRjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUsUUFBUTtvQkFDZCxVQUFVLEVBQUU7d0JBQ1YsT0FBTyxFQUFFOzRCQUNQLENBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUM7NEJBQ2pFO2dDQUNFLG9CQUFvQjtnQ0FDcEIsY0FBYztnQ0FDZCxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRTs2QkFDaEM7eUJBQ0Y7d0JBQ0QsTUFBTSxFQUFFLEdBQUc7d0JBQ1gsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO3dCQUNwQixLQUFLLEVBQUUsYUFBYTtxQkFDckI7aUJBQ0Y7Z0JBQ0Q7b0JBQ0UsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFO3dCQUNWLE9BQU8sRUFBRTs0QkFDUCxDQUFDLFNBQVMsRUFBRSxxQkFBcUIsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQzs0QkFDdkQ7Z0NBQ0UsU0FBUztnQ0FDVCxnQkFBZ0I7Z0NBQ2hCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFOzZCQUNwQzt5QkFDRjt3QkFDRCxNQUFNLEVBQUUsR0FBRzt3QkFDWCxJQUFJLEVBQUUsU0FBUzt3QkFDZixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07d0JBQ3BCLEtBQUssRUFBRSxpQkFBaUI7cUJBQ3pCO2lCQUNGO2dCQUNEO29CQUNFLElBQUksRUFBRSxRQUFRO29CQUNkLFVBQVUsRUFBRTt3QkFDVixPQUFPLEVBQUU7NEJBQ1AsQ0FBQyxpQkFBaUIsRUFBRSxzQkFBc0IsRUFBRSxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsQ0FBQzs0QkFDaEU7Z0NBQ0UsaUJBQWlCO2dDQUNqQix5QkFBeUI7Z0NBQ3pCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTs2QkFDcEI7eUJBQ0Y7d0JBQ0QsTUFBTSxFQUFFLEdBQUc7d0JBQ1gsSUFBSSxFQUFFLFNBQVM7d0JBQ2YsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO3dCQUNwQixLQUFLLEVBQUUsb0JBQW9CO3FCQUM1QjtpQkFDRjthQUNGO1NBQ0YsQ0FBQztRQUVGLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSwwQ0FBbUIsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDcEUsYUFBYSxFQUFFLDRCQUE0QjtZQUMzQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7U0FDN0MsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBMUZELDBDQTBGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgQ2xvdWR3YXRjaERhc2hib2FyZCB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2Nsb3Vkd2F0Y2gtZGFzaGJvYXJkJztcbmltcG9ydCB7IEF1dG9zY2FsaW5nR3JvdXAgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hdXRvc2NhbGluZy1ncm91cCc7XG5pbXBvcnQgeyBBbGIgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9hbGInO1xuaW1wb3J0IHsgRGJJbnN0YW5jZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2RiLWluc3RhbmNlJztcblxuaW50ZXJmYWNlIE1vbml0b3JpbmdTdGFja1Byb3BzIHtcbiAgYXNnOiBBdXRvc2NhbGluZ0dyb3VwO1xuICBhbGI6IEFsYjtcbiAgZGF0YWJhc2U6IERiSW5zdGFuY2U7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgTW9uaXRvcmluZ1N0YWNrIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGRhc2hib2FyZDogQ2xvdWR3YXRjaERhc2hib2FyZDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTW9uaXRvcmluZ1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgZGFzaGJvYXJkQm9keSA9IHtcbiAgICAgIHdpZGdldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICdBV1MvRUMyJyxcbiAgICAgICAgICAgICAgICAnQ1BVVXRpbGl6YXRpb24nLFxuICAgICAgICAgICAgICAgIHsgc3RhdDogJ0F2ZXJhZ2UnLCBsYWJlbDogJ0VDMiBDUFUgVXNhZ2UnIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFsnLicsICcuJywgeyBzdGF0OiAnTWF4aW11bScsIGxhYmVsOiAnRUMyIENQVSBNYXgnIH1dLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgICAgc3RhdDogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcmVnaW9uOiBwcm9wcy5yZWdpb24sXG4gICAgICAgICAgICB0aXRsZTogJ0VDMiBDUFUgVXRpbGl6YXRpb24nLFxuICAgICAgICAgICAgeUF4aXM6IHtcbiAgICAgICAgICAgICAgbGVmdDoge1xuICAgICAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgICAgICBtYXg6IDEwMCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgICAgWydBV1MvQXBwbGljYXRpb25FTEInLCAnVGFyZ2V0UmVzcG9uc2VUaW1lJywgeyBzdGF0OiAnQXZlcmFnZScgfV0sXG4gICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAnQVdTL0FwcGxpY2F0aW9uRUxCJyxcbiAgICAgICAgICAgICAgICAnUmVxdWVzdENvdW50JyxcbiAgICAgICAgICAgICAgICB7IHN0YXQ6ICdTdW0nLCB5QXhpczogJ3JpZ2h0JyB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgICAgc3RhdDogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcmVnaW9uOiBwcm9wcy5yZWdpb24sXG4gICAgICAgICAgICB0aXRsZTogJ0FMQiBNZXRyaWNzJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ21ldHJpYycsXG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgICBbJ0FXUy9SRFMnLCAnRGF0YWJhc2VDb25uZWN0aW9ucycsIHsgc3RhdDogJ0F2ZXJhZ2UnIH1dLFxuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgJ0FXUy9SRFMnLFxuICAgICAgICAgICAgICAgICdDUFVVdGlsaXphdGlvbicsXG4gICAgICAgICAgICAgICAgeyBzdGF0OiAnQXZlcmFnZScsIHlBeGlzOiAncmlnaHQnIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgICAgICBzdGF0OiAnQXZlcmFnZScsXG4gICAgICAgICAgICByZWdpb246IHByb3BzLnJlZ2lvbixcbiAgICAgICAgICAgIHRpdGxlOiAnUkRTIFBlcmZvcm1hbmNlJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ21ldHJpYycsXG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgICBbJ0FXUy9BdXRvU2NhbGluZycsICdHcm91cERlc2lyZWRDYXBhY2l0eScsIHsgc3RhdDogJ0F2ZXJhZ2UnIH1dLFxuICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgJ0FXUy9BdXRvU2NhbGluZycsXG4gICAgICAgICAgICAgICAgJ0dyb3VwSW5TZXJ2aWNlSW5zdGFuY2VzJyxcbiAgICAgICAgICAgICAgICB7IHN0YXQ6ICdBdmVyYWdlJyB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgICAgc3RhdDogJ0F2ZXJhZ2UnLFxuICAgICAgICAgICAgcmVnaW9uOiBwcm9wcy5yZWdpb24sXG4gICAgICAgICAgICB0aXRsZTogJ0F1dG8gU2NhbGluZyBHcm91cCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfTtcblxuICAgIHRoaXMuZGFzaGJvYXJkID0gbmV3IENsb3Vkd2F0Y2hEYXNoYm9hcmQodGhpcywgJ3BvcnRmb2xpby1kYXNoYm9hcmQnLCB7XG4gICAgICBkYXNoYm9hcmROYW1lOiAncG9ydGZvbGlvLXRyYWNraW5nLW1ldHJpY3MnLFxuICAgICAgZGFzaGJvYXJkQm9keTogSlNPTi5zdHJpbmdpZnkoZGFzaGJvYXJkQm9keSksXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==