#!/bin/bash

# Extract networking.py
cd /var/www/turing/iac-test-automations/worktree/synth-101912376/lib

# Extract files from MODEL_RESPONSE.md
grep -A 10000 "## File: lib/networking.py" MODEL_RESPONSE.md | grep -A 9999 '```python' | grep -B 9999 -m 1 '^```$' | grep -v '```' > networking.py.tmp && mv networking.py.tmp networking.py

grep -A 10000 "## File: lib/compute.py" MODEL_RESPONSE.md | grep -A 9999 '```python' | grep -B 9999 -m 1 '^```$' | grep -v '```' > compute.py.tmp && mv compute.py.tmp compute.py

grep -A 10000 "## File: lib/database.py" MODEL_RESPONSE.md | grep -A 9999 '```python' | grep -B 9999 -m 1 '^```$' | grep -v '```' > database.py.tmp && mv database.py.tmp database.py

grep -A 10000 "## File: lib/iam.py" MODEL_RESPONSE.md | grep -A 9999 '```python' | grep -B 9999 -m 1 '^```$' | grep -v '```' > iam.py.tmp && mv iam.py.tmp iam.py

grep -A 10000 "## File: lib/monitoring.py" MODEL_RESPONSE.md | grep -A 9999 '```python' | grep -B 9999 -m 1 '^```$' | grep -v '```' > monitoring.py.tmp && mv monitoring.py.tmp monitoring.py

grep -A 10000 "## File: lib/drift_detector.py" MODEL_RESPONSE.md | grep -A 9999 '```python' | grep -B 9999 -m 1 '^```$' | grep -v '```' > drift_detector.py.tmp && mv drift_detector.py.tmp drift_detector.py

echo "Code extraction complete"
ls -lh *.py
