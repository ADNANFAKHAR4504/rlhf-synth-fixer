package imports.aws.dataexchange_event_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.936Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeEventAction.DataexchangeEventActionEvent")
@software.amazon.jsii.Jsii.Proxy(DataexchangeEventActionEvent.Jsii$Proxy.class)
public interface DataexchangeEventActionEvent extends software.amazon.jsii.JsiiSerializable {

    /**
     * revision_published block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#revision_published DataexchangeEventAction#revision_published}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRevisionPublished() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataexchangeEventActionEvent}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeEventActionEvent}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeEventActionEvent> {
        java.lang.Object revisionPublished;

        /**
         * Sets the value of {@link DataexchangeEventActionEvent#getRevisionPublished}
         * @param revisionPublished revision_published block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#revision_published DataexchangeEventAction#revision_published}
         * @return {@code this}
         */
        public Builder revisionPublished(com.hashicorp.cdktf.IResolvable revisionPublished) {
            this.revisionPublished = revisionPublished;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeEventActionEvent#getRevisionPublished}
         * @param revisionPublished revision_published block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#revision_published DataexchangeEventAction#revision_published}
         * @return {@code this}
         */
        public Builder revisionPublished(java.util.List<? extends imports.aws.dataexchange_event_action.DataexchangeEventActionEventRevisionPublished> revisionPublished) {
            this.revisionPublished = revisionPublished;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeEventActionEvent}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeEventActionEvent build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeEventActionEvent}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeEventActionEvent {
        private final java.lang.Object revisionPublished;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.revisionPublished = software.amazon.jsii.Kernel.get(this, "revisionPublished", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.revisionPublished = builder.revisionPublished;
        }

        @Override
        public final java.lang.Object getRevisionPublished() {
            return this.revisionPublished;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRevisionPublished() != null) {
                data.set("revisionPublished", om.valueToTree(this.getRevisionPublished()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeEventAction.DataexchangeEventActionEvent"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeEventActionEvent.Jsii$Proxy that = (DataexchangeEventActionEvent.Jsii$Proxy) o;

            return this.revisionPublished != null ? this.revisionPublished.equals(that.revisionPublished) : that.revisionPublished == null;
        }

        @Override
        public final int hashCode() {
            int result = this.revisionPublished != null ? this.revisionPublished.hashCode() : 0;
            return result;
        }
    }
}
