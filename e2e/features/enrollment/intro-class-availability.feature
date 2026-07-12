@enrollment @fixtures
Feature: Intro Class Availability Display
  As a prospective member
  I want to see accurate availability for intro classes
  So that I can choose a class with open spots

  Scenario: User sees available spots for a class with inventory
    Given an intro class "Saturday Morning" exists with 5 spots
    And I am on the home page
    When I view the intro class offerings
    Then I should see "5 spots available" for "Saturday Morning"
    And the "Saturday Morning" class should be selectable

  Scenario: User sees class is full when no spots available
    Given an intro class "Saturday Afternoon" exists with 0 spots
    And I am on the home page
    When I view the intro class offerings
    Then the "Saturday Afternoon" class should show as full
    And the "Saturday Afternoon" class should not be selectable

  Scenario: User sees mixed availability across multiple classes
    Given the following intro classes exist:
      | name           | spots |
      | Morning Class  | 3     |
      | Afternoon Class| 0     |
    And I am on the home page
    When I view the intro class offerings
    Then I should see "3 spots available" for "Morning Class"
    And the "Morning Class" class should be selectable
    And the "Afternoon Class" class should show as full
    And the "Afternoon Class" class should not be selectable
