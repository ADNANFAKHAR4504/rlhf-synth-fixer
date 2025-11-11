## Multi-Region CDN Deployment with CloudFront (CDK – TypeScript)

### Global Content Delivery Network Setup

We’re building a **global CDN setup** for a media streaming company to serve millions of users with low latency. The goal is to use **AWS CDK (TypeScript)** to deploy a multi-region CloudFront distribution with caching, failover, and security at scale — **without relying on Route53 or ACM**.

---

### **Core Requirements**

1. **S3 Origin Buckets**

   * Create a **primary S3 bucket in `us-east-1`** and a **secondary in `eu-west-1`**.
   * Enable **cross-region replication** between them.
   * Buckets must block public access and allow only CloudFront via **Origin Access Identity (OAI)**.

2. **CloudFront Distribution**

   * Configure **origin groups** for automatic failover.
   * Define **custom cache behaviors**:

     * `/video/*.mp4` → long TTL (streaming optimized)
     * `/images/*.jpg` → standard caching
     * `/static/*` → aggressive caching
   * Add **custom origin request policies** for header control.

3. **Lambda@Edge Functions**

   * Implement for:

     * **Geo-blocking** (deny specific regions)
     * **Header manipulation** (inject/remove headers)
   * Triggered on **viewer request** and **response** events.

4. **Security with AWS WAF**

   * Attach WAF to CloudFront distribution.
   * Include:

     * **Rate limiting (10,000 req/min per IP)**
     * **IP reputation filtering**
   * Maintain low false positives.

5. **Monitoring and Logging**

   * Enable **CloudFront access logs** to S3 with lifecycle policies.
   * Create **CloudWatch dashboards** for cache hit ratio and errors.
   * Add **alarms** for low cache performance.

---

### **Technical Constraints**

* AWS CDK v2 + TypeScript
* Node.js 18+ runtime
* Target 85%+ cache hit ratio
* Cross-region replication < 15 min for small objects
* Monthly data transfer cost ≤ $500/TB
* Tag resources with `Environment`, `Project`, `ManagedBy`

---

### **Current Stack Structure**

The file `lib/tap-stack.ts` already exists with a basic `TapStack` class.
Just add all the resources inside that class. The entry point is `bin/tap.ts` which passes the environment suffix.

Ensure proper wiring:

* CloudFront → S3 origins via OAI
* Lambda@Edge → CloudFront events
* WAF → CloudFront distribution
* IAM roles → least privilege

Keep the design **minimal but production-functional**, focusing on **replication, caching, and security** — no DNS or ACM dependencies.
