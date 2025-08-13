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
exports.KMSKey = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tags_1 = require("../../config/tags");
class KMSKey extends pulumi.ComponentResource {
    key;
    alias;
    constructor(name, args, opts) {
        super('custom:security:KMSKey', name, {}, opts);
        const keyPolicy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'Enable IAM User Permissions',
                    Effect: 'Allow',
                    Principal: {
                        AWS: pulumi.interpolate `arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`,
                    },
                    Action: 'kms:*',
                    Resource: '*',
                },
                {
                    Sid: 'Allow CloudTrail to encrypt logs',
                    Effect: 'Allow',
                    Principal: {
                        Service: 'cloudtrail.amazonaws.com',
                    },
                    Action: [
                        'kms:GenerateDataKey*',
                        'kms:DescribeKey',
                        'kms:Encrypt',
                        'kms:ReEncrypt*',
                        'kms:Decrypt',
                    ],
                    Resource: '*',
                },
                {
                    Sid: 'Allow S3 service to use the key',
                    Effect: 'Allow',
                    Principal: {
                        Service: 's3.amazonaws.com',
                    },
                    Action: ['kms:GenerateDataKey', 'kms:Decrypt'],
                    Resource: '*',
                },
            ],
        };
        this.key = new aws.kms.Key(`${name}-key`, {
            description: args.description,
            keyUsage: args.keyUsage || 'ENCRYPT_DECRYPT',
            policy: JSON.stringify(keyPolicy),
            enableKeyRotation: true,
            deletionWindowInDays: 30,
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        this.alias = new aws.kms.Alias(`${name}-alias`, {
            name: `alias/${name}`,
            targetKeyId: this.key.keyId,
        }, { parent: this });
        this.registerOutputs({
            keyId: this.key.keyId,
            keyArn: this.key.arn,
            aliasName: this.alias.name,
        });
    }
}
exports.KMSKey = KMSKey;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQVEvQyxNQUFhLE1BQU8sU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ2xDLEdBQUcsQ0FBYztJQUNqQixLQUFLLENBQWdCO0lBRXJDLFlBQ0UsSUFBWSxFQUNaLElBQWdCLEVBQ2hCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWhELE1BQU0sU0FBUyxHQUFHO1lBQ2hCLE9BQU8sRUFBRSxZQUFZO1lBQ3JCLFNBQVMsRUFBRTtnQkFDVDtvQkFDRSxHQUFHLEVBQUUsNkJBQTZCO29CQUNsQyxNQUFNLEVBQUUsT0FBTztvQkFDZixTQUFTLEVBQUU7d0JBQ1QsR0FBRyxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUEsZ0JBQWdCLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsT0FBTztxQkFDL0Y7b0JBQ0QsTUFBTSxFQUFFLE9BQU87b0JBQ2YsUUFBUSxFQUFFLEdBQUc7aUJBQ2Q7Z0JBQ0Q7b0JBQ0UsR0FBRyxFQUFFLGtDQUFrQztvQkFDdkMsTUFBTSxFQUFFLE9BQU87b0JBQ2YsU0FBUyxFQUFFO3dCQUNULE9BQU8sRUFBRSwwQkFBMEI7cUJBQ3BDO29CQUNELE1BQU0sRUFBRTt3QkFDTixzQkFBc0I7d0JBQ3RCLGlCQUFpQjt3QkFDakIsYUFBYTt3QkFDYixnQkFBZ0I7d0JBQ2hCLGFBQWE7cUJBQ2Q7b0JBQ0QsUUFBUSxFQUFFLEdBQUc7aUJBQ2Q7Z0JBQ0Q7b0JBQ0UsR0FBRyxFQUFFLGlDQUFpQztvQkFDdEMsTUFBTSxFQUFFLE9BQU87b0JBQ2YsU0FBUyxFQUFFO3dCQUNULE9BQU8sRUFBRSxrQkFBa0I7cUJBQzVCO29CQUNELE1BQU0sRUFBRSxDQUFDLHFCQUFxQixFQUFFLGFBQWEsQ0FBQztvQkFDOUMsUUFBUSxFQUFFLEdBQUc7aUJBQ2Q7YUFDRjtTQUNGLENBQUM7UUFFRixJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQ3hCLEdBQUcsSUFBSSxNQUFNLEVBQ2I7WUFDRSxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7WUFDN0IsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksaUJBQWlCO1lBQzVDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQztZQUNqQyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLG9CQUFvQixFQUFFLEVBQUU7WUFDeEIsSUFBSSxFQUFFLEVBQUUsR0FBRyxpQkFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtTQUN0QyxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUM1QixHQUFHLElBQUksUUFBUSxFQUNmO1lBQ0UsSUFBSSxFQUFFLFNBQVMsSUFBSSxFQUFFO1lBQ3JCLFdBQVcsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUs7U0FDNUIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSztZQUNyQixNQUFNLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHO1lBQ3BCLFNBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7U0FDM0IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBOUVELHdCQThFQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgY29tbW9uVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdzJztcblxuZXhwb3J0IGludGVyZmFjZSBLTVNLZXlBcmdzIHtcbiAgZGVzY3JpcHRpb246IHN0cmluZztcbiAga2V5VXNhZ2U/OiBzdHJpbmc7XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgS01TS2V5IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGtleTogYXdzLmttcy5LZXk7XG4gIHB1YmxpYyByZWFkb25seSBhbGlhczogYXdzLmttcy5BbGlhcztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogS01TS2V5QXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOnNlY3VyaXR5OktNU0tleScsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGtleVBvbGljeSA9IHtcbiAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICB7XG4gICAgICAgICAgU2lkOiAnRW5hYmxlIElBTSBVc2VyIFBlcm1pc3Npb25zJyxcbiAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICBBV1M6IHB1bHVtaS5pbnRlcnBvbGF0ZWBhcm46YXdzOmlhbTo6JHthd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKS50aGVuKGlkID0+IGlkLmFjY291bnRJZCl9OnJvb3RgLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgQWN0aW9uOiAna21zOionLFxuICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBTaWQ6ICdBbGxvdyBDbG91ZFRyYWlsIHRvIGVuY3J5cHQgbG9ncycsXG4gICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgU2VydmljZTogJ2Nsb3VkdHJhaWwuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICdrbXM6R2VuZXJhdGVEYXRhS2V5KicsXG4gICAgICAgICAgICAna21zOkRlc2NyaWJlS2V5JyxcbiAgICAgICAgICAgICdrbXM6RW5jcnlwdCcsXG4gICAgICAgICAgICAna21zOlJlRW5jcnlwdConLFxuICAgICAgICAgICAgJ2ttczpEZWNyeXB0JyxcbiAgICAgICAgICBdLFxuICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBTaWQ6ICdBbGxvdyBTMyBzZXJ2aWNlIHRvIHVzZSB0aGUga2V5JyxcbiAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICBTZXJ2aWNlOiAnczMuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBBY3Rpb246IFsna21zOkdlbmVyYXRlRGF0YUtleScsICdrbXM6RGVjcnlwdCddLFxuICAgICAgICAgIFJlc291cmNlOiAnKicsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG5cbiAgICB0aGlzLmtleSA9IG5ldyBhd3Mua21zLktleShcbiAgICAgIGAke25hbWV9LWtleWAsXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uLFxuICAgICAgICBrZXlVc2FnZTogYXJncy5rZXlVc2FnZSB8fCAnRU5DUllQVF9ERUNSWVBUJyxcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeShrZXlQb2xpY3kpLFxuICAgICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgICAgZGVsZXRpb25XaW5kb3dJbkRheXM6IDMwLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5hbGlhcyA9IG5ldyBhd3Mua21zLkFsaWFzKFxuICAgICAgYCR7bmFtZX0tYWxpYXNgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgYWxpYXMvJHtuYW1lfWAsXG4gICAgICAgIHRhcmdldEtleUlkOiB0aGlzLmtleS5rZXlJZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGtleUlkOiB0aGlzLmtleS5rZXlJZCxcbiAgICAgIGtleUFybjogdGhpcy5rZXkuYXJuLFxuICAgICAgYWxpYXNOYW1lOiB0aGlzLmFsaWFzLm5hbWUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==