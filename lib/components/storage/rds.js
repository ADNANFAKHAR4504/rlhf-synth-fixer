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
exports.SecureRdsInstanceComponent = exports.RdsInstanceComponent = exports.RdsParameterGroupComponent = exports.RdsSubnetGroupComponent = void 0;
exports.createRdsSubnetGroup = createRdsSubnetGroup;
exports.createRdsParameterGroup = createRdsParameterGroup;
exports.createRdsInstance = createRdsInstance;
exports.createSecureRdsInstance = createSecureRdsInstance;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class RdsSubnetGroupComponent extends pulumi.ComponentResource {
    subnetGroup;
    subnetGroupName;
    constructor(name, args, opts) {
        super("aws:rds:RdsSubnetGroupComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.subnetGroup = new aws.rds.SubnetGroup(`${name}-subnet-group`, {
            name: args.name,
            subnetIds: args.subnetIds,
            description: args.description || `DB subnet group for ${args.name}`,
            tags: defaultTags,
        }, { parent: this });
        this.subnetGroupName = this.subnetGroup.name;
        this.registerOutputs({
            subnetGroup: this.subnetGroup,
            subnetGroupName: this.subnetGroupName,
        });
    }
}
exports.RdsSubnetGroupComponent = RdsSubnetGroupComponent;
class RdsParameterGroupComponent extends pulumi.ComponentResource {
    parameterGroup;
    parameterGroupName;
    constructor(name, args, opts) {
        super("aws:rds:RdsParameterGroupComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.parameterGroup = new aws.rds.ParameterGroup(`${name}-parameter-group`, {
            name: args.name,
            family: args.family,
            description: args.description || `DB parameter group for ${args.name}`,
            parameters: args.parameters,
            tags: defaultTags,
        }, { parent: this });
        this.parameterGroupName = this.parameterGroup.name;
        this.registerOutputs({
            parameterGroup: this.parameterGroup,
            parameterGroupName: this.parameterGroupName,
        });
    }
}
exports.RdsParameterGroupComponent = RdsParameterGroupComponent;
class RdsInstanceComponent extends pulumi.ComponentResource {
    instance;
    instanceId;
    instanceArn;
    endpoint;
    port;
    address;
    subnetGroup;
    parameterGroup;
    constructor(name, args, opts) {
        super("aws:rds:RdsInstanceComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
            ...args.tags,
        };
        this.instance = new aws.rds.Instance(`${name}-instance`, {
            identifier: args.identifier || args.name,
            engine: args.engine,
            engineVersion: args.engineVersion,
            instanceClass: args.instanceClass,
            allocatedStorage: args.allocatedStorage || 20,
            maxAllocatedStorage: args.maxAllocatedStorage || 100,
            storageType: args.storageType || "gp2",
            storageEncrypted: args.storageEncrypted ?? true,
            kmsKeyId: args.kmsKeyId,
            dbName: args.dbName,
            username: args.username,
            password: args.password,
            manageMasterUserPassword: args.passwordSecretArn ? false : true,
            masterUserSecretKmsKeyId: args.passwordSecretArn ? undefined : args.kmsKeyId,
            vpcSecurityGroupIds: args.vpcSecurityGroupIds,
            dbSubnetGroupName: args.dbSubnetGroupName,
            parameterGroupName: args.parameterGroupName,
            multiAz: args.multiAz ?? true,
            publiclyAccessible: args.publiclyAccessible ?? false,
            backupRetentionPeriod: args.backupRetentionPeriod || 7,
            backupWindow: args.backupWindow || "03:00-04:00",
            maintenanceWindow: args.maintenanceWindow || "sun:04:00-sun:05:00",
            autoMinorVersionUpgrade: args.autoMinorVersionUpgrade ?? true,
            deletionProtection: args.deletionProtection ?? true,
            skipFinalSnapshot: args.skipFinalSnapshot ?? false,
            finalSnapshotIdentifier: args.finalSnapshotIdentifier || `${args.name}-final-snapshot-${Date.now()}`,
            performanceInsightsEnabled: args.performanceInsightsEnabled ?? true,
            performanceInsightsKmsKeyId: args.performanceInsightsKmsKeyId || args.kmsKeyId,
            enabledCloudwatchLogsExports: args.enabledCloudwatchLogsExports,
            monitoringInterval: args.monitoringInterval || 60,
            monitoringRoleArn: args.monitoringRoleArn,
            tags: defaultTags,
        }, { parent: this });
        this.instanceId = this.instance.id;
        this.instanceArn = this.instance.arn;
        this.endpoint = this.instance.endpoint;
        this.port = this.instance.port;
        this.address = this.instance.address;
        this.registerOutputs({
            instance: this.instance,
            instanceId: this.instanceId,
            instanceArn: this.instanceArn,
            endpoint: this.endpoint,
            port: this.port,
            address: this.address,
        });
    }
}
exports.RdsInstanceComponent = RdsInstanceComponent;
class SecureRdsInstanceComponent extends pulumi.ComponentResource {
    instance;
    instanceId;
    instanceArn;
    endpoint;
    port;
    address;
    subnetGroup;
    parameterGroup;
    constructor(name, args, opts) {
        super("aws:rds:SecureRdsInstanceComponent", name, {}, opts);
        const engine = args.engine || "mysql";
        const engineVersion = args.engineVersion || (engine === "mysql" ? "8.0" : "13.7");
        // Create subnet group
        const subnetGroupComponent = new RdsSubnetGroupComponent(`${name}-subnet-group`, {
            name: `${args.name}-subnet-group`,
            subnetIds: args.subnetIds,
            description: `Secure DB subnet group for ${args.name}`,
            tags: args.tags,
        }, { parent: this });
        this.subnetGroup = subnetGroupComponent.subnetGroup;
        // Create parameter group with security-focused parameters
        const secureParameters = engine === "mysql" ? [
            { name: "log_bin_trust_function_creators", value: "1" },
            { name: "slow_query_log", value: "1" },
            { name: "long_query_time", value: "2" },
            { name: "general_log", value: "1" },
        ] : [
            { name: "log_statement", value: "all" },
            { name: "log_min_duration_statement", value: "1000" },
            { name: "shared_preload_libraries", value: "pg_stat_statements" },
        ];
        const parameterFamily = engine === "mysql" ? "mysql8.0" : "postgres13";
        const parameterGroupComponent = new RdsParameterGroupComponent(`${name}-parameter-group`, {
            name: `${args.name}-parameter-group`,
            family: parameterFamily,
            description: `Secure DB parameter group for ${args.name}`,
            parameters: secureParameters,
            tags: args.tags,
        }, { parent: this });
        this.parameterGroup = parameterGroupComponent.parameterGroup;
        // Create RDS instance with security best practices
        const rdsComponent = new RdsInstanceComponent(name, {
            name: args.name,
            identifier: args.identifier,
            engine: engine,
            engineVersion: engineVersion,
            instanceClass: args.instanceClass,
            allocatedStorage: args.allocatedStorage || 20,
            maxAllocatedStorage: 100,
            storageType: "gp2",
            storageEncrypted: true,
            kmsKeyId: args.kmsKeyId,
            dbName: args.dbName,
            username: args.username,
            passwordSecretArn: args.passwordSecretArn,
            vpcSecurityGroupIds: args.securityGroupIds,
            dbSubnetGroupName: this.subnetGroup.name,
            parameterGroupName: this.parameterGroup.name,
            multiAz: true,
            publiclyAccessible: false,
            backupRetentionPeriod: args.backupRetentionPeriod || 7,
            backupWindow: "03:00-04:00",
            maintenanceWindow: "sun:04:00-sun:05:00",
            autoMinorVersionUpgrade: true,
            deletionProtection: true,
            skipFinalSnapshot: false,
            performanceInsightsEnabled: true,
            performanceInsightsKmsKeyId: args.kmsKeyId,
            enabledCloudwatchLogsExports: engine === "mysql" ? ["error", "general", "slowquery"] : ["postgresql"],
            monitoringInterval: 60,
            tags: args.tags,
        }, { parent: this });
        this.instance = rdsComponent.instance;
        this.instanceId = rdsComponent.instanceId;
        this.instanceArn = rdsComponent.instanceArn;
        this.endpoint = rdsComponent.endpoint;
        this.port = rdsComponent.port;
        this.address = rdsComponent.address;
        this.registerOutputs({
            instance: this.instance,
            instanceId: this.instanceId,
            instanceArn: this.instanceArn,
            endpoint: this.endpoint,
            port: this.port,
            address: this.address,
            subnetGroup: this.subnetGroup,
            parameterGroup: this.parameterGroup,
        });
    }
}
exports.SecureRdsInstanceComponent = SecureRdsInstanceComponent;
function createRdsSubnetGroup(name, args) {
    const subnetGroupComponent = new RdsSubnetGroupComponent(name, args);
    return {
        subnetGroup: subnetGroupComponent.subnetGroup,
        subnetGroupName: subnetGroupComponent.subnetGroupName,
    };
}
function createRdsParameterGroup(name, args) {
    const parameterGroupComponent = new RdsParameterGroupComponent(name, args);
    return {
        parameterGroup: parameterGroupComponent.parameterGroup,
        parameterGroupName: parameterGroupComponent.parameterGroupName,
    };
}
function createRdsInstance(name, args) {
    const rdsComponent = new RdsInstanceComponent(name, args);
    return {
        instance: rdsComponent.instance,
        instanceId: rdsComponent.instanceId,
        instanceArn: rdsComponent.instanceArn,
        endpoint: rdsComponent.endpoint,
        port: rdsComponent.port,
        address: rdsComponent.address,
        subnetGroup: rdsComponent.subnetGroup,
        parameterGroup: rdsComponent.parameterGroup,
    };
}
function createSecureRdsInstance(name, args) {
    const secureRdsComponent = new SecureRdsInstanceComponent(name, args);
    return {
        instance: secureRdsComponent.instance,
        instanceId: secureRdsComponent.instanceId,
        instanceArn: secureRdsComponent.instanceArn,
        endpoint: secureRdsComponent.endpoint,
        port: secureRdsComponent.port,
        address: secureRdsComponent.address,
        subnetGroup: secureRdsComponent.subnetGroup,
        parameterGroup: secureRdsComponent.parameterGroup,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9VQSxvREFNQztBQUVELDBEQU1DO0FBRUQsOENBWUM7QUFFRCwwREFZQztBQTlXRCx1REFBeUM7QUFDekMsaURBQW1DO0FBb0ZuQyxNQUFhLHVCQUF3QixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDakQsV0FBVyxDQUFzQjtJQUNqQyxlQUFlLENBQXdCO0lBRXZELFlBQVksSUFBWSxFQUFFLElBQXdCLEVBQUUsSUFBc0M7UUFDdEYsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsTUFBTSxXQUFXLEdBQUc7WUFDaEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2YsQ0FBQztRQUVGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLElBQUksZUFBZSxFQUFFO1lBQy9ELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztZQUN6QixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSx1QkFBdUIsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNuRSxJQUFJLEVBQUUsV0FBVztTQUNwQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQztRQUU3QyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ2pCLFdB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RSxZQUFZLENBQUMsUUFBUTtRQUMvQixVQUFVLEVBQUUsWUFBWSxDQUFDLFVBQVU7UUFDbkMsV0FBVyxFQUFFLFlBQVksQ0FBQyxXQUFXO1FBQ3JDLFFBQVEsRUFBRSxZQUFZLENBQUMsUUFBUTtRQUMvQixJQUFJLEVBQUUsWUFBWSxDQUFDLElBQUk7UUFDdkIsT0FBTyxFQUFFLFlBQVksQ0FBQyxPQUFPO1FBQzdCLFdBQVcsRUFBRSxZQUFZLENBQUMsV0FBVztRQUNyQyxjQUFjLEVBQUUsWUFBWSxDQUFDLGNBQWM7S0FDOUMsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQix1QkFBdUIsQ0FBQyxJQUFZLEVBQUUsSUFBMkI7SUFDN0UsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLDBCQUEwQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0RSxPQUFPO1FBQ0gsUUFBUSxFQUFFLGtCQUFrQixDQUFDLFFBQVE7UUFDckMsVUFBVSxFQUFFLGtCQUFrQixDQUFDLFVBQVU7UUFDekMsV0FBVyxFQUFFLGtCQUFrQixDQUFDLFdBQVc7UUFDM0MsUUFBUSxFQUFFLGtCQUFrQixDQUFDLFFBQVE7UUFDckMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLElBQUk7UUFDN0IsT0FBTyxFQUFFLGtCQUFrQixDQUFDLE9BQU87UUFDbkMsV0FBVyxFQUFFLGtCQUFrQixDQUFDLFdBQVc7UUFDM0MsY0FBYyxFQUFFLGtCQUFrQixDQUFDLGNBQWM7S0FDcEQsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSBcIkBwdWx1bWkvcHVsdW1pXCI7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSBcIkBwdWx1bWkvYXdzXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmRzU3VibmV0R3JvdXBBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgc3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJkc1BhcmFtZXRlckdyb3VwQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGZhbWlseTogc3RyaW5nO1xuICAgIHBhcmFtZXRlcnM/OiBBcnJheTx7XG4gICAgICAgIG5hbWU6IHN0cmluZztcbiAgICAgICAgdmFsdWU6IHN0cmluZztcbiAgICAgICAgYXBwbHlNZXRob2Q/OiBcImltbWVkaWF0ZVwiIHwgXCJwZW5kaW5nLXJlYm9vdFwiO1xuICAgIH0+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICAgIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJkc0luc3RhbmNlQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGlkZW50aWZpZXI/OiBzdHJpbmc7XG4gICAgZW5naW5lOiBzdHJpbmc7XG4gICAgZW5naW5lVmVyc2lvbj86IHN0cmluZztcbiAgICBpbnN0YW5jZUNsYXNzOiBzdHJpbmc7XG4gICAgYWxsb2NhdGVkU3RvcmFnZT86IG51bWJlcjtcbiAgICBtYXhBbGxvY2F0ZWRTdG9yYWdlPzogbnVtYmVyO1xuICAgIHN0b3JhZ2VUeXBlPzogc3RyaW5nO1xuICAgIHN0b3JhZ2VFbmNyeXB0ZWQ/OiBib29sZWFuO1xuICAgIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgZGJOYW1lPzogc3RyaW5nO1xuICAgIHVzZXJuYW1lOiBzdHJpbmc7XG4gICAgcGFzc3dvcmQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBwYXNzd29yZFNlY3JldEFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICAgIGRiU3VibmV0R3JvdXBOYW1lPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgcGFyYW1ldGVyR3JvdXBOYW1lPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgbXVsdGlBej86IGJvb2xlYW47XG4gICAgcHVibGljbHlBY2Nlc3NpYmxlPzogYm9vbGVhbjtcbiAgICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q/OiBudW1iZXI7XG4gICAgYmFja3VwV2luZG93Pzogc3RyaW5nO1xuICAgIG1haW50ZW5hbmNlV2luZG93Pzogc3RyaW5nO1xuICAgIGF1dG9NaW5vclZlcnNpb25VcGdyYWRlPzogYm9vbGVhbjtcbiAgICBkZWxldGlvblByb3RlY3Rpb24/OiBib29sZWFuO1xuICAgIHNraXBGaW5hbFNuYXBzaG90PzogYm9vbGVhbjtcbiAgICBmaW5hbFNuYXBzaG90SWRlbnRpZmllcj86IHN0cmluZztcbiAgICBwZXJmb3JtYW5jZUluc2lnaHRzRW5hYmxlZD86IGJvb2xlYW47XG4gICAgcGVyZm9ybWFuY2VJbnNpZ2h0c0ttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgZW5hYmxlZENsb3Vkd2F0Y2hMb2dzRXhwb3J0cz86IHN0cmluZ1tdO1xuICAgIG1vbml0b3JpbmdJbnRlcnZhbD86IG51bWJlcjtcbiAgICBtb25pdG9yaW5nUm9sZUFybj86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJkc0luc3RhbmNlUmVzdWx0IHtcbiAgICBpbnN0YW5jZTogYXdzLnJkcy5JbnN0YW5jZTtcbiAgICBpbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgaW5zdGFuY2VBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBlbmRwb2ludDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHBvcnQ6IHB1bHVtaS5PdXRwdXQ8bnVtYmVyPjtcbiAgICBhZGRyZXNzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgc3VibmV0R3JvdXA/OiBhd3MucmRzLlN1Ym5ldEdyb3VwO1xuICAgIHBhcmFtZXRlckdyb3VwPzogYXdzLnJkcy5QYXJhbWV0ZXJHcm91cDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cmVSZHNJbnN0YW5jZUFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBpZGVudGlmaWVyPzogc3RyaW5nO1xuICAgIGVuZ2luZT86IHN0cmluZztcbiAgICBlbmdpbmVWZXJzaW9uPzogc3RyaW5nO1xuICAgIGluc3RhbmNlQ2xhc3M6IHN0cmluZztcbiAgICBhbGxvY2F0ZWRTdG9yYWdlPzogbnVtYmVyO1xuICAgIGRiTmFtZT86IHN0cmluZztcbiAgICB1c2VybmFtZTogc3RyaW5nO1xuICAgIHBhc3N3b3JkU2VjcmV0QXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgc3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICAgIHNlY3VyaXR5R3JvdXBJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gICAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q/OiBudW1iZXI7XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBSZHNTdWJuZXRHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHN1Ym5ldEdyb3VwOiBhd3MucmRzLlN1Ym5ldEdyb3VwO1xuICAgIHB1YmxpYyByZWFkb25seSBzdWJuZXRHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogUmRzU3VibmV0R3JvdXBBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpyZHM6UmRzU3VibmV0R3JvdXBDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTm92YS1Nb2RlbC1CcmVha2luZ1wiLFxuICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc3VibmV0R3JvdXAgPSBuZXcgYXdzLnJkcy5TdWJuZXRHcm91cChgJHtuYW1lfS1zdWJuZXQtZ3JvdXBgLCB7XG4gICAgICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBzdWJuZXRJZHM6IGFyZ3Muc3VibmV0SWRzLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGFyZ3MuZGVzY3JpcHRpb24gfHwgYERCIHN1Ym5ldCBncm91cCBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnN1Ym5ldEdyb3VwTmFtZSA9IHRoaXMuc3VibmV0R3JvdXAubmFtZTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBzdWJuZXRHcm91cDogdGhpcy5zdWJuZXRHcm91cCxcbiAgICAgICAgICAgIHN1Ym5ldEdyb3VwTmFtZTogdGhpcy5zdWJuZXRHcm91cE5hbWUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJkc1BhcmFtZXRlckdyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcGFyYW1ldGVyR3JvdXA6IGF3cy5yZHMuUGFyYW1ldGVyR3JvdXA7XG4gICAgcHVibGljIHJlYWRvbmx5IHBhcmFtZXRlckdyb3VwTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBSZHNQYXJhbWV0ZXJHcm91cEFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnJkczpSZHNQYXJhbWV0ZXJHcm91cENvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICAgICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICAgICAgICBNYW5hZ2VkQnk6IFwiUHVsdW1pXCIsXG4gICAgICAgICAgICBQcm9qZWN0OiBcIkFXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nXCIsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJHcm91cCA9IG5ldyBhd3MucmRzLlBhcmFtZXRlckdyb3VwKGAke25hbWV9LXBhcmFtZXRlci1ncm91cGAsIHtcbiAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIGZhbWlseTogYXJncy5mYW1pbHksXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYXJncy5kZXNjcmlwdGlvbiB8fCBgREIgcGFyYW1ldGVyIGdyb3VwIGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICAgICAgcGFyYW1ldGVyczogYXJncy5wYXJhbWV0ZXJzLFxuICAgICAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucGFyYW1ldGVyR3JvdXBOYW1lID0gdGhpcy5wYXJhbWV0ZXJHcm91cC5uYW1lO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHBhcmFtZXRlckdyb3VwOiB0aGlzLnBhcmFtZXRlckdyb3VwLFxuICAgICAgICAgICAgcGFyYW1ldGVyR3JvdXBOYW1lOiB0aGlzLnBhcmFtZXRlckdyb3VwTmFtZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmRzSW5zdGFuY2VDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZTogYXdzLnJkcy5JbnN0YW5jZTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBlbmRwb2ludDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBwb3J0OiBwdWx1bWkuT3V0cHV0PG51bWJlcj47XG4gICAgcHVibGljIHJlYWRvbmx5IGFkZHJlc3M6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc3VibmV0R3JvdXA/OiBhd3MucmRzLlN1Ym5ldEdyb3VwO1xuICAgIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJHcm91cD86IGF3cy5yZHMuUGFyYW1ldGVyR3JvdXA7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFJkc0luc3RhbmNlQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6cmRzOlJkc0luc3RhbmNlQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmluc3RhbmNlID0gbmV3IGF3cy5yZHMuSW5zdGFuY2UoYCR7bmFtZX0taW5zdGFuY2VgLCB7XG4gICAgICAgICAgICBpZGVudGlmaWVyOiBhcmdzLmlkZW50aWZpZXIgfHwgYXJncy5uYW1lLFxuICAgICAgICAgICAgZW5naW5lOiBhcmdzLmVuZ2luZSxcbiAgICAgICAgICAgIGVuZ2luZVZlcnNpb246IGFyZ3MuZW5naW5lVmVyc2lvbixcbiAgICAgICAgICAgIGluc3RhbmNlQ2xhc3M6IGFyZ3MuaW5zdGFuY2VDbGFzcyxcbiAgICAgICAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IGFyZ3MuYWxsb2NhdGVkU3RvcmFnZSB8fCAyMCxcbiAgICAgICAgICAgIG1heEFsbG9jYXRlZFN0b3JhZ2U6IGFyZ3MubWF4QWxsb2NhdGVkU3RvcmFnZSB8fCAxMDAsXG4gICAgICAgICAgICBzdG9yYWdlVHlwZTogYXJncy5zdG9yYWdlVHlwZSB8fCBcImdwMlwiLFxuICAgICAgICAgICAgc3RvcmFnZUVuY3J5cHRlZDogYXJncy5zdG9yYWdlRW5jcnlwdGVkID8/IHRydWUsXG4gICAgICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIGRiTmFtZTogYXJncy5kYk5hbWUsXG4gICAgICAgICAgICB1c2VybmFtZTogYXJncy51c2VybmFtZSxcbiAgICAgICAgICAgIHBhc3N3b3JkOiBhcmdzLnBhc3N3b3JkLFxuICAgICAgICAgICAgbWFuYWdlTWFzdGVyVXNlclBhc3N3b3JkOiBhcmdzLnBhc3N3b3JkU2VjcmV0QXJuID8gZmFsc2UgOiB0cnVlLFxuICAgICAgICAgICAgbWFzdGVyVXNlclNlY3JldEttc0tleUlkOiBhcmdzLnBhc3N3b3JkU2VjcmV0QXJuID8gdW5kZWZpbmVkIDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IGFyZ3MudnBjU2VjdXJpdHlHcm91cElkcyxcbiAgICAgICAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiBhcmdzLmRiU3VibmV0R3JvdXBOYW1lLFxuICAgICAgICAgICAgcGFyYW1ldGVyR3JvdXBOYW1lOiBhcmdzLnBhcmFtZXRlckdyb3VwTmFtZSxcbiAgICAgICAgICAgIG11bHRpQXo6IGFyZ3MubXVsdGlBeiA/PyB0cnVlLFxuICAgICAgICAgICAgcHVibGljbHlBY2Nlc3NpYmxlOiBhcmdzLnB1YmxpY2x5QWNjZXNzaWJsZSA/PyBmYWxzZSxcbiAgICAgICAgICAgIGJhY2t1cFJldGVudGlvblBlcmlvZDogYXJncy5iYWNrdXBSZXRlbnRpb25QZXJpb2QgfHwgNyxcbiAgICAgICAgICAgIGJhY2t1cFdpbmRvdzogYXJncy5iYWNrdXBXaW5kb3cgfHwgXCIwMzowMC0wNDowMFwiLFxuICAgICAgICAgICAgbWFpbnRlbmFuY2VXaW5kb3c6IGFyZ3MubWFpbnRlbmFuY2VXaW5kb3cgfHwgXCJzdW46MDQ6MDAtc3VuOjA1OjAwXCIsXG4gICAgICAgICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogYXJncy5hdXRvTWlub3JWZXJzaW9uVXBncmFkZSA/PyB0cnVlLFxuICAgICAgICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBhcmdzLmRlbGV0aW9uUHJvdGVjdGlvbiA/PyB0cnVlLFxuICAgICAgICAgICAgc2tpcEZpbmFsU25hcHNob3Q6IGFyZ3Muc2tpcEZpbmFsU25hcHNob3QgPz8gZmFsc2UsXG4gICAgICAgICAgICBmaW5hbFNuYXBzaG90SWRlbnRpZmllcjogYXJncy5maW5hbFNuYXBzaG90SWRlbnRpZmllciB8fCBgJHthcmdzLm5hbWV9LWZpbmFsLXNuYXBzaG90LSR7RGF0ZS5ub3coKX1gLFxuICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c0VuYWJsZWQ6IGFyZ3MucGVyZm9ybWFuY2VJbnNpZ2h0c0VuYWJsZWQgPz8gdHJ1ZSxcbiAgICAgICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNLbXNLZXlJZDogYXJncy5wZXJmb3JtYW5jZUluc2lnaHRzS21zS2V5SWQgfHwgYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIGVuYWJsZWRDbG91ZHdhdGNoTG9nc0V4cG9ydHM6IGFyZ3MuZW5hYmxlZENsb3Vkd2F0Y2hMb2dzRXhwb3J0cyxcbiAgICAgICAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogYXJncy5tb25pdG9yaW5nSW50ZXJ2YWwgfHwgNjAsXG4gICAgICAgICAgICBtb25pdG9yaW5nUm9sZUFybjogYXJncy5tb25pdG9yaW5nUm9sZUFybixcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmluc3RhbmNlSWQgPSB0aGlzLmluc3RhbmNlLmlkO1xuICAgICAgICB0aGlzLmluc3RhbmNlQXJuID0gdGhpcy5pbnN0YW5jZS5hcm47XG4gICAgICAgIHRoaXMuZW5kcG9pbnQgPSB0aGlzLmluc3RhbmNlLmVuZHBvaW50O1xuICAgICAgICB0aGlzLnBvcnQgPSB0aGlzLmluc3RhbmNlLnBvcnQ7XG4gICAgICAgIHRoaXMuYWRkcmVzcyA9IHRoaXMuaW5zdGFuY2UuYWRkcmVzcztcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBpbnN0YW5jZTogdGhpcy5pbnN0YW5jZSxcbiAgICAgICAgICAgIGluc3RhbmNlSWQ6IHRoaXMuaW5zdGFuY2VJZCxcbiAgICAgICAgICAgIGluc3RhbmNlQXJuOiB0aGlzLmluc3RhbmNlQXJuLFxuICAgICAgICAgICAgZW5kcG9pbnQ6IHRoaXMuZW5kcG9pbnQsXG4gICAgICAgICAgICBwb3J0OiB0aGlzLnBvcnQsXG4gICAgICAgICAgICBhZGRyZXNzOiB0aGlzLmFkZHJlc3MsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyZVJkc0luc3RhbmNlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2U6IGF3cy5yZHMuSW5zdGFuY2U7XG4gICAgcHVibGljIHJlYWRvbmx5IGluc3RhbmNlSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgZW5kcG9pbnQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgcG9ydDogcHVsdW1pLk91dHB1dDxudW1iZXI+O1xuICAgIHB1YmxpYyByZWFkb25seSBhZGRyZXNzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IHN1Ym5ldEdyb3VwOiBhd3MucmRzLlN1Ym5ldEdyb3VwO1xuICAgIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJHcm91cDogYXdzLnJkcy5QYXJhbWV0ZXJHcm91cDtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogU2VjdXJlUmRzSW5zdGFuY2VBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpyZHM6U2VjdXJlUmRzSW5zdGFuY2VDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGVuZ2luZSA9IGFyZ3MuZW5naW5lIHx8IFwibXlzcWxcIjtcbiAgICAgICAgY29uc3QgZW5naW5lVmVyc2lvbiA9IGFyZ3MuZW5naW5lVmVyc2lvbiB8fCAoZW5naW5lID09PSBcIm15c3FsXCIgPyBcIjguMFwiIDogXCIxMy43XCIpO1xuXG4gICAgICAgIC8vIENyZWF0ZSBzdWJuZXQgZ3JvdXBcbiAgICAgICAgY29uc3Qgc3VibmV0R3JvdXBDb21wb25lbnQgPSBuZXcgUmRzU3VibmV0R3JvdXBDb21wb25lbnQoYCR7bmFtZX0tc3VibmV0LWdyb3VwYCwge1xuICAgICAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1zdWJuZXQtZ3JvdXBgLFxuICAgICAgICAgICAgc3VibmV0SWRzOiBhcmdzLnN1Ym5ldElkcyxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgU2VjdXJlIERCIHN1Ym5ldCBncm91cCBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5zdWJuZXRHcm91cCA9IHN1Ym5ldEdyb3VwQ29tcG9uZW50LnN1Ym5ldEdyb3VwO1xuXG4gICAgICAgIC8vIENyZWF0ZSBwYXJhbWV0ZXIgZ3JvdXAgd2l0aCBzZWN1cml0eS1mb2N1c2VkIHBhcmFtZXRlcnNcbiAgICAgICAgY29uc3Qgc2VjdXJlUGFyYW1ldGVycyA9IGVuZ2luZSA9PT0gXCJteXNxbFwiID8gW1xuICAgICAgICAgICAgeyBuYW1lOiBcImxvZ19iaW5fdHJ1c3RfZnVuY3Rpb25fY3JlYXRvcnNcIiwgdmFsdWU6IFwiMVwiIH0sXG4gICAgICAgICAgICB7IG5hbWU6IFwic2xvd19xdWVyeV9sb2dcIiwgdmFsdWU6IFwiMVwiIH0sXG4gICAgICAgICAgICB7IG5hbWU6IFwibG9uZ19xdWVyeV90aW1lXCIsIHZhbHVlOiBcIjJcIiB9LFxuICAgICAgICAgICAgeyBuYW1lOiBcImdlbmVyYWxfbG9nXCIsIHZhbHVlOiBcIjFcIiB9LFxuICAgICAgICBdIDogW1xuICAgICAgICAgICAgeyBuYW1lOiBcImxvZ19zdGF0ZW1lbnRcIiwgdmFsdWU6IFwiYWxsXCIgfSxcbiAgICAgICAgICAgIHsgbmFtZTogXCJsb2dfbWluX2R1cmF0aW9uX3N0YXRlbWVudFwiLCB2YWx1ZTogXCIxMDAwXCIgfSxcbiAgICAgICAgICAgIHsgbmFtZTogXCJzaGFyZWRfcHJlbG9hZF9saWJyYXJpZXNcIiwgdmFsdWU6IFwicGdfc3RhdF9zdGF0ZW1lbnRzXCIgfSxcbiAgICAgICAgXTtcblxuICAgICAgICBjb25zdCBwYXJhbWV0ZXJGYW1pbHkgPSBlbmdpbmUgPT09IFwibXlzcWxcIiA/IFwibXlzcWw4LjBcIiA6IFwicG9zdGdyZXMxM1wiO1xuXG4gICAgICAgIGNvbnN0IHBhcmFtZXRlckdyb3VwQ29tcG9uZW50ID0gbmV3IFJkc1BhcmFtZXRlckdyb3VwQ29tcG9uZW50KGAke25hbWV9LXBhcmFtZXRlci1ncm91cGAsIHtcbiAgICAgICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tcGFyYW1ldGVyLWdyb3VwYCxcbiAgICAgICAgICAgIGZhbWlseTogcGFyYW1ldGVyRmFtaWx5LFxuICAgICAgICAgICAgZGVzY3JpcHRpb246IGBTZWN1cmUgREIgcGFyYW1ldGVyIGdyb3VwIGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICAgICAgcGFyYW1ldGVyczogc2VjdXJlUGFyYW1ldGVycyxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJHcm91cCA9IHBhcmFtZXRlckdyb3VwQ29tcG9uZW50LnBhcmFtZXRlckdyb3VwO1xuXG4gICAgICAgIC8vIENyZWF0ZSBSRFMgaW5zdGFuY2Ugd2l0aCBzZWN1cml0eSBiZXN0IHByYWN0aWNlc1xuICAgICAgICBjb25zdCByZHNDb21wb25lbnQgPSBuZXcgUmRzSW5zdGFuY2VDb21wb25lbnQobmFtZSwge1xuICAgICAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgaWRlbnRpZmllcjogYXJncy5pZGVudGlmaWVyLFxuICAgICAgICAgICAgZW5naW5lOiBlbmdpbmUsXG4gICAgICAgICAgICBlbmdpbmVWZXJzaW9uOiBlbmdpbmVWZXJzaW9uLFxuICAgICAgICAgICAgaW5zdGFuY2VDbGFzczogYXJncy5pbnN0YW5jZUNsYXNzLFxuICAgICAgICAgICAgYWxsb2NhdGVkU3RvcmFnZTogYXJncy5hbGxvY2F0ZWRTdG9yYWdlIHx8IDIwLFxuICAgICAgICAgICAgbWF4QWxsb2NhdGVkU3RvcmFnZTogMTAwLFxuICAgICAgICAgICAgc3RvcmFnZVR5cGU6IFwiZ3AyXCIsXG4gICAgICAgICAgICBzdG9yYWdlRW5jcnlwdGVkOiB0cnVlLFxuICAgICAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgICAgICBkYk5hbWU6IGFyZ3MuZGJOYW1lLFxuICAgICAgICAgICAgdXNlcm5hbWU6IGFyZ3MudXNlcm5hbWUsXG4gICAgICAgICAgICBwYXNzd29yZFNlY3JldEFybjogYXJncy5wYXNzd29yZFNlY3JldEFybixcbiAgICAgICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IGFyZ3Muc2VjdXJpdHlHcm91cElkcyxcbiAgICAgICAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiB0aGlzLnN1Ym5ldEdyb3VwLm5hbWUsXG4gICAgICAgICAgICBwYXJhbWV0ZXJHcm91cE5hbWU6IHRoaXMucGFyYW1ldGVyR3JvdXAubmFtZSxcbiAgICAgICAgICAgIG11bHRpQXo6IHRydWUsXG4gICAgICAgICAgICBwdWJsaWNseUFjY2Vzc2libGU6IGZhbHNlLFxuICAgICAgICAgICAgYmFja3VwUmV0ZW50aW9uUGVyaW9kOiBhcmdzLmJhY2t1cFJldGVudGlvblBlcmlvZCB8fCA3LFxuICAgICAgICAgICAgYmFja3VwV2luZG93OiBcIjAzOjAwLTA0OjAwXCIsXG4gICAgICAgICAgICBtYWludGVuYW5jZVdpbmRvdzogXCJzdW46MDQ6MDAtc3VuOjA1OjAwXCIsXG4gICAgICAgICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogdHJ1ZSxcbiAgICAgICAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIHNraXBGaW5hbFNuYXBzaG90OiBmYWxzZSxcbiAgICAgICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNFbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c0ttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgZW5hYmxlZENsb3Vkd2F0Y2hMb2dzRXhwb3J0czogZW5naW5lID09PSBcIm15c3FsXCIgPyBbXCJlcnJvclwiLCBcImdlbmVyYWxcIiwgXCJzbG93cXVlcnlcIl0gOiBbXCJwb3N0Z3Jlc3FsXCJdLFxuICAgICAgICAgICAgbW9uaXRvcmluZ0ludGVydmFsOiA2MCxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5pbnN0YW5jZSA9IHJkc0NvbXBvbmVudC5pbnN0YW5jZTtcbiAgICAgICAgdGhpcy5pbnN0YW5jZUlkID0gcmRzQ29tcG9uZW50Lmluc3RhbmNlSWQ7XG4gICAgICAgIHRoaXMuaW5zdGFuY2VBcm4gPSByZHNDb21wb25lbnQuaW5zdGFuY2VBcm47XG4gICAgICAgIHRoaXMuZW5kcG9pbnQgPSByZHNDb21wb25lbnQuZW5kcG9pbnQ7XG4gICAgICAgIHRoaXMucG9ydCA9IHJkc0NvbXBvbmVudC5wb3J0O1xuICAgICAgICB0aGlzLmFkZHJlc3MgPSByZHNDb21wb25lbnQuYWRkcmVzcztcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBpbnN0YW5jZTogdGhpcy5pbnN0YW5jZSxcbiAgICAgICAgICAgIGluc3RhbmNlSWQ6IHRoaXMuaW5zdGFuY2VJZCxcbiAgICAgICAgICAgIGluc3RhbmNlQXJuOiB0aGlzLmluc3RhbmNlQXJuLFxuICAgICAgICAgICAgZW5kcG9pbnQ6IHRoaXMuZW5kcG9pbnQsXG4gICAgICAgICAgICBwb3J0OiB0aGlzLnBvcnQsXG4gICAgICAgICAgICBhZGRyZXNzOiB0aGlzLmFkZHJlc3MsXG4gICAgICAgICAgICBzdWJuZXRHcm91cDogdGhpcy5zdWJuZXRHcm91cCxcbiAgICAgICAgICAgIHBhcmFtZXRlckdyb3VwOiB0aGlzLnBhcmFtZXRlckdyb3VwLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZHNTdWJuZXRHcm91cChuYW1lOiBzdHJpbmcsIGFyZ3M6IFJkc1N1Ym5ldEdyb3VwQXJncykge1xuICAgIGNvbnN0IHN1Ym5ldEdyb3VwQ29tcG9uZW50ID0gbmV3IFJkc1N1Ym5ldEdyb3VwQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHN1Ym5ldEdyb3VwOiBzdWJuZXRHcm91cENvbXBvbmVudC5zdWJuZXRHcm91cCxcbiAgICAgICAgc3VibmV0R3JvdXBOYW1lOiBzdWJuZXRHcm91cENvbXBvbmVudC5zdWJuZXRHcm91cE5hbWUsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVJkc1BhcmFtZXRlckdyb3VwKG5hbWU6IHN0cmluZywgYXJnczogUmRzUGFyYW1ldGVyR3JvdXBBcmdzKSB7XG4gICAgY29uc3QgcGFyYW1ldGVyR3JvdXBDb21wb25lbnQgPSBuZXcgUmRzUGFyYW1ldGVyR3JvdXBDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcGFyYW1ldGVyR3JvdXA6IHBhcmFtZXRlckdyb3VwQ29tcG9uZW50LnBhcmFtZXRlckdyb3VwLFxuICAgICAgICBwYXJhbWV0ZXJHcm91cE5hbWU6IHBhcmFtZXRlckdyb3VwQ29tcG9uZW50LnBhcmFtZXRlckdyb3VwTmFtZSxcbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmRzSW5zdGFuY2UobmFtZTogc3RyaW5nLCBhcmdzOiBSZHNJbnN0YW5jZUFyZ3MpOiBSZHNJbnN0YW5jZVJlc3VsdCB7XG4gICAgY29uc3QgcmRzQ29tcG9uZW50ID0gbmV3IFJkc0luc3RhbmNlQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGluc3RhbmNlOiByZHNDb21wb25lbnQuaW5zdGFuY2UsXG4gICAgICAgIGluc3RhbmNlSWQ6IHJkc0NvbXBvbmVudC5pbnN0YW5jZUlkLFxuICAgICAgICBpbnN0YW5jZUFybjogcmRzQ29tcG9uZW50Lmluc3RhbmNlQXJuLFxuICAgICAgICBlbmRwb2ludDogcmRzQ29tcG9uZW50LmVuZHBvaW50LFxuICAgICAgICBwb3J0OiByZHNDb21wb25lbnQucG9ydCxcbiAgICAgICAgYWRkcmVzczogcmRzQ29tcG9uZW50LmFkZHJlc3MsXG4gICAgICAgIHN1Ym5ldEdyb3VwOiByZHNDb21wb25lbnQuc3VibmV0R3JvdXAsXG4gICAgICAgIHBhcmFtZXRlckdyb3VwOiByZHNDb21wb25lbnQucGFyYW1ldGVyR3JvdXAsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlY3VyZVJkc0luc3RhbmNlKG5hbWU6IHN0cmluZywgYXJnczogU2VjdXJlUmRzSW5zdGFuY2VBcmdzKTogUmRzSW5zdGFuY2VSZXN1bHQge1xuICAgIGNvbnN0IHNlY3VyZVJkc0NvbXBvbmVudCA9IG5ldyBTZWN1cmVSZHNJbnN0YW5jZUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBpbnN0YW5jZTogc2VjdXJlUmRzQ29tcG9uZW50Lmluc3RhbmNlLFxuICAgICAgICBpbnN0YW5jZUlkOiBzZWN1cmVSZHNDb21wb25lbnQuaW5zdGFuY2VJZCxcbiAgICAgICAgaW5zdGFuY2VBcm46IHNlY3VyZVJkc0NvbXBvbmVudC5pbnN0YW5jZUFybixcbiAgICAgICAgZW5kcG9pbnQ6IHNlY3VyZVJkc0NvbXBvbmVudC5lbmRwb2ludCxcbiAgICAgICAgcG9ydDogc2VjdXJlUmRzQ29tcG9uZW50LnBvcnQsXG4gICAgICAgIGFkZHJlc3M6IHNlY3VyZVJkc0NvbXBvbmVudC5hZGRyZXNzLFxuICAgICAgICBzdWJuZXRHcm91cDogc2VjdXJlUmRzQ29tcG9uZW50LnN1Ym5ldEdyb3VwLFxuICAgICAgICBwYXJhbWV0ZXJHcm91cDogc2VjdXJlUmRzQ29tcG9uZW50LnBhcmFtZXRlckdyb3VwLFxuICAgIH07XG59Il19