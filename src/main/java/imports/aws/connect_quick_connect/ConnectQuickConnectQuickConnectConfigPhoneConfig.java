package imports.aws.connect_quick_connect;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.388Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfigPhoneConfig")
@software.amazon.jsii.Jsii.Proxy(ConnectQuickConnectQuickConnectConfigPhoneConfig.Jsii$Proxy.class)
public interface ConnectQuickConnectQuickConnectConfigPhoneConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#phone_number ConnectQuickConnect#phone_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPhoneNumber();

    /**
     * @return a {@link Builder} of {@link ConnectQuickConnectQuickConnectConfigPhoneConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConnectQuickConnectQuickConnectConfigPhoneConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConnectQuickConnectQuickConnectConfigPhoneConfig> {
        java.lang.String phoneNumber;

        /**
         * Sets the value of {@link ConnectQuickConnectQuickConnectConfigPhoneConfig#getPhoneNumber}
         * @param phoneNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/connect_quick_connect#phone_number ConnectQuickConnect#phone_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder phoneNumber(java.lang.String phoneNumber) {
            this.phoneNumber = phoneNumber;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConnectQuickConnectQuickConnectConfigPhoneConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConnectQuickConnectQuickConnectConfigPhoneConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConnectQuickConnectQuickConnectConfigPhoneConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConnectQuickConnectQuickConnectConfigPhoneConfig {
        private final java.lang.String phoneNumber;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.phoneNumber = software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.phoneNumber = java.util.Objects.requireNonNull(builder.phoneNumber, "phoneNumber is required");
        }

        @Override
        public final java.lang.String getPhoneNumber() {
            return this.phoneNumber;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("phoneNumber", om.valueToTree(this.getPhoneNumber()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.connectQuickConnect.ConnectQuickConnectQuickConnectConfigPhoneConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConnectQuickConnectQuickConnectConfigPhoneConfig.Jsii$Proxy that = (ConnectQuickConnectQuickConnectConfigPhoneConfig.Jsii$Proxy) o;

            return this.phoneNumber.equals(that.phoneNumber);
        }

        @Override
        public final int hashCode() {
            int result = this.phoneNumber.hashCode();
            return result;
        }
    }
}
