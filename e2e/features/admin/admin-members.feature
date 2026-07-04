@admin
Feature: Admin Member Verification
  As an admin user
  I want to verify that enrolled guest members appear in the admin members panel

  Scenario: Admin can find a recently enrolled guest member
    Given I am logged in as an admin
    When I navigate to the admin members page
    And I click the "All" status filter
    And I search for "Test Guest"
    Then I should see at least one member in the results
