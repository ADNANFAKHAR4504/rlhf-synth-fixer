package imports.aws.data_aws_ec2_instance_type;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type aws_ec2_instance_type}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.575Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEc2InstanceType.DataAwsEc2InstanceType")
public class DataAwsEc2InstanceType extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsEc2InstanceType(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsEc2InstanceType(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceType.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type aws_ec2_instance_type} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsEc2InstanceType(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsEc2InstanceType resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsEc2InstanceType to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsEc2InstanceType that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsEc2InstanceType to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceType.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsEc2InstanceType resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsEc2InstanceType to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsEc2InstanceType that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceType.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getAutoRecoverySupported() {
        return software.amazon.jsii.Kernel.get(this, "autoRecoverySupported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getBandwidthWeightings() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "bandwidthWeightings", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getBareMetal() {
        return software.amazon.jsii.Kernel.get(this, "bareMetal", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getBootModes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "bootModes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getBurstablePerformanceSupported() {
        return software.amazon.jsii.Kernel.get(this, "burstablePerformanceSupported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getCurrentGeneration() {
        return software.amazon.jsii.Kernel.get(this, "currentGeneration", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getDedicatedHostsSupported() {
        return software.amazon.jsii.Kernel.get(this, "dedicatedHostsSupported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultCores() {
        return software.amazon.jsii.Kernel.get(this, "defaultCores", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultNetworkCardIndex() {
        return software.amazon.jsii.Kernel.get(this, "defaultNetworkCardIndex", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultThreadsPerCore() {
        return software.amazon.jsii.Kernel.get(this, "defaultThreadsPerCore", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultVcpus() {
        return software.amazon.jsii.Kernel.get(this, "defaultVcpus", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbsEncryptionSupport() {
        return software.amazon.jsii.Kernel.get(this, "ebsEncryptionSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbsNvmeSupport() {
        return software.amazon.jsii.Kernel.get(this, "ebsNvmeSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbsOptimizedSupport() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptimizedSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbsPerformanceBaselineBandwidth() {
        return software.amazon.jsii.Kernel.get(this, "ebsPerformanceBaselineBandwidth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbsPerformanceBaselineIops() {
        return software.amazon.jsii.Kernel.get(this, "ebsPerformanceBaselineIops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbsPerformanceBaselineThroughput() {
        return software.amazon.jsii.Kernel.get(this, "ebsPerformanceBaselineThroughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbsPerformanceMaximumBandwidth() {
        return software.amazon.jsii.Kernel.get(this, "ebsPerformanceMaximumBandwidth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbsPerformanceMaximumIops() {
        return software.amazon.jsii.Kernel.get(this, "ebsPerformanceMaximumIops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEbsPerformanceMaximumThroughput() {
        return software.amazon.jsii.Kernel.get(this, "ebsPerformanceMaximumThroughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getEfaMaximumInterfaces() {
        return software.amazon.jsii.Kernel.get(this, "efaMaximumInterfaces", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEfaSupported() {
        return software.amazon.jsii.Kernel.get(this, "efaSupported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEnaSrdSupported() {
        return software.amazon.jsii.Kernel.get(this, "enaSrdSupported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnaSupport() {
        return software.amazon.jsii.Kernel.get(this, "enaSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEncryptionInTransitSupported() {
        return software.amazon.jsii.Kernel.get(this, "encryptionInTransitSupported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeFpgasList getFpgas() {
        return software.amazon.jsii.Kernel.get(this, "fpgas", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeFpgasList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getFreeTierEligible() {
        return software.amazon.jsii.Kernel.get(this, "freeTierEligible", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeGpusList getGpus() {
        return software.amazon.jsii.Kernel.get(this, "gpus", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeGpusList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getHibernationSupported() {
        return software.amazon.jsii.Kernel.get(this, "hibernationSupported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHypervisor() {
        return software.amazon.jsii.Kernel.get(this, "hypervisor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeInferenceAcceleratorsList getInferenceAccelerators() {
        return software.amazon.jsii.Kernel.get(this, "inferenceAccelerators", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeInferenceAcceleratorsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeInstanceDisksList getInstanceDisks() {
        return software.amazon.jsii.Kernel.get(this, "instanceDisks", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeInstanceDisksList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getInstanceStorageSupported() {
        return software.amazon.jsii.Kernel.get(this, "instanceStorageSupported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getIpv6Supported() {
        return software.amazon.jsii.Kernel.get(this, "ipv6Supported", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumIpv4AddressesPerInterface() {
        return software.amazon.jsii.Kernel.get(this, "maximumIpv4AddressesPerInterface", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumIpv6AddressesPerInterface() {
        return software.amazon.jsii.Kernel.get(this, "maximumIpv6AddressesPerInterface", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumNetworkCards() {
        return software.amazon.jsii.Kernel.get(this, "maximumNetworkCards", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumNetworkInterfaces() {
        return software.amazon.jsii.Kernel.get(this, "maximumNetworkInterfaces", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeMediaAcceleratorsList getMediaAccelerators() {
        return software.amazon.jsii.Kernel.get(this, "mediaAccelerators", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeMediaAcceleratorsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMemorySize() {
        return software.amazon.jsii.Kernel.get(this, "memorySize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeNetworkCardsList getNetworkCards() {
        return software.amazon.jsii.Kernel.get(this, "networkCards", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeNetworkCardsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkPerformance() {
        return software.amazon.jsii.Kernel.get(this, "networkPerformance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeNeuronDevicesList getNeuronDevices() {
        return software.amazon.jsii.Kernel.get(this, "neuronDevices", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeNeuronDevicesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNitroEnclavesSupport() {
        return software.amazon.jsii.Kernel.get(this, "nitroEnclavesSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNitroTpmSupport() {
        return software.amazon.jsii.Kernel.get(this, "nitroTpmSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNitroTpmSupportedVersions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "nitroTpmSupportedVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhcSupport() {
        return software.amazon.jsii.Kernel.get(this, "phcSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedArchitectures() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedArchitectures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedCpuFeatures() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedCpuFeatures", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedPlacementStrategies() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedPlacementStrategies", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedRootDeviceTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedRootDeviceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedUsagesClasses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedUsagesClasses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedVirtualizationTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedVirtualizationTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSustainedClockSpeed() {
        return software.amazon.jsii.Kernel.get(this, "sustainedClockSpeed", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalFpgaMemory() {
        return software.amazon.jsii.Kernel.get(this, "totalFpgaMemory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalGpuMemory() {
        return software.amazon.jsii.Kernel.get(this, "totalGpuMemory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalInferenceMemory() {
        return software.amazon.jsii.Kernel.get(this, "totalInferenceMemory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalInstanceStorage() {
        return software.amazon.jsii.Kernel.get(this, "totalInstanceStorage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalMediaMemory() {
        return software.amazon.jsii.Kernel.get(this, "totalMediaMemory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTotalNeuronDeviceMemory() {
        return software.amazon.jsii.Kernel.get(this, "totalNeuronDeviceMemory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> getValidCores() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "validCores", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> getValidThreadsPerCore() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "validThreadsPerCore", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceType}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceType> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type#instance_type DataAwsEc2InstanceType#instance_type}.
         * <p>
         * @return {@code this}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type#instance_type DataAwsEc2InstanceType#instance_type}. This parameter is required.
         */
        public Builder instanceType(final java.lang.String instanceType) {
            this.config.instanceType(instanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type#id DataAwsEc2InstanceType#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type#id DataAwsEc2InstanceType#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/ec2_instance_type#timeouts DataAwsEc2InstanceType#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceTypeTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceType}.
         */
        @Override
        public imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceType build() {
            return new imports.aws.data_aws_ec2_instance_type.DataAwsEc2InstanceType(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
