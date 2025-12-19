# MODEL FAILURES

## Critical Failures

### 1. Missing boto_client Helper Function
The model used direct `boto3.client()` calls without implementing the `boto_client()` helper function required for Moto endpoint support.

```python
self.kinesis_client = boto3.client('kinesis', region_name=region)
self.firehose_client = boto3.client('firehose', region_name=region)
self.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
```

```python
self.kinesis_client = boto_client('kinesis', region)
self.firehose_client = boto_client('firehose', region)
self.cloudwatch_client = boto_client('cloudwatch', region)
```

---

### 2. Missing Fallback Imports for CI Pipeline Compatibility
The model imported pandas, numpy, and plotly without try-except fallback handling, causing ImportError in CI environments.

```python
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
```

```python
try:
    import pandas as pd
    import numpy as np
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    pd = None
    np = None

try:
    import plotly.graph_objects as go
    import plotly.express as px
    from plotly.subplots import make_subplots
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
```

---

### 3. Incorrect CloudWatch Metric Names for Throttling
The model used incorrect metric names for throttling detection.

```python
throttle_metrics = self._get_cloudwatch_metrics(
    'AWS/Kinesis', 'UserRecords.ProvisionedThroughputExceeded',
    dimensions, start_time, end_time, 'Sum'
)

put_metrics = self._get_cloudwatch_metrics(
    'AWS/Kinesis', 'UserRecords.Success',
    dimensions, start_time, end_time, 'Sum'
)
```

```python
throttle_metrics = self._get_cloudwatch_metrics(
    'AWS/Kinesis', 'WriteProvisionedThroughputExceeded',
    dimensions, start_time, end_time, 'Sum'
)

put_metrics = self._get_cloudwatch_metrics(
    'AWS/Kinesis', 'PutRecords.Success',
    dimensions, start_time, end_time, 'Sum'
)
```

---

### 4. Incorrect CloudWatch Namespace for Firehose
The model used wrong namespace for Firehose metrics.

```python
record_metrics = self._get_cloudwatch_metrics(
    'AWS/Kinesis/Firehose', 'IncomingRecords', dimensions,
    end_time - timedelta(hours=1), end_time, 'Sum'
)
```

```python
record_metrics = self._get_cloudwatch_metrics(
    'AWS/Firehose', 'IncomingRecords', dimensions,
    end_time - timedelta(hours=1), end_time, 'Sum'
)
```

---

### 5. Missing Fallback for numpy Usage in On-Demand Check
The model used numpy functions without checking if numpy is available.

```python
mean_traffic = np.mean(hourly_metrics)
std_traffic = np.std(hourly_metrics)
```

```python
if hourly_metrics and PANDAS_AVAILABLE:
    mean_traffic = sum(hourly_metrics) / len(hourly_metrics) if hourly_metrics else 0
    variance = sum((x - mean_traffic) ** 2 for x in hourly_metrics) / len(hourly_metrics) if hourly_metrics else 0
    std_traffic = variance ** 0.5
```

---

### 6. Missing boto_client Usage in Cross-Region Check
The model used direct `boto3.client()` call instead of `boto_client()` helper.

```python
dr_client = boto3.client('kinesis', region_name=region)
```

```python
dr_client = boto_client('kinesis', region)
```

---

### 7. Incomplete Error Handling for Missing Dictionary Keys
The model didn't use `.get()` method consistently, risking KeyError.

```python
avg_records_per_minute = sum(m['Sum'] for m in record_count_metrics) / 60
```

```python
avg_records_per_minute = sum(m.get('Sum', 0) for m in record_count_metrics) / 60
```

---

### 8. Missing Throttling Alarm Check in CloudWatch Alarms Validation
The model used wrong metric name for throttling alarms.

```python
throttle_alarms = self.cloudwatch_client.describe_alarms_for_metric(
    MetricName='UserRecords.ProvisionedThroughputExceeded',
    Namespace='AWS/Kinesis',
    Dimensions=[{'Name': 'StreamName', 'Value': stream_name}]
)
```

```python
throttle_alarms = self.cloudwatch_client.describe_alarms_for_metric(
    MetricName='WriteProvisionedThroughputExceeded',
    Namespace='AWS/Kinesis',
    Dimensions=[{'Name': 'StreamName', 'Value': stream_name}]
)
```

---

### 9. Missing Consumer Status Check
The model didn't use `.get()` for optional 'ConsumerStatus' field.

```python
if consumer['ConsumerStatus'] == 'ACTIVE':
```

```python
if consumer.get('ConsumerStatus') == 'ACTIVE':
```

---

### 10. Missing Safety Check for Empty Shard Metrics
The model didn't check if shard_metrics dictionary has values before calculating average.

```python
if shard_metrics:
    avg_bytes = sum(shard_metrics.values()) / len(shard_metrics)
```

```python
if shard_metrics and len(shard_metrics) > 0:
    avg_bytes = sum(shard_metrics.values()) / len(shard_metrics)
```
