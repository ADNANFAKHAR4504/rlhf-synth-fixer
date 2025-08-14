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
        });
    }
}
exports.KmsStack = KmsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia21zLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia21zLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQVF6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLFNBQVMsQ0FBd0I7SUFDakMsVUFBVSxDQUF3QjtJQUNsQyxRQUFRLENBQXdCO0lBQ2hDLFNBQVMsQ0FBd0I7SUFDakMsWUFBWSxDQUF3QjtJQUNwQyxXQUFXLENBQXdCO0lBRW5ELFlBQVksSUFBWSxFQUFFLElBQWtCLEVBQUUsSUFBc0I7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLHNDQUFzQztRQUN0QyxNQUFNLE9BQU8sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUM3QixnQkFBZ0IsaUJBQWlCLEVBQUUsRUFDbkM7WUFDRSxXQUFXLEVBQUUsZ0RBQWdEO1lBQzdELGlCQUFpQixFQUFFLElBQUk7WUFDdkIsb0JBQW9CLEVBQUUsQ0FBQztZQUN2QixJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLGdCQUFnQixpQkFBaUIsRUFBRTtnQkFDekMsT0FBTyxFQUFFLGdCQUFnQjtnQkFDekIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsTUFBTSxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FDcEMsc0JBQXNCLGlCQUFpQixFQUFFLEVBQ3pDO1lBQ0UsSUFBSSxFQUFFLGtCQUFrQixpQkFBaUIsRUFBRTtZQUMzQyxXQUFXLEVBQUUsT0FBTyxDQUFDLEtBQUs7U0FDM0IsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVCQUF1QjtRQUN2QixNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUM1QixlQUFlLGlCQUFpQixFQUFFLEVBQ2xDO1lBQ0UsV0FBVyxFQUFFLGdDQUFnQztZQUM3QyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLG9CQUFvQixFQUFFLENBQUM7WUFDdkIsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxlQUFlLGlCQUFpQixFQUFFO2dCQUN4QyxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsTUFBTSxXQUFXLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FDbkMscUJBQXFCLGlCQUFpQixFQUFFLEVBQ3hDO1lBQ0UsSUFBSSxFQUFFLGlCQUFpQixpQkFBaUIsRUFBRTtZQUMxQyxXQUFXLEVBQUUsTUFBTSxDQUFDLEtBQUs7U0FDMUIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUMvQixJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDdEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDO1FBRXBDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3pCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1NBQzFCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTlFRCw0QkE4RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGttcy1zdGFjay50c1xuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIEttc1N0YWNrIGNvbXBvbmVudCBmb3IgY3JlYXRpbmcgS01TIGtleXNcbiAqIGZvciBlbmNyeXB0aW9uIGFjcm9zcyBhbGwgQVdTIHNlcnZpY2VzLlxuICovXG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBLbXNTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIEttc1N0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IG1haW5LZXlJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgbWFpbktleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgcmRzS2V5SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHJkc0tleUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgbWFpbktleUFsaWFzOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSByZHNLZXlBbGlhczogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogS21zU3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDprbXM6S21zU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gTWFpbiBLTVMga2V5IGZvciBnZW5lcmFsIGVuY3J5cHRpb25cbiAgICBjb25zdCBtYWluS2V5ID0gbmV3IGF3cy5rbXMuS2V5KFxuICAgICAgYHRhcC1tYWluLWtleS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTWFpbiBLTVMga2V5IGZvciBUQVAgaW5mcmFzdHJ1Y3R1cmUgZW5jcnlwdGlvbicsXG4gICAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0cnVlLFxuICAgICAgICBkZWxldGlvbldpbmRvd0luRGF5czogNyxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtbWFpbi1rZXktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdNYWluRW5jcnlwdGlvbicsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IG1haW5LZXlBbGlhcyA9IG5ldyBhd3Mua21zLkFsaWFzKFxuICAgICAgYHRhcC1tYWluLWtleS1hbGlhcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBhbGlhcy90YXAtbWFpbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHRhcmdldEtleUlkOiBtYWluS2V5LmtleUlkLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gUkRTLXNwZWNpZmljIEtNUyBrZXlcbiAgICBjb25zdCByZHNLZXkgPSBuZXcgYXdzLmttcy5LZXkoXG4gICAgICBgdGFwLXJkcy1rZXktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ0tNUyBrZXkgZm9yIFRBUCBSRFMgZW5jcnlwdGlvbicsXG4gICAgICAgIGVuYWJsZUtleVJvdGF0aW9uOiB0cnVlLFxuICAgICAgICBkZWxldGlvbldpbmRvd0luRGF5czogNyxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtcmRzLWtleS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ1JEU0VuY3J5cHRpb24nLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBjb25zdCByZHNLZXlBbGlhcyA9IG5ldyBhd3Mua21zLkFsaWFzKFxuICAgICAgYHRhcC1yZHMta2V5LWFsaWFzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYGFsaWFzL3RhcC1yZHMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB0YXJnZXRLZXlJZDogcmRzS2V5LmtleUlkLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5tYWluS2V5SWQgPSBtYWluS2V5LmtleUlkO1xuICAgIHRoaXMubWFpbktleUFybiA9IG1haW5LZXkuYXJuO1xuICAgIHRoaXMucmRzS2V5SWQgPSByZHNLZXkua2V5SWQ7XG4gICAgdGhpcy5yZHNLZXlBcm4gPSByZHNLZXkuYXJuO1xuICAgIHRoaXMubWFpbktleUFsaWFzID0gbWFpbktleUFsaWFzLm5hbWU7XG4gICAgdGhpcy5yZHNLZXlBbGlhcyA9IHJkc0tleUFsaWFzLm5hbWU7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBtYWluS2V5SWQ6IHRoaXMubWFpbktleUlkLFxuICAgICAgbWFpbktleUFybjogdGhpcy5tYWluS2V5QXJuLFxuICAgICAgcmRzS2V5SWQ6IHRoaXMucmRzS2V5SWQsXG4gICAgICByZHNLZXlBcm46IHRoaXMucmRzS2V5QXJuLFxuICAgIH0pO1xuICB9XG59XG4iXX0=