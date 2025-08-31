package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#snapshots_enabled Kinesisanalyticsv2Application#snapshots_enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getSnapshotsEnabled();

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration> {
        java.lang.Object snapshotsEnabled;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration#getSnapshotsEnabled}
         * @param snapshotsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#snapshots_enabled Kinesisanalyticsv2Application#snapshots_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder snapshotsEnabled(java.lang.Boolean snapshotsEnabled) {
            this.snapshotsEnabled = snapshotsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration#getSnapshotsEnabled}
         * @param snapshotsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#snapshots_enabled Kinesisanalyticsv2Application#snapshots_enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder snapshotsEnabled(com.hashicorp.cdktf.IResolvable snapshotsEnabled) {
            this.snapshotsEnabled = snapshotsEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration {
        private final java.lang.Object snapshotsEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.snapshotsEnabled = software.amazon.jsii.Kernel.get(this, "snapshotsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.snapshotsEnabled = java.util.Objects.requireNonNull(builder.snapshotsEnabled, "snapshotsEnabled is required");
        }

        @Override
        public final java.lang.Object getSnapshotsEnabled() {
            return this.snapshotsEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("snapshotsEnabled", om.valueToTree(this.getSnapshotsEnabled()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration.Jsii$Proxy) o;

            return this.snapshotsEnabled.equals(that.snapshotsEnabled);
        }

        @Override
        public final int hashCode() {
            int result = this.snapshotsEnabled.hashCode();
            return result;
        }
    }
}
