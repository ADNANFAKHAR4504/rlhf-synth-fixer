package imports.aws.redshiftserverless_workgroup;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.177Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftserverlessWorkgroup.RedshiftserverlessWorkgroupPricePerformanceTarget")
@software.amazon.jsii.Jsii.Proxy(RedshiftserverlessWorkgroupPricePerformanceTarget.Jsii$Proxy.class)
public interface RedshiftserverlessWorkgroupPricePerformanceTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#enabled RedshiftserverlessWorkgroup#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#level RedshiftserverlessWorkgroup#level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getLevel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link RedshiftserverlessWorkgroupPricePerformanceTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RedshiftserverlessWorkgroupPricePerformanceTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RedshiftserverlessWorkgroupPricePerformanceTarget> {
        java.lang.Object enabled;
        java.lang.Number level;

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupPricePerformanceTarget#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#enabled RedshiftserverlessWorkgroup#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupPricePerformanceTarget#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#enabled RedshiftserverlessWorkgroup#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link RedshiftserverlessWorkgroupPricePerformanceTarget#getLevel}
         * @param level Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/redshiftserverless_workgroup#level RedshiftserverlessWorkgroup#level}.
         * @return {@code this}
         */
        public Builder level(java.lang.Number level) {
            this.level = level;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RedshiftserverlessWorkgroupPricePerformanceTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RedshiftserverlessWorkgroupPricePerformanceTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RedshiftserverlessWorkgroupPricePerformanceTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RedshiftserverlessWorkgroupPricePerformanceTarget {
        private final java.lang.Object enabled;
        private final java.lang.Number level;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.level = software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.level = builder.level;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Number getLevel() {
            return this.level;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getLevel() != null) {
                data.set("level", om.valueToTree(this.getLevel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.redshiftserverlessWorkgroup.RedshiftserverlessWorkgroupPricePerformanceTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RedshiftserverlessWorkgroupPricePerformanceTarget.Jsii$Proxy that = (RedshiftserverlessWorkgroupPricePerformanceTarget.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            return this.level != null ? this.level.equals(that.level) : that.level == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.level != null ? this.level.hashCode() : 0);
            return result;
        }
    }
}
