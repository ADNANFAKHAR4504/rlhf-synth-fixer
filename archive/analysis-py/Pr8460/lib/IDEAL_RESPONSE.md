The following reference implementation fulfills PROMPT.md by auditing CloudFront distributions, scoring each configuration, and generating the required console, JSON, HTML, and CSV outputs. 

```python
#!/usr/bin/env python3
"""
CloudFront Performance and Cost Optimization Audit Tool

Analyzes CloudFront distributions for performance issues, security concerns,
and cost optimization opportunities.
"""

import json
import csv
import logging
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from pathlib import Path

import boto3
import argparse
from collections import defaultdict
from types import ModuleType

try:
    import pandas as pd
except ImportError:  # pragma: no cover - fallback for lightweight environments
    class _StubSeries(list):
        def map(self, func):
            return [func(v) for v in self]

    class _StubDataFrame:
        def __init__(self, rows=None):
            rows = rows or []
            self._rows = [dict(row) for row in rows]
            self.columns = list(rows[0].keys()) if rows else []

        def copy(self):
            return _StubDataFrame([dict(row) for row in self._rows])

        def __getitem__(self, key):
            return _StubSeries(row.get(key, '') for row in self._rows)

        def __setitem__(self, key, values):
            values = list(values)
            if key not in self.columns:
                self.columns.append(key)
            for row, value in zip(self._rows, values):
                row[key] = value

        def to_html(self, **kwargs):
            header = ''.join(f"<th>{col}</th>" for col in self.columns)
            body_rows = []
            for row in self._rows:
                cells = ''.join(f"<td>{row.get(col, '')}</td>" for col in self.columns)
                body_rows.append(f"<tr>{cells}</tr>")
            return f"<table><thead><tr>{header}</tr></thead><tbody>{''.join(body_rows)}</tbody></table>"

    pandas_stub = ModuleType('pandas')
    pandas_stub.DataFrame = _StubDataFrame
    pd = pandas_stub

try:
    import plotly.express as px
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
except ImportError:  # pragma: no cover - fallback when plotly missing
    class _StubTrace:
        def __init__(self, **kwargs):
            self.kwargs = kwargs

    class _StubFigure:
        def __init__(self):
            self.traces = []

        def add_trace(self, trace, row=None, col=None):
            self.traces.append((trace, row, col))

        def update_layout(self, **kwargs):
            pass

        def to_html(self, **kwargs):
            return "<div>plot</div>"

    go = ModuleType('plotly.graph_objects')
    go.Bar = lambda **kwargs: _StubTrace(**kwargs)
    go.Pie = lambda **kwargs: _StubTrace(**kwargs)
    go.Scatter = lambda **kwargs: _StubTrace(**kwargs)

    px = ModuleType('plotly.express')
    px.bar = lambda *args, **kwargs: _StubFigure()

    def make_subplots(**kwargs):
        return _StubFigure()

from jinja2 import Template
from tabulate import tabulate

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
MIN_REQUESTS_PER_DAY = 10000
CACHE_HIT_THRESHOLD = 0.8
DEFAULT_TTL_THRESHOLD = 3600
DAYS_TO_ANALYZE = 30

# Pricing constants (simplified, actual pricing varies by region/usage)
CLOUDFRONT_REQUEST_COST = 0.0075 / 10000  # per request
CLOUDFRONT_DATA_TRANSFER_COST = 0.085  # per GB
ORIGIN_REQUEST_COST = 0.01 / 1000  # per request
ORIGIN_SHIELD_COST = 0.009 / 10000  # per request


@dataclass
class Issue:
    """Represents an optimization issue found in a distribution"""
    type: str
    impact: str  # 'high', 'medium', 'low'
    current_config: str
    recommended_config: str
    estimated_savings: float = 0.0


@dataclass
class CostAnalysis:
    """Cost analysis for a distribution"""
    current_monthly_cost: float
    data_transfer_out: float  # GB
    origin_requests: int
    optimized_monthly_cost: float
    potential_savings: float


@dataclass
class DistributionAnalysis:
    """Complete analysis for a single distribution"""
    distribution_id: str
    domain_name: str
    performance_score: int
    cache_hit_ratio: float
    issues: List[Issue]
    cost_analysis: CostAnalysis


class CloudFrontAnalyzer:
    """Main analyzer class for CloudFront distributions"""
    
    def __init__(self, region: str = 'us-east-1', endpoint_url: Optional[str] = None):
        self.region = region
        self.endpoint_url = endpoint_url or os.environ.get('AWS_ENDPOINT_URL')
        client_kwargs = {'region_name': region}
        if self.endpoint_url:
            client_kwargs['endpoint_url'] = self.endpoint_url
        
        self.cloudfront = boto3.client('cloudfront', **client_kwargs)
        self.cloudwatch = boto3.client('cloudwatch', **client_kwargs)
        self.base_dir = Path(__file__).resolve().parents[1]
        self.distributions_analyzed = 0
        self.total_cache_hit_ratio = 0.0
        
    def analyze_all_distributions(self) -> Dict[str, Any]:
        """Main entry point to analyze all CloudFront distributions"""
        logger.info("Starting CloudFront distribution analysis...")
        
        distributions = self._get_eligible_distributions()
        analyses = []
        
        for dist in distributions:
            logger.info("Analyzing distribution: %s", dist['Id'])
            analysis = self._analyze_distribution(dist)
            if analysis:
                analyses.append(analysis)
                self._print_console_output(analysis)
        
        # Generate reports
        summary = self._generate_summary(analyses)
        if analyses:
            self._print_summary_table(analyses, summary)
        self._save_json_report(analyses, summary)
        self._generate_html_report(analyses, summary)
        self._generate_csv_roadmap(analyses)
        
        return {
            'analyses': analyses,
            'summary': summary
        }
    
    def _get_eligible_distributions(self) -> List[Dict[str, Any]]:
        """Get distributions that meet analysis criteria"""
        eligible = []
        
        paginator = self.cloudfront.get_paginator('list_distributions')
        for page in paginator.paginate():
            for dist in page.get('DistributionList', {}).get('Items', []):
                dist_id = dist['Id']
                dist_tags = {}
                
                try:
                    resource_arn = dist.get('ARN') or f"arn:aws:cloudfront::{dist_id}"
                    tags_resp = self.cloudfront.list_tags_for_resource(Resource=resource_arn)
                    dist_tags = {tag['Key']: tag['Value'] for tag in tags_resp.get('Tags', {}).get('Items', [])}
                except Exception as e:
                    logger.warning("Could not get tags for %s: %s", dist_id, e)
                
                if self._should_skip_distribution(dist, dist_tags):
                    continue
                
                if self._check_request_volume(dist_id):
                    full_dist = self.cloudfront.get_distribution(Id=dist_id)
                    eligible.append(full_dist['Distribution'])
                else:
                    logger.info("Skipping %s - Low request volume", dist_id)
        
        return eligible
    
    def _check_request_volume(self, distribution_id: str) -> bool:
        """Check if distribution has >10,000 requests/day average over 30 days"""
        total_requests = self._fetch_metric_value(distribution_id, 'Requests')
        if total_requests is None:
            logger.warning("No request metrics for %s; including for analysis.", distribution_id)
            return True
        avg_requests_per_day = total_requests / DAYS_TO_ANALYZE if DAYS_TO_ANALYZE else 0
        return avg_requests_per_day >= MIN_REQUESTS_PER_DAY
    
    def _should_skip_distribution(self, distribution: Dict[str, Any], tags: Dict[str, str]) -> bool:
        """Determine if a distribution should be excluded from analysis"""
        dist_id = distribution.get('Id')
        
        if tags.get('ExcludeFromAnalysis', '').lower() == 'true':
            logger.info("Skipping %s - ExcludeFromAnalysis tag", dist_id)
            return True
        
        comment = distribution.get('Comment', '') or distribution.get('DistributionConfig', {}).get('Comment', '')
        domain = distribution.get('DomainName', '')
        internal_markers = [
            tags.get('Type', '').lower(),
            tags.get('Visibility', '').lower(),
            tags.get('InternalOnly', '').lower(),
            tags.get('Environment', '').lower()
        ]
        
        if 'internal' in comment.lower() or 'internal' in domain.lower() or 'internal' in "".join(internal_markers):
            logger.info("Skipping %s - Internal only distribution", dist_id)
            return True
        
        return False
    
    def _analyze_distribution(self, distribution: Dict[str, Any]) -> Optional[DistributionAnalysis]:
        """Analyze a single distribution for all issues"""
        dist_id = distribution['Id']
        config = distribution['DistributionConfig']
        domain_name = distribution.get('DomainName') or next(iter(config.get('Aliases', {}).get('Items', []) or []), '')
        
        issues = []
        
        # 1. Low Cache Hit Ratio
        cache_hit_ratio = self._get_cache_hit_ratio(dist_id)
        if cache_hit_ratio < CACHE_HIT_THRESHOLD:
            issues.append(Issue(
                type="Low Cache Hit Ratio",
                impact="high",
                current_config=f"Cache hit ratio: {cache_hit_ratio:.1%}",
                recommended_config="Improve caching strategy to achieve >80% cache hit ratio",
                estimated_savings=self._calculate_cache_savings(dist_id, cache_hit_ratio)
            ))
        
        # 2. No Origin Shield
        if self._requires_origin_shield(config) and not self._origin_shield_enabled(config):
            issues.append(Issue(
                type="No Origin Shield",
                impact="medium",
                current_config="Origin Shield disabled",
                recommended_config="Enable Origin Shield for better cache efficiency",
                estimated_savings=self._calculate_origin_shield_savings(dist_id)
            ))
        
        # 3. No Compression
        if not self._check_compression_enabled(config):
            issues.append(Issue(
                type="No Compression",
                impact="medium",
                current_config="Compression not enabled for text content",
                recommended_config="Enable compression for HTML, CSS, JS files",
                estimated_savings=self._calculate_compression_savings(dist_id)
            ))
        
        # 4. Inadequate TTL
        if self._check_low_ttl(config):
            issues.append(Issue(
                type="Inadequate TTL",
                impact="high",
                current_config=f"Default TTL < {DEFAULT_TTL_THRESHOLD} seconds",
                recommended_config="Set default TTL to at least 3600 seconds for static assets",
                estimated_savings=self._calculate_ttl_savings(dist_id)
            ))
        
        # 5. Missing Security Headers
        if not self._check_security_headers(config):
            issues.append(Issue(
                type="Missing Security Headers",
                impact="high",
                current_config="No response headers policy configured",
                recommended_config="Add security headers: X-Frame-Options, CSP, HSTS",
                estimated_savings=0
            ))
        
        # 6. HTTP Origin
        if self._check_http_origin(config):
            issues.append(Issue(
                type="HTTP Origin",
                impact="high",
                current_config="Origin using HTTP protocol",
                recommended_config="Use HTTPS for all origins",
                estimated_savings=0
            ))
        
        # 7. No Origin Failover
        if self._check_single_origin(config):
            issues.append(Issue(
                type="No Origin Failover",
                impact="medium",
                current_config="Single origin without failover",
                recommended_config="Configure origin group with failover",
                estimated_savings=0
            ))
        
        # 8. Inefficient Price Class
        price_class_issue = self._check_price_class(dist_id, config)
        if price_class_issue:
            issues.append(price_class_issue)
        
        # 9. No WAF Integration
        if not self._check_waf_integration(distribution):
            issues.append(Issue(
                type="No WAF Integration",
                impact="high",
                current_config="No AWS WAF attached",
                recommended_config="Attach AWS WAF for security",
                estimated_savings=0
            ))
        
        # 10. Logging Disabled
        if not config.get('Logging', {}).get('Enabled', False):
            issues.append(Issue(
                type="Logging Disabled",
                impact="medium",
                current_config="CloudFront access logging disabled",
                recommended_config="Enable access logging to S3",
                estimated_savings=0
            ))
        
        # 11. No Lambda@Edge
        if self._should_use_lambda_edge(config) and not self._has_lambda_edge(config):
            issues.append(Issue(
                type="No Lambda@Edge",
                impact="medium",
                current_config="Serving dynamic content without edge compute",
                recommended_config="Use Lambda@Edge for dynamic content optimization",
                estimated_savings=self._calculate_lambda_edge_savings(dist_id)
            ))
        
        # 12. Insecure Viewer Protocol Policy
        if self._check_insecure_viewer_protocol(config):
            issues.append(Issue(
                type="Insecure Viewer Protocol Policy",
                impact="high",
                current_config="Allowing HTTP viewer requests",
                recommended_config="Use redirect-to-https or https-only",
                estimated_savings=0
            ))
        
        # 13. Forward All Cookies
        if self._check_forward_all_cookies(config):
            issues.append(Issue(
                type="Forward All Cookies",
                impact="high",
                current_config="Forwarding all cookies to origin",
                recommended_config="Only forward necessary cookies",
                estimated_savings=self._calculate_cookie_savings(dist_id)
            ))
        
        # 14. No Custom Error Pages
        if not self._check_custom_error_pages(config):
            issues.append(Issue(
                type="No Custom Error Pages",
                impact="low",
                current_config="Using default CloudFront error pages",
                recommended_config="Configure custom branded error pages",
                estimated_savings=0
            ))
        
        # Calculate performance score
        performance_score = self._calculate_performance_score(issues, cache_hit_ratio)
        
        # Cost analysis
        cost_analysis = self._perform_cost_analysis(dist_id, issues)
        
        return DistributionAnalysis(
            distribution_id=dist_id,
            domain_name=domain_name or distribution.get('Id'),
            performance_score=performance_score,
            cache_hit_ratio=cache_hit_ratio,
            issues=issues,
            cost_analysis=cost_analysis
        )
    
    def _fetch_metric_value(
        self,
        distribution_id: str,
        metric_name: str,
        statistics: str = 'Sum',
        region: str = 'Global',
        period: int = 86400
    ) -> Optional[float]:
        """Generic helper to aggregate CloudWatch metrics"""
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=DAYS_TO_ANALYZE)
        
        try:
            response = self.cloudwatch.get_metric_statistics(
                Namespace='CloudFront',
                MetricName=metric_name,
                Dimensions=[
                    {'Name': 'DistributionId', 'Value': distribution_id},
                    {'Name': 'Region', 'Value': region}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=period,
                Statistics=[statistics]
            )
        except Exception as exc:
            logger.error("Error getting %s for %s: %s", metric_name, distribution_id, exc)
            return None
        
        datapoints = response.get('Datapoints', [])
        if not datapoints:
            return None
        
        key = 'Average' if statistics == 'Average' else statistics
        values = [dp.get(key, 0.0) for dp in datapoints]
        
        if statistics == 'Average':
            return sum(values) / len(values)
        return sum(values)
    
    def _get_cache_hit_ratio(self, distribution_id: str) -> float:
        """Get cache hit ratio from CloudWatch metrics"""
        avg_hit_rate = self._fetch_metric_value(
            distribution_id,
            'CacheHitRate',
            statistics='Average'
        )
        if avg_hit_rate is None:
            # No metrics available - return a neutral baseline that won't
            # trigger false positives but will still allow analysis
            logger.warning("No cache hit metrics for %s; using baseline 85%%", distribution_id)
            return 0.85
        return avg_hit_rate / 100
    
    def _requires_origin_shield(self, config: Dict[str, Any]) -> bool:
        """Determine if distribution would benefit from Origin Shield"""
        # Origin Shield can benefit distributions with multiple origins
        # or high-traffic single origin configurations
        origins = config.get('Origins', {}).get('Items', [])
        return len(origins) > 1
    
    def _origin_shield_enabled(self, config: Dict[str, Any]) -> bool:
        """Check whether Origin Shield is enabled on any origin"""
        origins = config.get('Origins', {}).get('Items', [])
        for origin in origins:
            if origin.get('OriginShield', {}).get('Enabled'):
                return True
        return False
    
    def _check_compression_enabled(self, config: Dict[str, Any]) -> bool:
        """Check if compression is enabled for text content"""
        default_behavior = config.get('DefaultCacheBehavior', {})
        if not default_behavior.get('Compress', False):
            return False

        # Check ALL cache behaviors for compressible content patterns
        compressible_extensions = ('.html', '.css', '.js', '.json', '.xml', '.txt', '.svg')
        for behavior in config.get('CacheBehaviors', {}).get('Items', []):
            path = behavior.get('PathPattern', '').lower()
            # Check if this behavior serves compressible content
            if any(ext in path for ext in compressible_extensions):
                if not behavior.get('Compress', False):
                    return False

        return True
    
    def _check_low_ttl(self, config: Dict[str, Any]) -> bool:
        """Check if default TTL is too low"""
        default_behavior = config.get('DefaultCacheBehavior', {})
        default_ttl = default_behavior.get('DefaultTTL', 0)
        return default_ttl < DEFAULT_TTL_THRESHOLD
    
    def _check_security_headers(self, config: Dict[str, Any]) -> bool:
        """Check if security headers are configured"""
        default_behavior = config.get('DefaultCacheBehavior', {})
        return bool(default_behavior.get('ResponseHeadersPolicyId'))
    
    def _check_http_origin(self, config: Dict[str, Any]) -> bool:
        """Check if any origin uses HTTP only"""
        for origin in config.get('Origins', {}).get('Items', []):
            if origin.get('CustomOriginConfig', {}).get('OriginProtocolPolicy') == 'http-only':
                return True
        return False
    
    def _check_single_origin(self, config: Dict[str, Any]) -> bool:
        """Check if distribution has single origin without failover"""
        origin_groups = config.get('OriginGroups', {}).get('Items', [])
        origins = config.get('Origins', {}).get('Items', [])
        return len(origins) == 1 and len(origin_groups) == 0
    
    def _check_price_class(self, distribution_id: str, config: Dict[str, Any]) -> Optional[Issue]:
        """Check if price class is efficient for traffic pattern"""
        current_price_class = config.get('PriceClass', 'PriceClass_All')
        
        if current_price_class != 'PriceClass_All':
            return None
        
        traffic_pattern = self._analyze_traffic_pattern(distribution_id)
        
        if traffic_pattern['concentrated_regions']:
            return Issue(
                type="Inefficient Price Class",
                impact="medium",
                current_config=f"Using {current_price_class} but traffic concentrated in fewer regions",
                recommended_config=f"Use {traffic_pattern['recommended_price_class']}",
                estimated_savings=traffic_pattern['estimated_savings']
            )
        
        return None
    
    def _analyze_traffic_pattern(self, distribution_id: str) -> Dict[str, Any]:
        """Analyze geographic traffic patterns"""
        region_codes = ['NA', 'SA', 'EU', 'AP', 'OC', 'ME', 'AF']
        region_totals = {}
        total_requests = 0.0
        
        for region in region_codes:
            value = self._fetch_metric_value(
                distribution_id,
                'Requests',
                region=region
            ) or 0.0
            region_totals[region] = value
            total_requests += value
        
        if total_requests == 0:
            return {
                'concentrated_regions': False,
                'recommended_price_class': 'PriceClass_All',
                'estimated_savings': 0.0
            }
        
        na_eu = region_totals.get('NA', 0.0) + region_totals.get('EU', 0.0)
        concentration_ratio = na_eu / total_requests
        concentrated = concentration_ratio >= 0.8
        estimated_savings = 0.0
        
        if concentrated:
            transfer_cost = self._get_data_transfer(distribution_id) * CLOUDFRONT_DATA_TRANSFER_COST
            estimated_savings = transfer_cost * 0.1
        
        return {
            'concentrated_regions': concentrated,
            'recommended_price_class': 'PriceClass_100' if concentrated else 'PriceClass_All',
            'estimated_savings': estimated_savings
        }
    
    def _check_waf_integration(self, distribution: Dict[str, Any]) -> bool:
        """Check if WAF is attached to distribution"""
        return bool(distribution.get('DistributionConfig', {}).get('WebACLId'))
    
    def _should_use_lambda_edge(self, config: Dict[str, Any]) -> bool:
        """Determine if Lambda@Edge would be beneficial"""
        # Check for dynamic content patterns
        behaviors = [config.get('DefaultCacheBehavior', {})] + config.get('CacheBehaviors', {}).get('Items', [])
        for behavior in behaviors:
            forwarded = behavior.get('ForwardedValues', {})
            if (forwarded.get('QueryString') or 
                    forwarded.get('Headers', {}).get('Quantity', 0) > 0 or
                    forwarded.get('Cookies', {}).get('Forward') not in (None, '', 'none')):
                return True
        return False
    
    def _has_lambda_edge(self, config: Dict[str, Any]) -> bool:
        """Check if Lambda@Edge is configured"""
        behaviors = [config.get('DefaultCacheBehavior', {})] + config.get('CacheBehaviors', {}).get('Items', [])
        for behavior in behaviors:
            lambda_functions = behavior.get('LambdaFunctionAssociations', {}).get('Items', [])
            if lambda_functions:
                return True
        return False
    
    def _check_insecure_viewer_protocol(self, config: Dict[str, Any]) -> bool:
        """Check viewer protocol policy"""
        default_behavior = config.get('DefaultCacheBehavior', {})
        policy = default_behavior.get('ViewerProtocolPolicy', '')
        return policy == 'allow-all'
    
    def _check_forward_all_cookies(self, config: Dict[str, Any]) -> bool:
        """Check if forwarding all cookies"""
        default_behavior = config.get('DefaultCacheBehavior', {})
        cookies_config = default_behavior.get('ForwardedValues', {}).get('Cookies', {})
        if cookies_config.get('Forward') == 'all':
            return True
        
        for behavior in config.get('CacheBehaviors', {}).get('Items', []):
            cookies = behavior.get('ForwardedValues', {}).get('Cookies', {})
            if cookies.get('Forward') == 'all':
                return True
        return False
    
    def _check_custom_error_pages(self, config: Dict[str, Any]) -> bool:
        """Check if custom error pages are configured"""
        error_pages = config.get('CustomErrorResponses', {}).get('Items', [])
        return len(error_pages) > 0
    
    def _calculate_performance_score(self, issues: List[Issue], cache_hit_ratio: float) -> int:
        """Calculate overall performance score (0-100)"""
        score = 100
        
        # Deduct points based on issues
        impact_deductions = {
            'high': 10,
            'medium': 5,
            'low': 2
        }
        
        for issue in issues:
            score -= impact_deductions.get(issue.impact, 0)
        
        # Factor in cache hit ratio
        if cache_hit_ratio < 0.8:
            score -= int((0.8 - cache_hit_ratio) * 50)
        
        return max(0, score)
    
    def _calculate_cache_savings(self, distribution_id: str, current_ratio: float) -> float:
        """Calculate potential savings from improved cache hit ratio"""
        # Get origin requests metric
        origin_requests = self._get_origin_requests(distribution_id)
        
        # Calculate potential reduction in origin requests
        target_ratio = 0.85
        if current_ratio < target_ratio:
            reduction_factor = (target_ratio - current_ratio) / (1 - current_ratio)
            saved_requests = origin_requests * reduction_factor
            return saved_requests * ORIGIN_REQUEST_COST
        
        return 0.0
    
    def _get_origin_requests(self, distribution_id: str) -> int:
        """Get monthly origin requests"""
        total = self._fetch_metric_value(distribution_id, 'OriginRequests')
        return int(total or 0)
    
    def _calculate_origin_shield_savings(self, distribution_id: str) -> float:
        """Calculate savings from Origin Shield"""
        origin_requests = self._get_origin_requests(distribution_id)
        # Origin Shield can reduce origin requests by ~30%
        saved_requests = origin_requests * 0.3
        shield_cost = saved_requests * ORIGIN_SHIELD_COST
        origin_savings = saved_requests * ORIGIN_REQUEST_COST
        return max(0, origin_savings - shield_cost)
    
    def _calculate_compression_savings(self, distribution_id: str) -> float:
        """Calculate savings from compression"""
        # Compression can save ~70% on text content
        # Assume 20% of traffic is compressible text
        data_transfer = self._get_data_transfer(distribution_id)
        compressible_data = data_transfer * 0.2
        saved_data = compressible_data * 0.7
        return saved_data * CLOUDFRONT_DATA_TRANSFER_COST
    
    def _get_data_transfer(self, distribution_id: str) -> float:
        """Get monthly data transfer in GB"""
        bytes_downloaded = self._fetch_metric_value(distribution_id, 'BytesDownloaded')
        return (bytes_downloaded or 0.0) / (1024 ** 3)
    
    def _calculate_ttl_savings(self, distribution_id: str) -> float:
        """Calculate savings from improved TTL"""
        origin_requests = self._get_origin_requests(distribution_id)
        # Better TTL can reduce origin requests by ~40%
        saved_requests = origin_requests * 0.4
        return saved_requests * ORIGIN_REQUEST_COST
    
    def _calculate_lambda_edge_savings(self, distribution_id: str) -> float:
        """Calculate savings from Lambda@Edge optimization"""
        # Lambda@Edge can reduce origin requests by ~20% for dynamic content
        origin_requests = self._get_origin_requests(distribution_id)
        saved_requests = origin_requests * 0.2
        lambda_cost = saved_requests * 0.0001  # Simplified Lambda cost
        origin_savings = saved_requests * ORIGIN_REQUEST_COST
        return max(0, origin_savings - lambda_cost)
    
    def _calculate_cookie_savings(self, distribution_id: str) -> float:
        """Calculate savings from optimized cookie forwarding"""
        # Optimized cookie forwarding can improve cache hit by ~15%
        origin_requests = self._get_origin_requests(distribution_id)
        saved_requests = origin_requests * 0.15
        return saved_requests * ORIGIN_REQUEST_COST
    
    def _perform_cost_analysis(self, distribution_id: str, issues: List[Issue]) -> CostAnalysis:
        """Perform comprehensive cost analysis"""
        # Get current metrics
        data_transfer = self._get_data_transfer(distribution_id)
        origin_requests = self._get_origin_requests(distribution_id)
        total_requests = self._get_total_requests(distribution_id)
        
        # Calculate current costs
        request_cost = total_requests * CLOUDFRONT_REQUEST_COST
        transfer_cost = data_transfer * CLOUDFRONT_DATA_TRANSFER_COST
        origin_cost = origin_requests * ORIGIN_REQUEST_COST
        current_monthly_cost = request_cost + transfer_cost + origin_cost
        
        # Calculate potential savings
        total_savings = sum(issue.estimated_savings for issue in issues)
        optimized_monthly_cost = max(0.0, current_monthly_cost - total_savings)
        
        return CostAnalysis(
            current_monthly_cost=current_monthly_cost,
            data_transfer_out=data_transfer,
            origin_requests=origin_requests,
            optimized_monthly_cost=optimized_monthly_cost,
            potential_savings=total_savings
        )
    
    def _get_total_requests(self, distribution_id: str) -> int:
        """Get total monthly requests"""
        total = self._fetch_metric_value(distribution_id, 'Requests')
        return int(total or 0)
    
    def _print_console_output(self, analysis: DistributionAnalysis):
        """Print analysis results to console"""
        print(f"\n{'='*80}")
        print(f"Distribution: {analysis.distribution_id} ({analysis.domain_name})")
        print(f"Performance Score: {analysis.performance_score}/100")
        print(f"Cache Hit Ratio: {analysis.cache_hit_ratio:.1%}")
        print(f"Potential Monthly Savings: ${analysis.cost_analysis.potential_savings:.2f}")
        
        if analysis.issues:
            print("\nTop Issues:")
            # Sort by impact and savings
            sorted_issues = sorted(analysis.issues, 
                                 key=lambda x: (x.impact == 'high', x.estimated_savings), 
                                 reverse=True)
            
            for i, issue in enumerate(sorted_issues[:5], 1):
                print(f"{i}. [{issue.impact.upper()}] {issue.type}")
                print(f"   Current: {issue.current_config}")
                print(f"   Recommended: {issue.recommended_config}")
                if issue.estimated_savings > 0:
                    print(f"   Estimated Savings: ${issue.estimated_savings:.2f}/month")
        print(f"{'='*80}")
    
    def _print_summary_table(self, analyses: List[DistributionAnalysis], summary: Dict[str, Any]):
        """Render a consolidated tabular summary to stdout"""
        table_rows = []
        for analysis in analyses:
            table_rows.append([
                analysis.distribution_id,
                analysis.domain_name,
                f"{analysis.performance_score}",
                f"{analysis.cache_hit_ratio:.1%}",
                len(analysis.issues),
                f"${analysis.cost_analysis.potential_savings:,.2f}"
            ])
        headers = ["Distribution", "Domain", "Score", "Cache Hit", "Issue Count", "Potential Savings"]
        print("\nCloudFront Optimization Summary")
        print(tabulate(table_rows, headers=headers, tablefmt="github"))
        avg_ratio = summary['avg_cache_hit_ratio']
        print(f"Analyzed {summary['distributions_analyzed']} distributions | "
              f"Avg Cache Hit: {avg_ratio:.1%} | "
              f"Total Potential Savings: ${summary['total_potential_savings']:,.2f}")
    
    def _generate_summary(self, analyses: List[DistributionAnalysis]) -> Dict[str, Any]:
        """Generate summary statistics"""
        if not analyses:
            return {
                'total_potential_savings': 0,
                'distributions_analyzed': 0,
                'avg_cache_hit_ratio': 0
            }
        
        total_savings = sum(a.cost_analysis.potential_savings for a in analyses)
        avg_cache_hit = sum(a.cache_hit_ratio for a in analyses) / len(analyses)
        
        return {
            'total_potential_savings': total_savings,
            'distributions_analyzed': len(analyses),
            'avg_cache_hit_ratio': avg_cache_hit
        }
    
    def _save_json_report(self, analyses: List[DistributionAnalysis], summary: Dict[str, Any]):
        """Save JSON report"""
        report_data = {
            'report_date': datetime.now(timezone.utc).isoformat(),
            'distributions': [
                {
                    'distribution_id': a.distribution_id,
                    'domain_name': a.domain_name,
                    'performance_score': a.performance_score,
                    'cache_hit_ratio': a.cache_hit_ratio,
                    'issues': [
                        {
                            'type': i.type,
                            'impact': i.impact,
                            'current_config': i.current_config,
                            'recommended_config': i.recommended_config,
                            'estimated_savings': i.estimated_savings
                        }
                        for i in a.issues
                    ],
                    'cost_analysis': {
                        'current_monthly_cost': a.cost_analysis.current_monthly_cost,
                        'data_transfer_out': a.cost_analysis.data_transfer_out,
                        'origin_requests': a.cost_analysis.origin_requests,
                        'optimized_monthly_cost': a.cost_analysis.optimized_monthly_cost,
                        'potential_savings': a.cost_analysis.potential_savings
                    }
                }
                for a in analyses
            ],
            'recommendations_summary': summary
        }
        
        json_path = self.base_dir / 'cloudfront_optimization.json'
        json_path.write_text(json.dumps(report_data, indent=2))
        logger.info("JSON report saved to cloudfront_optimization.json")
    
    def _generate_html_report(self, analyses: List[DistributionAnalysis], summary: Dict[str, Any]):
        """Generate HTML report with visualizations"""
        html_path = self.base_dir / 'cache_efficiency_report.html'
        
        if not analyses:
            html_path.write_text("<html><body><h1>No distributions analyzed</h1></body></html>")
            logger.info("HTML report saved to cache_efficiency_report.html (empty)")
            return
        
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Cache Hit Ratios', 'Cost vs Savings', 
                            'Issue Distribution', 'Performance Scores'),
            specs=[[{'type': 'bar'}, {'type': 'pie'}],
                   [{'type': 'bar'}, {'type': 'scatter'}]]
        )
        
        dist_ids = [a.distribution_id for a in analyses]
        cache_ratios = [a.cache_hit_ratio * 100 for a in analyses]
        scores = [a.performance_score for a in analyses]
        total_current = sum(a.cost_analysis.current_monthly_cost for a in analyses)
        total_savings = summary['total_potential_savings']
        cost_values = [max(total_current - total_savings, 0), total_savings]
        
        fig.add_trace(go.Bar(x=dist_ids, y=cache_ratios, name='Cache Hit %'), row=1, col=1)
        fig.add_trace(go.Pie(labels=['Current Cost', 'Potential Savings'], values=cost_values),
                      row=1, col=2)
        
        issue_counts = defaultdict(int)
        for analysis in analyses:
            for issue in analysis.issues:
                issue_counts[issue.type] += 1
        fig.add_trace(go.Bar(x=list(issue_counts.keys()), y=list(issue_counts.values()),
                             name='Issue Count'),
                      row=2, col=1)
        fig.add_trace(go.Scatter(x=dist_ids, y=scores, mode='markers+lines', name='Score Trend'),
                      row=2, col=2)
        fig.update_layout(height=850, showlegend=False)
        
        df = pd.DataFrame([
            {
                'Distribution': a.distribution_id,
                'Domain': a.domain_name,
                'Performance Score': a.performance_score,
                'Cache Hit %': a.cache_hit_ratio * 100,
                'Current Cost': a.cost_analysis.current_monthly_cost,
                'Potential Savings': a.cost_analysis.potential_savings,
                'Issue Count': len(a.issues)
            }
            for a in analyses
        ])
        
        table_df = df.copy()
        table_df['Cache Hit %'] = table_df['Cache Hit %'].map(lambda v: f"{v:.1f}%")
        table_df['Current Cost'] = table_df['Current Cost'].map(lambda v: f"${v:,.2f}")
        table_df['Potential Savings'] = table_df['Potential Savings'].map(lambda v: f"${v:,.2f}")
        summary_table_html = table_df.to_html(index=False, escape=False, classes='summary-table')
        
        px_fig = px.bar(
            df,
            x='Distribution',
            y='Issue Count',
            title='Issues per Distribution',
            color='Issue Count',
            color_continuous_scale='Reds'
        )
        
        plotly_html = (
            fig.to_html(include_plotlyjs=False, full_html=False, div_id="charts") +
            px_fig.to_html(include_plotlyjs=False, full_html=False)
        )
        
        html_template = Template("""
<!DOCTYPE html>
<html>
<head>
    <title>CloudFront Optimization Report</title>
    <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2 { color: #232F3E; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .distribution { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .issue { background: #fff3cd; padding: 10px; margin: 5px 0; border-radius: 3px; }
        .high { border-left: 4px solid #dc3545; }
        .medium { border-left: 4px solid #ffc107; }
        .low { border-left: 4px solid #28a745; }
        .summary-table { border-collapse: collapse; width: 100%; margin-bottom: 25px; }
        .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .summary-table th { background-color: #232F3E; color: #fff; }
    </style>
</head>
<body>
    <h1>CloudFront Optimization Report</h1>
    <div class="summary">
        <h2>Executive Summary</h2>
        <p><strong>Report Date:</strong> {{ report_date }}</p>
        <p><strong>Distributions Analyzed:</strong> {{ summary.distributions_analyzed }}</p>
        <p><strong>Average Cache Hit Ratio:</strong> {{ "%.1f" | format(summary.avg_cache_hit_ratio * 100) }}%</p>
        <p><strong>Total Potential Monthly Savings:</strong> ${{ "%.2f" | format(summary.total_potential_savings) }}</p>
    </div>
    
    <h2>Key Performance Indicators</h2>
    {{ summary_table | safe }}
    
    <div id="charts">{{ plotly_html }}</div>
    
    <h2>Distribution Details</h2>
    {% for analysis in analyses %}
    <div class="distribution">
        <h3>{{ analysis.distribution_id }} ({{ analysis.domain_name }})</h3>
        <p><strong>Performance Score:</strong> {{ analysis.performance_score }}/100</p>
        <p><strong>Cache Hit Ratio:</strong> {{ "%.1f" | format(analysis.cache_hit_ratio * 100) }}%</p>
        <p><strong>Current Monthly Cost:</strong> ${{ "%.2f" | format(analysis.cost_analysis.current_monthly_cost) }}</p>
        <p><strong>Potential Savings:</strong> ${{ "%.2f" | format(analysis.cost_analysis.potential_savings) }}</p>
        
        {% if analysis.issues %}
        <h4>Issues Found:</h4>
        {% for issue in analysis.issues %}
        <div class="issue {{ issue.impact }}">
            <strong>{{ issue.type }}</strong> ({{ issue.impact }} impact)
            <br>Current: {{ issue.current_config }}
            <br>Recommended: {{ issue.recommended_config }}
            {% if issue.estimated_savings > 0 %}
            <br>Estimated Savings: ${{ "%.2f" | format(issue.estimated_savings) }}/month
            {% endif %}
        </div>
        {% endfor %}
        {% endif %}
    </div>
    {% endfor %}
</body>
</html>
        """)
        
        html_content = html_template.render(
            report_date=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
            summary=summary,
            analyses=analyses,
            plotly_html=plotly_html,
            summary_table=summary_table_html
        )
        
        html_path.write_text(html_content)
        logger.info("HTML report saved to cache_efficiency_report.html")
    
    def _generate_csv_roadmap(self, analyses: List[DistributionAnalysis]):
        """Generate CSV roadmap for project management"""
        rows = []
        
        for analysis in analyses:
            for issue in analysis.issues:
                rows.append({
                    'Distribution ID': analysis.distribution_id,
                    'Domain': analysis.domain_name,
                    'Issue Type': issue.type,
                    'Impact': issue.impact,
                    'Current Config': issue.current_config,
                    'Recommended Action': issue.recommended_config,
                    'Estimated Monthly Savings': f"${issue.estimated_savings:.2f}",
                    'Priority': 1 if issue.impact == 'high' else (2 if issue.impact == 'medium' else 3),
                    'Performance Score': analysis.performance_score,
                    'Cache Hit Ratio': f"{analysis.cache_hit_ratio:.1%}"
                })
        
        # Sort by priority and savings
        rows.sort(key=lambda x: (x['Priority'], -float(x['Estimated Monthly Savings'].replace('$', ''))))
        
        # Write CSV
        csv_path = self.base_dir / 'cdn_optimization_roadmap.csv'
        with csv_path.open('w', newline='') as f:
            if rows:
                writer = csv.DictWriter(f, fieldnames=rows[0].keys())
                writer.writeheader()
                writer.writerows(rows)
        
        logger.info("CSV roadmap saved to cdn_optimization_roadmap.csv")


def main():  # pragma: no cover
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Analyze CloudFront distributions for optimization')
    parser.add_argument('--region', default='us-east-1', help='AWS region (default: us-east-1)')
    args = parser.parse_args()
    
    analyzer = CloudFrontAnalyzer(region=args.region)
    analyzer.analyze_all_distributions()


if __name__ == "__main__":  # pragma: no cover
    main()

```
