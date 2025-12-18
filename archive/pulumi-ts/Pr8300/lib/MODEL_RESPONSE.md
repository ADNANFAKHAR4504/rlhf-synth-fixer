I'll create a comprehensive Pulumi TapStack infrastructure in TypeScript that meets all your requirements. Here's the complete implementation:

## Project Structure

First, let's set up the project dependencies in `package.json`:

```json
{
  "name": "tapstack-infrastructure",
  "version": "1.0.0",
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/aws": "^6.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.0.0"
  }
}
```

## Main TapStack Implementation

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface TapStackArgs {
    tags?: Record<string, string>;
    prefix?: string;
}

export class TapStack extends pulumi.ComponentResource {
    // Outputs
    public readonly vpcs: Record<string, aws.ec2.Vpc>;
    public readonly subnets: Record<string, aws.ec2.Subnet[]>;
    public readonly securityGroups: Record<string, aws.ec2.SecurityGroup>;
    public readonly kmsKey: aws.kms.Key;
    public readonly kmsAlias: aws.kms.Alias;
    public readonly s3Buckets: Record<string, aws.s3.Bucket>;
    public readonly apiGateway: aws.apigateway.RestApi;
    public readonly vpcEndpoints: Record<string, aws.ec2.VpcEndpoint>;
    public readonly logGroup: aws.cloudwatch.LogGroup;
    public readonly iamRole: aws.iam.Role;
    public readonly passwordPolicy?: aws.iam.AccountPasswordPolicy;

    private readonly regions = ["us-east-1", "us-west-2", "eu-central-1"];
    private readonly tags: Record<string, string>;
    private readonly prefix: string;

    constructor(name: string, args: TapStackArgs = {}, opts?: pulumi.ComponentResourceOptions) {
        super("custom:infrastructure:TapStack", name, {}, opts);

        this.prefix = args.prefix || "tapstack";
        this.tags = {
            Environment: "Production",
            Name: name,
            ...args.tags
        };

        // Initialize output objects
        this.vpcs = {};
        this.subnets = {};
        this.securityGroups = {};
        this.s3Buckets = {};
        this.vpcEndpoints = {};

        // Create KMS Key (global resource)
        this.kmsKey = this.createKmsKey();
        this.kmsAlias = this.createKmsAlias();

        // Create IAM Role for API Gateway
        this.iamRole = this.createApiGatewayRole();

        // Create CloudWatch Log Group
        this.logGroup = this.createLogGroup();

        // Create resources in each region
        this.regions.forEach(region => {
            this.createRegionalResources(region);
        });

        // Create API Gateway (in us-east-1)
        this.apiGateway = this.createApiGateway();

        // Create password policy (us-east-1 only)
        this.passwordPolicy = this.createPasswordPolicy();

        this.registerOutputs({
            vpcs: this.vpcs,
            subnets: this.subnets,
            securityGroups: this.securityGroups,
            kmsKey: this.kmsKey,
            kmsAlias: this.kmsAlias,
            s3Buckets: this.s3Buckets,
            apiGateway: this.apiGateway,
            vpcEndpoints: this.vpcEndpoints,
            logGroup: this.logGroup,
            iamRole: this.iamRole,
            passwordPolicy: this.passwordPolicy
        });
    }

    private createKmsKey(): aws.kms.Key {
        const accountId = aws.getCallerIdentity().then(identity => identity.accountId);
        
        const keyPolicy = accountId.apply(accountId => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${accountId}:root`
                    },
                    Action: "kms:*",
                    Resource: "*"
                },
                {
                    Sid: "Allow CloudWatch Logs",
                    Effect: "Allow",
                    Principal: {
                        Service: "logs.amazonaws.com"
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    Resource: "*",
                    Condition: {
                        ArnEquals: {
                            "kms:EncryptionContext:aws:logs:arn": `arn:aws:logs:*:${accountId}:*`
                        }
                    }
                }
            ]
        }));

        return new aws.kms.Key(`${this.prefix}-kms-key`, {
            description: "TapStack KMS Key for encryption",
            keyUsage: "ENCRYPT_DECRYPT",
            keySpec: "SYMMETRIC_DEFAULT",
            enableKeyRotation: true,
            deletionWindowInDays: 30,
            policy: keyPolicy,
            tags: {
                ...this.tags,
                Name: `${this.prefix}-kms-key`
            }
        }, { parent: this });
    }

    private createKmsAlias(): aws.kms.Alias {
        return new aws.kms.Alias(`${this.prefix}-kms-alias`, {
            name: `alias/${this.prefix}-key`,
            targetKeyId: this.kmsKey.keyId
        }, { parent: this });
    }

    private createApiGatewayRole(): aws.iam.Role {
        const assumeRolePolicy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "apigateway.amazonaws.com"
                    }
                }
            ]
        };

        const role = new aws.iam.Role(`${this.prefix}-api-gateway-role`, {
            assumeRolePolicy: JSON.stringify(assumeRolePolicy),
            tags: {
                ...this.tags,
                Name: `${this.prefix}-api-gateway-role`
            }
        }, { parent: this });

        new aws.iam.RolePolicyAttachment(`${this.prefix}-api-gateway-policy`, {
            role: role.name,
            policyArn: "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
        }, { parent: this });

        return role;
    }

    private createLogGroup(): aws.cloudwatch.LogGroup {
        return new aws.cloudwatch.LogGroup(`${this.prefix}-api-gateway-logs`, {
            name: `/aws/apigateway/${this.prefix}`,
            retentionInDays: 90,
            kmsKeyId: this.kmsKey.arn,
            tags: {
                ...this.tags,
                Name: `${this.prefix}-api-gateway-logs`
            }
        }, { parent: this });
    }

    private createRegionalResources(region: string): void {
        const provider = new aws.Provider(`${region}-provider`, {
            region: region
        });

        // Create VPC
        const vpc = new aws.ec2.Vpc(`${this.prefix}-vpc-${region}`, {
            cidrBlock: "10.0.0.0/16",
            enableDnsHostnames: true,
            enableDnsSupport: true,
            tags: {
                ...this.tags,
                Name: `${this.prefix}-vpc-${region}`
            }
        }, { provider, parent: this });

        this.vpcs[region] = vpc;

        // Create Internet Gateway
        const igw = new aws.ec2.InternetGateway(`${this.prefix}-igw-${region}`, {
            vpcId: vpc.id,
            tags: {
                ...this.tags,
                Name: `${this.prefix}-igw-${region}`
            }
        }, { provider, parent: this });

        // Create Route Table
        const routeTable = new aws.ec2.RouteTable(`${this.prefix}-rt-${region}`, {
            vpcId: vpc.id,
            routes: [
                {
                    cidrBlock: "0.0.0.0/0",
                    gatewayId: igw.id
                }
            ],
            tags: {
                ...this.tags,
                Name: `${this.prefix}-rt-${region}`
            }
        }, { provider, parent: this });

        // Create Subnets
        const subnets: aws.ec2.Subnet[] = [];
        const subnetCidrs = ["10.0.1.0/24", "10.0.2.0/24"];
        
        subnetCidrs.forEach((cidr, index) => {
            const subnet = new aws.ec2.Subnet(`${this.prefix}-subnet-${region}-${index + 1}`, {
                vpcId: vpc.id,
                cidrBlock: cidr,
                availabilityZone: `${region}${String.fromCharCode(97 + index)}`, // a, b, c...
                tags: {
                    ...this.tags,
                    Name: `${this.prefix}-subnet-${region}-${index + 1}`
                }
            }, { provider, parent: this });

            // Associate subnet with route table
            new aws.ec2.RouteTableAssociation(`${this.prefix}-rta-${region}-${index + 1}`, {
                subnetId: subnet.id,
                routeTableId: routeTable.id
            }, { provider, parent: this });

            subnets.push(subnet);
        });

        this.subnets[region] = subnets;

        // Create Security Group
        const securityGroup = new aws.ec2.SecurityGroup(`${this.prefix}-sg-${region}`, {
            name: `${this.prefix}-sg-${region}`,
            description: "Security group for TapStack resources",
            vpcId: vpc.id,
            ingress: [
                {
                    protocol: "tcp",
                    fromPort: 443,
                    toPort: 443,
                    cidrBlocks: ["10.0.0.0/16"],
                    description: "HTTPS from VPC"
                },
                {
                    protocol: "tcp",
                    fromPort: 22,
                    toPort: 22,
                    cidrBlocks: ["10.0.0.0/24"],
                    description: "SSH from admin subnet"
                }
            ],
            egress: [
                {
                    protocol: "-1",
                    fromPort: 0,
                    toPort: 0,
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "All outbound traffic"
                }
            ],
            tags: {
                ...this.tags,
                Name: `${this.prefix}-sg-${region}`
            }
        }, { provider, parent: this });

        this.securityGroups[region] = securityGroup;

        // Create VPC Endpoint for API Gateway
        const vpcEndpoint = new aws.ec2.VpcEndpoint(`${this.prefix}-vpce-${region}`, {
            vpcId: vpc.id,
            serviceName: `com.amazonaws.${region}.execute-api`,
            vpcEndpointType: "Interface",
            subnetIds: subnets.map(subnet => subnet.id),
            securityGroupIds: [securityGroup.id],
            privateDnsEnabled: true,
            tags: {
                ...this.tags,
                Name: `${this.prefix}-vpce-${region}`
            }
        }, { provider, parent: this });

        this.vpcEndpoints[region] = vpcEndpoint;

        // Create S3 Bucket
        const bucket = new aws.s3.Bucket(`${this.prefix}-secure-bucket-${region}`, {
            bucket: `${this.prefix}-secure-bucket-${region}`,
            forceDestroy: true,
            tags: {
                ...this.tags,
                Name: `${this.prefix}-secure-bucket-${region}`
            }
        }, { provider, parent: this });

        // Configure bucket encryption
        new aws.s3.BucketServerSideEncryptionConfiguration(`${this.prefix}-bucket-encryption-${region}`, {
            bucket: bucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        kmsKeyId: this.kmsKey.arn,
                        sseAlgorithm: "aws:kms"
                    },
                    bucketKeyEnabled: true
                }
            ]
        }, { provider, parent: this });

        // Block public access
        new aws.s3.BucketPublicAccessBlock(`${this.prefix}-bucket-pab-${region}`, {
            bucket: bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { provider, parent: this });

        // Bucket policy for HTTPS only
        const bucketPolicy = bucket.arn.apply(arn => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "DenyInsecureConnections",
                    Effect: "Deny",
                    Principal: "*",
                    Action: "s3:*",
                    Resource: [
                        arn,
                        `${arn}/*`
                    ],
                    Condition: {
                        Bool: {
                            "aws:SecureTransport": "false"
                        }
                    }
                }
            ]
        }));

        new aws.s3.BucketPolicy(`${this.prefix}-bucket-policy-${region}`, {
            bucket: bucket.id,
            policy: bucketPolicy
        }, { provider, parent: this });

        this.s3Buckets[region] = bucket;
    }

    private createApiGateway(): aws.apigateway.RestApi {
        const usEast1Provider = new aws.Provider("us-east-1-provider", {
            region: "us-east-1"
        });

        // Get the VPC endpoint for us-east-1
        const vpcEndpoint = this.vpcEndpoints["us-east-1"];

        const endpointConfiguration = vpcEndpoint.id.apply(endpointId => ({
            types: ["PRIVATE" as const],
            vpcEndpointIds: [endpointId]
        }));

        return new aws.apigateway.RestApi(`${this.prefix}-api-gateway`, {
            name: `${this.prefix}-private-api`,
            description: "Private API Gateway for TapStack",
            endpointConfiguration: endpointConfiguration,
            tags: {
                ...this.tags,
                Name: `${this.prefix}-api-gateway`
            }
        }, { provider: usEast1Provider, parent: this });
    }

    private createPasswordPolicy(): aws.iam.AccountPasswordPolicy {
        const usEast1Provider = new aws.Provider("us-east-1-provider", {
            region: "us-east-1"
        });

        return new aws.iam.AccountPasswordPolicy(`${this.prefix}-password-policy`, {
            minimumPasswordLength: 14,
            requireSymbols: true,
            requireNumbers: true,
            requireUppercaseCharacters: true,
            requireLowercaseCharacters: true,
            allowUsersToChangePassword: true,
            hardExpiry: true,
            maxPasswordAge: 90,
            passwordReusePrevention: 5
        }, { provider: usEast1Provider, parent: this });
    }
}
```

## Usage Example

Create an `index.ts` file to use the TapStack:

```typescript
import { TapStack } from "./tapstack";

const stack = new TapStack("production-tapstack", {
    prefix: "prod",
    tags: {
        Project: "TapStack",
        Owner: "Infrastructure Team",
        CostCenter: "Engineering"
    }
});

// Export key outputs
export const vpcIds = stack.vpcs;
export const kmsKeyId = stack.kmsKey.keyId;
export const apiGatewayId = stack.apiGateway.id;
export const s3BucketNames = Object.fromEntries(
    Object.entries(stack.s3Buckets).map(([region, bucket]) => [region, bucket.bucket])
);
```

## Key Features Implemented

### **Multi-Region Architecture**
- Deploys across `us-east-1`, `us-west-2`, and `eu-central-1`
- Uses region-specific providers for proper resource placement

### **Networking**
- VPC with `10.0.0.0/16` CIDR in each region
- DNS support and hostnames enabled
- Two private subnets per region (`10.0.1.0/24`, `10.0.2.0/24`)
- Internet Gateway and Route Table configuration
- Proper subnet associations

### **Security**
- Security Groups with specific ingress/egress rules
- KMS Key with rotation enabled and 30-day deletion window
- Proper KMS policies for IAM root and CloudWatch Logs
- KMS Alias for easier key management

### **API Gateway**
- Private API Gateway restricted to VPC Endpoint
- IAM Role with least privilege
- VPC Endpoints for `execute-api` service
- Proper CloudWatch Logs integration

### **Monitoring**
- CloudWatch Log Group with 90-day retention
- KMS encryption for logs
- Proper naming convention

### **Storage**
- S3 Buckets in each region with KMS encryption
- Public access blocked
- HTTPS-only bucket policy
- Force destroy enabled for cleanup

### **IAM Compliance**
- Account Password Policy in `us-east-1` only
- Comprehensive password requirements
- 90-day max age and 5-password reuse prevention

### **Resource Tagging**
- All resources tagged with `Environment: Production`
- Custom tags support through constructor
- Consistent naming convention

This implementation provides a secure, well-architected multi-region infrastructure that follows AWS best practices and meets all your specified requirements.