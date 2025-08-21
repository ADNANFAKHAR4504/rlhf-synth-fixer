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
        // FIXED: Ensure subnet IDs are properly resolved
        this.subnetGroup = new aws.rds.SubnetGroup(`${name}-subnet-group`, {
            name: args.name,
            subnetIds: pulumi.output(args.subnetIds).apply(ids => {
                // Log the subnet IDs for debugging
                console.log(`Creating DB subnet group ${args.name} with subnet IDs:`, ids);
                // Ensure we have valid subnet IDs
                if (!ids || ids.length === 0) {
                    throw new Error(`No subnet IDs provided for DB subnet group ${args.name}`);
                }
                return ids;
            }),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXlZQSxvREFVQztBQUVELDBEQWNDO0FBRUQsOENBaUJDO0FBRUQsMERBaUJDO0FBemNELHVEQUF5QztBQUN6QyxpREFBbUM7QUFvRm5DLE1BQWEsdUJBQXdCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNuRCxXQUFXLENBQXNCO0lBQ2pDLGVBQWUsQ0FBd0I7SUFFdkQsWUFDRSxJQUFZLEVBQ1osSUFBd0IsRUFDeEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFekQsTUFBTSxXQUFXLEdBQUc7WUFDbEIsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLE1BQU0sQ0FBQyxRQUFRLEVBQUU7WUFDOUIsU0FBUyxFQUFFLFFBQVE7WUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtZQUNsQyxHQUFHLElBQUksQ0FBQyxJQUFJO1NBQ2IsQ0FBQztRQUVGLGlEQUFpRDtRQUNqRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQ3hDLEdBQUcsSUFBSSxlQUFlLEVBQ3RCO1lBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsU0FBUyxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDbkQsbUNBQW1DO2dCQUNuQyxPQUFPLENBQUMsR0FBRyxDQUFDLDRCQUE0QixJQUFJLENBQUMsSUFBSSxtQkFBbUIsRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFFM0Usa0NBQWtDO2dCQUNsQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEtB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UUFDakQsV0FBVyxFQUFFLFlBQVksQ0FBQyxXQUFXO1FBQ3JDLGNBQWMsRUFBRSxZQUFZLENBQUMsY0FBYztLQUM1QyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQWdCLHVCQUF1QixDQUNyQyxJQUFZLEVBQ1osSUFBMkIsRUFDM0IsSUFBc0M7SUFFdEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLDBCQUEwQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUUsT0FBTztRQUNMLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxRQUFRO1FBQ3JDLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxVQUFVO1FBQ3pDLFdBQVcsRUFBRSxrQkFBa0IsQ0FBQyxXQUFXO1FBQzNDLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxRQUFRO1FBQ3JDLElBQUksRUFBRSxrQkFBa0IsQ0FBQyxJQUFJO1FBQzdCLE9BQU8sRUFBRSxrQkFBa0IsQ0FBQyxPQUFPO1FBQ25DLGlCQUFpQixFQUFFLGtCQUFrQixDQUFDLGlCQUFpQjtRQUN2RCxXQUFXLEVBQUUsa0JBQWtCLENBQUMsV0FBVztRQUMzQyxjQUFjLEVBQUUsa0JBQWtCLENBQUMsY0FBYztLQUNsRCxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJkc1N1Ym5ldEdyb3VwQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgc3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmRzUGFyYW1ldGVyR3JvdXBBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBmYW1pbHk6IHN0cmluZztcbiAgcGFyYW1ldGVycz86IEFycmF5PHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgdmFsdWU6IHN0cmluZztcbiAgICBhcHBseU1ldGhvZD86ICdpbW1lZGlhdGUnIHwgJ3BlbmRpbmctcmVib290JztcbiAgfT47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xuICBkZXNjcmlwdGlvbj86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBSZHNJbnN0YW5jZUFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIGlkZW50aWZpZXI/OiBzdHJpbmc7XG4gIGVuZ2luZTogc3RyaW5nO1xuICBlbmdpbmVWZXJzaW9uPzogc3RyaW5nO1xuICBpbnN0YW5jZUNsYXNzOiBzdHJpbmc7XG4gIGFsbG9jYXRlZFN0b3JhZ2U/OiBudW1iZXI7XG4gIG1heEFsbG9jYXRlZFN0b3JhZ2U/OiBudW1iZXI7XG4gIHN0b3JhZ2VUeXBlPzogc3RyaW5nO1xuICBzdG9yYWdlRW5jcnlwdGVkPzogYm9vbGVhbjtcbiAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgZGJOYW1lPzogc3RyaW5nO1xuICB1c2VybmFtZTogc3RyaW5nO1xuICB2cGNTZWN1cml0eUdyb3VwSWRzPzogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgZGJTdWJuZXRHcm91cE5hbWU/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcGFyYW1ldGVyR3JvdXBOYW1lPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIG11bHRpQXo/OiBib29sZWFuO1xuICBwdWJsaWNseUFjY2Vzc2libGU/OiBib29sZWFuO1xuICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q/OiBudW1iZXI7XG4gIGJhY2t1cFdpbmRvdz86IHN0cmluZztcbiAgbWFpbnRlbmFuY2VXaW5kb3c/OiBzdHJpbmc7XG4gIGF1dG9NaW5vclZlcnNpb25VcGdyYWRlPzogYm9vbGVhbjtcbiAgZGVsZXRpb25Qcm90ZWN0aW9uPzogYm9vbGVhbjtcbiAgc2tpcEZpbmFsU25hcHNob3Q/OiBib29sZWFuO1xuICBmaW5hbFNuYXBzaG90SWRlbnRpZmllcj86IHN0cmluZztcbiAgcGVyZm9ybWFuY2VJbnNpZ2h0c0VuYWJsZWQ/OiBib29sZWFuO1xuICBwZXJmb3JtYW5jZUluc2lnaHRzS21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgZW5hYmxlZENsb3Vkd2F0Y2hMb2dzRXhwb3J0cz86IHN0cmluZ1tdO1xuICBtb25pdG9yaW5nSW50ZXJ2YWw/OiBudW1iZXI7XG4gIG1vbml0b3JpbmdSb2xlQXJuPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJkc0luc3RhbmNlUmVzdWx0IHtcbiAgaW5zdGFuY2U6IGF3cy5yZHMuSW5zdGFuY2U7XG4gIGluc3RhbmNlSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgaW5zdGFuY2VBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgZW5kcG9pbnQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcG9ydDogcHVsdW1pLk91dHB1dDxudW1iZXI+O1xuICBhZGRyZXNzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIG1hc3RlclVzZXJTZWNyZXRzPzogcHVsdW1pLk91dHB1dDxcbiAgICBhd3MudHlwZXMub3V0cHV0LnJkcy5JbnN0YW5jZU1hc3RlclVzZXJTZWNyZXRbXVxuICA+O1xuICBzdWJuZXRHcm91cD86IGF3cy5yZHMuU3VibmV0R3JvdXA7XG4gIHBhcmFtZXRlckdyb3VwPzogYXdzLnJkcy5QYXJhbWV0ZXJHcm91cDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWN1cmVSZHNJbnN0YW5jZUFyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIGlkZW50aWZpZXI/OiBzdHJpbmc7XG4gIGVuZ2luZT86IHN0cmluZztcbiAgZW5naW5lVmVyc2lvbj86IHN0cmluZztcbiAgaW5zdGFuY2VDbGFzczogc3RyaW5nO1xuICBhbGxvY2F0ZWRTdG9yYWdlPzogbnVtYmVyO1xuICBkYk5hbWU/OiBzdHJpbmc7XG4gIHVzZXJuYW1lOiBzdHJpbmc7XG4gIHN1Ym5ldElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgc2VjdXJpdHlHcm91cElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgYmFja3VwUmV0ZW50aW9uUGVyaW9kPzogbnVtYmVyO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIFJkc1N1Ym5ldEdyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHN1Ym5ldEdyb3VwOiBhd3MucmRzLlN1Ym5ldEdyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgc3VibmV0R3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFJkc1N1Ym5ldEdyb3VwQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnJkczpSZHNTdWJuZXRHcm91cENvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgTWFuYWdlZEJ5OiAnUHVsdW1pJyxcbiAgICAgIFByb2plY3Q6ICdBV1MtTm92YS1Nb2RlbC1CcmVha2luZycsXG4gICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgfTtcblxuICAgIC8vIEZJWEVEOiBFbnN1cmUgc3VibmV0IElEcyBhcmUgcHJvcGVybHkgcmVzb2x2ZWRcbiAgICB0aGlzLnN1Ym5ldEdyb3VwID0gbmV3IGF3cy5yZHMuU3VibmV0R3JvdXAoXG4gICAgICBgJHtuYW1lfS1zdWJuZXQtZ3JvdXBgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIHN1Ym5ldElkczogcHVsdW1pLm91dHB1dChhcmdzLnN1Ym5ldElkcykuYXBwbHkoaWRzID0+IHtcbiAgICAgICAgICAvLyBMb2cgdGhlIHN1Ym5ldCBJRHMgZm9yIGRlYnVnZ2luZ1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBDcmVhdGluZyBEQiBzdWJuZXQgZ3JvdXAgJHthcmdzLm5hbWV9IHdpdGggc3VibmV0IElEczpgLCBpZHMpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIEVuc3VyZSB3ZSBoYXZlIHZhbGlkIHN1Ym5ldCBJRHNcbiAgICAgICAgICBpZiAoIWlkcyB8fCBpZHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHN1Ym5ldCBJRHMgcHJvdmlkZWQgZm9yIERCIHN1Ym5ldCBncm91cCAke2FyZ3MubmFtZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgXG4gICAgICAgICAgcmV0dXJuIGlkcztcbiAgICAgICAgfSksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uIHx8IGBEQiBzdWJuZXQgZ3JvdXAgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLnN1Ym5ldEdyb3VwTmFtZSA9IHRoaXMuc3VibmV0R3JvdXAubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHN1Ym5ldEdyb3VwOiB0aGlzLnN1Ym5ldEdyb3VwLFxuICAgICAgc3VibmV0R3JvdXBOYW1lOiB0aGlzLnN1Ym5ldEdyb3VwTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmRzUGFyYW1ldGVyR3JvdXBDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgcGFyYW1ldGVyR3JvdXA6IGF3cy5yZHMuUGFyYW1ldGVyR3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogUmRzUGFyYW1ldGVyR3JvdXBBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6cmRzOlJkc1BhcmFtZXRlckdyb3VwQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgdGhpcy5wYXJhbWV0ZXJHcm91cCA9IG5ldyBhd3MucmRzLlBhcmFtZXRlckdyb3VwKFxuICAgICAgYCR7bmFtZX0tcGFyYW1ldGVyLWdyb3VwYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy5uYW1lLFxuICAgICAgICBmYW1pbHk6IGFyZ3MuZmFtaWx5LFxuICAgICAgICBkZXNjcmlwdGlvbjogYXJncy5kZXNjcmlwdGlvbiB8fCBgREIgcGFyYW1ldGVyIGdyb3VwIGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICBwYXJhbWV0ZXJzOiBhcmdzLnBhcmFtZXRlcnMsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLnBhcmFtZXRlckdyb3VwTmFtZSA9IHRoaXMucGFyYW1ldGVyR3JvdXAubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHBhcmFtZXRlckdyb3VwOiB0aGlzLnBhcmFtZXRlckdyb3VwLFxuICAgICAgcGFyYW1ldGVyR3JvdXBOYW1lOiB0aGlzLnBhcmFtZXRlckdyb3VwTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmRzSW5zdGFuY2VDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2U6IGF3cy5yZHMuSW5zdGFuY2U7XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBpbnN0YW5jZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZW5kcG9pbnQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHBvcnQ6IHB1bHVtaS5PdXRwdXQ8bnVtYmVyPjtcbiAgcHVibGljIHJlYWRvbmx5IGFkZHJlc3M6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IG1hc3RlclVzZXJTZWNyZXRzOiBwdWx1bWkuT3V0cHV0PFxuICAgIGF3cy50eXBlcy5vdXRwdXQucmRzLkluc3RhbmNlTWFzdGVyVXNlclNlY3JldFtdXG4gID47XG4gIHB1YmxpYyByZWFkb25seSBzdWJuZXRHcm91cD86IGF3cy5yZHMuU3VibmV0R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJHcm91cD86IGF3cy5yZHMuUGFyYW1ldGVyR3JvdXA7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IFJkc0luc3RhbmNlQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnJkczpSZHNJbnN0YW5jZUNvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgTWFuYWdlZEJ5OiAnUHVsdW1pJyxcbiAgICAgIFByb2plY3Q6ICdBV1MtTm92YS1Nb2RlbC1CcmVha2luZycsXG4gICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgfTtcblxuICAgIHRoaXMuaW5zdGFuY2UgPSBuZXcgYXdzLnJkcy5JbnN0YW5jZShcbiAgICAgIGAke25hbWV9LWluc3RhbmNlYCxcbiAgICAgIHtcbiAgICAgICAgaWRlbnRpZmllcjogYXJncy5pZGVudGlmaWVyIHx8IGFyZ3MubmFtZSxcbiAgICAgICAgZW5naW5lOiBhcmdzLmVuZ2luZSxcbiAgICAgICAgZW5naW5lVmVyc2lvbjogYXJncy5lbmdpbmVWZXJzaW9uLFxuICAgICAgICBpbnN0YW5jZUNsYXNzOiBhcmdzLmluc3RhbmNlQ2xhc3MsXG4gICAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IGFyZ3MuYWxsb2NhdGVkU3RvcmFnZSB8fCAyMCxcbiAgICAgICAgbWF4QWxsb2NhdGVkU3RvcmFnZTogYXJncy5tYXhBbGxvY2F0ZWRTdG9yYWdlIHx8IDEwMCxcbiAgICAgICAgc3RvcmFnZVR5cGU6IGFyZ3Muc3RvcmFnZVR5cGUgfHwgJ2dwMicsXG4gICAgICAgIHN0b3JhZ2VFbmNyeXB0ZWQ6IGFyZ3Muc3RvcmFnZUVuY3J5cHRlZCA/PyB0cnVlLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgZGJOYW1lOiBhcmdzLmRiTmFtZSxcbiAgICAgICAgdXNlcm5hbWU6IGFyZ3MudXNlcm5hbWUsXG4gICAgICAgIG1hbmFnZU1hc3RlclVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgbWFzdGVyVXNlclNlY3JldEttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBhcmdzLnZwY1NlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiBhcmdzLmRiU3VibmV0R3JvdXBOYW1lLFxuICAgICAgICBwYXJhbWV0ZXJHcm91cE5hbWU6IGFyZ3MucGFyYW1ldGVyR3JvdXBOYW1lLFxuICAgICAgICBtdWx0aUF6OiBhcmdzLm11bHRpQXogPz8gdHJ1ZSxcbiAgICAgICAgcHVibGljbHlBY2Nlc3NpYmxlOiBhcmdzLnB1YmxpY2x5QWNjZXNzaWJsZSA/PyBmYWxzZSxcbiAgICAgICAgYmFja3VwUmV0ZW50aW9uUGVyaW9kOiBhcmdzLmJhY2t1cFJldGVudGlvblBlcmlvZCB8fCA3LFxuICAgICAgICBiYWNrdXBXaW5kb3c6IGFyZ3MuYmFja3VwV2luZG93IHx8ICcwMzowMC0wNDowMCcsXG4gICAgICAgIG1haW50ZW5hbmNlV2luZG93OiBhcmdzLm1haW50ZW5hbmNlV2luZG93IHx8ICdzdW46MDQ6MDAtc3VuOjA1OjAwJyxcbiAgICAgICAgYXV0b01pbm9yVmVyc2lvblVwZ3JhZGU6IGFyZ3MuYXV0b01pbm9yVmVyc2lvblVwZ3JhZGUgPz8gdHJ1ZSxcbiAgICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBhcmdzLmRlbGV0aW9uUHJvdGVjdGlvbiA/PyB0cnVlLFxuICAgICAgICBza2lwRmluYWxTbmFwc2hvdDogYXJncy5za2lwRmluYWxTbmFwc2hvdCA/PyBmYWxzZSxcbiAgICAgICAgZmluYWxTbmFwc2hvdElkZW50aWZpZXI6XG4gICAgICAgICAgYXJncy5maW5hbFNuYXBzaG90SWRlbnRpZmllciB8fFxuICAgICAgICAgIGAke2FyZ3MubmFtZX0tZmluYWwtc25hcHNob3QtJHtEYXRlLm5vdygpfWAsXG4gICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNFbmFibGVkOiBhcmdzLnBlcmZvcm1hbmNlSW5zaWdodHNFbmFibGVkID8/IHRydWUsXG4gICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNLbXNLZXlJZDpcbiAgICAgICAgICBhcmdzLnBlcmZvcm1hbmNlSW5zaWdodHNLbXNLZXlJZCB8fCBhcmdzLmttc0tleUlkLFxuICAgICAgICBlbmFibGVkQ2xvdWR3YXRjaExvZ3NFeHBvcnRzOiBhcmdzLmVuYWJsZWRDbG91ZHdhdGNoTG9nc0V4cG9ydHMsXG4gICAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogYXJncy5tb25pdG9yaW5nSW50ZXJ2YWwgfHwgMCwgLy8gQ2hhbmdlZCBmcm9tIDYwIHRvIDBcbiAgICAgICAgbW9uaXRvcmluZ1JvbGVBcm46IGFyZ3MubW9uaXRvcmluZ1JvbGVBcm4sXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmluc3RhbmNlSWQgPSB0aGlzLmluc3RhbmNlLmlkO1xuICAgIHRoaXMuaW5zdGFuY2VBcm4gPSB0aGlzLmluc3RhbmNlLmFybjtcbiAgICB0aGlzLmVuZHBvaW50ID0gdGhpcy5pbnN0YW5jZS5lbmRwb2ludDtcbiAgICB0aGlzLnBvcnQgPSB0aGlzLmluc3RhbmNlLnBvcnQ7XG4gICAgdGhpcy5hZGRyZXNzID0gdGhpcy5pbnN0YW5jZS5hZGRyZXNzO1xuICAgIHRoaXMubWFzdGVyVXNlclNlY3JldHMgPSB0aGlzLmluc3RhbmNlLm1hc3RlclVzZXJTZWNyZXRzO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgaW5zdGFuY2U6IHRoaXMuaW5zdGFuY2UsXG4gICAgICBpbnN0YW5jZUlkOiB0aGlzLmluc3RhbmNlSWQsXG4gICAgICBpbnN0YW5jZUFybjogdGhpcy5pbnN0YW5jZUFybixcbiAgICAgIGVuZHBvaW50OiB0aGlzLmVuZHBvaW50LFxuICAgICAgcG9ydDogdGhpcy5wb3J0LFxuICAgICAgYWRkcmVzczogdGhpcy5hZGRyZXNzLFxuICAgICAgbWFzdGVyVXNlclNlY3JldHM6IHRoaXMubWFzdGVyVXNlclNlY3JldHMsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlY3VyZVJkc0luc3RhbmNlQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGluc3RhbmNlOiBhd3MucmRzLkluc3RhbmNlO1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgaW5zdGFuY2VBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGVuZHBvaW50OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBwb3J0OiBwdWx1bWkuT3V0cHV0PG51bWJlcj47XG4gIHB1YmxpYyByZWFkb25seSBhZGRyZXNzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBtYXN0ZXJVc2VyU2VjcmV0czogcHVsdW1pLk91dHB1dDxcbiAgICBhd3MudHlwZXMub3V0cHV0LnJkcy5JbnN0YW5jZU1hc3RlclVzZXJTZWNyZXRbXVxuICA+O1xuICBwdWJsaWMgcmVhZG9ubHkgc3VibmV0R3JvdXA6IGF3cy5yZHMuU3VibmV0R3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBwYXJhbWV0ZXJHcm91cDogYXdzLnJkcy5QYXJhbWV0ZXJHcm91cDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogU2VjdXJlUmRzSW5zdGFuY2VBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6cmRzOlNlY3VyZVJkc0luc3RhbmNlQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZW5naW5lID0gYXJncy5lbmdpbmUgfHwgJ215c3FsJztcbiAgICBjb25zdCBlbmdpbmVWZXJzaW9uID1cbiAgICAgIGFyZ3MuZW5naW5lVmVyc2lvbiB8fCAoZW5naW5lID09PSAnbXlzcWwnID8gJzguMCcgOiAnMTMuNycpO1xuXG4gICAgLy8gQ3JlYXRlIHN1Ym5ldCBncm91cFxuICAgIGNvbnN0IHN1Ym5ldEdyb3VwQ29tcG9uZW50ID0gbmV3IFJkc1N1Ym5ldEdyb3VwQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tc3VibmV0LWdyb3VwYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy5uYW1lfS1zdWJuZXQtZ3JvdXBgLFxuICAgICAgICBzdWJuZXRJZHM6IGFyZ3Muc3VibmV0SWRzLFxuICAgICAgICBkZXNjcmlwdGlvbjogYFNlY3VyZSBEQiBzdWJuZXQgZ3JvdXAgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH1cbiAgICApO1xuXG4gICAgdGhpcy5zdWJuZXRHcm91cCA9IHN1Ym5ldEdyb3VwQ29tcG9uZW50LnN1Ym5ldEdyb3VwO1xuXG4gICAgLy8gQ3JlYXRlIHBhcmFtZXRlciBncm91cCB3aXRoIHNlY3VyaXR5LWZvY3VzZWQgcGFyYW1ldGVyc1xuICAgIGNvbnN0IHNlY3VyZVBhcmFtZXRlcnMgPVxuICAgICAgZW5naW5lID09PSAnbXlzcWwnXG4gICAgICAgID8gW1xuICAgICAgICAgICAgeyBuYW1lOiAnbG9nX2Jpbl90cnVzdF9mdW5jdGlvbl9jcmVhdG9ycycsIHZhbHVlOiAnMScgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3Nsb3dfcXVlcnlfbG9nJywgdmFsdWU6ICcxJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnbG9uZ19xdWVyeV90aW1lJywgdmFsdWU6ICcyJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZ2VuZXJhbF9sb2cnLCB2YWx1ZTogJzEnIH0sXG4gICAgICAgICAgXVxuICAgICAgICA6IFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2xvZ19zdGF0ZW1lbnQnLCB2YWx1ZTogJ2FsbCcgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2xvZ19taW5fZHVyYXRpb25fc3RhdGVtZW50JywgdmFsdWU6ICcxMDAwJyB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc2hhcmVkX3ByZWxvYWRfbGlicmFyaWVzJywgdmFsdWU6ICdwZ19zdGF0X3N0YXRlbWVudHMnIH0sXG4gICAgICAgICAgXTtcblxuICAgIGNvbnN0IHBhcmFtZXRlckZhbWlseSA9IGVuZ2luZSA9PT0gJ215c3FsJyA/ICdteXNxbDguMCcgOiAncG9zdGdyZXMxMyc7XG5cbiAgICBjb25zdCBwYXJhbWV0ZXJHcm91cENvbXBvbmVudCA9IG5ldyBSZHNQYXJhbWV0ZXJHcm91cENvbXBvbmVudChcbiAgICAgIGAke25hbWV9LXBhcmFtZXRlci1ncm91cGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke2FyZ3MubmFtZX0tcGFyYW1ldGVyLWdyb3VwYCxcbiAgICAgICAgZmFtaWx5OiBwYXJhbWV0ZXJGYW1pbHksXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgU2VjdXJlIERCIHBhcmFtZXRlciBncm91cCBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgcGFyYW1ldGVyczogc2VjdXJlUGFyYW1ldGVycyxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLnBhcmFtZXRlckdyb3VwID0gcGFyYW1ldGVyR3JvdXBDb21wb25lbnQucGFyYW1ldGVyR3JvdXA7XG5cbiAgICAvLyBDcmVhdGUgUkRTIGluc3RhbmNlIHdpdGggc2VjdXJpdHkgYmVzdCBwcmFjdGljZXNcbiAgICBjb25zdCByZHNDb21wb25lbnQgPSBuZXcgUmRzSW5zdGFuY2VDb21wb25lbnQoXG4gICAgICBuYW1lLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIGlkZW50aWZpZXI6IGFyZ3MuaWRlbnRpZmllcixcbiAgICAgICAgZW5naW5lOiBlbmdpbmUsXG4gICAgICAgIGVuZ2luZVZlcnNpb246IGVuZ2luZVZlcnNpb24sXG4gICAgICAgIGluc3RhbmNlQ2xhc3M6IGFyZ3MuaW5zdGFuY2VDbGFzcyxcbiAgICAgICAgYWxsb2NhdGVkU3RvcmFnZTogYXJncy5hbGxvY2F0ZWRTdG9yYWdlIHx8IDIwLFxuICAgICAgICBtYXhBbGxvY2F0ZWRTdG9yYWdlOiAxMDAsXG4gICAgICAgIHN0b3JhZ2VUeXBlOiAnZ3AyJyxcbiAgICAgICAgc3RvcmFnZUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIGRiTmFtZTogYXJncy5kYk5hbWUsXG4gICAgICAgIHVzZXJuYW1lOiBhcmdzLnVzZXJuYW1lLFxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBhcmdzLnNlY3VyaXR5R3JvdXBJZHMsXG4gICAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiB0aGlzLnN1Ym5ldEdyb3VwLm5hbWUsXG4gICAgICAgIHBhcmFtZXRlckdyb3VwTmFtZTogdGhpcy5wYXJhbWV0ZXJHcm91cC5uYW1lLFxuICAgICAgICBtdWx0aUF6OiB0cnVlLFxuICAgICAgICBwdWJsaWNseUFjY2Vzc2libGU6IGZhbHNlLFxuICAgICAgICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q6IGFyZ3MuYmFja3VwUmV0ZW50aW9uUGVyaW9kIHx8IDcsXG4gICAgICAgIGJhY2t1cFdpbmRvdzogJzAzOjAwLTA0OjAwJyxcbiAgICAgICAgbWFpbnRlbmFuY2VXaW5kb3c6ICdzdW46MDQ6MDAtc3VuOjA1OjAwJyxcbiAgICAgICAgYXV0b01pbm9yVmVyc2lvblVwZ3JhZGU6IHRydWUsXG4gICAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogdHJ1ZSxcbiAgICAgICAgc2tpcEZpbmFsU25hcHNob3Q6IGZhbHNlLFxuICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c0ttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICBlbmFibGVkQ2xvdWR3YXRjaExvZ3NFeHBvcnRzOlxuICAgICAgICAgIGVuZ2luZSA9PT0gJ215c3FsJ1xuICAgICAgICAgICAgPyBbJ2Vycm9yJywgJ2dlbmVyYWwnLCAnc2xvd3F1ZXJ5J11cbiAgICAgICAgICAgIDogWydwb3N0Z3Jlc3FsJ10sXG4gICAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogMCwgLy8gQ2hhbmdlZCBmcm9tIDYwIHRvIDBcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfVxuICAgICk7XG5cbiAgICB0aGlzLmluc3RhbmNlID0gcmRzQ29tcG9uZW50Lmluc3RhbmNlO1xuICAgIHRoaXMuaW5zdGFuY2VJZCA9IHJkc0NvbXBvbmVudC5pbnN0YW5jZUlkO1xuICAgIHRoaXMuaW5zdGFuY2VBcm4gPSByZHNDb21wb25lbnQuaW5zdGFuY2VBcm47XG4gICAgdGhpcy5lbmRwb2ludCA9IHJkc0NvbXBvbmVudC5lbmRwb2ludDtcbiAgICB0aGlzLnBvcnQgPSByZHNDb21wb25lbnQucG9ydDtcbiAgICB0aGlzLmFkZHJlc3MgPSByZHNDb21wb25lbnQuYWRkcmVzcztcbiAgICB0aGlzLm1hc3RlclVzZXJTZWNyZXRzID0gcmRzQ29tcG9uZW50Lm1hc3RlclVzZXJTZWNyZXRzO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgaW5zdGFuY2U6IHRoaXMuaW5zdGFuY2UsXG4gICAgICBpbnN0YW5jZUlkOiB0aGlzLmluc3RhbmNlSWQsXG4gICAgICBpbnN0YW5jZUFybjogdGhpcy5pbnN0YW5jZUFybixcbiAgICAgIGVuZHBvaW50OiB0aGlzLmVuZHBvaW50LFxuICAgICAgcG9ydDogdGhpcy5wb3J0LFxuICAgICAgYWRkcmVzczogdGhpcy5hZGRyZXNzLFxuICAgICAgbWFzdGVyVXNlclNlY3JldHM6IHRoaXMubWFzdGVyVXNlclNlY3JldHMsXG4gICAgICBzdWJuZXRHcm91cDogdGhpcy5zdWJuZXRHcm91cCxcbiAgICAgIHBhcmFtZXRlckdyb3VwOiB0aGlzLnBhcmFtZXRlckdyb3VwLFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZHNTdWJuZXRHcm91cChcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBSZHNTdWJuZXRHcm91cEFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pIHtcbiAgY29uc3Qgc3VibmV0R3JvdXBDb21wb25lbnQgPSBuZXcgUmRzU3VibmV0R3JvdXBDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgc3VibmV0R3JvdXA6IHN1Ym5ldEdyb3VwQ29tcG9uZW50LnN1Ym5ldEdyb3VwLFxuICAgIHN1Ym5ldEdyb3VwTmFtZTogc3VibmV0R3JvdXBDb21wb25lbnQuc3VibmV0R3JvdXBOYW1lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmRzUGFyYW1ldGVyR3JvdXAoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogUmRzUGFyYW1ldGVyR3JvdXBBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKSB7XG4gIGNvbnN0IHBhcmFtZXRlckdyb3VwQ29tcG9uZW50ID0gbmV3IFJkc1BhcmFtZXRlckdyb3VwQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzXG4gICk7XG4gIHJldHVybiB7XG4gICAgcGFyYW1ldGVyR3JvdXA6IHBhcmFtZXRlckdyb3VwQ29tcG9uZW50LnBhcmFtZXRlckdyb3VwLFxuICAgIHBhcmFtZXRlckdyb3VwTmFtZTogcGFyYW1ldGVyR3JvdXBDb21wb25lbnQucGFyYW1ldGVyR3JvdXBOYW1lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUmRzSW5zdGFuY2UoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogUmRzSW5zdGFuY2VBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuKTogUmRzSW5zdGFuY2VSZXN1bHQge1xuICBjb25zdCByZHNDb21wb25lbnQgPSBuZXcgUmRzSW5zdGFuY2VDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7XG4gIHJldHVybiB7XG4gICAgaW5zdGFuY2U6IHJkc0NvbXBvbmVudC5pbnN0YW5jZSxcbiAgICBpbnN0YW5jZUlkOiByZHNDb21wb25lbnQuaW5zdGFuY2VJZCxcbiAgICBpbnN0YW5jZUFybjogcmRzQ29tcG9uZW50Lmluc3RhbmNlQXJuLFxuICAgIGVuZHBvaW50OiByZHNDb21wb25lbnQuZW5kcG9pbnQsXG4gICAgcG9ydDogcmRzQ29tcG9uZW50LnBvcnQsXG4gICAgYWRkcmVzczogcmRzQ29tcG9uZW50LmFkZHJlc3MsXG4gICAgbWFzdGVyVXNlclNlY3JldHM6IHJkc0NvbXBvbmVudC5tYXN0ZXJVc2VyU2VjcmV0cyxcbiAgICBzdWJuZXRHcm91cDogcmRzQ29tcG9uZW50LnN1Ym5ldEdyb3VwLFxuICAgIHBhcmFtZXRlckdyb3VwOiByZHNDb21wb25lbnQucGFyYW1ldGVyR3JvdXAsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWN1cmVSZHNJbnN0YW5jZShcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBTZWN1cmVSZHNJbnN0YW5jZUFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBSZHNJbnN0YW5jZVJlc3VsdCB7XG4gIGNvbnN0IHNlY3VyZVJkc0NvbXBvbmVudCA9IG5ldyBTZWN1cmVSZHNJbnN0YW5jZUNvbXBvbmVudChuYW1lLCBhcmdzLCBvcHRzKTtcbiAgcmV0dXJuIHtcbiAgICBpbnN0YW5jZTogc2VjdXJlUmRzQ29tcG9uZW50Lmluc3RhbmNlLFxuICAgIGluc3RhbmNlSWQ6IHNlY3VyZVJkc0NvbXBvbmVudC5pbnN0YW5jZUlkLFxuICAgIGluc3RhbmNlQXJuOiBzZWN1cmVSZHNDb21wb25lbnQuaW5zdGFuY2VBcm4sXG4gICAgZW5kcG9pbnQ6IHNlY3VyZVJkc0NvbXBvbmVudC5lbmRwb2ludCxcbiAgICBwb3J0OiBzZWN1cmVSZHNDb21wb25lbnQucG9ydCxcbiAgICBhZGRyZXNzOiBzZWN1cmVSZHNDb21wb25lbnQuYWRkcmVzcyxcbiAgICBtYXN0ZXJVc2VyU2VjcmV0czogc2VjdXJlUmRzQ29tcG9uZW50Lm1hc3RlclVzZXJTZWNyZXRzLFxuICAgIHN1Ym5ldEdyb3VwOiBzZWN1cmVSZHNDb21wb25lbnQuc3VibmV0R3JvdXAsXG4gICAgcGFyYW1ldGVyR3JvdXA6IHNlY3VyZVJkc0NvbXBvbmVudC5wYXJhbWV0ZXJHcm91cCxcbiAgfTtcbn0iXX0=