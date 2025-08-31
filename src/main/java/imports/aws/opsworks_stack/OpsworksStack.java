package imports.aws.opsworks_stack;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack aws_opsworks_stack}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.039Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksStack.OpsworksStack")
public class OpsworksStack extends com.hashicorp.cdktf.TerraformResource {

    protected OpsworksStack(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksStack(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.opsworks_stack.OpsworksStack.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack aws_opsworks_stack} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public OpsworksStack(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.opsworks_stack.OpsworksStackConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a OpsworksStack resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpsworksStack to import. This parameter is required.
     * @param importFromId The id of the existing OpsworksStack that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the OpsworksStack to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opsworks_stack.OpsworksStack.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a OpsworksStack resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpsworksStack to import. This parameter is required.
     * @param importFromId The id of the existing OpsworksStack that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opsworks_stack.OpsworksStack.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCustomCookbooksSource(final @org.jetbrains.annotations.NotNull imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource value) {
        software.amazon.jsii.Kernel.call(this, "putCustomCookbooksSource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.opsworks_stack.OpsworksStackTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAgentVersion() {
        software.amazon.jsii.Kernel.call(this, "resetAgentVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBerkshelfVersion() {
        software.amazon.jsii.Kernel.call(this, "resetBerkshelfVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColor() {
        software.amazon.jsii.Kernel.call(this, "resetColor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfigurationManagerName() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurationManagerName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfigurationManagerVersion() {
        software.amazon.jsii.Kernel.call(this, "resetConfigurationManagerVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomCookbooksSource() {
        software.amazon.jsii.Kernel.call(this, "resetCustomCookbooksSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomJson() {
        software.amazon.jsii.Kernel.call(this, "resetCustomJson", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultAvailabilityZone() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultAvailabilityZone", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultOs() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultOs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultRootDeviceType() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultRootDeviceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultSshKeyName() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultSshKeyName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultSubnetId() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultSubnetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHostnameTheme() {
        software.amazon.jsii.Kernel.call(this, "resetHostnameTheme", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManageBerkshelf() {
        software.amazon.jsii.Kernel.call(this, "resetManageBerkshelf", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseCustomCookbooks() {
        software.amazon.jsii.Kernel.call(this, "resetUseCustomCookbooks", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseOpsworksSecurityGroups() {
        software.amazon.jsii.Kernel.call(this, "resetUseOpsworksSecurityGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcId() {
        software.amazon.jsii.Kernel.call(this, "resetVpcId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSourceOutputReference getCustomCookbooksSource() {
        return software.amazon.jsii.Kernel.get(this, "customCookbooksSource", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSourceOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "stackEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_stack.OpsworksStackTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_stack.OpsworksStackTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAgentVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "agentVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBerkshelfVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "berkshelfVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getColorInput() {
        return software.amazon.jsii.Kernel.get(this, "colorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationManagerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationManagerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationManagerVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationManagerVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource getCustomCookbooksSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "customCookbooksSourceInput", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomJsonInput() {
        return software.amazon.jsii.Kernel.get(this, "customJsonInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultAvailabilityZoneInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultAvailabilityZoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultInstanceProfileArnInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultInstanceProfileArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultOsInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultOsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultRootDeviceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultRootDeviceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultSshKeyNameInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultSshKeyNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultSubnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostnameThemeInput() {
        return software.amazon.jsii.Kernel.get(this, "hostnameThemeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getManageBerkshelfInput() {
        return software.amazon.jsii.Kernel.get(this, "manageBerkshelfInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "regionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseCustomCookbooksInput() {
        return software.amazon.jsii.Kernel.get(this, "useCustomCookbooksInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseOpsworksSecurityGroupsInput() {
        return software.amazon.jsii.Kernel.get(this, "useOpsworksSecurityGroupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAgentVersion() {
        return software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAgentVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "agentVersion", java.util.Objects.requireNonNull(value, "agentVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBerkshelfVersion() {
        return software.amazon.jsii.Kernel.get(this, "berkshelfVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBerkshelfVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "berkshelfVersion", java.util.Objects.requireNonNull(value, "berkshelfVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getColor() {
        return software.amazon.jsii.Kernel.get(this, "color", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setColor(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "color", java.util.Objects.requireNonNull(value, "color is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationManagerName() {
        return software.amazon.jsii.Kernel.get(this, "configurationManagerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationManagerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationManagerName", java.util.Objects.requireNonNull(value, "configurationManagerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationManagerVersion() {
        return software.amazon.jsii.Kernel.get(this, "configurationManagerVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationManagerVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationManagerVersion", java.util.Objects.requireNonNull(value, "configurationManagerVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomJson() {
        return software.amazon.jsii.Kernel.get(this, "customJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomJson(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customJson", java.util.Objects.requireNonNull(value, "customJson is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultAvailabilityZone() {
        return software.amazon.jsii.Kernel.get(this, "defaultAvailabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultAvailabilityZone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultAvailabilityZone", java.util.Objects.requireNonNull(value, "defaultAvailabilityZone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultInstanceProfileArn() {
        return software.amazon.jsii.Kernel.get(this, "defaultInstanceProfileArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultInstanceProfileArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultInstanceProfileArn", java.util.Objects.requireNonNull(value, "defaultInstanceProfileArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultOs() {
        return software.amazon.jsii.Kernel.get(this, "defaultOs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultOs(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultOs", java.util.Objects.requireNonNull(value, "defaultOs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultRootDeviceType() {
        return software.amazon.jsii.Kernel.get(this, "defaultRootDeviceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultRootDeviceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultRootDeviceType", java.util.Objects.requireNonNull(value, "defaultRootDeviceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultSshKeyName() {
        return software.amazon.jsii.Kernel.get(this, "defaultSshKeyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultSshKeyName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultSshKeyName", java.util.Objects.requireNonNull(value, "defaultSshKeyName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "defaultSubnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultSubnetId", java.util.Objects.requireNonNull(value, "defaultSubnetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostnameTheme() {
        return software.amazon.jsii.Kernel.get(this, "hostnameTheme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostnameTheme(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostnameTheme", java.util.Objects.requireNonNull(value, "hostnameTheme is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getManageBerkshelf() {
        return software.amazon.jsii.Kernel.get(this, "manageBerkshelf", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setManageBerkshelf(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "manageBerkshelf", java.util.Objects.requireNonNull(value, "manageBerkshelf is required"));
    }

    public void setManageBerkshelf(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "manageBerkshelf", java.util.Objects.requireNonNull(value, "manageBerkshelf is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegion() {
        return software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "region", java.util.Objects.requireNonNull(value, "region is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRoleArn", java.util.Objects.requireNonNull(value, "serviceRoleArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseCustomCookbooks() {
        return software.amazon.jsii.Kernel.get(this, "useCustomCookbooks", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseCustomCookbooks(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useCustomCookbooks", java.util.Objects.requireNonNull(value, "useCustomCookbooks is required"));
    }

    public void setUseCustomCookbooks(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useCustomCookbooks", java.util.Objects.requireNonNull(value, "useCustomCookbooks is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseOpsworksSecurityGroups() {
        return software.amazon.jsii.Kernel.get(this, "useOpsworksSecurityGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseOpsworksSecurityGroups(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useOpsworksSecurityGroups", java.util.Objects.requireNonNull(value, "useOpsworksSecurityGroups is required"));
    }

    public void setUseOpsworksSecurityGroups(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useOpsworksSecurityGroups", java.util.Objects.requireNonNull(value, "useOpsworksSecurityGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcId", java.util.Objects.requireNonNull(value, "vpcId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.opsworks_stack.OpsworksStack}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.opsworks_stack.OpsworksStack> {
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
        private final imports.aws.opsworks_stack.OpsworksStackConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.opsworks_stack.OpsworksStackConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_instance_profile_arn OpsworksStack#default_instance_profile_arn}.
         * <p>
         * @return {@code this}
         * @param defaultInstanceProfileArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_instance_profile_arn OpsworksStack#default_instance_profile_arn}. This parameter is required.
         */
        public Builder defaultInstanceProfileArn(final java.lang.String defaultInstanceProfileArn) {
            this.config.defaultInstanceProfileArn(defaultInstanceProfileArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#name OpsworksStack#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#name OpsworksStack#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#region OpsworksStack#region}.
         * <p>
         * @return {@code this}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#region OpsworksStack#region}. This parameter is required.
         */
        public Builder region(final java.lang.String region) {
            this.config.region(region);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#service_role_arn OpsworksStack#service_role_arn}.
         * <p>
         * @return {@code this}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#service_role_arn OpsworksStack#service_role_arn}. This parameter is required.
         */
        public Builder serviceRoleArn(final java.lang.String serviceRoleArn) {
            this.config.serviceRoleArn(serviceRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#agent_version OpsworksStack#agent_version}.
         * <p>
         * @return {@code this}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#agent_version OpsworksStack#agent_version}. This parameter is required.
         */
        public Builder agentVersion(final java.lang.String agentVersion) {
            this.config.agentVersion(agentVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#berkshelf_version OpsworksStack#berkshelf_version}.
         * <p>
         * @return {@code this}
         * @param berkshelfVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#berkshelf_version OpsworksStack#berkshelf_version}. This parameter is required.
         */
        public Builder berkshelfVersion(final java.lang.String berkshelfVersion) {
            this.config.berkshelfVersion(berkshelfVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#color OpsworksStack#color}.
         * <p>
         * @return {@code this}
         * @param color Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#color OpsworksStack#color}. This parameter is required.
         */
        public Builder color(final java.lang.String color) {
            this.config.color(color);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#configuration_manager_name OpsworksStack#configuration_manager_name}.
         * <p>
         * @return {@code this}
         * @param configurationManagerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#configuration_manager_name OpsworksStack#configuration_manager_name}. This parameter is required.
         */
        public Builder configurationManagerName(final java.lang.String configurationManagerName) {
            this.config.configurationManagerName(configurationManagerName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#configuration_manager_version OpsworksStack#configuration_manager_version}.
         * <p>
         * @return {@code this}
         * @param configurationManagerVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#configuration_manager_version OpsworksStack#configuration_manager_version}. This parameter is required.
         */
        public Builder configurationManagerVersion(final java.lang.String configurationManagerVersion) {
            this.config.configurationManagerVersion(configurationManagerVersion);
            return this;
        }

        /**
         * custom_cookbooks_source block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#custom_cookbooks_source OpsworksStack#custom_cookbooks_source}
         * <p>
         * @return {@code this}
         * @param customCookbooksSource custom_cookbooks_source block. This parameter is required.
         */
        public Builder customCookbooksSource(final imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource customCookbooksSource) {
            this.config.customCookbooksSource(customCookbooksSource);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#custom_json OpsworksStack#custom_json}.
         * <p>
         * @return {@code this}
         * @param customJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#custom_json OpsworksStack#custom_json}. This parameter is required.
         */
        public Builder customJson(final java.lang.String customJson) {
            this.config.customJson(customJson);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_availability_zone OpsworksStack#default_availability_zone}.
         * <p>
         * @return {@code this}
         * @param defaultAvailabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_availability_zone OpsworksStack#default_availability_zone}. This parameter is required.
         */
        public Builder defaultAvailabilityZone(final java.lang.String defaultAvailabilityZone) {
            this.config.defaultAvailabilityZone(defaultAvailabilityZone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_os OpsworksStack#default_os}.
         * <p>
         * @return {@code this}
         * @param defaultOs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_os OpsworksStack#default_os}. This parameter is required.
         */
        public Builder defaultOs(final java.lang.String defaultOs) {
            this.config.defaultOs(defaultOs);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_root_device_type OpsworksStack#default_root_device_type}.
         * <p>
         * @return {@code this}
         * @param defaultRootDeviceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_root_device_type OpsworksStack#default_root_device_type}. This parameter is required.
         */
        public Builder defaultRootDeviceType(final java.lang.String defaultRootDeviceType) {
            this.config.defaultRootDeviceType(defaultRootDeviceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_ssh_key_name OpsworksStack#default_ssh_key_name}.
         * <p>
         * @return {@code this}
         * @param defaultSshKeyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_ssh_key_name OpsworksStack#default_ssh_key_name}. This parameter is required.
         */
        public Builder defaultSshKeyName(final java.lang.String defaultSshKeyName) {
            this.config.defaultSshKeyName(defaultSshKeyName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_subnet_id OpsworksStack#default_subnet_id}.
         * <p>
         * @return {@code this}
         * @param defaultSubnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_subnet_id OpsworksStack#default_subnet_id}. This parameter is required.
         */
        public Builder defaultSubnetId(final java.lang.String defaultSubnetId) {
            this.config.defaultSubnetId(defaultSubnetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#hostname_theme OpsworksStack#hostname_theme}.
         * <p>
         * @return {@code this}
         * @param hostnameTheme Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#hostname_theme OpsworksStack#hostname_theme}. This parameter is required.
         */
        public Builder hostnameTheme(final java.lang.String hostnameTheme) {
            this.config.hostnameTheme(hostnameTheme);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#id OpsworksStack#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#id OpsworksStack#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#manage_berkshelf OpsworksStack#manage_berkshelf}.
         * <p>
         * @return {@code this}
         * @param manageBerkshelf Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#manage_berkshelf OpsworksStack#manage_berkshelf}. This parameter is required.
         */
        public Builder manageBerkshelf(final java.lang.Boolean manageBerkshelf) {
            this.config.manageBerkshelf(manageBerkshelf);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#manage_berkshelf OpsworksStack#manage_berkshelf}.
         * <p>
         * @return {@code this}
         * @param manageBerkshelf Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#manage_berkshelf OpsworksStack#manage_berkshelf}. This parameter is required.
         */
        public Builder manageBerkshelf(final com.hashicorp.cdktf.IResolvable manageBerkshelf) {
            this.config.manageBerkshelf(manageBerkshelf);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#tags OpsworksStack#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#tags OpsworksStack#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#tags_all OpsworksStack#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#tags_all OpsworksStack#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#timeouts OpsworksStack#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.opsworks_stack.OpsworksStackTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_custom_cookbooks OpsworksStack#use_custom_cookbooks}.
         * <p>
         * @return {@code this}
         * @param useCustomCookbooks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_custom_cookbooks OpsworksStack#use_custom_cookbooks}. This parameter is required.
         */
        public Builder useCustomCookbooks(final java.lang.Boolean useCustomCookbooks) {
            this.config.useCustomCookbooks(useCustomCookbooks);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_custom_cookbooks OpsworksStack#use_custom_cookbooks}.
         * <p>
         * @return {@code this}
         * @param useCustomCookbooks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_custom_cookbooks OpsworksStack#use_custom_cookbooks}. This parameter is required.
         */
        public Builder useCustomCookbooks(final com.hashicorp.cdktf.IResolvable useCustomCookbooks) {
            this.config.useCustomCookbooks(useCustomCookbooks);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_opsworks_security_groups OpsworksStack#use_opsworks_security_groups}.
         * <p>
         * @return {@code this}
         * @param useOpsworksSecurityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_opsworks_security_groups OpsworksStack#use_opsworks_security_groups}. This parameter is required.
         */
        public Builder useOpsworksSecurityGroups(final java.lang.Boolean useOpsworksSecurityGroups) {
            this.config.useOpsworksSecurityGroups(useOpsworksSecurityGroups);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_opsworks_security_groups OpsworksStack#use_opsworks_security_groups}.
         * <p>
         * @return {@code this}
         * @param useOpsworksSecurityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_opsworks_security_groups OpsworksStack#use_opsworks_security_groups}. This parameter is required.
         */
        public Builder useOpsworksSecurityGroups(final com.hashicorp.cdktf.IResolvable useOpsworksSecurityGroups) {
            this.config.useOpsworksSecurityGroups(useOpsworksSecurityGroups);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#vpc_id OpsworksStack#vpc_id}.
         * <p>
         * @return {@code this}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#vpc_id OpsworksStack#vpc_id}. This parameter is required.
         */
        public Builder vpcId(final java.lang.String vpcId) {
            this.config.vpcId(vpcId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.opsworks_stack.OpsworksStack}.
         */
        @Override
        public imports.aws.opsworks_stack.OpsworksStack build() {
            return new imports.aws.opsworks_stack.OpsworksStack(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
