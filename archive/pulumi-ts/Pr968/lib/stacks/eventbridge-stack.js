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
exports.EventBridgeStack = void 0;
/**
 * eventbridge-stack.ts
 *
 * This module defines the EventBridge stack for monitoring security group changes.
 * Creates EventBridge rules and targets to detect security group modifications.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class EventBridgeStack extends pulumi.ComponentResource {
    ruleArn;
    targetId;
    constructor(name, args, opts) {
        super('tap:eventbridge:EventBridgeStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Create EventBridge rule to monitor security group changes
        const securityGroupMonitorRule = new aws.cloudwatch.EventRule(`tap-sg-monitor-rule-${environmentSuffix}`, {
            name: `tap-sg-monitor-rule-${environmentSuffix}`,
            description: `Monitor security group changes for TAP - ${environmentSuffix}`,
            // Event pattern to detect security group modifications
            eventPattern: pulumi.interpolate `{
        "source": ["aws.ec2"],
        "detail-type": ["AWS API Call via CloudTrail"],
        "detail": {
          "eventName": [
            "AuthorizeSecurityGroupIngress",
            "AuthorizeSecurityGroupEgress", 
            "RevokeSecurityGroupIngress",
            "RevokeSecurityGroupEgress"
          ],
          "requestParameters": {
            "groupId": ["${args.securityGroupId}"]
          }
        }
      }`,
            tags: {
                Name: `tap-sg-monitor-rule-${environmentSuffix}`,
                Purpose: 'SecurityGroupMonitoring',
                ...tags,
            },
        }, { parent: this });
        // Create IAM role for EventBridge to publish to SNS
        const eventBridgeRole = new aws.iam.Role(`tap-eventbridge-role-${environmentSuffix}`, {
            name: `tap-eventbridge-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'events.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            }),
            tags: {
                Name: `tap-eventbridge-role-${environmentSuffix}`,
                Purpose: 'EventBridgeExecution',
                ...tags,
            },
        }, { parent: this });
        // Create IAM policy for SNS publishing
        const snsPublishPolicy = new aws.iam.RolePolicy(`tap-eventbridge-sns-policy-${environmentSuffix}`, {
            name: `tap-eventbridge-sns-policy-${environmentSuffix}`,
            role: eventBridgeRole.id,
            policy: pulumi.interpolate `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "sns:Publish"
            ],
            "Resource": "${args.snsTopicArn}"
          }
        ]
      }`,
        }, { parent: this });
        // Create EventBridge target to send alerts to SNS
        const snsTarget = new aws.cloudwatch.EventTarget(`tap-sg-monitor-target-${environmentSuffix}`, {
            rule: securityGroupMonitorRule.name,
            targetId: `tap-sg-monitor-target-${environmentSuffix}`,
            arn: args.snsTopicArn,
            roleArn: eventBridgeRole.arn,
            // Custom message for the alert
            inputTransformer: {
                inputPaths: {
                    eventName: '$.detail.eventName',
                    sourceIpAddress: '$.detail.sourceIPAddress',
                    userIdentity: '$.detail.userIdentity.type',
                    userName: '$.detail.userIdentity.userName',
                    eventTime: '$.detail.eventTime',
                    securityGroupId: '$.detail.requestParameters.groupId',
                },
                inputTemplate: pulumi.interpolate `{
          "alert": "SECURITY ALERT: Security Group Modified",
          "environment": "${environmentSuffix}",
          "event": "<eventName>",
          "securityGroupId": "<securityGroupId>",
          "sourceIP": "<sourceIpAddress>",
          "userType": "<userIdentity>",
          "userName": "<userName>",
          "timestamp": "<eventTime>",
          "message": "The monitored security group has been modified. Please review the changes immediately.",
          "actionRequired": "Verify if this change was authorized and complies with security policies."
        }`,
            },
        }, { parent: this, dependsOn: [snsPublishPolicy] });
        this.ruleArn = securityGroupMonitorRule.arn;
        this.targetId = snsTarget.targetId;
        this.registerOutputs({
            ruleArn: this.ruleArn,
            targetId: this.targetId,
        });
    }
}
exports.EventBridgeStack = EventBridgeStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRicmlkZ2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJldmVudGJyaWRnZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFlekMsTUFBYSxnQkFBaUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzVDLE9BQU8sQ0FBd0I7SUFDL0IsUUFBUSxDQUF3QjtJQUVoRCxZQUNFLElBQVksRUFDWixJQUEwQixFQUMxQixJQUFzQjtRQUV0QixLQUFLLENBQUMsa0NBQWtDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1RCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IsNERBQTREO1FBQzVELE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FDM0QsdUJBQXVCLGlCQUFpQixFQUFFLEVBQzFDO1lBQ0UsSUFBSSxFQUFFLHVCQUF1QixpQkFBaUIsRUFBRTtZQUNoRCxXQUFXLEVBQUUsNENBQTRDLGlCQUFpQixFQUFFO1lBRTVFLHVEQUF1RDtZQUN2RCxZQUFZLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQTs7Ozs7Ozs7Ozs7MkJBV2IsSUFBSSxDQUFDLGVBQWU7OztRQUd2QztZQUVBLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsdUJBQXVCLGlCQUFpQixFQUFFO2dCQUNoRCxPQUFPLEVBQUUseUJBQXlCO2dCQUNsQyxHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixvREFBb0Q7UUFDcEQsTUFBTSxlQUFlLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksQ0FDdEMsd0JBQXdCLGlCQUFpQixFQUFFLEVBQzNDO1lBQ0UsSUFBSSxFQUFFLHdCQUF3QixpQkFBaUIsRUFBRTtZQUNqRCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMvQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLE1BQU0sRUFBRSxPQUFPO3dCQUNmLFNBQVMsRUFBRTs0QkFDVCxPQUFPLEVBQUUsc0JBQXNCO3lCQUNoQzt3QkFDRCxNQUFNLEVBQUUsZ0JBQWdCO3FCQUN6QjtpQkFDRjthQUNGLENBQUM7WUFDRixJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLHdCQUF3QixpQkFBaUIsRUFBRTtnQkFDakQsT0FBTyxFQUFFLHNCQUFzQjtnQkFDL0IsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsdUNBQXVDO1FBQ3ZDLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FDN0MsOEJBQThCLGlCQUFpQixFQUFFLEVBQ2pEO1lBQ0UsSUFBSSxFQUFFLDhCQUE4QixpQkFBaUIsRUFBRTtZQUN2RCxJQUFJLEVBQUUsZUFBZSxDQUFDLEVBQUU7WUFDeEIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUE7Ozs7Ozs7OzJCQVFQLElBQUksQ0FBQyxXQUFXOzs7UUFHbkM7U0FDRCxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsa0RBQWtEO1FBQ2xELE1BQU0sU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQzlDLHlCQUF5QixpQkFBaUIsRUFBRSxFQUM1QztZQUNFLElBQUksRUFBRSx3QkFBd0IsQ0FBQyxJQUFJO1lBQ25DLFFBQVEsRUFBRSx5QkFBeUIsaUJBQWlCLEVBQUU7WUFDdEQsR0FBRyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQ3JCLE9BQU8sRUFBRSxlQUFlLENBQUMsR0FBRztZQUU1QiwrQkFBK0I7WUFDL0IsZ0JBQWdCLEVBQUU7Z0JBQ2hCLFVBQVUsRUFBRTtvQkFDVixTQUFTLEVBQUUsb0JBQW9CO29CQUMvQixlQUFlLEVBQUUsMEJBQTBCO29CQUMzQyxZQUFZLEVBQUUsNEJBQTRCO29CQUMxQyxRQUFRLEVBQUUsZ0NBQWdDO29CQUMxQyxTQUFTLEVBQUUsb0JBQW9CO29CQUMvQixlQUFlLEVBQUUsb0NBQW9DO2lCQUN0RDtnQkFDRCxhQUFhLEVBQUUsTUFBTSxDQUFDLFdBQVcsQ0FBQTs7NEJBRWYsaUJBQWlCOzs7Ozs7Ozs7VUFTbkM7YUFDRDtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FDaEQsQ0FBQztRQUVGLElBQUksQ0FBQyxPQUFPLEdBQUcsd0JBQXdCLENBQUMsR0FBRyxDQUFDO1FBQzVDLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQztRQUVuQyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztZQUNyQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7U0FDeEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM0lELDRDQTJJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogZXZlbnRicmlkZ2Utc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBFdmVudEJyaWRnZSBzdGFjayBmb3IgbW9uaXRvcmluZyBzZWN1cml0eSBncm91cCBjaGFuZ2VzLlxuICogQ3JlYXRlcyBFdmVudEJyaWRnZSBydWxlcyBhbmQgdGFyZ2V0cyB0byBkZXRlY3Qgc2VjdXJpdHkgZ3JvdXAgbW9kaWZpY2F0aW9ucy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRXZlbnRCcmlkZ2VTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcbiAgc2VjdXJpdHlHcm91cElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgc25zVG9waWNBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50QnJpZGdlU3RhY2tPdXRwdXRzIHtcbiAgcnVsZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICB0YXJnZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgRXZlbnRCcmlkZ2VTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBydWxlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSB0YXJnZXRJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBFdmVudEJyaWRnZVN0YWNrQXJncyxcbiAgICBvcHRzPzogUmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCd0YXA6ZXZlbnRicmlkZ2U6RXZlbnRCcmlkZ2VTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzLnRhZ3MgfHwge307XG5cbiAgICAvLyBDcmVhdGUgRXZlbnRCcmlkZ2UgcnVsZSB0byBtb25pdG9yIHNlY3VyaXR5IGdyb3VwIGNoYW5nZXNcbiAgICBjb25zdCBzZWN1cml0eUdyb3VwTW9uaXRvclJ1bGUgPSBuZXcgYXdzLmNsb3Vkd2F0Y2guRXZlbnRSdWxlKFxuICAgICAgYHRhcC1zZy1tb25pdG9yLXJ1bGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLXNnLW1vbml0b3ItcnVsZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlc2NyaXB0aW9uOiBgTW9uaXRvciBzZWN1cml0eSBncm91cCBjaGFuZ2VzIGZvciBUQVAgLSAke2Vudmlyb25tZW50U3VmZml4fWAsXG5cbiAgICAgICAgLy8gRXZlbnQgcGF0dGVybiB0byBkZXRlY3Qgc2VjdXJpdHkgZ3JvdXAgbW9kaWZpY2F0aW9uc1xuICAgICAgICBldmVudFBhdHRlcm46IHB1bHVtaS5pbnRlcnBvbGF0ZWB7XG4gICAgICAgIFwic291cmNlXCI6IFtcImF3cy5lYzJcIl0sXG4gICAgICAgIFwiZGV0YWlsLXR5cGVcIjogW1wiQVdTIEFQSSBDYWxsIHZpYSBDbG91ZFRyYWlsXCJdLFxuICAgICAgICBcImRldGFpbFwiOiB7XG4gICAgICAgICAgXCJldmVudE5hbWVcIjogW1xuICAgICAgICAgICAgXCJBdXRob3JpemVTZWN1cml0eUdyb3VwSW5ncmVzc1wiLFxuICAgICAgICAgICAgXCJBdXRob3JpemVTZWN1cml0eUdyb3VwRWdyZXNzXCIsIFxuICAgICAgICAgICAgXCJSZXZva2VTZWN1cml0eUdyb3VwSW5ncmVzc1wiLFxuICAgICAgICAgICAgXCJSZXZva2VTZWN1cml0eUdyb3VwRWdyZXNzXCJcbiAgICAgICAgICBdLFxuICAgICAgICAgIFwicmVxdWVzdFBhcmFtZXRlcnNcIjoge1xuICAgICAgICAgICAgXCJncm91cElkXCI6IFtcIiR7YXJncy5zZWN1cml0eUdyb3VwSWR9XCJdXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9YCxcblxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1zZy1tb25pdG9yLXJ1bGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdTZWN1cml0eUdyb3VwTW9uaXRvcmluZycsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZSBmb3IgRXZlbnRCcmlkZ2UgdG8gcHVibGlzaCB0byBTTlNcbiAgICBjb25zdCBldmVudEJyaWRnZVJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYHRhcC1ldmVudGJyaWRnZS1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1ldmVudGJyaWRnZS1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnZXZlbnRzLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1ldmVudGJyaWRnZS1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnRXZlbnRCcmlkZ2VFeGVjdXRpb24nLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgSUFNIHBvbGljeSBmb3IgU05TIHB1Ymxpc2hpbmdcbiAgICBjb25zdCBzbnNQdWJsaXNoUG9saWN5ID0gbmV3IGF3cy5pYW0uUm9sZVBvbGljeShcbiAgICAgIGB0YXAtZXZlbnRicmlkZ2Utc25zLXBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtZXZlbnRicmlkZ2Utc25zLXBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHJvbGU6IGV2ZW50QnJpZGdlUm9sZS5pZCxcbiAgICAgICAgcG9saWN5OiBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgICAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgIFwiU3RhdGVtZW50XCI6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgICAgIFwic25zOlB1Ymxpc2hcIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIke2FyZ3Muc25zVG9waWNBcm59XCJcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1gLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIEV2ZW50QnJpZGdlIHRhcmdldCB0byBzZW5kIGFsZXJ0cyB0byBTTlNcbiAgICBjb25zdCBzbnNUYXJnZXQgPSBuZXcgYXdzLmNsb3Vkd2F0Y2guRXZlbnRUYXJnZXQoXG4gICAgICBgdGFwLXNnLW1vbml0b3ItdGFyZ2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcnVsZTogc2VjdXJpdHlHcm91cE1vbml0b3JSdWxlLm5hbWUsXG4gICAgICAgIHRhcmdldElkOiBgdGFwLXNnLW1vbml0b3ItdGFyZ2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgYXJuOiBhcmdzLnNuc1RvcGljQXJuLFxuICAgICAgICByb2xlQXJuOiBldmVudEJyaWRnZVJvbGUuYXJuLFxuXG4gICAgICAgIC8vIEN1c3RvbSBtZXNzYWdlIGZvciB0aGUgYWxlcnRcbiAgICAgICAgaW5wdXRUcmFuc2Zvcm1lcjoge1xuICAgICAgICAgIGlucHV0UGF0aHM6IHtcbiAgICAgICAgICAgIGV2ZW50TmFtZTogJyQuZGV0YWlsLmV2ZW50TmFtZScsXG4gICAgICAgICAgICBzb3VyY2VJcEFkZHJlc3M6ICckLmRldGFpbC5zb3VyY2VJUEFkZHJlc3MnLFxuICAgICAgICAgICAgdXNlcklkZW50aXR5OiAnJC5kZXRhaWwudXNlcklkZW50aXR5LnR5cGUnLFxuICAgICAgICAgICAgdXNlck5hbWU6ICckLmRldGFpbC51c2VySWRlbnRpdHkudXNlck5hbWUnLFxuICAgICAgICAgICAgZXZlbnRUaW1lOiAnJC5kZXRhaWwuZXZlbnRUaW1lJyxcbiAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBJZDogJyQuZGV0YWlsLnJlcXVlc3RQYXJhbWV0ZXJzLmdyb3VwSWQnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaW5wdXRUZW1wbGF0ZTogcHVsdW1pLmludGVycG9sYXRlYHtcbiAgICAgICAgICBcImFsZXJ0XCI6IFwiU0VDVVJJVFkgQUxFUlQ6IFNlY3VyaXR5IEdyb3VwIE1vZGlmaWVkXCIsXG4gICAgICAgICAgXCJlbnZpcm9ubWVudFwiOiBcIiR7ZW52aXJvbm1lbnRTdWZmaXh9XCIsXG4gICAgICAgICAgXCJldmVudFwiOiBcIjxldmVudE5hbWU+XCIsXG4gICAgICAgICAgXCJzZWN1cml0eUdyb3VwSWRcIjogXCI8c2VjdXJpdHlHcm91cElkPlwiLFxuICAgICAgICAgIFwic291cmNlSVBcIjogXCI8c291cmNlSXBBZGRyZXNzPlwiLFxuICAgICAgICAgIFwidXNlclR5cGVcIjogXCI8dXNlcklkZW50aXR5PlwiLFxuICAgICAgICAgIFwidXNlck5hbWVcIjogXCI8dXNlck5hbWU+XCIsXG4gICAgICAgICAgXCJ0aW1lc3RhbXBcIjogXCI8ZXZlbnRUaW1lPlwiLFxuICAgICAgICAgIFwibWVzc2FnZVwiOiBcIlRoZSBtb25pdG9yZWQgc2VjdXJpdHkgZ3JvdXAgaGFzIGJlZW4gbW9kaWZpZWQuIFBsZWFzZSByZXZpZXcgdGhlIGNoYW5nZXMgaW1tZWRpYXRlbHkuXCIsXG4gICAgICAgICAgXCJhY3Rpb25SZXF1aXJlZFwiOiBcIlZlcmlmeSBpZiB0aGlzIGNoYW5nZSB3YXMgYXV0aG9yaXplZCBhbmQgY29tcGxpZXMgd2l0aCBzZWN1cml0eSBwb2xpY2llcy5cIlxuICAgICAgICB9YCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbc25zUHVibGlzaFBvbGljeV0gfVxuICAgICk7XG5cbiAgICB0aGlzLnJ1bGVBcm4gPSBzZWN1cml0eUdyb3VwTW9uaXRvclJ1bGUuYXJuO1xuICAgIHRoaXMudGFyZ2V0SWQgPSBzbnNUYXJnZXQudGFyZ2V0SWQ7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBydWxlQXJuOiB0aGlzLnJ1bGVBcm4sXG4gICAgICB0YXJnZXRJZDogdGhpcy50YXJnZXRJZCxcbiAgICB9KTtcbiAgfVxufVxuIl19