<?php
		// REST server

		// This small REST server gives you the ability to manage tables
		// in your site database. WordPress provides a full set of API endpoints
		// for its own functions but if you need extra tables or extra features
		// you have to write your own. This server provides you with access to
		// your own tables as long as they fit a specified format. It also lets you
		// add an extension of your own to handle special needs.
		//
		// Don't modify this file; it will be overwritten on the next upgrade
		// of EasyCoder. Instead, use the extension script, a skeleton for which
		// was set up when you first installed EasyCoder, at
		// {root of your WordPress installation}/easycoder/rest-local.php.

		date_default_timezone_set('Europe/London');
		logger(substr($_SERVER['PATH_INFO'], 1));
		$request = explode("/", substr($_SERVER['PATH_INFO'], 1));
		$table = array_shift($request);
		$method = $_SERVER['REQUEST_METHOD'];
		
		// The properties file is best kept above the site root to prevent access by browsers.
		// For WordPress, that's 4 levels up from our current location in the 'plugins/easycoder' folder.
		// The name of the file is the server URL with '.txt' appended.
		// You can override this by providing a file called 'properties' in the 'easycoder' folder.
		$filename = '../../../easycoder/properties';
		if (!file_exists($filename)) {
			$filename = '../../../../' . $_SERVER['HTTP_HOST'] . '.txt';
		}
		$props = array();
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
		$resources = $props['resources'] ? $props['resources'] : 'easycoder';
		$scripts = $props['scripts'] ? $props['scripts'] : 'easycoder/scripts';
		$upload = $props['upload'] ? $props['upload'] : 'easycoder/upload';

		// First, the commands that don't require a database connection.
		switch ($method) {
				case 'GET':
						switch ($table) {
						case '_list':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_list/[{path}]
								// List the contents of a directory
								if (count($request) && $request[0]) {
										$path = '/' . str_replace('~', '/', $request[0]);
								}
								// Start at the easycoder folder
								$path = "../../../$resources$path";
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
																	case 'jpeg':
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
						case '_hash':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_hash/{value-to-hash}
								print password_hash($request[0], PASSWORD_DEFAULT);
								exit;
						case '_verify':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_verify/{value-to-verify}
								print password_verify($request[0], $props['password']) ? 'yes' : 'no';
								exit;
						case '_verify2':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_verify2/{value-to-verify}/{hash}
								print password_verify($request[0], str_replace('~', '/', $request[1])) ? 'yes' : 'no';
								exit;
						case '_validate':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_validate/{value-to-validate}/{encrypted-value}
								print password_verify($request[0], str_replace('~', '/', $request[1])) ? 'yes' : 'no';
								exit;
						case '_load':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_load/{path}
								header("Content-Type: text/plain");
								$path = "../../../$resources/" . str_replace('~', '/', $request[0]);
								print file_get_contents($path);
								exit;
						case '_loadall':
								// Load all the files in the named folder
								// Endpoint: {site root}/easycoder/rest.php/_loadall/{path}
								$path = "../../../$resources/" . str_replace('~', '/', $request[0]);
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
						case '_scripted':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_scripted
								print file_get_contents('scripted');
								exit;
						case '_eclist':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_eclist/[{path}]
								// List the contents of a directory
								if (count($request) && $request[0]) {
										$path = '/' . str_replace('~', '/', $request[0]);
								}
								$files = scandir(getcwd().$path);
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
																	case 'jpeg':
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
						case '_ecload':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_load/{path}
								header("Content-Type: text/plain");
								$path = str_replace('~', '/', $request[0]);
								print file_get_contents($path);
								exit;
						break;
					}
				case 'POST':
						switch ($table) {
								case '_mkdir':
										// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_mkdir/{path}
										$path = "../../../$resources/" . str_replace('~', '/', $request[0]);
										mkdir($path, 0777, true);
										exit;
								case '_upload':
										// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_upload
										// Upload a file (an image) to the current directory
										$path = $_POST['path'];
										$pathsegs = explode("/", $path);
										$path = "../../../$upload/" . str_replace('~', '/', $pathsegs[1]);
										mkdir($path, 0777, true);
										$fileName = str_replace(' ', '-', $_FILES['source']['name']);
										$tempName = $_FILES['source']['tmp_name'];
										$fileType = $_FILES['source']['type'];
										$fileSize = $_FILES['source']['size'];
										$fileError = $_FILES['source']['error'];
										if (!move_uploaded_file($tempName, "$path/$fileName")) {
												unlink($tempName);
												http_response_code(400);
												logger("Failed to upload $fileName to $path/$fileName.\ntempName: $tempName\nfileType: $fileType\nfileSize:$fileSize\nfileError: $fileError");
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
								case '_thumb':
										// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_thumb
										header("Content-Type: application/json");
										$value = stripslashes(file_get_contents("php://input"));
										$value = str_replace( array("&", "|", ";"), '', $value);
										$json = json_decode($value);
										$source = "../../../$resources/" . str_replace('~', '/', $json->source);
										$dest = "../../../$resources/" . str_replace('~', '/', $json->dest);
										mkdir(substr($dest, 0, strrpos($dest, '/')), 0777, true);
										system("convert $source -resize 100x100^ -gravity Center -crop 100x100+0+0 +repage $dest");
										exit;
								case '_delete':
										// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_delete/{path}
										$path = "../../../$resources/" . str_replace('~', '/', $request[0]);
										if (is_dir($path)) {
														rmdir($path);
												} else {
														unlink($path);
												}
										exit;
								case '_email':
										// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_email
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
								case '_save':
										// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_save/{path}
										$path = "../../../$resources/" . str_replace('~', '/', $request[0]);
										$p = strrpos($path, '/');
										$dir = substr($path, 0, $p);
										mkdir($dir, 0777, true);
										header("Content-Type: application/text");
										$content = stripslashes(file_get_contents("php://input"));
										$p = strrpos($path, '.');
										$root = substr($path, 0, $p);
										$ext = substr($path, $p);
										$backup = "$root-bak$ext";
										unlink($backup);
										copy($path, $backup);
										file_put_contents($path, $content);
										logger("Saved $path");
										exit;
								case '_ecsave':
										// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_ecsave/{path}
										$path = str_replace('~', '/', $request[0]);
										$p = strrpos($path, '/');
										if ($p > 0) {
												$dir = substr($path, 0, $p);
												mkdir($dir, 0777, true);
										}
										header("Content-Type: application/text");
										$content = stripslashes(file_get_contents("php://input"));
//										print $content;
//										$content = str_replace('\\', '\\\\', $content);
										unlink($path);
										file_put_contents($path, $content);
										exit;
								case '_ecdelete':
										// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_ecdelete/{path}
										$path = str_replace('~', '/', $request[0]);
										if (is_dir($path)) {
												rmdir($path);
										} else {
												unlink($path);
										}
										exit;
						}
						break;
				case 'OPTIONS':
                    include '../../../easycoder/rest-local.php';
                    options_local($conn, $request);
		}

		// Most further commands require use of the database.
		$conn = mysqli_connect($props['sqlhost'], $props['sqluser'],
				$props['sqlpassword'], $props['sqldatabase']);
		if (!$conn)
		{
				http_response_code(404);
				die("Failed to connect to MySQL: " . mysqli_connect_error());
		}
		mysqli_set_charset($conn,'utf8');
		
		if (!count($request)) {
				http_response_code(400);
				print "{\"message\":\"Incomplete REST query: ".substr($_SERVER['PATH_INFO'], 1).".\"}";
				exit;
		}
		
		// You can have a custom extension that deals with special requests.
		// These all have '_' as the table name.
		switch ($method) {
		
				case 'GET':
						if ($table == '_') {
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/{request-and-arguments}
								include '../../../easycoder/rest-local.php';
								get_local($conn, $request);
								return;
						} else {
								// Use the handler below
								get($conn, $table, $request);
						}
						break;
						
				case 'POST':
						if ($table == '_') {
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/_/{request-and-arguments}
								include '../../../easycoder/rest-local.php';
								post_local($conn, $request);
								return;
						} else {
								// Use the handler below
								post($conn, $table, $request);
						}
						break;

				default:
						http_response_code(400);
						break;
		}
		mysqli_close();
		exit;
		
		/////////////////////////////////////////////////////////////////////////
		// All the other commands deal with tables having a specific format, with the following fields:
		//
		// id int(11)
		// name varchar(40)
		// value text
		// ts int(11)
		//
		// GET
		function get($conn, $table, $request) {
				$action = $request[0];
				switch ($action) {
						case 'count':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/table/count
								// Return the number of items in the table
								$result = $conn->query("SELECT id from $table");
								//print "{\"count\":".mysqli_num_rows($result)."}";
								print mysqli_num_rows($result);
								mysqli_free_result($result);
								break;
								
						case 'list':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/{table}/list/{offset}/{count}
								// List items by ID, with optional offset & count, defaulting to 0 & 10
								switch (count($request)) {
										case 2:
												$offset = 0;
												$count = $request[1];
												break;
										case 3:
												$offset = $request[1];
												$count = $request[2];
												break;
										default:
												$offset = 0;
												$count = 10;
												break;
								}
								$result = $conn->query("SELECT id FROM $table LIMIT $offset, $count");
								$response = '[';
								while ($row = mysqli_fetch_object($result)) {
										if ($response != '[') {
												$response .= ',';
										}
										$response .= $row->id;
								}
								mysqli_free_result($result);
								$response .= ']';
								print $response;
								break;
								
						case 'names':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/{table}/names/{offset}/{count}
								// List items by name in ascending alphabetical order,
								// with optional offset & count, defaulting to 0 & 10
								switch (count($request)) {
										case 2:
												$offset = 0;
												$count = $request[1];
												break;
										case 3:
												$offset = $request[1];
												$count = $request[2];
												break;
										default:
												$offset = 0;
												$count = 10;
												break;
								}
								$result = $conn->query("SELECT name FROM $table ORDER BY name LIMIT $offset, $count");
								$response = '[';
								while ($row = mysqli_fetch_object($result)) {
										if ($response != '[') {
												$response .= ',';
										}
										$response .= "\"$row->name\"";
								}
								mysqli_free_result($result);
								$response .= ']';
								print $response;
								break;
								
						case 'id':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/{table}/id/{id}
								// Get a record given its id
								if (count($request) < 2) {
										http_response_code(400);
										print "Incomplete REST query.";
										exit;
								}
								$id = $request[1];
								$result = $conn->query("SELECT value FROM $table WHERE id='$id'");
								if ($row = mysqli_fetch_object($result)) {
										print $row->value;
								} else {
										http_response_code(404);
										print "Cannot get item id '$id' as it does not exist.";
								}
								mysqli_free_result($result);
				break;
								
						case 'name':
						case 'query':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/{table}/name/{name}
								// Get a record given its name
								if (count($request) < 2) {
												http_response_code(400);
												print "Incomplete REST query.";
												exit;
								}
								$name = $request[1];
								$result = $conn->query("SELECT value FROM $table WHERE name='$name'");
								if ($row = mysqli_fetch_object($result)) {
										print $row->value;
								} else if ($action == 'name') {
										http_response_code(404);
										print "Cannot get item named '$name' as it does not exist.";
								}
				break;
								
						default:
								http_response_code(404);
								print "I don't understand this request.";
								break;
						}
		}
		
		/////////////////////////////////////////////////////////////////////////
		// POST
		function post($conn, $table, $request) {
				$ts = time();
				$action = $request[0];
				switch ($action) {
						case 'set':
								// Set the value of a record
								if (count($request) > 2) {
										switch ($request[1]) {
												case 'id':
														// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/set/{table}/id/{id}
														// Set by id. The record must already exist
														header("Content-Type: application/text");
														$value = stripslashes(file_get_contents("php://input"));
														$id = $request[2];
														// See if there's an item with this id
														$result = $conn->query("SELECT id FROM $table WHERE id=$id");
														if (mysqli_fetch_object($result)) {
																// It exists, so update it
																$value = urldecode($value);
																logger("UPDATE $table SET value='$value',ts=$ts WHERE id=$id");
																query($conn, "UPDATE $table SET value='$value',ts=$ts WHERE id=$id");
														} else {
																// Not found
																http_response_code(404);
																logger("{\"code\":\"404\",\"message\":\"Cannot set record $id of $table.\"}");
																print "{\"message\":\"Cannot set record $id of $table.\"}";
														}
														mysqli_free_result($result);
														break;
														
												case 'name':
														// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/set/{table}/name/{name}
														// Set by name. If the record does not exist, add it
														header("Content-Type: application/text");
														$value = stripslashes(file_get_contents("php://input"));
														$name = $request[2];
														// See if there's an item with this name
														$result = $conn->query("SELECT id FROM $table WHERE name='$name'");
														if (mysqli_fetch_object($result)) {
																// It exists, so update it
																query($conn, "UPDATE $table SET value='$value',ts=$ts WHERE name='$name'");
														} else {
																// Add a new item
																query($conn, "INSERT INTO $table (name,value,ts) VALUES ('$name','$value','$ts')");
																http_response_code(201);
														}
														mysqli_free_result($result);
														break;
														
												default:
														http_response_code(400);
														print "{\"message\":\"Value '".$request[1]."' should be 'id' or 'name'.\"}";
														break;
										}
								} else {
										http_response_code(400);
										print "{\"message\":\"Incomplete REST query.\"}";
								}
								break;
								
						case 'delete':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/{table}/delete/{id}
								// Or: .../rest.php/table/delete/{name}
								// Delete a record, by id or by name
								if (count($request) > 1) {
										$item = $request[1];
										if (is_int($item)) {
												// Delete the requested id
												query($conn, "DELETE FROM $table WHERE id=$id");
										} else {
												// Delete the named item
												query($conn, "DELETE FROM $table WHERE name='$item'");
										}
								}
								break;
								
						case 'rename':
								// Endpoint: {site root}/wp-content/plugins/easycoder/rest.php/{table}/rename
								// Rename a record
								$value = $_POST['value'];
								$id = $_POST['id'];
								if (!$id && count($request) > 1) {
										$id = $request[1];
								}
								if ($id) {
										query($conn, "UPDATE $table SET name='$name',value='$value' WHERE id=$id");
								} else {
										$name = $_POST['name'];
										$newname = $_POST['newname'];
										// See if there's a data item with the new name
										$result = $conn->query("SELECT id FROM $table WHERE name='$newname'");
										if ($row = mysqli_fetch_object($result)) {
												// Conflict
												http_response_code(409);
												print "{\"message\":\"Cannot rename item '$name' to '$newname' as it already exists.\"}";
										} else {
												// See if there's a data item with this name
												$result = $conn->query("SELECT id FROM $table WHERE name='$name'");
												if ($row = mysqli_fetch_object($result)) {
														// There's a data item to rename
														$id = $row->id;
														query($conn, "UPDATE $table SET name='$newname',value='$value' WHERE id=$id");
												} else {
														// Not found
														http_response_code(404);
														print "{\"message\":\"Cannot rename item '$name' as it does not exist.\"}";
												}
										}
										mysqli_free_result($result);
								}
								break;
								
						default:
								http_response_code(404);
								print "{\"message\":\"Unrecognised action '$action' requested.\"}";
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
