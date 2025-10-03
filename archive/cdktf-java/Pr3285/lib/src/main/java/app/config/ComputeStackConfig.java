package app.config;

import app.stacks.MonitoringStack;
import app.stacks.NetworkStack;
import app.stacks.StorageStack;

public record ComputeStackConfig(NetworkStack network, StorageStack storage, MonitoringStack monitoring) {
}
