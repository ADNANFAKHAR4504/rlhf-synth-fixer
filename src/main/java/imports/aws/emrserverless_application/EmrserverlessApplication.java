package imports.aws.emrserverless_application;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application aws_emrserverless_application}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.208Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplication")
public class EmrserverlessApplication extends com.hashicorp.cdktf.TerraformResource {

    protected EmrserverlessApplication(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EmrserverlessApplication(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.emrserverless_application.EmrserverlessApplication.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application aws_emrserverless_application} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public EmrserverlessApplication(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a EmrserverlessApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrserverlessApplication to import. This parameter is required.
     * @param importFromId The id of the existing EmrserverlessApplication that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the EmrserverlessApplication to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emrserverless_application.EmrserverlessApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a EmrserverlessApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the EmrserverlessApplication to import. This parameter is required.
     * @param importFromId The id of the existing EmrserverlessApplication that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.emrserverless_application.EmrserverlessApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAutoStartConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAutoStartConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAutoStopConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putAutoStopConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putImageConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putImageConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInitialCapacity(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacity>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacity> __cast_cd4240 = (java.util.List<imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacity>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacity __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInitialCapacity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInteractiveConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putInteractiveConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMaximumCapacity(final @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity value) {
        software.amazon.jsii.Kernel.call(this, "putMaximumCapacity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNetworkConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putNetworkConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArchitecture() {
        software.amazon.jsii.Kernel.call(this, "resetArchitecture", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoStartConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAutoStartConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoStopConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetAutoStopConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetImageConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitialCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetInitialCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInteractiveConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetInteractiveConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumCapacity() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumCapacity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNetworkConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetNetworkConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfigurationOutputReference getAutoStartConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "autoStartConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfigurationOutputReference getAutoStopConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "autoStopConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationImageConfigurationOutputReference getImageConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "imageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationImageConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityList getInitialCapacity() {
        return software.amazon.jsii.Kernel.get(this, "initialCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfigurationOutputReference getInteractiveConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "interactiveConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacityOutputReference getMaximumCapacity() {
        return software.amazon.jsii.Kernel.get(this, "maximumCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacityOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfigurationOutputReference getNetworkConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArchitectureInput() {
        return software.amazon.jsii.Kernel.get(this, "architectureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration getAutoStartConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "autoStartConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration getAutoStopConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "autoStopConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration getImageConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "imageConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInitialCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "initialCapacityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration getInteractiveConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "interactiveConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity getMaximumCapacityInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumCapacityInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration getNetworkConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "networkConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReleaseLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArchitecture() {
        return software.amazon.jsii.Kernel.get(this, "architecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArchitecture(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "architecture", java.util.Objects.requireNonNull(value, "architecture is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReleaseLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "releaseLabel", java.util.Objects.requireNonNull(value, "releaseLabel is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.emrserverless_application.EmrserverlessApplication}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.emrserverless_application.EmrserverlessApplication> {
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
        private final imports.aws.emrserverless_application.EmrserverlessApplicationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.emrserverless_application.EmrserverlessApplicationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#name EmrserverlessApplication#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#name EmrserverlessApplication#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#release_label EmrserverlessApplication#release_label}.
         * <p>
         * @return {@code this}
         * @param releaseLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#release_label EmrserverlessApplication#release_label}. This parameter is required.
         */
        public Builder releaseLabel(final java.lang.String releaseLabel) {
            this.config.releaseLabel(releaseLabel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#type EmrserverlessApplication#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#type EmrserverlessApplication#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#architecture EmrserverlessApplication#architecture}.
         * <p>
         * @return {@code this}
         * @param architecture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#architecture EmrserverlessApplication#architecture}. This parameter is required.
         */
        public Builder architecture(final java.lang.String architecture) {
            this.config.architecture(architecture);
            return this;
        }

        /**
         * auto_start_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#auto_start_configuration EmrserverlessApplication#auto_start_configuration}
         * <p>
         * @return {@code this}
         * @param autoStartConfiguration auto_start_configuration block. This parameter is required.
         */
        public Builder autoStartConfiguration(final imports.aws.emrserverless_application.EmrserverlessApplicationAutoStartConfiguration autoStartConfiguration) {
            this.config.autoStartConfiguration(autoStartConfiguration);
            return this;
        }

        /**
         * auto_stop_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#auto_stop_configuration EmrserverlessApplication#auto_stop_configuration}
         * <p>
         * @return {@code this}
         * @param autoStopConfiguration auto_stop_configuration block. This parameter is required.
         */
        public Builder autoStopConfiguration(final imports.aws.emrserverless_application.EmrserverlessApplicationAutoStopConfiguration autoStopConfiguration) {
            this.config.autoStopConfiguration(autoStopConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#id EmrserverlessApplication#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#id EmrserverlessApplication#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * image_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#image_configuration EmrserverlessApplication#image_configuration}
         * <p>
         * @return {@code this}
         * @param imageConfiguration image_configuration block. This parameter is required.
         */
        public Builder imageConfiguration(final imports.aws.emrserverless_application.EmrserverlessApplicationImageConfiguration imageConfiguration) {
            this.config.imageConfiguration(imageConfiguration);
            return this;
        }

        /**
         * initial_capacity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity EmrserverlessApplication#initial_capacity}
         * <p>
         * @return {@code this}
         * @param initialCapacity initial_capacity block. This parameter is required.
         */
        public Builder initialCapacity(final com.hashicorp.cdktf.IResolvable initialCapacity) {
            this.config.initialCapacity(initialCapacity);
            return this;
        }
        /**
         * initial_capacity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#initial_capacity EmrserverlessApplication#initial_capacity}
         * <p>
         * @return {@code this}
         * @param initialCapacity initial_capacity block. This parameter is required.
         */
        public Builder initialCapacity(final java.util.List<? extends imports.aws.emrserverless_application.EmrserverlessApplicationInitialCapacity> initialCapacity) {
            this.config.initialCapacity(initialCapacity);
            return this;
        }

        /**
         * interactive_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#interactive_configuration EmrserverlessApplication#interactive_configuration}
         * <p>
         * @return {@code this}
         * @param interactiveConfiguration interactive_configuration block. This parameter is required.
         */
        public Builder interactiveConfiguration(final imports.aws.emrserverless_application.EmrserverlessApplicationInteractiveConfiguration interactiveConfiguration) {
            this.config.interactiveConfiguration(interactiveConfiguration);
            return this;
        }

        /**
         * maximum_capacity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#maximum_capacity EmrserverlessApplication#maximum_capacity}
         * <p>
         * @return {@code this}
         * @param maximumCapacity maximum_capacity block. This parameter is required.
         */
        public Builder maximumCapacity(final imports.aws.emrserverless_application.EmrserverlessApplicationMaximumCapacity maximumCapacity) {
            this.config.maximumCapacity(maximumCapacity);
            return this;
        }

        /**
         * network_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#network_configuration EmrserverlessApplication#network_configuration}
         * <p>
         * @return {@code this}
         * @param networkConfiguration network_configuration block. This parameter is required.
         */
        public Builder networkConfiguration(final imports.aws.emrserverless_application.EmrserverlessApplicationNetworkConfiguration networkConfiguration) {
            this.config.networkConfiguration(networkConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#tags EmrserverlessApplication#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#tags EmrserverlessApplication#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#tags_all EmrserverlessApplication#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#tags_all EmrserverlessApplication#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.emrserverless_application.EmrserverlessApplication}.
         */
        @Override
        public imports.aws.emrserverless_application.EmrserverlessApplication build() {
            return new imports.aws.emrserverless_application.EmrserverlessApplication(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
