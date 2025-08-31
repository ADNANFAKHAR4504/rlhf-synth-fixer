package imports.aws.wafv2_web_acl;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.678Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafv2WebAcl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty")
@software.amazon.jsii.Jsii.Proxy(Wafv2WebAclRuleChallengeConfigImmunityTimeProperty.Jsii$Proxy.class)
public interface Wafv2WebAclRuleChallengeConfigImmunityTimeProperty extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getImmunityTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Wafv2WebAclRuleChallengeConfigImmunityTimeProperty}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Wafv2WebAclRuleChallengeConfigImmunityTimeProperty}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Wafv2WebAclRuleChallengeConfigImmunityTimeProperty> {
        java.lang.Number immunityTime;

        /**
         * Sets the value of {@link Wafv2WebAclRuleChallengeConfigImmunityTimeProperty#getImmunityTime}
         * @param immunityTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafv2_web_acl#immunity_time Wafv2WebAcl#immunity_time}.
         * @return {@code this}
         */
        public Builder immunityTime(java.lang.Number immunityTime) {
            this.immunityTime = immunityTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Wafv2WebAclRuleChallengeConfigImmunityTimeProperty}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Wafv2WebAclRuleChallengeConfigImmunityTimeProperty build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Wafv2WebAclRuleChallengeConfigImmunityTimeProperty}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Wafv2WebAclRuleChallengeConfigImmunityTimeProperty {
        private final java.lang.Number immunityTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.immunityTime = software.amazon.jsii.Kernel.get(this, "immunityTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.immunityTime = builder.immunityTime;
        }

        @Override
        public final java.lang.Number getImmunityTime() {
            return this.immunityTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getImmunityTime() != null) {
                data.set("immunityTime", om.valueToTree(this.getImmunityTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafv2WebAcl.Wafv2WebAclRuleChallengeConfigImmunityTimeProperty"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Wafv2WebAclRuleChallengeConfigImmunityTimeProperty.Jsii$Proxy that = (Wafv2WebAclRuleChallengeConfigImmunityTimeProperty.Jsii$Proxy) o;

            return this.immunityTime != null ? this.immunityTime.equals(that.immunityTime) : that.immunityTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.immunityTime != null ? this.immunityTime.hashCode() : 0;
            return result;
        }
    }
}
