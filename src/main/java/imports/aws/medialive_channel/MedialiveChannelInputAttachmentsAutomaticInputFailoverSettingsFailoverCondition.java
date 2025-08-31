package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition extends software.amazon.jsii.JsiiSerializable {

    /**
     * failover_condition_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#failover_condition_settings MedialiveChannel#failover_condition_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings getFailoverConditionSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition> {
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings failoverConditionSettings;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition#getFailoverConditionSettings}
         * @param failoverConditionSettings failover_condition_settings block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#failover_condition_settings MedialiveChannel#failover_condition_settings}
         * @return {@code this}
         */
        public Builder failoverConditionSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings failoverConditionSettings) {
            this.failoverConditionSettings = failoverConditionSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition {
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings failoverConditionSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.failoverConditionSettings = software.amazon.jsii.Kernel.get(this, "failoverConditionSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.failoverConditionSettings = builder.failoverConditionSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverConditionFailoverConditionSettings getFailoverConditionSettings() {
            return this.failoverConditionSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFailoverConditionSettings() != null) {
                data.set("failoverConditionSettings", om.valueToTree(this.getFailoverConditionSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition.Jsii$Proxy that = (MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition.Jsii$Proxy) o;

            return this.failoverConditionSettings != null ? this.failoverConditionSettings.equals(that.failoverConditionSettings) : that.failoverConditionSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.failoverConditionSettings != null ? this.failoverConditionSettings.hashCode() : 0;
            return result;
        }
    }
}
