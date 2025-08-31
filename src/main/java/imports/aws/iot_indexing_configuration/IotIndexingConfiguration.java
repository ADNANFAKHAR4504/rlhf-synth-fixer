package imports.aws.iot_indexing_configuration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration aws_iot_indexing_configuration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.397Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotIndexingConfiguration.IotIndexingConfiguration")
public class IotIndexingConfiguration extends com.hashicorp.cdktf.TerraformResource {

    protected IotIndexingConfiguration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotIndexingConfiguration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.iot_indexing_configuration.IotIndexingConfiguration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration aws_iot_indexing_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public IotIndexingConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration aws_iot_indexing_configuration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public IotIndexingConfiguration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a IotIndexingConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the IotIndexingConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing IotIndexingConfiguration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the IotIndexingConfiguration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.iot_indexing_configuration.IotIndexingConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a IotIndexingConfiguration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the IotIndexingConfiguration to import. This parameter is required.
     * @param importFromId The id of the existing IotIndexingConfiguration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.iot_indexing_configuration.IotIndexingConfiguration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putThingGroupIndexingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putThingGroupIndexingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThingIndexingConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putThingIndexingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThingGroupIndexingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetThingGroupIndexingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThingIndexingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetThingIndexingConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationOutputReference getThingGroupIndexingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "thingGroupIndexingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationOutputReference getThingIndexingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "thingIndexingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfiguration getThingGroupIndexingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "thingGroupIndexingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfiguration getThingIndexingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "thingIndexingConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.iot_indexing_configuration.IotIndexingConfiguration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.iot_indexing_configuration.IotIndexingConfiguration> {
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
        private imports.aws.iot_indexing_configuration.IotIndexingConfigurationConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#id IotIndexingConfiguration#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#id IotIndexingConfiguration#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * thing_group_indexing_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#thing_group_indexing_configuration IotIndexingConfiguration#thing_group_indexing_configuration}
         * <p>
         * @return {@code this}
         * @param thingGroupIndexingConfiguration thing_group_indexing_configuration block. This parameter is required.
         */
        public Builder thingGroupIndexingConfiguration(final imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingGroupIndexingConfiguration thingGroupIndexingConfiguration) {
            this.config().thingGroupIndexingConfiguration(thingGroupIndexingConfiguration);
            return this;
        }

        /**
         * thing_indexing_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/iot_indexing_configuration#thing_indexing_configuration IotIndexingConfiguration#thing_indexing_configuration}
         * <p>
         * @return {@code this}
         * @param thingIndexingConfiguration thing_indexing_configuration block. This parameter is required.
         */
        public Builder thingIndexingConfiguration(final imports.aws.iot_indexing_configuration.IotIndexingConfigurationThingIndexingConfiguration thingIndexingConfiguration) {
            this.config().thingIndexingConfiguration(thingIndexingConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.iot_indexing_configuration.IotIndexingConfiguration}.
         */
        @Override
        public imports.aws.iot_indexing_configuration.IotIndexingConfiguration build() {
            return new imports.aws.iot_indexing_configuration.IotIndexingConfiguration(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.iot_indexing_configuration.IotIndexingConfigurationConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.iot_indexing_configuration.IotIndexingConfigurationConfig.Builder();
            }
            return this.config;
        }
    }
}
