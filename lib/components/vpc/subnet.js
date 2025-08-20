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
exports.SubnetGroupComponent = exports.SubnetComponent = void 0;
exports.createSubnet = createSubnet;
exports.createSubnetGroup = createSubnetGroup;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class SubnetComponent extends pulumi.ComponentResource {
    subnet;
    subnetId;
    availabilityZone;
    constructor(name, args, opts) {
        super("aws:vpc:SubnetComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            Type: args.isPublic ? "Public" : "Private",
            ...args.tags,
        };
        this.subnet = new aws.ec2.Subnet(`${name}-subnet`, {
            vpcId: args.vpcId,
            cidrBlock: args.cidrBlock,
            availabilityZone: args.availabilityZone,
            mapPublicIpOnLaunch: args.mapPublicIpOnLaunch ?? args.isPublic,
            tags: defaultTags,
        }, { parent: this });
        this.subnetId = this.subnet.id;
        this.availabilityZone = this.subnet.availabilityZone;
        this.registerOutputs({
            subnet: this.subnet,
            subnetId: this.subnetId,
            availabilityZone: this.availabilityZone,
        });
    }
}
exports.SubnetComponent = SubnetComponent;
class SubnetGroupComponent extends pulumi.ComponentResource {
    publicSubnets;
    privateSubnets;
    publicSubnetIds;
    privateSubnetIds;
    constructor(name, args, opts) {
        super("aws:vpc:SubnetGroupComponent", name, {}, opts);
        this.publicSubnets = args.publicSubnets.map((subnetConfig, index) => {
            const subnetComponent = new SubnetComponent(`${name}-public-${index}`, {
                vpcId: args.vpcId,
                cidrBlock: subnetConfig.cidrBlock,
                availabilityZone: subnetConfig.availabilityZone,
                isPublic: true,
                mapPublicIpOnLaunch: true,
                name: subnetConfig.name,
                tags: args.tags,
            }, { parent: this });
            return {
                subnet: subnetComponent.subnet,
                subnetId: subnetComponent.subnetId,
                availabilityZone: subnetComponent.availabilityZone,
            };
        });
        this.privateSubnets = args.privateSubnets.map((subnetConfig, index) => {
            const subnetComponent = new SubnetComponent(`${name}-private-${index}`, {
                vpcId: args.vpcId,
                cidrBlock: subnetConfig.cidrBlock,
                availabilityZone: subnetConfig.availabilityZone,
                isPublic: false,
                mapPublicIpOnLaunch: false,
                name: subnetConfig.name,
                tags: args.tags,
            }, { parent: this });
            return {
                subnet: subnetComponent.subnet,
                subnetId: subnetComponent.subnetId,
                availabilityZone: subnetComponent.availabilityZone,
            };
        });
        this.publicSubnetIds = this.publicSubnets.map(subnet => subnet.subnetId);
        this.privateSubnetIds = this.privateSubnets.map(subnet => subnet.subnetId);
        this.registerOutputs({
            publicSubnets: this.publicSubnets,
            privateSubnets: this.privateSubnets,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
        });
    }
}
exports.SubnetGroupComponent = SubnetGroupComponent;
function createSubnet(name, args) {
    const subnetComponent = new SubnetComponent(name, args);
    return {
        subnet: subnetComponent.subnet,
        subnetId: subnetComponent.subnetId,
        availabilityZone: subnetComponent.availabilityZone,
    };
}
function createSubnetGroup(name, args) {
    const subnetGroupComponent = new SubnetGroupComponent(name, args);
    return {
        publicSubnets: subnetGroupComponent.publicSubnets,
        privateSubnets: subnetGroupComponent.privateSubnets,
        publicSubnetIds: subnetGroupComponent.publicSubnetIds,
        privateSubnetIds: subnetGroupComponent.privateSubnetIds,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VibmV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3VibmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXNJQSxvQ0FPQztBQUVELDhDQVFDO0FBdkpELHVEQUF5QztBQUN6QyxpREFBbUM7QUF3Q25DLE1BQWEsZUFBZ0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3pDLE1BQU0sQ0FBaUI7SUFDdkIsUUFBUSxDQUF3QjtJQUNoQyxnQkFBZ0IsQ0FBd0I7SUFFeEQsWUFBWSxJQUFZLEVBQUUsSUFBZ0IsRUFBRSxJQUFzQztRQUM5RSxLQUFLLENBQUMseUJBQXlCLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVqRCxNQUFNLFdBQVcsR0FBRztZQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUM5QixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUseUJBQXlCO1lBQ2xDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFNBQVM7WUFDMUMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNmLENBQUM7UUFFRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLFNBQVMsRUFBRTtZQUMvQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDdkMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksQ0FBQyxRQUFRO1lBQzlELElBQUksRUFBRSxXQUFXO1NBQ3BCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFF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QztRQUUzRSxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ2pCLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtZQUNqQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDbkMsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7U0FDMUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBdkRELG9EQXVEQztBQUVELFNBQWdCLFlBQVksQ0FBQyxJQUFZLEVBQUUsSUFBZ0I7SUFDdkQsTUFBTSxlQUFlLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hELE9BQU87UUFDSCxNQUFNLEVBQUUsZUFBZSxDQUFDLE1BQU07UUFDOUIsUUFBUSxFQUFFLGVBQWUsQ0FBQyxRQUFRO1FBQ2xDLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxnQkFBZ0I7S0FDckQsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxJQUFZLEVBQUUsSUFBcUI7SUFDakUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG9CQUFvQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNsRSxPQUFPO1FBQ0gsYUFBYSxFQUFFLG9CQUFvQixDQUFDLGFBQWE7UUFDakQsY0FBYyxFQUFFLG9CQUFvQixDQUFDLGNBQWM7UUFDbkQsZUFBZSxFQUFFLG9CQUFvQixDQUFDLGVBQWU7UUFDckQsZ0JBQWdCLEVBQUUsb0JBQW9CLENBQUMsZ0JBQWdCO0tBQzFELENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN1Ym5ldEFyZ3Mge1xuICAgIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBjaWRyQmxvY2s6IHN0cmluZztcbiAgICBhdmFpbGFiaWxpdHlab25lOiBzdHJpbmc7XG4gICAgbWFwUHVibGljSXBPbkxhdW5jaD86IGJvb2xlYW47XG4gICAgaXNQdWJsaWM6IGJvb2xlYW47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN1Ym5ldFJlc3VsdCB7XG4gICAgc3VibmV0OiBhd3MuZWMyLlN1Ym5ldDtcbiAgICBzdWJuZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIGF2YWlsYWJpbGl0eVpvbmU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJuZXRHcm91cEFyZ3Mge1xuICAgIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWNTdWJuZXRzOiBBcnJheTx7XG4gICAgICAgIGNpZHJCbG9jazogc3RyaW5nO1xuICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBzdHJpbmc7XG4gICAgICAgIG5hbWU6IHN0cmluZztcbiAgICB9PjtcbiAgICBwcml2YXRlU3VibmV0czogQXJyYXk8e1xuICAgICAgICBjaWRyQmxvY2s6IHN0cmluZztcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogc3RyaW5nO1xuICAgICAgICBuYW1lOiBzdHJpbmc7XG4gICAgfT47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3VibmV0R3JvdXBSZXN1bHQge1xuICAgIHB1YmxpY1N1Ym5ldHM6IFN1Ym5ldFJlc3VsdFtdO1xuICAgIHByaXZhdGVTdWJuZXRzOiBTdWJuZXRSZXN1bHRbXTtcbiAgICBwdWJsaWNTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xuICAgIHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xufVxuXG5leHBvcnQgY2xhc3MgU3VibmV0Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc3VibmV0OiBhd3MuZWMyLlN1Ym5ldDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc3VibmV0SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYXZhaWxhYmlsaXR5Wm9uZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTdWJuZXRBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czp2cGM6U3VibmV0Q29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIFR5cGU6IGFyZ3MuaXNQdWJsaWMgPyBcIlB1YmxpY1wiIDogXCJQcml2YXRlXCIsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zdWJuZXQgPSBuZXcgYXdzLmVjMi5TdWJuZXQoYCR7bmFtZX0tc3VibmV0YCwge1xuICAgICAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgICAgICBjaWRyQmxvY2s6IGFyZ3MuY2lkckJsb2NrLFxuICAgICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogYXJncy5hdmFpbGFiaWxpdHlab25lLFxuICAgICAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogYXJncy5tYXBQdWJsaWNJcE9uTGF1bmNoID8/IGFyZ3MuaXNQdWJsaWMsXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5zdWJuZXRJZCA9IHRoaXMuc3VibmV0LmlkO1xuICAgICAgICB0aGlzLmF2YWlsYWJpbGl0eVpvbmUgPSB0aGlzLnN1Ym5ldC5hdmFpbGFiaWxpdHlab25lO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHN1Ym5ldDogdGhpcy5zdWJuZXQsXG4gICAgICAgICAgICBzdWJuZXRJZDogdGhpcy5zdWJuZXRJZCxcbiAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IHRoaXMuYXZhaWxhYmlsaXR5Wm9uZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3VibmV0R3JvdXBDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRzOiBTdWJuZXRSZXN1bHRbXTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZVN1Ym5ldHM6IFN1Ym5ldFJlc3VsdFtdO1xuICAgIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xuICAgIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz5bXTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogU3VibmV0R3JvdXBBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czp2cGM6U3VibmV0R3JvdXBDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIHRoaXMucHVibGljU3VibmV0cyA9IGFyZ3MucHVibGljU3VibmV0cy5tYXAoKHN1Ym5ldENvbmZpZywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN1Ym5ldENvbXBvbmVudCA9IG5ldyBTdWJuZXRDb21wb25lbnQoYCR7bmFtZX0tcHVibGljLSR7aW5kZXh9YCwge1xuICAgICAgICAgICAgICAgIHZwY0lkOiBhcmdzLnZwY0lkLFxuICAgICAgICAgICAgICAgIGNpZHJCbG9jazogc3VibmV0Q29uZmlnLmNpZHJCbG9jayxcbiAgICAgICAgICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBzdWJuZXRDb25maWcuYXZhaWxhYmlsaXR5Wm9uZSxcbiAgICAgICAgICAgICAgICBpc1B1YmxpYzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlLFxuICAgICAgICAgICAgICAgIG5hbWU6IHN1Ym5ldENvbmZpZy5uYW1lLFxuICAgICAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHN1Ym5ldDogc3VibmV0Q29tcG9uZW50LnN1Ym5ldCxcbiAgICAgICAgICAgICAgICBzdWJuZXRJZDogc3VibmV0Q29tcG9uZW50LnN1Ym5ldElkLFxuICAgICAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IHN1Ym5ldENvbXBvbmVudC5hdmFpbGFiaWxpdHlab25lLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5wcml2YXRlU3VibmV0cyA9IGFyZ3MucHJpdmF0ZVN1Ym5ldHMubWFwKChzdWJuZXRDb25maWcsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdWJuZXRDb21wb25lbnQgPSBuZXcgU3VibmV0Q29tcG9uZW50KGAke25hbWV9LXByaXZhdGUtJHtpbmRleH1gLCB7XG4gICAgICAgICAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgICAgICAgICAgY2lkckJsb2NrOiBzdWJuZXRDb25maWcuY2lkckJsb2NrLFxuICAgICAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IHN1Ym5ldENvbmZpZy5hdmFpbGFiaWxpdHlab25lLFxuICAgICAgICAgICAgICAgIGlzUHVibGljOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBuYW1lOiBzdWJuZXRDb25maWcubmFtZSxcbiAgICAgICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBzdWJuZXQ6IHN1Ym5ldENvbXBvbmVudC5zdWJuZXQsXG4gICAgICAgICAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldENvbXBvbmVudC5zdWJuZXRJZCxcbiAgICAgICAgICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBzdWJuZXRDb21wb25lbnQuYXZhaWxhYmlsaXR5Wm9uZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucHVibGljU3VibmV0SWRzID0gdGhpcy5wdWJsaWNTdWJuZXRzLm1hcChzdWJuZXQgPT4gc3VibmV0LnN1Ym5ldElkKTtcbiAgICAgICAgdGhpcy5wcml2YXRlU3VibmV0SWRzID0gdGhpcy5wcml2YXRlU3VibmV0cy5tYXAoc3VibmV0ID0+IHN1Ym5ldC5zdWJuZXRJZCk7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgcHVibGljU3VibmV0czogdGhpcy5wdWJsaWNTdWJuZXRzLFxuICAgICAgICAgICAgcHJpdmF0ZVN1Ym5ldHM6IHRoaXMucHJpdmF0ZVN1Ym5ldHMsXG4gICAgICAgICAgICBwdWJsaWNTdWJuZXRJZHM6IHRoaXMucHVibGljU3VibmV0SWRzLFxuICAgICAgICAgICAgcHJpdmF0ZVN1Ym5ldElkczogdGhpcy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdWJuZXQobmFtZTogc3RyaW5nLCBhcmdzOiBTdWJuZXRBcmdzKTogU3VibmV0UmVzdWx0IHtcbiAgICBjb25zdCBzdWJuZXRDb21wb25lbnQgPSBuZXcgU3VibmV0Q29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1Ym5ldDogc3VibmV0Q29tcG9uZW50LnN1Ym5ldCxcbiAgICAgICAgc3VibmV0SWQ6IHN1Ym5ldENvbXBvbmVudC5zdWJuZXRJZCxcbiAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogc3VibmV0Q29tcG9uZW50LmF2YWlsYWJpbGl0eVpvbmUsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN1Ym5ldEdyb3VwKG5hbWU6IHN0cmluZywgYXJnczogU3VibmV0R3JvdXBBcmdzKTogU3VibmV0R3JvdXBSZXN1bHQge1xuICAgIGNvbnN0IHN1Ym5ldEdyb3VwQ29tcG9uZW50ID0gbmV3IFN1Ym5ldEdyb3VwQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHB1YmxpY1N1Ym5ldHM6IHN1Ym5ldEdyb3VwQ29tcG9uZW50LnB1YmxpY1N1Ym5ldHMsXG4gICAgICAgIHByaXZhdGVTdWJuZXRzOiBzdWJuZXRHcm91cENvbXBvbmVudC5wcml2YXRlU3VibmV0cyxcbiAgICAgICAgcHVibGljU3VibmV0SWRzOiBzdWJuZXRHcm91cENvbXBvbmVudC5wdWJsaWNTdWJuZXRJZHMsXG4gICAgICAgIHByaXZhdGVTdWJuZXRJZHM6IHN1Ym5ldEdyb3VwQ29tcG9uZW50LnByaXZhdGVTdWJuZXRJZHMsXG4gICAgfTtcbn0iXX0=