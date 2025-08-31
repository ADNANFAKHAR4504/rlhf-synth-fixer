package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.548Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryNotificationConfiguration")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryNotificationConfiguration.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryNotificationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * sns_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#sns_configuration TimestreamqueryScheduledQuery#sns_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSnsConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryNotificationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryNotificationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryNotificationConfiguration> {
        java.lang.Object snsConfiguration;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryNotificationConfiguration#getSnsConfiguration}
         * @param snsConfiguration sns_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#sns_configuration TimestreamqueryScheduledQuery#sns_configuration}
         * @return {@code this}
         */
        public Builder snsConfiguration(com.hashicorp.cdktf.IResolvable snsConfiguration) {
            this.snsConfiguration = snsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryNotificationConfiguration#getSnsConfiguration}
         * @param snsConfiguration sns_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#sns_configuration TimestreamqueryScheduledQuery#sns_configuration}
         * @return {@code this}
         */
        public Builder snsConfiguration(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryNotificationConfigurationSnsConfiguration> snsConfiguration) {
            this.snsConfiguration = snsConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryNotificationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryNotificationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryNotificationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryNotificationConfiguration {
        private final java.lang.Object snsConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.snsConfiguration = software.amazon.jsii.Kernel.get(this, "snsConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.snsConfiguration = builder.snsConfiguration;
        }

        @Override
        public final java.lang.Object getSnsConfiguration() {
            return this.snsConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSnsConfiguration() != null) {
                data.set("snsConfiguration", om.valueToTree(this.getSnsConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryNotificationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryNotificationConfiguration.Jsii$Proxy that = (TimestreamqueryScheduledQueryNotificationConfiguration.Jsii$Proxy) o;

            return this.snsConfiguration != null ? this.snsConfiguration.equals(that.snsConfiguration) : that.snsConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.snsConfiguration != null ? this.snsConfiguration.hashCode() : 0;
            return result;
        }
    }
}
