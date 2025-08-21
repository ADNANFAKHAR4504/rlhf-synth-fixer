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
        super('aws:rds:RdsSubnetGroupComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        // FIXED: Remove the problematic validation that was causing the error
        // Let Pulumi and AWS handle the validation of subnet IDs
        this.subnetGroup = new aws.rds.SubnetGroup(`${name}-subnet-group`, {
            name: args.name,
            subnetIds: args.subnetIds, // Direct assignment without validation
            description: args.description || `DB subnet group for ${args.name}`,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
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
        super('aws:rds:RdsParameterGroupComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.parameterGroup = new aws.rds.ParameterGroup(`${name}-parameter-group`, {
            name: args.name,
            family: args.family,
            description: args.description || `DB parameter group for ${args.name}`,
            parameters: args.parameters,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
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
    masterUserSecrets;
    subnetGroup;
    parameterGroup;
    constructor(name, args, opts) {
        super('aws:rds:RdsInstanceComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.instance = new aws.rds.Instance(`${name}-instance`, {
            identifier: args.identifier || args.name,
            engine: args.engine,
            engineVersion: args.engineVersion,
            instanceClass: args.instanceClass,
            allocatedStorage: args.allocatedStorage || 20,
            maxAllocatedStorage: args.maxAllocatedStorage || 100,
            storageType: args.storageType || 'gp2',
            storageEncrypted: args.storageEncrypted ?? true,
            kmsKeyId: args.kmsKeyId,
            dbName: args.dbName,
            username: args.username,
            manageMasterUserPassword: true,
            masterUserSecretKmsKeyId: args.kmsKeyId,
            vpcSecurityGroupIds: args.vpcSecurityGroupIds,
            dbSubnetGroupName: args.dbSubnetGroupName,
            parameterGroupName: args.parameterGroupName,
            multiAz: args.multiAz ?? true,
            publiclyAccessible: args.publiclyAccessible ?? false,
            backupRetentionPeriod: args.backupRetentionPeriod || 7,
            backupWindow: args.backupWindow || '03:00-04:00',
            maintenanceWindow: args.maintenanceWindow || 'sun:04:00-sun:05:00',
            autoMinorVersionUpgrade: args.autoMinorVersionUpgrade ?? true,
            deletionProtection: args.deletionProtection ?? true,
            skipFinalSnapshot: args.skipFinalSnapshot ?? false,
            finalSnapshotIdentifier: args.finalSnapshotIdentifier ||
                `${args.name}-final-snapshot-${Date.now()}`,
            performanceInsightsEnabled: args.performanceInsightsEnabled ?? true,
            performanceInsightsKmsKeyId: args.performanceInsightsKmsKeyId || args.kmsKeyId,
            enabledCloudwatchLogsExports: args.enabledCloudwatchLogsExports,
            monitoringInterval: args.monitoringInterval || 0, // Changed from 60 to 0
            monitoringRoleArn: args.monitoringRoleArn,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider });
        this.instanceId = this.instance.id;
        this.instanceArn = this.instance.arn;
        this.endpoint = this.instance.endpoint;
        this.port = this.instance.port;
        this.address = this.instance.address;
        this.masterUserSecrets = this.instance.masterUserSecrets;
        this.registerOutputs({
            instance: this.instance,
            instanceId: this.instanceId,
            instanceArn: this.instanceArn,
            endpoint: this.endpoint,
            port: this.port,
            address: this.address,
            masterUserSecrets: this.masterUserSecrets,
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
    masterUserSecrets;
    subnetGroup;
    parameterGroup;
    constructor(name, args, opts) {
        super('aws:rds:SecureRdsInstanceComponent', name, {}, opts);
        const engine = args.engine || 'mysql';
        const engineVersion = args.engineVersion || (engine === 'mysql' ? '8.0' : '13.7');
        // Create subnet group
        const subnetGroupComponent = new RdsSubnetGroupComponent(`${name}-subnet-group`, {
            name: `${args.name}-subnet-group`,
            subnetIds: args.subnetIds,
            description: `Secure DB subnet group for ${args.name}`,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.subnetGroup = subnetGroupComponent.subnetGroup;
        // Create parameter group with security-focused parameters
        const secureParameters = engine === 'mysql'
            ? [
                { name: 'log_bin_trust_function_creators', value: '1' },
                { name: 'slow_query_log', value: '1' },
                { name: 'long_query_time', value: '2' },
                { name: 'general_log', value: '1' },
            ]
            : [
                { name: 'log_statement', value: 'all' },
                { name: 'log_min_duration_statement', value: '1000' },
                { name: 'shared_preload_libraries', value: 'pg_stat_statements' },
            ];
        const parameterFamily = engine === 'mysql' ? 'mysql8.0' : 'postgres13';
        const parameterGroupComponent = new RdsParameterGroupComponent(`${name}-parameter-group`, {
            name: `${args.name}-parameter-group`,
            family: parameterFamily,
            description: `Secure DB parameter group for ${args.name}`,
            parameters: secureParameters,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
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
            storageType: 'gp2',
            storageEncrypted: true,
            kmsKeyId: args.kmsKeyId,
            dbName: args.dbName,
            username: args.username,
            vpcSecurityGroupIds: args.securityGroupIds,
            dbSubnetGroupName: this.subnetGroup.name,
            parameterGroupName: this.parameterGroup.name,
            multiAz: true,
            publiclyAccessible: false,
            backupRetentionPeriod: args.backupRetentionPeriod || 7,
            backupWindow: '03:00-04:00',
            maintenanceWindow: 'sun:04:00-sun:05:00',
            autoMinorVersionUpgrade: true,
            deletionProtection: true,
            skipFinalSnapshot: false,
            performanceInsightsEnabled: true,
            performanceInsightsKmsKeyId: args.kmsKeyId,
            enabledCloudwatchLogsExports: engine === 'mysql'
                ? ['error', 'general', 'slowquery']
                : ['postgresql'],
            monitoringInterval: 0, // Changed from 60 to 0
            tags: args.tags,
        }, { parent: this, provider: opts?.provider });
        this.instance = rdsComponent.instance;
        this.instanceId = rdsComponent.instanceId;
        this.instanceArn = rdsComponent.instanceArn;
        this.endpoint = rdsComponent.endpoint;
        this.port = rdsComponent.port;
        this.address = rdsComponent.address;
        this.masterUserSecrets = rdsComponent.masterUserSecrets;
        this.registerOutputs({
            instance: this.instance,
            instanceId: this.instanceId,
            instanceArn: this.instanceArn,
            endpoint: this.endpoint,
            port: this.port,
            address: this.address,
            masterUserSecrets: this.masterUserSecrets,
            subnetGroup: this.subnetGroup,
            parameterGroup: this.parameterGroup,
        });
    }
}
exports.SecureRdsInstanceComponent = SecureRdsInstanceComponent;
function createRdsSubnetGroup(name, args, opts) {
    const subnetGroupComponent = new RdsSubnetGroupComponent(name, args, opts);
    return {
        subnetGroup: subnetGroupComponent.subnetGroup,
        subnetGroupName: subnetGroupComponent.subnetGroupName,
    };
}
function createRdsParameterGroup(name, args, opts) {
    const parameterGroupComponent = new RdsParameterGroupComponent(name, args, opts);
    return {
        parameterGroup: parameterGroupComponent.parameterGroup,
        parameterGroupName: parameterGroupComponent.parameterGroupName,
    };
}
function createRdsInstance(name, args, opts) {
    const rdsComponent = new RdsInstanceComponent(name, args, opts);
    return {
        instance: rdsComponent.instance,
        instanceId: rdsComponent.instanceId,
        instanceArn: rdsComponent.instanceArn,
        endpoint: rdsComponent.endpoint,
        port: rdsComponent.port,
        address: rdsComponent.address,
        masterUserSecrets: rdsComponent.masterUserSecrets,
        subnetGroup: rdsComponent.subnetGroup,
        parameterGroup: rdsComponent.parameterGroup,
    };
}
function createSecureRdsInstance(name, args, opts) {
    const secureRdsComponent = new SecureRdsInstanceComponent(name, args, opts);
    return {
        instance: secureRdsComponent.instance,
        instanceId: secureRdsComponent.instanceId,
        instanceArn: secureRdsComponent.instanceArn,
        endpoint: secureRdsComponent.endpoint,
        port: secureRdsComponent.port,
        address: secureRdsComponent.address,
        masterUserSecrets: secureRdsComponent.masterUserSecrets,
        subnetGroup: secureRdsComponent.subnetGroup,
        parameterGroup: secureRdsComponent.parameterGroup,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdZQSxvREFVQztBQUVELDBEQWNDO0FBRUQsOENBaUJDO0FBRUQsMERBaUJDO0FBaGNELHVEQUF5QztBQUN6QyxpREFBbUM7QUFvRm5DLE1BQWEsdUJBQXdCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNuRCxXQUFXLENBQXNCO0lBQ2pDLGVBQWUsQ0FBd0I7SUFFdkQsWUFDRSxJQUFZLEVBQ1osSUFBd0IsRUFDeEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLHNFQUFzRTtRQUN0RSx5REFBeUQ7UUFDekQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUN4QyxHQUFHLElBQUksZUFBZSxFQUN0QjtZQUNFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLHVDQUF1QztZQUNsRSxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsSUFBSSx1QkFBdUIsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNuRSxJQUFJLEVBQUUsV0FBVztTQUNsQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxDQUMzQyxDQUFDO1FBRUYsSUFBSSxDQUFDLGVB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QixDQUFDLFdBQVc7UUFDM0MsUUFBUSxFQUFFLGtCQUFrQixDQUFDLFFBQVE7UUFDckMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLElBQUk7UUFDN0IsT0FBTyxFQUFFLGtCQUFrQixDQUFDLE9BQU87UUFDbkMsaUJBQWlCLEVBQUUsa0JBQWtCLENBQUMsaUJBQWlCO1FBQ3ZELFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxXQUFXO1FBQzNDLGNBQWMsRUFBRSxrQkFBa0IsQ0FBQyxjQUFjO0tBQ2xELENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmRzU3VibmV0R3JvdXBBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBzdWJuZXRJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBkZXNjcmlwdGlvbj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZHNQYXJhbWV0ZXJHcm91cEFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIGZhbWlseTogc3RyaW5nO1xuICBwYXJhbWV0ZXJzPzogQXJyYXk8e1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB2YWx1ZTogc3RyaW5nO1xuICAgIGFwcGx5TWV0aG9kPzogJ2ltbWVkaWF0ZScgfCAncGVuZGluZy1yZWJvb3QnO1xuICB9PjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIGRlc2NyaXB0aW9uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJkc0luc3RhbmNlQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgaWRlbnRpZmllcj86IHN0cmluZztcbiAgZW5naW5lOiBzdHJpbmc7XG4gIGVuZ2luZVZlcnNpb24/OiBzdHJpbmc7XG4gIGluc3RhbmNlQ2xhc3M6IHN0cmluZztcbiAgYWxsb2NhdGVkU3RvcmFnZT86IG51bWJlcjtcbiAgbWF4QWxsb2NhdGVkU3RvcmFnZT86IG51bWJlcjtcbiAgc3RvcmFnZVR5cGU/OiBzdHJpbmc7XG4gIHN0b3JhZ2VFbmNyeXB0ZWQ/OiBib29sZWFuO1xuICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBkYk5hbWU/OiBzdHJpbmc7XG4gIHVzZXJuYW1lOiBzdHJpbmc7XG4gIHZwY1NlY3VyaXR5R3JvdXBJZHM/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICBkYlN1Ym5ldEdyb3VwTmFtZT86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBwYXJhbWV0ZXJHcm91cE5hbWU/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgbXVsdGlBej86IGJvb2xlYW47XG4gIHB1YmxpY2x5QWNjZXNzaWJsZT86IGJvb2xlYW47XG4gIGJhY2t1cFJldGVudGlvblBlcmlvZD86IG51bWJlcjtcbiAgYmFja3VwV2luZG93Pzogc3RyaW5nO1xuICBtYWludGVuYW5jZVdpbmRvdz86IHN0cmluZztcbiAgYXV0b01pbm9yVmVyc2lvblVwZ3JhZGU/OiBib29sZWFuO1xuICBkZWxldGlvblByb3RlY3Rpb24/OiBib29sZWFuO1xuICBza2lwRmluYWxTbmFwc2hvdD86IGJvb2xlYW47XG4gIGZpbmFsU25hcHNob3RJZGVudGlmaWVyPzogc3RyaW5nO1xuICBwZXJmb3JtYW5jZUluc2lnaHRzRW5hYmxlZD86IGJvb2xlYW47XG4gIHBlcmZvcm1hbmNlSW5zaWdodHNLbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBlbmFibGVkQ2xvdWR3YXRjaExvZ3NFeHBvcnRzPzogc3RyaW5nW107XG4gIG1vbml0b3JpbmdJbnRlcnZhbD86IG51bWJlcjtcbiAgbW9uaXRvcmluZ1JvbGVBcm4/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmRzSW5zdGFuY2VSZXN1bHQge1xuICBpbnN0YW5jZTogYXdzLnJkcy5JbnN0YW5jZTtcbiAgaW5zdGFuY2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBpbnN0YW5jZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBlbmRwb2ludDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwb3J0OiBwdWx1bWkuT3V0cHV0PG51bWJlcj47XG4gIGFkZHJlc3M6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgbWFzdGVyVXNlclNlY3JldHM/OiBwdWx1bWkuT3V0cHV0PFxuICAgIGF3cy50eXBlcy5vdXRwdXQucmRzLkluc3RhbmNlTWFzdGVyVXNlclNlY3JldFtdXG4gID47XG4gIHN1Ym5ldEdyb3VwPzogYXdzLnJkcy5TdWJuZXRHcm91cDtcbiAgcGFyYW1ldGVyR3JvdXA/OiBhd3MucmRzLlBhcmFtZXRlckdyb3VwO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3VyZVJkc0luc3RhbmNlQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgaWRlbnRpZmllcj86IHN0cmluZztcbiAgZW5naW5lPzogc3RyaW5nO1xuICBlbmdpbmVWZXJzaW9uPzogc3RyaW5nO1xuICBpbnN0YW5jZUNsYXNzOiBzdHJpbmc7XG4gIGFsbG9jYXRlZFN0b3JhZ2U/OiBudW1iZXI7XG4gIGRiTmFtZT86IHN0cmluZztcbiAgdXNlcm5hbWU6IHN0cmluZztcbiAgc3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICBzZWN1cml0eUdyb3VwSWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q/OiBudW1iZXI7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgUmRzU3VibmV0R3JvdXBDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgc3VibmV0R3JvdXA6IGF3cy5yZHMuU3VibmV0R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBzdWJuZXRHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogUmRzU3VibmV0R3JvdXBBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6cmRzOlJkc1N1Ym5ldEdyb3VwQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgLy8gRklYRUQ6IFJlbW92ZSB0aGUgcHJvYmxlbWF0aWMgdmFsaWRhdGlvbiB0aGF0IHdhcyBjYXVzaW5nIHRoZSBlcnJvclxuICAgIC8vIExldCBQdWx1bWkgYW5kIEFXUyBoYW5kbGUgdGhlIHZhbGlkYXRpb24gb2Ygc3VibmV0IElEc1xuICAgIHRoaXMuc3VibmV0R3JvdXAgPSBuZXcgYXdzLnJkcy5TdWJuZXRHcm91cChcbiAgICAgIGAke25hbWV9LXN1Ym5ldC1ncm91cGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgc3VibmV0SWRzOiBhcmdzLnN1Ym5ldElkcywgLy8gRGlyZWN0IGFzc2lnbm1lbnQgd2l0aG91dCB2YWxpZGF0aW9uXG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uIHx8IGBEQiBzdWJuZXQgZ3JvdXAgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLnN1Ym5ldEdyb3VwTmFtZSA9IHRoaXMuc3VibmV0R3JvdXAubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHN1Ym5ldEdyb3VwOiB0aGlzLnN1Ym5ldEdyb3VwLFxuICAgICAgc3VibmV0R3JvdXBOYW1lOiB0aGlzLnN1Ym5ldEdyb3VwTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmRzUGFyYW1ldGVyR3JvdXBDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgcGFyYW1ldGVyR3JvdXA6IGF3cy5yZHMuUGFyYW1ldGVyR3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogUmRzUGFyYW1ldGVyR3JvdXBBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6cmRzOlJkc1BhcmFtZXRlckdyb3VwQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgdGhpcy5wYXJhbWV0ZXJHcm91cCA9IG5ldyBhd3MucmRzLlBhcmFtZXRlckdyb3VwKFxuICAgICAgYCR7bmFtZX0tcGFyYW1ldGVyLWdyb3VwYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICBmYW1pbHk6IGFyZ3MuZmFtaWx5LFxuICAgICAgICBkZXNjcmlwdGlvbjogYXJncy5kZXNjcmlwdGlvbiB8fCBgREIgcGFyYW1ldGVyIGdyb3VwIGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICBwYXJhbWV0ZXJzOiBhcmdzLnBhcmFtZXRlcnMsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLnBhcmFtZXRlckdyb3VwTmFtZSA9IHRoaXMucGFyYW1ldGVyR3JvdXAubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHBhcmFtZXRlckdyb3VwOiB0aGlzLnBhcmFtZXRlckdyb3VwLFxuICAgICAgcGFyYW1ldGVyR3JvdXBOYW1lOiB0aGlzLnBhcmFtZXRlckdyb3VwTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmRzSW5zdGFuY2VDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2U6IGF3cy5yZHMuSW5zdGFuY2U7XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZW5kcG9pbnQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHBvcnQ6IHB1bHVtaS5PdXRwdXQ8bnVtYmVyPjtcbiAgcHVibGljIHJlYWRvbmx5IGFkZHJlc3M6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IG1hc3RlclVzZXJTZWNyZXRzOiBwdWx1bWkuT3V0cHV0PFxuICAgIGF3cy50eXBlcy5vdXRwdXQucmRzLkluc3RhbmNlTWFzdGVyVXNlclNlY3JldFtdXG4gID47XG4gIHB1YmxpYyByZWFkb25seSBzdWJuZXRHcm91cD86IGF3cy5yZHMuU3VibmV0R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJHcm91cD86IGF3cy5yZHMuUGFyYW1ldGVyR3JvdXA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFJkc0luc3RhbmNlQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnJkczpSZHNJbnN0YW5jZUNvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgTWFuYWdlZEJ5OiAnUHVsdW1pJyxcbiAgICAgIFByb2plY3Q6ICdBV1MtTm92YS1Nb2RlbC1CcmVha2luZycsXG4gICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgfTtcblxuICAgIHRoaXMuaW5zdGFuY2UgPSBuZXcgYXdzLnJkcy5JbnN0YW5jZShcbiAgICAgIGAke25hbWV9LWluc3RhbmNlYCxcbiAgICAgIHtcbiAgICAgICAgaWRlbnRpZmllcjogYXJncy5pZGVudGlmaWVyIHx8IGFyZ3MubmFtZSxcbiAgICAgICAgZW5naW5lOiBhcmdzLmVuZ2luZSxcbiAgICAgICAgZW5naW5lVmVyc2lvbjogYXJncy5lbmdpbmVWZXJzaW9uLFxuICAgICAgICBpbnN0YW5jZUNsYXNzOiBhcmdzLmluc3RhbmNlQ2xhc3MsXG4gICAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IGFyZ3MuYWxsb2NhdGVkU3RvcmFnZSB8fCAyMCxcbiAgICAgICAgbWF4QWxsb2NhdGVkU3RvcmFnZTogYXJncy5tYXhBbGxvY2F0ZWRTdG9yYWdlIHx8IDEwMCxcbiAgICAgICAgc3RvcmFnZVR5cGU6IGFyZ3Muc3RvcmFnZVR5cGUgfHwgJ2dwMicsXG4gICAgICAgIHN0b3JhZ2VFbmNyeXB0ZWQ6IGFyZ3Muc3RvcmFnZUVuY3J5cHRlZCA/PyB0cnVlLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgZGJOYW1lOiBhcmdzLmRiTmFtZSxcbiAgICAgICAgdXNlcm5hbWU6IGFyZ3MudXNlcm5hbWUsXG4gICAgICAgIG1hbmFnZU1hc3RlclVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgbWFzdGVyVXNlclNlY3JldEttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBhcmdzLnZwY1NlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiBhcmdzLmRiU3VibmV0R3JvdXBOYW1lLFxuICAgICAgICBwYXJhbWV0ZXJHcm91cE5hbWU6IGFyZ3MucGFyYW1ldGVyR3JvdXBOYW1lLFxuICAgICAgICBtdWx0aUF6OiBhcmdzLm11bHRpQXogPz8gdHJ1ZSxcbiAgICAgICAgcHVibGljbHlBY2Nlc3NpYmxlOiBhcmdzLnB1YmxpY2x5QWNjZXNzaWJsZSA/PyBmYWxzZSxcbiAgICAgICAgYmFja3VwUmV0ZW50aW9uUGVyaW9kOiBhcmdzLmJhY2t1cFJldGVudGlvblBlcmlvZCB8fCA3LFxuICAgICAgICBiYWNrdXBXaW5kb3c6IGFyZ3MuYmFja3VwV2luZG93IHx8ICcwMzowMC0wNDowMCcsXG4gICAgICAgIG1haW50ZW5hbmNlV2luZG93OiBhcmdzLm1haW50ZW5hbmNlV2luZG93IHx8ICdzdW46MDQ6MDAtc3VuOjA1OjAwJyxcbiAgICAgICAgYXV0b01pbm9yVmVyc2lvblVwZ3JhZGU6IGFyZ3MuYXV0b01pbm9yVmVyc2lvblVwZ3JhZGUgPz8gdHJ1ZSxcbiAgICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBhcmdzLmRlbGV0aW9uUHJvdGVjdGlvbiA/PyB0cnVlLFxuICAgICAgICBza2lwRmluYWxTbmFwc2hvdDogYXJncy5za2lwRmluYWxTbmFwc2hvdCA/PyBmYWxzZSxcbiAgICAgICAgZmluYWxTbmFwc2hvdElkZW50aWZpZXI6XG4gICAgICAgICAgYXJncy5maW5hbFNuYXBzaG90SWRlbnRpZmllciB8fFxuICAgICAgICAgIGAke2FyZ3MubmFtZX0tZmluYWwtc25hcHNob3QtJHtEYXRlLm5vdygpfWAsXG4gICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNFbmFibGVkOiBhcmdzLnBlcmZvcm1hbmNlSW5zaWdodHNFbmFibGVkID8/IHRydWUsXG4gICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNLbXNLZXlJZDpcbiAgICAgICAgICBhcmdzLnBlcmZvcm1hbmNlSW5zaWdodHNLbXNLZXlJZCB8fCBhcmdzLmttc0tleUlkLFxuICAgICAgICBlbmFibGVkQ2xvdWR3YXRjaExvZ3NFeHBvcnRzOiBhcmdzLmVuYWJsZWRDbG91ZHdhdGNoTG9nc0V4cG9ydHMsXG4gICAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogYXJncy5tb25pdG9yaW5nSW50ZXJ2YWwgfHwgMCwgLy8gQ2hhbmdlZCBmcm9tIDYwIHRvIDBcbiAgICAgICAgbW9uaXRvcmluZ1JvbGVBcm46IGFyZ3MubW9uaXRvcmluZ1JvbGVBcm4sXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmluc3RhbmNlSWQgPSB0aGlzLmluc3RhbmNlLmlkO1xuICAgIHRoaXMuaW5zdGFuY2VBcm4gPSB0aGlzLmluc3RhbmNlLmFybjtcbiAgICB0aGlzLmVuZHBvaW50ID0gdGhpcy5pbnN0YW5jZS5lbmRwb2ludDtcbiAgICB0aGlzLnBvcnQgPSB0aGlzLmluc3RhbmNlLnBvcnQ7XG4gICAgdGhpcy5hZGRyZXNzID0gdGhpcy5pbnN0YW5jZS5hZGRyZXNzO1xuICAgIHRoaXMubWFzdGVyVXNlclNlY3JldHMgPSB0aGlzLmluc3RhbmNlLm1hc3RlclVzZXJTZWNyZXRzO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgaW5zdGFuY2U6IHRoaXMuaW5zdGFuY2UsXG4gICAgICBpbnN0YW5jZUlkOiB0aGlzLmluc3RhbmNlSWQsXG4gICAgICBpbnN0YW5jZUFybjogdGhpcy5pbnN0YW5jZUFybixcbiAgICAgIGVuZHBvaW50OiB0aGlzLmVuZHBvaW50LFxuICAgICAgcG9ydDogdGhpcy5wb3J0LFxuICAgICAgYWRkcmVzczogdGhpcy5hZGRyZXNzLFxuICAgICAgbWFzdGVyVXNlclNlY3JldHM6IHRoaXMubWFzdGVyVXNlclNlY3JldHMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyZVJkc0luc3RhbmNlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGluc3RhbmNlOiBhd3MucmRzLkluc3RhbmNlO1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGVuZHBvaW50OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwb3J0OiBwdWx1bWkuT3V0cHV0PG51bWJlcj47XG4gIHB1YmxpYyByZWFkb25seSBhZGRyZXNzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBtYXN0ZXJVc2VyU2VjcmV0czogcHVsdW1pLk91dHB1dDxcbiAgICBhd3MudHlwZXMub3V0cHV0LnJkcy5JbnN0YW5jZU1hc3RlclVzZXJTZWNyZXRbXVxuICA+O1xuICBwdWJsaWMgcmVhZG9ubHkgc3VibmV0R3JvdXA6IGF3cy5yZHMuU3VibmV0R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJHcm91cDogYXdzLnJkcy5QYXJhbWV0ZXJHcm91cDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogU2VjdXJlUmRzSW5zdGFuY2VBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6cmRzOlNlY3VyZVJkc0luc3RhbmNlQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZW5naW5lID0gYXJncy5lbmdpbmUgfHwgJ215c3FsJztcbiAgICBjb25zdCBlbmdpbmVWZXJzaW9uID1cbiAgICAgIGFyZ3MuZW5naW5lVmVyc2lvbiB8fCAoZW5naW5lID09PSAnbXlzcWwnID8gJzguMCcgOiAnMTMuNycpO1xuXG4gICAgLy8gQ3JlYXRlIHN1Ym5ldCBncm91cFxuICAgIGNvbnN0IHN1Ym5ldEdyb3VwQ29tcG9uZW50ID0gbmV3IFJkc1N1Ym5ldEdyb3VwQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tc3VibmV0LWdyb3VwYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1zdWJuZXQtZ3JvdXBgLFxuICAgICAgICBzdWJuZXRJZHM6IGFyZ3Muc3VibmV0SWRzLFxuICAgICAgICBkZXNjcmlwdGlvbjogYFNlY3VyZSBEQiBzdWJuZXQgZ3JvdXAgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5zdWJuZXRHcm91cCA9IHN1Ym5ldEdyb3VwQ29tcG9uZW50LnN1Ym5ldEdyb3VwO1xuXG4gICAgLy8gQ3JlYXRlIHBhcmFtZXRlciBncm91cCB3aXRoIHNlY3VyaXR5LWZvY3VzZWQgcGFyYW1ldGVyc1xuICAgIGNvbnN0IHNlY3VyZVBhcmFtZXRlcnMgPVxuICAgICAgZW5naW5lID09PSAnbXlzcWwnXG4gICAgICAgID8gW1xuICAgICAgICAgICAgeyBuYW1lOiAnbG9nX2Jpbl90cnVzdF9mdW5jdGlvbl9jcmVhdG9ycycsIHZhbHVlOiAnMScgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3Nsb3dfcXVlcnlfbG9nJywgdmFsdWU6ICcxJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnbG9uZ19xdWVyeV90aW1lJywgdmFsdWU6ICcyJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZ2VuZXJhbF9sb2cnLCB2YWx1ZTogJzEnIH0sXG4gICAgICAgICAgXVxuICAgICAgICA6IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2xvZ19zdGF0ZW1lbnQnLCB2YWx1ZTogJ2FsbCcgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2xvZ19taW5fZHVyYXRpb25fc3RhdGVtZW50JywgdmFsdWU6ICcxMDAwJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc2hhcmVkX3ByZWxvYWRfbGlicmFyaWVzJywgdmFsdWU6ICdwZ19zdGF0X3N0YXRlbWVudHMnIH0sXG4gICAgICAgICAgXTtcblxuICAgIGNvbnN0IHBhcmFtZXRlckZhbWlseSA9IGVuZ2luZSA9PT0gJ215c3FsJyA/ICdteXNxbDguMCcgOiAncG9zdGdyZXMxMyc7XG5cbiAgICBjb25zdCBwYXJhbWV0ZXJHcm91cENvbXBvbmVudCA9IG5ldyBSZHNQYXJhbWV0ZXJHcm91cENvbXBvbmVudChcbiAgICAgIGAke25hbWV9LXBhcmFtZXRlci1ncm91cGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tcGFyYW1ldGVyLWdyb3VwYCxcbiAgICAgICAgZmFtaWx5OiBwYXJhbWV0ZXJGYW1pbHksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgU2VjdXJlIERCIHBhcmFtZXRlciBncm91cCBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgcGFyYW1ldGVyczogc2VjdXJlUGFyYW1ldGVycyxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLnBhcmFtZXRlckdyb3VwID0gcGFyYW1ldGVyR3JvdXBDb21wb25lbnQucGFyYW1ldGVyR3JvdXA7XG5cbiAgICAvLyBDcmVhdGUgUkRTIGluc3RhbmNlIHdpdGggc2VjdXJpdHkgYmVzdCBwcmFjdGljZXNcbiAgICBjb25zdCByZHNDb21wb25lbnQgPSBuZXcgUmRzSW5zdGFuY2VDb21wb25lbnQoXG4gICAgICBuYW1lLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIGlkZW50aWZpZXI6IGFyZ3MuaWRlbnRpZmllcixcbiAgICAgICAgZW5naW5lOiBlbmdpbmUsXG4gICAgICAgIGVuZ2luZVZlcnNpb246IGVuZ2luZVZlcnNpb24sXG4gICAgICAgIGluc3RhbmNlQ2xhc3M6IGFyZ3MuaW5zdGFuY2VDbGFzcyxcbiAgICAgICAgYWxsb2NhdGVkU3RvcmFnZTogYXJncy5hbGxvY2F0ZWRTdG9yYWdlIHx8IDIwLFxuICAgICAgICBtYXhBbGxvY2F0ZWRTdG9yYWdlOiAxMDAsXG4gICAgICAgIHN0b3JhZ2VUeXBlOiAnZ3AyJyxcbiAgICAgICAgc3RvcmFnZUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIGRiTmFtZTogYXJncy5kYk5hbWUsXG4gICAgICAgIHVzZXJuYW1lOiBhcmdzLnVzZXJuYW1lLFxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBhcmdzLnNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiB0aGlzLnN1Ym5ldEdyb3VwLm5hbWUsXG4gICAgICAgIHBhcmFtZXRlckdyb3VwTmFtZTogdGhpcy5wYXJhbWV0ZXJHcm91cC5uYW1lLFxuICAgICAgICBtdWx0aUF6OiB0cnVlLFxuICAgICAgICBwdWJsaWNseUFjY2Vzc2libGU6IGZhbHNlLFxuICAgICAgICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q6IGFyZ3MuYmFja3VwUmV0ZW50aW9uUGVyaW9kIHx8IDcsXG4gICAgICAgIGJhY2t1cFdpbmRvdzogJzAzOjAwLTA0OjAwJyxcbiAgICAgICAgbWFpbnRlbmFuY2VXaW5kb3c6ICdzdW46MDQ6MDAtc3VuOjA1OjAwJyxcbiAgICAgICAgYXV0b01pbm9yVmVyc2lvblVwZ3JhZGU6IHRydWUsXG4gICAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgc2tpcEZpbmFsU25hcHNob3Q6IGZhbHNlLFxuICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c0ttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICBlbmFibGVkQ2xvdWR3YXRjaExvZ3NFeHBvcnRzOlxuICAgICAgICAgIGVuZ2luZSA9PT0gJ215c3FsJ1xuICAgICAgICAgICAgPyBbJ2Vycm9yJywgJ2dlbmVyYWwnLCAnc2xvd3F1ZXJ5J11cbiAgICAgICAgICAgIDogWydwb3N0Z3Jlc3FsJ10sXG4gICAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogMCwgLy8gQ2hhbmdlZCBmcm9tIDYwIHRvIDBcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmluc3RhbmNlID0gcmRzQ29tcG9uZW50Lmluc3RhbmNlO1xuICAgIHRoaXMuaW5zdGFuY2VJZCA9IHJkc0NvbXBvbmVudC5pbnN0YW5jZUlkO1xuICAgIHRoaXMuaW5zdGFuY2VBcm4gPSByZHNDb21wb25lbnQuaW5zdGFuY2VBcm47XG4gICAgdGhpcy5lbmRwb2ludCA9IHJkc0NvbXBvbmVudC5lbmRwb2ludDtcbiAgICB0aGlzLnBvcnQgPSByZHNDb21wb25lbnQucG9ydDtcbiAgICB0aGlzLmFkZHJlc3MgPSByZHNDb21wb25lbnQuYWRkcmVzcztcbiAgICB0aGlzLm1hc3RlclVzZXJTZWNyZXRzID0gcmRzQ29tcG9uZW50Lm1hc3RlclVzZXJTZWNyZXRzO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgaW5zdGFuY2U6IHRoaXMuaW5zdGFuY2UsXG4gICAgICBpbnN0YW5jZUlkOiB0aGlzLmluc3RhbmNlSWQsXG4gICAgICBpbnN0YW5jZUFybjogdGhpcy5pbnN0YW5jZUFybixcbiAgICAgIGVuZHBvaW50OiB0aGlzLmVuZHBvaW50LFxuICAgICAgcG9ydDogdGhpcy5wb3J0LFxuICAgICAgYWRkcmVzczogdGhpcy5hZGRyZXNzLFxuICAgICAgbWFzdGVyVXNlclNlY3JldHM6IHRoaXMubWFzdGVyVXNlclNlY3JldHMsXG4gICAgICBzdWJuZXRHcm91cDogdGhpcy5zdWJuZXRHcm91cCxcbiAgICAgIHBhcmFtZXRlckdyb3VwOiB0aGlzLnBhcmFtZXRlckdyb3VwLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZHNTdWJuZXRHcm91cChcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBSZHNTdWJuZXRHcm91cEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pIHtcbiAgY29uc3Qgc3VibmV0R3JvdXBDb21wb25lbnQgPSBuZXcgUmRzU3VibmV0R3JvdXBDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgc3VibmV0R3JvdXA6IHN1Ym5ldEdyb3VwQ29tcG9uZW50LnN1Ym5ldEdyb3VwLFxuICAgIHN1Ym5ldEdyb3VwTmFtZTogc3VibmV0R3JvdXBDb21wb25lbnQuc3VibmV0R3JvdXBOYW1lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmRzUGFyYW1ldGVyR3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogUmRzUGFyYW1ldGVyR3JvdXBBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKSB7XG4gIGNvbnN0IHBhcmFtZXRlckdyb3VwQ29tcG9uZW50ID0gbmV3IFJkc1BhcmFtZXRlckdyb3VwQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzXG4gICk7XG4gIHJldHVybiB7XG4gICAgcGFyYW1ldGVyR3JvdXA6IHBhcmFtZXRlckdyb3VwQ29tcG9uZW50LnBhcmFtZXRlckdyb3VwLFxuICAgIHBhcmFtZXRlckdyb3VwTmFtZTogcGFyYW1ldGVyR3JvdXBDb21wb25lbnQucGFyYW1ldGVyR3JvdXBOYW1lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmRzSW5zdGFuY2UoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogUmRzSW5zdGFuY2VBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogUmRzSW5zdGFuY2VSZXN1bHQge1xuICBjb25zdCByZHNDb21wb25lbnQgPSBuZXcgUmRzSW5zdGFuY2VDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgaW5zdGFuY2U6IHJkc0NvbXBvbmVudC5pbnN0YW5jZSxcbiAgICBpbnN0YW5jZUlkOiByZHNDb21wb25lbnQuaW5zdGFuY2VJZCxcbiAgICBpbnN0YW5jZUFybjogcmRzQ29tcG9uZW50Lmluc3RhbmNlQXJuLFxuICAgIGVuZHBvaW50OiByZHNDb21wb25lbnQuZW5kcG9pbnQsXG4gICAgcG9ydDogcmRzQ29tcG9uZW50LnBvcnQsXG4gICAgYWRkcmVzczogcmRzQ29tcG9uZW50LmFkZHJlc3MsXG4gICAgbWFzdGVyVXNlclNlY3JldHM6IHJkc0NvbXBvbmVudC5tYXN0ZXJVc2VyU2VjcmV0cyxcbiAgICBzdWJuZXRHcm91cDogcmRzQ29tcG9uZW50LnN1Ym5ldEdyb3VwLFxuICAgIHBhcmFtZXRlckdyb3VwOiByZHNDb21wb25lbnQucGFyYW1ldGVyR3JvdXAsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWN1cmVSZHNJbnN0YW5jZShcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBTZWN1cmVSZHNJbnN0YW5jZUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBSZHNJbnN0YW5jZVJlc3VsdCB7XG4gIGNvbnN0IHNlY3VyZVJkc0NvbXBvbmVudCA9IG5ldyBTZWN1cmVSZHNJbnN0YW5jZUNvbXBvbmVudChuYW1lLCBhcmdzLCBvcHRzKTtcbiAgcmV0dXJuIHtcbiAgICBpbnN0YW5jZTogc2VjdXJlUmRzQ29tcG9uZW50Lmluc3RhbmNlLFxuICAgIGluc3RhbmNlSWQ6IHNlY3VyZVJkc0NvbXBvbmVudC5pbnN0YW5jZUlkLFxuICAgIGluc3RhbmNlQXJuOiBzZWN1cmVSZHNDb21wb25lbnQuaW5zdGFuY2VBcm4sXG4gICAgZW5kcG9pbnQ6IHNlY3VyZVJkc0NvbXBvbmVudC5lbmRwb2ludCxcbiAgICBwb3J0OiBzZWN1cmVSZHNDb21wb25lbnQucG9ydCxcbiAgICBhZGRyZXNzOiBzZWN1cmVSZHNDb21wb25lbnQuYWRkcmVzcyxcbiAgICBtYXN0ZXJVc2VyU2VjcmV0czogc2VjdXJlUmRzQ29tcG9uZW50Lm1hc3RlclVzZXJTZWNyZXRzLFxuICAgIHN1Ym5ldEdyb3VwOiBzZWN1cmVSZHNDb21wb25lbnQuc3VibmV0R3JvdXAsXG4gICAgcGFyYW1ldGVyR3JvdXA6IHNlY3VyZVJkc0NvbXBvbmVudC5wYXJhbWV0ZXJHcm91cCxcbiAgfTtcbn1cbiJdfQ==