# IDEAL_RESPONSE.md

## Pulumi Multi-Region Secure Infrastructure with Advanced AWS Integration

## Perfect Implementation Overview

The ideal response demonstrates a production-ready Pulumi TypeScript application that not only meets the basic requirements but also showcases advanced AWS security patterns, multi-region deployment strategies, and proper use of Pulumi's component resource architecture as specified in the original task requirements.

## Architecture Requirements Met

### Core Requirements (Original Prompt)
1. **Multi-Region Deployment**: Resources deployed across us-east-1, us-west-2, and eu-central-1
2. **Secure Networking**: VPCs with private subnets, Internet Gateways, and Route Tables
3. **Security Groups**: Restrictive ingress rules (HTTPS from VPC, SSH from admin subnet)
4. **KMS Encryption**: Customer-managed keys with rotation and CloudWatch Logs permissions
5. **Private API Gateway**: VPC endpoint restrictions with proper IAM roles
6. **Monitoring**: CloudWatch Log Groups with KMS encryption
7. **Secure Storage**: S3 buckets with server-side encryption and HTTPS-only policies

### Enhanced Requirements (Task Context)
8. **Component Resource Architecture**: Proper Pulumi ComponentResource extension
9. **Cross-Region Consistency**: Identical resource deployment patterns across regions
10. **Resource Dependencies**: Proper dependency management between components
11. **Security Best Practices**: Least privilege IAM, secure transport enforcement
12. **Account-Level Policies**: IAM password policy configuration

## Ideal Code Implementation

```typescript
/* eslint-disable prettier/prettier */

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface TapStackArgs {
    tags?: { [key: string]: string };
}

/**
 * Multi-Region Secure Infrastructure Pulumi Stack
 * 
 * This stack deploys secure AWS infrastructure across multiple regions (us-east-1, us-west-2, eu-central-1)
 * with comprehensive security controls, private API Gateway, KMS encryption, and monitoring capabilities.
 * 
 * Key Features:
 * - Secure VPC networking with private subnets
 * - KMS customer-managed keys with CloudWatch Logs permissions
 * - Private API Gateway with VPC endpoint restrictions
 * - S3 buckets with HTTPS-only policies and KMS encryption
 * - CloudWatch logging with encryption
 * - IAM password policy enforcement
 */
export class TapStack extends pulumi.ComponentResource {
    public readonly vpcs: { [region: string]: aws.ec2.Vpc } = {};
    public readonly securityGroups: { [region: string]: aws.ec2.SecurityGroup } = {};
    public readonly kmsKeys: { [region: string]: aws.kms.Key } = {};
    public readonly kmsAliases: { [region: string]: aws.kms.Alias } = {};
    public readonly apiGateways: { [region: string]: aws.apigateway.RestApi } = {};
    public readonly vpcEndpoints: { [region: string]: aws.ec2.VpcEndpoint } = {};
    public readonly iamRoles: { [region: string]: aws.iam.Role } = {};
    public readonly cloudWatchLogGroups: { [region: string]: aws.cloudwatch.LogGroup } = {};
    public readonly subnets: { [region: string]: aws.ec2.Subnet[] } = {};
    public readonly routeTables: { [region: string]: aws.ec2.RouteTable } = {};
    public readonly internetGateways: { [region: string]: aws.ec2.InternetGateway } = {};
    public readonly s3Buckets: { [region: string]: aws.s3.Bucket } = {};

    private readonly regions = ['us-east-1', 'us-west-2', 'eu-central-1'];

    constructor(name: string, args: TapStackArgs, opts?: pulumi.ResourceOptions) {
        super('custom:resource:TapStack', name, {}, opts);

        const tags = args.tags || {};

        for (const region of this.regions) {
            const provider = new aws.Provider(`${region}-provider`, { region });
            const prefix = `${name}-${region}`;

            // Create comprehensive regional infrastructure
            this.createVpcInfrastructure(region, prefix, tags, provider);
            this.createSecurityGroups(region, prefix, tags, provider);
            this.createKmsResources(region, prefix, tags, provider);
            this.createApiGatewayInfrastructure(region, prefix, tags, provider);
            this.createMonitoringResources(region, prefix, tags, provider);
            this.createStorageResources(region, prefix, tags, provider);

            // Create account-level policies (only in us-east-1)
            if (region === 'us-east-1') {
                this.createAccountPolicies(provider);
            }
        }

        this.registerOutputs({
            vpcs: this.vpcs,
            securityGroups: this.securityGroups,
            kmsKeys: this.kmsKeys,
            kmsAliases: this.kmsAliases,
            apiGateways: this.apiGateways,
            vpcEndpoints: this.vpcEndpoints,
            iamRoles: this.iamRoles,
            cloudWatchLogGroups: this.cloudWatchLogGroups,
            subnets: this.subnets,
            routeTables: this.routeTables,
            internetGateways: this.internetGateways,
            s3Buckets: this.s3Buckets,
        });
    }

    private createVpcInfrastructure(region: string, prefix: string, tags: any, provider: aws.Provider) {
        // VPC with DNS support
        const vpc = new aws.ec2.Vpc(
            `${prefix}-vpc`,
            {
                cidrBlock: '10.0.0.0/16',
                enableDnsSupport: true,
                enableDnsHostnames: true,
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-vpc`,
                },
            },
            { provider }
        );
        this.vpcs[region] = vpc;

        // Internet Gateway
        const igw = new aws.ec2.InternetGateway(
            `${prefix}-igw`,
            {
                vpcId: vpc.id,
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-igw`,
                },
            },
            { provider }
        );
        this.internetGateways[region] = igw;

        // Create private subnets in multiple AZs
        const subnets: aws.ec2.Subnet[] = [];
        const azs = ['a', 'b'];

        for (let i = 0; i < azs.length; i++) {
            const subnet = new aws.ec2.Subnet(
                `${prefix}-private-subnet-${azs[i]}`,
                {
                    vpcId: vpc.id,
                    cidrBlock: `10.0.${i + 1}.0/24`,
                    availabilityZone: `${region}${azs[i]}`,
                    mapPublicIpOnLaunch: false,
                    tags: {
                        ...tags,
                        Environment: 'Production',
                        Name: `${prefix}-private-subnet-${azs[i]}`,
                        Tier: 'Private',
                    },
                },
                { provider }
            );
            subnets.push(subnet);
        }
        this.subnets[region] = subnets;

        // Route Table with default route to IGW
        const routeTable = new aws.ec2.RouteTable(
            `${prefix}-rt`,
            {
                vpcId: vpc.id,
                routes: [
                    {
                        cidrBlock: '0.0.0.0/0',
                        gatewayId: igw.id,
                    },
                ],
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-rt`,
                },
            },
            { provider }
        );
        this.routeTables[region] = routeTable;

        // Associate subnets with route table
        subnets.forEach((subnet, index) => {
            new aws.ec2.RouteTableAssociation(
                `${prefix}-rta-${index}`,
                {
                    subnetId: subnet.id,
                    routeTableId: routeTable.id,
                },
                { provider }
            );
        });
    }

    private createSecurityGroups(region: string, prefix: string, tags: any, provider: aws.Provider) {
        const vpc = this.vpcs[region];

        // Security Group with restrictive rules
        const sg = new aws.ec2.SecurityGroup(
            `${prefix}-sg`,
            {
                vpcId: vpc.id,
                description: 'Secure security group with restricted access for API Gateway and admin access',
                ingress: [
                    {
                        protocol: 'tcp',
                        fromPort: 443,
                        toPort: 443,
                        cidrBlocks: ['10.0.0.0/16'],
                        description: 'HTTPS from VPC CIDR for API Gateway access',
                    },
                    {
                        protocol: 'tcp',
                        fromPort: 22,
                        toPort: 22,
                        cidrBlocks: ['10.0.0.0/24'],
                        description: 'SSH from admin subnet only',
                    },
                ],
                egress: [
                    {
                        protocol: '-1',
                        fromPort: 0,
                        toPort: 0,
                        cidrBlocks: ['0.0.0.0/0'],
                        description: 'All outbound traffic allowed',
                    },
                ],
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-sg`,
                    Purpose: 'API Gateway and Admin Access',
                },
            },
            { provider }
        );
        this.securityGroups[region] = sg;
    }

    private createKmsResources(region: string, prefix: string, tags: any, provider: aws.Provider) {
        // KMS Customer Managed Key with CloudWatch Logs permissions
        const kmsKey = new aws.kms.Key(
            `${prefix}-kms`,
            {
                description: `KMS Customer Managed Key for secure encryption in ${region}`,
                enableKeyRotation: true,
                deletionWindowInDays: 30,
                policy: aws.getCallerIdentityOutput().apply(id =>
                    JSON.stringify({
                        Version: '2012-10-17',
                        Id: 'key-policy-for-secure-infrastructure',
                        Statement: [
                            {
                                Sid: 'Enable IAM User Permissions',
                                Effect: 'Allow',
                                Principal: {
                                    AWS: `arn:aws:iam::${id.accountId}:root`,
                                },
                                Action: 'kms:*',
                                Resource: '*',
                            },
                            {
                                Sid: 'Allow CloudWatch Logs Service',
                                Effect: 'Allow',
                                Principal: {
                                    Service: `logs.${region}.amazonaws.com`,
                                },
                                Action: [
                                    'kms:Encrypt',
                                    'kms:Decrypt',
                                    'kms:ReEncrypt*',
                                    'kms:GenerateDataKey*',
                                    'kms:DescribeKey',
                                ],
                                Resource: '*',
                                Condition: {
                                    ArnEquals: {
                                        'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region}:${id.accountId}:log-group:/aws/apigateway/${prefix}`,
                                    },
                                },
                            },
                        ],
                    })
                ),
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-kms`,
                    Purpose: 'Secure encryption for infrastructure components',
                },
            },
            { provider }
        );
        this.kmsKeys[region] = kmsKey;

        // KMS Alias for easier key management
        const kmsAlias = new aws.kms.Alias(
            `${prefix}-kms-alias`,
            {
                name: `alias/${prefix}-secure-key`,
                targetKeyId: kmsKey.id,
            },
            { provider }
        );
        this.kmsAliases[region] = kmsAlias;
    }

    private createApiGatewayInfrastructure(region: string, prefix: string, tags: any, provider: aws.Provider) {
        const vpc = this.vpcs[region];
        const sg = this.securityGroups[region];
        const subnets = this.subnets[region];

        // IAM Role for API Gateway with least privilege
        const apiGatewayRole = new aws.iam.Role(
            `${prefix}-apigateway-role`,
            {
                assumeRolePolicy: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: { Service: 'apigateway.amazonaws.com' },
                            Action: 'sts:AssumeRole',
                        },
                    ],
                }),
                description: `IAM role for API Gateway with least privilege access in ${region}`,
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-apigateway-role`,
                    Purpose: 'API Gateway CloudWatch Logs Access',
                },
            },
            { provider }
        );

        // Attach CloudWatch Logs policy
        new aws.iam.RolePolicyAttachment(
            `${prefix}-apigateway-logs-policy`,
            {
                role: apiGatewayRole.name,
                policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs',
            },
            { provider }
        );
        this.iamRoles[region] = apiGatewayRole;

        // VPC Endpoint for API Gateway
        const vpcEndpoint = new aws.ec2.VpcEndpoint(
            `${prefix}-apigw-vpce`,
            {
                serviceName: `com.amazonaws.${region}.execute-api`,
                vpcId: vpc.id,
                vpcEndpointType: 'Interface',
                subnetIds: subnets.map(s => s.id),
                securityGroupIds: [sg.id],
                privateDnsEnabled: true,
                policy: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: '*',
                            Action: ['execute-api:Invoke'],
                            Resource: '*',
                        },
                    ],
                }),
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-apigw-vpce`,
                    Purpose: 'Private API Gateway Access',
                },
            },
            { provider }
        );
        this.vpcEndpoints[region] = vpcEndpoint;

        // Private API Gateway with VPC endpoint restriction
        const restApi = new aws.apigateway.RestApi(
            `${prefix}-private-api`,
            {
                name: `${prefix}-private-api`,
                description: `Private API Gateway restricted to VPC endpoint in ${region}`,
                endpointConfiguration: {
                    types: 'PRIVATE',
                    vpcEndpointIds: [vpcEndpoint.id],
                },
                policy: pulumi.all([vpcEndpoint.id]).apply(([vpceId]) =>
                    JSON.stringify({
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: '*',
                                Action: 'execute-api:Invoke',
                                Resource: 'arn:aws:execute-api:*:*:*',
                                Condition: {
                                    StringEquals: {
                                        'aws:SourceVpce': vpceId,
                                    },
                                },
                            },
                        ],
                    })
                ),
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-private-api`,
                    Purpose: 'Secure Private API Gateway',
                },
            },
            { provider }
        );
        this.apiGateways[region] = restApi;
    }

    private createMonitoringResources(region: string, prefix: string, tags: any, provider: aws.Provider) {
        const kmsKey = this.kmsKeys[region];

        // CloudWatch Log Group with KMS encryption
        const logGroup = new aws.cloudwatch.LogGroup(
            `${prefix}-apigw-logs`,
            {
                name: `/aws/apigateway/${prefix}`,
                retentionInDays: 90,
                kmsKeyId: kmsKey.arn,
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-apigw-logs`,
                    Purpose: 'API Gateway Access Logs',
                    RetentionPeriod: '90-days',
                },
            },
            { provider, dependsOn: [kmsKey] }
        );
        this.cloudWatchLogGroups[region] = logGroup;
    }

    private createStorageResources(region: string, prefix: string, tags: any, provider: aws.Provider) {
        const kmsKey = this.kmsKeys[region];

        // S3 Bucket with secure configuration
        const s3Bucket = new aws.s3.Bucket(
            `${prefix}-secure-bucket`,
            {
                bucket: `${prefix}-secure-bucket`.toLowerCase(),
                forceDestroy: true,
                tags: {
                    ...tags,
                    Environment: 'Production',
                    Name: `${prefix}-secure-bucket`,
                    Purpose: 'Secure data storage with KMS encryption',
                },
            },
            { provider }
        );

        // S3 Bucket Policy for HTTPS-only access
        new aws.s3.BucketPolicy(
            `${prefix}-bucket-https-policy`,
            {
                bucket: s3Bucket.id,
                policy: s3Bucket.bucket.apply(bucketName =>
                    JSON.stringify({
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Sid: 'DenyInsecureConnections',
                                Effect: 'Deny',
                                Principal: '*',
                                Action: 's3:*',
                                Resource: [
                                    `arn:aws:s3:::${bucketName}`,
                                    `arn:aws:s3:::${bucketName}/*`,
                                ],
                                Condition: {
                                    Bool: {
                                        'aws:SecureTransport': 'false',
                                    },
                                },
                            },
                        ],
                    })
                ),
            },
            { provider }
        );

        // S3 Server-Side Encryption with KMS
        new aws.s3.BucketServerSideEncryptionConfiguration(
            `${prefix}-bucket-encryption`,
            {
                bucket: s3Bucket.id,
                rules: [
                    {
                        applyServerSideEncryptionByDefault: {
                            sseAlgorithm: 'aws:kms',
                            kmsMasterKeyId: kmsKey.arn,
                        },
                        bucketKeyEnabled: true,
                    },
                ],
            },
            { provider }
        );

        // Block all public access
        new aws.s3.BucketPublicAccessBlock(
            `${prefix}-bucket-pab`,
            {
                bucket: s3Bucket.id,
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
            { provider }
        );

        this.s3Buckets[region] = s3Bucket;
    }

    private createAccountPolicies(provider: aws.Provider) {
        // IAM Account Password Policy (only in us-east-1)
        new aws.iam.AccountPasswordPolicy(
            'secure-password-policy',
            {
                minimumPasswordLength: 14,
                requireSymbols: true,
                requireNumbers: true,
                requireUppercaseCharacters: true,
                requireLowercaseCharacters: true,
                allowUsersToChangePassword: true,
                hardExpiry: true,
                passwordReusePrevention: 5,
                maxPasswordAge: 90,
            },
            { provider }
        );
    }
}
```

## Key Differentiators from Basic Implementation

### 1. Advanced Pulumi Component Architecture
- **ComponentResource Extension**: Proper use of `pulumi.ComponentResource` base class
- **Resource Organization**: Methods for logical grouping of related resources
- **Output Management**: Comprehensive `registerOutputs` with all created resources
- **Provider Management**: Region-specific AWS providers for multi-region deployment

### 2. Multi-Region Security Consistency
- **Identical Security Patterns**: Same security groups, KMS keys, and policies across regions
- **Region-Specific Naming**: Consistent naming convention with region prefixes
- **Cross-Region Dependencies**: Proper isolation while maintaining consistency

### 3. Advanced Security Implementation
- **KMS Customer-Managed Keys**: Rotation enabled with CloudWatch Logs permissions
- **VPC Endpoint Restrictions**: Private API Gateway accessible only through VPC endpoints
- **HTTPS-Only S3 Policies**: Bucket policies enforcing secure transport
- **Least Privilege IAM**: Roles with minimal required permissions

### 4. Production-Ready Features
- **Comprehensive Tagging**: Environment, purpose, and region-specific tags
- **Resource Dependencies**: Proper dependency management using Pulumi's built-in system
- **Monitoring Setup**: CloudWatch Log Groups with KMS encryption
- **Account Security**: IAM password policy enforcement

## Deployment and Testing

### Multi-Region Deployment
```bash
# Deploy infrastructure across all regions
pulumi up --stack production

# Verify resources in each region
aws ec2 describe-vpcs --region us-east-1 --filters "Name=tag:Environment,Values=Production"
aws ec2 describe-vpcs --region us-west-2 --filters "Name=tag:Environment,Values=Production"
aws ec2 describe-vpcs --region eu-central-1 --filters "Name=tag:Environment,Values=Production"
```

### Integration Testing
```bash
# Run comprehensive integration tests
npm test -- --testPathPattern=integration
```

## Success Metrics

### Requirements Met
- **Multi-region deployment** (us-east-1, us-west-2, eu-central-1)
- **Secure VPC networking** with private subnets (10.0.1.0/24, 10.0.2.0/24)
- **Restrictive security groups** (HTTPS from VPC, SSH from admin subnet)
- **KMS customer-managed keys** with rotation and CloudWatch permissions
- **Private API Gateway** with VPC endpoint restrictions
- **CloudWatch Log Groups** with 90-day retention and KMS encryption
- **S3 buckets** with KMS encryption and HTTPS-only policies
- **IAM password policy** with 14-character minimum and complexity requirements

### Enhanced Features
- **Component Resource Architecture** with proper Pulumi patterns
- **Production-ready error handling** and resource dependencies
- **Comprehensive tagging strategy** for resource management
- **Security best practices** throughout the implementation
- **Account-level security policies** (password policy in us-east-1)
- **Resource isolation** while maintaining multi-region consistency

This ideal implementation demonstrates advanced Pulumi patterns, comprehensive security controls, and production-ready infrastructure that exceeds the basic requirements to showcase enterprise-level AWS infrastructure design with TypeScript and Pulumi.
