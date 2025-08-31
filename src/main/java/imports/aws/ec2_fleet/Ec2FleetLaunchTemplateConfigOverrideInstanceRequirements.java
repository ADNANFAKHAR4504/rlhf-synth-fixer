package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.076Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements")
@software.amazon.jsii.Jsii.Proxy(Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements.Jsii$Proxy.class)
public interface Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements extends software.amazon.jsii.JsiiSerializable {

    /**
     * memory_mib block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_mib Ec2Fleet#memory_mib}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib getMemoryMib();

    /**
     * vcpu_count block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#vcpu_count Ec2Fleet#vcpu_count}
     */
    @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount getVcpuCount();

    /**
     * accelerator_count block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_count Ec2Fleet#accelerator_count}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount getAcceleratorCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_manufacturers Ec2Fleet#accelerator_manufacturers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorManufacturers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_names Ec2Fleet#accelerator_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorNames() {
        return null;
    }

    /**
     * accelerator_total_memory_mib block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_total_memory_mib Ec2Fleet#accelerator_total_memory_mib}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib getAcceleratorTotalMemoryMib() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_types Ec2Fleet#accelerator_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allowed_instance_types Ec2Fleet#allowed_instance_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedInstanceTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#bare_metal Ec2Fleet#bare_metal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBareMetal() {
        return null;
    }

    /**
     * baseline_ebs_bandwidth_mbps block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#baseline_ebs_bandwidth_mbps Ec2Fleet#baseline_ebs_bandwidth_mbps}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps getBaselineEbsBandwidthMbps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#burstable_performance Ec2Fleet#burstable_performance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBurstablePerformance() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#cpu_manufacturers Ec2Fleet#cpu_manufacturers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCpuManufacturers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excluded_instance_types Ec2Fleet#excluded_instance_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludedInstanceTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_generations Ec2Fleet#instance_generations}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceGenerations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage Ec2Fleet#local_storage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage_types Ec2Fleet#local_storage_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLocalStorageTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_spot_price_as_percentage_of_optimal_on_demand_price Ec2Fleet#max_spot_price_as_percentage_of_optimal_on_demand_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxSpotPriceAsPercentageOfOptimalOnDemandPrice() {
        return null;
    }

    /**
     * memory_gib_per_vcpu block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_gib_per_vcpu Ec2Fleet#memory_gib_per_vcpu}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu getMemoryGibPerVcpu() {
        return null;
    }

    /**
     * network_bandwidth_gbps block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_bandwidth_gbps Ec2Fleet#network_bandwidth_gbps}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps getNetworkBandwidthGbps() {
        return null;
    }

    /**
     * network_interface_count block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_interface_count Ec2Fleet#network_interface_count}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount getNetworkInterfaceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_max_price_percentage_over_lowest_price Ec2Fleet#on_demand_max_price_percentage_over_lowest_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOnDemandMaxPricePercentageOverLowestPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#require_hibernate_support Ec2Fleet#require_hibernate_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireHibernateSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_max_price_percentage_over_lowest_price Ec2Fleet#spot_max_price_percentage_over_lowest_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSpotMaxPricePercentageOverLowestPrice() {
        return null;
    }

    /**
     * total_local_storage_gb block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#total_local_storage_gb Ec2Fleet#total_local_storage_gb}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb getTotalLocalStorageGb() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements> {
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib memoryMib;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount vcpuCount;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount acceleratorCount;
        java.util.List<java.lang.String> acceleratorManufacturers;
        java.util.List<java.lang.String> acceleratorNames;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib acceleratorTotalMemoryMib;
        java.util.List<java.lang.String> acceleratorTypes;
        java.util.List<java.lang.String> allowedInstanceTypes;
        java.lang.String bareMetal;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps baselineEbsBandwidthMbps;
        java.lang.String burstablePerformance;
        java.util.List<java.lang.String> cpuManufacturers;
        java.util.List<java.lang.String> excludedInstanceTypes;
        java.util.List<java.lang.String> instanceGenerations;
        java.lang.String localStorage;
        java.util.List<java.lang.String> localStorageTypes;
        java.lang.Number maxSpotPriceAsPercentageOfOptimalOnDemandPrice;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu memoryGibPerVcpu;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps networkBandwidthGbps;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount networkInterfaceCount;
        java.lang.Number onDemandMaxPricePercentageOverLowestPrice;
        java.lang.Object requireHibernateSupport;
        java.lang.Number spotMaxPricePercentageOverLowestPrice;
        imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb totalLocalStorageGb;

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getMemoryMib}
         * @param memoryMib memory_mib block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_mib Ec2Fleet#memory_mib}
         * @return {@code this}
         */
        public Builder memoryMib(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib memoryMib) {
            this.memoryMib = memoryMib;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getVcpuCount}
         * @param vcpuCount vcpu_count block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#vcpu_count Ec2Fleet#vcpu_count}
         * @return {@code this}
         */
        public Builder vcpuCount(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount vcpuCount) {
            this.vcpuCount = vcpuCount;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getAcceleratorCount}
         * @param acceleratorCount accelerator_count block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_count Ec2Fleet#accelerator_count}
         * @return {@code this}
         */
        public Builder acceleratorCount(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount acceleratorCount) {
            this.acceleratorCount = acceleratorCount;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getAcceleratorManufacturers}
         * @param acceleratorManufacturers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_manufacturers Ec2Fleet#accelerator_manufacturers}.
         * @return {@code this}
         */
        public Builder acceleratorManufacturers(java.util.List<java.lang.String> acceleratorManufacturers) {
            this.acceleratorManufacturers = acceleratorManufacturers;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getAcceleratorNames}
         * @param acceleratorNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_names Ec2Fleet#accelerator_names}.
         * @return {@code this}
         */
        public Builder acceleratorNames(java.util.List<java.lang.String> acceleratorNames) {
            this.acceleratorNames = acceleratorNames;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getAcceleratorTotalMemoryMib}
         * @param acceleratorTotalMemoryMib accelerator_total_memory_mib block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_total_memory_mib Ec2Fleet#accelerator_total_memory_mib}
         * @return {@code this}
         */
        public Builder acceleratorTotalMemoryMib(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib acceleratorTotalMemoryMib) {
            this.acceleratorTotalMemoryMib = acceleratorTotalMemoryMib;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getAcceleratorTypes}
         * @param acceleratorTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#accelerator_types Ec2Fleet#accelerator_types}.
         * @return {@code this}
         */
        public Builder acceleratorTypes(java.util.List<java.lang.String> acceleratorTypes) {
            this.acceleratorTypes = acceleratorTypes;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getAllowedInstanceTypes}
         * @param allowedInstanceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#allowed_instance_types Ec2Fleet#allowed_instance_types}.
         * @return {@code this}
         */
        public Builder allowedInstanceTypes(java.util.List<java.lang.String> allowedInstanceTypes) {
            this.allowedInstanceTypes = allowedInstanceTypes;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getBareMetal}
         * @param bareMetal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#bare_metal Ec2Fleet#bare_metal}.
         * @return {@code this}
         */
        public Builder bareMetal(java.lang.String bareMetal) {
            this.bareMetal = bareMetal;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getBaselineEbsBandwidthMbps}
         * @param baselineEbsBandwidthMbps baseline_ebs_bandwidth_mbps block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#baseline_ebs_bandwidth_mbps Ec2Fleet#baseline_ebs_bandwidth_mbps}
         * @return {@code this}
         */
        public Builder baselineEbsBandwidthMbps(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps baselineEbsBandwidthMbps) {
            this.baselineEbsBandwidthMbps = baselineEbsBandwidthMbps;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getBurstablePerformance}
         * @param burstablePerformance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#burstable_performance Ec2Fleet#burstable_performance}.
         * @return {@code this}
         */
        public Builder burstablePerformance(java.lang.String burstablePerformance) {
            this.burstablePerformance = burstablePerformance;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getCpuManufacturers}
         * @param cpuManufacturers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#cpu_manufacturers Ec2Fleet#cpu_manufacturers}.
         * @return {@code this}
         */
        public Builder cpuManufacturers(java.util.List<java.lang.String> cpuManufacturers) {
            this.cpuManufacturers = cpuManufacturers;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getExcludedInstanceTypes}
         * @param excludedInstanceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#excluded_instance_types Ec2Fleet#excluded_instance_types}.
         * @return {@code this}
         */
        public Builder excludedInstanceTypes(java.util.List<java.lang.String> excludedInstanceTypes) {
            this.excludedInstanceTypes = excludedInstanceTypes;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getInstanceGenerations}
         * @param instanceGenerations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#instance_generations Ec2Fleet#instance_generations}.
         * @return {@code this}
         */
        public Builder instanceGenerations(java.util.List<java.lang.String> instanceGenerations) {
            this.instanceGenerations = instanceGenerations;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getLocalStorage}
         * @param localStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage Ec2Fleet#local_storage}.
         * @return {@code this}
         */
        public Builder localStorage(java.lang.String localStorage) {
            this.localStorage = localStorage;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getLocalStorageTypes}
         * @param localStorageTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#local_storage_types Ec2Fleet#local_storage_types}.
         * @return {@code this}
         */
        public Builder localStorageTypes(java.util.List<java.lang.String> localStorageTypes) {
            this.localStorageTypes = localStorageTypes;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getMaxSpotPriceAsPercentageOfOptimalOnDemandPrice}
         * @param maxSpotPriceAsPercentageOfOptimalOnDemandPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#max_spot_price_as_percentage_of_optimal_on_demand_price Ec2Fleet#max_spot_price_as_percentage_of_optimal_on_demand_price}.
         * @return {@code this}
         */
        public Builder maxSpotPriceAsPercentageOfOptimalOnDemandPrice(java.lang.Number maxSpotPriceAsPercentageOfOptimalOnDemandPrice) {
            this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice = maxSpotPriceAsPercentageOfOptimalOnDemandPrice;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getMemoryGibPerVcpu}
         * @param memoryGibPerVcpu memory_gib_per_vcpu block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#memory_gib_per_vcpu Ec2Fleet#memory_gib_per_vcpu}
         * @return {@code this}
         */
        public Builder memoryGibPerVcpu(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu memoryGibPerVcpu) {
            this.memoryGibPerVcpu = memoryGibPerVcpu;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getNetworkBandwidthGbps}
         * @param networkBandwidthGbps network_bandwidth_gbps block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_bandwidth_gbps Ec2Fleet#network_bandwidth_gbps}
         * @return {@code this}
         */
        public Builder networkBandwidthGbps(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps networkBandwidthGbps) {
            this.networkBandwidthGbps = networkBandwidthGbps;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getNetworkInterfaceCount}
         * @param networkInterfaceCount network_interface_count block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#network_interface_count Ec2Fleet#network_interface_count}
         * @return {@code this}
         */
        public Builder networkInterfaceCount(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount networkInterfaceCount) {
            this.networkInterfaceCount = networkInterfaceCount;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getOnDemandMaxPricePercentageOverLowestPrice}
         * @param onDemandMaxPricePercentageOverLowestPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#on_demand_max_price_percentage_over_lowest_price Ec2Fleet#on_demand_max_price_percentage_over_lowest_price}.
         * @return {@code this}
         */
        public Builder onDemandMaxPricePercentageOverLowestPrice(java.lang.Number onDemandMaxPricePercentageOverLowestPrice) {
            this.onDemandMaxPricePercentageOverLowestPrice = onDemandMaxPricePercentageOverLowestPrice;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getRequireHibernateSupport}
         * @param requireHibernateSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#require_hibernate_support Ec2Fleet#require_hibernate_support}.
         * @return {@code this}
         */
        public Builder requireHibernateSupport(java.lang.Boolean requireHibernateSupport) {
            this.requireHibernateSupport = requireHibernateSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getRequireHibernateSupport}
         * @param requireHibernateSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#require_hibernate_support Ec2Fleet#require_hibernate_support}.
         * @return {@code this}
         */
        public Builder requireHibernateSupport(com.hashicorp.cdktf.IResolvable requireHibernateSupport) {
            this.requireHibernateSupport = requireHibernateSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getSpotMaxPricePercentageOverLowestPrice}
         * @param spotMaxPricePercentageOverLowestPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#spot_max_price_percentage_over_lowest_price Ec2Fleet#spot_max_price_percentage_over_lowest_price}.
         * @return {@code this}
         */
        public Builder spotMaxPricePercentageOverLowestPrice(java.lang.Number spotMaxPricePercentageOverLowestPrice) {
            this.spotMaxPricePercentageOverLowestPrice = spotMaxPricePercentageOverLowestPrice;
            return this;
        }

        /**
         * Sets the value of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements#getTotalLocalStorageGb}
         * @param totalLocalStorageGb total_local_storage_gb block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_fleet#total_local_storage_gb Ec2Fleet#total_local_storage_gb}
         * @return {@code this}
         */
        public Builder totalLocalStorageGb(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb totalLocalStorageGb) {
            this.totalLocalStorageGb = totalLocalStorageGb;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements {
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib memoryMib;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount vcpuCount;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount acceleratorCount;
        private final java.util.List<java.lang.String> acceleratorManufacturers;
        private final java.util.List<java.lang.String> acceleratorNames;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib acceleratorTotalMemoryMib;
        private final java.util.List<java.lang.String> acceleratorTypes;
        private final java.util.List<java.lang.String> allowedInstanceTypes;
        private final java.lang.String bareMetal;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps baselineEbsBandwidthMbps;
        private final java.lang.String burstablePerformance;
        private final java.util.List<java.lang.String> cpuManufacturers;
        private final java.util.List<java.lang.String> excludedInstanceTypes;
        private final java.util.List<java.lang.String> instanceGenerations;
        private final java.lang.String localStorage;
        private final java.util.List<java.lang.String> localStorageTypes;
        private final java.lang.Number maxSpotPriceAsPercentageOfOptimalOnDemandPrice;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu memoryGibPerVcpu;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps networkBandwidthGbps;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount networkInterfaceCount;
        private final java.lang.Number onDemandMaxPricePercentageOverLowestPrice;
        private final java.lang.Object requireHibernateSupport;
        private final java.lang.Number spotMaxPricePercentageOverLowestPrice;
        private final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb totalLocalStorageGb;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.memoryMib = software.amazon.jsii.Kernel.get(this, "memoryMib", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib.class));
            this.vcpuCount = software.amazon.jsii.Kernel.get(this, "vcpuCount", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount.class));
            this.acceleratorCount = software.amazon.jsii.Kernel.get(this, "acceleratorCount", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount.class));
            this.acceleratorManufacturers = software.amazon.jsii.Kernel.get(this, "acceleratorManufacturers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.acceleratorNames = software.amazon.jsii.Kernel.get(this, "acceleratorNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.acceleratorTotalMemoryMib = software.amazon.jsii.Kernel.get(this, "acceleratorTotalMemoryMib", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib.class));
            this.acceleratorTypes = software.amazon.jsii.Kernel.get(this, "acceleratorTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allowedInstanceTypes = software.amazon.jsii.Kernel.get(this, "allowedInstanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.bareMetal = software.amazon.jsii.Kernel.get(this, "bareMetal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.baselineEbsBandwidthMbps = software.amazon.jsii.Kernel.get(this, "baselineEbsBandwidthMbps", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps.class));
            this.burstablePerformance = software.amazon.jsii.Kernel.get(this, "burstablePerformance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cpuManufacturers = software.amazon.jsii.Kernel.get(this, "cpuManufacturers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.excludedInstanceTypes = software.amazon.jsii.Kernel.get(this, "excludedInstanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.instanceGenerations = software.amazon.jsii.Kernel.get(this, "instanceGenerations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.localStorage = software.amazon.jsii.Kernel.get(this, "localStorage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localStorageTypes = software.amazon.jsii.Kernel.get(this, "localStorageTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice = software.amazon.jsii.Kernel.get(this, "maxSpotPriceAsPercentageOfOptimalOnDemandPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.memoryGibPerVcpu = software.amazon.jsii.Kernel.get(this, "memoryGibPerVcpu", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu.class));
            this.networkBandwidthGbps = software.amazon.jsii.Kernel.get(this, "networkBandwidthGbps", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps.class));
            this.networkInterfaceCount = software.amazon.jsii.Kernel.get(this, "networkInterfaceCount", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount.class));
            this.onDemandMaxPricePercentageOverLowestPrice = software.amazon.jsii.Kernel.get(this, "onDemandMaxPricePercentageOverLowestPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.requireHibernateSupport = software.amazon.jsii.Kernel.get(this, "requireHibernateSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.spotMaxPricePercentageOverLowestPrice = software.amazon.jsii.Kernel.get(this, "spotMaxPricePercentageOverLowestPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.totalLocalStorageGb = software.amazon.jsii.Kernel.get(this, "totalLocalStorageGb", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.memoryMib = java.util.Objects.requireNonNull(builder.memoryMib, "memoryMib is required");
            this.vcpuCount = java.util.Objects.requireNonNull(builder.vcpuCount, "vcpuCount is required");
            this.acceleratorCount = builder.acceleratorCount;
            this.acceleratorManufacturers = builder.acceleratorManufacturers;
            this.acceleratorNames = builder.acceleratorNames;
            this.acceleratorTotalMemoryMib = builder.acceleratorTotalMemoryMib;
            this.acceleratorTypes = builder.acceleratorTypes;
            this.allowedInstanceTypes = builder.allowedInstanceTypes;
            this.bareMetal = builder.bareMetal;
            this.baselineEbsBandwidthMbps = builder.baselineEbsBandwidthMbps;
            this.burstablePerformance = builder.burstablePerformance;
            this.cpuManufacturers = builder.cpuManufacturers;
            this.excludedInstanceTypes = builder.excludedInstanceTypes;
            this.instanceGenerations = builder.instanceGenerations;
            this.localStorage = builder.localStorage;
            this.localStorageTypes = builder.localStorageTypes;
            this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice = builder.maxSpotPriceAsPercentageOfOptimalOnDemandPrice;
            this.memoryGibPerVcpu = builder.memoryGibPerVcpu;
            this.networkBandwidthGbps = builder.networkBandwidthGbps;
            this.networkInterfaceCount = builder.networkInterfaceCount;
            this.onDemandMaxPricePercentageOverLowestPrice = builder.onDemandMaxPricePercentageOverLowestPrice;
            this.requireHibernateSupport = builder.requireHibernateSupport;
            this.spotMaxPricePercentageOverLowestPrice = builder.spotMaxPricePercentageOverLowestPrice;
            this.totalLocalStorageGb = builder.totalLocalStorageGb;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib getMemoryMib() {
            return this.memoryMib;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount getVcpuCount() {
            return this.vcpuCount;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount getAcceleratorCount() {
            return this.acceleratorCount;
        }

        @Override
        public final java.util.List<java.lang.String> getAcceleratorManufacturers() {
            return this.acceleratorManufacturers;
        }

        @Override
        public final java.util.List<java.lang.String> getAcceleratorNames() {
            return this.acceleratorNames;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib getAcceleratorTotalMemoryMib() {
            return this.acceleratorTotalMemoryMib;
        }

        @Override
        public final java.util.List<java.lang.String> getAcceleratorTypes() {
            return this.acceleratorTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedInstanceTypes() {
            return this.allowedInstanceTypes;
        }

        @Override
        public final java.lang.String getBareMetal() {
            return this.bareMetal;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps getBaselineEbsBandwidthMbps() {
            return this.baselineEbsBandwidthMbps;
        }

        @Override
        public final java.lang.String getBurstablePerformance() {
            return this.burstablePerformance;
        }

        @Override
        public final java.util.List<java.lang.String> getCpuManufacturers() {
            return this.cpuManufacturers;
        }

        @Override
        public final java.util.List<java.lang.String> getExcludedInstanceTypes() {
            return this.excludedInstanceTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getInstanceGenerations() {
            return this.instanceGenerations;
        }

        @Override
        public final java.lang.String getLocalStorage() {
            return this.localStorage;
        }

        @Override
        public final java.util.List<java.lang.String> getLocalStorageTypes() {
            return this.localStorageTypes;
        }

        @Override
        public final java.lang.Number getMaxSpotPriceAsPercentageOfOptimalOnDemandPrice() {
            return this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu getMemoryGibPerVcpu() {
            return this.memoryGibPerVcpu;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps getNetworkBandwidthGbps() {
            return this.networkBandwidthGbps;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount getNetworkInterfaceCount() {
            return this.networkInterfaceCount;
        }

        @Override
        public final java.lang.Number getOnDemandMaxPricePercentageOverLowestPrice() {
            return this.onDemandMaxPricePercentageOverLowestPrice;
        }

        @Override
        public final java.lang.Object getRequireHibernateSupport() {
            return this.requireHibernateSupport;
        }

        @Override
        public final java.lang.Number getSpotMaxPricePercentageOverLowestPrice() {
            return this.spotMaxPricePercentageOverLowestPrice;
        }

        @Override
        public final imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb getTotalLocalStorageGb() {
            return this.totalLocalStorageGb;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("memoryMib", om.valueToTree(this.getMemoryMib()));
            data.set("vcpuCount", om.valueToTree(this.getVcpuCount()));
            if (this.getAcceleratorCount() != null) {
                data.set("acceleratorCount", om.valueToTree(this.getAcceleratorCount()));
            }
            if (this.getAcceleratorManufacturers() != null) {
                data.set("acceleratorManufacturers", om.valueToTree(this.getAcceleratorManufacturers()));
            }
            if (this.getAcceleratorNames() != null) {
                data.set("acceleratorNames", om.valueToTree(this.getAcceleratorNames()));
            }
            if (this.getAcceleratorTotalMemoryMib() != null) {
                data.set("acceleratorTotalMemoryMib", om.valueToTree(this.getAcceleratorTotalMemoryMib()));
            }
            if (this.getAcceleratorTypes() != null) {
                data.set("acceleratorTypes", om.valueToTree(this.getAcceleratorTypes()));
            }
            if (this.getAllowedInstanceTypes() != null) {
                data.set("allowedInstanceTypes", om.valueToTree(this.getAllowedInstanceTypes()));
            }
            if (this.getBareMetal() != null) {
                data.set("bareMetal", om.valueToTree(this.getBareMetal()));
            }
            if (this.getBaselineEbsBandwidthMbps() != null) {
                data.set("baselineEbsBandwidthMbps", om.valueToTree(this.getBaselineEbsBandwidthMbps()));
            }
            if (this.getBurstablePerformance() != null) {
                data.set("burstablePerformance", om.valueToTree(this.getBurstablePerformance()));
            }
            if (this.getCpuManufacturers() != null) {
                data.set("cpuManufacturers", om.valueToTree(this.getCpuManufacturers()));
            }
            if (this.getExcludedInstanceTypes() != null) {
                data.set("excludedInstanceTypes", om.valueToTree(this.getExcludedInstanceTypes()));
            }
            if (this.getInstanceGenerations() != null) {
                data.set("instanceGenerations", om.valueToTree(this.getInstanceGenerations()));
            }
            if (this.getLocalStorage() != null) {
                data.set("localStorage", om.valueToTree(this.getLocalStorage()));
            }
            if (this.getLocalStorageTypes() != null) {
                data.set("localStorageTypes", om.valueToTree(this.getLocalStorageTypes()));
            }
            if (this.getMaxSpotPriceAsPercentageOfOptimalOnDemandPrice() != null) {
                data.set("maxSpotPriceAsPercentageOfOptimalOnDemandPrice", om.valueToTree(this.getMaxSpotPriceAsPercentageOfOptimalOnDemandPrice()));
            }
            if (this.getMemoryGibPerVcpu() != null) {
                data.set("memoryGibPerVcpu", om.valueToTree(this.getMemoryGibPerVcpu()));
            }
            if (this.getNetworkBandwidthGbps() != null) {
                data.set("networkBandwidthGbps", om.valueToTree(this.getNetworkBandwidthGbps()));
            }
            if (this.getNetworkInterfaceCount() != null) {
                data.set("networkInterfaceCount", om.valueToTree(this.getNetworkInterfaceCount()));
            }
            if (this.getOnDemandMaxPricePercentageOverLowestPrice() != null) {
                data.set("onDemandMaxPricePercentageOverLowestPrice", om.valueToTree(this.getOnDemandMaxPricePercentageOverLowestPrice()));
            }
            if (this.getRequireHibernateSupport() != null) {
                data.set("requireHibernateSupport", om.valueToTree(this.getRequireHibernateSupport()));
            }
            if (this.getSpotMaxPricePercentageOverLowestPrice() != null) {
                data.set("spotMaxPricePercentageOverLowestPrice", om.valueToTree(this.getSpotMaxPricePercentageOverLowestPrice()));
            }
            if (this.getTotalLocalStorageGb() != null) {
                data.set("totalLocalStorageGb", om.valueToTree(this.getTotalLocalStorageGb()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements.Jsii$Proxy that = (Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements.Jsii$Proxy) o;

            if (!memoryMib.equals(that.memoryMib)) return false;
            if (!vcpuCount.equals(that.vcpuCount)) return false;
            if (this.acceleratorCount != null ? !this.acceleratorCount.equals(that.acceleratorCount) : that.acceleratorCount != null) return false;
            if (this.acceleratorManufacturers != null ? !this.acceleratorManufacturers.equals(that.acceleratorManufacturers) : that.acceleratorManufacturers != null) return false;
            if (this.acceleratorNames != null ? !this.acceleratorNames.equals(that.acceleratorNames) : that.acceleratorNames != null) return false;
            if (this.acceleratorTotalMemoryMib != null ? !this.acceleratorTotalMemoryMib.equals(that.acceleratorTotalMemoryMib) : that.acceleratorTotalMemoryMib != null) return false;
            if (this.acceleratorTypes != null ? !this.acceleratorTypes.equals(that.acceleratorTypes) : that.acceleratorTypes != null) return false;
            if (this.allowedInstanceTypes != null ? !this.allowedInstanceTypes.equals(that.allowedInstanceTypes) : that.allowedInstanceTypes != null) return false;
            if (this.bareMetal != null ? !this.bareMetal.equals(that.bareMetal) : that.bareMetal != null) return false;
            if (this.baselineEbsBandwidthMbps != null ? !this.baselineEbsBandwidthMbps.equals(that.baselineEbsBandwidthMbps) : that.baselineEbsBandwidthMbps != null) return false;
            if (this.burstablePerformance != null ? !this.burstablePerformance.equals(that.burstablePerformance) : that.burstablePerformance != null) return false;
            if (this.cpuManufacturers != null ? !this.cpuManufacturers.equals(that.cpuManufacturers) : that.cpuManufacturers != null) return false;
            if (this.excludedInstanceTypes != null ? !this.excludedInstanceTypes.equals(that.excludedInstanceTypes) : that.excludedInstanceTypes != null) return false;
            if (this.instanceGenerations != null ? !this.instanceGenerations.equals(that.instanceGenerations) : that.instanceGenerations != null) return false;
            if (this.localStorage != null ? !this.localStorage.equals(that.localStorage) : that.localStorage != null) return false;
            if (this.localStorageTypes != null ? !this.localStorageTypes.equals(that.localStorageTypes) : that.localStorageTypes != null) return false;
            if (this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice != null ? !this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice.equals(that.maxSpotPriceAsPercentageOfOptimalOnDemandPrice) : that.maxSpotPriceAsPercentageOfOptimalOnDemandPrice != null) return false;
            if (this.memoryGibPerVcpu != null ? !this.memoryGibPerVcpu.equals(that.memoryGibPerVcpu) : that.memoryGibPerVcpu != null) return false;
            if (this.networkBandwidthGbps != null ? !this.networkBandwidthGbps.equals(that.networkBandwidthGbps) : that.networkBandwidthGbps != null) return false;
            if (this.networkInterfaceCount != null ? !this.networkInterfaceCount.equals(that.networkInterfaceCount) : that.networkInterfaceCount != null) return false;
            if (this.onDemandMaxPricePercentageOverLowestPrice != null ? !this.onDemandMaxPricePercentageOverLowestPrice.equals(that.onDemandMaxPricePercentageOverLowestPrice) : that.onDemandMaxPricePercentageOverLowestPrice != null) return false;
            if (this.requireHibernateSupport != null ? !this.requireHibernateSupport.equals(that.requireHibernateSupport) : that.requireHibernateSupport != null) return false;
            if (this.spotMaxPricePercentageOverLowestPrice != null ? !this.spotMaxPricePercentageOverLowestPrice.equals(that.spotMaxPricePercentageOverLowestPrice) : that.spotMaxPricePercentageOverLowestPrice != null) return false;
            return this.totalLocalStorageGb != null ? this.totalLocalStorageGb.equals(that.totalLocalStorageGb) : that.totalLocalStorageGb == null;
        }

        @Override
        public final int hashCode() {
            int result = this.memoryMib.hashCode();
            result = 31 * result + (this.vcpuCount.hashCode());
            result = 31 * result + (this.acceleratorCount != null ? this.acceleratorCount.hashCode() : 0);
            result = 31 * result + (this.acceleratorManufacturers != null ? this.acceleratorManufacturers.hashCode() : 0);
            result = 31 * result + (this.acceleratorNames != null ? this.acceleratorNames.hashCode() : 0);
            result = 31 * result + (this.acceleratorTotalMemoryMib != null ? this.acceleratorTotalMemoryMib.hashCode() : 0);
            result = 31 * result + (this.acceleratorTypes != null ? this.acceleratorTypes.hashCode() : 0);
            result = 31 * result + (this.allowedInstanceTypes != null ? this.allowedInstanceTypes.hashCode() : 0);
            result = 31 * result + (this.bareMetal != null ? this.bareMetal.hashCode() : 0);
            result = 31 * result + (this.baselineEbsBandwidthMbps != null ? this.baselineEbsBandwidthMbps.hashCode() : 0);
            result = 31 * result + (this.burstablePerformance != null ? this.burstablePerformance.hashCode() : 0);
            result = 31 * result + (this.cpuManufacturers != null ? this.cpuManufacturers.hashCode() : 0);
            result = 31 * result + (this.excludedInstanceTypes != null ? this.excludedInstanceTypes.hashCode() : 0);
            result = 31 * result + (this.instanceGenerations != null ? this.instanceGenerations.hashCode() : 0);
            result = 31 * result + (this.localStorage != null ? this.localStorage.hashCode() : 0);
            result = 31 * result + (this.localStorageTypes != null ? this.localStorageTypes.hashCode() : 0);
            result = 31 * result + (this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice != null ? this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice.hashCode() : 0);
            result = 31 * result + (this.memoryGibPerVcpu != null ? this.memoryGibPerVcpu.hashCode() : 0);
            result = 31 * result + (this.networkBandwidthGbps != null ? this.networkBandwidthGbps.hashCode() : 0);
            result = 31 * result + (this.networkInterfaceCount != null ? this.networkInterfaceCount.hashCode() : 0);
            result = 31 * result + (this.onDemandMaxPricePercentageOverLowestPrice != null ? this.onDemandMaxPricePercentageOverLowestPrice.hashCode() : 0);
            result = 31 * result + (this.requireHibernateSupport != null ? this.requireHibernateSupport.hashCode() : 0);
            result = 31 * result + (this.spotMaxPricePercentageOverLowestPrice != null ? this.spotMaxPricePercentageOverLowestPrice.hashCode() : 0);
            result = 31 * result + (this.totalLocalStorageGb != null ? this.totalLocalStorageGb.hashCode() : 0);
            return result;
        }
    }
}
