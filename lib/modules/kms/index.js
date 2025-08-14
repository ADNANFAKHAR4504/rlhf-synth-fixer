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
        // Get account ID first
        const accountId = aws.getCallerIdentity().then(id => id.accountId);
        // Create key policy using pulumi.all to properly handle the Output
        const keyPolicy = pulumi.all([accountId]).apply(([accountId]) => ({
            Version: '2012-10-17',
            Statement: [
                {
                    Sid: 'Enable IAM User Permissions',
                    Effect: 'Allow',
                    Principal: {
                        AWS: `arn:aws:iam::${accountId}:root`,
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
        }));
        this.key = new aws.kms.Key(`${name}-key`, {
            description: args.description,
            keyUsage: args.keyUsage || 'ENCRYPT_DECRYPT',
            policy: keyPolicy.apply(policy => JSON.stringify(policy)),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQVEvQyxNQUFhLE1BQU8sU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ2xDLEdBQUcsQ0FBYztJQUNqQixLQUFLLENBQWdCO0lBRXJDLFlBQ0UsSUFBWSxFQUNaLElBQWdCLEVBQ2hCLElBQXNDO1FBRXRDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWhELHVCQUF1QjtRQUN2QixNQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFbkUsbUVBQW1FO1FBQ25FLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDaEUsT0FBTyxFQUFFLFlBQVk7WUFDckIsU0FBUyxFQUFFO2dCQUNUO29CQUNFLEdBQUcsRUFBRSw2QkFBNkI7b0JBQ2xDLE1BQU0sRUFBRSxPQUFPO29CQUNmLFNBQVMsRUFBRTt3QkFDVCxHQUFHLEVBQUUsZ0JBQWdCLFNBQVMsT0FBTztxQkFDdEM7b0JBQ0QsTUFBTSxFQUFFLE9BQU87b0JBQ2YsUUFBUSxFQUFFLEdBQUc7aUJBQ2Q7Z0JBQ0Q7b0JBQ0UsR0FBRyxFQUFFLGtDQUFrQztvQkFDdkMsTUFBTSxFQUFFLE9BQU87b0JBQ2YsU0FBUyxFQUFFO3dCQUNULE9BQU8sRUFBRSwwQkFBMEI7cUJBQ3BDO29CQUNELE1BQU0sRUFBRTt3QkFDTixzQkFBc0I7d0JBQ3RCLGlCQUFpQjt3QkFDakIsYUFBYTt3QkFDYixnQkFBZ0I7d0JBQ2hCLGFBQWE7cUJBQ2Q7b0JBQ0QsUUFBUSxFQUFFLEdBQUc7aUJBQ2Q7Z0JBQ0Q7b0JBQ0UsR0FBRyxFQUFFLGlDQUFpQztvQkFDdEMsTUFBTSxFQUFFLE9BQU87b0JBQ2YsU0FBUyxFQUFFO3dCQUNULE9BQU8sRUFBRSxrQkFBa0I7cUJBQzVCO29CQUNELE1BQU0sRUFBRSxDQUFDLHFCQUFxQixFQUFFLGFBQWEsQ0FBQztvQkFDOUMsUUFBUSxFQUFFLEdBQUc7aUJBQ2Q7YUFDRjtTQUNGLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUN4QixHQUFHLElBQUksTUFBTSxFQUNiO1lBQ0UsV0FBVyxFQUFFLElBQUksQ0FBQyxXQUFXO1lBQzdCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUSxJQUFJLGlCQUFpQjtZQUM1QyxNQUFNLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDekQsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixvQkFBb0IsRUFBRSxFQUFFO1lBQ3hCLElBQUksRUFBRSxFQUFFLEdBQUcsaUJBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7U0FDdEMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FDNUIsR0FBRyxJQUFJLFFBQVEsRUFDZjtZQUNFLElBQUksRUFBRSxTQUFTLElBQUksRUFBRTtZQUNyQixXQUFXLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLO1NBQzVCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLEtBQUssRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUs7WUFDckIsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRztZQUNwQixTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO1NBQzNCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWxGRCx3QkFrRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgS01TS2V5QXJncyB7XG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gIGtleVVzYWdlPzogc3RyaW5nO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIEtNU0tleSBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBrZXk6IGF3cy5rbXMuS2V5O1xuICBwdWJsaWMgcmVhZG9ubHkgYWxpYXM6IGF3cy5rbXMuQWxpYXM7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEtNU0tleUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpLTVNLZXknLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBHZXQgYWNjb3VudCBJRCBmaXJzdFxuICAgIGNvbnN0IGFjY291bnRJZCA9IGF3cy5nZXRDYWxsZXJJZGVudGl0eSgpLnRoZW4oaWQgPT4gaWQuYWNjb3VudElkKTtcblxuICAgIC8vIENyZWF0ZSBrZXkgcG9saWN5IHVzaW5nIHB1bHVtaS5hbGwgdG8gcHJvcGVybHkgaGFuZGxlIHRoZSBPdXRwdXRcbiAgICBjb25zdCBrZXlQb2xpY3kgPSBwdWx1bWkuYWxsKFthY2NvdW50SWRdKS5hcHBseSgoW2FjY291bnRJZF0pID0+ICh7XG4gICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAge1xuICAgICAgICAgIFNpZDogJ0VuYWJsZSBJQU0gVXNlciBQZXJtaXNzaW9ucycsXG4gICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgQVdTOiBgYXJuOmF3czppYW06OiR7YWNjb3VudElkfTpyb290YCxcbiAgICAgICAgICB9LFxuICAgICAgICAgIEFjdGlvbjogJ2ttczoqJyxcbiAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgU2lkOiAnQWxsb3cgQ2xvdWRUcmFpbCB0byBlbmNyeXB0IGxvZ3MnLFxuICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgQWN0aW9uOiBbXG4gICAgICAgICAgICAna21zOkdlbmVyYXRlRGF0YUtleSonLFxuICAgICAgICAgICAgJ2ttczpEZXNjcmliZUtleScsXG4gICAgICAgICAgICAna21zOkVuY3J5cHQnLFxuICAgICAgICAgICAgJ2ttczpSZUVuY3J5cHQqJyxcbiAgICAgICAgICAgICdrbXM6RGVjcnlwdCcsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgU2lkOiAnQWxsb3cgUzMgc2VydmljZSB0byB1c2UgdGhlIGtleScsXG4gICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgU2VydmljZTogJ3MzLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgQWN0aW9uOiBbJ2ttczpHZW5lcmF0ZURhdGFLZXknLCAna21zOkRlY3J5cHQnXSxcbiAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KSk7XG5cbiAgICB0aGlzLmtleSA9IG5ldyBhd3Mua21zLktleShcbiAgICAgIGAke25hbWV9LWtleWAsXG4gICAgICB7XG4gICAgICAgIGRlc2NyaXB0aW9uOiBhcmdzLmRlc2NyaXB0aW9uLFxuICAgICAgICBrZXlVc2FnZTogYXJncy5rZXlVc2FnZSB8fCAnRU5DUllQVF9ERUNSWVBUJyxcbiAgICAgICAgcG9saWN5OiBrZXlQb2xpY3kuYXBwbHkocG9saWN5ID0+IEpTT04uc3RyaW5naWZ5KHBvbGljeSkpLFxuICAgICAgICBlbmFibGVLZXlSb3RhdGlvbjogdHJ1ZSxcbiAgICAgICAgZGVsZXRpb25XaW5kb3dJbkRheXM6IDMwLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5hbGlhcyA9IG5ldyBhd3Mua21zLkFsaWFzKFxuICAgICAgYCR7bmFtZX0tYWxpYXNgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgYWxpYXMvJHtuYW1lfWAsXG4gICAgICAgIHRhcmdldEtleUlkOiB0aGlzLmtleS5rZXlJZCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGtleUlkOiB0aGlzLmtleS5rZXlJZCxcbiAgICAgIGtleUFybjogdGhpcy5rZXkuYXJuLFxuICAgICAgYWxpYXNOYW1lOiB0aGlzLmFsaWFzLm5hbWUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==