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
        this.vpc = new vpc_1.Vpc(this, 'DevVpc', {
            cidrBlock: '10.0.0.0/16',
            tags: {
                Environment: 'Dev',
            },
        });
        // Create Internet Gateway
        this.igw = new internet_gateway_1.InternetGateway(this, 'DevIgw', {
            vpcId: this.vpc.id,
            tags: {
                Environment: 'Dev',
            },
        });
        // Create Route Table
        this.routeTable = new route_table_1.RouteTable(this, 'DevRouteTable', {
            vpcId: this.vpc.id,
            tags: {
                Environment: 'Dev',
            },
        });
        // Create Route for Internet Gateway
        new route_1.Route(this, 'DevRoute', {
            routeTableId: this.routeTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: this.igw.id,
        });
    }
}
exports.VpcModule = VpcModule;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBdUM7QUFDdkMscURBQWtEO0FBQ2xELHFFQUFpRTtBQUNqRSwrRUFBMkU7QUFDM0UseURBQXNEO0FBR3RELE1BQWEsU0FBVSxTQUFRLHNCQUFjO0lBQzNCLEdBQUcsQ0FBTTtJQUNULEdBQUcsQ0FBa0I7SUFDckIsVUFBVSxDQUFhO0lBRXZDLFlBQVksS0FBZ0IsRUFBRSxFQUFVO1FBQ3RDLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsYUFBYTtRQUNiLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxTQUFHLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUNqQyxTQUFTLEVBQUUsYUFBYTtZQUN4QixJQUFJLEVBQUU7Z0JBQ0osV0FBVyxFQUFFLEtBQUs7YUFDbkI7U0FDRixDQUFDLENBQUM7UUFFSCwwQkFBMEI7UUFDMUIsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLGtDQUFlLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRTtZQUM3QyxLQUFLLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ2xCLElBQUksRUFBRTtnQkFDSixXQUFXLEVBQUUsS0FBSzthQUNuQjtTQUNGLENBQUMsQ0FBQztRQUVILHFCQUFxQjtRQUNyQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3RELEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbEIsSUFBSSxFQUFFO2dCQUNKLFdBQVcsRUFBRSxLQUFLO2FBQ25CO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLElBQUksYUFBSyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDMUIsWUFBWSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUNoQyxvQkFBb0IsRUFBRSxXQUFXO1lBQ2pDLFNBQVMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7U0FDdkIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdkNELDhCQXVDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRlcnJhZm9ybVN0YWNrIH0gZnJvbSAnY2RrdGYnO1xuaW1wb3J0IHsgVnBjIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvdnBjJztcbmltcG9ydCB7IFJvdXRlVGFibGUgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9yb3V0ZS10YWJsZSc7XG5pbXBvcnQgeyBJbnRlcm5ldEdhdGV3YXkgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9pbnRlcm5ldC1nYXRld2F5JztcbmltcG9ydCB7IFJvdXRlIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvcm91dGUnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBjbGFzcyBWcGNNb2R1bGUgZXh0ZW5kcyBUZXJyYWZvcm1TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSB2cGM6IFZwYztcbiAgcHVibGljIHJlYWRvbmx5IGlndzogSW50ZXJuZXRHYXRld2F5O1xuICBwdWJsaWMgcmVhZG9ubHkgcm91dGVUYWJsZTogUm91dGVUYWJsZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBWUENcbiAgICB0aGlzLnZwYyA9IG5ldyBWcGModGhpcywgJ0RldlZwYycsIHtcbiAgICAgIGNpZHJCbG9jazogJzEwLjAuMC4wLzE2JyxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdEZXYnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBJbnRlcm5ldCBHYXRld2F5XG4gICAgdGhpcy5pZ3cgPSBuZXcgSW50ZXJuZXRHYXRld2F5KHRoaXMsICdEZXZJZ3cnLCB7XG4gICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICB0YWdzOiB7XG4gICAgICAgIEVudmlyb25tZW50OiAnRGV2JyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgUm91dGUgVGFibGVcbiAgICB0aGlzLnJvdXRlVGFibGUgPSBuZXcgUm91dGVUYWJsZSh0aGlzLCAnRGV2Um91dGVUYWJsZScsIHtcbiAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgRW52aXJvbm1lbnQ6ICdEZXYnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBSb3V0ZSBmb3IgSW50ZXJuZXQgR2F0ZXdheVxuICAgIG5ldyBSb3V0ZSh0aGlzLCAnRGV2Um91dGUnLCB7XG4gICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucm91dGVUYWJsZS5pZCxcbiAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiAnMC4wLjAuMC8wJyxcbiAgICAgIGdhdGV3YXlJZDogdGhpcy5pZ3cuaWQsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==