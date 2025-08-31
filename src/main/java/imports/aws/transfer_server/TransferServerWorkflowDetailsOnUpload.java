package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerWorkflowDetailsOnUpload")
@software.amazon.jsii.Jsii.Proxy(TransferServerWorkflowDetailsOnUpload.Jsii$Proxy.class)
public interface TransferServerWorkflowDetailsOnUpload extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#execution_role TransferServer#execution_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExecutionRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_id TransferServer#workflow_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkflowId();

    /**
     * @return a {@link Builder} of {@link TransferServerWorkflowDetailsOnUpload}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferServerWorkflowDetailsOnUpload}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferServerWorkflowDetailsOnUpload> {
        java.lang.String executionRole;
        java.lang.String workflowId;

        /**
         * Sets the value of {@link TransferServerWorkflowDetailsOnUpload#getExecutionRole}
         * @param executionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#execution_role TransferServer#execution_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder executionRole(java.lang.String executionRole) {
            this.executionRole = executionRole;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerWorkflowDetailsOnUpload#getWorkflowId}
         * @param workflowId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#workflow_id TransferServer#workflow_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder workflowId(java.lang.String workflowId) {
            this.workflowId = workflowId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferServerWorkflowDetailsOnUpload}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferServerWorkflowDetailsOnUpload build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferServerWorkflowDetailsOnUpload}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferServerWorkflowDetailsOnUpload {
        private final java.lang.String executionRole;
        private final java.lang.String workflowId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.executionRole = software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workflowId = software.amazon.jsii.Kernel.get(this, "workflowId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.executionRole = java.util.Objects.requireNonNull(builder.executionRole, "executionRole is required");
            this.workflowId = java.util.Objects.requireNonNull(builder.workflowId, "workflowId is required");
        }

        @Override
        public final java.lang.String getExecutionRole() {
            return this.executionRole;
        }

        @Override
        public final java.lang.String getWorkflowId() {
            return this.workflowId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("executionRole", om.valueToTree(this.getExecutionRole()));
            data.set("workflowId", om.valueToTree(this.getWorkflowId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferServer.TransferServerWorkflowDetailsOnUpload"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferServerWorkflowDetailsOnUpload.Jsii$Proxy that = (TransferServerWorkflowDetailsOnUpload.Jsii$Proxy) o;

            if (!executionRole.equals(that.executionRole)) return false;
            return this.workflowId.equals(that.workflowId);
        }

        @Override
        public final int hashCode() {
            int result = this.executionRole.hashCode();
            result = 31 * result + (this.workflowId.hashCode());
            return result;
        }
    }
}
