package imports.aws.elasticache_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.177Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticacheUser.ElasticacheUserAuthenticationMode")
@software.amazon.jsii.Jsii.Proxy(ElasticacheUserAuthenticationMode.Jsii$Proxy.class)
public interface ElasticacheUserAuthenticationMode extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_user#type ElasticacheUser#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_user#passwords ElasticacheUser#passwords}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPasswords() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticacheUserAuthenticationMode}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticacheUserAuthenticationMode}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticacheUserAuthenticationMode> {
        java.lang.String type;
        java.util.List<java.lang.String> passwords;

        /**
         * Sets the value of {@link ElasticacheUserAuthenticationMode#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_user#type ElasticacheUser#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ElasticacheUserAuthenticationMode#getPasswords}
         * @param passwords Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticache_user#passwords ElasticacheUser#passwords}.
         * @return {@code this}
         */
        public Builder passwords(java.util.List<java.lang.String> passwords) {
            this.passwords = passwords;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticacheUserAuthenticationMode}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticacheUserAuthenticationMode build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticacheUserAuthenticationMode}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticacheUserAuthenticationMode {
        private final java.lang.String type;
        private final java.util.List<java.lang.String> passwords;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.passwords = software.amazon.jsii.Kernel.get(this, "passwords", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.passwords = builder.passwords;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.util.List<java.lang.String> getPasswords() {
            return this.passwords;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getPasswords() != null) {
                data.set("passwords", om.valueToTree(this.getPasswords()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticacheUser.ElasticacheUserAuthenticationMode"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticacheUserAuthenticationMode.Jsii$Proxy that = (ElasticacheUserAuthenticationMode.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.passwords != null ? this.passwords.equals(that.passwords) : that.passwords == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.passwords != null ? this.passwords.hashCode() : 0);
            return result;
        }
    }
}
