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
exports.AutoScalingGroupComponent = exports.LaunchTemplateComponent = exports.Ec2InstanceComponent = void 0;
exports.createEc2Instance = createEc2Instance;
exports.createLaunchTemplate = createLaunchTemplate;
exports.createAutoScalingGroup = createAutoScalingGroup;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class Ec2InstanceComponent extends pulumi.ComponentResource {
    instance;
    instanceId;
    privateIp;
    publicIp;
    constructor(name, args, opts) {
        super("aws:compute:Ec2InstanceComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        // Get latest Amazon Linux 2 AMI if not specified
        const amiId = args.amiId || aws.ec2.getAmi({
            mostRecent: true,
            owners: ["amazon"],
            filters: [
                {
                    name: "name",
                    values: ["amzn2-ami-hvm-*-x86_64-gp2"],
                },
                {
                    name: "virtualization-type",
                    values: ["hvm"],
                },
            ],
        }).then(ami => ami.id);
        // Default user data for security hardening
        const defaultUserData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/system-logs",
                        "log_stream_name": "{instance_id}/messages"
                    },
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/security-logs",
                        "log_stream_name": "{instance_id}/secure"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Security hardening
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Install security updates
yum update -y --security
`;
        this.instance = new aws.ec2.Instance(`${name}-instance`, {
            ami: amiId,
            instanceType: args.instanceType,
            subnetId: args.subnetId,
            vpcSecurityGroupIds: args.securityGroupIds,
            keyName: args.keyName,
            iamInstanceProfile: args.iamInstanceProfile,
            userData: args.userData || defaultUserData,
            ebsOptimized: args.ebsOptimized ?? true,
            monitoring: args.monitoring ?? true,
            rootBlockDevice: args.rootBlockDevice ? {
                volumeType: args.rootBlockDevice.volumeType || "gp3",
                volumeSize: args.rootBlockDevice.volumeSize || 20,
                deleteOnTermination: args.rootBlockDevice.deleteOnTermination ?? true,
                encrypted: args.rootBlockDevice.encrypted ?? true,
                kmsKeyId: args.rootBlockDevice.kmsKeyId,
            } : {
                volumeType: "gp3",
                volumeSize: 20,
                deleteOnTermination: true,
                encrypted: true,
            },
            tags: defaultTags,
        }, { parent: this });
        this.instanceId = this.instance.id;
        this.privateIp = this.instance.privateIp;
        this.publicIp = this.instance.publicIp;
        this.registerOutputs({
            instance: this.instance,
            instanceId: this.instanceId,
            privateIp: this.privateIp,
            publicIp: this.publicIp,
        });
    }
}
exports.Ec2InstanceComponent = Ec2InstanceComponent;
class LaunchTemplateComponent extends pulumi.ComponentResource {
    launchTemplate;
    launchTemplateId;
    latestVersion;
    constructor(name, args, opts) {
        super("aws:compute:LaunchTemplateComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        // Get latest Amazon Linux 2 AMI if not specified
        const amiId = args.amiId || aws.ec2.getAmi({
            mostRecent: true,
            owners: ["amazon"],
            filters: [
                {
                    name: "name",
                    values: ["amzn2-ami-hvm-*-x86_64-gp2"],
                },
                {
                    name: "virtualization-type",
                    values: ["hvm"],
                },
            ],
        }).then(ami => ami.id);
        // Default user data for security hardening
        const defaultUserData = Buffer.from(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/system-logs",
                        "log_stream_name": "{instance_id}/messages"
                    },
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/security-logs",
                        "log_stream_name": "{instance_id}/secure"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Security hardening
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Install security updates
yum update -y --security
`).toString('base64');
        // Fixed blockDeviceMappings type issues
        const defaultBlockDeviceMappings = args.blockDeviceMappings?.map(mapping => ({
            deviceName: mapping.deviceName,
            ebs: mapping.ebs ? {
                volumeType: mapping.ebs.volumeType,
                volumeSize: mapping.ebs.volumeSize,
                deleteOnTermination: mapping.ebs.deleteOnTermination?.toString(), // Convert boolean to string
                encrypted: mapping.ebs.encrypted?.toString(), // Convert boolean to string
                kmsKeyId: mapping.ebs.kmsKeyId,
            } : undefined,
        })) || [
            {
                deviceName: "/dev/xvda",
                ebs: {
                    volumeType: "gp3",
                    volumeSize: 20,
                    deleteOnTermination: "true", // Use string instead of boolean
                    encrypted: "true", // Use string instead of boolean
                },
            },
        ];
        this.launchTemplate = new aws.ec2.LaunchTemplate(`${name}-lt`, {
            namePrefix: `${args.name}-`,
            imageId: amiId,
            instanceType: args.instanceType,
            keyName: args.keyName,
            vpcSecurityGroupIds: args.securityGroupIds,
            iamInstanceProfile: args.iamInstanceProfile,
            userData: args.userData || defaultUserData,
            ebsOptimized: (args.ebsOptimized ?? true).toString(), // Convert boolean to string
            monitoring: {
                enabled: args.monitoring ?? true,
            },
            blockDeviceMappings: defaultBlockDeviceMappings,
            tagSpecifications: [
                {
                    resourceType: "instance",
                    tags: defaultTags,
                },
                {
                    resourceType: "volume",
                    tags: defaultTags,
                },
            ],
            tags: defaultTags,
        }, { parent: this });
        this.launchTemplateId = this.launchTemplate.id;
        // Handle both mock (string) and real Pulumi output (number) cases
        const rawLatestVersion = this.launchTemplate.latestVersion;
        if (typeof rawLatestVersion === 'string') {
            // Mock case: already a string
            this.latestVersion = pulumi.output(rawLatestVersion);
        }
        else if (rawLatestVersion && typeof rawLatestVersion === 'object' && 'apply' in rawLatestVersion) {
            // Real Pulumi output case: has apply method
            this.latestVersion = rawLatestVersion.apply((v) => v.toString());
        }
        else {
            // Fallback case: convert to string
            this.latestVersion = pulumi.output(String(rawLatestVersion));
        }
        this.registerOutputs({
            launchTemplate: this.launchTemplate,
            launchTemplateId: this.launchTemplateId,
            latestVersion: this.latestVersion,
        });
    }
}
exports.LaunchTemplateComponent = LaunchTemplateComponent;
class AutoScalingGroupComponent extends pulumi.ComponentResource {
    autoScalingGroup;
    autoScalingGroupName;
    autoScalingGroupArn;
    constructor(name, args, opts) {
        super("aws:compute:AutoScalingGroupComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        // Convert tags to ASG tag format
        const asgTags = Object.entries(defaultTags).map(([key, value]) => ({
            key: key,
            value: value,
            propagateAtLaunch: true,
        }));
        this.autoScalingGroup = new aws.autoscaling.Group(`${name}-asg`, {
            name: args.name,
            minSize: args.minSize,
            maxSize: args.maxSize,
            desiredCapacity: args.desiredCapacity,
            vpcZoneIdentifiers: args.subnetIds,
            targetGroupArns: args.targetGroupArns,
            healthCheckType: args.healthCheckType || "ELB",
            healthCheckGracePeriod: args.healthCheckGracePeriod || 300,
            launchTemplate: {
                id: args.launchTemplate.id,
                version: args.launchTemplate.version,
            },
            tags: asgTags,
        }, { parent: this });
        this.autoScalingGroupName = this.autoScalingGroup.name;
        this.autoScalingGroupArn = this.autoScalingGroup.arn;
        this.registerOutputs({
            autoScalingGroup: this.autoScalingGroup,
            autoScalingGroupName: this.autoScalingGroupName,
            autoScalingGroupArn: this.autoScalingGroupArn,
        });
    }
}
exports.AutoScalingGroupComponent = AutoScalingGroupComponent;
function createEc2Instance(name, args) {
    const ec2Component = new Ec2InstanceComponent(name, args);
    return {
        instance: ec2Component.instance,
        instanceId: ec2Component.instanceId,
        privateIp: ec2Component.privateIp,
        publicIp: ec2Component.publicIp,
    };
}
function createLaunchTemplate(name, args) {
    const launchTemplateComponent = new LaunchTemplateComponent(name, args);
    return {
        launchTemplate: launchTemplateComponent.launchTemplate,
        launchTemplateId: launchTemplateComponent.launchTemplateId,
        latestVersion: launchTemplateComponent.latestVersion,
    };
}
function createAutoScalingGroup(name, args) {
    const asgComponent = new AutoScalingGroupComponent(name, args);
    return {
        autoScalingGroup: asgComponent.autoScalingGroup,
        autoScalingGroupName: asgComponent.autoScalingGroupName,
        autoScalingGroupArn: asgComponent.autoScalingGroupArn,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWMyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJYQSw4Q0FRQztBQUVELG9EQU9DO0FBRUQsd0RBT0M7QUFyWkQsdURBQXlDO0FBQ3pDLGlEQUFtQztBQXdFbkMsTUFBYSxvQkFBcUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLFFBQVEsQ0FBbUI7SUFDM0IsVUFBVSxDQUF3QjtJQUNsQyxTQUFTLENBQXdCO0lBQ2pDLFFBQVEsQ0FBeUI7SUFFakQsWUFBWSxJQUFZLEVBQUUsSUFBcUIsRUFBRSxJQUFzQztRQUNuRixLQUFLLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUxRCxNQUFNLFdBQVcsR0FBRztZQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUM5QixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUseUJBQXlCO1lBQ2xDLEdBQUcsSUFBSSxDQUFDLElBQUk7U0FDZixDQUFDO1FBRUYsaURBQWlEO1FBQ2pELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7WUFDdkMsVUFBVSxFQUFFLElBQUk7WUFDaEIsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDO1lBQ2xCLE9BQU8sRUFBRTtnQkFDTDtvQkFDSSxJQUFJLEVBQUUsTUFBTTtvQkFDWixNQUFNLEVBQUUsQ0FBQyw0QkFBNEIsQ0FBQztpQkFDekM7Z0JBQ0Q7b0JBQ0ksSUFBSSxFQUFFLHFCQUFxQjtvQkFDM0IsTUFBTSxFQUFFLENBQUMsS0FBSyxDQUFDO2lCQUNsQjthQUNKO1NBQ0osQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV2QiwyQ0FBMkM7UUFDM0MsTUFBTSxlQUFlLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBc0MvQixDQUFDO1FBRU0sSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxXQUFXLEVBQUU7WUFDckQsR0FBRyxFQUFFLEtBQUs7WUFDVixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLG1CQUFtQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDMUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1lBQ3JCLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0I7WUFDM0MsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksZUFBZTtZQUMxQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJO1lBQ3ZDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxJQUFJLElBQUk7WUFDbkMsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO2dCQUNwQyxVQUFVLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxVQUFVLElBQUksS0FBSztnQkFDcEQsVUFBVSxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsVUFBVSxJQUFJLEVBQUU7Z0JBQ2pELG1CQUFtQixFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsbUJBQW1CLElBQUksSUFBSTtnQkFDckUsU0FBUyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsU0FBUyxJQUFJLElBQUk7Z0JBQ2pELFFBQVEsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVE7YUFDMUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0EsVUFBVSxFQUFFLEtBQUs7Z0JBQ2pCLFVBQVUsRUFBRSxFQUFFO2dCQUNkLG1CQUFtQixFQUFFLElBQUk7Z0JBQ3pCLFNBQVMsRUFBRSxJQUFJO2FBQ2xCO1lBQ0QsSUFBSSxFQUFFLFdBQVc7U0FDcEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztRQUN6QyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBRXZDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDakIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDekIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1NBQzFCLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQTlHRCxvREE4R0M7QUFFRCxNQUFhLHVCQUF3QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDakQsY0FBYyxDQUF5QjtJQUN2QyxnQkFBZ0IsQ0FBd0I7SUFDeEMsYUFBYSxDQUF3QjtJQUVyRCxZQUFZLElBQVksRUFBRSxJQUF3QixFQUFFLElBQXNDO1FBQ3RGLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTdELE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNmLENBQUM7UUFFRixpREFBaUQ7UUFDakQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztZQUN2QyxVQUFVLEVBQUUsSUFBSTtZQUNoQixNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUM7WUFDbEIsT0FBTyxFQUFFO2dCQUNMO29CQUNJLElBQUksRUFBRSxNQUFNO29CQUNaLE1BQU0sRUFBRSxDQUFDLDRCQUE0QixDQUFDO2lCQUN6QztnQkFDRDtvQkFDSSxJQUFJLEVBQUUscUJBQXFCO29CQUMzQixNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUM7aUJBQ2xCO2FBQ0o7U0FDSixDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXZCLDJDQUEyQztRQUMzQyxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQXNDM0MsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVkLHdDQUF3QztRQUN4QyxNQUFNLDBCQUEwQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3pFLFVBQVUsRUFBRSxPQUFPLENBQUMsVUFBVTtZQUM5QixHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQ2YsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVTtnQkFDbEMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVTtnQkFDbEMsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxRQUFRLEVBQUUsRUFBRSw0QkFBNEI7Z0JBQzlGLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsRUFBRSw0QkFBNEI7Z0JBQzFFLFFBQVEsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVE7YUFDakMsQ0FBQyxDQUFDLENBQUMsU0FBUztTQUNoQixDQUFDLENBQUMsSUFBSTtZQUNIO2dCQUNJLFVBQVUsRUFBRSxXQUFXO2dCQUN2QixHQUFHLEVBQUU7b0JBQ0QsVUFBVSxFQUFFLEtBQUs7b0JBQ2pCLFVBQVUsRUFBRSxFQUFFO29CQUNkLG1CQUFtQixFQUFFLE1BQU0sRUFBRSxnQ0FBZ0M7b0JBQzdELFNBQVMsRUFBRSxNQUFNLEVBQUUsZ0NBQWdDO2lCQUN0RDthQUNKO1NBQ0osQ0FBQztRQUVGLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFO1lBQzNELFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEdBQUc7WUFDM0IsT0FBTyxFQUFFLEtBQUs7WUFDZCxZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1lBQ3JCLG1CQUFtQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDMUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQjtZQUMzQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxlQUFlO1lBQzFDLFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsNEJBQTRCO1lBQ2xGLFVBQVUsRUFBRTtnQkFDUixPQUFPLEVBQUUsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJO2FBQ25DO1lBQ0QsbUJBQW1CLEVBQUUsMEJBQTBCO1lBQy9DLGlCQUFpQixFQUFFO2dCQUNmO29CQUNJLFlBQVksRUFBRSxVQUFVO29CQUN4QixJQUFJLEVBQUUsV0FBVztpQkFDcEI7Z0JBQ0Q7b0JBQ0ksWUFBWSxFQUFFLFFBQVE7b0JBQ3RCLElBQUksRUFBRSxXQUFXO2lCQUNwQjthQUNKO1lBQ0QsSUFBSSxFQUFFLFdBQVc7U0FDcEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQztRQUUvQyxrRUFBa0U7UUFDbEUsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQztRQUMzRCxJQUFJLE9BQU8sZ0JBQWdCLEtBQUssUUFBUSxFQUFFLENBQUM7WUFDdkMsOEJBQThCO1lBQzlCLElBQUksQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3pELENBQUM7YUFBTSxJQUFJLGdCQUFnQixJQUFJLE9BQU8sZ0JBQWdCLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO1lBQ2pHLDRDQUE0QztZQUM1QyxJQUFJLENBQUMsYUFBYSxHQUFJLGdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7UUFDbkYsQ0FBQzthQUFNLENBQUM7WUFDSixtQ0FBbUM7WUFDbkMsSUFBSSxDQUFDLGFBQWEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELElBQUksQ0FBQyxlQUFlLENBQUM7WUFDakIsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO1lBQ25DLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDdkMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1NBQ3BDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQTlJRCwwREE4SUM7QUFFRCxNQUFhLHlCQUEwQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDbkQsZ0JBQWdCLENBQXdCO0lBQ3hDLG9CQUFvQixDQUF3QjtJQUM1QyxtQkFBbUIsQ0FBd0I7SUFFM0QsWUFBWSxJQUFZLEVBQUUsSUFBMEIsRUFBRSxJQUFzQztRQUN4RixLQUFLLENBQUMsdUNBQXVDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUvRCxNQUFNLFdBQVcsR0FBRztZQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUM5QixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUseUJBQXlCO1lBQ2xDLEdBQUcsSUFBSSxDQUFDLElBQUk7U0FDZixDQUFDO1FBRUYsaUNBQWlDO1FBQ2pDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDL0QsR0FBRyxFQUFFLEdBQUc7WUFDUixLQUFLLEVBQUUsS0FBSztZQUNaLGlCQUFpQixFQUFFLElBQUk7U0FDMUIsQ0FBQyxDQUFDLENBQUM7UUFFSixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksTUFBTSxFQUFFO1lBQzdELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztZQUNyQixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87WUFDckIsZUFBZSxFQUFFLElBQUksQ0FBQyxlQUFlO1lBQ3JDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ2xDLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZTtZQUNyQyxlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWUsSUFBSSxLQUFLO1lBQzlDLHNCQUFzQixFQUFFLElBQUksQ0FBQyxzQkFBc0IsSUFBSSxHQUFHO1lBQzFELGNBQWMsRUFBRTtnQkFDWixFQUFFLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFO2dCQUMxQixPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPO2FBQ3ZDO1lBQ0QsSUFBSSxFQUFFLE9BQU87U0FDaEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDO1FBQ3ZELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDO1FBRXJELElBQUksQ0FBQyxlQUFlLENBQUM7WUFDakIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtZQUN2QyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CO1lBQy9DLG1CQUFtQixFQUFFLElBQUksQ0FBQyxtQkFBbUI7U0FDaEQsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBaERELDhEQWdEQztBQUVELFNBQWdCLGlCQUFpQixDQUFDLElBQVksRUFBRSxJQUFxQjtJQUNqRSxNQUFNLFlBQVksR0FBRyxJQUFJLG9CQUFvQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxRCxPQUFPO1FBQ0gsUUFBUSxFQUFFLFlBQVksQ0FBQyxRQUFRO1FBQy9CLFVBQVUsRUFBRSxZQUFZLENBQUMsVUFBVTtRQUNuQyxTQUFTLEVBQUUsWUFBWSxDQUFDLFNBQVM7UUFDakMsUUFBUSxFQUFFLFlBQVksQ0FBQyxRQUFRO0tBQ2xDLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBZ0Isb0JBQW9CLENBQUMsSUFBWSxFQUFFLElBQXdCO0lBQ3ZFLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDeEUsT0FBTztRQUNILGNBQWMsRUFBRSx1QkFBdUIsQ0FBQyxjQUFjO1FBQ3RELGdCQUFnQixFQUFFLHVCQUF1QixDQUFDLGdCQUFnQjtRQUMxRCxhQUFhLEVBQUUsdUJBQXVCLENBQUMsYUFBYTtLQUN2RCxDQUFDO0FBQ04sQ0FBQztBQUVELFNBQWdCLHNCQUFzQixDQUFDLElBQVksRUFBRSxJQUEwQjtJQUMzRSxNQUFNLFlBQVksR0FBRyxJQUFJLHlCQUF5QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvRCxPQUFPO1FBQ0gsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLGdCQUFnQjtRQUMvQyxvQkFBb0IsRUFBRSxZQUFZLENBQUMsb0JBQW9CO1FBQ3ZELG1CQUFtQixFQUFFLFlBQVksQ0FBQyxtQkFBbUI7S0FDeEQsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWMySW5zdGFuY2VBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgaW5zdGFuY2VUeXBlOiBzdHJpbmc7XG4gICAgYW1pSWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBzdWJuZXRJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgc2VjdXJpdHlHcm91cElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgICBrZXlOYW1lPzogc3RyaW5nO1xuICAgIGlhbUluc3RhbmNlUHJvZmlsZT86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHVzZXJEYXRhPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgZWJzT3B0aW1pemVkPzogYm9vbGVhbjtcbiAgICBtb25pdG9yaW5nPzogYm9vbGVhbjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICByb290QmxvY2tEZXZpY2U/OiB7XG4gICAgICAgIHZvbHVtZVR5cGU/OiBzdHJpbmc7XG4gICAgICAgIHZvbHVtZVNpemU/OiBudW1iZXI7XG4gICAgICAgIGRlbGV0ZU9uVGVybWluYXRpb24/OiBib29sZWFuO1xuICAgICAgICBlbmNyeXB0ZWQ/OiBib29sZWFuO1xuICAgICAgICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIH07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWMySW5zdGFuY2VSZXN1bHQge1xuICAgIGluc3RhbmNlOiBhd3MuZWMyLkluc3RhbmNlO1xuICAgIGluc3RhbmNlSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwcml2YXRlSXA6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWNJcD86IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBdXRvU2NhbGluZ0dyb3VwQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIG1pblNpemU6IG51bWJlcjtcbiAgICBtYXhTaXplOiBudW1iZXI7XG4gICAgZGVzaXJlZENhcGFjaXR5OiBudW1iZXI7XG4gICAgc3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICAgIHRhcmdldEdyb3VwQXJucz86IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gICAgaGVhbHRoQ2hlY2tUeXBlPzogc3RyaW5nO1xuICAgIGhlYWx0aENoZWNrR3JhY2VQZXJpb2Q/OiBudW1iZXI7XG4gICAgbGF1bmNoVGVtcGxhdGU6IHtcbiAgICAgICAgaWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgICAgICB2ZXJzaW9uOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICB9O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExhdW5jaFRlbXBsYXRlQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGluc3RhbmNlVHlwZTogc3RyaW5nO1xuICAgIGFtaUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgc2VjdXJpdHlHcm91cElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgICBrZXlOYW1lPzogc3RyaW5nO1xuICAgIGlhbUluc3RhbmNlUHJvZmlsZT86IHtcbiAgICAgICAgbmFtZT86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgICAgICBhcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICB9O1xuICAgIHVzZXJEYXRhPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgZWJzT3B0aW1pemVkPzogYm9vbGVhbjtcbiAgICBtb25pdG9yaW5nPzogYm9vbGVhbjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgICBibG9ja0RldmljZU1hcHBpbmdzPzogQXJyYXk8e1xuICAgICAgICBkZXZpY2VOYW1lOiBzdHJpbmc7XG4gICAgICAgIGVicz86IHtcbiAgICAgICAgICAgIHZvbHVtZVR5cGU/OiBzdHJpbmc7XG4gICAgICAgICAgICB2b2x1bWVTaXplPzogbnVtYmVyO1xuICAgICAgICAgICAgZGVsZXRlT25UZXJtaW5hdGlvbj86IGJvb2xlYW47XG4gICAgICAgICAgICBlbmNyeXB0ZWQ/OiBib29sZWFuO1xuICAgICAgICAgICAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICAgICAgfTtcbiAgICB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIEVjMkluc3RhbmNlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2U6IGF3cy5lYzIuSW5zdGFuY2U7XG4gICAgcHVibGljIHJlYWRvbmx5IGluc3RhbmNlSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZUlwOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0lwPzogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBFYzJJbnN0YW5jZUFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmNvbXB1dGU6RWMySW5zdGFuY2VDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTm92YS1Nb2RlbC1CcmVha2luZ1wiLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEdldCBsYXRlc3QgQW1hem9uIExpbnV4IDIgQU1JIGlmIG5vdCBzcGVjaWZpZWRcbiAgICAgICAgY29uc3QgYW1pSWQgPSBhcmdzLmFtaUlkIHx8IGF3cy5lYzIuZ2V0QW1pKHtcbiAgICAgICAgICAgIG1vc3RSZWNlbnQ6IHRydWUsXG4gICAgICAgICAgICBvd25lcnM6IFtcImFtYXpvblwiXSxcbiAgICAgICAgICAgIGZpbHRlcnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwibmFtZVwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtcImFtem4yLWFtaS1odm0tKi14ODZfNjQtZ3AyXCJdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcInZpcnR1YWxpemF0aW9uLXR5cGVcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzOiBbXCJodm1cIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pLnRoZW4oYW1pID0+IGFtaS5pZCk7XG5cbiAgICAgICAgLy8gRGVmYXVsdCB1c2VyIGRhdGEgZm9yIHNlY3VyaXR5IGhhcmRlbmluZ1xuICAgICAgICBjb25zdCBkZWZhdWx0VXNlckRhdGEgPSBgIyEvYmluL2Jhc2hcbnl1bSB1cGRhdGUgLXlcbnl1bSBpbnN0YWxsIC15IGFtYXpvbi1jbG91ZHdhdGNoLWFnZW50XG55dW0gaW5zdGFsbCAteSBhd3Nsb2dzXG5cbiMgQ29uZmlndXJlIENsb3VkV2F0Y2ggYWdlbnRcbmNhdCA8PEVPRiA+IC9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2V0Yy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5qc29uXG57XG4gICAgXCJsb2dzXCI6IHtcbiAgICAgICAgXCJsb2dzX2NvbGxlY3RlZFwiOiB7XG4gICAgICAgICAgICBcImZpbGVzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNvbGxlY3RfbGlzdFwiOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZmlsZV9wYXRoXCI6IFwiL3Zhci9sb2cvbWVzc2FnZXNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nX2dyb3VwX25hbWVcIjogXCIvYXdzL2VjMi9zeXN0ZW0tbG9nc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dfc3RyZWFtX25hbWVcIjogXCJ7aW5zdGFuY2VfaWR9L21lc3NhZ2VzXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJmaWxlX3BhdGhcIjogXCIvdmFyL2xvZy9zZWN1cmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nX2dyb3VwX25hbWVcIjogXCIvYXdzL2VjMi9zZWN1cml0eS1sb2dzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ19zdHJlYW1fbmFtZVwiOiBcIntpbnN0YW5jZV9pZH0vc2VjdXJlXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbkVPRlxuXG4jIFN0YXJ0IENsb3VkV2F0Y2ggYWdlbnRcbi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2Jpbi9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC1jdGwgLWEgZmV0Y2gtY29uZmlnIC1tIGVjMiAtYyBmaWxlOi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2V0Yy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5qc29uIC1zXG5cbiMgU2VjdXJpdHkgaGFyZGVuaW5nXG5zZWQgLWkgJ3MvI1Bhc3N3b3JkQXV0aGVudGljYXRpb24geWVzL1Bhc3N3b3JkQXV0aGVudGljYXRpb24gbm8vJyAvZXRjL3NzaC9zc2hkX2NvbmZpZ1xuc3lzdGVtY3RsIHJlc3RhcnQgc3NoZFxuXG4jIEluc3RhbGwgc2VjdXJpdHkgdXBkYXRlc1xueXVtIHVwZGF0ZSAteSAtLXNlY3VyaXR5XG5gO1xuXG4gICAgICAgIHRoaXMuaW5zdGFuY2UgPSBuZXcgYXdzLmVjMi5JbnN0YW5jZShgJHtuYW1lfS1pbnN0YW5jZWAsIHtcbiAgICAgICAgICAgIGFtaTogYW1pSWQsXG4gICAgICAgICAgICBpbnN0YW5jZVR5cGU6IGFyZ3MuaW5zdGFuY2VUeXBlLFxuICAgICAgICAgICAgc3VibmV0SWQ6IGFyZ3Muc3VibmV0SWQsXG4gICAgICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBhcmdzLnNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgICAgICBrZXlOYW1lOiBhcmdzLmtleU5hbWUsXG4gICAgICAgICAgICBpYW1JbnN0YW5jZVByb2ZpbGU6IGFyZ3MuaWFtSW5zdGFuY2VQcm9maWxlLFxuICAgICAgICAgICAgdXNlckRhdGE6IGFyZ3MudXNlckRhdGEgfHwgZGVmYXVsdFVzZXJEYXRhLFxuICAgICAgICAgICAgZWJzT3B0aW1pemVkOiBhcmdzLmVic09wdGltaXplZCA/PyB0cnVlLFxuICAgICAgICAgICAgbW9uaXRvcmluZzogYXJncy5tb25pdG9yaW5nID8/IHRydWUsXG4gICAgICAgICAgICByb290QmxvY2tEZXZpY2U6IGFyZ3Mucm9vdEJsb2NrRGV2aWNlID8ge1xuICAgICAgICAgICAgICAgIHZvbHVtZVR5cGU6IGFyZ3Mucm9vdEJsb2NrRGV2aWNlLnZvbHVtZVR5cGUgfHwgXCJncDNcIixcbiAgICAgICAgICAgICAgICB2b2x1bWVTaXplOiBhcmdzLnJvb3RCbG9ja0RldmljZS52b2x1bWVTaXplIHx8IDIwLFxuICAgICAgICAgICAgICAgIGRlbGV0ZU9uVGVybWluYXRpb246IGFyZ3Mucm9vdEJsb2NrRGV2aWNlLmRlbGV0ZU9uVGVybWluYXRpb24gPz8gdHJ1ZSxcbiAgICAgICAgICAgICAgICBlbmNyeXB0ZWQ6IGFyZ3Mucm9vdEJsb2NrRGV2aWNlLmVuY3J5cHRlZCA/PyB0cnVlLFxuICAgICAgICAgICAgICAgIGttc0tleUlkOiBhcmdzLnJvb3RCbG9ja0RldmljZS5rbXNLZXlJZCxcbiAgICAgICAgICAgIH0gOiB7XG4gICAgICAgICAgICAgICAgdm9sdW1lVHlwZTogXCJncDNcIixcbiAgICAgICAgICAgICAgICB2b2x1bWVTaXplOiAyMCxcbiAgICAgICAgICAgICAgICBkZWxldGVPblRlcm1pbmF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgICAgIGVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5pbnN0YW5jZUlkID0gdGhpcy5pbnN0YW5jZS5pZDtcbiAgICAgICAgdGhpcy5wcml2YXRlSXAgPSB0aGlzLmluc3RhbmNlLnByaXZhdGVJcDtcbiAgICAgICAgdGhpcy5wdWJsaWNJcCA9IHRoaXMuaW5zdGFuY2UucHVibGljSXA7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgaW5zdGFuY2U6IHRoaXMuaW5zdGFuY2UsXG4gICAgICAgICAgICBpbnN0YW5jZUlkOiB0aGlzLmluc3RhbmNlSWQsXG4gICAgICAgICAgICBwcml2YXRlSXA6IHRoaXMucHJpdmF0ZUlwLFxuICAgICAgICAgICAgcHVibGljSXA6IHRoaXMucHVibGljSXAsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIExhdW5jaFRlbXBsYXRlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGF1bmNoVGVtcGxhdGU6IGF3cy5lYzIuTGF1bmNoVGVtcGxhdGU7XG4gICAgcHVibGljIHJlYWRvbmx5IGxhdW5jaFRlbXBsYXRlSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbGF0ZXN0VmVyc2lvbjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBMYXVuY2hUZW1wbGF0ZUFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmNvbXB1dGU6TGF1bmNoVGVtcGxhdGVDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTm92YS1Nb2RlbC1CcmVha2luZ1wiLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEdldCBsYXRlc3QgQW1hem9uIExpbnV4IDIgQU1JIGlmIG5vdCBzcGVjaWZpZWRcbiAgICAgICAgY29uc3QgYW1pSWQgPSBhcmdzLmFtaUlkIHx8IGF3cy5lYzIuZ2V0QW1pKHtcbiAgICAgICAgICAgIG1vc3RSZWNlbnQ6IHRydWUsXG4gICAgICAgICAgICBvd25lcnM6IFtcImFtYXpvblwiXSxcbiAgICAgICAgICAgIGZpbHRlcnM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwibmFtZVwiLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtcImFtem4yLWFtaS1odm0tKi14ODZfNjQtZ3AyXCJdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcInZpcnR1YWxpemF0aW9uLXR5cGVcIixcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzOiBbXCJodm1cIl0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0pLnRoZW4oYW1pID0+IGFtaS5pZCk7XG5cbiAgICAgICAgLy8gRGVmYXVsdCB1c2VyIGRhdGEgZm9yIHNlY3VyaXR5IGhhcmRlbmluZ1xuICAgICAgICBjb25zdCBkZWZhdWx0VXNlckRhdGEgPSBCdWZmZXIuZnJvbShgIyEvYmluL2Jhc2hcbnl1bSB1cGRhdGUgLXlcbnl1bSBpbnN0YWxsIC15IGFtYXpvbi1jbG91ZHdhdGNoLWFnZW50XG55dW0gaW5zdGFsbCAteSBhd3Nsb2dzXG5cbiMgQ29uZmlndXJlIENsb3VkV2F0Y2ggYWdlbnRcbmNhdCA8PEVPRiA+IC9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2V0Yy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5qc29uXG57XG4gICAgXCJsb2dzXCI6IHtcbiAgICAgICAgXCJsb2dzX2NvbGxlY3RlZFwiOiB7XG4gICAgICAgICAgICBcImZpbGVzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNvbGxlY3RfbGlzdFwiOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZmlsZV9wYXRoXCI6IFwiL3Zhci9sb2cvbWVzc2FnZXNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nX2dyb3VwX25hbWVcIjogXCIvYXdzL2VjMi9zeXN0ZW0tbG9nc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dfc3RyZWFtX25hbWVcIjogXCJ7aW5zdGFuY2VfaWR9L21lc3NhZ2VzXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJmaWxlX3BhdGhcIjogXCIvdmFyL2xvZy9zZWN1cmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nX2dyb3VwX25hbWVcIjogXCIvYXdzL2VjMi9zZWN1cml0eS1sb2dzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ19zdHJlYW1fbmFtZVwiOiBcIntpbnN0YW5jZV9pZH0vc2VjdXJlXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbkVPRlxuXG4jIFN0YXJ0IENsb3VkV2F0Y2ggYWdlbnRcbi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2Jpbi9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC1jdGwgLWEgZmV0Y2gtY29uZmlnIC1tIGVjMiAtYyBmaWxlOi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2V0Yy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5qc29uIC1zXG5cbiMgU2VjdXJpdHkgaGFyZGVuaW5nXG5zZWQgLWkgJ3MvI1Bhc3N3b3JkQXV0aGVudGljYXRpb24geWVzL1Bhc3N3b3JkQXV0aGVudGljYXRpb24gbm8vJyAvZXRjL3NzaC9zc2hkX2NvbmZpZ1xuc3lzdGVtY3RsIHJlc3RhcnQgc3NoZFxuXG4jIEluc3RhbGwgc2VjdXJpdHkgdXBkYXRlc1xueXVtIHVwZGF0ZSAteSAtLXNlY3VyaXR5XG5gKS50b1N0cmluZygnYmFzZTY0Jyk7XG5cbiAgICAgICAgLy8gRml4ZWQgYmxvY2tEZXZpY2VNYXBwaW5ncyB0eXBlIGlzc3Vlc1xuICAgICAgICBjb25zdCBkZWZhdWx0QmxvY2tEZXZpY2VNYXBwaW5ncyA9IGFyZ3MuYmxvY2tEZXZpY2VNYXBwaW5ncz8ubWFwKG1hcHBpbmcgPT4gKHtcbiAgICAgICAgICAgIGRldmljZU5hbWU6IG1hcHBpbmcuZGV2aWNlTmFtZSxcbiAgICAgICAgICAgIGViczogbWFwcGluZy5lYnMgPyB7XG4gICAgICAgICAgICAgICAgdm9sdW1lVHlwZTogbWFwcGluZy5lYnMudm9sdW1lVHlwZSxcbiAgICAgICAgICAgICAgICB2b2x1bWVTaXplOiBtYXBwaW5nLmVicy52b2x1bWVTaXplLFxuICAgICAgICAgICAgICAgIGRlbGV0ZU9uVGVybWluYXRpb246IG1hcHBpbmcuZWJzLmRlbGV0ZU9uVGVybWluYXRpb24/LnRvU3RyaW5nKCksIC8vIENvbnZlcnQgYm9vbGVhbiB0byBzdHJpbmdcbiAgICAgICAgICAgICAgICBlbmNyeXB0ZWQ6IG1hcHBpbmcuZWJzLmVuY3J5cHRlZD8udG9TdHJpbmcoKSwgLy8gQ29udmVydCBib29sZWFuIHRvIHN0cmluZ1xuICAgICAgICAgICAgICAgIGttc0tleUlkOiBtYXBwaW5nLmVicy5rbXNLZXlJZCxcbiAgICAgICAgICAgIH0gOiB1bmRlZmluZWQsXG4gICAgICAgIH0pKSB8fCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZGV2aWNlTmFtZTogXCIvZGV2L3h2ZGFcIixcbiAgICAgICAgICAgICAgICBlYnM6IHtcbiAgICAgICAgICAgICAgICAgICAgdm9sdW1lVHlwZTogXCJncDNcIixcbiAgICAgICAgICAgICAgICAgICAgdm9sdW1lU2l6ZTogMjAsXG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZU9uVGVybWluYXRpb246IFwidHJ1ZVwiLCAvLyBVc2Ugc3RyaW5nIGluc3RlYWQgb2YgYm9vbGVhblxuICAgICAgICAgICAgICAgICAgICBlbmNyeXB0ZWQ6IFwidHJ1ZVwiLCAvLyBVc2Ugc3RyaW5nIGluc3RlYWQgb2YgYm9vbGVhblxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdO1xuXG4gICAgICAgIHRoaXMubGF1bmNoVGVtcGxhdGUgPSBuZXcgYXdzLmVjMi5MYXVuY2hUZW1wbGF0ZShgJHtuYW1lfS1sdGAsIHtcbiAgICAgICAgICAgIG5hbWVQcmVmaXg6IGAke2FyZ3MubmFtZX0tYCxcbiAgICAgICAgICAgIGltYWdlSWQ6IGFtaUlkLFxuICAgICAgICAgICAgaW5zdGFuY2VUeXBlOiBhcmdzLmluc3RhbmNlVHlwZSxcbiAgICAgICAgICAgIGtleU5hbWU6IGFyZ3Mua2V5TmFtZSxcbiAgICAgICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IGFyZ3Muc2VjdXJpdHlHcm91cElkcyxcbiAgICAgICAgICAgIGlhbUluc3RhbmNlUHJvZmlsZTogYXJncy5pYW1JbnN0YW5jZVByb2ZpbGUsXG4gICAgICAgICAgICB1c2VyRGF0YTogYXJncy51c2VyRGF0YSB8fCBkZWZhdWx0VXNlckRhdGEsXG4gICAgICAgICAgICBlYnNPcHRpbWl6ZWQ6IChhcmdzLmVic09wdGltaXplZCA/PyB0cnVlKS50b1N0cmluZygpLCAvLyBDb252ZXJ0IGJvb2xlYW4gdG8gc3RyaW5nXG4gICAgICAgICAgICBtb25pdG9yaW5nOiB7XG4gICAgICAgICAgICAgICAgZW5hYmxlZDogYXJncy5tb25pdG9yaW5nID8/IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYmxvY2tEZXZpY2VNYXBwaW5nczogZGVmYXVsdEJsb2NrRGV2aWNlTWFwcGluZ3MsXG4gICAgICAgICAgICB0YWdTcGVjaWZpY2F0aW9uczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VUeXBlOiBcImluc3RhbmNlXCIsXG4gICAgICAgICAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZVR5cGU6IFwidm9sdW1lXCIsXG4gICAgICAgICAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMubGF1bmNoVGVtcGxhdGVJZCA9IHRoaXMubGF1bmNoVGVtcGxhdGUuaWQ7XG4gICAgICAgIFxuICAgICAgICAvLyBIYW5kbGUgYm90aCBtb2NrIChzdHJpbmcpIGFuZCByZWFsIFB1bHVtaSBvdXRwdXQgKG51bWJlcikgY2FzZXNcbiAgICAgICAgY29uc3QgcmF3TGF0ZXN0VmVyc2lvbiA9IHRoaXMubGF1bmNoVGVtcGxhdGUubGF0ZXN0VmVyc2lvbjtcbiAgICAgICAgaWYgKHR5cGVvZiByYXdMYXRlc3RWZXJzaW9uID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgLy8gTW9jayBjYXNlOiBhbHJlYWR5IGEgc3RyaW5nXG4gICAgICAgICAgICB0aGlzLmxhdGVzdFZlcnNpb24gPSBwdWx1bWkub3V0cHV0KHJhd0xhdGVzdFZlcnNpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKHJhd0xhdGVzdFZlcnNpb24gJiYgdHlwZW9mIHJhd0xhdGVzdFZlcnNpb24gPT09ICdvYmplY3QnICYmICdhcHBseScgaW4gcmF3TGF0ZXN0VmVyc2lvbikge1xuICAgICAgICAgICAgLy8gUmVhbCBQdWx1bWkgb3V0cHV0IGNhc2U6IGhhcyBhcHBseSBtZXRob2RcbiAgICAgICAgICAgIHRoaXMubGF0ZXN0VmVyc2lvbiA9IChyYXdMYXRlc3RWZXJzaW9uIGFzIGFueSkuYXBwbHkoKHY6IGFueSkgPT4gdi50b1N0cmluZygpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEZhbGxiYWNrIGNhc2U6IGNvbnZlcnQgdG8gc3RyaW5nXG4gICAgICAgICAgICB0aGlzLmxhdGVzdFZlcnNpb24gPSBwdWx1bWkub3V0cHV0KFN0cmluZyhyYXdMYXRlc3RWZXJzaW9uKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBsYXVuY2hUZW1wbGF0ZTogdGhpcy5sYXVuY2hUZW1wbGF0ZSxcbiAgICAgICAgICAgIGxhdW5jaFRlbXBsYXRlSWQ6IHRoaXMubGF1bmNoVGVtcGxhdGVJZCxcbiAgICAgICAgICAgIGxhdGVzdFZlcnNpb246IHRoaXMubGF0ZXN0VmVyc2lvbixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXV0b1NjYWxpbmdHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGF1dG9TY2FsaW5nR3JvdXA6IGF3cy5hdXRvc2NhbGluZy5Hcm91cDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYXV0b1NjYWxpbmdHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYXV0b1NjYWxpbmdHcm91cEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBBdXRvU2NhbGluZ0dyb3VwQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6Y29tcHV0ZTpBdXRvU2NhbGluZ0dyb3VwQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDb252ZXJ0IHRhZ3MgdG8gQVNHIHRhZyBmb3JtYXRcbiAgICAgICAgY29uc3QgYXNnVGFncyA9IE9iamVjdC5lbnRyaWVzKGRlZmF1bHRUYWdzKS5tYXAoKFtrZXksIHZhbHVlXSkgPT4gKHtcbiAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgICAgcHJvcGFnYXRlQXRMYXVuY2g6IHRydWUsXG4gICAgICAgIH0pKTtcblxuICAgICAgICB0aGlzLmF1dG9TY2FsaW5nR3JvdXAgPSBuZXcgYXdzLmF1dG9zY2FsaW5nLkdyb3VwKGAke25hbWV9LWFzZ2AsIHtcbiAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIG1pblNpemU6IGFyZ3MubWluU2l6ZSxcbiAgICAgICAgICAgIG1heFNpemU6IGFyZ3MubWF4U2l6ZSxcbiAgICAgICAgICAgIGRlc2lyZWRDYXBhY2l0eTogYXJncy5kZXNpcmVkQ2FwYWNpdHksXG4gICAgICAgICAgICB2cGNab25lSWRlbnRpZmllcnM6IGFyZ3Muc3VibmV0SWRzLFxuICAgICAgICAgICAgdGFyZ2V0R3JvdXBBcm5zOiBhcmdzLnRhcmdldEdyb3VwQXJucyxcbiAgICAgICAgICAgIGhlYWx0aENoZWNrVHlwZTogYXJncy5oZWFsdGhDaGVja1R5cGUgfHwgXCJFTEJcIixcbiAgICAgICAgICAgIGhlYWx0aENoZWNrR3JhY2VQZXJpb2Q6IGFyZ3MuaGVhbHRoQ2hlY2tHcmFjZVBlcmlvZCB8fCAzMDAsXG4gICAgICAgICAgICBsYXVuY2hUZW1wbGF0ZToge1xuICAgICAgICAgICAgICAgIGlkOiBhcmdzLmxhdW5jaFRlbXBsYXRlLmlkLFxuICAgICAgICAgICAgICAgIHZlcnNpb246IGFyZ3MubGF1bmNoVGVtcGxhdGUudmVyc2lvbixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0YWdzOiBhc2dUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmF1dG9TY2FsaW5nR3JvdXBOYW1lID0gdGhpcy5hdXRvU2NhbGluZ0dyb3VwLm5hbWU7XG4gICAgICAgIHRoaXMuYXV0b1NjYWxpbmdHcm91cEFybiA9IHRoaXMuYXV0b1NjYWxpbmdHcm91cC5hcm47XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgYXV0b1NjYWxpbmdHcm91cDogdGhpcy5hdXRvU2NhbGluZ0dyb3VwLFxuICAgICAgICAgICAgYXV0b1NjYWxpbmdHcm91cE5hbWU6IHRoaXMuYXV0b1NjYWxpbmdHcm91cE5hbWUsXG4gICAgICAgICAgICBhdXRvU2NhbGluZ0dyb3VwQXJuOiB0aGlzLmF1dG9TY2FsaW5nR3JvdXBBcm4sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVjMkluc3RhbmNlKG5hbWU6IHN0cmluZywgYXJnczogRWMySW5zdGFuY2VBcmdzKTogRWMySW5zdGFuY2VSZXN1bHQge1xuICAgIGNvbnN0IGVjMkNvbXBvbmVudCA9IG5ldyBFYzJJbnN0YW5jZUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpbnN0YW5jZTogZWMyQ29tcG9uZW50Lmluc3RhbmNlLFxuICAgICAgICBpbnN0YW5jZUlkOiBlYzJDb21wb25lbnQuaW5zdGFuY2VJZCxcbiAgICAgICAgcHJpdmF0ZUlwOiBlYzJDb21wb25lbnQucHJpdmF0ZUlwLFxuICAgICAgICBwdWJsaWNJcDogZWMyQ29tcG9uZW50LnB1YmxpY0lwLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMYXVuY2hUZW1wbGF0ZShuYW1lOiBzdHJpbmcsIGFyZ3M6IExhdW5jaFRlbXBsYXRlQXJncykge1xuICAgIGNvbnN0IGxhdW5jaFRlbXBsYXRlQ29tcG9uZW50ID0gbmV3IExhdW5jaFRlbXBsYXRlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGxhdW5jaFRlbXBsYXRlOiBsYXVuY2hUZW1wbGF0ZUNvbXBvbmVudC5sYXVuY2hUZW1wbGF0ZSxcbiAgICAgICAgbGF1bmNoVGVtcGxhdGVJZDogbGF1bmNoVGVtcGxhdGVDb21wb25lbnQubGF1bmNoVGVtcGxhdGVJZCxcbiAgICAgICAgbGF0ZXN0VmVyc2lvbjogbGF1bmNoVGVtcGxhdGVDb21wb25lbnQubGF0ZXN0VmVyc2lvbixcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXV0b1NjYWxpbmdHcm91cChuYW1lOiBzdHJpbmcsIGFyZ3M6IEF1dG9TY2FsaW5nR3JvdXBBcmdzKSB7XG4gICAgY29uc3QgYXNnQ29tcG9uZW50ID0gbmV3IEF1dG9TY2FsaW5nR3JvdXBDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYXV0b1NjYWxpbmdHcm91cDogYXNnQ29tcG9uZW50LmF1dG9TY2FsaW5nR3JvdXAsXG4gICAgICAgIGF1dG9TY2FsaW5nR3JvdXBOYW1lOiBhc2dDb21wb25lbnQuYXV0b1NjYWxpbmdHcm91cE5hbWUsXG4gICAgICAgIGF1dG9TY2FsaW5nR3JvdXBBcm46IGFzZ0NvbXBvbmVudC5hdXRvU2NhbGluZ0dyb3VwQXJuLFxuICAgIH07XG59Il19