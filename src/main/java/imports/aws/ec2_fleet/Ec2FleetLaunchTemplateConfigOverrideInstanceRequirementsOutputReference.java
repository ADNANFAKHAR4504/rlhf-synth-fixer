package imports.aws.ec2_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.076Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2Fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference")
public class Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAcceleratorCount(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount value) {
        software.amazon.jsii.Kernel.call(this, "putAcceleratorCount", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAcceleratorTotalMemoryMib(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib value) {
        software.amazon.jsii.Kernel.call(this, "putAcceleratorTotalMemoryMib", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putBaselineEbsBandwidthMbps(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps value) {
        software.amazon.jsii.Kernel.call(this, "putBaselineEbsBandwidthMbps", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMemoryGibPerVcpu(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu value) {
        software.amazon.jsii.Kernel.call(this, "putMemoryGibPerVcpu", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMemoryMib(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib value) {
        software.amazon.jsii.Kernel.call(this, "putMemoryMib", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkBandwidthGbps(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkBandwidthGbps", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkInterfaceCount(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkInterfaceCount", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTotalLocalStorageGb(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb value) {
        software.amazon.jsii.Kernel.call(this, "putTotalLocalStorageGb", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVcpuCount(final @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount value) {
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

    public void resetMaxSpotPriceAsPercentageOfOptimalOnDemandPrice() {
        software.amazon.jsii.Kernel.call(this, "resetMaxSpotPriceAsPercentageOfOptimalOnDemandPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMemoryGibPerVcpu() {
        software.amazon.jsii.Kernel.call(this, "resetMemoryGibPerVcpu", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCountOutputReference getAcceleratorCount() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorCount", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCountOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference getAcceleratorTotalMemoryMib() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorTotalMemoryMib", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMibOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference getBaselineEbsBandwidthMbps() {
        return software.amazon.jsii.Kernel.get(this, "baselineEbsBandwidthMbps", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbpsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference getMemoryGibPerVcpu() {
        return software.amazon.jsii.Kernel.get(this, "memoryGibPerVcpu", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpuOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMibOutputReference getMemoryMib() {
        return software.amazon.jsii.Kernel.get(this, "memoryMib", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMibOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference getNetworkBandwidthGbps() {
        return software.amazon.jsii.Kernel.get(this, "networkBandwidthGbps", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbpsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCountOutputReference getNetworkInterfaceCount() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceCount", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCountOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGbOutputReference getTotalLocalStorageGb() {
        return software.amazon.jsii.Kernel.get(this, "totalLocalStorageGb", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGbOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCountOutputReference getVcpuCount() {
        return software.amazon.jsii.Kernel.get(this, "vcpuCount", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCountOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount getAcceleratorCountInput() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorCountInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorCount.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorManufacturersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "acceleratorManufacturersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAcceleratorNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "acceleratorNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib getAcceleratorTotalMemoryMibInput() {
        return software.amazon.jsii.Kernel.get(this, "acceleratorTotalMemoryMibInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsAcceleratorTotalMemoryMib.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps getBaselineEbsBandwidthMbpsInput() {
        return software.amazon.jsii.Kernel.get(this, "baselineEbsBandwidthMbpsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsBaselineEbsBandwidthMbps.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxSpotPriceAsPercentageOfOptimalOnDemandPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "maxSpotPriceAsPercentageOfOptimalOnDemandPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu getMemoryGibPerVcpuInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryGibPerVcpuInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryGibPerVcpu.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib getMemoryMibInput() {
        return software.amazon.jsii.Kernel.get(this, "memoryMibInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsMemoryMib.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps getNetworkBandwidthGbpsInput() {
        return software.amazon.jsii.Kernel.get(this, "networkBandwidthGbpsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkBandwidthGbps.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount getNetworkInterfaceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceCountInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsNetworkInterfaceCount.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb getTotalLocalStorageGbInput() {
        return software.amazon.jsii.Kernel.get(this, "totalLocalStorageGbInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsTotalLocalStorageGb.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount getVcpuCountInput() {
        return software.amazon.jsii.Kernel.get(this, "vcpuCountInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirementsVcpuCount.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxSpotPriceAsPercentageOfOptimalOnDemandPrice() {
        return software.amazon.jsii.Kernel.get(this, "maxSpotPriceAsPercentageOfOptimalOnDemandPrice", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxSpotPriceAsPercentageOfOptimalOnDemandPrice(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxSpotPriceAsPercentageOfOptimalOnDemandPrice", java.util.Objects.requireNonNull(value, "maxSpotPriceAsPercentageOfOptimalOnDemandPrice is required"));
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

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_fleet.Ec2FleetLaunchTemplateConfigOverrideInstanceRequirements value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
