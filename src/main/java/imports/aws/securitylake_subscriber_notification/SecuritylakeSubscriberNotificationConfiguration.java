package imports.aws.securitylake_subscriber_notification;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.422Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securitylakeSubscriberNotification.SecuritylakeSubscriberNotificationConfiguration")
@software.amazon.jsii.Jsii.Proxy(SecuritylakeSubscriberNotificationConfiguration.Jsii$Proxy.class)
public interface SecuritylakeSubscriberNotificationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * https_notification_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#https_notification_configuration SecuritylakeSubscriberNotification#https_notification_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHttpsNotificationConfiguration() {
        return null;
    }

    /**
     * sqs_notification_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#sqs_notification_configuration SecuritylakeSubscriberNotification#sqs_notification_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSqsNotificationConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecuritylakeSubscriberNotificationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecuritylakeSubscriberNotificationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecuritylakeSubscriberNotificationConfiguration> {
        java.lang.Object httpsNotificationConfiguration;
        java.lang.Object sqsNotificationConfiguration;

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfiguration#getHttpsNotificationConfiguration}
         * @param httpsNotificationConfiguration https_notification_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#https_notification_configuration SecuritylakeSubscriberNotification#https_notification_configuration}
         * @return {@code this}
         */
        public Builder httpsNotificationConfiguration(com.hashicorp.cdktf.IResolvable httpsNotificationConfiguration) {
            this.httpsNotificationConfiguration = httpsNotificationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfiguration#getHttpsNotificationConfiguration}
         * @param httpsNotificationConfiguration https_notification_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#https_notification_configuration SecuritylakeSubscriberNotification#https_notification_configuration}
         * @return {@code this}
         */
        public Builder httpsNotificationConfiguration(java.util.List<? extends imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationHttpsNotificationConfiguration> httpsNotificationConfiguration) {
            this.httpsNotificationConfiguration = httpsNotificationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfiguration#getSqsNotificationConfiguration}
         * @param sqsNotificationConfiguration sqs_notification_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#sqs_notification_configuration SecuritylakeSubscriberNotification#sqs_notification_configuration}
         * @return {@code this}
         */
        public Builder sqsNotificationConfiguration(com.hashicorp.cdktf.IResolvable sqsNotificationConfiguration) {
            this.sqsNotificationConfiguration = sqsNotificationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SecuritylakeSubscriberNotificationConfiguration#getSqsNotificationConfiguration}
         * @param sqsNotificationConfiguration sqs_notification_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securitylake_subscriber_notification#sqs_notification_configuration SecuritylakeSubscriberNotification#sqs_notification_configuration}
         * @return {@code this}
         */
        public Builder sqsNotificationConfiguration(java.util.List<? extends imports.aws.securitylake_subscriber_notification.SecuritylakeSubscriberNotificationConfigurationSqsNotificationConfiguration> sqsNotificationConfiguration) {
            this.sqsNotificationConfiguration = sqsNotificationConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecuritylakeSubscriberNotificationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecuritylakeSubscriberNotificationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecuritylakeSubscriberNotificationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecuritylakeSubscriberNotificationConfiguration {
        private final java.lang.Object httpsNotificationConfiguration;
        private final java.lang.Object sqsNotificationConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.httpsNotificationConfiguration = software.amazon.jsii.Kernel.get(this, "httpsNotificationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sqsNotificationConfiguration = software.amazon.jsii.Kernel.get(this, "sqsNotificationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.httpsNotificationConfiguration = builder.httpsNotificationConfiguration;
            this.sqsNotificationConfiguration = builder.sqsNotificationConfiguration;
        }

        @Override
        public final java.lang.Object getHttpsNotificationConfiguration() {
            return this.httpsNotificationConfiguration;
        }

        @Override
        public final java.lang.Object getSqsNotificationConfiguration() {
            return this.sqsNotificationConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHttpsNotificationConfiguration() != null) {
                data.set("httpsNotificationConfiguration", om.valueToTree(this.getHttpsNotificationConfiguration()));
            }
            if (this.getSqsNotificationConfiguration() != null) {
                data.set("sqsNotificationConfiguration", om.valueToTree(this.getSqsNotificationConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securitylakeSubscriberNotification.SecuritylakeSubscriberNotificationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecuritylakeSubscriberNotificationConfiguration.Jsii$Proxy that = (SecuritylakeSubscriberNotificationConfiguration.Jsii$Proxy) o;

            if (this.httpsNotificationConfiguration != null ? !this.httpsNotificationConfiguration.equals(that.httpsNotificationConfiguration) : that.httpsNotificationConfiguration != null) return false;
            return this.sqsNotificationConfiguration != null ? this.sqsNotificationConfiguration.equals(that.sqsNotificationConfiguration) : that.sqsNotificationConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.httpsNotificationConfiguration != null ? this.httpsNotificationConfiguration.hashCode() : 0;
            result = 31 * result + (this.sqsNotificationConfiguration != null ? this.sqsNotificationConfiguration.hashCode() : 0);
            return result;
        }
    }
}
