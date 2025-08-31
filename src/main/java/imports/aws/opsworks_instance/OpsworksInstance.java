package imports.aws.opsworks_instance;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance aws_opsworks_instance}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.016Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksInstance.OpsworksInstance")
public class OpsworksInstance extends com.hashicorp.cdktf.TerraformResource {

    protected OpsworksInstance(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksInstance(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.opsworks_instance.OpsworksInstance.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance aws_opsworks_instance} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public OpsworksInstance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.opsworks_instance.OpsworksInstanceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a OpsworksInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpsworksInstance to import. This parameter is required.
     * @param importFromId The id of the existing OpsworksInstance that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the OpsworksInstance to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opsworks_instance.OpsworksInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a OpsworksInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpsworksInstance to import. This parameter is required.
     * @param importFromId The id of the existing OpsworksInstance that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opsworks_instance.OpsworksInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opsworks_instance.OpsworksInstanceEbsBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opsworks_instance.OpsworksInstanceEbsBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.opsworks_instance.OpsworksInstanceEbsBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opsworks_instance.OpsworksInstanceEbsBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEbsBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opsworks_instance.OpsworksInstanceEphemeralBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opsworks_instance.OpsworksInstanceEphemeralBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.opsworks_instance.OpsworksInstanceEphemeralBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opsworks_instance.OpsworksInstanceEphemeralBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRootBlockDevice(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opsworks_instance.OpsworksInstanceRootBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opsworks_instance.OpsworksInstanceRootBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.opsworks_instance.OpsworksInstanceRootBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opsworks_instance.OpsworksInstanceRootBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRootBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.opsworks_instance.OpsworksInstanceTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAgentVersion() {
        software.amazon.jsii.Kernel.call(this, "resetAgentVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAmiId() {
        software.amazon.jsii.Kernel.call(this, "resetAmiId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetArchitecture() {
        software.amazon.jsii.Kernel.call(this, "resetArchitecture", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoScalingType() {
        software.amazon.jsii.Kernel.call(this, "resetAutoScalingType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCreatedAt() {
        software.amazon.jsii.Kernel.call(this, "resetCreatedAt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteEbs() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteEbs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeleteEip() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteEip", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetEbsBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsOptimized() {
        software.amazon.jsii.Kernel.call(this, "resetEbsOptimized", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEcsClusterArn() {
        software.amazon.jsii.Kernel.call(this, "resetEcsClusterArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticIp() {
        software.amazon.jsii.Kernel.call(this, "resetElasticIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEphemeralBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostname() {
        software.amazon.jsii.Kernel.call(this, "resetHostname", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInfrastructureClass() {
        software.amazon.jsii.Kernel.call(this, "resetInfrastructureClass", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstallUpdatesOnBoot() {
        software.amazon.jsii.Kernel.call(this, "resetInstallUpdatesOnBoot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceProfileArn() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceProfileArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceType() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOs() {
        software.amazon.jsii.Kernel.call(this, "resetOs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetRootBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootDeviceType() {
        software.amazon.jsii.Kernel.call(this, "resetRootDeviceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSshKeyName() {
        software.amazon.jsii.Kernel.call(this, "resetSshKeyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetState() {
        software.amazon.jsii.Kernel.call(this, "resetState", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTenancy() {
        software.amazon.jsii.Kernel.call(this, "resetTenancy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVirtualizationType() {
        software.amazon.jsii.Kernel.call(this, "resetVirtualizationType", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_instance.OpsworksInstanceEbsBlockDeviceList getEbsBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_instance.OpsworksInstanceEbsBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEc2InstanceId() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_instance.OpsworksInstanceEphemeralBlockDeviceList getEphemeralBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_instance.OpsworksInstanceEphemeralBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastServiceErrorId() {
        return software.amazon.jsii.Kernel.get(this, "lastServiceErrorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatform() {
        return software.amazon.jsii.Kernel.get(this, "platform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateDns() {
        return software.amazon.jsii.Kernel.get(this, "privateDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivateIp() {
        return software.amazon.jsii.Kernel.get(this, "privateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicDns() {
        return software.amazon.jsii.Kernel.get(this, "publicDns", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPublicIp() {
        return software.amazon.jsii.Kernel.get(this, "publicIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegisteredBy() {
        return software.amazon.jsii.Kernel.get(this, "registeredBy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReportedAgentVersion() {
        return software.amazon.jsii.Kernel.get(this, "reportedAgentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReportedOsFamily() {
        return software.amazon.jsii.Kernel.get(this, "reportedOsFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReportedOsName() {
        return software.amazon.jsii.Kernel.get(this, "reportedOsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReportedOsVersion() {
        return software.amazon.jsii.Kernel.get(this, "reportedOsVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_instance.OpsworksInstanceRootBlockDeviceList getRootBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "rootBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_instance.OpsworksInstanceRootBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootDeviceVolumeId() {
        return software.amazon.jsii.Kernel.get(this, "rootDeviceVolumeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSshHostDsaKeyFingerprint() {
        return software.amazon.jsii.Kernel.get(this, "sshHostDsaKeyFingerprint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSshHostRsaKeyFingerprint() {
        return software.amazon.jsii.Kernel.get(this, "sshHostRsaKeyFingerprint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_instance.OpsworksInstanceTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_instance.OpsworksInstanceTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "agentVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAmiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "amiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArchitectureInput() {
        return software.amazon.jsii.Kernel.get(this, "architectureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoScalingTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCreatedAtInput() {
        return software.amazon.jsii.Kernel.get(this, "createdAtInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeleteEbsInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteEbsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeleteEipInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteEipInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsOptimizedInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptimizedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEcsClusterArnInput() {
        return software.amazon.jsii.Kernel.get(this, "ecsClusterArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getElasticIpInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostnameInput() {
        return software.amazon.jsii.Kernel.get(this, "hostnameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInfrastructureClassInput() {
        return software.amazon.jsii.Kernel.get(this, "infrastructureClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInstallUpdatesOnBootInput() {
        return software.amazon.jsii.Kernel.get(this, "installUpdatesOnBootInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceProfileArnInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceProfileArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getLayerIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "layerIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOsInput() {
        return software.amazon.jsii.Kernel.get(this, "osInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRootBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "rootBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRootDeviceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "rootDeviceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSshKeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "sshKeyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStackIdInput() {
        return software.amazon.jsii.Kernel.get(this, "stackIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStateInput() {
        return software.amazon.jsii.Kernel.get(this, "stateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "subnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTenancyInput() {
        return software.amazon.jsii.Kernel.get(this, "tenancyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVirtualizationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "virtualizationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentVersion() {
        return software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAgentVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "agentVersion", java.util.Objects.requireNonNull(value, "agentVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAmiId() {
        return software.amazon.jsii.Kernel.get(this, "amiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAmiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "amiId", java.util.Objects.requireNonNull(value, "amiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArchitecture() {
        return software.amazon.jsii.Kernel.get(this, "architecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArchitecture(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "architecture", java.util.Objects.requireNonNull(value, "architecture is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoScalingType() {
        return software.amazon.jsii.Kernel.get(this, "autoScalingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoScalingType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoScalingType", java.util.Objects.requireNonNull(value, "autoScalingType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZone", java.util.Objects.requireNonNull(value, "availabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedAt() {
        return software.amazon.jsii.Kernel.get(this, "createdAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCreatedAt(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "createdAt", java.util.Objects.requireNonNull(value, "createdAt is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeleteEbs() {
        return software.amazon.jsii.Kernel.get(this, "deleteEbs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeleteEbs(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deleteEbs", java.util.Objects.requireNonNull(value, "deleteEbs is required"));
    }

    public void setDeleteEbs(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deleteEbs", java.util.Objects.requireNonNull(value, "deleteEbs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeleteEip() {
        return software.amazon.jsii.Kernel.get(this, "deleteEip", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeleteEip(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deleteEip", java.util.Objects.requireNonNull(value, "deleteEip is required"));
    }

    public void setDeleteEip(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deleteEip", java.util.Objects.requireNonNull(value, "deleteEip is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getEcsClusterArn() {
        return software.amazon.jsii.Kernel.get(this, "ecsClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEcsClusterArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ecsClusterArn", java.util.Objects.requireNonNull(value, "ecsClusterArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getElasticIp() {
        return software.amazon.jsii.Kernel.get(this, "elasticIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setElasticIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "elasticIp", java.util.Objects.requireNonNull(value, "elasticIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostname() {
        return software.amazon.jsii.Kernel.get(this, "hostname", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostname(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostname", java.util.Objects.requireNonNull(value, "hostname is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInfrastructureClass() {
        return software.amazon.jsii.Kernel.get(this, "infrastructureClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInfrastructureClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "infrastructureClass", java.util.Objects.requireNonNull(value, "infrastructureClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getInstallUpdatesOnBoot() {
        return software.amazon.jsii.Kernel.get(this, "installUpdatesOnBoot", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInstallUpdatesOnBoot(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "installUpdatesOnBoot", java.util.Objects.requireNonNull(value, "installUpdatesOnBoot is required"));
    }

    public void setInstallUpdatesOnBoot(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "installUpdatesOnBoot", java.util.Objects.requireNonNull(value, "installUpdatesOnBoot is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceProfileArn() {
        return software.amazon.jsii.Kernel.get(this, "instanceProfileArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceProfileArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceProfileArn", java.util.Objects.requireNonNull(value, "instanceProfileArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getLayerIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "layerIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setLayerIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "layerIds", java.util.Objects.requireNonNull(value, "layerIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOs() {
        return software.amazon.jsii.Kernel.get(this, "os", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOs(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "os", java.util.Objects.requireNonNull(value, "os is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootDeviceType() {
        return software.amazon.jsii.Kernel.get(this, "rootDeviceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRootDeviceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rootDeviceType", java.util.Objects.requireNonNull(value, "rootDeviceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSshKeyName() {
        return software.amazon.jsii.Kernel.get(this, "sshKeyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSshKeyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sshKeyName", java.util.Objects.requireNonNull(value, "sshKeyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackId() {
        return software.amazon.jsii.Kernel.get(this, "stackId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStackId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stackId", java.util.Objects.requireNonNull(value, "stackId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setState(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "state", java.util.Objects.requireNonNull(value, "state is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "subnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subnetId", java.util.Objects.requireNonNull(value, "subnetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTenancy() {
        return software.amazon.jsii.Kernel.get(this, "tenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTenancy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tenancy", java.util.Objects.requireNonNull(value, "tenancy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVirtualizationType() {
        return software.amazon.jsii.Kernel.get(this, "virtualizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVirtualizationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "virtualizationType", java.util.Objects.requireNonNull(value, "virtualizationType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.opsworks_instance.OpsworksInstance}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.opsworks_instance.OpsworksInstance> {
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
        private final imports.aws.opsworks_instance.OpsworksInstanceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.opsworks_instance.OpsworksInstanceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#layer_ids OpsworksInstance#layer_ids}.
         * <p>
         * @return {@code this}
         * @param layerIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#layer_ids OpsworksInstance#layer_ids}. This parameter is required.
         */
        public Builder layerIds(final java.util.List<java.lang.String> layerIds) {
            this.config.layerIds(layerIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#stack_id OpsworksInstance#stack_id}.
         * <p>
         * @return {@code this}
         * @param stackId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#stack_id OpsworksInstance#stack_id}. This parameter is required.
         */
        public Builder stackId(final java.lang.String stackId) {
            this.config.stackId(stackId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#agent_version OpsworksInstance#agent_version}.
         * <p>
         * @return {@code this}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#agent_version OpsworksInstance#agent_version}. This parameter is required.
         */
        public Builder agentVersion(final java.lang.String agentVersion) {
            this.config.agentVersion(agentVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ami_id OpsworksInstance#ami_id}.
         * <p>
         * @return {@code this}
         * @param amiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ami_id OpsworksInstance#ami_id}. This parameter is required.
         */
        public Builder amiId(final java.lang.String amiId) {
            this.config.amiId(amiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#architecture OpsworksInstance#architecture}.
         * <p>
         * @return {@code this}
         * @param architecture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#architecture OpsworksInstance#architecture}. This parameter is required.
         */
        public Builder architecture(final java.lang.String architecture) {
            this.config.architecture(architecture);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#auto_scaling_type OpsworksInstance#auto_scaling_type}.
         * <p>
         * @return {@code this}
         * @param autoScalingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#auto_scaling_type OpsworksInstance#auto_scaling_type}. This parameter is required.
         */
        public Builder autoScalingType(final java.lang.String autoScalingType) {
            this.config.autoScalingType(autoScalingType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#availability_zone OpsworksInstance#availability_zone}.
         * <p>
         * @return {@code this}
         * @param availabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#availability_zone OpsworksInstance#availability_zone}. This parameter is required.
         */
        public Builder availabilityZone(final java.lang.String availabilityZone) {
            this.config.availabilityZone(availabilityZone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#created_at OpsworksInstance#created_at}.
         * <p>
         * @return {@code this}
         * @param createdAt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#created_at OpsworksInstance#created_at}. This parameter is required.
         */
        public Builder createdAt(final java.lang.String createdAt) {
            this.config.createdAt(createdAt);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_ebs OpsworksInstance#delete_ebs}.
         * <p>
         * @return {@code this}
         * @param deleteEbs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_ebs OpsworksInstance#delete_ebs}. This parameter is required.
         */
        public Builder deleteEbs(final java.lang.Boolean deleteEbs) {
            this.config.deleteEbs(deleteEbs);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_ebs OpsworksInstance#delete_ebs}.
         * <p>
         * @return {@code this}
         * @param deleteEbs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_ebs OpsworksInstance#delete_ebs}. This parameter is required.
         */
        public Builder deleteEbs(final com.hashicorp.cdktf.IResolvable deleteEbs) {
            this.config.deleteEbs(deleteEbs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_eip OpsworksInstance#delete_eip}.
         * <p>
         * @return {@code this}
         * @param deleteEip Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_eip OpsworksInstance#delete_eip}. This parameter is required.
         */
        public Builder deleteEip(final java.lang.Boolean deleteEip) {
            this.config.deleteEip(deleteEip);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_eip OpsworksInstance#delete_eip}.
         * <p>
         * @return {@code this}
         * @param deleteEip Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#delete_eip OpsworksInstance#delete_eip}. This parameter is required.
         */
        public Builder deleteEip(final com.hashicorp.cdktf.IResolvable deleteEip) {
            this.config.deleteEip(deleteEip);
            return this;
        }

        /**
         * ebs_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_block_device OpsworksInstance#ebs_block_device}
         * <p>
         * @return {@code this}
         * @param ebsBlockDevice ebs_block_device block. This parameter is required.
         */
        public Builder ebsBlockDevice(final com.hashicorp.cdktf.IResolvable ebsBlockDevice) {
            this.config.ebsBlockDevice(ebsBlockDevice);
            return this;
        }
        /**
         * ebs_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_block_device OpsworksInstance#ebs_block_device}
         * <p>
         * @return {@code this}
         * @param ebsBlockDevice ebs_block_device block. This parameter is required.
         */
        public Builder ebsBlockDevice(final java.util.List<? extends imports.aws.opsworks_instance.OpsworksInstanceEbsBlockDevice> ebsBlockDevice) {
            this.config.ebsBlockDevice(ebsBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_optimized OpsworksInstance#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_optimized OpsworksInstance#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final java.lang.Boolean ebsOptimized) {
            this.config.ebsOptimized(ebsOptimized);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_optimized OpsworksInstance#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ebs_optimized OpsworksInstance#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.config.ebsOptimized(ebsOptimized);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ecs_cluster_arn OpsworksInstance#ecs_cluster_arn}.
         * <p>
         * @return {@code this}
         * @param ecsClusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ecs_cluster_arn OpsworksInstance#ecs_cluster_arn}. This parameter is required.
         */
        public Builder ecsClusterArn(final java.lang.String ecsClusterArn) {
            this.config.ecsClusterArn(ecsClusterArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#elastic_ip OpsworksInstance#elastic_ip}.
         * <p>
         * @return {@code this}
         * @param elasticIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#elastic_ip OpsworksInstance#elastic_ip}. This parameter is required.
         */
        public Builder elasticIp(final java.lang.String elasticIp) {
            this.config.elasticIp(elasticIp);
            return this;
        }

        /**
         * ephemeral_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ephemeral_block_device OpsworksInstance#ephemeral_block_device}
         * <p>
         * @return {@code this}
         * @param ephemeralBlockDevice ephemeral_block_device block. This parameter is required.
         */
        public Builder ephemeralBlockDevice(final com.hashicorp.cdktf.IResolvable ephemeralBlockDevice) {
            this.config.ephemeralBlockDevice(ephemeralBlockDevice);
            return this;
        }
        /**
         * ephemeral_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ephemeral_block_device OpsworksInstance#ephemeral_block_device}
         * <p>
         * @return {@code this}
         * @param ephemeralBlockDevice ephemeral_block_device block. This parameter is required.
         */
        public Builder ephemeralBlockDevice(final java.util.List<? extends imports.aws.opsworks_instance.OpsworksInstanceEphemeralBlockDevice> ephemeralBlockDevice) {
            this.config.ephemeralBlockDevice(ephemeralBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#hostname OpsworksInstance#hostname}.
         * <p>
         * @return {@code this}
         * @param hostname Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#hostname OpsworksInstance#hostname}. This parameter is required.
         */
        public Builder hostname(final java.lang.String hostname) {
            this.config.hostname(hostname);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#id OpsworksInstance#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#id OpsworksInstance#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#infrastructure_class OpsworksInstance#infrastructure_class}.
         * <p>
         * @return {@code this}
         * @param infrastructureClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#infrastructure_class OpsworksInstance#infrastructure_class}. This parameter is required.
         */
        public Builder infrastructureClass(final java.lang.String infrastructureClass) {
            this.config.infrastructureClass(infrastructureClass);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#install_updates_on_boot OpsworksInstance#install_updates_on_boot}.
         * <p>
         * @return {@code this}
         * @param installUpdatesOnBoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#install_updates_on_boot OpsworksInstance#install_updates_on_boot}. This parameter is required.
         */
        public Builder installUpdatesOnBoot(final java.lang.Boolean installUpdatesOnBoot) {
            this.config.installUpdatesOnBoot(installUpdatesOnBoot);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#install_updates_on_boot OpsworksInstance#install_updates_on_boot}.
         * <p>
         * @return {@code this}
         * @param installUpdatesOnBoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#install_updates_on_boot OpsworksInstance#install_updates_on_boot}. This parameter is required.
         */
        public Builder installUpdatesOnBoot(final com.hashicorp.cdktf.IResolvable installUpdatesOnBoot) {
            this.config.installUpdatesOnBoot(installUpdatesOnBoot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#instance_profile_arn OpsworksInstance#instance_profile_arn}.
         * <p>
         * @return {@code this}
         * @param instanceProfileArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#instance_profile_arn OpsworksInstance#instance_profile_arn}. This parameter is required.
         */
        public Builder instanceProfileArn(final java.lang.String instanceProfileArn) {
            this.config.instanceProfileArn(instanceProfileArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#instance_type OpsworksInstance#instance_type}.
         * <p>
         * @return {@code this}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#instance_type OpsworksInstance#instance_type}. This parameter is required.
         */
        public Builder instanceType(final java.lang.String instanceType) {
            this.config.instanceType(instanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#os OpsworksInstance#os}.
         * <p>
         * @return {@code this}
         * @param os Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#os OpsworksInstance#os}. This parameter is required.
         */
        public Builder os(final java.lang.String os) {
            this.config.os(os);
            return this;
        }

        /**
         * root_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_block_device OpsworksInstance#root_block_device}
         * <p>
         * @return {@code this}
         * @param rootBlockDevice root_block_device block. This parameter is required.
         */
        public Builder rootBlockDevice(final com.hashicorp.cdktf.IResolvable rootBlockDevice) {
            this.config.rootBlockDevice(rootBlockDevice);
            return this;
        }
        /**
         * root_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_block_device OpsworksInstance#root_block_device}
         * <p>
         * @return {@code this}
         * @param rootBlockDevice root_block_device block. This parameter is required.
         */
        public Builder rootBlockDevice(final java.util.List<? extends imports.aws.opsworks_instance.OpsworksInstanceRootBlockDevice> rootBlockDevice) {
            this.config.rootBlockDevice(rootBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_device_type OpsworksInstance#root_device_type}.
         * <p>
         * @return {@code this}
         * @param rootDeviceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#root_device_type OpsworksInstance#root_device_type}. This parameter is required.
         */
        public Builder rootDeviceType(final java.lang.String rootDeviceType) {
            this.config.rootDeviceType(rootDeviceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#security_group_ids OpsworksInstance#security_group_ids}.
         * <p>
         * @return {@code this}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#security_group_ids OpsworksInstance#security_group_ids}. This parameter is required.
         */
        public Builder securityGroupIds(final java.util.List<java.lang.String> securityGroupIds) {
            this.config.securityGroupIds(securityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ssh_key_name OpsworksInstance#ssh_key_name}.
         * <p>
         * @return {@code this}
         * @param sshKeyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#ssh_key_name OpsworksInstance#ssh_key_name}. This parameter is required.
         */
        public Builder sshKeyName(final java.lang.String sshKeyName) {
            this.config.sshKeyName(sshKeyName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#state OpsworksInstance#state}.
         * <p>
         * @return {@code this}
         * @param state Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#state OpsworksInstance#state}. This parameter is required.
         */
        public Builder state(final java.lang.String state) {
            this.config.state(state);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#status OpsworksInstance#status}.
         * <p>
         * @return {@code this}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#status OpsworksInstance#status}. This parameter is required.
         */
        public Builder status(final java.lang.String status) {
            this.config.status(status);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#subnet_id OpsworksInstance#subnet_id}.
         * <p>
         * @return {@code this}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#subnet_id OpsworksInstance#subnet_id}. This parameter is required.
         */
        public Builder subnetId(final java.lang.String subnetId) {
            this.config.subnetId(subnetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#tenancy OpsworksInstance#tenancy}.
         * <p>
         * @return {@code this}
         * @param tenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#tenancy OpsworksInstance#tenancy}. This parameter is required.
         */
        public Builder tenancy(final java.lang.String tenancy) {
            this.config.tenancy(tenancy);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#timeouts OpsworksInstance#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.opsworks_instance.OpsworksInstanceTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#virtualization_type OpsworksInstance#virtualization_type}.
         * <p>
         * @return {@code this}
         * @param virtualizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_instance#virtualization_type OpsworksInstance#virtualization_type}. This parameter is required.
         */
        public Builder virtualizationType(final java.lang.String virtualizationType) {
            this.config.virtualizationType(virtualizationType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.opsworks_instance.OpsworksInstance}.
         */
        @Override
        public imports.aws.opsworks_instance.OpsworksInstance build() {
            return new imports.aws.opsworks_instance.OpsworksInstance(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
