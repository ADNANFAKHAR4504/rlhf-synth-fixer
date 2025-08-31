package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.678Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleChallengeConfig")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclRuleChallengeConfig.Jsii$Proxy.class)
public interface Wafv2WebAclRuleChallengeConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * immunity_time_property block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty getImmunityTimeProperty() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclRuleChallengeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclRuleChallengeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclRuleChallengeConfig> {
        imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty immunityTimeProperty;

        /**
         * Sets the value of {@link Wafv2WebAclRuleChallengeConfig#getImmunityTimeProperty}
         * @param immunityTimeProperty immunity_time_property block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time_property Wafv2WebAcl#immunity_time_property}
         * @return {@code this}
         */
        public Builder immunityTimeProperty(imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty immunityTimeProperty) {
            this.immunityTimeProperty = immunityTimeProperty;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclRuleChallengeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclRuleChallengeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclRuleChallengeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclRuleChallengeConfig {
        private final imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty immunityTimeProperty;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.immunityTimeProperty = software.amazon.jsii.Kernel.get(this, "immunityTimeProperty", software.amazon.jsii.NativeType.forClass(imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.immunityTimeProperty = builder.immunityTimeProperty;
        }

        @Override
        public final imports.aws.wafv2_web_acl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty getImmunityTimeProperty() {
            return this.immunityTimeProperty;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getImmunityTimeProperty() != null) {
                data.set("immunityTimeProperty", om.valueToTree(this.getImmunityTimeProperty()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclRuleChallengeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclRuleChallengeConfig.Jsii$Proxy that = (Wafv2WebAclRuleChallengeConfig.Jsii$Proxy) o;

            return this.immunityTimeProperty != null ? this.immunityTimeProperty.equals(that.immunityTimeProperty) : that.immunityTimeProperty == null;
        }

        @Override
        public final int hashCode() {
            int result = this.immunityTimeProperty != null ? this.immunityTimeProperty.hashCode() : 0;
            return result;
        }
    }
}
