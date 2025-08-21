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
        super('aws:security:SecurityGroupComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.securityGroup = new aws.ec2.SecurityGroup(`${name}-sg`, {
            name: args.name,
            description: args.description,
            vpcId: args.vpcId,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
        this.securityGroupId = this.securityGroup.id;
        this.rules = [];
        // Create security group rules
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
                    description: ruleConfig.description ||
                        `${ruleConfig.type} rule for ${ruleConfig.protocol}:${ruleConfig.fromPort}-${ruleConfig.toPort}`,
                }, { parent: this, provider: opts?.provider });
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
        super('aws:security:WebSecurityGroupComponent', name, {}, opts);
        const securityGroupComponent = new SecurityGroupComponent(name, {
            name: args.name,
            description: 'Security group for web servers - HTTPS only',
            vpcId: args.vpcId,
            tags: args.tags,
            rules: [
                {
                    type: 'ingress',
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS inbound from internet',
                },
                {
                    type: 'ingress',
                    fromPort: 80,
                    toPort: 80,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTP inbound for redirect to HTTPS',
                },
                {
                    type: 'egress',
                    fromPort: 0,
                    toPort: 65535,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'All outbound traffic',
                },
            ],
        }, { parent: this, provider: opts?.provider });
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
        super('aws:security:DatabaseSecurityGroupComponent', name, {}, opts);
        const databasePort = args.databasePort || 3306;
        const securityGroupComponent = new SecurityGroupComponent(name, {
            name: args.name,
            description: 'Security group for database servers',
            vpcId: args.vpcId,
            tags: args.tags,
            rules: [
                {
                    type: 'ingress',
                    fromPort: databasePort,
                    toPort: databasePort,
                    protocol: 'tcp',
                    sourceSecurityGroupId: args.webSecurityGroupId,
                    description: `Database access from web security group on port ${databasePort}`,
                },
                {
                    type: 'egress',
                    fromPort: 443,
                    toPort: 443,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'HTTPS outbound for updates and patches',
                },
            ],
        }, { parent: this, provider: opts?.provider });
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
        super('aws:security:ApplicationSecurityGroupComponent', name, {}, opts);
        const applicationPort = args.applicationPort || 8080;
        const securityGroupComponent = new SecurityGroupComponent(name, {
            name: args.name,
            description: 'Security group for application servers',
            vpcId: args.vpcId,
            tags: args.tags,
            rules: [
                {
                    type: 'ingress',
                    fromPort: applicationPort,
                    toPort: applicationPort,
                    protocol: 'tcp',
                    sourceSecurityGroupId: args.albSecurityGroupId,
                    description: `Application access from ALB security group on port ${applicationPort}`,
                },
                {
                    type: 'ingress',
                    fromPort: 22,
                    toPort: 22,
                    protocol: 'tcp',
                    cidrBlocks: ['10.0.0.0/8'],
                    description: 'SSH access from private networks only',
                },
                {
                    type: 'egress',
                    fromPort: 0,
                    toPort: 65535,
                    protocol: 'tcp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'All outbound traffic',
                },
                {
                    type: 'egress',
                    fromPort: 0,
                    toPort: 65535,
                    protocol: 'udp',
                    cidrBlocks: ['0.0.0.0/0'],
                    description: 'All outbound UDP traffic',
                },
            ],
        }, { parent: this, provider: opts?.provider });
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
function createSecurityGroup(name, args, opts) {
    const securityGroupComponent = new SecurityGroupComponent(name, args, opts);
    return {
        securityGroup: securityGroupComponent.securityGroup,
        securityGroupId: securityGroupComponent.securityGroupId,
        rules: securityGroupComponent.rules,
    };
}
function createWebSecurityGroup(name, args, opts) {
    const webSecurityGroupComponent = new WebSecurityGroupComponent(name, args, opts);
    return {
        securityGroup: webSecurityGroupComponent.securityGroup,
        securityGroupId: webSecurityGroupComponent.securityGroupId,
        rules: webSecurityGroupComponent.rules,
    };
}
function createDatabaseSecurityGroup(name, args, opts) {
    const databaseSecurityGroupComponent = new DatabaseSecurityGroupComponent(name, args, opts);
    return {
        securityGroup: databaseSecurityGroupComponent.securityGroup,
        securityGroupId: databaseSecurityGroupComponent.securityGroupId,
        rules: databaseSecurityGroupComponent.rules,
    };
}
function createApplicationSecurityGroup(name, args, opts) {
    const applicationSecurityGroupComponent = new ApplicationSecurityGroupComponent(name, args, opts);
    return {
        securityGroup: applicationSecurityGroupComponent.securityGroup,
        securityGroupId: applicationSecurityGroupComponent.securityGroupId,
        rules: applicationSecurityGroupComponent.rules,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjdXJpdHlHcm91cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlY3VyaXR5R3JvdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBOFNBLGtEQVdDO0FBRUQsd0RBZUM7QUFFRCxrRUFlQztBQUVELHdFQVlDO0FBeldELHVEQUF5QztBQUN6QyxpREFBbUM7QUFnRG5DLE1BQWEsc0JBQXVCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNsRCxhQUFhLENBQXdCO0lBQ3JDLGVBQWUsQ0FBd0I7SUFDdkMsS0FBSyxDQUE4QjtJQUVuRCxZQUNFLElBQVksRUFDWixJQUF1QixFQUN2QixJQUFzQztRQUV0QyxLQUFLLENBQUMscUNBQXFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU3RCxNQUFNLFdBQVcsR0FBRztZQUNsQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUM5QixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUseUJBQXlCO1lBQ2xDLEdBQUcsSUFBSSxDQUFDLElBQUk7U0FDYixDQUFDO1FBRUYsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUM1QyxHQUFHLElBQUksS0FBSyxFQUNaO1lBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixJQUFJLEVBQUUsV0FBVztTQUNsQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUMzQyxDQUFDO1FBRUYsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FB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RUFBRSw4QkFBOEIsQ0FBQyxlQUFlO1FBQy9ELEtBQUssRUFBRSw4QkFBOEIsQ0FBQyxLQUFLO0tBQzVDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0IsOEJBQThCLENBQzVDLElBQVksRUFDWixJQUFrQyxFQUNsQyxJQUFzQztJQUV0QyxNQUFNLGlDQUFpQyxHQUNyQyxJQUFJLGlDQUFpQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUQsT0FBTztRQUNMLGFBQWEsRUFBRSxpQ0FBaUMsQ0FBQyxhQUFhO1FBQzlELGVBQWUsRUFBRSxpQ0FBaUMsQ0FBQyxlQUFlO1FBQ2xFLEtBQUssRUFBRSxpQ0FBaUMsQ0FBQyxLQUFLO0tBQy9DLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJpdHlHcm91cFJ1bGVDb25maWcge1xuICB0eXBlOiAnaW5ncmVzcycgfCAnZWdyZXNzJztcbiAgZnJvbVBvcnQ6IG51bWJlcjtcbiAgdG9Qb3J0OiBudW1iZXI7XG4gIHByb3RvY29sOiBzdHJpbmc7XG4gIGNpZHJCbG9ja3M/OiBzdHJpbmdbXTtcbiAgc291cmNlU2VjdXJpdHlHcm91cElkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyaXR5R3JvdXBBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xuICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHJ1bGVzPzogU2VjdXJpdHlHcm91cFJ1bGVDb25maWdbXTtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJpdHlHcm91cFJlc3VsdCB7XG4gIHNlY3VyaXR5R3JvdXA6IGF3cy5lYzIuU2VjdXJpdHlHcm91cDtcbiAgc2VjdXJpdHlHcm91cElkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHJ1bGVzOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXBSdWxlW107XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgV2ViU2VjdXJpdHlHcm91cEFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YWJhc2VTZWN1cml0eUdyb3VwQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgdnBjSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB3ZWJTZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBkYXRhYmFzZVBvcnQ/OiBudW1iZXI7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cEFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZwY0lkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgYWxiU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgYXBwbGljYXRpb25Qb3J0PzogbnVtYmVyO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyaXR5R3JvdXBDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlHcm91cDogYXdzLmVjMi5TZWN1cml0eUdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlHcm91cElkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBydWxlczogYXdzLmVjMi5TZWN1cml0eUdyb3VwUnVsZVtdO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBTZWN1cml0eUdyb3VwQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnNlY3VyaXR5OlNlY3VyaXR5R3JvdXBDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmcnLFxuICAgICAgLi4uYXJncy50YWdzLFxuICAgIH07XG5cbiAgICB0aGlzLnNlY3VyaXR5R3JvdXAgPSBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwKFxuICAgICAgYCR7bmFtZX0tc2dgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uLFxuICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMuc2VjdXJpdHlHcm91cElkID0gdGhpcy5zZWN1cml0eUdyb3VwLmlkO1xuICAgIHRoaXMucnVsZXMgPSBbXTtcblxuICAgIC8vIENyZWF0ZSBzZWN1cml0eSBncm91cCBydWxlc1xuICAgIGlmIChhcmdzLnJ1bGVzKSB7XG4gICAgICBhcmdzLnJ1bGVzLmZvckVhY2goKHJ1bGVDb25maWcsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IHJ1bGUgPSBuZXcgYXdzLmVjMi5TZWN1cml0eUdyb3VwUnVsZShcbiAgICAgICAgICBgJHtuYW1lfS1ydWxlLSR7aW5kZXh9YCxcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBydWxlQ29uZmlnLnR5cGUsXG4gICAgICAgICAgICBmcm9tUG9ydDogcnVsZUNvbmZpZy5mcm9tUG9ydCxcbiAgICAgICAgICAgIHRvUG9ydDogcnVsZUNvbmZpZy50b1BvcnQsXG4gICAgICAgICAgICBwcm90b2NvbDogcnVsZUNvbmZpZy5wcm90b2NvbCxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IHJ1bGVDb25maWcuY2lkckJsb2NrcyxcbiAgICAgICAgICAgIHNvdXJjZVNlY3VyaXR5R3JvdXBJZDogcnVsZUNvbmZpZy5zb3VyY2VTZWN1cml0eUdyb3VwSWQsXG4gICAgICAgICAgICBzZWN1cml0eUdyb3VwSWQ6IHRoaXMuc2VjdXJpdHlHcm91cC5pZCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICAgICAgICBydWxlQ29uZmlnLmRlc2NyaXB0aW9uIHx8XG4gICAgICAgICAgICAgIGAke3J1bGVDb25maWcudHlwZX0gcnVsZSBmb3IgJHtydWxlQ29uZmlnLnByb3RvY29sfToke3J1bGVDb25maWcuZnJvbVBvcnR9LSR7cnVsZUNvbmZpZy50b1BvcnR9YCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICAgICApO1xuXG4gICAgICAgIHRoaXMucnVsZXMucHVzaChydWxlKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHNlY3VyaXR5R3JvdXA6IHRoaXMuc2VjdXJpdHlHcm91cCxcbiAgICAgIHNlY3VyaXR5R3JvdXBJZDogdGhpcy5zZWN1cml0eUdyb3VwSWQsXG4gICAgICBydWxlczogdGhpcy5ydWxlcyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgV2ViU2VjdXJpdHlHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHJ1bGVzOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXBSdWxlW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFdlYlNlY3VyaXR5R3JvdXBBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6c2VjdXJpdHk6V2ViU2VjdXJpdHlHcm91cENvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IHNlY3VyaXR5R3JvdXBDb21wb25lbnQgPSBuZXcgU2VjdXJpdHlHcm91cENvbXBvbmVudChcbiAgICAgIG5hbWUsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3Igd2ViIHNlcnZlcnMgLSBIVFRQUyBvbmx5JyxcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnaW5ncmVzcycsXG4gICAgICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQUyBpbmJvdW5kIGZyb20gaW50ZXJuZXQnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ2luZ3Jlc3MnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDgwLFxuICAgICAgICAgICAgdG9Qb3J0OiA4MCxcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMC4wLjAuMC8wJ10sXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0hUVFAgaW5ib3VuZCBmb3IgcmVkaXJlY3QgdG8gSFRUUFMnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ2VncmVzcycsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogNjU1MzUsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbGwgb3V0Ym91bmQgdHJhZmZpYycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5zZWN1cml0eUdyb3VwID0gc2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwO1xuICAgIHRoaXMuc2VjdXJpdHlHcm91cElkID0gc2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwSWQ7XG4gICAgdGhpcy5ydWxlcyA9IHNlY3VyaXR5R3JvdXBDb21wb25lbnQucnVsZXM7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBzZWN1cml0eUdyb3VwOiB0aGlzLnNlY3VyaXR5R3JvdXAsXG4gICAgICBzZWN1cml0eUdyb3VwSWQ6IHRoaXMuc2VjdXJpdHlHcm91cElkLFxuICAgICAgcnVsZXM6IHRoaXMucnVsZXMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlU2VjdXJpdHlHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHJ1bGVzOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXBSdWxlW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IERhdGFiYXNlU2VjdXJpdHlHcm91cEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpzZWN1cml0eTpEYXRhYmFzZVNlY3VyaXR5R3JvdXBDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkYXRhYmFzZVBvcnQgPSBhcmdzLmRhdGFiYXNlUG9ydCB8fCAzMzA2O1xuXG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cENvbXBvbmVudCA9IG5ldyBTZWN1cml0eUdyb3VwQ29tcG9uZW50KFxuICAgICAgbmFtZSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBkYXRhYmFzZSBzZXJ2ZXJzJyxcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnaW5ncmVzcycsXG4gICAgICAgICAgICBmcm9tUG9ydDogZGF0YWJhc2VQb3J0LFxuICAgICAgICAgICAgdG9Qb3J0OiBkYXRhYmFzZVBvcnQsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBzb3VyY2VTZWN1cml0eUdyb3VwSWQ6IGFyZ3Mud2ViU2VjdXJpdHlHcm91cElkLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBEYXRhYmFzZSBhY2Nlc3MgZnJvbSB3ZWIgc2VjdXJpdHkgZ3JvdXAgb24gcG9ydCAke2RhdGFiYXNlUG9ydH1gLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ2VncmVzcycsXG4gICAgICAgICAgICBmcm9tUG9ydDogNDQzLFxuICAgICAgICAgICAgdG9Qb3J0OiA0NDMsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdIVFRQUyBvdXRib3VuZCBmb3IgdXBkYXRlcyBhbmQgcGF0Y2hlcycsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5zZWN1cml0eUdyb3VwID0gc2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwO1xuICAgIHRoaXMuc2VjdXJpdHlHcm91cElkID0gc2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwSWQ7XG4gICAgdGhpcy5ydWxlcyA9IHNlY3VyaXR5R3JvdXBDb21wb25lbnQucnVsZXM7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBzZWN1cml0eUdyb3VwOiB0aGlzLnNlY3VyaXR5R3JvdXAsXG4gICAgICBzZWN1cml0eUdyb3VwSWQ6IHRoaXMuc2VjdXJpdHlHcm91cElkLFxuICAgICAgcnVsZXM6IHRoaXMucnVsZXMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBzZWN1cml0eUdyb3VwSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHJ1bGVzOiBhd3MuZWMyLlNlY3VyaXR5R3JvdXBSdWxlW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEFwcGxpY2F0aW9uU2VjdXJpdHlHcm91cEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpzZWN1cml0eTpBcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBhcHBsaWNhdGlvblBvcnQgPSBhcmdzLmFwcGxpY2F0aW9uUG9ydCB8fCA4MDgwO1xuXG4gICAgY29uc3Qgc2VjdXJpdHlHcm91cENvbXBvbmVudCA9IG5ldyBTZWN1cml0eUdyb3VwQ29tcG9uZW50KFxuICAgICAgbmFtZSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyaXR5IGdyb3VwIGZvciBhcHBsaWNhdGlvbiBzZXJ2ZXJzJyxcbiAgICAgICAgdnBjSWQ6IGFyZ3MudnBjSWQsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiAnaW5ncmVzcycsXG4gICAgICAgICAgICBmcm9tUG9ydDogYXBwbGljYXRpb25Qb3J0LFxuICAgICAgICAgICAgdG9Qb3J0OiBhcHBsaWNhdGlvblBvcnQsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3RjcCcsXG4gICAgICAgICAgICBzb3VyY2VTZWN1cml0eUdyb3VwSWQ6IGFyZ3MuYWxiU2VjdXJpdHlHcm91cElkLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBBcHBsaWNhdGlvbiBhY2Nlc3MgZnJvbSBBTEIgc2VjdXJpdHkgZ3JvdXAgb24gcG9ydCAke2FwcGxpY2F0aW9uUG9ydH1gLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ2luZ3Jlc3MnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDIyLFxuICAgICAgICAgICAgdG9Qb3J0OiAyMixcbiAgICAgICAgICAgIHByb3RvY29sOiAndGNwJyxcbiAgICAgICAgICAgIGNpZHJCbG9ja3M6IFsnMTAuMC4wLjAvOCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTU0ggYWNjZXNzIGZyb20gcHJpdmF0ZSBuZXR3b3JrcyBvbmx5JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6ICdlZ3Jlc3MnLFxuICAgICAgICAgICAgZnJvbVBvcnQ6IDAsXG4gICAgICAgICAgICB0b1BvcnQ6IDY1NTM1LFxuICAgICAgICAgICAgcHJvdG9jb2w6ICd0Y3AnLFxuICAgICAgICAgICAgY2lkckJsb2NrczogWycwLjAuMC4wLzAnXSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnQWxsIG91dGJvdW5kIHRyYWZmaWMnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgdHlwZTogJ2VncmVzcycsXG4gICAgICAgICAgICBmcm9tUG9ydDogMCxcbiAgICAgICAgICAgIHRvUG9ydDogNjU1MzUsXG4gICAgICAgICAgICBwcm90b2NvbDogJ3VkcCcsXG4gICAgICAgICAgICBjaWRyQmxvY2tzOiBbJzAuMC4wLjAvMCddLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdBbGwgb3V0Ym91bmQgVURQIHRyYWZmaWMnLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMuc2VjdXJpdHlHcm91cCA9IHNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cDtcbiAgICB0aGlzLnNlY3VyaXR5R3JvdXBJZCA9IHNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cElkO1xuICAgIHRoaXMucnVsZXMgPSBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnJ1bGVzO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgc2VjdXJpdHlHcm91cDogdGhpcy5zZWN1cml0eUdyb3VwLFxuICAgICAgc2VjdXJpdHlHcm91cElkOiB0aGlzLnNlY3VyaXR5R3JvdXBJZCxcbiAgICAgIHJ1bGVzOiB0aGlzLnJ1bGVzLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWN1cml0eUdyb3VwKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IFNlY3VyaXR5R3JvdXBBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogU2VjdXJpdHlHcm91cFJlc3VsdCB7XG4gIGNvbnN0IHNlY3VyaXR5R3JvdXBDb21wb25lbnQgPSBuZXcgU2VjdXJpdHlHcm91cENvbXBvbmVudChuYW1lLCBhcmdzLCBvcHRzKTtcbiAgcmV0dXJuIHtcbiAgICBzZWN1cml0eUdyb3VwOiBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXAsXG4gICAgc2VjdXJpdHlHcm91cElkOiBzZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXBJZCxcbiAgICBydWxlczogc2VjdXJpdHlHcm91cENvbXBvbmVudC5ydWxlcyxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVdlYlNlY3VyaXR5R3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogV2ViU2VjdXJpdHlHcm91cEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBTZWN1cml0eUdyb3VwUmVzdWx0IHtcbiAgY29uc3Qgd2ViU2VjdXJpdHlHcm91cENvbXBvbmVudCA9IG5ldyBXZWJTZWN1cml0eUdyb3VwQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzXG4gICk7XG4gIHJldHVybiB7XG4gICAgc2VjdXJpdHlHcm91cDogd2ViU2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwLFxuICAgIHNlY3VyaXR5R3JvdXBJZDogd2ViU2VjdXJpdHlHcm91cENvbXBvbmVudC5zZWN1cml0eUdyb3VwSWQsXG4gICAgcnVsZXM6IHdlYlNlY3VyaXR5R3JvdXBDb21wb25lbnQucnVsZXMsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEYXRhYmFzZVNlY3VyaXR5R3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogRGF0YWJhc2VTZWN1cml0eUdyb3VwQXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IFNlY3VyaXR5R3JvdXBSZXN1bHQge1xuICBjb25zdCBkYXRhYmFzZVNlY3VyaXR5R3JvdXBDb21wb25lbnQgPSBuZXcgRGF0YWJhc2VTZWN1cml0eUdyb3VwQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzXG4gICk7XG4gIHJldHVybiB7XG4gICAgc2VjdXJpdHlHcm91cDogZGF0YWJhc2VTZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXAsXG4gICAgc2VjdXJpdHlHcm91cElkOiBkYXRhYmFzZVNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cElkLFxuICAgIHJ1bGVzOiBkYXRhYmFzZVNlY3VyaXR5R3JvdXBDb21wb25lbnQucnVsZXMsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBcHBsaWNhdGlvblNlY3VyaXR5R3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogQXBwbGljYXRpb25TZWN1cml0eUdyb3VwQXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IFNlY3VyaXR5R3JvdXBSZXN1bHQge1xuICBjb25zdCBhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnQgPVxuICAgIG5ldyBBcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgc2VjdXJpdHlHcm91cDogYXBwbGljYXRpb25TZWN1cml0eUdyb3VwQ29tcG9uZW50LnNlY3VyaXR5R3JvdXAsXG4gICAgc2VjdXJpdHlHcm91cElkOiBhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnQuc2VjdXJpdHlHcm91cElkLFxuICAgIHJ1bGVzOiBhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXBDb21wb25lbnQucnVsZXMsXG4gIH07XG59XG4iXX0=