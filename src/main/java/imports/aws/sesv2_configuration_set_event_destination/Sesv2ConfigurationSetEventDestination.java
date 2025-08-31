package imports.aws.sesv2_configuration_set_event_destination;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination aws_sesv2_configuration_set_event_destination}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestination")
public class Sesv2ConfigurationSetEventDestination extends com.hashicorp.cdktf.TerraformResource {

    protected Sesv2ConfigurationSetEventDestination(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Sesv2ConfigurationSetEventDestination(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestination.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination aws_sesv2_configuration_set_event_destination} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Sesv2ConfigurationSetEventDestination(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Sesv2ConfigurationSetEventDestination resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Sesv2ConfigurationSetEventDestination to import. This parameter is required.
     * @param importFromId The id of the existing Sesv2ConfigurationSetEventDestination that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Sesv2ConfigurationSetEventDestination to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestination.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Sesv2ConfigurationSetEventDestination resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Sesv2ConfigurationSetEventDestination to import. This parameter is required.
     * @param importFromId The id of the existing Sesv2ConfigurationSetEventDestination that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestination.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEventDestination(final @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestination value) {
        software.amazon.jsii.Kernel.call(this, "putEventDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationOutputReference getEventDestination() {
        return software.amazon.jsii.Kernel.get(this, "eventDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationSetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationSetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestination getEventDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "eventDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventDestinationNameInput() {
        return software.amazon.jsii.Kernel.get(this, "eventDestinationNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationSetName() {
        return software.amazon.jsii.Kernel.get(this, "configurationSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationSetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationSetName", java.util.Objects.requireNonNull(value, "configurationSetName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventDestinationName() {
        return software.amazon.jsii.Kernel.get(this, "eventDestinationName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventDestinationName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventDestinationName", java.util.Objects.requireNonNull(value, "eventDestinationName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestination}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestination> {
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
        private final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#configuration_set_name Sesv2ConfigurationSetEventDestination#configuration_set_name}.
         * <p>
         * @return {@code this}
         * @param configurationSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#configuration_set_name Sesv2ConfigurationSetEventDestination#configuration_set_name}. This parameter is required.
         */
        public Builder configurationSetName(final java.lang.String configurationSetName) {
            this.config.configurationSetName(configurationSetName);
            return this;
        }

        /**
         * event_destination block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#event_destination Sesv2ConfigurationSetEventDestination#event_destination}
         * <p>
         * @return {@code this}
         * @param eventDestination event_destination block. This parameter is required.
         */
        public Builder eventDestination(final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestination eventDestination) {
            this.config.eventDestination(eventDestination);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#event_destination_name Sesv2ConfigurationSetEventDestination#event_destination_name}.
         * <p>
         * @return {@code this}
         * @param eventDestinationName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#event_destination_name Sesv2ConfigurationSetEventDestination#event_destination_name}. This parameter is required.
         */
        public Builder eventDestinationName(final java.lang.String eventDestinationName) {
            this.config.eventDestinationName(eventDestinationName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#id Sesv2ConfigurationSetEventDestination#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#id Sesv2ConfigurationSetEventDestination#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestination}.
         */
        @Override
        public imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestination build() {
            return new imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestination(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
