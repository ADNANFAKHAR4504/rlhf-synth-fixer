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
exports.NetworkingConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const constructs_1 = require("constructs");
class NetworkingConstruct extends constructs_1.Construct {
    vpc;
    publicSubnet;
    privateSubnet;
    internetGateway;
    constructor(scope, id, props) {
        super(scope, id);
        const { environmentSuffix, region } = props;
        // Define CIDR blocks for different regions
        const cidrBlocks = {
            'us-east-1': '10.0.0.0/16',
            'us-west-1': '10.1.0.0/16',
        };
        const vpcCidr = cidrBlocks[region] || '10.0.0.0/16';
        // Create VPC
        this.vpc = new ec2.Vpc(this, 'VPC', {
            ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
            maxAzs: 2,
            enableDnsHostnames: true,
            enableDnsSupport: true,
            natGateways: 0, // Disable NAT gateways to avoid EIP issues
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: 'Private',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });
        // Get references to the created subnets
        this.publicSubnet = this.vpc.publicSubnets[0];
        this.privateSubnet = this.vpc.isolatedSubnets[0];
        // Tag all networking resources
        cdk.Tags.of(this.vpc).add('Name', `vpc-${environmentSuffix}-${region}`);
        cdk.Tags.of(this.vpc).add('Purpose', 'MultiRegionDevEnvironment');
        cdk.Tags.of(this.vpc).add('Environment', environmentSuffix);
        cdk.Tags.of(this.vpc).add('Region', region);
        // Tag subnets if they exist
        if (this.publicSubnet) {
            cdk.Tags.of(this.publicSubnet).add('Name', `public-subnet-${environmentSuffix}-${region}`);
            cdk.Tags.of(this.publicSubnet).add('Type', 'Public');
        }
        if (this.privateSubnet) {
            cdk.Tags.of(this.privateSubnet).add('Name', `private-subnet-${environmentSuffix}-${region}`);
            cdk.Tags.of(this.privateSubnet).add('Type', 'Private');
        }
    }
}
exports.NetworkingConstruct = NetworkingConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJuZXR3b3JraW5nLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLDJDQUF1QztBQU92QyxNQUFhLG1CQUFvQixTQUFRLHNCQUFTO0lBQ2hDLEdBQUcsQ0FBVTtJQUNiLFlBQVksQ0FBbUI7SUFDL0IsYUFBYSxDQUFvQjtJQUNqQyxlQUFlLENBQXlCO0lBRXhELFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBK0I7UUFDdkUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTVDLDJDQUEyQztRQUMzQyxNQUFNLFVBQVUsR0FBRztZQUNqQixXQUFXLEVBQUUsYUFBYTtZQUMxQixXQUFXLEVBQUUsYUFBYTtTQUMzQixDQUFDO1FBRUYsTUFBTSxPQUFPLEdBQ1gsVUFBVSxDQUFDLE1BQWlDLENBQUMsSUFBSSxhQUFhLENBQUM7UUFFakUsYUFBYTtRQUNiLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7WUFDbEMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUMxQyxNQUFNLEVBQUUsQ0FBQztZQUNULGtCQUFrQixFQUFFLElBQUk7WUFDeEIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixXQUFXLEVBQUUsQ0FBQyxFQUFFLDJDQUEyQztZQUMzRCxtQkFBbUIsRUFBRTtnQkFDbkI7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osSUFBSSxFQUFFLFFBQVE7b0JBQ2QsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTTtpQkFDbEM7Z0JBQ0Q7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osSUFBSSxFQUFFLFNBQVM7b0JBQ2YsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO2lCQUM1QzthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsd0NBQXdDO1FBQ3hDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFxQixDQUFDO1FBQ2xFLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFzQixDQUFDO1FBRXRFLCtCQUErQjtRQUMvQixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxPQUFPLGlCQUFpQixJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDeEUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztRQUNsRSxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQzVELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTVDLDRCQUE0QjtRQUM1QixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN0QixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUNoQyxNQUFNLEVBQ04saUJBQWlCLGlCQUFpQixJQUFJLE1BQU0sRUFBRSxDQUMvQyxDQUFDO1lBQ0YsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQ3ZCLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQ2pDLE1BQU0sRUFDTixrQkFBa0IsaUJBQWlCLElBQUksTUFBTSxFQUFFLENBQ2hELENBQUM7WUFDRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBcEVELGtEQW9FQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuaW50ZXJmYWNlIE5ldHdvcmtpbmdDb25zdHJ1Y3RQcm9wcyB7XG4gIGVudmlyb25tZW50U3VmZml4OiBzdHJpbmc7XG4gIHJlZ2lvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya2luZ0NvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSB2cGM6IGVjMi5WcGM7XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNTdWJuZXQ6IGVjMi5QdWJsaWNTdWJuZXQ7XG4gIHB1YmxpYyByZWFkb25seSBwcml2YXRlU3VibmV0OiBlYzIuUHJpdmF0ZVN1Ym5ldDtcbiAgcHVibGljIHJlYWRvbmx5IGludGVybmV0R2F0ZXdheTogZWMyLkNmbkludGVybmV0R2F0ZXdheTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogTmV0d29ya2luZ0NvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnRTdWZmaXgsIHJlZ2lvbiB9ID0gcHJvcHM7XG5cbiAgICAvLyBEZWZpbmUgQ0lEUiBibG9ja3MgZm9yIGRpZmZlcmVudCByZWdpb25zXG4gICAgY29uc3QgY2lkckJsb2NrcyA9IHtcbiAgICAgICd1cy1lYXN0LTEnOiAnMTAuMC4wLjAvMTYnLFxuICAgICAgJ3VzLXdlc3QtMSc6ICcxMC4xLjAuMC8xNicsXG4gICAgfTtcblxuICAgIGNvbnN0IHZwY0NpZHIgPVxuICAgICAgY2lkckJsb2Nrc1tyZWdpb24gYXMga2V5b2YgdHlwZW9mIGNpZHJCbG9ja3NdIHx8ICcxMC4wLjAuMC8xNic7XG5cbiAgICAvLyBDcmVhdGUgVlBDXG4gICAgdGhpcy52cGMgPSBuZXcgZWMyLlZwYyh0aGlzLCAnVlBDJywge1xuICAgICAgaXBBZGRyZXNzZXM6IGVjMi5JcEFkZHJlc3Nlcy5jaWRyKHZwY0NpZHIpLFxuICAgICAgbWF4QXpzOiAyLFxuICAgICAgZW5hYmxlRG5zSG9zdG5hbWVzOiB0cnVlLFxuICAgICAgZW5hYmxlRG5zU3VwcG9ydDogdHJ1ZSxcbiAgICAgIG5hdEdhdGV3YXlzOiAwLCAvLyBEaXNhYmxlIE5BVCBnYXRld2F5cyB0byBhdm9pZCBFSVAgaXNzdWVzXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ1B1YmxpYycsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFVCTElDLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQcml2YXRlJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVELFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEdldCByZWZlcmVuY2VzIHRvIHRoZSBjcmVhdGVkIHN1Ym5ldHNcbiAgICB0aGlzLnB1YmxpY1N1Ym5ldCA9IHRoaXMudnBjLnB1YmxpY1N1Ym5ldHNbMF0gYXMgZWMyLlB1YmxpY1N1Ym5ldDtcbiAgICB0aGlzLnByaXZhdGVTdWJuZXQgPSB0aGlzLnZwYy5pc29sYXRlZFN1Ym5ldHNbMF0gYXMgZWMyLlByaXZhdGVTdWJuZXQ7XG5cbiAgICAvLyBUYWcgYWxsIG5ldHdvcmtpbmcgcmVzb3VyY2VzXG4gICAgY2RrLlRhZ3Mub2YodGhpcy52cGMpLmFkZCgnTmFtZScsIGB2cGMtJHtlbnZpcm9ubWVudFN1ZmZpeH0tJHtyZWdpb259YCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy52cGMpLmFkZCgnUHVycG9zZScsICdNdWx0aVJlZ2lvbkRldkVudmlyb25tZW50Jyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy52cGMpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudFN1ZmZpeCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy52cGMpLmFkZCgnUmVnaW9uJywgcmVnaW9uKTtcblxuICAgIC8vIFRhZyBzdWJuZXRzIGlmIHRoZXkgZXhpc3RcbiAgICBpZiAodGhpcy5wdWJsaWNTdWJuZXQpIHtcbiAgICAgIGNkay5UYWdzLm9mKHRoaXMucHVibGljU3VibmV0KS5hZGQoXG4gICAgICAgICdOYW1lJyxcbiAgICAgICAgYHB1YmxpYy1zdWJuZXQtJHtlbnZpcm9ubWVudFN1ZmZpeH0tJHtyZWdpb259YFxuICAgICAgKTtcbiAgICAgIGNkay5UYWdzLm9mKHRoaXMucHVibGljU3VibmV0KS5hZGQoJ1R5cGUnLCAnUHVibGljJyk7XG4gICAgfVxuICAgIFxuICAgIGlmICh0aGlzLnByaXZhdGVTdWJuZXQpIHtcbiAgICAgIGNkay5UYWdzLm9mKHRoaXMucHJpdmF0ZVN1Ym5ldCkuYWRkKFxuICAgICAgICAnTmFtZScsXG4gICAgICAgIGBwcml2YXRlLXN1Ym5ldC0ke2Vudmlyb25tZW50U3VmZml4fS0ke3JlZ2lvbn1gXG4gICAgICApO1xuICAgICAgY2RrLlRhZ3Mub2YodGhpcy5wcml2YXRlU3VibmV0KS5hZGQoJ1R5cGUnLCAnUHJpdmF0ZScpO1xuICAgIH1cbiAgfVxufVxuIl19