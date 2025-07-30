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
            new subnet_1.Subnet(this, "DevPublicSubnet1", {
                vpcId: vpcModule.vpc.id,
                cidrBlock: "10.0.1.0/24",
                availabilityZone: "us-east-1a",
                mapPublicIpOnLaunch: true,
                tags: {
                    Environment: "Dev",
                },
            }),
            new subnet_1.Subnet(this, "DevPublicSubnet2", {
                vpcId: vpcModule.vpc.id,
                cidrBlock: "10.0.2.0/24",
                availabilityZone: "us-east-1b",
                mapPublicIpOnLaunch: true,
                tags: {
                    Environment: "Dev",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBdUM7QUFDdkMsMkRBQXdEO0FBQ3hELDZGQUF3RjtBQUt4RixNQUFhLGFBQWMsU0FBUSxzQkFBYztJQUMvQixhQUFhLENBQVc7SUFFeEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxTQUFvQjtRQUM1RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLHdCQUF3QjtRQUN4QixJQUFJLENBQUMsYUFBYSxHQUFHO1lBQ25CLElBQUksZUFBTSxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtnQkFDbkMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDdkIsU0FBUyxFQUFFLGFBQWE7Z0JBQ3hCLGdCQUFnQixFQUFFLFlBQVk7Z0JBQzlCLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLElBQUksRUFBRTtvQkFDSixXQUFXLEVBQUUsS0FBSztpQkFDbkI7YUFDRixDQUFDO1lBQ0YsSUFBSSxlQUFNLENBQUMsSUFBSSxFQUFFLGtCQUFrQixFQUFFO2dCQUNuQyxLQUFLLEVBQUUsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUN2QixTQUFTLEVBQUUsYUFBYTtnQkFDeEIsZ0JBQWdCLEVBQUUsWUFBWTtnQkFDOUIsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsSUFBSSxFQUFFO29CQUNKLFdBQVcsRUFBRSxLQUFLO2lCQUNuQjthQUNGLENBQUM7U0FDSCxDQUFDO1FBRUYscUNBQXFDO1FBQ3JDLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzNDLElBQUksK0NBQXFCLENBQUMsSUFBSSxFQUFFLGNBQWMsS0FBSyxHQUFHLENBQUMsRUFBRSxFQUFFO2dCQUN2RCxRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0JBQ25CLFlBQVksRUFBRSxTQUFTLENBQUMsVUFBVSxDQUFDLEVBQUU7YUFDdEMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFwQ0Qsc0NBb0NDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVycmFmb3JtU3RhY2sgfSBmcm9tIFwiY2RrdGZcIjtcbmltcG9ydCB7IFN1Ym5ldCB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zdWJuZXRcIjtcbmltcG9ydCB7IFJvdXRlVGFibGVBc3NvY2lhdGlvbiB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9yb3V0ZS10YWJsZS1hc3NvY2lhdGlvblwiO1xuaW1wb3J0IHsgVnBjTW9kdWxlIH0gZnJvbSBcIi4uL3ZwY1wiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuXG5leHBvcnQgY2xhc3MgU3VibmV0c01vZHVsZSBleHRlbmRzIFRlcnJhZm9ybVN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldHM6IFN1Ym5ldFtdO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHZwY01vZHVsZTogVnBjTW9kdWxlKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBQdWJsaWMgU3VibmV0c1xuICAgIHRoaXMucHVibGljU3VibmV0cyA9IFtcbiAgICAgIG5ldyBTdWJuZXQodGhpcywgXCJEZXZQdWJsaWNTdWJuZXQxXCIsIHtcbiAgICAgICAgdnBjSWQ6IHZwY01vZHVsZS52cGMuaWQsXG4gICAgICAgIGNpZHJCbG9jazogXCIxMC4wLjEuMC8yNFwiLFxuICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBcInVzLWVhc3QtMWFcIixcbiAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogdHJ1ZSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIEVudmlyb25tZW50OiBcIkRldlwiLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgICBuZXcgU3VibmV0KHRoaXMsIFwiRGV2UHVibGljU3VibmV0MlwiLCB7XG4gICAgICAgIHZwY0lkOiB2cGNNb2R1bGUudnBjLmlkLFxuICAgICAgICBjaWRyQmxvY2s6IFwiMTAuMC4yLjAvMjRcIixcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogXCJ1cy1lYXN0LTFiXCIsXG4gICAgICAgIG1hcFB1YmxpY0lwT25MYXVuY2g6IHRydWUsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBFbnZpcm9ubWVudDogXCJEZXZcIixcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIF07XG5cbiAgICAvLyBBc3NvY2lhdGUgU3VibmV0cyB3aXRoIFJvdXRlIFRhYmxlXG4gICAgdGhpcy5wdWJsaWNTdWJuZXRzLmZvckVhY2goKHN1Ym5ldCwgaW5kZXgpID0+IHtcbiAgICAgIG5ldyBSb3V0ZVRhYmxlQXNzb2NpYXRpb24odGhpcywgYFN1Ym5ldEFzc29jJHtpbmRleCArIDF9YCwge1xuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXQuaWQsXG4gICAgICAgICAgcm91dGVUYWJsZUlkOiB2cGNNb2R1bGUucm91dGVUYWJsZS5pZCxcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn0iXX0=