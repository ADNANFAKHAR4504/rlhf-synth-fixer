package imports.aws.transfer_workflow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.570Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferWorkflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation")
@software.amazon.jsii.Jsii.Proxy(TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation.Jsii$Proxy.class)
public interface TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * efs_file_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#efs_file_location TransferWorkflow#efs_file_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationEfsFileLocation getEfsFileLocation() {
        return null;
    }

    /**
     * s3_file_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#s3_file_location TransferWorkflow#s3_file_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationS3FileLocation getS3FileLocation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation> {
        imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationEfsFileLocation efsFileLocation;
        imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationS3FileLocation s3FileLocation;

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation#getEfsFileLocation}
         * @param efsFileLocation efs_file_location block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#efs_file_location TransferWorkflow#efs_file_location}
         * @return {@code this}
         */
        public Builder efsFileLocation(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationEfsFileLocation efsFileLocation) {
            this.efsFileLocation = efsFileLocation;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation#getS3FileLocation}
         * @param s3FileLocation s3_file_location block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#s3_file_location TransferWorkflow#s3_file_location}
         * @return {@code this}
         */
        public Builder s3FileLocation(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationS3FileLocation s3FileLocation) {
            this.s3FileLocation = s3FileLocation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation {
        private final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationEfsFileLocation efsFileLocation;
        private final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationS3FileLocation s3FileLocation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.efsFileLocation = software.amazon.jsii.Kernel.get(this, "efsFileLocation", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationEfsFileLocation.class));
            this.s3FileLocation = software.amazon.jsii.Kernel.get(this, "s3FileLocation", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationS3FileLocation.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.efsFileLocation = builder.efsFileLocation;
            this.s3FileLocation = builder.s3FileLocation;
        }

        @Override
        public final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationEfsFileLocation getEfsFileLocation() {
            return this.efsFileLocation;
        }

        @Override
        public final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocationS3FileLocation getS3FileLocation() {
            return this.s3FileLocation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEfsFileLocation() != null) {
                data.set("efsFileLocation", om.valueToTree(this.getEfsFileLocation()));
            }
            if (this.getS3FileLocation() != null) {
                data.set("s3FileLocation", om.valueToTree(this.getS3FileLocation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferWorkflow.TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation.Jsii$Proxy that = (TransferWorkflowOnExceptionStepsDecryptStepDetailsDestinationFileLocation.Jsii$Proxy) o;

            if (this.efsFileLocation != null ? !this.efsFileLocation.equals(that.efsFileLocation) : that.efsFileLocation != null) return false;
            return this.s3FileLocation != null ? this.s3FileLocation.equals(that.s3FileLocation) : that.s3FileLocation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.efsFileLocation != null ? this.efsFileLocation.hashCode() : 0;
            result = 31 * result + (this.s3FileLocation != null ? this.s3FileLocation.hashCode() : 0);
            return result;
        }
    }
}
