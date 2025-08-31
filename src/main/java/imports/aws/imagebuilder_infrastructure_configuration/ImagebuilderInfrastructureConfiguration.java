package imports.aws.imagebuilder_infrastructure_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration aws_imagebuilder_infrastructure_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.361Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfiguration")
public class ImagebuilderInfrastructureConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected ImagebuilderInfrastructureConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderInfrastructureConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration aws_imagebuilder_infrastructure_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ImagebuilderInfrastructureConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ImagebuilderInfrastructureConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ImagebuilderInfrastructureConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing ImagebuilderInfrastructureConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ImagebuilderInfrastructureConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ImagebuilderInfrastructureConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ImagebuilderInfrastructureConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing ImagebuilderInfrastructureConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putInstanceMetadataOptions(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptions value) {
        software.amazon.jsii.Kernel.call(this, "putInstanceMetadataOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogging(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLogging value) {
        software.amazon.jsii.Kernel.call(this, "putLogging", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPlacement(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacement value) {
        software.amazon.jsii.Kernel.call(this, "putPlacement", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceMetadataOptions() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceMetadataOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyPair() {
        software.amazon.jsii.Kernel.call(this, "resetKeyPair", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogging() {
        software.amazon.jsii.Kernel.call(this, "resetLogging", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlacement() {
        software.amazon.jsii.Kernel.call(this, "resetPlacement", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourceTags() {
        software.amazon.jsii.Kernel.call(this, "resetResourceTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnsTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetSnsTopicArn", software.amazon.jsii.NativeType.VOID);
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

    public void resetTerminateInstanceOnFailure() {
        software.amazon.jsii.Kernel.call(this, "resetTerminateInstanceOnFailure", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDateCreated() {
        return software.amazon.jsii.Kernel.get(this, "dateCreated", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDateUpdated() {
        return software.amazon.jsii.Kernel.get(this, "dateUpdated", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptionsOutputReference getInstanceMetadataOptions() {
        return software.amazon.jsii.Kernel.get(this, "instanceMetadataOptions", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingOutputReference getLogging() {
        return software.amazon.jsii.Kernel.get(this, "logging", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacementOutputReference getPlacement() {
        return software.amazon.jsii.Kernel.get(this, "placement", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacementOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptions getInstanceMetadataOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceMetadataOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceProfileNameInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceProfileNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "instanceTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyPairInput() {
        return software.amazon.jsii.Kernel.get(this, "keyPairInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLogging getLoggingInput() {
        return software.amazon.jsii.Kernel.get(this, "loggingInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLogging.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacement getPlacementInput() {
        return software.amazon.jsii.Kernel.get(this, "placementInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacement.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResourceTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "resourceTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnsTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "snsTopicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Object getTerminateInstanceOnFailureInput() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstanceOnFailureInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceProfileName() {
        return software.amazon.jsii.Kernel.get(this, "instanceProfileName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceProfileName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceProfileName", java.util.Objects.requireNonNull(value, "instanceProfileName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getInstanceTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "instanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setInstanceTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "instanceTypes", java.util.Objects.requireNonNull(value, "instanceTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyPair() {
        return software.amazon.jsii.Kernel.get(this, "keyPair", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyPair(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyPair", java.util.Objects.requireNonNull(value, "keyPair is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getResourceTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "resourceTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResourceTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "resourceTags", java.util.Objects.requireNonNull(value, "resourceTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnsTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "snsTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnsTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snsTopicArn", java.util.Objects.requireNonNull(value, "snsTopicArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getTerminateInstanceOnFailure() {
        return software.amazon.jsii.Kernel.get(this, "terminateInstanceOnFailure", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTerminateInstanceOnFailure(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "terminateInstanceOnFailure", java.util.Objects.requireNonNull(value, "terminateInstanceOnFailure is required"));
    }

    public void setTerminateInstanceOnFailure(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "terminateInstanceOnFailure", java.util.Objects.requireNonNull(value, "terminateInstanceOnFailure is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfiguration> {
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
        private final imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#instance_profile_name ImagebuilderInfrastructureConfiguration#instance_profile_name}.
         * <p>
         * @return {@code this}
         * @param instanceProfileName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#instance_profile_name ImagebuilderInfrastructureConfiguration#instance_profile_name}. This parameter is required.
         */
        public Builder instanceProfileName(final java.lang.String instanceProfileName) {
            this.config.instanceProfileName(instanceProfileName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#name ImagebuilderInfrastructureConfiguration#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#name ImagebuilderInfrastructureConfiguration#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#description ImagebuilderInfrastructureConfiguration#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#description ImagebuilderInfrastructureConfiguration#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#id ImagebuilderInfrastructureConfiguration#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#id ImagebuilderInfrastructureConfiguration#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * instance_metadata_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#instance_metadata_options ImagebuilderInfrastructureConfiguration#instance_metadata_options}
         * <p>
         * @return {@code this}
         * @param instanceMetadataOptions instance_metadata_options block. This parameter is required.
         */
        public Builder instanceMetadataOptions(final imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationInstanceMetadataOptions instanceMetadataOptions) {
            this.config.instanceMetadataOptions(instanceMetadataOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#instance_types ImagebuilderInfrastructureConfiguration#instance_types}.
         * <p>
         * @return {@code this}
         * @param instanceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#instance_types ImagebuilderInfrastructureConfiguration#instance_types}. This parameter is required.
         */
        public Builder instanceTypes(final java.util.List<java.lang.String> instanceTypes) {
            this.config.instanceTypes(instanceTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#key_pair ImagebuilderInfrastructureConfiguration#key_pair}.
         * <p>
         * @return {@code this}
         * @param keyPair Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#key_pair ImagebuilderInfrastructureConfiguration#key_pair}. This parameter is required.
         */
        public Builder keyPair(final java.lang.String keyPair) {
            this.config.keyPair(keyPair);
            return this;
        }

        /**
         * logging block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#logging ImagebuilderInfrastructureConfiguration#logging}
         * <p>
         * @return {@code this}
         * @param logging logging block. This parameter is required.
         */
        public Builder logging(final imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLogging logging) {
            this.config.logging(logging);
            return this;
        }

        /**
         * placement block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#placement ImagebuilderInfrastructureConfiguration#placement}
         * <p>
         * @return {@code this}
         * @param placement placement block. This parameter is required.
         */
        public Builder placement(final imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationPlacement placement) {
            this.config.placement(placement);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#resource_tags ImagebuilderInfrastructureConfiguration#resource_tags}.
         * <p>
         * @return {@code this}
         * @param resourceTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#resource_tags ImagebuilderInfrastructureConfiguration#resource_tags}. This parameter is required.
         */
        public Builder resourceTags(final java.util.Map<java.lang.String, java.lang.String> resourceTags) {
            this.config.resourceTags(resourceTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#security_group_ids ImagebuilderInfrastructureConfiguration#security_group_ids}.
         * <p>
         * @return {@code this}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#security_group_ids ImagebuilderInfrastructureConfiguration#security_group_ids}. This parameter is required.
         */
        public Builder securityGroupIds(final java.util.List<java.lang.String> securityGroupIds) {
            this.config.securityGroupIds(securityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#sns_topic_arn ImagebuilderInfrastructureConfiguration#sns_topic_arn}.
         * <p>
         * @return {@code this}
         * @param snsTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#sns_topic_arn ImagebuilderInfrastructureConfiguration#sns_topic_arn}. This parameter is required.
         */
        public Builder snsTopicArn(final java.lang.String snsTopicArn) {
            this.config.snsTopicArn(snsTopicArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#subnet_id ImagebuilderInfrastructureConfiguration#subnet_id}.
         * <p>
         * @return {@code this}
         * @param subnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#subnet_id ImagebuilderInfrastructureConfiguration#subnet_id}. This parameter is required.
         */
        public Builder subnetId(final java.lang.String subnetId) {
            this.config.subnetId(subnetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#tags ImagebuilderInfrastructureConfiguration#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#tags ImagebuilderInfrastructureConfiguration#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#tags_all ImagebuilderInfrastructureConfiguration#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#tags_all ImagebuilderInfrastructureConfiguration#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#terminate_instance_on_failure ImagebuilderInfrastructureConfiguration#terminate_instance_on_failure}.
         * <p>
         * @return {@code this}
         * @param terminateInstanceOnFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#terminate_instance_on_failure ImagebuilderInfrastructureConfiguration#terminate_instance_on_failure}. This parameter is required.
         */
        public Builder terminateInstanceOnFailure(final java.lang.Boolean terminateInstanceOnFailure) {
            this.config.terminateInstanceOnFailure(terminateInstanceOnFailure);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#terminate_instance_on_failure ImagebuilderInfrastructureConfiguration#terminate_instance_on_failure}.
         * <p>
         * @return {@code this}
         * @param terminateInstanceOnFailure Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/imagebuilder_infrastructure_configuration#terminate_instance_on_failure ImagebuilderInfrastructureConfiguration#terminate_instance_on_failure}. This parameter is required.
         */
        public Builder terminateInstanceOnFailure(final com.hashicorp.cdktf.IResolvable terminateInstanceOnFailure) {
            this.config.terminateInstanceOnFailure(terminateInstanceOnFailure);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfiguration}.
         */
        @Override
        public imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfiguration build() {
            return new imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfiguration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
