#!/usr/bin/env node
import { TapStack } from '../lib/tap-stack';

const stack = new TapStack('tap', {
  tags: {
    Project: 'EKS-AutoScaling',
    Owner: 'DevOps',
  },
});

export const vpcId = stack.vpcId;
export const clusterName = stack.clusterName;
export const clusterEndpoint = stack.clusterEndpoint;
export const clusterCertificateAuthority = stack.clusterCertificateAuthority;
export const kubeconfig = stack.kubeconfig;
