package imports.aws.transfer_workflow;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.571Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferWorkflow.TransferWorkflowStepsCustomStepDetails")
@software.amazon.jsii.Jsii.Proxy(TransferWorkflowStepsCustomStepDetails.Jsii$Proxy.class)
public interface TransferWorkflowStepsCustomStepDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#name TransferWorkflow#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#source_file_location TransferWorkflow#source_file_location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceFileLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#target TransferWorkflow#target}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#timeout_seconds TransferWorkflow#timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferWorkflowStepsCustomStepDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferWorkflowStepsCustomStepDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferWorkflowStepsCustomStepDetails> {
        java.lang.String name;
        java.lang.String sourceFileLocation;
        java.lang.String target;
        java.lang.Number timeoutSeconds;

        /**
         * Sets the value of {@link TransferWorkflowStepsCustomStepDetails#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#name TransferWorkflow#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowStepsCustomStepDetails#getSourceFileLocation}
         * @param sourceFileLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#source_file_location TransferWorkflow#source_file_location}.
         * @return {@code this}
         */
        public Builder sourceFileLocation(java.lang.String sourceFileLocation) {
            this.sourceFileLocation = sourceFileLocation;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowStepsCustomStepDetails#getTarget}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#target TransferWorkflow#target}.
         * @return {@code this}
         */
        public Builder target(java.lang.String target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link TransferWorkflowStepsCustomStepDetails#getTimeoutSeconds}
         * @param timeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_workflow#timeout_seconds TransferWorkflow#timeout_seconds}.
         * @return {@code this}
         */
        public Builder timeoutSeconds(java.lang.Number timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferWorkflowStepsCustomStepDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferWorkflowStepsCustomStepDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferWorkflowStepsCustomStepDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferWorkflowStepsCustomStepDetails {
        private final java.lang.String name;
        private final java.lang.String sourceFileLocation;
        private final java.lang.String target;
        private final java.lang.Number timeoutSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceFileLocation = software.amazon.jsii.Kernel.get(this, "sourceFileLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeoutSeconds = software.amazon.jsii.Kernel.get(this, "timeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = builder.name;
            this.sourceFileLocation = builder.sourceFileLocation;
            this.target = builder.target;
            this.timeoutSeconds = builder.timeoutSeconds;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getSourceFileLocation() {
            return this.sourceFileLocation;
        }

        @Override
        public final java.lang.String getTarget() {
            return this.target;
        }

        @Override
        public final java.lang.Number getTimeoutSeconds() {
            return this.timeoutSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getSourceFileLocation() != null) {
                data.set("sourceFileLocation", om.valueToTree(this.getSourceFileLocation()));
            }
            if (this.getTarget() != null) {
                data.set("target", om.valueToTree(this.getTarget()));
            }
            if (this.getTimeoutSeconds() != null) {
                data.set("timeoutSeconds", om.valueToTree(this.getTimeoutSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferWorkflow.TransferWorkflowStepsCustomStepDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferWorkflowStepsCustomStepDetails.Jsii$Proxy that = (TransferWorkflowStepsCustomStepDetails.Jsii$Proxy) o;

            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.sourceFileLocation != null ? !this.sourceFileLocation.equals(that.sourceFileLocation) : that.sourceFileLocation != null) return false;
            if (this.target != null ? !this.target.equals(that.target) : that.target != null) return false;
            return this.timeoutSeconds != null ? this.timeoutSeconds.equals(that.timeoutSeconds) : that.timeoutSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name != null ? this.name.hashCode() : 0;
            result = 31 * result + (this.sourceFileLocation != null ? this.sourceFileLocation.hashCode() : 0);
            result = 31 * result + (this.target != null ? this.target.hashCode() : 0);
            result = 31 * result + (this.timeoutSeconds != null ? this.timeoutSeconds.hashCode() : 0);
            return result;
        }
    }
}
