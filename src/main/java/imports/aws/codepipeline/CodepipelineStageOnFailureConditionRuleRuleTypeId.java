package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId")
@software.amazon.jsii.Jsii.Proxy(CodepipelineStageOnFailureConditionRuleRuleTypeId.Jsii$Proxy.class)
public interface CodepipelineStageOnFailureConditionRuleRuleTypeId extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCategory();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProvider();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineStageOnFailureConditionRuleRuleTypeId}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineStageOnFailureConditionRuleRuleTypeId}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineStageOnFailureConditionRuleRuleTypeId> {
        java.lang.String category;
        java.lang.String provider;
        java.lang.String owner;
        java.lang.String version;

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRuleRuleTypeId#getCategory}
         * @param category Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#category Codepipeline#category}. This parameter is required.
         * @return {@code this}
         */
        public Builder category(java.lang.String category) {
            this.category = category;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRuleRuleTypeId#getProvider}
         * @param provider Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#provider Codepipeline#provider}. This parameter is required.
         * @return {@code this}
         */
        public Builder provider(java.lang.String provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRuleRuleTypeId#getOwner}
         * @param owner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#owner Codepipeline#owner}.
         * @return {@code this}
         */
        public Builder owner(java.lang.String owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineStageOnFailureConditionRuleRuleTypeId#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#version Codepipeline#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineStageOnFailureConditionRuleRuleTypeId}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineStageOnFailureConditionRuleRuleTypeId build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineStageOnFailureConditionRuleRuleTypeId}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineStageOnFailureConditionRuleRuleTypeId {
        private final java.lang.String category;
        private final java.lang.String provider;
        private final java.lang.String owner;
        private final java.lang.String version;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.category = software.amazon.jsii.Kernel.get(this, "category", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.owner = software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.category = java.util.Objects.requireNonNull(builder.category, "category is required");
            this.provider = java.util.Objects.requireNonNull(builder.provider, "provider is required");
            this.owner = builder.owner;
            this.version = builder.version;
        }

        @Override
        public final java.lang.String getCategory() {
            return this.category;
        }

        @Override
        public final java.lang.String getProvider() {
            return this.provider;
        }

        @Override
        public final java.lang.String getOwner() {
            return this.owner;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("category", om.valueToTree(this.getCategory()));
            data.set("provider", om.valueToTree(this.getProvider()));
            if (this.getOwner() != null) {
                data.set("owner", om.valueToTree(this.getOwner()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineStageOnFailureConditionRuleRuleTypeId"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineStageOnFailureConditionRuleRuleTypeId.Jsii$Proxy that = (CodepipelineStageOnFailureConditionRuleRuleTypeId.Jsii$Proxy) o;

            if (!category.equals(that.category)) return false;
            if (!provider.equals(that.provider)) return false;
            if (this.owner != null ? !this.owner.equals(that.owner) : that.owner != null) return false;
            return this.version != null ? this.version.equals(that.version) : that.version == null;
        }

        @Override
        public final int hashCode() {
            int result = this.category.hashCode();
            result = 31 * result + (this.provider.hashCode());
            result = 31 * result + (this.owner != null ? this.owner.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
            return result;
        }
    }
}
