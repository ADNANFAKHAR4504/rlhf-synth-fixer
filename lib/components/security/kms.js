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
        super('aws:kms:KmsKeyComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        // Default KMS key policy if none provided
        const defaultPolicy = pulumi
            .output(aws.getCallerIdentity())
            .apply(identity => pulumi.output(aws.getRegion()).apply(region => JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'Enable IAM User Permissions',
                    Effect: 'Allow',
                    Principal: {
                        AWS: `arn:aws:iam::${identity.accountId}:root`,
                    },
                    Action: 'kms:*',
                    Resource: '*',
                },
                {
                    Sid: 'Allow CloudWatch Logs',
                    Effect: 'Allow',
                    Principal: {
                        Service: `logs.${region.name}.amazonaws.com`,
                    },
                    Action: [
                        'kms:Encrypt',
                        'kms:Decrypt',
                        'kms:ReEncrypt*',
                        'kms:GenerateDataKey*',
                        'kms:DescribeKey',
                    ],
                    Resource: '*',
                },
            ],
        })));
        const keyConfig = {
            description: args.description,
            keyUsage: args.keyUsage || 'ENCRYPT_DECRYPT',
            policy: args.policy || defaultPolicy,
            deletionWindowInDays: args.deletionWindowInDays || 7,
            tags: defaultTags,
        };
        this.key = new aws.kms.Key(`${name}-key`, keyConfig, {
            parent: this,
            provider: opts?.provider,
        });
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
        super('aws:kms:KmsAliasComponent', name, {}, opts);
        this.alias = new aws.kms.Alias(`${name}-alias`, {
            name: args.name.startsWith('alias/') ? args.name : `alias/${args.name}`,
            targetKeyId: args.targetKeyId,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:kms:ApplicationKmsKeyComponent', name, {}, opts);
        const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity => pulumi.output(aws.getRegion()).apply(region => JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'Enable IAM User Permissions',
                    Effect: 'Allow',
                    Principal: {
                        AWS: `arn:aws:iam::${identity.accountId}:root`,
                    },
                    Action: 'kms:*',
                    Resource: '*',
                },
                {
                    Sid: 'Allow EC2 Service',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'ec2.amazonaws.com',
                    },
                    Action: [
                        'kms:Decrypt',
                        'kms:DescribeKey',
                        'kms:Encrypt',
                        'kms:GenerateDataKey*',
                        'kms:ReEncrypt*',
                    ],
                    Resource: '*',
                },
                {
                    Sid: 'Allow CloudWatch Logs',
                    Effect: 'Allow',
                    Principal: {
                        Service: `logs.${region.name}.amazonaws.com`,
                    },
                    Action: [
                        'kms:Encrypt',
                        'kms:Decrypt',
                        'kms:ReEncrypt*',
                        'kms:GenerateDataKey*',
                        'kms:DescribeKey',
                    ],
                    Resource: '*',
                },
            ],
        })));
        const keyComponent = new KmsKeyComponent(name, {
            name: args.name,
            description: args.description || 'KMS key for application encryption',
            policy: keyPolicy,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.key = keyComponent.key;
        this.keyId = keyComponent.keyId;
        this.keyArn = keyComponent.keyArn;
        const aliasComponent = new KmsAliasComponent(`${name}-alias`, {
            name: `application-${args.name}`,
            targetKeyId: this.keyId,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:kms:DatabaseKmsKeyComponent', name, {}, opts);
        const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity => pulumi.output(aws.getRegion()).apply(region => JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'Enable IAM User Permissions',
                    Effect: 'Allow',
                    Principal: {
                        AWS: `arn:aws:iam::${identity.accountId}:root`,
                    },
                    Action: 'kms:*',
                    Resource: '*',
                },
                {
                    Sid: 'Allow RDS Service',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'rds.amazonaws.com',
                    },
                    Action: [
                        'kms:Decrypt',
                        'kms:DescribeKey',
                        'kms:Encrypt',
                        'kms:GenerateDataKey*',
                        'kms:ReEncrypt*',
                    ],
                    Resource: '*',
                },
                {
                    Sid: 'Allow CloudWatch Logs',
                    Effect: 'Allow',
                    Principal: {
                        Service: `logs.${region.name}.amazonaws.com`,
                    },
                    Action: [
                        'kms:Encrypt',
                        'kms:Decrypt',
                        'kms:ReEncrypt*',
                        'kms:GenerateDataKey*',
                        'kms:DescribeKey',
                    ],
                    Resource: '*',
                },
                {
                    Sid: 'Allow S3 Service for Backups',
                    Effect: 'Allow',
                    Principal: {
                        Service: 's3.amazonaws.com',
                    },
                    Action: [
                        'kms:Decrypt',
                        'kms:DescribeKey',
                        'kms:Encrypt',
                        'kms:GenerateDataKey*',
                        'kms:ReEncrypt*',
                    ],
                    Resource: '*',
                },
            ],
        })));
        const keyComponent = new KmsKeyComponent(name, {
            name: args.name,
            description: args.description || 'KMS key for database encryption',
            policy: keyPolicy,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.key = keyComponent.key;
        this.keyId = keyComponent.keyId;
        this.keyArn = keyComponent.keyArn;
        const aliasComponent = new KmsAliasComponent(`${name}-alias`, {
            name: `database-${args.name}`,
            targetKeyId: this.keyId,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:kms:S3KmsKeyComponent', name, {}, opts);
        const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity => pulumi.output(aws.getRegion()).apply(region => JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'Enable IAM User Permissions',
                    Effect: 'Allow',
                    Principal: {
                        AWS: `arn:aws:iam::${identity.accountId}:root`,
                    },
                    Action: 'kms:*',
                    Resource: '*',
                },
                {
                    Sid: 'Allow S3 Service',
                    Effect: 'Allow',
                    Principal: {
                        Service: 's3.amazonaws.com',
                    },
                    Action: [
                        'kms:Decrypt',
                        'kms:DescribeKey',
                        'kms:Encrypt',
                        'kms:GenerateDataKey*',
                        'kms:ReEncrypt*',
                    ],
                    Resource: '*',
                },
                {
                    Sid: 'Allow CloudWatch Logs',
                    Effect: 'Allow',
                    Principal: {
                        Service: `logs.${region.name}.amazonaws.com`,
                    },
                    Action: [
                        'kms:Encrypt',
                        'kms:Decrypt',
                        'kms:ReEncrypt*',
                        'kms:GenerateDataKey*',
                        'kms:DescribeKey',
                    ],
                    Resource: '*',
                },
                {
                    Sid: 'Allow ALB Service for Logs',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'elasticloadbalancing.amazonaws.com',
                    },
                    Action: [
                        'kms:Decrypt',
                        'kms:DescribeKey',
                        'kms:Encrypt',
                        'kms:GenerateDataKey*',
                        'kms:ReEncrypt*',
                    ],
                    Resource: '*',
                },
            ],
        })));
        const keyComponent = new KmsKeyComponent(name, {
            name: args.name,
            description: args.description || 'KMS key for S3 bucket encryption',
            policy: keyPolicy,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.key = keyComponent.key;
        this.keyId = keyComponent.keyId;
        this.keyArn = keyComponent.keyArn;
        const aliasComponent = new KmsAliasComponent(`${name}-alias`, {
            name: `s3-${args.name}`,
            targetKeyId: this.keyId,
        }, { parent: this, provider: opts?.provider });
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
function createKmsKey(name, args, opts) {
    const kmsKeyComponent = new KmsKeyComponent(name, args, opts);
    return {
        key: kmsKeyComponent.key,
        keyId: kmsKeyComponent.keyId,
        keyArn: kmsKeyComponent.keyArn,
        alias: kmsKeyComponent.alias,
    };
}
function createKmsAlias(name, args, opts) {
    const aliasComponent = new KmsAliasComponent(name, args, opts);
    return aliasComponent.alias;
}
function createApplicationKmsKey(name, args, opts // ← FIXED: Added third parameter
) {
    const applicationKmsKeyComponent = new ApplicationKmsKeyComponent(name, args, opts); // ← FIXED: Pass opts through
    return {
        key: applicationKmsKeyComponent.key,
        keyId: applicationKmsKeyComponent.keyId,
        keyArn: applicationKmsKeyComponent.keyArn,
        alias: applicationKmsKeyComponent.alias,
    };
}
function createDatabaseKmsKey(name, args, opts) {
    const databaseKmsKeyComponent = new DatabaseKmsKeyComponent(name, args, opts);
    return {
        key: databaseKmsKeyComponent.key,
        keyId: databaseKmsKeyComponent.keyId,
        keyArn: databaseKmsKeyComponent.keyArn,
        alias: databaseKmsKeyComponent.alias,
    };
}
function createS3KmsKey(name, args, opts) {
    const s3KmsKeyComponent = new S3KmsKeyComponent(name, args, opts);
    return {
        key: s3KmsKeyComponent.key,
        keyId: s3KmsKeyComponent.keyId,
        keyArn: s3KmsKeyComponent.keyArn,
        alias: s3KmsKeyComponent.alias,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia21zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia21zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVkQSxvQ0FZQztBQUVELHdDQU9DO0FBRUQsMERBZ0JDO0FBRUQsb0RBWUM7QUFFRCx3Q0FZQztBQTFoQkQsdURBQXlDO0FBQ3pDLGlEQUFtQztBQTBDbkMsTUFBYSxlQUFnQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDM0MsR0FBRyxDQUFjO0lBQ2pCLEtBQUssQ0FBd0I7SUFDN0IsTUFBTSxDQUF3QjtJQUM5QixLQUFLLENBQWlCO0lBRXRDLFlBQ0UsSUFBWSxFQUNaLElBQWdCLEVBQ2hCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWpELE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNiLENBQUM7UUFFRiwwQ0FBMEM7UUFDMUMsTUFBTSxhQUFhLEdBQUcsTUFBTTthQUN6QixNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixFQUFFLENBQUM7YUFDL0IsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQ2hCLE1BQU0sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQzVDLElBQUksQ0FBQyxTQUFTLENBQUM7WUFDYixPQUFPLEVBQUUsWUFBWTtZQUNyQixTQUFTLEVBQUU7Z0JBQ1Q7b0JBQ0UsR0FBRyxFQUFFLDZCQUE2QjtvQkFDbEMsTUFBTSxFQUFFLE9BQU87b0JBQ2YsU0FB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QUFFLGlCQUFpQixDQUFDLE1BQU07UUFDaEMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLEtBQUs7S0FDL0IsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBLbXNLZXlBcmdzIHtcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAga2V5VXNhZ2U/OiAnRU5DUllQVF9ERUNSWVBUJyB8ICdTSUdOX1ZFUklGWSc7XG4gIGtleVNwZWM/OiBzdHJpbmc7XG4gIHBvbGljeT86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBkZWxldGlvbldpbmRvd0luRGF5cz86IG51bWJlcjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLbXNBbGlhc0FyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHRhcmdldEtleUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBLbXNLZXlSZXN1bHQge1xuICBrZXk6IGF3cy5rbXMuS2V5O1xuICBrZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBrZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgYWxpYXM/OiBhd3Mua21zLkFsaWFzO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFwcGxpY2F0aW9uS21zS2V5QXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlS21zS2V5QXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFMzS21zS2V5QXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgS21zS2V5Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGtleTogYXdzLmttcy5LZXk7XG4gIHB1YmxpYyByZWFkb25seSBrZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkga2V5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhbGlhcz86IGF3cy5rbXMuQWxpYXM7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEttc0tleUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czprbXM6S21zS2V5Q29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgLy8gRGVmYXVsdCBLTVMga2V5IHBvbGljeSBpZiBub25lIHByb3ZpZGVkXG4gICAgY29uc3QgZGVmYXVsdFBvbGljeSA9IHB1bHVtaVxuICAgICAgLm91dHB1dChhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKSlcbiAgICAgIC5hcHBseShpZGVudGl0eSA9PlxuICAgICAgICBwdWx1bWkub3V0cHV0KGF3cy5nZXRSZWdpb24oKSkuYXBwbHkocmVnaW9uID0+XG4gICAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBTaWQ6ICdFbmFibGUgSUFNIFVzZXIgUGVybWlzc2lvbnMnLFxuICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2lkZW50aXR5LmFjY291bnRJZH06cm9vdGAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdrbXM6KicsXG4gICAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFNpZDogJ0FsbG93IENsb3VkV2F0Y2ggTG9ncycsXG4gICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgU2VydmljZTogYGxvZ3MuJHtyZWdpb24ubmFtZX0uYW1hem9uYXdzLmNvbWAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICdrbXM6RW5jcnlwdCcsXG4gICAgICAgICAgICAgICAgICAna21zOkRlY3J5cHQnLFxuICAgICAgICAgICAgICAgICAgJ2ttczpSZUVuY3J5cHQqJyxcbiAgICAgICAgICAgICAgICAgICdrbXM6R2VuZXJhdGVEYXRhS2V5KicsXG4gICAgICAgICAgICAgICAgICAna21zOkRlc2NyaWJlS2V5JyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0pXG4gICAgICAgIClcbiAgICAgICk7XG5cbiAgICBjb25zdCBrZXlDb25maWc6IGF3cy5rbXMuS2V5QXJncyA9IHtcbiAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uLFxuICAgICAga2V5VXNhZ2U6IGFyZ3Mua2V5VXNhZ2UgfHwgJ0VOQ1JZUFRfREVDUllQVCcsXG4gICAgICBwb2xpY3k6IGFyZ3MucG9saWN5IHx8IGRlZmF1bHRQb2xpY3ksXG4gICAgICBkZWxldGlvbldpbmRvd0luRGF5czogYXJncy5kZWxldGlvbldpbmRvd0luRGF5cyB8fCA3LFxuICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgfTtcblxuICAgIHRoaXMua2V5ID0gbmV3IGF3cy5rbXMuS2V5KGAke25hbWV9LWtleWAsIGtleUNvbmZpZywge1xuICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyLFxuICAgIH0pO1xuXG4gICAgdGhpcy5rZXlJZCA9IHRoaXMua2V5LmtleUlkO1xuICAgIHRoaXMua2V5QXJuID0gdGhpcy5rZXkuYXJuO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAga2V5OiB0aGlzLmtleSxcbiAgICAgIGtleUlkOiB0aGlzLmtleUlkLFxuICAgICAga2V5QXJuOiB0aGlzLmtleUFybixcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgS21zQWxpYXNDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYWxpYXM6IGF3cy5rbXMuQWxpYXM7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEttc0FsaWFzQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmttczpLbXNBbGlhc0NvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIHRoaXMuYWxpYXMgPSBuZXcgYXdzLmttcy5BbGlhcyhcbiAgICAgIGAke25hbWV9LWFsaWFzYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy5uYW1lLnN0YXJ0c1dpdGgoJ2FsaWFzLycpID8gYXJncy5uYW1lIDogYGFsaWFzLyR7YXJncy5uYW1lfWAsXG4gICAgICAgIHRhcmdldEtleUlkOiBhcmdzLnRhcmdldEtleUlkLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBhbGlhczogdGhpcy5hbGlhcyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25LbXNLZXlDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkga2V5OiBhd3Mua21zLktleTtcbiAgcHVibGljIHJlYWRvbmx5IGtleUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBrZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGFsaWFzOiBhd3Mua21zLkFsaWFzO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBBcHBsaWNhdGlvbkttc0tleUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czprbXM6QXBwbGljYXRpb25LbXNLZXlDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBrZXlQb2xpY3kgPSBwdWx1bWkub3V0cHV0KGF3cy5nZXRDYWxsZXJJZGVudGl0eSgpKS5hcHBseShpZGVudGl0eSA9PlxuICAgICAgcHVsdW1pLm91dHB1dChhd3MuZ2V0UmVnaW9uKCkpLmFwcGx5KHJlZ2lvbiA9PlxuICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdFbmFibGUgSUFNIFVzZXIgUGVybWlzc2lvbnMnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIEFXUzogYGFybjphd3M6aWFtOjoke2lkZW50aXR5LmFjY291bnRJZH06cm9vdGAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIEFjdGlvbjogJ2ttczoqJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0FsbG93IEVDMiBTZXJ2aWNlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnZWMyLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAna21zOkRlY3J5cHQnLFxuICAgICAgICAgICAgICAgICdrbXM6RGVzY3JpYmVLZXknLFxuICAgICAgICAgICAgICAgICdrbXM6RW5jcnlwdCcsXG4gICAgICAgICAgICAgICAgJ2ttczpHZW5lcmF0ZURhdGFLZXkqJyxcbiAgICAgICAgICAgICAgICAna21zOlJlRW5jcnlwdConLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnQWxsb3cgQ2xvdWRXYXRjaCBMb2dzJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiBgbG9ncy4ke3JlZ2lvbi5uYW1lfS5hbWF6b25hd3MuY29tYCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ2ttczpFbmNyeXB0JyxcbiAgICAgICAgICAgICAgICAna21zOkRlY3J5cHQnLFxuICAgICAgICAgICAgICAgICdrbXM6UmVFbmNyeXB0KicsXG4gICAgICAgICAgICAgICAgJ2ttczpHZW5lcmF0ZURhdGFLZXkqJyxcbiAgICAgICAgICAgICAgICAna21zOkRlc2NyaWJlS2V5JyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSlcbiAgICAgIClcbiAgICApO1xuXG4gICAgY29uc3Qga2V5Q29tcG9uZW50ID0gbmV3IEttc0tleUNvbXBvbmVudChcbiAgICAgIG5hbWUsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgZGVzY3JpcHRpb246IGFyZ3MuZGVzY3JpcHRpb24gfHwgJ0tNUyBrZXkgZm9yIGFwcGxpY2F0aW9uIGVuY3J5cHRpb24nLFxuICAgICAgICBwb2xpY3k6IGtleVBvbGljeSxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmtleSA9IGtleUNvbXBvbmVudC5rZXk7XG4gICAgdGhpcy5rZXlJZCA9IGtleUNvbXBvbmVudC5rZXlJZDtcbiAgICB0aGlzLmtleUFybiA9IGtleUNvbXBvbmVudC5rZXlBcm47XG5cbiAgICBjb25zdCBhbGlhc0NvbXBvbmVudCA9IG5ldyBLbXNBbGlhc0NvbXBvbmVudChcbiAgICAgIGAke25hbWV9LWFsaWFzYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYGFwcGxpY2F0aW9uLSR7YXJncy5uYW1lfWAsXG4gICAgICAgIHRhcmdldEtleUlkOiB0aGlzLmtleUlkLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmFsaWFzID0gYWxpYXNDb21wb25lbnQuYWxpYXM7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBrZXk6IHRoaXMua2V5LFxuICAgICAga2V5SWQ6IHRoaXMua2V5SWQsXG4gICAgICBrZXlBcm46IHRoaXMua2V5QXJuLFxuICAgICAgYWxpYXM6IHRoaXMuYWxpYXMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlS21zS2V5Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGtleTogYXdzLmttcy5LZXk7XG4gIHB1YmxpYyByZWFkb25seSBrZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkga2V5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBhbGlhczogYXdzLmttcy5BbGlhcztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRGF0YWJhc2VLbXNLZXlBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6a21zOkRhdGFiYXNlS21zS2V5Q29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3Qga2V5UG9saWN5ID0gcHVsdW1pLm91dHB1dChhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKSkuYXBwbHkoaWRlbnRpdHkgPT5cbiAgICAgIHB1bHVtaS5vdXRwdXQoYXdzLmdldFJlZ2lvbigpKS5hcHBseShyZWdpb24gPT5cbiAgICAgICAgSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRW5hYmxlIElBTSBVc2VyIFBlcm1pc3Npb25zJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBBV1M6IGBhcm46YXdzOmlhbTo6JHtpZGVudGl0eS5hY2NvdW50SWR9OnJvb3RgLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdrbXM6KicsXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdBbGxvdyBSRFMgU2VydmljZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ3Jkcy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ2ttczpEZWNyeXB0JyxcbiAgICAgICAgICAgICAgICAna21zOkRlc2NyaWJlS2V5JyxcbiAgICAgICAgICAgICAgICAna21zOkVuY3J5cHQnLFxuICAgICAgICAgICAgICAgICdrbXM6R2VuZXJhdGVEYXRhS2V5KicsXG4gICAgICAgICAgICAgICAgJ2ttczpSZUVuY3J5cHQqJyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0FsbG93IENsb3VkV2F0Y2ggTG9ncycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogYGxvZ3MuJHtyZWdpb24ubmFtZX0uYW1hem9uYXdzLmNvbWAsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdrbXM6RW5jcnlwdCcsXG4gICAgICAgICAgICAgICAgJ2ttczpEZWNyeXB0JyxcbiAgICAgICAgICAgICAgICAna21zOlJlRW5jcnlwdConLFxuICAgICAgICAgICAgICAgICdrbXM6R2VuZXJhdGVEYXRhS2V5KicsXG4gICAgICAgICAgICAgICAgJ2ttczpEZXNjcmliZUtleScsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBTaWQ6ICdBbGxvdyBTMyBTZXJ2aWNlIGZvciBCYWNrdXBzJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnczMuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdrbXM6RGVjcnlwdCcsXG4gICAgICAgICAgICAgICAgJ2ttczpEZXNjcmliZUtleScsXG4gICAgICAgICAgICAgICAgJ2ttczpFbmNyeXB0JyxcbiAgICAgICAgICAgICAgICAna21zOkdlbmVyYXRlRGF0YUtleSonLFxuICAgICAgICAgICAgICAgICdrbXM6UmVFbmNyeXB0KicsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgKTtcblxuICAgIGNvbnN0IGtleUNvbXBvbmVudCA9IG5ldyBLbXNLZXlDb21wb25lbnQoXG4gICAgICBuYW1lLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uIHx8ICdLTVMga2V5IGZvciBkYXRhYmFzZSBlbmNyeXB0aW9uJyxcbiAgICAgICAgcG9saWN5OiBrZXlQb2xpY3ksXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5rZXkgPSBrZXlDb21wb25lbnQua2V5O1xuICAgIHRoaXMua2V5SWQgPSBrZXlDb21wb25lbnQua2V5SWQ7XG4gICAgdGhpcy5rZXlBcm4gPSBrZXlDb21wb25lbnQua2V5QXJuO1xuXG4gICAgY29uc3QgYWxpYXNDb21wb25lbnQgPSBuZXcgS21zQWxpYXNDb21wb25lbnQoXG4gICAgICBgJHtuYW1lfS1hbGlhc2AsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBkYXRhYmFzZS0ke2FyZ3MubmFtZX1gLFxuICAgICAgICB0YXJnZXRLZXlJZDogdGhpcy5rZXlJZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5hbGlhcyA9IGFsaWFzQ29tcG9uZW50LmFsaWFzO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAga2V5OiB0aGlzLmtleSxcbiAgICAgIGtleUlkOiB0aGlzLmtleUlkLFxuICAgICAga2V5QXJuOiB0aGlzLmtleUFybixcbiAgICAgIGFsaWFzOiB0aGlzLmFsaWFzLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTM0ttc0tleUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBrZXk6IGF3cy5rbXMuS2V5O1xuICBwdWJsaWMgcmVhZG9ubHkga2V5SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGtleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYWxpYXM6IGF3cy5rbXMuQWxpYXM7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFMzS21zS2V5QXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmttczpTM0ttc0tleUNvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGtleVBvbGljeSA9IHB1bHVtaS5vdXRwdXQoYXdzLmdldENhbGxlcklkZW50aXR5KCkpLmFwcGx5KGlkZW50aXR5ID0+XG4gICAgICBwdWx1bWkub3V0cHV0KGF3cy5nZXRSZWdpb24oKSkuYXBwbHkocmVnaW9uID0+XG4gICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0VuYWJsZSBJQU0gVXNlciBQZXJtaXNzaW9ucycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7aWRlbnRpdHkuYWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgQWN0aW9uOiAna21zOionLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnQWxsb3cgUzMgU2VydmljZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ3MzLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAna21zOkRlY3J5cHQnLFxuICAgICAgICAgICAgICAgICdrbXM6RGVzY3JpYmVLZXknLFxuICAgICAgICAgICAgICAgICdrbXM6RW5jcnlwdCcsXG4gICAgICAgICAgICAgICAgJ2ttczpHZW5lcmF0ZURhdGFLZXkqJyxcbiAgICAgICAgICAgICAgICAna21zOlJlRW5jcnlwdConLFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnQWxsb3cgQ2xvdWRXYXRjaCBMb2dzJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiBgbG9ncy4ke3JlZ2lvbi5uYW1lfS5hbWF6b25hd3MuY29tYCxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgJ2ttczpFbmNyeXB0JyxcbiAgICAgICAgICAgICAgICAna21zOkRlY3J5cHQnLFxuICAgICAgICAgICAgICAgICdrbXM6UmVFbmNyeXB0KicsXG4gICAgICAgICAgICAgICAgJ2ttczpHZW5lcmF0ZURhdGFLZXkqJyxcbiAgICAgICAgICAgICAgICAna21zOkRlc2NyaWJlS2V5JyxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6ICcqJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0FsbG93IEFMQiBTZXJ2aWNlIGZvciBMb2dzJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnZWxhc3RpY2xvYWRiYWxhbmNpbmcuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICdrbXM6RGVjcnlwdCcsXG4gICAgICAgICAgICAgICAgJ2ttczpEZXNjcmliZUtleScsXG4gICAgICAgICAgICAgICAgJ2ttczpFbmNyeXB0JyxcbiAgICAgICAgICAgICAgICAna21zOkdlbmVyYXRlRGF0YUtleSonLFxuICAgICAgICAgICAgICAgICdrbXM6UmVFbmNyeXB0KicsXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pXG4gICAgICApXG4gICAgKTtcblxuICAgIGNvbnN0IGtleUNvbXBvbmVudCA9IG5ldyBLbXNLZXlDb21wb25lbnQoXG4gICAgICBuYW1lLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uIHx8ICdLTVMga2V5IGZvciBTMyBidWNrZXQgZW5jcnlwdGlvbicsXG4gICAgICAgIHBvbGljeToga2V5UG9saWN5LFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMua2V5ID0ga2V5Q29tcG9uZW50LmtleTtcbiAgICB0aGlzLmtleUlkID0ga2V5Q29tcG9uZW50LmtleUlkO1xuICAgIHRoaXMua2V5QXJuID0ga2V5Q29tcG9uZW50LmtleUFybjtcblxuICAgIGNvbnN0IGFsaWFzQ29tcG9uZW50ID0gbmV3IEttc0FsaWFzQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tYWxpYXNgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgczMtJHthcmdzLm5hbWV9YCxcbiAgICAgICAgdGFyZ2V0S2V5SWQ6IHRoaXMua2V5SWQsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMuYWxpYXMgPSBhbGlhc0NvbXBvbmVudC5hbGlhcztcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGtleTogdGhpcy5rZXksXG4gICAgICBrZXlJZDogdGhpcy5rZXlJZCxcbiAgICAgIGtleUFybjogdGhpcy5rZXlBcm4sXG4gICAgICBhbGlhczogdGhpcy5hbGlhcyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlS21zS2V5KFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IEttc0tleUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBLbXNLZXlSZXN1bHQge1xuICBjb25zdCBrbXNLZXlDb21wb25lbnQgPSBuZXcgS21zS2V5Q29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpO1xuICByZXR1cm4ge1xuICAgIGtleToga21zS2V5Q29tcG9uZW50LmtleSxcbiAgICBrZXlJZDoga21zS2V5Q29tcG9uZW50LmtleUlkLFxuICAgIGtleUFybjoga21zS2V5Q29tcG9uZW50LmtleUFybixcbiAgICBhbGlhczoga21zS2V5Q29tcG9uZW50LmFsaWFzLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlS21zQWxpYXMoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogS21zQWxpYXNBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogYXdzLmttcy5BbGlhcyB7XG4gIGNvbnN0IGFsaWFzQ29tcG9uZW50ID0gbmV3IEttc0FsaWFzQ29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpO1xuICByZXR1cm4gYWxpYXNDb21wb25lbnQuYWxpYXM7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBcHBsaWNhdGlvbkttc0tleShcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBBcHBsaWNhdGlvbkttc0tleUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zIC8vIOKGkCBGSVhFRDogQWRkZWQgdGhpcmQgcGFyYW1ldGVyXG4pOiBLbXNLZXlSZXN1bHQge1xuICBjb25zdCBhcHBsaWNhdGlvbkttc0tleUNvbXBvbmVudCA9IG5ldyBBcHBsaWNhdGlvbkttc0tleUNvbXBvbmVudChcbiAgICBuYW1lLFxuICAgIGFyZ3MsXG4gICAgb3B0c1xuICApOyAvLyDihpAgRklYRUQ6IFBhc3Mgb3B0cyB0aHJvdWdoXG4gIHJldHVybiB7XG4gICAga2V5OiBhcHBsaWNhdGlvbkttc0tleUNvbXBvbmVudC5rZXksXG4gICAga2V5SWQ6IGFwcGxpY2F0aW9uS21zS2V5Q29tcG9uZW50LmtleUlkLFxuICAgIGtleUFybjogYXBwbGljYXRpb25LbXNLZXlDb21wb25lbnQua2V5QXJuLFxuICAgIGFsaWFzOiBhcHBsaWNhdGlvbkttc0tleUNvbXBvbmVudC5hbGlhcyxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURhdGFiYXNlS21zS2V5KFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IERhdGFiYXNlS21zS2V5QXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IEttc0tleVJlc3VsdCB7XG4gIGNvbnN0IGRhdGFiYXNlS21zS2V5Q29tcG9uZW50ID0gbmV3IERhdGFiYXNlS21zS2V5Q29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpO1xuICByZXR1cm4ge1xuICAgIGtleTogZGF0YWJhc2VLbXNLZXlDb21wb25lbnQua2V5LFxuICAgIGtleUlkOiBkYXRhYmFzZUttc0tleUNvbXBvbmVudC5rZXlJZCxcbiAgICBrZXlBcm46IGRhdGFiYXNlS21zS2V5Q29tcG9uZW50LmtleUFybixcbiAgICBhbGlhczogZGF0YWJhc2VLbXNLZXlDb21wb25lbnQuYWxpYXMsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTM0ttc0tleShcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBTM0ttc0tleUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBLbXNLZXlSZXN1bHQge1xuICBjb25zdCBzM0ttc0tleUNvbXBvbmVudCA9IG5ldyBTM0ttc0tleUNvbXBvbmVudChuYW1lLCBhcmdzLCBvcHRzKTtcbiAgcmV0dXJuIHtcbiAgICBrZXk6IHMzS21zS2V5Q29tcG9uZW50LmtleSxcbiAgICBrZXlJZDogczNLbXNLZXlDb21wb25lbnQua2V5SWQsXG4gICAga2V5QXJuOiBzM0ttc0tleUNvbXBvbmVudC5rZXlBcm4sXG4gICAgYWxpYXM6IHMzS21zS2V5Q29tcG9uZW50LmFsaWFzLFxuICB9O1xufVxuIl19