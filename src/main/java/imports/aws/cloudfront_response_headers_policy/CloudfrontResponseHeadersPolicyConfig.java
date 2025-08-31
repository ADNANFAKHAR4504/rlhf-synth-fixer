package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicyConfig.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicyConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#name CloudfrontResponseHeadersPolicy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#comment CloudfrontResponseHeadersPolicy#comment}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComment() {
        return null;
    }

    /**
     * cors_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#cors_config CloudfrontResponseHeadersPolicy#cors_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfig getCorsConfig() {
        return null;
    }

    /**
     * custom_headers_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#custom_headers_config CloudfrontResponseHeadersPolicy#custom_headers_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCustomHeadersConfig getCustomHeadersConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#etag CloudfrontResponseHeadersPolicy#etag}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEtag() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#id CloudfrontResponseHeadersPolicy#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * remove_headers_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#remove_headers_config CloudfrontResponseHeadersPolicy#remove_headers_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyRemoveHeadersConfig getRemoveHeadersConfig() {
        return null;
    }

    /**
     * security_headers_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#security_headers_config CloudfrontResponseHeadersPolicy#security_headers_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig getSecurityHeadersConfig() {
        return null;
    }

    /**
     * server_timing_headers_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#server_timing_headers_config CloudfrontResponseHeadersPolicy#server_timing_headers_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyServerTimingHeadersConfig getServerTimingHeadersConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicyConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicyConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicyConfig> {
        java.lang.String name;
        java.lang.String comment;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfig corsConfig;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCustomHeadersConfig customHeadersConfig;
        java.lang.String etag;
        java.lang.String id;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyRemoveHeadersConfig removeHeadersConfig;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig securityHeadersConfig;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyServerTimingHeadersConfig serverTimingHeadersConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#name CloudfrontResponseHeadersPolicy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getComment}
         * @param comment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#comment CloudfrontResponseHeadersPolicy#comment}.
         * @return {@code this}
         */
        public Builder comment(java.lang.String comment) {
            this.comment = comment;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getCorsConfig}
         * @param corsConfig cors_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#cors_config CloudfrontResponseHeadersPolicy#cors_config}
         * @return {@code this}
         */
        public Builder corsConfig(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfig corsConfig) {
            this.corsConfig = corsConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getCustomHeadersConfig}
         * @param customHeadersConfig custom_headers_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#custom_headers_config CloudfrontResponseHeadersPolicy#custom_headers_config}
         * @return {@code this}
         */
        public Builder customHeadersConfig(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCustomHeadersConfig customHeadersConfig) {
            this.customHeadersConfig = customHeadersConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getEtag}
         * @param etag Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#etag CloudfrontResponseHeadersPolicy#etag}.
         * @return {@code this}
         */
        public Builder etag(java.lang.String etag) {
            this.etag = etag;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#id CloudfrontResponseHeadersPolicy#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getRemoveHeadersConfig}
         * @param removeHeadersConfig remove_headers_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#remove_headers_config CloudfrontResponseHeadersPolicy#remove_headers_config}
         * @return {@code this}
         */
        public Builder removeHeadersConfig(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyRemoveHeadersConfig removeHeadersConfig) {
            this.removeHeadersConfig = removeHeadersConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getSecurityHeadersConfig}
         * @param securityHeadersConfig security_headers_config block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#security_headers_config CloudfrontResponseHeadersPolicy#security_headers_config}
         * @return {@code this}
         */
        public Builder securityHeadersConfig(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig securityHeadersConfig) {
            this.securityHeadersConfig = securityHeadersConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getServerTimingHeadersConfig}
         * @param serverTimingHeadersConfig server_timing_headers_config block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#server_timing_headers_config CloudfrontResponseHeadersPolicy#server_timing_headers_config}
         * @return {@code this}
         */
        public Builder serverTimingHeadersConfig(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyServerTimingHeadersConfig serverTimingHeadersConfig) {
            this.serverTimingHeadersConfig = serverTimingHeadersConfig;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicyConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicyConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicyConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicyConfig {
        private final java.lang.String name;
        private final java.lang.String comment;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfig corsConfig;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCustomHeadersConfig customHeadersConfig;
        private final java.lang.String etag;
        private final java.lang.String id;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyRemoveHeadersConfig removeHeadersConfig;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig securityHeadersConfig;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyServerTimingHeadersConfig serverTimingHeadersConfig;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.comment = software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.corsConfig = software.amazon.jsii.Kernel.get(this, "corsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfig.class));
            this.customHeadersConfig = software.amazon.jsii.Kernel.get(this, "customHeadersConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCustomHeadersConfig.class));
            this.etag = software.amazon.jsii.Kernel.get(this, "etag", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.removeHeadersConfig = software.amazon.jsii.Kernel.get(this, "removeHeadersConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyRemoveHeadersConfig.class));
            this.securityHeadersConfig = software.amazon.jsii.Kernel.get(this, "securityHeadersConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig.class));
            this.serverTimingHeadersConfig = software.amazon.jsii.Kernel.get(this, "serverTimingHeadersConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyServerTimingHeadersConfig.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.comment = builder.comment;
            this.corsConfig = builder.corsConfig;
            this.customHeadersConfig = builder.customHeadersConfig;
            this.etag = builder.etag;
            this.id = builder.id;
            this.removeHeadersConfig = builder.removeHeadersConfig;
            this.securityHeadersConfig = builder.securityHeadersConfig;
            this.serverTimingHeadersConfig = builder.serverTimingHeadersConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getComment() {
            return this.comment;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfig getCorsConfig() {
            return this.corsConfig;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCustomHeadersConfig getCustomHeadersConfig() {
            return this.customHeadersConfig;
        }

        @Override
        public final java.lang.String getEtag() {
            return this.etag;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyRemoveHeadersConfig getRemoveHeadersConfig() {
            return this.removeHeadersConfig;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig getSecurityHeadersConfig() {
            return this.securityHeadersConfig;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyServerTimingHeadersConfig getServerTimingHeadersConfig() {
            return this.serverTimingHeadersConfig;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getComment() != null) {
                data.set("comment", om.valueToTree(this.getComment()));
            }
            if (this.getCorsConfig() != null) {
                data.set("corsConfig", om.valueToTree(this.getCorsConfig()));
            }
            if (this.getCustomHeadersConfig() != null) {
                data.set("customHeadersConfig", om.valueToTree(this.getCustomHeadersConfig()));
            }
            if (this.getEtag() != null) {
                data.set("etag", om.valueToTree(this.getEtag()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRemoveHeadersConfig() != null) {
                data.set("removeHeadersConfig", om.valueToTree(this.getRemoveHeadersConfig()));
            }
            if (this.getSecurityHeadersConfig() != null) {
                data.set("securityHeadersConfig", om.valueToTree(this.getSecurityHeadersConfig()));
            }
            if (this.getServerTimingHeadersConfig() != null) {
                data.set("serverTimingHeadersConfig", om.valueToTree(this.getServerTimingHeadersConfig()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicyConfig.Jsii$Proxy that = (CloudfrontResponseHeadersPolicyConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.comment != null ? !this.comment.equals(that.comment) : that.comment != null) return false;
            if (this.corsConfig != null ? !this.corsConfig.equals(that.corsConfig) : that.corsConfig != null) return false;
            if (this.customHeadersConfig != null ? !this.customHeadersConfig.equals(that.customHeadersConfig) : that.customHeadersConfig != null) return false;
            if (this.etag != null ? !this.etag.equals(that.etag) : that.etag != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.removeHeadersConfig != null ? !this.removeHeadersConfig.equals(that.removeHeadersConfig) : that.removeHeadersConfig != null) return false;
            if (this.securityHeadersConfig != null ? !this.securityHeadersConfig.equals(that.securityHeadersConfig) : that.securityHeadersConfig != null) return false;
            if (this.serverTimingHeadersConfig != null ? !this.serverTimingHeadersConfig.equals(that.serverTimingHeadersConfig) : that.serverTimingHeadersConfig != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.comment != null ? this.comment.hashCode() : 0);
            result = 31 * result + (this.corsConfig != null ? this.corsConfig.hashCode() : 0);
            result = 31 * result + (this.customHeadersConfig != null ? this.customHeadersConfig.hashCode() : 0);
            result = 31 * result + (this.etag != null ? this.etag.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.removeHeadersConfig != null ? this.removeHeadersConfig.hashCode() : 0);
            result = 31 * result + (this.securityHeadersConfig != null ? this.securityHeadersConfig.hashCode() : 0);
            result = 31 * result + (this.serverTimingHeadersConfig != null ? this.serverTimingHeadersConfig.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
