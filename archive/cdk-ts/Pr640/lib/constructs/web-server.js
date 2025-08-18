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
exports.WebServer = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const constructs_1 = require("constructs");
class WebServer extends constructs_1.Construct {
    instance;
    constructor(scope, id, props) {
        super(scope, id);
        // Create IAM role for EC2 instance
        const instanceRole = new iam.Role(this, 'WebServerRole', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
            ],
        });
        // Grant write access to log bucket
        props.logBucket.grantWrite(instanceRole);
        // User data script to install web server and CloudWatch agent
        const userData = ec2.UserData.forLinux();
        userData.addCommands('yum update -y', 'yum install -y httpd', 'systemctl start httpd', 'systemctl enable httpd', 'echo "<h1>Production Web Server</h1>" > /var/www/html/index.html', 
        // Install CloudWatch agent
        'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm', 'rpm -U ./amazon-cloudwatch-agent.rpm', 
        // Configure log forwarding to S3
        `aws logs create-log-group --log-group-name /aws/ec2/webserver --region ${props.vpc.stack.region}`, `aws s3 sync /var/log/httpd/ s3://${props.logBucket.bucketName}/httpd-logs/`);
        // Create EC2 instance
        this.instance = new ec2.Instance(this, 'WebServerInstance', {
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            securityGroup: props.securityGroup,
            instanceType: props.instanceType ||
                ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machineImage: ec2.MachineImage.latestAmazonLinux({
                generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            }),
            userData: userData,
            role: instanceRole,
            keyName: props.keyName,
        });
        // Apply tags
        cdk.Tags.of(this.instance).add('Environment', 'Production');
        cdk.Tags.of(instanceRole).add('Environment', 'Production');
    }
}
exports.WebServer = WebServer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2ViLXNlcnZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndlYi1zZXJ2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHlEQUEyQztBQUMzQyx5REFBMkM7QUFFM0MsMkNBQXVDO0FBVXZDLE1BQWEsU0FBVSxTQUFRLHNCQUFTO0lBQ3RCLFFBQVEsQ0FBZTtJQUV2QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXFCO1FBQzdELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsbUNBQW1DO1FBQ25DLE1BQU0sWUFBWSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsZUFBZSxFQUFFO1lBQ3ZELFNBQVMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQztZQUN4RCxlQUFlLEVBQUU7Z0JBQ2YsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FDeEMsNkJBQTZCLENBQzlCO2FBQ0Y7U0FDRixDQUFDLENBQUM7UUFFSCxtQ0FBbUM7UUFDbkMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFekMsOERBQThEO1FBQzlELE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDekMsUUFBUSxDQUFDLFdBQVcsQ0FDbEIsZUFBZSxFQUNmLHNCQUFzQixFQUN0Qix1QkFBdUIsRUFDdkIsd0JBQXdCLEVBQ3hCLGtFQUFrRTtRQUVsRSwyQkFBMkI7UUFDM0IsNEdBQTRHLEVBQzVHLHNDQUFzQztRQUV0QyxpQ0FBaUM7UUFDakMsMEVBQTBFLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUNsRyxvQ0FBb0MsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUFVLGNBQWMsQ0FDN0UsQ0FBQztRQUVGLHNCQUFzQjtRQUN0QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUU7WUFDMUQsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHO1lBQ2QsVUFBVSxFQUFFO2dCQUNWLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07YUFDbEM7WUFDRCxhQUFhLEVBQUUsS0FBSyxDQUFDLGFBQWE7WUFDbEMsWUFBWSxFQUNWLEtBQUssQ0FBQyxZQUFZO2dCQUNsQixHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUNuRSxZQUFZLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxpQkFBaUIsQ0FBQztnQkFDL0MsVUFBVSxFQUFFLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjO2FBQ3JELENBQUM7WUFDRixRQUFRLEVBQUUsUUFBUTtZQUNsQixJQUFJLEVBQUUsWUFBWTtZQUNsQixPQUFPLEVBQUUsS0FBSyxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFDO1FBRUgsYUFBYTtRQUNiLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQzVELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDN0QsQ0FBQztDQUNGO0FBM0RELDhCQTJEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2ViU2VydmVyUHJvcHMge1xuICByZWFkb25seSB2cGM6IGVjMi5WcGM7XG4gIHJlYWRvbmx5IHNlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwO1xuICByZWFkb25seSBsb2dCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcmVhZG9ubHkgaW5zdGFuY2VUeXBlPzogZWMyLkluc3RhbmNlVHlwZTtcbiAgcmVhZG9ubHkga2V5TmFtZT86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFdlYlNlcnZlciBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZTogZWMyLkluc3RhbmNlO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBXZWJTZXJ2ZXJQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGUgZm9yIEVDMiBpbnN0YW5jZVxuICAgIGNvbnN0IGluc3RhbmNlUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnV2ViU2VydmVyUm9sZScsIHtcbiAgICAgIGFzc3VtZWRCeTogbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdlYzIuYW1hem9uYXdzLmNvbScpLFxuICAgICAgbWFuYWdlZFBvbGljaWVzOiBbXG4gICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcbiAgICAgICAgICAnQ2xvdWRXYXRjaEFnZW50U2VydmVyUG9saWN5J1xuICAgICAgICApLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHdyaXRlIGFjY2VzcyB0byBsb2cgYnVja2V0XG4gICAgcHJvcHMubG9nQnVja2V0LmdyYW50V3JpdGUoaW5zdGFuY2VSb2xlKTtcblxuICAgIC8vIFVzZXIgZGF0YSBzY3JpcHQgdG8gaW5zdGFsbCB3ZWIgc2VydmVyIGFuZCBDbG91ZFdhdGNoIGFnZW50XG4gICAgY29uc3QgdXNlckRhdGEgPSBlYzIuVXNlckRhdGEuZm9yTGludXgoKTtcbiAgICB1c2VyRGF0YS5hZGRDb21tYW5kcyhcbiAgICAgICd5dW0gdXBkYXRlIC15JyxcbiAgICAgICd5dW0gaW5zdGFsbCAteSBodHRwZCcsXG4gICAgICAnc3lzdGVtY3RsIHN0YXJ0IGh0dHBkJyxcbiAgICAgICdzeXN0ZW1jdGwgZW5hYmxlIGh0dHBkJyxcbiAgICAgICdlY2hvIFwiPGgxPlByb2R1Y3Rpb24gV2ViIFNlcnZlcjwvaDE+XCIgPiAvdmFyL3d3dy9odG1sL2luZGV4Lmh0bWwnLFxuXG4gICAgICAvLyBJbnN0YWxsIENsb3VkV2F0Y2ggYWdlbnRcbiAgICAgICd3Z2V0IGh0dHBzOi8vczMuYW1hem9uYXdzLmNvbS9hbWF6b25jbG91ZHdhdGNoLWFnZW50L2FtYXpvbl9saW51eC9hbWQ2NC9sYXRlc3QvYW1hem9uLWNsb3Vkd2F0Y2gtYWdlbnQucnBtJyxcbiAgICAgICdycG0gLVUgLi9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5ycG0nLFxuXG4gICAgICAvLyBDb25maWd1cmUgbG9nIGZvcndhcmRpbmcgdG8gUzNcbiAgICAgIGBhd3MgbG9ncyBjcmVhdGUtbG9nLWdyb3VwIC0tbG9nLWdyb3VwLW5hbWUgL2F3cy9lYzIvd2Vic2VydmVyIC0tcmVnaW9uICR7cHJvcHMudnBjLnN0YWNrLnJlZ2lvbn1gLFxuICAgICAgYGF3cyBzMyBzeW5jIC92YXIvbG9nL2h0dHBkLyBzMzovLyR7cHJvcHMubG9nQnVja2V0LmJ1Y2tldE5hbWV9L2h0dHBkLWxvZ3MvYFxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgRUMyIGluc3RhbmNlXG4gICAgdGhpcy5pbnN0YW5jZSA9IG5ldyBlYzIuSW5zdGFuY2UodGhpcywgJ1dlYlNlcnZlckluc3RhbmNlJywge1xuICAgICAgdnBjOiBwcm9wcy52cGMsXG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgIH0sXG4gICAgICBzZWN1cml0eUdyb3VwOiBwcm9wcy5zZWN1cml0eUdyb3VwLFxuICAgICAgaW5zdGFuY2VUeXBlOlxuICAgICAgICBwcm9wcy5pbnN0YW5jZVR5cGUgfHxcbiAgICAgICAgZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UMywgZWMyLkluc3RhbmNlU2l6ZS5NSUNSTyksXG4gICAgICBtYWNoaW5lSW1hZ2U6IGVjMi5NYWNoaW5lSW1hZ2UubGF0ZXN0QW1hem9uTGludXgoe1xuICAgICAgICBnZW5lcmF0aW9uOiBlYzIuQW1hem9uTGludXhHZW5lcmF0aW9uLkFNQVpPTl9MSU5VWF8yLFxuICAgICAgfSksXG4gICAgICB1c2VyRGF0YTogdXNlckRhdGEsXG4gICAgICByb2xlOiBpbnN0YW5jZVJvbGUsXG4gICAgICBrZXlOYW1lOiBwcm9wcy5rZXlOYW1lLFxuICAgIH0pO1xuXG4gICAgLy8gQXBwbHkgdGFnc1xuICAgIGNkay5UYWdzLm9mKHRoaXMuaW5zdGFuY2UpLmFkZCgnRW52aXJvbm1lbnQnLCAnUHJvZHVjdGlvbicpO1xuICAgIGNkay5UYWdzLm9mKGluc3RhbmNlUm9sZSkuYWRkKCdFbnZpcm9ubWVudCcsICdQcm9kdWN0aW9uJyk7XG4gIH1cbn1cbiJdfQ==