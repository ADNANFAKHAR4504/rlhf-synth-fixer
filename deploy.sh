#!/bin/bash
set -e

export PULUMI_CONFIG_PASSPHRASE=""
export ENVIRONMENT_SUFFIX="synth7up57r"

pulumi stack select dev
pulumi up --yes
