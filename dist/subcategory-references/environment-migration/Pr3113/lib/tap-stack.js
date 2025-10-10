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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGFwLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3ViY2F0ZWdvcnktcmVmZXJlbmNlcy9lbnZpcm9ubWVudC1taWdyYXRpb24vUHIzMTEzL2xpYi90YXAtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBRW5DLHVEQUFtRDtBQVNuRCxNQUFhLFFBQVMsU0FBUSxHQUFHLENBQUMsS0FBSztJQUNyQyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXFCO1FBQzdELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLHNFQUFzRTtRQUN0RSw2REFBNkQ7UUFDN0QsTUFBTSxpQkFBaUIsR0FDckIsS0FBSyxFQUFFLGlCQUFpQjtZQUN4QixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQztZQUM1QyxLQUFLLENBQUM7UUFFUix1Q0FBdUM7UUFDdkMsb0RBQW9EO1FBQ3BELDREQUE0RDtRQUM1RCxJQUFJLGdDQUFjLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQ3pDLGVBQWUsRUFBRSxXQUFXO1NBQzdCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWxCRCw0QkFrQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgeyBNaWdyYXRpb25TdGFjayB9IGZyb20gJy4vbWlncmF0aW9uLXN0YWNrJztcblxuLy8gPyBJbXBvcnQgeW91ciBzdGFja3MgaGVyZVxuLy8gaW1wb3J0IHsgTXlTdGFjayB9IGZyb20gJy4vbXktc3RhY2snO1xuXG5pbnRlcmZhY2UgVGFwU3RhY2tQcm9wcyBleHRlbmRzIGNkay5TdGFja1Byb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBUYXBTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogVGFwU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gR2V0IGVudmlyb25tZW50IHN1ZmZpeCBmcm9tIHByb3BzLCBjb250ZXh0LCBvciB1c2UgJ2RldicgYXMgZGVmYXVsdFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9XG4gICAgICBwcm9wcz8uZW52aXJvbm1lbnRTdWZmaXggfHxcbiAgICAgIHRoaXMubm9kZS50cnlHZXRDb250ZXh0KCdlbnZpcm9ubWVudFN1ZmZpeCcpIHx8XG4gICAgICAnZGV2JztcblxuICAgIC8vID8gQWRkIHlvdXIgc3RhY2sgaW5zdGFudGlhdGlvbnMgaGVyZVxuICAgIC8vICEgRG8gTk9UIGNyZWF0ZSByZXNvdXJjZXMgZGlyZWN0bHkgaW4gdGhpcyBzdGFjay5cbiAgICAvLyAhIEluc3RlYWQsIGNyZWF0ZSBzZXBhcmF0ZSBzdGFja3MgZm9yIGVhY2ggcmVzb3VyY2UgdHlwZS5cbiAgICBuZXcgTWlncmF0aW9uU3RhY2sodGhpcywgJ01pZ3JhdGlvblN0YWNrJywge1xuICAgICAgYmFzdGlvblNvdXJjZUlwOiAnMC4wLjAuMC8wJyxcbiAgICB9KTtcbiAgfVxufVxuIl19