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
exports.KmsStack = void 0;
/**
 * kms-stack.ts
 *
 * This module defines the KmsStack component for creating KMS keys
 * for encryption across all AWS services.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class KmsStack extends pulumi.ComponentResource {
    mainKeyId;
    mainKeyArn;
    rdsKeyId;
    rdsKeyArn;
    mainKeyAlias;
    rdsKeyAlias;
    constructor(name, args, opts) {
        super('tap:kms:KmsStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Main KMS key for general encryption
        const mainKey = new aws.kms.Key(`tap-main-key-${environmentSuffix}`, {
            description: 'Main KMS key for TAP infrastructure encryption',
            enableKeyRotation: true,
            deletionWindowInDays: 7,
            tags: {
                Name: `tap-main-key-${environmentSuffix}`,
                Purpose: 'MainEncryption',
                ...tags,
            },
        }, { parent: this });
        const mainKeyAlias = new aws.kms.Alias(`tap-main-key-alias-${environmentSuffix}`, {
            name: `alias/tap-main-${environmentSuffix}`,
            targetKeyId: mainKey.keyId,
        }, { parent: this });
        // RDS-specific KMS key
        const rdsKey = new aws.kms.Key(`tap-rds-key-${environmentSuffix}`, {
            description: 'KMS key for TAP RDS encryption',
            enableKeyRotation: true,
            deletionWindowInDays: 7,
            tags: {
                Name: `tap-rds-key-${environmentSuffix}`,
                Purpose: 'RDSEncryption',
                ...tags,
            },
        }, { parent: this });
        const rdsKeyAlias = new aws.kms.Alias(`tap-rds-key-alias-${environmentSuffix}`, {
            name: `alias/tap-rds-${environmentSuffix}`,
            targetKeyId: rdsKey.keyId,
        }, { parent: this });
        this.mainKeyId = mainKey.keyId;
        this.mainKeyArn = mainKey.arn;
        this.rdsKeyId = rdsKey.keyId;
        this.rdsKeyArn = rdsKey.arn;
        this.mainKeyAlias = mainKeyAlias.name;
        this.rdsKeyAlias = rdsKeyAlias.name;
        this.registerOutputs({
            mainKeyId: this.mainKeyId,
            mainKeyArn: this.mainKeyArn,
            rdsKeyId: this.rdsKeyId,
            rdsKeyArn: this.rdsKeyArn,
            mainKeyAlias: this.mainKeyAlias,
            rdsKeyAlias: this.rdsKeyAlias,
        });
    }
}
exports.KmsStack = KmsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia21zLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia21zLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQVF6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLFNBQVMsQ0FBd0I7SUFDakMsVUFBVSxDQUF3QjtJQUNsQyxRQUFRLENBQXdCO0lBQ2hDLFNBQVMsQ0FBd0I7SUFDakMsWUFBWSxDQUF3QjtJQUNwQyxXQUFXLENBQXdCO0lBRW5ELFlBQVksSUFBWSxFQUFFLElBQWtCLEVBQUUsSUFBc0I7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLHNDQUFzQztRQUN0QyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUM3QixnQkFBZ0IsaUJBQWlCLEVBQUUsRUFDbkM7WUFDRSxXQUFXLEVBQUUsZ0RBQWdEO1lBQzdELGlCQUFpQixFQUFFLElBQUk7WUFDdkIsb0JBQW9CLEVBQUUsQ0FBQztZQUN2QixJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLGdCQUFnQixpQkFBaUIsRUFBRTtnQkFDekMsT0FBTyxFQUFFLGdCQUFnQjtnQkFDekIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FDcEMsc0JBQXNCLGlCQUFpQixFQUFFLEVBQ3pDO1lBQ0UsSUFBSSxFQUFFLGtCQUFrQixpQkFBaUIsRUFBRTtZQUMzQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEtBQUs7U0FDM0IsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVCQUF1QjtRQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUM1QixlQUFlLGlCQUFpQixFQUFFLEVBQ2xDO1lBQ0UsV0FBVyxFQUFFLGdDQUFnQztZQUM3QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLG9CQUFvQixFQUFFLENBQUM7WUFDdkIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxlQUFlLGlCQUFpQixFQUFFO2dCQUN4QyxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FDbkMscUJBQXFCLGlCQUFpQixFQUFFLEVBQ3hDO1lBQ0UsSUFBSSxFQUFFLGlCQUFpQixpQkFBaUIsRUFBRTtZQUMxQyxXQUFXLEVBQUUsTUFBTSxDQUFDLEtBQUs7U0FDMUIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUMvQixJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDO1FBRXBDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtZQUMvQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7U0FDOUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBaEZELDRCQWdGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICoga21zLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgS21zU3RhY2sgY29tcG9uZW50IGZvciBjcmVhdGluZyBLTVMga2V5c1xuICogZm9yIGVuY3J5cHRpb24gYWNyb3NzIGFsbCBBV1Mgc2VydmljZXMuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIEttc1N0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgS21zU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgbWFpbktleUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBtYWluS2V5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSByZHNLZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcmRzS2V5QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBtYWluS2V5QWxpYXM6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHJkc0tleUFsaWFzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBLbXNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOmttczpLbXNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzLnRhZ3MgfHwge307XG5cbiAgICAvLyBNYWluIEtNUyBrZXkgZm9yIGdlbmVyYWwgZW5jcnlwdGlvblxuICAgIGNvbnN0IG1haW5LZXkgPSBuZXcgYXdzLmttcy5LZXkoXG4gICAgICBgdGFwLW1haW4ta2V5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdNYWluIEtNUyBrZXkgZm9yIFRBUCBpbmZyYXN0cnVjdHVyZSBlbmNyeXB0aW9uJyxcbiAgICAgICAgZW5hYmxlS2V5Um90YXRpb246IHRydWUsXG4gICAgICAgIGRlbGV0aW9uV2luZG93SW5EYXlzOiA3LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1tYWluLWtleS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ01haW5FbmNyeXB0aW9uJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgY29uc3QgbWFpbktleUFsaWFzID0gbmV3IGF3cy5rbXMuQWxpYXMoXG4gICAgICBgdGFwLW1haW4ta2V5LWFsaWFzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYGFsaWFzL3RhcC1tYWluLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgdGFyZ2V0S2V5SWQ6IG1haW5LZXkua2V5SWQsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBSRFMtc3BlY2lmaWMgS01TIGtleVxuICAgIGNvbnN0IHJkc0tleSA9IG5ldyBhd3Mua21zLktleShcbiAgICAgIGB0YXAtcmRzLWtleS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnS01TIGtleSBmb3IgVEFQIFJEUyBlbmNyeXB0aW9uJyxcbiAgICAgICAgZW5hYmxlS2V5Um90YXRpb246IHRydWUsXG4gICAgICAgIGRlbGV0aW9uV2luZG93SW5EYXlzOiA3LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1yZHMta2V5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnUkRTRW5jcnlwdGlvbicsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IHJkc0tleUFsaWFzID0gbmV3IGF3cy5rbXMuQWxpYXMoXG4gICAgICBgdGFwLXJkcy1rZXktYWxpYXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgYWxpYXMvdGFwLXJkcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHRhcmdldEtleUlkOiByZHNLZXkua2V5SWQsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLm1haW5LZXlJZCA9IG1haW5LZXkua2V5SWQ7XG4gICAgdGhpcy5tYWluS2V5QXJuID0gbWFpbktleS5hcm47XG4gICAgdGhpcy5yZHNLZXlJZCA9IHJkc0tleS5rZXlJZDtcbiAgICB0aGlzLnJkc0tleUFybiA9IHJkc0tleS5hcm47XG4gICAgdGhpcy5tYWluS2V5QWxpYXMgPSBtYWluS2V5QWxpYXMubmFtZTtcbiAgICB0aGlzLnJkc0tleUFsaWFzID0gcmRzS2V5QWxpYXMubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIG1haW5LZXlJZDogdGhpcy5tYWluS2V5SWQsXG4gICAgICBtYWluS2V5QXJuOiB0aGlzLm1haW5LZXlBcm4sXG4gICAgICByZHNLZXlJZDogdGhpcy5yZHNLZXlJZCxcbiAgICAgIHJkc0tleUFybjogdGhpcy5yZHNLZXlBcm4sXG4gICAgICBtYWluS2V5QWxpYXM6IHRoaXMubWFpbktleUFsaWFzLFxuICAgICAgcmRzS2V5QWxpYXM6IHRoaXMucmRzS2V5QWxpYXMsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==