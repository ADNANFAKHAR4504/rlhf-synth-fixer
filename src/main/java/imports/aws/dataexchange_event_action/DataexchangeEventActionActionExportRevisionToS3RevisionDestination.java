package imports.aws.dataexchange_event_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.936Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeEventAction.DataexchangeEventActionActionExportRevisionToS3RevisionDestination")
@software.amazon.jsii.Jsii.Proxy(DataexchangeEventActionActionExportRevisionToS3RevisionDestination.Jsii$Proxy.class)
public interface DataexchangeEventActionActionExportRevisionToS3RevisionDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#bucket DataexchangeEventAction#bucket}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getBucket();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#key_pattern DataexchangeEventAction#key_pattern}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKeyPattern() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataexchangeEventActionActionExportRevisionToS3RevisionDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeEventActionActionExportRevisionToS3RevisionDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeEventActionActionExportRevisionToS3RevisionDestination> {
        java.lang.String bucket;
        java.lang.String keyPattern;

        /**
         * Sets the value of {@link DataexchangeEventActionActionExportRevisionToS3RevisionDestination#getBucket}
         * @param bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#bucket DataexchangeEventAction#bucket}. This parameter is required.
         * @return {@code this}
         */
        public Builder bucket(java.lang.String bucket) {
            this.bucket = bucket;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeEventActionActionExportRevisionToS3RevisionDestination#getKeyPattern}
         * @param keyPattern Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#key_pattern DataexchangeEventAction#key_pattern}.
         * @return {@code this}
         */
        public Builder keyPattern(java.lang.String keyPattern) {
            this.keyPattern = keyPattern;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeEventActionActionExportRevisionToS3RevisionDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeEventActionActionExportRevisionToS3RevisionDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeEventActionActionExportRevisionToS3RevisionDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeEventActionActionExportRevisionToS3RevisionDestination {
        private final java.lang.String bucket;
        private final java.lang.String keyPattern;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucket = software.amazon.jsii.Kernel.get(this, "bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyPattern = software.amazon.jsii.Kernel.get(this, "keyPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucket = java.util.Objects.requireNonNull(builder.bucket, "bucket is required");
            this.keyPattern = builder.keyPattern;
        }

        @Override
        public final java.lang.String getBucket() {
            return this.bucket;
        }

        @Override
        public final java.lang.String getKeyPattern() {
            return this.keyPattern;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bucket", om.valueToTree(this.getBucket()));
            if (this.getKeyPattern() != null) {
                data.set("keyPattern", om.valueToTree(this.getKeyPattern()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeEventAction.DataexchangeEventActionActionExportRevisionToS3RevisionDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeEventActionActionExportRevisionToS3RevisionDestination.Jsii$Proxy that = (DataexchangeEventActionActionExportRevisionToS3RevisionDestination.Jsii$Proxy) o;

            if (!bucket.equals(that.bucket)) return false;
            return this.keyPattern != null ? this.keyPattern.equals(that.keyPattern) : that.keyPattern == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucket.hashCode();
            result = 31 * result + (this.keyPattern != null ? this.keyPattern.hashCode() : 0);
            return result;
        }
    }
}
