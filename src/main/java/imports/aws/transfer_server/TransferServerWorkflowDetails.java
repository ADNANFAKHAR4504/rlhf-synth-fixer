package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerWorkflowDetails")
@software.amazon.jsii.Jsii.Proxy(TransferServerWorkflowDetails.Jsii$Proxy.class)
public interface TransferServerWorkflowDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * on_partial_upload block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_partial_upload TransferServer#on_partial_upload}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload getOnPartialUpload() {
        return null;
    }

    /**
     * on_upload block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_upload TransferServer#on_upload}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload getOnUpload() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferServerWorkflowDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferServerWorkflowDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferServerWorkflowDetails> {
        imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload onPartialUpload;
        imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload onUpload;

        /**
         * Sets the value of {@link TransferServerWorkflowDetails#getOnPartialUpload}
         * @param onPartialUpload on_partial_upload block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_partial_upload TransferServer#on_partial_upload}
         * @return {@code this}
         */
        public Builder onPartialUpload(imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload onPartialUpload) {
            this.onPartialUpload = onPartialUpload;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerWorkflowDetails#getOnUpload}
         * @param onUpload on_upload block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#on_upload TransferServer#on_upload}
         * @return {@code this}
         */
        public Builder onUpload(imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload onUpload) {
            this.onUpload = onUpload;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferServerWorkflowDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferServerWorkflowDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferServerWorkflowDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferServerWorkflowDetails {
        private final imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload onPartialUpload;
        private final imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload onUpload;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.onPartialUpload = software.amazon.jsii.Kernel.get(this, "onPartialUpload", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload.class));
            this.onUpload = software.amazon.jsii.Kernel.get(this, "onUpload", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.onPartialUpload = builder.onPartialUpload;
            this.onUpload = builder.onUpload;
        }

        @Override
        public final imports.aws.transfer_server.TransferServerWorkflowDetailsOnPartialUpload getOnPartialUpload() {
            return this.onPartialUpload;
        }

        @Override
        public final imports.aws.transfer_server.TransferServerWorkflowDetailsOnUpload getOnUpload() {
            return this.onUpload;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getOnPartialUpload() != null) {
                data.set("onPartialUpload", om.valueToTree(this.getOnPartialUpload()));
            }
            if (this.getOnUpload() != null) {
                data.set("onUpload", om.valueToTree(this.getOnUpload()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferServer.TransferServerWorkflowDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferServerWorkflowDetails.Jsii$Proxy that = (TransferServerWorkflowDetails.Jsii$Proxy) o;

            if (this.onPartialUpload != null ? !this.onPartialUpload.equals(that.onPartialUpload) : that.onPartialUpload != null) return false;
            return this.onUpload != null ? this.onUpload.equals(that.onUpload) : that.onUpload == null;
        }

        @Override
        public final int hashCode() {
            int result = this.onPartialUpload != null ? this.onPartialUpload.hashCode() : 0;
            result = 31 * result + (this.onUpload != null ? this.onUpload.hashCode() : 0);
            return result;
        }
    }
}
