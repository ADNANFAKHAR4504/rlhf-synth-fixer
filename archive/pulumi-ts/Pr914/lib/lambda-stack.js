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
exports.LambdaStack = void 0;
/**
 * lambda-stack.ts
 *
 * This module defines the Lambda function with least privilege IAM role for secure document processing.
 * Function runs in private subnets and has minimal required permissions.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class LambdaStack extends pulumi.ComponentResource {
    function;
    role;
    functionUrl;
    constructor(name, args, opts) {
        super('tap:lambda:LambdaStack', name, args, opts);
        const { environmentSuffix, bucketArn, bucketName, privateSubnetIds, vpcSecurityGroupId, logGroupArn, tags, } = args;
        this.role = new aws.iam.Role(`lambda-execution-role-${environmentSuffix}`, {
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'lambda.amazonaws.com',
                        },
                    },
                ],
            }),
            tags: {
                Name: `lambda-execution-role-${environmentSuffix}`,
                Purpose: 'Lambda execution with least privilege',
                ...tags,
            },
        }, { parent: this });
        const lambdaPolicy = new aws.iam.RolePolicy(`lambda-policy-${environmentSuffix}`, {
            role: this.role.id,
            policy: pulumi
                .all([bucketArn, logGroupArn])
                .apply(([bucketArn, logGroupArn]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'S3BucketAccess',
                        Effect: 'Allow',
                        Action: ['s3:PutObject', 's3:PutObjectAcl'],
                        Resource: `${bucketArn}/*`,
                    },
                    {
                        Sid: 'CloudWatchLogsAccess',
                        Effect: 'Allow',
                        Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
                        Resource: `${logGroupArn}:*`,
                    },
                    {
                        Sid: 'VPCAccess',
                        Effect: 'Allow',
                        Action: [
                            'ec2:CreateNetworkInterface',
                            'ec2:DescribeNetworkInterfaces',
                            'ec2:DeleteNetworkInterface',
                            'ec2:AttachNetworkInterface',
                            'ec2:DetachNetworkInterface',
                        ],
                        Resource: '*',
                    },
                ],
            })),
        }, { parent: this });
        const lambdaCode = fs.readFileSync(path.join(__dirname, 'lambdas', 'document-processor.js'), 'utf8');
        this.function = new aws.lambda.Function(`doc-processor-${environmentSuffix}`, {
            code: new pulumi.asset.AssetArchive({
                'index.js': new pulumi.asset.StringAsset(lambdaCode),
                'package.json': new pulumi.asset.StringAsset(JSON.stringify({
                    name: 'document-processor',
                    version: '1.0.0',
                    description: 'Secure document processing Lambda function',
                    main: 'index.js',
                    dependencies: {
                        '@aws-sdk/client-s3': '^3.0.0',
                    },
                }, null, 2)),
            }),
            handler: 'index.handler',
            role: this.role.arn,
            runtime: aws.lambda.Runtime.NodeJS20dX,
            architectures: ['x86_64'],
            timeout: 30,
            memorySize: 256,
            environment: {
                variables: {
                    BUCKET_NAME: bucketName,
                    NODE_OPTIONS: '--enable-source-maps',
                },
            },
            vpcConfig: {
                subnetIds: privateSubnetIds,
                securityGroupIds: [vpcSecurityGroupId],
            },
            tags: {
                Name: `doc-processor-${environmentSuffix}`,
                Purpose: 'Secure document processing',
                Runtime: 'nodejs20.x',
                ...tags,
            },
        }, {
            parent: this,
            dependsOn: [lambdaPolicy],
        });
        this.functionUrl = new aws.lambda.FunctionUrl(`lambda-url-${environmentSuffix}`, {
            functionName: this.function.name,
            authorizationType: 'NONE',
            cors: {
                allowCredentials: true,
                allowMethods: ['POST'],
                allowOrigins: ['*'],
                allowHeaders: ['content-type', 'x-request-id'],
                exposeHeaders: ['x-request-id'],
                maxAge: 86400,
            },
        }, { parent: this });
        this.registerOutputs({
            functionName: this.function.name,
            functionArn: this.function.arn,
            functionId: this.function.id,
            roleArn: this.role.arn,
            roleName: this.role.name,
            roleId: this.role.id,
            functionUrl: this.functionUrl.functionUrl,
            functionUrlId: this.functionUrl.id,
        });
    }
}
exports.LambdaStack = LambdaStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQUV6Qyx1Q0FBeUI7QUFDekIsMkNBQTZCO0FBWTdCLE1BQWEsV0FBWSxTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDdkMsUUFBUSxDQUFzQjtJQUM5QixJQUFJLENBQWU7SUFDbkIsV0FBVyxDQUF5QjtJQUVwRCxZQUFZLElBQVksRUFBRSxJQUFxQixFQUFFLElBQXNCO1FBQ3JFLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRWxELE1BQU0sRUFDSixpQkFBaUIsRUFDakIsU0FBUyxFQUNULFVBQVUsRUFDVixnQkFBZ0IsRUFDaEIsa0JBQWtCLEVBQ2xCLFdBQVcsRUFDWCxJQUFJLEdBQ0wsR0FBRyxJQUFJLENBQUM7UUFFVCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQzFCLHlCQUF5QixpQkFBaUIsRUFBRSxFQUM1QztZQUNFLGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLGdCQUFnQjt3QkFDeEIsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFOzRCQUNULE9BQU8sRUFBRSxzQkFBc0I7eUJBQ2hDO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQztZQUNGLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUseUJBQXlCLGlCQUFpQixFQUFFO2dCQUNsRCxPQUFPLEVBQUUsdUNBQXVDO2dCQUNoRCxHQUFHLElBQUk7YUFDUjtTQUNGLEVBQ0QsRUFBRSxN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QyxFQUFFO1NBQ25DLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZLRCxrQ0F1S0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIGxhbWJkYS1zdGFjay50c1xuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIExhbWJkYSBmdW5jdGlvbiB3aXRoIGxlYXN0IHByaXZpbGVnZSBJQU0gcm9sZSBmb3Igc2VjdXJlIGRvY3VtZW50IHByb2Nlc3NpbmcuXG4gKiBGdW5jdGlvbiBydW5zIGluIHByaXZhdGUgc3VibmV0cyBhbmQgaGFzIG1pbmltYWwgcmVxdWlyZWQgcGVybWlzc2lvbnMuXG4gKi9cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGludGVyZmFjZSBMYW1iZGFTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICBidWNrZXRBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBidWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLklucHV0PHN0cmluZz5bXTtcbiAgdnBjU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgbG9nR3JvdXBBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xufVxuXG5leHBvcnQgY2xhc3MgTGFtYmRhU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgZnVuY3Rpb246IGF3cy5sYW1iZGEuRnVuY3Rpb247XG4gIHB1YmxpYyByZWFkb25seSByb2xlOiBhd3MuaWFtLlJvbGU7XG4gIHB1YmxpYyByZWFkb25seSBmdW5jdGlvblVybDogYXdzLmxhbWJkYS5GdW5jdGlvblVybDtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IExhbWJkYVN0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6bGFtYmRhOkxhbWJkYVN0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCB7XG4gICAgICBlbnZpcm9ubWVudFN1ZmZpeCxcbiAgICAgIGJ1Y2tldEFybixcbiAgICAgIGJ1Y2tldE5hbWUsXG4gICAgICBwcml2YXRlU3VibmV0SWRzLFxuICAgICAgdnBjU2VjdXJpdHlHcm91cElkLFxuICAgICAgbG9nR3JvdXBBcm4sXG4gICAgICB0YWdzLFxuICAgIH0gPSBhcmdzO1xuXG4gICAgdGhpcy5yb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgIGBsYW1iZGEtZXhlY3V0aW9uLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ2xhbWJkYS5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgbGFtYmRhLWV4ZWN1dGlvbi1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnTGFtYmRhIGV4ZWN1dGlvbiB3aXRoIGxlYXN0IHByaXZpbGVnZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIGNvbnN0IGxhbWJkYVBvbGljeSA9IG5ldyBhd3MuaWFtLlJvbGVQb2xpY3koXG4gICAgICBgbGFtYmRhLXBvbGljeS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IHRoaXMucm9sZS5pZCxcbiAgICAgICAgcG9saWN5OiBwdWx1bWlcbiAgICAgICAgICAuYWxsKFtidWNrZXRBcm4sIGxvZ0dyb3VwQXJuXSlcbiAgICAgICAgICAuYXBwbHkoKFtidWNrZXRBcm4sIGxvZ0dyb3VwQXJuXSkgPT5cbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBTaWQ6ICdTM0J1Y2tldEFjY2VzcycsXG4gICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICBBY3Rpb246IFsnczM6UHV0T2JqZWN0JywgJ3MzOlB1dE9iamVjdEFjbCddLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IGAke2J1Y2tldEFybn0vKmAsXG4gICAgICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFNpZDogJ0Nsb3VkV2F0Y2hMb2dzQWNjZXNzJyxcbiAgICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICAgIEFjdGlvbjogWydsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsICdsb2dzOlB1dExvZ0V2ZW50cyddLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IGAke2xvZ0dyb3VwQXJufToqYCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIFNpZDogJ1ZQQ0FjY2VzcycsXG4gICAgICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgICAgICBBY3Rpb246IFtcbiAgICAgICAgICAgICAgICAgICAgJ2VjMjpDcmVhdGVOZXR3b3JrSW50ZXJmYWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJ2VjMjpEZXNjcmliZU5ldHdvcmtJbnRlcmZhY2VzJyxcbiAgICAgICAgICAgICAgICAgICAgJ2VjMjpEZWxldGVOZXR3b3JrSW50ZXJmYWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJ2VjMjpBdHRhY2hOZXR3b3JrSW50ZXJmYWNlJyxcbiAgICAgICAgICAgICAgICAgICAgJ2VjMjpEZXRhY2hOZXR3b3JrSW50ZXJmYWNlJyxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICBSZXNvdXJjZTogJyonLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBjb25zdCBsYW1iZGFDb2RlID0gZnMucmVhZEZpbGVTeW5jKFxuICAgICAgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2xhbWJkYXMnLCAnZG9jdW1lbnQtcHJvY2Vzc29yLmpzJyksXG4gICAgICAndXRmOCdcbiAgICApO1xuXG4gICAgdGhpcy5mdW5jdGlvbiA9IG5ldyBhd3MubGFtYmRhLkZ1bmN0aW9uKFxuICAgICAgYGRvYy1wcm9jZXNzb3ItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBjb2RlOiBuZXcgcHVsdW1pLmFzc2V0LkFzc2V0QXJjaGl2ZSh7XG4gICAgICAgICAgJ2luZGV4LmpzJzogbmV3IHB1bHVtaS5hc3NldC5TdHJpbmdBc3NldChsYW1iZGFDb2RlKSxcbiAgICAgICAgICAncGFja2FnZS5qc29uJzogbmV3IHB1bHVtaS5hc3NldC5TdHJpbmdBc3NldChcbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ2RvY3VtZW50LXByb2Nlc3NvcicsXG4gICAgICAgICAgICAgICAgdmVyc2lvbjogJzEuMC4wJyxcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ1NlY3VyZSBkb2N1bWVudCBwcm9jZXNzaW5nIExhbWJkYSBmdW5jdGlvbicsXG4gICAgICAgICAgICAgICAgbWFpbjogJ2luZGV4LmpzJyxcbiAgICAgICAgICAgICAgICBkZXBlbmRlbmNpZXM6IHtcbiAgICAgICAgICAgICAgICAgICdAYXdzLXNkay9jbGllbnQtczMnOiAnXjMuMC4wJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAyXG4gICAgICAgICAgICApXG4gICAgICAgICAgKSxcbiAgICAgICAgfSksXG4gICAgICAgIGhhbmRsZXI6ICdpbmRleC5oYW5kbGVyJyxcbiAgICAgICAgcm9sZTogdGhpcy5yb2xlLmFybixcbiAgICAgICAgcnVudGltZTogYXdzLmxhbWJkYS5SdW50aW1lLk5vZGVKUzIwZFgsXG4gICAgICAgIGFyY2hpdGVjdHVyZXM6IFsneDg2XzY0J10sXG4gICAgICAgIHRpbWVvdXQ6IDMwLFxuICAgICAgICBtZW1vcnlTaXplOiAyNTYsXG4gICAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgICAgdmFyaWFibGVzOiB7XG4gICAgICAgICAgICBCVUNLRVRfTkFNRTogYnVja2V0TmFtZSxcbiAgICAgICAgICAgIE5PREVfT1BUSU9OUzogJy0tZW5hYmxlLXNvdXJjZS1tYXBzJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB2cGNDb25maWc6IHtcbiAgICAgICAgICBzdWJuZXRJZHM6IHByaXZhdGVTdWJuZXRJZHMsXG4gICAgICAgICAgc2VjdXJpdHlHcm91cElkczogW3ZwY1NlY3VyaXR5R3JvdXBJZF0sXG4gICAgICAgIH0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgZG9jLXByb2Nlc3Nvci0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ1NlY3VyZSBkb2N1bWVudCBwcm9jZXNzaW5nJyxcbiAgICAgICAgICBSdW50aW1lOiAnbm9kZWpzMjAueCcsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgZGVwZW5kc09uOiBbbGFtYmRhUG9saWN5XSxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgdGhpcy5mdW5jdGlvblVybCA9IG5ldyBhd3MubGFtYmRhLkZ1bmN0aW9uVXJsKFxuICAgICAgYGxhbWJkYS11cmwtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBmdW5jdGlvbk5hbWU6IHRoaXMuZnVuY3Rpb24ubmFtZSxcbiAgICAgICAgYXV0aG9yaXphdGlvblR5cGU6ICdOT05FJyxcbiAgICAgICAgY29yczoge1xuICAgICAgICAgIGFsbG93Q3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgYWxsb3dNZXRob2RzOiBbJ1BPU1QnXSxcbiAgICAgICAgICBhbGxvd09yaWdpbnM6IFsnKiddLFxuICAgICAgICAgIGFsbG93SGVhZGVyczogWydjb250ZW50LXR5cGUnLCAneC1yZXF1ZXN0LWlkJ10sXG4gICAgICAgICAgZXhwb3NlSGVhZGVyczogWyd4LXJlcXVlc3QtaWQnXSxcbiAgICAgICAgICBtYXhBZ2U6IDg2NDAwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgZnVuY3Rpb25OYW1lOiB0aGlzLmZ1bmN0aW9uLm5hbWUsXG4gICAgICBmdW5jdGlvbkFybjogdGhpcy5mdW5jdGlvbi5hcm4sXG4gICAgICBmdW5jdGlvbklkOiB0aGlzLmZ1bmN0aW9uLmlkLFxuICAgICAgcm9sZUFybjogdGhpcy5yb2xlLmFybixcbiAgICAgIHJvbGVOYW1lOiB0aGlzLnJvbGUubmFtZSxcbiAgICAgIHJvbGVJZDogdGhpcy5yb2xlLmlkLFxuICAgICAgZnVuY3Rpb25Vcmw6IHRoaXMuZnVuY3Rpb25VcmwuZnVuY3Rpb25VcmwsXG4gICAgICBmdW5jdGlvblVybElkOiB0aGlzLmZ1bmN0aW9uVXJsLmlkLFxuICAgIH0pO1xuICB9XG59XG4iXX0=