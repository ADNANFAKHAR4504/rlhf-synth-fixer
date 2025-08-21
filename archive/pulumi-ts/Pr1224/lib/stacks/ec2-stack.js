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
 * This module defines the EC2 stack for creating secure EC2 instances
 * with encrypted storage and proper security configurations.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class Ec2Stack extends pulumi.ComponentResource {
    instanceId;
    instanceArn;
    privateIp;
    publicIp;
    constructor(name, args, opts) {
        super('tap:ec2:Ec2Stack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const instanceType = args.instanceType || 't3.micro';
        const enableKeyPairs = args.enableKeyPairs || false;
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
        // User data script for CloudWatch agent and security hardening
        const userData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/tap/messages",
            "log_stream_name": "{instance_id}"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Install security updates automatically
yum install -y yum-cron
systemctl enable yum-cron
systemctl start yum-cron

# Basic security hardening
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
chmod 644 /var/www/html/index.html
chown apache:apache /var/www/html/index.html
`;
        // Create the EC2 instance
        const webServerInstance = new aws.ec2.Instance(`tap-web-server-${environmentSuffix}`, {
            ami: amiData.then(ami => ami.id),
            instanceType: instanceType,
            subnetId: pulumi
                .output(args.privateSubnetIds)
                .apply(subnets => subnets[0]), // Use first private subnet
            vpcSecurityGroupIds: [args.webSecurityGroupId],
            iamInstanceProfile: args.ec2InstanceProfileName,
            userDataBase64: Buffer.from(userData).toString('base64'),
            keyName: enableKeyPairs ? 'my-key-pair' : undefined,
            associatePublicIpAddress: false, // No public IP for security
            // Enable detailed monitoring
            monitoring: true,
            // Disable instance metadata service v1 (security best practice)
            metadataOptions: {
                httpEndpoint: 'enabled',
                httpTokens: 'required', // Require IMDSv2
                httpPutResponseHopLimit: 1,
                instanceMetadataTags: 'enabled',
            },
            // Root block device with encryption
            rootBlockDevice: {
                volumeType: 'gp3',
                volumeSize: 30,
                encrypted: true,
                kmsKeyId: args.mainKmsKeyArn,
                deleteOnTermination: true,
            },
            tags: {
                Name: `tap-web-server-${environmentSuffix}`,
                Purpose: 'SecureWebServer',
                Environment: environmentSuffix,
                AutoStartStop: 'true',
                BackupRequired: 'true',
                ...tags,
            },
            // Enable termination protection for production
            disableApiTermination: environmentSuffix === 'prod',
        }, { parent: this });
        this.instanceId = webServerInstance.id;
        this.instanceArn = webServerInstance.arn;
        this.privateIp = webServerInstance.privateIp;
        this.publicIp = webServerInstance.publicIp;
        this.registerOutputs({
            instanceId: this.instanceId,
            instanceArn: this.instanceArn,
            privateIp: this.privateIp,
            publicIp: this.publicIp,
        });
    }
}
exports.Ec2Stack = Ec2Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWMyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZWMyLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQWN6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLFVBQVUsQ0FBd0I7SUFDbEMsV0FBVyxDQUF3QjtJQUNuQyxTQUFTLENBQXdCO0lBQ2pDLFFBQVEsQ0FBd0I7SUFFaEQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksSUFBSSxVQUFVLENBQUM7UUFDckQsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUM7UUFDcEQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IsdUNBQXVDO1FBQ3ZDLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDO1lBQzdCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQztZQUNsQixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsSUFBSSxFQUFFLE1BQU07b0JBQ1osTUFBTSxFQUFFLENBQUMscUJBQXFCLENBQUM7aUJBQ2hDO2dCQUNEO29CQUNFLElBQUksRUFBRSxjQUFjO29CQUNwQixNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUM7aUJBQ25CO2dCQUNEO29CQUNFLElBQUksRUFBRSxxQkFBcUI7b0JBQzNCLE1BQU0sRUFB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biAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIEVDMiBzdGFjayBmb3IgY3JlYXRpbmcgc2VjdXJlIEVDMiBpbnN0YW5jZXNcbiAqIHdpdGggZW5jcnlwdGVkIHN0b3JhZ2UgYW5kIHByb3BlciBzZWN1cml0eSBjb25maWd1cmF0aW9ucy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRWMyU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG4gIHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmdbXT47XG4gIHdlYlNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGVjMkluc3RhbmNlUHJvZmlsZU5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBtYWluS21zS2V5QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgaW5zdGFuY2VUeXBlPzogc3RyaW5nO1xuICBlbmFibGVLZXlQYWlycz86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBjbGFzcyBFYzJTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcHJpdmF0ZUlwOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNJcDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogRWMyU3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDplYzI6RWMyU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCBpbnN0YW5jZVR5cGUgPSBhcmdzLmluc3RhbmNlVHlwZSB8fCAndDMubWljcm8nO1xuICAgIGNvbnN0IGVuYWJsZUtleVBhaXJzID0gYXJncy5lbmFibGVLZXlQYWlycyB8fCBmYWxzZTtcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gR2V0IHRoZSBsYXRlc3QgQW1hem9uIExpbnV4IDIwMjMgQU1JXG4gICAgY29uc3QgYW1pRGF0YSA9IGF3cy5lYzIuZ2V0QW1pKHtcbiAgICAgIG1vc3RSZWNlbnQ6IHRydWUsXG4gICAgICBvd25lcnM6IFsnYW1hem9uJ10sXG4gICAgICBmaWx0ZXJzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnbmFtZScsXG4gICAgICAgICAgdmFsdWVzOiBbJ2FsMjAyMy1hbWktKi14ODZfNjQnXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICdhcmNoaXRlY3R1cmUnLFxuICAgICAgICAgIHZhbHVlczogWyd4ODZfNjQnXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6ICd2aXJ0dWFsaXphdGlvbi10eXBlJyxcbiAgICAgICAgICB2YWx1ZXM6IFsnaHZtJ10sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiAnc3RhdGUnLFxuICAgICAgICAgIHZhbHVlczogWydhdmFpbGFibGUnXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBVc2VyIGRhdGEgc2NyaXB0IGZvciBDbG91ZFdhdGNoIGFnZW50IGFuZCBzZWN1cml0eSBoYXJkZW5pbmdcbiAgICBjb25zdCB1c2VyRGF0YSA9IGAjIS9iaW4vYmFzaFxueXVtIHVwZGF0ZSAteVxueXVtIGluc3RhbGwgLXkgYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnRcblxuIyBDb25maWd1cmUgQ2xvdWRXYXRjaCBhZ2VudFxuY2F0ID4gL29wdC9hd3MvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQvZXRjL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50Lmpzb24gPDwgJ0VPRidcbntcbiAgXCJsb2dzXCI6IHtcbiAgICBcImxvZ3NfY29sbGVjdGVkXCI6IHtcbiAgICAgIFwiZmlsZXNcIjoge1xuICAgICAgICBcImNvbGxlY3RfbGlzdFwiOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJmaWxlX3BhdGhcIjogXCIvdmFyL2xvZy9tZXNzYWdlc1wiLFxuICAgICAgICAgICAgXCJsb2dfZ3JvdXBfbmFtZVwiOiBcIi9hd3MvZWMyL3RhcC9tZXNzYWdlc1wiLFxuICAgICAgICAgICAgXCJsb2dfc3RyZWFtX25hbWVcIjogXCJ7aW5zdGFuY2VfaWR9XCJcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbkVPRlxuXG4jIFN0YXJ0IENsb3VkV2F0Y2ggYWdlbnRcbi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2Jpbi9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC1jdGwgLWEgZmV0Y2gtY29uZmlnIC1tIGVjMiAtYyBmaWxlOi9vcHQvYXdzL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50L2V0Yy9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5qc29uIC1zXG5cbiMgSW5zdGFsbCBzZWN1cml0eSB1cGRhdGVzIGF1dG9tYXRpY2FsbHlcbnl1bSBpbnN0YWxsIC15IHl1bS1jcm9uXG5zeXN0ZW1jdGwgZW5hYmxlIHl1bS1jcm9uXG5zeXN0ZW1jdGwgc3RhcnQgeXVtLWNyb25cblxuIyBCYXNpYyBzZWN1cml0eSBoYXJkZW5pbmdcbmVjaG8gXCJuZXQuaXB2NC5jb25mLmFsbC5zZW5kX3JlZGlyZWN0cyA9IDBcIiA+PiAvZXRjL3N5c2N0bC5jb25mXG5lY2hvIFwibmV0LmlwdjQuY29uZi5kZWZhdWx0LnNlbmRfcmVkaXJlY3RzID0gMFwiID4+IC9ldGMvc3lzY3RsLmNvbmZcbmVjaG8gXCJuZXQuaXB2NC5jb25mLmFsbC5hY2NlcHRfc291cmNlX3JvdXRlID0gMFwiID4+IC9ldGMvc3lzY3RsLmNvbmZcbmVjaG8gXCJuZXQuaXB2NC5jb25mLmRlZmF1bHQuYWNjZXB0X3NvdXJjZV9yb3V0ZSA9IDBcIiA+PiAvZXRjL3N5c2N0bC5jb25mXG5lY2hvIFwibmV0LmlwdjQuY29uZi5hbGwuYWNjZXB0X3JlZGlyZWN0cyA9IDBcIiA+PiAvZXRjL3N5c2N0bC5jb25mXG5lY2hvIFwibmV0LmlwdjQuY29uZi5kZWZhdWx0LmFjY2VwdF9yZWRpcmVjdHMgPSAwXCIgPj4gL2V0Yy9zeXNjdGwuY29uZlxuc3lzY3RsIC1wXG5cbiMgSW5zdGFsbCBhbmQgc3RhcnQgaHR0cGQgZm9yIHdlYiBzZXJ2ZXIgZnVuY3Rpb25hbGl0eVxueXVtIGluc3RhbGwgLXkgaHR0cGRcbnN5c3RlbWN0bCBlbmFibGUgaHR0cGRcbnN5c3RlbWN0bCBzdGFydCBodHRwZFxuXG4jIENyZWF0ZSBhIHNpbXBsZSBpbmRleCBwYWdlXG5lY2hvIFwiPGh0bWw+PGJvZHk+PGgxPlRBUCBTZWN1cmUgV2ViIFNlcnZlciAtICR7ZW52aXJvbm1lbnRTdWZmaXh9PC9oMT48cD5TZXJ2ZXIgaXMgcnVubmluZyBzZWN1cmVseS48L3A+PC9ib2R5PjwvaHRtbD5cIiA+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbFxuY2htb2QgNjQ0IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbFxuY2hvd24gYXBhY2hlOmFwYWNoZSAvdmFyL3d3dy9odG1sL2luZGV4Lmh0bWxcbmA7XG5cbiAgICAvLyBDcmVhdGUgdGhlIEVDMiBpbnN0YW5jZVxuICAgIGNvbnN0IHdlYlNlcnZlckluc3RhbmNlID0gbmV3IGF3cy5lYzIuSW5zdGFuY2UoXG4gICAgICBgdGFwLXdlYi1zZXJ2ZXItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBhbWk6IGFtaURhdGEudGhlbihhbWkgPT4gYW1pLmlkKSxcbiAgICAgICAgaW5zdGFuY2VUeXBlOiBpbnN0YW5jZVR5cGUsXG4gICAgICAgIHN1Ym5ldElkOiBwdWx1bWlcbiAgICAgICAgICAub3V0cHV0KGFyZ3MucHJpdmF0ZVN1Ym5ldElkcylcbiAgICAgICAgICAuYXBwbHkoc3VibmV0cyA9PiBzdWJuZXRzWzBdKSwgLy8gVXNlIGZpcnN0IHByaXZhdGUgc3VibmV0XG4gICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFthcmdzLndlYlNlY3VyaXR5R3JvdXBJZF0sXG4gICAgICAgIGlhbUluc3RhbmNlUHJvZmlsZTogYXJncy5lYzJJbnN0YW5jZVByb2ZpbGVOYW1lLFxuICAgICAgICB1c2VyRGF0YUJhc2U2NDogQnVmZmVyLmZyb20odXNlckRhdGEpLnRvU3RyaW5nKCdiYXNlNjQnKSxcbiAgICAgICAga2V5TmFtZTogZW5hYmxlS2V5UGFpcnMgPyAnbXkta2V5LXBhaXInIDogdW5kZWZpbmVkLFxuICAgICAgICBhc3NvY2lhdGVQdWJsaWNJcEFkZHJlc3M6IGZhbHNlLCAvLyBObyBwdWJsaWMgSVAgZm9yIHNlY3VyaXR5XG5cbiAgICAgICAgLy8gRW5hYmxlIGRldGFpbGVkIG1vbml0b3JpbmdcbiAgICAgICAgbW9uaXRvcmluZzogdHJ1ZSxcblxuICAgICAgICAvLyBEaXNhYmxlIGluc3RhbmNlIG1ldGFkYXRhIHNlcnZpY2UgdjEgKHNlY3VyaXR5IGJlc3QgcHJhY3RpY2UpXG4gICAgICAgIG1ldGFkYXRhT3B0aW9uczoge1xuICAgICAgICAgIGh0dHBFbmRwb2ludDogJ2VuYWJsZWQnLFxuICAgICAgICAgIGh0dHBUb2tlbnM6ICdyZXF1aXJlZCcsIC8vIFJlcXVpcmUgSU1EU3YyXG4gICAgICAgICAgaHR0cFB1dFJlc3BvbnNlSG9wTGltaXQ6IDEsXG4gICAgICAgICAgaW5zdGFuY2VNZXRhZGF0YVRhZ3M6ICdlbmFibGVkJyxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBSb290IGJsb2NrIGRldmljZSB3aXRoIGVuY3J5cHRpb25cbiAgICAgICAgcm9vdEJsb2NrRGV2aWNlOiB7XG4gICAgICAgICAgdm9sdW1lVHlwZTogJ2dwMycsXG4gICAgICAgICAgdm9sdW1lU2l6ZTogMzAsXG4gICAgICAgICAgZW5jcnlwdGVkOiB0cnVlLFxuICAgICAgICAgIGttc0tleUlkOiBhcmdzLm1haW5LbXNLZXlBcm4sXG4gICAgICAgICAgZGVsZXRlT25UZXJtaW5hdGlvbjogdHJ1ZSxcbiAgICAgICAgfSxcblxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC13ZWItc2VydmVyLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnU2VjdXJlV2ViU2VydmVyJyxcbiAgICAgICAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnRTdWZmaXgsXG4gICAgICAgICAgQXV0b1N0YXJ0U3RvcDogJ3RydWUnLFxuICAgICAgICAgIEJhY2t1cFJlcXVpcmVkOiAndHJ1ZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcblxuICAgICAgICAvLyBFbmFibGUgdGVybWluYXRpb24gcHJvdGVjdGlvbiBmb3IgcHJvZHVjdGlvblxuICAgICAgICBkaXNhYmxlQXBpVGVybWluYXRpb246IGVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCcsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLmluc3RhbmNlSWQgPSB3ZWJTZXJ2ZXJJbnN0YW5jZS5pZDtcbiAgICB0aGlzLmluc3RhbmNlQXJuID0gd2ViU2VydmVySW5zdGFuY2UuYXJuO1xuICAgIHRoaXMucHJpdmF0ZUlwID0gd2ViU2VydmVySW5zdGFuY2UucHJpdmF0ZUlwO1xuICAgIHRoaXMucHVibGljSXAgPSB3ZWJTZXJ2ZXJJbnN0YW5jZS5wdWJsaWNJcDtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGluc3RhbmNlSWQ6IHRoaXMuaW5zdGFuY2VJZCxcbiAgICAgIGluc3RhbmNlQXJuOiB0aGlzLmluc3RhbmNlQXJuLFxuICAgICAgcHJpdmF0ZUlwOiB0aGlzLnByaXZhdGVJcCxcbiAgICAgIHB1YmxpY0lwOiB0aGlzLnB1YmxpY0lwLFxuICAgIH0pO1xuICB9XG59XG4iXX0=