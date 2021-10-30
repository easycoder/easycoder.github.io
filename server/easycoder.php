<?php
  /**
  * Plugin Name: EasyCoder
  * Plugin URI: https://easycoder.software
  * Description: Control the appearance and behavior of your posts and pages by embedding simple English-like scripts, without the need to learn JavaScript.
  * Version: 2.7.8
  * Author: EasyCoder Software
  * Author URI: https://easycoder.software
  */
  // Exit if accessed directly
  if ( ! defined( 'ABSPATH' ) ) {
   exit;
  }
  
  // The EasyCoder library
  add_action('wp_enqueue_scripts', 'easycoder_enqueue_script', 2);
  function easycoder_enqueue_script() {  
    wp_enqueue_script('easycoder_script',
      'https://cdn.jsdelivr.net/gh/easycoder/easycoder.github.io/dist/easycoder.js', array(), '2.7.8');
  }
  
  // Set up default plugin and REST scripts
  add_action('init', 'setup_default_files', 1 );
  function setup_default_files() {
    $pluginDir = plugin_dir_path( __FILE__ );
    
    mkdir(ABSPATH . 'easycoder');
    if (!file_exists(ABSPATH . 'easycoder/rest-local.php')) {
      copy($pluginDir . 'rest-local-sample.php', ABSPATH . 'easycoder/rest-local.php');
    }
  }

?>