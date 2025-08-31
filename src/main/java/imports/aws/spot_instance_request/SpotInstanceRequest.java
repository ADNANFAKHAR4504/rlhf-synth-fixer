package imports.aws.spot_instance_request;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request aws_spot_instance_request}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.486Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotInstanceRequest.SpotInstanceRequest")
public class SpotInstanceRequest extends com.hashicorp.cdktf.TerraformResource {

    protected SpotInstanceRequest(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SpotInstanceRequest(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.spot_instance_request.SpotInstanceRequest.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request aws_spot_instance_request} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public SpotInstanceRequest(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request aws_spot_instance_request} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public SpotInstanceRequest(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a SpotInstanceRequest resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SpotInstanceRequest to import. This parameter is required.
     * @param importFromId The id of the existing SpotInstanceRequest that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SpotInstanceRequest to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.spot_instance_request.SpotInstanceRequest.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SpotInstanceRequest resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SpotInstanceRequest to import. This parameter is required.
     * @param importFromId The id of the existing SpotInstanceRequest that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.spot_instance_request.SpotInstanceRequest.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCapacityReservationSpecification(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification value) {
        software.amazon.jsii.Kernel.call(this, "putCapacityReservationSpecification", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCpuOptions(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions value) {
        software.amazon.jsii.Kernel.call(this, "putCpuOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCreditSpecification(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification value) {
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestEbsBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestEbsBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestEbsBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.spot_instance_request.SpotInstanceRequestEbsBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEbsBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnclaveOptions(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions value) {
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestEphemeralBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestEphemeralBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestEphemeralBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.spot_instance_request.SpotInstanceRequestEphemeralBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLaunchTemplate(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate value) {
        software.amazon.jsii.Kernel.call(this, "putLaunchTemplate", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMaintenanceOptions(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions value) {
        software.amazon.jsii.Kernel.call(this, "putMaintenanceOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetadataOptions(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions value) {
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestNetworkInterface>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestNetworkInterface> __cast_cd4240 = (java.util.List<imports.aws.spot_instance_request.SpotInstanceRequestNetworkInterface>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.spot_instance_request.SpotInstanceRequestNetworkInterface __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNetworkInterface", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPrivateDnsNameOptions(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions value) {
        software.amazon.jsii.Kernel.call(this, "putPrivateDnsNameOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRootBlockDevice(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice value) {
        software.amazon.jsii.Kernel.call(this, "putRootBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestTimeouts value) {
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

    public void resetBlockDurationMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetBlockDurationMinutes", software.amazon.jsii.NativeType.VOID);
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

    public void resetInstanceInterruptionBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceInterruptionBehavior", software.amazon.jsii.NativeType.VOID);
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

    public void resetLaunchGroup() {
        software.amazon.jsii.Kernel.call(this, "resetLaunchGroup", software.amazon.jsii.NativeType.VOID);
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

    public void resetSpotPrice() {
        software.amazon.jsii.Kernel.call(this, "resetSpotPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotType() {
        software.amazon.jsii.Kernel.call(this, "resetSpotType", software.amazon.jsii.NativeType.VOID);
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

    public void resetValidFrom() {
        software.amazon.jsii.Kernel.call(this, "resetValidFrom", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValidUntil() {
        software.amazon.jsii.Kernel.call(this, "resetValidUntil", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeTags() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetVpcSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetWaitForFulfillment() {
        software.amazon.jsii.Kernel.call(this, "resetWaitForFulfillment", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationOutputReference getCapacityReservationSpecification() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestCpuOptionsOutputReference getCpuOptions() {
        return software.amazon.jsii.Kernel.get(this, "cpuOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCpuOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecificationOutputReference getCreditSpecification() {
        return software.amazon.jsii.Kernel.get(this, "creditSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecificationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestEbsBlockDeviceList getEbsBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestEbsBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptionsOutputReference getEnclaveOptions() {
        return software.amazon.jsii.Kernel.get(this, "enclaveOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestEphemeralBlockDeviceList getEphemeralBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestEphemeralBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceState() {
        return software.amazon.jsii.Kernel.get(this, "instanceState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplateOutputReference getLaunchTemplate() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplateOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptionsOutputReference getMaintenanceOptions() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptionsOutputReference getMetadataOptions() {
        return software.amazon.jsii.Kernel.get(this, "metadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestNetworkInterfaceList getNetworkInterface() {
        return software.amazon.jsii.Kernel.get(this, "networkInterface", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestNetworkInterfaceList.class));
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

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptionsOutputReference getPrivateDnsNameOptions() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsNameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicDns() {
        return software.amazon.jsii.Kernel.get(this, "publicDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicIp() {
        return software.amazon.jsii.Kernel.get(this, "publicIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDeviceOutputReference getRootBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "rootBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDeviceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotBidStatus() {
        return software.amazon.jsii.Kernel.get(this, "spotBidStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotInstanceId() {
        return software.amazon.jsii.Kernel.get(this, "spotInstanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotRequestState() {
        return software.amazon.jsii.Kernel.get(this, "spotRequestState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.spot_instance_request.SpotInstanceRequestTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestTimeoutsOutputReference.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Number getBlockDurationMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "blockDurationMinutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification getCapacityReservationSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "capacityReservationSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCpuCoreCountInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuCoreCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions getCpuOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getCpuThreadsPerCoreInput() {
        return software.amazon.jsii.Kernel.get(this, "cpuThreadsPerCoreInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification getCreditSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "creditSpecificationInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions getEnclaveOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "enclaveOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceInterruptionBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getLaunchGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "launchGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate getLaunchTemplateInput() {
        return software.amazon.jsii.Kernel.get(this, "launchTemplateInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions getMaintenanceOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions getMetadataOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions.class));
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

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions getPrivateDnsNameOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "privateDnsNameOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivateIpInput() {
        return software.amazon.jsii.Kernel.get(this, "privateIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice getRootBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "rootBlockDeviceInput", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getSpotPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "spotPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpotTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "spotTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.String getValidFromInput() {
        return software.amazon.jsii.Kernel.get(this, "validFromInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValidUntilInput() {
        return software.amazon.jsii.Kernel.get(this, "validUntilInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVolumeTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "volumeTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVpcSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "vpcSecurityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getWaitForFulfillmentInput() {
        return software.amazon.jsii.Kernel.get(this, "waitForFulfillmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getBlockDurationMinutes() {
        return software.amazon.jsii.Kernel.get(this, "blockDurationMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBlockDurationMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "blockDurationMinutes", java.util.Objects.requireNonNull(value, "blockDurationMinutes is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceInterruptionBehavior() {
        return software.amazon.jsii.Kernel.get(this, "instanceInterruptionBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceInterruptionBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceInterruptionBehavior", java.util.Objects.requireNonNull(value, "instanceInterruptionBehavior is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getLaunchGroup() {
        return software.amazon.jsii.Kernel.get(this, "launchGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLaunchGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "launchGroup", java.util.Objects.requireNonNull(value, "launchGroup is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotPrice() {
        return software.amazon.jsii.Kernel.get(this, "spotPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpotPrice(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spotPrice", java.util.Objects.requireNonNull(value, "spotPrice is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotType() {
        return software.amazon.jsii.Kernel.get(this, "spotType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpotType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spotType", java.util.Objects.requireNonNull(value, "spotType is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getValidFrom() {
        return software.amazon.jsii.Kernel.get(this, "validFrom", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setValidFrom(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "validFrom", java.util.Objects.requireNonNull(value, "validFrom is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getValidUntil() {
        return software.amazon.jsii.Kernel.get(this, "validUntil", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setValidUntil(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "validUntil", java.util.Objects.requireNonNull(value, "validUntil is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getWaitForFulfillment() {
        return software.amazon.jsii.Kernel.get(this, "waitForFulfillment", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setWaitForFulfillment(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "waitForFulfillment", java.util.Objects.requireNonNull(value, "waitForFulfillment is required"));
    }

    public void setWaitForFulfillment(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "waitForFulfillment", java.util.Objects.requireNonNull(value, "waitForFulfillment is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.spot_instance_request.SpotInstanceRequest}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.spot_instance_request.SpotInstanceRequest> {
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
        private imports.aws.spot_instance_request.SpotInstanceRequestConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ami SpotInstanceRequest#ami}.
         * <p>
         * @return {@code this}
         * @param ami Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ami SpotInstanceRequest#ami}. This parameter is required.
         */
        public Builder ami(final java.lang.String ami) {
            this.config().ami(ami);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#associate_public_ip_address SpotInstanceRequest#associate_public_ip_address}.
         * <p>
         * @return {@code this}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#associate_public_ip_address SpotInstanceRequest#associate_public_ip_address}. This parameter is required.
         */
        public Builder associatePublicIpAddress(final java.lang.Boolean associatePublicIpAddress) {
            this.config().associatePublicIpAddress(associatePublicIpAddress);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#associate_public_ip_address SpotInstanceRequest#associate_public_ip_address}.
         * <p>
         * @return {@code this}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#associate_public_ip_address SpotInstanceRequest#associate_public_ip_address}. This parameter is required.
         */
        public Builder associatePublicIpAddress(final com.hashicorp.cdktf.IResolvable associatePublicIpAddress) {
            this.config().associatePublicIpAddress(associatePublicIpAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#availability_zone SpotInstanceRequest#availability_zone}.
         * <p>
         * @return {@code this}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#availability_zone SpotInstanceRequest#availability_zone}. This parameter is required.
         */
        public Builder availabilityZone(final java.lang.String availabilityZone) {
            this.config().availabilityZone(availabilityZone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#block_duration_minutes SpotInstanceRequest#block_duration_minutes}.
         * <p>
         * @return {@code this}
         * @param blockDurationMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#block_duration_minutes SpotInstanceRequest#block_duration_minutes}. This parameter is required.
         */
        public Builder blockDurationMinutes(final java.lang.Number blockDurationMinutes) {
            this.config().blockDurationMinutes(blockDurationMinutes);
            return this;
        }

        /**
         * capacity_reservation_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#capacity_reservation_specification SpotInstanceRequest#capacity_reservation_specification}
         * <p>
         * @return {@code this}
         * @param capacityReservationSpecification capacity_reservation_specification block. This parameter is required.
         */
        public Builder capacityReservationSpecification(final imports.aws.spot_instance_request.SpotInstanceRequestCapacityReservationSpecification capacityReservationSpecification) {
            this.config().capacityReservationSpecification(capacityReservationSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_core_count SpotInstanceRequest#cpu_core_count}.
         * <p>
         * @return {@code this}
         * @param cpuCoreCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_core_count SpotInstanceRequest#cpu_core_count}. This parameter is required.
         */
        public Builder cpuCoreCount(final java.lang.Number cpuCoreCount) {
            this.config().cpuCoreCount(cpuCoreCount);
            return this;
        }

        /**
         * cpu_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_options SpotInstanceRequest#cpu_options}
         * <p>
         * @return {@code this}
         * @param cpuOptions cpu_options block. This parameter is required.
         */
        public Builder cpuOptions(final imports.aws.spot_instance_request.SpotInstanceRequestCpuOptions cpuOptions) {
            this.config().cpuOptions(cpuOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_threads_per_core SpotInstanceRequest#cpu_threads_per_core}.
         * <p>
         * @return {@code this}
         * @param cpuThreadsPerCore Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#cpu_threads_per_core SpotInstanceRequest#cpu_threads_per_core}. This parameter is required.
         */
        public Builder cpuThreadsPerCore(final java.lang.Number cpuThreadsPerCore) {
            this.config().cpuThreadsPerCore(cpuThreadsPerCore);
            return this;
        }

        /**
         * credit_specification block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#credit_specification SpotInstanceRequest#credit_specification}
         * <p>
         * @return {@code this}
         * @param creditSpecification credit_specification block. This parameter is required.
         */
        public Builder creditSpecification(final imports.aws.spot_instance_request.SpotInstanceRequestCreditSpecification creditSpecification) {
            this.config().creditSpecification(creditSpecification);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_stop SpotInstanceRequest#disable_api_stop}.
         * <p>
         * @return {@code this}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_stop SpotInstanceRequest#disable_api_stop}. This parameter is required.
         */
        public Builder disableApiStop(final java.lang.Boolean disableApiStop) {
            this.config().disableApiStop(disableApiStop);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_stop SpotInstanceRequest#disable_api_stop}.
         * <p>
         * @return {@code this}
         * @param disableApiStop Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_stop SpotInstanceRequest#disable_api_stop}. This parameter is required.
         */
        public Builder disableApiStop(final com.hashicorp.cdktf.IResolvable disableApiStop) {
            this.config().disableApiStop(disableApiStop);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_termination SpotInstanceRequest#disable_api_termination}.
         * <p>
         * @return {@code this}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_termination SpotInstanceRequest#disable_api_termination}. This parameter is required.
         */
        public Builder disableApiTermination(final java.lang.Boolean disableApiTermination) {
            this.config().disableApiTermination(disableApiTermination);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_termination SpotInstanceRequest#disable_api_termination}.
         * <p>
         * @return {@code this}
         * @param disableApiTermination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#disable_api_termination SpotInstanceRequest#disable_api_termination}. This parameter is required.
         */
        public Builder disableApiTermination(final com.hashicorp.cdktf.IResolvable disableApiTermination) {
            this.config().disableApiTermination(disableApiTermination);
            return this;
        }

        /**
         * ebs_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_block_device SpotInstanceRequest#ebs_block_device}
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_block_device SpotInstanceRequest#ebs_block_device}
         * <p>
         * @return {@code this}
         * @param ebsBlockDevice ebs_block_device block. This parameter is required.
         */
        public Builder ebsBlockDevice(final java.util.List<? extends imports.aws.spot_instance_request.SpotInstanceRequestEbsBlockDevice> ebsBlockDevice) {
            this.config().ebsBlockDevice(ebsBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_optimized SpotInstanceRequest#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_optimized SpotInstanceRequest#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final java.lang.Boolean ebsOptimized) {
            this.config().ebsOptimized(ebsOptimized);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_optimized SpotInstanceRequest#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ebs_optimized SpotInstanceRequest#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.config().ebsOptimized(ebsOptimized);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enable_primary_ipv6 SpotInstanceRequest#enable_primary_ipv6}.
         * <p>
         * @return {@code this}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enable_primary_ipv6 SpotInstanceRequest#enable_primary_ipv6}. This parameter is required.
         */
        public Builder enablePrimaryIpv6(final java.lang.Boolean enablePrimaryIpv6) {
            this.config().enablePrimaryIpv6(enablePrimaryIpv6);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enable_primary_ipv6 SpotInstanceRequest#enable_primary_ipv6}.
         * <p>
         * @return {@code this}
         * @param enablePrimaryIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enable_primary_ipv6 SpotInstanceRequest#enable_primary_ipv6}. This parameter is required.
         */
        public Builder enablePrimaryIpv6(final com.hashicorp.cdktf.IResolvable enablePrimaryIpv6) {
            this.config().enablePrimaryIpv6(enablePrimaryIpv6);
            return this;
        }

        /**
         * enclave_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#enclave_options SpotInstanceRequest#enclave_options}
         * <p>
         * @return {@code this}
         * @param enclaveOptions enclave_options block. This parameter is required.
         */
        public Builder enclaveOptions(final imports.aws.spot_instance_request.SpotInstanceRequestEnclaveOptions enclaveOptions) {
            this.config().enclaveOptions(enclaveOptions);
            return this;
        }

        /**
         * ephemeral_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ephemeral_block_device SpotInstanceRequest#ephemeral_block_device}
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ephemeral_block_device SpotInstanceRequest#ephemeral_block_device}
         * <p>
         * @return {@code this}
         * @param ephemeralBlockDevice ephemeral_block_device block. This parameter is required.
         */
        public Builder ephemeralBlockDevice(final java.util.List<? extends imports.aws.spot_instance_request.SpotInstanceRequestEphemeralBlockDevice> ephemeralBlockDevice) {
            this.config().ephemeralBlockDevice(ephemeralBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#get_password_data SpotInstanceRequest#get_password_data}.
         * <p>
         * @return {@code this}
         * @param fetchPasswordData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#get_password_data SpotInstanceRequest#get_password_data}. This parameter is required.
         */
        public Builder fetchPasswordData(final java.lang.Boolean fetchPasswordData) {
            this.config().fetchPasswordData(fetchPasswordData);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#get_password_data SpotInstanceRequest#get_password_data}.
         * <p>
         * @return {@code this}
         * @param fetchPasswordData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#get_password_data SpotInstanceRequest#get_password_data}. This parameter is required.
         */
        public Builder fetchPasswordData(final com.hashicorp.cdktf.IResolvable fetchPasswordData) {
            this.config().fetchPasswordData(fetchPasswordData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#hibernation SpotInstanceRequest#hibernation}.
         * <p>
         * @return {@code this}
         * @param hibernation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#hibernation SpotInstanceRequest#hibernation}. This parameter is required.
         */
        public Builder hibernation(final java.lang.Boolean hibernation) {
            this.config().hibernation(hibernation);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#hibernation SpotInstanceRequest#hibernation}.
         * <p>
         * @return {@code this}
         * @param hibernation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#hibernation SpotInstanceRequest#hibernation}. This parameter is required.
         */
        public Builder hibernation(final com.hashicorp.cdktf.IResolvable hibernation) {
            this.config().hibernation(hibernation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#host_id SpotInstanceRequest#host_id}.
         * <p>
         * @return {@code this}
         * @param hostId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#host_id SpotInstanceRequest#host_id}. This parameter is required.
         */
        public Builder hostId(final java.lang.String hostId) {
            this.config().hostId(hostId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#host_resource_group_arn SpotInstanceRequest#host_resource_group_arn}.
         * <p>
         * @return {@code this}
         * @param hostResourceGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#host_resource_group_arn SpotInstanceRequest#host_resource_group_arn}. This parameter is required.
         */
        public Builder hostResourceGroupArn(final java.lang.String hostResourceGroupArn) {
            this.config().hostResourceGroupArn(hostResourceGroupArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#iam_instance_profile SpotInstanceRequest#iam_instance_profile}.
         * <p>
         * @return {@code this}
         * @param iamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#iam_instance_profile SpotInstanceRequest#iam_instance_profile}. This parameter is required.
         */
        public Builder iamInstanceProfile(final java.lang.String iamInstanceProfile) {
            this.config().iamInstanceProfile(iamInstanceProfile);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#id SpotInstanceRequest#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#id SpotInstanceRequest#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_initiated_shutdown_behavior SpotInstanceRequest#instance_initiated_shutdown_behavior}.
         * <p>
         * @return {@code this}
         * @param instanceInitiatedShutdownBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_initiated_shutdown_behavior SpotInstanceRequest#instance_initiated_shutdown_behavior}. This parameter is required.
         */
        public Builder instanceInitiatedShutdownBehavior(final java.lang.String instanceInitiatedShutdownBehavior) {
            this.config().instanceInitiatedShutdownBehavior(instanceInitiatedShutdownBehavior);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_interruption_behavior SpotInstanceRequest#instance_interruption_behavior}.
         * <p>
         * @return {@code this}
         * @param instanceInterruptionBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_interruption_behavior SpotInstanceRequest#instance_interruption_behavior}. This parameter is required.
         */
        public Builder instanceInterruptionBehavior(final java.lang.String instanceInterruptionBehavior) {
            this.config().instanceInterruptionBehavior(instanceInterruptionBehavior);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_type SpotInstanceRequest#instance_type}.
         * <p>
         * @return {@code this}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#instance_type SpotInstanceRequest#instance_type}. This parameter is required.
         */
        public Builder instanceType(final java.lang.String instanceType) {
            this.config().instanceType(instanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ipv6_address_count SpotInstanceRequest#ipv6_address_count}.
         * <p>
         * @return {@code this}
         * @param ipv6AddressCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ipv6_address_count SpotInstanceRequest#ipv6_address_count}. This parameter is required.
         */
        public Builder ipv6AddressCount(final java.lang.Number ipv6AddressCount) {
            this.config().ipv6AddressCount(ipv6AddressCount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ipv6_addresses SpotInstanceRequest#ipv6_addresses}.
         * <p>
         * @return {@code this}
         * @param ipv6Addresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#ipv6_addresses SpotInstanceRequest#ipv6_addresses}. This parameter is required.
         */
        public Builder ipv6Addresses(final java.util.List<java.lang.String> ipv6Addresses) {
            this.config().ipv6Addresses(ipv6Addresses);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#key_name SpotInstanceRequest#key_name}.
         * <p>
         * @return {@code this}
         * @param keyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#key_name SpotInstanceRequest#key_name}. This parameter is required.
         */
        public Builder keyName(final java.lang.String keyName) {
            this.config().keyName(keyName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#launch_group SpotInstanceRequest#launch_group}.
         * <p>
         * @return {@code this}
         * @param launchGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#launch_group SpotInstanceRequest#launch_group}. This parameter is required.
         */
        public Builder launchGroup(final java.lang.String launchGroup) {
            this.config().launchGroup(launchGroup);
            return this;
        }

        /**
         * launch_template block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#launch_template SpotInstanceRequest#launch_template}
         * <p>
         * @return {@code this}
         * @param launchTemplate launch_template block. This parameter is required.
         */
        public Builder launchTemplate(final imports.aws.spot_instance_request.SpotInstanceRequestLaunchTemplate launchTemplate) {
            this.config().launchTemplate(launchTemplate);
            return this;
        }

        /**
         * maintenance_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#maintenance_options SpotInstanceRequest#maintenance_options}
         * <p>
         * @return {@code this}
         * @param maintenanceOptions maintenance_options block. This parameter is required.
         */
        public Builder maintenanceOptions(final imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions maintenanceOptions) {
            this.config().maintenanceOptions(maintenanceOptions);
            return this;
        }

        /**
         * metadata_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#metadata_options SpotInstanceRequest#metadata_options}
         * <p>
         * @return {@code this}
         * @param metadataOptions metadata_options block. This parameter is required.
         */
        public Builder metadataOptions(final imports.aws.spot_instance_request.SpotInstanceRequestMetadataOptions metadataOptions) {
            this.config().metadataOptions(metadataOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#monitoring SpotInstanceRequest#monitoring}.
         * <p>
         * @return {@code this}
         * @param monitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#monitoring SpotInstanceRequest#monitoring}. This parameter is required.
         */
        public Builder monitoring(final java.lang.Boolean monitoring) {
            this.config().monitoring(monitoring);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#monitoring SpotInstanceRequest#monitoring}.
         * <p>
         * @return {@code this}
         * @param monitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#monitoring SpotInstanceRequest#monitoring}. This parameter is required.
         */
        public Builder monitoring(final com.hashicorp.cdktf.IResolvable monitoring) {
            this.config().monitoring(monitoring);
            return this;
        }

        /**
         * network_interface block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#network_interface SpotInstanceRequest#network_interface}
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#network_interface SpotInstanceRequest#network_interface}
         * <p>
         * @return {@code this}
         * @param networkInterface network_interface block. This parameter is required.
         */
        public Builder networkInterface(final java.util.List<? extends imports.aws.spot_instance_request.SpotInstanceRequestNetworkInterface> networkInterface) {
            this.config().networkInterface(networkInterface);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#placement_group SpotInstanceRequest#placement_group}.
         * <p>
         * @return {@code this}
         * @param placementGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#placement_group SpotInstanceRequest#placement_group}. This parameter is required.
         */
        public Builder placementGroup(final java.lang.String placementGroup) {
            this.config().placementGroup(placementGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#placement_partition_number SpotInstanceRequest#placement_partition_number}.
         * <p>
         * @return {@code this}
         * @param placementPartitionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#placement_partition_number SpotInstanceRequest#placement_partition_number}. This parameter is required.
         */
        public Builder placementPartitionNumber(final java.lang.Number placementPartitionNumber) {
            this.config().placementPartitionNumber(placementPartitionNumber);
            return this;
        }

        /**
         * private_dns_name_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#private_dns_name_options SpotInstanceRequest#private_dns_name_options}
         * <p>
         * @return {@code this}
         * @param privateDnsNameOptions private_dns_name_options block. This parameter is required.
         */
        public Builder privateDnsNameOptions(final imports.aws.spot_instance_request.SpotInstanceRequestPrivateDnsNameOptions privateDnsNameOptions) {
            this.config().privateDnsNameOptions(privateDnsNameOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#private_ip SpotInstanceRequest#private_ip}.
         * <p>
         * @return {@code this}
         * @param privateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#private_ip SpotInstanceRequest#private_ip}. This parameter is required.
         */
        public Builder privateIp(final java.lang.String privateIp) {
            this.config().privateIp(privateIp);
            return this;
        }

        /**
         * root_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#root_block_device SpotInstanceRequest#root_block_device}
         * <p>
         * @return {@code this}
         * @param rootBlockDevice root_block_device block. This parameter is required.
         */
        public Builder rootBlockDevice(final imports.aws.spot_instance_request.SpotInstanceRequestRootBlockDevice rootBlockDevice) {
            this.config().rootBlockDevice(rootBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#secondary_private_ips SpotInstanceRequest#secondary_private_ips}.
         * <p>
         * @return {@code this}
         * @param secondaryPrivateIps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#secondary_private_ips SpotInstanceRequest#secondary_private_ips}. This parameter is required.
         */
        public Builder secondaryPrivateIps(final java.util.List<java.lang.String> secondaryPrivateIps) {
            this.config().secondaryPrivateIps(secondaryPrivateIps);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#security_groups SpotInstanceRequest#security_groups}.
         * <p>
         * @return {@code this}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#security_groups SpotInstanceRequest#security_groups}. This parameter is required.
         */
        public Builder securityGroups(final java.util.List<java.lang.String> securityGroups) {
            this.config().securityGroups(securityGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#source_dest_check SpotInstanceRequest#source_dest_check}.
         * <p>
         * @return {@code this}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#source_dest_check SpotInstanceRequest#source_dest_check}. This parameter is required.
         */
        public Builder sourceDestCheck(final java.lang.Boolean sourceDestCheck) {
            this.config().sourceDestCheck(sourceDestCheck);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#source_dest_check SpotInstanceRequest#source_dest_check}.
         * <p>
         * @return {@code this}
         * @param sourceDestCheck Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#source_dest_check SpotInstanceRequest#source_dest_check}. This parameter is required.
         */
        public Builder sourceDestCheck(final com.hashicorp.cdktf.IResolvable sourceDestCheck) {
            this.config().sourceDestCheck(sourceDestCheck);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#spot_price SpotInstanceRequest#spot_price}.
         * <p>
         * @return {@code this}
         * @param spotPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#spot_price SpotInstanceRequest#spot_price}. This parameter is required.
         */
        public Builder spotPrice(final java.lang.String spotPrice) {
            this.config().spotPrice(spotPrice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#spot_type SpotInstanceRequest#spot_type}.
         * <p>
         * @return {@code this}
         * @param spotType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#spot_type SpotInstanceRequest#spot_type}. This parameter is required.
         */
        public Builder spotType(final java.lang.String spotType) {
            this.config().spotType(spotType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#subnet_id SpotInstanceRequest#subnet_id}.
         * <p>
         * @return {@code this}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#subnet_id SpotInstanceRequest#subnet_id}. This parameter is required.
         */
        public Builder subnetId(final java.lang.String subnetId) {
            this.config().subnetId(subnetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tags SpotInstanceRequest#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tags SpotInstanceRequest#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tags_all SpotInstanceRequest#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tags_all SpotInstanceRequest#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tenancy SpotInstanceRequest#tenancy}.
         * <p>
         * @return {@code this}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#tenancy SpotInstanceRequest#tenancy}. This parameter is required.
         */
        public Builder tenancy(final java.lang.String tenancy) {
            this.config().tenancy(tenancy);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#timeouts SpotInstanceRequest#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.spot_instance_request.SpotInstanceRequestTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data SpotInstanceRequest#user_data}.
         * <p>
         * @return {@code this}
         * @param userData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data SpotInstanceRequest#user_data}. This parameter is required.
         */
        public Builder userData(final java.lang.String userData) {
            this.config().userData(userData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_base64 SpotInstanceRequest#user_data_base64}.
         * <p>
         * @return {@code this}
         * @param userDataBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_base64 SpotInstanceRequest#user_data_base64}. This parameter is required.
         */
        public Builder userDataBase64(final java.lang.String userDataBase64) {
            this.config().userDataBase64(userDataBase64);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_replace_on_change SpotInstanceRequest#user_data_replace_on_change}.
         * <p>
         * @return {@code this}
         * @param userDataReplaceOnChange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_replace_on_change SpotInstanceRequest#user_data_replace_on_change}. This parameter is required.
         */
        public Builder userDataReplaceOnChange(final java.lang.Boolean userDataReplaceOnChange) {
            this.config().userDataReplaceOnChange(userDataReplaceOnChange);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_replace_on_change SpotInstanceRequest#user_data_replace_on_change}.
         * <p>
         * @return {@code this}
         * @param userDataReplaceOnChange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#user_data_replace_on_change SpotInstanceRequest#user_data_replace_on_change}. This parameter is required.
         */
        public Builder userDataReplaceOnChange(final com.hashicorp.cdktf.IResolvable userDataReplaceOnChange) {
            this.config().userDataReplaceOnChange(userDataReplaceOnChange);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#valid_from SpotInstanceRequest#valid_from}.
         * <p>
         * @return {@code this}
         * @param validFrom Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#valid_from SpotInstanceRequest#valid_from}. This parameter is required.
         */
        public Builder validFrom(final java.lang.String validFrom) {
            this.config().validFrom(validFrom);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#valid_until SpotInstanceRequest#valid_until}.
         * <p>
         * @return {@code this}
         * @param validUntil Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#valid_until SpotInstanceRequest#valid_until}. This parameter is required.
         */
        public Builder validUntil(final java.lang.String validUntil) {
            this.config().validUntil(validUntil);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#volume_tags SpotInstanceRequest#volume_tags}.
         * <p>
         * @return {@code this}
         * @param volumeTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#volume_tags SpotInstanceRequest#volume_tags}. This parameter is required.
         */
        public Builder volumeTags(final java.util.Map<java.lang.String, java.lang.String> volumeTags) {
            this.config().volumeTags(volumeTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#vpc_security_group_ids SpotInstanceRequest#vpc_security_group_ids}.
         * <p>
         * @return {@code this}
         * @param vpcSecurityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#vpc_security_group_ids SpotInstanceRequest#vpc_security_group_ids}. This parameter is required.
         */
        public Builder vpcSecurityGroupIds(final java.util.List<java.lang.String> vpcSecurityGroupIds) {
            this.config().vpcSecurityGroupIds(vpcSecurityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#wait_for_fulfillment SpotInstanceRequest#wait_for_fulfillment}.
         * <p>
         * @return {@code this}
         * @param waitForFulfillment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#wait_for_fulfillment SpotInstanceRequest#wait_for_fulfillment}. This parameter is required.
         */
        public Builder waitForFulfillment(final java.lang.Boolean waitForFulfillment) {
            this.config().waitForFulfillment(waitForFulfillment);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#wait_for_fulfillment SpotInstanceRequest#wait_for_fulfillment}.
         * <p>
         * @return {@code this}
         * @param waitForFulfillment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/spot_instance_request#wait_for_fulfillment SpotInstanceRequest#wait_for_fulfillment}. This parameter is required.
         */
        public Builder waitForFulfillment(final com.hashicorp.cdktf.IResolvable waitForFulfillment) {
            this.config().waitForFulfillment(waitForFulfillment);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.spot_instance_request.SpotInstanceRequest}.
         */
        @Override
        public imports.aws.spot_instance_request.SpotInstanceRequest build() {
            return new imports.aws.spot_instance_request.SpotInstanceRequest(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.spot_instance_request.SpotInstanceRequestConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.spot_instance_request.SpotInstanceRequestConfig.Builder();
            }
            return this.config;
        }
    }
}
