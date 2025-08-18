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
exports.ComputeConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const constructs_1 = require("constructs");
class ComputeConstruct extends constructs_1.Construct {
    instance;
    constructor(scope, id, props) {
        super(scope, id);
        const { environmentSuffix, region, vpc, securityGroup, instanceRole } = props;
        // Create instance profile for the EC2 role
        new iam.CfnInstanceProfile(this, 'InstanceProfile', {
            roles: [instanceRole.roleName],
        });
        // Get the latest Amazon Linux 2023 AMI
        const machineImage = ec2.MachineImage.latestAmazonLinux2023();
        // Create EC2 instance
        this.instance = new ec2.Instance(this, 'Instance', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machineImage,
            securityGroup,
            role: instanceRole,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            userData: ec2.UserData.forLinux(),
            keyName: undefined, // Consider creating or referencing a key pair for SSH access
        });
        // Add user data for basic setup
        this.instance.addUserData('#!/bin/bash', 'yum update -y', 'yum install -y httpd', 'systemctl start httpd', 'systemctl enable httpd', 'echo "<h1>Multi-Region Dev Environment</h1>" > /var/www/html/index.html', `echo "<p>Region: ${region}</p>" >> /var/www/html/index.html`, `echo "<p>Environment: ${environmentSuffix}</p>" >> /var/www/html/index.html`, 'echo "<p>Instance started at: $(date)</p>" >> /var/www/html/index.html');
        // Tag the instance
        cdk.Tags.of(this.instance).add('Name', `ec2-instance-${environmentSuffix}-${region}`);
        cdk.Tags.of(this.instance).add('Purpose', 'DevEnvironment');
        cdk.Tags.of(this.instance).add('Environment', environmentSuffix);
        cdk.Tags.of(this.instance).add('Region', region);
    }
}
exports.ComputeConstruct = ComputeConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjb21wdXRlLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQywyQ0FBdUM7QUFVdkMsTUFBYSxnQkFBaUIsU0FBUSxzQkFBUztJQUM3QixRQUFRLENBQWU7SUFFdkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUE0QjtRQUNwRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsR0FDbkUsS0FBSyxDQUFDO1FBRVIsMkNBQTJDO1FBQzNDLElBQUksR0FBRyxDQUFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxpQkFBaUIsRUFBRTtZQUNsRCxLQUFLLEVBQUUsQ0FBQyxZQUFZLENBQUMsUUFBUSxDQUFDO1NBQy9CLENBQUMsQ0FBQztRQUVILHVDQUF1QztRQUN2QyxNQUFNLFlBQVksR0FBRyxHQUFHLENBQUMsWUFBWSxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFFOUQsc0JBQXNCO1FBQ3RCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDakQsR0FBRztZQUNILFlBQVksRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FDL0IsR0FBRyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQ3BCLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUN2QjtZQUNELFlBQVk7WUFDWixhQUFhO1lBQ2IsSUFBSSxFQUFFLFlBQVk7WUFDbEIsVUFBVSxFQUFFO2dCQUNWLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07YUFDbEM7WUFDRCxRQUFRLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUU7WUFDakMsT0FBTyxFQUFFLFNBQVMsRUFBRSw2REFBNkQ7U0FDbEYsQ0FBQyxDQUFDO1FBRUgsZ0NBQWdDO1FBQ2hDLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUN2QixhQUFhLEVBQ2IsZUFBZSxFQUNmLHNCQUFzQixFQUN0Qix1QkFBdUIsRUFDdkIsd0JBQXdCLEVBQ3hCLHlFQUF5RSxFQUN6RSxvQkFBb0IsTUFBTSxtQ0FBbUMsRUFDN0QseUJBQXlCLGlCQUFpQixtQ0FBbUMsRUFDN0Usd0VBQXdFLENBQ3pFLENBQUM7UUFFRixtQkFBbUI7UUFDbkIsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FDNUIsTUFBTSxFQUNOLGdCQUFnQixpQkFBaUIsSUFBSSxNQUFNLEVBQUUsQ0FDOUMsQ0FBQztRQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDNUQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztRQUNqRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNuRCxDQUFDO0NBQ0Y7QUF4REQsNENBd0RDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgQ29tcHV0ZUNvbnN0cnVjdFByb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIHZwYzogZWMyLlZwYztcbiAgc2VjdXJpdHlHcm91cDogZWMyLlNlY3VyaXR5R3JvdXA7XG4gIGluc3RhbmNlUm9sZTogaWFtLlJvbGU7XG59XG5cbmV4cG9ydCBjbGFzcyBDb21wdXRlQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGluc3RhbmNlOiBlYzIuSW5zdGFuY2U7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IENvbXB1dGVDb25zdHJ1Y3RQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB7IGVudmlyb25tZW50U3VmZml4LCByZWdpb24sIHZwYywgc2VjdXJpdHlHcm91cCwgaW5zdGFuY2VSb2xlIH0gPVxuICAgICAgcHJvcHM7XG5cbiAgICAvLyBDcmVhdGUgaW5zdGFuY2UgcHJvZmlsZSBmb3IgdGhlIEVDMiByb2xlXG4gICAgbmV3IGlhbS5DZm5JbnN0YW5jZVByb2ZpbGUodGhpcywgJ0luc3RhbmNlUHJvZmlsZScsIHtcbiAgICAgIHJvbGVzOiBbaW5zdGFuY2VSb2xlLnJvbGVOYW1lXSxcbiAgICB9KTtcblxuICAgIC8vIEdldCB0aGUgbGF0ZXN0IEFtYXpvbiBMaW51eCAyMDIzIEFNSVxuICAgIGNvbnN0IG1hY2hpbmVJbWFnZSA9IGVjMi5NYWNoaW5lSW1hZ2UubGF0ZXN0QW1hem9uTGludXgyMDIzKCk7XG5cbiAgICAvLyBDcmVhdGUgRUMyIGluc3RhbmNlXG4gICAgdGhpcy5pbnN0YW5jZSA9IG5ldyBlYzIuSW5zdGFuY2UodGhpcywgJ0luc3RhbmNlJywge1xuICAgICAgdnBjLFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKFxuICAgICAgICBlYzIuSW5zdGFuY2VDbGFzcy5UMyxcbiAgICAgICAgZWMyLkluc3RhbmNlU2l6ZS5NSUNST1xuICAgICAgKSxcbiAgICAgIG1hY2hpbmVJbWFnZSxcbiAgICAgIHNlY3VyaXR5R3JvdXAsXG4gICAgICByb2xlOiBpbnN0YW5jZVJvbGUsXG4gICAgICB2cGNTdWJuZXRzOiB7XG4gICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBVQkxJQyxcbiAgICAgIH0sXG4gICAgICB1c2VyRGF0YTogZWMyLlVzZXJEYXRhLmZvckxpbnV4KCksXG4gICAgICBrZXlOYW1lOiB1bmRlZmluZWQsIC8vIENvbnNpZGVyIGNyZWF0aW5nIG9yIHJlZmVyZW5jaW5nIGEga2V5IHBhaXIgZm9yIFNTSCBhY2Nlc3NcbiAgICB9KTtcblxuICAgIC8vIEFkZCB1c2VyIGRhdGEgZm9yIGJhc2ljIHNldHVwXG4gICAgdGhpcy5pbnN0YW5jZS5hZGRVc2VyRGF0YShcbiAgICAgICcjIS9iaW4vYmFzaCcsXG4gICAgICAneXVtIHVwZGF0ZSAteScsXG4gICAgICAneXVtIGluc3RhbGwgLXkgaHR0cGQnLFxuICAgICAgJ3N5c3RlbWN0bCBzdGFydCBodHRwZCcsXG4gICAgICAnc3lzdGVtY3RsIGVuYWJsZSBodHRwZCcsXG4gICAgICAnZWNobyBcIjxoMT5NdWx0aS1SZWdpb24gRGV2IEVudmlyb25tZW50PC9oMT5cIiA+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbCcsXG4gICAgICBgZWNobyBcIjxwPlJlZ2lvbjogJHtyZWdpb259PC9wPlwiID4+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbGAsXG4gICAgICBgZWNobyBcIjxwPkVudmlyb25tZW50OiAke2Vudmlyb25tZW50U3VmZml4fTwvcD5cIiA+PiAvdmFyL3d3dy9odG1sL2luZGV4Lmh0bWxgLFxuICAgICAgJ2VjaG8gXCI8cD5JbnN0YW5jZSBzdGFydGVkIGF0OiAkKGRhdGUpPC9wPlwiID4+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbCdcbiAgICApO1xuXG4gICAgLy8gVGFnIHRoZSBpbnN0YW5jZVxuICAgIGNkay5UYWdzLm9mKHRoaXMuaW5zdGFuY2UpLmFkZChcbiAgICAgICdOYW1lJyxcbiAgICAgIGBlYzItaW5zdGFuY2UtJHtlbnZpcm9ubWVudFN1ZmZpeH0tJHtyZWdpb259YFxuICAgICk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5pbnN0YW5jZSkuYWRkKCdQdXJwb3NlJywgJ0RldkVudmlyb25tZW50Jyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5pbnN0YW5jZSkuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50U3VmZml4KTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmluc3RhbmNlKS5hZGQoJ1JlZ2lvbicsIHJlZ2lvbik7XG4gIH1cbn1cbiJdfQ==