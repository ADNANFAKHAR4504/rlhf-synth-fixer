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
exports.SecurityGroupStack = void 0;
/**
 * security-group-stack.ts
 *
 * This module defines the SecurityGroupStack component for creating
 * security groups with minimal and necessary access rules.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class SecurityGroupStack extends pulumi.ComponentResource {
    webSecurityGroupId;
    appSecurityGroupId;
    dbSecurityGroupId;
    constructor(name, args, opts) {
        super('tap:security:SecurityGroupStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Web tier security group
        const webSecurityGroup = new aws.ec2.SecurityGroup(`tap-web-sg-${environmentSuffix}`, {
            name: `tap-web-sg-${environmentSuffix}`,
            description: 'Security group for web tier',
            vpcId: args.vpcId,
            ingress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS from anywhere',
                },
                {
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTP from anywhere',
                },
            ],
            egress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS outbound for updates and API calls',
                },
                {
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTP outbound for package updates',
                },
                {
                    fromPort: 53,
                    toPort: 53,
                    protocol: 'udp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'DNS resolution',
                },
            ],
            tags: {
                Name: `tap-web-sg-${environmentSuffix}`,
                Tier: 'web',
                ...tags,
            },
        }, { parent: this });
        // Application tier security group
        const appSecurityGroup = new aws.ec2.SecurityGroup(`tap-app-sg-${environmentSuffix}`, {
            name: `tap-app-sg-${environmentSuffix}`,
            description: 'Security group for application tier',
            vpcId: args.vpcId,
            ingress: [
                {
                    fromPort: 8080,
                    toPort: 8080,
                    protocol: 'tcp',
                    securityGroups: [webSecurityGroup.id],
                    description: 'App port from web tier',
                },
            ],
            egress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS outbound for updates',
                },
                {
                    fromPort: 53,
                    toPort: 53,
                    protocol: 'udp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'DNS resolution',
                },
            ],
            tags: {
                Name: `tap-app-sg-${environmentSuffix}`,
                Tier: 'application',
                ...tags,
            },
        }, { parent: this });
        // Database tier security group
        const dbSecurityGroup = new aws.ec2.SecurityGroup(`tap-db-sg-${environmentSuffix}`, {
            name: `tap-db-sg-${environmentSuffix}`,
            description: 'Security group for database tier',
            vpcId: args.vpcId,
            ingress: [
                {
                    fromPort: 3306,
                    toPort: 3306,
                    protocol: 'tcp',
                    securityGroups: [appSecurityGroup.id],
                    description: 'MySQL from app tier',
                },
            ],
            egress: [
                {
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS outbound for security updates only',
                },
                {
                    fromPort: 53,
                    toPort: 53,
                    protocol: 'udp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'DNS resolution',
                },
            ],
            tags: {
                Name: `tap-db-sg-${environmentSuffix}`,
                Tier: 'database',
                ...tags,
            },
        }, { parent: this });
        this.webSecurityGroupId = webSecurityGroup.id;
        this.appSecurityGroupId = appSecurityGroup.id;
        this.dbSecurityGroupId = dbSecurityGroup.id;
        this.registerOutputs({
            webSecurityGroupId: this.webSecurityGroupId,
            appSecurityGroupId: this.appSecurityGroupId,
            dbSecurityGroupId: this.dbSecurityGroupId,
        });
    }
}
exports.SecurityGroupStack = SecurityGroupStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktZ3JvdXAtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWN1cml0eS1ncm91cC1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFTekMsTUFBYSxrQkFBbUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLGtCQUFrQixDQUF3QjtJQUMxQyxrQkFBa0IsQ0FBd0I7SUFDMUMsaUJBQWlCLENBQXdCO0lBRXpELFlBQ0UsSUFBWSxFQUNaLElBQTRCLEVBQzVCLElBQXNCO1FBRXRCLEtBQUssQ0FBQyxpQ0FBaUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTNELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMxRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUU3QiwwQkFBMEI7UUFDMUIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUNoRCxjQUFjLGlCQUFpQixFQUFFLEVBQ2pDO1lBQ0UsSUFBSSxFQUFFLGNBQWMsaUJBQWlCLEVBQUU7WUFDdkMsV0FBVyxFQUFFLDZCQUE2QjtZQUMxQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUs7WUFDakIsT0FBTyxFQUFFO2dCQUNQO29CQUNFLFFBQVEsRUFBRSxHQUFHO29CQUNiLE1BQU0sRUFBRSxHQUFHO29CQUNYLFFBQVEsRUFBRSxLQUFLO29CQUNmLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsV0FBVyxFQUFFLHFCQUFxQjtpQkFDbkM7Z0JBQ0Q7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osTUFBTSxFQUFFLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLEtBQUs7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RSxLQUFLO29CQUNmLFVBQVUsRUFBRSxDQUFDLFdBQVcsQ0FBQztvQkFDekIsV0FBVyxFQUFFLDBDQUEwQztpQkFDeEQ7Z0JBQ0Q7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osTUFBTSxFQUFFLEVBQUU7b0JBQ1YsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsVUFBVSxFQUFFLENBQUMsV0FBVyxDQUFDO29CQUN6QixXQUFXLEVBQUUsZ0JBQWdCO2lCQUM5QjthQUNGO1lBQ0QsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxhQUFhLGlCQUFpQixFQUFFO2dCQUN0QyxJQUFJLEVBQUUsVUFBVTtnQkFDaEIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxDQUFDLGtCQUFrQixHQUFHLGdCQUFnQixDQUFDLEVBQUUsQ0FBQztRQUM5QyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1FBQzlDLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxlQUFlLENBQUMsRUFBRSxDQUFDO1FBRTVDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQjtZQUMzQyxrQkFBa0IsRUFBRSxJQUFJLENBQUMsa0JBQWtCO1lBQzNDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7U0FDMUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBbEtELGdEQWtLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogc2VjdXJpdHktZ3JvdXAtc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBTZWN1cml0eUdyb3VwU3RhY2sgY29tcG9uZW50IGZvciBjcmVhdGluZ1xuICogc2VjdXJpdHkgZ3JvdXBzIHdpdGggbWluaW1hbCBhbmQgbmVjZXNzYXJ5IGFjY2VzcyBydWxlcy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJpdHlHcm91cFN0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cml0eUdyb3VwU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgd2ViU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhcHBTZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRiU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFNlY3VyaXR5R3JvdXBTdGFja0FyZ3MsXG4gICAgb3B0cz86IFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcigndGFwOnNlY3VyaXR5OlNlY3VyaXR5R3JvdXBTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzLnRhZ3MgfHwge307XG5cbiAgICAvLyBXZWIgdGllciBzZWN1cml0eSBncm91cFxuICAgIGNvbnN0IHdlYlNlY3VyaXR5R3JvdXAgPSBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYHRhcC13ZWItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLXdlYi1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIHdlYiB0aWVyJyxcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQUyBmcm9tIGFueXdoZXJlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQIGZyb20gYW55d2hlcmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGVncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICAgICAgICB0b1BvcnQ6IDQ0MyxcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hUVFBTIG91dGJvdW5kIGZvciB1cGRhdGVzIGFuZCBBUEkgY2FsbHMnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgZnJvbVBvcnQ6IDgwLFxuICAgICAgICAgICAgdG9Qb3J0OiA4MCxcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hUVFAgb3V0Ym91bmQgZm9yIHBhY2thZ2UgdXBkYXRlcycsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmcm9tUG9ydDogNTMsXG4gICAgICAgICAgICB0b1BvcnQ6IDUzLFxuICAgICAgICAgICAgcHJvdG9jb2w6ICd1ZHAnLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRE5TIHJlc29sdXRpb24nLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLXdlYi1zZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgVGllcjogJ3dlYicsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEFwcGxpY2F0aW9uIHRpZXIgc2VjdXJpdHkgZ3JvdXBcbiAgICBjb25zdCBhcHBTZWN1cml0eUdyb3VwID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIGB0YXAtYXBwLXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1hcHAtc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBhcHBsaWNhdGlvbiB0aWVyJyxcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmcm9tUG9ydDogODA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODA4MCxcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBzOiBbd2ViU2VjdXJpdHlHcm91cC5pZF0sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0FwcCBwb3J0IGZyb20gd2ViIHRpZXInLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIGVncmVzczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZyb21Qb3J0OiA0NDMsXG4gICAgICAgICAgICB0b1BvcnQ6IDQ0MyxcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hUVFBTIG91dGJvdW5kIGZvciB1cGRhdGVzJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZyb21Qb3J0OiA1MyxcbiAgICAgICAgICAgIHRvUG9ydDogNTMsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3VkcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdETlMgcmVzb2x1dGlvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtYXBwLXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBUaWVyOiAnYXBwbGljYXRpb24nLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBEYXRhYmFzZSB0aWVyIHNlY3VyaXR5IGdyb3VwXG4gICAgY29uc3QgZGJTZWN1cml0eUdyb3VwID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChcbiAgICAgIGB0YXAtZGItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWRiLXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgZGF0YWJhc2UgdGllcicsXG4gICAgICAgIHZwY0lkOiBhcmdzLnZwY0lkLFxuICAgICAgICBpbmdyZXNzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZnJvbVBvcnQ6IDMzMDYsXG4gICAgICAgICAgICB0b1BvcnQ6IDMzMDYsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwczogW2FwcFNlY3VyaXR5R3JvdXAuaWRdLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdNeVNRTCBmcm9tIGFwcCB0aWVyJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBlZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQUyBvdXRib3VuZCBmb3Igc2VjdXJpdHkgdXBkYXRlcyBvbmx5JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGZyb21Qb3J0OiA1MyxcbiAgICAgICAgICAgIHRvUG9ydDogNTMsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3VkcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdETlMgcmVzb2x1dGlvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZGItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFRpZXI6ICdkYXRhYmFzZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMud2ViU2VjdXJpdHlHcm91cElkID0gd2ViU2VjdXJpdHlHcm91cC5pZDtcbiAgICB0aGlzLmFwcFNlY3VyaXR5R3JvdXBJZCA9IGFwcFNlY3VyaXR5R3JvdXAuaWQ7XG4gICAgdGhpcy5kYlNlY3VyaXR5R3JvdXBJZCA9IGRiU2VjdXJpdHlHcm91cC5pZDtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHdlYlNlY3VyaXR5R3JvdXBJZDogdGhpcy53ZWJTZWN1cml0eUdyb3VwSWQsXG4gICAgICBhcHBTZWN1cml0eUdyb3VwSWQ6IHRoaXMuYXBwU2VjdXJpdHlHcm91cElkLFxuICAgICAgZGJTZWN1cml0eUdyb3VwSWQ6IHRoaXMuZGJTZWN1cml0eUdyb3VwSWQsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==