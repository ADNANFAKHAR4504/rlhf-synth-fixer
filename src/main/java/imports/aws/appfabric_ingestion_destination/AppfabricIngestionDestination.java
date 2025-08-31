package imports.aws.appfabric_ingestion_destination;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination aws_appfabric_ingestion_destination}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.994Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appfabricIngestionDestination.AppfabricIngestionDestination")
public class AppfabricIngestionDestination extends com.hashicorp.cdktf.TerraformResource {

    protected AppfabricIngestionDestination(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppfabricIngestionDestination(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestination.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination aws_appfabric_ingestion_destination} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AppfabricIngestionDestination(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AppfabricIngestionDestination resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppfabricIngestionDestination to import. This parameter is required.
     * @param importFromId The id of the existing AppfabricIngestionDestination that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AppfabricIngestionDestination to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestination.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AppfabricIngestionDestination resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppfabricIngestionDestination to import. This parameter is required.
     * @param importFromId The id of the existing AppfabricIngestionDestination that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestination.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDestinationConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfiguration> __cast_cd4240 = (java.util.List<imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDestinationConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putProcessingConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationProcessingConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationProcessingConfiguration> __cast_cd4240 = (java.util.List<imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationProcessingConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationProcessingConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putProcessingConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDestinationConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetDestinationConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProcessingConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetProcessingConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfigurationList getDestinationConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "destinationConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationProcessingConfigurationList getProcessingConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationProcessingConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAppBundleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "appBundleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDestinationConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIngestionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "ingestionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProcessingConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "processingConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAppBundleArn() {
        return software.amazon.jsii.Kernel.get(this, "appBundleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAppBundleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "appBundleArn", java.util.Objects.requireNonNull(value, "appBundleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIngestionArn() {
        return software.amazon.jsii.Kernel.get(this, "ingestionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIngestionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ingestionArn", java.util.Objects.requireNonNull(value, "ingestionArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestination}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestination> {
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
        private final imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#app_bundle_arn AppfabricIngestionDestination#app_bundle_arn}.
         * <p>
         * @return {@code this}
         * @param appBundleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#app_bundle_arn AppfabricIngestionDestination#app_bundle_arn}. This parameter is required.
         */
        public Builder appBundleArn(final java.lang.String appBundleArn) {
            this.config.appBundleArn(appBundleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#ingestion_arn AppfabricIngestionDestination#ingestion_arn}.
         * <p>
         * @return {@code this}
         * @param ingestionArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#ingestion_arn AppfabricIngestionDestination#ingestion_arn}. This parameter is required.
         */
        public Builder ingestionArn(final java.lang.String ingestionArn) {
            this.config.ingestionArn(ingestionArn);
            return this;
        }

        /**
         * destination_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#destination_configuration AppfabricIngestionDestination#destination_configuration}
         * <p>
         * @return {@code this}
         * @param destinationConfiguration destination_configuration block. This parameter is required.
         */
        public Builder destinationConfiguration(final com.hashicorp.cdktf.IResolvable destinationConfiguration) {
            this.config.destinationConfiguration(destinationConfiguration);
            return this;
        }
        /**
         * destination_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#destination_configuration AppfabricIngestionDestination#destination_configuration}
         * <p>
         * @return {@code this}
         * @param destinationConfiguration destination_configuration block. This parameter is required.
         */
        public Builder destinationConfiguration(final java.util.List<? extends imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationDestinationConfiguration> destinationConfiguration) {
            this.config.destinationConfiguration(destinationConfiguration);
            return this;
        }

        /**
         * processing_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#processing_configuration AppfabricIngestionDestination#processing_configuration}
         * <p>
         * @return {@code this}
         * @param processingConfiguration processing_configuration block. This parameter is required.
         */
        public Builder processingConfiguration(final com.hashicorp.cdktf.IResolvable processingConfiguration) {
            this.config.processingConfiguration(processingConfiguration);
            return this;
        }
        /**
         * processing_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#processing_configuration AppfabricIngestionDestination#processing_configuration}
         * <p>
         * @return {@code this}
         * @param processingConfiguration processing_configuration block. This parameter is required.
         */
        public Builder processingConfiguration(final java.util.List<? extends imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationProcessingConfiguration> processingConfiguration) {
            this.config.processingConfiguration(processingConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#tags AppfabricIngestionDestination#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#tags AppfabricIngestionDestination#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appfabric_ingestion_destination#timeouts AppfabricIngestionDestination#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestinationTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestination}.
         */
        @Override
        public imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestination build() {
            return new imports.aws.appfabric_ingestion_destination.AppfabricIngestionDestination(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
