package imports.aws.appsync_resolver;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.077Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncResolver.AppsyncResolverCachingConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncResolverCachingConfig.Jsii$Proxy.class)
public interface AppsyncResolverCachingConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#caching_keys AppsyncResolver#caching_keys}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCachingKeys() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#ttl AppsyncResolver#ttl}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTtl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncResolverCachingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncResolverCachingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncResolverCachingConfig> {
        java.util.List<java.lang.String> cachingKeys;
        java.lang.Number ttl;

        /**
         * Sets the value of {@link AppsyncResolverCachingConfig#getCachingKeys}
         * @param cachingKeys Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#caching_keys AppsyncResolver#caching_keys}.
         * @return {@code this}
         */
        public Builder cachingKeys(java.util.List<java.lang.String> cachingKeys) {
            this.cachingKeys = cachingKeys;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverCachingConfig#getTtl}
         * @param ttl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#ttl AppsyncResolver#ttl}.
         * @return {@code this}
         */
        public Builder ttl(java.lang.Number ttl) {
            this.ttl = ttl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncResolverCachingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncResolverCachingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncResolverCachingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncResolverCachingConfig {
        private final java.util.List<java.lang.String> cachingKeys;
        private final java.lang.Number ttl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cachingKeys = software.amazon.jsii.Kernel.get(this, "cachingKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.ttl = software.amazon.jsii.Kernel.get(this, "ttl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cachingKeys = builder.cachingKeys;
            this.ttl = builder.ttl;
        }

        @Override
        public final java.util.List<java.lang.String> getCachingKeys() {
            return this.cachingKeys;
        }

        @Override
        public final java.lang.Number getTtl() {
            return this.ttl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCachingKeys() != null) {
                data.set("cachingKeys", om.valueToTree(this.getCachingKeys()));
            }
            if (this.getTtl() != null) {
                data.set("ttl", om.valueToTree(this.getTtl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncResolver.AppsyncResolverCachingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncResolverCachingConfig.Jsii$Proxy that = (AppsyncResolverCachingConfig.Jsii$Proxy) o;

            if (this.cachingKeys != null ? !this.cachingKeys.equals(that.cachingKeys) : that.cachingKeys != null) return false;
            return this.ttl != null ? this.ttl.equals(that.ttl) : that.ttl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cachingKeys != null ? this.cachingKeys.hashCode() : 0;
            result = 31 * result + (this.ttl != null ? this.ttl.hashCode() : 0);
            return result;
        }
    }
}
