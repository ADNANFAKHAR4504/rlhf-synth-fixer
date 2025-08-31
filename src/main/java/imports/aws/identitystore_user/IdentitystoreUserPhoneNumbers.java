package imports.aws.identitystore_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.347Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.identitystoreUser.IdentitystoreUserPhoneNumbers")
@software.amazon.jsii.Jsii.Proxy(IdentitystoreUserPhoneNumbers.Jsii$Proxy.class)
public interface IdentitystoreUserPhoneNumbers extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#primary IdentitystoreUser#primary}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrimary() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#type IdentitystoreUser#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#value IdentitystoreUser#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link IdentitystoreUserPhoneNumbers}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IdentitystoreUserPhoneNumbers}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IdentitystoreUserPhoneNumbers> {
        java.lang.Object primary;
        java.lang.String type;
        java.lang.String value;

        /**
         * Sets the value of {@link IdentitystoreUserPhoneNumbers#getPrimary}
         * @param primary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#primary IdentitystoreUser#primary}.
         * @return {@code this}
         */
        public Builder primary(java.lang.Boolean primary) {
            this.primary = primary;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserPhoneNumbers#getPrimary}
         * @param primary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#primary IdentitystoreUser#primary}.
         * @return {@code this}
         */
        public Builder primary(com.hashicorp.cdktf.IResolvable primary) {
            this.primary = primary;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserPhoneNumbers#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#type IdentitystoreUser#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link IdentitystoreUserPhoneNumbers#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/identitystore_user#value IdentitystoreUser#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IdentitystoreUserPhoneNumbers}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IdentitystoreUserPhoneNumbers build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IdentitystoreUserPhoneNumbers}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IdentitystoreUserPhoneNumbers {
        private final java.lang.Object primary;
        private final java.lang.String type;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.primary = software.amazon.jsii.Kernel.get(this, "primary", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.primary = builder.primary;
            this.type = builder.type;
            this.value = builder.value;
        }

        @Override
        public final java.lang.Object getPrimary() {
            return this.primary;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPrimary() != null) {
                data.set("primary", om.valueToTree(this.getPrimary()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.identitystoreUser.IdentitystoreUserPhoneNumbers"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IdentitystoreUserPhoneNumbers.Jsii$Proxy that = (IdentitystoreUserPhoneNumbers.Jsii$Proxy) o;

            if (this.primary != null ? !this.primary.equals(that.primary) : that.primary != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.primary != null ? this.primary.hashCode() : 0;
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
