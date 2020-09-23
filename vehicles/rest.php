<?php
    // REST server

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

    switch ($method) {
        case 'GET':
            switch ($action) {
            
                default:
                    http_response_code(404);
                    print "{\"message\":\"REST: Unrecognized request '$action'\"}";
                    exit;
        
                case 'test':
                    exit;
            
                case 'list':
                    // List the contents of a directory, starting at 'resources'
                    // Endpoint: {site root}/rest.php/list/password/[{path}]
                    $password = array_shift($request);
                    checkAdminPassword($password, $props['password']);
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
                    print password_verify($request[1], str_replace('~', '/', $request[0])) ? 'yes' : 'no';
                    exit;
            }
            break;

        case 'POST':
            switch ($action) {
            
                default:
                    http_response_code(404);
                    print "{\"message\":\"REST: Unrecognized request '$action'\"}";
                    exit;
        
                case 'mkdir':
                    // Create a directory
                    // Endpoint: {site root}/rest.php/mkdir/{path}
                    $path = getcwd() . '/' . join('/', $request);
                    $path = preg_replace('/[^0-9\-.\/A-Za-z]/', '', $path);
                    logger("Create directory $path");
                    print("Create directory $path");
                    mkdir($path);
                    exit;
                    
                case 'save':
                    // Save data to a file in the resources folder
                    // Endpoint: {site root}/rest.php/save/password/{path}
                    $password = array_shift($request);
                    checkAdminPassword($password, $props['password']);
                    $path = getcwd() . '/resources/' . join('/', $request);
                    $path = preg_replace('/[^0-9\-.\/A-Za-z]/', '', $path);
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
                    // Endpoint: {site root}/rest.php/delete/password/{path}
                    $password = array_shift($request);
                    checkAdminPassword($password, $props['password']);
                    $path = getcwd() . '/resources/' . join('/', $request);
                    $path = preg_replace('/[^0-9\-.\/A-Za-z]/', '', $path);
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

    /////////////////////////////////////////////////////////////////////////
    // Check the admin password
    function checkAdminPassword($password, $encrypted)
    {
        if (password_verify($password, $encrypted)) {
            return;
        }
        http_response_code(403);
        print "{\"message\":\"REST: Bad password.\"}";
        exit;
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
