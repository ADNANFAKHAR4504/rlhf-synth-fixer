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
exports.SnsStack = void 0;
/**
 * sns-stack.ts
 *
 * This module defines the SNS stack for security notifications.
 * Creates SNS topic and email subscription for security alerts.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class SnsStack extends pulumi.ComponentResource {
    topicArn;
    topicName;
    constructor(name, args, opts) {
        super('tap:sns:SnsStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Create SNS topic for security alerts
        const securityAlertsTopic = new aws.sns.Topic(`tap-security-alerts-${environmentSuffix}`, {
            name: `tap-security-alerts-${environmentSuffix}`,
            displayName: `TAP Security Alerts - ${environmentSuffix}`,
            tags: {
                Name: `tap-security-alerts-${environmentSuffix}`,
                Purpose: 'SecurityAlerts',
                ...tags,
            },
        }, { parent: this });
        // Create email subscription
        new aws.sns.TopicSubscription(`tap-security-alerts-subscription-${environmentSuffix}`, {
            topic: securityAlertsTopic.arn,
            protocol: 'email',
            endpoint: args.alertEmail,
        }, { parent: this });
        this.topicArn = securityAlertsTopic.arn;
        this.topicName = securityAlertsTopic.name;
        this.registerOutputs({
            topicArn: this.topicArn,
            topicName: this.topicName,
        });
    }
}
exports.SnsStack = SnsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic25zLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic25zLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQWN6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLFFBQVEsQ0FBd0I7SUFDaEMsU0FBUyxDQUF3QjtJQUVqRCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNCO1FBQ2xFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMxRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUU3Qix1Q0FBdUM7UUFDdkMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUMzQyx1QkFBdUIsaUJBQWlCLEVBQUUsRUFDMUM7WUFDRSxJQUFJLEVBQUUsdUJBQXVCLGlCQUFpQixFQUFFO1lBQ2hELFdBQVcsRUFBRSx5QkFBeUIsaUJBQWlCLEVBQUU7WUFDekQsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSx1QkFBdUIsaUJBQWlCLEVBQUU7Z0JBQ2hELE9BQU8sRUFBRSxnQkFBZ0I7Z0JBQ3pCLEdBQUcsSUFBSTthQUNSO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDRCQUE0QjtRQUM1QixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQzNCLG9DQUFvQyxpQkFBaUIsRUFBRSxFQUN2RDtZQUNFLEtBQUssRUFBRSxtQkFBbUIsQ0FBQyxHQUFHO1lBQzlCLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVTtTQUMxQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxDQUFDLFFBQVEsR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUM7UUFDeEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7UUFFMUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsU0FBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1NBQzFCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQTVDRCw0QkE0Q0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHNucy1zdGFjay50c1xuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIFNOUyBzdGFjayBmb3Igc2VjdXJpdHkgbm90aWZpY2F0aW9ucy5cbiAqIENyZWF0ZXMgU05TIHRvcGljIGFuZCBlbWFpbCBzdWJzY3JpcHRpb24gZm9yIHNlY3VyaXR5IGFsZXJ0cy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU25zU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG4gIGFsZXJ0RW1haWw6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTbnNTdGFja091dHB1dHMge1xuICB0b3BpY0FybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICB0b3BpY05hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIFNuc1N0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHRvcGljQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSB0b3BpY05hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFNuc1N0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6c25zOlNuc1N0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgdGFncyA9IGFyZ3MudGFncyB8fCB7fTtcblxuICAgIC8vIENyZWF0ZSBTTlMgdG9waWMgZm9yIHNlY3VyaXR5IGFsZXJ0c1xuICAgIGNvbnN0IHNlY3VyaXR5QWxlcnRzVG9waWMgPSBuZXcgYXdzLnNucy5Ub3BpYyhcbiAgICAgIGB0YXAtc2VjdXJpdHktYWxlcnRzLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1zZWN1cml0eS1hbGVydHMtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkaXNwbGF5TmFtZTogYFRBUCBTZWN1cml0eSBBbGVydHMgLSAke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLXNlY3VyaXR5LWFsZXJ0cy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ1NlY3VyaXR5QWxlcnRzJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGVtYWlsIHN1YnNjcmlwdGlvblxuICAgIG5ldyBhd3Muc25zLlRvcGljU3Vic2NyaXB0aW9uKFxuICAgICAgYHRhcC1zZWN1cml0eS1hbGVydHMtc3Vic2NyaXB0aW9uLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdG9waWM6IHNlY3VyaXR5QWxlcnRzVG9waWMuYXJuLFxuICAgICAgICBwcm90b2NvbDogJ2VtYWlsJyxcbiAgICAgICAgZW5kcG9pbnQ6IGFyZ3MuYWxlcnRFbWFpbCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMudG9waWNBcm4gPSBzZWN1cml0eUFsZXJ0c1RvcGljLmFybjtcbiAgICB0aGlzLnRvcGljTmFtZSA9IHNlY3VyaXR5QWxlcnRzVG9waWMubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHRvcGljQXJuOiB0aGlzLnRvcGljQXJuLFxuICAgICAgdG9waWNOYW1lOiB0aGlzLnRvcGljTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuIl19