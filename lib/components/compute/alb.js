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
exports.HttpAlbComponent = exports.HttpsAlbComponent = exports.AlbListenerComponent = exports.AlbComponent = void 0;
exports.createAlb = createAlb;
exports.createAlbListener = createAlbListener;
exports.createHttpsAlb = createHttpsAlb;
exports.createHttpAlb = createHttpAlb;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class AlbComponent extends pulumi.ComponentResource {
    loadBalancer;
    loadBalancerId;
    loadBalancerArn;
    dnsName;
    zoneId;
    constructor(name, args, opts) {
        super('aws:lb:AlbComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.loadBalancer = new aws.lb.LoadBalancer(`${name}-alb`, {
            name: args.name,
            loadBalancerType: args.loadBalancerType || 'application',
            internal: args.internal ?? false, // Changed from scheme to internal
            subnets: args.subnetIds,
            securityGroups: args.securityGroupIds,
            enableDeletionProtection: args.enableDeletionProtection ?? true,
            enableHttp2: args.enableHttp2 ?? true,
            enableWafFailOpen: args.enableWafFailOpen ?? false,
            idleTimeout: args.idleTimeout || 60,
            accessLogs: args.accessLogs,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:lb:AlbListenerComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        // Convert defaultActions to the format expected by aws.lb.Listener
        const defaultActions = args.defaultActions.map(action => {
            const baseAction = {
                type: action.type,
            };
            switch (action.type) {
                case 'forward':
                    baseAction.targetGroupArn = action.targetGroupArn;
                    break;
                case 'redirect':
                    baseAction.redirect = action.redirect;
                    break;
                case 'fixed-response':
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
            sslPolicy: args.sslPolicy ||
                (args.protocol === 'HTTPS'
                    ? 'ELBSecurityPolicy-TLS-1-2-2017-01'
                    : undefined),
            defaultActions: defaultActions,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:lb:HttpsAlbComponent', name, {}, opts);
        // Create ALB
        const albComponent = new AlbComponent(name, {
            name: args.name,
            loadBalancerType: 'application',
            internal: false, // Changed from scheme: "internet-facing"
            subnetIds: args.subnetIds,
            securityGroupIds: args.securityGroupIds,
            enableDeletionProtection: true,
            enableHttp2: true,
            accessLogs: args.accessLogs,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
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
            protocol: 'HTTPS',
            certificateArn: args.certificateArn,
            sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
            defaultActions: args.targetGroupArn
                ? [
                    {
                        type: 'forward',
                        targetGroupArn: args.targetGroupArn,
                    },
                ]
                : [
                    {
                        type: 'fixed-response',
                        fixedResponse: {
                            contentType: 'text/plain',
                            messageBody: 'Service Temporarily Unavailable',
                            statusCode: '503',
                        },
                    },
                ],
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.httpsListener = httpsListenerComponent.listener;
        // Create HTTP listener for redirect to HTTPS
        const httpListenerComponent = new AlbListenerComponent(`${name}-http`, {
            name: `${args.name}-http`,
            loadBalancerArn: this.loadBalancerArn,
            port: 80,
            protocol: 'HTTP',
            defaultActions: [
                {
                    type: 'redirect',
                    redirect: {
                        protocol: 'HTTPS',
                        port: '443',
                        statusCode: 'HTTP_301',
                    },
                },
            ],
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
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
// NEW: HTTP-only ALB Component
class HttpAlbComponent extends pulumi.ComponentResource {
    loadBalancer;
    httpListener;
    loadBalancerId;
    loadBalancerArn;
    dnsName;
    zoneId;
    constructor(name, args, opts) {
        super('aws:lb:HttpAlbComponent', name, {}, opts);
        // Create ALB
        const albComponent = new AlbComponent(name, {
            name: args.name,
            loadBalancerType: 'application',
            internal: false,
            subnetIds: args.subnetIds,
            securityGroupIds: args.securityGroupIds,
            enableDeletionProtection: true,
            enableHttp2: true,
            accessLogs: args.accessLogs,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.loadBalancer = albComponent.loadBalancer;
        this.loadBalancerId = albComponent.loadBalancerId;
        this.loadBalancerArn = albComponent.loadBalancerArn;
        this.dnsName = albComponent.dnsName;
        this.zoneId = albComponent.zoneId;
        // Create HTTP listener only
        const httpListenerComponent = new AlbListenerComponent(`${name}-http`, {
            name: `${args.name}-http`,
            loadBalancerArn: this.loadBalancerArn,
            port: 80,
            protocol: 'HTTP',
            defaultActions: args.targetGroupArn
                ? [
                    {
                        type: 'forward',
                        targetGroupArn: args.targetGroupArn,
                    },
                ]
                : [
                    {
                        type: 'fixed-response',
                        fixedResponse: {
                            contentType: 'text/plain',
                            messageBody: 'Service Available via HTTP',
                            statusCode: '200',
                        },
                    },
                ],
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.httpListener = httpListenerComponent.listener;
        this.registerOutputs({
            loadBalancer: this.loadBalancer,
            httpListener: this.httpListener,
            loadBalancerId: this.loadBalancerId,
            loadBalancerArn: this.loadBalancerArn,
            dnsName: this.dnsName,
            zoneId: this.zoneId,
        });
    }
}
exports.HttpAlbComponent = HttpAlbComponent;
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
function createHttpsAlb(name, args, opts) {
    const httpsAlbComponent = new HttpsAlbComponent(name, args, opts);
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
// NEW: HTTP-only ALB function
function createHttpAlb(name, args, opts) {
    const httpAlbComponent = new HttpAlbComponent(name, args, opts);
    return {
        loadBalancer: httpAlbComponent.loadBalancer,
        httpListener: httpAlbComponent.httpListener,
        loadBalancerId: httpAlbComponent.loadBalancerId,
        loadBalancerArn: httpAlbComponent.loadBalancerArn,
        dnsName: httpAlbComponent.dnsName,
        zoneId: httpAlbComponent.zoneId,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxiLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYWxiLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJhQSw4QkFTQztBQUVELDhDQVNDO0FBRUQsd0NBZUM7QUFHRCxzQ0FjQztBQWplRCx1REFBeUM7QUFDekMsaURBQW1DO0FBZ0huQyxNQUFhLFlBQWEsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3hDLFlBQVksQ0FBc0I7SUFDbEMsY0FBYyxDQUF3QjtJQUN0QyxlQUFlLENBQXdCO0lBQ3ZDLE9BQU8sQ0FBd0I7SUFDL0IsTUFBTSxDQUF3QjtJQUU5QyxZQUNFLElBQVksRUFDWixJQUFhLEVBQ2IsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFN0MsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FDekMsR0FBRyxJQUFJLE1BQU0sRUFDYjtZQUNFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxhQUFhO1lBQ3hELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLEtBQUssRUFBRSxrQ0FBa0M7WUFDcEUsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3ZCLGNBQWMsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ3JDLHdCQUF3QixFQUFFLElBQUksQ0FBQyx3QkFBd0IsSUFBSSxJ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QUFFLGdCQUFnQixDQUFDLFlBQVk7UUFDM0MsWUFBWSxFQUFFLGdCQUFnQixDQUFDLFlBQVk7UUFDM0MsY0FBYyxFQUFFLGdCQUFnQixDQUFDLGNBQWM7UUFDL0MsZUFBZSxFQUFFLGdCQUFnQixDQUFDLGVBQWU7UUFDakQsT0FBTyxFQUFFLGdCQUFnQixDQUFDLE9BQU87UUFDakMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLE1BQU07S0FDaEMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBBbGJBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBsb2FkQmFsYW5jZXJUeXBlPzogJ2FwcGxpY2F0aW9uJyB8ICduZXR3b3JrJyB8ICdnYXRld2F5JztcbiAgaW50ZXJuYWw/OiBib29sZWFuOyAvLyBDaGFuZ2VkIGZyb20gc2NoZW1lIHRvIGludGVybmFsIGJvb2xlYW5cbiAgc3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICBzZWN1cml0eUdyb3VwSWRzPzogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgZW5hYmxlRGVsZXRpb25Qcm90ZWN0aW9uPzogYm9vbGVhbjtcbiAgZW5hYmxlSHR0cDI/OiBib29sZWFuO1xuICBlbmFibGVXYWZGYWlsT3Blbj86IGJvb2xlYW47XG4gIGlkbGVUaW1lb3V0PzogbnVtYmVyO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgYWNjZXNzTG9ncz86IHtcbiAgICBidWNrZXQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHByZWZpeD86IHN0cmluZztcbiAgICBlbmFibGVkPzogYm9vbGVhbjtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbGJSZXN1bHQge1xuICBsb2FkQmFsYW5jZXI6IGF3cy5sYi5Mb2FkQmFsYW5jZXI7XG4gIGxvYWRCYWxhbmNlcklkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGxvYWRCYWxhbmNlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBkbnNOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHpvbmVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFsYkxpc3RlbmVyQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgbG9hZEJhbGFuY2VyQXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcG9ydDogbnVtYmVyO1xuICBwcm90b2NvbDogJ0hUVFAnIHwgJ0hUVFBTJyB8ICdUQ1AnIHwgJ1RMUycgfCAnVURQJyB8ICdUQ1BfVURQJyB8ICdHRU5FVkUnO1xuICBjZXJ0aWZpY2F0ZUFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBzc2xQb2xpY3k/OiBzdHJpbmc7XG4gIGRlZmF1bHRBY3Rpb25zOiBBcnJheTx7XG4gICAgdHlwZTpcbiAgICAgIHwgJ2ZvcndhcmQnXG4gICAgICB8ICdyZWRpcmVjdCdcbiAgICAgIHwgJ2ZpeGVkLXJlc3BvbnNlJ1xuICAgICAgfCAnYXV0aGVudGljYXRlLWNvZ25pdG8nXG4gICAgICB8ICdhdXRoZW50aWNhdGUtb2lkYyc7XG4gICAgdGFyZ2V0R3JvdXBBcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICByZWRpcmVjdD86IHtcbiAgICAgIHByb3RvY29sPzogc3RyaW5nO1xuICAgICAgcG9ydD86IHN0cmluZztcbiAgICAgIGhvc3Q/OiBzdHJpbmc7XG4gICAgICBwYXRoPzogc3RyaW5nO1xuICAgICAgcXVlcnk/OiBzdHJpbmc7XG4gICAgICBzdGF0dXNDb2RlOiAnSFRUUF8zMDEnIHwgJ0hUVFBfMzAyJztcbiAgICB9O1xuICAgIGZpeGVkUmVzcG9uc2U/OiB7XG4gICAgICBjb250ZW50VHlwZTogc3RyaW5nO1xuICAgICAgbWVzc2FnZUJvZHk/OiBzdHJpbmc7XG4gICAgICBzdGF0dXNDb2RlOiBzdHJpbmc7XG4gICAgfTtcbiAgfT47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFsYkxpc3RlbmVyUmVzdWx0IHtcbiAgbGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjtcbiAgbGlzdGVuZXJBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIdHRwc0FsYkFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHN1Ym5ldElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgc2VjdXJpdHlHcm91cElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgY2VydGlmaWNhdGVBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YXJnZXRHcm91cEFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgYWNjZXNzTG9ncz86IHtcbiAgICBidWNrZXQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHByZWZpeD86IHN0cmluZztcbiAgICBlbmFibGVkPzogYm9vbGVhbjtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIdHRwc0FsYlJlc3VsdCB7XG4gIGxvYWRCYWxhbmNlcjogYXdzLmxiLkxvYWRCYWxhbmNlcjtcbiAgaHR0cHNMaXN0ZW5lcjogYXdzLmxiLkxpc3RlbmVyO1xuICBodHRwTGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjsgLy8gRm9yIHJlZGlyZWN0IHRvIEhUVFBTXG4gIGxvYWRCYWxhbmNlcklkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGxvYWRCYWxhbmNlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBkbnNOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHpvbmVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG4vLyBORVc6IEhUVFAtb25seSBBTEIgaW50ZXJmYWNlc1xuZXhwb3J0IGludGVyZmFjZSBIdHRwQWxiQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgc3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICBzZWN1cml0eUdyb3VwSWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICB0YXJnZXRHcm91cEFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgYWNjZXNzTG9ncz86IHtcbiAgICBidWNrZXQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHByZWZpeD86IHN0cmluZztcbiAgICBlbmFibGVkPzogYm9vbGVhbjtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBIdHRwQWxiUmVzdWx0IHtcbiAgbG9hZEJhbGFuY2VyOiBhd3MubGIuTG9hZEJhbGFuY2VyO1xuICBodHRwTGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjtcbiAgbG9hZEJhbGFuY2VySWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgbG9hZEJhbGFuY2VyQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGRuc05hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgem9uZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBBbGJDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgbG9hZEJhbGFuY2VyOiBhd3MubGIuTG9hZEJhbGFuY2VyO1xuICBwdWJsaWMgcmVhZG9ubHkgbG9hZEJhbGFuY2VySWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGxvYWRCYWxhbmNlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZG5zTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgem9uZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEFsYkFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpsYjpBbGJDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICB0aGlzLmxvYWRCYWxhbmNlciA9IG5ldyBhd3MubGIuTG9hZEJhbGFuY2VyKFxuICAgICAgYCR7bmFtZX0tYWxiYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICBsb2FkQmFsYW5jZXJUeXBlOiBhcmdzLmxvYWRCYWxhbmNlclR5cGUgfHwgJ2FwcGxpY2F0aW9uJyxcbiAgICAgICAgaW50ZXJuYWw6IGFyZ3MuaW50ZXJuYWwgPz8gZmFsc2UsIC8vIENoYW5nZWQgZnJvbSBzY2hlbWUgdG8gaW50ZXJuYWxcbiAgICAgICAgc3VibmV0czogYXJncy5zdWJuZXRJZHMsXG4gICAgICAgIHNlY3VyaXR5R3JvdXBzOiBhcmdzLnNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgIGVuYWJsZURlbGV0aW9uUHJvdGVjdGlvbjogYXJncy5lbmFibGVEZWxldGlvblByb3RlY3Rpb24gPz8gdHJ1ZSxcbiAgICAgICAgZW5hYmxlSHR0cDI6IGFyZ3MuZW5hYmxlSHR0cDIgPz8gdHJ1ZSxcbiAgICAgICAgZW5hYmxlV2FmRmFpbE9wZW46IGFyZ3MuZW5hYmxlV2FmRmFpbE9wZW4gPz8gZmFsc2UsXG4gICAgICAgIGlkbGVUaW1lb3V0OiBhcmdzLmlkbGVUaW1lb3V0IHx8IDYwLFxuICAgICAgICBhY2Nlc3NMb2dzOiBhcmdzLmFjY2Vzc0xvZ3MsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmxvYWRCYWxhbmNlcklkID0gdGhpcy5sb2FkQmFsYW5jZXIuaWQ7XG4gICAgdGhpcy5sb2FkQmFsYW5jZXJBcm4gPSB0aGlzLmxvYWRCYWxhbmNlci5hcm47XG4gICAgdGhpcy5kbnNOYW1lID0gdGhpcy5sb2FkQmFsYW5jZXIuZG5zTmFtZTtcbiAgICB0aGlzLnpvbmVJZCA9IHRoaXMubG9hZEJhbGFuY2VyLnpvbmVJZDtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGxvYWRCYWxhbmNlcjogdGhpcy5sb2FkQmFsYW5jZXIsXG4gICAgICBsb2FkQmFsYW5jZXJJZDogdGhpcy5sb2FkQmFsYW5jZXJJZCxcbiAgICAgIGxvYWRCYWxhbmNlckFybjogdGhpcy5sb2FkQmFsYW5jZXJBcm4sXG4gICAgICBkbnNOYW1lOiB0aGlzLmRuc05hbWUsXG4gICAgICB6b25lSWQ6IHRoaXMuem9uZUlkLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBbGJMaXN0ZW5lckNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBsaXN0ZW5lcjogYXdzLmxiLkxpc3RlbmVyO1xuICBwdWJsaWMgcmVhZG9ubHkgbGlzdGVuZXJBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogQWxiTGlzdGVuZXJBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6bGI6QWxiTGlzdGVuZXJDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICAvLyBDb252ZXJ0IGRlZmF1bHRBY3Rpb25zIHRvIHRoZSBmb3JtYXQgZXhwZWN0ZWQgYnkgYXdzLmxiLkxpc3RlbmVyXG4gICAgY29uc3QgZGVmYXVsdEFjdGlvbnMgPSBhcmdzLmRlZmF1bHRBY3Rpb25zLm1hcChhY3Rpb24gPT4ge1xuICAgICAgY29uc3QgYmFzZUFjdGlvbjogYW55ID0ge1xuICAgICAgICB0eXBlOiBhY3Rpb24udHlwZSxcbiAgICAgIH07XG5cbiAgICAgIHN3aXRjaCAoYWN0aW9uLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnZm9yd2FyZCc6XG4gICAgICAgICAgYmFzZUFjdGlvbi50YXJnZXRHcm91cEFybiA9IGFjdGlvbi50YXJnZXRHcm91cEFybjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVkaXJlY3QnOlxuICAgICAgICAgIGJhc2VBY3Rpb24ucmVkaXJlY3QgPSBhY3Rpb24ucmVkaXJlY3Q7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2ZpeGVkLXJlc3BvbnNlJzpcbiAgICAgICAgICBiYXNlQWN0aW9uLmZpeGVkUmVzcG9uc2UgPSBhY3Rpb24uZml4ZWRSZXNwb25zZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGJhc2VBY3Rpb247XG4gICAgfSk7XG5cbiAgICB0aGlzLmxpc3RlbmVyID0gbmV3IGF3cy5sYi5MaXN0ZW5lcihcbiAgICAgIGAke25hbWV9LWxpc3RlbmVyYCxcbiAgICAgIHtcbiAgICAgICAgbG9hZEJhbGFuY2VyQXJuOiBhcmdzLmxvYWRCYWxhbmNlckFybixcbiAgICAgICAgcG9ydDogYXJncy5wb3J0LFxuICAgICAgICBwcm90b2NvbDogYXJncy5wcm90b2NvbCxcbiAgICAgICAgY2VydGlmaWNhdGVBcm46IGFyZ3MuY2VydGlmaWNhdGVBcm4sXG4gICAgICAgIHNzbFBvbGljeTpcbiAgICAgICAgICBhcmdzLnNzbFBvbGljeSB8fFxuICAgICAgICAgIChhcmdzLnByb3RvY29sID09PSAnSFRUUFMnXG4gICAgICAgICAgICA/ICdFTEJTZWN1cml0eVBvbGljeS1UTFMtMS0yLTIwMTctMDEnXG4gICAgICAgICAgICA6IHVuZGVmaW5lZCksXG4gICAgICAgIGRlZmF1bHRBY3Rpb25zOiBkZWZhdWx0QWN0aW9ucyxcbiAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMubGlzdGVuZXJBcm4gPSB0aGlzLmxpc3RlbmVyLmFybjtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGxpc3RlbmVyOiB0aGlzLmxpc3RlbmVyLFxuICAgICAgbGlzdGVuZXJBcm46IHRoaXMubGlzdGVuZXJBcm4sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEh0dHBzQWxiQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGxvYWRCYWxhbmNlcjogYXdzLmxiLkxvYWRCYWxhbmNlcjtcbiAgcHVibGljIHJlYWRvbmx5IGh0dHBzTGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjtcbiAgcHVibGljIHJlYWRvbmx5IGh0dHBMaXN0ZW5lcjogYXdzLmxiLkxpc3RlbmVyO1xuICBwdWJsaWMgcmVhZG9ubHkgbG9hZEJhbGFuY2VySWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGxvYWRCYWxhbmNlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZG5zTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgem9uZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEh0dHBzQWxiQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmxiOkh0dHBzQWxiQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIEFMQlxuICAgIGNvbnN0IGFsYkNvbXBvbmVudCA9IG5ldyBBbGJDb21wb25lbnQoXG4gICAgICBuYW1lLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIGxvYWRCYWxhbmNlclR5cGU6ICdhcHBsaWNhdGlvbicsXG4gICAgICAgIGludGVybmFsOiBmYWxzZSwgLy8gQ2hhbmdlZCBmcm9tIHNjaGVtZTogXCJpbnRlcm5ldC1mYWNpbmdcIlxuICAgICAgICBzdWJuZXRJZHM6IGFyZ3Muc3VibmV0SWRzLFxuICAgICAgICBzZWN1cml0eUdyb3VwSWRzOiBhcmdzLnNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgIGVuYWJsZURlbGV0aW9uUHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgZW5hYmxlSHR0cDI6IHRydWUsXG4gICAgICAgIGFjY2Vzc0xvZ3M6IGFyZ3MuYWNjZXNzTG9ncyxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmxvYWRCYWxhbmNlciA9IGFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXI7XG4gICAgdGhpcy5sb2FkQmFsYW5jZXJJZCA9IGFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXJJZDtcbiAgICB0aGlzLmxvYWRCYWxhbmNlckFybiA9IGFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXJBcm47XG4gICAgdGhpcy5kbnNOYW1lID0gYWxiQ29tcG9uZW50LmRuc05hbWU7XG4gICAgdGhpcy56b25lSWQgPSBhbGJDb21wb25lbnQuem9uZUlkO1xuXG4gICAgLy8gQ3JlYXRlIEhUVFBTIGxpc3RlbmVyXG4gICAgY29uc3QgaHR0cHNMaXN0ZW5lckNvbXBvbmVudCA9IG5ldyBBbGJMaXN0ZW5lckNvbXBvbmVudChcbiAgICAgIGAke25hbWV9LWh0dHBzYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1odHRwc2AsXG4gICAgICAgIGxvYWRCYWxhbmNlckFybjogdGhpcy5sb2FkQmFsYW5jZXJBcm4sXG4gICAgICAgIHBvcnQ6IDQ0MyxcbiAgICAgICAgcHJvdG9jb2w6ICdIVFRQUycsXG4gICAgICAgIGNlcnRpZmljYXRlQXJuOiBhcmdzLmNlcnRpZmljYXRlQXJuLFxuICAgICAgICBzc2xQb2xpY3k6ICdFTEJTZWN1cml0eVBvbGljeS1UTFMtMS0yLTIwMTctMDEnLFxuICAgICAgICBkZWZhdWx0QWN0aW9uczogYXJncy50YXJnZXRHcm91cEFyblxuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ZvcndhcmQnLFxuICAgICAgICAgICAgICAgIHRhcmdldEdyb3VwQXJuOiBhcmdzLnRhcmdldEdyb3VwQXJuLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2ZpeGVkLXJlc3BvbnNlJyxcbiAgICAgICAgICAgICAgICBmaXhlZFJlc3BvbnNlOiB7XG4gICAgICAgICAgICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvcGxhaW4nLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZUJvZHk6ICdTZXJ2aWNlIFRlbXBvcmFyaWx5IFVuYXZhaWxhYmxlJyxcbiAgICAgICAgICAgICAgICAgIHN0YXR1c0NvZGU6ICc1MDMnLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMuaHR0cHNMaXN0ZW5lciA9IGh0dHBzTGlzdGVuZXJDb21wb25lbnQubGlzdGVuZXI7XG5cbiAgICAvLyBDcmVhdGUgSFRUUCBsaXN0ZW5lciBmb3IgcmVkaXJlY3QgdG8gSFRUUFNcbiAgICBjb25zdCBodHRwTGlzdGVuZXJDb21wb25lbnQgPSBuZXcgQWxiTGlzdGVuZXJDb21wb25lbnQoXG4gICAgICBgJHtuYW1lfS1odHRwYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1odHRwYCxcbiAgICAgICAgbG9hZEJhbGFuY2VyQXJuOiB0aGlzLmxvYWRCYWxhbmNlckFybixcbiAgICAgICAgcG9ydDogODAsXG4gICAgICAgIHByb3RvY29sOiAnSFRUUCcsXG4gICAgICAgIGRlZmF1bHRBY3Rpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ3JlZGlyZWN0JyxcbiAgICAgICAgICAgIHJlZGlyZWN0OiB7XG4gICAgICAgICAgICAgIHByb3RvY29sOiAnSFRUUFMnLFxuICAgICAgICAgICAgICBwb3J0OiAnNDQzJyxcbiAgICAgICAgICAgICAgc3RhdHVzQ29kZTogJ0hUVFBfMzAxJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmh0dHBMaXN0ZW5lciA9IGh0dHBMaXN0ZW5lckNvbXBvbmVudC5saXN0ZW5lcjtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGxvYWRCYWxhbmNlcjogdGhpcy5sb2FkQmFsYW5jZXIsXG4gICAgICBodHRwc0xpc3RlbmVyOiB0aGlzLmh0dHBzTGlzdGVuZXIsXG4gICAgICBodHRwTGlzdGVuZXI6IHRoaXMuaHR0cExpc3RlbmVyLFxuICAgICAgbG9hZEJhbGFuY2VySWQ6IHRoaXMubG9hZEJhbGFuY2VySWQsXG4gICAgICBsb2FkQmFsYW5jZXJBcm46IHRoaXMubG9hZEJhbGFuY2VyQXJuLFxuICAgICAgZG5zTmFtZTogdGhpcy5kbnNOYW1lLFxuICAgICAgem9uZUlkOiB0aGlzLnpvbmVJZCxcbiAgICB9KTtcbiAgfVxufVxuXG4vLyBORVc6IEhUVFAtb25seSBBTEIgQ29tcG9uZW50XG5leHBvcnQgY2xhc3MgSHR0cEFsYkNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXI6IGF3cy5sYi5Mb2FkQmFsYW5jZXI7XG4gIHB1YmxpYyByZWFkb25seSBodHRwTGlzdGVuZXI6IGF3cy5sYi5MaXN0ZW5lcjtcbiAgcHVibGljIHJlYWRvbmx5IGxvYWRCYWxhbmNlcklkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBsb2FkQmFsYW5jZXJBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRuc05hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHpvbmVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBIdHRwQWxiQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmxiOkh0dHBBbGJDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBDcmVhdGUgQUxCXG4gICAgY29uc3QgYWxiQ29tcG9uZW50ID0gbmV3IEFsYkNvbXBvbmVudChcbiAgICAgIG5hbWUsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgbG9hZEJhbGFuY2VyVHlwZTogJ2FwcGxpY2F0aW9uJyxcbiAgICAgICAgaW50ZXJuYWw6IGZhbHNlLFxuICAgICAgICBzdWJuZXRJZHM6IGFyZ3Muc3VibmV0SWRzLFxuICAgICAgICBzZWN1cml0eUdyb3VwSWRzOiBhcmdzLnNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgIGVuYWJsZURlbGV0aW9uUHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgZW5hYmxlSHR0cDI6IHRydWUsXG4gICAgICAgIGFjY2Vzc0xvZ3M6IGFyZ3MuYWNjZXNzTG9ncyxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmxvYWRCYWxhbmNlciA9IGFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXI7XG4gICAgdGhpcy5sb2FkQmFsYW5jZXJJZCA9IGFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXJJZDtcbiAgICB0aGlzLmxvYWRCYWxhbmNlckFybiA9IGFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXJBcm47XG4gICAgdGhpcy5kbnNOYW1lID0gYWxiQ29tcG9uZW50LmRuc05hbWU7XG4gICAgdGhpcy56b25lSWQgPSBhbGJDb21wb25lbnQuem9uZUlkO1xuXG4gICAgLy8gQ3JlYXRlIEhUVFAgbGlzdGVuZXIgb25seVxuICAgIGNvbnN0IGh0dHBMaXN0ZW5lckNvbXBvbmVudCA9IG5ldyBBbGJMaXN0ZW5lckNvbXBvbmVudChcbiAgICAgIGAke25hbWV9LWh0dHBgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHthcmdzLm5hbWV9LWh0dHBgLFxuICAgICAgICBsb2FkQmFsYW5jZXJBcm46IHRoaXMubG9hZEJhbGFuY2VyQXJuLFxuICAgICAgICBwb3J0OiA4MCxcbiAgICAgICAgcHJvdG9jb2w6ICdIVFRQJyxcbiAgICAgICAgZGVmYXVsdEFjdGlvbnM6IGFyZ3MudGFyZ2V0R3JvdXBBcm5cbiAgICAgICAgICA/IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdmb3J3YXJkJyxcbiAgICAgICAgICAgICAgICB0YXJnZXRHcm91cEFybjogYXJncy50YXJnZXRHcm91cEFybixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICA6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdmaXhlZC1yZXNwb25zZScsXG4gICAgICAgICAgICAgICAgZml4ZWRSZXNwb25zZToge1xuICAgICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICd0ZXh0L3BsYWluJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2VCb2R5OiAnU2VydmljZSBBdmFpbGFibGUgdmlhIEhUVFAnLFxuICAgICAgICAgICAgICAgICAgc3RhdHVzQ29kZTogJzIwMCcsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5odHRwTGlzdGVuZXIgPSBodHRwTGlzdGVuZXJDb21wb25lbnQubGlzdGVuZXI7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBsb2FkQmFsYW5jZXI6IHRoaXMubG9hZEJhbGFuY2VyLFxuICAgICAgaHR0cExpc3RlbmVyOiB0aGlzLmh0dHBMaXN0ZW5lcixcbiAgICAgIGxvYWRCYWxhbmNlcklkOiB0aGlzLmxvYWRCYWxhbmNlcklkLFxuICAgICAgbG9hZEJhbGFuY2VyQXJuOiB0aGlzLmxvYWRCYWxhbmNlckFybixcbiAgICAgIGRuc05hbWU6IHRoaXMuZG5zTmFtZSxcbiAgICAgIHpvbmVJZDogdGhpcy56b25lSWQsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFsYihuYW1lOiBzdHJpbmcsIGFyZ3M6IEFsYkFyZ3MpOiBBbGJSZXN1bHQge1xuICBjb25zdCBhbGJDb21wb25lbnQgPSBuZXcgQWxiQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICByZXR1cm4ge1xuICAgIGxvYWRCYWxhbmNlcjogYWxiQ29tcG9uZW50LmxvYWRCYWxhbmNlcixcbiAgICBsb2FkQmFsYW5jZXJJZDogYWxiQ29tcG9uZW50LmxvYWRCYWxhbmNlcklkLFxuICAgIGxvYWRCYWxhbmNlckFybjogYWxiQ29tcG9uZW50LmxvYWRCYWxhbmNlckFybixcbiAgICBkbnNOYW1lOiBhbGJDb21wb25lbnQuZG5zTmFtZSxcbiAgICB6b25lSWQ6IGFsYkNvbXBvbmVudC56b25lSWQsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBbGJMaXN0ZW5lcihcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBBbGJMaXN0ZW5lckFyZ3Ncbik6IEFsYkxpc3RlbmVyUmVzdWx0IHtcbiAgY29uc3QgbGlzdGVuZXJDb21wb25lbnQgPSBuZXcgQWxiTGlzdGVuZXJDb21wb25lbnQobmFtZSwgYXJncyk7XG4gIHJldHVybiB7XG4gICAgbGlzdGVuZXI6IGxpc3RlbmVyQ29tcG9uZW50Lmxpc3RlbmVyLFxuICAgIGxpc3RlbmVyQXJuOiBsaXN0ZW5lckNvbXBvbmVudC5saXN0ZW5lckFybixcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUh0dHBzQWxiKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IEh0dHBzQWxiQXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IEh0dHBzQWxiUmVzdWx0IHtcbiAgY29uc3QgaHR0cHNBbGJDb21wb25lbnQgPSBuZXcgSHR0cHNBbGJDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgbG9hZEJhbGFuY2VyOiBodHRwc0FsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXIsXG4gICAgaHR0cHNMaXN0ZW5lcjogaHR0cHNBbGJDb21wb25lbnQuaHR0cHNMaXN0ZW5lcixcbiAgICBodHRwTGlzdGVuZXI6IGh0dHBzQWxiQ29tcG9uZW50Lmh0dHBMaXN0ZW5lcixcbiAgICBsb2FkQmFsYW5jZXJJZDogaHR0cHNBbGJDb21wb25lbnQubG9hZEJhbGFuY2VySWQsXG4gICAgbG9hZEJhbGFuY2VyQXJuOiBodHRwc0FsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXJBcm4sXG4gICAgZG5zTmFtZTogaHR0cHNBbGJDb21wb25lbnQuZG5zTmFtZSxcbiAgICB6b25lSWQ6IGh0dHBzQWxiQ29tcG9uZW50LnpvbmVJZCxcbiAgfTtcbn1cblxuLy8gTkVXOiBIVFRQLW9ubHkgQUxCIGZ1bmN0aW9uXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSHR0cEFsYihcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBIdHRwQWxiQXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IEh0dHBBbGJSZXN1bHQge1xuICBjb25zdCBodHRwQWxiQ29tcG9uZW50ID0gbmV3IEh0dHBBbGJDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgbG9hZEJhbGFuY2VyOiBodHRwQWxiQ29tcG9uZW50LmxvYWRCYWxhbmNlcixcbiAgICBodHRwTGlzdGVuZXI6IGh0dHBBbGJDb21wb25lbnQuaHR0cExpc3RlbmVyLFxuICAgIGxvYWRCYWxhbmNlcklkOiBodHRwQWxiQ29tcG9uZW50LmxvYWRCYWxhbmNlcklkLFxuICAgIGxvYWRCYWxhbmNlckFybjogaHR0cEFsYkNvbXBvbmVudC5sb2FkQmFsYW5jZXJBcm4sXG4gICAgZG5zTmFtZTogaHR0cEFsYkNvbXBvbmVudC5kbnNOYW1lLFxuICAgIHpvbmVJZDogaHR0cEFsYkNvbXBvbmVudC56b25lSWQsXG4gIH07XG59XG4iXX0=