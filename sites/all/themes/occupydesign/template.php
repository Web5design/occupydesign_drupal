<?php

// Include preprocessing functions
include('occupydesign.preprocess.inc');

/**
 * Implements hook_form_alter().
 */
function occupydesign_form_alter(&$form, &$form_state, $form_id) {
  // Add appropriate title for search form
  if ($form_id == 'search_block_form') {
    $form['search_block_form']['#title'] = '';
    unset($form['search_block_form']['#title_display']);
    // HTML5 placeholder attribute
    $form['search_block_form']['#attributes']['placeholder'] = t('SEARCH');
  }
}

function occupydesign_form_system_theme_settings_alter(&$form, $form_state) {
  $form['occupydesign'] = array(
    '#type'          => 'textfield',
    '#title'         => t('Widget'),
    '#default_value' => theme_get_setting('sitename'),
    '#description'   => t("Site name"),
  );
}