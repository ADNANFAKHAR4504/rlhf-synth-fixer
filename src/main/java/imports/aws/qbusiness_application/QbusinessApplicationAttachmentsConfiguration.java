package imports.aws.qbusiness_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.093Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.qbusinessApplication.QbusinessApplicationAttachmentsConfiguration")
@software.amazon.jsii.Jsii.Proxy(QbusinessApplicationAttachmentsConfiguration.Jsii$Proxy.class)
public interface QbusinessApplicationAttachmentsConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Status information about whether file upload functionality is activated or deactivated for your end user.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#attachments_control_mode QbusinessApplication#attachments_control_mode}
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAttachmentsControlMode();

    /**
     * @return a {@link Builder} of {@link QbusinessApplicationAttachmentsConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QbusinessApplicationAttachmentsConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QbusinessApplicationAttachmentsConfiguration> {
        java.lang.String attachmentsControlMode;

        /**
         * Sets the value of {@link QbusinessApplicationAttachmentsConfiguration#getAttachmentsControlMode}
         * @param attachmentsControlMode Status information about whether file upload functionality is activated or deactivated for your end user. This parameter is required.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/qbusiness_application#attachments_control_mode QbusinessApplication#attachments_control_mode}
         * @return {@code this}
         */
        public Builder attachmentsControlMode(java.lang.String attachmentsControlMode) {
            this.attachmentsControlMode = attachmentsControlMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QbusinessApplicationAttachmentsConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QbusinessApplicationAttachmentsConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QbusinessApplicationAttachmentsConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QbusinessApplicationAttachmentsConfiguration {
        private final java.lang.String attachmentsControlMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.attachmentsControlMode = software.amazon.jsii.Kernel.get(this, "attachmentsControlMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.attachmentsControlMode = java.util.Objects.requireNonNull(builder.attachmentsControlMode, "attachmentsControlMode is required");
        }

        @Override
        public final java.lang.String getAttachmentsControlMode() {
            return this.attachmentsControlMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("attachmentsControlMode", om.valueToTree(this.getAttachmentsControlMode()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.qbusinessApplication.QbusinessApplicationAttachmentsConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QbusinessApplicationAttachmentsConfiguration.Jsii$Proxy that = (QbusinessApplicationAttachmentsConfiguration.Jsii$Proxy) o;

            return this.attachmentsControlMode.equals(that.attachmentsControlMode);
        }

        @Override
        public final int hashCode() {
            int result = this.attachmentsControlMode.hashCode();
            return result;
        }
    }
}
