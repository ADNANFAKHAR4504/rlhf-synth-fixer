"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubnetsModule = void 0;
const cdktf_1 = require("cdktf");
const subnet_1 = require("@cdktf/provider-aws/lib/subnet");
const route_table_association_1 = require("@cdktf/provider-aws/lib/route-table-association");
class SubnetsModule extends cdktf_1.TerraformStack {
    publicSubnets;
    constructor(scope, id, vpcModule) {
        super(scope, id);
        // Create Public Subnets
        this.publicSubnets = [
            new subnet_1.Subnet(this, 'DevPublicSubnet1', {
                vpcId: vpcModule.vpc.id,
                cidrBlock: '10.0.1.0/24',
                availabilityZone: 'us-east-1a',
                mapPublicIpOnLaunch: true,
                tags: {
                    Environment: 'Dev',
                },
            }),
            new subnet_1.Subnet(this, 'DevPublicSubnet2', {
                vpcId: vpcModule.vpc.id,
                cidrBlock: '10.0.2.0/24',
                availabilityZone: 'us-east-1b',
                mapPublicIpOnLaunch: true,
                tags: {
                    Environment: 'Dev',
                },
            }),
        ];
        // Associate Subnets with Route Table
        this.publicSubnets.forEach((subnet, index) => {
            new route_table_association_1.RouteTableAssociation(this, `SubnetAssoc${index + 1}`, {
                subnetId: subnet.id,
                routeTableId: vpcModule.routeTable.id,
            });
        });
    }
}
exports.SubnetsModule = SubnetsModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBdUM7QUFDdkMsMkRBQXdEO0FBQ3hELDZGQUF3RjtBQUl4RixNQUFhLGFBQWMsU0FBUSxzQkFBYztJQUMvQixhQUFhLENBQVc7SUFFeEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxTQUFvQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsYUFBYSxHQUFHO1lBQ25CLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtnQkFDbkMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDdkIsU0FBUyxFQUFFLGFBQWE7Z0JBQ3hCLGdCQUFnQixFQUFFLFlBQVk7Z0JBQzlCLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLElBQUksRUFBRTtvQkFDSixXQUFXLEVBQUUsS0FBSztpQkFDbkI7YUFDRixDQUFDO1lBQ0YsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO2dCQUNuQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN2QixTQUFTLEVBQUUsYUFBYTtnQkFDeEIsZ0JBQWdCLEVBQUUsWUFBWTtnQkFDOUIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsSUFBSSxFQUFFO29CQUNKLFdBQVcsRUFBRSxLQUFLO2lCQUNuQjthQUNGLENBQUM7U0FDSCxDQUFDO1FBRUYscUNBQXFDO1FBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzNDLElBQUksK0NBQXFCLENBQUMsSUFBSSxFQUFFLGNBQWMsS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFFO2dCQUN6RCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ25CLFlBQVksRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7YUFDdEMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwQ0Qsc0NBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVycmFmb3JtU3RhY2sgfSBmcm9tICdjZGt0Zic7XG5pbXBvcnQgeyBTdWJuZXQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zdWJuZXQnO1xuaW1wb3J0IHsgUm91dGVUYWJsZUFzc29jaWF0aW9uIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvcm91dGUtdGFibGUtYXNzb2NpYXRpb24nO1xuaW1wb3J0IHsgVnBjTW9kdWxlIH0gZnJvbSAnLi4vdnBjJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgY2xhc3MgU3VibmV0c01vZHVsZSBleHRlbmRzIFRlcnJhZm9ybVN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldHM6IFN1Ym5ldFtdO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHZwY01vZHVsZTogVnBjTW9kdWxlKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBQdWJsaWMgU3VibmV0c1xuICAgIHRoaXMucHVibGljU3VibmV0cyA9IFtcbiAgICAgIG5ldyBTdWJuZXQodGhpcywgJ0RldlB1YmxpY1N1Ym5ldDEnLCB7XG4gICAgICAgIHZwY0lkOiB2cGNNb2R1bGUudnBjLmlkLFxuICAgICAgICBjaWRyQmxvY2s6ICcxMC4wLjEuMC8yNCcsXG4gICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6ICd1cy1lYXN0LTFhJyxcbiAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIEVudmlyb25tZW50OiAnRGV2JyxcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgICAgbmV3IFN1Ym5ldCh0aGlzLCAnRGV2UHVibGljU3VibmV0MicsIHtcbiAgICAgICAgdnBjSWQ6IHZwY01vZHVsZS52cGMuaWQsXG4gICAgICAgIGNpZHJCbG9jazogJzEwLjAuMi4wLzI0JyxcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogJ3VzLWVhc3QtMWInLFxuICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgRW52aXJvbm1lbnQ6ICdEZXYnLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgXTtcblxuICAgIC8vIEFzc29jaWF0ZSBTdWJuZXRzIHdpdGggUm91dGUgVGFibGVcbiAgICB0aGlzLnB1YmxpY1N1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgICAgbmV3IFJvdXRlVGFibGVBc3NvY2lhdGlvbih0aGlzLCBgU3VibmV0QXNzb2Mke2luZGV4ICsgMX1gLCB7XG4gICAgICAgIHN1Ym5ldElkOiBzdWJuZXQuaWQsXG4gICAgICAgIHJvdXRlVGFibGVJZDogdnBjTW9kdWxlLnJvdXRlVGFibGUuaWQsXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuIl19