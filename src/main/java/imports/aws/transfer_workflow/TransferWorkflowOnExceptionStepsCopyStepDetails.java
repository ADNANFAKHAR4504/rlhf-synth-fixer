package imports.aws.transfer_workflow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.566Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferWorkflow.TransferWorkflowOnExceptionStepsCopyStepDetails")
@software.amazon.jsii.Jsii.Proxy(TransferWorkflowOnExceptionStepsCopyStepDetails.Jsii$Proxy.class)
public interface TransferWorkflowOnExceptionStepsCopyStepDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination_file_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#destination_file_location TransferWorkflow#destination_file_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation getDestinationFileLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#name TransferWorkflow#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#overwrite_existing TransferWorkflow#overwrite_existing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOverwriteExisting() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#source_file_location TransferWorkflow#source_file_location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceFileLocation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferWorkflowOnExceptionStepsCopyStepDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferWorkflowOnExceptionStepsCopyStepDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferWorkflowOnExceptionStepsCopyStepDetails> {
        imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation destinationFileLocation;
        java.lang.String name;
        java.lang.String overwriteExisting;
        java.lang.String sourceFileLocation;

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionStepsCopyStepDetails#getDestinationFileLocation}
         * @param destinationFileLocation destination_file_location block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#destination_file_location TransferWorkflow#destination_file_location}
         * @return {@code this}
         */
        public Builder destinationFileLocation(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation destinationFileLocation) {
            this.destinationFileLocation = destinationFileLocation;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionStepsCopyStepDetails#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#name TransferWorkflow#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionStepsCopyStepDetails#getOverwriteExisting}
         * @param overwriteExisting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#overwrite_existing TransferWorkflow#overwrite_existing}.
         * @return {@code this}
         */
        public Builder overwriteExisting(java.lang.String overwriteExisting) {
            this.overwriteExisting = overwriteExisting;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionStepsCopyStepDetails#getSourceFileLocation}
         * @param sourceFileLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#source_file_location TransferWorkflow#source_file_location}.
         * @return {@code this}
         */
        public Builder sourceFileLocation(java.lang.String sourceFileLocation) {
            this.sourceFileLocation = sourceFileLocation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferWorkflowOnExceptionStepsCopyStepDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferWorkflowOnExceptionStepsCopyStepDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferWorkflowOnExceptionStepsCopyStepDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferWorkflowOnExceptionStepsCopyStepDetails {
        private final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation destinationFileLocation;
        private final java.lang.String name;
        private final java.lang.String overwriteExisting;
        private final java.lang.String sourceFileLocation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationFileLocation = software.amazon.jsii.Kernel.get(this, "destinationFileLocation", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.overwriteExisting = software.amazon.jsii.Kernel.get(this, "overwriteExisting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceFileLocation = software.amazon.jsii.Kernel.get(this, "sourceFileLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationFileLocation = builder.destinationFileLocation;
            this.name = builder.name;
            this.overwriteExisting = builder.overwriteExisting;
            this.sourceFileLocation = builder.sourceFileLocation;
        }

        @Override
        public final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetailsDestinationFileLocation getDestinationFileLocation() {
            return this.destinationFileLocation;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getOverwriteExisting() {
            return this.overwriteExisting;
        }

        @Override
        public final java.lang.String getSourceFileLocation() {
            return this.sourceFileLocation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDestinationFileLocation() != null) {
                data.set("destinationFileLocation", om.valueToTree(this.getDestinationFileLocation()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getOverwriteExisting() != null) {
                data.set("overwriteExisting", om.valueToTree(this.getOverwriteExisting()));
            }
            if (this.getSourceFileLocation() != null) {
                data.set("sourceFileLocation", om.valueToTree(this.getSourceFileLocation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferWorkflow.TransferWorkflowOnExceptionStepsCopyStepDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferWorkflowOnExceptionStepsCopyStepDetails.Jsii$Proxy that = (TransferWorkflowOnExceptionStepsCopyStepDetails.Jsii$Proxy) o;

            if (this.destinationFileLocation != null ? !this.destinationFileLocation.equals(that.destinationFileLocation) : that.destinationFileLocation != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.overwriteExisting != null ? !this.overwriteExisting.equals(that.overwriteExisting) : that.overwriteExisting != null) return false;
            return this.sourceFileLocation != null ? this.sourceFileLocation.equals(that.sourceFileLocation) : that.sourceFileLocation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destinationFileLocation != null ? this.destinationFileLocation.hashCode() : 0;
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.overwriteExisting != null ? this.overwriteExisting.hashCode() : 0);
            result = 31 * result + (this.sourceFileLocation != null ? this.sourceFileLocation.hashCode() : 0);
            return result;
        }
    }
}
