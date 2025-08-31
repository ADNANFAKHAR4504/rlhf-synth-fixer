package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.444Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsStartingPositionConfiguration")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationInputsStartingPositionConfiguration.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationInputsStartingPositionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#starting_position KinesisAnalyticsApplication#starting_position}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartingPosition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationInputsStartingPositionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationInputsStartingPositionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationInputsStartingPositionConfiguration> {
        java.lang.String startingPosition;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputsStartingPositionConfiguration#getStartingPosition}
         * @param startingPosition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#starting_position KinesisAnalyticsApplication#starting_position}.
         * @return {@code this}
         */
        public Builder startingPosition(java.lang.String startingPosition) {
            this.startingPosition = startingPosition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationInputsStartingPositionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationInputsStartingPositionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationInputsStartingPositionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationInputsStartingPositionConfiguration {
        private final java.lang.String startingPosition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.startingPosition = software.amazon.jsii.Kernel.get(this, "startingPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.startingPosition = builder.startingPosition;
        }

        @Override
        public final java.lang.String getStartingPosition() {
            return this.startingPosition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getStartingPosition() != null) {
                data.set("startingPosition", om.valueToTree(this.getStartingPosition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsStartingPositionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationInputsStartingPositionConfiguration.Jsii$Proxy that = (KinesisAnalyticsApplicationInputsStartingPositionConfiguration.Jsii$Proxy) o;

            return this.startingPosition != null ? this.startingPosition.equals(that.startingPosition) : that.startingPosition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.startingPosition != null ? this.startingPosition.hashCode() : 0;
            return result;
        }
    }
}
