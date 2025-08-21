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
exports.ApiKeysComponent = exports.DatabaseCredentialsComponent = exports.SecretsManagerSecretVersionComponent = exports.SecretsManagerSecretComponent = void 0;
exports.createSecretsManagerSecret = createSecretsManagerSecret;
exports.createSecretsManagerSecretVersion = createSecretsManagerSecretVersion;
exports.createDatabaseCredentials = createDatabaseCredentials;
exports.createApiKeys = createApiKeys;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class SecretsManagerSecretComponent extends pulumi.ComponentResource {
    secret;
    secretArn;
    secretName;
    secretVersion;
    constructor(name, args, opts) {
        super('aws:secretsmanager:SecretsManagerSecretComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Model-Breaking',
            ...args.tags,
        };
        this.secret = new aws.secretsmanager.Secret(`${name}-secret`, {
            name: args.name,
            description: args.description || `Secret for ${args.name}`,
            kmsKeyId: args.kmsKeyId,
            recoveryWindowInDays: args.recoveryWindowInDays || 7,
            forceOverwriteReplicaSecret: args.forceOverwriteReplicaSecret ?? false,
            replicas: args.replica,
            tags: defaultTags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
        );
        this.secretArn = this.secret.arn;
        this.secretName = this.secret.name;
        this.registerOutputs({
            secret: this.secret,
            secretArn: this.secretArn,
            secretName: this.secretName,
        });
    }
}
exports.SecretsManagerSecretComponent = SecretsManagerSecretComponent;
class SecretsManagerSecretVersionComponent extends pulumi.ComponentResource {
    secretVersion;
    constructor(name, args, opts) {
        super('aws:secretsmanager:SecretsManagerSecretVersionComponent', name, {}, opts);
        this.secretVersion = new aws.secretsmanager.SecretVersion(`${name}-version`, {
            secretId: args.secretId,
            secretString: args.secretString,
            secretBinary: args.secretBinary,
            versionStages: args.versionStages || ['AWSCURRENT'],
        }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
        );
        this.registerOutputs({
            secretVersion: this.secretVersion,
        });
    }
}
exports.SecretsManagerSecretVersionComponent = SecretsManagerSecretVersionComponent;
class DatabaseCredentialsComponent extends pulumi.ComponentResource {
    secret;
    secretVersion;
    secretArn;
    secretName;
    constructor(name, args, opts) {
        super('aws:secretsmanager:DatabaseCredentialsComponent', name, {}, opts);
        // Create the secret
        const secretComponent = new SecretsManagerSecretComponent(name, {
            name: `/app/${args.name}/database/credentials`,
            description: `Database credentials for ${args.name}`,
            kmsKeyId: args.kmsKeyId,
            tags: args.tags,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
        );
        this.secret = secretComponent.secret;
        this.secretArn = secretComponent.secretArn;
        this.secretName = secretComponent.secretName;
        // Create secret version with database credentials JSON
        const secretString = pulumi
            .all([args.username, args.password, args.host, args.port, args.dbname])
            .apply(([username, password, host, port, dbname]) => JSON.stringify({
            username: username,
            password: password,
            host: host,
            port: parseInt(port.toString()),
            dbname: dbname,
            engine: args.engine || 'mysql',
        }));
        const secretVersionComponent = new SecretsManagerSecretVersionComponent(`${name}-version`, {
            secretId: this.secret.id,
            secretString: secretString,
        }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
        );
        this.secretVersion = secretVersionComponent.secretVersion;
        this.registerOutputs({
            secret: this.secret,
            secretVersion: this.secretVersion,
            secretArn: this.secretArn,
            secretName: this.secretName,
        });
    }
}
exports.DatabaseCredentialsComponent = DatabaseCredentialsComponent;
class ApiKeysComponent extends pulumi.ComponentResource {
    secrets;
    constructor(name, args, opts) {
        super('aws:secretsmanager:ApiKeysComponent', name, {}, opts);
        this.secrets = {};
        Object.entries(args.apiKeys).forEach(([keyName, keyValue]) => {
            const secretComponent = new SecretsManagerSecretComponent(`${name}-${keyName}`, {
                name: `/app/${args.name}/api-keys/${keyName}`,
                description: `API key ${keyName} for ${args.name}`,
                kmsKeyId: args.kmsKeyId,
                tags: args.tags,
            }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
            );
            const secretVersionComponent = new SecretsManagerSecretVersionComponent(`${name}-${keyName}-version`, {
                secretId: secretComponent.secret.id,
                secretString: keyValue,
            }, { parent: this, provider: opts?.provider } // ← FIXED: Added provider
            );
            this.secrets[keyName] = {
                secret: secretComponent.secret,
                secretArn: secretComponent.secretArn,
                secretName: secretComponent.secretName,
                secretVersion: secretVersionComponent.secretVersion,
            };
        });
        this.registerOutputs({
            secrets: this.secrets,
        });
    }
}
exports.ApiKeysComponent = ApiKeysComponent;
function createSecretsManagerSecret(name, args, opts // ← FIXED: Added third parameter
) {
    const secretComponent = new SecretsManagerSecretComponent(name, args, opts); // ← FIXED: Pass opts through
    return {
        secret: secretComponent.secret,
        secretArn: secretComponent.secretArn,
        secretName: secretComponent.secretName,
        secretVersion: secretComponent.secretVersion,
    };
}
function createSecretsManagerSecretVersion(name, args, opts // ← FIXED: Added third parameter
) {
    const secretVersionComponent = new SecretsManagerSecretVersionComponent(name, args, opts // ← FIXED: Pass opts through
    );
    return secretVersionComponent.secretVersion;
}
function createDatabaseCredentials(name, args, opts // ← FIXED: Added third parameter
) {
    const databaseCredentialsComponent = new DatabaseCredentialsComponent(name, args, opts // ← FIXED: Pass opts through
    );
    return {
        secret: databaseCredentialsComponent.secret,
        secretVersion: databaseCredentialsComponent.secretVersion,
        secretArn: databaseCredentialsComponent.secretArn,
        secretName: databaseCredentialsComponent.secretName,
    };
}
function createApiKeys(name, args, opts) {
    const apiKeysComponent = new ApiKeysComponent(name, args, opts);
    return {
        secrets: apiKeysComponent.secrets,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0c01hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWNyZXRzTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF3UEEsZ0VBWUM7QUFFRCw4RUFXQztBQUVELDhEQWdCQztBQUVELHNDQVNDO0FBOVNELHVEQUF5QztBQUN6QyxpREFBbUM7QUEyRG5DLE1BQWEsNkJBQThCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN6RCxNQUFNLENBQTRCO0lBQ2xDLFNBQVMsQ0FBd0I7SUFDakMsVUFBVSxDQUF3QjtJQUNsQyxhQUFhLENBQW9DO0lBRWpFLFlBQ0UsSUFBWSxFQUNaLElBQThCLEVBQzlCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyxrREFBa0QsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTFFLE1BQU0sV0FBVyxHQUFHO1lBQ2xCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSxvQkFBb0I7WUFDN0IsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNiLENBQUM7UUFFRixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQ3pDLEdBQUcsSUFBSSxTQUFTLEVBQ2hCO1lBQ0UsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLElBQUksY0FBYyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQzFELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixvQkFBb0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLElBQUksQ0FBQztZQUNwRCwyQkFBMkIsRUFBRSxJQUFJLENBQUMsMkJBQTJCLElBQUksS0FBSztZQUN0RSxRQUFR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Q0osQ0FBQztBQUVELFNBQWdCLGFBQWEsQ0FDM0IsSUFBWSxFQUNaLElBQWlCLEVBQ2pCLElBQXNDO0lBRXRDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2hFLE9BQU87UUFDTCxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsT0FBTztLQUNsQyxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3JldHNNYW5hZ2VyU2VjcmV0QXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgZGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHJlY292ZXJ5V2luZG93SW5EYXlzPzogbnVtYmVyO1xuICBmb3JjZU92ZXJ3cml0ZVJlcGxpY2FTZWNyZXQ/OiBib29sZWFuO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgcmVwbGljYT86IEFycmF5PHtcbiAgICByZWdpb246IHN0cmluZztcbiAgICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB9Pjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWNyZXRzTWFuYWdlclNlY3JldFZlcnNpb25BcmdzIHtcbiAgc2VjcmV0SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBzZWNyZXRTdHJpbmc/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgc2VjcmV0QmluYXJ5PzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHZlcnNpb25TdGFnZXM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWNyZXRzTWFuYWdlclNlY3JldFJlc3VsdCB7XG4gIHNlY3JldDogYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldDtcbiAgc2VjcmV0QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHNlY3JldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgc2VjcmV0VmVyc2lvbj86IGF3cy5zZWNyZXRzbWFuYWdlci5TZWNyZXRWZXJzaW9uO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlQ3JlZGVudGlhbHNBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICB1c2VybmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHBhc3N3b3JkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgaG9zdDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHBvcnQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBkYm5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBlbmdpbmU/OiBzdHJpbmc7XG4gIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFiYXNlQ3JlZGVudGlhbHNSZXN1bHQge1xuICBzZWNyZXQ6IGF3cy5zZWNyZXRzbWFuYWdlci5TZWNyZXQ7XG4gIHNlY3JldFZlcnNpb246IGF3cy5zZWNyZXRzbWFuYWdlci5TZWNyZXRWZXJzaW9uO1xuICBzZWNyZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgc2VjcmV0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFwaUtleXNBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBhcGlLZXlzOiBSZWNvcmQ8c3RyaW5nLCBwdWx1bWkuSW5wdXQ8c3RyaW5nPj47XG4gIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFwaUtleXNSZXN1bHQge1xuICBzZWNyZXRzOiBSZWNvcmQ8c3RyaW5nLCBTZWNyZXRzTWFuYWdlclNlY3JldFJlc3VsdD47XG59XG5cbmV4cG9ydCBjbGFzcyBTZWNyZXRzTWFuYWdlclNlY3JldENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBzZWNyZXQ6IGF3cy5zZWNyZXRzbWFuYWdlci5TZWNyZXQ7XG4gIHB1YmxpYyByZWFkb25seSBzZWNyZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHNlY3JldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHNlY3JldFZlcnNpb24/OiBhd3Muc2VjcmV0c21hbmFnZXIuU2VjcmV0VmVyc2lvbjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogU2VjcmV0c01hbmFnZXJTZWNyZXRBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdhd3M6c2VjcmV0c21hbmFnZXI6U2VjcmV0c01hbmFnZXJTZWNyZXRDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgIE1hbmFnZWRCeTogJ1B1bHVtaScsXG4gICAgICBQcm9qZWN0OiAnQVdTLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgdGhpcy5zZWNyZXQgPSBuZXcgYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldChcbiAgICAgIGAke25hbWV9LXNlY3JldGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgZGVzY3JpcHRpb246IGFyZ3MuZGVzY3JpcHRpb24gfHwgYFNlY3JldCBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIHJlY292ZXJ5V2luZG93SW5EYXlzOiBhcmdzLnJlY292ZXJ5V2luZG93SW5EYXlzIHx8IDcsXG4gICAgICAgIGZvcmNlT3ZlcndyaXRlUmVwbGljYVNlY3JldDogYXJncy5mb3JjZU92ZXJ3cml0ZVJlcGxpY2FTZWNyZXQgPz8gZmFsc2UsXG4gICAgICAgIHJlcGxpY2FzOiBhcmdzLnJlcGxpY2EsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfSAvLyDihpAgRklYRUQ6IEFkZGVkIHByb3ZpZGVyXG4gICAgKTtcblxuICAgIHRoaXMuc2VjcmV0QXJuID0gdGhpcy5zZWNyZXQuYXJuO1xuICAgIHRoaXMuc2VjcmV0TmFtZSA9IHRoaXMuc2VjcmV0Lm5hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBzZWNyZXQ6IHRoaXMuc2VjcmV0LFxuICAgICAgc2VjcmV0QXJuOiB0aGlzLnNlY3JldEFybixcbiAgICAgIHNlY3JldE5hbWU6IHRoaXMuc2VjcmV0TmFtZSxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2VjcmV0c01hbmFnZXJTZWNyZXRWZXJzaW9uQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHNlY3JldFZlcnNpb246IGF3cy5zZWNyZXRzbWFuYWdlci5TZWNyZXRWZXJzaW9uO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBTZWNyZXRzTWFuYWdlclNlY3JldFZlcnNpb25BcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKFxuICAgICAgJ2F3czpzZWNyZXRzbWFuYWdlcjpTZWNyZXRzTWFuYWdlclNlY3JldFZlcnNpb25Db21wb25lbnQnLFxuICAgICAgbmFtZSxcbiAgICAgIHt9LFxuICAgICAgb3B0c1xuICAgICk7XG5cbiAgICB0aGlzLnNlY3JldFZlcnNpb24gPSBuZXcgYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldFZlcnNpb24oXG4gICAgICBgJHtuYW1lfS12ZXJzaW9uYCxcbiAgICAgIHtcbiAgICAgICAgc2VjcmV0SWQ6IGFyZ3Muc2VjcmV0SWQsXG4gICAgICAgIHNlY3JldFN0cmluZzogYXJncy5zZWNyZXRTdHJpbmcsXG4gICAgICAgIHNlY3JldEJpbmFyeTogYXJncy5zZWNyZXRCaW5hcnksXG4gICAgICAgIHZlcnNpb25TdGFnZXM6IGFyZ3MudmVyc2lvblN0YWdlcyB8fCBbJ0FXU0NVUlJFTlQnXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgcHJvdmlkZXI6IG9wdHM/LnByb3ZpZGVyIH0gLy8g4oaQIEZJWEVEOiBBZGRlZCBwcm92aWRlclxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBzZWNyZXRWZXJzaW9uOiB0aGlzLnNlY3JldFZlcnNpb24sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlQ3JlZGVudGlhbHNDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgc2VjcmV0OiBhd3Muc2VjcmV0c21hbmFnZXIuU2VjcmV0O1xuICBwdWJsaWMgcmVhZG9ubHkgc2VjcmV0VmVyc2lvbjogYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldFZlcnNpb247XG4gIHB1YmxpYyByZWFkb25seSBzZWNyZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHNlY3JldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRGF0YWJhc2VDcmVkZW50aWFsc0FyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpzZWNyZXRzbWFuYWdlcjpEYXRhYmFzZUNyZWRlbnRpYWxzQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBzZWNyZXRcbiAgICBjb25zdCBzZWNyZXRDb21wb25lbnQgPSBuZXcgU2VjcmV0c01hbmFnZXJTZWNyZXRDb21wb25lbnQoXG4gICAgICBuYW1lLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgL2FwcC8ke2FyZ3MubmFtZX0vZGF0YWJhc2UvY3JlZGVudGlhbHNgLFxuICAgICAgICBkZXNjcmlwdGlvbjogYERhdGFiYXNlIGNyZWRlbnRpYWxzIGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgdGFnczogYXJncy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfSAvLyDihpAgRklYRUQ6IEFkZGVkIHByb3ZpZGVyXG4gICAgKTtcblxuICAgIHRoaXMuc2VjcmV0ID0gc2VjcmV0Q29tcG9uZW50LnNlY3JldDtcbiAgICB0aGlzLnNlY3JldEFybiA9IHNlY3JldENvbXBvbmVudC5zZWNyZXRBcm47XG4gICAgdGhpcy5zZWNyZXROYW1lID0gc2VjcmV0Q29tcG9uZW50LnNlY3JldE5hbWU7XG5cbiAgICAvLyBDcmVhdGUgc2VjcmV0IHZlcnNpb24gd2l0aCBkYXRhYmFzZSBjcmVkZW50aWFscyBKU09OXG4gICAgY29uc3Qgc2VjcmV0U3RyaW5nID0gcHVsdW1pXG4gICAgICAuYWxsKFthcmdzLnVzZXJuYW1lLCBhcmdzLnBhc3N3b3JkLCBhcmdzLmhvc3QsIGFyZ3MucG9ydCwgYXJncy5kYm5hbWVdKVxuICAgICAgLmFwcGx5KChbdXNlcm5hbWUsIHBhc3N3b3JkLCBob3N0LCBwb3J0LCBkYm5hbWVdKSA9PlxuICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgdXNlcm5hbWU6IHVzZXJuYW1lLFxuICAgICAgICAgIHBhc3N3b3JkOiBwYXNzd29yZCxcbiAgICAgICAgICBob3N0OiBob3N0LFxuICAgICAgICAgIHBvcnQ6IHBhcnNlSW50KHBvcnQudG9TdHJpbmcoKSksXG4gICAgICAgICAgZGJuYW1lOiBkYm5hbWUsXG4gICAgICAgICAgZW5naW5lOiBhcmdzLmVuZ2luZSB8fCAnbXlzcWwnLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgIGNvbnN0IHNlY3JldFZlcnNpb25Db21wb25lbnQgPSBuZXcgU2VjcmV0c01hbmFnZXJTZWNyZXRWZXJzaW9uQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tdmVyc2lvbmAsXG4gICAgICB7XG4gICAgICAgIHNlY3JldElkOiB0aGlzLnNlY3JldC5pZCxcbiAgICAgICAgc2VjcmV0U3RyaW5nOiBzZWNyZXRTdHJpbmcsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIHByb3ZpZGVyOiBvcHRzPy5wcm92aWRlciB9IC8vIOKGkCBGSVhFRDogQWRkZWQgcHJvdmlkZXJcbiAgICApO1xuXG4gICAgdGhpcy5zZWNyZXRWZXJzaW9uID0gc2VjcmV0VmVyc2lvbkNvbXBvbmVudC5zZWNyZXRWZXJzaW9uO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgc2VjcmV0OiB0aGlzLnNlY3JldCxcbiAgICAgIHNlY3JldFZlcnNpb246IHRoaXMuc2VjcmV0VmVyc2lvbixcbiAgICAgIHNlY3JldEFybjogdGhpcy5zZWNyZXRBcm4sXG4gICAgICBzZWNyZXROYW1lOiB0aGlzLnNlY3JldE5hbWUsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFwaUtleXNDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgc2VjcmV0czogUmVjb3JkPHN0cmluZywgU2VjcmV0c01hbmFnZXJTZWNyZXRSZXN1bHQ+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBBcGlLZXlzQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOnNlY3JldHNtYW5hZ2VyOkFwaUtleXNDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICB0aGlzLnNlY3JldHMgPSB7fTtcblxuICAgIE9iamVjdC5lbnRyaWVzKGFyZ3MuYXBpS2V5cykuZm9yRWFjaCgoW2tleU5hbWUsIGtleVZhbHVlXSkgPT4ge1xuICAgICAgY29uc3Qgc2VjcmV0Q29tcG9uZW50ID0gbmV3IFNlY3JldHNNYW5hZ2VyU2VjcmV0Q29tcG9uZW50KFxuICAgICAgICBgJHtuYW1lfS0ke2tleU5hbWV9YCxcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IGAvYXBwLyR7YXJncy5uYW1lfS9hcGkta2V5cy8ke2tleU5hbWV9YCxcbiAgICAgICAgICBkZXNjcmlwdGlvbjogYEFQSSBrZXkgJHtrZXlOYW1lfSBmb3IgJHthcmdzLm5hbWV9YCxcbiAgICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfSAvLyDihpAgRklYRUQ6IEFkZGVkIHByb3ZpZGVyXG4gICAgICApO1xuXG4gICAgICBjb25zdCBzZWNyZXRWZXJzaW9uQ29tcG9uZW50ID0gbmV3IFNlY3JldHNNYW5hZ2VyU2VjcmV0VmVyc2lvbkNvbXBvbmVudChcbiAgICAgICAgYCR7bmFtZX0tJHtrZXlOYW1lfS12ZXJzaW9uYCxcbiAgICAgICAge1xuICAgICAgICAgIHNlY3JldElkOiBzZWNyZXRDb21wb25lbnQuc2VjcmV0LmlkLFxuICAgICAgICAgIHNlY3JldFN0cmluZzoga2V5VmFsdWUsXG4gICAgICAgIH0sXG4gICAgICAgIHsgcGFyZW50OiB0aGlzLCBwcm92aWRlcjogb3B0cz8ucHJvdmlkZXIgfSAvLyDihpAgRklYRUQ6IEFkZGVkIHByb3ZpZGVyXG4gICAgICApO1xuXG4gICAgICB0aGlzLnNlY3JldHNba2V5TmFtZV0gPSB7XG4gICAgICAgIHNlY3JldDogc2VjcmV0Q29tcG9uZW50LnNlY3JldCxcbiAgICAgICAgc2VjcmV0QXJuOiBzZWNyZXRDb21wb25lbnQuc2VjcmV0QXJuLFxuICAgICAgICBzZWNyZXROYW1lOiBzZWNyZXRDb21wb25lbnQuc2VjcmV0TmFtZSxcbiAgICAgICAgc2VjcmV0VmVyc2lvbjogc2VjcmV0VmVyc2lvbkNvbXBvbmVudC5zZWNyZXRWZXJzaW9uLFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHNlY3JldHM6IHRoaXMuc2VjcmV0cyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VjcmV0c01hbmFnZXJTZWNyZXQoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogU2VjcmV0c01hbmFnZXJTZWNyZXRBcmdzLFxuICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucyAvLyDihpAgRklYRUQ6IEFkZGVkIHRoaXJkIHBhcmFtZXRlclxuKTogU2VjcmV0c01hbmFnZXJTZWNyZXRSZXN1bHQge1xuICBjb25zdCBzZWNyZXRDb21wb25lbnQgPSBuZXcgU2VjcmV0c01hbmFnZXJTZWNyZXRDb21wb25lbnQobmFtZSwgYXJncywgb3B0cyk7IC8vIOKGkCBGSVhFRDogUGFzcyBvcHRzIHRocm91Z2hcbiAgcmV0dXJuIHtcbiAgICBzZWNyZXQ6IHNlY3JldENvbXBvbmVudC5zZWNyZXQsXG4gICAgc2VjcmV0QXJuOiBzZWNyZXRDb21wb25lbnQuc2VjcmV0QXJuLFxuICAgIHNlY3JldE5hbWU6IHNlY3JldENvbXBvbmVudC5zZWNyZXROYW1lLFxuICAgIHNlY3JldFZlcnNpb246IHNlY3JldENvbXBvbmVudC5zZWNyZXRWZXJzaW9uLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VjcmV0c01hbmFnZXJTZWNyZXRWZXJzaW9uKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IFNlY3JldHNNYW5hZ2VyU2VjcmV0VmVyc2lvbkFyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zIC8vIOKGkCBGSVhFRDogQWRkZWQgdGhpcmQgcGFyYW1ldGVyXG4pOiBhd3Muc2VjcmV0c21hbmFnZXIuU2VjcmV0VmVyc2lvbiB7XG4gIGNvbnN0IHNlY3JldFZlcnNpb25Db21wb25lbnQgPSBuZXcgU2VjcmV0c01hbmFnZXJTZWNyZXRWZXJzaW9uQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzIC8vIOKGkCBGSVhFRDogUGFzcyBvcHRzIHRocm91Z2hcbiAgKTtcbiAgcmV0dXJuIHNlY3JldFZlcnNpb25Db21wb25lbnQuc2VjcmV0VmVyc2lvbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURhdGFiYXNlQ3JlZGVudGlhbHMoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogRGF0YWJhc2VDcmVkZW50aWFsc0FyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zIC8vIOKGkCBGSVhFRDogQWRkZWQgdGhpcmQgcGFyYW1ldGVyXG4pOiBEYXRhYmFzZUNyZWRlbnRpYWxzUmVzdWx0IHtcbiAgY29uc3QgZGF0YWJhc2VDcmVkZW50aWFsc0NvbXBvbmVudCA9IG5ldyBEYXRhYmFzZUNyZWRlbnRpYWxzQ29tcG9uZW50KFxuICAgIG5hbWUsXG4gICAgYXJncyxcbiAgICBvcHRzIC8vIOKGkCBGSVhFRDogUGFzcyBvcHRzIHRocm91Z2hcbiAgKTtcbiAgcmV0dXJuIHtcbiAgICBzZWNyZXQ6IGRhdGFiYXNlQ3JlZGVudGlhbHNDb21wb25lbnQuc2VjcmV0LFxuICAgIHNlY3JldFZlcnNpb246IGRhdGFiYXNlQ3JlZGVudGlhbHNDb21wb25lbnQuc2VjcmV0VmVyc2lvbixcbiAgICBzZWNyZXRBcm46IGRhdGFiYXNlQ3JlZGVudGlhbHNDb21wb25lbnQuc2VjcmV0QXJuLFxuICAgIHNlY3JldE5hbWU6IGRhdGFiYXNlQ3JlZGVudGlhbHNDb21wb25lbnQuc2VjcmV0TmFtZSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFwaUtleXMoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogQXBpS2V5c0FyZ3MsXG4gIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4pOiBBcGlLZXlzUmVzdWx0IHtcbiAgY29uc3QgYXBpS2V5c0NvbXBvbmVudCA9IG5ldyBBcGlLZXlzQ29tcG9uZW50KG5hbWUsIGFyZ3MsIG9wdHMpO1xuICByZXR1cm4ge1xuICAgIHNlY3JldHM6IGFwaUtleXNDb21wb25lbnQuc2VjcmV0cyxcbiAgfTtcbn1cbiJdfQ==