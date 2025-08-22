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
exports.Ec2Stack = void 0;
/**
 * ec2-stack.ts
 *
 * This module defines the EC2 stack for the hardened web server.
 * Creates a secure EC2 instance with encrypted storage and proper security configurations.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class Ec2Stack extends pulumi.ComponentResource {
    instanceId;
    instanceArn;
    publicIp;
    privateIp;
    constructor(name, args, opts) {
        super('tap:ec2:Ec2Stack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const instanceType = args.instanceType || 't3.micro';
        const tags = args.tags || {};
        // Get the latest Amazon Linux 2023 AMI
        const amiData = aws.ec2.getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
                {
                    name: 'name',
                    values: ['al2023-ami-*-x86_64'],
                },
                {
                    name: 'architecture',
                    values: ['x86_64'],
                },
                {
                    name: 'virtualization-type',
                    values: ['hvm'],
                },
                {
                    name: 'state',
                    values: ['available'],
                },
            ],
        });
        // Create IAM role for EC2 instance (following principle of least privilege)
        const ec2Role = new aws.iam.Role(`tap-ec2-role-${environmentSuffix}`, {
            name: `tap-ec2-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'ec2.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            }),
            tags: {
                Name: `tap-ec2-role-${environmentSuffix}`,
                Purpose: 'EC2InstanceExecution',
                ...tags,
            },
        }, { parent: this });
        // Attach minimal required policies (CloudWatch for monitoring)
        new aws.iam.RolePolicyAttachment(`tap-ec2-cloudwatch-policy-${environmentSuffix}`, {
            role: ec2Role.name,
            policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        }, { parent: this });
        // Create instance profile
        const instanceProfile = new aws.iam.InstanceProfile(`tap-ec2-profile-${environmentSuffix}`, {
            name: `tap-ec2-profile-${environmentSuffix}`,
            role: ec2Role.name,
            tags: {
                Name: `tap-ec2-profile-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // User data script for basic security hardening
        const userData = `#!/bin/bash
# Update system
yum update -y

# Install and configure CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Install security updates automatically
yum install -y yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Configure basic firewall (iptables backup)
yum install -y iptables-services
systemctl enable iptables

# Disable unnecessary services
systemctl disable postfix
systemctl stop postfix

# Set up basic security configurations
echo "net.ipv4.conf.all.send_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.send_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.accept_source_route = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_source_route = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.accept_redirects = 0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_redirects = 0" >> /etc/sysctl.conf
sysctl -p

# Install and start httpd for web server functionality
yum install -y httpd
systemctl enable httpd
systemctl start httpd

# Create a simple index page
echo "<html><body><h1>TAP Secure Web Server - ${environmentSuffix}</h1><p>Server is running securely.</p></body></html>" > /var/www/html/index.html

# Set proper permissions
chmod 644 /var/www/html/index.html
chown apache:apache /var/www/html/index.html
`;
        // Create the EC2 instance with security best practices
        const webServerInstance = new aws.ec2.Instance(`tap-web-server-${environmentSuffix}`, {
            ami: amiData.then(ami => ami.id),
            instanceType: instanceType,
            subnetId: args.subnetId,
            vpcSecurityGroupIds: [args.securityGroupId],
            iamInstanceProfile: instanceProfile.name,
            userData: Buffer.from(userData).toString('base64'),
            // Enable detailed monitoring
            monitoring: true,
            // Disable instance metadata service v1 (security best practice)
            metadataOptions: {
                httpEndpoint: 'enabled',
                httpTokens: 'required', // Require IMDSv2
                httpPutResponseHopLimit: 1,
            },
            // Root block device with encryption
            rootBlockDevice: {
                volumeType: 'gp3',
                volumeSize: 20,
                encrypted: true,
                deleteOnTermination: true,
                tags: {
                    Name: `tap-web-server-root-${environmentSuffix}`,
                    VolumeType: 'root',
                    ...tags,
                },
            },
            // Additional EBS block device (example of encrypted additional storage)
            ebsBlockDevices: [
                {
                    deviceName: '/dev/sdf',
                    volumeType: 'gp3',
                    volumeSize: 10,
                    encrypted: true,
                    deleteOnTermination: true,
                    tags: {
                        Name: `tap-web-server-data-${environmentSuffix}`,
                        VolumeType: 'data',
                        ...tags,
                    },
                },
            ],
            tags: {
                Name: `tap-web-server-${environmentSuffix}`,
                Purpose: 'SecureWebServer',
                Environment: environmentSuffix,
                AutoStartStop: 'true', // For cost optimization
                BackupRequired: 'true',
                ...tags,
            },
            // Enable termination protection for production
            disableApiTermination: environmentSuffix === 'prod',
        }, { parent: this });
        this.instanceId = webServerInstance.id;
        this.instanceArn = webServerInstance.arn;
        this.publicIp = webServerInstance.publicIp;
        this.privateIp = webServerInstance.privateIp;
        this.registerOutputs({
            instanceId: this.instanceId,
            instanceArn: this.instanceArn,
            publicIp: this.publicIp,
            privateIp: this.privateIp,
        });
    }
}
exports.Ec2Stack = Ec2Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWMyLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQW1CekMsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwQyxVQUFVLENBQXdCO0lBQ2xDLFdBQVcsQ0FBd0I7SUFDbkMsUUFBUSxDQUF3QjtJQUNoQyxTQUFTLENBQXdCO0lBRWpELFlBQVksSUFBWSxFQUFFLElBQWtCLEVBQUUsSUFBc0I7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksVUFBVSxDQUFDO1FBQ3JELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLHVDQUF1QztRQUN2QyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQztZQUM3QixVQUFVLEVBQUUsSUFBSTtZQUNoQixNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUM7WUFDbEIsT0FBTyxFQUFFO2dCQUNQO29CQUNFLElBQUksRUFBRSxNQUFNO29CQUNaLE1BQU0sRUFBRSxDQUFDLHFCQUFxQixDQUFDO2lCQUNoQztnQkFDRDtvQkFDRSxJQUFJLEVBQUUsY0FBYztvQkFDcEIsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDO2lCQUNuQjtnQkFDRDtvQkFDRSxJQUFJLEVBQUUscUJBQXFCO29CQUMzQixNQUFNLEVBQUUsQ0FBQyxLQUFLLENBQUM7aUJBQ2hCO2dCQUNEO29CQUNFLElBQUksRUFBRSxPQUFP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QUFDO0NBQ0Y7QUEvTUQsNEJBK01DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBlYzItc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBFQzIgc3RhY2sgZm9yIHRoZSBoYXJkZW5lZCB3ZWIgc2VydmVyLlxuICogQ3JlYXRlcyBhIHNlY3VyZSBFQzIgaW5zdGFuY2Ugd2l0aCBlbmNyeXB0ZWQgc3RvcmFnZSBhbmQgcHJvcGVyIHNlY3VyaXR5IGNvbmZpZ3VyYXRpb25zLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBFYzJTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcbiAgdnBjSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBzdWJuZXRJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGluc3RhbmNlVHlwZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFYzJTdGFja091dHB1dHMge1xuICBpbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGluc3RhbmNlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpY0lwOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHByaXZhdGVJcDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgRWMyU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHB1YmxpY0lwOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlSXA6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IEVjMlN0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6ZWMyOkVjMlN0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgaW5zdGFuY2VUeXBlID0gYXJncy5pbnN0YW5jZVR5cGUgfHwgJ3QzLm1pY3JvJztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gR2V0IHRoZSBsYXRlc3QgQW1hem9uIExpbnV4IDIwMjMgQU1JXG4gICAgY29uc3QgYW1pRGF0YSA9IGF3cy5lYzIuZ2V0QW1pKHtcbiAgICAgIG1vc3RSZWNlbnQ6IHRydWUsXG4gICAgICBvd25lcnM6IFsnYW1hem9uJ10sXG4gICAgICBmaWx0ZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnbmFtZScsXG4gICAgICAgICAgdmFsdWVzOiBbJ2FsMjAyMy1hbWktKi14ODZfNjQnXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdhcmNoaXRlY3R1cmUnLFxuICAgICAgICAgIHZhbHVlczogWyd4ODZfNjQnXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICd2aXJ0dWFsaXphdGlvbi10eXBlJyxcbiAgICAgICAgICB2YWx1ZXM6IFsnaHZtJ10sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnc3RhdGUnLFxuICAgICAgICAgIHZhbHVlczogWydhdmFpbGFibGUnXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGUgZm9yIEVDMiBpbnN0YW5jZSAoZm9sbG93aW5nIHByaW5jaXBsZSBvZiBsZWFzdCBwcml2aWxlZ2UpXG4gICAgY29uc3QgZWMyUm9sZSA9IG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICBgdGFwLWVjMi1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1lYzItcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ2VjMi5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZWMyLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdFQzJJbnN0YW5jZUV4ZWN1dGlvbicsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEF0dGFjaCBtaW5pbWFsIHJlcXVpcmVkIHBvbGljaWVzIChDbG91ZFdhdGNoIGZvciBtb25pdG9yaW5nKVxuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYHRhcC1lYzItY2xvdWR3YXRjaC1wb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiBlYzJSb2xlLm5hbWUsXG4gICAgICAgIHBvbGljeUFybjogJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L0Nsb3VkV2F0Y2hBZ2VudFNlcnZlclBvbGljeScsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgaW5zdGFuY2UgcHJvZmlsZVxuICAgIGNvbnN0IGluc3RhbmNlUHJvZmlsZSA9IG5ldyBhd3MuaWFtLkluc3RhbmNlUHJvZmlsZShcbiAgICAgIGB0YXAtZWMyLXByb2ZpbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWVjMi1wcm9maWxlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgcm9sZTogZWMyUm9sZS5uYW1lLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1lYzItcHJvZmlsZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFVzZXIgZGF0YSBzY3JpcHQgZm9yIGJhc2ljIHNlY3VyaXR5IGhhcmRlbmluZ1xuICAgIGNvbnN0IHVzZXJEYXRhID0gYCMhL2Jpbi9iYXNoXG4jIFVwZGF0ZSBzeXN0ZW1cbnl1bSB1cGRhdGUgLXlcblxuIyBJbnN0YWxsIGFuZCBjb25maWd1cmUgQ2xvdWRXYXRjaCBhZ2VudFxueXVtIGluc3RhbGwgLXkgYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnRcblxuIyBJbnN0YWxsIHNlY3VyaXR5IHVwZGF0ZXMgYXV0b21hdGljYWxseVxueXVtIGluc3RhbGwgLXkgeXVtLWNyb25cbnN5c3RlbWN0bCBlbmFibGUgeXVtLWNyb25cbnN5c3RlbWN0bCBzdGFydCB5dW0tY3JvblxuXG4jIENvbmZpZ3VyZSBiYXNpYyBmaXJld2FsbCAoaXB0YWJsZXMgYmFja3VwKVxueXVtIGluc3RhbGwgLXkgaXB0YWJsZXMtc2VydmljZXNcbnN5c3RlbWN0bCBlbmFibGUgaXB0YWJsZXNcblxuIyBEaXNhYmxlIHVubmVjZXNzYXJ5IHNlcnZpY2VzXG5zeXN0ZW1jdGwgZGlzYWJsZSBwb3N0Zml4XG5zeXN0ZW1jdGwgc3RvcCBwb3N0Zml4XG5cbiMgU2V0IHVwIGJhc2ljIHNlY3VyaXR5IGNvbmZpZ3VyYXRpb25zXG5lY2hvIFwibmV0LmlwdjQuY29uZi5hbGwuc2VuZF9yZWRpcmVjdHMgPSAwXCIgPj4gL2V0Yy9zeXNjdGwuY29uZlxuZWNobyBcIm5ldC5pcHY0LmNvbmYuZGVmYXVsdC5zZW5kX3JlZGlyZWN0cyA9IDBcIiA+PiAvZXRjL3N5c2N0bC5jb25mXG5lY2hvIFwibmV0LmlwdjQuY29uZi5hbGwuYWNjZXB0X3NvdXJjZV9yb3V0ZSA9IDBcIiA+PiAvZXRjL3N5c2N0bC5jb25mXG5lY2hvIFwibmV0LmlwdjQuY29uZi5kZWZhdWx0LmFjY2VwdF9zb3VyY2Vfcm91dGUgPSAwXCIgPj4gL2V0Yy9zeXNjdGwuY29uZlxuZWNobyBcIm5ldC5pcHY0LmNvbmYuYWxsLmFjY2VwdF9yZWRpcmVjdHMgPSAwXCIgPj4gL2V0Yy9zeXNjdGwuY29uZlxuZWNobyBcIm5ldC5pcHY0LmNvbmYuZGVmYXVsdC5hY2NlcHRfcmVkaXJlY3RzID0gMFwiID4+IC9ldGMvc3lzY3RsLmNvbmZcbnN5c2N0bCAtcFxuXG4jIEluc3RhbGwgYW5kIHN0YXJ0IGh0dHBkIGZvciB3ZWIgc2VydmVyIGZ1bmN0aW9uYWxpdHlcbnl1bSBpbnN0YWxsIC15IGh0dHBkXG5zeXN0ZW1jdGwgZW5hYmxlIGh0dHBkXG5zeXN0ZW1jdGwgc3RhcnQgaHR0cGRcblxuIyBDcmVhdGUgYSBzaW1wbGUgaW5kZXggcGFnZVxuZWNobyBcIjxodG1sPjxib2R5PjxoMT5UQVAgU2VjdXJlIFdlYiBTZXJ2ZXIgLSAke2Vudmlyb25tZW50U3VmZml4fTwvaDE+PHA+U2VydmVyIGlzIHJ1bm5pbmcgc2VjdXJlbHkuPC9wPjwvYm9keT48L2h0bWw+XCIgPiAvdmFyL3d3dy9odG1sL2luZGV4Lmh0bWxcblxuIyBTZXQgcHJvcGVyIHBlcm1pc3Npb25zXG5jaG1vZCA2NDQgL3Zhci93d3cvaHRtbC9pbmRleC5odG1sXG5jaG93biBhcGFjaGU6YXBhY2hlIC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbFxuYDtcblxuICAgIC8vIENyZWF0ZSB0aGUgRUMyIGluc3RhbmNlIHdpdGggc2VjdXJpdHkgYmVzdCBwcmFjdGljZXNcbiAgICBjb25zdCB3ZWJTZXJ2ZXJJbnN0YW5jZSA9IG5ldyBhd3MuZWMyLkluc3RhbmNlKFxuICAgICAgYHRhcC13ZWItc2VydmVyLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYW1pOiBhbWlEYXRhLnRoZW4oYW1pID0+IGFtaS5pZCksXG4gICAgICAgIGluc3RhbmNlVHlwZTogaW5zdGFuY2VUeXBlLFxuICAgICAgICBzdWJuZXRJZDogYXJncy5zdWJuZXRJZCxcbiAgICAgICAgdnBjU2VjdXJpdHlHcm91cElkczogW2FyZ3Muc2VjdXJpdHlHcm91cElkXSxcbiAgICAgICAgaWFtSW5zdGFuY2VQcm9maWxlOiBpbnN0YW5jZVByb2ZpbGUubmFtZSxcbiAgICAgICAgdXNlckRhdGE6IEJ1ZmZlci5mcm9tKHVzZXJEYXRhKS50b1N0cmluZygnYmFzZTY0JyksXG5cbiAgICAgICAgLy8gRW5hYmxlIGRldGFpbGVkIG1vbml0b3JpbmdcbiAgICAgICAgbW9uaXRvcmluZzogdHJ1ZSxcblxuICAgICAgICAvLyBEaXNhYmxlIGluc3RhbmNlIG1ldGFkYXRhIHNlcnZpY2UgdjEgKHNlY3VyaXR5IGJlc3QgcHJhY3RpY2UpXG4gICAgICAgIG1ldGFkYXRhT3B0aW9uczoge1xuICAgICAgICAgIGh0dHBFbmRwb2ludDogJ2VuYWJsZWQnLFxuICAgICAgICAgIGh0dHBUb2tlbnM6ICdyZXF1aXJlZCcsIC8vIFJlcXVpcmUgSU1EU3YyXG4gICAgICAgICAgaHR0cFB1dFJlc3BvbnNlSG9wTGltaXQ6IDEsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gUm9vdCBibG9jayBkZXZpY2Ugd2l0aCBlbmNyeXB0aW9uXG4gICAgICAgIHJvb3RCbG9ja0RldmljZToge1xuICAgICAgICAgIHZvbHVtZVR5cGU6ICdncDMnLFxuICAgICAgICAgIHZvbHVtZVNpemU6IDIwLFxuICAgICAgICAgIGVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAgICBkZWxldGVPblRlcm1pbmF0aW9uOiB0cnVlLFxuICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgIE5hbWU6IGB0YXAtd2ViLXNlcnZlci1yb290LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAgIFZvbHVtZVR5cGU6ICdyb290JyxcbiAgICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBBZGRpdGlvbmFsIEVCUyBibG9jayBkZXZpY2UgKGV4YW1wbGUgb2YgZW5jcnlwdGVkIGFkZGl0aW9uYWwgc3RvcmFnZSlcbiAgICAgICAgZWJzQmxvY2tEZXZpY2VzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZGV2aWNlTmFtZTogJy9kZXYvc2RmJyxcbiAgICAgICAgICAgIHZvbHVtZVR5cGU6ICdncDMnLFxuICAgICAgICAgICAgdm9sdW1lU2l6ZTogMTAsXG4gICAgICAgICAgICBlbmNyeXB0ZWQ6IHRydWUsXG4gICAgICAgICAgICBkZWxldGVPblRlcm1pbmF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgICBOYW1lOiBgdGFwLXdlYi1zZXJ2ZXItZGF0YS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICAgIFZvbHVtZVR5cGU6ICdkYXRhJyxcbiAgICAgICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcblxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC13ZWItc2VydmVyLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnU2VjdXJlV2ViU2VydmVyJyxcbiAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgQXV0b1N0YXJ0U3RvcDogJ3RydWUnLCAvLyBGb3IgY29zdCBvcHRpbWl6YXRpb25cbiAgICAgICAgICBCYWNrdXBSZXF1aXJlZDogJ3RydWUnLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG5cbiAgICAgICAgLy8gRW5hYmxlIHRlcm1pbmF0aW9uIHByb3RlY3Rpb24gZm9yIHByb2R1Y3Rpb25cbiAgICAgICAgZGlzYWJsZUFwaVRlcm1pbmF0aW9uOiBlbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5pbnN0YW5jZUlkID0gd2ViU2VydmVySW5zdGFuY2UuaWQ7XG4gICAgdGhpcy5pbnN0YW5jZUFybiA9IHdlYlNlcnZlckluc3RhbmNlLmFybjtcbiAgICB0aGlzLnB1YmxpY0lwID0gd2ViU2VydmVySW5zdGFuY2UucHVibGljSXA7XG4gICAgdGhpcy5wcml2YXRlSXAgPSB3ZWJTZXJ2ZXJJbnN0YW5jZS5wcml2YXRlSXA7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBpbnN0YW5jZUlkOiB0aGlzLmluc3RhbmNlSWQsXG4gICAgICBpbnN0YW5jZUFybjogdGhpcy5pbnN0YW5jZUFybixcbiAgICAgIHB1YmxpY0lwOiB0aGlzLnB1YmxpY0lwLFxuICAgICAgcHJpdmF0ZUlwOiB0aGlzLnByaXZhdGVJcCxcbiAgICB9KTtcbiAgfVxufVxuIl19