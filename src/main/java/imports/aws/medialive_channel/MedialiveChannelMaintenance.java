package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelMaintenance")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelMaintenance.Jsii$Proxy.class)
public interface MedialiveChannelMaintenance extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#maintenance_day MedialiveChannel#maintenance_day}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMaintenanceDay();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#maintenance_start_time MedialiveChannel#maintenance_start_time}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMaintenanceStartTime();

    /**
     * @return a {@link Builder} of {@link MedialiveChannelMaintenance}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelMaintenance}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelMaintenance> {
        java.lang.String maintenanceDay;
        java.lang.String maintenanceStartTime;

        /**
         * Sets the value of {@link MedialiveChannelMaintenance#getMaintenanceDay}
         * @param maintenanceDay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#maintenance_day MedialiveChannel#maintenance_day}. This parameter is required.
         * @return {@code this}
         */
        public Builder maintenanceDay(java.lang.String maintenanceDay) {
            this.maintenanceDay = maintenanceDay;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelMaintenance#getMaintenanceStartTime}
         * @param maintenanceStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#maintenance_start_time MedialiveChannel#maintenance_start_time}. This parameter is required.
         * @return {@code this}
         */
        public Builder maintenanceStartTime(java.lang.String maintenanceStartTime) {
            this.maintenanceStartTime = maintenanceStartTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelMaintenance}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelMaintenance build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelMaintenance}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelMaintenance {
        private final java.lang.String maintenanceDay;
        private final java.lang.String maintenanceStartTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maintenanceDay = software.amazon.jsii.Kernel.get(this, "maintenanceDay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maintenanceStartTime = software.amazon.jsii.Kernel.get(this, "maintenanceStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maintenanceDay = java.util.Objects.requireNonNull(builder.maintenanceDay, "maintenanceDay is required");
            this.maintenanceStartTime = java.util.Objects.requireNonNull(builder.maintenanceStartTime, "maintenanceStartTime is required");
        }

        @Override
        public final java.lang.String getMaintenanceDay() {
            return this.maintenanceDay;
        }

        @Override
        public final java.lang.String getMaintenanceStartTime() {
            return this.maintenanceStartTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maintenanceDay", om.valueToTree(this.getMaintenanceDay()));
            data.set("maintenanceStartTime", om.valueToTree(this.getMaintenanceStartTime()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelMaintenance"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelMaintenance.Jsii$Proxy that = (MedialiveChannelMaintenance.Jsii$Proxy) o;

            if (!maintenanceDay.equals(that.maintenanceDay)) return false;
            return this.maintenanceStartTime.equals(that.maintenanceStartTime);
        }

        @Override
        public final int hashCode() {
            int result = this.maintenanceDay.hashCode();
            result = 31 * result + (this.maintenanceStartTime.hashCode());
            return result;
        }
    }
}
