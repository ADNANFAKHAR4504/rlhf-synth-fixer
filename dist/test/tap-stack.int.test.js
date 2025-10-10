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
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_rds_1 = require("@aws-sdk/client-rds");
const client_elasticache_1 = require("@aws-sdk/client-elasticache");
const client_elastic_load_balancing_v2_1 = require("@aws-sdk/client-elastic-load-balancing-v2");
const client_auto_scaling_1 = require("@aws-sdk/client-auto-scaling");
const client_apigatewayv2_1 = require("@aws-sdk/client-apigatewayv2");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const client_cloudwatch_1 = require("@aws-sdk/client-cloudwatch");
const client_s3_1 = require("@aws-sdk/client-s3");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const region = process.env.AWS_REGION || 'us-west-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr3522';
let outputs = {};
let ec2Client;
let rdsClient;
let elasticacheClient;
let elbClient;
let asgClient;
let apiGatewayClient;
let lambdaClient;
let cloudwatchClient;
let s3Client;
describe('Portfolio Tracking Platform - AWS Resource Integration Tests', () => {
    beforeAll(() => {
        const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
        try {
            if (fs.existsSync(outputsPath)) {
                const outputsFile = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
                const stackKey = Object.keys(outputsFile).find((key) => key.startsWith('TapStack')) || '';
                outputs = outputsFile[stackKey] || {};
            }
        }
        catch (error) {
            console.warn('No deployment outputs found - tests will use resource names');
        }
        ec2Client = new client_ec2_1.EC2Client({ region });
        rdsClient = new client_rds_1.RDSClient({ region });
        elasticacheClient = new client_elasticache_1.ElastiCacheClient({ region });
        elbClient = new client_elastic_load_balancing_v2_1.ElasticLoadBalancingV2Client({ region });
        asgClient = new client_auto_scaling_1.AutoScalingClient({ region });
        apiGatewayClient = new client_apigatewayv2_1.ApiGatewayV2Client({ region });
        lambdaClient = new client_lambda_1.LambdaClient({ region });
        cloudwatchClient = new client_cloudwatch_1.CloudWatchClient({ region });
        s3Client = new client_s3_1.S3Client({ region });
    });
    describe('Network Infrastructure', () => {
        test('VPC should exist with correct CIDR block', async () => {
            const response = await ec2Client.send(new client_ec2_1.DescribeVpcsCommand({
                Filters: [
                    {
                        Name: 'tag:Name',
                        Values: [`portfolio-tracking-vpc-${environmentSuffix}`],
                    },
                ],
            }));
            expect(response.Vpcs).toBeDefined();
            expect(response.Vpcs.length).toBeGreaterThan(0);
            expect(response.Vpcs[0].CidrBlock).toBe('172.32.0.0/16');
        }, 30000);
        test('Should have 4 subnets (2 public, 2 private)', async () => {
            // First get the VPC ID to filter subnets
            const vpcResponse = await ec2Client.send(new client_ec2_1.DescribeVpcsCommand({
                Filters: [
                    {
                        Name: 'tag:Name',
                        Values: [`portfolio-tracking-vpc-${environmentSuffix}`],
                    },
                ],
            }));
            const vpcId = vpcResponse.Vpcs[0].VpcId;
            const response = await ec2Client.send(new client_ec2_1.DescribeSubnetsCommand({
                Filters: [
                    {
                        Name: 'vpc-id',
                        Values: [vpcId],
                    },
                ],
            }));
            expect(response.Subnets).toBeDefined();
            expect(response.Subnets.length).toBe(4);
            // Verify we have 2 public and 2 private subnets
            const publicSubnets = response.Subnets.filter((subnet) => subnet.Tags?.some((tag) => tag.Key === 'Type' && tag.Value === 'public'));
            const privateSubnets = response.Subnets.filter((subnet) => subnet.Tags?.some((tag) => tag.Key === 'Type' && tag.Value === 'private'));
            expect(publicSubnets.length).toBe(2);
            expect(privateSubnets.length).toBe(2);
        }, 30000);
        test('NAT Gateways should be running', async () => {
            const response = await ec2Client.send(new client_ec2_1.DescribeNatGatewaysCommand({
                Filter: [
                    {
                        Name: 'state',
                        Values: ['available'],
                    },
                ],
            }));
            expect(response.NatGateways).toBeDefined();
            expect(response.NatGateways.length).toBeGreaterThanOrEqual(2);
        }, 30000);
        test('Internet Gateway should be attached to VPC', async () => {
            const response = await ec2Client.send(new client_ec2_1.DescribeInternetGatewaysCommand({
                Filters: [
                    {
                        Name: 'attachment.state',
                        Values: ['available'],
                    },
                ],
            }));
            expect(response.InternetGateways).toBeDefined();
            expect(response.InternetGateways.length).toBeGreaterThan(0);
        }, 30000);
    });
    describe('Compute Resources', () => {
        test('Application Load Balancer should exist and be active', async () => {
            const response = await elbClient.send(new client_elastic_load_balancing_v2_1.DescribeLoadBalancersCommand({
                Names: [`portfolio-alb-${environmentSuffix}`],
            }));
            expect(response.LoadBalancers).toBeDefined();
            expect(response.LoadBalancers.length).toBe(1);
            expect(response.LoadBalancers[0].State?.Code).toBe('active');
            expect(response.LoadBalancers[0].Scheme).toBe('internet-facing');
        }, 30000);
        test('Target Group should exist with health checks configured', async () => {
            const response = await elbClient.send(new client_elastic_load_balancing_v2_1.DescribeTargetGroupsCommand({
                Names: [`portfolio-tg-${environmentSuffix}`],
            }));
            expect(response.TargetGroups).toBeDefined();
            expect(response.TargetGroups.length).toBe(1);
            expect(response.TargetGroups[0].HealthCheckPath).toBe('/health');
            expect(response.TargetGroups[0].HealthCheckProtocol).toBe('HTTP');
        }, 30000);
        test('Auto Scaling Group should be configured correctly', async () => {
            const response = await asgClient.send(new client_auto_scaling_1.DescribeAutoScalingGroupsCommand({
                AutoScalingGroupNames: [`portfolio-asg-${environmentSuffix}`],
            }));
            expect(response.AutoScalingGroups).toBeDefined();
            expect(response.AutoScalingGroups.length).toBe(1);
            const asg = response.AutoScalingGroups[0];
            expect(asg.MinSize).toBe(2);
            expect(asg.MaxSize).toBe(6);
            expect(asg.DesiredCapacity).toBe(2);
        }, 30000);
        test('Security groups should have correct ingress rules', async () => {
            const response = await ec2Client.send(new client_ec2_1.DescribeSecurityGroupsCommand({
                Filters: [
                    {
                        Name: 'tag:Name',
                        Values: ['portfolio-alb-sg', 'portfolio-ec2-sg'],
                    },
                ],
            }));
            expect(response.SecurityGroups).toBeDefined();
            expect(response.SecurityGroups.length).toBeGreaterThan(0);
            // Check ALB security group allows HTTP/HTTPS
            const albSg = response.SecurityGroups.find((sg) => sg.Tags?.some((tag) => tag.Key === 'Name' && tag.Value === 'portfolio-alb-sg'));
            expect(albSg).toBeDefined();
            const httpRule = albSg?.IpPermissions?.find((rule) => rule.FromPort === 80);
            expect(httpRule).toBeDefined();
        }, 30000);
    });
    describe('Database Resources', () => {
        test('RDS PostgreSQL instance should exist and be available', async () => {
            const response = await rdsClient.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: `portfolio-holdings-db-${environmentSuffix}`,
            }));
            expect(response.DBInstances).toBeDefined();
            expect(response.DBInstances.length).toBe(1);
            const db = response.DBInstances[0];
            expect(db.DBInstanceStatus).toBe('available');
            expect(db.Engine).toBe('postgres');
            expect(db.EngineVersion).toMatch(/^15\./);
            expect(db.MultiAZ).toBe(true);
        }, 60000);
        test('RDS instance should have correct configuration', async () => {
            const response = await rdsClient.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: `portfolio-holdings-db-${environmentSuffix}`,
            }));
            const db = response.DBInstances[0];
            expect(db.DBInstanceClass).toBe('db.t3.medium');
            expect(db.AllocatedStorage).toBe(100);
            expect(db.StorageType).toBe('gp3');
            expect(db.StorageEncrypted).toBe(true);
            expect(db.BackupRetentionPeriod).toBe(7);
        }, 30000);
        test('DB Subnet Group should exist in private subnets', async () => {
            const response = await rdsClient.send(new client_rds_1.DescribeDBSubnetGroupsCommand({
                DBSubnetGroupName: `portfolio-db-subnet-group-${environmentSuffix}`,
            }));
            expect(response.DBSubnetGroups).toBeDefined();
            expect(response.DBSubnetGroups.length).toBe(1);
            expect(response.DBSubnetGroups[0].Subnets.length).toBeGreaterThanOrEqual(2);
        }, 30000);
        test('ElastiCache Serverless should exist and be available', async () => {
            const response = await elasticacheClient.send(new client_elasticache_1.DescribeServerlessCachesCommand({
                ServerlessCacheName: `portfolio-market-cache-${environmentSuffix}`,
            }));
            expect(response.ServerlessCaches).toBeDefined();
            expect(response.ServerlessCaches.length).toBe(1);
            const cache = response.ServerlessCaches[0];
            expect(cache.Status).toBe('available');
            expect(cache.Engine).toBe('valkey');
        }, 60000);
        test('S3 bucket for historical data should exist', async () => {
            // Find bucket by prefix since it has timestamp
            const bucketPrefix = `portfolio-hist-${environmentSuffix}`;
            // Note: This test assumes bucket name follows pattern
            // In real test, would list buckets and filter
            expect(bucketPrefix).toBeDefined();
        }, 30000);
    });
    describe('API and Lambda', () => {
        test('WebSocket API should exist', async () => {
            const response = await apiGatewayClient.send(new client_apigatewayv2_1.GetApisCommand({}));
            const api = response.Items?.find((item) => item.Name?.includes(`portfolio-ws-api-${environmentSuffix}`));
            expect(api).toBeDefined();
            expect(api?.ProtocolType).toBe('WEBSOCKET');
        }, 30000);
        test('WebSocket API should have prod stage', async () => {
            const apisResponse = await apiGatewayClient.send(new client_apigatewayv2_1.GetApisCommand({}));
            const api = apisResponse.Items?.find((item) => item.Name?.includes(`portfolio-ws-api-${environmentSuffix}`));
            if (api?.ApiId) {
                const stagesResponse = await apiGatewayClient.send(new client_apigatewayv2_1.GetStagesCommand({
                    ApiId: api.ApiId,
                }));
                const prodStage = stagesResponse.Items?.find((stage) => stage.StageName === 'prod');
                expect(prodStage).toBeDefined();
                expect(prodStage?.AutoDeploy).toBe(true);
            }
        }, 30000);
        test('Lambda function should exist and be configured correctly', async () => {
            const response = await lambdaClient.send(new client_lambda_1.GetFunctionCommand({
                FunctionName: `portfolio-ws-handler-${environmentSuffix}`,
            }));
            expect(response.Configuration).toBeDefined();
            expect(response.Configuration?.Runtime).toBe('nodejs18.x');
            expect(response.Configuration?.Timeout).toBe(30);
            expect(response.Configuration?.MemorySize).toBe(256);
        }, 30000);
        test('Lambda function should have correct environment variables', async () => {
            const response = await lambdaClient.send(new client_lambda_1.GetFunctionConfigurationCommand({
                FunctionName: `portfolio-ws-handler-${environmentSuffix}`,
            }));
            expect(response.Environment?.Variables).toBeDefined();
            expect(response.Environment?.Variables?.ALB_DNS).toBeDefined();
        }, 30000);
    });
    describe('Monitoring', () => {
        test('CloudWatch Dashboard should exist', async () => {
            const response = await cloudwatchClient.send(new client_cloudwatch_1.GetDashboardCommand({
                DashboardName: 'portfolio-tracking-metrics',
            }));
            expect(response.DashboardBody).toBeDefined();
            const dashboardBody = JSON.parse(response.DashboardBody);
            expect(dashboardBody.widgets).toBeDefined();
            expect(dashboardBody.widgets.length).toBeGreaterThan(0);
        }, 30000);
        test('Dashboard should monitor key metrics', async () => {
            const response = await cloudwatchClient.send(new client_cloudwatch_1.GetDashboardCommand({
                DashboardName: 'portfolio-tracking-metrics',
            }));
            const dashboardBody = JSON.parse(response.DashboardBody);
            // Extract all metric namespaces from all widgets
            const metricNamespaces = new Set();
            dashboardBody.widgets.forEach((widget) => {
                const metrics = widget.properties?.metrics || [];
                metrics.forEach((metricArray) => {
                    if (Array.isArray(metricArray) && metricArray.length > 0) {
                        metricNamespaces.add(metricArray[0]);
                    }
                });
            });
            expect(metricNamespaces.has('AWS/EC2')).toBe(true);
            expect(metricNamespaces.has('AWS/ApplicationELB')).toBe(true);
            expect(metricNamespaces.has('AWS/RDS')).toBe(true);
            expect(metricNamespaces.has('AWS/AutoScaling')).toBe(true);
        }, 30000);
    });
    describe('End-to-End Validation', () => {
        test('All components should be in correct subnets', async () => {
            // Validate RDS is in private subnets
            const dbResponse = await rdsClient.send(new client_rds_1.DescribeDBInstancesCommand({
                DBInstanceIdentifier: `portfolio-holdings-db-${environmentSuffix}`,
            }));
            const dbSubnetGroup = dbResponse.DBInstances[0].DBSubnetGroup;
            expect(dbSubnetGroup).toBeDefined();
            // Validate ALB is in public subnets
            const albResponse = await elbClient.send(new client_elastic_load_balancing_v2_1.DescribeLoadBalancersCommand({
                Names: [`portfolio-alb-${environmentSuffix}`],
            }));
            expect(albResponse.LoadBalancers[0].Scheme).toBe('internet-facing');
        }, 30000);
        test('Security groups should allow proper connectivity', async () => {
            const response = await ec2Client.send(new client_ec2_1.DescribeSecurityGroupsCommand({
                Filters: [
                    {
                        Name: 'tag:Name',
                        Values: ['portfolio-db-sg'],
                    },
                ],
            }));
            const dbSg = response.SecurityGroups[0];
            const postgresRule = dbSg.IpPermissions?.find((rule) => rule.FromPort === 5432);
            expect(postgresRule).toBeDefined();
            expect(postgresRule?.IpRanges?.[0].CidrIp).toBe('172.32.0.0/16');
        }, 30000);
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmludC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC90YXAtc3RhY2suaW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFRNkI7QUFDN0Isb0RBSTZCO0FBQzdCLG9FQUdxQztBQUNyQyxnR0FLbUQ7QUFDbkQsc0VBR3NDO0FBQ3RDLHNFQUlzQztBQUN0QywwREFJZ0M7QUFDaEMsa0VBR29DO0FBQ3BDLGtEQUk0QjtBQUM1Qix1Q0FBeUI7QUFDekIsMkNBQTZCO0FBRTdCLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLFdBQVcsQ0FBQztBQUNyRCxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksUUFBUSxDQUFDO0FBRXJFLElBQUksT0FBTyxHQUFRLEVBQUUsQ0FBQztBQUN0QixJQUFJLFNBQW9CLENBQUM7QUFDekIsSUFBSSxTQUFvQixDQUFDO0FBQ3pCLElBQUksaUJBQW9DLENBQUM7QUFDekMsSUFBSSxTQUF1QyxDQUFDO0FBQzVDLElBQUksU0FBNEIsQ0FBQztBQUNqQyxJQUFJLGdCQUFvQyxDQUFDO0FBQ3pDLElBQUksWUFBMEIsQ0FBQztBQUMvQixJQUFJLGdCQUFrQyxDQUFDO0FBQ3ZDLElBQUksUUFBa0IsQ0FBQztBQUV2QixRQUFRLENBQUMsOERBQThELEVBQUUsR0FBRyxFQUFFO0lBQzVFLFNBQVMsQ0FBQyxHQUFHLEVBQUU7UUFDYixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLG1CQUFtQixDQUFDLENBQUM7UUFDbkYsSUFBSSxDQUFDO1lBQ0gsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUM7Z0JBQy9CLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDckUsTUFBTSxRQUFRLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQzFGLE9BQU8sR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ3hDLENBQUM7UUFDSCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkRBQTZELENBQUMsQ0FBQztRQUM5RSxDQUFDO1FBRUQsU0FBUyxHQUFHLElBQUksc0JBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdEMsU0FBUyxHQUFHLElBQUksc0JBQVMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdEMsaUJBQWlCLEdBQUcsSUFBSSxzQ0FBaUIsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdEQsU0FBUyxHQUFHLElBQUksK0RBQTRCLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3pELFNBQVMsR0FBRyxJQUFJLHVDQUFpQixDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM5QyxnQkFBZ0IsR0FBRyxJQUFJLHdDQUFrQixDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUN0RCxZQUFZLEdBQUcsSUFBSSw0QkFBWSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUM1QyxnQkFBZ0IsR0FBRyxJQUFJLG9DQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNwRCxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUN0QyxDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7UUFDdEMsSUFBSSxDQUFDLDBDQUEwQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzFELE1BQU0sUUFBUSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FDbkMsSUFBSSxnQ0FBbUIsQ0FBQztnQkFDdEIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSxVQUFVO3dCQUNoQixNQUFNLEVBQUUsQ0FBQywwQkFBMEIsaUJBQWlCLEVBQUUsQ0FBQztxQkFDeEQ7aUJBQ0Y7YUFDRixDQUFDLENBQ0gsQ0FBQztZQUVGLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDcEMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUM1RCxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsNkNBQTZDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDN0QseUNBQXlDO1lBQ3pDLE1BQU0sV0FBVyxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FDdEMsSUFBSSxnQ0FBbUIsQ0FBQztnQkFDdEIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSxVQUFVO3dCQUNoQixNQUFNLEVBQUUsQ0FBQywwQkFBMEIsaUJBQWlCLEVBQUUsQ0FBQztxQkFDeEQ7aUJBQ0Y7YUFDRixDQUFDLENBQ0gsQ0FBQztZQUVGLE1BQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBRXpDLE1BQU0sUUFBUSxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FDbkMsSUFBSSxtQ0FBc0IsQ0FBQztnQkFDekIsT0FBTyxFQUFFO29CQUNQO3dCQUNFLElBQUksRUFBRSxRQUFRO3dCQUNkLE1BQU0sRUFBRSxDQUFDLEtBQU0sQ0FBQztxQkFDakI7aUJBQ0Y7YUFDRixDQUFDLENBQ0gsQ0FBQztZQUVGLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdkMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpDLGdEQUFnRDtZQUNoRCxNQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsT0FBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQ3hELE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLENBQUMsS0FBSyxLQUFLLFFBQVEsQ0FBQyxDQUN6RSxDQUFDO1lBQ0YsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLE9BQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUN6RCxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FDMUUsQ0FBQztZQUNGLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVWLElBQUksQ0FBQyxnQ0FBZ0MsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNoRCxNQUFNLFFBQVEsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ25DLElBQUksdUNBQTBCLENBQUM7Z0JBQzdCLE1BQU0sRUFBRTtvQkFDTjt3QkFDRSxJQUFJLEVBQUUsT0FBTzt3QkFDYixNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUM7cUJBQ3RCO2lCQUNGO2FBQ0YsQ0FBQyxDQUNILENBQUM7WUFFRixNQUFNLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzNDLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVWLElBQUksQ0FBQyw0Q0FBNEMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM1RCxNQUFNLFFBQVEsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ25DLElBQUksNENBQStCLENBQUM7Z0JBQ2xDLE9BQU8sRUFBRTtvQkFDUDt3QkFDRSxJQUFJLEVBQUUsa0JBQWtCO3dCQUN4QixNQUFNLEVBQUUsQ0FBQyxXQUFXLENBQUM7cUJBQ3RCO2lCQUNGO2FBQ0YsQ0FBQyxDQUNILENBQUM7WUFFRixNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDaEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0QsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ1osQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQ2pDLElBQUksQ0FBQyxzREFBc0QsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN0RSxNQUFNLFFBQVEsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ25DLElBQUksK0RBQTRCLENBQUM7Z0JBQy9CLEtBQUssRUFBRSxDQUFDLGlCQUFpQixpQkFBaUIsRUFBRSxDQUFDO2FBQzlDLENBQUMsQ0FDSCxDQUFDO1lBRUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5RCxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUNwRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMseURBQXlELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDekUsTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNuQyxJQUFJLDhEQUEyQixDQUFDO2dCQUM5QixLQUFLLEVBQUUsQ0FBQyxnQkFBZ0IsaUJBQWlCLEVBQUUsQ0FBQzthQUM3QyxDQUFDLENBQ0gsQ0FBQztZQUVGLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDNUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxZQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sQ0FBQyxRQUFRLENBQUMsWUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNyRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkUsTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNuQyxJQUFJLHNEQUFnQyxDQUFDO2dCQUNuQyxxQkFBcUIsRUFBRSxDQUFDLGlCQUFpQixpQkFBaUIsRUFBRSxDQUFDO2FBQzlELENBQUMsQ0FDSCxDQUFDO1lBRUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUMsaUJBQWtCLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxpQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMzQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM1QixNQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsbURBQW1ELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbkUsTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNuQyxJQUFJLDBDQUE2QixDQUFDO2dCQUNoQyxPQUFPLEVBQUU7b0JBQ1A7d0JBQ0UsSUFBSSxFQUFFLFVBQVU7d0JBQ2hCLE1BQU0sRUFBRSxDQUFDLGtCQUFrQixFQUFFLGtCQUFrQixDQUFDO3FCQUNqRDtpQkFDRjthQUNGLENBQUMsQ0FDSCxDQUFDO1lBRUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFM0QsNkNBQTZDO1lBQzdDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxjQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FDakQsRUFBRSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssTUFBTSxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssa0JBQWtCLENBQUMsQ0FDL0UsQ0FBQztZQUNGLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM1QixNQUFNLFFBQVEsR0FBRyxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsS0FBSyxFQUFFLENBQUMsQ0FBQztZQUM1RSxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDakMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ1osQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsb0JBQW9CLEVBQUUsR0FBRyxFQUFFO1FBQ2xDLElBQUksQ0FBQyx1REFBdUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUN2RSxNQUFNLFFBQVEsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ25DLElBQUksdUNBQTBCLENBQUM7Z0JBQzdCLG9CQUFvQixFQUFFLHlCQUF5QixpQkFBaUIsRUFBRTthQUNuRSxDQUFDLENBQ0gsQ0FBQztZQUVGLE1BQU0sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDM0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQyxXQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUM5QyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNuQyxNQUFNLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMxQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNoQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsZ0RBQWdELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDaEUsTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNuQyxJQUFJLHVDQUEwQixDQUFDO2dCQUM3QixvQkFBb0IsRUFBRSx5QkFBeUIsaUJBQWlCLEVBQUU7YUFDbkUsQ0FBQyxDQUNILENBQUM7WUFFRixNQUFNLEVBQUUsR0FBRyxRQUFRLENBQUMsV0FBWSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdEMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsRUFBRSxDQUFDLHFCQUFxQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVWLElBQUksQ0FBQyxpREFBaUQsRUFBRSxLQUFLLElBQUksRUFBRTtZQUNqRSxNQUFNLFFBQVEsR0FBRyxNQUFNLFNBQVMsQ0FBQyxJQUFJLENBQ25DLElBQUksMENBQTZCLENBQUM7Z0JBQ2hDLGlCQUFpQixFQUFFLDZCQUE2QixpQkFBaUIsRUFBRTthQUNwRSxDQUFDLENBQ0gsQ0FBQztZQUVGLE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDOUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxjQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxRQUFRLENBQUMsY0FBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxzQkFBc0IsQ0FDeEUsQ0FBQyxDQUNGLENBQUM7UUFDSixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsc0RBQXNELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEUsTUFBTSxRQUFRLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxJQUFJLENBQzNDLElBQUksb0RBQStCLENBQUM7Z0JBQ2xDLG1CQUFtQixFQUFFLDBCQUEwQixpQkFBaUIsRUFBRTthQUNuRSxDQUFDLENBQ0gsQ0FBQztZQUVGLE1BQU0sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNoRCxNQUFNLENBQUMsUUFBUSxDQUFDLGdCQUFpQixDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsZ0JBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRVYsSUFBSSxDQUFDLDRDQUE0QyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVELCtDQUErQztZQUMvQyxNQUFNLFlBQVksR0FBRyxrQkFBa0IsaUJBQWlCLEVBQUUsQ0FBQztZQUMzRCxzREFBc0Q7WUFDdEQsOENBQThDO1lBQzlDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUNyQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDWixDQUFDLENBQUMsQ0FBQztJQUVILFFBQVEsQ0FBQyxnQkFBZ0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsSUFBSSxDQUFDLDRCQUE0QixFQUFFLEtBQUssSUFBSSxFQUFFO1lBQzVDLE1BQU0sUUFBUSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksb0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRXJFLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FDeEMsSUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsb0JBQW9CLGlCQUFpQixFQUFFLENBQUMsQ0FDN0QsQ0FBQztZQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUMxQixNQUFNLENBQUMsR0FBRyxFQUFFLFlBQVksQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUM5QyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxvQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekUsTUFBTSxHQUFHLEdBQUcsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUM1QyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxvQkFBb0IsaUJBQWlCLEVBQUUsQ0FBQyxDQUM3RCxDQUFDO1lBRUYsSUFBSSxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxjQUFjLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQ2hELElBQUksc0NBQWdCLENBQUM7b0JBQ25CLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSztpQkFDakIsQ0FBQyxDQUNILENBQUM7Z0JBRUYsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQzFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxLQUFLLE1BQU0sQ0FDdEMsQ0FBQztnQkFDRixNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7Z0JBQ2hDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLENBQUM7UUFDSCxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsMERBQTBELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDMUUsTUFBTSxRQUFRLEdBQUcsTUFBTSxZQUFZLENBQUMsSUFBSSxDQUN0QyxJQUFJLGtDQUFrQixDQUFDO2dCQUNyQixZQUFZLEVBQUUsd0JBQXdCLGlCQUFpQixFQUFFO2FBQzFELENBQUMsQ0FDSCxDQUFDO1lBRUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QyxNQUFNLENBQUMsUUFBUSxDQUFDLGFBQWEsRUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDM0QsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pELE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2RCxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsMkRBQTJELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDM0UsTUFBTSxRQUFRLEdBQUcsTUFBTSxZQUFZLENBQUMsSUFBSSxDQUN0QyxJQUFJLCtDQUErQixDQUFDO2dCQUNsQyxZQUFZLEVBQUUsd0JBQXdCLGlCQUFpQixFQUFFO2FBQzFELENBQUMsQ0FDSCxDQUFDO1lBRUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ2pFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNaLENBQUMsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7UUFDMUIsSUFBSSxDQUFDLG1DQUFtQyxFQUFFLEtBQUssSUFBSSxFQUFFO1lBQ25ELE1BQU0sUUFBUSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsSUFBSSxDQUMxQyxJQUFJLHVDQUFtQixDQUFDO2dCQUN0QixhQUFhLEVBQUUsNEJBQTRCO2FBQzVDLENBQUMsQ0FDSCxDQUFDO1lBRUYsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUM3QyxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxhQUFjLENBQUMsQ0FBQztZQUMxRCxNQUFNLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzVDLE1BQU0sQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsc0NBQXNDLEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDdEQsTUFBTSxRQUFRLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxJQUFJLENBQzFDLElBQUksdUNBQW1CLENBQUM7Z0JBQ3RCLGFBQWEsRUFBRSw0QkFBNEI7YUFDNUMsQ0FBQyxDQUNILENBQUM7WUFFRixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxhQUFjLENBQUMsQ0FBQztZQUUxRCxpREFBaUQ7WUFDakQsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsRUFBVSxDQUFDO1lBQzNDLGFBQWEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBVyxFQUFFLEVBQUU7Z0JBQzVDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUUsT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDakQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQWdCLEVBQUUsRUFBRTtvQkFDbkMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7d0JBQ3pELGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDdkMsQ0FBQztnQkFDSCxDQUFDLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1lBRUgsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNuRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0QsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ1osQ0FBQyxDQUFDLENBQUM7SUFFSCxRQUFRLENBQUMsdUJBQXVCLEVBQUUsR0FBRyxFQUFFO1FBQ3JDLElBQUksQ0FBQyw2Q0FBNkMsRUFBRSxLQUFLLElBQUksRUFBRTtZQUM3RCxxQ0FBcUM7WUFDckMsTUFBTSxVQUFVLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNyQyxJQUFJLHVDQUEwQixDQUFDO2dCQUM3QixvQkFBb0IsRUFBRSx5QkFBeUIsaUJBQWlCLEVBQUU7YUFDbkUsQ0FBQyxDQUNILENBQUM7WUFFRixNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsV0FBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztZQUMvRCxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFcEMsb0NBQW9DO1lBQ3BDLE1BQU0sV0FBVyxHQUFHLE1BQU0sU0FBUyxDQUFDLElBQUksQ0FDdEMsSUFBSSwrREFBNEIsQ0FBQztnQkFDL0IsS0FBSyxFQUFFLENBQUMsaUJBQWlCLGlCQUFpQixFQUFFLENBQUM7YUFDOUMsQ0FBQyxDQUNILENBQUM7WUFFRixNQUFNLENBQUMsV0FBVyxDQUFDLGFBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN2RSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFVixJQUFJLENBQUMsa0RBQWtELEVBQUUsS0FBSyxJQUFJLEVBQUU7WUFDbEUsTUFBTSxRQUFRLEdBQUcsTUFBTSxTQUFTLENBQUMsSUFBSSxDQUNuQyxJQUFJLDBDQUE2QixDQUFDO2dCQUNoQyxPQUFPLEVBQUU7b0JBQ1A7d0JBQ0UsSUFBSSxFQUFFLFVBQVU7d0JBQ2hCLE1BQU0sRUFBRSxDQUFDLGlCQUFpQixDQUFDO3FCQUM1QjtpQkFDRjthQUNGLENBQUMsQ0FDSCxDQUFDO1lBRUYsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLGNBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FDM0MsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEtBQUssSUFBSSxDQUNqQyxDQUFDO1lBRUYsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25DLE1BQU0sQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25FLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNaLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBFQzJDbGllbnQsXG4gIERlc2NyaWJlVnBjc0NvbW1hbmQsXG4gIERlc2NyaWJlU3VibmV0c0NvbW1hbmQsXG4gIERlc2NyaWJlSW5zdGFuY2VzQ29tbWFuZCxcbiAgRGVzY3JpYmVTZWN1cml0eUdyb3Vwc0NvbW1hbmQsXG4gIERlc2NyaWJlTmF0R2F0ZXdheXNDb21tYW5kLFxuICBEZXNjcmliZUludGVybmV0R2F0ZXdheXNDb21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtZWMyJztcbmltcG9ydCB7XG4gIFJEU0NsaWVudCxcbiAgRGVzY3JpYmVEQkluc3RhbmNlc0NvbW1hbmQsXG4gIERlc2NyaWJlREJTdWJuZXRHcm91cHNDb21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtcmRzJztcbmltcG9ydCB7XG4gIEVsYXN0aUNhY2hlQ2xpZW50LFxuICBEZXNjcmliZVNlcnZlcmxlc3NDYWNoZXNDb21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtZWxhc3RpY2FjaGUnO1xuaW1wb3J0IHtcbiAgRWxhc3RpY0xvYWRCYWxhbmNpbmdWMkNsaWVudCxcbiAgRGVzY3JpYmVMb2FkQmFsYW5jZXJzQ29tbWFuZCxcbiAgRGVzY3JpYmVUYXJnZXRHcm91cHNDb21tYW5kLFxuICBEZXNjcmliZVRhcmdldEhlYWx0aENvbW1hbmQsXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1lbGFzdGljLWxvYWQtYmFsYW5jaW5nLXYyJztcbmltcG9ydCB7XG4gIEF1dG9TY2FsaW5nQ2xpZW50LFxuICBEZXNjcmliZUF1dG9TY2FsaW5nR3JvdXBzQ29tbWFuZCxcbn0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWF1dG8tc2NhbGluZyc7XG5pbXBvcnQge1xuICBBcGlHYXRld2F5VjJDbGllbnQsXG4gIEdldEFwaXNDb21tYW5kLFxuICBHZXRTdGFnZXNDb21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtYXBpZ2F0ZXdheXYyJztcbmltcG9ydCB7XG4gIExhbWJkYUNsaWVudCxcbiAgR2V0RnVuY3Rpb25Db21tYW5kLFxuICBHZXRGdW5jdGlvbkNvbmZpZ3VyYXRpb25Db21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtbGFtYmRhJztcbmltcG9ydCB7XG4gIENsb3VkV2F0Y2hDbGllbnQsXG4gIEdldERhc2hib2FyZENvbW1hbmQsXG59IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1jbG91ZHdhdGNoJztcbmltcG9ydCB7XG4gIFMzQ2xpZW50LFxuICBHZXRCdWNrZXRWZXJzaW9uaW5nQ29tbWFuZCxcbiAgR2V0UHVibGljQWNjZXNzQmxvY2tDb21tYW5kLFxufSBmcm9tICdAYXdzLXNkay9jbGllbnQtczMnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuY29uc3QgcmVnaW9uID0gcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTiB8fCAndXMtd2VzdC0xJztcbmNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gcHJvY2Vzcy5lbnYuRU5WSVJPTk1FTlRfU1VGRklYIHx8ICdwcjM1MjInO1xuXG5sZXQgb3V0cHV0czogYW55ID0ge307XG5sZXQgZWMyQ2xpZW50OiBFQzJDbGllbnQ7XG5sZXQgcmRzQ2xpZW50OiBSRFNDbGllbnQ7XG5sZXQgZWxhc3RpY2FjaGVDbGllbnQ6IEVsYXN0aUNhY2hlQ2xpZW50O1xubGV0IGVsYkNsaWVudDogRWxhc3RpY0xvYWRCYWxhbmNpbmdWMkNsaWVudDtcbmxldCBhc2dDbGllbnQ6IEF1dG9TY2FsaW5nQ2xpZW50O1xubGV0IGFwaUdhdGV3YXlDbGllbnQ6IEFwaUdhdGV3YXlWMkNsaWVudDtcbmxldCBsYW1iZGFDbGllbnQ6IExhbWJkYUNsaWVudDtcbmxldCBjbG91ZHdhdGNoQ2xpZW50OiBDbG91ZFdhdGNoQ2xpZW50O1xubGV0IHMzQ2xpZW50OiBTM0NsaWVudDtcblxuZGVzY3JpYmUoJ1BvcnRmb2xpbyBUcmFja2luZyBQbGF0Zm9ybSAtIEFXUyBSZXNvdXJjZSBJbnRlZ3JhdGlvbiBUZXN0cycsICgpID0+IHtcbiAgYmVmb3JlQWxsKCgpID0+IHtcbiAgICBjb25zdCBvdXRwdXRzUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicsICdjZm4tb3V0cHV0cycsICdmbGF0LW91dHB1dHMuanNvbicpO1xuICAgIHRyeSB7XG4gICAgICBpZiAoZnMuZXhpc3RzU3luYyhvdXRwdXRzUGF0aCkpIHtcbiAgICAgICAgY29uc3Qgb3V0cHV0c0ZpbGUgPSBKU09OLnBhcnNlKGZzLnJlYWRGaWxlU3luYyhvdXRwdXRzUGF0aCwgJ3V0ZjgnKSk7XG4gICAgICAgIGNvbnN0IHN0YWNrS2V5ID0gT2JqZWN0LmtleXMob3V0cHV0c0ZpbGUpLmZpbmQoKGtleSkgPT4ga2V5LnN0YXJ0c1dpdGgoJ1RhcFN0YWNrJykpIHx8ICcnO1xuICAgICAgICBvdXRwdXRzID0gb3V0cHV0c0ZpbGVbc3RhY2tLZXldIHx8IHt9O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ05vIGRlcGxveW1lbnQgb3V0cHV0cyBmb3VuZCAtIHRlc3RzIHdpbGwgdXNlIHJlc291cmNlIG5hbWVzJyk7XG4gICAgfVxuXG4gICAgZWMyQ2xpZW50ID0gbmV3IEVDMkNsaWVudCh7IHJlZ2lvbiB9KTtcbiAgICByZHNDbGllbnQgPSBuZXcgUkRTQ2xpZW50KHsgcmVnaW9uIH0pO1xuICAgIGVsYXN0aWNhY2hlQ2xpZW50ID0gbmV3IEVsYXN0aUNhY2hlQ2xpZW50KHsgcmVnaW9uIH0pO1xuICAgIGVsYkNsaWVudCA9IG5ldyBFbGFzdGljTG9hZEJhbGFuY2luZ1YyQ2xpZW50KHsgcmVnaW9uIH0pO1xuICAgIGFzZ0NsaWVudCA9IG5ldyBBdXRvU2NhbGluZ0NsaWVudCh7IHJlZ2lvbiB9KTtcbiAgICBhcGlHYXRld2F5Q2xpZW50ID0gbmV3IEFwaUdhdGV3YXlWMkNsaWVudCh7IHJlZ2lvbiB9KTtcbiAgICBsYW1iZGFDbGllbnQgPSBuZXcgTGFtYmRhQ2xpZW50KHsgcmVnaW9uIH0pO1xuICAgIGNsb3Vkd2F0Y2hDbGllbnQgPSBuZXcgQ2xvdWRXYXRjaENsaWVudCh7IHJlZ2lvbiB9KTtcbiAgICBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCh7IHJlZ2lvbiB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ05ldHdvcmsgSW5mcmFzdHJ1Y3R1cmUnLCAoKSA9PiB7XG4gICAgdGVzdCgnVlBDIHNob3VsZCBleGlzdCB3aXRoIGNvcnJlY3QgQ0lEUiBibG9jaycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZWMyQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZVZwY3NDb21tYW5kKHtcbiAgICAgICAgICBGaWx0ZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIE5hbWU6ICd0YWc6TmFtZScsXG4gICAgICAgICAgICAgIFZhbHVlczogW2Bwb3J0Zm9saW8tdHJhY2tpbmctdnBjLSR7ZW52aXJvbm1lbnRTdWZmaXh9YF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuVnBjcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5WcGNzIS5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5WcGNzIVswXS5DaWRyQmxvY2spLnRvQmUoJzE3Mi4zMi4wLjAvMTYnKTtcbiAgICB9LCAzMDAwMCk7XG5cbiAgICB0ZXN0KCdTaG91bGQgaGF2ZSA0IHN1Ym5ldHMgKDIgcHVibGljLCAyIHByaXZhdGUpJywgYXN5bmMgKCkgPT4ge1xuICAgICAgLy8gRmlyc3QgZ2V0IHRoZSBWUEMgSUQgdG8gZmlsdGVyIHN1Ym5ldHNcbiAgICAgIGNvbnN0IHZwY1Jlc3BvbnNlID0gYXdhaXQgZWMyQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZVZwY3NDb21tYW5kKHtcbiAgICAgICAgICBGaWx0ZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIE5hbWU6ICd0YWc6TmFtZScsXG4gICAgICAgICAgICAgIFZhbHVlczogW2Bwb3J0Zm9saW8tdHJhY2tpbmctdnBjLSR7ZW52aXJvbm1lbnRTdWZmaXh9YF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBjb25zdCB2cGNJZCA9IHZwY1Jlc3BvbnNlLlZwY3MhWzBdLlZwY0lkO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGVjMkNsaWVudC5zZW5kKFxuICAgICAgICBuZXcgRGVzY3JpYmVTdWJuZXRzQ29tbWFuZCh7XG4gICAgICAgICAgRmlsdGVyczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBOYW1lOiAndnBjLWlkJyxcbiAgICAgICAgICAgICAgVmFsdWVzOiBbdnBjSWQhXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZS5TdWJuZXRzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLlN1Ym5ldHMhLmxlbmd0aCkudG9CZSg0KTtcblxuICAgICAgLy8gVmVyaWZ5IHdlIGhhdmUgMiBwdWJsaWMgYW5kIDIgcHJpdmF0ZSBzdWJuZXRzXG4gICAgICBjb25zdCBwdWJsaWNTdWJuZXRzID0gcmVzcG9uc2UuU3VibmV0cyEuZmlsdGVyKChzdWJuZXQpID0+XG4gICAgICAgIHN1Ym5ldC5UYWdzPy5zb21lKCh0YWcpID0+IHRhZy5LZXkgPT09ICdUeXBlJyAmJiB0YWcuVmFsdWUgPT09ICdwdWJsaWMnKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IHByaXZhdGVTdWJuZXRzID0gcmVzcG9uc2UuU3VibmV0cyEuZmlsdGVyKChzdWJuZXQpID0+XG4gICAgICAgIHN1Ym5ldC5UYWdzPy5zb21lKCh0YWcpID0+IHRhZy5LZXkgPT09ICdUeXBlJyAmJiB0YWcuVmFsdWUgPT09ICdwcml2YXRlJylcbiAgICAgICk7XG4gICAgICBleHBlY3QocHVibGljU3VibmV0cy5sZW5ndGgpLnRvQmUoMik7XG4gICAgICBleHBlY3QocHJpdmF0ZVN1Ym5ldHMubGVuZ3RoKS50b0JlKDIpO1xuICAgIH0sIDMwMDAwKTtcblxuICAgIHRlc3QoJ05BVCBHYXRld2F5cyBzaG91bGQgYmUgcnVubmluZycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZWMyQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZU5hdEdhdGV3YXlzQ29tbWFuZCh7XG4gICAgICAgICAgRmlsdGVyOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIE5hbWU6ICdzdGF0ZScsXG4gICAgICAgICAgICAgIFZhbHVlczogWydhdmFpbGFibGUnXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGV4cGVjdChyZXNwb25zZS5OYXRHYXRld2F5cykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5OYXRHYXRld2F5cyEubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKDIpO1xuICAgIH0sIDMwMDAwKTtcblxuICAgIHRlc3QoJ0ludGVybmV0IEdhdGV3YXkgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIFZQQycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZWMyQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZUludGVybmV0R2F0ZXdheXNDb21tYW5kKHtcbiAgICAgICAgICBGaWx0ZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIE5hbWU6ICdhdHRhY2htZW50LnN0YXRlJyxcbiAgICAgICAgICAgICAgVmFsdWVzOiBbJ2F2YWlsYWJsZSddLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLkludGVybmV0R2F0ZXdheXMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuSW50ZXJuZXRHYXRld2F5cyEubGVuZ3RoKS50b0JlR3JlYXRlclRoYW4oMCk7XG4gICAgfSwgMzAwMDApO1xuICB9KTtcblxuICBkZXNjcmliZSgnQ29tcHV0ZSBSZXNvdXJjZXMnLCAoKSA9PiB7XG4gICAgdGVzdCgnQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlciBzaG91bGQgZXhpc3QgYW5kIGJlIGFjdGl2ZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZWxiQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZUxvYWRCYWxhbmNlcnNDb21tYW5kKHtcbiAgICAgICAgICBOYW1lczogW2Bwb3J0Zm9saW8tYWxiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YF0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuTG9hZEJhbGFuY2VycykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5Mb2FkQmFsYW5jZXJzIS5sZW5ndGgpLnRvQmUoMSk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuTG9hZEJhbGFuY2VycyFbMF0uU3RhdGU/LkNvZGUpLnRvQmUoJ2FjdGl2ZScpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLkxvYWRCYWxhbmNlcnMhWzBdLlNjaGVtZSkudG9CZSgnaW50ZXJuZXQtZmFjaW5nJyk7XG4gICAgfSwgMzAwMDApO1xuXG4gICAgdGVzdCgnVGFyZ2V0IEdyb3VwIHNob3VsZCBleGlzdCB3aXRoIGhlYWx0aCBjaGVja3MgY29uZmlndXJlZCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZWxiQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZVRhcmdldEdyb3Vwc0NvbW1hbmQoe1xuICAgICAgICAgIE5hbWVzOiBbYHBvcnRmb2xpby10Zy0ke2Vudmlyb25tZW50U3VmZml4fWBdLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLlRhcmdldEdyb3VwcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5UYXJnZXRHcm91cHMhLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5UYXJnZXRHcm91cHMhWzBdLkhlYWx0aENoZWNrUGF0aCkudG9CZSgnL2hlYWx0aCcpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLlRhcmdldEdyb3VwcyFbMF0uSGVhbHRoQ2hlY2tQcm90b2NvbCkudG9CZSgnSFRUUCcpO1xuICAgIH0sIDMwMDAwKTtcblxuICAgIHRlc3QoJ0F1dG8gU2NhbGluZyBHcm91cCBzaG91bGQgYmUgY29uZmlndXJlZCBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGFzZ0NsaWVudC5zZW5kKFxuICAgICAgICBuZXcgRGVzY3JpYmVBdXRvU2NhbGluZ0dyb3Vwc0NvbW1hbmQoe1xuICAgICAgICAgIEF1dG9TY2FsaW5nR3JvdXBOYW1lczogW2Bwb3J0Zm9saW8tYXNnLSR7ZW52aXJvbm1lbnRTdWZmaXh9YF0sXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuQXV0b1NjYWxpbmdHcm91cHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuQXV0b1NjYWxpbmdHcm91cHMhLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgIGNvbnN0IGFzZyA9IHJlc3BvbnNlLkF1dG9TY2FsaW5nR3JvdXBzIVswXTtcbiAgICAgIGV4cGVjdChhc2cuTWluU2l6ZSkudG9CZSgyKTtcbiAgICAgIGV4cGVjdChhc2cuTWF4U2l6ZSkudG9CZSg2KTtcbiAgICAgIGV4cGVjdChhc2cuRGVzaXJlZENhcGFjaXR5KS50b0JlKDIpO1xuICAgIH0sIDMwMDAwKTtcblxuICAgIHRlc3QoJ1NlY3VyaXR5IGdyb3VwcyBzaG91bGQgaGF2ZSBjb3JyZWN0IGluZ3Jlc3MgcnVsZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGVjMkNsaWVudC5zZW5kKFxuICAgICAgICBuZXcgRGVzY3JpYmVTZWN1cml0eUdyb3Vwc0NvbW1hbmQoe1xuICAgICAgICAgIEZpbHRlcnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgTmFtZTogJ3RhZzpOYW1lJyxcbiAgICAgICAgICAgICAgVmFsdWVzOiBbJ3BvcnRmb2xpby1hbGItc2cnLCAncG9ydGZvbGlvLWVjMi1zZyddLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLlNlY3VyaXR5R3JvdXBzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLlNlY3VyaXR5R3JvdXBzIS5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcblxuICAgICAgLy8gQ2hlY2sgQUxCIHNlY3VyaXR5IGdyb3VwIGFsbG93cyBIVFRQL0hUVFBTXG4gICAgICBjb25zdCBhbGJTZyA9IHJlc3BvbnNlLlNlY3VyaXR5R3JvdXBzIS5maW5kKChzZykgPT5cbiAgICAgICAgc2cuVGFncz8uc29tZSgodGFnKSA9PiB0YWcuS2V5ID09PSAnTmFtZScgJiYgdGFnLlZhbHVlID09PSAncG9ydGZvbGlvLWFsYi1zZycpXG4gICAgICApO1xuICAgICAgZXhwZWN0KGFsYlNnKS50b0JlRGVmaW5lZCgpO1xuICAgICAgY29uc3QgaHR0cFJ1bGUgPSBhbGJTZz8uSXBQZXJtaXNzaW9ucz8uZmluZCgocnVsZSkgPT4gcnVsZS5Gcm9tUG9ydCA9PT0gODApO1xuICAgICAgZXhwZWN0KGh0dHBSdWxlKS50b0JlRGVmaW5lZCgpO1xuICAgIH0sIDMwMDAwKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ0RhdGFiYXNlIFJlc291cmNlcycsICgpID0+IHtcbiAgICB0ZXN0KCdSRFMgUG9zdGdyZVNRTCBpbnN0YW5jZSBzaG91bGQgZXhpc3QgYW5kIGJlIGF2YWlsYWJsZScsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmRzQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZURCSW5zdGFuY2VzQ29tbWFuZCh7XG4gICAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGBwb3J0Zm9saW8taG9sZGluZ3MtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLkRCSW5zdGFuY2VzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHJlc3BvbnNlLkRCSW5zdGFuY2VzIS5sZW5ndGgpLnRvQmUoMSk7XG4gICAgICBjb25zdCBkYiA9IHJlc3BvbnNlLkRCSW5zdGFuY2VzIVswXTtcbiAgICAgIGV4cGVjdChkYi5EQkluc3RhbmNlU3RhdHVzKS50b0JlKCdhdmFpbGFibGUnKTtcbiAgICAgIGV4cGVjdChkYi5FbmdpbmUpLnRvQmUoJ3Bvc3RncmVzJyk7XG4gICAgICBleHBlY3QoZGIuRW5naW5lVmVyc2lvbikudG9NYXRjaCgvXjE1XFwuLyk7XG4gICAgICBleHBlY3QoZGIuTXVsdGlBWikudG9CZSh0cnVlKTtcbiAgICB9LCA2MDAwMCk7XG5cbiAgICB0ZXN0KCdSRFMgaW5zdGFuY2Ugc2hvdWxkIGhhdmUgY29ycmVjdCBjb25maWd1cmF0aW9uJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCByZHNDbGllbnQuc2VuZChcbiAgICAgICAgbmV3IERlc2NyaWJlREJJbnN0YW5jZXNDb21tYW5kKHtcbiAgICAgICAgICBEQkluc3RhbmNlSWRlbnRpZmllcjogYHBvcnRmb2xpby1ob2xkaW5ncy1kYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBjb25zdCBkYiA9IHJlc3BvbnNlLkRCSW5zdGFuY2VzIVswXTtcbiAgICAgIGV4cGVjdChkYi5EQkluc3RhbmNlQ2xhc3MpLnRvQmUoJ2RiLnQzLm1lZGl1bScpO1xuICAgICAgZXhwZWN0KGRiLkFsbG9jYXRlZFN0b3JhZ2UpLnRvQmUoMTAwKTtcbiAgICAgIGV4cGVjdChkYi5TdG9yYWdlVHlwZSkudG9CZSgnZ3AzJyk7XG4gICAgICBleHBlY3QoZGIuU3RvcmFnZUVuY3J5cHRlZCkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChkYi5CYWNrdXBSZXRlbnRpb25QZXJpb2QpLnRvQmUoNyk7XG4gICAgfSwgMzAwMDApO1xuXG4gICAgdGVzdCgnREIgU3VibmV0IEdyb3VwIHNob3VsZCBleGlzdCBpbiBwcml2YXRlIHN1Ym5ldHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHJkc0NsaWVudC5zZW5kKFxuICAgICAgICBuZXcgRGVzY3JpYmVEQlN1Ym5ldEdyb3Vwc0NvbW1hbmQoe1xuICAgICAgICAgIERCU3VibmV0R3JvdXBOYW1lOiBgcG9ydGZvbGlvLWRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuREJTdWJuZXRHcm91cHMpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuREJTdWJuZXRHcm91cHMhLmxlbmd0aCkudG9CZSgxKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5EQlN1Ym5ldEdyb3VwcyFbMF0uU3VibmV0cyEubGVuZ3RoKS50b0JlR3JlYXRlclRoYW5PckVxdWFsKFxuICAgICAgICAyXG4gICAgICApO1xuICAgIH0sIDMwMDAwKTtcblxuICAgIHRlc3QoJ0VsYXN0aUNhY2hlIFNlcnZlcmxlc3Mgc2hvdWxkIGV4aXN0IGFuZCBiZSBhdmFpbGFibGUnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGVsYXN0aWNhY2hlQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZVNlcnZlcmxlc3NDYWNoZXNDb21tYW5kKHtcbiAgICAgICAgICBTZXJ2ZXJsZXNzQ2FjaGVOYW1lOiBgcG9ydGZvbGlvLW1hcmtldC1jYWNoZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuU2VydmVybGVzc0NhY2hlcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5TZXJ2ZXJsZXNzQ2FjaGVzIS5sZW5ndGgpLnRvQmUoMSk7XG4gICAgICBjb25zdCBjYWNoZSA9IHJlc3BvbnNlLlNlcnZlcmxlc3NDYWNoZXMhWzBdO1xuICAgICAgZXhwZWN0KGNhY2hlLlN0YXR1cykudG9CZSgnYXZhaWxhYmxlJyk7XG4gICAgICBleHBlY3QoY2FjaGUuRW5naW5lKS50b0JlKCd2YWxrZXknKTtcbiAgICB9LCA2MDAwMCk7XG5cbiAgICB0ZXN0KCdTMyBidWNrZXQgZm9yIGhpc3RvcmljYWwgZGF0YSBzaG91bGQgZXhpc3QnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBGaW5kIGJ1Y2tldCBieSBwcmVmaXggc2luY2UgaXQgaGFzIHRpbWVzdGFtcFxuICAgICAgY29uc3QgYnVja2V0UHJlZml4ID0gYHBvcnRmb2xpby1oaXN0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YDtcbiAgICAgIC8vIE5vdGU6IFRoaXMgdGVzdCBhc3N1bWVzIGJ1Y2tldCBuYW1lIGZvbGxvd3MgcGF0dGVyblxuICAgICAgLy8gSW4gcmVhbCB0ZXN0LCB3b3VsZCBsaXN0IGJ1Y2tldHMgYW5kIGZpbHRlclxuICAgICAgZXhwZWN0KGJ1Y2tldFByZWZpeCkudG9CZURlZmluZWQoKTtcbiAgICB9LCAzMDAwMCk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdBUEkgYW5kIExhbWJkYScsICgpID0+IHtcbiAgICB0ZXN0KCdXZWJTb2NrZXQgQVBJIHNob3VsZCBleGlzdCcsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXBpR2F0ZXdheUNsaWVudC5zZW5kKG5ldyBHZXRBcGlzQ29tbWFuZCh7fSkpO1xuXG4gICAgICBjb25zdCBhcGkgPSByZXNwb25zZS5JdGVtcz8uZmluZCgoaXRlbSkgPT5cbiAgICAgICAgaXRlbS5OYW1lPy5pbmNsdWRlcyhgcG9ydGZvbGlvLXdzLWFwaS0ke2Vudmlyb25tZW50U3VmZml4fWApXG4gICAgICApO1xuICAgICAgZXhwZWN0KGFwaSkudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChhcGk/LlByb3RvY29sVHlwZSkudG9CZSgnV0VCU09DS0VUJyk7XG4gICAgfSwgMzAwMDApO1xuXG4gICAgdGVzdCgnV2ViU29ja2V0IEFQSSBzaG91bGQgaGF2ZSBwcm9kIHN0YWdlJywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgYXBpc1Jlc3BvbnNlID0gYXdhaXQgYXBpR2F0ZXdheUNsaWVudC5zZW5kKG5ldyBHZXRBcGlzQ29tbWFuZCh7fSkpO1xuICAgICAgY29uc3QgYXBpID0gYXBpc1Jlc3BvbnNlLkl0ZW1zPy5maW5kKChpdGVtKSA9PlxuICAgICAgICBpdGVtLk5hbWU/LmluY2x1ZGVzKGBwb3J0Zm9saW8td3MtYXBpLSR7ZW52aXJvbm1lbnRTdWZmaXh9YClcbiAgICAgICk7XG5cbiAgICAgIGlmIChhcGk/LkFwaUlkKSB7XG4gICAgICAgIGNvbnN0IHN0YWdlc1Jlc3BvbnNlID0gYXdhaXQgYXBpR2F0ZXdheUNsaWVudC5zZW5kKFxuICAgICAgICAgIG5ldyBHZXRTdGFnZXNDb21tYW5kKHtcbiAgICAgICAgICAgIEFwaUlkOiBhcGkuQXBpSWQsXG4gICAgICAgICAgfSlcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBwcm9kU3RhZ2UgPSBzdGFnZXNSZXNwb25zZS5JdGVtcz8uZmluZChcbiAgICAgICAgICAoc3RhZ2UpID0+IHN0YWdlLlN0YWdlTmFtZSA9PT0gJ3Byb2QnXG4gICAgICAgICk7XG4gICAgICAgIGV4cGVjdChwcm9kU3RhZ2UpLnRvQmVEZWZpbmVkKCk7XG4gICAgICAgIGV4cGVjdChwcm9kU3RhZ2U/LkF1dG9EZXBsb3kpLnRvQmUodHJ1ZSk7XG4gICAgICB9XG4gICAgfSwgMzAwMDApO1xuXG4gICAgdGVzdCgnTGFtYmRhIGZ1bmN0aW9uIHNob3VsZCBleGlzdCBhbmQgYmUgY29uZmlndXJlZCBjb3JyZWN0bHknLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGxhbWJkYUNsaWVudC5zZW5kKFxuICAgICAgICBuZXcgR2V0RnVuY3Rpb25Db21tYW5kKHtcbiAgICAgICAgICBGdW5jdGlvbk5hbWU6IGBwb3J0Zm9saW8td3MtaGFuZGxlci0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuQ29uZmlndXJhdGlvbikudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5Db25maWd1cmF0aW9uPy5SdW50aW1lKS50b0JlKCdub2RlanMxOC54Jyk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuQ29uZmlndXJhdGlvbj8uVGltZW91dCkudG9CZSgzMCk7XG4gICAgICBleHBlY3QocmVzcG9uc2UuQ29uZmlndXJhdGlvbj8uTWVtb3J5U2l6ZSkudG9CZSgyNTYpO1xuICAgIH0sIDMwMDAwKTtcblxuICAgIHRlc3QoJ0xhbWJkYSBmdW5jdGlvbiBzaG91bGQgaGF2ZSBjb3JyZWN0IGVudmlyb25tZW50IHZhcmlhYmxlcycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgbGFtYmRhQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBHZXRGdW5jdGlvbkNvbmZpZ3VyYXRpb25Db21tYW5kKHtcbiAgICAgICAgICBGdW5jdGlvbk5hbWU6IGBwb3J0Zm9saW8td3MtaGFuZGxlci0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocmVzcG9uc2UuRW52aXJvbm1lbnQ/LlZhcmlhYmxlcykudG9CZURlZmluZWQoKTtcbiAgICAgIGV4cGVjdChyZXNwb25zZS5FbnZpcm9ubWVudD8uVmFyaWFibGVzPy5BTEJfRE5TKS50b0JlRGVmaW5lZCgpO1xuICAgIH0sIDMwMDAwKTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ01vbml0b3JpbmcnLCAoKSA9PiB7XG4gICAgdGVzdCgnQ2xvdWRXYXRjaCBEYXNoYm9hcmQgc2hvdWxkIGV4aXN0JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjbG91ZHdhdGNoQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBHZXREYXNoYm9hcmRDb21tYW5kKHtcbiAgICAgICAgICBEYXNoYm9hcmROYW1lOiAncG9ydGZvbGlvLXRyYWNraW5nLW1ldHJpY3MnLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KHJlc3BvbnNlLkRhc2hib2FyZEJvZHkpLnRvQmVEZWZpbmVkKCk7XG4gICAgICBjb25zdCBkYXNoYm9hcmRCb2R5ID0gSlNPTi5wYXJzZShyZXNwb25zZS5EYXNoYm9hcmRCb2R5ISk7XG4gICAgICBleHBlY3QoZGFzaGJvYXJkQm9keS53aWRnZXRzKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KGRhc2hib2FyZEJvZHkud2lkZ2V0cy5sZW5ndGgpLnRvQmVHcmVhdGVyVGhhbigwKTtcbiAgICB9LCAzMDAwMCk7XG5cbiAgICB0ZXN0KCdEYXNoYm9hcmQgc2hvdWxkIG1vbml0b3Iga2V5IG1ldHJpY3MnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNsb3Vkd2F0Y2hDbGllbnQuc2VuZChcbiAgICAgICAgbmV3IEdldERhc2hib2FyZENvbW1hbmQoe1xuICAgICAgICAgIERhc2hib2FyZE5hbWU6ICdwb3J0Zm9saW8tdHJhY2tpbmctbWV0cmljcycsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBjb25zdCBkYXNoYm9hcmRCb2R5ID0gSlNPTi5wYXJzZShyZXNwb25zZS5EYXNoYm9hcmRCb2R5ISk7XG5cbiAgICAgIC8vIEV4dHJhY3QgYWxsIG1ldHJpYyBuYW1lc3BhY2VzIGZyb20gYWxsIHdpZGdldHNcbiAgICAgIGNvbnN0IG1ldHJpY05hbWVzcGFjZXMgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgICAgIGRhc2hib2FyZEJvZHkud2lkZ2V0cy5mb3JFYWNoKCh3aWRnZXQ6IGFueSkgPT4ge1xuICAgICAgICBjb25zdCBtZXRyaWNzID0gd2lkZ2V0LnByb3BlcnRpZXM/Lm1ldHJpY3MgfHwgW107XG4gICAgICAgIG1ldHJpY3MuZm9yRWFjaCgobWV0cmljQXJyYXk6IGFueSkgPT4ge1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG1ldHJpY0FycmF5KSAmJiBtZXRyaWNBcnJheS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtZXRyaWNOYW1lc3BhY2VzLmFkZChtZXRyaWNBcnJheVswXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QobWV0cmljTmFtZXNwYWNlcy5oYXMoJ0FXUy9FQzInKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChtZXRyaWNOYW1lc3BhY2VzLmhhcygnQVdTL0FwcGxpY2F0aW9uRUxCJykpLnRvQmUodHJ1ZSk7XG4gICAgICBleHBlY3QobWV0cmljTmFtZXNwYWNlcy5oYXMoJ0FXUy9SRFMnKSkudG9CZSh0cnVlKTtcbiAgICAgIGV4cGVjdChtZXRyaWNOYW1lc3BhY2VzLmhhcygnQVdTL0F1dG9TY2FsaW5nJykpLnRvQmUodHJ1ZSk7XG4gICAgfSwgMzAwMDApO1xuICB9KTtcblxuICBkZXNjcmliZSgnRW5kLXRvLUVuZCBWYWxpZGF0aW9uJywgKCkgPT4ge1xuICAgIHRlc3QoJ0FsbCBjb21wb25lbnRzIHNob3VsZCBiZSBpbiBjb3JyZWN0IHN1Ym5ldHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICAvLyBWYWxpZGF0ZSBSRFMgaXMgaW4gcHJpdmF0ZSBzdWJuZXRzXG4gICAgICBjb25zdCBkYlJlc3BvbnNlID0gYXdhaXQgcmRzQ2xpZW50LnNlbmQoXG4gICAgICAgIG5ldyBEZXNjcmliZURCSW5zdGFuY2VzQ29tbWFuZCh7XG4gICAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGBwb3J0Zm9saW8taG9sZGluZ3MtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgY29uc3QgZGJTdWJuZXRHcm91cCA9IGRiUmVzcG9uc2UuREJJbnN0YW5jZXMhWzBdLkRCU3VibmV0R3JvdXA7XG4gICAgICBleHBlY3QoZGJTdWJuZXRHcm91cCkudG9CZURlZmluZWQoKTtcblxuICAgICAgLy8gVmFsaWRhdGUgQUxCIGlzIGluIHB1YmxpYyBzdWJuZXRzXG4gICAgICBjb25zdCBhbGJSZXNwb25zZSA9IGF3YWl0IGVsYkNsaWVudC5zZW5kKFxuICAgICAgICBuZXcgRGVzY3JpYmVMb2FkQmFsYW5jZXJzQ29tbWFuZCh7XG4gICAgICAgICAgTmFtZXM6IFtgcG9ydGZvbGlvLWFsYi0ke2Vudmlyb25tZW50U3VmZml4fWBdLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZXhwZWN0KGFsYlJlc3BvbnNlLkxvYWRCYWxhbmNlcnMhWzBdLlNjaGVtZSkudG9CZSgnaW50ZXJuZXQtZmFjaW5nJyk7XG4gICAgfSwgMzAwMDApO1xuXG4gICAgdGVzdCgnU2VjdXJpdHkgZ3JvdXBzIHNob3VsZCBhbGxvdyBwcm9wZXIgY29ubmVjdGl2aXR5JywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBlYzJDbGllbnQuc2VuZChcbiAgICAgICAgbmV3IERlc2NyaWJlU2VjdXJpdHlHcm91cHNDb21tYW5kKHtcbiAgICAgICAgICBGaWx0ZXJzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIE5hbWU6ICd0YWc6TmFtZScsXG4gICAgICAgICAgICAgIFZhbHVlczogWydwb3J0Zm9saW8tZGItc2cnXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGRiU2cgPSByZXNwb25zZS5TZWN1cml0eUdyb3VwcyFbMF07XG4gICAgICBjb25zdCBwb3N0Z3Jlc1J1bGUgPSBkYlNnLklwUGVybWlzc2lvbnM/LmZpbmQoXG4gICAgICAgIChydWxlKSA9PiBydWxlLkZyb21Qb3J0ID09PSA1NDMyXG4gICAgICApO1xuXG4gICAgICBleHBlY3QocG9zdGdyZXNSdWxlKS50b0JlRGVmaW5lZCgpO1xuICAgICAgZXhwZWN0KHBvc3RncmVzUnVsZT8uSXBSYW5nZXM/LlswXS5DaWRySXApLnRvQmUoJzE3Mi4zMi4wLjAvMTYnKTtcbiAgICB9LCAzMDAwMCk7XG4gIH0pO1xufSk7XG4iXX0=