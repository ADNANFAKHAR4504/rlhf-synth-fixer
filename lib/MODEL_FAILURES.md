    raise RuntimeError(resp.error) from JavaScriptError(resp.stack)
RuntimeError: Lambda Functions in a public subnet can NOT access the internet. If you are aware of this limitation and would still like to place the function in a public subnet, set `allowPublicSubnet` to true
pipenv run python3 tap.py: Subprocess exited with error 1

