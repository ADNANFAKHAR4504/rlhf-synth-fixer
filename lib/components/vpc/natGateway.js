"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiAzNatGatewayComponent = exports.NatGatewayComponent = void 0;
exports.createNatGateway = createNatGateway;
exports.createMultiAzNatGateway = createMultiAzNatGateway;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class NatGatewayComponent extends pulumi.ComponentResource {
    natGateway;
    natGatewayId;
    elasticIp;
    elasticIpId;
    publicIp;
    constructor(name, args, opts) {
        super("aws:vpc:NatGatewayComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        const connectivityType = args.connectivityType || "public";
        let allocationId = args.allocationId;
        // Create Elastic IP for public NAT Gateway if not provided
        if (connectivityType === "public" && !allocationId) {
            this.elasticIp = new aws.ec2.Eip(`${name}-eip`, {
                domain: "vpc",
                tags: {
                    ...defaultTags,
                    Name: `${args.name}-eip`,
                },
            }, { parent: this });
            this.elasticIpId = this.elasticIp.id;
            this.publicIp = this.elasticIp.publicIp;
            allocationId = this.elasticIp.id;
        }
        this.natGateway = new aws.ec2.NatGateway(`${name}-nat`, {
            subnetId: args.subnetId,
            allocationId: allocationId,
            connectivityType: connectivityType,
            tags: defaultTags,
        }, { parent: this });
        this.natGatewayId = this.natGateway.id;
        this.registerOutputs({
            natGateway: this.natGateway,
            natGatewayId: this.natGatewayId,
            elasticIp: this.elasticIp,
            elasticIpId: this.elasticIpId,
            publicIp: this.publicIp,
        });
    }
}
exports.NatGatewayComponent = NatGatewayComponent;
class MultiAzNatGatewayComponent extends pulumi.ComponentResource {
    natGateways;
    natGatewayIds;
    constructor(name, args, opts) {
        super("aws:vpc:MultiAzNatGatewayComponent", name, {}, opts);
        this.natGateways = [];
        this.natGatewayIds = [];
        args.publicSubnetIds.forEach((subnetId, index) => {
            const natGatewayComponent = new NatGatewayComponent(`${name}-${index}`, {
                subnetId: subnetId,
                connectivityType: "public",
                name: `${args.name}-${index}`,
                tags: args.tags,
            }, { parent: this });
            const result = {
                natGateway: natGatewayComponent.natGateway,
                natGatewayId: natGatewayComponent.natGatewayId,
                elasticIp: natGatewayComponent.elasticIp,
                elasticIpId: natGatewayComponent.elasticIpId,
                publicIp: natGatewayComponent.publicIp,
            };
            this.natGateways.push(result);
            this.natGatewayIds.push(natGatewayComponent.natGatewayId);
        });
        this.registerOutputs({
            natGateways: this.natGateways,
            natGatewayIds: this.natGatewayIds,
        });
    }
}
exports.MultiAzNatGatewayComponent = MultiAzNatGatewayComponent;
function createNatGateway(name, args) {
    const natGatewayComponent = new NatGatewayComponent(name, args);
    return {
        natGateway: natGatewayComponent.natGateway,
        natGatewayId: natGatewayComponent.natGatewayId,
        elasticIp: natGatewayComponent.elasticIp,
        elasticIpId: natGatewayComponent.elasticIpId,
        publicIp: natGatewayComponent.publicIp,
    };
}
function createMultiAzNatGateway(name, args) {
    const multiAzComponent = new MultiAzNatGatewayComponent(name, args);
    return {
        natGateways: multiAzComponent.natGateways,
        natGatewayIds: multiAzComponent.natGatewayIds,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0R2F0ZXdheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5hdEdhdGV3YXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMEhBLDRDQVNDO0FBRUQsMERBTUM7QUEzSUQsdURBQXlDO0FBQ3pDLGlEQUFtQztBQTZCbkMsTUFBYSxtQkFBb0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzdDLFVBQVUsQ0FBcUI7SUFDL0IsWUFBWSxDQUF3QjtJQUNwQyxTQUFTLENBQWU7SUFDeEIsV0FBVyxDQUF5QjtJQUNwQyxRQUFRLENBQXlCO0lBRWpELFlBQVksSUFBWSxFQUFFLElBQW9CLEVBQUUsSUFBc0M7UUFDbEYsS0FBSyxDQUFDLDZCQUE2QixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFckQsTUFBTSxXQUFXLEdBQUc7WUFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2YsQ0FBQztRQUVGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixJQUFJLFFBQVEsQ0FBQztRQUMzRCxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO1FBRXJDLDJEQUEyRDtRQUMzRCxJQUFJLGdCQUFnQixLQUFLLFFBQVEsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ2pELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksTUFBTSxFQUFFO2dCQUM1QyxNQUFNLEVBQUUsS0FBSztnQkFDYixJQUFJLEVBQUU7b0JBQ0YsR0FBRyxXQUFXO29CQUNkLElBQUksRUFBRSxHQUFHLElB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QUUsSUFBb0I7SUFDL0QsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLG1CQUFtQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoRSxPQUFPO1FBQ0gsVUFBVSxFQUFFLG1CQUFtQixDQUFDLFVBQVU7UUFDMUMsWUFBWSxFQUFFLG1CQUFtQixDQUFDLFlBQVk7UUFDOUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDLFNBQVM7UUFDeEMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLFdBQVc7UUFDNUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLFFBQVE7S0FDekMsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxJQUFZLEVBQUUsSUFBMkI7SUFDN0UsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDBCQUEwQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwRSxPQUFPO1FBQ0gsV0FBVyxFQUFFLGdCQUFnQixDQUFDLFdBQVc7UUFDekMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLGFBQWE7S0FDaEQsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmF0R2F0ZXdheUFyZ3Mge1xuICAgIHN1Ym5ldElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBhbGxvY2F0aW9uSWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBjb25uZWN0aXZpdHlUeXBlPzogXCJwdWJsaWNcIiB8IFwicHJpdmF0ZVwiO1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOYXRHYXRld2F5UmVzdWx0IHtcbiAgICBuYXRHYXRld2F5OiBhd3MuZWMyLk5hdEdhdGV3YXk7XG4gICAgbmF0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgZWxhc3RpY0lwPzogYXdzLmVjMi5FaXA7XG4gICAgZWxhc3RpY0lwSWQ/OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljSXA/OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTXVsdGlBek5hdEdhdGV3YXlBcmdzIHtcbiAgICBwdWJsaWNTdWJuZXRJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE11bHRpQXpOYXRHYXRld2F5UmVzdWx0IHtcbiAgICBuYXRHYXRld2F5czogTmF0R2F0ZXdheVJlc3VsdFtdO1xuICAgIG5hdEdhdGV3YXlJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xufVxuXG5leHBvcnQgY2xhc3MgTmF0R2F0ZXdheUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IG5hdEdhdGV3YXk6IGF3cy5lYzIuTmF0R2F0ZXdheTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbmF0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGVsYXN0aWNJcD86IGF3cy5lYzIuRWlwO1xuICAgIHB1YmxpYyByZWFkb25seSBlbGFzdGljSXBJZD86IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcHVibGljSXA/OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IE5hdEdhdGV3YXlBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czp2cGM6TmF0R2F0ZXdheUNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICAgICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICAgICAgICBNYW5hZ2VkQnk6IFwiUHVsdW1pXCIsXG4gICAgICAgICAgICBQcm9qZWN0OiBcIkFXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nXCIsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29ubmVjdGl2aXR5VHlwZSA9IGFyZ3MuY29ubmVjdGl2aXR5VHlwZSB8fCBcInB1YmxpY1wiO1xuICAgICAgICBsZXQgYWxsb2NhdGlvbklkID0gYXJncy5hbGxvY2F0aW9uSWQ7XG5cbiAgICAgICAgLy8gQ3JlYXRlIEVsYXN0aWMgSVAgZm9yIHB1YmxpYyBOQVQgR2F0ZXdheSBpZiBub3QgcHJvdmlkZWRcbiAgICAgICAgaWYgKGNvbm5lY3Rpdml0eVR5cGUgPT09IFwicHVibGljXCIgJiYgIWFsbG9jYXRpb25JZCkge1xuICAgICAgICAgICAgdGhpcy5lbGFzdGljSXAgPSBuZXcgYXdzLmVjMi5FaXAoYCR7bmFtZX0tZWlwYCwge1xuICAgICAgICAgICAgICAgIGRvbWFpbjogXCJ2cGNcIixcbiAgICAgICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRlZmF1bHRUYWdzLFxuICAgICAgICAgICAgICAgICAgICBOYW1lOiBgJHthcmdzLm5hbWV9LWVpcGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmVsYXN0aWNJcElkID0gdGhpcy5lbGFzdGljSXAuaWQ7XG4gICAgICAgICAgICB0aGlzLnB1YmxpY0lwID0gdGhpcy5lbGFzdGljSXAucHVibGljSXA7XG4gICAgICAgICAgICBhbGxvY2F0aW9uSWQgPSB0aGlzLmVsYXN0aWNJcC5pZDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubmF0R2F0ZXdheSA9IG5ldyBhd3MuZWMyLk5hdEdhdGV3YXkoYCR7bmFtZX0tbmF0YCwge1xuICAgICAgICAgICAgc3VibmV0SWQ6IGFyZ3Muc3VibmV0SWQsXG4gICAgICAgICAgICBhbGxvY2F0aW9uSWQ6IGFsbG9jYXRpb25JZCxcbiAgICAgICAgICAgIGNvbm5lY3Rpdml0eVR5cGU6IGNvbm5lY3Rpdml0eVR5cGUsXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5uYXRHYXRld2F5SWQgPSB0aGlzLm5hdEdhdGV3YXkuaWQ7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgbmF0R2F0ZXdheTogdGhpcy5uYXRHYXRld2F5LFxuICAgICAgICAgICAgbmF0R2F0ZXdheUlkOiB0aGlzLm5hdEdhdGV3YXlJZCxcbiAgICAgICAgICAgIGVsYXN0aWNJcDogdGhpcy5lbGFzdGljSXAsXG4gICAgICAgICAgICBlbGFzdGljSXBJZDogdGhpcy5lbGFzdGljSXBJZCxcbiAgICAgICAgICAgIHB1YmxpY0lwOiB0aGlzLnB1YmxpY0lwLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBNdWx0aUF6TmF0R2F0ZXdheUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IG5hdEdhdGV3YXlzOiBOYXRHYXRld2F5UmVzdWx0W107XG4gICAgcHVibGljIHJlYWRvbmx5IG5hdEdhdGV3YXlJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBNdWx0aUF6TmF0R2F0ZXdheUFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnZwYzpNdWx0aUF6TmF0R2F0ZXdheUNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgdGhpcy5uYXRHYXRld2F5cyA9IFtdO1xuICAgICAgICB0aGlzLm5hdEdhdGV3YXlJZHMgPSBbXTtcblxuICAgICAgICBhcmdzLnB1YmxpY1N1Ym5ldElkcy5mb3JFYWNoKChzdWJuZXRJZCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5hdEdhdGV3YXlDb21wb25lbnQgPSBuZXcgTmF0R2F0ZXdheUNvbXBvbmVudChgJHtuYW1lfS0ke2luZGV4fWAsIHtcbiAgICAgICAgICAgICAgICBzdWJuZXRJZDogc3VibmV0SWQsXG4gICAgICAgICAgICAgICAgY29ubmVjdGl2aXR5VHlwZTogXCJwdWJsaWNcIixcbiAgICAgICAgICAgICAgICBuYW1lOiBgJHthcmdzLm5hbWV9LSR7aW5kZXh9YCxcbiAgICAgICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICAgICAgY29uc3QgcmVzdWx0OiBOYXRHYXRld2F5UmVzdWx0ID0ge1xuICAgICAgICAgICAgICAgIG5hdEdhdGV3YXk6IG5hdEdhdGV3YXlDb21wb25lbnQubmF0R2F0ZXdheSxcbiAgICAgICAgICAgICAgICBuYXRHYXRld2F5SWQ6IG5hdEdhdGV3YXlDb21wb25lbnQubmF0R2F0ZXdheUlkLFxuICAgICAgICAgICAgICAgIGVsYXN0aWNJcDogbmF0R2F0ZXdheUNvbXBvbmVudC5lbGFzdGljSXAsXG4gICAgICAgICAgICAgICAgZWxhc3RpY0lwSWQ6IG5hdEdhdGV3YXlDb21wb25lbnQuZWxhc3RpY0lwSWQsXG4gICAgICAgICAgICAgICAgcHVibGljSXA6IG5hdEdhdGV3YXlDb21wb25lbnQucHVibGljSXAsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLm5hdEdhdGV3YXlzLnB1c2gocmVzdWx0KTtcbiAgICAgICAgICAgIHRoaXMubmF0R2F0ZXdheUlkcy5wdXNoKG5hdEdhdGV3YXlDb21wb25lbnQubmF0R2F0ZXdheUlkKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgbmF0R2F0ZXdheXM6IHRoaXMubmF0R2F0ZXdheXMsXG4gICAgICAgICAgICBuYXRHYXRld2F5SWRzOiB0aGlzLm5hdEdhdGV3YXlJZHMsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5hdEdhdGV3YXkobmFtZTogc3RyaW5nLCBhcmdzOiBOYXRHYXRld2F5QXJncyk6IE5hdEdhdGV3YXlSZXN1bHQge1xuICAgIGNvbnN0IG5hdEdhdGV3YXlDb21wb25lbnQgPSBuZXcgTmF0R2F0ZXdheUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYXRHYXRld2F5OiBuYXRHYXRld2F5Q29tcG9uZW50Lm5hdEdhdGV3YXksXG4gICAgICAgIG5hdEdhdGV3YXlJZDogbmF0R2F0ZXdheUNvbXBvbmVudC5uYXRHYXRld2F5SWQsXG4gICAgICAgIGVsYXN0aWNJcDogbmF0R2F0ZXdheUNvbXBvbmVudC5lbGFzdGljSXAsXG4gICAgICAgIGVsYXN0aWNJcElkOiBuYXRHYXRld2F5Q29tcG9uZW50LmVsYXN0aWNJcElkLFxuICAgICAgICBwdWJsaWNJcDogbmF0R2F0ZXdheUNvbXBvbmVudC5wdWJsaWNJcCxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTXVsdGlBek5hdEdhdGV3YXkobmFtZTogc3RyaW5nLCBhcmdzOiBNdWx0aUF6TmF0R2F0ZXdheUFyZ3MpOiBNdWx0aUF6TmF0R2F0ZXdheVJlc3VsdCB7XG4gICAgY29uc3QgbXVsdGlBekNvbXBvbmVudCA9IG5ldyBNdWx0aUF6TmF0R2F0ZXdheUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBuYXRHYXRld2F5czogbXVsdGlBekNvbXBvbmVudC5uYXRHYXRld2F5cyxcbiAgICAgICAgbmF0R2F0ZXdheUlkczogbXVsdGlBekNvbXBvbmVudC5uYXRHYXRld2F5SWRzLFxuICAgIH07XG59Il19