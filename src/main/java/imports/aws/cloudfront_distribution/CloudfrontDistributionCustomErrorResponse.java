package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.231Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionCustomErrorResponse")
@software.amazon.jsii.Jsii.Proxy(CloudfrontDistributionCustomErrorResponse.Jsii$Proxy.class)
public interface CloudfrontDistributionCustomErrorResponse extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#error_code CloudfrontDistribution#error_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getErrorCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#error_caching_min_ttl CloudfrontDistribution#error_caching_min_ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getErrorCachingMinTtl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#response_code CloudfrontDistribution#response_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getResponseCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#response_page_path CloudfrontDistribution#response_page_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResponsePagePath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudfrontDistributionCustomErrorResponse}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudfrontDistributionCustomErrorResponse}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudfrontDistributionCustomErrorResponse> {
        java.lang.Number errorCode;
        java.lang.Number errorCachingMinTtl;
        java.lang.Number responseCode;
        java.lang.String responsePagePath;

        /**
         * Sets the value of {@link CloudfrontDistributionCustomErrorResponse#getErrorCode}
         * @param errorCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#error_code CloudfrontDistribution#error_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder errorCode(java.lang.Number errorCode) {
            this.errorCode = errorCode;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionCustomErrorResponse#getErrorCachingMinTtl}
         * @param errorCachingMinTtl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#error_caching_min_ttl CloudfrontDistribution#error_caching_min_ttl}.
         * @return {@code this}
         */
        public Builder errorCachingMinTtl(java.lang.Number errorCachingMinTtl) {
            this.errorCachingMinTtl = errorCachingMinTtl;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionCustomErrorResponse#getResponseCode}
         * @param responseCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#response_code CloudfrontDistribution#response_code}.
         * @return {@code this}
         */
        public Builder responseCode(java.lang.Number responseCode) {
            this.responseCode = responseCode;
            return this;
        }

        /**
         * Sets the value of {@link CloudfrontDistributionCustomErrorResponse#getResponsePagePath}
         * @param responsePagePath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudfront_distribution#response_page_path CloudfrontDistribution#response_page_path}.
         * @return {@code this}
         */
        public Builder responsePagePath(java.lang.String responsePagePath) {
            this.responsePagePath = responsePagePath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudfrontDistributionCustomErrorResponse}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudfrontDistributionCustomErrorResponse build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudfrontDistributionCustomErrorResponse}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudfrontDistributionCustomErrorResponse {
        private final java.lang.Number errorCode;
        private final java.lang.Number errorCachingMinTtl;
        private final java.lang.Number responseCode;
        private final java.lang.String responsePagePath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.errorCode = software.amazon.jsii.Kernel.get(this, "errorCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.errorCachingMinTtl = software.amazon.jsii.Kernel.get(this, "errorCachingMinTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.responseCode = software.amazon.jsii.Kernel.get(this, "responseCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.responsePagePath = software.amazon.jsii.Kernel.get(this, "responsePagePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.errorCode = java.util.Objects.requireNonNull(builder.errorCode, "errorCode is required");
            this.errorCachingMinTtl = builder.errorCachingMinTtl;
            this.responseCode = builder.responseCode;
            this.responsePagePath = builder.responsePagePath;
        }

        @Override
        public final java.lang.Number getErrorCode() {
            return this.errorCode;
        }

        @Override
        public final java.lang.Number getErrorCachingMinTtl() {
            return this.errorCachingMinTtl;
        }

        @Override
        public final java.lang.Number getResponseCode() {
            return this.responseCode;
        }

        @Override
        public final java.lang.String getResponsePagePath() {
            return this.responsePagePath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("errorCode", om.valueToTree(this.getErrorCode()));
            if (this.getErrorCachingMinTtl() != null) {
                data.set("errorCachingMinTtl", om.valueToTree(this.getErrorCachingMinTtl()));
            }
            if (this.getResponseCode() != null) {
                data.set("responseCode", om.valueToTree(this.getResponseCode()));
            }
            if (this.getResponsePagePath() != null) {
                data.set("responsePagePath", om.valueToTree(this.getResponsePagePath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudfrontDistribution.CloudfrontDistributionCustomErrorResponse"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudfrontDistributionCustomErrorResponse.Jsii$Proxy that = (CloudfrontDistributionCustomErrorResponse.Jsii$Proxy) o;

            if (!errorCode.equals(that.errorCode)) return false;
            if (this.errorCachingMinTtl != null ? !this.errorCachingMinTtl.equals(that.errorCachingMinTtl) : that.errorCachingMinTtl != null) return false;
            if (this.responseCode != null ? !this.responseCode.equals(that.responseCode) : that.responseCode != null) return false;
            return this.responsePagePath != null ? this.responsePagePath.equals(that.responsePagePath) : that.responsePagePath == null;
        }

        @Override
        public final int hashCode() {
            int result = this.errorCode.hashCode();
            result = 31 * result + (this.errorCachingMinTtl != null ? this.errorCachingMinTtl.hashCode() : 0);
            result = 31 * result + (this.responseCode != null ? this.responseCode.hashCode() : 0);
            result = 31 * result + (this.responsePagePath != null ? this.responsePagePath.hashCode() : 0);
            return result;
        }
    }
}
