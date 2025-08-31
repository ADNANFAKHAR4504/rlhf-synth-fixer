package imports.aws.sesv2_configuration_set_event_destination;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.457Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestination")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetEventDestinationEventDestination.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetEventDestinationEventDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#matching_event_types Sesv2ConfigurationSetEventDestination#matching_event_types}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMatchingEventTypes();

    /**
     * cloud_watch_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#cloud_watch_destination Sesv2ConfigurationSetEventDestination#cloud_watch_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination getCloudWatchDestination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#enabled Sesv2ConfigurationSetEventDestination#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * event_bridge_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#event_bridge_destination Sesv2ConfigurationSetEventDestination#event_bridge_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination getEventBridgeDestination() {
        return null;
    }

    /**
     * kinesis_firehose_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#kinesis_firehose_destination Sesv2ConfigurationSetEventDestination#kinesis_firehose_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination getKinesisFirehoseDestination() {
        return null;
    }

    /**
     * pinpoint_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#pinpoint_destination Sesv2ConfigurationSetEventDestination#pinpoint_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination getPinpointDestination() {
        return null;
    }

    /**
     * sns_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#sns_destination Sesv2ConfigurationSetEventDestination#sns_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination getSnsDestination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetEventDestinationEventDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetEventDestinationEventDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetEventDestinationEventDestination> {
        java.util.List<java.lang.String> matchingEventTypes;
        imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination cloudWatchDestination;
        java.lang.Object enabled;
        imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination eventBridgeDestination;
        imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination kinesisFirehoseDestination;
        imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination pinpointDestination;
        imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination snsDestination;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestination#getMatchingEventTypes}
         * @param matchingEventTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#matching_event_types Sesv2ConfigurationSetEventDestination#matching_event_types}. This parameter is required.
         * @return {@code this}
         */
        public Builder matchingEventTypes(java.util.List<java.lang.String> matchingEventTypes) {
            this.matchingEventTypes = matchingEventTypes;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestination#getCloudWatchDestination}
         * @param cloudWatchDestination cloud_watch_destination block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#cloud_watch_destination Sesv2ConfigurationSetEventDestination#cloud_watch_destination}
         * @return {@code this}
         */
        public Builder cloudWatchDestination(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination cloudWatchDestination) {
            this.cloudWatchDestination = cloudWatchDestination;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestination#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#enabled Sesv2ConfigurationSetEventDestination#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestination#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#enabled Sesv2ConfigurationSetEventDestination#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestination#getEventBridgeDestination}
         * @param eventBridgeDestination event_bridge_destination block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#event_bridge_destination Sesv2ConfigurationSetEventDestination#event_bridge_destination}
         * @return {@code this}
         */
        public Builder eventBridgeDestination(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination eventBridgeDestination) {
            this.eventBridgeDestination = eventBridgeDestination;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestination#getKinesisFirehoseDestination}
         * @param kinesisFirehoseDestination kinesis_firehose_destination block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#kinesis_firehose_destination Sesv2ConfigurationSetEventDestination#kinesis_firehose_destination}
         * @return {@code this}
         */
        public Builder kinesisFirehoseDestination(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination kinesisFirehoseDestination) {
            this.kinesisFirehoseDestination = kinesisFirehoseDestination;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestination#getPinpointDestination}
         * @param pinpointDestination pinpoint_destination block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#pinpoint_destination Sesv2ConfigurationSetEventDestination#pinpoint_destination}
         * @return {@code this}
         */
        public Builder pinpointDestination(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination pinpointDestination) {
            this.pinpointDestination = pinpointDestination;
            return this;
        }

        /**
         * Sets the value of {@link Sesv2ConfigurationSetEventDestinationEventDestination#getSnsDestination}
         * @param snsDestination sns_destination block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set_event_destination#sns_destination Sesv2ConfigurationSetEventDestination#sns_destination}
         * @return {@code this}
         */
        public Builder snsDestination(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination snsDestination) {
            this.snsDestination = snsDestination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetEventDestinationEventDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetEventDestinationEventDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetEventDestinationEventDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetEventDestinationEventDestination {
        private final java.util.List<java.lang.String> matchingEventTypes;
        private final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination cloudWatchDestination;
        private final java.lang.Object enabled;
        private final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination eventBridgeDestination;
        private final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination kinesisFirehoseDestination;
        private final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination pinpointDestination;
        private final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination snsDestination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.matchingEventTypes = software.amazon.jsii.Kernel.get(this, "matchingEventTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cloudWatchDestination = software.amazon.jsii.Kernel.get(this, "cloudWatchDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.eventBridgeDestination = software.amazon.jsii.Kernel.get(this, "eventBridgeDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination.class));
            this.kinesisFirehoseDestination = software.amazon.jsii.Kernel.get(this, "kinesisFirehoseDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination.class));
            this.pinpointDestination = software.amazon.jsii.Kernel.get(this, "pinpointDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination.class));
            this.snsDestination = software.amazon.jsii.Kernel.get(this, "snsDestination", software.amazon.jsii.NativeType.forClass(imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.matchingEventTypes = java.util.Objects.requireNonNull(builder.matchingEventTypes, "matchingEventTypes is required");
            this.cloudWatchDestination = builder.cloudWatchDestination;
            this.enabled = builder.enabled;
            this.eventBridgeDestination = builder.eventBridgeDestination;
            this.kinesisFirehoseDestination = builder.kinesisFirehoseDestination;
            this.pinpointDestination = builder.pinpointDestination;
            this.snsDestination = builder.snsDestination;
        }

        @Override
        public final java.util.List<java.lang.String> getMatchingEventTypes() {
            return this.matchingEventTypes;
        }

        @Override
        public final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationCloudWatchDestination getCloudWatchDestination() {
            return this.cloudWatchDestination;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationEventBridgeDestination getEventBridgeDestination() {
            return this.eventBridgeDestination;
        }

        @Override
        public final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationKinesisFirehoseDestination getKinesisFirehoseDestination() {
            return this.kinesisFirehoseDestination;
        }

        @Override
        public final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationPinpointDestination getPinpointDestination() {
            return this.pinpointDestination;
        }

        @Override
        public final imports.aws.sesv2_configuration_set_event_destination.Sesv2ConfigurationSetEventDestinationEventDestinationSnsDestination getSnsDestination() {
            return this.snsDestination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("matchingEventTypes", om.valueToTree(this.getMatchingEventTypes()));
            if (this.getCloudWatchDestination() != null) {
                data.set("cloudWatchDestination", om.valueToTree(this.getCloudWatchDestination()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getEventBridgeDestination() != null) {
                data.set("eventBridgeDestination", om.valueToTree(this.getEventBridgeDestination()));
            }
            if (this.getKinesisFirehoseDestination() != null) {
                data.set("kinesisFirehoseDestination", om.valueToTree(this.getKinesisFirehoseDestination()));
            }
            if (this.getPinpointDestination() != null) {
                data.set("pinpointDestination", om.valueToTree(this.getPinpointDestination()));
            }
            if (this.getSnsDestination() != null) {
                data.set("snsDestination", om.valueToTree(this.getSnsDestination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSetEventDestination.Sesv2ConfigurationSetEventDestinationEventDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetEventDestinationEventDestination.Jsii$Proxy that = (Sesv2ConfigurationSetEventDestinationEventDestination.Jsii$Proxy) o;

            if (!matchingEventTypes.equals(that.matchingEventTypes)) return false;
            if (this.cloudWatchDestination != null ? !this.cloudWatchDestination.equals(that.cloudWatchDestination) : that.cloudWatchDestination != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.eventBridgeDestination != null ? !this.eventBridgeDestination.equals(that.eventBridgeDestination) : that.eventBridgeDestination != null) return false;
            if (this.kinesisFirehoseDestination != null ? !this.kinesisFirehoseDestination.equals(that.kinesisFirehoseDestination) : that.kinesisFirehoseDestination != null) return false;
            if (this.pinpointDestination != null ? !this.pinpointDestination.equals(that.pinpointDestination) : that.pinpointDestination != null) return false;
            return this.snsDestination != null ? this.snsDestination.equals(that.snsDestination) : that.snsDestination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.matchingEventTypes.hashCode();
            result = 31 * result + (this.cloudWatchDestination != null ? this.cloudWatchDestination.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.eventBridgeDestination != null ? this.eventBridgeDestination.hashCode() : 0);
            result = 31 * result + (this.kinesisFirehoseDestination != null ? this.kinesisFirehoseDestination.hashCode() : 0);
            result = 31 * result + (this.pinpointDestination != null ? this.pinpointDestination.hashCode() : 0);
            result = 31 * result + (this.snsDestination != null ? this.snsDestination.hashCode() : 0);
            return result;
        }
    }
}
