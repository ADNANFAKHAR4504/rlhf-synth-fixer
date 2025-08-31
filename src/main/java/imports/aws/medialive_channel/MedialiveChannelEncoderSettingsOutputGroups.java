package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.869Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroups")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroups.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroups extends software.amazon.jsii.JsiiSerializable {

    /**
     * output_group_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_group_settings MedialiveChannel#output_group_settings}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings getOutputGroupSettings();

    /**
     * outputs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#outputs MedialiveChannel#outputs}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getOutputs();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroups}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroups}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroups> {
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings outputGroupSettings;
        java.lang.Object outputs;
        java.lang.String name;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroups#getOutputGroupSettings}
         * @param outputGroupSettings output_group_settings block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#output_group_settings MedialiveChannel#output_group_settings}
         * @return {@code this}
         */
        public Builder outputGroupSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings outputGroupSettings) {
            this.outputGroupSettings = outputGroupSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroups#getOutputs}
         * @param outputs outputs block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#outputs MedialiveChannel#outputs}
         * @return {@code this}
         */
        public Builder outputs(com.hashicorp.cdktf.IResolvable outputs) {
            this.outputs = outputs;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroups#getOutputs}
         * @param outputs outputs block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#outputs MedialiveChannel#outputs}
         * @return {@code this}
         */
        public Builder outputs(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputs> outputs) {
            this.outputs = outputs;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroups#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroups}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroups build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroups}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroups {
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings outputGroupSettings;
        private final java.lang.Object outputs;
        private final java.lang.String name;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.outputGroupSettings = software.amazon.jsii.Kernel.get(this, "outputGroupSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings.class));
            this.outputs = software.amazon.jsii.Kernel.get(this, "outputs", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.outputGroupSettings = java.util.Objects.requireNonNull(builder.outputGroupSettings, "outputGroupSettings is required");
            this.outputs = java.util.Objects.requireNonNull(builder.outputs, "outputs is required");
            this.name = builder.name;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettings getOutputGroupSettings() {
            return this.outputGroupSettings;
        }

        @Override
        public final java.lang.Object getOutputs() {
            return this.outputs;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("outputGroupSettings", om.valueToTree(this.getOutputGroupSettings()));
            data.set("outputs", om.valueToTree(this.getOutputs()));
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroups"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroups.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroups.Jsii$Proxy) o;

            if (!outputGroupSettings.equals(that.outputGroupSettings)) return false;
            if (!outputs.equals(that.outputs)) return false;
            return this.name != null ? this.name.equals(that.name) : that.name == null;
        }

        @Override
        public final int hashCode() {
            int result = this.outputGroupSettings.hashCode();
            result = 31 * result + (this.outputs.hashCode());
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            return result;
        }
    }
}
