package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#column_depth MedialiveChannel#column_depth}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getColumnDepth() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#include_fec MedialiveChannel#include_fec}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIncludeFec() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#row_length MedialiveChannel#row_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRowLength() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings> {
        java.lang.Number columnDepth;
        java.lang.String includeFec;
        java.lang.Number rowLength;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings#getColumnDepth}
         * @param columnDepth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#column_depth MedialiveChannel#column_depth}.
         * @return {@code this}
         */
        public Builder columnDepth(java.lang.Number columnDepth) {
            this.columnDepth = columnDepth;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings#getIncludeFec}
         * @param includeFec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#include_fec MedialiveChannel#include_fec}.
         * @return {@code this}
         */
        public Builder includeFec(java.lang.String includeFec) {
            this.includeFec = includeFec;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings#getRowLength}
         * @param rowLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#row_length MedialiveChannel#row_length}.
         * @return {@code this}
         */
        public Builder rowLength(java.lang.Number rowLength) {
            this.rowLength = rowLength;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings {
        private final java.lang.Number columnDepth;
        private final java.lang.String includeFec;
        private final java.lang.Number rowLength;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.columnDepth = software.amazon.jsii.Kernel.get(this, "columnDepth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.includeFec = software.amazon.jsii.Kernel.get(this, "includeFec", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rowLength = software.amazon.jsii.Kernel.get(this, "rowLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.columnDepth = builder.columnDepth;
            this.includeFec = builder.includeFec;
            this.rowLength = builder.rowLength;
        }

        @Override
        public final java.lang.Number getColumnDepth() {
            return this.columnDepth;
        }

        @Override
        public final java.lang.String getIncludeFec() {
            return this.includeFec;
        }

        @Override
        public final java.lang.Number getRowLength() {
            return this.rowLength;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getColumnDepth() != null) {
                data.set("columnDepth", om.valueToTree(this.getColumnDepth()));
            }
            if (this.getIncludeFec() != null) {
                data.set("includeFec", om.valueToTree(this.getIncludeFec()));
            }
            if (this.getRowLength() != null) {
                data.set("rowLength", om.valueToTree(this.getRowLength()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsUdpOutputSettingsFecOutputSettings.Jsii$Proxy) o;

            if (this.columnDepth != null ? !this.columnDepth.equals(that.columnDepth) : that.columnDepth != null) return false;
            if (this.includeFec != null ? !this.includeFec.equals(that.includeFec) : that.includeFec != null) return false;
            return this.rowLength != null ? this.rowLength.equals(that.rowLength) : that.rowLength == null;
        }

        @Override
        public final int hashCode() {
            int result = this.columnDepth != null ? this.columnDepth.hashCode() : 0;
            result = 31 * result + (this.includeFec != null ? this.includeFec.hashCode() : 0);
            result = 31 * result + (this.rowLength != null ? this.rowLength.hashCode() : 0);
            return result;
        }
    }
}
