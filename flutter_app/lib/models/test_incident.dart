class TestIncident {
  final String id;
  final double lat;
  final double lng;
  final String neighborhood;
  final String food;
  final String testType;
  final String status; // "pass" or "fail"
  final String adulterant;
  final String vendorType;
  final String timestamp;
  final DateTime date;

  TestIncident({
    required this.id,
    required this.lat,
    required this.lng,
    required this.neighborhood,
    required this.food,
    required this.testType,
    required this.status,
    required this.adulterant,
    required this.vendorType,
    required this.timestamp,
    required this.date,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'lat': lat,
        'lng': lng,
        'neighborhood': neighborhood,
        'food': food,
        'testType': testType,
        'status': status,
        'adulterant': adulterant,
        'vendorType': vendorType,
        'timestamp': timestamp,
        'date': date.toIso8601String(),
      };

  factory TestIncident.fromJson(Map<String, dynamic> json) => TestIncident(
        id: json['id'] as String,
        lat: (json['lat'] as num).toDouble(),
        lng: (json['lng'] as num).toDouble(),
        neighborhood: json['neighborhood'] as String,
        food: json['food'] as String,
        testType: json['testType'] as String,
        status: json['status'] as String,
        adulterant: json['adulterant'] as String,
        vendorType: json['vendorType'] as String? ?? 'Local Vendor',
        timestamp: json['timestamp'] as String? ?? 'Recent',
        date: DateTime.tryParse(json['date'] as String? ?? '') ?? DateTime.now(),
      );
}

final List<TestIncident> kInitialIncidents = [
  TestIncident(
    id: 'inc_1',
    lat: 21.1738,
    lng: 72.8028,
    neighborhood: 'Athwa Lines, Surat',
    food: 'Milk & Dairy',
    testType: 'Milk Starch Test',
    status: 'fail',
    adulterant: 'Added Starch & Potato Flour',
    vendorType: 'Local Loose Milk Vendor',
    timestamp: '10 mins ago',
    date: DateTime.now().subtract(const Duration(minutes: 10)),
  ),
  TestIncident(
    id: 'inc_2',
    lat: 21.1959,
    lng: 72.7758,
    neighborhood: 'Pal, Surat',
    food: 'Turmeric Powder',
    testType: 'Turmeric Metanil Yellow Test',
    status: 'pass',
    adulterant: 'None detected',
    vendorType: 'Supermarket Brand Packet',
    timestamp: '1 hour ago',
    date: DateTime.now().subtract(const Duration(hours: 1)),
  ),
  TestIncident(
    id: 'inc_3',
    lat: 21.1882,
    lng: 72.7933,
    neighborhood: 'Adajan, Surat',
    food: 'Red Chili Powder',
    testType: 'Chili Powder Brick Dust Test',
    status: 'fail',
    adulterant: 'Heavy Brick Dust & Grit',
    vendorType: 'Street Market Bazaar',
    timestamp: '2 hours ago',
    date: DateTime.now().subtract(const Duration(hours: 2)),
  ),
  TestIncident(
    id: 'inc_4',
    lat: 21.2035,
    lng: 72.8421,
    neighborhood: 'Varachha, Surat',
    food: 'Milk & Dairy',
    testType: 'Milk Starch Test',
    status: 'fail',
    adulterant: 'Added Starch & Detergent',
    vendorType: 'Local Loose Milk Vendor',
    timestamp: '4 hours ago',
    date: DateTime.now().subtract(const Duration(hours: 4)),
  ),
];
