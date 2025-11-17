export interface RegionalConfig {
  region: string;
  isPrimary: boolean;
  wafBlockedCountries: string[];
  cloudWatchLatencyThreshold: number;
  environmentSuffix: string;
}

export interface MultiRegionStackProps {
  primaryRegion: RegionalConfig;
  secondaryRegion: RegionalConfig;
  tags: {
    Environment: string;
    CostCenter: string;
  };
}
