### Reasoning Trace
---

This is a comprehensive request for a production-grade CI/CD pipeline using Pulumi with TypeScript. I need to create three files:

1. `lib/tap-stack.ts` - The main Pulumi stack implementation
2. `tests/tap-stack.unit.test.ts` - Unit tests
3. `tests/tap-stack.int.test.ts` - Integration tests

Key requirements:
- Multi-region deployment (us-east-1 and eu-west-1)
- AWS CodePipeline with GitHub integration
- ECS deployments with Blue/Green strategy
- Security scanning and encryption
- Manual approval gates
- SNS notifications
- CloudWatch monitoring and automatic rollback
- Comprehensive logging and auditing

Let me start with the main stack implementation:

For `lib/tap-stack.ts`, I need to:
1. Set up multi-region providers
2. Create KMS keys for encryption in both regions
3. Set up S3 buckets for artifacts with encryption and versioning
4. Create ECR repositories in both regions
5. Configure CodeBuild projects for build and test stages
6. Set up ECS clusters, task definitions, and services in both regions
7. Create CodeDeploy for Blue/Green deployments
8. Configure CodePipeline with all stages
9. Set up SNS topics for notifications
10. Create CloudWatch alarms for monitoring
11. Configure CloudTrail for auditing

For the tests, I'll need to:
- Use Pulumi's testing framework with mocks
- Test resource creation and properties
- Validate multi-region setup
- Check encryption settings
- Test pipeline configuration

Let me implement this step by step.
### Answer 
---

I'll implement a production-grade multi-region CI/CD pipeline using Pulumi with TypeScript. Let me create the three required files with comprehensive infrastructure and testing.

## lib/tap-stack.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Configuration
const config = new pulumi.Config();
const appName = config.get("appName") || "tap-app";
const githubRepo = config.require("githubRepo");
const githubBranch = config.get("githubBranch") || "main";
const githubOwner = config.require("githubOwner");
const notificationEmail = config.require("notificationEmail");
const dockerImageName = config.get("dockerImageName") || "app";

// Multi-region providers
const usEast1Provider = new aws.Provider("us-east-1-provider", { 
    region: "us-east-1" 
});

const euWest1Provider = new aws.Provider("eu-west-1-provider", { 
    region: "eu-west-1" 
});

// Common tags
const commonTags = {
    Application: appName,
    Environment: "production",
    ManagedBy: "pulumi",
    Stack: pulumi.getStack()
};

// Current caller identity
const current = aws.getCallerIdentity({});

// KMS Keys for encryption in both regions
const kmsKeyUsEast1 = new aws.kms.Key("pipeline-key-us-east-1", {
    description: "KMS key for pipeline encryption in us-east-1",
    enableKeyRotation: true,
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const kmsKeyEuWest1 = new aws.kms.Key("pipeline-key-eu-west-1", {
    description: "KMS key for pipeline encryption in eu-west-1",
    enableKeyRotation: true,
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// KMS Key aliases
const kmsAliasUsEast1 = new aws.kms.Alias("pipeline-key-alias-us-east-1", {
    name: `alias/${appName}-pipeline`,
    targetKeyId: kmsKeyUsEast1.id
}, { provider: usEast1Provider });

const kmsAliasEuWest1 = new aws.kms.Alias("pipeline-key-alias-eu-west-1", {
    name: `alias/${appName}-pipeline`,
    targetKeyId: kmsKeyEuWest1.id
}, { provider: euWest1Provider });

// S3 Buckets for artifacts with encryption
const artifactBucketUsEast1 = new aws.s3.Bucket("pipeline-artifacts-us-east-1", {
    acl: "private",
    versioning: {
        enabled: true
    },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
                kmsMasterKeyId: kmsKeyUsEast1.arn
            }
        }
    },
    lifecycleRules: [{
        enabled: true,
        noncurrentVersionExpiration: {
            days: 30
        }
    }],
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const artifactBucketEuWest1 = new aws.s3.Bucket("pipeline-artifacts-eu-west-1", {
    acl: "private",
    versioning: {
        enabled: true
    },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
                kmsMasterKeyId: kmsKeyEuWest1.arn
            }
        }
    },
    lifecycleRules: [{
        enabled: true,
        noncurrentVersionExpiration: {
            days: 30
        }
    }],
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// Block public access on artifact buckets
const artifactBucketPabUsEast1 = new aws.s3.BucketPublicAccessBlock("pipeline-artifacts-pab-us-east-1", {
    bucket: artifactBucketUsEast1.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
}, { provider: usEast1Provider });

const artifactBucketPabEuWest1 = new aws.s3.BucketPublicAccessBlock("pipeline-artifacts-pab-eu-west-1", {
    bucket: artifactBucketEuWest1.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
}, { provider: euWest1Provider });

// ECR Repositories in both regions
const ecrRepoUsEast1 = new aws.ecr.Repository("app-repo-us-east-1", {
    name: `${appName}-repo`,
    imageScanningConfiguration: {
        scanOnPush: true
    },
    imageTagMutability: "MUTABLE",
    encryptionConfigurations: [{
        encryptionType: "KMS",
        kmsKey: kmsKeyUsEast1.arn
    }],
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const ecrRepoEuWest1 = new aws.ecr.Repository("app-repo-eu-west-1", {
    name: `${appName}-repo`,
    imageScanningConfiguration: {
        scanOnPush: true
    },
    imageTagMutability: "MUTABLE",
    encryptionConfigurations: [{
        encryptionType: "KMS",
        kmsKey: kmsKeyEuWest1.arn
    }],
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// ECR Repository lifecycle policy
const ecrLifecyclePolicyDoc = JSON.stringify({
    rules: [{
        rulePriority: 1,
        description: "Keep last 10 images",
        selection: {
            tagStatus: "any",
            countType: "imageCountMoreThan",
            countNumber: 10
        },
        action: {
            type: "expire"
        }
    }]
});

const ecrLifecyclePolicyUsEast1 = new aws.ecr.LifecyclePolicy("ecr-lifecycle-us-east-1", {
    repository: ecrRepoUsEast1.name,
    policy: ecrLifecyclePolicyDoc
}, { provider: usEast1Provider });

const ecrLifecyclePolicyEuWest1 = new aws.ecr.LifecyclePolicy("ecr-lifecycle-eu-west-1", {
    repository: ecrRepoEuWest1.name,
    policy: ecrLifecyclePolicyDoc
}, { provider: euWest1Provider });

// CloudWatch Log Groups
const buildLogGroup = new aws.cloudwatch.LogGroup("build-logs", {
    name: `/aws/codebuild/${appName}-build`,
    retentionInDays: 30,
    kmsKeyId: kmsKeyUsEast1.arn,
    tags: commonTags
}, { provider: usEast1Provider });

const testLogGroup = new aws.cloudwatch.LogGroup("test-logs", {
    name: `/aws/codebuild/${appName}-test`,
    retentionInDays: 30,
    kmsKeyId: kmsKeyUsEast1.arn,
    tags: commonTags
}, { provider: usEast1Provider });

// IAM Roles and Policies
const codeBuildRole = new aws.iam.Role("codebuild-role", {
    assumeRolePolicy: aws.iam.getPolicyDocument({
        statements: [{
            effect: "Allow",
            principals: [{
                type: "Service",
                identifiers: ["codebuild.amazonaws.com"]
            }],
            actions: ["sts:AssumeRole"]
        }]
    }).then(doc => doc.json),
    tags: commonTags
});

const codeBuildPolicy = new aws.iam.RolePolicy("codebuild-policy", {
    role: codeBuildRole.id,
    policy: pulumi.all([
        artifactBucketUsEast1.arn,
        artifactBucketEuWest1.arn,
        ecrRepoUsEast1.arn,
        ecrRepoEuWest1.arn,
        kmsKeyUsEast1.arn,
        kmsKeyEuWest1.arn,
        buildLogGroup.arn,
        testLogGroup.arn
    ]).apply(([
        artifactBucketUsArn,
        artifactBucketEuArn,
        ecrUsArn,
        ecrEuArn,
        kmsUsArn,
        kmsEuArn,
        buildLogArn,
        testLogArn
    ]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                Resource: [
                    `${buildLogArn}:*`,
                    `${testLogArn}:*`
                ]
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                ],
                Resource: [
                    `${artifactBucketUsArn}/*`,
                    `${artifactBucketEuArn}/*`
                ]
            },
            {
                Effect: "Allow",
                Action: [
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:CompleteLayerUpload",
                    "ecr:GetAuthorizationToken",
                    "ecr:InitiateLayerUpload",
                    "ecr:PutImage",
                    "ecr:UploadLayerPart",
                    "ecr:BatchGetImage",
                    "ecr:GetDownloadUrlForLayer"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                Resource: [kmsUsArn, kmsEuArn]
            }
        ]
    }))
});

// GitHub Connection
const githubConnection = new aws.codestarconnections.Connection("github-connection", {
    name: `${appName}-github-connection`,
    providerType: "GitHub",
    tags: commonTags
});

// CodeBuild Projects
const buildProject = new aws.codebuild.Project("build-project", {
    name: `${appName}-build`,
    description: "Build and push Docker image",
    serviceRole: codeBuildRole.arn,
    artifacts: {
        type: "CODEPIPELINE"
    },
    environment: {
        computeType: "BUILD_GENERAL1_SMALL",
        image: "aws/codebuild/standard:5.0",
        type: "LINUX_CONTAINER",
        imagePullCredentialsType: "CODEBUILD",
        privilegedMode: true,
        environmentVariables: [
            {
                name: "AWS_DEFAULT_REGION",
                value: "us-east-1"
            },
            {
                name: "AWS_ACCOUNT_ID",
                value: current.then(c => c.accountId)
            },
            {
                name: "IMAGE_REPO_NAME_US",
                value: ecrRepoUsEast1.name
            },
            {
                name: "IMAGE_REPO_NAME_EU",
                value: ecrRepoEuWest1.name
            },
            {
                name: "IMAGE_TAG",
                value: "latest"
            }
        ]
    },
    source: {
        type: "CODEPIPELINE",
        buildspec: `version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
      - aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=$\{COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME_US:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME_US:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$IMAGE_REPO_NAME_US:$IMAGE_TAG
      - docker tag $IMAGE_REPO_NAME_US:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/$IMAGE_REPO_NAME_EU:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker image to us-east-1...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$IMAGE_REPO_NAME_US:$IMAGE_TAG
      - echo Pushing the Docker image to eu-west-1...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/$IMAGE_REPO_NAME_EU:$IMAGE_TAG
      - printf '[{"name":"${dockerImageName}","imageUri":"%s"}]' $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/$IMAGE_REPO_NAME_US:$IMAGE_TAG > imagedefinitions-us.json
      - printf '[{"name":"${dockerImageName}","imageUri":"%s"}]' $AWS_ACCOUNT_ID.dkr.ecr.eu-west-1.amazonaws.com/$IMAGE_REPO_NAME_EU:$IMAGE_TAG > imagedefinitions-eu.json
artifacts:
  files:
    - imagedefinitions-us.json
    - imagedefinitions-eu.json
    - '**/*'
  name: BuildArtifact`
    },
    logsConfig: {
        cloudwatchLogs: {
            groupName: buildLogGroup.name,
            streamName: `${appName}-build-stream`
        }
    },
    encryptionKey: kmsKeyUsEast1.arn,
    tags: commonTags
}, { provider: usEast1Provider });

const testProject = new aws.codebuild.Project("test-project", {
    name: `${appName}-test`,
    description: "Run tests and security scans",
    serviceRole: codeBuildRole.arn,
    artifacts: {
        type: "CODEPIPELINE"
    },
    environment: {
        computeType: "BUILD_GENERAL1_SMALL",
        image: "aws/codebuild/standard:5.0",
        type: "LINUX_CONTAINER",
        imagePullCredentialsType: "CODEBUILD"
    },
    source: {
        type: "CODEPIPELINE",
        buildspec: `version: 0.2
phases:
  install:
    runtime-versions:
      nodejs: 14
      python: 3.9
    commands:
      - pip install checkov
      - npm install -g snyk
  pre_build:
    commands:
      - echo Running security scans...
      - checkov -d . --framework dockerfile --output json > checkov-results.json || true
  build:
    commands:
      - echo Running unit tests...
      - npm test
      - echo Running integration tests...
      - npm run test:integration
      - echo Running security analysis...
      - snyk test --severity-threshold=high || true
  post_build:
    commands:
      - echo All tests completed
reports:
  SecurityReport:
    files:
      - checkov-results.json
    file-format: JSON`
    },
    logsConfig: {
        cloudwatchLogs: {
            groupName: testLogGroup.name,
            streamName: `${appName}-test-stream`
        }
    },
    encryptionKey: kmsKeyUsEast1.arn,
    tags: commonTags
}, { provider: usEast1Provider });

// SNS Topics for notifications
const pipelineTopic = new aws.sns.Topic("pipeline-notifications", {
    name: `${appName}-pipeline-notifications`,
    kmsMasterKeyId: kmsKeyUsEast1.arn,
    tags: commonTags
}, { provider: usEast1Provider });

const approvalTopic = new aws.sns.Topic("approval-notifications", {
    name: `${appName}-approval-notifications`,
    kmsMasterKeyId: kmsKeyUsEast1.arn,
    tags: commonTags
}, { provider: usEast1Provider });

// SNS Topic Subscriptions
const pipelineEmailSubscription = new aws.sns.TopicSubscription("pipeline-email", {
    topic: pipelineTopic.arn,
    protocol: "email",
    endpoint: notificationEmail
}, { provider: usEast1Provider });

const approvalEmailSubscription = new aws.sns.TopicSubscription("approval-email", {
    topic: approvalTopic.arn,
    protocol: "email",
    endpoint: notificationEmail
}, { provider: usEast1Provider });

// VPC and Networking for ECS (both regions)
const vpcUsEast1 = new aws.ec2.Vpc("vpc-us-east-1", {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: { ...commonTags, Name: `${appName}-vpc-us-east-1`, Region: "us-east-1" }
}, { provider: usEast1Provider });

const vpcEuWest1 = new aws.ec2.Vpc("vpc-eu-west-1", {
    cidrBlock: "10.1.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: { ...commonTags, Name: `${appName}-vpc-eu-west-1`, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// Subnets for us-east-1
const publicSubnetUsEast1a = new aws.ec2.Subnet("public-subnet-us-east-1a", {
    vpcId: vpcUsEast1.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: "us-east-1a",
    mapPublicIpOnLaunch: true,
    tags: { ...commonTags, Name: `${appName}-public-subnet-us-east-1a` }
}, { provider: usEast1Provider });

const publicSubnetUsEast1b = new aws.ec2.Subnet("public-subnet-us-east-1b", {
    vpcId: vpcUsEast1.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: "us-east-1b",
    mapPublicIpOnLaunch: true,
    tags: { ...commonTags, Name: `${appName}-public-subnet-us-east-1b` }
}, { provider: usEast1Provider });

// Subnets for eu-west-1
const publicSubnetEuWest1a = new aws.ec2.Subnet("public-subnet-eu-west-1a", {
    vpcId: vpcEuWest1.id,
    cidrBlock: "10.1.1.0/24",
    availabilityZone: "eu-west-1a",
    mapPublicIpOnLaunch: true,
    tags: { ...commonTags, Name: `${appName}-public-subnet-eu-west-1a` }
}, { provider: euWest1Provider });

const publicSubnetEuWest1b = new aws.ec2.Subnet("public-subnet-eu-west-1b", {
    vpcId: vpcEuWest1.id,
    cidrBlock: "10.1.2.0/24",
    availabilityZone: "eu-west-1b",
    mapPublicIpOnLaunch: true,
    tags: { ...commonTags, Name: `${appName}-public-subnet-eu-west-1b` }
}, { provider: euWest1Provider });

// Internet Gateways
const igwUsEast1 = new aws.ec2.InternetGateway("igw-us-east-1", {
    vpcId: vpcUsEast1.id,
    tags: { ...commonTags, Name: `${appName}-igw-us-east-1` }
}, { provider: usEast1Provider });

const igwEuWest1 = new aws.ec2.InternetGateway("igw-eu-west-1", {
    vpcId: vpcEuWest1.id,
    tags: { ...commonTags, Name: `${appName}-igw-eu-west-1` }
}, { provider: euWest1Provider });

// Route Tables and Routes
const publicRouteTableUsEast1 = new aws.ec2.RouteTable("public-rt-us-east-1", {
    vpcId: vpcUsEast1.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igwUsEast1.id
    }],
    tags: { ...commonTags, Name: `${appName}-public-rt-us-east-1` }
}, { provider: usEast1Provider });

const publicRouteTableEuWest1 = new aws.ec2.RouteTable("public-rt-eu-west-1", {
    vpcId: vpcEuWest1.id,
    routes: [{
        cidrBlock: "0.0.0.0/0",
        gatewayId: igwEuWest1.id
    }],
    tags: { ...commonTags, Name: `${appName}-public-rt-eu-west-1` }
}, { provider: euWest1Provider });

// Route Table Associations for us-east-1
const rtaPublicUsEast1a = new aws.ec2.RouteTableAssociation("rta-public-us-east-1a", {
    subnetId: publicSubnetUsEast1a.id,
    routeTableId: publicRouteTableUsEast1.id
}, { provider: usEast1Provider });

const rtaPublicUsEast1b = new aws.ec2.RouteTableAssociation("rta-public-us-east-1b", {
    subnetId: publicSubnetUsEast1b.id,
    routeTableId: publicRouteTableUsEast1.id
}, { provider: usEast1Provider });

// Route Table Associations for eu-west-1
const rtaPublicEuWest1a = new aws.ec2.RouteTableAssociation("rta-public-eu-west-1a", {
    subnetId: publicSubnetEuWest1a.id,
    routeTableId: publicRouteTableEuWest1.id
}, { provider: euWest1Provider });

const rtaPublicEuWest1b = new aws.ec2.RouteTableAssociation("rta-public-eu-west-1b", {
    subnetId: publicSubnetEuWest1b.id,
    routeTableId: publicRouteTableEuWest1.id
}, { provider: euWest1Provider });

// Security Groups for ALB and ECS
const albSgUsEast1 = new aws.ec2.SecurityGroup("alb-sg-us-east-1", {
    vpcId: vpcUsEast1.id,
    description: "Security group for ALB",
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    tags: { ...commonTags, Name: `${appName}-alb-sg-us-east-1` }
}, { provider: usEast1Provider });

const albSgEuWest1 = new aws.ec2.SecurityGroup("alb-sg-eu-west-1", {
    vpcId: vpcEuWest1.id,
    description: "Security group for ALB",
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    tags: { ...commonTags, Name: `${appName}-alb-sg-eu-west-1` }
}, { provider: euWest1Provider });

const ecsSgUsEast1 = new aws.ec2.SecurityGroup("ecs-sg-us-east-1", {
    vpcId: vpcUsEast1.id,
    description: "Security group for ECS tasks",
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        securityGroups: [albSgUsEast1.id]
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    tags: { ...commonTags, Name: `${appName}-ecs-sg-us-east-1` }
}, { provider: usEast1Provider });

const ecsSgEuWest1 = new aws.ec2.SecurityGroup("ecs-sg-eu-west-1", {
    vpcId: vpcEuWest1.id,
    description: "Security group for ECS tasks",
    ingress: [{
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        securityGroups: [albSgEuWest1.id]
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"]
    }],
    tags: { ...commonTags, Name: `${appName}-ecs-sg-eu-west-1` }
}, { provider: euWest1Provider });

// Application Load Balancers
const albUsEast1 = new aws.lb.LoadBalancer("alb-us-east-1", {
    name: `${appName}-alb-us-east-1`,
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSgUsEast1.id],
    subnets: [publicSubnetUsEast1a.id, publicSubnetUsEast1b.id],
    enableDeletionProtection: false,
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const albEuWest1 = new aws.lb.LoadBalancer("alb-eu-west-1", {
    name: `${appName}-alb-eu-west-1`,
    internal: false,
    loadBalancerType: "application",
    securityGroups: [albSgEuWest1.id],
    subnets: [publicSubnetEuWest1a.id, publicSubnetEuWest1b.id],
    enableDeletionProtection: false,
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// Target Groups
const targetGroupUsEast1 = new aws.lb.TargetGroup("tg-us-east-1", {
    name: `${appName}-tg-us-east-1`,
    port: 80,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpcUsEast1.id,
    healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/health",
        port: "traffic-port",
        protocol: "HTTP",
        timeout: 5,
        unhealthyThreshold: 2
    },
    deregistrationDelay: 30,
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const targetGroupEuWest1 = new aws.lb.TargetGroup("tg-eu-west-1", {
    name: `${appName}-tg-eu-west-1`,
    port: 80,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpcEuWest1.id,
    healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/health",
        port: "traffic-port",
        protocol: "HTTP",
        timeout: 5,
        unhealthyThreshold: 2
    },
    deregistrationDelay: 30,
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// ALB Listeners
const albListenerUsEast1 = new aws.lb.Listener("alb-listener-us-east-1", {
    loadBalancerArn: albUsEast1.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroupUsEast1.arn
    }]
}, { provider: usEast1Provider });

const albListenerEuWest1 = new aws.lb.Listener("alb-listener-eu-west-1", {
    loadBalancerArn: albEuWest1.arn,
    port: 80,
    protocol: "HTTP",
    defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroupEuWest1.arn
    }]
}, { provider: euWest1Provider });

// ECS Clusters
const ecsClusterUsEast1 = new aws.ecs.Cluster("ecs-cluster-us-east-1", {
    name: `${appName}-cluster-us-east-1`,
    capacityProviders: ["FARGATE"],
    settings: [{
        name: "containerInsights",
        value: "enabled"
    }],
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const ecsClusterEuWest1 = new aws.ecs.Cluster("ecs-cluster-eu-west-1", {
    name: `${appName}-cluster-eu-west-1`,
    capacityProviders: ["FARGATE"],
    settings: [{
        name: "containerInsights",
        value: "enabled"
    }],
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// ECS Task Execution Role
const ecsTaskExecutionRole = new aws.iam.Role("ecs-task-execution-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "ecs-tasks.amazonaws.com"
            }
        }]
    }),
    tags: commonTags
});

const ecsTaskExecutionRolePolicy = new aws.iam.RolePolicyAttachment("ecs-task-execution-role-policy", {
    role: ecsTaskExecutionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
});

// Additional ECR permissions for ECS Task Execution Role
const ecsTaskExecutionRoleEcrPolicy = new aws.iam.RolePolicy("ecs-task-execution-role-ecr-policy", {
    role: ecsTaskExecutionRole.id,
    policy: pulumi.all([ecrRepoUsEast1.arn, ecrRepoEuWest1.arn]).apply(([usArn, euArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage"
            ],
            Resource: "*"
        }]
    }))
});

// CloudWatch Log Groups for ECS
const ecsLogGroupUsEast1 = new aws.cloudwatch.LogGroup("ecs-logs-us-east-1", {
    name: `/ecs/${appName}-us-east-1`,
    retentionInDays: 7,
    kmsKeyId: kmsKeyUsEast1.arn,
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const ecsLogGroupEuWest1 = new aws.cloudwatch.LogGroup("ecs-logs-eu-west-1", {
    name: `/ecs/${appName}-eu-west-1`,
    retentionInDays: 7,
    kmsKeyId: kmsKeyEuWest1.arn,
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// ECS Task Definitions
const taskDefinitionUsEast1 = new aws.ecs.TaskDefinition("task-def-us-east-1", {
    family: `${appName}-us-east-1`,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    cpu: "256",
    memory: "512",
    executionRoleArn: ecsTaskExecutionRole.arn,
    containerDefinitions: pulumi.all([ecrRepoUsEast1.repositoryUrl]).apply(([repoUrl]) => JSON.stringify([{
        name: dockerImageName,
        image: `${repoUrl}:latest`,
        portMappings: [{
            containerPort: 80,
            protocol: "tcp"
        }],
        essential: true,
        logConfiguration: {
            logDriver: "awslogs",
            options: {
                "awslogs-group": `/ecs/${appName}-us-east-1`,
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "ecs"
            }
        }
    }])),
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const taskDefinitionEuWest1 = new aws.ecs.TaskDefinition("task-def-eu-west-1", {
    family: `${appName}-eu-west-1`,
    networkMode: "awsvpc",
    requiresCompatibilities: ["FARGATE"],
    cpu: "256",
    memory: "512",
    executionRoleArn: ecsTaskExecutionRole.arn,
    containerDefinitions: pulumi.all([ecrRepoEuWest1.repositoryUrl]).apply(([repoUrl]) => JSON.stringify([{
        name: dockerImageName,
        image: `${repoUrl}:latest`,
        portMappings: [{
            containerPort: 80,
            protocol: "tcp"
        }],
        essential: true,
        logConfiguration: {
            logDriver: "awslogs",
            options: {
                "awslogs-group": `/ecs/${appName}-eu-west-1`,
                "awslogs-region": "eu-west-1",
                "awslogs-stream-prefix": "ecs"
            }
        }
    }])),
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// ECS Services
const ecsServiceUsEast1 = new aws.ecs.Service("ecs-service-us-east-1", {
    name: `${appName}-service-us-east-1`,
    cluster: ecsClusterUsEast1.id,
    taskDefinition: taskDefinitionUsEast1.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        assignPublicIp: true,
        subnets: [publicSubnetUsEast1a.id, publicSubnetUsEast1b.id],
        securityGroups: [ecsSgUsEast1.id]
    },
    loadBalancers: [{
        targetGroupArn: targetGroupUsEast1.arn,
        containerName: dockerImageName,
        containerPort: 80
    }],
    healthCheckGracePeriodSeconds: 60,
    deploymentController: {
        type: "CODE_DEPLOY"
    },
    tags: { ...commonTags, Region: "us-east-1" }
}, { 
    provider: usEast1Provider,
    dependsOn: [albListenerUsEast1]
});

const ecsServiceEuWest1 = new aws.ecs.Service("ecs-service-eu-west-1", {
    name: `${appName}-service-eu-west-1`,
    cluster: ecsClusterEuWest1.id,
    taskDefinition: taskDefinitionEuWest1.arn,
    desiredCount: 2,
    launchType: "FARGATE",
    networkConfiguration: {
        assignPublicIp: true,
        subnets: [publicSubnetEuWest1a.id, publicSubnetEuWest1b.id],
        securityGroups: [ecsSgEuWest1.id]
    },
    loadBalancers: [{
        targetGroupArn: targetGroupEuWest1.arn,
        containerName: dockerImageName,
        containerPort: 80
    }],
    healthCheckGracePeriodSeconds: 60,
    deploymentController: {
        type: "CODE_DEPLOY"
    },
    tags: { ...commonTags, Region: "eu-west-1" }
}, { 
    provider: euWest1Provider,
    dependsOn: [albListenerEuWest1]
});

// Auto Scaling for ECS Services
const autoScalingTargetUsEast1 = new aws.appautoscaling.Target("autoscaling-target-us-east-1", {
    maxCapacity: 10,
    minCapacity: 2,
    resourceId: pulumi.interpolate`service/${ecsClusterUsEast1.name}/${ecsServiceUsEast1.name}`,
    scalableDimension: "ecs:service:DesiredCount",
    serviceNamespace: "ecs"
}, { provider: usEast1Provider });

const autoScalingTargetEuWest1 = new aws.appautoscaling.Target("autoscaling-target-eu-west-1", {
    maxCapacity: 10,
    minCapacity: 2,
    resourceId: pulumi.interpolate`service/${ecsClusterEuWest1.name}/${ecsServiceEuWest1.name}`,
    scalableDimension: "ecs:service:DesiredCount",
    serviceNamespace: "ecs"
}, { provider: euWest1Provider });

// Auto Scaling Policies
const cpuScalingPolicyUsEast1 = new aws.appautoscaling.Policy("cpu-scaling-policy-us-east-1", {
    name: `${appName}-cpu-scaling-us-east-1`,
    policyType: "TargetTrackingScaling",
    resourceId: autoScalingTargetUsEast1.resourceId,
    scalableDimension: autoScalingTargetUsEast1.scalableDimension,
    serviceNamespace: autoScalingTargetUsEast1.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
            predefinedMetricType: "ECSServiceAverageCPUUtilization"
        },
        targetValue: 70
    }
}, { provider: usEast1Provider });

const cpuScalingPolicyEuWest1 = new aws.appautoscaling.Policy("cpu-scaling-policy-eu-west-1", {
    name: `${appName}-cpu-scaling-eu-west-1`,
    policyType: "TargetTrackingScaling",
    resourceId: autoScalingTargetEuWest1.resourceId,
    scalableDimension: autoScalingTargetEuWest1.scalableDimension,
    serviceNamespace: autoScalingTargetEuWest1.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: {
        predefinedMetricSpecification: {
            predefinedMetricType: "ECSServiceAverageCPUUtilization"
        },
        targetValue: 70
    }
}, { provider: euWest1Provider });

// CloudWatch Alarms for monitoring
const serviceHealthAlarmUsEast1 = new aws.cloudwatch.MetricAlarm("service-health-alarm-us-east-1", {
    name: `${appName}-service-health-us-east-1`,
    comparisonOperator: "LessThanThreshold",
    evaluationPeriods: 2,
    metricName: "HealthyHostCount",
    namespace: "AWS/ApplicationELB",
    period: 60,
    statistic: "Average",
    threshold: 1,
    alarmDescription: "This metric monitors ECS service health",
    alarmActions: [pipelineTopic.arn],
    dimensions: {
        TargetGroup: targetGroupUsEast1.arnSuffix,
        LoadBalancer: albUsEast1.arnSuffix
    },
    tags: { ...commonTags, Region: "us-east-1" }
}, { provider: usEast1Provider });

const serviceHealthAlarmEuWest1 = new aws.cloudwatch.MetricAlarm("service-health-alarm-eu-west-1", {
    name: `${appName}-service-health-eu-west-1`,
    comparisonOperator: "LessThanThreshold",
    evaluationPeriods: 2,
    metricName: "HealthyHostCount",
    namespace: "AWS/ApplicationELB",
    period: 60,
    statistic: "Average",
    threshold: 1,
    alarmDescription: "This metric monitors ECS service health",
    alarmActions: [pipelineTopic.arn],
    dimensions: {
        TargetGroup: targetGroupEuWest1.arnSuffix,
        LoadBalancer: albEuWest1.arnSuffix
    },
    tags: { ...commonTags, Region: "eu-west-1" }
}, { provider: euWest1Provider });

// CodeDeploy Application and Deployment Groups
const codeDeployApp = new aws.codedeploy.Application("codedeploy-app", {
    name: `${appName}-app`,
    computePlatform: "ECS",
    tags: commonTags
});

// CodeDeploy Role
const codeDeployRole = new aws.iam.Role("codedeploy-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "codedeploy.amazonaws.com"
            }
        }]
    }),
    tags: commonTags
});

const codeDeployRolePolicy = new aws.iam.RolePolicyAttachment("codedeploy-role-policy", {
    role: codeDeployRole.name,
    policyArn: "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
});

// Target Groups for Blue/Green deployment
const targetGroupBlueUsEast1 = new aws.lb.TargetGroup("tg-blue-us-east-1", {
    name: `${appName}-tg-blue-us-east-1`,
    port: 80,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpcUsEast1.id,
    healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/health",
        timeout: 5,
        unhealthyThreshold: 2
    },
    tags: { ...commonTags, Region: "us-east-1", Type: "Blue" }
}, { provider: usEast1Provider });

const targetGroupGreenUsEast1 = new aws.lb.TargetGroup("tg-green-us-east-1", {
    name: `${appName}-tg-green-us-east-1`,
    port: 80,
    protocol: "HTTP",
    targetType: "ip",
    vpcId: vpcUsEast1.id,
    healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: "200",
        path: "/health",
        timeout: 5,
        unhealthyThreshold: 2
    },
    tags: { ...commonTags, Region: "us-east-1", Type: "Green" }
}, { provider: usEast1Provider });

// CodeDeploy Deployment Groups
const deploymentGroupUsEast1 = new aws.codedeploy.DeploymentGroup("deployment-group-us-east-1", {
    appName: codeDeployApp.name,
    deploymentGroupName: `${appName}-dg-us-east-1`,
    serviceRoleArn: codeDeployRole.arn,
    deploymentConfigName: "CodeDeployDefault.ECSAllAtOnce",
    autoRollbackConfiguration: {
        enabled: true,
        events: ["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
    },
    blueGreenDeploymentConfig: {
        terminateBlueInstancesOnDeploymentSuccess: {
            action: "TERMINATE",
            terminationWaitTimeInMinutes: 5
        },
        deploymentReadyOption: {
            actionOnTimeout: "CONTINUE_DEPLOYMENT"
        },
        greenFleetProvisioningOption: {
            action: "COPY_AUTO_SCALING_GROUP"
        }
    },
    ecsService: {
        clusterName: ecsClusterUsEast1.name,
        serviceName: ecsServiceUsEast1.name
    },
    loadBalancerInfo: {
        targetGroupPairInfos: [{
            prodTrafficRoute: {
                listenerArns: [albListenerUsEast1.arn]
            },
            targetGroups: [
                { name: targetGroupBlueUsEast1.name },
                { name: targetGroupGreenUsEast1.name }
            ]
        }]
    },
    alarmConfiguration: {
        alarms: [serviceHealthAlarmUsEast1.name],
        enabled: true
    },
    tags: commonTags
}, { provider: usEast1Provider });

// CloudTrail for auditing
const cloudTrailBucket = new aws.s3.Bucket("cloudtrail-bucket", {
    acl: "private",
    versioning: {
        enabled: true
    },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "aws:kms",
                kmsMasterKeyId: kmsKeyUsEast1.arn
            }
        }
    },
    lifecycleRules: [{
        enabled: true,
        noncurrentVersionExpiration: {
            days: 90
        }
    }],
    tags: { ...commonTags, Purpose: "CloudTrail" }
}, { provider: usEast1Provider });

const cloudTrailBucketPolicy = new aws.s3.BucketPolicy("cloudtrail-bucket-policy", {
    bucket: cloudTrailBucket.id,
    policy: pulumi.all([cloudTrailBucket.arn, current]).apply(([bucketArn, account]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "AWSCloudTrailAclCheck",
                Effect: "Allow",
                Principal: {
                    Service: "cloudtrail.amazonaws.com"
                },
                Action: "s3:GetBucketAcl",
                Resource: bucketArn
            },
            {
                Sid: "AWSCloudTrailWrite",
                Effect: "Allow",
                Principal: {
                    Service: "cloudtrail.amazonaws.com"
                },
                Action: "s3:PutObject",
                Resource: `${bucketArn}/*`,
                Condition: {
                    StringEquals: {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            }
        ]
    }))
}, { provider: usEast1Provider });

const cloudTrail = new aws.cloudtrail.Trail("pipeline-trail", {
    name: `${appName}-pipeline-trail`,
    s3BucketName: cloudTrailBucket.id,
    includeGlobalServiceEvents: true,
    isMultiRegionTrail: true,
    enableLogFileValidation: true,
    eventSelectors: [{
        readWriteType: "All",
        includeManagementEvents: true,
        dataResources: [{
            type: "AWS::CodePipeline::Pipeline",
            values: ["arn:aws:codepipeline:*:*:*"]
        }]
    }],
    kmsKeyId: kmsKeyUsEast1.arn,
    tags: commonTags
}, { 
    provider: usEast1Provider,
    dependsOn: [cloudTrailBucketPolicy]
});

// CodePipeline IAM Role
const codePipelineRole = new aws.iam.Role("codepipeline-role", {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "codepipeline.amazonaws.com"
            }
        }]
    }),
    tags: commonTags
});

const codePipelinePolicy = new aws.iam.RolePolicy("codepipeline-policy", {
    role: codePipelineRole.id,
    policy: pulumi.all([
        artifactBucketUsEast1.arn,
        artifactBucketEuWest1.arn,
        kmsKeyUsEast1.arn,
        kmsKeyEuWest1.arn,
        buildProject.name,
        testProject.name,
        codeDeployApp.name
    ]).apply(([
        artifactUsArn,
        artifactEuArn,
        kmsUsArn,
        kmsEuArn,
        buildName,
        testName,
        deployAppName
    ]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                Resource: [
                    `${artifactUsArn}/*`,
                    `${artifactEuArn}/*`
                ]
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:GetBucketLocation",
                    "s3:GetBucketVersioning",
                    "s3:ListBucket"
                ],
                Resource: [artifactUsArn, artifactEuArn]
            },
            {
                Effect: "Allow",
                Action: [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild"
                ],
                Resource: [
                    `arn:aws:codebuild:*:*:project/${buildName}`,
                    `arn:aws:codebuild:*:*:project/${testName}`
                ]
            },
            {
                Effect: "Allow",
                Action: [
                    "codedeploy:CreateDeployment",
                    "codedeploy:GetApplication",
                    "codedeploy:GetApplicationRevision",
                    "codedeploy:GetDeployment",
                    "codedeploy:GetDeploymentConfig",
                    "codedeploy:RegisterApplicationRevision"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "ecs:*",
                    "iam:PassRole"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                Resource: [kmsUsArn, kmsEuArn]
            },
            {
                Effect: "Allow",
                Action: [
                    "sns:Publish"
                ],
                Resource: "*"
            },
            {
                Effect: "Allow",
                Action: [
                    "codestar-connections:UseConnection"
                ],
                Resource: "*"
            }
        ]
    }))
});

// CodePipeline
const pipeline = new aws.codepipeline.Pipeline("cicd-pipeline", {
    name: `${appName}-pipeline`,
    roleArn: codePipelineRole.arn,
    artifactStore: {
        type: "S3",
        location: artifactBucketUsEast1.bucket,
        encryptionKey: {
            id: kmsKeyUsEast1.arn,
            type: "KMS"
        }
    },
    stages: [
        {
            name: "Source",
            actions: [{
                name: "Source",
                category: "Source",
                owner: "AWS",
                provider: "CodeStarSourceConnection",
                version: "1",
                outputArtifacts: ["source_output"],
                configuration: {
                    ConnectionArn: githubConnection.arn,
                    FullRepositoryId: `${githubOwner}/${githubRepo}`,
                    BranchName: githubBranch,
                    OutputArtifactFormat: "CODEBUILD_CLONE_REF"
                }
            }]
        },
        {
            name: "Build",
            actions: [{
                name: "Build",
                category: "Build",
                owner: "AWS",
                provider: "CodeBuild",
                version: "1",
                inputArtifacts: ["source_output"],
                outputArtifacts: ["build_output"],
                configuration: {
                    ProjectName: buildProject.name
                }
            }]
        },
        {
            name: "Test",
            actions: [{
                name: "Test",
                category: "Test",
                owner: "AWS",
                provider: "CodeBuild",
                version: "1",
                inputArtifacts: ["build_output"],
                outputArtifacts: ["test_output"],
                configuration: {
                    ProjectName: testProject.name
                }
            }]
        },
        {
            name: "Approval",
            actions: [{
                name: "ManualApproval",
                category: "Approval",
                owner: "AWS",
                provider: "Manual",
                version: "1",
                configuration: {
                    NotificationArn: approvalTopic.arn,
                    CustomData: "Please review test results and approve deployment to production"
                }
            }]
        },
        {
            name: "Deploy-US-East-1",
            actions: [{
                name: "Deploy-US-East-1",
                category: "Deploy",
                owner: "AWS",
                provider: "CodeDeployToECS",
                version: "1",
                inputArtifacts: ["build_output"],
                configuration: {
                    ApplicationName: codeDeployApp.name,
                    DeploymentGroupName: deploymentGroupUsEast1.deploymentGroupName,
                    TaskDefinitionTemplateArtifact: "build_output",
                    TaskDefinitionTemplatePath: "taskdef.json",
                    AppSpecTemplateArtifact: "build_output",
                    AppSpecTemplatePath: "appspec.yaml",
                    Image1ArtifactName: "build_output",
                    Image1ContainerName: "IMAGE1_NAME"
                },
                region: "us-east-1"
            }]
        },
        {
            name: "Deploy-EU-West-1",
            actions: [{
                name: "Deploy-EU-West-1",
                category: "Deploy", 
                owner: "AWS",
                provider: "ECS",
                version: "1",
                inputArtifacts: ["build_output"],
                configuration: {
                    ClusterName: ecsClusterEuWest1.name,
                    ServiceName: ecsServiceEuWest1.name,
                    FileName: "imagedefinitions-eu.json"
                },
                region: "eu-west-1"
            }]
        }
    ],
    tags: commonTags
}, { provider: usEast1Provider });

// EventBridge rule for pipeline notifications
const pipelineEventRule = new aws.cloudwatch.EventRule("pipeline-event-rule", {
    name: `${appName}-pipeline-events`,
    description: "Capture all CodePipeline events",
    eventPattern: JSON.stringify({
        source: ["aws.codepipeline"],
        detailType: [
            "CodePipeline Pipeline Execution State Change",
            "CodePipeline Stage Execution State Change",
            "CodePipeline Action Execution State Change"
        ],
        detail: {
            pipeline: [pipeline.name]
        }
    }),
    tags: commonTags
}, { provider: usEast1Provider });

const pipelineEventTarget = new aws.cloudwatch.EventTarget("pipeline-event-target", {
    rule: pipelineEventRule.name,
    arn: pipelineTopic.arn
}, { provider: usEast1Provider });

// SNS topic policy to allow EventBridge
const pipelineTopicPolicy = new aws.sns.TopicPolicy("pipeline-topic-policy", {
    arn: pipelineTopic.arn,
    policy: pulumi.all([pipelineTopic.arn]).apply(([topicArn]) => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: {
                Service: "events.amazonaws.com"
            },
            Action: "sns:Publish",
            Resource: topicArn
        }]
    }))
}, { provider: usEast1Provider });

// Outputs
export const pipelineArn = pipeline.arn;
export const pipelineName = pipeline.name;
export const ecrRepoUrlUsEast1 = ecrRepoUsEast1.repositoryUrl;
export const ecrRepoUrlEuWest1 = ecrRepoEuWest1.repositoryUrl;
export const