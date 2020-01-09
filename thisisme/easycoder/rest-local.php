<?php
    // This is the local extension for the Jobmatcher REST server.
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
            case 'jm_candidates':
                switch ($action) {
                    case 'get':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_candidates/get/{email}
                        if ($request[0]) {
                            logger("SELECT value from $table WHERE email='" . $request[0] . "'");
                            $result = query($conn, "SELECT value from $table WHERE email='" . $request[0] . "'");
                            if ($row = mysqli_fetch_object($result)) {
                                print $row->value;
                            }
                        } else {
                            http_response_code(404);
                            print "{\"message\":\"REST: Email is empty.\"}";
                        }
                        break;
                    
                    default:
                        http_response_code(404);
                        print "{\"message\":\"REST: Unknown action '$action' for '$table'.\"}";
                        break;
                    }
                break;
                
            case 'jm_professions':
                switch ($action) {
                    case 'get':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_professions/get/{email}
                        if ($request[0]) {
                            logger("SELECT profession from $table WHERE email='" . $request[0] . "'");
                            $result = query($conn, "SELECT profession from $table WHERE email='" . $request[0] . "'");
                            if ($row = mysqli_fetch_object($result)) {
                                print $row->profession;
                            }
                        } else {
                            http_response_code(404);
                            print "{\"message\":\"REST: Email is empty.\"}";
                        }
                        break;
                    
                    default:
                        http_response_code(404);
                        print "{\"message\":\"REST: Unknown action '$action' for '$table'.\"}";
                        break;
                    }
                break;
                
            case 'jm_statements':
                switch ($action) {
                    case 'get':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_statements/get/{email}
                        if ($request[0]) {
                            logger("SELECT statement from $table WHERE email='" . $request[0] . "'");
                            $result = query($conn, "SELECT statement from $table WHERE email='" . $request[0] . "'");
                            if ($row = mysqli_fetch_object($result)) {
                                print $row->statement;
                            }
                        } else {
                            http_response_code(404);
                            print "{\"message\":\"REST: Email is empty.\"}";
                        }
                        break;
                    
                    default:
                        http_response_code(404);
                        print "{\"message\":\"REST: Unknown action '$action' for '$table'.\"}";
                        break;
                    }
                break;
                
            case 'jm_skills':
                switch ($action) {
                    case 'get':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_skills/get/{email}
                        if ($request[0]) {
                            logger("SELECT * from $table WHERE email='" . $request[0] . "'");
                            $result = query($conn, "SELECT * from $table WHERE email='" . $request[0] . "'");
                            $value = array();
                            while ($row = mysqli_fetch_object($result)) {
                                $item = '';
                                $item->skill = $row->skill;
                                $item->level = $row->level;
                                $value[] = $item;
                            }
                            print json_encode($value);
                        } else {
                            http_response_code(404);
                            print "{\"message\":\"REST: Email is empty.\"}";
                        }
                       break;
                    
                    default:
                        http_response_code(404);
                        print "{\"message\":\"REST: Unknown action '$action' for '$table'.\"}";
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
            case 'jm_candidates':
                switch ($action) {
                    case 'set':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_candidates/set
                        // Set the profession for a candidate (email)
                        header("Content-Type: application/json");
                        $value = stripslashes(file_get_contents("php://input"));
                        $json = json_decode($value);
                        $email = $json->email;
                        // Check if this candidate is already present
                        $result = query($conn, "SELECT id FROM $table WHERE email='$email'");
                        if ($row = mysqli_fetch_object($result)) {
                            // Yes, so update the record
                            logger("UPDATE $table SET value='$value',ts=$ts WHERE email='$email'");
                            query($conn, "UPDATE $table SET value='$value',ts=$ts WHERE email='$email'");
                        } else {
                            // No, so add a new record
                            logger("INSERT INTO $table (email,value,ts) VALUES ('$email','$value','$ts')");
                            query($conn, "INSERT INTO $table (email,value,ts) VALUES ('$email','$value','$ts')");
                        }
                        break;
                        
                    default:
                        http_response_code(400);
                        print "{\"message\":\"REST: Unknown action '$action' for '$table'.\"}";
                        break;
                }
                break;
                
            case 'jm_professions':
                switch ($action) {
                    case 'set':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_professions/set
                        // Set the profession for a candidate (email)
                        header("Content-Type: application/json");
                        $value = stripslashes(file_get_contents("php://input"));
                        $json = json_decode($value);
                        $email = $json->email;
                        $profession = strtolower($json->profession);
                        // Check if this candidate is already present
                        $result = query($conn, "SELECT id FROM $table WHERE email='$email'");
                        if ($row = mysqli_fetch_object($result)) {
                            // Yes, so update the record
                            logger("UPDATE $table SET profession='$profession',ts=$ts WHERE email='$email'");
                            query($conn, "UPDATE $table SET profession='$profession',ts=$ts WHERE email='$email'");
                        } else {
                            // No, so add a new record
                            logger("INSERT INTO $table (email,profession,ts) VALUES ('$email','$profession','$ts')");
                            query($conn, "INSERT INTO $table (email,profession,ts) VALUES ('$email','$profession','$ts')");
                        }
                        break;
                        
                    default:
                        http_response_code(400);
                        print "{\"message\":\"REST: Unknown action '$action' for '$table'.\"}";
                        break;
                }
                break;
                
            case 'jm_statements':
                switch ($action) {
                    case 'set':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_statements/set
                        // Set the statement for a candidate (email)
                        header("Content-Type: application/json");
                        $value = stripslashes(file_get_contents("php://input"));
                        $json = json_decode($value);
                        $email = $json->email;
                        $statement = $json->statement;
                        // Check if this candidate is already present
                        $result = query($conn, "SELECT id FROM $table WHERE email='$email'");
                        if ($row = mysqli_fetch_object($result)) {
                            // Yes, so update the record
                            logger("UPDATE $table SET statement='$statement',ts=$ts WHERE email='$email'");
                            query($conn, "UPDATE $table SET statement='$statement',ts=$ts WHERE email='$email'");
                        } else {
                            // No, so add a new record
                            logger("INSERT INTO $table (email,statement,ts) VALUES ('$email','$statement','$ts')");
                            query($conn, "INSERT INTO $table (email,statement,ts) VALUES ('$email','$statement','$ts')");
                        }
                        break;
                        
                    default:
                        http_response_code(400);
                        print "{\"message\":\"REST: Unknown action '$action' for '$table'.\"}";
                        break;
                }
                break;
                
            case 'jm_skills':
                switch ($action) {
                    case 'add':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_skills/add
                        // Set a skill for a candidate (email)
                        header("Content-Type: application/json");
                        $value = stripslashes(file_get_contents("php://input"));
                        $json = json_decode($value);
                        $email = $json->email;
                        $skill = strtolower($json->skill);
                        $level = strtolower($json->level);
                        // Check if there's an empty skill available
                        $result = query($conn, "SELECT id FROM $table WHERE email='' AND skill=''");
                        if ($row = mysqli_fetch_object($result)) {
                            // Yes, so update the record
                            $id = $row->id;
                            logger("UPDATE $table SET email='$email',skill='$skill',level='$level',ts=$ts WHERE id='$id'");
                            query($conn, "UPDATE $table SET email='$email',skill='$skill',level='$level',ts=$ts WHERE id='$id'");
                        }  else {
                            // No, so add a new record
                            logger("INSERT INTO $table (email,skill,level,ts) VALUES ('$email','$skill','$level','$ts')");
                            query($conn, "INSERT INTO $table (email,skill,level,ts) VALUES ('$email','$skill','$level','$ts')");
                        }
                        break;
                        
                    case 'save':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_skills/save
                        // Set a skill for a candidate (email)
                        header("Content-Type: application/json");
                        $value = stripslashes(file_get_contents("php://input"));
                        $json = json_decode($value);
                        $email = $json->email;
                        $old = strtolower($json->old);
                        $skill = strtolower($json->skill);
                        $level = strtolower($json->level);
                        // Check if this candidate is already present
                        $result = query($conn, "SELECT id FROM $table WHERE email='$email' AND skill='$old'");
                        if ($row = mysqli_fetch_object($result)) {
                            // Yes, so update the record
                            $id = $row->id;
                            logger("UPDATE $table SET skill='$skill',level='$level',ts=$ts WHERE id='$id'");
                            query($conn, "UPDATE $table SET skill='$skill',level='$level',ts=$ts WHERE id='$id'");
                        }
                        break;
                        
                    case 'remove':
                        // Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/jm_skills/remove
                        // Set a skill for a candidate (email)
                        header("Content-Type: application/json");
                        $value = stripslashes(file_get_contents("php://input"));
                        $json = json_decode($value);
                        $email = $json->email;
                        $skill = $json->skill;
                        logger("UPDATE $table SET email='',skill='',level=0 WHERE email='$email' AND skill='$skill'");
                        query($conn, "UPDATE $table SET email='',skill='',level=0 WHERE email='$email' AND skill='$skill'");
                        break;
                        
                    default:
                        http_response_code(400);
                        print "{\"message\":\"REST: Unknown action '$action' for '$table'.\"}";
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
