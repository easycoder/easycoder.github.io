! EC-0007: Includes membership in condition

string Sentence
string Vowels
string Ch
number I
number Count

put `The quick brown fox jumps over the lazy dog` into Sentence
put lowercase Sentence into Sentence
put `aeiou` into Vowels
put 0 into I
put 0 into Count

while I is less than length of Sentence
begin
	put char I of Sentence into Ch
	if Vowels includes Ch
	begin
		add 1 to Count
	end
	add 1 to I
end

log Count
