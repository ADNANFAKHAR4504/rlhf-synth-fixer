package imports.aws.data_aws_alb_listener;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.412Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsAlbListener.DataAwsAlbListenerTimeouts")
@software.amazon.jsii.Jsii.Proxy(DataAwsAlbListenerTimeouts.Jsii$Proxy.class)
public interface DataAwsAlbListenerTimeouts extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/alb_listener#read DataAwsAlbListener#read}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRead() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsAlbListenerTimeouts}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsAlbListenerTimeouts}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsAlbListenerTimeouts> {
        java.lang.String read;

        /**
         * Sets the value of {@link DataAwsAlbListenerTimeouts#getRead}
         * @param read Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/alb_listener#read DataAwsAlbListener#read}.
         * @return {@code this}
         */
        public Builder read(java.lang.String read) {
            this.read = read;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataAwsAlbListenerTimeouts}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsAlbListenerTimeouts build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsAlbListenerTimeouts}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsAlbListenerTimeouts {
        private final java.lang.String read;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.read = software.amazon.jsii.Kernel.get(this, "read", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.read = builder.read;
        }

        @Override
        public final java.lang.String getRead() {
            return this.read;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRead() != null) {
                data.set("read", om.valueToTree(this.getRead()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataAwsAlbListener.DataAwsAlbListenerTimeouts"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsAlbListenerTimeouts.Jsii$Proxy that = (DataAwsAlbListenerTimeouts.Jsii$Proxy) o;

            return this.read != null ? this.read.equals(that.read) : that.read == null;
        }

        @Override
        public final int hashCode() {
            int result = this.read != null ? this.read.hashCode() : 0;
            return result;
        }
    }
}
