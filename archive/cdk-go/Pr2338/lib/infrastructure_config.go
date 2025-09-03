package lib

// InfrastructureConfig holds configurable parameters for the infrastructure
type InfrastructureConfig struct {
	// EC2 instance type - configurable variable with default
	InstanceType string

	// Environment name for resource naming and tagging
	EnvironmentName string

	// AWS Region for deployment
	Region string

	// Enable enhanced monitoring (additional cost)
	EnableDetailedMonitoring bool

	// Number of NAT Gateways (1 for cost optimization, 2+ for HA)
	NatGateways int
}

// DefaultConfig returns the default configuration optimized for production use
func DefaultConfig() *InfrastructureConfig {
	return &InfrastructureConfig{
		InstanceType:             "t3.micro", // Free tier eligible
		EnvironmentName:          "Production",
		Region:                   "us-east-1",
		EnableDetailedMonitoring: false, // Disabled for cost optimization
		NatGateways:              1,     // Single NAT Gateway for cost optimization
	}
}

// GetInstanceTypeFromContext retrieves instance type from CDK context or uses default
func (config *InfrastructureConfig) GetInstanceTypeFromContext(contextValue interface{}) string {
	if contextValue != nil {
		if instanceType, ok := contextValue.(string); ok && instanceType != "" {
			return instanceType
		}
	}
	return config.InstanceType
}
