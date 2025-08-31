package imports.aws.transfer_workflow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.569Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferWorkflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation")
@software.amazon.jsii.Jsii.Proxy(TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation.Jsii$Proxy.class)
public interface TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#bucket TransferWorkflow#bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucket() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#key TransferWorkflow#key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKey() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation> {
        java.lang.String bucket;
        java.lang.String key;

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#bucket TransferWorkflow#bucket}.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#key TransferWorkflow#key}.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation {
        private final java.lang.String bucket;
        private final java.lang.String key;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = builder.bucket;
            this.key = builder.key;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucket() != null) {
                data.set("bucket", om.valueToTree(this.getBucket()));
            }
            if (this.getKey() != null) {
                data.set("key", om.valueToTree(this.getKey()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferWorkflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation.Jsii$Proxy that = (TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocationS3FileLocation.Jsii$Proxy) o;

            if (this.bucket != null ? !this.bucket.equals(that.bucket) : that.bucket != null) return false;
            return this.key != null ? this.key.equals(that.key) : that.key == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket != null ? this.bucket.hashCode() : 0;
            result = 31 * result + (this.key != null ? this.key.hashCode() : 0);
            return result;
        }
    }
}
