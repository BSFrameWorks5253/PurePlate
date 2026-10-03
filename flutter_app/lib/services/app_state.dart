import 'package:flutter/foundation.dart';
import '../models/food_protocol.dart';
import '../models/test_incident.dart';

class AppState extends ChangeNotifier {
  List<TestIncident> _incidents = List.from(kInitialIncidents);
  int _userPoints = 420;
  String _userRegion = 'Athwa, Surat';
  List<String> _badges = ['detective', 'milk_master', 'spice_sleuth'];
  FoodProtocol _selectedProtocol = kDefaultProtocols[0];

  List<TestIncident> get incidents => _incidents;
  int get userPoints => _userPoints;
  String get userRegion => _userRegion;
  List<String> get badges => _badges;
  FoodProtocol get selectedProtocol => _selectedProtocol;

  void setSelectedProtocol(FoodProtocol protocol) {
    _selectedProtocol = protocol;
    notifyListeners();
  }

  void setUserRegion(String region) {
    _userRegion = region;
    notifyListeners();
  }

  void addIncident(TestIncident incident) {
    _incidents.insert(0, incident);
    _userPoints += 50;
    notifyListeners();
  }

  void addPoints(int amount) {
    _userPoints += amount;
    notifyListeners();
  }

  void unlockBadge(String badgeKey) {
    if (!_badges.contains(badgeKey)) {
      _badges.add(badgeKey);
      _userPoints += 100;
      notifyListeners();
    }
  }
}
