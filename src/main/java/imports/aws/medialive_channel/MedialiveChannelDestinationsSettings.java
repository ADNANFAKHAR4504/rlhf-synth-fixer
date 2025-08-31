package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.864Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelDestinationsSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelDestinationsSettings.Jsii$Proxy.class)
public interface MedialiveChannelDestinationsSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#password_param MedialiveChannel#password_param}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPasswordParam() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#stream_name MedialiveChannel#stream_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStreamName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#url MedialiveChannel#url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUrl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#username MedialiveChannel#username}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsername() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelDestinationsSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelDestinationsSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelDestinationsSettings> {
        java.lang.String passwordParam;
        java.lang.String streamName;
        java.lang.String url;
        java.lang.String username;

        /**
         * Sets the value of {@link MedialiveChannelDestinationsSettings#getPasswordParam}
         * @param passwordParam Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#password_param MedialiveChannel#password_param}.
         * @return {@code this}
         */
        public Builder passwordParam(java.lang.String passwordParam) {
            this.passwordParam = passwordParam;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinationsSettings#getStreamName}
         * @param streamName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#stream_name MedialiveChannel#stream_name}.
         * @return {@code this}
         */
        public Builder streamName(java.lang.String streamName) {
            this.streamName = streamName;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinationsSettings#getUrl}
         * @param url Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#url MedialiveChannel#url}.
         * @return {@code this}
         */
        public Builder url(java.lang.String url) {
            this.url = url;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinationsSettings#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#username MedialiveChannel#username}.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelDestinationsSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelDestinationsSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelDestinationsSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelDestinationsSettings {
        private final java.lang.String passwordParam;
        private final java.lang.String streamName;
        private final java.lang.String url;
        private final java.lang.String username;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.passwordParam = software.amazon.jsii.Kernel.get(this, "passwordParam", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.streamName = software.amazon.jsii.Kernel.get(this, "streamName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.url = software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.passwordParam = builder.passwordParam;
            this.streamName = builder.streamName;
            this.url = builder.url;
            this.username = builder.username;
        }

        @Override
        public final java.lang.String getPasswordParam() {
            return this.passwordParam;
        }

        @Override
        public final java.lang.String getStreamName() {
            return this.streamName;
        }

        @Override
        public final java.lang.String getUrl() {
            return this.url;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPasswordParam() != null) {
                data.set("passwordParam", om.valueToTree(this.getPasswordParam()));
            }
            if (this.getStreamName() != null) {
                data.set("streamName", om.valueToTree(this.getStreamName()));
            }
            if (this.getUrl() != null) {
                data.set("url", om.valueToTree(this.getUrl()));
            }
            if (this.getUsername() != null) {
                data.set("username", om.valueToTree(this.getUsername()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelDestinationsSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelDestinationsSettings.Jsii$Proxy that = (MedialiveChannelDestinationsSettings.Jsii$Proxy) o;

            if (this.passwordParam != null ? !this.passwordParam.equals(that.passwordParam) : that.passwordParam != null) return false;
            if (this.streamName != null ? !this.streamName.equals(that.streamName) : that.streamName != null) return false;
            if (this.url != null ? !this.url.equals(that.url) : that.url != null) return false;
            return this.username != null ? this.username.equals(that.username) : that.username == null;
        }

        @Override
        public final int hashCode() {
            int result = this.passwordParam != null ? this.passwordParam.hashCode() : 0;
            result = 31 * result + (this.streamName != null ? this.streamName.hashCode() : 0);
            result = 31 * result + (this.url != null ? this.url.hashCode() : 0);
            result = 31 * result + (this.username != null ? this.username.hashCode() : 0);
            return result;
        }
    }
}
