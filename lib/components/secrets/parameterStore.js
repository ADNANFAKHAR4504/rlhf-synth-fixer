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
exports.ApplicationParametersComponent = exports.DatabaseParametersComponent = exports.ParameterStoreParameterComponent = void 0;
exports.createParameterStoreParameter = createParameterStoreParameter;
exports.createDatabaseParameters = createDatabaseParameters;
exports.createApplicationParameters = createApplicationParameters;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class ParameterStoreParameterComponent extends pulumi.ComponentResource {
    parameter;
    parameterArn;
    parameterName;
    parameterValue;
    constructor(name, args, opts) {
        super('aws:ssm:ParameterStoreParameterComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        // Create parameter object without unsupported properties
        const parameterConfig = {
            name: args.name,
            type: args.type,
            value: args.value,
            description: args.description || `Parameter for ${args.name}`,
            keyId: args.keyId,
            overwrite: args.overwrite ?? true,
            allowedPattern: args.allowedPattern,
            tier: args.tier || 'Standard',
            dataType: args.dataType || 'text',
            tags: defaultTags,
        };
        this.parameter = new aws.ssm.Parameter(`${name}-parameter`, parameterConfig, { parent: this, provider: opts?.provider });
        this.parameterArn = this.parameter.arn;
        this.parameterName = this.parameter.name;
        this.parameterValue = this.parameter.value;
        this.registerOutputs({
            parameter: this.parameter,
            parameterArn: this.parameterArn,
            parameterName: this.parameterName,
            parameterValue: this.parameterValue,
        });
    }
}
exports.ParameterStoreParameterComponent = ParameterStoreParameterComponent;
class DatabaseParametersComponent extends pulumi.ComponentResource {
    hostParameter;
    portParameter;
    nameParameter;
    usernameParameter;
    constructor(name, args, opts) {
        super('aws:ssm:DatabaseParametersComponent', name, {}, opts);
        // Database host parameter
        const hostParameterComponent = new ParameterStoreParameterComponent(`${name}-host`, {
            name: `/app/${args.name}/database/host`,
            type: 'SecureString',
            value: args.databaseHost,
            description: `Database host for ${args.name}`,
            keyId: args.kmsKeyId,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
        );
        this.hostParameter = {
            parameter: hostParameterComponent.parameter,
            parameterArn: hostParameterComponent.parameterArn,
            parameterName: hostParameterComponent.parameterName,
            parameterValue: hostParameterComponent.parameterValue,
        };
        // Database port parameter
        const portParameterComponent = new ParameterStoreParameterComponent(`${name}-port`, {
            name: `/app/${args.name}/database/port`,
            type: 'String',
            value: args.databasePort,
            description: `Database port for ${args.name}`,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
        );
        this.portParameter = {
            parameter: portParameterComponent.parameter,
            parameterArn: portParameterComponent.parameterArn,
            parameterName: portParameterComponent.parameterName,
            parameterValue: portParameterComponent.parameterValue,
        };
        // Database name parameter
        const nameParameterComponent = new ParameterStoreParameterComponent(`${name}-name`, {
            name: `/app/${args.name}/database/name`,
            type: 'String',
            value: args.databaseName,
            description: `Database name for ${args.name}`,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
        );
        this.nameParameter = {
            parameter: nameParameterComponent.parameter,
            parameterArn: nameParameterComponent.parameterArn,
            parameterName: nameParameterComponent.parameterName,
            parameterValue: nameParameterComponent.parameterValue,
        };
        // Database username parameter
        const usernameParameterComponent = new ParameterStoreParameterComponent(`${name}-username`, {
            name: `/app/${args.name}/database/username`,
            type: 'SecureString',
            value: args.databaseUsername,
            description: `Database username for ${args.name}`,
            keyId: args.kmsKeyId,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
        );
        this.usernameParameter = {
            parameter: usernameParameterComponent.parameter,
            parameterArn: usernameParameterComponent.parameterArn,
            parameterName: usernameParameterComponent.parameterName,
            parameterValue: usernameParameterComponent.parameterValue,
        };
        this.registerOutputs({
            hostParameter: this.hostParameter,
            portParameter: this.portParameter,
            nameParameter: this.nameParameter,
            usernameParameter: this.usernameParameter,
        });
    }
}
exports.DatabaseParametersComponent = DatabaseParametersComponent;
class ApplicationParametersComponent extends pulumi.ComponentResource {
    parameters;
    constructor(name, args, opts) {
        super('aws:ssm:ApplicationParametersComponent', name, {}, opts);
        this.parameters = {};
        Object.entries(args.parameters).forEach(([key, paramConfig]) => {
            const parameterComponent = new ParameterStoreParameterComponent(`${name}-${key}`, {
                name: `/app/${args.name}/${key}`,
                type: paramConfig.type || 'String',
                value: paramConfig.value,
                description: paramConfig.description || `${key} parameter for ${args.name}`,
                keyId: paramConfig.type === 'SecureString' ? args.kmsKeyId : undefined,
                tags: args.tags,
            }, { parent: this, provider: opts?.provider });
            this.parameters[key] = {
                parameter: parameterComponent.parameter,
                parameterArn: parameterComponent.parameterArn,
                parameterName: parameterComponent.parameterName,
                parameterValue: parameterComponent.parameterValue,
            };
        });
        this.registerOutputs({
            parameters: this.parameters,
        });
    }
}
exports.ApplicationParametersComponent = ApplicationParametersComponent;
function createParameterStoreParameter(name, args, opts) {
    const parameterComponent = new ParameterStoreParameterComponent(name, args, opts);
    return {
        parameter: parameterComponent.parameter,
        parameterArn: parameterComponent.parameterArn,
        parameterName: parameterComponent.parameterName,
        parameterValue: parameterComponent.parameterValue,
    };
}
function createDatabaseParameters(name, args, opts) {
    const databaseParametersComponent = new DatabaseParametersComponent(name, args, opts);
    return {
        hostParameter: databaseParametersComponent.hostParameter,
        portParameter: databaseParametersComponent.portParameter,
        nameParameter: databaseParametersComponent.nameParameter,
        usernameParameter: databaseParametersComponent.usernameParameter,
    };
}
function createApplicationParameters(name, args, opts) {
    const applicationParametersComponent = new ApplicationParametersComponent(name, args, opts);
    return {
        parameters: applicationParametersComponent.parameters,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyU3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwYXJhbWV0ZXJTdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtUUEsc0VBZ0JDO0FBRUQsNERBZ0JDO0FBRUQsa0VBYUM7QUFwVEQsdURBQXlDO0FBQ3pDLGlEQUFtQztBQTBEbkMsTUFBYSxnQ0FBaUMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzVELFNBQVMsQ0FBb0I7SUFDN0IsWUFBWSxDQUF3QjtJQUNwQyxhQUFhLENBQXdCO0lBQ3JDLGNBQWMsQ0FBd0I7SUFFdEQsWUFDRSxJQUFZLEVBQ1osSUFBaUMsRUFDakMsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFbEUsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLHlEQUF5RDtRQUN6RCxNQUFNLGVBQWUsR0FBMEI7WUFDN0MsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLGlCQUFpQixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQzdELEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJO1lBQ2pDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYztZQUNuQyxJQUFJLEVBQUUsSUFBSSxD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QUFNLDJCQUEyQixHQUFHLElBQUksMkJBQTJCLENBQ2pFLElBQUksRUFDSixJQUFJLEVBQ0osSUFBSSxDQUNMLENBQUM7SUFDRixPQUFPO1FBQ0wsYUFBYSxFQUFFLDJCQUEyQixDQUFDLGFBQWE7UUFDeEQsYUFBYSxFQUFFLDJCQUEyQixDQUFDLGFBQWE7UUFDeEQsYUFBYSxFQUFFLDJCQUEyQixDQUFDLGFBQWE7UUFDeEQsaUJBQWlCLEVBQUUsMkJBQTJCLENBQUMsaUJBQWlCO0tBQ2pFLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0IsMkJBQTJCLENBQ3pDLElBQVksRUFDWixJQUErQixFQUMvQixJQUFzQztJQUV0QyxNQUFNLDhCQUE4QixHQUFHLElBQUksOEJBQThCLENBQ3ZFLElBQUksRUFDSixJQUFJLEVBQ0osSUFBSSxDQUNMLENBQUM7SUFDRixPQUFPO1FBQ0wsVUFBVSxFQUFFLDhCQUE4QixDQUFDLFVBQVU7S0FDdEQsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlckFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHR5cGU6ICdTdHJpbmcnIHwgJ1N0cmluZ0xpc3QnIHwgJ1NlY3VyZVN0cmluZyc7XG4gIHZhbHVlOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGtleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIG92ZXJ3cml0ZT86IGJvb2xlYW47XG4gIGFsbG93ZWRQYXR0ZXJuPzogc3RyaW5nO1xuICB0aWVyPzogJ1N0YW5kYXJkJyB8ICdBZHZhbmNlZCcgfCAnSW50ZWxsaWdlbnQtVGllcmluZyc7XG4gIHBvbGljaWVzPzogc3RyaW5nO1xuICBkYXRhVHlwZT86IHN0cmluZztcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQge1xuICBwYXJhbWV0ZXI6IGF3cy5zc20uUGFyYW1ldGVyO1xuICBwYXJhbWV0ZXJBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcGFyYW1ldGVyTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwYXJhbWV0ZXJWYWx1ZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlUGFyYW1ldGVyc0FyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIGRhdGFiYXNlSG9zdDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGRhdGFiYXNlUG9ydDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGRhdGFiYXNlTmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGRhdGFiYXNlVXNlcm5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEYXRhYmFzZVBhcmFtZXRlcnNSZXN1bHQge1xuICBob3N0UGFyYW1ldGVyOiBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlclJlc3VsdDtcbiAgcG9ydFBhcmFtZXRlcjogUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ7XG4gIG5hbWVQYXJhbWV0ZXI6IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyUmVzdWx0O1xuICB1c2VybmFtZVBhcmFtZXRlcjogUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbGljYXRpb25QYXJhbWV0ZXJzQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgcGFyYW1ldGVyczogUmVjb3JkPFxuICAgIHN0cmluZyxcbiAgICB7XG4gICAgICB2YWx1ZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgICB0eXBlPzogJ1N0cmluZycgfCAnU3RyaW5nTGlzdCcgfCAnU2VjdXJlU3RyaW5nJztcbiAgICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIH1cbiAgPjtcbiAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbGljYXRpb25QYXJhbWV0ZXJzUmVzdWx0IHtcbiAgcGFyYW1ldGVyczogUmVjb3JkPHN0cmluZywgUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ+O1xufVxuXG5leHBvcnQgY2xhc3MgUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgcGFyYW1ldGVyOiBhd3Muc3NtLlBhcmFtZXRlcjtcbiAgcHVibGljIHJlYWRvbmx5IHBhcmFtZXRlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcGFyYW1ldGVyTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcGFyYW1ldGVyVmFsdWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6c3NtOlBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgLy8gQ3JlYXRlIHBhcmFtZXRlciBvYmplY3Qgd2l0aG91dCB1bnN1cHBvcnRlZCBwcm9wZXJ0aWVzXG4gICAgY29uc3QgcGFyYW1ldGVyQ29uZmlnOiBhd3Muc3NtLlBhcmFtZXRlckFyZ3MgPSB7XG4gICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICB0eXBlOiBhcmdzLnR5cGUsXG4gICAgICB2YWx1ZTogYXJncy52YWx1ZSxcbiAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uIHx8IGBQYXJhbWV0ZXIgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICBrZXlJZDogYXJncy5rZXlJZCxcbiAgICAgIG92ZXJ3cml0ZTogYXJncy5vdmVyd3JpdGUgPz8gdHJ1ZSxcbiAgICAgIGFsbG93ZWRQYXR0ZXJuOiBhcmdzLmFsbG93ZWRQYXR0ZXJuLFxuICAgICAgdGllcjogYXJncy50aWVyIHx8ICdTdGFuZGFyZCcsXG4gICAgICBkYXRhVHlwZTogYXJncy5kYXRhVHlwZSB8fCAndGV4dCcsXG4gICAgICB0YWdzOiBkZWZhdWx0VGFncyxcbiAgICB9O1xuXG4gICAgdGhpcy5wYXJhbWV0ZXIgPSBuZXcgYXdzLnNzbS5QYXJhbWV0ZXIoXG4gICAgICBgJHtuYW1lfS1wYXJhbWV0ZXJgLFxuICAgICAgcGFyYW1ldGVyQ29uZmlnLFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9XG4gICAgKTtcblxuICAgIHRoaXMucGFyYW1ldGVyQXJuID0gdGhpcy5wYXJhbWV0ZXIuYXJuO1xuICAgIHRoaXMucGFyYW1ldGVyTmFtZSA9IHRoaXMucGFyYW1ldGVyLm5hbWU7XG4gICAgdGhpcy5wYXJhbWV0ZXJWYWx1ZSA9IHRoaXMucGFyYW1ldGVyLnZhbHVlO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgcGFyYW1ldGVyOiB0aGlzLnBhcmFtZXRlcixcbiAgICAgIHBhcmFtZXRlckFybjogdGhpcy5wYXJhbWV0ZXJBcm4sXG4gICAgICBwYXJhbWV0ZXJOYW1lOiB0aGlzLnBhcmFtZXRlck5hbWUsXG4gICAgICBwYXJhbWV0ZXJWYWx1ZTogdGhpcy5wYXJhbWV0ZXJWYWx1ZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGF0YWJhc2VQYXJhbWV0ZXJzQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGhvc3RQYXJhbWV0ZXI6IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyUmVzdWx0O1xuICBwdWJsaWMgcmVhZG9ubHkgcG9ydFBhcmFtZXRlcjogUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ7XG4gIHB1YmxpYyByZWFkb25seSBuYW1lUGFyYW1ldGVyOiBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlclJlc3VsdDtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJuYW1lUGFyYW1ldGVyOiBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlclJlc3VsdDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRGF0YWJhc2VQYXJhbWV0ZXJzQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnNzbTpEYXRhYmFzZVBhcmFtZXRlcnNDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBEYXRhYmFzZSBob3N0IHBhcmFtZXRlclxuICAgIGNvbnN0IGhvc3RQYXJhbWV0ZXJDb21wb25lbnQgPSBuZXcgUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJDb21wb25lbnQoXG4gICAgICBgJHtuYW1lfS1ob3N0YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYC9hcHAvJHthcmdzLm5hbWV9L2RhdGFiYXNlL2hvc3RgLFxuICAgICAgICB0eXBlOiAnU2VjdXJlU3RyaW5nJyxcbiAgICAgICAgdmFsdWU6IGFyZ3MuZGF0YWJhc2VIb3N0LFxuICAgICAgICBkZXNjcmlwdGlvbjogYERhdGFiYXNlIGhvc3QgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgIGtleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogQWRkZWQgcHJvdmlkZXJcbiAgICApO1xuXG4gICAgdGhpcy5ob3N0UGFyYW1ldGVyID0ge1xuICAgICAgcGFyYW1ldGVyOiBob3N0UGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgIHBhcmFtZXRlckFybjogaG9zdFBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJBcm4sXG4gICAgICBwYXJhbWV0ZXJOYW1lOiBob3N0UGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlck5hbWUsXG4gICAgICBwYXJhbWV0ZXJWYWx1ZTogaG9zdFBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICB9O1xuXG4gICAgLy8gRGF0YWJhc2UgcG9ydCBwYXJhbWV0ZXJcbiAgICBjb25zdCBwb3J0UGFyYW1ldGVyQ29tcG9uZW50ID0gbmV3IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tcG9ydGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAvYXBwLyR7YXJncy5uYW1lfS9kYXRhYmFzZS9wb3J0YCxcbiAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgIHZhbHVlOiBhcmdzLmRhdGFiYXNlUG9ydCxcbiAgICAgICAgZGVzY3JpcHRpb246IGBEYXRhYmFzZSBwb3J0IGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogQWRkZWQgcHJvdmlkZXJcbiAgICApO1xuXG4gICAgdGhpcy5wb3J0UGFyYW1ldGVyID0ge1xuICAgICAgcGFyYW1ldGVyOiBwb3J0UGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgIHBhcmFtZXRlckFybjogcG9ydFBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJBcm4sXG4gICAgICBwYXJhbWV0ZXJOYW1lOiBwb3J0UGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlck5hbWUsXG4gICAgICBwYXJhbWV0ZXJWYWx1ZTogcG9ydFBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICB9O1xuXG4gICAgLy8gRGF0YWJhc2UgbmFtZSBwYXJhbWV0ZXJcbiAgICBjb25zdCBuYW1lUGFyYW1ldGVyQ29tcG9uZW50ID0gbmV3IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tbmFtZWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAvYXBwLyR7YXJncy5uYW1lfS9kYXRhYmFzZS9uYW1lYCxcbiAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgIHZhbHVlOiBhcmdzLmRhdGFiYXNlTmFtZSxcbiAgICAgICAgZGVzY3JpcHRpb246IGBEYXRhYmFzZSBuYW1lIGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogQWRkZWQgcHJvdmlkZXJcbiAgICApO1xuXG4gICAgdGhpcy5uYW1lUGFyYW1ldGVyID0ge1xuICAgICAgcGFyYW1ldGVyOiBuYW1lUGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgIHBhcmFtZXRlckFybjogbmFtZVBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJBcm4sXG4gICAgICBwYXJhbWV0ZXJOYW1lOiBuYW1lUGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlck5hbWUsXG4gICAgICBwYXJhbWV0ZXJWYWx1ZTogbmFtZVBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICB9O1xuXG4gICAgLy8gRGF0YWJhc2UgdXNlcm5hbWUgcGFyYW1ldGVyXG4gICAgY29uc3QgdXNlcm5hbWVQYXJhbWV0ZXJDb21wb25lbnQgPSBuZXcgUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJDb21wb25lbnQoXG4gICAgICBgJHtuYW1lfS11c2VybmFtZWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAvYXBwLyR7YXJncy5uYW1lfS9kYXRhYmFzZS91c2VybmFtZWAsXG4gICAgICAgIHR5cGU6ICdTZWN1cmVTdHJpbmcnLFxuICAgICAgICB2YWx1ZTogYXJncy5kYXRhYmFzZVVzZXJuYW1lLFxuICAgICAgICBkZXNjcmlwdGlvbjogYERhdGFiYXNlIHVzZXJuYW1lIGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICBrZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfSAvLyDihpAgRklYRUQ6IEFkZGVkIHByb3ZpZGVyXG4gICAgKTtcblxuICAgIHRoaXMudXNlcm5hbWVQYXJhbWV0ZXIgPSB7XG4gICAgICBwYXJhbWV0ZXI6IHVzZXJuYW1lUGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgIHBhcmFtZXRlckFybjogdXNlcm5hbWVQYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyQXJuLFxuICAgICAgcGFyYW1ldGVyTmFtZTogdXNlcm5hbWVQYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyTmFtZSxcbiAgICAgIHBhcmFtZXRlclZhbHVlOiB1c2VybmFtZVBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICB9O1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgaG9zdFBhcmFtZXRlcjogdGhpcy5ob3N0UGFyYW1ldGVyLFxuICAgICAgcG9ydFBhcmFtZXRlcjogdGhpcy5wb3J0UGFyYW1ldGVyLFxuICAgICAgbmFtZVBhcmFtZXRlcjogdGhpcy5uYW1lUGFyYW1ldGVyLFxuICAgICAgdXNlcm5hbWVQYXJhbWV0ZXI6IHRoaXMudXNlcm5hbWVQYXJhbWV0ZXIsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uUGFyYW1ldGVyc0NvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlclJlc3VsdD47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEFwcGxpY2F0aW9uUGFyYW1ldGVyc0FyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpzc206QXBwbGljYXRpb25QYXJhbWV0ZXJzQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgdGhpcy5wYXJhbWV0ZXJzID0ge307XG5cbiAgICBPYmplY3QuZW50cmllcyhhcmdzLnBhcmFtZXRlcnMpLmZvckVhY2goKFtrZXksIHBhcmFtQ29uZmlnXSkgPT4ge1xuICAgICAgY29uc3QgcGFyYW1ldGVyQ29tcG9uZW50ID0gbmV3IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQ29tcG9uZW50KFxuICAgICAgICBgJHtuYW1lfS0ke2tleX1gLFxuICAgICAgICB7XG4gICAgICAgICAgbmFtZTogYC9hcHAvJHthcmdzLm5hbWV9LyR7a2V5fWAsXG4gICAgICAgICAgdHlwZTogcGFyYW1Db25maWcudHlwZSB8fCAnU3RyaW5nJyxcbiAgICAgICAgICB2YWx1ZTogcGFyYW1Db25maWcudmFsdWUsXG4gICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICBwYXJhbUNvbmZpZy5kZXNjcmlwdGlvbiB8fCBgJHtrZXl9IHBhcmFtZXRlciBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICBrZXlJZDpcbiAgICAgICAgICAgIHBhcmFtQ29uZmlnLnR5cGUgPT09ICdTZWN1cmVTdHJpbmcnID8gYXJncy5rbXNLZXlJZCA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICAgKTtcblxuICAgICAgdGhpcy5wYXJhbWV0ZXJzW2tleV0gPSB7XG4gICAgICAgIHBhcmFtZXRlcjogcGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgICAgcGFyYW1ldGVyQXJuOiBwYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyQXJuLFxuICAgICAgICBwYXJhbWV0ZXJOYW1lOiBwYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyTmFtZSxcbiAgICAgICAgcGFyYW1ldGVyVmFsdWU6IHBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBwYXJhbWV0ZXJzOiB0aGlzLnBhcmFtZXRlcnMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBhcmFtZXRlclN0b3JlUGFyYW1ldGVyKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQXJncyxcbiAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbik6IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyUmVzdWx0IHtcbiAgY29uc3QgcGFyYW1ldGVyQ29tcG9uZW50ID0gbmV3IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzXG4gICk7XG4gIHJldHVybiB7XG4gICAgcGFyYW1ldGVyOiBwYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyLFxuICAgIHBhcmFtZXRlckFybjogcGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlckFybixcbiAgICBwYXJhbWV0ZXJOYW1lOiBwYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyTmFtZSxcbiAgICBwYXJhbWV0ZXJWYWx1ZTogcGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlclZhbHVlLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGF0YWJhc2VQYXJhbWV0ZXJzKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IERhdGFiYXNlUGFyYW1ldGVyc0FyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBEYXRhYmFzZVBhcmFtZXRlcnNSZXN1bHQge1xuICBjb25zdCBkYXRhYmFzZVBhcmFtZXRlcnNDb21wb25lbnQgPSBuZXcgRGF0YWJhc2VQYXJhbWV0ZXJzQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzXG4gICk7XG4gIHJldHVybiB7XG4gICAgaG9zdFBhcmFtZXRlcjogZGF0YWJhc2VQYXJhbWV0ZXJzQ29tcG9uZW50Lmhvc3RQYXJhbWV0ZXIsXG4gICAgcG9ydFBhcmFtZXRlcjogZGF0YWJhc2VQYXJhbWV0ZXJzQ29tcG9uZW50LnBvcnRQYXJhbWV0ZXIsXG4gICAgbmFtZVBhcmFtZXRlcjogZGF0YWJhc2VQYXJhbWV0ZXJzQ29tcG9uZW50Lm5hbWVQYXJhbWV0ZXIsXG4gICAgdXNlcm5hbWVQYXJhbWV0ZXI6IGRhdGFiYXNlUGFyYW1ldGVyc0NvbXBvbmVudC51c2VybmFtZVBhcmFtZXRlcixcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFwcGxpY2F0aW9uUGFyYW1ldGVycyhcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBBcHBsaWNhdGlvblBhcmFtZXRlcnNBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogQXBwbGljYXRpb25QYXJhbWV0ZXJzUmVzdWx0IHtcbiAgY29uc3QgYXBwbGljYXRpb25QYXJhbWV0ZXJzQ29tcG9uZW50ID0gbmV3IEFwcGxpY2F0aW9uUGFyYW1ldGVyc0NvbXBvbmVudChcbiAgICBuYW1lLFxuICAgIGFyZ3MsXG4gICAgb3B0c1xuICApO1xuICByZXR1cm4ge1xuICAgIHBhcmFtZXRlcnM6IGFwcGxpY2F0aW9uUGFyYW1ldGVyc0NvbXBvbmVudC5wYXJhbWV0ZXJzLFxuICB9O1xufVxuIl19