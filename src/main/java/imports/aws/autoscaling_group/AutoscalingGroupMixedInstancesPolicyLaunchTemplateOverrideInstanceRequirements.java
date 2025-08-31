package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.097Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements.Jsii$Proxy.class)
public interface AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements extends software.amazon.jsii.JsiiSerializable {

    /**
     * accelerator_count block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_count AutoscalingGroup#accelerator_count}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount getAcceleratorCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_manufacturers AutoscalingGroup#accelerator_manufacturers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorManufacturers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_names AutoscalingGroup#accelerator_names}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorNames() {
        return null;
    }

    /**
     * accelerator_total_memory_mib block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_total_memory_mib AutoscalingGroup#accelerator_total_memory_mib}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib getAcceleratorTotalMemoryMib() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_types AutoscalingGroup#accelerator_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#allowed_instance_types AutoscalingGroup#allowed_instance_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedInstanceTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#bare_metal AutoscalingGroup#bare_metal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBareMetal() {
        return null;
    }

    /**
     * baseline_ebs_bandwidth_mbps block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#baseline_ebs_bandwidth_mbps AutoscalingGroup#baseline_ebs_bandwidth_mbps}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps getBaselineEbsBandwidthMbps() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#burstable_performance AutoscalingGroup#burstable_performance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBurstablePerformance() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#cpu_manufacturers AutoscalingGroup#cpu_manufacturers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCpuManufacturers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#excluded_instance_types AutoscalingGroup#excluded_instance_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludedInstanceTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_generations AutoscalingGroup#instance_generations}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceGenerations() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage AutoscalingGroup#local_storage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage_types AutoscalingGroup#local_storage_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLocalStorageTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_spot_price_as_percentage_of_optimal_on_demand_price AutoscalingGroup#max_spot_price_as_percentage_of_optimal_on_demand_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxSpotPriceAsPercentageOfOptimalOnDemandPrice() {
        return null;
    }

    /**
     * memory_gib_per_vcpu block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_gib_per_vcpu AutoscalingGroup#memory_gib_per_vcpu}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu getMemoryGibPerVcpu() {
        return null;
    }

    /**
     * memory_mib block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_mib AutoscalingGroup#memory_mib}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib getMemoryMib() {
        return null;
    }

    /**
     * network_bandwidth_gbps block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_bandwidth_gbps AutoscalingGroup#network_bandwidth_gbps}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps getNetworkBandwidthGbps() {
        return null;
    }

    /**
     * network_interface_count block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_interface_count AutoscalingGroup#network_interface_count}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount getNetworkInterfaceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_max_price_percentage_over_lowest_price AutoscalingGroup#on_demand_max_price_percentage_over_lowest_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getOnDemandMaxPricePercentageOverLowestPrice() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#require_hibernate_support AutoscalingGroup#require_hibernate_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRequireHibernateSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_max_price_percentage_over_lowest_price AutoscalingGroup#spot_max_price_percentage_over_lowest_price}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSpotMaxPricePercentageOverLowestPrice() {
        return null;
    }

    /**
     * total_local_storage_gb block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#total_local_storage_gb AutoscalingGroup#total_local_storage_gb}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb getTotalLocalStorageGb() {
        return null;
    }

    /**
     * vcpu_count block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vcpu_count AutoscalingGroup#vcpu_count}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount getVcpuCount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements> {
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount acceleratorCount;
        java.util.List<java.lang.String> acceleratorManufacturers;
        java.util.List<java.lang.String> acceleratorNames;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib acceleratorTotalMemoryMib;
        java.util.List<java.lang.String> acceleratorTypes;
        java.util.List<java.lang.String> allowedInstanceTypes;
        java.lang.String bareMetal;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps baselineEbsBandwidthMbps;
        java.lang.String burstablePerformance;
        java.util.List<java.lang.String> cpuManufacturers;
        java.util.List<java.lang.String> excludedInstanceTypes;
        java.util.List<java.lang.String> instanceGenerations;
        java.lang.String localStorage;
        java.util.List<java.lang.String> localStorageTypes;
        java.lang.Number maxSpotPriceAsPercentageOfOptimalOnDemandPrice;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu memoryGibPerVcpu;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib memoryMib;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps networkBandwidthGbps;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount networkInterfaceCount;
        java.lang.Number onDemandMaxPricePercentageOverLowestPrice;
        java.lang.Object requireHibernateSupport;
        java.lang.Number spotMaxPricePercentageOverLowestPrice;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb totalLocalStorageGb;
        imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount vcpuCount;

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getAcceleratorCount}
         * @param acceleratorCount accelerator_count block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_count AutoscalingGroup#accelerator_count}
         * @return {@code this}
         */
        public Builder acceleratorCount(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount acceleratorCount) {
            this.acceleratorCount = acceleratorCount;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getAcceleratorManufacturers}
         * @param acceleratorManufacturers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_manufacturers AutoscalingGroup#accelerator_manufacturers}.
         * @return {@code this}
         */
        public Builder acceleratorManufacturers(java.util.List<java.lang.String> acceleratorManufacturers) {
            this.acceleratorManufacturers = acceleratorManufacturers;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getAcceleratorNames}
         * @param acceleratorNames Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_names AutoscalingGroup#accelerator_names}.
         * @return {@code this}
         */
        public Builder acceleratorNames(java.util.List<java.lang.String> acceleratorNames) {
            this.acceleratorNames = acceleratorNames;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getAcceleratorTotalMemoryMib}
         * @param acceleratorTotalMemoryMib accelerator_total_memory_mib block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_total_memory_mib AutoscalingGroup#accelerator_total_memory_mib}
         * @return {@code this}
         */
        public Builder acceleratorTotalMemoryMib(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib acceleratorTotalMemoryMib) {
            this.acceleratorTotalMemoryMib = acceleratorTotalMemoryMib;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getAcceleratorTypes}
         * @param acceleratorTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#accelerator_types AutoscalingGroup#accelerator_types}.
         * @return {@code this}
         */
        public Builder acceleratorTypes(java.util.List<java.lang.String> acceleratorTypes) {
            this.acceleratorTypes = acceleratorTypes;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getAllowedInstanceTypes}
         * @param allowedInstanceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#allowed_instance_types AutoscalingGroup#allowed_instance_types}.
         * @return {@code this}
         */
        public Builder allowedInstanceTypes(java.util.List<java.lang.String> allowedInstanceTypes) {
            this.allowedInstanceTypes = allowedInstanceTypes;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getBareMetal}
         * @param bareMetal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#bare_metal AutoscalingGroup#bare_metal}.
         * @return {@code this}
         */
        public Builder bareMetal(java.lang.String bareMetal) {
            this.bareMetal = bareMetal;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getBaselineEbsBandwidthMbps}
         * @param baselineEbsBandwidthMbps baseline_ebs_bandwidth_mbps block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#baseline_ebs_bandwidth_mbps AutoscalingGroup#baseline_ebs_bandwidth_mbps}
         * @return {@code this}
         */
        public Builder baselineEbsBandwidthMbps(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps baselineEbsBandwidthMbps) {
            this.baselineEbsBandwidthMbps = baselineEbsBandwidthMbps;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getBurstablePerformance}
         * @param burstablePerformance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#burstable_performance AutoscalingGroup#burstable_performance}.
         * @return {@code this}
         */
        public Builder burstablePerformance(java.lang.String burstablePerformance) {
            this.burstablePerformance = burstablePerformance;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getCpuManufacturers}
         * @param cpuManufacturers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#cpu_manufacturers AutoscalingGroup#cpu_manufacturers}.
         * @return {@code this}
         */
        public Builder cpuManufacturers(java.util.List<java.lang.String> cpuManufacturers) {
            this.cpuManufacturers = cpuManufacturers;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getExcludedInstanceTypes}
         * @param excludedInstanceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#excluded_instance_types AutoscalingGroup#excluded_instance_types}.
         * @return {@code this}
         */
        public Builder excludedInstanceTypes(java.util.List<java.lang.String> excludedInstanceTypes) {
            this.excludedInstanceTypes = excludedInstanceTypes;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getInstanceGenerations}
         * @param instanceGenerations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_generations AutoscalingGroup#instance_generations}.
         * @return {@code this}
         */
        public Builder instanceGenerations(java.util.List<java.lang.String> instanceGenerations) {
            this.instanceGenerations = instanceGenerations;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getLocalStorage}
         * @param localStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage AutoscalingGroup#local_storage}.
         * @return {@code this}
         */
        public Builder localStorage(java.lang.String localStorage) {
            this.localStorage = localStorage;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getLocalStorageTypes}
         * @param localStorageTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#local_storage_types AutoscalingGroup#local_storage_types}.
         * @return {@code this}
         */
        public Builder localStorageTypes(java.util.List<java.lang.String> localStorageTypes) {
            this.localStorageTypes = localStorageTypes;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getMaxSpotPriceAsPercentageOfOptimalOnDemandPrice}
         * @param maxSpotPriceAsPercentageOfOptimalOnDemandPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_spot_price_as_percentage_of_optimal_on_demand_price AutoscalingGroup#max_spot_price_as_percentage_of_optimal_on_demand_price}.
         * @return {@code this}
         */
        public Builder maxSpotPriceAsPercentageOfOptimalOnDemandPrice(java.lang.Number maxSpotPriceAsPercentageOfOptimalOnDemandPrice) {
            this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice = maxSpotPriceAsPercentageOfOptimalOnDemandPrice;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getMemoryGibPerVcpu}
         * @param memoryGibPerVcpu memory_gib_per_vcpu block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_gib_per_vcpu AutoscalingGroup#memory_gib_per_vcpu}
         * @return {@code this}
         */
        public Builder memoryGibPerVcpu(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu memoryGibPerVcpu) {
            this.memoryGibPerVcpu = memoryGibPerVcpu;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getMemoryMib}
         * @param memoryMib memory_mib block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#memory_mib AutoscalingGroup#memory_mib}
         * @return {@code this}
         */
        public Builder memoryMib(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib memoryMib) {
            this.memoryMib = memoryMib;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getNetworkBandwidthGbps}
         * @param networkBandwidthGbps network_bandwidth_gbps block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_bandwidth_gbps AutoscalingGroup#network_bandwidth_gbps}
         * @return {@code this}
         */
        public Builder networkBandwidthGbps(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps networkBandwidthGbps) {
            this.networkBandwidthGbps = networkBandwidthGbps;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getNetworkInterfaceCount}
         * @param networkInterfaceCount network_interface_count block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#network_interface_count AutoscalingGroup#network_interface_count}
         * @return {@code this}
         */
        public Builder networkInterfaceCount(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount networkInterfaceCount) {
            this.networkInterfaceCount = networkInterfaceCount;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getOnDemandMaxPricePercentageOverLowestPrice}
         * @param onDemandMaxPricePercentageOverLowestPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#on_demand_max_price_percentage_over_lowest_price AutoscalingGroup#on_demand_max_price_percentage_over_lowest_price}.
         * @return {@code this}
         */
        public Builder onDemandMaxPricePercentageOverLowestPrice(java.lang.Number onDemandMaxPricePercentageOverLowestPrice) {
            this.onDemandMaxPricePercentageOverLowestPrice = onDemandMaxPricePercentageOverLowestPrice;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getRequireHibernateSupport}
         * @param requireHibernateSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#require_hibernate_support AutoscalingGroup#require_hibernate_support}.
         * @return {@code this}
         */
        public Builder requireHibernateSupport(java.lang.Boolean requireHibernateSupport) {
            this.requireHibernateSupport = requireHibernateSupport;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getRequireHibernateSupport}
         * @param requireHibernateSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#require_hibernate_support AutoscalingGroup#require_hibernate_support}.
         * @return {@code this}
         */
        public Builder requireHibernateSupport(com.hashicorp.cdktf.IResolvable requireHibernateSupport) {
            this.requireHibernateSupport = requireHibernateSupport;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getSpotMaxPricePercentageOverLowestPrice}
         * @param spotMaxPricePercentageOverLowestPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#spot_max_price_percentage_over_lowest_price AutoscalingGroup#spot_max_price_percentage_over_lowest_price}.
         * @return {@code this}
         */
        public Builder spotMaxPricePercentageOverLowestPrice(java.lang.Number spotMaxPricePercentageOverLowestPrice) {
            this.spotMaxPricePercentageOverLowestPrice = spotMaxPricePercentageOverLowestPrice;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getTotalLocalStorageGb}
         * @param totalLocalStorageGb total_local_storage_gb block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#total_local_storage_gb AutoscalingGroup#total_local_storage_gb}
         * @return {@code this}
         */
        public Builder totalLocalStorageGb(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb totalLocalStorageGb) {
            this.totalLocalStorageGb = totalLocalStorageGb;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements#getVcpuCount}
         * @param vcpuCount vcpu_count block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#vcpu_count AutoscalingGroup#vcpu_count}
         * @return {@code this}
         */
        public Builder vcpuCount(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount vcpuCount) {
            this.vcpuCount = vcpuCount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements {
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount acceleratorCount;
        private final java.util.List<java.lang.String> acceleratorManufacturers;
        private final java.util.List<java.lang.String> acceleratorNames;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib acceleratorTotalMemoryMib;
        private final java.util.List<java.lang.String> acceleratorTypes;
        private final java.util.List<java.lang.String> allowedInstanceTypes;
        private final java.lang.String bareMetal;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps baselineEbsBandwidthMbps;
        private final java.lang.String burstablePerformance;
        private final java.util.List<java.lang.String> cpuManufacturers;
        private final java.util.List<java.lang.String> excludedInstanceTypes;
        private final java.util.List<java.lang.String> instanceGenerations;
        private final java.lang.String localStorage;
        private final java.util.List<java.lang.String> localStorageTypes;
        private final java.lang.Number maxSpotPriceAsPercentageOfOptimalOnDemandPrice;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu memoryGibPerVcpu;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib memoryMib;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps networkBandwidthGbps;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount networkInterfaceCount;
        private final java.lang.Number onDemandMaxPricePercentageOverLowestPrice;
        private final java.lang.Object requireHibernateSupport;
        private final java.lang.Number spotMaxPricePercentageOverLowestPrice;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb totalLocalStorageGb;
        private final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount vcpuCount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.acceleratorCount = software.amazon.jsii.Kernel.get(this, "acceleratorCount", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount.class));
            this.acceleratorManufacturers = software.amazon.jsii.Kernel.get(this, "acceleratorManufacturers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.acceleratorNames = software.amazon.jsii.Kernel.get(this, "acceleratorNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.acceleratorTotalMemoryMib = software.amazon.jsii.Kernel.get(this, "acceleratorTotalMemoryMib", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib.class));
            this.acceleratorTypes = software.amazon.jsii.Kernel.get(this, "acceleratorTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allowedInstanceTypes = software.amazon.jsii.Kernel.get(this, "allowedInstanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.bareMetal = software.amazon.jsii.Kernel.get(this, "bareMetal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.baselineEbsBandwidthMbps = software.amazon.jsii.Kernel.get(this, "baselineEbsBandwidthMbps", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps.class));
            this.burstablePerformance = software.amazon.jsii.Kernel.get(this, "burstablePerformance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cpuManufacturers = software.amazon.jsii.Kernel.get(this, "cpuManufacturers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.excludedInstanceTypes = software.amazon.jsii.Kernel.get(this, "excludedInstanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.instanceGenerations = software.amazon.jsii.Kernel.get(this, "instanceGenerations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.localStorage = software.amazon.jsii.Kernel.get(this, "localStorage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localStorageTypes = software.amazon.jsii.Kernel.get(this, "localStorageTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.maxSpotPriceAsPercentageOfOptimalOnDemandPrice = software.amazon.jsii.Kernel.get(this, "maxSpotPriceAsPercentageOfOptimalOnDemandPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.memoryGibPerVcpu = software.amazon.jsii.Kernel.get(this, "memoryGibPerVcpu", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu.class));
            this.memoryMib = software.amazon.jsii.Kernel.get(this, "memoryMib", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib.class));
            this.networkBandwidthGbps = software.amazon.jsii.Kernel.get(this, "networkBandwidthGbps", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps.class));
            this.networkInterfaceCount = software.amazon.jsii.Kernel.get(this, "networkInterfaceCount", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount.class));
            this.onDemandMaxPricePercentageOverLowestPrice = software.amazon.jsii.Kernel.get(this, "onDemandMaxPricePercentageOverLowestPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.requireHibernateSupport = software.amazon.jsii.Kernel.get(this, "requireHibernateSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.spotMaxPricePercentageOverLowestPrice = software.amazon.jsii.Kernel.get(this, "spotMaxPricePercentageOverLowestPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.totalLocalStorageGb = software.amazon.jsii.Kernel.get(this, "totalLocalStorageGb", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb.class));
            this.vcpuCount = software.amazon.jsii.Kernel.get(this, "vcpuCount", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
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
            this.memoryMib = builder.memoryMib;
            this.networkBandwidthGbps = builder.networkBandwidthGbps;
            this.networkInterfaceCount = builder.networkInterfaceCount;
            this.onDemandMaxPricePercentageOverLowestPrice = builder.onDemandMaxPricePercentageOverLowestPrice;
            this.requireHibernateSupport = builder.requireHibernateSupport;
            this.spotMaxPricePercentageOverLowestPrice = builder.spotMaxPricePercentageOverLowestPrice;
            this.totalLocalStorageGb = builder.totalLocalStorageGb;
            this.vcpuCount = builder.vcpuCount;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorCount getAcceleratorCount() {
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
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsAcceleratorTotalMemoryMib getAcceleratorTotalMemoryMib() {
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
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsBaselineEbsBandwidthMbps getBaselineEbsBandwidthMbps() {
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
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryGibPerVcpu getMemoryGibPerVcpu() {
            return this.memoryGibPerVcpu;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsMemoryMib getMemoryMib() {
            return this.memoryMib;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkBandwidthGbps getNetworkBandwidthGbps() {
            return this.networkBandwidthGbps;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsNetworkInterfaceCount getNetworkInterfaceCount() {
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
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsTotalLocalStorageGb getTotalLocalStorageGb() {
            return this.totalLocalStorageGb;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirementsVcpuCount getVcpuCount() {
            return this.vcpuCount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

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
            if (this.getMemoryMib() != null) {
                data.set("memoryMib", om.valueToTree(this.getMemoryMib()));
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
            if (this.getVcpuCount() != null) {
                data.set("vcpuCount", om.valueToTree(this.getVcpuCount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements.Jsii$Proxy that = (AutoscalingGroupMixedInstancesPolicyLaunchTemplateOverrideInstanceRequirements.Jsii$Proxy) o;

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
            if (this.memoryMib != null ? !this.memoryMib.equals(that.memoryMib) : that.memoryMib != null) return false;
            if (this.networkBandwidthGbps != null ? !this.networkBandwidthGbps.equals(that.networkBandwidthGbps) : that.networkBandwidthGbps != null) return false;
            if (this.networkInterfaceCount != null ? !this.networkInterfaceCount.equals(that.networkInterfaceCount) : that.networkInterfaceCount != null) return false;
            if (this.onDemandMaxPricePercentageOverLowestPrice != null ? !this.onDemandMaxPricePercentageOverLowestPrice.equals(that.onDemandMaxPricePercentageOverLowestPrice) : that.onDemandMaxPricePercentageOverLowestPrice != null) return false;
            if (this.requireHibernateSupport != null ? !this.requireHibernateSupport.equals(that.requireHibernateSupport) : that.requireHibernateSupport != null) return false;
            if (this.spotMaxPricePercentageOverLowestPrice != null ? !this.spotMaxPricePercentageOverLowestPrice.equals(that.spotMaxPricePercentageOverLowestPrice) : that.spotMaxPricePercentageOverLowestPrice != null) return false;
            if (this.totalLocalStorageGb != null ? !this.totalLocalStorageGb.equals(that.totalLocalStorageGb) : that.totalLocalStorageGb != null) return false;
            return this.vcpuCount != null ? this.vcpuCount.equals(that.vcpuCount) : that.vcpuCount == null;
        }

        @Override
        public final int hashCode() {
            int result = this.acceleratorCount != null ? this.acceleratorCount.hashCode() : 0;
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
            result = 31 * result + (this.memoryMib != null ? this.memoryMib.hashCode() : 0);
            result = 31 * result + (this.networkBandwidthGbps != null ? this.networkBandwidthGbps.hashCode() : 0);
            result = 31 * result + (this.networkInterfaceCount != null ? this.networkInterfaceCount.hashCode() : 0);
            result = 31 * result + (this.onDemandMaxPricePercentageOverLowestPrice != null ? this.onDemandMaxPricePercentageOverLowestPrice.hashCode() : 0);
            result = 31 * result + (this.requireHibernateSupport != null ? this.requireHibernateSupport.hashCode() : 0);
            result = 31 * result + (this.spotMaxPricePercentageOverLowestPrice != null ? this.spotMaxPricePercentageOverLowestPrice.hashCode() : 0);
            result = 31 * result + (this.totalLocalStorageGb != null ? this.totalLocalStorageGb.hashCode() : 0);
            result = 31 * result + (this.vcpuCount != null ? this.vcpuCount.hashCode() : 0);
            return result;
        }
    }
}
