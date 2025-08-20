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
exports.RouteTablesComponent = exports.RouteTableAssociationComponent = exports.RouteTableComponent = void 0;
exports.createRouteTable = createRouteTable;
exports.createRouteTableAssociation = createRouteTableAssociation;
exports.createRouteTables = createRouteTables;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class RouteTableComponent extends pulumi.ComponentResource {
    routeTable;
    routeTableId;
    routes;
    constructor(name, args, opts) {
        super("aws:vpc:RouteTableComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.routeTable = new aws.ec2.RouteTable(`${name}-rt`, {
            vpcId: args.vpcId,
            tags: defaultTags,
        }, { parent: this });
        this.routeTableId = this.routeTable.id;
        this.routes = [];
        // Create additional routes if provided
        if (args.routes) {
            args.routes.forEach((routeConfig, index) => {
                const route = new aws.ec2.Route(`${name}-route-${index}`, {
                    routeTableId: this.routeTable.id,
                    destinationCidrBlock: routeConfig.cidrBlock, // Changed from cidrBlock to destinationCidrBlock
                    destinationPrefixListId: routeConfig.destinationPrefixListId,
                    gatewayId: routeConfig.gatewayId,
                    natGatewayId: routeConfig.natGatewayId,
                    networkInterfaceId: routeConfig.networkInterfaceId,
                    transitGatewayId: routeConfig.transitGatewayId,
                    vpcPeeringConnectionId: routeConfig.vpcPeeringConnectionId,
                }, { parent: this });
                this.routes.push(route);
            });
        }
        this.registerOutputs({
            routeTable: this.routeTable,
            routeTableId: this.routeTableId,
            routes: this.routes,
        });
    }
}
exports.RouteTableComponent = RouteTableComponent;
class RouteTableAssociationComponent extends pulumi.ComponentResource {
    association;
    constructor(name, args, opts) {
        super("aws:vpc:RouteTableAssociationComponent", name, {}, opts);
        this.association = new aws.ec2.RouteTableAssociation(`${name}-assoc`, {
            routeTableId: args.routeTableId,
            subnetId: args.subnetId,
        }, { parent: this });
        this.registerOutputs({
            association: this.association,
        });
    }
}
exports.RouteTableAssociationComponent = RouteTableAssociationComponent;
class RouteTablesComponent extends pulumi.ComponentResource {
    publicRouteTable;
    privateRouteTables;
    publicAssociations;
    privateAssociations;
    constructor(name, publicArgs, privateArgs, opts) {
        super("aws:vpc:RouteTablesComponent", name, {}, opts);
        // Create public route table
        const publicRouteTableComponent = new RouteTableComponent(`${name}-public`, {
            vpcId: publicArgs.vpcId,
            name: `${publicArgs.name}-public`,
            tags: publicArgs.tags,
            routes: [{
                    cidrBlock: "0.0.0.0/0",
                    gatewayId: publicArgs.internetGatewayId,
                }],
        }, { parent: this });
        this.publicRouteTable = {
            routeTable: publicRouteTableComponent.routeTable,
            routeTableId: publicRouteTableComponent.routeTableId,
            routes: publicRouteTableComponent.routes,
        };
        // Create public subnet associations
        this.publicAssociations = [];
        if (Array.isArray(publicArgs.publicSubnetIds)) {
            publicArgs.publicSubnetIds.forEach((subnetId, index) => {
                const association = new aws.ec2.RouteTableAssociation(`${name}-public-assoc-${index}`, {
                    routeTableId: this.publicRouteTable.routeTableId,
                    subnetId: subnetId,
                }, { parent: this });
                this.publicAssociations.push(association);
            });
        }
        // Create private route tables (one per NAT Gateway for HA)
        this.privateRouteTables = [];
        this.privateAssociations = [];
        const natGatewayIdsArray = Array.isArray(privateArgs.natGatewayIds) ? privateArgs.natGatewayIds : [privateArgs.natGatewayIds];
        const privateSubnetIdsArray = Array.isArray(privateArgs.privateSubnetIds) ? privateArgs.privateSubnetIds : [privateArgs.privateSubnetIds];
        natGatewayIdsArray.forEach((natGatewayId, index) => {
            const privateRouteTableComponent = new RouteTableComponent(`${name}-private-${index}`, {
                vpcId: privateArgs.vpcId,
                name: `${privateArgs.name}-private-${index}`,
                tags: privateArgs.tags,
                routes: [{
                        cidrBlock: "0.0.0.0/0",
                        natGatewayId: natGatewayId,
                    }],
            }, { parent: this });
            this.privateRouteTables.push({
                routeTable: privateRouteTableComponent.routeTable,
                routeTableId: privateRouteTableComponent.routeTableId,
                routes: privateRouteTableComponent.routes,
            });
            // Associate private subnets with their corresponding route table
            if (privateSubnetIdsArray[index]) {
                const association = new aws.ec2.RouteTableAssociation(`${name}-private-assoc-${index}`, {
                    routeTableId: privateRouteTableComponent.routeTableId,
                    subnetId: privateSubnetIdsArray[index],
                }, { parent: this });
                this.privateAssociations.push(association);
            }
        });
        this.registerOutputs({
            publicRouteTable: this.publicRouteTable,
            privateRouteTables: this.privateRouteTables,
            publicAssociations: this.publicAssociations,
            privateAssociations: this.privateAssociations,
        });
    }
}
exports.RouteTablesComponent = RouteTablesComponent;
function createRouteTable(name, args) {
    const routeTableComponent = new RouteTableComponent(name, args);
    return {
        routeTable: routeTableComponent.routeTable,
        routeTableId: routeTableComponent.routeTableId,
        routes: routeTableComponent.routes,
    };
}
function createRouteTableAssociation(name, args) {
    const associationComponent = new RouteTableAssociationComponent(name, args);
    return associationComponent.association;
}
function createRouteTables(name, publicArgs, privateArgs) {
    const routeTablesComponent = new RouteTablesComponent(name, publicArgs, privateArgs);
    return {
        publicRouteTable: routeTablesComponent.publicRouteTable,
        privateRouteTables: routeTablesComponent.privateRouteTables,
        publicAssociations: routeTablesComponent.publicAssociations,
        privateAssociations: routeTablesComponent.privateAssociations,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVUYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJvdXRlVGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBeU1BLDRDQU9DO0FBRUQsa0VBR0M7QUFFRCw4Q0FRQztBQS9ORCx1REFBeUM7QUFDekMsaURBQW1DO0FBb0RuQyxNQUFhLG1CQUFvQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDN0MsVUFBVSxDQUFxQjtJQUMvQixZQUFZLENBQXdCO0lBQ3BDLE1BQU0sQ0FBa0I7SUFFeEMsWUFBWSxJQUFZLEVBQUUsSUFBb0IsRUFBRSxJQUFzQztRQUNsRixLQUFLLENBQUMsNkJBQTZCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVyRCxNQUFNLFdBQVcsR0FBRztZQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUM5QixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUseUJBQXlCO1lBQ2xDLEdBQUcsSUFBSSxDQUFDLElBQUk7U0FDZixDQUFDO1FBRUYsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxLQUFLLEVBQUU7WUFDbkQsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLElBQUksRUFBRSxXQUFXO1NBQ3BCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1FBRWpCLHVDQUF1QztRQUN2QyxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNkLElBQUksQ0FBQyxNQUFNLENB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dW1pXCI7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVUYWJsZUFyZ3Mge1xuICAgIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgcm91dGVzPzogQXJyYXk8e1xuICAgICAgICBjaWRyQmxvY2s/OiBzdHJpbmc7XG4gICAgICAgIGRlc3RpbmF0aW9uUHJlZml4TGlzdElkPzogc3RyaW5nO1xuICAgICAgICBnYXRld2F5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICAgICAgbmF0R2F0ZXdheUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgICAgIG5ldHdvcmtJbnRlcmZhY2VJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgICAgICB0cmFuc2l0R2F0ZXdheUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgICAgIHZwY1BlZXJpbmdDb25uZWN0aW9uSWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICB9Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSb3V0ZVRhYmxlUmVzdWx0IHtcbiAgICByb3V0ZVRhYmxlOiBhd3MuZWMyLlJvdXRlVGFibGU7XG4gICAgcm91dGVUYWJsZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcm91dGVzOiBhd3MuZWMyLlJvdXRlW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUm91dGVUYWJsZUFzc29jaWF0aW9uQXJncyB7XG4gICAgcm91dGVUYWJsZUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBzdWJuZXRJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFB1YmxpY1JvdXRlVGFibGVBcmdzIHtcbiAgICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgaW50ZXJuZXRHYXRld2F5SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHB1YmxpY1N1Ym5ldElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJpdmF0ZVJvdXRlVGFibGVBcmdzIHtcbiAgICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgbmF0R2F0ZXdheUlkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgICBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSb3V0ZVRhYmxlc1Jlc3VsdCB7XG4gICAgcHVibGljUm91dGVUYWJsZTogUm91dGVUYWJsZVJlc3VsdDtcbiAgICBwcml2YXRlUm91dGVUYWJsZXM6IFJvdXRlVGFibGVSZXN1bHRbXTtcbiAgICBwdWJsaWNBc3NvY2lhdGlvbnM6IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uW107XG4gICAgcHJpdmF0ZUFzc29jaWF0aW9uczogYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb25bXTtcbn1cblxuZXhwb3J0IGNsYXNzIFJvdXRlVGFibGVDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSByb3V0ZVRhYmxlOiBhd3MuZWMyLlJvdXRlVGFibGU7XG4gICAgcHVibGljIHJlYWRvbmx5IHJvdXRlVGFibGVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSByb3V0ZXM6IGF3cy5lYzIuUm91dGVbXTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogUm91dGVUYWJsZUFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnZwYzpSb3V0ZVRhYmxlQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJvdXRlVGFibGUgPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlKGAke25hbWV9LXJ0YCwge1xuICAgICAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5yb3V0ZVRhYmxlSWQgPSB0aGlzLnJvdXRlVGFibGUuaWQ7XG4gICAgICAgIHRoaXMucm91dGVzID0gW107XG5cbiAgICAgICAgLy8gQ3JlYXRlIGFkZGl0aW9uYWwgcm91dGVzIGlmIHByb3ZpZGVkXG4gICAgICAgIGlmIChhcmdzLnJvdXRlcykge1xuICAgICAgICAgICAgYXJncy5yb3V0ZXMuZm9yRWFjaCgocm91dGVDb25maWcsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm91dGUgPSBuZXcgYXdzLmVjMi5Sb3V0ZShgJHtuYW1lfS1yb3V0ZS0ke2luZGV4fWAsIHtcbiAgICAgICAgICAgICAgICAgICAgcm91dGVUYWJsZUlkOiB0aGlzLnJvdXRlVGFibGUuaWQsXG4gICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiByb3V0ZUNvbmZpZy5jaWRyQmxvY2ssIC8vIENoYW5nZWQgZnJvbSBjaWRyQmxvY2sgdG8gZGVzdGluYXRpb25DaWRyQmxvY2tcbiAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QcmVmaXhMaXN0SWQ6IHJvdXRlQ29uZmlnLmRlc3RpbmF0aW9uUHJlZml4TGlzdElkLFxuICAgICAgICAgICAgICAgICAgICBnYXRld2F5SWQ6IHJvdXRlQ29uZmlnLmdhdGV3YXlJZCxcbiAgICAgICAgICAgICAgICAgICAgbmF0R2F0ZXdheUlkOiByb3V0ZUNvbmZpZy5uYXRHYXRld2F5SWQsXG4gICAgICAgICAgICAgICAgICAgIG5ldHdvcmtJbnRlcmZhY2VJZDogcm91dGVDb25maWcubmV0d29ya0ludGVyZmFjZUlkLFxuICAgICAgICAgICAgICAgICAgICB0cmFuc2l0R2F0ZXdheUlkOiByb3V0ZUNvbmZpZy50cmFuc2l0R2F0ZXdheUlkLFxuICAgICAgICAgICAgICAgICAgICB2cGNQZWVyaW5nQ29ubmVjdGlvbklkOiByb3V0ZUNvbmZpZy52cGNQZWVyaW5nQ29ubmVjdGlvbklkLFxuICAgICAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5yb3V0ZXMucHVzaChyb3V0ZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHJvdXRlVGFibGU6IHRoaXMucm91dGVUYWJsZSxcbiAgICAgICAgICAgIHJvdXRlVGFibGVJZDogdGhpcy5yb3V0ZVRhYmxlSWQsXG4gICAgICAgICAgICByb3V0ZXM6IHRoaXMucm91dGVzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSb3V0ZVRhYmxlQXNzb2NpYXRpb25Db21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBhc3NvY2lhdGlvbjogYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb247XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFJvdXRlVGFibGVBc3NvY2lhdGlvbkFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnZwYzpSb3V0ZVRhYmxlQXNzb2NpYXRpb25Db21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIHRoaXMuYXNzb2NpYXRpb24gPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oYCR7bmFtZX0tYXNzb2NgLCB7XG4gICAgICAgICAgICByb3V0ZVRhYmxlSWQ6IGFyZ3Mucm91dGVUYWJsZUlkLFxuICAgICAgICAgICAgc3VibmV0SWQ6IGFyZ3Muc3VibmV0SWQsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGFzc29jaWF0aW9uOiB0aGlzLmFzc29jaWF0aW9uLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSb3V0ZVRhYmxlc0NvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1JvdXRlVGFibGU6IFJvdXRlVGFibGVSZXN1bHQ7XG4gICAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVSb3V0ZVRhYmxlczogUm91dGVUYWJsZVJlc3VsdFtdO1xuICAgIHB1YmxpYyByZWFkb25seSBwdWJsaWNBc3NvY2lhdGlvbnM6IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uW107XG4gICAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVBc3NvY2lhdGlvbnM6IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uW107XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIHB1YmxpY0FyZ3M6IFB1YmxpY1JvdXRlVGFibGVBcmdzLCBwcml2YXRlQXJnczogUHJpdmF0ZVJvdXRlVGFibGVBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czp2cGM6Um91dGVUYWJsZXNDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBwdWJsaWMgcm91dGUgdGFibGVcbiAgICAgICAgY29uc3QgcHVibGljUm91dGVUYWJsZUNvbXBvbmVudCA9IG5ldyBSb3V0ZVRhYmxlQ29tcG9uZW50KGAke25hbWV9LXB1YmxpY2AsIHtcbiAgICAgICAgICAgIHZwY0lkOiBwdWJsaWNBcmdzLnZwY0lkLFxuICAgICAgICAgICAgbmFtZTogYCR7cHVibGljQXJncy5uYW1lfS1wdWJsaWNgLFxuICAgICAgICAgICAgdGFnczogcHVibGljQXJncy50YWdzLFxuICAgICAgICAgICAgcm91dGVzOiBbe1xuICAgICAgICAgICAgICAgIGNpZHJCbG9jazogXCIwLjAuMC4wLzBcIixcbiAgICAgICAgICAgICAgICBnYXRld2F5SWQ6IHB1YmxpY0FyZ3MuaW50ZXJuZXRHYXRld2F5SWQsXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5wdWJsaWNSb3V0ZVRhYmxlID0ge1xuICAgICAgICAgICAgcm91dGVUYWJsZTogcHVibGljUm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZVRhYmxlLFxuICAgICAgICAgICAgcm91dGVUYWJsZUlkOiBwdWJsaWNSb3V0ZVRhYmxlQ29tcG9uZW50LnJvdXRlVGFibGVJZCxcbiAgICAgICAgICAgIHJvdXRlczogcHVibGljUm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZXMsXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gQ3JlYXRlIHB1YmxpYyBzdWJuZXQgYXNzb2NpYXRpb25zXG4gICAgICAgIHRoaXMucHVibGljQXNzb2NpYXRpb25zID0gW107XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHB1YmxpY0FyZ3MucHVibGljU3VibmV0SWRzKSkge1xuICAgICAgICAgICAgcHVibGljQXJncy5wdWJsaWNTdWJuZXRJZHMuZm9yRWFjaCgoc3VibmV0SWQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzb2NpYXRpb24gPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oYCR7bmFtZX0tcHVibGljLWFzc29jLSR7aW5kZXh9YCwge1xuICAgICAgICAgICAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucHVibGljUm91dGVUYWJsZS5yb3V0ZVRhYmxlSWQsXG4gICAgICAgICAgICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXRJZCxcbiAgICAgICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLnB1YmxpY0Fzc29jaWF0aW9ucy5wdXNoKGFzc29jaWF0aW9uKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ3JlYXRlIHByaXZhdGUgcm91dGUgdGFibGVzIChvbmUgcGVyIE5BVCBHYXRld2F5IGZvciBIQSlcbiAgICAgICAgdGhpcy5wcml2YXRlUm91dGVUYWJsZXMgPSBbXTtcbiAgICAgICAgdGhpcy5wcml2YXRlQXNzb2NpYXRpb25zID0gW107XG5cbiAgICAgICAgY29uc3QgbmF0R2F0ZXdheUlkc0FycmF5ID0gQXJyYXkuaXNBcnJheShwcml2YXRlQXJncy5uYXRHYXRld2F5SWRzKSA/IHByaXZhdGVBcmdzLm5hdEdhdGV3YXlJZHMgOiBbcHJpdmF0ZUFyZ3MubmF0R2F0ZXdheUlkc107XG4gICAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXRJZHNBcnJheSA9IEFycmF5LmlzQXJyYXkocHJpdmF0ZUFyZ3MucHJpdmF0ZVN1Ym5ldElkcykgPyBwcml2YXRlQXJncy5wcml2YXRlU3VibmV0SWRzIDogW3ByaXZhdGVBcmdzLnByaXZhdGVTdWJuZXRJZHNdO1xuXG4gICAgICAgIG5hdEdhdGV3YXlJZHNBcnJheS5mb3JFYWNoKChuYXRHYXRld2F5SWQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBwcml2YXRlUm91dGVUYWJsZUNvbXBvbmVudCA9IG5ldyBSb3V0ZVRhYmxlQ29tcG9uZW50KGAke25hbWV9LXByaXZhdGUtJHtpbmRleH1gLCB7XG4gICAgICAgICAgICAgICAgdnBjSWQ6IHByaXZhdGVBcmdzLnZwY0lkLFxuICAgICAgICAgICAgICAgIG5hbWU6IGAke3ByaXZhdGVBcmdzLm5hbWV9LXByaXZhdGUtJHtpbmRleH1gLFxuICAgICAgICAgICAgICAgIHRhZ3M6IHByaXZhdGVBcmdzLnRhZ3MsXG4gICAgICAgICAgICAgICAgcm91dGVzOiBbe1xuICAgICAgICAgICAgICAgICAgICBjaWRyQmxvY2s6IFwiMC4wLjAuMC8wXCIsXG4gICAgICAgICAgICAgICAgICAgIG5hdEdhdGV3YXlJZDogbmF0R2F0ZXdheUlkLFxuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgICAgIHRoaXMucHJpdmF0ZVJvdXRlVGFibGVzLnB1c2goe1xuICAgICAgICAgICAgICAgIHJvdXRlVGFibGU6IHByaXZhdGVSb3V0ZVRhYmxlQ29tcG9uZW50LnJvdXRlVGFibGUsXG4gICAgICAgICAgICAgICAgcm91dGVUYWJsZUlkOiBwcml2YXRlUm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZVRhYmxlSWQsXG4gICAgICAgICAgICAgICAgcm91dGVzOiBwcml2YXRlUm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZXMsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gQXNzb2NpYXRlIHByaXZhdGUgc3VibmV0cyB3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgcm91dGUgdGFibGVcbiAgICAgICAgICAgIGlmIChwcml2YXRlU3VibmV0SWRzQXJyYXlbaW5kZXhdKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXNzb2NpYXRpb24gPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24oYCR7bmFtZX0tcHJpdmF0ZS1hc3NvYy0ke2luZGV4fWAsIHtcbiAgICAgICAgICAgICAgICAgICAgcm91dGVUYWJsZUlkOiBwcml2YXRlUm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZVRhYmxlSWQsXG4gICAgICAgICAgICAgICAgICAgIHN1Ym5ldElkOiBwcml2YXRlU3VibmV0SWRzQXJyYXlbaW5kZXhdLFxuICAgICAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMucHJpdmF0ZUFzc29jaWF0aW9ucy5wdXNoKGFzc29jaWF0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgcHVibGljUm91dGVUYWJsZTogdGhpcy5wdWJsaWNSb3V0ZVRhYmxlLFxuICAgICAgICAgICAgcHJpdmF0ZVJvdXRlVGFibGVzOiB0aGlzLnByaXZhdGVSb3V0ZVRhYmxlcyxcbiAgICAgICAgICAgIHB1YmxpY0Fzc29jaWF0aW9uczogdGhpcy5wdWJsaWNBc3NvY2lhdGlvbnMsXG4gICAgICAgICAgICBwcml2YXRlQXNzb2NpYXRpb25zOiB0aGlzLnByaXZhdGVBc3NvY2lhdGlvbnMsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlVGFibGUobmFtZTogc3RyaW5nLCBhcmdzOiBSb3V0ZVRhYmxlQXJncyk6IFJvdXRlVGFibGVSZXN1bHQge1xuICAgIGNvbnN0IHJvdXRlVGFibGVDb21wb25lbnQgPSBuZXcgUm91dGVUYWJsZUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByb3V0ZVRhYmxlOiByb3V0ZVRhYmxlQ29tcG9uZW50LnJvdXRlVGFibGUsXG4gICAgICAgIHJvdXRlVGFibGVJZDogcm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZVRhYmxlSWQsXG4gICAgICAgIHJvdXRlczogcm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZXMsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlVGFibGVBc3NvY2lhdGlvbihuYW1lOiBzdHJpbmcsIGFyZ3M6IFJvdXRlVGFibGVBc3NvY2lhdGlvbkFyZ3MpOiBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbiB7XG4gICAgY29uc3QgYXNzb2NpYXRpb25Db21wb25lbnQgPSBuZXcgUm91dGVUYWJsZUFzc29jaWF0aW9uQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiBhc3NvY2lhdGlvbkNvbXBvbmVudC5hc3NvY2lhdGlvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlVGFibGVzKG5hbWU6IHN0cmluZywgcHVibGljQXJnczogUHVibGljUm91dGVUYWJsZUFyZ3MsIHByaXZhdGVBcmdzOiBQcml2YXRlUm91dGVUYWJsZUFyZ3MpOiBSb3V0ZVRhYmxlc1Jlc3VsdCB7XG4gICAgY29uc3Qgcm91dGVUYWJsZXNDb21wb25lbnQgPSBuZXcgUm91dGVUYWJsZXNDb21wb25lbnQobmFtZSwgcHVibGljQXJncywgcHJpdmF0ZUFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHB1YmxpY1JvdXRlVGFibGU6IHJvdXRlVGFibGVzQ29tcG9uZW50LnB1YmxpY1JvdXRlVGFibGUsXG4gICAgICAgIHByaXZhdGVSb3V0ZVRhYmxlczogcm91dGVUYWJsZXNDb21wb25lbnQucHJpdmF0ZVJvdXRlVGFibGVzLFxuICAgICAgICBwdWJsaWNBc3NvY2lhdGlvbnM6IHJvdXRlVGFibGVzQ29tcG9uZW50LnB1YmxpY0Fzc29jaWF0aW9ucyxcbiAgICAgICAgcHJpdmF0ZUFzc29jaWF0aW9uczogcm91dGVUYWJsZXNDb21wb25lbnQucHJpdmF0ZUFzc29jaWF0aW9ucyxcbiAgICB9O1xufSJdfQ==