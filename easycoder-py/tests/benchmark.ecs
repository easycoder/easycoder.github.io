	script Benchmark

	variable Start
	variable Finish
	variable N
	variable M
	variable Array
	variable Dictionary

!	debug step

	log `FOR loop counting to 500,000`
	wait 1 tick
	put now into Start
	put 0 into N
	while N is less than 500000 increment N
	put now into Finish
	take Start from Finish giving N
	log N cat ` seconds`

	log `Compare 500,000 long integers for equality`
	wait 1 tick
	put now into Start
	put 0 into N
	while N is less than 500000
	begin
		if N is 1234567890 begin end
		increment N
	end
	put now into Finish
	take Start from Finish giving N
	log N cat ` seconds`

	log `Allocate and initialize a 500,000 element array`
	wait 1 tick
	put now into Start
	set the elements of Array to 500000
	put 0 into N
	while N is less than 500000
	begin
		index Array to N
		put N into Array
		increment N
	end
	put now into Finish
	take Start from Finish giving N
	log N cat ` seconds`

	log `Allocate and initialize a 500,000 element dictionary`
	wait 1 tick
	put json `{}` into Dictionary
	put now into Start
	put 0 into N
	while N is less than 1000
	begin
		put 0 into M
		while M is less than 500
		begin
			set property N cat ` ` cat M of Dictionary to M
			increment M
		end
		increment N
	end
	log property `123 456` of Dictionary
	put now into Finish
	take Start from Finish giving N
	log N cat ` seconds`
	wait 1
	exit
