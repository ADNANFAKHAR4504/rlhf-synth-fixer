package imports.aws.synthetics_canary;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.538Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanaryArtifactConfig")
@software.amazon.jsii.Jsii.Proxy(SyntheticsCanaryArtifactConfig.Jsii$Proxy.class)
public interface SyntheticsCanaryArtifactConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_encryption SyntheticsCanary#s3_encryption}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption getS3Encryption() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SyntheticsCanaryArtifactConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SyntheticsCanaryArtifactConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SyntheticsCanaryArtifactConfig> {
        imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption s3Encryption;

        /**
         * Sets the value of {@link SyntheticsCanaryArtifactConfig#getS3Encryption}
         * @param s3Encryption s3_encryption block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#s3_encryption SyntheticsCanary#s3_encryption}
         * @return {@code this}
         */
        public Builder s3Encryption(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption s3Encryption) {
            this.s3Encryption = s3Encryption;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SyntheticsCanaryArtifactConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SyntheticsCanaryArtifactConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SyntheticsCanaryArtifactConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SyntheticsCanaryArtifactConfig {
        private final imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption s3Encryption;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Encryption = software.amazon.jsii.Kernel.get(this, "s3Encryption", software.amazon.jsii.NativeType.forClass(imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Encryption = builder.s3Encryption;
        }

        @Override
        public final imports.aws.synthetics_canary.SyntheticsCanaryArtifactConfigS3Encryption getS3Encryption() {
            return this.s3Encryption;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3Encryption() != null) {
                data.set("s3Encryption", om.valueToTree(this.getS3Encryption()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.syntheticsCanary.SyntheticsCanaryArtifactConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SyntheticsCanaryArtifactConfig.Jsii$Proxy that = (SyntheticsCanaryArtifactConfig.Jsii$Proxy) o;

            return this.s3Encryption != null ? this.s3Encryption.equals(that.s3Encryption) : that.s3Encryption == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Encryption != null ? this.s3Encryption.hashCode() : 0;
            return result;
        }
    }
}
