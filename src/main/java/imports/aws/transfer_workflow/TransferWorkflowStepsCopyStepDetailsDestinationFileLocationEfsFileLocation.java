package imports.aws.transfer_workflow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.571Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferWorkflow.TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation")
@software.amazon.jsii.Jsii.Proxy(TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation.Jsii$Proxy.class)
public interface TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#file_system_id TransferWorkflow#file_system_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileSystemId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#path TransferWorkflow#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation> {
        java.lang.String fileSystemId;
        java.lang.String path;

        /**
         * Sets the value of {@link TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation#getFileSystemId}
         * @param fileSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#file_system_id TransferWorkflow#file_system_id}.
         * @return {@code this}
         */
        public Builder fileSystemId(java.lang.String fileSystemId) {
            this.fileSystemId = fileSystemId;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#path TransferWorkflow#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation {
        private final java.lang.String fileSystemId;
        private final java.lang.String path;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fileSystemId = software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fileSystemId = builder.fileSystemId;
            this.path = builder.path;
        }

        @Override
        public final java.lang.String getFileSystemId() {
            return this.fileSystemId;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFileSystemId() != null) {
                data.set("fileSystemId", om.valueToTree(this.getFileSystemId()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferWorkflow.TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation.Jsii$Proxy that = (TransferWorkflowStepsCopyStepDetailsDestinationFileLocationEfsFileLocation.Jsii$Proxy) o;

            if (this.fileSystemId != null ? !this.fileSystemId.equals(that.fileSystemId) : that.fileSystemId != null) return false;
            return this.path != null ? this.path.equals(that.path) : that.path == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fileSystemId != null ? this.fileSystemId.hashCode() : 0;
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            return result;
        }
    }
}
