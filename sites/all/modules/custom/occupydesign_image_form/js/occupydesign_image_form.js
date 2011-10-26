document.namespaces;
(function($) {

Drupal.settings.occupydesign_image_form = {};

Drupal.behaviors.occupydesign_image_form = {
  'attach': function(context, settings) {
      Drupal.settings.occupydesign_image_form.data = $('div.openlayers-map').data('openlayers');
      Drupal.settings.occupydesign_image_form.centerOnFeature();
    }
  };

  // When going through prompts, click through to the next tab.
  $('input#edit-field-prepare-und').click(function(){
    $('ul.vertical-tabs-list li:eq(1) a').trigger('click');
    $(this).parent().toggleClass('checked');
  });

  $('input#edit-field-privacy-und').click(function(){
    $('ul.vertical-tabs-list li:eq(2) a').trigger('click');
    $(this).parent().toggleClass('checked');
  });
  
  
  $('div.form-type-checkbox').click(function(){
    $(this).toggleClass('checked');
  });
  
  
  $('fieldset.group-prepare div.fieldset-description').after($('div.field-name-field-prepare div.description'));
  $('fieldset.group-privacy div.fieldset-description').after($('div.field-name-field-privacy div.description'));

  var geocodedAddressResults;
  
  // Autoload existing address.
  $('div.map-instructions-container div.address-ajax input#search-map-input').val($('textarea#edit-field-address-und-0-value').val());
  $('div.map-instructions-container div.address-ajax input.search_btn').click(function () {
  Drupal.settings.occupydesign_image_form.geocodeAddress();
  return false;
 });



var geocoder;
geocoder = new google.maps.Geocoder();

Drupal.settings.occupydesign_image_form.geocodeAddress = function (){
    var inputValue = $('div.map-instructions-container div.address-ajax input#search-map-input').val();
    //console.log(inputValue);
    Drupal.settings.occupydesign_image_form.codeAddress(inputValue);
};

Drupal.settings.occupydesign_image_form.codeAddress = function(address) {
  var result =  geocoder.geocode( { 'address': address}, function(results, status) {
    if (status == google.maps.GeocoderStatus.OK) {
       Drupal.settings.occupydesign_image_form.mapGeocodedData(results);
    } 
    else {
      alert("Unable to find that location. Be sure to enter the City, State or Zipcode along with your address.");
    }
  });
  return result;
}

Drupal.settings.occupydesign_image_form.mapGeocodedData = function(results) {
  var result = {};
  result.field_address = '';
 // console.log(results);
  var item = results[0]['address_components'];

  for (i in item) {     
    switch(item[i]["types"][0]) {
      case 'street_number':
        result.field_address += item[i]["long_name"] + " ";
        break;
      case 'route':
        result.field_address += item[i]["long_name"];
        break;
      case 'locality':
        result.field_city = item[i]["long_name"];
        break;  
      case 'administrative_area_level_1':
        result.field_state = item[i]["short_name"];
        break;  
      case 'postal_code':
        result.field_zipcode = item[i]["long_name"];
        break;
    }
    
    // map geometry
    // console.log(results[0]);
    result.latitude = results[0]["geometry"]["location"].lat();
    result.longitude = results[0]["geometry"]["location"].lng();
  }
  Drupal.settings.occupydesign_image_form.updateMapForm(result);
};
    
Drupal.settings.occupydesign_image_form.updateMapForm = function(result) {
  // @TODO use values from geofield instead (data_form)

  if((result.field_address !== undefined) && (result.field_address !== '')) {
    $('textarea#edit-field-address-und-0-value').val(result.field_address);
  }
  if(result.field_zipcode !== undefined) {
    $('input#edit-field-zipcode-und').val(result.field_zipcode);
  }
  if(result.field_city !== undefined) {
    $('input#edit-field-city-und').val(result.field_city);
  }
  if(result.field_state !== undefined) {
    $('input#edit-field-state-und').val(result.field_state);
  }
  if(result.latitude !== undefined) {
    $('input#geofield_lat').val(result.latitude);
  } 
  if(result.longitude !== undefined) {
    $('input#geofield_lon').val(result.longitude);
  } 
  
  Drupal.settings.occupydesign_image_form.openLayersDropPoint(result);
};

Drupal.settings.occupydesign_image_form.openLayersDropPoint = function(result){
  // Get map data.
  var data = Drupal.settings.occupydesign_image_form.data;
  if(result.longitude !== undefined && result.latitude !== undefined) {    
    var center = new OpenLayers.LonLat(result.longitude, result.latitude).transform(
            new OpenLayers.Projection('EPSG:4326'),
            new OpenLayers.Projection(data.openlayers.projection.projCode));
    var zoomBlockLevel = 15;
    var zoomMultiBlock = 13;
    
    
    var myStyles = new OpenLayers.StyleMap({
              "default": new OpenLayers.Style({
                  pointRadius: "5", // sized according to type attribute
                  strokeColor: "#000000",
                  fillColor: "#00FFFF",
                  strokeWidth: 2,
                  fillOpacity: 0.8
              }),
              "select": new OpenLayers.Style({
                  strokeColor: "#000000",
                  fillColor: "#00FFFF",
              })
          });

    var feature = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(result.longitude, result.latitude).transform(
              new OpenLayers.Projection('EPSG:4326'),
              new OpenLayers.Projection(data.openlayers.projection.projCode)));
    var edit_feature_layer = data.openlayers.getLayersByName('Selection Layer')[0];

    for (var i = 0; i < edit_feature_layer.features.length; i++) {
      if (edit_feature_layer.features[i] != feature) {
        edit_feature_layer.features[i].destroy();
      }
    } 
    edit_feature_layer.addFeatures(feature);

  // Store the drawn feature in format compatible with geofield.
  Drupal.settings.occupydesign_image_form.setItem(feature);
    
  data.openlayers.setCenter(center, zoomBlockLevel, false, false);
  }
};

Drupal.settings.occupydesign_image_form.setItem = function(feature) {
  var data = Drupal.settings.occupydesign_image_form.data;
  if (data && data.map.behaviors['openlayers_behavior_geofield']) {
    geom = feature.clone().geometry.transform(
      feature.layer.map.projection,
      new OpenLayers.Projection('EPSG:4326'));
      
    centroid = geom.getCentroid();
    bounds = geom.getBounds();
    feature.layer.map.data_form.wkt.val(geom.toString());
    feature.layer.map.data_form.lat.val(centroid.x);      
    feature.layer.map.data_form.lon.val(centroid.y);
    feature.layer.map.data_form.left.val(bounds.left);
    feature.layer.map.data_form.top.val(bounds.top);
    feature.layer.map.data_form.bottom.val(bounds.bottom);
    feature.layer.map.data_form.right.val(bounds.right);
  }
};

Drupal.settings.occupydesign_image_form.centerOnFeature = function() {
  var data = Drupal.settings.occupydesign_image_form.data;

  // On load, center on the feature and zoom.
  // @TODO this is ignoring the openlayers preset for some reason. 
  var zoomBlockLevel = 15;
  var zoomMultiBlock = 13;
  
  /*
    var lat = $('input#geofield_lat').val();
    var lon = $('input#geofield_lon').val();
  */

  try {
    // Redraw feature with style.
    var myStyles = new OpenLayers.StyleMap({
              "default": new OpenLayers.Style({
                  pointRadius: "5", // sized according to type attribute
                  strokeColor: "#000000",
                  fillColor: "#00FFFF",
                  strokeWidth: 2,
                  fillOpacity: 0.8
              }),
              "select": new OpenLayers.Style({
                  strokeColor: "#000000",
                  fillColor: "#00FFFF",
              })
            });
    var edit_feature_layer = new OpenLayers.Layer.Vector("edit-feature", {
          styleMap: myStyles
      });

    edit_feature_layer.addFeatures(feature);
    data.openlayers.addLayers([edit_feature_layer]);

    // Center the map on the feature.
    var  geom = feature.clone().geometry.transform(
    feature.layer.map.projection,
    new OpenLayers.Projection('EPSG:4326'));
    
    // If feature exists, center on the default map center.    
    centroid = geom.getCentroid();
    var center = new OpenLayers.LonLat(centroid.x, centroid.y).transform(
            new OpenLayers.Projection('EPSG:4326'),
            new OpenLayers.Projection(data.openlayers.projection.projCode));

    data.openlayers.setCenter(center, false, false, false);
  }
  catch(e) {
    // If no feature, center on the default map center.
    var center = new OpenLayers.LonLat(Drupal.settings.javascript_settings['longitude'] * -1, Drupal.settings.javascript_settings['latitude']).transform(
          new OpenLayers.Projection('EPSG:4326'),
          new OpenLayers.Projection(data.openlayers.projection.projCode));
    data.openlayers.setCenter(center, false, false, false);
  }  
};




Drupal.verticalTab.prototype = {
  /**
   * Displays the tab's content pane.
   */
  focus: function () {
    this.fieldset
      .siblings('fieldset.vertical-tabs-pane')
        .each(function () {
          var tab = $(this).data('verticalTab');
          tab.fieldset.removeClass('selected-fieldset');
          tab.fieldset.addClass('deselected-fieldset');
/*           tab.fieldset.hide(); */
          tab.item.removeClass('selected');
        })
        .end()
/*       .show() */
      .addClass('selected-fieldset')
      .removeClass('deselected-fieldset')
      .siblings(':hidden.vertical-tabs-active-tab')
        .val(this.fieldset.attr('id'));
    this.item.addClass('selected');
    // Mark the active tab for screen readers.
    $('#active-vertical-tab').remove();
    this.link.append('<span id="active-vertical-tab" class="element-invisible">' + Drupal.t('(active tab)') + '</span>');
  },

  /**
   * Updates the tab's summary.
   */
  updateSummary: function () {
    this.summary.html(this.fieldset.drupalGetSummary());
  },

  /**
   * Shows a vertical tab pane.
   */
  tabShow: function () {
    // Display the tab.
    this.item.show();
    // Update .first marker for items. We need recurse from parent to retain the
    // actual DOM element order as jQuery implements sortOrder, but not as public
    // method.
    this.item.parent().children('.vertical-tab-button').removeClass('first')
      .filter(':visible:first').addClass('first');
    // Display the fieldset.
    this.fieldset.removeClass('vertical-tab-hidden').show();
    // Focus this tab.
    this.focus();
    return this;
  },

  /**
   * Hides a vertical tab pane.
   */
  tabHide: function () {
    // Hide this tab.
    this.item.hide();
    // Update .first marker for items. We need recurse from parent to retain the
    // actual DOM element order as jQuery implements sortOrder, but not as public
    // method.
    this.item.parent().children('.vertical-tab-button').removeClass('first')
      .filter(':visible:first').addClass('first');
    // Hide the fieldset.
    this.fieldset.addClass('vertical-tab-hidden').hide();
    // Focus the first visible tab (if there is one).
    var $firstTab = this.fieldset.siblings('.vertical-tabs-pane:not(.vertical-tab-hidden):first');
    if ($firstTab.length) {
      $firstTab.data('verticalTab').focus();
    }
    return this;
  }
};



})(jQuery);

