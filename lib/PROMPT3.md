need to fix these issues that came up in testing:

1. there's some deprecation warning about logRetention - should use logGroup instead apparently?
2. API is wide open - needs some kind of auth (maybe API keys?)
3. no WAF protection whatsoever
4. CORS is too loose, allowing everything

just fix these things, don't add any extra stuff we don't need
