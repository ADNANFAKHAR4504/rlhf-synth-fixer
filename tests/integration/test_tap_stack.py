def test_integration():
  """
  Deploys the stack, verifies target health, checks the endpoint, and destroys.
  """
  try:
    print(f"--- Selecting Pulumi Stack: {STACK_NAME} ---")
    run_command(f"pulumi stack select {STACK_NAME} --create")

    print("--- Deploying Infrastructure ---")
    run_command("pulumi up --yes --skip-preview")

    print("--- Fetching Stack Outputs ---")
    alb_dns_json = run_command("pulumi stack output alb_dns_name --json")
    alb_dns = json.loads(alb_dns_json)
    url = f"http://{alb_dns}"
    
    tg_arn_json = run_command("pulumi stack output target_group_arn --json")
    tg_arn = json.loads(tg_arn_json)
    
    print("--- Verifying Target Group Health ---")
    
    # Add an initial delay to allow the ALB to initialize
    print("Waiting 60 seconds for ALB to warm up...")
    time.sleep(60)
    
    max_health_retries = 10
    health_check_passed = False
    for i in range(max_health_retries):
      print(f"Health check attempt {i+1}/{max_health_retries}...")
      try:
        health_check_output_json = run_command(
          f"aws elbv2 describe-target-health --target-group-arn {tg_arn} --output json"
        )
        health_descriptions = json.loads(health_check_output_json)["TargetHealthDescriptions"]
        
        healthy_targets = [
          target for target in health_descriptions 
          if target["TargetHealth"]["State"] == "healthy"
        ]
        
        if len(healthy_targets) == 2:
          health_check_passed = True
          print("✅ Both targets are healthy!")
          break
      except Exception as e:
        print(f"Health check failed with error: {e}")

      if i < max_health_retries - 1:
        time.sleep(30)

    assert health_check_passed, "Targets did not become healthy in time."
    
    print(f"--- Testing URL: {url} ---")
    response = requests.get(url, timeout=30)
    
    assert response.status_code == 200
    assert "Dual-Stack Web App" in response.text
    
    print("✅ Integration Test Passed!")

  finally:
    print("--- Destroying Infrastructure ---")
    run_command("pulumi destroy --yes --skip-preview")