package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.470Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#application_restore_type Kinesisanalyticsv2Application#application_restore_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplicationRestoreType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#snapshot_name Kinesisanalyticsv2Application#snapshot_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration> {
        java.lang.String applicationRestoreType;
        java.lang.String snapshotName;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration#getApplicationRestoreType}
         * @param applicationRestoreType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#application_restore_type Kinesisanalyticsv2Application#application_restore_type}.
         * @return {@code this}
         */
        public Builder applicationRestoreType(java.lang.String applicationRestoreType) {
            this.applicationRestoreType = applicationRestoreType;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration#getSnapshotName}
         * @param snapshotName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#snapshot_name Kinesisanalyticsv2Application#snapshot_name}.
         * @return {@code this}
         */
        public Builder snapshotName(java.lang.String snapshotName) {
            this.snapshotName = snapshotName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration {
        private final java.lang.String applicationRestoreType;
        private final java.lang.String snapshotName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.applicationRestoreType = software.amazon.jsii.Kernel.get(this, "applicationRestoreType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotName = software.amazon.jsii.Kernel.get(this, "snapshotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.applicationRestoreType = builder.applicationRestoreType;
            this.snapshotName = builder.snapshotName;
        }

        @Override
        public final java.lang.String getApplicationRestoreType() {
            return this.applicationRestoreType;
        }

        @Override
        public final java.lang.String getSnapshotName() {
            return this.snapshotName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getApplicationRestoreType() != null) {
                data.set("applicationRestoreType", om.valueToTree(this.getApplicationRestoreType()));
            }
            if (this.getSnapshotName() != null) {
                data.set("snapshotName", om.valueToTree(this.getSnapshotName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationRunConfigurationApplicationRestoreConfiguration.Jsii$Proxy) o;

            if (this.applicationRestoreType != null ? !this.applicationRestoreType.equals(that.applicationRestoreType) : that.applicationRestoreType != null) return false;
            return this.snapshotName != null ? this.snapshotName.equals(that.snapshotName) : that.snapshotName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.applicationRestoreType != null ? this.applicationRestoreType.hashCode() : 0;
            result = 31 * result + (this.snapshotName != null ? this.snapshotName.hashCode() : 0);
            return result;
        }
    }
}
