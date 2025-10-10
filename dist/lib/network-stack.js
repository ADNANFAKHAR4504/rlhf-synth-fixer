"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkStack = void 0;
const cdktf_1 = require("cdktf");
const constructs_1 = require("constructs");
const vpc_1 = require("@cdktf/provider-aws/lib/vpc");
const subnet_1 = require("@cdktf/provider-aws/lib/subnet");
const internet_gateway_1 = require("@cdktf/provider-aws/lib/internet-gateway");
const nat_gateway_1 = require("@cdktf/provider-aws/lib/nat-gateway");
const eip_1 = require("@cdktf/provider-aws/lib/eip");
const route_table_1 = require("@cdktf/provider-aws/lib/route-table");
const route_1 = require("@cdktf/provider-aws/lib/route");
const route_table_association_1 = require("@cdktf/provider-aws/lib/route-table-association");
const data_aws_availability_zones_1 = require("@cdktf/provider-aws/lib/data-aws-availability-zones");
class NetworkStack extends constructs_1.Construct {
    vpc;
    publicSubnets;
    privateSubnets;
    constructor(scope, id, props) {
        super(scope, id);
        const azs = new data_aws_availability_zones_1.DataAwsAvailabilityZones(this, 'azs', {
            state: 'available',
        });
        this.vpc = new vpc_1.Vpc(this, `portfolio-vpc-${props.environmentSuffix}`, {
            cidrBlock: props.vpcCidr,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                Name: `portfolio-tracking-vpc-${props.environmentSuffix}`,
            },
        });
        const igw = new internet_gateway_1.InternetGateway(this, 'igw', {
            vpcId: this.vpc.id,
            tags: {
                Name: 'portfolio-igw',
            },
        });
        this.publicSubnets = [];
        this.privateSubnets = [];
        const natGateways = [];
        for (let i = 0; i < 2; i++) {
            const publicSubnet = new subnet_1.Subnet(this, `public-subnet-${i}`, {
                vpcId: this.vpc.id,
                cidrBlock: `172.32.${i * 2}.0/24`,
                availabilityZone: cdktf_1.Fn.element(azs.names, i),
                mapPublicIpOnLaunch: true,
                tags: {
                    Name: `portfolio-public-subnet-${i + 1}`,
                    Type: 'public',
                },
            });
            this.publicSubnets.push(publicSubnet);
            const privateSubnet = new subnet_1.Subnet(this, `private-subnet-${i}`, {
                vpcId: this.vpc.id,
                cidrBlock: `172.32.${i * 2 + 1}.0/24`,
                availabilityZone: cdktf_1.Fn.element(azs.names, i),
                tags: {
                    Name: `portfolio-private-subnet-${i + 1}`,
                    Type: 'private',
                },
            });
            this.privateSubnets.push(privateSubnet);
            const eip = new eip_1.Eip(this, `nat-eip-${i}`, {
                domain: 'vpc',
                tags: {
                    Name: `portfolio-nat-eip-${i + 1}`,
                },
            });
            const natGateway = new nat_gateway_1.NatGateway(this, `nat-gateway-${i}`, {
                allocationId: eip.id,
                subnetId: publicSubnet.id,
                tags: {
                    Name: `portfolio-nat-gateway-${i + 1}`,
                },
            });
            natGateways.push(natGateway);
        }
        const publicRouteTable = new route_table_1.RouteTable(this, 'public-rt', {
            vpcId: this.vpc.id,
            tags: {
                Name: 'portfolio-public-rt',
            },
        });
        new route_1.Route(this, 'public-route', {
            routeTableId: publicRouteTable.id,
            destinationCidrBlock: '0.0.0.0/0',
            gatewayId: igw.id,
        });
        this.publicSubnets.forEach((subnet, index) => {
            new route_table_association_1.RouteTableAssociation(this, `public-rta-${index}`, {
                subnetId: subnet.id,
                routeTableId: publicRouteTable.id,
            });
        });
        this.privateSubnets.forEach((subnet, index) => {
            const privateRouteTable = new route_table_1.RouteTable(this, `private-rt-${index}`, {
                vpcId: this.vpc.id,
                tags: {
                    Name: `portfolio-private-rt-${index + 1}`,
                },
            });
            new route_1.Route(this, `private-route-${index}`, {
                routeTableId: privateRouteTable.id,
                destinationCidrBlock: '0.0.0.0/0',
                natGatewayId: natGateways[index].id,
            });
            new route_table_association_1.RouteTableAssociation(this, `private-rta-${index}`, {
                subnetId: subnet.id,
                routeTableId: privateRouteTable.id,
            });
        });
    }
}
exports.NetworkStack = NetworkStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29yay1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9uZXR3b3JrLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUEyQjtBQUMzQiwyQ0FBdUM7QUFDdkMscURBQWtEO0FBQ2xELDJEQUF3RDtBQUN4RCwrRUFBMkU7QUFDM0UscUVBQWlFO0FBQ2pFLHFEQUFrRDtBQUNsRCxxRUFBaUU7QUFDakUseURBQXNEO0FBQ3RELDZGQUF3RjtBQUN4RixxR0FBK0Y7QUFRL0YsTUFBYSxZQUFhLFNBQVEsc0JBQVM7SUFDekIsR0FBRyxDQUFNO0lBQ1QsYUFBYSxDQUFXO0lBQ3hCLGNBQWMsQ0FBVztJQUV6QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsTUFBTSxHQUFHLEdBQUcsSUFBSSxzREFBd0IsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQ3BELEtBQUssRUFBRSxXQUFXO1NBQ25CLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxTQUFHLENBQUMsSUFBSSxFQUFFLGlCQUFpQixLQUFLLENBQUMsaUJBQWlCLEVBQUUsRUFBRTtZQUNuRSxTQUFTLEVBQUUsS0FBSyxDQUFDLE9BQU87WUFDeEIsa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsMEJBQTBCLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTthQUMxRDtTQUNGLENBQUMsQ0FBQztRQUVILE1BQU0sR0FBRyxHQUFHLElBQUksa0NBQWUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO1lBQzNDLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDbEIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxlQUFlO2FBQ3RCO1NBQ0Ys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QUFFLGNBQWMsS0FBSyxFQUFFLEVBQUU7Z0JBQ3JELFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDbkIsWUFBWSxFQUFFLGdCQUFnQixDQUFDLEVBQUU7YUFDbEMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUM1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksd0JBQVUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxLQUFLLEVBQUUsRUFBRTtnQkFDcEUsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDbEIsSUFBSSxFQUFFO29CQUNKLElBQUksRUFBRSx3QkFBd0IsS0FBSyxHQUFHLENBQUMsRUFBRTtpQkFDMUM7YUFDRixDQUFDLENBQUM7WUFFSCxJQUFJLGFBQUssQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEtBQUssRUFBRSxFQUFFO2dCQUN4QyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsRUFBRTtnQkFDbEMsb0JBQW9CLEVBQUUsV0FBVztnQkFDakMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFO2FBQ3BDLENBQUMsQ0FBQztZQUVILElBQUksK0NBQXFCLENBQUMsSUFBSSxFQUFFLGVBQWUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3RELFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtnQkFDbkIsWUFBWSxFQUFFLGlCQUFpQixDQUFDLEVBQUU7YUFDbkMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFqSEQsb0NBaUhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRm4gfSBmcm9tICdjZGt0Zic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IFZwYyB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3ZwYyc7XG5pbXBvcnQgeyBTdWJuZXQgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9zdWJuZXQnO1xuaW1wb3J0IHsgSW50ZXJuZXRHYXRld2F5IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvaW50ZXJuZXQtZ2F0ZXdheSc7XG5pbXBvcnQgeyBOYXRHYXRld2F5IH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvbmF0LWdhdGV3YXknO1xuaW1wb3J0IHsgRWlwIH0gZnJvbSAnQGNka3RmL3Byb3ZpZGVyLWF3cy9saWIvZWlwJztcbmltcG9ydCB7IFJvdXRlVGFibGUgfSBmcm9tICdAY2RrdGYvcHJvdmlkZXItYXdzL2xpYi9yb3V0ZS10YWJsZSc7XG5pbXBvcnQgeyBSb3V0ZSB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3JvdXRlJztcbmltcG9ydCB7IFJvdXRlVGFibGVBc3NvY2lhdGlvbiB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL3JvdXRlLXRhYmxlLWFzc29jaWF0aW9uJztcbmltcG9ydCB7IERhdGFBd3NBdmFpbGFiaWxpdHlab25lcyB9IGZyb20gJ0BjZGt0Zi9wcm92aWRlci1hd3MvbGliL2RhdGEtYXdzLWF2YWlsYWJpbGl0eS16b25lcyc7XG5cbmludGVyZmFjZSBOZXR3b3JrU3RhY2tQcm9wcyB7XG4gIHZwY0NpZHI6IHN0cmluZztcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBOZXR3b3JrU3RhY2sgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBWcGM7XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRzOiBTdWJuZXRbXTtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRzOiBTdWJuZXRbXTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTmV0d29ya1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgYXpzID0gbmV3IERhdGFBd3NBdmFpbGFiaWxpdHlab25lcyh0aGlzLCAnYXpzJywge1xuICAgICAgc3RhdGU6ICdhdmFpbGFibGUnLFxuICAgIH0pO1xuXG4gICAgdGhpcy52cGMgPSBuZXcgVnBjKHRoaXMsIGBwb3J0Zm9saW8tdnBjLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCwge1xuICAgICAgY2lkckJsb2NrOiBwcm9wcy52cGNDaWRyLFxuICAgICAgZW5hYmxlRG5zSG9zdG5hbWVzOiB0cnVlLFxuICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgTmFtZTogYHBvcnRmb2xpby10cmFja2luZy12cGMtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIGNvbnN0IGlndyA9IG5ldyBJbnRlcm5ldEdhdGV3YXkodGhpcywgJ2lndycsIHtcbiAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgIHRhZ3M6IHtcbiAgICAgICAgTmFtZTogJ3BvcnRmb2xpby1pZ3cnLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHRoaXMucHVibGljU3VibmV0cyA9IFtdO1xuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMgPSBbXTtcbiAgICBjb25zdCBuYXRHYXRld2F5czogTmF0R2F0ZXdheVtdID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDI7IGkrKykge1xuICAgICAgY29uc3QgcHVibGljU3VibmV0ID0gbmV3IFN1Ym5ldCh0aGlzLCBgcHVibGljLXN1Ym5ldC0ke2l9YCwge1xuICAgICAgICB2cGNJZDogdGhpcy52cGMuaWQsXG4gICAgICAgIGNpZHJCbG9jazogYDE3Mi4zMi4ke2kgKiAyfS4wLzI0YCxcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogRm4uZWxlbWVudChhenMubmFtZXMsIGkpLFxuICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHBvcnRmb2xpby1wdWJsaWMtc3VibmV0LSR7aSArIDF9YCxcbiAgICAgICAgICBUeXBlOiAncHVibGljJyxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5wdWJsaWNTdWJuZXRzLnB1c2gocHVibGljU3VibmV0KTtcblxuICAgICAgY29uc3QgcHJpdmF0ZVN1Ym5ldCA9IG5ldyBTdWJuZXQodGhpcywgYHByaXZhdGUtc3VibmV0LSR7aX1gLCB7XG4gICAgICAgIHZwY0lkOiB0aGlzLnZwYy5pZCxcbiAgICAgICAgY2lkckJsb2NrOiBgMTcyLjMyLiR7aSAqIDIgKyAxfS4wLzI0YCxcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogRm4uZWxlbWVudChhenMubmFtZXMsIGkpLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHBvcnRmb2xpby1wcml2YXRlLXN1Ym5ldC0ke2kgKyAxfWAsXG4gICAgICAgICAgVHlwZTogJ3ByaXZhdGUnLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICB0aGlzLnByaXZhdGVTdWJuZXRzLnB1c2gocHJpdmF0ZVN1Ym5ldCk7XG5cbiAgICAgIGNvbnN0IGVpcCA9IG5ldyBFaXAodGhpcywgYG5hdC1laXAtJHtpfWAsIHtcbiAgICAgICAgZG9tYWluOiAndnBjJyxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGBwb3J0Zm9saW8tbmF0LWVpcC0ke2kgKyAxfWAsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgY29uc3QgbmF0R2F0ZXdheSA9IG5ldyBOYXRHYXRld2F5KHRoaXMsIGBuYXQtZ2F0ZXdheS0ke2l9YCwge1xuICAgICAgICBhbGxvY2F0aW9uSWQ6IGVpcC5pZCxcbiAgICAgICAgc3VibmV0SWQ6IHB1YmxpY1N1Ym5ldC5pZCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGBwb3J0Zm9saW8tbmF0LWdhdGV3YXktJHtpICsgMX1gLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICBuYXRHYXRld2F5cy5wdXNoKG5hdEdhdGV3YXkpO1xuICAgIH1cblxuICAgIGNvbnN0IHB1YmxpY1JvdXRlVGFibGUgPSBuZXcgUm91dGVUYWJsZSh0aGlzLCAncHVibGljLXJ0Jywge1xuICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgdGFnczoge1xuICAgICAgICBOYW1lOiAncG9ydGZvbGlvLXB1YmxpYy1ydCcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgbmV3IFJvdXRlKHRoaXMsICdwdWJsaWMtcm91dGUnLCB7XG4gICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXG4gICAgICBkZXN0aW5hdGlvbkNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICBnYXRld2F5SWQ6IGlndy5pZCxcbiAgICB9KTtcblxuICAgIHRoaXMucHVibGljU3VibmV0cy5mb3JFYWNoKChzdWJuZXQsIGluZGV4KSA9PiB7XG4gICAgICBuZXcgUm91dGVUYWJsZUFzc29jaWF0aW9uKHRoaXMsIGBwdWJsaWMtcnRhLSR7aW5kZXh9YCwge1xuICAgICAgICBzdWJuZXRJZDogc3VibmV0LmlkLFxuICAgICAgICByb3V0ZVRhYmxlSWQ6IHB1YmxpY1JvdXRlVGFibGUuaWQsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMuZm9yRWFjaCgoc3VibmV0LCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgcHJpdmF0ZVJvdXRlVGFibGUgPSBuZXcgUm91dGVUYWJsZSh0aGlzLCBgcHJpdmF0ZS1ydC0ke2luZGV4fWAsIHtcbiAgICAgICAgdnBjSWQ6IHRoaXMudnBjLmlkLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHBvcnRmb2xpby1wcml2YXRlLXJ0LSR7aW5kZXggKyAxfWAsXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgbmV3IFJvdXRlKHRoaXMsIGBwcml2YXRlLXJvdXRlLSR7aW5kZXh9YCwge1xuICAgICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlLmlkLFxuICAgICAgICBkZXN0aW5hdGlvbkNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICAgIG5hdEdhdGV3YXlJZDogbmF0R2F0ZXdheXNbaW5kZXhdLmlkLFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBSb3V0ZVRhYmxlQXNzb2NpYXRpb24odGhpcywgYHByaXZhdGUtcnRhLSR7aW5kZXh9YCwge1xuICAgICAgICBzdWJuZXRJZDogc3VibmV0LmlkLFxuICAgICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlLmlkLFxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==