
$(document).ready(function() {
	$('#rimtable').DataTable( {
		paging: false,
		searching: false,
		info: false,
		data: Object.values(RIM_PRESETS),
		columns: [
			{ data: 'name'},
			{ data: 'size'},
			{ data: 'mass'},
			{ data: 'EIrad'},
			{ data: 'EIlat'},
			{ data: 'GJ'},
			{ data: 'Notes'},
			{ data: 'Credit'}
		]
	} );
} );
