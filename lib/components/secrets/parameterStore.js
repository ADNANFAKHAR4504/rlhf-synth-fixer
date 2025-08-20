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
        super("aws:ssm:ParameterStoreParameterComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
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
            tier: args.tier || "Standard",
            dataType: args.dataType || "text",
            tags: defaultTags,
        };
        // Only add policies if supported (removed from parameter creation)
        // The policies property is not supported in the current provider version
        this.parameter = new aws.ssm.Parameter(`${name}-parameter`, parameterConfig, { parent: this });
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
        super("aws:ssm:DatabaseParametersComponent", name, {}, opts);
        // Database host parameter
        const hostParameterComponent = new ParameterStoreParameterComponent(`${name}-host`, {
            name: `/app/${args.name}/database/host`,
            type: "SecureString",
            value: args.databaseHost,
            description: `Database host for ${args.name}`,
            keyId: args.kmsKeyId,
            tags: args.tags,
        }, { parent: this });
        this.hostParameter = {
            parameter: hostParameterComponent.parameter,
            parameterArn: hostParameterComponent.parameterArn,
            parameterName: hostParameterComponent.parameterName,
            parameterValue: hostParameterComponent.parameterValue,
        };
        // Database port parameter
        const portParameterComponent = new ParameterStoreParameterComponent(`${name}-port`, {
            name: `/app/${args.name}/database/port`,
            type: "String",
            value: args.databasePort,
            description: `Database port for ${args.name}`,
            tags: args.tags,
        }, { parent: this });
        this.portParameter = {
            parameter: portParameterComponent.parameter,
            parameterArn: portParameterComponent.parameterArn,
            parameterName: portParameterComponent.parameterName,
            parameterValue: portParameterComponent.parameterValue,
        };
        // Database name parameter
        const nameParameterComponent = new ParameterStoreParameterComponent(`${name}-name`, {
            name: `/app/${args.name}/database/name`,
            type: "String",
            value: args.databaseName,
            description: `Database name for ${args.name}`,
            tags: args.tags,
        }, { parent: this });
        this.nameParameter = {
            parameter: nameParameterComponent.parameter,
            parameterArn: nameParameterComponent.parameterArn,
            parameterName: nameParameterComponent.parameterName,
            parameterValue: nameParameterComponent.parameterValue,
        };
        // Database username parameter
        const usernameParameterComponent = new ParameterStoreParameterComponent(`${name}-username`, {
            name: `/app/${args.name}/database/username`,
            type: "SecureString",
            value: args.databaseUsername,
            description: `Database username for ${args.name}`,
            keyId: args.kmsKeyId,
            tags: args.tags,
        }, { parent: this });
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
        super("aws:ssm:ApplicationParametersComponent", name, {}, opts);
        this.parameters = {};
        Object.entries(args.parameters).forEach(([key, paramConfig]) => {
            const parameterComponent = new ParameterStoreParameterComponent(`${name}-${key}`, {
                name: `/app/${args.name}/${key}`,
                type: paramConfig.type || "String",
                value: paramConfig.value,
                description: paramConfig.description || `${key} parameter for ${args.name}`,
                keyId: paramConfig.type === "SecureString" ? args.kmsKeyId : undefined,
                tags: args.tags,
            }, { parent: this });
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
function createParameterStoreParameter(name, args) {
    const parameterComponent = new ParameterStoreParameterComponent(name, args);
    return {
        parameter: parameterComponent.parameter,
        parameterArn: parameterComponent.parameterArn,
        parameterName: parameterComponent.parameterName,
        parameterValue: parameterComponent.parameterValue,
    };
}
function createDatabaseParameters(name, args) {
    const databaseParametersComponent = new DatabaseParametersComponent(name, args);
    return {
        hostParameter: databaseParametersComponent.hostParameter,
        portParameter: databaseParametersComponent.portParameter,
        nameParameter: databaseParametersComponent.nameParameter,
        usernameParameter: databaseParametersComponent.usernameParameter,
    };
}
function createApplicationParameters(name, args) {
    const applicationParametersComponent = new ApplicationParametersComponent(name, args);
    return {
        parameters: applicationParametersComponent.parameters,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFyYW1ldGVyU3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwYXJhbWV0ZXJTdG9yZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2TkEsc0VBUUM7QUFFRCw0REFRQztBQUVELGtFQUtDO0FBdFBELHVEQUF5QztBQUN6QyxpREFBbUM7QUF1RG5DLE1BQWEsZ0NBQWlDLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUMxRCxTQUFTLENBQW9CO0lBQzdCLFlBQVksQ0FBd0I7SUFDcEMsYUFBYSxDQUF3QjtJQUNyQyxjQUFjLENBQXdCO0lBRXRELFlBQVksSUFBWSxFQUFFLElBQWlDLEVBQUUsSUFBc0M7UUFDL0YsS0FBSyxDQUFDLDBDQUEwQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFbEUsTUFBTSxXQUFXLEdBQUc7WUFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2YsQ0FBQztRQUVGLHlEQUF5RDtRQUN6RCxNQUFNLGVBQWUsR0FBMEI7WUFDM0MsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1lBQ2pCLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxJQUFJLGlCQUFpQixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQzdELEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztZQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJO1lBQ2pDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYztZQUNuQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxVQUFVO1lBQzdCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLE1BQU07WUFDakMsSUFBSSxFQUFFLFdBQVc7U0FDcEIsQ0FBQztRQUVGLG1FQUFtRTtRQUNuRSx5RUFBeUU7UUFFekUsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxZQUFZLEVBQUUsZUFBZSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFL0YsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztRQUN2QyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUM7UUFFM0MsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNqQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDekIsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQy9CLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtZQUNqQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7U0FDdEMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBL0NELDRFQStDQztBQUVELE1BQWEsMkJBQTRCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNyRCxhQUFhLENBQWdDO0lBQzdDLGFBQWEsQ0FBZ0M7SUFDN0MsYUFBYSxDQUFnQztJQUM3QyxpQkFBaUIsQ0FBZ0M7SUFFakUsWUFBWSxJQUFZLEVBQUUsSUFBNEIsRUFBRSxJQUFzQztRQUMxRixLQUFLLENBQUMscUNBQXFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU3RCwwQkFBMEI7UUFDMUIsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLGdDQUFnQyxDQUFDLEdBQUcsSUFBSSxPQUFPLEVBQUU7WUFDaEYsSUFBSSxFQUFFLFFBQVEsSUFBSSxDQUFDLElBQUksZ0JBQWdCO1lBQ3ZDLElBQUksRUFBRSxjQUFjO1lBQ3BCLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWTtZQUN4QixXQUFXLEVBQUUscUJBQXFCLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDN0MsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3BCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNsQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsSUFBSSxDQUFDLGFBQWEsR0FBRztZQUNqQixTQUFTLEVBQUUsc0JBQXNCLENBQUMsU0FBUztZQUMzQyxZQUFZLEVBQUUsc0JBQXNCLENBQUMsWUFBWTtZQUNqRCxhQUFhLEVBQUUsc0JBQXNCLENBQUMsYUFBYTtZQUNuRCxjQUFjLEVBQUUsc0JBQXNCLENBQUMsY0FBYztTQUN4RCxDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxnQ0FBZ0MsQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFO1lBQ2hGLElBQUksRUFBRSxRQUFRLElBQUksQ0FBQyxJQUFJLGdCQUFnQjtZQUN2QyxJQUFJLEVBQUUsUUFBUTtZQUNkLEtBQUssRUFBRSxJQUFJLENBQUMsWUFBWTtZQUN4QixXQUFXLEVBQUUscUJBQXFCLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDN0MsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ2xCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVyQixJQUFJLENBQUMsYUFBYSxHQUFHO1lBQ2pCLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxTQUFTO1lBQzNDLFlBQVksRUFBRSxzQkFBc0IsQ0FBQyxZQUFZO1lBQ2pELGFBQWEsRUFBRSxzQkFBc0IsQ0FBQyxhQUFhO1lBQ25ELGNBQWMsRUFBRSxzQkFBc0IsQ0FBQyxjQUFjO1NBQ3hELENBQUM7UUFFRiwwQkFBMEI7UUFDMUIsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLGdDQUFnQyxDQUFDLEdBQUcsSUFBSSxPQUFPLEVBQUU7WUFDaEYsSUFBSSxFQUFFLFFBQVEsSUFBSSxDQUFDLElBQUksZ0JBQWdCO1lBQ3ZDLElBQUksRUFBRSxRQUFRO1lBQ2QsS0FBSyxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQ3hCLFdBQVcsRUFBRSxxQkFBcUIsSUFBSSxDQUFDLElBQUksRUFBRTtZQUM3QyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDbEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxhQUFhLEdBQUc7WUFDakIsU0FBUyxFQUFFLHNCQUFzQixDQUFDLFNBQVM7WUFDM0MsWUFBWSxFQUFFLHNCQUFzQixDQUFDLFlBQVk7WUFDakQsYUFBYSxFQUFFLHNCQUFzQixDQUFDLGFBQWE7WUFDbkQsY0FBYyxFQUFFLHNCQUFzQixDQUFDLGNBQWM7U0FDeEQsQ0FBQztRQUVGLDhCQUE4QjtRQUM5QixNQUFNLDBCQUEwQixHQUFHLElBQUksZ0NBQWdDLENBQUMsR0FBRyxJQUFJLFdBQVcsRUFBRTtZQUN4RixJQUFJLEVBQUUsUUFBUSxJQUFJLENBQUMsSUFBSSxvQkFBb0I7WUFDM0MsSUFBSSxFQUFFLGNBQWM7WUFDcEIsS0FBSyxFQUFFLElBQUksQ0FBQyxnQkFBZ0I7WUFDNUIsV0FBVyxFQUFFLHlCQUF5QixJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ2pELEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUTtZQUNwQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDbEIsRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXJCLElBQUksQ0FBQyxpQkFBaUIsR0FBRztZQUNyQixTQUFTLEVBQUUsMEJBQTBCLENBQUMsU0FBUztZQUMvQyxZQUFZLEVBQUUsMEJBQTBCLENBQUMsWUFBWTtZQUNyRCxhQUFhLEVBQUUsMEJBQTBCLENBQUMsYUFBYTtZQUN2RCxjQUFjLEVBQUUsMEJBQTBCLENBQUMsY0FBYztTQUM1RCxDQUFDO1FBRUYsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNqQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7WUFDakMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLGFBQWEsRUFBRSxJQUFJLENBQUMsYUFBYTtZQUNqQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCO1NBQzVDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQWxGRCxrRUFrRkM7QUFFRCxNQUFhLDhCQUErQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDeEQsVUFBVSxDQUFnRDtJQUUxRSxZQUFZLElBQVksRUFBRSxJQUErQixFQUFFLElBQXNDO1FBQzdGLEtBQUssQ0FBQyx3Q0FBd0MsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWhFLElBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBRXJCLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxFQUFFLEVBQUU7WUFDM0QsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLGdDQUFnQyxDQUFDLEdBQUcsSUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFO2dCQUM5RSxJQUFJLEVBQUUsUUFBUSxJQUFJLENBQUMsSUFBSSxJQUFJLEdBQUcsRUFBRTtnQkFDaEMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxJQUFJLElBQUksUUFBUTtnQkFDbEMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLO2dCQUN4QixXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVcsSUFBSSxHQUFHLEdBQUcsa0JBQWtCLElBQUksQ0FBQyxJQUFJLEVBQUU7Z0JBQzNFLEtBQUssRUFBRSxXQUFXLENBQUMsSUFBSSxLQUFLLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsU0FBUztnQkFDdEUsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO2FBQ2xCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUVyQixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHO2dCQUNuQixTQUFTLEVBQUUsa0JBQWtCLENBQUMsU0FBUztnQkFDdkMsWUFBWSxFQUFFLGtCQUFrQixDQUFDLFlBQVk7Z0JBQzdDLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxhQUFhO2dCQUMvQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsY0FBYzthQUNwRCxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ2pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtTQUM5QixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUE5QkQsd0VBOEJDO0FBRUQsU0FBZ0IsNkJBQTZCLENBQUMsSUFBWSxFQUFFLElBQWlDO0lBQ3pGLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxnQ0FBZ0MsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUUsT0FBTztRQUNILFNBQVMsRUFBRSxrQkFBa0IsQ0FBQyxTQUFTO1FBQ3ZDLFlBQVksRUFBRSxrQkFBa0IsQ0FBQyxZQUFZO1FBQzdDLGFBQWEsRUFBRSxrQkFBa0IsQ0FBQyxhQUFhO1FBQy9DLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxjQUFjO0tBQ3BELENBQUM7QUFDTixDQUFDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsSUFBWSxFQUFFLElBQTRCO0lBQy9FLE1BQU0sMkJBQTJCLEdBQUcsSUFBSSwyQkFBMkIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDaEYsT0FBTztRQUNILGFBQWEsRUFBRSwyQkFBMkIsQ0FBQyxhQUFhO1FBQ3hELGFBQWEsRUFBRSwyQkFBMkIsQ0FBQyxhQUFhO1FBQ3hELGFBQWEsRUFBRSwyQkFBMkIsQ0FBQyxhQUFhO1FBQ3hELGlCQUFpQixFQUFFLDJCQUEyQixDQUFDLGlCQUFpQjtLQUNuRSxDQUFDO0FBQ04sQ0FBQztBQUVELFNBQWdCLDJCQUEyQixDQUFDLElBQVksRUFBRSxJQUErQjtJQUNyRixNQUFNLDhCQUE4QixHQUFHLElBQUksOEJBQThCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RGLE9BQU87UUFDSCxVQUFVLEVBQUUsOEJBQThCLENBQUMsVUFBVTtLQUN4RCxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlckFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB0eXBlOiBcIlN0cmluZ1wiIHwgXCJTdHJpbmdMaXN0XCIgfCBcIlNlY3VyZVN0cmluZ1wiO1xuICAgIHZhbHVlOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICBrZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIG92ZXJ3cml0ZT86IGJvb2xlYW47XG4gICAgYWxsb3dlZFBhdHRlcm4/OiBzdHJpbmc7XG4gICAgdGllcj86IFwiU3RhbmRhcmRcIiB8IFwiQWR2YW5jZWRcIiB8IFwiSW50ZWxsaWdlbnQtVGllcmluZ1wiO1xuICAgIHBvbGljaWVzPzogc3RyaW5nO1xuICAgIGRhdGFUeXBlPzogc3RyaW5nO1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyUmVzdWx0IHtcbiAgICBwYXJhbWV0ZXI6IGF3cy5zc20uUGFyYW1ldGVyO1xuICAgIHBhcmFtZXRlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHBhcmFtZXRlck5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwYXJhbWV0ZXJWYWx1ZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlUGFyYW1ldGVyc0FyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkYXRhYmFzZUhvc3Q6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGRhdGFiYXNlUG9ydDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgZGF0YWJhc2VOYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBkYXRhYmFzZVVzZXJuYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlUGFyYW1ldGVyc1Jlc3VsdCB7XG4gICAgaG9zdFBhcmFtZXRlcjogUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ7XG4gICAgcG9ydFBhcmFtZXRlcjogUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ7XG4gICAgbmFtZVBhcmFtZXRlcjogUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ7XG4gICAgdXNlcm5hbWVQYXJhbWV0ZXI6IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyUmVzdWx0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFwcGxpY2F0aW9uUGFyYW1ldGVyc0FyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBwYXJhbWV0ZXJzOiBSZWNvcmQ8c3RyaW5nLCB7XG4gICAgICAgIHZhbHVlOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICAgICAgdHlwZT86IFwiU3RyaW5nXCIgfCBcIlN0cmluZ0xpc3RcIiB8IFwiU2VjdXJlU3RyaW5nXCI7XG4gICAgICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xuICAgIH0+O1xuICAgIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbGljYXRpb25QYXJhbWV0ZXJzUmVzdWx0IHtcbiAgICBwYXJhbWV0ZXJzOiBSZWNvcmQ8c3RyaW5nLCBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlclJlc3VsdD47XG59XG5cbmV4cG9ydCBjbGFzcyBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlckNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHBhcmFtZXRlcjogYXdzLnNzbS5QYXJhbWV0ZXI7XG4gICAgcHVibGljIHJlYWRvbmx5IHBhcmFtZXRlckFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IHBhcmFtZXRlclZhbHVlOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6c3NtOlBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBDcmVhdGUgcGFyYW1ldGVyIG9iamVjdCB3aXRob3V0IHVuc3VwcG9ydGVkIHByb3BlcnRpZXNcbiAgICAgICAgY29uc3QgcGFyYW1ldGVyQ29uZmlnOiBhd3Muc3NtLlBhcmFtZXRlckFyZ3MgPSB7XG4gICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICB0eXBlOiBhcmdzLnR5cGUsXG4gICAgICAgICAgICB2YWx1ZTogYXJncy52YWx1ZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uIHx8IGBQYXJhbWV0ZXIgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgICAgICBrZXlJZDogYXJncy5rZXlJZCxcbiAgICAgICAgICAgIG92ZXJ3cml0ZTogYXJncy5vdmVyd3JpdGUgPz8gdHJ1ZSxcbiAgICAgICAgICAgIGFsbG93ZWRQYXR0ZXJuOiBhcmdzLmFsbG93ZWRQYXR0ZXJuLFxuICAgICAgICAgICAgdGllcjogYXJncy50aWVyIHx8IFwiU3RhbmRhcmRcIixcbiAgICAgICAgICAgIGRhdGFUeXBlOiBhcmdzLmRhdGFUeXBlIHx8IFwidGV4dFwiLFxuICAgICAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gT25seSBhZGQgcG9saWNpZXMgaWYgc3VwcG9ydGVkIChyZW1vdmVkIGZyb20gcGFyYW1ldGVyIGNyZWF0aW9uKVxuICAgICAgICAvLyBUaGUgcG9saWNpZXMgcHJvcGVydHkgaXMgbm90IHN1cHBvcnRlZCBpbiB0aGUgY3VycmVudCBwcm92aWRlciB2ZXJzaW9uXG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXIgPSBuZXcgYXdzLnNzbS5QYXJhbWV0ZXIoYCR7bmFtZX0tcGFyYW1ldGVyYCwgcGFyYW1ldGVyQ29uZmlnLCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnBhcmFtZXRlckFybiA9IHRoaXMucGFyYW1ldGVyLmFybjtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJOYW1lID0gdGhpcy5wYXJhbWV0ZXIubmFtZTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJWYWx1ZSA9IHRoaXMucGFyYW1ldGVyLnZhbHVlO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHBhcmFtZXRlcjogdGhpcy5wYXJhbWV0ZXIsXG4gICAgICAgICAgICBwYXJhbWV0ZXJBcm46IHRoaXMucGFyYW1ldGVyQXJuLFxuICAgICAgICAgICAgcGFyYW1ldGVyTmFtZTogdGhpcy5wYXJhbWV0ZXJOYW1lLFxuICAgICAgICAgICAgcGFyYW1ldGVyVmFsdWU6IHRoaXMucGFyYW1ldGVyVmFsdWUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlUGFyYW1ldGVyc0NvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGhvc3RQYXJhbWV0ZXI6IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyUmVzdWx0O1xuICAgIHB1YmxpYyByZWFkb25seSBwb3J0UGFyYW1ldGVyOiBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlclJlc3VsdDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbmFtZVBhcmFtZXRlcjogUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ7XG4gICAgcHVibGljIHJlYWRvbmx5IHVzZXJuYW1lUGFyYW1ldGVyOiBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlclJlc3VsdDtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogRGF0YWJhc2VQYXJhbWV0ZXJzQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6c3NtOkRhdGFiYXNlUGFyYW1ldGVyc0NvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgLy8gRGF0YWJhc2UgaG9zdCBwYXJhbWV0ZXJcbiAgICAgICAgY29uc3QgaG9zdFBhcmFtZXRlckNvbXBvbmVudCA9IG5ldyBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlckNvbXBvbmVudChgJHtuYW1lfS1ob3N0YCwge1xuICAgICAgICAgICAgbmFtZTogYC9hcHAvJHthcmdzLm5hbWV9L2RhdGFiYXNlL2hvc3RgLFxuICAgICAgICAgICAgdHlwZTogXCJTZWN1cmVTdHJpbmdcIixcbiAgICAgICAgICAgIHZhbHVlOiBhcmdzLmRhdGFiYXNlSG9zdCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRGF0YWJhc2UgaG9zdCBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICAgIGtleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmhvc3RQYXJhbWV0ZXIgPSB7XG4gICAgICAgICAgICBwYXJhbWV0ZXI6IGhvc3RQYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyLFxuICAgICAgICAgICAgcGFyYW1ldGVyQXJuOiBob3N0UGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlckFybixcbiAgICAgICAgICAgIHBhcmFtZXRlck5hbWU6IGhvc3RQYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyTmFtZSxcbiAgICAgICAgICAgIHBhcmFtZXRlclZhbHVlOiBob3N0UGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlclZhbHVlLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIERhdGFiYXNlIHBvcnQgcGFyYW1ldGVyXG4gICAgICAgIGNvbnN0IHBvcnRQYXJhbWV0ZXJDb21wb25lbnQgPSBuZXcgUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJDb21wb25lbnQoYCR7bmFtZX0tcG9ydGAsIHtcbiAgICAgICAgICAgIG5hbWU6IGAvYXBwLyR7YXJncy5uYW1lfS9kYXRhYmFzZS9wb3J0YCxcbiAgICAgICAgICAgIHR5cGU6IFwiU3RyaW5nXCIsXG4gICAgICAgICAgICB2YWx1ZTogYXJncy5kYXRhYmFzZVBvcnQsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYERhdGFiYXNlIHBvcnQgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucG9ydFBhcmFtZXRlciA9IHtcbiAgICAgICAgICAgIHBhcmFtZXRlcjogcG9ydFBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXIsXG4gICAgICAgICAgICBwYXJhbWV0ZXJBcm46IHBvcnRQYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyQXJuLFxuICAgICAgICAgICAgcGFyYW1ldGVyTmFtZTogcG9ydFBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJOYW1lLFxuICAgICAgICAgICAgcGFyYW1ldGVyVmFsdWU6IHBvcnRQYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyVmFsdWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gRGF0YWJhc2UgbmFtZSBwYXJhbWV0ZXJcbiAgICAgICAgY29uc3QgbmFtZVBhcmFtZXRlckNvbXBvbmVudCA9IG5ldyBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlckNvbXBvbmVudChgJHtuYW1lfS1uYW1lYCwge1xuICAgICAgICAgICAgbmFtZTogYC9hcHAvJHthcmdzLm5hbWV9L2RhdGFiYXNlL25hbWVgLFxuICAgICAgICAgICAgdHlwZTogXCJTdHJpbmdcIixcbiAgICAgICAgICAgIHZhbHVlOiBhcmdzLmRhdGFiYXNlTmFtZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRGF0YWJhc2UgbmFtZSBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5uYW1lUGFyYW1ldGVyID0ge1xuICAgICAgICAgICAgcGFyYW1ldGVyOiBuYW1lUGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgICAgICAgIHBhcmFtZXRlckFybjogbmFtZVBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJBcm4sXG4gICAgICAgICAgICBwYXJhbWV0ZXJOYW1lOiBuYW1lUGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlck5hbWUsXG4gICAgICAgICAgICBwYXJhbWV0ZXJWYWx1ZTogbmFtZVBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBEYXRhYmFzZSB1c2VybmFtZSBwYXJhbWV0ZXJcbiAgICAgICAgY29uc3QgdXNlcm5hbWVQYXJhbWV0ZXJDb21wb25lbnQgPSBuZXcgUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJDb21wb25lbnQoYCR7bmFtZX0tdXNlcm5hbWVgLCB7XG4gICAgICAgICAgICBuYW1lOiBgL2FwcC8ke2FyZ3MubmFtZX0vZGF0YWJhc2UvdXNlcm5hbWVgLFxuICAgICAgICAgICAgdHlwZTogXCJTZWN1cmVTdHJpbmdcIixcbiAgICAgICAgICAgIHZhbHVlOiBhcmdzLmRhdGFiYXNlVXNlcm5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYERhdGFiYXNlIHVzZXJuYW1lIGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICAgICAga2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMudXNlcm5hbWVQYXJhbWV0ZXIgPSB7XG4gICAgICAgICAgICBwYXJhbWV0ZXI6IHVzZXJuYW1lUGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgICAgICAgIHBhcmFtZXRlckFybjogdXNlcm5hbWVQYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyQXJuLFxuICAgICAgICAgICAgcGFyYW1ldGVyTmFtZTogdXNlcm5hbWVQYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyTmFtZSxcbiAgICAgICAgICAgIHBhcmFtZXRlclZhbHVlOiB1c2VybmFtZVBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBob3N0UGFyYW1ldGVyOiB0aGlzLmhvc3RQYXJhbWV0ZXIsXG4gICAgICAgICAgICBwb3J0UGFyYW1ldGVyOiB0aGlzLnBvcnRQYXJhbWV0ZXIsXG4gICAgICAgICAgICBuYW1lUGFyYW1ldGVyOiB0aGlzLm5hbWVQYXJhbWV0ZXIsXG4gICAgICAgICAgICB1c2VybmFtZVBhcmFtZXRlcjogdGhpcy51c2VybmFtZVBhcmFtZXRlcixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXBwbGljYXRpb25QYXJhbWV0ZXJzQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGFyYW1ldGVyczogUmVjb3JkPHN0cmluZywgUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXJSZXN1bHQ+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBBcHBsaWNhdGlvblBhcmFtZXRlcnNBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpzc206QXBwbGljYXRpb25QYXJhbWV0ZXJzQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMgPSB7fTtcblxuICAgICAgICBPYmplY3QuZW50cmllcyhhcmdzLnBhcmFtZXRlcnMpLmZvckVhY2goKFtrZXksIHBhcmFtQ29uZmlnXSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcGFyYW1ldGVyQ29tcG9uZW50ID0gbmV3IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQ29tcG9uZW50KGAke25hbWV9LSR7a2V5fWAsIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBgL2FwcC8ke2FyZ3MubmFtZX0vJHtrZXl9YCxcbiAgICAgICAgICAgICAgICB0eXBlOiBwYXJhbUNvbmZpZy50eXBlIHx8IFwiU3RyaW5nXCIsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHBhcmFtQ29uZmlnLnZhbHVlLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBwYXJhbUNvbmZpZy5kZXNjcmlwdGlvbiB8fCBgJHtrZXl9IHBhcmFtZXRlciBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICAgICAgICBrZXlJZDogcGFyYW1Db25maWcudHlwZSA9PT0gXCJTZWN1cmVTdHJpbmdcIiA/IGFyZ3Mua21zS2V5SWQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVyc1trZXldID0ge1xuICAgICAgICAgICAgICAgIHBhcmFtZXRlcjogcGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJBcm46IHBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJBcm4sXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyTmFtZTogcGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlck5hbWUsXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyVmFsdWU6IHBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHBhcmFtZXRlcnM6IHRoaXMucGFyYW1ldGVycyxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGFyYW1ldGVyU3RvcmVQYXJhbWV0ZXIobmFtZTogc3RyaW5nLCBhcmdzOiBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlckFyZ3MpOiBQYXJhbWV0ZXJTdG9yZVBhcmFtZXRlclJlc3VsdCB7XG4gICAgY29uc3QgcGFyYW1ldGVyQ29tcG9uZW50ID0gbmV3IFBhcmFtZXRlclN0b3JlUGFyYW1ldGVyQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHBhcmFtZXRlcjogcGFyYW1ldGVyQ29tcG9uZW50LnBhcmFtZXRlcixcbiAgICAgICAgcGFyYW1ldGVyQXJuOiBwYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyQXJuLFxuICAgICAgICBwYXJhbWV0ZXJOYW1lOiBwYXJhbWV0ZXJDb21wb25lbnQucGFyYW1ldGVyTmFtZSxcbiAgICAgICAgcGFyYW1ldGVyVmFsdWU6IHBhcmFtZXRlckNvbXBvbmVudC5wYXJhbWV0ZXJWYWx1ZSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGF0YWJhc2VQYXJhbWV0ZXJzKG5hbWU6IHN0cmluZywgYXJnczogRGF0YWJhc2VQYXJhbWV0ZXJzQXJncyk6IERhdGFiYXNlUGFyYW1ldGVyc1Jlc3VsdCB7XG4gICAgY29uc3QgZGF0YWJhc2VQYXJhbWV0ZXJzQ29tcG9uZW50ID0gbmV3IERhdGFiYXNlUGFyYW1ldGVyc0NvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBob3N0UGFyYW1ldGVyOiBkYXRhYmFzZVBhcmFtZXRlcnNDb21wb25lbnQuaG9zdFBhcmFtZXRlcixcbiAgICAgICAgcG9ydFBhcmFtZXRlcjogZGF0YWJhc2VQYXJhbWV0ZXJzQ29tcG9uZW50LnBvcnRQYXJhbWV0ZXIsXG4gICAgICAgIG5hbWVQYXJhbWV0ZXI6IGRhdGFiYXNlUGFyYW1ldGVyc0NvbXBvbmVudC5uYW1lUGFyYW1ldGVyLFxuICAgICAgICB1c2VybmFtZVBhcmFtZXRlcjogZGF0YWJhc2VQYXJhbWV0ZXJzQ29tcG9uZW50LnVzZXJuYW1lUGFyYW1ldGVyLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBcHBsaWNhdGlvblBhcmFtZXRlcnMobmFtZTogc3RyaW5nLCBhcmdzOiBBcHBsaWNhdGlvblBhcmFtZXRlcnNBcmdzKTogQXBwbGljYXRpb25QYXJhbWV0ZXJzUmVzdWx0IHtcbiAgICBjb25zdCBhcHBsaWNhdGlvblBhcmFtZXRlcnNDb21wb25lbnQgPSBuZXcgQXBwbGljYXRpb25QYXJhbWV0ZXJzQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHBhcmFtZXRlcnM6IGFwcGxpY2F0aW9uUGFyYW1ldGVyc0NvbXBvbmVudC5wYXJhbWV0ZXJzLFxuICAgIH07XG59Il19