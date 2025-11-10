/* --------------------------------------------------------------
   The QS Salary Index – Config (with UK & US regions)
   -------------------------------------------------------------- */
const CONFIG = {
  FORMSPREE_ENDPOINT: 'https://formspree.io/f/xnnlaqka',
  PENDING_URL: 'assets/data/pending.json',

  COUNTRIES: [
    'United Kingdom',
    'United States',
    'Australia',
    'Canada',
    'Ireland',
    'Other'
  ],

  // === UK: ENGLAND COUNTIES ===
  UK_COUNTIES: [
    'Bedfordshire','Berkshire','Bristol','Buckinghamshire','Cambridgeshire','Cheshire',
    'Cornwall','Cumbria','Derbyshire','Devon','Dorset','Durham','East Sussex','Essex',
    'Gloucestershire','Greater London','Greater Manchester','Hampshire','Hertfordshire',
    'Kent','Lancashire','Leicestershire','Lincolnshire','Merseyside','Norfolk',
    'North Yorkshire','Northamptonshire','Northumberland','Nottinghamshire',
    'Oxfordshire','Shropshire','Somerset','South Yorkshire','Staffordshire',
    'Suffolk','Surrey','Tyne and Wear','Warwickshire','West Midlands','West Sussex',
    'West Yorkshire','Wiltshire','Worcestershire'
  ].sort(),

  // === SCOTLAND: COUNCIL AREAS ===
  SCOTLAND_COUNCIL_AREAS: [
    'Aberdeen City','Aberdeenshire','Angus','Argyll and Bute','Clackmannanshire',
    'Dumfries and Galloway','Dundee City','East Ayrshire','East Dunbartonshire',
    'East Lothian','East Renfrewshire','Edinburgh','Eilean Siar','Falkirk',
    'Fife','Glasgow City','Highland','Inverclyde','Midlothian','Moray',
    'North Ayrshire','North Lanarkshire','Orkney Islands','Perth and Kinross',
    'Renfrewshire','Scottish Borders','Shetland Islands','South Ayrshire',
    'South Lanarkshire','Stirling','West Dunbartonshire','West Lothian'
  ].sort(),

  // === WALES: PRINCIPAL AREAS ===
  WALES_PRINCIPAL_AREAS: [
    'Blaenau Gwent','Bridgend','Caerphilly','Cardiff','Carmarthenshire','Ceredigion',
    'Conwy','Denbighshire','Flintshire','Gwynedd','Isle of Anglesey','Merthyr Tydfil',
    'Monmouthshire','Neath Port Talbot','Newport','Pembrokeshire','Powys',
    'Rhondda Cynon Taf','Swansea','Torfaen','Vale of Glamorgan','Wrexham'
  ].sort(),

  // === USA: STATES ===
  USA_STATES: [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
    'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
    'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
    'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
    'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
    'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
    'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
    'Wisconsin','Wyoming'
  ].sort()
};
