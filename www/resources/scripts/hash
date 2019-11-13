	variable Password
    variable Hash
    
    put prompt `Please type the admin password` with `` into Password
    if Password is empty exit
	rest get Hash from `_hash/` cat Password
    print Hash