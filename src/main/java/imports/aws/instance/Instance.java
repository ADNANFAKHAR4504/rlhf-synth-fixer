package imports.aws.instance;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance aws_instance}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.387Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.instance.Instance")
public class Instance extends com.hashicorp.cdktf.TerraformResource {

    protected Instance(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Instance(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.instance.Instance.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance aws_instance} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public Instance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance aws_instance} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public Instance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a Instance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Instance to import. This parameter is required.
     * @param importFromId The id of the existing Instance that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Instance to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.instance.Instance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Instance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Instance to import. This parameter is required.
     * @param importFromId The id of the existing Instance that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.instance.Instance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCapacityReservationSpecification(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceCapacityReservationSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCapacityReservationSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCpuOptions(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceCpuOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCpuOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCreditSpecification(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceCreditSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCreditSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEbsBlockDevice(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.instance.InstanceEbsBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.instance.InstanceEbsBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.instance.InstanceEbsBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.instance.InstanceEbsBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEbsBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnclaveOptions(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceEnclaveOptions value) {
        software.amazon.jsii.Kernel.call(this, "putEnclaveOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEphemeralBlockDevice(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.instance.InstanceEphemeralBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.instance.InstanceEphemeralBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.instance.InstanceEphemeralBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.instance.InstanceEphemeralBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInstanceMarketOptions(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceInstanceMarketOptions value) {
        software.amazon.jsii.Kernel.call(this, "putInstanceMarketOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplate(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceLaunchTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMaintenanceOptions(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceMaintenanceOptions value) {
        software.amazon.jsii.Kernel.call(this, "putMaintenanceOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetadataOptions(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceMetadataOptions value) {
        software.amazon.jsii.Kernel.call(this, "putMetadataOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkInterface(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.instance.InstanceNetworkInterface>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.instance.InstanceNetworkInterface> __cast_cd4240 = (java.util.List<imports.aws.instance.InstanceNetworkInterface>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.instance.InstanceNetworkInterface __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkInterface", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrivateDnsNameOptions(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstancePrivateDnsNameOptions value) {
        software.amazon.jsii.Kernel.call(this, "putPrivateDnsNameOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRootBlockDevice(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceRootBlockDevice value) {
        software.amazon.jsii.Kernel.call(this, "putRootBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmi() {
        software.amazon.jsii.Kernel.call(this, "resetAmi", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAssociatePublicIpAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAssociatePublicIpAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCapacityReservationSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCapacityReservationSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCpuCoreCount() {
        software.amazon.jsii.Kernel.call(this, "resetCpuCoreCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCpuOptions() {
        software.amazon.jsii.Kernel.call(this, "resetCpuOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCpuThreadsPerCore() {
        software.amazon.jsii.Kernel.call(this, "resetCpuThreadsPerCore", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreditSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCreditSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableApiStop() {
        software.amazon.jsii.Kernel.call(this, "resetDisableApiStop", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisableApiTermination() {
        software.amazon.jsii.Kernel.call(this, "resetDisableApiTermination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetEbsBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsOptimized() {
        software.amazon.jsii.Kernel.call(this, "resetEbsOptimized", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnablePrimaryIpv6() {
        software.amazon.jsii.Kernel.call(this, "resetEnablePrimaryIpv6", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnclaveOptions() {
        software.amazon.jsii.Kernel.call(this, "resetEnclaveOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEphemeralBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFetchPasswordData() {
        software.amazon.jsii.Kernel.call(this, "resetFetchPasswordData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHibernation() {
        software.amazon.jsii.Kernel.call(this, "resetHibernation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostId() {
        software.amazon.jsii.Kernel.call(this, "resetHostId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostResourceGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetHostResourceGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamInstanceProfile() {
        software.amazon.jsii.Kernel.call(this, "resetIamInstanceProfile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceInitiatedShutdownBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceInitiatedShutdownBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceMarketOptions() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceMarketOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6AddressCount() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6AddressCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpv6Addresses() {
        software.amazon.jsii.Kernel.call(this, "resetIpv6Addresses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyName() {
        software.amazon.jsii.Kernel.call(this, "resetKeyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLaunchTemplate() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchTemplate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaintenanceOptions() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadataOptions() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMonitoring() {
        software.amazon.jsii.Kernel.call(this, "resetMonitoring", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkInterface() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkInterface", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementGroup() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementPartitionNumber() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementPartitionNumber", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateDnsNameOptions() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateDnsNameOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivateIp() {
        software.amazon.jsii.Kernel.call(this, "resetPrivateIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetRootBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecondaryPrivateIps() {
        software.amazon.jsii.Kernel.call(this, "resetSecondaryPrivateIps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceDestCheck() {
        software.amazon.jsii.Kernel.call(this, "resetSourceDestCheck", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTenancy() {
        software.amazon.jsii.Kernel.call(this, "resetTenancy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserData() {
        software.amazon.jsii.Kernel.call(this, "resetUserData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserDataBase64() {
        software.amazon.jsii.Kernel.call(this, "resetUserDataBase64", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserDataReplaceOnChange() {
        software.amazon.jsii.Kernel.call(this, "resetUserDataReplaceOnChange", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeTags() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetVpcSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceCapacityReservationSpecificationOutputReference getCapacityReservationSpecification() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCapacityReservationSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceCpuOptionsOutputReference getCpuOptions() {
        return software.amazon.jsii.Kernel.get(this, "cpuOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCpuOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceCreditSpecificationOutputReference getCreditSpecification() {
        return software.amazon.jsii.Kernel.get(this, "creditSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCreditSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceEbsBlockDeviceList getEbsBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceEbsBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceEnclaveOptionsOutputReference getEnclaveOptions() {
        return software.amazon.jsii.Kernel.get(this, "enclaveOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceEnclaveOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceEphemeralBlockDeviceList getEphemeralBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceEphemeralBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceLifecycle() {
        return software.amazon.jsii.Kernel.get(this, "instanceLifecycle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceInstanceMarketOptionsOutputReference getInstanceMarketOptions() {
        return software.amazon.jsii.Kernel.get(this, "instanceMarketOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceInstanceMarketOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceState() {
        return software.amazon.jsii.Kernel.get(this, "instanceState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceLaunchTemplateOutputReference getLaunchTemplate() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceLaunchTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceMaintenanceOptionsOutputReference getMaintenanceOptions() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceMaintenanceOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceMetadataOptionsOutputReference getMetadataOptions() {
        return software.amazon.jsii.Kernel.get(this, "metadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceMetadataOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceNetworkInterfaceList getNetworkInterface() {
        return software.amazon.jsii.Kernel.get(this, "networkInterface", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceNetworkInterfaceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutpostArn() {
        return software.amazon.jsii.Kernel.get(this, "outpostArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPasswordData() {
        return software.amazon.jsii.Kernel.get(this, "passwordData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrimaryNetworkInterfaceId() {
        return software.amazon.jsii.Kernel.get(this, "primaryNetworkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateDns() {
        return software.amazon.jsii.Kernel.get(this, "privateDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstancePrivateDnsNameOptionsOutputReference getPrivateDnsNameOptions() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsNameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstancePrivateDnsNameOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicDns() {
        return software.amazon.jsii.Kernel.get(this, "publicDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicIp() {
        return software.amazon.jsii.Kernel.get(this, "publicIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceRootBlockDeviceOutputReference getRootBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "rootBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceRootBlockDeviceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotInstanceRequestId() {
        return software.amazon.jsii.Kernel.get(this, "spotInstanceRequestId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.instance.InstanceTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmiInput() {
        return software.amazon.jsii.Kernel.get(this, "amiInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAssociatePublicIpAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "associatePublicIpAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceCapacityReservationSpecification getCapacityReservationSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCapacityReservationSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCpuCoreCountInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuCoreCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceCpuOptions getCpuOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCpuOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCpuThreadsPerCoreInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuThreadsPerCoreInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceCreditSpecification getCreditSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "creditSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceCreditSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiStopInput() {
        return software.amazon.jsii.Kernel.get(this, "disableApiStopInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisableApiTerminationInput() {
        return software.amazon.jsii.Kernel.get(this, "disableApiTerminationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsOptimizedInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptimizedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnablePrimaryIpv6Input() {
        return software.amazon.jsii.Kernel.get(this, "enablePrimaryIpv6Input", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceEnclaveOptions getEnclaveOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "enclaveOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceEnclaveOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFetchPasswordDataInput() {
        return software.amazon.jsii.Kernel.get(this, "fetchPasswordDataInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHibernationInput() {
        return software.amazon.jsii.Kernel.get(this, "hibernationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostIdInput() {
        return software.amazon.jsii.Kernel.get(this, "hostIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostResourceGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "hostResourceGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamInstanceProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "iamInstanceProfileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceInitiatedShutdownBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceInitiatedShutdownBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceInstanceMarketOptions getInstanceMarketOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceMarketOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceInstanceMarketOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIpv6AddressCountInput() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6AddressesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "ipv6AddressesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "keyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceLaunchTemplate getLaunchTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceLaunchTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceMaintenanceOptions getMaintenanceOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceMaintenanceOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceMetadataOptions getMetadataOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceMetadataOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMonitoringInput() {
        return software.amazon.jsii.Kernel.get(this, "monitoringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNetworkInterfaceInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlacementGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "placementGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPlacementPartitionNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "placementPartitionNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstancePrivateDnsNameOptions getPrivateDnsNameOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsNameOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstancePrivateDnsNameOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivateIpInput() {
        return software.amazon.jsii.Kernel.get(this, "privateIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceRootBlockDevice getRootBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "rootBlockDeviceInput", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceRootBlockDevice.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecondaryPrivateIpsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "secondaryPrivateIpsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceDestCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceDestCheckInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTenancyInput() {
        return software.amazon.jsii.Kernel.get(this, "tenancyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserDataBase64Input() {
        return software.amazon.jsii.Kernel.get(this, "userDataBase64Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserDataInput() {
        return software.amazon.jsii.Kernel.get(this, "userDataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUserDataReplaceOnChangeInput() {
        return software.amazon.jsii.Kernel.get(this, "userDataReplaceOnChangeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVolumeTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "volumeTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmi() {
        return software.amazon.jsii.Kernel.get(this, "ami", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmi(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ami", java.util.Objects.requireNonNull(value, "ami is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAssociatePublicIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "associatePublicIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAssociatePublicIpAddress(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "associatePublicIpAddress", java.util.Objects.requireNonNull(value, "associatePublicIpAddress is required"));
    }

    public void setAssociatePublicIpAddress(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "associatePublicIpAddress", java.util.Objects.requireNonNull(value, "associatePublicIpAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCpuCoreCount() {
        return software.amazon.jsii.Kernel.get(this, "cpuCoreCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCpuCoreCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cpuCoreCount", java.util.Objects.requireNonNull(value, "cpuCoreCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getCpuThreadsPerCore() {
        return software.amazon.jsii.Kernel.get(this, "cpuThreadsPerCore", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setCpuThreadsPerCore(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "cpuThreadsPerCore", java.util.Objects.requireNonNull(value, "cpuThreadsPerCore is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableApiStop() {
        return software.amazon.jsii.Kernel.get(this, "disableApiStop", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableApiStop(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableApiStop", java.util.Objects.requireNonNull(value, "disableApiStop is required"));
    }

    public void setDisableApiStop(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableApiStop", java.util.Objects.requireNonNull(value, "disableApiStop is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisableApiTermination() {
        return software.amazon.jsii.Kernel.get(this, "disableApiTermination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisableApiTermination(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disableApiTermination", java.util.Objects.requireNonNull(value, "disableApiTermination is required"));
    }

    public void setDisableApiTermination(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disableApiTermination", java.util.Objects.requireNonNull(value, "disableApiTermination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEbsOptimized() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEbsOptimized(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ebsOptimized", java.util.Objects.requireNonNull(value, "ebsOptimized is required"));
    }

    public void setEbsOptimized(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ebsOptimized", java.util.Objects.requireNonNull(value, "ebsOptimized is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnablePrimaryIpv6() {
        return software.amazon.jsii.Kernel.get(this, "enablePrimaryIpv6", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnablePrimaryIpv6(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enablePrimaryIpv6", java.util.Objects.requireNonNull(value, "enablePrimaryIpv6 is required"));
    }

    public void setEnablePrimaryIpv6(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enablePrimaryIpv6", java.util.Objects.requireNonNull(value, "enablePrimaryIpv6 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFetchPasswordData() {
        return software.amazon.jsii.Kernel.get(this, "fetchPasswordData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFetchPasswordData(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "fetchPasswordData", java.util.Objects.requireNonNull(value, "fetchPasswordData is required"));
    }

    public void setFetchPasswordData(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "fetchPasswordData", java.util.Objects.requireNonNull(value, "fetchPasswordData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHibernation() {
        return software.amazon.jsii.Kernel.get(this, "hibernation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHibernation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "hibernation", java.util.Objects.requireNonNull(value, "hibernation is required"));
    }

    public void setHibernation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "hibernation", java.util.Objects.requireNonNull(value, "hibernation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostId() {
        return software.amazon.jsii.Kernel.get(this, "hostId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostId", java.util.Objects.requireNonNull(value, "hostId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostResourceGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "hostResourceGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostResourceGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostResourceGroupArn", java.util.Objects.requireNonNull(value, "hostResourceGroupArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamInstanceProfile() {
        return software.amazon.jsii.Kernel.get(this, "iamInstanceProfile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamInstanceProfile(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamInstanceProfile", java.util.Objects.requireNonNull(value, "iamInstanceProfile is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceInitiatedShutdownBehavior() {
        return software.amazon.jsii.Kernel.get(this, "instanceInitiatedShutdownBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceInitiatedShutdownBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceInitiatedShutdownBehavior", java.util.Objects.requireNonNull(value, "instanceInitiatedShutdownBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIpv6AddressCount() {
        return software.amazon.jsii.Kernel.get(this, "ipv6AddressCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIpv6AddressCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "ipv6AddressCount", java.util.Objects.requireNonNull(value, "ipv6AddressCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getIpv6Addresses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "ipv6Addresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setIpv6Addresses(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "ipv6Addresses", java.util.Objects.requireNonNull(value, "ipv6Addresses is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyName() {
        return software.amazon.jsii.Kernel.get(this, "keyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyName", java.util.Objects.requireNonNull(value, "keyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMonitoring() {
        return software.amazon.jsii.Kernel.get(this, "monitoring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMonitoring(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "monitoring", java.util.Objects.requireNonNull(value, "monitoring is required"));
    }

    public void setMonitoring(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "monitoring", java.util.Objects.requireNonNull(value, "monitoring is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlacementGroup() {
        return software.amazon.jsii.Kernel.get(this, "placementGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlacementGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "placementGroup", java.util.Objects.requireNonNull(value, "placementGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPlacementPartitionNumber() {
        return software.amazon.jsii.Kernel.get(this, "placementPartitionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPlacementPartitionNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "placementPartitionNumber", java.util.Objects.requireNonNull(value, "placementPartitionNumber is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateIp() {
        return software.amazon.jsii.Kernel.get(this, "privateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrivateIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "privateIp", java.util.Objects.requireNonNull(value, "privateIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecondaryPrivateIps() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "secondaryPrivateIps", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecondaryPrivateIps(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "secondaryPrivateIps", java.util.Objects.requireNonNull(value, "secondaryPrivateIps is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSourceDestCheck() {
        return software.amazon.jsii.Kernel.get(this, "sourceDestCheck", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSourceDestCheck(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sourceDestCheck", java.util.Objects.requireNonNull(value, "sourceDestCheck is required"));
    }

    public void setSourceDestCheck(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sourceDestCheck", java.util.Objects.requireNonNull(value, "sourceDestCheck is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetId", java.util.Objects.requireNonNull(value, "subnetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTenancy() {
        return software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTenancy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tenancy", java.util.Objects.requireNonNull(value, "tenancy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserData() {
        return software.amazon.jsii.Kernel.get(this, "userData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserData(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userData", java.util.Objects.requireNonNull(value, "userData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUserDataBase64() {
        return software.amazon.jsii.Kernel.get(this, "userDataBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUserDataBase64(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "userDataBase64", java.util.Objects.requireNonNull(value, "userDataBase64 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUserDataReplaceOnChange() {
        return software.amazon.jsii.Kernel.get(this, "userDataReplaceOnChange", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUserDataReplaceOnChange(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "userDataReplaceOnChange", java.util.Objects.requireNonNull(value, "userDataReplaceOnChange is required"));
    }

    public void setUserDataReplaceOnChange(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "userDataReplaceOnChange", java.util.Objects.requireNonNull(value, "userDataReplaceOnChange is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getVolumeTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "volumeTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVolumeTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "volumeTags", java.util.Objects.requireNonNull(value, "volumeTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getVpcSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVpcSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "vpcSecurityGroupIds", java.util.Objects.requireNonNull(value, "vpcSecurityGroupIds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.instance.Instance}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.instance.Instance> {
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
        private imports.aws.instance.InstanceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ami Instance#ami}.
         * <p>
         * @return {@code this}
         * @param ami Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ami Instance#ami}. This parameter is required.
         */
        public Builder ami(final java.lang.String ami) {
            this.config().ami(ami);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#associate_public_ip_address Instance#associate_public_ip_address}.
         * <p>
         * @return {@code this}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#associate_public_ip_address Instance#associate_public_ip_address}. This parameter is required.
         */
        public Builder associatePublicIpAddress(final java.lang.Boolean associatePublicIpAddress) {
            this.config().associatePublicIpAddress(associatePublicIpAddress);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#associate_public_ip_address Instance#associate_public_ip_address}.
         * <p>
         * @return {@code this}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#associate_public_ip_address Instance#associate_public_ip_address}. This parameter is required.
         */
        public Builder associatePublicIpAddress(final com.hashicorp.cdktf.IResolvable associatePublicIpAddress) {
            this.config().associatePublicIpAddress(associatePublicIpAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#availability_zone Instance#availability_zone}.
         * <p>
         * @return {@code this}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#availability_zone Instance#availability_zone}. This parameter is required.
         */
        public Builder availabilityZone(final java.lang.String availabilityZone) {
            this.config().availabilityZone(availabilityZone);
            return this;
        }

        /**
         * capacity_reservation_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#capacity_reservation_specification Instance#capacity_reservation_specification}
         * <p>
         * @return {@code this}
         * @param capacityReservationSpecification capacity_reservation_specification block. This parameter is required.
         */
        public Builder capacityReservationSpecification(final imports.aws.instance.InstanceCapacityReservationSpecification capacityReservationSpecification) {
            this.config().capacityReservationSpecification(capacityReservationSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_core_count Instance#cpu_core_count}.
         * <p>
         * @return {@code this}
         * @param cpuCoreCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_core_count Instance#cpu_core_count}. This parameter is required.
         */
        public Builder cpuCoreCount(final java.lang.Number cpuCoreCount) {
            this.config().cpuCoreCount(cpuCoreCount);
            return this;
        }

        /**
         * cpu_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_options Instance#cpu_options}
         * <p>
         * @return {@code this}
         * @param cpuOptions cpu_options block. This parameter is required.
         */
        public Builder cpuOptions(final imports.aws.instance.InstanceCpuOptions cpuOptions) {
            this.config().cpuOptions(cpuOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_threads_per_core Instance#cpu_threads_per_core}.
         * <p>
         * @return {@code this}
         * @param cpuThreadsPerCore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#cpu_threads_per_core Instance#cpu_threads_per_core}. This parameter is required.
         */
        public Builder cpuThreadsPerCore(final java.lang.Number cpuThreadsPerCore) {
            this.config().cpuThreadsPerCore(cpuThreadsPerCore);
            return this;
        }

        /**
         * credit_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#credit_specification Instance#credit_specification}
         * <p>
         * @return {@code this}
         * @param creditSpecification credit_specification block. This parameter is required.
         */
        public Builder creditSpecification(final imports.aws.instance.InstanceCreditSpecification creditSpecification) {
            this.config().creditSpecification(creditSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_stop Instance#disable_api_stop}.
         * <p>
         * @return {@code this}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_stop Instance#disable_api_stop}. This parameter is required.
         */
        public Builder disableApiStop(final java.lang.Boolean disableApiStop) {
            this.config().disableApiStop(disableApiStop);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_stop Instance#disable_api_stop}.
         * <p>
         * @return {@code this}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_stop Instance#disable_api_stop}. This parameter is required.
         */
        public Builder disableApiStop(final com.hashicorp.cdktf.IResolvable disableApiStop) {
            this.config().disableApiStop(disableApiStop);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_termination Instance#disable_api_termination}.
         * <p>
         * @return {@code this}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_termination Instance#disable_api_termination}. This parameter is required.
         */
        public Builder disableApiTermination(final java.lang.Boolean disableApiTermination) {
            this.config().disableApiTermination(disableApiTermination);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_termination Instance#disable_api_termination}.
         * <p>
         * @return {@code this}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#disable_api_termination Instance#disable_api_termination}. This parameter is required.
         */
        public Builder disableApiTermination(final com.hashicorp.cdktf.IResolvable disableApiTermination) {
            this.config().disableApiTermination(disableApiTermination);
            return this;
        }

        /**
         * ebs_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_block_device Instance#ebs_block_device}
         * <p>
         * @return {@code this}
         * @param ebsBlockDevice ebs_block_device block. This parameter is required.
         */
        public Builder ebsBlockDevice(final com.hashicorp.cdktf.IResolvable ebsBlockDevice) {
            this.config().ebsBlockDevice(ebsBlockDevice);
            return this;
        }
        /**
         * ebs_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_block_device Instance#ebs_block_device}
         * <p>
         * @return {@code this}
         * @param ebsBlockDevice ebs_block_device block. This parameter is required.
         */
        public Builder ebsBlockDevice(final java.util.List<? extends imports.aws.instance.InstanceEbsBlockDevice> ebsBlockDevice) {
            this.config().ebsBlockDevice(ebsBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_optimized Instance#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_optimized Instance#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final java.lang.Boolean ebsOptimized) {
            this.config().ebsOptimized(ebsOptimized);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_optimized Instance#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ebs_optimized Instance#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.config().ebsOptimized(ebsOptimized);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enable_primary_ipv6 Instance#enable_primary_ipv6}.
         * <p>
         * @return {@code this}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enable_primary_ipv6 Instance#enable_primary_ipv6}. This parameter is required.
         */
        public Builder enablePrimaryIpv6(final java.lang.Boolean enablePrimaryIpv6) {
            this.config().enablePrimaryIpv6(enablePrimaryIpv6);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enable_primary_ipv6 Instance#enable_primary_ipv6}.
         * <p>
         * @return {@code this}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enable_primary_ipv6 Instance#enable_primary_ipv6}. This parameter is required.
         */
        public Builder enablePrimaryIpv6(final com.hashicorp.cdktf.IResolvable enablePrimaryIpv6) {
            this.config().enablePrimaryIpv6(enablePrimaryIpv6);
            return this;
        }

        /**
         * enclave_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#enclave_options Instance#enclave_options}
         * <p>
         * @return {@code this}
         * @param enclaveOptions enclave_options block. This parameter is required.
         */
        public Builder enclaveOptions(final imports.aws.instance.InstanceEnclaveOptions enclaveOptions) {
            this.config().enclaveOptions(enclaveOptions);
            return this;
        }

        /**
         * ephemeral_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ephemeral_block_device Instance#ephemeral_block_device}
         * <p>
         * @return {@code this}
         * @param ephemeralBlockDevice ephemeral_block_device block. This parameter is required.
         */
        public Builder ephemeralBlockDevice(final com.hashicorp.cdktf.IResolvable ephemeralBlockDevice) {
            this.config().ephemeralBlockDevice(ephemeralBlockDevice);
            return this;
        }
        /**
         * ephemeral_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ephemeral_block_device Instance#ephemeral_block_device}
         * <p>
         * @return {@code this}
         * @param ephemeralBlockDevice ephemeral_block_device block. This parameter is required.
         */
        public Builder ephemeralBlockDevice(final java.util.List<? extends imports.aws.instance.InstanceEphemeralBlockDevice> ephemeralBlockDevice) {
            this.config().ephemeralBlockDevice(ephemeralBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#get_password_data Instance#get_password_data}.
         * <p>
         * @return {@code this}
         * @param fetchPasswordData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#get_password_data Instance#get_password_data}. This parameter is required.
         */
        public Builder fetchPasswordData(final java.lang.Boolean fetchPasswordData) {
            this.config().fetchPasswordData(fetchPasswordData);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#get_password_data Instance#get_password_data}.
         * <p>
         * @return {@code this}
         * @param fetchPasswordData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#get_password_data Instance#get_password_data}. This parameter is required.
         */
        public Builder fetchPasswordData(final com.hashicorp.cdktf.IResolvable fetchPasswordData) {
            this.config().fetchPasswordData(fetchPasswordData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#hibernation Instance#hibernation}.
         * <p>
         * @return {@code this}
         * @param hibernation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#hibernation Instance#hibernation}. This parameter is required.
         */
        public Builder hibernation(final java.lang.Boolean hibernation) {
            this.config().hibernation(hibernation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#hibernation Instance#hibernation}.
         * <p>
         * @return {@code this}
         * @param hibernation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#hibernation Instance#hibernation}. This parameter is required.
         */
        public Builder hibernation(final com.hashicorp.cdktf.IResolvable hibernation) {
            this.config().hibernation(hibernation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#host_id Instance#host_id}.
         * <p>
         * @return {@code this}
         * @param hostId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#host_id Instance#host_id}. This parameter is required.
         */
        public Builder hostId(final java.lang.String hostId) {
            this.config().hostId(hostId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#host_resource_group_arn Instance#host_resource_group_arn}.
         * <p>
         * @return {@code this}
         * @param hostResourceGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#host_resource_group_arn Instance#host_resource_group_arn}. This parameter is required.
         */
        public Builder hostResourceGroupArn(final java.lang.String hostResourceGroupArn) {
            this.config().hostResourceGroupArn(hostResourceGroupArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#iam_instance_profile Instance#iam_instance_profile}.
         * <p>
         * @return {@code this}
         * @param iamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#iam_instance_profile Instance#iam_instance_profile}. This parameter is required.
         */
        public Builder iamInstanceProfile(final java.lang.String iamInstanceProfile) {
            this.config().iamInstanceProfile(iamInstanceProfile);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#id Instance#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#id Instance#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_initiated_shutdown_behavior Instance#instance_initiated_shutdown_behavior}.
         * <p>
         * @return {@code this}
         * @param instanceInitiatedShutdownBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_initiated_shutdown_behavior Instance#instance_initiated_shutdown_behavior}. This parameter is required.
         */
        public Builder instanceInitiatedShutdownBehavior(final java.lang.String instanceInitiatedShutdownBehavior) {
            this.config().instanceInitiatedShutdownBehavior(instanceInitiatedShutdownBehavior);
            return this;
        }

        /**
         * instance_market_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_market_options Instance#instance_market_options}
         * <p>
         * @return {@code this}
         * @param instanceMarketOptions instance_market_options block. This parameter is required.
         */
        public Builder instanceMarketOptions(final imports.aws.instance.InstanceInstanceMarketOptions instanceMarketOptions) {
            this.config().instanceMarketOptions(instanceMarketOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_type Instance#instance_type}.
         * <p>
         * @return {@code this}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#instance_type Instance#instance_type}. This parameter is required.
         */
        public Builder instanceType(final java.lang.String instanceType) {
            this.config().instanceType(instanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ipv6_address_count Instance#ipv6_address_count}.
         * <p>
         * @return {@code this}
         * @param ipv6AddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ipv6_address_count Instance#ipv6_address_count}. This parameter is required.
         */
        public Builder ipv6AddressCount(final java.lang.Number ipv6AddressCount) {
            this.config().ipv6AddressCount(ipv6AddressCount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ipv6_addresses Instance#ipv6_addresses}.
         * <p>
         * @return {@code this}
         * @param ipv6Addresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#ipv6_addresses Instance#ipv6_addresses}. This parameter is required.
         */
        public Builder ipv6Addresses(final java.util.List<java.lang.String> ipv6Addresses) {
            this.config().ipv6Addresses(ipv6Addresses);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#key_name Instance#key_name}.
         * <p>
         * @return {@code this}
         * @param keyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#key_name Instance#key_name}. This parameter is required.
         */
        public Builder keyName(final java.lang.String keyName) {
            this.config().keyName(keyName);
            return this;
        }

        /**
         * launch_template block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#launch_template Instance#launch_template}
         * <p>
         * @return {@code this}
         * @param launchTemplate launch_template block. This parameter is required.
         */
        public Builder launchTemplate(final imports.aws.instance.InstanceLaunchTemplate launchTemplate) {
            this.config().launchTemplate(launchTemplate);
            return this;
        }

        /**
         * maintenance_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#maintenance_options Instance#maintenance_options}
         * <p>
         * @return {@code this}
         * @param maintenanceOptions maintenance_options block. This parameter is required.
         */
        public Builder maintenanceOptions(final imports.aws.instance.InstanceMaintenanceOptions maintenanceOptions) {
            this.config().maintenanceOptions(maintenanceOptions);
            return this;
        }

        /**
         * metadata_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#metadata_options Instance#metadata_options}
         * <p>
         * @return {@code this}
         * @param metadataOptions metadata_options block. This parameter is required.
         */
        public Builder metadataOptions(final imports.aws.instance.InstanceMetadataOptions metadataOptions) {
            this.config().metadataOptions(metadataOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#monitoring Instance#monitoring}.
         * <p>
         * @return {@code this}
         * @param monitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#monitoring Instance#monitoring}. This parameter is required.
         */
        public Builder monitoring(final java.lang.Boolean monitoring) {
            this.config().monitoring(monitoring);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#monitoring Instance#monitoring}.
         * <p>
         * @return {@code this}
         * @param monitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#monitoring Instance#monitoring}. This parameter is required.
         */
        public Builder monitoring(final com.hashicorp.cdktf.IResolvable monitoring) {
            this.config().monitoring(monitoring);
            return this;
        }

        /**
         * network_interface block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_interface Instance#network_interface}
         * <p>
         * @return {@code this}
         * @param networkInterface network_interface block. This parameter is required.
         */
        public Builder networkInterface(final com.hashicorp.cdktf.IResolvable networkInterface) {
            this.config().networkInterface(networkInterface);
            return this;
        }
        /**
         * network_interface block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#network_interface Instance#network_interface}
         * <p>
         * @return {@code this}
         * @param networkInterface network_interface block. This parameter is required.
         */
        public Builder networkInterface(final java.util.List<? extends imports.aws.instance.InstanceNetworkInterface> networkInterface) {
            this.config().networkInterface(networkInterface);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#placement_group Instance#placement_group}.
         * <p>
         * @return {@code this}
         * @param placementGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#placement_group Instance#placement_group}. This parameter is required.
         */
        public Builder placementGroup(final java.lang.String placementGroup) {
            this.config().placementGroup(placementGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#placement_partition_number Instance#placement_partition_number}.
         * <p>
         * @return {@code this}
         * @param placementPartitionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#placement_partition_number Instance#placement_partition_number}. This parameter is required.
         */
        public Builder placementPartitionNumber(final java.lang.Number placementPartitionNumber) {
            this.config().placementPartitionNumber(placementPartitionNumber);
            return this;
        }

        /**
         * private_dns_name_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#private_dns_name_options Instance#private_dns_name_options}
         * <p>
         * @return {@code this}
         * @param privateDnsNameOptions private_dns_name_options block. This parameter is required.
         */
        public Builder privateDnsNameOptions(final imports.aws.instance.InstancePrivateDnsNameOptions privateDnsNameOptions) {
            this.config().privateDnsNameOptions(privateDnsNameOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#private_ip Instance#private_ip}.
         * <p>
         * @return {@code this}
         * @param privateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#private_ip Instance#private_ip}. This parameter is required.
         */
        public Builder privateIp(final java.lang.String privateIp) {
            this.config().privateIp(privateIp);
            return this;
        }

        /**
         * root_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#root_block_device Instance#root_block_device}
         * <p>
         * @return {@code this}
         * @param rootBlockDevice root_block_device block. This parameter is required.
         */
        public Builder rootBlockDevice(final imports.aws.instance.InstanceRootBlockDevice rootBlockDevice) {
            this.config().rootBlockDevice(rootBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#secondary_private_ips Instance#secondary_private_ips}.
         * <p>
         * @return {@code this}
         * @param secondaryPrivateIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#secondary_private_ips Instance#secondary_private_ips}. This parameter is required.
         */
        public Builder secondaryPrivateIps(final java.util.List<java.lang.String> secondaryPrivateIps) {
            this.config().secondaryPrivateIps(secondaryPrivateIps);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#security_groups Instance#security_groups}.
         * <p>
         * @return {@code this}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#security_groups Instance#security_groups}. This parameter is required.
         */
        public Builder securityGroups(final java.util.List<java.lang.String> securityGroups) {
            this.config().securityGroups(securityGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#source_dest_check Instance#source_dest_check}.
         * <p>
         * @return {@code this}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#source_dest_check Instance#source_dest_check}. This parameter is required.
         */
        public Builder sourceDestCheck(final java.lang.Boolean sourceDestCheck) {
            this.config().sourceDestCheck(sourceDestCheck);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#source_dest_check Instance#source_dest_check}.
         * <p>
         * @return {@code this}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#source_dest_check Instance#source_dest_check}. This parameter is required.
         */
        public Builder sourceDestCheck(final com.hashicorp.cdktf.IResolvable sourceDestCheck) {
            this.config().sourceDestCheck(sourceDestCheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#subnet_id Instance#subnet_id}.
         * <p>
         * @return {@code this}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#subnet_id Instance#subnet_id}. This parameter is required.
         */
        public Builder subnetId(final java.lang.String subnetId) {
            this.config().subnetId(subnetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tags Instance#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tags Instance#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tags_all Instance#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tags_all Instance#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tenancy Instance#tenancy}.
         * <p>
         * @return {@code this}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#tenancy Instance#tenancy}. This parameter is required.
         */
        public Builder tenancy(final java.lang.String tenancy) {
            this.config().tenancy(tenancy);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#timeouts Instance#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.instance.InstanceTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data Instance#user_data}.
         * <p>
         * @return {@code this}
         * @param userData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data Instance#user_data}. This parameter is required.
         */
        public Builder userData(final java.lang.String userData) {
            this.config().userData(userData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_base64 Instance#user_data_base64}.
         * <p>
         * @return {@code this}
         * @param userDataBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_base64 Instance#user_data_base64}. This parameter is required.
         */
        public Builder userDataBase64(final java.lang.String userDataBase64) {
            this.config().userDataBase64(userDataBase64);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_replace_on_change Instance#user_data_replace_on_change}.
         * <p>
         * @return {@code this}
         * @param userDataReplaceOnChange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_replace_on_change Instance#user_data_replace_on_change}. This parameter is required.
         */
        public Builder userDataReplaceOnChange(final java.lang.Boolean userDataReplaceOnChange) {
            this.config().userDataReplaceOnChange(userDataReplaceOnChange);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_replace_on_change Instance#user_data_replace_on_change}.
         * <p>
         * @return {@code this}
         * @param userDataReplaceOnChange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#user_data_replace_on_change Instance#user_data_replace_on_change}. This parameter is required.
         */
        public Builder userDataReplaceOnChange(final com.hashicorp.cdktf.IResolvable userDataReplaceOnChange) {
            this.config().userDataReplaceOnChange(userDataReplaceOnChange);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#volume_tags Instance#volume_tags}.
         * <p>
         * @return {@code this}
         * @param volumeTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#volume_tags Instance#volume_tags}. This parameter is required.
         */
        public Builder volumeTags(final java.util.Map<java.lang.String, java.lang.String> volumeTags) {
            this.config().volumeTags(volumeTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#vpc_security_group_ids Instance#vpc_security_group_ids}.
         * <p>
         * @return {@code this}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/instance#vpc_security_group_ids Instance#vpc_security_group_ids}. This parameter is required.
         */
        public Builder vpcSecurityGroupIds(final java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.config().vpcSecurityGroupIds(vpcSecurityGroupIds);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.instance.Instance}.
         */
        @Override
        public imports.aws.instance.Instance build() {
            return new imports.aws.instance.Instance(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.instance.InstanceConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.instance.InstanceConfig.Builder();
            }
            return this.config;
        }
    }
}
