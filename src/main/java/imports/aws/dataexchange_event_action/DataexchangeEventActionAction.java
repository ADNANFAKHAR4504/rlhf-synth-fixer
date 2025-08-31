package imports.aws.dataexchange_event_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.935Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeEventAction.DataexchangeEventActionAction")
@software.amazon.jsii.Jsii.Proxy(DataexchangeEventActionAction.Jsii$Proxy.class)
public interface DataexchangeEventActionAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * export_revision_to_s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#export_revision_to_s3 DataexchangeEventAction#export_revision_to_s3}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExportRevisionToS3() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataexchangeEventActionAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeEventActionAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeEventActionAction> {
        java.lang.Object exportRevisionToS3;

        /**
         * Sets the value of {@link DataexchangeEventActionAction#getExportRevisionToS3}
         * @param exportRevisionToS3 export_revision_to_s3 block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#export_revision_to_s3 DataexchangeEventAction#export_revision_to_s3}
         * @return {@code this}
         */
        public Builder exportRevisionToS3(com.hashicorp.cdktf.IResolvable exportRevisionToS3) {
            this.exportRevisionToS3 = exportRevisionToS3;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeEventActionAction#getExportRevisionToS3}
         * @param exportRevisionToS3 export_revision_to_s3 block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#export_revision_to_s3 DataexchangeEventAction#export_revision_to_s3}
         * @return {@code this}
         */
        public Builder exportRevisionToS3(java.util.List<? extends imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3> exportRevisionToS3) {
            this.exportRevisionToS3 = exportRevisionToS3;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeEventActionAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeEventActionAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeEventActionAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeEventActionAction {
        private final java.lang.Object exportRevisionToS3;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.exportRevisionToS3 = software.amazon.jsii.Kernel.get(this, "exportRevisionToS3", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.exportRevisionToS3 = builder.exportRevisionToS3;
        }

        @Override
        public final java.lang.Object getExportRevisionToS3() {
            return this.exportRevisionToS3;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExportRevisionToS3() != null) {
                data.set("exportRevisionToS3", om.valueToTree(this.getExportRevisionToS3()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeEventAction.DataexchangeEventActionAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeEventActionAction.Jsii$Proxy that = (DataexchangeEventActionAction.Jsii$Proxy) o;

            return this.exportRevisionToS3 != null ? this.exportRevisionToS3.equals(that.exportRevisionToS3) : that.exportRevisionToS3 == null;
        }

        @Override
        public final int hashCode() {
            int result = this.exportRevisionToS3 != null ? this.exportRevisionToS3.hashCode() : 0;
            return result;
        }
    }
}
