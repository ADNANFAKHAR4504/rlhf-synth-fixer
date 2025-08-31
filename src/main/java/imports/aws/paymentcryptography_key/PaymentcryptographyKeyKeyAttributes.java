package imports.aws.paymentcryptography_key;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.051Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.paymentcryptographyKey.PaymentcryptographyKeyKeyAttributes")
@software.amazon.jsii.Jsii.Proxy(PaymentcryptographyKeyKeyAttributes.Jsii$Proxy.class)
public interface PaymentcryptographyKeyKeyAttributes extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_algorithm PaymentcryptographyKey#key_algorithm}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeyAlgorithm();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_class PaymentcryptographyKey#key_class}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeyClass();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_usage PaymentcryptographyKey#key_usage}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeyUsage();

    /**
     * key_modes_of_use block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_modes_of_use PaymentcryptographyKey#key_modes_of_use}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUse getKeyModesOfUse() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PaymentcryptographyKeyKeyAttributes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PaymentcryptographyKeyKeyAttributes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PaymentcryptographyKeyKeyAttributes> {
        java.lang.String keyAlgorithm;
        java.lang.String keyClass;
        java.lang.String keyUsage;
        imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUse keyModesOfUse;

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributes#getKeyAlgorithm}
         * @param keyAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_algorithm PaymentcryptographyKey#key_algorithm}. This parameter is required.
         * @return {@code this}
         */
        public Builder keyAlgorithm(java.lang.String keyAlgorithm) {
            this.keyAlgorithm = keyAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributes#getKeyClass}
         * @param keyClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_class PaymentcryptographyKey#key_class}. This parameter is required.
         * @return {@code this}
         */
        public Builder keyClass(java.lang.String keyClass) {
            this.keyClass = keyClass;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributes#getKeyUsage}
         * @param keyUsage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_usage PaymentcryptographyKey#key_usage}. This parameter is required.
         * @return {@code this}
         */
        public Builder keyUsage(java.lang.String keyUsage) {
            this.keyUsage = keyUsage;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributes#getKeyModesOfUse}
         * @param keyModesOfUse key_modes_of_use block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#key_modes_of_use PaymentcryptographyKey#key_modes_of_use}
         * @return {@code this}
         */
        public Builder keyModesOfUse(imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUse keyModesOfUse) {
            this.keyModesOfUse = keyModesOfUse;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PaymentcryptographyKeyKeyAttributes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PaymentcryptographyKeyKeyAttributes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PaymentcryptographyKeyKeyAttributes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PaymentcryptographyKeyKeyAttributes {
        private final java.lang.String keyAlgorithm;
        private final java.lang.String keyClass;
        private final java.lang.String keyUsage;
        private final imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUse keyModesOfUse;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.keyAlgorithm = software.amazon.jsii.Kernel.get(this, "keyAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyClass = software.amazon.jsii.Kernel.get(this, "keyClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyUsage = software.amazon.jsii.Kernel.get(this, "keyUsage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyModesOfUse = software.amazon.jsii.Kernel.get(this, "keyModesOfUse", software.amazon.jsii.NativeType.forClass(imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUse.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.keyAlgorithm = java.util.Objects.requireNonNull(builder.keyAlgorithm, "keyAlgorithm is required");
            this.keyClass = java.util.Objects.requireNonNull(builder.keyClass, "keyClass is required");
            this.keyUsage = java.util.Objects.requireNonNull(builder.keyUsage, "keyUsage is required");
            this.keyModesOfUse = builder.keyModesOfUse;
        }

        @Override
        public final java.lang.String getKeyAlgorithm() {
            return this.keyAlgorithm;
        }

        @Override
        public final java.lang.String getKeyClass() {
            return this.keyClass;
        }

        @Override
        public final java.lang.String getKeyUsage() {
            return this.keyUsage;
        }

        @Override
        public final imports.aws.paymentcryptography_key.PaymentcryptographyKeyKeyAttributesKeyModesOfUse getKeyModesOfUse() {
            return this.keyModesOfUse;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("keyAlgorithm", om.valueToTree(this.getKeyAlgorithm()));
            data.set("keyClass", om.valueToTree(this.getKeyClass()));
            data.set("keyUsage", om.valueToTree(this.getKeyUsage()));
            if (this.getKeyModesOfUse() != null) {
                data.set("keyModesOfUse", om.valueToTree(this.getKeyModesOfUse()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.paymentcryptographyKey.PaymentcryptographyKeyKeyAttributes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PaymentcryptographyKeyKeyAttributes.Jsii$Proxy that = (PaymentcryptographyKeyKeyAttributes.Jsii$Proxy) o;

            if (!keyAlgorithm.equals(that.keyAlgorithm)) return false;
            if (!keyClass.equals(that.keyClass)) return false;
            if (!keyUsage.equals(that.keyUsage)) return false;
            return this.keyModesOfUse != null ? this.keyModesOfUse.equals(that.keyModesOfUse) : that.keyModesOfUse == null;
        }

        @Override
        public final int hashCode() {
            int result = this.keyAlgorithm.hashCode();
            result = 31 * result + (this.keyClass.hashCode());
            result = 31 * result + (this.keyUsage.hashCode());
            result = 31 * result + (this.keyModesOfUse != null ? this.keyModesOfUse.hashCode() : 0);
            return result;
        }
    }
}
