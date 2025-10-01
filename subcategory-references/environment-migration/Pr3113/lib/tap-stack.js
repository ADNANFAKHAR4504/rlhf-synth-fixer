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
exports.TapStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const migration_stack_1 = require("./migration-stack");
class TapStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Get environment suffix from props, context, or use 'dev' as default
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const environmentSuffix = props?.environmentSuffix ||
            this.node.tryGetContext('environmentSuffix') ||
            'dev';
        // ? Add your stack instantiations here
        // ! Do NOT create resources directly in this stack.
        // ! Instead, create separate stacks for each resource type.
        new migration_stack_1.MigrationStack(this, 'MigrationStack', {
            bastionSourceIp: '0.0.0.0/0',
        });
    }
}
exports.TapStack = TapStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGFwLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUVuQyx1REFBbUQ7QUFTbkQsTUFBYSxRQUFTLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFDckMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFxQjtRQUM3RCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixzRUFBc0U7UUFDdEUsNkRBQTZEO1FBQzdELE1BQU0saUJBQWlCLEdBQ3JCLEtBQUssRUFBRSxpQkFBaUI7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUM7WUFDNUMsS0FBSyxDQUFDO1FBRVIsdUNBQXVDO1FBQ3ZDLG9EQUFvRDtRQUNwRCw0REFBNEQ7UUFDNUQsSUFBSSxnQ0FBYyxDQUFDLElBQUksRUFBRSxnQkFBZ0IsRUFBRTtZQUN6QyxlQUFlLEVBQUUsV0FBVztTQUM3QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFsQkQsNEJBa0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0IHsgTWlncmF0aW9uU3RhY2sgfSBmcm9tICcuL21pZ3JhdGlvbi1zdGFjayc7XG5cbi8vID8gSW1wb3J0IHlvdXIgc3RhY2tzIGhlcmVcbi8vIGltcG9ydCB7IE15U3RhY2sgfSBmcm9tICcuL215LXN0YWNrJztcblxuaW50ZXJmYWNlIFRhcFN0YWNrUHJvcHMgZXh0ZW5kcyBjZGsuU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgVGFwU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBwcm9wcz86IFRhcFN0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQsIHByb3BzKTtcblxuICAgIC8vIEdldCBlbnZpcm9ubWVudCBzdWZmaXggZnJvbSBwcm9wcywgY29udGV4dCwgb3IgdXNlICdkZXYnIGFzIGRlZmF1bHRcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPVxuICAgICAgcHJvcHM/LmVudmlyb25tZW50U3VmZml4IHx8XG4gICAgICB0aGlzLm5vZGUudHJ5R2V0Q29udGV4dCgnZW52aXJvbm1lbnRTdWZmaXgnKSB8fFxuICAgICAgJ2Rldic7XG5cbiAgICAvLyA/IEFkZCB5b3VyIHN0YWNrIGluc3RhbnRpYXRpb25zIGhlcmVcbiAgICAvLyAhIERvIE5PVCBjcmVhdGUgcmVzb3VyY2VzIGRpcmVjdGx5IGluIHRoaXMgc3RhY2suXG4gICAgLy8gISBJbnN0ZWFkLCBjcmVhdGUgc2VwYXJhdGUgc3RhY2tzIGZvciBlYWNoIHJlc291cmNlIHR5cGUuXG4gICAgbmV3IE1pZ3JhdGlvblN0YWNrKHRoaXMsICdNaWdyYXRpb25TdGFjaycsIHtcbiAgICAgIGJhc3Rpb25Tb3VyY2VJcDogJzAuMC4wLjAvMCcsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==