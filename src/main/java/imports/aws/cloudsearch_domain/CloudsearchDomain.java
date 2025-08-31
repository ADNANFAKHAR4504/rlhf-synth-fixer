package imports.aws.cloudsearch_domain;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain aws_cloudsearch_domain}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.260Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudsearchDomain.CloudsearchDomain")
public class CloudsearchDomain extends com.hashicorp.cdktf.TerraformResource {

    protected CloudsearchDomain(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudsearchDomain(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudsearch_domain.CloudsearchDomain.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain aws_cloudsearch_domain} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudsearchDomain(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudsearch_domain.CloudsearchDomainConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudsearchDomain resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudsearchDomain to import. This parameter is required.
     * @param importFromId The id of the existing CloudsearchDomain that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudsearchDomain to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudsearch_domain.CloudsearchDomain.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudsearchDomain resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudsearchDomain to import. This parameter is required.
     * @param importFromId The id of the existing CloudsearchDomain that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudsearch_domain.CloudsearchDomain.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEndpointOptions(final @org.jetbrains.annotations.NotNull imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions value) {
        software.amazon.jsii.Kernel.call(this, "putEndpointOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIndexField(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.cloudsearch_domain.CloudsearchDomainIndexField>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.cloudsearch_domain.CloudsearchDomainIndexField> __cast_cd4240 = (java.util.List<imports.aws.cloudsearch_domain.CloudsearchDomainIndexField>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.cloudsearch_domain.CloudsearchDomainIndexField __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putIndexField", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScalingParameters(final @org.jetbrains.annotations.NotNull imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters value) {
        software.amazon.jsii.Kernel.call(this, "putScalingParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.cloudsearch_domain.CloudsearchDomainTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEndpointOptions() {
        software.amazon.jsii.Kernel.call(this, "resetEndpointOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIndexField() {
        software.amazon.jsii.Kernel.call(this, "resetIndexField", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMultiAz() {
        software.amazon.jsii.Kernel.call(this, "resetMultiAz", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScalingParameters() {
        software.amazon.jsii.Kernel.call(this, "resetScalingParameters", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentServiceEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "documentServiceEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDomainId() {
        return software.amazon.jsii.Kernel.get(this, "domainId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptionsOutputReference getEndpointOptions() {
        return software.amazon.jsii.Kernel.get(this, "endpointOptions", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudsearch_domain.CloudsearchDomainIndexFieldList getIndexField() {
        return software.amazon.jsii.Kernel.get(this, "indexField", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainIndexFieldList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudsearch_domain.CloudsearchDomainScalingParametersOutputReference getScalingParameters() {
        return software.amazon.jsii.Kernel.get(this, "scalingParameters", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainScalingParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSearchServiceEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "searchServiceEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudsearch_domain.CloudsearchDomainTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions getEndpointOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "endpointOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIndexFieldInput() {
        return software.amazon.jsii.Kernel.get(this, "indexFieldInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMultiAzInput() {
        return software.amazon.jsii.Kernel.get(this, "multiAzInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters getScalingParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "scalingParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMultiAz() {
        return software.amazon.jsii.Kernel.get(this, "multiAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMultiAz(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "multiAz", java.util.Objects.requireNonNull(value, "multiAz is required"));
    }

    public void setMultiAz(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "multiAz", java.util.Objects.requireNonNull(value, "multiAz is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudsearch_domain.CloudsearchDomain}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudsearch_domain.CloudsearchDomain> {
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
        private final imports.aws.cloudsearch_domain.CloudsearchDomainConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudsearch_domain.CloudsearchDomainConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#name CloudsearchDomain#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#name CloudsearchDomain#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * endpoint_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#endpoint_options CloudsearchDomain#endpoint_options}
         * <p>
         * @return {@code this}
         * @param endpointOptions endpoint_options block. This parameter is required.
         */
        public Builder endpointOptions(final imports.aws.cloudsearch_domain.CloudsearchDomainEndpointOptions endpointOptions) {
            this.config.endpointOptions(endpointOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#id CloudsearchDomain#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#id CloudsearchDomain#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * index_field block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#index_field CloudsearchDomain#index_field}
         * <p>
         * @return {@code this}
         * @param indexField index_field block. This parameter is required.
         */
        public Builder indexField(final com.hashicorp.cdktf.IResolvable indexField) {
            this.config.indexField(indexField);
            return this;
        }
        /**
         * index_field block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#index_field CloudsearchDomain#index_field}
         * <p>
         * @return {@code this}
         * @param indexField index_field block. This parameter is required.
         */
        public Builder indexField(final java.util.List<? extends imports.aws.cloudsearch_domain.CloudsearchDomainIndexField> indexField) {
            this.config.indexField(indexField);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#multi_az CloudsearchDomain#multi_az}.
         * <p>
         * @return {@code this}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#multi_az CloudsearchDomain#multi_az}. This parameter is required.
         */
        public Builder multiAz(final java.lang.Boolean multiAz) {
            this.config.multiAz(multiAz);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#multi_az CloudsearchDomain#multi_az}.
         * <p>
         * @return {@code this}
         * @param multiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#multi_az CloudsearchDomain#multi_az}. This parameter is required.
         */
        public Builder multiAz(final com.hashicorp.cdktf.IResolvable multiAz) {
            this.config.multiAz(multiAz);
            return this;
        }

        /**
         * scaling_parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#scaling_parameters CloudsearchDomain#scaling_parameters}
         * <p>
         * @return {@code this}
         * @param scalingParameters scaling_parameters block. This parameter is required.
         */
        public Builder scalingParameters(final imports.aws.cloudsearch_domain.CloudsearchDomainScalingParameters scalingParameters) {
            this.config.scalingParameters(scalingParameters);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudsearch_domain#timeouts CloudsearchDomain#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.cloudsearch_domain.CloudsearchDomainTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudsearch_domain.CloudsearchDomain}.
         */
        @Override
        public imports.aws.cloudsearch_domain.CloudsearchDomain build() {
            return new imports.aws.cloudsearch_domain.CloudsearchDomain(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
