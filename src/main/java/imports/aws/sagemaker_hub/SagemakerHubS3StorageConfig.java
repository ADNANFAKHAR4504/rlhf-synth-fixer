package imports.aws.sagemaker_hub;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.329Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerHub.SagemakerHubS3StorageConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerHubS3StorageConfig.Jsii$Proxy.class)
public interface SagemakerHubS3StorageConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_hub#s3_output_path SagemakerHub#s3_output_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3OutputPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerHubS3StorageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerHubS3StorageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerHubS3StorageConfig> {
        java.lang.String s3OutputPath;

        /**
         * Sets the value of {@link SagemakerHubS3StorageConfig#getS3OutputPath}
         * @param s3OutputPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_hub#s3_output_path SagemakerHub#s3_output_path}.
         * @return {@code this}
         */
        public Builder s3OutputPath(java.lang.String s3OutputPath) {
            this.s3OutputPath = s3OutputPath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerHubS3StorageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerHubS3StorageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerHubS3StorageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerHubS3StorageConfig {
        private final java.lang.String s3OutputPath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3OutputPath = software.amazon.jsii.Kernel.get(this, "s3OutputPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3OutputPath = builder.s3OutputPath;
        }

        @Override
        public final java.lang.String getS3OutputPath() {
            return this.s3OutputPath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3OutputPath() != null) {
                data.set("s3OutputPath", om.valueToTree(this.getS3OutputPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerHub.SagemakerHubS3StorageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerHubS3StorageConfig.Jsii$Proxy that = (SagemakerHubS3StorageConfig.Jsii$Proxy) o;

            return this.s3OutputPath != null ? this.s3OutputPath.equals(that.s3OutputPath) : that.s3OutputPath == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3OutputPath != null ? this.s3OutputPath.hashCode() : 0;
            return result;
        }
    }
}
