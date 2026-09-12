@enrollment @fixtures @test-account
Feature: New Member Enrollment
  As a prospective member browsing the site
  I want to enroll in an intro class

  Scenario: Unauthenticated user signs in from the dashboard and returns to the dashboard
    Given the enrollment test account is clean
    When I navigate to the dashboard
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be on the dashboard

  Scenario: Signed-in user with no profile must create a profile before enrolling
    Given the enrollment test account is clean
    When I navigate to the dashboard
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be asked to create my profile
    And I should not see dashboard enrollment options

  Scenario: Signed-in user with a completed profile enrolls from the dashboard
    Given the enrollment test account has a completed profile
    And an enrollment intro class is available with 5 spots
    When I navigate to the dashboard
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    And I choose to sign up for an intro class from the dashboard
    And I select the first available intro class
    And I begin intro class enrollment
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be on the dashboard
    And I wait for the enrollment to finish processing
    Then I should see my intro class enrollment on the dashboard
    When I navigate to my payment history
    Then I should see the intro class payment in my payment history
    Then the completed enrollment is recorded in admin
    When I delete the test account from admin

  Scenario: User enrolls in an intro class as a guest user
    Given an enrollment intro class is available with 5 spots
    And I am on the home page
    When I select the first available intro class
    And I begin intro class enrollment
    And I continue enrollment as a guest
    Then I should see a popup titled "Create Your Profile"
    When I fill in the guest profile form with valid details
    And I create my guest profile and continue
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be back on the home page
    And I wait for the enrollment to finish processing
    Then the completed enrollment is recorded in admin
    When I delete the test account from admin

  Scenario: Guest enrollment links to the same member after sign-in
    Given the enrollment test account is clean
    And an enrollment intro class is available with 5 spots
    And I am on the home page
    When I select the first available intro class
    And I begin intro class enrollment
    And I continue enrollment as a guest
    Then I should see a popup titled "Create Your Profile"
    When I fill in the guest profile form with the sign-in email
    And I create my guest profile and continue
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be back on the home page
    And I wait for the enrollment to finish processing
    When I navigate to the dashboard
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be on the dashboard
    And I should see my intro class enrollment on the dashboard
    Then the completed enrollment is recorded in admin
    When I delete the test account from admin

  Scenario: Signed-in user with incomplete profile attempts to sign up on the front page, is redirected to the dashboard to complete profile and enrollment
    Given the enrollment test account is clean
    And an enrollment intro class is available with 5 spots
    And I am on the home page
    When I sign in from the home page
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be back on the home page
    When I select the first available intro class
    Then I should be asked to complete my profile before enrolling
    When I follow the complete profile prompt
    Then I should be on the dashboard
    When I create my profile
    Then I should be on the dashboard
    When I choose to sign up for an intro class from the dashboard
    And I select the first available intro class
    And I begin intro class enrollment
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be on the dashboard
    And I wait for the enrollment to finish processing
    Then I should see my intro class enrollment on the dashboard
    When I navigate to my payment history
    Then I should see the intro class payment in my payment history
    Then the completed enrollment is recorded in admin
    When I delete the test account from admin

  Scenario: User with a completed profile starts intro class enrollment while signed out, signs in, and completes checkout
    Given the enrollment test account has a completed profile
    And an enrollment intro class is available with 5 spots
    And I am on the home page
    When I select the first available intro class
    And I begin intro class enrollment
    And I sign in to continue enrollment
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be on the dashboard
    And I wait for the enrollment to finish processing
    Then I should see my intro class enrollment on the dashboard
    When I navigate to my payment history
    Then I should see the intro class payment in my payment history
    Then the completed enrollment is recorded in admin
    When I delete the test account from admin

  Scenario: User chooses to enroll into an an intro class from the front page, resumes pending enrollment after sign-in and completes checkout
    Given the enrollment test account is clean
    And an enrollment intro class is available with 5 spots
    And I am on the home page
    When I select the first available intro class
    And I begin intro class enrollment
    And I sign in to continue enrollment
    Then I should be redirected to the Auth0 login page
    When I complete the Auth0 login
    Then I should be on the pending enrollment page
    When I complete my profile
    Then I should be redirected to a checkout page
    When I complete the Square sandbox checkout
    Then I should be on the dashboard
    And I wait for the enrollment to finish processing
    Then I should see my intro class enrollment on the dashboard
    When I navigate to my payment history
    Then I should see the intro class payment in my payment history
    Then the completed enrollment is recorded in admin
    When I delete the test account from admin
