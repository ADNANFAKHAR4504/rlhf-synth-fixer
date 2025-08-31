package imports.aws.appsync_source_api_association;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association aws_appsync_source_api_association}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncSourceApiAssociation.AppsyncSourceApiAssociation")
public class AppsyncSourceApiAssociation extends com.hashicorp.cdktf.TerraformResource {

    protected AppsyncSourceApiAssociation(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncSourceApiAssociation(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.appsync_source_api_association.AppsyncSourceApiAssociation.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association aws_appsync_source_api_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public AppsyncSourceApiAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association aws_appsync_source_api_association} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public AppsyncSourceApiAssociation(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a AppsyncSourceApiAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncSourceApiAssociation to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncSourceApiAssociation that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AppsyncSourceApiAssociation to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_source_api_association.AppsyncSourceApiAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AppsyncSourceApiAssociation resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncSourceApiAssociation to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncSourceApiAssociation that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_source_api_association.AppsyncSourceApiAssociation.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putSourceApiAssociationConfig(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationSourceApiAssociationConfig>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationSourceApiAssociationConfig> __cast_cd4240 = (java.util.List<imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationSourceApiAssociationConfig>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationSourceApiAssociationConfig __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSourceApiAssociationConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMergedApiArn() {
        software.amazon.jsii.Kernel.call(this, "resetMergedApiArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMergedApiId() {
        software.amazon.jsii.Kernel.call(this, "resetMergedApiId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceApiArn() {
        software.amazon.jsii.Kernel.call(this, "resetSourceApiArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceApiAssociationConfig() {
        software.amazon.jsii.Kernel.call(this, "resetSourceApiAssociationConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceApiId() {
        software.amazon.jsii.Kernel.call(this, "resetSourceApiId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getAssociationId() {
        return software.amazon.jsii.Kernel.get(this, "associationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationSourceApiAssociationConfigList getSourceApiAssociationConfig() {
        return software.amazon.jsii.Kernel.get(this, "sourceApiAssociationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationSourceApiAssociationConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMergedApiArnInput() {
        return software.amazon.jsii.Kernel.get(this, "mergedApiArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMergedApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "mergedApiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceApiArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceApiArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSourceApiAssociationConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceApiAssociationConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceApiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMergedApiArn() {
        return software.amazon.jsii.Kernel.get(this, "mergedApiArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMergedApiArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mergedApiArn", java.util.Objects.requireNonNull(value, "mergedApiArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMergedApiId() {
        return software.amazon.jsii.Kernel.get(this, "mergedApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMergedApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mergedApiId", java.util.Objects.requireNonNull(value, "mergedApiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceApiArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceApiArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceApiArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceApiArn", java.util.Objects.requireNonNull(value, "sourceApiArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceApiId() {
        return software.amazon.jsii.Kernel.get(this, "sourceApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceApiId", java.util.Objects.requireNonNull(value, "sourceApiId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.appsync_source_api_association.AppsyncSourceApiAssociation}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.appsync_source_api_association.AppsyncSourceApiAssociation> {
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
        private imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#description AppsyncSourceApiAssociation#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#description AppsyncSourceApiAssociation#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config().description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merged_api_arn AppsyncSourceApiAssociation#merged_api_arn}.
         * <p>
         * @return {@code this}
         * @param mergedApiArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merged_api_arn AppsyncSourceApiAssociation#merged_api_arn}. This parameter is required.
         */
        public Builder mergedApiArn(final java.lang.String mergedApiArn) {
            this.config().mergedApiArn(mergedApiArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merged_api_id AppsyncSourceApiAssociation#merged_api_id}.
         * <p>
         * @return {@code this}
         * @param mergedApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#merged_api_id AppsyncSourceApiAssociation#merged_api_id}. This parameter is required.
         */
        public Builder mergedApiId(final java.lang.String mergedApiId) {
            this.config().mergedApiId(mergedApiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_arn AppsyncSourceApiAssociation#source_api_arn}.
         * <p>
         * @return {@code this}
         * @param sourceApiArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_arn AppsyncSourceApiAssociation#source_api_arn}. This parameter is required.
         */
        public Builder sourceApiArn(final java.lang.String sourceApiArn) {
            this.config().sourceApiArn(sourceApiArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_association_config AppsyncSourceApiAssociation#source_api_association_config}.
         * <p>
         * @return {@code this}
         * @param sourceApiAssociationConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_association_config AppsyncSourceApiAssociation#source_api_association_config}. This parameter is required.
         */
        public Builder sourceApiAssociationConfig(final com.hashicorp.cdktf.IResolvable sourceApiAssociationConfig) {
            this.config().sourceApiAssociationConfig(sourceApiAssociationConfig);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_association_config AppsyncSourceApiAssociation#source_api_association_config}.
         * <p>
         * @return {@code this}
         * @param sourceApiAssociationConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_association_config AppsyncSourceApiAssociation#source_api_association_config}. This parameter is required.
         */
        public Builder sourceApiAssociationConfig(final java.util.List<? extends imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationSourceApiAssociationConfig> sourceApiAssociationConfig) {
            this.config().sourceApiAssociationConfig(sourceApiAssociationConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_id AppsyncSourceApiAssociation#source_api_id}.
         * <p>
         * @return {@code this}
         * @param sourceApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#source_api_id AppsyncSourceApiAssociation#source_api_id}. This parameter is required.
         */
        public Builder sourceApiId(final java.lang.String sourceApiId) {
            this.config().sourceApiId(sourceApiId);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_source_api_association#timeouts AppsyncSourceApiAssociation#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.appsync_source_api_association.AppsyncSourceApiAssociation}.
         */
        @Override
        public imports.aws.appsync_source_api_association.AppsyncSourceApiAssociation build() {
            return new imports.aws.appsync_source_api_association.AppsyncSourceApiAssociation(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.appsync_source_api_association.AppsyncSourceApiAssociationConfig.Builder();
            }
            return this.config;
        }
    }
}
