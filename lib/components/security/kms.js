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
exports.S3KmsKeyComponent = exports.DatabaseKmsKeyComponent = exports.ApplicationKmsKeyComponent = exports.KmsAliasComponent = exports.KmsKeyComponent = void 0;
exports.createKmsKey = createKmsKey;
exports.createKmsAlias = createKmsAlias;
exports.createApplicationKmsKey = createApplicationKmsKey;
exports.createDatabaseKmsKey = createDatabaseKmsKey;
exports.createS3KmsKey = createS3KmsKey;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class KmsKeyComponent extends pulumi.ComponentResource {
    key;
    keyId;
    keyArn;
    alias;
    constructor(name, args, opts) {
        super("aws:kms:KmsKeyComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        // Default KMS key policy if none provided
        const defaultPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${identity.accountId}:root`,
                    },
                    Action: "kms:*",
                    Resource: "*",
                },
                {
                    Sid: "Allow CloudWatch Logs",
                    Effect: "Allow",
                    Principal: {
                        Service: `logs.${aws.getRegion().then(r => r.name)}.amazonaws.com`,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
            ],
        }));
        // Create key configuration without unsupported properties
        const keyConfig = {
            description: args.description,
            keyUsage: args.keyUsage || "ENCRYPT_DECRYPT",
            // keySpec is not supported in the current provider version - removed
            policy: args.policy || defaultPolicy,
            deletionWindowInDays: args.deletionWindowInDays || 7,
            tags: defaultTags,
        };
        this.key = new aws.kms.Key(`${name}-key`, keyConfig, { parent: this });
        this.keyId = this.key.keyId;
        this.keyArn = this.key.arn;
        this.registerOutputs({
            key: this.key,
            keyId: this.keyId,
            keyArn: this.keyArn,
        });
    }
}
exports.KmsKeyComponent = KmsKeyComponent;
class KmsAliasComponent extends pulumi.ComponentResource {
    alias;
    constructor(name, args, opts) {
        super("aws:kms:KmsAliasComponent", name, {}, opts);
        this.alias = new aws.kms.Alias(`${name}-alias`, {
            name: args.name.startsWith("alias/") ? args.name : `alias/${args.name}`,
            targetKeyId: args.targetKeyId,
        }, { parent: this });
        this.registerOutputs({
            alias: this.alias,
        });
    }
}
exports.KmsAliasComponent = KmsAliasComponent;
class ApplicationKmsKeyComponent extends pulumi.ComponentResource {
    key;
    keyId;
    keyArn;
    alias;
    constructor(name, args, opts) {
        super("aws:kms:ApplicationKmsKeyComponent", name, {}, opts);
        const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity => pulumi.output(aws.getRegion()).apply(region => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${identity.accountId}:root`,
                    },
                    Action: "kms:*",
                    Resource: "*",
                },
                {
                    Sid: "Allow EC2 Service",
                    Effect: "Allow",
                    Principal: {
                        Service: "ec2.amazonaws.com",
                    },
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey*",
                        "kms:ReEncrypt*",
                    ],
                    Resource: "*",
                },
                {
                    Sid: "Allow CloudWatch Logs",
                    Effect: "Allow",
                    Principal: {
                        Service: `logs.${region.name}.amazonaws.com`,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
            ],
        })));
        const keyComponent = new KmsKeyComponent(name, {
            name: args.name,
            description: args.description || "KMS key for application encryption",
            policy: keyPolicy,
            tags: args.tags,
        }, { parent: this });
        this.key = keyComponent.key;
        this.keyId = keyComponent.keyId;
        this.keyArn = keyComponent.keyArn;
        const aliasComponent = new KmsAliasComponent(`${name}-alias`, {
            name: `application-${args.name}`,
            targetKeyId: this.keyId,
        }, { parent: this });
        this.alias = aliasComponent.alias;
        this.registerOutputs({
            key: this.key,
            keyId: this.keyId,
            keyArn: this.keyArn,
            alias: this.alias,
        });
    }
}
exports.ApplicationKmsKeyComponent = ApplicationKmsKeyComponent;
class DatabaseKmsKeyComponent extends pulumi.ComponentResource {
    key;
    keyId;
    keyArn;
    alias;
    constructor(name, args, opts) {
        super("aws:kms:DatabaseKmsKeyComponent", name, {}, opts);
        const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity => pulumi.output(aws.getRegion()).apply(region => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${identity.accountId}:root`,
                    },
                    Action: "kms:*",
                    Resource: "*",
                },
                {
                    Sid: "Allow RDS Service",
                    Effect: "Allow",
                    Principal: {
                        Service: "rds.amazonaws.com",
                    },
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey*",
                        "kms:ReEncrypt*",
                    ],
                    Resource: "*",
                },
                {
                    Sid: "Allow CloudWatch Logs",
                    Effect: "Allow",
                    Principal: {
                        Service: `logs.${region.name}.amazonaws.com`,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
                {
                    Sid: "Allow S3 Service for Backups",
                    Effect: "Allow",
                    Principal: {
                        Service: "s3.amazonaws.com",
                    },
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey*",
                        "kms:ReEncrypt*",
                    ],
                    Resource: "*",
                },
            ],
        })));
        const keyComponent = new KmsKeyComponent(name, {
            name: args.name,
            description: args.description || "KMS key for database encryption",
            policy: keyPolicy,
            tags: args.tags,
        }, { parent: this });
        this.key = keyComponent.key;
        this.keyId = keyComponent.keyId;
        this.keyArn = keyComponent.keyArn;
        const aliasComponent = new KmsAliasComponent(`${name}-alias`, {
            name: `database-${args.name}`,
            targetKeyId: this.keyId,
        }, { parent: this });
        this.alias = aliasComponent.alias;
        this.registerOutputs({
            key: this.key,
            keyId: this.keyId,
            keyArn: this.keyArn,
            alias: this.alias,
        });
    }
}
exports.DatabaseKmsKeyComponent = DatabaseKmsKeyComponent;
class S3KmsKeyComponent extends pulumi.ComponentResource {
    key;
    keyId;
    keyArn;
    alias;
    constructor(name, args, opts) {
        super("aws:kms:S3KmsKeyComponent", name, {}, opts);
        const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity => pulumi.output(aws.getRegion()).apply(region => JSON.stringify({
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "Enable IAM User Permissions",
                    Effect: "Allow",
                    Principal: {
                        AWS: `arn:aws:iam::${identity.accountId}:root`,
                    },
                    Action: "kms:*",
                    Resource: "*",
                },
                {
                    Sid: "Allow S3 Service",
                    Effect: "Allow",
                    Principal: {
                        Service: "s3.amazonaws.com",
                    },
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey*",
                        "kms:ReEncrypt*",
                    ],
                    Resource: "*",
                },
                {
                    Sid: "Allow CloudWatch Logs",
                    Effect: "Allow",
                    Principal: {
                        Service: `logs.${region.name}.amazonaws.com`,
                    },
                    Action: [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey",
                    ],
                    Resource: "*",
                },
                {
                    Sid: "Allow ALB Service for Logs",
                    Effect: "Allow",
                    Principal: {
                        Service: "elasticloadbalancing.amazonaws.com",
                    },
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey*",
                        "kms:ReEncrypt*",
                    ],
                    Resource: "*",
                },
            ],
        })));
        const keyComponent = new KmsKeyComponent(name, {
            name: args.name,
            description: args.description || "KMS key for S3 bucket encryption",
            policy: keyPolicy,
            tags: args.tags,
        }, { parent: this });
        this.key = keyComponent.key;
        this.keyId = keyComponent.keyId;
        this.keyArn = keyComponent.keyArn;
        const aliasComponent = new KmsAliasComponent(`${name}-alias`, {
            name: `s3-${args.name}`,
            targetKeyId: this.keyId,
        }, { parent: this });
        this.alias = aliasComponent.alias;
        this.registerOutputs({
            key: this.key,
            keyId: this.keyId,
            keyArn: this.keyArn,
            alias: this.alias,
        });
    }
}
exports.S3KmsKeyComponent = S3KmsKeyComponent;
function createKmsKey(name, args) {
    const kmsKeyComponent = new KmsKeyComponent(name, args);
    return {
        key: kmsKeyComponent.key,
        keyId: kmsKeyComponent.keyId,
        keyArn: kmsKeyComponent.keyArn,
        alias: kmsKeyComponent.alias,
    };
}
function createKmsAlias(name, args) {
    const aliasComponent = new KmsAliasComponent(name, args);
    return aliasComponent.alias;
}
function createApplicationKmsKey(name, args) {
    const applicationKmsKeyComponent = new ApplicationKmsKeyComponent(name, args);
    return {
        key: applicationKmsKeyComponent.key,
        keyId: applicationKmsKeyComponent.keyId,
        keyArn: applicationKmsKeyComponent.keyArn,
        alias: applicationKmsKeyComponent.alias,
    };
}
function createDatabaseKmsKey(name, args) {
    const databaseKmsKeyComponent = new DatabaseKmsKeyComponent(name, args);
    return {
        key: databaseKmsKeyComponent.key,
        keyId: databaseKmsKeyComponent.keyId,
        keyArn: databaseKmsKeyComponent.keyArn,
        alias: databaseKmsKeyComponent.alias,
    };
}
function createS3KmsKey(name, args) {
    const s3KmsKeyComponent = new S3KmsKeyComponent(name, args);
    return {
        key: s3KmsKeyComponent.key,
        keyId: s3KmsKeyComponent.keyId,
        keyArn: s3KmsKeyComponent.keyArn,
        alias: s3KmsKeyComponent.alias,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia21zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia21zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTBaQSxvQ0FRQztBQUVELHdDQUdDO0FBRUQsMERBUUM7QUFFRCxvREFRQztBQUVELHdDQVFDO0FBcmNELHVEQUF5QztBQUN6QyxpREFBbUM7QUEwQ25DLE1BQWEsZUFBZ0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3pDLEdBQUcsQ0FBYztJQUNqQixLQUFLLENBQXdCO0lBQzdCLE1BQU0sQ0FBd0I7SUFDOUIsS0FBSyxDQUFpQjtJQUV0QyxZQUFZLElBQVksRUFBRSxJQUFnQixFQUFFLElBQXNDO1FBQzlFLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWpELE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNmLENBQUM7UUFFRiwwQ0FBMEM7UUFDMUMsTUFBTSxhQUFhLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDMUYsT0FBTyxFQUFFLFlBQVk7WUFDckIsU0FBUyxFQUFFO2dCQUNQO29CQUNJLEdBQUcsRUFBRSw2QkFBNkI7b0JBQ2xDLE1BQU0sRUFBRSxPQUFPO29CQUNmLFNBQVMsRUFBRTt3QkFDUCxHQUFHLEVBQUUsZ0JBQWdCLFFBQVEsQ0FBQyxTQUFTLE9BQU87cUJBQ2pEO29CQUNELE1BQU0sRUFBRSxPQUFPO29CQUNmLFFB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QUFDLE1BQU07UUFDekMsS0FBSyxFQUFFLDBCQUEwQixDQUFDLEtBQUs7S0FDMUMsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQixvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsSUFBd0I7SUFDdkUsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLHVCQUF1QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN4RSxPQUFPO1FBQ0gsR0FBRyxFQUFFLHVCQUF1QixDQUFDLEdBQUc7UUFDaEMsS0FBSyxFQUFFLHVCQUF1QixDQUFDLEtBQUs7UUFDcEMsTUFBTSxFQUFFLHVCQUF1QixDQUFDLE1BQU07UUFDdEMsS0FBSyxFQUFFLHVCQUF1QixDQUFDLEtBQUs7S0FDdkMsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQixjQUFjLENBQUMsSUFBWSxFQUFFLElBQWtCO0lBQzNELE1BQU0saUJBQWlCLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUQsT0FBTztRQUNILEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxHQUFHO1FBQzFCLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxLQUFLO1FBQzlCLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxNQUFNO1FBQ2hDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxLQUFLO0tBQ2pDLENBQUM7QUFDTixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gXCJAcHVsdW1pL3B1bHVtaVwiO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gXCJAcHVsdW1pL2F3c1wiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEttc0tleUFyZ3Mge1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAga2V5VXNhZ2U/OiBcIkVOQ1JZUFRfREVDUllQVFwiIHwgXCJTSUdOX1ZFUklGWVwiO1xuICAgIGtleVNwZWM/OiBzdHJpbmc7XG4gICAgcG9saWN5PzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgZGVsZXRpb25XaW5kb3dJbkRheXM/OiBudW1iZXI7XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgbmFtZTogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEttc0FsaWFzQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHRhcmdldEtleUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLbXNLZXlSZXN1bHQge1xuICAgIGtleTogYXdzLmttcy5LZXk7XG4gICAga2V5SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBrZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBhbGlhcz86IGF3cy5rbXMuQWxpYXM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbGljYXRpb25LbXNLZXlBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YWJhc2VLbXNLZXlBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUzNLbXNLZXlBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBLbXNLZXlDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBrZXk6IGF3cy5rbXMuS2V5O1xuICAgIHB1YmxpYyByZWFkb25seSBrZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBrZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYWxpYXM/OiBhd3Mua21zLkFsaWFzO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBLbXNLZXlBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czprbXM6S21zS2V5Q29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBEZWZhdWx0IEtNUyBrZXkgcG9saWN5IGlmIG5vbmUgcHJvdmlkZWRcbiAgICAgICAgY29uc3QgZGVmYXVsdFBvbGljeSA9IHB1bHVtaS5vdXRwdXQoYXdzLmdldENhbGxlcklkZW50aXR5KCkpLmFwcGx5KGlkZW50aXR5ID0+IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBTaWQ6IFwiRW5hYmxlIElBTSBVc2VyIFBlcm1pc3Npb25zXCIsXG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2lkZW50aXR5LmFjY291bnRJZH06cm9vdGAsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogXCJrbXM6KlwiLFxuICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogXCIqXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIFNpZDogXCJBbGxvdyBDbG91ZFdhdGNoIExvZ3NcIixcbiAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZTogYGxvZ3MuJHthd3MuZ2V0UmVnaW9uKCkudGhlbihyID0+IHIubmFtZSl9LmFtYXpvbmF3cy5jb21gLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkVuY3J5cHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkRlY3J5cHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOlJlRW5jcnlwdCpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkdlbmVyYXRlRGF0YUtleSpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkRlc2NyaWJlS2V5XCIsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBcIipcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBrZXkgY29uZmlndXJhdGlvbiB3aXRob3V0IHVuc3VwcG9ydGVkIHByb3BlcnRpZXNcbiAgICAgICAgY29uc3Qga2V5Q29uZmlnOiBhd3Mua21zLktleUFyZ3MgPSB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYXJncy5kZXNjcmlwdGlvbixcbiAgICAgICAgICAgIGtleVVzYWdlOiBhcmdzLmtleVVzYWdlIHx8IFwiRU5DUllQVF9ERUNSWVBUXCIsXG4gICAgICAgICAgICAvLyBrZXlTcGVjIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhlIGN1cnJlbnQgcHJvdmlkZXIgdmVyc2lvbiAtIHJlbW92ZWRcbiAgICAgICAgICAgIHBvbGljeTogYXJncy5wb2xpY3kgfHwgZGVmYXVsdFBvbGljeSxcbiAgICAgICAgICAgIGRlbGV0aW9uV2luZG93SW5EYXlzOiBhcmdzLmRlbGV0aW9uV2luZG93SW5EYXlzIHx8IDcsXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmtleSA9IG5ldyBhd3Mua21zLktleShgJHtuYW1lfS1rZXlgLCBrZXlDb25maWcsIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMua2V5SWQgPSB0aGlzLmtleS5rZXlJZDtcbiAgICAgICAgdGhpcy5rZXlBcm4gPSB0aGlzLmtleS5hcm47XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAga2V5OiB0aGlzLmtleSxcbiAgICAgICAgICAgIGtleUlkOiB0aGlzLmtleUlkLFxuICAgICAgICAgICAga2V5QXJuOiB0aGlzLmtleUFybixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgS21zQWxpYXNDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBhbGlhczogYXdzLmttcy5BbGlhcztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogS21zQWxpYXNBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czprbXM6S21zQWxpYXNDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIHRoaXMuYWxpYXMgPSBuZXcgYXdzLmttcy5BbGlhcyhgJHtuYW1lfS1hbGlhc2AsIHtcbiAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZS5zdGFydHNXaXRoKFwiYWxpYXMvXCIpID8gYXJncy5uYW1lIDogYGFsaWFzLyR7YXJncy5uYW1lfWAsXG4gICAgICAgICAgICB0YXJnZXRLZXlJZDogYXJncy50YXJnZXRLZXlJZCxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgYWxpYXM6IHRoaXMuYWxpYXMsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uS21zS2V5Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkga2V5OiBhd3Mua21zLktleTtcbiAgICBwdWJsaWMgcmVhZG9ubHkga2V5SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkga2V5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGFsaWFzOiBhd3Mua21zLkFsaWFzO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBBcHBsaWNhdGlvbkttc0tleUFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmttczpBcHBsaWNhdGlvbkttc0tleUNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3Qga2V5UG9saWN5ID0gcHVsdW1pLm91dHB1dChhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKSkuYXBwbHkoaWRlbnRpdHkgPT4gXG4gICAgICAgICAgICBwdWx1bWkub3V0cHV0KGF3cy5nZXRSZWdpb24oKSkuYXBwbHkocmVnaW9uID0+IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2lkOiBcIkVuYWJsZSBJQU0gVXNlciBQZXJtaXNzaW9uc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBBV1M6IGBhcm46YXdzOmlhbTo6JHtpZGVudGl0eS5hY2NvdW50SWR9OnJvb3RgLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogXCJrbXM6KlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFwiKlwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaWQ6IFwiQWxsb3cgRUMyIFNlcnZpY2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZTogXCJlYzIuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkRlY3J5cHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpEZXNjcmliZUtleVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkVuY3J5cHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpHZW5lcmF0ZURhdGFLZXkqXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6UmVFbmNyeXB0KlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBcIipcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2lkOiBcIkFsbG93IENsb3VkV2F0Y2ggTG9nc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlOiBgbG9ncy4ke3JlZ2lvbi5uYW1lfS5hbWF6b25hd3MuY29tYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpFbmNyeXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RGVjcnlwdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOlJlRW5jcnlwdCpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpHZW5lcmF0ZURhdGFLZXkqXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RGVzY3JpYmVLZXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogXCIqXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pKVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGtleUNvbXBvbmVudCA9IG5ldyBLbXNLZXlDb21wb25lbnQobmFtZSwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGFyZ3MuZGVzY3JpcHRpb24gfHwgXCJLTVMga2V5IGZvciBhcHBsaWNhdGlvbiBlbmNyeXB0aW9uXCIsXG4gICAgICAgICAgICBwb2xpY3k6IGtleVBvbGljeSxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5rZXkgPSBrZXlDb21wb25lbnQua2V5O1xuICAgICAgICB0aGlzLmtleUlkID0ga2V5Q29tcG9uZW50LmtleUlkO1xuICAgICAgICB0aGlzLmtleUFybiA9IGtleUNvbXBvbmVudC5rZXlBcm47XG5cbiAgICAgICAgY29uc3QgYWxpYXNDb21wb25lbnQgPSBuZXcgS21zQWxpYXNDb21wb25lbnQoYCR7bmFtZX0tYWxpYXNgLCB7XG4gICAgICAgICAgICBuYW1lOiBgYXBwbGljYXRpb24tJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICAgIHRhcmdldEtleUlkOiB0aGlzLmtleUlkLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXNDb21wb25lbnQuYWxpYXM7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAga2V5OiB0aGlzLmtleSxcbiAgICAgICAgICAgIGtleUlkOiB0aGlzLmtleUlkLFxuICAgICAgICAgICAga2V5QXJuOiB0aGlzLmtleUFybixcbiAgICAgICAgICAgIGFsaWFzOiB0aGlzLmFsaWFzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZUttc0tleUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGtleTogYXdzLmttcy5LZXk7XG4gICAgcHVibGljIHJlYWRvbmx5IGtleUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGtleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBhbGlhczogYXdzLmttcy5BbGlhcztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogRGF0YWJhc2VLbXNLZXlBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czprbXM6RGF0YWJhc2VLbXNLZXlDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGtleVBvbGljeSA9IHB1bHVtaS5vdXRwdXQoYXdzLmdldENhbGxlcklkZW50aXR5KCkpLmFwcGx5KGlkZW50aXR5ID0+IFxuICAgICAgICAgICAgcHVsdW1pLm91dHB1dChhd3MuZ2V0UmVnaW9uKCkpLmFwcGx5KHJlZ2lvbiA9PiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgVmVyc2lvbjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNpZDogXCJFbmFibGUgSUFNIFVzZXIgUGVybWlzc2lvbnNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7aWRlbnRpdHkuYWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFwia21zOipcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBcIipcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2lkOiBcIkFsbG93IFJEUyBTZXJ2aWNlXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6IFwicmRzLmFtYXpvbmF3cy5jb21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpEZWNyeXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RGVzY3JpYmVLZXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpFbmNyeXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6R2VuZXJhdGVEYXRhS2V5KlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOlJlRW5jcnlwdCpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogXCIqXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNpZDogXCJBbGxvdyBDbG91ZFdhdGNoIExvZ3NcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZTogYGxvZ3MuJHtyZWdpb24ubmFtZX0uYW1hem9uYXdzLmNvbWAsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RW5jcnlwdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkRlY3J5cHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpSZUVuY3J5cHQqXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6R2VuZXJhdGVEYXRhS2V5KlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkRlc2NyaWJlS2V5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFwiKlwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaWQ6IFwiQWxsb3cgUzMgU2VydmljZSBmb3IgQmFja3Vwc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlOiBcInMzLmFtYXpvbmF3cy5jb21cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpEZWNyeXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RGVzY3JpYmVLZXlcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpFbmNyeXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6R2VuZXJhdGVEYXRhS2V5KlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOlJlRW5jcnlwdCpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogXCIqXCIsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pKVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGtleUNvbXBvbmVudCA9IG5ldyBLbXNLZXlDb21wb25lbnQobmFtZSwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGFyZ3MuZGVzY3JpcHRpb24gfHwgXCJLTVMga2V5IGZvciBkYXRhYmFzZSBlbmNyeXB0aW9uXCIsXG4gICAgICAgICAgICBwb2xpY3k6IGtleVBvbGljeSxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5rZXkgPSBrZXlDb21wb25lbnQua2V5O1xuICAgICAgICB0aGlzLmtleUlkID0ga2V5Q29tcG9uZW50LmtleUlkO1xuICAgICAgICB0aGlzLmtleUFybiA9IGtleUNvbXBvbmVudC5rZXlBcm47XG5cbiAgICAgICAgY29uc3QgYWxpYXNDb21wb25lbnQgPSBuZXcgS21zQWxpYXNDb21wb25lbnQoYCR7bmFtZX0tYWxpYXNgLCB7XG4gICAgICAgICAgICBuYW1lOiBgZGF0YWJhc2UtJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICAgIHRhcmdldEtleUlkOiB0aGlzLmtleUlkLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXNDb21wb25lbnQuYWxpYXM7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAga2V5OiB0aGlzLmtleSxcbiAgICAgICAgICAgIGtleUlkOiB0aGlzLmtleUlkLFxuICAgICAgICAgICAga2V5QXJuOiB0aGlzLmtleUFybixcbiAgICAgICAgICAgIGFsaWFzOiB0aGlzLmFsaWFzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTM0ttc0tleUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGtleTogYXdzLmttcy5LZXk7XG4gICAgcHVibGljIHJlYWRvbmx5IGtleUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGtleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBhbGlhczogYXdzLmttcy5BbGlhcztcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogUzNLbXNLZXlBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czprbXM6UzNLbXNLZXlDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGtleVBvbGljeSA9IHB1bHVtaS5vdXRwdXQoYXdzLmdldENhbGxlcklkZW50aXR5KCkpLmFwcGx5KGlkZW50aXR5ID0+IFxuICAgICAgICAgICAgcHVsdW1pLm91dHB1dChhd3MuZ2V0UmVnaW9uKCkpLmFwcGx5KHJlZ2lvbiA9PiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgVmVyc2lvbjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFNpZDogXCJFbmFibGUgSUFNIFVzZXIgUGVybWlzc2lvbnNcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7aWRlbnRpdHkuYWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFwia21zOipcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBcIipcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2lkOiBcIkFsbG93IFMzIFNlcnZpY2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VydmljZTogXCJzMy5hbWF6b25hd3MuY29tXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RGVjcnlwdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkRlc2NyaWJlS2V5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RW5jcnlwdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkdlbmVyYXRlRGF0YUtleSpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpSZUVuY3J5cHQqXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFwiKlwiLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBTaWQ6IFwiQWxsb3cgQ2xvdWRXYXRjaCBMb2dzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6IGBsb2dzLiR7cmVnaW9uLm5hbWV9LmFtYXpvbmF3cy5jb21gLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkVuY3J5cHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpEZWNyeXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6UmVFbmNyeXB0KlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkdlbmVyYXRlRGF0YUtleSpcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpEZXNjcmliZUtleVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBcIipcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgU2lkOiBcIkFsbG93IEFMQiBTZXJ2aWNlIGZvciBMb2dzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6IFwiZWxhc3RpY2xvYWRiYWxhbmNpbmcuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkRlY3J5cHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpEZXNjcmliZUtleVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia21zOkVuY3J5cHRcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImttczpHZW5lcmF0ZURhdGFLZXkqXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6UmVFbmNyeXB0KlwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBcIipcIixcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSkpXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3Qga2V5Q29tcG9uZW50ID0gbmV3IEttc0tleUNvbXBvbmVudChuYW1lLCB7XG4gICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYXJncy5kZXNjcmlwdGlvbiB8fCBcIktNUyBrZXkgZm9yIFMzIGJ1Y2tldCBlbmNyeXB0aW9uXCIsXG4gICAgICAgICAgICBwb2xpY3k6IGtleVBvbGljeSxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5rZXkgPSBrZXlDb21wb25lbnQua2V5O1xuICAgICAgICB0aGlzLmtleUlkID0ga2V5Q29tcG9uZW50LmtleUlkO1xuICAgICAgICB0aGlzLmtleUFybiA9IGtleUNvbXBvbmVudC5rZXlBcm47XG5cbiAgICAgICAgY29uc3QgYWxpYXNDb21wb25lbnQgPSBuZXcgS21zQWxpYXNDb21wb25lbnQoYCR7bmFtZX0tYWxpYXNgLCB7XG4gICAgICAgICAgICBuYW1lOiBgczMtJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICAgIHRhcmdldEtleUlkOiB0aGlzLmtleUlkLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmFsaWFzID0gYWxpYXNDb21wb25lbnQuYWxpYXM7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAga2V5OiB0aGlzLmtleSxcbiAgICAgICAgICAgIGtleUlkOiB0aGlzLmtleUlkLFxuICAgICAgICAgICAga2V5QXJuOiB0aGlzLmtleUFybixcbiAgICAgICAgICAgIGFsaWFzOiB0aGlzLmFsaWFzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLbXNLZXkobmFtZTogc3RyaW5nLCBhcmdzOiBLbXNLZXlBcmdzKTogS21zS2V5UmVzdWx0IHtcbiAgICBjb25zdCBrbXNLZXlDb21wb25lbnQgPSBuZXcgS21zS2V5Q29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGtleToga21zS2V5Q29tcG9uZW50LmtleSxcbiAgICAgICAga2V5SWQ6IGttc0tleUNvbXBvbmVudC5rZXlJZCxcbiAgICAgICAga2V5QXJuOiBrbXNLZXlDb21wb25lbnQua2V5QXJuLFxuICAgICAgICBhbGlhczoga21zS2V5Q29tcG9uZW50LmFsaWFzLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVLbXNBbGlhcyhuYW1lOiBzdHJpbmcsIGFyZ3M6IEttc0FsaWFzQXJncyk6IGF3cy5rbXMuQWxpYXMge1xuICAgIGNvbnN0IGFsaWFzQ29tcG9uZW50ID0gbmV3IEttc0FsaWFzQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiBhbGlhc0NvbXBvbmVudC5hbGlhcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFwcGxpY2F0aW9uS21zS2V5KG5hbWU6IHN0cmluZywgYXJnczogQXBwbGljYXRpb25LbXNLZXlBcmdzKTogS21zS2V5UmVzdWx0IHtcbiAgICBjb25zdCBhcHBsaWNhdGlvbkttc0tleUNvbXBvbmVudCA9IG5ldyBBcHBsaWNhdGlvbkttc0tleUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBrZXk6IGFwcGxpY2F0aW9uS21zS2V5Q29tcG9uZW50LmtleSxcbiAgICAgICAga2V5SWQ6IGFwcGxpY2F0aW9uS21zS2V5Q29tcG9uZW50LmtleUlkLFxuICAgICAgICBrZXlBcm46IGFwcGxpY2F0aW9uS21zS2V5Q29tcG9uZW50LmtleUFybixcbiAgICAgICAgYWxpYXM6IGFwcGxpY2F0aW9uS21zS2V5Q29tcG9uZW50LmFsaWFzLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEYXRhYmFzZUttc0tleShuYW1lOiBzdHJpbmcsIGFyZ3M6IERhdGFiYXNlS21zS2V5QXJncyk6IEttc0tleVJlc3VsdCB7XG4gICAgY29uc3QgZGF0YWJhc2VLbXNLZXlDb21wb25lbnQgPSBuZXcgRGF0YWJhc2VLbXNLZXlDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAga2V5OiBkYXRhYmFzZUttc0tleUNvbXBvbmVudC5rZXksXG4gICAgICAgIGtleUlkOiBkYXRhYmFzZUttc0tleUNvbXBvbmVudC5rZXlJZCxcbiAgICAgICAga2V5QXJuOiBkYXRhYmFzZUttc0tleUNvbXBvbmVudC5rZXlBcm4sXG4gICAgICAgIGFsaWFzOiBkYXRhYmFzZUttc0tleUNvbXBvbmVudC5hbGlhcyxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUzNLbXNLZXkobmFtZTogc3RyaW5nLCBhcmdzOiBTM0ttc0tleUFyZ3MpOiBLbXNLZXlSZXN1bHQge1xuICAgIGNvbnN0IHMzS21zS2V5Q29tcG9uZW50ID0gbmV3IFMzS21zS2V5Q29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGtleTogczNLbXNLZXlDb21wb25lbnQua2V5LFxuICAgICAgICBrZXlJZDogczNLbXNLZXlDb21wb25lbnQua2V5SWQsXG4gICAgICAgIGtleUFybjogczNLbXNLZXlDb21wb25lbnQua2V5QXJuLFxuICAgICAgICBhbGlhczogczNLbXNLZXlDb21wb25lbnQuYWxpYXMsXG4gICAgfTtcbn0iXX0=