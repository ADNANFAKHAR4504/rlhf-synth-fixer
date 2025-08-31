package imports.aws.ec2_instance_metadata_defaults;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults aws_ec2_instance_metadata_defaults}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.082Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2InstanceMetadataDefaults.Ec2InstanceMetadataDefaults")
public class Ec2InstanceMetadataDefaults extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2InstanceMetadataDefaults(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2InstanceMetadataDefaults(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaults.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults aws_ec2_instance_metadata_defaults} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public Ec2InstanceMetadataDefaults(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaultsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults aws_ec2_instance_metadata_defaults} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public Ec2InstanceMetadataDefaults(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2InstanceMetadataDefaults resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2InstanceMetadataDefaults to import. This parameter is required.
     * @param importFromId The id of the existing Ec2InstanceMetadataDefaults that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2InstanceMetadataDefaults to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaults.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2InstanceMetadataDefaults resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2InstanceMetadataDefaults to import. This parameter is required.
     * @param importFromId The id of the existing Ec2InstanceMetadataDefaults that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaults.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetHttpEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetHttpEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpPutResponseHopLimit() {
        software.amazon.jsii.Kernel.call(this, "resetHttpPutResponseHopLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpTokens() {
        software.amazon.jsii.Kernel.call(this, "resetHttpTokens", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceMetadataTags() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceMetadataTags", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "httpEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHttpPutResponseHopLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "httpPutResponseHopLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpTokensInput() {
        return software.amazon.jsii.Kernel.get(this, "httpTokensInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceMetadataTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceMetadataTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "httpEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpEndpoint", java.util.Objects.requireNonNull(value, "httpEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHttpPutResponseHopLimit() {
        return software.amazon.jsii.Kernel.get(this, "httpPutResponseHopLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHttpPutResponseHopLimit(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "httpPutResponseHopLimit", java.util.Objects.requireNonNull(value, "httpPutResponseHopLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpTokens() {
        return software.amazon.jsii.Kernel.get(this, "httpTokens", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpTokens(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpTokens", java.util.Objects.requireNonNull(value, "httpTokens is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceMetadataTags() {
        return software.amazon.jsii.Kernel.get(this, "instanceMetadataTags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceMetadataTags(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceMetadataTags", java.util.Objects.requireNonNull(value, "instanceMetadataTags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaults}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaults> {
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
        private imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaultsConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults#http_endpoint Ec2InstanceMetadataDefaults#http_endpoint}.
         * <p>
         * @return {@code this}
         * @param httpEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults#http_endpoint Ec2InstanceMetadataDefaults#http_endpoint}. This parameter is required.
         */
        public Builder httpEndpoint(final java.lang.String httpEndpoint) {
            this.config().httpEndpoint(httpEndpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults#http_put_response_hop_limit Ec2InstanceMetadataDefaults#http_put_response_hop_limit}.
         * <p>
         * @return {@code this}
         * @param httpPutResponseHopLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults#http_put_response_hop_limit Ec2InstanceMetadataDefaults#http_put_response_hop_limit}. This parameter is required.
         */
        public Builder httpPutResponseHopLimit(final java.lang.Number httpPutResponseHopLimit) {
            this.config().httpPutResponseHopLimit(httpPutResponseHopLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults#http_tokens Ec2InstanceMetadataDefaults#http_tokens}.
         * <p>
         * @return {@code this}
         * @param httpTokens Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults#http_tokens Ec2InstanceMetadataDefaults#http_tokens}. This parameter is required.
         */
        public Builder httpTokens(final java.lang.String httpTokens) {
            this.config().httpTokens(httpTokens);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults#instance_metadata_tags Ec2InstanceMetadataDefaults#instance_metadata_tags}.
         * <p>
         * @return {@code this}
         * @param instanceMetadataTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_instance_metadata_defaults#instance_metadata_tags Ec2InstanceMetadataDefaults#instance_metadata_tags}. This parameter is required.
         */
        public Builder instanceMetadataTags(final java.lang.String instanceMetadataTags) {
            this.config().instanceMetadataTags(instanceMetadataTags);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaults}.
         */
        @Override
        public imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaults build() {
            return new imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaults(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaultsConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.ec2_instance_metadata_defaults.Ec2InstanceMetadataDefaultsConfig.Builder();
            }
            return this.config;
        }
    }
}
