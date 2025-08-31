package imports.aws.finspace_kx_dataview;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview aws_finspace_kx_dataview}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.223Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxDataview.FinspaceKxDataview")
public class FinspaceKxDataview extends com.hashicorp.cdktf.TerraformResource {

    protected FinspaceKxDataview(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FinspaceKxDataview(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.finspace_kx_dataview.FinspaceKxDataview.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview aws_finspace_kx_dataview} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public FinspaceKxDataview(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_dataview.FinspaceKxDataviewConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a FinspaceKxDataview resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FinspaceKxDataview to import. This parameter is required.
     * @param importFromId The id of the existing FinspaceKxDataview that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the FinspaceKxDataview to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.finspace_kx_dataview.FinspaceKxDataview.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a FinspaceKxDataview resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the FinspaceKxDataview to import. This parameter is required.
     * @param importFromId The id of the existing FinspaceKxDataview that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.finspace_kx_dataview.FinspaceKxDataview.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putSegmentConfigurations(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurations>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurations> __cast_cd4240 = (java.util.List<imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurations>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurations __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSegmentConfigurations", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAvailabilityZoneId() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZoneId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetChangesetId() {
        software.amazon.jsii.Kernel.call(this, "resetChangesetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadWrite() {
        software.amazon.jsii.Kernel.call(this, "resetReadWrite", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentConfigurations() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentConfigurations", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "createdTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastModifiedTimestamp() {
        return software.amazon.jsii.Kernel.get(this, "lastModifiedTimestamp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurationsList getSegmentConfigurations() {
        return software.amazon.jsii.Kernel.get(this, "segmentConfigurations", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurationsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoUpdateInput() {
        return software.amazon.jsii.Kernel.get(this, "autoUpdateInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneIdInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAzModeInput() {
        return software.amazon.jsii.Kernel.get(this, "azModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getChangesetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "changesetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEnvironmentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReadWriteInput() {
        return software.amazon.jsii.Kernel.get(this, "readWriteInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSegmentConfigurationsInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentConfigurationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoUpdate() {
        return software.amazon.jsii.Kernel.get(this, "autoUpdate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoUpdate(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoUpdate", java.util.Objects.requireNonNull(value, "autoUpdate is required"));
    }

    public void setAutoUpdate(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoUpdate", java.util.Objects.requireNonNull(value, "autoUpdate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZoneId() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZoneId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZoneId", java.util.Objects.requireNonNull(value, "availabilityZoneId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAzMode() {
        return software.amazon.jsii.Kernel.get(this, "azMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAzMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "azMode", java.util.Objects.requireNonNull(value, "azMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getChangesetId() {
        return software.amazon.jsii.Kernel.get(this, "changesetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setChangesetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "changesetId", java.util.Objects.requireNonNull(value, "changesetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseName", java.util.Objects.requireNonNull(value, "databaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentId() {
        return software.amazon.jsii.Kernel.get(this, "environmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEnvironmentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "environmentId", java.util.Objects.requireNonNull(value, "environmentId is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getReadWrite() {
        return software.amazon.jsii.Kernel.get(this, "readWrite", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReadWrite(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "readWrite", java.util.Objects.requireNonNull(value, "readWrite is required"));
    }

    public void setReadWrite(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "readWrite", java.util.Objects.requireNonNull(value, "readWrite is required"));
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
     * A fluent builder for {@link imports.aws.finspace_kx_dataview.FinspaceKxDataview}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.finspace_kx_dataview.FinspaceKxDataview> {
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
        private final imports.aws.finspace_kx_dataview.FinspaceKxDataviewConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.finspace_kx_dataview.FinspaceKxDataviewConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#auto_update FinspaceKxDataview#auto_update}.
         * <p>
         * @return {@code this}
         * @param autoUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#auto_update FinspaceKxDataview#auto_update}. This parameter is required.
         */
        public Builder autoUpdate(final java.lang.Boolean autoUpdate) {
            this.config.autoUpdate(autoUpdate);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#auto_update FinspaceKxDataview#auto_update}.
         * <p>
         * @return {@code this}
         * @param autoUpdate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#auto_update FinspaceKxDataview#auto_update}. This parameter is required.
         */
        public Builder autoUpdate(final com.hashicorp.cdktf.IResolvable autoUpdate) {
            this.config.autoUpdate(autoUpdate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#az_mode FinspaceKxDataview#az_mode}.
         * <p>
         * @return {@code this}
         * @param azMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#az_mode FinspaceKxDataview#az_mode}. This parameter is required.
         */
        public Builder azMode(final java.lang.String azMode) {
            this.config.azMode(azMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#database_name FinspaceKxDataview#database_name}.
         * <p>
         * @return {@code this}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#database_name FinspaceKxDataview#database_name}. This parameter is required.
         */
        public Builder databaseName(final java.lang.String databaseName) {
            this.config.databaseName(databaseName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#environment_id FinspaceKxDataview#environment_id}.
         * <p>
         * @return {@code this}
         * @param environmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#environment_id FinspaceKxDataview#environment_id}. This parameter is required.
         */
        public Builder environmentId(final java.lang.String environmentId) {
            this.config.environmentId(environmentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#name FinspaceKxDataview#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#name FinspaceKxDataview#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#availability_zone_id FinspaceKxDataview#availability_zone_id}.
         * <p>
         * @return {@code this}
         * @param availabilityZoneId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#availability_zone_id FinspaceKxDataview#availability_zone_id}. This parameter is required.
         */
        public Builder availabilityZoneId(final java.lang.String availabilityZoneId) {
            this.config.availabilityZoneId(availabilityZoneId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#changeset_id FinspaceKxDataview#changeset_id}.
         * <p>
         * @return {@code this}
         * @param changesetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#changeset_id FinspaceKxDataview#changeset_id}. This parameter is required.
         */
        public Builder changesetId(final java.lang.String changesetId) {
            this.config.changesetId(changesetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#description FinspaceKxDataview#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#description FinspaceKxDataview#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#id FinspaceKxDataview#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#id FinspaceKxDataview#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#read_write FinspaceKxDataview#read_write}.
         * <p>
         * @return {@code this}
         * @param readWrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#read_write FinspaceKxDataview#read_write}. This parameter is required.
         */
        public Builder readWrite(final java.lang.Boolean readWrite) {
            this.config.readWrite(readWrite);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#read_write FinspaceKxDataview#read_write}.
         * <p>
         * @return {@code this}
         * @param readWrite Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#read_write FinspaceKxDataview#read_write}. This parameter is required.
         */
        public Builder readWrite(final com.hashicorp.cdktf.IResolvable readWrite) {
            this.config.readWrite(readWrite);
            return this;
        }

        /**
         * segment_configurations block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#segment_configurations FinspaceKxDataview#segment_configurations}
         * <p>
         * @return {@code this}
         * @param segmentConfigurations segment_configurations block. This parameter is required.
         */
        public Builder segmentConfigurations(final com.hashicorp.cdktf.IResolvable segmentConfigurations) {
            this.config.segmentConfigurations(segmentConfigurations);
            return this;
        }
        /**
         * segment_configurations block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#segment_configurations FinspaceKxDataview#segment_configurations}
         * <p>
         * @return {@code this}
         * @param segmentConfigurations segment_configurations block. This parameter is required.
         */
        public Builder segmentConfigurations(final java.util.List<? extends imports.aws.finspace_kx_dataview.FinspaceKxDataviewSegmentConfigurations> segmentConfigurations) {
            this.config.segmentConfigurations(segmentConfigurations);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#tags FinspaceKxDataview#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#tags FinspaceKxDataview#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#tags_all FinspaceKxDataview#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#tags_all FinspaceKxDataview#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_dataview#timeouts FinspaceKxDataview#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.finspace_kx_dataview.FinspaceKxDataviewTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.finspace_kx_dataview.FinspaceKxDataview}.
         */
        @Override
        public imports.aws.finspace_kx_dataview.FinspaceKxDataview build() {
            return new imports.aws.finspace_kx_dataview.FinspaceKxDataview(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
