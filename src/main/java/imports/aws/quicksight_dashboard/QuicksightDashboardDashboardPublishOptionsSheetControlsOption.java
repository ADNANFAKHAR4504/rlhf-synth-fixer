package imports.aws.quicksight_dashboard;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.103Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption")
@software.amazon.jsii.Jsii.Proxy(QuicksightDashboardDashboardPublishOptionsSheetControlsOption.Jsii$Proxy.class)
public interface QuicksightDashboardDashboardPublishOptionsSheetControlsOption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visibility_state QuicksightDashboard#visibility_state}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVisibilityState() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDashboardDashboardPublishOptionsSheetControlsOption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDashboardDashboardPublishOptionsSheetControlsOption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDashboardDashboardPublishOptionsSheetControlsOption> {
        java.lang.String visibilityState;

        /**
         * Sets the value of {@link QuicksightDashboardDashboardPublishOptionsSheetControlsOption#getVisibilityState}
         * @param visibilityState Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_dashboard#visibility_state QuicksightDashboard#visibility_state}.
         * @return {@code this}
         */
        public Builder visibilityState(java.lang.String visibilityState) {
            this.visibilityState = visibilityState;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDashboardDashboardPublishOptionsSheetControlsOption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDashboardDashboardPublishOptionsSheetControlsOption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDashboardDashboardPublishOptionsSheetControlsOption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDashboardDashboardPublishOptionsSheetControlsOption {
        private final java.lang.String visibilityState;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.visibilityState = software.amazon.jsii.Kernel.get(this, "visibilityState", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.visibilityState = builder.visibilityState;
        }

        @Override
        public final java.lang.String getVisibilityState() {
            return this.visibilityState;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getVisibilityState() != null) {
                data.set("visibilityState", om.valueToTree(this.getVisibilityState()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDashboard.QuicksightDashboardDashboardPublishOptionsSheetControlsOption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDashboardDashboardPublishOptionsSheetControlsOption.Jsii$Proxy that = (QuicksightDashboardDashboardPublishOptionsSheetControlsOption.Jsii$Proxy) o;

            return this.visibilityState != null ? this.visibilityState.equals(that.visibilityState) : that.visibilityState == null;
        }

        @Override
        public final int hashCode() {
            int result = this.visibilityState != null ? this.visibilityState.hashCode() : 0;
            return result;
        }
    }
}
