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
        super('aws:lb:TargetGroupComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.targetGroup = new aws.lb.TargetGroup(`${name}-tg`, {
            name: args.name,
            port: args.port,
            protocol: args.protocol,
            vpcId: args.vpcId,
            targetType: args.targetType || 'instance',
            protocolVersion: args.protocolVersion,
            healthCheck: args.healthCheck,
            stickiness: args.stickiness,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:lb:TargetGroupAttachmentComponent', name, {}, opts);
        this.attachment = new aws.lb.TargetGroupAttachment(`${name}-attachment`, {
            targetGroupArn: args.targetGroupArn,
            targetId: args.targetId,
            port: args.port,
            availabilityZone: args.availabilityZone,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:lb:ApplicationTargetGroupComponent', name, {}, opts);
        const targetGroupComponent = new TargetGroupComponent(name, {
            name: args.name,
            port: args.port,
            protocol: 'HTTP',
            vpcId: args.vpcId,
            targetType: 'instance',
            healthCheck: {
                enabled: true,
                healthyThreshold: 2,
                interval: 30,
                matcher: args.healthCheckMatcher || '200',
                path: args.healthCheckPath || '/health',
                port: 'traffic-port',
                protocol: 'HTTP',
                timeout: 5,
                unhealthyThreshold: 2,
            },
            stickiness: {
                enabled: false,
                type: 'lb_cookie',
                cookieDuration: 86400,
            },
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:lb:NetworkTargetGroupComponent', name, {}, opts);
        const targetGroupComponent = new TargetGroupComponent(name, {
            name: args.name,
            port: args.port,
            protocol: args.protocol,
            vpcId: args.vpcId,
            targetType: 'instance',
            healthCheck: {
                enabled: true,
                healthyThreshold: 3,
                interval: 30,
                port: 'traffic-port',
                protocol: args.protocol === 'UDP' ? 'HTTP' : args.protocol,
                timeout: 6,
                unhealthyThreshold: 3,
            },
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
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
function createTargetGroup(name, args, opts) {
    const targetGroupComponent = new TargetGroupComponent(name, args, opts);
    return {
        targetGroup: targetGroupComponent.targetGroup,
        targetGroupArn: targetGroupComponent.targetGroupArn,
        targetGroupName: targetGroupComponent.targetGroupName,
    };
}
function createTargetGroupAttachment(name, args, opts) {
    const attachmentComponent = new TargetGroupAttachmentComponent(name, args, opts);
    return attachmentComponent.attachment;
}
function createApplicationTargetGroup(name, args, opts) {
    const appTargetGroupComponent = new ApplicationTargetGroupComponent(name, args, opts);
    return {
        targetGroup: appTargetGroupComponent.targetGroup,
        targetGroupArn: appTargetGroupComponent.targetGroupArn,
        targetGroupName: appTargetGroupComponent.targetGroupName,
    };
}
function createNetworkTargetGroup(name, args, opts) {
    const networkTargetGroupComponent = new NetworkTargetGroupComponent(name, args, opts);
    return {
        targetGroup: networkTargetGroupComponent.targetGroup,
        targetGroupArn: networkTargetGroupComponent.targetGroupArn,
        targetGroupName: networkTargetGroupComponent.targetGroupName,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFyZ2V0R3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0YXJnZXRHcm91cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUEwT0EsOENBV0M7QUFFRCxrRUFXQztBQUVELG9FQWVDO0FBRUQsNERBZUM7QUFwU0QsdURBQXlDO0FBQ3pDLGlEQUFtQztBQTREbkMsTUFBYSxvQkFBcUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ2hELFdBQVcsQ0FBcUI7SUFDaEMsY0FBYyxDQUF3QjtJQUN0QyxlQUFlLENBQXdCO0lBRXZELFlBQ0UsSUFBWSxFQUNaLElBQXFCLEVBQ3JCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXJELE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNiLENBQUM7UUFFRixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQ3ZDLEdBQUcsSUFBSSxLQUFLLEVBQ1o7WUFDRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxJQUFJLFVBQVU7WUFDekMsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDM0IsSUFBSSxFQUFFLFdBQVc7U0FDbEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FDM0MsQ0FBQztRQUVGLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUM7UUFDM0MsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztRQUU3QyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDbkMsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1NBQ3RDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTdDRCxvREE2Q0M7QUFFRCxNQUFhLDhCQUErQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDMUQsVUFBVSxDQUErQjtJQUV6RCxZQUNFLElBQVksRUFDWixJQUErQixFQUMvQixJQUFzQztRQUV0QyxLQUFLLENBQUMsdUNBQXVDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUvRCxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxxQkFBcUIsQ0FDaEQsR0FBRyxJQUFJLGFBQWEsRUFDcEI7WUFDRSxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDbkMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7U0FDeEMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsQ0FDM0MsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1NBQzVCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpCRCx3RUF5QkM7QUFFRCxNQUFhLCtCQUFnQyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDM0QsV0FBVyxDQUFxQjtJQUNoQyxjQUFjLENBQXdCO0lBQ3RDLGVBQWUsQ0FBd0I7SUFFdkQsWUFDRSxJQUFZLEVBQ1osSUFBZ0MsRUFDaEMsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLHdDQUF3QyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFaEUsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLG9CQUFvQixDQUNuRCxJQUFJLEVBQ0o7WUFDRSxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixRQUFRLEVBQUUsTUFBTTtZQUNoQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsVUFBVSxFQUFFLFVBQVU7WUFDdEIsV0FBVyxFQUFFO2dCQUNYLE9BQU8sRUFBRSxJQUFJO2dCQUNiLGdCQUFnQixFQUFFLENBQUM7Z0JBQ25CLFFBQVEsRUFBRSxFQUFFO2dCQUNaLE9BQU8sRUFBRSxJQUFJLENBQUMsa0JBQWtCLElBQUksS0FBSztnQkFDekMsSUFBSSxFQUFFLElBQUksQ0FBQyxlQUFlLElBQUksU0FBUztnQkFDdkMsSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFFBQVEsRUFBRSxNQUFNO2dCQUNoQixPQUFPLEVBQUUsQ0FBQztnQkFDVixrQkFBa0IsRUFBRSxDQUFDO2FBQ3RCO1lBQ0QsVUFBVSxFQUFFO2dCQUNWLE9BQU8sRUFBRSxLQUFLO2dCQUNkLElBQUksRUFBRSxXQUFXO2dCQUNqQixjQUFjLEVBQUUsS0FBSzthQUN0QjtZQUNELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUMzQyxDQUFDO1FBRUYsSUFBSSxDQUFDLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQyxXQUFXLENBQUM7UUFDcEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUM7UUFDMUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7UUFFNUQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO1lBQ25DLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZTtTQUN0QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFuREQsMEVBbURDO0FBRUQsTUFBYSwyQkFBNEIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3ZELFdBQVcsQ0FBcUI7SUFDaEMsY0FBYyxDQUF3QjtJQUN0QyxlQUFlLENBQXdCO0lBRXZELFlBQ0UsSUFBWSxFQUNaLElBQTRCLEVBQzVCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxvQkFBb0IsQ0FDbkQsSUFBSSxFQUNKO1lBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixVQUFVLEVBQUUsVUFBVTtZQUN0QixXQUFXLEVBQUU7Z0JBQ1gsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDbkIsUUFBUSxFQUFFLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUTtnQkFDMUQsT0FBTyxFQUFFLENBQUM7Z0JBQ1Ysa0JBQWtCLEVBQUUsQ0FBQzthQUN0QjtZQUNELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUMzQyxDQUFDO1FBRUYsSUFBSSxDQUFDLFdBQVcsR0FBRyxvQkFBb0IsQ0FBQyxXQUFXLENBQUM7UUFDcEQsSUFBSSxDQUFDLGNBQWMsR0FBRyxvQkFBb0IsQ0FBQyxjQUFjLENBQUM7UUFDMUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7UUFFNUQsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO1lBQ25DLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZTtTQUN0QyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUE1Q0Qsa0VBNENDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQy9CLElBQVksRUFDWixJQUFxQixFQUNyQixJQUFzQztJQUV0QyxNQUFNLG9CQUFvQixHQUFHLElBQUksb0JBQW9CLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4RSxPQUFPO1FBQ0wsV0FBVyxFQUFFLG9CQUFvQixDQUFDLFdBQVc7UUFDN0MsY0FBYyxFQUFFLG9CQUFvQixDQUFDLGNBQWM7UUFDbkQsZUFBZSxFQUFFLG9CQUFvQixDQUFDLGVBQWU7S0FDdEQsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFnQiwyQkFBMkIsQ0FDekMsSUFBWSxFQUNaLElBQStCLEVBQy9CLElBQXNDO0lBRXRDLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSw4QkFBOEIsQ0FDNUQsSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLENBQ0wsQ0FBQztJQUNGLE9BQU8sbUJBQW1CLENBQUMsVUFBVSxDQUFDO0FBQ3hDLENBQUM7QUFFRCxTQUFnQiw0QkFBNEIsQ0FDMUMsSUFBWSxFQUNaLElBQWdDLEVBQ2hDLElBQXNDO0lBRXRDLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSwrQkFBK0IsQ0FDakUsSUFBSSxFQUNKLElBQUksRUFDSixJQUFJLENBQ0wsQ0FBQztJQUNGLE9BQU87UUFDTCxXQUFXLEVBQUUsdUJBQXVCLENBQUMsV0FBVztRQUNoRCxjQUFjLEVBQUUsdUJBQXVCLENBQUMsY0FBYztRQUN0RCxlQUFlLEVBQUUsdUJBQXVCLENBQUMsZUFBZTtLQUN6RCxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQWdCLHdCQUF3QixDQUN0QyxJQUFZLEVBQ1osSUFBNEIsRUFDNUIsSUFBc0M7SUFFdEMsTUFBTSwyQkFBMkIsR0FBRyxJQUFJLDJCQUEyQixDQUNqRSxJQUFJLEVBQ0osSUFBSSxFQUNKLElBQUksQ0FDTCxDQUFDO0lBQ0YsT0FBTztRQUNMLFdBQVcsRUFBRSwyQkFBMkIsQ0FBQyxXQUFXO1FBQ3BELGNBQWMsRUFBRSwyQkFBMkIsQ0FBQyxjQUFjO1FBQzFELGVBQWUsRUFBRSwyQkFBMkIsQ0FBQyxlQUFlO0tBQzdELENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFyZ2V0R3JvdXBBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBwb3J0OiBudW1iZXI7XG4gIHByb3RvY29sOiAnSFRUUCcgfCAnSFRUUFMnIHwgJ1RDUCcgfCAnVExTJyB8ICdVRFAnIHwgJ1RDUF9VRFAnIHwgJ0dFTkVWRSc7XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFyZ2V0VHlwZT86ICdpbnN0YW5jZScgfCAnaXAnIHwgJ2xhbWJkYScgfCAnYWxiJztcbiAgcHJvdG9jb2xWZXJzaW9uPzogc3RyaW5nO1xuICBoZWFsdGhDaGVjaz86IHtcbiAgICBlbmFibGVkPzogYm9vbGVhbjtcbiAgICBoZWFsdGh5VGhyZXNob2xkPzogbnVtYmVyO1xuICAgIGludGVydmFsPzogbnVtYmVyO1xuICAgIG1hdGNoZXI/OiBzdHJpbmc7XG4gICAgcGF0aD86IHN0cmluZztcbiAgICBwb3J0Pzogc3RyaW5nO1xuICAgIHByb3RvY29sPzogc3RyaW5nO1xuICAgIHRpbWVvdXQ/OiBudW1iZXI7XG4gICAgdW5oZWFsdGh5VGhyZXNob2xkPzogbnVtYmVyO1xuICB9O1xuICBzdGlja2luZXNzPzoge1xuICAgIGVuYWJsZWQ/OiBib29sZWFuO1xuICAgIHR5cGU6ICdsYl9jb29raWUnIHwgJ2FwcF9jb29raWUnIHwgJ3NvdXJjZV9pcCc7XG4gICAgY29va2llRHVyYXRpb24/OiBudW1iZXI7XG4gICAgY29va2llTmFtZT86IHN0cmluZztcbiAgfTtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGFyZ2V0R3JvdXBSZXN1bHQge1xuICB0YXJnZXRHcm91cDogYXdzLmxiLlRhcmdldEdyb3VwO1xuICB0YXJnZXRHcm91cEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICB0YXJnZXRHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUYXJnZXRHcm91cEF0dGFjaG1lbnRBcmdzIHtcbiAgdGFyZ2V0R3JvdXBBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YXJnZXRJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHBvcnQ/OiBudW1iZXI7XG4gIGF2YWlsYWJpbGl0eVpvbmU/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbGljYXRpb25UYXJnZXRHcm91cEFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHBvcnQ6IG51bWJlcjtcbiAgdnBjSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBoZWFsdGhDaGVja1BhdGg/OiBzdHJpbmc7XG4gIGhlYWx0aENoZWNrTWF0Y2hlcj86IHN0cmluZztcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV0d29ya1RhcmdldEdyb3VwQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgcG9ydDogbnVtYmVyO1xuICBwcm90b2NvbDogJ1RDUCcgfCAnVURQJyB8ICdUQ1BfVURQJztcbiAgdnBjSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBwcmVzZXJ2ZUNsaWVudElwPzogYm9vbGVhbjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBUYXJnZXRHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB0YXJnZXRHcm91cDogYXdzLmxiLlRhcmdldEdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHRhcmdldEdyb3VwTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBUYXJnZXRHcm91cEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpsYjpUYXJnZXRHcm91cENvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgTWFuYWdlZEJ5OiAnUHVsdW1pJyxcbiAgICAgIFByb2plY3Q6ICdBV1MtTm92YS1Nb2RlbC1CcmVha2luZycsXG4gICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgfTtcblxuICAgIHRoaXMudGFyZ2V0R3JvdXAgPSBuZXcgYXdzLmxiLlRhcmdldEdyb3VwKFxuICAgICAgYCR7bmFtZX0tdGdgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIHBvcnQ6IGFyZ3MucG9ydCxcbiAgICAgICAgcHJvdG9jb2w6IGFyZ3MucHJvdG9jb2wsXG4gICAgICAgIHZwY0lkOiBhcmdzLnZwY0lkLFxuICAgICAgICB0YXJnZXRUeXBlOiBhcmdzLnRhcmdldFR5cGUgfHwgJ2luc3RhbmNlJyxcbiAgICAgICAgcHJvdG9jb2xWZXJzaW9uOiBhcmdzLnByb3RvY29sVmVyc2lvbixcbiAgICAgICAgaGVhbHRoQ2hlY2s6IGFyZ3MuaGVhbHRoQ2hlY2ssXG4gICAgICAgIHN0aWNraW5lc3M6IGFyZ3Muc3RpY2tpbmVzcyxcbiAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMudGFyZ2V0R3JvdXBBcm4gPSB0aGlzLnRhcmdldEdyb3VwLmFybjtcbiAgICB0aGlzLnRhcmdldEdyb3VwTmFtZSA9IHRoaXMudGFyZ2V0R3JvdXAubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHRhcmdldEdyb3VwOiB0aGlzLnRhcmdldEdyb3VwLFxuICAgICAgdGFyZ2V0R3JvdXBBcm46IHRoaXMudGFyZ2V0R3JvdXBBcm4sXG4gICAgICB0YXJnZXRHcm91cE5hbWU6IHRoaXMudGFyZ2V0R3JvdXBOYW1lLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBUYXJnZXRHcm91cEF0dGFjaG1lbnRDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYXR0YWNobWVudDogYXdzLmxiLlRhcmdldEdyb3VwQXR0YWNobWVudDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogVGFyZ2V0R3JvdXBBdHRhY2htZW50QXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmxiOlRhcmdldEdyb3VwQXR0YWNobWVudENvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIHRoaXMuYXR0YWNobWVudCA9IG5ldyBhd3MubGIuVGFyZ2V0R3JvdXBBdHRhY2htZW50KFxuICAgICAgYCR7bmFtZX0tYXR0YWNobWVudGAsXG4gICAgICB7XG4gICAgICAgIHRhcmdldEdyb3VwQXJuOiBhcmdzLnRhcmdldEdyb3VwQXJuLFxuICAgICAgICB0YXJnZXRJZDogYXJncy50YXJnZXRJZCxcbiAgICAgICAgcG9ydDogYXJncy5wb3J0LFxuICAgICAgICBhdmFpbGFiaWxpdHlab25lOiBhcmdzLmF2YWlsYWJpbGl0eVpvbmUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGF0dGFjaG1lbnQ6IHRoaXMuYXR0YWNobWVudCxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25UYXJnZXRHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB0YXJnZXRHcm91cDogYXdzLmxiLlRhcmdldEdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHRhcmdldEdyb3VwTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBBcHBsaWNhdGlvblRhcmdldEdyb3VwQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmxiOkFwcGxpY2F0aW9uVGFyZ2V0R3JvdXBDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCB0YXJnZXRHcm91cENvbXBvbmVudCA9IG5ldyBUYXJnZXRHcm91cENvbXBvbmVudChcbiAgICAgIG5hbWUsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgcG9ydDogYXJncy5wb3J0LFxuICAgICAgICBwcm90b2NvbDogJ0hUVFAnLFxuICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgdGFyZ2V0VHlwZTogJ2luc3RhbmNlJyxcbiAgICAgICAgaGVhbHRoQ2hlY2s6IHtcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIGhlYWx0aHlUaHJlc2hvbGQ6IDIsXG4gICAgICAgICAgaW50ZXJ2YWw6IDMwLFxuICAgICAgICAgIG1hdGNoZXI6IGFyZ3MuaGVhbHRoQ2hlY2tNYXRjaGVyIHx8ICcyMDAnLFxuICAgICAgICAgIHBhdGg6IGFyZ3MuaGVhbHRoQ2hlY2tQYXRoIHx8ICcvaGVhbHRoJyxcbiAgICAgICAgICBwb3J0OiAndHJhZmZpYy1wb3J0JyxcbiAgICAgICAgICBwcm90b2NvbDogJ0hUVFAnLFxuICAgICAgICAgIHRpbWVvdXQ6IDUsXG4gICAgICAgICAgdW5oZWFsdGh5VGhyZXNob2xkOiAyLFxuICAgICAgICB9LFxuICAgICAgICBzdGlja2luZXNzOiB7XG4gICAgICAgICAgZW5hYmxlZDogZmFsc2UsXG4gICAgICAgICAgdHlwZTogJ2xiX2Nvb2tpZScsXG4gICAgICAgICAgY29va2llRHVyYXRpb246IDg2NDAwLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMudGFyZ2V0R3JvdXAgPSB0YXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cDtcbiAgICB0aGlzLnRhcmdldEdyb3VwQXJuID0gdGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBBcm47XG4gICAgdGhpcy50YXJnZXRHcm91cE5hbWUgPSB0YXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cE5hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB0YXJnZXRHcm91cDogdGhpcy50YXJnZXRHcm91cCxcbiAgICAgIHRhcmdldEdyb3VwQXJuOiB0aGlzLnRhcmdldEdyb3VwQXJuLFxuICAgICAgdGFyZ2V0R3JvdXBOYW1lOiB0aGlzLnRhcmdldEdyb3VwTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya1RhcmdldEdyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHRhcmdldEdyb3VwOiBhd3MubGIuVGFyZ2V0R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSB0YXJnZXRHcm91cEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgdGFyZ2V0R3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IE5ldHdvcmtUYXJnZXRHcm91cEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpsYjpOZXR3b3JrVGFyZ2V0R3JvdXBDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCB0YXJnZXRHcm91cENvbXBvbmVudCA9IG5ldyBUYXJnZXRHcm91cENvbXBvbmVudChcbiAgICAgIG5hbWUsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgcG9ydDogYXJncy5wb3J0LFxuICAgICAgICBwcm90b2NvbDogYXJncy5wcm90b2NvbCxcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIHRhcmdldFR5cGU6ICdpbnN0YW5jZScsXG4gICAgICAgIGhlYWx0aENoZWNrOiB7XG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICBoZWFsdGh5VGhyZXNob2xkOiAzLFxuICAgICAgICAgIGludGVydmFsOiAzMCxcbiAgICAgICAgICBwb3J0OiAndHJhZmZpYy1wb3J0JyxcbiAgICAgICAgICBwcm90b2NvbDogYXJncy5wcm90b2NvbCA9PT0gJ1VEUCcgPyAnSFRUUCcgOiBhcmdzLnByb3RvY29sLFxuICAgICAgICAgIHRpbWVvdXQ6IDYsXG4gICAgICAgICAgdW5oZWFsdGh5VGhyZXNob2xkOiAzLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMudGFyZ2V0R3JvdXAgPSB0YXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cDtcbiAgICB0aGlzLnRhcmdldEdyb3VwQXJuID0gdGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBBcm47XG4gICAgdGhpcy50YXJnZXRHcm91cE5hbWUgPSB0YXJnZXRHcm91cENvbXBvbmVudC50YXJnZXRHcm91cE5hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB0YXJnZXRHcm91cDogdGhpcy50YXJnZXRHcm91cCxcbiAgICAgIHRhcmdldEdyb3VwQXJuOiB0aGlzLnRhcmdldEdyb3VwQXJuLFxuICAgICAgdGFyZ2V0R3JvdXBOYW1lOiB0aGlzLnRhcmdldEdyb3VwTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGFyZ2V0R3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogVGFyZ2V0R3JvdXBBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogVGFyZ2V0R3JvdXBSZXN1bHQge1xuICBjb25zdCB0YXJnZXRHcm91cENvbXBvbmVudCA9IG5ldyBUYXJnZXRHcm91cENvbXBvbmVudChuYW1lLCBhcmdzLCBvcHRzKTtcbiAgcmV0dXJuIHtcbiAgICB0YXJnZXRHcm91cDogdGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXAsXG4gICAgdGFyZ2V0R3JvdXBBcm46IHRhcmdldEdyb3VwQ29tcG9uZW50LnRhcmdldEdyb3VwQXJuLFxuICAgIHRhcmdldEdyb3VwTmFtZTogdGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBOYW1lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGFyZ2V0R3JvdXBBdHRhY2htZW50KFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IFRhcmdldEdyb3VwQXR0YWNobWVudEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBhd3MubGIuVGFyZ2V0R3JvdXBBdHRhY2htZW50IHtcbiAgY29uc3QgYXR0YWNobWVudENvbXBvbmVudCA9IG5ldyBUYXJnZXRHcm91cEF0dGFjaG1lbnRDb21wb25lbnQoXG4gICAgbmFtZSxcbiAgICBhcmdzLFxuICAgIG9wdHNcbiAgKTtcbiAgcmV0dXJuIGF0dGFjaG1lbnRDb21wb25lbnQuYXR0YWNobWVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFwcGxpY2F0aW9uVGFyZ2V0R3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogQXBwbGljYXRpb25UYXJnZXRHcm91cEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBUYXJnZXRHcm91cFJlc3VsdCB7XG4gIGNvbnN0IGFwcFRhcmdldEdyb3VwQ29tcG9uZW50ID0gbmV3IEFwcGxpY2F0aW9uVGFyZ2V0R3JvdXBDb21wb25lbnQoXG4gICAgbmFtZSxcbiAgICBhcmdzLFxuICAgIG9wdHNcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICB0YXJnZXRHcm91cDogYXBwVGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXAsXG4gICAgdGFyZ2V0R3JvdXBBcm46IGFwcFRhcmdldEdyb3VwQ29tcG9uZW50LnRhcmdldEdyb3VwQXJuLFxuICAgIHRhcmdldEdyb3VwTmFtZTogYXBwVGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBOYW1lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTmV0d29ya1RhcmdldEdyb3VwKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IE5ldHdvcmtUYXJnZXRHcm91cEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBUYXJnZXRHcm91cFJlc3VsdCB7XG4gIGNvbnN0IG5ldHdvcmtUYXJnZXRHcm91cENvbXBvbmVudCA9IG5ldyBOZXR3b3JrVGFyZ2V0R3JvdXBDb21wb25lbnQoXG4gICAgbmFtZSxcbiAgICBhcmdzLFxuICAgIG9wdHNcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICB0YXJnZXRHcm91cDogbmV0d29ya1RhcmdldEdyb3VwQ29tcG9uZW50LnRhcmdldEdyb3VwLFxuICAgIHRhcmdldEdyb3VwQXJuOiBuZXR3b3JrVGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBBcm4sXG4gICAgdGFyZ2V0R3JvdXBOYW1lOiBuZXR3b3JrVGFyZ2V0R3JvdXBDb21wb25lbnQudGFyZ2V0R3JvdXBOYW1lLFxuICB9O1xufVxuIl19