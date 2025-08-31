package imports.aws.ivs_recording_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.425Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ivsRecordingConfiguration.IvsRecordingConfigurationDestinationConfigurationS3")
@software.amazon.jsii.Jsii.Proxy(IvsRecordingConfigurationDestinationConfigurationS3.Jsii$Proxy.class)
public interface IvsRecordingConfigurationDestinationConfigurationS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#bucket_name IvsRecordingConfiguration#bucket_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucketName();

    /**
     * @return a {@link Builder} of {@link IvsRecordingConfigurationDestinationConfigurationS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link IvsRecordingConfigurationDestinationConfigurationS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<IvsRecordingConfigurationDestinationConfigurationS3> {
        java.lang.String bucketName;

        /**
         * Sets the value of {@link IvsRecordingConfigurationDestinationConfigurationS3#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ivs_recording_configuration#bucket_name IvsRecordingConfiguration#bucket_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link IvsRecordingConfigurationDestinationConfigurationS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public IvsRecordingConfigurationDestinationConfigurationS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link IvsRecordingConfigurationDestinationConfigurationS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements IvsRecordingConfigurationDestinationConfigurationS3 {
        private final java.lang.String bucketName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketName = java.util.Objects.requireNonNull(builder.bucketName, "bucketName is required");
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucketName", om.valueToTree(this.getBucketName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ivsRecordingConfiguration.IvsRecordingConfigurationDestinationConfigurationS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            IvsRecordingConfigurationDestinationConfigurationS3.Jsii$Proxy that = (IvsRecordingConfigurationDestinationConfigurationS3.Jsii$Proxy) o;

            return this.bucketName.equals(that.bucketName);
        }

        @Override
        public final int hashCode() {
            int result = this.bucketName.hashCode();
            return result;
        }
    }
}
