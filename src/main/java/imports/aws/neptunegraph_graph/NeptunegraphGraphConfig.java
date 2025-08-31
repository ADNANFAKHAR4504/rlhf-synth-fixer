package imports.aws.neptunegraph_graph;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.939Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.neptunegraphGraph.NeptunegraphGraphConfig")
@software.amazon.jsii.Jsii.Proxy(NeptunegraphGraphConfig.Jsii$Proxy.class)
public interface NeptunegraphGraphConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * The provisioned memory-optimized Neptune Capacity Units (m-NCUs) to use for the graph.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#provisioned_memory NeptunegraphGraph#provisioned_memory}
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getProvisionedMemory();

    /**
     * A value that indicates whether the graph has deletion protection enabled.
     * <p>
     * The graph can't be deleted when deletion protection is enabled.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#deletion_protection NeptunegraphGraph#deletion_protection}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtection() {
        return null;
    }

    /**
     * The graph name.
     * <p>
     * For example: my-graph-1.
     * The name must contain from 1 to 63 letters, numbers, or hyphens,
     * and its first character must be a letter. It cannot end with a hyphen or contain two consecutive hyphens.
     * If you don't specify a graph name, a unique graph name is generated for you using the prefix graph-for,
     * followed by a combination of Stack Name and a UUID.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#graph_name NeptunegraphGraph#graph_name}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGraphName() {
        return null;
    }

    /**
     * Allows user to specify name prefix and have remainder of name automatically generated.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#graph_name_prefix NeptunegraphGraph#graph_name_prefix}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGraphNamePrefix() {
        return null;
    }

    /**
     * Specifies a KMS key to use to encrypt data in the new graph.
     * <p>
     * Value must be ARN of KMS Key.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#kms_key_identifier NeptunegraphGraph#kms_key_identifier}
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdentifier() {
        return null;
    }

    /**
     * Specifies whether or not the graph can be reachable over the internet.
     * <p>
     * All access to graphs is IAM authenticated.
     * When the graph is publicly available, its domain name system (DNS) endpoint resolves to
     * the public IP address from the internet. When the graph isn't publicly available, you need
     * to create a PrivateGraphEndpoint in a given VPC to ensure the DNS name resolves to a private
     * IP address that is reachable from the VPC.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#public_connectivity NeptunegraphGraph#public_connectivity}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPublicConnectivity() {
        return null;
    }

    /**
     * The number of replicas in other AZs.  Value must be between 0 and 2.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#replica_count NeptunegraphGraph#replica_count}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getReplicaCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#tags NeptunegraphGraph#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#timeouts NeptunegraphGraph#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.neptunegraph_graph.NeptunegraphGraphTimeouts getTimeouts() {
        return null;
    }

    /**
     * vector_search_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#vector_search_configuration NeptunegraphGraph#vector_search_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVectorSearchConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NeptunegraphGraphConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NeptunegraphGraphConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NeptunegraphGraphConfig> {
        java.lang.Number provisionedMemory;
        java.lang.Object deletionProtection;
        java.lang.String graphName;
        java.lang.String graphNamePrefix;
        java.lang.String kmsKeyIdentifier;
        java.lang.Object publicConnectivity;
        java.lang.Number replicaCount;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.neptunegraph_graph.NeptunegraphGraphTimeouts timeouts;
        java.lang.Object vectorSearchConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getProvisionedMemory}
         * @param provisionedMemory The provisioned memory-optimized Neptune Capacity Units (m-NCUs) to use for the graph. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#provisioned_memory NeptunegraphGraph#provisioned_memory}
         * @return {@code this}
         */
        public Builder provisionedMemory(java.lang.Number provisionedMemory) {
            this.provisionedMemory = provisionedMemory;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getDeletionProtection}
         * @param deletionProtection A value that indicates whether the graph has deletion protection enabled.
         *                           The graph can't be deleted when deletion protection is enabled.
         *                           
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#deletion_protection NeptunegraphGraph#deletion_protection}
         * @return {@code this}
         */
        public Builder deletionProtection(java.lang.Boolean deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getDeletionProtection}
         * @param deletionProtection A value that indicates whether the graph has deletion protection enabled.
         *                           The graph can't be deleted when deletion protection is enabled.
         *                           
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#deletion_protection NeptunegraphGraph#deletion_protection}
         * @return {@code this}
         */
        public Builder deletionProtection(com.hashicorp.cdktf.IResolvable deletionProtection) {
            this.deletionProtection = deletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getGraphName}
         * @param graphName The graph name.
         *                  For example: my-graph-1.
         *                  The name must contain from 1 to 63 letters, numbers, or hyphens,
         *                  and its first character must be a letter. It cannot end with a hyphen or contain two consecutive hyphens.
         *                  If you don't specify a graph name, a unique graph name is generated for you using the prefix graph-for,
         *                  followed by a combination of Stack Name and a UUID.
         *                  
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#graph_name NeptunegraphGraph#graph_name}
         * @return {@code this}
         */
        public Builder graphName(java.lang.String graphName) {
            this.graphName = graphName;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getGraphNamePrefix}
         * @param graphNamePrefix Allows user to specify name prefix and have remainder of name automatically generated.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#graph_name_prefix NeptunegraphGraph#graph_name_prefix}
         * @return {@code this}
         */
        public Builder graphNamePrefix(java.lang.String graphNamePrefix) {
            this.graphNamePrefix = graphNamePrefix;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getKmsKeyIdentifier}
         * @param kmsKeyIdentifier Specifies a KMS key to use to encrypt data in the new graph.
         *                         Value must be ARN of KMS Key.
         *                         
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#kms_key_identifier NeptunegraphGraph#kms_key_identifier}
         * @return {@code this}
         */
        public Builder kmsKeyIdentifier(java.lang.String kmsKeyIdentifier) {
            this.kmsKeyIdentifier = kmsKeyIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getPublicConnectivity}
         * @param publicConnectivity Specifies whether or not the graph can be reachable over the internet.
         *                           All access to graphs is IAM authenticated.
         *                           When the graph is publicly available, its domain name system (DNS) endpoint resolves to
         *                           the public IP address from the internet. When the graph isn't publicly available, you need
         *                           to create a PrivateGraphEndpoint in a given VPC to ensure the DNS name resolves to a private
         *                           IP address that is reachable from the VPC.
         *                           
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#public_connectivity NeptunegraphGraph#public_connectivity}
         * @return {@code this}
         */
        public Builder publicConnectivity(java.lang.Boolean publicConnectivity) {
            this.publicConnectivity = publicConnectivity;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getPublicConnectivity}
         * @param publicConnectivity Specifies whether or not the graph can be reachable over the internet.
         *                           All access to graphs is IAM authenticated.
         *                           When the graph is publicly available, its domain name system (DNS) endpoint resolves to
         *                           the public IP address from the internet. When the graph isn't publicly available, you need
         *                           to create a PrivateGraphEndpoint in a given VPC to ensure the DNS name resolves to a private
         *                           IP address that is reachable from the VPC.
         *                           
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#public_connectivity NeptunegraphGraph#public_connectivity}
         * @return {@code this}
         */
        public Builder publicConnectivity(com.hashicorp.cdktf.IResolvable publicConnectivity) {
            this.publicConnectivity = publicConnectivity;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getReplicaCount}
         * @param replicaCount The number of replicas in other AZs.  Value must be between 0 and 2.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#replica_count NeptunegraphGraph#replica_count}
         * @return {@code this}
         */
        public Builder replicaCount(java.lang.Number replicaCount) {
            this.replicaCount = replicaCount;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#tags NeptunegraphGraph#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#timeouts NeptunegraphGraph#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.neptunegraph_graph.NeptunegraphGraphTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getVectorSearchConfiguration}
         * @param vectorSearchConfiguration vector_search_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#vector_search_configuration NeptunegraphGraph#vector_search_configuration}
         * @return {@code this}
         */
        public Builder vectorSearchConfiguration(com.hashicorp.cdktf.IResolvable vectorSearchConfiguration) {
            this.vectorSearchConfiguration = vectorSearchConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getVectorSearchConfiguration}
         * @param vectorSearchConfiguration vector_search_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/neptunegraph_graph#vector_search_configuration NeptunegraphGraph#vector_search_configuration}
         * @return {@code this}
         */
        public Builder vectorSearchConfiguration(java.util.List<? extends imports.aws.neptunegraph_graph.NeptunegraphGraphVectorSearchConfiguration> vectorSearchConfiguration) {
            this.vectorSearchConfiguration = vectorSearchConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getDependsOn}
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
         * Sets the value of {@link NeptunegraphGraphConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NeptunegraphGraphConfig#getProvisioners}
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
         * @return a new instance of {@link NeptunegraphGraphConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NeptunegraphGraphConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NeptunegraphGraphConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NeptunegraphGraphConfig {
        private final java.lang.Number provisionedMemory;
        private final java.lang.Object deletionProtection;
        private final java.lang.String graphName;
        private final java.lang.String graphNamePrefix;
        private final java.lang.String kmsKeyIdentifier;
        private final java.lang.Object publicConnectivity;
        private final java.lang.Number replicaCount;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.neptunegraph_graph.NeptunegraphGraphTimeouts timeouts;
        private final java.lang.Object vectorSearchConfiguration;
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
            this.provisionedMemory = software.amazon.jsii.Kernel.get(this, "provisionedMemory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.deletionProtection = software.amazon.jsii.Kernel.get(this, "deletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.graphName = software.amazon.jsii.Kernel.get(this, "graphName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.graphNamePrefix = software.amazon.jsii.Kernel.get(this, "graphNamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyIdentifier = software.amazon.jsii.Kernel.get(this, "kmsKeyIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publicConnectivity = software.amazon.jsii.Kernel.get(this, "publicConnectivity", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.replicaCount = software.amazon.jsii.Kernel.get(this, "replicaCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.neptunegraph_graph.NeptunegraphGraphTimeouts.class));
            this.vectorSearchConfiguration = software.amazon.jsii.Kernel.get(this, "vectorSearchConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.provisionedMemory = java.util.Objects.requireNonNull(builder.provisionedMemory, "provisionedMemory is required");
            this.deletionProtection = builder.deletionProtection;
            this.graphName = builder.graphName;
            this.graphNamePrefix = builder.graphNamePrefix;
            this.kmsKeyIdentifier = builder.kmsKeyIdentifier;
            this.publicConnectivity = builder.publicConnectivity;
            this.replicaCount = builder.replicaCount;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.vectorSearchConfiguration = builder.vectorSearchConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getProvisionedMemory() {
            return this.provisionedMemory;
        }

        @Override
        public final java.lang.Object getDeletionProtection() {
            return this.deletionProtection;
        }

        @Override
        public final java.lang.String getGraphName() {
            return this.graphName;
        }

        @Override
        public final java.lang.String getGraphNamePrefix() {
            return this.graphNamePrefix;
        }

        @Override
        public final java.lang.String getKmsKeyIdentifier() {
            return this.kmsKeyIdentifier;
        }

        @Override
        public final java.lang.Object getPublicConnectivity() {
            return this.publicConnectivity;
        }

        @Override
        public final java.lang.Number getReplicaCount() {
            return this.replicaCount;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.neptunegraph_graph.NeptunegraphGraphTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getVectorSearchConfiguration() {
            return this.vectorSearchConfiguration;
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

            data.set("provisionedMemory", om.valueToTree(this.getProvisionedMemory()));
            if (this.getDeletionProtection() != null) {
                data.set("deletionProtection", om.valueToTree(this.getDeletionProtection()));
            }
            if (this.getGraphName() != null) {
                data.set("graphName", om.valueToTree(this.getGraphName()));
            }
            if (this.getGraphNamePrefix() != null) {
                data.set("graphNamePrefix", om.valueToTree(this.getGraphNamePrefix()));
            }
            if (this.getKmsKeyIdentifier() != null) {
                data.set("kmsKeyIdentifier", om.valueToTree(this.getKmsKeyIdentifier()));
            }
            if (this.getPublicConnectivity() != null) {
                data.set("publicConnectivity", om.valueToTree(this.getPublicConnectivity()));
            }
            if (this.getReplicaCount() != null) {
                data.set("replicaCount", om.valueToTree(this.getReplicaCount()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVectorSearchConfiguration() != null) {
                data.set("vectorSearchConfiguration", om.valueToTree(this.getVectorSearchConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.neptunegraphGraph.NeptunegraphGraphConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NeptunegraphGraphConfig.Jsii$Proxy that = (NeptunegraphGraphConfig.Jsii$Proxy) o;

            if (!provisionedMemory.equals(that.provisionedMemory)) return false;
            if (this.deletionProtection != null ? !this.deletionProtection.equals(that.deletionProtection) : that.deletionProtection != null) return false;
            if (this.graphName != null ? !this.graphName.equals(that.graphName) : that.graphName != null) return false;
            if (this.graphNamePrefix != null ? !this.graphNamePrefix.equals(that.graphNamePrefix) : that.graphNamePrefix != null) return false;
            if (this.kmsKeyIdentifier != null ? !this.kmsKeyIdentifier.equals(that.kmsKeyIdentifier) : that.kmsKeyIdentifier != null) return false;
            if (this.publicConnectivity != null ? !this.publicConnectivity.equals(that.publicConnectivity) : that.publicConnectivity != null) return false;
            if (this.replicaCount != null ? !this.replicaCount.equals(that.replicaCount) : that.replicaCount != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vectorSearchConfiguration != null ? !this.vectorSearchConfiguration.equals(that.vectorSearchConfiguration) : that.vectorSearchConfiguration != null) return false;
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
            int result = this.provisionedMemory.hashCode();
            result = 31 * result + (this.deletionProtection != null ? this.deletionProtection.hashCode() : 0);
            result = 31 * result + (this.graphName != null ? this.graphName.hashCode() : 0);
            result = 31 * result + (this.graphNamePrefix != null ? this.graphNamePrefix.hashCode() : 0);
            result = 31 * result + (this.kmsKeyIdentifier != null ? this.kmsKeyIdentifier.hashCode() : 0);
            result = 31 * result + (this.publicConnectivity != null ? this.publicConnectivity.hashCode() : 0);
            result = 31 * result + (this.replicaCount != null ? this.replicaCount.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vectorSearchConfiguration != null ? this.vectorSearchConfiguration.hashCode() : 0);
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
