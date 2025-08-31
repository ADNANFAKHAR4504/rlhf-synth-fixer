package imports.aws.ec2_network_insights_path;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.100Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2NetworkInsightsPathConfig.Jsii$Proxy.class)
public interface Ec2NetworkInsightsPathConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#protocol Ec2NetworkInsightsPath#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source Ec2NetworkInsightsPath#source}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSource();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination Ec2NetworkInsightsPath#destination}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestination() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_ip Ec2NetworkInsightsPath#destination_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDestinationIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port Ec2NetworkInsightsPath#destination_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDestinationPort() {
        return null;
    }

    /**
     * filter_at_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_destination Ec2NetworkInsightsPath#filter_at_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestination getFilterAtDestination() {
        return null;
    }

    /**
     * filter_at_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_source Ec2NetworkInsightsPath#filter_at_source}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource getFilterAtSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#id Ec2NetworkInsightsPath#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_ip Ec2NetworkInsightsPath#source_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags Ec2NetworkInsightsPath#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags_all Ec2NetworkInsightsPath#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2NetworkInsightsPathConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2NetworkInsightsPathConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2NetworkInsightsPathConfig> {
        java.lang.String protocol;
        java.lang.String source;
        java.lang.String destination;
        java.lang.String destinationIp;
        java.lang.Number destinationPort;
        imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestination filterAtDestination;
        imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource filterAtSource;
        java.lang.String id;
        java.lang.String sourceIp;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#protocol Ec2NetworkInsightsPath#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getSource}
         * @param source Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source Ec2NetworkInsightsPath#source}. This parameter is required.
         * @return {@code this}
         */
        public Builder source(java.lang.String source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getDestination}
         * @param destination Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination Ec2NetworkInsightsPath#destination}.
         * @return {@code this}
         */
        public Builder destination(java.lang.String destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getDestinationIp}
         * @param destinationIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_ip Ec2NetworkInsightsPath#destination_ip}.
         * @return {@code this}
         */
        public Builder destinationIp(java.lang.String destinationIp) {
            this.destinationIp = destinationIp;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getDestinationPort}
         * @param destinationPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#destination_port Ec2NetworkInsightsPath#destination_port}.
         * @return {@code this}
         */
        public Builder destinationPort(java.lang.Number destinationPort) {
            this.destinationPort = destinationPort;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getFilterAtDestination}
         * @param filterAtDestination filter_at_destination block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_destination Ec2NetworkInsightsPath#filter_at_destination}
         * @return {@code this}
         */
        public Builder filterAtDestination(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestination filterAtDestination) {
            this.filterAtDestination = filterAtDestination;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getFilterAtSource}
         * @param filterAtSource filter_at_source block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#filter_at_source Ec2NetworkInsightsPath#filter_at_source}
         * @return {@code this}
         */
        public Builder filterAtSource(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource filterAtSource) {
            this.filterAtSource = filterAtSource;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#id Ec2NetworkInsightsPath#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getSourceIp}
         * @param sourceIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#source_ip Ec2NetworkInsightsPath#source_ip}.
         * @return {@code this}
         */
        public Builder sourceIp(java.lang.String sourceIp) {
            this.sourceIp = sourceIp;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags Ec2NetworkInsightsPath#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_network_insights_path#tags_all Ec2NetworkInsightsPath#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2NetworkInsightsPathConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Ec2NetworkInsightsPathConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2NetworkInsightsPathConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2NetworkInsightsPathConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2NetworkInsightsPathConfig {
        private final java.lang.String protocol;
        private final java.lang.String source;
        private final java.lang.String destination;
        private final java.lang.String destinationIp;
        private final java.lang.Number destinationPort;
        private final imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestination filterAtDestination;
        private final imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource filterAtSource;
        private final java.lang.String id;
        private final java.lang.String sourceIp;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationIp = software.amazon.jsii.Kernel.get(this, "destinationIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinationPort = software.amazon.jsii.Kernel.get(this, "destinationPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.filterAtDestination = software.amazon.jsii.Kernel.get(this, "filterAtDestination", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestination.class));
            this.filterAtSource = software.amazon.jsii.Kernel.get(this, "filterAtSource", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceIp = software.amazon.jsii.Kernel.get(this, "sourceIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.source = java.util.Objects.requireNonNull(builder.source, "source is required");
            this.destination = builder.destination;
            this.destinationIp = builder.destinationIp;
            this.destinationPort = builder.destinationPort;
            this.filterAtDestination = builder.filterAtDestination;
            this.filterAtSource = builder.filterAtSource;
            this.id = builder.id;
            this.sourceIp = builder.sourceIp;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getSource() {
            return this.source;
        }

        @Override
        public final java.lang.String getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.String getDestinationIp() {
            return this.destinationIp;
        }

        @Override
        public final java.lang.Number getDestinationPort() {
            return this.destinationPort;
        }

        @Override
        public final imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtDestination getFilterAtDestination() {
            return this.filterAtDestination;
        }

        @Override
        public final imports.aws.ec2_network_insights_path.Ec2NetworkInsightsPathFilterAtSource getFilterAtSource() {
            return this.filterAtSource;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getSourceIp() {
            return this.sourceIp;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("source", om.valueToTree(this.getSource()));
            if (this.getDestination() != null) {
                data.set("destination", om.valueToTree(this.getDestination()));
            }
            if (this.getDestinationIp() != null) {
                data.set("destinationIp", om.valueToTree(this.getDestinationIp()));
            }
            if (this.getDestinationPort() != null) {
                data.set("destinationPort", om.valueToTree(this.getDestinationPort()));
            }
            if (this.getFilterAtDestination() != null) {
                data.set("filterAtDestination", om.valueToTree(this.getFilterAtDestination()));
            }
            if (this.getFilterAtSource() != null) {
                data.set("filterAtSource", om.valueToTree(this.getFilterAtSource()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getSourceIp() != null) {
                data.set("sourceIp", om.valueToTree(this.getSourceIp()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ec2NetworkInsightsPath.Ec2NetworkInsightsPathConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2NetworkInsightsPathConfig.Jsii$Proxy that = (Ec2NetworkInsightsPathConfig.Jsii$Proxy) o;

            if (!protocol.equals(that.protocol)) return false;
            if (!source.equals(that.source)) return false;
            if (this.destination != null ? !this.destination.equals(that.destination) : that.destination != null) return false;
            if (this.destinationIp != null ? !this.destinationIp.equals(that.destinationIp) : that.destinationIp != null) return false;
            if (this.destinationPort != null ? !this.destinationPort.equals(that.destinationPort) : that.destinationPort != null) return false;
            if (this.filterAtDestination != null ? !this.filterAtDestination.equals(that.filterAtDestination) : that.filterAtDestination != null) return false;
            if (this.filterAtSource != null ? !this.filterAtSource.equals(that.filterAtSource) : that.filterAtSource != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.sourceIp != null ? !this.sourceIp.equals(that.sourceIp) : that.sourceIp != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.protocol.hashCode();
            result = 31 * result + (this.source.hashCode());
            result = 31 * result + (this.destination != null ? this.destination.hashCode() : 0);
            result = 31 * result + (this.destinationIp != null ? this.destinationIp.hashCode() : 0);
            result = 31 * result + (this.destinationPort != null ? this.destinationPort.hashCode() : 0);
            result = 31 * result + (this.filterAtDestination != null ? this.filterAtDestination.hashCode() : 0);
            result = 31 * result + (this.filterAtSource != null ? this.filterAtSource.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.sourceIp != null ? this.sourceIp.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
