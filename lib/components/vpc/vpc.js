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
exports.VpcComponent = void 0;
exports.createVpc = createVpc;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class VpcComponent extends pulumi.ComponentResource {
    vpc;
    vpcId;
    cidrBlock;
    constructor(name, args, opts) {
        super("aws:vpc:VpcComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: args.cidrBlock,
            enableDnsHostnames: args.enableDnsHostnames ?? true,
            enableDnsSupport: args.enableDnsSupport ?? true,
            tags: defaultTags,
        }, { parent: this });
        this.vpcId = this.vpc.id;
        this.cidrBlock = this.vpc.cidrBlock;
        this.registerOutputs({
            vpc: this.vpc,
            vpcId: this.vpcId,
            cidrBlock: this.cidrBlock,
        });
    }
}
exports.VpcComponent = VpcComponent;
function createVpc(name, args) {
    const vpcComponent = new VpcComponent(name, args);
    return {
        vpc: vpcComponent.vpc,
        vpcId: vpcComponent.vpcId,
        cidrBlock: vpcComponent.cidrBlock,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1EQSw4QkFPQztBQTFERCx1REFBeUM7QUFDekMsaURBQW1DO0FBZ0JuQyxNQUFhLFlBQWEsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3RDLEdBQUcsQ0FBYztJQUNqQixLQUFLLENBQXdCO0lBQzdCLFNBQVMsQ0FBd0I7SUFFakQsWUFBWSxJQUFZLEVBQUUsSUFBYSxFQUFFLElBQXNDO1FBQzNFLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTlDLE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNmLENBQUM7UUFFRixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLE1BQU0sRUFBRTtZQUN0QyxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDekIsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixJQUFJLElBQUk7WUFDbkQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixJQUFJLElBQUk7WUFDL0MsSUFBSSxFQUFFLFdBQVc7U0FDcEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUVwQyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ2pCLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztZQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7U0FDNUIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBaENELG9DQWdDQztBQUVELFNBQWdCLFNBQVMsQ0FBQyxJQUFZLEVBQUUsSUFBYTtJQUNqRCxNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEQsT0FBTztRQUNILEdBQUcsRUFBRSxZQUFZLENBQUMsR0FBRztRQUNyQixLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUs7UUFDekIsU0FBUyxFQUFFLFlBQVksQ0FBQyxTQUFTO0tBQ3BDLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZwY0FyZ3Mge1xuICAgIGNpZHJCbG9jazogc3RyaW5nO1xuICAgIGVuYWJsZURuc0hvc3RuYW1lcz86IGJvb2xlYW47XG4gICAgZW5hYmxlRG5zU3VwcG9ydD86IGJvb2xlYW47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFZwY1Jlc3VsdCB7XG4gICAgdnBjOiBhd3MuZWMyLlZwYztcbiAgICB2cGNJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIGNpZHJCbG9jazogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgVnBjQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBhd3MuZWMyLlZwYztcbiAgICBwdWJsaWMgcmVhZG9ubHkgdnBjSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY2lkckJsb2NrOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFZwY0FyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnZwYzpWcGNDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTm92YS1Nb2RlbC1CcmVha2luZ1wiLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudnBjID0gbmV3IGF3cy5lYzIuVnBjKGAke25hbWV9LXZwY2AsIHtcbiAgICAgICAgICAgIGNpZHJCbG9jazogYXJncy5jaWRyQmxvY2ssXG4gICAgICAgICAgICBlbmFibGVEbnNIb3N0bmFtZXM6IGFyZ3MuZW5hYmxlRG5zSG9zdG5hbWVzID8/IHRydWUsXG4gICAgICAgICAgICBlbmFibGVEbnNTdXBwb3J0OiBhcmdzLmVuYWJsZURuc1N1cHBvcnQgPz8gdHJ1ZSxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnZwY0lkID0gdGhpcy52cGMuaWQ7XG4gICAgICAgIHRoaXMuY2lkckJsb2NrID0gdGhpcy52cGMuY2lkckJsb2NrO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHZwYzogdGhpcy52cGMsXG4gICAgICAgICAgICB2cGNJZDogdGhpcy52cGNJZCxcbiAgICAgICAgICAgIGNpZHJCbG9jazogdGhpcy5jaWRyQmxvY2ssXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVZwYyhuYW1lOiBzdHJpbmcsIGFyZ3M6IFZwY0FyZ3MpOiBWcGNSZXN1bHQge1xuICAgIGNvbnN0IHZwY0NvbXBvbmVudCA9IG5ldyBWcGNDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdnBjOiB2cGNDb21wb25lbnQudnBjLFxuICAgICAgICB2cGNJZDogdnBjQ29tcG9uZW50LnZwY0lkLFxuICAgICAgICBjaWRyQmxvY2s6IHZwY0NvbXBvbmVudC5jaWRyQmxvY2ssXG4gICAgfTtcbn0iXX0=