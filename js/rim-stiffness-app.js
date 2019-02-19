
var ctx;
var buffer;



$(function() {
  console.log('JQuery enabled');

  // Create audio context
  ctx = new AudioContext();

  $('#recordRadial').click(function() {
    console.log('clicked');
    $(this).addClass('btn-danger');
    // $(this).removeClass('btn-success');
  });
})
