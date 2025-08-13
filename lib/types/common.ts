export interface BaseResourceArgs {
  tags: Record<string, string>;
}

export interface SecurityConfig {
  requireMFA: boolean;
  encryptionEnabled: boolean;
  region: string;
}
