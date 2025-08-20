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
        super("aws:iam:IamRoleComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
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
        super("aws:iam:IamPolicyComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
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
        super("aws:iam:Ec2InstanceRoleComponent", name, {}, opts);
        const assumeRolePolicy = JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "ec2.amazonaws.com",
                    },
                }],
        });
        const roleComponent = new IamRoleComponent(`${name}-ec2`, {
            name: `${args.name}-ec2-role`,
            assumeRolePolicy: assumeRolePolicy,
            description: "IAM role for EC2 instances with least privilege access",
            tags: args.tags,
        }, { parent: this });
        this.role = roleComponent.role;
        // Create policy with least privilege permissions
        const policyDocument = pulumi.all([args.s3BucketArn, args.kmsKeyArn]).apply(([s3Arn, kmsArn]) => {
            const statements = [
                {
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams",
                        "logs:DescribeLogGroups",
                    ],
                    Resource: "*",
                },
                {
                    Effect: "Allow",
                    Action: [
                        "cloudwatch:PutMetricData",
                        "cloudwatch:GetMetricStatistics",
                        "cloudwatch:ListMetrics",
                    ],
                    Resource: "*",
                },
            ];
            if (s3Arn) {
                statements.push({
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                    ],
                    Resource: `${s3Arn}/*`,
                });
                statements.push({
                    Effect: "Allow",
                    Action: [
                        "s3:ListBucket",
                    ],
                    Resource: s3Arn,
                });
            }
            if (kmsArn) {
                statements.push({
                    Effect: "Allow",
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                    ],
                    Resource: kmsArn,
                });
            }
            return JSON.stringify({
                Version: "2012-10-17",
                Statement: statements,
            });
        });
        const policyComponent = new IamPolicyComponent(`${name}-policy`, {
            name: `${args.name}-ec2-policy`,
            policy: policyDocument,
            description: "Policy for EC2 instances with minimal required permissions",
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
        super("aws:iam:RdsRoleComponent", name, {}, opts);
        const assumeRolePolicy = JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "rds.amazonaws.com",
                    },
                }],
        });
        const roleComponent = new IamRoleComponent(`${name}-rds`, {
            name: `${args.name}-rds-role`,
            assumeRolePolicy: assumeRolePolicy,
            description: "IAM role for RDS with monitoring and backup permissions",
            tags: args.tags,
        }, { parent: this });
        this.role = roleComponent.role;
        // Create policy with RDS-specific permissions
        const policyDocument = pulumi.all([args.s3BucketArn, args.kmsKeyArn]).apply(([s3Arn, kmsArn]) => {
            const statements = [
                {
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                        "logs:DescribeLogStreams",
                        "logs:DescribeLogGroups",
                    ],
                    Resource: "*",
                },
                {
                    Effect: "Allow",
                    Action: [
                        "cloudwatch:PutMetricData",
                    ],
                    Resource: "*",
                },
            ];
            if (s3Arn) {
                statements.push({
                    Effect: "Allow",
                    Action: [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                    ],
                    Resource: `${s3Arn}/backups/*`,
                });
                statements.push({
                    Effect: "Allow",
                    Action: [
                        "s3:ListBucket",
                    ],
                    Resource: s3Arn,
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["backups/*"],
                        },
                    },
                });
            }
            if (kmsArn) {
                statements.push({
                    Effect: "Allow",
                    Action: [
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey",
                        "kms:ReEncrypt*",
                    ],
                    Resource: kmsArn,
                });
            }
            return JSON.stringify({
                Version: "2012-10-17",
                Statement: statements,
            });
        });
        const policyComponent = new IamPolicyComponent(`${name}-policy`, {
            name: `${args.name}-rds-policy`,
            policy: policyDocument,
            description: "Policy for RDS with backup and monitoring permissions",
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
        super("aws:iam:AlbRoleComponent", name, {}, opts);
        const assumeRolePolicy = JSON.stringify({
            Version: "2012-10-17",
            Statement: [{
                    Action: "sts:AssumeRole",
                    Effect: "Allow",
                    Principal: {
                        Service: "elasticloadbalancing.amazonaws.com",
                    },
                }],
        });
        const roleComponent = new IamRoleComponent(`${name}-alb`, {
            name: `${args.name}-alb-role`,
            assumeRolePolicy: assumeRolePolicy,
            description: "IAM role for Application Load Balancer with logging permissions",
            tags: args.tags,
        }, { parent: this });
        this.role = roleComponent.role;
        // Create policy for ALB access logs
        const policyDocument = pulumi.all([args.s3BucketArn]).apply(([s3Arn]) => {
            const statements = [
                {
                    Effect: "Allow",
                    Action: [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                    ],
                    Resource: "*",
                },
            ];
            if (s3Arn) {
                statements.push({
                    Effect: "Allow",
                    Action: [
                        "s3:PutObject",
                    ],
                    Resource: `${s3Arn}/alb-logs/*`,
                });
                statements.push({
                    Effect: "Allow",
                    Action: [
                        "s3:GetBucketAcl",
                    ],
                    Resource: s3Arn,
                });
            }
            return JSON.stringify({
                Version: "2012-10-17",
                Statement: statements,
            });
        });
        const policyComponent = new IamPolicyComponent(`${name}-policy`, {
            name: `${args.name}-alb-policy`,
            policy: policyDocument,
            description: "Policy for ALB with logging permissions",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQStjQSxzQ0FPQztBQUVELDBDQU9DO0FBRUQsc0RBU0M7QUFFRCxzQ0FPQztBQUVELHNDQU9DO0FBNWZELHVEQUF5QztBQUN6QyxpREFBbUM7QUEyRG5DLE1BQWEsZ0JBQWlCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUMxQyxJQUFJLENBQWU7SUFDbkIsT0FBTyxDQUF3QjtJQUMvQixRQUFRLENBQXdCO0lBRWhELFlBQVksSUFBWSxFQUFFLElBQWlCLEVBQUUsSUFBc0M7UUFDL0UsS0FBSyxDQUFDLDBCQUEwQixFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFbEQsTUFBTSxXQUFXLEdBQUc7WUFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2YsQ0FBQztRQUVGLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFO1lBQ3pDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLGdCQUFnQixFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDdkMsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxJQUFJO1lBQ25ELElBQUksRUFBRSxXQUFXO1NBQ3BCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMs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Z0JBQWdCLENBQUMsZUFBZTtRQUNqRCxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsT0FBTztRQUNqQyxrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxrQkFBa0I7S0FDMUQsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQixhQUFhLENBQUMsSUFBWSxFQUFFLElBQWlCO0lBQ3pELE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUQsT0FBTztRQUNILElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxJQUFJO1FBQzNCLE1BQU0sRUFBRSxnQkFBZ0IsQ0FBQyxNQUFNO1FBQy9CLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxPQUFPO0tBQ3BDLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLElBQVksRUFBRSxJQUFpQjtJQUN6RCxNQUFNLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFELE9BQU87UUFDSCxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsSUFBSTtRQUMzQixNQUFNLEVBQUUsZ0JBQWdCLENBQUMsTUFBTTtRQUMvQixPQUFPLEVBQUUsZ0JBQWdCLENBQUMsT0FBTztLQUNwQyxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBJYW1Sb2xlQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGFzc3VtZVJvbGVQb2xpY3k6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIG1heFNlc3Npb25EdXJhdGlvbj86IG51bWJlcjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJYW1Qb2xpY3lBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgcG9saWN5OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJYW1Sb2xlUG9saWN5QXR0YWNobWVudEFyZ3Mge1xuICAgIHJvbGU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHBvbGljeUFybjogcHVsdW1pLklucHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSWFtSW5zdGFuY2VQcm9maWxlQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHJvbGU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElhbVJvbGVSZXN1bHQge1xuICAgIHJvbGU6IGF3cy5pYW0uUm9sZTtcbiAgICByb2xlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcm9sZU5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJYW1Qb2xpY3lSZXN1bHQge1xuICAgIHBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG4gICAgcG9saWN5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcG9saWN5TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEVjMkluc3RhbmNlUm9sZUFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBzM0J1Y2tldEFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGttc0tleUFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJkc1JvbGVBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAga21zS2V5QXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgczNCdWNrZXRBcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBbGJSb2xlQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHMzQnVja2V0QXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBJYW1Sb2xlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm9sZTogYXdzLmlhbS5Sb2xlO1xuICAgIHB1YmxpYyByZWFkb25seSByb2xlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IHJvbGVOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IElhbVJvbGVBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czppYW06SWFtUm9sZUNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICAgICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICAgICAgICBNYW5hZ2VkQnk6IFwiUHVsdW1pXCIsXG4gICAgICAgICAgICBQcm9qZWN0OiBcIkFXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nXCIsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yb2xlID0gbmV3IGF3cy5pYW0uUm9sZShgJHtuYW1lfS1yb2xlYCwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogYXJncy5hc3N1bWVSb2xlUG9saWN5LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGFyZ3MuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBtYXhTZXNzaW9uRHVyYXRpb246IGFyZ3MubWF4U2Vzc2lvbkR1cmF0aW9uIHx8IDM2MDAsXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5yb2xlQXJuID0gdGhpcy5yb2xlLmFybjtcbiAgICAgICAgdGhpcy5yb2xlTmFtZSA9IHRoaXMucm9sZS5uYW1lO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHJvbGU6IHRoaXMucm9sZSxcbiAgICAgICAgICAgIHJvbGVBcm46IHRoaXMucm9sZUFybixcbiAgICAgICAgICAgIHJvbGVOYW1lOiB0aGlzLnJvbGVOYW1lLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJYW1Qb2xpY3lDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBwb2xpY3k6IGF3cy5pYW0uUG9saWN5O1xuICAgIHB1YmxpYyByZWFkb25seSBwb2xpY3lBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcG9saWN5TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBJYW1Qb2xpY3lBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czppYW06SWFtUG9saWN5Q29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnBvbGljeSA9IG5ldyBhd3MuaWFtLlBvbGljeShgJHtuYW1lfS1wb2xpY3lgLCB7XG4gICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBwb2xpY3k6IGFyZ3MucG9saWN5LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGFyZ3MuZGVzY3JpcHRpb24sXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5wb2xpY3lBcm4gPSB0aGlzLnBvbGljeS5hcm47XG4gICAgICAgIHRoaXMucG9saWN5TmFtZSA9IHRoaXMucG9saWN5Lm5hbWU7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgcG9saWN5OiB0aGlzLnBvbGljeSxcbiAgICAgICAgICAgIHBvbGljeUFybjogdGhpcy5wb2xpY3lBcm4sXG4gICAgICAgICAgICBwb2xpY3lOYW1lOiB0aGlzLnBvbGljeU5hbWUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEVjMkluc3RhbmNlUm9sZUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHJvbGU6IGF3cy5pYW0uUm9sZTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcG9saWN5OiBhd3MuaWFtLlBvbGljeTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VQcm9maWxlOiBhd3MuaWFtLkluc3RhbmNlUHJvZmlsZTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZVByb2ZpbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogRWMySW5zdGFuY2VSb2xlQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6aWFtOkVjMkluc3RhbmNlUm9sZUNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgYXNzdW1lUm9sZVBvbGljeSA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICAgICAgU3RhdGVtZW50OiBbe1xuICAgICAgICAgICAgICAgIEFjdGlvbjogXCJzdHM6QXNzdW1lUm9sZVwiLFxuICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlOiBcImVjMi5hbWF6b25hd3MuY29tXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH1dLFxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCByb2xlQ29tcG9uZW50ID0gbmV3IElhbVJvbGVDb21wb25lbnQoYCR7bmFtZX0tZWMyYCwge1xuICAgICAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1lYzItcm9sZWAsXG4gICAgICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBhc3N1bWVSb2xlUG9saWN5LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiSUFNIHJvbGUgZm9yIEVDMiBpbnN0YW5jZXMgd2l0aCBsZWFzdCBwcml2aWxlZ2UgYWNjZXNzXCIsXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucm9sZSA9IHJvbGVDb21wb25lbnQucm9sZTtcblxuICAgICAgICAvLyBDcmVhdGUgcG9saWN5IHdpdGggbGVhc3QgcHJpdmlsZWdlIHBlcm1pc3Npb25zXG4gICAgICAgIGNvbnN0IHBvbGljeURvY3VtZW50ID0gcHVsdW1pLmFsbChbYXJncy5zM0J1Y2tldEFybiwgYXJncy5rbXNLZXlBcm5dKS5hcHBseSgoW3MzQXJuLCBrbXNBcm5dKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdGF0ZW1lbnRzOiBhbnlbXSA9IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dHcm91cFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ1N0cmVhbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOlB1dExvZ0V2ZW50c1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOkRlc2NyaWJlTG9nU3RyZWFtc1wiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOkRlc2NyaWJlTG9nR3JvdXBzXCIsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBcIipcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJjbG91ZHdhdGNoOlB1dE1ldHJpY0RhdGFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY2xvdWR3YXRjaDpHZXRNZXRyaWNTdGF0aXN0aWNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNsb3Vkd2F0Y2g6TGlzdE1ldHJpY3NcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFwiKlwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICBpZiAoczNBcm4pIHtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBcInMzOkdldE9iamVjdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzMzpQdXRPYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IGAke3MzQXJufS8qYCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBcInMzOkxpc3RCdWNrZXRcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IHMzQXJuLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoa21zQXJuKSB7XG4gICAgICAgICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RGVjcnlwdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RGVzY3JpYmVLZXlcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IGttc0FybixcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IHN0YXRlbWVudHMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcG9saWN5Q29tcG9uZW50ID0gbmV3IElhbVBvbGljeUNvbXBvbmVudChgJHtuYW1lfS1wb2xpY3lgLCB7XG4gICAgICAgICAgICBuYW1lOiBgJHthcmdzLm5hbWV9LWVjMi1wb2xpY3lgLFxuICAgICAgICAgICAgcG9saWN5OiBwb2xpY3lEb2N1bWVudCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlBvbGljeSBmb3IgRUMyIGluc3RhbmNlcyB3aXRoIG1pbmltYWwgcmVxdWlyZWQgcGVybWlzc2lvbnNcIixcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5wb2xpY3kgPSBwb2xpY3lDb21wb25lbnQucG9saWN5O1xuXG4gICAgICAgIC8vIEF0dGFjaCBwb2xpY3kgdG8gcm9sZVxuICAgICAgICBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5QXR0YWNobWVudChgJHtuYW1lfS1hdHRhY2htZW50YCwge1xuICAgICAgICAgICAgcm9sZTogdGhpcy5yb2xlLm5hbWUsXG4gICAgICAgICAgICBwb2xpY3lBcm46IHRoaXMucG9saWN5LmFybixcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgLy8gQ3JlYXRlIGluc3RhbmNlIHByb2ZpbGVcbiAgICAgICAgdGhpcy5pbnN0YW5jZVByb2ZpbGUgPSBuZXcgYXdzLmlhbS5JbnN0YW5jZVByb2ZpbGUoYCR7bmFtZX0tcHJvZmlsZWAsIHtcbiAgICAgICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tZWMyLXByb2ZpbGVgLFxuICAgICAgICAgICAgcm9sZTogdGhpcy5yb2xlLm5hbWUsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucm9sZUFybiA9IHRoaXMucm9sZS5hcm47XG4gICAgICAgIHRoaXMuaW5zdGFuY2VQcm9maWxlQXJuID0gdGhpcy5pbnN0YW5jZVByb2ZpbGUuYXJuO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHJvbGU6IHRoaXMucm9sZSxcbiAgICAgICAgICAgIHBvbGljeTogdGhpcy5wb2xpY3ksXG4gICAgICAgICAgICBpbnN0YW5jZVByb2ZpbGU6IHRoaXMuaW5zdGFuY2VQcm9maWxlLFxuICAgICAgICAgICAgcm9sZUFybjogdGhpcy5yb2xlQXJuLFxuICAgICAgICAgICAgaW5zdGFuY2VQcm9maWxlQXJuOiB0aGlzLmluc3RhbmNlUHJvZmlsZUFybixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmRzUm9sZUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHJvbGU6IGF3cy5pYW0uUm9sZTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcG9saWN5OiBhd3MuaWFtLlBvbGljeTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcm9sZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBSZHNSb2xlQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6aWFtOlJkc1JvbGVDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGFzc3VtZVJvbGVQb2xpY3kgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBWZXJzaW9uOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICAgIFN0YXRlbWVudDogW3tcbiAgICAgICAgICAgICAgICBBY3Rpb246IFwic3RzOkFzc3VtZVJvbGVcIixcbiAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICAgICAgU2VydmljZTogXCJyZHMuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgcm9sZUNvbXBvbmVudCA9IG5ldyBJYW1Sb2xlQ29tcG9uZW50KGAke25hbWV9LXJkc2AsIHtcbiAgICAgICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tcmRzLXJvbGVgLFxuICAgICAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogYXNzdW1lUm9sZVBvbGljeSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIklBTSByb2xlIGZvciBSRFMgd2l0aCBtb25pdG9yaW5nIGFuZCBiYWNrdXAgcGVybWlzc2lvbnNcIixcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5yb2xlID0gcm9sZUNvbXBvbmVudC5yb2xlO1xuXG4gICAgICAgIC8vIENyZWF0ZSBwb2xpY3kgd2l0aCBSRFMtc3BlY2lmaWMgcGVybWlzc2lvbnNcbiAgICAgICAgY29uc3QgcG9saWN5RG9jdW1lbnQgPSBwdWx1bWkuYWxsKFthcmdzLnMzQnVja2V0QXJuLCBhcmdzLmttc0tleUFybl0pLmFwcGx5KChbczNBcm4sIGttc0Fybl0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlbWVudHM6IGFueVtdID0gW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ0dyb3VwXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ3M6Q3JlYXRlTG9nU3RyZWFtXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ3M6UHV0TG9nRXZlbnRzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ3M6RGVzY3JpYmVMb2dHcm91cHNcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IFwiKlwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNsb3Vkd2F0Y2g6UHV0TWV0cmljRGF0YVwiLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogXCIqXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGlmIChzM0Fybikge1xuICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiczM6R2V0T2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInMzOlB1dE9iamVjdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzMzpEZWxldGVPYmplY3RcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IGAke3MzQXJufS9iYWNrdXBzLypgLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiczM6TGlzdEJ1Y2tldFwiLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogczNBcm4sXG4gICAgICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgU3RyaW5nTGlrZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiczM6cHJlZml4XCI6IFtcImJhY2t1cHMvKlwiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChrbXNBcm4pIHtcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICBcImttczpEZWNyeXB0XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImttczpEZXNjcmliZUtleVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6RW5jcnlwdFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJrbXM6R2VuZXJhdGVEYXRhS2V5XCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImttczpSZUVuY3J5cHQqXCIsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBrbXNBcm4sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgVmVyc2lvbjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgICAgICAgICAgU3RhdGVtZW50OiBzdGF0ZW1lbnRzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGNvbnN0IHBvbGljeUNvbXBvbmVudCA9IG5ldyBJYW1Qb2xpY3lDb21wb25lbnQoYCR7bmFtZX0tcG9saWN5YCwge1xuICAgICAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1yZHMtcG9saWN5YCxcbiAgICAgICAgICAgIHBvbGljeTogcG9saWN5RG9jdW1lbnQsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJQb2xpY3kgZm9yIFJEUyB3aXRoIGJhY2t1cCBhbmQgbW9uaXRvcmluZyBwZXJtaXNzaW9uc1wiLFxuICAgICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnBvbGljeSA9IHBvbGljeUNvbXBvbmVudC5wb2xpY3k7XG5cbiAgICAgICAgLy8gQXR0YWNoIHBvbGljeSB0byByb2xlXG4gICAgICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KGAke25hbWV9LWF0dGFjaG1lbnRgLCB7XG4gICAgICAgICAgICByb2xlOiB0aGlzLnJvbGUubmFtZSxcbiAgICAgICAgICAgIHBvbGljeUFybjogdGhpcy5wb2xpY3kuYXJuLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnJvbGVBcm4gPSB0aGlzLnJvbGUuYXJuO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHJvbGU6IHRoaXMucm9sZSxcbiAgICAgICAgICAgIHBvbGljeTogdGhpcy5wb2xpY3ksXG4gICAgICAgICAgICByb2xlQXJuOiB0aGlzLnJvbGVBcm4sXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFsYlJvbGVDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSByb2xlOiBhd3MuaWFtLlJvbGU7XG4gICAgcHVibGljIHJlYWRvbmx5IHBvbGljeTogYXdzLmlhbS5Qb2xpY3k7XG4gICAgcHVibGljIHJlYWRvbmx5IHJvbGVBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogQWxiUm9sZUFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmlhbTpBbGJSb2xlQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBhc3N1bWVSb2xlUG9saWN5ID0gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgVmVyc2lvbjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgICAgICBTdGF0ZW1lbnQ6IFt7XG4gICAgICAgICAgICAgICAgQWN0aW9uOiBcInN0czpBc3N1bWVSb2xlXCIsXG4gICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6IFwiZWxhc3RpY2xvYWRiYWxhbmNpbmcuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3Qgcm9sZUNvbXBvbmVudCA9IG5ldyBJYW1Sb2xlQ29tcG9uZW50KGAke25hbWV9LWFsYmAsIHtcbiAgICAgICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tYWxiLXJvbGVgLFxuICAgICAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogYXNzdW1lUm9sZVBvbGljeSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIklBTSByb2xlIGZvciBBcHBsaWNhdGlvbiBMb2FkIEJhbGFuY2VyIHdpdGggbG9nZ2luZyBwZXJtaXNzaW9uc1wiLFxuICAgICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnJvbGUgPSByb2xlQ29tcG9uZW50LnJvbGU7XG5cbiAgICAgICAgLy8gQ3JlYXRlIHBvbGljeSBmb3IgQUxCIGFjY2VzcyBsb2dzXG4gICAgICAgIGNvbnN0IHBvbGljeURvY3VtZW50ID0gcHVsdW1pLmFsbChbYXJncy5zM0J1Y2tldEFybl0pLmFwcGx5KChbczNBcm5dKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBzdGF0ZW1lbnRzOiBhbnlbXSA9IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dHcm91cFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ1N0cmVhbVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOlB1dExvZ0V2ZW50c1wiLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICBSZXNvdXJjZTogXCIqXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIGlmIChzM0Fybikge1xuICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxuICAgICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiczM6UHV0T2JqZWN0XCIsXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIFJlc291cmNlOiBgJHtzM0Fybn0vYWxiLWxvZ3MvKmAsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXG4gICAgICAgICAgICAgICAgICAgIEFjdGlvbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJzMzpHZXRCdWNrZXRBY2xcIixcbiAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IHMzQXJuLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICAgICAgICAgIFN0YXRlbWVudDogc3RhdGVtZW50cyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBwb2xpY3lDb21wb25lbnQgPSBuZXcgSWFtUG9saWN5Q29tcG9uZW50KGAke25hbWV9LXBvbGljeWAsIHtcbiAgICAgICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tYWxiLXBvbGljeWAsXG4gICAgICAgICAgICBwb2xpY3k6IHBvbGljeURvY3VtZW50LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiUG9saWN5IGZvciBBTEIgd2l0aCBsb2dnaW5nIHBlcm1pc3Npb25zXCIsXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucG9saWN5ID0gcG9saWN5Q29tcG9uZW50LnBvbGljeTtcblxuICAgICAgICAvLyBBdHRhY2ggcG9saWN5IHRvIHJvbGVcbiAgICAgICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoYCR7bmFtZX0tYXR0YWNobWVudGAsIHtcbiAgICAgICAgICAgIHJvbGU6IHRoaXMucm9sZS5uYW1lLFxuICAgICAgICAgICAgcG9saWN5QXJuOiB0aGlzLnBvbGljeS5hcm4sXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucm9sZUFybiA9IHRoaXMucm9sZS5hcm47XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgcm9sZTogdGhpcy5yb2xlLFxuICAgICAgICAgICAgcG9saWN5OiB0aGlzLnBvbGljeSxcbiAgICAgICAgICAgIHJvbGVBcm46IHRoaXMucm9sZUFybixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSWFtUm9sZShuYW1lOiBzdHJpbmcsIGFyZ3M6IElhbVJvbGVBcmdzKTogSWFtUm9sZVJlc3VsdCB7XG4gICAgY29uc3Qgcm9sZUNvbXBvbmVudCA9IG5ldyBJYW1Sb2xlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJvbGU6IHJvbGVDb21wb25lbnQucm9sZSxcbiAgICAgICAgcm9sZUFybjogcm9sZUNvbXBvbmVudC5yb2xlQXJuLFxuICAgICAgICByb2xlTmFtZTogcm9sZUNvbXBvbmVudC5yb2xlTmFtZSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSWFtUG9saWN5KG5hbWU6IHN0cmluZywgYXJnczogSWFtUG9saWN5QXJncyk6IElhbVBvbGljeVJlc3VsdCB7XG4gICAgY29uc3QgcG9saWN5Q29tcG9uZW50ID0gbmV3IElhbVBvbGljeUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBwb2xpY3k6IHBvbGljeUNvbXBvbmVudC5wb2xpY3ksXG4gICAgICAgIHBvbGljeUFybjogcG9saWN5Q29tcG9uZW50LnBvbGljeUFybixcbiAgICAgICAgcG9saWN5TmFtZTogcG9saWN5Q29tcG9uZW50LnBvbGljeU5hbWUsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVjMkluc3RhbmNlUm9sZShuYW1lOiBzdHJpbmcsIGFyZ3M6IEVjMkluc3RhbmNlUm9sZUFyZ3MpIHtcbiAgICBjb25zdCBlYzJSb2xlQ29tcG9uZW50ID0gbmV3IEVjMkluc3RhbmNlUm9sZUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICByb2xlOiBlYzJSb2xlQ29tcG9uZW50LnJvbGUsXG4gICAgICAgIHBvbGljeTogZWMyUm9sZUNvbXBvbmVudC5wb2xpY3ksXG4gICAgICAgIGluc3RhbmNlUHJvZmlsZTogZWMyUm9sZUNvbXBvbmVudC5pbnN0YW5jZVByb2ZpbGUsXG4gICAgICAgIHJvbGVBcm46IGVjMlJvbGVDb21wb25lbnQucm9sZUFybixcbiAgICAgICAgaW5zdGFuY2VQcm9maWxlQXJuOiBlYzJSb2xlQ29tcG9uZW50Lmluc3RhbmNlUHJvZmlsZUFybixcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmRzUm9sZShuYW1lOiBzdHJpbmcsIGFyZ3M6IFJkc1JvbGVBcmdzKSB7XG4gICAgY29uc3QgcmRzUm9sZUNvbXBvbmVudCA9IG5ldyBSZHNSb2xlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHJvbGU6IHJkc1JvbGVDb21wb25lbnQucm9sZSxcbiAgICAgICAgcG9saWN5OiByZHNSb2xlQ29tcG9uZW50LnBvbGljeSxcbiAgICAgICAgcm9sZUFybjogcmRzUm9sZUNvbXBvbmVudC5yb2xlQXJuLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBbGJSb2xlKG5hbWU6IHN0cmluZywgYXJnczogQWxiUm9sZUFyZ3MpIHtcbiAgICBjb25zdCBhbGJSb2xlQ29tcG9uZW50ID0gbmV3IEFsYlJvbGVDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcm9sZTogYWxiUm9sZUNvbXBvbmVudC5yb2xlLFxuICAgICAgICBwb2xpY3k6IGFsYlJvbGVDb21wb25lbnQucG9saWN5LFxuICAgICAgICByb2xlQXJuOiBhbGJSb2xlQ29tcG9uZW50LnJvbGVBcm4sXG4gICAgfTtcbn0iXX0=