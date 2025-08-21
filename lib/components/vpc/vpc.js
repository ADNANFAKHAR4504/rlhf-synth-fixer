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
        super('aws:vpc:VpcComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.vpc = new aws.ec2.Vpc(`${name}-vpc`, {
            cidrBlock: args.cidrBlock,
            enableDnsHostnames: args.enableDnsHostnames ?? true,
            enableDnsSupport: args.enableDnsSupport ?? true,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Pass provider through
        );
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
function createVpc(name, args, opts) {
    const vpcComponent = new VpcComponent(name, args, opts);
    return {
        vpc: vpcComponent.vpc,
        vpcId: vpcComponent.vpcId,
        cidrBlock: vpcComponent.cidrBlock,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidnBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJEQSw4QkFXQztBQXRFRCx1REFBeUM7QUFDekMsaURBQW1DO0FBZ0JuQyxNQUFhLFlBQWEsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3hDLEdBQUcsQ0FBYztJQUNqQixLQUFLLENBQXdCO0lBQzdCLFNBQVMsQ0FBd0I7SUFFakQsWUFDRSxJQUFZLEVBQ1osSUFBYSxFQUNiLElBQXNDO1FBRXRDLEtBQUssQ0FBQyxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTlDLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNiLENBQUM7UUFFRixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQ3hCLEdBQUcsSUFBSSxNQUFNLEVBQ2I7WUFDRSxTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDekIsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixJQUFJLElBQUk7WUFDbkQsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixJQUFJLElBQUk7WUFDL0MsSUFBSSxFQUFFLFdBQVc7U0FDbEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FBQyxpQ0FBaUM7U0FDN0UsQ0FBQztRQUVGLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUVwQyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztZQUNiLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7U0FDMUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBeENELG9DQXdDQztBQUVELFNBQWdCLFNBQVMsQ0FDdkIsSUFBWSxFQUNaLElBQWEsRUFDYixJQUFzQztJQUV0QyxNQUFNLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hELE9BQU87UUFDTCxHQUFHLEVBQUUsWUFBWSxDQUFDLEdBQUc7UUFDckIsS0FBSyxFQUFFLFlBQVksQ0FBQyxLQUFLO1FBQ3pCLFNBQVMsRUFBRSxZQUFZLENBQUMsU0FBUztLQUNsQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFZwY0FyZ3Mge1xuICBjaWRyQmxvY2s6IHN0cmluZztcbiAgZW5hYmxlRG5zSG9zdG5hbWVzPzogYm9vbGVhbjtcbiAgZW5hYmxlRG5zU3VwcG9ydD86IGJvb2xlYW47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVnBjUmVzdWx0IHtcbiAgdnBjOiBhd3MuZWMyLlZwYztcbiAgdnBjSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgY2lkckJsb2NrOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBWcGNDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgdnBjOiBhd3MuZWMyLlZwYztcbiAgcHVibGljIHJlYWRvbmx5IHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBjaWRyQmxvY2s6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogVnBjQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnZwYzpWcGNDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICB0aGlzLnZwYyA9IG5ldyBhd3MuZWMyLlZwYyhcbiAgICAgIGAke25hbWV9LXZwY2AsXG4gICAgICB7XG4gICAgICAgIGNpZHJCbG9jazogYXJncy5jaWRyQmxvY2ssXG4gICAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogYXJncy5lbmFibGVEbnNIb3N0bmFtZXMgPz8gdHJ1ZSxcbiAgICAgICAgZW5hYmxlRG5zU3VwcG9ydDogYXJncy5lbmFibGVEbnNTdXBwb3J0ID8/IHRydWUsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfSAvLyDihpAgRklYRUQ6IFBhc3MgcHJvdmlkZXIgdGhyb3VnaFxuICAgICk7XG5cbiAgICB0aGlzLnZwY0lkID0gdGhpcy52cGMuaWQ7XG4gICAgdGhpcy5jaWRyQmxvY2sgPSB0aGlzLnZwYy5jaWRyQmxvY2s7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB2cGM6IHRoaXMudnBjLFxuICAgICAgdnBjSWQ6IHRoaXMudnBjSWQsXG4gICAgICBjaWRyQmxvY2s6IHRoaXMuY2lkckJsb2NrLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWcGMoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogVnBjQXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IFZwY1Jlc3VsdCB7XG4gIGNvbnN0IHZwY0NvbXBvbmVudCA9IG5ldyBWcGNDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgdnBjOiB2cGNDb21wb25lbnQudnBjLFxuICAgIHZwY0lkOiB2cGNDb21wb25lbnQudnBjSWQsXG4gICAgY2lkckJsb2NrOiB2cGNDb21wb25lbnQuY2lkckJsb2NrLFxuICB9O1xufVxuIl19