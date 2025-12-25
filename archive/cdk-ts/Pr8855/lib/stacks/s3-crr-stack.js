"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3CRRStack = void 0;
// stacks/s3-crr-stack.ts
const aws_cdk_lib_1 = require("aws-cdk-lib");
class S3CRRStack extends aws_cdk_lib_1.Stack {
    replicationRole;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { sourceBucketName, destinationBucketName } = props;
        this.replicationRole = new aws_cdk_lib_1.aws_iam.Role(this, 'ReplicationRole', {
            assumedBy: new aws_cdk_lib_1.aws_iam.ServicePrincipal('s3.amazonaws.com'),
        });
        this.replicationRole.addToPolicy(new aws_cdk_lib_1.aws_iam.PolicyStatement({
            actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            resources: [`arn:aws:s3:::${sourceBucketName}`],
        }));
        this.replicationRole.addToPolicy(new aws_cdk_lib_1.aws_iam.PolicyStatement({
            actions: ['s3:GetObjectVersion', 's3:GetObjectVersionAcl'],
            resources: [`arn:aws:s3:::${sourceBucketName}/*`],
        }));
        this.replicationRole.addToPolicy(new aws_cdk_lib_1.aws_iam.PolicyStatement({
            actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
            resources: [`arn:aws:s3:::${destinationBucketName}/*`],
        }));
        const sourceBucket = aws_cdk_lib_1.aws_s3.Bucket.fromBucketName(this, 'SourceBucket', sourceBucketName);
        sourceBucket.addToResourcePolicy(new aws_cdk_lib_1.aws_iam.PolicyStatement({
            principals: [this.replicationRole],
            actions: ['s3:ReplicateObject', 's3:ReplicateDelete'],
            resources: [`arn:aws:s3:::${destinationBucketName}/*`],
        }));
        // S3 Cross-Region Replication configuration
        // Since sourceBucket is imported via fromBucketName, we can't access its CfnBucket
        // The replication configuration needs to be applied to the actual bucket resource
        // in the RegionalResourcesStack where the bucket is created
        // Output replication role ARN for reference
        new aws_cdk_lib_1.CfnOutput(this, 'ReplicationRoleArn', {
            value: this.replicationRole.roleArn,
            description: 'IAM Role ARN for S3 Cross-Region Replication',
        });
        new aws_cdk_lib_1.CfnOutput(this, 'SourceBucketName', {
            value: sourceBucketName,
            description: 'Source bucket name for replication setup',
        });
        new aws_cdk_lib_1.CfnOutput(this, 'DestinationBucketName', {
            value: destinationBucketName,
            description: 'Destination bucket name for replication setup',
        });
        new aws_cdk_lib_1.CfnOutput(this, 'ReplicationConfigCommand', {
            value: `aws s3api put-bucket-replication --bucket ${sourceBucketName} --replication-configuration file://replication-config.json`,
            description: 'AWS CLI command to configure replication (create replication-config.json first)',
        });
        // Add tags
        aws_cdk_lib_1.Tags.of(this).add('Stack', 'S3CRR');
    }
}
exports.S3CRRStack = S3CRRStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtY3JyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiczMtY3JyLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHlCQUF5QjtBQUN6Qiw2Q0FPcUI7QUFRckIsTUFBYSxVQUFXLFNBQVEsbUJBQUs7SUFDbkIsZUFBZSxDQUFXO0lBRTFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsTUFBTSxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTFELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxxQkFBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLEVBQUU7WUFDM0QsU0FBUyxFQUFFLElBQUkscUJBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQztTQUN4RCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FDOUIsSUFBSSxxQkFBRyxDQUFDLGVBQWUsQ0FBQztZQUN0QixPQUFPLEVBQUUsQ0FBQyxnQ0FBZ0MsRUFBRSxlQUFlLENBQUM7WUFDNUQsU0FBUyxFQUFFLENBQUMsZ0JBQWdCLGdCQUFnQixFQUFFLENBQUM7U0FDaEQsQ0FBQyxDQUNILENBQUM7UUFFRixJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FDOUIsSUFBSSxxQkFBRyxDQUFDLGVBQWUsQ0FBQztZQUN0QixPQUFPLEVBQUUsQ0FBQyxxQkFBcUIsRUFBRSx3QkFBd0IsQ0FBQztZQUMxRCxTQUFTLEVBQUUsQ0FBQyxnQkFBZ0IsZ0JBQWdCLElBQUksQ0FBQztTQUNsRCxDQUFDLENBQ0gsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUM5QixJQUFJLHFCQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3RCLE9BQU8sRUFBRSxDQUFDLG9CQUFvQixFQUFFLG9CQUFvQixDQUFDO1lBQ3JELFNBQVMsRUFBRSxDQUFDLGdCQUFnQixxQkFBcUIsSUFBSSxDQUFDO1NBQ3ZELENBQUMsQ0FDSCxDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQUcsb0JBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUMzQyxJQUFJLEVBQ0osY0FBYyxFQUNkLGdCQUFnQixDQUNqQixDQUFDO1FBRUYsWUFBWSxDQUFDLG1CQUFtQixDQUM5QixJQUFJLHFCQUFHLENBQUMsZUFBZSxDQUFDO1lBQ3RCLFVBQVUsRUFBRSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbEMsT0FBTyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLENBQUM7WUFDckQsU0FBUyxFQUFFLENBQUMsZ0JBQWdCLHFCQUFxQixJQUFJLENBQUM7U0FDdkQsQ0FBQyxDQUNILENBQUM7UUFFRiw0Q0FBNEM7UUFDNUMsbUZBQW1GO1FBQ25GLGtGQUFrRjtRQUNsRiw0REFBNEQ7UUFFNUQsNENBQTRDO1FBQzVDLElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDeEMsS0FBSyxFQUFFLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTztZQUNuQyxXQUFXLEVBQUUsOENBQThDO1NBQzVELENBQUMsQ0FBQztRQUVILElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDdEMsS0FBSyxFQUFFLGdCQUFnQjtZQUN2QixXQUFXLEVBQUUsMENBQTBDO1NBQ3hELENBQUMsQ0FBQztRQUVILElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDM0MsS0FBSyxFQUFFLHFCQUFxQjtZQUM1QixXQUFXLEVBQUUsK0NBQStDO1NBQzdELENBQUMsQ0FBQztRQUVILElBQUksdUJBQVMsQ0FBQyxJQUFJLEVBQUUsMEJBQTBCLEVBQUU7WUFDOUMsS0FBSyxFQUFFLDZDQUE2QyxnQkFBZ0IsNkRBQTZEO1lBQ2pJLFdBQVcsRUFDVCxpRkFBaUY7U0FDcEYsQ0FBQyxDQUFDO1FBRUgsV0FBVztRQUNYLGtCQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUNGO0FBN0VELGdDQTZFQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIHN0YWNrcy9zMy1jcnItc3RhY2sudHNcbmltcG9ydCB7XG4gIENmbk91dHB1dCxcbiAgU3RhY2ssXG4gIFN0YWNrUHJvcHMsXG4gIFRhZ3MsXG4gIGF3c19pYW0gYXMgaWFtLFxuICBhd3NfczMgYXMgczMsXG59IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgUzNDUlJTdGFja1Byb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XG4gIHNvdXJjZUJ1Y2tldE5hbWU6IHN0cmluZztcbiAgZGVzdGluYXRpb25CdWNrZXROYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBTM0NSUlN0YWNrIGV4dGVuZHMgU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgcmVwbGljYXRpb25Sb2xlOiBpYW0uUm9sZTtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wczogUzNDUlJTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICBjb25zdCB7IHNvdXJjZUJ1Y2tldE5hbWUsIGRlc3RpbmF0aW9uQnVja2V0TmFtZSB9ID0gcHJvcHM7XG5cbiAgICB0aGlzLnJlcGxpY2F0aW9uUm9sZSA9IG5ldyBpYW0uUm9sZSh0aGlzLCAnUmVwbGljYXRpb25Sb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ3MzLmFtYXpvbmF3cy5jb20nKSxcbiAgICB9KTtcblxuICAgIHRoaXMucmVwbGljYXRpb25Sb2xlLmFkZFRvUG9saWN5KFxuICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xuICAgICAgICBhY3Rpb25zOiBbJ3MzOkdldFJlcGxpY2F0aW9uQ29uZmlndXJhdGlvbicsICdzMzpMaXN0QnVja2V0J10sXG4gICAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOnMzOjo6JHtzb3VyY2VCdWNrZXROYW1lfWBdLFxuICAgICAgfSlcbiAgICApO1xuXG4gICAgdGhpcy5yZXBsaWNhdGlvblJvbGUuYWRkVG9Qb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGFjdGlvbnM6IFsnczM6R2V0T2JqZWN0VmVyc2lvbicsICdzMzpHZXRPYmplY3RWZXJzaW9uQWNsJ10sXG4gICAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOnMzOjo6JHtzb3VyY2VCdWNrZXROYW1lfS8qYF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICB0aGlzLnJlcGxpY2F0aW9uUm9sZS5hZGRUb1BvbGljeShcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgYWN0aW9uczogWydzMzpSZXBsaWNhdGVPYmplY3QnLCAnczM6UmVwbGljYXRlRGVsZXRlJ10sXG4gICAgICAgIHJlc291cmNlczogW2Bhcm46YXdzOnMzOjo6JHtkZXN0aW5hdGlvbkJ1Y2tldE5hbWV9LypgXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGNvbnN0IHNvdXJjZUJ1Y2tldCA9IHMzLkJ1Y2tldC5mcm9tQnVja2V0TmFtZShcbiAgICAgIHRoaXMsXG4gICAgICAnU291cmNlQnVja2V0JyxcbiAgICAgIHNvdXJjZUJ1Y2tldE5hbWVcbiAgICApO1xuXG4gICAgc291cmNlQnVja2V0LmFkZFRvUmVzb3VyY2VQb2xpY3koXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIHByaW5jaXBhbHM6IFt0aGlzLnJlcGxpY2F0aW9uUm9sZV0sXG4gICAgICAgIGFjdGlvbnM6IFsnczM6UmVwbGljYXRlT2JqZWN0JywgJ3MzOlJlcGxpY2F0ZURlbGV0ZSddLFxuICAgICAgICByZXNvdXJjZXM6IFtgYXJuOmF3czpzMzo6OiR7ZGVzdGluYXRpb25CdWNrZXROYW1lfS8qYF0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBTMyBDcm9zcy1SZWdpb24gUmVwbGljYXRpb24gY29uZmlndXJhdGlvblxuICAgIC8vIFNpbmNlIHNvdXJjZUJ1Y2tldCBpcyBpbXBvcnRlZCB2aWEgZnJvbUJ1Y2tldE5hbWUsIHdlIGNhbid0IGFjY2VzcyBpdHMgQ2ZuQnVja2V0XG4gICAgLy8gVGhlIHJlcGxpY2F0aW9uIGNvbmZpZ3VyYXRpb24gbmVlZHMgdG8gYmUgYXBwbGllZCB0byB0aGUgYWN0dWFsIGJ1Y2tldCByZXNvdXJjZVxuICAgIC8vIGluIHRoZSBSZWdpb25hbFJlc291cmNlc1N0YWNrIHdoZXJlIHRoZSBidWNrZXQgaXMgY3JlYXRlZFxuXG4gICAgLy8gT3V0cHV0IHJlcGxpY2F0aW9uIHJvbGUgQVJOIGZvciByZWZlcmVuY2VcbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdSZXBsaWNhdGlvblJvbGVBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5yZXBsaWNhdGlvblJvbGUucm9sZUFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnSUFNIFJvbGUgQVJOIGZvciBTMyBDcm9zcy1SZWdpb24gUmVwbGljYXRpb24nLFxuICAgIH0pO1xuXG4gICAgbmV3IENmbk91dHB1dCh0aGlzLCAnU291cmNlQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBzb3VyY2VCdWNrZXROYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdTb3VyY2UgYnVja2V0IG5hbWUgZm9yIHJlcGxpY2F0aW9uIHNldHVwJyxcbiAgICB9KTtcblxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ0Rlc3RpbmF0aW9uQnVja2V0TmFtZScsIHtcbiAgICAgIHZhbHVlOiBkZXN0aW5hdGlvbkJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0Rlc3RpbmF0aW9uIGJ1Y2tldCBuYW1lIGZvciByZXBsaWNhdGlvbiBzZXR1cCcsXG4gICAgfSk7XG5cbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdSZXBsaWNhdGlvbkNvbmZpZ0NvbW1hbmQnLCB7XG4gICAgICB2YWx1ZTogYGF3cyBzM2FwaSBwdXQtYnVja2V0LXJlcGxpY2F0aW9uIC0tYnVja2V0ICR7c291cmNlQnVja2V0TmFtZX0gLS1yZXBsaWNhdGlvbi1jb25maWd1cmF0aW9uIGZpbGU6Ly9yZXBsaWNhdGlvbi1jb25maWcuanNvbmAsXG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgJ0FXUyBDTEkgY29tbWFuZCB0byBjb25maWd1cmUgcmVwbGljYXRpb24gKGNyZWF0ZSByZXBsaWNhdGlvbi1jb25maWcuanNvbiBmaXJzdCknLFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIHRhZ3NcbiAgICBUYWdzLm9mKHRoaXMpLmFkZCgnU3RhY2snLCAnUzNDUlInKTtcbiAgfVxufVxuIl19