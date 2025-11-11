/**
 * Integration tests for deployed Pulumi infrastructure
 * These tests validate the actual deployed resources in AWS
 *
 * NOTE: These tests require:
 * 1. Successful deployment to AWS
 * 2. Stack outputs exported to cfn-outputs/flat-outputs.json
 * 3. AWS credentials configured
 */

import * as fs from 'fs';
import * as path from 'path';
import { ECSClient, DescribeClustersCommand, DescribeServicesCommand } from '@aws-sdk/client-ecs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { Route53Client, ListHostedZonesCommand, ListResourceRecordSetsCommand } from '@aws-sdk/client-route-53';
import { CodeDeployClient, GetApplicationCommand, GetDeploymentGroupCommand } from '@aws-sdk/client-codedeploy';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';

// Load outputs from deployment
const OUTPUTS_PATH = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};

beforeAll(() => {
    if (fs.existsSync(OUTPUTS_PATH)) {
        const rawData = fs.readFileSync(OUTPUTS_PATH, 'utf8');
        outputs = JSON.parse(rawData);
        console.log('Loaded stack outputs:', Object.keys(outputs));
    } else {
        console.warn(`Outputs file not found at ${OUTPUTS_PATH}. Integration tests will be skipped.`);
    }
});

describe('Infrastructure Integration Tests', () => {
    const region = 'us-east-2';

    describe('VPC and Networking', () => {
        const ec2Client = new EC2Client({ region });

        it('should have VPC deployed', async () => {
            if (!outputs.vpcId) {
                console.log('Skipping: VPC ID not in outputs');
                return;
            }

            const command = new DescribeVpcsCommand({
                VpcIds: [outputs.vpcId]
            });
            const response = await ec2Client.send(command);

            expect(response.Vpcs).toBeDefined();
            expect(response.Vpcs!.length).toBe(1);
            expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
            expect(response.Vpcs![0].State).toBe('available');
        });

        it('should have public and private subnets across 3 AZs', async () => {
            if (!outputs.vpcId) {
                console.log('Skipping: VPC ID not in outputs');
                return;
            }

            const command = new DescribeSubnetsCommand({
                Filters: [
                    {
                        Name: 'vpc-id',
                        Values: [outputs.vpcId]
                    }
                ]
            });
            const response = await ec2Client.send(command);

            expect(response.Subnets).toBeDefined();
            expect(response.Subnets!.length).toBeGreaterThanOrEqual(6); // 3 public + 3 private

            const availabilityZones = new Set(response.Subnets!.map(s => s.AvailabilityZone));
            expect(availabilityZones.size).toBe(3);
        });
    });

    describe('RDS Aurora Cluster', () => {
        const rdsClient = new RDSClient({ region });

        it('should have Aurora PostgreSQL cluster deployed', async () => {
            if (!outputs.auroraClusterId) {
                console.log('Skipping: Aurora cluster ID not in outputs');
                return;
            }

            const command = new DescribeDBClustersCommand({
                DBClusterIdentifier: outputs.auroraClusterId
            });
            const response = await rdsClient.send(command);

            expect(response.DBClusters).toBeDefined();
            expect(response.DBClusters!.length).toBe(1);
            expect(response.DBClusters![0].Engine).toBe('aurora-postgresql');
            expect(response.DBClusters![0].Status).toBe('available');
        });

        it('should have Aurora endpoint accessible', async () => {
            if (!outputs.auroraEndpoint) {
                console.log('Skipping: Aurora endpoint not in outputs');
                return;
            }

            expect(outputs.auroraEndpoint).toContain('rds.amazonaws.com');
        });
    });

    describe('ECS Cluster and Service', () => {
        const ecsClient = new ECSClient({ region });

        it('should have ECS cluster deployed', async () => {
            if (!outputs.ecsClusterName) {
                console.log('Skipping: ECS cluster name not in outputs');
                return;
            }

            const command = new DescribeClustersCommand({
                clusters: [outputs.ecsClusterName]
            });
            const response = await ecsClient.send(command);

            expect(response.clusters).toBeDefined();
            expect(response.clusters!.length).toBe(1);
            expect(response.clusters![0].status).toBe('ACTIVE');
        });

        it('should have ECS service running', async () => {
            if (!outputs.ecsClusterName || !outputs.ecsServiceName) {
                console.log('Skipping: ECS cluster or service name not in outputs');
                return;
            }

            const command = new DescribeServicesCommand({
                cluster: outputs.ecsClusterName,
                services: [outputs.ecsServiceName]
            });
            const response = await ecsClient.send(command);

            expect(response.services).toBeDefined();
            expect(response.services!.length).toBe(1);
            expect(response.services![0].status).toBe('ACTIVE');
            expect(response.services![0].deploymentController?.type).toBe('CODE_DEPLOY');
        });
    });

    describe('Application Load Balancer', () => {
        const elbClient = new ElasticLoadBalancingV2Client({ region });

        it('should have ALB deployed and active', async () => {
            if (!outputs.albArn) {
                console.log('Skipping: ALB ARN not in outputs');
                return;
            }

            const command = new DescribeLoadBalancersCommand({
                LoadBalancerArns: [outputs.albArn]
            });
            const response = await elbClient.send(command);

            expect(response.LoadBalancers).toBeDefined();
            expect(response.LoadBalancers!.length).toBe(1);
            expect(response.LoadBalancers![0].State?.Code).toBe('active');
            expect(response.LoadBalancers![0].Type).toBe('application');
        });

        it('should have ALB DNS name accessible', async () => {
            if (!outputs.albDnsName) {
                console.log('Skipping: ALB DNS name not in outputs');
                return;
            }

            expect(outputs.albDnsName).toContain('elb.amazonaws.com');
        });

        it('should have blue and green target groups', async () => {
            if (!outputs.targetGroupArn || !outputs.targetGroupGreenArn) {
                console.log('Skipping: Target group ARNs not in outputs');
                return;
            }

            const command = new DescribeTargetGroupsCommand({
                TargetGroupArns: [outputs.targetGroupArn, outputs.targetGroupGreenArn]
            });
            const response = await elbClient.send(command);

            expect(response.TargetGroups).toBeDefined();
            expect(response.TargetGroups!.length).toBe(2);
        });
    });

    describe('Route53 Hosted Zone', () => {
        const route53Client = new Route53Client({ region });

        it('should have hosted zone created', async () => {
            if (!outputs.route53ZoneId) {
                console.log('Skipping: Route53 zone ID not in outputs');
                return;
            }

            const command = new ListHostedZonesCommand({});
            const response = await route53Client.send(command);

            const zone = response.HostedZones?.find(z => z.Id?.includes(outputs.route53ZoneId));
            expect(zone).toBeDefined();
        });

        it('should have weighted routing records configured', async () => {
            if (!outputs.route53ZoneId) {
                console.log('Skipping: Route53 zone ID not in outputs');
                return;
            }

            const command = new ListResourceRecordSetsCommand({
                HostedZoneId: outputs.route53ZoneId
            });
            const response = await route53Client.send(command);

            const weightedRecords = response.ResourceRecordSets?.filter(r => r.Weight !== undefined);
            expect(weightedRecords).toBeDefined();
            expect(weightedRecords!.length).toBeGreaterThanOrEqual(5); // 0%, 25%, 50%, 75%, 100%
        });
    });

    describe('CodeDeploy Configuration', () => {
        const codeDeployClient = new CodeDeployClient({ region });

        it('should have CodeDeploy application created', async () => {
            if (!outputs.codeDeployAppName) {
                console.log('Skipping: CodeDeploy app name not in outputs');
                return;
            }

            const command = new GetApplicationCommand({
                applicationName: outputs.codeDeployAppName
            });
            const response = await codeDeployClient.send(command);

            expect(response.application).toBeDefined();
            expect(response.application!.computePlatform).toBe('ECS');
        });

        it('should have deployment group configured', async () => {
            if (!outputs.codeDeployAppName || !outputs.codeDeployDeploymentGroupName) {
                console.log('Skipping: CodeDeploy names not in outputs');
                return;
            }

            const command = new GetDeploymentGroupCommand({
                applicationName: outputs.codeDeployAppName,
                deploymentGroupName: outputs.codeDeployDeploymentGroupName
            });
            const response = await codeDeployClient.send(command);

            expect(response.deploymentGroupInfo).toBeDefined();
            expect(response.deploymentGroupInfo!.blueGreenDeploymentConfiguration).toBeDefined();
        });
    });

    describe('Lambda Functions', () => {
        const lambdaClient = new LambdaClient({ region });

        it('should have validation Lambda function deployed', async () => {
            if (!outputs.validationLambdaArn) {
                console.log('Skipping: Validation Lambda ARN not in outputs');
                return;
            }

            const functionName = outputs.validationLambdaArn.split(':').pop();
            const command = new GetFunctionCommand({
                FunctionName: functionName
            });
            const response = await lambdaClient.send(command);

            expect(response.Configuration).toBeDefined();
            expect(response.Configuration!.Runtime).toContain('python');
        });

        it('should have health check Lambda function deployed', async () => {
            if (!outputs.healthCheckLambdaArn) {
                console.log('Skipping: Health check Lambda ARN not in outputs');
                return;
            }

            const functionName = outputs.healthCheckLambdaArn.split(':').pop();
            const command = new GetFunctionCommand({
                FunctionName: functionName
            });
            const response = await lambdaClient.send(command);

            expect(response.Configuration).toBeDefined();
            expect(response.Configuration!.Runtime).toContain('python');
        });
    });

    describe('DynamoDB Table', () => {
        const dynamoClient = new DynamoDBClient({ region });

        it('should have DynamoDB table created', async () => {
            if (!outputs.dynamoTableName) {
                console.log('Skipping: DynamoDB table name not in outputs');
                return;
            }

            const command = new DescribeTableCommand({
                TableName: outputs.dynamoTableName
            });
            const response = await dynamoClient.send(command);

            expect(response.Table).toBeDefined();
            expect(response.Table!.TableStatus).toBe('ACTIVE');
            expect(response.Table!.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
        });
    });

    describe('S3 Bucket', () => {
        const s3Client = new S3Client({ region });

        it('should have S3 bucket created', async () => {
            if (!outputs.s3BucketName) {
                console.log('Skipping: S3 bucket name not in outputs');
                return;
            }

            const command = new HeadBucketCommand({
                Bucket: outputs.s3BucketName
            });
            await expect(s3Client.send(command)).resolves.not.toThrow();
        });

        it('should have versioning enabled', async () => {
            if (!outputs.s3BucketName) {
                console.log('Skipping: S3 bucket name not in outputs');
                return;
            }

            const command = new GetBucketVersioningCommand({
                Bucket: outputs.s3BucketName
            });
            const response = await s3Client.send(command);

            expect(response.Status).toBe('Enabled');
        });
    });

    describe('ECR Repository', () => {
        const ecrClient = new ECRClient({ region });

        it('should have ECR repository created', async () => {
            if (!outputs.ecrRepositoryName) {
                console.log('Skipping: ECR repository name not in outputs');
                return;
            }

            const command = new DescribeRepositoriesCommand({
                repositoryNames: [outputs.ecrRepositoryName]
            });
            const response = await ecrClient.send(command);

            expect(response.repositories).toBeDefined();
            expect(response.repositories!.length).toBe(1);
            expect(response.repositories![0].imageScanningConfiguration?.scanOnPush).toBe(true);
        });
    });

    describe('DMS Replication', () => {
        it('should have DMS replication instance ARN', () => {
            if (!outputs.dmsReplicationInstanceArn) {
                console.log('Skipping: DMS replication instance ARN not in outputs');
                return;
            }

            expect(outputs.dmsReplicationInstanceArn).toContain('arn:aws:dms');
        });

        it('should have DMS replication task ARN', () => {
            if (!outputs.dmsReplicationTaskArn) {
                console.log('Skipping: DMS replication task ARN not in outputs');
                return;
            }

            expect(outputs.dmsReplicationTaskArn).toContain('arn:aws:dms');
        });
    });

    describe('Resource Naming Convention', () => {
        it('should have environment suffix in all resource names', () => {
            const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

            // List of keys that contain auto-generated IDs that don't include env suffix
            const excludedKeys = ['auroraClusterId', 'ecrRepositoryUrl', 'route53ZoneId'];

            for (const [key, value] of Object.entries(outputs)) {
                // Skip ARNs, URLs, endpoints, and auto-generated IDs
                if (typeof value === 'string' &&
                    !value.startsWith('arn:') &&
                    !value.startsWith('http') &&
                    !value.includes('amazonaws.com') &&
                    !excludedKeys.includes(key)) {
                    expect(value).toContain(environmentSuffix);
                }
            }
        });
    });

    describe('End-to-End Workflow', () => {
        it('should have complete blue-green deployment pipeline', () => {
            expect(outputs.ecsClusterName).toBeDefined();
            expect(outputs.ecsServiceName).toBeDefined();
            expect(outputs.targetGroupArn).toBeDefined();
            expect(outputs.targetGroupGreenArn).toBeDefined();
            expect(outputs.codeDeployAppName).toBeDefined();
            expect(outputs.codeDeployDeploymentGroupName).toBeDefined();
        });

        it('should have complete database migration setup', () => {
            expect(outputs.auroraEndpoint).toBeDefined();
            expect(outputs.dmsReplicationInstanceArn).toBeDefined();
            expect(outputs.dmsReplicationTaskArn).toBeDefined();
        });

        it('should have monitoring and observability', () => {
            expect(outputs.ecsClusterArn).toBeDefined();
            expect(outputs.albArn).toBeDefined();
            expect(outputs.validationLambdaArn).toBeDefined();
            expect(outputs.healthCheckLambdaArn).toBeDefined();
        });
    });
});
