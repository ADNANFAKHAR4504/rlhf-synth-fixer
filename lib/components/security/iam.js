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
exports.AlbRoleComponent = exports.RdsRoleComponent = exports.Ec2InstanceRoleComponent = exports.IamPolicyComponent = exports.IamRoleComponent = void 0;
exports.createIamRole = createIamRole;
exports.createIamPolicy = createIamPolicy;
exports.createEc2InstanceRole = createEc2InstanceRole;
exports.createRdsRole = createRdsRole;
exports.createAlbRole = createAlbRole;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class IamRoleComponent extends pulumi.ComponentResource {
    role;
    roleArn;
    roleName;
    constructor(name, args, opts) {
        super('aws:iam:IamRoleComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.role = new aws.iam.Role(`${name}-role`, {
            name: args.name,
            assumeRolePolicy: args.assumeRolePolicy,
            description: args.description,
            maxSessionDuration: args.maxSessionDuration || 3600,
            tags: defaultTags,
        }, { parent: this });
        this.roleArn = this.role.arn;
        this.roleName = this.role.name;
        this.registerOutputs({
            role: this.role,
            roleArn: this.roleArn,
            roleName: this.roleName,
        });
    }
}
exports.IamRoleComponent = IamRoleComponent;
class IamPolicyComponent extends pulumi.ComponentResource {
    policy;
    policyArn;
    policyName;
    constructor(name, args, opts) {
        super('aws:iam:IamPolicyComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.policy = new aws.iam.Policy(`${name}-policy`, {
            name: args.name,
            policy: args.policy,
            description: args.description,
            tags: defaultTags,
        }, { parent: this });
        this.policyArn = this.policy.arn;
        this.policyName = this.policy.name;
        this.registerOutputs({
            policy: this.policy,
            policyArn: this.policyArn,
            policyName: this.policyName,
        });
    }
}
exports.IamPolicyComponent = IamPolicyComponent;
class Ec2InstanceRoleComponent extends pulumi.ComponentResource {
    role;
    policy;
    instanceProfile;
    roleArn;
    instanceProfileArn;
    constructor(name, args, opts) {
        super('aws:iam:Ec2InstanceRoleComponent', name, {}, opts);
        const assumeRolePolicy = JSON.stringify({
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
        });
        const roleComponent = new IamRoleComponent(`${name}-ec2`, {
            name: `${args.name}-ec2-role`,
            assumeRolePolicy: assumeRolePolicy,
            description: 'IAM role for EC2 instances with least privilege access',
            tags: args.tags,
        }, { parent: this });
        this.role = roleComponent.role;
        // Create policy with least privilege permissions
        const policyDocument = pulumi
            .all([args.s3BucketArn, args.kmsKeyArn])
            .apply(([s3Arn, kmsArn]) => {
            const statements = [
                {
                    Effect: 'Allow',
                    Action: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                        'logs:DescribeLogStreams',
                        'logs:DescribeLogGroups',
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
            ];
            if (s3Arn) {
                statements.push({
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject'],
                    Resource: `${s3Arn}/*`,
                });
                statements.push({
                    Effect: 'Allow',
                    Action: ['s3:ListBucket'],
                    Resource: s3Arn,
                });
            }
            if (kmsArn) {
                statements.push({
                    Effect: 'Allow',
                    Action: ['kms:Decrypt', 'kms:DescribeKey'],
                    Resource: kmsArn,
                });
            }
            return JSON.stringify({
                Version: '2012-10-17',
                Statement: statements,
            });
        });
        const policyComponent = new IamPolicyComponent(`${name}-policy`, {
            name: `${args.name}-ec2-policy`,
            policy: policyDocument,
            description: 'Policy for EC2 instances with minimal required permissions',
            tags: args.tags,
        }, { parent: this });
        this.policy = policyComponent.policy;
        // Attach policy to role
        new aws.iam.RolePolicyAttachment(`${name}-attachment`, {
            role: this.role.name,
            policyArn: this.policy.arn,
        }, { parent: this });
        // Create instance profile
        this.instanceProfile = new aws.iam.InstanceProfile(`${name}-profile`, {
            name: `${args.name}-ec2-profile`,
            role: this.role.name,
        }, { parent: this });
        this.roleArn = this.role.arn;
        this.instanceProfileArn = this.instanceProfile.arn;
        this.registerOutputs({
            role: this.role,
            policy: this.policy,
            instanceProfile: this.instanceProfile,
            roleArn: this.roleArn,
            instanceProfileArn: this.instanceProfileArn,
        });
    }
}
exports.Ec2InstanceRoleComponent = Ec2InstanceRoleComponent;
class RdsRoleComponent extends pulumi.ComponentResource {
    role;
    policy;
    roleArn;
    constructor(name, args, opts) {
        super('aws:iam:RdsRoleComponent', name, {}, opts);
        const assumeRolePolicy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'rds.amazonaws.com',
                    },
                },
            ],
        });
        const roleComponent = new IamRoleComponent(`${name}-rds`, {
            name: `${args.name}-rds-role`,
            assumeRolePolicy: assumeRolePolicy,
            description: 'IAM role for RDS with monitoring and backup permissions',
            tags: args.tags,
        }, { parent: this });
        this.role = roleComponent.role;
        // Create policy with RDS-specific permissions
        const policyDocument = pulumi
            .all([args.s3BucketArn, args.kmsKeyArn])
            .apply(([s3Arn, kmsArn]) => {
            const statements = [
                {
                    Effect: 'Allow',
                    Action: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                        'logs:DescribeLogStreams',
                        'logs:DescribeLogGroups',
                    ],
                    Resource: '*',
                },
                {
                    Effect: 'Allow',
                    Action: ['cloudwatch:PutMetricData'],
                    Resource: '*',
                },
            ];
            if (s3Arn) {
                statements.push({
                    Effect: 'Allow',
                    Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                    Resource: `${s3Arn}/backups/*`,
                });
                statements.push({
                    Effect: 'Allow',
                    Action: ['s3:ListBucket'],
                    Resource: s3Arn,
                    Condition: {
                        StringLike: {
                            's3:prefix': ['backups/*'],
                        },
                    },
                });
            }
            if (kmsArn) {
                statements.push({
                    Effect: 'Allow',
                    Action: [
                        'kms:Decrypt',
                        'kms:DescribeKey',
                        'kms:Encrypt',
                        'kms:GenerateDataKey',
                        'kms:ReEncrypt*',
                    ],
                    Resource: kmsArn,
                });
            }
            return JSON.stringify({
                Version: '2012-10-17',
                Statement: statements,
            });
        });
        const policyComponent = new IamPolicyComponent(`${name}-policy`, {
            name: `${args.name}-rds-policy`,
            policy: policyDocument,
            description: 'Policy for RDS with backup and monitoring permissions',
            tags: args.tags,
        }, { parent: this });
        this.policy = policyComponent.policy;
        // Attach policy to role
        new aws.iam.RolePolicyAttachment(`${name}-attachment`, {
            role: this.role.name,
            policyArn: this.policy.arn,
        }, { parent: this });
        this.roleArn = this.role.arn;
        this.registerOutputs({
            role: this.role,
            policy: this.policy,
            roleArn: this.roleArn,
        });
    }
}
exports.RdsRoleComponent = RdsRoleComponent;
class AlbRoleComponent extends pulumi.ComponentResource {
    role;
    policy;
    roleArn;
    constructor(name, args, opts) {
        super('aws:iam:AlbRoleComponent', name, {}, opts);
        const assumeRolePolicy = JSON.stringify({
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'sts:AssumeRole',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'elasticloadbalancing.amazonaws.com',
                    },
                },
            ],
        });
        const roleComponent = new IamRoleComponent(`${name}-alb`, {
            name: `${args.name}-alb-role`,
            assumeRolePolicy: assumeRolePolicy,
            description: 'IAM role for Application Load Balancer with logging permissions',
            tags: args.tags,
        }, { parent: this });
        this.role = roleComponent.role;
        // Create policy for ALB access logs
        const policyDocument = pulumi.all([args.s3BucketArn]).apply(([s3Arn]) => {
            const statements = [
                {
                    Effect: 'Allow',
                    Action: [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents',
                    ],
                    Resource: '*',
                },
            ];
            if (s3Arn) {
                statements.push({
                    Effect: 'Allow',
                    Action: ['s3:PutObject'],
                    Resource: `${s3Arn}/alb-logs/*`,
                });
                statements.push({
                    Effect: 'Allow',
                    Action: ['s3:GetBucketAcl'],
                    Resource: s3Arn,
                });
            }
            return JSON.stringify({
                Version: '2012-10-17',
                Statement: statements,
            });
        });
        const policyComponent = new IamPolicyComponent(`${name}-policy`, {
            name: `${args.name}-alb-policy`,
            policy: policyDocument,
            description: 'Policy for ALB with logging permissions',
            tags: args.tags,
        }, { parent: this });
        this.policy = policyComponent.policy;
        // Attach policy to role
        new aws.iam.RolePolicyAttachment(`${name}-attachment`, {
            role: this.role.name,
            policyArn: this.policy.arn,
        }, { parent: this });
        this.roleArn = this.role.arn;
        this.registerOutputs({
            role: this.role,
            policy: this.policy,
            roleArn: this.roleArn,
        });
    }
}
exports.AlbRoleComponent = AlbRoleComponent;
function createIamRole(name, args) {
    const roleComponent = new IamRoleComponent(name, args);
    return {
        role: roleComponent.role,
        roleArn: roleComponent.roleArn,
        roleName: roleComponent.roleName,
    };
}
function createIamPolicy(name, args) {
    const policyComponent = new IamPolicyComponent(name, args);
    return {
        policy: policyComponent.policy,
        policyArn: policyComponent.policyArn,
        policyName: policyComponent.policyName,
    };
}
function createEc2InstanceRole(name, args) {
    const ec2RoleComponent = new Ec2InstanceRoleComponent(name, args);
    return {
        role: ec2RoleComponent.role,
        policy: ec2RoleComponent.policy,
        instanceProfile: ec2RoleComponent.instanceProfile,
        roleArn: ec2RoleComponent.roleArn,
        instanceProfileArn: ec2RoleComponent.instanceProfileArn,
    };
}
function createRdsRole(name, args) {
    const rdsRoleComponent = new RdsRoleComponent(name, args);
    return {
        role: rdsRoleComponent.role,
        policy: rdsRoleComponent.policy,
        roleArn: rdsRoleComponent.roleArn,
    };
}
function createAlbRole(name, args) {
    const albRoleComponent = new AlbRoleComponent(name, args);
    return {
        role: albRoleComponent.role,
        policy: albRoleComponent.policy,
        roleArn: albRoleComponent.roleArn,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1oQkEsc0NBT0M7QUFFRCwwQ0FVQztBQUVELHNEQVNDO0FBRUQsc0NBT0M7QUFFRCxzQ0FPQztBQW5rQkQsdURBQXlDO0FBQ3pDLGlEQUFtQztBQW1FbkMsTUFBYSxnQkFBaUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzVDLElBQUksQ0FBZTtJQUNuQixPQUFPLENBQXdCO0lBQy9CLFFBQVEsQ0FBd0I7SUFFaEQsWUFDRSxJQUFZLEVBQ1osSUFBaUIsRUFDakIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLDBCQUEwQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFbEQsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FDMUIsR0FBRyxJQUFJLE9BQU8sRUFDZDtZQUNFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDdkMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxJQUFJO1lBQ25ELElBQUksRUFBRSxXQUFXO1NBQ2xCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENB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LGdCQUFnQixDQUFDLGVBQWU7UUFDakQsT0FBTyxFQUFFLGdCQUFnQixDQUFDLE9BQU87UUFDakMsa0JBQWtCLEVBQUUsZ0JBQWdCLENBQUMsa0JBQWtCO0tBQ3hELENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLElBQVksRUFBRSxJQUFpQjtJQUMzRCxNQUFNLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFELE9BQU87UUFDTCxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsSUFBSTtRQUMzQixNQUFNLEVBQUUsZ0JBQWdCLENBQUMsTUFBTTtRQUMvQixPQUFPLEVBQUUsZ0JBQWdCLENBQUMsT0FBTztLQUNsQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxJQUFZLEVBQUUsSUFBaUI7SUFDM0QsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxRCxPQUFPO1FBQ0wsSUFBSSxFQUFFLGdCQUFnQixDQUFDLElBQUk7UUFDM0IsTUFBTSxFQUFFLGdCQUFnQixDQUFDLE1BQU07UUFDL0IsT0FBTyxFQUFFLGdCQUFnQixDQUFDLE9BQU87S0FDbEMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBJYW1Sb2xlQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgYXNzdW1lUm9sZVBvbGljeTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICBtYXhTZXNzaW9uRHVyYXRpb24/OiBudW1iZXI7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElhbVBvbGljeUFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHBvbGljeTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJYW1Sb2xlUG9saWN5QXR0YWNobWVudEFyZ3Mge1xuICByb2xlOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcG9saWN5QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJYW1JbnN0YW5jZVByb2ZpbGVBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICByb2xlOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJYW1Sb2xlUmVzdWx0IHtcbiAgcm9sZTogYXdzLmlhbS5Sb2xlO1xuICByb2xlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHJvbGVOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSWFtUG9saWN5UmVzdWx0IHtcbiAgcG9saWN5OiBhd3MuaWFtLlBvbGljeTtcbiAgcG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHBvbGljeU5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBFYzJJbnN0YW5jZVJvbGVBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBzM0J1Y2tldEFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBrbXNLZXlBcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmRzUm9sZUFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIGttc0tleUFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBzM0J1Y2tldEFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbGJSb2xlQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgczNCdWNrZXRBcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbi8vIERlZmluZSBpbnRlcmZhY2UgZm9yIElBTSBwb2xpY3kgc3RhdGVtZW50c1xuaW50ZXJmYWNlIElhbVBvbGljeVN0YXRlbWVudCB7XG4gIEVmZmVjdDogc3RyaW5nO1xuICBBY3Rpb246IHN0cmluZyB8IHN0cmluZ1tdO1xuICBSZXNvdXJjZTogc3RyaW5nIHwgc3RyaW5nW107XG4gIENvbmRpdGlvbj86IFJlY29yZDxzdHJpbmcsIFJlY29yZDxzdHJpbmcsIHN0cmluZyB8IHN0cmluZ1tdPj47XG59XG5cbmV4cG9ydCBjbGFzcyBJYW1Sb2xlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHJvbGU6IGF3cy5pYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IHJvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHJvbGVOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IElhbVJvbGVBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6aWFtOklhbVJvbGVDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICB0aGlzLnJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYCR7bmFtZX0tcm9sZWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogYXJncy5hc3N1bWVSb2xlUG9saWN5LFxuICAgICAgICBkZXNjcmlwdGlvbjogYXJncy5kZXNjcmlwdGlvbixcbiAgICAgICAgbWF4U2Vzc2lvbkR1cmF0aW9uOiBhcmdzLm1heFNlc3Npb25EdXJhdGlvbiB8fCAzNjAwLFxuICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucm9sZUFybiA9IHRoaXMucm9sZS5hcm47XG4gICAgdGhpcy5yb2xlTmFtZSA9IHRoaXMucm9sZS5uYW1lO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgcm9sZTogdGhpcy5yb2xlLFxuICAgICAgcm9sZUFybjogdGhpcy5yb2xlQXJuLFxuICAgICAgcm9sZU5hbWU6IHRoaXMucm9sZU5hbWUsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIElhbVBvbGljeUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBwb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICBwdWJsaWMgcmVhZG9ubHkgcG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwb2xpY3lOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IElhbVBvbGljeUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czppYW06SWFtUG9saWN5Q29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgdGhpcy5wb2xpY3kgPSBuZXcgYXdzLmlhbS5Qb2xpY3koXG4gICAgICBgJHtuYW1lfS1wb2xpY3lgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIHBvbGljeTogYXJncy5wb2xpY3ksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uLFxuICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucG9saWN5QXJuID0gdGhpcy5wb2xpY3kuYXJuO1xuICAgIHRoaXMucG9saWN5TmFtZSA9IHRoaXMucG9saWN5Lm5hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBwb2xpY3k6IHRoaXMucG9saWN5LFxuICAgICAgcG9saWN5QXJuOiB0aGlzLnBvbGljeUFybixcbiAgICAgIHBvbGljeU5hbWU6IHRoaXMucG9saWN5TmFtZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRWMySW5zdGFuY2VSb2xlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHJvbGU6IGF3cy5pYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IHBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZVByb2ZpbGU6IGF3cy5pYW0uSW5zdGFuY2VQcm9maWxlO1xuICBwdWJsaWMgcmVhZG9ubHkgcm9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VQcm9maWxlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEVjMkluc3RhbmNlUm9sZUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czppYW06RWMySW5zdGFuY2VSb2xlQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgYXNzdW1lUm9sZVBvbGljeSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICB7XG4gICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgIFNlcnZpY2U6ICdlYzIuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICBjb25zdCByb2xlQ29tcG9uZW50ID0gbmV3IElhbVJvbGVDb21wb25lbnQoXG4gICAgICBgJHtuYW1lfS1lYzJgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHthcmdzLm5hbWV9LWVjMi1yb2xlYCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogYXNzdW1lUm9sZVBvbGljeSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdJQU0gcm9sZSBmb3IgRUMyIGluc3RhbmNlcyB3aXRoIGxlYXN0IHByaXZpbGVnZSBhY2Nlc3MnLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnJvbGUgPSByb2xlQ29tcG9uZW50LnJvbGU7XG5cbiAgICAvLyBDcmVhdGUgcG9saWN5IHdpdGggbGVhc3QgcHJpdmlsZWdlIHBlcm1pc3Npb25zXG4gICAgY29uc3QgcG9saWN5RG9jdW1lbnQgPSBwdWx1bWlcbiAgICAgIC5hbGwoW2FyZ3MuczNCdWNrZXRBcm4sIGFyZ3Mua21zS2V5QXJuXSlcbiAgICAgIC5hcHBseSgoW3MzQXJuLCBrbXNBcm5dKSA9PiB7XG4gICAgICAgIGNvbnN0IHN0YXRlbWVudHM6IElhbVBvbGljeVN0YXRlbWVudFtdID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgICAgICAgICdsb2dzOkRlc2NyaWJlTG9nU3RyZWFtcycsXG4gICAgICAgICAgICAgICdsb2dzOkRlc2NyaWJlTG9nR3JvdXBzJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICdjbG91ZHdhdGNoOlB1dE1ldHJpY0RhdGEnLFxuICAgICAgICAgICAgICAnY2xvdWR3YXRjaDpHZXRNZXRyaWNTdGF0aXN0aWNzJyxcbiAgICAgICAgICAgICAgJ2Nsb3Vkd2F0Y2g6TGlzdE1ldHJpY3MnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgfSxcbiAgICAgICAgXTtcblxuICAgICAgICBpZiAoczNBcm4pIHtcbiAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgQWN0aW9uOiBbJ3MzOkdldE9iamVjdCcsICdzMzpQdXRPYmplY3QnXSxcbiAgICAgICAgICAgIFJlc291cmNlOiBgJHtzM0Fybn0vKmAsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIEFjdGlvbjogWydzMzpMaXN0QnVja2V0J10sXG4gICAgICAgICAgICBSZXNvdXJjZTogczNBcm4sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoa21zQXJuKSB7XG4gICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIEFjdGlvbjogWydrbXM6RGVjcnlwdCcsICdrbXM6RGVzY3JpYmVLZXknXSxcbiAgICAgICAgICAgIFJlc291cmNlOiBrbXNBcm4sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IHN0YXRlbWVudHMsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBjb25zdCBwb2xpY3lDb21wb25lbnQgPSBuZXcgSWFtUG9saWN5Q29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tcG9saWN5YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1lYzItcG9saWN5YCxcbiAgICAgICAgcG9saWN5OiBwb2xpY3lEb2N1bWVudCxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ1BvbGljeSBmb3IgRUMyIGluc3RhbmNlcyB3aXRoIG1pbmltYWwgcmVxdWlyZWQgcGVybWlzc2lvbnMnLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnBvbGljeSA9IHBvbGljeUNvbXBvbmVudC5wb2xpY3k7XG5cbiAgICAvLyBBdHRhY2ggcG9saWN5IHRvIHJvbGVcbiAgICBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5QXR0YWNobWVudChcbiAgICAgIGAke25hbWV9LWF0dGFjaG1lbnRgLFxuICAgICAge1xuICAgICAgICByb2xlOiB0aGlzLnJvbGUubmFtZSxcbiAgICAgICAgcG9saWN5QXJuOiB0aGlzLnBvbGljeS5hcm4sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgaW5zdGFuY2UgcHJvZmlsZVxuICAgIHRoaXMuaW5zdGFuY2VQcm9maWxlID0gbmV3IGF3cy5pYW0uSW5zdGFuY2VQcm9maWxlKFxuICAgICAgYCR7bmFtZX0tcHJvZmlsZWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tZWMyLXByb2ZpbGVgLFxuICAgICAgICByb2xlOiB0aGlzLnJvbGUubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucm9sZUFybiA9IHRoaXMucm9sZS5hcm47XG4gICAgdGhpcy5pbnN0YW5jZVByb2ZpbGVBcm4gPSB0aGlzLmluc3RhbmNlUHJvZmlsZS5hcm47XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICByb2xlOiB0aGlzLnJvbGUsXG4gICAgICBwb2xpY3k6IHRoaXMucG9saWN5LFxuICAgICAgaW5zdGFuY2VQcm9maWxlOiB0aGlzLmluc3RhbmNlUHJvZmlsZSxcbiAgICAgIHJvbGVBcm46IHRoaXMucm9sZUFybixcbiAgICAgIGluc3RhbmNlUHJvZmlsZUFybjogdGhpcy5pbnN0YW5jZVByb2ZpbGVBcm4sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJkc1JvbGVDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgcm9sZTogYXdzLmlhbS5Sb2xlO1xuICBwdWJsaWMgcmVhZG9ubHkgcG9saWN5OiBhd3MuaWFtLlBvbGljeTtcbiAgcHVibGljIHJlYWRvbmx5IHJvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogUmRzUm9sZUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czppYW06UmRzUm9sZUNvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGFzc3VtZVJvbGVQb2xpY3kgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAge1xuICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICBTZXJ2aWNlOiAncmRzLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgcm9sZUNvbXBvbmVudCA9IG5ldyBJYW1Sb2xlQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tcmRzYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1yZHMtcm9sZWAsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IGFzc3VtZVJvbGVQb2xpY3ksXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnSUFNIHJvbGUgZm9yIFJEUyB3aXRoIG1vbml0b3JpbmcgYW5kIGJhY2t1cCBwZXJtaXNzaW9ucycsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucm9sZSA9IHJvbGVDb21wb25lbnQucm9sZTtcblxuICAgIC8vIENyZWF0ZSBwb2xpY3kgd2l0aCBSRFMtc3BlY2lmaWMgcGVybWlzc2lvbnNcbiAgICBjb25zdCBwb2xpY3lEb2N1bWVudCA9IHB1bHVtaVxuICAgICAgLmFsbChbYXJncy5zM0J1Y2tldEFybiwgYXJncy5rbXNLZXlBcm5dKVxuICAgICAgLmFwcGx5KChbczNBcm4sIGttc0Fybl0pID0+IHtcbiAgICAgICAgY29uc3Qgc3RhdGVtZW50czogSWFtUG9saWN5U3RhdGVtZW50W10gPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICdsb2dzOkNyZWF0ZUxvZ0dyb3VwJyxcbiAgICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nU3RyZWFtJyxcbiAgICAgICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zJyxcbiAgICAgICAgICAgICAgJ2xvZ3M6RGVzY3JpYmVMb2dHcm91cHMnLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBBY3Rpb246IFsnY2xvdWR3YXRjaDpQdXRNZXRyaWNEYXRhJ10sXG4gICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgIH0sXG4gICAgICAgIF07XG5cbiAgICAgICAgaWYgKHMzQXJuKSB7XG4gICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIEFjdGlvbjogWydzMzpHZXRPYmplY3QnLCAnczM6UHV0T2JqZWN0JywgJ3MzOkRlbGV0ZU9iamVjdCddLFxuICAgICAgICAgICAgUmVzb3VyY2U6IGAke3MzQXJufS9iYWNrdXBzLypgLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHN0YXRlbWVudHMucHVzaCh7XG4gICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICBBY3Rpb246IFsnczM6TGlzdEJ1Y2tldCddLFxuICAgICAgICAgICAgUmVzb3VyY2U6IHMzQXJuLFxuICAgICAgICAgICAgQ29uZGl0aW9uOiB7XG4gICAgICAgICAgICAgIFN0cmluZ0xpa2U6IHtcbiAgICAgICAgICAgICAgICAnczM6cHJlZml4JzogWydiYWNrdXBzLyonXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoa21zQXJuKSB7XG4gICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAna21zOkRlY3J5cHQnLFxuICAgICAgICAgICAgICAna21zOkRlc2NyaWJlS2V5JyxcbiAgICAgICAgICAgICAgJ2ttczpFbmNyeXB0JyxcbiAgICAgICAgICAgICAgJ2ttczpHZW5lcmF0ZURhdGFLZXknLFxuICAgICAgICAgICAgICAna21zOlJlRW5jcnlwdConLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFJlc291cmNlOiBrbXNBcm4sXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IHN0YXRlbWVudHMsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICBjb25zdCBwb2xpY3lDb21wb25lbnQgPSBuZXcgSWFtUG9saWN5Q29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tcG9saWN5YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1yZHMtcG9saWN5YCxcbiAgICAgICAgcG9saWN5OiBwb2xpY3lEb2N1bWVudCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdQb2xpY3kgZm9yIFJEUyB3aXRoIGJhY2t1cCBhbmQgbW9uaXRvcmluZyBwZXJtaXNzaW9ucycsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucG9saWN5ID0gcG9saWN5Q29tcG9uZW50LnBvbGljeTtcblxuICAgIC8vIEF0dGFjaCBwb2xpY3kgdG8gcm9sZVxuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYCR7bmFtZX0tYXR0YWNobWVudGAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IHRoaXMucm9sZS5uYW1lLFxuICAgICAgICBwb2xpY3lBcm46IHRoaXMucG9saWN5LmFybixcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucm9sZUFybiA9IHRoaXMucm9sZS5hcm47XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICByb2xlOiB0aGlzLnJvbGUsXG4gICAgICBwb2xpY3k6IHRoaXMucG9saWN5LFxuICAgICAgcm9sZUFybjogdGhpcy5yb2xlQXJuLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBbGJSb2xlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHJvbGU6IGF3cy5pYW0uUm9sZTtcbiAgcHVibGljIHJlYWRvbmx5IHBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSByb2xlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEFsYlJvbGVBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6aWFtOkFsYlJvbGVDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBhc3N1bWVSb2xlUG9saWN5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgU2VydmljZTogJ2VsYXN0aWNsb2FkYmFsYW5jaW5nLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgcm9sZUNvbXBvbmVudCA9IG5ldyBJYW1Sb2xlQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tYWxiYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1hbGItcm9sZWAsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IGFzc3VtZVJvbGVQb2xpY3ksXG4gICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICdJQU0gcm9sZSBmb3IgQXBwbGljYXRpb24gTG9hZCBCYWxhbmNlciB3aXRoIGxvZ2dpbmcgcGVybWlzc2lvbnMnLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnJvbGUgPSByb2xlQ29tcG9uZW50LnJvbGU7XG5cbiAgICAvLyBDcmVhdGUgcG9saWN5IGZvciBBTEIgYWNjZXNzIGxvZ3NcbiAgICBjb25zdCBwb2xpY3lEb2N1bWVudCA9IHB1bHVtaS5hbGwoW2FyZ3MuczNCdWNrZXRBcm5dKS5hcHBseSgoW3MzQXJuXSkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGVtZW50czogSWFtUG9saWN5U3RhdGVtZW50W10gPSBbXG4gICAgICAgIHtcbiAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dHcm91cCcsXG4gICAgICAgICAgICAnbG9nczpDcmVhdGVMb2dTdHJlYW0nLFxuICAgICAgICAgICAgJ2xvZ3M6UHV0TG9nRXZlbnRzJyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgIH0sXG4gICAgICBdO1xuXG4gICAgICBpZiAoczNBcm4pIHtcbiAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgQWN0aW9uOiBbJ3MzOlB1dE9iamVjdCddLFxuICAgICAgICAgIFJlc291cmNlOiBgJHtzM0Fybn0vYWxiLWxvZ3MvKmAsXG4gICAgICAgIH0pO1xuICAgICAgICBzdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICBBY3Rpb246IFsnczM6R2V0QnVja2V0QWNsJ10sXG4gICAgICAgICAgUmVzb3VyY2U6IHMzQXJuLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICBTdGF0ZW1lbnQ6IHN0YXRlbWVudHMsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHBvbGljeUNvbXBvbmVudCA9IG5ldyBJYW1Qb2xpY3lDb21wb25lbnQoXG4gICAgICBgJHtuYW1lfS1wb2xpY3lgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHthcmdzLm5hbWV9LWFsYi1wb2xpY3lgLFxuICAgICAgICBwb2xpY3k6IHBvbGljeURvY3VtZW50LFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1BvbGljeSBmb3IgQUxCIHdpdGggbG9nZ2luZyBwZXJtaXNzaW9ucycsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucG9saWN5ID0gcG9saWN5Q29tcG9uZW50LnBvbGljeTtcblxuICAgIC8vIEF0dGFjaCBwb2xpY3kgdG8gcm9sZVxuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYCR7bmFtZX0tYXR0YWNobWVudGAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IHRoaXMucm9sZS5uYW1lLFxuICAgICAgICBwb2xpY3lBcm46IHRoaXMucG9saWN5LmFybixcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucm9sZUFybiA9IHRoaXMucm9sZS5hcm47XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICByb2xlOiB0aGlzLnJvbGUsXG4gICAgICBwb2xpY3k6IHRoaXMucG9saWN5LFxuICAgICAgcm9sZUFybjogdGhpcy5yb2xlQXJuLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJYW1Sb2xlKG5hbWU6IHN0cmluZywgYXJnczogSWFtUm9sZUFyZ3MpOiBJYW1Sb2xlUmVzdWx0IHtcbiAgY29uc3Qgcm9sZUNvbXBvbmVudCA9IG5ldyBJYW1Sb2xlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICByZXR1cm4ge1xuICAgIHJvbGU6IHJvbGVDb21wb25lbnQucm9sZSxcbiAgICByb2xlQXJuOiByb2xlQ29tcG9uZW50LnJvbGVBcm4sXG4gICAgcm9sZU5hbWU6IHJvbGVDb21wb25lbnQucm9sZU5hbWUsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJYW1Qb2xpY3koXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogSWFtUG9saWN5QXJnc1xuKTogSWFtUG9saWN5UmVzdWx0IHtcbiAgY29uc3QgcG9saWN5Q29tcG9uZW50ID0gbmV3IElhbVBvbGljeUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgcmV0dXJuIHtcbiAgICBwb2xpY3k6IHBvbGljeUNvbXBvbmVudC5wb2xpY3ksXG4gICAgcG9saWN5QXJuOiBwb2xpY3lDb21wb25lbnQucG9saWN5QXJuLFxuICAgIHBvbGljeU5hbWU6IHBvbGljeUNvbXBvbmVudC5wb2xpY3lOYW1lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWMySW5zdGFuY2VSb2xlKG5hbWU6IHN0cmluZywgYXJnczogRWMySW5zdGFuY2VSb2xlQXJncykge1xuICBjb25zdCBlYzJSb2xlQ29tcG9uZW50ID0gbmV3IEVjMkluc3RhbmNlUm9sZUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgcmV0dXJuIHtcbiAgICByb2xlOiBlYzJSb2xlQ29tcG9uZW50LnJvbGUsXG4gICAgcG9saWN5OiBlYzJSb2xlQ29tcG9uZW50LnBvbGljeSxcbiAgICBpbnN0YW5jZVByb2ZpbGU6IGVjMlJvbGVDb21wb25lbnQuaW5zdGFuY2VQcm9maWxlLFxuICAgIHJvbGVBcm46IGVjMlJvbGVDb21wb25lbnQucm9sZUFybixcbiAgICBpbnN0YW5jZVByb2ZpbGVBcm46IGVjMlJvbGVDb21wb25lbnQuaW5zdGFuY2VQcm9maWxlQXJuLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmRzUm9sZShuYW1lOiBzdHJpbmcsIGFyZ3M6IFJkc1JvbGVBcmdzKSB7XG4gIGNvbnN0IHJkc1JvbGVDb21wb25lbnQgPSBuZXcgUmRzUm9sZUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgcmV0dXJuIHtcbiAgICByb2xlOiByZHNSb2xlQ29tcG9uZW50LnJvbGUsXG4gICAgcG9saWN5OiByZHNSb2xlQ29tcG9uZW50LnBvbGljeSxcbiAgICByb2xlQXJuOiByZHNSb2xlQ29tcG9uZW50LnJvbGVBcm4sXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBbGJSb2xlKG5hbWU6IHN0cmluZywgYXJnczogQWxiUm9sZUFyZ3MpIHtcbiAgY29uc3QgYWxiUm9sZUNvbXBvbmVudCA9IG5ldyBBbGJSb2xlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICByZXR1cm4ge1xuICAgIHJvbGU6IGFsYlJvbGVDb21wb25lbnQucm9sZSxcbiAgICBwb2xpY3k6IGFsYlJvbGVDb21wb25lbnQucG9saWN5LFxuICAgIHJvbGVBcm46IGFsYlJvbGVDb21wb25lbnQucm9sZUFybixcbiAgfTtcbn1cbiJdfQ==