// Helper function to check if a resource exists in synthesized CDKTF
export function hasResource(synth: string, resourceType: string): boolean {
  const config = JSON.parse(synth);
  if (config.resource && config.resource[resourceType]) {
    return Object.keys(config.resource[resourceType]).length > 0;
  }
  return false;
}

// Helper function to check resource properties
export function hasResourceWithProperties(
  synth: string,
  resourceType: string,
  properties: Record<string, unknown>
): boolean {
  const config = JSON.parse(synth);
  if (!config.resource || !config.resource[resourceType]) {
    return false;
  }

  const resources = config.resource[resourceType];
  for (const resourceKey in resources) {
    const resource = resources[resourceKey];
    let allMatch = true;
    for (const prop in properties) {
      if (resource[prop] !== properties[prop]) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) {
      return true;
    }
  }
  return false;
}

// Helper function to check outputs
export function hasOutput(synth: string, outputName: string): boolean {
  const config = JSON.parse(synth);
  if (config.output && config.output[outputName]) {
    return true;
  }
  return false;
}

// Helper function to check provider
export function hasProvider(synth: string, providerName: string): boolean {
  const config = JSON.parse(synth);
  if (config.provider && config.provider[providerName]) {
    return true;
  }
  if (config.terraform && config.terraform.required_providers) {
    return providerName in config.terraform.required_providers;
  }
  return false;
}
