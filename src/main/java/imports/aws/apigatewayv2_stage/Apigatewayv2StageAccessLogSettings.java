package imports.aws.apigatewayv2_stage;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.973Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Stage.Apigatewayv2StageAccessLogSettings")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2StageAccessLogSettings.Jsii$Proxy.class)
public interface Apigatewayv2StageAccessLogSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#destination_arn Apigatewayv2Stage#destination_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDestinationArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#format Apigatewayv2Stage#format}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFormat();

    /**
     * @return a {@link Builder} of {@link Apigatewayv2StageAccessLogSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2StageAccessLogSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2StageAccessLogSettings> {
        java.lang.String destinationArn;
        java.lang.String format;

        /**
         * Sets the value of {@link Apigatewayv2StageAccessLogSettings#getDestinationArn}
         * @param destinationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#destination_arn Apigatewayv2Stage#destination_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder destinationArn(java.lang.String destinationArn) {
            this.destinationArn = destinationArn;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2StageAccessLogSettings#getFormat}
         * @param format Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#format Apigatewayv2Stage#format}. This parameter is required.
         * @return {@code this}
         */
        public Builder format(java.lang.String format) {
            this.format = format;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Apigatewayv2StageAccessLogSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2StageAccessLogSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2StageAccessLogSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2StageAccessLogSettings {
        private final java.lang.String destinationArn;
        private final java.lang.String format;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationArn = software.amazon.jsii.Kernel.get(this, "destinationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.format = software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationArn = java.util.Objects.requireNonNull(builder.destinationArn, "destinationArn is required");
            this.format = java.util.Objects.requireNonNull(builder.format, "format is required");
        }

        @Override
        public final java.lang.String getDestinationArn() {
            return this.destinationArn;
        }

        @Override
        public final java.lang.String getFormat() {
            return this.format;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destinationArn", om.valueToTree(this.getDestinationArn()));
            data.set("format", om.valueToTree(this.getFormat()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Stage.Apigatewayv2StageAccessLogSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2StageAccessLogSettings.Jsii$Proxy that = (Apigatewayv2StageAccessLogSettings.Jsii$Proxy) o;

            if (!destinationArn.equals(that.destinationArn)) return false;
            return this.format.equals(that.format);
        }

        @Override
        public final int hashCode() {
            int result = this.destinationArn.hashCode();
            result = 31 * result + (this.format.hashCode());
            return result;
        }
    }
}
