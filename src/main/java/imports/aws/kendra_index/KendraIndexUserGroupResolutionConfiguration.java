package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.435Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexUserGroupResolutionConfiguration")
@software.amazon.jsii.Jsii.Proxy(KendraIndexUserGroupResolutionConfiguration.Jsii$Proxy.class)
public interface KendraIndexUserGroupResolutionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_group_resolution_mode KendraIndex#user_group_resolution_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserGroupResolutionMode();

    /**
     * @return a {@link Builder} of {@link KendraIndexUserGroupResolutionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraIndexUserGroupResolutionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraIndexUserGroupResolutionConfiguration> {
        java.lang.String userGroupResolutionMode;

        /**
         * Sets the value of {@link KendraIndexUserGroupResolutionConfiguration#getUserGroupResolutionMode}
         * @param userGroupResolutionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#user_group_resolution_mode KendraIndex#user_group_resolution_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder userGroupResolutionMode(java.lang.String userGroupResolutionMode) {
            this.userGroupResolutionMode = userGroupResolutionMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraIndexUserGroupResolutionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraIndexUserGroupResolutionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraIndexUserGroupResolutionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraIndexUserGroupResolutionConfiguration {
        private final java.lang.String userGroupResolutionMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.userGroupResolutionMode = software.amazon.jsii.Kernel.get(this, "userGroupResolutionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.userGroupResolutionMode = java.util.Objects.requireNonNull(builder.userGroupResolutionMode, "userGroupResolutionMode is required");
        }

        @Override
        public final java.lang.String getUserGroupResolutionMode() {
            return this.userGroupResolutionMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("userGroupResolutionMode", om.valueToTree(this.getUserGroupResolutionMode()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraIndex.KendraIndexUserGroupResolutionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraIndexUserGroupResolutionConfiguration.Jsii$Proxy that = (KendraIndexUserGroupResolutionConfiguration.Jsii$Proxy) o;

            return this.userGroupResolutionMode.equals(that.userGroupResolutionMode);
        }

        @Override
        public final int hashCode() {
            int result = this.userGroupResolutionMode.hashCode();
            return result;
        }
    }
}
