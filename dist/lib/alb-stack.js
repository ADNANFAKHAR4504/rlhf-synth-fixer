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
exports.AlbStack = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class AlbStack extends pulumi.ComponentResource {
    albArn;
    albDns;
    constructor(name, args, opts) {
        super('tap:alb:AlbStack', name, args, opts);
        // Create Security Group for ALB
        const albSecurityGroup = new aws.ec2.SecurityGroup(`${name}-alb-sg-${args.environmentSuffix}`, {
            vpcId: args.vpcId,
            description: 'Security group for Application Load Balancer',
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'Allow HTTP from anywhere',
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                },
            ],
            tags: {
                Name: `${name}-alb-sg-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this });
        // Create S3 bucket for ALB access logs
        const albLogBucket = new aws.s3.Bucket(`${name}-alb-logs-${args.environmentSuffix}`, {
            acl: 'private',
            lifecycleRules: [
                {
                    enabled: true,
                    expiration: {
                        days: 30,
                    },
                },
            ],
            tags: {
                Name: `${name}-alb-logs-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this });
        // Get AWS ELB service account for the region
        const elbServiceAccount = aws.elb.getServiceAccount({});
        new aws.s3.BucketPolicy(`${name}-alb-log-policy-${args.environmentSuffix}`, {
            bucket: albLogBucket.id,
            policy: pulumi
                .all([albLogBucket.arn, elbServiceAccount])
                .apply(([bucketArn, account]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            AWS: account.arn,
                        },
                        Action: 's3:PutObject',
                        Resource: `${bucketArn}/*`,
                    },
                ],
            })),
        }, { parent: this });
        // Create Application Load Balancer with access logs
        const alb = new aws.lb.LoadBalancer(`${name}-alb-${args.environmentSuffix}`, {
            name: `${name}-alb-${args.environmentSuffix}`.substring(0, 32), // ALB name limited to 32 chars
            internal: false,
            loadBalancerType: 'application',
            securityGroups: [albSecurityGroup.id],
            subnets: args.publicSubnetIds,
            enableDeletionProtection: false,
            enableHttp2: true,
            enableCrossZoneLoadBalancing: true,
            accessLogs: {
                bucket: albLogBucket.bucket,
                enabled: true,
                prefix: 'alb-logs',
            },
            tags: {
                Name: `${name}-alb-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this, dependsOn: [albLogBucket] });
        // Create ALB listener
        new aws.lb.Listener(`${name}-listener-${args.environmentSuffix}`, {
            loadBalancerArn: alb.arn,
            port: 80,
            protocol: 'HTTP',
            defaultActions: [
                {
                    type: 'forward',
                    targetGroupArn: args.targetGroupArn,
                },
            ],
            tags: args.tags,
        }, { parent: this });
        this.albArn = alb.arn;
        this.albDns = alb.dnsName;
        this.registerOutputs({
            albArn: this.albArn,
            albDns: this.albDns,
        });
    }
}
exports.AlbStack = AlbStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxiLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2FsYi1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1REFBeUM7QUFDekMsaURBQW1DO0FBV25DLE1BQWEsUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsTUFBTSxDQUF3QjtJQUM5QixNQUFNLENBQXdCO0lBRTlDLFlBQVksSUFBWSxFQUFFLElBQWtCLEVBQUUsSUFBc0I7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsZ0NBQWdDO1FBQ2hDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FDaEQsR0FBRyxJQUFJLFdBQVcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQzFDO1lBQ0UsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLFdBQVcsRUFBRSw4Q0FBOEM7WUFDM0QsT0FBTyxFQUFFO2dCQUNQO29CQUNFLFFBQVEsRUFBRSxLQUFLO29CQUNmLFFBQVEsRUFBRSxFQUFFO29CQUNaLE1BQU0sRUFBRSxFQUFFO29CQUNWLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsV0FBVyxFQUFFLDBCQUEwQjtpQkFDeEM7YUFDRjtZQUNELE1BQU0sRUFBRTtnQkFDTjtvQkFDRSxRQUFRLEVBQUUsSUFBSTtvQkFDZCxRQUFRLEVBQUUsQ0FBQztvQkFDWCxNQUFNLEVBQUUsQ0FBQztvQkFDVCxVQUFVLEVBQUUsQ0FBQyxXQUFXLENBQUM7aUJBQzFCO2FBQ0Y7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLEdBQUcsSUFBSSxXQUFXLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDaEQsR0FBRyxJQUFJLENBQUMsSUFBSTthQUNiO1NBQ0YsRUFD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QUcsQ0FBQyxHQUFHO1lBQ3hCLElBQUksRUFBRSxFQUFFO1lBQ1IsUUFBUSxFQUFFLE1BQU07WUFDaEIsY0FBYyxFQUFFO2dCQUNkO29CQUNFLElBQUksRUFBRSxTQUFTO29CQUNmLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYztpQkFDcEM7YUFDRjtZQUNELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO1FBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQztRQUUxQixJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07U0FDcEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBMUlELDRCQTBJQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFsYlN0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG4gIHZwY0lkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpY1N1Ym5ldElkczogcHVsdW1pLk91dHB1dDxzdHJpbmdbXT47XG4gIHRhcmdldEdyb3VwQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBBbGJTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBhbGJBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGFsYkRuczogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogQWxiU3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDphbGI6QWxiU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIC8vIENyZWF0ZSBTZWN1cml0eSBHcm91cCBmb3IgQUxCXG4gICAgY29uc3QgYWxiU2VjdXJpdHlHcm91cCA9IG5ldyBhd3MuZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICBgJHtuYW1lfS1hbGItc2ctJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHZwY0lkOiBhcmdzLnZwY0lkLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyJyxcbiAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbGxvdyBIVFRQIGZyb20gYW55d2hlcmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGVncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAnLTEnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICAgICAgICB0b1BvcnQ6IDAsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1hbGItc2ctJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIFMzIGJ1Y2tldCBmb3IgQUxCIGFjY2VzcyBsb2dzXG4gICAgY29uc3QgYWxiTG9nQnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICBgJHtuYW1lfS1hbGItbG9ncy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYWNsOiAncHJpdmF0ZScsXG4gICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgZGF5czogMzAsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgJHtuYW1lfS1hbGItbG9ncy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBHZXQgQVdTIEVMQiBzZXJ2aWNlIGFjY291bnQgZm9yIHRoZSByZWdpb25cbiAgICBjb25zdCBlbGJTZXJ2aWNlQWNjb3VudCA9IGF3cy5lbGIuZ2V0U2VydmljZUFjY291bnQoe30pO1xuXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRQb2xpY3koXG4gICAgICBgJHtuYW1lfS1hbGItbG9nLXBvbGljeS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBhbGJMb2dCdWNrZXQuaWQsXG4gICAgICAgIHBvbGljeTogcHVsdW1pXG4gICAgICAgICAgLmFsbChbYWxiTG9nQnVja2V0LmFybiwgZWxiU2VydmljZUFjY291bnRdKVxuICAgICAgICAgIC5hcHBseSgoW2J1Y2tldEFybiwgYWNjb3VudF0pID0+XG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgIEFXUzogYWNjb3VudC5hcm4sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBgJHtidWNrZXRBcm59LypgLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlciB3aXRoIGFjY2VzcyBsb2dzXG4gICAgY29uc3QgYWxiID0gbmV3IGF3cy5sYi5Mb2FkQmFsYW5jZXIoXG4gICAgICBgJHtuYW1lfS1hbGItJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke25hbWV9LWFsYi0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YC5zdWJzdHJpbmcoMCwgMzIpLCAvLyBBTEIgbmFtZSBsaW1pdGVkIHRvIDMyIGNoYXJzXG4gICAgICAgIGludGVybmFsOiBmYWxzZSxcbiAgICAgICAgbG9hZEJhbGFuY2VyVHlwZTogJ2FwcGxpY2F0aW9uJyxcbiAgICAgICAgc2VjdXJpdHlHcm91cHM6IFthbGJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgc3VibmV0czogYXJncy5wdWJsaWNTdWJuZXRJZHMsXG4gICAgICAgIGVuYWJsZURlbGV0aW9uUHJvdGVjdGlvbjogZmFsc2UsXG4gICAgICAgIGVuYWJsZUh0dHAyOiB0cnVlLFxuICAgICAgICBlbmFibGVDcm9zc1pvbmVMb2FkQmFsYW5jaW5nOiB0cnVlLFxuICAgICAgICBhY2Nlc3NMb2dzOiB7XG4gICAgICAgICAgYnVja2V0OiBhbGJMb2dCdWNrZXQuYnVja2V0LFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgcHJlZml4OiAnYWxiLWxvZ3MnLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYCR7bmFtZX0tYWxiLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbYWxiTG9nQnVja2V0XSB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBBTEIgbGlzdGVuZXJcbiAgICBuZXcgYXdzLmxiLkxpc3RlbmVyKFxuICAgICAgYCR7bmFtZX0tbGlzdGVuZXItJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGxvYWRCYWxhbmNlckFybjogYWxiLmFybixcbiAgICAgICAgcG9ydDogODAsXG4gICAgICAgIHByb3RvY29sOiAnSFRUUCcsXG4gICAgICAgIGRlZmF1bHRBY3Rpb25zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ2ZvcndhcmQnLFxuICAgICAgICAgICAgdGFyZ2V0R3JvdXBBcm46IGFyZ3MudGFyZ2V0R3JvdXBBcm4sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5hbGJBcm4gPSBhbGIuYXJuO1xuICAgIHRoaXMuYWxiRG5zID0gYWxiLmRuc05hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBhbGJBcm46IHRoaXMuYWxiQXJuLFxuICAgICAgYWxiRG5zOiB0aGlzLmFsYkRucyxcbiAgICB9KTtcbiAgfVxufVxuIl19