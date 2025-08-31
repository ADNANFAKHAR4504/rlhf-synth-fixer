package imports.aws.ses_event_destination;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination aws_ses_event_destination}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.448Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesEventDestination.SesEventDestination")
public class SesEventDestination extends com.hashicorp.cdktf.TerraformResource {

    protected SesEventDestination(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SesEventDestination(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ses_event_destination.SesEventDestination.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination aws_ses_event_destination} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SesEventDestination(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ses_event_destination.SesEventDestinationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SesEventDestination resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SesEventDestination to import. This parameter is required.
     * @param importFromId The id of the existing SesEventDestination that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SesEventDestination to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ses_event_destination.SesEventDestination.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SesEventDestination resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SesEventDestination to import. This parameter is required.
     * @param importFromId The id of the existing SesEventDestination that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ses_event_destination.SesEventDestination.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCloudwatchDestination(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ses_event_destination.SesEventDestinationCloudwatchDestination>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ses_event_destination.SesEventDestinationCloudwatchDestination> __cast_cd4240 = (java.util.List<imports.aws.ses_event_destination.SesEventDestinationCloudwatchDestination>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ses_event_destination.SesEventDestinationCloudwatchDestination __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCloudwatchDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisDestination(final @org.jetbrains.annotations.NotNull imports.aws.ses_event_destination.SesEventDestinationKinesisDestination value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSnsDestination(final @org.jetbrains.annotations.NotNull imports.aws.ses_event_destination.SesEventDestinationSnsDestination value) {
        software.amazon.jsii.Kernel.call(this, "putSnsDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchDestination() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisDestination() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisDestination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnsDestination() {
        software.amazon.jsii.Kernel.call(this, "resetSnsDestination", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ses_event_destination.SesEventDestinationCloudwatchDestinationList getCloudwatchDestination() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchDestination", software.amazon.jsii.NativeType.forClass(imports.aws.ses_event_destination.SesEventDestinationCloudwatchDestinationList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_event_destination.SesEventDestinationKinesisDestinationOutputReference getKinesisDestination() {
        return software.amazon.jsii.Kernel.get(this, "kinesisDestination", software.amazon.jsii.NativeType.forClass(imports.aws.ses_event_destination.SesEventDestinationKinesisDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ses_event_destination.SesEventDestinationSnsDestinationOutputReference getSnsDestination() {
        return software.amazon.jsii.Kernel.get(this, "snsDestination", software.amazon.jsii.NativeType.forClass(imports.aws.ses_event_destination.SesEventDestinationSnsDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCloudwatchDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchDestinationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConfigurationSetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "configurationSetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ses_event_destination.SesEventDestinationKinesisDestination getKinesisDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ses_event_destination.SesEventDestinationKinesisDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getMatchingTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "matchingTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ses_event_destination.SesEventDestinationSnsDestination getSnsDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "snsDestinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.ses_event_destination.SesEventDestinationSnsDestination.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConfigurationSetName() {
        return software.amazon.jsii.Kernel.get(this, "configurationSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConfigurationSetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "configurationSetName", java.util.Objects.requireNonNull(value, "configurationSetName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMatchingTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "matchingTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setMatchingTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "matchingTypes", java.util.Objects.requireNonNull(value, "matchingTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ses_event_destination.SesEventDestination}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ses_event_destination.SesEventDestination> {
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
        private final imports.aws.ses_event_destination.SesEventDestinationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ses_event_destination.SesEventDestinationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#configuration_set_name SesEventDestination#configuration_set_name}.
         * <p>
         * @return {@code this}
         * @param configurationSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#configuration_set_name SesEventDestination#configuration_set_name}. This parameter is required.
         */
        public Builder configurationSetName(final java.lang.String configurationSetName) {
            this.config.configurationSetName(configurationSetName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#matching_types SesEventDestination#matching_types}.
         * <p>
         * @return {@code this}
         * @param matchingTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#matching_types SesEventDestination#matching_types}. This parameter is required.
         */
        public Builder matchingTypes(final java.util.List<java.lang.String> matchingTypes) {
            this.config.matchingTypes(matchingTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#name SesEventDestination#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#name SesEventDestination#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * cloudwatch_destination block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#cloudwatch_destination SesEventDestination#cloudwatch_destination}
         * <p>
         * @return {@code this}
         * @param cloudwatchDestination cloudwatch_destination block. This parameter is required.
         */
        public Builder cloudwatchDestination(final com.hashicorp.cdktf.IResolvable cloudwatchDestination) {
            this.config.cloudwatchDestination(cloudwatchDestination);
            return this;
        }
        /**
         * cloudwatch_destination block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#cloudwatch_destination SesEventDestination#cloudwatch_destination}
         * <p>
         * @return {@code this}
         * @param cloudwatchDestination cloudwatch_destination block. This parameter is required.
         */
        public Builder cloudwatchDestination(final java.util.List<? extends imports.aws.ses_event_destination.SesEventDestinationCloudwatchDestination> cloudwatchDestination) {
            this.config.cloudwatchDestination(cloudwatchDestination);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#enabled SesEventDestination#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#enabled SesEventDestination#enabled}. This parameter is required.
         */
        public Builder enabled(final java.lang.Boolean enabled) {
            this.config.enabled(enabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#enabled SesEventDestination#enabled}.
         * <p>
         * @return {@code this}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#enabled SesEventDestination#enabled}. This parameter is required.
         */
        public Builder enabled(final com.hashicorp.cdktf.IResolvable enabled) {
            this.config.enabled(enabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#id SesEventDestination#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#id SesEventDestination#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * kinesis_destination block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#kinesis_destination SesEventDestination#kinesis_destination}
         * <p>
         * @return {@code this}
         * @param kinesisDestination kinesis_destination block. This parameter is required.
         */
        public Builder kinesisDestination(final imports.aws.ses_event_destination.SesEventDestinationKinesisDestination kinesisDestination) {
            this.config.kinesisDestination(kinesisDestination);
            return this;
        }

        /**
         * sns_destination block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_event_destination#sns_destination SesEventDestination#sns_destination}
         * <p>
         * @return {@code this}
         * @param snsDestination sns_destination block. This parameter is required.
         */
        public Builder snsDestination(final imports.aws.ses_event_destination.SesEventDestinationSnsDestination snsDestination) {
            this.config.snsDestination(snsDestination);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ses_event_destination.SesEventDestination}.
         */
        @Override
        public imports.aws.ses_event_destination.SesEventDestination build() {
            return new imports.aws.ses_event_destination.SesEventDestination(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
