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
exports.HttpsAlbComponent = exports.AlbListenerComponent = exports.AlbComponent = void 0;
exports.createAlb = createAlb;
exports.createAlbListener = createAlbListener;
exports.createHttpsAlb = createHttpsAlb;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class AlbComponent extends pulumi.ComponentResource {
    loadBalancer;
    loadBalancerId;
    loadBalancerArn;
    dnsName;
    zoneId;
    constructor(name, args, opts) {
        super("aws:lb:AlbComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.loadBalancer = new aws.lb.LoadBalancer(`${name}-alb`, {
            name: args.name,
            loadBalancerType: args.loadBalancerType || "application",
            internal: args.internal ?? false, // Changed from scheme to internal
            subnets: args.subnetIds,
            securityGroups: args.securityGroupIds,
            enableDeletionProtection: args.enableDeletionProtection ?? true,
            enableHttp2: args.enableHttp2 ?? true,
            enableWafFailOpen: args.enableWafFailOpen ?? false,
            idleTimeout: args.idleTimeout || 60,
            accessLogs: args.accessLogs,
            tags: defaultTags,
        }, { parent: this });
        this.loadBalancerId = this.loadBalancer.id;
        this.loadBalancerArn = this.loadBalancer.arn;
        this.dnsName = this.loadBalancer.dnsName;
        this.zoneId = this.loadBalancer.zoneId;
        this.registerOutputs({
            loadBalancer: this.loadBalancer,
            loadBalancerId: this.loadBalancerId,
            loadBalancerArn: this.loadBalancerArn,
            dnsName: this.dnsName,
            zoneId: this.zoneId,
        });
    }
}
exports.AlbComponent = AlbComponent;
class AlbListenerComponent extends pulumi.ComponentResource {
    listener;
    listenerArn;
    constructor(name, args, opts) {
        super("aws:lb:AlbListenerComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        // Convert defaultActions to the format expected by aws.lb.Listener
        const defaultActions = args.defaultActions.map(action => {
            const baseAction = {
                type: action.type,
            };
            switch (action.type) {
                case "forward":
                    baseAction.targetGroupArn = action.targetGroupArn;
                    break;
                case "redirect":
                    baseAction.redirect = action.redirect;
                    break;
                case "fixed-response":
                    baseAction.fixedResponse = action.fixedResponse;
                    break;
            }
            return baseAction;
        });
        this.listener = new aws.lb.Listener(`${name}-listener`, {
            loadBalancerArn: args.loadBalancerArn,
            port: args.port,
            protocol: args.protocol,
            certificateArn: args.certificateArn,
            sslPolicy: args.sslPolicy || (args.protocol === "HTTPS" ? "ELBSecurityPolicy-TLS-1-2-2017-01" : undefined),
            defaultActions: defaultActions,
            tags: defaultTags,
        }, { parent: this });
        this.listenerArn = this.listener.arn;
        this.registerOutputs({
            listener: this.listener,
            listenerArn: this.listenerArn,
        });
    }
}
exports.AlbListenerComponent = AlbListenerComponent;
class HttpsAlbComponent extends pulumi.ComponentResource {
    loadBalancer;
    httpsListener;
    httpListener;
    loadBalancerId;
    loadBalancerArn;
    dnsName;
    zoneId;
    constructor(name, args, opts) {
        super("aws:lb:HttpsAlbComponent", name, {}, opts);
        // Create ALB
        const albComponent = new AlbComponent(name, {
            name: args.name,
            loadBalancerType: "application",
            internal: false, // Changed from scheme: "internet-facing"
            subnetIds: args.subnetIds,
            securityGroupIds: args.securityGroupIds,
            enableDeletionProtection: true,
            enableHttp2: true,
            accessLogs: args.accessLogs,
            tags: args.tags,
        }, { parent: this });
        this.loadBalancer = albComponent.loadBalancer;
        this.loadBalancerId = albComponent.loadBalancerId;
        this.loadBalancerArn = albComponent.loadBalancerArn;
        this.dnsName = albComponent.dnsName;
        this.zoneId = albComponent.zoneId;
        // Create HTTPS listener
        const httpsListenerComponent = new AlbListenerComponent(`${name}-https`, {
            name: `${args.name}-https`,
            loadBalancerArn: this.loadBalancerArn,
            port: 443,
            protocol: "HTTPS",
            certificateArn: args.certificateArn,
            sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
            defaultActions: args.targetGroupArn ? [
                {
                    type: "forward",
                    targetGroupArn: args.targetGroupArn,
                }
            ] : [
                {
                    type: "fixed-response",
                    fixedResponse: {
                        contentType: "text/plain",
                        messageBody: "Service Temporarily Unavailable",
                        statusCode: "503",
                    },
                }
            ],
            tags: args.tags,
        }, { parent: this });
        this.httpsListener = httpsListenerComponent.listener;
        // Create HTTP listener for redirect to HTTPS
        const httpListenerComponent = new AlbListenerComponent(`${name}-http`, {
            name: `${args.name}-http`,
            loadBalancerArn: this.loadBalancerArn,
            port: 80,
            protocol: "HTTP",
            defaultActions: [
                {
                    type: "redirect",
                    redirect: {
                        protocol: "HTTPS",
                        port: "443",
                        statusCode: "HTTP_301",
                    },
                }
            ],
            tags: args.tags,
        }, { parent: this });
        this.httpListener = httpListenerComponent.listener;
        this.registerOutputs({
            loadBalancer: this.loadBalancer,
            httpsListener: this.httpsListener,
            httpListener: this.httpListener,
            loadBalancerId: this.loadBalancerId,
            loadBalancerArn: this.loadBalancerArn,
            dnsName: this.dnsName,
            zoneId: this.zoneId,
        });
    }
}
exports.HttpsAlbComponent = HttpsAlbComponent;
function createAlb(name, args) {
    const albComponent = new AlbComponent(name, args);
    return {
        loadBalancer: albComponent.loadBalancer,
        loadBalancerId: albComponent.loadBalancerId,
        loadBalancerArn: albComponent.loadBalancerArn,
        dnsName: albComponent.dnsName,
        zoneId: albComponent.zoneId,
    };
}
function createAlbListener(name, args) {
    const listenerComponent = new AlbListenerComponent(name, args);
    return {
        listener: listenerComponent.listener,
        listenerArn: listenerComponent.listenerArn,
    };
}
function createHttpsAlb(name, args) {
    const httpsAlbComponent = new HttpsAlbComponent(name, args);
    return {
        loadBalancer: httpsAlbComponent.loadBalancer,
        httpsListener: httpsAlbComponent.httpsListener,
        httpListener: httpsAlbComponent.httpListener,
        loadBalancerId: httpsAlbComponent.loadBalancerId,
        loadBalancerArn: httpsAlbComponent.loadBalancerArn,
        dnsName: httpsAlbComponent.dnsName,
        zoneId: httpsAlbComponent.zoneId,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWxiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVSQSw4QkFTQztBQUVELDhDQU1DO0FBRUQsd0NBV0M7QUFyVEQsdURBQXlDO0FBQ3pDLGlEQUFtQztBQW9GbkMsTUFBYSxZQUFhLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN0QyxZQUFZLENBQXNCO0lBQ2xDLGNBQWMsQ0FBd0I7SUFDdEMsZUFBZSxDQUF3QjtJQUN2QyxPQUFPLENBQXdCO0lBQy9CLE1BQU0sQ0FBd0I7SUFFOUMsWUFBWSxJQUFZLEVBQUUsSUFBYSxFQUFFLElBQXNDO1FBQzNFLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTdDLE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNmLENBQUM7UUFFRixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsR0FBRyxJQUFJLE1BQU0sRUFBRTtZQUN2RCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLElBQUksYUFBYTtZQUN4RCxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxLQUFLLEVBQUUsa0NBQWtDO1lBQ3BFLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUztZQUN2QixjQUFjLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtZQUNyQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsd0JBQXdCLElBQUksSUFBSTtZQUMvRCxX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UUFDN0IsTUFBTSxFQUFFLFlBQVksQ0FBQyxNQUFNO0tBQzlCLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWSxFQUFFLElBQXFCO0lBQ2pFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0QsT0FBTztRQUNILFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxRQUFRO1FBQ3BDLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyxXQUFXO0tBQzdDLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLElBQVksRUFBRSxJQUFrQjtJQUMzRCxNQUFNLGlCQUFpQixHQUFHLElBQUksaUJBQWlCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVELE9BQU87UUFDSCxZQUFZLEVBQUUsaUJBQWlCLENBQUMsWUFBWTtRQUM1QyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsYUFBYTtRQUM5QyxZQUFZLEVBQUUsaUJBQWlCLENBQUMsWUFBWTtRQUM1QyxjQUFjLEVBQUUsaUJBQWlCLENBQUMsY0FBYztRQUNoRCxlQUFlLEVBQUUsaUJBQWlCLENBQUMsZUFBZTtRQUNsRCxPQUFPLEVBQUUsaUJBQWlCLENBQUMsT0FBTztRQUNsQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsTUFBTTtLQUNuQyxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBBbGJBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgbG9hZEJhbGFuY2VyVHlwZT86IFwiYXBwbGljYXRpb25cIiB8IFwibmV0d29ya1wiIHwgXCJnYXRld2F5XCI7XG4gICAgaW50ZXJuYWw/OiBib29sZWFuOyAvLyBDaGFuZ2VkIGZyb20gc2NoZW1lIHRvIGludGVybmFsIGJvb2xlYW5cbiAgICBzdWJuZXRJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gICAgc2VjdXJpdHlHcm91cElkcz86IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gICAgZW5hYmxlRGVsZXRpb25Qcm90ZWN0aW9uPzogYm9vbGVhbjtcbiAgICBlbmFibGVIdHRwMj86IGJvb2xlYW47XG4gICAgZW5hYmxlV2FmRmFpbE9wZW4/OiBib29sZWFuO1xuICAgIGlkbGVUaW1lb3V0PzogbnVtYmVyO1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGFjY2Vzc0xvZ3M/OiB7XG4gICAgICAgIGJ1Y2tldDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgICAgIHByZWZpeD86IHN0cmluZztcbiAgICAgICAgZW5hYmxlZD86IGJvb2xlYW47XG4gICAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbGJSZXN1bHQge1xuICAgIGxvYWRCYWxhbmNlcjogYXdzLmxiLkxvYWRCYWxhbmNlcjtcbiAgICBsb2FkQmFsYW5jZXJJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIGxvYWRCYWxhbmNlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIGRuc05hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICB6b25lSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbGJMaXN0ZW5lckFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBsb2FkQmFsYW5jZXJBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHBvcnQ6IG51bWJlcjtcbiAgICBwcm90b2NvbDogXCJIVFRQXCIgfCBcIkhUVFBTXCIgfCBcIlRDUFwiIHwgXCJUTFNcIiB8IFwiVURQXCIgfCBcIlRDUF9VRFBcIiB8IFwiR0VORVZFXCI7XG4gICAgY2VydGlmaWNhdGVBcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBzc2xQb2xpY3k/OiBzdHJpbmc7XG4gICAgZGVmYXVsdEFjdGlvbnM6IEFycmF5PHtcbiAgICAgICAgdHlwZTogXCJmb3J3YXJkXCIgfCBcInJlZGlyZWN0XCIgfCBcImZpeGVkLXJlc3BvbnNlXCIgfCBcImF1dGhlbnRpY2F0ZS1jb2duaXRvXCIgfCBcImF1dGhlbnRpY2F0ZS1vaWRjXCI7XG4gICAgICAgIHRhcmdldEdyb3VwQXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgICAgIHJlZGlyZWN0Pzoge1xuICAgICAgICAgICAgcHJvdG9jb2w/OiBzdHJpbmc7XG4gICAgICAgICAgICBwb3J0Pzogc3RyaW5nO1xuICAgICAgICAgICAgaG9zdD86IHN0cmluZztcbiAgICAgICAgICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgICAgICAgICBxdWVyeT86IHN0cmluZztcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IFwiSFRUUF8zMDFcIiB8IFwiSFRUUF8zMDJcIjtcbiAgICAgICAgfTtcbiAgICAgICAgZml4ZWRSZXNwb25zZT86IHtcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBzdHJpbmc7XG4gICAgICAgICAgICBtZXNzYWdlQm9keT86IHN0cmluZztcbiAgICAgICAgICAgIHN0YXR1c0NvZGU6IHN0cmluZztcbiAgICAgICAgfTtcbiAgICB9PjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbGJMaXN0ZW5lclJlc3VsdCB7XG4gICAgbGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjtcbiAgICBsaXN0ZW5lckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEh0dHBzQWxiQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHN1Ym5ldElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgICBzZWN1cml0eUdyb3VwSWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICAgIGNlcnRpZmljYXRlQXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICB0YXJnZXRHcm91cEFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGFjY2Vzc0xvZ3M/OiB7XG4gICAgICAgIGJ1Y2tldDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgICAgIHByZWZpeD86IHN0cmluZztcbiAgICAgICAgZW5hYmxlZD86IGJvb2xlYW47XG4gICAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIdHRwc0FsYlJlc3VsdCB7XG4gICAgbG9hZEJhbGFuY2VyOiBhd3MubGIuTG9hZEJhbGFuY2VyO1xuICAgIGh0dHBzTGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjtcbiAgICBodHRwTGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjsgLy8gRm9yIHJlZGlyZWN0IHRvIEhUVFBTXG4gICAgbG9hZEJhbGFuY2VySWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBsb2FkQmFsYW5jZXJBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBkbnNOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgem9uZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBBbGJDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXI6IGF3cy5sYi5Mb2FkQmFsYW5jZXI7XG4gICAgcHVibGljIHJlYWRvbmx5IGxvYWRCYWxhbmNlcklkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGxvYWRCYWxhbmNlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBkbnNOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IHpvbmVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBBbGJBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpsYjpBbGJDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTm92YS1Nb2RlbC1CcmVha2luZ1wiLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9hZEJhbGFuY2VyID0gbmV3IGF3cy5sYi5Mb2FkQmFsYW5jZXIoYCR7bmFtZX0tYWxiYCwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgbG9hZEJhbGFuY2VyVHlwZTogYXJncy5sb2FkQmFsYW5jZXJUeXBlIHx8IFwiYXBwbGljYXRpb25cIixcbiAgICAgICAgICAgIGludGVybmFsOiBhcmdzLmludGVybmFsID8/IGZhbHNlLCAvLyBDaGFuZ2VkIGZyb20gc2NoZW1lIHRvIGludGVybmFsXG4gICAgICAgICAgICBzdWJuZXRzOiBhcmdzLnN1Ym5ldElkcyxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBhcmdzLnNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgICAgICBlbmFibGVEZWxldGlvblByb3RlY3Rpb246IGFyZ3MuZW5hYmxlRGVsZXRpb25Qcm90ZWN0aW9uID8/IHRydWUsXG4gICAgICAgICAgICBlbmFibGVIdHRwMjogYXJncy5lbmFibGVIdHRwMiA/PyB0cnVlLFxuICAgICAgICAgICAgZW5hYmxlV2FmRmFpbE9wZW46IGFyZ3MuZW5hYmxlV2FmRmFpbE9wZW4gPz8gZmFsc2UsXG4gICAgICAgICAgICBpZGxlVGltZW91dDogYXJncy5pZGxlVGltZW91dCB8fCA2MCxcbiAgICAgICAgICAgIGFjY2Vzc0xvZ3M6IGFyZ3MuYWNjZXNzTG9ncyxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmxvYWRCYWxhbmNlcklkID0gdGhpcy5sb2FkQmFsYW5jZXIuaWQ7XG4gICAgICAgIHRoaXMubG9hZEJhbGFuY2VyQXJuID0gdGhpcy5sb2FkQmFsYW5jZXIuYXJuO1xuICAgICAgICB0aGlzLmRuc05hbWUgPSB0aGlzLmxvYWRCYWxhbmNlci5kbnNOYW1lO1xuICAgICAgICB0aGlzLnpvbmVJZCA9IHRoaXMubG9hZEJhbGFuY2VyLnpvbmVJZDtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBsb2FkQmFsYW5jZXI6IHRoaXMubG9hZEJhbGFuY2VyLFxuICAgICAgICAgICAgbG9hZEJhbGFuY2VySWQ6IHRoaXMubG9hZEJhbGFuY2VySWQsXG4gICAgICAgICAgICBsb2FkQmFsYW5jZXJBcm46IHRoaXMubG9hZEJhbGFuY2VyQXJuLFxuICAgICAgICAgICAgZG5zTmFtZTogdGhpcy5kbnNOYW1lLFxuICAgICAgICAgICAgem9uZUlkOiB0aGlzLnpvbmVJZCxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWxiTGlzdGVuZXJDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBsaXN0ZW5lcjogYXdzLmxiLkxpc3RlbmVyO1xuICAgIHB1YmxpYyByZWFkb25seSBsaXN0ZW5lckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBBbGJMaXN0ZW5lckFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmxiOkFsYkxpc3RlbmVyQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDb252ZXJ0IGRlZmF1bHRBY3Rpb25zIHRvIHRoZSBmb3JtYXQgZXhwZWN0ZWQgYnkgYXdzLmxiLkxpc3RlbmVyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRBY3Rpb25zID0gYXJncy5kZWZhdWx0QWN0aW9ucy5tYXAoYWN0aW9uID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGJhc2VBY3Rpb246IGFueSA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiBhY3Rpb24udHlwZSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgICAgICAgICAgICBjYXNlIFwiZm9yd2FyZFwiOlxuICAgICAgICAgICAgICAgICAgICBiYXNlQWN0aW9uLnRhcmdldEdyb3VwQXJuID0gYWN0aW9uLnRhcmdldEdyb3VwQXJuO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwicmVkaXJlY3RcIjpcbiAgICAgICAgICAgICAgICAgICAgYmFzZUFjdGlvbi5yZWRpcmVjdCA9IGFjdGlvbi5yZWRpcmVjdDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcImZpeGVkLXJlc3BvbnNlXCI6XG4gICAgICAgICAgICAgICAgICAgIGJhc2VBY3Rpb24uZml4ZWRSZXNwb25zZSA9IGFjdGlvbi5maXhlZFJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGJhc2VBY3Rpb247XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMubGlzdGVuZXIgPSBuZXcgYXdzLmxiLkxpc3RlbmVyKGAke25hbWV9LWxpc3RlbmVyYCwge1xuICAgICAgICAgICAgbG9hZEJhbGFuY2VyQXJuOiBhcmdzLmxvYWRCYWxhbmNlckFybixcbiAgICAgICAgICAgIHBvcnQ6IGFyZ3MucG9ydCxcbiAgICAgICAgICAgIHByb3RvY29sOiBhcmdzLnByb3RvY29sLFxuICAgICAgICAgICAgY2VydGlmaWNhdGVBcm46IGFyZ3MuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgICAgICBzc2xQb2xpY3k6IGFyZ3Muc3NsUG9saWN5IHx8IChhcmdzLnByb3RvY29sID09PSBcIkhUVFBTXCIgPyBcIkVMQlNlY3VyaXR5UG9saWN5LVRMUy0xLTItMjAxNy0wMVwiIDogdW5kZWZpbmVkKSxcbiAgICAgICAgICAgIGRlZmF1bHRBY3Rpb25zOiBkZWZhdWx0QWN0aW9ucyxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmxpc3RlbmVyQXJuID0gdGhpcy5saXN0ZW5lci5hcm47XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgbGlzdGVuZXI6IHRoaXMubGlzdGVuZXIsXG4gICAgICAgICAgICBsaXN0ZW5lckFybjogdGhpcy5saXN0ZW5lckFybixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgSHR0cHNBbGJDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXI6IGF3cy5sYi5Mb2FkQmFsYW5jZXI7XG4gICAgcHVibGljIHJlYWRvbmx5IGh0dHBzTGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgaHR0cExpc3RlbmVyOiBhd3MubGIuTGlzdGVuZXI7XG4gICAgcHVibGljIHJlYWRvbmx5IGxvYWRCYWxhbmNlcklkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGxvYWRCYWxhbmNlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBkbnNOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IHpvbmVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBIdHRwc0FsYkFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmxiOkh0dHBzQWxiQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICAvLyBDcmVhdGUgQUxCXG4gICAgICAgIGNvbnN0IGFsYkNvbXBvbmVudCA9IG5ldyBBbGJDb21wb25lbnQobmFtZSwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgbG9hZEJhbGFuY2VyVHlwZTogXCJhcHBsaWNhdGlvblwiLFxuICAgICAgICAgICAgaW50ZXJuYWw6IGZhbHNlLCAvLyBDaGFuZ2VkIGZyb20gc2NoZW1lOiBcImludGVybmV0LWZhY2luZ1wiXG4gICAgICAgICAgICBzdWJuZXRJZHM6IGFyZ3Muc3VibmV0SWRzLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkczogYXJncy5zZWN1cml0eUdyb3VwSWRzLFxuICAgICAgICAgICAgZW5hYmxlRGVsZXRpb25Qcm90ZWN0aW9uOiB0cnVlLFxuICAgICAgICAgICAgZW5hYmxlSHR0cDI6IHRydWUsXG4gICAgICAgICAgICBhY2Nlc3NMb2dzOiBhcmdzLmFjY2Vzc0xvZ3MsXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMubG9hZEJhbGFuY2VyID0gYWxiQ29tcG9uZW50LmxvYWRCYWxhbmNlcjtcbiAgICAgICAgdGhpcy5sb2FkQmFsYW5jZXJJZCA9IGFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXJJZDtcbiAgICAgICAgdGhpcy5sb2FkQmFsYW5jZXJBcm4gPSBhbGJDb21wb25lbnQubG9hZEJhbGFuY2VyQXJuO1xuICAgICAgICB0aGlzLmRuc05hbWUgPSBhbGJDb21wb25lbnQuZG5zTmFtZTtcbiAgICAgICAgdGhpcy56b25lSWQgPSBhbGJDb21wb25lbnQuem9uZUlkO1xuXG4gICAgICAgIC8vIENyZWF0ZSBIVFRQUyBsaXN0ZW5lclxuICAgICAgICBjb25zdCBodHRwc0xpc3RlbmVyQ29tcG9uZW50ID0gbmV3IEFsYkxpc3RlbmVyQ29tcG9uZW50KGAke25hbWV9LWh0dHBzYCwge1xuICAgICAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1odHRwc2AsXG4gICAgICAgICAgICBsb2FkQmFsYW5jZXJBcm46IHRoaXMubG9hZEJhbGFuY2VyQXJuLFxuICAgICAgICAgICAgcG9ydDogNDQzLFxuICAgICAgICAgICAgcHJvdG9jb2w6IFwiSFRUUFNcIixcbiAgICAgICAgICAgIGNlcnRpZmljYXRlQXJuOiBhcmdzLmNlcnRpZmljYXRlQXJuLFxuICAgICAgICAgICAgc3NsUG9saWN5OiBcIkVMQlNlY3VyaXR5UG9saWN5LVRMUy0xLTItMjAxNy0wMVwiLFxuICAgICAgICAgICAgZGVmYXVsdEFjdGlvbnM6IGFyZ3MudGFyZ2V0R3JvdXBBcm4gPyBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImZvcndhcmRcIixcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0R3JvdXBBcm46IGFyZ3MudGFyZ2V0R3JvdXBBcm4sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSA6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiZml4ZWQtcmVzcG9uc2VcIixcbiAgICAgICAgICAgICAgICAgICAgZml4ZWRSZXNwb25zZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6IFwidGV4dC9wbGFpblwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZUJvZHk6IFwiU2VydmljZSBUZW1wb3JhcmlseSBVbmF2YWlsYWJsZVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogXCI1MDNcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmh0dHBzTGlzdGVuZXIgPSBodHRwc0xpc3RlbmVyQ29tcG9uZW50Lmxpc3RlbmVyO1xuXG4gICAgICAgIC8vIENyZWF0ZSBIVFRQIGxpc3RlbmVyIGZvciByZWRpcmVjdCB0byBIVFRQU1xuICAgICAgICBjb25zdCBodHRwTGlzdGVuZXJDb21wb25lbnQgPSBuZXcgQWxiTGlzdGVuZXJDb21wb25lbnQoYCR7bmFtZX0taHR0cGAsIHtcbiAgICAgICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0taHR0cGAsXG4gICAgICAgICAgICBsb2FkQmFsYW5jZXJBcm46IHRoaXMubG9hZEJhbGFuY2VyQXJuLFxuICAgICAgICAgICAgcG9ydDogODAsXG4gICAgICAgICAgICBwcm90b2NvbDogXCJIVFRQXCIsXG4gICAgICAgICAgICBkZWZhdWx0QWN0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJyZWRpcmVjdFwiLFxuICAgICAgICAgICAgICAgICAgICByZWRpcmVjdDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2w6IFwiSFRUUFNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvcnQ6IFwiNDQzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0dXNDb2RlOiBcIkhUVFBfMzAxXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5odHRwTGlzdGVuZXIgPSBodHRwTGlzdGVuZXJDb21wb25lbnQubGlzdGVuZXI7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgbG9hZEJhbGFuY2VyOiB0aGlzLmxvYWRCYWxhbmNlcixcbiAgICAgICAgICAgIGh0dHBzTGlzdGVuZXI6IHRoaXMuaHR0cHNMaXN0ZW5lcixcbiAgICAgICAgICAgIGh0dHBMaXN0ZW5lcjogdGhpcy5odHRwTGlzdGVuZXIsXG4gICAgICAgICAgICBsb2FkQmFsYW5jZXJJZDogdGhpcy5sb2FkQmFsYW5jZXJJZCxcbiAgICAgICAgICAgIGxvYWRCYWxhbmNlckFybjogdGhpcy5sb2FkQmFsYW5jZXJBcm4sXG4gICAgICAgICAgICBkbnNOYW1lOiB0aGlzLmRuc05hbWUsXG4gICAgICAgICAgICB6b25lSWQ6IHRoaXMuem9uZUlkLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBbGIobmFtZTogc3RyaW5nLCBhcmdzOiBBbGJBcmdzKTogQWxiUmVzdWx0IHtcbiAgICBjb25zdCBhbGJDb21wb25lbnQgPSBuZXcgQWxiQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWRCYWxhbmNlcjogYWxiQ29tcG9uZW50LmxvYWRCYWxhbmNlcixcbiAgICAgICAgbG9hZEJhbGFuY2VySWQ6IGFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXJJZCxcbiAgICAgICAgbG9hZEJhbGFuY2VyQXJuOiBhbGJDb21wb25lbnQubG9hZEJhbGFuY2VyQXJuLFxuICAgICAgICBkbnNOYW1lOiBhbGJDb21wb25lbnQuZG5zTmFtZSxcbiAgICAgICAgem9uZUlkOiBhbGJDb21wb25lbnQuem9uZUlkLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBbGJMaXN0ZW5lcihuYW1lOiBzdHJpbmcsIGFyZ3M6IEFsYkxpc3RlbmVyQXJncyk6IEFsYkxpc3RlbmVyUmVzdWx0IHtcbiAgICBjb25zdCBsaXN0ZW5lckNvbXBvbmVudCA9IG5ldyBBbGJMaXN0ZW5lckNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBsaXN0ZW5lcjogbGlzdGVuZXJDb21wb25lbnQubGlzdGVuZXIsXG4gICAgICAgIGxpc3RlbmVyQXJuOiBsaXN0ZW5lckNvbXBvbmVudC5saXN0ZW5lckFybixcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSHR0cHNBbGIobmFtZTogc3RyaW5nLCBhcmdzOiBIdHRwc0FsYkFyZ3MpOiBIdHRwc0FsYlJlc3VsdCB7XG4gICAgY29uc3QgaHR0cHNBbGJDb21wb25lbnQgPSBuZXcgSHR0cHNBbGJDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZEJhbGFuY2VyOiBodHRwc0FsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXIsXG4gICAgICAgIGh0dHBzTGlzdGVuZXI6IGh0dHBzQWxiQ29tcG9uZW50Lmh0dHBzTGlzdGVuZXIsXG4gICAgICAgIGh0dHBMaXN0ZW5lcjogaHR0cHNBbGJDb21wb25lbnQuaHR0cExpc3RlbmVyLFxuICAgICAgICBsb2FkQmFsYW5jZXJJZDogaHR0cHNBbGJDb21wb25lbnQubG9hZEJhbGFuY2VySWQsXG4gICAgICAgIGxvYWRCYWxhbmNlckFybjogaHR0cHNBbGJDb21wb25lbnQubG9hZEJhbGFuY2VyQXJuLFxuICAgICAgICBkbnNOYW1lOiBodHRwc0FsYkNvbXBvbmVudC5kbnNOYW1lLFxuICAgICAgICB6b25lSWQ6IGh0dHBzQWxiQ29tcG9uZW50LnpvbmVJZCxcbiAgICB9O1xufSJdfQ==