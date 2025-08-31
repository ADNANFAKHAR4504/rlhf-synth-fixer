package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.247Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyCorsConfig")
@software.amazon.jsii.Jsii.Proxy(CloudfrontResponseHeadersPolicyCorsConfig.Jsii$Proxy.class)
public interface CloudfrontResponseHeadersPolicyCorsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_credentials CloudfrontResponseHeadersPolicy#access_control_allow_credentials}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAccessControlAllowCredentials();

    /**
     * access_control_allow_headers block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_headers CloudfrontResponseHeadersPolicy#access_control_allow_headers}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowHeaders getAccessControlAllowHeaders();

    /**
     * access_control_allow_methods block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_methods CloudfrontResponseHeadersPolicy#access_control_allow_methods}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowMethods getAccessControlAllowMethods();

    /**
     * access_control_allow_origins block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_origins CloudfrontResponseHeadersPolicy#access_control_allow_origins}
     */
    @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowOrigins getAccessControlAllowOrigins();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#origin_override CloudfrontResponseHeadersPolicy#origin_override}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOriginOverride();

    /**
     * access_control_expose_headers block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_expose_headers CloudfrontResponseHeadersPolicy#access_control_expose_headers}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlExposeHeaders getAccessControlExposeHeaders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_max_age_sec CloudfrontResponseHeadersPolicy#access_control_max_age_sec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAccessControlMaxAgeSec() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontResponseHeadersPolicyCorsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontResponseHeadersPolicyCorsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontResponseHeadersPolicyCorsConfig> {
        java.lang.Object accessControlAllowCredentials;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowHeaders accessControlAllowHeaders;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowMethods accessControlAllowMethods;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowOrigins accessControlAllowOrigins;
        java.lang.Object originOverride;
        imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlExposeHeaders accessControlExposeHeaders;
        java.lang.Number accessControlMaxAgeSec;

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getAccessControlAllowCredentials}
         * @param accessControlAllowCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_credentials CloudfrontResponseHeadersPolicy#access_control_allow_credentials}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessControlAllowCredentials(java.lang.Boolean accessControlAllowCredentials) {
            this.accessControlAllowCredentials = accessControlAllowCredentials;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getAccessControlAllowCredentials}
         * @param accessControlAllowCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_credentials CloudfrontResponseHeadersPolicy#access_control_allow_credentials}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessControlAllowCredentials(com.hashicorp.cdktf.IResolvable accessControlAllowCredentials) {
            this.accessControlAllowCredentials = accessControlAllowCredentials;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getAccessControlAllowHeaders}
         * @param accessControlAllowHeaders access_control_allow_headers block. This parameter is required.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_headers CloudfrontResponseHeadersPolicy#access_control_allow_headers}
         * @return {@code this}
         */
        public Builder accessControlAllowHeaders(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowHeaders accessControlAllowHeaders) {
            this.accessControlAllowHeaders = accessControlAllowHeaders;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getAccessControlAllowMethods}
         * @param accessControlAllowMethods access_control_allow_methods block. This parameter is required.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_methods CloudfrontResponseHeadersPolicy#access_control_allow_methods}
         * @return {@code this}
         */
        public Builder accessControlAllowMethods(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowMethods accessControlAllowMethods) {
            this.accessControlAllowMethods = accessControlAllowMethods;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getAccessControlAllowOrigins}
         * @param accessControlAllowOrigins access_control_allow_origins block. This parameter is required.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_allow_origins CloudfrontResponseHeadersPolicy#access_control_allow_origins}
         * @return {@code this}
         */
        public Builder accessControlAllowOrigins(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowOrigins accessControlAllowOrigins) {
            this.accessControlAllowOrigins = accessControlAllowOrigins;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getOriginOverride}
         * @param originOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#origin_override CloudfrontResponseHeadersPolicy#origin_override}. This parameter is required.
         * @return {@code this}
         */
        public Builder originOverride(java.lang.Boolean originOverride) {
            this.originOverride = originOverride;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getOriginOverride}
         * @param originOverride Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#origin_override CloudfrontResponseHeadersPolicy#origin_override}. This parameter is required.
         * @return {@code this}
         */
        public Builder originOverride(com.hashicorp.cdktf.IResolvable originOverride) {
            this.originOverride = originOverride;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getAccessControlExposeHeaders}
         * @param accessControlExposeHeaders access_control_expose_headers block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_expose_headers CloudfrontResponseHeadersPolicy#access_control_expose_headers}
         * @return {@code this}
         */
        public Builder accessControlExposeHeaders(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlExposeHeaders accessControlExposeHeaders) {
            this.accessControlExposeHeaders = accessControlExposeHeaders;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontResponseHeadersPolicyCorsConfig#getAccessControlMaxAgeSec}
         * @param accessControlMaxAgeSec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_response_headers_policy#access_control_max_age_sec CloudfrontResponseHeadersPolicy#access_control_max_age_sec}.
         * @return {@code this}
         */
        public Builder accessControlMaxAgeSec(java.lang.Number accessControlMaxAgeSec) {
            this.accessControlMaxAgeSec = accessControlMaxAgeSec;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontResponseHeadersPolicyCorsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontResponseHeadersPolicyCorsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontResponseHeadersPolicyCorsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontResponseHeadersPolicyCorsConfig {
        private final java.lang.Object accessControlAllowCredentials;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowHeaders accessControlAllowHeaders;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowMethods accessControlAllowMethods;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowOrigins accessControlAllowOrigins;
        private final java.lang.Object originOverride;
        private final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlExposeHeaders accessControlExposeHeaders;
        private final java.lang.Number accessControlMaxAgeSec;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accessControlAllowCredentials = software.amazon.jsii.Kernel.get(this, "accessControlAllowCredentials", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.accessControlAllowHeaders = software.amazon.jsii.Kernel.get(this, "accessControlAllowHeaders", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowHeaders.class));
            this.accessControlAllowMethods = software.amazon.jsii.Kernel.get(this, "accessControlAllowMethods", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowMethods.class));
            this.accessControlAllowOrigins = software.amazon.jsii.Kernel.get(this, "accessControlAllowOrigins", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowOrigins.class));
            this.originOverride = software.amazon.jsii.Kernel.get(this, "originOverride", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.accessControlExposeHeaders = software.amazon.jsii.Kernel.get(this, "accessControlExposeHeaders", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlExposeHeaders.class));
            this.accessControlMaxAgeSec = software.amazon.jsii.Kernel.get(this, "accessControlMaxAgeSec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accessControlAllowCredentials = java.util.Objects.requireNonNull(builder.accessControlAllowCredentials, "accessControlAllowCredentials is required");
            this.accessControlAllowHeaders = java.util.Objects.requireNonNull(builder.accessControlAllowHeaders, "accessControlAllowHeaders is required");
            this.accessControlAllowMethods = java.util.Objects.requireNonNull(builder.accessControlAllowMethods, "accessControlAllowMethods is required");
            this.accessControlAllowOrigins = java.util.Objects.requireNonNull(builder.accessControlAllowOrigins, "accessControlAllowOrigins is required");
            this.originOverride = java.util.Objects.requireNonNull(builder.originOverride, "originOverride is required");
            this.accessControlExposeHeaders = builder.accessControlExposeHeaders;
            this.accessControlMaxAgeSec = builder.accessControlMaxAgeSec;
        }

        @Override
        public final java.lang.Object getAccessControlAllowCredentials() {
            return this.accessControlAllowCredentials;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowHeaders getAccessControlAllowHeaders() {
            return this.accessControlAllowHeaders;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowMethods getAccessControlAllowMethods() {
            return this.accessControlAllowMethods;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlAllowOrigins getAccessControlAllowOrigins() {
            return this.accessControlAllowOrigins;
        }

        @Override
        public final java.lang.Object getOriginOverride() {
            return this.originOverride;
        }

        @Override
        public final imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicyCorsConfigAccessControlExposeHeaders getAccessControlExposeHeaders() {
            return this.accessControlExposeHeaders;
        }

        @Override
        public final java.lang.Number getAccessControlMaxAgeSec() {
            return this.accessControlMaxAgeSec;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("accessControlAllowCredentials", om.valueToTree(this.getAccessControlAllowCredentials()));
            data.set("accessControlAllowHeaders", om.valueToTree(this.getAccessControlAllowHeaders()));
            data.set("accessControlAllowMethods", om.valueToTree(this.getAccessControlAllowMethods()));
            data.set("accessControlAllowOrigins", om.valueToTree(this.getAccessControlAllowOrigins()));
            data.set("originOverride", om.valueToTree(this.getOriginOverride()));
            if (this.getAccessControlExposeHeaders() != null) {
                data.set("accessControlExposeHeaders", om.valueToTree(this.getAccessControlExposeHeaders()));
            }
            if (this.getAccessControlMaxAgeSec() != null) {
                data.set("accessControlMaxAgeSec", om.valueToTree(this.getAccessControlMaxAgeSec()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicyCorsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontResponseHeadersPolicyCorsConfig.Jsii$Proxy that = (CloudfrontResponseHeadersPolicyCorsConfig.Jsii$Proxy) o;

            if (!accessControlAllowCredentials.equals(that.accessControlAllowCredentials)) return false;
            if (!accessControlAllowHeaders.equals(that.accessControlAllowHeaders)) return false;
            if (!accessControlAllowMethods.equals(that.accessControlAllowMethods)) return false;
            if (!accessControlAllowOrigins.equals(that.accessControlAllowOrigins)) return false;
            if (!originOverride.equals(that.originOverride)) return false;
            if (this.accessControlExposeHeaders != null ? !this.accessControlExposeHeaders.equals(that.accessControlExposeHeaders) : that.accessControlExposeHeaders != null) return false;
            return this.accessControlMaxAgeSec != null ? this.accessControlMaxAgeSec.equals(that.accessControlMaxAgeSec) : that.accessControlMaxAgeSec == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accessControlAllowCredentials.hashCode();
            result = 31 * result + (this.accessControlAllowHeaders.hashCode());
            result = 31 * result + (this.accessControlAllowMethods.hashCode());
            result = 31 * result + (this.accessControlAllowOrigins.hashCode());
            result = 31 * result + (this.originOverride.hashCode());
            result = 31 * result + (this.accessControlExposeHeaders != null ? this.accessControlExposeHeaders.hashCode() : 0);
            result = 31 * result + (this.accessControlMaxAgeSec != null ? this.accessControlMaxAgeSec.hashCode() : 0);
            return result;
        }
    }
}
