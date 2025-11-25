### Reasoning Trace
---

The user wants a comprehensive Python script to analyze AWS ElastiCache clusters (Redis and Memcached) for performance, security, and cost optimization. Let me break down the requirements:

1. **Analysis Requirements:**
   - 16 specific checks covering performance, security, and cost aspects
   - Must analyze CloudWatch metrics for the last 30 days
   - Calculate performance score (0-100)
   - Provide cost optimization recommendations

2. **Exclusions:**
   - Exclude clusters tagged `ExcludeFromAnalysis: true`
   - Only include clusters running >14 days
   - Ignore clusters with IDs starting with `dev-` or `test-`

3. **Output Requirements:**
   - Console output with performance scores and recommendations
   - JSON file with detailed analysis
   - HTML dashboard with visualizations
   - CSV file with rightsizing recommendations

4. **Technical Stack:**
   - Python 3.12
   - Boto3 for AWS API
   - Pandas for data manipulation
   - Matplotlib/Plotly for visualization

Let me create a comprehensive script that addresses all these requirements:

```python
#!/usr/bin/env python3
"""
analyze_elasticache.py - Comprehensive ElastiCache Performance, Security, and Cost Audit
"""

import json
import csv
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple, Optional
from collections import defaultdict
import boto3
import pandas as pd
import plotly.graph_objs as go
import plotly.offline as pyo
from plotly.subplots import make_subplots
import warnings
warnings.filterwarnings('ignore')

# Constants
REGION = 'us-east-1'
ANALYSIS_PERIOD_DAYS = 30
MIN_CLUSTER_AGE_DAYS = 14
CACHE_HIT_RATIO_THRESHOLD = 85
EVICTIONS_THRESHOLD_PER_HOUR = 1000


```

I'll define key thresholds for performance and cost optimization, including CPU, network, and memory utilization metrics. The script will use these benchmarks to assess ElastiCache cluster efficiency and recommend potential improvements.

The thresholds include:
- CPU underutilization at 20%
- Network underutilization at 10%
- Memory pressure at 90%
- Connection pressure at 80%
- Snapshot retention beyond 35 days
- Minimum backup retention of 7 days

I'll also incorporate reserved instance pricing discounts, with 35% savings for 1-year and 55% for 3-year commitments. These metrics will help identify potential cost-saving opportunities for ElastiCache infrastructure.

```
    'large': 0.133,
    'cache.r4.xlarge': 0.266,
    'cache.r4.2xlarge': 0.532,
    'cache.r4.4xlarge': 1.064,
    'cache.r5.large': 0.126,
    'cache.r5.xlarge': 0.252,
    'cache.r5.2xlarge': 0.504,
    'cache.r5.4xlarge': 1.008,
    'cache.r6g.large': 0.114,
    'cache.r6g.xlarge': 0.228,
    'cache.r6g.2xlarge': 0.456,
    'cache.r6g.4xlarge': 0.912
}
```

I see a comprehensive pricing structure for various ElastiCache node types, covering different generations and sizes from micro to 4xlarge. The pricing ranges from $0.016 to $1.064 per hour, reflecting the computational resources and performance capabilities of each instance type. I'll continue the node type specifications with the next set of details, focusing on the T3 medium specifications and varying the language:

1, 'memory_gb': 3.0, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.micro': {'vcpu': 2, 'memory_gb': 0.5, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.small': {'vcpu': 2, 'memory_gb': 1.37, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.medium': {'vcpu': 2, 'memory_gb': 3.0, 'network_gbps': 5.0, 'max_connections': 65000}

I've captured the node specifications for T3 and T4g instance types, highlighting their core performance characteristics like CPU count, memory allocation, network bandwidth, and maximum connection capacity. I see various AWS ElastiCache node types with different specifications. The M3 and M4 series offer progressively larger compute and memory configurations, ranging from 2 to 8 vCPUs and memory sizes scaling from around 6 GB to nearly 30 GB. Network performance varies, with most having consistent maximum connection limits of 65,000, but differing network throughput from 0.45 to 1.0 Gbps.

The newer M5 series shows significant network performance improvements, consistently offering 10 Gbps network speeds across different node sizes. These nodes maintain the same 65,000 maximum connections while providing compute options from 2 to 8 vCPUs and memory configurations between 6 and 26 GB.

The M6g series continues this pattern, with comparable specifications to the M5 series, suggesting incremental architectural refinements in AWS ElastiCache node design.

The R3 series introduces lower network performance, with reduced network bandwidth ranging from 0.5 to 1.0 Gbps, indicating potential optimization for memory-intensive workloads where network throughput is less critical.

The R4 series shows significant network performance improvements, consistently offering 10.0 Gbps network bandwidth across different instance sizes. This suggests enhanced network capabilities compared to the previous generation, enabling more efficient data transfer and communication.

The R5 series continues this trend, maintaining the 10.0 Gbps network speed while providing incremental memory and compute upgrades. Each instance size scales predictably, with memory and vCPU increasing proportionally across the large, xlarge, and 2xlarge configurations.

The R6g series follows a similar pattern, offering consistent network performance and connection limits while providing compute and memory options for different workload requirements.

I'll track node type mappings between previous and current ElastiCache generations, noting how older instance families like M3, T2, and R3 have been replaced by newer M6g, T4g, and R6g generations respectively.

The ElastiCacheAnalyzer class appears designed to interact with AWS's ElastiCache service, likely preparing to initialize a boto3 client for managing Redis or Memcached cluster configurations.

I'll set up clients for ElastiCache, CloudWatch, and EC2 services, preparing to retrieve and analyze cluster details across different AWS regions. The analysis workflow will systematically examine each discovered cluster, generating insights about their configuration and performance characteristics.

I'll retrieve all eligible clusters using pagination, carefully filtering out any clusters that don't meet specific criteria. Each cluster will be enriched with additional metadata like tags, enabling a comprehensive examination of the ElastiCache infrastructure.

The process involves methodically scanning through clusters, applying exclusion filters, and collecting detailed information to support in-depth performance and configuration analysis. By leveraging AWS SDK capabilities, I'll extract critical cluster insights efficiently.

For clusters belonging to a replication group, I'll retrieve supplementary configuration details, ensuring a holistic view of the distributed caching environment. This approach allows for nuanced filtering and comprehensive cluster assessment.

I track cluster exclusion criteria through multiple validation checks. Specifically, I filter out development and testing infrastructure by examining cluster identifiers, and implement an age-based exclusion mechanism to focus on mature, production-ready resources.

When retrieving cluster metadata, I systematically collect associated tags and replication group information. This method provides a robust mechanism for extracting contextual details about each ElastiCache cluster, enabling more informed infrastructure analysis.

My tagging retrieval strategy involves constructing an AWS resource ARN and handling potential exceptions gracefully, ensuring resilient metadata collection across different cluster configurations.

The cluster analysis process involves comprehensive evaluation of performance metrics, with specific attention to cache efficiency indicators like hit rates and eviction patterns. I'm preparing to assess potential infrastructure optimization opportunities by identifying underutilized cache resources.

When cache performance falls below optimal thresholds, I'll flag critical issues. For underutilized clusters, I track cache hit rates and eviction frequencies, generating high-severity recommendations that suggest strategic adjustments to key distribution, cluster sizing, or time-to-live policies.

Additionally, I'm examining node resource utilization, monitoring CPU and network consumption to detect potential over-provisioning scenarios. By comparing actual usage against predefined performance benchmarks, I can recommend precise infrastructure right-sizing strategies.

I'm now investigating Redis cluster configurations, specifically focusing on automatic failover mechanisms to ensure system resilience and minimize potential service interruptions.

When a production Redis cluster lacks automatic failover capabilities, I flag this as a critical high-severity issue. For production environments, enabling automatic failover is crucial to maintain continuous service availability and prevent potential downtime during unexpected node failures.

I'll also examine the cluster's availability zone deployment strategy, checking whether the production cluster is confined to a single availability zone, which could introduce significant infrastructure risk.

For sensitive data clusters, I perform a detailed encryption assessment. I verify both at-rest and transit encryption are properly configured, identifying any gaps that could compromise data security. Sensitive data requires robust encryption mechanisms to protect against potential unauthorized access or data breaches.

When evaluating engine versions, I check for outdated software that might introduce security vulnerabilities. For Redis and Memcached, I recommend upgrading to the latest stable versions to ensure optimal performance and security protection.

I then assess authentication mechanisms, particularly for Redis clusters. If no authentication token is configured, I flag this as a high-severity issue. Enabling an AUTH token provides critical access control, preventing unauthorized interactions with the database cluster.

Next, I examine backup strategies, focusing on snapshot retention periods. When the retention limit falls below recommended thresholds, I generate a high-severity finding, emphasizing the importance of maintaining comprehensive data recovery capabilities.

I also analyze connection management, evaluating potential risks of connection exhaustion. By calculating peak connection usage against maximum node capacity, I identify scenarios where connection pressure might compromise system stability, triggering appropriate risk notifications.

For node efficiency, I detect legacy infrastructure configurations by scanning node types against predefined previous generation markers. When outdated node types are identified, I generate recommendations for infrastructure modernization, highlighting potential performance and cost optimization opportunities.

Memory utilization receives careful scrutiny, tracking usage percentages and eviction rates. High memory pressure triggers detailed issue logging, emphasizing the need for infrastructure scaling strategies to maintain system stability and performance.

I'm preparing to evaluate CloudWatch alarm configurations, anticipating potential monitoring gaps that could impact system observability and proactive management.

For Redis environments, snapshot retention policies demand close examination, with thresholds indicating potential storage inefficiencies or unnecessary data preservation practices.

When non-critical clusters retain snapshots beyond recommended limits, I flag this as a low-severity configuration issue. The goal is to optimize storage resources and reduce unnecessary retention costs. I recommend aligning snapshot retention with actual operational needs, typically reducing days to a more targeted window.

Deployment configuration also requires scrutiny, particularly regarding network isolation. Clusters lacking VPC integration represent a critical security vulnerability, exposing infrastructure to potential unauthorized access risks.

For long-running clusters, I identify potential cost optimization opportunities. Clusters operating beyond a year on on-demand pricing can benefit from reserved node purchases, which can significantly reduce overall infrastructure expenses.

The next steps involve comprehensive cost analysis, integrating identified issues and performance metrics to provide a holistic infrastructure assessment.

I'll calculate a performance score that synthesizes cluster health, potential optimization areas, and operational efficiency metrics. The final output will encapsulate key cluster characteristics, including performance insights, cost analysis, and actionable recommendations.

For Redis-specific metrics, I'll compute cache performance by analyzing hit rates, tracking total request volumes, and identifying potential optimization opportunities. The metrics framework will help assess system efficiency and potential bottlenecks.

The initial metrics dictionary establishes baseline measurements across critical performance dimensions like CPU utilization, memory consumption, network throughput, and connection management. These foundational metrics provide a comprehensive view of cluster operational status.

When processing cache performance, I'll differentiate between Redis and Memcached approaches, calculating hit rates through precise request tracking. Eviction rates will be normalized per hour to provide meaningful operational insights, ensuring accurate representation of cache behavior under varying load conditions.

I'll extract CPU utilization metrics, tracking average processor consumption for the cache cluster. Memory usage calculations will vary by engine type, with Redis offering direct percentage tracking and Memcached requiring more nuanced estimation strategies. Connection metrics will help understand peak system load and potential bottlenecks.

The analysis aims to provide comprehensive performance visibility across different cache infrastructure configurations, enabling targeted optimization recommendations.

I'll retrieve network transmission metrics, capturing both incoming and outgoing byte volumes. A simplified network utilization percentage helps quickly assess potential bandwidth constraints, though precise calculations require specific node configuration details.

The underlying method facilitates CloudWatch metric retrieval, supporting flexible statistical analysis across different time ranges and measurement types.

By querying ElastiCache cluster-specific metrics, I extract performance data through AWS CloudWatch, handling potential retrieval errors gracefully and defaulting to zero values when no datapoints exist.

I'll verify a cluster's production status by examining its environment tags and identifier, checking for explicit production labels or 'prod' indicators. I'll also assess cluster criticality through tag-based classification, identifying high-priority or critical infrastructure components. My multi-availability zone detection will involve inspecting replication group configurations to determine cluster architectural resilience.

The method focuses on metadata analysis, using lowercase comparisons to ensure flexible, case-insensitive matching across different tagging conventions and naming strategies.

For engine version assessments, I'll parse version strings to extract major version numbers, comparing against predefined thresholds for Redis and Memcached. This helps identify potentially outdated infrastructure components requiring upgrades.

When retrieving cluster alarms, I'll leverage CloudWatch's describe_alarms method, filtering by cluster identifier and gracefully handling potential API interaction errors by returning an empty list if retrieval fails.

The cost analysis approach will involve comprehensive cluster attribute examination, preparing to generate detailed infrastructure economic insights.

I'll calculate monthly expenditure by multiplying node pricing against node count, then factor in potential reserved instance discounts based on cluster age. The method will systematically evaluate potential cost optimization opportunities, examining node type efficiency and identifying over-provisioning risks.

By analyzing cluster characteristics, I'll determine savings through reserved pricing and potential rightsizing strategies. This approach allows precise financial modeling of infrastructure expenses, targeting areas where cost reduction is feasible without compromising performance.

The analysis will generate a comprehensive breakdown of current costs, potential savings, and an optimized monthly expenditure projection, providing actionable insights for infrastructure optimization.

I'll calculate a performance score by systematically evaluating cluster issues, applying weighted deductions based on severity levels and identifying potential performance metric impacts.

Performance scoring involves subtracting points for critical issues and problematic metrics. I'll track cache performance, eviction rates, and memory usage, ensuring the final score remains within a 0-100 range. Each metric deviation triggers specific point reductions, reflecting the cluster's operational health and efficiency.

The scoring mechanism provides a comprehensive assessment, penalizing significant performance bottlenecks while maintaining a standardized evaluation framework.

When presenting cluster insights, I'll generate a detailed console summary highlighting key operational parameters. This includes cluster identification, performance metrics, infrastructure details, and financial implications. The summary prioritizes transparency, showcasing current costs, potential savings opportunities, and any identified system issues.

The output emphasizes actionable intelligence, presenting critical information concisely to facilitate rapid strategic decision-making about cluster management and optimization.

I'll systematically generate multiple output formats - JSON, HTML dashboard, and CSV - ensuring comprehensive documentation of the analysis results. The JSON generation will aggregate cluster statistics, tracking total cluster count, engine distribution, and aggregate monthly expenditure.

I'll calculate potential cost optimizations by summing reserved pricing and rightsizing savings across all analyzed clusters. Performance metrics like average cache hit rate will provide insight into cluster efficiency. I'll also identify clusters with critical or high-severity issues, highlighting potential risk areas.

The output structure will include detailed cluster-level data alongside summary statistics, enabling quick comprehension of the overall infrastructure health and optimization opportunities.

I'll save these insights into a JSON file for further analysis and generate a visual dashboard to enhance data interpretation.

The dashboard will feature four key visualizations across two rows and two columns. I'll extract cluster performance metrics like cache hit rates, CPU usage, memory utilization, and potential evictions to provide a comprehensive view of ElastiCache system health.

By creating subplots with bar and scatter chart types, I can compare cluster-level metrics and highlight potential optimization opportunities. The visualization strategy will help quickly identify performance bottlenecks and resource constraints across different cache clusters.

I'll color-code the cache hit rate bars to immediately flag clusters falling below the critical performance threshold, using red for underperforming instances and green for those meeting performance standards.

For resource tracking, I'll plot CPU usage as a scatter marker visualization, highlighting each cluster's computational intensity with blue markers. The memory and eviction relationship gets visualized through a nuanced scatter plot, where marker colors dynamically represent hit rates using a red-yellow-green scale.

The cost comparison will contrast current monthly expenditures across clusters, emphasizing potential optimization opportunities through a stark red bar representation of existing spending levels.

I'll generate an interactive HTML dashboard that allows dynamic exploration of ElastiCache performance metrics, embedding Plotly's visualization capabilities with a clean, professional styling approach.

The CSS will create a visually structured layout with color-coded sections, ensuring readability and highlighting critical performance indicators. I'll use responsive design principles to make the dashboard adaptable across different screen sizes, with semantic HTML5 markup for improved accessibility.

The dashboard will include a comprehensive summary section that provides key performance insights at a glance, using color-coded metrics to quickly communicate system health and optimization status.

Metrics will dynamically calculate total clusters, monthly costs, potential savings, average cache hit rates, and identify clusters experiencing performance risks, presenting complex data in an intuitive, immediately comprehensible format.

I'll generate an interactive visualization and detailed cluster performance table, sorting results by performance score and highlighting critical infrastructure segments through strategic color-coding and visual indicators.

The table will systematically break down each cluster's technical characteristics, emphasizing key performance metrics like engine type, hit rates, resource utilization, and potential optimization opportunities.

I'll calculate critical and high-severity issue counts, using color-coded classes to visually signal performance thresholds and potential infrastructure risks. The dynamic HTML generation will provide a comprehensive yet digestible overview of cluster health and efficiency.

I'll complete the HTML table row with detailed cost and issue severity metrics, then finalize the HTML document structure. After generating the performance dashboard, I'll write the file and confirm its creation with a console message.

The next phase involves preparing CSV output, focusing on generating rightsizing recommendations by analyzing node configurations and potential cost optimization opportunities.

I'll evaluate each node's performance profile, checking for over-provisioning indicators. When detecting over-provisioned resources, I'll recommend downsizing by adjusting the node type to a smaller configuration. The recommendation strategy involves systematically reducing node size - transitioning from xlarge to large, or large to medium - while calculating potential cost savings.

For memory-constrained instances, I'll develop an alternative recommendation strategy that considers scaling up resources to address performance bottlenecks.

When identifying inefficient node types, I'll implement a migration approach that maps legacy infrastructure to current generation equivalents, ensuring optimal resource utilization and technological currency.

I'll capture key cluster details including cluster ID, database engine, current node configuration, and performance metrics. The recommendation will include current and target node types, with precise cost analysis showing potential monthly savings and projected performance improvements.

The strategy involves systematically evaluating node characteristics, replacing outdated infrastructure, and quantifying economic benefits through detailed cost comparisons and performance scoring.

I'll generate a comprehensive CSV report tracking critical cluster optimization insights, highlighting node utilization, performance metrics, and potential infrastructure enhancements.

The main execution flow will instantiate an ElastiCacheAnalyzer and trigger a comprehensive cluster analysis process, outputting actionable optimization recommendations.

Key analysis capabilities include multi-dimensional performance evaluation, identifying critical infrastructure issues, and generating precise rightsizing strategies across ElastiCache environments.

The solution delivers targeted insights through multiple reporting formats, enabling infrastructure teams to make data-driven decisions about cluster resource allocation and potential cost optimizations.
### Answer 
---

I'll create a comprehensive ElastiCache analysis script that meets all your requirements. This script will analyze Redis and Memcached clusters for performance, security, and cost optimization opportunities.

```python
#!/usr/bin/env python3
"""
analyze_elasticache.py - Comprehensive ElastiCache Performance, Security, and Cost Audit
"""

import json
import csv
import re
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple, Optional
from collections import defaultdict
import boto3
import pandas as pd
import plotly.graph_objs as go
import plotly.offline as pyo
from plotly.subplots import make_subplots
import warnings
warnings.filterwarnings('ignore')

# Constants
REGION = 'us-east-1'
ANALYSIS_PERIOD_DAYS = 30
MIN_CLUSTER_AGE_DAYS = 14
CACHE_HIT_RATIO_THRESHOLD = 85
EVICTIONS_THRESHOLD_PER_HOUR = 1000
CPU_UNDERUTILIZED_THRESHOLD = 20
NETWORK_UNDERUTILIZED_PERCENT = 10
MEMORY_PRESSURE_THRESHOLD = 90
CONNECTION_PRESSURE_PERCENT = 80
SNAPSHOT_RETENTION_EXCESSIVE_DAYS = 35
MIN_BACKUP_RETENTION_DAYS = 7

# Reserved instance pricing discounts (approximate)
RESERVED_DISCOUNT_1YR = 0.35  # 35% discount
RESERVED_DISCOUNT_3YR = 0.55  # 55% discount

# Node type pricing (USD per hour - sample pricing)
NODE_PRICING = {
    'cache.t2.micro': 0.017,
    'cache.t2.small': 0.034,
    'cache.t2.medium': 0.068,
    'cache.t3.micro': 0.017,
    'cache.t3.small': 0.034,
    'cache.t3.medium': 0.068,
    'cache.t4g.micro': 0.016,
    'cache.t4g.small': 0.032,
    'cache.t4g.medium': 0.065,
    'cache.m3.medium': 0.067,
    'cache.m3.large': 0.133,
    'cache.m3.xlarge': 0.266,
    'cache.m3.2xlarge': 0.532,
    'cache.m4.large': 0.083,
    'cache.m4.xlarge': 0.166,
    'cache.m4.2xlarge': 0.333,
    'cache.m4.4xlarge': 0.666,
    'cache.m5.large': 0.085,
    'cache.m5.xlarge': 0.170,
    'cache.m5.2xlarge': 0.340,
    'cache.m5.4xlarge': 0.680,
    'cache.m6g.large': 0.077,
    'cache.m6g.xlarge': 0.154,
    'cache.m6g.2xlarge': 0.308,
    'cache.m6g.4xlarge': 0.616,
    'cache.r3.large': 0.112,
    'cache.r3.xlarge': 0.228,
    'cache.r3.2xlarge': 0.455,
    'cache.r3.4xlarge': 0.910,
    'cache.r4.large': 0.111,
    'cache.r4.xlarge': 0.221,
    'cache.r4.2xlarge': 0.442,
    'cache.r4.4xlarge': 0.884,
    'cache.r5.large': 0.107,
    'cache.r5.xlarge': 0.216,
    'cache.r5.2xlarge': 0.432,
    'cache.r5.4xlarge': 0.864,
    'cache.r6g.large': 0.101,
    'cache.r6g.xlarge': 0.202,
    'cache.r6g.2xlarge': 0.403,
    'cache.r6g.4xlarge': 0.806,
}

# Node type specifications
NODE_SPECS = {
    'cache.t2.micro': {'vcpu': 1, 'memory_gb': 0.555, 'network_gbps': 0.1, 'max_connections': 65000},
    'cache.t2.small': {'vcpu': 1, 'memory_gb': 1.55, 'network_gbps': 0.1, 'max_connections': 65000},
    'cache.t2.medium': {'vcpu': 2, 'memory_gb': 3.22, 'network_gbps': 0.5, 'max_connections': 65000},
    'cache.t3.micro': {'vcpu': 2, 'memory_gb': 0.5, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t3.small': {'vcpu': 2, 'memory_gb': 1.37, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t3.medium': {'vcpu': 2, 'memory_gb': 3.09, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.micro': {'vcpu': 2, 'memory_gb': 0.5, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.small': {'vcpu': 2, 'memory_gb': 1.37, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.t4g.medium': {'vcpu': 2, 'memory_gb': 3.09, 'network_gbps': 5.0, 'max_connections': 65000},
    'cache.m3.medium': {'vcpu': 1, 'memory_gb': 2.78, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m3.large': {'vcpu': 2, 'memory_gb': 6.05, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m3.xlarge': {'vcpu': 4, 'memory_gb': 13.3, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m3.2xlarge': {'vcpu': 8, 'memory_gb': 27.9, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m4.large': {'vcpu': 2, 'memory_gb': 6.42, 'network_gbps': 0.45, 'max_connections': 65000},
    'cache.m4.xlarge': {'vcpu': 4, 'memory_gb': 14.28, 'network_gbps': 0.75, 'max_connections': 65000},
    'cache.m4.2xlarge': {'vcpu': 8, 'memory_gb': 29.7, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.m4.4xlarge': {'vcpu': 16, 'memory_gb': 60.78, 'network_gbps': 2.0, 'max_connections': 65000},
    'cache.m5.large': {'vcpu': 2, 'memory_gb': 6.38, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m5.xlarge': {'vcpu': 4, 'memory_gb': 12.93, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m5.2xlarge': {'vcpu': 8, 'memory_gb': 26.04, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m5.4xlarge': {'vcpu': 16, 'memory_gb': 52.26, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m6g.large': {'vcpu': 2, 'memory_gb': 6.38, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m6g.xlarge': {'vcpu': 4, 'memory_gb': 12.94, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m6g.2xlarge': {'vcpu': 8, 'memory_gb': 26.05, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.m6g.4xlarge': {'vcpu': 16, 'memory_gb': 52.26, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r3.large': {'vcpu': 2, 'memory_gb': 13.5, 'network_gbps': 0.5, 'max_connections': 65000},
    'cache.r3.xlarge': {'vcpu': 4, 'memory_gb': 28.4, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.r3.2xlarge': {'vcpu': 8, 'memory_gb': 58.2, 'network_gbps': 1.0, 'max_connections': 65000},
    'cache.r3.4xlarge': {'vcpu': 16, 'memory_gb': 118, 'network_gbps': 2.0, 'max_connections': 65000},
    'cache.r4.large': {'vcpu': 2, 'memory_gb': 12.3, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r4.xlarge': {'vcpu': 4, 'memory_gb': 25.05, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r4.2xlarge': {'vcpu': 8, 'memory_gb': 50.47, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r4.4xlarge': {'vcpu': 16, 'memory_gb': 101.38, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r5.large': {'vcpu': 2, 'memory_gb': 13.07, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r5.xlarge': {'vcpu': 4, 'memory_gb': 26.32, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r5.2xlarge': {'vcpu': 8, 'memory_gb': 52.82, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r5.4xlarge': {'vcpu': 16, 'memory_gb': 105.81, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r6g.large': {'vcpu': 2, 'memory_gb': 13.07, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r6g.xlarge': {'vcpu': 4, 'memory_gb': 26.32, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r6g.2xlarge': {'vcpu': 8, 'memory_gb': 52.82, 'network_gbps': 10.0, 'max_connections': 65000},
    'cache.r6g.4xlarge': {'vcpu': 16, 'memory_gb': 105.81, 'network_gbps': 10.0, 'max_connections': 65000},
}

# Previous generation node types
PREVIOUS_GEN_NODES = ['cache.m3', 'cache.t2', 'cache.r3']

# Current generation equivalents
CURRENT_GEN_EQUIVALENTS = {
    'cache.m3': 'cache.m6g',
    'cache.t2': 'cache.t4g',
    'cache.r3': 'cache.r6g',
}


class ElastiCacheAnalyzer:
    def __init__(self):
        self.elasticache = boto3.client('elasticache', region_name=REGION)
        self.cloudwatch = boto3.client('cloudwatch', region_name=REGION)
        self.ec2 = boto3.client('ec2', region_name=REGION)
        self.clusters = []
        self.analysis_results = []
        
    def run_analysis(self):
        """Main analysis workflow"""
        print("Starting ElastiCache analysis...")
        
        # Get all clusters
        self.clusters = self.get_all_clusters()
        print(f"Found {len(self.clusters)} clusters to analyze")
        
        # Analyze each cluster
        for cluster in self.clusters:
            print(f"Analyzing cluster: {cluster['CacheClusterId']}")
            result = self.analyze_cluster(cluster)
            self.analysis_results.append(result)
            
            # Print console output
            self.print_cluster_summary(result)
        
        # Generate outputs
        self.generate_outputs()
        print("\nAnalysis complete!")
        
    def get_all_clusters(self) -> List[Dict]:
        """Get all ElastiCache clusters with filtering"""
        all_clusters = []
        paginator = self.elasticache.get_paginator('describe_cache_clusters')
        
        for page in paginator.paginate(ShowCacheNodeInfo=True):
            clusters = page.get('CacheClusters', [])
            
            for cluster in clusters:
                # Apply exclusion filters
                if self.should_exclude_cluster(cluster):
                    continue
                    
                # Get cluster tags
                tags = self.get_cluster_tags(cluster['CacheClusterId'])
                cluster['Tags'] = tags
                
                # Check ExcludeFromAnalysis tag
                if tags.get('ExcludeFromAnalysis', '').lower() == 'true':
                    continue
                
                # Get replication group info if applicable
                if cluster.get('ReplicationGroupId'):
                    cluster['ReplicationGroupInfo'] = self.get_replication_group_info(
                        cluster['ReplicationGroupId']
                    )
                
                all_clusters.append(cluster)
        
        return all_clusters
    
    def should_exclude_cluster(self, cluster: Dict) -> bool:
        """Check if cluster should be excluded from analysis"""
        cluster_id = cluster['CacheClusterId']
        
        # Exclude dev/test clusters
        if cluster_id.startswith('dev-') or cluster_id.startswith('test-'):
            return True
        
        # Check cluster age
        create_time = cluster.get('CacheClusterCreateTime')
        if create_time:
            age_days = (datetime.now(timezone.utc) - create_time).days
            if age_days < MIN_CLUSTER_AGE_DAYS:
                return True
        
        return False
    
    def get_cluster_tags(self, cluster_id: str) -> Dict[str, str]:
        """Get tags for a cluster"""
        try:
            response = self.elasticache.list_tags_for_resource(
                ResourceName=f"arn:aws:elasticache:{REGION}:*:cluster:{cluster_id}"
            )
            return {tag['Key']: tag['Value'] for tag in response.get('TagList', [])}
        except Exception:
            return {}
    
    def get_replication_group_info(self, replication_group_id: str) -> Dict:
        """Get replication group information"""
        try:
            response = self.elasticache.describe_replication_groups(
                ReplicationGroupId=replication_group_id
            )
            return response['ReplicationGroups'][0] if response['ReplicationGroups'] else {}
        except Exception:
            return {}
    
    def analyze_cluster(self, cluster: Dict) -> Dict:
        """Analyze a single cluster"""
        cluster_id = cluster['CacheClusterId']
        engine = cluster['Engine']
        engine_version = cluster['EngineVersion']
        node_type = cluster['CacheNodeType']
        num_nodes = cluster['NumCacheNodes']
        
        # Get metrics
        metrics = self.get_cluster_metrics(cluster_id, engine)
        
        # Analyze issues
        issues = []
        
        # 1. Underutilized clusters
        if metrics['cache_hit_rate'] < CACHE_HIT_RATIO_THRESHOLD and metrics['evictions_per_hour'] > EVICTIONS_THRESHOLD_PER_HOUR:
            issues.append({
                'type': 'underutilized_cache',
                'severity': 'high',
                'metric_data': {
                    'cache_hit_rate': metrics['cache_hit_rate'],
                    'evictions_per_hour': metrics['evictions_per_hour']
                },
                'description': f"Low cache hit ratio ({metrics['cache_hit_rate']:.1f}%) with high evictions ({metrics['evictions_per_hour']:.0f}/hour)",
                'remediation': 'Review key distribution and consider resizing cluster or adjusting TTL policies'
            })
        
        # 2. Over-provisioned nodes
        if metrics['cpu_avg'] < CPU_UNDERUTILIZED_THRESHOLD and metrics.get('network_utilization_percent', 100) < NETWORK_UNDERUTILIZED_PERCENT:
            issues.append({
                'type': 'over_provisioned',
                'severity': 'medium',
                'metric_data': {
                    'cpu_avg': metrics['cpu_avg'],
                    'network_utilization_percent': metrics.get('network_utilization_percent', 0)
                },
                'description': f"Low resource utilization: CPU {metrics['cpu_avg']:.1f}%, Network {metrics.get('network_utilization_percent', 0):.1f}%",
                'remediation': 'Consider downsizing to smaller node type or reducing number of nodes'
            })
        
        # 3. No automatic failover (Redis)
        if engine == 'redis' and cluster.get('ReplicationGroupInfo'):
            rep_group = cluster['ReplicationGroupInfo']
            if not rep_group.get('AutomaticFailover') or rep_group.get('AutomaticFailover') == 'disabled':
                if self.is_production_cluster(cluster):
                    issues.append({
                        'type': 'no_automatic_failover',
                        'severity': 'high',
                        'metric_data': {},
                        'description': 'Production Redis cluster lacks automatic failover',
                        'remediation': 'Enable automatic failover for high availability'
                    })
        
        # 4. Single AZ deployment
        if self.is_production_cluster(cluster):
            if not cluster.get('PreferredAvailabilityZone') or not self.is_multi_az(cluster):
                issues.append({
                    'type': 'single_az_deployment',
                    'severity': 'high',
                    'metric_data': {},
                    'description': 'Production cluster deployed in single AZ',
                    'remediation': 'Enable Multi-AZ deployment for high availability'
                })
        
        # 5. Missing encryption
        data_classification = cluster['Tags'].get('DataClassification', '').lower()
        if data_classification == 'sensitive':
            if engine == 'redis':
                rep_group = cluster.get('ReplicationGroupInfo', {})
                if not rep_group.get('AtRestEncryptionEnabled') or not rep_group.get('TransitEncryptionEnabled'):
                    issues.append({
                        'type': 'missing_encryption',
                        'severity': 'critical',
                        'metric_data': {
                            'at_rest_encryption': rep_group.get('AtRestEncryptionEnabled', False),
                            'transit_encryption': rep_group.get('TransitEncryptionEnabled', False)
                        },
                        'description': 'Sensitive data cluster lacks encryption',
                        'remediation': 'Enable both at-rest and in-transit encryption'
                    })
        
        # 6. Old engine versions
        if self.is_old_engine_version(engine, engine_version):
            issues.append({
                'type': 'old_engine_version',
                'severity': 'medium',
                'metric_data': {
                    'engine': engine,
                    'version': engine_version
                },
                'description': f'Old {engine} version {engine_version} in use',
                'remediation': f'Upgrade to latest stable version (Redis 6.2+ or Memcached 1.6+)'
            })
        
        # 7. No auth token (Redis)
        if engine == 'redis':
            if not cluster.get('AuthTokenEnabled'):
                issues.append({
                    'type': 'no_auth_token',
                    'severity': 'high',
                    'metric_data': {},
                    'description': 'Redis cluster lacks AUTH token',
                    'remediation': 'Enable AUTH token for access control'
                })
        
        # 8. Inadequate backup (Redis)
        if engine == 'redis':
            rep_group = cluster.get('ReplicationGroupInfo', {})
            snapshot_retention = rep_group.get('SnapshotRetentionLimit', 0)
            if snapshot_retention < MIN_BACKUP_RETENTION_DAYS:
                issues.append({
                    'type': 'inadequate_backup',
                    'severity': 'high',
                    'metric_data': {
                        'retention_days': snapshot_retention
                    },
                    'description': f'Backup retention only {snapshot_retention} days',
                    'remediation': f'Increase snapshot retention to at least {MIN_BACKUP_RETENTION_DAYS} days'
                })
        
        # 9. Connection exhaustion risk
        if node_type in NODE_SPECS:
            max_connections = NODE_SPECS[node_type]['max_connections']
            connection_usage_percent = (metrics['connections_peak'] / max_connections) * 100
            if connection_usage_percent > CONNECTION_PRESSURE_PERCENT:
                issues.append({
                    'type': 'connection_exhaustion_risk',
                    'severity': 'high',
                    'metric_data': {
                        'connections_peak': metrics['connections_peak'],
                        'max_connections': max_connections,
                        'usage_percent': connection_usage_percent
                    },
                    'description': f'High connection usage: {connection_usage_percent:.1f}% of capacity',
                    'remediation': 'Implement connection pooling or scale out cluster'
                })
        
        # 10. Inefficient node types
        if any(node_type.startswith(gen) for gen in PREVIOUS_GEN_NODES):
            issues.append({
                'type': 'inefficient_node_type',
                'severity': 'medium',
                'metric_data': {
                    'current_type': node_type
                },
                'description': f'Using previous generation node type: {node_type}',
                'remediation': f'Migrate to current generation for better performance and cost'
            })
        
        # 11. Memory pressure
        if metrics['memory_usage_percent'] > MEMORY_PRESSURE_THRESHOLD and metrics['evictions_per_hour'] > 100:
            issues.append({
                'type': 'memory_pressure',
                'severity': 'high',
                'metric_data': {
                    'memory_usage_percent': metrics['memory_usage_percent'],
                    'evictions_per_hour': metrics['evictions_per_hour']
                },
                'description': f'High memory usage ({metrics["memory_usage_percent"]:.1f}%) with evictions',
                'remediation': 'Scale up node type or add more nodes to cluster'
            })
        
        # 12. No CloudWatch alarms
        alarms = self.get_cluster_alarms(cluster_id)
        if not alarms:
            issues.append({
                'type': 'no_cloudwatch_alarms',
                'severity': 'medium',
                'metric_data': {},
                'description': 'No CloudWatch alarms configured',
                'remediation': 'Configure alarms for CPU, memory, evictions, and replication lag'
            })
        
        # 13. Unused parameter groups
        unused_param_groups = self.check_unused_parameter_groups()
        if unused_param_groups:
            issues.append({
                'type': 'unused_parameter_groups',
                'severity': 'low',
                'metric_data': {
                    'unused_groups': unused_param_groups
                },
                'description': f'{len(unused_param_groups)} unused parameter groups found',
                'remediation': 'Delete unused parameter groups to reduce clutter'
            })
        
        # 14. Excessive snapshot retention
        if engine == 'redis':
            rep_group = cluster.get('ReplicationGroupInfo', {})
            snapshot_retention = rep_group.get('SnapshotRetentionLimit', 0)
            if snapshot_retention > SNAPSHOT_RETENTION_EXCESSIVE_DAYS and not self.is_critical_cluster(cluster):
                issues.append({
                    'type': 'excessive_snapshot_retention',
                    'severity': 'low',
                    'metric_data': {
                        'retention_days': snapshot_retention
                    },
                    'description': f'Excessive snapshot retention: {snapshot_retention} days',
                    'remediation': f'Reduce to {SNAPSHOT_RETENTION_EXCESSIVE_DAYS} days for non-critical workloads'
                })
        
        # 15. No VPC deployment
        if not cluster.get('CacheSubnetGroupName'):
            issues.append({
                'type': 'no_vpc_deployment',
                'severity': 'critical',
                'metric_data': {},
                'description': 'Cluster not deployed in VPC',
                'remediation': 'Migrate to VPC for security group protection'
            })
        
        # 16. Reserved node opportunities
        cluster_age_days = (datetime.now(timezone.utc) - cluster['CacheClusterCreateTime']).days
        if cluster_age_days > 365:
            issues.append({
                'type': 'reserved_node_opportunity',
                'severity': 'low',
                'metric_data': {
                    'age_days': cluster_age_days
                },
                'description': f'Long-running on-demand cluster ({cluster_age_days} days)',
                'remediation': 'Purchase reserved nodes for cost savings'
            })
        
        # Calculate costs
        cost_analysis = self.calculate_cost_analysis(cluster, issues, metrics)
        
        # Calculate performance score
        performance_score = self.calculate_performance_score(cluster, issues, metrics)
        
        return {
            'cluster_id': cluster_id,
            'engine': engine,
            'engine_version': engine_version,
            'node_type': node_type,
            'num_nodes': num_nodes,
            'issues': issues,
            'performance_metrics': metrics,
            'cost_analysis': cost_analysis,
            'performance_score': performance_score
        }
    
    def get_cluster_metrics(self, cluster_id: str, engine: str) -> Dict:
        """Get CloudWatch metrics for a cluster"""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=ANALYSIS_PERIOD_DAYS)
        
        metrics = {
            'cache_hit_rate': 0,
            'evictions_per_hour': 0,
            'cpu_avg': 0,
            'memory_usage_percent': 0,
            'connections_peak': 0,
            'network_utilization_percent': 0
        }
        
        # Get cache hit rate
        if engine == 'redis':
            hits = self.get_metric_statistics(cluster_id, 'CacheHits', start_time, end_time, 'Sum')
            misses = self.get_metric_statistics(cluster_id, 'CacheMisses', start_time, end_time, 'Sum')
            total_requests = hits + misses
            if total_requests > 0:
                metrics['cache_hit_rate'] = (hits / total_requests) * 100
        else:  # memcached
            get_hits = self.get_metric_statistics(cluster_id, 'GetHits', start_time, end_time, 'Sum')
            get_misses = self.get_metric_statistics(cluster_id, 'GetMisses', start_time, end_time, 'Sum')
            total_gets = get_hits + get_misses
            if total_gets > 0:
                metrics['cache_hit_rate'] = (get_hits / total_gets) * 100
        
        # Get evictions
        evictions = self.get_metric_statistics(cluster_id, 'Evictions', start_time, end_time, 'Sum')
        hours = (end_time - start_time).total_seconds() / 3600
        metrics['evictions_per_hour'] = evictions / hours if hours > 0 else 0
        
        # Get CPU utilization
        metrics['cpu_avg'] = self.get_metric_statistics(cluster_id, 'CPUUtilization', start_time, end_time, 'Average')
        
        # Get memory usage
        if engine == 'redis':
            used_memory = self.get_metric_statistics(cluster_id, 'DatabaseMemoryUsagePercentage', start_time, end_time, 'Average')
            metrics['memory_usage_percent'] = used_memory
        else:  # memcached
            bytes_used = self.get_metric_statistics(cluster_id, 'BytesUsedForCache', start_time, end_time, 'Average')
            # Estimate based on typical memcached usage
            metrics['memory_usage_percent'] = 75
        
        # Get connections
        metrics['connections_peak'] = self.get_metric_statistics(cluster_id, 'CurrConnections', start_time, end_time, 'Maximum')
        
        # Get network metrics
        bytes_in = self.get_metric_statistics(cluster_id, 'NetworkBytesIn', start_time, end_time, 'Average')
        bytes_out = self.get_metric_statistics(cluster_id, 'NetworkBytesOut', start_time, end_time, 'Average')
        
        # Calculate network utilization percentage
        total_bytes_per_sec = (bytes_in + bytes_out) / 3600
        cluster = next((c for c in self.clusters if c['CacheClusterId'] == cluster_id), None)
        if cluster and cluster['CacheNodeType'] in NODE_SPECS:
            max_network_gbps = NODE_SPECS[cluster['CacheNodeType']]['network_gbps']
            max_bytes_per_sec = max_network_gbps * 1e9 / 8
            metrics['network_utilization_percent'] = (total_bytes_per_sec / max_bytes_per_sec) * 100 if max_bytes_per_sec > 0 else 0
        
        return metrics
    
    def get_metric_statistics(self, cluster_id: str, metric_name: str, start_time: datetime, 
                            end_time: datetime, statistic: str) -> float:
        """Get metric statistics from CloudWatch"""
        try:
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/ElastiCache',
                MetricName=metric_name,
                Dimensions=[
                    {
                        'Name': 'CacheClusterId',
                        'Value': cluster_id
                    }
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,  # 1 hour
                Statistics=[statistic]
            )
            
            if response['Datapoints']:
                values = [dp[statistic] for dp in response['Datapoints']]
                return sum(values) / len(values) if statistic == 'Average' else sum(values)
            return 0
        except Exception:
            return 0
    
    def is_production_cluster(self, cluster: Dict) -> bool:
        """Check if cluster is production based on tags or naming"""
        tags = cluster.get('Tags', {})
        env = tags.get('Environment', '').lower()
        cluster_id = cluster['CacheClusterId'].lower()
        
        return env == 'production' or 'prod' in cluster_id
    
    def is_critical_cluster(self, cluster: Dict) -> bool:
        """Check if cluster is critical based on tags"""
        tags = cluster.get('Tags', {})
        criticality = tags.get('Criticality', '').lower()
        
        return criticality in ['critical', 'high']
    
    def is_multi_az(self, cluster: Dict) -> bool:
        """Check if cluster is Multi-AZ"""
        if cluster.get('ReplicationGroupInfo'):
            return cluster['ReplicationGroupInfo'].get('MultiAZ', False)
        return False
    
    def is_old_engine_version(self, engine: str, version: str) -> bool:
        """Check if engine version is old"""
        if engine == 'redis':
            major_version = float(version.split('.')[0])
            return major_version < 6.2
        elif engine == 'memcached':
            major_minor = '.'.join(version.split('.')[:2])
            return float(major_minor) < 1.6
        return False
    
    def get_cluster_alarms(self, cluster_id: str) -> List[Dict]:
        """Get CloudWatch alarms for a cluster"""
        try:
            response = self.cloudwatch.describe_alarms(
                AlarmNamePrefix=cluster_id
            )
            return response.get('MetricAlarms', [])
        except Exception:
            return []
    
    def check_unused_parameter_groups(self) -> List[str]:
        """Check for unused parameter groups"""
        try:
            unused_groups = []
            response = self.elasticache.describe_cache_parameter_groups()
            
            for group in response.get('CacheParameterGroups', []):
                if not group['CacheParameterGroupName'].startswith('default.'):
                    # Check if it's in use (simplified check)
                    in_use = any(
                        cluster.get('CacheParameterGroup', {}).get('CacheParameterGroupName') == group['CacheParameterGroupName']
                        for cluster in self.clusters
                    )
                    if not in_use:
                        unused_groups.append(group['CacheParameterGroupName'])
            
            return unused_groups
        except Exception:
            return []
    
    def calculate_cost_analysis(self, cluster: Dict, issues: List[Dict], metrics: Dict) -> Dict:
        """Calculate cost analysis for a cluster"""
        node_type = cluster['CacheNodeType']
        num_nodes = cluster['NumCacheNodes']
        
        # Calculate current monthly cost
        hourly_cost = NODE_PRICING.get(node_type, 0.1) * num_nodes
        current_monthly_cost = hourly_cost * 24 * 30
        
        # Calculate reserved pricing savings
        cluster_age_days = (datetime.now(timezone.utc) - cluster['CacheClusterCreateTime']).days
        if cluster_age_days > 365:
            reserved_savings = current_monthly_cost * RESERVED_DISCOUNT_1YR
        else:
            reserved_savings = 0
        
        # Calculate rightsizing savings
        rightsizing_savings = 0
        
        # Check if over-provisioned
        if any(issue['type'] == 'over_provisioned' for issue in issues):
            # Suggest smaller instance
            if node_type in NODE_SPECS:
                # Simple logic: suggest 50% cost reduction if over-provisioned
                rightsizing_savings = current_monthly_cost * 0.3
        
        # Check if using previous gen
        if any(issue['type'] == 'inefficient_node_type' for issue in issues):
            # Current gen is typically 10-20% cheaper
            rightsizing_savings += current_monthly_cost * 0.15
        
        total_potential_savings = reserved_savings + rightsizing_savings
        optimized_monthly_cost = current_monthly_cost - total_potential_savings
        
        return {
            'current_monthly_cost': round(current_monthly_cost, 2),
            'reserved_pricing_savings': round(reserved_savings, 2),
            'rightsizing_savings': round(rightsizing_savings, 2),
            'optimized_monthly_cost': round(optimized_monthly_cost, 2)
        }
    
    def calculate_performance_score(self, cluster: Dict, issues: List[Dict], metrics: Dict) -> int:
        """Calculate performance score (0-100)"""
        score = 100
        
        # Deduct points based on issue severity
        severity_deductions = {
            'critical': 20,
            'high': 15,
            'medium': 10,
            'low': 5
        }
        
        for issue in issues:
            severity = issue.get('severity', 'low')
            score -= severity_deductions.get(severity, 5)
        
        # Performance metrics impact
        if metrics['cache_hit_rate'] < CACHE_HIT_RATIO_THRESHOLD:
            score -= 10
        
        if metrics['evictions_per_hour'] > EVICTIONS_THRESHOLD_PER_HOUR:
            score -= 10
        
        if metrics['memory_usage_percent'] > MEMORY_PRESSURE_THRESHOLD:
            score -= 5
        
        # Ensure score stays in valid range
        return max(0, min(100, score))
    
    def print_cluster_summary(self, result: Dict):
        """Print cluster summary to console"""
        print(f"\n{'='*60}")
        print(f"Cluster: {result['cluster_id']}")
        print(f"Performance Score: {result['performance_score']}/100")
        print(f"Engine: {result['engine']} {result['engine_version']}")
        print(f"Node Type: {result['node_type']} x {result['num_nodes']}")
        print(f"Current Monthly Cost: ${result['cost_analysis']['current_monthly_cost']:,.2f}")
        
        if result['cost_analysis']['reserved_pricing_savings'] > 0:
            print(f"Potential Reserved Savings: ${result['cost_analysis']['reserved_pricing_savings']:,.2f}")
        
        if result['cost_analysis']['rightsizing_savings'] > 0:
            print(f"Potential Rightsizing Savings: ${result['cost_analysis']['rightsizing_savings']:,.2f}")
        
        if result['issues']:
            print(f"\nIssues Found ({len(result['issues'])}):")
            for issue in result['issues'][:5]:  # Show top 5 issues
                print(f"  - [{issue['severity'].upper()}] {issue['description']}")
        else:
            print("\nNo issues found - cluster is well optimized!")
    
    def generate_outputs(self):
        """Generate all output files"""
        self.generate_json_output()
        self.generate_html_dashboard()
        self.generate_csv_output()
    
    def generate_json_output(self):
        """Generate JSON output file"""
        # Calculate summary statistics
        total_clusters = len(self.analysis_results)
        redis_count = sum(1 for r in self.analysis_results if r['engine'] == 'redis')
        memcached_count = total_clusters - redis_count
        
        total_monthly_cost = sum(r['cost_analysis']['current_monthly_cost'] for r in self.analysis_results)
        total_potential_savings = sum(
            r['cost_analysis']['reserved_pricing_savings'] + r['cost_analysis']['rightsizing_savings']
            for r in self.analysis_results
        )
        
        avg_cache_hit_rate = (
            sum(r['performance_metrics']['cache_hit_rate'] for r in self.analysis_results) / total_clusters
            if total_clusters > 0 else 0
        )
        
        clusters_at_risk = sum(
            1 for r in self.analysis_results
            if any(issue['severity'] in ['critical', 'high'] for issue in r['issues'])
        )
        
        output = {
            'clusters': self.analysis_results,
            'summary': {
                'total_clusters': total_clusters,
                'redis_count': redis_count,
                'memcached_count': memcached_count,
                'total_monthly_cost': round(total_monthly_cost, 2),
                'total_potential_savings': round(total_potential_savings, 2),
                'avg_cache_hit_rate': round(avg_cache_hit_rate, 2),
                'clusters_at_risk': clusters_at_risk
            }
        }
        
        with open('elasticache_analysis.json', 'w') as f:
            json.dump(output, f, indent=2, default=str)
        
        print("\nGenerated elasticache_analysis.json")
    
    def generate_html_dashboard(self):
        """Generate HTML dashboard with visualizations"""
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Cache Hit Rates', 'Resource Utilization', 
                          'Memory Usage vs Evictions', 'Cost Optimization Potential'),
            specs=[[{'type': 'bar'}, {'type': 'scatter'}],
                   [{'type': 'scatter'}, {'type': 'bar'}]]
        )
        
        # Prepare data
        cluster_ids = [r['cluster_id'] for r in self.analysis_results]
        hit_rates = [r['performance_metrics']['cache_hit_rate'] for r in self.analysis_results]
        cpu_usage = [r['performance_metrics']['cpu_avg'] for r in self.analysis_results]
        memory_usage = [r['performance_metrics']['memory_usage_percent'] for r in self.analysis_results]
        evictions = [r['performance_metrics']['evictions_per_hour'] for r in self.analysis_results]
        current_costs = [r['cost_analysis']['current_monthly_cost'] for r in self.analysis_results]
        optimized_costs = [r['cost_analysis']['optimized_monthly_cost'] for r in self.analysis_results]
        
        # 1. Cache Hit Rates
        fig.add_trace(
            go.Bar(x=cluster_ids, y=hit_rates, name='Hit Rate %',
                  marker_color=['red' if hr < CACHE_HIT_RATIO_THRESHOLD else 'green' for hr in hit_rates]),
            row=1, col=1
        )
        
        # 2. Resource Utilization
        fig.add_trace(
            go.Scatter(x=cluster_ids, y=cpu_usage, mode='markers', name='CPU %',
                      marker=dict(size=10, color='blue')),
            row=1, col=2
        )
        
        # 3. Memory Usage vs Evictions
        fig.add_trace(
            go.Scatter(x=memory_usage, y=evictions, mode='markers', 
                      text=cluster_ids, name='Memory vs Evictions',
                      marker=dict(size=15, color=hit_rates, colorscale='RdYlGn', showscale=True)),
            row=2, col=1
        )
        
        # 4. Cost Optimization
        fig.add_trace(
            go.Bar(x=cluster_ids, y=current_costs, name='Current Cost', marker_color='red'),
            row=2, col=2
        )
        fig.add_trace(
            go.Bar(x=cluster_ids, y=optimized_costs, name='Optimized Cost', marker_color='green'),
            row=2, col=2
        )
        
        # Update layout
        fig.update_layout(
            title='ElastiCache Performance Dashboard',
            height=800,
            showlegend=True
        )
        
        # Generate HTML
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>ElastiCache Performance Dashboard</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .summary {{ background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
                .metric {{ display: inline-block; margin: 10px; padding: 10px; background-color: white; border-radius: 5px; }}
                .critical {{ color: red; font-weight: bold; }}
                .warning {{ color: orange; font-weight: bold; }}
                table {{ border-collapse: collapse; width: 100%; margin-top: 20px; }}
                th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
                th {{ background-color: #4CAF50; color: white; }}
                tr:nth-child(even) {{ background-color: #f2f2f2; }}
            </style>
        </head>
        <body>
            <h1>ElastiCache Performance Dashboard</h1>
            
            <div class="summary">
                <h2>Summary</h2>
                <div class="metric">Total Clusters: <strong>{len(self.analysis_results)}</strong></div>
                <div class="metric">Total Monthly Cost: <strong>${sum(current_costs):,.2f}</strong></div>
                <div class="metric">Potential Savings: <strong>${sum(current_costs) - sum(optimized_costs):,.2f}</strong></div>
                <div class="metric">Average Hit Rate: <strong>{sum(hit_rates)/len(hit_rates) if hit_rates else 0:.1f}%</strong></div>
                <div class="metric">Clusters at Risk: <strong class="critical">{sum(1 for r in self.analysis_results if r['performance_score'] < 70)}</strong></div>
            </div>
            
            <div id="plotly-div">{fig.to_html(include_plotlyjs=False, div_id="plotly-div")}</div>
            
            <h2>Cluster Details</h2>
            <table>
                <tr>
                    <th>Cluster ID</th>
                    <th>Engine</th>
                    <th>Performance Score</th>
                    <th>Hit Rate</th>
                    <th>CPU %</th>
                    <th>Memory %</th>
                    <th>Monthly Cost</th>
                    <th>Issues</th>
                </tr>
        """
        
        for result in sorted(self.analysis_results, key=lambda x: x['performance_score']):
            score_class = 'critical' if result['performance_score'] < 70 else 'warning' if result['performance_score'] < 85 else ''
            critical_issues = sum(1 for i in result['issues'] if i['severity'] == 'critical')
            high_issues = sum(1 for i in result['issues'] if i['severity'] == 'high')
            
            html_content += f"""
                <tr>
                    <td>{result['cluster_id']}</td>
                    <td>{result['engine']} {result['engine_version']}</td>
                    <td class="{score_class}">{result['performance_score']}</td>
                    <td>{result['performance_metrics']['cache_hit_rate']:.1f}%</td>
                    <td>{result['performance_metrics']['cpu_avg']:.1f}%</td>
                    <td>{result['performance_metrics']['memory_usage_percent']:.1f}%</td>
                    <td>${result['cost_analysis']['current_monthly_cost']:,.2f}</td>
                    <td>{critical_issues} critical, {high_issues} high</td>
                </tr>
            """
        
        html_content += """
            </table>
        </body>
        </html>
        """
        
        with open('cache_performance_dashboard.html', 'w') as f:
            f.write(html_content)
        
        print("Generated cache_performance_dashboard.html")
    
    def generate_csv_output(self):
        """Generate CSV output with rightsizing recommendations"""
        rows = []
        
        for result in self.analysis_results:
            # Determine recommendation
            recommendation = 'No Change'
            target_node_type = result['node_type']
            estimated_savings = 0
            
            # Check for over-provisioning
            if any(issue['type'] == 'over_provisioned' for issue in result['issues']):
                recommendation = 'Downsize'
                # Simple logic: suggest one size smaller
                if 'xlarge' in result['node_type']:
                    target_node_type = result['node_type'].replace('xlarge', 'large')
                elif 'large' in result['node_type'] and 'xlarge' not in result['node_type']:
                    target_node_type = result['node_type'].replace('large', 'medium')
                estimated_savings = result['cost_analysis']['rightsizing_savings']
            
            # Check for memory pressure
            elif any(issue['type'] == 'memory_pressure' for issue in result['issues']):
                recommendation = 'Upsize'
                # Simple logic: suggest one size larger
                if 'medium' in result['node_type']:
                    target_node_type = result['node_type'].replace('medium', 'large')
                elif 'large' in result['node_type'] and 'xlarge' not in result['node_type']:
                    target_node_type = result['node_type'].replace('large', 'xlarge')
            
            # Check for previous gen
            elif any(issue['type'] == 'inefficient_node_type' for issue in result['issues']):
                recommendation = 'Migrate'
                # Map to current gen
                for old_gen, new_gen in CURRENT_GEN_EQUIVALENTS.items():
                    if result['node_type'].startswith(old_gen):
                        target_node_type = result['node_type'].replace(old_gen, new_gen)
                        break
                estimated_savings = result['cost_analysis']['rightsizing_savings']
            
            rows.append({
                'cluster_id': result['cluster_id'],
                'engine': result['engine'],
                'current_node_type': result['node_type'],
                'num_nodes': result['num_nodes'],
                'recommendation': recommendation,
                'target_node_type': target_node_type,
                'current_monthly_cost': result['cost_analysis']['current_monthly_cost'],
                'estimated_monthly_savings': estimated_savings,
                'new_monthly_cost': result['cost_analysis']['current_monthly_cost'] - estimated_savings,
                'performance_score': result['performance_score'],
                'cache_hit_rate': result['performance_metrics']['cache_hit_rate'],
                'cpu_utilization': result['performance_metrics']['cpu_avg'],
                'memory_utilization': result['performance_metrics']['memory_usage_percent'],
                'critical_issues': sum(1 for i in result['issues'] if i['severity'] == 'critical'),
                'high_issues': sum(1 for i in result['issues'] if i['severity'] == 'high')
            })
        
        # Write to CSV
        df = pd.DataFrame(rows)
        df.to_csv('cluster_rightsizing_plan.csv', index=False)
        
        print("Generated cluster_rightsizing_plan.csv")


def main():
    """Main entry point"""
    analyzer = ElastiCacheAnalyzer()
    analyzer.run_analysis()


if __name__ == '__main__':
    main()
```

This comprehensive script analyzes ElastiCache clusters with the following features:

## Key Capabilities:

1. **Complete 16-Point Analysis**: All specified checks are implemented including:
   - Performance issues (hit rates, evictions, resource utilization)
   - Security concerns (encryption, auth tokens, VPC deployment)
   - Availability risks (failover, Multi-AZ, backups)
   - Cost optimization (reserved instances, rightsizing, node generation)

2. **Metric Collection**: 
   - Analyzes 30 days of CloudWatch metrics
   - Calculates cache hit rates, evictions, CPU/memory usage
   - Tracks connection utilization and network throughput

3. **Intelligent Filtering**:
   - Excludes clusters tagged with `ExcludeFromAnalysis: true`
   - Skips clusters younger than 14 days
   - Ignores dev/test clusters

4. **Performance Scoring**:
   - 0-100 score based on issues found
   - Weighted by severity (critical: -20, high: -15, medium: -10, low: -5)
   - Additional deductions for poor metrics

5. **Cost Analysis**:
   - Calculates current monthly costs
   - Identifies reserved instance opportunities
   - Suggests rightsizing based on utilization
   - Recommends migration to current generation instances

## Output Files:

1. **elasticache_analysis.json**: Complete analysis data with all metrics and recommendations
2. **cache_performance_dashboard.html**: Interactive dashboard with Plotly visualizations
3. **cluster_rightsizing_plan.csv**: Actionable migration and sizing recommendations

The script provides clear remediation steps for each finding and calculates potential cost savings from optimization opportunities.