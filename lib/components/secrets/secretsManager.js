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
        super("aws:secretsmanager:SecretsManagerSecretComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Model-Breaking",
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
        }, { parent: this });
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
        super("aws:secretsmanager:SecretsManagerSecretVersionComponent", name, {}, opts);
        this.secretVersion = new aws.secretsmanager.SecretVersion(`${name}-version`, {
            secretId: args.secretId,
            secretString: args.secretString,
            secretBinary: args.secretBinary,
            versionStages: args.versionStages || ["AWSCURRENT"],
        }, { parent: this });
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
        super("aws:secretsmanager:DatabaseCredentialsComponent", name, {}, opts);
        // Create the secret
        const secretComponent = new SecretsManagerSecretComponent(name, {
            name: `/app/${args.name}/database/credentials`,
            description: `Database credentials for ${args.name}`,
            kmsKeyId: args.kmsKeyId,
            tags: args.tags,
        }, { parent: this });
        this.secret = secretComponent.secret;
        this.secretArn = secretComponent.secretArn;
        this.secretName = secretComponent.secretName;
        // Create secret version with database credentials JSON
        const secretString = pulumi.all([
            args.username,
            args.password,
            args.host,
            args.port,
            args.dbname
        ]).apply(([username, password, host, port, dbname]) => JSON.stringify({
            username: username,
            password: password,
            host: host,
            port: parseInt(port.toString()),
            dbname: dbname,
            engine: args.engine || "mysql",
        }));
        const secretVersionComponent = new SecretsManagerSecretVersionComponent(`${name}-version`, {
            secretId: this.secret.id,
            secretString: secretString,
        }, { parent: this });
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
        super("aws:secretsmanager:ApiKeysComponent", name, {}, opts);
        this.secrets = {};
        Object.entries(args.apiKeys).forEach(([keyName, keyValue]) => {
            const secretComponent = new SecretsManagerSecretComponent(`${name}-${keyName}`, {
                name: `/app/${args.name}/api-keys/${keyName}`,
                description: `API key ${keyName} for ${args.name}`,
                kmsKeyId: args.kmsKeyId,
                tags: args.tags,
            }, { parent: this });
            const secretVersionComponent = new SecretsManagerSecretVersionComponent(`${name}-${keyName}-version`, {
                secretId: secretComponent.secret.id,
                secretString: keyValue,
            }, { parent: this });
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
function createSecretsManagerSecret(name, args) {
    const secretComponent = new SecretsManagerSecretComponent(name, args);
    return {
        secret: secretComponent.secret,
        secretArn: secretComponent.secretArn,
        secretName: secretComponent.secretName,
        secretVersion: secretComponent.secretVersion,
    };
}
function createSecretsManagerSecretVersion(name, args) {
    const secretVersionComponent = new SecretsManagerSecretVersionComponent(name, args);
    return secretVersionComponent.secretVersion;
}
function createDatabaseCredentials(name, args) {
    const databaseCredentialsComponent = new DatabaseCredentialsComponent(name, args);
    return {
        secret: databaseCredentialsComponent.secret,
        secretVersion: databaseCredentialsComponent.secretVersion,
        secretArn: databaseCredentialsComponent.secretArn,
        secretName: databaseCredentialsComponent.secretName,
    };
}
function createApiKeys(name, args) {
    const apiKeysComponent = new ApiKeysComponent(name, args);
    return {
        secrets: apiKeysComponent.secrets,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0c01hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZWNyZXRzTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE2TUEsZ0VBUUM7QUFFRCw4RUFHQztBQUVELDhEQVFDO0FBRUQsc0NBS0M7QUEzT0QsdURBQXlDO0FBQ3pDLGlEQUFtQztBQTJEbkMsTUFBYSw2QkFBOEIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3ZELE1BQU0sQ0FBNEI7SUFDbEMsU0FBUyxDQUF3QjtJQUNqQyxVQUFVLENBQXdCO0lBQ2xDLGFBQWEsQ0FBb0M7SUFFakUsWUFBWSxJQUFZLEVBQUUsSUFBOEIsRUFBRSxJQUFzQztRQUM1RixLQUFLLENBQUMsa0RBQWtELEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUxRSxNQUFNLFdBQVcsR0FBRztZQUNoQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUM5QixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUsb0JBQW9CO1lBQzdCLEdBQUcsSUFBSSxDQUFDLElBQUk7U0FDZixDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxTQUFTLEVBQUU7WUFDMUQsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXLElBQUksY0FBYyxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQzFELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixvQkFBb0IsRUFBRSxJQUFJLENBQUMsb0JBQW9CLElBQUksQ0FBQztZQUNwRCwyQkFBMkIsRUFBRSxJQUFJLENBQUMsMkJBQTJCLElBQUksS0FBSztZQUN0RSxRQUFRLEVB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O1FBQ3BDLFVBQVUsRUFBRSxlQUFlLENBQUMsVUFBVTtRQUN0QyxhQUFhLEVBQUUsZUFBZSxDQUFDLGFBQWE7S0FDL0MsQ0FBQztBQUNOLENBQUM7QUFFRCxTQUFnQixpQ0FBaUMsQ0FBQyxJQUFZLEVBQUUsSUFBcUM7SUFDakcsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLG9DQUFvQyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNwRixPQUFPLHNCQUFzQixDQUFDLGFBQWEsQ0FBQztBQUNoRCxDQUFDO0FBRUQsU0FBZ0IseUJBQXlCLENBQUMsSUFBWSxFQUFFLElBQTZCO0lBQ2pGLE1BQU0sNEJBQTRCLEdBQUcsSUFBSSw0QkFBNEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDbEYsT0FBTztRQUNILE1BQU0sRUFBRSw0QkFBNEIsQ0FBQyxNQUFNO1FBQzNDLGFBQWEsRUFBRSw0QkFBNEIsQ0FBQyxhQUFhO1FBQ3pELFNBQVMsRUFBRSw0QkFBNEIsQ0FBQyxTQUFTO1FBQ2pELFVBQVUsRUFBRSw0QkFBNEIsQ0FBQyxVQUFVO0tBQ3RELENBQUM7QUFDTixDQUFDO0FBRUQsU0FBZ0IsYUFBYSxDQUFDLElBQVksRUFBRSxJQUFpQjtJQUN6RCxNQUFNLGdCQUFnQixHQUFHLElBQUksZ0JBQWdCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFELE9BQU87UUFDSCxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsT0FBTztLQUNwQyxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBTZWNyZXRzTWFuYWdlclNlY3JldEFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHJlY292ZXJ5V2luZG93SW5EYXlzPzogbnVtYmVyO1xuICAgIGZvcmNlT3ZlcndyaXRlUmVwbGljYVNlY3JldD86IGJvb2xlYW47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gICAgcmVwbGljYT86IEFycmF5PHtcbiAgICAgICAgcmVnaW9uOiBzdHJpbmc7XG4gICAgICAgIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgfT47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjcmV0c01hbmFnZXJTZWNyZXRWZXJzaW9uQXJncyB7XG4gICAgc2VjcmV0SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHNlY3JldFN0cmluZz86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHNlY3JldEJpbmFyeT86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHZlcnNpb25TdGFnZXM/OiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZWNyZXRzTWFuYWdlclNlY3JldFJlc3VsdCB7XG4gICAgc2VjcmV0OiBhd3Muc2VjcmV0c21hbmFnZXIuU2VjcmV0O1xuICAgIHNlY3JldEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHNlY3JldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBzZWNyZXRWZXJzaW9uPzogYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldFZlcnNpb247XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YWJhc2VDcmVkZW50aWFsc0FyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICB1c2VybmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgcGFzc3dvcmQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGhvc3Q6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHBvcnQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIGRibmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgZW5naW5lPzogc3RyaW5nO1xuICAgIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGF0YWJhc2VDcmVkZW50aWFsc1Jlc3VsdCB7XG4gICAgc2VjcmV0OiBhd3Muc2VjcmV0c21hbmFnZXIuU2VjcmV0O1xuICAgIHNlY3JldFZlcnNpb246IGF3cy5zZWNyZXRzbWFuYWdlci5TZWNyZXRWZXJzaW9uO1xuICAgIHNlY3JldEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHNlY3JldE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcGlLZXlzQXJncyB7XG4gICAgbmFtZTogc3RyaW5nO1xuICAgIGFwaUtleXM6IFJlY29yZDxzdHJpbmcsIHB1bHVtaS5JbnB1dDxzdHJpbmc+PjtcbiAgICBrbXNLZXlJZD86IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEFwaUtleXNSZXN1bHQge1xuICAgIHNlY3JldHM6IFJlY29yZDxzdHJpbmcsIFNlY3JldHNNYW5hZ2VyU2VjcmV0UmVzdWx0Pjtcbn1cblxuZXhwb3J0IGNsYXNzIFNlY3JldHNNYW5hZ2VyU2VjcmV0Q29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VjcmV0OiBhd3Muc2VjcmV0c21hbmFnZXIuU2VjcmV0O1xuICAgIHB1YmxpYyByZWFkb25seSBzZWNyZXRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VjcmV0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBzZWNyZXRWZXJzaW9uPzogYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldFZlcnNpb247XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFNlY3JldHNNYW5hZ2VyU2VjcmV0QXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6c2VjcmV0c21hbmFnZXI6U2VjcmV0c01hbmFnZXJTZWNyZXRDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgICAgICAgTWFuYWdlZEJ5OiBcIlB1bHVtaVwiLFxuICAgICAgICAgICAgUHJvamVjdDogXCJBV1MtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNlY3JldCA9IG5ldyBhd3Muc2VjcmV0c21hbmFnZXIuU2VjcmV0KGAke25hbWV9LXNlY3JldGAsIHtcbiAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uIHx8IGBTZWNyZXQgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIHJlY292ZXJ5V2luZG93SW5EYXlzOiBhcmdzLnJlY292ZXJ5V2luZG93SW5EYXlzIHx8IDcsXG4gICAgICAgICAgICBmb3JjZU92ZXJ3cml0ZVJlcGxpY2FTZWNyZXQ6IGFyZ3MuZm9yY2VPdmVyd3JpdGVSZXBsaWNhU2VjcmV0ID8/IGZhbHNlLFxuICAgICAgICAgICAgcmVwbGljYXM6IGFyZ3MucmVwbGljYSxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnNlY3JldEFybiA9IHRoaXMuc2VjcmV0LmFybjtcbiAgICAgICAgdGhpcy5zZWNyZXROYW1lID0gdGhpcy5zZWNyZXQubmFtZTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBzZWNyZXQ6IHRoaXMuc2VjcmV0LFxuICAgICAgICAgICAgc2VjcmV0QXJuOiB0aGlzLnNlY3JldEFybixcbiAgICAgICAgICAgIHNlY3JldE5hbWU6IHRoaXMuc2VjcmV0TmFtZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2VjcmV0c01hbmFnZXJTZWNyZXRWZXJzaW9uQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VjcmV0VmVyc2lvbjogYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldFZlcnNpb247XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFNlY3JldHNNYW5hZ2VyU2VjcmV0VmVyc2lvbkFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnNlY3JldHNtYW5hZ2VyOlNlY3JldHNNYW5hZ2VyU2VjcmV0VmVyc2lvbkNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgdGhpcy5zZWNyZXRWZXJzaW9uID0gbmV3IGF3cy5zZWNyZXRzbWFuYWdlci5TZWNyZXRWZXJzaW9uKGAke25hbWV9LXZlcnNpb25gLCB7XG4gICAgICAgICAgICBzZWNyZXRJZDogYXJncy5zZWNyZXRJZCxcbiAgICAgICAgICAgIHNlY3JldFN0cmluZzogYXJncy5zZWNyZXRTdHJpbmcsXG4gICAgICAgICAgICBzZWNyZXRCaW5hcnk6IGFyZ3Muc2VjcmV0QmluYXJ5LFxuICAgICAgICAgICAgdmVyc2lvblN0YWdlczogYXJncy52ZXJzaW9uU3RhZ2VzIHx8IFtcIkFXU0NVUlJFTlRcIl0sXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIHNlY3JldFZlcnNpb246IHRoaXMuc2VjcmV0VmVyc2lvbixcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGF0YWJhc2VDcmVkZW50aWFsc0NvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHNlY3JldDogYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VjcmV0VmVyc2lvbjogYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldFZlcnNpb247XG4gICAgcHVibGljIHJlYWRvbmx5IHNlY3JldEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICAgIHB1YmxpYyByZWFkb25seSBzZWNyZXROYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IERhdGFiYXNlQ3JlZGVudGlhbHNBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpzZWNyZXRzbWFuYWdlcjpEYXRhYmFzZUNyZWRlbnRpYWxzQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICAvLyBDcmVhdGUgdGhlIHNlY3JldFxuICAgICAgICBjb25zdCBzZWNyZXRDb21wb25lbnQgPSBuZXcgU2VjcmV0c01hbmFnZXJTZWNyZXRDb21wb25lbnQobmFtZSwge1xuICAgICAgICAgICAgbmFtZTogYC9hcHAvJHthcmdzLm5hbWV9L2RhdGFiYXNlL2NyZWRlbnRpYWxzYCxcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgRGF0YWJhc2UgY3JlZGVudGlhbHMgZm9yICR7YXJncy5uYW1lfWAsXG4gICAgICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5zZWNyZXQgPSBzZWNyZXRDb21wb25lbnQuc2VjcmV0O1xuICAgICAgICB0aGlzLnNlY3JldEFybiA9IHNlY3JldENvbXBvbmVudC5zZWNyZXRBcm47XG4gICAgICAgIHRoaXMuc2VjcmV0TmFtZSA9IHNlY3JldENvbXBvbmVudC5zZWNyZXROYW1lO1xuXG4gICAgICAgIC8vIENyZWF0ZSBzZWNyZXQgdmVyc2lvbiB3aXRoIGRhdGFiYXNlIGNyZWRlbnRpYWxzIEpTT05cbiAgICAgICAgY29uc3Qgc2VjcmV0U3RyaW5nID0gcHVsdW1pLmFsbChbXG4gICAgICAgICAgICBhcmdzLnVzZXJuYW1lLFxuICAgICAgICAgICAgYXJncy5wYXNzd29yZCxcbiAgICAgICAgICAgIGFyZ3MuaG9zdCxcbiAgICAgICAgICAgIGFyZ3MucG9ydCxcbiAgICAgICAgICAgIGFyZ3MuZGJuYW1lXG4gICAgICAgIF0pLmFwcGx5KChbdXNlcm5hbWUsIHBhc3N3b3JkLCBob3N0LCBwb3J0LCBkYm5hbWVdKSA9PiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICB1c2VybmFtZTogdXNlcm5hbWUsXG4gICAgICAgICAgICBwYXNzd29yZDogcGFzc3dvcmQsXG4gICAgICAgICAgICBob3N0OiBob3N0LFxuICAgICAgICAgICAgcG9ydDogcGFyc2VJbnQocG9ydC50b1N0cmluZygpKSxcbiAgICAgICAgICAgIGRibmFtZTogZGJuYW1lLFxuICAgICAgICAgICAgZW5naW5lOiBhcmdzLmVuZ2luZSB8fCBcIm15c3FsXCIsXG4gICAgICAgIH0pKTtcblxuICAgICAgICBjb25zdCBzZWNyZXRWZXJzaW9uQ29tcG9uZW50ID0gbmV3IFNlY3JldHNNYW5hZ2VyU2VjcmV0VmVyc2lvbkNvbXBvbmVudChgJHtuYW1lfS12ZXJzaW9uYCwge1xuICAgICAgICAgICAgc2VjcmV0SWQ6IHRoaXMuc2VjcmV0LmlkLFxuICAgICAgICAgICAgc2VjcmV0U3RyaW5nOiBzZWNyZXRTdHJpbmcsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMuc2VjcmV0VmVyc2lvbiA9IHNlY3JldFZlcnNpb25Db21wb25lbnQuc2VjcmV0VmVyc2lvbjtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBzZWNyZXQ6IHRoaXMuc2VjcmV0LFxuICAgICAgICAgICAgc2VjcmV0VmVyc2lvbjogdGhpcy5zZWNyZXRWZXJzaW9uLFxuICAgICAgICAgICAgc2VjcmV0QXJuOiB0aGlzLnNlY3JldEFybixcbiAgICAgICAgICAgIHNlY3JldE5hbWU6IHRoaXMuc2VjcmV0TmFtZSxcbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXBpS2V5c0NvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHNlY3JldHM6IFJlY29yZDxzdHJpbmcsIFNlY3JldHNNYW5hZ2VyU2VjcmV0UmVzdWx0PjtcblxuICAgIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogQXBpS2V5c0FyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOnNlY3JldHNtYW5hZ2VyOkFwaUtleXNDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIHRoaXMuc2VjcmV0cyA9IHt9O1xuXG4gICAgICAgIE9iamVjdC5lbnRyaWVzKGFyZ3MuYXBpS2V5cykuZm9yRWFjaCgoW2tleU5hbWUsIGtleVZhbHVlXSkgPT4ge1xuICAgICAgICAgICAgY29uc3Qgc2VjcmV0Q29tcG9uZW50ID0gbmV3IFNlY3JldHNNYW5hZ2VyU2VjcmV0Q29tcG9uZW50KGAke25hbWV9LSR7a2V5TmFtZX1gLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogYC9hcHAvJHthcmdzLm5hbWV9L2FwaS1rZXlzLyR7a2V5TmFtZX1gLFxuICAgICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBgQVBJIGtleSAke2tleU5hbWV9IGZvciAke2FyZ3MubmFtZX1gLFxuICAgICAgICAgICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgICAgICBjb25zdCBzZWNyZXRWZXJzaW9uQ29tcG9uZW50ID0gbmV3IFNlY3JldHNNYW5hZ2VyU2VjcmV0VmVyc2lvbkNvbXBvbmVudChgJHtuYW1lfS0ke2tleU5hbWV9LXZlcnNpb25gLCB7XG4gICAgICAgICAgICAgICAgc2VjcmV0SWQ6IHNlY3JldENvbXBvbmVudC5zZWNyZXQuaWQsXG4gICAgICAgICAgICAgICAgc2VjcmV0U3RyaW5nOiBrZXlWYWx1ZSxcbiAgICAgICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnNlY3JldHNba2V5TmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgc2VjcmV0OiBzZWNyZXRDb21wb25lbnQuc2VjcmV0LFxuICAgICAgICAgICAgICAgIHNlY3JldEFybjogc2VjcmV0Q29tcG9uZW50LnNlY3JldEFybixcbiAgICAgICAgICAgICAgICBzZWNyZXROYW1lOiBzZWNyZXRDb21wb25lbnQuc2VjcmV0TmFtZSxcbiAgICAgICAgICAgICAgICBzZWNyZXRWZXJzaW9uOiBzZWNyZXRWZXJzaW9uQ29tcG9uZW50LnNlY3JldFZlcnNpb24sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICAgICAgICBzZWNyZXRzOiB0aGlzLnNlY3JldHMsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNlY3JldHNNYW5hZ2VyU2VjcmV0KG5hbWU6IHN0cmluZywgYXJnczogU2VjcmV0c01hbmFnZXJTZWNyZXRBcmdzKTogU2VjcmV0c01hbmFnZXJTZWNyZXRSZXN1bHQge1xuICAgIGNvbnN0IHNlY3JldENvbXBvbmVudCA9IG5ldyBTZWNyZXRzTWFuYWdlclNlY3JldENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWNyZXQ6IHNlY3JldENvbXBvbmVudC5zZWNyZXQsXG4gICAgICAgIHNlY3JldEFybjogc2VjcmV0Q29tcG9uZW50LnNlY3JldEFybixcbiAgICAgICAgc2VjcmV0TmFtZTogc2VjcmV0Q29tcG9uZW50LnNlY3JldE5hbWUsXG4gICAgICAgIHNlY3JldFZlcnNpb246IHNlY3JldENvbXBvbmVudC5zZWNyZXRWZXJzaW9uLFxuICAgIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZWNyZXRzTWFuYWdlclNlY3JldFZlcnNpb24obmFtZTogc3RyaW5nLCBhcmdzOiBTZWNyZXRzTWFuYWdlclNlY3JldFZlcnNpb25BcmdzKTogYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldFZlcnNpb24ge1xuICAgIGNvbnN0IHNlY3JldFZlcnNpb25Db21wb25lbnQgPSBuZXcgU2VjcmV0c01hbmFnZXJTZWNyZXRWZXJzaW9uQ29tcG9uZW50KG5hbWUsIGFyZ3MpO1xuICAgIHJldHVybiBzZWNyZXRWZXJzaW9uQ29tcG9uZW50LnNlY3JldFZlcnNpb247XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEYXRhYmFzZUNyZWRlbnRpYWxzKG5hbWU6IHN0cmluZywgYXJnczogRGF0YWJhc2VDcmVkZW50aWFsc0FyZ3MpOiBEYXRhYmFzZUNyZWRlbnRpYWxzUmVzdWx0IHtcbiAgICBjb25zdCBkYXRhYmFzZUNyZWRlbnRpYWxzQ29tcG9uZW50ID0gbmV3IERhdGFiYXNlQ3JlZGVudGlhbHNDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2VjcmV0OiBkYXRhYmFzZUNyZWRlbnRpYWxzQ29tcG9uZW50LnNlY3JldCxcbiAgICAgICAgc2VjcmV0VmVyc2lvbjogZGF0YWJhc2VDcmVkZW50aWFsc0NvbXBvbmVudC5zZWNyZXRWZXJzaW9uLFxuICAgICAgICBzZWNyZXRBcm46IGRhdGFiYXNlQ3JlZGVudGlhbHNDb21wb25lbnQuc2VjcmV0QXJuLFxuICAgICAgICBzZWNyZXROYW1lOiBkYXRhYmFzZUNyZWRlbnRpYWxzQ29tcG9uZW50LnNlY3JldE5hbWUsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUFwaUtleXMobmFtZTogc3RyaW5nLCBhcmdzOiBBcGlLZXlzQXJncyk6IEFwaUtleXNSZXN1bHQge1xuICAgIGNvbnN0IGFwaUtleXNDb21wb25lbnQgPSBuZXcgQXBpS2V5c0NvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBzZWNyZXRzOiBhcGlLZXlzQ29tcG9uZW50LnNlY3JldHMsXG4gICAgfTtcbn0iXX0=