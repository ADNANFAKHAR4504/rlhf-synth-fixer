package imports.aws.provider;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.092Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.provider.AwsProviderIgnoreTags")
@software.amazon.jsii.Jsii.Proxy(AwsProviderIgnoreTags.Jsii$Proxy.class)
public interface AwsProviderIgnoreTags extends software.amazon.jsii.JsiiSerializable {

    /**
     * Resource tag key prefixes to ignore across all resources. Can also be configured with the TF_AWS_IGNORE_TAGS_KEY_PREFIXES environment variable.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#key_prefixes AwsProvider#key_prefixes}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getKeyPrefixes() {
        return null;
    }

    /**
     * Resource tag keys to ignore across all resources. Can also be configured with the TF_AWS_IGNORE_TAGS_KEYS environment variable.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#keys AwsProvider#keys}
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getKeys() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AwsProviderIgnoreTags}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AwsProviderIgnoreTags}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AwsProviderIgnoreTags> {
        java.util.List<java.lang.String> keyPrefixes;
        java.util.List<java.lang.String> keys;

        /**
         * Sets the value of {@link AwsProviderIgnoreTags#getKeyPrefixes}
         * @param keyPrefixes Resource tag key prefixes to ignore across all resources. Can also be configured with the TF_AWS_IGNORE_TAGS_KEY_PREFIXES environment variable.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#key_prefixes AwsProvider#key_prefixes}
         * @return {@code this}
         */
        public Builder keyPrefixes(java.util.List<java.lang.String> keyPrefixes) {
            this.keyPrefixes = keyPrefixes;
            return this;
        }

        /**
         * Sets the value of {@link AwsProviderIgnoreTags#getKeys}
         * @param keys Resource tag keys to ignore across all resources. Can also be configured with the TF_AWS_IGNORE_TAGS_KEYS environment variable.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs#keys AwsProvider#keys}
         * @return {@code this}
         */
        public Builder keys(java.util.List<java.lang.String> keys) {
            this.keys = keys;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AwsProviderIgnoreTags}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AwsProviderIgnoreTags build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AwsProviderIgnoreTags}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AwsProviderIgnoreTags {
        private final java.util.List<java.lang.String> keyPrefixes;
        private final java.util.List<java.lang.String> keys;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.keyPrefixes = software.amazon.jsii.Kernel.get(this, "keyPrefixes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.keys = software.amazon.jsii.Kernel.get(this, "keys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.keyPrefixes = builder.keyPrefixes;
            this.keys = builder.keys;
        }

        @Override
        public final java.util.List<java.lang.String> getKeyPrefixes() {
            return this.keyPrefixes;
        }

        @Override
        public final java.util.List<java.lang.String> getKeys() {
            return this.keys;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKeyPrefixes() != null) {
                data.set("keyPrefixes", om.valueToTree(this.getKeyPrefixes()));
            }
            if (this.getKeys() != null) {
                data.set("keys", om.valueToTree(this.getKeys()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.provider.AwsProviderIgnoreTags"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AwsProviderIgnoreTags.Jsii$Proxy that = (AwsProviderIgnoreTags.Jsii$Proxy) o;

            if (this.keyPrefixes != null ? !this.keyPrefixes.equals(that.keyPrefixes) : that.keyPrefixes != null) return false;
            return this.keys != null ? this.keys.equals(that.keys) : that.keys == null;
        }

        @Override
        public final int hashCode() {
            int result = this.keyPrefixes != null ? this.keyPrefixes.hashCode() : 0;
            result = 31 * result + (this.keys != null ? this.keys.hashCode() : 0);
            return result;
        }
    }
}
