package imports.aws.paymentcryptography_key;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.051Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.paymentcryptographyKey.PaymentcryptographyKeyKeyAttributesKeyModesOfUse")
@software.amazon.jsii.Jsii.Proxy(PaymentcryptographyKeyKeyAttributesKeyModesOfUse.Jsii$Proxy.class)
public interface PaymentcryptographyKeyKeyAttributesKeyModesOfUse extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#decrypt PaymentcryptographyKey#decrypt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDecrypt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#derive_key PaymentcryptographyKey#derive_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeriveKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#encrypt PaymentcryptographyKey#encrypt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncrypt() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#generate PaymentcryptographyKey#generate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGenerate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#no_restrictions PaymentcryptographyKey#no_restrictions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNoRestrictions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#sign PaymentcryptographyKey#sign}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSign() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#unwrap PaymentcryptographyKey#unwrap}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUnwrap() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#verify PaymentcryptographyKey#verify}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVerify() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#wrap PaymentcryptographyKey#wrap}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWrap() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PaymentcryptographyKeyKeyAttributesKeyModesOfUse> {
        java.lang.Object decrypt;
        java.lang.Object deriveKey;
        java.lang.Object encrypt;
        java.lang.Object generate;
        java.lang.Object noRestrictions;
        java.lang.Object sign;
        java.lang.Object unwrap;
        java.lang.Object verify;
        java.lang.Object wrap;

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getDecrypt}
         * @param decrypt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#decrypt PaymentcryptographyKey#decrypt}.
         * @return {@code this}
         */
        public Builder decrypt(java.lang.Boolean decrypt) {
            this.decrypt = decrypt;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getDecrypt}
         * @param decrypt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#decrypt PaymentcryptographyKey#decrypt}.
         * @return {@code this}
         */
        public Builder decrypt(com.hashicorp.cdktf.IResolvable decrypt) {
            this.decrypt = decrypt;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getDeriveKey}
         * @param deriveKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#derive_key PaymentcryptographyKey#derive_key}.
         * @return {@code this}
         */
        public Builder deriveKey(java.lang.Boolean deriveKey) {
            this.deriveKey = deriveKey;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getDeriveKey}
         * @param deriveKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#derive_key PaymentcryptographyKey#derive_key}.
         * @return {@code this}
         */
        public Builder deriveKey(com.hashicorp.cdktf.IResolvable deriveKey) {
            this.deriveKey = deriveKey;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getEncrypt}
         * @param encrypt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#encrypt PaymentcryptographyKey#encrypt}.
         * @return {@code this}
         */
        public Builder encrypt(java.lang.Boolean encrypt) {
            this.encrypt = encrypt;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getEncrypt}
         * @param encrypt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#encrypt PaymentcryptographyKey#encrypt}.
         * @return {@code this}
         */
        public Builder encrypt(com.hashicorp.cdktf.IResolvable encrypt) {
            this.encrypt = encrypt;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getGenerate}
         * @param generate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#generate PaymentcryptographyKey#generate}.
         * @return {@code this}
         */
        public Builder generate(java.lang.Boolean generate) {
            this.generate = generate;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getGenerate}
         * @param generate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#generate PaymentcryptographyKey#generate}.
         * @return {@code this}
         */
        public Builder generate(com.hashicorp.cdktf.IResolvable generate) {
            this.generate = generate;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getNoRestrictions}
         * @param noRestrictions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#no_restrictions PaymentcryptographyKey#no_restrictions}.
         * @return {@code this}
         */
        public Builder noRestrictions(java.lang.Boolean noRestrictions) {
            this.noRestrictions = noRestrictions;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getNoRestrictions}
         * @param noRestrictions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#no_restrictions PaymentcryptographyKey#no_restrictions}.
         * @return {@code this}
         */
        public Builder noRestrictions(com.hashicorp.cdktf.IResolvable noRestrictions) {
            this.noRestrictions = noRestrictions;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getSign}
         * @param sign Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#sign PaymentcryptographyKey#sign}.
         * @return {@code this}
         */
        public Builder sign(java.lang.Boolean sign) {
            this.sign = sign;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getSign}
         * @param sign Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#sign PaymentcryptographyKey#sign}.
         * @return {@code this}
         */
        public Builder sign(com.hashicorp.cdktf.IResolvable sign) {
            this.sign = sign;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getUnwrap}
         * @param unwrap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#unwrap PaymentcryptographyKey#unwrap}.
         * @return {@code this}
         */
        public Builder unwrap(java.lang.Boolean unwrap) {
            this.unwrap = unwrap;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getUnwrap}
         * @param unwrap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#unwrap PaymentcryptographyKey#unwrap}.
         * @return {@code this}
         */
        public Builder unwrap(com.hashicorp.cdktf.IResolvable unwrap) {
            this.unwrap = unwrap;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getVerify}
         * @param verify Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#verify PaymentcryptographyKey#verify}.
         * @return {@code this}
         */
        public Builder verify(java.lang.Boolean verify) {
            this.verify = verify;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getVerify}
         * @param verify Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#verify PaymentcryptographyKey#verify}.
         * @return {@code this}
         */
        public Builder verify(com.hashicorp.cdktf.IResolvable verify) {
            this.verify = verify;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getWrap}
         * @param wrap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#wrap PaymentcryptographyKey#wrap}.
         * @return {@code this}
         */
        public Builder wrap(java.lang.Boolean wrap) {
            this.wrap = wrap;
            return this;
        }

        /**
         * Sets the value of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse#getWrap}
         * @param wrap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/paymentcryptography_key#wrap PaymentcryptographyKey#wrap}.
         * @return {@code this}
         */
        public Builder wrap(com.hashicorp.cdktf.IResolvable wrap) {
            this.wrap = wrap;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PaymentcryptographyKeyKeyAttributesKeyModesOfUse build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PaymentcryptographyKeyKeyAttributesKeyModesOfUse}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PaymentcryptographyKeyKeyAttributesKeyModesOfUse {
        private final java.lang.Object decrypt;
        private final java.lang.Object deriveKey;
        private final java.lang.Object encrypt;
        private final java.lang.Object generate;
        private final java.lang.Object noRestrictions;
        private final java.lang.Object sign;
        private final java.lang.Object unwrap;
        private final java.lang.Object verify;
        private final java.lang.Object wrap;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.decrypt = software.amazon.jsii.Kernel.get(this, "decrypt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deriveKey = software.amazon.jsii.Kernel.get(this, "deriveKey", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.encrypt = software.amazon.jsii.Kernel.get(this, "encrypt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.generate = software.amazon.jsii.Kernel.get(this, "generate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.noRestrictions = software.amazon.jsii.Kernel.get(this, "noRestrictions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sign = software.amazon.jsii.Kernel.get(this, "sign", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.unwrap = software.amazon.jsii.Kernel.get(this, "unwrap", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.verify = software.amazon.jsii.Kernel.get(this, "verify", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.wrap = software.amazon.jsii.Kernel.get(this, "wrap", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.decrypt = builder.decrypt;
            this.deriveKey = builder.deriveKey;
            this.encrypt = builder.encrypt;
            this.generate = builder.generate;
            this.noRestrictions = builder.noRestrictions;
            this.sign = builder.sign;
            this.unwrap = builder.unwrap;
            this.verify = builder.verify;
            this.wrap = builder.wrap;
        }

        @Override
        public final java.lang.Object getDecrypt() {
            return this.decrypt;
        }

        @Override
        public final java.lang.Object getDeriveKey() {
            return this.deriveKey;
        }

        @Override
        public final java.lang.Object getEncrypt() {
            return this.encrypt;
        }

        @Override
        public final java.lang.Object getGenerate() {
            return this.generate;
        }

        @Override
        public final java.lang.Object getNoRestrictions() {
            return this.noRestrictions;
        }

        @Override
        public final java.lang.Object getSign() {
            return this.sign;
        }

        @Override
        public final java.lang.Object getUnwrap() {
            return this.unwrap;
        }

        @Override
        public final java.lang.Object getVerify() {
            return this.verify;
        }

        @Override
        public final java.lang.Object getWrap() {
            return this.wrap;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDecrypt() != null) {
                data.set("decrypt", om.valueToTree(this.getDecrypt()));
            }
            if (this.getDeriveKey() != null) {
                data.set("deriveKey", om.valueToTree(this.getDeriveKey()));
            }
            if (this.getEncrypt() != null) {
                data.set("encrypt", om.valueToTree(this.getEncrypt()));
            }
            if (this.getGenerate() != null) {
                data.set("generate", om.valueToTree(this.getGenerate()));
            }
            if (this.getNoRestrictions() != null) {
                data.set("noRestrictions", om.valueToTree(this.getNoRestrictions()));
            }
            if (this.getSign() != null) {
                data.set("sign", om.valueToTree(this.getSign()));
            }
            if (this.getUnwrap() != null) {
                data.set("unwrap", om.valueToTree(this.getUnwrap()));
            }
            if (this.getVerify() != null) {
                data.set("verify", om.valueToTree(this.getVerify()));
            }
            if (this.getWrap() != null) {
                data.set("wrap", om.valueToTree(this.getWrap()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.paymentcryptographyKey.PaymentcryptographyKeyKeyAttributesKeyModesOfUse"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PaymentcryptographyKeyKeyAttributesKeyModesOfUse.Jsii$Proxy that = (PaymentcryptographyKeyKeyAttributesKeyModesOfUse.Jsii$Proxy) o;

            if (this.decrypt != null ? !this.decrypt.equals(that.decrypt) : that.decrypt != null) return false;
            if (this.deriveKey != null ? !this.deriveKey.equals(that.deriveKey) : that.deriveKey != null) return false;
            if (this.encrypt != null ? !this.encrypt.equals(that.encrypt) : that.encrypt != null) return false;
            if (this.generate != null ? !this.generate.equals(that.generate) : that.generate != null) return false;
            if (this.noRestrictions != null ? !this.noRestrictions.equals(that.noRestrictions) : that.noRestrictions != null) return false;
            if (this.sign != null ? !this.sign.equals(that.sign) : that.sign != null) return false;
            if (this.unwrap != null ? !this.unwrap.equals(that.unwrap) : that.unwrap != null) return false;
            if (this.verify != null ? !this.verify.equals(that.verify) : that.verify != null) return false;
            return this.wrap != null ? this.wrap.equals(that.wrap) : that.wrap == null;
        }

        @Override
        public final int hashCode() {
            int result = this.decrypt != null ? this.decrypt.hashCode() : 0;
            result = 31 * result + (this.deriveKey != null ? this.deriveKey.hashCode() : 0);
            result = 31 * result + (this.encrypt != null ? this.encrypt.hashCode() : 0);
            result = 31 * result + (this.generate != null ? this.generate.hashCode() : 0);
            result = 31 * result + (this.noRestrictions != null ? this.noRestrictions.hashCode() : 0);
            result = 31 * result + (this.sign != null ? this.sign.hashCode() : 0);
            result = 31 * result + (this.unwrap != null ? this.unwrap.hashCode() : 0);
            result = 31 * result + (this.verify != null ? this.verify.hashCode() : 0);
            result = 31 * result + (this.wrap != null ? this.wrap.hashCode() : 0);
            return result;
        }
    }
}
