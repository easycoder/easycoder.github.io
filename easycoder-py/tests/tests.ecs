!	A test script

	script Tests

	debug compile
	use psutil

	dictionary D
	dictionary D2
	list List
	variable Data
	variable E
	variable M
	variable N
	variable Array
	variable X
	variable Y
	variable Z
	stack Stack
	file File

	debug step

	log `FOR loop counting to 10`
	put 0 into N
	while N is less than 10
		increment N

	log `Compare 10 integers for equality`
	put 0 into N
	while N is less than 10
	begin
		if N is 1234567890 begin end
		increment N
	end

	log `Allocate and initialize a 10 element array`
	put 0 into N
	while N is less than 10
	begin
		add 1 to N giving M
		set the elements of Array to M
		index Array to N
		put N into Array
		increment N
	end

	log `Allocate and initialize a 10 element JSON dictionary`
	put 0 into N
	while N is less than 10
	begin
		put 0 into M
		while M is less than 10
		begin
			set entry N cat `,` cat M of D to M
			increment M
		end
		increment N
	end

	put `one ` cat 1 into X
	assert X is `one 1`
	put 2 cat ` two` into X
	assert X is `2 two`
	
	put json `{}` into D
	set entry `one` of D to 10
	set entry `two` of D to 20
	set entry `three` of D to 30
	put ` ` cat entry `one` of D into X
	assert X is 10
	put D into X
	log X
	assert X is `{"one": 10, "two": 20, "three": 30}`

	put D into D2
	reset D
	log D
	log D2

	set X to 6
	set Y to 20
	log X
	log Y

	add X to Y giving Z
	assert Z is 26
	add X to Y
	assert Y is 26

	take 5 from Y giving Z
	assert Z is 21
	take 5 from Y
	assert Y is 21

	multiply Y by X giving Z
	assert Z is 126
	multiply Y by X
	assert Y is 126
	divide Y by 3 giving Z
	assert Z is 42
	divide Y by 3
	assert Y is 42

	put 12345 into Y
	assert Y is 12345
	put Y modulo 10 into Z
	assert Z is 5

	assert Z is not -1

	reset D
	set entry `name` of D to `Fred`
	assert entry `name` of D is `Fred`

	put `The quick brown fox jumps over the lazy dog` into X
	assert left 9 of X is `The quick`
	assert right 3 of X is `dog`
	assert from 31 of X is `the lazy dog`

	reset List
	put 0 into N
	while N is less than 6
	begin
		append N to List
		increment N
	end
	log List
	assert the count of List is 6
	assert item 2 of List is 2
	assert List is `[0, 1, 2, 3, 4, 5]`

	set item 2 of List to `Some data`
	assert item 2 of List is `Some data`
	assert item 2 of List is string
	assert N is numeric

	set Y
	assert Y is true
	clear Y
	assert Y is false
	toggle Y
	assert Y is true
	toggle Y
	assert Y is false

	set Y
	assert Y is boolean
	put 5 into Y
	assert Y is not boolean
	put `hello` into Y
	assert Y is not boolean

	put 55 into N
	push N onto Stack
	put 60 into N
	pop N from Stack
	log N
	assert N is 55

	set N to 0
	while N is less than 10
	begin
		log N
		assert N is even
		add 2 to N
	end

	assert 52 is greater than 51
	assert 52 is less than 53
	assert 52 is not greater than 52
	assert 52 is not less than 52

	wait 3

	fork to Concurrent
	put 0 into N
Loop1:
	gosub to Print
	wait 10 ticks
	add 1 to N
	if N is less than 10 go to Loop1

	open File `test.txt` for writing
	write line `Hello, world!` to File
	close File
	open File `test.txt` for reading
	read X from File
	assert X is `Hello, world!`  cat newline
	close File
	open File `test.txt` for appending
	write `I'm back!` to File
	close File
	open File `test.txt` for reading
	read X from File
	close File
	delete file `test.txt`
	assert X is the cat of `Hello, world!`  and newline and `I'm back!`

    put now into N
    multiply N by 1000
    log N
    log datime N
    log datime 1769644800 format `%b %d %Y %H:%M:%S`

    put `"Goodbye,\n cruel world!"` into X
    put encode X into Y
    log Y
    put decode Y into X
    assert X is `"Goodbye,\n cruel world!"`

    set the encoding to `base64`
    put encode X into Y
    log Y
    put decode Y into X
    assert X is `"Goodbye,\n cruel world!"`

    put from 8 to 12 of `This is some text` into X
	assert X is `some`

    put hash `Graham` into X
	assert X is `5d422d0acb34b8c10ed55cc2809937c8226538ec1729f5cade99449c597b30e4`

    log the timestamp cat ` ` cat now

    log the files in `.`

    log `Memory: ` cat the memory cat `MB`
	if 5 is not `OK` log `Comparing 5 with 'OK' gives False`
	if 5 is `5` log `but comparing 5 with '5' gives True`

	wait 2
	log `All done!`
	exit

Print:
	log `N = ` cat N
	return

Concurrent:
	put 0 into M
Loop2:
	log `         M = ` cat M
	wait 20 ticks
	add 1 to M
	if M is less than 10 go to Loop2
	stop
