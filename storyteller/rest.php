<?php
    // REST server

    date_default_timezone_set('Europe/London');
    logger(substr($_SERVER['PATH_INFO'], 1));

    $props = array();
    $filename = '../'.$_SERVER['HTTP_HOST'].'.txt';
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
    
    $requestURI = substr($_SERVER['REQUEST_URI'], 1);
    $request = explode("/", $requestURI);
    $first = array_shift($request);
    $path = getcwd() . '/' . join('/', $request);
    $method = $_SERVER['REQUEST_METHOD'];
    // First, the commands that don't require a database connection.
    switch ($method) {
        case 'GET':
            switch ($first) {
                case '':
                    print file_get_contents(getcwd() . "/index.html");
                    exit;
                case 'scripted':
                    print file_get_contents(getcwd() . "/scripted.html");
                    exit;
                case 'list':
                    // List the contents of a directory
                    // Endpoint: {site root}/list/{path}
                    $files = scandir($path);
                    $dd = '';
                    $ff = '';
                    // First list all the directories
                    foreach ($files as $file) {
                        if (strpos($file, '.') !== 0) {
                            if (is_dir("$path/$file")) {
                                if ($dd) {
                                    $dd .= ',';
                                }
                                $dd .= "\"$file\"";
                            }
                        }
                    }
                    // Now do the ordinary files
                    foreach ($files as $file) {
                        if (strpos($file, '.') !== 0) {
                            if (!is_dir("$path/$file")) {
                                if ($ff) {
                                    $ff .= ',';
                                }
                                $ff .= "\"$file\"";
                            }
                        }
                    }
                    print '{"dirs":[' . $dd . '],"files":[' . $ff . ']}';
                    exit;
                default:
                    print file_get_contents($requestURI);
                    exit;
            }
            break;
        case 'POST':
            switch ($first) {
                case 'makedirs':
                    // Create a directory
                    // Endpoint: {site root}/mkdir/{path}
                    logger("Create directory $path");
                    mkdir($path, 0777, true);
                    exit;
                case 'save':
                    // Save data to a file
                    // Endpoint: {site root}/save/{path}
                    $p = strrpos($path, '/');
                    $dir = substr($path, 0, $p);
                    mkdir($dir, 0777, true);
                    header("Content-Type: application/text");
                    $content = stripslashes(file_get_contents("php://input"));
                    file_put_contents(getcwd() . '/' . join('/', $request), $content);
                    exit;
                case 'delete':
                    // Delete a file in the resources folder
                    // Endpoint: {site root}/delete/{path}
                    $path = getcwd() . '/' . join('/', $request);
                    if (is_dir($path)) {
                        rmdir($path);
                    } else {
                        unlink($path);
                    }
                    exit;
                case 'upload':
                    // Upload a file (an image) to the current directory
                    // Endpoint: {site root}/upload/{path}
                    $path = $_POST['path'];
                    $path = explode("/", $path);
                    array_shift($path);
                    $path = "resources/" . join('/', $path);
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
                case 'email':
                    // Send an email
                    // Endpoint: {site root}/email
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
                default:
                    http_response_code(404);
                    return;
            }
            break;
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
