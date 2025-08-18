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
const pulumiMock = pulumi;
pulumiMock.interpolate = (strings, ...values) => {
    const result = strings.reduce((acc, str, i) => {
        return acc + str + (values[i] || '');
    }, '');
    return pulumi.Output.create(result);
};
// Mock all function
pulumiMock.all = function (...args) {
    // If called with a single object, treat as Record<string, Input<T>>
    if (args.length === 1 &&
        typeof args[0] === 'object' &&
        !Array.isArray(args[0])) {
        return pulumi.Output.create(args[0]);
    }
    // If called with an array, treat as Input<T>[]
    if (args.length === 1 && Array.isArray(args[0])) {
        return pulumi.Output.create(args[0]);
    }
    // If called with multiple arguments, treat as Input<T1>, Input<T2>, ...
    return pulumi.Output.create(args);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0dXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzZXR1cC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVEQUF5QztBQUV6Qyx1Q0FBdUM7QUFDdkMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFDdEIsV0FBVyxFQUFFLENBQ1gsSUFBcUMsRUFDRixFQUFFO1FBQ3JDLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQztRQUNwQyxPQUFPO1lBQ0wsRUFBRSxFQUFFLEdBQUcsSUFBSSxLQUFLO1lBQ2hCLEtBQUssRUFBRTtnQkFDTCxHQUFHLE1BQU07Z0JBQ1QsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksSUFBSTtnQkFDekIsR0FBRyxFQUFFLFdBQVcsSUFBSSwyQkFBMkIsSUFBSSxFQUFFO2dCQUNyRCxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7b0JBQ2hDLENBQUMsQ0FBQyxnSEFBZ0gsSUFBSSxjQUFjO29CQUNwSSxDQUFDLENBQUMsU0FBUzthQUNkO1NBQ0YsQ0FBQztJQUNKLENBQUM7SUFDRCxJQUFJLEVBQUUsQ0FBQyxJQUFpQyxFQUFpQyxFQUFFO1FBQ3pFLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGLENBQUMsQ0FBQztBQVdILE1BQU0sVUFBVSxHQUFHLE1BQXlELENBQUM7QUFFN0UsVUFBVSxDQUFDLFdBQVcsR0FBRyxDQUN2QixPQUE2QixFQUM3QixHQUFHLE1BQWlCLEVBQ3BCLEVBQUU7SUFDRixNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM1QyxPQUFPLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDdkMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQ1AsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN0QyxDQUFDLENBQUM7QUFFRixvQkFBb0I7QUFDcEIsVUFBVSxDQUFDLEdBQUcsR0FBRyxVQUFVLEdBQUcsSUFBVztJQUN2QyxvRUFBb0U7SUFDcEUsSUFDRSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUM7UUFDakIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssUUFBUTtRQUMzQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3ZCLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFDRCwrQ0FBK0M7SUFDL0MsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDaEQsT0FBTyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBQ0Qsd0VBQXdFO0lBQ3hFLE9BQU8sTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDcEMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuLy8gU2V0IHVwIFB1bHVtaSBydW50aW1lIG1vY2tzIGdsb2JhbGx5XG5wdWx1bWkucnVudGltZS5zZXRNb2Nrcyh7XG4gIG5ld1Jlc291cmNlOiAoXG4gICAgYXJnczogcHVsdW1pLnJ1bnRpbWUuTW9ja1Jlc291cmNlQXJnc1xuICApOiBwdWx1bWkucnVudGltZS5Nb2NrUmVzb3VyY2VSZXN1bHQgPT4ge1xuICAgIGNvbnN0IHsgdHlwZSwgbmFtZSwgaW5wdXRzIH0gPSBhcmdzO1xuICAgIHJldHVybiB7XG4gICAgICBpZDogYCR7bmFtZX0taWRgLFxuICAgICAgc3RhdGU6IHtcbiAgICAgICAgLi4uaW5wdXRzLFxuICAgICAgICBuYW1lOiBpbnB1dHMubmFtZSB8fCBuYW1lLFxuICAgICAgICBhcm46IGBhcm46YXdzOiR7dHlwZX06dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjoke25hbWV9YCxcbiAgICAgICAgaW52b2tlQXJuOiB0eXBlLmluY2x1ZGVzKCdsYW1iZGEnKVxuICAgICAgICAgID8gYGFybjphd3M6YXBpZ2F0ZXdheTp1cy1lYXN0LTE6bGFtYmRhOnBhdGgvMjAxNS0wMy0zMS9mdW5jdGlvbnMvYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjpmdW5jdGlvbjoke25hbWV9L2ludm9jYXRpb25zYFxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICB9O1xuICB9LFxuICBjYWxsOiAoYXJnczogcHVsdW1pLnJ1bnRpbWUuTW9ja0NhbGxBcmdzKTogcHVsdW1pLnJ1bnRpbWUuTW9ja0NhbGxSZXN1bHQgPT4ge1xuICAgIHJldHVybiBhcmdzO1xuICB9LFxufSk7XG5cbi8vIE1vY2sgaW50ZXJwb2xhdGUgZnVuY3Rpb25cbmludGVyZmFjZSBQdWx1bWlXaXRoRXh0ZW5zaW9ucyB7XG4gIGludGVycG9sYXRlOiAoXG4gICAgc3RyaW5nczogVGVtcGxhdGVTdHJpbmdzQXJyYXksXG4gICAgLi4udmFsdWVzOiB1bmtub3duW11cbiAgKSA9PiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGFsbDogKHZhbHVlczogdW5rbm93bltdKSA9PiBwdWx1bWkuT3V0cHV0PHVua25vd25bXT47XG59XG5cbmNvbnN0IHB1bHVtaU1vY2sgPSBwdWx1bWkgYXMgdW5rbm93biBhcyB0eXBlb2YgcHVsdW1pICYgUHVsdW1pV2l0aEV4dGVuc2lvbnM7XG5cbnB1bHVtaU1vY2suaW50ZXJwb2xhdGUgPSAoXG4gIHN0cmluZ3M6IFRlbXBsYXRlU3RyaW5nc0FycmF5LFxuICAuLi52YWx1ZXM6IHVua25vd25bXVxuKSA9PiB7XG4gIGNvbnN0IHJlc3VsdCA9IHN0cmluZ3MucmVkdWNlKChhY2MsIHN0ciwgaSkgPT4ge1xuICAgIHJldHVybiBhY2MgKyBzdHIgKyAodmFsdWVzW2ldIHx8ICcnKTtcbiAgfSwgJycpO1xuICByZXR1cm4gcHVsdW1pLk91dHB1dC5jcmVhdGUocmVzdWx0KTtcbn07XG5cbi8vIE1vY2sgYWxsIGZ1bmN0aW9uXG5wdWx1bWlNb2NrLmFsbCA9IGZ1bmN0aW9uICguLi5hcmdzOiBhbnlbXSk6IGFueSB7XG4gIC8vIElmIGNhbGxlZCB3aXRoIGEgc2luZ2xlIG9iamVjdCwgdHJlYXQgYXMgUmVjb3JkPHN0cmluZywgSW5wdXQ8VD4+XG4gIGlmIChcbiAgICBhcmdzLmxlbmd0aCA9PT0gMSAmJlxuICAgIHR5cGVvZiBhcmdzWzBdID09PSAnb2JqZWN0JyAmJlxuICAgICFBcnJheS5pc0FycmF5KGFyZ3NbMF0pXG4gICkge1xuICAgIHJldHVybiBwdWx1bWkuT3V0cHV0LmNyZWF0ZShhcmdzWzBdKTtcbiAgfVxuICAvLyBJZiBjYWxsZWQgd2l0aCBhbiBhcnJheSwgdHJlYXQgYXMgSW5wdXQ8VD5bXVxuICBpZiAoYXJncy5sZW5ndGggPT09IDEgJiYgQXJyYXkuaXNBcnJheShhcmdzWzBdKSkge1xuICAgIHJldHVybiBwdWx1bWkuT3V0cHV0LmNyZWF0ZShhcmdzWzBdKTtcbiAgfVxuICAvLyBJZiBjYWxsZWQgd2l0aCBtdWx0aXBsZSBhcmd1bWVudHMsIHRyZWF0IGFzIElucHV0PFQxPiwgSW5wdXQ8VDI+LCAuLi5cbiAgcmV0dXJuIHB1bHVtaS5PdXRwdXQuY3JlYXRlKGFyZ3MpO1xufTtcbiJdfQ==