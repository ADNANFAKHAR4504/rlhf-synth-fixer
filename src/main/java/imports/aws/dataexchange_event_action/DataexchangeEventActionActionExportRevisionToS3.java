package imports.aws.dataexchange_event_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.935Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeEventAction.DataexchangeEventActionActionExportRevisionToS3")
@software.amazon.jsii.Jsii.Proxy(DataexchangeEventActionActionExportRevisionToS3.Jsii$Proxy.class)
public interface DataexchangeEventActionActionExportRevisionToS3 extends software.amazon.jsii.JsiiSerializable {

    /**
     * encryption block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#encryption DataexchangeEventAction#encryption}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncryption() {
        return null;
    }

    /**
     * revision_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#revision_destination DataexchangeEventAction#revision_destination}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRevisionDestination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataexchangeEventActionActionExportRevisionToS3}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeEventActionActionExportRevisionToS3}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeEventActionActionExportRevisionToS3> {
        java.lang.Object encryption;
        java.lang.Object revisionDestination;

        /**
         * Sets the value of {@link DataexchangeEventActionActionExportRevisionToS3#getEncryption}
         * @param encryption encryption block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#encryption DataexchangeEventAction#encryption}
         * @return {@code this}
         */
        public Builder encryption(com.hashicorp.cdktf.IResolvable encryption) {
            this.encryption = encryption;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeEventActionActionExportRevisionToS3#getEncryption}
         * @param encryption encryption block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#encryption DataexchangeEventAction#encryption}
         * @return {@code this}
         */
        public Builder encryption(java.util.List<? extends imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3Encryption> encryption) {
            this.encryption = encryption;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeEventActionActionExportRevisionToS3#getRevisionDestination}
         * @param revisionDestination revision_destination block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#revision_destination DataexchangeEventAction#revision_destination}
         * @return {@code this}
         */
        public Builder revisionDestination(com.hashicorp.cdktf.IResolvable revisionDestination) {
            this.revisionDestination = revisionDestination;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeEventActionActionExportRevisionToS3#getRevisionDestination}
         * @param revisionDestination revision_destination block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#revision_destination DataexchangeEventAction#revision_destination}
         * @return {@code this}
         */
        public Builder revisionDestination(java.util.List<? extends imports.aws.dataexchange_event_action.DataexchangeEventActionActionExportRevisionToS3RevisionDestination> revisionDestination) {
            this.revisionDestination = revisionDestination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeEventActionActionExportRevisionToS3}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeEventActionActionExportRevisionToS3 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeEventActionActionExportRevisionToS3}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeEventActionActionExportRevisionToS3 {
        private final java.lang.Object encryption;
        private final java.lang.Object revisionDestination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryption = software.amazon.jsii.Kernel.get(this, "encryption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.revisionDestination = software.amazon.jsii.Kernel.get(this, "revisionDestination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryption = builder.encryption;
            this.revisionDestination = builder.revisionDestination;
        }

        @Override
        public final java.lang.Object getEncryption() {
            return this.encryption;
        }

        @Override
        public final java.lang.Object getRevisionDestination() {
            return this.revisionDestination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEncryption() != null) {
                data.set("encryption", om.valueToTree(this.getEncryption()));
            }
            if (this.getRevisionDestination() != null) {
                data.set("revisionDestination", om.valueToTree(this.getRevisionDestination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeEventAction.DataexchangeEventActionActionExportRevisionToS3"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeEventActionActionExportRevisionToS3.Jsii$Proxy that = (DataexchangeEventActionActionExportRevisionToS3.Jsii$Proxy) o;

            if (this.encryption != null ? !this.encryption.equals(that.encryption) : that.encryption != null) return false;
            return this.revisionDestination != null ? this.revisionDestination.equals(that.revisionDestination) : that.revisionDestination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryption != null ? this.encryption.hashCode() : 0;
            result = 31 * result + (this.revisionDestination != null ? this.revisionDestination.hashCode() : 0);
            return result;
        }
    }
}
