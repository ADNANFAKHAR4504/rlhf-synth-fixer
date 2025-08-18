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
exports.VpcConstruct = void 0;
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const constructs_1 = require("constructs");
class VpcConstruct extends constructs_1.Construct {
    vpc;
    flowLogGroup;
    constructor(scope, id, props) {
        super(scope, id);
        // Create VPC with consistent configuration
        this.vpc = new ec2.Vpc(this, 'Vpc', {
            ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
            maxAzs: props.maxAzs,
            natGateways: props.environmentSuffix === 'prod' ? props.maxAzs : 1,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: `Public-${props.environmentSuffix}`,
                    subnetType: ec2.SubnetType.PUBLIC,
                },
                {
                    cidrMask: 24,
                    name: `Private-${props.environmentSuffix}`,
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                },
                {
                    cidrMask: 28,
                    name: `Isolated-${props.environmentSuffix}`,
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
            enableDnsHostnames: true,
            enableDnsSupport: true,
        });
        // Add VPC Flow Logs for monitoring
        if (props.enableLogging) {
            this.flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
                logGroupName: `/aws/vpc/flowlogs/${props.environmentSuffix}`,
                retention: props.environmentSuffix === 'prod'
                    ? logs.RetentionDays.THREE_MONTHS
                    : logs.RetentionDays.ONE_MONTH,
            });
            new ec2.FlowLog(this, 'VpcFlowLog', {
                resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
                destination: ec2.FlowLogDestination.toCloudWatchLogs(this.flowLogGroup),
            });
        }
        // Add tags for consistency
        this.vpc.node.addMetadata('Environment', props.environmentSuffix);
        this.vpc.node.addMetadata('Component', 'VPC');
    }
}
exports.VpcConstruct = VpcConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLWNvbnN0cnVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZwYy1jb25zdHJ1Y3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBQTJDO0FBQzNDLDJEQUE2QztBQUM3QywyQ0FBdUM7QUFTdkMsTUFBYSxZQUFhLFNBQVEsc0JBQVM7SUFDekIsR0FBRyxDQUFVO0lBQ2IsWUFBWSxDQUFpQjtJQUU3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsMkNBQTJDO1FBQzNDLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUU7WUFDbEMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7WUFDaEQsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO1lBQ3BCLFdBQVcsRUFBRSxLQUFLLENBQUMsaUJBQWlCLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2xFLG1CQUFtQixFQUFFO2dCQUNuQjtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsVUFBVSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7b0JBQ3pDLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU07aUJBQ2xDO2dCQUNEO29CQUNFLFFBQVEsRUFBRSxFQUFFO29CQUNaLElBQUksRUFBRSxXQUFXLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtvQkFDMUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsbUJBQW1CO2lCQUMvQztnQkFDRDtvQkFDRSxRQUFRLEVBQUUsRUFBRTtvQkFDWixJQUFJLEVBQUUsWUFBWSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7b0JBQzNDLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtpQkFDNUM7YUFDRjtZQUNELGtCQUFrQixFQUFFLElBQUk7WUFDeEIsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUFDLENBQUM7UUFFSCxtQ0FBbUM7UUFDbkMsSUFBSSxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUM7WUFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO2dCQUM3RCxZQUFZLEVBQUUscUJBQXFCLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtnQkFDNUQsU0FBUyxFQUNQLEtBQUssQ0FBQyxpQkFBaUIsS0FBSyxNQUFNO29CQUNoQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZO29CQUNqQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTO2FBQ25DLENBQUMsQ0FBQztZQUVILElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFO2dCQUNsQyxZQUFZLEVBQUUsR0FBRyxDQUFDLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO2dCQUN2RCxXQUFXLEVBQUUsR0FBRyxDQUFDLGtCQUFrQixDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxZQUFZLENBQUM7YUFDeEUsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztRQUVELDJCQUEyQjtRQUMzQixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ2xFLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEQsQ0FBQztDQUNGO0FBckRELG9DQXFEQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgVnBjQ29uc3RydWN0UHJvcHMge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICB2cGNDaWRyOiBzdHJpbmc7XG4gIG1heEF6czogbnVtYmVyO1xuICBlbmFibGVMb2dnaW5nOiBib29sZWFuO1xufVxuXG5leHBvcnQgY2xhc3MgVnBjQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IHZwYzogZWMyLlZwYztcbiAgcHVibGljIHJlYWRvbmx5IGZsb3dMb2dHcm91cD86IGxvZ3MuTG9nR3JvdXA7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFZwY0NvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBWUEMgd2l0aCBjb25zaXN0ZW50IGNvbmZpZ3VyYXRpb25cbiAgICB0aGlzLnZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdWcGMnLCB7XG4gICAgICBpcEFkZHJlc3NlczogZWMyLklwQWRkcmVzc2VzLmNpZHIocHJvcHMudnBjQ2lkciksXG4gICAgICBtYXhBenM6IHByb3BzLm1heEF6cyxcbiAgICAgIG5hdEdhdGV3YXlzOiBwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnID8gcHJvcHMubWF4QXpzIDogMSxcbiAgICAgIHN1Ym5ldENvbmZpZ3VyYXRpb246IFtcbiAgICAgICAge1xuICAgICAgICAgIGNpZHJNYXNrOiAyNCxcbiAgICAgICAgICBuYW1lOiBgUHVibGljLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QVUJMSUMsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogYFByaXZhdGUtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjgsXG4gICAgICAgICAgbmFtZTogYElzb2xhdGVkLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVELFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGVuYWJsZURuc0hvc3RuYW1lczogdHJ1ZSxcbiAgICAgIGVuYWJsZURuc1N1cHBvcnQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgVlBDIEZsb3cgTG9ncyBmb3IgbW9uaXRvcmluZ1xuICAgIGlmIChwcm9wcy5lbmFibGVMb2dnaW5nKSB7XG4gICAgICB0aGlzLmZsb3dMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdWcGNGbG93TG9nR3JvdXAnLCB7XG4gICAgICAgIGxvZ0dyb3VwTmFtZTogYC9hd3MvdnBjL2Zsb3dsb2dzLyR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgcmV0ZW50aW9uOlxuICAgICAgICAgIHByb3BzLmVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCdcbiAgICAgICAgICAgID8gbG9ncy5SZXRlbnRpb25EYXlzLlRIUkVFX01PTlRIU1xuICAgICAgICAgICAgOiBsb2dzLlJldGVudGlvbkRheXMuT05FX01PTlRILFxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBlYzIuRmxvd0xvZyh0aGlzLCAnVnBjRmxvd0xvZycsIHtcbiAgICAgICAgcmVzb3VyY2VUeXBlOiBlYzIuRmxvd0xvZ1Jlc291cmNlVHlwZS5mcm9tVnBjKHRoaXMudnBjKSxcbiAgICAgICAgZGVzdGluYXRpb246IGVjMi5GbG93TG9nRGVzdGluYXRpb24udG9DbG91ZFdhdGNoTG9ncyh0aGlzLmZsb3dMb2dHcm91cCksXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBBZGQgdGFncyBmb3IgY29uc2lzdGVuY3lcbiAgICB0aGlzLnZwYy5ub2RlLmFkZE1ldGFkYXRhKCdFbnZpcm9ubWVudCcsIHByb3BzLmVudmlyb25tZW50U3VmZml4KTtcbiAgICB0aGlzLnZwYy5ub2RlLmFkZE1ldGFkYXRhKCdDb21wb25lbnQnLCAnVlBDJyk7XG4gIH1cbn1cbiJdfQ==