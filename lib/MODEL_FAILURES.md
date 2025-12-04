### **Issue 1 — Invalid RDS Password Characters**

**Error:**

```text
InvalidParameterValue: The parameter MasterUserPassword is not a valid password. Only printable ASCII characters besides '/', '@', '"', ' ' may be used.
```

**Root Cause:** The `random_password` resource included invalid characters (`@`, `/`, `"`, ` `) by default.
**Fix:** Added `override_special = "!#$%&*()-_=+[]{}<>:?"` to exclude the forbidden characters.