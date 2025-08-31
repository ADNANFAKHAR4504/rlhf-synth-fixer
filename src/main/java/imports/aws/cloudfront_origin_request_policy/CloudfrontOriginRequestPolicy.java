package imports.aws.cloudfront_origin_request_policy;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy aws_cloudfront_origin_request_policy}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.245Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontOriginRequestPolicy.CloudfrontOriginRequestPolicy")
public class CloudfrontOriginRequestPolicy extends com.hashicorp.cdktf.TerraformResource {

    protected CloudfrontOriginRequestPolicy(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontOriginRequestPolicy(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicy.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy aws_cloudfront_origin_request_policy} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public CloudfrontOriginRequestPolicy(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a CloudfrontOriginRequestPolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudfrontOriginRequestPolicy to import. This parameter is required.
     * @param importFromId The id of the existing CloudfrontOriginRequestPolicy that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the CloudfrontOriginRequestPolicy to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a CloudfrontOriginRequestPolicy resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the CloudfrontOriginRequestPolicy to import. This parameter is required.
     * @param importFromId The id of the existing CloudfrontOriginRequestPolicy that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicy.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCookiesConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyCookiesConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCookiesConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHeadersConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyHeadersConfig value) {
        software.amazon.jsii.Kernel.call(this, "putHeadersConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQueryStringsConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfig value) {
        software.amazon.jsii.Kernel.call(this, "putQueryStringsConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetComment() {
        software.amazon.jsii.Kernel.call(this, "resetComment", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyCookiesConfigOutputReference getCookiesConfig() {
        return software.amazon.jsii.Kernel.get(this, "cookiesConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyCookiesConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEtag() {
        return software.amazon.jsii.Kernel.get(this, "etag", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyHeadersConfigOutputReference getHeadersConfig() {
        return software.amazon.jsii.Kernel.get(this, "headersConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyHeadersConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfigOutputReference getQueryStringsConfig() {
        return software.amazon.jsii.Kernel.get(this, "queryStringsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCommentInput() {
        return software.amazon.jsii.Kernel.get(this, "commentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyCookiesConfig getCookiesConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "cookiesConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyCookiesConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyHeadersConfig getHeadersConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "headersConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyHeadersConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfig getQueryStringsConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringsConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComment() {
        return software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "comment", java.util.Objects.requireNonNull(value, "comment is required"));
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

    /**
     * A fluent builder for {@link imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicy}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicy> {
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
        private final imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyConfig.Builder();
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
         * cookies_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#cookies_config CloudfrontOriginRequestPolicy#cookies_config}
         * <p>
         * @return {@code this}
         * @param cookiesConfig cookies_config block. This parameter is required.
         */
        public Builder cookiesConfig(final imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyCookiesConfig cookiesConfig) {
            this.config.cookiesConfig(cookiesConfig);
            return this;
        }

        /**
         * headers_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#headers_config CloudfrontOriginRequestPolicy#headers_config}
         * <p>
         * @return {@code this}
         * @param headersConfig headers_config block. This parameter is required.
         */
        public Builder headersConfig(final imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyHeadersConfig headersConfig) {
            this.config.headersConfig(headersConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#name CloudfrontOriginRequestPolicy#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#name CloudfrontOriginRequestPolicy#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * query_strings_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#query_strings_config CloudfrontOriginRequestPolicy#query_strings_config}
         * <p>
         * @return {@code this}
         * @param queryStringsConfig query_strings_config block. This parameter is required.
         */
        public Builder queryStringsConfig(final imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicyQueryStringsConfig queryStringsConfig) {
            this.config.queryStringsConfig(queryStringsConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#comment CloudfrontOriginRequestPolicy#comment}.
         * <p>
         * @return {@code this}
         * @param comment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#comment CloudfrontOriginRequestPolicy#comment}. This parameter is required.
         */
        public Builder comment(final java.lang.String comment) {
            this.config.comment(comment);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#id CloudfrontOriginRequestPolicy#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_origin_request_policy#id CloudfrontOriginRequestPolicy#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicy}.
         */
        @Override
        public imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicy build() {
            return new imports.aws.cloudfront_origin_request_policy.CloudfrontOriginRequestPolicy(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
