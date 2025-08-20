/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the SecureApp project with security-focused infrastructure.
 *
 * It orchestrates the instantiation of S3, RDS, EC2, and CloudWatch components
 * with proper security configurations and IAM permissions.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
/**
 * Represents the main Pulumi component resource for the SecureApp project.
 *
 * This component creates secure AWS infrastructure including:
 * - S3 bucket with server-side encryption
 * - RDS MySQL instance in public subnet
 * - EC2 instances with IAM roles
 * - CloudWatch alarms for CPU monitoring
 */
export class TapStack extends pulumi.ComponentResource {
    bucketName;
    dbEndpoint;
    ec2InstanceIds;
    /**
     * Creates a new TapStack component.
     * @param name The logical name of this Pulumi component.
     * @param args Configuration arguments including environment suffix and tags.
     * @param opts Pulumi options.
     */
    constructor(name, args, opts) {
        super('tap:stack:TapStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        const createDatabase = args.createDatabase !== false; // Default to true unless explicitly set to false
        // Get default VPC and subnets
        const defaultVpc = aws.ec2.getVpc({
            default: true,
        }, { parent: this });
        const publicSubnets = defaultVpc.then(vpc => aws.ec2.getSubnets({
            filters: [
                {
                    name: 'vpc-id',
                    values: [vpc.id],
                },
                {
                    name: 'default-for-az',
                    values: ['true'],
                },
            ],
        }));
        // Get a subnet in a supported availability zone for EC2 instances
        const publicSubnet = publicSubnets.then(async (subnets) => {
            // Try to find a subnet in a supported AZ (not us-east-1e)
            for (const subnetId of subnets.ids) {
                const subnet = await aws.ec2.getSubnet({ id: subnetId });
                // Avoid us-east-1e as it doesn't support t3.micro
                if (!subnet.availabilityZone.endsWith('1e')) {
                    return subnet;
                }
            }
            // Fallback to first subnet if none found
            return aws.ec2.getSubnet({ id: subnets.ids[0] });
        });
        // Create S3 bucket
        const dataBucket = new aws.s3.Bucket(`SecureApp-DataBucket-${environmentSuffix}`, {
            bucket: `secureapp-databucket-${environmentSuffix}`,
            forceDestroy: true, // Allow easy cleanup
            tags: {
                ...tags,
                Name: `SecureApp-DataBucket-${environmentSuffix}`,
                Purpose: 'Secure application data storage',
            },
        }, { parent: this });
        // Configure server-side encryption for the bucket
        new aws.s3.BucketServerSideEncryptionConfigurationV2(`SecureApp-BucketEncryption-${environmentSuffix}`, {
            bucket: dataBucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256',
                    },
                },
            ],
        }, { parent: this });
        // Apply public access block to the bucket
        new aws.s3.BucketPublicAccessBlock(`SecureApp-BucketPublicAccessBlock-${environmentSuffix}`, {
            bucket: dataBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Conditionally create database-related resources
        let database;
        let dbSecurityGroup;
        let dbSubnetGroup;
        if (createDatabase) {
            // Create security group for RDS
            dbSecurityGroup = new aws.ec2.SecurityGroup(`SecureApp-DbSecurityGroup-${environmentSuffix}`, {
                name: `secureapp-db-sg-${environmentSuffix}`,
                description: 'Security group for SecureApp RDS instance',
                vpcId: defaultVpc.then(vpc => vpc.id),
                ingress: [
                    {
                        protocol: 'tcp',
                        fromPort: 3306,
                        toPort: 3306,
                        cidrBlocks: ['0.0.0.0/0'], // Public access as required
                    },
                ],
                egress: [
                    {
                        protocol: '-1',
                        fromPort: 0,
                        toPort: 0,
                        cidrBlocks: ['0.0.0.0/0'],
                    },
                ],
                tags: {
                    ...tags,
                    Name: `SecureApp-DbSecurityGroup-${environmentSuffix}`,
                },
            }, { parent: this });
            // Create DB subnet group
            dbSubnetGroup = new aws.rds.SubnetGroup(`SecureApp-DbSubnetGroup-${environmentSuffix}`, {
                name: `secureapp-db-subnet-group-${environmentSuffix}`,
                subnetIds: publicSubnets.then(subnets => subnets.ids),
                tags: {
                    ...tags,
                    Name: `SecureApp-DbSubnetGroup-${environmentSuffix}`,
                },
            }, { parent: this });
            // Create RDS MySQL instance in public subnet
            database = new aws.rds.Instance(`SecureApp-Database-${environmentSuffix}`, {
                identifier: `secureapp-database-${environmentSuffix}`,
                engine: 'mysql',
                engineVersion: '8.0',
                instanceClass: 'db.t3.micro',
                allocatedStorage: 20,
                storageType: 'gp2',
                dbName: 'secureappdb',
                username: 'admin',
                password: 'SecureAppPassword123!',
                vpcSecurityGroupIds: [dbSecurityGroup.id],
                dbSubnetGroupName: dbSubnetGroup.name,
                publiclyAccessible: true, // Required for direct administrative access
                skipFinalSnapshot: true, // To reduce deployment time
                backupRetentionPeriod: 7,
                storageEncrypted: true,
                // Note: Performance Insights is not available for db.t3.micro instances
                // Would need at least db.t3.small to enable this feature
                tags: {
                    ...tags,
                    Name: `SecureApp-Database-${environmentSuffix}`,
                    Purpose: 'MySQL database for SecureApp',
                },
            }, { parent: this });
        } // End of createDatabase conditional block
        // Create IAM role for EC2 instances
        const ec2Role = new aws.iam.Role(`SecureApp-EC2Role-${environmentSuffix}`, {
            name: `SecureApp-EC2Role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'ec2.amazonaws.com',
                        },
                    },
                ],
            }),
            tags: {
                ...tags,
                Name: `SecureApp-EC2Role-${environmentSuffix}`,
            },
        }, { parent: this });
        // Create IAM policy for S3 and RDS access
        const ec2Policy = new aws.iam.Policy(`SecureApp-EC2Policy-${environmentSuffix}`, {
            name: `SecureApp-EC2Policy-${environmentSuffix}`,
            policy: createDatabase
                ? pulumi
                    .all([dataBucket.arn, database.id])
                    .apply(([bucketArn, _dbId]) => JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Action: [
                                's3:GetObject',
                                's3:PutObject',
                                's3:DeleteObject',
                                's3:ListBucket',
                            ],
                            Resource: [bucketArn, `${bucketArn}/*`],
                        },
                        {
                            Effect: 'Allow',
                            Action: [
                                'rds:DescribeDBInstances',
                                'rds:Connect',
                            ],
                            Resource: '*',
                        },
                        {
                            Effect: 'Allow',
                            Action: [
                                'cloudwatch:PutMetricData',
                                'cloudwatch:GetMetricStatistics',
                                'cloudwatch:ListMetrics',
                            ],
                            Resource: '*',
                        },
                    ],
                }))
                : dataBucket.arn.apply((bucketArn) => JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Action: [
                                's3:GetObject',
                                's3:PutObject',
                                's3:DeleteObject',
                                's3:ListBucket',
                            ],
                            Resource: [bucketArn, `${bucketArn}/*`],
                        },
                        {
                            Effect: 'Allow',
                            Action: [
                                'cloudwatch:PutMetricData',
                                'cloudwatch:GetMetricStatistics',
                                'cloudwatch:ListMetrics',
                            ],
                            Resource: '*',
                        },
                    ],
                })),
            tags: {
                ...tags,
                Name: `SecureApp-EC2Policy-${environmentSuffix}`,
            },
        }, { parent: this });
        // Attach policy to role
        const rolePolicyAttachment = new aws.iam.RolePolicyAttachment(`SecureApp-RolePolicyAttachment-${environmentSuffix}`, {
            role: ec2Role.name,
            policyArn: ec2Policy.arn,
        }, { parent: this });
        // Create instance profile
        const instanceProfile = new aws.iam.InstanceProfile(`SecureApp-InstanceProfile-${environmentSuffix}`, {
            name: `SecureApp-InstanceProfile-${environmentSuffix}`,
            role: ec2Role.name,
        }, { parent: this });
        // Create security group for EC2 instances
        const ec2SecurityGroup = new aws.ec2.SecurityGroup(`SecureApp-EC2SecurityGroup-${environmentSuffix}`, {
            name: `secureapp-ec2-sg-${environmentSuffix}`,
            description: 'Security group for SecureApp EC2 instances',
            vpcId: defaultVpc.then(vpc => vpc.id),
            ingress: [
                {
                    protocol: 'tcp',
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: ['0.0.0.0/0'],
                },
                {
                    protocol: 'tcp',
                    fromPort: 80,
                    toPort: 80,
                    cidrBlocks: ['0.0.0.0/0'],
                },
                {
                    protocol: 'tcp',
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ['0.0.0.0/0'],
                },
            ],
            egress: [
                {
                    protocol: '-1',
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ['0.0.0.0/0'],
                },
            ],
            tags: {
                ...tags,
                Name: `SecureApp-EC2SecurityGroup-${environmentSuffix}`,
            },
        }, { parent: this });
        // Get latest Amazon Linux 2 AMI
        const amiId = aws.ec2.getAmi({
            filters: [
                {
                    name: 'name',
                    values: ['amzn2-ami-hvm-*-x86_64-gp2'],
                },
            ],
            owners: ['137112412989'], // Amazon
            mostRecent: true,
        }, { parent: this });
        // Create EC2 instances
        const ec2Instances = [];
        for (let i = 0; i < 2; i++) {
            const instance = new aws.ec2.Instance(`SecureApp-Instance-${i + 1}-${environmentSuffix}`, {
                ami: amiId.then(ami => ami.id),
                instanceType: 't3.micro',
                keyName: undefined, // No key pair specified, can be added if needed
                vpcSecurityGroupIds: [ec2SecurityGroup.id],
                subnetId: publicSubnet.then(subnet => subnet.id),
                iamInstanceProfile: instanceProfile.name,
                userData: pulumi.interpolate `#!/bin/bash
yum update -y
yum install -y mysql
yum install -y aws-cli
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
`,
                tags: {
                    ...tags,
                    Name: `SecureApp-Instance-${i + 1}-${environmentSuffix}`,
                    Purpose: 'Application server with S3 and RDS access',
                },
            }, { parent: this, dependsOn: [rolePolicyAttachment] });
            ec2Instances.push(instance);
        }
        // Create CloudWatch alarms for CPU utilization > 75%
        ec2Instances.forEach((instance, index) => {
            new aws.cloudwatch.MetricAlarm(`SecureApp-CPUAlarm-${index + 1}-${environmentSuffix}`, {
                name: `SecureApp-CPUAlarm-Instance-${index + 1}-${environmentSuffix}`,
                comparisonOperator: 'GreaterThanThreshold',
                evaluationPeriods: 2,
                metricName: 'CPUUtilization',
                namespace: 'AWS/EC2',
                period: 300, // 5 minutes
                statistic: 'Average',
                threshold: 75,
                alarmDescription: `Alarm when server CPU exceeds 75% for SecureApp Instance ${index + 1}`,
                dimensions: {
                    InstanceId: instance.id,
                },
                tags: {
                    ...tags,
                    Name: `SecureApp-CPUAlarm-${index + 1}-${environmentSuffix}`,
                },
            }, { parent: this });
        });
        // Set outputs
        this.bucketName = dataBucket.id;
        this.dbEndpoint = database?.endpoint ?? pulumi.output(undefined);
        this.ec2InstanceIds = pulumi.all(ec2Instances.map(instance => instance.id));
        // Register the outputs of this component
        this.registerOutputs({
            bucketName: this.bucketName,
            dbEndpoint: this.dbEndpoint,
            ec2InstanceIds: this.ec2InstanceIds,
            dbPassword: database?.password ?? pulumi.output(undefined),
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztHQVFHO0FBQ0gsT0FBTyxLQUFLLEdBQUcsTUFBTSxhQUFhLENBQUM7QUFDbkMsT0FBTyxLQUFLLE1BQU0sTUFBTSxnQkFBZ0IsQ0FBQztBQXlCekM7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLE9BQU8sUUFBUyxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDcEMsVUFBVSxDQUF3QjtJQUNsQyxVQUFVLENBQW9DO0lBQzlDLGNBQWMsQ0FBMEI7SUFFeEQ7Ozs7O09BS0c7SUFDSCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNCO1FBQ2xFLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTlDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMxRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUM3QixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMsY0FBYyxLQUFLLEtBQUssQ0FBQyxDQUFDLGlEQUFpRDtRQUV2Ryw4QkFBOEI7UUFDOUIsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQy9CO1lBQ0UsT0FBTyxFQUFFLElBQUk7U0FDZCxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUMxQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztZQUNqQixPQUFPLEVBQUU7Z0JBQ1A7b0JBQ0UsSUFBSSxFQUFFLFFBQVE7b0JBQ2QsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQztpQkFDakI7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QUksQ0FBQyxVQUFVO1lBQzNCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7WUFDbkMsVUFBVSxFQUFFLFFBQVEsRUFBRSxRQUFRLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUM7U0FDM0QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiB0YXAtc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBUYXBTdGFjayBjbGFzcywgdGhlIG1haW4gUHVsdW1pIENvbXBvbmVudFJlc291cmNlIGZvclxuICogdGhlIFNlY3VyZUFwcCBwcm9qZWN0IHdpdGggc2VjdXJpdHktZm9jdXNlZCBpbmZyYXN0cnVjdHVyZS5cbiAqXG4gKiBJdCBvcmNoZXN0cmF0ZXMgdGhlIGluc3RhbnRpYXRpb24gb2YgUzMsIFJEUywgRUMyLCBhbmQgQ2xvdWRXYXRjaCBjb21wb25lbnRzXG4gKiB3aXRoIHByb3BlciBzZWN1cml0eSBjb25maWd1cmF0aW9ucyBhbmQgSUFNIHBlcm1pc3Npb25zLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuLyoqXG4gKiBUYXBTdGFja0FyZ3MgZGVmaW5lcyB0aGUgaW5wdXQgYXJndW1lbnRzIGZvciB0aGUgVGFwU3RhY2sgUHVsdW1pIGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBUYXBTdGFja0FyZ3Mge1xuICAvKipcbiAgICogQW4gb3B0aW9uYWwgc3VmZml4IGZvciBpZGVudGlmeWluZyB0aGUgZGVwbG95bWVudCBlbnZpcm9ubWVudCAoZS5nLiwgJ2RldicsICdwcm9kJykuXG4gICAqIERlZmF1bHRzIHRvICdkZXYnIGlmIG5vdCBwcm92aWRlZC5cbiAgICovXG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBPcHRpb25hbCBkZWZhdWx0IHRhZ3MgdG8gYXBwbHkgdG8gcmVzb3VyY2VzLlxuICAgKi9cbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcblxuICAvKipcbiAgICogV2hldGhlciB0byBjcmVhdGUgdGhlIFJEUyBkYXRhYmFzZSBpbnN0YW5jZS4gU2V0IHRvIGZhbHNlIHRvIGF2b2lkIHF1b3RhIGlzc3Vlcy5cbiAgICogRGVmYXVsdHMgdG8gdHJ1ZS5cbiAgICovXG4gIGNyZWF0ZURhdGFiYXNlPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIHRoZSBtYWluIFB1bHVtaSBjb21wb25lbnQgcmVzb3VyY2UgZm9yIHRoZSBTZWN1cmVBcHAgcHJvamVjdC5cbiAqXG4gKiBUaGlzIGNvbXBvbmVudCBjcmVhdGVzIHNlY3VyZSBBV1MgaW5mcmFzdHJ1Y3R1cmUgaW5jbHVkaW5nOlxuICogLSBTMyBidWNrZXQgd2l0aCBzZXJ2ZXItc2lkZSBlbmNyeXB0aW9uXG4gKiAtIFJEUyBNeVNRTCBpbnN0YW5jZSBpbiBwdWJsaWMgc3VibmV0XG4gKiAtIEVDMiBpbnN0YW5jZXMgd2l0aCBJQU0gcm9sZXNcbiAqIC0gQ2xvdWRXYXRjaCBhbGFybXMgZm9yIENQVSBtb25pdG9yaW5nXG4gKi9cbmV4cG9ydCBjbGFzcyBUYXBTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXROYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBkYkVuZHBvaW50OiBwdWx1bWkuT3V0cHV0PHN0cmluZyB8IHVuZGVmaW5lZD47XG4gIHB1YmxpYyByZWFkb25seSBlYzJJbnN0YW5jZUlkczogcHVsdW1pLk91dHB1dDxzdHJpbmdbXT47XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVGFwU3RhY2sgY29tcG9uZW50LlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbG9naWNhbCBuYW1lIG9mIHRoaXMgUHVsdW1pIGNvbXBvbmVudC5cbiAgICogQHBhcmFtIGFyZ3MgQ29uZmlndXJhdGlvbiBhcmd1bWVudHMgaW5jbHVkaW5nIGVudmlyb25tZW50IHN1ZmZpeCBhbmQgdGFncy5cbiAgICogQHBhcmFtIG9wdHMgUHVsdW1pIG9wdGlvbnMuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFRhcFN0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6c3RhY2s6VGFwU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuICAgIGNvbnN0IGNyZWF0ZURhdGFiYXNlID0gYXJncy5jcmVhdGVEYXRhYmFzZSAhPT0gZmFsc2U7IC8vIERlZmF1bHQgdG8gdHJ1ZSB1bmxlc3MgZXhwbGljaXRseSBzZXQgdG8gZmFsc2VcblxuICAgIC8vIEdldCBkZWZhdWx0IFZQQyBhbmQgc3VibmV0c1xuICAgIGNvbnN0IGRlZmF1bHRWcGMgPSBhd3MuZWMyLmdldFZwYyhcbiAgICAgIHtcbiAgICAgICAgZGVmYXVsdDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IHB1YmxpY1N1Ym5ldHMgPSBkZWZhdWx0VnBjLnRoZW4odnBjID0+XG4gICAgICBhd3MuZWMyLmdldFN1Ym5ldHMoe1xuICAgICAgICBmaWx0ZXJzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ3ZwYy1pZCcsXG4gICAgICAgICAgICB2YWx1ZXM6IFt2cGMuaWRdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ2RlZmF1bHQtZm9yLWF6JyxcbiAgICAgICAgICAgIHZhbHVlczogWyd0cnVlJ10sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEdldCBhIHN1Ym5ldCBpbiBhIHN1cHBvcnRlZCBhdmFpbGFiaWxpdHkgem9uZSBmb3IgRUMyIGluc3RhbmNlc1xuICAgIGNvbnN0IHB1YmxpY1N1Ym5ldCA9IHB1YmxpY1N1Ym5ldHMudGhlbihhc3luYyBzdWJuZXRzID0+IHtcbiAgICAgIC8vIFRyeSB0byBmaW5kIGEgc3VibmV0IGluIGEgc3VwcG9ydGVkIEFaIChub3QgdXMtZWFzdC0xZSlcbiAgICAgIGZvciAoY29uc3Qgc3VibmV0SWQgb2Ygc3VibmV0cy5pZHMpIHtcbiAgICAgICAgY29uc3Qgc3VibmV0ID0gYXdhaXQgYXdzLmVjMi5nZXRTdWJuZXQoeyBpZDogc3VibmV0SWQgfSk7XG4gICAgICAgIC8vIEF2b2lkIHVzLWVhc3QtMWUgYXMgaXQgZG9lc24ndCBzdXBwb3J0IHQzLm1pY3JvXG4gICAgICAgIGlmICghc3VibmV0LmF2YWlsYWJpbGl0eVpvbmUuZW5kc1dpdGgoJzFlJykpIHtcbiAgICAgICAgICByZXR1cm4gc3VibmV0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBGYWxsYmFjayB0byBmaXJzdCBzdWJuZXQgaWYgbm9uZSBmb3VuZFxuICAgICAgcmV0dXJuIGF3cy5lYzIuZ2V0U3VibmV0KHsgaWQ6IHN1Ym5ldHMuaWRzWzBdIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIFMzIGJ1Y2tldFxuICAgIGNvbnN0IGRhdGFCdWNrZXQgPSBuZXcgYXdzLnMzLkJ1Y2tldChcbiAgICAgIGBTZWN1cmVBcHAtRGF0YUJ1Y2tldC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogYHNlY3VyZWFwcC1kYXRhYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZm9yY2VEZXN0cm95OiB0cnVlLCAvLyBBbGxvdyBlYXN5IGNsZWFudXBcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYFNlY3VyZUFwcC1EYXRhQnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnU2VjdXJlIGFwcGxpY2F0aW9uIGRhdGEgc3RvcmFnZScsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDb25maWd1cmUgc2VydmVyLXNpZGUgZW5jcnlwdGlvbiBmb3IgdGhlIGJ1Y2tldFxuICAgIG5ldyBhd3MuczMuQnVja2V0U2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uVjIoXG4gICAgICBgU2VjdXJlQXBwLUJ1Y2tldEVuY3J5cHRpb24tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGRhdGFCdWNrZXQuaWQsXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBzc2VBbGdvcml0aG06ICdBRVMyNTYnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQXBwbHkgcHVibGljIGFjY2VzcyBibG9jayB0byB0aGUgYnVja2V0XG4gICAgbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgIGBTZWN1cmVBcHAtQnVja2V0UHVibGljQWNjZXNzQmxvY2stJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGRhdGFCdWNrZXQuaWQsXG4gICAgICAgIGJsb2NrUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgYmxvY2tQdWJsaWNQb2xpY3k6IHRydWUsXG4gICAgICAgIGlnbm9yZVB1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0UHVibGljQnVja2V0czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENvbmRpdGlvbmFsbHkgY3JlYXRlIGRhdGFiYXNlLXJlbGF0ZWQgcmVzb3VyY2VzXG4gICAgbGV0IGRhdGFiYXNlOiBhd3MucmRzLkluc3RhbmNlIHwgdW5kZWZpbmVkO1xuICAgIGxldCBkYlNlY3VyaXR5R3JvdXA6IGF3cy5lYzIuU2VjdXJpdHlHcm91cCB8IHVuZGVmaW5lZDtcbiAgICBsZXQgZGJTdWJuZXRHcm91cDogYXdzLnJkcy5TdWJuZXRHcm91cCB8IHVuZGVmaW5lZDtcblxuICAgIGlmIChjcmVhdGVEYXRhYmFzZSkge1xuICAgICAgLy8gQ3JlYXRlIHNlY3VyaXR5IGdyb3VwIGZvciBSRFNcbiAgICAgIGRiU2VjdXJpdHlHcm91cCA9IG5ldyBhd3MuZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICAgIGBTZWN1cmVBcHAtRGJTZWN1cml0eUdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IGBzZWN1cmVhcHAtZGItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIFNlY3VyZUFwcCBSRFMgaW5zdGFuY2UnLFxuICAgICAgICAgIHZwY0lkOiBkZWZhdWx0VnBjLnRoZW4odnBjID0+IHZwYy5pZCksXG4gICAgICAgICAgaW5ncmVzczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICAgIGZyb21Qb3J0OiAzMzA2LFxuICAgICAgICAgICAgICB0b1BvcnQ6IDMzMDYsXG4gICAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sIC8vIFB1YmxpYyBhY2Nlc3MgYXMgcmVxdWlyZWRcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgICBlZ3Jlc3M6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvdG9jb2w6ICctMScsXG4gICAgICAgICAgICAgIGZyb21Qb3J0OiAwLFxuICAgICAgICAgICAgICB0b1BvcnQ6IDAsXG4gICAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICAgIE5hbWU6IGBTZWN1cmVBcHAtRGJTZWN1cml0eUdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuXG4gICAgICAvLyBDcmVhdGUgREIgc3VibmV0IGdyb3VwXG4gICAgICBkYlN1Ym5ldEdyb3VwID0gbmV3IGF3cy5yZHMuU3VibmV0R3JvdXAoXG4gICAgICAgIGBTZWN1cmVBcHAtRGJTdWJuZXRHcm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBgc2VjdXJlYXBwLWRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgc3VibmV0SWRzOiBwdWJsaWNTdWJuZXRzLnRoZW4oc3VibmV0cyA9PiBzdWJuZXRzLmlkcyksXG4gICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICAgIE5hbWU6IGBTZWN1cmVBcHAtRGJTdWJuZXRHcm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICAgKTtcblxuICAgICAgLy8gQ3JlYXRlIFJEUyBNeVNRTCBpbnN0YW5jZSBpbiBwdWJsaWMgc3VibmV0XG4gICAgICBkYXRhYmFzZSA9IG5ldyBhd3MucmRzLkluc3RhbmNlKFxuICAgICAgYFNlY3VyZUFwcC1EYXRhYmFzZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGlkZW50aWZpZXI6IGBzZWN1cmVhcHAtZGF0YWJhc2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBlbmdpbmU6ICdteXNxbCcsXG4gICAgICAgIGVuZ2luZVZlcnNpb246ICc4LjAnLFxuICAgICAgICBpbnN0YW5jZUNsYXNzOiAnZGIudDMubWljcm8nLFxuICAgICAgICBhbGxvY2F0ZWRTdG9yYWdlOiAyMCxcbiAgICAgICAgc3RvcmFnZVR5cGU6ICdncDInLFxuICAgICAgICBkYk5hbWU6ICdzZWN1cmVhcHBkYicsXG4gICAgICAgIHVzZXJuYW1lOiAnYWRtaW4nLFxuICAgICAgICBwYXNzd29yZDogJ1NlY3VyZUFwcFBhc3N3b3JkMTIzIScsXG4gICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFtkYlNlY3VyaXR5R3JvdXAuaWRdLFxuICAgICAgICBkYlN1Ym5ldEdyb3VwTmFtZTogZGJTdWJuZXRHcm91cC5uYW1lLFxuICAgICAgICBwdWJsaWNseUFjY2Vzc2libGU6IHRydWUsIC8vIFJlcXVpcmVkIGZvciBkaXJlY3QgYWRtaW5pc3RyYXRpdmUgYWNjZXNzXG4gICAgICAgIHNraXBGaW5hbFNuYXBzaG90OiB0cnVlLCAvLyBUbyByZWR1Y2UgZGVwbG95bWVudCB0aW1lXG4gICAgICAgIGJhY2t1cFJldGVudGlvblBlcmlvZDogNyxcbiAgICAgICAgc3RvcmFnZUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAgLy8gTm90ZTogUGVyZm9ybWFuY2UgSW5zaWdodHMgaXMgbm90IGF2YWlsYWJsZSBmb3IgZGIudDMubWljcm8gaW5zdGFuY2VzXG4gICAgICAgIC8vIFdvdWxkIG5lZWQgYXQgbGVhc3QgZGIudDMuc21hbGwgdG8gZW5hYmxlIHRoaXMgZmVhdHVyZVxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICBOYW1lOiBgU2VjdXJlQXBwLURhdGFiYXNlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnTXlTUUwgZGF0YWJhc2UgZm9yIFNlY3VyZUFwcCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gICAgfSAvLyBFbmQgb2YgY3JlYXRlRGF0YWJhc2UgY29uZGl0aW9uYWwgYmxvY2tcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZSBmb3IgRUMyIGluc3RhbmNlc1xuICAgIGNvbnN0IGVjMlJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYFNlY3VyZUFwcC1FQzJSb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYFNlY3VyZUFwcC1FQzJSb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdlYzIuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICBOYW1lOiBgU2VjdXJlQXBwLUVDMlJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIElBTSBwb2xpY3kgZm9yIFMzIGFuZCBSRFMgYWNjZXNzXG4gICAgY29uc3QgZWMyUG9saWN5ID0gbmV3IGF3cy5pYW0uUG9saWN5KFxuICAgICAgYFNlY3VyZUFwcC1FQzJQb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgU2VjdXJlQXBwLUVDMlBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHBvbGljeTogY3JlYXRlRGF0YWJhc2VcbiAgICAgICAgICA/IHB1bHVtaVxuICAgICAgICAgICAgICAuYWxsKFtkYXRhQnVja2V0LmFybiwgZGF0YWJhc2UhLmlkXSlcbiAgICAgICAgICAgICAgLmFwcGx5KChbYnVja2V0QXJuLCBfZGJJZF0pID0+XG4gICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnczM6R2V0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdzMzpQdXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3MzOkRlbGV0ZU9iamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAnczM6TGlzdEJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAncmRzOkRlc2NyaWJlREJJbnN0YW5jZXMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3JkczpDb25uZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnY2xvdWR3YXRjaDpQdXRNZXRyaWNEYXRhJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdjbG91ZHdhdGNoOkdldE1ldHJpY1N0YXRpc3RpY3MnLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2Nsb3Vkd2F0Y2g6TGlzdE1ldHJpY3MnLFxuICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgKVxuICAgICAgICAgIDogZGF0YUJ1Y2tldC5hcm4uYXBwbHkoKGJ1Y2tldEFybikgPT5cbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAnczM6R2V0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAnczM6RGVsZXRlT2JqZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAnczM6TGlzdEJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBbYnVja2V0QXJuLCBgJHtidWNrZXRBcm59LypgXSxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgJ2Nsb3Vkd2F0Y2g6UHV0TWV0cmljRGF0YScsXG4gICAgICAgICAgICAgICAgICAgICAgJ2Nsb3Vkd2F0Y2g6R2V0TWV0cmljU3RhdGlzdGljcycsXG4gICAgICAgICAgICAgICAgICAgICAgJ2Nsb3Vkd2F0Y2g6TGlzdE1ldHJpY3MnLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgICAgTmFtZTogYFNlY3VyZUFwcC1FQzJQb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQXR0YWNoIHBvbGljeSB0byByb2xlXG4gICAgY29uc3Qgcm9sZVBvbGljeUF0dGFjaG1lbnQgPSBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5QXR0YWNobWVudChcbiAgICAgIGBTZWN1cmVBcHAtUm9sZVBvbGljeUF0dGFjaG1lbnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiBlYzJSb2xlLm5hbWUsXG4gICAgICAgIHBvbGljeUFybjogZWMyUG9saWN5LmFybixcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBpbnN0YW5jZSBwcm9maWxlXG4gICAgY29uc3QgaW5zdGFuY2VQcm9maWxlID0gbmV3IGF3cy5pYW0uSW5zdGFuY2VQcm9maWxlKFxuICAgICAgYFNlY3VyZUFwcC1JbnN0YW5jZVByb2ZpbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgU2VjdXJlQXBwLUluc3RhbmNlUHJvZmlsZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHJvbGU6IGVjMlJvbGUubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBzZWN1cml0eSBncm91cCBmb3IgRUMyIGluc3RhbmNlc1xuICAgIGNvbnN0IGVjMlNlY3VyaXR5R3JvdXAgPSBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYFNlY3VyZUFwcC1FQzJTZWN1cml0eUdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHNlY3VyZWFwcC1lYzItc2ctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBTZWN1cmVBcHAgRUMyIGluc3RhbmNlcycsXG4gICAgICAgIHZwY0lkOiBkZWZhdWx0VnBjLnRoZW4odnBjID0+IHZwYy5pZCksXG4gICAgICAgIGluZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBmcm9tUG9ydDogMjIsXG4gICAgICAgICAgICB0b1BvcnQ6IDIyLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiA4MCxcbiAgICAgICAgICAgIHRvUG9ydDogODAsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcbiAgICAgICAgICAgIHRvUG9ydDogNDQzLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBlZ3Jlc3M6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBwcm90b2NvbDogJy0xJyxcbiAgICAgICAgICAgIGZyb21Qb3J0OiAwLFxuICAgICAgICAgICAgdG9Qb3J0OiAwLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgICBOYW1lOiBgU2VjdXJlQXBwLUVDMlNlY3VyaXR5R3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gR2V0IGxhdGVzdCBBbWF6b24gTGludXggMiBBTUlcbiAgICBjb25zdCBhbWlJZCA9IGF3cy5lYzIuZ2V0QW1pKFxuICAgICAge1xuICAgICAgICBmaWx0ZXJzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ25hbWUnLFxuICAgICAgICAgICAgdmFsdWVzOiBbJ2Ftem4yLWFtaS1odm0tKi14ODZfNjQtZ3AyJ10sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgb3duZXJzOiBbJzEzNzExMjQxMjk4OSddLCAvLyBBbWF6b25cbiAgICAgICAgbW9zdFJlY2VudDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBFQzIgaW5zdGFuY2VzXG4gICAgY29uc3QgZWMySW5zdGFuY2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgIGNvbnN0IGluc3RhbmNlID0gbmV3IGF3cy5lYzIuSW5zdGFuY2UoXG4gICAgICAgIGBTZWN1cmVBcHAtSW5zdGFuY2UtJHtpICsgMX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB7XG4gICAgICAgICAgYW1pOiBhbWlJZC50aGVuKGFtaSA9PiBhbWkuaWQpLFxuICAgICAgICAgIGluc3RhbmNlVHlwZTogJ3QzLm1pY3JvJyxcbiAgICAgICAgICBrZXlOYW1lOiB1bmRlZmluZWQsIC8vIE5vIGtleSBwYWlyIHNwZWNpZmllZCwgY2FuIGJlIGFkZGVkIGlmIG5lZWRlZFxuICAgICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFtlYzJTZWN1cml0eUdyb3VwLmlkXSxcbiAgICAgICAgICBzdWJuZXRJZDogcHVibGljU3VibmV0LnRoZW4oc3VibmV0ID0+IHN1Ym5ldC5pZCksXG4gICAgICAgICAgaWFtSW5zdGFuY2VQcm9maWxlOiBpbnN0YW5jZVByb2ZpbGUubmFtZSxcbiAgICAgICAgICB1c2VyRGF0YTogcHVsdW1pLmludGVycG9sYXRlYCMhL2Jpbi9iYXNoXG55dW0gdXBkYXRlIC15XG55dW0gaW5zdGFsbCAteSBteXNxbFxueXVtIGluc3RhbGwgLXkgYXdzLWNsaVxuIyBJbnN0YWxsIENsb3VkV2F0Y2ggYWdlbnRcbndnZXQgaHR0cHM6Ly9zMy5hbWF6b25hd3MuY29tL2FtYXpvbmNsb3Vkd2F0Y2gtYWdlbnQvYW1hem9uX2xpbnV4L2FtZDY0L2xhdGVzdC9hbWF6b24tY2xvdWR3YXRjaC1hZ2VudC5ycG1cbnJwbSAtVSAuL2FtYXpvbi1jbG91ZHdhdGNoLWFnZW50LnJwbVxuYCxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgICAgTmFtZTogYFNlY3VyZUFwcC1JbnN0YW5jZS0ke2kgKyAxfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgICBQdXJwb3NlOiAnQXBwbGljYXRpb24gc2VydmVyIHdpdGggUzMgYW5kIFJEUyBhY2Nlc3MnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFtyb2xlUG9saWN5QXR0YWNobWVudF0gfVxuICAgICAgKTtcblxuICAgICAgZWMySW5zdGFuY2VzLnB1c2goaW5zdGFuY2UpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIGFsYXJtcyBmb3IgQ1BVIHV0aWxpemF0aW9uID4gNzUlXG4gICAgZWMySW5zdGFuY2VzLmZvckVhY2goKGluc3RhbmNlLCBpbmRleCkgPT4ge1xuICAgICAgbmV3IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtKFxuICAgICAgICBgU2VjdXJlQXBwLUNQVUFsYXJtLSR7aW5kZXggKyAxfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHtcbiAgICAgICAgICBuYW1lOiBgU2VjdXJlQXBwLUNQVUFsYXJtLUluc3RhbmNlLSR7aW5kZXggKyAxfS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICAgIG1ldHJpY05hbWU6ICdDUFVVdGlsaXphdGlvbicsXG4gICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0VDMicsXG4gICAgICAgICAgcGVyaW9kOiAzMDAsIC8vIDUgbWludXRlc1xuICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICAgIHRocmVzaG9sZDogNzUsXG4gICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogYEFsYXJtIHdoZW4gc2VydmVyIENQVSBleGNlZWRzIDc1JSBmb3IgU2VjdXJlQXBwIEluc3RhbmNlICR7aW5kZXggKyAxfWAsXG4gICAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgICAgSW5zdGFuY2VJZDogaW5zdGFuY2UuaWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAuLi50YWdzLFxuICAgICAgICAgICAgTmFtZTogYFNlY3VyZUFwcC1DUFVBbGFybS0ke2luZGV4ICsgMX0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyBTZXQgb3V0cHV0c1xuICAgIHRoaXMuYnVja2V0TmFtZSA9IGRhdGFCdWNrZXQuaWQ7XG4gICAgdGhpcy5kYkVuZHBvaW50ID0gZGF0YWJhc2U/LmVuZHBvaW50ID8/IHB1bHVtaS5vdXRwdXQodW5kZWZpbmVkKTtcbiAgICB0aGlzLmVjMkluc3RhbmNlSWRzID0gcHVsdW1pLmFsbChlYzJJbnN0YW5jZXMubWFwKGluc3RhbmNlID0+IGluc3RhbmNlLmlkKSk7XG5cbiAgICAvLyBSZWdpc3RlciB0aGUgb3V0cHV0cyBvZiB0aGlzIGNvbXBvbmVudFxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGJ1Y2tldE5hbWU6IHRoaXMuYnVja2V0TmFtZSxcbiAgICAgIGRiRW5kcG9pbnQ6IHRoaXMuZGJFbmRwb2ludCxcbiAgICAgIGVjMkluc3RhbmNlSWRzOiB0aGlzLmVjMkluc3RhbmNlSWRzLFxuICAgICAgZGJQYXNzd29yZDogZGF0YWJhc2U/LnBhc3N3b3JkID8/IHB1bHVtaS5vdXRwdXQodW5kZWZpbmVkKSxcbiAgICB9KTtcbiAgfVxufVxuIl19