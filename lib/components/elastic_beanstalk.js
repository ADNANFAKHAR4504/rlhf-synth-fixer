"use strict";
/**
 * Elastic Beanstalk Infrastructure Component
 * Handles EB application, environment, and configuration
 */
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
exports.ElasticBeanstalkInfrastructure = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
const pulumi_1 = require("@pulumi/pulumi");
class ElasticBeanstalkInfrastructure extends pulumi_1.ComponentResource {
    region;
    isPrimary;
    environment;
    environmentSuffix;
    tags;
    regionSuffix;
    application;
    configTemplate;
    ebEnvironment;
    constructor(name, args, opts) {
        super('nova:infrastructure:ElasticBeanstalk', name, {}, opts);
        this.region = args.region;
        this.isPrimary = args.isPrimary;
        this.environment = args.environment;
        this.environmentSuffix = args.environmentSuffix;
        this.tags = args.tags;
        this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');
        this.application = this.createApplication();
        this.configTemplate = this.createConfigurationTemplate(args);
        this.ebEnvironment = this.createEnvironment();
        this.registerOutputs({
            applicationName: this.application.name,
            environmentName: this.ebEnvironment.name,
            environmentUrl: this.ebEnvironment.endpointUrl,
            environmentCname: this.ebEnvironment.cname,
        });
    }
    /**
     * Create Elastic Beanstalk Application
     */
    createApplication() {
        return new aws.elasticbeanstalk.Application(`nova-app-${this.regionSuffix}`, {
            name: `nova-app-${this.regionSuffix}`,
            description: `Nova application for ${this.region}`,
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Create Configuration Template
     */
    createConfigurationTemplate(args) {
        // Convert subnet arrays to comma-separated strings
        const publicSubnetsString = pulumi
            .all(args.publicSubnetIds)
            .apply(subnets => subnets.join(','));
        const privateSubnetsString = pulumi
            .all(args.privateSubnetIds)
            .apply(subnets => subnets.join(','));
        return new aws.elasticbeanstalk.ConfigurationTemplate(`nova-config-${this.regionSuffix}`, {
            name: `nova-config-${this.regionSuffix}`,
            application: this.application.name,
            solutionStackName: '64bit Amazon Linux 2 v3.6.0 running Docker',
            settings: [
                // VPC Configuration
                {
                    namespace: 'aws:ec2:vpc',
                    name: 'VPCId',
                    value: args.vpcId,
                },
                {
                    namespace: 'aws:ec2:vpc',
                    name: 'Subnets',
                    value: privateSubnetsString,
                },
                {
                    namespace: 'aws:ec2:vpc',
                    name: 'ELBSubnets',
                    value: publicSubnetsString,
                },
                // Instance Configuration
                {
                    namespace: 'aws:autoscaling:launchconfiguration',
                    name: 'InstanceType',
                    value: 't3.medium',
                },
                {
                    namespace: 'aws:autoscaling:launchconfiguration',
                    name: 'IamInstanceProfile',
                    value: args.ebInstanceProfileName,
                },
                {
                    namespace: 'aws:autoscaling:launchconfiguration',
                    name: 'SecurityGroups',
                    value: args.ebSecurityGroupId,
                },
                // Auto Scaling Configuration
                {
                    namespace: 'aws:autoscaling:asg',
                    name: 'MinSize',
                    value: '2',
                },
                {
                    namespace: 'aws:autoscaling:asg',
                    name: 'MaxSize',
                    value: '10',
                },
                // Load Balancer Configuration
                {
                    namespace: 'aws:elasticbeanstalk:environment',
                    name: 'EnvironmentType',
                    value: 'LoadBalanced',
                },
                {
                    namespace: 'aws:elasticbeanstalk:environment',
                    name: 'LoadBalancerType',
                    value: 'application',
                },
                {
                    namespace: 'aws:elbv2:loadbalancer',
                    name: 'SecurityGroups',
                    value: args.albSecurityGroupId,
                },
                // Service Role
                {
                    namespace: 'aws:elasticbeanstalk:environment',
                    name: 'ServiceRole',
                    value: args.ebServiceRoleArn,
                },
                // Health Check Configuration
                {
                    namespace: 'aws:elasticbeanstalk:healthreporting:system',
                    name: 'SystemType',
                    value: 'enhanced',
                },
                // Rolling Updates
                {
                    namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
                    name: 'RollingUpdateEnabled',
                    value: 'true',
                },
                {
                    namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
                    name: 'MaxBatchSize',
                    value: '1',
                },
                {
                    namespace: 'aws:autoscaling:updatepolicy:rollingupdate',
                    name: 'MinInstancesInService',
                    value: '1',
                },
            ],
            // Remove tags from here - not supported in v6.22.0
        }, { parent: this });
    }
    /**
     * Create Elastic Beanstalk Environment
     */
    createEnvironment() {
        const suffix = this.randomSuffix();
        const envName = `nova-env-${this.regionSuffix}-${suffix}`;
        return new aws.elasticbeanstalk.Environment(`nova-env-${this.regionSuffix}`, {
            name: envName,
            application: this.application.name,
            templateName: this.configTemplate.name,
            tier: 'WebServer',
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Generate random suffix for unique naming
     */
    randomSuffix(length = 6) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    // Property getters for easy access
    get applicationName() {
        return this.application.name;
    }
    get environmentName() {
        return this.ebEnvironment.name;
    }
    get environmentUrl() {
        return this.ebEnvironment.endpointUrl;
    }
    get environmentCname() {
        return this.ebEnvironment.cname;
    }
}
exports.ElasticBeanstalkInfrastructure = ElasticBeanstalkInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxhc3RpY19iZWFuc3RhbGsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbGFzdGljX2JlYW5zdGFsay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1REFBeUM7QUFDekMsaURBQW1DO0FBQ25DLDJDQUl3QjtBQWlCeEIsTUFBYSw4QkFBK0IsU0FBUSwwQkFBaUI7SUFDbEQsTUFBTSxDQUFTO0lBQ2YsU0FBUyxDQUFVO0lBQ25CLFdBQVcsQ0FBUztJQUNwQixpQkFBaUIsQ0FBUztJQUMxQixJQUFJLENBQXlCO0lBQzdCLFlBQVksQ0FBUztJQUV0QixXQUFXLENBQW1DO0lBQzlDLGNBQWMsQ0FBNkM7SUFDM0QsYUFBYSxDQUFtQztJQUVoRSxZQUNFLElBQVksRUFDWixJQUF3QyxFQUN4QyxJQUErQjtRQUUvQixLQUFLLENBQUMsc0NBQXNDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU5RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDMUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNwQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQ2hELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXRFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDNUMsSUFBSSxD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QUFDO0lBRUQsSUFBVyxnQkFBZ0I7UUFDekIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztJQUNsQyxDQUFDO0NBQ0Y7QUF4TkQsd0VBd05DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBFbGFzdGljIEJlYW5zdGFsayBJbmZyYXN0cnVjdHVyZSBDb21wb25lbnRcbiAqIEhhbmRsZXMgRUIgYXBwbGljYXRpb24sIGVudmlyb25tZW50LCBhbmQgY29uZmlndXJhdGlvblxuICovXG5cbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0IHtcbiAgQ29tcG9uZW50UmVzb3VyY2UsXG4gIENvbXBvbmVudFJlc291cmNlT3B0aW9ucyxcbiAgT3V0cHV0LFxufSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmludGVyZmFjZSBFbGFzdGljQmVhbnN0YWxrSW5mcmFzdHJ1Y3R1cmVBcmdzIHtcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGlzUHJpbWFyeTogYm9vbGVhbjtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgdnBjSWQ6IE91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWNTdWJuZXRJZHM6IE91dHB1dDxzdHJpbmc+W107XG4gIHByaXZhdGVTdWJuZXRJZHM6IE91dHB1dDxzdHJpbmc+W107XG4gIGFsYlNlY3VyaXR5R3JvdXBJZDogT3V0cHV0PHN0cmluZz47XG4gIGViU2VjdXJpdHlHcm91cElkOiBPdXRwdXQ8c3RyaW5nPjtcbiAgZWJTZXJ2aWNlUm9sZUFybjogT3V0cHV0PHN0cmluZz47XG4gIGViSW5zdGFuY2VQcm9maWxlTmFtZTogT3V0cHV0PHN0cmluZz47XG4gIHRhZ3M6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBFbGFzdGljQmVhbnN0YWxrSW5mcmFzdHJ1Y3R1cmUgZXh0ZW5kcyBDb21wb25lbnRSZXNvdXJjZSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVnaW9uOiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgaXNQcmltYXJ5OiBib29sZWFuO1xuICBwcml2YXRlIHJlYWRvbmx5IGVudmlyb25tZW50OiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSB0YWdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBwcml2YXRlIHJlYWRvbmx5IHJlZ2lvblN1ZmZpeDogc3RyaW5nO1xuXG4gIHB1YmxpYyByZWFkb25seSBhcHBsaWNhdGlvbjogYXdzLmVsYXN0aWNiZWFuc3RhbGsuQXBwbGljYXRpb247XG4gIHB1YmxpYyByZWFkb25seSBjb25maWdUZW1wbGF0ZTogYXdzLmVsYXN0aWNiZWFuc3RhbGsuQ29uZmlndXJhdGlvblRlbXBsYXRlO1xuICBwdWJsaWMgcmVhZG9ubHkgZWJFbnZpcm9ubWVudDogYXdzLmVsYXN0aWNiZWFuc3RhbGsuRW52aXJvbm1lbnQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEVsYXN0aWNCZWFuc3RhbGtJbmZyYXN0cnVjdHVyZUFyZ3MsXG4gICAgb3B0cz86IENvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignbm92YTppbmZyYXN0cnVjdHVyZTpFbGFzdGljQmVhbnN0YWxrJywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgdGhpcy5yZWdpb24gPSBhcmdzLnJlZ2lvbjtcbiAgICB0aGlzLmlzUHJpbWFyeSA9IGFyZ3MuaXNQcmltYXJ5O1xuICAgIHRoaXMuZW52aXJvbm1lbnQgPSBhcmdzLmVudmlyb25tZW50O1xuICAgIHRoaXMuZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4O1xuICAgIHRoaXMudGFncyA9IGFyZ3MudGFncztcbiAgICB0aGlzLnJlZ2lvblN1ZmZpeCA9IGFyZ3MucmVnaW9uLnJlcGxhY2UoLy0vZywgJycpLnJlcGxhY2UoL2dvdi9nLCAnJyk7XG5cbiAgICB0aGlzLmFwcGxpY2F0aW9uID0gdGhpcy5jcmVhdGVBcHBsaWNhdGlvbigpO1xuICAgIHRoaXMuY29uZmlnVGVtcGxhdGUgPSB0aGlzLmNyZWF0ZUNvbmZpZ3VyYXRpb25UZW1wbGF0ZShhcmdzKTtcbiAgICB0aGlzLmViRW52aXJvbm1lbnQgPSB0aGlzLmNyZWF0ZUVudmlyb25tZW50KCk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBhcHBsaWNhdGlvbk5hbWU6IHRoaXMuYXBwbGljYXRpb24ubmFtZSxcbiAgICAgIGVudmlyb25tZW50TmFtZTogdGhpcy5lYkVudmlyb25tZW50Lm5hbWUsXG4gICAgICBlbnZpcm9ubWVudFVybDogdGhpcy5lYkVudmlyb25tZW50LmVuZHBvaW50VXJsLFxuICAgICAgZW52aXJvbm1lbnRDbmFtZTogdGhpcy5lYkVudmlyb25tZW50LmNuYW1lLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBFbGFzdGljIEJlYW5zdGFsayBBcHBsaWNhdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVBcHBsaWNhdGlvbigpOiBhd3MuZWxhc3RpY2JlYW5zdGFsay5BcHBsaWNhdGlvbiB7XG4gICAgcmV0dXJuIG5ldyBhd3MuZWxhc3RpY2JlYW5zdGFsay5BcHBsaWNhdGlvbihcbiAgICAgIGBub3ZhLWFwcC0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBub3ZhLWFwcC0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgTm92YSBhcHBsaWNhdGlvbiBmb3IgJHt0aGlzLnJlZ2lvbn1gLFxuICAgICAgICB0YWdzOiB0aGlzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIENvbmZpZ3VyYXRpb24gVGVtcGxhdGVcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQ29uZmlndXJhdGlvblRlbXBsYXRlKFxuICAgIGFyZ3M6IEVsYXN0aWNCZWFuc3RhbGtJbmZyYXN0cnVjdHVyZUFyZ3NcbiAgKTogYXdzLmVsYXN0aWNiZWFuc3RhbGsuQ29uZmlndXJhdGlvblRlbXBsYXRlIHtcbiAgICAvLyBDb252ZXJ0IHN1Ym5ldCBhcnJheXMgdG8gY29tbWEtc2VwYXJhdGVkIHN0cmluZ3NcbiAgICBjb25zdCBwdWJsaWNTdWJuZXRzU3RyaW5nID0gcHVsdW1pXG4gICAgICAuYWxsKGFyZ3MucHVibGljU3VibmV0SWRzKVxuICAgICAgLmFwcGx5KHN1Ym5ldHMgPT4gc3VibmV0cy5qb2luKCcsJykpO1xuICAgIGNvbnN0IHByaXZhdGVTdWJuZXRzU3RyaW5nID0gcHVsdW1pXG4gICAgICAuYWxsKGFyZ3MucHJpdmF0ZVN1Ym5ldElkcylcbiAgICAgIC5hcHBseShzdWJuZXRzID0+IHN1Ym5ldHMuam9pbignLCcpKTtcblxuICAgIHJldHVybiBuZXcgYXdzLmVsYXN0aWNiZWFuc3RhbGsuQ29uZmlndXJhdGlvblRlbXBsYXRlKFxuICAgICAgYG5vdmEtY29uZmlnLSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYG5vdmEtY29uZmlnLSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgICAgYXBwbGljYXRpb246IHRoaXMuYXBwbGljYXRpb24ubmFtZSxcbiAgICAgICAgc29sdXRpb25TdGFja05hbWU6ICc2NGJpdCBBbWF6b24gTGludXggMiB2My42LjAgcnVubmluZyBEb2NrZXInLFxuICAgICAgICBzZXR0aW5nczogW1xuICAgICAgICAgIC8vIFZQQyBDb25maWd1cmF0aW9uXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmVjMjp2cGMnLFxuICAgICAgICAgICAgbmFtZTogJ1ZQQ0lkJyxcbiAgICAgICAgICAgIHZhbHVlOiBhcmdzLnZwY0lkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmVjMjp2cGMnLFxuICAgICAgICAgICAgbmFtZTogJ1N1Ym5ldHMnLFxuICAgICAgICAgICAgdmFsdWU6IHByaXZhdGVTdWJuZXRzU3RyaW5nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmVjMjp2cGMnLFxuICAgICAgICAgICAgbmFtZTogJ0VMQlN1Ym5ldHMnLFxuICAgICAgICAgICAgdmFsdWU6IHB1YmxpY1N1Ym5ldHNTdHJpbmcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBJbnN0YW5jZSBDb25maWd1cmF0aW9uXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmF1dG9zY2FsaW5nOmxhdW5jaGNvbmZpZ3VyYXRpb24nLFxuICAgICAgICAgICAgbmFtZTogJ0luc3RhbmNlVHlwZScsXG4gICAgICAgICAgICB2YWx1ZTogJ3QzLm1lZGl1bScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdhd3M6YXV0b3NjYWxpbmc6bGF1bmNoY29uZmlndXJhdGlvbicsXG4gICAgICAgICAgICBuYW1lOiAnSWFtSW5zdGFuY2VQcm9maWxlJyxcbiAgICAgICAgICAgIHZhbHVlOiBhcmdzLmViSW5zdGFuY2VQcm9maWxlTmFtZSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czphdXRvc2NhbGluZzpsYXVuY2hjb25maWd1cmF0aW9uJyxcbiAgICAgICAgICAgIG5hbWU6ICdTZWN1cml0eUdyb3VwcycsXG4gICAgICAgICAgICB2YWx1ZTogYXJncy5lYlNlY3VyaXR5R3JvdXBJZCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vIEF1dG8gU2NhbGluZyBDb25maWd1cmF0aW9uXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmF1dG9zY2FsaW5nOmFzZycsXG4gICAgICAgICAgICBuYW1lOiAnTWluU2l6ZScsXG4gICAgICAgICAgICB2YWx1ZTogJzInLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmF1dG9zY2FsaW5nOmFzZycsXG4gICAgICAgICAgICBuYW1lOiAnTWF4U2l6ZScsXG4gICAgICAgICAgICB2YWx1ZTogJzEwJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vIExvYWQgQmFsYW5jZXIgQ29uZmlndXJhdGlvblxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czplbGFzdGljYmVhbnN0YWxrOmVudmlyb25tZW50JyxcbiAgICAgICAgICAgIG5hbWU6ICdFbnZpcm9ubWVudFR5cGUnLFxuICAgICAgICAgICAgdmFsdWU6ICdMb2FkQmFsYW5jZWQnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmVsYXN0aWNiZWFuc3RhbGs6ZW52aXJvbm1lbnQnLFxuICAgICAgICAgICAgbmFtZTogJ0xvYWRCYWxhbmNlclR5cGUnLFxuICAgICAgICAgICAgdmFsdWU6ICdhcHBsaWNhdGlvbicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdhd3M6ZWxidjI6bG9hZGJhbGFuY2VyJyxcbiAgICAgICAgICAgIG5hbWU6ICdTZWN1cml0eUdyb3VwcycsXG4gICAgICAgICAgICB2YWx1ZTogYXJncy5hbGJTZWN1cml0eUdyb3VwSWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBTZXJ2aWNlIFJvbGVcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdhd3M6ZWxhc3RpY2JlYW5zdGFsazplbnZpcm9ubWVudCcsXG4gICAgICAgICAgICBuYW1lOiAnU2VydmljZVJvbGUnLFxuICAgICAgICAgICAgdmFsdWU6IGFyZ3MuZWJTZXJ2aWNlUm9sZUFybixcbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vIEhlYWx0aCBDaGVjayBDb25maWd1cmF0aW9uXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmVsYXN0aWNiZWFuc3RhbGs6aGVhbHRocmVwb3J0aW5nOnN5c3RlbScsXG4gICAgICAgICAgICBuYW1lOiAnU3lzdGVtVHlwZScsXG4gICAgICAgICAgICB2YWx1ZTogJ2VuaGFuY2VkJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIC8vIFJvbGxpbmcgVXBkYXRlc1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czphdXRvc2NhbGluZzp1cGRhdGVwb2xpY3k6cm9sbGluZ3VwZGF0ZScsXG4gICAgICAgICAgICBuYW1lOiAnUm9sbGluZ1VwZGF0ZUVuYWJsZWQnLFxuICAgICAgICAgICAgdmFsdWU6ICd0cnVlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czphdXRvc2NhbGluZzp1cGRhdGVwb2xpY3k6cm9sbGluZ3VwZGF0ZScsXG4gICAgICAgICAgICBuYW1lOiAnTWF4QmF0Y2hTaXplJyxcbiAgICAgICAgICAgIHZhbHVlOiAnMScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdhd3M6YXV0b3NjYWxpbmc6dXBkYXRlcG9saWN5OnJvbGxpbmd1cGRhdGUnLFxuICAgICAgICAgICAgbmFtZTogJ01pbkluc3RhbmNlc0luU2VydmljZScsXG4gICAgICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIC8vIFJlbW92ZSB0YWdzIGZyb20gaGVyZSAtIG5vdCBzdXBwb3J0ZWQgaW4gdjYuMjIuMFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBFbGFzdGljIEJlYW5zdGFsayBFbnZpcm9ubWVudFxuICAgKi9cbiAgcHJpdmF0ZSBjcmVhdGVFbnZpcm9ubWVudCgpOiBhd3MuZWxhc3RpY2JlYW5zdGFsay5FbnZpcm9ubWVudCB7XG4gICAgY29uc3Qgc3VmZml4ID0gdGhpcy5yYW5kb21TdWZmaXgoKTtcbiAgICBjb25zdCBlbnZOYW1lID0gYG5vdmEtZW52LSR7dGhpcy5yZWdpb25TdWZmaXh9LSR7c3VmZml4fWA7XG5cbiAgICByZXR1cm4gbmV3IGF3cy5lbGFzdGljYmVhbnN0YWxrLkVudmlyb25tZW50KFxuICAgICAgYG5vdmEtZW52LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogZW52TmFtZSxcbiAgICAgICAgYXBwbGljYXRpb246IHRoaXMuYXBwbGljYXRpb24ubmFtZSxcbiAgICAgICAgdGVtcGxhdGVOYW1lOiB0aGlzLmNvbmZpZ1RlbXBsYXRlLm5hbWUsXG4gICAgICAgIHRpZXI6ICdXZWJTZXJ2ZXInLFxuICAgICAgICB0YWdzOiB0aGlzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGUgcmFuZG9tIHN1ZmZpeCBmb3IgdW5pcXVlIG5hbWluZ1xuICAgKi9cbiAgcHJpdmF0ZSByYW5kb21TdWZmaXgobGVuZ3RoOiBudW1iZXIgPSA2KTogc3RyaW5nIHtcbiAgICBjb25zdCBjaGFycyA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODknO1xuICAgIGxldCByZXN1bHQgPSAnJztcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICByZXN1bHQgKz0gY2hhcnMuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGNoYXJzLmxlbmd0aCkpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLy8gUHJvcGVydHkgZ2V0dGVycyBmb3IgZWFzeSBhY2Nlc3NcbiAgcHVibGljIGdldCBhcHBsaWNhdGlvbk5hbWUoKTogT3V0cHV0PHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmFwcGxpY2F0aW9uLm5hbWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGVudmlyb25tZW50TmFtZSgpOiBPdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJFbnZpcm9ubWVudC5uYW1lO1xuICB9XG5cbiAgcHVibGljIGdldCBlbnZpcm9ubWVudFVybCgpOiBPdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJFbnZpcm9ubWVudC5lbmRwb2ludFVybDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZW52aXJvbm1lbnRDbmFtZSgpOiBPdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJFbnZpcm9ubWVudC5jbmFtZTtcbiAgfVxufVxuIl19