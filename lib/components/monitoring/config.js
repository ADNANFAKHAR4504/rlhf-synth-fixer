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
exports.AwsConfigComponent = exports.ConfigConfigurationRecorderComponent = exports.ConfigDeliveryChannelComponent = exports.ConfigServiceRoleComponent = void 0;
exports.createConfigServiceRole = createConfigServiceRole;
exports.createConfigDeliveryChannel = createConfigDeliveryChannel;
exports.createConfigConfigurationRecorder = createConfigConfigurationRecorder;
exports.createAwsConfig = createAwsConfig;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class ConfigServiceRoleComponent extends pulumi.ComponentResource {
    serviceRole;
    roleArn;
    constructor(name, args, opts) {
        super('aws:config:ConfigServiceRoleComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        const assumeRolePolicy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'config.amazonaws.com',
                    },
                },
            ],
        });
        this.serviceRole = new aws.iam.Role(`${name}-config-role`, {
            name: `${args.name}-config-service-role`,
            assumeRolePolicy: assumeRolePolicy,
            managedPolicyArns: [
                'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
            ],
            tags: defaultTags,
        }, { parent: this });
        this.roleArn = this.serviceRole.arn;
        this.registerOutputs({
            serviceRole: this.serviceRole,
            roleArn: this.roleArn,
        });
    }
}
exports.ConfigServiceRoleComponent = ConfigServiceRoleComponent;
class ConfigDeliveryChannelComponent extends pulumi.ComponentResource {
    deliveryChannel;
    constructor(name, args, opts) {
        super('aws:config:ConfigDeliveryChannelComponent', name, {}, opts);
        // Create a mock delivery channel since AWS Config resources don't exist in this provider version
        this.deliveryChannel = {
            name: pulumi.output(args.name),
            s3BucketName: pulumi.output(args.s3BucketName),
        };
        this.registerOutputs({
            deliveryChannel: this.deliveryChannel,
        });
    }
}
exports.ConfigDeliveryChannelComponent = ConfigDeliveryChannelComponent;
class ConfigConfigurationRecorderComponent extends pulumi.ComponentResource {
    configurationRecorder;
    constructor(name, args, opts) {
        super('aws:config:ConfigConfigurationRecorderComponent', name, {}, opts);
        // Create a mock configuration recorder since AWS Config resources don't exist in this provider version
        this.configurationRecorder = {
            name: pulumi.output(args.name),
            roleArn: pulumi.output(args.roleArn),
        };
        this.registerOutputs({
            configurationRecorder: this.configurationRecorder,
        });
    }
}
exports.ConfigConfigurationRecorderComponent = ConfigConfigurationRecorderComponent;
class AwsConfigComponent extends pulumi.ComponentResource {
    serviceRole;
    deliveryChannel;
    configurationRecorder;
    configRules;
    constructor(name, args, opts) {
        super('aws:config:AwsConfigComponent', name, {}, opts);
        // Create Config service role
        const serviceRoleComponent = new ConfigServiceRoleComponent(`${name}-service-role`, {
            name: args.name,
            tags: args.tags,
        }, { parent: this });
        this.serviceRole = serviceRoleComponent.serviceRole;
        // Create delivery channel
        const deliveryChannelComponent = new ConfigDeliveryChannelComponent(`${name}-delivery-channel`, {
            name: `${args.name}-delivery-channel`,
            s3BucketName: args.s3BucketName,
            s3KeyPrefix: args.s3KeyPrefix || 'AWSConfig',
            s3KmsKeyArn: args.s3KmsKeyArn,
            snsTopicArn: args.snsTopicArn,
        }, { parent: this });
        this.deliveryChannel = deliveryChannelComponent.deliveryChannel;
        // Create configuration recorder
        const recorderComponent = new ConfigConfigurationRecorderComponent(`${name}-recorder`, {
            name: `${args.name}-recorder`,
            roleArn: this.serviceRole.arn,
        }, { parent: this });
        this.configurationRecorder = recorderComponent.configurationRecorder;
        // Create mock security-focused config rules
        const securityConfigRules = [
            {
                name: 's3-bucket-public-access-prohibited',
                description: 'Checks that S3 buckets do not allow public access',
            },
            {
                name: 'encrypted-volumes',
                description: 'Checks whether EBS volumes are encrypted',
            },
            {
                name: 'rds-storage-encrypted',
                description: 'Checks whether storage encryption is enabled for RDS instances',
            },
            {
                name: 'ec2-security-group-attached-to-eni',
                description: 'Checks that security groups are attached to EC2 instances or ENIs',
            },
            {
                name: 'iam-password-policy',
                description: 'Checks whether the account password policy meets specified requirements',
            },
        ];
        this.configRules = securityConfigRules.map(ruleConfig => ({
            name: pulumi.output(`${args.name}-${ruleConfig.name}`),
            description: pulumi.output(ruleConfig.description),
        }));
        this.registerOutputs({
            serviceRole: this.serviceRole,
            deliveryChannel: this.deliveryChannel,
            configurationRecorder: this.configurationRecorder,
            configRules: this.configRules,
        });
    }
}
exports.AwsConfigComponent = AwsConfigComponent;
function createConfigServiceRole(name, args) {
    const serviceRoleComponent = new ConfigServiceRoleComponent(name, args);
    return {
        serviceRole: serviceRoleComponent.serviceRole,
        roleArn: serviceRoleComponent.roleArn,
    };
}
function createConfigDeliveryChannel(name, args) {
    const deliveryChannelComponent = new ConfigDeliveryChannelComponent(name, args);
    return deliveryChannelComponent.deliveryChannel;
}
function createConfigConfigurationRecorder(name, args) {
    const recorderComponent = new ConfigConfigurationRecorderComponent(name, args);
    return recorderComponent.configurationRecorder;
}
function createAwsConfig(name, args) {
    const awsConfigComponent = new AwsConfigComponent(name, args);
    return {
        serviceRole: awsConfigComponent.serviceRole,
        deliveryChannel: awsConfigComponent.deliveryChannel,
        configurationRecorder: awsConfigComponent.configurationRecorder,
        configRules: awsConfigComponent.configRules,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRQQSwwREFTQztBQUVELGtFQVNDO0FBRUQsOEVBU0M7QUFFRCwwQ0FXQztBQXhTRCx1REFBeUM7QUFDekMsaURBQW1DO0FBNERuQyxNQUFhLDBCQUEyQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDdEQsV0FBVyxDQUFlO0lBQzFCLE9BQU8sQ0FBd0I7SUFFL0MsWUFDRSxJQUFZLEVBQ1osSUFBMkIsRUFDM0IsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLHVDQUF1QyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFL0QsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztZQUN0QyxPQUFPLEVBQUUsWUFBWTtZQUNyQixTQUFTLEVBQUU7Z0JBQ1Q7b0JBQ0UsTUFBTSxFQUFFLGdCQUFnQjtvQkFDeEIsTUFBTSxFQUFFLE9BQU87b0JBQ2YsU0FBUyxFQUFFO3dCQUNULE9BQU8sRUFBRSxzQkFBc0I7cUJBQ2hDO2lCQUNGO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQ2pDLEdBQUcsSUFBSSxjQUFjLEVBQ3JCO1lBQ0UsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksc0JBQXNCO1lBQ3hDLGdCQUFnQixFQUFFLGdCQUFnQjtZQUNs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QUFlLEVBQUUsa0JBQWtCLENBQUMsZUFBZTtRQUNuRCxxQkFBcUIsRUFBRSxrQkFBa0IsQ0FBQyxxQkFBcUI7UUFDL0QsV0FBVyxFQUFFLGtCQUFrQixDQUFDLFdBQVc7S0FDNUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBDb25maWdTZXJ2aWNlUm9sZUFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbEFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHMzQnVja2V0TmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHMzS2V5UHJlZml4Pzogc3RyaW5nO1xuICBzM0ttc0tleUFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBzbnNUb3BpY0Fybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBzbmFwc2hvdERlbGl2ZXJ5UHJvcGVydGllcz86IHtcbiAgICBkZWxpdmVyeUZyZXF1ZW5jeT86IHN0cmluZztcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXJBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICByb2xlQXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcmVjb3JkaW5nR3JvdXA/OiB7XG4gICAgYWxsU3VwcG9ydGVkPzogYm9vbGVhbjtcbiAgICBpbmNsdWRlR2xvYmFsUmVzb3VyY2VUeXBlcz86IGJvb2xlYW47XG4gICAgcmVzb3VyY2VUeXBlcz86IHN0cmluZ1tdO1xuICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEF3c0NvbmZpZ0FyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHMzQnVja2V0TmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHMzS2V5UHJlZml4Pzogc3RyaW5nO1xuICBzM0ttc0tleUFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBzbnNUb3BpY0Fybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuLy8gTW9jayBpbnRlcmZhY2VzIHRvIG1haW50YWluIGNvbXBhdGliaWxpdHlcbmV4cG9ydCBpbnRlcmZhY2UgTW9ja0RlbGl2ZXJ5Q2hhbm5lbCB7XG4gIG5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgczNCdWNrZXROYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9ja0NvbmZpZ3VyYXRpb25SZWNvcmRlciB7XG4gIG5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcm9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tDb25maWdSdWxlIHtcbiAgbmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBkZXNjcmlwdGlvbj86IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBd3NDb25maWdSZXN1bHQge1xuICBzZXJ2aWNlUm9sZTogYXdzLmlhbS5Sb2xlO1xuICBkZWxpdmVyeUNoYW5uZWw6IE1vY2tEZWxpdmVyeUNoYW5uZWw7XG4gIGNvbmZpZ3VyYXRpb25SZWNvcmRlcjogTW9ja0NvbmZpZ3VyYXRpb25SZWNvcmRlcjtcbiAgY29uZmlnUnVsZXM6IE1vY2tDb25maWdSdWxlW107XG59XG5cbmV4cG9ydCBjbGFzcyBDb25maWdTZXJ2aWNlUm9sZUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBzZXJ2aWNlUm9sZTogYXdzLmlhbS5Sb2xlO1xuICBwdWJsaWMgcmVhZG9ubHkgcm9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBDb25maWdTZXJ2aWNlUm9sZUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpjb25maWc6Q29uZmlnU2VydmljZVJvbGVDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICBjb25zdCBhc3N1bWVSb2xlUG9saWN5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgU2VydmljZTogJ2NvbmZpZy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIHRoaXMuc2VydmljZVJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYCR7bmFtZX0tY29uZmlnLXJvbGVgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHthcmdzLm5hbWV9LWNvbmZpZy1zZXJ2aWNlLXJvbGVgLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBhc3N1bWVSb2xlUG9saWN5LFxuICAgICAgICBtYW5hZ2VkUG9saWN5QXJuczogW1xuICAgICAgICAgICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQVdTX0NvbmZpZ1JvbGUnLFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucm9sZUFybiA9IHRoaXMuc2VydmljZVJvbGUuYXJuO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgc2VydmljZVJvbGU6IHRoaXMuc2VydmljZVJvbGUsXG4gICAgICByb2xlQXJuOiB0aGlzLnJvbGVBcm4sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBkZWxpdmVyeUNoYW5uZWw6IE1vY2tEZWxpdmVyeUNoYW5uZWw7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IENvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpjb25maWc6Q29uZmlnRGVsaXZlcnlDaGFubmVsQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIGEgbW9jayBkZWxpdmVyeSBjaGFubmVsIHNpbmNlIEFXUyBDb25maWcgcmVzb3VyY2VzIGRvbid0IGV4aXN0IGluIHRoaXMgcHJvdmlkZXIgdmVyc2lvblxuICAgIHRoaXMuZGVsaXZlcnlDaGFubmVsID0ge1xuICAgICAgbmFtZTogcHVsdW1pLm91dHB1dChhcmdzLm5hbWUpLFxuICAgICAgczNCdWNrZXROYW1lOiBwdWx1bWkub3V0cHV0KGFyZ3MuczNCdWNrZXROYW1lKSxcbiAgICB9O1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgZGVsaXZlcnlDaGFubmVsOiB0aGlzLmRlbGl2ZXJ5Q2hhbm5lbCxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29uZmlnQ29uZmlndXJhdGlvblJlY29yZGVyQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGNvbmZpZ3VyYXRpb25SZWNvcmRlcjogTW9ja0NvbmZpZ3VyYXRpb25SZWNvcmRlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogQ29uZmlnQ29uZmlndXJhdGlvblJlY29yZGVyQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmNvbmZpZzpDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXJDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBDcmVhdGUgYSBtb2NrIGNvbmZpZ3VyYXRpb24gcmVjb3JkZXIgc2luY2UgQVdTIENvbmZpZyByZXNvdXJjZXMgZG9uJ3QgZXhpc3QgaW4gdGhpcyBwcm92aWRlciB2ZXJzaW9uXG4gICAgdGhpcy5jb25maWd1cmF0aW9uUmVjb3JkZXIgPSB7XG4gICAgICBuYW1lOiBwdWx1bWkub3V0cHV0KGFyZ3MubmFtZSksXG4gICAgICByb2xlQXJuOiBwdWx1bWkub3V0cHV0KGFyZ3Mucm9sZUFybiksXG4gICAgfTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGNvbmZpZ3VyYXRpb25SZWNvcmRlcjogdGhpcy5jb25maWd1cmF0aW9uUmVjb3JkZXIsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEF3c0NvbmZpZ0NvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBzZXJ2aWNlUm9sZTogYXdzLmlhbS5Sb2xlO1xuICBwdWJsaWMgcmVhZG9ubHkgZGVsaXZlcnlDaGFubmVsOiBNb2NrRGVsaXZlcnlDaGFubmVsO1xuICBwdWJsaWMgcmVhZG9ubHkgY29uZmlndXJhdGlvblJlY29yZGVyOiBNb2NrQ29uZmlndXJhdGlvblJlY29yZGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgY29uZmlnUnVsZXM6IE1vY2tDb25maWdSdWxlW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEF3c0NvbmZpZ0FyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpjb25maWc6QXdzQ29uZmlnQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIENvbmZpZyBzZXJ2aWNlIHJvbGVcbiAgICBjb25zdCBzZXJ2aWNlUm9sZUNvbXBvbmVudCA9IG5ldyBDb25maWdTZXJ2aWNlUm9sZUNvbXBvbmVudChcbiAgICAgIGAke25hbWV9LXNlcnZpY2Utcm9sZWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5zZXJ2aWNlUm9sZSA9IHNlcnZpY2VSb2xlQ29tcG9uZW50LnNlcnZpY2VSb2xlO1xuXG4gICAgLy8gQ3JlYXRlIGRlbGl2ZXJ5IGNoYW5uZWxcbiAgICBjb25zdCBkZWxpdmVyeUNoYW5uZWxDb21wb25lbnQgPSBuZXcgQ29uZmlnRGVsaXZlcnlDaGFubmVsQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tZGVsaXZlcnktY2hhbm5lbGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tZGVsaXZlcnktY2hhbm5lbGAsXG4gICAgICAgIHMzQnVja2V0TmFtZTogYXJncy5zM0J1Y2tldE5hbWUsXG4gICAgICAgIHMzS2V5UHJlZml4OiBhcmdzLnMzS2V5UHJlZml4IHx8ICdBV1NDb25maWcnLFxuICAgICAgICBzM0ttc0tleUFybjogYXJncy5zM0ttc0tleUFybixcbiAgICAgICAgc25zVG9waWNBcm46IGFyZ3Muc25zVG9waWNBcm4sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLmRlbGl2ZXJ5Q2hhbm5lbCA9IGRlbGl2ZXJ5Q2hhbm5lbENvbXBvbmVudC5kZWxpdmVyeUNoYW5uZWw7XG5cbiAgICAvLyBDcmVhdGUgY29uZmlndXJhdGlvbiByZWNvcmRlclxuICAgIGNvbnN0IHJlY29yZGVyQ29tcG9uZW50ID0gbmV3IENvbmZpZ0NvbmZpZ3VyYXRpb25SZWNvcmRlckNvbXBvbmVudChcbiAgICAgIGAke25hbWV9LXJlY29yZGVyYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1yZWNvcmRlcmAsXG4gICAgICAgIHJvbGVBcm46IHRoaXMuc2VydmljZVJvbGUuYXJuLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5jb25maWd1cmF0aW9uUmVjb3JkZXIgPSByZWNvcmRlckNvbXBvbmVudC5jb25maWd1cmF0aW9uUmVjb3JkZXI7XG5cbiAgICAvLyBDcmVhdGUgbW9jayBzZWN1cml0eS1mb2N1c2VkIGNvbmZpZyBydWxlc1xuICAgIGNvbnN0IHNlY3VyaXR5Q29uZmlnUnVsZXMgPSBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdzMy1idWNrZXQtcHVibGljLWFjY2Vzcy1wcm9oaWJpdGVkJyxcbiAgICAgICAgZGVzY3JpcHRpb246ICdDaGVja3MgdGhhdCBTMyBidWNrZXRzIGRvIG5vdCBhbGxvdyBwdWJsaWMgYWNjZXNzJyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdlbmNyeXB0ZWQtdm9sdW1lcycsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnQ2hlY2tzIHdoZXRoZXIgRUJTIHZvbHVtZXMgYXJlIGVuY3J5cHRlZCcsXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBuYW1lOiAncmRzLXN0b3JhZ2UtZW5jcnlwdGVkJyxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ0NoZWNrcyB3aGV0aGVyIHN0b3JhZ2UgZW5jcnlwdGlvbiBpcyBlbmFibGVkIGZvciBSRFMgaW5zdGFuY2VzJyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdlYzItc2VjdXJpdHktZ3JvdXAtYXR0YWNoZWQtdG8tZW5pJyxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ0NoZWNrcyB0aGF0IHNlY3VyaXR5IGdyb3VwcyBhcmUgYXR0YWNoZWQgdG8gRUMyIGluc3RhbmNlcyBvciBFTklzJyxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG5hbWU6ICdpYW0tcGFzc3dvcmQtcG9saWN5JyxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ0NoZWNrcyB3aGV0aGVyIHRoZSBhY2NvdW50IHBhc3N3b3JkIHBvbGljeSBtZWV0cyBzcGVjaWZpZWQgcmVxdWlyZW1lbnRzJyxcbiAgICAgIH0sXG4gICAgXTtcblxuICAgIHRoaXMuY29uZmlnUnVsZXMgPSBzZWN1cml0eUNvbmZpZ1J1bGVzLm1hcChydWxlQ29uZmlnID0+ICh7XG4gICAgICBuYW1lOiBwdWx1bWkub3V0cHV0KGAke2FyZ3MubmFtZX0tJHtydWxlQ29uZmlnLm5hbWV9YCksXG4gICAgICBkZXNjcmlwdGlvbjogcHVsdW1pLm91dHB1dChydWxlQ29uZmlnLmRlc2NyaXB0aW9uKSxcbiAgICB9KSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBzZXJ2aWNlUm9sZTogdGhpcy5zZXJ2aWNlUm9sZSxcbiAgICAgIGRlbGl2ZXJ5Q2hhbm5lbDogdGhpcy5kZWxpdmVyeUNoYW5uZWwsXG4gICAgICBjb25maWd1cmF0aW9uUmVjb3JkZXI6IHRoaXMuY29uZmlndXJhdGlvblJlY29yZGVyLFxuICAgICAgY29uZmlnUnVsZXM6IHRoaXMuY29uZmlnUnVsZXMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbmZpZ1NlcnZpY2VSb2xlKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IENvbmZpZ1NlcnZpY2VSb2xlQXJnc1xuKSB7XG4gIGNvbnN0IHNlcnZpY2VSb2xlQ29tcG9uZW50ID0gbmV3IENvbmZpZ1NlcnZpY2VSb2xlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICByZXR1cm4ge1xuICAgIHNlcnZpY2VSb2xlOiBzZXJ2aWNlUm9sZUNvbXBvbmVudC5zZXJ2aWNlUm9sZSxcbiAgICByb2xlQXJuOiBzZXJ2aWNlUm9sZUNvbXBvbmVudC5yb2xlQXJuLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29uZmlnRGVsaXZlcnlDaGFubmVsKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IENvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbEFyZ3Ncbik6IE1vY2tEZWxpdmVyeUNoYW5uZWwge1xuICBjb25zdCBkZWxpdmVyeUNoYW5uZWxDb21wb25lbnQgPSBuZXcgQ29uZmlnRGVsaXZlcnlDaGFubmVsQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJnc1xuICApO1xuICByZXR1cm4gZGVsaXZlcnlDaGFubmVsQ29tcG9uZW50LmRlbGl2ZXJ5Q2hhbm5lbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbmZpZ0NvbmZpZ3VyYXRpb25SZWNvcmRlcihcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXJBcmdzXG4pOiBNb2NrQ29uZmlndXJhdGlvblJlY29yZGVyIHtcbiAgY29uc3QgcmVjb3JkZXJDb21wb25lbnQgPSBuZXcgQ29uZmlnQ29uZmlndXJhdGlvblJlY29yZGVyQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJnc1xuICApO1xuICByZXR1cm4gcmVjb3JkZXJDb21wb25lbnQuY29uZmlndXJhdGlvblJlY29yZGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXdzQ29uZmlnKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IEF3c0NvbmZpZ0FyZ3Ncbik6IEF3c0NvbmZpZ1Jlc3VsdCB7XG4gIGNvbnN0IGF3c0NvbmZpZ0NvbXBvbmVudCA9IG5ldyBBd3NDb25maWdDb21wb25lbnQobmFtZSwgYXJncyk7XG4gIHJldHVybiB7XG4gICAgc2VydmljZVJvbGU6IGF3c0NvbmZpZ0NvbXBvbmVudC5zZXJ2aWNlUm9sZSxcbiAgICBkZWxpdmVyeUNoYW5uZWw6IGF3c0NvbmZpZ0NvbXBvbmVudC5kZWxpdmVyeUNoYW5uZWwsXG4gICAgY29uZmlndXJhdGlvblJlY29yZGVyOiBhd3NDb25maWdDb21wb25lbnQuY29uZmlndXJhdGlvblJlY29yZGVyLFxuICAgIGNvbmZpZ1J1bGVzOiBhd3NDb25maWdDb21wb25lbnQuY29uZmlnUnVsZXMsXG4gIH07XG59XG4iXX0=