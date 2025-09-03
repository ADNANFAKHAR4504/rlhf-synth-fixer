There were very few issues which I got in this stack -
1. Related to RDS master username, which was not declared properly and was causing issues.
A small change in the code fixed that.

2. Related to cloudtrail, but that was the region limitation as the maximum limit got reached for that. So had to shift the complete tech stack in another region.

3. Tests failed for not declaring all required input variables (like certain variable names that were expected by your tests but not defined in your tf file).
