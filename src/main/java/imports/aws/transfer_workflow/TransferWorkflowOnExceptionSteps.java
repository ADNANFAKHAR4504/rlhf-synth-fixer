package imports.aws.transfer_workflow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.566Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferWorkflow.TransferWorkflowOnExceptionSteps")
@software.amazon.jsii.Jsii.Proxy(TransferWorkflowOnExceptionSteps.Jsii$Proxy.class)
public interface TransferWorkflowOnExceptionSteps extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#type TransferWorkflow#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * copy_step_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#copy_step_details TransferWorkflow#copy_step_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails getCopyStepDetails() {
        return null;
    }

    /**
     * custom_step_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#custom_step_details TransferWorkflow#custom_step_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCustomStepDetails getCustomStepDetails() {
        return null;
    }

    /**
     * decrypt_step_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#decrypt_step_details TransferWorkflow#decrypt_step_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetails getDecryptStepDetails() {
        return null;
    }

    /**
     * delete_step_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#delete_step_details TransferWorkflow#delete_step_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDeleteStepDetails getDeleteStepDetails() {
        return null;
    }

    /**
     * tag_step_details block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#tag_step_details TransferWorkflow#tag_step_details}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsTagStepDetails getTagStepDetails() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferWorkflowOnExceptionSteps}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferWorkflowOnExceptionSteps}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferWorkflowOnExceptionSteps> {
        java.lang.String type;
        imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails copyStepDetails;
        imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCustomStepDetails customStepDetails;
        imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetails decryptStepDetails;
        imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDeleteStepDetails deleteStepDetails;
        imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsTagStepDetails tagStepDetails;

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionSteps#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#type TransferWorkflow#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionSteps#getCopyStepDetails}
         * @param copyStepDetails copy_step_details block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#copy_step_details TransferWorkflow#copy_step_details}
         * @return {@code this}
         */
        public Builder copyStepDetails(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails copyStepDetails) {
            this.copyStepDetails = copyStepDetails;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionSteps#getCustomStepDetails}
         * @param customStepDetails custom_step_details block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#custom_step_details TransferWorkflow#custom_step_details}
         * @return {@code this}
         */
        public Builder customStepDetails(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCustomStepDetails customStepDetails) {
            this.customStepDetails = customStepDetails;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionSteps#getDecryptStepDetails}
         * @param decryptStepDetails decrypt_step_details block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#decrypt_step_details TransferWorkflow#decrypt_step_details}
         * @return {@code this}
         */
        public Builder decryptStepDetails(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetails decryptStepDetails) {
            this.decryptStepDetails = decryptStepDetails;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionSteps#getDeleteStepDetails}
         * @param deleteStepDetails delete_step_details block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#delete_step_details TransferWorkflow#delete_step_details}
         * @return {@code this}
         */
        public Builder deleteStepDetails(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDeleteStepDetails deleteStepDetails) {
            this.deleteStepDetails = deleteStepDetails;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowOnExceptionSteps#getTagStepDetails}
         * @param tagStepDetails tag_step_details block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#tag_step_details TransferWorkflow#tag_step_details}
         * @return {@code this}
         */
        public Builder tagStepDetails(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsTagStepDetails tagStepDetails) {
            this.tagStepDetails = tagStepDetails;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferWorkflowOnExceptionSteps}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferWorkflowOnExceptionSteps build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferWorkflowOnExceptionSteps}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferWorkflowOnExceptionSteps {
        private final java.lang.String type;
        private final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails copyStepDetails;
        private final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCustomStepDetails customStepDetails;
        private final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetails decryptStepDetails;
        private final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDeleteStepDetails deleteStepDetails;
        private final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsTagStepDetails tagStepDetails;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyStepDetails = software.amazon.jsii.Kernel.get(this, "copyStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails.class));
            this.customStepDetails = software.amazon.jsii.Kernel.get(this, "customStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCustomStepDetails.class));
            this.decryptStepDetails = software.amazon.jsii.Kernel.get(this, "decryptStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetails.class));
            this.deleteStepDetails = software.amazon.jsii.Kernel.get(this, "deleteStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDeleteStepDetails.class));
            this.tagStepDetails = software.amazon.jsii.Kernel.get(this, "tagStepDetails", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsTagStepDetails.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.copyStepDetails = builder.copyStepDetails;
            this.customStepDetails = builder.customStepDetails;
            this.decryptStepDetails = builder.decryptStepDetails;
            this.deleteStepDetails = builder.deleteStepDetails;
            this.tagStepDetails = builder.tagStepDetails;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCopyStepDetails getCopyStepDetails() {
            return this.copyStepDetails;
        }

        @Override
        public final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsCustomStepDetails getCustomStepDetails() {
            return this.customStepDetails;
        }

        @Override
        public final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDecryptStepDetails getDecryptStepDetails() {
            return this.decryptStepDetails;
        }

        @Override
        public final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsDeleteStepDetails getDeleteStepDetails() {
            return this.deleteStepDetails;
        }

        @Override
        public final imports.aws.transfer_workflow.TransferWorkflowOnExceptionStepsTagStepDetails getTagStepDetails() {
            return this.tagStepDetails;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getCopyStepDetails() != null) {
                data.set("copyStepDetails", om.valueToTree(this.getCopyStepDetails()));
            }
            if (this.getCustomStepDetails() != null) {
                data.set("customStepDetails", om.valueToTree(this.getCustomStepDetails()));
            }
            if (this.getDecryptStepDetails() != null) {
                data.set("decryptStepDetails", om.valueToTree(this.getDecryptStepDetails()));
            }
            if (this.getDeleteStepDetails() != null) {
                data.set("deleteStepDetails", om.valueToTree(this.getDeleteStepDetails()));
            }
            if (this.getTagStepDetails() != null) {
                data.set("tagStepDetails", om.valueToTree(this.getTagStepDetails()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferWorkflow.TransferWorkflowOnExceptionSteps"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferWorkflowOnExceptionSteps.Jsii$Proxy that = (TransferWorkflowOnExceptionSteps.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.copyStepDetails != null ? !this.copyStepDetails.equals(that.copyStepDetails) : that.copyStepDetails != null) return false;
            if (this.customStepDetails != null ? !this.customStepDetails.equals(that.customStepDetails) : that.customStepDetails != null) return false;
            if (this.decryptStepDetails != null ? !this.decryptStepDetails.equals(that.decryptStepDetails) : that.decryptStepDetails != null) return false;
            if (this.deleteStepDetails != null ? !this.deleteStepDetails.equals(that.deleteStepDetails) : that.deleteStepDetails != null) return false;
            return this.tagStepDetails != null ? this.tagStepDetails.equals(that.tagStepDetails) : that.tagStepDetails == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.copyStepDetails != null ? this.copyStepDetails.hashCode() : 0);
            result = 31 * result + (this.customStepDetails != null ? this.customStepDetails.hashCode() : 0);
            result = 31 * result + (this.decryptStepDetails != null ? this.decryptStepDetails.hashCode() : 0);
            result = 31 * result + (this.deleteStepDetails != null ? this.deleteStepDetails.hashCode() : 0);
            result = 31 * result + (this.tagStepDetails != null ? this.tagStepDetails.hashCode() : 0);
            return result;
        }
    }
}
