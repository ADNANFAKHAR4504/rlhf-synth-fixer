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
exports.ComputeInfrastructure = void 0;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class ComputeInfrastructure extends pulumi.ComponentResource {
    launchTemplate;
    autoscalingGroup;
    instanceIds;
    constructor(name, args, opts) {
        super('tap:components:ComputeInfrastructure', name, args, opts);
        // Get the latest Amazon Linux 2 AMI for the specific region
        const amiResult = pulumi.output(aws.ec2.getAmi({
            mostRecent: true,
            owners: ['amazon'],
            filters: [
                { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
                { name: 'state', values: ['available'] },
            ],
        }, { parent: this, provider: opts?.provider }));
        const amiId = amiResult.id;
        const instanceType = 't3.micro';
        // Define user data to install a web server on the instances
        const userData = `#!/bin/bash
sudo yum update -y
sudo yum install -y httpd
sudo systemctl start httpd
sudo systemctl enable httpd
echo "<h1>Hello from Pulumi!</h1>" > /var/www/html/index.html
`;
        // Create a Launch Template for the EC2 instances
        const launchTemplateTags = pulumi.output(args.tags).apply(tags => ({
            ...tags,
            Name: `${name}-launch-template`,
        }));
        this.launchTemplate = new aws.ec2.LaunchTemplate(`${name}-launch-template`, {
            namePrefix: `${name}-lt-`,
            imageId: amiId,
            instanceType: instanceType,
            userData: pulumi
                .output(userData)
                .apply(data => Buffer.from(data).toString('base64')),
            vpcSecurityGroupIds: [args.securityGroupId],
            tags: launchTemplateTags,
        }, { parent: this });
        // Create an Auto Scaling Group
        const asgTags = pulumi.output(args.tags).apply(tags => Object.entries({ ...tags, Name: `${name}-asg-instance` }).map(([key, value]) => ({
            key,
            value,
            propagateAtLaunch: true,
        })));
        this.autoscalingGroup = new aws.autoscaling.Group(`${name}-asg`, {
            vpcZoneIdentifiers: args.privateSubnetIds,
            minSize: 1,
            maxSize: 3,
            desiredCapacity: 1,
            launchTemplate: {
                id: this.launchTemplate.id,
                version: '$Latest',
            },
            tags: asgTags,
        }, { parent: this });
        // Export key outputs
        // We return the ASG ARN as a list to match the Python script's output structure
        this.instanceIds = this.autoscalingGroup.arn.apply(arn => [arn]);
        this.registerOutputs({
            instanceIds: this.instanceIds,
        });
    }
}
exports.ComputeInfrastructure = ComputeInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbXB1dGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQXlDO0FBQ3pDLGlEQUFtQztBQWFuQyxNQUFhLHFCQUFzQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDakQsY0FBYyxDQUF5QjtJQUN2QyxnQkFBZ0IsQ0FBd0I7SUFDeEMsV0FBVyxDQUEwQjtJQUVyRCxZQUNFLElBQVksRUFDWixJQUErQixFQUMvQixJQUFzQztRQUV0QyxLQUFLLENBQUMsc0NBQXNDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVoRSw0REFBNEQ7UUFDNUQsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FDN0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQ1o7WUFDRSxVQUFVLEVBQUUsSUFBSTtZQUNoQixNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUM7WUFDbEIsT0FBTyxFQUFFO2dCQUNQLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFO2dCQUN4RCxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsV0FBVyxDQUFDLEVBQUU7YUFDekM7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUMzQyxDQUNGLENBQUM7UUFFRixNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQzNCLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQztRQUVoQyw0REFBNEQ7UUFDNUQsTUFBTSxRQUFRLEdBQUc7Ozs7OztDQU1wQixDQUFDO1FBRUUsaURBQWlEO1FBQ2pELE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqRSxHQUFHLElBQUk7WUFDUCxJQUFJLEVBQUUsR0FBRyxJQUFJLGtCQUFrQjtTQUNoQyxDQUFDLENBQUMsQ0FBQztRQUVKLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FDOUMsR0FBRyxJQUFJLGtCQUFrQixFQUN6QjtZQUNFLFVBQVUsRUFBRSxHQUFHLElBQUksTUFBTTtZQUN6QixPQUFPLEVBQUUsS0FBSztZQUNkLFlBQVksRUFBRSxZQUFZO1lBQzFCLFFBQVEsRUFBRSxNQUFNO2lCQUNiLE1BQU0sQ0FBQyxRQUFRLENBQUM7aUJBQ2hCLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3RELG1CQUFtQixFQUFFLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUMzQyxJQUFJLEVBQUUsa0JBQWtCO1NBQ3pCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3BELE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUMzRCxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ2pCLEdBQUc7WUFDSCxLQUFLO1lBQ0wsaUJBQWlCLEVBQUUsSUFBSTtTQUN4QixDQUFDLENBQ0gsQ0FDRixDQUFDO1FBRUYsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQy9DLEdBQUcsSUFBSSxNQUFNLEVBQ2I7WUFDRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCO1lBQ3pDLE9BQU8sRUFBRSxDQUFDO1lBQ1YsT0FBTyxFQUFFLENBQUM7WUFDVixlQUFlLEVBQUUsQ0FBQztZQUNsQixjQUFjLEVBQUU7Z0JBQ2QsRUFBRSxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsRUFBRTtnQkFDMUIsT0FBTyxFQUFFLFNBQVM7YUFDbkI7WUFDRCxJQUFJLEVBQUUsT0FBTztTQUNkLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixxQkFBcUI7UUFDckIsZ0ZBQWdGO1FBQ2hGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7U0FDOUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBOUZELHNEQThGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuLy8gaW1wb3J0IHsgR2V0QW1pUmVzdWx0IH0gZnJvbSAnQHB1bHVtaS9hd3MvZWMyJztcblxuLy8gRGVmaW5lIHRoZSBhcmd1bWVudHMgZm9yIHRoZSBDb21wdXRlSW5mcmFzdHJ1Y3R1cmUgY29tcG9uZW50XG5pbnRlcmZhY2UgQ29tcHV0ZUluZnJhc3RydWN0dXJlQXJncyB7XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLklucHV0PHN0cmluZ1tdPjtcbiAgc2VjdXJpdHlHcm91cElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgZW52aXJvbm1lbnQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICByZWdpb246IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgQ29tcHV0ZUluZnJhc3RydWN0dXJlIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGxhdW5jaFRlbXBsYXRlOiBhd3MuZWMyLkxhdW5jaFRlbXBsYXRlO1xuICBwdWJsaWMgcmVhZG9ubHkgYXV0b3NjYWxpbmdHcm91cDogYXdzLmF1dG9zY2FsaW5nLkdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VJZHM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nW10+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBDb21wdXRlSW5mcmFzdHJ1Y3R1cmVBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCd0YXA6Y29tcG9uZW50czpDb21wdXRlSW5mcmFzdHJ1Y3R1cmUnLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIC8vIEdldCB0aGUgbGF0ZXN0IEFtYXpvbiBMaW51eCAyIEFNSSBmb3IgdGhlIHNwZWNpZmljIHJlZ2lvblxuICAgIGNvbnN0IGFtaVJlc3VsdCA9IHB1bHVtaS5vdXRwdXQoXG4gICAgICBhd3MuZWMyLmdldEFtaShcbiAgICAgICAge1xuICAgICAgICAgIG1vc3RSZWNlbnQ6IHRydWUsXG4gICAgICAgICAgb3duZXJzOiBbJ2FtYXpvbiddLFxuICAgICAgICAgIGZpbHRlcnM6IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ25hbWUnLCB2YWx1ZXM6IFsnYW16bjItYW1pLWh2bS0qLXg4Nl82NC1ncDInXSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc3RhdGUnLCB2YWx1ZXM6IFsnYXZhaWxhYmxlJ10gfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICAgIClcbiAgICApO1xuXG4gICAgY29uc3QgYW1pSWQgPSBhbWlSZXN1bHQuaWQ7XG4gICAgY29uc3QgaW5zdGFuY2VUeXBlID0gJ3QzLm1pY3JvJztcblxuICAgIC8vIERlZmluZSB1c2VyIGRhdGEgdG8gaW5zdGFsbCBhIHdlYiBzZXJ2ZXIgb24gdGhlIGluc3RhbmNlc1xuICAgIGNvbnN0IHVzZXJEYXRhID0gYCMhL2Jpbi9iYXNoXG5zdWRvIHl1bSB1cGRhdGUgLXlcbnN1ZG8geXVtIGluc3RhbGwgLXkgaHR0cGRcbnN1ZG8gc3lzdGVtY3RsIHN0YXJ0IGh0dHBkXG5zdWRvIHN5c3RlbWN0bCBlbmFibGUgaHR0cGRcbmVjaG8gXCI8aDE+SGVsbG8gZnJvbSBQdWx1bWkhPC9oMT5cIiA+IC92YXIvd3d3L2h0bWwvaW5kZXguaHRtbFxuYDtcblxuICAgIC8vIENyZWF0ZSBhIExhdW5jaCBUZW1wbGF0ZSBmb3IgdGhlIEVDMiBpbnN0YW5jZXNcbiAgICBjb25zdCBsYXVuY2hUZW1wbGF0ZVRhZ3MgPSBwdWx1bWkub3V0cHV0KGFyZ3MudGFncykuYXBwbHkodGFncyA9PiAoe1xuICAgICAgLi4udGFncyxcbiAgICAgIE5hbWU6IGAke25hbWV9LWxhdW5jaC10ZW1wbGF0ZWAsXG4gICAgfSkpO1xuXG4gICAgdGhpcy5sYXVuY2hUZW1wbGF0ZSA9IG5ldyBhd3MuZWMyLkxhdW5jaFRlbXBsYXRlKFxuICAgICAgYCR7bmFtZX0tbGF1bmNoLXRlbXBsYXRlYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZVByZWZpeDogYCR7bmFtZX0tbHQtYCxcbiAgICAgICAgaW1hZ2VJZDogYW1pSWQsXG4gICAgICAgIGluc3RhbmNlVHlwZTogaW5zdGFuY2VUeXBlLFxuICAgICAgICB1c2VyRGF0YTogcHVsdW1pXG4gICAgICAgICAgLm91dHB1dCh1c2VyRGF0YSlcbiAgICAgICAgICAuYXBwbHkoZGF0YSA9PiBCdWZmZXIuZnJvbShkYXRhKS50b1N0cmluZygnYmFzZTY0JykpLFxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBbYXJncy5zZWN1cml0eUdyb3VwSWRdLFxuICAgICAgICB0YWdzOiBsYXVuY2hUZW1wbGF0ZVRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYW4gQXV0byBTY2FsaW5nIEdyb3VwXG4gICAgY29uc3QgYXNnVGFncyA9IHB1bHVtaS5vdXRwdXQoYXJncy50YWdzKS5hcHBseSh0YWdzID0+XG4gICAgICBPYmplY3QuZW50cmllcyh7IC4uLnRhZ3MsIE5hbWU6IGAke25hbWV9LWFzZy1pbnN0YW5jZWAgfSkubWFwKFxuICAgICAgICAoW2tleSwgdmFsdWVdKSA9PiAoe1xuICAgICAgICAgIGtleSxcbiAgICAgICAgICB2YWx1ZSxcbiAgICAgICAgICBwcm9wYWdhdGVBdExhdW5jaDogdHJ1ZSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICApO1xuXG4gICAgdGhpcy5hdXRvc2NhbGluZ0dyb3VwID0gbmV3IGF3cy5hdXRvc2NhbGluZy5Hcm91cChcbiAgICAgIGAke25hbWV9LWFzZ2AsXG4gICAgICB7XG4gICAgICAgIHZwY1pvbmVJZGVudGlmaWVyczogYXJncy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgICBtaW5TaXplOiAxLFxuICAgICAgICBtYXhTaXplOiAzLFxuICAgICAgICBkZXNpcmVkQ2FwYWNpdHk6IDEsXG4gICAgICAgIGxhdW5jaFRlbXBsYXRlOiB7XG4gICAgICAgICAgaWQ6IHRoaXMubGF1bmNoVGVtcGxhdGUuaWQsXG4gICAgICAgICAgdmVyc2lvbjogJyRMYXRlc3QnLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiBhc2dUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRXhwb3J0IGtleSBvdXRwdXRzXG4gICAgLy8gV2UgcmV0dXJuIHRoZSBBU0cgQVJOIGFzIGEgbGlzdCB0byBtYXRjaCB0aGUgUHl0aG9uIHNjcmlwdCdzIG91dHB1dCBzdHJ1Y3R1cmVcbiAgICB0aGlzLmluc3RhbmNlSWRzID0gdGhpcy5hdXRvc2NhbGluZ0dyb3VwLmFybi5hcHBseShhcm4gPT4gW2Fybl0pO1xuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGluc3RhbmNlSWRzOiB0aGlzLmluc3RhbmNlSWRzLFxuICAgIH0pO1xuICB9XG59XG4iXX0=