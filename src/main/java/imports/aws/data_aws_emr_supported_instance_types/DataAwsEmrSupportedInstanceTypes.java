package imports.aws.data_aws_emr_supported_instance_types;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/emr_supported_instance_types aws_emr_supported_instance_types}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.654Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsEmrSupportedInstanceTypes.DataAwsEmrSupportedInstanceTypes")
public class DataAwsEmrSupportedInstanceTypes extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsEmrSupportedInstanceTypes(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsEmrSupportedInstanceTypes(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypes.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/emr_supported_instance_types aws_emr_supported_instance_types} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsEmrSupportedInstanceTypes(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsEmrSupportedInstanceTypes resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsEmrSupportedInstanceTypes to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsEmrSupportedInstanceTypes that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsEmrSupportedInstanceTypes to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypes.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsEmrSupportedInstanceTypes resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsEmrSupportedInstanceTypes to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsEmrSupportedInstanceTypes that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypes.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putSupportedInstanceTypes(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesSupportedInstanceTypes>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesSupportedInstanceTypes> __cast_cd4240 = (java.util.List<imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesSupportedInstanceTypes>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesSupportedInstanceTypes __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSupportedInstanceTypes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetSupportedInstanceTypes() {
        software.amazon.jsii.Kernel.call(this, "resetSupportedInstanceTypes", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesSupportedInstanceTypesList getSupportedInstanceTypes() {
        return software.amazon.jsii.Kernel.get(this, "supportedInstanceTypes", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesSupportedInstanceTypesList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReleaseLabelInput() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportedInstanceTypesInput() {
        return software.amazon.jsii.Kernel.get(this, "supportedInstanceTypesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel() {
        return software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReleaseLabel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "releaseLabel", java.util.Objects.requireNonNull(value, "releaseLabel is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypes}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypes> {
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
        private final imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/emr_supported_instance_types#release_label DataAwsEmrSupportedInstanceTypes#release_label}.
         * <p>
         * @return {@code this}
         * @param releaseLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/emr_supported_instance_types#release_label DataAwsEmrSupportedInstanceTypes#release_label}. This parameter is required.
         */
        public Builder releaseLabel(final java.lang.String releaseLabel) {
            this.config.releaseLabel(releaseLabel);
            return this;
        }

        /**
         * supported_instance_types block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/emr_supported_instance_types#supported_instance_types DataAwsEmrSupportedInstanceTypes#supported_instance_types}
         * <p>
         * @return {@code this}
         * @param supportedInstanceTypes supported_instance_types block. This parameter is required.
         */
        public Builder supportedInstanceTypes(final com.hashicorp.cdktf.IResolvable supportedInstanceTypes) {
            this.config.supportedInstanceTypes(supportedInstanceTypes);
            return this;
        }
        /**
         * supported_instance_types block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/emr_supported_instance_types#supported_instance_types DataAwsEmrSupportedInstanceTypes#supported_instance_types}
         * <p>
         * @return {@code this}
         * @param supportedInstanceTypes supported_instance_types block. This parameter is required.
         */
        public Builder supportedInstanceTypes(final java.util.List<? extends imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypesSupportedInstanceTypes> supportedInstanceTypes) {
            this.config.supportedInstanceTypes(supportedInstanceTypes);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypes}.
         */
        @Override
        public imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypes build() {
            return new imports.aws.data_aws_emr_supported_instance_types.DataAwsEmrSupportedInstanceTypes(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
