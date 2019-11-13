	variable N
	variable X
	variable Y
	variable Z
	file File
	
	script Benchmark
	variable Start
	variable Finish
	variable N
	variable M
	variable Array
	dictionary Dictionary
	
	!go to Skip
	
	print `FOR loop counting to 10,000`
	put now into Start
	put 0 into N
	while N is less than 10000 increment N
	put now into Finish
	take Start from Finish giving N
	print N cat ` milliseconds`
	
!	debug step

	print `Compare 10,000 long integers for equality`
	put now into Start
	put 0 into N
	while N is less than 10000
	begin
		if N is 1234567890 begin end
		increment N
	end
	put now into Finish
	take Start from Finish giving N
	print N cat ` milliseconds`

	print `Allocate and initialize a 10,000 element array`
	put now into Start
	set the elements of Array to 10000
	put 0 into N
	while N is less than 10000
	begin
		index Array to N
		put N into Array
		increment N
	end
	put now into Finish
	take Start from Finish giving N
	print N cat ` milliseconds`

	print `Allocate and initialize a 50x50 dictionary`
	put now into Start
	put 0 into N
	while N is less than 50
	begin
		put 0 into M
		while M is less than 50
		begin
			put M into Dictionary as N cat ` ` cat M
			increment M
		end
		increment N
	end
	put now into Finish
	take Start from Finish giving N
	print N cat ` milliseconds`

	put empty into X
	set property `name` of X to `Fred`
	print property `name` of X
	put empty into Y
	put 1 into N
	while N is less than 6
	begin
			append N to Y
			increment N
	end
	set element 2 of Y to `Some data`
	print element 2 of Y
	if N is numeric print `Numeric`
	set Y
	print `Set: ` cat Y
	clear Y
	print `Clear: ` cat Y
	toggle Y
	print `Toggle: ` cat Y
	toggle Y
	print `Toggle: ` cat Y
	
	set Y
	if Y is boolean print `Boolean` else print `Not Boolean`
	put 5 into Y
	if Y is boolean print `Boolean` else print `Not Boolean`
	put `hello` into Y
	if Y is boolean print `Boolean` else print `Not Boolean`
	
	put 0 into N
	while N is less than 10
	begin
			if N is even print N cat ` is even`
			if N is odd print N cat ` is odd`
			add 1 to N
	end

	put 51 into N
	while N is less than 54
	begin
			if 52 is greater than N print `52 is greater than ` cat N else print `52 is not greater than  cat N
			if 52 is less than N print `52 is less than ` cat N else print `52 is not less than ` cat N
			if 52 is not greater than N print `52 is not greater than ` cat N else print `52 is greater than ` cat N
			if 52 is not less than N print `52 is not less than ` cat N else print `52 is less than ` cat N
			add 1 to N
	end

	print `Start`
	fork to Concurrent
	put 0 into N
Loop1:
	gosub to Print
	wait 10 ticks
	add 1 to N
	if N is less than 10 go to Loop1

	open File `/home/graham/test.txt` for writing
	write line `Hello, world!` to File
	close File
	open File `/home/graham/test.txt` for appending
	write `I'm back!` to File
	close File
	open File `/home/graham/test.txt` for reading
	read line X from File
	print X
	read X from File
	print X
	close File

Skip:
  put 500 into N
	move to 400 400
	wait 1
	move right N in 1 second
	move down N in 1 second
	move left N in 1 second
	move up N in 1 second

	exit

Print:
	print `N = ` cat N
	return

Concurrent:
	put 0 into M
Loop2:
	print `         M = ` cat M
	wait 20 ticks
	add 1 to M
	if M is less than 10 go to Loop2
	stop
