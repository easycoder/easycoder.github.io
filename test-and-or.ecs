! Test script for AND/OR conditions

variable A
variable B
variable C
variable Result

! Test 1: Simple AND
put 5 into A
put 10 into B
if A is less than B and B is greater than 0
	put `AND works` into Result
	log Result

! Test 2: Simple OR
put 5 into C
if C is less than 0 or C is greater than 0
	put `OR works` into Result
	log Result

! Test 3: Precedence (AND binds tighter than OR)
! This should evaluate as: (false and true) or (true) = true
put 5 into A
put 10 into B
put 20 into C
if A is greater than 100 and B is less than 100 or C is greater than 0
	put `Precedence correct: (A > 100 AND B < 100) OR (C > 0)` into Result
	log Result

! Test 4: Complex AND chain
if A is less than B and B is less than C and C is greater than 0
	put `Multiple AND works` into Result
	log Result

! Test 5: Complex OR chain
if A is greater than 100 or B is greater than 100 or C is greater than 100 or C is greater than 0
	put `Multiple OR works` into Result
	log Result

log `All tests completed`
