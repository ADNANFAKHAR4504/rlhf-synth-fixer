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
exports.ApplicationSecurityGroupComponent = exports.DatabaseSecurityGroupComponent = exports.WebSecurityGroupComponent = exports.SecurityGroupComponent = void 0;
exports.createSecurityGroup = createSecurityGroup;
exports.createWebSecurityGroup = createWebSecurityGroup;
exports.createDatabaseSecurityGroup = createDatabaseSecurityGroup;
exports.createApplicationSecurityGroup = createApplicationSecurityGroup;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class SecurityGroupComponent extends pulumi.ComponentResource {
    securityGroup;
    securityGroupId;
    rules;
    constructor(name, args, opts) {
        super("aws:security:SecurityGroupComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.securityGroup = new aws.ec2.SecurityGroup(`${name}-sg`, {
            name: args.name,
            description: args.description,
            vpcId: args.vpcId,
            tags: defaultTags,
        }, { parent: this });
        this.securityGroupId = this.securityGroup.id;
        this.rules = [];
        // Create security group rules if provided
        if (args.rules) {
            args.rules.forEach((ruleConfig, index) => {
                const rule = new aws.ec2.SecurityGroupRule(`${name}-rule-${index}`, {
                    type: ruleConfig.type,
                    fromPort: ruleConfig.fromPort,
                    toPort: ruleConfig.toPort,
                    protocol: ruleConfig.protocol,
                    cidrBlocks: ruleConfig.cidrBlocks,
                    sourceSecurityGroupId: ruleConfig.sourceSecurityGroupId,
                    securityGroupId: this.securityGroup.id,
                    description: ruleConfig.description || `${ruleConfig.type} rule for ${ruleConfig.protocol}:${ruleConfig.fromPort}-${ruleConfig.toPort}`,
                }, { parent: this });
                this.rules.push(rule);
            });
        }
        this.registerOutputs({
            securityGroup: this.securityGroup,
            securityGroupId: this.securityGroupId,
            rules: this.rules,
        });
    }
}
exports.SecurityGroupComponent = SecurityGroupComponent;
class WebSecurityGroupComponent extends pulumi.ComponentResource {
    securityGroup;
    securityGroupId;
    rules;
    constructor(name, args, opts) {
        super("aws:security:WebSecurityGroupComponent", name, {}, opts);
        const securityGroupComponent = new SecurityGroupComponent(name, {
            name: args.name,
            description: "Security group for web servers - HTTPS only",
            vpcId: args.vpcId,
            tags: args.tags,
            rules: [
                {
                    type: "ingress",
                    fromPort: 443,
                    toPort: 443,
                    protocol: "tcp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "HTTPS inbound from internet",
                },
                {
                    type: "ingress",
                    fromPort: 80,
                    toPort: 80,
                    protocol: "tcp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "HTTP inbound for redirect to HTTPS",
                },
                {
                    type: "egress",
                    fromPort: 0,
                    toPort: 65535,
                    protocol: "tcp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "All outbound traffic",
                },
            ],
        }, { parent: this });
        this.securityGroup = securityGroupComponent.securityGroup;
        this.securityGroupId = securityGroupComponent.securityGroupId;
        this.rules = securityGroupComponent.rules;
        this.registerOutputs({
            securityGroup: this.securityGroup,
            securityGroupId: this.securityGroupId,
            rules: this.rules,
        });
    }
}
exports.WebSecurityGroupComponent = WebSecurityGroupComponent;
class DatabaseSecurityGroupComponent extends pulumi.ComponentResource {
    securityGroup;
    securityGroupId;
    rules;
    constructor(name, args, opts) {
        super("aws:security:DatabaseSecurityGroupComponent", name, {}, opts);
        const databasePort = args.databasePort || 3306; // Default to MySQL port
        const securityGroupComponent = new SecurityGroupComponent(name, {
            name: args.name,
            description: "Security group for database servers",
            vpcId: args.vpcId,
            tags: args.tags,
            rules: [
                {
                    type: "ingress",
                    fromPort: databasePort,
                    toPort: databasePort,
                    protocol: "tcp",
                    sourceSecurityGroupId: args.webSecurityGroupId,
                    description: `Database access from web security group on port ${databasePort}`,
                },
                {
                    type: "egress",
                    fromPort: 443,
                    toPort: 443,
                    protocol: "tcp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "HTTPS outbound for updates and patches",
                },
            ],
        }, { parent: this });
        this.securityGroup = securityGroupComponent.securityGroup;
        this.securityGroupId = securityGroupComponent.securityGroupId;
        this.rules = securityGroupComponent.rules;
        this.registerOutputs({
            securityGroup: this.securityGroup,
            securityGroupId: this.securityGroupId,
            rules: this.rules,
        });
    }
}
exports.DatabaseSecurityGroupComponent = DatabaseSecurityGroupComponent;
class ApplicationSecurityGroupComponent extends pulumi.ComponentResource {
    securityGroup;
    securityGroupId;
    rules;
    constructor(name, args, opts) {
        super("aws:security:ApplicationSecurityGroupComponent", name, {}, opts);
        const applicationPort = args.applicationPort || 8080; // Default application port
        const securityGroupComponent = new SecurityGroupComponent(name, {
            name: args.name,
            description: "Security group for application servers",
            vpcId: args.vpcId,
            tags: args.tags,
            rules: [
                {
                    type: "ingress",
                    fromPort: applicationPort,
                    toPort: applicationPort,
                    protocol: "tcp",
                    sourceSecurityGroupId: args.albSecurityGroupId,
                    description: `Application access from ALB security group on port ${applicationPort}`,
                },
                {
                    type: "ingress",
                    fromPort: 22,
                    toPort: 22,
                    protocol: "tcp",
                    cidrBlocks: ["10.0.0.0/8"],
                    description: "SSH access from private networks only",
                },
                {
                    type: "egress",
                    fromPort: 0,
                    toPort: 65535,
                    protocol: "tcp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "All outbound traffic",
                },
                {
                    type: "egress",
                    fromPort: 0,
                    toPort: 65535,
                    protocol: "udp",
                    cidrBlocks: ["0.0.0.0/0"],
                    description: "All outbound UDP traffic",
                },
            ],
        }, { parent: this });
        this.securityGroup = securityGroupComponent.securityGroup;
        this.securityGroupId = securityGroupComponent.securityGroupId;
        this.rules = securityGroupComponent.rules;
        this.registerOutputs({
            securityGroup: this.securityGroup,
            securityGroupId: this.securityGroupId,
            rules: this.rules,
        });
    }
}
exports.ApplicationSecurityGroupComponent = ApplicationSecurityGroupComponent;
function createSecurityGroup(name, args) {
    const securityGroupComponent = new SecurityGroupComponent(name, args);
    return {
        securityGroup: securityGroupComponent.securityGroup,
        securityGroupId: securityGroupComponent.securityGroupId,
        rules: securityGroupComponent.rules,
    };
}
function createWebSecurityGroup(name, args) {
    const webSecurityGroupComponent = new WebSecurityGroupComponent(name, args);
    return {
        securityGroup: webSecurityGroupComponent.securityGroup,
        securityGroupId: webSecurityGroupComponent.securityGroupId,
        rules: webSecurityGroupComponent.rules,
    };
}
function createDatabaseSecurityGroup(name, args) {
    const databaseSecurityGroupComponent = new DatabaseSecurityGroupComponent(name, args);
    return {
        securityGroup: databaseSecurityGroupComponent.securityGroup,
        securityGroupId: databaseSecurityGroupComponent.securityGroupId,
        rules: databaseSecurityGroupComponent.rules,
    };
}
function createApplicationSecurityGroup(name, args) {
    const applicationSecurityGroupComponent = new ApplicationSecurityGroupComponent(name, args);
    return {
        securityGroup: applicationSecurityGroupComponent.securityGroup,
        securityGroupId: applicationSecurityGroupComponent.securityGroupId,
        rules: applicationSecurityGroupComponent.rules,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHlHcm91cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlY3VyaXR5R3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd1FBLGtEQU9DO0FBRUQsd0RBT0M7QUFFRCxrRUFPQztBQUVELHdFQU9DO0FBMVNELHVEQUF5QztBQUN6QyxpREFBbUM7QUFnRG5DLE1BQWEsc0JBQXVCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNoRCxhQUFhLENBQXdCO0lBQ3JDLGVBQWUsQ0FBd0I7SUFDdkMsS0FBSyxDQUE4QjtJQUVuRCxZQUFZLElBQVksRUFBRSxJQUF1QixFQUFFLElBQXNDO1FBQ3JGLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTdELE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNmLENBQUM7UUFFRixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLEtBQUssRUFBRTtZQUN6RCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLElBQUksRUFBRSxXQUFXO1NBQ3BCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDO1FBQzdDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFB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QUFFLGlDQUFpQyxDQUFDLGFBQWE7UUFDOUQsZUFBZSxFQUFFLGlDQUFpQyxDQUFDLGVBQWU7UUFDbEUsS0FBSyxFQUFFLGlDQUFpQyxDQUFDLEtBQUs7S0FDakQsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJpdHlHcm91cFJ1bGVDb25maWcge1xuICAgIHR5cGU6IFwiaW5ncmVzc1wiIHwgXCJlZ3Jlc3NcIjtcbiAgICBmcm9tUG9ydDogbnVtYmVyO1xuICAgIHRvUG9ydDogbnVtYmVyO1xuICAgIHByb3RvY29sOiBzdHJpbmc7XG4gICAgY2lkckJsb2Nrcz86IHN0cmluZ1tdO1xuICAgIHNvdXJjZVNlY3VyaXR5R3JvdXBJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyaXR5R3JvdXBBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgZGVzY3JpcHRpb246IHN0cmluZztcbiAgICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgcnVsZXM/OiBTZWN1cml0eUdyb3VwUnVsZUNvbmZpZ1tdO1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyaXR5R3JvdXBSZXN1bHQge1xuICAgIHNlY3VyaXR5R3JvdXA6IGF3cy5lYzIuU2VjdXJpdHlHcm91cDtcbiAgICBzZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBydWxlczogYXdzLmVjMi5TZWN1cml0eUdyb3VwUnVsZVtdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFdlYlNlY3VyaXR5R3JvdXBBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdnBjSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlU2VjdXJpdHlHcm91cEFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgd2ViU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBkYXRhYmFzZVBvcnQ/OiBudW1iZXI7XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbGljYXRpb25TZWN1cml0eUdyb3VwQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBhbGJTZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGFwcGxpY2F0aW9uUG9ydD86IG51bWJlcjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyaXR5R3JvdXBDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXA7XG4gICAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBydWxlczogYXdzLmVjMi5TZWN1cml0eUdyb3VwUnVsZVtdO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTZWN1cml0eUdyb3VwQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6c2VjdXJpdHk6U2VjdXJpdHlHcm91cENvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICAgICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICAgICAgICBNYW5hZ2VkQnk6IFwiUHVsdW1pXCIsXG4gICAgICAgICAgICBQcm9qZWN0OiBcIkFXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nXCIsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zZWN1cml0eUdyb3VwID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cChgJHtuYW1lfS1zZ2AsIHtcbiAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uLFxuICAgICAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5zZWN1cml0eUdyb3VwSWQgPSB0aGlzLnNlY3VyaXR5R3JvdXAuaWQ7XG4gICAgICAgIHRoaXMucnVsZXMgPSBbXTtcblxuICAgICAgICAvLyBDcmVhdGUgc2VjdXJpdHkgZ3JvdXAgcnVsZXMgaWYgcHJvdmlkZWRcbiAgICAgICAgaWYgKGFyZ3MucnVsZXMpIHtcbiAgICAgICAgICAgIGFyZ3MucnVsZXMuZm9yRWFjaCgocnVsZUNvbmZpZywgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBydWxlID0gbmV3IGF3cy5lYzIuU2VjdXJpdHlHcm91cFJ1bGUoYCR7bmFtZX0tcnVsZS0ke2luZGV4fWAsIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogcnVsZUNvbmZpZy50eXBlLFxuICAgICAgICAgICAgICAgICAgICBmcm9tUG9ydDogcnVsZUNvbmZpZy5mcm9tUG9ydCxcbiAgICAgICAgICAgICAgICAgICAgdG9Qb3J0OiBydWxlQ29uZmlnLnRvUG9ydCxcbiAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2w6IHJ1bGVDb25maWcucHJvdG9jb2wsXG4gICAgICAgICAgICAgICAgICAgIGNpZHJCbG9ja3M6IHJ1bGVDb25maWcuY2lkckJsb2NrcyxcbiAgICAgICAgICAgICAgICAgICAgc291cmNlU2VjdXJpdHlHcm91cElkOiBydWxlQ29uZmlnLnNvdXJjZVNlY3VyaXR5R3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkOiB0aGlzLnNlY3VyaXR5R3JvdXAuaWQsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBydWxlQ29uZmlnLmRlc2NyaXB0aW9uIHx8IGAke3J1bGVDb25maWcudHlwZX0gcnVsZSBmb3IgJHtydWxlQ29uZmlnLnByb3RvY29sfToke3J1bGVDb25maWcuZnJvbVBvcnR9LSR7cnVsZUNvbmZpZy50b1BvcnR9YCxcbiAgICAgICAgICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICAgICAgICAgIHRoaXMucnVsZXMucHVzaChydWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgc2VjdXJpdHlHcm91cDogdGhpcy5zZWN1cml0eUdyb3VwLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkOiB0aGlzLnNlY3VyaXR5R3JvdXBJZCxcbiAgICAgICAgICAgIHJ1bGVzOiB0aGlzLnJ1bGVzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBXZWJTZWN1cml0eUdyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlHcm91cDogYXdzLmVjMi5TZWN1cml0eUdyb3VwO1xuICAgIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcnVsZXM6IGF3cy5lYzIuU2VjdXJpdHlHcm91cFJ1bGVbXTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogV2ViU2VjdXJpdHlHcm91cEFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnNlY3VyaXR5OldlYlNlY3VyaXR5R3JvdXBDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IHNlY3VyaXR5R3JvdXBDb21wb25lbnQgPSBuZXcgU2VjdXJpdHlHcm91cENvbXBvbmVudChuYW1lLCB7XG4gICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZWN1cml0eSBncm91cCBmb3Igd2ViIHNlcnZlcnMgLSBIVFRQUyBvbmx5XCIsXG4gICAgICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImluZ3Jlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcbiAgICAgICAgICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiBcInRjcFwiLFxuICAgICAgICAgICAgICAgICAgICBjaWRyQmxvY2tzOiBbXCIwLjAuMC4wLzBcIl0sXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkhUVFBTIGluYm91bmQgZnJvbSBpbnRlcm5ldFwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImluZ3Jlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgZnJvbVBvcnQ6IDgwLFxuICAgICAgICAgICAgICAgICAgICB0b1BvcnQ6IDgwLFxuICAgICAgICAgICAgICAgICAgICBwcm90b2NvbDogXCJ0Y3BcIixcbiAgICAgICAgICAgICAgICAgICAgY2lkckJsb2NrczogW1wiMC4wLjAuMC8wXCJdLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJIVFRQIGluYm91bmQgZm9yIHJlZGlyZWN0IHRvIEhUVFBTXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiZWdyZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgIGZyb21Qb3J0OiAwLFxuICAgICAgICAgICAgICAgICAgICB0b1BvcnQ6IDY1NTM1LFxuICAgICAgICAgICAgICAgICAgICBwcm90b2NvbDogXCJ0Y3BcIixcbiAgICAgICAgICAgICAgICAgICAgY2lkckJsb2NrczogW1wiMC4wLjAuMC8wXCJdLFxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJBbGwgb3V0Ym91bmQgdHJhZmZpY1wiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnNlY3VyaXR5R3JvdXAgPSBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXA7XG4gICAgICAgIHRoaXMuc2VjdXJpdHlHcm91cElkID0gc2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwSWQ7XG4gICAgICAgIHRoaXMucnVsZXMgPSBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnJ1bGVzO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXA6IHRoaXMuc2VjdXJpdHlHcm91cCxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBJZDogdGhpcy5zZWN1cml0eUdyb3VwSWQsXG4gICAgICAgICAgICBydWxlczogdGhpcy5ydWxlcyxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGF0YWJhc2VTZWN1cml0eUdyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlHcm91cDogYXdzLmVjMi5TZWN1cml0eUdyb3VwO1xuICAgIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcnVsZXM6IGF3cy5lYzIuU2VjdXJpdHlHcm91cFJ1bGVbXTtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogRGF0YWJhc2VTZWN1cml0eUdyb3VwQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6c2VjdXJpdHk6RGF0YWJhc2VTZWN1cml0eUdyb3VwQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkYXRhYmFzZVBvcnQgPSBhcmdzLmRhdGFiYXNlUG9ydCB8fCAzMzA2OyAvLyBEZWZhdWx0IHRvIE15U1FMIHBvcnRcblxuICAgICAgICBjb25zdCBzZWN1cml0eUdyb3VwQ29tcG9uZW50ID0gbmV3IFNlY3VyaXR5R3JvdXBDb21wb25lbnQobmFtZSwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2VjdXJpdHkgZ3JvdXAgZm9yIGRhdGFiYXNlIHNlcnZlcnNcIixcbiAgICAgICAgICAgIHZwY0lkOiBhcmdzLnZwY0lkLFxuICAgICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiaW5ncmVzc1wiLFxuICAgICAgICAgICAgICAgICAgICBmcm9tUG9ydDogZGF0YWJhc2VQb3J0LFxuICAgICAgICAgICAgICAgICAgICB0b1BvcnQ6IGRhdGFiYXNlUG9ydCxcbiAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2w6IFwidGNwXCIsXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZVNlY3VyaXR5R3JvdXBJZDogYXJncy53ZWJTZWN1cml0eUdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRGF0YWJhc2UgYWNjZXNzIGZyb20gd2ViIHNlY3VyaXR5IGdyb3VwIG9uIHBvcnQgJHtkYXRhYmFzZVBvcnR9YCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJlZ3Jlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgZnJvbVBvcnQ6IDQ0MyxcbiAgICAgICAgICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiBcInRjcFwiLFxuICAgICAgICAgICAgICAgICAgICBjaWRyQmxvY2tzOiBbXCIwLjAuMC4wLzBcIl0sXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkhUVFBTIG91dGJvdW5kIGZvciB1cGRhdGVzIGFuZCBwYXRjaGVzXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMuc2VjdXJpdHlHcm91cCA9IHNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cDtcbiAgICAgICAgdGhpcy5zZWN1cml0eUdyb3VwSWQgPSBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXBJZDtcbiAgICAgICAgdGhpcy5ydWxlcyA9IHNlY3VyaXR5R3JvdXBDb21wb25lbnQucnVsZXM7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgc2VjdXJpdHlHcm91cDogdGhpcy5zZWN1cml0eUdyb3VwLFxuICAgICAgICAgICAgc2VjdXJpdHlHcm91cElkOiB0aGlzLnNlY3VyaXR5R3JvdXBJZCxcbiAgICAgICAgICAgIHJ1bGVzOiB0aGlzLnJ1bGVzLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXA7XG4gICAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBydWxlczogYXdzLmVjMi5TZWN1cml0eUdyb3VwUnVsZVtdO1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBBcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpzZWN1cml0eTpBcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGFwcGxpY2F0aW9uUG9ydCA9IGFyZ3MuYXBwbGljYXRpb25Qb3J0IHx8IDgwODA7IC8vIERlZmF1bHQgYXBwbGljYXRpb24gcG9ydFxuXG4gICAgICAgIGNvbnN0IHNlY3VyaXR5R3JvdXBDb21wb25lbnQgPSBuZXcgU2VjdXJpdHlHcm91cENvbXBvbmVudChuYW1lLCB7XG4gICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJTZWN1cml0eSBncm91cCBmb3IgYXBwbGljYXRpb24gc2VydmVyc1wiLFxuICAgICAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgICAgICBydWxlczogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJpbmdyZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgIGZyb21Qb3J0OiBhcHBsaWNhdGlvblBvcnQsXG4gICAgICAgICAgICAgICAgICAgIHRvUG9ydDogYXBwbGljYXRpb25Qb3J0LFxuICAgICAgICAgICAgICAgICAgICBwcm90b2NvbDogXCJ0Y3BcIixcbiAgICAgICAgICAgICAgICAgICAgc291cmNlU2VjdXJpdHlHcm91cElkOiBhcmdzLmFsYlNlY3VyaXR5R3JvdXBJZCxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGBBcHBsaWNhdGlvbiBhY2Nlc3MgZnJvbSBBTEIgc2VjdXJpdHkgZ3JvdXAgb24gcG9ydCAke2FwcGxpY2F0aW9uUG9ydH1gLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImluZ3Jlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgZnJvbVBvcnQ6IDIyLFxuICAgICAgICAgICAgICAgICAgICB0b1BvcnQ6IDIyLFxuICAgICAgICAgICAgICAgICAgICBwcm90b2NvbDogXCJ0Y3BcIixcbiAgICAgICAgICAgICAgICAgICAgY2lkckJsb2NrczogW1wiMTAuMC4wLjAvOFwiXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU1NIIGFjY2VzcyBmcm9tIHByaXZhdGUgbmV0d29ya3Mgb25seVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImVncmVzc1wiLFxuICAgICAgICAgICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgICAgICAgICAgdG9Qb3J0OiA2NTUzNSxcbiAgICAgICAgICAgICAgICAgICAgcHJvdG9jb2w6IFwidGNwXCIsXG4gICAgICAgICAgICAgICAgICAgIGNpZHJCbG9ja3M6IFtcIjAuMC4wLjAvMFwiXSxcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiQWxsIG91dGJvdW5kIHRyYWZmaWNcIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJlZ3Jlc3NcIixcbiAgICAgICAgICAgICAgICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICAgICAgICAgICAgICAgIHRvUG9ydDogNjU1MzUsXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiBcInVkcFwiLFxuICAgICAgICAgICAgICAgICAgICBjaWRyQmxvY2tzOiBbXCIwLjAuMC4wLzBcIl0sXG4gICAgICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkFsbCBvdXRib3VuZCBVRFAgdHJhZmZpY1wiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnNlY3VyaXR5R3JvdXAgPSBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXA7XG4gICAgICAgIHRoaXMuc2VjdXJpdHlHcm91cElkID0gc2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwSWQ7XG4gICAgICAgIHRoaXMucnVsZXMgPSBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnJ1bGVzO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXA6IHRoaXMuc2VjdXJpdHlHcm91cCxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBJZDogdGhpcy5zZWN1cml0eUdyb3VwSWQsXG4gICAgICAgICAgICBydWxlczogdGhpcy5ydWxlcyxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VjdXJpdHlHcm91cChuYW1lOiBzdHJpbmcsIGFyZ3M6IFNlY3VyaXR5R3JvdXBBcmdzKTogU2VjdXJpdHlHcm91cFJlc3VsdCB7XG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cENvbXBvbmVudCA9IG5ldyBTZWN1cml0eUdyb3VwQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHNlY3VyaXR5R3JvdXA6IHNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cCxcbiAgICAgICAgc2VjdXJpdHlHcm91cElkOiBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXBJZCxcbiAgICAgICAgcnVsZXM6IHNlY3VyaXR5R3JvdXBDb21wb25lbnQucnVsZXMsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdlYlNlY3VyaXR5R3JvdXAobmFtZTogc3RyaW5nLCBhcmdzOiBXZWJTZWN1cml0eUdyb3VwQXJncyk6IFNlY3VyaXR5R3JvdXBSZXN1bHQge1xuICAgIGNvbnN0IHdlYlNlY3VyaXR5R3JvdXBDb21wb25lbnQgPSBuZXcgV2ViU2VjdXJpdHlHcm91cENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWN1cml0eUdyb3VwOiB3ZWJTZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXAsXG4gICAgICAgIHNlY3VyaXR5R3JvdXBJZDogd2ViU2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwSWQsXG4gICAgICAgIHJ1bGVzOiB3ZWJTZWN1cml0eUdyb3VwQ29tcG9uZW50LnJ1bGVzLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEYXRhYmFzZVNlY3VyaXR5R3JvdXAobmFtZTogc3RyaW5nLCBhcmdzOiBEYXRhYmFzZVNlY3VyaXR5R3JvdXBBcmdzKTogU2VjdXJpdHlHcm91cFJlc3VsdCB7XG4gICAgY29uc3QgZGF0YWJhc2VTZWN1cml0eUdyb3VwQ29tcG9uZW50ID0gbmV3IERhdGFiYXNlU2VjdXJpdHlHcm91cENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWN1cml0eUdyb3VwOiBkYXRhYmFzZVNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cCxcbiAgICAgICAgc2VjdXJpdHlHcm91cElkOiBkYXRhYmFzZVNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cElkLFxuICAgICAgICBydWxlczogZGF0YWJhc2VTZWN1cml0eUdyb3VwQ29tcG9uZW50LnJ1bGVzLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBcHBsaWNhdGlvblNlY3VyaXR5R3JvdXAobmFtZTogc3RyaW5nLCBhcmdzOiBBcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBBcmdzKTogU2VjdXJpdHlHcm91cFJlc3VsdCB7XG4gICAgY29uc3QgYXBwbGljYXRpb25TZWN1cml0eUdyb3VwQ29tcG9uZW50ID0gbmV3IEFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWN1cml0eUdyb3VwOiBhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cCxcbiAgICAgICAgc2VjdXJpdHlHcm91cElkOiBhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cElkLFxuICAgICAgICBydWxlczogYXBwbGljYXRpb25TZWN1cml0eUdyb3VwQ29tcG9uZW50LnJ1bGVzLFxuICAgIH07XG59Il19