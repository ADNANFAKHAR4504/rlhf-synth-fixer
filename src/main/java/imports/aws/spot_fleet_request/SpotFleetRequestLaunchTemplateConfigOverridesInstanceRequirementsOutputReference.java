package imports.aws.spot_fleet_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.486Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotFleetRequest.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsOutputReference")
public class SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAcceleratorCount(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorCount value) {
        software.amazon.jsii.Kernel.call(this, "putAcceleratorCount", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAcceleratorTotalMemoryMib(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorTotalMemoryMib value) {
        software.amazon.jsii.Kernel.call(this, "putAcceleratorTotalMemoryMib", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBaselineEbsBandwidthMbps(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsBaselineEbsBandwidthMbps value) {
        software.amazon.jsii.Kernel.call(this, "putBaselineEbsBandwidthMbps", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMemoryGibPerVcpu(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryGibPerVcpu value) {
        software.amazon.jsii.Kernel.call(this, "putMemoryGibPerVcpu", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMemoryMib(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryMib value) {
        software.amazon.jsii.Kernel.call(this, "putMemoryMib", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkBandwidthGbps(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkBandwidthGbps value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkBandwidthGbps", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkInterfaceCount(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkInterfaceCount value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkInterfaceCount", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTotalLocalStorageGb(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsTotalLocalStorageGb value) {
        software.amazon.jsii.Kernel.call(this, "putTotalLocalStorageGb", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVcpuCount(final @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsVcpuCount value) {
        software.amazon.jsii.Kernel.call(this, "putVcpuCount", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAcceleratorCount() {
        software.amazon.jsii.Kernel.call(this, "resetAcceleratorCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAcceleratorManufacturers() {
        software.amazon.jsii.Kernel.call(this, "resetAcceleratorManufacturers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAcceleratorNames() {
        software.amazon.jsii.Kernel.call(this, "resetAcceleratorNames", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAcceleratorTotalMemoryMib() {
        software.amazon.jsii.Kernel.call(this, "resetAcceleratorTotalMemoryMib", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAcceleratorTypes() {
        software.amazon.jsii.Kernel.call(this, "resetAcceleratorTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAllowedInstanceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedInstanceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBareMetal() {
        software.amazon.jsii.Kernel.call(this, "resetBareMetal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBaselineEbsBandwidthMbps() {
        software.amazon.jsii.Kernel.call(this, "resetBaselineEbsBandwidthMbps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBurstablePerformance() {
        software.amazon.jsii.Kernel.call(this, "resetBurstablePerformance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCpuManufacturers() {
        software.amazon.jsii.Kernel.call(this, "resetCpuManufacturers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExcludedInstanceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetExcludedInstanceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceGenerations() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceGenerations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocalStorage() {
        software.amazon.jsii.Kernel.call(this, "resetLocalStorage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocalStorageTypes() {
        software.amazon.jsii.Kernel.call(this, "resetLocalStorageTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemoryGibPerVcpu() {
        software.amazon.jsii.Kernel.call(this, "resetMemoryGibPerVcpu", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemoryMib() {
        software.amazon.jsii.Kernel.call(this, "resetMemoryMib", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkBandwidthGbps() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkBandwidthGbps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInterfaceCount() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInterfaceCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOnDemandMaxPricePercentageOverLowestPrice() {
        software.amazon.jsii.Kernel.call(this, "resetOnDemandMaxPricePercentageOverLowestPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequireHibernateSupport() {
        software.amazon.jsii.Kernel.call(this, "resetRequireHibernateSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotMaxPricePercentageOverLowestPrice() {
        software.amazon.jsii.Kernel.call(this, "resetSpotMaxPricePercentageOverLowestPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTotalLocalStorageGb() {
        software.amazon.jsii.Kernel.call(this, "resetTotalLocalStorageGb", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVcpuCount() {
        software.amazon.jsii.Kernel.call(this, "resetVcpuCount", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorCountOutputReference getAcceleratorCount() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorCount", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorCountOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorTotalMemoryMibOutputReference getAcceleratorTotalMemoryMib() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorTotalMemoryMib", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorTotalMemoryMibOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference getBaselineEbsBandwidthMbps() {
        return software.amazon.jsii.Kernel.get(this, "baselineEbsBandwidthMbps", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryGibPerVcpuOutputReference getMemoryGibPerVcpu() {
        return software.amazon.jsii.Kernel.get(this, "memoryGibPerVcpu", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryGibPerVcpuOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryMibOutputReference getMemoryMib() {
        return software.amazon.jsii.Kernel.get(this, "memoryMib", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryMibOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkBandwidthGbpsOutputReference getNetworkBandwidthGbps() {
        return software.amazon.jsii.Kernel.get(this, "networkBandwidthGbps", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkBandwidthGbpsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkInterfaceCountOutputReference getNetworkInterfaceCount() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceCount", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkInterfaceCountOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsTotalLocalStorageGbOutputReference getTotalLocalStorageGb() {
        return software.amazon.jsii.Kernel.get(this, "totalLocalStorageGb", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsTotalLocalStorageGbOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsVcpuCountOutputReference getVcpuCount() {
        return software.amazon.jsii.Kernel.get(this, "vcpuCount", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsVcpuCountOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorCount getAcceleratorCountInput() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorCountInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorCount.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorManufacturersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "acceleratorManufacturersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "acceleratorNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorTotalMemoryMib getAcceleratorTotalMemoryMibInput() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorTotalMemoryMibInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsAcceleratorTotalMemoryMib.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "acceleratorTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedInstanceTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "allowedInstanceTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBareMetalInput() {
        return software.amazon.jsii.Kernel.get(this, "bareMetalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsBaselineEbsBandwidthMbps getBaselineEbsBandwidthMbpsInput() {
        return software.amazon.jsii.Kernel.get(this, "baselineEbsBandwidthMbpsInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsBaselineEbsBandwidthMbps.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBurstablePerformanceInput() {
        return software.amazon.jsii.Kernel.get(this, "burstablePerformanceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCpuManufacturersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "cpuManufacturersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludedInstanceTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "excludedInstanceTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceGenerationsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "instanceGenerationsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "localStorageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLocalStorageTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "localStorageTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryGibPerVcpu getMemoryGibPerVcpuInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryGibPerVcpuInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryGibPerVcpu.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryMib getMemoryMibInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryMibInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsMemoryMib.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkBandwidthGbps getNetworkBandwidthGbpsInput() {
        return software.amazon.jsii.Kernel.get(this, "networkBandwidthGbpsInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkBandwidthGbps.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkInterfaceCount getNetworkInterfaceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceCountInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsNetworkInterfaceCount.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getOnDemandMaxPricePercentageOverLowestPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "onDemandMaxPricePercentageOverLowestPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRequireHibernateSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "requireHibernateSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSpotMaxPricePercentageOverLowestPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "spotMaxPricePercentageOverLowestPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsTotalLocalStorageGb getTotalLocalStorageGbInput() {
        return software.amazon.jsii.Kernel.get(this, "totalLocalStorageGbInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsTotalLocalStorageGb.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsVcpuCount getVcpuCountInput() {
        return software.amazon.jsii.Kernel.get(this, "vcpuCountInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirementsVcpuCount.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAcceleratorManufacturers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "acceleratorManufacturers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAcceleratorManufacturers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "acceleratorManufacturers", java.util.Objects.requireNonNull(value, "acceleratorManufacturers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAcceleratorNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "acceleratorNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAcceleratorNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "acceleratorNames", java.util.Objects.requireNonNull(value, "acceleratorNames is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAcceleratorTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "acceleratorTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAcceleratorTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "acceleratorTypes", java.util.Objects.requireNonNull(value, "acceleratorTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedInstanceTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "allowedInstanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAllowedInstanceTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "allowedInstanceTypes", java.util.Objects.requireNonNull(value, "allowedInstanceTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBareMetal() {
        return software.amazon.jsii.Kernel.get(this, "bareMetal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBareMetal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bareMetal", java.util.Objects.requireNonNull(value, "bareMetal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBurstablePerformance() {
        return software.amazon.jsii.Kernel.get(this, "burstablePerformance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBurstablePerformance(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "burstablePerformance", java.util.Objects.requireNonNull(value, "burstablePerformance is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getCpuManufacturers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "cpuManufacturers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setCpuManufacturers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "cpuManufacturers", java.util.Objects.requireNonNull(value, "cpuManufacturers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExcludedInstanceTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "excludedInstanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setExcludedInstanceTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "excludedInstanceTypes", java.util.Objects.requireNonNull(value, "excludedInstanceTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInstanceGenerations() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "instanceGenerations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInstanceGenerations(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "instanceGenerations", java.util.Objects.requireNonNull(value, "instanceGenerations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalStorage() {
        return software.amazon.jsii.Kernel.get(this, "localStorage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalStorage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localStorage", java.util.Objects.requireNonNull(value, "localStorage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLocalStorageTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "localStorageTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLocalStorageTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "localStorageTypes", java.util.Objects.requireNonNull(value, "localStorageTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getOnDemandMaxPricePercentageOverLowestPrice() {
        return software.amazon.jsii.Kernel.get(this, "onDemandMaxPricePercentageOverLowestPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setOnDemandMaxPricePercentageOverLowestPrice(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "onDemandMaxPricePercentageOverLowestPrice", java.util.Objects.requireNonNull(value, "onDemandMaxPricePercentageOverLowestPrice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRequireHibernateSupport() {
        return software.amazon.jsii.Kernel.get(this, "requireHibernateSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRequireHibernateSupport(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "requireHibernateSupport", java.util.Objects.requireNonNull(value, "requireHibernateSupport is required"));
    }

    public void setRequireHibernateSupport(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "requireHibernateSupport", java.util.Objects.requireNonNull(value, "requireHibernateSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSpotMaxPricePercentageOverLowestPrice() {
        return software.amazon.jsii.Kernel.get(this, "spotMaxPricePercentageOverLowestPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSpotMaxPricePercentageOverLowestPrice(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "spotMaxPricePercentageOverLowestPrice", java.util.Objects.requireNonNull(value, "spotMaxPricePercentageOverLowestPrice is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirements getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirements.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.spot_fleet_request.SpotFleetRequestLaunchTemplateConfigOverridesInstanceRequirements value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
