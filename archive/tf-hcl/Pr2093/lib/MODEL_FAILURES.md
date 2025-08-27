There were few below issues with the model fresponse - 

1. Incomeplete response in the Turn 1, Model did not provide the complete tap_stack.tf file which could be used in the deployment even in 2 Turns.
Fix- Had to explicitly explain the model to generate continious outputs from the previous outputs.

2. The issue with the random password string. Model did not include proper Hard password random string for the RDS passwords.
