package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#secondary_input_id MedialiveChannel#secondary_input_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecondaryInputId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#error_clear_time_msec MedialiveChannel#error_clear_time_msec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getErrorClearTimeMsec() {
        return null;
    }

    /**
     * failover_condition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#failover_condition MedialiveChannel#failover_condition}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailoverCondition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_preference MedialiveChannel#input_preference}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputPreference() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings> {
        java.lang.String secondaryInputId;
        java.lang.Number errorClearTimeMsec;
        java.lang.Object failoverCondition;
        java.lang.String inputPreference;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings#getSecondaryInputId}
         * @param secondaryInputId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#secondary_input_id MedialiveChannel#secondary_input_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder secondaryInputId(java.lang.String secondaryInputId) {
            this.secondaryInputId = secondaryInputId;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings#getErrorClearTimeMsec}
         * @param errorClearTimeMsec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#error_clear_time_msec MedialiveChannel#error_clear_time_msec}.
         * @return {@code this}
         */
        public Builder errorClearTimeMsec(java.lang.Number errorClearTimeMsec) {
            this.errorClearTimeMsec = errorClearTimeMsec;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings#getFailoverCondition}
         * @param failoverCondition failover_condition block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#failover_condition MedialiveChannel#failover_condition}
         * @return {@code this}
         */
        public Builder failoverCondition(com.hashicorp.cdktf.IResolvable failoverCondition) {
            this.failoverCondition = failoverCondition;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings#getFailoverCondition}
         * @param failoverCondition failover_condition block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#failover_condition MedialiveChannel#failover_condition}
         * @return {@code this}
         */
        public Builder failoverCondition(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettingsFailoverCondition> failoverCondition) {
            this.failoverCondition = failoverCondition;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings#getInputPreference}
         * @param inputPreference Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_preference MedialiveChannel#input_preference}.
         * @return {@code this}
         */
        public Builder inputPreference(java.lang.String inputPreference) {
            this.inputPreference = inputPreference;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings {
        private final java.lang.String secondaryInputId;
        private final java.lang.Number errorClearTimeMsec;
        private final java.lang.Object failoverCondition;
        private final java.lang.String inputPreference;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.secondaryInputId = software.amazon.jsii.Kernel.get(this, "secondaryInputId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.errorClearTimeMsec = software.amazon.jsii.Kernel.get(this, "errorClearTimeMsec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.failoverCondition = software.amazon.jsii.Kernel.get(this, "failoverCondition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.inputPreference = software.amazon.jsii.Kernel.get(this, "inputPreference", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.secondaryInputId = java.util.Objects.requireNonNull(builder.secondaryInputId, "secondaryInputId is required");
            this.errorClearTimeMsec = builder.errorClearTimeMsec;
            this.failoverCondition = builder.failoverCondition;
            this.inputPreference = builder.inputPreference;
        }

        @Override
        public final java.lang.String getSecondaryInputId() {
            return this.secondaryInputId;
        }

        @Override
        public final java.lang.Number getErrorClearTimeMsec() {
            return this.errorClearTimeMsec;
        }

        @Override
        public final java.lang.Object getFailoverCondition() {
            return this.failoverCondition;
        }

        @Override
        public final java.lang.String getInputPreference() {
            return this.inputPreference;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("secondaryInputId", om.valueToTree(this.getSecondaryInputId()));
            if (this.getErrorClearTimeMsec() != null) {
                data.set("errorClearTimeMsec", om.valueToTree(this.getErrorClearTimeMsec()));
            }
            if (this.getFailoverCondition() != null) {
                data.set("failoverCondition", om.valueToTree(this.getFailoverCondition()));
            }
            if (this.getInputPreference() != null) {
                data.set("inputPreference", om.valueToTree(this.getInputPreference()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings.Jsii$Proxy that = (MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings.Jsii$Proxy) o;

            if (!secondaryInputId.equals(that.secondaryInputId)) return false;
            if (this.errorClearTimeMsec != null ? !this.errorClearTimeMsec.equals(that.errorClearTimeMsec) : that.errorClearTimeMsec != null) return false;
            if (this.failoverCondition != null ? !this.failoverCondition.equals(that.failoverCondition) : that.failoverCondition != null) return false;
            return this.inputPreference != null ? this.inputPreference.equals(that.inputPreference) : that.inputPreference == null;
        }

        @Override
        public final int hashCode() {
            int result = this.secondaryInputId.hashCode();
            result = 31 * result + (this.errorClearTimeMsec != null ? this.errorClearTimeMsec.hashCode() : 0);
            result = 31 * result + (this.failoverCondition != null ? this.failoverCondition.hashCode() : 0);
            result = 31 * result + (this.inputPreference != null ? this.inputPreference.hashCode() : 0);
            return result;
        }
    }
}
