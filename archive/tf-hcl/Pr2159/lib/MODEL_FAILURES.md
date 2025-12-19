
Model had these failures -

1. Model didn't add the KMS key encryption for the secondary RDS which is getting replicated from the primary region RDS.
Fix - had to genertae Turn2 which provded the full code snippet for the fix.

2. Model was not able to provide the full respinse so had to create turn 2 for the same to complete it.

3. Model kept the route53 dns entry name very egenric which was causing issue. Had to generate the route53 name dynamically.
