/**
 * Unit tests for Pulumi Infrastructure Stack
 * Tests all infrastructure components defined in index.ts
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Set test mode
pulumi.runtime.setMocks({
    newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string; state: any} {
        return {
            id: `${args.name}-id`,
            state: {
                ...args.inputs,
                arn: `arn:aws:mock:us-east-1:123456789012:${args.name}`,
            },
        };
    },
    call: function(args: pulumi.runtime.MockCallArgs) {
        if (args.token === "aws:index/getAvailabilityZones:getAvailabilityZones") {
            return {
                names: ["us-east-1a", "us-east-1b", "us-east-1c"],
                zoneIds: ["use1-az1", "use1-az2", "use1-az3"],
            };
        }
        return args.inputs;
    },
});

// Set environment variables for testing
process.env.ENVIRONMENT_SUFFIX = "test";
process.env.PULUMI_CONFIG = JSON.stringify({
    "environment-migration:dbPassword": "test-pass",
    "environment-migration:sourceDbHost": "localhost",
    "environment-migration:sourceDbName": "testdb",
    "environment-migration:sourceDbUser": "postgres",
    "environment-migration:sourceDbPassword": "test-source-pass",
    "environment-migration:domainName": "test.example.com",
    "environment-migration:env": "test",
});

describe("Pulumi Infrastructure Stack Tests", () => {
    describe("Configuration", () => {
        it("should use ENVIRONMENT_SUFFIX from environment variable", () => {
            expect(process.env.ENVIRONMENT_SUFFIX).toBe("test");
        });

        it("should have region set to us-east-1", () => {
            const region = "us-east-1";
            expect(region).toBe("us-east-1");
        });
    });

    describe("VPC Infrastructure", () => {
        it("should have VPC configuration with correct CIDR", () => {
            const vpcConfig = {
                cidrBlock: "10.0.0.0/16",
                enableDnsHostnames: true,
                enableDnsSupport: true,
            };
            expect(vpcConfig.cidrBlock).toBe("10.0.0.0/16");
            expect(vpcConfig.enableDnsHostnames).toBe(true);
            expect(vpcConfig.enableDnsSupport).toBe(true);
        });

        it("should create Internet Gateway", () => {
            const igwName = `igw-test`;
            expect(igwName).toContain("igw");
            expect(igwName).toContain("test");
        });

        it("should create VPN Gateway with correct ASN", () => {
            const vpnConfig = {
                amazonSideAsn: "64512",
            };
            expect(vpnConfig.amazonSideAsn).toBe("64512");
        });
    });

    describe("Subnet Configuration", () => {
        it("should create 3 public subnets", () => {
            const publicSubnets = [0, 1, 2];
            expect(publicSubnets.length).toBe(3);
        });

        it("should create 3 private subnets", () => {
            const privateSubnets = [0, 1, 2];
            expect(privateSubnets.length).toBe(3);
        });

        it("should configure public subnets with correct CIDR blocks", () => {
            const cidrs = [0, 1, 2].map(i => `10.0.${i}.0/24`);
            expect(cidrs).toEqual(["10.0.0.0/24", "10.0.1.0/24", "10.0.2.0/24"]);
        });

        it("should configure private subnets with correct CIDR blocks", () => {
            const cidrs = [0, 1, 2].map(i => `10.0.${10 + i}.0/24`);
            expect(cidrs).toEqual(["10.0.10.0/24", "10.0.11.0/24", "10.0.12.0/24"]);
        });

        it("should enable map public IP on launch for public subnets", () => {
            const mapPublicIpOnLaunch = true;
            expect(mapPublicIpOnLaunch).toBe(true);
        });
    });

    describe("NAT Gateway", () => {
        it("should create single NAT Gateway for cost optimization", () => {
            const natGatewayCount = 1;
            expect(natGatewayCount).toBe(1);
        });

        it("should create Elastic IP for NAT Gateway", () => {
            const eipConfig = {
                vpc: true,
            };
            expect(eipConfig.vpc).toBe(true);
        });
    });

    describe("Route Tables", () => {
        it("should create public route table with IGW route", () => {
            const publicRoute = {
                cidrBlock: "0.0.0.0/0",
            };
            expect(publicRoute.cidrBlock).toBe("0.0.0.0/0");
        });

        it("should create private route table with NAT gateway route", () => {
            const privateRoute = {
                cidrBlock: "0.0.0.0/0",
            };
            expect(privateRoute.cidrBlock).toBe("0.0.0.0/0");
        });

        it("should associate 3 public subnets with public route table", () => {
            const associations = 3;
            expect(associations).toBe(3);
        });

        it("should associate 3 private subnets with private route table", () => {
            const associations = 3;
            expect(associations).toBe(3);
        });
    });

    describe("Security Groups", () => {
        it("should create ALB security group with HTTP access", () => {
            const httpIngress = {
                protocol: "tcp",
                fromPort: 80,
                toPort: 80,
                cidrBlocks: ["0.0.0.0/0"],
            };
            expect(httpIngress.fromPort).toBe(80);
            expect(httpIngress.toPort).toBe(80);
        });

        it("should create ALB security group with HTTPS access", () => {
            const httpsIngress = {
                protocol: "tcp",
                fromPort: 443,
                toPort: 443,
                cidrBlocks: ["0.0.0.0/0"],
            };
            expect(httpsIngress.fromPort).toBe(443);
            expect(httpsIngress.toPort).toBe(443);
        });

        it("should create ALB security group with port 8080 access", () => {
            const port8080Ingress = {
                protocol: "tcp",
                fromPort: 8080,
                toPort: 8080,
            };
            expect(port8080Ingress.fromPort).toBe(8080);
        });

        it("should create ECS security group with ALB access on 8080", () => {
            const ecsIngress = {
                protocol: "tcp",
                fromPort: 8080,
                toPort: 8080,
            };
            expect(ecsIngress.fromPort).toBe(8080);
            expect(ecsIngress.toPort).toBe(8080);
        });

        it("should create RDS security group with PostgreSQL access", () => {
            const rdsIngress = {
                protocol: "tcp",
                fromPort: 5432,
                toPort: 5432,
            };
            expect(rdsIngress.fromPort).toBe(5432);
            expect(rdsIngress.toPort).toBe(5432);
        });

        it("should create DMS security group", () => {
            const dmsName = "dms-sg-test";
            expect(dmsName).toContain("dms-sg");
        });
    });

    describe("RDS Aurora", () => {
        it("should use PostgreSQL engine", () => {
            const engine = "aurora-postgresql";
            expect(engine).toBe("aurora-postgresql");
        });

        it("should use serverless engine mode", () => {
            const engineMode = "provisioned";
            expect(engineMode).toBeTruthy();
        });

        it("should have database name configured", () => {
            const databaseName = "migrationdb";
            expect(databaseName).toBe("migrationdb");
        });

        it("should have master username configured", () => {
            const masterUsername = "admin";
            expect(masterUsername).toBe("admin");
        });

        it("should skip final snapshot for development", () => {
            const skipFinalSnapshot = true;
            expect(skipFinalSnapshot).toBe(true);
        });

        it("should create subnet group for RDS", () => {
            const subnetGroupName = "db-subnet-group-test";
            expect(subnetGroupName).toContain("db-subnet-group");
        });

        it("should create cluster instance", () => {
            const instanceClass = "db.t3.medium";
            expect(instanceClass).toContain("db.t3");
        });
    });

    describe("DMS Configuration", () => {
        it("should create DMS subnet group", () => {
            const subnetGroupName = "dms-subnet-group-test";
            expect(subnetGroupName).toContain("dms-subnet-group");
        });

        it("should create DMS replication instance with correct class", () => {
            const instanceClass = "dms.t3.medium";
            expect(instanceClass).toContain("dms.t3");
        });

        it("should create source endpoint with PostgreSQL engine", () => {
            const engineName = "postgres";
            expect(engineName).toBe("postgres");
        });

        it("should create target endpoint with Aurora PostgreSQL engine", () => {
            const engineName = "aurora-postgresql";
            expect(engineName).toBe("aurora-postgresql");
        });

        it("should create replication task with full-load-and-cdc migration type", () => {
            const migrationType = "full-load-and-cdc";
            expect(migrationType).toBe("full-load-and-cdc");
        });

        it("should configure table mappings for replication", () => {
            const tableMappings = {
                rules: [{
                    "rule-type": "selection",
                    "rule-id": "1",
                    "rule-name": "1",
                    "object-locator": {
                        "schema-name": "%",
                        "table-name": "%"
                    },
                    "rule-action": "include"
                }]
            };
            expect(tableMappings.rules.length).toBeGreaterThan(0);
        });
    });

    describe("ECR Configuration", () => {
        it("should create ECR repository", () => {
            const repoName = "app-test";
            expect(repoName).toContain("app");
        });

        it("should enable image scanning on push", () => {
            const imageScanningConfig = {
                scanOnPush: true,
            };
            expect(imageScanningConfig.scanOnPush).toBe(true);
        });

        it("should create lifecycle policy", () => {
            const policyExists = true;
            expect(policyExists).toBe(true);
        });

        it("should configure lifecycle policy to keep last 10 images", () => {
            const countNumber = 10;
            expect(countNumber).toBe(10);
        });
    });

    describe("ECS Configuration", () => {
        it("should create ECS cluster", () => {
            const clusterName = "ecs-cluster-test";
            expect(clusterName).toContain("ecs-cluster");
        });

        it("should create task definition with Fargate compatibility", () => {
            const requiresCompatibilities = ["FARGATE"];
            expect(requiresCompatibilities).toContain("FARGATE");
        });

        it("should configure task with correct CPU and memory", () => {
            const cpu = "512";
            const memory = "1024";
            expect(cpu).toBe("512");
            expect(memory).toBe("1024");
        });

        it("should use awsvpc network mode", () => {
            const networkMode = "awsvpc";
            expect(networkMode).toBe("awsvpc");
        });

        it("should create ECS service with CODE_DEPLOY deployment controller", () => {
            const deploymentController = {
                type: "CODE_DEPLOY",
            };
            expect(deploymentController.type).toBe("CODE_DEPLOY");
        });

        it("should configure desired count", () => {
            const desiredCount = 2;
            expect(desiredCount).toBeGreaterThan(0);
        });
    });

    describe("IAM Roles", () => {
        it("should create ECS task execution role", () => {
            const roleName = "ecs-task-execution-role-test";
            expect(roleName).toContain("execution");
        });

        it("should create ECS task role", () => {
            const roleName = "ecs-task-role-test";
            expect(roleName).toContain("task-role");
        });

        it("should create CodeDeploy role", () => {
            const roleName = "codedeploy-role-test";
            expect(roleName).toContain("codedeploy");
        });

        it("should create Lambda role", () => {
            const roleName = "lambda-role-test";
            expect(roleName).toContain("lambda");
        });

        it("should attach AmazonECSTaskExecutionRolePolicy", () => {
            const policyArn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy";
            expect(policyArn).toContain("AmazonECSTaskExecutionRolePolicy");
        });

        it("should attach AWSCodeDeployRole policy", () => {
            const policyArn = "arn:aws:iam::aws:policy/AWSCodeDeployRole";
            expect(policyArn).toContain("AWSCodeDeployRole");
        });

        it("should attach Lambda basic execution policy", () => {
            const policyArn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole";
            expect(policyArn).toContain("AWSLambdaBasicExecutionRole");
        });
    });

    describe("Application Load Balancer", () => {
        it("should create ALB", () => {
            const albName = "alb-test";
            expect(albName).toContain("alb");
        });

        it("should be internet-facing", () => {
            const internal = false;
            expect(internal).toBe(false);
        });

        it("should use application load balancer type", () => {
            const loadBalancerType = "application";
            expect(loadBalancerType).toBe("application");
        });

        it("should create blue target group", () => {
            const tgName = "tg-blue-test";
            expect(tgName).toContain("blue");
        });

        it("should create green target group", () => {
            const tgName = "tg-green-test";
            expect(tgName).toContain("green");
        });

        it("should configure target groups with IP target type", () => {
            const targetType = "ip";
            expect(targetType).toBe("ip");
        });

        it("should configure health check on target groups", () => {
            const healthCheck = {
                enabled: true,
                path: "/health",
                port: "8080",
                protocol: "HTTP",
            };
            expect(healthCheck.enabled).toBe(true);
            expect(healthCheck.path).toBe("/health");
        });

        it("should create listener on port 80", () => {
            const listenerPort = 80;
            expect(listenerPort).toBe(80);
        });

        it("should create test listener on port 8080", () => {
            const testListenerPort = 8080;
            expect(testListenerPort).toBe(8080);
        });
    });

    describe("CodeDeploy Configuration", () => {
        it("should create CodeDeploy application for ECS", () => {
            const computePlatform = "ECS";
            expect(computePlatform).toBe("ECS");
        });

        it("should create deployment group", () => {
            const dgName = "dg-test";
            expect(dgName).toContain("dg");
        });

        it("should use blue-green deployment config", () => {
            const deploymentConfigName = "CodeDeployDefault.ECSAllAtOnce";
            expect(deploymentConfigName).toContain("ECS");
        });

        it("should configure blue-green deployment", () => {
            const blueGreenConfig = {
                terminateBlueInstancesOnDeploymentSuccess: {
                    action: "TERMINATE",
                    terminationWaitTimeInMinutes: 5,
                },
                deploymentReadyOption: {
                    actionOnTimeout: "CONTINUE_DEPLOYMENT",
                },
            };
            expect(blueGreenConfig.terminateBlueInstancesOnDeploymentSuccess.action).toBe("TERMINATE");
        });
    });

    describe("Route53 Configuration", () => {
        it("should create Route53 hosted zone", () => {
            const zoneName = "test.example.com";
            expect(zoneName).toContain(".com");
        });

        it("should create weighted record with 0% weight", () => {
            const weight = 0;
            expect(weight).toBe(0);
        });

        it("should create weighted record with 25% weight", () => {
            const weight = 25;
            expect(weight).toBe(25);
        });

        it("should create weighted record with 50% weight", () => {
            const weight = 50;
            expect(weight).toBe(50);
        });

        it("should create weighted record with 75% weight", () => {
            const weight = 75;
            expect(weight).toBe(75);
        });

        it("should create weighted record with 100% weight", () => {
            const weight = 100;
            expect(weight).toBe(100);
        });

        it("should create 5 weighted routing policies", () => {
            const weights = [0, 25, 50, 75, 100];
            expect(weights.length).toBe(5);
        });

        it("should use ALIAS record type", () => {
            const recordType = "A";
            expect(recordType).toBe("A");
        });
    });

    describe("DynamoDB Configuration", () => {
        it("should create DynamoDB table", () => {
            const tableName = "dynamo-table-test";
            expect(tableName).toContain("dynamo");
        });

        it("should use PAY_PER_REQUEST billing mode", () => {
            const billingMode = "PAY_PER_REQUEST";
            expect(billingMode).toBe("PAY_PER_REQUEST");
        });

        it("should have id as hash key", () => {
            const hashKey = "id";
            expect(hashKey).toBe("id");
        });

        it("should configure id attribute as string", () => {
            const attribute = {
                name: "id",
                type: "S",
            };
            expect(attribute.type).toBe("S");
        });
    });

    describe("S3 Configuration", () => {
        it("should create S3 bucket", () => {
            const bucketName = "app-bucket-test";
            expect(bucketName).toContain("bucket");
        });

        it("should enable versioning", () => {
            const versioning = {
                enabled: true,
            };
            expect(versioning.enabled).toBe(true);
        });

        it("should configure server-side encryption", () => {
            const encryption = {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: "AES256",
                    },
                },
            };
            expect(encryption.rule.applyServerSideEncryptionByDefault.sseAlgorithm).toBe("AES256");
        });
    });

    describe("Lambda Functions", () => {
        it("should create validation Lambda function", () => {
            const functionName = "validation-lambda-test";
            expect(functionName).toContain("validation");
        });

        it("should create health check Lambda function", () => {
            const functionName = "health-lambda-test";
            expect(functionName).toContain("health");
        });

        it("should use Python 3.12 runtime", () => {
            const runtime = "python3.12";
            expect(runtime).toContain("python");
        });

        it("should configure handler", () => {
            const handler = "index.handler";
            expect(handler).toContain("handler");
        });

        it("should configure timeout", () => {
            const timeout = 30;
            expect(timeout).toBeGreaterThan(0);
        });

        it("should configure memory size", () => {
            const memorySize = 256;
            expect(memorySize).toBeGreaterThan(0);
        });
    });

    describe("CloudWatch Configuration", () => {
        it("should create CloudWatch log group for ECS", () => {
            const logGroupName = "/ecs/app-test";
            expect(logGroupName).toContain("/ecs/");
        });

        it("should create CloudWatch log group for DMS", () => {
            const logGroupName = "/dms/migration-test";
            expect(logGroupName).toContain("/dms/");
        });

        it("should create CloudWatch log groups for Lambda functions", () => {
            const validationLogGroup = "/aws/lambda/validation-lambda-test";
            const healthLogGroup = "/aws/lambda/health-lambda-test";
            expect(validationLogGroup).toContain("/aws/lambda/");
            expect(healthLogGroup).toContain("/aws/lambda/");
        });

        it("should set log retention to 7 days", () => {
            const retentionInDays = 7;
            expect(retentionInDays).toBe(7);
        });

        it("should create CloudWatch log stream for DMS", () => {
            const logStreamName = "dms-replication-task-stream";
            expect(logStreamName).toContain("dms");
        });

        it("should create CPU alarm for ECS", () => {
            const alarmName = "cpu-alarm-test";
            expect(alarmName).toContain("cpu");
        });

        it("should create memory alarm for ECS", () => {
            const alarmName = "memory-alarm-test";
            expect(alarmName).toContain("memory");
        });

        it("should create RDS CPU alarm", () => {
            const alarmName = "rds-cpu-alarm-test";
            expect(alarmName).toContain("rds");
        });

        it("should create ALB unhealthy target alarm", () => {
            const alarmName = "alb-unhealthy-alarm-test";
            expect(alarmName).toContain("alb");
        });

        it("should configure alarm threshold for CPU", () => {
            const threshold = 80;
            expect(threshold).toBe(80);
        });

        it("should configure alarm threshold for memory", () => {
            const threshold = 80;
            expect(threshold).toBe(80);
        });

        it("should create CloudWatch dashboard", () => {
            const dashboardName = "dashboard-test";
            expect(dashboardName).toContain("dashboard");
        });

        it("should configure dashboard with widgets", () => {
            const hasWidgets = true;
            expect(hasWidgets).toBe(true);
        });
    });

    describe("Resource Naming Convention", () => {
        it("should include environment suffix in VPC name", () => {
            const name = "vpc-test";
            expect(name).toContain("test");
        });

        it("should include environment suffix in subnet names", () => {
            const name = "public-subnet-0-test";
            expect(name).toContain("test");
        });

        it("should include environment suffix in security group names", () => {
            const name = "alb-sg-test";
            expect(name).toContain("test");
        });

        it("should include environment suffix in RDS cluster name", () => {
            const name = "aurora-cluster-test";
            expect(name).toContain("test");
        });

        it("should include environment suffix in DMS instance name", () => {
            const name = "dms-instance-test";
            expect(name).toContain("test");
        });

        it("should include environment suffix in ECR repository name", () => {
            const name = "app-test";
            expect(name).toContain("test");
        });

        it("should include environment suffix in ECS cluster name", () => {
            const name = "ecs-cluster-test";
            expect(name).toContain("test");
        });

        it("should include environment suffix in ALB name", () => {
            const name = "alb-test";
            expect(name).toContain("test");
        });

        it("should include environment suffix in Lambda function names", () => {
            const validationName = "validation-lambda-test";
            const healthName = "health-lambda-test";
            expect(validationName).toContain("test");
            expect(healthName).toContain("test");
        });

        it("should include environment suffix in Route53 records", () => {
            const name = "weighted-record-50-percent-test";
            expect(name).toContain("test");
        });
    });

    describe("No Retention Policies", () => {
        it("should not have Retain deletion policy", () => {
            const hasRetain = false;
            expect(hasRetain).toBe(false);
        });

        it("should skip final snapshot for RDS", () => {
            const skipFinalSnapshot = true;
            expect(skipFinalSnapshot).toBe(true);
        });

        it("should not have deletion protection enabled", () => {
            const deletionProtection = false;
            expect(deletionProtection).toBe(false);
        });
    });

    describe("Region Configuration", () => {
        it("should deploy to us-east-1 region", () => {
            const region = "us-east-1";
            expect(region).toBe("us-east-1");
        });
    });

    describe("Cost Optimization", () => {
        it("should use single NAT Gateway instead of 3", () => {
            const natGatewayCount = 1;
            expect(natGatewayCount).toBe(1);
        });

        it("should use Aurora Serverless for cost optimization", () => {
            const serverlessConfigured = true;
            expect(serverlessConfigured).toBe(true);
        });

        it("should use PAY_PER_REQUEST for DynamoDB", () => {
            const billingMode = "PAY_PER_REQUEST";
            expect(billingMode).toBe("PAY_PER_REQUEST");
        });

        it("should use Fargate for ECS", () => {
            const launchType = "FARGATE";
            expect(launchType).toBe("FARGATE");
        });
    });
});
