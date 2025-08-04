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
exports.NetworkingStack = void 0;
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const constructs_1 = require("constructs");
class NetworkingStack extends constructs_1.Construct {
    vpc;
    lambdaSecurityGroup;
    s3Endpoint;
    dynamoEndpoint;
    apiGatewayEndpoint;
    constructor(scope, id, _props) {
        super(scope, id);
        // VPC Configuration
        this.vpc = new ec2.Vpc(this, 'ProdDocumentProcessingVpc', {
            maxAzs: 2,
            natGateways: 0, // No NAT Gateway needed with VPC endpoints
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Private',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });
        // Security Group for Lambda functions
        this.lambdaSecurityGroup = new ec2.SecurityGroup(this, 'ProdLambdaSecurityGroup', {
            vpc: this.vpc,
            description: 'Security group for Lambda functions',
            allowAllOutbound: false,
        });
        // Add outbound rule for HTTPS
        this.lambdaSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'HTTPS outbound for AWS services');
        // VPC Endpoints
        this.s3Endpoint = this.vpc.addGatewayEndpoint('ProdS3Endpoint', {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
        });
        this.dynamoEndpoint = this.vpc.addGatewayEndpoint('ProdDynamoDbEndpoint', {
            service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets: [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }],
        });
        this.apiGatewayEndpoint = this.vpc.addInterfaceEndpoint('ProdApiGatewayEndpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
            subnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            securityGroups: [this.lambdaSecurityGroup],
        });
    }
}
exports.NetworkingStack = NetworkingStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV0d29ya2luZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm5ldHdvcmtpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEseURBQTJDO0FBQzNDLDJDQUF1QztBQU12QyxNQUFhLGVBQWdCLFNBQVEsc0JBQVM7SUFDNUIsR0FBRyxDQUFVO0lBQ2IsbUJBQW1CLENBQW9CO0lBQ3ZDLFVBQVUsQ0FBeUI7SUFDbkMsY0FBYyxDQUF5QjtJQUN2QyxrQkFBa0IsQ0FBMkI7SUFFN0QsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxNQUE0QjtRQUNwRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLG9CQUFvQjtRQUNwQixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLEVBQUU7WUFDeEQsTUFBTSxFQUFFLENBQUM7WUFDVCxXQUFXLEVBQUUsQ0FBQyxFQUFFLDJDQUEyQztZQUMzRCxtQkFBbUIsRUFBRTtnQkFDbkI7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osSUFBSSxFQUFFLFNBQVM7b0JBQ2YsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO2lCQUM1QzthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxhQUFhLENBQzlDLElBQUksRUFDSix5QkFBeUIsRUFDekI7WUFDRSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7WUFDYixXQUFXLEVBQUUscUNBQXFDO1lBQ2xELGdCQUFnQixFQUFFLEtBQUs7U0FDeEIsQ0FDRixDQUFDO1FBRUYsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxhQUFhLENBQ3BDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQ2xCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUNqQixpQ0FBaUMsQ0FDbEMsQ0FBQztRQUVGLGdCQUFnQjtRQUNoQixJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsZ0JBQWdCLEVBQUU7WUFDOUQsT0FBTyxFQUFFLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxFQUFFO1lBQzVDLE9BQU8sRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztTQUMzRCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUMsc0JBQXNCLEVBQUU7WUFDeEUsT0FBTyxFQUFFLEdBQUcsQ0FBQyw0QkFBNEIsQ0FBQyxRQUFRO1lBQ2xELE9BQU8sRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztTQUMzRCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FDckQsd0JBQXdCLEVBQ3hCO1lBQ0UsT0FBTyxFQUFFLEdBQUcsQ0FBQyw4QkFBOEIsQ0FBQyxVQUFVO1lBQ3RELE9BQU8sRUFBRSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQixFQUFFO1lBQ3hELGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQztTQUMzQyxDQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUE3REQsMENBNkRDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTmV0d29ya2luZ1N0YWNrUHJvcHMge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgTmV0d29ya2luZ1N0YWNrIGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IHZwYzogZWMyLlZwYztcbiAgcHVibGljIHJlYWRvbmx5IGxhbWJkYVNlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgczNFbmRwb2ludDogZWMyLkdhdGV3YXlWcGNFbmRwb2ludDtcbiAgcHVibGljIHJlYWRvbmx5IGR5bmFtb0VuZHBvaW50OiBlYzIuR2F0ZXdheVZwY0VuZHBvaW50O1xuICBwdWJsaWMgcmVhZG9ubHkgYXBpR2F0ZXdheUVuZHBvaW50OiBlYzIuSW50ZXJmYWNlVnBjRW5kcG9pbnQ7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgX3Byb3BzOiBOZXR3b3JraW5nU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBWUEMgQ29uZmlndXJhdGlvblxuICAgIHRoaXMudnBjID0gbmV3IGVjMi5WcGModGhpcywgJ1Byb2REb2N1bWVudFByb2Nlc3NpbmdWcGMnLCB7XG4gICAgICBtYXhBenM6IDIsXG4gICAgICBuYXRHYXRld2F5czogMCwgLy8gTm8gTkFUIEdhdGV3YXkgbmVlZGVkIHdpdGggVlBDIGVuZHBvaW50c1xuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdQcml2YXRlJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVELFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFNlY3VyaXR5IEdyb3VwIGZvciBMYW1iZGEgZnVuY3Rpb25zXG4gICAgdGhpcy5sYW1iZGFTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdQcm9kTGFtYmRhU2VjdXJpdHlHcm91cCcsXG4gICAgICB7XG4gICAgICAgIHZwYzogdGhpcy52cGMsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIExhbWJkYSBmdW5jdGlvbnMnLFxuICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiBmYWxzZSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gQWRkIG91dGJvdW5kIHJ1bGUgZm9yIEhUVFBTXG4gICAgdGhpcy5sYW1iZGFTZWN1cml0eUdyb3VwLmFkZEVncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5hbnlJcHY0KCksXG4gICAgICBlYzIuUG9ydC50Y3AoNDQzKSxcbiAgICAgICdIVFRQUyBvdXRib3VuZCBmb3IgQVdTIHNlcnZpY2VzJ1xuICAgICk7XG5cbiAgICAvLyBWUEMgRW5kcG9pbnRzXG4gICAgdGhpcy5zM0VuZHBvaW50ID0gdGhpcy52cGMuYWRkR2F0ZXdheUVuZHBvaW50KCdQcm9kUzNFbmRwb2ludCcsIHtcbiAgICAgIHNlcnZpY2U6IGVjMi5HYXRld2F5VnBjRW5kcG9pbnRBd3NTZXJ2aWNlLlMzLFxuICAgICAgc3VibmV0czogW3sgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRCB9XSxcbiAgICB9KTtcblxuICAgIHRoaXMuZHluYW1vRW5kcG9pbnQgPSB0aGlzLnZwYy5hZGRHYXRld2F5RW5kcG9pbnQoJ1Byb2REeW5hbW9EYkVuZHBvaW50Jywge1xuICAgICAgc2VydmljZTogZWMyLkdhdGV3YXlWcGNFbmRwb2ludEF3c1NlcnZpY2UuRFlOQU1PREIsXG4gICAgICBzdWJuZXRzOiBbeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVEIH1dLFxuICAgIH0pO1xuXG4gICAgdGhpcy5hcGlHYXRld2F5RW5kcG9pbnQgPSB0aGlzLnZwYy5hZGRJbnRlcmZhY2VFbmRwb2ludChcbiAgICAgICdQcm9kQXBpR2F0ZXdheUVuZHBvaW50JyxcbiAgICAgIHtcbiAgICAgICAgc2VydmljZTogZWMyLkludGVyZmFjZVZwY0VuZHBvaW50QXdzU2VydmljZS5BUElHQVRFV0FZLFxuICAgICAgICBzdWJuZXRzOiB7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQgfSxcbiAgICAgICAgc2VjdXJpdHlHcm91cHM6IFt0aGlzLmxhbWJkYVNlY3VyaXR5R3JvdXBdLFxuICAgICAgfVxuICAgICk7XG4gIH1cbn1cbiJdfQ==