package imports.aws.sagemaker_workteam;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.357Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfiguration")
@software.amazon.jsii.Jsii.Proxy(SagemakerWorkteamWorkerAccessConfiguration.Jsii$Proxy.class)
public interface SagemakerWorkteamWorkerAccessConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_presign block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#s3_presign SagemakerWorkteam#s3_presign}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign getS3Presign() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerWorkteamWorkerAccessConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerWorkteamWorkerAccessConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerWorkteamWorkerAccessConfiguration> {
        imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign s3Presign;

        /**
         * Sets the value of {@link SagemakerWorkteamWorkerAccessConfiguration#getS3Presign}
         * @param s3Presign s3_presign block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workteam#s3_presign SagemakerWorkteam#s3_presign}
         * @return {@code this}
         */
        public Builder s3Presign(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign s3Presign) {
            this.s3Presign = s3Presign;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerWorkteamWorkerAccessConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerWorkteamWorkerAccessConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerWorkteamWorkerAccessConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerWorkteamWorkerAccessConfiguration {
        private final imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign s3Presign;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Presign = software.amazon.jsii.Kernel.get(this, "s3Presign", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Presign = builder.s3Presign;
        }

        @Override
        public final imports.aws.sagemaker_workteam.SagemakerWorkteamWorkerAccessConfigurationS3Presign getS3Presign() {
            return this.s3Presign;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3Presign() != null) {
                data.set("s3Presign", om.valueToTree(this.getS3Presign()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerWorkteam.SagemakerWorkteamWorkerAccessConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerWorkteamWorkerAccessConfiguration.Jsii$Proxy that = (SagemakerWorkteamWorkerAccessConfiguration.Jsii$Proxy) o;

            return this.s3Presign != null ? this.s3Presign.equals(that.s3Presign) : that.s3Presign == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Presign != null ? this.s3Presign.hashCode() : 0;
            return result;
        }
    }
}
