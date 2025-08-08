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
exports.SecurityConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const constructs_1 = require("constructs");
class SecurityConstruct extends constructs_1.Construct {
    ec2SecurityGroup;
    rdsSecurityGroup;
    ec2Role;
    constructor(scope, id, props) {
        super(scope, id);
        const { environmentSuffix, region, vpc } = props;
        // Create security group for EC2 instances
        this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
            vpc,
            description: 'Security group for EC2 instances',
            allowAllOutbound: true,
        });
        // Allow SSH access (port 22)
        this.ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'Allow SSH access');
        // Allow HTTP access (port 80)
        this.ec2SecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP access');
        // Create security group for RDS
        this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
            vpc,
            description: 'Security group for RDS database',
            allowAllOutbound: false,
        });
        // Allow PostgreSQL access from EC2 security group
        this.rdsSecurityGroup.addIngressRule(this.ec2SecurityGroup, ec2.Port.tcp(5432), 'Allow PostgreSQL access from EC2');
        // Create IAM role for EC2 instances
        this.ec2Role = new iam.Role(this, 'EC2Role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            description: 'IAM role for EC2 instances to access S3',
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
            ],
        });
        // Add S3 access policy for the primary region bucket
        if (region === 'us-east-1') {
            this.ec2Role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListBucket',
                    's3:GetObjectVersion',
                ],
                resources: [
                    `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*`,
                    `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*/*`,
                ],
            }));
        }
        // Cross-region S3 access for us-west-1 instances
        if (region === 'us-west-1') {
            this.ec2Role.addToPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['s3:GetObject', 's3:ListBucket', 's3:GetObjectVersion'],
                resources: [
                    `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*`,
                    `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*/*`,
                ],
            }));
        }
        // Tag security resources
        cdk.Tags.of(this.ec2SecurityGroup).add('Name', `ec2-sg-${environmentSuffix}-${region}`);
        cdk.Tags.of(this.ec2SecurityGroup).add('Purpose', 'EC2Security');
        cdk.Tags.of(this.rdsSecurityGroup).add('Name', `rds-sg-${environmentSuffix}-${region}`);
        cdk.Tags.of(this.rdsSecurityGroup).add('Purpose', 'RDSSecurity');
        cdk.Tags.of(this.ec2Role).add('Name', `ec2-role-${environmentSuffix}-${region}`);
        cdk.Tags.of(this.ec2Role).add('Purpose', 'EC2IAMRole');
    }
}
exports.SecurityConstruct = SecurityConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHktY29uc3RydWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2VjdXJpdHktY29uc3RydWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLDJDQUF1QztBQVF2QyxNQUFhLGlCQUFrQixTQUFRLHNCQUFTO0lBQzlCLGdCQUFnQixDQUFvQjtJQUNwQyxnQkFBZ0IsQ0FBb0I7SUFDcEMsT0FBTyxDQUFXO0lBRWxDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBNkI7UUFDckUsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUVqRCwwQ0FBMEM7UUFDMUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDdEUsR0FBRztZQUNILFdBQVcsRUFBRSxrQ0FBa0M7WUFDL0MsZ0JBQWdCLEVBQUUsSUFBSTtTQUN2QixDQUFDLENBQUM7UUFFSCw2QkFBNkI7UUFDN0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FDbEMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFDbEIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQ2hCLGtCQUFrQixDQUNuQixDQUFDO1FBRUYsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQ2xDLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQ2xCLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUNoQixtQkFBbUIsQ0FDcEIsQ0FBQztRQUVGLGdD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Q0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ3pELENBQUM7Q0FDRjtBQTNHRCw4Q0EyR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmludGVyZmFjZSBTZWN1cml0eUNvbnN0cnVjdFByb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIHZwYzogZWMyLlZwYztcbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyaXR5Q29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGVjMlNlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgcmRzU2VjdXJpdHlHcm91cDogZWMyLlNlY3VyaXR5R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBlYzJSb2xlOiBpYW0uUm9sZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogU2VjdXJpdHlDb25zdHJ1Y3RQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB7IGVudmlyb25tZW50U3VmZml4LCByZWdpb24sIHZwYyB9ID0gcHJvcHM7XG5cbiAgICAvLyBDcmVhdGUgc2VjdXJpdHkgZ3JvdXAgZm9yIEVDMiBpbnN0YW5jZXNcbiAgICB0aGlzLmVjMlNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ0VDMlNlY3VyaXR5R3JvdXAnLCB7XG4gICAgICB2cGMsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBFQzIgaW5zdGFuY2VzJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgfSk7XG5cbiAgICAvLyBBbGxvdyBTU0ggYWNjZXNzIChwb3J0IDIyKVxuICAgIHRoaXMuZWMyU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIGVjMi5QZWVyLmFueUlwdjQoKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCgyMiksXG4gICAgICAnQWxsb3cgU1NIIGFjY2VzcydcbiAgICApO1xuXG4gICAgLy8gQWxsb3cgSFRUUCBhY2Nlc3MgKHBvcnQgODApXG4gICAgdGhpcy5lYzJTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuYW55SXB2NCgpLFxuICAgICAgZWMyLlBvcnQudGNwKDgwKSxcbiAgICAgICdBbGxvdyBIVFRQIGFjY2VzcydcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyaXR5IGdyb3VwIGZvciBSRFNcbiAgICB0aGlzLnJkc1NlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ1JEU1NlY3VyaXR5R3JvdXAnLCB7XG4gICAgICB2cGMsXG4gICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBSRFMgZGF0YWJhc2UnLFxuICAgICAgYWxsb3dBbGxPdXRib3VuZDogZmFsc2UsXG4gICAgfSk7XG5cbiAgICAvLyBBbGxvdyBQb3N0Z3JlU1FMIGFjY2VzcyBmcm9tIEVDMiBzZWN1cml0eSBncm91cFxuICAgIHRoaXMucmRzU2VjdXJpdHlHcm91cC5hZGRJbmdyZXNzUnVsZShcbiAgICAgIHRoaXMuZWMyU2VjdXJpdHlHcm91cCxcbiAgICAgIGVjMi5Qb3J0LnRjcCg1NDMyKSxcbiAgICAgICdBbGxvdyBQb3N0Z3JlU1FMIGFjY2VzcyBmcm9tIEVDMidcbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlIGZvciBFQzIgaW5zdGFuY2VzXG4gICAgdGhpcy5lYzJSb2xlID0gbmV3IGlhbS5Sb2xlKHRoaXMsICdFQzJSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2VjMi5hbWF6b25hd3MuY29tJyksXG4gICAgICBkZXNjcmlwdGlvbjogJ0lBTSByb2xlIGZvciBFQzIgaW5zdGFuY2VzIHRvIGFjY2VzcyBTMycsXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFxuICAgICAgICAgICdBbWF6b25TU01NYW5hZ2VkSW5zdGFuY2VDb3JlJ1xuICAgICAgICApLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBTMyBhY2Nlc3MgcG9saWN5IGZvciB0aGUgcHJpbWFyeSByZWdpb24gYnVja2V0XG4gICAgaWYgKHJlZ2lvbiA9PT0gJ3VzLWVhc3QtMScpIHtcbiAgICAgIHRoaXMuZWMyUm9sZS5hZGRUb1BvbGljeShcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAnczM6R2V0T2JqZWN0JyxcbiAgICAgICAgICAgICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCcsXG4gICAgICAgICAgICAnczM6TGlzdEJ1Y2tldCcsXG4gICAgICAgICAgICAnczM6R2V0T2JqZWN0VmVyc2lvbicsXG4gICAgICAgICAgXSxcbiAgICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICAgIGBhcm46YXdzOnMzOjo6bXVsdGlyZWdpb24tZGV2LWJ1Y2tldC0ke2Vudmlyb25tZW50U3VmZml4fS0qYCxcbiAgICAgICAgICAgIGBhcm46YXdzOnMzOjo6bXVsdGlyZWdpb24tZGV2LWJ1Y2tldC0ke2Vudmlyb25tZW50U3VmZml4fS0qLypgLFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIENyb3NzLXJlZ2lvbiBTMyBhY2Nlc3MgZm9yIHVzLXdlc3QtMSBpbnN0YW5jZXNcbiAgICBpZiAocmVnaW9uID09PSAndXMtd2VzdC0xJykge1xuICAgICAgdGhpcy5lYzJSb2xlLmFkZFRvUG9saWN5KFxuICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxuICAgICAgICAgIGFjdGlvbnM6IFsnczM6R2V0T2JqZWN0JywgJ3MzOkxpc3RCdWNrZXQnLCAnczM6R2V0T2JqZWN0VmVyc2lvbiddLFxuICAgICAgICAgIHJlc291cmNlczogW1xuICAgICAgICAgICAgYGFybjphd3M6czM6OjptdWx0aXJlZ2lvbi1kZXYtYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9LSpgLFxuICAgICAgICAgICAgYGFybjphd3M6czM6OjptdWx0aXJlZ2lvbi1kZXYtYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9LSovKmAsXG4gICAgICAgICAgXSxcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gVGFnIHNlY3VyaXR5IHJlc291cmNlc1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZWMyU2VjdXJpdHlHcm91cCkuYWRkKFxuICAgICAgJ05hbWUnLFxuICAgICAgYGVjMi1zZy0ke2Vudmlyb25tZW50U3VmZml4fS0ke3JlZ2lvbn1gXG4gICAgKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmVjMlNlY3VyaXR5R3JvdXApLmFkZCgnUHVycG9zZScsICdFQzJTZWN1cml0eScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMucmRzU2VjdXJpdHlHcm91cCkuYWRkKFxuICAgICAgJ05hbWUnLFxuICAgICAgYHJkcy1zZy0ke2Vudmlyb25tZW50U3VmZml4fS0ke3JlZ2lvbn1gXG4gICAgKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLnJkc1NlY3VyaXR5R3JvdXApLmFkZCgnUHVycG9zZScsICdSRFNTZWN1cml0eScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZWMyUm9sZSkuYWRkKFxuICAgICAgJ05hbWUnLFxuICAgICAgYGVjMi1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9LSR7cmVnaW9ufWBcbiAgICApO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZWMyUm9sZSkuYWRkKCdQdXJwb3NlJywgJ0VDMklBTVJvbGUnKTtcbiAgfVxufVxuIl19