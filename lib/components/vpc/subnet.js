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
        super('aws:vpc:SubnetComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            Type: args.isPublic ? 'Public' : 'Private',
            ...args.tags,
        };
        this.subnet = new aws.ec2.Subnet(`${name}-subnet`, {
            vpcId: args.vpcId,
            cidrBlock: args.cidrBlock,
            availabilityZone: args.availabilityZone, // Now supports dynamic Input<string>
            mapPublicIpOnLaunch: args.mapPublicIpOnLaunch ?? args.isPublic,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
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
// NEW: Enhanced SubnetGroupComponent to handle dynamic configurations
class SubnetGroupComponent extends pulumi.ComponentResource {
    publicSubnets;
    privateSubnets;
    publicSubnetIds;
    privateSubnetIds;
    constructor(name, args, opts) {
        super('aws:vpc:SubnetGroupComponent', name, {}, opts);
        // FIXED: Handle dynamic subnet configurations properly
        this.publicSubnets = [];
        this.privateSubnets = [];
        this.publicSubnetIds = [];
        this.privateSubnetIds = [];
        // Handle dynamic public subnets
        const publicSubnetsInput = pulumi.output(args.publicSubnets);
        publicSubnetsInput.apply(publicSubnets => {
            publicSubnets.forEach((subnetConfig, index) => {
                const subnetComponent = new SubnetComponent(`${name}-public-${index}`, {
                    vpcId: args.vpcId,
                    cidrBlock: subnetConfig.cidrBlock,
                    availabilityZone: subnetConfig.availabilityZone,
                    isPublic: true,
                    mapPublicIpOnLaunch: true,
                    name: subnetConfig.name,
                    tags: args.tags,
                }, { parent: this, provider: opts?.provider });
                this.publicSubnets.push({
                    subnet: subnetComponent.subnet,
                    subnetId: subnetComponent.subnetId,
                    availabilityZone: subnetComponent.availabilityZone,
                });
                this.publicSubnetIds.push(subnetComponent.subnetId);
            });
            return publicSubnets;
        });
        // Handle dynamic private subnets
        const privateSubnetsInput = pulumi.output(args.privateSubnets);
        privateSubnetsInput.apply(privateSubnets => {
            privateSubnets.forEach((subnetConfig, index) => {
                const subnetComponent = new SubnetComponent(`${name}-private-${index}`, {
                    vpcId: args.vpcId,
                    cidrBlock: subnetConfig.cidrBlock,
                    availabilityZone: subnetConfig.availabilityZone,
                    isPublic: false,
                    mapPublicIpOnLaunch: false,
                    name: subnetConfig.name,
                    tags: args.tags,
                }, { parent: this, provider: opts?.provider });
                this.privateSubnets.push({
                    subnet: subnetComponent.subnet,
                    subnetId: subnetComponent.subnetId,
                    availabilityZone: subnetComponent.availabilityZone,
                });
                this.privateSubnetIds.push(subnetComponent.subnetId);
            });
            return privateSubnets;
        });
        this.registerOutputs({
            publicSubnets: this.publicSubnets,
            privateSubnets: this.privateSubnets,
            publicSubnetIds: this.publicSubnetIds,
            privateSubnetIds: this.privateSubnetIds,
        });
    }
}
exports.SubnetGroupComponent = SubnetGroupComponent;
function createSubnet(name, args, opts) {
    const subnetComponent = new SubnetComponent(name, args, opts);
    return {
        subnet: subnetComponent.subnet,
        subnetId: subnetComponent.subnetId,
        availabilityZone: subnetComponent.availabilityZone,
    };
}
function createSubnetGroup(name, args, opts) {
    const subnetGroupComponent = new SubnetGroupComponent(name, args, opts);
    return {
        publicSubnets: subnetGroupComponent.publicSubnets,
        privateSubnets: subnetGroupComponent.privateSubnets,
        publicSubnetIds: subnetGroupComponent.publicSubnetIds,
        privateSubnetIds: subnetGroupComponent.privateSubnetIds,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3VibmV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3VibmV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlMQSxvQ0FXQztBQUVELDhDQVlDO0FBMU1ELHVEQUF5QztBQUN6QyxpREFBbUM7QUE2Q25DLE1BQWEsZUFBZ0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzNDLE1BQU0sQ0FBaUI7SUFDdkIsUUFBUSxDQUF3QjtJQUNoQyxnQkFBZ0IsQ0FBd0I7SUFFeEQsWUFDRSxJQUFZLEVBQ1osSUFBZ0IsRUFDaEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLHlCQUF5QixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFakQsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxTQUFTO1lBQzFDLEdBQUcsSUFBSSxDQUFDLElBQUk7U0FDYixDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUM5QixHQUFHLElBQUksU0FBUyxFQUNoQjtZQUNFLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDekIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLHFDQUFxQztZQUM5RSxtQkFBbUIsRUFBRSxJQUFJLENBQUMsbUJBQW1CLElBQUksSUFBSSxDQUFDLFFBQVE7WUFDOUQsSUFBSSxFQUFFLFdBQVc7U0FDbEIsRUFDRCxFQUFFLE1BQU0s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QU07UUFDOUIsUUFBUSxFQUFFLGVBQWUsQ0FBQyxRQUFRO1FBQ2xDLGdCQUFnQixFQUFFLGVBQWUsQ0FBQyxnQkFBZ0I7S0FDbkQsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FDL0IsSUFBWSxFQUNaLElBQXFCLEVBQ3JCLElBQXNDO0lBRXRDLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hFLE9BQU87UUFDTCxhQUFhLEVBQUUsb0JBQW9CLENBQUMsYUFBYTtRQUNqRCxjQUFjLEVBQUUsb0JBQW9CLENBQUMsY0FBYztRQUNuRCxlQUFlLEVBQUUsb0JBQW9CLENBQUMsZUFBZTtRQUNyRCxnQkFBZ0IsRUFBRSxvQkFBb0IsQ0FBQyxnQkFBZ0I7S0FDeEQsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBTdWJuZXRBcmdzIHtcbiAgdnBjSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBjaWRyQmxvY2s6IHN0cmluZztcbiAgYXZhaWxhYmlsaXR5Wm9uZTogcHVsdW1pLklucHV0PHN0cmluZz47IC8vIENIQU5HRUQ6IEFsbG93IElucHV0PHN0cmluZz4gZm9yIGR5bmFtaWMgQVpzXG4gIG1hcFB1YmxpY0lwT25MYXVuY2g/OiBib29sZWFuO1xuICBpc1B1YmxpYzogYm9vbGVhbjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJuZXRSZXN1bHQge1xuICBzdWJuZXQ6IGF3cy5lYzIuU3VibmV0O1xuICBzdWJuZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBhdmFpbGFiaWxpdHlab25lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbi8vIFVQREFURUQ6IFN1cHBvcnQgYm90aCBzdGF0aWMgYW5kIGR5bmFtaWMgc3VibmV0IGNvbmZpZ3VyYXRpb25zXG5leHBvcnQgaW50ZXJmYWNlIFN1Ym5ldEdyb3VwQXJncyB7XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcHVibGljU3VibmV0czogcHVsdW1pLklucHV0PFxuICAgIEFycmF5PHtcbiAgICAgIGNpZHJCbG9jazogc3RyaW5nO1xuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogcHVsdW1pLklucHV0PHN0cmluZz47IC8vIENIQU5HRUQ6IFN1cHBvcnQgZHluYW1pYyBBWnNcbiAgICAgIG5hbWU6IHN0cmluZztcbiAgICB9PlxuICA+O1xuICBwcml2YXRlU3VibmV0czogcHVsdW1pLklucHV0PFxuICAgIEFycmF5PHtcbiAgICAgIGNpZHJCbG9jazogc3RyaW5nO1xuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogcHVsdW1pLklucHV0PHN0cmluZz47IC8vIENIQU5HRUQ6IFN1cHBvcnQgZHluYW1pYyBBWnNcbiAgICAgIG5hbWU6IHN0cmluZztcbiAgICB9PlxuICA+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdWJuZXRHcm91cFJlc3VsdCB7XG4gIHB1YmxpY1N1Ym5ldHM6IFN1Ym5ldFJlc3VsdFtdO1xuICBwcml2YXRlU3VibmV0czogU3VibmV0UmVzdWx0W107XG4gIHB1YmxpY1N1Ym5ldElkczogcHVsdW1pLk91dHB1dDxzdHJpbmc+W107XG4gIHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPltdO1xufVxuXG5leHBvcnQgY2xhc3MgU3VibmV0Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHN1Ym5ldDogYXdzLmVjMi5TdWJuZXQ7XG4gIHB1YmxpYyByZWFkb25seSBzdWJuZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYXZhaWxhYmlsaXR5Wm9uZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBTdWJuZXRBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6dnBjOlN1Ym5ldENvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgTWFuYWdlZEJ5OiAnUHVsdW1pJyxcbiAgICAgIFByb2plY3Q6ICdBV1MtTm92YS1Nb2RlbC1CcmVha2luZycsXG4gICAgICBUeXBlOiBhcmdzLmlzUHVibGljID8gJ1B1YmxpYycgOiAnUHJpdmF0ZScsXG4gICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgfTtcblxuICAgIHRoaXMuc3VibmV0ID0gbmV3IGF3cy5lYzIuU3VibmV0KFxuICAgICAgYCR7bmFtZX0tc3VibmV0YCxcbiAgICAgIHtcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIGNpZHJCbG9jazogYXJncy5jaWRyQmxvY2ssXG4gICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IGFyZ3MuYXZhaWxhYmlsaXR5Wm9uZSwgLy8gTm93IHN1cHBvcnRzIGR5bmFtaWMgSW5wdXQ8c3RyaW5nPlxuICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiBhcmdzLm1hcFB1YmxpY0lwT25MYXVuY2ggPz8gYXJncy5pc1B1YmxpYyxcbiAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMuc3VibmV0SWQgPSB0aGlzLnN1Ym5ldC5pZDtcbiAgICB0aGlzLmF2YWlsYWJpbGl0eVpvbmUgPSB0aGlzLnN1Ym5ldC5hdmFpbGFiaWxpdHlab25lO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgc3VibmV0OiB0aGlzLnN1Ym5ldCxcbiAgICAgIHN1Ym5ldElkOiB0aGlzLnN1Ym5ldElkLFxuICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogdGhpcy5hdmFpbGFiaWxpdHlab25lLFxuICAgIH0pO1xuICB9XG59XG5cbi8vIE5FVzogRW5oYW5jZWQgU3VibmV0R3JvdXBDb21wb25lbnQgdG8gaGFuZGxlIGR5bmFtaWMgY29uZmlndXJhdGlvbnNcbmV4cG9ydCBjbGFzcyBTdWJuZXRHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXRzOiBTdWJuZXRSZXN1bHRbXTtcbiAgcHVibGljIHJlYWRvbmx5IHByaXZhdGVTdWJuZXRzOiBTdWJuZXRSZXN1bHRbXTtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY1N1Ym5ldElkczogcHVsdW1pLk91dHB1dDxzdHJpbmc+W107XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz5bXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogU3VibmV0R3JvdXBBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6dnBjOlN1Ym5ldEdyb3VwQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gRklYRUQ6IEhhbmRsZSBkeW5hbWljIHN1Ym5ldCBjb25maWd1cmF0aW9ucyBwcm9wZXJseVxuICAgIHRoaXMucHVibGljU3VibmV0cyA9IFtdO1xuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMgPSBbXTtcbiAgICB0aGlzLnB1YmxpY1N1Ym5ldElkcyA9IFtdO1xuICAgIHRoaXMucHJpdmF0ZVN1Ym5ldElkcyA9IFtdO1xuXG4gICAgLy8gSGFuZGxlIGR5bmFtaWMgcHVibGljIHN1Ym5ldHNcbiAgICBjb25zdCBwdWJsaWNTdWJuZXRzSW5wdXQgPSBwdWx1bWkub3V0cHV0KGFyZ3MucHVibGljU3VibmV0cyk7XG4gICAgcHVibGljU3VibmV0c0lucHV0LmFwcGx5KHB1YmxpY1N1Ym5ldHMgPT4ge1xuICAgICAgcHVibGljU3VibmV0cy5mb3JFYWNoKChzdWJuZXRDb25maWcsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHN1Ym5ldENvbXBvbmVudCA9IG5ldyBTdWJuZXRDb21wb25lbnQoXG4gICAgICAgICAgYCR7bmFtZX0tcHVibGljLSR7aW5kZXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgICAgIGNpZHJCbG9jazogc3VibmV0Q29uZmlnLmNpZHJCbG9jayxcbiAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IHN1Ym5ldENvbmZpZy5hdmFpbGFiaWxpdHlab25lLFxuICAgICAgICAgICAgaXNQdWJsaWM6IHRydWUsXG4gICAgICAgICAgICBtYXBQdWJsaWNJcE9uTGF1bmNoOiB0cnVlLFxuICAgICAgICAgICAgbmFtZTogc3VibmV0Q29uZmlnLm5hbWUsXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICAgICAgKTtcblxuICAgICAgICB0aGlzLnB1YmxpY1N1Ym5ldHMucHVzaCh7XG4gICAgICAgICAgc3VibmV0OiBzdWJuZXRDb21wb25lbnQuc3VibmV0LFxuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXRDb21wb25lbnQuc3VibmV0SWQsXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogc3VibmV0Q29tcG9uZW50LmF2YWlsYWJpbGl0eVpvbmUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucHVibGljU3VibmV0SWRzLnB1c2goc3VibmV0Q29tcG9uZW50LnN1Ym5ldElkKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHB1YmxpY1N1Ym5ldHM7XG4gICAgfSk7XG5cbiAgICAvLyBIYW5kbGUgZHluYW1pYyBwcml2YXRlIHN1Ym5ldHNcbiAgICBjb25zdCBwcml2YXRlU3VibmV0c0lucHV0ID0gcHVsdW1pLm91dHB1dChhcmdzLnByaXZhdGVTdWJuZXRzKTtcbiAgICBwcml2YXRlU3VibmV0c0lucHV0LmFwcGx5KHByaXZhdGVTdWJuZXRzID0+IHtcbiAgICAgIHByaXZhdGVTdWJuZXRzLmZvckVhY2goKHN1Ym5ldENvbmZpZywgaW5kZXgpID0+IHtcbiAgICAgICAgY29uc3Qgc3VibmV0Q29tcG9uZW50ID0gbmV3IFN1Ym5ldENvbXBvbmVudChcbiAgICAgICAgICBgJHtuYW1lfS1wcml2YXRlLSR7aW5kZXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgICAgIGNpZHJCbG9jazogc3VibmV0Q29uZmlnLmNpZHJCbG9jayxcbiAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IHN1Ym5ldENvbmZpZy5hdmFpbGFiaWxpdHlab25lLFxuICAgICAgICAgICAgaXNQdWJsaWM6IGZhbHNlLFxuICAgICAgICAgICAgbWFwUHVibGljSXBPbkxhdW5jaDogZmFsc2UsXG4gICAgICAgICAgICBuYW1lOiBzdWJuZXRDb25maWcubmFtZSxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMucHJpdmF0ZVN1Ym5ldHMucHVzaCh7XG4gICAgICAgICAgc3VibmV0OiBzdWJuZXRDb21wb25lbnQuc3VibmV0LFxuICAgICAgICAgIHN1Ym5ldElkOiBzdWJuZXRDb21wb25lbnQuc3VibmV0SWQsXG4gICAgICAgICAgYXZhaWxhYmlsaXR5Wm9uZTogc3VibmV0Q29tcG9uZW50LmF2YWlsYWJpbGl0eVpvbmUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucHJpdmF0ZVN1Ym5ldElkcy5wdXNoKHN1Ym5ldENvbXBvbmVudC5zdWJuZXRJZCk7XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBwcml2YXRlU3VibmV0cztcbiAgICB9KTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHB1YmxpY1N1Ym5ldHM6IHRoaXMucHVibGljU3VibmV0cyxcbiAgICAgIHByaXZhdGVTdWJuZXRzOiB0aGlzLnByaXZhdGVTdWJuZXRzLFxuICAgICAgcHVibGljU3VibmV0SWRzOiB0aGlzLnB1YmxpY1N1Ym5ldElkcyxcbiAgICAgIHByaXZhdGVTdWJuZXRJZHM6IHRoaXMucHJpdmF0ZVN1Ym5ldElkcyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3VibmV0KFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IFN1Ym5ldEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBTdWJuZXRSZXN1bHQge1xuICBjb25zdCBzdWJuZXRDb21wb25lbnQgPSBuZXcgU3VibmV0Q29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpO1xuICByZXR1cm4ge1xuICAgIHN1Ym5ldDogc3VibmV0Q29tcG9uZW50LnN1Ym5ldCxcbiAgICBzdWJuZXRJZDogc3VibmV0Q29tcG9uZW50LnN1Ym5ldElkLFxuICAgIGF2YWlsYWJpbGl0eVpvbmU6IHN1Ym5ldENvbXBvbmVudC5hdmFpbGFiaWxpdHlab25lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3VibmV0R3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogU3VibmV0R3JvdXBBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogU3VibmV0R3JvdXBSZXN1bHQge1xuICBjb25zdCBzdWJuZXRHcm91cENvbXBvbmVudCA9IG5ldyBTdWJuZXRHcm91cENvbXBvbmVudChuYW1lLCBhcmdzLCBvcHRzKTtcbiAgcmV0dXJuIHtcbiAgICBwdWJsaWNTdWJuZXRzOiBzdWJuZXRHcm91cENvbXBvbmVudC5wdWJsaWNTdWJuZXRzLFxuICAgIHByaXZhdGVTdWJuZXRzOiBzdWJuZXRHcm91cENvbXBvbmVudC5wcml2YXRlU3VibmV0cyxcbiAgICBwdWJsaWNTdWJuZXRJZHM6IHN1Ym5ldEdyb3VwQ29tcG9uZW50LnB1YmxpY1N1Ym5ldElkcyxcbiAgICBwcml2YXRlU3VibmV0SWRzOiBzdWJuZXRHcm91cENvbXBvbmVudC5wcml2YXRlU3VibmV0SWRzLFxuICB9O1xufVxuIl19