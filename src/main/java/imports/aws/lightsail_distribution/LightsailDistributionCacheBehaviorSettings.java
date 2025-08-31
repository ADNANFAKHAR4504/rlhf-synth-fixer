package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.826Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettings")
@software.amazon.jsii.Jsii.Proxy(LightsailDistributionCacheBehaviorSettings.Jsii$Proxy.class)
public interface LightsailDistributionCacheBehaviorSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * The HTTP methods that are processed and forwarded to the distribution's origin.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#allowed_http_methods LightsailDistribution#allowed_http_methods}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAllowedHttpMethods() {
        return null;
    }

    /**
     * The HTTP method responses that are cached by your distribution.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cached_http_methods LightsailDistribution#cached_http_methods}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCachedHttpMethods() {
        return null;
    }

    /**
     * The default amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the content has been updated.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_ttl LightsailDistribution#default_ttl}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDefaultTtl() {
        return null;
    }

    /**
     * forwarded_cookies block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_cookies LightsailDistribution#forwarded_cookies}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies getForwardedCookies() {
        return null;
    }

    /**
     * forwarded_headers block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_headers LightsailDistribution#forwarded_headers}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders getForwardedHeaders() {
        return null;
    }

    /**
     * forwarded_query_strings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_query_strings LightsailDistribution#forwarded_query_strings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings getForwardedQueryStrings() {
        return null;
    }

    /**
     * The maximum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#maximum_ttl LightsailDistribution#maximum_ttl}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumTtl() {
        return null;
    }

    /**
     * The minimum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#minimum_ttl LightsailDistribution#minimum_ttl}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinimumTtl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailDistributionCacheBehaviorSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailDistributionCacheBehaviorSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailDistributionCacheBehaviorSettings> {
        java.lang.String allowedHttpMethods;
        java.lang.String cachedHttpMethods;
        java.lang.Number defaultTtl;
        imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies forwardedCookies;
        imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders forwardedHeaders;
        imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings forwardedQueryStrings;
        java.lang.Number maximumTtl;
        java.lang.Number minimumTtl;

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettings#getAllowedHttpMethods}
         * @param allowedHttpMethods The HTTP methods that are processed and forwarded to the distribution's origin.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#allowed_http_methods LightsailDistribution#allowed_http_methods}
         * @return {@code this}
         */
        public Builder allowedHttpMethods(java.lang.String allowedHttpMethods) {
            this.allowedHttpMethods = allowedHttpMethods;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettings#getCachedHttpMethods}
         * @param cachedHttpMethods The HTTP method responses that are cached by your distribution.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#cached_http_methods LightsailDistribution#cached_http_methods}
         * @return {@code this}
         */
        public Builder cachedHttpMethods(java.lang.String cachedHttpMethods) {
            this.cachedHttpMethods = cachedHttpMethods;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettings#getDefaultTtl}
         * @param defaultTtl The default amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the content has been updated.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#default_ttl LightsailDistribution#default_ttl}
         * @return {@code this}
         */
        public Builder defaultTtl(java.lang.Number defaultTtl) {
            this.defaultTtl = defaultTtl;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettings#getForwardedCookies}
         * @param forwardedCookies forwarded_cookies block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_cookies LightsailDistribution#forwarded_cookies}
         * @return {@code this}
         */
        public Builder forwardedCookies(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies forwardedCookies) {
            this.forwardedCookies = forwardedCookies;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettings#getForwardedHeaders}
         * @param forwardedHeaders forwarded_headers block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_headers LightsailDistribution#forwarded_headers}
         * @return {@code this}
         */
        public Builder forwardedHeaders(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders forwardedHeaders) {
            this.forwardedHeaders = forwardedHeaders;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettings#getForwardedQueryStrings}
         * @param forwardedQueryStrings forwarded_query_strings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#forwarded_query_strings LightsailDistribution#forwarded_query_strings}
         * @return {@code this}
         */
        public Builder forwardedQueryStrings(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings forwardedQueryStrings) {
            this.forwardedQueryStrings = forwardedQueryStrings;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettings#getMaximumTtl}
         * @param maximumTtl The maximum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#maximum_ttl LightsailDistribution#maximum_ttl}
         * @return {@code this}
         */
        public Builder maximumTtl(java.lang.Number maximumTtl) {
            this.maximumTtl = maximumTtl;
            return this;
        }

        /**
         * Sets the value of {@link LightsailDistributionCacheBehaviorSettings#getMinimumTtl}
         * @param minimumTtl The minimum amount of time that objects stay in the distribution's cache before the distribution forwards another request to the origin to determine whether the object has been updated.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_distribution#minimum_ttl LightsailDistribution#minimum_ttl}
         * @return {@code this}
         */
        public Builder minimumTtl(java.lang.Number minimumTtl) {
            this.minimumTtl = minimumTtl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailDistributionCacheBehaviorSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailDistributionCacheBehaviorSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailDistributionCacheBehaviorSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailDistributionCacheBehaviorSettings {
        private final java.lang.String allowedHttpMethods;
        private final java.lang.String cachedHttpMethods;
        private final java.lang.Number defaultTtl;
        private final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies forwardedCookies;
        private final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders forwardedHeaders;
        private final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings forwardedQueryStrings;
        private final java.lang.Number maximumTtl;
        private final java.lang.Number minimumTtl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowedHttpMethods = software.amazon.jsii.Kernel.get(this, "allowedHttpMethods", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cachedHttpMethods = software.amazon.jsii.Kernel.get(this, "cachedHttpMethods", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultTtl = software.amazon.jsii.Kernel.get(this, "defaultTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.forwardedCookies = software.amazon.jsii.Kernel.get(this, "forwardedCookies", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies.class));
            this.forwardedHeaders = software.amazon.jsii.Kernel.get(this, "forwardedHeaders", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders.class));
            this.forwardedQueryStrings = software.amazon.jsii.Kernel.get(this, "forwardedQueryStrings", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings.class));
            this.maximumTtl = software.amazon.jsii.Kernel.get(this, "maximumTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minimumTtl = software.amazon.jsii.Kernel.get(this, "minimumTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowedHttpMethods = builder.allowedHttpMethods;
            this.cachedHttpMethods = builder.cachedHttpMethods;
            this.defaultTtl = builder.defaultTtl;
            this.forwardedCookies = builder.forwardedCookies;
            this.forwardedHeaders = builder.forwardedHeaders;
            this.forwardedQueryStrings = builder.forwardedQueryStrings;
            this.maximumTtl = builder.maximumTtl;
            this.minimumTtl = builder.minimumTtl;
        }

        @Override
        public final java.lang.String getAllowedHttpMethods() {
            return this.allowedHttpMethods;
        }

        @Override
        public final java.lang.String getCachedHttpMethods() {
            return this.cachedHttpMethods;
        }

        @Override
        public final java.lang.Number getDefaultTtl() {
            return this.defaultTtl;
        }

        @Override
        public final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies getForwardedCookies() {
            return this.forwardedCookies;
        }

        @Override
        public final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders getForwardedHeaders() {
            return this.forwardedHeaders;
        }

        @Override
        public final imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings getForwardedQueryStrings() {
            return this.forwardedQueryStrings;
        }

        @Override
        public final java.lang.Number getMaximumTtl() {
            return this.maximumTtl;
        }

        @Override
        public final java.lang.Number getMinimumTtl() {
            return this.minimumTtl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowedHttpMethods() != null) {
                data.set("allowedHttpMethods", om.valueToTree(this.getAllowedHttpMethods()));
            }
            if (this.getCachedHttpMethods() != null) {
                data.set("cachedHttpMethods", om.valueToTree(this.getCachedHttpMethods()));
            }
            if (this.getDefaultTtl() != null) {
                data.set("defaultTtl", om.valueToTree(this.getDefaultTtl()));
            }
            if (this.getForwardedCookies() != null) {
                data.set("forwardedCookies", om.valueToTree(this.getForwardedCookies()));
            }
            if (this.getForwardedHeaders() != null) {
                data.set("forwardedHeaders", om.valueToTree(this.getForwardedHeaders()));
            }
            if (this.getForwardedQueryStrings() != null) {
                data.set("forwardedQueryStrings", om.valueToTree(this.getForwardedQueryStrings()));
            }
            if (this.getMaximumTtl() != null) {
                data.set("maximumTtl", om.valueToTree(this.getMaximumTtl()));
            }
            if (this.getMinimumTtl() != null) {
                data.set("minimumTtl", om.valueToTree(this.getMinimumTtl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailDistributionCacheBehaviorSettings.Jsii$Proxy that = (LightsailDistributionCacheBehaviorSettings.Jsii$Proxy) o;

            if (this.allowedHttpMethods != null ? !this.allowedHttpMethods.equals(that.allowedHttpMethods) : that.allowedHttpMethods != null) return false;
            if (this.cachedHttpMethods != null ? !this.cachedHttpMethods.equals(that.cachedHttpMethods) : that.cachedHttpMethods != null) return false;
            if (this.defaultTtl != null ? !this.defaultTtl.equals(that.defaultTtl) : that.defaultTtl != null) return false;
            if (this.forwardedCookies != null ? !this.forwardedCookies.equals(that.forwardedCookies) : that.forwardedCookies != null) return false;
            if (this.forwardedHeaders != null ? !this.forwardedHeaders.equals(that.forwardedHeaders) : that.forwardedHeaders != null) return false;
            if (this.forwardedQueryStrings != null ? !this.forwardedQueryStrings.equals(that.forwardedQueryStrings) : that.forwardedQueryStrings != null) return false;
            if (this.maximumTtl != null ? !this.maximumTtl.equals(that.maximumTtl) : that.maximumTtl != null) return false;
            return this.minimumTtl != null ? this.minimumTtl.equals(that.minimumTtl) : that.minimumTtl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowedHttpMethods != null ? this.allowedHttpMethods.hashCode() : 0;
            result = 31 * result + (this.cachedHttpMethods != null ? this.cachedHttpMethods.hashCode() : 0);
            result = 31 * result + (this.defaultTtl != null ? this.defaultTtl.hashCode() : 0);
            result = 31 * result + (this.forwardedCookies != null ? this.forwardedCookies.hashCode() : 0);
            result = 31 * result + (this.forwardedHeaders != null ? this.forwardedHeaders.hashCode() : 0);
            result = 31 * result + (this.forwardedQueryStrings != null ? this.forwardedQueryStrings.hashCode() : 0);
            result = 31 * result + (this.maximumTtl != null ? this.maximumTtl.hashCode() : 0);
            result = 31 * result + (this.minimumTtl != null ? this.minimumTtl.hashCode() : 0);
            return result;
        }
    }
}
