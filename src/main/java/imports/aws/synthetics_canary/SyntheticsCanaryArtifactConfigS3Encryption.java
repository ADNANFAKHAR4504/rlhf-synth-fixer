package imports.aws.synthetics_canary;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.538Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanaryArtifactConfigS3Encryption")
@software.amazon.jsii.Jsii.Proxy(SyntheticsCanaryArtifactConfigS3Encryption.Jsii$Proxy.class)
public interface SyntheticsCanaryArtifactConfigS3Encryption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#encryption_mode SyntheticsCanary#encryption_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#kms_key_arn SyntheticsCanary#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SyntheticsCanaryArtifactConfigS3Encryption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SyntheticsCanaryArtifactConfigS3Encryption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SyntheticsCanaryArtifactConfigS3Encryption> {
        java.lang.String encryptionMode;
        java.lang.String kmsKeyArn;

        /**
         * Sets the value of {@link SyntheticsCanaryArtifactConfigS3Encryption#getEncryptionMode}
         * @param encryptionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#encryption_mode SyntheticsCanary#encryption_mode}.
         * @return {@code this}
         */
        public Builder encryptionMode(java.lang.String encryptionMode) {
            this.encryptionMode = encryptionMode;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanaryArtifactConfigS3Encryption#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#kms_key_arn SyntheticsCanary#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SyntheticsCanaryArtifactConfigS3Encryption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SyntheticsCanaryArtifactConfigS3Encryption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SyntheticsCanaryArtifactConfigS3Encryption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SyntheticsCanaryArtifactConfigS3Encryption {
        private final java.lang.String encryptionMode;
        private final java.lang.String kmsKeyArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionMode = software.amazon.jsii.Kernel.get(this, "encryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionMode = builder.encryptionMode;
            this.kmsKeyArn = builder.kmsKeyArn;
        }

        @Override
        public final java.lang.String getEncryptionMode() {
            return this.encryptionMode;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEncryptionMode() != null) {
                data.set("encryptionMode", om.valueToTree(this.getEncryptionMode()));
            }
            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.syntheticsCanary.SyntheticsCanaryArtifactConfigS3Encryption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SyntheticsCanaryArtifactConfigS3Encryption.Jsii$Proxy that = (SyntheticsCanaryArtifactConfigS3Encryption.Jsii$Proxy) o;

            if (this.encryptionMode != null ? !this.encryptionMode.equals(that.encryptionMode) : that.encryptionMode != null) return false;
            return this.kmsKeyArn != null ? this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionMode != null ? this.encryptionMode.hashCode() : 0;
            result = 31 * result + (this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0);
            return result;
        }
    }
}
