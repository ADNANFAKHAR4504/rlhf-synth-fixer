We need a performance and cost optimization audit on all our AWS CloudFront distributions in `us-east-1`. Please create a Python 3.12 CLI tool called `analyze_cloudfront_cdn.py` using **Boto3** to gather config and CloudWatch metrics, and produce actionable reporting and cost recommendation.

**Analysis required:**

1. **Low Cache Hit Ratio:** Flag distributions with <80% cache hit over 30 days (CloudWatch metric).
2. **No Origin Shield:** Multiple edge regions with Origin Shield off.
3. **No Compression:** Compression not enabled for text-based content (HTML, CSS, JS).
4. **Inadequate TTL:** Default TTL < 3600 seconds for static assets (high origin fetch rate).
5. **Missing Security Headers:** No response headers policy (must enforce X-Frame-Options, CSP, HSTS).
6. **HTTP Origin:** Any origin serving over HTTP only.
7. **No Origin Failover:** Only a single origin, not in an origin group for failover.
8. **Inefficient Price Class:** Using "All Locations" price class but traffic is concentrated in fewer regions.
9. **No WAF Integration:** Public distributions without AWS WAF.
10. **Logging Disabled:** No CloudFront access logging.
11. **No Lambda@Edge:** Serving dynamic content but lacking Lambda@Edge for edge logic.
12. **Insecure Viewer Protocol Policy:** Allowing HTTP viewer requests instead of HTTPS-only/redirect.
13. **Forward All Cookies:** All cookies forwarded to origin (hurts cache efficiency).
14. **No Custom Error Pages:** Using CloudFront default error pages (should be branded).

**Audit rules/exclusions:**
- **Only analyze distributions with average >10,000 requests/day** over the last 30 days.
- **Skip any distribution tagged `ExcludeFromAnalysis: true`**.
- **Ignore "internal-only" distributions** (identified by tag, naming, or custom config).

**Output should include:**
- **Console:** For each distribution, print performance score (0-100) and prioritized optimizations.
- **cloudfront_optimization.json:** Per-distribution object containing:
    - `distribution_id`, `domain_name`
    - `performance_score`
    - `cache_hit_ratio`
    - `issues`: `[ {type, impact, current_config, recommended_config} ]`
    - `cost_analysis`: `{current_monthly_cost, data_transfer_out, origin_requests, optimized_monthly_cost, potential_savings}`
- `recommendations_summary`: `{total_potential_savings, distributions_analyzed, avg_cache_hit_ratio}`
- **cache_efficiency_report.html:** A rich HTML report visualizing cache hit ratio, origin requests, and transfer patterns (charts/graphs).
- **cdn_optimization_roadmap.csv:** Prioritized list of action items per distribution, suitable for project management handoff.
- All cost savings/projections must be explained and shown in reports.


**Environment:**
- AWS us-east-1, CloudFront, CloudWatch, WAF, Lambda@Edge, S3
- Python 3.12, boto3, pandas, Jinja2/Plotly (for HTML), pytest, moto

**Format:**
- Main script: `analyze_cloudfront_cdn.py` (Python code block)
- HTML template inline or in a separate block

**_You must not omit, soften, or reinterpret any requirement, issue type, audit exclusion, or output structure described. All deliverables above must be provided._**