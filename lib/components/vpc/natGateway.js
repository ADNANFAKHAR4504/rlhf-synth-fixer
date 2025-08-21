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
        super('aws:vpc:NatGatewayComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        const connectivityType = args.connectivityType || 'public';
        let allocationId = args.allocationId;
        // Create Elastic IP for public NAT Gateway if not provided
        if (connectivityType === 'public' && !allocationId) {
            this.elasticIp = new aws.ec2.Eip(`${name}-eip`, {
                domain: 'vpc',
                tags: {
                    ...defaultTags,
                    Name: `${args.name}-eip`,
                },
            }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
            );
            this.elasticIpId = this.elasticIp.id;
            this.publicIp = this.elasticIp.publicIp;
            allocationId = this.elasticIp.id;
        }
        this.natGateway = new aws.ec2.NatGateway(`${name}-nat`, {
            subnetId: args.subnetId,
            allocationId: allocationId,
            connectivityType: connectivityType,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
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
        super('aws:vpc:MultiAzNatGatewayComponent', name, {}, opts);
        this.natGateways = [];
        this.natGatewayIds = [];
        args.publicSubnetIds.forEach((subnetId, index) => {
            const natGatewayComponent = new NatGatewayComponent(`${name}-${index}`, {
                subnetId: subnetId,
                connectivityType: 'public',
                name: `${args.name}-${index}`,
                tags: args.tags,
            }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
            );
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
function createNatGateway(name, args, opts // ← FIXED: Added third parameter
) {
    const natGatewayComponent = new NatGatewayComponent(name, args, opts); // ← FIXED: Pass opts through
    return {
        natGateway: natGatewayComponent.natGateway,
        natGatewayId: natGatewayComponent.natGatewayId,
        elasticIp: natGatewayComponent.elasticIp,
        elasticIpId: natGatewayComponent.elasticIpId,
        publicIp: natGatewayComponent.publicIp,
    };
}
function createMultiAzNatGateway(name, args, opts // ← FIXED: Added third parameter
) {
    const multiAzComponent = new MultiAzNatGatewayComponent(name, args, opts); // ← FIXED: Pass opts through
    return {
        natGateways: multiAzComponent.natGateways,
        natGatewayIds: multiAzComponent.natGatewayIds,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmF0R2F0ZXdheS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5hdEdhdGV3YXkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOElBLDRDQWFDO0FBRUQsMERBVUM7QUF2S0QsdURBQXlDO0FBQ3pDLGlEQUFtQztBQTZCbkMsTUFBYSxtQkFBb0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQy9DLFVBQVUsQ0FBcUI7SUFDL0IsWUFBWSxDQUF3QjtJQUNwQyxTQUFTLENBQWU7SUFDeEIsV0FBVyxDQUF5QjtJQUNwQyxRQUFRLENBQXlCO0lBRWpELFlBQ0UsSUFBWSxFQUNaLElBQW9CLEVBQ3BCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXJELE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNiLENBQUM7UUFFRixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxRQUFRLENBQUM7UUFDM0QsSUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUVyQywyREFBMkQ7UUFDM0QsSUFBSSxnQkFBZ0IsS0FBSyxRQUFRLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUNuRCxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQzlCLEdBQUcsSUFBSSxNQUFNLEVBQ2I7Z0JBQ0UsTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsSUFBSSxFQUFFO29CQUNKLEdBQUcsV0FBVztvQkFDZCxJQUFJLEVBQUUsR0FBRyxJ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QUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1NBQ2xDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTNDRCxnRUEyQ0M7QUFFRCxTQUFnQixnQkFBZ0IsQ0FDOUIsSUFBWSxFQUNaLElBQW9CLEVBQ3BCLElBQXNDLENBQUMsaUNBQWlDOztJQUV4RSxNQUFNLG1CQUFtQixHQUFHLElBQUksbUJBQW1CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLDZCQUE2QjtJQUNwRyxPQUFPO1FBQ0wsVUFBVSxFQUFFLG1CQUFtQixDQUFDLFVBQVU7UUFDMUMsWUFBWSxFQUFFLG1CQUFtQixDQUFDLFlBQVk7UUFDOUMsU0FBUyxFQUFFLG1CQUFtQixDQUFDLFNBQVM7UUFDeEMsV0FBVyxFQUFFLG1CQUFtQixDQUFDLFdBQVc7UUFDNUMsUUFBUSxFQUFFLG1CQUFtQixDQUFDLFFBQVE7S0FDdkMsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFnQix1QkFBdUIsQ0FDckMsSUFBWSxFQUNaLElBQTJCLEVBQzNCLElBQXNDLENBQUMsaUNBQWlDOztJQUV4RSxNQUFNLGdCQUFnQixHQUFHLElBQUksMEJBQTBCLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLDZCQUE2QjtJQUN4RyxPQUFPO1FBQ0wsV0FBVyxFQUFFLGdCQUFnQixDQUFDLFdBQVc7UUFDekMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLGFBQWE7S0FDOUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBOYXRHYXRld2F5QXJncyB7XG4gIHN1Ym5ldElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgYWxsb2NhdGlvbklkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGNvbm5lY3Rpdml0eVR5cGU/OiAncHVibGljJyB8ICdwcml2YXRlJztcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOYXRHYXRld2F5UmVzdWx0IHtcbiAgbmF0R2F0ZXdheTogYXdzLmVjMi5OYXRHYXRld2F5O1xuICBuYXRHYXRld2F5SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgZWxhc3RpY0lwPzogYXdzLmVjMi5FaXA7XG4gIGVsYXN0aWNJcElkPzogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWNJcD86IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNdWx0aUF6TmF0R2F0ZXdheUFyZ3Mge1xuICBwdWJsaWNTdWJuZXRJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTXVsdGlBek5hdEdhdGV3YXlSZXN1bHQge1xuICBuYXRHYXRld2F5czogTmF0R2F0ZXdheVJlc3VsdFtdO1xuICBuYXRHYXRld2F5SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz5bXTtcbn1cblxuZXhwb3J0IGNsYXNzIE5hdEdhdGV3YXlDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgbmF0R2F0ZXdheTogYXdzLmVjMi5OYXRHYXRld2F5O1xuICBwdWJsaWMgcmVhZG9ubHkgbmF0R2F0ZXdheUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBlbGFzdGljSXA/OiBhd3MuZWMyLkVpcDtcbiAgcHVibGljIHJlYWRvbmx5IGVsYXN0aWNJcElkPzogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcHVibGljSXA/OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IE5hdEdhdGV3YXlBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6dnBjOk5hdEdhdGV3YXlDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICBjb25zdCBjb25uZWN0aXZpdHlUeXBlID0gYXJncy5jb25uZWN0aXZpdHlUeXBlIHx8ICdwdWJsaWMnO1xuICAgIGxldCBhbGxvY2F0aW9uSWQgPSBhcmdzLmFsbG9jYXRpb25JZDtcblxuICAgIC8vIENyZWF0ZSBFbGFzdGljIElQIGZvciBwdWJsaWMgTkFUIEdhdGV3YXkgaWYgbm90IHByb3ZpZGVkXG4gICAgaWYgKGNvbm5lY3Rpdml0eVR5cGUgPT09ICdwdWJsaWMnICYmICFhbGxvY2F0aW9uSWQpIHtcbiAgICAgIHRoaXMuZWxhc3RpY0lwID0gbmV3IGF3cy5lYzIuRWlwKFxuICAgICAgICBgJHtuYW1lfS1laXBgLFxuICAgICAgICB7XG4gICAgICAgICAgZG9tYWluOiAndnBjJyxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAuLi5kZWZhdWx0VGFncyxcbiAgICAgICAgICAgIE5hbWU6IGAke2FyZ3MubmFtZX0tZWlwYCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH0gLy8g4oaQIEZJWEVEOiBQYXNzIHByb3ZpZGVyIHRocm91Z2hcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuZWxhc3RpY0lwSWQgPSB0aGlzLmVsYXN0aWNJcC5pZDtcbiAgICAgIHRoaXMucHVibGljSXAgPSB0aGlzLmVsYXN0aWNJcC5wdWJsaWNJcDtcbiAgICAgIGFsbG9jYXRpb25JZCA9IHRoaXMuZWxhc3RpY0lwLmlkO1xuICAgIH1cblxuICAgIHRoaXMubmF0R2F0ZXdheSA9IG5ldyBhd3MuZWMyLk5hdEdhdGV3YXkoXG4gICAgICBgJHtuYW1lfS1uYXRgLFxuICAgICAge1xuICAgICAgICBzdWJuZXRJZDogYXJncy5zdWJuZXRJZCxcbiAgICAgICAgYWxsb2NhdGlvbklkOiBhbGxvY2F0aW9uSWQsXG4gICAgICAgIGNvbm5lY3Rpdml0eVR5cGU6IGNvbm5lY3Rpdml0eVR5cGUsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfSAvLyDihpAgRklYRUQ6IFBhc3MgcHJvdmlkZXIgdGhyb3VnaFxuICAgICk7XG5cbiAgICB0aGlzLm5hdEdhdGV3YXlJZCA9IHRoaXMubmF0R2F0ZXdheS5pZDtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIG5hdEdhdGV3YXk6IHRoaXMubmF0R2F0ZXdheSxcbiAgICAgIG5hdEdhdGV3YXlJZDogdGhpcy5uYXRHYXRld2F5SWQsXG4gICAgICBlbGFzdGljSXA6IHRoaXMuZWxhc3RpY0lwLFxuICAgICAgZWxhc3RpY0lwSWQ6IHRoaXMuZWxhc3RpY0lwSWQsXG4gICAgICBwdWJsaWNJcDogdGhpcy5wdWJsaWNJcCxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTXVsdGlBek5hdEdhdGV3YXlDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgbmF0R2F0ZXdheXM6IE5hdEdhdGV3YXlSZXN1bHRbXTtcbiAgcHVibGljIHJlYWRvbmx5IG5hdEdhdGV3YXlJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBNdWx0aUF6TmF0R2F0ZXdheUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czp2cGM6TXVsdGlBek5hdEdhdGV3YXlDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICB0aGlzLm5hdEdhdGV3YXlzID0gW107XG4gICAgdGhpcy5uYXRHYXRld2F5SWRzID0gW107XG5cbiAgICBhcmdzLnB1YmxpY1N1Ym5ldElkcy5mb3JFYWNoKChzdWJuZXRJZCwgaW5kZXgpID0+IHtcbiAgICAgIGNvbnN0IG5hdEdhdGV3YXlDb21wb25lbnQgPSBuZXcgTmF0R2F0ZXdheUNvbXBvbmVudChcbiAgICAgICAgYCR7bmFtZX0tJHtpbmRleH1gLFxuICAgICAgICB7XG4gICAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldElkLFxuICAgICAgICAgIGNvbm5lY3Rpdml0eVR5cGU6ICdwdWJsaWMnLFxuICAgICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tJHtpbmRleH1gLFxuICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogUGFzcyBwcm92aWRlciB0aHJvdWdoXG4gICAgICApO1xuXG4gICAgICBjb25zdCByZXN1bHQ6IE5hdEdhdGV3YXlSZXN1bHQgPSB7XG4gICAgICAgIG5hdEdhdGV3YXk6IG5hdEdhdGV3YXlDb21wb25lbnQubmF0R2F0ZXdheSxcbiAgICAgICAgbmF0R2F0ZXdheUlkOiBuYXRHYXRld2F5Q29tcG9uZW50Lm5hdEdhdGV3YXlJZCxcbiAgICAgICAgZWxhc3RpY0lwOiBuYXRHYXRld2F5Q29tcG9uZW50LmVsYXN0aWNJcCxcbiAgICAgICAgZWxhc3RpY0lwSWQ6IG5hdEdhdGV3YXlDb21wb25lbnQuZWxhc3RpY0lwSWQsXG4gICAgICAgIHB1YmxpY0lwOiBuYXRHYXRld2F5Q29tcG9uZW50LnB1YmxpY0lwLFxuICAgICAgfTtcblxuICAgICAgdGhpcy5uYXRHYXRld2F5cy5wdXNoKHJlc3VsdCk7XG4gICAgICB0aGlzLm5hdEdhdGV3YXlJZHMucHVzaChuYXRHYXRld2F5Q29tcG9uZW50Lm5hdEdhdGV3YXlJZCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBuYXRHYXRld2F5czogdGhpcy5uYXRHYXRld2F5cyxcbiAgICAgIG5hdEdhdGV3YXlJZHM6IHRoaXMubmF0R2F0ZXdheUlkcyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmF0R2F0ZXdheShcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBOYXRHYXRld2F5QXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMgLy8g4oaQIEZJWEVEOiBBZGRlZCB0aGlyZCBwYXJhbWV0ZXJcbik6IE5hdEdhdGV3YXlSZXN1bHQge1xuICBjb25zdCBuYXRHYXRld2F5Q29tcG9uZW50ID0gbmV3IE5hdEdhdGV3YXlDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7IC8vIOKGkCBGSVhFRDogUGFzcyBvcHRzIHRocm91Z2hcbiAgcmV0dXJuIHtcbiAgICBuYXRHYXRld2F5OiBuYXRHYXRld2F5Q29tcG9uZW50Lm5hdEdhdGV3YXksXG4gICAgbmF0R2F0ZXdheUlkOiBuYXRHYXRld2F5Q29tcG9uZW50Lm5hdEdhdGV3YXlJZCxcbiAgICBlbGFzdGljSXA6IG5hdEdhdGV3YXlDb21wb25lbnQuZWxhc3RpY0lwLFxuICAgIGVsYXN0aWNJcElkOiBuYXRHYXRld2F5Q29tcG9uZW50LmVsYXN0aWNJcElkLFxuICAgIHB1YmxpY0lwOiBuYXRHYXRld2F5Q29tcG9uZW50LnB1YmxpY0lwLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTXVsdGlBek5hdEdhdGV3YXkoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogTXVsdGlBek5hdEdhdGV3YXlBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucyAvLyDihpAgRklYRUQ6IEFkZGVkIHRoaXJkIHBhcmFtZXRlclxuKTogTXVsdGlBek5hdEdhdGV3YXlSZXN1bHQge1xuICBjb25zdCBtdWx0aUF6Q29tcG9uZW50ID0gbmV3IE11bHRpQXpOYXRHYXRld2F5Q29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpOyAvLyDihpAgRklYRUQ6IFBhc3Mgb3B0cyB0aHJvdWdoXG4gIHJldHVybiB7XG4gICAgbmF0R2F0ZXdheXM6IG11bHRpQXpDb21wb25lbnQubmF0R2F0ZXdheXMsXG4gICAgbmF0R2F0ZXdheUlkczogbXVsdGlBekNvbXBvbmVudC5uYXRHYXRld2F5SWRzLFxuICB9O1xufVxuIl19