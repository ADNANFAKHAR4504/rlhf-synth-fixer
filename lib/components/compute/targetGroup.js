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
exports.NetworkTargetGroupComponent = exports.ApplicationTargetGroupComponent = exports.TargetGroupAttachmentComponent = exports.TargetGroupComponent = void 0;
exports.createTargetGroup = createTargetGroup;
exports.createTargetGroupAttachment = createTargetGroupAttachment;
exports.createApplicationTargetGroup = createApplicationTargetGroup;
exports.createNetworkTargetGroup = createNetworkTargetGroup;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class TargetGroupComponent extends pulumi.ComponentResource {
    targetGroup;
    targetGroupArn;
    targetGroupName;
    constructor(name, args, opts) {
        super("aws:lb:TargetGroupComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.targetGroup = new aws.lb.TargetGroup(`${name}-tg`, {
            name: args.name,
            port: args.port,
            protocol: args.protocol,
            vpcId: args.vpcId,
            targetType: args.targetType || "instance",
            protocolVersion: args.protocolVersion,
            healthCheck: args.healthCheck,
            stickiness: args.stickiness,
            tags: defaultTags,
        }, { parent: this });
        this.targetGroupArn = this.targetGroup.arn;
        this.targetGroupName = this.targetGroup.name;
        this.registerOutputs({
            targetGroup: this.targetGroup,
            targetGroupArn: this.targetGroupArn,
            targetGroupName: this.targetGroupName,
        });
    }
}
exports.TargetGroupComponent = TargetGroupComponent;
class TargetGroupAttachmentComponent extends pulumi.ComponentResource {
    attachment;
    constructor(name, args, opts) {
        super("aws:lb:TargetGroupAttachmentComponent", name, {}, opts);
        this.attachment = new aws.lb.TargetGroupAttachment(`${name}-attachment`, {
            targetGroupArn: args.targetGroupArn,
            targetId: args.targetId,
            port: args.port,
            availabilityZone: args.availabilityZone,
        }, { parent: this });
        this.registerOutputs({
            attachment: this.attachment,
        });
    }
}
exports.TargetGroupAttachmentComponent = TargetGroupAttachmentComponent;
class ApplicationTargetGroupComponent extends pulumi.ComponentResource {
    targetGroup;
    targetGroupArn;
    targetGroupName;
    constructor(name, args, opts) {
        super("aws:lb:ApplicationTargetGroupComponent", name, {}, opts);
        const targetGroupComponent = new TargetGroupComponent(name, {
            name: args.name,
            port: args.port,
            protocol: "HTTP",
            vpcId: args.vpcId,
            targetType: "instance",
            healthCheck: {
                enabled: true,
                healthyThreshold: 2,
                interval: 30,
                matcher: args.healthCheckMatcher || "200",
                path: args.healthCheckPath || "/health",
                port: "traffic-port",
                protocol: "HTTP",
                timeout: 5,
                unhealthyThreshold: 2,
            },
            stickiness: {
                enabled: false,
                type: "lb_cookie",
                cookieDuration: 86400,
            },
            tags: args.tags,
        }, { parent: this });
        this.targetGroup = targetGroupComponent.targetGroup;
        this.targetGroupArn = targetGroupComponent.targetGroupArn;
        this.targetGroupName = targetGroupComponent.targetGroupName;
        this.registerOutputs({
            targetGroup: this.targetGroup,
            targetGroupArn: this.targetGroupArn,
            targetGroupName: this.targetGroupName,
        });
    }
}
exports.ApplicationTargetGroupComponent = ApplicationTargetGroupComponent;
class NetworkTargetGroupComponent extends pulumi.ComponentResource {
    targetGroup;
    targetGroupArn;
    targetGroupName;
    constructor(name, args, opts) {
        super("aws:lb:NetworkTargetGroupComponent", name, {}, opts);
        const targetGroupComponent = new TargetGroupComponent(name, {
            name: args.name,
            port: args.port,
            protocol: args.protocol,
            vpcId: args.vpcId,
            targetType: "instance",
            healthCheck: {
                enabled: true,
                healthyThreshold: 3,
                interval: 30,
                port: "traffic-port",
                protocol: args.protocol === "UDP" ? "HTTP" : args.protocol,
                timeout: 6,
                unhealthyThreshold: 3,
            },
            tags: args.tags,
        }, { parent: this });
        this.targetGroup = targetGroupComponent.targetGroup;
        this.targetGroupArn = targetGroupComponent.targetGroupArn;
        this.targetGroupName = targetGroupComponent.targetGroupName;
        this.registerOutputs({
            targetGroup: this.targetGroup,
            targetGroupArn: this.targetGroupArn,
            targetGroupName: this.targetGroupName,
        });
    }
}
exports.NetworkTargetGroupComponent = NetworkTargetGroupComponent;
function createTargetGroup(name, args) {
    const targetGroupComponent = new TargetGroupComponent(name, args);
    return {
        targetGroup: targetGroupComponent.targetGroup,
        targetGroupArn: targetGroupComponent.targetGroupArn,
        targetGroupName: targetGroupComponent.targetGroupName,
    };
}
function createTargetGroupAttachment(name, args) {
    const attachmentComponent = new TargetGroupAttachmentComponent(name, args);
    return attachmentComponent.attachment;
}
function createApplicationTargetGroup(name, args) {
    const appTargetGroupComponent = new ApplicationTargetGroupComponent(name, args);
    return {
        targetGroup: appTargetGroupComponent.targetGroup,
        targetGroupArn: appTargetGroupComponent.targetGroupArn,
        targetGroupName: appTargetGroupComponent.targetGroupName,
    };
}
function createNetworkTargetGroup(name, args) {
    const networkTargetGroupComponent = new NetworkTargetGroupComponent(name, args);
    return {
        targetGroup: networkTargetGroupComponent.targetGroup,
        targetGroupArn: networkTargetGroupComponent.targetGroupArn,
        targetGroupName: networkTargetGroupComponent.targetGroupName,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0R3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0YXJnZXRHcm91cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwTUEsOENBT0M7QUFFRCxrRUFHQztBQUVELG9FQU9DO0FBRUQsNERBT0M7QUF4T0QsdURBQXlDO0FBQ3pDLGlEQUFtQztBQTREbkMsTUFBYSxvQkFBcUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLFdBQVcsQ0FBcUI7SUFDaEMsY0FBYyxDQUF3QjtJQUN0QyxlQUFlLENBQXdCO0lBRXZELFlBQVksSUFBWSxFQUFFLElBQXFCLEVBQUUsSUFBc0M7UUFDbkYsS0FBSyxDQUFDLDZCQUE2QixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFckQsTUFBTSxXQUFXLEdBQUc7WUFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2YsQ0FBQztRQUVGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFO1lBQ3BELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksVUFBVTtZQUN6QyxlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWU7WUFDckMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLFVBQVUsRUFBRSxJQUFJLENB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RCxTQUFnQix3QkFBd0IsQ0FBQyxJQUFZLEVBQUUsSUFBNEI7SUFDL0UsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLDJCQUEyQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoRixPQUFPO1FBQ0gsV0FBVyxFQUFFLDJCQUEyQixDQUFDLFdBQVc7UUFDcEQsY0FBYyxFQUFFLDJCQUEyQixDQUFDLGNBQWM7UUFDMUQsZUFBZSxFQUFFLDJCQUEyQixDQUFDLGVBQWU7S0FDL0QsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFyZ2V0R3JvdXBBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgcG9ydDogbnVtYmVyO1xuICAgIHByb3RvY29sOiBcIkhUVFBcIiB8IFwiSFRUUFNcIiB8IFwiVENQXCIgfCBcIlRMU1wiIHwgXCJVRFBcIiB8IFwiVENQX1VEUFwiIHwgXCJHRU5FVkVcIjtcbiAgICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdGFyZ2V0VHlwZT86IFwiaW5zdGFuY2VcIiB8IFwiaXBcIiB8IFwibGFtYmRhXCIgfCBcImFsYlwiO1xuICAgIHByb3RvY29sVmVyc2lvbj86IHN0cmluZztcbiAgICBoZWFsdGhDaGVjaz86IHtcbiAgICAgICAgZW5hYmxlZD86IGJvb2xlYW47XG4gICAgICAgIGhlYWx0aHlUaHJlc2hvbGQ/OiBudW1iZXI7XG4gICAgICAgIGludGVydmFsPzogbnVtYmVyO1xuICAgICAgICBtYXRjaGVyPzogc3RyaW5nO1xuICAgICAgICBwYXRoPzogc3RyaW5nO1xuICAgICAgICBwb3J0Pzogc3RyaW5nO1xuICAgICAgICBwcm90b2NvbD86IHN0cmluZztcbiAgICAgICAgdGltZW91dD86IG51bWJlcjtcbiAgICAgICAgdW5oZWFsdGh5VGhyZXNob2xkPzogbnVtYmVyO1xuICAgIH07XG4gICAgc3RpY2tpbmVzcz86IHtcbiAgICAgICAgZW5hYmxlZD86IGJvb2xlYW47XG4gICAgICAgIHR5cGU6IFwibGJfY29va2llXCIgfCBcImFwcF9jb29raWVcIiB8IFwic291cmNlX2lwXCI7XG4gICAgICAgIGNvb2tpZUR1cmF0aW9uPzogbnVtYmVyO1xuICAgICAgICBjb29raWVOYW1lPzogc3RyaW5nO1xuICAgIH07XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFyZ2V0R3JvdXBSZXN1bHQge1xuICAgIHRhcmdldEdyb3VwOiBhd3MubGIuVGFyZ2V0R3JvdXA7XG4gICAgdGFyZ2V0R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICB0YXJnZXRHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXJnZXRHcm91cEF0dGFjaG1lbnRBcmdzIHtcbiAgICB0YXJnZXRHcm91cEFybjogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdGFyZ2V0SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHBvcnQ/OiBudW1iZXI7XG4gICAgYXZhaWxhYmlsaXR5Wm9uZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcHBsaWNhdGlvblRhcmdldEdyb3VwQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHBvcnQ6IG51bWJlcjtcbiAgICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgaGVhbHRoQ2hlY2tQYXRoPzogc3RyaW5nO1xuICAgIGhlYWx0aENoZWNrTWF0Y2hlcj86IHN0cmluZztcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBOZXR3b3JrVGFyZ2V0R3JvdXBBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgcG9ydDogbnVtYmVyO1xuICAgIHByb3RvY29sOiBcIlRDUFwiIHwgXCJVRFBcIiB8IFwiVENQX1VEUFwiO1xuICAgIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBwcmVzZXJ2ZUNsaWVudElwPzogYm9vbGVhbjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIFRhcmdldEdyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXA6IGF3cy5sYi5UYXJnZXRHcm91cDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFRhcmdldEdyb3VwQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6bGI6VGFyZ2V0R3JvdXBDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTm92YS1Nb2RlbC1CcmVha2luZ1wiLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMudGFyZ2V0R3JvdXAgPSBuZXcgYXdzLmxiLlRhcmdldEdyb3VwKGAke25hbWV9LXRnYCwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgcG9ydDogYXJncy5wb3J0LFxuICAgICAgICAgICAgcHJvdG9jb2w6IGFyZ3MucHJvdG9jb2wsXG4gICAgICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgICAgIHRhcmdldFR5cGU6IGFyZ3MudGFyZ2V0VHlwZSB8fCBcImluc3RhbmNlXCIsXG4gICAgICAgICAgICBwcm90b2NvbFZlcnNpb246IGFyZ3MucHJvdG9jb2xWZXJzaW9uLFxuICAgICAgICAgICAgaGVhbHRoQ2hlY2s6IGFyZ3MuaGVhbHRoQ2hlY2ssXG4gICAgICAgICAgICBzdGlja2luZXNzOiBhcmdzLnN0aWNraW5lc3MsXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy50YXJnZXRHcm91cEFybiA9IHRoaXMudGFyZ2V0R3JvdXAuYXJuO1xuICAgICAgICB0aGlzLnRhcmdldEdyb3VwTmFtZSA9IHRoaXMudGFyZ2V0R3JvdXAubmFtZTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICB0YXJnZXRHcm91cDogdGhpcy50YXJnZXRHcm91cCxcbiAgICAgICAgICAgIHRhcmdldEdyb3VwQXJuOiB0aGlzLnRhcmdldEdyb3VwQXJuLFxuICAgICAgICAgICAgdGFyZ2V0R3JvdXBOYW1lOiB0aGlzLnRhcmdldEdyb3VwTmFtZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVGFyZ2V0R3JvdXBBdHRhY2htZW50Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYXR0YWNobWVudDogYXdzLmxiLlRhcmdldEdyb3VwQXR0YWNobWVudDtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogVGFyZ2V0R3JvdXBBdHRhY2htZW50QXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6bGI6VGFyZ2V0R3JvdXBBdHRhY2htZW50Q29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICB0aGlzLmF0dGFjaG1lbnQgPSBuZXcgYXdzLmxiLlRhcmdldEdyb3VwQXR0YWNobWVudChgJHtuYW1lfS1hdHRhY2htZW50YCwge1xuICAgICAgICAgICAgdGFyZ2V0R3JvdXBBcm46IGFyZ3MudGFyZ2V0R3JvdXBBcm4sXG4gICAgICAgICAgICB0YXJnZXRJZDogYXJncy50YXJnZXRJZCxcbiAgICAgICAgICAgIHBvcnQ6IGFyZ3MucG9ydCxcbiAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IGFyZ3MuYXZhaWxhYmlsaXR5Wm9uZSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgYXR0YWNobWVudDogdGhpcy5hdHRhY2htZW50LFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblRhcmdldEdyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXA6IGF3cy5sYi5UYXJnZXRHcm91cDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IEFwcGxpY2F0aW9uVGFyZ2V0R3JvdXBBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpsYjpBcHBsaWNhdGlvblRhcmdldEdyb3VwQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCB0YXJnZXRHcm91cENvbXBvbmVudCA9IG5ldyBUYXJnZXRHcm91cENvbXBvbmVudChuYW1lLCB7XG4gICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBwb3J0OiBhcmdzLnBvcnQsXG4gICAgICAgICAgICBwcm90b2NvbDogXCJIVFRQXCIsXG4gICAgICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgICAgIHRhcmdldFR5cGU6IFwiaW5zdGFuY2VcIixcbiAgICAgICAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBoZWFsdGh5VGhyZXNob2xkOiAyLFxuICAgICAgICAgICAgICAgIGludGVydmFsOiAzMCxcbiAgICAgICAgICAgICAgICBtYXRjaGVyOiBhcmdzLmhlYWx0aENoZWNrTWF0Y2hlciB8fCBcIjIwMFwiLFxuICAgICAgICAgICAgICAgIHBhdGg6IGFyZ3MuaGVhbHRoQ2hlY2tQYXRoIHx8IFwiL2hlYWx0aFwiLFxuICAgICAgICAgICAgICAgIHBvcnQ6IFwidHJhZmZpYy1wb3J0XCIsXG4gICAgICAgICAgICAgICAgcHJvdG9jb2w6IFwiSFRUUFwiLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDUsXG4gICAgICAgICAgICAgICAgdW5oZWFsdGh5VGhyZXNob2xkOiAyLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0aWNraW5lc3M6IHtcbiAgICAgICAgICAgICAgICBlbmFibGVkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBcImxiX2Nvb2tpZVwiLFxuICAgICAgICAgICAgICAgIGNvb2tpZUR1cmF0aW9uOiA4NjQwMCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMudGFyZ2V0R3JvdXAgPSB0YXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cDtcbiAgICAgICAgdGhpcy50YXJnZXRHcm91cEFybiA9IHRhcmdldEdyb3VwQ29tcG9uZW50LnRhcmdldEdyb3VwQXJuO1xuICAgICAgICB0aGlzLnRhcmdldEdyb3VwTmFtZSA9IHRhcmdldEdyb3VwQ29tcG9uZW50LnRhcmdldEdyb3VwTmFtZTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICB0YXJnZXRHcm91cDogdGhpcy50YXJnZXRHcm91cCxcbiAgICAgICAgICAgIHRhcmdldEdyb3VwQXJuOiB0aGlzLnRhcmdldEdyb3VwQXJuLFxuICAgICAgICAgICAgdGFyZ2V0R3JvdXBOYW1lOiB0aGlzLnRhcmdldEdyb3VwTmFtZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya1RhcmdldEdyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXA6IGF3cy5sYi5UYXJnZXRHcm91cDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IE5ldHdvcmtUYXJnZXRHcm91cEFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmxiOk5ldHdvcmtUYXJnZXRHcm91cENvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgdGFyZ2V0R3JvdXBDb21wb25lbnQgPSBuZXcgVGFyZ2V0R3JvdXBDb21wb25lbnQobmFtZSwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgcG9ydDogYXJncy5wb3J0LFxuICAgICAgICAgICAgcHJvdG9jb2w6IGFyZ3MucHJvdG9jb2wsXG4gICAgICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgICAgIHRhcmdldFR5cGU6IFwiaW5zdGFuY2VcIixcbiAgICAgICAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBoZWFsdGh5VGhyZXNob2xkOiAzLFxuICAgICAgICAgICAgICAgIGludGVydmFsOiAzMCxcbiAgICAgICAgICAgICAgICBwb3J0OiBcInRyYWZmaWMtcG9ydFwiLFxuICAgICAgICAgICAgICAgIHByb3RvY29sOiBhcmdzLnByb3RvY29sID09PSBcIlVEUFwiID8gXCJIVFRQXCIgOiBhcmdzLnByb3RvY29sLFxuICAgICAgICAgICAgICAgIHRpbWVvdXQ6IDYsXG4gICAgICAgICAgICAgICAgdW5oZWFsdGh5VGhyZXNob2xkOiAzLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy50YXJnZXRHcm91cCA9IHRhcmdldEdyb3VwQ29tcG9uZW50LnRhcmdldEdyb3VwO1xuICAgICAgICB0aGlzLnRhcmdldEdyb3VwQXJuID0gdGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBBcm47XG4gICAgICAgIHRoaXMudGFyZ2V0R3JvdXBOYW1lID0gdGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBOYW1lO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHRhcmdldEdyb3VwOiB0aGlzLnRhcmdldEdyb3VwLFxuICAgICAgICAgICAgdGFyZ2V0R3JvdXBBcm46IHRoaXMudGFyZ2V0R3JvdXBBcm4sXG4gICAgICAgICAgICB0YXJnZXRHcm91cE5hbWU6IHRoaXMudGFyZ2V0R3JvdXBOYW1lLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUYXJnZXRHcm91cChuYW1lOiBzdHJpbmcsIGFyZ3M6IFRhcmdldEdyb3VwQXJncyk6IFRhcmdldEdyb3VwUmVzdWx0IHtcbiAgICBjb25zdCB0YXJnZXRHcm91cENvbXBvbmVudCA9IG5ldyBUYXJnZXRHcm91cENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICB0YXJnZXRHcm91cDogdGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXAsXG4gICAgICAgIHRhcmdldEdyb3VwQXJuOiB0YXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cEFybixcbiAgICAgICAgdGFyZ2V0R3JvdXBOYW1lOiB0YXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cE5hbWUsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRhcmdldEdyb3VwQXR0YWNobWVudChuYW1lOiBzdHJpbmcsIGFyZ3M6IFRhcmdldEdyb3VwQXR0YWNobWVudEFyZ3MpOiBhd3MubGIuVGFyZ2V0R3JvdXBBdHRhY2htZW50IHtcbiAgICBjb25zdCBhdHRhY2htZW50Q29tcG9uZW50ID0gbmV3IFRhcmdldEdyb3VwQXR0YWNobWVudENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4gYXR0YWNobWVudENvbXBvbmVudC5hdHRhY2htZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXBwbGljYXRpb25UYXJnZXRHcm91cChuYW1lOiBzdHJpbmcsIGFyZ3M6IEFwcGxpY2F0aW9uVGFyZ2V0R3JvdXBBcmdzKTogVGFyZ2V0R3JvdXBSZXN1bHQge1xuICAgIGNvbnN0IGFwcFRhcmdldEdyb3VwQ29tcG9uZW50ID0gbmV3IEFwcGxpY2F0aW9uVGFyZ2V0R3JvdXBDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGFyZ2V0R3JvdXA6IGFwcFRhcmdldEdyb3VwQ29tcG9uZW50LnRhcmdldEdyb3VwLFxuICAgICAgICB0YXJnZXRHcm91cEFybjogYXBwVGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBBcm4sXG4gICAgICAgIHRhcmdldEdyb3VwTmFtZTogYXBwVGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBOYW1lLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOZXR3b3JrVGFyZ2V0R3JvdXAobmFtZTogc3RyaW5nLCBhcmdzOiBOZXR3b3JrVGFyZ2V0R3JvdXBBcmdzKTogVGFyZ2V0R3JvdXBSZXN1bHQge1xuICAgIGNvbnN0IG5ldHdvcmtUYXJnZXRHcm91cENvbXBvbmVudCA9IG5ldyBOZXR3b3JrVGFyZ2V0R3JvdXBDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgdGFyZ2V0R3JvdXA6IG5ldHdvcmtUYXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cCxcbiAgICAgICAgdGFyZ2V0R3JvdXBBcm46IG5ldHdvcmtUYXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cEFybixcbiAgICAgICAgdGFyZ2V0R3JvdXBOYW1lOiBuZXR3b3JrVGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBOYW1lLFxuICAgIH07XG59Il19