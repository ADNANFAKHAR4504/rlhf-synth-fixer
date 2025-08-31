package imports.aws.cloudwatch_event_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.271Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader.Jsii$Proxy.class)
public interface CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#is_value_secret CloudwatchEventConnection#is_value_secret}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsValueSecret() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#key CloudwatchEventConnection#key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#value CloudwatchEventConnection#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader> {
        java.lang.Object isValueSecret;
        java.lang.String key;
        java.lang.String value;

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader#getIsValueSecret}
         * @param isValueSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#is_value_secret CloudwatchEventConnection#is_value_secret}.
         * @return {@code this}
         */
        public Builder isValueSecret(java.lang.Boolean isValueSecret) {
            this.isValueSecret = isValueSecret;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader#getIsValueSecret}
         * @param isValueSecret Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#is_value_secret CloudwatchEventConnection#is_value_secret}.
         * @return {@code this}
         */
        public Builder isValueSecret(com.hashicorp.cdktf.IResolvable isValueSecret) {
            this.isValueSecret = isValueSecret;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#key CloudwatchEventConnection#key}.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_connection#value CloudwatchEventConnection#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader {
        private final java.lang.Object isValueSecret;
        private final java.lang.String key;
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.isValueSecret = software.amazon.jsii.Kernel.get(this, "isValueSecret", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.isValueSecret = builder.isValueSecret;
            this.key = builder.key;
            this.value = builder.value;
        }

        @Override
        public final java.lang.Object getIsValueSecret() {
            return this.isValueSecret;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIsValueSecret() != null) {
                data.set("isValueSecret", om.valueToTree(this.getIsValueSecret()));
            }
            if (this.getKey() != null) {
                data.set("key", om.valueToTree(this.getKey()));
            }
            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventConnection.CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader.Jsii$Proxy that = (CloudwatchEventConnectionAuthParametersOauthOauthHttpParametersHeader.Jsii$Proxy) o;

            if (this.isValueSecret != null ? !this.isValueSecret.equals(that.isValueSecret) : that.isValueSecret != null) return false;
            if (this.key != null ? !this.key.equals(that.key) : that.key != null) return false;
            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.isValueSecret != null ? this.isValueSecret.hashCode() : 0;
            result = 31 * result + (this.key != null ? this.key.hashCode() : 0);
            result = 31 * result + (this.value != null ? this.value.hashCode() : 0);
            return result;
        }
    }
}
