<?php
    /////////////////////////////////////////////////////////////////////////
    // GET
    function get_local($conn, $request) {
        $table = $request[0];
        array_shift($request);
        $action = $request[0];
        array_shift($request);
        switch ($action) {
           default:
                http_response_code(404);
                print "Unrecognised action '$action' requested.";
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
        switch ($action) {
            default:
                http_response_code(404);
                print "Unrecognised action '$action' requested.";
                break;
        }
    }
?>
