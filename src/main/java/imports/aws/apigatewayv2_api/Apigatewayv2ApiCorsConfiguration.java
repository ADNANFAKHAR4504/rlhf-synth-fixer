package imports.aws.apigatewayv2_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.962Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Api.Apigatewayv2ApiCorsConfiguration")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2ApiCorsConfiguration.Jsii$Proxy.class)
public interface Apigatewayv2ApiCorsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_credentials Apigatewayv2Api#allow_credentials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_headers Apigatewayv2Api#allow_headers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowHeaders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_methods Apigatewayv2Api#allow_methods}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowMethods() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_origins Apigatewayv2Api#allow_origins}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowOrigins() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#expose_headers Apigatewayv2Api#expose_headers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExposeHeaders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#max_age Apigatewayv2Api#max_age}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxAge() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2ApiCorsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2ApiCorsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2ApiCorsConfiguration> {
        java.lang.Object allowCredentials;
        java.util.List<java.lang.String> allowHeaders;
        java.util.List<java.lang.String> allowMethods;
        java.util.List<java.lang.String> allowOrigins;
        java.util.List<java.lang.String> exposeHeaders;
        java.lang.Number maxAge;

        /**
         * Sets the value of {@link Apigatewayv2ApiCorsConfiguration#getAllowCredentials}
         * @param allowCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_credentials Apigatewayv2Api#allow_credentials}.
         * @return {@code this}
         */
        public Builder allowCredentials(java.lang.Boolean allowCredentials) {
            this.allowCredentials = allowCredentials;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiCorsConfiguration#getAllowCredentials}
         * @param allowCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_credentials Apigatewayv2Api#allow_credentials}.
         * @return {@code this}
         */
        public Builder allowCredentials(com.hashicorp.cdktf.IResolvable allowCredentials) {
            this.allowCredentials = allowCredentials;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiCorsConfiguration#getAllowHeaders}
         * @param allowHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_headers Apigatewayv2Api#allow_headers}.
         * @return {@code this}
         */
        public Builder allowHeaders(java.util.List<java.lang.String> allowHeaders) {
            this.allowHeaders = allowHeaders;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiCorsConfiguration#getAllowMethods}
         * @param allowMethods Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_methods Apigatewayv2Api#allow_methods}.
         * @return {@code this}
         */
        public Builder allowMethods(java.util.List<java.lang.String> allowMethods) {
            this.allowMethods = allowMethods;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiCorsConfiguration#getAllowOrigins}
         * @param allowOrigins Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#allow_origins Apigatewayv2Api#allow_origins}.
         * @return {@code this}
         */
        public Builder allowOrigins(java.util.List<java.lang.String> allowOrigins) {
            this.allowOrigins = allowOrigins;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiCorsConfiguration#getExposeHeaders}
         * @param exposeHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#expose_headers Apigatewayv2Api#expose_headers}.
         * @return {@code this}
         */
        public Builder exposeHeaders(java.util.List<java.lang.String> exposeHeaders) {
            this.exposeHeaders = exposeHeaders;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiCorsConfiguration#getMaxAge}
         * @param maxAge Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#max_age Apigatewayv2Api#max_age}.
         * @return {@code this}
         */
        public Builder maxAge(java.lang.Number maxAge) {
            this.maxAge = maxAge;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Apigatewayv2ApiCorsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2ApiCorsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2ApiCorsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2ApiCorsConfiguration {
        private final java.lang.Object allowCredentials;
        private final java.util.List<java.lang.String> allowHeaders;
        private final java.util.List<java.lang.String> allowMethods;
        private final java.util.List<java.lang.String> allowOrigins;
        private final java.util.List<java.lang.String> exposeHeaders;
        private final java.lang.Number maxAge;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowCredentials = software.amazon.jsii.Kernel.get(this, "allowCredentials", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowHeaders = software.amazon.jsii.Kernel.get(this, "allowHeaders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allowMethods = software.amazon.jsii.Kernel.get(this, "allowMethods", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allowOrigins = software.amazon.jsii.Kernel.get(this, "allowOrigins", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.exposeHeaders = software.amazon.jsii.Kernel.get(this, "exposeHeaders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.maxAge = software.amazon.jsii.Kernel.get(this, "maxAge", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowCredentials = builder.allowCredentials;
            this.allowHeaders = builder.allowHeaders;
            this.allowMethods = builder.allowMethods;
            this.allowOrigins = builder.allowOrigins;
            this.exposeHeaders = builder.exposeHeaders;
            this.maxAge = builder.maxAge;
        }

        @Override
        public final java.lang.Object getAllowCredentials() {
            return this.allowCredentials;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowHeaders() {
            return this.allowHeaders;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowMethods() {
            return this.allowMethods;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowOrigins() {
            return this.allowOrigins;
        }

        @Override
        public final java.util.List<java.lang.String> getExposeHeaders() {
            return this.exposeHeaders;
        }

        @Override
        public final java.lang.Number getMaxAge() {
            return this.maxAge;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowCredentials() != null) {
                data.set("allowCredentials", om.valueToTree(this.getAllowCredentials()));
            }
            if (this.getAllowHeaders() != null) {
                data.set("allowHeaders", om.valueToTree(this.getAllowHeaders()));
            }
            if (this.getAllowMethods() != null) {
                data.set("allowMethods", om.valueToTree(this.getAllowMethods()));
            }
            if (this.getAllowOrigins() != null) {
                data.set("allowOrigins", om.valueToTree(this.getAllowOrigins()));
            }
            if (this.getExposeHeaders() != null) {
                data.set("exposeHeaders", om.valueToTree(this.getExposeHeaders()));
            }
            if (this.getMaxAge() != null) {
                data.set("maxAge", om.valueToTree(this.getMaxAge()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Api.Apigatewayv2ApiCorsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2ApiCorsConfiguration.Jsii$Proxy that = (Apigatewayv2ApiCorsConfiguration.Jsii$Proxy) o;

            if (this.allowCredentials != null ? !this.allowCredentials.equals(that.allowCredentials) : that.allowCredentials != null) return false;
            if (this.allowHeaders != null ? !this.allowHeaders.equals(that.allowHeaders) : that.allowHeaders != null) return false;
            if (this.allowMethods != null ? !this.allowMethods.equals(that.allowMethods) : that.allowMethods != null) return false;
            if (this.allowOrigins != null ? !this.allowOrigins.equals(that.allowOrigins) : that.allowOrigins != null) return false;
            if (this.exposeHeaders != null ? !this.exposeHeaders.equals(that.exposeHeaders) : that.exposeHeaders != null) return false;
            return this.maxAge != null ? this.maxAge.equals(that.maxAge) : that.maxAge == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowCredentials != null ? this.allowCredentials.hashCode() : 0;
            result = 31 * result + (this.allowHeaders != null ? this.allowHeaders.hashCode() : 0);
            result = 31 * result + (this.allowMethods != null ? this.allowMethods.hashCode() : 0);
            result = 31 * result + (this.allowOrigins != null ? this.allowOrigins.hashCode() : 0);
            result = 31 * result + (this.exposeHeaders != null ? this.exposeHeaders.hashCode() : 0);
            result = 31 * result + (this.maxAge != null ? this.maxAge.hashCode() : 0);
            return result;
        }
    }
}
