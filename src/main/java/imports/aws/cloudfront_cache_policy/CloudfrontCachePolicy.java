package imports.aws.cloudfront_cache_policy;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy aws_cloudfront_cache_policy}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontCachePolicy.CloudfrontCachePolicy")
public class CloudfrontCachePolicy extends com.hashicorp.cdktf.TerraformResource {

    protected CloudfrontCachePolicy(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontCachePolicy(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicy.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy aws_cloudfront_cache_policy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudfrontCachePolicy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudfrontCachePolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudfrontCachePolicy to import. This parameter is required.
     * @param importFromId The id of the existing CloudfrontCachePolicy that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudfrontCachePolicy to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudfrontCachePolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudfrontCachePolicy to import. This parameter is required.
     * @param importFromId The id of the existing CloudfrontCachePolicy that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putParametersInCacheKeyAndForwardedToOrigin(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin value) {
        software.amazon.jsii.Kernel.call(this, "putParametersInCacheKeyAndForwardedToOrigin", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetComment() {
        software.amazon.jsii.Kernel.call(this, "resetComment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultTtl() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultTtl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxTtl() {
        software.amazon.jsii.Kernel.call(this, "resetMaxTtl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinTtl() {
        software.amazon.jsii.Kernel.call(this, "resetMinTtl", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getEtag() {
        return software.amazon.jsii.Kernel.get(this, "etag", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference getParametersInCacheKeyAndForwardedToOrigin() {
        return software.amazon.jsii.Kernel.get(this, "parametersInCacheKeyAndForwardedToOrigin", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCommentInput() {
        return software.amazon.jsii.Kernel.get(this, "commentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDefaultTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "maxTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "minTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin getParametersInCacheKeyAndForwardedToOriginInput() {
        return software.amazon.jsii.Kernel.get(this, "parametersInCacheKeyAndForwardedToOriginInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComment() {
        return software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "comment", java.util.Objects.requireNonNull(value, "comment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultTtl() {
        return software.amazon.jsii.Kernel.get(this, "defaultTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDefaultTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "defaultTtl", java.util.Objects.requireNonNull(value, "defaultTtl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxTtl() {
        return software.amazon.jsii.Kernel.get(this, "maxTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxTtl", java.util.Objects.requireNonNull(value, "maxTtl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinTtl() {
        return software.amazon.jsii.Kernel.get(this, "minTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minTtl", java.util.Objects.requireNonNull(value, "minTtl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.cloudfront_cache_policy.CloudfrontCachePolicy}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudfront_cache_policy.CloudfrontCachePolicy> {
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
        private final imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#name CloudfrontCachePolicy#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#name CloudfrontCachePolicy#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * parameters_in_cache_key_and_forwarded_to_origin block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#parameters_in_cache_key_and_forwarded_to_origin CloudfrontCachePolicy#parameters_in_cache_key_and_forwarded_to_origin}
         * <p>
         * @return {@code this}
         * @param parametersInCacheKeyAndForwardedToOrigin parameters_in_cache_key_and_forwarded_to_origin block. This parameter is required.
         */
        public Builder parametersInCacheKeyAndForwardedToOrigin(final imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin parametersInCacheKeyAndForwardedToOrigin) {
            this.config.parametersInCacheKeyAndForwardedToOrigin(parametersInCacheKeyAndForwardedToOrigin);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#comment CloudfrontCachePolicy#comment}.
         * <p>
         * @return {@code this}
         * @param comment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#comment CloudfrontCachePolicy#comment}. This parameter is required.
         */
        public Builder comment(final java.lang.String comment) {
            this.config.comment(comment);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#default_ttl CloudfrontCachePolicy#default_ttl}.
         * <p>
         * @return {@code this}
         * @param defaultTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#default_ttl CloudfrontCachePolicy#default_ttl}. This parameter is required.
         */
        public Builder defaultTtl(final java.lang.Number defaultTtl) {
            this.config.defaultTtl(defaultTtl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#id CloudfrontCachePolicy#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#id CloudfrontCachePolicy#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#max_ttl CloudfrontCachePolicy#max_ttl}.
         * <p>
         * @return {@code this}
         * @param maxTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#max_ttl CloudfrontCachePolicy#max_ttl}. This parameter is required.
         */
        public Builder maxTtl(final java.lang.Number maxTtl) {
            this.config.maxTtl(maxTtl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#min_ttl CloudfrontCachePolicy#min_ttl}.
         * <p>
         * @return {@code this}
         * @param minTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_cache_policy#min_ttl CloudfrontCachePolicy#min_ttl}. This parameter is required.
         */
        public Builder minTtl(final java.lang.Number minTtl) {
            this.config.minTtl(minTtl);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudfront_cache_policy.CloudfrontCachePolicy}.
         */
        @Override
        public imports.aws.cloudfront_cache_policy.CloudfrontCachePolicy build() {
            return new imports.aws.cloudfront_cache_policy.CloudfrontCachePolicy(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
