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
        super('aws:vpc:RouteTableComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.routeTable = new aws.ec2.RouteTable(`${name}-rt`, {
            vpcId: args.vpcId,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
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
                }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
                );
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
        super('aws:vpc:RouteTableAssociationComponent', name, {}, opts);
        this.association = new aws.ec2.RouteTableAssociation(`${name}-assoc`, {
            routeTableId: args.routeTableId,
            subnetId: args.subnetId,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
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
        super('aws:vpc:RouteTablesComponent', name, {}, opts);
        // Create public route table
        const publicRouteTableComponent = new RouteTableComponent(`${name}-public`, {
            vpcId: publicArgs.vpcId,
            name: `${publicArgs.name}-public`,
            tags: publicArgs.tags,
            routes: [
                {
                    cidrBlock: '0.0.0.0/0',
                    gatewayId: publicArgs.internetGatewayId,
                },
            ],
        }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
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
                }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
                );
                this.publicAssociations.push(association);
            });
        }
        // Create private route tables (one per NAT Gateway for HA)
        this.privateRouteTables = [];
        this.privateAssociations = [];
        const natGatewayIdsArray = Array.isArray(privateArgs.natGatewayIds)
            ? privateArgs.natGatewayIds
            : [privateArgs.natGatewayIds];
        const privateSubnetIdsArray = Array.isArray(privateArgs.privateSubnetIds)
            ? privateArgs.privateSubnetIds
            : [privateArgs.privateSubnetIds];
        natGatewayIdsArray.forEach((natGatewayId, index) => {
            const privateRouteTableComponent = new RouteTableComponent(`${name}-private-${index}`, {
                vpcId: privateArgs.vpcId,
                name: `${privateArgs.name}-private-${index}`,
                tags: privateArgs.tags,
                routes: [
                    {
                        cidrBlock: '0.0.0.0/0',
                        natGatewayId: natGatewayId,
                    },
                ],
            }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
            );
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
                }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
                );
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
function createRouteTable(name, args, opts // ← FIXED: Added third parameter
) {
    const routeTableComponent = new RouteTableComponent(name, args, opts); // ← FIXED: Pass opts through
    return {
        routeTable: routeTableComponent.routeTable,
        routeTableId: routeTableComponent.routeTableId,
        routes: routeTableComponent.routes,
    };
}
function createRouteTableAssociation(name, args, opts // ← FIXED: Added third parameter
) {
    const associationComponent = new RouteTableAssociationComponent(name, args, opts); // ← FIXED: Pass opts through
    return associationComponent.association;
}
function createRouteTables(name, publicArgs, privateArgs, opts // ← FIXED: Added third parameter
) {
    const routeTablesComponent = new RouteTablesComponent(name, publicArgs, privateArgs, opts // ← FIXED: Pass opts through
    );
    return {
        publicRouteTable: routeTablesComponent.publicRouteTable,
        privateRouteTables: routeTablesComponent.privateRouteTables,
        publicAssociations: routeTablesComponent.publicAssociations,
        privateAssociations: routeTablesComponent.privateAssociations,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVUYWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJvdXRlVGFibGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBMFBBLDRDQVdDO0FBRUQsa0VBV0M7QUFFRCw4Q0FrQkM7QUF0U0QsdURBQXlDO0FBQ3pDLGlEQUFtQztBQW9EbkMsTUFBYSxtQkFBb0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQy9DLFVBQVUsQ0FBcUI7SUFDL0IsWUFBWSxDQUF3QjtJQUNwQyxNQUFNLENBQWtCO0lBRXhDLFlBQ0UsSUFBWSxFQUNaLElBQW9CLEVBQ3BCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXJELE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNiLENBQUM7UUFFRixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQ3RDLEdBQUcsSUFBSSxLQUFLLEVBQ1o7WUFDRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsSUFBSSxFQUFFLFdBQVc7U0FDbEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxpQ0FBaUM7U0FDN0UsQ0FBQztRQUVGLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFDdkMsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFakIsdUNBQXVDO1FBQ3ZDLElBQUksSUFB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Qyw2QkFBNkI7SUFDaEMsT0FBTyxvQkFBb0IsQ0FBQyxXQUFXLENBQUM7QUFDMUMsQ0FBQztBQUVELFNBQWdCLGlCQUFpQixDQUMvQixJQUFZLEVBQ1osVUFBZ0MsRUFDaEMsV0FBa0MsRUFDbEMsSUFBc0MsQ0FBQyxpQ0FBaUM7O0lBRXhFLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxvQkFBb0IsQ0FDbkQsSUFBSSxFQUNKLFVBQVUsRUFDVixXQUFXLEVBQ1gsSUFBSSxDQUFDLDZCQUE2QjtLQUNuQyxDQUFDO0lBQ0YsT0FBTztRQUNMLGdCQUFnQixFQUFFLG9CQUFvQixDQUFDLGdCQUFnQjtRQUN2RCxrQkFBa0IsRUFBRSxvQkFBb0IsQ0FBQyxrQkFBa0I7UUFDM0Qsa0JBQWtCLEVBQUUsb0JBQW9CLENBQUMsa0JBQWtCO1FBQzNELG1CQUFtQixFQUFFLG9CQUFvQixDQUFDLG1CQUFtQjtLQUM5RCxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRlVGFibGVBcmdzIHtcbiAgdnBjSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgbmFtZTogc3RyaW5nO1xuICByb3V0ZXM/OiBBcnJheTx7XG4gICAgY2lkckJsb2NrPzogc3RyaW5nO1xuICAgIGRlc3RpbmF0aW9uUHJlZml4TGlzdElkPzogc3RyaW5nO1xuICAgIGdhdGV3YXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIG5hdEdhdGV3YXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIG5ldHdvcmtJbnRlcmZhY2VJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHRyYW5zaXRHYXRld2F5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICB2cGNQZWVyaW5nQ29ubmVjdGlvbklkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIH0+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJvdXRlVGFibGVSZXN1bHQge1xuICByb3V0ZVRhYmxlOiBhd3MuZWMyLlJvdXRlVGFibGU7XG4gIHJvdXRlVGFibGVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICByb3V0ZXM6IGF3cy5lYzIuUm91dGVbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSb3V0ZVRhYmxlQXNzb2NpYXRpb25BcmdzIHtcbiAgcm91dGVUYWJsZUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgc3VibmV0SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHVibGljUm91dGVUYWJsZUFyZ3Mge1xuICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGludGVybmV0R2F0ZXdheUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcHVibGljU3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFByaXZhdGVSb3V0ZVRhYmxlQXJncyB7XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgbmF0R2F0ZXdheUlkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSb3V0ZVRhYmxlc1Jlc3VsdCB7XG4gIHB1YmxpY1JvdXRlVGFibGU6IFJvdXRlVGFibGVSZXN1bHQ7XG4gIHByaXZhdGVSb3V0ZVRhYmxlczogUm91dGVUYWJsZVJlc3VsdFtdO1xuICBwdWJsaWNBc3NvY2lhdGlvbnM6IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uW107XG4gIHByaXZhdGVBc3NvY2lhdGlvbnM6IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uW107XG59XG5cbmV4cG9ydCBjbGFzcyBSb3V0ZVRhYmxlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHJvdXRlVGFibGU6IGF3cy5lYzIuUm91dGVUYWJsZTtcbiAgcHVibGljIHJlYWRvbmx5IHJvdXRlVGFibGVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcm91dGVzOiBhd3MuZWMyLlJvdXRlW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFJvdXRlVGFibGVBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6dnBjOlJvdXRlVGFibGVDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICB0aGlzLnJvdXRlVGFibGUgPSBuZXcgYXdzLmVjMi5Sb3V0ZVRhYmxlKFxuICAgICAgYCR7bmFtZX0tcnRgLFxuICAgICAge1xuICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogUGFzcyBwcm92aWRlciB0aHJvdWdoXG4gICAgKTtcblxuICAgIHRoaXMucm91dGVUYWJsZUlkID0gdGhpcy5yb3V0ZVRhYmxlLmlkO1xuICAgIHRoaXMucm91dGVzID0gW107XG5cbiAgICAvLyBDcmVhdGUgYWRkaXRpb25hbCByb3V0ZXMgaWYgcHJvdmlkZWRcbiAgICBpZiAoYXJncy5yb3V0ZXMpIHtcbiAgICAgIGFyZ3Mucm91dGVzLmZvckVhY2goKHJvdXRlQ29uZmlnLCBpbmRleCkgPT4ge1xuICAgICAgICBjb25zdCByb3V0ZSA9IG5ldyBhd3MuZWMyLlJvdXRlKFxuICAgICAgICAgIGAke25hbWV9LXJvdXRlLSR7aW5kZXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucm91dGVUYWJsZS5pZCxcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uQ2lkckJsb2NrOiByb3V0ZUNvbmZpZy5jaWRyQmxvY2ssIC8vIENoYW5nZWQgZnJvbSBjaWRyQmxvY2sgdG8gZGVzdGluYXRpb25DaWRyQmxvY2tcbiAgICAgICAgICAgIGRlc3RpbmF0aW9uUHJlZml4TGlzdElkOiByb3V0ZUNvbmZpZy5kZXN0aW5hdGlvblByZWZpeExpc3RJZCxcbiAgICAgICAgICAgIGdhdGV3YXlJZDogcm91dGVDb25maWcuZ2F0ZXdheUlkLFxuICAgICAgICAgICAgbmF0R2F0ZXdheUlkOiByb3V0ZUNvbmZpZy5uYXRHYXRld2F5SWQsXG4gICAgICAgICAgICBuZXR3b3JrSW50ZXJmYWNlSWQ6IHJvdXRlQ29uZmlnLm5ldHdvcmtJbnRlcmZhY2VJZCxcbiAgICAgICAgICAgIHRyYW5zaXRHYXRld2F5SWQ6IHJvdXRlQ29uZmlnLnRyYW5zaXRHYXRld2F5SWQsXG4gICAgICAgICAgICB2cGNQZWVyaW5nQ29ubmVjdGlvbklkOiByb3V0ZUNvbmZpZy52cGNQZWVyaW5nQ29ubmVjdGlvbklkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogUGFzcyBwcm92aWRlciB0aHJvdWdoXG4gICAgICAgICk7XG5cbiAgICAgICAgdGhpcy5yb3V0ZXMucHVzaChyb3V0ZSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICByb3V0ZVRhYmxlOiB0aGlzLnJvdXRlVGFibGUsXG4gICAgICByb3V0ZVRhYmxlSWQ6IHRoaXMucm91dGVUYWJsZUlkLFxuICAgICAgcm91dGVzOiB0aGlzLnJvdXRlcyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUm91dGVUYWJsZUFzc29jaWF0aW9uQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGFzc29jaWF0aW9uOiBhd3MuZWMyLlJvdXRlVGFibGVBc3NvY2lhdGlvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogUm91dGVUYWJsZUFzc29jaWF0aW9uQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnZwYzpSb3V0ZVRhYmxlQXNzb2NpYXRpb25Db21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICB0aGlzLmFzc29jaWF0aW9uID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgYCR7bmFtZX0tYXNzb2NgLFxuICAgICAge1xuICAgICAgICByb3V0ZVRhYmxlSWQ6IGFyZ3Mucm91dGVUYWJsZUlkLFxuICAgICAgICBzdWJuZXRJZDogYXJncy5zdWJuZXRJZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH0gLy8g4oaQIEZJWEVEOiBQYXNzIHByb3ZpZGVyIHRocm91Z2hcbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgYXNzb2NpYXRpb246IHRoaXMuYXNzb2NpYXRpb24sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJvdXRlVGFibGVzQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1JvdXRlVGFibGU6IFJvdXRlVGFibGVSZXN1bHQ7XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlUm91dGVUYWJsZXM6IFJvdXRlVGFibGVSZXN1bHRbXTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0Fzc29jaWF0aW9uczogYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb25bXTtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVBc3NvY2lhdGlvbnM6IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHB1YmxpY0FyZ3M6IFB1YmxpY1JvdXRlVGFibGVBcmdzLFxuICAgIHByaXZhdGVBcmdzOiBQcml2YXRlUm91dGVUYWJsZUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czp2cGM6Um91dGVUYWJsZXNDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBDcmVhdGUgcHVibGljIHJvdXRlIHRhYmxlXG4gICAgY29uc3QgcHVibGljUm91dGVUYWJsZUNvbXBvbmVudCA9IG5ldyBSb3V0ZVRhYmxlQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tcHVibGljYCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IHB1YmxpY0FyZ3MudnBjSWQsXG4gICAgICAgIG5hbWU6IGAke3B1YmxpY0FyZ3MubmFtZX0tcHVibGljYCxcbiAgICAgICAgdGFnczogcHVibGljQXJncy50YWdzLFxuICAgICAgICByb3V0ZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjaWRyQmxvY2s6ICcwLjAuMC4wLzAnLFxuICAgICAgICAgICAgZ2F0ZXdheUlkOiBwdWJsaWNBcmdzLmludGVybmV0R2F0ZXdheUlkLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogUGFzcyBwcm92aWRlciB0aHJvdWdoXG4gICAgKTtcblxuICAgIHRoaXMucHVibGljUm91dGVUYWJsZSA9IHtcbiAgICAgIHJvdXRlVGFibGU6IHB1YmxpY1JvdXRlVGFibGVDb21wb25lbnQucm91dGVUYWJsZSxcbiAgICAgIHJvdXRlVGFibGVJZDogcHVibGljUm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZVRhYmxlSWQsXG4gICAgICByb3V0ZXM6IHB1YmxpY1JvdXRlVGFibGVDb21wb25lbnQucm91dGVzLFxuICAgIH07XG5cbiAgICAvLyBDcmVhdGUgcHVibGljIHN1Ym5ldCBhc3NvY2lhdGlvbnNcbiAgICB0aGlzLnB1YmxpY0Fzc29jaWF0aW9ucyA9IFtdO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHB1YmxpY0FyZ3MucHVibGljU3VibmV0SWRzKSkge1xuICAgICAgcHVibGljQXJncy5wdWJsaWNTdWJuZXRJZHMuZm9yRWFjaCgoc3VibmV0SWQsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGFzc29jaWF0aW9uID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgICAgIGAke25hbWV9LXB1YmxpYy1hc3NvYy0ke2luZGV4fWAsXG4gICAgICAgICAge1xuICAgICAgICAgICAgcm91dGVUYWJsZUlkOiB0aGlzLnB1YmxpY1JvdXRlVGFibGUucm91dGVUYWJsZUlkLFxuICAgICAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldElkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogUGFzcyBwcm92aWRlciB0aHJvdWdoXG4gICAgICAgICk7XG4gICAgICAgIHRoaXMucHVibGljQXNzb2NpYXRpb25zLnB1c2goYXNzb2NpYXRpb24pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHByaXZhdGUgcm91dGUgdGFibGVzIChvbmUgcGVyIE5BVCBHYXRld2F5IGZvciBIQSlcbiAgICB0aGlzLnByaXZhdGVSb3V0ZVRhYmxlcyA9IFtdO1xuICAgIHRoaXMucHJpdmF0ZUFzc29jaWF0aW9ucyA9IFtdO1xuXG4gICAgY29uc3QgbmF0R2F0ZXdheUlkc0FycmF5ID0gQXJyYXkuaXNBcnJheShwcml2YXRlQXJncy5uYXRHYXRld2F5SWRzKVxuICAgICAgPyBwcml2YXRlQXJncy5uYXRHYXRld2F5SWRzXG4gICAgICA6IFtwcml2YXRlQXJncy5uYXRHYXRld2F5SWRzXTtcbiAgICBjb25zdCBwcml2YXRlU3VibmV0SWRzQXJyYXkgPSBBcnJheS5pc0FycmF5KHByaXZhdGVBcmdzLnByaXZhdGVTdWJuZXRJZHMpXG4gICAgICA/IHByaXZhdGVBcmdzLnByaXZhdGVTdWJuZXRJZHNcbiAgICAgIDogW3ByaXZhdGVBcmdzLnByaXZhdGVTdWJuZXRJZHNdO1xuXG4gICAgbmF0R2F0ZXdheUlkc0FycmF5LmZvckVhY2goKG5hdEdhdGV3YXlJZCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IHByaXZhdGVSb3V0ZVRhYmxlQ29tcG9uZW50ID0gbmV3IFJvdXRlVGFibGVDb21wb25lbnQoXG4gICAgICAgIGAke25hbWV9LXByaXZhdGUtJHtpbmRleH1gLFxuICAgICAgICB7XG4gICAgICAgICAgdnBjSWQ6IHByaXZhdGVBcmdzLnZwY0lkLFxuICAgICAgICAgIG5hbWU6IGAke3ByaXZhdGVBcmdzLm5hbWV9LXByaXZhdGUtJHtpbmRleH1gLFxuICAgICAgICAgIHRhZ3M6IHByaXZhdGVBcmdzLnRhZ3MsXG4gICAgICAgICAgcm91dGVzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGNpZHJCbG9jazogJzAuMC4wLjAvMCcsXG4gICAgICAgICAgICAgIG5hdEdhdGV3YXlJZDogbmF0R2F0ZXdheUlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH0gLy8g4oaQIEZJWEVEOiBQYXNzIHByb3ZpZGVyIHRocm91Z2hcbiAgICAgICk7XG5cbiAgICAgIHRoaXMucHJpdmF0ZVJvdXRlVGFibGVzLnB1c2goe1xuICAgICAgICByb3V0ZVRhYmxlOiBwcml2YXRlUm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZVRhYmxlLFxuICAgICAgICByb3V0ZVRhYmxlSWQ6IHByaXZhdGVSb3V0ZVRhYmxlQ29tcG9uZW50LnJvdXRlVGFibGVJZCxcbiAgICAgICAgcm91dGVzOiBwcml2YXRlUm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZXMsXG4gICAgICB9KTtcblxuICAgICAgLy8gQXNzb2NpYXRlIHByaXZhdGUgc3VibmV0cyB3aXRoIHRoZWlyIGNvcnJlc3BvbmRpbmcgcm91dGUgdGFibGVcbiAgICAgIGlmIChwcml2YXRlU3VibmV0SWRzQXJyYXlbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IGFzc29jaWF0aW9uID0gbmV3IGF3cy5lYzIuUm91dGVUYWJsZUFzc29jaWF0aW9uKFxuICAgICAgICAgIGAke25hbWV9LXByaXZhdGUtYXNzb2MtJHtpbmRleH1gLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJvdXRlVGFibGVJZDogcHJpdmF0ZVJvdXRlVGFibGVDb21wb25lbnQucm91dGVUYWJsZUlkLFxuICAgICAgICAgICAgc3VibmV0SWQ6IHByaXZhdGVTdWJuZXRJZHNBcnJheVtpbmRleF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH0gLy8g4oaQIEZJWEVEOiBQYXNzIHByb3ZpZGVyIHRocm91Z2hcbiAgICAgICAgKTtcbiAgICAgICAgdGhpcy5wcml2YXRlQXNzb2NpYXRpb25zLnB1c2goYXNzb2NpYXRpb24pO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgcHVibGljUm91dGVUYWJsZTogdGhpcy5wdWJsaWNSb3V0ZVRhYmxlLFxuICAgICAgcHJpdmF0ZVJvdXRlVGFibGVzOiB0aGlzLnByaXZhdGVSb3V0ZVRhYmxlcyxcbiAgICAgIHB1YmxpY0Fzc29jaWF0aW9uczogdGhpcy5wdWJsaWNBc3NvY2lhdGlvbnMsXG4gICAgICBwcml2YXRlQXNzb2NpYXRpb25zOiB0aGlzLnByaXZhdGVBc3NvY2lhdGlvbnMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlVGFibGUoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogUm91dGVUYWJsZUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zIC8vIOKGkCBGSVhFRDogQWRkZWQgdGhpcmQgcGFyYW1ldGVyXG4pOiBSb3V0ZVRhYmxlUmVzdWx0IHtcbiAgY29uc3Qgcm91dGVUYWJsZUNvbXBvbmVudCA9IG5ldyBSb3V0ZVRhYmxlQ29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpOyAvLyDihpAgRklYRUQ6IFBhc3Mgb3B0cyB0aHJvdWdoXG4gIHJldHVybiB7XG4gICAgcm91dGVUYWJsZTogcm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZVRhYmxlLFxuICAgIHJvdXRlVGFibGVJZDogcm91dGVUYWJsZUNvbXBvbmVudC5yb3V0ZVRhYmxlSWQsXG4gICAgcm91dGVzOiByb3V0ZVRhYmxlQ29tcG9uZW50LnJvdXRlcyxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJvdXRlVGFibGVBc3NvY2lhdGlvbihcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBSb3V0ZVRhYmxlQXNzb2NpYXRpb25BcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucyAvLyDihpAgRklYRUQ6IEFkZGVkIHRoaXJkIHBhcmFtZXRlclxuKTogYXdzLmVjMi5Sb3V0ZVRhYmxlQXNzb2NpYXRpb24ge1xuICBjb25zdCBhc3NvY2lhdGlvbkNvbXBvbmVudCA9IG5ldyBSb3V0ZVRhYmxlQXNzb2NpYXRpb25Db21wb25lbnQoXG4gICAgbmFtZSxcbiAgICBhcmdzLFxuICAgIG9wdHNcbiAgKTsgLy8g4oaQIEZJWEVEOiBQYXNzIG9wdHMgdGhyb3VnaFxuICByZXR1cm4gYXNzb2NpYXRpb25Db21wb25lbnQuYXNzb2NpYXRpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb3V0ZVRhYmxlcyhcbiAgbmFtZTogc3RyaW5nLFxuICBwdWJsaWNBcmdzOiBQdWJsaWNSb3V0ZVRhYmxlQXJncyxcbiAgcHJpdmF0ZUFyZ3M6IFByaXZhdGVSb3V0ZVRhYmxlQXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMgLy8g4oaQIEZJWEVEOiBBZGRlZCB0aGlyZCBwYXJhbWV0ZXJcbik6IFJvdXRlVGFibGVzUmVzdWx0IHtcbiAgY29uc3Qgcm91dGVUYWJsZXNDb21wb25lbnQgPSBuZXcgUm91dGVUYWJsZXNDb21wb25lbnQoXG4gICAgbmFtZSxcbiAgICBwdWJsaWNBcmdzLFxuICAgIHByaXZhdGVBcmdzLFxuICAgIG9wdHMgLy8g4oaQIEZJWEVEOiBQYXNzIG9wdHMgdGhyb3VnaFxuICApO1xuICByZXR1cm4ge1xuICAgIHB1YmxpY1JvdXRlVGFibGU6IHJvdXRlVGFibGVzQ29tcG9uZW50LnB1YmxpY1JvdXRlVGFibGUsXG4gICAgcHJpdmF0ZVJvdXRlVGFibGVzOiByb3V0ZVRhYmxlc0NvbXBvbmVudC5wcml2YXRlUm91dGVUYWJsZXMsXG4gICAgcHVibGljQXNzb2NpYXRpb25zOiByb3V0ZVRhYmxlc0NvbXBvbmVudC5wdWJsaWNBc3NvY2lhdGlvbnMsXG4gICAgcHJpdmF0ZUFzc29jaWF0aW9uczogcm91dGVUYWJsZXNDb21wb25lbnQucHJpdmF0ZUFzc29jaWF0aW9ucyxcbiAgfTtcbn1cbiJdfQ==