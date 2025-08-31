package imports.aws.quicksight_dashboard;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.103Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption")
@software.amazon.jsii.Jsii.Proxy(QuicksightDashboardDashboardPublishOptionsVisualMenuOption.Jsii$Proxy.class)
public interface QuicksightDashboardDashboardPublishOptionsVisualMenuOption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDashboardDashboardPublishOptionsVisualMenuOption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDashboardDashboardPublishOptionsVisualMenuOption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDashboardDashboardPublishOptionsVisualMenuOption> {
        java.lang.String availabilityStatus;

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptionsVisualMenuOption#getAvailabilityStatus}
         * @param availabilityStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#availability_status QuicksightDashboard#availability_status}.
         * @return {@code this}
         */
        public Builder availabilityStatus(java.lang.String availabilityStatus) {
            this.availabilityStatus = availabilityStatus;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDashboardDashboardPublishOptionsVisualMenuOption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDashboardDashboardPublishOptionsVisualMenuOption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDashboardDashboardPublishOptionsVisualMenuOption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDashboardDashboardPublishOptionsVisualMenuOption {
        private final java.lang.String availabilityStatus;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availabilityStatus = software.amazon.jsii.Kernel.get(this, "availabilityStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availabilityStatus = builder.availabilityStatus;
        }

        @Override
        public final java.lang.String getAvailabilityStatus() {
            return this.availabilityStatus;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAvailabilityStatus() != null) {
                data.set("availabilityStatus", om.valueToTree(this.getAvailabilityStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsVisualMenuOption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDashboardDashboardPublishOptionsVisualMenuOption.Jsii$Proxy that = (QuicksightDashboardDashboardPublishOptionsVisualMenuOption.Jsii$Proxy) o;

            return this.availabilityStatus != null ? this.availabilityStatus.equals(that.availabilityStatus) : that.availabilityStatus == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availabilityStatus != null ? this.availabilityStatus.hashCode() : 0;
            return result;
        }
    }
}
