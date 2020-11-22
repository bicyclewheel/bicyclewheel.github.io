var RIM_MATLS = {
  'Alloy': {
    'density': 2700,
    'young_mod': 69e9,
    'shear_mod': 26e9
  },
  'Steel': {
    'density': 8000,
    'young_mod': 200e9,
    'shear_mod': 77e9
  }
};

var SPK_MATLS = {
  'Alloy': {
    'density': 2700,
    'young_mod': 69e9,
  },
  'Steel': {
    'density': 8000,
    'young_mod': 210e9,
  },
  'Titanium': {
    'density': 4500,
    'young_mod': 105e9
  }
};

var RIM_SIZES = [
  '700C/29er (622)',
  '27-inch frac. (630)',
  '650B (584)',
  '26-inch dec. (559)',
  '26-inch x 1 3/8 (590)',
  '16-inch (349)',
  '20-inch dec. (406)',
  '24-inch dec. (507)',
  '36-inch (787)',
  '48-inch high-wheel (610)',
  '52-inch high-wheel (660)'
];

var RIM_PRESETS = {
  'Alex ALX-295': {
    'name': 'Alex ALX-295',
    'matl': 'Alloy',
    'size': '700C/29er (622)',
    'mass': 480,
    'EIrad': 310,
    'EIlat': 210,
    'GJ': 85,
    'Credit': '',
    'Notes': ''
  },
  'Alex X404 27-inch': {
    'name': 'Alex X404 27-inch',
    'matl': 'Alloy',
    'size': '27-inch frac. (630)',
    'mass': 595,
    'EIrad': 130,
    'EIlat': 150,
    'GJ': 15,
    'Credit': '',
    'Notes': ''
  },
  'Alex Y2000 26-inch': {
    'name': 'Alex Y2000 26-inch',
    'matl': 'Alloy',
    'size': '26-inch dec. (559)',
    'mass': 460,
    'EIrad': 110,
    'EIlat': 130,
    'GJ': 15,
    'Credit': '',
    'Notes': ''
  },
  'Alex Y2000 700C': {
    'name': 'Alex Y2000 700C',
    'matl': 'Alloy',
    'size': '700C/29er (622)',
    'mass': 550,
    'EIrad': 125,
    'EIlat': 160,
    'GJ': 20,
    'Credit': '',
    'Notes': '',
  },
  'DT Swiss R460': {
    'name': 'DT Swiss R460',
    'matl': 'Alloy',
    'size': '700C/29er (622)',
    'mass': 460,
    'EIrad': 280,
    'EIlat': 230,
    'GJ': 100,
    'Credit': '',
    'Notes': ''
  },
  'DT Swiss TK540': {
    'name': 'DT Swiss TK540',
    'matl': 'Alloy',
    'size': '700C/29er (622)',
    'mass': 550,
    'EIrad': 211,
    'EIlat': 260,
    'GJ': 75,
    'Credit': '',
    'Notes': ''
  },
  'H Plus Son TB14': {
    'name': 'H Plus Son TB14',
    'matl': 'Alloy',
    'size': '700C/29er (622)',
    'mass': 490,
    'EIrad': 89,
    'EIlat': 224,
    'GJ': 32,
    'Credit': '',
    'Notes': '[1]'
  },
  'Mavic A119 32-h': {
    'name': 'Mavic A119 32-h',
    'matl': 'Alloy',
    'size': '700C/29er (622)',
    'mass': 540,
    'EIrad': 140,
    'EIlat': 232,
    'GJ': 44,
    'Credit': '',
    'Notes': ''
  },
  "Stan's Grail MK3 24-h": {
    'name': "Stan's Grail MK3 24-h",
    'matl': 'Alloy',
    'size': '700C/29er (622)',
    'mass': 440,
    'EIrad': 330,
    'EIlat': 230,
    'GJ': 190,
    'Credit': '[GE]',
    'Notes': '[1]'
  },
  'Sun-Ringle CR18 700C, 36h': {
    'name': 'Sun-Ringle CR18 700C, 36h',
    'matl': 'Alloy',
    'size': '700C/29er (622)',
    'mass': 540,
    'EIrad': 110,
    'EIlat': 220,
    'GJ': 25,
    'Credit': '',
    'Notes': ''
  },
  'Sun-Ringle CR18 20-inch': {
    'name': 'Sun-Ringle CR18 20-inch',
    'matl': 'Alloy',
    'size': '20-inch dec. (406)',
    'mass': 380,
    'EIrad': 100,
    'EIlat': 150,
    'GJ': 25,
    'Credit': '',
    'Notes': ''
  },
};

var FORCE_TYPES = ['Radial', 'Lateral', 'Tangential'];

var FORCE_PRESETS = {
  'Weight of bike + rider': [
    {'dof': 'Radial', 'loc': 0, 'mag': 50}
  ],
  'Pedaling torque': [
    {'dof': 'Tangential', 'loc': 0, 'mag': 15}
  ],
  'Rim braking': [
    {'dof': 'Tangential', 'loc': 0, 'mag': -15},
    {'dof': 'Tangential', 'loc': 180, 'mag': 15}
  ],
  'Disc braking': [
    {'dof': 'Tangential', 'loc': 0, 'mag': -15}
  ],
  'Side force': [
    {'dof': 'Lateral', 'loc': 0, 'mag': 15}
  ]
};
