package imports.aws.lightsail_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.828Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailInstance.LightsailInstanceAddOn")
@software.amazon.jsii.Jsii.Proxy(LightsailInstanceAddOn.Jsii$Proxy.class)
public interface LightsailInstanceAddOn extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance#snapshot_time LightsailInstance#snapshot_time}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSnapshotTime();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance#status LightsailInstance#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance#type LightsailInstance#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link LightsailInstanceAddOn}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailInstanceAddOn}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailInstanceAddOn> {
        java.lang.String snapshotTime;
        java.lang.String status;
        java.lang.String type;

        /**
         * Sets the value of {@link LightsailInstanceAddOn#getSnapshotTime}
         * @param snapshotTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance#snapshot_time LightsailInstance#snapshot_time}. This parameter is required.
         * @return {@code this}
         */
        public Builder snapshotTime(java.lang.String snapshotTime) {
            this.snapshotTime = snapshotTime;
            return this;
        }

        /**
         * Sets the value of {@link LightsailInstanceAddOn#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance#status LightsailInstance#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link LightsailInstanceAddOn#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_instance#type LightsailInstance#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailInstanceAddOn}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailInstanceAddOn build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailInstanceAddOn}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailInstanceAddOn {
        private final java.lang.String snapshotTime;
        private final java.lang.String status;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.snapshotTime = software.amazon.jsii.Kernel.get(this, "snapshotTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.snapshotTime = java.util.Objects.requireNonNull(builder.snapshotTime, "snapshotTime is required");
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.String getSnapshotTime() {
            return this.snapshotTime;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("snapshotTime", om.valueToTree(this.getSnapshotTime()));
            data.set("status", om.valueToTree(this.getStatus()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailInstance.LightsailInstanceAddOn"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailInstanceAddOn.Jsii$Proxy that = (LightsailInstanceAddOn.Jsii$Proxy) o;

            if (!snapshotTime.equals(that.snapshotTime)) return false;
            if (!status.equals(that.status)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.snapshotTime.hashCode();
            result = 31 * result + (this.status.hashCode());
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
