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
     * Get the current valid solution stack for Docker (verified 2025-08-19)
     */
    getSolutionStackName() {
        // Using the latest available solution stack as of 2025-08-19
        // Retrieved via: aws elasticbeanstalk list-available-solution-stacks
        return '64bit Amazon Linux 2023 v4.6.3 running Docker';
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
        const solutionStackName = this.getSolutionStackName();
        console.log(`🐳 Using Elastic Beanstalk solution stack: ${solutionStackName}`);
        return new aws.elasticbeanstalk.ConfigurationTemplate(`nova-config-${this.regionSuffix}`, {
            name: `nova-config-${this.regionSuffix}`,
            application: this.application.name,
            solutionStackName: solutionStackName,
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
        // Use deterministic naming based on environment suffix (no random components)
        const envName = `nova-env-${this.regionSuffix}-${this.environmentSuffix}`;
        console.log(`🚀 Creating Elastic Beanstalk environment: ${envName}`);
        return new aws.elasticbeanstalk.Environment(`nova-env-${this.regionSuffix}`, {
            name: envName,
            application: this.application.name,
            templateName: this.configTemplate.name,
            tier: 'WebServer',
            tags: this.tags,
        }, { parent: this });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWxhc3RpY19iZWFuc3RhbGsuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJlbGFzdGljX2JlYW5zdGFsay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7OztHQUdHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1REFBeUM7QUFDekMsaURBQW1DO0FBQ25DLDJDQUl3QjtBQWlCeEIsTUFBYSw4QkFBK0IsU0FBUSwwQkFBaUI7SUFDbEQsTUFBTSxDQUFTO0lBQ2YsU0FBUyxDQUFVO0lBQ25CLFdBQVcsQ0FBUztJQUNwQixpQkFBaUIsQ0FBUztJQUMxQixJQUFJLENBQXlCO0lBQzdCLFlBQVksQ0FBUztJQUV0QixXQUFXLENBQW1DO0lBQzlDLGNBQWMsQ0FBNkM7SUFDM0QsYUFBYSxDQUFtQztJQUVoRSxZQUNFLElBQVksRUFDWixJQUF3QyxFQUN4QyxJQUErQjtRQUUvQixLQUFLLENBQUMsc0NBQXNDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU5RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDMUIsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNwQyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixDQUFDO1FBQ2hELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN0QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXRFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7UUFDNUMsSUFBSSxD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Ii8qKlxuICogRWxhc3RpYyBCZWFuc3RhbGsgSW5mcmFzdHJ1Y3R1cmUgQ29tcG9uZW50XG4gKiBIYW5kbGVzIEVCIGFwcGxpY2F0aW9uLCBlbnZpcm9ubWVudCwgYW5kIGNvbmZpZ3VyYXRpb25cbiAqL1xuXG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCB7XG4gIENvbXBvbmVudFJlc291cmNlLFxuICBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnMsXG4gIE91dHB1dCxcbn0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5pbnRlcmZhY2UgRWxhc3RpY0JlYW5zdGFsa0luZnJhc3RydWN0dXJlQXJncyB7XG4gIHJlZ2lvbjogc3RyaW5nO1xuICBpc1ByaW1hcnk6IGJvb2xlYW47XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG4gIHZwY0lkOiBPdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljU3VibmV0SWRzOiBPdXRwdXQ8c3RyaW5nPltdO1xuICBwcml2YXRlU3VibmV0SWRzOiBPdXRwdXQ8c3RyaW5nPltdO1xuICBhbGJTZWN1cml0eUdyb3VwSWQ6IE91dHB1dDxzdHJpbmc+O1xuICBlYlNlY3VyaXR5R3JvdXBJZDogT3V0cHV0PHN0cmluZz47XG4gIGViU2VydmljZVJvbGVBcm46IE91dHB1dDxzdHJpbmc+O1xuICBlYkluc3RhbmNlUHJvZmlsZU5hbWU6IE91dHB1dDxzdHJpbmc+O1xuICB0YWdzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgRWxhc3RpY0JlYW5zdGFsa0luZnJhc3RydWN0dXJlIGV4dGVuZHMgQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwcml2YXRlIHJlYWRvbmx5IHJlZ2lvbjogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IGlzUHJpbWFyeTogYm9vbGVhbjtcbiAgcHJpdmF0ZSByZWFkb25seSBlbnZpcm9ubWVudDogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG4gIHByaXZhdGUgcmVhZG9ubHkgdGFnczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgcHJpdmF0ZSByZWFkb25seSByZWdpb25TdWZmaXg6IHN0cmluZztcblxuICBwdWJsaWMgcmVhZG9ubHkgYXBwbGljYXRpb246IGF3cy5lbGFzdGljYmVhbnN0YWxrLkFwcGxpY2F0aW9uO1xuICBwdWJsaWMgcmVhZG9ubHkgY29uZmlnVGVtcGxhdGU6IGF3cy5lbGFzdGljYmVhbnN0YWxrLkNvbmZpZ3VyYXRpb25UZW1wbGF0ZTtcbiAgcHVibGljIHJlYWRvbmx5IGViRW52aXJvbm1lbnQ6IGF3cy5lbGFzdGljYmVhbnN0YWxrLkVudmlyb25tZW50O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBFbGFzdGljQmVhbnN0YWxrSW5mcmFzdHJ1Y3R1cmVBcmdzLFxuICAgIG9wdHM/OiBDb21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ25vdmE6aW5mcmFzdHJ1Y3R1cmU6RWxhc3RpY0JlYW5zdGFsaycsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIHRoaXMucmVnaW9uID0gYXJncy5yZWdpb247XG4gICAgdGhpcy5pc1ByaW1hcnkgPSBhcmdzLmlzUHJpbWFyeTtcbiAgICB0aGlzLmVudmlyb25tZW50ID0gYXJncy5lbnZpcm9ubWVudDtcbiAgICB0aGlzLmVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeDtcbiAgICB0aGlzLnRhZ3MgPSBhcmdzLnRhZ3M7XG4gICAgdGhpcy5yZWdpb25TdWZmaXggPSBhcmdzLnJlZ2lvbi5yZXBsYWNlKC8tL2csICcnKS5yZXBsYWNlKC9nb3YvZywgJycpO1xuXG4gICAgdGhpcy5hcHBsaWNhdGlvbiA9IHRoaXMuY3JlYXRlQXBwbGljYXRpb24oKTtcbiAgICB0aGlzLmNvbmZpZ1RlbXBsYXRlID0gdGhpcy5jcmVhdGVDb25maWd1cmF0aW9uVGVtcGxhdGUoYXJncyk7XG4gICAgdGhpcy5lYkVudmlyb25tZW50ID0gdGhpcy5jcmVhdGVFbnZpcm9ubWVudCgpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgYXBwbGljYXRpb25OYW1lOiB0aGlzLmFwcGxpY2F0aW9uLm5hbWUsXG4gICAgICBlbnZpcm9ubWVudE5hbWU6IHRoaXMuZWJFbnZpcm9ubWVudC5uYW1lLFxuICAgICAgZW52aXJvbm1lbnRVcmw6IHRoaXMuZWJFbnZpcm9ubWVudC5lbmRwb2ludFVybCxcbiAgICAgIGVudmlyb25tZW50Q25hbWU6IHRoaXMuZWJFbnZpcm9ubWVudC5jbmFtZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgRWxhc3RpYyBCZWFuc3RhbGsgQXBwbGljYXRpb25cbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQXBwbGljYXRpb24oKTogYXdzLmVsYXN0aWNiZWFuc3RhbGsuQXBwbGljYXRpb24ge1xuICAgIHJldHVybiBuZXcgYXdzLmVsYXN0aWNiZWFuc3RhbGsuQXBwbGljYXRpb24oXG4gICAgICBgbm92YS1hcHAtJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgbm92YS1hcHAtJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjogYE5vdmEgYXBwbGljYXRpb24gZm9yICR7dGhpcy5yZWdpb259YCxcbiAgICAgICAgdGFnczogdGhpcy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCB2YWxpZCBzb2x1dGlvbiBzdGFjayBmb3IgRG9ja2VyICh2ZXJpZmllZCAyMDI1LTA4LTE5KVxuICAgKi9cbiAgcHJpdmF0ZSBnZXRTb2x1dGlvblN0YWNrTmFtZSgpOiBzdHJpbmcge1xuICAgIC8vIFVzaW5nIHRoZSBsYXRlc3QgYXZhaWxhYmxlIHNvbHV0aW9uIHN0YWNrIGFzIG9mIDIwMjUtMDgtMTlcbiAgICAvLyBSZXRyaWV2ZWQgdmlhOiBhd3MgZWxhc3RpY2JlYW5zdGFsayBsaXN0LWF2YWlsYWJsZS1zb2x1dGlvbi1zdGFja3NcbiAgICByZXR1cm4gJzY0Yml0IEFtYXpvbiBMaW51eCAyMDIzIHY0LjYuMyBydW5uaW5nIERvY2tlcic7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIENvbmZpZ3VyYXRpb24gVGVtcGxhdGVcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlQ29uZmlndXJhdGlvblRlbXBsYXRlKFxuICAgIGFyZ3M6IEVsYXN0aWNCZWFuc3RhbGtJbmZyYXN0cnVjdHVyZUFyZ3NcbiAgKTogYXdzLmVsYXN0aWNiZWFuc3RhbGsuQ29uZmlndXJhdGlvblRlbXBsYXRlIHtcbiAgICAvLyBDb252ZXJ0IHN1Ym5ldCBhcnJheXMgdG8gY29tbWEtc2VwYXJhdGVkIHN0cmluZ3NcbiAgICBjb25zdCBwdWJsaWNTdWJuZXRzU3RyaW5nID0gcHVsdW1pXG4gICAgICAuYWxsKGFyZ3MucHVibGljU3VibmV0SWRzKVxuICAgICAgLmFwcGx5KHN1Ym5ldHMgPT4gc3VibmV0cy5qb2luKCcsJykpO1xuICAgIGNvbnN0IHByaXZhdGVTdWJuZXRzU3RyaW5nID0gcHVsdW1pXG4gICAgICAuYWxsKGFyZ3MucHJpdmF0ZVN1Ym5ldElkcylcbiAgICAgIC5hcHBseShzdWJuZXRzID0+IHN1Ym5ldHMuam9pbignLCcpKTtcblxuICAgIGNvbnN0IHNvbHV0aW9uU3RhY2tOYW1lID0gdGhpcy5nZXRTb2x1dGlvblN0YWNrTmFtZSgpO1xuICAgIGNvbnNvbGUubG9nKFxuICAgICAgYPCfkLMgVXNpbmcgRWxhc3RpYyBCZWFuc3RhbGsgc29sdXRpb24gc3RhY2s6ICR7c29sdXRpb25TdGFja05hbWV9YFxuICAgICk7XG5cbiAgICByZXR1cm4gbmV3IGF3cy5lbGFzdGljYmVhbnN0YWxrLkNvbmZpZ3VyYXRpb25UZW1wbGF0ZShcbiAgICAgIGBub3ZhLWNvbmZpZy0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBub3ZhLWNvbmZpZy0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICAgIGFwcGxpY2F0aW9uOiB0aGlzLmFwcGxpY2F0aW9uLm5hbWUsXG4gICAgICAgIHNvbHV0aW9uU3RhY2tOYW1lOiBzb2x1dGlvblN0YWNrTmFtZSxcbiAgICAgICAgc2V0dGluZ3M6IFtcbiAgICAgICAgICAvLyBWUEMgQ29uZmlndXJhdGlvblxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czplYzI6dnBjJyxcbiAgICAgICAgICAgIG5hbWU6ICdWUENJZCcsXG4gICAgICAgICAgICB2YWx1ZTogYXJncy52cGNJZCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czplYzI6dnBjJyxcbiAgICAgICAgICAgIG5hbWU6ICdTdWJuZXRzJyxcbiAgICAgICAgICAgIHZhbHVlOiBwcml2YXRlU3VibmV0c1N0cmluZyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czplYzI6dnBjJyxcbiAgICAgICAgICAgIG5hbWU6ICdFTEJTdWJuZXRzJyxcbiAgICAgICAgICAgIHZhbHVlOiBwdWJsaWNTdWJuZXRzU3RyaW5nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgLy8gSW5zdGFuY2UgQ29uZmlndXJhdGlvblxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czphdXRvc2NhbGluZzpsYXVuY2hjb25maWd1cmF0aW9uJyxcbiAgICAgICAgICAgIG5hbWU6ICdJbnN0YW5jZVR5cGUnLFxuICAgICAgICAgICAgdmFsdWU6ICd0My5tZWRpdW0nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmF1dG9zY2FsaW5nOmxhdW5jaGNvbmZpZ3VyYXRpb24nLFxuICAgICAgICAgICAgbmFtZTogJ0lhbUluc3RhbmNlUHJvZmlsZScsXG4gICAgICAgICAgICB2YWx1ZTogYXJncy5lYkluc3RhbmNlUHJvZmlsZU5hbWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdhd3M6YXV0b3NjYWxpbmc6bGF1bmNoY29uZmlndXJhdGlvbicsXG4gICAgICAgICAgICBuYW1lOiAnU2VjdXJpdHlHcm91cHMnLFxuICAgICAgICAgICAgdmFsdWU6IGFyZ3MuZWJTZWN1cml0eUdyb3VwSWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBBdXRvIFNjYWxpbmcgQ29uZmlndXJhdGlvblxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czphdXRvc2NhbGluZzphc2cnLFxuICAgICAgICAgICAgbmFtZTogJ01pblNpemUnLFxuICAgICAgICAgICAgdmFsdWU6ICcyJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czphdXRvc2NhbGluZzphc2cnLFxuICAgICAgICAgICAgbmFtZTogJ01heFNpemUnLFxuICAgICAgICAgICAgdmFsdWU6ICcxMCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBMb2FkIEJhbGFuY2VyIENvbmZpZ3VyYXRpb25cbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdhd3M6ZWxhc3RpY2JlYW5zdGFsazplbnZpcm9ubWVudCcsXG4gICAgICAgICAgICBuYW1lOiAnRW52aXJvbm1lbnRUeXBlJyxcbiAgICAgICAgICAgIHZhbHVlOiAnTG9hZEJhbGFuY2VkJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czplbGFzdGljYmVhbnN0YWxrOmVudmlyb25tZW50JyxcbiAgICAgICAgICAgIG5hbWU6ICdMb2FkQmFsYW5jZXJUeXBlJyxcbiAgICAgICAgICAgIHZhbHVlOiAnYXBwbGljYXRpb24nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmVsYnYyOmxvYWRiYWxhbmNlcicsXG4gICAgICAgICAgICBuYW1lOiAnU2VjdXJpdHlHcm91cHMnLFxuICAgICAgICAgICAgdmFsdWU6IGFyZ3MuYWxiU2VjdXJpdHlHcm91cElkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgLy8gU2VydmljZSBSb2xlXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmVsYXN0aWNiZWFuc3RhbGs6ZW52aXJvbm1lbnQnLFxuICAgICAgICAgICAgbmFtZTogJ1NlcnZpY2VSb2xlJyxcbiAgICAgICAgICAgIHZhbHVlOiBhcmdzLmViU2VydmljZVJvbGVBcm4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBIZWFsdGggQ2hlY2sgQ29uZmlndXJhdGlvblxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ2F3czplbGFzdGljYmVhbnN0YWxrOmhlYWx0aHJlcG9ydGluZzpzeXN0ZW0nLFxuICAgICAgICAgICAgbmFtZTogJ1N5c3RlbVR5cGUnLFxuICAgICAgICAgICAgdmFsdWU6ICdlbmhhbmNlZCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICAvLyBSb2xsaW5nIFVwZGF0ZXNcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdhd3M6YXV0b3NjYWxpbmc6dXBkYXRlcG9saWN5OnJvbGxpbmd1cGRhdGUnLFxuICAgICAgICAgICAgbmFtZTogJ1JvbGxpbmdVcGRhdGVFbmFibGVkJyxcbiAgICAgICAgICAgIHZhbHVlOiAndHJ1ZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdhd3M6YXV0b3NjYWxpbmc6dXBkYXRlcG9saWN5OnJvbGxpbmd1cGRhdGUnLFxuICAgICAgICAgICAgbmFtZTogJ01heEJhdGNoU2l6ZScsXG4gICAgICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXdzOmF1dG9zY2FsaW5nOnVwZGF0ZXBvbGljeTpyb2xsaW5ndXBkYXRlJyxcbiAgICAgICAgICAgIG5hbWU6ICdNaW5JbnN0YW5jZXNJblNlcnZpY2UnLFxuICAgICAgICAgICAgdmFsdWU6ICcxJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICAvLyBSZW1vdmUgdGFncyBmcm9tIGhlcmUgLSBub3Qgc3VwcG9ydGVkIGluIHY2LjIyLjBcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgRWxhc3RpYyBCZWFuc3RhbGsgRW52aXJvbm1lbnRcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlRW52aXJvbm1lbnQoKTogYXdzLmVsYXN0aWNiZWFuc3RhbGsuRW52aXJvbm1lbnQge1xuICAgIC8vIFVzZSBkZXRlcm1pbmlzdGljIG5hbWluZyBiYXNlZCBvbiBlbnZpcm9ubWVudCBzdWZmaXggKG5vIHJhbmRvbSBjb21wb25lbnRzKVxuICAgIGNvbnN0IGVudk5hbWUgPSBgbm92YS1lbnYtJHt0aGlzLnJlZ2lvblN1ZmZpeH0tJHt0aGlzLmVudmlyb25tZW50U3VmZml4fWA7XG5cbiAgICBjb25zb2xlLmxvZyhg8J+agCBDcmVhdGluZyBFbGFzdGljIEJlYW5zdGFsayBlbnZpcm9ubWVudDogJHtlbnZOYW1lfWApO1xuXG4gICAgcmV0dXJuIG5ldyBhd3MuZWxhc3RpY2JlYW5zdGFsay5FbnZpcm9ubWVudChcbiAgICAgIGBub3ZhLWVudi0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGVudk5hbWUsXG4gICAgICAgIGFwcGxpY2F0aW9uOiB0aGlzLmFwcGxpY2F0aW9uLm5hbWUsXG4gICAgICAgIHRlbXBsYXRlTmFtZTogdGhpcy5jb25maWdUZW1wbGF0ZS5uYW1lLFxuICAgICAgICB0aWVyOiAnV2ViU2VydmVyJyxcbiAgICAgICAgdGFnczogdGhpcy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLy8gUHJvcGVydHkgZ2V0dGVycyBmb3IgZWFzeSBhY2Nlc3NcbiAgcHVibGljIGdldCBhcHBsaWNhdGlvbk5hbWUoKTogT3V0cHV0PHN0cmluZz4ge1xuICAgIHJldHVybiB0aGlzLmFwcGxpY2F0aW9uLm5hbWU7XG4gIH1cblxuICBwdWJsaWMgZ2V0IGVudmlyb25tZW50TmFtZSgpOiBPdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJFbnZpcm9ubWVudC5uYW1lO1xuICB9XG5cbiAgcHVibGljIGdldCBlbnZpcm9ubWVudFVybCgpOiBPdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJFbnZpcm9ubWVudC5lbmRwb2ludFVybDtcbiAgfVxuXG4gIHB1YmxpYyBnZXQgZW52aXJvbm1lbnRDbmFtZSgpOiBPdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuZWJFbnZpcm9ubWVudC5jbmFtZTtcbiAgfVxufSJdfQ==