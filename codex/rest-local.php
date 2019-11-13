<?php
    // This is the local extension for the learn2code REST server.
    // It contains endpoints for accessing the various tables used by the site.
    // For consistency, all endpoints have the same format:
    // {site root}/wp-content/plugins/easycoder/rest.php/_/{table name}/{action}[/...]

    /////////////////////////////////////////////////////////////////////////
    // GET
    function get_local($conn, $request) {
        $table = $request[0];
        array_shift($request);
        $action = $request[0];
        array_shift($request);
        switch ($table) {
            case 'ec_events':
                switch ($action) {
                    case 'count':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/yw_sections/count/{section}
                        // Return the number of articles from this author
                        $name = $request[0];
                        $result = $conn->query("SELECT page from $table
                            WHERE name='" . str_replace(' ', '%20', $name) ."'");
                        print mysqli_num_rows($result);
                        mysqli_free_result($result);
                        break;
                    case 'list':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/yw_sections/list/{section}
                        $name = $request[0];
                        $result = $conn->query("SELECT page from $table
                            WHERE name='" . str_replace(' ', '%20', $name) ."'");
                        $response = '[';
                        while ($row = mysqli_fetch_object($result)) {
                            if ($response != '[') {
                                $response .= ',';
                            }
                            $response .= $row->page;
                        }
                        $response .= ']';
                        print $response;
                        mysqli_free_result($result);
                        break;
                    default:
                        http_response_code(404);
                        print "{\"message\":\"REST: Unknown action '$action' in '$table'.\"}";
                        break;
                }
                break;
           default:
                http_response_code(404);
                print "{\"message\":\"REST: Unknown table '$table'.\"}";
                break;
        }
    }
    
    /////////////////////////////////////////////////////////////////////////
    // POST
    function post_local($conn, $request) {
        $ts = time();
        $table = $request[0];
        array_shift($request);
        $action = $request[0];
        array_shift($request);
        switch ($table) {
            case 'ec_events':
                switch ($action) {
                    case 'log':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/ec_visits/log/{id}
                        // If there is no body content this just notifies the server of the user ID
                        $vid = $request[0];
                        $ts = time();
                        $agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : null;
//                         $uri = isset($_SERVER['HTTP_REQUEST_URI']) ? $_SERVER['HTTP_REQUEST_URI'] : null;
                        $ip = $_SERVER['REMOTE_ADDR'];
                        $json->ipaddr = $ip;
                        // If the supplied id is not 0, see if there's a record 
                        if ($vid) {
                            $result = $conn->query("SELECT id FROM ec_visitors WHERE id=$vid");
                            if (mysqli_fetch_object($result)) {
                                $conn->query("UPDATE ec_visitors SET ip='$ip',ts=$ts,agent='$agent' WHERE id=$vid");
                            } else {
                                $vid = 0;
                            }
                            mysqli_free_result($result);
                        }
                        if ($vid == 0) {
                            // See if there's a record with this IP address and user agent
                            $result = $conn->query("SELECT id FROM ec_visitors WHERE ip='$ip' AND agent='$agent'");
                            if ($row = mysqli_fetch_object($result)) {
                                $vid = $row->id;
                                $conn->query("UPDATE ec_visitors SET ip='$ip',ts=$ts,agent='$agent' WHERE id=$vid"); 
                            }
                            mysqli_free_result($result);
                        }
                        if ($vid == 0) {
                             // Look for a record that's more than 3 months old
                            $expiry = $time - 3 * 30 * 24 * 60 * 60;
                            $result = $conn->query("SELECT id FROM ec_visitors WHERE ts<$expiry");
                            if ($row = mysqli_fetch_object($result)) {
                                $vid = $row->id;
                                $conn->query("UPDATE ec_visitors SET ip='$ip',ts=$ts,agent='$agent' WHERE id=$vid"); 
                            } else {
                                $conn->query("INSERT INTO ec_visitors (ip,ts,agent) VALUES ('$ip','$ts','$agent')");
                                $vid = mysqli_insert_id($conn);
                            }
                            mysqli_free_result($result);
                        }
                        print $vid; 
                        
                        // Now deal with body content
                        header("Content-Type: application/json");
                        $data = stripslashes(file_get_contents("php://input"));
                        if ($data) {
                            $json = json_decode($data);
                            $json->v = 1;
                            $json->ts = $ts;
                            $json->vid = $vid;
//                             if ($uri) {
//                                 $json->referrer = $uri;
//                                 $data = json_encode($json);
//                             }
                            // Write to the database
//                            $conn->query("INSERT INTO ec_visits (vid,ts,data) VALUES ('$vid','$ts','$data')");
                            // Write to the visitor log
                            $visits = '../../../easycoder/visits';
                            if (!file_exists($visits)) {
                                mkdir($visits);
                            }
                            $data = json_encode($json);
                            $date = date("Y/m/d H:i", $ts);
                            $file = "$visits/".date("Y", $ts);
                            if (!file_exists($file)) {
                                mkdir($file);
                            }
                            $file .= "/".date("Ymd", $ts).".txt";
                            $fp = fopen($file, "a+");
                            if ($fp) {
                                fwrite($fp, "$data\n");
                                fclose($fp);
                            } else {
                                http_response_code(400);
                                print "{\"message\":\"REST: Can't open file '$file'.\"}";
                            }
                        }
                        break;
                    default:
                        http_response_code(404);
                        print "{\"message\":\"REST: Unknown action '$action' in '$table'.\"}";
                        break;
                    }
                break;
            default:
                http_response_code(404);
                print "{\"message\":\"REST: Unknown table '$table'.\"}";
                break;
        }
    }
?>
