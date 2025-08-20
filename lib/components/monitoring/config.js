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
        super("aws:config:ConfigServiceRoleComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        const assumeRolePolicy = JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "config.amazonaws.com",
                    },
                }],
        });
        this.serviceRole = new aws.iam.Role(`${name}-config-role`, {
            name: `${args.name}-config-service-role`,
            assumeRolePolicy: assumeRolePolicy,
            managedPolicyArns: [
                "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole",
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
        super("aws:config:ConfigDeliveryChannelComponent", name, {}, opts);
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
        super("aws:config:ConfigConfigurationRecorderComponent", name, {}, opts);
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
        super("aws:config:AwsConfigComponent", name, {}, opts);
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
            s3KeyPrefix: args.s3KeyPrefix || "AWSConfig",
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
                name: "s3-bucket-public-access-prohibited",
                description: "Checks that S3 buckets do not allow public access",
            },
            {
                name: "encrypted-volumes",
                description: "Checks whether EBS volumes are encrypted",
            },
            {
                name: "rds-storage-encrypted",
                description: "Checks whether storage encryption is enabled for RDS instances",
            },
            {
                name: "ec2-security-group-attached-to-eni",
                description: "Checks that security groups are attached to EC2 instances or ENIs",
            },
            {
                name: "iam-password-policy",
                description: "Checks whether the account password policy meets specified requirements",
            },
        ];
        this.configRules = securityConfigRules.map((ruleConfig) => ({
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVOQSwwREFNQztBQUVELGtFQUdDO0FBRUQsOEVBR0M7QUFFRCwwQ0FRQztBQWpQRCx1REFBeUM7QUFDekMsaURBQW1DO0FBNERuQyxNQUFhLDBCQUEyQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEQsV0FBVyxDQUFlO0lBQzFCLE9BQU8sQ0FBd0I7SUFFL0MsWUFBWSxJQUFZLEVBQUUsSUFBMkIsRUFBRSxJQUFzQztRQUN6RixLQUFLLENBQUMsdUNBQXVDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUvRCxNQUFNLFdBQVcsR0FBRztZQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUM5QixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUseUJBQXlCO1lBQ2xDLEdBQUcsSUFBSSxDQUFDLElBQUk7U0FDZixDQUFDO1FBRUYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDO1lBQ3BDLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLFNBQVMsRUFBRSxDQUFDO29CQUNSLE1BQU0sRUFBRSxnQkFBZ0I7b0JBQ3hCLE1BQU0sRUFBRSxPQUFPO29CQUNmLFNBQVMsRUFBRTt3QkFDUCxPQUFPLEVBQUUsc0JBQXNCO3FCQUNsQztpQkFDSixDQUFDO1NBQ0wsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxjQUFjLEVBQUU7WUFDdkQsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksc0JBQXNCO1lBQ3hDLGdCQUFnQixFQUFFLGdCQUFnQjtZQUNsQyxpQkFBaUIsRUFBRTtnQkFDZixxREFBcUQ7YUFDeEQ7WUFDRCxJQUFJLEVBQUUsV0FBVztTQUNwQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQztRQUVwQyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ2pCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVztZQUM3QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87U0FDeEIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBMUNELGdFQTBDQztBQUVELE1BQWEsOEJBQStCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN4RCxlQUFlLENBQXNCO0lBRXJELFlBQVksSUFBWSxFQUFFLElBQStCLEVBQUUsSUFBc0M7UUFDN0YsS0FBSyxDQUFDLDJDQUEyQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFbkUsaUdBQWlHO1FBQ2pHLElBQUksQ0FBQyxlQUFlLEdBQUc7WUFDbkIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUM5QixZQUFZLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDO1NBQ2pELENBQUM7UUFFRixJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ2pCLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZTtTQUN4QyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUFoQkQsd0VBZ0JDO0FBRUQsTUFBYSxvQ0FBcUMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlELHFCQUFxQixDQUE0QjtJQUVqRSxZQUFZLElBQVksRUFBRSxJQUFxQyxFQUFFLElBQXNDO1FBQ25HLEtBQUssQ0FBQyxpREFBaUQsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpFLHVHQUF1RztRQUN2RyxJQUFJLENBQUMscUJBQXFCLEdBQUc7WUFDekIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQztZQUM5QixPQUFPLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1NBQ3ZDLENBQUM7UUFFRixJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ2pCLHFCQUFxQixFQUFFLElBQUksQ0FBQyxxQkFBcUI7U0FDcEQsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBaEJELG9GQWdCQztBQUVELE1BQWEsa0JBQW1CLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUM1QyxXQUFXLENBQWU7SUFDMUIsZUFBZSxDQUFzQjtJQUNyQyxxQkFBcUIsQ0FBNEI7SUFDakQsV0FBVyxDQUFtQjtJQUU5QyxZQUFZLElBQVksRUFBRSxJQUFtQixFQUFFLElBQXNDO1FBQ2pGLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXZELDZCQUE2QjtRQUM3QixNQUFNLG9CQUFvQixHQUFHLElBQUksMEJBQTBCLENBQUMsR0FBRyxJQUFJLGVBQWUsRUFBRTtZQUNoRixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDbEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxXQUFXLEdBQUcsb0JBQW9CLENBQUMsV0FBVyxDQUFDO1FBRXBELDBCQUEwQjtRQUMxQixNQUFNLHdCQUF3QixHQUFHLElBQUksOEJBQThCLENBQUMsR0FBRyxJQUFJLG1CQUFtQixFQUFFO1lBQzVGLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLG1CQUFtQjtZQUNyQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLElBQUksV0FBVztZQUM1QyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1NBQ2hDLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLENBQUMsZUFBZSxHQUFHLHdCQUF3QixDQUFDLGVBQWUsQ0FBQztRQUVoRSxnQ0FBZ0M7UUFDaEMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLG9DQUFvQyxDQUFDLEdBQUcsSUFBSSxXQUFXLEVBQUU7WUFDbkYsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksV0FBVztZQUM3QixPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHO1NBQ2hDLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLENBQUMscUJBQXFCLEdBQUcsaUJBQWlCLENBQUMscUJBQXFCLENBQUM7UUFFckUsNENBQTRDO1FBQzVDLE1BQU0sbUJBQW1CLEdBQUc7WUFDeEI7Z0JBQ0ksSUFBSSxFQUFFLG9DQUFvQztnQkFDMUMsV0FBVyxFQUFFLG1EQUFtRDthQUNuRTtZQUNEO2dCQUNJLElBQUksRUFBRSxtQkFBbUI7Z0JBQ3pCLFdBQVcsRUFBRSwwQ0FBMEM7YUFDMUQ7WUFDRDtnQkFDSSxJQUFJLEVBQUUsdUJBQXVCO2dCQUM3QixXQUFXLEVBQUUsZ0VBQWdFO2FBQ2hGO1lBQ0Q7Z0JBQ0ksSUFBSSxFQUFFLG9DQUFvQztnQkFDMUMsV0FBVyxFQUFFLG1FQUFtRTthQUNuRjtZQUNEO2dCQUNJLElBQUksRUFBRSxxQkFBcUI7Z0JBQzNCLFdBQVcsRUFBRSx5RUFBeUU7YUFDekY7U0FDSixDQUFDO1FBRUYsSUFBSSxDQUFDLFdBQVcsR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDeEQsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN0RCxXQUFXLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDO1NBQ3JELENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNqQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxxQkFBcUI7WUFDakQsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1NBQ2hDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXhFRCxnREF3RUM7QUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxJQUFZLEVBQUUsSUFBMkI7SUFDN0UsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDBCQUEwQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4RSxPQUFPO1FBQ0gsV0FBVyxFQUFFLG9CQUFvQixDQUFDLFdBQVc7UUFDN0MsT0FBTyxFQUFFLG9CQUFvQixDQUFDLE9BQU87S0FDeEMsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQiwyQkFBMkIsQ0FBQyxJQUFZLEVBQUUsSUFBK0I7SUFDckYsTUFBTSx3QkFBd0IsR0FBRyxJQUFJLDhCQUE4QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNoRixPQUFPLHdCQUF3QixDQUFDLGVBQWUsQ0FBQztBQUNwRCxDQUFDO0FBRUQsU0FBZ0IsaUNBQWlDLENBQUMsSUFBWSxFQUFFLElBQXFDO0lBQ2pHLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxvQ0FBb0MsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0UsT0FBTyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQztBQUNuRCxDQUFDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLElBQVksRUFBRSxJQUFtQjtJQUM3RCxNQUFNLGtCQUFrQixHQUFHLElBQUksa0JBQWtCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlELE9BQU87UUFDSCxXQUFXLEVBQUUsa0JBQWtCLENBQUMsV0FBVztRQUMzQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsZUFBZTtRQUNuRCxxQkFBcUIsRUFBRSxrQkFBa0IsQ0FBQyxxQkFBcUI7UUFDL0QsV0FBVyxFQUFFLGtCQUFrQixDQUFDLFdBQVc7S0FDOUMsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uZmlnU2VydmljZVJvbGVBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uZmlnRGVsaXZlcnlDaGFubmVsQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHMzQnVja2V0TmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgczNLZXlQcmVmaXg/OiBzdHJpbmc7XG4gICAgczNLbXNLZXlBcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBzbnNUb3BpY0Fybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHNuYXBzaG90RGVsaXZlcnlQcm9wZXJ0aWVzPzoge1xuICAgICAgICBkZWxpdmVyeUZyZXF1ZW5jeT86IHN0cmluZztcbiAgICB9O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbmZpZ0NvbmZpZ3VyYXRpb25SZWNvcmRlckFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICByb2xlQXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICByZWNvcmRpbmdHcm91cD86IHtcbiAgICAgICAgYWxsU3VwcG9ydGVkPzogYm9vbGVhbjtcbiAgICAgICAgaW5jbHVkZUdsb2JhbFJlc291cmNlVHlwZXM/OiBib29sZWFuO1xuICAgICAgICByZXNvdXJjZVR5cGVzPzogc3RyaW5nW107XG4gICAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBd3NDb25maWdBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgczNCdWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBzM0tleVByZWZpeD86IHN0cmluZztcbiAgICBzM0ttc0tleUFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHNuc1RvcGljQXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbi8vIE1vY2sgaW50ZXJmYWNlcyB0byBtYWludGFpbiBjb21wYXRpYmlsaXR5XG5leHBvcnQgaW50ZXJmYWNlIE1vY2tEZWxpdmVyeUNoYW5uZWwge1xuICAgIG5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBzM0J1Y2tldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBNb2NrQ29uZmlndXJhdGlvblJlY29yZGVyIHtcbiAgICBuYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcm9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1vY2tDb25maWdSdWxlIHtcbiAgICBuYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgZGVzY3JpcHRpb24/OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXdzQ29uZmlnUmVzdWx0IHtcbiAgICBzZXJ2aWNlUm9sZTogYXdzLmlhbS5Sb2xlO1xuICAgIGRlbGl2ZXJ5Q2hhbm5lbDogTW9ja0RlbGl2ZXJ5Q2hhbm5lbDtcbiAgICBjb25maWd1cmF0aW9uUmVjb3JkZXI6IE1vY2tDb25maWd1cmF0aW9uUmVjb3JkZXI7XG4gICAgY29uZmlnUnVsZXM6IE1vY2tDb25maWdSdWxlW107XG59XG5cbmV4cG9ydCBjbGFzcyBDb25maWdTZXJ2aWNlUm9sZUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHNlcnZpY2VSb2xlOiBhd3MuaWFtLlJvbGU7XG4gICAgcHVibGljIHJlYWRvbmx5IHJvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogQ29uZmlnU2VydmljZVJvbGVBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpjb25maWc6Q29uZmlnU2VydmljZVJvbGVDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTm92YS1Nb2RlbC1CcmVha2luZ1wiLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IGFzc3VtZVJvbGVQb2xpY3kgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICAgIFN0YXRlbWVudDogW3tcbiAgICAgICAgICAgICAgICBBY3Rpb246IFwic3RzOkFzc3VtZVJvbGVcIixcbiAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgU2VydmljZTogXCJjb25maWcuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlUm9sZSA9IG5ldyBhd3MuaWFtLlJvbGUoYCR7bmFtZX0tY29uZmlnLXJvbGVgLCB7XG4gICAgICAgICAgICBuYW1lOiBgJHthcmdzLm5hbWV9LWNvbmZpZy1zZXJ2aWNlLXJvbGVgLFxuICAgICAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogYXNzdW1lUm9sZVBvbGljeSxcbiAgICAgICAgICAgIG1hbmFnZWRQb2xpY3lBcm5zOiBbXG4gICAgICAgICAgICAgICAgXCJhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQVdTX0NvbmZpZ1JvbGVcIixcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5yb2xlQXJuID0gdGhpcy5zZXJ2aWNlUm9sZS5hcm47XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgc2VydmljZVJvbGU6IHRoaXMuc2VydmljZVJvbGUsXG4gICAgICAgICAgICByb2xlQXJuOiB0aGlzLnJvbGVBcm4sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGRlbGl2ZXJ5Q2hhbm5lbDogTW9ja0RlbGl2ZXJ5Q2hhbm5lbDtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogQ29uZmlnRGVsaXZlcnlDaGFubmVsQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6Y29uZmlnOkNvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbENvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGEgbW9jayBkZWxpdmVyeSBjaGFubmVsIHNpbmNlIEFXUyBDb25maWcgcmVzb3VyY2VzIGRvbid0IGV4aXN0IGluIHRoaXMgcHJvdmlkZXIgdmVyc2lvblxuICAgICAgICB0aGlzLmRlbGl2ZXJ5Q2hhbm5lbCA9IHtcbiAgICAgICAgICAgIG5hbWU6IHB1bHVtaS5vdXRwdXQoYXJncy5uYW1lKSxcbiAgICAgICAgICAgIHMzQnVja2V0TmFtZTogcHVsdW1pLm91dHB1dChhcmdzLnMzQnVja2V0TmFtZSksXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgZGVsaXZlcnlDaGFubmVsOiB0aGlzLmRlbGl2ZXJ5Q2hhbm5lbCxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ29uZmlnQ29uZmlndXJhdGlvblJlY29yZGVyQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29uZmlndXJhdGlvblJlY29yZGVyOiBNb2NrQ29uZmlndXJhdGlvblJlY29yZGVyO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXJBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpjb25maWc6Q29uZmlnQ29uZmlndXJhdGlvblJlY29yZGVyQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICAvLyBDcmVhdGUgYSBtb2NrIGNvbmZpZ3VyYXRpb24gcmVjb3JkZXIgc2luY2UgQVdTIENvbmZpZyByZXNvdXJjZXMgZG9uJ3QgZXhpc3QgaW4gdGhpcyBwcm92aWRlciB2ZXJzaW9uXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvblJlY29yZGVyID0ge1xuICAgICAgICAgICAgbmFtZTogcHVsdW1pLm91dHB1dChhcmdzLm5hbWUpLFxuICAgICAgICAgICAgcm9sZUFybjogcHVsdW1pLm91dHB1dChhcmdzLnJvbGVBcm4pLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGNvbmZpZ3VyYXRpb25SZWNvcmRlcjogdGhpcy5jb25maWd1cmF0aW9uUmVjb3JkZXIsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEF3c0NvbmZpZ0NvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHNlcnZpY2VSb2xlOiBhd3MuaWFtLlJvbGU7XG4gICAgcHVibGljIHJlYWRvbmx5IGRlbGl2ZXJ5Q2hhbm5lbDogTW9ja0RlbGl2ZXJ5Q2hhbm5lbDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29uZmlndXJhdGlvblJlY29yZGVyOiBNb2NrQ29uZmlndXJhdGlvblJlY29yZGVyO1xuICAgIHB1YmxpYyByZWFkb25seSBjb25maWdSdWxlczogTW9ja0NvbmZpZ1J1bGVbXTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogQXdzQ29uZmlnQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6Y29uZmlnOkF3c0NvbmZpZ0NvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIENvbmZpZyBzZXJ2aWNlIHJvbGVcbiAgICAgICAgY29uc3Qgc2VydmljZVJvbGVDb21wb25lbnQgPSBuZXcgQ29uZmlnU2VydmljZVJvbGVDb21wb25lbnQoYCR7bmFtZX0tc2VydmljZS1yb2xlYCwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnNlcnZpY2VSb2xlID0gc2VydmljZVJvbGVDb21wb25lbnQuc2VydmljZVJvbGU7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGRlbGl2ZXJ5IGNoYW5uZWxcbiAgICAgICAgY29uc3QgZGVsaXZlcnlDaGFubmVsQ29tcG9uZW50ID0gbmV3IENvbmZpZ0RlbGl2ZXJ5Q2hhbm5lbENvbXBvbmVudChgJHtuYW1lfS1kZWxpdmVyeS1jaGFubmVsYCwge1xuICAgICAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1kZWxpdmVyeS1jaGFubmVsYCxcbiAgICAgICAgICAgIHMzQnVja2V0TmFtZTogYXJncy5zM0J1Y2tldE5hbWUsXG4gICAgICAgICAgICBzM0tleVByZWZpeDogYXJncy5zM0tleVByZWZpeCB8fCBcIkFXU0NvbmZpZ1wiLFxuICAgICAgICAgICAgczNLbXNLZXlBcm46IGFyZ3MuczNLbXNLZXlBcm4sXG4gICAgICAgICAgICBzbnNUb3BpY0FybjogYXJncy5zbnNUb3BpY0FybixcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5kZWxpdmVyeUNoYW5uZWwgPSBkZWxpdmVyeUNoYW5uZWxDb21wb25lbnQuZGVsaXZlcnlDaGFubmVsO1xuXG4gICAgICAgIC8vIENyZWF0ZSBjb25maWd1cmF0aW9uIHJlY29yZGVyXG4gICAgICAgIGNvbnN0IHJlY29yZGVyQ29tcG9uZW50ID0gbmV3IENvbmZpZ0NvbmZpZ3VyYXRpb25SZWNvcmRlckNvbXBvbmVudChgJHtuYW1lfS1yZWNvcmRlcmAsIHtcbiAgICAgICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tcmVjb3JkZXJgLFxuICAgICAgICAgICAgcm9sZUFybjogdGhpcy5zZXJ2aWNlUm9sZS5hcm4sXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvblJlY29yZGVyID0gcmVjb3JkZXJDb21wb25lbnQuY29uZmlndXJhdGlvblJlY29yZGVyO1xuXG4gICAgICAgIC8vIENyZWF0ZSBtb2NrIHNlY3VyaXR5LWZvY3VzZWQgY29uZmlnIHJ1bGVzXG4gICAgICAgIGNvbnN0IHNlY3VyaXR5Q29uZmlnUnVsZXMgPSBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJzMy1idWNrZXQtcHVibGljLWFjY2Vzcy1wcm9oaWJpdGVkXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2tzIHRoYXQgUzMgYnVja2V0cyBkbyBub3QgYWxsb3cgcHVibGljIGFjY2Vzc1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcImVuY3J5cHRlZC12b2x1bWVzXCIsXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQ2hlY2tzIHdoZXRoZXIgRUJTIHZvbHVtZXMgYXJlIGVuY3J5cHRlZFwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcInJkcy1zdG9yYWdlLWVuY3J5cHRlZFwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNoZWNrcyB3aGV0aGVyIHN0b3JhZ2UgZW5jcnlwdGlvbiBpcyBlbmFibGVkIGZvciBSRFMgaW5zdGFuY2VzXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiZWMyLXNlY3VyaXR5LWdyb3VwLWF0dGFjaGVkLXRvLWVuaVwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNoZWNrcyB0aGF0IHNlY3VyaXR5IGdyb3VwcyBhcmUgYXR0YWNoZWQgdG8gRUMyIGluc3RhbmNlcyBvciBFTklzXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiaWFtLXBhc3N3b3JkLXBvbGljeVwiLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkNoZWNrcyB3aGV0aGVyIHRoZSBhY2NvdW50IHBhc3N3b3JkIHBvbGljeSBtZWV0cyBzcGVjaWZpZWQgcmVxdWlyZW1lbnRzXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuXG4gICAgICAgIHRoaXMuY29uZmlnUnVsZXMgPSBzZWN1cml0eUNvbmZpZ1J1bGVzLm1hcCgocnVsZUNvbmZpZykgPT4gKHtcbiAgICAgICAgICAgIG5hbWU6IHB1bHVtaS5vdXRwdXQoYCR7YXJncy5uYW1lfS0ke3J1bGVDb25maWcubmFtZX1gKSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBwdWx1bWkub3V0cHV0KHJ1bGVDb25maWcuZGVzY3JpcHRpb24pLFxuICAgICAgICB9KSk7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgc2VydmljZVJvbGU6IHRoaXMuc2VydmljZVJvbGUsXG4gICAgICAgICAgICBkZWxpdmVyeUNoYW5uZWw6IHRoaXMuZGVsaXZlcnlDaGFubmVsLFxuICAgICAgICAgICAgY29uZmlndXJhdGlvblJlY29yZGVyOiB0aGlzLmNvbmZpZ3VyYXRpb25SZWNvcmRlcixcbiAgICAgICAgICAgIGNvbmZpZ1J1bGVzOiB0aGlzLmNvbmZpZ1J1bGVzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb25maWdTZXJ2aWNlUm9sZShuYW1lOiBzdHJpbmcsIGFyZ3M6IENvbmZpZ1NlcnZpY2VSb2xlQXJncykge1xuICAgIGNvbnN0IHNlcnZpY2VSb2xlQ29tcG9uZW50ID0gbmV3IENvbmZpZ1NlcnZpY2VSb2xlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlcnZpY2VSb2xlOiBzZXJ2aWNlUm9sZUNvbXBvbmVudC5zZXJ2aWNlUm9sZSxcbiAgICAgICAgcm9sZUFybjogc2VydmljZVJvbGVDb21wb25lbnQucm9sZUFybixcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29uZmlnRGVsaXZlcnlDaGFubmVsKG5hbWU6IHN0cmluZywgYXJnczogQ29uZmlnRGVsaXZlcnlDaGFubmVsQXJncyk6IE1vY2tEZWxpdmVyeUNoYW5uZWwge1xuICAgIGNvbnN0IGRlbGl2ZXJ5Q2hhbm5lbENvbXBvbmVudCA9IG5ldyBDb25maWdEZWxpdmVyeUNoYW5uZWxDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIGRlbGl2ZXJ5Q2hhbm5lbENvbXBvbmVudC5kZWxpdmVyeUNoYW5uZWw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXIobmFtZTogc3RyaW5nLCBhcmdzOiBDb25maWdDb25maWd1cmF0aW9uUmVjb3JkZXJBcmdzKTogTW9ja0NvbmZpZ3VyYXRpb25SZWNvcmRlciB7XG4gICAgY29uc3QgcmVjb3JkZXJDb21wb25lbnQgPSBuZXcgQ29uZmlnQ29uZmlndXJhdGlvblJlY29yZGVyQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiByZWNvcmRlckNvbXBvbmVudC5jb25maWd1cmF0aW9uUmVjb3JkZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBd3NDb25maWcobmFtZTogc3RyaW5nLCBhcmdzOiBBd3NDb25maWdBcmdzKTogQXdzQ29uZmlnUmVzdWx0IHtcbiAgICBjb25zdCBhd3NDb25maWdDb21wb25lbnQgPSBuZXcgQXdzQ29uZmlnQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlcnZpY2VSb2xlOiBhd3NDb25maWdDb21wb25lbnQuc2VydmljZVJvbGUsXG4gICAgICAgIGRlbGl2ZXJ5Q2hhbm5lbDogYXdzQ29uZmlnQ29tcG9uZW50LmRlbGl2ZXJ5Q2hhbm5lbCxcbiAgICAgICAgY29uZmlndXJhdGlvblJlY29yZGVyOiBhd3NDb25maWdDb21wb25lbnQuY29uZmlndXJhdGlvblJlY29yZGVyLFxuICAgICAgICBjb25maWdSdWxlczogYXdzQ29uZmlnQ29tcG9uZW50LmNvbmZpZ1J1bGVzLFxuICAgIH07XG59Il19