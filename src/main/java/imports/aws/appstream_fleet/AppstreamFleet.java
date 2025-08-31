package imports.aws.appstream_fleet;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet aws_appstream_fleet}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.059Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamFleet.AppstreamFleet")
public class AppstreamFleet extends com.hashicorp.cdktf.TerraformResource {

    protected AppstreamFleet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppstreamFleet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.appstream_fleet.AppstreamFleet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet aws_appstream_fleet} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AppstreamFleet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.appstream_fleet.AppstreamFleetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AppstreamFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppstreamFleet to import. This parameter is required.
     * @param importFromId The id of the existing AppstreamFleet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AppstreamFleet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appstream_fleet.AppstreamFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AppstreamFleet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppstreamFleet to import. This parameter is required.
     * @param importFromId The id of the existing AppstreamFleet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appstream_fleet.AppstreamFleet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putComputeCapacity(final @org.jetbrains.annotations.NotNull imports.aws.appstream_fleet.AppstreamFleetComputeCapacity value) {
        software.amazon.jsii.Kernel.call(this, "putComputeCapacity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDomainJoinInfo(final @org.jetbrains.annotations.NotNull imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo value) {
        software.amazon.jsii.Kernel.call(this, "putDomainJoinInfo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpcConfig(final @org.jetbrains.annotations.NotNull imports.aws.appstream_fleet.AppstreamFleetVpcConfig value) {
        software.amazon.jsii.Kernel.call(this, "putVpcConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisconnectTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetDisconnectTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisplayName() {
        software.amazon.jsii.Kernel.call(this, "resetDisplayName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomainJoinInfo() {
        software.amazon.jsii.Kernel.call(this, "resetDomainJoinInfo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableDefaultInternetAccess() {
        software.amazon.jsii.Kernel.call(this, "resetEnableDefaultInternetAccess", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFleetType() {
        software.amazon.jsii.Kernel.call(this, "resetFleetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIamRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetIamRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIdleDisconnectTimeoutInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetIdleDisconnectTimeoutInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageArn() {
        software.amazon.jsii.Kernel.call(this, "resetImageArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageName() {
        software.amazon.jsii.Kernel.call(this, "resetImageName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxSessionsPerInstance() {
        software.amazon.jsii.Kernel.call(this, "resetMaxSessionsPerInstance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxUserDurationInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMaxUserDurationInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStreamView() {
        software.amazon.jsii.Kernel.call(this, "resetStreamView", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConfig() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.appstream_fleet.AppstreamFleetComputeCapacityOutputReference getComputeCapacity() {
        return software.amazon.jsii.Kernel.get(this, "computeCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetComputeCapacityOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedTime() {
        return software.amazon.jsii.Kernel.get(this, "createdTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfoOutputReference getDomainJoinInfo() {
        return software.amazon.jsii.Kernel.get(this, "domainJoinInfo", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getState() {
        return software.amazon.jsii.Kernel.get(this, "state", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appstream_fleet.AppstreamFleetVpcConfigOutputReference getVpcConfig() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetVpcConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appstream_fleet.AppstreamFleetComputeCapacity getComputeCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "computeCapacityInput", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetComputeCapacity.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDisconnectTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "disconnectTimeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDisplayNameInput() {
        return software.amazon.jsii.Kernel.get(this, "displayNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo getDomainJoinInfoInput() {
        return software.amazon.jsii.Kernel.get(this, "domainJoinInfoInput", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableDefaultInternetAccessInput() {
        return software.amazon.jsii.Kernel.get(this, "enableDefaultInternetAccessInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFleetTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "fleetTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIamRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleDisconnectTimeoutInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "idleDisconnectTimeoutInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageArnInput() {
        return software.amazon.jsii.Kernel.get(this, "imageArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageNameInput() {
        return software.amazon.jsii.Kernel.get(this, "imageNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxSessionsPerInstanceInput() {
        return software.amazon.jsii.Kernel.get(this, "maxSessionsPerInstanceInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxUserDurationInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maxUserDurationInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreamViewInput() {
        return software.amazon.jsii.Kernel.get(this, "streamViewInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appstream_fleet.AppstreamFleetVpcConfig getVpcConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appstream_fleet.AppstreamFleetVpcConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDisconnectTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "disconnectTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDisconnectTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "disconnectTimeoutInSeconds", java.util.Objects.requireNonNull(value, "disconnectTimeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDisplayName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "displayName", java.util.Objects.requireNonNull(value, "displayName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableDefaultInternetAccess() {
        return software.amazon.jsii.Kernel.get(this, "enableDefaultInternetAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableDefaultInternetAccess(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableDefaultInternetAccess", java.util.Objects.requireNonNull(value, "enableDefaultInternetAccess is required"));
    }

    public void setEnableDefaultInternetAccess(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableDefaultInternetAccess", java.util.Objects.requireNonNull(value, "enableDefaultInternetAccess is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFleetType() {
        return software.amazon.jsii.Kernel.get(this, "fleetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFleetType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fleetType", java.util.Objects.requireNonNull(value, "fleetType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIamRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "iamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIamRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iamRoleArn", java.util.Objects.requireNonNull(value, "iamRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdleDisconnectTimeoutInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "idleDisconnectTimeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdleDisconnectTimeoutInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idleDisconnectTimeoutInSeconds", java.util.Objects.requireNonNull(value, "idleDisconnectTimeoutInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageArn() {
        return software.amazon.jsii.Kernel.get(this, "imageArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageArn", java.util.Objects.requireNonNull(value, "imageArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageName() {
        return software.amazon.jsii.Kernel.get(this, "imageName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageName", java.util.Objects.requireNonNull(value, "imageName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "instanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceType", java.util.Objects.requireNonNull(value, "instanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxSessionsPerInstance() {
        return software.amazon.jsii.Kernel.get(this, "maxSessionsPerInstance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxSessionsPerInstance(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxSessionsPerInstance", java.util.Objects.requireNonNull(value, "maxSessionsPerInstance is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxUserDurationInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "maxUserDurationInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxUserDurationInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxUserDurationInSeconds", java.util.Objects.requireNonNull(value, "maxUserDurationInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamView() {
        return software.amazon.jsii.Kernel.get(this, "streamView", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreamView(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streamView", java.util.Objects.requireNonNull(value, "streamView is required"));
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

    /**
     * A fluent builder for {@link imports.aws.appstream_fleet.AppstreamFleet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.appstream_fleet.AppstreamFleet> {
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
        private final imports.aws.appstream_fleet.AppstreamFleetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.appstream_fleet.AppstreamFleetConfig.Builder();
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
         * compute_capacity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#compute_capacity AppstreamFleet#compute_capacity}
         * <p>
         * @return {@code this}
         * @param computeCapacity compute_capacity block. This parameter is required.
         */
        public Builder computeCapacity(final imports.aws.appstream_fleet.AppstreamFleetComputeCapacity computeCapacity) {
            this.config.computeCapacity(computeCapacity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#instance_type AppstreamFleet#instance_type}.
         * <p>
         * @return {@code this}
         * @param instanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#instance_type AppstreamFleet#instance_type}. This parameter is required.
         */
        public Builder instanceType(final java.lang.String instanceType) {
            this.config.instanceType(instanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#name AppstreamFleet#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#name AppstreamFleet#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#description AppstreamFleet#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#description AppstreamFleet#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#disconnect_timeout_in_seconds AppstreamFleet#disconnect_timeout_in_seconds}.
         * <p>
         * @return {@code this}
         * @param disconnectTimeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#disconnect_timeout_in_seconds AppstreamFleet#disconnect_timeout_in_seconds}. This parameter is required.
         */
        public Builder disconnectTimeoutInSeconds(final java.lang.Number disconnectTimeoutInSeconds) {
            this.config.disconnectTimeoutInSeconds(disconnectTimeoutInSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#display_name AppstreamFleet#display_name}.
         * <p>
         * @return {@code this}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#display_name AppstreamFleet#display_name}. This parameter is required.
         */
        public Builder displayName(final java.lang.String displayName) {
            this.config.displayName(displayName);
            return this;
        }

        /**
         * domain_join_info block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#domain_join_info AppstreamFleet#domain_join_info}
         * <p>
         * @return {@code this}
         * @param domainJoinInfo domain_join_info block. This parameter is required.
         */
        public Builder domainJoinInfo(final imports.aws.appstream_fleet.AppstreamFleetDomainJoinInfo domainJoinInfo) {
            this.config.domainJoinInfo(domainJoinInfo);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#enable_default_internet_access AppstreamFleet#enable_default_internet_access}.
         * <p>
         * @return {@code this}
         * @param enableDefaultInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#enable_default_internet_access AppstreamFleet#enable_default_internet_access}. This parameter is required.
         */
        public Builder enableDefaultInternetAccess(final java.lang.Boolean enableDefaultInternetAccess) {
            this.config.enableDefaultInternetAccess(enableDefaultInternetAccess);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#enable_default_internet_access AppstreamFleet#enable_default_internet_access}.
         * <p>
         * @return {@code this}
         * @param enableDefaultInternetAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#enable_default_internet_access AppstreamFleet#enable_default_internet_access}. This parameter is required.
         */
        public Builder enableDefaultInternetAccess(final com.hashicorp.cdktf.IResolvable enableDefaultInternetAccess) {
            this.config.enableDefaultInternetAccess(enableDefaultInternetAccess);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#fleet_type AppstreamFleet#fleet_type}.
         * <p>
         * @return {@code this}
         * @param fleetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#fleet_type AppstreamFleet#fleet_type}. This parameter is required.
         */
        public Builder fleetType(final java.lang.String fleetType) {
            this.config.fleetType(fleetType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#iam_role_arn AppstreamFleet#iam_role_arn}.
         * <p>
         * @return {@code this}
         * @param iamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#iam_role_arn AppstreamFleet#iam_role_arn}. This parameter is required.
         */
        public Builder iamRoleArn(final java.lang.String iamRoleArn) {
            this.config.iamRoleArn(iamRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#id AppstreamFleet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#id AppstreamFleet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#idle_disconnect_timeout_in_seconds AppstreamFleet#idle_disconnect_timeout_in_seconds}.
         * <p>
         * @return {@code this}
         * @param idleDisconnectTimeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#idle_disconnect_timeout_in_seconds AppstreamFleet#idle_disconnect_timeout_in_seconds}. This parameter is required.
         */
        public Builder idleDisconnectTimeoutInSeconds(final java.lang.Number idleDisconnectTimeoutInSeconds) {
            this.config.idleDisconnectTimeoutInSeconds(idleDisconnectTimeoutInSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#image_arn AppstreamFleet#image_arn}.
         * <p>
         * @return {@code this}
         * @param imageArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#image_arn AppstreamFleet#image_arn}. This parameter is required.
         */
        public Builder imageArn(final java.lang.String imageArn) {
            this.config.imageArn(imageArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#image_name AppstreamFleet#image_name}.
         * <p>
         * @return {@code this}
         * @param imageName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#image_name AppstreamFleet#image_name}. This parameter is required.
         */
        public Builder imageName(final java.lang.String imageName) {
            this.config.imageName(imageName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#max_sessions_per_instance AppstreamFleet#max_sessions_per_instance}.
         * <p>
         * @return {@code this}
         * @param maxSessionsPerInstance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#max_sessions_per_instance AppstreamFleet#max_sessions_per_instance}. This parameter is required.
         */
        public Builder maxSessionsPerInstance(final java.lang.Number maxSessionsPerInstance) {
            this.config.maxSessionsPerInstance(maxSessionsPerInstance);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#max_user_duration_in_seconds AppstreamFleet#max_user_duration_in_seconds}.
         * <p>
         * @return {@code this}
         * @param maxUserDurationInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#max_user_duration_in_seconds AppstreamFleet#max_user_duration_in_seconds}. This parameter is required.
         */
        public Builder maxUserDurationInSeconds(final java.lang.Number maxUserDurationInSeconds) {
            this.config.maxUserDurationInSeconds(maxUserDurationInSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#stream_view AppstreamFleet#stream_view}.
         * <p>
         * @return {@code this}
         * @param streamView Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#stream_view AppstreamFleet#stream_view}. This parameter is required.
         */
        public Builder streamView(final java.lang.String streamView) {
            this.config.streamView(streamView);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#tags AppstreamFleet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#tags AppstreamFleet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#tags_all AppstreamFleet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#tags_all AppstreamFleet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * vpc_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_fleet#vpc_config AppstreamFleet#vpc_config}
         * <p>
         * @return {@code this}
         * @param vpcConfig vpc_config block. This parameter is required.
         */
        public Builder vpcConfig(final imports.aws.appstream_fleet.AppstreamFleetVpcConfig vpcConfig) {
            this.config.vpcConfig(vpcConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.appstream_fleet.AppstreamFleet}.
         */
        @Override
        public imports.aws.appstream_fleet.AppstreamFleet build() {
            return new imports.aws.appstream_fleet.AppstreamFleet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
