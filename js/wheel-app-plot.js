
var plot_canvas = document.getElementById('plotDiv');

const POLAR_LAYOUT = {
  margin: {
    l: 25, r: 25, t: 25, b: 25
  },
  legend: {
    orientation: 'h',
    xanchor: 'center',
    x: 0.5
  },
  polar: {
    angularaxis: {
      rotation: -90,
      showgrid: true,
      showticklabels: false,
      tickmode: 'linear',
      tick0: 0,
      ticks: ''
    },
    radialaxis: {
      angle: -90,
      showgrid: false,
      showticklabels: false,
      autorange: 'false',
      rangemode: 'tozero',
    }
  }
};

const BAR_LAYOUT = {
  margin: {
    l: 30, r: 30, t: 25, b: 25
  },
  legend: {
    orientation: 'h',
    xanchor: 'center',
    x: 0.5
  },
  xaxis: {
    tickmode: 'linear',
    tick0: 0,
    dtick: 1,
    ticks: 'outside',
    showticklabels: false,
  }
}

const LINE_LAYOUT = {
  margin: {
    l: 75, r: 30, t: 30, b: 30
  },
  legend: {
    orientation: 'h',
    xanchor: 'center',
    x: 0.5
  },
  xaxis: {
    ticks: 'outside',
    tickmode: 'linear',
    tick0: -180,
    dtick: 30,
    range: [-180, 180],
    showticklabels: false,
  },
  yaxis: {title: 'Deformation [mm]'},
}

function array_mult_scalar(x, a) {
  // Multiple each element in an array 'x' a scalar 'a'
  for (var i=0; i < x.length; i++) {
    x[i] *= a;
  }
  return x;
}

function array_add_scalar(x, a) {
  // Add a scalar 'a' to each element in an array 'x'
  for (var i=0; i < x.length; i++) {
    x[i] += a;
  }
  return x;
}

function array_shift(x, n) {
  // Shift the elements in x to the right by n places, with wrapping
  for (var i = 0; i < n; i++) {
    x.unshift(x.pop());
  }
}

function array_range(start, stop, stride) {
  var x = [];
  for (var i=start; i < stop; i+=stride) {
    x.push(i);
  }
  return x;
}

function remap_theta(theta) {
  var y = theta.slice();
  for (var i=0; i < theta.length; i++) {
    if (theta[i] >= 180.) {
      y[i] = theta[i] - 360.;
    }
  }
  return y;
}

function max_r_traces(traces) {
  // Find the maximum r value (for setting plot limits)
  var max_r = 0.;
  var new_max = 0.;
  for (var i=0; i<traces.length; i++) {
    new_max = Math.max.apply(null, traces[i]['r']);
    if (new_max > max_r) {
      max_r = new_max;
    }
  }
  return max_r;
}

function plot_tensions(plot_type, tension_diff) {

  var spk_num = parseInt($('#spkNum').val())

  var theta = array_mult_scalar(calc_result['tension']['spokes'].slice(),
                                360./parseFloat($('#spkNum').val()));
  var tension = array_mult_scalar(calc_result['tension']['tension'].slice(),
                                  1./9.81);
  var tension_0 = array_mult_scalar(calc_result['tension']['tension_initial'].slice(),
                                    1./9.81);
  var tension_d = array_mult_scalar(calc_result['tension']['tension_change'].slice(),
                                    1./9.81);

  // Separate traces for left and right spokes
  nds_ind = (spk_num/2) % 2
  var theta_nds = theta.filter(function(e, i) {return i%2 === nds_ind});
  var T_nds = tension.filter(function(e, i) {return i%2 === nds_ind});
  var T_0_nds = tension_0.filter(function(e, i) {return i%2 === nds_ind});
  var T_d_nds = tension_d.filter(function(e, i) {return i%2 === nds_ind});

  ds_ind = (spk_num/2 + 1) % 2
  var theta_ds = theta.filter(function(e, i) {return i%2 === ds_ind});
  var T_ds = tension.filter(function(e, i) {return i%2 === ds_ind});
  var T_0_ds = tension_0.filter(function(e, i) {return i%2 === ds_ind});
  var T_d_ds = tension_d.filter(function(e, i) {return i%2 === ds_ind});

  var layout;

  if (plot_type == 'polar') {

    var traces = [
      {
        name: 'Non-drive-side spokes',
        r: T_nds.concat(T_nds[0]),
        theta: theta_nds.concat(theta_nds[0]),
        type: 'scatterpolar',
        mode: 'lines+markers',
        line: {color: '#1f77b4'}
      },
      {
        r: T_0_nds.concat(T_0_nds[0]),
        theta: theta_nds.concat(theta_nds[0]),
        type: 'scatterpolar',
        mode: 'lines',
        showlegend: false,
        line: {color: '#1f77b4', shape: 'spline'},
        opacity: 0.5
      },
      {
        name: 'Drive-side spokes',
        r: T_ds.concat(T_ds[0]),
        theta: theta_ds.concat(theta_ds[0]),
        type: 'scatterpolar',
        mode: 'lines+markers',
        line: {color: '#ff7f0e'}
      },
      {
        r: T_0_ds.concat(T_0_ds[0]),
        theta: theta_ds.concat(theta_ds[0]),
        type: 'scatterpolar',
        mode: 'lines',
        showlegend: false,
        line: {color: '#ff7f0e', shape: 'spline'},
        opacity: 0.5
      }
    ]

    layout = $.extend({}, POLAR_LAYOUT);
    layout['polar']['angularaxis']['dtick'] = 360. / spk_num;
    layout['height'] = 450;

    layout['polar']['radialaxis']['range'] = [0., 1.02*max_r_traces(traces)];

    $('#tableDiv').collapse('hide')
    $('#plotDiv').collapse('show')
    Plotly.newPlot(plot_canvas, traces, layout, {
      responsive: true,
      modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
      displayModeBar: false,
      displaylogo: false
    });

  } else if (plot_type == 'column') {

    if (tension_diff == 'difference') {
      y_nds = T_d_nds;
      y_ds = T_d_ds;
    } else {
      y_nds = T_nds;
      y_ds = T_ds;
    }

    // Shift arrays to put spoke 1 in the middle
    array_shift(y_ds, spk_num/4)
    array_shift(y_nds, spk_num/4)

    var traces = [
      {
        name: 'Non-drive-side spokes',
        x: array_range(nds_ind, spk_num, 2),
        y: y_nds,
        type: 'bar',
        marker: {'color': '#1f77b4'}
      },
      {
        name: 'Drive-side spoke',
        x: array_range(ds_ind, spk_num, 2),
        y: y_ds,
        type: 'bar',
        marker: {'color': '#ff7f0e'}
      }
    ]

    layout = $.extend({}, BAR_LAYOUT);
    layout['height'] = Math.min(0.9 * $('#plotDiv').width(), 450);

    $('#tableDiv').collapse('hide')
    $('#plotDiv').collapse('show')
    Plotly.newPlot(plot_canvas, traces, layout, {
      responsive: true,
      modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
      displayModeBar: false,
      displaylogo: false
    });
  } else if (plot_type == 'table') {

    // Hide plot
    $('#plotDiv').collapse('hide')
    $('#tableDiv').collapse('show')

    // Check if table has any rows
    if ($('#resultsTable > tbody').children().length == 0) {
      // Add a test row
      for (var s=0; s < spk_num; s++) {

        $('#resultsTable > tbody:last-child').append('<tr><td>'+(s+1)+'</td>'+
                                                          '<td>'+tension_0[s].toFixed(1)+'</td>'+
                                                          '<td>'+(tension_d[s] > 0 ? '+' : '')+
                                                          tension_d[s].toFixed(1)+'</td>'+
                                                          '<td>'+tension[s].toFixed(1)+'</td></tr>')
      }
    }
  }

}

function plot_deformation(plot_type) {

  // Hide results table and show plot
  $('#plotDiv').collapse('show')
  $('#tableDiv').collapse('hide')

  var spk_num = parseInt($('#spkNum').val())
  var rim_radius = calc_result['wheel']['rim']['radius'];

  var theta = array_mult_scalar(calc_result['deformation']['theta'].slice(), 180./Math.PI);
  var ones = array_add_scalar(array_mult_scalar(theta.slice(), 0.), 1);  // THIS IS PROBABLY NOT EFFICIENT
  var def_rad = array_mult_scalar(calc_result['deformation']['def_rad'].slice(), 1000.);
  var def_lat = array_mult_scalar(calc_result['deformation']['def_lat'].slice(), 1000.);
  var def_tor = array_mult_scalar(calc_result['deformation']['def_tor'].slice(), 1000.*rim_radius);

  array_shift(theta, theta.length/2)
  array_shift(def_rad, def_rad.length/2)
  array_shift(def_lat, def_lat.length/2)
  array_shift(def_tor, def_tor.length/2)

  var traces_deform = {
    'Radial': {
      name: 'Radial',
      def: def_rad,
      def_max: Math.max.apply(null, def_rad.map(Math.abs)),
      line: {color: '#1f77b4', shape: 'spline'},
    },
    'Lateral': {
      name: 'Lateral',
      def: def_lat,
      def_max: Math.max.apply(null, def_lat.map(Math.abs)),
      line: {color: '#ff7f0e', shape: 'spline'},
    },
    'Twist': {
      name: 'Twist (R*phi)',
      def: def_tor,
      def_max: Math.max.apply(null, def_tor.map(Math.abs)),
      line: {color: '#2ca02c', shape: 'spline'},
    }
  };

  // Add selected traces to a new list
  var traces = [];
  var def_max = [];
  $('.deform-button').each(function() {
    if ($(this).hasClass('active')) {
      traces.push(traces_deform[$(this).text().trim()]);
      def_max.push(traces_deform[$(this).text().trim()]['def_max']);
    }
  });

  var layout;

  if (plot_type == 'polar') {

    // Invert radial deformation (negative = inwards)
    traces_deform['Radial']['def'] = array_mult_scalar(traces_deform['Radial']['def'], -1);

    // Calculate scaling factor
    var scale_factor = parseFloat($('#scaleFactor').val()) / 100. / Math.max.apply(null, def_max);

    // Apply scaling factor to each trace
    for (var t=0; t < traces.length; t++) {
      var tr = traces[t];
      tr['r'] = array_add_scalar(array_mult_scalar(tr['def'], scale_factor), 1.);
      tr['theta'] = theta.slice();

      // Connect trace to its endpoint
      tr['theta'].push(tr['theta'][0]);
      tr['r'].push(tr['r'][0]);

      // Line options
      tr['type'] = 'scatterpolar';
      tr['mode'] = 'lines';
      tr['showlegend'] = true;
    }

    // Add a gray reference circle
    var trace_unitcircle = [
      {
        r: ones.concat(ones[0]),
        theta: theta.concat(theta[0]),
        type: 'scatterpolar',
        mode: 'lines',
        showlegend: false,
        line: {color: '#333333', shape: 'spline'},
      }
    ];

    traces = trace_unitcircle.concat(traces)

    layout = $.extend({}, POLAR_LAYOUT);
    layout['polar']['angularaxis']['dtick'] = 360. / parseInt($('#spkNum').val());
    layout['height'] = 450;

    layout['polar']['radialaxis']['range'] = [0., 1.02*max_r_traces(traces)];

  } else if (plot_type == 'line') {

    // Apply options to each trace
    for (var t=0; t < traces.length; t++) {
      var tr = traces[t];

      tr['x'] = remap_theta(theta);
      tr['y'] = tr['def'];

      // Line options
      tr['type'] = 'scatter';
      tr['showlegend'] = true;
    }

    layout = $.extend({}, LINE_LAYOUT);
    layout['height'] = Math.min(0.9 * $('#plotDiv').width(), 450);
  }

  Plotly.newPlot(plot_canvas, traces, layout, {
    responsive: true,
    modeBarButtonsToRemove: ['sendDataToCloud', 'lasso2d', 'select2d'],
    displayModeBar: false,
    displaylogo: false
  });
}
