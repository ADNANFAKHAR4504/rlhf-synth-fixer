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
const pulumi = __importStar(require("@pulumi/pulumi"));
// Set up Pulumi runtime mocks globally
pulumi.runtime.setMocks({
    newResource: (args) => {
        const { type, name, inputs } = args;
        return {
            id: `${name}-id`,
            state: {
                ...inputs,
                name: inputs.name || name,
                arn: `arn:aws:${type}:us-east-1:123456789012:${name}`,
                invokeArn: type.includes('lambda')
                    ? `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${name}/invocations`
                    : undefined,
            },
        };
    },
    call: (args) => {
        return args;
    },
});
// Mock interpolate function
pulumi.interpolate = (strings, ...values) => {
    const result = strings.reduce((acc, str, i) => {
        return acc + str + (values[i] || '');
    }, '');
    return pulumi.Output.create(result);
};
// Mock all function
pulumi.all = (values) => {
    return pulumi.Output.create(values);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVEQUF5QztBQUV6Qyx1Q0FBdUM7QUFDdkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDdEIsV0FBVyxFQUFFLENBQUMsSUFBcUMsRUFBRSxFQUFFO1FBQ3JELE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQztRQUNwQyxPQUFPO1lBQ0wsRUFBRSxFQUFFLEdBQUcsSUFBSSxLQUFLO1lBQ2hCLEtBQUssRUFBRTtnQkFDTCxHQUFHLE1BQU07Z0JBQ1QsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSTtnQkFDekIsR0FBRyxFQUFFLFdBQVcsSUFBSSwyQkFBMkIsSUFBSSxFQUFFO2dCQUNyRCxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7b0JBQ2hDLENBQUMsQ0FBQyxnSEFBZ0gsSUFBSSxjQUFjO29CQUNwSSxDQUFDLENBQUMsU0FBUzthQUNkO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFDRCxJQUFJLEVBQUUsQ0FBQyxJQUFpQyxFQUFFLEVBQUU7UUFDMUMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsNEJBQTRCO0FBQzNCLE1BQWMsQ0FBQyxXQUFXLEdBQUcsQ0FDNUIsT0FBNkIsRUFDN0IsR0FBRyxNQUFhLEVBQ2hCLEVBQUU7SUFDRixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM1QyxPQUFPLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1AsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUM7QUFFRixvQkFBb0I7QUFDbkIsTUFBYyxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQWEsRUFBRSxFQUFFO0lBQ3RDLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuLy8gU2V0IHVwIFB1bHVtaSBydW50aW1lIG1vY2tzIGdsb2JhbGx5XG5wdWx1bWkucnVudGltZS5zZXRNb2Nrcyh7XG4gIG5ld1Jlc291cmNlOiAoYXJnczogcHVsdW1pLnJ1bnRpbWUuTW9ja1Jlc291cmNlQXJncykgPT4ge1xuICAgIGNvbnN0IHsgdHlwZSwgbmFtZSwgaW5wdXRzIH0gPSBhcmdzO1xuICAgIHJldHVybiB7XG4gICAgICBpZDogYCR7bmFtZX0taWRgLFxuICAgICAgc3RhdGU6IHtcbiAgICAgICAgLi4uaW5wdXRzLFxuICAgICAgICBuYW1lOiBpbnB1dHMubmFtZSB8fCBuYW1lLFxuICAgICAgICBhcm46IGBhcm46YXdzOiR7dHlwZX06dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjoke25hbWV9YCxcbiAgICAgICAgaW52b2tlQXJuOiB0eXBlLmluY2x1ZGVzKCdsYW1iZGEnKVxuICAgICAgICAgID8gYGFybjphd3M6YXBpZ2F0ZXdheTp1cy1lYXN0LTE6bGFtYmRhOnBhdGgvMjAxNS0wMy0zMS9mdW5jdGlvbnMvYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjpmdW5jdGlvbjoke25hbWV9L2ludm9jYXRpb25zYFxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuICBjYWxsOiAoYXJnczogcHVsdW1pLnJ1bnRpbWUuTW9ja0NhbGxBcmdzKSA9PiB7XG4gICAgcmV0dXJuIGFyZ3M7XG4gIH0sXG59KTtcblxuLy8gTW9jayBpbnRlcnBvbGF0ZSBmdW5jdGlvblxuKHB1bHVtaSBhcyBhbnkpLmludGVycG9sYXRlID0gKFxuICBzdHJpbmdzOiBUZW1wbGF0ZVN0cmluZ3NBcnJheSxcbiAgLi4udmFsdWVzOiBhbnlbXVxuKSA9PiB7XG4gIGNvbnN0IHJlc3VsdCA9IHN0cmluZ3MucmVkdWNlKChhY2MsIHN0ciwgaSkgPT4ge1xuICAgIHJldHVybiBhY2MgKyBzdHIgKyAodmFsdWVzW2ldIHx8ICcnKTtcbiAgfSwgJycpO1xuICByZXR1cm4gcHVsdW1pLk91dHB1dC5jcmVhdGUocmVzdWx0KTtcbn07XG5cbi8vIE1vY2sgYWxsIGZ1bmN0aW9uXG4ocHVsdW1pIGFzIGFueSkuYWxsID0gKHZhbHVlczogYW55W10pID0+IHtcbiAgcmV0dXJuIHB1bHVtaS5PdXRwdXQuY3JlYXRlKHZhbHVlcyk7XG59O1xuIl19