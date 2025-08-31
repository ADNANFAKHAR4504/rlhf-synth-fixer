package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.884Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelInputAttachments")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelInputAttachments.Jsii$Proxy.class)
public interface MedialiveChannelInputAttachments extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_attachment_name MedialiveChannel#input_attachment_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInputAttachmentName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_id MedialiveChannel#input_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getInputId();

    /**
     * automatic_input_failover_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#automatic_input_failover_settings MedialiveChannel#automatic_input_failover_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings getAutomaticInputFailoverSettings() {
        return null;
    }

    /**
     * input_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_settings MedialiveChannel#input_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings getInputSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelInputAttachments}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelInputAttachments}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelInputAttachments> {
        java.lang.String inputAttachmentName;
        java.lang.String inputId;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings automaticInputFailoverSettings;
        imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings inputSettings;

        /**
         * Sets the value of {@link MedialiveChannelInputAttachments#getInputAttachmentName}
         * @param inputAttachmentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_attachment_name MedialiveChannel#input_attachment_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder inputAttachmentName(java.lang.String inputAttachmentName) {
            this.inputAttachmentName = inputAttachmentName;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachments#getInputId}
         * @param inputId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_id MedialiveChannel#input_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder inputId(java.lang.String inputId) {
            this.inputId = inputId;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachments#getAutomaticInputFailoverSettings}
         * @param automaticInputFailoverSettings automatic_input_failover_settings block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#automatic_input_failover_settings MedialiveChannel#automatic_input_failover_settings}
         * @return {@code this}
         */
        public Builder automaticInputFailoverSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings automaticInputFailoverSettings) {
            this.automaticInputFailoverSettings = automaticInputFailoverSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelInputAttachments#getInputSettings}
         * @param inputSettings input_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_settings MedialiveChannel#input_settings}
         * @return {@code this}
         */
        public Builder inputSettings(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings inputSettings) {
            this.inputSettings = inputSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelInputAttachments}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelInputAttachments build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelInputAttachments}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelInputAttachments {
        private final java.lang.String inputAttachmentName;
        private final java.lang.String inputId;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings automaticInputFailoverSettings;
        private final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings inputSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputAttachmentName = software.amazon.jsii.Kernel.get(this, "inputAttachmentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputId = software.amazon.jsii.Kernel.get(this, "inputId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.automaticInputFailoverSettings = software.amazon.jsii.Kernel.get(this, "automaticInputFailoverSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings.class));
            this.inputSettings = software.amazon.jsii.Kernel.get(this, "inputSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputAttachmentName = java.util.Objects.requireNonNull(builder.inputAttachmentName, "inputAttachmentName is required");
            this.inputId = java.util.Objects.requireNonNull(builder.inputId, "inputId is required");
            this.automaticInputFailoverSettings = builder.automaticInputFailoverSettings;
            this.inputSettings = builder.inputSettings;
        }

        @Override
        public final java.lang.String getInputAttachmentName() {
            return this.inputAttachmentName;
        }

        @Override
        public final java.lang.String getInputId() {
            return this.inputId;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsAutomaticInputFailoverSettings getAutomaticInputFailoverSettings() {
            return this.automaticInputFailoverSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputAttachmentsInputSettings getInputSettings() {
            return this.inputSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("inputAttachmentName", om.valueToTree(this.getInputAttachmentName()));
            data.set("inputId", om.valueToTree(this.getInputId()));
            if (this.getAutomaticInputFailoverSettings() != null) {
                data.set("automaticInputFailoverSettings", om.valueToTree(this.getAutomaticInputFailoverSettings()));
            }
            if (this.getInputSettings() != null) {
                data.set("inputSettings", om.valueToTree(this.getInputSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelInputAttachments"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelInputAttachments.Jsii$Proxy that = (MedialiveChannelInputAttachments.Jsii$Proxy) o;

            if (!inputAttachmentName.equals(that.inputAttachmentName)) return false;
            if (!inputId.equals(that.inputId)) return false;
            if (this.automaticInputFailoverSettings != null ? !this.automaticInputFailoverSettings.equals(that.automaticInputFailoverSettings) : that.automaticInputFailoverSettings != null) return false;
            return this.inputSettings != null ? this.inputSettings.equals(that.inputSettings) : that.inputSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inputAttachmentName.hashCode();
            result = 31 * result + (this.inputId.hashCode());
            result = 31 * result + (this.automaticInputFailoverSettings != null ? this.automaticInputFailoverSettings.hashCode() : 0);
            result = 31 * result + (this.inputSettings != null ? this.inputSettings.hashCode() : 0);
            return result;
        }
    }
}
