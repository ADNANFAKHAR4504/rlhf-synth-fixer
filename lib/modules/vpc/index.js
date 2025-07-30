"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VpcModule = void 0;
const cdktf_1 = require("cdktf");
const vpc_1 = require("@cdktf/provider-aws/lib/vpc");
const route_table_1 = require("@cdktf/provider-aws/lib/route-table");
const internet_gateway_1 = require("@cdktf/provider-aws/lib/internet-gateway");
const route_1 = require("@cdktf/provider-aws/lib/route");
class VpcModule extends cdktf_1.TerraformStack {
    vpc;
    igw;
    routeTable;
    constructor(scope, id) {
        super(scope, id);
        // Create VPC
        this.vpc = new vpc_1.Vpc(this, "DevVpc", {
            cidrBlock: "10.0.0.0/16",
            tags: {
                Environment: "Dev",
            },
        });
        // Create Internet Gateway
        this.igw = new internet_gateway_1.InternetGateway(this, "DevIgw", {
            vpcId: this.vpc.id,
            tags: {
                Environment: "Dev",
            },
        });
        // Create Route Table
        this.routeTable = new route_table_1.RouteTable(this, "DevRouteTable", {
            vpcId: this.vpc.id,
            tags: {
                Environment: "Dev",
            },
        });
        // Create Route for Internet Gateway
        new route_1.Route(this, "DevRoute", {
            routeTableId: this.routeTable.id,
            destinationCidrBlock: "0.0.0.0/0",
            gatewayId: this.igw.id,
        });
    }
}
exports.VpcModule = VpcModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBd0Q7QUFDeEQscURBQWtEO0FBRWxELHFFQUFpRTtBQUNqRSwrRUFBMkU7QUFDM0UseURBQXNEO0FBSXRELE1BQWEsU0FBVSxTQUFRLHNCQUFjO0lBQzNCLEdBQUcsQ0FBTTtJQUNULEdBQUcsQ0FBa0I7SUFDckIsVUFBVSxDQUFhO0lBRXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVO1FBQ3RDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsYUFBYTtRQUNiLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxTQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNqQyxTQUFTLEVBQUUsYUFBYTtZQUN4QixJQUFJLEVBQUU7Z0JBQ0osV0FBVyxFQUFFLEtBQUs7YUFDbkI7U0FDRixDQUFDLENBQUM7UUFFSCwwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLGtDQUFlLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUM3QyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2xCLElBQUksRUFBRTtnQkFDSixXQUFXLEVBQUUsS0FBSzthQUNuQjtTQUNGLENBQUMsQ0FBQztRQUVILHFCQUFxQjtRQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3RELEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbEIsSUFBSSxFQUFFO2dCQUNKLFdBQVcsRUFBRSxLQUFLO2FBQ25CO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLElBQUksYUFBSyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDMUIsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNoQyxvQkFBb0IsRUFBRSxXQUFXO1lBQ2pDLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7U0FDdkIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdkNELDhCQXVDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRlcnJhZm9ybVN0YWNrLCBUZXJyYWZvcm1PdXRwdXQgfSBmcm9tIFwiY2RrdGZcIjtcbmltcG9ydCB7IFZwYyB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi92cGNcIjtcbmltcG9ydCB7IFN1Ym5ldCB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zdWJuZXRcIjtcbmltcG9ydCB7IFJvdXRlVGFibGUgfSBmcm9tIFwiQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvcm91dGUtdGFibGVcIjtcbmltcG9ydCB7IEludGVybmV0R2F0ZXdheSB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pbnRlcm5ldC1nYXRld2F5XCI7XG5pbXBvcnQgeyBSb3V0ZSB9IGZyb20gXCJAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9yb3V0ZVwiO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcblxuXG5leHBvcnQgY2xhc3MgVnBjTW9kdWxlIGV4dGVuZHMgVGVycmFmb3JtU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBWcGM7XG4gIHB1YmxpYyByZWFkb25seSBpZ3c6IEludGVybmV0R2F0ZXdheTtcbiAgcHVibGljIHJlYWRvbmx5IHJvdXRlVGFibGU6IFJvdXRlVGFibGU7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBDcmVhdGUgVlBDXG4gICAgdGhpcy52cGMgPSBuZXcgVnBjKHRoaXMsIFwiRGV2VnBjXCIsIHtcbiAgICAgIGNpZHJCbG9jazogXCIxMC4wLjAuMC8xNlwiLFxuICAgICAgdGFnczoge1xuICAgICAgICBFbnZpcm9ubWVudDogXCJEZXZcIixcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgSW50ZXJuZXQgR2F0ZXdheVxuICAgIHRoaXMuaWd3ID0gbmV3IEludGVybmV0R2F0ZXdheSh0aGlzLCBcIkRldklnd1wiLCB7XG4gICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICB0YWdzOiB7XG4gICAgICAgIEVudmlyb25tZW50OiBcIkRldlwiLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBSb3V0ZSBUYWJsZVxuICAgIHRoaXMucm91dGVUYWJsZSA9IG5ldyBSb3V0ZVRhYmxlKHRoaXMsIFwiRGV2Um91dGVUYWJsZVwiLCB7XG4gICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICB0YWdzOiB7XG4gICAgICAgIEVudmlyb25tZW50OiBcIkRldlwiLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBSb3V0ZSBmb3IgSW50ZXJuZXQgR2F0ZXdheVxuICAgIG5ldyBSb3V0ZSh0aGlzLCBcIkRldlJvdXRlXCIsIHtcbiAgICAgIHJvdXRlVGFibGVJZDogdGhpcy5yb3V0ZVRhYmxlLmlkLFxuICAgICAgZGVzdGluYXRpb25DaWRyQmxvY2s6IFwiMC4wLjAuMC8wXCIsXG4gICAgICBnYXRld2F5SWQ6IHRoaXMuaWd3LmlkLFxuICAgIH0pO1xuICB9XG59Il19