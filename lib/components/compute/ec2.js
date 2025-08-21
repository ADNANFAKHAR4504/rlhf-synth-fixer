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
        super('aws:compute:Ec2InstanceComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        // Get latest Amazon Linux 2 AMI if not specified
        const amiId = args.amiId ||
            aws.ec2
                .getAmi({
                mostRecent: true,
                owners: ['amazon'],
                filters: [
                    {
                        name: 'name',
                        values: ['amzn2-ami-hvm-*-x86_64-gp2'],
                    },
                    {
                        name: 'virtualization-type',
                        values: ['hvm'],
                    },
                ],
            }, { provider: opts?.provider })
                .then(ami => ami.id);
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
            rootBlockDevice: args.rootBlockDevice
                ? {
                    volumeType: args.rootBlockDevice.volumeType || 'gp3',
                    volumeSize: args.rootBlockDevice.volumeSize || 20,
                    deleteOnTermination: args.rootBlockDevice.deleteOnTermination ?? true,
                    encrypted: args.rootBlockDevice.encrypted ?? true,
                    kmsKeyId: args.rootBlockDevice.kmsKeyId,
                }
                : {
                    volumeType: 'gp3',
                    volumeSize: 20,
                    deleteOnTermination: true,
                    encrypted: true,
                },
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:compute:LaunchTemplateComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        // Get latest Amazon Linux 2 AMI if not specified
        const amiId = args.amiId ||
            aws.ec2
                .getAmi({
                mostRecent: true,
                owners: ['amazon'],
                filters: [
                    {
                        name: 'name',
                        values: ['amzn2-ami-hvm-*-x86_64-gp2'],
                    },
                    {
                        name: 'virtualization-type',
                        values: ['hvm'],
                    },
                ],
            }, { provider: opts?.provider })
                .then(ami => ami.id);
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
            ebs: mapping.ebs
                ? {
                    volumeType: mapping.ebs.volumeType,
                    volumeSize: mapping.ebs.volumeSize,
                    deleteOnTermination: mapping.ebs.deleteOnTermination?.toString(), // Convert boolean to string
                    encrypted: mapping.ebs.encrypted?.toString(), // Convert boolean to string
                    kmsKeyId: mapping.ebs.kmsKeyId,
                }
                : undefined,
        })) || [
            {
                deviceName: '/dev/xvda',
                ebs: {
                    volumeType: 'gp3',
                    volumeSize: 20,
                    deleteOnTermination: 'true', // Use string instead of boolean
                    encrypted: 'true', // Use string instead of boolean
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
                    resourceType: 'instance',
                    tags: defaultTags,
                },
                {
                    resourceType: 'volume',
                    tags: defaultTags,
                },
            ],
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
        this.launchTemplateId = this.launchTemplate.id;
        // Handle both mock (string) and real Pulumi output (number) cases
        const rawLatestVersion = this.launchTemplate.latestVersion;
        if (typeof rawLatestVersion === 'string') {
            // Mock case: already a string
            this.latestVersion = pulumi.output(rawLatestVersion);
        }
        else if (rawLatestVersion &&
            typeof rawLatestVersion === 'object' &&
            'apply' in rawLatestVersion) {
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
        super('aws:compute:AutoScalingGroupComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
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
            healthCheckType: args.healthCheckType || 'ELB',
            healthCheckGracePeriod: args.healthCheckGracePeriod || 300,
            launchTemplate: {
                id: args.launchTemplate.id,
                version: args.launchTemplate.version,
            },
            tags: asgTags,
        }, { parent: this, provider: opts?.provider });
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
function createEc2Instance(name, args, opts) {
    const ec2Component = new Ec2InstanceComponent(name, args, opts);
    return {
        instance: ec2Component.instance,
        instanceId: ec2Component.instanceId,
        privateIp: ec2Component.privateIp,
        publicIp: ec2Component.publicIp,
    };
}
function createLaunchTemplate(name, args, opts) {
    const launchTemplateComponent = new LaunchTemplateComponent(name, args, opts);
    return {
        launchTemplate: launchTemplateComponent.launchTemplate,
        launchTemplateId: launchTemplateComponent.launchTemplateId,
        latestVersion: launchTemplateComponent.latestVersion,
    };
}
function createAutoScalingGroup(name, args, opts) {
    const asgComponent = new AutoScalingGroupComponent(name, args, opts);
    return {
        autoScalingGroup: asgComponent.autoScalingGroup,
        autoScalingGroupName: asgComponent.autoScalingGroupName,
        autoScalingGroupArn: asgComponent.autoScalingGroupArn,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWMyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdiQSw4Q0FZQztBQUVELG9EQVdDO0FBRUQsd0RBV0M7QUF0ZEQsdURBQXlDO0FBQ3pDLGlEQUFtQztBQXdFbkMsTUFBYSxvQkFBcUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ2hELFFBQVEsQ0FBbUI7SUFDM0IsVUFBVSxDQUF3QjtJQUNsQyxTQUFTLENBQXdCO0lBQ2pDLFFBQVEsQ0FBeUI7SUFFakQsWUFDRSxJQUFZLEVBQ1osSUFBcUIsRUFDckIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFMUQsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLGlEQUFpRDtRQUNqRCxNQUFNLEtBQUssR0FDVCxJQUFJLENBQUMsS0FBSztZQUNWLEdBQUcsQ0FBQyxHQUFHO2lCQUNKLE1BQU0sQ0FDTDtnQkFDRSxVQUFVLEVBQUUsSUFBSTtnQkFDaEIsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDO2dCQUNsQixPQUFPLEVBQUU7b0JBQ1A7d0JBQ0UsSUFBSSxFQUFFLE1BQU07d0JBQ1osTUFBTSxFQUFFLENBQUMsNEJBQTRCLENBQUM7cUJBQ3ZDO29CQUNEO3dCQUNFLElBQUksRUFBRSxxQkFBcUI7d0JBQzNCLE1BQU0sRUFBRSxDQUFDLEtBQUssQ0FBQztxQkFDaEI7aUJBQ0Y7YUFDRixFQUNELEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxRQUFRLEVB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LGNBQWM7UUFDdEQsZ0JBQWdCLEVBQUUsdUJBQXVCLENBQUMsZ0JBQWdCO1FBQzFELGFBQWEsRUFBRSx1QkFBdUIsQ0FBQyxhQUFhO0tBQ3JELENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0Isc0JBQXNCLENBQ3BDLElBQVksRUFDWixJQUEwQixFQUMxQixJQUFzQztJQUV0QyxNQUFNLFlBQVksR0FBRyxJQUFJLHlCQUF5QixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDckUsT0FBTztRQUNMLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxnQkFBZ0I7UUFDL0Msb0JBQW9CLEVBQUUsWUFBWSxDQUFDLG9CQUFvQjtRQUN2RCxtQkFBbUIsRUFBRSxZQUFZLENBQUMsbUJBQW1CO0tBQ3RELENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWMySW5zdGFuY2VBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBpbnN0YW5jZVR5cGU6IHN0cmluZztcbiAgYW1pSWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgc3VibmV0SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBzZWN1cml0eUdyb3VwSWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICBrZXlOYW1lPzogc3RyaW5nO1xuICBpYW1JbnN0YW5jZVByb2ZpbGU/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdXNlckRhdGE/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgZWJzT3B0aW1pemVkPzogYm9vbGVhbjtcbiAgbW9uaXRvcmluZz86IGJvb2xlYW47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICByb290QmxvY2tEZXZpY2U/OiB7XG4gICAgdm9sdW1lVHlwZT86IHN0cmluZztcbiAgICB2b2x1bWVTaXplPzogbnVtYmVyO1xuICAgIGRlbGV0ZU9uVGVybWluYXRpb24/OiBib29sZWFuO1xuICAgIGVuY3J5cHRlZD86IGJvb2xlYW47XG4gICAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgfTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFYzJJbnN0YW5jZVJlc3VsdCB7XG4gIGluc3RhbmNlOiBhd3MuZWMyLkluc3RhbmNlO1xuICBpbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHByaXZhdGVJcDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWNJcD86IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBdXRvU2NhbGluZ0dyb3VwQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgbWluU2l6ZTogbnVtYmVyO1xuICBtYXhTaXplOiBudW1iZXI7XG4gIGRlc2lyZWRDYXBhY2l0eTogbnVtYmVyO1xuICBzdWJuZXRJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gIHRhcmdldEdyb3VwQXJucz86IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gIGhlYWx0aENoZWNrVHlwZT86IHN0cmluZztcbiAgaGVhbHRoQ2hlY2tHcmFjZVBlcmlvZD86IG51bWJlcjtcbiAgbGF1bmNoVGVtcGxhdGU6IHtcbiAgICBpZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdmVyc2lvbjogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIH07XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIExhdW5jaFRlbXBsYXRlQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgaW5zdGFuY2VUeXBlOiBzdHJpbmc7XG4gIGFtaUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHNlY3VyaXR5R3JvdXBJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gIGtleU5hbWU/OiBzdHJpbmc7XG4gIGlhbUluc3RhbmNlUHJvZmlsZT86IHtcbiAgICBuYW1lPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgYXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIH07XG4gIHVzZXJEYXRhPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGVic09wdGltaXplZD86IGJvb2xlYW47XG4gIG1vbml0b3Jpbmc/OiBib29sZWFuO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgYmxvY2tEZXZpY2VNYXBwaW5ncz86IEFycmF5PHtcbiAgICBkZXZpY2VOYW1lOiBzdHJpbmc7XG4gICAgZWJzPzoge1xuICAgICAgdm9sdW1lVHlwZT86IHN0cmluZztcbiAgICAgIHZvbHVtZVNpemU/OiBudW1iZXI7XG4gICAgICBkZWxldGVPblRlcm1pbmF0aW9uPzogYm9vbGVhbjtcbiAgICAgIGVuY3J5cHRlZD86IGJvb2xlYW47XG4gICAgICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIH07XG4gIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgRWMySW5zdGFuY2VDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2U6IGF3cy5lYzIuSW5zdGFuY2U7XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlSXA6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0lwPzogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBFYzJJbnN0YW5jZUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpjb21wdXRlOkVjMkluc3RhbmNlQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgLy8gR2V0IGxhdGVzdCBBbWF6b24gTGludXggMiBBTUkgaWYgbm90IHNwZWNpZmllZFxuICAgIGNvbnN0IGFtaUlkID1cbiAgICAgIGFyZ3MuYW1pSWQgfHxcbiAgICAgIGF3cy5lYzJcbiAgICAgICAgLmdldEFtaShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtb3N0UmVjZW50OiB0cnVlLFxuICAgICAgICAgICAgb3duZXJzOiBbJ2FtYXpvbiddLFxuICAgICAgICAgICAgZmlsdGVyczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ25hbWUnLFxuICAgICAgICAgICAgICAgIHZhbHVlczogWydhbXpuMi1hbWktaHZtLSoteDg2XzY0LWdwMiddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3ZpcnR1YWxpemF0aW9uLXR5cGUnLFxuICAgICAgICAgICAgICAgIHZhbHVlczogWydodm0nXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgICAgIClcbiAgICAgICAgLnRoZW4oYW1pID0+IGFtaS5pZCk7XG5cbiAgICAvLyBEZWZhdWx0IHVzZXIgZGF0YSBmb3Igc2VjdXJpdHkgaGFyZGVuaW5nXG4gICAgY29uc3QgZGVmYXVsdFVzZXJEYXRhID0gYCMhL2Jpbi9iYXNoXG55dW0gdXBkYXRlIC15XG55dW0gaW5zdGFsbCAteSBhbWF6b24tY2xvdWR3YXRjaC1hZ2VudFxueXVtIGluc3RhbGwgLXkgYXdzbG9nc1xuXG4jIENvbmZpZ3VyZSBDbG91ZFdhdGNoIGFnZW50XG5jYXQgPDxFT0YgPiAvb3B0L2F3cy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC9ldGMvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQuanNvblxue1xuICAgIFwibG9nc1wiOiB7XG4gICAgICAgIFwibG9nc19jb2xsZWN0ZWRcIjoge1xuICAgICAgICAgICAgXCJmaWxlc1wiOiB7XG4gICAgICAgICAgICAgICAgXCJjb2xsZWN0X2xpc3RcIjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImZpbGVfcGF0aFwiOiBcIi92YXIvbG9nL21lc3NhZ2VzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ19ncm91cF9uYW1lXCI6IFwiL2F3cy9lYzIvc3lzdGVtLWxvZ3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nX3N0cmVhbV9uYW1lXCI6IFwie2luc3RhbmNlX2lkfS9tZXNzYWdlc1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZmlsZV9wYXRoXCI6IFwiL3Zhci9sb2cvc2VjdXJlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ19ncm91cF9uYW1lXCI6IFwiL2F3cy9lYzIvc2VjdXJpdHktbG9nc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dfc3RyZWFtX25hbWVcIjogXCJ7aW5zdGFuY2VfaWR9L3NlY3VyZVwiXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5FT0ZcblxuIyBTdGFydCBDbG91ZFdhdGNoIGFnZW50XG4vb3B0L2F3cy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC9iaW4vYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQtY3RsIC1hIGZldGNoLWNvbmZpZyAtbSBlYzIgLWMgZmlsZTovb3B0L2F3cy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC9ldGMvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQuanNvbiAtc1xuXG4jIFNlY3VyaXR5IGhhcmRlbmluZ1xuc2VkIC1pICdzLyNQYXNzd29yZEF1dGhlbnRpY2F0aW9uIHllcy9QYXNzd29yZEF1dGhlbnRpY2F0aW9uIG5vLycgL2V0Yy9zc2gvc3NoZF9jb25maWdcbnN5c3RlbWN0bCByZXN0YXJ0IHNzaGRcblxuIyBJbnN0YWxsIHNlY3VyaXR5IHVwZGF0ZXNcbnl1bSB1cGRhdGUgLXkgLS1zZWN1cml0eVxuYDtcblxuICAgIHRoaXMuaW5zdGFuY2UgPSBuZXcgYXdzLmVjMi5JbnN0YW5jZShcbiAgICAgIGAke25hbWV9LWluc3RhbmNlYCxcbiAgICAgIHtcbiAgICAgICAgYW1pOiBhbWlJZCxcbiAgICAgICAgaW5zdGFuY2VUeXBlOiBhcmdzLmluc3RhbmNlVHlwZSxcbiAgICAgICAgc3VibmV0SWQ6IGFyZ3Muc3VibmV0SWQsXG4gICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IGFyZ3Muc2VjdXJpdHlHcm91cElkcyxcbiAgICAgICAga2V5TmFtZTogYXJncy5rZXlOYW1lLFxuICAgICAgICBpYW1JbnN0YW5jZVByb2ZpbGU6IGFyZ3MuaWFtSW5zdGFuY2VQcm9maWxlLFxuICAgICAgICB1c2VyRGF0YTogYXJncy51c2VyRGF0YSB8fCBkZWZhdWx0VXNlckRhdGEsXG4gICAgICAgIGVic09wdGltaXplZDogYXJncy5lYnNPcHRpbWl6ZWQgPz8gdHJ1ZSxcbiAgICAgICAgbW9uaXRvcmluZzogYXJncy5tb25pdG9yaW5nID8/IHRydWUsXG4gICAgICAgIHJvb3RCbG9ja0RldmljZTogYXJncy5yb290QmxvY2tEZXZpY2VcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgdm9sdW1lVHlwZTogYXJncy5yb290QmxvY2tEZXZpY2Uudm9sdW1lVHlwZSB8fCAnZ3AzJyxcbiAgICAgICAgICAgICAgdm9sdW1lU2l6ZTogYXJncy5yb290QmxvY2tEZXZpY2Uudm9sdW1lU2l6ZSB8fCAyMCxcbiAgICAgICAgICAgICAgZGVsZXRlT25UZXJtaW5hdGlvbjpcbiAgICAgICAgICAgICAgICBhcmdzLnJvb3RCbG9ja0RldmljZS5kZWxldGVPblRlcm1pbmF0aW9uID8/IHRydWUsXG4gICAgICAgICAgICAgIGVuY3J5cHRlZDogYXJncy5yb290QmxvY2tEZXZpY2UuZW5jcnlwdGVkID8/IHRydWUsXG4gICAgICAgICAgICAgIGttc0tleUlkOiBhcmdzLnJvb3RCbG9ja0RldmljZS5rbXNLZXlJZCxcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA6IHtcbiAgICAgICAgICAgICAgdm9sdW1lVHlwZTogJ2dwMycsXG4gICAgICAgICAgICAgIHZvbHVtZVNpemU6IDIwLFxuICAgICAgICAgICAgICBkZWxldGVPblRlcm1pbmF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgICBlbmNyeXB0ZWQ6IHRydWUsXG4gICAgICAgICAgICB9LFxuICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5pbnN0YW5jZUlkID0gdGhpcy5pbnN0YW5jZS5pZDtcbiAgICB0aGlzLnByaXZhdGVJcCA9IHRoaXMuaW5zdGFuY2UucHJpdmF0ZUlwO1xuICAgIHRoaXMucHVibGljSXAgPSB0aGlzLmluc3RhbmNlLnB1YmxpY0lwO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgaW5zdGFuY2U6IHRoaXMuaW5zdGFuY2UsXG4gICAgICBpbnN0YW5jZUlkOiB0aGlzLmluc3RhbmNlSWQsXG4gICAgICBwcml2YXRlSXA6IHRoaXMucHJpdmF0ZUlwLFxuICAgICAgcHVibGljSXA6IHRoaXMucHVibGljSXAsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIExhdW5jaFRlbXBsYXRlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGxhdW5jaFRlbXBsYXRlOiBhd3MuZWMyLkxhdW5jaFRlbXBsYXRlO1xuICBwdWJsaWMgcmVhZG9ubHkgbGF1bmNoVGVtcGxhdGVJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgbGF0ZXN0VmVyc2lvbjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBMYXVuY2hUZW1wbGF0ZUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpjb21wdXRlOkxhdW5jaFRlbXBsYXRlQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgLy8gR2V0IGxhdGVzdCBBbWF6b24gTGludXggMiBBTUkgaWYgbm90IHNwZWNpZmllZFxuICAgIGNvbnN0IGFtaUlkID1cbiAgICAgIGFyZ3MuYW1pSWQgfHxcbiAgICAgIGF3cy5lYzJcbiAgICAgICAgLmdldEFtaShcbiAgICAgICAgICB7XG4gICAgICAgICAgICBtb3N0UmVjZW50OiB0cnVlLFxuICAgICAgICAgICAgb3duZXJzOiBbJ2FtYXpvbiddLFxuICAgICAgICAgICAgZmlsdGVyczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ25hbWUnLFxuICAgICAgICAgICAgICAgIHZhbHVlczogWydhbXpuMi1hbWktaHZtLSoteDg2XzY0LWdwMiddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3ZpcnR1YWxpemF0aW9uLXR5cGUnLFxuICAgICAgICAgICAgICAgIHZhbHVlczogWydodm0nXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgICAgIClcbiAgICAgICAgLnRoZW4oYW1pID0+IGFtaS5pZCk7XG5cbiAgICAvLyBEZWZhdWx0IHVzZXIgZGF0YSBmb3Igc2VjdXJpdHkgaGFyZGVuaW5nXG4gICAgY29uc3QgZGVmYXVsdFVzZXJEYXRhID0gQnVmZmVyLmZyb20oXG4gICAgICBgIyEvYmluL2Jhc2hcbnl1bSB1cGRhdGUgLXlcbnl1bSBpbnN0YWxsIC15IGFtYXpvbi1jbG91ZHdhdGNoLWFnZW50XG55dW0gaW5zdGFsbCAteSBhd3Nsb2dzXG5cbiMgQ29uZmlndXJlIENsb3VkV2F0Y2ggYWdlbnRcbmNhdCA8PEVPRiA+IC9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2V0Yy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5qc29uXG57XG4gICAgXCJsb2dzXCI6IHtcbiAgICAgICAgXCJsb2dzX2NvbGxlY3RlZFwiOiB7XG4gICAgICAgICAgICBcImZpbGVzXCI6IHtcbiAgICAgICAgICAgICAgICBcImNvbGxlY3RfbGlzdFwiOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZmlsZV9wYXRoXCI6IFwiL3Zhci9sb2cvbWVzc2FnZXNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nX2dyb3VwX25hbWVcIjogXCIvYXdzL2VjMi9zeXN0ZW0tbG9nc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dfc3RyZWFtX25hbWVcIjogXCJ7aW5zdGFuY2VfaWR9L21lc3NhZ2VzXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJmaWxlX3BhdGhcIjogXCIvdmFyL2xvZy9zZWN1cmVcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nX2dyb3VwX25hbWVcIjogXCIvYXdzL2VjMi9zZWN1cml0eS1sb2dzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ19zdHJlYW1fbmFtZVwiOiBcIntpbnN0YW5jZV9pZH0vc2VjdXJlXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbkVPRlxuXG4jIFN0YXJ0IENsb3VkV2F0Y2ggYWdlbnRcbi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2Jpbi9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC1jdGwgLWEgZmV0Y2gtY29uZmlnIC1tIGVjMiAtYyBmaWxlOi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2V0Yy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5qc29uIC1zXG5cbiMgU2VjdXJpdHkgaGFyZGVuaW5nXG5zZWQgLWkgJ3MvI1Bhc3N3b3JkQXV0aGVudGljYXRpb24geWVzL1Bhc3N3b3JkQXV0aGVudGljYXRpb24gbm8vJyAvZXRjL3NzaC9zc2hkX2NvbmZpZ1xuc3lzdGVtY3RsIHJlc3RhcnQgc3NoZFxuXG4jIEluc3RhbGwgc2VjdXJpdHkgdXBkYXRlc1xueXVtIHVwZGF0ZSAteSAtLXNlY3VyaXR5XG5gXG4gICAgKS50b1N0cmluZygnYmFzZTY0Jyk7XG5cbiAgICAvLyBGaXhlZCBibG9ja0RldmljZU1hcHBpbmdzIHR5cGUgaXNzdWVzXG4gICAgY29uc3QgZGVmYXVsdEJsb2NrRGV2aWNlTWFwcGluZ3MgPSBhcmdzLmJsb2NrRGV2aWNlTWFwcGluZ3M/Lm1hcChcbiAgICAgIG1hcHBpbmcgPT4gKHtcbiAgICAgICAgZGV2aWNlTmFtZTogbWFwcGluZy5kZXZpY2VOYW1lLFxuICAgICAgICBlYnM6IG1hcHBpbmcuZWJzXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIHZvbHVtZVR5cGU6IG1hcHBpbmcuZWJzLnZvbHVtZVR5cGUsXG4gICAgICAgICAgICAgIHZvbHVtZVNpemU6IG1hcHBpbmcuZWJzLnZvbHVtZVNpemUsXG4gICAgICAgICAgICAgIGRlbGV0ZU9uVGVybWluYXRpb246IG1hcHBpbmcuZWJzLmRlbGV0ZU9uVGVybWluYXRpb24/LnRvU3RyaW5nKCksIC8vIENvbnZlcnQgYm9vbGVhbiB0byBzdHJpbmdcbiAgICAgICAgICAgICAgZW5jcnlwdGVkOiBtYXBwaW5nLmVicy5lbmNyeXB0ZWQ/LnRvU3RyaW5nKCksIC8vIENvbnZlcnQgYm9vbGVhbiB0byBzdHJpbmdcbiAgICAgICAgICAgICAga21zS2V5SWQ6IG1hcHBpbmcuZWJzLmttc0tleUlkLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgfSlcbiAgICApIHx8IFtcbiAgICAgIHtcbiAgICAgICAgZGV2aWNlTmFtZTogJy9kZXYveHZkYScsXG4gICAgICAgIGViczoge1xuICAgICAgICAgIHZvbHVtZVR5cGU6ICdncDMnLFxuICAgICAgICAgIHZvbHVtZVNpemU6IDIwLFxuICAgICAgICAgIGRlbGV0ZU9uVGVybWluYXRpb246ICd0cnVlJywgLy8gVXNlIHN0cmluZyBpbnN0ZWFkIG9mIGJvb2xlYW5cbiAgICAgICAgICBlbmNyeXB0ZWQ6ICd0cnVlJywgLy8gVXNlIHN0cmluZyBpbnN0ZWFkIG9mIGJvb2xlYW5cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXTtcblxuICAgIHRoaXMubGF1bmNoVGVtcGxhdGUgPSBuZXcgYXdzLmVjMi5MYXVuY2hUZW1wbGF0ZShcbiAgICAgIGAke25hbWV9LWx0YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZVByZWZpeDogYCR7YXJncy5uYW1lfS1gLFxuICAgICAgICBpbWFnZUlkOiBhbWlJZCxcbiAgICAgICAgaW5zdGFuY2VUeXBlOiBhcmdzLmluc3RhbmNlVHlwZSxcbiAgICAgICAga2V5TmFtZTogYXJncy5rZXlOYW1lLFxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBhcmdzLnNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgIGlhbUluc3RhbmNlUHJvZmlsZTogYXJncy5pYW1JbnN0YW5jZVByb2ZpbGUsXG4gICAgICAgIHVzZXJEYXRhOiBhcmdzLnVzZXJEYXRhIHx8IGRlZmF1bHRVc2VyRGF0YSxcbiAgICAgICAgZWJzT3B0aW1pemVkOiAoYXJncy5lYnNPcHRpbWl6ZWQgPz8gdHJ1ZSkudG9TdHJpbmcoKSwgLy8gQ29udmVydCBib29sZWFuIHRvIHN0cmluZ1xuICAgICAgICBtb25pdG9yaW5nOiB7XG4gICAgICAgICAgZW5hYmxlZDogYXJncy5tb25pdG9yaW5nID8/IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGJsb2NrRGV2aWNlTWFwcGluZ3M6IGRlZmF1bHRCbG9ja0RldmljZU1hcHBpbmdzLFxuICAgICAgICB0YWdTcGVjaWZpY2F0aW9uczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlc291cmNlVHlwZTogJ2luc3RhbmNlJyxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVzb3VyY2VUeXBlOiAndm9sdW1lJyxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmxhdW5jaFRlbXBsYXRlSWQgPSB0aGlzLmxhdW5jaFRlbXBsYXRlLmlkO1xuXG4gICAgLy8gSGFuZGxlIGJvdGggbW9jayAoc3RyaW5nKSBhbmQgcmVhbCBQdWx1bWkgb3V0cHV0IChudW1iZXIpIGNhc2VzXG4gICAgY29uc3QgcmF3TGF0ZXN0VmVyc2lvbiA9IHRoaXMubGF1bmNoVGVtcGxhdGUubGF0ZXN0VmVyc2lvbjtcbiAgICBpZiAodHlwZW9mIHJhd0xhdGVzdFZlcnNpb24gPT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBNb2NrIGNhc2U6IGFscmVhZHkgYSBzdHJpbmdcbiAgICAgIHRoaXMubGF0ZXN0VmVyc2lvbiA9IHB1bHVtaS5vdXRwdXQocmF3TGF0ZXN0VmVyc2lvbik7XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIHJhd0xhdGVzdFZlcnNpb24gJiZcbiAgICAgIHR5cGVvZiByYXdMYXRlc3RWZXJzaW9uID09PSAnb2JqZWN0JyAmJlxuICAgICAgJ2FwcGx5JyBpbiByYXdMYXRlc3RWZXJzaW9uXG4gICAgKSB7XG4gICAgICAvLyBSZWFsIFB1bHVtaSBvdXRwdXQgY2FzZTogaGFzIGFwcGx5IG1ldGhvZFxuICAgICAgdGhpcy5sYXRlc3RWZXJzaW9uID0gKHJhd0xhdGVzdFZlcnNpb24gYXMgYW55KS5hcHBseSgodjogYW55KSA9PlxuICAgICAgICB2LnRvU3RyaW5nKClcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEZhbGxiYWNrIGNhc2U6IGNvbnZlcnQgdG8gc3RyaW5nXG4gICAgICB0aGlzLmxhdGVzdFZlcnNpb24gPSBwdWx1bWkub3V0cHV0KFN0cmluZyhyYXdMYXRlc3RWZXJzaW9uKSk7XG4gICAgfVxuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgbGF1bmNoVGVtcGxhdGU6IHRoaXMubGF1bmNoVGVtcGxhdGUsXG4gICAgICBsYXVuY2hUZW1wbGF0ZUlkOiB0aGlzLmxhdW5jaFRlbXBsYXRlSWQsXG4gICAgICBsYXRlc3RWZXJzaW9uOiB0aGlzLmxhdGVzdFZlcnNpb24sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEF1dG9TY2FsaW5nR3JvdXBDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0b1NjYWxpbmdHcm91cDogYXdzLmF1dG9zY2FsaW5nLkdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0b1NjYWxpbmdHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGF1dG9TY2FsaW5nR3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogQXV0b1NjYWxpbmdHcm91cEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpjb21wdXRlOkF1dG9TY2FsaW5nR3JvdXBDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICAvLyBDb252ZXJ0IHRhZ3MgdG8gQVNHIHRhZyBmb3JtYXRcbiAgICBjb25zdCBhc2dUYWdzID0gT2JqZWN0LmVudHJpZXMoZGVmYXVsdFRhZ3MpLm1hcCgoW2tleSwgdmFsdWVdKSA9PiAoe1xuICAgICAga2V5OiBrZXksXG4gICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICBwcm9wYWdhdGVBdExhdW5jaDogdHJ1ZSxcbiAgICB9KSk7XG5cbiAgICB0aGlzLmF1dG9TY2FsaW5nR3JvdXAgPSBuZXcgYXdzLmF1dG9zY2FsaW5nLkdyb3VwKFxuICAgICAgYCR7bmFtZX0tYXNnYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICBtaW5TaXplOiBhcmdzLm1pblNpemUsXG4gICAgICAgIG1heFNpemU6IGFyZ3MubWF4U2l6ZSxcbiAgICAgICAgZGVzaXJlZENhcGFjaXR5OiBhcmdzLmRlc2lyZWRDYXBhY2l0eSxcbiAgICAgICAgdnBjWm9uZUlkZW50aWZpZXJzOiBhcmdzLnN1Ym5ldElkcyxcbiAgICAgICAgdGFyZ2V0R3JvdXBBcm5zOiBhcmdzLnRhcmdldEdyb3VwQXJucyxcbiAgICAgICAgaGVhbHRoQ2hlY2tUeXBlOiBhcmdzLmhlYWx0aENoZWNrVHlwZSB8fCAnRUxCJyxcbiAgICAgICAgaGVhbHRoQ2hlY2tHcmFjZVBlcmlvZDogYXJncy5oZWFsdGhDaGVja0dyYWNlUGVyaW9kIHx8IDMwMCxcbiAgICAgICAgbGF1bmNoVGVtcGxhdGU6IHtcbiAgICAgICAgICBpZDogYXJncy5sYXVuY2hUZW1wbGF0ZS5pZCxcbiAgICAgICAgICB2ZXJzaW9uOiBhcmdzLmxhdW5jaFRlbXBsYXRlLnZlcnNpb24sXG4gICAgICAgIH0sXG4gICAgICAgIHRhZ3M6IGFzZ1RhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMuYXV0b1NjYWxpbmdHcm91cE5hbWUgPSB0aGlzLmF1dG9TY2FsaW5nR3JvdXAubmFtZTtcbiAgICB0aGlzLmF1dG9TY2FsaW5nR3JvdXBBcm4gPSB0aGlzLmF1dG9TY2FsaW5nR3JvdXAuYXJuO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgYXV0b1NjYWxpbmdHcm91cDogdGhpcy5hdXRvU2NhbGluZ0dyb3VwLFxuICAgICAgYXV0b1NjYWxpbmdHcm91cE5hbWU6IHRoaXMuYXV0b1NjYWxpbmdHcm91cE5hbWUsXG4gICAgICBhdXRvU2NhbGluZ0dyb3VwQXJuOiB0aGlzLmF1dG9TY2FsaW5nR3JvdXBBcm4sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVjMkluc3RhbmNlKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IEVjMkluc3RhbmNlQXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IEVjMkluc3RhbmNlUmVzdWx0IHtcbiAgY29uc3QgZWMyQ29tcG9uZW50ID0gbmV3IEVjMkluc3RhbmNlQ29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpO1xuICByZXR1cm4ge1xuICAgIGluc3RhbmNlOiBlYzJDb21wb25lbnQuaW5zdGFuY2UsXG4gICAgaW5zdGFuY2VJZDogZWMyQ29tcG9uZW50Lmluc3RhbmNlSWQsXG4gICAgcHJpdmF0ZUlwOiBlYzJDb21wb25lbnQucHJpdmF0ZUlwLFxuICAgIHB1YmxpY0lwOiBlYzJDb21wb25lbnQucHVibGljSXAsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMYXVuY2hUZW1wbGF0ZShcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBMYXVuY2hUZW1wbGF0ZUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pIHtcbiAgY29uc3QgbGF1bmNoVGVtcGxhdGVDb21wb25lbnQgPSBuZXcgTGF1bmNoVGVtcGxhdGVDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgbGF1bmNoVGVtcGxhdGU6IGxhdW5jaFRlbXBsYXRlQ29tcG9uZW50LmxhdW5jaFRlbXBsYXRlLFxuICAgIGxhdW5jaFRlbXBsYXRlSWQ6IGxhdW5jaFRlbXBsYXRlQ29tcG9uZW50LmxhdW5jaFRlbXBsYXRlSWQsXG4gICAgbGF0ZXN0VmVyc2lvbjogbGF1bmNoVGVtcGxhdGVDb21wb25lbnQubGF0ZXN0VmVyc2lvbixcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUF1dG9TY2FsaW5nR3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogQXV0b1NjYWxpbmdHcm91cEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pIHtcbiAgY29uc3QgYXNnQ29tcG9uZW50ID0gbmV3IEF1dG9TY2FsaW5nR3JvdXBDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgYXV0b1NjYWxpbmdHcm91cDogYXNnQ29tcG9uZW50LmF1dG9TY2FsaW5nR3JvdXAsXG4gICAgYXV0b1NjYWxpbmdHcm91cE5hbWU6IGFzZ0NvbXBvbmVudC5hdXRvU2NhbGluZ0dyb3VwTmFtZSxcbiAgICBhdXRvU2NhbGluZ0dyb3VwQXJuOiBhc2dDb21wb25lbnQuYXV0b1NjYWxpbmdHcm91cEFybixcbiAgfTtcbn1cbiJdfQ==