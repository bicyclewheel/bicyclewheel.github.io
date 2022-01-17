
// Add a forEach function (for IE compatibility)
if (typeof Array.prototype.forEach != 'function') {
  Array.prototype.forEach = function(callback){
    for (var i = 0; i < this.length; i++){
      callback.apply(this, [this[i], i, this]);
    }
  };
}

/* -------------------------------- CONSTANTS -------------------------------- **
**
** --------------------------------------------------------------------------- */

// PRODUCTION API
var API_ENDPOINT = 'https://2fihr40x10.execute-api.us-east-2.amazonaws.com/default/bike-wheel-api/'

// DEVELOPMENT API
// var API_ENDPOINT = 'https://2fihr40x10.execute-api.us-east-2.amazonaws.com/default/bike-wheel-api-dev/'

/* --------------------------- SESSION VARIABLES -------------------------- **
**
** ------------------------------------------------------------------------ */

var calc_result = false;

/* --------------------------- DEFINE FUNCTIONS --------------------------- **
**
** ------------------------------------------------------------------------ */

/* ------------------------- WHEEL CALC FUNCTIONS ------------------------- */
function calc_spoke_vector(wheel, side) {
  // Calculate spoke vector for side = 'ds' or 'nds'

  if (side == 'ds' | side == 'nds') {

    // Drive-side spoke vector
    var theta_h = 4*Math.PI/wheel['spokes_' + side]['num'] * wheel['spokes_' + side]['num_cross'];
    var n_1 = wheel['hub']['width_' + side];
    var n_2 = wheel['rim']['radius'] - wheel['hub']['diameter']/2*Math.cos(theta_h);
    var n_3 = wheel['hub']['diameter']/2*Math.sin(theta_h);
    var l = Math.sqrt(Math.pow(n_1, 2) + Math.pow(n_2, 2) + Math.pow(n_3, 2));

    return [n_1/l, n_2/l, n_3/l, l];

  } else {
    return false;
  }
}

function calc_tension_ratio(wheel) {
  // Calculate spoke tension ratio, T_ds / T_nds
  var n_ds = calc_spoke_vector(wheel, 'ds');
  var n_nds = calc_spoke_vector(wheel, 'nds');

  return n_nds[0] / n_ds[0];
}

function calc_average_tension(wheel) {
  // Calculate average radial tension
  var n_ds = calc_spoke_vector(wheel, 'ds');
  var n_nds = calc_spoke_vector(wheel, 'nds');

  return wheel['spokes_ds']['tension']/2 * (n_ds[1] + n_nds[1]*(n_ds[0]/n_nds[0]));
}

function calc_P_sb_lat() {
  // Maximum force before spokes buckle

  var n_ds = calc_spoke_vector(calc_result['wheel'], 'ds');
  var n_nds = calc_spoke_vector(calc_result['wheel'], 'nds');

  var Ks_ds = (calc_result['wheel']['spokes_ds']['young_mod']*
               Math.PI/4.*Math.pow(calc_result['wheel']['spokes_ds']['diameter'], 2) /
               n_ds[3]);
  var Ks_nds = (calc_result['wheel']['spokes_nds']['young_mod']*
                Math.PI/4.*Math.pow(calc_result['wheel']['spokes_nds']['diameter'], 2) /
                n_nds[3]);

  K_lat = calc_result['stiffness']['lateral_stiffness'];

  return Math.min(K_lat*calc_result['wheel']['spokes_ds']['tension']/(Ks_ds*n_ds[0]),
                  K_lat*calc_result['wheel']['spokes_nds']['tension']/(Ks_nds*n_nds[0]));
}

function calc_P_sb_rad() {
  // Maximum force before spokes buckle

  var n_ds = calc_spoke_vector(calc_result['wheel'], 'ds');
  var n_nds = calc_spoke_vector(calc_result['wheel'], 'nds');

  var Ks_ds = (calc_result['wheel']['spokes_ds']['young_mod']*
               Math.PI/4.*Math.pow(calc_result['wheel']['spokes_ds']['diameter'], 2) /
               n_ds[3]);
  var Ks_nds = (calc_result['wheel']['spokes_nds']['young_mod']*
                Math.PI/4.*Math.pow(calc_result['wheel']['spokes_nds']['diameter'], 2) /
                n_nds[3]);

  K_rad = calc_result['stiffness']['radial_stiffness'];

  return Math.min(K_rad*calc_result['wheel']['spokes_ds']['tension']/(Ks_ds*n_ds[1]),
                  K_rad*calc_result['wheel']['spokes_nds']['tension']/(Ks_nds*n_nds[1]));
}

/* ------------------------- UI UTILITY FUNCTIONS ------------------------- */
function load_rim_preset(name) {
  // Load a specified rim preset
  if (name != 'Custom') {
    var rim = RIM_PRESETS[name];

    $('#rimMatl').val(rim['matl']);
    $('#rimSize').val(rim['size']);
    $('#rimMass').val(rim['mass']).trigger('change');
    $('#rimRadStiff').val(rim['EIrad']).trigger('change');
    $('#rimLatStiff').val(rim['EIlat']).trigger('change');
    $('#rimTorStiff').val(rim['GJ']).trigger('change');
  }
}

function initForcesTable() {
  // Make force table editable
  $('#tableForces').editableTableWidget();

  // Remove row callback
  $('.remove-row').click(function() {
    $(this).parent().parent().remove();
  });

  // Change force type callback
  $('.force-type').click(function() {
    i_new = (FORCE_TYPES.indexOf($(this).text().trim()) + 1) % 3;
    $(this).html(FORCE_TYPES[i_new] + ' <i class="fas fa-angle-double-down"></i>');
  });
}

function addForce(dof, loc, mag) {
  $('#tableForces tr:last').before('<tr><th class="force-type text-nowrap">' + dof +
                                   ' <i class="fas fa-angle-double-down"></i></th>' +
                                   '<td>' + loc.toString() + '</td>' +
                                   '<td>' + mag.toString() + '</td>' +
                                   '<th><a class="remove-row" href="#"><i class="fas fa-trash-alt"></i></a></th></tr>');

  // Re-initialize to add callbacks to new row
  initForcesTable();
}

function initAdjustTable() {
  // Make adjustments table editable
  $('#tableAdjust').editableTableWidget();

  // Remove row callback
  $('.remove-row').click(function() {
    $(this).parent().parent().remove();
  });
}

function addAdjust(spk, mag) {
  $('#tableAdjust tr:last').before('<tr><td>' + spk.toString() + '</td>' +
                                   '<td>' + mag.toString() + '</td>' +
                                   '<th><a class="remove-row" href="#"><i class="fas fa-trash-alt"></i></a></th></tr>');

  // Re-initialize to add callbacks to new row
  initAdjustTable();
}

function reset_calc_button() {
  $('#btnPressMe').text('Calculate');
  $('#btnPressMe').removeClass('disabled');
}

function reset_calc_button() {
  $('#btnPressMe').text('Calculate');
  $('#btnPressMe').removeClass('disabled');
}

function display_error(title, text) {
  var div_text = '<div class="alert alert-danger alert-dismissible fade show" role="alert">';

  div_text += '<strong>' + title + '</strong>';

  if (text || false) {
    div_text += ': ' + text;
  }

  div_text += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
  div_text += '<span aria-hidden="true">&times;</span></button></div>';

  $('#alerts').append(div_text);
}

/* ---------------------- FORM PROCESSING FUNCTIONS ----------------------- */
function build_json_rim() {
  // Build JSON request object to send to wheel-api

  var rimForm = {};
  var rimJSON = {};

  // Load form data
  $('#formRim').serializeArray().forEach(function(e) { rimForm[e['name']] = e['value']; });

  // ISO diameter
  rimJSON['radius'] = 0.001*(parseFloat(/\((\d+)\)/g.exec(rimForm['rimSize'])[1])/2 - 5);

  // Material
  rimJSON['density'] = RIM_MATLS[rimForm['rimMatl']]['density'];
  rimJSON['young_mod'] = RIM_MATLS[rimForm['rimMatl']]['young_mod'];
  rimJSON['shear_mod'] = RIM_MATLS[rimForm['rimMatl']]['shear_mod'];

  // Section properties
  rimJSON['section_type'] = 'general';
  rimJSON['section_params'] = {
    'area': 0.001*parseFloat(rimForm['rimMass']) / (rimJSON['density'] * 2*3.1415*rimJSON['radius']),
    'I_rad': parseFloat(rimForm['rimRadStiff']) / rimJSON['young_mod'],
    'I_lat': parseFloat(rimForm['rimLatStiff']) / rimJSON['young_mod'],
    'J_tor': parseFloat(rimForm['rimTorStiff']) / rimJSON['shear_mod'],
    'I_warp': 0.
  };

  return rimJSON;
}

function build_json_hub() {

  var form = {};
  var json = {};

  // Load form data
  $('#formHub').serializeArray().forEach(function(e) { form[e['name']] = e['value']; });

  json['diameter'] = 0.001*parseFloat(form['hubDiameter']);
  json['width_ds'] = 0.001*parseFloat(form['hubWidthRight']);
  json['width_nds'] = 0.001*Math.abs(parseFloat(form['hubWidthLeft']));

  return json;
}

function build_json_spokes(form_obj) {

  var form = {};
  var json = {};

  // Load form data
  form_obj.serializeArray().forEach(function(e) { form[e['name']] = e['value']; });

  // Pattern
  if (form['spkPattern'] == 'Radial') {
    json['num_cross'] = 0;
  } else {
    json['num_cross'] = parseInt(form['spkPattern'].substring(0, 1));
  }

  // Material
  json['density'] = SPK_MATLS[form['spkMatl']]['density'];
  json['young_mod'] = SPK_MATLS[form['spkMatl']]['young_mod'];

  json['diameter'] = 0.001*parseFloat(form['spkDiam']);
  json['offset'] = 0.;
  json['tension'] = parseFloat(form['spkTens']) * 9.81;  // Newtons (from kgf)

  return json;
}

function build_json_wheel() {

  var json = {};

  json['rim'] = build_json_rim();
  json['hub'] = build_json_hub();

  var dsJSON = build_json_spokes($('#formSpokesDS'));
  var ndsJSON = build_json_spokes($('#formSpokesNDS'));

  dsJSON['num'] = parseInt($('#spkNum').val())/2;
  ndsJSON['num'] = parseInt($('#spkNum').val())/2;

  json['spokes_ds'] = dsJSON;
  json['spokes_nds'] = ndsJSON;

  // Set NDS spoke tension to precise value
  T_ratio = calc_tension_ratio(json)
  json['spokes_nds']['tension'] = json['spokes_ds']['tension'] / T_ratio

  return json;
}

function build_json_forces() {

  var dofs = {'Radial': 'f_rad', 'Lateral': 'f_lat', 'Tangential': 'f_tan'};
  var json = [];

  var dof; var loc; var mag; var f;
  $('#tableForces > tbody > tr').not(':first').not(':last').each(function() {
    dof = $(this).find('th:first').text().trim();
    loc = $(this).find('td:first').text();
    mag = $(this).find('td:last').text();

    f = {'location': parseFloat(loc)*Math.PI/180.};  // Convert [deg] -> [rad]
    f[dofs[dof]] = 9.81*parseFloat(mag);             // Convert [kgf] -> [N]

    json.push(f);
  })

  return json;
}

function build_json_adjust() {

  var json = [];

  var spk; var mag; var f;
  $('#tableAdjust > tbody > tr').not(':first').not(':last').each(function() {
    spk = $(this).find('td:first').text();
    mag = $(this).find('td:last').text();

    f = {'spoke': parseInt(spk)-1,
         'adjustment': parseFloat(mag)*0.0254/56.};

    json.push(f);
  })

  return json;
}

function update_results() {

  // Clear previous errors and warnings
  $('#alerts').html('');

  // Clear table
  $("#resultsTable > tbody").empty();

  // Disable "Calculate" button
  $('#btnPressMe').text('Please wait...');
  $('#btnPressMe').addClass('disabled');

  var post_data = {
    'wheel': build_json_wheel(),
    'tension': {
      'forces': build_json_forces(),
      'spoke_adjustments': build_json_adjust()
    },
    'deformation': {
      'forces': build_json_forces(),
      'spoke_adjustments': build_json_adjust(),
      'theta_range': [0., 2*Math.PI, 100]
    },
    'mass': {'empty': 0},
    'stiffness': {'empty': 0},
    'buckling_tension': {'approx': 'linear'}
  };

  console.log(post_data);

  $.post({
    url: API_ENDPOINT,
    data: JSON.stringify(post_data),
    dataType: 'json',
    contentType: 'application/json',
    success: function (result) {
      calc_result = result;
      console.log(calc_result);

      if (!calc_result['tension']['success']) {
        display_error('Error calculating tensions', calc_result['tension']['error']);
      }
      
      if (!calc_result['deformation']['success']) {
        display_error('Error calculating deformation', calc_result['deformation']['error']);
      }

      if (calc_result['deformation']['success'] && calc_result['deformation']['success']) {

        // Check if tension exceeds buckling tension
        if (calc_average_tension(calc_result['wheel']) >= 0.95*calc_result['buckling_tension']['buckling_tension']) {
          display_error('Warning', 'Average tension is close to or greater than maximum tension. Results may be innacurate.');
        }

        // Check if any spoke tensions are negative
        if (calc_result['tension']['tension'].some(function(e) {return e < 0})) {
          display_error('Warning', 'At least one spoke has negative tension. Tension and deformation results may not be accurate.');
        }

        update_plot();

      }

      show_summary();
      reset_calc_button();
    },
    error: function (xhr, ajaxOptions, thrownError) {
      reset_calc_button();
      display_error('AJAX error');
      console.log(thrownError);
    }
  });
}

function update_plot() {

  if ($('#tabTension').hasClass('active')) {
    // Plot spoke tensions
    var tension_plot_type = $('#tensionPlotType').find(':checked').parent().text().trim().toLowerCase()
    var tension_diff = $('#tensionDiff').find(':checked').parent().text().trim().toLowerCase()

    plot_tensions(tension_plot_type, tension_diff);
  } else {
    // Plot deformation
    var deform_plot_type = $('#deform-plot-type').find(':checked').parent().text().trim().toLowerCase()

    plot_deformation(deform_plot_type);
  }

}

function show_summary() {

  // Mass properties
  var mass = calc_result['mass'];
 
  if (mass['success']) {

    $('#sumMassGrams').html((1000*mass['mass']).toFixed(0) + ' grams');
    $('#sumMassLbs').html('(' + (2.20462*mass['mass']).toFixed(2) + ' lbs)');

    $('#sumMassRotGrams').html(Math.round(1000*mass['mass_rotational']).toString() + ' grams');
    $('#sumMassRotLbs').html('(' + (2.20462*mass['mass_rotational']).toFixed(2) + ' lbs)');

  } else {
    display_error('Error calculating mass', calc_result['mass']['error']);
  }

  // Stiffness properties
  var stiff = calc_result['stiffness'];

  if (stiff['success']) {

    $('#sumStiffRadSI').html((0.001*stiff['radial_stiffness']).toFixed(0) + ' N/mm');
    $('#sumStiffRadLbs').html('(' + (0.224809*0.0254*stiff['radial_stiffness']).toFixed(0) + ' lbs/in)');

    $('#sumStiffLatSI').html((0.001*stiff['lateral_stiffness']).toFixed(1) + ' N/mm');
    $('#sumStiffLatLbs').html('(' + (0.224809*0.0254*stiff['lateral_stiffness']).toFixed(0) + ' lbs/in)');

    $('#sumStiffTorSI').html((Math.PI/180.*stiff['torsional_stiffness']).toFixed(0) + ' N/deg');
    $('#sumStiffTorLbs').html('(' + (Math.PI/180.*0.224809*stiff['torsional_stiffness']).toFixed(0) + ' lbs/deg)');

    // 'Strength' properties
    var P_sb_lat = calc_P_sb_lat();
    $('#sumForceLatSI').html((P_sb_lat/9.81).toFixed(1) + ' kgf');
    $('#sumForceLatLbs').html('(' + (2.20462*P_sb_lat/9.81).toFixed(1) + ' lbs)');

    var P_sb_rad = calc_P_sb_rad();
    $('#sumForceRadSI').html((P_sb_rad/9.81).toFixed(1) + ' kgf');
    $('#sumForceRadLbs').html('(' + (2.20462*P_sb_rad/9.81).toFixed(1) + ' lbs)');

  } else {
    display_error('Error calculating stiffness', stiff['error']);
  }

  // Tension properties
  var tens = calc_result['buckling_tension']

  if (tens['success']) {
    var T_ds = calc_result['wheel']['spokes_ds']['tension']/9.81;  // Convert N -> kgf
    $('#sumTensDSSI').html((T_ds).toFixed(0) + ' kgf');
    $('#sumTensDSLbs').html('(' + (2.20462*T_ds).toFixed(2) + ' lbs)');

    var T_nds = calc_result['wheel']['spokes_nds']['tension']/9.81;  // Convert N -> kgf
    $('#sumTensNDSSI').html((T_nds).toFixed(0) + ' kgf');
    $('#sumTensNDSLbs').html('(' + (2.20462*T_nds).toFixed(2) + ' lbs)');

    var T_avg = calc_average_tension(calc_result['wheel']) / 9.81; // Convert N -> kgf
    $('#sumTensAvgSI').html((T_avg).toFixed(0) + ' kgf');
    $('#sumTensAvgLbs').html('(' + (2.20462*T_avg).toFixed(2) + ' lbs)');

    $('#sumTensMaxSI').html((tens['buckling_tension']/9.81).toFixed(0) + ' kgf');
    $('#sumTensMaxLbs').html('(' + (2.20462/9.81*tens['buckling_tension']).toFixed(2) + ' lbs)');
  }
}


/* ---------------------------- INITIALIZE GUI ---------------------------- **
**
** ------------------------------------------------------------------------ */

$(function() {

  // Update value labels for all range sliders with class .update-range
  $('input.update-range').on('change input', function() {
    $(this).prev().html('<strong>' + $(this).val() + '</strong>');
  });


  /* ----------------------------- HUB PANEL ------------------------------ */
  // Update value labels for hub width range sliders
  $('#hubWidthLeft').on('change input', function() {
    $('#hubWidthLeft_label').html('<strong>' + (-parseInt($(this).val())).toString() + '</strong>');

    // If symmetric, update the other one to match
    if ($('#hubSymm').prop('checked')) {
      $('#hubWidthRight').val(-parseInt($(this).val()));
      $('#hubWidthRight_label').html('<strong>' + (-parseInt($(this).val())).toString() + '</strong>');
    }

    // Re-calculate NDS spoke tension
    $('#spkTens').trigger('change')

  });

  $('#hubWidthRight').on('change input', function() {
    $('#hubWidthRight_label').html('<strong>' + $(this).val() + '</strong>');

    // If symmetric, update the other one to match
    if ($('#hubSymm').prop('checked')) {
      $('#hubWidthLeft').val(-parseInt($(this).val()));
      $('#hubWidthLeft_label').html('<strong>' + (parseInt($(this).val())).toString() + '</strong>');
    }

    // Re-calculate NDS spoke tension
    $('#spkTens').trigger('change')

  });

  // Force hub symmetry if "Symmetric" is checked
  $('#hubSymm').change(function() {
    if ($(this).prop('checked')) {
      $('#hubWidthLeft').val(-parseInt($('#hubWidthRight').val()));
      $('#hubWidthLeft_label').html('<strong>' + (parseInt($('#hubWidthRight').val())).toString() + '</strong>');
    }

    // Re-calculate NDS spoke tension
    $('#spkTens').trigger('change')

  });


  /* ----------------------------- RIM PANEL ------------------------------ */
  // Populate rim presets dropdown
  for (var key in RIM_PRESETS) {
    $('#rimPreset').append('<option value="' + key + '">' + key + '</option>');
  }

  // Populate rim material dropdown
  for (var key in RIM_MATLS) {
    $('#rimMatl').append('<option value="' + key + '">' + key + '</option>');
  }

  // Populate rim size dropdown
  for (var i=0; i < RIM_SIZES.length; i++) {
    var size = RIM_SIZES[i]
    $('#rimSize').append('<option value="' + size + '">' + size + '</option>');
  }

  // Set rim preset on select
  $('#rimPreset').change(function() {
    load_rim_preset($('#rimPreset').val());
  });

  // Set rim preset to "Custom" if any fields are changed
  $('.rim-input').click(function() {
    $('#rimPreset').val('Custom');
  });

  // Set default rim preset
  $('#rimPreset').val('Sun-Ringle CR18 700C, 36h').trigger('change');


  /* ---------------------------- SPOKES PANEL ---------------------------- */
  // Populate spoke material dropdowns
  for (var key in SPK_MATLS) {
    $('#spkMatl').append('<option value="' + key + '">' + key + '</option>');
    $('#spkMatlNDS').append('<option value="' + key + '">' + key + '</option>');
  }

  // Show or hide the non-drive-side spoke panel
  $('#spkNDSSame').click(function() {
    if ($('#spkNDSSame').is(':checked')) {
      $('#spkNDSPanel').collapse('hide');

      // Reset NDS values to match
      $('.spokes-ds').each(function() {
        $('#' + $(this).prop('id') + 'NDS').val($(this).val()).trigger('change');
      })
    } else {
      $('#spkNDSPanel').collapse('show');
    }
  });

  // Set NDS properties if any DS properties are changed and 'Same' is checked
  $('.spokes-ds').on('change', function() {
    if ($('#spkNDSSame').is(':checked')) {
      $('#' + $(this).prop('id') + 'NDS').val($(this).val()).trigger('change');
    }
  });

  // Set spoke tension based on tension ratio
  $('#spkTens').on('change input', function() {
    var w = build_json_wheel();
    var T_ratio = calc_tension_ratio(w)
    $('#spkTensNDS').val($(this).val() / T_ratio)
    $('#spkTensNDS').prev().html('<strong>' + $('#spkTensNDS').val() + '</strong>');
  });
  $('#spkTensNDS').on('change input', function() {
    var w = build_json_wheel();
    var T_ratio = calc_tension_ratio(w)
    $('#spkTens').val($(this).val() * T_ratio)
    $('#spkTens').prev().html('<strong>' + $('#spkTens').val() + '</strong>');
  });

  // Set default spoke material
  $('#spkMatl').val('Steel').trigger('change');


  /* ---------------------------- FORCES PANEL ---------------------------- */
  // Populate force presets dropdown
  for (var key in FORCE_PRESETS) {
    $('#forcePresetDropdown').append('<a class="dropdown-item btn-sm force-preset" href="#">' + key + '</a>');
  }

  // Select a force preset
  $('.force-preset').click(function() {
    forces = FORCE_PRESETS[$(this).text()];
    for (var i=0; i < forces.length; i++) {
      addForce(forces[i]['dof'],
               forces[i]['loc'],
               forces[i]['mag']);
    }
  });

  // Add row to forces table
  $('.add-force').click(function() {
    addForce('Radial', 0, 0)
  });

  // Add row to adjustments table
  $('.add-adjust').click(function() {
    addAdjust(1, 0)
  });

  // Make the forces table editable
  initForcesTable();
  initAdjustTable();


  /* ---------------------------- RESULT PANEL ---------------------------- */

  $('#plotTabs a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    update_plot();
  })

  // Show scale factor as a percent
  $('#scaleFactor').on('change input', function() {
    $(this).prev().html('<strong>' + $(this).val() + '%</strong>');
  });

  // Re-plot deformation when scale factor is changed
  $('#scaleFactor').on('change', function() {
    update_plot();
  });

  // Toggle deformation components
  $('.deform-button').click(function() {
    $(this).toggleClass('active');
    update_plot();
  });

  // Tension plot options
  $("#tensionPlotType :input").change(function() {
    if ($('#tensionPlotType').find(':checked').parent().text().trim().toLowerCase() == 'column') {
      $('#tensionDiff').removeClass('d-none')
    } else {
      $('#tensionDiff').addClass('d-none')
    }
    update_plot();
  });

  $("#tensionDiff :input").change(function() {
    update_plot();
  });

  // Deformation plot options
  $("#deform-plot-type :input").change(function() {
    update_plot();
  });

  /* -------------------------- CALCULATE BUTTON -------------------------- */
  // Work the magic!
  $('#btnPressMe').on('click', function() {
    update_results();
  });

  // Calculate initial results
  update_results();

});
