! EC-0006: AND/OR compound conditions

variable A
variable B
variable C
variable Result

! Test 1: Simple AND - both sides true
put 5 into A
put 10 into B
if A is less than B and B is greater than 0
begin
	put `AND works` into Result
	log Result
end

! Test 2: Simple OR - one side true
put 5 into C
if C is less than 0 or C is greater than 0
begin
	put `OR works` into Result
	log Result
end

! Test 3: AND precedence over OR - (false and true) or true = true
put 5 into A
put 10 into B
put 20 into C
if A is greater than 100 and B is less than 100 or C is greater than 0
begin
	put `Precedence correct` into Result
	log Result
end
