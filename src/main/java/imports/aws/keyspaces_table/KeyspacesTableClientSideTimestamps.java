package imports.aws.keyspaces_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.441Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.keyspacesTable.KeyspacesTableClientSideTimestamps")
@software.amazon.jsii.Jsii.Proxy(KeyspacesTableClientSideTimestamps.Jsii$Proxy.class)
public interface KeyspacesTableClientSideTimestamps extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#status KeyspacesTable#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * @return a {@link Builder} of {@link KeyspacesTableClientSideTimestamps}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KeyspacesTableClientSideTimestamps}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KeyspacesTableClientSideTimestamps> {
        java.lang.String status;

        /**
         * Sets the value of {@link KeyspacesTableClientSideTimestamps#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/keyspaces_table#status KeyspacesTable#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KeyspacesTableClientSideTimestamps}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KeyspacesTableClientSideTimestamps build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KeyspacesTableClientSideTimestamps}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KeyspacesTableClientSideTimestamps {
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("status", om.valueToTree(this.getStatus()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.keyspacesTable.KeyspacesTableClientSideTimestamps"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KeyspacesTableClientSideTimestamps.Jsii$Proxy that = (KeyspacesTableClientSideTimestamps.Jsii$Proxy) o;

            return this.status.equals(that.status);
        }

        @Override
        public final int hashCode() {
            int result = this.status.hashCode();
            return result;
        }
    }
}
