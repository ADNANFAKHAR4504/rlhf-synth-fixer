package imports.aws.computeoptimizer_recommendation_preferences;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesPreferredResource")
@software.amazon.jsii.Jsii.Proxy(ComputeoptimizerRecommendationPreferencesPreferredResource.Jsii$Proxy.class)
public interface ComputeoptimizerRecommendationPreferencesPreferredResource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#name ComputeoptimizerRecommendationPreferences#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#exclude_list ComputeoptimizerRecommendationPreferences#exclude_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExcludeList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#include_list ComputeoptimizerRecommendationPreferences#include_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIncludeList() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ComputeoptimizerRecommendationPreferencesPreferredResource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ComputeoptimizerRecommendationPreferencesPreferredResource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ComputeoptimizerRecommendationPreferencesPreferredResource> {
        java.lang.String name;
        java.util.List<java.lang.String> excludeList;
        java.util.List<java.lang.String> includeList;

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesPreferredResource#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#name ComputeoptimizerRecommendationPreferences#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesPreferredResource#getExcludeList}
         * @param excludeList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#exclude_list ComputeoptimizerRecommendationPreferences#exclude_list}.
         * @return {@code this}
         */
        public Builder excludeList(java.util.List<java.lang.String> excludeList) {
            this.excludeList = excludeList;
            return this;
        }

        /**
         * Sets the value of {@link ComputeoptimizerRecommendationPreferencesPreferredResource#getIncludeList}
         * @param includeList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/computeoptimizer_recommendation_preferences#include_list ComputeoptimizerRecommendationPreferences#include_list}.
         * @return {@code this}
         */
        public Builder includeList(java.util.List<java.lang.String> includeList) {
            this.includeList = includeList;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ComputeoptimizerRecommendationPreferencesPreferredResource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ComputeoptimizerRecommendationPreferencesPreferredResource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ComputeoptimizerRecommendationPreferencesPreferredResource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ComputeoptimizerRecommendationPreferencesPreferredResource {
        private final java.lang.String name;
        private final java.util.List<java.lang.String> excludeList;
        private final java.util.List<java.lang.String> includeList;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.excludeList = software.amazon.jsii.Kernel.get(this, "excludeList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.includeList = software.amazon.jsii.Kernel.get(this, "includeList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.excludeList = builder.excludeList;
            this.includeList = builder.includeList;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.util.List<java.lang.String> getExcludeList() {
            return this.excludeList;
        }

        @Override
        public final java.util.List<java.lang.String> getIncludeList() {
            return this.includeList;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getExcludeList() != null) {
                data.set("excludeList", om.valueToTree(this.getExcludeList()));
            }
            if (this.getIncludeList() != null) {
                data.set("includeList", om.valueToTree(this.getIncludeList()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.computeoptimizerRecommendationPreferences.ComputeoptimizerRecommendationPreferencesPreferredResource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ComputeoptimizerRecommendationPreferencesPreferredResource.Jsii$Proxy that = (ComputeoptimizerRecommendationPreferencesPreferredResource.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.excludeList != null ? !this.excludeList.equals(that.excludeList) : that.excludeList != null) return false;
            return this.includeList != null ? this.includeList.equals(that.includeList) : that.includeList == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.excludeList != null ? this.excludeList.hashCode() : 0);
            result = 31 * result + (this.includeList != null ? this.includeList.hashCode() : 0);
            return result;
        }
    }
}
