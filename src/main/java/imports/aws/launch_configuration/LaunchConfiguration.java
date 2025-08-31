package imports.aws.launch_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration aws_launch_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.513Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchConfiguration.LaunchConfiguration")
public class LaunchConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected LaunchConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LaunchConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.launch_configuration.LaunchConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration aws_launch_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LaunchConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.launch_configuration.LaunchConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LaunchConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LaunchConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing LaunchConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LaunchConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.launch_configuration.LaunchConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LaunchConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LaunchConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing LaunchConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.launch_configuration.LaunchConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.launch_configuration.LaunchConfigurationEbsBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.launch_configuration.LaunchConfigurationEbsBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.launch_configuration.LaunchConfigurationEbsBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.launch_configuration.LaunchConfigurationEbsBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.launch_configuration.LaunchConfigurationEphemeralBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.launch_configuration.LaunchConfigurationEphemeralBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.launch_configuration.LaunchConfigurationEphemeralBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.launch_configuration.LaunchConfigurationEphemeralBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMetadataOptions(final @org.jetbrains.annotations.NotNull imports.aws.launch_configuration.LaunchConfigurationMetadataOptions value) {
        software.amazon.jsii.Kernel.call(this, "putMetadataOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRootBlockDevice(final @org.jetbrains.annotations.NotNull imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice value) {
        software.amazon.jsii.Kernel.call(this, "putRootBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAssociatePublicIpAddress() {
        software.amazon.jsii.Kernel.call(this, "resetAssociatePublicIpAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetEbsBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsOptimized() {
        software.amazon.jsii.Kernel.call(this, "resetEbsOptimized", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableMonitoring() {
        software.amazon.jsii.Kernel.call(this, "resetEnableMonitoring", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEphemeralBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamInstanceProfile() {
        software.amazon.jsii.Kernel.call(this, "resetIamInstanceProfile", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyName() {
        software.amazon.jsii.Kernel.call(this, "resetKeyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMetadataOptions() {
        software.amazon.jsii.Kernel.call(this, "resetMetadataOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacementTenancy() {
        software.amazon.jsii.Kernel.call(this, "resetPlacementTenancy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetRootBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSpotPrice() {
        software.amazon.jsii.Kernel.call(this, "resetSpotPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserData() {
        software.amazon.jsii.Kernel.call(this, "resetUserData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserDataBase64() {
        software.amazon.jsii.Kernel.call(this, "resetUserDataBase64", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.launch_configuration.LaunchConfigurationEbsBlockDeviceList getEbsBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.launch_configuration.LaunchConfigurationEbsBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_configuration.LaunchConfigurationEphemeralBlockDeviceList getEphemeralBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.launch_configuration.LaunchConfigurationEphemeralBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_configuration.LaunchConfigurationMetadataOptionsOutputReference getMetadataOptions() {
        return software.amazon.jsii.Kernel.get(this, "metadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.launch_configuration.LaunchConfigurationMetadataOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.launch_configuration.LaunchConfigurationRootBlockDeviceOutputReference getRootBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "rootBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.launch_configuration.LaunchConfigurationRootBlockDeviceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAssociatePublicIpAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "associatePublicIpAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsOptimizedInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptimizedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableMonitoringInput() {
        return software.amazon.jsii.Kernel.get(this, "enableMonitoringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamInstanceProfileInput() {
        return software.amazon.jsii.Kernel.get(this, "iamInstanceProfileInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageIdInput() {
        return software.amazon.jsii.Kernel.get(this, "imageIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "keyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_configuration.LaunchConfigurationMetadataOptions getMetadataOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "metadataOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_configuration.LaunchConfigurationMetadataOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlacementTenancyInput() {
        return software.amazon.jsii.Kernel.get(this, "placementTenancyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice getRootBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "rootBlockDeviceInput", software.amazon.jsii.NativeType.forClass(imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSpotPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "spotPriceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserDataBase64Input() {
        return software.amazon.jsii.Kernel.get(this, "userDataBase64Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUserDataInput() {
        return software.amazon.jsii.Kernel.get(this, "userDataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getEbsOptimized() {
        return software.amazon.jsii.Kernel.get(this, "ebsOptimized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEbsOptimized(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "ebsOptimized", java.util.Objects.requireNonNull(value, "ebsOptimized is required"));
    }

    public void setEbsOptimized(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "ebsOptimized", java.util.Objects.requireNonNull(value, "ebsOptimized is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableMonitoring() {
        return software.amazon.jsii.Kernel.get(this, "enableMonitoring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableMonitoring(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableMonitoring", java.util.Objects.requireNonNull(value, "enableMonitoring is required"));
    }

    public void setEnableMonitoring(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableMonitoring", java.util.Objects.requireNonNull(value, "enableMonitoring is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getImageId() {
        return software.amazon.jsii.Kernel.get(this, "imageId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageId", java.util.Objects.requireNonNull(value, "imageId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyName() {
        return software.amazon.jsii.Kernel.get(this, "keyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyName", java.util.Objects.requireNonNull(value, "keyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namePrefix", java.util.Objects.requireNonNull(value, "namePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlacementTenancy() {
        return software.amazon.jsii.Kernel.get(this, "placementTenancy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlacementTenancy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "placementTenancy", java.util.Objects.requireNonNull(value, "placementTenancy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroups() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroups(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroups", java.util.Objects.requireNonNull(value, "securityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSpotPrice() {
        return software.amazon.jsii.Kernel.get(this, "spotPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSpotPrice(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "spotPrice", java.util.Objects.requireNonNull(value, "spotPrice is required"));
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

    /**
     * A fluent builder for {@link imports.aws.launch_configuration.LaunchConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.launch_configuration.LaunchConfiguration> {
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
        private final imports.aws.launch_configuration.LaunchConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.launch_configuration.LaunchConfigurationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#image_id LaunchConfiguration#image_id}.
         * <p>
         * @return {@code this}
         * @param imageId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#image_id LaunchConfiguration#image_id}. This parameter is required.
         */
        public Builder imageId(final java.lang.String imageId) {
            this.config.imageId(imageId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#instance_type LaunchConfiguration#instance_type}.
         * <p>
         * @return {@code this}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#instance_type LaunchConfiguration#instance_type}. This parameter is required.
         */
        public Builder instanceType(final java.lang.String instanceType) {
            this.config.instanceType(instanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#associate_public_ip_address LaunchConfiguration#associate_public_ip_address}.
         * <p>
         * @return {@code this}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#associate_public_ip_address LaunchConfiguration#associate_public_ip_address}. This parameter is required.
         */
        public Builder associatePublicIpAddress(final java.lang.Boolean associatePublicIpAddress) {
            this.config.associatePublicIpAddress(associatePublicIpAddress);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#associate_public_ip_address LaunchConfiguration#associate_public_ip_address}.
         * <p>
         * @return {@code this}
         * @param associatePublicIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#associate_public_ip_address LaunchConfiguration#associate_public_ip_address}. This parameter is required.
         */
        public Builder associatePublicIpAddress(final com.hashicorp.cdktf.IResolvable associatePublicIpAddress) {
            this.config.associatePublicIpAddress(associatePublicIpAddress);
            return this;
        }

        /**
         * ebs_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_block_device LaunchConfiguration#ebs_block_device}
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_block_device LaunchConfiguration#ebs_block_device}
         * <p>
         * @return {@code this}
         * @param ebsBlockDevice ebs_block_device block. This parameter is required.
         */
        public Builder ebsBlockDevice(final java.util.List<? extends imports.aws.launch_configuration.LaunchConfigurationEbsBlockDevice> ebsBlockDevice) {
            this.config.ebsBlockDevice(ebsBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_optimized LaunchConfiguration#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_optimized LaunchConfiguration#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final java.lang.Boolean ebsOptimized) {
            this.config.ebsOptimized(ebsOptimized);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_optimized LaunchConfiguration#ebs_optimized}.
         * <p>
         * @return {@code this}
         * @param ebsOptimized Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ebs_optimized LaunchConfiguration#ebs_optimized}. This parameter is required.
         */
        public Builder ebsOptimized(final com.hashicorp.cdktf.IResolvable ebsOptimized) {
            this.config.ebsOptimized(ebsOptimized);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#enable_monitoring LaunchConfiguration#enable_monitoring}.
         * <p>
         * @return {@code this}
         * @param enableMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#enable_monitoring LaunchConfiguration#enable_monitoring}. This parameter is required.
         */
        public Builder enableMonitoring(final java.lang.Boolean enableMonitoring) {
            this.config.enableMonitoring(enableMonitoring);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#enable_monitoring LaunchConfiguration#enable_monitoring}.
         * <p>
         * @return {@code this}
         * @param enableMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#enable_monitoring LaunchConfiguration#enable_monitoring}. This parameter is required.
         */
        public Builder enableMonitoring(final com.hashicorp.cdktf.IResolvable enableMonitoring) {
            this.config.enableMonitoring(enableMonitoring);
            return this;
        }

        /**
         * ephemeral_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ephemeral_block_device LaunchConfiguration#ephemeral_block_device}
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#ephemeral_block_device LaunchConfiguration#ephemeral_block_device}
         * <p>
         * @return {@code this}
         * @param ephemeralBlockDevice ephemeral_block_device block. This parameter is required.
         */
        public Builder ephemeralBlockDevice(final java.util.List<? extends imports.aws.launch_configuration.LaunchConfigurationEphemeralBlockDevice> ephemeralBlockDevice) {
            this.config.ephemeralBlockDevice(ephemeralBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#iam_instance_profile LaunchConfiguration#iam_instance_profile}.
         * <p>
         * @return {@code this}
         * @param iamInstanceProfile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#iam_instance_profile LaunchConfiguration#iam_instance_profile}. This parameter is required.
         */
        public Builder iamInstanceProfile(final java.lang.String iamInstanceProfile) {
            this.config.iamInstanceProfile(iamInstanceProfile);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#id LaunchConfiguration#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#id LaunchConfiguration#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#key_name LaunchConfiguration#key_name}.
         * <p>
         * @return {@code this}
         * @param keyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#key_name LaunchConfiguration#key_name}. This parameter is required.
         */
        public Builder keyName(final java.lang.String keyName) {
            this.config.keyName(keyName);
            return this;
        }

        /**
         * metadata_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#metadata_options LaunchConfiguration#metadata_options}
         * <p>
         * @return {@code this}
         * @param metadataOptions metadata_options block. This parameter is required.
         */
        public Builder metadataOptions(final imports.aws.launch_configuration.LaunchConfigurationMetadataOptions metadataOptions) {
            this.config.metadataOptions(metadataOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#name LaunchConfiguration#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#name LaunchConfiguration#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#name_prefix LaunchConfiguration#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#name_prefix LaunchConfiguration#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config.namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#placement_tenancy LaunchConfiguration#placement_tenancy}.
         * <p>
         * @return {@code this}
         * @param placementTenancy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#placement_tenancy LaunchConfiguration#placement_tenancy}. This parameter is required.
         */
        public Builder placementTenancy(final java.lang.String placementTenancy) {
            this.config.placementTenancy(placementTenancy);
            return this;
        }

        /**
         * root_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#root_block_device LaunchConfiguration#root_block_device}
         * <p>
         * @return {@code this}
         * @param rootBlockDevice root_block_device block. This parameter is required.
         */
        public Builder rootBlockDevice(final imports.aws.launch_configuration.LaunchConfigurationRootBlockDevice rootBlockDevice) {
            this.config.rootBlockDevice(rootBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#security_groups LaunchConfiguration#security_groups}.
         * <p>
         * @return {@code this}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#security_groups LaunchConfiguration#security_groups}. This parameter is required.
         */
        public Builder securityGroups(final java.util.List<java.lang.String> securityGroups) {
            this.config.securityGroups(securityGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#spot_price LaunchConfiguration#spot_price}.
         * <p>
         * @return {@code this}
         * @param spotPrice Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#spot_price LaunchConfiguration#spot_price}. This parameter is required.
         */
        public Builder spotPrice(final java.lang.String spotPrice) {
            this.config.spotPrice(spotPrice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#user_data LaunchConfiguration#user_data}.
         * <p>
         * @return {@code this}
         * @param userData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#user_data LaunchConfiguration#user_data}. This parameter is required.
         */
        public Builder userData(final java.lang.String userData) {
            this.config.userData(userData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#user_data_base64 LaunchConfiguration#user_data_base64}.
         * <p>
         * @return {@code this}
         * @param userDataBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_configuration#user_data_base64 LaunchConfiguration#user_data_base64}. This parameter is required.
         */
        public Builder userDataBase64(final java.lang.String userDataBase64) {
            this.config.userDataBase64(userDataBase64);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.launch_configuration.LaunchConfiguration}.
         */
        @Override
        public imports.aws.launch_configuration.LaunchConfiguration build() {
            return new imports.aws.launch_configuration.LaunchConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
