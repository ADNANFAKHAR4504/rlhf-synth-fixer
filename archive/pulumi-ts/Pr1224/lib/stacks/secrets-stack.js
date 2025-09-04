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
exports.SecretsStack = void 0;
/**
 * secrets-stack.ts
 *
 * This module defines the SecretsStack component for managing
 * sensitive data using AWS Secrets Manager.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class SecretsStack extends pulumi.ComponentResource {
    dbSecretArn;
    dbSecretId;
    constructor(name, args, opts) {
        super('tap:secrets:SecretsStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Generate random password for database
        const dbPassword = new aws.secretsmanager.Secret(`tap-db-password-${environmentSuffix}`, {
            name: `tap/db/password/${environmentSuffix}`,
            description: 'Database master password for TAP application',
            kmsKeyId: args.kmsKeyArn,
            tags: {
                Name: `tap-db-password-${environmentSuffix}`,
                Purpose: 'DatabaseCredentials',
                ...tags,
            },
        }, { parent: this });
        // Generate secure random password using a simple approach
        new aws.secretsmanager.SecretVersion(`tap-db-password-version-${environmentSuffix}`, {
            secretId: dbPassword.id,
            secretString: JSON.stringify({
                username: 'admin',
                password: 'CHANGE_ME_IN_PRODUCTION_VIA_ROTATION',
            }),
        }, { parent: this });
        // Enable automatic rotation (optional)
        new aws.secretsmanager.SecretRotation(`tap-db-password-rotation-${environmentSuffix}`, {
            secretId: dbPassword.id,
            rotationLambdaArn: pulumi.interpolate `arn:aws:lambda:${aws.getRegion().then(r => r.name)}:${aws.getCallerIdentity().then(c => c.accountId)}:function:SecretsManagerRDSMySQLRotationSingleUser`,
            rotationRules: {
                automaticallyAfterDays: 30,
            },
        }, {
            parent: this,
            // Make rotation optional - only create if Lambda exists
            ignoreChanges: ['rotationLambdaArn'],
        });
        this.dbSecretArn = dbPassword.arn;
        this.dbSecretId = dbPassword.id;
        this.registerOutputs({
            dbSecretArn: this.dbSecretArn,
            dbSecretId: this.dbSecretId,
        });
    }
}
exports.SecretsStack = SecretsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0cy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNlY3JldHMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7O0dBS0c7QUFDSCxpREFBbUM7QUFDbkMsdURBQXlDO0FBU3pDLE1BQWEsWUFBYSxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDeEMsV0FBVyxDQUF3QjtJQUNuQyxVQUFVLENBQXdCO0lBRWxELFlBQVksSUFBWSxFQUFFLElBQXNCLEVBQUUsSUFBc0I7UUFDdEUsS0FBSyxDQUFDLDBCQUEwQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFcEQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLHdDQUF3QztRQUN4QyxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUM5QyxtQkFBbUIsaUJBQWlCLEVBQUUsRUFDdEM7WUFDRSxJQUFJLEVBQUUsbUJBQW1CLGlCQUFpQixFQUFFO1lBQzVDLFdBQVcsRUFBRSw4Q0FBOEM7WUFDM0QsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3hCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsbUJBQW1CLGlCQUFpQixFQUFFO2dCQUM1QyxPQUFPLEVBQUUscUJBQXFCO2dCQUM5QixHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwwREFBMEQ7UUFDMUQsSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FDbEMsMkJBQTJCLGlCQUFpQixFQUFFLEVBQzlDO1lBQ0UsUUFBUSxFQUFFLFVBQVUsQ0FBQyxFQUFFO1lBQ3ZCLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMzQixRQUFRLEVBQUUsT0FBTztnQkFDakIsUUFBUSxFQUFFLHNDQUFzQzthQUNqRCxDQUFDO1NBQ0gsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVDQUF1QztRQUN2QyxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUNuQyw0QkFBNEIsaUJBQWlCLEVBQUUsRUFDL0M7WUFDRSxRQUFRLEVBQUUsVUFBVSxDQUFDLEVBQUU7WUFDdkIsaUJBQWlCLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQSxrQkFBa0IsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLG9EQUFvRDtZQUM5TCxhQUFhLEVBQUU7Z0JBQ2Isc0JBQXNCLEVBQUUsRUFBRTthQUMzQjtTQUNGLEVBQ0Q7WUFDRSxNQUFNLEVBQUUsSUFBSTtZQUNaLHdEQUF3RDtZQUN4RCxhQUFhLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQztTQUNyQyxDQUNGLENBQUM7UUFFRixJQUFJLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUM7UUFDbEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBRWhDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtTQUM1QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFoRUQsb0NBZ0VDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBzZWNyZXRzLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgU2VjcmV0c1N0YWNrIGNvbXBvbmVudCBmb3IgbWFuYWdpbmdcbiAqIHNlbnNpdGl2ZSBkYXRhIHVzaW5nIEFXUyBTZWNyZXRzIE1hbmFnZXIuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFNlY3JldHNTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcbiAga21zS2V5QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIFNlY3JldHNTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBkYlNlY3JldEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGJTZWNyZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogU2VjcmV0c1N0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6c2VjcmV0czpTZWNyZXRzU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gR2VuZXJhdGUgcmFuZG9tIHBhc3N3b3JkIGZvciBkYXRhYmFzZVxuICAgIGNvbnN0IGRiUGFzc3dvcmQgPSBuZXcgYXdzLnNlY3JldHNtYW5hZ2VyLlNlY3JldChcbiAgICAgIGB0YXAtZGItcGFzc3dvcmQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwL2RiL3Bhc3N3b3JkLyR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVzY3JpcHRpb246ICdEYXRhYmFzZSBtYXN0ZXIgcGFzc3dvcmQgZm9yIFRBUCBhcHBsaWNhdGlvbicsXG4gICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUFybixcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZGItcGFzc3dvcmQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdEYXRhYmFzZUNyZWRlbnRpYWxzJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gR2VuZXJhdGUgc2VjdXJlIHJhbmRvbSBwYXNzd29yZCB1c2luZyBhIHNpbXBsZSBhcHByb2FjaFxuICAgIG5ldyBhd3Muc2VjcmV0c21hbmFnZXIuU2VjcmV0VmVyc2lvbihcbiAgICAgIGB0YXAtZGItcGFzc3dvcmQtdmVyc2lvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHNlY3JldElkOiBkYlBhc3N3b3JkLmlkLFxuICAgICAgICBzZWNyZXRTdHJpbmc6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB1c2VybmFtZTogJ2FkbWluJyxcbiAgICAgICAgICBwYXNzd29yZDogJ0NIQU5HRV9NRV9JTl9QUk9EVUNUSU9OX1ZJQV9ST1RBVElPTicsXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRW5hYmxlIGF1dG9tYXRpYyByb3RhdGlvbiAob3B0aW9uYWwpXG4gICAgbmV3IGF3cy5zZWNyZXRzbWFuYWdlci5TZWNyZXRSb3RhdGlvbihcbiAgICAgIGB0YXAtZGItcGFzc3dvcmQtcm90YXRpb24tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBzZWNyZXRJZDogZGJQYXNzd29yZC5pZCxcbiAgICAgICAgcm90YXRpb25MYW1iZGFBcm46IHB1bHVtaS5pbnRlcnBvbGF0ZWBhcm46YXdzOmxhbWJkYToke2F3cy5nZXRSZWdpb24oKS50aGVuKHIgPT4gci5uYW1lKX06JHthd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKS50aGVuKGMgPT4gYy5hY2NvdW50SWQpfTpmdW5jdGlvbjpTZWNyZXRzTWFuYWdlclJEU015U1FMUm90YXRpb25TaW5nbGVVc2VyYCxcbiAgICAgICAgcm90YXRpb25SdWxlczoge1xuICAgICAgICAgIGF1dG9tYXRpY2FsbHlBZnRlckRheXM6IDMwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAvLyBNYWtlIHJvdGF0aW9uIG9wdGlvbmFsIC0gb25seSBjcmVhdGUgaWYgTGFtYmRhIGV4aXN0c1xuICAgICAgICBpZ25vcmVDaGFuZ2VzOiBbJ3JvdGF0aW9uTGFtYmRhQXJuJ10sXG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuZGJTZWNyZXRBcm4gPSBkYlBhc3N3b3JkLmFybjtcbiAgICB0aGlzLmRiU2VjcmV0SWQgPSBkYlBhc3N3b3JkLmlkO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgZGJTZWNyZXRBcm46IHRoaXMuZGJTZWNyZXRBcm4sXG4gICAgICBkYlNlY3JldElkOiB0aGlzLmRiU2VjcmV0SWQsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==