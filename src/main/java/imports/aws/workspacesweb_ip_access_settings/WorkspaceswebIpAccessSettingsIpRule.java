package imports.aws.workspacesweb_ip_access_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.690Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspaceswebIpAccessSettings.WorkspaceswebIpAccessSettingsIpRule")
@software.amazon.jsii.Jsii.Proxy(WorkspaceswebIpAccessSettingsIpRule.Jsii$Proxy.class)
public interface WorkspaceswebIpAccessSettingsIpRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_ip_access_settings#ip_range WorkspaceswebIpAccessSettings#ip_range}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIpRange();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_ip_access_settings#description WorkspaceswebIpAccessSettings#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspaceswebIpAccessSettingsIpRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspaceswebIpAccessSettingsIpRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspaceswebIpAccessSettingsIpRule> {
        java.lang.String ipRange;
        java.lang.String description;

        /**
         * Sets the value of {@link WorkspaceswebIpAccessSettingsIpRule#getIpRange}
         * @param ipRange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_ip_access_settings#ip_range WorkspaceswebIpAccessSettings#ip_range}. This parameter is required.
         * @return {@code this}
         */
        public Builder ipRange(java.lang.String ipRange) {
            this.ipRange = ipRange;
            return this;
        }

        /**
         * Sets the value of {@link WorkspaceswebIpAccessSettingsIpRule#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspacesweb_ip_access_settings#description WorkspaceswebIpAccessSettings#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspaceswebIpAccessSettingsIpRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspaceswebIpAccessSettingsIpRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspaceswebIpAccessSettingsIpRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspaceswebIpAccessSettingsIpRule {
        private final java.lang.String ipRange;
        private final java.lang.String description;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ipRange = software.amazon.jsii.Kernel.get(this, "ipRange", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ipRange = java.util.Objects.requireNonNull(builder.ipRange, "ipRange is required");
            this.description = builder.description;
        }

        @Override
        public final java.lang.String getIpRange() {
            return this.ipRange;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ipRange", om.valueToTree(this.getIpRange()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspaceswebIpAccessSettings.WorkspaceswebIpAccessSettingsIpRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspaceswebIpAccessSettingsIpRule.Jsii$Proxy that = (WorkspaceswebIpAccessSettingsIpRule.Jsii$Proxy) o;

            if (!ipRange.equals(that.ipRange)) return false;
            return this.description != null ? this.description.equals(that.description) : that.description == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ipRange.hashCode();
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            return result;
        }
    }
}
