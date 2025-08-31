package imports.aws.s3_bucket_cors_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.254Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketCorsConfiguration.S3BucketCorsConfigurationCorsRule")
@software.amazon.jsii.Jsii.Proxy(S3BucketCorsConfigurationCorsRule.Jsii$Proxy.class)
public interface S3BucketCorsConfigurationCorsRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#allowed_methods S3BucketCorsConfiguration#allowed_methods}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedMethods();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#allowed_origins S3BucketCorsConfiguration#allowed_origins}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAllowedOrigins();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#allowed_headers S3BucketCorsConfiguration#allowed_headers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedHeaders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#expose_headers S3BucketCorsConfiguration#expose_headers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExposeHeaders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#id S3BucketCorsConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#max_age_seconds S3BucketCorsConfiguration#max_age_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxAgeSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketCorsConfigurationCorsRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketCorsConfigurationCorsRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketCorsConfigurationCorsRule> {
        java.util.List<java.lang.String> allowedMethods;
        java.util.List<java.lang.String> allowedOrigins;
        java.util.List<java.lang.String> allowedHeaders;
        java.util.List<java.lang.String> exposeHeaders;
        java.lang.String id;
        java.lang.Number maxAgeSeconds;

        /**
         * Sets the value of {@link S3BucketCorsConfigurationCorsRule#getAllowedMethods}
         * @param allowedMethods Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#allowed_methods S3BucketCorsConfiguration#allowed_methods}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowedMethods(java.util.List<java.lang.String> allowedMethods) {
            this.allowedMethods = allowedMethods;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketCorsConfigurationCorsRule#getAllowedOrigins}
         * @param allowedOrigins Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#allowed_origins S3BucketCorsConfiguration#allowed_origins}. This parameter is required.
         * @return {@code this}
         */
        public Builder allowedOrigins(java.util.List<java.lang.String> allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketCorsConfigurationCorsRule#getAllowedHeaders}
         * @param allowedHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#allowed_headers S3BucketCorsConfiguration#allowed_headers}.
         * @return {@code this}
         */
        public Builder allowedHeaders(java.util.List<java.lang.String> allowedHeaders) {
            this.allowedHeaders = allowedHeaders;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketCorsConfigurationCorsRule#getExposeHeaders}
         * @param exposeHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#expose_headers S3BucketCorsConfiguration#expose_headers}.
         * @return {@code this}
         */
        public Builder exposeHeaders(java.util.List<java.lang.String> exposeHeaders) {
            this.exposeHeaders = exposeHeaders;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketCorsConfigurationCorsRule#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#id S3BucketCorsConfiguration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketCorsConfigurationCorsRule#getMaxAgeSeconds}
         * @param maxAgeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_cors_configuration#max_age_seconds S3BucketCorsConfiguration#max_age_seconds}.
         * @return {@code this}
         */
        public Builder maxAgeSeconds(java.lang.Number maxAgeSeconds) {
            this.maxAgeSeconds = maxAgeSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketCorsConfigurationCorsRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketCorsConfigurationCorsRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketCorsConfigurationCorsRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketCorsConfigurationCorsRule {
        private final java.util.List<java.lang.String> allowedMethods;
        private final java.util.List<java.lang.String> allowedOrigins;
        private final java.util.List<java.lang.String> allowedHeaders;
        private final java.util.List<java.lang.String> exposeHeaders;
        private final java.lang.String id;
        private final java.lang.Number maxAgeSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowedMethods = software.amazon.jsii.Kernel.get(this, "allowedMethods", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allowedOrigins = software.amazon.jsii.Kernel.get(this, "allowedOrigins", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allowedHeaders = software.amazon.jsii.Kernel.get(this, "allowedHeaders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.exposeHeaders = software.amazon.jsii.Kernel.get(this, "exposeHeaders", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxAgeSeconds = software.amazon.jsii.Kernel.get(this, "maxAgeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowedMethods = java.util.Objects.requireNonNull(builder.allowedMethods, "allowedMethods is required");
            this.allowedOrigins = java.util.Objects.requireNonNull(builder.allowedOrigins, "allowedOrigins is required");
            this.allowedHeaders = builder.allowedHeaders;
            this.exposeHeaders = builder.exposeHeaders;
            this.id = builder.id;
            this.maxAgeSeconds = builder.maxAgeSeconds;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedMethods() {
            return this.allowedMethods;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedOrigins() {
            return this.allowedOrigins;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedHeaders() {
            return this.allowedHeaders;
        }

        @Override
        public final java.util.List<java.lang.String> getExposeHeaders() {
            return this.exposeHeaders;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMaxAgeSeconds() {
            return this.maxAgeSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("allowedMethods", om.valueToTree(this.getAllowedMethods()));
            data.set("allowedOrigins", om.valueToTree(this.getAllowedOrigins()));
            if (this.getAllowedHeaders() != null) {
                data.set("allowedHeaders", om.valueToTree(this.getAllowedHeaders()));
            }
            if (this.getExposeHeaders() != null) {
                data.set("exposeHeaders", om.valueToTree(this.getExposeHeaders()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaxAgeSeconds() != null) {
                data.set("maxAgeSeconds", om.valueToTree(this.getMaxAgeSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketCorsConfiguration.S3BucketCorsConfigurationCorsRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketCorsConfigurationCorsRule.Jsii$Proxy that = (S3BucketCorsConfigurationCorsRule.Jsii$Proxy) o;

            if (!allowedMethods.equals(that.allowedMethods)) return false;
            if (!allowedOrigins.equals(that.allowedOrigins)) return false;
            if (this.allowedHeaders != null ? !this.allowedHeaders.equals(that.allowedHeaders) : that.allowedHeaders != null) return false;
            if (this.exposeHeaders != null ? !this.exposeHeaders.equals(that.exposeHeaders) : that.exposeHeaders != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            return this.maxAgeSeconds != null ? this.maxAgeSeconds.equals(that.maxAgeSeconds) : that.maxAgeSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowedMethods.hashCode();
            result = 31 * result + (this.allowedOrigins.hashCode());
            result = 31 * result + (this.allowedHeaders != null ? this.allowedHeaders.hashCode() : 0);
            result = 31 * result + (this.exposeHeaders != null ? this.exposeHeaders.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maxAgeSeconds != null ? this.maxAgeSeconds.hashCode() : 0);
            return result;
        }
    }
}
