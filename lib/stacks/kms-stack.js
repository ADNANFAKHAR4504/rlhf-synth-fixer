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
        new aws.kms.Alias(`tap-main-key-alias-${environmentSuffix}`, {
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
        new aws.kms.Alias(`tap-rds-key-alias-${environmentSuffix}`, {
            name: `alias/tap-rds-${environmentSuffix}`,
            targetKeyId: rdsKey.keyId,
        }, { parent: this });
        this.mainKeyId = mainKey.keyId;
        this.mainKeyArn = mainKey.arn;
        this.rdsKeyId = rdsKey.keyId;
        this.rdsKeyArn = rdsKey.arn;
        this.registerOutputs({
            mainKeyId: this.mainKeyId,
            mainKeyArn: this.mainKeyArn,
            rdsKeyId: this.rdsKeyId,
            rdsKeyArn: this.rdsKeyArn,
        });
    }
}
exports.KmsStack = KmsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia21zLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsia21zLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQVF6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLFNBQVMsQ0FBd0I7SUFDakMsVUFBVSxDQUF3QjtJQUNsQyxRQUFRLENBQXdCO0lBQ2hDLFNBQVMsQ0FBd0I7SUFFakQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0Isc0NBQXNDO1FBQ3RDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQzdCLGdCQUFnQixpQkFBaUIsRUFBRSxFQUNuQztZQUNFLFdBQVcsRUFBRSxnREFBZ0Q7WUFDN0QsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixvQkFBb0IsRUFBRSxDQUFDO1lBQ3ZCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsZ0JBQWdCLGlCQUFpQixFQUFFO2dCQUN6QyxPQUFPLEVBQUUsZ0JBQWdCO2dCQUN6QixHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUNmLHNCQUFzQixpQkFBaUIsRUFBRSxFQUN6QztZQUNFLElBQUksRUFBRSxrQkFBa0IsaUJBQWlCLEVBQUU7WUFDM0MsV0FBVyxFQUFFLE9BQU8sQ0FBQyxLQUFLO1NBQzNCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRix1QkFBdUI7UUFDdkIsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FDNUIsZUFBZSxpQkFBaUIsRUFBRSxFQUNsQztZQUNFLFdBQVcsRUFBRSxnQ0FBZ0M7WUFDN0MsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixvQkFBb0IsRUFBRSxDQUFDO1lBQ3ZCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsZUFBZSxpQkFBaUIsRUFBRTtnQkFDeEMsT0FBTyxFQUFFLGVBQWU7Z0JBQ3hCLEdBQUcsSUFBSTthQUNSO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQ2YscUJBQXFCLGlCQUFpQixFQUFFLEVBQ3hDO1lBQ0UsSUFBSSxFQUFFLGlCQUFpQixpQkFBaUIsRUFBRTtZQUMxQyxXQUFXLEVBQUUsTUFBTSxDQUFDLEtBQUs7U0FDMUIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUMvQixJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO1FBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztRQUU1QixJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztZQUN6QixVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDM0IsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztTQUMxQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUExRUQsNEJBMEVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBrbXMtc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBLbXNTdGFjayBjb21wb25lbnQgZm9yIGNyZWF0aW5nIEtNUyBrZXlzXG4gKiBmb3IgZW5jcnlwdGlvbiBhY3Jvc3MgYWxsIEFXUyBzZXJ2aWNlcy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgS21zU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG59XG5cbmV4cG9ydCBjbGFzcyBLbXNTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBtYWluS2V5SWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IG1haW5LZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IHJkc0tleUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSByZHNLZXlBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IEttc1N0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6a21zOkttc1N0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IGFyZ3MudGFncyB8fCB7fTtcblxuICAgIC8vIE1haW4gS01TIGtleSBmb3IgZ2VuZXJhbCBlbmNyeXB0aW9uXG4gICAgY29uc3QgbWFpbktleSA9IG5ldyBhd3Mua21zLktleShcbiAgICAgIGB0YXAtbWFpbi1rZXktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkZXNjcmlwdGlvbjogJ01haW4gS01TIGtleSBmb3IgVEFQIGluZnJhc3RydWN0dXJlIGVuY3J5cHRpb24nLFxuICAgICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgICAgZGVsZXRpb25XaW5kb3dJbkRheXM6IDcsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLW1haW4ta2V5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnTWFpbkVuY3J5cHRpb24nLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmttcy5BbGlhcyhcbiAgICAgIGB0YXAtbWFpbi1rZXktYWxpYXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgYWxpYXMvdGFwLW1haW4tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICB0YXJnZXRLZXlJZDogbWFpbktleS5rZXlJZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFJEUy1zcGVjaWZpYyBLTVMga2V5XG4gICAgY29uc3QgcmRzS2V5ID0gbmV3IGF3cy5rbXMuS2V5KFxuICAgICAgYHRhcC1yZHMta2V5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGVzY3JpcHRpb246ICdLTVMga2V5IGZvciBUQVAgUkRTIGVuY3J5cHRpb24nLFxuICAgICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgICAgZGVsZXRpb25XaW5kb3dJbkRheXM6IDcsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLXJkcy1rZXktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdSRFNFbmNyeXB0aW9uJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5rbXMuQWxpYXMoXG4gICAgICBgdGFwLXJkcy1rZXktYWxpYXMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgYWxpYXMvdGFwLXJkcy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHRhcmdldEtleUlkOiByZHNLZXkua2V5SWQsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLm1haW5LZXlJZCA9IG1haW5LZXkua2V5SWQ7XG4gICAgdGhpcy5tYWluS2V5QXJuID0gbWFpbktleS5hcm47XG4gICAgdGhpcy5yZHNLZXlJZCA9IHJkc0tleS5rZXlJZDtcbiAgICB0aGlzLnJkc0tleUFybiA9IHJkc0tleS5hcm47XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBtYWluS2V5SWQ6IHRoaXMubWFpbktleUlkLFxuICAgICAgbWFpbktleUFybjogdGhpcy5tYWluS2V5QXJuLFxuICAgICAgcmRzS2V5SWQ6IHRoaXMucmRzS2V5SWQsXG4gICAgICByZHNLZXlBcm46IHRoaXMucmRzS2V5QXJuLFxuICAgIH0pO1xuICB9XG59XG4iXX0=