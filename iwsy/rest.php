<?php
    // REST server

    // This small REST server gives you the ability to manage your site database.

    date_default_timezone_set('Europe/London');
    logger(substr($_SERVER['PATH_INFO'], 1));
    $request = explode("/", substr($_SERVER['PATH_INFO'], 1));
    $action = array_shift($request);
    $method = $_SERVER['REQUEST_METHOD'];

    $props = array();
    $filename = 'resources/properties.txt';
    if (file_exists($filename)) {
        $file = fopen($filename, 'r');
        while (!feof($file)) {
            $ss = trim(fgets($file));
            if (!$ss || substr($ss, 0, 1) == '#') {
                continue;
            }
            $ss = explode('=', $ss, 2);
            if (count($ss) > 1) {
                $props[$ss[0]] = $ss[1];
            }
        }
        fclose($file);
    }

    // First, the commands that don't require a database connection.
    switch ($method) {
        case 'GET':
            switch ($action) {
                case 'list':
                    // List the contents of a directory, starting at 'resources'
                    // Endpoint: {site root}/rest.php/_list/[{path}]
                    $path = getcwd() . '/';
                    if (count($request)) {
                         $path .= 'resources/' . join('/', $request);
                    }
                    $files = scandir($path);
                    print '[';
                    // First list all the directories
                    $flag = false;
                    foreach ($files as $file) {
                        if (strpos($file, '.') !== 0) {
                            if (is_dir("$path/$file")) {
                                if ($flag) {
                                    print ',';
                                } else {
                                    $flag = true;
                                }
                                print "{\"name\":\"$file\",\"type\":\"dir\"}";
                            }
                        }
                    }
                    // Now do the ordinary files
                    foreach ($files as $file) {
                        if (strpos($file, '.') !== 0) {
                            if (!is_dir("$path/$file")) {
                                if ($flag) {
                                    print ',';
                                } else {
                                    $flag = true;
                                }
                                $type = 'file';
                                $p = strrpos($file, '.');
                                if ($p > 0) {
                                    $ext = substr($file, $p + 1);
                                    $type = $ext;
                                    switch (strtolower($ext)) {
                                        case 'jpg':
                                        case 'png':
                                        case 'gif':
                                            $type = 'img';
                                            break;
                                    }
                                }
                                print "{\"name\":\"$file\",\"type\":\"$type\"}";
                            }
                        }
                    }
                    print ']';
                    exit;
                    
                case 'hash':
                    // Get a hash of a value
                    // Endpoint: {site root}/rest.php/_hash/{value-to-hash}
                    print password_hash(join('/', $request), PASSWORD_DEFAULT);
                    exit;
                    
                case 'verify':
                    // Verify a hash
                    // Endpoint: {site root}/rest.php/_verify/{value-to-verify}
                    print password_verify(join('/', $request), $props['password']) ? 'yes' : 'no';
                    exit;
                    
                case 'validate':
                    // Validate a hash
                    // Endpoint: {site root}/rest.php/validate/{encrypted-value}/{value-to-validate}
                    print password_verify($request[1],str_replace('~', '/', $request[0])) ? 'yes' : 'no';
                    exit;

                case 'exists':
                    // Test if a file exists
                    // Endpoint: {site root}/rest.php/_exists/{{path}
                    $path = getcwd() . '/' . join('/', $request);
                    print file_exists($path) ? 'Y' : '';
                    exit;
                    
                case 'load':
                    // Load a file from the resources folder
                    // Endpoint: {site root}/rest.php/_load/{path}
                    $path = getcwd() . '/' . join('/', $request);
                    print file_get_contents($path);
                    exit;
                    
                case 'loadall':
                    // Load all the files in the named folder
                    // Endpoint: {site root}/rest.php/_loadall/{path}
                    $path = getcwd() . '/';
                    if (count($request)) {
                         $path .= join('/', $request);
                    }
                    $files = scandir($path);
                    print '[';
                    $flag = false;
                    foreach ($files as $file) {
                        if (strpos($file, '.') !== 0) {
                            if (!is_dir("$path/$file")) {
                                if ($flag) {
                                    print ',';
                                } else {
                                    $flag = true;
                                }
                                print file_get_contents("$path/$file");
                            }
                        }
                    }
                    print ']';
                    exit;
                    
                case 'test':
                    // Test endpoint
                    // Endpoint: {site root}/rest.php/_test/
                    print $_SERVER['HTTP_HOST'];
                    exit;
            }
            break;
        case 'POST':
            switch ($action) {
                case 'mkdir':
                    // Create a directory
                    // Endpoint: {site root}/rest.php/_mkdir/{path}
                    $path = getcwd() . '/' . join('/', $request);
                    logger("Create directory $path");
                    print("Create directory $path");
                    mkdir($path);
                    exit;
                    
                case 'upload':
                    // Upload a file (an image) to the current directory
                    // Endpoint: {site root}/rest.php/_upload/{path}
                    $path = $_POST['path'];
                    $path = explode("/", $path);
                    array_shift($path);
                    $path = join('/', $path);
                    mkdir($path, 0777, true);
                    logger("path: $path");
                    $fileName = $_FILES['source']['name'];
                    $tempName = $_FILES['source']['tmp_name'];
                    $fileType = $_FILES['source']['type'];
                    $fileSize = $_FILES['source']['size'];
                    $fileError = $_FILES['source']['error'];
                    if (!move_uploaded_file($tempName, "$path/$fileName")) {
                        unlink($tempName);
                        http_response_code(400);
                        logger("Failed to upload $tempName to $fileName.\ntempName: $tempName\nfileType: $fileType\nfileSize:$fileSize\nfileError: $fileError");
                    } else {
                        logger("File $fileName uploaded successfully to $path/$fileName");
                        $size = getimagesize("$path/$fileName");
                        logger("$path/$fileName: width:".$size[0].", height:".$size[1]);
                        if ($size[0] > 1024) {
                            logger("mogrify -resize 1024x1024 $path/$fileName");
                            system("mogrify -resize 1024x1024 $path/$fileName");
                        }
                    }
                    exit;
                    
                case 'save':
                    // Save data to a file in the resources folder
                    // Endpoint: {site root}/rest.php/save/{path}
                    $path = getcwd() . '/resources/' . join('/', $request);
                    $p = strrpos($path, '/');
                    $dir = substr($path, 0, $p);
                    mkdir($dir, 0777, true);
                    header("Content-Type: application/text");
                    $content = stripslashes(file_get_contents("php://input"));
                    $p = strrpos($path, '.');
                    $root = substr($path, 0, $p);
                    $ext = substr($path, $p);
                    file_put_contents($path, $content);
                    exit;
                    
                case 'delete':
                    // Delete a file in the resources folder
                    // Endpoint: {site root}/rest.php/_delete/{path}
                    $path = getcwd() . '/resources/' . join('/', $request);
                    if (is_dir($path)) {
                        rmdir($path);
                    } else {
                        unlink($path);
                    }
                    exit;
                    
                case 'email':
                    // Send an email
                    // Endpoint: {site root}/rest.php/email
                    header("Content-Type: application/text");
                    $value = stripslashes(file_get_contents("php://input"));
                    $json = json_decode($value);
                    $from = $json->from;
                    $to = $json->to;
                    $subject = $json->subject;
                    $message = $json->message;
                    $headers = "MIME-Version: 1.0\r\n";
                    $headers .= "Content-Type: text/html; charset=ISO-8859-1\r\n";
                    $headers .= "From: $from\r\n";
                    mail($to, $subject, $message, "$headers\r\n");
                    print "$headers\r\n$message";
                    exit;
            }
            break;
    }

    // The remaining commands require use of the database.
    $conn = mysqli_connect($props['sqlhost'], $props['sqluser'],
    $props['sqlpassword'], $props['sqldatabase']);
    if (!$conn)
    {
        http_response_code(404);
        die("Failed to connect to MySQL: " . mysqli_connect_error());
    }
    mysqli_set_charset($conn,'utf8');

    switch ($method) {
        case 'GET':
            get($conn, $action, $request);
            break;

        case 'POST':
            post($conn, $action, $request);
            break;
            
        default:
            http_response_code(400);
            break;
    }
    
    mysqli_close();
    exit;

    // Database GET
    function get($conn, $action, $request) {
        switch ($action) {
            case 'email':
                // Endpoint: {site root}/rest.php/email/{email}
                $email= $request[0];
                if ($email) {
                    logger("SELECT * from users WHERE email='$email'");
                    $result = query($conn, "SELECT * from users WHERE email='$email'");
                    if ($row = mysqli_fetch_object($result)) {
                        $response->id = $row->id;
                        $response->email = $row->email;
                        $response->password = $row->password;
                        $response->name = $row->name;
                        $response->home = $row->year . '/' . str_pad($row->day, 3, '0', STR_PAD_LEFT);
                        print json_encode($response);
                    }
                } else {
                    http_response_code(404);
                    print "{\"message\":\"REST: Email is empty.\"}";
                }
                break;
            
            case 'name':
                // Endpoint: {site root}/rest.php/name/{name}
                if ($request[0]) {
                    logger("SELECT * from users WHERE name='" . $request[0] . "'");
                    $result = query($conn, "SELECT * from users WHERE name='" . $request[0] . "'");
                    if ($row = mysqli_fetch_object($result)) {
                        $response->id = $row->id;
                        $response->email = $row->email;
                        $response->password = $row->password;
                        $response->name = $row->name;
                        $response->home = $row->year . '/' . str_pad($row->day, 3, '0', STR_PAD_LEFT);
                        print json_encode($response);
                    }
                } else {
                    http_response_code(404);
                    print "{\"message\":\"REST: Name is empty.\"}";
                }
                break;
            
            default:
                http_response_code(404);
                print "{\"message\":\"REST: Unknown action '$action'.\"}";
                break;
        }
    }

    // POST
    function post($conn, $action, $request) {
        $ts = time();
        switch ($action) {
            case 'user':
                // Endpoint: {site root}/rest.php/user
                header("Content-Type: application/json");
                $value = stripslashes(file_get_contents("php://input"));
                $json = json_decode($value);
                $email = $json->email;
                $password = $json->password;
                $name = $json->name;
                // Check if this user is already present
                $result = query($conn, "SELECT id FROM users WHERE email='$email'");
                if ($row = mysqli_fetch_object($result)) {
                    // Yes, so update the record
                    logger("UPDATE users SET password='$password',name='$name',ts=$ts WHERE email='$email'");
                    query($conn, "UPDATE users SET password='$password',name='$name',ts=$ts WHERE email='$email'");
                } else {
                    // No, so add a new record
                    $year = date('Y');
                    $day = str_pad(date('z'), 3, '0', STR_PAD_LEFT);
                    logger("INSERT INTO users (email,password,name,year,day,ts) VALUES ('$email','$password','$name','$year','$day','$ts')");
                    query($conn, "INSERT INTO users (email,password,name,year,day,ts) VALUES ('$email','$password','$name','$year','$day','$ts')");
                    mkdir("resources/$year/$day", 0777, true);
                }
                mysqli_free_result($result);
                break;
                
            default:
                http_response_code(400);
                print "{\"message\":\"REST: Unknown action '$action' for 'users'.\"}";
                break;
        }
    }

    /////////////////////////////////////////////////////////////////////////
    // Do an SQL query
    function query($conn, $sql)
    {
        $result = mysqli_query($conn, $sql);
        if (!$result) {
            http_response_code(404);
            logger('Error: '.mysqli_error($conn));
            die('Error: '.mysqli_error($conn));
        }
        return $result;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Log a message.
    function logger($message)
    {
        $timestamp = time();
        $date = date("Y/m/d H:i", $timestamp);
        if (!file_exists("log")) mkdir("log");
        $file = "log/".date("Y", $timestamp);
        if (!file_exists($file)) mkdir($file);
        $file.= "/".date("Ymd", $timestamp).".txt";
        $fp = fopen($file, "a+") or die("Can't open $file");
        fwrite($fp, "$date: $message\n");
        fclose($fp);
    }
?>
